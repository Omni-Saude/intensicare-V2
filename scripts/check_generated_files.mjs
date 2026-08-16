#!/usr/bin/env node
/**
 * scripts/check_generated_files.mjs — gate de arquivos gerados (§15.1 item H
 * do INTENSICARE_V2_ORCHESTRATOR_PROMPT.md).
 *
 * PROBLEMA QUE ESTE GATE RESOLVE. Um artefato gerado e versionado é lido como
 * evidência ("o harness de conformidade produziu estes vereditos"), mas nada
 * garante que ele corresponda ao código atual. Basta alguém alterar a lógica e
 * esquecer de regenerar para que o repositório passe a carregar uma evidência
 * falsa — e falsa de um jeito difícil de perceber, porque o arquivo continua
 * plausível.
 *
 * COMO FUNCIONA. Regenera cada artefato declarado e falha se o resultado
 * diferir do que está versionado. Exige, portanto, que o gerador seja
 * DETERMINÍSTICO: nada de timestamp de execução, ordem de iteração instável ou
 * caminho absoluto no conteúdo. Quando um gerador não é determinístico, a
 * correção é tornar o gerador determinístico — não afrouxar este gate.
 *
 * Uso: node scripts/check_generated_files.mjs
 * Exit 0 se todos os artefatos estão em dia; 1 caso contrário.
 */

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Artefatos gerados e versionados. Cada entrada declara o comando que o
 * regenera e o caminho do arquivo, relativo à raiz do repositório.
 */
const GENERATED_ARTIFACTS = [
  {
    descricao: "Relatório de execução do harness de conformidade §7.6",
    comando: ["pnpm", ["--filter", "@intensicare/conformidade", "run", "report"]],
    caminho: "packages/conformidade/reports/relatorio-conformidade.md",
  },
];

function hashDoArquivo(caminhoAbsoluto) {
  return createHash("sha256").update(readFileSync(caminhoAbsoluto)).digest("hex");
}

/** Primeiras linhas divergentes entre duas versões, para diagnóstico em CI. */
function primeirasDiferencas(antes, depois, limite = 6) {
  const a = antes.split("\n");
  const b = depois.split("\n");
  const linhas = [];
  const total = Math.max(a.length, b.length);
  for (let i = 0; i < total && linhas.length < limite; i += 1) {
    if (a[i] !== b[i]) {
      linhas.push(`    linha ${i + 1}:`);
      linhas.push(`      versionado: ${JSON.stringify(a[i] ?? "<ausente>")}`);
      linhas.push(`      gerado:     ${JSON.stringify(b[i] ?? "<ausente>")}`);
    }
  }
  if (linhas.length === 0) {
    return "    (nenhuma linha difere — divergência de bytes invisível em texto: " +
      "fim de linha, BOM ou espaço final)";
  }
  return linhas.join("\n");
}

function main() {
  const problemas = [];

  for (const artefato of GENERATED_ARTIFACTS) {
    const caminhoAbsoluto = resolve(REPO_ROOT, artefato.caminho);

    if (!existsSync(caminhoAbsoluto)) {
      problemas.push(
        `${artefato.caminho}: declarado como artefato gerado, mas não existe no repositório.`,
      );
      continue;
    }

    // Comparação por CONTEÚDO, não por estado do git: a pergunta é "o arquivo
    // que está no repositório é igual ao que o gerador produz?", e a resposta
    // não deve depender de o arquivo estar staged, limpo ou recém-editado.
    const conteudoAntes = readFileSync(caminhoAbsoluto, "utf8");
    const hashAntes = hashDoArquivo(caminhoAbsoluto);

    const [cmd, args] = artefato.comando;
    try {
      execFileSync(cmd, args, { cwd: REPO_ROOT, stdio: "pipe" });
    } catch (erro) {
      problemas.push(
        `${artefato.caminho}: o comando de regeneração falhou (${cmd} ${args.join(" ")}): ${
          erro instanceof Error ? erro.message : String(erro)
        }`,
      );
      continue;
    }

    const hashDepois = hashDoArquivo(caminhoAbsoluto);
    if (hashAntes !== hashDepois) {
      // Mostrar as linhas que mudaram, não só os hashes: quando este gate
      // falha num runner de CI a que não se tem acesso interativo, um par de
      // hashes não diz NADA sobre a causa — e a causa costuma ser uma fonte
      // de não-determinismo sutil (ordem de diretório, locale, instante).
      problemas.push(
        `${artefato.caminho}: o arquivo versionado NÃO corresponde ao que o gerador produz agora ` +
          `(sha256 ${hashAntes.slice(0, 12)} → ${hashDepois.slice(0, 12)}).\n` +
          `${primeirasDiferencas(conteudoAntes, readFileSync(caminhoAbsoluto, "utf8"))}\n` +
          `    Regenere com \`${cmd} ${args.join(" ")}\` e comite o resultado. ` +
          `Se a diferença for um instante de geração, ordem de leitura de diretório, locale ou ` +
          `qualquer outra fonte de não-determinismo, corrija o GERADOR — um artefato ` +
          `indiferenciável não pode ser verificado.`,
      );
    }
  }

  if (problemas.length > 0) {
    console.error(
      `check_generated_files: ${problemas.length} artefato(s) gerado(s) fora de dia (§15.1 item H):\n`,
    );
    for (const p of problemas) console.error(`  - ${p}`);
    console.error(
      "\nArtefato gerado versionado é lido como evidência; se puder divergir do código em " +
        "silêncio, é evidência falsa.",
    );
    process.exit(1);
  }

  console.log(
    `check_generated_files: OK — ${GENERATED_ARTIFACTS.length} artefato(s) gerado(s) ` +
      "conferido(s) por regeneração, nenhum divergente (§15.1 item H).",
  );
}

main();
