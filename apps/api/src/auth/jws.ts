/**
 * apps/api/src/auth/jws.ts — decodificação ESTRITA de JWS compacto
 * (RFC 7515 §7.1) e do cabeçalho JOSE.
 *
 * "Estrita" aqui significa: nenhuma tolerância a formato. `Buffer.from(x,
 * "base64url")` do Node aceita silenciosamente entrada inválida (padding,
 * caracteres do alfabeto padrão, comprimento impossível) e devolve bytes
 * parciais; um verificador construído sobre esse comportamento aceita
 * variações do mesmo token, o que abre espaço para dessincronizar o que é
 * assinado do que é lido. Por isso o alfabeto e o comprimento são validados
 * antes da decodificação.
 *
 * Rastreio: ADR-0015 §4 (verificador único), SEC-0004.
 */

import { type AlgoritmoAceito, ehAlgoritmoAceito } from "./algoritmos.js";
import type { CodigoFalhaAutenticacao } from "./tipos.js";

const BASE64URL_ESTRITO = /^[A-Za-z0-9_-]*$/;

/** Tipos `typ` admissíveis quando o cabeçalho declara um (RFC 9068 para `at+jwt`). */
const TIPOS_ADMISSIVEIS = new Set(["jwt", "at+jwt", "application/at+jwt"]);

/** Teto de tamanho do token — um bearer clínico legítimo não passa disso. */
const TAMANHO_MAXIMO_DO_TOKEN = 8192;

export function decodificarBase64UrlEstrito(texto: string): Buffer | undefined {
  if (!BASE64URL_ESTRITO.test(texto)) return undefined;
  // Comprimento ≡ 1 (mod 4) é impossível em base64: sobraria menos de um byte.
  if (texto.length % 4 === 1) return undefined;
  return Buffer.from(texto, "base64url");
}

export interface CabecalhoJose {
  readonly alg: AlgoritmoAceito;
  readonly kid: string;
}

export interface JwsDecodificado {
  readonly cabecalho: CabecalhoJose;
  readonly claims: Readonly<Record<string, unknown>>;
  /** Octetos efetivamente cobertos pela assinatura (RFC 7515 §5.2 passo 8). */
  readonly dadosAssinados: Buffer;
  readonly assinatura: Buffer;
}

export type ResultadoDecodificacao =
  | { readonly ok: true; readonly jws: JwsDecodificado }
  | { readonly ok: false; readonly codigo: CodigoFalhaAutenticacao };

function erro(codigo: CodigoFalhaAutenticacao): ResultadoDecodificacao {
  return { ok: false, codigo };
}

function objetoJsonDe(bytes: Buffer): Record<string, unknown> | undefined {
  let analisado: unknown;
  try {
    analisado = JSON.parse(bytes.toString("utf8"));
  } catch {
    return undefined;
  }
  if (analisado === null || typeof analisado !== "object" || Array.isArray(analisado)) {
    return undefined;
  }
  return analisado as Record<string, unknown>;
}

export function decodificarJwsCompacto(tokenBruto: string): ResultadoDecodificacao {
  const token = tokenBruto.trim();
  if (token.length === 0) return erro("token-vazio");
  if (token.length > TAMANHO_MAXIMO_DO_TOKEN) return erro("formato-jws-invalido");

  const segmentos = token.split(".");
  if (segmentos.length !== 3) return erro("formato-jws-invalido");
  const [segCabecalho, segPayload, segAssinatura] = segmentos;
  if (segCabecalho === undefined || segPayload === undefined || segAssinatura === undefined) {
    return erro("formato-jws-invalido");
  }
  if (segCabecalho.length === 0 || segPayload.length === 0) return erro("formato-jws-invalido");

  const bytesCabecalho = decodificarBase64UrlEstrito(segCabecalho);
  if (bytesCabecalho === undefined) return erro("cabecalho-jose-invalido");
  const cabecalho = objetoJsonDe(bytesCabecalho);
  if (cabecalho === undefined) return erro("cabecalho-jose-invalido");

  // ORDEM DELIBERADA: o algoritmo é a primeira coisa checada. Um token
  // `alg: none` ou `alg: HS256` nunca chega perto da seleção de chave.
  if (!ehAlgoritmoAceito(cabecalho.alg)) return erro("algoritmo-nao-permitido");
  const alg: AlgoritmoAceito = cabecalho.alg;

  // RFC 7515 §4.1.11: extensão marcada como crítica que não sabemos honrar
  // obriga a REJEITAR. Este verificador não implementa nenhuma extensão.
  if (cabecalho.crit !== undefined) return erro("parametro-crit-nao-suportado");

  const typ = cabecalho.typ;
  if (typ !== undefined) {
    if (typeof typ !== "string" || !TIPOS_ADMISSIVEIS.has(typ.toLowerCase())) {
      return erro("cabecalho-jose-invalido");
    }
  }

  const kid = cabecalho.kid;
  if (typeof kid !== "string" || kid.length === 0) return erro("kid-ausente");

  const bytesPayload = decodificarBase64UrlEstrito(segPayload);
  if (bytesPayload === undefined) return erro("payload-invalido");
  const claims = objetoJsonDe(bytesPayload);
  if (claims === undefined) return erro("payload-invalido");

  const assinatura = decodificarBase64UrlEstrito(segAssinatura);
  if (assinatura === undefined || assinatura.length === 0) return erro("assinatura-invalida");

  return {
    ok: true,
    jws: {
      cabecalho: { alg, kid },
      claims,
      dadosAssinados: Buffer.from(`${segCabecalho}.${segPayload}`, "ascii"),
      assinatura,
    },
  };
}
