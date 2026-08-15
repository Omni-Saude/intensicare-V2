---
doc_id: DOM-INVARIANTS-INDEX
status: PROPOSAL
owner: UNASSIGNED — VALIDATION REQUIRED
source: INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §9.1 (Architecture principles), §7.6 (Anti-corruption and conformance layer — two status dimensions), and, for DOM-0009 only, §3 rule 8 (non-negotiable rules) as explicitly named by the task packet
date_collected: 2026-08-14
collector: temporal-provenance domain modeler
last_updated: 2026-08-14
---

# IntensiCare V2 — Domain Invariants (DOM-xxxx)

## Purpose and status

This register defines the initial set of domain-level invariants for IntensiCare V2:
statements that must hold true across the whole conceptual model, independent of any
future physical schema, storage technology, or service topology. Every entry is a
**PROPOSAL** — drafted by the temporal-provenance domain modeler during SPARK/Wave 1 —
and requires ratification by the accountable architecture and safety authorities before
it can be treated as **DECIDED** (per `docs/00-governance/evidence-notation.md`, if/when
published). No entry here approves clinical content, changes the evaluation-status
vocabulary, or selects a physical schema.

Each invariant has a stable `DOM-xxxx` ID for use in requirement/hazard/ADR/test
traceability (per prompt §8's ID scheme, `DOM domain invariant`). IDs are permanent once
published; an invariant is retired or superseded, never renumbered or deleted.

Every entry below is intentionally phrased to be verifiable — each has a "verification
idea" pointing at a future automated test (`TST-DOM-xxxx`, owner: **Safety-focused test
architecture engineer**, UNASSIGNED until that specialist is activated per prompt §4).

---

## DOM-0001 — Tenant and encounter ownership is invariant across every layer

**Statement:** Every resource, record, cache entry, event, query result, subscription,
and audit entry must be attributable to exactly one tenant, and where applicable exactly
one encounter, at all times and at every layer of the system — identity, storage, cache,
event, query, subscription, and audit — with no layer permitted to drop, widen, or
silently re-derive that ownership.

**Rationale:** Ownership is the foundation of clinical safety and multi-tenant isolation.
If any layer (e.g., a cache or a read projection) can present data without an
enforceable, traceable tenant/encounter binding, cross-tenant leakage, misattributed
clinical facts, or unauthorized access become possible without being detectable after
the fact. This invariant makes ownership a first-class, checkable property of the
conceptual model itself (`Organization → Facility → CareUnit → Bed`,
`PatientIdentity → Encounter → LocationAssignment`), not an implementation afterthought.

**Source:** `INTENSICARE_V2_ORCHESTRATOR_PROMPT.md` §9.1 principle 2: "Tenant and
encounter ownership are invariants from identity through storage, cache, event, query,
subscription, and audit."

**Verification idea (future):** `TST-DOM-0001` — adversarial/property tests that attempt
to read, cache, publish, query, subscribe to, or audit a record while omitting, forging,
or cross-assigning its tenant/encounter binding, across every storage, cache, event,
query, subscription, and audit surface named above; each attempt must fail closed.
Owner: Tenant-isolation and authorization engineer (implementer) + Safety-focused test
architecture engineer (independent verifier), both UNASSIGNED.

**Status:** PROPOSAL.

---

## DOM-0002 — One clinical fact has one immutable provenance chain with explicit corrections

**Statement:** Every canonical clinical fact (`ClinicalObservation`, and by extension any
fact derived from it) has exactly one append-only, immutable `Provenance` chain. A later
update to that fact never overwrites or deletes the earlier value; it is represented as
an explicit `Correction` linked to the fact it supersedes, and any unreconciled
disagreement between sources for the same fact is represented as an explicit `Conflict`,
not silently resolved.

**Rationale:** Clinical facts are frequently corrected (result amendments, data-entry
fixes) or received in conflicting versions from different sources. If the system allows
in-place mutation or silent pick-one-of-many resolution, clinicians and auditors lose the
ability to reconstruct what was known, when, and why a decision was made on it. Keeping
corrections explicit is also a precondition for deterministic, replayable evaluation
(DOM-0003): replay must be able to see the fact as it was known at any past instant.

**Source:** `INTENSICARE_V2_ORCHESTRATOR_PROMPT.md` §9.1 principle 3: "One clinical fact
has one immutable provenance chain and explicit corrections"; corroborated by §9.3's
model element `ClinicalObservation → Provenance/Quality/Correction/Conflict`.

**Verification idea (future):** `TST-DOM-0002` — property tests that submit an original
fact, a correction, and a conflicting duplicate, then assert: (a) the original value is
still retrievable via the provenance chain, (b) the correction is linked and explicit,
(c) the conflict is visibly flagged and not auto-resolved, and (d) no code path performs
an in-place mutation of a persisted fact. Owner: UNASSIGNED (candidate: Deterministic
rule-runtime engineer + Safety-focused test architecture engineer).

**Status:** PROPOSAL.

---

## DOM-0003 — Evaluation is deterministic, versioned, and replayable

**Statement:** Applying a given `RuleVersion` to a given `Encounter`'s known
`ClinicalObservation`s as of a given instant always produces the same `EvaluationRecord`,
independent of UI or infrastructure framework state; the same inputs replayed later
(e.g., for audit, incident review, or rule-performance analysis) must reproduce the
identical historical result unless a new `RuleVersion` is explicitly applied.

**Rationale:** Clinical decision support must be explainable and reconstructible after
the fact — for incident review, regulatory inquiry, and rule-performance monitoring.
Non-determinism (hidden clock reads, unordered input aggregation, environment-dependent
logic, silent dependence on UI state) would make it impossible to prove what the system
knew and concluded at a given moment, and would block the deterministic replay that
DOM-0002's provenance chain is meant to support.

**Source:** `INTENSICARE_V2_ORCHESTRATOR_PROMPT.md` §9.1 principle 4: "Clinical evaluation
is deterministic, versioned, replayable, and independent of UI/infrastructure
frameworks"; corroborated by §9.3's model element
`Encounter + Observations + RuleVersion → EvaluationRecord` and by the RuleBundle
release-artifact structure (`RuleBundle → RuleVersion/TerminologySnapshot/TestPack/Approval`).

**Verification idea (future):** `TST-DOM-0003` — replay tests that re-run a historical
`EvaluationRecord`'s exact input set against its recorded `RuleVersion` and assert
byte-for-byte/field-for-field identical output; mutation tests against the evaluator to
confirm no hidden non-deterministic input (wall-clock reads outside the modeled time
points, random iteration order, network calls) can change the result. Owner: UNASSIGNED
(candidate: Deterministic rule-runtime engineer, verified independently per prompt §4's
"Rule author ≠ clinical approver" and general non-self-approval rule).

**Status:** PROPOSAL.

---

## DOM-0004 — Missing, stale, or invalid data never coerces to zero, normal, no-risk, or silent no-fire

**Statement:** Whenever a required input, observation, or evaluation precondition is
missing, stale, invalid, partial, conflicting, or otherwise unevaluable, the system must
represent that condition explicitly (e.g., as an explicit `not_evaluated`, `partial`,
`stale`, or `invalid` evaluation status — see `status-dimensions.md`) and must never
substitute a numeric zero, a "normal" value, an implicit "no risk" determination, or an
unexplained absence of an alert as a stand-in for that condition.

**Rationale:** Coercing absent or untrustworthy data into an apparently normal or
zero-risk value is clinically dangerous: it can suppress a warranted alert without any
visible trace that a determination was skipped or degraded ("silent no-fire"), leading a
clinician to reasonably but wrongly believe the patient was actively evaluated and found
not at risk. Explicit, visible degraded states (DOM-0007) are the only safe alternative.

**Source:** `INTENSICARE_V2_ORCHESTRATOR_PROMPT.md` §3 rule 7 ("Never coerce missing,
stale, invalid, partial, conflicting, or unevaluable clinical data to zero, normal,
no-risk, or silent no-fire."), reinforced structurally by §9.1 principle 1 ("Safety state
precedes severity") and by the explicit `valid | partial | not_evaluated | stale | invalid`
evaluation-status vocabulary in §7.6. This statement's exact wording was supplied verbatim
in the task packet's required DOM-invariant list.

**Verification idea (future):** `TST-DOM-0004` — reference-vector tests ("no-fire reason"
tests per prompt §14) that withhold, age-out, invalidate, or conflict each required input
in turn and assert the resulting `EvaluationRecord`/`Alert` state is one of the explicit
non-normal statuses, is visibly distinguishable in every projection/UI state, and is never
silently absent. Owner: UNASSIGNED (candidate: Deterministic rule-runtime engineer +
Alerting human-factors specialist for visibility, verified by Safety-focused test
architecture engineer).

**Status:** PROPOSAL.

---

## DOM-0005 — Commands are idempotent, concurrency-safe, authorized, audited, and transactionally published

**Statement:** Every state-changing command in the system (including but not limited to
`Assignment`, `Acknowledgment`, `Escalation`, `Override`, `Resolution`, and `Suppression`
actions against an `Alert`/`WorkItem`) must: be safely retryable without duplicating
effect (idempotent); detect and resolve concurrent conflicting attempts safely
(concurrency-safe); be evaluated against the actor's authorization before taking effect;
produce a corresponding `AuditEvidence` record; and have its resulting event(s) published
in the same transaction as the state change itself (no state change without a
correspondingly durable, published fact).

**Rationale:** Alert/work-management actions happen under time pressure, with multiple
clinicians potentially acting on the same `WorkItem` concurrently, over unreliable
networks that cause client retries. Without idempotency and concurrency safety, retries
or races can duplicate escalations, silently drop an acknowledgment, or leave two
clinicians each believing the other is not responsible. Without transactional
publication, a state change could exist without a durable trace, undermining DOM-0001's
audit requirement and DOM-0006's durability-precedes-immediacy principle.

**Source:** `INTENSICARE_V2_ORCHESTRATOR_PROMPT.md` §9.1 principle 5: "Commands are
idempotent, concurrency-safe, authorized, audited, and transactionally published";
corroborated by §9.3's model elements
`EvaluationRecord → Alert/WorkItem → Action/Assignment/Escalation/Resolution` and
`Every read/change/decision/action → AuditEvidence`.

**Verification idea (future):** `TST-DOM-0005` — concurrency/property tests that submit
duplicate commands, concurrent conflicting commands, and unauthorized commands against
the same `WorkItem`/`Alert`, asserting exactly-once effect, safe conflict resolution,
authorization enforcement, an `AuditEvidence` record per accepted command, and that the
audit record and the published event never diverge (no dual-write gap). Owner: UNASSIGNED
(candidate: Alert work-management engineer, verified independently — "Safety-control
implementer ≠ safety-case accepter" per prompt §4).

**Status:** PROPOSAL.

---

## DOM-0006 — Durability precedes immediacy

**Statement:** No fact, evaluation result, alert, or state change may be delivered to a
human or external system (via `RebuildableProjection`, notification, or any real-time
channel) unless it has first been durably and replayably persisted as the system of
record; all real-time/UI delivery is derived from durable events, never the other way
around, and every projection must be rebuildable from durable events alone.

**Rationale:** If a WebSocket/SSE/notification path could carry a fact that was never
durably recorded, that fact could be seen once by a clinician and then be
unreconstructable for audit, replay, or reconciliation — and a dropped real-time
connection could mean a clinically relevant fact was never durably delivered at all. This
invariant also structurally prevents real-time delivery channels from becoming a second,
ungoverned source of truth.

**Source:** `INTENSICARE_V2_ORCHESTRATOR_PROMPT.md` §9.1 principle 6: "Durability precedes
immediacy; projections and real-time views are rebuildable"; corroborated by §9.3's
terminal model chain `Durable events → RebuildableProjection → Authorized UI/notification`.

**Verification idea (future):** `TST-DOM-0006` — recovery tests that delete/rebuild every
read projection purely from the durable event log and assert bit-for-bit equivalence to
the pre-deletion projection; chaos tests that sever the real-time delivery channel and
assert no fact is lost (only delayed) once the channel/polling reconciliation resumes.
Owner: UNASSIGNED (candidate: Platform reliability and SRE engineer + Alert work-
management engineer).

**Status:** PROPOSAL.

---

## DOM-0007 — Degraded mode is explicit at every level

**Statement:** Component failure, data unavailability/staleness, rule-evaluation
inability, workflow interruption, and UI/connectivity degradation must each be
represented as an explicit, visible state at their respective level (component, data,
rule, workflow, UI) — never silently downgraded to an apparently normal or fully-
functioning state.

**Rationale:** A system that fails "quietly" (e.g., a stale feed rendered indistinguishably
from a fresh one, or a disconnected real-time channel showing a frozen but plausible-
looking screen) is more dangerous than one that visibly fails, because clinicians cannot
compensate for a degradation they cannot see. This invariant generalizes DOM-0004 (no
silent coercion at the data/evaluation level) to every architectural layer.

**Source:** `INTENSICARE_V2_ORCHESTRATOR_PROMPT.md` §9.1 principle 7: "Degraded mode is
explicit at component, data, rule, workflow, and UI levels."

**Verification idea (future):** `TST-DOM-0007` — fault-injection tests at each named level
(kill a component dependency; age out a feed past its freshness window; make a
`RuleVersion` unavailable; interrupt a workflow mid-command; disconnect the real-time
channel) asserting a distinguishable, explicit degraded-state signal is surfaced at that
level and propagates to any dependent level rather than being absorbed silently. Owner:
UNASSIGNED (candidate: Platform reliability and SRE engineer + Clinical interaction-state
designer).

**Status:** PROPOSAL.

---

## DOM-0008 — Source data quality and V2 evaluation status are independent dimensions that must never be collapsed

**Statement:** The source data-quality dimension (e.g., AMH's `valid | warning |
quarantined`) and IntensiCare V2's evaluation-status dimension (`valid | partial |
not_evaluated | stale | invalid`) are two independent axes describing a fact/evaluation.
Neither axis may be inferred from, substituted for, or silently collapsed into the other;
a mapping between them is explicit, versioned, and owned separately from this document.

**Rationale:** A source system's own quality label describes only its confidence in the
data it produced; it says nothing about whether that data is fresh enough, complete
enough, or applicable enough for a specific IntensiCare pathway's evaluation at a
specific moment. A source-`valid` fact can still be clinically `stale` for a fast-moving
ICU pathway; a source-`quarantined` fact must never be silently promoted to a normal V2
value merely because no explicit mapping exists yet. Collapsing the two dimensions would
hide exactly the kind of failure DOM-0004 exists to prevent.

**Source:** `INTENSICARE_V2_ORCHESTRATOR_PROMPT.md` §7.6: "Keep two independent status
dimensions throughout mapping: source data quality, including AMH `valid | warning |
quarantined`; and V2 evaluation status, including `valid | partial | not_evaluated |
stale | invalid`. Define an explicit mapping matrix but never collapse the dimensions. A
source marked `valid` can still be stale or insufficient for a pathway; a quarantined
source must not become a normal V2 value."

**Verification idea (future):** `TST-DOM-0008` — contract tests that hold source data
quality constant while varying freshness/completeness and assert V2 evaluation status
changes independently (and vice versa); a static check that no code path derives V2
evaluation status directly from the AMH quality enum without passing through the owned
mapping matrix. Owner: UNASSIGNED (candidate: AMH-data compatibility architect + a named
safety engineer, per this document's status-dimensions.md placeholder).

**Status:** PROPOSAL.

---

## DOM-0009 — A source timestamp is never invented; original value, offset, precision, receipt time, and quality state are preserved

**Statement:** IntensiCare V2 never fabricates, backfills, or infers a value for a
missing or ambiguous source timestamp. Every clinical instant is modeled in UTC while
preserving the original recorded value, its original timezone/offset, its original
precision, the time IntensiCare received it, and its quality state; if a timestamp is
genuinely absent from the source, that absence is itself explicitly represented — never
silently defaulted to "now," to another nearby timestamp, or omitted.

**Rationale:** An invented timestamp is indistinguishable from a real one once persisted,
and can corrupt ordering, freshness/staleness determination (DOM-0008), correction
lineage (DOM-0002), and deterministic replay (DOM-0003) in ways that are very difficult
to detect after the fact. Preserving the original offset/precision/received-time alongside
the normalized UTC instant keeps both the clinically authoritative original and the
system's operational view auditable side by side.

**Source:** `INTENSICARE_V2_ORCHESTRATOR_PROMPT.md` §9.3: "Model all clinical instants in
UTC while preserving original offset, precision, source value, received time, and
relevant timezone." The "never invent" formulation is §3 rule 8: "Never invent a source
timestamp. Preserve the original value, timezone/offset, precision, received time, and
quality state." This rule was explicitly named ("non-negotiable rule 8") in the task
packet governing this document's companion `time-semantics.md`.

**Verification idea (future):** `TST-DOM-0009` — property tests that submit
`SourceEnvelope`s with missing, ambiguous, or malformed timestamps and assert the system
never produces a plausible-looking fabricated instant, always preserves the original raw
value and offset alongside any derived UTC instant, and explicitly flags timestamp
absence in a way visible to downstream evaluation and UI (linking to DOM-0004/DOM-0007).
Owner: UNASSIGNED (candidate: Temporal-provenance data modeler's successor implementer +
HL7 v2 interface-conformance engineer / FHIR conformance engineer for source-specific
cases).

**Status:** PROPOSAL.

---

## Index

| ID | Title | Status |
|---|---|---|
| DOM-0001 | Tenant and encounter ownership is invariant across every layer | PROPOSAL |
| DOM-0002 | One clinical fact has one immutable provenance chain with explicit corrections | PROPOSAL |
| DOM-0003 | Evaluation is deterministic, versioned, and replayable | PROPOSAL |
| DOM-0004 | Missing/stale/invalid data never coerces to zero/normal/no-risk/silent no-fire | PROPOSAL |
| DOM-0005 | Commands are idempotent, concurrency-safe, authorized, audited, transactionally published | PROPOSAL |
| DOM-0006 | Durability precedes immediacy | PROPOSAL |
| DOM-0007 | Degraded mode is explicit at every level | PROPOSAL |
| DOM-0008 | Source data quality and V2 evaluation status are independent, never collapsed | PROPOSAL |
| DOM-0009 | A source timestamp is never invented; original value/offset/precision/receipt/quality preserved | PROPOSAL |

This index will grow as later waves (candidate-architecture ADR engineering, rule-runtime
engineering, alert work-management engineering) surface further invariants. New entries
continue the `DOM-00xx` sequence; none of the above IDs may be reused or renumbered.
