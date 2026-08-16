/**
 * Executor do harness §7.6: carrega as fixtures pinadas, executa os 22
 * cenários e as verificações semânticas, e devolve um relatório-modelo que
 * o renderizador (`report.ts`) transforma em texto legível.
 *
 * O relatório é DERIVADO da execução, sempre. Nenhum total é escrito à
 * mão, nenhum veredito é constante — um teste do pacote prova exatamente
 * isso, inclusive que uma fixture adulterada muda o relatório.
 */
import type { CheckStatus, ScenarioResult, ScenarioVerdict } from "./harness.js";
import { loadPinnedFixtures, type PinnedFixtureSet } from "./pinned-fixtures.js";
import { runAllScenarios } from "./scenarios.js";
import { runSemanticChecks, type SemanticCheckResult } from "./semantic-checks.js";

export interface HarnessTotals {
  readonly scenarios: number;
  readonly passou: number;
  readonly falhou: number;
  readonly naoExecutavel: number;
  readonly checksExecutados: number;
  readonly checksBloqueados: number;
}

export interface HarnessReport {
  readonly generatedAtUtc: string;
  readonly fixtures: PinnedFixtureSet;
  readonly scenarios: readonly ScenarioResult[];
  readonly semantics: readonly SemanticCheckResult[];
  readonly totals: HarnessTotals;
}

function countVerdict(scenarios: readonly ScenarioResult[], verdict: ScenarioVerdict): number {
  return scenarios.filter((s) => s.verdict === verdict).length;
}

function countChecks(
  scenarios: readonly ScenarioResult[],
  semantics: readonly SemanticCheckResult[],
  predicate: (status: CheckStatus) => boolean,
): number {
  const scenarioChecks = scenarios.flatMap((s) => s.checks);
  const semanticChecks = semantics.flatMap((s) => s.checks);
  return [...scenarioChecks, ...semanticChecks].filter((c) => predicate(c.status)).length;
}

export interface RunOptions {
  /** Diretório de fixtures (os testes apontam para uma cópia adulterada). */
  readonly fixturesDirectory?: string;
  /** Instante de geração, injetável para tornar o relatório determinístico. */
  readonly generatedAtUtc?: string;
}

export function runHarness(options?: RunOptions): HarnessReport {
  const fixtures = loadPinnedFixtures(
    options?.fixturesDirectory === undefined ? {} : { directory: options.fixturesDirectory },
  );
  const scenarios = runAllScenarios(fixtures);
  // As verificações semânticas dependem das MESMAS fixtures pinadas: se o
  // pin reprovou, elas não são executadas (rodar contra fixture adulterada
  // produziria evidência sem valor).
  const semantics: readonly SemanticCheckResult[] =
    fixtures.status === "conferido" ? runSemanticChecks(fixtures) : [];

  return {
    generatedAtUtc: options?.generatedAtUtc ?? new Date().toISOString(),
    fixtures,
    scenarios,
    semantics,
    totals: {
      scenarios: scenarios.length,
      passou: countVerdict(scenarios, "passou"),
      falhou: countVerdict(scenarios, "falhou"),
      naoExecutavel: countVerdict(scenarios, "nao-executavel"),
      checksExecutados: countChecks(
        scenarios,
        semantics,
        (status) => status === "passou" || status === "falhou",
      ),
      checksBloqueados: countChecks(scenarios, semantics, (status) => status === "nao-executavel"),
    },
  };
}
