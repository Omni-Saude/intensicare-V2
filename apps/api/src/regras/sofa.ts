/**
 * apps/api/src/regras/sofa.ts — provedor do RULE-SOFA 0.2.0 para o
 * despachante (terceira via; achado §6.4, P1).
 *
 * Este módulo NÃO avalia sozinho: apresenta ao despachante o avaliador real
 * do kernel (`evaluateSofa` do `@intensicare/kernel-clinico`) e o artefato
 * de regra que o governa. Nenhum limiar, janela, banda, piso ou vetor é
 * tocado aqui.
 *
 * DIFERENÇA DELIBERADA vs NEWS2/GCS (registrada, não escondida): o insumo
 * do SOFA é a ENTRADA TIPADA DO KERNEL (`SofaEvaluationInput`), não
 * `ClinicalObservationRow[]`. O SOFA exige insumos que não são observações
 * pontuais de laboratório/sinal vital — taxa de vasopressor com duração
 * sustentada, intervalo explícito de débito urinário de 24 h, estado de
 * suporte respiratório, RASS pareado e exposição sedativa documentada —
 * que o modelo de observações persistidas não representa. Inventar uma
 * tradução ClinicalObservationRow → SOFA aqui seria fabricar um modelo de
 * dados de medicação/dispositivo que não existe neste repositório
 * (compatibility-finding §3: zero fontes populadas). A fiação de ingestão
 * é trabalho próprio de um stream de ingestão, com sua própria evidência;
 * este provedor mantém a via AVALIÁVEL (o kernel real executa o corpus
 * inteiro) e o despacho BLOQUEADO — nada se torna acionável por aqui.
 *
 * O `behaviorHash` é a mesma resposta ao defeito SF-2 do NEWS2/GCS: antes
 * de qualquer avaliação, `computeSofaBehaviorHash` recomputa o comportamento
 * do motor em execução sobre o test pack e compara com o hash pinado no
 * manifesto. Divergência ⇒ recusa fail-closed (QAS-0011).
 */
import type { SofaEvaluationInput, SofaEvaluationRecord } from "@intensicare/kernel-clinico";
import { evaluateSofa, SOFA_RULE_ID, SOFA_RULE_VERSION } from "@intensicare/kernel-clinico";
import {
  buildSofaBundleManifest,
  computeSofaBehaviorHash,
  contentDigest,
  parseSofaTestPack,
  type RuleBundleManifest,
  type SofaTestVector,
} from "@intensicare/rule-bundle";
import type { PortaDeBundle } from "./bundle.js";
import type { ProvedorDeRegra, VerificacaoDeMotor } from "./registro.js";
import {
  chaveRegra,
  type DigestDeEntradas,
  type IdentidadeRegra,
  type ProvenienciaBundle,
} from "./tipos.js";

/** Identidade versionada da regra, tomada do kernel — nunca redigitada. */
export const IDENTIDADE_SOFA: IdentidadeRegra = {
  ruleId: SOFA_RULE_ID,
  ruleVersion: SOFA_RULE_VERSION,
};

/** Chave de registro do SOFA: `RULE-SOFA@0.2.0`. */
export const CHAVE_SOFA = chaveRegra(IDENTIDADE_SOFA);

/** Insumo do provedor: a entrada tipada do kernel, sem tradução. */
export type InsumoSofa = SofaEvaluationInput;

/** Saída do provedor: o registro do kernel, sem contrato HTTP (shadow only). */
export interface SaidaSofa {
  readonly registroKernel: SofaEvaluationRecord;
}

/**
 * Monta manifesto + vetores do SOFA a partir do JSON de vetores publicado.
 * Puro: quem tem o texto decide de onde ele veio (mesma disciplina de
 * `montarManifestoNews2`, que de propósito não faz I/O).
 */
export function montarManifestoSofa(opcoes: {
  readonly jsonDeVetores: string;
  readonly authoredAt: string;
  readonly setId?: string;
  readonly standard?: string;
}): { readonly manifesto: RuleBundleManifest; readonly vetores: readonly SofaTestVector[] } {
  const testPack = parseSofaTestPack(opcoes.jsonDeVetores, {
    setId: opcoes.setId ?? "RULE-SOFA-CRV-SET",
    standard:
      opcoes.standard ??
      "docs/12-quality-validation-and-testing/clinical-reference-vector-standard.md",
  });
  return {
    manifesto: buildSofaBundleManifest({ testPack, authoredAt: opcoes.authoredAt }),
    vetores: testPack.vectors,
  };
}

/**
 * Projeção canônica das entradas para o registro imutável. Só campos de
 * forma, unidade e tempo — o digest não é reversível e nenhum identificador
 * de sujeito entra nele.
 */
function projetarEntradas(insumo: InsumoSofa): unknown {
  const quantidade = (q: {
    value: number;
    unit: string;
    effectiveTime: string | null;
  }): unknown => ({ value: q.value, unit: q.unit, effectiveTime: q.effectiveTime });
  return {
    idadeConhecida: insumo.age.kind === "verified",
    pao2: (insumo.pao2 ?? []).map(quantidade),
    fio2: (insumo.fio2 ?? []).map(quantidade),
    suporteRespiratorio: insumo.respiratorySupportStatus
      ? {
          value: insumo.respiratorySupportStatus.value,
          effectiveTime: insumo.respiratorySupportStatus.effectiveTime,
        }
      : null,
    plaquetas: (insumo.platelets ?? []).map(quantidade),
    bilirrubina: (insumo.bilirubin ?? []).map(quantidade),
    pam:
      insumo.map === undefined || insumo.map === null
        ? null
        : insumo.map.kind === "measured"
          ? {
              kind: "measured",
              value: insumo.map.value,
              unit: insumo.map.unit,
              effectiveTime: insumo.map.effectiveTime,
            }
          : {
              kind: "derivedFromSbpDbp",
              sbp: quantidade(insumo.map.sbp),
              dbp: quantidade(insumo.map.dbp),
            },
    vasoativos: (insumo.vasoactiveAgents ?? []).map((a) => ({
      agent: a.agent,
      dosePresente: a.dose !== null,
      dose: a.dose === null ? null : { value: a.dose.value, unit: a.dose.unit },
      sustainedMinutes: a.sustainedMinutes,
      lastConfirmedAt: a.lastConfirmedAt,
    })),
    gcsPresente: insumo.gcsTotal !== undefined && insumo.gcsTotal !== null,
    gcs: insumo.gcsTotal ? quantidade(insumo.gcsTotal) : null,
    rassPresente: insumo.rass !== undefined && insumo.rass !== null,
    rass: insumo.rass
      ? { value: insumo.rass.value, effectiveTime: insumo.rass.effectiveTime }
      : null,
    exposicaoSedativa: insumo.sedativeExposure,
    creatinina: (insumo.creatinine ?? []).map(quantidade),
    debitoUrinario: insumo.urineOutput24h
      ? {
          value: insumo.urineOutput24h.value,
          unit: insumo.urineOutput24h.unit,
          intervalStart: insumo.urineOutput24h.intervalStart,
          intervalEnd: insumo.urineOutput24h.intervalEnd,
        }
      : null,
    emTsr: insumo.onRenalReplacementTherapy === true,
    ecmo: insumo.ecmo === true,
    limitacaoTerapeutica: insumo.treatmentLimitationOrderDocumented === true,
  };
}

export function digestDeEntradasSofa(insumo: InsumoSofa): DigestDeEntradas {
  return {
    total:
      (insumo.pao2?.length ?? 0) +
      (insumo.fio2?.length ?? 0) +
      (insumo.platelets?.length ?? 0) +
      (insumo.bilirubin?.length ?? 0) +
      (insumo.creatinine?.length ?? 0) +
      (insumo.vasoactiveAgents?.length ?? 0) +
      (insumo.gcsTotal ? 1 : 0) +
      (insumo.map ? 1 : 0) +
      (insumo.urineOutput24h ? 1 : 0),
    digest: contentDigest(projetarEntradas(insumo)),
  };
}

/**
 * Cria o provedor do SOFA. Os vetores são opcionais na assinatura porque a
 * porta pode ser `bundle_ausente`; quando há artefato com `behaviorHash`
 * pinado e os vetores NÃO foram fornecidos, `verificarMotor` RECUSA
 * (fail-closed): motor não verificado nunca avalia.
 */
export function criarProvedorSofa(opcoes: {
  readonly porta: PortaDeBundle;
  readonly vetores?: readonly SofaTestVector[] | undefined;
}): ProvedorDeRegra<InsumoSofa, SaidaSofa> {
  const { porta, vetores } = opcoes;

  return {
    identidade: IDENTIDADE_SOFA,
    porta,

    verificarMotor(proveniencia: ProvenienciaBundle): VerificacaoDeMotor {
      const esperado = proveniencia.behaviorHash;
      if (esperado === null) {
        return {
          ok: false,
          esperado: "<ausente no artefato>",
          obtido: "<não verificável sem hash pinado>",
        };
      }
      if (vetores === undefined) {
        return { ok: false, esperado, obtido: "<vetores do test pack não fornecidos>" };
      }
      const obtido = computeSofaBehaviorHash(vetores);
      return obtido === esperado
        ? { ok: true, behaviorHash: obtido }
        : { ok: false, esperado, obtido };
    },

    digestDeEntradas: digestDeEntradasSofa,

    avaliar(insumo: InsumoSofa, _instanteIso: string): SaidaSofa {
      // Todo tempo clínico já vive DENTRO do insumo do kernel (janelas de
      // frescor, pareamentos, intervalos); o instante de despacho não entra
      // no cálculo — mesma disciplina de injeção de tempo do kernel.
      return { registroKernel: evaluateSofa(insumo) };
    },

    razoesDe(saida: SaidaSofa): readonly string[] {
      return saida.registroKernel.reasons;
    },
  };
}
