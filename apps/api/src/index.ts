/**
 * apps/api — backend do IntensiCare V2.
 *
 * PREMISSA (reversível, GDEC-0015/0017): Fastify 5 + validação zod,
 * contrato de API contract-first (OpenAPI 3.1 — `packages/contratos/openapi.yaml`),
 * erros `application/problem+json` (RFC 9457) em pt-BR, idempotência de
 * escrita por cabeçalho `Idempotency-Key` COM hash do corpo e concorrência
 * otimista por cabeçalho `If-Match` (ver
 * `docs/06-architecture/premissas-de-construcao.md` PRE-04/PRE-05).
 *
 * ESTE ARQUIVO É A RAIZ DE COMPOSIÇÃO. Cinco subsistemas de escopo disjunto
 * chegam aqui e só aqui:
 *
 *   `config/`   configuração de runtime validada ANTES de qualquer banco abrir
 *               e ANTES de a porta ser aberta (ADR-0019 §5.2 P4: ausência de
 *               configuração obrigatória FALHA o boot, nunca degrada);
 *   `auth/`     porta de autenticação injetável (ADR-0015 Opção A);
 *   `regras/`   registro de regras versionadas com despacho fail-closed
 *               (ADR-0007) — nenhuma rota escolhe regra por `if`;
 *   `saude/`    liveness, readiness e startup SEPARADAS (anti-padrão 10) e a
 *               telemetria de `@intensicare/observabilidade` finalmente ligada;
 *   `eventos/`  gateway de entrega contínua autorizada (ADR-0011), que
 *               substitui o replay finito que se chamava de "tempo real".
 *
 * ORDEM QUE IMPORTA, e por quê:
 *   1. configuração (lança se faltar) — nada tem significado antes dela;
 *   2. superfícies de saúde ANTES de abrir o banco, para que `/v1/startupz`
 *      chegue a observar o estado `iniciando`. Depois disso a sonda só
 *      responderia quando a inicialização já tivesse terminado, e a superfície
 *      não significaria nada;
 *   3. autenticação antes das rotas — o hook `onRequest` precisa existir antes
 *      de qualquer rota que consulte o seu resultado;
 *   4. banco; falha aqui marca a inicialização como FALHA (sinal operacional
 *      categorizado) e propaga — não sobe servidor sem persistência;
 *   5. rotas `/v1/*` e gateway de eventos.
 *
 * `GET /health` é mantida da fundação SPR-G7-1 e está documentada como
 * LIVENESS LEGADO: responde 200 com o banco fora, sem bundle de regra e sem
 * identidade configurada. **Não é utilizável como critério de promoção** —
 * promoção olha `/v1/readyz`.
 *
 * Nenhuma alegação de efetividade clínica, conformidade regulatória ou
 * segurança comprovada é feita.
 */

import type { PGlite } from "@electric-sql/pglite";
import { PROBLEM_JSON_MIME_TYPE, type ProblemDetails } from "@intensicare/contratos";
import { createNoopTelemetry, type Telemetry } from "@intensicare/observabilidade";
import type { PortaBancoDeDados } from "@intensicare/persistencia";
import Fastify, { type FastifyInstance } from "fastify";
import { z } from "zod";
import {
  type ConfiguracaoAutenticacao,
  criarPortaDeAutenticacao,
  perfilPermiteSintetico,
  registrarAutenticacao,
} from "./auth.js";
import {
  configuracaoDeAutenticacaoDoPerfil,
  exigirCoerenciaDePerfil,
  perfilDeAutenticacaoDe,
} from "./composicao/autenticacao.js";
import { dependenciaDeBancoDiferida } from "./composicao/prontidao.js";
import { comporRegistroDeRegras } from "./composicao/regras.js";
import {
  type ConfiguracaoRuntime,
  carregarConfiguracaoDoAmbiente,
  emitirBanner,
} from "./config/index.js";
import { prepareDatabase, replayEvents } from "./db.js";
import { criarPortaDeEventosSobreAutenticacao } from "./eventos/adaptador-auth.js";
import { LIMITES_ILUSTRATIVOS } from "./eventos/fila.js";
import { NotificadorEmMemoria } from "./eventos/porta.js";
import { criarFonteDeReplay, registrarGatewayEventos } from "./eventos/stream.js";
import { EmissorDeTickets } from "./eventos/ticket.js";
import { instanciaSegura } from "./problema.js";
import { registrarRotasV1 } from "./routes.js";
import { criarRegistroDeInicializacao } from "./saude/inicializacao.js";
import { frescorDeclaradoSemAlvoValidado } from "./saude/portas.js";
import { registrarSuperficiesDeSaude } from "./saude/rotas.js";

const healthResponseSchema = z.object({ status: z.literal("ok") });

/** Etapa declarada da inicialização — ver `/v1/startupz`. */
const ETAPA_BANCO = "preparacao-do-banco";

/**
 * TTL do ticket efêmero de eventos, em segundos. **VALIDATION REQUIRED**
 * (ADR-0011 §3): não é alvo medido nem SLO. Existe curto porque o ticket é de
 * uso único e só precisa sobreviver ao intervalo entre pedi-lo e abrir o fluxo.
 */
const TTL_TICKET_EVENTOS_SEGUNDOS = 30;

/**
 * Política de reconexão dirigida pelo servidor (ADR-0011 P5). Os números são
 * ILUSTRATIVOS e permanecem `VALIDATION REQUIRED` — nenhum alvo de latência de
 * entrega foi decidido em lugar nenhum desta entrega.
 */
const RECONEXAO_ILUSTRATIVA = {
  esperaMinimaMs: 1_000,
  esperaMaximaMs: 30_000,
  jitter: 0.2,
} as const;

export interface BuildServerOptions {
  /**
   * Banco JÁ migrado (e, se desejado, já semeado) fornecido pelo chamador —
   * útil em teste E2E com semeadura própria. É o SIMULADOR PGlite, e por isso
   * `prepareDatabase` o recusa fora de perfil sintético.
   */
  readonly db?: PGlite;
  /**
   * Configuração de runtime já validada. Ausente ⇒ lida do ambiente, e o boot
   * FALHA se faltar variável obrigatória (`PERFIL` não tem default).
   */
  readonly config?: ConfiguracaoRuntime;
  /** Telemetria injetada. Ausente ⇒ no-op (mede, mas não exporta). */
  readonly telemetry?: Telemetry;
  /**
   * Configuração da porta de autenticação. Em perfil endurecido é
   * OBRIGATÓRIA: sem ela `buildServer` LANÇA (nenhum IdP foi selecionado —
   * ADR-0015 §1; não existe adaptador padrão fora de dev/test).
   */
  readonly autenticacao?: ConfiguracaoAutenticacao;
  /** Emite o banner de limitações do perfil. Default `false` (silencioso em teste). */
  readonly emitirBannerDeLimitacoes?: boolean;
}

/**
 * Constrói (mas não inicia) uma instância do servidor Fastify sobre a
 * persistência REAL. Separado de `listen()` para ser testável via
 * `app.inject(...)` sem abrir porta de rede real.
 */
export async function buildServer(options: BuildServerOptions = {}): Promise<FastifyInstance> {
  const config = options.config ?? carregarConfiguracaoDoAmbiente();
  const telemetry = options.telemetry ?? createNoopTelemetry();

  if (options.emitirBannerDeLimitacoes === true && config.banner !== null) {
    emitirBanner(config.banner, (linha) => process.stderr.write(`${linha}\n`));
  }

  // `forceCloseConnections`: o gateway de eventos mantém conexões abertas por
  // projeto. Sem isto, `app.close()` esperaria por sockets que não terminam
  // sozinhos e o desligamento pareceria travado.
  const app = Fastify({ logger: false, forceCloseConnections: true });

  // Lido por closure pela sonda de prontidão: enquanto for `null`, a
  // dependência obrigatória de banco está INDISPONÍVEL — que é a leitura
  // correta, e não um "ainda não sei" tratado como disponível.
  let db: PortaBancoDeDados | null = null;
  let identidadeConfigurada = false;

  const regras = comporRegistroDeRegras({ config });

  const inicializacao = criarRegistroDeInicializacao({ telemetry, etapas: [ETAPA_BANCO] });

  registrarSuperficiesDeSaude(app, {
    telemetry,
    inicializacao,
    portas: {
      dependencias: [dependenciaDeBancoDiferida(() => db)],
      identidade: { configurada: () => identidadeConfigurada },
      regras: { disponibilidades: () => regras.disponibilidades() },
      perfil: { somenteSintetico: () => config.classePerfil === "sintetico" },
      projecoes: {
        frescor: () => frescorDeclaradoSemAlvoValidado(["grade_leitos", "avaliacoes_paciente"]),
      },
      // Nenhum modo de degradação é declarado ativo por esta fatia. A lista
      // vazia é o estado medido, não a ausência de um mecanismo: o registro de
      // degradações vive em `@intensicare/observabilidade` e ainda não tem
      // produtor no laço em execução (ver handoff).
      degradacoes: () => [],
    },
  });

  const configuracaoDeAutenticacao =
    options.autenticacao ?? configuracaoDeAutenticacaoDoPerfil(config);
  // O invariante roda sobre o valor FINAL — derivado ou injetado. Sem ele, a
  // injeção contornava a derivação fail-closed e um runtime `production` subia
  // com emissor sintético (achado P1 de revisão adversarial, 2026-08-17).
  exigirCoerenciaDePerfil(config, configuracaoDeAutenticacao);
  const portaDeAutenticacao = criarPortaDeAutenticacao(configuracaoDeAutenticacao);
  registrarAutenticacao(app, portaDeAutenticacao);
  identidadeConfigurada = true;

  let banco: PortaBancoDeDados;
  try {
    banco = await prepareDatabase(config, options.db);
    db = banco;
    inicializacao.concluirEtapa(ETAPA_BANCO);
  } catch (erro) {
    // Um processo que nunca sobe precisa ser distinguível, na série de
    // métricas, de um processo que ninguém iniciou (ADR-0020 O8).
    inicializacao.falhar("dependency_unavailable");
    throw erro;
  }

  // LIVENESS LEGADO — ver o cabeçalho deste arquivo e `saude/rotas.ts`.
  app.get("/health", async () => healthResponseSchema.parse({ status: "ok" }));

  // A rota de exemplo `POST /idempotency-example` da fundação SPR-G7-1 foi
  // REMOVIDA: aceitava escrita sem autenticação (ACHADO-03 da verificação
  // de controles da fatia G7 — `docs/11-security-privacy-compliance/
  // verificacao-de-controles-fatia-g7.md`). Superfície de escrita sem
  // authz é defeito mesmo quando não expõe estado clínico. A convenção de
  // idempotência que ela demonstrava está exercida na rota real
  // `POST /v1/ingestao/observacoes`, essa sim autenticada.

  const notificadorEventos = new NotificadorEmMemoria();

  registrarRotasV1(app, banco, {
    registroDeRegras: regras.registro,
    telemetry,
    notificador: notificadorEventos,
    // D2: a rota de sessão de desenvolvimento só EXISTE quando o perfil admite
    // adaptador sintético. Em perfil endurecido ela não é registrada — 404, e
    // não 403: uma superfície que responde 403 continua anunciando que existe.
    sessaoDeDesenvolvimento: perfilPermiteSintetico(perfilDeAutenticacaoDe(config))
      ? { porta: portaDeAutenticacao }
      : undefined,
  });

  registrarGatewayEventos(app, {
    porta: criarPortaDeEventosSobreAutenticacao({ autenticacao: portaDeAutenticacao }),
    fonte: criarFonteDeReplay({ replay: (parametros) => replayEvents(banco, parametros) }),
    notificador: notificadorEventos,
    emissorDeTickets: new EmissorDeTickets(TTL_TICKET_EVENTOS_SEGUNDOS),
    limites: LIMITES_ILUSTRATIVOS,
    reconexao: { ...RECONEXAO_ILUSTRATIVA },
    caminhoReconciliacao: "/v1/projecoes/grade-leitos",
    // Sem este observador a falha assíncrona encerra o cliente corretamente,
    // com instrução de reconciliação, mas NÃO deixa rastro no servidor — uma
    // entrega que morre em silêncio do lado de quem opera.
    //
    // O `erro` cru é entregue de propósito e NÃO é registrado: ele pode
    // carregar detalhe de infraestrutura (host, credencial, caminho), e quem
    // fia é quem decide o que vira log. Registramos a ORIGEM, que é o que
    // permite atribuir a falha sem publicar o interior dela — mesma disciplina
    // do `instanciaSegura` no corpo de erro (`SAF-0026`/`SEC-0015`).
    registrarFalha: (origem) => {
      app.log.error({ origem }, "falha na entrega de eventos");
    },
  });

  app.setErrorHandler((error, request, reply) => {
    const problem: ProblemDetails = {
      type: "about:blank",
      title: "Erro interno inesperado",
      status: 500,
      detail: "Falha inesperada ao processar a requisição.",
      // Nunca `request.url`: vaza identificador do sujeito no corpo do erro
      // (ACHADO-02; SAF-0026/SEC-0015). Ver `instanciaSegura` em problema.ts.
      instance: instanciaSegura(request),
    };
    app.log.error(error);
    reply.code(500).type(PROBLEM_JSON_MIME_TYPE).send(problem);
  });

  app.addHook("onClose", async () => {
    await banco.encerrar();
  });

  return app;
}

const isMainModule =
  process.argv[1] !== undefined && import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  const config = carregarConfiguracaoDoAmbiente();
  buildServer({ config, emitirBannerDeLimitacoes: true })
    .then((app) =>
      app.listen({ port: config.porta, host: "0.0.0.0" }).catch((error: unknown) => {
        app.log.error(error);
        process.exitCode = 1;
      }),
    )
    .catch((error: unknown) => {
      console.error(error);
      process.exitCode = 1;
    });
}
