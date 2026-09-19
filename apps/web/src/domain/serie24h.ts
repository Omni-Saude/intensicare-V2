/**
 * apps/web/src/domain/serie24h.ts
 *
 * Recorte e qualificação de APRESENTAÇÃO da série de avaliações numa janela
 * de 24 horas (MAJ-4 / WF-02). PURO: sem React, sem I/O, sem relógio
 * próprio — o instante "agora" é injetado para que o recorte seja
 * determinístico em teste.
 *
 * A FRONTEIRA CLÍNICA, dita às claras. Este módulo recorta, conta e
 * qualifica pontos para exibição — nada mais. Ele NÃO interpola, NÃO
 * calcula delta ou slope, NÃO nomeia direção ("melhorando"/"piorando") e
 * NÃO preenche lacuna: entre uma avaliação e outra não existe ponto, e
 * fabricar continuidade é a falsa-tranquilidade (HM-03) que a intenção do
 * WF-02 proíbe — alargar a janela nunca fabrica tranquilidade, e janela
 * menor nunca transforma "não sei" em "não há". A interpretação da série é
 * do clínico; texto de direção viria do backend ou não vem (ADR-0011 P7,
 * ADR-0021 F3).
 *
 * A JANELA DE 24h É PREMISSA DE APRESENTAÇÃO (reversível, GDEC-0015/0017),
 * não limiar clínico ratificado: nenhum VAL-* a sancionou. Ela existe
 * porque é o horizonte que a intenção do WF-02 nomeia ("24h trend"), e é
 * o primeiro número a mudar quando autoridade clínica decidir outro.
 */
import type { AvaliacaoPaciente } from "./clinico.js";

/** Janela de tendência exibida — premissa de apresentação (ver topo). */
export const JANELA_TENDENCIA_MS = 24 * 60 * 60 * 1000;

/** Ponto da série já qualificado para exibição. */
export interface PontoSerie {
  readonly avaliacao: AvaliacaoPaciente;
  /**
   * `true` quando o instante da avaliação cai DENTRO da janela exibida.
   * Um ponto sem instante interpretável NUNCA é descartado — ele entra com
   * `false` e a tela o exibe sem afirmar janela nenhuma. Perdê-lo em
   * silêncio seria apagar uma avaliação que existiu.
   */
  readonly dentroDaJanela: boolean;
}

export interface SerieRecortada {
  /**
   * Pontos na ordem em que o backend os entregou (mais recente primeiro),
   * incluindo os de instante desconhecido — a ordem é do PRODUTOR e é
   * preservada, nunca refeita pelo cliente.
   */
  readonly pontos: PontoSerie[];
  /** Quantas avaliações ficaram FORA da janela. Contadas, nunca escondidas. */
  readonly foraDaJanela: number;
}

/**
 * Recorta a série para a janela de 24h terminando em `agoraMs`.
 *
 * `serie === null` (histórico indisponível) e `serie === undefined` (esta
 * origem não consultou o histórico) NÃO chegam aqui: essa decisão é de
 * quem apresenta, porque é afirmação de tela. A função só sabe recortar
 * uma lista existente.
 */
export function recortarSerie24h(serie: AvaliacaoPaciente[], agoraMs: number): SerieRecortada {
  const limite = agoraMs - JANELA_TENDENCIA_MS;
  const pontos: PontoSerie[] = [];
  let foraDaJanela = 0;
  for (const avaliacao of serie) {
    const instante = avaliacao.calculadoEm === null ? null : Date.parse(avaliacao.calculadoEm);
    if (instante === null || Number.isNaN(instante)) {
      pontos.push({ avaliacao, dentroDaJanela: false });
      continue;
    }
    if (instante < limite) {
      foraDaJanela += 1;
      continue;
    }
    pontos.push({ avaliacao, dentroDaJanela: true });
  }
  return { pontos, foraDaJanela };
}

/**
 * O que a série PODE afirmar — e o que ela deve confessar. Um valor por
 * desfecho de tela; nenhum deles é um estado clínico novo (todos derivam
 * da PRESENÇA ou não de dados que o backend emitiu).
 */
export type SituacaoSerie =
  /** Esta origem não consultou o histórico: a tela não afirma nada. */
  | "sem_serie"
  /** A consulta foi feita e falhou: indisponibilidade DECLARADA. */
  | "indisponivel"
  /** Consultada e vazia na janela: fato declarável, nunca linha plana. */
  | "vazia"
  /** Um único ponto na janela: NUNCA vira "série" visual. */
  | "ponto_unico"
  /** ≥2 pontos na janela: série exibível, com as lacunas que existem. */
  | "serie";

/**
 * Qualifica a série para o desenho honesto da tela (unidade 5 do ORQ-6):
 * com menos de dois pontos na janela, o fato é RENDERIZADO — "uma avaliação
 * nas últimas 24 horas" — e nunca uma linha que sugeriria estabilidade.
 * Lição de §6.2/ACH-O3-12: o silêncio vence a normalidade fabricada.
 */
export function situacaoDaSerie(
  serie: AvaliacaoPaciente[] | null | undefined,
  recorte: SerieRecortada,
): SituacaoSerie {
  if (serie === null) return "indisponivel";
  if (serie === undefined) return "sem_serie";
  if (recorte.pontos.length === 0) return "vazia";
  if (recorte.pontos.length === 1) return "ponto_unico";
  return "serie";
}

/**
 * Chaves de renderização DERIVADAS DO CONTEÚDO de cada ponto — nunca do
 * índice. Duas razões, e a segunda é clínica: (1) a regra do repositório
 * reprova índice como key; (2) uma key por índice sobre uma lista
 * reordenável faria o React reutilizar a linha errada na tela, e dois
 * pontos de conteúdo idêntico colidiriam numa key por conteúdo cru — o
 * sufixo ordinal resolve: pontos DISTINTOS do histórico têm sempre keys
 * DISTINTAS, e nenhum deles pode sumir da tela por colisão de key.
 */
export function chavesDePontos(pontos: PontoSerie[]): string[] {
  const vistas = new Map<string, number>();
  return pontos.map((ponto) => {
    const base = JSON.stringify([
      ponto.avaliacao.calculadoEm,
      ponto.avaliacao.estadoAvaliacao,
      ponto.avaliacao.news2Total,
      ponto.avaliacao.bandaRisco,
    ]);
    const ordem = vistas.get(base) ?? 0;
    vistas.set(base, ordem + 1);
    return ordem === 0 ? base : `${base}#${ordem}`;
  });
}
