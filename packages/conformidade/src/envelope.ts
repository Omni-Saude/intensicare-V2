/**
 * Envelope mínimo de 11 campos dos eventos de ciclo de vida de identidade
 * (SOURCE: `docs/08-interoperability/amh-data/contract-v1/eventos-ciclo-de-vida-identidade.md`
 * §2) e sua leitura NÃO-COERCITIVA.
 *
 * Três regras materializadas aqui, todas de
 * `docs/08-interoperability/conformance/contract-v1/mapeamento-semantico.md` §2:
 *
 * 1. **Envelope retido imutável** — o texto recebido é preservado
 *    literalmente; a leitura nunca reescreve o original.
 * 2. **Jamais coerção** — campo ausente, nulo ou malformado vira estado
 *    explícito, nunca default. Em particular, `ausente` e `null` são
 *    estados DISTINTOS (perda L-08 do mapeamento semântico: colapsar os
 *    dois transforma defeito de produtor em fato).
 * 3. **Tolerant reader que NOTA** — campo adicional desconhecido não
 *    invalida (invariante 6) mas é retido e CONTADO (deriva D3).
 *
 * Nenhuma alegação de efetividade clínica é feita por este módulo.
 */

/** Os seis tipos da minuta (N-8 = 6 tipos, premissa vigente por GDEC-0015). */
export const IDENTITY_EVENT_TYPES = [
  "identity.alias.v1",
  "identity.merge.v1",
  "identity.unmerge.v1",
  "identity.restore.v1",
  "identity.reassignment.v1",
  "identity.erasure.v1",
] as const;

export type IdentityEventType = (typeof IDENTITY_EVENT_TYPES)[number];

/** Versão de esquema de envelope reconhecida pelo consumidor (contrato v1). */
export const SUPPORTED_EVENT_TYPE_VERSION = "1" as const;

/** Campos obrigatórios do envelope mínimo (cardinalidade 1..1). */
export const REQUIRED_ENVELOPE_FIELDS = [
  "event_id",
  "event_type",
  "event_type_version",
  "idempotency_key",
  "amh_tenant",
  "legal_entity",
  "subject_ref_antiga",
  "occurred_at",
  "emitted_at",
] as const;

/** Campos opcionais do envelope mínimo (cardinalidade 0..1). */
export const OPTIONAL_ENVELOPE_FIELDS = ["subject_ref_nova", "correction_of"] as const;

export const ENVELOPE_FIELDS = [...REQUIRED_ENVELOPE_FIELDS, ...OPTIONAL_ENVELOPE_FIELDS] as const;

/**
 * Nomes de campo que, se aparecerem no envelope, carregam identificador de
 * fonte cru — proibidos pela invariante 1 (AQ-4/XRD-05). A lista é do lado
 * consumidor e deliberadamente conservadora: a proibição é de CONTEÚDO, e
 * a regra de tolerant reader NÃO se aplica a ela.
 */
export const RAW_SOURCE_IDENTIFIER_FIELDS = [
  "raw_source_identifier",
  "mpi_id",
  "cpf",
  "cns",
  "prontuario",
  "medical_record_number",
  "patient_identifier",
] as const;

/**
 * Prefixos de VALOR que denunciam identificador de fonte, mesmo em campo de
 * nome inocente. O valor em si nunca é reproduzido em relatório
 * (quarentena de acesso segregado — CTS-20).
 */
export const RAW_SOURCE_IDENTIFIER_VALUE_PREFIXES = ["cpf:", "cns:", "mpi:", "mrn:"] as const;

/** Forma exigida do PSR opaco: `amh:psr:v1:<...>`. */
export const PSR_PREFIX = "amh:psr:v1:" as const;

/**
 * Estado de um campo opcional, com `null` afirmado distinto de ausente
 * (perda L-08). Nenhum código deste pacote pode colapsar os dois.
 */
export type OptionalFieldState<T> =
  | { readonly kind: "present"; readonly value: T }
  | { readonly kind: "null-asserted" }
  | { readonly kind: "absent" };

export interface ParsedEnvelope {
  /** Texto recebido, byte a byte — base do replay (DOM-0006). */
  readonly raw: string;
  /** Objeto lido; `null` quando o texto não é um objeto JSON. */
  readonly fields: Readonly<Record<string, unknown>> | null;
  readonly jsonError?: string;
  /** Campos do envelope mínimo efetivamente presentes. */
  readonly presentFields: readonly string[];
  /** Campos obrigatórios ausentes (nem chave presente). */
  readonly missingRequiredFields: readonly string[];
  /**
   * Campos adicionais desconhecidos, RETIDOS e contados (invariante 6 +
   * deriva D3). Inclui o bloco `_fixture` das fixtures — que é
   * precisamente o que exercita a invariante 6 hoje.
   */
  readonly unknownFields: readonly string[];
  readonly subjectRefNova: OptionalFieldState<string | null>;
  readonly correctionOf: OptionalFieldState<string | null>;
}

function readString(fields: Record<string, unknown>, key: string): string | undefined {
  const value = fields[key];
  return typeof value === "string" ? value : undefined;
}

function readOptional(
  fields: Record<string, unknown>,
  key: string,
): OptionalFieldState<string | null> {
  if (!(key in fields)) return { kind: "absent" };
  const value = fields[key];
  if (value === null) return { kind: "null-asserted" };
  if (typeof value === "string") return { kind: "present", value };
  // Tipo inesperado: NÃO se coage para string nem se trata como ausente.
  return { kind: "present", value: null };
}

/**
 * Lê o envelope sem coagir nada. Um texto inválido produz
 * `fields: null` + `jsonError`, jamais uma exceção que interrompa o
 * harness.
 */
export function parseEnvelope(raw: string): ParsedEnvelope {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    return {
      raw,
      fields: null,
      jsonError: error instanceof Error ? error.message : String(error),
      presentFields: [],
      missingRequiredFields: [...REQUIRED_ENVELOPE_FIELDS],
      unknownFields: [],
      subjectRefNova: { kind: "absent" },
      correctionOf: { kind: "absent" },
    };
  }

  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return {
      raw,
      fields: null,
      jsonError: "o envelope não é um objeto JSON",
      presentFields: [],
      missingRequiredFields: [...REQUIRED_ENVELOPE_FIELDS],
      unknownFields: [],
      subjectRefNova: { kind: "absent" },
      correctionOf: { kind: "absent" },
    };
  }

  const fields = parsed as Record<string, unknown>;
  const known = new Set<string>(ENVELOPE_FIELDS);
  const presentFields = ENVELOPE_FIELDS.filter((name) => name in fields);
  const missingRequiredFields = REQUIRED_ENVELOPE_FIELDS.filter((name) => !(name in fields));
  const unknownFields = Object.keys(fields).filter((name) => !known.has(name));

  return {
    raw,
    fields,
    presentFields,
    missingRequiredFields,
    unknownFields,
    subjectRefNova: readOptional(fields, "subject_ref_nova"),
    correctionOf: readOptional(fields, "correction_of"),
  };
}

/** Acesso tipado a um campo obrigatório já validado como string. */
export function requiredString(envelope: ParsedEnvelope, key: string): string | undefined {
  return envelope.fields ? readString(envelope.fields, key) : undefined;
}

/** Verdadeiro quando a string tem a forma de PSR opaco do contrato. */
export function looksLikePsr(value: string): boolean {
  return value.startsWith(PSR_PREFIX) && value.length > PSR_PREFIX.length;
}

/**
 * Campos que carregam (ou aparentam carregar) identificador de fonte cru.
 * Devolve apenas NOMES de campo — o valor jamais atravessa esta função,
 * para que nenhum relatório o reproduza.
 */
export function detectRawSourceIdentifierFields(envelope: ParsedEnvelope): readonly string[] {
  if (!envelope.fields) return [];
  const denylist = new Set<string>(RAW_SOURCE_IDENTIFIER_FIELDS);
  const found: string[] = [];
  for (const [name, value] of Object.entries(envelope.fields)) {
    if (denylist.has(name)) {
      found.push(name);
      continue;
    }
    if (typeof value === "string") {
      const lowered = value.toLowerCase();
      if (RAW_SOURCE_IDENTIFIER_VALUE_PREFIXES.some((prefix) => lowered.startsWith(prefix))) {
        found.push(name);
      }
    }
  }
  return found;
}
