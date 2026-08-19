/**
 * apps/web/src/api/prontidao.ts
 *
 * Consumo de `GET /v1/readyz` (operação `obterProntidao` do contrato) pela
 * camada clínica — fechamento de LAC-L2 no lado do frontend.
 *
 * POR QUE ESTE ARQUIVO EXISTE. `QAS-0023` exige que a "contagem de degradações
 * sem representação visível ao usuário" seja ZERO. Até aqui ela era ≥ 1: a API
 * respondia 503 PERMANENTE em `/v1/readyz` (sem bundle RULE-GCS, sem nenhum
 * alvo de frescor validado) e `apps/web` não consumia a superfície — a tela
 * clínica ficava calma e plausível enquanto o serviço declarava não ter
 * capacidade segura. `SAF-0025` é explícita: "The interface MUST never appear
 * healthy when feeds, workers, rules, identity, or freshness are impaired", e
 * "operator-only dashboards do not satisfy this requirement".
 *
 * O 503 NÃO É DEFEITO A CONTORNAR. Ele é o retrato honesto do safety case M0
 * (0 vias clínicas acionáveis). Este módulo não o "corrige", não o suaviza e
 * não o converte em erro de tela: ele o EXIBE, com as razões codificadas que o
 * relatório traz.
 *
 * TEXTO: DE ONDE VEM. O `codigo` é vocabulário FECHADO do contrato e aparece
 * literalmente na tela; o `detalhe` é texto pt-BR de operação redigido pelo
 * BACKEND e é exibido verbatim. Este arquivo NÃO traduz código de razão para
 * frase própria — seria uma segunda redação, divergente da do servidor, para o
 * mesmo fato (ADR-0021 F1/F3, ADR-0008 N3: as razões são do backend).
 *
 * ANÔNIMO POR CONTRATO. `/v1/readyz` declara `security: []` — um balanceador
 * não porta credencial clínica. Por isso este leitor NÃO usa `ProvedorSessao`:
 * ele continua funcionando (e continua declarando a degradação) mesmo quando a
 * sessão falhou, que é justamente quando a tela mais precisa dizer algo.
 *
 * Rastreio: ADR-0011 P6, ADR-0020 O4, SAF-0025, QAS-0023, HAZ-0025, LAC-L2.
 */
import {
  CODIGOS_RAZAO_PRONTIDAO,
  type CodigoRazaoProntidao,
  type VereditoProntidao,
} from "@intensicare/contratos";
import type { RespostaApi } from "./tipos.js";

/** Caminho da superfície de prontidão (`openapi.yaml`, `obterProntidao`). */
export const CAMINHO_PRONTIDAO = "/v1/readyz";

/**
 * `VereditoProntidao` — REEXPORTADO do contrato. Era declarado localmente como
 * um union literal; a duplicação foi fechada pelo mesmo motivo dos códigos de
 * razão logo abaixo.
 */
export type { VereditoProntidao };

const VEREDITOS: ReadonlySet<string> = new Set<VereditoProntidao>([
  "ready",
  "degraded",
  "not_ready",
]);

/**
 * Vocabulário FECHADO de razões de prontidão — IMPORTADO do contrato, não mais
 * espelhado.
 *
 * O ESPELHO MANUAL FOI APAGADO. Ele existia porque `@intensicare/contratos` não
 * exportava os tipos de saúde, e a nota antiga aqui registrava a própria
 * fraqueza: a lista era uma segunda fonte, e o teste que a confrontaria com o
 * `openapi.yaml` não era escrevível a partir de `apps/web` (o YAML está fora da
 * fronteira de leitura de build). Duas listas sem confronto possível é a forma
 * mais silenciosa de deriva que existe — um código acrescentado ao contrato
 * simplesmente passaria a chegar como "não reconhecido por esta versão da
 * interface", sem que nada ficasse vermelho.
 *
 * O contrato passou a exportar `CODIGOS_RAZAO_PRONTIDAO`, confrontado com o
 * `openapi.yaml` pela Seção F de `scripts/check_contratos.mjs` (divergência
 * FALHA o gate). Importando, o frontend herda esse confronto de graça e a
 * segunda fonte deixa de existir.
 *
 * A lista NÃO é usada para RECUSAR códigos desconhecidos: ver
 * `interpretarProntidao`. Degradação descartada por desconhecimento é
 * degradação silenciosa, e QAS-0023 exige contagem ZERO disso.
 */
export const CODIGOS_RAZAO_CONHECIDOS = CODIGOS_RAZAO_PRONTIDAO;

export type { CodigoRazaoProntidao };

export interface RazaoDeProntidaoVisao {
  /**
   * O código, como veio do servidor. Deliberadamente `string` e não o union:
   * um código que esta versão do frontend não conhece precisa APARECER, não
   * sumir. Descartar razão desconhecida seria produzir uma degradação sem
   * representação visível — o defeito que este módulo existe para eliminar.
   */
  readonly codigo: string;
  /** `false` quando o código não está no vocabulário desta versão do frontend. */
  readonly reconhecido: boolean;
  /** Texto pt-BR de operação, redigido pelo BACKEND. Exibido verbatim. */
  readonly detalhe: string;
}

/**
 * De onde veio a leitura. Distinguir isto importa: "o servidor declarou
 * degradado" e "não consegui perguntar" são fatos diferentes, e achatá-los num
 * só faria a tela afirmar algo que não observou.
 */
export type OrigemProntidao =
  /** Corpo `RelatorioProntidao` legível, com veredito. */
  | "relatorio"
  /** Corpo `ProntidaoNaoAvaliada`: a própria avaliação falhou (fail-closed). */
  | "nao_avaliada"
  /** Houve resposta HTTP, mas o corpo não tem a forma esperada. */
  | "ilegivel"
  /** Não houve resposta (rede, DNS, servidor fora). */
  | "inalcancavel";

export interface LeituraDeProntidao {
  readonly veredito: VereditoProntidao | null;
  readonly razoes: readonly RazaoDeProntidaoVisao[];
  readonly origem: OrigemProntidao;
  /** Status HTTP observado; `null` quando não houve resposta. */
  readonly statusHttp: number | null;
}

/** Leitura usada quando a superfície não pôde ser alcançada (fail-closed). */
export function leituraInalcancavel(): LeituraDeProntidao {
  return { veredito: null, razoes: [], origem: "inalcancavel", statusHttp: null };
}

function lerRazoes(bruto: unknown): RazaoDeProntidaoVisao[] {
  if (!Array.isArray(bruto)) return [];
  const razoes: RazaoDeProntidaoVisao[] = [];
  for (const item of bruto) {
    if (typeof item !== "object" || item === null) continue;
    const registro = item as { codigo?: unknown; detalhe?: unknown };
    if (typeof registro.codigo !== "string" || registro.codigo.length === 0) continue;
    razoes.push({
      codigo: registro.codigo,
      reconhecido: (CODIGOS_RAZAO_CONHECIDOS as readonly string[]).includes(registro.codigo),
      detalhe: typeof registro.detalhe === "string" ? registro.detalhe : "",
    });
  }
  return razoes;
}

/**
 * Interpreta uma resposta de `/v1/readyz`. PURA e exportada para teste.
 *
 * Fail-closed em toda borda: ausência de veredito, veredito fora do
 * vocabulário fechado ou corpo não-objeto resultam em `veredito: null` com
 * origem declarada — nunca em "presumir pronto".
 */
export function interpretarProntidao(statusHttp: number, corpo: unknown): LeituraDeProntidao {
  if (typeof corpo !== "object" || corpo === null) {
    return { veredito: null, razoes: [], origem: "ilegivel", statusHttp };
  }
  const registro = corpo as { veredito?: unknown; razoes?: unknown; erroDeAvaliacao?: unknown };
  const razoes = lerRazoes(registro.razoes);

  if (typeof registro.erroDeAvaliacao === "string") {
    // `ProntidaoNaoAvaliada`: sem veredito utilizável, por desenho do contrato.
    // O detalhe técnico não é publicado (SAF-0026/SEC-0015) e não é inventado aqui.
    return { veredito: "not_ready", razoes, origem: "nao_avaliada", statusHttp };
  }

  if (typeof registro.veredito !== "string" || !VEREDITOS.has(registro.veredito)) {
    return { veredito: null, razoes, origem: "ilegivel", statusHttp };
  }

  return {
    veredito: registro.veredito as VereditoProntidao,
    razoes,
    origem: "relatorio",
    statusHttp,
  };
}

/**
 * `true` quando a leitura de prontidão obriga a tela a se declarar degradada.
 *
 * FAIL-CLOSED: não conseguir ler a prontidão conta como degradação visível.
 * O inverso — silêncio quando não se sabe — é precisamente o "appear healthy"
 * que `SAF-0025` proíbe. `null` (nenhuma leitura foi tentada nesta montagem)
 * NÃO conta: a tela não afirma nada sobre o que não observou.
 */
export function prontidaoObrigaDegradacao(leitura: LeituraDeProntidao | null): boolean {
  if (leitura === null) return false;
  if (leitura.origem !== "relatorio") return true;
  return leitura.veredito !== "ready";
}

export interface RazaoComChave {
  /** Chave estável e ÚNICA para renderização em lista. */
  readonly chave: string;
  readonly razao: RazaoDeProntidaoVisao;
}

/**
 * Dá a cada razão uma chave única de renderização.
 *
 * POR QUE ISTO EXISTE (OBSERVED em navegador real contra a API real,
 * 2026-08-18). `/v1/readyz` devolve o MESMO código de razão mais de uma vez,
 * com `detalhe` diferente — `projection_freshness_threshold_unvalidated`
 * aparece uma vez por projeção sem alvo de frescor validado. Usar o código
 * como chave fazia o React reclamar de chave duplicada e podia OMITIR linhas.
 *
 * A saída deliberadamente NÃO deduplica. Duas linhas com o mesmo código são
 * dois fatos distintos do servidor; colapsá-las esconderia quantas projeções
 * estão sem alvo — degradação sem representação visível, que `QAS-0023` exige
 * que seja zero.
 *
 * O ordinal fica AQUI, e não dentro do JSX, também por higiene de lint: índice
 * de array como chave é anti-padrão quando a lista reordena. Esta lista vem
 * inteira e na mesma ordem do servidor a cada leitura; o ordinal é parte da
 * IDENTIDADE da linha, não um substituto preguiçoso de identidade.
 */
export function chavearRazoes(razoes: readonly RazaoDeProntidaoVisao[]): RazaoComChave[] {
  const vistos = new Map<string, number>();
  return razoes.map((razao) => {
    const ordinal = vistos.get(razao.codigo) ?? 0;
    vistos.set(razao.codigo, ordinal + 1);
    return { chave: `${razao.codigo}#${ordinal}`, razao };
  });
}

export interface LeitorDeProntidao {
  obter(sinal?: AbortSignal): Promise<LeituraDeProntidao>;
}

export interface OpcoesLeitorProntidao {
  /** Prefixo da URL. Vazio em dev (o proxy do Vite roteia `/v1/*`). */
  readonly baseUrl?: string;
  /** `fetch` injetável — permite testar sem rede real. */
  readonly fetchImpl?: typeof fetch;
}

/**
 * Leitor HTTP real. NUNCA rejeita por falha de rede — falha de rede é uma
 * LEITURA (`inalcancavel`), porque a tela precisa dizer "não sei se o serviço
 * está pronto" em vez de simplesmente não dizer nada.
 *
 * A única rejeição que ele propaga é o ABORTO, e propagá-la é obrigatório: é
 * assim que o hook distingue "cancelei" de "falhou" e o cancelamento continua
 * sendo real (invariante I5 de `../estado/recursoRemoto.ts`).
 */
export function criarLeitorDeProntidaoHttp(opcoes: OpcoesLeitorProntidao = {}): LeitorDeProntidao {
  const { baseUrl = "" } = opcoes;
  const executarFetch: typeof fetch =
    opcoes.fetchImpl ?? ((entrada, inicio) => globalThis.fetch(entrada, inicio));

  return {
    async obter(sinal?: AbortSignal): Promise<LeituraDeProntidao> {
      try {
        const resposta = await executarFetch(`${baseUrl}${CAMINHO_PRONTIDAO}`, {
          ...(sinal !== undefined ? { signal: sinal } : {}),
          headers: { accept: "application/json" },
          // Uma resposta de sonda em cache é uma resposta mentirosa (o próprio
          // contrato exige `Cache-Control: no-store` do lado do servidor).
          cache: "no-store",
        });
        const corpo: unknown = await resposta.json().catch(() => null);
        return interpretarProntidao(resposta.status, corpo);
      } catch (erro) {
        if (sinal?.aborted === true) throw erro;
        return leituraInalcancavel();
      }
    },
  };
}

/**
 * Adapta o leitor à porta que `useRecursoRemoto` consome.
 *
 * `estadoCarregamento: "pronto"` mesmo quando o veredito é `not_ready` — e
 * isso é deliberado. Um 503 de `/v1/readyz` é uma LEITURA BEM-SUCEDIDA da
 * superfície de prontidão; tratá-lo como falha de tela faria o bloco de estado
 * declarar "não foi possível carregar" e ESCONDERIA as razões codificadas,
 * que são exatamente o que precisa aparecer.
 */
export function buscaDeProntidao(
  leitor: LeitorDeProntidao,
): (sinal: AbortSignal) => Promise<RespostaApi<LeituraDeProntidao>> {
  return async (sinal: AbortSignal) => ({
    estadoCarregamento: "pronto" as const,
    dados: await leitor.obter(sinal),
    problema: null,
  });
}
