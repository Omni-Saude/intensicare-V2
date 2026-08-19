/**
 * apps/web/src/eventos/anuncioDoServidor.test.ts
 *
 * O PRIMEIRO QUADRO PASSOU A ANUNCIAR DUAS COISAS, e as duas fecham janelas
 * cegas que o próprio contrato nomeia (`packages/contratos/src/asyncapi.ts`):
 *
 *   1. `intervaloPulsacaoMs` — até aqui a cadência SÓ era aprendida do fio, o
 *      que exige DUAS pulsações (ou uma pulsação após a abertura) para existir.
 *      Entre a abertura e a primeira pulsação não havia vigia armado, e uma
 *      conexão meio-aberta nessa janela ficava indistinguível de uma saudável —
 *      HAZ-0025/SAF-0025, detectável só pelo `error` do transporte, que uma
 *      conexão meio-aberta não emite.
 *   2. `reconexao` — até aqui a política só chegava no ENCERRAMENTO
 *      (`instrucao-reconciliacao`). Uma queda ANTES da primeira instrução
 *      deixava o cliente sem política, e um cliente conforme não inventa
 *      backoff: a máquina parava com `sem-politica-de-reconexao`. O push morria
 *      na primeira queda.
 *
 * O CAMINHO DE APRENDIZADO NÃO PODE MORRER. Os dois campos são OPCIONAIS
 * (`POLITICA_EVOLUCAO_EVENTOS.compativel`): um servidor que não os envie
 * continua conforme, e este cliente continua obrigado a funcionar — aprendendo
 * a cadência do fio, como antes. Há um caso dedicado a isso, e ele é o que
 * impede a "correção" fácil de trocar aprendizado por anúncio.
 *
 * Rastreio: ADR-0011 P5/P6, HAZ-0025, SAF-0025.
 */
import {
  EVENTO_SSE_ESTADO_CONEXAO,
  EVENTO_SSE_PULSACAO,
  type MensagemEstadoConexao,
  type MensagemPulsacao,
  type PoliticaReconexao,
} from "@intensicare/contratos";
import { describe, expect, it } from "vitest";
import {
  CICLOS_DE_PULSACAO_PARA_DECLARAR_SILENCIO,
  type EstadoFluxo,
  type EventoDaMaquina,
  estadoInicialFluxo,
  interpretarQuadro,
  reduzirFluxo,
  type Transicao,
} from "./maquina.js";
import type { QuadroRecebido } from "./porta.js";

const T0 = Date.UTC(2026, 7, 17, 12, 0, 0);
const POLITICA_DO_SERVIDOR: PoliticaReconexao = {
  esperaMinimaMs: 2_000,
  esperaMaximaMs: 30_000,
  jitter: 0.25,
};

function quadro(nomeDoEvento: string, dados: unknown): QuadroRecebido {
  return { nomeDoEvento, dados: JSON.stringify(dados), id: null };
}

function quadroDeEstado(extra: Partial<MensagemEstadoConexao> = {}): QuadroRecebido {
  const mensagem: MensagemEstadoConexao = {
    estado: "replaying",
    descricao: "Reproduzindo eventos perdidos.",
    emitidoEm: new Date(T0).toISOString(),
    cursor: 0,
    ...extra,
  };
  return quadro(EVENTO_SSE_ESTADO_CONEXAO, mensagem);
}

function quadroDePulsacao(extra: Partial<MensagemPulsacao> = {}): QuadroRecebido {
  const mensagem: MensagemPulsacao = {
    emitidoEm: new Date(T0).toISOString(),
    estado: "online",
    cursor: 0,
    pendentes: 0,
    ...extra,
  };
  return quadro(EVENTO_SSE_PULSACAO, mensagem);
}

/** Aplica eventos em sequência, acumulando os efeitos do ÚLTIMO passo. */
function aplicar(estado: EstadoFluxo, eventos: readonly EventoDaMaquina[]): Transicao {
  let corrente: Transicao = { estado, efeitos: [] };
  for (const evento of eventos) corrente = reduzirFluxo(corrente.estado, evento);
  return corrente;
}

/** Leva a máquina até o fluxo ABERTO, sem nenhum quadro ainda. */
function ateAbrir(politicaInicial?: PoliticaReconexao): Transicao {
  return aplicar(estadoInicialFluxo(politicaInicial), [
    { tipo: "montar", agoraMs: T0 },
    { tipo: "ticket-emitido", agoraMs: T0 },
    { tipo: "fluxo-aberto", agoraMs: T0 },
  ]);
}

// ---------------------------------------------------------------------------
// Interpretação
// ---------------------------------------------------------------------------

describe("interpretarQuadro lê os dois anúncios do primeiro quadro", () => {
  it("`estado-conexao` traz a cadência de pulsação anunciada", () => {
    const interpretacao = interpretarQuadro(quadroDeEstado({ intervaloPulsacaoMs: 15_000 }));
    expect(interpretacao.especie).toBe("estado-conexao");
    if (interpretacao.especie !== "estado-conexao") return;
    expect(interpretacao.mensagem.intervaloPulsacaoMs).toBe(15_000);
  });

  it("`estado-conexao` traz a política de reconexão anunciada", () => {
    const interpretacao = interpretarQuadro(quadroDeEstado({ reconexao: POLITICA_DO_SERVIDOR }));
    expect(interpretacao.especie).toBe("estado-conexao");
    if (interpretacao.especie !== "estado-conexao") return;
    expect(interpretacao.mensagem.reconexao).toEqual(POLITICA_DO_SERVIDOR);
  });

  it("`pulsacao` traz a cadência anunciada", () => {
    const interpretacao = interpretarQuadro(quadroDePulsacao({ intervaloPulsacaoMs: 9_000 }));
    expect(interpretacao.especie).toBe("pulsacao");
    if (interpretacao.especie !== "pulsacao") return;
    expect(interpretacao.mensagem.intervaloPulsacaoMs).toBe(9_000);
  });

  it("campo ausente continua ausente — opcional é opcional, não zero", () => {
    const semAnuncio = interpretarQuadro(quadroDeEstado());
    expect(semAnuncio.especie).toBe("estado-conexao");
    if (semAnuncio.especie !== "estado-conexao") return;
    expect(semAnuncio.mensagem.intervaloPulsacaoMs).toBeUndefined();
    expect(semAnuncio.mensagem.reconexao).toBeUndefined();
  });

  it("valor inválido é DESCARTADO, não adotado (fail-closed)", () => {
    // Zero, negativo, não numérico ou não finito não são cadência: adotá-los
    // armaria um vigia que dispara em laço ou nunca.
    for (const invalido of [0, -1, Number.NaN, "15000", null]) {
      const lido = interpretarQuadro(quadroDeEstado({ intervaloPulsacaoMs: invalido as number }));
      if (lido.especie !== "estado-conexao") throw new Error("espécie inesperada");
      expect(lido.mensagem.intervaloPulsacaoMs, `intervalo ${String(invalido)}`).toBeUndefined();
    }
    const politicaQuebrada = interpretarQuadro(
      quadroDeEstado({ reconexao: { esperaMinimaMs: 1 } as PoliticaReconexao }),
    );
    if (politicaQuebrada.especie !== "estado-conexao") throw new Error("espécie inesperada");
    expect(politicaQuebrada.mensagem.reconexao).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Janela cega antes da primeira pulsação
// ---------------------------------------------------------------------------

describe("a cadência anunciada arma o vigia ANTES da primeira pulsação", () => {
  it("um `estado-conexao` com cadência anunciada arma o vigia de silêncio", () => {
    const antes = ateAbrir();
    const depois = reduzirFluxo(antes.estado, {
      tipo: "quadro",
      quadro: quadroDeEstado({ intervaloPulsacaoMs: 15_000 }),
      agoraMs: T0 + 10,
    });

    expect(depois.estado.cadenciaDePulsacaoMs).toBe(15_000);
    const vigia = depois.efeitos.filter((e) => e.tipo === "armar-vigia-de-silencio");
    expect(vigia, "nenhum vigia armado: a janela cega continua aberta").toHaveLength(1);
    expect(vigia[0]).toEqual({
      tipo: "armar-vigia-de-silencio",
      prazoMs: 15_000 * CICLOS_DE_PULSACAO_PARA_DECLARAR_SILENCIO,
    });
    // Nenhuma pulsação foi recebida — a cadência veio do ANÚNCIO.
    expect(depois.estado.pulsacoesRecebidas).toBe(0);
  });

  it("sem anúncio, NADA muda: a cadência segue desconhecida até a primeira pulsação", () => {
    const antes = ateAbrir();
    const depois = reduzirFluxo(antes.estado, {
      tipo: "quadro",
      quadro: quadroDeEstado(),
      agoraMs: T0 + 10,
    });
    expect(depois.estado.cadenciaDePulsacaoMs).toBeNull();
    expect(depois.efeitos.filter((e) => e.tipo === "armar-vigia-de-silencio")).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Precedência: anunciado > aprendido, sem matar o aprendizado
// ---------------------------------------------------------------------------

describe("cadência anunciada tem precedência sobre a aprendida do fio", () => {
  it("a pulsação anunciando 20 s prevalece sobre o intervalo MEDIDO de 3 s", () => {
    const aberto = ateAbrir();
    const comPulsacao = reduzirFluxo(aberto.estado, {
      tipo: "quadro",
      quadro: quadroDePulsacao({ intervaloPulsacaoMs: 20_000 }),
      agoraMs: T0 + 3_000,
    });

    expect(
      comPulsacao.estado.cadenciaDePulsacaoMs,
      "o cliente adotou o intervalo medido no fio em vez do anunciado pelo servidor",
    ).toBe(20_000);
    const vigia = comPulsacao.efeitos.filter((e) => e.tipo === "armar-vigia-de-silencio");
    expect(vigia).toHaveLength(1);
    expect(vigia[0]).toEqual({
      tipo: "armar-vigia-de-silencio",
      prazoMs: 20_000 * CICLOS_DE_PULSACAO_PARA_DECLARAR_SILENCIO,
    });
  });

  it("SEM anúncio, o aprendizado do fio continua funcionando (o caminho não foi removido)", () => {
    const aberto = ateAbrir();
    const comPulsacao = reduzirFluxo(aberto.estado, {
      tipo: "quadro",
      quadro: quadroDePulsacao(),
      agoraMs: T0 + 3_000,
    });

    expect(comPulsacao.estado.cadenciaDePulsacaoMs).toBe(3_000);
    expect(comPulsacao.efeitos.filter((e) => e.tipo === "armar-vigia-de-silencio")).toEqual([
      {
        tipo: "armar-vigia-de-silencio",
        prazoMs: 3_000 * CICLOS_DE_PULSACAO_PARA_DECLARAR_SILENCIO,
      },
    ]);
  });

  it("um anúncio posterior SUBSTITUI a cadência aprendida antes dele", () => {
    const aberto = ateAbrir();
    const aprendido = reduzirFluxo(aberto.estado, {
      tipo: "quadro",
      quadro: quadroDePulsacao(),
      agoraMs: T0 + 3_000,
    });
    expect(aprendido.estado.cadenciaDePulsacaoMs).toBe(3_000);

    const anunciado = reduzirFluxo(aprendido.estado, {
      tipo: "quadro",
      quadro: quadroDePulsacao({ intervaloPulsacaoMs: 12_000, cursor: 0 }),
      agoraMs: T0 + 6_000,
    });
    expect(anunciado.estado.cadenciaDePulsacaoMs).toBe(12_000);
  });
});

// ---------------------------------------------------------------------------
// Parada por falta de política, na primeira queda
// ---------------------------------------------------------------------------

describe("a política anunciada na abertura evita a parada na primeira queda", () => {
  it("SEM anúncio e SEM política inicial, uma queda PARA o push (comportamento preservado)", () => {
    const aberto = ateAbrir();
    const caiu = reduzirFluxo(aberto.estado, {
      tipo: "falha-de-transporte",
      agoraMs: T0 + 1_000,
      sorteio: 0.5,
    });
    expect(caiu.estado.fase).toBe("parado");
    expect(caiu.estado.motivoDeParada).toBe("sem-politica-de-reconexao");
  });

  it("COM a política anunciada no primeiro quadro, a mesma queda RECONECTA", () => {
    const aberto = ateAbrir();
    const comPolitica = reduzirFluxo(aberto.estado, {
      tipo: "quadro",
      quadro: quadroDeEstado({ reconexao: POLITICA_DO_SERVIDOR }),
      agoraMs: T0 + 10,
    });
    expect(comPolitica.estado.politicaReconexao).toEqual(POLITICA_DO_SERVIDOR);

    const caiu = reduzirFluxo(comPolitica.estado, {
      tipo: "falha-de-transporte",
      agoraMs: T0 + 1_000,
      sorteio: 0.5,
    });
    expect(
      caiu.estado.motivoDeParada,
      "o push parou apesar de o servidor ter anunciado a política na abertura",
    ).toBeNull();
    expect(caiu.estado.fase).toBe("aguardando-reconexao");
    const agendamentos = caiu.efeitos.filter((e) => e.tipo === "agendar-reconexao");
    expect(agendamentos).toHaveLength(1);
    // Os NÚMEROS são do servidor: a espera fica dentro do intervalo declarado.
    const espera = agendamentos[0]?.tipo === "agendar-reconexao" ? agendamentos[0].esperaMs : -1;
    expect(espera).toBeGreaterThanOrEqual(POLITICA_DO_SERVIDOR.esperaMinimaMs);
    expect(espera).toBeLessThanOrEqual(POLITICA_DO_SERVIDOR.esperaMaximaMs);
  });

  it("a política anunciada NÃO sobrescreve uma política já recebida por instrução", () => {
    // Instrução é o canal mais específico (acompanha o encerramento). Um
    // `estado-conexao` posterior anunciando outra política é legítimo e passa a
    // valer — o que NÃO pode acontecer é um quadro SEM anúncio APAGAR a
    // política vigente.
    const aberto = ateAbrir();
    const comPolitica = reduzirFluxo(aberto.estado, {
      tipo: "quadro",
      quadro: quadroDeEstado({ reconexao: POLITICA_DO_SERVIDOR }),
      agoraMs: T0 + 10,
    });
    const semAnuncio = reduzirFluxo(comPolitica.estado, {
      tipo: "quadro",
      quadro: quadroDeEstado({ estado: "online", cursor: 0 }),
      agoraMs: T0 + 20,
    });
    expect(
      semAnuncio.estado.politicaReconexao,
      "um quadro sem anúncio apagou a política vigente do servidor",
    ).toEqual(POLITICA_DO_SERVIDOR);
  });
});
