/**
 * apps/web/src/eventos/maquina.ts
 *
 * MÁQUINA DE ESTADOS PURA do consumo de push (SSE) no navegador. Sem React,
 * sem DOM, sem `EventSource`, sem temporizador: o tempo entra como `agoraMs` e
 * o sorteio de jitter como `sorteio`. Tudo o que o mundo real precisa fazer sai
 * daqui como `Efeito` — quem os executa é `./useFluxoDeEventos.ts`.
 *
 * A RELAÇÃO QUE ESTE MÓDULO NÃO PODE INVERTER (ADR-0011 P8, verbatim: "o
 * polling server-authoritative é o caminho de verdade de recuperação de TODA
 * superfície"; "o push é otimização de latência sobre P8 — nunca o contrário").
 * Consequências estruturais, não disciplina de quem chama:
 *
 *   - o único produto útil de um evento de dados é o efeito
 *     `reconciliar-por-polling`. O evento diz QUE releia, nunca O QUE é verdade
 *     (P7: "a projeção entrega o status pronto — o cliente não o deriva");
 *   - NENHUM campo de `EstadoFluxo` guarda a carga (`dados`) de um evento. Não
 *     é uma regra a lembrar: o interpretador simplesmente não a lê, e um teste
 *     serializa o estado inteiro para provar que nada clínico entrou;
 *   - push ausente NÃO degrada a tela — push que se PROVOU vivo e depois se
 *     perdeu degrada (ADR-0011 P6, HAZ-0025, SAF-0025). Ver `pushDegradaATela`.
 *
 * O INTERVALO DE PULSAÇÃO NÃO É DIGITADO AQUI — E AGORA ELE CHEGA PELO FIO.
 *
 * Este parágrafo dizia que "nenhum campo do fio carrega hoje esse intervalo".
 * Deixou de ser verdade: o contrato passou a publicar `intervaloPulsacaoMs`
 * (opcional) em `pulsacao` e em `estado-conexao`, e a política de reconexão
 * (`reconexao`) já no PRIMEIRO quadro. Duas janelas cegas fecharam com isso:
 * entre a abertura e a primeira pulsação não havia vigia armado (uma conexão
 * meio-aberta ali era indistinguível de uma saudável), e uma queda antes da
 * primeira instrução parava o push por falta de política.
 *
 * O ANÚNCIO TEM PRECEDÊNCIA, O APRENDIZADO CONTINUA. Os campos são OPCIONAIS
 * por contrato: um servidor que não os envie continua conforme, e este cliente
 * continua obrigado a funcionar. A cadência segue sendo APRENDIDA do próprio
 * fio quando não anunciada — a primeira pulsação mede abertura→pulsação
 * (estimativa conservadora, pois o servidor arma o temporizador dele só depois
 * do catch-up), e cada pulsação seguinte mede pulsação→pulsação. Nenhum número
 * é escolhido aqui, nem por anúncio nem por aprendizado.
 *
 * Rastreio: ADR-0011 P3/P4/P5/P6/P7/P8, ADR-0016 §4.1, HAZ-0025, SAF-0025,
 * LAC-L1, contrato comum §10 itens 11/12/13/14.
 */
import {
  ESTADOS_CONEXAO,
  type EstadoConexao,
  EVENTO_SSE_ESTADO_CONEXAO,
  EVENTO_SSE_INSTRUCAO_RECONCILIACAO,
  EVENTO_SSE_PULSACAO,
  type MensagemEstadoConexao,
  type MensagemInstrucaoReconciliacao,
  type MensagemPulsacao,
  MOTIVOS_ENCERRAMENTO,
  type PoliticaReconexao,
  TIPOS_EVENTO_FLUXO,
} from "@intensicare/contratos";
import type { QuadroRecebido } from "./porta.js";

// ---------------------------------------------------------------------------
// Premissa reversível de engenharia
// ---------------------------------------------------------------------------

/**
 * Quantas cadências de pulsação inteiras precisam vencer em SILÊNCIO para que
 * o cliente declare a conexão morta.
 *
 * DOIS, pelo mesmo raciocínio já registrado em `CICLOS_PARA_DECLARAR_PERDA`
 * (`../estado/idadeVisao.ts`): uma cadência de atraso é explicada por jitter de
 * rede e pela pulsação que está em voo agora; só a partir da segunda existe um
 * intervalo que venceu e NÃO produziu sinal — aí a afirmação "a conexão morreu"
 * é verificável, e não um alarme que pisca em regime normal.
 *
 * PREMISSA REVERSÍVEL de ENGENHARIA (mesmo regime de
 * `INTERVALO_RECARGA_PADRAO_MS` e `CICLOS_PARA_DECLARAR_PERDA`): NÃO é SLO, NÃO
 * é alvo de latência de entrega (ADR-0011 §3 D6 segue `VALIDATION REQUIRED`) e
 * NÃO é limiar clínico de frescor (VAL-0023). É uma regra sobre o próprio
 * temporizador deste cliente, e é a primeira coisa a mudar quando alguém com
 * autoridade decidir a tolerância.
 */
export const CICLOS_DE_PULSACAO_PARA_DECLARAR_SILENCIO = 2;

// ---------------------------------------------------------------------------
// Estado
// ---------------------------------------------------------------------------

export type FaseFluxo =
  | "ocioso"
  | "obtendo-ticket"
  | "abrindo"
  | "aberto"
  | "reconciliando"
  | "aguardando-reconexao"
  | "parado";

/** Por que o push PAROU. Sempre explícito — push não morre em silêncio. */
export type MotivoDeParada = "ticket-recusado" | "sem-politica-de-reconexao" | "desmontado";

/**
 * Motivos de LACUNA — coisas que o cliente sabe não ter visto. Nenhum deles é
 * silenciável: todos forçam reconciliação por polling (ADR-0011 P4/P8).
 */
export type MotivoDeLacuna =
  | "tipo-de-evento-desconhecido"
  | "quadro-ilegivel"
  | "id-divergente-da-sequencia"
  | "cursor-do-servidor-a-frente"
  | "cursor-irretomavel";

export interface EstadoFluxo {
  readonly fase: FaseFluxo;
  /** Estado de conexão no vocabulário do FIO (ADR-0011 P6). */
  readonly estadoConexao: EstadoConexao;
  /** Cursor durável de retomada — a `sequencia` do último evento processado. */
  readonly cursor: number | null;
  /** Quantas vezes o servidor sinalizou que há algo novo a reler. */
  readonly sinalDeReleitura: number;
  /** Há releitura pendente ainda não pedida (catch-up ou reconciliação em voo). */
  readonly releituraPendente: boolean;
  /** Há um pedido de reconciliação em voo — impede tempestade de releitura. */
  readonly reconciliacaoEmVoo: boolean;
  /** Lacunas observadas desde a montagem (observabilidade, ADR-0020). */
  readonly lacunas: number;
  readonly ultimaLacuna: MotivoDeLacuna | null;
  /** `true` enquanto uma lacuna conhecida não foi reconciliada por polling. */
  readonly lacunaNaoReconciliada: boolean;
  /** Eventos repetidos descartados de forma idempotente. */
  readonly duplicatasIgnoradas: number;
  /** Instrução recebida e ainda não cumprida. */
  readonly instrucaoPendente: MensagemInstrucaoReconciliacao | null;
  /** Política de reconexão DIRIGIDA PELO SERVIDOR. Nunca inventada aqui. */
  readonly politicaReconexao: PoliticaReconexao | null;
  readonly tentativasDeReconexao: number;
  /**
   * Cadência de pulsação em ms — ANUNCIADA pelo servidor quando ele a publica
   * (`intervaloPulsacaoMs`), APRENDIDA do fio quando não. `null` = ainda
   * desconhecida, e nesse caso não há vigia armado.
   */
  readonly cadenciaDePulsacaoMs: number | null;
  readonly pulsacoesRecebidas: number;
  /**
   * O push SE PROVOU VIVO — o fluxo chegou a abrir, ou o servidor chegou a
   * escrever um quadro nele.
   *
   * ISTO SUBSTITUI `pulsacoesRecebidas === 0` COMO PREDICADO DE PROVA DE VIDA
   * (ACH-O3-10). Os dois não são a mesma coisa, e a diferença tinha custo
   * clínico medido: um push que abriu o fluxo, recebeu o primeiro quadro do
   * servidor (`estado-conexao`, que anuncia `online`) e então caiu — antes de a
   * primeira PULSAÇÃO chegar — era classificado como "nunca se provou vivo", e
   * `pushDegradaATela` devolvia `false`. A tela ficava sem banner nenhum, isto
   * é, apresentando-se como saudável, com o push morto. `QAS-0023` exige
   * contagem ZERO de degradação sem representação visível; ali ela era ≥ 1.
   *
   * A prova de vida certa é o TRANSPORTE, não a cadência: `fluxo-aberto` é o
   * instante em que a tela passa a depender do push.
   */
  readonly seProvouVivo: boolean;
  readonly instanteDeAberturaMs: number | null;
  readonly instanteDaUltimaPulsacaoMs: number | null;
  readonly instanteDaUltimaAtividadeMs: number | null;
  readonly silencioDetectado: boolean;
  readonly motivoDeParada: MotivoDeParada | null;
}

export type EventoDaMaquina =
  | { readonly tipo: "montar"; readonly agoraMs: number }
  | { readonly tipo: "reconectar-agora"; readonly agoraMs: number }
  | { readonly tipo: "ticket-emitido"; readonly agoraMs: number }
  | { readonly tipo: "ticket-recusado"; readonly agoraMs: number }
  | { readonly tipo: "fluxo-aberto"; readonly agoraMs: number }
  | { readonly tipo: "quadro"; readonly quadro: QuadroRecebido; readonly agoraMs: number }
  | { readonly tipo: "falha-de-transporte"; readonly agoraMs: number; readonly sorteio: number }
  | { readonly tipo: "silencio-detectado"; readonly agoraMs: number; readonly sorteio: number }
  | {
      /**
       * A releitura autoritativa CONCLUIU — e traz consigo a evidência.
       *
       * `obtidoEm` é o instante ISO da leitura bem-sucedida que respondeu ao
       * pedido (`FatoDeLeitura`, `./porta.ts`). Ele não é decoração: sem fato de
       * leitura o redutor RECUSA fechar a lacuna, e `reconciled` não pode ser
       * afirmado (ACH-O3-9). Antes, este evento não carregava evidência alguma —
       * o redutor exigia apenas que ele CHEGASSE, e quem o emitia podia não ter
       * lido nada.
       */
      readonly tipo: "reconciliacao-concluida";
      readonly agoraMs: number;
      readonly sorteio: number;
      readonly obtidoEm: string;
    }
  | { readonly tipo: "reconciliacao-falhou" }
  | { readonly tipo: "desmontar" };

export type Efeito =
  | { readonly tipo: "emitir-ticket" }
  | { readonly tipo: "abrir-fluxo"; readonly cursor: number | null }
  | { readonly tipo: "fechar-fluxo" }
  | { readonly tipo: "armar-vigia-de-silencio"; readonly prazoMs: number }
  | { readonly tipo: "cancelar-vigia-de-silencio" }
  | { readonly tipo: "agendar-reconexao"; readonly esperaMs: number }
  | { readonly tipo: "reconciliar-por-polling" };

export interface Transicao {
  readonly estado: EstadoFluxo;
  readonly efeitos: readonly Efeito[];
}

/**
 * @param politicaInicial política de reconexão conhecida ANTES da primeira
 * instrução do servidor. Deliberadamente SEM valor padrão: a política é
 * dirigida pelo servidor (ADR-0011 P5) e este módulo não inventa uma. Sem ela,
 * uma queda de transporte antes da primeira `instrucao-reconciliacao` PARA o
 * push de forma explícita, em vez de reconectar segundo um número escolhido
 * aqui.
 */
export function estadoInicialFluxo(politicaInicial?: PoliticaReconexao): EstadoFluxo {
  return {
    fase: "ocioso",
    // `offline` é a verdade no instante zero: não há push algum. Ele NÃO
    // implica tela degradada — ver `pushDegradaATela`.
    estadoConexao: "offline",
    cursor: null,
    sinalDeReleitura: 0,
    releituraPendente: false,
    reconciliacaoEmVoo: false,
    lacunas: 0,
    ultimaLacuna: null,
    lacunaNaoReconciliada: false,
    duplicatasIgnoradas: 0,
    instrucaoPendente: null,
    politicaReconexao: politicaInicial ?? null,
    tentativasDeReconexao: 0,
    cadenciaDePulsacaoMs: null,
    pulsacoesRecebidas: 0,
    seProvouVivo: false,
    instanteDeAberturaMs: null,
    instanteDaUltimaPulsacaoMs: null,
    instanteDaUltimaAtividadeMs: null,
    silencioDetectado: false,
    motivoDeParada: null,
  };
}

// ---------------------------------------------------------------------------
// Derivação para a tela
// ---------------------------------------------------------------------------

/**
 * O push obriga a tela a se declarar degradada?
 *
 * A resposta é ADITIVA por projeto: `false` NUNCA significa "a tela está em
 * dia" — significa apenas "o push não tem nada contra ela". Quem compõe o
 * booleano final de degradação é o ponto de uso, com `||`, junto das três
 * origens que já existem (`exibindoDadoDesatualizado`, `idadeVisao.classe ===
 * "ciclo_perdido"`, `prontidao.degradada` — ver `../components/GradeLeitos.tsx`).
 * Assim é estruturalmente impossível o push APAGAR uma degradação declarada
 * pelo polling, que seria a inversão que ADR-0011 P8 proíbe.
 *
 * Um push que NUNCA se provou vivo não degrada nada: a tela dele nunca
 * dependeu. Um push que se provou vivo e se perdeu degrada — é literalmente
 * "uma grade que perde o feed exibe-se visivelmente degradada" (P6).
 *
 * O QUE MUDOU, E POR QUE (ACH-O3-10 / ACH-O3-11). A guarda de prova de vida era
 * `pulsacoesRecebidas === 0`, e estava sobre o predicado errado — ver a nota de
 * `seProvouVivo`. Duas consequências medidas, ambas fechadas aqui:
 *
 *   1. um push que abriu, recebeu o primeiro quadro do servidor e caiu antes da
 *      primeira pulsação produzia ZERO pixels na tela clínica;
 *   2. na mesma janela, `offline` e `reconnecting` do fio eram MUDOS enquanto
 *      `replaying` (informativo, menos grave) produzia banner — precedência
 *      invertida. O mesmo estado de fio afirmava coisas diferentes conforme já
 *      ter chegado, ou não, uma pulsação.
 *
 * PARADA EXPLÍCITA TAMBÉM É DEGRADAÇÃO. `parado` por `ticket-recusado` ou por
 * `sem-politica-de-reconexao` é definitivo: esta máquina não ressuscita por
 * evento atrasado. A tela deixa de ter push e não volta a ter sem uma nova
 * montagem — `QAS-0023` ("count of degradations with no user-visible
 * representation: must be zero") obriga a declarar. `desmontado` é a única
 * parada excluída: ali não há tela para declarar coisa alguma.
 */
export function pushDegradaATela(estado: EstadoFluxo): boolean {
  // DESMONTAGEM é encerramento DELIBERADO, não perda. `desmontar` só é
  // despachado pela limpeza do efeito de ciclo de vida (`./useFluxoDeEventos.ts`)
  // — quem desligou o push fomos nós, e não há tela para declarar coisa alguma.
  if (estado.motivoDeParada === "desmontado") return false;
  if (estado.lacunaNaoReconciliada) return true;
  if (estado.instrucaoPendente !== null) return true;
  // `degraded` é declaração do SERVIDOR de que a entrega está atrás; vale
  // mesmo antes da primeira pulsação.
  if (estado.estadoConexao === "degraded") return true;
  if (estado.fase === "parado" && estado.motivoDeParada !== null) return true;
  if (!estado.seProvouVivo) return false;
  if (estado.silencioDetectado) return true;
  // ESTADOS INFORMATIVOS DO FIO NÃO ENTRAM AQUI — eles têm representação
  // PRÓPRIA na tela, pela promoção de `../estado/conectividade.ts`
  // (`reproduzindo`, `reconciliado`). Degradá-los aqui os apagaria: `degradado`
  // tem precedência sobre a promoção, e a 5ª família perderia os dois únicos
  // estados que este transporte origina. `QAS-0023` continua satisfeita —
  // eles são visíveis, apenas não como degradação.
  //
  // E agora isso vale em TODA janela (ACH-O3-11). Antes, `replaying` era mudo
  // enquanto nenhuma pulsação tivesse chegado e virava `degradado` depois da
  // primeira: o MESMO estado de fio produzia duas afirmações diferentes na tela.
  if (estado.estadoConexao === "replaying" || estado.estadoConexao === "reconciled") return false;
  return !(estado.fase === "aberto" && estado.estadoConexao === "online");
}

/**
 * Espera antes da próxima reconexão, a partir da política DECLARADA PELO
 * SERVIDOR. Os três números (piso, teto, jitter) vêm do fio; o que esta função
 * faz é a leitura canônica do trio: crescimento exponencial entre piso e teto,
 * com jitter simétrico, e clamp final de volta ao intervalo declarado — nunca
 * mais rápido que o piso do servidor, nunca mais lento que o teto dele.
 *
 * A FORMA do crescimento (dobrar) não está no contrato; ver `EM ABERTO`.
 */
export function calcularEsperaDeReconexao(
  politica: PoliticaReconexao,
  tentativa: number,
  sorteio: number,
): number {
  const expoente = Math.max(0, Math.trunc(tentativa) - 1);
  const base = Math.min(politica.esperaMinimaMs * 2 ** expoente, politica.esperaMaximaMs);
  const fator = 1 + politica.jitter * (sorteio * 2 - 1);
  const comJitter = Math.round(base * fator);
  return Math.min(politica.esperaMaximaMs, Math.max(politica.esperaMinimaMs, comJitter));
}

// ---------------------------------------------------------------------------
// Interpretação de quadros — pura, e deliberadamente cega ao dado clínico
// ---------------------------------------------------------------------------

type Interpretacao =
  | { readonly especie: "dados"; readonly sequencia: number }
  | { readonly especie: "pulsacao"; readonly mensagem: MensagemPulsacao }
  | { readonly especie: "estado-conexao"; readonly mensagem: MensagemEstadoConexao }
  | { readonly especie: "instrucao"; readonly mensagem: MensagemInstrucaoReconciliacao }
  | { readonly especie: "lacuna"; readonly motivo: MotivoDeLacuna };

function objetoDe(texto: string): Record<string, unknown> | null {
  try {
    const valor: unknown = JSON.parse(texto);
    if (typeof valor !== "object" || valor === null || Array.isArray(valor)) return null;
    return valor as Record<string, unknown>;
  } catch {
    return null;
  }
}

function inteiroNaoNegativo(valor: unknown): valor is number {
  return typeof valor === "number" && Number.isInteger(valor) && valor >= 0;
}

function ehEstadoConexao(valor: unknown): valor is EstadoConexao {
  return typeof valor === "string" && (ESTADOS_CONEXAO as readonly string[]).includes(valor);
}

function ehTipoDeDados(nome: string): boolean {
  return (TIPOS_EVENTO_FLUXO as readonly string[]).includes(nome);
}

/**
 * Cadência de pulsação ANUNCIADA no fio. Fail-closed: só um número finito
 * ESTRITAMENTE positivo é cadência. Zero ou negativo armaria um vigia que
 * dispara em laço; `NaN`/infinito armaria um que nunca dispara — e um vigia que
 * nunca dispara é pior que nenhum, porque a tela parece vigiada.
 *
 * O campo é opcional no contrato (`POLITICA_EVOLUCAO_EVENTOS.compativel`):
 * ausente e inválido colapsam no mesmo resultado, `null`, e o cliente volta a
 * aprender a cadência do próprio fio.
 */
function intervaloDePulsacaoDe(valor: unknown): number | null {
  if (typeof valor !== "number" || !Number.isFinite(valor) || valor <= 0) return null;
  return valor;
}

function politicaDe(valor: unknown): PoliticaReconexao | null {
  if (typeof valor !== "object" || valor === null) return null;
  const bruto = valor as Record<string, unknown>;
  const { esperaMinimaMs, esperaMaximaMs, jitter } = bruto;
  if (typeof esperaMinimaMs !== "number" || !Number.isFinite(esperaMinimaMs)) return null;
  if (typeof esperaMaximaMs !== "number" || !Number.isFinite(esperaMaximaMs)) return null;
  if (typeof jitter !== "number" || !Number.isFinite(jitter)) return null;
  return { esperaMinimaMs, esperaMaximaMs, jitter };
}

/**
 * Interpreta um quadro. Campo DESCONHECIDO dentro de mensagem conhecida é
 * ignorado (`POLITICA_EVOLUCAO_EVENTOS.compativel`); TIPO de evento
 * desconhecido vira lacuna observável, nunca silêncio
 * (`POLITICA_EVOLUCAO_EVENTOS.regraConsumidor`).
 */
export function interpretarQuadro(quadro: QuadroRecebido): Interpretacao {
  const corpo = objetoDe(quadro.dados);
  if (corpo === null) return { especie: "lacuna", motivo: "quadro-ilegivel" };

  if (quadro.nomeDoEvento === EVENTO_SSE_PULSACAO) {
    if (!inteiroNaoNegativo(corpo.cursor) || !ehEstadoConexao(corpo.estado)) {
      return { especie: "lacuna", motivo: "quadro-ilegivel" };
    }
    const intervalo = intervaloDePulsacaoDe(corpo.intervaloPulsacaoMs);
    return {
      especie: "pulsacao",
      mensagem: {
        emitidoEm: typeof corpo.emitidoEm === "string" ? corpo.emitidoEm : "",
        estado: corpo.estado,
        cursor: corpo.cursor,
        pendentes: inteiroNaoNegativo(corpo.pendentes) ? corpo.pendentes : 0,
        // Propriedade OMITIDA quando ausente, nunca `undefined` explícito nem 0:
        // `exactOptionalPropertyTypes` e a leitura a jusante distinguem os dois.
        ...(intervalo === null ? {} : { intervaloPulsacaoMs: intervalo }),
      },
    };
  }

  if (quadro.nomeDoEvento === EVENTO_SSE_ESTADO_CONEXAO) {
    if (!inteiroNaoNegativo(corpo.cursor) || !ehEstadoConexao(corpo.estado)) {
      return { especie: "lacuna", motivo: "quadro-ilegivel" };
    }
    const intervalo = intervaloDePulsacaoDe(corpo.intervaloPulsacaoMs);
    const reconexao = politicaDe(corpo.reconexao);
    return {
      especie: "estado-conexao",
      mensagem: {
        estado: corpo.estado,
        descricao: typeof corpo.descricao === "string" ? corpo.descricao : "",
        emitidoEm: typeof corpo.emitidoEm === "string" ? corpo.emitidoEm : "",
        cursor: corpo.cursor,
        ...(intervalo === null ? {} : { intervaloPulsacaoMs: intervalo }),
        ...(reconexao === null ? {} : { reconexao }),
      },
    };
  }

  if (quadro.nomeDoEvento === EVENTO_SSE_INSTRUCAO_RECONCILIACAO) {
    const motivo = corpo.motivo;
    const acao = corpo.acao;
    const reconexao = politicaDe(corpo.reconexao);
    const motivoConhecido =
      typeof motivo === "string" && (MOTIVOS_ENCERRAMENTO as readonly string[]).includes(motivo);
    const acaoConhecida = acao === "reconciliar-por-polling" || acao === "reconectar-do-cursor";
    if (
      !motivoConhecido ||
      !acaoConhecida ||
      reconexao === null ||
      !inteiroNaoNegativo(corpo.cursor)
    ) {
      return { especie: "lacuna", motivo: "quadro-ilegivel" };
    }
    return {
      especie: "instrucao",
      mensagem: {
        motivo: motivo as MensagemInstrucaoReconciliacao["motivo"],
        descricao: typeof corpo.descricao === "string" ? corpo.descricao : "",
        acao,
        caminhoReconciliacao:
          typeof corpo.caminhoReconciliacao === "string" ? corpo.caminhoReconciliacao : "",
        cursor: corpo.cursor,
        cursorMinimoRetomavel: inteiroNaoNegativo(corpo.cursorMinimoRetomavel)
          ? corpo.cursorMinimoRetomavel
          : null,
        reconexao,
        emitidoEm: typeof corpo.emitidoEm === "string" ? corpo.emitidoEm : "",
      },
    };
  }

  if (ehTipoDeDados(quadro.nomeDoEvento)) {
    // NOTE: `corpo.dados` (a carga clínica) NÃO é lido. O cursor e a
    // identidade do quadro são tudo de que este cliente precisa — ADR-0011 P7.
    if (!inteiroNaoNegativo(corpo.sequencia)) {
      return { especie: "lacuna", motivo: "quadro-ilegivel" };
    }
    if (corpo.tipo !== quadro.nomeDoEvento) {
      return { especie: "lacuna", motivo: "quadro-ilegivel" };
    }
    if (quadro.id !== null && Number(quadro.id) !== corpo.sequencia) {
      return { especie: "lacuna", motivo: "id-divergente-da-sequencia" };
    }
    return { especie: "dados", sequencia: corpo.sequencia };
  }

  return { especie: "lacuna", motivo: "tipo-de-evento-desconhecido" };
}

// ---------------------------------------------------------------------------
// Redutor
// ---------------------------------------------------------------------------

interface Parcial {
  estado: EstadoFluxo;
  efeitos: Efeito[];
}

/** Pede reconciliação por polling, coalescendo se já houver uma em voo. */
function pedirReconciliacao(parcial: Parcial): Parcial {
  if (parcial.estado.reconciliacaoEmVoo) {
    return { estado: { ...parcial.estado, releituraPendente: true }, efeitos: parcial.efeitos };
  }
  return {
    estado: { ...parcial.estado, reconciliacaoEmVoo: true, releituraPendente: false },
    efeitos: [...parcial.efeitos, { tipo: "reconciliar-por-polling" }],
  };
}

/** Registra uma lacuna. Nunca silenciosa: sempre seguida de polling. */
function registrarLacuna(parcial: Parcial, motivo: MotivoDeLacuna): Parcial {
  return pedirReconciliacao({
    estado: {
      ...parcial.estado,
      lacunas: parcial.estado.lacunas + 1,
      ultimaLacuna: motivo,
      lacunaNaoReconciliada: true,
    },
    efeitos: parcial.efeitos,
  });
}

/**
 * Encerra o transporte corrente e decide o que vem depois: reconexão segundo a
 * política DO SERVIDOR, ou parada explícita quando não há política alguma.
 */
function encerrarTransporte(parcial: Parcial, sorteio: number): Parcial {
  const efeitos: Efeito[] = [
    ...parcial.efeitos,
    { tipo: "cancelar-vigia-de-silencio" },
    { tipo: "fechar-fluxo" },
  ];
  const politica = parcial.estado.politicaReconexao;
  if (politica === null) {
    return {
      estado: { ...parcial.estado, fase: "parado", motivoDeParada: "sem-politica-de-reconexao" },
      efeitos,
    };
  }
  const tentativa = parcial.estado.tentativasDeReconexao + 1;
  return {
    estado: { ...parcial.estado, fase: "aguardando-reconexao", tentativasDeReconexao: tentativa },
    efeitos: [
      ...efeitos,
      {
        tipo: "agendar-reconexao",
        esperaMs: calcularEsperaDeReconexao(politica, tentativa, sorteio),
      },
    ],
  };
}

/** Marca atividade no fio e rearma o vigia quando a cadência já é conhecida. */
function registrarAtividade(parcial: Parcial, agoraMs: number): Parcial {
  const cadencia = parcial.estado.cadenciaDePulsacaoMs;
  // Atividade no fio é prova de vida — seja a abertura, seja o primeiro quadro
  // escrito pelo servidor. Ver `seProvouVivo` (ACH-O3-10).
  const estado = { ...parcial.estado, instanteDaUltimaAtividadeMs: agoraMs, seProvouVivo: true };
  if (cadencia === null) return { estado, efeitos: parcial.efeitos };
  return {
    estado,
    efeitos: [
      ...parcial.efeitos,
      {
        tipo: "armar-vigia-de-silencio",
        prazoMs: cadencia * CICLOS_DE_PULSACAO_PARA_DECLARAR_SILENCIO,
      },
    ],
  };
}

/**
 * Confronta o cursor que o SERVIDOR declara ter entregue com o que este
 * cliente processou. Servidor à frente significa que algo foi escrito no fio e
 * não chegou à máquina — inclusive o caso que o `EventSource` nativo não
 * consegue observar sozinho: um `event:` NOMEADO que o cliente não registrou.
 * A lacuna vira explícita e o cursor do servidor é adotado; a recuperação é
 * polling (ADR-0011 P4/P8).
 */
function confrontarCursorDoServidor(parcial: Parcial, cursorDoServidor: number): Parcial {
  const local = parcial.estado.cursor;
  if (local !== null && cursorDoServidor <= local) return parcial;
  if (local === null && cursorDoServidor === 0) return parcial;
  return registrarLacuna(
    { estado: { ...parcial.estado, cursor: cursorDoServidor }, efeitos: parcial.efeitos },
    "cursor-do-servidor-a-frente",
  );
}

/**
 * Adota o que o SERVIDOR anunciou no quadro — cadência de pulsação e política
 * de reconexão. As duas fecham janelas cegas nomeadas pelo contrato:
 *
 *   - sem cadência, não há vigia armado entre a abertura e a primeira pulsação,
 *     e uma conexão meio-aberta nessa janela fica indistinguível de uma
 *     saudável (HAZ-0025/SAF-0025). Um `error` de transporte é o único sinal —
 *     e é exatamente o que uma conexão meio-aberta não emite;
 *   - sem política, a primeira queda PARA o push com `sem-politica-de-reconexao`,
 *     porque um cliente conforme não inventa backoff (ADR-0011 P5).
 *
 * ANUNCIADO TEM PRECEDÊNCIA sobre aprendido: o servidor conhece a própria
 * cadência, o cliente apenas a estima medindo o fio. O caminho de aprendizado
 * CONTINUA vivo para quando o campo não vier — ele é opcional por contrato.
 *
 * O QUE ESTA FUNÇÃO NÃO FAZ: apagar. Quadro sem anúncio preserva o que já
 * valia; ausência nunca é revogação.
 */
function adotarAnuncioDoServidor(
  parcial: Parcial,
  anuncio: { readonly intervaloPulsacaoMs?: number; readonly reconexao?: PoliticaReconexao },
): Parcial {
  const cadencia = anuncio.intervaloPulsacaoMs ?? null;
  const politica = anuncio.reconexao ?? null;
  if (cadencia === null && politica === null) return parcial;

  const estado: EstadoFluxo = {
    ...parcial.estado,
    ...(cadencia === null ? {} : { cadenciaDePulsacaoMs: cadencia }),
    ...(politica === null ? {} : { politicaReconexao: politica }),
  };
  if (cadencia === null) return { estado, efeitos: parcial.efeitos };

  // O rearme feito por `registrarAtividade` usou a cadência ANTERIOR (possivelmente
  // nula). Ele é substituído pelo da cadência anunciada — dois vigias armados no
  // mesmo passo produziriam um disparo prematuro de silêncio.
  return {
    estado,
    efeitos: [
      ...parcial.efeitos.filter((e) => e.tipo !== "armar-vigia-de-silencio"),
      {
        tipo: "armar-vigia-de-silencio",
        prazoMs: cadencia * CICLOS_DE_PULSACAO_PARA_DECLARAR_SILENCIO,
      },
    ],
  };
}

function aplicarEstadoDeConexao(parcial: Parcial, novo: EstadoConexao): Parcial {
  const estado = { ...parcial.estado, estadoConexao: novo };
  // Fim do catch-up: é aqui que a rajada de replay vira UMA releitura, e não
  // uma por evento (anti-tempestade; ADR-0011 P5 mitiga tempestade no fio, e
  // esta é a contraparte no cliente).
  if (novo === "online" && estado.releituraPendente) {
    return pedirReconciliacao({ estado, efeitos: parcial.efeitos });
  }
  return { estado, efeitos: parcial.efeitos };
}

function reduzirQuadro(estado: EstadoFluxo, quadro: QuadroRecebido, agoraMs: number): Transicao {
  // Quadro fora da fase aberta é quadro tardio (o fluxo já foi mandado fechar).
  if (estado.fase !== "aberto") return { estado, efeitos: [] };

  let parcial = registrarAtividade({ estado, efeitos: [] }, agoraMs);
  const interpretacao = interpretarQuadro(quadro);

  switch (interpretacao.especie) {
    case "lacuna":
      parcial = registrarLacuna(parcial, interpretacao.motivo);
      return { estado: parcial.estado, efeitos: parcial.efeitos };

    case "dados": {
      const cursorLocal = parcial.estado.cursor;
      if (cursorLocal !== null && interpretacao.sequencia <= cursorLocal) {
        // Replay duplicado / fora de ordem: idempotente. O cursor NUNCA
        // retrocede e nenhuma releitura extra é pedida.
        return {
          estado: {
            ...parcial.estado,
            duplicatasIgnoradas: parcial.estado.duplicatasIgnoradas + 1,
          },
          efeitos: parcial.efeitos,
        };
      }
      const comCursor: Parcial = {
        estado: {
          ...parcial.estado,
          cursor: interpretacao.sequencia,
          sinalDeReleitura: parcial.estado.sinalDeReleitura + 1,
          releituraPendente: true,
        },
        efeitos: parcial.efeitos,
      };
      // Durante `replaying` a releitura fica PENDENTE de propósito; ela sai
      // uma única vez quando o servidor declarar `online`.
      if (comCursor.estado.estadoConexao !== "online") return comCursor;
      const pedido = pedirReconciliacao(comCursor);
      return { estado: pedido.estado, efeitos: pedido.efeitos };
    }

    case "pulsacao": {
      const referencia =
        parcial.estado.instanteDaUltimaPulsacaoMs ?? parcial.estado.instanteDeAberturaMs;
      const medida = referencia === null ? null : agoraMs - referencia;
      const aprendida =
        medida !== null && medida > 0 ? medida : parcial.estado.cadenciaDePulsacaoMs;
      // ANUNCIADO > APRENDIDO. O servidor sabe a própria cadência; o cliente só
      // a estima medindo o fio, e essa medida carrega latência de rede e atraso
      // de agendador. O aprendizado permanece como caminho para o servidor que
      // não anuncia (campo opcional por contrato).
      const cadencia = interpretacao.mensagem.intervaloPulsacaoMs ?? aprendida;
      parcial = {
        estado: {
          ...parcial.estado,
          pulsacoesRecebidas: parcial.estado.pulsacoesRecebidas + 1,
          instanteDaUltimaPulsacaoMs: agoraMs,
          cadenciaDePulsacaoMs: cadencia,
          silencioDetectado: false,
        },
        // O vigia é rearmado com a cadência RECÉM-aprendida; o rearme feito por
        // `registrarAtividade` (que usou a cadência anterior, possivelmente
        // nula) é substituído.
        efeitos: parcial.efeitos.filter((e) => e.tipo !== "armar-vigia-de-silencio"),
      };
      if (cadencia !== null) {
        parcial.efeitos.push({
          tipo: "armar-vigia-de-silencio",
          prazoMs: cadencia * CICLOS_DE_PULSACAO_PARA_DECLARAR_SILENCIO,
        });
      }
      parcial = aplicarEstadoDeConexao(parcial, interpretacao.mensagem.estado);
      parcial = confrontarCursorDoServidor(parcial, interpretacao.mensagem.cursor);
      return { estado: parcial.estado, efeitos: parcial.efeitos };
    }

    case "estado-conexao": {
      // Os anúncios são adotados ANTES de qualquer outra coisa: é o primeiro
      // quadro da assinatura, e é dele que sai a referência para armar o vigia
      // e para reconectar na primeira queda.
      parcial = adotarAnuncioDoServidor(parcial, interpretacao.mensagem);
      parcial = aplicarEstadoDeConexao(parcial, interpretacao.mensagem.estado);
      parcial = confrontarCursorDoServidor(parcial, interpretacao.mensagem.cursor);
      return { estado: parcial.estado, efeitos: parcial.efeitos };
    }

    case "instrucao": {
      const instrucao = interpretacao.mensagem;
      parcial = {
        estado: {
          ...parcial.estado,
          fase: "reconciliando",
          estadoConexao: "offline",
          instrucaoPendente: instrucao,
          politicaReconexao: instrucao.reconexao,
        },
        efeitos: [
          ...parcial.efeitos.filter((e) => e.tipo !== "armar-vigia-de-silencio"),
          { tipo: "cancelar-vigia-de-silencio" },
          { tipo: "fechar-fluxo" },
        ],
      };

      if (instrucao.motivo === "cursor-irretomavel") {
        // A lacuna é explícita e o cliente retoma do MENOR ponto que o
        // servidor declara conseguir servir (ADR-0011 P4).
        const retomada = instrucao.cursorMinimoRetomavel ?? instrucao.cursor;
        parcial = registrarLacuna(
          { estado: { ...parcial.estado, cursor: retomada }, efeitos: parcial.efeitos },
          "cursor-irretomavel",
        );
        return { estado: parcial.estado, efeitos: parcial.efeitos };
      }

      if (instrucao.acao === "reconectar-do-cursor") {
        // A ação DO FIO é a que vale (passo 5 do contrato de cliente): aqui o
        // servidor diz que não há lacuna, apenas encerramento operacional.
        const encerrado = encerrarTransporte(
          { estado: { ...parcial.estado, instrucaoPendente: null }, efeitos: parcial.efeitos },
          0.5,
        );
        return { estado: encerrado.estado, efeitos: encerrado.efeitos };
      }

      const pedido = pedirReconciliacao(parcial);
      return { estado: pedido.estado, efeitos: pedido.efeitos };
    }

    default:
      return { estado: parcial.estado, efeitos: parcial.efeitos };
  }
}

export function reduzirFluxo(estado: EstadoFluxo, evento: EventoDaMaquina): Transicao {
  // Máquina parada não ressuscita por evento atrasado. Quem quiser push de
  // novo monta outra (o hook cria uma por montagem).
  if (estado.fase === "parado") return { estado, efeitos: [] };

  switch (evento.tipo) {
    case "montar":
    case "reconectar-agora":
      return {
        estado: { ...estado, fase: "obtendo-ticket", estadoConexao: "reconnecting" },
        efeitos: [{ tipo: "emitir-ticket" }],
      };

    case "ticket-emitido":
      return {
        estado: { ...estado, fase: "abrindo" },
        efeitos: [{ tipo: "abrir-fluxo", cursor: estado.cursor }],
      };

    case "ticket-recusado":
      // Recusa é decisão do servidor sobre autorização (ADR-0011 P3). Insistir
      // seria martelar um 401; o push para e o polling segue sendo a verdade.
      return {
        estado: {
          ...estado,
          fase: "parado",
          estadoConexao: "offline",
          motivoDeParada: "ticket-recusado",
        },
        efeitos: [{ tipo: "cancelar-vigia-de-silencio" }],
      };

    case "fluxo-aberto": {
      const aberto: EstadoFluxo = {
        ...estado,
        fase: "aberto",
        estadoConexao: "reconnecting",
        // A PROVA DE VIDA É AQUI: a partir deste instante a tela depende do
        // push, e uma perda dele é obrigada a aparecer. Ver `seProvouVivo`.
        seProvouVivo: true,
        tentativasDeReconexao: 0,
        instanteDeAberturaMs: evento.agoraMs,
        instanteDaUltimaPulsacaoMs: null,
        instanteDaUltimaAtividadeMs: evento.agoraMs,
        silencioDetectado: false,
      };
      const parcial = registrarAtividade({ estado: aberto, efeitos: [] }, evento.agoraMs);
      return { estado: parcial.estado, efeitos: parcial.efeitos };
    }

    case "quadro":
      return reduzirQuadro(estado, evento.quadro, evento.agoraMs);

    case "falha-de-transporte": {
      const comDuvida = pedirReconciliacao({
        estado: { ...estado, estadoConexao: "offline" },
        efeitos: [],
      });
      const encerrado = encerrarTransporte(comDuvida, evento.sorteio);
      return { estado: encerrado.estado, efeitos: encerrado.efeitos };
    }

    case "silencio-detectado": {
      // Ausência de pulsação dentro do intervalo aprendido do fio: a conexão
      // morreu, ainda que o socket pareça vivo. A tela DEVE degradar.
      const comDuvida = pedirReconciliacao({
        estado: { ...estado, estadoConexao: "offline", silencioDetectado: true },
        efeitos: [],
      });
      const encerrado = encerrarTransporte(comDuvida, evento.sorteio);
      return { estado: encerrado.estado, efeitos: encerrado.efeitos };
    }

    case "reconciliacao-concluida": {
      /*
        SEM FATO DE LEITURA NÃO HÁ RECONCILIAÇÃO (ACH-O3-9).

        O tipo já exige `obtidoEm` — esta guarda é a defesa de runtime contra
        chamador em JavaScript e contra fato vazio. O efeito de recusar é
        deliberadamente conservador: a busca em voo é liberada (para que a
        próxima possa sair), mas a LACUNA continua aberta e a instrução continua
        pendente. A tela segue declarando degradação, que é o estado verdadeiro.
      */
      if (typeof evento.obtidoEm !== "string" || evento.obtidoEm === "") {
        return { estado: { ...estado, reconciliacaoEmVoo: false }, efeitos: [] };
      }
      const haviaDuvida = estado.lacunaNaoReconciliada || estado.instrucaoPendente !== null;
      const limpo: EstadoFluxo = {
        ...estado,
        reconciliacaoEmVoo: false,
        lacunaNaoReconciliada: false,
        instrucaoPendente: null,
        // `reconciled` só é originado aqui, e só quando havia de fato algo a
        // reconciliar — é o único ponto do cliente em que ele pode afirmar
        // "estou alinhado à projeção autoritativa" (ADR-0011 P8).
        estadoConexao: haviaDuvida ? "reconciled" : estado.estadoConexao,
      };

      if (estado.fase === "reconciliando") {
        const encerrado = encerrarTransporte({ estado: limpo, efeitos: [] }, evento.sorteio);
        return { estado: encerrado.estado, efeitos: encerrado.efeitos };
      }
      if (limpo.releituraPendente) {
        const pedido = pedirReconciliacao({ estado: limpo, efeitos: [] });
        return { estado: pedido.estado, efeitos: pedido.efeitos };
      }
      return { estado: limpo, efeitos: [] };
    }

    case "reconciliacao-falhou":
      // A lacuna CONTINUA aberta e a instrução continua pendente: a tela segue
      // declarando degradação. O polling periódico de `useRecursoRemoto` é
      // quem tenta de novo — este módulo não martela.
      return { estado: { ...estado, reconciliacaoEmVoo: false }, efeitos: [] };

    case "desmontar":
      return {
        estado: {
          ...estado,
          fase: "parado",
          estadoConexao: "offline",
          motivoDeParada: "desmontado",
        },
        efeitos: [{ tipo: "cancelar-vigia-de-silencio" }, { tipo: "fechar-fluxo" }],
      };

    default:
      return { estado, efeitos: [] };
  }
}
