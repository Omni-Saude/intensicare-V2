---
doc_id: USR-WORKFLOW-HYPOTHESES
title: IntensiCare V2 — Workflow Hypotheses
status: PROPOSAL
label: PROPOSAL
approver: UNASSIGNED — VALIDATION REQUIRED
approver_roles:
  - AUTH-UX (workflow acceptance)
  - AUTH-CLINSAFETY (any workflow with a safety consequence)
owner: UNASSIGNED — VALIDATION REQUIRED
validation_status: VALIDATION REQUIRED
last_updated: 2026-08-14
provenance:
  source_repo: intensicare-V2
  path_or_url: docs/02-users-and-workflows/workflow-hypotheses.md
  commit_sha_or_version: cb355212b96fc5e63ab79474d50538cc86d96a5d (V2 repo HEAD at collection; this file is new and uncommitted)
  section_or_lines: whole document
  date_collected: 2026-08-14
  collector: critical-care intended-use analyst
  transformation: legacy journey descriptions summarized and RE-LABELLED as hypotheses; legacy defects retained as evidence of what to test, not as V2 design
  confidence: low
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
evidence_inputs:
  - repo: intensicare-V2
    path: INTENSICARE_V2_ORCHESTRATOR_PROMPT.md
    commit: staged but NOT committed at collection time (git status "A"); working-tree copy read
    lines_used: "33-45, 111-127, 213-217, 251-262, 1039-1063"
  - repo: intensicare (legacy, READ-ONLY, risk-informed input NOT authority)
    path: INTENSICARE_TECHNICAL_ASSESSMENT.md
    commit: 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79
    lines_used: "94-152, 229-241, 298-316, 318-357, 639-647, 759-767, 993-1029"
---

# IntensiCare V2 — Workflow Hypotheses

> ## ⚠️ NO WORKFLOW IN THIS DOCUMENT HAS BEEN OBSERVED
>
> **SOURCE** (`INTENSICARE_TECHNICAL_ASSESSMENT.md:56`): "**[V] No stakeholder interviews or
> observed ICU workflow studies were performed.** Persona and workflow conclusions derive from
> repository documentation."
>
> The legacy "journeys" at `INTENSICARE_TECHNICAL_ASSESSMENT.md:143-148` are traces of **what
> the legacy software did**, not of what clinicians do. **INFERENCE:** a description of a
> system's control flow is not a workflow. Reusing it as a workflow would encode the legacy
> product's assumptions as V2's requirements — exactly what
> `INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:6` forbids: "Do not reproduce the legacy
> implementation."
>
> `WF-nn` anchors are document-local review handles, not catalog IDs.

## 0. How legacy journeys are used here

Each hypothesis below separates three things that the legacy evidence blends:

1. **SOURCE — what the legacy system did.** Cited, and useful only as evidence that a code path
   existed.
2. **HYPOTHESIS — what clinicians might actually do.** Unvalidated. The real subject of this
   document.
3. **Questions observation must answer.** The specific things that, if unknown at design time,
   will produce a wrong product.

Legacy *defects* are retained deliberately. **INFERENCE:** a defect found in the legacy system
is evidence about a hazard that is easy to reintroduce, and is therefore a required test case
for V2 rather than a closed issue.

---

## WF-01 — Bed-grid / unit surveillance

**SOURCE** (`INTENSICARE_TECHNICAL_ASSESSMENT.md:143`): "Bed-grid surveillance. User logs in →
dashboard fetches active patients → backend loads cached patients and related
scores/alerts/pathways → severity is derived → UI presents bed cards and freshness. This is
implemented, but **the query is not tenant-scoped and no-data beds are labeled normal**."

**HYPOTHESIS (PROPOSAL):** clinicians do not continuously watch a unit overview. They consult
it at defined moments — start of shift, after handover, on return from a procedure or break,
and when deciding where to go next — and otherwise rely on the bedside and on colleagues.

**INFERENCE — why this matters more than it appears:** if the hypothesis holds, a bed grid is a
*re-orientation* surface, not a monitoring surface. Its most important job is answering "what
changed since I last looked, and what could I not see?" — not "what is the state now." A grid
optimized for at-a-glance current state, viewed intermittently, systematically hides change.

**Retained legacy defect as required test case — SOURCE**
(`INTENSICARE_TECHNICAL_ASSESSMENT.md:330`): "an occupied bed without sufficient measurements
can be shown as `normal`, even though the design standard explicitly requires `não avaliado`
and separate unit counts." Also `:26`: "the dashboard floors an unscored bed to `normal`."
Prohibited for V2 by `INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:119`.

**Questions observation must answer:**
1. At what moments is a unit overview actually consulted, and for how long?
2. What is the real unit size, and does the display scale to it? (Gate G1 requires "unit size"
   — `INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:260`.)
3. Where is the screen physically? Is it shared, wall-mounted, at a station, or personal? Who
   else can see it — including patients and families? (Privacy implication.)
4. How would a clinician *want* to be shown "this bed could not be evaluated"? Does any
   existing artifact in the unit convey that concept today?
5. Does the unit already have a whiteboard or list serving this purpose, and what does it show
   that software does not?

---

## WF-02 — Patient drill-down

**SOURCE** (`INTENSICARE_TECHNICAL_ASSESSMENT.md:144`): "Patient drill-down. User selects a bed
→ route fetches vitals, score history, active alerts, and pathways → **older history is used if
the 24-hour window is empty.** This supports continuity but **can display very old data**;
tenant ownership is not queried."

**HYPOTHESIS (PROPOSAL):** the drill-down is used to answer "should I believe this?" — a
corroboration task, not a discovery task. The clinician arrives already suspecting something
and is checking whether the data supports it.

**INFERENCE:** if so, the most important content is *provenance and trend*, not the current
value: where each input came from, when it was taken, what was missing, and which rule version
produced the result. This aligns with the safety loop's "durable and explainable work item"
(`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:40`).

**Retained legacy defect as required test case — SOURCE**
(`INTENSICARE_TECHNICAL_ASSESSMENT.md:330`): "Stale historical data can be returned when the
24-hour window is empty." **INFERENCE:** silently widening a time window to avoid an empty
state converts "we have nothing recent" into "here is something," which is the false-reassurance
failure mode (HM-03) implemented as a convenience feature.

**Questions observation must answer:**
1. What question does a clinician bring to a patient view, in their own words?
2. What time window is clinically meaningful for each input type, and who decides it?
   (Legacy open question #3 — `INTENSICARE_TECHNICAL_ASSESSMENT.md:999`: "Which score
   components invalidate versus degrade each score, and what freshness window applies to every
   input?")
3. Does the clinician cross-check against another system (EHR, monitor, paper)? If so, V2 is
   one panel among several and must be designed as such.
4. What would a clinician expect to see when there is genuinely no recent data?

---

## WF-03 — Work-item triage and action

**SOURCE** (`INTENSICARE_TECHNICAL_ASSESSMENT.md:145`): "Alert triage. User filters/group alerts
→ acknowledges, escalates, or resolves → UI performs optimistic mutation → backend updates
alert. The interface preserves individual source alerts under groups, but **commands lack robust
concurrency/idempotency and some supplied notes/reasons are discarded**."

**HYPOTHESIS (PROPOSAL):** triage is rarely a seated, uninterrupted activity. It is interleaved
with clinical work, performed in short fragments, and frequently abandoned mid-task.

**INFERENCE — the strongest design consequence in this document:** if triage is fragmented and
interruptible, then *partial* states are the normal case, not the exception. Three legacy
defects are all instances of the same underlying failure to treat partial states as normal:

| Legacy defect | SOURCE | What it implies for V2 |
|---|---|---|
| "a mid-sequence failure can leave a partially acknowledged group" | `:324` | Multi-item commands must be atomic or must show their partial state honestly. |
| "Optimistic updates deliberately retain some stale group aggregates until revalidation, allowing a short-lived mismatch in a safety-relevant queue" | `:324` | Optimistic UI in a clinical queue trades correctness for responsiveness — a trade requiring `AUTH-CLINSAFETY` acceptance, not a frontend choice. |
| "some supplied notes/reasons are discarded" | `:145` | A clinician's stated reason is the audit trail. Discarding it silently breaks the loop's audit step (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:42`) and teaches users their input does not matter. |

**Additional retained defect — SOURCE** (`INTENSICARE_TECHNICAL_ASSESSMENT.md:324`): "The
alert page loads the first 50 results and then performs some filtering in the browser. The
'unit' filter matches patient-name/pathway strings rather than a reliable unit field, so it can
return **semantically incorrect results**." **INFERENCE:** a filter that silently returns wrong
results in a safety queue is worse than no filter, because the clinician believes they have seen
their unit's items.

**Questions observation must answer:**
1. How long is a realistic uninterrupted triage window? What is the actual distribution?
2. What happens today when a clinician is interrupted mid-task — is the task resumed, restarted,
   or lost?
3. Is "acknowledge" a meaningful clinical act at the site, or an administrative one? What do
   clinicians think it commits them to?
4. What reason/note would a clinician genuinely want to record, and would they record it under
   time pressure?
5. Are work items handled individually or in batches, and does batching reflect efficiency or
   fatigue? (Distinguishing these is HM-02(d) in `../01-vision-and-intended-use/success-and-harm-metrics.md`.)

---

## WF-04 — Shift handover (*passagem de plantão*)

**SOURCE** (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:259`): Gate G1 requires validating "shift
handoff, downtime, connectivity loss, stale feeds, and conflicting data."

**SOURCE** (`INTENSICARE_TECHNICAL_ASSESSMENT.md:1000`), legacy open question #4: "Who owns
acknowledgment, escalation, reassignment, override, and closure **during shift changes** and
downtime?" — unresolved.

**OBSERVED:** the legacy journey list (`INTENSICARE_TECHNICAL_ASSESSMENT.md:143-148`) contains
**no handover journey at all**. Six journeys are listed; none is handover.

**INFERENCE:** this is a significant absence rather than an oversight in the assessment. Handover
is a defining ICU ritual and the moment of highest information loss and highest risk of dropped
ownership. A product built for ICU deterioration that has no handover concept has a structural
gap, and V2 must not inherit that gap by inheriting the journey list.

**HYPOTHESIS (PROPOSAL):** handover is a structured, time-boxed, verbal, multi-patient event
with an existing artifact (paper, spreadsheet, or EHR summary). V2 is most likely to be either
*ignored* during handover, or *transcribed from* into the existing artifact — and the second
would be a strong signal of value and a strong signal of poor fit simultaneously.

**Questions observation must answer:**
1. What actually happens at handover — who attends, how long, what artifact is used, what order?
2. What happens to an unresolved work item at shift change? Does ownership transfer explicitly,
   implicitly, or not at all?
3. Would a V2 work item be mentioned in handover? Should it be?
4. Is there a moment when *nobody* owns a work item (outgoing staff disengaged, incoming not yet
   oriented)? **INFERENCE:** if such a window exists, it is the highest-risk period in the day
   and the durable-work-item design must address it explicitly.
5. Do nursing and medical handovers happen at different times? If so, the "no owner" window may
   differ by role and by patient.

---

## WF-05 — Downtime and degraded operation

**SOURCE** (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:45`): the loop must hold under "normal,
missing, stale, duplicate, delayed, conflicting, corrected, unauthorized, disconnected, and
partially failed conditions."

**SOURCE** (`INTENSICARE_TECHNICAL_ASSESSMENT.md:347`): in the legacy frontend, "Session
expiration produces a hard redirect on 401 **without an advance warning or protected recovery of
in-progress work**."

**SOURCE** (`INTENSICARE_TECHNICAL_ASSESSMENT.md:353`): "Recovery from connectivity loss is
implemented with backoff/heartbeat, but backend architecture prevents reliable cross-pod event
delivery."

**SOURCE** (`INTENSICARE_TECHNICAL_ASSESSMENT.md:310`): "In-memory connection registries and
queues — Events do not fan out reliably across workers/pods."

**HYPOTHESIS (PROPOSAL):** clinicians will not notice degradation unless it is stated at the
point of use. A screen that continues to render plausible-looking beds during a data outage will
be believed.

**INFERENCE — the compound hazard:** combine three legacy findings and a specific scenario
emerges that V2 must be tested against. (a) Events may not be delivered (`:310`); (b) a bed with
no data renders `normal` (`:26`, `:330`); (c) stale history is substituted when the recent window
is empty (`:330`). A clinician looking at that unit sees a calm, fully-populated, entirely
reassuring display that is describing nothing. Each defect is individually recoverable; together
they are a silent failure. **PROPOSAL:** V2's degraded-mode test suite must exercise these in
combination, not only individually.

**Questions observation must answer:**
1. What is the site's existing downtime procedure for clinical systems, and does V2 fit into it?
2. How would a clinician *want* to be told V2 is degraded, and how insistent should that be
   before it becomes its own alarm problem?
3. What should a clinician do during V2 downtime? Is there a documented fallback, and is it
   practised?
4. How long can V2 be unavailable before clinical practice is affected — and does that answer
   change once clinicians have grown to rely on it? **INFERENCE:** this answer necessarily
   changes over time, which means it must be re-measured after adoption, not only before.
5. What happens to work items created during an outage, and who reconciles them afterwards?

---

## WF-06 — Conflicting and corrected data

**SOURCE** (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:259`): Gate G1 requires validating
"conflicting data."

**SOURCE** (`INTENSICARE_TECHNICAL_ASSESSMENT.md:307`): "Timestamp displayed in parts of UI; no
uniform score invalidation/suppression; **timestamp can default now** — Provenance/freshness
cannot be trusted end to end."

**SOURCE** (`INTENSICARE_TECHNICAL_ASSESSMENT.md:1009`), legacy open question #10: "What source
timestamps, timezones, clock synchronization, late-arrival, and correction semantics exist?" —
unresolved.

**SOURCE** (`INTENSICARE_TECHNICAL_ASSESSMENT.md:1006`), legacy open question #7: "Is `mpi_id`
globally unique across organizations and encounters? How are merge, unmerge, correction, and
deceased/discharged states conveyed?" — unresolved.

**HYPOTHESIS (PROPOSAL):** conflicting data is routine, not exceptional. A monitor value, a
manually charted value, and a lab value may disagree, and clinicians resolve this constantly
using context that V2 does not have.

**INFERENCE — the boundary V2 must not cross:** V2 cannot adjudicate which of two conflicting
clinical values is correct; that requires bedside context. Per
`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:1058`, V2 must never "silently resolve contradictions."
**PROPOSAL:** the correct behaviour is to surface the conflict and decline to evaluate, or
evaluate with an explicit `partial`/`invalid` status per `../03-domain/status-dimensions.md` —
never to pick one value by a rule such as most-recent-wins, which is silent resolution wearing
an algorithm.

**Retained legacy defect — SOURCE** (`INTENSICARE_TECHNICAL_ASSESSMENT.md:307`, `:281`): "the
timestamp may default to now." Prohibited by `INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:120`: "Never
invent a source timestamp."

**Questions observation must answer:**
1. Which sources actually conflict in practice, how often, and by how much?
2. How do clinicians resolve conflicts today, and what context do they use?
3. What should V2 do when it detects a conflict — and would clinicians find that useful or
   noisy?
4. How are corrections (amended labs, charting errors) propagated, and what should happen to a
   work item that was raised on data since corrected?
5. What happens on patient discharge, transfer, death, or identity merge? **INFERENCE:** a work
   item outliving its patient is both a safety issue and a dignity issue, and no evidence
   reviewed addresses it.

---

## WF-07 — Interruption (cross-cutting)

**SOURCE** (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:214`): SPARK "P" requires observation of
"interruptions."

**HYPOTHESIS (PROPOSAL):** interruption is the default condition of ICU work. Any V2 task longer
than a few seconds will be interrupted a meaningful fraction of the time.

**INFERENCE:** this reframes several requirements at once. If interruption is the norm:
- every task must be resumable, and abandonment must not lose the clinician's input;
- "time to complete a task" is a misleading metric, because tasks are not completed in one pass;
- the legacy hard-redirect-on-session-expiry behaviour (`:347`) is not a minor annoyance but a
  routine destroyer of in-progress work;
- V2 itself is an interruption source, which is why HM-05 in
  `../01-vision-and-intended-use/success-and-harm-metrics.md` measures interruptions *caused*
  by V2 and not only interruptions suffered by it.

**Questions observation must answer:**
1. Measured interruption rate per clinician-hour, by role and shift.
2. Which tasks, if interrupted, create clinical risk — and must therefore never be interrupted
   by a V2 notification?
3. What is the resumption cost, and what does a clinician do when they return to a half-finished
   task?

---

## WF-08 — Pathway explanation and trust calibration

**SOURCE** (`INTENSICARE_TECHNICAL_ASSESSMENT.md:147`): "Pathway explanation. User opens a
pathway → sees state, criteria, evidence/recommendations → backend reads compiled YAML/DB
enrollment. The declarative design is strong, but **multiple engine instances and a legacy
fallback obscure canonical behavior**."

**HYPOTHESIS (PROPOSAL):** explanation is consumed at two distinct moments with different needs —
in the moment (a few seconds, "why am I being told this?") and retrospectively (minutes, during
review, teaching, or disagreement). One explanation format will not serve both.

**INFERENCE:** explanation is the primary mechanism of **trust calibration**, and calibration must
run in both directions. An explanation that only justifies the system's output builds trust
uniformly, including in cases where the system is wrong. **PROPOSAL:** explanations must make the
system's *limits* as visible as its reasoning — which inputs were missing, which were stale, what
the rule does not consider — so that appropriate distrust is as achievable as appropriate trust.

**Questions observation must answer:**
1. What explanation would a clinician accept as sufficient to act, in the moment?
2. What would they need in order to *disagree* with confidence? **INFERENCE:** this is the more
   important question, and the one no legacy evidence addresses.
3. Do clinicians want the rule's evidence base (guideline, citation), or only its inputs?
4. How should a rule *version change* be communicated to a clinician who has learned the previous
   behaviour?

---

## 1. What must never be represented as normal or complete

**SOURCE** (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:262`), Gate G1's final item: "what must never
be represented as normal or complete."

**PROPOSAL — candidate list, requiring `AUTH-CLINSAFETY` ratification.** None of the following
may ever be rendered as `normal`, as a numeric score, or in the visual vocabulary of a
successfully evaluated low-risk patient:

1. A bed with insufficient inputs to evaluate (`INTENSICARE_TECHNICAL_ASSESSMENT.md:330`).
2. A patient whose data is stale relative to the approved per-input freshness window (`:307`).
3. A patient outside the approved population or of unknown age
   (`../01-vision-and-intended-use/intended-use-statement.md` IU-06).
4. A patient for whom evaluation failed, errored, or was suppressed.
5. A unit view rendered during degraded operation or lost connectivity (WF-05).
6. A patient with unresolved conflicting inputs (WF-06).
7. A work item whose delivery could not be confirmed (`INTENSICARE_TECHNICAL_ASSESSMENT.md:310`).
8. Any state derived from an AI/MCP-generated artifact rather than the deterministic evaluation
   record (`../01-vision-and-intended-use/non-intended-uses.md` NIU-05).
9. A list or filter result that may be incomplete (`INTENSICARE_TECHNICAL_ASSESSMENT.md:324`).

**INFERENCE:** items 7 and 9 are the subtlest and were both real legacy defects. They concern
*completeness of the view* rather than correctness of a value — a clinician who believes they
have seen everything has been misled even if every item shown was accurate.

---

## 2. Cross-references

- `user-roles-hypotheses.md` — the roles performing these workflows.
- `user-research-plan.md` — the study that would answer every "questions observation must answer" list.
- `g1-validation-backlog.md` — consolidated blocking questions.
- `../01-vision-and-intended-use/non-intended-uses.md` — NIU-08 (not an alarm system), NIU-09 (not a source of truth when degraded).
- `../03-domain/status-dimensions.md` — the evaluation-status vocabulary §1 depends on.
