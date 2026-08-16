/**
 * Carga de alarmes por paciente-dia e por unidade — sucessor de KPI-DASH-03,
 * na forma exigida por SM-04 / KPIR-03 (`clinical-kpi-review.md` §3).
 *
 * POR QUE ESTA É A MÉTRICA QUE O PROGRAMA MAIS PRECISA VIGIAR: alerta demais
 * mata a atenção clínica. SM-04 é explicitamente uma RESTRIÇÃO, não um
 * maximando (`success-and-harm-metrics.md` SM-04) — nem valor alto nem baixo
 * é bom em si: carga alta produz fadiga (HM-02) e carga artificialmente
 * baixa pode significar deterioração suprimida ou perdida (HM-04). Por isso
 * este módulo NUNCA emite juízo de "bom/ruim" sobre o valor: emite a taxa, o
 * companheiro de completude e as séries que permitem interpretá-la. A banda
 * aceitável é decisão de `AUTH-CLINSAFETY` (UNASSIGNED), informada por carga
 * de alarme observada — que não foi medida.
 *
 * Regras de KPIR-03 materializadas aqui:
 * - numerador: alertas CRIADOS na janela, com os quatro recortes obrigatórios
 *   (severidade, unidade, turno, versão de regra de origem);
 * - denominador: paciente-dias ocupados PARTICIONADOS por status; a taxa de
 *   cabeçalho divide pelos paciente-dias AVALIADOS;
 * - paciente-dia não avaliado sai dos DOIS lados (numerador e denominador) e é
 *   reportado — zero alerta sobre tempo não avaliado é "não avaliado", jamais
 *   "carga zero" (P-5: no-fire tem de ser distinguível de não-avaliação);
 * - alerta nunca sai do numerador por ter sido resolvido depois: carga mede o
 *   que a equipe clínica EXPERIMENTOU;
 * - a série de supressão/cooldown/deduplicação é reportada em pé de igualdade
 *   (SAF-0019) — é a mitigação contra baixar a carga por supressão.
 *
 * PREMISSA (reversível, GDEC-0015/0017): um dia parcialmente ocupado conta
 * como UM paciente-dia ocupado; a política de dia fracionário permanece
 * VALIDATION REQUIRED (KPIR-09 / §4.3) e viaja declarada no resultado.
 */
import {
  type AtribuicaoDeVersaoDeRegra,
  type Completude,
  type ContagemPorChave,
  chaveDeDia,
  chaveDeUnidade,
  chaveDeVersao,
  contarPorChave,
  dentroDaJanela,
  type EstadoDeAvaliacao,
  enumerarDias,
  estadoEhComputavel,
  type InstanteDeclarado,
  type JanelaDeVigilancia,
  MARCACAO_DE_INSTRUMENTACAO,
  type MarcacaoDeInstrumentacao,
  montarCompletude,
  normalizarEstado,
  type ParametrosDeVigilancia,
  turnoDe,
} from "./tipos.js";

// ---------------------------------------------------------------------------
// Entradas observadas
// ---------------------------------------------------------------------------

export interface AlertaObservado {
  readonly alertaId: string;
  readonly encontroId: string;
  readonly unidadeId: string | null;
  /** Instante de CRIAÇÃO do alerta (`raised_at`) — presente ou ausente declarado. */
  readonly instante: InstanteDeclarado;
  readonly severidade: string;
  readonly regra: AtribuicaoDeVersaoDeRegra;
}

/**
 * Fim da ocupação. `em_curso` (ainda internado) e `ausente` (âncora de alta
 * faltando ou implausível) são coisas DIFERENTES e nunca colapsam: a
 * primeira ocupa até o fim da janela; a segunda não produz paciente-dia
 * nenhum e vai para o companheiro de completude com o motivo.
 */
export type FimDeOcupacao =
  | { readonly tipo: "alta"; readonly utc: string }
  | { readonly tipo: "em_curso" }
  | { readonly tipo: "ausente"; readonly motivo: string };

export interface OcupacaoObservada {
  readonly encontroId: string;
  readonly unidadeId: string | null;
  readonly admissao: InstanteDeclarado;
  readonly fim: FimDeOcupacao;
}

export interface AvaliacaoObservada {
  readonly avaliacaoId: string;
  readonly encontroId: string;
  readonly instante: InstanteDeclarado;
  /** Estado exatamente como gravado pela origem — normalizado aqui, nunca lá. */
  readonly estadoBruto: string;
  readonly regra: AtribuicaoDeVersaoDeRegra;
}

export interface SupressaoObservada {
  readonly encontroId: string;
  readonly instante: InstanteDeclarado;
  /** Motivo legível por máquina (supressão, cooldown, deduplicação, ...). */
  readonly motivo: string;
}

// ---------------------------------------------------------------------------
// Saídas
// ---------------------------------------------------------------------------

/**
 * Taxa de carga. É uma união discriminada, e NÃO um `number`, para que não
 * exista caminho de leitura em que a taxa apareça sem o companheiro de
 * completude ao lado, e para que denominador vazio produza "não computável"
 * em vez de zero.
 */
export type TaxaDeCarga =
  | { readonly tipo: "nao_computavel"; readonly motivo: string; readonly completude: Completude }
  | {
      readonly tipo: "computada";
      readonly alertasPorPacienteDiaAvaliado: number;
      readonly completude: Completude;
    };

export interface RecorteDeCarga {
  readonly pacienteDiasOcupados: number;
  readonly pacienteDiasAvaliados: number;
  /** Alertas no numerador — apenas os de paciente-dia avaliado (§2.1). */
  readonly alertasNoNumerador: number;
  /** Alertas observados no recorte, inclusive os excluídos do numerador. */
  readonly alertasObservados: number;
  readonly taxa: TaxaDeCarga;
}

export interface RecorteDeCargaComChave extends RecorteDeCarga {
  readonly chave: string;
}

/**
 * Série de supressão. `nao_instrumentada` é deliberadamente distinta de
 * "zero supressões": ausência de instrumentação nunca pode ser lida como
 * ausência de supressão — é exatamente assim que a carga é baixada sem que
 * ninguém veja (pareamento antigaming SM-04 × HM-04/HM-03).
 */
export type SerieDeSupressao =
  | { readonly tipo: "nao_instrumentada"; readonly nota: string }
  | {
      readonly tipo: "observada";
      readonly total: number;
      readonly porMotivo: readonly ContagemPorChave[];
    };

export interface CargaDeAlarmes {
  readonly marcacao: MarcacaoDeInstrumentacao;
  readonly janela: JanelaDeVigilancia;
  readonly parametros: ParametrosDeVigilancia;
  readonly politicaDeDiaParcial: "dia-parcial-conta-como-um-paciente-dia-VALIDATION-REQUIRED";
  readonly agregado: RecorteDeCarga;
  readonly porUnidade: readonly RecorteDeCargaComChave[];
  readonly porDia: readonly RecorteDeCargaComChave[];
  /** Recortes obrigatórios de SM-04, sobre os alertas do numerador. */
  readonly porSeveridade: readonly ContagemPorChave[];
  readonly porTurno: readonly ContagemPorChave[];
  readonly porVersaoDeRegra: readonly ContagemPorChave[];
  /** Alertas excluídos do numerador, por motivo — nunca silenciosamente sumidos. */
  readonly alertasForaDoNumerador: readonly ContagemPorChave[];
  /**
   * Ocupações que não produziram paciente-dia nenhum (âncora de admissão ou
   * de alta ausente/inválida), por motivo. É um nível de denominador
   * diferente do paciente-dia e por isso tem série própria — nunca é
   * misturado ao `Completude` do paciente-dia.
   */
  readonly ocupacoesExcluidas: readonly ContagemPorChave[];
  readonly supressao: SerieDeSupressao;
  /** Defeitos de relatório conhecidos (recorte obrigatório indisponível etc.). */
  readonly defeitosDeRelatorio: readonly string[];
}

// ---------------------------------------------------------------------------
// Cálculo
// ---------------------------------------------------------------------------

interface PacienteDia {
  readonly encontroId: string;
  readonly unidade: string;
  readonly dia: string;
  readonly avaliado: boolean;
  readonly motivoDeNaoAvaliacao: string | null;
}

interface AlertaClassificado {
  readonly unidade: string;
  readonly dia: string | null;
  readonly turno: string | null;
  readonly severidade: string;
  readonly regra: AtribuicaoDeVersaoDeRegra;
  readonly noNumerador: boolean;
  readonly motivoDeExclusao: string | null;
}

export interface EntradaDeCargaDeAlarmes {
  readonly janela: JanelaDeVigilancia;
  readonly parametros: ParametrosDeVigilancia;
  readonly ocupacoes: readonly OcupacaoObservada[];
  readonly avaliacoes: readonly AvaliacaoObservada[];
  readonly alertas: readonly AlertaObservado[];
  /**
   * Série de supressão. `undefined` significa NÃO INSTRUMENTADA (a vigilância
   * não sabe); um array vazio significa instrumentada e sem nenhuma supressão
   * observada. As duas coisas são reportadas de forma diferente.
   */
  readonly supressoes?: readonly SupressaoObservada[];
}

export function calcularCargaDeAlarmes(entrada: EntradaDeCargaDeAlarmes): CargaDeAlarmes {
  const { janela, parametros, ocupacoes, avaliacoes, alertas } = entrada;
  const convencao = parametros.convencaoDeDia;

  const estadosPorEncontroDia = agruparEstados(avaliacoes, janela, convencao);
  const { pacienteDias, ocupacoesExcluidas } = expandirPacienteDias(
    ocupacoes,
    janela,
    parametros,
    estadosPorEncontroDia,
  );

  const indice = new Map<string, PacienteDia>();
  for (const pd of pacienteDias) {
    indice.set(`${pd.encontroId} ${pd.dia}`, pd);
  }

  const classificados = alertas.flatMap((alerta) =>
    classificarAlerta(alerta, janela, parametros, indice),
  );
  const noNumerador = classificados.filter((a) => a.noNumerador);

  const unidades = [
    ...new Set([...pacienteDias.map((pd) => pd.unidade), ...classificados.map((a) => a.unidade)]),
  ].sort();
  const dias = [
    ...new Set([
      ...pacienteDias.map((pd) => pd.dia),
      ...classificados.flatMap((a) => (a.dia === null ? [] : [a.dia])),
    ]),
  ].sort();

  const semVersao = noNumerador.filter((a) => a.regra.tipo === "ausente").length;
  const defeitos: string[] = [];
  if (semVersao > 0) {
    defeitos.push(
      `recorte obrigatório por versão de regra INDISPONÍVEL para ${semVersao} de ` +
        `${noNumerador.length} alerta(s) do numerador — SM-04 exige atribuição por versão; ` +
        "sem ela, uma mudança de carga após liberação de regra não é atribuível. Defeito de " +
        "relatório DECLARADO, jamais corrigido por inferência de versão.",
    );
  }

  return {
    marcacao: MARCACAO_DE_INSTRUMENTACAO,
    janela,
    parametros,
    politicaDeDiaParcial: "dia-parcial-conta-como-um-paciente-dia-VALIDATION-REQUIRED",
    agregado: montarRecorte(pacienteDias, classificados),
    porUnidade: unidades.map((unidade) => ({
      chave: unidade,
      ...montarRecorte(
        pacienteDias.filter((pd) => pd.unidade === unidade),
        classificados.filter((a) => a.unidade === unidade),
      ),
    })),
    porDia: dias.map((dia) => ({
      chave: dia,
      ...montarRecorte(
        pacienteDias.filter((pd) => pd.dia === dia),
        classificados.filter((a) => a.dia === dia),
      ),
    })),
    porSeveridade: contarPorChave(noNumerador.map((a) => a.severidade)),
    porTurno: contarPorChave(noNumerador.map((a) => a.turno ?? "turno-nao-determinavel")),
    porVersaoDeRegra: contarPorChave(noNumerador.map((a) => chaveDeVersao(a.regra))),
    alertasForaDoNumerador: contarPorChave(
      classificados.flatMap((a) => (a.motivoDeExclusao === null ? [] : [a.motivoDeExclusao])),
    ),
    ocupacoesExcluidas: contarPorChave(ocupacoesExcluidas),
    supressao: montarSerieDeSupressao(entrada.supressoes, janela),
    defeitosDeRelatorio: defeitos,
  };
}

function agruparEstados(
  avaliacoes: readonly AvaliacaoObservada[],
  janela: JanelaDeVigilancia,
  convencao: ParametrosDeVigilancia["convencaoDeDia"],
): ReadonlyMap<string, readonly EstadoDeAvaliacao[]> {
  const mapa = new Map<string, EstadoDeAvaliacao[]>();
  for (const avaliacao of avaliacoes) {
    if (avaliacao.instante.tipo !== "presente") continue;
    if (!dentroDaJanela(avaliacao.instante, janela)) continue;
    const chave = `${avaliacao.encontroId} ${chaveDeDia(avaliacao.instante.utc, convencao)}`;
    const lista = mapa.get(chave) ?? [];
    lista.push(normalizarEstado(avaliacao.estadoBruto));
    mapa.set(chave, lista);
  }
  return mapa;
}

function expandirPacienteDias(
  ocupacoes: readonly OcupacaoObservada[],
  janela: JanelaDeVigilancia,
  parametros: ParametrosDeVigilancia,
  estados: ReadonlyMap<string, readonly EstadoDeAvaliacao[]>,
): {
  readonly pacienteDias: readonly PacienteDia[];
  readonly ocupacoesExcluidas: readonly string[];
} {
  const convencao = parametros.convencaoDeDia;
  const inicioJanela = Date.parse(janela.inicioUtc);
  const fimJanela = Date.parse(janela.fimUtc);
  const pacienteDias: PacienteDia[] = [];
  const excluidas: string[] = [];

  for (const ocupacao of ocupacoes) {
    if (ocupacao.admissao.tipo !== "presente") {
      excluidas.push(`ancora-de-admissao-ausente:${ocupacao.admissao.motivo}`);
      continue;
    }
    if (ocupacao.fim.tipo === "ausente") {
      excluidas.push(`ancora-de-alta-ausente-ou-invalida:${ocupacao.fim.motivo}`);
      continue;
    }
    const admissao = Date.parse(ocupacao.admissao.utc);
    if (Number.isNaN(admissao)) {
      excluidas.push("ancora-de-admissao-invalida:instante-nao-parseavel");
      continue;
    }
    const altaBruta = ocupacao.fim.tipo === "alta" ? Date.parse(ocupacao.fim.utc) : fimJanela;
    if (Number.isNaN(altaBruta)) {
      excluidas.push("ancora-de-alta-invalida:instante-nao-parseavel");
      continue;
    }
    const inicio = Math.max(admissao, inicioJanela);
    const fim = Math.min(altaBruta, fimJanela);
    if (fim <= inicio) continue; // ocupação fora da janela — não é exclusão por qualidade

    const unidade = chaveDeUnidade(ocupacao.unidadeId);
    const diaInicial = chaveDeDia(new Date(inicio).toISOString(), convencao);
    const diaFinal = chaveDeDia(new Date(fim - 1).toISOString(), convencao);
    for (const dia of enumerarDias(diaInicial, diaFinal)) {
      const observados = estados.get(`${ocupacao.encontroId} ${dia}`) ?? [];
      const avaliado = observados.some((estado) =>
        estadoEhComputavel(estado, parametros.politicaDeParcial),
      );
      pacienteDias.push({
        encontroId: ocupacao.encontroId,
        unidade,
        dia,
        avaliado,
        motivoDeNaoAvaliacao: avaliado
          ? null
          : observados.length === 0
            ? "sem-avaliacao-no-dia"
            : `estado-nao-computavel:${[...new Set(observados)].sort().join("+")}`,
      });
    }
  }
  return { pacienteDias, ocupacoesExcluidas: excluidas };
}

function classificarAlerta(
  alerta: AlertaObservado,
  janela: JanelaDeVigilancia,
  parametros: ParametrosDeVigilancia,
  indice: ReadonlyMap<string, PacienteDia>,
): readonly AlertaClassificado[] {
  const base = {
    unidade: chaveDeUnidade(alerta.unidadeId),
    severidade: alerta.severidade,
    regra: alerta.regra,
  } as const;

  if (alerta.instante.tipo !== "presente") {
    return [
      {
        ...base,
        dia: null,
        turno: null,
        noNumerador: false,
        motivoDeExclusao: `instante-de-criacao-ausente:${alerta.instante.motivo}`,
      },
    ];
  }
  if (!dentroDaJanela(alerta.instante, janela)) return [];

  const dia = chaveDeDia(alerta.instante.utc, parametros.convencaoDeDia);
  const turno = turnoDe(alerta.instante.utc, parametros);
  const pacienteDia = indice.get(`${alerta.encontroId} ${dia}`);
  if (pacienteDia === undefined) {
    return [
      {
        ...base,
        dia,
        turno,
        noNumerador: false,
        motivoDeExclusao: "sem-paciente-dia-ocupado-correspondente",
      },
    ];
  }
  if (!pacienteDia.avaliado) {
    // §2.1: sai dos DOIS lados (numerador e denominador) e aparece aqui.
    return [
      {
        ...base,
        dia,
        turno,
        noNumerador: false,
        motivoDeExclusao: `paciente-dia-nao-avaliado:${
          pacienteDia.motivoDeNaoAvaliacao ?? "motivo-nao-registrado"
        }`,
      },
    ];
  }
  return [{ ...base, dia, turno, noNumerador: true, motivoDeExclusao: null }];
}

function montarRecorte(
  pacienteDias: readonly PacienteDia[],
  alertas: readonly AlertaClassificado[],
): RecorteDeCarga {
  const ocupados = pacienteDias.length;
  const avaliados = pacienteDias.filter((pd) => pd.avaliado).length;
  const numerador = alertas.filter((a) => a.noNumerador).length;
  const completude = montarCompletude({
    elegiveis: ocupados,
    computaveis: avaliados,
    motivosDeExclusao: contarPorChave(
      pacienteDias.flatMap((pd) =>
        pd.avaliado ? [] : [pd.motivoDeNaoAvaliacao ?? "motivo-nao-registrado"],
      ),
    ),
  });
  const taxa: TaxaDeCarga =
    avaliados === 0
      ? {
          tipo: "nao_computavel",
          motivo:
            ocupados === 0
              ? "sem-paciente-dia-ocupado-na-janela"
              : "sem-paciente-dia-AVALIADO-na-janela — zero alerta sobre tempo não avaliado é " +
                "NÃO AVALIADO, nunca carga zero (P-5)",
          completude,
        }
      : {
          tipo: "computada",
          alertasPorPacienteDiaAvaliado: numerador / avaliados,
          completude,
        };
  return {
    pacienteDiasOcupados: ocupados,
    pacienteDiasAvaliados: avaliados,
    alertasNoNumerador: numerador,
    alertasObservados: alertas.length,
    taxa,
  };
}

function montarSerieDeSupressao(
  supressoes: readonly SupressaoObservada[] | undefined,
  janela: JanelaDeVigilancia,
): SerieDeSupressao {
  if (supressoes === undefined) {
    return {
      tipo: "nao_instrumentada",
      nota:
        "supressão/cooldown/deduplicação NÃO instrumentada nesta fonte — ausência de " +
        "instrumentação não é ausência de supressão (SAF-0019 / P-5); a série obrigatória " +
        "de SM-04 permanece indisponível",
    };
  }
  const naJanela = supressoes.filter((s) => dentroDaJanela(s.instante, janela));
  return {
    tipo: "observada",
    total: naJanela.length,
    porMotivo: contarPorChave(naJanela.map((s) => s.motivo)),
  };
}

// ---------------------------------------------------------------------------
// Tendência da carga ao longo dos dias
// ---------------------------------------------------------------------------

/**
 * Tendência da carga. `amostra_insuficiente` é um resultado de primeira
 * classe: abaixo do n mínimo NÃO se afirma "estável" (anti-padrão
 * KPI-PPV-01(c), "assume-OK-below-n"). Nenhum juízo de bom/ruim é emitido —
 * SM-04 é uma banda a acordar com clínicos, não uma direção de viagem.
 */
export type TendenciaDaCarga =
  | {
      readonly tipo: "amostra_insuficiente";
      readonly diasComputaveis: number;
      readonly nMinimo: number;
    }
  | {
      readonly tipo: "serie";
      readonly diasComputaveis: number;
      readonly primeira: number;
      readonly ultima: number;
      readonly variacaoAbsoluta: number;
      readonly direcao: "crescente" | "decrescente" | "sem-variacao";
      readonly serie: readonly { readonly dia: string; readonly taxa: number }[];
    };

/**
 * n mínimo de dias computáveis para descrever uma tendência. NÃO é um limiar
 * clínico: é o mínimo aritmético para que "primeiro vs. último" deixe de ser
 * uma leitura de dois pontos — o defeito exato de KPI-DASH-07.
 */
export const DIAS_MINIMOS_PARA_TENDENCIA = 3 as const;

export function tendenciaDaCarga(
  carga: CargaDeAlarmes,
  nMinimo: number = DIAS_MINIMOS_PARA_TENDENCIA,
): TendenciaDaCarga {
  const serie = carga.porDia.flatMap((recorte) =>
    recorte.taxa.tipo === "computada"
      ? [{ dia: recorte.chave, taxa: recorte.taxa.alertasPorPacienteDiaAvaliado }]
      : [],
  );
  if (serie.length < nMinimo) {
    return { tipo: "amostra_insuficiente", diasComputaveis: serie.length, nMinimo };
  }
  const primeira = serie[0]?.taxa ?? 0;
  const ultima = serie[serie.length - 1]?.taxa ?? 0;
  const variacaoAbsoluta = ultima - primeira;
  return {
    tipo: "serie",
    diasComputaveis: serie.length,
    primeira,
    ultima,
    variacaoAbsoluta,
    direcao:
      variacaoAbsoluta > 0 ? "crescente" : variacaoAbsoluta < 0 ? "decrescente" : "sem-variacao",
    serie,
  };
}
