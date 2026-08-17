/**
 * apps/web/src/perfil.ts
 *
 * Perfil de execução do bundle e GUARDAS QUE LANÇAM.
 *
 * POR QUE ESTE ARQUIVO EXISTE. Até o ciclo 6, `apps/web` compilava um token
 * bearer sintético como constante de módulo e aceitava `?mock` na URL em
 * qualquer build. Isso é o anti-padrão 9 do contrato comum ("permitir PGlite
 * em memória, fixtures ou token sintético em perfil não-dev") e o anti-padrão
 * 8 ("fazer fallback de IAM/OIDC indisponível para token local/sintético")
 * atravessando a fronteira do frontend.
 *
 * A regra desta fatia: dublê operacional (cliente mock, fixtures sintéticas,
 * controle de demonstração, sessão sintética) só existe em perfil de
 * DESENVOLVIMENTO. Fora dele a recusa é OBSERVÁVEL — este módulo LANÇA
 * (`RecusaDePerfilError`), nunca faz um `if` silencioso que degrada para o
 * caminho inseguro. A verificação de bundle correspondente
 * (`./build/guardaArtefatoSintetico.ts`) faz o BUILD de produção falhar se o
 * artefato sintético chegar ao pacote emitido — as duas defesas são
 * independentes de propósito.
 *
 * Rastreio: ADR-0021 (frontend/BFF), ADR-0015 (autenticação, `not-started`),
 * PRE-07, MG-G4.
 */

/**
 * Subconjunto de `import.meta.env` do qual o perfil depende. Declarado como
 * parâmetro injetável para que a recusa em perfil não-dev seja TESTÁVEL sem
 * um segundo build (um teste que só pudesse rodar em produção não seria
 * escrito, e a guarda nunca seria exercida).
 */
export interface AmbienteBuild {
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly MODE: string;
}

/** Perfis reconhecidos. Tudo que não é `desenvolvimento` é tratado como não-dev. */
export type PerfilExecucao = "desenvolvimento" | "nao-desenvolvimento";

/**
 * Erro de recusa de perfil. É uma classe própria (e não um `Error` genérico)
 * para que a casca de inicialização possa distingui-lo de uma falha de rede e
 * renderizar a tela de recusa explícita em vez de um "erro inesperado".
 */
export class RecusaDePerfilError extends Error {
  readonly recurso: string;
  readonly modo: string;

  constructor(recurso: string, modo: string) {
    super(
      `Recurso de desenvolvimento recusado em perfil não-dev: ${recurso}. ` +
        `Modo do build: "${modo}". Dublês operacionais (cliente mock, fixtures ` +
        `sintéticas, controle de demonstração e sessão sintética) existem apenas ` +
        `em desenvolvimento; não há degradação silenciosa para eles.`,
    );
    this.name = "RecusaDePerfilError";
    this.recurso = recurso;
    this.modo = modo;
  }
}

/**
 * Ambiente do build corrente. `import.meta.env` é substituído por literais
 * pelo Vite em tempo de build — em produção `DEV` vira `false` e os ramos
 * guardados por ele viram código morto, removível pelo empacotador.
 */
export function ambienteAtual(): AmbienteBuild {
  const env = import.meta.env;
  return {
    DEV: env.DEV === true,
    PROD: env.PROD === true,
    MODE: typeof env.MODE === "string" ? env.MODE : "desconhecido",
  };
}

/**
 * Perfil derivado do ambiente. Fail-closed por desenho: só é
 * `desenvolvimento` quando `DEV` é verdadeiro E `PROD` é falso — um ambiente
 * ambíguo (ambos verdadeiros, ou nenhum) é tratado como não-dev.
 */
export function perfilDe(env: AmbienteBuild): PerfilExecucao {
  return env.DEV === true && env.PROD !== true ? "desenvolvimento" : "nao-desenvolvimento";
}

/** `true` somente em perfil de desenvolvimento. */
export function ehPerfilDesenvolvimento(env: AmbienteBuild = ambienteAtual()): boolean {
  return perfilDe(env) === "desenvolvimento";
}

/**
 * Guarda que LANÇA quando um recurso restrito a desenvolvimento é solicitado
 * fora dele. Nunca devolve `false`, nunca registra e segue: o chamador não
 * tem um caminho alternativo legítimo.
 */
export function exigirPerfilDesenvolvimento(
  recurso: string,
  env: AmbienteBuild = ambienteAtual(),
): void {
  if (!ehPerfilDesenvolvimento(env)) {
    throw new RecusaDePerfilError(recurso, env.MODE);
  }
}

/**
 * `true` quando a busca da URL pede o cliente mock. Isolada como função pura
 * para ser testada sem `window` — a decisão "há `?mock`" é separada da
 * decisão "`?mock` é permitido aqui" (esta última é de `exigirPerfilDesenvolvimento`).
 */
export function pedeClienteMock(busca: string): boolean {
  return new URLSearchParams(busca).has("mock");
}

/** `true` quando a busca da URL pede a galeria de estados (revisão de UI, dev). */
export function pedeGaleriaDeEstados(busca: string): boolean {
  return new URLSearchParams(busca).has("estados");
}
