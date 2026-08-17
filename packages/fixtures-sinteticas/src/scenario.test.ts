import { describe, expect, it } from "vitest";
import { buildG7SyntheticScenario, SYNTHETIC_CONCEPTS } from "./scenario.js";
import { SYNTHETIC_MARKER } from "./synthetic-identifiers.js";

const REAL_PSR_PATTERN =
  /^amh:psr:v1:(?!SYNTH-)[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

/**
 * Mesmo corpo de `REAL_PSR_PATTERN`, SEM âncoras: `^...$` só casa quando a
 * cadeia inteira é o PSR, então o padrão ancorado não serve para varrer um
 * campo composto nem o cenário serializado.
 */
const REAL_PSR_EM_QUALQUER_POSICAO =
  /amh:psr:v1:(?!SYNTH-)[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/;

const CPF_FORMATADO = /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/;

/**
 * Coleta TODA cadeia do objeto, em qualquer profundidade, com o caminho até
 * ela — para que a falha aponte o campo, não "algum lugar do JSON".
 */
function coletarCadeias(valor: unknown, caminho = "$"): readonly (readonly [string, string])[] {
  if (typeof valor === "string") return [[caminho, valor] as const];
  if (Array.isArray(valor)) {
    return valor.flatMap((item, i) => coletarCadeias(item, `${caminho}[${i}]`));
  }
  if (valor !== null && typeof valor === "object") {
    return Object.entries(valor).flatMap(([chave, item]) =>
      coletarCadeias(item, `${caminho}.${chave}`),
    );
  }
  return [];
}

describe("buildG7SyntheticScenario — cenário SYNTH completo da fatia G7", () => {
  it("produz 1 organização, 1 UTI e exatamente 4 leitos", () => {
    const scenario = buildG7SyntheticScenario();
    expect(scenario.organization.id).toMatch(/^SYNTH-TENANT-G7$/);
    expect(scenario.careUnit.organizationId).toBe(scenario.organization.id);
    expect(scenario.beds).toHaveLength(4);
    for (const bed of scenario.beds) {
      expect(bed.careUnitId).toBe(scenario.careUnit.id);
    }
    // 4 leitos, códigos distintos.
    expect(new Set(scenario.beds.map((b) => b.code)).size).toBe(4);
  });

  it("produz exatamente 2 pacientes sintéticos, SYNTH-P001 e SYNTH-P002, cada um com PSR marcado", () => {
    const scenario = buildG7SyntheticScenario();
    expect(scenario.patients).toHaveLength(2);
    expect(scenario.patients.map((p) => p.displayLabel)).toEqual(["SYNTH-P001", "SYNTH-P002"]);
    for (const patient of scenario.patients) {
      expect(patient.subjectRef.startsWith("amh:psr:v1:")).toBe(true);
      expect(patient.subjectRef).toContain(SYNTHETIC_MARKER);
      expect(patient.subjectRef).not.toMatch(REAL_PSR_PATTERN);
    }
  });

  it("cada paciente tem exatamente um encontro, e os dois encontros usam leitos distintos", () => {
    const scenario = buildG7SyntheticScenario();
    expect(scenario.encounters).toHaveLength(2);
    const bedIds = scenario.encounters.map((e) => e.bedId);
    expect(new Set(bedIds).size).toBe(2);
    for (const encounter of scenario.encounters) {
      const patient = scenario.patients.find((p) => p.id === encounter.patientId);
      expect(patient).toBeDefined();
    }
  });

  it("SYNTH-P001 tem sinais vitais em faixa estável (um único instante, cinco conceitos)", () => {
    const scenario = buildG7SyntheticScenario();
    const p001 = scenario.patients[0];
    if (p001 === undefined) throw new Error("esperava SYNTH-P001");
    const p001Vitals = scenario.vitalSigns.filter((v) => v.subjectRef === p001.subjectRef);
    expect(p001Vitals).toHaveLength(5);
    const concepts = new Set(p001Vitals.map((v) => v.concept));
    expect(concepts.size).toBe(5);
  });

  it("SYNTH-P002 tem série de sinais vitais em deterioração progressiva ao longo de três instantes", () => {
    const scenario = buildG7SyntheticScenario();
    const p002 = scenario.patients[1];
    if (p002 === undefined) throw new Error("esperava SYNTH-P002");
    const p002Vitals = scenario.vitalSigns.filter((v) => v.subjectRef === p002.subjectRef);
    expect(p002Vitals).toHaveLength(15); // 3 instantes x 5 conceitos

    const byConceptOverTime = (concept: string) =>
      p002Vitals
        .filter((v) => v.concept === concept)
        .sort((a, b) => a.observedAtUtc.localeCompare(b.observedAtUtc))
        .map((v) => v.value);

    // Deterioração didática: FR e FC sobem, SpO2 e PAS caem, ao longo do tempo.
    const respiratoryRate = byConceptOverTime(SYNTHETIC_CONCEPTS.respiratoryRate);
    const oxygenSaturation = byConceptOverTime(SYNTHETIC_CONCEPTS.oxygenSaturation);
    const heartRate = byConceptOverTime(SYNTHETIC_CONCEPTS.heartRate);
    const systolicBloodPressure = byConceptOverTime(SYNTHETIC_CONCEPTS.systolicBloodPressure);

    expect(respiratoryRate).toEqual([...respiratoryRate].sort((a, b) => a - b));
    expect(oxygenSaturation).toEqual([...oxygenSaturation].sort((a, b) => b - a));
    expect(heartRate).toEqual([...heartRate].sort((a, b) => a - b));
    expect(systolicBloodPressure).toEqual([...systolicBloodPressure].sort((a, b) => b - a));

    // Último instante didaticamente cruza uma faixa de alto risco comum (documentado — nenhum escore é calculado aqui).
    expect(oxygenSaturation.at(-1)).toBeLessThan(92);
    expect(respiratoryRate.at(-1)).toBeGreaterThanOrEqual(25);
  });

  it("o caso de insumo ausente tem SpO2 faltando enquanto os demais sinais (piores) permanecem presentes", () => {
    const scenario = buildG7SyntheticScenario();
    const p002 = scenario.patients[1];
    if (p002 === undefined) throw new Error("esperava SYNTH-P002");

    expect(scenario.missingInputCase.missingConcept).toBe(SYNTHETIC_CONCEPTS.oxygenSaturation);
    expect(scenario.missingInputCase.subjectRef).toBe(p002.subjectRef);
    expect(scenario.missingInputCase.encounterId).toBe(
      scenario.encounters.find((e) => e.patientId === p002.id)?.id,
    );

    const concepts = scenario.missingInputCase.otherObservationsPresent.map((o) => o.concept);
    expect(concepts).not.toContain(SYNTHETIC_CONCEPTS.oxygenSaturation);
    expect(concepts).toHaveLength(4);

    // O instante do caso ausente é estritamente posterior ao último instante da série normal.
    const p002Vitals = scenario.vitalSigns.filter((v) => v.subjectRef === p002.subjectRef);
    const lastRegularInstant = p002Vitals
      .map((v) => v.observedAtUtc)
      .sort()
      .at(-1);
    expect(lastRegularInstant).toBeDefined();
    expect(scenario.missingInputCase.observedAtUtc > (lastRegularInstant ?? "")).toBe(true);
  });

  it("nenhum identificador do cenário se parece com um PSR real ou um CPF formatado", () => {
    const scenario = buildG7SyntheticScenario();

    // O NOME promete "nenhum identificador do CENÁRIO"; a asserção cobria
    // apenas `patients[].subjectRef`, e a varredura serializada testava CPF
    // mas NÃO o padrão de PSR real. Um `subjectRef` real em
    // `vitalSigns[]`, `missingInputCase` ou `encounters[]` passava.
    const allSubjectRefs = scenario.patients.map((p) => p.subjectRef);
    expect(allSubjectRefs.length).toBeGreaterThan(0);
    for (const ref of allSubjectRefs) {
      expect(ref).not.toMatch(REAL_PSR_PATTERN);
    }

    // Varredura de TODA cadeia do cenário, em qualquer profundidade.
    const cadeias = coletarCadeias(scenario);
    expect(
      cadeias.length,
      "nenhuma cadeia foi coletada do cenário — a varredura não olhou nada",
    ).toBeGreaterThan(allSubjectRefs.length);
    for (const [caminho, valor] of cadeias) {
      expect(valor, `PSR com forma real em ${caminho}`).not.toMatch(REAL_PSR_EM_QUALQUER_POSICAO);
      expect(valor, `CPF formatado em ${caminho}`).not.toMatch(CPF_FORMATADO);
    }

    const serialized = JSON.stringify(scenario);
    expect(serialized).not.toMatch(/\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/);
    // A varredura serializada agora cobre TAMBÉM o padrão de PSR real, que é
    // o que o nome do teste promete e o que faltava.
    expect(serialized).not.toMatch(REAL_PSR_EM_QUALQUER_POSICAO);
  });

  it("é determinístico: duas chamadas produzem exatamente o mesmo cenário", () => {
    const first = buildG7SyntheticScenario();
    const second = buildG7SyntheticScenario();
    expect(JSON.stringify(second)).toBe(JSON.stringify(first));
  });
});
