/**
 * Testes do contrato de canal (AsyncAPI) e do gate que o valida.
 *
 * A parte mais importante está em `o gate reprova`: um gate que só é
 * exercitado no caminho feliz não prova nada. Cada mutação abaixo produz
 * um documento que DEVE reprovar — e o teste falha se ele passar. É a
 * exigência "prove nos dois sentidos" do achado §6.5.
 */

import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, describe, expect, it } from "vitest";
// O gate é um `.mjs` de `scripts/`; importá-lo aqui é deliberado — é a única
// forma de a suíte usar a MESMA declaração de entradas que o gate usa.
import {
  ARQUIVOS_DE_CONTRATO_OBRIGATORIOS,
  ARQUIVOS_LIDOS_PELO_GATE,
} from "../../../scripts/check_contratos.mjs";
import {
  ACOES_RECONCILIACAO,
  ASYNCAPI_CONTRACT_VERSION,
  ASYNCAPI_DOC_PATH,
  ASYNCAPI_SPEC_VERSION,
  CAMINHO_FLUXO_EVENTOS,
  CAMINHO_TICKET_EVENTOS,
  CONTRATO_CLIENTE_EVENTOS,
  DESCRICAO_ESTADO_CONEXAO,
  DESCRICAO_MOTIVO_ENCERRAMENTO,
  ESTADOS_CONEXAO,
  EVENTO_SSE_ESTADO_CONEXAO,
  EVENTO_SSE_INSTRUCAO_RECONCILIACAO,
  EVENTO_SSE_PULSACAO,
  LAST_EVENT_ID_HEADER,
  MOTIVOS_ENCERRAMENTO,
  POLITICA_EVOLUCAO_EVENTOS,
  TICKET_EVENTOS_COOKIE,
  TIPOS_EVENTO_FLUXO,
  type TipoEventoFluxo,
} from "./asyncapi.js";
// `EventoFluxo` (a interface completa do envelope de evento) vive em
// `./index.ts`, não em `./asyncapi.ts` (que só declara `TipoEventoFluxo`,
// o enum do campo `tipo`). O import anterior pedia `EventoFluxo` de
// `./asyncapi.js` — um especificador que NUNCA resolveu; `tsc` reprovava
// com `TS2305: Module has no exported member 'EventoFluxo'`, mas o vitest
// nunca viu o erro porque é `import type`, apagado na transpilação antes
// de qualquer tentativa de resolver o módulo em runtime. Verde falso
// estrutural (ACH-O3-2): o teste "typechecava" só porque nada checava tipo.
import type { EventoFluxo } from "./index.js";

const RAIZ_REPO = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const SCRIPT = join(RAIZ_REPO, "scripts/check_contratos.mjs");

/**
 * O que a raiz temporária precisa conter é declarado PELO PRÓPRIO GATE, não
 * espelhado aqui.
 *
 * Esta lista já foi um espelho manual, e derivou em silêncio: quando o gate
 * passou a exigir `packages/contratos/src/index.ts`, a cópia continuou sem
 * ele e os 12 testes abaixo falharam de uma vez — todos recebendo "arquivo de
 * contrato ausente" no lugar da mensagem específica que cada um afirma. O
 * espelho não é remendado; ele deixa de existir.
 */
const ARQUIVOS_DO_GATE = ARQUIVOS_LIDOS_PELO_GATE;

const temporarios: string[] = [];

afterAll(() => {
  for (const caminho of temporarios) rmSync(caminho, { recursive: true, force: true });
});

/** Copia só o que o gate lê, para poder mutar sem tocar no repositório. */
function montarRaizTemporaria(): string {
  const raiz = mkdtempSync(join(tmpdir(), "ic-contratos-"));
  temporarios.push(raiz);
  for (const relativo of ARQUIVOS_DO_GATE) {
    const destino = join(raiz, relativo);
    mkdirSync(dirname(destino), { recursive: true });
    cpSync(join(RAIZ_REPO, relativo), destino);
  }
  return raiz;
}

function rodarGate(raiz: string): { status: number; saida: string } {
  const execucao = spawnSync("node", [SCRIPT, "--raiz", raiz], { encoding: "utf8" });
  return {
    status: execucao.status ?? -1,
    saida: `${execucao.stdout}\n${execucao.stderr}`,
  };
}

/**
 * Aplica uma mutação a um arquivo da raiz temporária, EXIGINDO que ela tenha
 * efeito.
 *
 * A versão anterior escrevia o resultado do `transformar` sem olhar. Como
 * todas as chamadas são `texto.replace("âncora literal", ...)`, uma âncora que
 * deixasse de existir — arquivo reformatado, campo renomeado, linha
 * reindentada — produzia um no-op SILENCIOSO. Nos testes de "o gate reprova"
 * isso vira vermelho e alguém investiga; mas num teste de "o gate ACEITA" o
 * no-op é um FALSO-VERDE perfeito: o gate aprova a cópia intocada e o teste
 * comemora ter provado uma capacidade que nunca exercitou. `criarCopiaMutada`
 * em `scripts/check_contratos.mjs` já carrega exatamente esta guarda, pela
 * mesma razão registrada lá; aqui ela faltava.
 */
function mutar(raiz: string, relativo: string, transformar: (texto: string) => string): void {
  const caminho = join(raiz, relativo);
  const antes = readFileSync(caminho, "utf8");
  const depois = transformar(antes);
  if (depois === antes) {
    throw new Error(
      `mutação sem efeito em '${relativo}': o texto-alvo não existe mais no arquivo. ` +
        "Atualize a âncora antes de confiar neste teste — um no-op silencioso faz " +
        "asserção de aceitação passar sem ter mutado nada.",
    );
  }
  writeFileSync(caminho, depois, "utf8");
}

/**
 * Carrega um documento YAML do pacote como estrutura, via `python3` + PyYAML —
 * a MESMA dependência de gate que `scripts/check_contratos.mjs` já usa (o
 * lockfile JS não ganha dependência nova por causa de teste).
 *
 * Existe porque as asserções de FORMA abaixo precisam distinguir "a
 * propriedade está em `properties`" de "a propriedade está em `required`", e
 * uma busca por substring no texto não distingue as duas — passaria com o
 * campo declarado obrigatório, que é justamente a evolução INCOMPATÍVEL.
 */
function carregarYamlDoPacote(relativo: string): Record<string, unknown> {
  const caminho = join(RAIZ_REPO, "packages/contratos", relativo);
  const execucao = spawnSync(
    "python3",
    ["-c", "import json,sys,yaml; print(json.dumps(yaml.safe_load(open(sys.argv[1]))))", caminho],
    { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 },
  );
  if (execucao.status !== 0) {
    throw new Error(`falha ao ler ${relativo} com python3/PyYAML: ${execucao.stderr}`);
  }
  return JSON.parse(execucao.stdout) as Record<string, unknown>;
}

/** Corpo textual de uma `export interface` do fonte TypeScript. */
function corpoDaInterfaceTs(fonte: string, nome: string): string {
  const encontrado = new RegExp(`export interface ${nome}\\s*\\{([\\s\\S]*?)\\n\\}`, "m").exec(
    fonte,
  );
  if (encontrado?.[1] === undefined) {
    throw new Error(`interface '${nome}' não encontrada em src/asyncapi.ts`);
  }
  return encontrado[1];
}

/**
 * Propriedades de TOPO declaradas numa `export interface`, com a
 * OBRIGATORIEDADE de cada uma (`campo?:` é opcional).
 *
 * O REGEX ACEITA `readonly` PORQUE JÁ FOI CEGO A ELE, E ISSO CUSTOU CARO.
 * A versão anterior era `/^\s{2}(\w+)\??:/gm`, aqui e na cópia gêmea de
 * `scripts/check_contratos.mjs`. Ela NÃO casa `readonly campo: X` — depois
 * dos dois espaços vem `readonly`, e o `:` esperado não está ali. `readonly`
 * é o estilo DOMINANTE do repositório (medido: 4.775 ocorrências em `apps/` +
 * `packages/`, 15 delas no arquivo-irmão `./index.ts`); `./asyncapi.ts` usa
 * zero hoje, e era SÓ por isso que a cegueira não aparecia. No dia em que
 * alguém escrevesse a propriedade nova no estilo do resto do repositório, a
 * asserção "as propriedades são as MESMAS no TS e no YAML" passaria sobre um
 * campo que só existe de um lado — verde por invisibilidade, que é a forma de
 * verde vácuo mais cara de encontrar depois.
 *
 * Também aceita nome de propriedade CITADO (`"campo-x": T`), que o formatador
 * não desfaz, e continua ancorado em `^\s{2}`: só o nível de TOPO é lido —
 * propriedades aninhadas (4+ espaços) são deliberadamente ignoradas, porque
 * o schema YAML correspondente as aninha em `properties.<campo>.properties`,
 * caminho que esta comparação não percorre.
 */
function propriedadesComObrigatoriedadeTs(
  fonte: string,
  nome: string,
): { nome: string; opcional: boolean }[] {
  return [
    ...corpoDaInterfaceTs(fonte, nome).matchAll(
      /^\s{2}(?:readonly\s+)?(?:(\w+)|"([^"]+)")(\??):/gm,
    ),
  ].map((m) => ({ nome: m[1] ?? m[2] ?? "", opcional: m[3] === "?" }));
}

/**
 * Só os NOMES. Delega, para que exista UM regex e não dois que derivam — foi
 * exatamente "duas cópias do mesmo regex, ambas cegas ao mesmo estilo" que
 * produziu o defeito descrito acima.
 */
function propriedadesDaInterfaceTs(fonte: string, nome: string): string[] {
  return propriedadesComObrigatoriedadeTs(fonte, nome).map((p) => p.nome);
}

/** Navega um caminho de chaves, falhando alto (nunca `undefined` silencioso). */
function em(documento: unknown, ...chaves: string[]): Record<string, unknown> {
  let atual: unknown = documento;
  for (const chave of chaves) {
    if (typeof atual !== "object" || atual === null || !(chave in atual)) {
      throw new Error(`caminho ausente no documento: ${chaves.join(".")} (parou em '${chave}')`);
    }
    atual = (atual as Record<string, unknown>)[chave];
  }
  if (typeof atual !== "object" || atual === null) {
    throw new Error(`caminho ${chaves.join(".")} não é um objeto`);
  }
  return atual as Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Vocabulário do contrato
// ---------------------------------------------------------------------------

describe("vocabulário do canal de eventos", () => {
  /**
   * F3 (revisão adversarial): a asserção anterior era CIRCULAR — extraía
   * `TIPOS_EVENTO_FLUXO[0]` para dentro de `evento.tipo` e então checava que
   * `TIPOS_EVENTO_FLUXO` "contém" esse mesmo valor. Um array sempre contém o
   * seu próprio primeiro elemento; a asserção não podia falhar para NENHUM
   * conteúdo não vazio, inclusive um array corrompido para um único valor
   * absurdo (provado fora da suíte: `TIPOS_EVENTO_FLUXO = ["evento-que-nao-
   * deveria-existir"]` ainda passava). O nome prometia "é a fonte única do
   * tipo de EventoFluxo" — uma propriedade de TIPO, que só o compilador
   * garante (a linha `tipo: amostra` não compila se `EventoFluxo["tipo"]`
   * deixar de derivar da tupla) — mas a asserção de RUNTIME não testava essa
   * propriedade nem nenhuma outra sobre o CONTEÚDO do enum.
   *
   * A correção ancora o esperado em LITERAIS INDEPENDENTES — não derivados de
   * `TIPOS_EVENTO_FLUXO` — no mesmo padrão já usado abaixo para
   * `MOTIVOS_ENCERRAMENTO`. Isto detecta perda de um tipo documentado; a
   * seção "check_contratos: o gate REPROVA" mais abaixo já cobre invenção e
   * divergência entre TS/YAML/catálogo/outbox.
   */
  it("tipa EventoFluxo a partir da tupla e preserva os tipos-base do catálogo, sem duplicatas", () => {
    // Se `EventoFluxo["tipo"]` deixar de derivar da tupla, isto não compila.
    const evento: EventoFluxo = {
      sequencia: 1,
      tipo: "avaliacao-computada",
      tenantId: "SYNTH-TENANT-G7",
      ocorridoEm: "2026-08-16T12:00:00.000Z",
      dados: {},
    };
    expect(evento.tipo).toBe("avaliacao-computada");
    for (const esperado of [
      "observacoes-ingeridas",
      "observacao-clinica-registrada",
      "avaliacao-computada",
      "alerta-criado",
      "alerta-atualizado",
    ] as const satisfies readonly TipoEventoFluxo[]) {
      expect(
        TIPOS_EVENTO_FLUXO,
        `TIPOS_EVENTO_FLUXO perdeu o tipo documentado '${esperado}'`,
      ).toContain(esperado);
    }
    expect(new Set(TIPOS_EVENTO_FLUXO).size).toBe(TIPOS_EVENTO_FLUXO.length);
  });

  it("declara os seis estados de conexão de ADR-0011 P6, nas palavras da cláusula", () => {
    expect([...ESTADOS_CONEXAO]).toEqual([
      "online",
      "degraded",
      "offline",
      "reconnecting",
      "replaying",
      "reconciled",
    ]);
  });

  it("todo estado e todo motivo tem descrição pt-BR pronta para exibição", () => {
    for (const estado of ESTADOS_CONEXAO) {
      expect(DESCRICAO_ESTADO_CONEXAO[estado].length).toBeGreaterThan(10);
    }
    for (const motivo of MOTIVOS_ENCERRAMENTO) {
      expect(DESCRICAO_MOTIVO_ENCERRAMENTO[motivo].length).toBeGreaterThan(10);
    }
  });

  it("a reconciliação por polling é uma ação declarada (ADR-0011 P8)", () => {
    expect(ACOES_RECONCILIACAO).toContain("reconciliar-por-polling");
  });

  it("os motivos cobrem lacuna de cursor, fila cheia e perda de autorização", () => {
    for (const esperado of [
      "cursor-irretomavel",
      "fila-excedida",
      "autorizacao-revogada",
      "sessao-expirada",
      "contexto-alterado",
      "escopo-divergente",
    ]) {
      expect(MOTIVOS_ENCERRAMENTO).toContain(esperado);
    }
  });

  it("tem motivo honesto para falha do próprio servidor (ACHADO 7)", () => {
    // Sem este valor, uma falha assíncrona só teria dois destinos: mentir
    // reusando outro motivo, ou morrer calada. ADR-0011 P6/P10 e o prompt
    // §20 proíbem os dois. Acrescentar valor a enum de plano de controle é
    // evolução COMPATÍVEL pela política declarada neste mesmo módulo.
    expect(MOTIVOS_ENCERRAMENTO).toContain("falha-interna");
    expect(POLITICA_EVOLUCAO_EVENTOS.compativel).toContain(
      "acrescentar valor a enum de plano de controle (motivo, estado de conexão)",
    );
    const descricao = DESCRICAO_MOTIVO_ENCERRAMENTO["falha-interna"];
    // A descrição diz ao clínico que a tela pode estar velha e manda
    // reconciliar — nunca expõe detalhe interno do erro.
    expect(descricao).toContain("desatualizado");
    expect(descricao).toContain("polling");
  });

  it("declara a política de evolução, com a quebra nomeada explicitamente", () => {
    expect(POLITICA_EVOLUCAO_EVENTOS.quebra.length).toBeGreaterThan(0);
    expect(POLITICA_EVOLUCAO_EVENTOS.regraConsumidor).toContain("polling");
  });

  it("o contrato de cliente proíbe credencial na URL e exige reconciliação", () => {
    const texto = CONTRATO_CLIENTE_EVENTOS.join("\n");
    expect(texto).toContain("Nunca pôr credencial");
    expect(texto).toContain("polling");
    expect(texto).toContain("cursor durável");
  });

  it("nomeia o transporte do handshake sem pô-lo em query string", () => {
    expect(TICKET_EVENTOS_COOKIE).toBe("ic_ticket_eventos");
    expect(LAST_EVENT_ID_HEADER).toBe("Last-Event-ID");
  });

  it("identifica o documento e a versão da spec", () => {
    expect(ASYNCAPI_DOC_PATH).toBe("asyncapi.yaml");
    expect(ASYNCAPI_SPEC_VERSION).toBe("3.0.0");
    expect(ASYNCAPI_CONTRACT_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("os nomes de evento SSE do plano de controle são estáveis", () => {
    expect(EVENTO_SSE_PULSACAO).toBe("pulsacao");
    expect(EVENTO_SSE_ESTADO_CONEXAO).toBe("estado-conexao");
    expect(EVENTO_SSE_INSTRUCAO_RECONCILIACAO).toBe("instrucao-reconciliacao");
  });
});

// ---------------------------------------------------------------------------
// O que o servidor ANUNCIA — as duas lacunas medidas no consumo do navegador
// ---------------------------------------------------------------------------

describe("o intervalo de pulsação é ANUNCIADO, não adivinhado", () => {
  /**
   * LACUNA MEDIDA (handoff do consumo de push no navegador, LAC-L1): o
   * `asyncapi.yaml` afirmava "a AUSÊNCIA de pulsação dentro do intervalo
   * anunciado é o sinal de que a conexão morreu" e NENHUM campo carregava esse
   * intervalo — `intervaloPulsacaoMs` só existia em `LimitesConexao`
   * (`apps/api/src/eventos/fila.ts`), do lado do servidor.
   *
   * A consequência era de segurança clínica, não de estética de contrato:
   * entre a abertura e a PRIMEIRA pulsação o cliente não tinha referência
   * alguma para armar vigia, e uma conexão meio-aberta nessa janela só seria
   * percebida por erro de transporte — a mesma classe de HAZ-0025/SAF-0025
   * ("uma tela que parece atual sem estar").
   */
  /**
   * POR QUE ESTE CONFRONTO É POR LEITURA DE FONTE, E NÃO POR ANOTAÇÃO DE TIPO.
   * `packages/contratos/tsconfig.json` EXCLUI `src/**\/*.test.ts` do
   * `typecheck`, então uma asserção puramente de tipo escrita aqui (declarar um
   * literal `MensagemPulsacao` com o campo novo) nunca seria compilada por
   * gate algum: passaria no vitest, que apaga os tipos, e não provaria nada.
   * Ler o fonte e comparar com o YAML é a MESMA técnica de
   * `scripts/check_contratos.mjs`, e essa tem dentes.
   *
   * O lado TypeScript ganha verificação de compilador por outro caminho, que
   * é o único que importa: `apps/api/src/eventos/stream.ts` ATRIBUI o campo em
   * um valor tipado `MensagemPulsacao`/`MensagemEstadoConexao`, e aquele pacote
   * typecheca. Campo ausente da interface reprova o build da API.
   */
  it("as propriedades das mensagens de controle são as MESMAS no TS e no YAML", () => {
    const fonte = readFileSync(join(RAIZ_REPO, "packages/contratos/src/asyncapi.ts"), "utf8");
    const documento = carregarYamlDoPacote("asyncapi.yaml");

    const pares: [string, string][] = [
      ["MensagemPulsacao", "MensagemPulsacao"],
      ["MensagemEstadoConexao", "MensagemEstadoConexao"],
      ["MensagemInstrucaoReconciliacao", "MensagemInstrucaoReconciliacao"],
      ["PoliticaReconexao", "PoliticaReconexao"],
    ];
    expect(pares.length, "lista de pares vazia — o laço não provaria nada").toBeGreaterThan(0);

    for (const [nomeTs, nomeSchema] of pares) {
      const noTs = propriedadesDaInterfaceTs(fonte, nomeTs);
      const noYaml = Object.keys(em(documento, "components", "schemas", nomeSchema, "properties"));
      expect(noTs.length, `interface ${nomeTs} sem propriedades extraídas`).toBeGreaterThan(0);
      expect(
        [...noTs].sort(),
        `propriedades divergentes entre a interface ${nomeTs} e o schema ${nomeSchema}`,
      ).toEqual([...noYaml].sort());
    }
  });

  /**
   * O TESTE ACIMA VALE O QUE O EXTRATOR ENXERGA — E ISSO PRECISA SER TESTADO
   * SEPARADAMENTE.
   *
   * A comparação de conjuntos é verdadeira sobre o que foi EXTRAÍDO, não sobre
   * o que está ESCRITO. Enquanto o extrator foi cego a `readonly`, aquele
   * `toEqual` permanecia verde com um campo que só existia no TS: os dois
   * lados "coincidiam" porque o campo era invisível de um deles. Nenhuma
   * asserção sobre os arquivos reais podia detectar isso, porque
   * `./asyncapi.ts` não usa `readonly` hoje — a cegueira só aparece sobre
   * entrada que o repositório ainda não escreveu, e é por isso que a entrada
   * é sintética aqui.
   *
   * Não é tautológico: o literal abaixo é a ENTRADA; a asserção é sobre a
   * SAÍDA da função sob teste. Ela falha se o extrator perder qualquer um dos
   * quatro estilos, e falha se passar a enxergar a propriedade ANINHADA — que
   * precisa continuar fora, porque o schema YAML correspondente a aninha em
   * `properties.<campo>.properties`, caminho que a comparação não percorre.
   */
  it("o extrator enxerga `readonly`, `readonly ?` e nome citado, e ignora propriedade aninhada", () => {
    const fonteSintetica = [
      "export interface AlvoSintetico {",
      "  simples: string;",
      "  opcional?: string;",
      "  readonly somenteLeitura: number;",
      "  readonly somenteLeituraOpcional?: number;",
      '  "nome-citado": string;',
      "  readonly listaImutavel: readonly string[];",
      "  readonly: string;",
      "  aninhado: {",
      "    naoContaAqui: string;",
      "  };",
      "}",
      "",
    ].join("\n");

    expect(propriedadesComObrigatoriedadeTs(fonteSintetica, "AlvoSintetico")).toEqual([
      { nome: "simples", opcional: false },
      { nome: "opcional", opcional: true },
      { nome: "somenteLeitura", opcional: false },
      { nome: "somenteLeituraOpcional", opcional: true },
      { nome: "nome-citado", opcional: false },
      { nome: "listaImutavel", opcional: false },
      { nome: "readonly", opcional: false },
      { nome: "aninhado", opcional: false },
    ]);
  });

  /**
   * OBRIGATORIEDADE, e não só presença. `POLITICA_EVOLUCAO_EVENTOS.quebra`
   * declara "estreitar tipo ou tornar campo obrigatório" como evolução
   * INCOMPATÍVEL — e o conjunto de nomes não muda quando um campo passa a ser
   * obrigatório de um lado só. Medido antes de escrever esta asserção: mover
   * `intervaloPulsacaoMs` para `required` no YAML saía exit 0 no gate.
   *
   * A asserção anterior mais próxima (`not.toContain` sobre `required`) cobre
   * DOIS campos nomeados de DUAS mensagens; esta cobre TODAS as propriedades
   * das QUATRO interfaces, nas duas direções, e não precisa ser reescrita
   * quando um campo novo entrar.
   */
  it("a obrigatoriedade de cada propriedade é a MESMA no TS e no YAML", () => {
    const fonte = readFileSync(join(RAIZ_REPO, "packages/contratos/src/asyncapi.ts"), "utf8");
    const documento = carregarYamlDoPacote("asyncapi.yaml");

    const nomes = [
      "MensagemPulsacao",
      "MensagemEstadoConexao",
      "MensagemInstrucaoReconciliacao",
      "PoliticaReconexao",
    ];
    expect(nomes.length, "lista vazia — o laço não provaria nada").toBeGreaterThan(0);

    let obrigatoriosVistos = 0;
    let opcionaisVistos = 0;
    for (const nome of nomes) {
      const declaradas = propriedadesComObrigatoriedadeTs(fonte, nome);
      expect(declaradas.length, `interface ${nome} sem propriedades extraídas`).toBeGreaterThan(0);
      obrigatoriosVistos += declaradas.filter((p) => !p.opcional).length;
      opcionaisVistos += declaradas.filter((p) => p.opcional).length;

      const schema = em(documento, "components", "schemas", nome);
      const required = Array.isArray(schema.required) ? (schema.required as string[]) : [];
      expect(
        declaradas
          .filter((p) => !p.opcional)
          .map((p) => p.nome)
          .sort(),
        `obrigatoriedade divergente entre a interface ${nome} e o schema ${nome}`,
      ).toEqual([...required].sort());
    }

    // Guarda de não-vacuidade nas DUAS direções: um documento em que tudo
    // fosse opcional dos dois lados satisfaria os `toEqual` acima com listas
    // vazias, e um em que tudo fosse obrigatório nunca exercitaria o `?`.
    expect(obrigatoriosVistos, "nenhuma propriedade obrigatória exercitada").toBeGreaterThan(0);
    expect(opcionaisVistos, "nenhuma propriedade opcional exercitada").toBeGreaterThan(0);
  });

  /**
   * A ASSERÇÃO ANTERIOR MEDIA A COISA ERRADA (lente "nome que promete mais que
   * a asserção"). Ela era `toMatch(/^\s{2}${campo}\?:/m)` — o que, além de
   * exigir o `?`, exigia que a linha NÃO tivesse `readonly`. O nome do teste
   * fala de OBRIGATORIEDADE; a regex também reprovava
   * `readonly intervaloPulsacaoMs?: number`, que é opcional e conforme.
   * Confundir "opcional" com "sem readonly" é o mesmo erro de leitura que
   * produziu HOLE-1 no extrator.
   *
   * A troca não afrouxa nada: tudo que a regex antiga rejeitava continua
   * rejeitado — campo declarado obrigatório (`campo: T`) reprova em
   * `opcional === true`, e campo AUSENTE reprova em `toBeDefined()`, que a
   * regex antiga cobria por não casar. O que deixou de reprovar é apenas a
   * declaração conforme escrita no estilo dominante do repositório.
   */
  it("os campos novos são OPCIONAIS no TypeScript — obrigatório seria QUEBRA", () => {
    const fonte = readFileSync(join(RAIZ_REPO, "packages/contratos/src/asyncapi.ts"), "utf8");

    const alvos = [
      ["MensagemPulsacao", "intervaloPulsacaoMs"],
      ["MensagemEstadoConexao", "intervaloPulsacaoMs"],
      ["MensagemEstadoConexao", "reconexao"],
    ] as const;
    expect(alvos.length, "lista de alvos vazia — o laço não provaria nada").toBeGreaterThan(0);

    for (const [interfaceTs, campo] of alvos) {
      const declarada = propriedadesComObrigatoriedadeTs(fonte, interfaceTs).find(
        (p) => p.nome === campo,
      );
      expect(declarada, `${interfaceTs} não declara ${campo}`).toBeDefined();
      expect(
        declarada?.opcional,
        `${interfaceTs}.${campo} precisa ser OPCIONAL — torná-lo obrigatório é evolução QUEBRA`,
      ).toBe(true);
    }

    expect(POLITICA_EVOLUCAO_EVENTOS.compativel).toContain(
      "acrescentar campo opcional a uma mensagem",
    );
    expect(POLITICA_EVOLUCAO_EVENTOS.quebra).toContain(
      "estreitar tipo ou tornar campo obrigatório",
    );
  });

  it("o documento AsyncAPI declara os dois campos, e NENHUM deles em `required`", () => {
    const documento = carregarYamlDoPacote("asyncapi.yaml");

    const pulsacao = em(documento, "components", "schemas", "MensagemPulsacao");
    const propriedadesPulsacao = em(pulsacao, "properties");
    expect(Object.keys(propriedadesPulsacao)).toContain("intervaloPulsacaoMs");
    expect(pulsacao.required).not.toContain("intervaloPulsacaoMs");

    const estado = em(documento, "components", "schemas", "MensagemEstadoConexao");
    const propriedadesEstado = em(estado, "properties");
    expect(Object.keys(propriedadesEstado)).toContain("intervaloPulsacaoMs");
    expect(Object.keys(propriedadesEstado)).toContain("reconexao");
    expect(estado.required).not.toContain("intervaloPulsacaoMs");
    expect(estado.required).not.toContain("reconexao");

    // A política de reconexão anunciada é a MESMA estrutura da instrução —
    // um segundo schema paralelo seria a duplicação que este gate combate.
    expect(em(propriedadesEstado, "reconexao").$ref).toBe("#/components/schemas/PoliticaReconexao");

    // Guarda de não-vacuidade: os `not.toContain` acima passariam sobre um
    // `required` inexistente. Ele existe e não está vazio.
    expect(Array.isArray(pulsacao.required) && (pulsacao.required as string[]).length > 0).toBe(
      true,
    );
    expect(Array.isArray(estado.required) && (estado.required as string[]).length > 0).toBe(true);
  });
});

describe("caminhos do canal publicados pelo contrato", () => {
  /**
   * Por que estas constantes vivem no contrato, e não em cada consumidor: a
   * fronteira de módulo (`scripts/check_module_boundaries.mjs`) permite
   * `apps/web -> SOMENTE contratos`, logo o frontend NÃO pode importar
   * `apps/api/src/eventos/stream.ts`, onde as rotas eram declaradas. Sem
   * publicá-las aqui, todo consumidor de navegador é obrigado a redigitar a
   * rota — e rota redigitada deriva.
   */
  it("o caminho do fluxo é EXATAMENTE o endereço do canal no AsyncAPI", () => {
    const documento = carregarYamlDoPacote("asyncapi.yaml");
    const canal = em(documento, "channels", "fluxoDeEventos");
    expect(canal.address).toBe(CAMINHO_FLUXO_EVENTOS);
  });

  it("o caminho do ticket é EXATAMENTE uma rota declarada no OpenAPI", () => {
    const documento = carregarYamlDoPacote("openapi.yaml");
    const rotas = em(documento, "paths");
    expect(Object.keys(rotas)).toContain(CAMINHO_TICKET_EVENTOS);
    expect(Object.keys(rotas)).toContain(CAMINHO_FLUXO_EVENTOS);
  });

  it("nenhum caminho carrega query string — escopo e credencial não viajam ali", () => {
    for (const caminho of [CAMINHO_TICKET_EVENTOS, CAMINHO_FLUXO_EVENTOS]) {
      expect(caminho).not.toContain("?");
      expect(caminho.startsWith("/v1/")).toBe(true);
    }
  });

  it("o contrato de cliente cita os dois caminhos publicados", () => {
    const texto = CONTRATO_CLIENTE_EVENTOS.join("\n");
    expect(texto).toContain(CAMINHO_TICKET_EVENTOS);
    expect(texto).toContain(CAMINHO_FLUXO_EVENTOS);
  });
});

// ---------------------------------------------------------------------------
// O gate — nos dois sentidos
// ---------------------------------------------------------------------------

describe("check_contratos: o gate APROVA os documentos reais", () => {
  it("passa sobre uma cópia intocada do repositório", () => {
    const { status, saida } = rodarGate(montarRaizTemporaria());
    expect(saida).toContain("OK");
    expect(status).toBe(0);
  }, 60_000);

  /**
   * GUARDA CONTRA A CLASSE DE DEFEITO QUE ESTA SUÍTE JÁ SOFREU.
   *
   * Enquanto a lista de arquivos a copiar foi um espelho manual do que o gate
   * lê, ela derivou em silêncio: o gate passou a exigir
   * `packages/contratos/src/index.ts`, a cópia continuou sem ele, e os 12
   * testes de reprovação falharam de uma vez — todos recebendo "arquivo de
   * contrato ausente" no lugar da mensagem específica que cada um afirma. O
   * sintoma escondia a causa.
   *
   * A asserção é sobre o SISTEMA DE ARQUIVOS da raiz montada, não sobre
   * álgebra de listas: comparar as duas constantes entre si seria tautológico,
   * porque uma é construída a partir da outra. O que pode de fato quebrar é a
   * CÓPIA — um caminho que existe na lista e não chega ao disco (diretório não
   * criado, arquivo movido no repositório, `cpSync` silenciosamente pulado).
   */
  it("a raiz temporária contém, em disco, cada arquivo que o gate exige", () => {
    expect(
      ARQUIVOS_DE_CONTRATO_OBRIGATORIOS.length,
      "lista de exigidos vazia — o laço abaixo não provaria nada",
    ).toBeGreaterThan(0);

    const raiz = montarRaizTemporaria();
    for (const relativo of ARQUIVOS_DE_CONTRATO_OBRIGATORIOS) {
      expect(
        existsSync(join(raiz, relativo)),
        `o gate exige ${relativo}, e a raiz temporária não o recebeu`,
      ).toBe(true);
    }
  }, 60_000);
});

describe("check_contratos: o gate REPROVA — a metade que prova que ele serve", () => {
  it("reprova AsyncAPI com enum de eventos divergente do contrato TypeScript", () => {
    const raiz = montarRaizTemporaria();
    mutar(raiz, "packages/contratos/asyncapi.yaml", (texto) =>
      texto.replace("        - alerta-atualizado\n", ""),
    );
    const { status, saida } = rodarGate(raiz);
    expect(status).toBe(1);
    expect(saida).toContain("Enum de eventos divergente");
  }, 60_000);

  it("reprova evento INVENTADO, mesmo quando TS e YAML concordam entre si", () => {
    const raiz = montarRaizTemporaria();
    mutar(raiz, "packages/contratos/src/asyncapi.ts", (texto) =>
      texto.replace('"alerta-atualizado",', '"alerta-atualizado",\n  "evento-que-ninguem-produz",'),
    );
    mutar(raiz, "packages/contratos/asyncapi.yaml", (texto) =>
      texto.replace(
        "        - alerta-atualizado\n",
        "        - alerta-atualizado\n        - evento-que-ninguem-produz\n",
      ),
    );
    const { status, saida } = rodarGate(raiz);
    expect(status).toBe(1);
    expect(saida).toContain("Evento INVENTADO");
  }, 60_000);

  it("reprova quando o contrato deixa de declarar um evento que a API emite", () => {
    const raiz = montarRaizTemporaria();
    mutar(raiz, "packages/contratos/src/asyncapi.ts", (texto) =>
      texto.replace('  "observacao-clinica-registrada",\n', ""),
    );
    mutar(raiz, "packages/contratos/asyncapi.yaml", (texto) =>
      texto.replace("        - observacao-clinica-registrada\n", ""),
    );
    const { status, saida } = rodarGate(raiz);
    expect(status).toBe(1);
    expect(saida).toContain("A API não pode emitir o que o contrato não declara");
  }, 60_000);

  it("reprova AsyncAPI sintaticamente inválido", () => {
    const raiz = montarRaizTemporaria();
    mutar(raiz, "packages/contratos/asyncapi.yaml", (texto) =>
      texto.replace("channels:", "channels:\n   \t- isto não é YAML válido: [{"),
    );
    const { status, saida } = rodarGate(raiz);
    expect(status).toBe(1);
    expect(saida).toContain("não é YAML válido");
  }, 60_000);

  it("reprova chave YAML duplicada — que um parser tolerante engoliria em silêncio", () => {
    const raiz = montarRaizTemporaria();
    mutar(raiz, "packages/contratos/asyncapi.yaml", (texto) =>
      texto.replace("operations:", "operations: {}\noperations:"),
    );
    const { status, saida } = rodarGate(raiz);
    expect(status).toBe(1);
    expect(saida).toContain("duplicada");
  }, 60_000);

  it("reprova referência que não resolve", () => {
    const raiz = montarRaizTemporaria();
    mutar(raiz, "packages/contratos/asyncapi.yaml", (texto) =>
      texto.replace(
        '$ref: "#/components/schemas/MensagemPulsacao"',
        '$ref: "#/components/schemas/EsquemaQueNaoExiste"',
      ),
    );
    const { status, saida } = rodarGate(raiz);
    expect(status).toBe(1);
    expect(saida).toContain("não resolve");
  }, 60_000);

  it("reprova mensagem sem payload — mensagem sem esquema não é contrato", () => {
    const raiz = montarRaizTemporaria();
    mutar(raiz, "packages/contratos/asyncapi.yaml", (texto) =>
      texto.replace('      payload:\n        $ref: "#/components/schemas/MensagemPulsacao"\n', ""),
    );
    const { status, saida } = rodarGate(raiz);
    expect(status).toBe(1);
    expect(saida).toMatch(/sem 'payload'|não resolve/);
  }, 60_000);

  it("reprova vocabulário de plano de controle divergente", () => {
    const raiz = montarRaizTemporaria();
    mutar(raiz, "packages/contratos/asyncapi.yaml", (texto) =>
      texto.replace("        - reconciled\n", ""),
    );
    const { status, saida } = rodarGate(raiz);
    expect(status).toBe(1);
    expect(saida).toContain("Vocabulário divergente");
  }, 60_000);

  it("reprova credencial em query string no OpenAPI (anti-padrão §10-12)", () => {
    const raiz = montarRaizTemporaria();
    mutar(raiz, "packages/contratos/openapi.yaml", (texto) =>
      texto.replace(
        "        - name: cursor\n          in: query",
        "        - name: token\n          in: query",
      ),
    );
    const { status, saida } = rodarGate(raiz);
    expect(status).toBe(1);
    expect(saida).toContain("proibido");
  }, 60_000);

  it("reprova esquema de segurança que trafega em query string", () => {
    const raiz = montarRaizTemporaria();
    mutar(raiz, "packages/contratos/asyncapi.yaml", (texto) =>
      texto.replace("      in: cookie", "      in: query"),
    );
    const { status, saida } = rodarGate(raiz);
    expect(status).toBe(1);
    expect(saida).toContain("query string");
  }, 60_000);

  it("reprova divergência do nome do cookie de ticket entre TS e AsyncAPI", () => {
    const raiz = montarRaizTemporaria();
    mutar(raiz, "packages/contratos/asyncapi.yaml", (texto) =>
      texto.replace("      name: ic_ticket_eventos", "      name: outro_cookie"),
    );
    const { status, saida } = rodarGate(raiz);
    expect(status).toBe(1);
    expect(saida).toContain("cookie de ticket divergente");
  }, 60_000);

  it("reprova quando o documento AsyncAPI simplesmente não existe", () => {
    const raiz = montarRaizTemporaria();
    rmSync(join(raiz, "packages/contratos/asyncapi.yaml"));
    const { status, saida } = rodarGate(raiz);
    expect(status).toBe(1);
    expect(saida).toContain("ausente");
  }, 60_000);

  /**
   * O BURACO QUE A REVISÃO ADVERSARIAL MEDIU (HOLE-1), agora no gate real.
   * MEDIDO antes da correção, com este mesmo texto de mutação: exit 0, "204
   * verificações... OK". A mutação irmã sem `readonly` já reprovava — e
   * reprovava por estar escrita no único estilo que o extrator enxergava.
   */
  it("reprova propriedade `readonly` acrescentada só na interface do TS", () => {
    const raiz = montarRaizTemporaria();
    mutar(raiz, "packages/contratos/src/asyncapi.ts", (texto) =>
      texto.replace(
        "  jitter: number;\n}",
        "  jitter: number;\n  readonly campoFantasma: string;\n}",
      ),
    );
    const { status, saida } = rodarGate(raiz);
    expect(status).toBe(1);
    expect(saida).toContain("Propriedades divergentes");
    expect(saida).toContain("campoFantasma");
  }, 60_000);

  /**
   * A DIREÇÃO OPOSTA, que bateria só de mutações nunca pega: o gate reprovando
   * o CORRETO. Anotar `readonly` numa propriedade já conforme fazia o conjunto
   * do TS perder o campo; da posição de quem lê a falha, a propriedade "só
   * existe no YAML", e o conserto natural é apagá-la de lá — criando a
   * divergência real que o gate deveria evitar. MEDIDO antes da correção:
   * exit 1, "Propriedades divergentes ... PoliticaReconexao".
   */
  it("ACEITA propriedade conforme apenas anotada `readonly` — não pune o estilo do repositório", () => {
    const raiz = montarRaizTemporaria();
    mutar(raiz, "packages/contratos/src/asyncapi.ts", (texto) =>
      texto.replace("  jitter: number;\n}", "  readonly jitter: number;\n}"),
    );
    const { status, saida } = rodarGate(raiz);
    expect(saida).toContain("OK");
    expect(status).toBe(0);
    // Não-vacuidade: "0 falhas" também é o que sai quando uma checagem foi
    // PULADA. A cópia anotada tem de rodar o MESMO número de verificações que
    // a intocada — comparação entre duas execuções, não número transcrito.
    const intocada = rodarGate(montarRaizTemporaria());
    const contar = (texto: string): string | undefined =>
      /OK — (\d+) verificações/.exec(texto)?.[1];
    expect(
      contar(intocada.saida),
      "não foi possível ler a contagem da execução intocada",
    ).toBeDefined();
    expect(contar(saida)).toBe(contar(intocada.saida));
  }, 120_000);

  /**
   * Obrigatoriedade (Parte G1b). O conjunto de NOMES continua idêntico dos
   * dois lados — era exatamente por isso que a quebra que
   * `POLITICA_EVOLUCAO_EVENTOS.quebra` nomeia ("tornar campo obrigatório")
   * atravessava o gate. MEDIDO antes da correção: exit 0.
   */
  it("reprova campo opcional no TS declarado obrigatório no YAML (evolução QUEBRA)", () => {
    const raiz = montarRaizTemporaria();
    mutar(raiz, "packages/contratos/asyncapi.yaml", (texto) =>
      texto.replace(
        "      required: [emitidoEm, estado, cursor, pendentes]",
        "      required: [emitidoEm, estado, cursor, pendentes, intervaloPulsacaoMs]",
      ),
    );
    const { status, saida } = rodarGate(raiz);
    expect(status).toBe(1);
    expect(saida).toContain("Obrigatoriedade divergente");
  }, 60_000);
});
