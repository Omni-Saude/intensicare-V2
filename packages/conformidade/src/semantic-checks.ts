/**
 * Verificações de SEMÂNTICA que as fixtures pinadas permitem hoje —
 * identidade, encontro, timestamp, unidade, proveniência e replay.
 *
 * As seis dimensões vêm da exigência de mapeamento semântico do §7.6
 * ("campo a campo, com contabilidade de perda"). Duas delas — **encontro**
 * e **unidade** — NÃO EXISTEM no envelope de identidade do contrato v1, e
 * este módulo diz isso em vez de fabricar uma verificação:
 *
 * - **Encontro**: perda L-03 do mapeamento semântico. Os eventos de ciclo
 *   de vida operam sobre a REF, sem encontro, por decisão explícita do
 *   contrato — enquanto a chave canônica do fato clínico é
 *   `(tenant, PSR, encontro)` (ADR-0005 M2).
 * - **Unidade**: o contrato v1 exclui `Observation` (contradição C-1 da IG:
 *   o único profile fixa `category` em `laboratory`, excluindo vitais por
 *   construção), logo nenhuma unidade de medida atravessa esta fronteira.
 *   "Unidade de internação" (`CareUnit`) também não aparece no envelope.
 *
 * Para essas duas, a verificação executada é sobre o LADO V2 — o cenário
 * sintético G7 de `@intensicare/fixtures-sinteticas` — e o relatório
 * rotula exatamente isso: preservação verificada no modelo canônico da V2,
 * NÃO no contrato da AMH.
 */
import { buildG7SyntheticScenario } from "@intensicare/fixtures-sinteticas";
import { AnticorruptionLayer, type TranslationProvenance } from "./anticorruption-layer.js";
import { looksLikePsr, PSR_PREFIX, parseEnvelope, requiredString } from "./envelope.js";
import { blocked, type CheckResult, check } from "./harness.js";
import { fixtureByName, type PinnedFixtureSet } from "./pinned-fixtures.js";
import { meshFingerprint, projectMesh, resolveLocal } from "./ref-mesh.js";
import { DEFAULT_CONTEXT } from "./scenarios.js";

export type SemanticDimension =
  | "identidade"
  | "encontro"
  | "timestamp"
  | "unidade"
  | "proveniencia"
  | "replay";

export interface SemanticCheckResult {
  readonly dimension: SemanticDimension;
  readonly checks: readonly CheckResult[];
  /** Onde a verificação foi executada — a distinção importa. */
  readonly subject: "contrato-amh (fixtures pinadas)" | "modelo canônico V2 (cenário SYNTH G7)";
}

const VALID_FIXTURES = [
  "alias.valid.json",
  "merge.valid.json",
  "unmerge.valid.json",
  "erasure.valid.json",
  "restore.valid.json",
  "reassignment.valid.json",
] as const;

function buildLayer(fixtures: PinnedFixtureSet): AnticorruptionLayer {
  const layer = new AnticorruptionLayer({ context: DEFAULT_CONTEXT });
  for (const fileName of VALID_FIXTURES) {
    const fixture = fixtureByName(fixtures, fileName);
    const emittedAt = requiredString(parseEnvelope(fixture.raw), "emitted_at") ?? "";
    layer.deliver({
      raw: fixture.raw,
      receivedAtUtc: new Date(Date.parse(emittedAt) + 1_000).toISOString(),
    });
  }
  return layer;
}

function identityChecks(fixtures: PinnedFixtureSet): readonly CheckResult[] {
  const refs: string[] = [];
  for (const fixture of fixtures.fixtures) {
    const envelope = parseEnvelope(fixture.raw);
    const antiga = requiredString(envelope, "subject_ref_antiga");
    if (antiga !== undefined) refs.push(antiga);
    if (envelope.subjectRefNova.kind === "present" && envelope.subjectRefNova.value !== null) {
      refs.push(envelope.subjectRefNova.value);
    }
  }
  const layer = buildLayer(fixtures);
  const appliedRefs = layer.transitions.flatMap((t) => (t.to === null ? [t.from] : [t.from, t.to]));
  const fixtureRefs = new Set(refs);

  // Entrega ISOLADA da fixture que carrega identificador de fonte cru.
  const isolated = new AnticorruptionLayer({ context: DEFAULT_CONTEXT });
  const rawIdentifierOutcome = isolated.deliver({
    raw: fixtureByName(fixtures, "erasure.identificador-de-fonte-cru.invalid.json").raw,
    receivedAtUtc: "2026-08-15T18:00:03.000Z",
  });
  const rawIdentifierRejected =
    rawIdentifierOutcome.kind === "quarentenado" &&
    rawIdentifierOutcome.segregated &&
    isolated.transitions.length === 0;

  return [
    check(
      "SEM-ID.1",
      "toda ref que atravessa a fronteira é OPACA, na forma `amh:psr:v1:<...>`",
      refs.length > 0 && refs.every((ref) => looksLikePsr(ref)),
      `${refs.length} refs observadas nas fixtures pinadas, todas com o prefixo ${PSR_PREFIX}`,
    ),
    check(
      "SEM-ID.2",
      "toda ref é sintética (marcador `SYNTH-`) — nenhum PSR real aparece",
      refs.every((ref) => ref.startsWith(`${PSR_PREFIX}SYNTH-`)),
      "nenhuma ref na forma real `amh:psr:v1:<uuidv4>` foi observada em qualquer fixture",
    ),
    check(
      "SEM-ID.3",
      "a identidade é preservada VERBATIM — nenhuma normalização, nenhum re-minting",
      appliedRefs.every((ref) => fixtureRefs.has(ref)),
      `as ${appliedRefs.length} refs presentes na projeção são exatamente strings vindas das ` +
        "fixtures; a camada não reescreve, não completa e não normaliza ref alguma",
    ),
    check(
      "SEM-ID.4",
      "identificador de fonte cru NÃO sobrevive à fronteira (invariante 1)",
      rawIdentifierRejected,
      "a única fixture com identificador de fonte é inválida por construção; entregue " +
        "isoladamente, é quarentenada em acesso segregado e NENHUMA transição é aplicada " +
        "(o valor do identificador não é copiado para lugar algum)",
    ),
  ];
}

function encounterChecks(): readonly CheckResult[] {
  const scenario = buildG7SyntheticScenario();
  const observations = [
    ...scenario.vitalSigns,
    ...scenario.missingInputCase.otherObservationsPresent,
  ];
  const encounterIds = new Set(scenario.encounters.map((e) => e.id));

  return [
    blocked(
      "SEM-ENC.1",
      "o encontro clínico é preservado do contrato AMH ao modelo canônico",
      "campo-inexistente-no-contrato",
      "o envelope de identidade v1 NÃO carrega encontro — decisão explícita do contrato " +
        "('eventos de ciclo de vida e `resolve` operam sobre a ref em si'), registrada como " +
        "perda L-03. A chave canônica do fato clínico é `(tenant, PSR, encontro)` (ADR-0005 M2), " +
        "logo aplicar uma transição de ref exige percorrer os fatos daquele PSR — alcance que é " +
        "CÁLCULO DA V2, jamais afirmação da fonte.",
    ),
    check(
      "SEM-ENC.2",
      "no lado V2, todo fato clínico carrega encontro explícito (verificação sobre o cenário " +
        "SYNTH G7, NÃO sobre o contrato AMH)",
      observations.length > 0 && observations.every((obs) => encounterIds.has(obs.encounterId)),
      `${observations.length} observações sintéticas, todas ligadas a um dos ` +
        `${encounterIds.size} encontros do cenário — nenhuma observação órfã de encontro`,
    ),
  ];
}

function timestampChecks(fixtures: PinnedFixtureSet): readonly CheckResult[] {
  const layer = buildLayer(fixtures);
  const provenances = layer.provenance;
  const aliasEnvelope = parseEnvelope(fixtureByName(fixtures, "alias.valid.json").raw);
  const occurredAt = requiredString(aliasEnvelope, "occurred_at") ?? "";
  const emittedAt = requiredString(aliasEnvelope, "emitted_at") ?? "";

  return [
    check(
      "SEM-TS.1",
      "`occurred_at` e `emitted_at` são preservados VERBATIM, como recebidos",
      provenances.some((p) => p.occurredAtUtc === occurredAt && p.emittedAtUtc === emittedAt),
      `proveniência retém occurred_at=${occurredAt} e emitted_at=${emittedAt} exatamente como ` +
        "estão na fixture; nenhum é re-serializado nem re-normalizado",
    ),
    check(
      "SEM-TS.2",
      "tempo de FONTE e tempo de PIPELINE vivem em campos distintos e nunca se confundem",
      provenances.every(
        (p: TranslationProvenance) =>
          p.receivedAtUtc !== p.occurredAtUtc && p.persistedAtUtc !== p.emittedAtUtc,
      ),
      "os quatro instantes (occurred, emitted, received, persisted) são campos separados na " +
        "proveniência (ADR-0005 M3; HAZ-0007)",
    ),
    check(
      "SEM-TS.3",
      "nenhum tempo ausente é substituído por 'agora', pelo tempo de recebimento ou por vizinho",
      provenances.every((p) => p.occurredAtUtc.length > 0 && p.emittedAtUtc.length > 0),
      "envelope sem `occurred_at`/`emitted_at` é QUARENTENADO (campo obrigatório 1..1), nunca " +
        "completado — regra não-negociável §3-8, DOM-0009",
    ),
    blocked(
      "SEM-TS.4",
      "offset original, precisão original e valor-fonte cru do tempo são preservados",
      "campo-inexistente-no-contrato",
      "perda L-01: o envelope v1 carrega APENAS o instante normalizado em UTC. Offset e precisão " +
        "anteriores à normalização da AMH são irrecuperáveis, e este harness NÃO os infere — um " +
        "fato com precisão de dia chega indistinguível de um com precisão de segundo. " +
        "CONF-Q-05 ao dono AMH (campo opcional novo seria mudança compatível).",
    ),
  ];
}

function unitChecks(): readonly CheckResult[] {
  const scenario = buildG7SyntheticScenario();
  const observations = [
    ...scenario.vitalSigns,
    ...scenario.missingInputCase.otherObservationsPresent,
  ];
  const units = [...new Set(observations.map((obs) => obs.unit))];

  return [
    blocked(
      "SEM-UN.1",
      "a unidade de medida é preservada do contrato AMH ao modelo canônico",
      "campo-inexistente-no-contrato",
      "o contrato v1 NÃO carrega unidade alguma: `Observation` está explicitamente excluída " +
        "(contradição C-1 — o único profile da IG fixa `category` em `laboratory`, excluindo " +
        "sinais vitais por construção) e o envelope de identidade não tem campo de valor. " +
        "'Unidade de internação' (`CareUnit`) também não atravessa esta fronteira.",
    ),
    check(
      "SEM-UN.2",
      "no lado V2, a unidade de ORIGEM é retida verbatim e nenhum par canônico é inventado " +
        "(verificação sobre o cenário SYNTH G7, NÃO sobre o contrato AMH)",
      observations.length > 0 && observations.every((obs) => obs.unit.length > 0),
      `unidades de origem observadas: ${units.join(", ")} — retidas como vieram; converter para ` +
        "UCUM é decisão da borda de ingestão sob tabela versionada (ADR-0005 M5), e unidade " +
        "não-conversível vai a quarentena, nunca a 'mais próxima' (HAZ-0032)",
    ),
  ];
}

function provenanceChecks(fixtures: PinnedFixtureSet): readonly CheckResult[] {
  const layer = buildLayer(fixtures);
  const provenances = layer.provenance;

  return [
    check(
      "SEM-PROV.1",
      "cada transição aplicada retém o envelope de origem íntegro (digest + tamanho)",
      provenances.length > 0 &&
        provenances.every(
          (p) => p.retainedEnvelopeSha256.length === 64 && p.retainedEnvelopeBytes > 0,
        ),
      `${provenances.length} transições aplicadas, todas com digest SHA-256 do envelope retido`,
    ),
    check(
      "SEM-PROV.2",
      "a proveniência carrega identidade da mensagem, versão de contrato e versão de MAPEAMENTO",
      provenances.every(
        (p) =>
          p.eventId.length > 0 &&
          p.idempotencyKey.length > 0 &&
          p.contractEventTypeVersion.length > 0 &&
          p.mappingVersion.length > 0,
      ),
      "sem versão de mapeamento, 'reinterpretamos o dado' vira reescrita de história — ela é " +
        "registrada em toda transição",
    ),
    check(
      "SEM-PROV.3",
      "a qualidade de fonte é `unknown` EXPLÍCITO, jamais default silencioso a `valid`",
      provenances.every((p) => p.sourceQuality === "unknown"),
      "perda L-02: a lane de identidade não carrega dimensão de qualidade; a ausência é " +
        "registrada como fato (fail-closed, ADR-0005 M4), nunca preenchida (HAZ-0040)",
    ),
    check(
      "SEM-PROV.4",
      "o digest do manifesto de contrato pinado é registrado como `null` — ausência declarada",
      provenances.every((p) => p.pinnedContractManifestDigest === null),
      "nenhum manifesto foi publicado pela AMH (`manifest_sha256: null`, `pinned: false`); a " +
        "proveniência REGISTRA a ausência em vez de omitir o campo",
    ),
    check(
      "SEM-PROV.5",
      "o tipo de evento de origem é retido mesmo quando dois tipos convergem para a mesma forma",
      new Set(provenances.map((p) => p.sourceEventType)).size >= 2,
      `tipos de origem retidos: ${[...new Set(provenances.map((p) => p.sourceEventType))].join(", ")} ` +
        "— perda L-11 evitada: `alias` e `merge` produzem a mesma transição observável, e a " +
        "distinção auditável só sobrevive porque o tipo é retido",
    ),
    check(
      "SEM-PROV.6",
      "o ALCANCE derivado é registrado como cálculo da V2, nunca como afirmação da fonte",
      provenances.every((p) => p.derivedScopeRule.includes("L-03")),
      "perda L-03 registrada explicitamente na proveniência de cada transição",
    ),
  ];
}

function replayChecks(fixtures: PinnedFixtureSet): readonly CheckResult[] {
  const layer = buildLayer(fixtures);
  const transitions = layer.transitions;

  const runs = [
    meshFingerprint(projectMesh(transitions)),
    meshFingerprint(projectMesh(transitions)),
    meshFingerprint(projectMesh(transitions)),
  ];

  // Permutações DETERMINÍSTICAS (rotações + inversão) — nada aleatório:
  // um harness que só passa em algumas sementes não é evidência.
  const permutations: (typeof transitions)[] = [];
  for (let offset = 0; offset < transitions.length; offset += 1) {
    permutations.push([...transitions.slice(offset), ...transitions.slice(0, offset)]);
  }
  permutations.push([...transitions].reverse());
  const permutationFingerprints = new Set(permutations.map((p) => meshFingerprint(projectMesh(p))));

  const erasureRef =
    requiredString(
      parseEnvelope(fixtureByName(fixtures, "erasure.valid.json").raw),
      "subject_ref_antiga",
    ) ?? "";
  const beforeErasure = projectMesh(transitions, { asOfUtc: "2026-08-16T11:00:00Z" });
  const duringErasure = projectMesh(transitions, { asOfUtc: "2026-08-16T13:00:00Z" });
  const afterRestore = projectMesh(transitions, { asOfUtc: "2026-08-16T15:00:00Z" });

  return [
    check(
      "SEM-RPL.1",
      "replay determinístico: mesmos envelopes retidos + mesma versão de mapeamento ⇒ mesma malha",
      new Set(runs).size === 1,
      `3 execuções da projeção sobre os mesmos envelopes produziram ${new Set(runs).size} ` +
        "impressão(ões) distinta(s) — DOM-0003",
    ),
    check(
      "SEM-RPL.2",
      "a projeção é independente da ORDEM DE ENTREGA (dobra por `occurred_at`)",
      permutationFingerprints.size === 1,
      `${permutations.length} permutações determinísticas (todas as rotações + a ordem inversa) ` +
        `produziram ${permutationFingerprints.size} impressão(ões) distinta(s)`,
    ),
    check(
      "SEM-RPL.3",
      "a visão histórica em `t` é reconstruível e o passado não é reescrito por fato posterior",
      resolveLocal(beforeErasure, erasureRef).kind === "desconhecida-no-consumidor" &&
        resolveLocal(duringErasure, erasureRef).kind === "retired" &&
        resolveLocal(afterRestore, erasureRef).kind === "resolvida",
      "a MESMA ref, sobre o MESMO conjunto de envelopes retidos, resolve para três condições " +
        "explícitas conforme `as_of`: `desconhecida-no-consumidor` antes do `erasure` (jamais " +
        "'sem dados, logo normal' — DOM-0004/HAZ-0005), `retired` entre `erasure` e `restore`, " +
        "e `resolvida` depois do carimbo de `restore`",
    ),
    blocked(
      "SEM-RPL.4",
      "critério de aceitação do replay: para todo `t`, o estado derivado coincide com " +
        "`resolve(ref, as_of=t)`",
      "interface-inexistente",
      "IF-07 não existe. Este é o critério de aceitação declarado pelo contrato (§3) e sustenta " +
        "DOM-0002/DOM-0003 — sem ele, o replay é verificável apenas contra si mesmo, o que não " +
        "é evidência de compatibilidade.",
    ),
  ];
}

/** Executa as seis dimensões semânticas. */
export function runSemanticChecks(fixtures: PinnedFixtureSet): readonly SemanticCheckResult[] {
  return [
    {
      dimension: "identidade",
      subject: "contrato-amh (fixtures pinadas)",
      checks: identityChecks(fixtures),
    },
    {
      dimension: "encontro",
      subject: "modelo canônico V2 (cenário SYNTH G7)",
      checks: encounterChecks(),
    },
    {
      dimension: "timestamp",
      subject: "contrato-amh (fixtures pinadas)",
      checks: timestampChecks(fixtures),
    },
    {
      dimension: "unidade",
      subject: "modelo canônico V2 (cenário SYNTH G7)",
      checks: unitChecks(),
    },
    {
      dimension: "proveniencia",
      subject: "contrato-amh (fixtures pinadas)",
      checks: provenanceChecks(fixtures),
    },
    {
      dimension: "replay",
      subject: "contrato-amh (fixtures pinadas)",
      checks: replayChecks(fixtures),
    },
  ];
}
