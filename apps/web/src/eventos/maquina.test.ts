/**
 * apps/web/src/eventos/maquina.test.ts
 *
 * `CONTRATO_CLIENTE_EVENTOS` (em `@intensicare/contratos`) enumera os SETE
 * passos que um cliente conforme executa. Este arquivo trata essa lista como
 * ESPECIFICAÇÃO EXECUTÁVEL: há um `describe` por passo, e o título de cada um é
 * a própria string do contrato — importada, nunca redigitada. Se o contrato
 * ganhar um oitavo passo, o teste `cobertura` abaixo falha até que exista um
 * `describe` para ele.
 *
 * Tudo aqui é PURO: sem DOM, sem `EventSource`, sem temporizador real. O tempo
 * entra como argumento (`agoraMs`) e o sorteio de jitter também (`sorteio`) —
 * um teste que precisasse esperar de fato seria o defeito que `HANDOFF.yaml`
 * (chave `DATA`, "bomba-relógio") registra como já pago uma vez.
 *
 * Rastreio: ADR-0011 P3/P4/P5/P6/P7/P8, HAZ-0025, SAF-0025, LAC-L1.
 */
import {
  CONTRATO_CLIENTE_EVENTOS,
  DESCRICAO_MOTIVO_ENCERRAMENTO,
  EVENTO_SSE_ESTADO_CONEXAO,
  EVENTO_SSE_INSTRUCAO_RECONCILIACAO,
  EVENTO_SSE_PULSACAO,
  type MensagemEstadoConexao,
  type MensagemInstrucaoReconciliacao,
  type MensagemPulsacao,
  type PoliticaReconexao,
  TIPOS_EVENTO_FLUXO,
} from "@intensicare/contratos";
import { describe, expect, it } from "vitest";
import {
  CICLOS_DE_PULSACAO_PARA_DECLARAR_SILENCIO,
  calcularEsperaDeReconexao,
  type EstadoFluxo,
  type EventoDaMaquina,
  estadoInicialFluxo,
  pushDegradaATela,
  reduzirFluxo,
  type Transicao,
} from "./maquina.js";
import { montarUrlDoFluxo, type QuadroRecebido } from "./porta.js";

// ---------------------------------------------------------------------------
// Auxiliares — nenhum deles inventa vocabulário: todos partem do contrato
// ---------------------------------------------------------------------------

const POLITICA: PoliticaReconexao = { esperaMinimaMs: 1_000, esperaMaximaMs: 8_000, jitter: 0.5 };

const T0 = Date.UTC(2026, 7, 17, 12, 0, 0);

/**
 * Instante da leitura autoritativa que RESPONDEU ao pedido de reconciliação.
 *
 * O evento `reconciliacao-concluida` passou a exigi-lo (ACH-O3-9): sem FATO de
 * leitura o redutor recusa fechar a lacuna, e `reconciled` não pode ser
 * afirmado. Antes, o redutor exigia apenas que o evento CHEGASSE — e quem o
 * emitia podia não ter lido coisa alguma, que foi exatamente o defeito.
 */
const OBTIDO_EM = new Date(T0 + 2_400).toISOString();

/**
 * Registro dos passos do contrato de cliente EFETIVAMENTE descritos por este
 * arquivo — e das asserções que cada bloco produziu.
 *
 * POR QUE ISTO SUBSTITUIU UM `expect(CONTRATO_CLIENTE_EVENTOS.length).toBe(7)`
 * (ACH-O3-14). Aquele meta-teste prometia, pelo nome, "há um bloco de teste para
 * CADA passo" e não confrontava bloco algum: renomear o `describe` de um passo,
 * ou pulá-lo, mantinha o número 7 e a suíte verde. O nome prometia cobertura que
 * a asserção não impunha.
 *
 * Aqui o título do bloco é DERIVADO da constante (renomear é impossível) e o
 * contador de casos prova que o bloco não está vazio nem pulado.
 */
const PASSOS_DESCRITOS = new Map<string, number>();

type RegistrarCaso = (nome: string, corpo: () => void) => void;

function descreverPasso(indice: number, corpo: (caso: RegistrarCaso) => void): void {
  const titulo = CONTRATO_CLIENTE_EVENTOS[indice];
  if (titulo === undefined) {
    throw new Error(`Passo ${indice} não existe em CONTRATO_CLIENTE_EVENTOS.`);
  }
  PASSOS_DESCRITOS.set(titulo, 0);
  describe(titulo, () => {
    corpo((nome, corpoDoCaso) => {
      PASSOS_DESCRITOS.set(titulo, (PASSOS_DESCRITOS.get(titulo) ?? 0) + 1);
      it(nome, corpoDoCaso);
    });
  });
}

function quadro(nomeDoEvento: string, dados: unknown, id: string | null = null): QuadroRecebido {
  return { nomeDoEvento, dados: JSON.stringify(dados), id };
}

function quadroDePulsacao(cursor: number, estado: MensagemPulsacao["estado"] = "online") {
  const mensagem: MensagemPulsacao = {
    emitidoEm: new Date(T0).toISOString(),
    estado,
    cursor,
    pendentes: 0,
  };
  return quadro(EVENTO_SSE_PULSACAO, mensagem);
}

function quadroDeEstado(estado: MensagemEstadoConexao["estado"], cursor: number) {
  const mensagem: MensagemEstadoConexao = {
    estado,
    descricao: "irrelevante para a máquina — ela usa o identificador, não o texto",
    emitidoEm: new Date(T0).toISOString(),
    cursor,
  };
  return quadro(EVENTO_SSE_ESTADO_CONEXAO, mensagem);
}

function quadroDeInstrucao(parcial: Partial<MensagemInstrucaoReconciliacao> = {}) {
  const mensagem: MensagemInstrucaoReconciliacao = {
    motivo: "fila-excedida",
    descricao: DESCRICAO_MOTIVO_ENCERRAMENTO["fila-excedida"],
    acao: "reconciliar-por-polling",
    caminhoReconciliacao: "/v1/projecoes/grade-leitos",
    cursor: 7,
    cursorMinimoRetomavel: null,
    reconexao: POLITICA,
    emitidoEm: new Date(T0).toISOString(),
    ...parcial,
  };
  return quadro(EVENTO_SSE_INSTRUCAO_RECONCILIACAO, mensagem);
}

function quadroDeDados(sequencia: number, extra: Record<string, unknown> = {}) {
  return quadro(
    TIPOS_EVENTO_FLUXO[3],
    {
      sequencia,
      tipo: TIPOS_EVENTO_FLUXO[3],
      tenantId: "SYNTH-TENANT-G7",
      ocorridoEm: new Date(T0).toISOString(),
      dados: { id: "SYNTH-ALERTA-0001" },
      ...extra,
    },
    String(sequencia),
  );
}

/** Aplica uma sequência de eventos, acumulando os efeitos de cada passo. */
function aplicar(
  inicial: EstadoFluxo,
  eventos: readonly EventoDaMaquina[],
): { estado: EstadoFluxo; efeitos: Transicao["efeitos"][] } {
  let estado = inicial;
  const efeitos: Transicao["efeitos"][] = [];
  for (const evento of eventos) {
    const transicao = reduzirFluxo(estado, evento);
    estado = transicao.estado;
    efeitos.push(transicao.efeitos);
  }
  return { estado, efeitos };
}

/** Leva a máquina até um fluxo aberto e em dia (`online`), sem atalho. */
function atePulsacaoEmDia(cursorInicial: number): {
  estado: EstadoFluxo;
  efeitos: Transicao["efeitos"][];
} {
  return aplicar(estadoInicialFluxo(POLITICA), [
    { tipo: "montar", agoraMs: T0 },
    { tipo: "ticket-emitido", agoraMs: T0 },
    { tipo: "fluxo-aberto", agoraMs: T0 },
    { tipo: "quadro", quadro: quadroDeEstado("replaying", cursorInicial), agoraMs: T0 },
    { tipo: "quadro", quadro: quadroDeEstado("online", cursorInicial), agoraMs: T0 + 10 },
    { tipo: "quadro", quadro: quadroDePulsacao(cursorInicial), agoraMs: T0 + 1_000 },
  ]);
}

// ---------------------------------------------------------------------------
// Passo 1
// ---------------------------------------------------------------------------

descreverPasso(0, (caso) => {
  caso("pede o ticket ANTES de qualquer tentativa de abrir o fluxo", () => {
    const { estado, efeitos } = aplicar(estadoInicialFluxo(POLITICA), [
      { tipo: "montar", agoraMs: T0 },
    ]);

    expect(efeitos[0]).toEqual([{ tipo: "emitir-ticket" }]);
    expect(efeitos.flat().some((e) => e.tipo === "abrir-fluxo")).toBe(false);
    expect(estado.fase).toBe("obtendo-ticket");
  });

  caso("só abre o fluxo depois de o ticket ter sido emitido", () => {
    const { efeitos } = aplicar(estadoInicialFluxo(POLITICA), [
      { tipo: "montar", agoraMs: T0 },
      { tipo: "ticket-emitido", agoraMs: T0 },
    ]);

    expect(efeitos[1]).toEqual([{ tipo: "abrir-fluxo", cursor: null }]);
  });

  caso("ticket recusado PARA o push e não entra em laço de reemissão", () => {
    const { estado, efeitos } = aplicar(estadoInicialFluxo(POLITICA), [
      { tipo: "montar", agoraMs: T0 },
      { tipo: "ticket-recusado", agoraMs: T0 },
    ]);

    expect(estado.fase).toBe("parado");
    expect(estado.motivoDeParada).toBe("ticket-recusado");
    expect(efeitos[1]?.some((e) => e.tipo === "emitir-ticket")).toBe(false);
    expect(efeitos[1]?.some((e) => e.tipo === "agendar-reconexao")).toBe(false);
  });

  caso("NENHUM estado da máquina carrega valor de ticket, credencial ou cookie", () => {
    const { estado } = atePulsacaoEmDia(0);
    const serializado = JSON.stringify(estado).toLowerCase();

    for (const proibido of ["ticket", "cookie", "authorization", "bearer", "senha", "secret"]) {
      expect(serializado).not.toContain(proibido);
    }
  });
});

// ---------------------------------------------------------------------------
// Passo 2
// ---------------------------------------------------------------------------

descreverPasso(1, (caso) => {
  caso("a URL do fluxo não leva parâmetro algum quando não há cursor", () => {
    expect(montarUrlDoFluxo(null)).toBe("/v1/eventos/stream");
  });

  caso("a URL do fluxo leva APENAS o cursor, e ele é um inteiro não negativo", () => {
    expect(montarUrlDoFluxo(42)).toBe("/v1/eventos/stream?cursor=42");
  });

  caso("cursor inválido não vira parâmetro — fail-closed para replay do início", () => {
    expect(montarUrlDoFluxo(-1)).toBe("/v1/eventos/stream");
    expect(montarUrlDoFluxo(1.5)).toBe("/v1/eventos/stream");
    expect(montarUrlDoFluxo(Number.NaN)).toBe("/v1/eventos/stream");
  });

  caso("nenhum efeito de abertura carrega algo além do cursor", () => {
    const { efeitos } = atePulsacaoEmDia(0);
    const aberturas = efeitos.flat().filter((e) => e.tipo === "abrir-fluxo");

    expect(aberturas.length).toBeGreaterThan(0);
    for (const abertura of aberturas) {
      expect(Object.keys(abertura).sort()).toEqual(["cursor", "tipo"]);
    }
  });

  caso("a URL construída a partir do cursor nunca contém termo proibido em query", () => {
    const url = montarUrlDoFluxo(9_999).toLowerCase();
    for (const proibido of ["token", "ticket", "bearer", "tenant", "ator", "psr", "paciente"]) {
      expect(url).not.toContain(proibido);
    }
  });
});

// ---------------------------------------------------------------------------
// Passo 3
// ---------------------------------------------------------------------------

descreverPasso(2, (caso) => {
  caso("persiste a `sequencia` de cada evento de dados como cursor", () => {
    const base = atePulsacaoEmDia(0);
    const { estado } = aplicar(base.estado, [
      { tipo: "quadro", quadro: quadroDeDados(1), agoraMs: T0 + 1_100 },
      { tipo: "quadro", quadro: quadroDeDados(2), agoraMs: T0 + 1_200 },
    ]);

    expect(estado.cursor).toBe(2);
    expect(estado.sinalDeReleitura).toBe(2);
  });

  caso("reabre EXATAMENTE do cursor retido, sem lacuna e sem voltar ao início", () => {
    const base = atePulsacaoEmDia(0);
    const comDados = aplicar(base.estado, [
      { tipo: "quadro", quadro: quadroDeDados(1), agoraMs: T0 + 1_100 },
      { tipo: "quadro", quadro: quadroDeDados(2), agoraMs: T0 + 1_200 },
    ]);
    const reconectado = aplicar(comDados.estado, [
      { tipo: "falha-de-transporte", agoraMs: T0 + 2_000, sorteio: 0.5 },
      { tipo: "reconectar-agora", agoraMs: T0 + 3_000 },
      { tipo: "ticket-emitido", agoraMs: T0 + 3_010 },
    ]);

    const abertura = reconectado.efeitos.flat().find((e) => e.tipo === "abrir-fluxo");
    expect(abertura).toEqual({ tipo: "abrir-fluxo", cursor: 2 });
  });

  caso("evento REPETIDO após reconexão é idempotente: não reconta nem retrocede", () => {
    const base = atePulsacaoEmDia(0);
    const comDados = aplicar(base.estado, [
      { tipo: "quadro", quadro: quadroDeDados(1), agoraMs: T0 + 1_100 },
      { tipo: "quadro", quadro: quadroDeDados(2), agoraMs: T0 + 1_200 },
    ]);
    const sinalAntes = comDados.estado.sinalDeReleitura;

    const repetido = aplicar(comDados.estado, [
      { tipo: "quadro", quadro: quadroDeDados(2), agoraMs: T0 + 1_300 },
      { tipo: "quadro", quadro: quadroDeDados(1), agoraMs: T0 + 1_400 },
    ]);

    expect(repetido.estado.cursor).toBe(2);
    expect(repetido.estado.sinalDeReleitura).toBe(sinalAntes);
    expect(repetido.estado.duplicatasIgnoradas).toBe(2);
    expect(repetido.estado.lacunas).toBe(0);
  });

  caso("`id:` divergente da `sequencia` é lacuna observável, jamais silêncio", () => {
    const base = atePulsacaoEmDia(0);
    const divergente: QuadroRecebido = { ...quadroDeDados(5), id: "99" };
    const { estado, efeitos } = aplicar(base.estado, [
      { tipo: "quadro", quadro: divergente, agoraMs: T0 + 1_100 },
    ]);

    expect(estado.lacunas).toBe(1);
    expect(estado.ultimaLacuna).toBe("id-divergente-da-sequencia");
    expect(efeitos.flat().some((e) => e.tipo === "reconciliar-por-polling")).toBe(true);
  });

  caso("quadro ilegível é lacuna observável, jamais silêncio", () => {
    const base = atePulsacaoEmDia(0);
    const ilegivel: QuadroRecebido = {
      nomeDoEvento: TIPOS_EVENTO_FLUXO[0],
      dados: "{isto não é JSON",
      id: "3",
    };
    const { estado } = aplicar(base.estado, [
      { tipo: "quadro", quadro: ilegivel, agoraMs: T0 + 1_100 },
    ]);

    expect(estado.lacunas).toBe(1);
    expect(estado.ultimaLacuna).toBe("quadro-ilegivel");
    expect(pushDegradaATela(estado)).toBe(true);
  });

  caso("campo DESCONHECIDO dentro de evento conhecido é ignorado (evolução compatível)", () => {
    const base = atePulsacaoEmDia(0);
    const comExtra = quadroDeDados(1, { campoQueOClienteNaoConhece: "valor novo" });
    const { estado } = aplicar(base.estado, [
      { tipo: "quadro", quadro: comExtra, agoraMs: T0 + 1_100 },
    ]);

    expect(estado.cursor).toBe(1);
    expect(estado.lacunas).toBe(0);
  });

  caso("TIPO de evento desconhecido NUNCA é silenciado — vira lacuna e polling", () => {
    const base = atePulsacaoEmDia(0);
    const { estado, efeitos } = aplicar(base.estado, [
      {
        tipo: "quadro",
        quadro: quadro("tipo-que-ninguem-conhece", { a: 1 }, "8"),
        agoraMs: T0 + 1,
      },
    ]);

    expect(estado.lacunas).toBe(1);
    expect(estado.ultimaLacuna).toBe("tipo-de-evento-desconhecido");
    expect(efeitos.flat().some((e) => e.tipo === "reconciliar-por-polling")).toBe(true);
    expect(pushDegradaATela(estado)).toBe(true);
  });

  caso("cursor do SERVIDOR à frente do local denuncia entrega que o cliente não viu", () => {
    // É o detector que pega o `event:` nomeado que o `EventSource` nativo não
    // consegue observar: o servidor entregou (e avançou o cursor dele), o
    // cliente não processou nada.
    const base = atePulsacaoEmDia(0);
    const { estado, efeitos } = aplicar(base.estado, [
      { tipo: "quadro", quadro: quadroDePulsacao(12), agoraMs: T0 + 2_000 },
    ]);

    expect(estado.lacunas).toBe(1);
    expect(estado.ultimaLacuna).toBe("cursor-do-servidor-a-frente");
    expect(estado.cursor).toBe(12);
    expect(efeitos.flat().some((e) => e.tipo === "reconciliar-por-polling")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Passo 4
// ---------------------------------------------------------------------------

descreverPasso(3, (caso) => {
  caso("arma o vigia de silêncio a partir da cadência APRENDIDA no fio", () => {
    const { efeitos } = atePulsacaoEmDia(0);
    const vigias = efeitos.flat().filter((e) => e.tipo === "armar-vigia-de-silencio");

    expect(vigias.length).toBe(1);
    expect(vigias[0]).toEqual({
      tipo: "armar-vigia-de-silencio",
      prazoMs: 1_000 * CICLOS_DE_PULSACAO_PARA_DECLARAR_SILENCIO,
    });
  });

  caso(
    "não arma vigia enquanto nenhuma pulsação tiver chegado — não há intervalo anunciado",
    () => {
      const { efeitos } = aplicar(estadoInicialFluxo(POLITICA), [
        { tipo: "montar", agoraMs: T0 },
        { tipo: "ticket-emitido", agoraMs: T0 },
        { tipo: "fluxo-aberto", agoraMs: T0 },
        { tipo: "quadro", quadro: quadroDeEstado("replaying", 0), agoraMs: T0 },
      ]);

      expect(efeitos.flat().some((e) => e.tipo === "armar-vigia-de-silencio")).toBe(false);
    },
  );

  caso("silêncio DEGRADA a tela visivelmente e nunca a mantém com aparência de atual", () => {
    const base = atePulsacaoEmDia(0);
    expect(pushDegradaATela(base.estado)).toBe(false);

    const { estado, efeitos } = aplicar(base.estado, [
      { tipo: "silencio-detectado", agoraMs: T0 + 5_000, sorteio: 0.5 },
    ]);

    expect(estado.silencioDetectado).toBe(true);
    expect(estado.estadoConexao).toBe("offline");
    expect(pushDegradaATela(estado)).toBe(true);
    expect(efeitos.flat().some((e) => e.tipo === "fechar-fluxo")).toBe(true);
    expect(efeitos.flat().some((e) => e.tipo === "reconciliar-por-polling")).toBe(true);
  });

  caso("estado `degraded` declarado PELO SERVIDOR degrada a tela sem exigir silêncio", () => {
    const base = atePulsacaoEmDia(0);
    const { estado } = aplicar(base.estado, [
      { tipo: "quadro", quadro: quadroDeEstado("degraded", 0), agoraMs: T0 + 1_500 },
    ]);

    expect(estado.estadoConexao).toBe("degraded");
    expect(pushDegradaATela(estado)).toBe(true);
  });

  caso("push que NUNCA se provou vivo não inventa degradação — a tela é do polling", () => {
    const { estado } = aplicar(estadoInicialFluxo(POLITICA), [{ tipo: "montar", agoraMs: T0 }]);

    expect(estado.pulsacoesRecebidas).toBe(0);
    expect(pushDegradaATela(estado)).toBe(false);
  });

  caso("reaprende a cadência a cada pulsação, sem constante local de heartbeat", () => {
    const base = atePulsacaoEmDia(0);
    const { estado, efeitos } = aplicar(base.estado, [
      { tipo: "quadro", quadro: quadroDePulsacao(0), agoraMs: T0 + 4_000 },
    ]);

    expect(estado.cadenciaDePulsacaoMs).toBe(3_000);
    expect(efeitos.flat()).toContainEqual({
      tipo: "armar-vigia-de-silencio",
      prazoMs: 3_000 * CICLOS_DE_PULSACAO_PARA_DECLARAR_SILENCIO,
    });
  });
});

// ---------------------------------------------------------------------------
// Passo 5
// ---------------------------------------------------------------------------

descreverPasso(4, (caso) => {
  caso("executa a ação `reconciliar-por-polling` e NÃO volta a confiar na tela antes dela", () => {
    const base = atePulsacaoEmDia(0);
    const { estado, efeitos } = aplicar(base.estado, [
      { tipo: "quadro", quadro: quadroDeInstrucao(), agoraMs: T0 + 2_000 },
    ]);

    const emitidos = efeitos.flat().map((e) => e.tipo);
    expect(emitidos).toContain("reconciliar-por-polling");
    expect(emitidos).toContain("fechar-fluxo");
    expect(estado.fase).toBe("reconciliando");
    expect(estado.instrucaoPendente?.motivo).toBe("fila-excedida");
    expect(pushDegradaATela(estado)).toBe(true);
  });

  caso("só declara `reconciled` DEPOIS de a reconciliação ter de fato concluído", () => {
    const base = atePulsacaoEmDia(0);
    const instruido = aplicar(base.estado, [
      { tipo: "quadro", quadro: quadroDeInstrucao(), agoraMs: T0 + 2_000 },
    ]);
    expect(instruido.estado.estadoConexao).not.toBe("reconciled");

    const concluido = aplicar(instruido.estado, [
      { tipo: "reconciliacao-concluida", agoraMs: T0 + 2_500, sorteio: 0.5, obtidoEm: OBTIDO_EM },
    ]);

    expect(concluido.estado.estadoConexao).toBe("reconciled");
    expect(concluido.estado.instrucaoPendente).toBeNull();
  });

  caso("reconciliação SEM dúvida alguma NÃO fabrica `reconciled` — honestidade de origem", () => {
    // `reconciliado` só pode existir quando houve, de fato, algo a reconciliar
    // (lacuna ou instrução vindas do fio). Uma releitura de rotina concluída
    // não autoriza o cliente a afirmar "estou alinhado à projeção autoritativa".
    const base = atePulsacaoEmDia(0);
    const rotina = aplicar(base.estado, [
      { tipo: "quadro", quadro: quadroDeDados(1), agoraMs: T0 + 1_100 },
      { tipo: "reconciliacao-concluida", agoraMs: T0 + 1_200, sorteio: 0.5, obtidoEm: OBTIDO_EM },
    ]);

    expect(rotina.estado.estadoConexao).toBe("online");
    expect(rotina.estado.estadoConexao).not.toBe("reconciled");
  });

  caso("reconciliação que FALHA não limpa a lacuna nem declara alinhamento", () => {
    const base = atePulsacaoEmDia(0);
    const instruido = aplicar(base.estado, [
      { tipo: "quadro", quadro: quadroDeInstrucao(), agoraMs: T0 + 2_000 },
    ]);
    const falhou = aplicar(instruido.estado, [{ tipo: "reconciliacao-falhou" }]);

    expect(falhou.estado.estadoConexao).not.toBe("reconciled");
    expect(falhou.estado.instrucaoPendente).not.toBeNull();
    expect(pushDegradaATela(falhou.estado)).toBe(true);
  });

  caso("`cursor-irretomavel` registra a lacuna e retoma do mínimo que o servidor declara", () => {
    const base = atePulsacaoEmDia(0);
    const instrucao = quadroDeInstrucao({
      motivo: "cursor-irretomavel",
      descricao: DESCRICAO_MOTIVO_ENCERRAMENTO["cursor-irretomavel"],
      cursor: 3,
      cursorMinimoRetomavel: 50,
    });
    const { estado } = aplicar(base.estado, [
      { tipo: "quadro", quadro: instrucao, agoraMs: T0 + 2_000 },
    ]);

    expect(estado.lacunas).toBe(1);
    expect(estado.ultimaLacuna).toBe("cursor-irretomavel");
    expect(estado.cursor).toBe(50);
  });

  caso("`reconectar-do-cursor` reconecta sem exigir polling — a ação do fio é a que vale", () => {
    const base = atePulsacaoEmDia(0);
    const instrucao = quadroDeInstrucao({
      motivo: "desligamento-servidor",
      descricao: DESCRICAO_MOTIVO_ENCERRAMENTO["desligamento-servidor"],
      acao: "reconectar-do-cursor",
    });
    const { estado, efeitos } = aplicar(base.estado, [
      { tipo: "quadro", quadro: instrucao, agoraMs: T0 + 2_000 },
    ]);

    const emitidos = efeitos.flat().map((e) => e.tipo);
    expect(emitidos).toContain("agendar-reconexao");
    expect(emitidos).not.toContain("reconciliar-por-polling");
    expect(estado.fase).toBe("aguardando-reconexao");
  });
});

// ---------------------------------------------------------------------------
// Passo 6
// ---------------------------------------------------------------------------

descreverPasso(5, (caso) => {
  caso("a espera respeita o piso, o teto e o jitter DECLARADOS pelo servidor", () => {
    expect(calcularEsperaDeReconexao(POLITICA, 1, 0.5)).toBe(1_000);
    expect(calcularEsperaDeReconexao(POLITICA, 2, 0.5)).toBe(2_000);
    expect(calcularEsperaDeReconexao(POLITICA, 3, 0.5)).toBe(4_000);
    // Teto do servidor respeitado, por mais tentativas que haja.
    expect(calcularEsperaDeReconexao(POLITICA, 20, 0.5)).toBe(8_000);
    // Jitter para baixo nunca desce abaixo do piso declarado.
    expect(calcularEsperaDeReconexao(POLITICA, 1, 0)).toBe(1_000);
    // Jitter para cima nunca ultrapassa o teto declarado.
    expect(calcularEsperaDeReconexao(POLITICA, 3, 1)).toBe(6_000);
    expect(calcularEsperaDeReconexao(POLITICA, 20, 1)).toBe(8_000);
  });

  caso("adota a política que veio na instrução, substituindo a anterior", () => {
    const outra: PoliticaReconexao = {
      esperaMinimaMs: 250,
      esperaMaximaMs: 500,
      jitter: 0,
    };
    const base = atePulsacaoEmDia(0);
    const { estado, efeitos } = aplicar(base.estado, [
      { tipo: "quadro", quadro: quadroDeInstrucao({ reconexao: outra }), agoraMs: T0 + 2_000 },
      { tipo: "reconciliacao-concluida", agoraMs: T0 + 2_100, sorteio: 0.5, obtidoEm: OBTIDO_EM },
    ]);

    expect(estado.politicaReconexao).toEqual(outra);
    expect(efeitos.flat()).toContainEqual({ tipo: "agendar-reconexao", esperaMs: 250 });
  });

  caso("sem política recebida, NÃO inventa uma: para e declara o motivo", () => {
    const semPolitica = aplicar(estadoInicialFluxo(), [
      { tipo: "montar", agoraMs: T0 },
      { tipo: "ticket-emitido", agoraMs: T0 },
      { tipo: "fluxo-aberto", agoraMs: T0 },
      { tipo: "falha-de-transporte", agoraMs: T0 + 100, sorteio: 0.5 },
    ]);

    expect(semPolitica.estado.fase).toBe("parado");
    expect(semPolitica.estado.motivoDeParada).toBe("sem-politica-de-reconexao");
    expect(semPolitica.efeitos.flat().some((e) => e.tipo === "agendar-reconexao")).toBe(false);
    // Mesmo parando o push, o polling continua sendo mandado reconciliar.
    expect(semPolitica.efeitos.flat().some((e) => e.tipo === "reconciliar-por-polling")).toBe(true);
  });

  caso("a tentativa cresce a cada falha consecutiva e zera quando o fluxo volta a abrir", () => {
    const base = atePulsacaoEmDia(0);
    const duasFalhas = aplicar(base.estado, [
      { tipo: "falha-de-transporte", agoraMs: T0 + 2_000, sorteio: 0.5 },
      { tipo: "reconectar-agora", agoraMs: T0 + 3_000 },
      { tipo: "ticket-emitido", agoraMs: T0 + 3_010 },
      { tipo: "falha-de-transporte", agoraMs: T0 + 3_020, sorteio: 0.5 },
    ]);
    expect(duasFalhas.estado.tentativasDeReconexao).toBe(2);

    const voltou = aplicar(duasFalhas.estado, [
      { tipo: "reconectar-agora", agoraMs: T0 + 5_000 },
      { tipo: "ticket-emitido", agoraMs: T0 + 5_010 },
      { tipo: "fluxo-aberto", agoraMs: T0 + 5_020 },
    ]);
    expect(voltou.estado.tentativasDeReconexao).toBe(0);
    expect(voltou.estado.estadoConexao).toBe("reconnecting");
  });
});

// ---------------------------------------------------------------------------
// Passo 7
// ---------------------------------------------------------------------------

descreverPasso(6, (caso) => {
  caso("o evento sinaliza QUE releia — a máquina não guarda dado clínico algum", () => {
    const base = atePulsacaoEmDia(0);
    const comCarga = quadro(
      TIPOS_EVENTO_FLUXO[2],
      {
        sequencia: 4,
        tipo: TIPOS_EVENTO_FLUXO[2],
        tenantId: "SYNTH-TENANT-G7",
        ocorridoEm: new Date(T0).toISOString(),
        dados: { status: "invalido", banda: "critico", pontuacao: 11 },
      },
      "4",
    );
    const { estado } = aplicar(base.estado, [
      { tipo: "quadro", quadro: comCarga, agoraMs: T0 + 1_100 },
    ]);

    const serializado = JSON.stringify(estado);
    expect(serializado).not.toContain("critico");
    expect(serializado).not.toContain("invalido");
    expect(serializado).not.toContain("pontuacao");
    expect(serializado).not.toContain("banda");
    expect(estado.cursor).toBe(4);
    expect(estado.sinalDeReleitura).toBe(1);
  });

  caso("toda dúvida (lacuna, desconexão, silêncio) produz reconciliação por polling", () => {
    const duvidas: readonly EventoDaMaquina[] = [
      { tipo: "falha-de-transporte", agoraMs: T0 + 2_000, sorteio: 0.5 },
      { tipo: "silencio-detectado", agoraMs: T0 + 2_000, sorteio: 0.5 },
      { tipo: "quadro", quadro: quadro("desconhecido", {}, null), agoraMs: T0 + 2_000 },
      { tipo: "quadro", quadro: quadroDePulsacao(99), agoraMs: T0 + 2_000 },
    ];

    for (const duvida of duvidas) {
      const base = atePulsacaoEmDia(0);
      const { efeitos } = aplicar(base.estado, [duvida]);
      expect(
        efeitos.flat().some((e) => e.tipo === "reconciliar-por-polling"),
        `dúvida ${duvida.tipo} deveria mandar reconciliar por polling`,
      ).toBe(true);
    }
  });

  caso("não emite reconciliação nova enquanto a anterior está em voo (sem tempestade)", () => {
    const base = atePulsacaoEmDia(0);
    const rajada = aplicar(base.estado, [
      { tipo: "quadro", quadro: quadroDeDados(1), agoraMs: T0 + 1_100 },
      { tipo: "quadro", quadro: quadroDeDados(2), agoraMs: T0 + 1_110 },
      { tipo: "quadro", quadro: quadroDeDados(3), agoraMs: T0 + 1_120 },
      { tipo: "quadro", quadro: quadroDeDados(4), agoraMs: T0 + 1_130 },
    ]);

    const pedidos = rajada.efeitos.flat().filter((e) => e.tipo === "reconciliar-por-polling");
    expect(pedidos.length).toBe(1);
    expect(rajada.estado.releituraPendente).toBe(true);

    // Concluída a primeira, a releitura pendente da rajada é emitida — uma vez.
    const depois = aplicar(rajada.estado, [
      { tipo: "reconciliacao-concluida", agoraMs: T0 + 1_200, sorteio: 0.5, obtidoEm: OBTIDO_EM },
    ]);
    expect(depois.efeitos.flat().filter((e) => e.tipo === "reconciliar-por-polling").length).toBe(
      1,
    );
    expect(depois.estado.releituraPendente).toBe(false);
  });

  caso(
    "durante o catch-up NÃO dispara uma releitura por evento: uma só, ao voltar a `online`",
    () => {
      const emReplay = aplicar(estadoInicialFluxo(POLITICA), [
        { tipo: "montar", agoraMs: T0 },
        { tipo: "ticket-emitido", agoraMs: T0 },
        { tipo: "fluxo-aberto", agoraMs: T0 },
        { tipo: "quadro", quadro: quadroDeEstado("replaying", 0), agoraMs: T0 },
        { tipo: "quadro", quadro: quadroDeDados(1), agoraMs: T0 + 1 },
        { tipo: "quadro", quadro: quadroDeDados(2), agoraMs: T0 + 2 },
        { tipo: "quadro", quadro: quadroDeDados(3), agoraMs: T0 + 3 },
      ]);
      expect(emReplay.efeitos.flat().some((e) => e.tipo === "reconciliar-por-polling")).toBe(false);
      expect(emReplay.estado.estadoConexao).toBe("replaying");

      const online = aplicar(emReplay.estado, [
        { tipo: "quadro", quadro: quadroDeEstado("online", 3), agoraMs: T0 + 4 },
      ]);
      expect(online.efeitos.flat().filter((e) => e.tipo === "reconciliar-por-polling").length).toBe(
        1,
      );
    },
  );

  caso("`replaying` só existe porque veio do fio — não é fabricado pelo cliente", () => {
    const semFio = aplicar(estadoInicialFluxo(POLITICA), [
      { tipo: "montar", agoraMs: T0 },
      { tipo: "ticket-emitido", agoraMs: T0 },
      { tipo: "fluxo-aberto", agoraMs: T0 },
    ]);
    expect(semFio.estado.estadoConexao).not.toBe("replaying");

    const comFio = aplicar(semFio.estado, [
      { tipo: "quadro", quadro: quadroDeEstado("replaying", 0), agoraMs: T0 },
    ]);
    expect(comFio.estado.estadoConexao).toBe("replaying");
  });
});

// ---------------------------------------------------------------------------
// Ciclo de vida e guarda de cobertura do contrato
// ---------------------------------------------------------------------------

describe("ciclo de vida e cancelamento", () => {
  it("desmontar fecha o fluxo, cancela o vigia e não agenda mais nada", () => {
    const base = atePulsacaoEmDia(0);
    const { estado, efeitos } = aplicar(base.estado, [{ tipo: "desmontar" }]);

    expect(estado.fase).toBe("parado");
    expect(estado.motivoDeParada).toBe("desmontado");
    const emitidos = efeitos.flat().map((e) => e.tipo);
    expect(emitidos).toContain("fechar-fluxo");
    expect(emitidos).toContain("cancelar-vigia-de-silencio");
    expect(emitidos).not.toContain("agendar-reconexao");
    expect(emitidos).not.toContain("emitir-ticket");
  });

  it("máquina parada ignora quadros tardios — nada ressuscita por evento atrasado", () => {
    const base = atePulsacaoEmDia(0);
    const parada = aplicar(base.estado, [{ tipo: "desmontar" }]);
    const tardio = aplicar(parada.estado, [
      { tipo: "quadro", quadro: quadroDeDados(9), agoraMs: T0 + 9_000 },
      { tipo: "falha-de-transporte", agoraMs: T0 + 9_100, sorteio: 0.5 },
    ]);

    expect(tardio.estado).toEqual(parada.estado);
    expect(tardio.efeitos.flat()).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Prova de vida do push e representação visível da perda (ACH-O3-10/11)
// ---------------------------------------------------------------------------

describe("o que conta como PROVA DE VIDA do push", () => {
  it("push que nunca abriu não inventa degradação — a tela é do polling", () => {
    const { estado } = aplicar(estadoInicialFluxo(POLITICA), [{ tipo: "montar", agoraMs: T0 }]);

    expect(estado.seProvouVivo).toBe(false);
    expect(pushDegradaATela(estado)).toBe(false);
  });

  it("o FLUXO ABERTO já é prova de vida — não é preciso esperar pulsação", () => {
    // Este era o defeito: a guarda olhava `pulsacoesRecebidas === 0`, e um push
    // que abriu, recebeu o primeiro quadro do servidor e caiu produzia ZERO
    // pixels na tela clínica (QAS-0023 exige contagem zero de degradação sem
    // representação visível).
    const aberto = aplicar(estadoInicialFluxo(POLITICA), [
      { tipo: "montar", agoraMs: T0 },
      { tipo: "ticket-emitido", agoraMs: T0 },
      { tipo: "fluxo-aberto", agoraMs: T0 },
      { tipo: "quadro", quadro: quadroDeEstado("online", 0), agoraMs: T0 + 10 },
    ]);
    expect(aberto.estado.pulsacoesRecebidas, "a bancada não está na janela em questão").toBe(0);
    expect(aberto.estado.seProvouVivo).toBe(true);
    expect(pushDegradaATela(aberto.estado)).toBe(false);

    const caiu = aplicar(aberto.estado, [
      { tipo: "falha-de-transporte", agoraMs: T0 + 20, sorteio: 0.5 },
    ]);
    expect(caiu.estado.pulsacoesRecebidas).toBe(0);
    expect(
      pushDegradaATela(caiu.estado),
      "o push se provou vivo, caiu, e a tela seguiria se apresentando como saudável",
    ).toBe(true);
  });
});

describe("push PARADO tem representação visível — menos quando não há tela", () => {
  it("parada por `ticket-recusado` degrada a tela", () => {
    const parado = aplicar(estadoInicialFluxo(POLITICA), [
      { tipo: "montar", agoraMs: T0 },
      { tipo: "ticket-recusado", agoraMs: T0 },
    ]);

    expect(parado.estado.motivoDeParada).toBe("ticket-recusado");
    expect(pushDegradaATela(parado.estado)).toBe(true);
  });

  it("parada por `sem-politica-de-reconexao` degrada a tela", () => {
    const parado = aplicar(estadoInicialFluxo(), [
      { tipo: "montar", agoraMs: T0 },
      { tipo: "ticket-emitido", agoraMs: T0 },
      { tipo: "fluxo-aberto", agoraMs: T0 },
      { tipo: "falha-de-transporte", agoraMs: T0 + 10, sorteio: 0.5 },
    ]);

    expect(parado.estado.motivoDeParada).toBe("sem-politica-de-reconexao");
    expect(pushDegradaATela(parado.estado)).toBe(true);
  });

  it("parada por DESMONTAGEM não degrada — não há tela para declarar coisa alguma", () => {
    const desmontado = aplicar(atePulsacaoEmDia(0).estado, [{ tipo: "desmontar" }]);

    expect(desmontado.estado.motivoDeParada).toBe("desmontado");
    expect(
      pushDegradaATela(desmontado.estado),
      "a desmontagem virou degradação: todo teste que desmonta passaria a ver banner",
    ).toBe(false);
  });
});

describe("o MESMO estado de fio afirma a MESMA coisa em toda janela", () => {
  /** Estado de fio aplicado sobre um fluxo aberto, com N pulsações antes. */
  function comEstadoDeFio(estado: MensagemEstadoConexao["estado"], comPulsacao: boolean) {
    const base = comPulsacao
      ? atePulsacaoEmDia(0)
      : aplicar(estadoInicialFluxo(POLITICA), [
          { tipo: "montar", agoraMs: T0 },
          { tipo: "ticket-emitido", agoraMs: T0 },
          { tipo: "fluxo-aberto", agoraMs: T0 },
        ]);
    return aplicar(base.estado, [
      { tipo: "quadro", quadro: quadroDeEstado(estado, 0), agoraMs: T0 + 1_500 },
    ]).estado;
  }

  it.each(["offline", "reconnecting", "degraded"] as const)(
    "`%s` degrada a tela com ou sem pulsação anterior",
    (estadoDoFio) => {
      const semPulsacao = comEstadoDeFio(estadoDoFio, false);
      const comPulsacao = comEstadoDeFio(estadoDoFio, true);

      // Guarda de não-vacuidade: as duas bancadas são de fato distintas.
      expect(semPulsacao.pulsacoesRecebidas).toBe(0);
      expect(comPulsacao.pulsacoesRecebidas).toBeGreaterThan(0);

      expect(pushDegradaATela(semPulsacao)).toBe(true);
      expect(pushDegradaATela(comPulsacao)).toBe(true);
    },
  );

  it.each(["replaying", "reconciled"] as const)(
    "`%s` é INFORMATIVO e não degrada, com ou sem pulsação anterior",
    (estadoDoFio) => {
      // Antes, estes eram mudos antes da primeira pulsação e viravam `degradado`
      // depois dela — o mesmo fato do fio produzindo duas afirmações diferentes
      // na tela. Eles têm representação própria (`reproduzindo`/`reconciliado`)
      // em `../estado/conectividade.ts`; degradá-los aqui os APAGARIA.
      const semPulsacao = comEstadoDeFio(estadoDoFio, false);
      const comPulsacao = comEstadoDeFio(estadoDoFio, true);

      expect(semPulsacao.pulsacoesRecebidas).toBe(0);
      expect(comPulsacao.pulsacoesRecebidas).toBeGreaterThan(0);

      expect(pushDegradaATela(semPulsacao)).toBe(false);
      expect(pushDegradaATela(comPulsacao)).toBe(false);
    },
  );
});

describe("`reconciled` exige FATO de leitura no próprio evento", () => {
  it("conclusão SEM instante de leitura não fecha a lacuna nem declara `reconciled`", () => {
    const instruido = aplicar(atePulsacaoEmDia(0).estado, [
      { tipo: "quadro", quadro: quadroDeInstrucao(), agoraMs: T0 + 2_000 },
    ]);
    expect(instruido.estado.instrucaoPendente).not.toBeNull();

    const semFato = aplicar(instruido.estado, [
      // Fato VAZIO: é o que um chamador em JavaScript conseguiria produzir.
      { tipo: "reconciliacao-concluida", agoraMs: T0 + 2_100, sorteio: 0.5, obtidoEm: "" },
    ]);

    expect(semFato.estado.estadoConexao).not.toBe("reconciled");
    expect(
      semFato.estado.instrucaoPendente,
      "a instrução foi dada por cumprida sem que leitura alguma tivesse ocorrido",
    ).not.toBeNull();
    expect(pushDegradaATela(semFato.estado)).toBe(true);
    // A busca em voo é liberada: o próximo pedido pode sair.
    expect(semFato.estado.reconciliacaoEmVoo).toBe(false);
  });
});

describe("cobertura do contrato de cliente", () => {
  it("cada passo do contrato tem bloco PRÓPRIO, e com casos dentro", () => {
    /*
      CONFRONTA OS TÍTULOS REGISTRADOS, não um número (ACH-O3-14). A versão
      anterior era `expect(CONTRATO_CLIENTE_EVENTOS.length).toBe(7)`: o nome
      prometia "há um bloco para CADA passo" e a asserção não olhava bloco
      nenhum — renomear ou pular o bloco de um passo mantinha a suíte verde.

      Duas mutações ficam fechadas aqui: renomear é impossível (o título é
      DERIVADO da constante, por `descreverPasso`), e um bloco sem casos deixa a
      contagem em zero.
    */
    expect([...PASSOS_DESCRITOS.keys()].sort()).toEqual([...CONTRATO_CLIENTE_EVENTOS].sort());
    for (const [titulo, casos] of PASSOS_DESCRITOS) {
      expect(casos, `o passo "${titulo}" não tem caso de teste algum`).toBeGreaterThan(0);
    }
  });
});
