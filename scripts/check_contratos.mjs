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
 * G. FORMA das interfaces de mensagem e caminho do canal — porte de
 *    `packages/contratos/src/asyncapi.test.ts` para o gate (mesma técnica de
 *    extração por regex das partes C/D/F, não `tsc`, porque
 *    `packages/contratos/tsconfig.json` exclui `src/**\/*.test.ts` do
 *    typecheck). Diferente da Parte D (que compara ENUMS de plano de
 *    controle), a Parte G1 compara a FORMA das interfaces
 *    `MensagemPulsacao`, `MensagemEstadoConexao`,
 *    `MensagemInstrucaoReconciliacao` e `PoliticaReconexao` contra
 *    `components.schemas.<nome>` do `asyncapi.yaml`, em DUAS dimensões:
 *      G1a. o CONJUNTO de propriedades (`properties`) — um campo
 *           acrescentado, removido ou renomeado só de um lado FALHA;
 *      G1b. a OBRIGATORIEDADE de cada propriedade — `campo?:` no TS ⇔ campo
 *           FORA de `required` no YAML. Existe porque
 *           `POLITICA_EVOLUCAO_EVENTOS.quebra` (`src/asyncapi.ts`) declara
 *           "estreitar tipo ou tornar campo obrigatório" como evolução
 *           INCOMPATÍVEL: um gate cego a isso não impõe a política que o
 *           próprio contrato publica. O invariante foi MEDIDO antes de virar
 *           checagem — 22 propriedades nas quatro interfaces, 0 desvios.
 *    Até esta parte, o gate cobria os enums e não a forma das interfaces.
 *
 *    O QUE A PARTE G NÃO COMPARA — limite DECLARADO, não omissão. Cada item
 *    abaixo foi medido com o gate real sobre cópia mutada do repositório e
 *    sai exit 0 hoje; quem lê o veredito "OK" precisa saber disso.
 *    (a) TIPO da propriedade: `jitter: number` no TS contra `type: string`
 *        no YAML PASSA aqui. Comparar tipos exige uma TABELA de mapeamento
 *        TS→JSON Schema (`number`↔`number|integer`,
 *        `Record<string, unknown>`↔`object`, interface↔`$ref`, união de
 *        literais↔`enum`, `string`↔`format: date-time`) — decisão de
 *        semântica de contrato, que este porte não toma sozinho. Fica como
 *        pendência nomeada no handoff, não como capacidade insinuada.
 *    (b) Propriedade declarada em MEIO DE LINHA (`a: number; b: string;` na
 *        mesma linha): o extrator ancora em início de linha e vê só a
 *        primeira. MEDIDO que outro gate bloqueante impede a forma de
 *        entrar: `biome format` quebra essa linha em duas, e `pnpm lint` é
 *        `biome ci --error-on-warnings .` com `packages/contratos/src`
 *        dentro de `files.includes`. O limite existe; ele não fica sozinho.
 *    (c) Propriedades ANINHADAS (indentação de 4+ espaços): só o nível de
 *        TOPO da interface é comparado, deliberadamente — o schema YAML
 *        correspondente aninha em `properties.<campo>.properties`, que este
 *        porte não percorre.
 *    O extrator ACEITA `readonly` e nome de propriedade CITADO
 *    (`"campo-x": T`) — ver a docstring de `propriedadesComObrigatoriedadeTs`
 *    para a medição que motivou cada um.
 *
 *    A Parte G2 confronta `CAMINHO_FLUXO_EVENTOS` (a rota que `apps/web`
 *    consome sem poder importar `apps/api/src/eventos/stream.ts`, por
 *    fronteira de módulo — ADR-0002) com `channels.fluxoDeEventos.address`.
 *
 *    A Parte G3 aplica a MESMA comparação (a função é uma só:
 *    `compararFormaDeInterface`) à superfície REST — `openapi.yaml` ×
 *    `packages/contratos/src/index.ts`. Ela existe porque, até aqui, o gate
 *    cobria da superfície REST apenas os ENUMS (Parte F1): a FORMA de
 *    `ResultadoAvaliacao`, `EntradaGradeLeitos`, `ModoDeDespachoAvaliacao`,
 *    `ResumoItemTrabalho` e `ItemTrabalho` não era comparada por checagem
 *    nenhuma, e um campo acrescentado só de um lado passava. MEDIDO antes de
 *    escrever esta parte, com o gate anterior sobre cópia mutada do
 *    repositório: 14 mutações de forma REST — campo a mais só no TS (simples,
 *    `readonly` e nome citado), propriedade renomeada só no YAML, campo
 *    opcional declarado `required`, campo obrigatório removido de `required`,
 *    ramo `allOf` alterado e base de composição trocada — **todas saíam
 *    exit 0**. `ADR-0021` exige que `src/index.ts` seja "gerado a partir de,
 *    ou validado contra" o contrato; a Parte F1 fez essa metade para os enums,
 *    a G3 faz para a forma dos objetos.
 *
 *    G3 tem três sub-checagens por par declarado em `PARES_DE_FORMA_REST`:
 *      G3a. conjunto de propriedades e G3b. obrigatoriedade — idênticas a
 *           G1a/G1b, pela mesma função;
 *      G3c. COMPOSIÇÃO: quando a interface TS usa `extends B`, o schema
 *           correspondente tem de compor com `allOf: [$ref B, forma própria
 *           inline]` — e o `$ref` tem de apontar para o MESMO `B`. Herança e
 *           composição divergentes fazem os campos herdados virem de outro
 *           contrato sem que a comparação de forma própria acuse nada.
 *      G3d. FECHO: todo `$ref` a `#/components/schemas/X` que apareça DENTRO
 *           de um schema guardado precisa levar a (i) outro schema guardado,
 *           (ii) um schema ESCALAR (enum ou tipo primitivo — não há forma a
 *           comparar), ou (iii) um nome declarado em
 *           `SCHEMAS_REST_SEM_GUARDA_DE_FORMA`, que é impresso como pendência.
 *           Sem G3d, a escolha dos pares seria arbitrária e um envelope novo
 *           aninhado num schema guardado nasceria sem guarda, em silêncio —
 *           que é exatamente como esta lacuna surgiu.
 *
 *    O QUE A PARTE G3 NÃO COMPARA, além dos limites (a)/(b)/(c) da Parte G:
 *    (d) schemas REST FORA do fecho de `PARES_DE_FORMA_REST` — hoje
 *        `ProblemDetails`, `ProblemDetailsConflitoVersao`, `ObservacaoEntrada`,
 *        `ObservacaoEmQuarentena`, `IngestaoObservacoesRequisicao`,
 *        `IngestaoObservacoesResposta`, `ContextoAvaliacaoPaciente`,
 *        `GradeLeitosResposta`, `AvaliacoesPacienteResposta`,
 *        `ReconhecerAlertaRequisicao`, `ReconhecerAlertaResposta` e os schemas
 *        de prontidão/saúde. Foi MEDIDO que os 18 schemas com interface
 *        homônima em `src/index.ts` conferem hoje (conjunto e obrigatoriedade),
 *        então a exclusão é de ESCOPO, não de conformidade; ela está no
 *        handoff como pendência nomeada. O fecho G3d garante que nenhum deles
 *        seja alcançável a partir de um schema guardado sem reprovar.
 *    (e) schemas alcançáveis só a partir de `paths` (corpos e respostas): G3d
 *        parte dos schemas guardados, não das rotas.
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
 * que o gate lê para um diretório temporário, aplica UMA mutação por vez
 * (valor a mais no YAML; valor a mais no TS; valor renomeado; enum inteiro
 * removido; propriedade a mais só de um lado, escrita também com `readonly`
 * e com nome citado; obrigatoriedade invertida) e afirma que
 * `verificarContratos` reprova cada cópia mutada — no espírito de
 * `scripts/verificar-artefato.mjs autoteste`.
 *
 * Um caso vai na direção OPOSTA e é tão necessário quanto: uma cópia CONFORME
 * anotada com `readonly` precisa continuar ACEITA, com o MESMO número de
 * verificações da cópia intocada. Bateria só de mutações não enxerga gate que
 * reprova o correto — e foi essa a segunda metade do defeito medido em HOLE-1.
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

/**
 * Corpo textual de uma `export interface NOME { ... }` de um fonte
 * TypeScript. Porte DIRETO de `packages/contratos/src/asyncapi.test.ts`
 * (mesma técnica, mesmo nome de função) — única diferença de estilo: a
 * versão de teste lança quando a interface não existe; esta devolve
 * `undefined` e deixa o chamador reportar com `verificar(...)`, porque um
 * gate precisa listar TODAS as falhas numa execução, não abortar na
 * primeira (ver docstring do topo deste arquivo).
 *
 * O RAMO `extends` NÃO É ORNAMENTO. Sem ele o padrão exige `{` logo após o
 * nome, e `export interface ItemTrabalho extends ResumoItemTrabalho {` não
 * casa: a função devolvia `undefined` para TODA interface derivada do
 * repositório (MEDIDO em `src/index.ts`: `ItemTrabalho` e
 * `ProblemDetailsConflitoVersao`). Num gate que trata "interface não
 * encontrada" como falha, isso não seria silêncio — mas seria um par
 * impossível de declarar, e o efeito prático é o mesmo da cegueira a
 * `readonly`: o campo fica fora da comparação. O grupo capturado continua
 * sendo só o corpo, isto é, as propriedades PRÓPRIAS — as herdadas vêm do
 * schema-base, e é por isso que o lado YAML precisa da composição `allOf`
 * (ver `formaDoSchemaOpenapi`). Ampliar o padrão só pode fazê-lo casar MAIS
 * interfaces: nenhuma das quatro interfaces AsyncAPI usa `extends`, e o
 * autoteste prova que a contagem de verificações da Parte G1 não mudou.
 */
function corpoDaInterfaceTs(fonte, nome) {
  const padrao = new RegExp(
    `export interface ${nome}(?:\\s+extends\\s+[^{]+)?\\s*\\{([\\s\\S]*?)\\n\\}`,
    "m",
  );
  const encontrado = padrao.exec(fonte);
  return encontrado ? encontrado[1] : undefined;
}

/**
 * Propriedades de TOPO declaradas numa `export interface`, na ordem do
 * fonte, cada uma com a sua OBRIGATORIEDADE (`campo?:` é opcional). Porte
 * DIRETO de `packages/contratos/src/asyncapi.test.ts` — mesmo nome de
 * função, mesmo regex, uma cópia de cada lado.
 *
 * POR QUE O REGEX TEM A FORMA QUE TEM (revisão adversarial da Parte G).
 * A primeira versão era `/^\s{2}(\w+)\??:/gm` e NÃO enxergava
 * `readonly campo: X` — depois dos dois espaços vem `readonly`, e o `:`
 * esperado não está ali. `readonly` é o estilo DOMINANTE deste repositório
 * (medido: 4.775 ocorrências em `apps/` + `packages/`, 15 delas no
 * arquivo-irmão `packages/contratos/src/index.ts`); `asyncapi.ts` usa zero
 * hoje, e era SÓ por isso que a cegueira não aparecia. A consequência tinha
 * as duas direções, ambas medidas antes desta correção e ambas com caso de
 * autoteste:
 *   - FALSO-NEGATIVO: `readonly campoNovo: string;` acrescentado só no TS
 *     ficava invisível, os conjuntos "coincidiam" e o gate aprovava por
 *     omissão — exatamente o que a Parte G existe para impedir;
 *   - FALSO-POSITIVO: anotar `readonly` uma propriedade JÁ conforme fazia o
 *     conjunto do TS perder o campo e o gate REPROVAVA documento correto,
 *     empurrando quem corrige a apagar a propriedade do YAML — isto é, a
 *     criar a divergência real que o gate deveria evitar.
 *
 * O regex também aceita nome de propriedade CITADO (`"campo-x": T`), que o
 * formatador NÃO desfaz (medido com `biome format --stdin-file-path`), e
 * continua ancorado em `^\s{2}` de propósito: só o nível de TOPO da
 * interface é comparado (ver limite (c) na docstring da Parte G).
 *
 * @returns {{nome: string, opcional: boolean}[] | undefined}
 */
function propriedadesComObrigatoriedadeTs(fonte, nome) {
  const corpo = corpoDaInterfaceTs(fonte, nome);
  if (corpo === undefined) return undefined;
  return [...corpo.matchAll(/^\s{2}(?:readonly\s+)?(?:(\w+)|"([^"]+)")(\??):/gm)].map((m) => ({
    nome: m[1] ?? m[2] ?? "",
    opcional: m[3] === "?",
  }));
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

/**
 * Pares da Parte G3: interface de `packages/contratos/src/index.ts` × schema
 * de `packages/contratos/openapi.yaml` cuja FORMA é comparada.
 *
 * POR QUE ESTES, E NÃO OUTROS — o critério é declarado para que a escolha não
 * seja arbitrária e para que o próximo campo novo não caia fora dela: a lista
 * é o FECHO, sob referência de objeto, do que a superfície passou a consumir
 * quando `ResultadoAvaliacao.despacho` e `EntradaGradeLeitos.modoAvaliacao`
 * entraram no contrato. Sair do fecho é possível; sair dele em SILÊNCIO não é
 * — a sub-checagem G3d reprova qualquer `$ref` de objeto alcançável a partir
 * de um schema guardado que não esteja guardado nem declarado.
 *
 *   - `ResultadoAvaliacao`      raiz: o corpo de avaliação que carrega `despacho`;
 *   - `EntradaGradeLeitos`      raiz: a linha da grade que carrega `modoAvaliacao`;
 *   - `ContribuicaoParametro`   fecho: `ResultadoAvaliacao.parametros[]`;
 *   - `ModoDeDespachoAvaliacao` fecho: o envelope de degradação, alvo dos dois campos;
 *   - `ProvenienciaBundlePublicada` fecho: `ModoDeDespachoAvaliacao.bundle`;
 *   - `ResumoItemTrabalho`      fecho: `EntradaGradeLeitos.alerta`;
 *   - `ItemTrabalho`            resposta de reconhecimento e ÚNICO caso de
 *                               composição (`extends`/`allOf`) do fecho.
 *
 * `baseTs` só é declarado quando a interface TS usa `extends`; ele liga a
 * herança do TypeScript à composição `allOf` do documento (G3c).
 */
export const PARES_DE_FORMA_REST = Object.freeze([
  Object.freeze({ tipoTs: "ResultadoAvaliacao", schemaOpenapi: "ResultadoAvaliacao" }),
  Object.freeze({ tipoTs: "EntradaGradeLeitos", schemaOpenapi: "EntradaGradeLeitos" }),
  Object.freeze({ tipoTs: "ContribuicaoParametro", schemaOpenapi: "ContribuicaoParametro" }),
  Object.freeze({ tipoTs: "ModoDeDespachoAvaliacao", schemaOpenapi: "ModoDeDespachoAvaliacao" }),
  Object.freeze({
    tipoTs: "ProvenienciaBundlePublicada",
    schemaOpenapi: "ProvenienciaBundlePublicada",
  }),
  Object.freeze({ tipoTs: "ResumoItemTrabalho", schemaOpenapi: "ResumoItemTrabalho" }),
  Object.freeze({
    tipoTs: "ItemTrabalho",
    schemaOpenapi: "ItemTrabalho",
    baseTs: "ResumoItemTrabalho",
  }),
]);

/**
 * Schemas de OBJETO alcançáveis a partir de um schema guardado e, ainda
 * assim, sem guarda de forma própria. Mesmo regime de
 * `SCHEMAS_DESPACHO_PENDENTES_NO_OPENAPI`: é a ÚNICA forma de desligar a
 * sub-checagem G3d para um nome, ela é explícita e é impressa como pendência
 * a cada execução.
 *
 * Vazia = o fecho está completo: todo objeto referenciado de dentro de um
 * schema guardado também é guardado. Um schema de objeto novo aninhado num
 * guardado reprova o gate até ser guardado ou declarado aqui por nome.
 */
export const SCHEMAS_REST_SEM_GUARDA_DE_FORMA = Object.freeze([]);

/** Prefixo de todo `$ref` local para a tabela de schemas do OpenAPI. */
const PREFIXO_REF_SCHEMA = "#/components/schemas/";

/**
 * `true` quando o schema não tem FORMA a comparar: enum, ou tipo primitivo.
 *
 * É o predicado que torna o fecho da Parte G3d aplicável sem exigir uma
 * interface TS para `StatusAvaliacao` ou `ParametroClinico` — esses já são
 * confrontados pela Parte F1, que compara os VALORES do enum. Objeto e array
 * NÃO são escalares de propósito: array de objeto esconde a forma um nível
 * abaixo, e é justamente o caso que precisa reprovar.
 */
function schemaEhEscalar(schema) {
  if (typeof schema !== "object" || schema === null) return false;
  if (Array.isArray(schema.enum)) return true;
  return (
    typeof schema.type === "string" &&
    ["string", "number", "integer", "boolean"].includes(schema.type)
  );
}

/**
 * Forma comparável (`properties` + `required`) de um schema do `openapi.yaml`,
 * resolvendo a composição `allOf` quando a interface TS correspondente usa
 * `extends`.
 *
 * TODO desvio da topologia esperada devolve `erro` — nunca uma forma parcial.
 * A razão é a lição registrada duas vezes neste arquivo: comparar metade da
 * forma e sair verde é pior que não comparar, porque produz confiança. Se o
 * documento passar a repartir a forma de um jeito que esta função não sabe
 * ler, o gate REPROVA com o motivo escrito, e alguém decide.
 *
 * @returns {{propriedades?: string[], requeridos: string[], erro?: string, refBase?: string}}
 */
function formaDoSchemaOpenapi(openapi, nomeSchema, nomeTs, baseTs) {
  const schema = openapi.components?.schemas?.[nomeSchema];
  if (typeof schema !== "object" || schema === null) {
    return {
      requeridos: [],
      erro:
        `openapi.yaml: schema '${nomeSchema}' ausente — 'packages/contratos/src/index.ts' ` +
        `publica a interface '${nomeTs}' e o documento não a descreve (ADR-0021: o espelho ` +
        "manual precisa ser validado CONTRA o contrato).",
    };
  }
  const composicao = Array.isArray(schema.allOf) ? schema.allOf : undefined;

  if (baseTs === undefined) {
    if (composicao !== undefined) {
      return {
        requeridos: [],
        erro:
          `openapi.yaml: schema '${nomeSchema}' passou a compor com 'allOf', mas o par de ` +
          `forma de '${nomeTs}' não declara interface-base. Ler apenas 'properties' compararia ` +
          "um SUBCONJUNTO da forma e aprovaria o resto por omissão — declare `baseTs` no par ou " +
          "desfaça a composição.",
      };
    }
    const propriedades = schema.properties;
    if (typeof propriedades !== "object" || propriedades === null) return { requeridos: [] };
    return {
      propriedades: Object.keys(propriedades),
      requeridos: Array.isArray(schema.required) ? schema.required : [],
    };
  }

  if (composicao === undefined) {
    return {
      requeridos: [],
      erro:
        `openapi.yaml: a interface '${nomeTs}' estende '${baseTs}' no TypeScript, mas o schema ` +
        `'${nomeSchema}' não compõe com 'allOf'. Sem composição, os campos herdados teriam de ` +
        "estar repetidos no documento — e a comparação de forma própria não os veria.",
    };
  }
  if (schema.properties !== undefined) {
    return {
      requeridos: [],
      erro:
        `openapi.yaml: schema '${nomeSchema}' declara 'allOf' E 'properties' de topo. A forma ` +
        "ficaria repartida em dois lugares e esta comparação leria só um deles.",
    };
  }
  const ramosRef = composicao.filter(
    (ramo) => typeof ramo === "object" && ramo !== null && typeof ramo.$ref === "string",
  );
  const ramosInline = composicao.filter(
    (ramo) => typeof ramo === "object" && ramo !== null && ramo.$ref === undefined,
  );
  if (composicao.length !== 2 || ramosRef.length !== 1 || ramosInline.length !== 1) {
    return {
      requeridos: [],
      erro:
        `openapi.yaml: schema '${nomeSchema}' compõe com ${String(composicao.length)} ramo(s) de ` +
        `'allOf' (${String(ramosRef.length)} por $ref, ${String(ramosInline.length)} inline). ` +
        "Esta parte do gate só sabe comparar a topologia 'base por $ref + forma própria inline'; " +
        "qualquer outra é REPROVADA em vez de comparada pela metade.",
    };
  }
  const inline = ramosInline[0];
  const refBase = ramosRef[0].$ref;
  const propriedades = inline.properties;
  if (typeof propriedades !== "object" || propriedades === null) {
    return { requeridos: [], refBase };
  }
  return {
    propriedades: Object.keys(propriedades),
    requeridos: Array.isArray(inline.required) ? inline.required : [],
    refBase,
  };
}

/**
 * A comparação de FORMA da Parte G, para UM par interface × schema — UMA
 * função, usada pela G1 (AsyncAPI) e pela G3 (REST).
 *
 * Extraída de dentro do laço da Parte G1 sem alterar a sequência nem a
 * QUANTIDADE de chamadas a `verificar` (a contagem por par continua 2 quando
 * um dos lados não é encontrado e 4 quando os dois existem) — a contagem total
 * do gate é dado publicado, e um refator que a mexesse sem motivo tornaria
 * impossível atribuir a diferença à ampliação. O chamador entrega a forma do
 * documento já resolvida, porque a resolução difere entre os dois documentos:
 * AsyncAPI lê `properties`/`required` direto; OpenAPI pode compor com `allOf`.
 */
function compararFormaDeInterface({
  verificar,
  fonteTs,
  nomeTs,
  rotuloFonteTs,
  nomeSchema,
  rotuloDocumento,
  formaYaml,
}) {
  const detalhadoTs = propriedadesComObrigatoriedadeTs(fonteTs, nomeTs);
  const doTs = detalhadoTs?.map((p) => p.nome);
  verificar(
    doTs !== undefined && doTs.length > 0,
    `${rotuloFonteTs}: interface '${nomeTs}' não encontrada (ou sem propriedades extraídas).`,
  );

  const doYaml = formaYaml.propriedades;
  verificar(
    formaYaml.erro === undefined && doYaml !== undefined && doYaml.length > 0,
    formaYaml.erro ?? `${rotuloDocumento}: schema '${nomeSchema}' sem 'properties' (ou vazio).`,
  );

  if (
    detalhadoTs === undefined ||
    doTs === undefined ||
    doTs.length === 0 ||
    doYaml === undefined ||
    doYaml.length === 0
  ) {
    return;
  }

  const tsOrdenado = [...doTs].sort();
  const yamlOrdenado = [...doYaml].sort();
  verificar(
    mesmaLista(tsOrdenado, yamlOrdenado),
    `Propriedades divergentes entre a interface '${nomeTs}' (TS) e o schema '${nomeSchema}' (${rotuloDocumento}) — um campo acrescentado, removido ou renomeado só de um lado.\n      TS   : ${JSON.stringify(tsOrdenado)}\n      YAML : ${JSON.stringify(yamlOrdenado)}`,
  );

  // Obrigatoriedade. `campo?:` no TS ⇔ campo FORA de `required` no YAML. Não é
  // preciosismo de schema: `POLITICA_EVOLUCAO_EVENTOS.quebra`
  // (`packages/contratos/src/asyncapi.ts`) declara "estreitar tipo ou tornar
  // campo obrigatório" como evolução INCOMPATÍVEL. Enquanto o gate comparava
  // só o CONJUNTO de nomes, tornar um campo obrigatório de um lado só — a
  // quebra que o próprio contrato nomeia — passava (medido: inverter `required`
  // no YAML saía exit 0, nos dois documentos).
  const obrigatoriosNoTs = detalhadoTs
    .filter((p) => !p.opcional)
    .map((p) => p.nome)
    .sort();
  const requeridosNoYaml = [...formaYaml.requeridos].sort();
  verificar(
    mesmaLista(obrigatoriosNoTs, requeridosNoYaml),
    `Obrigatoriedade divergente entre a interface '${nomeTs}' (TS) e o schema '${nomeSchema}' (${rotuloDocumento}) — tornar campo obrigatório de um lado só é evolução INCOMPATÍVEL (POLITICA_EVOLUCAO_EVENTOS.quebra).\n      TS obrigatórios   : ${JSON.stringify(obrigatoriosNoTs)}\n      YAML required     : ${JSON.stringify(requeridosNoYaml)}`,
  );
}

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

  // Ausência de QUALQUER um destes dois arquivos desligava a subseção INTEIRA
  // em silêncio — o `if` abaixo não tinha `else`. Medido diretamente (P2 da
  // revisão do PR #8; HANDOFF.yaml `P2_gate_emudece`): com os dois presentes,
  // 187 verificações; com qualquer um ausente, 171 — 16 verificações somem e
  // o script ainda sai 0. PROMPT_IMPLEMENTACAO_FINAL_INTENSICARE_V2.md §10
  // nomeia isto: anti-padrão 16, "tornar gate consultivo, engolir falha".
  //
  // Nenhum caminho de uso legítimo desta função roda sem os dois arquivos: a
  // execução direta sobre o repositório os tem sempre, e todo raiz temporária
  // de teste (autoteste abaixo; `packages/contratos/src/asyncapi.test.ts`)
  // copia `ARQUIVOS_LIDOS_PELO_GATE`, que inclui os dois. Por isso a ausência
  // é FALHA NOMEADA — o mesmo regime já usado na Seção F2 para
  // `apps/api/src/regras/tipos.ts` — e não uma pendência descontada em
  // silêncio: esta subseção não tem uma "dívida declarada" legítima da forma
  // que `SCHEMAS_DESPACHO_PENDENTES_NO_OPENAPI` declara para F2, porque não
  // há hoje nenhum cenário em que rodar sem catálogo ou sem `db.ts` seja
  // intencional.
  const catalogoExiste = existsSync(caminhoCatalogo);
  const dbExiste = existsSync(caminhoDb);
  // Piso COMPUTADO, não digitado: as duas checagens estruturais (união do
  // catálogo; bloco OUTBOX_TO_CONTRACT_EVENT) mais uma checagem de "evento
  // inventado" por tipo já declarado em TIPOS_EVENTO_FLUXO — contagem que não
  // depende do conteúdo dos arquivos ausentes, então pode ser afirmada mesmo
  // sem lê-los. As comparações por tipo do PRÓPRIO catálogo e do PRÓPRIO mapa
  // de outbox somam mais que isso, mas a contagem exata delas depende do
  // conteúdo dos arquivos ausentes — por isso o texto abaixo diz "pelo menos".
  const pisoVerificacoesSecaoC = 2 + (tiposTs?.length ?? 0);
  verificar(
    catalogoExiste && dbExiste,
    "Parte C (coerência do enum de eventos entre TIPOS_EVENTO_FLUXO, o catálogo " +
      "§5.1 e o mapa de outbox) não pôde rodar: " +
      `${catalogoExiste ? "" : `catálogo ausente em '${caminhoCatalogo}'; `}` +
      `${dbExiste ? "" : `apps/api/src/db.ts ausente em '${caminhoDb}'; `}` +
      `pelo menos ${String(pisoVerificacoesSecaoC)} verificação(ões) desta subseção ` +
      "não rodaram nesta execução (as duas checagens estruturais mais uma checagem de " +
      `'evento inventado' por tipo em TIPOS_EVENTO_FLUXO, hoje ${String(tiposTs?.length ?? 0)}), ` +
      "além das comparações por tipo do próprio catálogo e do próprio mapa de outbox, cuja " +
      "contagem depende do conteúdo dos arquivos ausentes e por isso não pode ser antecipada " +
      "aqui. Entrada obrigatória ausente é falha nomeada, não silêncio.",
  );

  if (tiposTs && catalogoExiste && dbExiste) {
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

  // --- G1. FORMA das mensagens de controle (propriedades TS × YAML) ------
  //
  // Porte para o gate de uma checagem que só existia em
  // `packages/contratos/src/asyncapi.test.ts` ("as propriedades das
  // mensagens de controle são as MESMAS no TS e no YAML"), escrita pelo
  // especialista de eventos para provar duas lacunas fechadas (LAC-L1:
  // `intervaloPulsacaoMs` e `reconexao` anunciados no fio desde a abertura).
  // A Parte D acima já compara os ENUMS do plano de controle; esta parte
  // compara a FORMA das interfaces — exatamente a lacuna que o encargo desta
  // sessão nomeia: "o gate cobre os ENUMS, não a FORMA das interfaces — um
  // campo acrescentado só de um lado passa". Mesma técnica de extração das
  // demais partes (regex sobre o fonte), não `tsc`: o `tsconfig.json` do
  // pacote exclui `src/**/*.test.ts` do typecheck, então uma checagem
  // puramente de tipo nunca seria compilada por gate nenhum — ler o fonte e
  // comparar com o YAML é a única técnica com dentes aqui, e é a mesma que
  // já prova as demais partes deste script.
  const paresDeInterfaceDeMensagem = [
    ["MensagemPulsacao", "MensagemPulsacao"],
    ["MensagemEstadoConexao", "MensagemEstadoConexao"],
    ["MensagemInstrucaoReconciliacao", "MensagemInstrucaoReconciliacao"],
    ["PoliticaReconexao", "PoliticaReconexao"],
  ];
  verificar(
    paresDeInterfaceDeMensagem.length > 0,
    "check_contratos: a lista de pares de interface de mensagem está vazia — o laço abaixo não verificaria nada (guarda de não-vacuidade).",
  );
  for (const [nomeTs, nomeSchema] of paresDeInterfaceDeMensagem) {
    // O invariante de obrigatoriedade vale HOJE nas quatro interfaces, medido
    // antes de a checagem existir: 22 propriedades, 0 desvios.
    const propriedadesYaml = asyncapi.components?.schemas?.[nomeSchema]?.properties;
    const requeridoYaml = asyncapi.components?.schemas?.[nomeSchema]?.required;
    compararFormaDeInterface({
      verificar,
      fonteTs,
      nomeTs,
      rotuloFonteTs: "asyncapi.ts",
      nomeSchema,
      rotuloDocumento: "asyncapi.yaml",
      formaYaml: {
        propriedades:
          typeof propriedadesYaml === "object" && propriedadesYaml !== null
            ? Object.keys(propriedadesYaml)
            : undefined,
        requeridos: Array.isArray(requeridoYaml) ? requeridoYaml : [],
      },
    });
  }

  // --- G2. Caminho do canal de eventos publicado (TS × YAML) -------------
  //
  // Porte de "o caminho do fluxo é EXATAMENTE o endereço do canal no
  // AsyncAPI" (mesma suíte). `CAMINHO_FLUXO_EVENTOS` é a rota que
  // `apps/web` consome sem poder importar `apps/api/src/eventos/stream.ts`
  // (fronteira de módulo, ADR-0002) — uma rota redigitada em vez de
  // importada derivaria em silêncio.
  const caminhoFluxoTs = extrairConstanteTs(fonteTs, "CAMINHO_FLUXO_EVENTOS");
  const caminhoFluxoYaml = asyncapi.channels?.fluxoDeEventos?.address;
  verificar(
    caminhoFluxoTs !== undefined,
    "asyncapi.ts: constante CAMINHO_FLUXO_EVENTOS não encontrada.",
  );
  verificar(
    caminhoFluxoTs === caminhoFluxoYaml,
    `Caminho do canal de eventos divergente: CAMINHO_FLUXO_EVENTOS='${String(caminhoFluxoTs)}' no TS, mas o canal 'fluxoDeEventos' declara address='${String(caminhoFluxoYaml)}'.`,
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

  // --- G3. FORMA dos schemas REST (openapi.yaml × src/index.ts) -----------
  //
  // A Parte F1 acima compara os VALORES dos enums REST; esta compara a FORMA
  // dos objetos, com a MESMA função que a Parte G1 usa para o AsyncAPI. Antes
  // dela, a superfície REST tinha guarda de vocabulário e nenhuma guarda de
  // estrutura — medido sobre o gate ANTERIOR: 14 mutações de forma (campo a
  // mais só no TS, inclusive `readonly` e nome citado; propriedade renomeada só
  // no YAML; `required` invertido nas duas direções; ramo `allOf` alterado;
  // base de composição trocada; schema de objeto sem guarda; schema ausente)
  // saíam TODAS exit 0. As outras três mutações de forma REST do autoteste não
  // medem buraco anterior: exercitam os ramos de topologia inesperada que esta
  // parte introduz, para que nenhum deles fique sendo código nunca executado.
  // Importa agora porque `apps/web` passou a
  // CONSUMIR `ResultadoAvaliacao.despacho` e `EntradaGradeLeitos.modoAvaliacao`
  // — os dois campos vivem exatamente nos schemas que não tinham guarda.

  verificar(
    PARES_DE_FORMA_REST.length > 0,
    "check_contratos: PARES_DE_FORMA_REST está vazia — o laço abaixo não verificaria nada (guarda de não-vacuidade).",
  );
  for (const { tipoTs, schemaOpenapi, baseTs } of PARES_DE_FORMA_REST) {
    const formaYaml = formaDoSchemaOpenapi(openapi, schemaOpenapi, tipoTs, baseTs);
    compararFormaDeInterface({
      verificar,
      fonteTs: fonteTsIndex,
      nomeTs: tipoTs,
      rotuloFonteTs: "packages/contratos/src/index.ts",
      nomeSchema: schemaOpenapi,
      rotuloDocumento: "openapi.yaml",
      formaYaml,
    });

    // G3c. Herança do TS × composição do documento. Comparar só a forma
    // PRÓPRIA deixaria os campos herdados fora de qualquer confronto: um
    // `allOf` apontando para outro schema-base traria outros campos e nenhuma
    // asserção acusaria. Medido: trocar a base de `ItemTrabalho` para
    // `ProblemDetails` saía exit 0 antes desta checagem.
    if (baseTs !== undefined) {
      verificar(
        formaYaml.refBase === `${PREFIXO_REF_SCHEMA}${baseTs}`,
        `Composição divergente da herança: a interface '${tipoTs}' estende '${baseTs}' em ` +
          `packages/contratos/src/index.ts, mas o schema '${schemaOpenapi}' compõe com ` +
          `'${String(formaYaml.refBase)}'. Herança e composição precisam apontar para o MESMO ` +
          "schema — senão os campos herdados vêm de outro contrato.",
      );
    }
  }

  // G3d. FECHO do conjunto guardado. Sem isto, a lista de pares seria uma
  // escolha sem invariante: um envelope novo aninhado dentro de um schema já
  // guardado nasceria sem guarda de forma e ninguém veria — que é exatamente
  // como a lacuna fechada nesta sessão surgiu (a Parte G cobria a FORMA de
  // quatro interfaces AsyncAPI e nenhuma REST).
  const schemasRestGuardados = new Set(PARES_DE_FORMA_REST.map((par) => par.schemaOpenapi));
  for (const nomeSchema of SCHEMAS_REST_SEM_GUARDA_DE_FORMA) {
    pendencias.push(
      `openapi.yaml: o schema de objeto '${nomeSchema}' é referenciado de dentro de um schema ` +
        "COM guarda de forma e está DECLARADO sem guarda própria: a comparação de FORMA está " +
        "DESLIGADA para ele (Parte G3d).",
    );
  }
  let refsExaminadasNoFecho = 0;
  for (const { schemaOpenapi } of PARES_DE_FORMA_REST) {
    const schema = openapi.components?.schemas?.[schemaOpenapi];
    if (typeof schema !== "object" || schema === null) continue;
    const refs = [];
    coletarRefs(schema, schemaOpenapi, refs);
    for (const { caminho, ref } of refs) {
      const alvo = ref.startsWith(PREFIXO_REF_SCHEMA)
        ? ref.slice(PREFIXO_REF_SCHEMA.length)
        : undefined;
      const alvoSchema = alvo === undefined ? undefined : openapi.components?.schemas?.[alvo];
      refsExaminadasNoFecho += 1;
      verificar(
        alvo !== undefined &&
          (schemasRestGuardados.has(alvo) ||
            schemaEhEscalar(alvoSchema) ||
            SCHEMAS_REST_SEM_GUARDA_DE_FORMA.includes(alvo)),
        `openapi.yaml: '${caminho}' referencia '${ref}', que não é enum nem tipo primitivo e ` +
          "NÃO tem guarda de FORMA. Um schema de objeto alcançável a partir de um schema " +
          "guardado precisa entrar em PARES_DE_FORMA_REST (com interface espelho em " +
          "packages/contratos/src/index.ts) ou ser declarado por nome em " +
          "SCHEMAS_REST_SEM_GUARDA_DE_FORMA. Fecho incompleto em silêncio é como esta lacuna nasceu.",
      );
    }
  }
  verificar(
    refsExaminadasNoFecho > 0,
    "check_contratos: nenhum '$ref' foi examinado dentro dos schemas REST guardados — o fecho " +
      "da Parte G3d não verificaria nada (guarda de não-vacuidade).",
  );

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
 * A âncora também precisa ser ÚNICA no arquivo, e essa metade faltava.
 * `String.prototype.replace` com string literal troca só a PRIMEIRA
 * ocorrência: uma âncora ambígua muta um sítio que não é o pretendido, o gate
 * reprova por um motivo que não é o que o caso afirma testar, e o caso sai
 * `ok`. Não é hipótese — este arquivo já registra duas ocorrências dessa
 * classe (a injeção que produzia chave YAML duplicada). MEDIDO sobre as 21
 * âncoras existentes antes de acrescentar a guarda: todas únicas, nenhuma
 * mutação mudou de comportamento.
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
      if (conteudo.indexOf(mutacao.de) !== conteudo.lastIndexOf(mutacao.de)) {
        rmSync(raizDestino, { recursive: true, force: true });
        throw new Error(
          `autoteste: o texto-alvo da mutação "${mutacao.nome}" aparece MAIS DE UMA VEZ em ` +
            `'${relativo}'. 'replace' com literal troca só a primeira ocorrência, então a ` +
            "mutação atingiria um sítio ambíguo e o caso poderia sair verde pelo motivo errado. " +
            "Estenda a âncora até que ela seja única.",
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

  /**
   * O CAMPO `marcador` É O QUE SEPARA "reprovou" DE "reprovou POR ISTO".
   *
   * Até aqui cada caso afirmava `falhas.length > 0`. É a versão-gate de
   * `expect(...).rejects.toThrow()` sem classe: "documento com enum divergente"
   * e "documento que nem parseia" viram o mesmo verde, e uma mutação que
   * passasse a reprovar por outro motivo continuaria `ok` medindo outra coisa —
   * defeito que este arquivo já registra duas vezes (a injeção que produzia
   * chave YAML duplicada e reprovava ANTES de a comparação rodar). Cada
   * `marcador` foi MEDIDO na saída real do gate sobre a cópia mutada, não
   * suposto.
   */
  const mutacoesRest = [
    {
      nome: "valor a mais em StatusAvaliacao (YAML) sem par no TS",
      arquivo: "packages/contratos/openapi.yaml",
      de: "enum: [valido, parcial, indisponivel, desatualizado, invalido]",
      para: "enum: [valido, parcial, indisponivel, desatualizado, invalido, bugado]",
      marcador: "Enum REST divergente entre openapi.yaml e src/index.ts para 'StatusAvaliacao'",
    },
    {
      nome: "valor a mais em BandaRisco (TS) sem par no YAML",
      arquivo: "packages/contratos/src/index.ts",
      de: 'export type BandaRisco = "normal" | "atencao" | "alerta" | "critico";',
      para: 'export type BandaRisco = "normal" | "atencao" | "alerta" | "critico" | "bugado";',
      marcador: "Enum REST divergente entre openapi.yaml e src/index.ts para 'BandaRisco'",
    },
    {
      nome: "valor renomeado em Frescor (YAML) diverge do TS",
      arquivo: "packages/contratos/openapi.yaml",
      de: "enum: [atual, envelhecendo, desatualizado]",
      para: "enum: [atual, envelhecendo2, desatualizado]",
      marcador: "Enum REST divergente entre openapi.yaml e src/index.ts para 'Frescor'",
    },
    {
      nome: "enum EstadoItemTrabalho inteiro removido do TS",
      arquivo: "packages/contratos/src/index.ts",
      de:
        'export type EstadoItemTrabalho =\n  | "nao-atribuido"\n  | "atribuido"\n  | "reconhecido"' +
        '\n  | "escalado"\n  | "sobreposto"\n  | "resolvido"\n  | "suprimido"\n  | "reaberto";',
      para: "",
      marcador: "tipo 'EstadoItemTrabalho' não encontrado (enum REST sem espelho TS)",
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
      marcador: "Códigos de razão de prontidão divergentes entre openapi.yaml e src/index.ts",
    },
    {
      nome: "valor renomeado em VereditoProntidao (TS) diverge do YAML",
      arquivo: "packages/contratos/src/index.ts",
      de: 'export type VereditoProntidao = "ready" | "degraded" | "not_ready";',
      para: 'export type VereditoProntidao = "ready" | "degradado" | "not_ready";',
      marcador: "Enum REST divergente entre openapi.yaml e src/index.ts para 'VereditoProntidao'",
    },
    {
      nome: "tupla CODIGOS_RAZAO_PRONTIDAO com um código a menos que o YAML",
      arquivo: "packages/contratos/src/index.ts",
      de: '  "degradation_unsurfaced",\n] as const;',
      para: "] as const;",
      marcador: "Códigos de razão de prontidão divergentes entre openapi.yaml e src/index.ts",
    },
    {
      nome: "motivo de recusa a mais no contrato, sem par no registro da API",
      arquivo: "packages/contratos/src/index.ts",
      de: '  | "regra_indisponivel";',
      para: '  | "regra_indisponivel"\n  | "motivo_que_o_registro_nao_conhece";',
      marcador:
        "Enum de despacho divergente entre o contrato e o registro imutável: 'MotivoRecusaDespacho'",
    },
    {
      nome: "enum ModoDespachoRegra inteiro removido do contrato",
      arquivo: "packages/contratos/src/index.ts",
      de: 'export type ModoDespachoRegra = "sombra" | "acionavel";',
      para: "",
      marcador: "tipo 'ModoDespachoRegra' não encontrado (ou sem valores)",
    },
    {
      nome: "estado de assinatura renomeado no registro (apps/api/src/regras/tipos.ts)",
      arquivo: "apps/api/src/regras/tipos.ts",
      de: 'export type EstadoAssinatura = "assinatura_verificada" | "assinatura_ausente" | "sem_bundle";',
      para: 'export type EstadoAssinatura = "assinatura_verificada" | "assinatura_faltando" | "sem_bundle";',
      marcador:
        "Enum de despacho divergente entre o contrato e o registro imutável: 'EstadoAssinaturaBundle'",
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
      marcador:
        "Enum de despacho divergente entre openapi.yaml e src/index.ts para 'ModoDespachoRegra'",
    },
  ];

  /**
   * Mutações da Parte G — FORMA das interfaces de mensagem e caminho do
   * canal. Porte de checagem já provada por mutação em
   * `packages/contratos/src/asyncapi.test.ts`; estas três casos replicam a
   * prova no gate, com o MESMO cuidado documentado acima para a Parte F2: a
   * chave-duplicada já produziu, uma vez, um caso `ok` pelo motivo ERRADO
   * (injeção de bloco novo que reprovava o parsing antes da comparação
   * rodar). Por isso as três MUTAM IN LOCO — trocam um valor onde ele já
   * está — em vez de injetar texto novo:
   *   - a primeira renomeia `intervaloPulsacaoMs` SÓ no schema
   *     `MensagemPulsacao` do YAML (âncora inclui a descrição de
   *     `pendentes`, que só existe ali, para não tocar a cópia homônima de
   *     `MensagemEstadoConexao` mais abaixo no mesmo arquivo);
   *   - a segunda acrescenta uma propriedade SÓ na interface
   *     `PoliticaReconexao` do TS;
   *   - a terceira renomeia o `address` do canal `fluxoDeEventos` SÓ no
   *     YAML, sem tocar `CAMINHO_FLUXO_EVENTOS` no TS.
   * Nas três, o documento continua sintaticamente válido e nenhuma outra
   * parte do gate (A–F) tem motivo para reprovar — a única rota até a falha
   * é a comparação nova da Parte G.
   *
   * AS TRÊS PRIMEIRAS NÃO BASTAVAM, E A REVISÃO ADVERSARIAL PROVOU ISSO.
   * Elas ficavam vermelhas, sim — e mesmo assim o extrator era cego a
   * `readonly`, porque as três foram escritas no ÚNICO estilo que o extrator
   * enxergava (`campo: T`, sem `readonly`, sem aspas). Mutação que confirma o
   * caminho já testado não mede cobertura; mede repetição. As mutações
   * acrescentadas abaixo são as VIZINHAS ÓBVIAS da primeira leva — o mesmo
   * campo no OUTRO estilo (`readonly`, `readonly ?`, nome citado), na OUTRA
   * dimensão (obrigatoriedade) e no OUTRO lado (YAML). Cada uma foi medida
   * FALHANDO em reprovar antes da correção do extrator; ver a docstring de
   * `propriedadesComObrigatoriedadeTs`.
   */
  const mutacoesFormaDeInterface = [
    {
      nome: "propriedade de MensagemPulsacao renomeada SÓ no YAML (Parte G1)",
      arquivo: "packages/contratos/asyncapi.yaml",
      de: "conexão observável em vez de invisível (ADR-0011 P5/P10).\n        intervaloPulsacaoMs:",
      para: "conexão observável em vez de invisível (ADR-0011 P5/P10).\n        intervaloPulsacaoMsRenomeado:",
      marcador: "Propriedades divergentes entre a interface 'MensagemPulsacao'",
    },
    {
      nome: "propriedade acrescentada SÓ na interface PoliticaReconexao do TS (Parte G1)",
      arquivo: "packages/contratos/src/asyncapi.ts",
      de: "  jitter: number;\n}",
      para: "  jitter: number;\n  campoFantasma: string;\n}",
      marcador: "Propriedades divergentes entre a interface 'PoliticaReconexao'",
    },
    {
      nome: "address do canal fluxoDeEventos renomeado SÓ no YAML (Parte G2)",
      arquivo: "packages/contratos/asyncapi.yaml",
      de: "address: /v1/eventos/stream",
      para: "address: /v1/eventos/stream-renomeado",
      marcador: "Caminho do canal de eventos divergente",
    },
    {
      /**
       * O BURACO QUE A REVISÃO ADVERSARIAL MEDIU (HOLE-1), no estilo que o
       * repositório de fato escreve. Antes da correção do extrator este caso
       * saía exit 0: o gate APROVAVA uma propriedade que só existe no TS,
       * porque `readonly` empurra o `:` para depois do ponto onde o regex o
       * procurava. A mutação irmã logo acima ("propriedade acrescentada SÓ na
       * interface PoliticaReconexao do TS") já reprovava — e reprovava por
       * estar escrita no único estilo visível. Este par é a prova de que
       * "mutação vermelha" e "cobertura" não são a mesma coisa.
       */
      nome: "propriedade READONLY acrescentada SÓ na interface PoliticaReconexao do TS (Parte G1a — HOLE-1)",
      arquivo: "packages/contratos/src/asyncapi.ts",
      de: "  jitter: number;\n}",
      para: "  jitter: number;\n  readonly campoFantasmaReadonly: string;\n}",
      marcador: "campoFantasmaReadonly",
    },
    {
      /**
       * `readonly` + `?` na mesma declaração — a combinação exata que o
       * arquivo-irmão `packages/contratos/src/index.ts` usa. Vizinha da
       * anterior: mesmo campo, mesma posição, uma marca a mais.
       */
      nome: "propriedade READONLY OPCIONAL acrescentada SÓ na interface PoliticaReconexao do TS (Parte G1a)",
      arquivo: "packages/contratos/src/asyncapi.ts",
      de: "  jitter: number;\n}",
      para: "  jitter: number;\n  readonly campoFantasmaOpcional?: string;\n}",
      marcador: "campoFantasmaOpcional",
    },
    {
      /**
       * Nome de propriedade CITADO (HOLE-3). Diferente de HOLE-2 (declaração
       * em meio de linha), esta forma NÃO é desfeita pelo formatador — medido
       * com `biome format --stdin-file-path`, que preserva `"campo-x": T`.
       * Por isso ela é fechada no extrator, e não declarada como limite.
       */
      nome: "propriedade de nome CITADO acrescentada SÓ na interface PoliticaReconexao do TS (Parte G1a — HOLE-3)",
      arquivo: "packages/contratos/src/asyncapi.ts",
      de: "  jitter: number;\n}",
      para: '  jitter: number;\n  "campo-fantasma-citado": string;\n}',
      marcador: "campo-fantasma-citado",
    },
    {
      /**
       * O OUTRO LADO: propriedade que passa a existir só no YAML. Renomear em
       * loco (em vez de injetar um bloco novo) mantém o documento válido e
       * preserva a lição registrada na Parte F2 — injeção já produziu caso
       * `ok` pelo motivo errado, ao criar chave duplicada que reprovava antes
       * de a comparação rodar.
       */
      nome: "propriedade renomeada SÓ no schema PoliticaReconexao do YAML (Parte G1a — lado espelho)",
      arquivo: "packages/contratos/asyncapi.yaml",
      de: "        jitter:\n          type: number",
      para: "        jitterRenomeado:\n          type: number",
      marcador: "jitterRenomeado",
    },
    {
      /**
       * G1b, na direção que `POLITICA_EVOLUCAO_EVENTOS.quebra` nomeia como
       * INCOMPATÍVEL: campo OPCIONAL no TS declarado obrigatório no YAML.
       * O conjunto de nomes continua idêntico dos dois lados — G1a passa, e
       * era exatamente por isso que este defeito atravessava o gate (medido:
       * exit 0 antes de G1b existir).
       */
      nome: "campo OPCIONAL no TS declarado obrigatório no YAML (Parte G1b — evolução QUEBRA)",
      arquivo: "packages/contratos/asyncapi.yaml",
      de: "      required: [emitidoEm, estado, cursor, pendentes]",
      para: "      required: [emitidoEm, estado, cursor, pendentes, intervaloPulsacaoMs]",
      marcador: "Obrigatoriedade divergente entre a interface 'MensagemPulsacao'",
    },
    {
      /**
       * G1b na direção inversa — vizinha da anterior: campo OBRIGATÓRIO no TS
       * some de `required` no YAML. O documento passa a prometer menos do que
       * o tipo promete, e um consumidor que confie no YAML aceita mensagem
       * sem `jitter` que o TS declara sempre presente.
       */
      nome: "campo OBRIGATÓRIO no TS removido de 'required' no YAML (Parte G1b — direção inversa)",
      arquivo: "packages/contratos/asyncapi.yaml",
      de: "      required: [esperaMinimaMs, esperaMaximaMs, jitter]",
      para: "      required: [esperaMinimaMs, esperaMaximaMs]",
      marcador: "Obrigatoriedade divergente entre a interface 'PoliticaReconexao'",
    },
  ];

  /**
   * Mutações da Parte G3 — FORMA dos schemas REST. Cada uma foi MEDIDA saindo
   * exit 0 no gate ANTERIOR (o que só cobria enums REST e a forma das quatro
   * interfaces AsyncAPI): as catorze eram buraco aberto, não hipótese.
   *
   * A bateria cobre deliberadamente as VIZINHAS de cada caso, porque foi a
   * vizinha que passou da última vez (HOLE-1):
   *   - o mesmo defeito nos TRÊS estilos de declaração do TS — simples,
   *     `readonly` (o estilo dominante do repositório e o de
   *     `ModoDeDespachoAvaliacao`/`ProvenienciaBundlePublicada`) e nome CITADO;
   *   - nos DOIS lados — campo a mais no TS e propriedade renomeada no YAML;
   *   - nas DUAS direções de obrigatoriedade — opcional virando `required` e
   *     obrigatório saindo de `required`;
   *   - nas DUAS topologias de schema — `properties` direto e composição
   *     `allOf` (`ItemTrabalho`), incluindo a troca da BASE da composição, que
   *     nenhuma comparação de forma própria detectaria;
   *   - e no FECHO (G3d), com um envelope de objeto novo que nasce sem guarda.
   *
   * Todas MUTAM IN LOCO ou acrescentam texto que não colide com chave YAML
   * existente — a lição registrada na Parte F2 (injeção que produzia chave
   * duplicada e reprovava ANTES da comparação, deixando o caso `ok` pelo
   * motivo errado). O `marcador` de cada uma é a segunda metade dessa mesma
   * lição, agora imposta a TODOS os casos desta função.
   */
  const mutacoesFormaRest = [
    {
      nome: "campo acrescentado SÓ na interface ResultadoAvaliacao do TS (Parte G3a)",
      arquivo: "packages/contratos/src/index.ts",
      de: "  despacho?: ModoDeDespachoAvaliacao | null;\n}",
      para: "  despacho?: ModoDeDespachoAvaliacao | null;\n  campoFantasmaRest: string;\n}",
      marcador: "Propriedades divergentes entre a interface 'ResultadoAvaliacao'",
    },
    {
      nome: "campo READONLY acrescentado SÓ na interface EntradaGradeLeitos do TS (Parte G3a)",
      arquivo: "packages/contratos/src/index.ts",
      de: "  modoAvaliacao?: ModoDeDespachoAvaliacao | null;\n}",
      para: "  modoAvaliacao?: ModoDeDespachoAvaliacao | null;\n  readonly campoFantasmaReadonly: string;\n}",
      marcador: "campoFantasmaReadonly",
    },
    {
      nome: "propriedade de nome CITADO acrescentada SÓ na interface ResumoItemTrabalho do TS (Parte G3a)",
      arquivo: "packages/contratos/src/index.ts",
      de: "  versao: number;\n}",
      para: '  versao: number;\n  "campo-rest-citado": string;\n}',
      marcador: "campo-rest-citado",
    },
    {
      nome: "propriedade renomeada SÓ no schema EntradaGradeLeitos do YAML (Parte G3a — lado espelho)",
      arquivo: "packages/contratos/openapi.yaml",
      de: '        frescor:\n          $ref: "#/components/schemas/Frescor"',
      para: '        frescorRenomeado:\n          $ref: "#/components/schemas/Frescor"',
      marcador: "Propriedades divergentes entre a interface 'EntradaGradeLeitos'",
    },
    {
      nome: "propriedade renomeada SÓ no schema ModoDeDespachoAvaliacao do YAML (Parte G3a)",
      arquivo: "packages/contratos/openapi.yaml",
      de: "        acionavel:\n          type: boolean",
      para: "        acionavelRenomeado:\n          type: boolean",
      marcador: "Propriedades divergentes entre a interface 'ModoDeDespachoAvaliacao'",
    },
    {
      nome: "campo READONLY acrescentado SÓ na interface ProvenienciaBundlePublicada do TS (Parte G3a)",
      arquivo: "packages/contratos/src/index.ts",
      de: "  readonly ativoDesde: string | null;\n}",
      para: "  readonly ativoDesde: string | null;\n  readonly campoFantasmaProveniencia: string;\n}",
      marcador: "campoFantasmaProveniencia",
    },
    {
      /**
       * G3b na direção que o contrato nomeia como QUEBRA. O conjunto de nomes
       * continua idêntico dos dois lados — G3a passa, e era exatamente por isso
       * que este defeito atravessava. `despacho` é o campo que a Onda 1 passou
       * a consumir: torná-lo obrigatório no documento inverteria a semântica
       * declarada ("ausente ⇒ NÃO acionável") para respostas antigas.
       */
      nome: "campo OPCIONAL no TS declarado obrigatório no YAML (ResultadoAvaliacao.despacho — Parte G3b)",
      arquivo: "packages/contratos/openapi.yaml",
      de: "        - parametroVermelho\n        - versaoRegra\n      properties:",
      para: "        - parametroVermelho\n        - versaoRegra\n        - despacho\n      properties:",
      marcador: "Obrigatoriedade divergente entre a interface 'ResultadoAvaliacao'",
    },
    {
      nome: "campo OPCIONAL no TS declarado obrigatório no YAML (ContribuicaoParametro.valor — Parte G3b)",
      arquivo: "packages/contratos/openapi.yaml",
      de: "      required: [parametro, presente]",
      para: "      required: [parametro, presente, valor]",
      marcador: "Obrigatoriedade divergente entre a interface 'ContribuicaoParametro'",
    },
    {
      /**
       * Direção inversa: campo OBRIGATÓRIO no TS some de `required`. O
       * documento passa a prometer menos do que o tipo promete, e um consumidor
       * que confie no YAML aceita envelope de despacho SEM `acionavel` — o
       * único campo que decide acionabilidade.
       */
      nome: "campo OBRIGATÓRIO no TS removido de 'required' no YAML (ModoDeDespachoAvaliacao.acionavel — Parte G3b)",
      arquivo: "packages/contratos/openapi.yaml",
      de: "        - desfecho\n        - modo\n        - acionavel\n",
      para: "        - desfecho\n        - modo\n",
      marcador: "Obrigatoriedade divergente entre a interface 'ModoDeDespachoAvaliacao'",
    },
    {
      nome: "campo acrescentado SÓ na interface ItemTrabalho do TS (schema com allOf — Parte G3a)",
      arquivo: "packages/contratos/src/index.ts",
      de: "  reconhecidoEm?: string;\n}",
      para: "  reconhecidoEm?: string;\n  campoFantasmaComposto: string;\n}",
      marcador: "Propriedades divergentes entre a interface 'ItemTrabalho'",
    },
    {
      nome: "propriedade renomeada SÓ no ramo inline do allOf de ItemTrabalho (Parte G3a)",
      arquivo: "packages/contratos/openapi.yaml",
      de: "            tenantId:\n              type: string",
      para: "            tenantIdRenomeado:\n              type: string",
      marcador: "tenantIdRenomeado",
    },
    {
      /**
       * G3c. Nenhuma comparação de forma PRÓPRIA detecta isto: os campos
       * próprios de `ItemTrabalho` continuam idênticos dos dois lados, e só os
       * HERDADOS passam a vir de outro contrato.
       */
      nome: "base do allOf de ItemTrabalho trocada — herança e composição divergem (Parte G3c)",
      arquivo: "packages/contratos/openapi.yaml",
      de: '      allOf:\n        - $ref: "#/components/schemas/ResumoItemTrabalho"',
      para: '      allOf:\n        - $ref: "#/components/schemas/ProblemDetails"',
      marcador: "Composição divergente da herança",
    },
    {
      /**
       * G3d. O documento e o contrato podem CONCORDAR entre si e ainda assim
       * abrir buraco: `despacho` passa a apontar para um envelope novo, com
       * forma própria, que ninguém guarda. É como a lacuna desta sessão
       * nasceu — schema de objeto sem par declarado, invisível ao gate.
       */
      nome: "ResultadoAvaliacao.despacho aponta para schema de OBJETO sem guarda de forma (Parte G3d)",
      arquivo: "packages/contratos/openapi.yaml",
      de: '          oneOf:\n            - $ref: "#/components/schemas/ModoDeDespachoAvaliacao"\n            - type: "null"\n\n    ModoDespachoRegra:',
      para: '          oneOf:\n            - $ref: "#/components/schemas/EnvelopeSemGuarda"\n            - type: "null"\n\n    EnvelopeSemGuarda:\n      type: object\n      required: [campo]\n      properties:\n        campo:\n          type: string\n\n    ModoDespachoRegra:',
      marcador: "não é enum nem tipo primitivo e NÃO tem guarda de FORMA",
    },
    {
      /**
       * O schema simplesmente some do documento. Sem esta mutação, "schema
       * ausente" seria um ramo de `formaDoSchemaOpenapi` que nenhuma execução
       * exercita — e ramo não exercitado de gate é código que se acredita, não
       * que se sabe.
       */
      nome: "schema ResumoItemTrabalho renomeado no documento — o par perde o lado YAML (Parte G3)",
      arquivo: "packages/contratos/openapi.yaml",
      de: "    ResumoItemTrabalho:\n      type: object\n      required: [id, estado, versao]",
      para: "    ResumoItemTrabalhoRenomeado:\n      type: object\n      required: [id, estado, versao]",
      marcador: "schema 'ResumoItemTrabalho' ausente",
    },
    /*
     * OS TRÊS CASOS ABAIXO EXERCITAM OS RAMOS DE TOPOLOGIA INESPERADA de
     * `formaDoSchemaOpenapi`. Sem eles, cada um seria um caminho do gate que
     * nunca roda — e ramo de gate que nunca roda é código que se acredita, não
     * que se sabe. Todos existem por uma razão só: quando a topologia do
     * documento sai do que esta comparação sabe ler, o gate REPROVA dizendo o
     * quê, em vez de comparar metade da forma e sair verde.
     */
    {
      nome: "schema ItemTrabalho com 'allOf' E 'properties' de topo — forma repartida (Parte G3)",
      arquivo: "packages/contratos/openapi.yaml",
      de: '      allOf:\n        - $ref: "#/components/schemas/ResumoItemTrabalho"',
      para:
        "      properties:\n        campoDeTopo:\n          type: string\n" +
        '      allOf:\n        - $ref: "#/components/schemas/ResumoItemTrabalho"',
      marcador: "declara 'allOf' E 'properties' de topo",
    },
    {
      nome: "schema ItemTrabalho com TRÊS ramos de 'allOf' — topologia que a comparação não sabe ler (Parte G3)",
      arquivo: "packages/contratos/openapi.yaml",
      de: '      allOf:\n        - $ref: "#/components/schemas/ResumoItemTrabalho"',
      para:
        "      allOf:\n        - type: object\n          properties:\n            ramoExtra:\n              type: string\n" +
        '        - $ref: "#/components/schemas/ResumoItemTrabalho"',
      marcador: "compõe com 3 ramo(s) de 'allOf'",
    },
    {
      /**
       * A direção inversa da composição: um schema SEM base declarada no par
       * passa a compor. Ler só `properties` compararia um subconjunto da forma
       * e aprovaria o resto por omissão — precisamente o modo de falhar que
       * esta parte do gate existe para não ter.
       */
      nome: "schema ResultadoAvaliacao passa a compor com 'allOf' sem base declarada no par (Parte G3)",
      arquivo: "packages/contratos/openapi.yaml",
      de: "    ResultadoAvaliacao:\n      type: object\n      required:",
      para: "    ResultadoAvaliacao:\n      allOf: [{ type: object }]\n      type: object\n      required:",
      marcador: "não declara interface-base",
    },
  ];

  const todasAsMutacoes = [
    ...mutacoesRest,
    ...mutacoesProntidaoEDespacho,
    ...mutacoesFormaDeInterface,
    ...mutacoesFormaRest,
  ];
  for (const mutacao of todasAsMutacoes) {
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
      // A segunda metade: reprovar não basta, tem de reprovar POR ISTO. Sem
      // esta asserção, uma mutação que passasse a ser interceptada por outra
      // parte do gate (parsing, `$ref` que não resolve, chave duplicada)
      // continuaria `ok` medindo outra coisa — já aconteceu neste arquivo.
      registrar(
        `a reprovação NOMEIA o motivo esperado: ${mutacao.nome}`,
        true,
        resultado.falhas.some((f) => f.includes(mutacao.marcador)),
        `esperava conter ${JSON.stringify(mutacao.marcador)}; obtive: ${resultado.falhas.join(" | ").slice(0, 400)}`,
      );
    } finally {
      if (raizTemp) rmSync(raizTemp, { recursive: true, force: true });
    }
  }
  // Guarda de não-vacuidade do `marcador`: uma mutação sem marcador declarado
  // faria `String(undefined)`... ou pior, `f.includes(undefined)` — que é
  // sempre falso e produziria vermelho confuso. Aqui a ausência é NOMEADA.
  registrar(
    "toda mutação declara o marcador do motivo pelo qual deve reprovar",
    true,
    todasAsMutacoes.every((m) => typeof m.marcador === "string" && m.marcador.length > 0),
    todasAsMutacoes
      .filter((m) => typeof m.marcador !== "string" || m.marcador.length === 0)
      .map((m) => m.nome)
      .join(" | "),
  );

  /**
   * A OUTRA DIREÇÃO DE HOLE-1 — e a única que uma bateria só de mutações
   * jamais pegaria.
   *
   * Toda mutação acima afirma "o gate REPROVA X". Nenhuma delas pode detectar
   * o defeito simétrico: o gate reprovando algo CORRETO. E era o que
   * acontecia — anotar `readonly` numa propriedade JÁ conforme fazia o
   * conjunto do TS perder o campo, e o gate acusava divergência contra um
   * documento intacto. Da posição de quem lê a falha, a propriedade "só
   * existe no YAML"; o conserto natural é apagá-la do YAML, criando a
   * divergência REAL que o gate deveria ter evitado. Um gate que ensina a
   * quebrar o contrato é pior que gate ausente.
   *
   * MUTAÇÃO IN LOCO: acrescenta a palavra `readonly` a uma linha existente,
   * sem inventar campo nem tocar o YAML. O documento continua conforme, logo
   * o gate PRECISA aceitar. Medido: antes da correção do extrator este bloco
   * saía com 1 falha ("Propriedades divergentes ... TS sem 'jitter'").
   *
   * A segunda asserção existe porque "0 falhas" é fraco sozinho — é
   * exatamente a forma de verde que passa quando uma checagem foi PULADA. A
   * contagem de verificações da cópia anotada tem de ser IGUAL à da cópia
   * intocada: nenhuma comparação da Parte G deixou de rodar. É uma
   * comparação entre duas execuções, não um número mágico transcrito.
   */
  {
    let raizAnotada;
    let raizIntocada;
    try {
      raizAnotada = criarCopiaMutada(RAIZ_PADRAO, [
        {
          nome: "propriedade conforme ANOTADA readonly no TS (nada muda no YAML)",
          arquivo: "packages/contratos/src/asyncapi.ts",
          de: "  jitter: number;\n}",
          para: "  readonly jitter: number;\n}",
        },
      ]);
      raizIntocada = criarCopiaMutada(RAIZ_PADRAO, []);
      const anotada = verificarContratos(raizAnotada);
      const intocada = verificarContratos(raizIntocada);
      registrar(
        "propriedade conforme anotada 'readonly' no TS continua ACEITA (HOLE-1, direção falso-positivo)",
        0,
        anotada.falhas.length,
        anotada.falhas.join(" | "),
      );
      registrar(
        "a cópia anotada roda o MESMO número de verificações que a intocada (nenhuma checagem pulada)",
        intocada.verificacoes,
        anotada.verificacoes,
        `intocada=${String(intocada.verificacoes)} anotada=${String(anotada.verificacoes)}`,
      );
    } finally {
      if (raizAnotada) rmSync(raizAnotada, { recursive: true, force: true });
      if (raizIntocada) rmSync(raizIntocada, { recursive: true, force: true });
    }
  }

  /**
   * CONFORMIDADE DA PARTE G3 — a direção que bateria de mutação não alcança.
   *
   * As catorze mutações acima provam que o gate REPROVA forma REST divergente.
   * Nenhuma delas pode provar o simétrico: que ele ACEITA forma REST
   * conforme escrita em estilo diferente. Foi essa metade que faltou em HOLE-1
   * e que custou caro — um gate que reprova o correto ensina quem corrige a
   * apagar a propriedade do documento, isto é, a CRIAR a divergência real.
   *
   * `src/index.ts` mistura os três estilos que o extrator precisa aceitar
   * (medido: 15 propriedades com `readonly` e o resto sem), então cada caso
   * abaixo reescreve UMA propriedade JÁ conforme no estilo vizinho, sem tocar
   * o `openapi.yaml`. O documento continua conforme; o gate PRECISA aceitar.
   *
   * A segunda asserção de cada caso é a que impede o "verde por checagem
   * pulada": "0 falhas" é exatamente o que sai quando uma comparação deixou de
   * rodar. A contagem de verificações da cópia reescrita tem de ser IGUAL à da
   * intocada — comparação entre duas execuções, jamais número transcrito (a
   * versão com número mágico deste arquivo quebrou no dia em que foi escrita).
   */
  {
    const reescritasConformes = [
      {
        nome: "ResultadoAvaliacao.versaoRegra anotada `readonly` (estilo dominante do repositório)",
        arquivo: "packages/contratos/src/index.ts",
        de: "  versaoRegra: string;\n",
        para: "  readonly versaoRegra: string;\n",
      },
      {
        nome: "ModoDeDespachoAvaliacao.acionavel SEM `readonly` (a vizinha inversa)",
        arquivo: "packages/contratos/src/index.ts",
        de: "  readonly acionavel: boolean;\n",
        para: "  acionavel: boolean;\n",
      },
      {
        nome: "ResumoItemTrabalho.versao com nome CITADO (HOLE-3, direção falso-positivo)",
        arquivo: "packages/contratos/src/index.ts",
        de: "  versao: number;\n",
        para: '  "versao": number;\n',
      },
    ];
    registrar(
      "há reescritas conformes de forma REST declaradas",
      true,
      reescritasConformes.length > 0,
    );

    let raizIntocada;
    try {
      raizIntocada = criarCopiaMutada(RAIZ_PADRAO, []);
      const intocada = verificarContratos(raizIntocada);
      for (const reescrita of reescritasConformes) {
        let raizReescrita;
        try {
          raizReescrita = criarCopiaMutada(RAIZ_PADRAO, [reescrita]);
          const resultado = verificarContratos(raizReescrita);
          registrar(
            `forma REST conforme continua ACEITA: ${reescrita.nome}`,
            0,
            resultado.falhas.length,
            resultado.falhas.join(" | "),
          );
          registrar(
            `a cópia reescrita roda o MESMO número de verificações que a intocada: ${reescrita.nome}`,
            intocada.verificacoes,
            resultado.verificacoes,
            `intocada=${String(intocada.verificacoes)} reescrita=${String(resultado.verificacoes)}`,
          );
        } finally {
          if (raizReescrita) rmSync(raizReescrita, { recursive: true, force: true });
        }
      }
    } finally {
      if (raizIntocada) rmSync(raizIntocada, { recursive: true, force: true });
    }
  }

  /**
   * P2 DA REVISÃO DO PR #8 (HANDOFF.yaml `achados_p2_p3_nao_corrigidos` /
   * `P2_gate_emudece`; PROMPT_IMPLEMENTACAO_FINAL_INTENSICARE_V2.md §10,
   * anti-padrão 16 — "tornar gate consultivo, engolir falha").
   *
   * A Parte C só entrava em `if (tiposTs && existsSync(caminhoCatalogo) &&
   * existsSync(caminhoDb))`, SEM `else`. Medido diretamente (renomear os dois
   * arquivos e rodar o gate): com os dois presentes, 187 verificações; com
   * QUALQUER um ausente, 171 — 16 verificações somem, e as duas execuções
   * saem 0. Um gate que se cala por ausência de entrada aprova por omissão.
   *
   * Estes dois casos MUTAM POR REMOÇÃO DE ARQUIVO, não por conteúdo — mutação
   * de conteúdo não pode testar ausência. Cada um copia o repositório intocado
   * (`criarCopiaMutada` com lista de mutações vazia) e remove um dos dois
   * arquivos opcionais, isolado do outro, para que cada caso prove exatamente
   * um motivo. Nenhum outro caminho do gate intercepta essa remoção antes da
   * Parte C: nem `catalogo-de-eventos.md` nem `db.ts` pertencem a
   * `ARQUIVOS_DE_CONTRATO_OBRIGATORIOS` (o early-return de "arquivo de
   * contrato ausente"), e nenhum dos dois participa do parsing YAML nem das
   * partes A/B/D/E/F1/F2 — a única rota até a falha é a checagem nova da
   * Parte C.
   */
  {
    let raizTemp;
    try {
      raizTemp = criarCopiaMutada(RAIZ_PADRAO, []);
      rmSync(join(raizTemp, "docs/09-api-events-and-mcp/catalogo-de-eventos.md"));
      const resultado = verificarContratos(raizTemp);
      registrar(
        "catálogo de eventos ausente REPROVA e NOMEIA o arquivo (P2: não silencia a Parte C)",
        true,
        resultado.falhas.length > 0 &&
          resultado.falhas.some((f) => f.includes("catalogo-de-eventos.md")),
        resultado.falhas.join(" | "),
      );
    } finally {
      if (raizTemp) rmSync(raizTemp, { recursive: true, force: true });
    }
  }
  {
    let raizTemp;
    try {
      raizTemp = criarCopiaMutada(RAIZ_PADRAO, []);
      rmSync(join(raizTemp, "apps/api/src/db.ts"));
      const resultado = verificarContratos(raizTemp);
      registrar(
        "apps/api/src/db.ts ausente REPROVA e NOMEIA o arquivo (P2: não silencia a Parte C)",
        true,
        resultado.falhas.length > 0 && resultado.falhas.some((f) => f.includes("db.ts")),
        resultado.falhas.join(" | "),
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
  registrar(
    "há mutações de forma de interface (Parte G) declaradas",
    true,
    mutacoesFormaDeInterface.length > 0,
  );
  registrar(
    "há mutações de forma de schema REST (Parte G3) declaradas",
    true,
    mutacoesFormaRest.length > 0,
  );
  // Par repetido em PARES_DE_FORMA_REST infla a contagem de verificações e
  // esconde um par AUSENTE atrás de um número que parece maior. A asserção é
  // sobre a lista real (7 entradas hoje), não sobre uma lista vazia.
  registrar(
    "PARES_DE_FORMA_REST não repete interface nem schema",
    true,
    new Set(PARES_DE_FORMA_REST.map((p) => p.tipoTs)).size === PARES_DE_FORMA_REST.length &&
      new Set(PARES_DE_FORMA_REST.map((p) => p.schemaOpenapi)).size === PARES_DE_FORMA_REST.length,
    JSON.stringify(PARES_DE_FORMA_REST.map((p) => p.tipoTs)),
  );
  // NÃO existe caso sobre `SCHEMAS_REST_SEM_GUARDA_DE_FORMA`, e a ausência é
  // deliberada. A lista está VAZIA: qualquer `every`/`for` sobre ela passaria
  // trivialmente e mediria zero — verde vácuo, que é justamente o que este
  // autoteste existe para não produzir. O que precisa estar provado é o
  // MECANISMO, e ele está: a mutação "Parte G3d" acima faz um schema de objeto
  // ficar sem guarda e o gate REPROVA nomeando-o. LIMITE DECLARADO: o caminho
  // de DESLIGAMENTO (declarar um nome na lista e ver a falha virar pendência)
  // não é exercitado, porque a lista é estado do módulo e não conteúdo de
  // arquivo — `criarCopiaMutada` não a alcança. Está no handoff.
  // A não-vacuidade de `paresDeInterfaceDeMensagem` (Parte G1) NÃO é checada
  // aqui — a variável é local a `verificarContratos` e não está em escopo
  // nesta função. A guarda equivalente já roda DENTRO de `verificarContratos`
  // (`verificar(paresDeInterfaceDeMensagem.length > 0, ...)`), incluída em
  // toda execução — inclusive a do caso-base acima ("repositório real (sem
  // mutação) é ACEITO"), que já prova que ela não é vazia hoje.
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
      "cada mutação testada de enum REST, de prontidão, de despacho e de FORMA — tanto das " +
      "interfaces AsyncAPI (Parte G1) quanto dos schemas REST (Parte G3: conjunto de " +
      "propriedades, obrigatoriedade, composição `allOf`×`extends` e fecho do conjunto " +
      "guardado), com o MOTIVO de cada reprovação nomeado. NÃO cobre o TIPO da propriedade nem " +
      "declaração em meio de linha, e não exercita o desligamento por " +
      "SCHEMAS_REST_SEM_GUARDA_DE_FORMA: limites declarados na docstring da Parte G, no topo " +
      "deste arquivo.",
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
