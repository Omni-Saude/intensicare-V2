/**
 * Cenário SYNTH completo da fatia G7 (SPR-G7-2): 1 organização, 1 UTI, 4
 * leitos, 2 pacientes sintéticos (SYNTH-P001 estável, SYNTH-P002 com série
 * de sinais vitais em deterioração) e um caso de insumo ausente (SpO2
 * faltando) para exercitar o caminho degradado.
 *
 * PREMISSA (reversível, GDEC-0014/0015/0017): os valores fisiológicos
 * abaixo são exemplos DIDÁTICOS escolhidos por plausibilidade — nenhum
 * escore clínico (NEWS2 ou outro) é calculado por este pacote. Computar
 * qualquer escore é responsabilidade futura de @intensicare/kernel-clinico
 * (hoje sem nenhuma regra clínica implementada) e exigiria ADR próprio.
 * Este módulo NÃO faz nenhuma alegação de efetividade clínica.
 *
 * Integração SPR-G7-2: a PENDÊNCIA anterior (sem arestas de dependência,
 * sem carga em banco) foi resolvida — este pacote agora declara
 * `@intensicare/dominio` e `@intensicare/persistencia` e oferece
 * `loadIntoDatabase(db)` em `./load.ts`, que semeia este cenário num banco
 * real usando os repositórios reais (fato + outbox na mesma transação).
 * Os tipos `Synthetic*` abaixo permanecem locais DE PROPÓSITO: são a forma
 * declarativa e serializável do cenário (instantes como strings UTC), não
 * o modelo de domínio — a tradução para os tipos de `@intensicare/dominio`
 * (com `TemporalValue` explícito) acontece exclusivamente em `load.ts`.
 */
import {
  generateSyntheticPsr,
  generateSyntheticTenantId,
  SYNTHETIC_MARKER,
} from "./synthetic-identifiers.js";

export interface SyntheticOrganization {
  readonly id: string;
  readonly name: string;
}

export interface SyntheticCareUnit {
  readonly id: string;
  readonly organizationId: string;
  readonly name: string;
}

export interface SyntheticBed {
  readonly id: string;
  readonly careUnitId: string;
  readonly code: string;
}

export interface SyntheticPatient {
  readonly id: string;
  /** Forma de portable_subject_ref (PSR) — sempre carrega o marcador SYNTH-. */
  readonly subjectRef: string;
  /** Rótulo didático (ex.: "SYNTH-P001") — nunca um nome real. */
  readonly displayLabel: string;
}

export interface SyntheticEncounter {
  readonly id: string;
  readonly patientId: string;
  readonly bedId: string;
  readonly admittedAtUtc: string;
}

/** Um ponto de sinal vital sintético — unidade de origem sempre explícita. */
export interface SyntheticVitalSignObservation {
  readonly id: string;
  readonly encounterId: string;
  readonly subjectRef: string;
  readonly concept: string;
  readonly value: number;
  readonly unit: string;
  readonly observedAtUtc: string;
}

/**
 * Caso de insumo ausente para o caminho degradado: no instante indicado,
 * `missingConcept` NÃO foi recebido da fonte (ex.: sensor de SpO2
 * desconectado) — mesmo com os demais sinais em `otherObservationsPresent`
 * disponíveis e preocupantes. Um avaliador correto NUNCA trata esta
 * ausência como normal/zero/no-fire silencioso (DOM-0004; regra
 * não-negociável §3-7 do prompt; HAZ-0005) — este é exatamente o cenário
 * que esse comportamento incorreto reproduziria se reintroduzido.
 */
export interface SyntheticMissingInputCase {
  readonly description: string;
  readonly encounterId: string;
  readonly subjectRef: string;
  readonly missingConcept: string;
  readonly observedAtUtc: string;
  readonly otherObservationsPresent: readonly SyntheticVitalSignObservation[];
}

export interface SyntheticG7Scenario {
  readonly organization: SyntheticOrganization;
  readonly careUnit: SyntheticCareUnit;
  readonly beds: readonly SyntheticBed[];
  readonly patients: readonly SyntheticPatient[];
  readonly encounters: readonly SyntheticEncounter[];
  /** Série completa (P001 estável + P002 em deterioração) — inclui todos os conceitos SEMPRE recebidos. */
  readonly vitalSigns: readonly SyntheticVitalSignObservation[];
  readonly missingInputCase: SyntheticMissingInputCase;
}

/** Conceitos sintéticos usados nesta fatia — nunca um código de terminologia real. */
export const SYNTHETIC_CONCEPTS = {
  respiratoryRate: "SYNTH-CONCEPT-RESP-RATE",
  oxygenSaturation: "SYNTH-CONCEPT-SPO2",
  heartRate: "SYNTH-CONCEPT-HEART-RATE",
  systolicBloodPressure: "SYNTH-CONCEPT-SBP",
  temperature: "SYNTH-CONCEPT-TEMPERATURE",
} as const;

const TENANT_SUFFIX = "G7";

/**
 * Constrói o cenário SYNTH completo da fatia G7, de forma determinística
 * (mesmos IDs e valores a cada chamada — sem aleatoriedade, para que os
 * testes que o consomem sejam reprodutíveis).
 */
export function buildG7SyntheticScenario(): SyntheticG7Scenario {
  const organizationId = generateSyntheticTenantId(TENANT_SUFFIX);
  const careUnitId = `${organizationId}-UTI-01`;

  const organization: SyntheticOrganization = {
    id: organizationId,
    name: "Organização Sintética G7",
  };
  const careUnit: SyntheticCareUnit = { id: careUnitId, organizationId, name: "UTI Sintética G7" };

  const beds: SyntheticBed[] = [1, 2, 3, 4].map((n) => ({
    id: `${careUnitId}-LEITO-0${n}`,
    careUnitId,
    code: `0${n}`,
  }));

  const patientP001: SyntheticPatient = {
    id: `${organizationId}-PAT-P001`,
    subjectRef: generateSyntheticPsr("P001"),
    displayLabel: `${SYNTHETIC_MARKER}P001`,
  };
  const patientP002: SyntheticPatient = {
    id: `${organizationId}-PAT-P002`,
    subjectRef: generateSyntheticPsr("P002"),
    displayLabel: `${SYNTHETIC_MARKER}P002`,
  };
  const patients: readonly SyntheticPatient[] = [patientP001, patientP002];

  const encounterP001: SyntheticEncounter = {
    id: `${organizationId}-ENC-P001`,
    patientId: patientP001.id,
    // beds[0] existe sempre — o array é construído com exatamente 4 elementos, dois acima.
    bedId: beds[0]!.id,
    admittedAtUtc: "2026-08-16T08:00:00.000Z",
  };
  const encounterP002: SyntheticEncounter = {
    id: `${organizationId}-ENC-P002`,
    patientId: patientP002.id,
    bedId: beds[1]!.id,
    admittedAtUtc: "2026-08-16T09:00:00.000Z",
  };
  const encounters: readonly SyntheticEncounter[] = [encounterP001, encounterP002];

  let nextObservationSuffix = 0;
  function observation(
    encounterId: string,
    subjectRef: string,
    concept: string,
    value: number,
    unit: string,
    observedAtUtc: string,
  ): SyntheticVitalSignObservation {
    nextObservationSuffix += 1;
    return {
      id: `${organizationId}-OBS-${String(nextObservationSuffix).padStart(3, "0")}`,
      encounterId,
      subjectRef,
      concept,
      value,
      unit,
      observedAtUtc,
    };
  }

  // SYNTH-P001 — estável, um único ponto dentro de faixa fisiológica normal
  // (exemplo didático; nenhuma alegação clínica).
  const p001Vitals: readonly SyntheticVitalSignObservation[] = [
    observation(
      encounterP001.id,
      patientP001.subjectRef,
      SYNTHETIC_CONCEPTS.respiratoryRate,
      16,
      "rpm",
      "2026-08-16T10:00:00.000Z",
    ),
    observation(
      encounterP001.id,
      patientP001.subjectRef,
      SYNTHETIC_CONCEPTS.oxygenSaturation,
      98,
      "%",
      "2026-08-16T10:00:00.000Z",
    ),
    observation(
      encounterP001.id,
      patientP001.subjectRef,
      SYNTHETIC_CONCEPTS.heartRate,
      78,
      "bpm",
      "2026-08-16T10:00:00.000Z",
    ),
    observation(
      encounterP001.id,
      patientP001.subjectRef,
      SYNTHETIC_CONCEPTS.systolicBloodPressure,
      118,
      "mmHg",
      "2026-08-16T10:00:00.000Z",
    ),
    observation(
      encounterP001.id,
      patientP001.subjectRef,
      SYNTHETIC_CONCEPTS.temperature,
      36.8,
      "Cel",
      "2026-08-16T10:00:00.000Z",
    ),
  ];

  // SYNTH-P002 — três instantes em deterioração progressiva (exemplo
  // didático de valores que, sob um escore por bandas do tipo NEWS2, se
  // aproximam e cruzam faixas de alto risco no terceiro instante — nenhum
  // escore é calculado aqui, ver premissa no topo do arquivo).
  const p002T0 = "2026-08-16T10:00:00.000Z";
  const p002T1 = "2026-08-16T10:30:00.000Z";
  const p002T2 = "2026-08-16T11:00:00.000Z";
  const p002Vitals: readonly SyntheticVitalSignObservation[] = [
    // T0 — levemente alterado.
    observation(
      encounterP002.id,
      patientP002.subjectRef,
      SYNTHETIC_CONCEPTS.respiratoryRate,
      20,
      "rpm",
      p002T0,
    ),
    observation(
      encounterP002.id,
      patientP002.subjectRef,
      SYNTHETIC_CONCEPTS.oxygenSaturation,
      95,
      "%",
      p002T0,
    ),
    observation(
      encounterP002.id,
      patientP002.subjectRef,
      SYNTHETIC_CONCEPTS.heartRate,
      92,
      "bpm",
      p002T0,
    ),
    observation(
      encounterP002.id,
      patientP002.subjectRef,
      SYNTHETIC_CONCEPTS.systolicBloodPressure,
      112,
      "mmHg",
      p002T0,
    ),
    observation(
      encounterP002.id,
      patientP002.subjectRef,
      SYNTHETIC_CONCEPTS.temperature,
      37.0,
      "Cel",
      p002T0,
    ),
    // T1 — piorando.
    observation(
      encounterP002.id,
      patientP002.subjectRef,
      SYNTHETIC_CONCEPTS.respiratoryRate,
      24,
      "rpm",
      p002T1,
    ),
    observation(
      encounterP002.id,
      patientP002.subjectRef,
      SYNTHETIC_CONCEPTS.oxygenSaturation,
      91,
      "%",
      p002T1,
    ),
    observation(
      encounterP002.id,
      patientP002.subjectRef,
      SYNTHETIC_CONCEPTS.heartRate,
      108,
      "bpm",
      p002T1,
    ),
    observation(
      encounterP002.id,
      patientP002.subjectRef,
      SYNTHETIC_CONCEPTS.systolicBloodPressure,
      100,
      "mmHg",
      p002T1,
    ),
    observation(
      encounterP002.id,
      patientP002.subjectRef,
      SYNTHETIC_CONCEPTS.temperature,
      37.8,
      "Cel",
      p002T1,
    ),
    // T2 — cruza a faixa de alto risco nos parâmetros abaixo (didático).
    observation(
      encounterP002.id,
      patientP002.subjectRef,
      SYNTHETIC_CONCEPTS.respiratoryRate,
      26,
      "rpm",
      p002T2,
    ),
    observation(
      encounterP002.id,
      patientP002.subjectRef,
      SYNTHETIC_CONCEPTS.oxygenSaturation,
      89,
      "%",
      p002T2,
    ),
    observation(
      encounterP002.id,
      patientP002.subjectRef,
      SYNTHETIC_CONCEPTS.heartRate,
      122,
      "bpm",
      p002T2,
    ),
    observation(
      encounterP002.id,
      patientP002.subjectRef,
      SYNTHETIC_CONCEPTS.systolicBloodPressure,
      92,
      "mmHg",
      p002T2,
    ),
    observation(
      encounterP002.id,
      patientP002.subjectRef,
      SYNTHETIC_CONCEPTS.temperature,
      38.3,
      "Cel",
      p002T2,
    ),
  ];

  // T3 — caso de insumo ausente: SpO2 não chega da fonte, mas os demais
  // sinais (piores que T2) continuam presentes. Caminho degradado: nenhum
  // consumidor pode tratar a ausência de SpO2 como "normal" nem completar
  // um escore com um valor inventado.
  const p002T3 = "2026-08-16T11:30:00.000Z";
  const otherObservationsAtT3: readonly SyntheticVitalSignObservation[] = [
    observation(
      encounterP002.id,
      patientP002.subjectRef,
      SYNTHETIC_CONCEPTS.respiratoryRate,
      27,
      "rpm",
      p002T3,
    ),
    observation(
      encounterP002.id,
      patientP002.subjectRef,
      SYNTHETIC_CONCEPTS.heartRate,
      128,
      "bpm",
      p002T3,
    ),
    observation(
      encounterP002.id,
      patientP002.subjectRef,
      SYNTHETIC_CONCEPTS.systolicBloodPressure,
      90,
      "mmHg",
      p002T3,
    ),
    observation(
      encounterP002.id,
      patientP002.subjectRef,
      SYNTHETIC_CONCEPTS.temperature,
      38.5,
      "Cel",
      p002T3,
    ),
  ];

  const missingInputCase: SyntheticMissingInputCase = {
    description:
      "SYNTH-P002 em 2026-08-16T11:30:00.000Z: SpO2 não recebido da fonte (sensor sintético desconectado) " +
      "enquanto FR/FC/PAS/Temp continuam presentes e piores que no instante anterior — caso didático do " +
      "caminho degradado (DOM-0004): a ausência de SpO2 deve permanecer explícita, nunca virar 0/normal/no-fire silencioso.",
    encounterId: encounterP002.id,
    subjectRef: patientP002.subjectRef,
    missingConcept: SYNTHETIC_CONCEPTS.oxygenSaturation,
    observedAtUtc: p002T3,
    otherObservationsPresent: otherObservationsAtT3,
  };

  return {
    organization,
    careUnit,
    beds,
    patients,
    encounters,
    vitalSigns: [...p001Vitals, ...p002Vitals],
    missingInputCase,
  };
}
