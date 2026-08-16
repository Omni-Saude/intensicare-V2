/**
 * Testes que provam que O RELATÓRIO REFLETE A EXECUÇÃO.
 *
 * Um relatório de conformidade que não é derivado da execução é pior que
 * nenhum: é uma alegação. Estes testes cobrem três formas de o relatório
 * mentir, e provam que nenhuma delas passa:
 *
 * 1. **Total escrito à mão** — todos os totais são recontados a partir dos
 *    resultados e comparados.
 * 2. **Fixture adulterada absorvida** — uma cópia com um byte alterado
 *    reprova o pin e o relatório inteiro muda.
 * 3. **Cenário adulterado passando mesmo assim** — um cenário cuja fixture
 *    foi alterada NA SEMÂNTICA (com o pin recalculado, para contornar a
 *    defesa 2) precisa FALHAR, porque o comportamento observado deixou de
 *    corresponder à cláusula.
 */
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { verdictLabel } from "./harness.js";
import {
  DEFAULT_PINNED_FIXTURES_DIR,
  loadPinnedFixtures,
  PINNED_FIXTURE_DIGESTS,
  type PinnedFixture,
  type PinnedFixtureSet,
} from "./pinned-fixtures.js";
import { renderReport } from "./report.js";
import { runHarness } from "./runner.js";
import { runScenario, SCENARIOS } from "./scenarios.js";

const GENERATED_AT = "2026-08-16T00:00:00.000Z";
const temporaryDirectories: string[] = [];

afterAll(() => {
  for (const directory of temporaryDirectories) {
    rmSync(directory, { recursive: true, force: true });
  }
});

function tamperedFixturesDirectory(): string {
  const directory = mkdtempSync(join(tmpdir(), "conformidade-tampered-"));
  temporaryDirectories.push(directory);
  for (const fileName of Object.keys(PINNED_FIXTURE_DIGESTS)) {
    const raw = readFileSync(join(DEFAULT_PINNED_FIXTURES_DIR, fileName), "utf8");
    const content =
      fileName === "alias.valid.json" ? raw.replace("SYNTH-IDEM-ALIAS-0001", "SYNTH-X") : raw;
    writeFileSync(join(directory, fileName), content, "utf8");
  }
  return directory;
}

/**
 * Conjunto pinado FORJADO: o conteúdo de uma fixture é alterado e o digest
 * é recalculado para bater. Isto simula exatamente o ataque que o pin de
 * bytes não pega — e existe para provar que os cenários também detectam.
 */
function forgedFixtureSet(fileName: string, mutate: (raw: string) => string): PinnedFixtureSet {
  const base = loadPinnedFixtures();
  const fixtures: PinnedFixture[] = base.fixtures.map((fixture) => {
    if (fixture.fileName !== fileName) return fixture;
    const raw = mutate(fixture.raw);
    const sha256 = createHash("sha256").update(raw, "utf8").digest("hex");
    return { ...fixture, raw, sha256, expectedSha256: sha256, pinStatus: "conferido" };
  });
  return { directory: base.directory, fixtures, status: "conferido", divergences: [] };
}

describe("relatório derivado da execução", () => {
  const report = runHarness({ generatedAtUtc: GENERATED_AT });

  it("executa os 22 cenários do harness §7.6 — nem mais, nem menos", () => {
    expect(report.scenarios).toHaveLength(22);
    expect(report.scenarios.map((s) => s.id)).toEqual(
      Array.from({ length: 22 }, (_, index) => `CTS-${String(index + 1).padStart(2, "0")}`),
    );
    expect(report.totals.scenarios).toBe(22);
  });

  it("todos os totais são recontagens dos resultados, não constantes", () => {
    const { scenarios, semantics, totals } = report;
    expect(totals.passou).toBe(scenarios.filter((s) => s.verdict === "passou").length);
    expect(totals.falhou).toBe(scenarios.filter((s) => s.verdict === "falhou").length);
    expect(totals.naoExecutavel).toBe(
      scenarios.filter((s) => s.verdict === "nao-executavel").length,
    );
    expect(totals.passou + totals.falhou + totals.naoExecutavel).toBe(totals.scenarios);

    const allChecks = [
      ...scenarios.flatMap((s) => s.checks),
      ...semantics.flatMap((s) => s.checks),
    ];
    expect(totals.checksExecutados).toBe(
      allChecks.filter((c) => c.status !== "nao-executavel").length,
    );
    expect(totals.checksBloqueados).toBe(
      allChecks.filter((c) => c.status === "nao-executavel").length,
    );
    expect(totals.checksExecutados).toBeGreaterThan(0);
    expect(totals.checksBloqueados).toBeGreaterThan(0);
  });

  it("toda verificação bloqueada declara causa enumerada e evidência não vazia", () => {
    const allChecks = [
      ...report.scenarios.flatMap((s) => s.checks),
      ...report.semantics.flatMap((s) => s.checks),
    ];
    for (const check of allChecks) {
      expect(check.evidence.length).toBeGreaterThan(0);
      if (check.status === "nao-executavel") expect(check.blockedBy).toBeDefined();
      else expect(check.blockedBy).toBeUndefined();
    }
  });

  it("o texto renderizado carrega o veredito de CADA cenário, como computado", () => {
    const rendered = renderReport(report);
    for (const scenario of report.scenarios) {
      expect(rendered).toContain(`### ${scenario.id} — ${scenario.title}`);
      expect(rendered).toContain(`**Veredito: ${verdictLabel(scenario)}**`);
    }
    expect(rendered).toContain(`| PASSOU | ${report.totals.passou} |`);
    expect(rendered).toContain(`| FALHOU | ${report.totals.falhou} |`);
    expect(rendered).toContain(`| NÃO EXECUTÁVEL | ${report.totals.naoExecutavel} |`);
  });

  it("o relatório declara o limite duro antes de qualquer número", () => {
    const rendered = renderReport(report);
    const limitIndex = rendered.indexOf("Não é evidência de compatibilidade com a AMH");
    const summaryIndex = rendered.indexOf("## 3. Sumário");
    expect(limitIndex).toBeGreaterThan(-1);
    expect(limitIndex).toBeLessThan(summaryIndex);
    expect(rendered).toContain("candidato a integração");
    expect(rendered).toContain("47/47");
  });

  it("o relatório NÃO reproduz o valor do identificador de fonte da fixture inválida", () => {
    // O valor proibido é lido DA PRÓPRIA fixture, para que o teste continue
    // válido se a fixture mudar (e nunca vire uma constante desatualizada).
    const fixture = loadPinnedFixtures().fixtures.find(
      (f) => f.fileName === "erasure.identificador-de-fonte-cru.invalid.json",
    );
    const forbiddenValue = (JSON.parse(fixture?.raw ?? "{}") as Record<string, unknown>)
      .raw_source_identifier;
    expect(typeof forbiddenValue).toBe("string");

    const rendered = renderReport(report);
    expect(rendered).not.toContain(String(forbiddenValue));
    // O NOME do campo, sim: é o que torna a rejeição auditável.
    expect(rendered).toContain("raw_source_identifier");
  });
});

describe("detecção de adulteração", () => {
  it("fixture adulterada em BYTES reprova o pin e reprova os 22 cenários", () => {
    const tampered = runHarness({
      fixturesDirectory: tamperedFixturesDirectory(),
      generatedAtUtc: GENERATED_AT,
    });

    expect(tampered.fixtures.status).toBe("divergente");
    expect(tampered.totals.falhou).toBe(22);
    expect(tampered.totals.passou).toBe(0);
    // Verificação semântica não roda contra fixture adulterada.
    expect(tampered.semantics).toEqual([]);

    const rendered = renderReport(tampered);
    expect(rendered).toContain("**Estado do pin: DIVERGENTE**");
    expect(rendered).toContain("pin local REPROVADO");
    expect(rendered).toContain("alias.valid.json");
  });

  it("cenário adulterado na SEMÂNTICA falha mesmo com o pin recalculado", () => {
    // A fixture inválida ganha a `idempotency_key` que a torna inválida —
    // ou seja, o cenário CTS-07 deixa de ter o que quarentenar.
    const forged = forgedFixtureSet("alias.missing-idempotency-key.invalid.json", (raw) =>
      raw.replace(
        '"event_type_version": "1",',
        '"event_type_version": "1",\n  "idempotency_key": "SYNTH-IDEM-FORJADA",',
      ),
    );
    expect(forged.status).toBe("conferido");

    const definition = SCENARIOS.find((scenario) => scenario.id === "CTS-07");
    expect(definition).toBeDefined();
    if (!definition) return;

    const forgedResult = runScenario(definition, forged);
    expect(forgedResult.verdict).toBe("falhou");
    expect(forgedResult.checks.filter((c) => c.status === "falhou").length).toBeGreaterThan(0);

    // O mesmo cenário, contra a fixture pinada verdadeira, passa.
    expect(runScenario(definition, loadPinnedFixtures()).verdict).toBe("passou");
  });

  it("cenário adulterado no VALOR de tempo é detectado (CTS-09 deixa de quarentenar)", () => {
    const forged = forgedFixtureSet("unmerge.emissao-antes-do-fato.invalid.json", (raw) =>
      raw.replace('"emitted_at": "2026-08-15T16:59:00Z"', '"emitted_at": "2026-08-15T17:00:30Z"'),
    );
    const definition = SCENARIOS.find((scenario) => scenario.id === "CTS-09");
    expect(definition).toBeDefined();
    if (!definition) return;
    expect(runScenario(definition, forged).verdict).toBe("falhou");
  });
});
