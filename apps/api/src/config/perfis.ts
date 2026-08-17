/**
 * Perfis de execução do runtime e a matriz de capacidades de cada um.
 *
 * POR QUE ESTE ARQUIVO EXISTE. Antes dele, `apps/api/src/db.ts::prepareDatabase`
 * criava PGlite em memória e semeava fixtures sintéticas quando nenhum banco
 * era injetado, e `apps/api/src/index.ts` subia lendo apenas `PORT`. O modo
 * inseguro era, portanto, o que se obtinha por OMISSÃO — exatamente o que
 * ADR-0019 §5.2 P4 proíbe ("ausência de configuração obrigatória falha o boot
 * — nunca degrada silenciosamente para um default inseguro").
 *
 * A permissão para usar PGlite, fixtures ou token sintético deixa de ser um
 * `if` espalhado pelo código e passa a ser DADO nesta tabela, varrido por
 * teste (`sem-defaults-inseguros.test.ts`). O anti-padrão 9 do contrato comum
 * ("permitir PGlite em memória, fixtures ou token sintético em perfil
 * não-dev") vira, assim, uma propriedade verificável e não uma promessa de
 * revisão de código.
 *
 * PREMISSA (reversível): os seis nomes de perfil abaixo e o vocabulário de
 * sete ambientes de ADR-0019 §1/§2.1 E1 (`dev`, `preview`,
 * `integração/conformidade`, `staging`, `shadow`, `piloto`, `produção`) ainda
 * NÃO estão reconciliados. Perfil de RUNTIME (o que o processo pode fazer) e
 * ambiente de IMPLANTAÇÃO (onde ele roda) são eixos distintos, e nenhum ADR
 * fixa esta lista — ela aparece apenas em
 * `docs/15-release-evidence/final-implementation-audit.md:92` com rótulo
 * OBSERVED, como correção proposta. A reconciliação é decisão do titular; ver
 * handoff. Nada aqui seleciona provedor de nuvem, região, residência de dado
 * ou ambiente AMH — ADR-0019 §5 e §11 mantêm todos esses pontos em aberto.
 */

/** Perfis de execução aceitos. Ordem: do mais sintético ao mais restrito. */
export const PERFIS = [
  "test",
  "dev-synthetic",
  "integration",
  "staging",
  "pilot",
  "production",
] as const;

export type Perfil = (typeof PERFIS)[number];

/**
 * Classe do perfil — determina o regime de validação:
 * - `sintetico`: PGlite, fixtures e token sintético admitidos; banner obrigatório;
 * - `integracao`: banco real obrigatório, dados sintéticos controlados PELO
 *   HARNESS (nunca semeadura no bootstrap), identidade real; banner obrigatório
 *   porque continua não sendo produção;
 * - `produtivo`: toda dependência externa obrigatória, nenhuma semeadura,
 *   nenhum material sintético.
 */
export type ClassePerfil = "sintetico" | "integracao" | "produtivo";

export interface CapacidadesPerfil {
  readonly perfil: Perfil;
  readonly classe: ClassePerfil;
  /** PGlite em memória admitido como banco do processo. */
  readonly permitePGliteEmMemoria: boolean;
  /** Fixtures sintéticas (`@intensicare/fixtures-sinteticas`) admitidas. */
  readonly permiteFixturesSinteticas: boolean;
  /** Token bearer sintético (`apps/api/src/auth.ts`) admitido como identidade. */
  readonly permiteTokenSintetico: boolean;
  /** Semeadura executada pelo próprio bootstrap do processo. */
  readonly semeaduraAutomaticaPermitida: boolean;
  /** O processo precisa anunciar suas limitações na inicialização e na prontidão. */
  readonly exigeBanner: boolean;
  /** Bundle de regra clínica assinado é obrigatório (ADR-0007). */
  readonly exigeBundleDeRegra: boolean;
}

function capacidadeSintetica(perfil: Perfil): CapacidadesPerfil {
  return {
    perfil,
    classe: "sintetico",
    permitePGliteEmMemoria: true,
    permiteFixturesSinteticas: true,
    permiteTokenSintetico: true,
    semeaduraAutomaticaPermitida: true,
    exigeBanner: true,
    exigeBundleDeRegra: false,
  };
}

function capacidadeEndurecida(perfil: Perfil, classe: ClassePerfil): CapacidadesPerfil {
  return {
    perfil,
    classe,
    permitePGliteEmMemoria: false,
    permiteFixturesSinteticas: false,
    permiteTokenSintetico: false,
    semeaduraAutomaticaPermitida: false,
    exigeBanner: classe === "integracao",
    exigeBundleDeRegra: true,
  };
}

/**
 * Matriz de capacidades por perfil. `Record<Perfil, …>` é exaustivo por tipo:
 * acrescentar um perfil a `PERFIS` sem acrescentar a entrada aqui é erro de
 * compilação, não omissão silenciosa (falha fechada — mesma disciplina de
 * `scripts/check_module_boundaries.mjs`).
 */
export const CAPACIDADES: Readonly<Record<Perfil, CapacidadesPerfil>> = Object.freeze({
  test: capacidadeSintetica("test"),
  "dev-synthetic": capacidadeSintetica("dev-synthetic"),
  integration: capacidadeEndurecida("integration", "integracao"),
  staging: capacidadeEndurecida("staging", "produtivo"),
  pilot: capacidadeEndurecida("pilot", "produtivo"),
  production: capacidadeEndurecida("production", "produtivo"),
});

/** Perfis derivados da matriz — nunca uma segunda lista que possa divergir dela. */
export const PERFIS_SINTETICOS: readonly Perfil[] = Object.freeze(
  PERFIS.filter((p) => CAPACIDADES[p].classe === "sintetico"),
);

/** Todo perfil que NÃO é sintético: integration, staging, pilot, production. */
export const PERFIS_ENDURECIDOS: readonly Perfil[] = Object.freeze(
  PERFIS.filter((p) => CAPACIDADES[p].classe !== "sintetico"),
);

export function ehPerfil(valor: unknown): valor is Perfil {
  return typeof valor === "string" && (PERFIS as readonly string[]).includes(valor);
}

export function capacidadesDe(perfil: Perfil): CapacidadesPerfil {
  return CAPACIDADES[perfil];
}
