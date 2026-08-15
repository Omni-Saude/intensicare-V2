---
doc_id: VIS-SUCCESS-HARM-METRICS
title: IntensiCare V2 — Candidate Success and Harm Metrics
status: PROPOSAL
label: PROPOSAL
approver: UNASSIGNED — VALIDATION REQUIRED
approver_roles:
  - AUTH-CLINSAFETY (clinical validity of every metric and threshold)
  - AUTH-PRODUCT (which metrics are adopted as targets)
  - AUTH-PRIVACY-LEGAL (lawful basis for outcome adjudication — see non-intended-uses.md NIU-07)
owner: UNASSIGNED — VALIDATION REQUIRED
validation_status: VALIDATION REQUIRED
last_updated: 2026-08-14
provenance:
  source_repo: intensicare-V2
  path_or_url: docs/01-vision-and-intended-use/success-and-harm-metrics.md
  commit_sha_or_version: cb355212b96fc5e63ab79474d50538cc86d96a5d (V2 repo HEAD at collection; this file is new and uncommitted)
  section_or_lines: whole document
  date_collected: 2026-08-14
  collector: critical-care intended-use analyst
  transformation: drafted from cited evidence; legacy targets cited as evidence of prior intent, NOT adopted
  confidence: medium
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
evidence_inputs:
  - repo: intensicare-V2
    path: INTENSICARE_V2_ORCHESTRATOR_PROMPT.md
    commit: staged but NOT committed at collection time (git status "A"); working-tree copy read
    lines_used: "33-57, 111-127, 213-217, 251-262, 1039-1063"
  - repo: intensicare (legacy, READ-ONLY, risk-informed input NOT authority)
    path: INTENSICARE_TECHNICAL_ASSESSMENT.md
    commit: 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79
    lines_used: "94-152, 229-241, 298-316, 318-357, 639-647, 985-991, 993-1029"
---

# IntensiCare V2 — Candidate Success and Harm Metrics

> **STATUS: PROPOSAL — NOT APPROVED. NO METRIC BELOW IS A TARGET.**
> **APPROVER: UNASSIGNED — VALIDATION REQUIRED.**
>
> Every metric is a *candidate*. None has a threshold, because setting a threshold is a
> clinical-safety decision reserved to `AUTH-CLINSAFETY`
> (`docs/00-governance/decision-rights.md:42`), which is UNASSIGNED.
>
> `SM-nn` / `HM-nn` anchors are document-local review handles, not catalog IDs. They map to
> the `OUT` (outcome) and `HAZ` (hazard) prefixes in
> `docs/00-governance/traceability-policy.md:21-39` and must be reconciled with the canonical
> catalogs — which do not yet exist — before ratification.

## 0. Framing

**SOURCE** (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:213`): SPARK's "S" output includes
"success and harm metrics" as part of scope and intended use.

**SOURCE** (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:47`): "Success is not code completion."

**Cautionary evidence — SOURCE** (`INTENSICARE_TECHNICAL_ASSESSMENT.md:100`): the legacy
product documents "define ambitious measurable goals: p95 signal-to-alert latency below 30
seconds, 99.9% availability, more than 500 alerts/minute, seven-year score/alert retention,
100% versioned rules, and clinical evaluation of sensitivity, positive predictive value,
mortality, and alarm fatigue." The assessment's own verdict follows immediately: "**These
are targets, not demonstrated service levels.**"

**INFERENCE:** the legacy failure mode was not an absence of metrics but the presence of
*unmeasured* metrics that were read as achievements. Two further legacy findings show how
this happens mechanically:

- **SOURCE** (`INTENSICARE_TECHNICAL_ASSESSMENT.md:31`): "a vector-coverage check reports
  success for zero alerts and zero vectors."
- **SOURCE** (`INTENSICARE_TECHNICAL_ASSESSMENT.md:316`): "Zero-vector false-green, failing
  unit validator, non-blocking gates, auth journeys skipped."

**PROPOSAL — three rules governing this document:**

1. **No metric is adopted until its measurement method is built and shown to fail when it
   should.** Per `INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:1050`, stop when "tests validate
   zero cases."
2. **Every success metric is paired with at least one harm metric it could be gamed
   against.** A metric optimized in isolation will be optimized at the expense of something
   unmeasured.
3. **A metric that cannot currently be measured is recorded as unmeasurable, not omitted.**
   Per `INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:1059`, never "hide 'unknown'".

### Study-type vocabulary used below

| Type | Meaning |
|---|---|
| **Baseline observational** | Measurement of current practice *before* V2 exists. Cannot be done retrospectively after deployment. |
| **Retrospective adjudicated** | Historical data with outcomes adjudicated by a blinded clinical panel against a pre-registered deterioration definition. |
| **Shadow / silent-mode** | V2 evaluates live data and records outputs, but produces no user-visible alerts and no clinical action. |
| **Prospective interventional** | V2 live and acting on clinical workflow; requires ethics approval and a safety-monitoring plan. |
| **Instrumented product telemetry** | Measured from V2's own audit trail; valid only for V2-internal facts, never for clinical truth. |
| **Contextual inquiry / simulation** | Observation or simulated scenario per `../02-users-and-workflows/user-research-plan.md`. |

---

## 1. Candidate SUCCESS metrics

### SM-01 — Time-to-recognition

**PROPOSAL:** elapsed time from the earliest moment a deterioration was detectable in
available data, to the moment a responsible clinician demonstrably became aware of it.

**Rationale — INFERENCE** (from `INTENSICARE_TECHNICAL_ASSESSMENT.md:98`): the legacy
intended outcomes led with "earlier detection of deterioration." SM-01 is the direct measure
of that claim.

**Definitional hazards (INFERENCE):**
- "Earliest detectable moment" is only definable retrospectively against an adjudicated
  ground truth. It is not observable in real time and must not be computed from V2's own
  outputs, which would be circular.
- "Clinician became aware" is **not** the same as "clinician opened the work item." A
  clinician may already know from the bedside. **PROPOSAL:** V2 telemetry can measure
  *time-to-view*, which is a proxy, and the difference between the proxy and true
  recognition must itself be characterized by observation.

**Study type required:** baseline observational (to establish pre-V2 recognition times) +
retrospective adjudicated (to establish the earliest-detectable reference point) + shadow
mode. **A baseline that is not captured before deployment is unrecoverable.**

**VALIDATION REQUIRED** — the deterioration definition and adjudication rubric must be
pre-registered and approved by `AUTH-CLINSAFETY` before any data is scored, to prevent
post-hoc definition fitting.

---

### SM-02 — Time-to-action

**PROPOSAL:** elapsed time from a work item becoming visible to an authorized user, to a
recorded clinical action or an explicit, reasoned override.

**Rationale — SOURCE** (`INTENSICARE_TECHNICAL_ASSESSMENT.md:98`): legacy intended outcomes
included "faster clinical response."

**Definitional hazards (INFERENCE):**
- Acknowledgment is not action. **SOURCE** (`INTENSICARE_TECHNICAL_ASSESSMENT.md:145`): the
  legacy alert triage flow allowed acknowledge/escalate/resolve, and `:324` observed that
  "group operations issue multiple sequential requests" where "a mid-sequence failure can
  leave a partially acknowledged group." A metric counting acknowledgments would have scored
  well on exactly the behaviour that was unsafe.
- **PROPOSAL:** SM-02 must terminate on a *clinical* action or a reasoned override, and
  acknowledgment-only must be tracked separately as a harm signal (see HM-03).
- A short time-to-action is not unambiguously good: it may indicate reflexive dismissal.
  SM-02 must always be read jointly with HM-03 and SM-03.

**Study type required:** instrumented product telemetry (for the V2-internal interval) +
contextual inquiry (to establish that recorded actions correspond to real clinical actions).

**VALIDATION REQUIRED** — the legacy documents targeted an "under 30 seconds" decision
objective; **SOURCE** (`INTENSICARE_TECHNICAL_ASSESSMENT.md:152`): "Runtime task analysis
with clinicians is required before claiming the documented 'under 30 seconds' decision
objective or acceptable alert fatigue." No such target is adopted here.

---

### SM-03 — Alert precision and recall against adjudicated outcomes

**PROPOSAL:** positive predictive value (precision) and sensitivity (recall) of V2 work items
against a blinded, pre-registered, clinically adjudicated deterioration outcome.

**Rationale — SOURCE** (`INTENSICARE_TECHNICAL_ASSESSMENT.md:100`): legacy documents intended
"clinical evaluation of sensitivity, positive predictive value, mortality, and alarm
fatigue," never performed. **SOURCE** (`INTENSICARE_TECHNICAL_ASSESSMENT.md:1002`), legacy
open question #6: "What are current false-positive, false-negative, alert-per-patient-day,
time-to-action, override, and outcome metrics?" — unanswered.

**Definitional hazards (INFERENCE):**
- **This is the metric most vulnerable to the legacy `not_evaluated` defect.** Per
  `INTENSICARE_TECHNICAL_ASSESSMENT.md:642` (finding IC-002), absent score components
  contributed zero and scores were persisted anyway; `:644` notes the consequence as
  "polluted outcome datasets, **unsafe alarm-performance claims**." **PROPOSAL:** precision
  and recall must be computed only over patient-time where the evaluation status was `valid`,
  and patient-time in `partial`, `not_evaluated`, `stale`, or `invalid` states must be
  reported as a **separate denominator**, never silently included or silently dropped. A
  system that evaluates 40% of patient-time with 95% precision has not achieved 95%
  precision.
- Post-deployment, recall is confounded: a work item that prompts successful intervention may
  prevent the very outcome being adjudicated. **INFERENCE:** this is why shadow mode is
  necessary rather than merely convenient — it is the only phase in which recall is
  measurable without treatment-effect contamination.
- Subgroup performance must be reported, not only aggregate. **SOURCE**
  (`INTENSICARE_TECHNICAL_ASSESSMENT.md:986`): the legacy assessment's own recommendation was
  to "measure sensitivity, PPV, timeliness, **subgroup performance**, missed/duplicate alerts,
  and alarm burden."

**Study type required:** retrospective adjudicated (pre-registered, blinded panel, with
inter-rater agreement reported) followed by prospective shadow/silent mode. Per
`INTENSICARE_TECHNICAL_ASSESSMENT.md:986`, shadow evaluation against "historical and live
non-actioning data."

**VALIDATION REQUIRED** — requires `AUTH-CLINSAFETY` for the outcome definition and
`AUTH-PRIVACY-LEGAL` for the lawful basis of the analysis (see `non-intended-uses.md` NIU-07).

---

### SM-04 — Alert burden per patient-day

**PROPOSAL:** count of user-visible work items per occupied patient-day, reported by
severity, by unit, by shift, and by originating rule version.

**Rationale — SOURCE** (`INTENSICARE_TECHNICAL_ASSESSMENT.md:1002`): "alert-per-patient-day"
appears in the legacy unanswered-metrics question.

**Definitional hazards (INFERENCE):**
- SM-04 is listed as a success metric but behaves as a **constraint**, not a maximand.
  Neither a high nor a low value is good in isolation: high burden drives fatigue (HM-02),
  and artificially low burden can mean suppressed or missed deterioration (HM-04).
  **PROPOSAL:** SM-04 must be specified as an acceptable *band* agreed with clinicians, not
  a direction of travel.
- Per-rule-version attribution is essential. **SOURCE**
  (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:122`): "Clinical rules are immutable, versioned
  release artifacts." **INFERENCE:** without version attribution, a burden change after a
  rule release cannot be causally assigned, and rule-performance feedback
  (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:42`) is impossible.

**Study type required:** baseline observational (existing alarm/alert burden from monitors
and existing systems, to avoid measuring V2 in isolation from the clinician's true alarm
environment) + instrumented product telemetry.

**VALIDATION REQUIRED** — the acceptable band requires `AUTH-CLINSAFETY` and must be informed
by observed ICU alarm load, which has not been measured.

---

### SM-05 — Evaluation coverage and explicit-state fidelity

**PROPOSAL:** proportion of monitored patient-time in each evaluation status
(`valid | partial | not_evaluated | stale | invalid`, per
`../03-domain/status-dimensions.md`), and the proportion of those states correctly rendered
to users as non-normal.

**Rationale — INFERENCE** (from `INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:39` and
`INTENSICARE_TECHNICAL_ASSESSMENT.md:330`): the safety loop requires an "explicit valid /
partial / not-evaluated / stale / invalid result." The legacy system's central UX safety
defect was that this explicitness was absent. SM-05 makes the loop's own precondition
measurable.

**INFERENCE — why this metric is unusual:** SM-05 is partly a *success* metric (more valid
coverage is better, given honest reporting) and partly a *safety invariant* (zero tolerance
for a non-`valid` state rendered as `normal`). **PROPOSAL:** split it at ratification — the
coverage proportion is an outcome metric; the mis-rendering count is a hazard metric with a
target of zero and belongs in the hazard log owned by `AUTH-CLINSAFETY`.

**Study type required:** instrumented product telemetry + automated invariant tests +
contextual inquiry/simulation to confirm clinicians *interpret* each state as intended.
**INFERENCE:** rendering a state correctly and a clinician understanding it are different
facts; only the second one protects a patient.

---

## 2. Candidate HARM metrics

### HM-01 — False alerts (false positives)

**PROPOSAL:** work items raised where blinded adjudication finds no deterioration and no
clinically appropriate action, reported per patient-day and per rule version.

**Rationale — SOURCE** (`INTENSICARE_TECHNICAL_ASSESSMENT.md:98`): "fewer false positives"
was an intended legacy outcome. **SOURCE** (`:1002`): false-positive rate was unmeasured.

**INFERENCE:** HM-01 is the direct counterweight to SM-03 recall — recall can always be
raised by lowering thresholds, and HM-01 is what that costs.

**Study type required:** retrospective adjudicated + shadow mode (same study as SM-03; they
are two readings of one adjudication).

**VALIDATION REQUIRED** — "no clinically appropriate action" must be adjudicated, not
inferred from clinician dismissal. **INFERENCE:** treating dismissal as ground truth would
make an ignored true alert indistinguishable from a false one, and would make alert fatigue
appear as improved precision.

---

### HM-02 — Alert fatigue

**PROPOSAL:** a composite of (a) dismissal/acknowledge-without-action rate over time,
(b) response-latency drift across a shift, (c) self-reported burden on a validated
instrument, and (d) rate of bulk/group dismissal actions.

**Rationale — SOURCE** (`INTENSICARE_TECHNICAL_ASSESSMENT.md:100`): "alarm fatigue" was named
as requiring clinical evaluation, never performed. **SOURCE**
(`INTENSICARE_TECHNICAL_ASSESSMENT.md:764`, finding IC-014 impact): "False prioritization,
interaction delay, **alert fatigue**, exclusion of assistive-technology users, misleading
product demonstrations."

**Definitional hazards (INFERENCE):**
- Component (d) is specifically motivated by a legacy observation: **SOURCE**
  (`INTENSICARE_TECHNICAL_ASSESSMENT.md:324`): "Group operations issue multiple sequential
  requests; a mid-sequence failure can leave a partially acknowledged group." A grouping
  feature designed to reduce burden is also an efficient fatigue-expression mechanism.
  Measuring it distinguishes "burden reduced" from "burden hidden."
- Fatigue is a property of the clinician's **whole** alarm environment, not of V2's share of
  it. **PROPOSAL:** HM-02 must be measured against total unit alarm load, not V2 alerts
  alone; otherwise V2 can appear fatigue-neutral while contributing the increment that
  crosses a threshold.

**Study type required:** baseline observational (pre-deployment fatigue and total alarm load)
+ instrumented telemetry + repeated validated-instrument survey + contextual inquiry.

**VALIDATION REQUIRED** — selection of a validated fatigue instrument, and its pt-BR
validation, requires `AUTH-UX` with `AUTH-CLINSAFETY`. **INFERENCE:** an instrument validated
in another language is not validated in pt-BR (see `../02-users-and-workflows/user-research-plan.md` §6).

---

### HM-03 — Automation bias and false reassurance

**PROPOSAL:** (a) incidents where a clinician de-prioritized or did not assess a patient
citing a V2 display; (b) count of non-`valid` evaluation states rendered in a reassuring
visual vocabulary (target: zero); (c) rate of acknowledgment-without-action; (d) rate of
clinician agreement with V2 in cases where V2 was adjudicated wrong.

**Rationale — SOURCE** (`INTENSICARE_TECHNICAL_ASSESSMENT.md:330`): "an occupied bed without
sufficient measurements can be shown as `normal` ... the system does not consistently
distinguish fresh, stale, expired, missing, invalid, and partially evaluated states. That is
likely to create false reassurance; bedside validation is required to quantify the risk."
**SOURCE** (`:26`): missing clinical input was "converted into reassuring numeric zero."
**SOURCE** (`:644`): impact recorded as "False reassurance, missed deterioration."

**INFERENCE — why this is the most important harm metric and the least likely to be
collected:** false alerts announce themselves; false reassurance does not. A patient who
deteriorated while their bed tile read `normal` generates no V2 event at all. HM-03(a) is
therefore only capturable through **incident reporting and case review**, not telemetry, and
requires a reporting route that clinicians actually use. HM-03(d) requires linking clinician
agreement to adjudicated correctness — measurable only within a study, not in routine
operation.

**Study type required:** prospective incident surveillance with structured case review +
simulation studies (per `../02-users-and-workflows/user-research-plan.md` §3, deliberately
including scenarios where V2 is wrong, degraded, or stale) + automated invariant tests for
component (b).

**VALIDATION REQUIRED** — `AUTH-CLINSAFETY` must define what counts as a reportable
false-reassurance incident, and the reporting route must be designed so that reporting does
not appear to be self-incrimination (see `non-intended-uses.md` NIU-06).

---

### HM-04 — Missed deterioration (false negatives)

**PROPOSAL:** adjudicated deterioration events for which V2 produced no work item, no
timely work item, or a work item that was suppressed, undelivered, or rendered
non-actionable — reported with the failure mode attributed.

**Rationale — SOURCE** (`INTENSICARE_TECHNICAL_ASSESSMENT.md:644`): "missed deterioration"
named as a legacy clinical impact. **SOURCE** (`:1002`): false-negative rate unmeasured.

**Attribution requirement (INFERENCE, reasoning from
`INTENSICARE_TECHNICAL_ASSESSMENT.md:29`, `:304`, `:310`, `:642`):** a miss can arise from at
least five distinct causes, which demand different remedies and must not be pooled:

| Failure mode | Legacy evidence that it is real |
|---|---|
| Rule did not fire on available data | `:642` — missing components contributed zero, suppressing the signal |
| Data never arrived / arrived too late | `:304` — source cadence vs. latency target |
| Work item was created but not delivered | `:29`, `:310` — "process-local ... multi-replica deployment can miss messages"; "events do not fan out reliably" |
| Work item was delivered but not seen | `:324` — client-side filtering could "return semantically incorrect results" |
| Patient was outside evaluated population/scope | `intended-use-statement.md` IU-06 |

**PROPOSAL:** HM-04 must be reported by failure mode. An aggregate miss rate is not
actionable and can mask a delivery defect as a clinical-rule deficiency.

**Study type required:** retrospective adjudicated + shadow mode + synthetic end-to-end
delivery probes (to separate delivery failures from rule failures continuously rather than
only during studies).

---

### HM-05 — Workflow disruption

**PROPOSAL:** (a) interruptions attributable to V2 per clinician-hour, with the task
interrupted classified; (b) time added to shift handover; (c) documentation/interaction time
added per work item; (d) count of workarounds observed (e.g. parallel paper lists,
screenshots, WhatsApp escalation).

**Rationale — SOURCE** (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:214`): SPARK's "P" output
explicitly includes "interruptions, handoffs, current workarounds." **SOURCE**
(`INTENSICARE_TECHNICAL_ASSESSMENT.md:764`): legacy IC-014 impact included "interaction
delay."

**INFERENCE:** component (d) is the highest-signal and lowest-cost measure in this entire
document. A workaround is a clinician's own statement that the system does not fit their
work, expressed in behaviour rather than in a survey answer. Workarounds are observable in
contextual inquiry and are not observable in telemetry — a system cannot instrument the
paper list that replaced it.

**Study type required:** contextual inquiry and time-motion observation (baseline and
post-deployment) + handover observation.

**VALIDATION REQUIRED** — an interruption is not intrinsically harmful; an interruption
during a high-risk task is. Classification of which tasks must not be interrupted requires
`AUTH-CLINSAFETY` and clinician input.

---

### HM-06 — Inequitable performance across subgroups

**PROPOSAL:** SM-03, HM-01, and HM-04 disaggregated by clinically and socially relevant
subgroups, with the disaggregation pre-registered.

**Rationale — SOURCE** (`INTENSICARE_TECHNICAL_ASSESSMENT.md:986`): "measure sensitivity, PPV,
timeliness, **subgroup performance**, missed/duplicate alerts, and alarm burden."

**INFERENCE:** an aggregate performance figure can conceal a subgroup for which the system
performs materially worse. This is a harm even when aggregate performance improves.

**VALIDATION REQUIRED** — which subgroups are analyzed, and whether the required attributes
may lawfully be processed for this purpose in Brazil, requires `AUTH-PRIVACY-LEGAL` and
`AUTH-CLINSAFETY` jointly. **INFERENCE:** there is a real tension here — data minimization
and equity monitoring pull in opposite directions, and it must be resolved deliberately
rather than by default.

---

### HM-07 — Accessibility exclusion

**PROPOSAL:** count and severity of tasks that an assistive-technology user cannot complete
in the safety loop, measured by task, not by automated rule-check pass rate.

**Rationale — SOURCE** (`INTENSICARE_TECHNICAL_ASSESSMENT.md:345`): in the legacy system
"login errors lack an assertive status/live region ... and no current application use of
`aria-live` was found. Dynamic clinical changes therefore lack a tested, coalesced
screen-reader announcement strategy." **SOURCE** (`:349`): runtime accessibility properties
were "**[V]** unverified." **SOURCE** (`:764`): impact included "exclusion of
assistive-technology users."

**INFERENCE:** for a system whose core function is announcing change, absence of a tested
announcement strategy is a clinical-safety defect and not only an accessibility defect — the
user who most depends on announcements is the one who receives none.

**Study type required:** task-based assistive-technology evaluation with real
assistive-technology users, per `../02-users-and-workflows/user-research-plan.md` §2, plus
automated checks as a floor. **SOURCE** (`INTENSICARE_TECHNICAL_ASSESSMENT.md:357`): the
legacy assessment itself called for validation "through representative ICU simulations with
physicians, nurses, coordinators, and assistive-technology users."

---

## 3. Metrics that cannot currently be measured — recorded, not omitted

**INFERENCE** (per rule 3 in §0):

| # | Metric | Why not measurable as of 2026-08-14 |
|---|---|---|
| 1 | Any latency metric (signal-to-work-item) | No architecture, no lane, no environment. **SOURCE** (`INTENSICARE_TECHNICAL_ASSESSMENT.md:304`): target "cannot be established without a streaming lane and production measurements." |
| 2 | Any clinical-outcome metric (mortality, LOS, ICU readmission) | Requires prospective study, ethics approval, and a site. None exist. |
| 3 | Any baseline metric | Requires access to a site's current-state data. No site is identified (`../02-users-and-workflows/user-research-plan.md` §4 — **no site has been identified or contacted**). |
| 4 | Alert precision/recall | Requires an adjudicated dataset that does not exist, and a lawful basis that is unresolved (`non-intended-uses.md` NIU-07). |
| 5 | Anything requiring real users | Gate G1 is not satisfied; no user has been observed. |

**INFERENCE:** every row above traces to one of three root causes — no named authority, no
identified site, no implementation. This is consistent with V2's actual maturity and is
recorded so that the metric set is not mistaken for a measurement capability.

---

## 4. Anti-gaming pairings

**PROPOSAL** — each success metric must be reported with its paired harm metric. Reporting
one without the other should be treated as a reporting defect.

| Success metric | Can be gamed by | Paired harm metric |
|---|---|---|
| SM-01 time-to-recognition | Alerting earlier and more often on weaker evidence | HM-01, HM-02, SM-04 |
| SM-02 time-to-action | Encouraging reflexive acknowledgment; counting acknowledgment as action | HM-02, HM-03 |
| SM-03 recall | Lowering thresholds | HM-01, SM-04 |
| SM-03 precision | Suppressing uncertain cases; evaluating only easy patient-time | HM-04, SM-05 |
| SM-04 alert burden (downward) | Suppression, cooldowns, silent no-fire | HM-04, HM-03 |
| SM-05 evaluation coverage | Coercing incomplete data into `valid` | HM-03, and `INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:119` |

**INFERENCE:** the final row is the legacy defect stated as a gaming incentive. Coercing
missing data to zero (`INTENSICARE_TECHNICAL_ASSESSMENT.md:26`, `:642`) *improves* apparent
coverage while destroying clinical safety. The incentive is real and structural, which is why
`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:119` states it as an absolute prohibition rather than
a preference.

---

## 5. Cross-references

- `intended-use-statement.md` — IU-12b/c/f record that no effectiveness, accuracy, or performance claim is made.
- `non-intended-uses.md` — NIU-07 (secondary use), NIU-06 (not performance management).
- `../02-users-and-workflows/user-research-plan.md` — the study designs these metrics depend on.
- `../02-users-and-workflows/g1-validation-backlog.md` — open questions blocking metric ratification.
- `../03-domain/status-dimensions.md` — the evaluation-status vocabulary SM-05 measures.
