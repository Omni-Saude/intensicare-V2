#!/usr/bin/env node
/**
 * pg-efemero.mjs — provisiona um PostgreSQL EFÊMERO, vendor-neutral, para a
 * suíte de fronteira de isolamento de dados (`packages/persistencia/src/postgres`).
 *
 * POR QUE ESTE ARQUIVO EXISTE
 * ---------------------------
 * A RLS por tenant deste repositório só é uma fronteira de segurança se for
 * verificada contra um servidor PostgreSQL REAL, com uma IDENTIDADE DE
 * CONEXÃO real: PGlite (o simulador WASM usado em dev/teste) tem uma conexão
 * única cujo usuário autenticado é superusuário, e nessa topologia
 * `SET SESSION AUTHORIZATION` devolve o superusuário — o que anula a RLS
 * (ACHADO-01, ADR-0016 §4.1, THR-0050). Generalizar RLS de PGlite para
 * produção é anti-padrão explícito do contrato de agentes (§6 item 6).
 *
 * Este utilitário é deliberadamente NEUTRO quanto a fornecedor e a nuvem:
 * ele não escolhe provedor gerenciado, região nem residência de dados
 * (decisões do titular, fora do alcance de qualquer agente). Ele apenas
 * garante que existe *algum* PostgreSQL utilizável e devolve a URL de
 * superusuário para quem for provisionar papéis e esquema — o
 * provisionamento de papéis/migrações vive em
 * `packages/persistencia/src/postgres/provisionamento.ts`, não aqui.
 *
 * DEPENDÊNCIAS: apenas `initdb` e `pg_ctl` (nem `psql` é exigido — todo SQL é
 * executado pelo cliente do pacote de persistência). Nenhuma dependência npm.
 *
 * MODO DE USO
 * -----------
 *   node scripts/pg-efemero.mjs [up|down|status|help] [opções]
 *
 * Comandos:
 *   up      (padrão) garante um PostgreSQL utilizável; imprime JSON na stdout.
 *           Idempotente: se o cluster do diretório-alvo já estiver de pé, reusa.
 *   down    derruba e APAGA o cluster efêmero referido pelo estado gravado.
 *   status  imprime o JSON do estado atual sem criar nada.
 *   help    imprime esta interface.
 *
 * Opções:
 *   --dir <caminho>   diretório-base do cluster (padrão: $PG_EFEMERO_DIR, ou
 *                     um diretório novo sob o temporário do sistema).
 *   --porta <n>       porta TCP fixa (padrão: $PG_EFEMERO_PORTA, ou uma porta
 *                     livre sorteada).
 *   --shell           imprime linhas `CHAVE=valor` (para `eval`/`$GITHUB_ENV`)
 *                     em vez de JSON.
 *   --silencioso      suprime o log humano da stderr.
 *
 * Variáveis de ambiente lidas:
 *   PG_TEST_URL       se definida, NENHUM cluster é criado: a URL é devolvida
 *   DATABASE_URL      como servidor pré-existente (`efemero: false`).
 *                     `PG_TEST_URL` tem precedência sobre `DATABASE_URL`.
 *                     É este o caminho usado por `services: postgres` no CI.
 *   PG_EFEMERO_DIR    diretório-base do cluster (equivale a `--dir`).
 *   PG_EFEMERO_PORTA  porta TCP fixa (equivale a `--porta`).
 *   PG_BIN_DIR        diretório dos binários PostgreSQL (`initdb`, `pg_ctl`).
 *   PGBIN             idem, alternativa aceita.
 *
 * Saída de `up`/`status` (stdout, JSON de UMA linha):
 *   {
 *     "disponivel": true,
 *     "efemero": true,                  // false quando reusa PG_TEST_URL/DATABASE_URL
 *     "urlSuperusuario": "postgresql://postgres:SENHA@127.0.0.1:PORTA/postgres",
 *     "host": "127.0.0.1",
 *     "porta": 54321,
 *     "banco": "postgres",              // banco de manutenção; o banco da aplicação
 *                                       // é criado pelo provisionamento, não aqui
 *     "usuario": "postgres",
 *     "diretorioBase": "/tmp/...",      // null quando não efêmero
 *     "diretorioDados": "/tmp/.../data",
 *     "diretorioSocket": "/tmp/icpg-xxxx",
 *     "arquivoLog": "/tmp/.../postgres.log",
 *     "versaoServidor": "16.14",
 *     "motivoIndisponivel": null,
 *     "instrucoes": []
 *   }
 * Quando indisponível, `disponivel` é false, `motivoIndisponivel` traz a causa
 * e `instrucoes` traz os comandos exatos de provisionamento por plataforma.
 *
 * O log humano vai para a STDERR; a stdout carrega SÓ a saída legível por
 * máquina, para que `node scripts/pg-efemero.mjs up | jq` funcione.
 *
 * Códigos de saída:
 *   0  sucesso (cluster de pé, ou servidor pré-existente confirmado)
 *   3  PostgreSQL INDISPONÍVEL (binários ausentes / execução como root sem URL).
 *      A stdout ainda traz o JSON com `disponivel:false` e `instrucoes`.
 *   4  falha ao INICIAR ou PARAR o cluster (binários existem, mas algo quebrou);
 *      `arquivoLog` no JSON aponta o log do servidor.
 *   5  uso inválido (comando/opção desconhecidos).
 *
 * SEGURANÇA DESTE CLUSTER (relevante para a suíte que o consome):
 * `initdb` roda com `--auth-host=scram-sha-256`, e a senha do superusuário é
 * aleatória (24 bytes) e vive apenas no estado local do cluster. Isso é
 * deliberado: se as conexões TCP fossem `trust`, o papel de aplicação poderia
 * simplesmente ABRIR UMA CONEXÃO NOVA como superusuário, e a afirmação "a
 * identidade da aplicação não recupera superusuário" seria vazia. Com SCRAM,
 * a suíte pode provar também que a credencial da aplicação NÃO autentica como
 * superusuário. O acesso por socket local segue `trust` porque o socket vive
 * num diretório do próprio usuário e nunca é usado pela suíte.
 *
 * Este cluster jamais deve receber dado real: ele existe para dados 100%
 * sintéticos (prefixo `SYNTH-`, política GDEC-0014) e é apagado ao final.
 */

import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { createConnection, createServer } from "node:net";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

/** Nome do arquivo de estado dentro do diretório-base do cluster. */
const ARQUIVO_ESTADO = "estado.json";

/**
 * Ponteiro de nível de máquina para o último diretório-base criado. Existe
 * para que `down` funcione SEM argumentos, em outro processo, depois de um
 * `up` — o caso de uso de CI (um passo sobe, outro derruba).
 */
const PONTEIRO_GLOBAL = join(tmpdir(), "intensicare-pg-efemero.json");

/**
 * Diretórios candidatos a conter `initdb`/`pg_ctl` quando não estão no PATH.
 * Lista deliberadamente ampla e ordenada da versão mais nova para a mais
 * antiga; não é uma escolha de fornecedor, é descoberta de binário local.
 */
const CANDIDATOS_BIN = [
  "/opt/homebrew/opt/postgresql@18/bin",
  "/opt/homebrew/opt/postgresql@17/bin",
  "/opt/homebrew/opt/postgresql@16/bin",
  "/opt/homebrew/opt/postgresql@15/bin",
  "/opt/homebrew/bin",
  "/usr/local/opt/postgresql@18/bin",
  "/usr/local/opt/postgresql@17/bin",
  "/usr/local/opt/postgresql@16/bin",
  "/usr/local/opt/postgresql@15/bin",
  "/usr/local/bin",
  "/usr/lib/postgresql/18/bin",
  "/usr/lib/postgresql/17/bin",
  "/usr/lib/postgresql/16/bin",
  "/usr/lib/postgresql/15/bin",
  "/usr/pgsql-18/bin",
  "/usr/pgsql-17/bin",
  "/usr/pgsql-16/bin",
  "/usr/pgsql-15/bin",
  "/usr/bin",
];

/** Instruções de provisionamento — impressas quando o PostgreSQL falta. */
const INSTRUCOES_PROVISIONAMENTO = [
  "macOS (Homebrew):        brew install postgresql@16",
  "Debian/Ubuntu:           sudo apt-get install -y postgresql-16",
  "GitHub Actions:          use `services: postgres` e exporte PG_TEST_URL",
  "Qualquer servidor já existente: exporte PG_TEST_URL=postgresql://usuario:senha@host:porta/postgres",
  "O usuário de PG_TEST_URL precisa ser superusuário (o provisionamento cria papéis e banco).",
];

let silencioso = false;

/** Log humano — SEMPRE na stderr, para não contaminar a saída de máquina. */
function log(mensagem) {
  if (!silencioso) {
    process.stderr.write(`[pg-efemero] ${mensagem}\n`);
  }
}

function ehExecutavel(caminho) {
  try {
    return statSync(caminho).isFile();
  } catch {
    return false;
  }
}

/**
 * Localiza o diretório de binários do PostgreSQL. Ordem: `PG_BIN_DIR`/`PGBIN`
 * (explícito vence), depois o PATH, depois os candidatos conhecidos.
 * Devolve `null` quando nada serve — indisponibilidade é resultado válido.
 */
function localizarBinarios(ambiente) {
  const explicito = ambiente.PG_BIN_DIR ?? ambiente.PGBIN;
  const listaPath = (ambiente.PATH ?? "").split(":").filter((p) => p.length > 0);
  const candidatos = explicito ? [explicito] : [...listaPath, ...CANDIDATOS_BIN];

  for (const dir of candidatos) {
    const initdb = join(dir, "initdb");
    const pgCtl = join(dir, "pg_ctl");
    if (ehExecutavel(initdb) && ehExecutavel(pgCtl)) {
      return { dir, initdb, pgCtl };
    }
  }
  return null;
}

function versaoDoBinario(caminhoInitdb) {
  const r = spawnSync(caminhoInitdb, ["--version"], { encoding: "utf-8" });
  const texto = `${r.stdout ?? ""}`.trim();
  const casamento = /(\d+\.\d+)/.exec(texto);
  return casamento ? casamento[1] : texto;
}

/** Sorteia uma porta TCP livre em 127.0.0.1 (bind em 0 e leitura do resultado). */
function sortearPortaLivre() {
  return new Promise((cumprir, rejeitar) => {
    const servidor = createServer();
    servidor.on("error", rejeitar);
    servidor.listen(0, "127.0.0.1", () => {
      const endereco = servidor.address();
      const porta = endereco && typeof endereco === "object" ? endereco.port : 0;
      servidor.close(() => cumprir(porta));
    });
  });
}

/** Espera a porta aceitar conexão TCP; devolve true/false sem lançar. */
function aguardarTcp(host, porta, limiteMs) {
  const fim = Date.now() + limiteMs;
  return new Promise((cumprir) => {
    const tentar = () => {
      const soquete = createConnection({ host, port: porta });
      soquete.setTimeout(1_000);
      soquete.on("connect", () => {
        soquete.destroy();
        cumprir(true);
      });
      const falhar = () => {
        soquete.destroy();
        if (Date.now() >= fim) {
          cumprir(false);
          return;
        }
        setTimeout(tentar, 150);
      };
      soquete.on("error", falhar);
      soquete.on("timeout", falhar);
    };
    tentar();
  });
}

function lerJson(caminho) {
  try {
    return JSON.parse(readFileSync(caminho, "utf-8"));
  } catch {
    return null;
  }
}

function gravarJson(caminho, valor) {
  writeFileSync(caminho, `${JSON.stringify(valor, null, 2)}\n`, { mode: 0o600 });
}

/** Resposta padrão de indisponibilidade — o formato é parte do contrato do script. */
function respostaIndisponivel(motivo) {
  return {
    disponivel: false,
    efemero: false,
    urlSuperusuario: null,
    host: null,
    porta: null,
    banco: null,
    usuario: null,
    diretorioBase: null,
    diretorioDados: null,
    diretorioSocket: null,
    arquivoLog: null,
    versaoServidor: null,
    motivoIndisponivel: motivo,
    instrucoes: INSTRUCOES_PROVISIONAMENTO,
  };
}

/**
 * Monta a resposta para um servidor PRÉ-EXISTENTE apontado por
 * `PG_TEST_URL`/`DATABASE_URL`. Não tenta adivinhar nada da URL além do que a
 * própria URL diz — e não a valida por conexão, porque validar exigiria um
 * cliente SQL: quem consome a URL (o pacote de persistência) falha alto se ela
 * não servir, com a mensagem do próprio servidor.
 */
function respostaUrlExterna(url, origem) {
  let analisada;
  try {
    analisada = new URL(url);
  } catch {
    return respostaIndisponivel(`${origem} não é uma URL válida`);
  }
  const banco = analisada.pathname.replace(/^\//, "") || "postgres";
  return {
    disponivel: true,
    efemero: false,
    urlSuperusuario: url,
    host: analisada.hostname,
    porta: analisada.port ? Number(analisada.port) : 5432,
    banco,
    usuario: decodeURIComponent(analisada.username) || "postgres",
    diretorioBase: null,
    diretorioDados: null,
    diretorioSocket: null,
    arquivoLog: null,
    versaoServidor: null,
    motivoIndisponivel: null,
    instrucoes: [],
    origem,
  };
}

/**
 * Diretório do socket Unix. Precisa ser CURTO: o caminho do socket
 * (`<dir>/.s.PGSQL.<porta>`) tem limite de ~103 bytes em macOS/BSD, e o
 * temporário do macOS (`/var/folders/…`) já consome quase tudo. Por isso o
 * socket vai para `/tmp` quando `/tmp` é utilizável, e só cai para dentro do
 * diretório-base como último recurso.
 */
function escolherDiretorioSocket(diretorioBase, sufixo) {
  const curto = `/tmp/icpg-${sufixo}`;
  try {
    mkdirSync(curto, { recursive: true, mode: 0o700 });
    return curto;
  } catch {
    const alternativo = join(diretorioBase, "sock");
    mkdirSync(alternativo, { recursive: true, mode: 0o700 });
    return alternativo;
  }
}

/** `pg_ctl status` — true quando o cluster do diretório está de pé. */
function clusterDePe(pgCtl, diretorioDados) {
  if (!existsSync(join(diretorioDados, "PG_VERSION"))) {
    return false;
  }
  const r = spawnSync(pgCtl, ["-D", diretorioDados, "status"], { encoding: "utf-8" });
  return r.status === 0;
}

function opcoesDoServidor(porta, diretorioSocket) {
  // `fsync=off`/`synchronous_commit=off`/`full_page_writes=off`: este cluster é
  // descartável e nunca guarda dado real — durabilidade após queda é
  // irrelevante e custa segundos por caso de teste.
  return [
    `-p ${porta}`,
    `-k ${diretorioSocket}`,
    "-h 127.0.0.1",
    "-c fsync=off",
    "-c synchronous_commit=off",
    "-c full_page_writes=off",
    "-c max_connections=50",
    "-c log_min_messages=warning",
  ].join(" ");
}

async function comandoUp(opcoes, ambiente) {
  const urlExterna = ambiente.PG_TEST_URL ?? ambiente.DATABASE_URL;
  if (urlExterna) {
    const origem = ambiente.PG_TEST_URL ? "PG_TEST_URL" : "DATABASE_URL";
    log(`reusando servidor pré-existente de ${origem} (nenhum cluster criado)`);
    const resposta = respostaUrlExterna(urlExterna, origem);
    return { resposta, codigo: resposta.disponivel ? 0 : 3 };
  }

  if (typeof process.getuid === "function" && process.getuid() === 0) {
    // `initdb` recusa rodar como root. Em container de CI isso é comum; a saída
    // correta é apontar PG_TEST_URL para um serviço, não contornar.
    return {
      resposta: respostaIndisponivel(
        "execução como root: initdb recusa rodar como root; use PG_TEST_URL apontando para um servidor",
      ),
      codigo: 3,
    };
  }

  const binarios = localizarBinarios(ambiente);
  if (!binarios) {
    return {
      resposta: respostaIndisponivel(
        "binários initdb/pg_ctl não encontrados no PATH nem em PG_BIN_DIR/PGBIN",
      ),
      codigo: 3,
    };
  }

  const sufixo = randomBytes(4).toString("hex");
  // Reuso idempotente entre PROCESSOS: sem `--dir`/`PG_EFEMERO_DIR` explícito,
  // o ponteiro de máquina é consultado ANTES de sortear um diretório novo —
  // senão `up` duas vezes deixaria dois clusters órfãos, e o contrato de CI
  // ("um passo sobe, outro derruba") não fecharia.
  const dirExplicito = opcoes.dir ?? ambiente.PG_EFEMERO_DIR;
  const dirDoPonteiro = dirExplicito ? null : (lerJson(PONTEIRO_GLOBAL)?.diretorioBase ?? null);
  const diretorioBase = resolve(
    dirExplicito ?? dirDoPonteiro ?? join(tmpdir(), `intensicare-pg-${sufixo}`),
  );
  const diretorioDados = join(diretorioBase, "data");
  const arquivoLog = join(diretorioBase, "postgres.log");
  const caminhoEstado = join(diretorioBase, ARQUIVO_ESTADO);
  const versaoServidor = versaoDoBinario(binarios.initdb);

  if (clusterDePe(binarios.pgCtl, diretorioDados)) {
    const estado = lerJson(caminhoEstado);
    if (estado) {
      log(`cluster já de pé em ${diretorioDados} (porta ${estado.porta}) — reusando`);
      gravarJson(PONTEIRO_GLOBAL, { diretorioBase });
      return { resposta: { ...estado, versaoServidor, criado: false }, codigo: 0 };
    }
  }

  mkdirSync(diretorioBase, { recursive: true, mode: 0o700 });
  const diretorioSocket = escolherDiretorioSocket(diretorioBase, sufixo);
  const porta = Number(opcoes.porta ?? ambiente.PG_EFEMERO_PORTA ?? (await sortearPortaLivre()));
  const senha = randomBytes(24).toString("base64url");

  if (!existsSync(join(diretorioDados, "PG_VERSION"))) {
    const arquivoSenha = join(diretorioBase, "senha-inicial");
    writeFileSync(arquivoSenha, senha, { mode: 0o600 });
    chmodSync(arquivoSenha, 0o600);
    log(`initdb em ${diretorioDados} (PostgreSQL ${versaoServidor})`);
    const r = spawnSync(
      binarios.initdb,
      [
        "-D",
        diretorioDados,
        "-U",
        "postgres",
        "--auth-local=trust",
        "--auth-host=scram-sha-256",
        `--pwfile=${arquivoSenha}`,
        "--encoding=UTF8",
        "--locale=C",
        "--no-sync",
      ],
      { encoding: "utf-8" },
    );
    rmSync(arquivoSenha, { force: true });
    if (r.status !== 0) {
      log(`initdb falhou: ${(r.stderr ?? "").trim()}`);
      return {
        resposta: {
          ...respostaIndisponivel(`initdb falhou (código ${r.status})`),
          diretorioBase,
          diretorioDados,
          detalhe: (r.stderr ?? "").trim(),
        },
        codigo: 4,
      };
    }
  }

  log(`iniciando servidor em 127.0.0.1:${porta}`);
  const inicio = spawnSync(
    binarios.pgCtl,
    [
      "-D",
      diretorioDados,
      "-l",
      arquivoLog,
      "-w",
      "-t",
      "60",
      "-o",
      opcoesDoServidor(porta, diretorioSocket),
      "start",
    ],
    { encoding: "utf-8" },
  );
  if (inicio.status !== 0) {
    const cauda = existsSync(arquivoLog) ? readFileSync(arquivoLog, "utf-8").slice(-2_000) : "";
    log(`pg_ctl start falhou: ${(inicio.stderr ?? "").trim()}`);
    return {
      resposta: {
        ...respostaIndisponivel(`pg_ctl start falhou (código ${inicio.status})`),
        diretorioBase,
        diretorioDados,
        arquivoLog,
        detalhe: cauda,
      },
      codigo: 4,
    };
  }

  const pronto = await aguardarTcp("127.0.0.1", porta, 30_000);
  if (!pronto) {
    return {
      resposta: {
        ...respostaIndisponivel(`servidor não aceitou conexão TCP em 127.0.0.1:${porta}`),
        diretorioBase,
        diretorioDados,
        arquivoLog,
      },
      codigo: 4,
    };
  }

  const resposta = {
    disponivel: true,
    efemero: true,
    urlSuperusuario: `postgresql://postgres:${encodeURIComponent(senha)}@127.0.0.1:${porta}/postgres`,
    host: "127.0.0.1",
    porta,
    banco: "postgres",
    usuario: "postgres",
    diretorioBase,
    diretorioDados,
    diretorioSocket,
    arquivoLog,
    versaoServidor,
    motivoIndisponivel: null,
    instrucoes: [],
    // `criado: true` diz ao consumidor que ESTE processo trouxe o cluster à
    // existência — quem reusa um cluster alheio não deve derrubá-lo no fim.
    criado: true,
  };
  gravarJson(caminhoEstado, resposta);
  gravarJson(PONTEIRO_GLOBAL, { diretorioBase });
  log(`pronto: PostgreSQL ${versaoServidor} em 127.0.0.1:${porta} (efêmero)`);
  return { resposta, codigo: 0 };
}

function resolverDiretorioBase(opcoes, ambiente) {
  const explicito = opcoes.dir ?? ambiente.PG_EFEMERO_DIR;
  if (explicito) {
    return resolve(explicito);
  }
  const ponteiro = lerJson(PONTEIRO_GLOBAL);
  return ponteiro?.diretorioBase ?? null;
}

function comandoDown(opcoes, ambiente) {
  const diretorioBase = resolverDiretorioBase(opcoes, ambiente);
  if (!diretorioBase || !existsSync(diretorioBase)) {
    log("nenhum cluster efêmero conhecido para derrubar (nada a fazer)");
    return {
      resposta: { derrubado: false, motivo: "nenhum cluster efêmero conhecido" },
      codigo: 0,
    };
  }

  const binarios = localizarBinarios(ambiente);
  const diretorioDados = join(diretorioBase, "data");
  const estado = lerJson(join(diretorioBase, ARQUIVO_ESTADO));

  if (binarios && existsSync(join(diretorioDados, "PG_VERSION"))) {
    // `-m immediate`: cluster descartável; não há dado a preservar e um
    // shutdown limpo só custaria tempo em CI.
    const r = spawnSync(binarios.pgCtl, ["-D", diretorioDados, "-m", "immediate", "-w", "stop"], {
      encoding: "utf-8",
    });
    if (r.status !== 0 && clusterDePe(binarios.pgCtl, diretorioDados)) {
      log(`pg_ctl stop falhou e o cluster segue de pé: ${(r.stderr ?? "").trim()}`);
      return {
        resposta: { derrubado: false, motivo: "pg_ctl stop falhou", diretorioBase },
        codigo: 4,
      };
    }
  }

  rmSync(diretorioBase, { recursive: true, force: true });
  if (estado?.diretorioSocket?.startsWith("/tmp/icpg-")) {
    rmSync(estado.diretorioSocket, { recursive: true, force: true });
  }
  rmSync(PONTEIRO_GLOBAL, { force: true });
  log(`cluster derrubado e apagado: ${diretorioBase}`);
  return { resposta: { derrubado: true, diretorioBase }, codigo: 0 };
}

function comandoStatus(opcoes, ambiente) {
  const urlExterna = ambiente.PG_TEST_URL ?? ambiente.DATABASE_URL;
  if (urlExterna) {
    const origem = ambiente.PG_TEST_URL ? "PG_TEST_URL" : "DATABASE_URL";
    return { resposta: respostaUrlExterna(urlExterna, origem), codigo: 0 };
  }
  const diretorioBase = resolverDiretorioBase(opcoes, ambiente);
  if (!diretorioBase) {
    return { resposta: respostaIndisponivel("nenhum cluster efêmero conhecido"), codigo: 3 };
  }
  const estado = lerJson(join(diretorioBase, ARQUIVO_ESTADO));
  if (!estado) {
    return { resposta: respostaIndisponivel(`sem estado em ${diretorioBase}`), codigo: 3 };
  }
  const binarios = localizarBinarios(ambiente);
  const dePe = binarios ? clusterDePe(binarios.pgCtl, join(diretorioBase, "data")) : false;
  return { resposta: { ...estado, disponivel: dePe }, codigo: dePe ? 0 : 3 };
}

const TEXTO_AJUDA = `pg-efemero.mjs — cluster PostgreSQL efêmero para a suíte de fronteira de dados

  node scripts/pg-efemero.mjs up      # garante um servidor; imprime JSON (padrão)
  node scripts/pg-efemero.mjs down    # derruba e apaga o cluster efêmero
  node scripts/pg-efemero.mjs status  # imprime o estado sem criar nada

Opções: --dir <caminho> --porta <n> --shell --silencioso
Ambiente: PG_TEST_URL DATABASE_URL PG_EFEMERO_DIR PG_EFEMERO_PORTA PG_BIN_DIR PGBIN
Saída: 0 sucesso | 3 indisponível | 4 falha de cluster | 5 uso inválido

Detalhes completos: cabeçalho deste arquivo.
`;

function analisarArgumentos(argv) {
  const opcoes = { comando: "up", shell: false };
  let i = 0;
  if (argv[i] && !argv[i].startsWith("--")) {
    opcoes.comando = argv[i];
    i += 1;
  }
  for (; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--shell") {
      opcoes.shell = true;
    } else if (arg === "--silencioso" || arg === "--quiet") {
      silencioso = true;
    } else if (arg === "--json") {
      opcoes.shell = false;
    } else if (arg === "--dir") {
      i += 1;
      opcoes.dir = argv[i];
    } else if (arg === "--porta" || arg === "--port") {
      i += 1;
      opcoes.porta = argv[i];
    } else {
      return { erro: `opção desconhecida: ${arg}` };
    }
  }
  return { opcoes };
}

function imprimirShell(resposta) {
  const pares = {
    PG_EFEMERO_DISPONIVEL: String(resposta.disponivel ?? false),
    PG_EFEMERO_URL: resposta.urlSuperusuario ?? "",
    PG_EFEMERO_HOST: resposta.host ?? "",
    PG_EFEMERO_PORTA: resposta.porta == null ? "" : String(resposta.porta),
    PG_EFEMERO_DIR: resposta.diretorioBase ?? "",
  };
  for (const [chave, valor] of Object.entries(pares)) {
    process.stdout.write(`${chave}=${valor}\n`);
  }
}

async function principal() {
  const { opcoes, erro } = analisarArgumentos(process.argv.slice(2));
  if (erro) {
    process.stderr.write(`${erro}\n\n${TEXTO_AJUDA}`);
    return 5;
  }
  if (opcoes.comando === "help" || opcoes.comando === "--help") {
    process.stdout.write(TEXTO_AJUDA);
    return 0;
  }

  const ambiente = process.env;
  let resultado;
  if (opcoes.comando === "up") {
    resultado = await comandoUp(opcoes, ambiente);
  } else if (opcoes.comando === "down") {
    resultado = comandoDown(opcoes, ambiente);
  } else if (opcoes.comando === "status") {
    resultado = comandoStatus(opcoes, ambiente);
  } else {
    process.stderr.write(`comando desconhecido: ${opcoes.comando}\n\n${TEXTO_AJUDA}`);
    return 5;
  }

  if (opcoes.shell) {
    imprimirShell(resultado.resposta);
  } else {
    process.stdout.write(`${JSON.stringify(resultado.resposta)}\n`);
  }
  return resultado.codigo;
}

principal().then(
  (codigo) => {
    process.exitCode = codigo;
  },
  (erro) => {
    process.stderr.write(`[pg-efemero] erro inesperado: ${erro?.stack ?? erro}\n`);
    process.exitCode = 4;
  },
);
