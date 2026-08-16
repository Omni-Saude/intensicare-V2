/**
 * Renderização do relatório legível do harness §7.6.
 *
 * O relatório é gerado A PARTIR da execução — cada número vem de uma
 * contagem sobre os resultados, nunca de uma constante. Ele abre pelo que
 * NÃO prova, porque um relatório de conformidade lido de trás para frente
 * é exatamente como se produz uma alegação falsa de compatibilidade.
 */

import { CAUSE_LABELS, type CheckResult, type CheckStatus, verdictLabel } from "./harness.js";
import type { HarnessReport } from "./runner.js";
import type { SemanticCheckResult } from "./semantic-checks.js";

/**
 * Converte um caminho absoluto em caminho relativo à raiz do repositório.
 *
 * Detecta a raiz pelo segmento conhecido do próprio repositório; se não
 * encontrar (execução fora da árvore esperada), devolve apenas o trecho a
 * partir de `docs/`, e nunca o caminho absoluto.
 */
function caminhoRelativoAoRepo(caminhoAbsoluto: string): string {
  const marcadorDocs = caminhoAbsoluto.indexOf("/docs/");
  if (marcadorDocs >= 0) return caminhoAbsoluto.slice(marcadorDocs + 1);
  const marcadorPacotes = caminhoAbsoluto.indexOf("/packages/");
  if (marcadorPacotes >= 0) return caminhoAbsoluto.slice(marcadorPacotes + 1);
  return "<caminho fora da árvore do repositório>";
}

const CHECK_LABELS: Readonly<Record<CheckStatus, string>> = Object.freeze({
  passou: "PASSOU",
  falhou: "FALHOU",
  "nao-executavel": "NÃO EXECUTÁVEL",
});

function escapePipes(text: string): string {
  return text.replaceAll("|", "\\|");
}

function renderCheck(check: CheckResult): string {
  const cause = check.blockedBy === undefined ? "" : ` — causa: ${CAUSE_LABELS[check.blockedBy]}`;
  return [
    `- **${check.id} — ${CHECK_LABELS[check.status]}**${cause}`,
    `  - *Cláusula:* ${check.assertion}`,
    `  - *Evidência:* ${check.evidence}`,
  ].join("\n");
}

function renderSemantic(result: SemanticCheckResult): string {
  const lines = [
    `### Dimensão: ${result.dimension}`,
    "",
    `*Sujeito da verificação:* ${result.subject}`,
    "",
    ...result.checks.map(renderCheck),
    "",
  ];
  return lines.join("\n");
}

export function renderReport(report: HarnessReport): string {
  const { totals, fixtures, scenarios, semantics } = report;

  const lines: string[] = [];

  lines.push(
    "# Relatório de execução do harness de conformidade §7.6 — contrato AMH×IntensiCare v1",
  );
  lines.push("");
  // Sem timestamp de geração DE PROPÓSITO: este relatório é um artefato
  // gerado e versionado, verificado no CI por regeneração + `git diff
  // --exit-code` (§15.1 item H). Um instante autodeclarado mudaria a cada
  // execução e tornaria o arquivo indiferenciável — impossível de checar, e
  // portanto livre para divergir do código em silêncio. Quando o relatório
  // foi gerado é uma pergunta que o histórico do git responde com mais
  // autoridade do que o próprio arquivo.
  lines.push("*Artefato gerado por `@intensicare/conformidade` — não editar à mão.*");
  lines.push("");
  lines.push("## 0. O que este relatório NÃO é");
  lines.push("");
  lines.push(
    "1. **Não é evidência de compatibilidade com a AMH.** Nenhum cenário foi executado contra a " +
      "AMH: não existe sandbox pinado, não existe manifesto de contrato publicado " +
      "(`manifest_sha256: null`, `pinned: false`, `aceito: false`) e nenhum ambiente similar a " +
      "produção está provisionado. O achado permanece **candidato a integração**.",
  );
  lines.push(
    "2. **Não move a matriz de elegibilidade.** 47/47 permanecem inelegíveis; `Observation` da AMH " +
      "permanece não consumível; o *safety case* permanece M0; nenhuma via acionável foi aberta.",
  );
  lines.push(
    "3. **Não fecha gate, bloqueador, risco, hazard, ADR ou OS.** Em particular NÃO fecha o Gate " +
      "G3, cujas condições de dado povoado, ambiente similar a produção e falha/recuperação " +
      "dependem de camadas 2-4.",
  );
  lines.push(
    "4. **Não demonstra o comportamento do produto.** A camada anticorrupção exercitada é a " +
      "implementação de REFERÊNCIA deste harness; ligar o caminho de ingestão de produção " +
      "(`apps/api`) a estas verificações é trabalho pendente.",
  );
  lines.push(
    "5. **Nenhum dado real foi acessado.** Todas as fixtures são 100% sintéticas, com marcador " +
      "`SYNTH-`; o valor do identificador de fonte da fixture inválida NÃO é reproduzido em " +
      "lugar algum deste relatório.",
  );
  lines.push("");
  lines.push("## 1. Regra de veredito");
  lines.push("");
  lines.push(
    "Cada cenário foi decomposto nas cláusulas do seu *então*. Cláusula que é obrigação do " +
      "**consumidor** virou VERIFICAÇÃO executável; cláusula que é obrigação do **produtor** " +
      "(a AMH) ou que vive em outro pacote da V2 virou LIMITAÇÃO declarada — limitação **não** é " +
      "cláusula satisfeita.",
  );
  lines.push("");
  lines.push("- `FALHOU` — alguma verificação executada falhou.");
  lines.push("- `PASSOU` — **todas** as verificações foram executadas e passaram.");
  lines.push(
    "- `NÃO EXECUTÁVEL` — alguma verificação não pôde ser executada. **Cenário parcialmente " +
      "executado não passa.**",
  );
  lines.push("");
  lines.push(
    "A coluna *cobertura* é independente do veredito: `integral` só quando não há verificação " +
      "bloqueada **nem** limitação declarada.",
  );
  lines.push("");

  lines.push("## 2. Pin local das fixtures");
  lines.push("");
  lines.push(
    "Este pin é do conjunto de fixtures **do repositório** — coisa distinta do pin do pacote de " +
      "contrato publicado pela AMH, que CTS-22 exige e que não existe. Ele serve para que uma " +
      "fixture adulterada seja detectada em vez de mudar o veredito de um cenário em silêncio.",
  );
  lines.push("");
  // Caminho RELATIVO à raiz do repositório, nunca absoluto: um caminho
  // absoluto embutido num artefato versionado (a) muda conforme a máquina que
  // gerou — quebrando a verificação por regeneração — e (b) publica a
  // estrutura de diretórios e o nome de usuário de quem gerou, num arquivo
  // que vai para a `main`.
  lines.push(`Diretório: \`${caminhoRelativoAoRepo(fixtures.directory)}\``);
  lines.push("");
  lines.push(`**Estado do pin: ${fixtures.status.toUpperCase()}**`);
  lines.push("");
  lines.push("| Fixture | Papel | SHA-256 (12 primeiros) | Pin |");
  lines.push("|---|---|---|---|");
  for (const fixture of fixtures.fixtures) {
    lines.push(
      `| \`${fixture.fileName}\` | ${fixture.role} | \`${fixture.sha256.slice(0, 12) || "—"}\` | ` +
        `${fixture.pinStatus} |`,
    );
  }
  if (fixtures.divergences.length > 0) {
    lines.push("");
    lines.push("**Divergências:**");
    lines.push("");
    for (const divergence of fixtures.divergences) lines.push(`- ${divergence}`);
  }
  lines.push("");

  lines.push("## 3. Sumário");
  lines.push("");
  lines.push("| Métrica | Valor |");
  lines.push("|---|---:|");
  lines.push(`| Cenários executados (tentativa de execução) | ${totals.scenarios} |`);
  lines.push(`| PASSOU | ${totals.passou} |`);
  lines.push(`| FALHOU | ${totals.falhou} |`);
  lines.push(`| NÃO EXECUTÁVEL | ${totals.naoExecutavel} |`);
  lines.push(`| Verificações executadas (cenários + semântica) | ${totals.checksExecutados} |`);
  lines.push(`| Verificações bloqueadas | ${totals.checksBloqueados} |`);
  lines.push("");

  lines.push("## 4. Cenários — veredito por cenário");
  lines.push("");
  lines.push("| Cenário | Título | Veredito | Cobertura | Verificações (exec./total) |");
  lines.push("|---|---|---|---|---|");
  for (const scenario of scenarios) {
    const executed = scenario.checks.filter((c) => c.status !== "nao-executavel").length;
    lines.push(
      `| **${scenario.id}** | ${escapePipes(scenario.title)} | ${verdictLabel(scenario)} | ` +
        `${scenario.coverage} | ${executed}/${scenario.checks.length} |`,
    );
  }
  lines.push("");

  lines.push("## 5. Cenários — detalhe, evidência e limitações");
  lines.push("");
  for (const scenario of scenarios) {
    lines.push(`### ${scenario.id} — ${scenario.title}`);
    lines.push("");
    lines.push(
      `**Veredito: ${verdictLabel(scenario)}** · cobertura: ${scenario.coverage} · ` +
        `interfaces: ${scenario.interfaces.join(", ")} · exigência §7.6: ${scenario.requirement}`,
    );
    lines.push("");
    lines.push(`*Fixtures:* ${scenario.fixtures.map((f) => `\`${f}\``).join(", ")}`);
    if (scenario.hazards.length > 0) {
      lines.push("");
      lines.push(`*Controles/hazards citados na fonte:* ${scenario.hazards.join(", ")}`);
    }
    lines.push("");
    for (const check of scenario.checks) lines.push(renderCheck(check));
    if (scenario.limitations.length > 0) {
      lines.push("");
      lines.push("**Limitações declaradas (cláusulas NÃO satisfeitas por esta execução):**");
      lines.push("");
      for (const limitation of scenario.limitations) {
        lines.push(`- *(${CAUSE_LABELS[limitation.cause]})* ${limitation.statement}`);
      }
    }
    lines.push("");
  }

  lines.push("## 6. Verificações de semântica");
  lines.push("");
  if (semantics.length === 0) {
    lines.push(
      "Não executadas: o pin local das fixtures reprovou, e rodar verificação semântica contra " +
        "fixture adulterada produziria evidência sem valor.",
    );
    lines.push("");
  } else {
    for (const result of semantics) lines.push(renderSemantic(result));
  }

  lines.push("## 7. O que permanece bloqueado por terceiros");
  lines.push("");
  lines.push("| Bloqueio | Consequência para este harness |");
  lines.push("|---|---|");
  lines.push(
    "| Sandbox AMH pinado inexistente (SPR-G3-11) | nenhum cenário pode ser executado contra o " +
      "produtor; toda cláusula de produtor permanece indemonstrada |",
  );
  lines.push(
    "| IF-07 `resolve(ref, as_of)` não exposta | CTS-11, CTS-14, CTS-15, CTS-16 e SEM-RPL.4 ficam " +
      "sem o critério de aceitação declarado pelo contrato |",
  );
  lines.push(
    "| Manifesto de contrato não publicado (OS-19) | CTS-22 fica sem objeto: não há digest a " +
      "conferir |",
  );
  lines.push(
    "| Fixtures ausentes F-1, F-2, F-5, F-6, F-7 | CTS-03, CTS-06, CTS-17 (parcial), CTS-18 e " +
      "CTS-14/CTS-15 não têm insumo; nenhuma foi fabricada |",
  );
  lines.push(
    "| Ambiente similar a produção não provisionado | a condição do Gate G3 permanece " +
      "insatisfeita — o próprio manifesto registra que dev não a satisfaz |",
  );
  lines.push("");

  lines.push("---");
  lines.push("");
  lines.push(
    "*Nenhum cenário foi forçado a verde; nenhuma fixture foi criada ou alterada; nenhum " +
      "identificador real foi acessado ou reproduzido; nenhuma decisão foi registrada por este " +
      "relatório.*",
  );
  lines.push("");

  return lines.join("\n");
}
