/**
 * apps/api/src/auth/jwks.ts — fonte de chaves públicas.
 *
 * Duas implementações da MESMA interface:
 *   - `criarFonteDeChavesEmMemoria`: JWKS servido de memória (emissor
 *     sintético de dev/test e testes de unidade). Também expõe caminho
 *     síncrono, porque não há E/S.
 *   - `criarFonteJwksRemota`: JWKS buscado por HTTP, com cache, rotação e
 *     limite de refresh.
 *
 * Política FAIL-CLOSED explícita (ADR-0015 §8 V3; THR-0021; HAZ-0014 — no
 * legado "a validação IAM cai para JWT local em qualquer erro"):
 *   - falha de rede, tempo esgotado, HTTP não-2xx, corpo inválido ⇒ NEGA;
 *   - cache VENCIDO não é usado como contingência ("stale-if-error" seria
 *     exatamente o caminho alternativo que o ADR proíbe);
 *   - `kid` desconhecido dispara no máximo uma re-busca por janela de
 *     `intervaloMinimoDeRefreshSegundos` — sem isso, um token forjado com
 *     `kid` aleatório vira amplificador de tráfego contra o IdP;
 *   - nenhuma chave local, embutida ou de contingência existe neste módulo.
 */

import { createPublicKey, type KeyObject } from "node:crypto";
import {
  type ConfiguracaoOidc,
  INTERVALO_MINIMO_REFRESH_PADRAO_SEGUNDOS,
  type PerfilExecucao,
  perfilPermiteSintetico,
  TEMPO_LIMITE_BUSCA_JWKS_PADRAO_MS,
  TTL_CACHE_JWKS_PADRAO_SEGUNDOS,
} from "./configuracao.js";
import type { CodigoFalhaAutenticacao } from "./tipos.js";

export interface ChavePublicaJwk {
  readonly kty?: unknown;
  readonly kid?: unknown;
  readonly use?: unknown;
  readonly alg?: unknown;
  readonly [outra: string]: unknown;
}

export interface ConjuntoDeChavesPublicas {
  readonly keys: readonly ChavePublicaJwk[];
}

export type ResultadoChave =
  | { readonly ok: true; readonly chave: KeyObject }
  | { readonly ok: false; readonly codigo: CodigoFalhaAutenticacao };

export interface FonteDeChaves {
  obterChave(kid: string): Promise<ResultadoChave>;
  /** Presente apenas quando a fonte não faz E/S (JWKS em memória). */
  readonly obterChaveSincrono?: (kid: string) => ResultadoChave;
}

/** Teto de chaves por conjunto — um JWKS legítimo tem unidades, não milhares. */
const MAXIMO_DE_CHAVES = 32;
/** Teto do corpo do JWKS em bytes. */
const TAMANHO_MAXIMO_DO_CORPO = 256 * 1024;

function importarChave(jwk: ChavePublicaJwk): KeyObject | undefined {
  // `use: "enc"` é chave de cifragem; usá-la para verificar assinatura é
  // reutilização de chave entre finalidades. Só `sig` (ou ausente) serve.
  if (jwk.use !== undefined && jwk.use !== "sig") return undefined;
  try {
    return createPublicKey({ key: jwk as never, format: "jwk" });
  } catch {
    return undefined;
  }
}

function indexarPorKid(conjunto: ConjuntoDeChavesPublicas): Map<string, KeyObject> {
  const indice = new Map<string, KeyObject>();
  const chaves = Array.isArray(conjunto.keys) ? conjunto.keys.slice(0, MAXIMO_DE_CHAVES) : [];
  for (const jwk of chaves) {
    if (typeof jwk?.kid !== "string" || jwk.kid.length === 0) continue;
    // Primeira ocorrência vence: um JWKS que repete `kid` está mal formado e
    // deixar a última sobrescrever daria a um atacante com escrita parcial no
    // documento uma forma de substituir a chave legítima.
    if (indice.has(jwk.kid)) continue;
    const chave = importarChave(jwk);
    if (chave !== undefined) indice.set(jwk.kid, chave);
  }
  return indice;
}

/**
 * JWKS em memória. `fornecedor` é reconsultado a cada chamada, de modo que
 * uma rotação de chave feita pelo emissor é observada imediatamente — é isso
 * que torna o teste de rotação honesto (o verificador não guarda cópia).
 */
export function criarFonteDeChavesEmMemoria(
  fornecedor: () => ConjuntoDeChavesPublicas,
): FonteDeChaves {
  const buscar = (kid: string): ResultadoChave => {
    const chave = indexarPorKid(fornecedor()).get(kid);
    if (chave === undefined) return { ok: false, codigo: "kid-desconhecido" };
    return { ok: true, chave };
  };
  return {
    obterChave: async (kid) => buscar(kid),
    obterChaveSincrono: buscar,
  };
}

function ehLoopback(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

/**
 * Valida a URI do JWKS. `http:` em claro só é admitido contra loopback e sob
 * perfil de desenvolvimento — é o que permite o servidor OIDC de teste sem
 * abrir a porta para um JWKS de produção em texto claro (passível de
 * substituição de chave em trânsito).
 */
export function validarJwksUri(uri: string, perfil: PerfilExecucao): URL {
  let analisada: URL;
  try {
    analisada = new URL(uri);
  } catch {
    throw new Error("Configuração de autenticação inválida: `jwksUri` não é uma URI absoluta.");
  }
  if (analisada.protocol === "https:") return analisada;
  if (
    analisada.protocol === "http:" &&
    perfilPermiteSintetico(perfil) &&
    ehLoopback(analisada.hostname)
  ) {
    return analisada;
  }
  throw new Error(
    "Configuração de autenticação inválida: `jwksUri` precisa usar https (http só é aceito contra loopback em perfil dev/test).",
  );
}

export interface FonteJwksRemota extends FonteDeChaves {
  /** Contagem de buscas concluídas — usada por teste para provar o cache e o limite de refresh. */
  estatisticas(): { readonly buscas: number; readonly falhas: number };
}

export function criarFonteJwksRemota(
  config: ConfiguracaoOidc,
  perfil: PerfilExecucao,
  buscarHttp: typeof fetch = fetch,
): FonteJwksRemota {
  const uri = validarJwksUri(config.jwksUri, perfil);
  const ttlMs = (config.ttlCacheJwksSegundos ?? TTL_CACHE_JWKS_PADRAO_SEGUNDOS) * 1000;
  const cooldownMs =
    (config.intervaloMinimoDeRefreshSegundos ?? INTERVALO_MINIMO_REFRESH_PADRAO_SEGUNDOS) * 1000;
  const tempoLimiteMs = config.tempoLimiteDeBuscaMs ?? TEMPO_LIMITE_BUSCA_JWKS_PADRAO_MS;

  let cache: { indice: Map<string, KeyObject>; obtidoEm: number } | undefined;
  let ultimaTentativaEm = 0;
  let emVoo: Promise<Map<string, KeyObject> | undefined> | undefined;
  let buscas = 0;
  let falhas = 0;

  async function buscarAgora(): Promise<Map<string, KeyObject> | undefined> {
    ultimaTentativaEm = Date.now();
    try {
      const resposta = await buscarHttp(uri, {
        method: "GET",
        headers: { accept: "application/json" },
        signal: AbortSignal.timeout(tempoLimiteMs),
        redirect: "error",
      });
      if (!resposta.ok) {
        falhas += 1;
        return undefined;
      }
      const texto = await resposta.text();
      if (texto.length > TAMANHO_MAXIMO_DO_CORPO) {
        falhas += 1;
        return undefined;
      }
      const conjunto = JSON.parse(texto) as ConjuntoDeChavesPublicas;
      if (conjunto === null || typeof conjunto !== "object" || !Array.isArray(conjunto.keys)) {
        falhas += 1;
        return undefined;
      }
      const indice = indexarPorKid(conjunto);
      if (indice.size === 0) {
        falhas += 1;
        return undefined;
      }
      buscas += 1;
      cache = { indice, obtidoEm: Date.now() };
      return indice;
    } catch {
      // Rede, DNS, TLS, tempo esgotado, JSON inválido — tudo NEGA.
      falhas += 1;
      return undefined;
    }
  }

  async function buscarDeduplicado(): Promise<Map<string, KeyObject> | undefined> {
    if (emVoo !== undefined) return emVoo;
    emVoo = buscarAgora().finally(() => {
      emVoo = undefined;
    });
    return emVoo;
  }

  return {
    estatisticas: () => ({ buscas, falhas }),
    async obterChave(kid: string): Promise<ResultadoChave> {
      const agora = Date.now();
      const cacheValido = cache !== undefined && agora - cache.obtidoEm < ttlMs;

      if (cacheValido && cache !== undefined) {
        const chave = cache.indice.get(kid);
        if (chave !== undefined) return { ok: true, chave };
        // `kid` desconhecido com cache válido: pode ser rotação recente. Uma
        // re-busca por janela — nunca uma por requisição.
        if (agora - ultimaTentativaEm < cooldownMs) {
          return { ok: false, codigo: "kid-desconhecido" };
        }
      }

      const indice = await buscarDeduplicado();
      if (indice === undefined) return { ok: false, codigo: "fonte-de-chaves-indisponivel" };
      const chave = indice.get(kid);
      if (chave === undefined) return { ok: false, codigo: "kid-desconhecido" };
      return { ok: true, chave };
    },
  };
}
