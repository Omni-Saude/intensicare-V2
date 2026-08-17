/**
 * packages/observabilidade/src/telemetry.ts — vocabulário de telemetria
 * compatível com OpenTelemetry, SEM depender do SDK.
 *
 * SOURCE (ADR-0020 O1): "Traces, métricas e logs estruturados são emitidos
 * pela API OpenTelemetry (semântica OTel...). Nenhum backend/coletor é
 * selecionado aqui (matéria do ADR-0019)."
 *
 * O que "compatível" significa e o que NÃO significa
 * ---------------------------------------------------
 * SIGNIFICA: os conceitos e a forma dos dados são os do modelo OTel —
 * instrumentos `counter`/`up_down_counter`/`histogram` com unidade e
 * atributos; spans com `traceId`/`spanId`/`parentSpanId`, atributos, eventos
 * e status; registros de log com `severityNumber`/`severityText` e atributos.
 * Um adaptador para `@opentelemetry/api` é mecânico quando a plataforma for
 * decidida (ADR-0019), e o código instrumentado não muda.
 *
 * NÃO SIGNIFICA: que existe exportação, coletor, amostragem, propagação de
 * contexto entre processos (W3C traceparent), agregação temporal ou qualquer
 * backend. Nada disso existe aqui. Esta camada é a API de emissão mais um
 * coletor em memória para teste (ADR-0020 O1, premissa: "em dev/teste,
 * exportadores em memória/console").
 *
 * IDs de trace/span desta implementação são gerados por `node:crypto` no
 * formato hex de 16/32 caracteres do OTel; eles NÃO são propagados por
 * cabeçalho — a correlação HTTP existente hoje é o `x-correlation-id` que
 * `apps/api/src/routes.ts` já ecoa, e ligar os dois é trabalho de integração
 * ainda não feito (ver pendências).
 */
import { randomBytes } from "node:crypto";
import type {
  CounterName,
  HistogramName,
  LogEvent,
  SpanName,
  UpDownCounterName,
} from "./metric-catalog.js";
import {
  assertSafeAttributes,
  type ControlledLabel,
  type FailureCategory,
  type SafeCount,
  type SafeDepth,
  type SafeMeasurement,
  type TelemetryAttributes,
} from "./redaction.js";

// ---------------------------------------------------------------------------
// Relógio injetado — nenhuma unidade deste pacote lê o relógio do sistema
// ---------------------------------------------------------------------------

/**
 * Fonte de tempo monotônica/epoch em milissegundos, injetada. Mesma
 * disciplina do kernel clínico (`packages/kernel-clinico`: "SEM relógio
 * interno; todo tempo entra por parâmetro") — sem isso, sonda e latência
 * viram teste dependente de relógio real.
 */
export type Clock = () => number;

export const systemClock: Clock = () => Date.now();

// ---------------------------------------------------------------------------
// Métricas
// ---------------------------------------------------------------------------

export interface Meter {
  /** Instrumento monotônico (`counter`). */
  readonly add: (name: CounterName, value: SafeCount, attributes?: TelemetryAttributes) => void;
  /** Instrumento não monotônico (`up_down_counter`) — aceita delta negativo. */
  readonly adjust: (
    name: UpDownCounterName,
    delta: SafeCount | SafeDepth,
    attributes?: TelemetryAttributes,
  ) => void;
  /** Instrumento de distribuição (`histogram`). */
  readonly record: (
    name: HistogramName,
    value: SafeMeasurement,
    attributes?: TelemetryAttributes,
  ) => void;
}

// ---------------------------------------------------------------------------
// Traces
// ---------------------------------------------------------------------------

export type SpanStatus = "unset" | "ok" | "error";

export interface SpanEvent {
  readonly name: ControlledLabel;
  readonly timeMs: number;
  readonly attributes: TelemetryAttributes;
}

export interface Span {
  readonly traceId: string;
  readonly spanId: string;
  readonly name: SpanName;
  readonly setAttribute: (key: string, value: TelemetryAttributes[string]) => void;
  readonly addEvent: (name: ControlledLabel, attributes?: TelemetryAttributes) => void;
  /**
   * Status de erro exige uma CATEGORIA fechada — nunca a mensagem da
   * exceção, que é o vetor clássico de PHI em trace (uma exceção de
   * validação costuma conter o valor recusado).
   */
  readonly setStatus: (status: SpanStatus, errorCategory?: FailureCategory) => void;
  readonly end: () => void;
}

export interface StartSpanOptions {
  readonly attributes?: TelemetryAttributes;
  readonly parent?: Pick<Span, "traceId" | "spanId">;
}

export interface Tracer {
  readonly startSpan: (name: SpanName, options?: StartSpanOptions) => Span;
}

// ---------------------------------------------------------------------------
// Logs
// ---------------------------------------------------------------------------

/** Severidades do modelo de log OTel usadas nesta fatia, com o número OTel. */
export const LOG_SEVERITIES = {
  debug: 5,
  info: 9,
  warn: 13,
  error: 17,
} as const;

export type LogSeverity = keyof typeof LOG_SEVERITIES;

export interface Logger {
  readonly emit: (severity: LogSeverity, event: LogEvent, attributes?: TelemetryAttributes) => void;
}

// ---------------------------------------------------------------------------
// Fachada
// ---------------------------------------------------------------------------

export interface Telemetry {
  readonly meter: Meter;
  readonly tracer: Tracer;
  readonly logger: Logger;
  readonly clock: Clock;
}

// ---------------------------------------------------------------------------
// Implementação nula — a perda de observabilidade nunca derruba o laço clínico
// ---------------------------------------------------------------------------

/**
 * SOURCE (ADR-0020 §7): "telemetria é degradável sem afetar o laço clínico
 * (perda de observabilidade é, ela mesma, um estado degradado O5 e nunca
 * derruba avaliação)". A implementação nula existe para que essa frase seja
 * uma propriedade do código: o consumidor recebe sempre um `Telemetry`
 * válido, e a ausência de coletor é configuração, não `if (telemetry)`
 * espalhado pelo laço clínico.
 *
 * A validação de redação CONTINUA ativa aqui de propósito: um atributo com
 * forma de PHI deve falhar no teste mesmo quando o coletor é nulo — do
 * contrário o defeito só apareceria em produção, onde o coletor é real.
 */
export function createNoopTelemetry(clock: Clock = systemClock): Telemetry {
  const meter: Meter = {
    add(_name, _value, attributes) {
      assertSafeAttributes(attributes);
    },
    adjust(_name, _delta, attributes) {
      assertSafeAttributes(attributes);
    },
    record(_name, _value, attributes) {
      assertSafeAttributes(attributes);
    },
  };

  const tracer: Tracer = {
    startSpan(name, options) {
      assertSafeAttributes(options?.attributes);
      const traceId = options?.parent?.traceId ?? newTraceId();
      const spanId = newSpanId();
      return {
        traceId,
        spanId,
        name,
        setAttribute(key, value) {
          assertSafeAttributes({ [key]: value });
        },
        addEvent(_eventName, attributes) {
          assertSafeAttributes(attributes);
        },
        setStatus() {
          /* nada a registrar */
        },
        end() {
          /* nada a registrar */
        },
      };
    },
  };

  const logger: Logger = {
    emit(_severity, _event, attributes) {
      assertSafeAttributes(attributes);
    },
  };

  return { meter, tracer, logger, clock };
}

export function newTraceId(): string {
  return randomBytes(16).toString("hex");
}

export function newSpanId(): string {
  return randomBytes(8).toString("hex");
}
