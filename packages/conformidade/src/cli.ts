/**
 * CLI do harness: executa os 22 cenários + verificações semânticas e
 * escreve o relatório legível em `reports/relatorio-conformidade.md`,
 * imprimindo um resumo na saída padrão.
 *
 * Código de saída
 * ---------------
 * `1` quando o PIN LOCAL das fixtures reprova (fixture adulterada ou
 * ausente) ou quando algum cenário FALHA. Cenário `NÃO EXECUTÁVEL` **não**
 * reprova a execução: é o estado esperado enquanto a AMH não estiver
 * acessível, e o mapa pede "22/22 executados (não necessariamente verdes)
 * com relatório" — não pede verde.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { verdictLabel } from "./harness.js";
import { renderReport } from "./report.js";
import { runHarness } from "./runner.js";

const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REPORT_PATH = join(PACKAGE_ROOT, "reports", "relatorio-conformidade.md");

function main(): number {
  const report = runHarness();
  const rendered = renderReport(report);

  mkdirSync(dirname(REPORT_PATH), { recursive: true });
  writeFileSync(REPORT_PATH, rendered, "utf8");

  console.log(`harness §7.6 — pin local das fixtures: ${report.fixtures.status}`);
  console.log(
    `cenários: ${report.totals.scenarios} executados — ` +
      `${report.totals.passou} PASSOU, ${report.totals.falhou} FALHOU, ` +
      `${report.totals.naoExecutavel} NÃO EXECUTÁVEL`,
  );
  console.log(
    `verificações: ${report.totals.checksExecutados} executadas, ` +
      `${report.totals.checksBloqueados} bloqueadas`,
  );
  for (const scenario of report.scenarios) {
    console.log(`  ${scenario.id}: ${verdictLabel(scenario)} (cobertura ${scenario.coverage})`);
  }
  console.log(`relatório: ${REPORT_PATH}`);
  console.log(
    "LIMITE: nada aqui demonstra compatibilidade com a AMH, altera o achado " +
      '"candidato a integração" ou move a matriz 47/47.',
  );

  return report.fixtures.status === "divergente" || report.totals.falhou > 0 ? 1 : 0;
}

process.exitCode = main();
