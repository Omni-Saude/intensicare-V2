/**
 * Carregamento e PIN por digest das fixtures sintéticas da minuta do
 * contrato AMH×IntensiCare v1.
 *
 * As fixtures vivem em `docs/08-interoperability/amh-data/contract-v1/fixtures/`
 * e são a ÚNICA entrada de dados deste harness: nenhuma fixture nova é
 * criada aqui, e nenhum envelope da AMH é fabricado para fazer cenário
 * passar (§7.6; `cenarios-teste-consumidor.md` §1 e §5).
 *
 * Por que pinar por digest
 * ------------------------
 * `cenarios-teste-consumidor.md` CTS-22 exige, para o PACOTE DE CONTRATO
 * publicado pela AMH, que divergência de digest reprove o pacote inteiro.
 * Esse pacote NÃO existe (`contract-manifest.draft.yaml`:
 * `manifest_sha256: null`, `pinned: false`, `aceito: false`), logo CTS-22
 * permanece não executável. O pin implementado AQUI é OUTRA coisa, e o
 * relatório diz isso com todas as letras: é o pin LOCAL do conjunto de
 * fixtures do repositório, que existe para que uma fixture adulterada seja
 * detectada em vez de silenciosamente mudar o veredito de um cenário.
 *
 * PREMISSA (reversível, GDEC-0015/0017): os digests abaixo foram
 * calculados sobre os arquivos como estão no repositório em
 * 2026-08-16; re-pinar é ato deliberado (editar esta tabela), nunca efeito
 * colateral de editar uma fixture.
 */
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** Raiz do repositório, derivada da localização deste módulo. */
const PACKAGE_SRC_DIR = dirname(fileURLToPath(import.meta.url));

/**
 * Diretório das fixtures pinadas, relativo à raiz do repositório.
 *
 * Resolvido a partir de `src/` (execução via tsx/vitest) OU de `dist/`
 * (execução do build) — ambos estão a três níveis da raiz
 * (`packages/conformidade/<src|dist>`), então o mesmo cálculo serve.
 */
export const PINNED_FIXTURES_RELATIVE_DIR =
  "docs/08-interoperability/amh-data/contract-v1/fixtures";

export const REPOSITORY_ROOT = resolve(PACKAGE_SRC_DIR, "..", "..", "..");

export const DEFAULT_PINNED_FIXTURES_DIR = join(REPOSITORY_ROOT, PINNED_FIXTURES_RELATIVE_DIR);

/**
 * Nomes de arquivo e digests SHA-256 pinados. A lista é FECHADA: um
 * arquivo do diretório que não esteja aqui não é carregado (não vira
 * insumo silencioso), e um arquivo daqui que não esteja no disco é
 * divergência, não ausência tolerada.
 */
export const PINNED_FIXTURE_DIGESTS: Readonly<Record<string, string>> = Object.freeze({
  "alias.valid.json": "a7d86fe7aba7b49f8488ef855df169b19c17037c1ba659da2b4bb88f6b2bd5cf",
  "merge.valid.json": "dee7b2af4041ed784d53991a5f2f424bc47d123af4fb8a8aa6c66900edbaef29",
  "unmerge.valid.json": "f33b9dc04e29dfe611d96222b2ff6a245eb1b3d14adde64779ef3c8938c25b3a",
  "restore.valid.json": "bdd795529d4de717db2e8a989126ed2894d91eb21166a2fddbcf735b46635215",
  "reassignment.valid.json": "fafbb65e1f9efd6817cdd57f0f777d04727a2b248336cbebaca8da2b0af96d2d",
  "erasure.valid.json": "6c18650b529cb8c0e5d3d0aea28bce0024500507693c444947826c30a233f200",
  "alias.missing-idempotency-key.invalid.json":
    "320477e95ee391fa25ad551b5f68e5e44eab36fb73f41dff8770cf904e6cba65",
  "merge.ref-nova-igual-antiga.invalid.json":
    "6b6b306088f1f505949db0e62dfe8f003c31616575e68574e206fa29f05d69b8",
  "unmerge.emissao-antes-do-fato.invalid.json":
    "2cf2b716b3649f7c0ffbedbfda86a195f4691590da270108b93606046d6614a0",
  "erasure.identificador-de-fonte-cru.invalid.json":
    "6b60c268ee98c907157806c23ed695ec3803490b82fcbd4440a11fefa4ecca40",
});

/** Papel declarado de cada fixture (bloco `_fixture` do arquivo). */
export type FixtureRole = "valid" | "invalid";

export type FixturePinStatus = "conferido" | "divergente" | "ausente";

export interface PinnedFixture {
  readonly fileName: string;
  /** Conteúdo exatamente como lido do disco — nenhuma normalização. */
  readonly raw: string;
  readonly sha256: string;
  readonly expectedSha256: string;
  readonly pinStatus: FixturePinStatus;
  readonly role: FixtureRole | "indeterminado";
}

export interface PinnedFixtureSet {
  readonly directory: string;
  readonly fixtures: readonly PinnedFixture[];
  /** `divergente` se QUALQUER fixture divergir ou faltar (fail-closed). */
  readonly status: "conferido" | "divergente";
  readonly divergences: readonly string[];
}

function sha256(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

function readRoleFromRaw(raw: string): FixtureRole | "indeterminado" {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed !== null && typeof parsed === "object" && "_fixture" in parsed) {
      const block = (parsed as { _fixture?: unknown })._fixture;
      if (block !== null && typeof block === "object" && "role" in block) {
        const role = (block as { role?: unknown }).role;
        if (role === "valid" || role === "invalid") return role;
      }
    }
  } catch {
    return "indeterminado";
  }
  return "indeterminado";
}

/**
 * Carrega o conjunto pinado. NUNCA lança por divergência de digest: a
 * divergência é um RESULTADO que o relatório precisa exibir (um harness
 * que morre no carregamento não produz relatório). Erro de leitura de um
 * arquivo pinado vira `pinStatus: "ausente"`.
 */
export function loadPinnedFixtures(options?: { readonly directory?: string }): PinnedFixtureSet {
  const directory = options?.directory ?? DEFAULT_PINNED_FIXTURES_DIR;
  const fixtures: PinnedFixture[] = [];
  const divergences: string[] = [];

  for (const [fileName, expectedSha256] of Object.entries(PINNED_FIXTURE_DIGESTS)) {
    let raw: string;
    try {
      raw = readFileSync(join(directory, fileName), "utf8");
    } catch {
      fixtures.push({
        fileName,
        raw: "",
        sha256: "",
        expectedSha256,
        pinStatus: "ausente",
        role: "indeterminado",
      });
      divergences.push(
        `${fileName}: fixture pinada AUSENTE em ${directory} — o conjunto pinado é fechado; ` +
          `ausência é divergência, não tolerância.`,
      );
      continue;
    }
    const digest = sha256(raw);
    const pinStatus: FixturePinStatus = digest === expectedSha256 ? "conferido" : "divergente";
    if (pinStatus === "divergente") {
      divergences.push(
        `${fileName}: digest calculado ${digest} diverge do pinado ${expectedSha256} — ` +
          `a fixture foi alterada depois do pin. Re-pinar é ato deliberado ` +
          `(PINNED_FIXTURE_DIGESTS), jamais efeito colateral.`,
      );
    }
    fixtures.push({
      fileName,
      raw,
      sha256: digest,
      expectedSha256,
      pinStatus,
      role: readRoleFromRaw(raw),
    });
  }

  // Fixture NOVA no diretório, ausente do pin, também é divergência: um
  // insumo que entra em silêncio é exatamente o que o pin existe para
  // impedir (fail-closed nos dois sentidos — falta e sobra).
  try {
    for (const entry of readdirSync(directory)) {
      if (!entry.endsWith(".json")) continue;
      if (entry in PINNED_FIXTURE_DIGESTS) continue;
      divergences.push(
        `${entry}: arquivo .json presente em ${directory} e AUSENTE do pin — ` +
          `o conjunto pinado é fechado; pinar uma fixture nova é ato deliberado.`,
      );
    }
  } catch {
    divergences.push(
      `${directory}: diretório de fixtures ilegível — nenhum insumo pode ser conferido.`,
    );
  }

  return {
    directory,
    fixtures,
    status: divergences.length === 0 ? "conferido" : "divergente",
    divergences,
  };
}

/** Recupera uma fixture pelo nome de arquivo; lança se o nome não é pinado. */
export function fixtureByName(set: PinnedFixtureSet, fileName: string): PinnedFixture {
  const found = set.fixtures.find((f) => f.fileName === fileName);
  if (!found) {
    throw new Error(
      `Fixture "${fileName}" não pertence ao conjunto pinado. ` +
        `Cenário que precise dela deve ser reportado como NÃO EXECUTÁVEL, ` +
        `nunca satisfeito com fixture inventada.`,
    );
  }
  return found;
}
