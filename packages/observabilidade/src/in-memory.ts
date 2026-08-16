/**
 * packages/observabilidade/src/in-memory.ts — coletor em memória.
 *
 * SOURCE (ADR-0020 §8, V1): "Medições O2 existem e são corretas — testes de
 * instrumentação com exportador em memória (red/green)". SOURCE (ADR-0020 O1,
 * PREMISSA): "em dev/teste, exportadores em memória/console; nenhum
 * agente/coletor externo na construção".
 *
 * Este coletor é o instrumento do TESTE, não da produção: ele acumula
 * indefinidamente, não agrega por janela temporal e não exporta. Um coletor
 * de produção é matéria do ADR-0019 e não existe.
 */
import type {
  CounterName,
  HistogramName,
  LogEvent,
  MetricName,
  SpanName,
  UpDownCounterName,
} from "./metric-catalog.js";
import {
  assertSafeAttributes,
  type ControlledLabel,
  type FailureCategory,
  type TelemetryAttributes,
} from "./redaction.js";
import {
  type Clock,
  LOG_SEVERITIES,
  type Logger,
  type LogSeverity,
  type Meter,
  newSpanId,
  newTraceId,
  type Span,
  type SpanEvent,
  type SpanStatus,
  systemClock,
  type Telemetry,
  type Tracer,
} from "./telemetry.js";

/** Valor de atributo já materializado (o brand não sobrevive à compilação). */
export type PlainAttributes = Readonly<Record<string, string | number | boolean>>;

export interface MetricPoint {
  readonly name: MetricName;
  readonly attributes: PlainAttributes;
  /** Soma acumulada para counter/up_down_counter; ignorado em histograma. */
  readonly value: number;
  /** Amostras para histograma; vazio para os demais instrumentos. */
  readonly samples: readonly number[];
}

export interface RecordedSpan {
  readonly traceId: string;
  readonly spanId: string;
  readonly parentSpanId: string | null;
  readonly name: SpanName;
  readonly startTimeMs: number;
  readonly endTimeMs: number | null;
  readonly attributes: PlainAttributes;
  readonly events: readonly SpanEvent[];
  readonly status: SpanStatus;
  readonly errorCategory: FailureCategory | null;
}

export interface RecordedLog {
  readonly severityText: LogSeverity;
  readonly severityNumber: number;
  readonly event: LogEvent;
  readonly timeMs: number;
  readonly attributes: PlainAttributes;
}

export interface TelemetrySnapshot {
  readonly counters: readonly MetricPoint[];
  readonly upDownCounters: readonly MetricPoint[];
  readonly histograms: readonly MetricPoint[];
  readonly spans: readonly RecordedSpan[];
  readonly logs: readonly RecordedLog[];
}

export interface InMemoryTelemetry extends Telemetry {
  readonly snapshot: () => TelemetrySnapshot;
  readonly reset: () => void;
}

function attributeKeyOf(name: string, attributes: PlainAttributes): string {
  const parts = Object.keys(attributes)
    .sort()
    .map((key) => `${key}=${String(attributes[key])}`);
  return `${name}|${parts.join(",")}`;
}

function toPlain(attributes: TelemetryAttributes | undefined): PlainAttributes {
  const plain: Record<string, string | number | boolean> = {};
  if (attributes === undefined) return plain;
  for (const [key, value] of Object.entries(attributes)) {
    plain[key] = value as unknown as string | number | boolean;
  }
  return plain;
}

interface MutablePoint {
  name: MetricName;
  attributes: PlainAttributes;
  value: number;
  samples: number[];
}

export function createInMemoryTelemetry(clock: Clock = systemClock): InMemoryTelemetry {
  let counters = new Map<string, MutablePoint>();
  let upDownCounters = new Map<string, MutablePoint>();
  let histograms = new Map<string, MutablePoint>();
  let spans: RecordedSpan[] = [];
  let logs: RecordedLog[] = [];

  function upsert(
    store: Map<string, MutablePoint>,
    name: MetricName,
    attributes: TelemetryAttributes | undefined,
    delta: number,
    sample: number | null,
  ): void {
    // A validação de redação acontece ANTES de qualquer gravação: uma
    // emissão recusada não deixa resíduo no coletor.
    assertSafeAttributes(attributes);
    const plain = toPlain(attributes);
    const key = attributeKeyOf(name, plain);
    const existing = store.get(key);
    if (existing === undefined) {
      store.set(key, {
        name,
        attributes: plain,
        value: delta,
        samples: sample === null ? [] : [sample],
      });
      return;
    }
    existing.value += delta;
    if (sample !== null) existing.samples.push(sample);
  }

  const meter: Meter = {
    add(name: CounterName, value, attributes) {
      upsert(counters, name, attributes, value as unknown as number, null);
    },
    adjust(name: UpDownCounterName, delta, attributes) {
      upsert(upDownCounters, name, attributes, delta as unknown as number, null);
    },
    record(name: HistogramName, value, attributes) {
      const numeric = value as unknown as number;
      upsert(histograms, name, attributes, numeric, numeric);
    },
  };

  const tracer: Tracer = {
    startSpan(name, options) {
      assertSafeAttributes(options?.attributes);
      const traceId = options?.parent?.traceId ?? newTraceId();
      const spanId = newSpanId();
      const attributes: Record<string, string | number | boolean> = {
        ...toPlain(options?.attributes),
      };
      const events: SpanEvent[] = [];
      let status: SpanStatus = "unset";
      let errorCategory: FailureCategory | null = null;
      const startTimeMs = clock();
      let ended = false;

      const span: Span = {
        traceId,
        spanId,
        name,
        setAttribute(key, value) {
          assertSafeAttributes({ [key]: value });
          attributes[key] = value as unknown as string | number | boolean;
        },
        addEvent(eventName: ControlledLabel, eventAttributes) {
          assertSafeAttributes(eventAttributes);
          events.push({
            name: eventName,
            timeMs: clock(),
            attributes: (eventAttributes ?? {}) as TelemetryAttributes,
          });
        },
        setStatus(next, category) {
          status = next;
          errorCategory = category ?? null;
        },
        end() {
          if (ended) return;
          ended = true;
          spans.push({
            traceId,
            spanId,
            parentSpanId: options?.parent?.spanId ?? null,
            name,
            startTimeMs,
            endTimeMs: clock(),
            attributes,
            events,
            status,
            errorCategory,
          });
        },
      };
      return span;
    },
  };

  const logger: Logger = {
    emit(severity, event, attributes) {
      assertSafeAttributes(attributes);
      logs.push({
        severityText: severity,
        severityNumber: LOG_SEVERITIES[severity],
        event,
        timeMs: clock(),
        attributes: toPlain(attributes),
      });
    },
  };

  return {
    meter,
    tracer,
    logger,
    clock,
    snapshot(): TelemetrySnapshot {
      const freeze = (store: Map<string, MutablePoint>): MetricPoint[] =>
        [...store.values()].map((point) => ({
          name: point.name,
          attributes: { ...point.attributes },
          value: point.value,
          samples: [...point.samples],
        }));
      return {
        counters: freeze(counters),
        upDownCounters: freeze(upDownCounters),
        histograms: freeze(histograms),
        spans: spans.map((span) => ({ ...span })),
        logs: logs.map((log) => ({ ...log })),
      };
    },
    reset(): void {
      counters = new Map();
      upDownCounters = new Map();
      histograms = new Map();
      spans = [];
      logs = [];
    },
  };
}

// ---------------------------------------------------------------------------
// Leituras derivadas — o que a fase 8 pediu, calculado do snapshot
// ---------------------------------------------------------------------------

function matches(point: MetricPoint, filter: PlainAttributes | undefined): boolean {
  if (filter === undefined) return true;
  return Object.entries(filter).every(([key, value]) => point.attributes[key] === value);
}

function allPoints(snapshot: TelemetrySnapshot): readonly MetricPoint[] {
  return [...snapshot.counters, ...snapshot.upDownCounters, ...snapshot.histograms];
}

/** Soma de um instrumento, opcionalmente filtrada por atributos. */
export function metricTotal(
  snapshot: TelemetrySnapshot,
  name: MetricName,
  filter?: PlainAttributes,
): number {
  return allPoints(snapshot)
    .filter((point) => point.name === name && matches(point, filter))
    .reduce((sum, point) => sum + point.value, 0);
}

/** Todas as amostras de um histograma, na ordem de gravação por série. */
export function histogramSamples(
  snapshot: TelemetrySnapshot,
  name: HistogramName,
  filter?: PlainAttributes,
): readonly number[] {
  return snapshot.histograms
    .filter((point) => point.name === name && matches(point, filter))
    .flatMap((point) => point.samples);
}

/** Contagem corrente de itens de trabalho por estado (ADR-0009). */
export function workItemCountsByState(
  snapshot: TelemetrySnapshot,
): Readonly<Record<string, number>> {
  const result: Record<string, number> = {};
  for (const point of snapshot.upDownCounters) {
    if (point.name !== "intensicare.clinical.work_item.current") continue;
    const state = point.attributes.state;
    if (typeof state !== "string") continue;
    result[state] = (result[state] ?? 0) + point.value;
  }
  return result;
}

/** Falhas acumuladas por categoria. */
export function failuresByCategory(snapshot: TelemetrySnapshot): Readonly<Record<string, number>> {
  const result: Record<string, number> = {};
  for (const point of snapshot.counters) {
    if (point.name !== "intensicare.ops.failure.total") continue;
    const category = point.attributes.category;
    if (typeof category !== "string") continue;
    result[category] = (result[category] ?? 0) + point.value;
  }
  return result;
}

/** Profundidade corrente do outbox (soma de todos os escopos de ordenação). */
export function outboxDepth(snapshot: TelemetrySnapshot): number {
  return metricTotal(snapshot, "intensicare.backbone.outbox.depth");
}

export interface MissingInputRate {
  readonly missingInputs: number;
  readonly evaluations: number;
  /** `null` quando não houve avaliação: taxa sem denominador é indefinida, não zero. */
  readonly rate: number | null;
}

/**
 * Taxa de insumo ausente. Retorna `null` — não `0` — quando não houve
 * avaliação nenhuma: taxa zero e taxa indefinida significam coisas
 * clinicamente diferentes, e colapsar as duas é exatamente o atalho que o
 * DOM-0004/§3-7 proíbe no dado clínico. A mesma disciplina vale para o
 * indicador operacional.
 */
export function missingInputRate(snapshot: TelemetrySnapshot): MissingInputRate {
  const missingInputs = metricTotal(
    snapshot,
    "intensicare.clinical.evaluation.missing_input.total",
  );
  const evaluations = metricTotal(snapshot, "intensicare.clinical.evaluation.total");
  return {
    missingInputs,
    evaluations,
    rate: evaluations === 0 ? null : missingInputs / evaluations,
  };
}

/**
 * Serializa TODA a telemetria acumulada. Existe para o teste de
 * não-vazamento: a asserção "nenhum identificador sintético atravessa" só é
 * honesta se varrer todas as superfícies de uma vez, e não só a que o autor
 * do teste lembrou de conferir.
 */
export function serializeSnapshot(snapshot: TelemetrySnapshot): string {
  return JSON.stringify(snapshot);
}
