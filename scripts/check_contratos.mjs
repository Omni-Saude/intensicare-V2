#!/usr/bin/env node
/**
 * check_contratos.mjs — validação BLOQUEANTE dos contratos de API:
 * `packages/contratos/openapi.yaml` (OpenAPI 3.1) e
 * `packages/contratos/asyncapi.yaml` (AsyncAPI 3.0).
 *
 * Por que este script existe
 * --------------------------
 * O achado §6.5 tem duas metades. A primeira é a ausência de um contrato
 * FORMAL de eventos — havia catálogo em prosa e nenhum documento
 * validável. Um documento que ninguém valida não é contrato: é comentário
 * comprido. Este script torna a validação bloqueante (contrato comum §7;
 * mesmo regime de `check_module_boundaries.mjs`, que materializou a
 * fronteira de ADR-0002).
 *
 * O que ele verifica, e por quê
 * -----------------------------
 * A. ESTRUTURA dos dois documentos: versão da spec, blocos obrigatórios,
 *    `$ref` que resolve, mensagem sem payload, canal sem endereço,
 *    operação sem ação. Documento inválido FALHA.
 * B. CHAVES DUPLICADAS em YAML. `yaml.safe_load` mantém a última
 *    silenciosamente — exatamente o tipo de perda silenciosa que o
 *    prompt §10 proíbe. Aqui é erro.
 * C. COERÊNCIA ENTRE OS TRÊS LADOS do enum de eventos:
 *      1. `packages/contratos/src/asyncapi.ts` (`TIPOS_EVENTO_FLUXO`);
 *      2. `packages/contratos/asyncapi.yaml` (`TipoEventoFluxo.enum`);
 *      3. o catálogo em prosa `docs/09-api-events-and-mcp/
 *         catalogo-de-eventos.md` §5.1, mais o mapa OBSERVADO
 *         `OUTBOX_TO_CONTRACT_EVENT` de `apps/api/src/db.ts`.
 *    A regra NÃO é "as três listas são idênticas" — o catálogo §5.1
 *    documenta o log em memória (quatro tipos) e `observacao-clinica-
 *    registrada` entra pela imagem do mapa de outbox. A regra correta,
 *    e a que este script impõe, é:
 *      - todo tipo do catálogo §5.1 existe no contrato (nada documentado
 *        pode sumir do contrato em silêncio);
 *      - todo tipo do contrato está no catálogo §5.1 OU é imagem do mapa
 *        de outbox (nada pode ser INVENTADO no contrato);
 *      - toda imagem do mapa de outbox está no contrato (a API não pode
 *        emitir o que o contrato não declara).
 * D. VOCABULÁRIO DE CONTROLE coerente entre TS e YAML: estados de
 *    conexão (ADR-0011 P6), motivos de encerramento, ações de
 *    reconciliação, nomes de evento SSE e nome do cookie de ticket.
 * E. NENHUMA CREDENCIAL EM QUERY STRING em nenhum dos documentos
 *    (anti-padrão §10-12): parâmetro `in: query` com nome de credencial,
 *    tenant ou identificador de sujeito FALHA o gate; esquema de
 *    segurança `in: query` FALHA o gate.
 * F. COERÊNCIA DOS ENUMS REST entre `packages/contratos/openapi.yaml` e
 *    `packages/contratos/src/index.ts` (o espelho manual do contrato REST
 *    para a UI — ADR-0021). Diferente da parte C (eventos), aqui a regra É
 *    "as duas listas são idênticas, na mesma ordem": `StatusAvaliacao`,
 *    `BandaRisco`, `Frescor` e `EstadoItemTrabalho` são enums fechados que
 *    o TS deve espelhar byte a byte, porque `src/index.ts` não é gerado —
 *    é escrito à mão e ninguém o confrontava com o YAML antes desta parte
 *    do gate (achado LAC-L3 / tabela-contrato-ui-backend.md §5). Um valor
 *    acrescentado, removido ou renomeado em qualquer lado agora FALHA aqui.
 *
 * Por que PyYAML via `python3`, e não uma biblioteca JS
 * ----------------------------------------------------
 * O lockfile é compartilhado e nenhuma dependência JS nova foi instalada
 * nesta entrega. `python3` com PyYAML já é dependência de gate deste
 * repositório (`scripts/check_doc_conventions.py`,
 * `scripts/check_forbidden_content.py`). Se um dia for preferível um
 * validador oficial de AsyncAPI, ele SUBSTITUI a parte A — as partes B–E
 * continuam necessárias, porque nenhum validador de spec sabe o que o
 * catálogo desta plataforma diz.
 *
 * LIMITE DECLARADO: a parte A é validação ESTRUTURAL, não a validação
 * contra o JSON Schema oficial da AsyncAPI 3.0. Um documento pode passar
 * aqui e ainda divergir da spec em detalhe fino. Isso está no handoff como
 * pendência, com a linha de dependência exata — não é alegado como
 * "AsyncAPI validado oficialmente".
 *
 * Uso:
 *   node scripts/check_contratos.mjs [--raiz <diretório>]
 *   node scripts/check_contratos.mjs autoteste
 *
 * Saída: exit 0 quando tudo passa; exit 1 listando TODAS as falhas.
 *
 * `autoteste`: prova, a partir do repositório, que o gate REPROVA o que deve
 * reprovar — não só "aceita o conforme" (o problema conhecido: eficácia
 * relatada pelo autor, não reproduzível). Copia o subconjunto de arquivos
 * que a parte F lê para um diretório temporário, aplica UMA mutação por vez
 * (valor a mais no YAML; valor a mais no TS; valor renomeado; enum inteiro
 * removido) e afirma que `verificarContratos` reprova cada cópia mutada —
 * no espírito de `scripts/verificar-artefato.mjs autoteste`.
 */

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ_PADRAO = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Nomes de parâmetro de consulta proibidos. Credencial, tenant e
 * identificador de sujeito não trafegam em query string — vazam em log de
 * servidor, em Referer e em histórico de navegador.
 */
const NOMES_PROIBIDOS_EM_QUERY = [
  "token",
  "ticket",
  "bearer",
  "authorization",
  "access_token",
  "apikey",
  "api_key",
  "senha",
  "password",
  "secret",
  "segredo",
  "tenant",
  "tenantid",
  "tenant_id",
  "psr",
  "cpf",
  "pacienteref",
  "paciente_ref",
  "subject",
];

const PROGRAMA_PYTHON = `
import json, sys, yaml

class LoaderSemDuplicatas(yaml.SafeLoader):
    pass

def construir_mapeamento(loader, node, deep=False):
    mapeamento = {}
    for chave_node, valor_node in node.value:
        chave = loader.construct_object(chave_node, deep=deep)
        if chave in mapeamento:
            raise yaml.constructor.ConstructorError(
                None, None, "chave YAML duplicada: %r" % (chave,), chave_node.start_mark
            )
        mapeamento[chave] = loader.construct_object(valor_node, deep=deep)
    return mapeamento

LoaderSemDuplicatas.add_constructor(
    yaml.resolver.BaseResolver.DEFAULT_MAPPING_TAG, construir_mapeamento
)

try:
    with open(sys.argv[1], encoding="utf-8") as arquivo:
        documento = yaml.load(arquivo, Loader=LoaderSemDuplicatas)
except Exception as erro:
    print(json.dumps({"erro": str(erro)}))
    sys.exit(0)

print(json.dumps({"documento": documento}))
`;

/** Carrega um YAML como objeto JS, recusando chaves duplicadas. */
function carregarYaml(caminho) {
  const execucao = spawnSync("python3", ["-c", PROGRAMA_PYTHON, caminho], {
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  });
  if (execucao.error) {
    return { erro: `falha ao executar python3: ${execucao.error.message}` };
  }
  if (execucao.status !== 0) {
    return { erro: `python3 saiu com status ${String(execucao.status)}: ${execucao.stderr}` };
  }
  try {
    return JSON.parse(execucao.stdout);
  } catch {
    return { erro: `saída não-JSON do parser YAML: ${execucao.stdout.slice(0, 200)}` };
  }
}

/** Extrai `export const NOME = ["a", "b"] as const;` de um fonte TypeScript. */
function extrairTuplaTs(fonte, nome) {
  const padrao = new RegExp(`export const ${nome}\\s*=\\s*\\[([^\\]]*)\\]\\s*as const`, "m");
  const encontrado = padrao.exec(fonte);
  if (!encontrado) return undefined;
  return [...encontrado[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
}

/** Extrai `export const NOME = "valor" as const;` de um fonte TypeScript. */
function extrairConstanteTs(fonte, nome) {
  const padrao = new RegExp(`export const ${nome}\\s*=\\s*"([^"]+)"\\s*as const`, "m");
  const encontrado = padrao.exec(fonte);
  return encontrado ? encontrado[1] : undefined;
}

/**
 * Extrai `export type NOME = "a" | "b" | ...;` de um fonte TypeScript — em
 * uma linha (`StatusAvaliacao`, `BandaRisco`, `Frescor`) ou quebrado em
 * várias com `|` líder (`EstadoItemTrabalho`). Devolve `undefined` quando o
 * tipo não existe no fonte — inclusive quando um enum inteiro foi removido,
 * caso que a parte F precisa detectar como falha, não como lista vazia.
 */
function extrairUniaoTipoTs(fonte, nome) {
  const padrao = new RegExp(`export type ${nome}\\s*=\\s*([\\s\\S]*?);`, "m");
  const encontrado = padrao.exec(fonte);
  if (!encontrado) return undefined;
  return [...encontrado[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
}

/** Resolve um `$ref` de JSON Pointer local (`#/a/b/c`). */
function resolverRef(documento, ref) {
  if (typeof ref !== "string" || !ref.startsWith("#/")) return undefined;
  let atual = documento;
  for (const bruto of ref.slice(2).split("/")) {
    const segmento = bruto.replaceAll("~1", "/").replaceAll("~0", "~");
    if (typeof atual !== "object" || atual === null || !(segmento in atual)) return undefined;
    atual = atual[segmento];
  }
  return atual;
}

/** Percorre o documento coletando todo `$ref` com o caminho onde apareceu. */
function coletarRefs(no, caminho, acumulador) {
  if (Array.isArray(no)) {
    no.forEach((item, indice) => {
      coletarRefs(item, `${caminho}[${String(indice)}]`, acumulador);
    });
    return;
  }
  if (typeof no !== "object" || no === null) return;
  for (const [chave, valor] of Object.entries(no)) {
    if (chave === "$ref" && typeof valor === "string") {
      acumulador.push({ caminho, ref: valor });
      continue;
    }
    coletarRefs(valor, `${caminho}/${chave}`, acumulador);
  }
}

function mesmaLista(a, b) {
  return a.length === b.length && a.every((valor, indice) => valor === b[indice]);
}

// ---------------------------------------------------------------------------
// Verificação
// ---------------------------------------------------------------------------

/**
 * @returns {{falhas: string[], verificacoes: number}}
 */
/**
 * Arquivos cuja AUSÊNCIA reprova o gate — são os documentos de contrato
 * propriamente ditos.
 *
 * Declarados aqui, e não embutidos na função, porque quem exercita o gate
 * sobre uma cópia do repositório (`packages/contratos/src/asyncapi.test.ts`)
 * precisa saber o que copiar. Enquanto essa lista viveu duplicada nos dois
 * lados, acrescentar uma entrada ao gate quebrou 12 testes de uma vez: o gate
 * passou a exigir `src/index.ts`, a cópia não o levava, e todas as asserções
 * sobre mensagens específicas de falha passaram a receber "arquivo ausente".
 * Uma fonte só elimina a classe do defeito em vez de remendar a ocorrência.
 */
export const ARQUIVOS_DE_CONTRATO_OBRIGATORIOS = Object.freeze([
  "packages/contratos/openapi.yaml",
  "packages/contratos/asyncapi.yaml",
  "packages/contratos/src/asyncapi.ts",
  "packages/contratos/src/index.ts",
]);

/**
 * TUDO que o gate lê. Superconjunto do obrigatório: o catálogo em prosa e o
 * mapa de eventos da API são lidos quando existem, e a sua ausência é tratada
 * como falha específica mais adiante, não como arquivo de contrato faltando.
 */
export const ARQUIVOS_LIDOS_PELO_GATE = Object.freeze([
  ...ARQUIVOS_DE_CONTRATO_OBRIGATORIOS,
  "docs/09-api-events-and-mcp/catalogo-de-eventos.md",
  "apps/api/src/db.ts",
]);

export function verificarContratos(raiz) {
  const falhas = [];
  let verificacoes = 0;
  const reprovar = (mensagem) => falhas.push(mensagem);
  const verificar = (condicao, mensagem) => {
    verificacoes += 1;
    if (!condicao) reprovar(mensagem);
  };

  const caminhoOpenapi = join(raiz, "packages/contratos/openapi.yaml");
  const caminhoAsyncapi = join(raiz, "packages/contratos/asyncapi.yaml");
  const caminhoTsCanal = join(raiz, "packages/contratos/src/asyncapi.ts");
  const caminhoTsIndex = join(raiz, "packages/contratos/src/index.ts");
  const caminhoCatalogo = join(raiz, "docs/09-api-events-and-mcp/catalogo-de-eventos.md");
  const caminhoDb = join(raiz, "apps/api/src/db.ts");

  for (const relativo of ARQUIVOS_DE_CONTRATO_OBRIGATORIOS) {
    const caminho = join(raiz, relativo);
    if (!existsSync(caminho)) reprovar(`Arquivo de contrato ausente: ${caminho}`);
  }
  if (falhas.length > 0) return { falhas, verificacoes };

  // --- A/B. Estrutura e chaves duplicadas ---------------------------------

  const openapiCarregado = carregarYaml(caminhoOpenapi);
  if (openapiCarregado.erro !== undefined) {
    reprovar(`openapi.yaml não é YAML válido — ${openapiCarregado.erro}`);
    return { falhas, verificacoes };
  }
  const asyncapiCarregado = carregarYaml(caminhoAsyncapi);
  if (asyncapiCarregado.erro !== undefined) {
    reprovar(`asyncapi.yaml não é YAML válido — ${asyncapiCarregado.erro}`);
    return { falhas, verificacoes };
  }
  const openapi = openapiCarregado.documento;
  const asyncapi = asyncapiCarregado.documento;

  verificar(
    typeof openapi === "object" && openapi !== null,
    "openapi.yaml não produziu um documento de mapeamento.",
  );
  verificar(
    typeof asyncapi === "object" && asyncapi !== null,
    "asyncapi.yaml não produziu um documento de mapeamento.",
  );
  if (falhas.length > 0) return { falhas, verificacoes };

  verificar(
    typeof openapi.openapi === "string" && openapi.openapi.startsWith("3.1"),
    `openapi.yaml: campo 'openapi' deve declarar 3.1.x (encontrado: ${String(openapi.openapi)}).`,
  );
  verificar(
    typeof openapi.paths === "object" && Object.keys(openapi.paths ?? {}).length > 0,
    "openapi.yaml: bloco 'paths' ausente ou vazio.",
  );

  const fonteTs = readFileSync(caminhoTsCanal, "utf8");
  const versaoSpecTs = extrairConstanteTs(fonteTs, "ASYNCAPI_SPEC_VERSION");
  verificar(
    versaoSpecTs !== undefined,
    "asyncapi.ts: constante ASYNCAPI_SPEC_VERSION não encontrada.",
  );
  verificar(
    asyncapi.asyncapi === versaoSpecTs,
    `asyncapi.yaml: campo 'asyncapi' (${String(asyncapi.asyncapi)}) diverge de ASYNCAPI_SPEC_VERSION (${String(versaoSpecTs)}).`,
  );

  const versaoContratoTs = extrairConstanteTs(fonteTs, "ASYNCAPI_CONTRACT_VERSION");
  verificar(
    typeof asyncapi.info === "object" &&
      asyncapi.info !== null &&
      asyncapi.info.version === versaoContratoTs,
    `asyncapi.yaml: 'info.version' (${String(asyncapi.info?.version)}) diverge de ASYNCAPI_CONTRACT_VERSION (${String(versaoContratoTs)}).`,
  );
  verificar(
    typeof asyncapi.info?.title === "string" && asyncapi.info.title.length > 0,
    "asyncapi.yaml: 'info.title' ausente.",
  );

  const canais = asyncapi.channels;
  verificar(
    typeof canais === "object" && canais !== null && Object.keys(canais).length > 0,
    "asyncapi.yaml: bloco 'channels' ausente ou vazio.",
  );
  for (const [nome, canal] of Object.entries(canais ?? {})) {
    verificar(
      typeof canal?.address === "string" && canal.address.length > 0,
      `asyncapi.yaml: canal '${nome}' sem 'address'.`,
    );
    verificar(
      typeof canal?.messages === "object" && Object.keys(canal.messages ?? {}).length > 0,
      `asyncapi.yaml: canal '${nome}' sem mensagens declaradas.`,
    );
  }

  const operacoes = asyncapi.operations;
  verificar(
    typeof operacoes === "object" && operacoes !== null && Object.keys(operacoes).length > 0,
    "asyncapi.yaml: bloco 'operations' ausente ou vazio.",
  );
  for (const [nome, operacao] of Object.entries(operacoes ?? {})) {
    verificar(
      operacao?.action === "receive" || operacao?.action === "send",
      `asyncapi.yaml: operação '${nome}' com 'action' inválida (${String(operacao?.action)}).`,
    );
    verificar(
      typeof operacao?.channel?.$ref === "string",
      `asyncapi.yaml: operação '${nome}' sem referência de canal.`,
    );
  }

  for (const [nome, mensagem] of Object.entries(asyncapi.components?.messages ?? {})) {
    verificar(
      mensagem?.payload !== undefined,
      `asyncapi.yaml: mensagem '${nome}' sem 'payload' — mensagem sem esquema não é contrato.`,
    );
  }

  // Todo `$ref` precisa resolver, nos dois documentos.
  for (const [rotulo, documento] of [
    ["asyncapi.yaml", asyncapi],
    ["openapi.yaml", openapi],
  ]) {
    const refs = [];
    coletarRefs(documento, "", refs);
    for (const { caminho, ref } of refs) {
      verificar(
        resolverRef(documento, ref) !== undefined,
        `${rotulo}: referência não resolve — '${ref}' em '${caminho || "/"}'.`,
      );
    }
  }

  // --- E. Nenhuma credencial em query string ------------------------------

  const proibidos = new Set(NOMES_PROIBIDOS_EM_QUERY);

  for (const [caminhoRota, operacoesDaRota] of Object.entries(openapi.paths ?? {})) {
    for (const [metodo, operacao] of Object.entries(operacoesDaRota ?? {})) {
      if (typeof operacao !== "object" || operacao === null) continue;
      for (const parametro of operacao.parameters ?? []) {
        if (parametro?.in !== "query" || typeof parametro.name !== "string") continue;
        verificar(
          !proibidos.has(parametro.name.toLowerCase()),
          `openapi.yaml: '${metodo.toUpperCase()} ${caminhoRota}' declara o parâmetro de consulta proibido '${parametro.name}' (credencial/tenant/sujeito em query string — anti-padrão §10-12).`,
        );
      }
    }
  }

  for (const [rotulo, esquemas] of [
    ["openapi.yaml", openapi.components?.securitySchemes ?? {}],
    ["asyncapi.yaml", asyncapi.components?.securitySchemes ?? {}],
  ]) {
    for (const [nome, esquema] of Object.entries(esquemas)) {
      verificar(
        esquema?.in !== "query",
        `${rotulo}: esquema de segurança '${nome}' trafega em query string — proibido (§10-12).`,
      );
    }
  }

  for (const [nome, canal] of Object.entries(canais ?? {})) {
    const endereco = String(canal?.address ?? "");
    verificar(
      !endereco.includes("?"),
      `asyncapi.yaml: endereço do canal '${nome}' contém query string ('${endereco}') — credencial e escopo não viajam ali.`,
    );
  }

  // --- C. Coerência do enum de eventos ------------------------------------

  const tiposTs = extrairTuplaTs(fonteTs, "TIPOS_EVENTO_FLUXO");
  verificar(
    tiposTs !== undefined && tiposTs.length > 0,
    "asyncapi.ts: tupla TIPOS_EVENTO_FLUXO não encontrada.",
  );

  const tiposYaml = asyncapi.components?.schemas?.TipoEventoFluxo?.enum;
  verificar(
    Array.isArray(tiposYaml) && tiposYaml.length > 0,
    "asyncapi.yaml: schema 'TipoEventoFluxo' sem enum.",
  );

  if (tiposTs && Array.isArray(tiposYaml)) {
    verificar(
      mesmaLista(tiposTs, tiposYaml),
      `Enum de eventos divergente entre contrato TS e AsyncAPI.\n      TS   : ${JSON.stringify(tiposTs)}\n      YAML : ${JSON.stringify(tiposYaml)}`,
    );
  }

  if (tiposTs && existsSync(caminhoCatalogo) && existsSync(caminhoDb)) {
    const catalogo = readFileSync(caminhoCatalogo, "utf8");
    const uniao = /tipo:\s*((?:"[a-z0-9-]+"\s*\|?\s*)+);/.exec(catalogo);
    verificar(
      uniao !== null,
      "catalogo-de-eventos.md: união de `tipo` do EventoFluxo (§5.1) não encontrada — o gate não consegue confrontar o contrato com o catálogo.",
    );
    const tiposCatalogo = uniao ? [...uniao[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]) : [];

    const fonteDb = readFileSync(caminhoDb, "utf8");
    const bloco = /OUTBOX_TO_CONTRACT_EVENT[^=]*=\s*\{([\s\S]*?)\}/.exec(fonteDb);
    verificar(
      bloco !== null,
      "apps/api/src/db.ts: mapa OUTBOX_TO_CONTRACT_EVENT não encontrado — o gate não consegue confrontar o contrato com o que a API emite.",
    );
    const imagemOutbox = bloco ? [...bloco[1].matchAll(/:\s*"([^"]+)"/g)].map((m) => m[1]) : [];

    const conjuntoContrato = new Set(tiposTs);
    const permitidos = new Set([...tiposCatalogo, ...imagemOutbox]);

    for (const tipo of tiposCatalogo) {
      verificar(
        conjuntoContrato.has(tipo),
        `Divergência contrato × catálogo: o catálogo §5.1 documenta o evento '${tipo}', que NÃO está em TIPOS_EVENTO_FLUXO. Nenhum evento documentado pode sumir do contrato em silêncio.`,
      );
    }
    for (const tipo of imagemOutbox) {
      verificar(
        conjuntoContrato.has(tipo),
        `Divergência contrato × código: 'apps/api/src/db.ts' mapeia para o evento '${tipo}', que NÃO está em TIPOS_EVENTO_FLUXO. A API não pode emitir o que o contrato não declara.`,
      );
    }
    for (const tipo of tiposTs) {
      verificar(
        permitidos.has(tipo),
        `Evento INVENTADO no contrato: '${tipo}' não aparece no catálogo §5.1 nem na imagem de OUTBOX_TO_CONTRACT_EVENT. Contrato não cunha evento que nenhum código produz.`,
      );
    }
  }

  // --- D. Vocabulário de plano de controle --------------------------------

  const paresDeEnum = [
    ["ESTADOS_CONEXAO", "EstadoConexaoEnum"],
    ["MOTIVOS_ENCERRAMENTO", "MotivoEncerramento"],
    ["ACOES_RECONCILIACAO", "AcaoReconciliacao"],
  ];
  for (const [nomeTs, nomeSchema] of paresDeEnum) {
    const doTs = extrairTuplaTs(fonteTs, nomeTs);
    const doYaml = asyncapi.components?.schemas?.[nomeSchema]?.enum;
    verificar(doTs !== undefined, `asyncapi.ts: tupla ${nomeTs} não encontrada.`);
    verificar(Array.isArray(doYaml), `asyncapi.yaml: schema '${nomeSchema}' sem enum.`);
    if (doTs && Array.isArray(doYaml)) {
      verificar(
        mesmaLista(doTs, doYaml),
        `Vocabulário divergente entre ${nomeTs} (TS) e '${nomeSchema}' (YAML).\n      TS   : ${JSON.stringify(doTs)}\n      YAML : ${JSON.stringify(doYaml)}`,
      );
    }
  }

  // Nomes de evento SSE do plano de controle.
  const nomesSse = [
    ["EVENTO_SSE_PULSACAO", "Pulsacao"],
    ["EVENTO_SSE_ESTADO_CONEXAO", "EstadoConexao"],
    ["EVENTO_SSE_INSTRUCAO_RECONCILIACAO", "InstrucaoReconciliacao"],
  ];
  for (const [nomeTs, nomeMensagem] of nomesSse) {
    const valorTs = extrairConstanteTs(fonteTs, nomeTs);
    const valorYaml = asyncapi.components?.messages?.[nomeMensagem]?.["x-sse"]?.campo_event;
    verificar(valorTs !== undefined, `asyncapi.ts: constante ${nomeTs} não encontrada.`);
    verificar(
      valorTs === valorYaml,
      `Nome de evento SSE divergente: ${nomeTs}='${String(valorTs)}' no TS, mas a mensagem '${nomeMensagem}' declara '${String(valorYaml)}'.`,
    );
  }

  // Nome do cookie do ticket.
  const cookieTs = extrairConstanteTs(fonteTs, "TICKET_EVENTOS_COOKIE");
  const cookieYaml = asyncapi.components?.securitySchemes?.ticketEfemeroCookie?.name;
  verificar(cookieTs !== undefined, "asyncapi.ts: constante TICKET_EVENTOS_COOKIE não encontrada.");
  verificar(
    cookieTs === cookieYaml,
    `Nome do cookie de ticket divergente: TS='${String(cookieTs)}', AsyncAPI='${String(cookieYaml)}'.`,
  );

  // --- F. Coerência dos enums REST (openapi.yaml × src/index.ts) ---------
  //
  // `src/index.ts` espelha `openapi.yaml` à mão (376 linhas TS para 1.380
  // linhas YAML) e não é gerado — ADR-0021 exige que seja "gerado a partir
  // de, ou validado contra" o contrato de API. Isto é a metade "validado
  // contra" para os quatro enums fechados do domínio clínico/operacional.
  // Regra: as duas listas devem ser IDÊNTICAS, na mesma ordem — ao
  // contrário da parte C (eventos), aqui não há terceira fonte com
  // vocabulário parcial a conciliar.

  const fonteTsIndex = readFileSync(caminhoTsIndex, "utf8");

  const paresDeEnumRest = [
    ["StatusAvaliacao", "StatusAvaliacao"],
    ["BandaRisco", "BandaRisco"],
    ["Frescor", "Frescor"],
    ["EstadoItemTrabalho", "EstadoItemTrabalho"],
  ];
  for (const [nomeTipoTs, nomeSchemaYaml] of paresDeEnumRest) {
    const doTs = extrairUniaoTipoTs(fonteTsIndex, nomeTipoTs);
    const doYaml = openapi.components?.schemas?.[nomeSchemaYaml]?.enum;
    verificar(
      doTs !== undefined,
      `packages/contratos/src/index.ts: tipo '${nomeTipoTs}' não encontrado (enum REST sem espelho TS).`,
    );
    verificar(
      Array.isArray(doYaml) && doYaml.length > 0,
      `openapi.yaml: schema '${nomeSchemaYaml}' sem 'enum' (ou vazio).`,
    );
    if (doTs !== undefined && Array.isArray(doYaml) && doYaml.length > 0) {
      verificar(
        mesmaLista(doTs, doYaml),
        `Enum REST divergente entre openapi.yaml e src/index.ts para '${nomeSchemaYaml}'.\n      openapi.yaml : ${JSON.stringify(doYaml)}\n      src/index.ts : ${JSON.stringify(doTs)}`,
      );
    }
  }

  return { falhas, verificacoes };
}

// ---------------------------------------------------------------------------
// Autoteste — prova nos dois sentidos (arquivos reais, mutados em cópia)
// ---------------------------------------------------------------------------

/** Arquivos que a parte F lê — o subconjunto mínimo para reproduzir o gate. */
const ARQUIVOS_AUTOTESTE = [
  "packages/contratos/openapi.yaml",
  "packages/contratos/asyncapi.yaml",
  "packages/contratos/src/asyncapi.ts",
  "packages/contratos/src/index.ts",
];

/**
 * Copia `ARQUIVOS_AUTOTESTE` do repositório real para um diretório
 * temporário e aplica as mutações pedidas. Cada mutação PRECISA localizar
 * seu texto-alvo verbatim no arquivo real — se não localizar (porque o
 * arquivo mudou desde que a mutação foi escrita), a função FALHA
 * ruidosamente. Sem essa guarda, uma mutação que nunca se aplica faz o
 * autoteste "passar" sem jamais ter mutado nada — falso-verde silencioso,
 * exatamente o que este autoteste existe para impedir.
 *
 * @param {{arquivo: string, nome: string, de: string, para: string}[]} mutacoes
 * @returns {string} a raiz da cópia mutada.
 */
function criarCopiaMutada(raizOrigem, mutacoes) {
  const raizDestino = mkdtempSync(join(tmpdir(), "check-contratos-autoteste-"));
  for (const relativo of ARQUIVOS_AUTOTESTE) {
    let conteudo = readFileSync(join(raizOrigem, relativo), "utf8");
    for (const mutacao of mutacoes.filter((m) => m.arquivo === relativo)) {
      if (!conteudo.includes(mutacao.de)) {
        rmSync(raizDestino, { recursive: true, force: true });
        throw new Error(
          `autoteste: mutação "${mutacao.nome}" não encontrou o texto-alvo em '${relativo}' — ` +
            "o arquivo real mudou; atualize o texto-alvo da mutação antes de confiar no autoteste.",
        );
      }
      conteudo = conteudo.replace(mutacao.de, mutacao.para);
    }
    const destino = join(raizDestino, relativo);
    mkdirSync(dirname(destino), { recursive: true });
    writeFileSync(destino, conteudo, "utf8");
  }
  return raizDestino;
}

/**
 * Um gate nunca visto reprovando é uma linha de log, não um gate. Cada
 * mutação abaixo ataca exatamente a parte F (enums REST): valor a mais no
 * YAML sem par no TS; valor a mais no TS sem par no YAML; valor renomeado
 * de um lado só; enum inteiro removido de um lado. As quatro DEVEM reprovar
 * uma cópia do repositório que, sem mutação, é aceita hoje (caso base).
 */
function autoteste() {
  const casos = [];
  const registrar = (nome, esperado, obtido, detalhe = "") =>
    casos.push({ nome, esperado, obtido, ok: esperado === obtido, detalhe });

  // Caso base: o repositório real, sem mutação, é aceito — e produz
  // verificações de fato (guarda de não-vacuidade: um gate que não checou
  // nada não prova que checaria uma mutação).
  const base = verificarContratos(RAIZ_PADRAO);
  registrar(
    "repositório real (sem mutação) é ACEITO",
    0,
    base.falhas.length,
    base.falhas.join(" | "),
  );
  registrar("repositório real produz verificações não-vazias", true, base.verificacoes > 0);

  const mutacoesRest = [
    {
      nome: "valor a mais em StatusAvaliacao (YAML) sem par no TS",
      arquivo: "packages/contratos/openapi.yaml",
      de: "enum: [valido, parcial, indisponivel, desatualizado, invalido]",
      para: "enum: [valido, parcial, indisponivel, desatualizado, invalido, bugado]",
    },
    {
      nome: "valor a mais em BandaRisco (TS) sem par no YAML",
      arquivo: "packages/contratos/src/index.ts",
      de: 'export type BandaRisco = "normal" | "atencao" | "alerta" | "critico";',
      para: 'export type BandaRisco = "normal" | "atencao" | "alerta" | "critico" | "bugado";',
    },
    {
      nome: "valor renomeado em Frescor (YAML) diverge do TS",
      arquivo: "packages/contratos/openapi.yaml",
      de: "enum: [atual, envelhecendo, desatualizado]",
      para: "enum: [atual, envelhecendo2, desatualizado]",
    },
    {
      nome: "enum EstadoItemTrabalho inteiro removido do TS",
      arquivo: "packages/contratos/src/index.ts",
      de:
        'export type EstadoItemTrabalho =\n  | "nao-atribuido"\n  | "atribuido"\n  | "reconhecido"' +
        '\n  | "escalado"\n  | "sobreposto"\n  | "resolvido"\n  | "suprimido"\n  | "reaberto";',
      para: "",
    },
  ];

  for (const mutacao of mutacoesRest) {
    let raizTemp;
    try {
      raizTemp = criarCopiaMutada(RAIZ_PADRAO, [mutacao]);
      const resultado = verificarContratos(raizTemp);
      registrar(
        `mutação REPROVADA pelo gate: ${mutacao.nome}`,
        true,
        resultado.falhas.length > 0,
        `${String(resultado.falhas.length)} falha(s)`,
      );
    } finally {
      if (raizTemp) rmSync(raizTemp, { recursive: true, force: true });
    }
  }

  const falhos = casos.filter((c) => !c.ok);
  console.log(`\n=== check_contratos autoteste — ${String(casos.length)} caso(s) ===`);
  for (const c of casos) {
    console.log(
      `  ${c.ok ? "ok  " : "FALHOU"} ${c.nome}` +
        (c.ok ? "" : ` (esperado=${String(c.esperado)} obtido=${String(c.obtido)} ${c.detalhe})`),
    );
  }
  if (falhos.length > 0) {
    console.error(`\nautoteste: ${String(falhos.length)} caso(s) falharam.`);
    return 1;
  }
  console.log(
    `\nautoteste: OK — ${String(casos.length)} casos; o gate aceita o conforme e reprova ` +
      "cada mutação de enum REST testada.",
  );
  return 0;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function lerRaizDosArgumentos(argumentos) {
  const indice = argumentos.indexOf("--raiz");
  if (indice === -1) return RAIZ_PADRAO;
  const valor = argumentos[indice + 1];
  if (valor === undefined) {
    console.error("check_contratos: '--raiz' exige um diretório.");
    process.exit(2);
  }
  return resolve(valor);
}

const executadoDiretamente =
  process.argv[1] !== undefined &&
  resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));

if (executadoDiretamente && process.argv[2] === "autoteste") {
  process.exit(autoteste());
}

if (executadoDiretamente) {
  const raiz = lerRaizDosArgumentos(process.argv.slice(2));
  const { falhas, verificacoes } = verificarContratos(raiz);

  if (falhas.length > 0) {
    console.error(`check_contratos: ${String(falhas.length)} falha(s) de contrato.\n`);
    for (const falha of falhas) console.error(`  ✗ ${falha}`);
    console.error(
      "\nNenhum contrato inválido ou divergente do catálogo passa por este gate (achado §6.5).",
    );
    process.exit(1);
  }

  console.log(
    `check_contratos: OK — ${String(verificacoes)} verificações sobre openapi.yaml e asyncapi.yaml.`,
  );
}
