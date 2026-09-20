/**
 * Avaliador SOFA determinístico — RULE-SOFA 0.2.0 (precursor 0.x, não
 * assinado; REVISADO CLINICAMENTE 2026-08-15, GDEC-0007; NOT ACTIONABLE).
 *
 * Implementa a spec docs/05-clinical-safety/rule-releases/sofa/specification.md
 * (§0-§9) e sua logic.yaml — onde as duas divergirem, specification.md
 * governa (spec §6):
 * - Seis componentes 0-4 + total 0-24 (Vincent 1996, doi:10.1007/BF01709751);
 * - Gate populacional fail-closed (ADR-0027; idade desconhecida NUNCA
 *   presume adulto — razões desta release: `population_unverified` /
 *   `out_of_population_scope`, spec §1.2);
 * - Álgebra de status §5: `partial` tem EXATAMENTE UMA classe ratificada —
 *   o parcial declarado renal (pior-critério-disponível, GDEC-0007 OQ-7 (b)
 *   / ADR-0008 A8-2); nenhum total parcial genérico, jamais (k-de-6 é outro
 *   instrumento com o nome do SOFA);
 * - Proibição total de coerção a zero (HAZ-0005; spec §5.2);
 * - Conversão de unidade EXATA antes da comparação de banda (HAZ-0032;
 *   ÷17.104 bilirrubina, ÷88.42 creatinina, ×7.50062 kPa, FiO2 % → ÷100);
 *   unidade ausente/inmapeável ⇒ `invalid` — nunca heurística
 *   (CRV-SOFA-0330);
 * - Cardiovascular: evidência de vasopressor domina (D-07 corrigido); PAM
 *   obrigatória só sem agente tabelado; combinação = max de tiers (I-4);
 *   agente não tabelado ⇒ piso 3 sinalizado (I-5); dose ausente/inutilizável
 *   ⇒ piso por presença do agente (DECISÃO DERIVADA GDEC-0007 princípio 2,
 *   confirmada GDEC-0008 item 4); 1ª hora de infusão ⇒ tier provisório
 *   escalável sinalizado (I-3); PAM derivada de PAS/PAD admitida com flag
 *   (OQ-9 (a));
 * - Gate de sedação FAIL-CLOSED (I-8; política conjunta com RULE-GCS
 *   OQ-GCS-2 e ADR-0028 A28-2 — o default "escora com divulgação" foi
 *   REMOVIDO);
 * - Carve-outs OQ-11 (b): computar com anotação — paliativo (supressão de
 *   escalonamento com razão visível), crônico (anotação obrigatória), TSR
 *   (flag `on_rrt`), ECMO (respiratório not_evaluated).
 *
 * Classe ADR-0026 desta regra: ausência ⇒ `not_evaluated` POR COMPONENTE,
 * com a única exceção ratificada do parcial declarado renal; um total
 * numérico existe somente com os seis componentes legíveis (§5.2). Nenhum
 * caminho em que insumo ausente vire 0/normal/silêncio.
 *
 * INTERPRETAÇÕES DOCUMENTADAS (casos que a spec não fecha; todas na direção
 * fail-closed, transcritas aqui e não inventadas em silêncio):
 * - Razões por componente seguem o corpus CRV: ausência do componente usa a
 *   chave curta (`missing_required_input:resp`); insumo específico de
 *   suporte respiratório usa `missing_required_input:respiratory_support_status`
 *   (spec §4.1); stale/expired/conflito/unidade usam o nome longo
 *   (`stale_input:coagulation`, `unmappable_unit:respiration`).
 * - `lastConfirmedAt: null` num agente ativo: o próprio registro de
 *   administração é a evidência; a checagem de recência de confirmação é
 *   omitida (o corpus CRV-SOFA-0340/0341 não traz last_confirmed).
 * - `dose` em unidade reconhecida mas não normalizável (`ug/min`, `mL/h`)
 * segue §4.4: dose não-usável ⇒ piso por presença; unidade fora do
 *   conjunto reconhecido é INMAPEÁVEL ⇒ `invalid` (o piso repara ausência,
 *   nunca falha de integridade).
 * - Intervalo de débito urinário terminando depois de T: idade tratada como
 *   0 (precedente NEWS2 GDEC-0015/0017 para tempo futuro).
 * - PAM derivada usa o horário da PAS como tempo clínico do valor derivado.
 *
 * Determinismo: nenhuma leitura de relógio, nenhuma aleatoriedade, nenhuma
 * chamada externa — todo tempo entra por parâmetro; mesma entrada ⇒ mesmo
 * registro, byte a byte. A razão P/F é normalizada a 1e-9 antes da
 * comparação para eliminar artefatos de ponto flutuante em cortes exatos
 * (84/0,21 = 400).
 */

import { evaluateAgeGate } from "./population.js";
import {
  type EvaluationStatus,
  type RassObservationInput,
  type SedativeExposureState,
  SOFA_COMPONENT_ORDER,
  type SofaComponentContribution,
  type SofaComponentId,
  type SofaEvaluationInput,
  type SofaEvaluationRecord,
  type SofaMapObservation,
  type SofaNoFireReason,
  type SofaQuantityObservation,
  type SofaUrineOutputObservation,
} from "./types.js";
import {
  doseUgKgMinDe,
  paraBilirrubinaMgDl,
  paraCreatininaMgDl,
  paraFio2Fracao,
  paraPaO2MmHg,
  paraPlaquetasContagem,
} from "./unidades/index.js";

export const SOFA_RULE_ID = "RULE-SOFA" as const;
/** Versão pinada da spec 0.2.0 (precursor 0.x; GDEC-0007 incorporado). */
export const SOFA_RULE_VERSION = "0.2.0" as const;

const EPS = 1e-9;
const MINUTE_MS = 60_000;

/** Janelas de atualidade e horizontes de expiração, em minutos (spec §3.2 — OQ-9 (a)). */
const JANELA = {
  pao2: { janelaMin: 24 * 60, expiraMin: 48 * 60 },
  plaquetas: { janelaMin: 24 * 60, expiraMin: 48 * 60 },
  bilirrubina: { janelaMin: 24 * 60, expiraMin: 48 * 60 },
  creatinina: { janelaMin: 24 * 60, expiraMin: 48 * 60 },
  pam: { janelaMin: 4 * 60, expiraMin: 8 * 60 },
  gcs: { janelaMin: 12 * 60, expiraMin: 24 * 60 },
} as const;

/** Pareamentos e janelas estruturais (spec §3.1). */
const PAREAMENTO_FIO2_MIN = 30;
const SUPORTE_CONTEMPORANEIDADE_MIN = 60;
const PAREAMENTO_RASS_MIN = 60;
const DOSE_CONFIRMACAO_JANELA_MIN = 120;
const DOSE_CONFIRMACAO_EXPIRA_MIN = 240;
const URINA_FIM_JANELA_MIN = 4 * 60;
const URINA_FIM_EXPIRA_MIN = 8 * 60;

/** Faixas plausíveis (spec §3.1) — fora ⇒ `invalid`, jamais banda. */
const FAIXA = {
  pao2: [30, 700],
  plaquetas: [1, 2000],
  bilirrubina: [0.1, 60],
  creatinina: [0.1, 25],
  pam: [20, 200],
  gcs: [3, 15],
  urina: [0, 10000],
} as const;

/** Faixas plausíveis de dose por agente, em µg/kg/min (spec §3.1 linha 9). */
const FAIXA_DOSE: Readonly<Record<string, readonly [number, number]>> = {
  dopamine: [0.5, 60],
  dobutamine: [0.5, 40],
  epinephrine: [0.01, 5],
  norepinephrine: [0.01, 5],
};

/** Piso por presença do agente (DECISÃO DERIVADA GDEC-0007 princípio 2). */
const PISO_PRESENCA: Readonly<Record<string, number>> = {
  dopamine: 2,
  dobutamine: 2,
  norepinephrine: 3,
  epinephrine: 3,
};

const AGENTES_TABELADOS: readonly string[] = [
  "dopamine",
  "dobutamine",
  "epinephrine",
  "norepinephrine",
];

/** Limiar do gate de sedação (política conjunta ADR-0028 A28-5). */
const RASS_LIMIAR_SEDACAO = -3;

/** Razão P/F normalizada a 1e-9 — mata artefato de FP em cortes exatos. */
function razaoPF(pao2: number, fio2: number): number {
  return Math.round((pao2 / fio2) * 1e9) / 1e9;
}

/**
 * Valor canônico normalizado a 1e-9 antes de faixa e banda (spec §4.0:
 * comparação em precisão cheia — o arredondamento só elimina o artefato de
 * ponto flutuante de conversões como ÷17.104; 4.999999999999 vira 5.0).
 */
function normalizar9(valor: number): number {
  return Math.round(valor * 1e9) / 1e9;
}

function parseIsoTime(value: string | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

// ---------------------------------------------------------------------------
// Rótulos pt-BR e razões
// ---------------------------------------------------------------------------

const ROTULO_COMPONENTE_PT: Readonly<Record<SofaComponentId, string>> = {
  resp: "respiratório",
  coag: "coagulação",
  liver: "hepático",
  cv: "cardiovascular",
  cns: "neurológico",
  renal: "renal",
};

const NOME_LONGO: Readonly<Record<SofaComponentId, string>> = {
  resp: "respiration",
  coag: "coagulation",
  liver: "liver",
  cv: "cardiovascular",
  cns: "cns",
  renal: "renal",
};

const ROTULO_AGENTE_PT: Readonly<Record<string, string>> = {
  dopamine: "dopamina",
  dobutamine: "dobutamina",
  norepinephrine: "noradrenalina",
  epinephrine: "adrenalina",
};

/** Anotação obrigatória HAZ-0044 (OQ-11 (b) — espelho NEWS2 N-3). */
export const SOFA_ANOTACAO_LIMITACAO_PT =
  "escalonamento suprimido — ordem de limitação terapêutica documentada (HAZ-0044)";

export const SOFA_ANOTACAO_TSR_PT =
  "em TSR — creatinina sob terapia renal substitutiva não reflete a função renal nativa";

export const SOFA_ANOTACAO_PAM_DERIVADA_PT =
  "PAM derivada de PAS/PAD ((PAS + 2×PAD)/3) — fallback admitido por OQ-9 (a)";

export const SOFA_ANOTACAO_AGENTE_NAO_TABELADO_PT =
  "agente vasoativo não tabelado — piso CV 3; mapeamento com fonte VALIDATION REQUIRED";

export const SOFA_ANOTACAO_PROVISORIO_PT = "provisório — infusão <1h";

export const SOFA_DIVULGACAO_RENAL_PT = "o escore renal é um limite inferior";

function divulgacaoDoseAusentePt(agente: string, piso: number): string {
  const rotulo = ROTULO_AGENTE_PT[agente] ?? agente;
  if (agente === "dobutamine") {
    return `dose de ${rotulo} ausente — piso ${piso} pela presença do agente; qualquer dose de dobutamina é banda 2`;
  }
  if (agente === "dopamine") {
    return `dose de ${rotulo} ausente — piso ${piso} pela presença do agente; dose necessária para distinguir bandas 2/3/4`;
  }
  return `dose de ${rotulo} ausente — piso ${piso} pela presença do agente; dose necessária para distinguir banda 3 de 4`;
}

// ---------------------------------------------------------------------------
// Bandas — funções totais sobre valores em unidades canônicas (spec §4)
// ---------------------------------------------------------------------------

/** Respiratório: bandas cumulativas, mais alta satisfeita (§4.1). */
function bandaResp(ratio: number, suporteQualifica: boolean): number {
  if (ratio < 100 && suporteQualifica) return 4;
  if (ratio < 200 && suporteQualifica) return 3;
  if (ratio < 300) return 2;
  if (ratio < 400) return 1;
  return 0;
}

function bandaCoag(plaquetas: number): number {
  if (plaquetas < 20) return 4;
  if (plaquetas < 50) return 3;
  if (plaquetas < 100) return 2;
  if (plaquetas < 150) return 1;
  return 0;
}

function bandaLiver(bilirrubina: number): number {
  if (bilirrubina < 1.2) return 0;
  if (bilirrubina < 2.0) return 1;
  if (bilirrubina < 6.0) return 2;
  if (bilirrubina < 12.0) return 3;
  return 4;
}

function bandaCns(gcs: number): number {
  if (gcs < 6) return 4;
  if (gcs <= 9) return 3;
  if (gcs <= 12) return 2;
  if (gcs <= 14) return 1;
  return 0;
}

function bandaCreatinina(creatinina: number): number {
  if (creatinina < 1.2) return 0;
  if (creatinina < 2.0) return 1;
  if (creatinina < 3.5) return 2;
  if (creatinina < 5.0) return 3;
  return 4;
}

function bandaUrineOutput(mL24h: number): number {
  if (mL24h < 200) return 4;
  if (mL24h < 500) return 3;
  return 0;
}

/** Banda por dose de agente tabelado em µg/kg/min (§4.4; highest satisfied). */
function bandaDose(agente: string, dose: number): number {
  if (agente === "dopamine") {
    if (dose > 15) return 4;
    if (dose > 5) return 3;
    return 2;
  }
  if (agente === "dobutamine") return 2;
  // epinephrine / norepinephrine
  if (dose > 0.1) return 4;
  return 3;
}

// ---------------------------------------------------------------------------
// Pipeline de leitura por grupo de quantidades (ordem de precedência P-a)
// ---------------------------------------------------------------------------

type LeituraGrupo =
  | {
      readonly tipo: "ok";
      readonly valor: number;
      readonly tempoMs: number;
      readonly tempoIso: string;
      readonly idadeMin: number;
      readonly convertido: boolean;
    }
  | {
      readonly tipo: "invalido" | "stale" | "expirado" | "quarentena" | "tempo_ausente";
      readonly motivo: string;
    }
  | { readonly tipo: "ausente" };

type Conversor = (q: {
  value: number;
  unit: string;
}) =>
  | { ok: true; valor: number; convertido: boolean }
  | { ok: false; motivo: "unidade_inmapeavel" | "unidade_ausente" | "fora_da_faixa" };

/**
 * Resolve um grupo de observações da mesma grandeza: quarentena →
 * unidade/valor → tempo clínico → conflito simultâneo → atualidade →
 * pior-valor-em-janela (OQ-10 (a)). Falha-alto: qualquer insumo ofensor
 * envenena o componente — nunca é descartado para "salvar" a avaliação.
 */
function resolverGrupo(
  leituras: readonly SofaQuantityObservation[],
  componente: SofaComponentId,
  converter: Conversor,
  faixa: readonly [number, number],
  janelaMin: number,
  expiraMin: number,
  evaluationTimeMs: number,
  pior: (valor: number) => number,
): LeituraGrupo {
  if (leituras.length === 0) return { tipo: "ausente" };
  const longo = NOME_LONGO[componente];

  if (leituras.some((l) => l.provenance.sourceDataQuality === "quarantined")) {
    return { tipo: "quarentena", motivo: `quarantined_input:${longo}` };
  }

  const convertidas: { valor: number; tempoMs: number; tempoIso: string; convertido: boolean }[] =
    [];
  for (const leitura of leituras) {
    if (!Number.isFinite(leitura.value)) {
      return { tipo: "invalido", motivo: `implausible_value:${longo}` };
    }
    const conversao = converter({ value: leitura.value, unit: leitura.unit });
    if (!conversao.ok) {
      return { tipo: "invalido", motivo: `unmappable_unit:${longo}` };
    }
    const valorNormalizado = normalizar9(conversao.valor);
    if (valorNormalizado < faixa[0] || valorNormalizado > faixa[1]) {
      return { tipo: "invalido", motivo: `implausible_value:${longo}` };
    }
    const tempoMs = parseIsoTime(leitura.effectiveTime);
    if (tempoMs === null) {
      return { tipo: "tempo_ausente", motivo: `missing_clinical_time:${longo}` };
    }
    convertidas.push({
      valor: valorNormalizado,
      tempoMs,
      tempoIso: leitura.effectiveTime ?? "",
      convertido: conversao.convertido,
    });
  }

  // Conflito simultâneo: mesmo tempo clínico, valores distintos, sem
  // reconciliação — integridade real, nunca resolvida às cegas (§3.1).
  const grupos = new Map<number, Set<number>>();
  for (const c of convertidas) {
    const grupo = grupos.get(c.tempoMs) ?? new Set<number>();
    grupo.add(c.valor);
    grupos.set(c.tempoMs, grupo);
  }
  for (const valores of grupos.values()) {
    if (valores.size > 1) {
      return { tipo: "invalido", motivo: `conflicting_inputs:${longo}` };
    }
  }

  // Pior-valor-em-janela: seleção DEPOIS da triagem de validade (§4.0).
  const emJanela = convertidas.filter(
    (c) => evaluationTimeMs - c.tempoMs <= janelaMin * MINUTE_MS + EPS,
  );
  if (emJanela.length > 0) {
    const escolhida = [...emJanela].sort(
      (a, b) => pior(b.valor) - pior(a.valor) || b.tempoMs - a.tempoMs || b.valor - a.valor,
    )[0];
    if (escolhida === undefined) return { tipo: "ausente" };
    return {
      tipo: "ok",
      valor: escolhida.valor,
      tempoMs: escolhida.tempoMs,
      tempoIso: escolhida.tempoIso,
      idadeMin: Math.max(0, (evaluationTimeMs - escolhida.tempoMs) / MINUTE_MS),
      convertido: escolhida.convertido,
    };
  }

  // Nada em janela: a leitura mais recente decide stale vs expirado (§3.2).
  const maisRecente = [...convertidas].sort((a, b) => b.tempoMs - a.tempoMs)[0];
  if (maisRecente === undefined) return { tipo: "ausente" };
  const idadeMin = (evaluationTimeMs - maisRecente.tempoMs) / MINUTE_MS;
  if (idadeMin > expiraMin + EPS) {
    return { tipo: "expirado", motivo: `expired_input:${longo}` };
  }
  return { tipo: "stale", motivo: `stale_input:${longo}` };
}

// ---------------------------------------------------------------------------
// Gate de sedação — política conjunta GDEC-0007 OQ-8 (b) / ADR-0028 (espelho)
// ---------------------------------------------------------------------------

type GateSedacao =
  | { readonly estado: "testavel"; readonly rass: number }
  | { readonly estado: "sedation_confounded" }
  | { readonly estado: "sedation_state_unknown" };

function avaliarGateSedacao(
  rass: RassObservationInput | null | undefined,
  exposicao: SedativeExposureState,
  gcsTempoMs: number | null,
): GateSedacao {
  // Infusão sedativa ativa sem janela de interrupção documentada confunde
  // independentemente do RASS (§4.5; ADR-0028).
  if (exposicao === "active_infusion") return { estado: "sedation_confounded" };

  let rassPareado: number | null = null;
  if (rass !== null && rass !== undefined) {
    const dominioOk = Number.isInteger(rass.value) && rass.value >= -5 && rass.value <= 4;
    const rassMs = parseIsoTime(rass.effectiveTime);
    const pareado =
      dominioOk &&
      rassMs !== null &&
      gcsTempoMs !== null &&
      Math.abs(rassMs - gcsTempoMs) / MINUTE_MS <= PAREAMENTO_RASS_MIN + EPS;
    if (pareado) rassPareado = rass.value;
  }

  if (rassPareado === null) {
    // RASS ausente, sem tempo, fora do domínio ou não pareado: insumo de
    // gate ausente — FAIL-CLOSED (o default 0.1.0 foi REMOVIDO).
    return { estado: "sedation_state_unknown" };
  }
  if (rassPareado > RASS_LIMIAR_SEDACAO) return { estado: "testavel", rass: rassPareado };
  // RASS ≤ −3: ausência documentada de sedativos é coma genuíno; exposição
  // ativa-ou-desconhecida (e janela interrompida documentada) é confundida.
  if (exposicao === "none_active") return { estado: "testavel", rass: rassPareado };
  return { estado: "sedation_confounded" };
}

// ---------------------------------------------------------------------------
// Utilidades de componente
// ---------------------------------------------------------------------------

function contribuicao(
  component: SofaComponentId,
  status: EvaluationStatus,
  score: number | null,
  reason: string | null,
  flags: readonly string[],
  ageMinutes: number | null,
  explanation: string,
): SofaComponentContribution {
  return { component, status, score, reason, flags: [...flags], ageMinutes, explanation };
}

function falhaComponente(
  component: SofaComponentId,
  leitura: Exclude<LeituraGrupo, { tipo: "ok" } | { tipo: "ausente" }>,
  idadeMin: number | null,
): SofaComponentContribution {
  const status: EvaluationStatus =
    leitura.tipo === "invalido" ? "invalid" : leitura.tipo === "stale" ? "stale" : "not_evaluated";
  const detalhePt: Readonly<Record<string, string>> = {
    invalido: "falha de integridade do dado — o valor ofensor nunca é descartado silenciosamente",
    stale:
      "fora da janela de atualidade, dentro da expiração — último valor e idade exibidos; pontuação não legível",
    expirado:
      "além do horizonte de expiração — conclusão arbitrariamente velha não é conclusão degradada; é não-conclusão",
    quarentena:
      "fonte em quarentena — insumo de fonte quarentenada jamais contribui (regra das duas dimensões)",
    tempo_ausente:
      "sem tempo clínico utilizável — atualidade indemonstrável; nunca se assume 'agora' (DOM-0009)",
  };
  return contribuicao(
    component,
    status,
    null,
    leitura.motivo,
    [],
    idadeMin,
    `${ROTULO_COMPONENTE_PT[component]}: não avaliado (${leitura.motivo}) — ${detalhePt[leitura.tipo] ?? "condição não especificada"}.`,
  );
}

// ---------------------------------------------------------------------------
// Avaliador principal
// ---------------------------------------------------------------------------

/**
 * Avalia o SOFA de forma determinística e pura. Nunca lança para entradas
 * do tipo declarado: toda condição resolve para um status explícito com
 * razão (ADR-0008 N9 — não existe caminho "desconhecido → presumir bem").
 */
export function evaluateSofa(input: SofaEvaluationInput): SofaEvaluationRecord {
  const evaluationTimeMs = parseIsoTime(input.evaluationTime);
  const anotacoes: string[] = [];

  if (input.treatmentLimitationOrderDocumented === true) {
    anotacoes.push(SOFA_ANOTACAO_LIMITACAO_PT);
  }
  if (
    typeof input.chronicOrganDysfunctionNote === "string" &&
    input.chronicOrganDysfunctionNote.length > 0
  ) {
    anotacoes.push(
      `disfunção orgânica crônica documentada: ${input.chronicOrganDysfunctionNote} — o escore não afirma agudeza`,
    );
  }
  if (input.onRenalReplacementTherapy === true) {
    anotacoes.push(SOFA_ANOTACAO_TSR_PT);
  }

  // ---- Gate populacional PRIMEIRO (ADR-0027 Opção A; razões desta release).
  const gateIdade = evaluateAgeGate(input.age);
  if (!gateIdade.passed) {
    const motivo =
      gateIdade.reason === "unknown_age" ? "population_unverified" : "out_of_population_scope";
    const detalhePt =
      gateIdade.reason === "unknown_age"
        ? "idade desconhecida — nunca se presume adulto (HAZ-0036)"
        : "idade verificada abaixo de 18 anos — instrumento adulto (VAL-0006/VAL-0007)";
    return montarRegistroCurtoCircuitado(input, motivo, anotacoes, detalhePt);
  }
  if (evaluationTimeMs === null) {
    return montarRegistroCurtoCircuitado(
      input,
      "unspecified_condition",
      anotacoes,
      "instante de avaliação inválido ou ausente",
    );
  }

  const componentes: SofaComponentContribution[] = [];

  // ---- RESPIRATÓRIO (§4.1) -------------------------------------------------
  componentes.push(
    input.ecmo === true
      ? contribuicao(
          "resp",
          "not_evaluated",
          null,
          "pf_not_interpretable_on_ecmo",
          [],
          null,
          "respiratório: não avaliado — P/F não interpretável em oxigenação por membrana extracorpórea (VV-ECMO); demais componentes avaliam normalmente (OQ-11 (b)).",
        )
      : avaliarRespiratorio(input, evaluationTimeMs, anotacoes),
  );

  // ---- COAGULAÇÃO (§4.2) ---------------------------------------------------
  componentes.push(
    avaliarPorGrupo(
      "coag",
      input.platelets ?? [],
      paraPlaquetasContagem,
      FAIXA.plaquetas,
      JANELA.plaquetas.janelaMin,
      JANELA.plaquetas.expiraMin,
      evaluationTimeMs,
      bandaCoag,
      (v) => `plaquetas ${v} ×10³/µL`,
      anotacoes,
    ),
  );

  // ---- HEPÁTICO (§4.3) -----------------------------------------------------
  componentes.push(
    avaliarPorGrupo(
      "liver",
      input.bilirubin ?? [],
      paraBilirrubinaMgDl,
      FAIXA.bilirrubina,
      JANELA.bilirrubina.janelaMin,
      JANELA.bilirrubina.expiraMin,
      evaluationTimeMs,
      bandaLiver,
      (v) => `bilirrubina ${arredondarExibicao(v)} mg/dL`,
      anotacoes,
      (convertido) =>
        convertido ? "conversão de unidade aplicada: umol/L → mg/dL (÷17,104)" : null,
    ),
  );

  // ---- CARDIOVASCULAR (§4.4) ----------------------------------------------
  componentes.push(avaliarCardiovascular(input, evaluationTimeMs, anotacoes));

  // ---- NEUROLÓGICO (§4.5) --------------------------------------------------
  componentes.push(avaliarNeurologico(input, evaluationTimeMs));

  // ---- RENAL (§4.6) --------------------------------------------------------
  componentes.push(avaliarRenal(input, evaluationTimeMs, anotacoes));

  return agregar(input, componentes, anotacoes);
}

/** Guarda de formato numérico para exibição (nunca arredonda comparação). */
function arredondarExibicao(valor: number): number {
  return Math.round(valor * 1000) / 1000;
}

/**
 * Componente genérico de grupo único (coagulação, hepático): a leitura ok
 * bandaa e explica; leitura falha envenena; grupo ausente é
 * missing_required_input:<componente>.
 */
function avaliarPorGrupo(
  component: SofaComponentId,
  leituras: readonly SofaQuantityObservation[],
  converter: Conversor,
  faixa: readonly [number, number],
  janelaMin: number,
  expiraMin: number,
  evaluationTimeMs: number,
  banda: (valor: number) => number,
  descrever: (valor: number) => string,
  anotacoes: string[],
  anotacaoConversao?: (convertido: boolean) => string | null,
): SofaComponentContribution {
  const leitura = resolverGrupo(
    leituras,
    component,
    converter,
    faixa,
    janelaMin,
    expiraMin,
    evaluationTimeMs,
    banda,
  );
  if (leitura.tipo === "ausente") {
    return contribuicao(
      component,
      "not_evaluated",
      null,
      `missing_required_input:${component}`,
      [],
      null,
      `${ROTULO_COMPONENTE_PT[component]}: insumo ausente — nenhum valor foi aferido; ausência NUNCA é tratada como normal (HAZ-0005).`,
    );
  }
  if (leitura.tipo !== "ok") {
    return falhaComponente(component, leitura, null);
  }
  const anotacao = anotacaoConversao?.(leitura.convertido) ?? null;
  if (anotacao !== null) anotacoes.push(anotacao);
  const score = banda(leitura.valor);
  return contribuicao(
    component,
    "valid",
    score,
    null,
    leitura.convertido ? ["unit_conversion_applied"] : [],
    leitura.idadeMin,
    `${ROTULO_COMPONENTE_PT[component]}: ${descrever(leitura.valor)} → ${score} ponto(s) (especime ${leitura.tempoIso}).`,
  );
}

// ---------------------------------------------------------------------------
// Respiratório (§4.1)
// ---------------------------------------------------------------------------

function avaliarRespiratorio(
  input: SofaEvaluationInput,
  evaluationTimeMs: number,
  anotacoes: string[],
): SofaComponentContribution {
  const component: SofaComponentId = "resp";

  const pao2 = resolverGrupo(
    input.pao2 ?? [],
    component,
    paraPaO2MmHg,
    FAIXA.pao2,
    JANELA.pao2.janelaMin,
    JANELA.pao2.expiraMin,
    evaluationTimeMs,
    (v) => -v, // pior PaO2 = menor valor
  );
  const fio2Resolvido = resolverFio2(input.fio2 ?? []);

  if (pao2.tipo === "ausente" || fio2Resolvido === null) {
    return contribuicao(
      component,
      "not_evaluated",
      null,
      `missing_required_input:${component}`,
      [],
      null,
      `${ROTULO_COMPONENTE_PT[component]}: PaO2 e/ou FiO2 ausentes — a razão é incomputável; ausência NUNCA é tratada como normal (HAZ-0005).`,
    );
  }
  if (pao2.tipo !== "ok") return falhaComponente(component, pao2, null);
  if (fio2Resolvido.tipo !== "ok") {
    return falhaComponente(component, fio2Resolvido, null);
  }

  // Pareamento: FiO2 dentro de 30 min do espécime de PaO2 (§3.1 linha 3).
  const desvioMin = Math.abs(pao2.tempoMs - fio2Resolvido.tempoMs) / MINUTE_MS;
  if (desvioMin > PAREAMENTO_FIO2_MIN + EPS) {
    return contribuicao(
      component,
      "not_evaluated",
      null,
      "unpaired_fio2",
      [],
      null,
      `respiratório: FiO2 não pareada com o espécime de PaO2 (desvio de ${Math.round(desvioMin)} min > ${PAREAMENTO_FIO2_MIN} min) — a razão só é significativa para a FiO2 na hora da coleta.`,
    );
  }
  if (fio2Resolvido.convertido) {
    anotacoes.push("conversão de unidade aplicada: FiO2 % → fração (÷100)");
  }

  const ratio = razaoPF(pao2.valor, fio2Resolvido.fracao);

  // Suporte respiratório: exigido somente quando ratio < 200 (§4.1).
  if (ratio < 200) {
    const suporte = input.respiratorySupportStatus;
    if (suporte === undefined || suporte === null) {
      return contribuicao(
        component,
        "not_evaluated",
        null,
        "missing_required_input:respiratory_support_status",
        [],
        null,
        "respiratório: P/F < 200 e estado de suporte respiratório ausente — a regra nunca presume nenhuma direção (§4.1).",
      );
    }
    const suporteMs = parseIsoTime(suporte.effectiveTime);
    if (
      suporteMs === null ||
      pao2.tempoMs === null ||
      Math.abs(suporteMs - pao2.tempoMs) / MINUTE_MS > SUPORTE_CONTEMPORANEIDADE_MIN + EPS
    ) {
      return contribuicao(
        component,
        "stale",
        null,
        `stale_input:${NOME_LONGO[component]}`,
        [],
        null,
        "respiratório: estado de suporte respiratório fora da contemporaneidade de 1 h do espécime de PaO2 — pontuação não legível (§3.1 linha 4).",
      );
    }
    const qualifica =
      suporte.value === "invasive_mechanical_ventilation" || suporte.value === "niv_or_cpap";
    const score = bandaResp(ratio, qualifica);
    return contribuicao(
      component,
      "valid",
      score,
      null,
      [],
      pao2.idadeMin,
      `respiratório: PaO2/FiO2 ${arredondarExibicao(ratio)} mm[Hg] com ${qualifica ? "suporte qualificante (VMI ou VNI/CPAP)" : "sem suporte qualificante — bandas 3-4 exigem suporte (OQ-1/OQ-2)"} → ${score} ponto(s) (especime ${pao2.tempoIso}).`,
    );
  }

  const score = bandaResp(ratio, false);
  return contribuicao(
    component,
    "valid",
    score,
    null,
    [],
    pao2.idadeMin,
    `respiratório: PaO2/FiO2 ${arredondarExibicao(ratio)} mm[Hg] → ${score} ponto(s) (especime ${pao2.tempoIso}).`,
  );
}

type Fio2Resultado =
  | {
      readonly tipo: "ok";
      readonly fracao: number;
      readonly tempoMs: number;
      readonly tempoIso: string;
      readonly idadeMin: number;
      readonly convertido: boolean;
    }
  | { readonly tipo: "invalido" | "quarentena" | "tempo_ausente"; readonly motivo: string }
  | null;

/**
 * Resolve o grupo de FiO2 com a disciplina própria de unidade (nunca
 * adivinhar fração/percentual — CRV-SOFA-0330) e a melhor pareabilidade
 * (a leitura em janela mais recente; conflito simultâneo envenena).
 * Falhas DISTINTAS: unidade ausente/inmapeável ⇒ unmappable_unit (HAZ-0032);
 * valor fora da faixa com unidade LEGAL ⇒ implausible_value; quarentena e
 * tempo clínico ausente não são invalidade (§5.1).
 */
function resolverFio2(leituras: readonly SofaQuantityObservation[]): Fio2Resultado {
  if (leituras.length === 0) return null;
  if (leituras.some((l) => l.provenance.sourceDataQuality === "quarantined")) {
    return { tipo: "quarentena", motivo: "quarantined_input:respiration" };
  }
  const pares: { fracao: number; tempoMs: number; tempoIso: string; convertido: boolean }[] = [];
  for (const leitura of leituras) {
    if (!Number.isFinite(leitura.value)) {
      return { tipo: "invalido", motivo: "implausible_value:respiration" };
    }
    const conversao = paraFio2Fracao({ value: leitura.value, unit: leitura.unit });
    if (!conversao.ok) {
      // Ausente ou inmapeável: a MESMA recusa — nunca heurística ÷100 (0330).
      // Fora da faixa com unidade LEGAL é falha distinta: implausível.
      if (conversao.motivo === "fora_da_faixa") {
        return { tipo: "invalido", motivo: "implausible_value:respiration" };
      }
      return { tipo: "invalido", motivo: "unmappable_unit:respiration" };
    }
    const tempoMs = parseIsoTime(leitura.effectiveTime);
    if (tempoMs === null) {
      return { tipo: "tempo_ausente", motivo: "missing_clinical_time:respiration" };
    }
    pares.push({
      fracao: conversao.fracao,
      tempoMs,
      tempoIso: leitura.effectiveTime ?? "",
      convertido: conversao.convertido,
    });
  }
  const tempos = new Map<number, Set<number>>();
  for (const p of pares) {
    const conjunto = tempos.get(p.tempoMs) ?? new Set<number>();
    conjunto.add(p.fracao);
    tempos.set(p.tempoMs, conjunto);
  }
  for (const valores of tempos.values()) {
    if (valores.size > 1) {
      return { tipo: "invalido", motivo: "conflicting_inputs:respiration" };
    }
  }
  const escolhida = [...pares].sort((a, b) => b.tempoMs - a.tempoMs)[0];
  if (escolhida === undefined) return null;
  return { tipo: "ok", ...escolhida, idadeMin: 0 };
}

// ---------------------------------------------------------------------------
// Cardiovascular (§4.4)
// ---------------------------------------------------------------------------

function normalizarAgente(agent: string): string {
  const nome = agent.trim().toLowerCase();
  if (nome === "noradrenaline" || nome === "noradrenalina") return "norepinephrine";
  if (nome === "adrenaline" || nome === "adrenalina") return "epinephrine";
  return nome;
}

function avaliarCardiovascular(
  input: SofaEvaluationInput,
  evaluationTimeMs: number,
  anotacoes: string[],
): SofaComponentContribution {
  const component: SofaComponentId = "cv";
  const agentes = input.vasoactiveAgents ?? [];

  type FalhaCv = {
    readonly tipo: "invalido" | "stale" | "expirado" | "quarentena";
    readonly motivo: string;
  };
  const precedenciaTipo: Readonly<Record<FalhaCv["tipo"], number>> = {
    invalido: 0,
    expirado: 1,
    stale: 2,
    quarentena: 3,
  };
  let falha: FalhaCv | null = null;
  const registrarFalha = (candidata: FalhaCv): void => {
    if (falha === null || precedenciaTipo[candidata.tipo] < precedenciaTipo[falha.tipo]) {
      falha = candidata;
    }
  };

  let tierAcumulado = 0;
  let pisoPorAusenciaDeDose = false;
  let agenteNaoTabelado = false;
  let provisorio = false;
  let temAgenteAtivo = false;
  let maiorIdadeMin: number | null = null;

  for (const bruto of agentes) {
    if (bruto.provenance.sourceDataQuality === "quarantined") {
      registrarFalha({ tipo: "quarentena", motivo: "quarantined_input:cardiovascular" });
      continue;
    }
    const agente = normalizarAgente(bruto.agent);
    const tabelado = AGENTES_TABELADOS.includes(agente);

    // Recência da confirmação (§3.1 linha 9): janela 2 h, expiração 4 h.
    if (bruto.lastConfirmedAt !== null) {
      const confirmMs = parseIsoTime(bruto.lastConfirmedAt);
      if (confirmMs !== null) {
        const idadeMin = Math.max(0, (evaluationTimeMs - confirmMs) / MINUTE_MS);
        maiorIdadeMin = maiorIdadeMin === null ? idadeMin : Math.max(maiorIdadeMin, idadeMin);
        if (idadeMin > DOSE_CONFIRMACAO_EXPIRA_MIN + EPS) {
          registrarFalha({ tipo: "expirado", motivo: `expired_input:${NOME_LONGO[component]}` });
        } else if (idadeMin > DOSE_CONFIRMACAO_JANELA_MIN + EPS) {
          registrarFalha({ tipo: "stale", motivo: `stale_input:${NOME_LONGO[component]}` });
        }
      }
    }

    if (bruto.sustainedMinutes < 60) provisorio = true;

    if (!tabelado) {
      // Agente fora da tabela de 1996: piso 3 sinalizado (I-5, OQ-5 (b));
      // a dose de agente não tabelado não entra em banda alguma.
      agenteNaoTabelado = true;
      tierAcumulado = Math.max(tierAcumulado, 3);
      temAgenteAtivo = true;
      continue;
    }

    temAgenteAtivo = true;
    const piso = PISO_PRESENCA[agente] ?? 2;
    if (bruto.dose === null) {
      // Agente presente, dose ausente: piso por presença (GDEC-0007
      // princípio 2, confirmada GDEC-0008 item 4).
      tierAcumulado = Math.max(tierAcumulado, piso);
      pisoPorAusenciaDeDose = true;
      anotacoes.push(divulgacaoDoseAusentePt(agente, piso));
      continue;
    }
    const leituraDose = doseUgKgMinDe(bruto.dose);
    if (!leituraDose.ok) {
      if (leituraDose.motivo === "unidade_reconhecida_nao_normalizavel") {
        // Reconhecida, não normalizável sem peso + concentração (política
        // VALIDATION REQUIRED): dose não-usável ⇒ piso, não invalid (§4.4).
        tierAcumulado = Math.max(tierAcumulado, piso);
        pisoPorAusenciaDeDose = true;
        anotacoes.push(divulgacaoDoseAusentePt(agente, piso));
        continue;
      }
      registrarFalha({ tipo: "invalido", motivo: `unmappable_unit:${NOME_LONGO[component]}` });
      continue;
    }
    const faixaDose = FAIXA_DOSE[agente];
    if (faixaDose === undefined) {
      registrarFalha({ tipo: "invalido", motivo: `unmappable_unit:${NOME_LONGO[component]}` });
      continue;
    }
    const doseNormalizada = normalizar9(bruto.dose.value);
    if (doseNormalizada < faixaDose[0] || doseNormalizada > faixaDose[1]) {
      // Dose em janela fora da faixa plausível envenena o componente —
      // o piso repara ausência, nunca falha de integridade (§4.4).
      registrarFalha({ tipo: "invalido", motivo: `implausible_value:${NOME_LONGO[component]}` });
      continue;
    }
    // Dose usável: banda imediata (o piso jamais rebaixa escore por dose disponível).
    tierAcumulado = Math.max(tierAcumulado, bandaDose(agente, doseNormalizada));
  }

  if (falha !== null) {
    return falhaComponente(component, falha, maiorIdadeMin);
  }

  if (!temAgenteAtivo) {
    // Bandas 0/1: sem agente ativo, a PAM é obrigatória (§4.4).
    const pam = lerPam(input.map, evaluationTimeMs);
    if (pam.tipo === "ausente") {
      return contribuicao(
        component,
        "not_evaluated",
        null,
        `missing_required_input:${component}`,
        [],
        null,
        "cardiovascular: sem agente vasoativo ativo e PAM ausente — a PAM é obrigatória exatamente quando nenhum agente tabelado está ativo (§4.4).",
      );
    }
    if (pam.tipo !== "ok") {
      return falhaComponente(component, pam, null);
    }
    if (pam.derivada) anotacoes.push(SOFA_ANOTACAO_PAM_DERIVADA_PT);
    const score = pam.valor >= 70 ? 0 : 1;
    return contribuicao(
      component,
      "valid",
      score,
      null,
      pam.derivada ? ["derived_map"] : [],
      pam.idadeMin,
      `cardiovascular: PAM ${arredondarExibicao(pam.valor)} mm[Hg] sem vasoativo ativo → ${score} ponto(s) (especime ${pam.tempoIso}).`,
    );
  }

  // Agentes ativos: evidência positiva domina — bandas 2-4 não referenciam
  // PAM (D-07 corrigido). PAM presente é irrelevante para a banda (0313).
  if (agenteNaoTabelado) anotacoes.push(SOFA_ANOTACAO_AGENTE_NAO_TABELADO_PT);
  if (provisorio) anotacoes.push(SOFA_ANOTACAO_PROVISORIO_PT);
  const flags: string[] = [];
  if (agenteNaoTabelado) flags.push("vasoactive_agent_untabulated");
  if (pisoPorAusenciaDeDose) flags.push("dose_missing_agent_presence_floor");
  if (provisorio) flags.push("provisional_infusion_lt_1h");
  const score = tierAcumulado;
  return contribuicao(
    component,
    "valid",
    score,
    null,
    flags,
    maiorIdadeMin,
    `cardiovascular: tier ${score} pela combinação de agentes ativos (max de tiers e pisos; bandas 2-4 não referenciam PAM — D-07 corrigido).${provisorio ? " Tier PROVISÓRIO — infusão qualificante com menos de 1 h; nunca rebaixa, só eleva versus a leitura sem vasopressor (OQ-3 (b))." : ""}`,
  );
}

type PamLeitura =
  | {
      readonly tipo: "ok";
      readonly valor: number;
      readonly tempoMs: number;
      readonly tempoIso: string;
      readonly idadeMin: number;
      readonly derivada: boolean;
    }
  | {
      readonly tipo: "invalido" | "stale" | "expirado" | "quarentena" | "tempo_ausente";
      readonly motivo: string;
    }
  | { readonly tipo: "ausente" };

/** Lê a PAM medida (LOINC 8478-0) ou derivada de PAS/PAD (OQ-9 (a)). */
function lerPam(map: SofaMapObservation | null | undefined, evaluationTimeMs: number): PamLeitura {
  if (map === undefined || map === null) return { tipo: "ausente" };

  const validarSimples = (
    q: SofaQuantityObservation,
  ): { valor: number; tempoMs: number; tempoIso: string } | PamLeituraSemOk => {
    if (q.provenance.sourceDataQuality === "quarantined") {
      return { tipo: "quarentena", motivo: "quarantined_input:cardiovascular" };
    }
    if (!Number.isFinite(q.value)) {
      return { tipo: "invalido", motivo: "implausible_value:cardiovascular" };
    }
    if (q.unit !== "mm[Hg]") {
      return { tipo: "invalido", motivo: "unmappable_unit:cardiovascular" };
    }
    const tempoMs = parseIsoTime(q.effectiveTime);
    if (tempoMs === null) {
      return { tipo: "tempo_ausente", motivo: "missing_clinical_time:cardiovascular" };
    }
    return { valor: q.value, tempoMs, tempoIso: q.effectiveTime ?? "" };
  };

  if (map.kind === "measured") {
    const simples = validarSimples({
      value: map.value,
      unit: map.unit,
      effectiveTime: map.effectiveTime,
      provenance: map.provenance,
    });
    if ("tipo" in simples) return simples;
    const idadeMin = Math.max(0, (evaluationTimeMs - simples.tempoMs) / MINUTE_MS);
    if (idadeMin > JANELA.pam.expiraMin + EPS) {
      return { tipo: "expirado", motivo: "expired_input:cardiovascular" };
    }
    if (idadeMin > JANELA.pam.janelaMin + EPS) {
      return { tipo: "stale", motivo: "stale_input:cardiovascular" };
    }
    const valorNormalizado = normalizar9(map.value);
    if (valorNormalizado < FAIXA.pam[0] || valorNormalizado > FAIXA.pam[1]) {
      return { tipo: "invalido", motivo: "implausible_value:cardiovascular" };
    }
    return {
      tipo: "ok",
      valor: valorNormalizado,
      tempoMs: simples.tempoMs,
      tempoIso: simples.tempoIso,
      idadeMin,
      derivada: false,
    };
  }

  // Derivada: MAP = (SBP + 2×DBP)/3, fallback admitido com flag (OQ-9 (a)).
  const sbp = validarSimples(map.sbp);
  if ("tipo" in sbp) return sbp;
  const dbp = validarSimples(map.dbp);
  if ("tipo" in dbp) return dbp;
  const derivada = normalizar9((sbp.valor + 2 * dbp.valor) / 3);
  if (derivada < FAIXA.pam[0] || derivada > FAIXA.pam[1]) {
    return { tipo: "invalido", motivo: "implausible_value:cardiovascular" };
  }
  const tempoMs = Math.min(sbp.tempoMs, dbp.tempoMs);
  const idadeMin = Math.max(0, (evaluationTimeMs - tempoMs) / MINUTE_MS);
  if (idadeMin > JANELA.pam.expiraMin + EPS) {
    return { tipo: "expirado", motivo: "expired_input:cardiovascular" };
  }
  if (idadeMin > JANELA.pam.janelaMin + EPS) {
    return { tipo: "stale", motivo: "stale_input:cardiovascular" };
  }
  return {
    tipo: "ok",
    valor: derivada,
    tempoMs,
    tempoIso: sbp.tempoIso,
    idadeMin,
    derivada: true,
  };
}

type PamLeituraSemOk = {
  readonly tipo: "invalido" | "stale" | "expirado" | "quarentena" | "tempo_ausente";
  readonly motivo: string;
};

// ---------------------------------------------------------------------------
// Neurológico (§4.5)
// ---------------------------------------------------------------------------

function avaliarNeurologico(
  input: SofaEvaluationInput,
  evaluationTimeMs: number,
): SofaComponentContribution {
  const component: SofaComponentId = "cns";
  const gcs = input.gcsTotal;

  if (gcs === undefined || gcs === null) {
    return contribuicao(
      component,
      "not_evaluated",
      null,
      `missing_required_input:${component}`,
      [],
      null,
      "neurológico: GCS total ausente — componente E/V/M não testável não produz total; ausência NUNCA é tratada como normal (HAZ-0005).",
    );
  }
  if (gcs.provenance.sourceDataQuality === "quarantined") {
    return falhaComponente(
      component,
      { tipo: "quarentena", motivo: `quarantined_input:${NOME_LONGO[component]}` },
      null,
    );
  }
  if (gcs.unit !== "{score}" && gcs.unit !== "1") {
    return falhaComponente(
      component,
      { tipo: "invalido", motivo: `unmappable_unit:${NOME_LONGO[component]}` },
      null,
    );
  }
  if (!Number.isInteger(gcs.value) || gcs.value < FAIXA.gcs[0] || gcs.value > FAIXA.gcs[1]) {
    return falhaComponente(component, { tipo: "invalido", motivo: "out_of_range:cns" }, null);
  }
  const tempoMs = parseIsoTime(gcs.effectiveTime);
  if (tempoMs === null) {
    return falhaComponente(
      component,
      { tipo: "tempo_ausente", motivo: `missing_clinical_time:${NOME_LONGO[component]}` },
      null,
    );
  }
  const idadeMin = Math.max(0, (evaluationTimeMs - tempoMs) / MINUTE_MS);
  if (idadeMin > JANELA.gcs.expiraMin + EPS) {
    return falhaComponente(
      component,
      { tipo: "expirado", motivo: `expired_input:${NOME_LONGO[component]}` },
      idadeMin,
    );
  }
  if (idadeMin > JANELA.gcs.janelaMin + EPS) {
    return falhaComponente(
      component,
      { tipo: "stale", motivo: `stale_input:${NOME_LONGO[component]}` },
      idadeMin,
    );
  }

  // Gate de sedação fail-closed (I-8; política conjunta OQ-GCS-2 / A28-2).
  const gate = avaliarGateSedacao(input.rass, input.sedativeExposure, tempoMs);
  if (gate.estado === "sedation_state_unknown") {
    return contribuicao(
      component,
      "not_evaluated",
      null,
      "sedation_state_unknown:cns",
      [],
      idadeMin,
      "neurológico: estado de sedação desconhecido (RASS ausente, fora do domínio ou não pareado na janela de 60 min) — insumo de gate ausente; FAIL-CLOSED por decisão conjunta GDEC-0007 OQ-8 (b) / ADR-0028 A28-2 (o default 'escora com divulgação' foi removido).",
    );
  }
  if (gate.estado === "sedation_confounded") {
    return contribuicao(
      component,
      "not_evaluated",
      null,
      "sedation_confounded:cns",
      [],
      idadeMin,
      "neurológico: GCS confundido por sedação (RASS ≤ −3 com exposição sedativa ativa ou desconhecida, ou infusão sedativa ativa sem janela de interrupção documentada) — indistinguível de sedação profunda; nenhum total é emitido (§4.5 I-8).",
    );
  }

  const score = bandaCns(gcs.value);
  return contribuicao(
    component,
    "valid",
    score,
    null,
    [],
    idadeMin,
    `neurológico: GCS ${gcs.value} com RASS pareado ${gate.rass} (≥ −2, testável) → ${score} ponto(s) (especime ${gcs.effectiveTime ?? ""}).`,
  );
}

// ---------------------------------------------------------------------------
// Renal (§4.6) — pior-critério-disponível com parcial declarado (I-7)
// ---------------------------------------------------------------------------

function avaliarRenal(
  input: SofaEvaluationInput,
  evaluationTimeMs: number,
  anotacoes: string[],
): SofaComponentContribution {
  const component: SofaComponentId = "renal";

  const creatinina = resolverGrupo(
    input.creatinine ?? [],
    component,
    paraCreatininaMgDl,
    FAIXA.creatinina,
    JANELA.creatinina.janelaMin,
    JANELA.creatinina.expiraMin,
    evaluationTimeMs,
    bandaCreatinina,
  );
  const urina = lerUrina(input.urineOutput24h, evaluationTimeMs);

  const precedencia: Readonly<Record<string, number>> = {
    invalido: 0,
    expirado: 1,
    stale: 2,
    quarentena: 3,
    tempo_ausente: 4,
  };
  const falhas: { tipo: string; motivo: string }[] = [];
  if (creatinina.tipo !== "ok" && creatinina.tipo !== "ausente") {
    falhas.push({ tipo: creatinina.tipo, motivo: creatinina.motivo });
  }
  if (urina.tipo !== "ok" && urina.tipo !== "ausente") {
    falhas.push({ tipo: urina.tipo, motivo: urina.motivo });
  }
  if (falhas.length > 0) {
    falhas.sort((a, b) => (precedencia[a.tipo] ?? 9) - (precedencia[b.tipo] ?? 9));
    const pior = falhas[0];
    if (pior === undefined) {
      return contribuicao(
        component,
        "not_evaluated",
        null,
        "unspecified_condition",
        [],
        null,
        "renal: condição não especificada.",
      );
    }
    return falhaComponente(
      component,
      {
        tipo:
          pior.tipo === "invalido"
            ? "invalido"
            : pior.tipo === "stale"
              ? "stale"
              : pior.tipo === "expirado"
                ? "expirado"
                : pior.tipo === "quarentena"
                  ? "quarentena"
                  : "tempo_ausente",
        motivo: pior.motivo,
      },
      null,
    );
  }

  const creatOk = creatinina.tipo === "ok" ? creatinina : null;
  const urinaOk = urina.tipo === "ok" ? urina : null;

  if (creatOk === null && urinaOk === null) {
    return contribuicao(
      component,
      "not_evaluated",
      null,
      `missing_required_input:${component}`,
      [],
      null,
      "renal: creatinina e débito urinário ausentes — nenhum critério disponível; ausência NUNCA é tratada como normal (HAZ-0005).",
    );
  }

  const bandaCreat = creatOk === null ? null : bandaCreatinina(creatOk.valor);
  const bandaUrina = urinaOk === null ? null : bandaUrineOutput(urinaOk.valor);
  const score = Math.max(bandaCreat ?? -1, bandaUrina ?? -1);
  const detalhePt = [
    creatOk !== null
      ? `creatinina ${arredondarExibicao(creatOk.valor)} mg/dL → banda ${bandaCreat} (especime ${creatOk.tempoIso})`
      : null,
    urinaOk !== null
      ? `débito urinário ${arredondarExibicao(urinaOk.valor)} mL/24 h → banda ${bandaUrina} (intervalo até ${urinaOk.intervalEnd})`
      : null,
  ]
    .filter((x) => x !== null)
    .join("; ");
  if (creatOk?.convertido) {
    anotacoes.push("conversão de unidade aplicada: creatinina umol/L → mg/dL (÷88,42)");
  }

  if (creatOk !== null && urinaOk !== null) {
    const flags = input.onRenalReplacementTherapy === true ? ["on_rrt"] : [];
    return contribuicao(
      component,
      "valid",
      score,
      null,
      flags,
      Math.max(creatOk.idadeMin, urinaOk.idadeMin),
      `renal: pior-critério-disponível — ${detalhePt}; componente = max → ${score} ponto(s) (I-7, OQ-7 (b)).`,
    );
  }

  // Parcial declarado (a ÚNICA classe ratificada — GDEC-0007 OQ-7 (b)/A8-2):
  // escore do critério disponível, flag do critério ausente + divulgação de
  // limite inferior obrigatórias em toda exibição.
  const flags = ["renal_declared_partial"];
  if (input.onRenalReplacementTherapy === true) flags.push("on_rrt");
  let divulgação: string;
  if (creatOk === null) {
    flags.push("creatinine_not_assessed");
    divulgação = `creatinina não avaliada — ${SOFA_DIVULGACAO_RENAL_PT}`;
  } else {
    flags.push("urine_output_not_assessed");
    divulgação = `débito urinário não avaliado — ${SOFA_DIVULGACAO_RENAL_PT}`;
  }
  anotacoes.push(divulgação);
  return contribuicao(
    component,
    "partial",
    score,
    null,
    flags,
    creatOk !== null ? creatOk.idadeMin : (urinaOk?.idadeMin ?? null),
    `renal: PARCIAL DECLARADO — ${detalhePt}; componente = ${score} ponto(s) como LIMITE INFERIOR (${divulgação}; distingue da D-16 legado, que escorava sem marcador — OQ-7 (b)).`,
  );
}

type UrinaLeitura =
  | {
      readonly tipo: "ok";
      readonly valor: number;
      readonly intervalEnd: string;
      readonly idadeMin: number;
    }
  | {
      readonly tipo: "invalido" | "stale" | "expirado" | "quarentena" | "tempo_ausente";
      readonly motivo: string;
    }
  | { readonly tipo: "ausente" };

/** Lê o débito urinário por intervalo explícito (frescor pelo FIM do intervalo — §3.1 linha 14). */
function lerUrina(
  urina: SofaUrineOutputObservation | null | undefined,
  evaluationTimeMs: number,
): UrinaLeitura {
  if (urina === undefined || urina === null) return { tipo: "ausente" };
  if (urina.provenance.sourceDataQuality === "quarantined") {
    return { tipo: "quarentena", motivo: "quarantined_input:renal" };
  }
  if (urina.unit !== "mL") {
    return { tipo: "invalido", motivo: "unmappable_unit:renal" };
  }
  if (!Number.isFinite(urina.value)) {
    return { tipo: "invalido", motivo: "implausible_value:renal" };
  }
  const urinaNormalizada = normalizar9(urina.value);
  if (urinaNormalizada < FAIXA.urina[0] || urinaNormalizada > FAIXA.urina[1]) {
    return { tipo: "invalido", motivo: "implausible_value:renal" };
  }
  const fimMs = parseIsoTime(urina.intervalEnd);
  if (fimMs === null) {
    return { tipo: "tempo_ausente", motivo: "missing_clinical_time:renal" };
  }
  // Fim do intervalo depois de T: idade tratada como 0 (precedente NEWS2
  // GDEC-0015/0017 para tempo clínico futuro — caso não definido na spec).
  const idadeMin = Math.max(0, (evaluationTimeMs - fimMs) / MINUTE_MS);
  if (idadeMin > URINA_FIM_EXPIRA_MIN + EPS) {
    return { tipo: "expirado", motivo: "expired_input:renal" };
  }
  if (idadeMin > URINA_FIM_JANELA_MIN + EPS) {
    return { tipo: "stale", motivo: "stale_input:renal" };
  }
  return { tipo: "ok", valor: urinaNormalizada, intervalEnd: urina.intervalEnd, idadeMin };
}

// ---------------------------------------------------------------------------
// Agregação (§5) e explicação (§7)
// ---------------------------------------------------------------------------

function noFireReasonDe(status: EvaluationStatus, reasons: readonly string[]): SofaNoFireReason {
  if (status === "valid" || status === "partial") return "criteria_not_met";
  if (status === "invalid") return "invalid_data";
  if (reasons.some((r) => r.startsWith("stale_input:") || r.startsWith("expired_input:"))) {
    return "stale_data";
  }
  if (reasons.includes("population_unverified") || reasons.includes("out_of_population_scope")) {
    return "out_of_population_scope";
  }
  return "insufficient_data";
}

function agregar(
  input: SofaEvaluationInput,
  componentes: readonly SofaComponentContribution[],
  anotacoes: readonly string[],
): SofaEvaluationRecord {
  const reasons = componentes.filter((c) => c.reason !== null).map((c) => c.reason as string);

  // Álgebra do TOTAL (§5.2) — o total jamais herda `stale`: componente stale
  // não é legível ⇒ total not_evaluated (conclusão velha não é conclusão
  // degradada; §3.2). invalid > not_evaluated > partial > valid.
  const temInvalid = componentes.some((c) => c.status === "invalid");
  const temNaoLegivel = componentes.some(
    (c) => c.status === "invalid" || c.status === "not_evaluated" || c.status === "stale",
  );
  const temParcial = componentes.some((c) => c.status === "partial");
  const status: EvaluationStatus = temInvalid
    ? "invalid"
    : temNaoLegivel
      ? "not_evaluated"
      : temParcial
        ? "partial"
        : "valid";

  // Total somente com os seis componentes legíveis: valid, ou o parcial
  // declarado renal (§5.2 — nenhuma soma parcial genérica, jamais).
  let total: number | null = null;
  if (status === "valid" || status === "partial") {
    const scores = componentes.map((c) => c.score);
    if (scores.every((s) => s !== null)) {
      total = (scores as number[]).reduce((a, b) => a + b, 0);
    } else {
      // Defensivo: nunca deve ocorrer — um não-legível com status legível é
      // condição não especificada (§5.2 fallback).
      return montarRegistro(
        input,
        componentes,
        ["unspecified_condition"],
        "not_evaluated",
        null,
        anotacoes,
      );
    }
  }

  return montarRegistro(input, componentes, reasons, status, total, anotacoes);
}

function montarRegistro(
  input: SofaEvaluationInput,
  componentes: readonly SofaComponentContribution[],
  reasons: readonly string[],
  status: EvaluationStatus,
  total: number | null,
  anotacoes: readonly string[],
): SofaEvaluationRecord {
  const noFireReason = noFireReasonDe(status, reasons);
  const explanation = construirExplicacao(
    status,
    total,
    reasons,
    componentes,
    anotacoes,
    input.evaluationTime,
  );
  return {
    ruleId: SOFA_RULE_ID,
    ruleVersion: SOFA_RULE_VERSION,
    evaluationTime: input.evaluationTime,
    status,
    reasons: [...reasons],
    primaryReason: reasons[0] ?? null,
    total,
    components: [...componentes],
    populationGate:
      status === "not_evaluated" &&
      (reasons.includes("population_unverified") || reasons.includes("out_of_population_scope"))
        ? {
            passed: false,
            reason: reasons.includes("population_unverified") ? "unknown_age" : "under_age",
          }
        : { passed: true, reason: null },
    fires: false,
    noFireReason,
    annotations: [...anotacoes],
    explanation,
  };
}

/** Registro de curto-circuito do gate populacional ou de instante inválido. */
function montarRegistroCurtoCircuitado(
  input: SofaEvaluationInput,
  motivo: string,
  anotacoes: readonly string[],
  detalhePt: string,
): SofaEvaluationRecord {
  const componentes: SofaComponentContribution[] = SOFA_COMPONENT_ORDER.map((component) =>
    contribuicao(
      component,
      "not_evaluated",
      null,
      null,
      [],
      null,
      `não avaliado — ${detalhePt}; nenhuma lógica de regra executou (gate pré-avaliação, ADR-0027).`,
    ),
  );
  return montarRegistro(input, componentes, [motivo], "not_evaluated", null, anotacoes);
}

function construirExplicacao(
  status: EvaluationStatus,
  total: number | null,
  reasons: readonly string[],
  componentes: readonly SofaComponentContribution[],
  anotacoes: readonly string[],
  evaluationTime: string,
): string {
  const versao = "regra RULE-SOFA v0.2.0";
  if (status === "valid" || status === "partial") {
    const detalhe = componentes
      .map((c) => {
        const resumo = c.explanation
          .replace(`${ROTULO_COMPONENTE_PT[c.component]}: `, "")
          .replace(/\.$/, "");
        return `${ROTULO_COMPONENTE_PT[c.component]} ${c.score ?? "—"} (${resumo})`;
      })
      .join("; ");
    const maisAntigo = componentes.reduce<number | null>((mais, c) => {
      return c.ageMinutes !== null && (mais === null || c.ageMinutes > mais) ? c.ageMinutes : mais;
    }, null);
    const idade =
      maisAntigo !== null && Number.isFinite(maisAntigo)
        ? ` Insumo contribuinte mais antigo: ${Math.round(maisAntigo)} min.`
        : "";
    const divulgações = anotacoes.filter(
      (a) =>
        a.includes(SOFA_DIVULGACAO_RENAL_PT) ||
        a.includes("não tabelado") ||
        a.includes("provisório — infusão <1h") ||
        a.includes("piso pela presença") ||
        a.includes("ausente — piso"),
    );
    const divulgaçãoPt =
      divulgações.length > 0 ? ` ATENÇÃO: ${[...new Set(divulgações)].join(" ")}` : "";
    return (
      `Escore SOFA ${total} de 24 — ${versao}. Janela de avaliação: as 24 horas até ${evaluationTime}. ` +
      `Componentes: ${detalhe}.${idade}${divulgaçãoPt} ` +
      "O SOFA descreve disfunção orgânica; não é, por si só, diagnóstico de sepse e não distingue disfunção aguda de crônica. " +
      "Informação de apoio à decisão da equipe assistente — não é uma diretriz e não determina conduta."
    );
  }
  if (status === "invalid") {
    return (
      `Escore SOFA: inválido — falha de integridade de dado detectada (${reasons.join(", ") || "condição não especificada"}). ` +
      "Nenhuma pontuação existe para este paciente neste momento; a ausência de pontuação não significa normalidade. " +
      `Os sistemas avaliáveis são exibidos individualmente com seu próprio status. Informação de apoio apenas. ${versao}.`
    );
  }
  return (
    `Escore SOFA: não avaliado. O total não foi calculado porque: ${reasons.join(", ") || "condição não especificada"}. ` +
    "Nenhum número é exibido porque um total calculado sem esses sistemas orgânicos poderia gerar falsa tranquilidade. " +
    `O que falta para completar a avaliação: ${reasons.join(", ") || "condição não especificada"}. ` +
    `Informação de apoio apenas. ${versao}.`
  );
}

// Reexports de conveniência removidos de propósito: a superfície pública do
// kernel é `src/index.ts`, que exporta os tipos de `./types.js` em um único
// lugar — reexportar de aqui criaria duas rotas para o mesmo símbolo.
