/**
 * apps/api/src/regras/news2.ts — provedor do RULE-NEWS2 0.2.0 para o
 * despachante (achado §6.4, P1).
 *
 * Este módulo NÃO avalia: ele apresenta ao despachante o avaliador real que
 * já existe em `apps/api/src/avaliacao.ts` (`evaluateEncounter` →
 * `evaluateNews2` do kernel) e o artefato de regra que o governa. Nenhum
 * limiar, janela, banda ou vetor é tocado aqui.
 *
 * O `behaviorHash` é a resposta ao defeito SF-2 do legado (uma inversão de
 * comportamento sobreviveu com a string de versão intacta): antes de
 * qualquer avaliação, `computeNews2BehaviorHash` recomputa o comportamento
 * do motor em execução sobre o test pack e o compara com o hash pinado no
 * manifesto. Divergência ⇒ recusa fail-closed (QAS-0011).
 */
import type { ContextoAvaliacaoPaciente, ResultadoAvaliacao } from "@intensicare/contratos";
import {
  type EvaluationRecord,
  NEWS2_RULE_ID,
  NEWS2_RULE_VERSION,
} from "@intensicare/kernel-clinico";
import type { ClinicalObservationRow } from "@intensicare/persistencia";
import {
  buildNews2BundleManifest,
  computeNews2BehaviorHash,
  contentDigest,
  type News2TestVector,
  parseNews2TestPack,
  type RuleBundleManifest,
} from "@intensicare/rule-bundle";
import { type EstadoAnteriorNews2, evaluateEncounter, toResultadoAvaliacao } from "../avaliacao.js";
import type { PortaDeBundle } from "./bundle.js";
import type { ProvedorDeRegra, VerificacaoDeMotor } from "./registro.js";
import {
  chaveRegra,
  type DigestDeEntradas,
  type IdentidadeRegra,
  type ProvenienciaBundle,
  type RegistroDeAvaliacao,
} from "./tipos.js";

/** Identidade versionada da regra, tomada do kernel — nunca redigitada. */
export const IDENTIDADE_NEWS2: IdentidadeRegra = {
  ruleId: NEWS2_RULE_ID,
  ruleVersion: NEWS2_RULE_VERSION,
};

/** Chave de registro do NEWS2: `RULE-NEWS2@0.2.0`. */
export const CHAVE_NEWS2 = chaveRegra(IDENTIDADE_NEWS2);

export interface InsumoNews2 {
  readonly observacoes: readonly ClinicalObservationRow[];
  readonly contexto: ContextoAvaliacaoPaciente | undefined;
  /**
   * Estado anterior da série do paciente (`news2_prev`) para o gatilho de
   * borda do alerta de deterioração (catálogo irmão
   * ALERT-EWS-NEWS2-DETERIORATION-01; CRIT-1). Ausente ⇒ estado anterior
   * desconhecido — o kernel arma o gatilho (premissa reversível
   * documentada). Não é dado clínico novo: é MEMÓRIA da mesma regra, lida
   * em-transação pelo chamador.
   */
  readonly estadoAnterior?: EstadoAnteriorNews2 | undefined;
}

/**
 * Saída do provedor: o registro do kernel (necessário para `requerAlerta` e
 * `fires`, cuja semântica consultiva permanece INALTERADA) e a tradução
 * pt-BR do contrato.
 */
export interface SaidaNews2 {
  readonly registroKernel: EvaluationRecord;
  readonly resultado: ResultadoAvaliacao;
}

/**
 * Monta manifesto + vetores do NEWS2 a partir do JSON de vetores publicado.
 * Puro: quem tem o texto decide de onde ele veio (mesma disciplina de
 * `parseNews2TestPack`, que de propósito não faz I/O).
 */
export function montarManifestoNews2(opcoes: {
  readonly jsonDeVetores: string;
  readonly authoredAt: string;
  readonly setId?: string;
  readonly standard?: string;
}): { readonly manifesto: RuleBundleManifest; readonly vetores: readonly News2TestVector[] } {
  const testPack = parseNews2TestPack(opcoes.jsonDeVetores, {
    setId: opcoes.setId ?? "RULE-NEWS2-CRV-SET",
    standard:
      opcoes.standard ??
      "docs/12-quality-validation-and-testing/clinical-reference-vector-standard.md",
  });
  return {
    manifesto: buildNews2BundleManifest({ testPack, authoredAt: opcoes.authoredAt }),
    vetores: testPack.vectors,
  };
}

/**
 * Projeção canônica das entradas para o registro imutável. Só campos de
 * forma e qualidade — o digest não é reversível e nenhum identificador de
 * sujeito entra nele.
 */
function projetarEntradas(observacoes: readonly ClinicalObservationRow[]): unknown {
  return observacoes.map((linha) => ({
    concept: linha.concept,
    sourceValue: linha.sourceValue,
    sourceUnit: linha.sourceUnit,
    sourceCode: linha.sourceCode,
    canonicalValue: linha.canonicalValue,
    canonicalUnit: linha.canonicalUnit,
    quality: linha.quality,
    effectiveAt: linha.effectiveAt.kind === "present" ? linha.effectiveAt.instant.utc : null,
  }));
}

export function digestDeEntradasNews2(insumo: InsumoNews2): DigestDeEntradas {
  return {
    total: insumo.observacoes.length,
    digest: contentDigest({
      observacoes: projetarEntradas(insumo.observacoes),
      idadeConhecida: typeof insumo.contexto?.idadeAnos === "number",
      gravidezDocumentada: insumo.contexto?.gravidezDocumentada === true,
      // O estado anterior participa do digest por FORMA (não por valor —
      // nenhum identificador de sujeito entra no digest): o veredito de
      // borda depende dele, e o registro imutável do despacho precisa
      // distinguir despachos com e sem memória.
      estadoAnteriorPresente: insumo.estadoAnterior !== undefined,
      totalAnteriorConhecido: insumo.estadoAnterior?.totalScore != null,
      vermelhosAnteriores: insumo.estadoAnterior?.redParameters.length ?? 0,
    }),
  };
}

/**
 * Cria o provedor do NEWS2. Os vetores são opcionais na assinatura porque a
 * porta pode ser `bundle_ausente`; quando há artefato com `behaviorHash`
 * pinado e os vetores NÃO foram fornecidos, `verificarMotor` RECUSA
 * (fail-closed): motor não verificado nunca avalia.
 */
export function criarProvedorNews2(opcoes: {
  readonly porta: PortaDeBundle;
  readonly vetores?: readonly News2TestVector[] | undefined;
}): ProvedorDeRegra<InsumoNews2, SaidaNews2> {
  const { porta, vetores } = opcoes;

  return {
    identidade: IDENTIDADE_NEWS2,
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
      const obtido = computeNews2BehaviorHash(vetores);
      return obtido === esperado
        ? { ok: true, behaviorHash: obtido }
        : { ok: false, esperado, obtido };
    },

    digestDeEntradas: digestDeEntradasNews2,

    avaliar(insumo: InsumoNews2, instanteIso: string): SaidaNews2 {
      const registroKernel = evaluateEncounter(
        insumo.observacoes,
        insumo.contexto,
        instanteIso,
        insumo.estadoAnterior,
      );
      return { registroKernel, resultado: toResultadoAvaliacao(registroKernel) };
    },

    razoesDe(saida: SaidaNews2): readonly string[] {
      return saida.registroKernel.reasons;
    },
  };
}

/**
 * `ResultadoAvaliacao` de uma RECUSA de despacho, para a rota poder
 * responder sem inventar avaliação. Preserva HAZ-0005 sem exceção: escore
 * `null` (jamais `0`), banda `null`, status não-válido.
 */
export function resultadoNaoAvaliadoNews2(registro: RegistroDeAvaliacao): ResultadoAvaliacao {
  const mensagem = registro.mensagemRecusaPt ?? registro.rotuloPt;
  return {
    status: "indisponivel",
    parametrosAusentes: [],
    parametros: [],
    escore: null,
    banda: null,
    avaliadoEm: registro.despachadoEm,
    motivos: [...registro.razoes],
    anotacoes: [registro.rotuloPt, mensagem],
    explicacao: mensagem,
    parametroVermelho: false,
    versaoRegra: registro.chaveRegra,
  };
}
