/**
 * apps/api/src/auth/algoritmos.ts — lista branca de algoritmos de assinatura
 * e verificação criptográfica.
 *
 * Duas defesas distintas vivem aqui, e é a SEGUNDA que impede a confusão de
 * família:
 *
 *   1. Lista branca fechada de `alg` — `none` e toda a família HMAC (`HS*`)
 *      ficam de fora por CONSTRUÇÃO (não por ramo condicional). Um `alg`
 *      desconhecido não é "tentado assim mesmo".
 *   2. Coerência entre o `alg` declarado no cabeçalho JOSE e o TIPO REAL da
 *      chave publicada no JWKS. Sem isso, um token `alg: RS256` apontando um
 *      `kid` de chave EC ainda seria processado pela biblioteca, e um token
 *      `alg: HS256` usaria a chave pública como segredo HMAC — a falha
 *      clássica que HAZ-0014 registra no sistema legado.
 *
 * Rastreio: ADR-0015 §4 (verificador único, sem caminho alternativo),
 * SEC-0004, THR-0021. Implementado com `node:crypto` da biblioteca padrão do
 * Node 22 — nenhuma dependência nova (ADR-0022, cadeia de suprimentos).
 */

import { constants, type KeyObject, verify as verificarCrypto } from "node:crypto";

/**
 * Únicos algoritmos aceitos. Todos assimétricos: a V2 nunca compartilha
 * segredo simétrico com um emissor, então `HS*` não tem caso de uso legítimo
 * e sua ausência aqui é a defesa contra confusão HS/RS.
 */
export const ALGORITMOS_ACEITOS = [
  "RS256",
  "RS384",
  "RS512",
  "PS256",
  "PS384",
  "PS512",
  "ES256",
  "ES384",
  "ES512",
  "EdDSA",
] as const;

export type AlgoritmoAceito = (typeof ALGORITMOS_ACEITOS)[number];

export function ehAlgoritmoAceito(valor: unknown): valor is AlgoritmoAceito {
  return typeof valor === "string" && (ALGORITMOS_ACEITOS as readonly string[]).includes(valor);
}

/** Tamanho mínimo de módulo RSA aceito, em bits. */
const MODULO_RSA_MINIMO_BITS = 2048;

interface Perfil {
  readonly hash: string | null;
  /** Tipos de chave assimétrica compatíveis, conforme `KeyObject.asymmetricKeyType`. */
  readonly tiposDeChave: readonly string[];
  /** Curva exigida quando o tipo é `ec`. */
  readonly curva?: string;
  readonly pss?: boolean;
}

const PERFIL_POR_ALGORITMO: Readonly<Record<AlgoritmoAceito, Perfil>> = {
  RS256: { hash: "sha256", tiposDeChave: ["rsa"] },
  RS384: { hash: "sha384", tiposDeChave: ["rsa"] },
  RS512: { hash: "sha512", tiposDeChave: ["rsa"] },
  PS256: { hash: "sha256", tiposDeChave: ["rsa", "rsa-pss"], pss: true },
  PS384: { hash: "sha384", tiposDeChave: ["rsa", "rsa-pss"], pss: true },
  PS512: { hash: "sha512", tiposDeChave: ["rsa", "rsa-pss"], pss: true },
  ES256: { hash: "sha256", tiposDeChave: ["ec"], curva: "prime256v1" },
  ES384: { hash: "sha384", tiposDeChave: ["ec"], curva: "secp384r1" },
  ES512: { hash: "sha512", tiposDeChave: ["ec"], curva: "secp521r1" },
  EdDSA: { hash: null, tiposDeChave: ["ed25519"] },
};

/**
 * A chave publicada no JWKS é utilizável para o `alg` que o token declara?
 *
 * Devolver `false` aqui é o que transforma "token com `alg` trocado" em
 * recusa em vez de tentativa. Nunca inferir o algoritmo a partir da chave: o
 * `alg` do cabeçalho é entrada do atacante e só serve para SELECIONAR uma
 * verificação, jamais para dispensá-la.
 */
export function chaveCompativelComAlgoritmo(chave: KeyObject, algoritmo: AlgoritmoAceito): boolean {
  const perfil = PERFIL_POR_ALGORITMO[algoritmo];
  const tipo = chave.asymmetricKeyType;
  if (tipo === undefined || !perfil.tiposDeChave.includes(tipo)) return false;

  const detalhes = chave.asymmetricKeyDetails;
  if (tipo === "ec") {
    if (perfil.curva === undefined) return false;
    if (detalhes?.namedCurve !== perfil.curva) return false;
  }
  if (tipo === "rsa" || tipo === "rsa-pss") {
    const modulo = detalhes?.modulusLength;
    if (typeof modulo !== "number" || modulo < MODULO_RSA_MINIMO_BITS) return false;
  }
  return true;
}

/**
 * Verificação da assinatura JWS. `dadosAssinados` é o octeto
 * `base64url(cabeçalho) + "." + base64url(payload)` (RFC 7515 §5.2).
 *
 * ECDSA em JWS usa a concatenação crua R‖S (RFC 7518 §3.4), não DER — daí o
 * `dsaEncoding: "ieee-p1363"`. Sem isso a verificação falharia sempre para
 * tokens legítimos e o adaptador seria "consertado" afrouxando outra coisa.
 */
export function verificarAssinatura(
  algoritmo: AlgoritmoAceito,
  dadosAssinados: Buffer,
  assinatura: Buffer,
  chave: KeyObject,
): boolean {
  const perfil = PERFIL_POR_ALGORITMO[algoritmo];
  try {
    if (perfil.hash === null) {
      return verificarCrypto(null, dadosAssinados, chave, assinatura);
    }
    if (perfil.pss === true) {
      return verificarCrypto(
        perfil.hash,
        dadosAssinados,
        {
          key: chave,
          padding: constants.RSA_PKCS1_PSS_PADDING,
          saltLength: constants.RSA_PSS_SALTLEN_DIGEST,
        },
        assinatura,
      );
    }
    if (perfil.tiposDeChave[0] === "ec") {
      return verificarCrypto(
        perfil.hash,
        dadosAssinados,
        { key: chave, dsaEncoding: "ieee-p1363" },
        assinatura,
      );
    }
    return verificarCrypto(perfil.hash, dadosAssinados, chave, assinatura);
  } catch {
    // Qualquer exceção do motor criptográfico (chave inutilizável, assinatura
    // com tamanho impossível) é RECUSA, jamais aceitação por omissão.
    return false;
  }
}
