---
doc_id: QVT-G7-SLICE-TEST-PLAN
status: PROPOSAL
owner: UNASSIGNED — VALIDATION REQUIRED
source: INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §14 Gate G7 (the ten-step vertical slice), §1 (the ten failure/degraded conditions the minimum safety loop must be demonstrated under)
date_collected: 2026-08-14
collector: Safety-focused test architecture engineer
last_updated: 2026-08-14
---

# IntensiCare V2 — Gate G7 Vertical-Slice Test Plan

## 0. Status and authority boundary

**PROPOSAL.** This document operationalizes Gate G7 into a concrete,
condition-by-condition test obligation set. It does **not** implement any test,
select any framework, or approve any pathway's clinical content. It does not
declare Gate G7 passed — no V2 code exists (`docs/05-clinical-safety/safety-plan.md`
§11 item 7), so nothing in this document has been executed.

## 1. Citation shorthand

| Token | Resolves to |
|---|---|
| `PROMPT:n-m` | `https://github.com/Omni-Saude/intensicare-V2/blob/main/INTENSICARE_V2_ORCHESTRATOR_PROMPT.md`, lines n–m |
| `DOM-xxxx` | `docs/03-domain/invariants/DOM-invariants.md` |
| `HAZ-xxxx` | `docs/05-clinical-safety/hazard-log.md` |
| Layer `#` | `test-strategy.md` §4.2, layer number `#` |

## 2. The G7 slice, verbatim, and its two extra obligations

SOURCE (`PROMPT:810-828`):

```text
pinned AMH/source fixture
→ authenticated tenant/encounter-scoped ingest
→ provenance and data-quality validation
→ one independently reviewed deterministic evaluation
→ explicit evaluation status
→ durable alert/work item plus outbox
→ authorized read model and real-time update
→ clinician-visible explanation/freshness
→ concurrent-safe human action
→ immutable audit and reconciliation
```

Plus two obligations that apply to the slice as a whole, not to any single step:

- **"The slice must demonstrate both the happy path and representative
  failure/degraded paths."** — this is what §4 below exists to make concrete and
  exhaustive, using the ten conditions named at `PROMPT:45`.
- **"It is not a production release."** — passing this plan is evidence for Gate
  G7 only. It is not release evidence for Gate G8, does not imply any pathway is
  clinically validated, and does not imply AMH compatibility (Gate G3) or
  security/accessibility sign-off (Gates G5/G6) — each of those has its own gate
  and its own named accepter (`decision-rights.md`).
- **"Complete automated evidence"** (the eleventh listed slice element,
  `PROMPT:825`) is cross-cutting: every one of the ten steps' test results must be
  captured as linked, traceable evidence (`test-strategy.md` §5), not merely
  observed to pass once by whoever ran it.

## 3. The ten conditions (`PROMPT:45`) and their general meaning in this plan

SOURCE (`PROMPT:45`): "Do not expand breadth until this loop is demonstrated end
to end under normal, missing, stale, duplicate, delayed, conflicting, corrected,
unauthorized, disconnected, and partially failed conditions."

To apply these consistently across ten structurally different steps, this plan
fixes one general meaning per condition, then applies it (or explicitly marks it
**N/A with a stated rationale** — never silently omitted) at each step:

| Condition | General meaning in this plan |
|---|---|
| **normal** | Fully valid, complete, fresh, authorized, and connected — the happy path for that step. |
| **missing** | A required element the step needs (input, field, identity/context, timestamp) is absent. |
| **stale** | An element the step needs is present but aged beyond its validity/freshness threshold — data freshness, credential/session freshness, or projection/cursor lag, depending on the step. |
| **duplicate** | The same command, event, fact, or action is delivered or attempted more than once. |
| **delayed** | An element or action arrives, or completes, later than expected timing — distinct from *stale* (which is about age relative to "now"): *delayed* is about lateness in the pipeline itself. |
| **conflicting** | Two representations of what should be the same fact or state disagree and are not yet reconciled. |
| **corrected** | A later authoritative update supersedes an earlier value or record for the same fact or state. |
| **unauthorized** | The acting party or context lacks the authorization, tenant, or purpose binding the step requires. |
| **disconnected** | A dependency the step needs (network, database, broker, real-time channel, downstream consumer) is unavailable. |
| **partially failed** | A multi-part operation at that step succeeds for some parts and fails for others. |

**Why N/A entries are written out, not omitted:** an unexplained gap in a
condition matrix is exactly the kind of silent absence DOM-0004/DOM-0007 forbid
at the product level; this plan applies the same discipline to itself. Every N/A
below states which other step or general reason actually covers that condition,
so no combination is silently dropped from consideration.

## 4. Per-step condition matrix

For each step: a one-line restatement of the step, the primary `DOM`/`HAZ` links,
then the ten-condition table (Condition | Demonstration required, or N/A +
rationale | Linked layer(s) from `test-strategy.md` §4.2).

### Step 1 — Pinned AMH/source fixture

**Primary links:** DOM-0002 (provenance), DOM-0009 (never invent a timestamp);
environment per `test-environment-design.md` §5.

| Condition | Demonstration required | Layer(s) |
|---|---|:--:|
| normal | The fixture validates structurally against the pinned schema/profile/digest (`test-environment-design.md` §5.3) and the loader accepts it unmodified. | 6 |
| missing | A fixture with a required field explicitly absent loads with that absence preserved and visible, never defaulted or coerced. | 5, 6 |
| stale | A fixture whose observed/effective/issued times are far in the past relative to a frozen test "now" loads with all times preserved verbatim (DOM-0009); freshness is computed downstream, not corrected at load time. | 1, 5 |
| duplicate | Two fixtures share the same source-record identity/idempotency key; the loader itself does not deduplicate (deduplication is proven at step 2), but the fixture set makes duplication representable and stable. | 6 |
| delayed | A fixture models an unusually large issued→received gap (batch-style lateness); the gap is preserved, not smoothed. | 5 |
| conflicting | Two fixtures assert different values for what should be the same fact (same encounter + code + effective time); both load without the loader silently picking one. | 5 |
| corrected | A fixture explicitly models a correction referencing an earlier fixture's identity; the reference is preserved and resolvable. | 5, 6 |
| unauthorized | **N/A.** Loading a pinned fixture is a test-harness action against the fixture/emulator source, not an authenticated clinical request. Authorization is first exercised at step 2. | — |
| disconnected | The fixture/emulator source being unreachable must fail the build/test run loudly and visibly, never silently substitute a stale cached fixture set without flagging drift (`test-strategy.md` §6, schema-drift discipline). | 6 |
| partially failed | A fixture bundle containing some well-formed and some malformed records reports per-record validation results, never an all-or-nothing bundle-level pass. | 6 |

### Step 2 — Authenticated tenant/encounter-scoped ingest

**Primary links:** DOM-0001 (tenant/encounter ownership); HAZ-0001, HAZ-0002,
HAZ-0003 (wrong patient/encounter/tenant association).

| Condition | Demonstration required | Layer(s) |
|---|---|:--:|
| normal | A correctly authenticated request, whose token tenant claim equals the target tenant/encounter scope, is durably accepted. | 7, 12 |
| missing | Required identity/context (tenant claim, encounter reference) absent from the request → rejected/quarantined with a specific, visible reason, never defaulted to a guessed scope (DOM-0001). | 7, 12 |
| stale | The presented credential/session is expired or past its validity window → rejected, not silently renewed or accepted with only a warning. | 12 |
| duplicate | The same envelope/idempotency key is submitted twice (retry, replay) → accepted exactly once; the second submission is recognized as a duplicate and creates no second durable record. | 7, 8 |
| delayed | The ingest request arrives materially later than the source's issued time (network/queue delay) → accepted, with the delay visible in preserved timestamps, not treated as an error by itself. | 5 |
| conflicting | Two ingest requests for what should be the same fact but different values arrive close together → both persisted with an explicit Conflict, not one silently overwriting the other (DOM-0002). | 5, 7 |
| corrected | An ingest request explicitly flagged as a correction of a previously ingested envelope → linked, not treated as a new unrelated fact. | 5, 7 |
| unauthorized | Token tenant claim does not equal the target tenant/URL scope, or purpose/scope is insufficient → rejected fail-closed, mirroring the tenant-partition-equality discipline `test-environment-design.md` §5.4 requires the AMH emulator to reproduce faithfully, applied here to V2's own ingest boundary (DOM-0001). | 7, 12 |
| disconnected | The durable ingest store (or its immediate dependency) is unavailable at submission time → the client receives an explicit failure, never a false "accepted" acknowledgment ahead of persistence (DOM-0006). | 8, 13 |
| partially failed | A single ingest request carries a batch of envelopes where some succeed and some fail validation → per-envelope result reported, never one aggregate pass/fail for the whole batch. | 7 |

### Step 3 — Provenance and data-quality validation

**Primary links:** DOM-0002, DOM-0008 (independent status dimensions), DOM-0009;
HAZ-0038, HAZ-0039, HAZ-0040.

| Condition | Demonstration required | Layer(s) |
|---|---|:--:|
| normal | A complete, well-formed observation is validated, its provenance chain established, and its source data-quality state (e.g., AMH-shaped `valid`) recorded as a distinct dimension from any V2 evaluation-status judgment yet to come (DOM-0008). | 1, 5 |
| missing | An observation with a required field absent is flagged with an explicit "missing" marker feeding the downstream not_evaluated/partial determination — never silently dropped or defaulted. | 1, 5 |
| stale | An observation's age relative to its received/issued times is preserved so a later step can compute staleness; validation does not itself discard old data. | 5 |
| duplicate | The same observation, already validated once, arrives again → recognized via idempotency key and not re-validated or double-counted in provenance. | 7, 8 |
| delayed | An observation's received time is materially later than its effective time → validation proceeds and preserves the gap; lateness alone does not block validation. | 5 |
| conflicting | Two validated observations disagree for the same fact → an explicit Conflict record is created; validation does not pick a winner (DOM-0002). | 5 |
| corrected | A validated correction supersedes a prior observation → the prior observation's provenance chain is preserved (never overwritten) and the correction is linked (DOM-0002). | 5 |
| unauthorized | **N/A.** Authorization was already the gate at step 2; this step operates only on already-admitted envelopes. Recorded explicitly so the omission is visible, not silent. | — |
| disconnected | A validation-time dependency (e.g., a terminology lookup) is unavailable → the observation's validation outcome is recorded as degraded/incomplete (DOM-0007), never silently marked "validated." | 5, 13 |
| partially failed | A batch of observations validated together has some pass and some fail → each observation's own outcome is independently visible. | 5 |

### Step 4 — One independently reviewed deterministic evaluation

**Primary links:** DOM-0003 (deterministic/replayable), DOM-0004 (no silent
coercion); HAZ-0005 (the confirmed legacy silent-zero defect), HAZ-0006,
HAZ-0021.

| Condition | Demonstration required | Layer(s) |
|---|---|:--:|
| normal | A `RuleVersion` evaluates a complete, valid, fresh input set and produces a deterministic `EvaluationRecord`; replaying the identical input set reproduces an identical result (DOM-0003). | 1, 3, 4 |
| missing | A required input is absent at evaluation time → the evaluation reports the omission explicitly, never substituting zero/normal — the **direct HAZ-0005 regression test**. | 1, 4, 5 |
| stale | A required input is present but outside its freshness window → the evaluation reports staleness explicitly, not a value computed as if fresh. | 4, 5 |
| duplicate | The same evaluation trigger fires twice for an unchanged input set → produces the same `EvaluationRecord` rather than two divergent or duplicated records. | 2, 3 |
| delayed | The evaluation runs materially later than the triggering input's arrival → still binds to "inputs as of the evaluation instant," never silently mislabeling a stale snapshot as current. | 2, 5 |
| conflicting | Inputs include an unresolved Conflict → the evaluation reports `invalid` (or the pathway's defined conflict handling), never silently resolving the conflict itself. | 4, 5 |
| corrected | A correction changes an input after a prior evaluation already used the pre-correction value → the prior `EvaluationRecord` is immutable and unchanged; a new evaluation is triggered and produces its own record (DOM-0002, DOM-0003). | 1, 4, 5 |
| unauthorized | **N/A.** Evaluation is an internal deterministic computation, not an actor-authorized action; authorization governs who may *view* or *act on* the result (steps 7, 9), not triggering the computation. | — |
| disconnected | The rule-runtime's dependency (e.g., a signed rule-bundle store) is unavailable → the evaluation explicitly reports `not_evaluated` due to rule unavailability, never silently skipping the encounter with no trace (DOM-0007). | 4, 13 |
| partially failed | A pathway with multiple criteria has some evaluate successfully and others fail (e.g., one terminology lookup fails, another succeeds) → the resulting status is `partial`, with the specific failed criterion visible, never collapsed to a full pass or full failure. | 4, 5 |

**Independent-review requirement specific to this step.** `PROMPT:817`'s
"independently reviewed" qualifier is a distinct, additional obligation beyond
the ten conditions above: at minimum the *normal*-condition test must be backed
by a `CRV-xxxx` vector whose `clinical_expectation_provenance.review_status:
VALIDATED` and `authorship.independence_confirmed: true` both hold
(`clinical-reference-vector-standard.md` §8.3). **A passing engineering-only test
does not satisfy this obligation.** Until a named clinician performs that review,
this step's evidence is `VALIDATION REQUIRED`, and the G7 exit record (§6) must
say so explicitly rather than let a green automated suite stand in for it.

### Step 5 — Explicit evaluation status

**Primary links:** DOM-0004, DOM-0008; HAZ-0021 (no-fire opacity), HAZ-0040
(dimension collapse).

| Condition | Demonstration required | Layer(s) |
|---|---|:--:|
| normal | A complete, valid evaluation yields `valid` status, visibly and unambiguously represented downstream. | 1, 9 |
| missing | An evaluation degraded by missing input yields `not_evaluated` or `partial` per the pathway's defined rule, visibly distinct from `valid` in every downstream projection (DOM-0004, DOM-0007). | 1, 5, 9 |
| stale | An evaluation whose inputs aged past the freshness window yields `stale`, visibly distinct from `valid`. | 1, 5, 9 |
| duplicate | Two identical evaluation-status records for the same encounter/instant are not both surfaced as if independent — status representation is idempotent with respect to the underlying evaluation. | 7, 8 |
| delayed | A status computed from a delayed evaluation still carries its own Evaluated time distinctly from Displayed time (`time-semantics.md`), so a viewer can tell the status is not instantaneous with "now." | 9 |
| conflicting | An evaluation with unresolved conflicting inputs yields `invalid`, not a status that looks like a normal determination (DOM-0002, DOM-0008). | 1, 5, 9 |
| corrected | A correction that changes a prior evaluation's inputs results in a new status record; the prior status record remains visible in history as what was known at that time, never silently replaced (DOM-0002, DOM-0003). | 1, 5 |
| unauthorized | **N/A.** Authorization governs who may *view* the status (step 7), not what status value is computed. Consistent with step 4's rationale. | — |
| disconnected | If the component computing/publishing status is unavailable, the *absence* of a status update must itself be visible as a degraded condition to any consumer relying on freshness (DOM-0007), never indistinguishable from "nothing changed." | 6, 13 |
| partially failed | A multi-pathway encounter where one pathway's status computes successfully and another fails → each pathway's status is independently visible; one pathway's failure does not suppress or corrupt another's status. | 5, 9 |

### Step 6 — Durable alert/work item plus outbox

**Primary links:** DOM-0005 (idempotent, transactional commands), DOM-0006
(durability precedes immediacy); HAZ-0015 (generated ≠ displayed).

| Condition | Demonstration required | Layer(s) |
|---|---|:--:|
| normal | A warranted evaluation produces a durable `Alert`/`WorkItem`, with its corresponding event published transactionally in the same operation (DOM-0005). | 8 |
| missing | A required field of the alert/work-item record itself (e.g., an optional assignment target) is absent → the alert is still durably created with the absence explicitly represented; creation of a safety-relevant record is never blocked on an unset optional field. | 1, 9 |
| stale | The underlying evaluation has gone stale before the alert is even durably created (slow pipeline) → the alert still carries its true Evaluated/Alerted times so staleness is computable downstream, never backdated to look fresher than it is (DOM-0009). | 5, 8 |
| duplicate | The same warranted evaluation attempts to create an alert twice (retry after partial failure) → exactly one durable alert exists; the duplicate attempt does not create a second record (DOM-0005). | 8 |
| delayed | The durable write succeeds but outbox publish is delayed (broker backpressure) → the durable record is already authoritative; the event eventually publishes without loss, and no consumer is told the alert "doesn't exist" during the delay. | 8 |
| conflicting | **N/A here.** Conflicting *inputs* were already resolved into an `invalid` status at step 5; if that status itself warrants an alert, it follows the *normal* creation path for that determination — testing "conflict" again at this step would duplicate step 5's coverage under a different name. | — |
| corrected | A correction invalidates a prior alert's basis → the prior alert is not silently deleted; its lifecycle explicitly reflects the correction (a linked superseding record or explicit annotation), preserving DOM-0002's chain at the alert level too. | 8 |
| unauthorized | An internal process attempts to create/modify an alert/work item outside its authorized service boundary → rejected — the durable-write-layer analogue of DOM-0001/DOM-0005's authorization requirement. | 7 |
| disconnected | The outbox/broker is unavailable at publish time → the durable write (already committed per DOM-0006) is unaffected; publication resumes/replays once connectivity returns, with no event lost — the direct test of "durability precedes immediacy." | 8, 13 |
| partially failed | A transaction that must durably write both the Alert and its audit linkage succeeds for one and fails for the other → the entire transaction rolls back atomically; no partially written alert exists with no audit trail (DOM-0005 combined with the audit requirement). | 7, 8 |

### Step 7 — Authorized read model and real-time update

**Primary links:** DOM-0001, DOM-0006; HAZ-0013 (cross-tenant), HAZ-0015,
HAZ-0017.

| Condition | Demonstration required | Layer(s) |
|---|---|:--:|
| normal | An authorized, correctly tenant/encounter-scoped user receives the current read-model state and, where connected, a real-time update reflecting the new alert/work item. | 9, 11 |
| missing | The read projection is queried before it has caught up to the latest durable event (projection lag) → the response is either the best-known state with a visible freshness indicator, or an explicit "catching up" state — never presented as fully current when it is not (DOM-0007). | 9 |
| stale | A real-time channel has been silently frozen (connection alive, no updates flowing) → this is detectable and surfaced (e.g., via heartbeat/staleness detection), never presented as a live, current view when it is not. | 9, 13 |
| duplicate | The same durable event is delivered to the real-time channel more than once (at-least-once broker semantics) → the read model is idempotent to the duplicate; the UI does not show the same alert twice. | 8, 9 |
| delayed | The real-time channel is backlogged → updates eventually arrive in the correct order once the backlog drains; the UI shows a visible "replaying/catching up" state during the delay, not silence. | 9 |
| conflicting | **N/A here.** Conflicting clinical data was already resolved at steps 3/5; a read-model-level "conflict" would only be a projection-rebuild inconsistency, which is captured under *disconnected*/*partially failed* below rather than as an artificial separate category. | — |
| corrected | A correction updates the read model → the prior displayed value is visibly marked corrected/superseded (per `PROMPT:667-675`'s required state vocabulary), never silently swapped with no trace. | 9 |
| unauthorized | A user/context without the correct tenant/encounter/purpose binding attempts to read → denied fail-closed, with no partial data leakage (DOM-0001, HAZ-0013). | 7, 12 |
| disconnected | The real-time channel disconnects → the client enters an explicit "offline/reconnecting" state, and on reconnection resumes from a durable cursor with reconciliation against anything missed — never silently shows a frozen, plausible-looking screen (DOM-0006, DOM-0007). | 6, 8, 13 |
| partially failed | A read query spanning multiple pathways/alerts for an encounter succeeds for some and fails for others → the response is a transparent per-item partial result, never a single opaque failure or a silently incomplete success (`PROMPT:685`). | 9 |

### Step 8 — Clinician-visible explanation/freshness

**Primary links:** `PROMPT:689` (explanation content requirements); DOM-0004,
DOM-0009.

| Condition | Demonstration required | Layer(s) |
|---|---|:--:|
| normal | The explanation surface shows inputs used, rule version, rationale, source time, and freshness for a `valid` evaluation. | 9, 10 |
| missing | The explanation surface explicitly names which required input(s) were missing when status is `not_evaluated`/`partial` — never a generic "insufficient data" with no detail. | 4, 9 |
| stale | The explanation surface shows the actual source/received time and the freshness-window comparison, so a clinician can see *why* something is stale, not just that it is. | 9 |
| duplicate | **N/A here.** Duplicate delivery was already resolved at steps 6–7; the explanation for a de-duplicated alert is identical regardless of how many delivery attempts occurred. | — |
| delayed | The explanation surface distinguishes Evaluated time from Displayed time so a clinician can see the evaluation is not instantaneous with the current view. | 9 |
| conflicting | The explanation surface for an `invalid` status explicitly names the conflicting inputs, not merely a generic "invalid" label. | 4, 9 |
| corrected | The explanation surface visibly marks a corrected value as corrected and can show what was previously known (audit-linked), per DOM-0002. | 9 |
| unauthorized | **N/A here.** Authorization to view the explanation is already covered under step 7's read-model authorization; the explanation surface renders already-authorized data and is not a separate authorization boundary. | — |
| disconnected | If the explanation surface cannot currently render (e.g., a dependency needed to fetch rule-version metadata is down), it shows an explicit degraded/unavailable state rather than a blank or misleadingly complete-looking panel. | 9, 13 |
| partially failed | If some but not all explanation elements are available (e.g., rationale renders but source-time lookup fails), the surface shows what is available and explicitly marks what is not, never suppressing the whole explanation or fabricating the missing piece. | 9 |

### Step 9 — Concurrent-safe human action

**Primary links:** DOM-0005; HAZ-0023 (lost update), HAZ-0024 (ambiguous
ownership), HAZ-0033 (partial group action).

| Condition | Demonstration required | Layer(s) |
|---|---|:--:|
| normal | An authorized clinician acknowledges/assigns/escalates/resolves a work item; the action is recorded exactly once, idempotently, and audited. | 7 |
| missing | An action submitted without a required field (e.g., no rationale where the workflow requires one) is rejected with a specific, visible reason, never silently accepted with a null. | 7 |
| stale | A user's session/credential is stale at the moment of action submission → the action is rejected (re-authentication required), never silently accepted under an expired context. | 7, 12 |
| duplicate | The same action is submitted twice (double-click, client retry) → recorded exactly once; the second submission is recognized as a duplicate, not a second state transition. | 7 |
| delayed | An action is queued/delayed before reaching the server (brief client offline period) → once delivered, it is applied against the *current* state with optimistic-concurrency protection, never blindly applied as if no time had passed. | 7 |
| conflicting | Two different clinicians submit conflicting actions on the same work item concurrently → a concurrency-safe resolution occurs (one succeeds, the other is rejected/surfaced as a conflict), never a silent lost update — the **direct HAZ-0023 regression test**. | 7 |
| corrected | An action is later found to have been based on a since-corrected fact → the action itself remains an immutable historical record of what was done and why, while the system separately reflects the correction going forward (DOM-0002 applied to human actions). | 7 |
| unauthorized | A user without the correct role/tenant/purpose binding attempts the action → denied fail-closed and audited as a denied attempt, never merely silently ignored. | 7, 12 |
| disconnected | The action-submission dependency (server, database) is unavailable → the client shows an explicit failure/unsaved-work-protection state (`PROMPT:674`), never a false "saved" confirmation ahead of durable persistence. | 7, 8, 13 |
| partially failed | A bulk/group action over multiple work items succeeds for some and fails for others → the result is a transparent per-item outcome, never a silently incomplete "all done" — the **direct HAZ-0033 regression test**. | 7 |

### Step 10 — Immutable audit and reconciliation

**Primary links:** DOM-0001, DOM-0002; HAZ-0034 (restore/reconciliation),
HAZ-0035 (incomplete audit coverage).

| Condition | Demonstration required | Layer(s) |
|---|---|:--:|
| normal | Every read/change/decision/action across steps 1–9 produces a corresponding, tamper-evident `AuditEvidence` record, and reconciliation confirms the durable record matches what was actually processed. | 7, 8 |
| missing | An action or evaluation that should have produced an audit record but did not is itself a detectable gap (an audit-completeness check), never silently unnoticed — the **direct HAZ-0035 regression test**. | 7 |
| stale | Reconciliation runs against a read model or projection that has not yet caught up → reconciliation explicitly accounts for the lag rather than reporting a false mismatch or a false match. | 7, 8 |
| duplicate | The same event is processed twice by the audit/reconciliation pipeline itself → recorded once, not double-counted in reconciliation totals. | 7, 8 |
| delayed | Reconciliation runs after a delay following an outage or backlog → it correctly accounts for everything that occurred during the delay window, not just the state at reconciliation time. | 7, 8, 13 |
| conflicting | Two representations of the same population (e.g., operational state vs. a rebuilt projection) disagree during reconciliation → the disagreement is explicitly reported and investigated, never silently resolved by preferring one side without explanation (`PROMPT:495`). | 7 |
| corrected | A correction's audit trail is itself auditable — the correction event, its supersession link, and its effect on reconciliation are all traceable (DOM-0002 applied to the audit layer itself). | 7 |
| unauthorized | An attempt to read, modify, or delete an audit record outside authorized, policy-controlled retention rules is denied and itself audited (tamper-evidence). | 7, 12 |
| disconnected | The audit store's dependency is unavailable at the moment an action occurs → per DOM-0005, the action itself must not be considered complete/committed until its audit record is durably written in the same transaction — this tests that no action can succeed while silently failing to produce its audit record. | 7, 8, 13 |
| partially failed | A reconciliation run covering multiple populations/tenants succeeds for some and fails for others → per-population results are transparent, never a single aggregate pass/fail masking a partial failure. | 7 |

## 5. Cross-cutting evidence requirements

1. **Every cell in §4 that is not marked N/A requires at least one `TST-xxxx`**
   (`test-strategy.md` §5), tagged with its step number and condition, so the
   matrix itself is a coverage-checkable artifact, not prose.
2. **"Complete automated evidence" (`PROMPT:825`) means every step's evidence is
   captured, linked, and retrievable as part of the same change** — a step whose
   test passed once on someone's machine but produced no linked, retained
   evidence does not satisfy G7.
3. **The happy-path ("normal") row alone across all ten steps is not sufficient
   evidence of G7 completion.** `PROMPT:828` explicitly requires "both the happy
   path and representative failure/degraded paths" — a slice that only
   demonstrates the ten `normal` rows has demonstrated a demo, not the slice.
4. **"Representative" does not mean "every N/A-free cell is mandatory before any
   G7 claim can be made."** This document does not decide the minimum coverage
   threshold for G7 exit (that is a human decision, §6) — it decides that the
   *full matrix* (§4) is the reference against which any claimed subset must be
   justified, so a partial-coverage G7 claim is at least visibly partial against
   a complete, pre-defined matrix rather than against an ad hoc list assembled
   after the fact.

## 6. G7 exit criteria and the open acceptance-authority question

### 6.1 What "G7 passed" would require, if claimed

- Every layer 1/3/4/5/8 (`BLOCKING (always)`) test implicated by §4's non-N/A
  cells is `passing` per its `TST-xxxx` record, with no quarantined
  blocking-always test outstanding (`test-strategy.md` §5.2, §6).
- Step 4's independent-review obligation (§4, Step 4 callout) is satisfied — a
  named clinician has validated the vector(s) backing at least the normal-path
  evaluation test, independent of the rule's implementer
  (`clinical-reference-vector-standard.md` §8).
- The slice's synthetic-data provenance is verified for every fixture used
  (`synthetic-data-strategy.md` §6–§7) — no fixture used to claim G7 may lack a
  `data_class: synthetic` record.
- A named human, not an agent, has reviewed the evidence bundle and recorded
  acceptance (`PROMPT:207`: "Agents prepare evidence; qualified humans accept...").

### 6.2 Open item — G7's accepter is not yet named anywhere in this program

`docs/00-governance/decision-rights.md` §2 names deciders for go-live/G8, ADRs,
UX/accessibility, tenant/MPI policy, and several other decision types, but **does
not currently name who accepts Gate G7 specifically.** This is recorded here as a
**LEFT OPEN** item, not resolved by this document (amending `decision-rights.md`
is outside this document's write scope): a future revision of `decision-rights.md`
should add a row naming the accepter for "first safe vertical slice / Gate G7,"
analogous to its existing "Go-live / release promotion" row, and should state
whether that accepter must be independent of whoever implements the slice
(an inference from the general self-approval prohibition, `PROMPT:1051`, but not
yet an explicit named pair in `decision-rights.md` §3).

### 6.3 What G7 passing explicitly does not establish

Per `PROMPT:828` and this program's broader gate structure:

- **Not AMH compatibility (Gate G3).** If the slice used the fixture-set/emulator
  tier (`test-environment-design.md` §5), it has at most Layer-1 declared-contract
  evidence for the specific behaviors exercised — never Layer 2–4 evidence, and
  never a general "AMH compatible" claim (`test-environment-design.md` §5.5).
- **Not clinical validation of any pathway.** Even a fully passing slice with a
  clinician-reviewed vector for the *specific scenario tested* does not validate
  a pathway for actionable production use — that requires the full portfolio
  process (`PROMPT:264-349`) and its own Gate G2.
- **Not security or accessibility sign-off (Gates G5/G6).** Layer 12/10 tests
  exercised as part of this slice are scoped to the slice's own surface, not a
  system-wide security/accessibility conformance claim.
- **Not a production release.** Stated verbatim in `PROMPT:828`; restated here so
  no future evidence bundle cites this plan's completion as sufficient for Gate
  G8.

## 7. Relationship to companion documents

- `test-strategy.md` — the 16-layer taxonomy this plan's "Layer(s)" columns cite;
  this plan does not redefine any layer, only maps conditions to it.
- `clinical-reference-vector-standard.md` — the format for step 4's independently
  reviewed evaluation vector.
- `synthetic-data-strategy.md` — the data-provenance requirement every fixture
  and test in this plan must satisfy.
- `test-environment-design.md` — which environment tier this slice runs in
  (primarily local + CI hermetic + the AMH conformance target for step 1's
  fixture; production-like staging is explicitly out of scope for G7, per §2's
  "not a production release").

## 8. What this document deliberately does not decide

- Which specific pathway, rule, or clinical scenario the first slice
  implements — that is a future decision by the Clinical pathway portfolio
  optimizer and named clinical owners, outside this document's authority.
- The minimum coverage threshold for claiming G7 (§5 item 4) — left to the named
  human accepter once identified (§6.2).
- G7's accepter identity (§6.2) — explicitly left open, recommended for
  `decision-rights.md` amendment.
- Any test framework, tool, or specific assertion syntax.
- Whether any test in this plan has been written or has passed — none have.

## Handoff

**Recipient:** first-vertical-slice implementers (this task's `handoff_recipient`).

- **OBSERVED:** `PROMPT:810-828` (Gate G7, verbatim), `PROMPT:45` (§1, the ten
  conditions, verbatim), `docs/05-clinical-safety/hazard-log.md` (HAZ-0001–0040,
  cited per step where directly regression-relevant: HAZ-0005 at step 4,
  HAZ-0023/HAZ-0033 at step 9, HAZ-0035 at step 10, HAZ-0013/HAZ-0015 at step 7),
  `docs/00-governance/decision-rights.md` (confirmed: no row names a G7 accepter).
- **CHANGED:** created this document; no other file modified.
- **TESTED:** N/A — no test in this plan has been authored or executed.
- **NOT TESTED:** the entire 10-step × 10-condition matrix (minus explicit N/A
  cells) is unimplemented.
- **ASSUMED:** that the ten §1 conditions apply meaningfully, with the stated
  general definitions (§3), to every structurally different step from a fixture
  load through audit reconciliation — a judgment call recorded transparently
  rather than presented as self-evident; that "N/A" is the correct disposition
  (rather than a forced, artificial test) for the specific cells marked N/A in
  §4, each with its own stated rationale.
- **DECIDED (proposals only, none binding):** the per-step, per-condition
  demonstration requirements in §4 (70 populated cells + 9 explicit N/A cells
  across the ten steps); the cross-cutting evidence requirements (§5); the
  explicit list of what G7 does and does not establish (§6.3).
- **REJECTED:** silently dropping any of the ten conditions from any step
  without a stated rationale — rejected in favor of explicit N/A entries (§3, §4)
  specifically because a silently dropped condition would itself be an instance
  of the DOM-0004/DOM-0007 "silent absence" failure this whole program exists to
  prevent, applied reflexively to this plan's own method; treating a fully
  green `normal`-row suite as sufficient G7 evidence — rejected per `PROMPT:828`
  (§5 item 3).
- **LEFT OPEN:** G7's named accepter (§6.2); the minimum coverage threshold for
  a G7 exit claim (§5 item 4); which pathway/scenario the first real slice will
  target; whether additional conditions beyond the ten in `PROMPT:45` should be
  added for a specific pathway's own risk profile once one is selected.
