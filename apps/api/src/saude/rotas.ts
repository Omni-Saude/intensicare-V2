/**
 * apps/api/src/saude/rotas.ts — as TRÊS superfícies de saúde, separadas.
 *
 * SOURCE (prompt §10, anti-padrão 10): nunca "usar o mesmo endpoint/status
 * para liveness, readiness e startup". SOURCE (ADR-0020 O4): prontidão é
 * capacidade segura, não liveness de processo.
 *
 *   GET /v1/livez     — liveness. O processo consegue responder? Sem I/O de
 *                       banco, sem dependência, sem avaliação. 200 sempre que
 *                       o processo está de pé; se ele não estiver, não há
 *                       resposta — que é o sinal.
 *   GET /v1/readyz    — readiness. Existe CAPACIDADE SEGURA? Bundle de regra,
 *                       identidade/chaves, dependências obrigatórias, frescor
 *                       de projeção e degradação visível. 200 só em `ready`;
 *                       503 em `degraded` (default fail-closed) e sempre em
 *                       `not_ready`.
 *   GET /v1/startupz  — startup. A inicialização terminou? 503 enquanto
 *                       `iniciando`/`falhou`, 200 em `concluida`.
 *
 * Endpoints legados (NÃO editáveis por este agente; ver handoff)
 * --------------------------------------------------------------
 *   GET /health      — `apps/api/src/index.ts:55`, `{status:"ok"}`
 *                      incondicional. É LIVENESS e nada além disso. **Não é
 *                      utilizável como critério de promoção**: ele responde
 *                      200 com o banco fora, sem bundle de regra e sem
 *                      identidade configurada.
 *   GET /v1/healthz  — `apps/api/src/routes.ts:75`, faz `select 1`. É
 *                      liveness COM toque de banco — nem liveness pura nem
 *                      prontidão. Mantido por compatibilidade; promoção deve
 *                      apontar para `/v1/readyz`.
 *
 * Sem autenticação, e por quê
 * ----------------------------
 * As três superfícies são anônimas (como `/v1/healthz` já é): um balanceador
 * ou supervisor não porta credencial clínica. A contrapartida é que o corpo
 * da prontidão só carrega vocabulário FECHADO (`READINESS_REASON_CODES`),
 * nomes de subsistema verificados por `assertIdDeDependenciaSeguro` (nada de
 * URI, host ou credencial) e texto pt-BR de operação. Se o titular decidir
 * que até isso deve ser restrito, a decisão é de segurança/operação e está
 * registrada como VALIDATION REQUIRED no handoff.
 *
 * Nenhuma alegação de efetividade clínica, conformidade regulatória ou
 * segurança comprovada é feita por este módulo.
 */
import type { Telemetry } from "@intensicare/observabilidade";
import type { FastifyInstance } from "fastify";
import {
  avaliarProntidao,
  codigoHttpDeProntidao,
  type PoliticaDeCodigoHttp,
  type RelatorioProntidao,
} from "./avaliador.js";
import type { EstadoInicializacao, RegistroDeInicializacao } from "./inicializacao.js";
import type { PortasDeProntidao } from "./portas.js";
import { criarTelemetriaApi, type TelemetriaApi } from "./telemetria.js";

export const CAMINHO_LIVENESS = "/v1/livez";
export const CAMINHO_READINESS = "/v1/readyz";
export const CAMINHO_STARTUP = "/v1/startupz";

/** Caminho legado mantido em `index.ts`, documentado como liveness. */
export const CAMINHO_LIVENESS_LEGADO = "/health";

// ---------------------------------------------------------------------------
// Corpos de resposta (a mesma forma do fragmento OpenAPI do handoff)
// ---------------------------------------------------------------------------

export interface RespostaLiveness {
  readonly vivo: true;
  /**
   * Declaração explícita para quem for tentado a usar liveness como critério
   * de promoção. Liveness não afirma nada sobre capacidade clínica.
   */
  readonly declaracaoPt: string;
}

export type RespostaReadiness =
  | RelatorioProntidao
  | {
      readonly veredito: "not_ready";
      readonly razoes: readonly [];
      readonly erroDeAvaliacao: string;
    };

export interface RespostaStartup {
  readonly estado: EstadoInicializacao;
  readonly etapasPendentes: readonly string[];
  readonly iniciadoEmMs: number;
}

const DECLARACAO_LIVENESS =
  "Liveness: apenas a capacidade deste processo de responder. NÃO indica " +
  "capacidade clínica segura, banco disponível, bundle de regra ativo ou " +
  "identidade configurada — para isso, consulte /v1/readyz. Esta superfície " +
  "não é utilizável como critério de promoção.";

const ERRO_DE_AVALIACAO =
  "A própria avaliação de prontidão falhou. Fail-closed: sem veredito, a " +
  "instância não é declarada pronta. O detalhe técnico não é publicado nesta " +
  "resposta por política de redação (SAF-0026/SEC-0015).";

// ---------------------------------------------------------------------------
// Registro
// ---------------------------------------------------------------------------

export interface OpcoesDeSuperficiesDeSaude {
  readonly telemetry: Telemetry;
  readonly portas: PortasDeProntidao;
  readonly inicializacao: RegistroDeInicializacao;
  /** Política de código HTTP para o veredito `degraded`. Ver `avaliador.ts`. */
  readonly politica?: PoliticaDeCodigoHttp;
  /**
   * Registra também os hooks que instrumentam as rotas `/v1/*` reais.
   * Default `true`: separar as duas coisas convidaria a ligar a prontidão e
   * esquecer a telemetria — que é exatamente o meio-caminho que produziu o
   * achado §6.6.
   */
  readonly instrumentarHttp?: boolean;
}

export function registrarSuperficiesDeSaude(
  app: FastifyInstance,
  opcoes: OpcoesDeSuperficiesDeSaude,
): TelemetriaApi {
  const { telemetry, portas, inicializacao } = opcoes;
  const politica = opcoes.politica ?? {};
  const telemetriaApi = criarTelemetriaApi(telemetry);

  if (opcoes.instrumentarHttp !== false) {
    telemetriaApi.instrumentarHttp(app);
  }

  // Uma resposta de sonda em cache é uma resposta mentirosa: o balanceador
  // continuaria mandando tráfego para uma instância que já respondeu 503.
  const semCache = (reply: { header: (k: string, v: string) => unknown }): void => {
    reply.header("cache-control", "no-store");
  };

  app.get(CAMINHO_LIVENESS, async (_request, reply) => {
    semCache(reply);
    const corpo: RespostaLiveness = { vivo: true, declaracaoPt: DECLARACAO_LIVENESS };
    return reply.code(200).send(corpo);
  });

  app.get(CAMINHO_READINESS, async (_request, reply) => {
    semCache(reply);
    let relatorio: RelatorioProntidao;
    try {
      relatorio = await avaliarProntidao(telemetry, portas);
    } catch {
      // A exceção NÃO é ecoada: ela costuma carregar host, credencial ou
      // parâmetro de consulta. Falha de avaliação ⇒ não pronto.
      telemetriaApi.falha("dependency_unavailable");
      const corpo: RespostaReadiness = {
        veredito: "not_ready",
        razoes: [],
        erroDeAvaliacao: ERRO_DE_AVALIACAO,
      };
      return reply.code(503).send(corpo);
    }
    return reply.code(codigoHttpDeProntidao(relatorio.veredito, politica)).send(relatorio);
  });

  app.get(CAMINHO_STARTUP, async (_request, reply) => {
    semCache(reply);
    const estado = inicializacao.estado();
    const corpo: RespostaStartup = {
      estado,
      etapasPendentes: inicializacao.etapasPendentes(),
      iniciadoEmMs: inicializacao.iniciadoEmMs,
    };
    return reply.code(estado === "concluida" ? 200 : 503).send(corpo);
  });

  return telemetriaApi;
}
