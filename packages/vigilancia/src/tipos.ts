/**
 * Vocabulário comum da vigilância contínua (SPR-OC-1, fase 10 do §17).
 *
 * ESCOPO HONESTO DESTE PACOTE, dito uma vez e válido para todos os módulos:
 * isto é INSTRUMENTAÇÃO exercida contra DADOS SINTÉTICOS, não vigilância em
 * operação. Nenhum dado real existe, nenhuma via clínica é acionável
 * (0 vias acionáveis; 47/47 inelegíveis), a `Observation` da AMH não é
 * consumível e o safety case está em M0. A vigilância de verdade depende de
 * MG-G8-PROD. Nada aqui fecha gate, bloqueador, risco, hazard, ADR ou OS, e
 * nenhuma alegação de efetividade clínica, conformidade regulatória ou
 * segurança comprovada é feita.
 *
 * Três regras estruturais que atravessam todo o pacote:
 *
 * 1. **Nenhum limiar clínico é inventado.** Todo número que decide alguma
 *    coisa (limiar de deriva, n mínimo, piso de completude, janela de
 *    de-duplicação) entra por parâmetro e carrega, no próprio tipo, a marca
 *    de que NÃO é ratificado (`proveniencia`). `AUTH-CLINSAFETY` segue
 *    UNASSIGNED; nenhum default silencioso é admitido.
 * 2. **Ausência nunca vira zero.** Estado desconhecido, instante ausente e
 *    denominador vazio produzem estado explícito não-computável, nunca 0 e
 *    nunca "dentro do esperado" (P-1 de `evaluation-status-semantics.md`;
 *    o primitivo legado `get_number` coerce-to-zero é KPI-OPS-03, DROP).
 * 3. **Amostra pequena nunca vira aprovação.** Abaixo do n mínimo, a saída é
 *    `amostra_insuficiente` — jamais "sem mudança" nem "meta atingida"
 *    (anti-padrão KPI-PPV-01(c), "assume-OK-below-n").
 *
 * PREMISSA (reversível, GDEC-0015/0017): a convenção de dia clínico
 * (KPI-OPS-02, `clinical-kpi-review.md` §4.3) NÃO está ratificada; por isso
 * ela entra como parâmetro obrigatório e explícito em vez de ser fixada aqui.
 */

// ---------------------------------------------------------------------------
// Marcação de instrumentação
// ---------------------------------------------------------------------------

/**
 * Marca carregada por todo resultado deste pacote. Existe para que nenhum
 * consumidor (painel, relatório, exportação) possa exibir um número deste
 * pacote sem carregar junto a declaração do que ele é.
 */
export const MARCACAO_DE_INSTRUMENTACAO =
  "INSTRUMENTACAO_SOBRE_DADOS_SINTETICOS — NAO E VIGILANCIA EM OPERACAO (depende de MG-G8-PROD)" as const;

export type MarcacaoDeInstrumentacao = typeof MARCACAO_DE_INSTRUMENTACAO;

// ---------------------------------------------------------------------------
// Instante declarado — presente ou explicitamente ausente (DOM-0009, HAZ-0007)
// ---------------------------------------------------------------------------

/**
 * Um instante que ou está presente (UTC ISO 8601) ou está explicitamente
 * ausente com motivo. Espelha `TemporalValue` de `@intensicare/dominio` na
 * forma reduzida de que a vigilância precisa — nunca uma string vazia,
 * nunca um default para "agora".
 */
export type InstanteDeclarado =
  | { readonly tipo: "presente"; readonly utc: string }
  | { readonly tipo: "ausente"; readonly motivo: string };

export function instantePresente(utc: string): InstanteDeclarado {
  return { tipo: "presente", utc };
}

export function instanteAusente(motivo: string): InstanteDeclarado {
  return { tipo: "ausente", motivo };
}

// ---------------------------------------------------------------------------
// Estado de avaliação — cinco estados da ADR-0008 + o balde fail-closed
// ---------------------------------------------------------------------------

/**
 * Vocabulário canônico interno da vigilância. Os cinco primeiros são os
 * cinco estados da ADR-0008; `nao_reconhecido` é o balde fail-closed para
 * qualquer string de estado que a vigilância não saiba mapear.
 *
 * `nao_reconhecido` NUNCA conta como avaliado. Um vocabulário novo que
 * apareça na origem tem de aparecer aqui como lacuna visível, não ser
 * silenciosamente absorvido pelo estado mais próximo.
 */
export type EstadoDeAvaliacao =
  | "valido"
  | "parcial"
  | "nao_avaliado"
  | "desatualizado"
  | "invalido"
  | "nao_reconhecido";

/** Vocabulário pt-BR do contrato de API (`@intensicare/contratos`). */
const ESTADOS_PT_BR: Readonly<Record<string, EstadoDeAvaliacao>> = {
  valido: "valido",
  parcial: "parcial",
  indisponivel: "nao_avaliado",
  desatualizado: "desatualizado",
  invalido: "invalido",
};

/** Vocabulário do kernel clínico (`EvaluationStatus`, ADR-0008). */
const ESTADOS_KERNEL: Readonly<Record<string, EstadoDeAvaliacao>> = {
  valid: "valido",
  partial: "parcial",
  not_evaluated: "nao_avaliado",
  stale: "desatualizado",
  invalid: "invalido",
};

/**
 * Traduz o estado bruto gravado pela origem para o vocabulário canônico da
 * vigilância. Aceita os dois vocabulários em uso no repositório (contrato
 * pt-BR e kernel em inglês) e devolve `nao_reconhecido` para qualquer outra
 * coisa — inclusive string vazia. Fail-closed por construção: não existe
 * caminho neste mapeamento que transforme um estado desconhecido em
 * `valido`.
 */
export function normalizarEstado(estadoBruto: string): EstadoDeAvaliacao {
  const normalizado = estadoBruto.trim().toLowerCase();
  return ESTADOS_PT_BR[normalizado] ?? ESTADOS_KERNEL[normalizado] ?? "nao_reconhecido";
}

/**
 * Política de tratamento do estado `parcial` (regra SM-03 de
 * `clinical-kpi-review.md` §2.1: `parcial` só entra em cálculo "sob uma
 * política parcial explicitamente aprovada").
 */
export interface PoliticaDeParcial {
  readonly parcialContaComoAvaliado: boolean;
  /** Marca obrigatória — nenhuma política parcial foi aprovada até hoje. */
  readonly proveniencia: "politica-de-parcial-nao-aprovada-AUTH-CLINSAFETY";
}

/**
 * A política conservadora: `parcial` NÃO conta como avaliado. É a única
 * direção compatível com §2.1 enquanto `AUTH-CLINSAFETY` seguir UNASSIGNED.
 */
export const POLITICA_DE_PARCIAL_CONSERVADORA: PoliticaDeParcial = {
  parcialContaComoAvaliado: false,
  proveniencia: "politica-de-parcial-nao-aprovada-AUTH-CLINSAFETY",
};

/** Um estado é computável quando `valido`, ou `parcial` sob política aprovada. */
export function estadoEhComputavel(
  estado: EstadoDeAvaliacao,
  politica: PoliticaDeParcial,
): boolean {
  if (estado === "valido") return true;
  return estado === "parcial" && politica.parcialContaComoAvaliado;
}

// ---------------------------------------------------------------------------
// Atribuição de versão de regra (ADR-0025)
// ---------------------------------------------------------------------------

/**
 * Identidade da regra que produziu um artefato. `ausente` é um estado de
 * primeira classe: um artefato sem versão de regra NUNCA é atribuído à
 * versão "mais provável" nem à mais recente (ADR-0025 §5.2; defeito E3 —
 * string de versão que não identifica comportamento).
 */
export type AtribuicaoDeVersaoDeRegra =
  | {
      readonly tipo: "declarada";
      readonly ruleId: string;
      readonly ruleVersion: string;
      /**
       * Impressão de conteúdo do bundle que de fato rodou, quando a origem
       * a registra. É o que permite detectar o defeito E3 da ADR-0025: a
       * MESMA string de versão carregando conteúdos diferentes.
       */
      readonly impressaoDeConteudo?: string;
    }
  | { readonly tipo: "ausente"; readonly motivo: string };

/** Chave estável de uma versão declarada, para agrupamento e exibição. */
export function chaveDeVersao(atribuicao: AtribuicaoDeVersaoDeRegra): string {
  return atribuicao.tipo === "declarada"
    ? `${atribuicao.ruleId}@${atribuicao.ruleVersion}`
    : "versao-de-regra-ausente";
}

// ---------------------------------------------------------------------------
// Janela de vigilância
// ---------------------------------------------------------------------------

/** Janela [inicioUtc, fimUtc) — fim exclusivo, ambos ISO 8601 em UTC. */
export interface JanelaDeVigilancia {
  readonly inicioUtc: string;
  readonly fimUtc: string;
}

export function criarJanela(inicioUtc: string, fimUtc: string): JanelaDeVigilancia {
  const inicio = Date.parse(inicioUtc);
  const fim = Date.parse(fimUtc);
  if (Number.isNaN(inicio)) throw new TypeError(`início de janela inválido: ${inicioUtc}`);
  if (Number.isNaN(fim)) throw new TypeError(`fim de janela inválido: ${fimUtc}`);
  if (fim <= inicio) {
    throw new RangeError(`janela vazia ou invertida: ${inicioUtc} → ${fimUtc}`);
  }
  return { inicioUtc, fimUtc };
}

/** Um instante presente está dentro de [inicio, fim)? Ausente nunca está. */
export function dentroDaJanela(instante: InstanteDeclarado, janela: JanelaDeVigilancia): boolean {
  if (instante.tipo !== "presente") return false;
  const t = Date.parse(instante.utc);
  if (Number.isNaN(t)) return false;
  return t >= Date.parse(janela.inicioUtc) && t < Date.parse(janela.fimUtc);
}

// ---------------------------------------------------------------------------
// Convenção de dia e de turno — AMBAS não ratificadas (KPI-OPS-02, §4.3)
// ---------------------------------------------------------------------------

/**
 * Convenção de fronteira de dia. `clinical-kpi-review.md` §4.3 registra que
 * a convenção 7-às-7 do legado tinha DUAS implementações que discordavam
 * pelo offset UTC, e que a convenção "deve ser confirmada com o sítio e
 * implementada uma vez, com fuso explícito, antes que exista qualquer KPI
 * por dia". Enquanto isso não acontece, ela é um parâmetro obrigatório e
 * autodeclarado — nunca um default deste pacote.
 */
export interface ConvencaoDeDia {
  /** Fuso IANA (ex.: "America/Sao_Paulo"). Nunca UTC implícito. */
  readonly fusoHorario: string;
  /** Hora local de corte do dia: 0 = dia civil; 7 = convenção 7-às-7. */
  readonly horaDeCorte: number;
  readonly proveniencia: "convencao-de-dia-nao-ratificada-KPI-OPS-02";
}

/** Turno nomeado, [horaInicio, horaFim) em hora local; pode cruzar a meia-noite. */
export interface DefinicaoDeTurno {
  readonly id: string;
  readonly horaInicio: number;
  readonly horaFim: number;
}

/**
 * Parâmetros de instrumentação. Todo campo aqui é uma escolha operacional
 * NÃO ratificada, e a marca `proveniencia` viaja junto de todo resultado
 * para que nenhum número deste pacote possa ser lido como se as convenções
 * por trás dele estivessem decididas.
 */
export interface ParametrosDeVigilancia {
  readonly convencaoDeDia: ConvencaoDeDia;
  readonly turnos: readonly DefinicaoDeTurno[];
  readonly politicaDeParcial: PoliticaDeParcial;
  readonly proveniencia: "parametros-de-instrumentacao-nao-ratificados";
}

/**
 * Constrói os parâmetros validando o que é validável mecanicamente: fuso
 * não vazio, hora de corte em 0..23 e cobertura de turnos EXATA de 24 h
 * (nenhuma hora descoberta, nenhuma hora em dois turnos). Uma hora
 * descoberta produziria alertas que não pertencem a turno nenhum — silêncio
 * exatamente do tipo que este pacote existe para impedir.
 */
export function parametrosDeInstrumentacao(entrada: {
  readonly convencaoDeDia: ConvencaoDeDia;
  readonly turnos: readonly DefinicaoDeTurno[];
  readonly politicaDeParcial: PoliticaDeParcial;
}): ParametrosDeVigilancia {
  const { convencaoDeDia, turnos, politicaDeParcial } = entrada;
  if (convencaoDeDia.fusoHorario.trim() === "") {
    throw new TypeError("fuso horário da convenção de dia não pode ser vazio");
  }
  if (
    !Number.isInteger(convencaoDeDia.horaDeCorte) ||
    convencaoDeDia.horaDeCorte < 0 ||
    convencaoDeDia.horaDeCorte > 23
  ) {
    throw new RangeError(`hora de corte fora de 0..23: ${convencaoDeDia.horaDeCorte}`);
  }
  if (turnos.length === 0) {
    throw new TypeError("é obrigatório declarar ao menos um turno (recorte obrigatório de SM-04)");
  }

  const cobertura = new Array<number>(24).fill(0);
  for (const turno of turnos) {
    if (!horaValida(turno.horaInicio) || !horaValida(turno.horaFim)) {
      throw new RangeError(`turno "${turno.id}" tem hora fora de 0..23`);
    }
    for (const hora of horasDoTurno(turno)) {
      cobertura[hora] = (cobertura[hora] ?? 0) + 1;
    }
  }
  const descobertas = cobertura.flatMap((n, hora) => (n === 0 ? [hora] : []));
  const duplicadas = cobertura.flatMap((n, hora) => (n > 1 ? [hora] : []));
  if (descobertas.length > 0 || duplicadas.length > 0) {
    throw new RangeError(
      `turnos devem cobrir as 24 horas exatamente uma vez — horas descobertas: ` +
        `[${descobertas.join(", ")}]; horas em mais de um turno: [${duplicadas.join(", ")}]`,
    );
  }

  return {
    convencaoDeDia,
    turnos,
    politicaDeParcial,
    proveniencia: "parametros-de-instrumentacao-nao-ratificados",
  };
}

function horaValida(hora: number): boolean {
  return Number.isInteger(hora) && hora >= 0 && hora <= 23;
}

function horasDoTurno(turno: DefinicaoDeTurno): readonly number[] {
  const horas: number[] = [];
  let hora = turno.horaInicio;
  // `horaFim` é exclusiva; um turno com início === fim cobre as 24 horas.
  do {
    horas.push(hora);
    hora = (hora + 1) % 24;
  } while (hora !== turno.horaFim && horas.length < 24);
  return horas;
}

// ---------------------------------------------------------------------------
// Tempo local e chave de dia
// ---------------------------------------------------------------------------

const FORMATADORES = new Map<string, Intl.DateTimeFormat>();

function formatadorDe(fusoHorario: string): Intl.DateTimeFormat {
  const existente = FORMATADORES.get(fusoHorario);
  if (existente !== undefined) return existente;
  const novo = new Intl.DateTimeFormat("en-CA", {
    timeZone: fusoHorario,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  FORMATADORES.set(fusoHorario, novo);
  return novo;
}

export interface InstanteLocal {
  /** Data local no formato YYYY-MM-DD. */
  readonly data: string;
  readonly hora: number;
  readonly minuto: number;
}

/** Converte um instante UTC para a data/hora local do fuso declarado. */
export function instanteLocal(utc: string, fusoHorario: string): InstanteLocal {
  const momento = new Date(utc);
  if (Number.isNaN(momento.getTime())) {
    throw new TypeError(`instante UTC inválido: ${utc}`);
  }
  const partes = formatadorDe(fusoHorario).formatToParts(momento);
  const valorDe = (tipo: string): string => {
    const parte = partes.find((p) => p.type === tipo);
    if (parte === undefined) {
      throw new TypeError(`parte de data ausente ao formatar em ${fusoHorario}: ${tipo}`);
    }
    return parte.value;
  };
  return {
    data: `${valorDe("year")}-${valorDe("month")}-${valorDe("day")}`,
    hora: Number(valorDe("hour")),
    minuto: Number(valorDe("minute")),
  };
}

/**
 * Chave do dia de relatório (YYYY-MM-DD) a que um instante pertence sob a
 * convenção declarada. Com `horaDeCorte = 0` é o dia civil local; com 7, um
 * instante às 03:00 pertence ao dia anterior (convenção 7-às-7).
 */
export function chaveDeDia(utc: string, convencao: ConvencaoDeDia): string {
  const local = instanteLocal(utc, convencao.fusoHorario);
  return local.hora < convencao.horaDeCorte ? diaAnterior(local.data) : local.data;
}

/** Turno a que um instante pertence, sob os turnos declarados. */
export function turnoDe(utc: string, parametros: ParametrosDeVigilancia): string {
  const local = instanteLocal(utc, parametros.convencaoDeDia.fusoHorario);
  for (const turno of parametros.turnos) {
    if (horasDoTurno(turno).includes(local.hora)) return turno.id;
  }
  // Inalcançável: `parametrosDeInstrumentacao` exige cobertura de 24 h.
  throw new RangeError(`hora local ${local.hora} não pertence a nenhum turno declarado`);
}

function doisDigitos(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function comoUtcDeData(data: string): number {
  const ano = Number(data.slice(0, 4));
  const mes = Number(data.slice(5, 7));
  const dia = Number(data.slice(8, 10));
  return Date.UTC(ano, mes - 1, dia);
}

function deUtcParaData(ms: number): string {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${doisDigitos(d.getUTCMonth() + 1)}-${doisDigitos(d.getUTCDate())}`;
}

export function diaAnterior(data: string): string {
  return deUtcParaData(comoUtcDeData(data) - 86_400_000);
}

export function diaSeguinte(data: string): string {
  return deUtcParaData(comoUtcDeData(data) + 86_400_000);
}

/** Limite defensivo de enumeração de dias (10 anos) — evita laço não terminante. */
const MAXIMO_DE_DIAS = 3660;

/** Enumera as chaves de dia de `dataInicial` até `dataFinal`, inclusive. */
export function enumerarDias(dataInicial: string, dataFinal: string): readonly string[] {
  if (dataFinal < dataInicial) return [];
  const dias: string[] = [];
  let atual = dataInicial;
  while (atual <= dataFinal && dias.length < MAXIMO_DE_DIAS) {
    dias.push(atual);
    atual = diaSeguinte(atual);
  }
  return dias;
}

// ---------------------------------------------------------------------------
// Contagens por chave — forma de saída reutilizada por todos os módulos
// ---------------------------------------------------------------------------

export interface ContagemPorChave {
  readonly chave: string;
  readonly contagem: number;
}

/** Contagens ordenadas por chave (determinismo de saída, nunca por valor). */
export function contarPorChave(chaves: readonly string[]): readonly ContagemPorChave[] {
  const mapa = new Map<string, number>();
  for (const chave of chaves) {
    mapa.set(chave, (mapa.get(chave) ?? 0) + 1);
  }
  return [...mapa.entries()]
    .map(([chave, contagem]) => ({ chave, contagem }))
    .sort((a, b) => (a.chave < b.chave ? -1 : a.chave > b.chave ? 1 : 0));
}

/** Rótulo obrigatório do balde de unidade não atribuída (KPI-DASH-04, P-8). */
export const UNIDADE_NAO_ATRIBUIDA = "unidade-nao-atribuida" as const;

export function chaveDeUnidade(unidadeId: string | null): string {
  return unidadeId ?? UNIDADE_NAO_ATRIBUIDA;
}

// ---------------------------------------------------------------------------
// Completude de dados — o companheiro DC(K) obrigatório de §2.2
// ---------------------------------------------------------------------------

/**
 * Companheiro de completude `DC(K)` (`clinical-kpi-review.md` §2.2): para
 * todo KPI `K`, o numerador é o que foi EXCLUÍDO por status, por motivo
 * legível por máquina; o denominador é TUDO que era elegível, antes de
 * qualquer exclusão. "Todo KPI é um par, não um número."
 */
export interface Completude {
  readonly elegiveis: number;
  readonly computaveis: number;
  readonly excluidos: number;
  readonly motivosDeExclusao: readonly ContagemPorChave[];
  /**
   * Fração computável, ou `null` quando não há elegíveis — nunca 0, nunca
   * 1: sem elegível não existe fração, e uma fração inventada aqui seria
   * exatamente o falso-verde de denominador vazio.
   */
  readonly fracaoComputavel: number | null;
  /**
   * Piso mínimo de completude (§2.2.2). Permanece NÃO RATIFICADO: nenhum
   * número é proposto aqui, e por isso nenhum resultado deste pacote pode
   * afirmar que o piso foi atendido.
   */
  readonly pisoDeCompletude: "NAO_RATIFICADO_AUTH_CLINSAFETY";
}

export function montarCompletude(entrada: {
  readonly elegiveis: number;
  readonly computaveis: number;
  readonly motivosDeExclusao: readonly ContagemPorChave[];
}): Completude {
  const { elegiveis, computaveis, motivosDeExclusao } = entrada;
  return {
    elegiveis,
    computaveis,
    excluidos: elegiveis - computaveis,
    motivosDeExclusao,
    fracaoComputavel: elegiveis === 0 ? null : computaveis / elegiveis,
    pisoDeCompletude: "NAO_RATIFICADO_AUTH_CLINSAFETY",
  };
}
