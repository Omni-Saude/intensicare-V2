/**
 * apps/web/scripts/api-webserver.mjs — invólucro SUPERVISOR do webServer da
 * API no Playwright (achado MAJ-1: morte silenciosa do processo da API no
 * meio da suíte E2E, com zero texto capturado no `[WebServer]`).
 *
 * EVIDÊNCIA DA LINHAGEM DO DEFEITO (execução 1 da unidade 2, 2026-09-19):
 * com o comando antigo (`pnpm --filter @intensicare/api dev` → `tsx watch`),
 * o filho do `tsx watch` morreu no meio da suíte e o WATCHER SOBREVIVEU
 * ocioso — porta 3000 permanentemente fechada (ECONNREFUSED), zero linhas de
 * erro emitidas, e o `tsx watch` engolindo a morte do filho sem reiniciá-lo
 * nem anunciá-la. A morte ficava invisível em TRÊS camadas: o watcher não
 * fala, o pnpm não repassa, e o Playwright só mostra o sintoma (proxy error).
 *
 * POR ISTO ESTE SUPERVISOR EXISTE, e por isto ele NÃO usa watch:
 *
 *   1. COMANDO SEM WATCH. Quem chama passa o comando de API já sem watcher
 *      (`tsx src/index.ts`, não `tsx watch` — via argv, sem editar
 *      `apps/api/package.json`). Sem watch não há zumbi: quando o processo
 *      da API morre, a morte sobe IMEDIATAMENTE para cá.
 *   2. TEE. A saída padrão e de erro do processo da API vai para
 *      `apps/web/test-results/api-webserver.log` (já coberto pelo padrão
 *      `test-results/` do `.gitignore` — artefato gerado, não versionado) E
 *      para o stdout/stderr próprio, para o Playwright continuar capturando.
 *   3. CICLO DE VIDA REGISTRADO. Cada SPAWN/EXITED/RESTART vai ao log com
 *      data-hora, código ou SINAL — um SIGKILL (ex.: pressão de memória do
 *      macOS) deixa de ser um mistério e vira uma linha nomeada.
 *   4. REINÍCIO LIMITADO. Até MAX_REINICIOS reinícios com retardo, TODOS
 *      registrados: uma morte transitória não derruba a suíte inteira, e um
 *      loop de crash fica VISÍVEL no log — reiniciar não mascara, porque
 *      cada morte e cada reinício estão gravados, e o reinício ZERA o estado
 *      em memória da API (as sessões sintéticas morrem), o que os testes
 *      seguintes evidenciam como falha própria em vez de hang.
 *   5. DESLIGAMENTO LIMPO. SIGTERM/SIGINT propagam ao GRUPO do processo
 *      (sem órfão com a porta 3000 presa para a execução seguinte) e NÃO
 *      disparam reinício — desligamento intencional é desligamento.
 *
 * Este arquivo não muda código de aplicação e não é importado por nada fora
 * da configuração do Playwright.
 */
import { execFileSync, spawn } from "node:child_process";
import { appendFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const MAX_REINICIOS = 5;
const RETARDO_REINICIO_MS = 500;

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ_WEB = resolve(AQUI, "..");
const ARQUIVO_LOG = resolve(RAIZ_WEB, "test-results/api-webserver.log");

const agora = () => new Date().toISOString();
const registrar = (linha) => {
  appendFileSync(ARQUIVO_LOG, `${linha}\n`);
};

// Sintaxe: node api-webserver.mjs [--cwd <dir>] <comando> [args...]
const argumentos = process.argv.slice(2);
let cwdFilho = process.cwd();
if (argumentos[0] === "--cwd") {
  cwdFilho = resolve(process.cwd(), argumentos[1]);
  argumentos.splice(0, 2);
}
const comando = argumentos;
if (comando.length === 0) {
  process.stderr.write("uso: node api-webserver.mjs [--cwd <dir>] <comando> [args...]\n");
  process.exit(2);
}

// Node resolve caminho RELATIVO de executável contra o `cwd` do FILHO (não o
// daqui). Como `--cwd` muda o diretório do filho (apps/api), um caminho como
// `node_modules/.bin/tsx` precisaria existir lá — mas o tsx é dependência da
// RAIZ. Resolver contra o cwd do invólucro ANTES do spawn torna o comando
// imune a onde o filho vai rodar.
comando[0] = comando[0].includes("/") ? resolve(process.cwd(), comando[0]) : comando[0];

mkdirSync(dirname(ARQUIVO_LOG), { recursive: true });

let filho = null;
let encerrando = false;
let reinicios = 0;
let numeroSpawn = 0;

const iniciarFilho = () => {
  numeroSpawn += 1;
  registrar(
    `=== [${agora()}] API-WEBSERVER SPAWN #${numeroSpawn} cmd=${JSON.stringify(comando)} cwd=${cwdFilho} (reinicios=${reinicios}/${MAX_REINICIOS})`,
  );
  // `detached: true` cria grupo de processo próprio para a árvore do servidor,
  // permitindo derrubar TODA a árvore com o sinal negativo (ver `derrubarArvore`).
  filho = spawn(comando[0], comando.slice(1), {
    cwd: cwdFilho,
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
    detached: true,
  });

  const repassar = (origem, destino) => {
    origem.setEncoding("utf8");
    origem.on("data", (pedaco) => {
      destino.write(pedaco);
      appendFileSync(ARQUIVO_LOG, pedaco.endsWith("\n") ? pedaco : `${pedaco}\n`);
    });
  };
  repassar(filho.stdout, process.stdout);
  repassar(filho.stderr, process.stderr);

  // Falha em EXECUTAR (ex.: ENOENT) não passa por 'exit' — sem este handler o
  // invólucro inteiro morre com exceção não tratada e a suíte fica sem
  // supervisor nem log.
  filho.on("error", (erro) => {
    registrar(`=== [${agora()}] API-WEBSERVER ERRO_DE_EXECUCAO #${numeroSpawn}: ${erro.message}`);
    process.stderr.write(`[api-webserver] falha ao executar o comando da API: ${erro.message}\n`);
    process.exitCode = 1;
  });

  filho.on("exit", (codigo, sinal) => {
    const descricao = sinal !== null ? `sinal=${sinal}` : `codigo=${codigo}`;
    registrar(`=== [${agora()}] API-WEBSERVER EXITED #${numeroSpawn} ${descricao}`);

    if (encerrando) {
      process.exitCode = sinal !== null ? 128 + sinal : (codigo ?? 1);
      return;
    }

    if (reinicios < MAX_REINICIOS) {
      reinicios += 1;
      registrar(`=== [${agora()}] API-WEBSERVER RESTART #${reinicios} em ${RETARDO_REINICIO_MS}ms`);
      process.stderr.write(
        `[api-webserver] processo da API terminou (${descricao}); reinício ${reinicios}/${MAX_REINICIOS}; log: ${ARQUIVO_LOG}\n`,
      );
      setTimeout(iniciarFilho, RETARDO_REINICIO_MS);
      return;
    }

    registrar(
      `=== [${agora()}] API-WEBSERVER REINICIOS ESGOTADOS — entregando a falha ao Playwright`,
    );
    process.stderr.write(
      `[api-webserver] processo da API terminou (${descricao}) e os ${MAX_REINICIOS} reinícios se esgotaram; log: ${ARQUIVO_LOG}\n`,
    );
    process.exitCode = sinal !== null ? 128 + sinal : (codigo ?? 1);
  });
};

// Descendentes do filho, camada a camada. O `tsx` CLI spawn o servidor real
// com grupo PRÓPRIO (como este invólucro faz) — matar só o grupo do filho
// direto deixa o servidor neto vivo com a porta 3000 presa (provocado em
// fumaça em 2026-09-19). A varredura desce até 6 camadas por `pgrep -P`.
const descendentes = (raiz) => {
  const pids = [];
  const borda = [raiz];
  for (let profundidade = 0; profundidade < 6 && borda.length > 0; profundidade += 1) {
    const pai = borda.shift();
    try {
      const saida = execFileSync("pgrep", ["-P", String(pai)], { encoding: "utf8" });
      for (const linha of saida.split("\n")) {
        const pid = Number.parseInt(linha.trim(), 10);
        if (Number.isInteger(pid) && pid > 0 && !pids.includes(pid)) {
          pids.push(pid);
          borda.push(pid);
        }
      }
    } catch {
      // pgrep sai 1 sem filhos — camada sem descendentes, seguir.
    }
  }
  return pids;
};

const derrubarArvore = (sinal) => {
  encerrando = true;
  const pidFilho = filho?.pid;
  const arvore = pidFilho ? [pidFilho, ...descendentes(pidFilho)] : [];
  registrar(
    `=== [${agora()}] API-WEBSERVER SINAL_RECEBIDO ${sinal} — varrendo árvore [${pidFilho} + ${arvore.slice(1).join(", ")}] (sem reinício)`,
  );
  for (const pid of arvore) {
    try {
      process.kill(-pid, sinal);
    } catch {
      try {
        process.kill(pid, sinal);
      } catch {
        // já morto — nada a fazer
      }
    }
  }
  // Rede de segurança: o sinal de graça pode não bastar para quem ignora
  // SIGTERM; sem o SIGKILL de varredura, um sobrevivente fica com a porta.
  if (sinal !== "SIGKILL") {
    setTimeout(() => {
      for (const pid of arvore) {
        try {
          process.kill(pid, "SIGKILL");
        } catch {
          // já morto
        }
      }
    }, 1500);
  }
  // Desligamento intencional TERMINA o invólucro: confiar no dreno do event
  // loop deixou o processo vivo após propagar (provocado em fumaça).
  setTimeout(() => process.exit(sinal === "SIGKILL" ? 137 : 143), 2000);
};
process.on("SIGTERM", () => derrubarArvore("SIGTERM"));
process.on("SIGINT", () => derrubarArvore("SIGINT"));

iniciarFilho();
