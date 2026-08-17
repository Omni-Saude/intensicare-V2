/**
 * apps/api/src/composicao/regras.ts — composição do REGISTRO DE REGRAS do
 * processo, a partir da configuração de runtime validada.
 *
 * O QUE ESTE ARQUIVO DECIDE: nada de clínico. Ele apenas resolve DE ONDE vem o
 * artefato que governa cada regra, e injeta os vetores de referência que o
 * despachante exige para conferir o `behaviorHash` do motor em execução.
 * Nenhum limiar, banda, janela, vetor ou texto clínico normativo é escrito,
 * alterado ou reinterpretado aqui — os vetores são LIDOS da cópia de
 * referência publicada pelo kernel, byte a byte.
 *
 * POR QUE OS VETORES ENTRAM POR INJEÇÃO (ADR-0007). Os vetores de referência
 * são parte do ARTEFATO DE BUNDLE, não algo compilado dentro da API. O
 * provedor do NEWS2 (`../regras/news2.ts`) recusa fail-closed quando há
 * `behaviorHash` pinado e os vetores não foram fornecidos — `motor_divergente`,
 * com `obtido: "<vetores do test pack não fornecidos>"`. Portanto: ou a raiz de
 * composição entrega os vetores, ou não há avaliação. Motor não verificado
 * nunca avalia (QAS-0011).
 *
 * PERFIL SINTÉTICO × PERFIL ENDURECIDO
 * ------------------------------------
 * - `test`/`dev-synthetic`: manifesto montado LOCALMENTE a partir da cópia de
 *   referência do kernel, por `portaDeBundleNaoAssinado` — modo `sombra`
 *   obrigatório, bloqueio `assinatura_ausente_adr0007_c5` na proveniência, e
 *   `ehAcionavel` permanece `false` por construção. Nada aqui torna via
 *   clínica alguma acionável (0 vias acionáveis; 47/47 inelegíveis).
 * - perfis endurecidos: o artefato precisa vir de `IC_BUNDLE_REGRA_CAMINHO`
 *   com verificação de assinatura contra `IC_BUNDLE_REGRA_CHAVE_PUBLICA`. Esse
 *   carregador NÃO EXISTE neste repositório (ADR-0007 C5 aberta: nenhuma
 *   custódia de chave, nenhuma assinatura em CI). Em vez de inventá-lo, a
 *   composição instala uma porta que RECUSA com razão explícita. Sem artefato
 *   verificável não há despacho — e a recusa aparece na prontidão, não em
 *   silêncio.
 *
 * Rastreio: ADR-0007 (formato/assinatura/ativação/rollback, condição C5),
 * ADR-0008 §8.3 (`rule_unavailable` nunca é no-fire silencioso), QAS-0011.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { ClinicalRuleSwitchboard, RuleAvailability } from "@intensicare/observabilidade";
import type { News2TestVector, RuleBundleManifest } from "@intensicare/rule-bundle";
import type { ConfiguracaoRuntime } from "../config/index.js";
import {
  IDENTIDADE_GCS,
  IDENTIDADE_NEWS2,
  MOTIVO_GCS_SEM_BUNDLE,
  montarManifestoNews2,
  montarRegistroDeRegras,
  type PortaDeBundle,
  portaDeBundleAusente,
  portaDeBundleNaoAssinado,
  type RegistroDeRegras,
} from "../regras/index.js";

/**
 * Caminho da cópia de referência publicada pelo kernel. É a MESMA que
 * `apps/api/src/regras/registro.test.ts` consome, resolvida da mesma forma —
 * duas fontes divergentes de vetor seriam exatamente o defeito que o
 * `behaviorHash` existe para pegar.
 */
const CAMINHO_VETORES_NEWS2 = "../../../../packages/kernel-clinico/test/vetores-news2.json";

/**
 * Instante SENTINELA do manifesto montado localmente.
 *
 * Não é — e não pode ser lido como — um ato de autoria: montar um manifesto a
 * partir da cópia de referência não autora regra nenhuma. O artefato assinado
 * de verdade traz o seu próprio `authoredAt`, e chegará por
 * `IC_BUNDLE_REGRA_CAMINHO` quando ADR-0007 C5 fechar. A época Unix é
 * deliberadamente inconfundível com uma data real, para que ninguém a cite
 * como proveniência.
 */
export const INSTANTE_SENTINELA_DE_MANIFESTO_LOCAL = "1970-01-01T00:00:00.000Z";

export const MOTIVO_BUNDLE_ENDURECIDO_AUSENTE =
  "perfil endurecido exige bundle de regra assinado vindo de IC_BUNDLE_REGRA_CAMINHO, " +
  "verificado contra IC_BUNDLE_REGRA_CHAVE_PUBLICA; este repositório não implementa " +
  "carregamento nem verificação de bundle em disco (ADR-0007 C5 aberta: sem custódia " +
  "de chave, sem assinatura em CI). Sem artefato verificável não há despacho — fail-closed";

export const MOTIVO_VETORES_INDISPONIVEIS =
  "a cópia de referência dos vetores do RULE-NEWS2 não pôde ser lida; sem os vetores o " +
  "motor em execução não é verificável contra o behaviorHash pinado, e motor não " +
  "verificado nunca avalia (QAS-0011)";

/** Material do artefato local do NEWS2, quando ele pôde ser montado. */
export interface MaterialNews2 {
  readonly manifesto: RuleBundleManifest;
  readonly vetores: readonly News2TestVector[];
}

/**
 * Lê e monta o material do NEWS2 a partir da cópia de referência do kernel.
 * Devolve `null` — nunca lança — quando o arquivo não existe ou não é
 * interpretável: a ausência vira RECUSA de despacho, não exceção de boot.
 */
export function resolverMaterialNews2(): MaterialNews2 | null {
  let json: string;
  try {
    json = readFileSync(fileURLToPath(new URL(CAMINHO_VETORES_NEWS2, import.meta.url)), "utf8");
  } catch {
    return null;
  }
  try {
    return montarManifestoNews2({
      jsonDeVetores: json,
      authoredAt: INSTANTE_SENTINELA_DE_MANIFESTO_LOCAL,
    });
  } catch {
    return null;
  }
}

export interface OpcoesDeComposicaoDeRegras {
  readonly config: ConfiguracaoRuntime;
  /** Quadro de chaves de runtime da observabilidade (kill switch). Opcional. */
  readonly quadroDeChaves?: ClinicalRuleSwitchboard | undefined;
  /**
   * Material do NEWS2 já resolvido. Costura de injeção: quem tiver um artefato
   * verificado o entrega aqui, e a composição não vai ao disco.
   */
  readonly materialNews2?: MaterialNews2 | null | undefined;
}

/**
 * Registro composto + a leitura de disponibilidade que a prontidão consome.
 *
 * As duas coisas viajam juntas de propósito: `RegistroDeRegras` não expõe as
 * portas de bundle (por desenho — o despachante é a única coisa que as
 * consulta), e a prontidão precisa do estado do artefato. Quem MONTA o
 * registro é quem tem as portas em mãos, e é por isso que a leitura sai daqui.
 */
export interface RegrasCompostas {
  readonly registro: RegistroDeRegras;
  /** Estado de cada regra registrada, no instante consultado. */
  readonly disponibilidades: (instanteIso?: string) => readonly RuleAvailability[];
}

export function comporRegistroDeRegras(opcoes: OpcoesDeComposicaoDeRegras): RegrasCompostas {
  const { config } = opcoes;
  const sintetico = config.classePerfil === "sintetico";

  const material =
    opcoes.materialNews2 !== undefined
      ? opcoes.materialNews2
      : sintetico
        ? resolverMaterialNews2()
        : null;

  let portaNews2: PortaDeBundle;
  let vetoresNews2: readonly News2TestVector[] | undefined;

  if (!sintetico) {
    portaNews2 = portaDeBundleAusente(IDENTIDADE_NEWS2, MOTIVO_BUNDLE_ENDURECIDO_AUSENTE);
  } else if (material === null) {
    portaNews2 = portaDeBundleAusente(IDENTIDADE_NEWS2, MOTIVO_VETORES_INDISPONIVEIS);
  } else {
    portaNews2 = portaDeBundleNaoAssinado({
      identidade: IDENTIDADE_NEWS2,
      manifesto: material.manifesto,
      justificativaAdrC5:
        "Perfil sintético: manifesto montado a partir da cópia de referência do kernel, " +
        "SEM cadeia de assinatura (ADR-0007 C5 aberta — não há custódia de chave neste " +
        "repositório). Modo sombra obrigatório; a saída é consultiva, explicitamente " +
        "rotulada e NÃO acionável. Nenhuma via clínica se torna acionável por este caminho.",
    });
    vetoresNews2 = material.vetores;
  }

  // RULE-GCS permanece sem artefato: `rule-bundle` não constrói manifesto para
  // ele. Estado real do repositório, transcrito — não uma escolha desta fiação.
  const portaGcs = portaDeBundleAusente(IDENTIDADE_GCS, MOTIVO_GCS_SEM_BUNDLE);

  const registro = montarRegistroDeRegras({
    news2: { porta: portaNews2, vetores: vetoresNews2 },
    gcs: { porta: portaGcs },
    quadroDeChaves: opcoes.quadroDeChaves,
  });

  const portas: readonly PortaDeBundle[] = [portaNews2, portaGcs];

  return {
    registro,
    disponibilidades(instanteIso = new Date().toISOString()): readonly RuleAvailability[] {
      return portas.map((porta) => disponibilidadeDe(porta, instanteIso));
    },
  };
}

/**
 * Traduz o estado da porta de bundle para o vocabulário FECHADO de
 * `RuleAvailability` da observabilidade.
 *
 * Nenhuma recusa vira `active`: a regra R1 do avaliador de prontidão
 * (`packages/observabilidade/src/readiness.ts`) trata qualquer estado que não
 * seja `active`/`rolled_back` como `not_ready`, e é exatamente esse o retrato
 * honesto enquanto não houver artefato verificável (safety case M0).
 */
function disponibilidadeDe(porta: PortaDeBundle, instanteIso: string): RuleAvailability {
  const bundle = {
    ruleId: porta.identidade.ruleId,
    ruleVersion: porta.identidade.ruleVersion,
  };
  const estado = porta.estadoEm(instanteIso);
  if (estado.tipo === "disponivel") {
    return { kind: "active", bundle };
  }
  // `bundle_ausente`/`regra_nao_ativada`: não existe artefato a carregar —
  // `unknown` é o rótulo exato ("nunca ativada em runtime"). Os demais motivos
  // descrevem um artefato que existe e não pôde governar: `load_failed`.
  if (estado.motivo === "bundle_ausente" || estado.motivo === "regra_nao_ativada") {
    return { kind: "unknown", ruleId: porta.identidade.ruleId };
  }
  return { kind: "load_failed", bundle, sinceMs: 0 };
}
