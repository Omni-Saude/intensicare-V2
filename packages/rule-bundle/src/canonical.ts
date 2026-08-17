/**
 * Serialização canônica determinística e digest de conteúdo.
 *
 * Por que este módulo existe primeiro
 * -----------------------------------
 * ADR-0007 §4.1 Opção A (aceita, GDEC-0007) escolhe "arquivo único assinado,
 * endereçado por conteúdo". A própria ADR registra, como consequência
 * negativa da opção escolhida, que "a determinicidade da serialização
 * canônica é, ela mesma, um detalhe de design que pode falhar sutilmente
 * (ordem de chaves, espaços em branco) e precisa de teste dedicado". Sem
 * bytes estáveis não existe hash estável; sem hash estável a assinatura do
 * eixo 2 não prova nada. Este módulo é, portanto, o alicerce de tudo o mais
 * neste pacote.
 *
 * Regras da forma canônica (todas verificadas em `test/canonical.test.ts`)
 * ------------------------------------------------------------------------
 * 1. Objetos: chaves ordenadas por unidade de código UTF-16, crescente.
 * 2. Objetos: propriedades cujo valor é `undefined` são OMITIDAS (a omissão
 *    é função pura da entrada, logo determinística). `undefined` dentro de
 *    array é ERRO — ali a omissão mudaria índices.
 * 3. Strings (e nomes de chave) normalizados em Unicode NFC antes de
 *    serializar. Isto NÃO é decoração: o conteúdo deste repositório é em
 *    pt-BR, e "ã" tem duas representações Unicode válidas cujos bytes UTF-8
 *    diferem. Sem NFC, o mesmo texto acentuado produziria dois hashes.
 * 4. Números: apenas finitos. `NaN`/`Infinity` são erro (não têm forma JSON);
 *    `-0` é normalizado para `0` (JSON não distingue os dois e `JSON.stringify`
 *    já emite "0", mas a normalização é explícita para que a regra seja lida,
 *    não inferida).
 * 5. Sem espaço em branco de formatação; sem quebras de linha.
 * 6. Tipos não-JSON (Date, Map, Set, bigint, função, símbolo, instância de
 *    classe) são ERRO, nunca coerção silenciosa. Um `Date` serializado
 *    implicitamente esconderia a decisão de precisão temporal; quem quer um
 *    instante escreve a string ISO 8601 explicitamente.
 * 7. Duas chaves distintas que colidem após NFC são ERRO (a ordem entre elas
 *    seria arbitrária).
 *
 * Este módulo é puro: sem relógio, sem I/O, sem aleatoriedade.
 */

import { createHash } from "node:crypto";

/** Prefixo do digest — o algoritmo viaja junto do valor (agilidade de algoritmo). */
const DIGEST_PREFIX = "sha256:";

/**
 * Valor representável na forma canônica. `unknown` é aceito nas APIs
 * públicas porque a validação real é feita em tempo de execução por
 * `canonicalize` (fail-closed); este tipo documenta a intenção.
 */
export type CanonicalJson =
  | null
  | boolean
  | number
  | string
  | readonly CanonicalJson[]
  | { readonly [key: string]: CanonicalJson | undefined };

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value) as object | null;
  return prototype === Object.prototype || prototype === null;
}

function describePath(path: string): string {
  return path === "" ? "<raiz>" : path;
}

function fail(path: string, message: string): never {
  throw new Error(`serialização canônica: ${message} (caminho: ${describePath(path)})`);
}

/** Comparação explícita por unidade de código UTF-16 (não depende de locale). */
function compareCodeUnits(left: string, right: string): number {
  if (left < right) {
    return -1;
  }
  if (left > right) {
    return 1;
  }
  return 0;
}

function writeValue(value: unknown, path: string, out: string[]): void {
  if (value === null) {
    out.push("null");
    return;
  }

  const kind = typeof value;

  if (kind === "boolean") {
    out.push(value === true ? "true" : "false");
    return;
  }

  if (kind === "number") {
    const numeric = value as number;
    if (!Number.isFinite(numeric)) {
      fail(path, "número não finito (NaN/Infinity) não tem forma JSON");
    }
    out.push(JSON.stringify(Object.is(numeric, -0) ? 0 : numeric));
    return;
  }

  if (kind === "string") {
    out.push(JSON.stringify((value as string).normalize("NFC")));
    return;
  }

  if (kind === "undefined") {
    fail(path, "`undefined` só é admissível como valor de propriedade de objeto, onde é omitido");
  }

  if (kind === "bigint" || kind === "function" || kind === "symbol") {
    fail(path, `valor do tipo \`${kind}\` não é serializável em JSON canônico`);
  }

  if (Array.isArray(value)) {
    out.push("[");
    for (let index = 0; index < value.length; index++) {
      if (index > 0) {
        out.push(",");
      }
      const element: unknown = value[index];
      if (element === undefined) {
        fail(
          `${path}[${index}]`,
          "`undefined` dentro de array é ambíguo (omitir mudaria os índices)",
        );
      }
      writeValue(element, `${path}[${index}]`, out);
    }
    out.push("]");
    return;
  }

  if (!isPlainObject(value)) {
    fail(
      path,
      `tipo não suportado ${Object.prototype.toString.call(value)} — use apenas JSON puro ` +
        "(Date/Map/Set/instância de classe devem ser convertidos explicitamente pelo autor)",
    );
  }

  const originalByNormalized = new Map<string, string>();
  for (const key of Object.keys(value)) {
    if (value[key] === undefined) {
      continue;
    }
    const normalized = key.normalize("NFC");
    const collision = originalByNormalized.get(normalized);
    if (collision !== undefined) {
      fail(
        path,
        `duas chaves distintas colidem após normalização NFC ("${collision}" e "${key}") — ` +
          "a ordem entre elas seria arbitrária",
      );
    }
    originalByNormalized.set(normalized, key);
  }

  const normalizedKeys = [...originalByNormalized.keys()].sort(compareCodeUnits);

  out.push("{");
  for (let index = 0; index < normalizedKeys.length; index++) {
    if (index > 0) {
      out.push(",");
    }
    const normalizedKey = normalizedKeys[index] as string;
    const originalKey = originalByNormalized.get(normalizedKey) as string;
    out.push(JSON.stringify(normalizedKey));
    out.push(":");
    writeValue(value[originalKey], `${path}.${normalizedKey}`, out);
  }
  out.push("}");
}

/**
 * Serializa `value` na forma canônica. Mesma entrada ⇒ mesma string, sempre.
 *
 * @throws Error se `value` contiver algo não representável (ver regras no
 * cabeçalho deste módulo). Falhar é deliberado: um serializador que "dá um
 * jeito" em entrada ambígua produz hashes que não significam nada.
 */
export function canonicalize(value: unknown): string {
  const out: string[] = [];
  writeValue(value, "", out);
  return out.join("");
}

/** Bytes UTF-8 da forma canônica — é isto, e só isto, que se assina. */
export function canonicalBytes(value: unknown): Uint8Array {
  return new TextEncoder().encode(canonicalize(value));
}

/**
 * Digest de conteúdo, no formato `sha256:<hex>`. O algoritmo viaja no valor
 * para que uma futura troca (D9 da ADR-0007, portabilidade) seja legível em
 * dados antigos em vez de inferida por comprimento de string.
 */
export function contentDigest(value: unknown): string {
  const digest = createHash("sha256").update(canonicalBytes(value)).digest("hex");
  return `${DIGEST_PREFIX}${digest}`;
}

/**
 * Recomputa o digest de `value` e compara com o esperado. Comparação simples
 * de string: o digest é público (viaja no próprio bundle), então não há
 * segredo a proteger contra ataque de temporização aqui — a proteção
 * criptográfica está na assinatura sobre o digest, não no digest.
 */
export function matchesDigest(value: unknown, expectedDigest: string): boolean {
  return contentDigest(value) === expectedDigest;
}
