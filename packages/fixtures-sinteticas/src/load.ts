/**
 * Carga do cenário SYNTH G7 num banco real (integração SPR-G7-2).
 *
 * A PENDÊNCIA registrada na fatia anterior ("este pacote não carrega o
 * cenário em nenhum banco") foi resolvida: as arestas workspace com
 * `@intensicare/dominio` e `@intensicare/persistencia` agora existem
 * (`pnpm-lock.yaml` atualizado) e esta função usa os repositórios REAIS —
 * mesma transação para fato clínico + evento de outbox (ADR-0010 B1),
 * RLS por tenant ativa em toda escrita.
 *
 * PREMISSA (reversível, GDEC-0015/0017): as observações do cenário são
 * carregadas com unidade de origem verbatim (ex.: "bpm", "rpm", "mmHg") e
 * SEM par canônico — mapear unidade para a UCUM normativa é decisão da
 * borda de ingestão/avaliação (apps/api), nunca deste pacote de dados.
 */
import type { PGlite } from "@electric-sql/pglite";
import {
  absentInstant,
  presentInstant,
  type TemporalValue,
} from "@intensicare/dominio";
import {
  insertBed,
  insertCareUnit,
  insertClinicalObservationWithOutbox,
  insertEncounter,
  insertOrganization,
  insertPatientIdentity,
  insertSourceEnvelope,
  withTenantTransaction,
} from "@intensicare/persistencia";
import { buildG7SyntheticScenario, type SyntheticG7Scenario } from "./scenario.js";

/** Instante presente com offset UTC explícito (dados sintéticos são gerados em UTC). */
function utcInstant(utc: string): TemporalValue {
  return presentInstant({ utc, offset: "+00:00", timezone: "Etc/UTC" });
}

export interface LoadedG7Scenario {
  readonly scenario: SyntheticG7Scenario;
  readonly tenantId: string;
  readonly sourceEnvelopeId: string;
}

/**
 * Semeia o cenário G7 completo (organização → UTI → 4 leitos → 2 pacientes
 * → 2 encontros → série de sinais vitais com envelope de origem + outbox)
 * num banco JÁ migrado e rebaixado (ver `bootstrapDatabase` em
 * `@intensicare/persistencia`). Idempotência não é objetivo aqui: chamar
 * duas vezes sobre o mesmo banco viola chaves primárias de propósito —
 * fixtures são semeadas exatamente uma vez por banco de dev/teste.
 */
export async function loadIntoDatabase(db: PGlite): Promise<LoadedG7Scenario> {
  const scenario = buildG7SyntheticScenario();
  const tenantId = scenario.organization.id;
  const sourceEnvelopeId = `${tenantId}-ENV-FIXTURES-01`;

  await withTenantTransaction(db, tenantId, async (tx) => {
    await insertOrganization(tx, {
      id: scenario.organization.id,
      tenantId,
      name: scenario.organization.name,
    });
    await insertCareUnit(tx, {
      id: scenario.careUnit.id,
      tenantId,
      organizationId: scenario.careUnit.organizationId,
      name: scenario.careUnit.name,
    });
    for (const bed of scenario.beds) {
      await insertBed(tx, { id: bed.id, tenantId, careUnitId: bed.careUnitId, code: bed.code });
    }
    for (const patient of scenario.patients) {
      await insertPatientIdentity(tx, { id: patient.id, tenantId, subjectRef: patient.subjectRef });
    }
    for (const encounter of scenario.encounters) {
      await insertEncounter(tx, {
        id: encounter.id,
        tenantId,
        patientId: encounter.patientId,
        bedId: encounter.bedId,
        admittedAt: utcInstant(encounter.admittedAtUtc),
      });
    }

    // Envelope de origem imutável: payload cru retido para replay (ADR-0005 M1).
    await insertSourceEnvelope(tx, {
      id: sourceEnvelopeId,
      tenantId,
      sourceSystem: "SYNTH-monitor-01",
      receivedAt: utcInstant(scenario.vitalSigns[0]?.observedAtUtc ?? "2026-08-16T10:00:00.000Z"),
      rawPayload: { vitalSigns: scenario.vitalSigns },
    });

    for (const vital of scenario.vitalSigns) {
      await insertClinicalObservationWithOutbox(
        tx,
        {
          id: vital.id,
          tenantId,
          subjectRef: vital.subjectRef,
          encounterId: vital.encounterId,
          concept: vital.concept,
          value: { sourceValue: vital.value, sourceUnit: vital.unit },
          quality: "valid",
          provenance: {
            sourceSystem: "SYNTH-monitor-01",
            sourceEnvelopeId,
            transformation: "none",
            mappingVersion: "SYNTH-map-0",
            collector: "fixtures-sinteticas",
          },
          observedAt: utcInstant(vital.observedAtUtc),
          effectiveAt: utcInstant(vital.observedAtUtc),
          issuedAt: absentInstant("nao_fornecido_pela_fonte_sintetica"),
          receivedAt: utcInstant(vital.observedAtUtc),
          persistedAt: utcInstant(vital.observedAtUtc),
        },
        `encounter:${vital.encounterId}`,
      );
    }
  });

  return { scenario, tenantId, sourceEnvelopeId };
}
