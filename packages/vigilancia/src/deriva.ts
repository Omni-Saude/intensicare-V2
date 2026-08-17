/**
 * Detecção de DERIVA: mudança na distribuição dos insumos e na taxa de status
 * não-computável ao longo do tempo — o traço observável de uma fonte que está
 * degradando.
 *
 * Por que isto existe: `clinical-kpi-review.md` §2.2.3 ("denominator-shrink
 * surveillance") registra que a queda da fração válida é, ao mesmo tempo, o
 * sinal de falha de pipeline de dados E o sinal de manipulação de denominador
 * ("avaliar só o tempo-paciente fácil"). O mesmo par aparece em
 * `success-and-harm-metrics.md` §4: SM-05 pode ser inflado coagindo dado
 * incompleto para `valid`, e SM-03 precisão pode ser inflada avaliando menos.
 * Nenhum dos dois é visível olhando só a métrica de cabeçalho — é visível
 * olhando a DISTRIBUIÇÃO ao longo do tempo. É isso que este módulo mede.
 *
 * Três disciplinas duras:
 * 1. **Nenhum limiar é inventado.** O limiar entra por parâmetro e carrega no
 *    tipo a marca de não-ratificado. Este módulo mede magnitude; quem decide
 *    o que é "muito" é `AUTH-CLINSAFETY` (UNASSIGNED).
 * 2. **Amostra pequena nunca vira "sem mudança".** Abaixo do n mínimo a
 *    classificação é `amostra_insuficiente` — o anti-padrão KPI-PPV-01(c)
 *    ("assume-OK-below-n", metas "atingidas" com menos de 10 resoluções) é
 *    nomeado no repositório como padrão legado de parada e não se repete aqui.
 * 3. **Categoria desconhecida não é descartada.** Um conceito, unidade ou
 *    estado que aparece só em uma das janelas entra na distância como
 *    categoria de massa zero do outro lado — que é exatamente o sinal de
 *    "a fonte começou (ou parou) de mandar isto".
 */
import {
  type ContagemPorChave,
  contarPorChave,
  dentroDaJanela,
  type EstadoDeAvaliacao,
  estadoEhComputavel,
  type InstanteDeclarado,
  type JanelaDeVigilancia,
  MARCACAO_DE_INSTRUMENTACAO,
  type MarcacaoDeInstrumentacao,
  normalizarEstado,
  type PoliticaDeParcial,
} from "./tipos.js";

// ---------------------------------------------------------------------------
// Entradas observadas
// ---------------------------------------------------------------------------

export interface ObservacaoObservada {
  readonly observacaoId: string;
  readonly encontroId: string;
  readonly conceito: string;
  /** Sinal de qualidade da fonte, verbatim (`valid|warning|quarantined|unknown`). */
  readonly qualidade: string;
  /** Unidade canônica, ou `null` quando a origem não canonizou. */
  readonly unidadeCanonica: string | null;
  /** Tempo clínico efetivo — ausente declarado é um sinal de deriva por si só. */
  readonly tempoClinico: InstanteDeclarado;
  /** Instante usado para janelar a observação (recebimento ou tempo clínico). */
  readonly instanteDeJanela: InstanteDeclarado;
}

export interface AvaliacaoParaDeriva {
  readonly avaliacaoId: string;
  readonly instante: InstanteDeclarado;
  readonly estadoBruto: string;
}

// ---------------------------------------------------------------------------
// Perfis de janela
// ---------------------------------------------------------------------------

export interface PerfilDeInsumos {
  readonly rotulo: string;
  readonly janela: JanelaDeVigilancia;
  readonly total: number;
  readonly porConceito: readonly ContagemPorChave[];
  readonly porQualidade: readonly ContagemPorChave[];
  readonly porUnidadeCanonica: readonly ContagemPorChave[];
  /** Observações sem tempo clínico declarado — nunca imputado (DOM-0009). */
  readonly semTempoClinico: number;
}

export interface PerfilDeStatus {
  readonly rotulo: string;
  readonly janela: JanelaDeVigilancia;
  readonly total: number;
  readonly porEstado: readonly ContagemPorChave[];
  readonly computaveis: number;
  readonly naoComputaveis: number;
  /** `null` quando não há avaliação nenhuma — nunca 0, nunca 1. */
  readonly taxaNaoComputavel: number | null;
}

/** Rótulo obrigatório do balde de unidade canônica ausente. */
export const UNIDADE_CANONICA_AUSENTE = "unidade-canonica-ausente" as const;

export function perfilarInsumos(
  rotulo: string,
  janela: JanelaDeVigilancia,
  observacoes: readonly ObservacaoObservada[],
): PerfilDeInsumos {
  const naJanela = observacoes.filter((o) => dentroDaJanela(o.instanteDeJanela, janela));
  return {
    rotulo,
    janela,
    total: naJanela.length,
    porConceito: contarPorChave(naJanela.map((o) => o.conceito)),
    porQualidade: contarPorChave(naJanela.map((o) => o.qualidade)),
    porUnidadeCanonica: contarPorChave(
      naJanela.map((o) => o.unidadeCanonica ?? UNIDADE_CANONICA_AUSENTE),
    ),
    semTempoClinico: naJanela.filter((o) => o.tempoClinico.tipo !== "presente").length,
  };
}

export function perfilarStatus(
  rotulo: string,
  janela: JanelaDeVigilancia,
  avaliacoes: readonly AvaliacaoParaDeriva[],
  politica: PoliticaDeParcial,
): PerfilDeStatus {
  const naJanela = avaliacoes.filter((a) => dentroDaJanela(a.instante, janela));
  const estados: EstadoDeAvaliacao[] = naJanela.map((a) => normalizarEstado(a.estadoBruto));
  const computaveis = estados.filter((estado) => estadoEhComputavel(estado, politica)).length;
  const total = estados.length;
  return {
    rotulo,
    janela,
    total,
    porEstado: contarPorChave(estados),
    computaveis,
    naoComputaveis: total - computaveis,
    taxaNaoComputavel: total === 0 ? null : (total - computaveis) / total,
  };
}

// ---------------------------------------------------------------------------
// Limiar e sinais
// ---------------------------------------------------------------------------

/**
 * Limiar de deriva. A `proveniencia` é obrigatória e literal para que nenhum
 * chamador consiga passar um número sem escrever, no próprio código, que ele
 * não é um limiar clínico ratificado.
 */
export interface LimiarDeDeriva {
  readonly valor: number;
  readonly proveniencia: "limiar-de-instrumentacao-nao-ratificado-AUTH-CLINSAFETY";
  /** n mínimo por janela; abaixo dele nada é classificado (nem como "sem mudança"). */
  readonly nMinimo: number;
}

export function limiarDeInstrumentacao(valor: number, nMinimo: number): LimiarDeDeriva {
  if (!(valor >= 0 && valor <= 1)) {
    throw new RangeError(`limiar de deriva fora de [0, 1]: ${valor}`);
  }
  if (!Number.isInteger(nMinimo) || nMinimo < 1) {
    throw new RangeError(`n mínimo deve ser inteiro >= 1: ${nMinimo}`);
  }
  return {
    valor,
    proveniencia: "limiar-de-instrumentacao-nao-ratificado-AUTH-CLINSAFETY",
    nMinimo,
  };
}

export type ClassificacaoDeSinal =
  | "amostra_insuficiente"
  | "sem_mudanca_acima_do_limiar"
  | "mudanca_registrada";

export interface SinalDeDeriva {
  readonly id: string;
  readonly dimensao: string;
  /** Magnitude em [0, 1] — distância de variação total ou variação de proporção. */
  readonly magnitude: number;
  readonly classificacao: ClassificacaoDeSinal;
  readonly limiar: LimiarDeDeriva;
  readonly nReferencia: number;
  readonly nAtual: number;
  /** Categorias que mais contribuíram para a distância, maior contribuição primeiro. */
  readonly maioresContribuicoes: readonly {
    readonly chave: string;
    readonly proporcaoReferencia: number;
    readonly proporcaoAtual: number;
  }[];
  readonly interpretacao: string;
}

export interface RelatorioDeDeriva {
  readonly marcacao: MarcacaoDeInstrumentacao;
  readonly rotuloReferencia: string;
  readonly rotuloAtual: string;
  readonly sinais: readonly SinalDeDeriva[];
  /** Sinais com `mudanca_registrada`, na ordem em que aparecem em `sinais`. */
  readonly sinaisComMudanca: readonly string[];
  /**
   * Este relatório NÃO conclui que a fonte degradou: ele registra magnitudes
   * medidas contra um limiar declaradamente não ratificado. A conclusão é ato
   * humano nomeado.
   */
  readonly nota: string;
}

// ---------------------------------------------------------------------------
// Distância entre distribuições
// ---------------------------------------------------------------------------

interface Distribuicao {
  readonly total: number;
  readonly proporcoes: ReadonlyMap<string, number>;
}

function distribuir(contagens: readonly ContagemPorChave[]): Distribuicao {
  const total = contagens.reduce((soma, c) => soma + c.contagem, 0);
  const proporcoes = new Map<string, number>();
  for (const c of contagens) {
    proporcoes.set(c.chave, total === 0 ? 0 : c.contagem / total);
  }
  return { total, proporcoes };
}

/**
 * Distância de variação total entre duas distribuições categóricas, em
 * [0, 1]: metade da soma dos módulos das diferenças de proporção sobre a
 * UNIÃO das categorias. Categoria presente em só um dos lados entra com
 * massa zero do outro — é assim que "a fonte parou de mandar este conceito"
 * vira sinal em vez de sumir.
 */
export function distanciaDeVariacaoTotal(
  referencia: readonly ContagemPorChave[],
  atual: readonly ContagemPorChave[],
): number {
  const a = distribuir(referencia);
  const b = distribuir(atual);
  if (a.total === 0 || b.total === 0) return 0;
  const chaves = new Set<string>([...a.proporcoes.keys(), ...b.proporcoes.keys()]);
  let soma = 0;
  for (const chave of chaves) {
    soma += Math.abs((a.proporcoes.get(chave) ?? 0) - (b.proporcoes.get(chave) ?? 0));
  }
  return soma / 2;
}

function contribuicoes(
  referencia: readonly ContagemPorChave[],
  atual: readonly ContagemPorChave[],
): SinalDeDeriva["maioresContribuicoes"] {
  const a = distribuir(referencia);
  const b = distribuir(atual);
  const chaves = [...new Set<string>([...a.proporcoes.keys(), ...b.proporcoes.keys()])];
  return chaves
    .map((chave) => ({
      chave,
      proporcaoReferencia: a.proporcoes.get(chave) ?? 0,
      proporcaoAtual: b.proporcoes.get(chave) ?? 0,
    }))
    .filter((c) => Math.abs(c.proporcaoAtual - c.proporcaoReferencia) > 0)
    .sort((x, y) => {
      const dx = Math.abs(x.proporcaoAtual - x.proporcaoReferencia);
      const dy = Math.abs(y.proporcaoAtual - y.proporcaoReferencia);
      if (dy !== dx) return dy - dx;
      return x.chave < y.chave ? -1 : 1;
    });
}

function classificar(
  magnitude: number,
  nReferencia: number,
  nAtual: number,
  limiar: LimiarDeDeriva,
): ClassificacaoDeSinal {
  if (nReferencia < limiar.nMinimo || nAtual < limiar.nMinimo) return "amostra_insuficiente";
  return magnitude > limiar.valor ? "mudanca_registrada" : "sem_mudanca_acima_do_limiar";
}

function sinalDeDistribuicao(entrada: {
  readonly id: string;
  readonly dimensao: string;
  readonly referencia: readonly ContagemPorChave[];
  readonly atual: readonly ContagemPorChave[];
  readonly nReferencia: number;
  readonly nAtual: number;
  readonly limiar: LimiarDeDeriva;
  readonly interpretacao: string;
}): SinalDeDeriva {
  const magnitude = distanciaDeVariacaoTotal(entrada.referencia, entrada.atual);
  return {
    id: entrada.id,
    dimensao: entrada.dimensao,
    magnitude,
    classificacao: classificar(magnitude, entrada.nReferencia, entrada.nAtual, entrada.limiar),
    limiar: entrada.limiar,
    nReferencia: entrada.nReferencia,
    nAtual: entrada.nAtual,
    maioresContribuicoes: contribuicoes(entrada.referencia, entrada.atual).slice(0, 5),
    interpretacao: entrada.interpretacao,
  };
}

function sinalDeProporcao(entrada: {
  readonly id: string;
  readonly dimensao: string;
  readonly proporcaoReferencia: number | null;
  readonly proporcaoAtual: number | null;
  readonly nReferencia: number;
  readonly nAtual: number;
  readonly limiar: LimiarDeDeriva;
  readonly interpretacao: string;
}): SinalDeDeriva {
  const temAmbas = entrada.proporcaoReferencia !== null && entrada.proporcaoAtual !== null;
  const magnitude = temAmbas
    ? Math.abs((entrada.proporcaoAtual ?? 0) - (entrada.proporcaoReferencia ?? 0))
    : 0;
  const classificacao = temAmbas
    ? classificar(magnitude, entrada.nReferencia, entrada.nAtual, entrada.limiar)
    : "amostra_insuficiente";
  return {
    id: entrada.id,
    dimensao: entrada.dimensao,
    magnitude,
    classificacao,
    limiar: entrada.limiar,
    nReferencia: entrada.nReferencia,
    nAtual: entrada.nAtual,
    maioresContribuicoes: [
      {
        chave: entrada.dimensao,
        proporcaoReferencia: entrada.proporcaoReferencia ?? 0,
        proporcaoAtual: entrada.proporcaoAtual ?? 0,
      },
    ],
    interpretacao: entrada.interpretacao,
  };
}

/**
 * Sinal de VOLUME. A regra de n mínimo aqui é deliberadamente diferente das
 * demais: exige-se n mínimo apenas na janela de REFERÊNCIA. Medir "o volume
 * caiu" não requer muitos pontos na janela atual — pelo contrário: o caso
 * extremo, `nAtual === 0`, é o achado mais forte possível (a fonte emudeceu).
 * Se este sinal usasse a mesma regra dos outros, uma fonte que parasse
 * completamente sairia como `amostra_insuficiente` — silêncio classificado
 * como "nada a ver", que é exatamente o falso-verde que este pacote existe
 * para impedir.
 */
function sinalDeVolume(entrada: {
  readonly id: string;
  readonly dimensao: string;
  readonly nReferencia: number;
  readonly nAtual: number;
  readonly limiar: LimiarDeDeriva;
  readonly interpretacao: string;
}): SinalDeDeriva {
  const { nReferencia, nAtual, limiar } = entrada;
  const magnitude =
    nReferencia === 0 ? 0 : Math.min(1, Math.abs(nAtual - nReferencia) / nReferencia);
  const classificacao: ClassificacaoDeSinal =
    nReferencia < limiar.nMinimo
      ? "amostra_insuficiente"
      : magnitude > limiar.valor
        ? "mudanca_registrada"
        : "sem_mudanca_acima_do_limiar";
  return {
    id: entrada.id,
    dimensao: entrada.dimensao,
    magnitude,
    classificacao,
    limiar,
    nReferencia,
    nAtual,
    maioresContribuicoes: [
      {
        chave: nAtual === 0 && nReferencia > 0 ? "fonte-silenciosa-na-janela-atual" : entrada.id,
        proporcaoReferencia: 1,
        proporcaoAtual: nReferencia === 0 ? 0 : nAtual / nReferencia,
      },
    ],
    interpretacao: entrada.interpretacao,
  };
}

// ---------------------------------------------------------------------------
// Detecção
// ---------------------------------------------------------------------------

export interface EntradaDeDeriva {
  readonly referencia: {
    readonly insumos: PerfilDeInsumos;
    readonly status: PerfilDeStatus;
  };
  readonly atual: {
    readonly insumos: PerfilDeInsumos;
    readonly status: PerfilDeStatus;
  };
  readonly limiar: LimiarDeDeriva;
}

export function detectarDeriva(entrada: EntradaDeDeriva): RelatorioDeDeriva {
  const { referencia, atual, limiar } = entrada;

  const sinais: readonly SinalDeDeriva[] = [
    sinalDeDistribuicao({
      id: "distribuicao-de-conceito",
      dimensao: "conceito clínico do insumo",
      referencia: referencia.insumos.porConceito,
      atual: atual.insumos.porConceito,
      nReferencia: referencia.insumos.total,
      nAtual: atual.insumos.total,
      limiar,
      interpretacao:
        "mudança na mistura de conceitos recebidos — uma fonte que para de enviar um " +
        "parâmetro (ou passa a enviar outro) altera silenciosamente o que é avaliável",
    }),
    sinalDeDistribuicao({
      id: "distribuicao-de-qualidade",
      dimensao: "sinal de qualidade da fonte",
      referencia: referencia.insumos.porQualidade,
      atual: atual.insumos.porQualidade,
      nReferencia: referencia.insumos.total,
      nAtual: atual.insumos.total,
      limiar,
      interpretacao:
        "mudança na mistura de qualidade declarada pela fonte — migração para " +
        "`quarantined`/`unknown` é degradação de fonte; migração inversa sem causa " +
        "é candidata a coerção de dado incompleto (pareamento antigaming de SM-05)",
    }),
    sinalDeDistribuicao({
      id: "distribuicao-de-unidade-canonica",
      dimensao: "unidade canônica do insumo",
      referencia: referencia.insumos.porUnidadeCanonica,
      atual: atual.insumos.porUnidadeCanonica,
      nReferencia: referencia.insumos.total,
      nAtual: atual.insumos.total,
      limiar,
      interpretacao:
        "mudança na mistura de unidades canônicas — inclui o balde de unidade ausente, " +
        "que é o traço de uma fonte que passou a mandar unidade não mapeável",
    }),
    sinalDeProporcao({
      id: "proporcao-sem-tempo-clinico",
      dimensao: "insumos sem tempo clínico declarado",
      proporcaoReferencia:
        referencia.insumos.total === 0
          ? null
          : referencia.insumos.semTempoClinico / referencia.insumos.total,
      proporcaoAtual:
        atual.insumos.total === 0 ? null : atual.insumos.semTempoClinico / atual.insumos.total,
      nReferencia: referencia.insumos.total,
      nAtual: atual.insumos.total,
      limiar,
      interpretacao:
        "insumo sem tempo clínico não pode ser janelado nem envelhecido; alta desta " +
        "proporção degrada frescor e cobertura antes de degradar qualquer escore",
    }),
    sinalDeProporcao({
      id: "taxa-de-status-nao-computavel",
      dimensao: "avaliações em status não-computável",
      proporcaoReferencia: referencia.status.taxaNaoComputavel,
      proporcaoAtual: atual.status.taxaNaoComputavel,
      nReferencia: referencia.status.total,
      nAtual: atual.status.total,
      limiar,
      interpretacao:
        "é o traço observável de DUAS coisas ao mesmo tempo (§2.2.3): falha de pipeline " +
        "de dados e encolhimento/manipulação de denominador — subida exige investigação " +
        "humana, jamais ajuste automático de janela ou de limiar",
    }),
    sinalDeDistribuicao({
      id: "distribuicao-de-estado-de-avaliacao",
      dimensao: "estado de avaliação",
      referencia: referencia.status.porEstado,
      atual: atual.status.porEstado,
      nReferencia: referencia.status.total,
      nAtual: atual.status.total,
      limiar,
      interpretacao:
        "mudança na mistura dos cinco estados da ADR-0008 (mais o balde " +
        "`nao_reconhecido`) — o aparecimento de `nao_reconhecido` significa vocabulário " +
        "de status novo na origem, e é sempre achado, nunca ruído",
    }),
    sinalDeVolume({
      id: "variacao-de-volume-de-insumos",
      dimensao: "volume de insumos por janela",
      nReferencia: referencia.insumos.total,
      nAtual: atual.insumos.total,
      limiar,
      interpretacao:
        "variação relativa do volume recebido — uma fonte que emudece não muda " +
        "distribuição nenhuma, ela some; sem este sinal, silêncio pareceria estabilidade",
    }),
    sinalDeVolume({
      id: "variacao-de-volume-de-avaliacoes",
      dimensao: "volume de avaliações por janela",
      nReferencia: referencia.status.total,
      nAtual: atual.status.total,
      limiar,
      interpretacao:
        "variação relativa do número de avaliações produzidas — se a avaliação para de " +
        "acontecer, nenhuma taxa de status muda (não há status nenhum); a queda de volume " +
        "é o único traço desse modo de falha",
    }),
  ];

  return {
    marcacao: MARCACAO_DE_INSTRUMENTACAO,
    rotuloReferencia: referencia.insumos.rotulo,
    rotuloAtual: atual.insumos.rotulo,
    sinais,
    sinaisComMudanca: sinais
      .filter((s) => s.classificacao === "mudanca_registrada")
      .map((s) => s.id),
    nota:
      "magnitudes medidas contra um limiar DECLARADAMENTE não ratificado. Este relatório " +
      "não conclui que a fonte degradou nem autoriza qualquer ação automática: a conclusão " +
      "é ato humano nomeado (`AUTH-CLINSAFETY` / `AUTH-DATA-PLATFORM`, ambos UNASSIGNED).",
  };
}
