/**
 * apps/api/src/auth/configuracao.ts — CONTRATO de configuração que a porta de
 * autenticação exige.
 *
 * Este arquivo declara os TIPOS; ele deliberadamente não lê arquivo de
 * configuração nem monta o objeto a partir de um esquema tipado — isso é
 * escopo de `apps/api/src/config/**` (agente de perfis de runtime), que deve
 * produzir um `ConfiguracaoAutenticacao` e injetá-lo. Enquanto esse módulo
 * não existir, `perfilDoAmbiente()` abaixo deriva o perfil de variável de
 * ambiente de forma FAIL-CLOSED: valor não reconhecido ⇒ `undefined` ⇒ nada
 * sintético é habilitável.
 *
 * ADR-0015 §4.1 (premissa reversível GDEC-0015/0017): "o emissor sintético só
 * é habilitável sob perfil `dev`/`test`; em qualquer outro perfil a aplicação
 * **falha ao iniciar** em vez de degradar".
 */

import type { AlgoritmoAceito } from "./algoritmos.js";

export const PERFIS = ["dev", "test", "homologacao", "producao"] as const;
export type PerfilExecucao = (typeof PERFIS)[number];

/** Únicos perfis em que adaptador sintético e servidor de teste são admissíveis. */
export const PERFIS_DE_DESENVOLVIMENTO: readonly PerfilExecucao[] = ["dev", "test"];

export function perfilPermiteSintetico(perfil: PerfilExecucao | undefined): boolean {
  return perfil !== undefined && PERFIS_DE_DESENVOLVIMENTO.includes(perfil);
}

/**
 * Mapeamento tolerante na ENTRADA (aceita os nomes usuais de `NODE_ENV`) e
 * estrito na SAÍDA. Qualquer valor não listado devolve `undefined`, o que o
 * resto do módulo trata como "não é dev" — nunca como "deve ser dev".
 */
const ALIAS_DE_PERFIL: Readonly<Record<string, PerfilExecucao>> = {
  dev: "dev",
  development: "dev",
  desenvolvimento: "dev",
  test: "test",
  teste: "test",
  homologacao: "homologacao",
  staging: "homologacao",
  producao: "producao",
  production: "producao",
  prod: "producao",
};

export function normalizarPerfil(valor: string | undefined): PerfilExecucao | undefined {
  if (valor === undefined) return undefined;
  return ALIAS_DE_PERFIL[valor.trim().toLowerCase()];
}

/**
 * Perfil derivado do ambiente. `INTENSICARE_PERFIL` tem precedência sobre
 * `NODE_ENV`. Ausência de ambos ⇒ `undefined` (fail-closed): rodar
 * `node dist/index.js` sem declarar perfil NÃO habilita nada sintético.
 */
export function perfilDoAmbiente(
  ambiente: NodeJS.ProcessEnv = process.env,
): PerfilExecucao | undefined {
  return normalizarPerfil(ambiente.INTENSICARE_PERFIL) ?? normalizarPerfil(ambiente.NODE_ENV);
}

/** Configuração do adaptador OIDC. Nenhum destes valores tem default. */
export interface ConfiguracaoOidc {
  /** `iss` exigido, comparado por igualdade exata. */
  readonly emissor: string;
  /** `aud` exigida; `aud` como lista é aceita se CONTIVER este valor (RFC 7519 §4.1.3). */
  readonly audiencia: string;
  /** URI absoluta do JWKS. `http:` só é aceito em dev/test contra loopback. */
  readonly jwksUri: string;
  /** Lista branca; default = todas as assimétricas suportadas. `none` e HMAC nunca entram. */
  readonly algoritmosAceitos?: readonly AlgoritmoAceito[];
  /** TTL do cache de JWKS em segundos (default 300). */
  readonly ttlCacheJwksSegundos?: number;
  /** Intervalo mínimo entre buscas forçadas por `kid` desconhecido (default 30 s). */
  readonly intervaloMinimoDeRefreshSegundos?: number;
  /** Tempo limite da busca de JWKS (default 3000 ms). Esgotado ⇒ NEGA. */
  readonly tempoLimiteDeBuscaMs?: number;
}

/** Configuração do emissor sintético local. Só válida em `dev`/`test`. */
export interface ConfiguracaoSintetica {
  readonly emissor?: string;
  readonly audiencia?: string;
  /** Validade do token emitido, em segundos (default 3600). */
  readonly validadeSegundos?: number;
}

export interface ConfiguracaoAutenticacao {
  readonly perfil: PerfilExecucao;
  /** Escolha explícita do adaptador — não há default e não há troca em runtime. */
  readonly adaptador: "oidc" | "sintetico";
  readonly oidc?: ConfiguracaoOidc;
  readonly sintetico?: ConfiguracaoSintetica;
  /**
   * Lista branca de tenants, vinda da CONFIGURAÇÃO do servidor. É o único
   * valor da decisão que não se origina no chamador — sem ela, comparar
   * tenant da claim com tenant do escopo compara dois valores do mesmo token
   * (anti-padrão §10.4 do prompt). `undefined` = sem lista (pendência de
   * provisionamento; ver handoff).
   */
  readonly tenantsPermitidos?: readonly string[];
  /** Tolerância de relógio em segundos aplicada a `exp`/`nbf`/`iat` (default 0). */
  readonly toleranciaDeRelogioSegundos?: number;
}

export const VALIDADE_SINTETICA_PADRAO_SEGUNDOS = 3600;
export const TTL_CACHE_JWKS_PADRAO_SEGUNDOS = 300;
export const INTERVALO_MINIMO_REFRESH_PADRAO_SEGUNDOS = 30;
export const TEMPO_LIMITE_BUSCA_JWKS_PADRAO_MS = 3000;
