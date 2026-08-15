---
doc_id: ARCH-QUALITY-ATTRIBUTE-SCENARIOS
status: PROPOSAL
owner: UNASSIGNED — VALIDATION REQUIRED
source: INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §15.3 (Operability — the SLO list), §9.1 (Architecture principles 1-12), §1 (minimum safety loop and its failure conditions), §14 (required test layers); docs/03-domain/invariants/DOM-invariants.md
date_collected: 2026-08-14
collector: candidate-architecture and ADR-program engineer (Wave 2)
last_updated: 2026-08-14
---

# IntensiCare V2 — Candidate Quality-Attribute Scenarios

**Status: PROPOSAL. Every target below reads `VALIDATION REQUIRED`.**

SOURCE (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md` §15.3, line 862): *"Define SLOs and error
budgets **from validated user/safety needs**."* **No *validated* user or safety need
exists.** Wave-1 specialists produced hypothesized user roles
(`docs/02-users-and-workflows/user-roles-hypotheses.md`), a seed hazard log
(`docs/05-clinical-safety/hazard-log.md`, HAZ-0001..HAZ-0040) and seed safety requirements
(`safety-requirements.md`, SAF-xxxx) during this cycle — those are cited by ID throughout
this document — but every one of them is itself a hypothesis or a PROPOSAL awaiting Gate G1
and named human acceptance. A hazard that has been *identified* does not supply the
*quantity* an SLO needs.

**Therefore no numeric target appears in this document, anywhere, deliberately.** A
plausible-looking number here would be read downstream as a requirement, would propagate
into designs and tests, and would eventually be defended as if it had been validated. That
failure mode — an invented target acquiring authority through repetition — is more damaging
than an admitted blank. Each scenario states *what to measure and under what conditions*;
Gate G1 supplies *how much*.

---

## 1. How to read and use this document

### 1.1 Scenario form

Each scenario uses the standard six-part form (source of stimulus, stimulus, artifact,
environment, response, response measure), condensed into stimulus / environment /
response / measure per the task's requested shape.

**Environments matter as much as measures.** SOURCE (prompt §1, line 45): the safety loop
must be demonstrated "under normal, missing, stale, duplicate, delayed, conflicting,
corrected, unauthorized, disconnected, and partially failed conditions." A scenario
measured only on the happy path measures almost nothing, so each scenario below names the
degraded environments in which it must also hold.

### 1.2 On the `QAS-` labels — an honest note about IDs

`QAS-xxxx` labels are **document-local scenario labels, not traceability-policy IDs.**

`docs/00-governance/traceability-policy.md` §1 defines an exhaustive prefix taxonomy and
states that "no specialist may invent a new prefix without an ADR amending this document."
`QAS` is not in that taxonomy, and this program has no authority to add it. The correct
long-term prefix is `NFR` (non-functional requirement) — but `NFR` IDs must be minted by
the requirement catalog (`docs/04-product-requirements/`, which does not yet exist), and
minting them here would risk a collision with concurrent work
(`traceability-policy.md` §2 rule 4).

**Resolution (PROPOSAL, for the orchestrator):** when the requirement catalog is created,
each scenario below is converted to an `NFR-xxxx` entry and this file becomes the
scenario's narrative home, cross-referenced by ID. Alternatively, an ADR amends the
taxonomy to add a scenario prefix. Both paths are recorded in `../adrs/adr-index.md` §6.
Until then, references to `QAS-xxxx` from ADR-0001 and ADR-0002 resolve to this document.

### 1.3 Prerequisites before any of this is measurable

| # | Prerequisite | Currently |
|---|---|---|
| P1 | Validated user/safety needs to set targets (Gate G1) | **absent** |
| P2 | An approved pathway portfolio, so "the required inputs" is a defined set (Gate G2) | **absent** |
| P3 | A reachable AMH environment for anything measuring the source boundary (Gate G3 layer 2) | **absent — only `dev` is provisioned on the AMH side** |
| P4 | A production-like environment for operational-fitness measurement | **absent on the AMH side; undecided on the V2 side (ADR-0019)** |
| P5 | Instrumentation: OpenTelemetry-compatible metrics/traces/logs with strict PHI redaction, and synthetic end-to-end safety probes (§9.4, §14) | **not built** |
| P6 | Distinct, recorded time points (observed, effective, issued, received, persisted, evaluated, alerted, displayed, acknowledged, acted, corrected, reconciled) — without these, latency scenarios QAS-0001–0006 cannot even be *computed* | **modelled in DOM-0009 / `time-semantics.md`; not implemented** |

INFERENCE: P6 is the sharpest of these. Every latency scenario is an interval between two
of those recorded instants. A system that does not persist them cannot report these SLOs
afterwards, and cannot reconstruct them retrospectively. **Instrumenting the time points is
a precondition of the SLO program, not a consequence of it.**

### 1.4 Index

| ID | Quality attribute | Derived from | Target |
|---|---|---|---|
| QAS-0001 | Timeliness — source to accepted | §15.3 b1 | VALIDATION REQUIRED |
| QAS-0002 | Completeness — source to accepted | §15.3 b1 | VALIDATION REQUIRED |
| QAS-0003 | Timeliness — accepted to evaluation | §15.3 b2 | VALIDATION REQUIRED |
| QAS-0004 | Timeliness — evaluation to durable work item | §15.3 b3 | VALIDATION REQUIRED |
| QAS-0005 | Timeliness — generated to visible | §15.3 b4 | VALIDATION REQUIRED |
| QAS-0006 | Timeliness — generated to acknowledged | §15.3 b4 | VALIDATION REQUIRED |
| QAS-0007 | Data-condition prevalence and visibility | §15.3 b5 | VALIDATION REQUIRED |
| QAS-0008 | Queue lag and replay backlog | §15.3 b6 | VALIDATION REQUIRED |
| QAS-0009 | Projection lag and rebuildability | §15.3 b6 | VALIDATION REQUIRED |
| QAS-0010 | Reconciliation divergence | §15.3 b6 | VALIDATION REQUIRED |
| QAS-0011 | Rule bundle/version/load health | §15.3 b7 | VALIDATION REQUIRED |
| QAS-0012 | Connector availability | §15.3 b8 | VALIDATION REQUIRED |
| QAS-0013 | Connector contract drift detection | §15.3 b8 | VALIDATION REQUIRED |
| QAS-0014 | Cross-tenant denials and suspicious access | §15.3 b9 | VALIDATION REQUIRED |
| QAS-0015 | Backup, restore integrity, RPO/RTO | §15.3 b10 | VALIDATION REQUIRED |
| QAS-0016 | Evidence-export integrity | §15.3 b10 | VALIDATION REQUIRED |
| QAS-0017 | Safety state precedes severity | §9.1 p1 + DOM-0004 | VALIDATION REQUIRED |
| QAS-0018 | Tenant/encounter ownership invariance | §9.1 p2 + DOM-0001 | VALIDATION REQUIRED |
| QAS-0019 | Provenance and correction integrity | §9.1 p3 + DOM-0002 | VALIDATION REQUIRED |
| QAS-0020 | Deterministic replay | §9.1 p4 + DOM-0003 | VALIDATION REQUIRED |
| QAS-0021 | Command idempotency, concurrency, transactional publication | §9.1 p5 + DOM-0005 | VALIDATION REQUIRED |
| QAS-0022 | Durability precedes immediacy | §9.1 p6 + DOM-0006 | VALIDATION REQUIRED |
| QAS-0023 | Explicit degraded mode | §9.1 p7 + DOM-0007 | VALIDATION REQUIRED |
| QAS-0024 | Module-boundary conformance | §9.1 p8 | VALIDATION REQUIRED |
| QAS-0025 | Standards conformance evidence | §9.1 p9 | VALIDATION REQUIRED |
| QAS-0026 | Release-evidence completeness | §9.1 p10 | VALIDATION REQUIRED |
| QAS-0027 | Reversibility and exit cost | §9.1 p11 | VALIDATION REQUIRED |
| QAS-0028 | PHI minimization across all surfaces | §9.1 p12 | VALIDATION REQUIRED |
| QAS-0029 | Readiness represents safe capability | §15.3 closing paragraph | VALIDATION REQUIRED |

---

## 2. Scenarios derived from §15.3 (operability SLO list)

### QAS-0001 — Source-to-accepted input latency

- **Stimulus:** A clinical fact is observed at its source system (device, LIS, EHR entry).
- **Environment:** Normal operation; and separately under source backlog, connector
  restart, duplicate delivery, out-of-order arrival, and correction of an earlier value.
- **Response:** The fact is durably accepted into V2 with its provenance, source data-quality
  state, and every distinct time point preserved (DOM-0009) — never with an invented
  timestamp.
- **Measure:** Distribution (median and upper percentiles) of `accepted_time − observed_time`,
  segmented by source system, tenant/facility, and input class.
- **Target:** **VALIDATION REQUIRED** (needs validated user/safety needs, Gate G1).
- **Traces to:** DOM-0009, DOM-0002; ADR-0001, ADR-0005; HAZ-0007, HAZ-0010, HAZ-0030; SAF-0010, SAF-0031.
- **Note:** This is the interval most at risk from the AMH batch-first path, and the one
  currently **unmeasured on both sides** (`compatibility-finding.md` §4.3).

### QAS-0002 — Source-to-accepted input completeness and loss

- **Stimulus:** A set of clinical facts is emitted by a source over an interval.
- **Environment:** Normal; connector outage and recovery; source backfill; partial batch
  failure; tenant/facility with known coverage gaps.
- **Response:** Every emitted fact is either accepted, explicitly quarantined with a reason,
  or explicitly recorded as missing. **Nothing is silently dropped, and no gap is rendered
  as a normal or zero value.**
- **Measure:** Accepted ÷ emitted per source, tenant and interval; count and rate of
  quarantined items by reason; count of gaps detected only by reconciliation rather than by
  ingestion (a leading indicator of silent loss).
- **Target:** **VALIDATION REQUIRED** (Gate G1).
- **Traces to:** DOM-0004, DOM-0008; ADR-0001, ADR-0006; HAZ-0012, HAZ-0039; SAF-0013, SAF-0033.

### QAS-0003 — Accepted-input-to-evaluation latency

- **Stimulus:** An accepted input completes the evaluation preconditions for a pathway on an
  encounter.
- **Environment:** Normal; evaluation backlog; rule-bundle activation in progress; partially
  available inputs; concurrent corrections to an input already evaluated.
- **Response:** A versioned, deterministic `EvaluationRecord` is produced with an explicit
  status (`valid | partial | not_evaluated | stale | invalid`) — including when the outcome
  is "cannot evaluate", which must be recorded, not omitted.
- **Measure:** Distribution of `evaluated_time − accepted_time`, segmented by pathway, rule
  version and status; and the proportion of accepted inputs that produce **no** evaluation
  record at all (which should be zero — an unevaluated input with no record is invisible).
- **Target:** **VALIDATION REQUIRED** (Gate G1).
- **Traces to:** DOM-0003, DOM-0004; ADR-0007, ADR-0008; HAZ-0010, HAZ-0021; SAF-0019, SAF-0031.

### QAS-0004 — Evaluation-to-durable-work-item latency

- **Stimulus:** An evaluation warrants an alert or work item.
- **Environment:** Normal; store contention; outbox backlog; process crash between commit
  and publish; concurrent evaluation of the same encounter.
- **Response:** The alert/work item is durably persisted **and** its event transactionally
  published, atomically with the command that created it — no state in which one exists
  without the other.
- **Measure:** Distribution of `workitem_persisted_time − evaluated_time`; count of
  evaluations warranting a work item where none was persisted (must be zero); count of
  published events with no corresponding persisted item (must be zero).
- **Target:** **VALIDATION REQUIRED** (Gate G1).
- **Traces to:** DOM-0005, DOM-0006; ADR-0009, ADR-0010; HAZ-0012, HAZ-0015; SAF-0013, SAF-0015.

### QAS-0005 — Generated-to-visible latency

- **Stimulus:** A durable work item or alert exists.
- **Environment:** Normal; real-time channel disconnected and reconnecting; projection lag;
  client offline then resuming; user session expiring; multiple concurrent viewers.
- **Response:** The item becomes visible to every authorized user whose view includes it,
  via a projection derived from durable state — **never** via a real-time message treated as
  the record itself (prompt §3 rule 9).
- **Measure:** Distribution of `first_displayed_time − workitem_persisted_time` per role and
  view; count of items durable but never displayed within the measurement window (the
  clinically most dangerous case, since nothing appears wrong to the user).
- **Target:** **VALIDATION REQUIRED** (Gate G1).
- **Traces to:** DOM-0006, DOM-0007; ADR-0011, ADR-0021; HAZ-0015, HAZ-0017; SAF-0015, SAF-0016.

### QAS-0006 — Generated-to-acknowledged latency

- **Stimulus:** An alert or work item is displayed to an authorized clinician.
- **Environment:** Normal; interruption/handoff; high alert volume; shift change; competing
  concurrent alerts; degraded connectivity.
- **Response:** A human acknowledges, escalates, reassigns, resolves or overrides, and the
  action is durably recorded with the acting identity, time and audit evidence.
- **Measure:** Distribution of `acknowledged_time − generated_time` by priority tier, role,
  unit and shift; proportion never acknowledged within the window; escalation-timer firing
  rate. **This measure is partly a human/workflow property, not only a system property** —
  it must not be treated as an engineering SLO alone.
- **Target:** **VALIDATION REQUIRED** (Gate G1; also a human-factors validation, Gate G4).
- **Traces to:** DOM-0005; ADR-0009; VAL: pending validation backlog; HAZ-0017, HAZ-0024; SAF-0016, SAF-0017.

### QAS-0007 — Stale, missing, invalid and conflicting data: prevalence and visibility

- **Stimulus:** A required input for an active pathway is missing, stale, invalid, partial or
  in conflict with another source.
- **Environment:** Normal; source outage; correction storm; merge/unmerge of a patient
  identity; clock skew between source and V2; late-arriving data.
- **Response:** The condition is represented explicitly in the evaluation status **and** is
  visibly distinguishable in every projection and UI state. It is never coerced to zero,
  normal, no-risk, or a silent no-fire (DOM-0004).
- **Measure:** Prevalence of each condition per pathway, tenant and interval; proportion of
  affected evaluations whose UI state visibly conveys the condition **without relying on
  color alone**; count of coercion defects found by reference-vector tests (must be zero).
- **Target:** **VALIDATION REQUIRED** (Gate G1); the visibility requirement is a **binding
  invariant, not a tunable** — DOM-0004 admits no error budget.
- **Traces to:** DOM-0004, DOM-0007, DOM-0008; ADR-0008; HAZ-0005, HAZ-0006, HAZ-0039; SAF-0001, SAF-0002, SAF-0005.

### QAS-0008 — Queue lag and replay backlog

- **Stimulus:** Ingress or event volume exceeds processing rate, or a replay/backfill is
  initiated.
- **Environment:** Normal; burst load; consumer restart; poison message; dead-letter
  accumulation; replay concurrent with live traffic.
- **Response:** Lag and backlog are measured, bounded and visible to operators; safety-
  relevant lag is surfaced to clinicians as a degraded state rather than silently absorbed;
  replay does not corrupt or duplicate live evaluation.
- **Measure:** Queue depth and consumer lag over time; dead-letter count by reason; replay
  backlog and drain rate; duplicate-effect count during replay (must be zero given
  idempotency).
- **Target:** **VALIDATION REQUIRED** (Gate G1).
- **Traces to:** DOM-0005, DOM-0006, DOM-0007; ADR-0010; HAZ-0011, HAZ-0017; SAF-0014, SAF-0016.

### QAS-0009 — Projection lag and rebuildability

- **Stimulus:** A read projection must reflect newly durable state; separately, a projection
  must be rebuilt from scratch.
- **Environment:** Normal; after a schema change; after a defect requiring rebuild; during
  live traffic.
- **Response:** Projection lag stays bounded and observable; any projection can be fully
  rebuilt from durable events, producing a result identical to the incrementally maintained
  one.
- **Measure:** Projection lag distribution; full rebuild wall-clock time; count of
  discrepancies between rebuilt and incremental projections (must be zero).
- **Target:** **VALIDATION REQUIRED** (Gate G1).
- **Traces to:** DOM-0006; ADR-0011; TST: pending test architecture; HAZ-0017; SAF-0015.

### QAS-0010 — Reconciliation divergence between operational and analytical lanes

- **Stimulus:** The same clinical facts exist in V2's operational store and in the analytical
  lane.
- **Environment:** Normal; after backfill; after a source correction; after a merge/unmerge;
  after a downtime and recovery.
- **Response:** Divergence is detected, quantified, attributed to a cause, and resolved
  through the defined precedence rule — never by a silent pick-one.
- **Measure:** Count and rate of diverging facts by class and cause; time to detect; time to
  resolve; count of divergences discovered by a human rather than by the reconciliation job
  (a leading indicator that the detection itself is inadequate).
- **Target:** **VALIDATION REQUIRED** (Gate G1).
- **Traces to:** DOM-0002, DOM-0008; ADR-0006, ADR-0001; HAZ-0008, HAZ-0040; SAF-0014, SAF-0032, SAF-0033.
- **Note:** SOURCE (prompt §7.3): "Never create two ungoverned clinical sources of truth."
  This scenario is how "governed" is evidenced rather than asserted.

### QAS-0011 — Rule bundle, version, and load health

- **Stimulus:** A signed rule bundle is activated, rolled back, or fails to load.
- **Environment:** Normal activation; failed signature verification; missing terminology
  snapshot; partial rollout across units; emergency kill-switch activation.
- **Response:** The active rule version per pathway is known, verifiable and auditable at
  every instant; a bundle that cannot be verified is never activated; a failed load is an
  explicit degraded state, never a silent fallback to a previous or empty rule set.
- **Measure:** Time from activation request to fully active; count of load/verification
  failures by reason; count of evaluations executed against an unverified or ambiguous rule
  version (must be zero); kill-switch actuation time.
- **Target:** **VALIDATION REQUIRED** (Gate G1); the "must be zero" items are invariants.
- **Traces to:** DOM-0003; ADR-0007, ADR-0022; HAZ-0019, HAZ-0020; SAF-0020, SAF-0021.

### QAS-0012 — Connector availability

- **Stimulus:** V2 depends on an external connector (AMH, terminology, notification, identity,
  or a non-AMH signal source) that becomes unavailable or degraded.
- **Environment:** Full outage; partial/slow responses; authentication failure; rate limiting;
  certificate or key rotation.
- **Response:** The dependency's state is detected, surfaced as an explicit degraded mode,
  and does not cause silent data loss or a false impression of normal operation.
- **Measure:** Availability and error rate per connector; time to detect degradation; time to
  surface it to operators and, where safety-relevant, to clinicians.
- **Target:** **VALIDATION REQUIRED** (Gate G1).
- **Traces to:** DOM-0007; ADR-0001, ADR-0013, ADR-0020; HAZ-0025, HAZ-0030; SAF-0024, SAF-0025.
- **Note:** AMH availability is measured on an environment that, at the pinned commit, exists
  only as `dev` — so this scenario is currently unmeasurable for the most important connector.

### QAS-0013 — Connector contract drift detection

- **Stimulus:** An external contract (schema, profile, manifest digest, value set, API
  version) changes at the producer.
- **Environment:** Announced change; **unannounced** change; digest mismatch; deprecation
  window elapsing.
- **Response:** The drift is detected automatically by comparing against the pinned contract,
  before it reaches clinical evaluation; unpinned or unverified contract material is never
  consumed.
- **Measure:** Time from producer change to detection; count of drifts detected in production
  rather than in CI; count of evaluations executed against drifted contracts (must be zero).
- **Target:** **VALIDATION REQUIRED** (Gate G1).
- **Traces to:** ADR-0001, ADR-0013; `../../08-interoperability/amh-data/` contract inventory;; HAZ-0032, HAZ-0040; SAF-0028, SAF-0033.
  HAZ-0032, HAZ-0040; SAF-0028, SAF-0033.

### QAS-0014 — Cross-tenant policy denials and suspicious access

- **Stimulus:** A request attempts to read or change data outside its authorized tenant,
  facility, encounter, role or purpose — whether by defect, misconfiguration or attack.
- **Environment:** Normal; forged or missing tenant claim; mismatched URL partition and token
  claim; caller-supplied tenant header; a merged/unmerged patient identity; break-glass
  access; a replayed token.
- **Response:** The request **fails closed**, is denied, and is audited with sufficient
  context to investigate, without leaking PHI into the denial record or the error response.
- **Measure:** Count and rate of cross-tenant denials by cause; count of successful
  cross-tenant accesses (**must be zero** — this is an invariant with no error budget);
  detection and alerting time for anomalous access patterns; adversarial-test pass rate.
- **Target:** **VALIDATION REQUIRED** for detection/alerting timings (Gate G1); the
  zero-successful-cross-tenant-access requirement is **binding and not negotiable**.
- **Traces to:** DOM-0001; ADR-0003, ADR-0015, ADR-0016; Gate G6; HAZ-0003, HAZ-0013, HAZ-0014; SAF-0007, SAF-0008.

### QAS-0015 — Backup success, restore integrity, RPO and RTO

- **Stimulus:** Data loss, corruption, region/site failure, or a scheduled restore rehearsal.
- **Environment:** Full restore; point-in-time restore; partial corruption; restore into a
  clean environment; restore verified by someone other than the migration implementer
  (`decision-rights.md` §3 pair 6).
- **Response:** Backups complete and are verified; a restore reproduces a consistent,
  complete, auditable clinical state including the audit chain and provenance; the recovery
  point and time are measured, not estimated.
- **Measure:** Backup success rate; measured RPO and RTO from **rehearsed** restores; count of
  restores that failed verification; audit-chain continuity across the restore boundary.
- **Target:** **VALIDATION REQUIRED** (Gate G1 for the clinical tolerance; `AUTH-OPERATIONS`
  accepts RTO/RPO, and per `decision-rights.md` agents may not).
- **Traces to:** DOM-0002, DOM-0006; ADR-0019, ADR-0020, ADR-0023; Gate G8; HAZ-0034; SAF-0036.

### QAS-0016 — Evidence-export integrity

- **Stimulus:** Release evidence, an audit export, or a safety-case artifact is exported for
  an approval, an incident review, or a regulatory or institutional request.
- **Environment:** Routine release; incident investigation; legal hold; export of a corrected
  or superseded record.
- **Response:** The export is complete, tamper-evident, attributable, reproducible from the
  system of record, and shows corrections and supersessions explicitly rather than the
  latest value alone.
- **Measure:** Export verification pass rate; count of exports that could not be reproduced
  from the system of record (must be zero); time to produce a complete export for a named
  incident.
- **Target:** **VALIDATION REQUIRED** (Gate G1 / `AUTH-PRIVACY-LEGAL`).
- **Traces to:** DOM-0002; ADR-0018; Gate G8; HAZ-0035; SAF-0023.

---

## 3. Scenarios derived from §9.1 (architecture principles)

### QAS-0017 — Safety state precedes severity (principle 1)

- **Stimulus:** A clinician views a patient, bed grid or work queue in which some evaluations
  are missing, partial, stale or invalid.
- **Environment:** Mixed states across the unit; high-acuity distraction; handoff;
  reduced-motion and screen-reader use; small viewport and zoomed reflow.
- **Response:** The **safety state** (evaluated / not evaluated / partial / stale / invalid)
  is perceivable before, or at least as prominently as, any severity or score value — so a
  patient who was never evaluated is never visually indistinguishable from one evaluated as
  low risk.
- **Measure:** Human-factors task performance: proportion of participants correctly
  identifying non-evaluated patients under time pressure; automated checks that no state is
  conveyed by color alone; count of UI states where safety state is absent (must be zero).
- **Target:** **VALIDATION REQUIRED** (Gate G1 for the need, Gate G4 for the human-factors
  evidence).
- **Traces to:** DOM-0004, DOM-0007; ADR-0008, ADR-0021; VAL: pending validation backlog; HAZ-0005, HAZ-0021, HAZ-0037; SAF-0001, SAF-0006, SAF-0034.

### QAS-0018 — Tenant and encounter ownership invariance (principle 2)

- **Stimulus:** Any read, change, decision or action at any layer — identity, storage, cache,
  event, query, subscription, audit.
- **Environment:** Every layer, including the ones most often forgotten: cache entries,
  real-time subscriptions, background jobs, replays, exports and support tooling.
- **Response:** Ownership is attached, enforced and traceable at every layer; a layer that
  cannot carry it fails closed rather than widening scope.
- **Measure:** Adversarial property tests attempting to read/cache/publish/query/subscribe/
  audit without or across ownership at every named surface — all must fail closed; count of
  surfaces not yet covered by such a test (the honest measure of how far the invariant has
  actually been verified, as opposed to asserted).
- **Target:** **VALIDATION REQUIRED** for coverage timelines; the fail-closed behaviour
  itself is **binding**.
- **Traces to:** DOM-0001; ADR-0003, ADR-0016; TST-DOM-0001 (planned); HAZ-0003, HAZ-0013; SAF-0007, SAF-0008.

### QAS-0019 — Provenance and correction integrity (principle 3)

- **Stimulus:** A clinical fact is corrected, superseded, duplicated, or arrives in conflict
  with another source.
- **Environment:** Correction after evaluation; correction after an alert fired; conflicting
  values from two sources; a tombstone/cancellation; a merge/unmerge affecting the subject.
- **Response:** The original value remains retrievable; the correction is explicit and linked;
  conflicts are represented, not silently resolved; downstream evaluations and alerts that
  depended on the superseded value are identifiable.
- **Measure:** Count of in-place mutations of persisted facts (must be zero); proportion of
  corrections whose downstream evaluations/alerts were correctly identified and re-assessed;
  time from correction receipt to downstream re-assessment.
- **Target:** **VALIDATION REQUIRED** for timing; immutability is **binding**.
- **Traces to:** DOM-0002; ADR-0005; TST-DOM-0002 (planned); HAZ-0008, HAZ-0027; SAF-0014, SAF-0029.

### QAS-0020 — Deterministic, versioned, replayable evaluation (principle 4)

- **Stimulus:** A historical evaluation is replayed for audit, incident review, or rule
  performance analysis.
- **Environment:** Different host, time, infrastructure version and framework version from
  the original; original inputs including their as-of-then quality states.
- **Response:** The replay reproduces the original `EvaluationRecord` field-for-field unless a
  different rule version is deliberately applied.
- **Measure:** Replay reproduction rate (must be 100%); count of non-deterministic inputs
  discovered by mutation testing (wall-clock reads outside modelled time points, unordered
  aggregation, network calls inside the evaluator) — target zero.
- **Target:** **VALIDATION REQUIRED** for the replay window and corpus size; determinism
  itself is **binding**.
- **Traces to:** DOM-0003; ADR-0002 (topology affects this), ADR-0007; TST-DOM-0003 (planned); HAZ-0021; SAF-0019.

### QAS-0021 — Command idempotency, concurrency safety, transactional publication (principle 5)

- **Stimulus:** The same command is submitted twice; or two clinicians act on the same alert
  concurrently; or the process crashes between commit and publish.
- **Environment:** Duplicate submission via retry; two authorized users acting simultaneously;
  network partition mid-command; crash at each identified crash point.
- **Response:** Exactly one effect; the second actor receives a clear, non-destructive
  outcome; no command is acknowledged as successful whose safety-relevant effect did not
  durably occur and publish.
- **Measure:** Duplicate-effect count under retry storms (must be zero); lost-update count
  under concurrent action (must be zero); count of crash points at which an acknowledged
  command left no durable effect (must be zero); crash-point test coverage.
- **Target:** **VALIDATION REQUIRED** for coverage; the zero-counts are **binding**.
- **Traces to:** DOM-0005; ADR-0009, ADR-0010; HAZ-0009, HAZ-0023, HAZ-0033; SAF-0013, SAF-0017, SAF-0018.

### QAS-0022 — Durability precedes immediacy (principle 6)

- **Stimulus:** A real-time update is delivered to a client; separately, the real-time channel
  fails.
- **Environment:** Channel disconnect/reconnect with resume cursor; message loss; client
  offline; bounded-queue overflow; polling fallback.
- **Response:** Every real-time update is derived from durable, replayable state; losing the
  channel loses no clinical information, only immediacy; the client reconciles by polling and
  the user is told the channel is degraded.
- **Measure:** Count of clinically material facts observable only via the real-time channel
  (must be zero); post-reconnect reconciliation completeness; time from channel loss to
  user-visible degraded indication.
- **Target:** **VALIDATION REQUIRED** for timings; "no fact exists only in a message" is
  **binding** (prompt §3 rule 9).
- **Traces to:** DOM-0006; ADR-0010, ADR-0011; HAZ-0015; SAF-0015.

### QAS-0023 — Explicit degraded mode at every level (principle 7)

- **Stimulus:** A component, data feed, rule, workflow or UI capability degrades or fails.
- **Environment:** Each of the five levels independently, and in combination; partial failure
  where most of the system looks healthy.
- **Response:** The degradation is explicit at its level, visible to the users affected by it,
  accompanied by guidance and a manual fallback, and recorded for post-recovery
  reconciliation. **Readiness never reports healthy while a safety-relevant capability is
  degraded.**
- **Measure:** For each injected degradation: time to detect, time to surface to the affected
  user, presence of a documented and rehearsed fallback, and post-recovery reconciliation
  completeness; count of degradations with no user-visible representation (must be zero).
- **Target:** **VALIDATION REQUIRED** for timings; visibility is **binding**.
- **Traces to:** DOM-0007; ADR-0011, ADR-0020, ADR-0021; VAL: pending validation backlog; HAZ-0024, HAZ-0025; SAF-0024, SAF-0025.

### QAS-0024 — Module-boundary conformance (principle 8)

- **Stimulus:** A change introduces a dependency that violates the declared module boundaries
  or dependency direction.
- **Environment:** Ordinary development; a deadline-pressured change; a refactor.
- **Response:** The build **fails**. The check is blocking, never advisory (prompt §3 rule 13).
- **Measure:** Count of boundary violations reaching the main branch (must be zero); a
  deliberately violating fixture proving the check fires; per-module dependency-direction
  conformance.
- **Target:** **VALIDATION REQUIRED** for scope of enforcement; blocking-not-advisory is
  **binding**.
- **Traces to:** ADR-0002 §5.1 C5; TST: pending test architecture; HAZ-0031; SAF-0030.

### QAS-0025 — Standards conformance with evidence (principle 9)

- **Stimulus:** V2 exchanges data claimed to conform to a profile, value set, or contract.
- **Environment:** Valid instances; deliberately invalid negative fixtures; unknown codes;
  unknown or non-UCUM units; version skew between producer and consumer.
- **Response:** Conformance is demonstrated by executed tests against versioned profiles;
  unknown codes or units are quarantined or explicitly represented — **never silently
  coerced** (prompt §12.2).
- **Measure:** Conformance-suite pass rate against pinned profile versions; count of negative
  fixtures correctly rejected; count of silent coercions found (must be zero); coverage of
  required fields, cardinalities, bindings and search parameters.
- **Target:** **VALIDATION REQUIRED**; no-silent-coercion is **binding**.
- **Traces to:** DOM-0008; ADR-0013; Gate G5; HAZ-0032; SAF-0028.

### QAS-0026 — Release evidence as a product output (principle 10)

- **Stimulus:** A release is proposed for promotion.
- **Environment:** Routine release; hotfix; rule-bundle-only release; rollback.
- **Response:** A complete, reproducible evidence bundle exists — artifact digest, rule-bundle
  hashes, SBOM/dependencies, migrations, configs, traceability snapshot — assembled by the
  pipeline rather than by hand, and traceable to the exact artifact promoted.
- **Measure:** Proportion of releases with a complete bundle (a partial bundle counts as
  absent); count of manual/attested items that should be automated; reproducibility of the
  bundle from the pipeline.
- **Target:** **VALIDATION REQUIRED**; completeness is a Gate G8 precondition.
- **Traces to:** ADR-0022, ADR-0020; Gate G8; HAZ-0031; SAF-0030.

### QAS-0027 — Reversibility and exit cost (principle 11)

- **Stimulus:** An accepted decision must be reversed — a boundary, a platform, a managed
  service, an extracted module, a vendor.
- **Environment:** Planned reversal; forced reversal (vendor withdrawal, contract loss,
  incident).
- **Response:** The reversal path is documented, its stranded assets identified, and its data
  migration preserves clinical-record custody, audit continuity and replay capability.
- **Measure:** For each accepted architectural decision: whether a reversal path is
  documented; estimated exit cost with its basis; whether the reversal has ever been
  rehearsed (usually not — and knowing that is the point).
- **Target:** **VALIDATION REQUIRED**.
- **Traces to:** ADR-0001 §8.1, ADR-0002 §8.1, ADR-0019; prompt §9.4 (exit cost is a named
  technology-selection criterion).

### QAS-0028 — PHI minimization across every surface (principle 12)

- **Stimulus:** Any PHI-bearing operation — request, evaluation, alert, notification, log,
  trace, queue message, cache entry, export, backup, screenshot, support workflow, or MCP
  tool call.
- **Environment:** Normal; error paths (where exception text most often leaks); debug/verbose
  modes; support access; third-party processors; model-provider calls.
- **Response:** PHI is collected, moved, displayed, retained and disclosed only as necessary
  for an approved purpose; error responses and telemetry carry no PHI or internal exception
  text; PHI is never sent to a model provider without approved legal, privacy, security,
  residency and contractual controls.
- **Measure:** Automated PHI-pattern scanning of logs, traces and fixtures with count of
  findings (target zero); count of PHI fields in each boundary payload versus the minimum
  justified by purpose; count of surfaces not yet scanned (the honest coverage measure).
- **Target:** **VALIDATION REQUIRED** for scan coverage; zero PHI in logs, traces, fixtures and
  source control is **binding** (prompt §3 rule 12).
- **Traces to:** ADR-0014, ADR-0017, ADR-0018; Gate G6; HAZ-0028; SAF-0026.

### QAS-0029 — Readiness represents safe capability, not process liveness

- **Stimulus:** An orchestrator, load balancer or operator queries readiness.
- **Environment:** Process alive but rule bundle unloaded; process alive but source feed
  stale; process alive but projection lag beyond tolerance; process alive but a dependency
  fails closed.
- **Response:** Readiness reports **not ready** whenever the instance cannot safely perform
  its clinical function, and the specific degraded dimension is exposed without leaking PHI
  or internal secrets.
- **Measure:** For each injected unsafe-but-alive condition: does readiness correctly report
  not-ready? Count of conditions where a live-but-unsafe instance reported ready (must be
  zero).
- **Target:** **VALIDATION REQUIRED** for the tolerance thresholds; correctness of the
  semantic is **binding** (prompt §15.3: "Readiness must represent safe capability, not only
  process liveness").
- **Traces to:** DOM-0007; ADR-0020; HAZ-0025, HAZ-0031; SAF-0024, SAF-0030.

---

## 4. Coverage gaps — scenarios deliberately not written here

PROPOSAL — these belong to specialists not yet activated. They are listed so that this
document's scope is not mistaken for completeness.

| Gap | Owner specialist | Why not written here |
|---|---|---|
| Accessibility scenarios (WCAG 2.2 AA, screen reader, keyboard, zoom/reflow, reduced motion, touch targets, live-region announcements) | Accessibility and inclusive-use specialist | Requires the interaction design to exist; touched only indirectly in QAS-0017 and QAS-0023 |
| pt-BR clinical language and localization quality | Clinician-workspace information architect + clinical reviewers | Requires validated clinical vocabulary |
| Alert burden: alerts per patient-day, override rate, alert fatigue | Alerting human-factors specialist | Requires an approved pathway portfolio (Gate G2) |
| Load, soak, capacity and cost-per-tenant economics | Platform reliability engineer + FinOps analyst | Requires a platform decision (ADR-0019) and a cost model |
| Clinical performance: sensitivity, specificity, PPV, NPV, calibration, subgroup equity | Clinical validation biostatistician | Not architecture quality attributes; governed by Gate G2 and the validation plan |
| Supply-chain integrity (build reproducibility, signature verification, SBOM completeness) | Software supply-chain and CI policy engineer | Partly touched by QAS-0026; deserves its own set under ADR-0022 |

---

## 5. What this document deliberately does not do

- It does **not** set a single numeric target, threshold, percentile value or error budget.
- It does **not** claim any scenario is currently measurable — §1.3 lists six prerequisites,
  none of which is satisfied.
- It does **not** create requirement IDs. See §1.2.
- It does **not** distinguish binding invariants from negotiable SLOs by its own authority:
  where a scenario says a value "must be zero", that flows from a DOM invariant or an
  explicit prompt rule, and the citation is given. Anything else is a candidate SLO awaiting
  Gate G1.
