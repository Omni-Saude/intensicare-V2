/**
 * apps/api/src/regras/bundle.ts — ADAPTADOR do `@intensicare/rule-bundle`
 * para o despachante de regras (achado §6.4, P1).
 *
 * Este módulo NÃO reimplementa criptografia, verificação de assinatura,
 * política de prontidão nem ciclo de vida de ativação: tudo isso é
 * `verifyBundle`, `assessActivationReadiness` e `RuleActivationLedger` do
 * pacote `rule-bundle` (ADR-0007). Aqui há apenas a TRADUÇÃO do estado
 * daquele pacote para o vocabulário de despacho de `./tipos.js`.
 *
 * PREMISSA (reversível, ADR-0007 §1.4 e condição C5, ABERTA): não existe
 * custódia de chave neste repositório — nenhuma chave privada, nenhum
 * HSM/KMS, nenhuma assinatura em CI. Logo, no caminho de produção o
 * artefato de regra chega SEM cadeia de assinatura. Esse estado é
 * representado EXPLICITAMENTE por `portaDeBundleNaoAssinado`, que exige
 * justificativa escrita, força modo `sombra` e acrescenta o bloqueio
 * `assinatura_ausente_adr0007_c5` à proveniência. Ele nunca é o default e
 * jamais produz saída acionável (`ehAcionavel` exige assinatura verificada).
 *
 * PREMISSA (reversível, ADR-0007 eixo 5): há DUAS primitivas distintas de
 * desligamento no repositório — o kill switch do livro-razão
 * (`RuleActivationLedger.killSwitch`, que é o registro de autoridade
 * append-only) e o quadro de chaves de runtime da observabilidade
 * (`createClinicalRuleSwitchboard`, que produz o aviso pt-BR de degradação
 * e a telemetria). Este adaptador honra a primeira; o despachante honra as
 * duas, em UNIÃO fail-closed: qualquer uma desligada recusa a avaliação.
 */
import {
  type ActivationBlocker,
  type ApprovedBundle,
  assessActivationReadiness,
  type Keyring,
  type RegisteredBundle,
  type RuleActivationLedger,
  type RuleBundleManifest,
  verifyBundle,
} from "@intensicare/rule-bundle";
import {
  chaveRegra,
  type EstadoAssinatura,
  type IdentidadeRegra,
  type ModoDespacho,
  type MotivoRecusa,
  type ProvenienciaBundle,
} from "./tipos.js";

/** Bloqueio sintético que marca a ausência de cadeia de assinatura. */
export const BLOQUEIO_ASSINATURA_AUSENTE = "assinatura_ausente_adr0007_c5";

/** Estado do artefato de regra no instante consultado. */
export type EstadoDeBundle =
  | {
      readonly tipo: "disponivel";
      readonly modo: ModoDespacho;
      readonly proveniencia: ProvenienciaBundle;
    }
  | {
      readonly tipo: "recusado";
      readonly motivo: MotivoRecusa;
      readonly detalhes: readonly string[];
      readonly proveniencia: ProvenienciaBundle;
    };

/**
 * Porta de bundle: a única fonte do estado do artefato para o despachante.
 * Recebe o instante por parâmetro — sem relógio interno, mesma disciplina
 * do kernel e do livro-razão.
 */
export interface PortaDeBundle {
  readonly identidade: IdentidadeRegra;
  estadoEm(instanteIso: string): EstadoDeBundle;
}

function provenienciaVazia(assinatura: EstadoAssinatura): ProvenienciaBundle {
  return {
    versaoBundle: null,
    digestManifesto: null,
    behaviorHash: null,
    assinatura,
    autorKeyId: null,
    aprovadorKeyId: null,
    bloqueiosDeAtivacao: [],
    ativoDesde: null,
  };
}

/**
 * Porta para regra SEM artefato de bundle no repositório. Recusa sempre,
 * com razão explícita — jamais degrada para "avalia mesmo assim".
 * É o estado do RULE-GCS 0.2.0 hoje: `packages/rule-bundle` só constrói
 * manifesto do NEWS2 (`buildNews2BundleManifest`); não há
 * `buildGcsBundleManifest`, e montá-lo exigiria declarar uso pretendido,
 * evidência, responsabilidade e estado de validação — conteúdo normativo
 * clínico/de governança que este serviço não tem autoridade para redigir.
 */
export function portaDeBundleAusente(identidade: IdentidadeRegra, detalhe: string): PortaDeBundle {
  const proveniencia = provenienciaVazia("sem_bundle");
  const estado: EstadoDeBundle = {
    tipo: "recusado",
    motivo: "bundle_ausente",
    detalhes: [detalhe],
    proveniencia,
  };
  return {
    identidade,
    estadoEm: () => estado,
  };
}

/**
 * Porta para manifesto REAL porém SEM cadeia de assinatura (ADR-0007 C5
 * aberta). Sempre `sombra`. A justificativa é obrigatória e viaja no
 * registro imutável, para que este caminho nunca seja silencioso.
 */
export function portaDeBundleNaoAssinado(opcoes: {
  readonly identidade: IdentidadeRegra;
  readonly manifesto: RuleBundleManifest;
  readonly justificativaAdrC5: string;
}): PortaDeBundle {
  const { identidade, manifesto, justificativaAdrC5 } = opcoes;
  if (justificativaAdrC5.trim().length === 0) {
    throw new Error(
      "porta de bundle não assinado exige justificativa escrita (ADR-0007 C5): " +
        "avaliar sobre artefato sem cadeia de assinatura nunca pode ser um caminho silencioso",
    );
  }
  if (manifesto.bundleId !== chaveRegra(identidade)) {
    throw new Error(
      `porta de bundle: manifesto "${manifesto.bundleId}" não corresponde à identidade "${chaveRegra(identidade)}"`,
    );
  }

  const bloqueios = [
    BLOQUEIO_ASSINATURA_AUSENTE,
    ...assessActivationReadiness(manifesto).map((b: ActivationBlocker) => b.code),
  ];
  const proveniencia: ProvenienciaBundle = {
    versaoBundle: manifesto.identity.ruleVersion,
    digestManifesto: null,
    behaviorHash: manifesto.logic.behaviorHash,
    assinatura: "assinatura_ausente",
    autorKeyId: null,
    aprovadorKeyId: null,
    bloqueiosDeAtivacao: bloqueios,
    ativoDesde: manifesto.authoredAt,
  };
  const estado: EstadoDeBundle = {
    tipo: "disponivel",
    modo: "sombra",
    proveniencia,
  };
  return { identidade, estadoEm: () => estado };
}

/** Resultado da admissão de um bundle aprovado no livro-razão. */
export type ResultadoRegistroDeBundle =
  | { readonly ok: true; readonly registrado: RegisteredBundle }
  | { readonly ok: false; readonly falhas: readonly string[] };

/**
 * Admite um bundle aprovado no livro-razão, fail-closed. A verificação
 * criptográfica é do `rule-bundle` (`verifyBundle`); aqui só se converte a
 * exceção/​falha em resultado tipado, para que assinatura adulterada ou
 * chave desconhecida sejam RECUSA e não exceção não tratada.
 */
export function registrarBundleAprovado(
  livro: RuleActivationLedger,
  bundle: ApprovedBundle,
  chaveiro: Keyring,
): ResultadoRegistroDeBundle {
  const verificacao = verifyBundle(bundle, chaveiro);
  if (!verificacao.ok) {
    return {
      ok: false,
      falhas: verificacao.failures.map((f) => `${f.code}: ${f.detail}`),
    };
  }
  try {
    return { ok: true, registrado: livro.registerApprovedBundle(bundle, chaveiro) };
  } catch (erro) {
    return { ok: false, falhas: [erro instanceof Error ? erro.message : String(erro)] };
  }
}

/**
 * Porta sobre um `RuleActivationLedger` real. Traduz o estado ativo do
 * livro-razão no instante consultado:
 * - `never_activated`  → recusa `regra_nao_ativada`;
 * - `rule_unavailable` → recusa `regra_indisponivel` (kill switch do eixo 5);
 * - `active`           → disponível, com o `behaviorHash` e as chaves do
 *   bundle daquela versão exata (rollback muda a versão ativa e, com ela,
 *   o `behaviorHash` devolvido — é assim que o rollback fica provado).
 */
export function portaDeBundleDoLivroRazao(opcoes: {
  readonly identidade: IdentidadeRegra;
  readonly livro: RuleActivationLedger;
}): PortaDeBundle {
  const { identidade, livro } = opcoes;

  return {
    identidade,
    estadoEm(instanteIso: string): EstadoDeBundle {
      const ativo = livro.activeVersionAt(instanteIso);
      if (ativo.kind === "none") {
        const motivo: MotivoRecusa =
          ativo.reason === "rule_unavailable" ? "regra_indisponivel" : "regra_nao_ativada";
        return {
          tipo: "recusado",
          motivo,
          detalhes: [`livro-razão: ${ativo.reason}`],
          proveniencia: provenienciaVazia("assinatura_verificada"),
        };
      }

      const registrado = livro
        .registeredBundles()
        .find((b) => b.version === ativo.version && b.manifestDigest === ativo.manifestDigest);
      if (registrado === undefined) {
        // Estado ativo apontando para artefato não registrado: fail-closed.
        return {
          tipo: "recusado",
          motivo: "bundle_nao_verificado",
          detalhes: [
            `versão ativa "${ativo.version}" não tem bundle registrado com digest ${ativo.manifestDigest}`,
          ],
          proveniencia: provenienciaVazia("assinatura_verificada"),
        };
      }

      const proveniencia: ProvenienciaBundle = {
        versaoBundle: registrado.version,
        digestManifesto: registrado.manifestDigest,
        behaviorHash: registrado.manifest.logic.behaviorHash,
        assinatura: "assinatura_verificada",
        autorKeyId: registrado.authorKeyId,
        aprovadorKeyId: registrado.approverKeyId,
        bloqueiosDeAtivacao: registrado.blockers.map((b) => b.code),
        ativoDesde: ativo.since,
      };
      return {
        tipo: "disponivel",
        modo: ativo.mode === "actionable" ? "acionavel" : "sombra",
        proveniencia,
      };
    },
  };
}
