/**
 * Testes do gateway de entrega em tempo real autorizada (achado §6.5).
 *
 * ESTADO REPRODUZIDO ANTES DESTA ENTREGA (comando registrado no handoff):
 * a rota `GET /v1/eventos/stream` de `apps/api/src/routes.ts:304-334`
 * respondia com `reply.send(corpo)` e a leitura do corpo chegava a
 * `done=true` sozinha — replay finito, não entrega contínua. Todo teste
 * deste arquivo falha contra aquele comportamento: o primeiro porque a
 * conexão fechava, os demais porque nada além do backlog existia.
 *
 * Os testes sobem um Fastify NU com apenas este gateway registrado — não
 * `buildServer`, porque a rota antiga ainda ocupa o mesmo caminho até o
 * orquestrador aplicar a fiação descrita no handoff.
 */

import { setTimeout as dormir } from "node:timers/promises";
import type { EventoFluxo, ProblemDetails } from "@intensicare/contratos";
import Fastify, { type FastifyInstance } from "fastify";
import { afterEach, describe, expect, it } from "vitest";
import { criarChaveEscopada, RECURSO_CANAL_EVENTOS } from "./chave-escopada.js";
import {
  type EscritorSse,
  EscritorSseHttp,
  type LimitesConexao,
  type RespostaBruta,
} from "./fila.js";
import {
  type ContextoVerificado,
  criarContextoVerificado,
  type DecisaoAutorizacao,
  type FonteEventosDuraveis,
  NotificadorEmMemoria,
  type PortaAutorizacaoEventos,
} from "./porta.js";
import {
  CAMINHO_STREAM,
  CAMINHO_TICKET,
  type ControleDoGateway,
  criarPortaDeStubSintetico,
  registrarGatewayEventos,
} from "./stream.js";
import { EmissorDeTickets } from "./ticket.js";

const TENANT = "SYNTH-TENANT-G7";
const OUTRO_TENANT = "SYNTH-TENANT-B";
const ATOR = "SYNTH-USER-A1";

const LIMITES_DE_TESTE: LimitesConexao = {
  maximoEventosNaFila: 10,
  maximoBytesPendentes: 1_048_576,
  intervaloPulsacaoMs: 120,
  loteMaximoLeitura: 50,
  intervaloReexameDrenoMs: 20,
};

const RECONEXAO = { esperaMinimaMs: 1_000, esperaMaximaMs: 30_000, jitter: 0.2 };

// ---------------------------------------------------------------------------
// Leitor de SSE
// ---------------------------------------------------------------------------

interface QuadroSse {
  id?: string;
  evento?: string;
  dados?: string;
  retry?: string;
}

class LeitorSse {
  readonly quadros: QuadroSse[] = [];
  #buffer = "";
  #terminou = false;

  constructor(corpo: ReadableStream<Uint8Array>) {
    void this.#bombear(corpo);
  }

  get terminou(): boolean {
    return this.#terminou;
  }

  async #bombear(corpo: ReadableStream<Uint8Array>): Promise<void> {
    const leitor = corpo.getReader();
    const decodificador = new TextDecoder();
    try {
      for (;;) {
        const { done, value } = await leitor.read();
        if (done) break;
        this.#buffer += decodificador.decode(value, { stream: true });
        this.#processar();
      }
    } catch {
      // conexão abortada pelo teste — fim é fim
    }
    this.#terminou = true;
  }

  #processar(): void {
    for (;;) {
      const corte = this.#buffer.indexOf("\n\n");
      if (corte === -1) return;
      const bloco = this.#buffer.slice(0, corte);
      this.#buffer = this.#buffer.slice(corte + 2);
      const quadro: QuadroSse = {};
      for (const linha of bloco.split("\n")) {
        if (linha.startsWith("id: ")) quadro.id = linha.slice(4);
        else if (linha.startsWith("event: ")) quadro.evento = linha.slice(7);
        else if (linha.startsWith("data: ")) quadro.dados = linha.slice(6);
        else if (linha.startsWith("retry: ")) quadro.retry = linha.slice(7);
      }
      this.quadros.push(quadro);
    }
  }

  async esperarQuadro(
    predicado: (quadro: QuadroSse) => boolean,
    limiteMs = 10_000,
  ): Promise<QuadroSse> {
    const prazo = Date.now() + limiteMs;
    for (;;) {
      const achado = this.quadros.find(predicado);
      if (achado) return achado;
      if (Date.now() > prazo) {
        throw new Error(
          `quadro esperado não chegou em ${String(limiteMs)}ms. Recebidos: ${JSON.stringify(
            this.quadros.map((q) => q.evento),
          )}`,
        );
      }
      await dormir(10);
    }
  }

  async esperarFim(limiteMs = 10_000): Promise<void> {
    const prazo = Date.now() + limiteMs;
    while (!this.#terminou) {
      if (Date.now() > prazo) throw new Error("a conexão não encerrou dentro do prazo");
      await dormir(10);
    }
  }

  eventosDeDados(): QuadroSse[] {
    const controle = new Set(["pulsacao", "estado-conexao", "instrucao-reconciliacao"]);
    return this.quadros.filter((q) => q.evento !== undefined && !controle.has(q.evento));
  }
}

// ---------------------------------------------------------------------------
// Cenário
// ---------------------------------------------------------------------------

/** Autenticador local: NÃO importa `../auth.js`, que está sendo reescrito em paralelo. */
function autenticarSintetico(request: {
  headers: Record<string, string | string[] | undefined>;
}):
  | { ok: true; contexto: { tenantId: string; atorId: string } }
  | { ok: false; problema: ProblemDetails } {
  const bruto = request.headers.authorization;
  const valor = Array.isArray(bruto) ? bruto[0] : bruto;
  const encontrado = /^Bearer SYNTH-TOKEN\.([^.\s]+)\.([^.\s]+)$/.exec(valor ?? "");
  if (!encontrado) {
    return {
      ok: false,
      problema: {
        type: "about:blank",
        title: "Não autenticado",
        status: 401,
        detail: "Token bearer sintético ausente ou malformado.",
      },
    };
  }
  return { ok: true, contexto: { tenantId: encontrado[1]!, atorId: encontrado[2]! } };
}

interface Controle {
  revalidar: () => DecisaoAutorizacao;
  autorizar: (evento: EventoFluxo) => DecisaoAutorizacao;
  cursorMinimoRetomavel: number;
  saturado: boolean;
  /**
   * Faz a fonte devolver um envelope de OUTRO tenant apesar da chave — o
   * cenário de produtor comprometido/defeituoso que ADR-0016 §4.1 obriga o
   * consumidor a tratar sem confiar no escopo do produtor.
   */
  injetarEnvelopeAlheio: boolean;
  /**
   * ACHADO 7: as três bordas assíncronas do gateway. Cada uma faz a
   * dependência REJEITAR — falha transitória de leitura do backbone, de
   * revalidação de sessão e de autorização por evento.
   */
  falharLeitura: boolean;
  falharRevalidacao: boolean;
  falharAutorizacao: boolean;
}

interface Cenario {
  readonly app: FastifyInstance;
  readonly base: string;
  readonly eventos: EventoFluxo[];
  readonly notificador: NotificadorEmMemoria;
  readonly emissor: EmissorDeTickets<ContextoVerificado>;
  readonly controle: Controle;
  readonly controleDoGateway: ControleDoGateway;
  readonly linhasDeLog: string[];
  publicar(tipo: EventoFluxo["tipo"], dados: unknown, tenantId?: string): EventoFluxo;
  abrir(opcoes?: { cursor?: number; cabecalhos?: Record<string, string> }): Promise<{
    resposta: Response;
    leitor: LeitorSse;
    abortar: () => void;
  }>;
  fechar(): Promise<void>;
}

async function montarCenario(
  ajustes: { limites?: Partial<LimitesConexao>; ttlTicketSegundos?: number } = {},
): Promise<Cenario> {
  const eventos: EventoFluxo[] = [];
  const notificador = new NotificadorEmMemoria();
  const emissor = new EmissorDeTickets<ContextoVerificado>(ajustes.ttlTicketSegundos ?? 30);
  const linhasDeLog: string[] = [];
  const controle: Controle = {
    revalidar: () => ({ permitido: true }),
    autorizar: () => ({ permitido: true }),
    cursorMinimoRetomavel: 0,
    saturado: false,
    injetarEnvelopeAlheio: false,
    falharLeitura: false,
    falharRevalidacao: false,
    falharAutorizacao: false,
  };
  const abortadores: AbortController[] = [];

  const base = criarPortaDeStubSintetico(autenticarSintetico);
  const porta: PortaAutorizacaoEventos = {
    verificarSessao: (request) => base.verificarSessao(request),
    revalidarSessao: () => {
      if (controle.falharRevalidacao) {
        return Promise.reject(new Error("SYNTH-FALHA: revalidação de sessão indisponível"));
      }
      return controle.revalidar();
    },
    autorizarEntrega: (_contexto, evento) => {
      if (controle.falharAutorizacao) {
        return Promise.reject(new Error("SYNTH-FALHA: autorização de entrega indisponível"));
      }
      return controle.autorizar(evento);
    },
  };

  const fonte: FonteEventosDuraveis = {
    lerDesde(chave, cursor, limite) {
      if (controle.falharLeitura) {
        return Promise.reject(new Error("SYNTH-FALHA: leitura do backbone indisponível"));
      }
      const tenant = chave.tenantId as string;
      if (controle.injetarEnvelopeAlheio) {
        // Produtor defeituoso/comprometido: devolve envelope alheio APESAR
        // da chave. O gateway tem de recusar por conta própria.
        return Promise.resolve(
          cursor >= 1
            ? []
            : [
                {
                  sequencia: 1,
                  tipo: "alerta-criado" as const,
                  tenantId: OUTRO_TENANT,
                  ocorridoEm: new Date(1_700_000_000_000).toISOString(),
                  dados: { id: "SYNTH-ALERTA-ALHEIO" },
                },
              ],
        );
      }
      return Promise.resolve(
        eventos
          .filter((evento) => evento.sequencia > cursor && evento.tenantId === tenant)
          .slice(0, limite),
      );
    },
    cursorMinimoRetomavel() {
      return Promise.resolve(controle.cursorMinimoRetomavel);
    },
  };

  const app = Fastify({
    // MEDIDO: o hook `onClose` do gateway já evita o travamento (as
    // conexões SSE são encerradas com instrução), mas sem isto o
    // `close()` ainda aguarda os sockets keep-alive ociosos — a suíte
    // passa de ~2,5s para ~30s. Ver o handoff: vale para o servidor real.
    forceCloseConnections: true,
    // Sem isto, `close()` espera indefinidamente pelas conexões SSE — que
    // são, por projeto, longas. É particularidade da suíte, não do gateway.
    logger: {
      level: "info",
      stream: {
        write(linha: string) {
          linhasDeLog.push(linha);
        },
      },
    },
  });

  const controleDoGateway = registrarGatewayEventos(app, {
    porta,
    fonte,
    notificador,
    emissorDeTickets: emissor,
    limites: { ...LIMITES_DE_TESTE, ...ajustes.limites },
    reconexao: RECONEXAO,
    caminhoReconciliacao: "/v1/projecoes/grade-leitos",
    criarEscritor: (resposta: RespostaBruta): EscritorSse => {
      const real = new EscritorSseHttp(resposta);
      // Envoltório sempre ativo, mas TRANSPARENTE enquanto não saturado: a
      // saturação é avaliada a cada chamada, não congelada na criação. É o
      // que permite saturar, agendar o reexame de dreno e então dessaturar
      // — exercitando a borda `void this.#drenar()` do temporizador.
      // Cliente lento: o socket aceita, mas NUNCA drena. É o modo de falha
      // de P5 tornado determinístico, sem depender do tamanho do buffer
      // TCP da máquina que roda a suíte.
      return {
        escrever: (quadro) => {
          real.escrever(quadro);
        },
        bytesPendentes: () => (controle.saturado ? Number.MAX_SAFE_INTEGER : real.bytesPendentes()),
        encerrar: () => {
          real.encerrar();
        },
        get encerrado() {
          return real.encerrado;
        },
      };
    },
  });

  await app.listen({ port: 0, host: "127.0.0.1" });
  const endereco = app.server.address();
  if (endereco === null || typeof endereco === "string") throw new Error("sem endereço");
  const urlBase = `http://127.0.0.1:${String(endereco.port)}`;

  let proximaSequencia = 0;

  return {
    app,
    base: urlBase,
    eventos,
    notificador,
    emissor,
    controle,
    controleDoGateway,
    linhasDeLog,
    publicar(tipo, dados, tenantId = TENANT) {
      proximaSequencia += 1;
      const evento: EventoFluxo = {
        sequencia: proximaSequencia,
        tipo,
        tenantId,
        ocorridoEm: new Date(1_700_000_000_000 + proximaSequencia).toISOString(),
        dados,
      };
      eventos.push(evento);
      notificador.notificarMudancaEm(tenantId);
      return evento;
    },
    async abrir(opcoes = {}) {
      const controlador = new AbortController();
      abortadores.push(controlador);
      const url =
        opcoes.cursor === undefined
          ? `${urlBase}${CAMINHO_STREAM}`
          : `${urlBase}${CAMINHO_STREAM}?cursor=${String(opcoes.cursor)}`;
      const resposta = await fetch(url, {
        headers: {
          authorization: `Bearer SYNTH-TOKEN.${TENANT}.${ATOR}`,
          accept: "text/event-stream",
          ...opcoes.cabecalhos,
        },
        signal: controlador.signal,
      });
      if (resposta.body === null) throw new Error("resposta sem corpo");
      return {
        resposta,
        leitor: new LeitorSse(resposta.body),
        abortar: () => {
          controlador.abort();
        },
      };
    },
    async fechar() {
      // Fecha os clientes antes do servidor: uma conexão SSE viva é, por
      // projeto, uma conexão que não termina sozinha.
      for (const abortador of abortadores) abortador.abort();
      await dormir(20);
      await app.close();
    },
  };
}

let cenarioAtivo: Cenario | undefined;

afterEach(async () => {
  if (cenarioAtivo) {
    await cenarioAtivo.fechar();
    cenarioAtivo = undefined;
  }
});

async function cenario(ajustes?: Parameters<typeof montarCenario>[0]): Promise<Cenario> {
  cenarioAtivo = await montarCenario(ajustes);
  return cenarioAtivo;
}

// ---------------------------------------------------------------------------
// Testes
// ---------------------------------------------------------------------------

describe("entrega contínua (ADR-0011 P1/P3) — o teste que o replay finito reprova", () => {
  it("mantém a conexão ABERTA após o catch-up e entrega evento produzido DEPOIS da conexão", async () => {
    const c = await cenario();
    c.publicar("alerta-criado", { id: "SYNTH-ALERTA-1" });
    c.publicar("avaliacao-computada", { encontroId: "SYNTH-ENC-1" });

    const { leitor } = await c.abrir();

    // catch-up anunciado e entregue
    await leitor.esperarQuadro(
      (q) => q.evento === "estado-conexao" && q.dados!.includes("replaying"),
    );
    await leitor.esperarQuadro((q) => q.id === "1");
    await leitor.esperarQuadro((q) => q.id === "2");
    // fim do catch-up — e a conexão SEGUE ABERTA
    await leitor.esperarQuadro((q) => q.evento === "estado-conexao" && q.dados!.includes("online"));
    expect(leitor.terminou).toBe(false);

    // AGORA o fato novo, depois da conexão estabelecida
    c.publicar("alerta-atualizado", { id: "SYNTH-ALERTA-1", estado: "reconhecido" });
    const novo = await leitor.esperarQuadro((q) => q.id === "3");

    expect(novo.evento).toBe("alerta-atualizado");
    expect(JSON.parse(novo.dados!)).toMatchObject({
      sequencia: 3,
      tipo: "alerta-atualizado",
      tenantId: TENANT,
    });
    expect(leitor.terminou).toBe(false);
  }, 30_000);

  it("anuncia o backoff dirigido pelo servidor no campo retry (P5)", async () => {
    const c = await cenario();
    const { leitor } = await c.abrir();
    const quadro = await leitor.esperarQuadro((q) => q.retry !== undefined);
    expect(quadro.retry).toBe(String(RECONEXAO.esperaMinimaMs));
  }, 30_000);

  it("emite pulsação observável enquanto a conexão vive (P6)", async () => {
    const c = await cenario();
    const { leitor } = await c.abrir();
    const pulso = await leitor.esperarQuadro((q) => q.evento === "pulsacao");
    const corpo = JSON.parse(pulso.dados!) as { estado: string; cursor: number; pendentes: number };
    expect(corpo.estado).toBe("online");
    expect(corpo.pendentes).toBe(0);
    expect(leitor.terminou).toBe(false);
  }, 30_000);
});

describe("retomada por cursor (ADR-0011 P4)", () => {
  it("retoma exatamente do ponto com Last-Event-ID, sem lacuna e sem duplicata", async () => {
    const c = await cenario();
    for (let i = 0; i < 3; i += 1) c.publicar("avaliacao-computada", { i });

    const primeira = await c.abrir();
    await primeira.leitor.esperarQuadro((q) => q.id === "3");
    const idsPrimeira = primeira.leitor.eventosDeDados().map((q) => q.id);
    expect(idsPrimeira).toEqual(["1", "2", "3"]);
    primeira.abortar();

    // Eventos produzidos enquanto o cliente estava desconectado.
    c.publicar("alerta-criado", { i: 4 });
    c.publicar("alerta-atualizado", { i: 5 });

    const segunda = await c.abrir({ cabecalhos: { "last-event-id": "3" } });
    await segunda.leitor.esperarQuadro((q) => q.id === "5");
    const idsSegunda = segunda.leitor.eventosDeDados().map((q) => q.id);

    // sem lacuna: 4 e 5 chegaram; sem duplicata: 1..3 não voltaram
    expect(idsSegunda).toEqual(["4", "5"]);
    expect(idsSegunda.some((id) => idsPrimeira.includes(id))).toBe(false);
  }, 30_000);

  it("aceita o cursor por parâmetro de consulta (número de sequência não é credencial)", async () => {
    const c = await cenario();
    for (let i = 0; i < 3; i += 1) c.publicar("avaliacao-computada", { i });
    const { leitor } = await c.abrir({ cursor: 2 });
    await leitor.esperarQuadro((q) => q.id === "3");
    expect(leitor.eventosDeDados().map((q) => q.id)).toEqual(["3"]);
  }, 30_000);

  it("cursor IRRETOMÁVEL instrui reconciliação por polling e encerra — lacuna explícita", async () => {
    const c = await cenario();
    for (let i = 0; i < 3; i += 1) c.publicar("avaliacao-computada", { i });
    c.controle.cursorMinimoRetomavel = 100; // o servidor declara o piso

    const { leitor } = await c.abrir({ cabecalhos: { "last-event-id": "3" } });
    const instrucao = await leitor.esperarQuadro((q) => q.evento === "instrucao-reconciliacao");
    const corpo = JSON.parse(instrucao.dados!) as Record<string, unknown>;

    expect(corpo.motivo).toBe("cursor-irretomavel");
    expect(corpo.acao).toBe("reconciliar-por-polling");
    expect(corpo.caminhoReconciliacao).toBe("/v1/projecoes/grade-leitos");
    expect(corpo.cursorMinimoRetomavel).toBe(100);
    // Nada foi entregue fingindo continuidade.
    expect(leitor.eventosDeDados()).toHaveLength(0);
    await leitor.esperarFim();
  }, 30_000);

  it("recusa cursor malformado sem ecoar o valor recebido", async () => {
    const c = await cenario();
    const resposta = await fetch(`${c.base}${CAMINHO_STREAM}`, {
      headers: {
        authorization: `Bearer SYNTH-TOKEN.${TENANT}.${ATOR}`,
        "last-event-id": "'; DROP TABLE--",
      },
    });
    expect(resposta.status).toBe(400);
    const corpo = (await resposta.json()) as ProblemDetails;
    expect(corpo.title).toContain("Cursor");
    expect(JSON.stringify(corpo)).not.toContain("DROP TABLE");
  }, 30_000);
});

describe("contrapressão e shed honesto (ADR-0011 P5)", () => {
  it("cliente lento NÃO consome buffer ilimitado: desconexão explícita com instrução", async () => {
    const c = await cenario({ limites: { maximoEventosNaFila: 10, loteMaximoLeitura: 50 } });
    c.controle.saturado = true;
    for (let i = 0; i < 200; i += 1) c.publicar("avaliacao-computada", { i });

    const { leitor } = await c.abrir();
    const instrucao = await leitor.esperarQuadro((q) => q.evento === "instrucao-reconciliacao");
    const corpo = JSON.parse(instrucao.dados!) as Record<string, unknown>;

    expect(corpo.motivo).toBe("fila-excedida");
    expect(corpo.acao).toBe("reconciliar-por-polling");
    expect(String(corpo.descricao)).toContain("silêncio");
    // O servidor ENCERRA — nunca segue com aparência de saúde.
    await leitor.esperarFim();
    const ultimoEstado = leitor.quadros.filter((q) => q.evento === "estado-conexao").at(-1);
    expect(ultimoEstado?.dados).toContain("offline");
  }, 30_000);
});

describe("autorização por evento (ADR-0011 P3; ADR-0016 §4.1)", () => {
  it("revogação no MEIO do stream interrompe a entrega", async () => {
    const c = await cenario();
    c.publicar("avaliacao-computada", { i: 1 });

    const { leitor } = await c.abrir();
    await leitor.esperarQuadro((q) => q.id === "1");
    expect(leitor.terminou).toBe(false);

    // acesso revogado APÓS a subscrição ter sido autorizada
    c.controle.autorizar = () => ({ permitido: false, motivo: "autorizacao-revogada" });
    c.publicar("alerta-criado", { i: 2 });

    const instrucao = await leitor.esperarQuadro((q) => q.evento === "instrucao-reconciliacao");
    expect(JSON.parse(instrucao.dados!)).toMatchObject({ motivo: "autorizacao-revogada" });
    // O evento 2 NUNCA foi entregue.
    expect(leitor.eventosDeDados().map((q) => q.id)).toEqual(["1"]);
    await leitor.esperarFim();
  }, 30_000);

  it("expiração de sessão detectada na pulsação encerra a assinatura", async () => {
    const c = await cenario();
    const { leitor } = await c.abrir();
    await leitor.esperarQuadro((q) => q.evento === "estado-conexao" && q.dados!.includes("online"));

    c.controle.revalidar = () => ({ permitido: false, motivo: "sessao-expirada" });

    const instrucao = await leitor.esperarQuadro((q) => q.evento === "instrucao-reconciliacao");
    expect(JSON.parse(instrucao.dados!)).toMatchObject({ motivo: "sessao-expirada" });
    await leitor.esperarFim();
  }, 30_000);

  it("envelope de OUTRO tenant encerra com escopo-divergente — jamais é filtrado em silêncio", async () => {
    const c = await cenario();
    // Produtor defeituoso: a fonte devolve um envelope alheio apesar da
    // chave. O consumidor REESCOPA pelo envelope e não confia no produtor
    // (ADR-0016 §4.1). Filtrar em silêncio seria esconder um defeito de
    // isolamento; encerrar torna-o visível.
    c.controle.injetarEnvelopeAlheio = true;

    const { leitor } = await c.abrir();
    const instrucao = await leitor.esperarQuadro((q) => q.evento === "instrucao-reconciliacao");
    expect(JSON.parse(instrucao.dados!)).toMatchObject({ motivo: "escopo-divergente" });

    // NADA do outro tenant foi entregue.
    expect(leitor.eventosDeDados()).toHaveLength(0);
    expect(leitor.quadros.every((q) => !(q.dados ?? "").includes(OUTRO_TENANT))).toBe(true);
    await leitor.esperarFim();
  }, 30_000);

  it("a chave de canal de outro tenant é um valor distinto — não há canal compartilhado", () => {
    const doG7 = criarChaveEscopada(
      criarContextoVerificado({ tenantIdVerificado: TENANT, atorId: ATOR }),
      RECURSO_CANAL_EVENTOS,
    );
    const doB = criarChaveEscopada(
      criarContextoVerificado({ tenantIdVerificado: OUTRO_TENANT, atorId: ATOR }),
      RECURSO_CANAL_EVENTOS,
    );
    expect(doG7.valor).not.toBe(doB.valor);
    expect(doB.valor).not.toContain(TENANT);
  });
});

describe("desligamento operacional (ADR-0011 §8.3 iii)", () => {
  it("derruba as conexões em massa COM instrução — nunca um socket que some", async () => {
    const c = await cenario();
    const a = await c.abrir();
    const b = await c.abrir();
    await a.leitor.esperarQuadro(
      (q) => q.evento === "estado-conexao" && q.dados!.includes("online"),
    );
    await b.leitor.esperarQuadro(
      (q) => q.evento === "estado-conexao" && q.dados!.includes("online"),
    );
    expect(c.controleDoGateway.conexoesVivas()).toBe(2);

    const derrubadas = await c.controleDoGateway.encerrarTodas();
    expect(derrubadas).toBe(2);

    for (const leitor of [a.leitor, b.leitor]) {
      const instrucao = await leitor.esperarQuadro((q) => q.evento === "instrucao-reconciliacao");
      const corpo = JSON.parse(instrucao.dados!) as Record<string, unknown>;
      expect(corpo.motivo).toBe("desligamento-servidor");
      expect(corpo.acao).toBe("reconectar-do-cursor");
      await leitor.esperarFim();
    }
    expect(c.controleDoGateway.conexoesVivas()).toBe(0);
  }, 30_000);
});

describe("ticket efêmero e recusa de credencial em URL/log", () => {
  it("emite ticket SOMENTE por cookie HttpOnly — nunca no corpo", async () => {
    const c = await cenario();
    const resposta = await fetch(`${c.base}${CAMINHO_TICKET}`, {
      method: "POST",
      headers: { authorization: `Bearer SYNTH-TOKEN.${TENANT}.${ATOR}` },
    });
    expect(resposta.status).toBe(201);
    const cookie = resposta.headers.get("set-cookie");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Secure");
    expect(cookie).toContain("SameSite=Strict");
    expect(cookie).toContain(`Path=${CAMINHO_STREAM}`);

    const corpo = (await resposta.json()) as Record<string, unknown>;
    expect(corpo).toMatchObject({ usoUnico: true, entregaEm: "cookie" });
    const valorDoTicket = /ic_ticket_eventos=([^;]+)/.exec(cookie ?? "")![1]!;
    expect(JSON.stringify(corpo)).not.toContain(valorDoTicket);
  }, 30_000);

  it("abre o fluxo com o ticket, e o MESMO ticket não abre uma segunda vez", async () => {
    const c = await cenario();
    const emissao = await fetch(`${c.base}${CAMINHO_TICKET}`, {
      method: "POST",
      headers: { authorization: `Bearer SYNTH-TOKEN.${TENANT}.${ATOR}` },
    });
    const cookie = emissao.headers.get("set-cookie")!;
    const valor = /ic_ticket_eventos=([^;]+)/.exec(cookie)![1]!;

    const primeira = await fetch(`${c.base}${CAMINHO_STREAM}`, {
      headers: { cookie: `ic_ticket_eventos=${valor}` },
    });
    expect(primeira.status).toBe(200);
    expect(primeira.headers.get("content-type")).toContain("text/event-stream");
    // o servidor manda apagar o cookie assim que o consome
    expect(primeira.headers.get("set-cookie")).toContain("Max-Age=0");
    await primeira.body?.cancel();

    const segunda = await fetch(`${c.base}${CAMINHO_STREAM}`, {
      headers: { cookie: `ic_ticket_eventos=${valor}` },
    });
    expect(segunda.status).toBe(401);
    const problema = (await segunda.json()) as ProblemDetails;
    expect(JSON.stringify(problema)).not.toContain(valor);
  }, 30_000);

  it("ticket EXPIRADO é rejeitado com a mesma resposta de um inexistente", async () => {
    const c = await cenario({ ttlTicketSegundos: 1 });
    const emissao = await fetch(`${c.base}${CAMINHO_TICKET}`, {
      method: "POST",
      headers: { authorization: `Bearer SYNTH-TOKEN.${TENANT}.${ATOR}` },
    });
    const valor = /ic_ticket_eventos=([^;]+)/.exec(emissao.headers.get("set-cookie")!)![1]!;
    await dormir(1_100);

    const expirado = await fetch(`${c.base}${CAMINHO_STREAM}`, {
      headers: { cookie: `ic_ticket_eventos=${valor}` },
    });
    const inexistente = await fetch(`${c.base}${CAMINHO_STREAM}`, {
      headers: { cookie: "ic_ticket_eventos=nunca-emitido" },
    });

    expect(expirado.status).toBe(401);
    expect(inexistente.status).toBe(401);
    expect(await expirado.json()).toEqual(await inexistente.json());
  }, 30_000);

  it("recusa credencial em query string com 400, sem ecoar valor", async () => {
    const c = await cenario();
    const resposta = await fetch(`${c.base}${CAMINHO_STREAM}?token=SYNTH-TOKEN.${TENANT}.${ATOR}`, {
      headers: { authorization: `Bearer SYNTH-TOKEN.${TENANT}.${ATOR}` },
    });
    expect(resposta.status).toBe(400);
    const corpo = (await resposta.json()) as ProblemDetails;
    expect(corpo.title).toContain("proibido");
    expect(JSON.stringify(corpo)).not.toContain("SYNTH-TOKEN");
  }, 30_000);

  it("nenhuma credencial observável em URL ou log do servidor", async () => {
    const c = await cenario();
    const emissao = await fetch(`${c.base}${CAMINHO_TICKET}`, {
      method: "POST",
      headers: { authorization: `Bearer SYNTH-TOKEN.${TENANT}.${ATOR}` },
    });
    const valor = /ic_ticket_eventos=([^;]+)/.exec(emissao.headers.get("set-cookie")!)![1]!;

    const fluxo = await fetch(`${c.base}${CAMINHO_STREAM}`, {
      headers: { cookie: `ic_ticket_eventos=${valor}` },
    });
    expect(fluxo.status).toBe(200);
    await fluxo.body?.cancel();
    await dormir(150);

    const log = c.linhasDeLog.join("\n");
    expect(log.length).toBeGreaterThan(0);
    expect(log).not.toContain(valor);
    expect(log).not.toContain("SYNTH-TOKEN.");
    // A URL do fluxo não carrega credencial nem tenant.
    expect(fluxo.url).toBe(`${c.base}${CAMINHO_STREAM}`);
    expect(fluxo.url).not.toContain(TENANT);
  }, 30_000);

  it("sem ticket e sem bearer, o fluxo não abre", async () => {
    const c = await cenario();
    const resposta = await fetch(`${c.base}${CAMINHO_STREAM}`);
    expect(resposta.status).toBe(401);
  }, 30_000);
});
