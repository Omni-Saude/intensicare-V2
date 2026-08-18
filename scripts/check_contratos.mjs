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
 *    F1 cobre os enums que o `openapi.yaml` JÁ publica — os quatro acima
 *    mais os de PRONTIDÃO (`VereditoProntidao` e `CodigoRazaoProntidao`),
 *    que `apps/web/src/api/prontidao.ts` espelhava à mão sem gate nenhum.
 *    F2 cobre o vocabulário de MODO DE DESPACHO (`ModoDespachoRegra`,
 *    `EstadoAssinaturaBundle`, `MotivoRecusaDespacho`), que tem TRÊS lados
 *    possíveis e hoje só dois existem:
 *      1. `packages/contratos/src/index.ts` — o espelho publicável;
 *      2. `apps/api/src/regras/tipos.ts` — o vocabulário do REGISTRO
 *         imutável, de onde a projeção `regras/exposicao.ts` deriva; e
 *      3. `packages/contratos/openapi.yaml` — AINDA NÃO publica esses
 *         schemas (o integrador os acrescenta em onda posterior).
 *    Enquanto (3) não existir, o confronto 1×2 é STRICT e vale hoje — é
 *    justamente a deriva que motivou trazer os tipos para o contrato. A
 *    ausência de (3) NÃO reprova o gate somente porque cada schema faltante
 *    está NOMEADO em `SCHEMAS_DESPACHO_PENDENTES_NO_OPENAPI` e é IMPRESSO a
 *    cada execução como pendência: não é silêncio, é dívida declarada.
 *    Schema de despacho ausente e NÃO listado ali reprova com mensagem
 *    própria; e no instante em que o YAML passar a publicar o schema, o
 *    confronto 1×3 entra em vigor sozinho, sem editar este arquivo — se
 *    divergir, FALHA (há caso de autoteste provando exatamente isso).
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
  // Vocabulário do registro imutável de despacho — a OUTRA definição dos
  // enums que a Seção F2 confronta com o contrato. Lido, nunca escrito.
  "apps/api/src/regras/tipos.ts",
]);

/**
 * Enums de MODO DE DESPACHO e os três lados de cada um (ver F2 no cabeçalho).
 *
 * `tipoOrigemApi` é o nome do MESMO enum em `apps/api/src/regras/tipos.ts`.
 * Os nomes diferem de propósito: no contrato eles precisam dizer de que
 * domínio falam (`ModoDespachoRegra`, e não `ModoDespacho`, que num contrato
 * de API poderia ser lido como despacho de mensagem). Nomes diferentes com
 * valores iguais é exatamente o caso em que a deriva passa despercebida sem
 * gate — por isso o par é declarado aqui, e não inferido.
 */
export const ENUMS_DE_DESPACHO = Object.freeze([
  Object.freeze({
    tipoContrato: "ModoDespachoRegra",
    tipoOrigemApi: "ModoDespacho",
    schemaOpenapi: "ModoDespachoRegra",
  }),
  Object.freeze({
    tipoContrato: "EstadoAssinaturaBundle",
    tipoOrigemApi: "EstadoAssinatura",
    schemaOpenapi: "EstadoAssinaturaBundle",
  }),
  Object.freeze({
    tipoContrato: "MotivoRecusaDespacho",
    tipoOrigemApi: "MotivoRecusa",
    schemaOpenapi: "MotivoRecusaDespacho",
  }),
]);

/**
 * Schemas de despacho que o `openapi.yaml` AINDA não publica.
 *
 * Esta lista é a ÚNICA forma de desligar o confronto contra o documento, ela
 * é explícita, é impressa a cada execução e desliga apenas a exigência de
 * EXISTÊNCIA — nunca a de igualdade. Um schema que apareça no YAML volta a
 * ser confrontado sozinho, mesmo continuando listado aqui; a entrada então
 * vira ruído e deve ser removida (ver EM ABERTO do handoff).
 *
 * Vazia = nenhuma pendência: todo enum de despacho tem schema no documento.
 */
export const SCHEMAS_DESPACHO_PENDENTES_NO_OPENAPI = Object.freeze([]);

export function verificarContratos(raiz) {
  const falhas = [];
  /**
   * Dívida DECLARADA: checagem que este gate deixou de fazer e por quê. Não
   * reprova, mas é impressa em toda execução — "desligado e visível" é o
   * único desligamento aceitável; "desligado e calado" seria verde vácuo.
   */
  const pendencias = [];
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
  if (falhas.length > 0) return { falhas, verificacoes, pendencias };

  // --- A/B. Estrutura e chaves duplicadas ---------------------------------

  const openapiCarregado = carregarYaml(caminhoOpenapi);
  if (openapiCarregado.erro !== undefined) {
    reprovar(`openapi.yaml não é YAML válido — ${openapiCarregado.erro}`);
    return { falhas, verificacoes, pendencias };
  }
  const asyncapiCarregado = carregarYaml(caminhoAsyncapi);
  if (asyncapiCarregado.erro !== undefined) {
    reprovar(`asyncapi.yaml não é YAML válido — ${asyncapiCarregado.erro}`);
    return { falhas, verificacoes, pendencias };
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
  if (falhas.length > 0) return { falhas, verificacoes, pendencias };

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

  // --- F1. Coerência dos enums REST publicados (openapi.yaml × index.ts) --
  //
  // `src/index.ts` espelha `openapi.yaml` à mão e não é gerado — ADR-0021
  // exige que seja "gerado a partir de, ou validado contra" o contrato de
  // API. Isto é a metade "validado contra" para os enums fechados do domínio
  // clínico/operacional. Regra: as duas listas devem ser IDÊNTICAS, na mesma
  // ordem — ao contrário da parte C (eventos), aqui não há terceira fonte com
  // vocabulário parcial a conciliar.

  const fonteTsIndex = readFileSync(caminhoTsIndex, "utf8");

  const paresDeEnumRest = [
    ["StatusAvaliacao", "StatusAvaliacao"],
    ["BandaRisco", "BandaRisco"],
    ["Frescor", "Frescor"],
    ["EstadoItemTrabalho", "EstadoItemTrabalho"],
    // Prontidão: o `openapi.yaml` já publicava estes schemas e o contrato TS
    // não os exportava, o que obrigou `apps/web/src/api/prontidao.ts` a
    // manter um espelho manual sem gate (LAC-L3).
    ["VereditoProntidao", "VereditoProntidao"],
  ];
  verificar(
    paresDeEnumRest.length > 0,
    "check_contratos: a lista de enums REST está vazia — o laço abaixo não verificaria nada (guarda de não-vacuidade).",
  );
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

  // Códigos de razão de prontidão: no TS são uma TUPLA `as const` (e não um
  // union), porque o consumidor precisa iterar o vocabulário — reconhecer um
  // código, nunca filtrar os que não conhece.
  const codigosProntidaoTs = extrairTuplaTs(fonteTsIndex, "CODIGOS_RAZAO_PRONTIDAO");
  const codigosProntidaoYaml = openapi.components?.schemas?.CodigoRazaoProntidao?.enum;
  verificar(
    codigosProntidaoTs !== undefined && codigosProntidaoTs.length > 0,
    "packages/contratos/src/index.ts: tupla CODIGOS_RAZAO_PRONTIDAO não encontrada (ou vazia) — sem ela, o espelho manual de códigos de razão em apps/web volta a não ter gate (LAC-L3).",
  );
  verificar(
    Array.isArray(codigosProntidaoYaml) && codigosProntidaoYaml.length > 0,
    "openapi.yaml: schema 'CodigoRazaoProntidao' sem 'enum' (ou vazio).",
  );
  if (
    codigosProntidaoTs !== undefined &&
    codigosProntidaoTs.length > 0 &&
    Array.isArray(codigosProntidaoYaml) &&
    codigosProntidaoYaml.length > 0
  ) {
    verificar(
      mesmaLista(codigosProntidaoTs, codigosProntidaoYaml),
      `Códigos de razão de prontidão divergentes entre openapi.yaml e src/index.ts.\n      openapi.yaml : ${JSON.stringify(codigosProntidaoYaml)}\n      src/index.ts : ${JSON.stringify(codigosProntidaoTs)}`,
    );
  }

  // --- F2. Vocabulário de MODO DE DESPACHO (três lados; hoje só dois) -----

  verificar(
    ENUMS_DE_DESPACHO.length > 0,
    "check_contratos: ENUMS_DE_DESPACHO está vazia — o laço abaixo não verificaria nada (guarda de não-vacuidade).",
  );
  for (const nomeSchema of SCHEMAS_DESPACHO_PENDENTES_NO_OPENAPI) {
    verificar(
      ENUMS_DE_DESPACHO.some((entrada) => entrada.schemaOpenapi === nomeSchema),
      `check_contratos: SCHEMAS_DESPACHO_PENDENTES_NO_OPENAPI nomeia '${nomeSchema}', que não é schema de nenhum enum de despacho declarado. Pendência que não corresponde a nada esconde erro de digitação e desligaria a checagem errada.`,
    );
  }

  const caminhoTiposRegras = join(raiz, "apps/api/src/regras/tipos.ts");
  const fonteTiposRegras = existsSync(caminhoTiposRegras)
    ? readFileSync(caminhoTiposRegras, "utf8")
    : undefined;
  verificar(
    fonteTiposRegras !== undefined,
    `apps/api/src/regras/tipos.ts não encontrado em '${caminhoTiposRegras}' — sem ele o gate não confronta o vocabulário de despacho do contrato com o do REGISTRO imutável que o produz, e a seção F2 ficaria verde sem checar nada.`,
  );

  for (const { tipoContrato, tipoOrigemApi, schemaOpenapi } of ENUMS_DE_DESPACHO) {
    const doContrato = extrairUniaoTipoTs(fonteTsIndex, tipoContrato);
    verificar(
      doContrato !== undefined && doContrato.length > 0,
      `packages/contratos/src/index.ts: tipo '${tipoContrato}' não encontrado (ou sem valores) — o envelope de modo de despacho atravessa a fronteira HTTP e precisa de espelho no contrato, senão as duas definições voltam a divergir em silêncio.`,
    );

    if (fonteTiposRegras !== undefined) {
      const daApi = extrairUniaoTipoTs(fonteTiposRegras, tipoOrigemApi);
      verificar(
        daApi !== undefined && daApi.length > 0,
        `apps/api/src/regras/tipos.ts: tipo '${tipoOrigemApi}' não encontrado (ou sem valores) — é a origem do enum '${tipoContrato}' do contrato.`,
      );
      if (
        doContrato !== undefined &&
        doContrato.length > 0 &&
        daApi !== undefined &&
        daApi.length > 0
      ) {
        verificar(
          mesmaLista(doContrato, daApi),
          `Enum de despacho divergente entre o contrato e o registro imutável: '${tipoContrato}' (contrato) × '${tipoOrigemApi}' (apps/api/src/regras/tipos.ts).\n      contrato : ${JSON.stringify(doContrato)}\n      registro : ${JSON.stringify(daApi)}`,
        );
      }
    }

    const doYaml = openapi.components?.schemas?.[schemaOpenapi]?.enum;
    const pendente = SCHEMAS_DESPACHO_PENDENTES_NO_OPENAPI.includes(schemaOpenapi);

    if (!Array.isArray(doYaml) || doYaml.length === 0) {
      verificar(
        pendente,
        `openapi.yaml: schema '${schemaOpenapi}' ausente ou sem 'enum', e ele NÃO está declarado em SCHEMAS_DESPACHO_PENDENTES_NO_OPENAPI. O contrato TypeScript publica '${tipoContrato}' e o documento não o descreve — ou o schema entra no YAML, ou a pendência é declarada por nome.`,
      );
      if (pendente) {
        pendencias.push(
          `openapi.yaml ainda não publica o schema '${schemaOpenapi}' (espelho de '${tipoContrato}'): o confronto contrato × documento está DESLIGADO para este enum. Ativa-se sozinho quando o schema existir.`,
        );
      }
      continue;
    }

    if (pendente) {
      pendencias.push(
        `openapi.yaml JÁ publica '${schemaOpenapi}': a pendência foi resolvida e o confronto está ATIVO. Remova '${schemaOpenapi}' de SCHEMAS_DESPACHO_PENDENTES_NO_OPENAPI.`,
      );
    }
    if (doContrato !== undefined && doContrato.length > 0) {
      verificar(
        mesmaLista(doContrato, doYaml),
        `Enum de despacho divergente entre openapi.yaml e src/index.ts para '${schemaOpenapi}'.\n      openapi.yaml : ${JSON.stringify(doYaml)}\n      src/index.ts : ${JSON.stringify(doContrato)}`,
      );
    }
  }

  return { falhas, verificacoes, pendencias };
}

// ---------------------------------------------------------------------------
// Autoteste — prova nos dois sentidos (arquivos reais, mutados em cópia)
// ---------------------------------------------------------------------------

/**
 * Arquivos copiados para a cópia mutada: TUDO que o gate lê, e não um
 * subconjunto escolhido à mão.
 *
 * Era um espelho manual de quatro caminhos, e espelho manual deriva — foi
 * assim que a suíte irmã (`packages/contratos/src/asyncapi.test.ts`) quebrou
 * 12 testes de uma vez. Aqui a consequência seria pior e mais silenciosa: um
 * arquivo lido pelo gate e ausente da cópia faz a checagem correspondente
 * simplesmente não rodar, e o autoteste declara vitória sobre um gate que não
 * verificou nada.
 */
const ARQUIVOS_AUTOTESTE = ARQUIVOS_LIDOS_PELO_GATE;

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
 * mutação abaixo ataca exatamente a parte F: valor a mais no YAML sem par no
 * TS; valor a mais no TS sem par no YAML; valor renomeado de um lado só;
 * enum inteiro removido de um lado; e, na F2, deriva entre o contrato e o
 * registro imutável da API. Todas DEVEM reprovar uma cópia do repositório
 * que, sem mutação, é aceita hoje (caso base) — e há duas contraprovas
 * positivas, para que "reprova sempre" não passe por "reprova o certo".
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

  /**
   * Mutações da Seção F1 (prontidão) e F2 (modo de despacho). As de
   * prontidão atacam o par documento × contrato que substituiu o espelho
   * manual de `apps/web`; as de despacho atacam os DOIS lados que existem
   * hoje — o contrato e o registro imutável de `apps/api/src/regras/tipos.ts`
   * — e também o caso em que o `openapi.yaml` passa a publicar o schema.
   */
  const mutacoesProntidaoEDespacho = [
    {
      nome: "código a mais em CodigoRazaoProntidao (YAML) sem par no TS",
      arquivo: "packages/contratos/openapi.yaml",
      de: "        - degradation_unsurfaced\n",
      para: "        - degradation_unsurfaced\n        - razao_que_ninguem_publica\n",
    },
    {
      nome: "valor renomeado em VereditoProntidao (TS) diverge do YAML",
      arquivo: "packages/contratos/src/index.ts",
      de: 'export type VereditoProntidao = "ready" | "degraded" | "not_ready";',
      para: 'export type VereditoProntidao = "ready" | "degradado" | "not_ready";',
    },
    {
      nome: "tupla CODIGOS_RAZAO_PRONTIDAO com um código a menos que o YAML",
      arquivo: "packages/contratos/src/index.ts",
      de: '  "degradation_unsurfaced",\n] as const;',
      para: "] as const;",
    },
    {
      nome: "motivo de recusa a mais no contrato, sem par no registro da API",
      arquivo: "packages/contratos/src/index.ts",
      de: '  | "regra_indisponivel";',
      para: '  | "regra_indisponivel"\n  | "motivo_que_o_registro_nao_conhece";',
    },
    {
      nome: "enum ModoDespachoRegra inteiro removido do contrato",
      arquivo: "packages/contratos/src/index.ts",
      de: 'export type ModoDespachoRegra = "sombra" | "acionavel";',
      para: "",
    },
    {
      nome: "estado de assinatura renomeado no registro (apps/api/src/regras/tipos.ts)",
      arquivo: "apps/api/src/regras/tipos.ts",
      de: 'export type EstadoAssinatura = "assinatura_verificada" | "assinatura_ausente" | "sem_bundle";',
      para: 'export type EstadoAssinatura = "assinatura_verificada" | "assinatura_faltando" | "sem_bundle";',
    },
    {
      /**
       * MUTAÇÃO IN LOCO, e a razão importa.
       *
       * Este caso INJETAVA um bloco `ModoDespachoRegra:` novo antes de
       * `VereditoProntidao:`. Funcionou enquanto o documento não publicava o
       * schema; no instante em que o integrador o publicou, a injeção passou
       * a produzir CHAVE YAML DUPLICADA — e o gate reprova antes de parsear,
       * por um motivo que não é o que este caso afirma testar. O caso
       * continuava `ok`, provando detecção de chave duplicada em vez de
       * detecção de divergência de enum: verde pelo motivo errado.
       *
       * Mutar o valor onde ele já está mantém o documento válido e força a
       * comparação F2 a de fato rodar.
       */
      nome: "openapi.yaml publica ModoDespachoRegra DIVERGENTE do contrato",
      arquivo: "packages/contratos/openapi.yaml",
      de: "      enum: [sombra, acionavel]\n",
      para: "      enum: [sombra, promovido]\n",
    },
  ];

  for (const mutacao of [...mutacoesRest, ...mutacoesProntidaoEDespacho]) {
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

  /**
   * O MECANISMO DE PENDÊNCIA CONTINUA SOB TESTE MESMO SEM PENDÊNCIA ABERTA.
   *
   * Estes dois casos afirmavam propriedades da CIRCUNSTÂNCIA (havia schema
   * pendente, e o gate o anunciava ao ser resolvido). Resolvidas as três
   * pendências, `SCHEMAS_DESPACHO_PENDENTES_NO_OPENAPI` ficou vazia e as duas
   * afirmações viraram insatisfazíveis por construção — nunca mais poderiam
   * falhar nem passar por mérito.
   *
   * O que precisa continuar provado é o MECANISMO: com a lista vazia, um
   * schema que suma do documento tem de reprovar com mensagem nomeada, em vez
   * de desligar a checagem em silêncio. É a diferença entre "não há dívida
   * hoje" e "dívida não declarada passa".
   */
  {
    let raizTemp;
    try {
      raizTemp = criarCopiaMutada(RAIZ_PADRAO, [
        {
          nome: "openapi.yaml deixa de publicar o enum de ModoDespachoRegra",
          arquivo: "packages/contratos/openapi.yaml",
          de: "      enum: [sombra, acionavel]\n",
          para: "      enum: []\n",
        },
      ]);
      const resultado = verificarContratos(raizTemp);
      registrar(
        "schema de despacho vazio no documento REPROVA (não desliga a checagem)",
        true,
        resultado.falhas.length > 0,
        `${String(resultado.falhas.length)} falha(s)`,
      );
      registrar(
        "a reprovação NOMEIA o enum, para o mantenedor saber o que corrigir",
        true,
        resultado.falhas.some((f) => f.includes("ModoDespachoRegra")),
        resultado.falhas.join(" | "),
      );
    } finally {
      if (raizTemp) rmSync(raizTemp, { recursive: true, force: true });
    }
  }

  /**
   * NÃO-VACUIDADE DA PRÓPRIA SEÇÃO F2.
   *
   * A primeira versão desta contraprova afirmava `verificacoes >= 190` — um
   * número mágico, lido de uma execução anterior. Ele quebrou no mesmo dia em
   * que foi escrito: resolver as três pendências REMOVEU três verificações (a
   * contagem foi a 187), e a asserção falhou sem que nada estivesse errado.
   * Contagem absoluta é espelho manual do comportamento do gate — a mesma
   * classe de defeito que esta seção existe para eliminar.
   *
   * A propriedade que interessa não precisa de número: com a lista de
   * pendências VAZIA, "zero pendências E zero falhas" só é verdade se cada
   * enum de despacho tiver schema publicado E igual. Um schema ausente
   * reprovaria (provado logo acima); um divergente reprovaria (idem). Logo o
   * par abaixo é exatamente "F2 rodou sobre o documento e concordou".
   */
  {
    const real = verificarContratos(RAIZ_PADRAO);
    registrar(
      "o repositório real não tem pendência de despacho por resolver",
      0,
      real.pendencias.length,
      real.pendencias.join(" | "),
    );
    registrar(
      "com pendência vazia, F2 confrontou o documento e concordou",
      0,
      real.falhas.length,
      real.falhas.join(" | "),
    );
  }

  // Guardas de não-vacuidade das listas novas: um laço vazio "passa" sem ter
  // provado nada, e essa é justamente a classe de verde vácuo em auditoria.
  registrar(
    "há mutações de prontidão/despacho declaradas",
    true,
    mutacoesProntidaoEDespacho.length > 0,
  );
  registrar("ENUMS_DE_DESPACHO não está vazia", true, ENUMS_DE_DESPACHO.length > 0);
  registrar(
    "toda pendência declarada nomeia um enum de despacho real",
    true,
    SCHEMAS_DESPACHO_PENDENTES_NO_OPENAPI.every((nome) =>
      ENUMS_DE_DESPACHO.some((entrada) => entrada.schemaOpenapi === nome),
    ),
  );
  registrar(
    "a cópia do autoteste leva TUDO que o gate lê",
    true,
    ARQUIVOS_LIDOS_PELO_GATE.every((caminho) => ARQUIVOS_AUTOTESTE.includes(caminho)),
  );

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
      "cada mutação de enum REST, de prontidão e de despacho testada.",
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
  const { falhas, verificacoes, pendencias } = verificarContratos(raiz);

  // Pendências são impressas ANTES do veredito e nos dois desfechos: uma
  // checagem desligada que ninguém vê é indistinguível de uma checagem que
  // não existe.
  for (const pendencia of pendencias) console.error(`  ⚠ PENDÊNCIA: ${pendencia}`);

  if (falhas.length > 0) {
    console.error(`check_contratos: ${String(falhas.length)} falha(s) de contrato.\n`);
    for (const falha of falhas) console.error(`  ✗ ${falha}`);
    console.error(
      "\nNenhum contrato inválido ou divergente do catálogo passa por este gate (achado §6.5).",
    );
    process.exit(1);
  }

  console.log(
    `check_contratos: OK — ${String(verificacoes)} verificações sobre openapi.yaml e asyncapi.yaml` +
      ` (${String(pendencias.length)} pendência(s) declarada(s)).`,
  );
}
