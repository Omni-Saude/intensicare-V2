/**
 * apps/api/src/saude/telemetria.ts — o CONSUMIDOR que faltava para
 * `packages/observabilidade`.
 *
 * `packages/observabilidade/src/instrumentation.ts` declarava sobre si mesmo:
 * "ESTADO REAL: nada em `apps/api` chama estas funções ainda. A instrumentação
 * existe e é testada; ela NÃO está ligada ao laço em execução ... instrumentação
 * não conectada mede zero, e um gráfico vazio parece um sistema saudável."
 * Este arquivo liga.
 *
 * Duas camadas, com honestidade diferente
 * ----------------------------------------
 * 1. `instrumentarHttp(app)` — hooks Fastify que observam TODA requisição e
 *    emitem de fato, sem exigir edição das rotas. É instrumentação REAL, com
 *    um teto real: um hook HTTP enxerga rota, status e duração; ele NÃO
 *    enxerga "a avaliação NEWS2 levou X" nem "a transação durou Y".
 * 2. `TelemetriaApi.*` — gravadores tipados para os pontos que só o interior
 *    do handler conhece (avaliação, persistência, publicação de outbox,
 *    transição de item de trabalho). Eles existem, são testados e **medem
 *    zero até que os pontos de chamada sejam inseridos em `routes.ts`/`db.ts`**
 *    — arquivos fora da fronteira de escrita deste agente. Os pontos de
 *    chamada exatos estão no handoff. Chamar isto de "observabilidade ligada"
 *    antes disso seria o anti-padrão §10.1 (pacote existente ≠ integração).
 *
 * Por que o hook usa `routeOptions.url` e NUNCA `request.url`
 * -----------------------------------------------------------
 * Verificado neste repositório antes de escrever o hook: em
 * `GET /v1/pacientes/SYNTH-PACIENTE-0001/avaliacoes?q=1`, `routeOptions.url` é
 * o TEMPLATE `/v1/pacientes/:pacienteRef/avaliacoes`, enquanto `request.url` é
 * a URL concreta com o identificador do sujeito. Em rota não casada (404),
 * `routeOptions.url` é `undefined` — e a tentação de "cair para `request.url`"
 * é exatamente o vazamento de SAF-0026/SEC-0015. Aqui a rota não casada
 * simplesmente não emite série por rota.
 *
 * Por que NÃO há span de requisição HTTP
 * ---------------------------------------
 * `SPAN_NAMES` (metric-catalog.ts) é um vocabulário FECHADO e não tem nome
 * para "requisição HTTP" nem para "leitura de projeção". Emitir
 * `clinical.evaluation` em volta de uma requisição inteira seria rotular como
 * avaliação clínica um span que mede middleware, autenticação e serialização —
 * um trace que mente. Acrescentar um nome exige editar `metric-catalog.ts`,
 * fora da fronteira deste agente: registrado no handoff. O único trace real
 * emitido hoje é `ops.readiness_check`, por `reportReadiness`.
 *
 * Nenhuma alegação de efetividade clínica, conformidade regulatória ou
 * segurança comprovada é feita por este módulo.
 */
import type { WorkItemState } from "@intensicare/dominio";
import {
  type EvaluationTelemetryInput,
  type FailureCategory,
  flag,
  type PipelineStage,
  type PolicyDenialKind,
  type ProjectionLabel,
  recordEvaluation,
  recordFailure,
  recordOutboxDepth,
  recordPipelineLatency,
  recordPipelineLoss,
  recordPolicyDenial,
  recordWorkItemTransition,
  type Telemetry,
} from "@intensicare/observabilidade";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

// ---------------------------------------------------------------------------
// Mapa fechado de rota -> operação do laço
// ---------------------------------------------------------------------------

export interface OperacaoInstrumentada {
  /** Etapa do laço mínimo de segurança medida por esta rota (§15.3 b1–b4). */
  readonly etapa: PipelineStage;
  /**
   * Categoria FECHADA de falha para respostas 4xx desta rota, quando ela é
   * determinada pela natureza da rota. `null` = não determinada — e não
   * inventada (ver `emitirFalha`).
   */
  readonly categoriaFalhaCliente: FailureCategory | null;
  /**
   * Idem para 5xx. Hoje `null` em todas as rotas: uma exceção não tratada no
   * limite HTTP não identifica, por si, qual subsistema falhou, e escolher
   * `persistence_failure` "porque é o mais provável" produziria um sinal
   * operacional falso. Pergunta registrada no handoff.
   */
  readonly categoriaFalhaServidor: FailureCategory | null;
}

/**
 * Rotas `/v1/*` instrumentadas, por `"<MÉTODO> <template>"`. Fechado de
 * propósito — uma rota nova precisa de uma decisão explícita sobre qual etapa
 * do laço ela mede. Um teste confere este mapa contra a tabela de rotas do
 * servidor REAL, para que ele não envelheça em silêncio.
 */
export const TEMPLATES_INSTRUMENTADOS = {
  "POST /v1/ingestao/observacoes": {
    etapa: "source_to_accepted",
    categoriaFalhaCliente: "ingest_rejected",
    categoriaFalhaServidor: null,
  },
  "GET /v1/projecoes/grade-leitos": {
    etapa: "generated_to_visible",
    categoriaFalhaCliente: null,
    categoriaFalhaServidor: null,
  },
  "GET /v1/pacientes/:pacienteRef/avaliacoes": {
    etapa: "generated_to_visible",
    categoriaFalhaCliente: null,
    categoriaFalhaServidor: null,
  },
  "POST /v1/alertas/:id/reconhecer": {
    etapa: "generated_to_acknowledged",
    categoriaFalhaCliente: null,
    categoriaFalhaServidor: null,
  },
  "GET /v1/eventos/stream": {
    etapa: "generated_to_visible",
    categoriaFalhaCliente: null,
    categoriaFalhaServidor: null,
  },
} as const satisfies Record<string, OperacaoInstrumentada>;

export type TemplateInstrumentado = keyof typeof TEMPLATES_INSTRUMENTADOS;

function operacaoDe(request: FastifyRequest): OperacaoInstrumentada | null {
  const template = request.routeOptions?.url;
  // Rota não casada: `template` é `undefined`. NUNCA cair para `request.url`.
  if (typeof template !== "string") return null;
  const chave = `${request.method} ${template}`;
  return (
    (TEMPLATES_INSTRUMENTADOS as Record<string, OperacaoInstrumentada | undefined>)[chave] ?? null
  );
}

// ---------------------------------------------------------------------------
// Fachada de telemetria da API
// ---------------------------------------------------------------------------

export interface PublicacaoOutbox {
  /** Escopo de ordenação do ADR-0010. Pseudonimizado pelo gravador. */
  readonly escopoOrdenacao: string;
  readonly profundidadeAtual: number;
  readonly profundidadeAnterior?: number;
}

export interface TelemetriaApi {
  readonly telemetry: Telemetry;
  /** Registra os hooks que instrumentam TODA requisição da instância. */
  readonly instrumentarHttp: (app: FastifyInstance) => void;

  // Gravadores tipados — pontos de chamada no handoff (fora desta fronteira).
  readonly ingestAceito: (latenciaMs: number) => void;
  readonly ingestRejeitado: (quantidade?: number) => void;
  readonly avaliacaoConcluida: (entrada: EvaluationTelemetryInput) => void;
  readonly persistenciaDuravel: (latenciaMs: number) => void;
  readonly publicacaoOutbox: (entrada: PublicacaoOutbox) => void;
  readonly projecaoLida: (projecao: ProjectionLabel, latenciaMs: number) => void;
  readonly leituraConcluida: (projecao: ProjectionLabel, latenciaMs: number) => void;
  readonly reconhecimentoRegistrado: (
    de: WorkItemState | null,
    para: WorkItemState,
    latenciaMs: number,
  ) => void;
  /**
   * Transição de item de trabalho SEM latência.
   *
   * Existe porque `instrumentarHttp` já emite `recordPipelineLatency` para
   * `generated_to_acknowledged` em toda resposta <400 de
   * `POST /v1/alertas/:id/reconhecer` — que está em
   * `TEMPLATES_INSTRUMENTADOS`. Chamar `reconhecimentoRegistrado` na rota
   * somava uma segunda observação da MESMA etapa na MESMA requisição,
   * inflando o histograma (achado de integração). A transição de estado, ao
   * contrário, é sinal que o limite HTTP não enxerga: um 200 não diz de qual
   * estado para qual estado o item foi. Uma emissão por etapa por
   * requisição; o que é único emite-se à parte.
   */
  readonly transicaoDeItemDeTrabalho: (de: WorkItemState | null, para: WorkItemState) => void;
  readonly falha: (categoria: FailureCategory, quantidade?: number) => void;
  readonly negativaDePolitica: (tipo: PolicyDenialKind, tenantId: string) => void;
}

export function criarTelemetriaApi(telemetry: Telemetry): TelemetriaApi {
  /**
   * Instante de início por requisição. `WeakMap` em vez de
   * `decorateRequest` para que instrumentar duas vezes não colida com um
   * decorador já registrado, e para que o tempo continue vindo do relógio
   * INJETADO (mesma disciplina de `packages/observabilidade`: nenhuma
   * unidade lê o relógio do sistema por conta própria).
   */
  const inicioPorRequisicao = new WeakMap<FastifyRequest, number>();

  function emitirFalha(categoria: FailureCategory | null): void {
    if (categoria !== null) {
      recordFailure(telemetry, categoria);
      return;
    }
    // Sem categoria determinada a falha NÃO entra no contador categorizado —
    // um sinal operacional atribuído à categoria errada é pior que um
    // contador ausente. Ela continua VISÍVEL como log de severidade `error`:
    // engolir a falha seria o anti-padrão §10.7/§10.14.
    telemetry.logger.emit("error", "failure.recorded", { degraded: flag(true) });
  }

  function aoResponder(request: FastifyRequest, reply: FastifyReply): void {
    const operacao = operacaoDe(request);
    if (operacao === null) return;

    const inicio = inicioPorRequisicao.get(request);
    const status = reply.statusCode;

    if (status < 400) {
      if (inicio !== undefined) {
        recordPipelineLatency(telemetry, operacao.etapa, Math.max(0, telemetry.clock() - inicio));
      }
      return;
    }

    if (status === 401 || status === 403) {
      // Determinada independentemente da rota: a camada de identidade
      // recusou. O TIPO da negativa (cross-tenant, escopo ausente, sessão
      // expirada) só é conhecido dentro de `auth.ts` — ver handoff.
      recordFailure(telemetry, "authorization_denied");
      return;
    }

    if (status < 500) {
      if (operacao.categoriaFalhaCliente !== null) {
        recordPipelineLoss(telemetry, operacao.etapa, operacao.categoriaFalhaCliente);
      }
      emitirFalha(operacao.categoriaFalhaCliente);
      return;
    }

    emitirFalha(operacao.categoriaFalhaServidor);
  }

  return {
    telemetry,

    instrumentarHttp(app: FastifyInstance): void {
      app.addHook("onRequest", async (request) => {
        inicioPorRequisicao.set(request, telemetry.clock());
      });
      app.addHook("onResponse", async (request, reply) => {
        aoResponder(request, reply);
      });
    },

    ingestAceito(latenciaMs: number): void {
      recordPipelineLatency(telemetry, "source_to_accepted", latenciaMs);
    },

    ingestRejeitado(quantidade = 1): void {
      recordPipelineLoss(telemetry, "source_to_accepted", "ingest_rejected", quantidade);
    },

    avaliacaoConcluida(entrada: EvaluationTelemetryInput): void {
      recordEvaluation(telemetry, entrada);
    },

    persistenciaDuravel(latenciaMs: number): void {
      recordPipelineLatency(telemetry, "evaluation_to_durable_work_item", latenciaMs);
    },

    publicacaoOutbox(entrada: PublicacaoOutbox): void {
      recordOutboxDepth(
        telemetry,
        entrada.escopoOrdenacao,
        entrada.profundidadeAtual,
        entrada.profundidadeAnterior ?? 0,
      );
    },

    projecaoLida(_projecao: ProjectionLabel, latenciaMs: number): void {
      recordPipelineLatency(telemetry, "generated_to_visible", latenciaMs);
    },

    leituraConcluida(_projecao: ProjectionLabel, latenciaMs: number): void {
      recordPipelineLatency(telemetry, "generated_to_visible", latenciaMs);
    },

    reconhecimentoRegistrado(
      de: WorkItemState | null,
      para: WorkItemState,
      latenciaMs: number,
    ): void {
      recordWorkItemTransition(telemetry, de, para);
      recordPipelineLatency(telemetry, "generated_to_acknowledged", latenciaMs);
    },

    transicaoDeItemDeTrabalho(de: WorkItemState | null, para: WorkItemState): void {
      recordWorkItemTransition(telemetry, de, para);
    },

    falha(categoria: FailureCategory, quantidade = 1): void {
      recordFailure(telemetry, categoria, quantidade);
    },

    negativaDePolitica(tipo: PolicyDenialKind, tenantId: string): void {
      recordPolicyDenial(telemetry, tipo, tenantId);
    },
  };
}
