import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { absentInstant, isAbsentInstant, isPresentInstant, presentInstant } from "./time.js";

describe("time (TemporalValue) — ausência é sempre explícita (DOM-0009)", () => {
  it("presentInstant produz um valor kind=present preservando utc e offset", () => {
    const value = presentInstant({ utc: "2026-08-16T12:00:00.000Z", offset: "-03:00" });
    expect(isPresentInstant(value)).toBe(true);
    expect(isAbsentInstant(value)).toBe(false);
    if (isPresentInstant(value)) {
      expect(value.instant.utc).toBe("2026-08-16T12:00:00.000Z");
      expect(value.instant.offset).toBe("-03:00");
    }
  });

  it("absentInstant produz um valor kind=absent com motivo obrigatório — nunca um instante fabricado", () => {
    const value = absentInstant("timestamp_nao_recebido_da_fonte");
    expect(isAbsentInstant(value)).toBe(true);
    expect(isPresentInstant(value)).toBe(false);
    if (isAbsentInstant(value)) {
      expect(value.absent.reason).toBe("timestamp_nao_recebido_da_fonte");
    }
  });

  it("preserva precisão, valor-fonte cru e fuso quando fornecidos (ADR-0005 M3)", () => {
    const value = presentInstant({
      utc: "2026-08-16T12:00:00.000Z",
      offset: "-03:00",
      precision: "second",
      sourceValue: "2026-08-16T09:00:00-03:00",
      timezone: "America/Sao_Paulo",
    });
    expect(isPresentInstant(value)).toBe(true);
    if (isPresentInstant(value)) {
      expect(value.instant.precision).toBe("second");
      expect(value.instant.sourceValue).toBe("2026-08-16T09:00:00-03:00");
      expect(value.instant.timezone).toBe("America/Sao_Paulo");
    }
  });

  it("propriedade: isPresentInstant/isAbsentInstant são mutuamente exclusivos para qualquer instante ou motivo", () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.record({
            utc: fc
              .date({ min: new Date(0), max: new Date(4102444800000), noInvalidDate: true })
              .map((d) => d.toISOString()),
            offset: fc.constantFrom("-03:00", "+00:00", "-05:00", "+09:00"),
          }),
          fc.constant(undefined),
        ),
        fc.string({ minLength: 1 }),
        (instant, reason) => {
          const value = instant === undefined ? absentInstant(reason) : presentInstant(instant);
          expect(isPresentInstant(value)).toBe(!isAbsentInstant(value));
        },
      ),
    );
  });
});
