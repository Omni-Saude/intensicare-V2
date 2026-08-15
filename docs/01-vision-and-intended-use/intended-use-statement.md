---
doc_id: VIS-INTENDED-USE
title: IntensiCare V2 — Intended-Use Statement
status: PROPOSAL
label: PROPOSAL
approver: UNASSIGNED — VALIDATION REQUIRED
approver_role: AUTH-INTENDED-USE (docs/00-governance/authority-model.md:34)
owner: UNASSIGNED — VALIDATION REQUIRED
validation_status: VALIDATION REQUIRED
last_updated: 2026-08-14
provenance:
  source_repo: intensicare-V2
  path_or_url: docs/01-vision-and-intended-use/intended-use-statement.md
  commit_sha_or_version: cb355212b96fc5e63ab79474d50538cc86d96a5d (V2 repo HEAD at collection; this file is new and uncommitted)
  section_or_lines: whole document
  date_collected: 2026-08-14
  collector: critical-care intended-use analyst
  transformation: drafted from cited evidence; no verbatim import of legacy content
  confidence: medium
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
evidence_inputs:
  - repo: intensicare-V2
    path: INTENSICARE_V2_ORCHESTRATOR_PROMPT.md
    commit: staged but NOT committed at collection time (git status "A"); working-tree copy read
    lines_used: "29-57, 111-127, 209-262, 1039-1063"
  - repo: intensicare (legacy, READ-ONLY, risk-informed input NOT authority)
    path: INTENSICARE_TECHNICAL_ASSESSMENT.md
    commit: 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79
    branch: chore/v3-wip-landing
    lines_used: "19-42, 52-58, 94-152, 229-241, 298-316, 318-357, 639-647, 993-1029"
---

# IntensiCare V2 — Intended-Use Statement

> **STATUS: PROPOSAL — NOT APPROVED.**
> **APPROVER: UNASSIGNED — VALIDATION REQUIRED.**
>
> No part of this statement is binding. Per `docs/00-governance/decision-rights.md:41`,
> an agent may draft the intended-use statement but may **not** approve it as binding;
> that right belongs to `AUTH-INTENDED-USE`, which is currently
> `UNASSIGNED — VALIDATION REQUIRED` (`docs/00-governance/authority-model.md:34`).
> Per `INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:248`, Gate G0 does not close until
> "intended use has a named human approver."
>
> Document-local anchors (`IU-nn`) are reference handles for review, **not** catalog
> IDs. They must be reconciled against the canonical prefixes in
> `docs/00-governance/traceability-policy.md:21-39` before ratification.

## 0. How to read this document

Every material statement carries exactly one label per
`docs/00-governance/evidence-notation.md:27-34`: **SOURCE**, **OBSERVED**,
**INFERENCE**, **PROPOSAL**, **VALIDATION REQUIRED**, or **DECIDED**.
**No statement in this document carries the label DECIDED.** Nothing here has been
accepted by any named authority.

A note on the legacy evidence: per `INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:72`, the
legacy technical assessment is "a risk-informed input, not authority." Where this
document cites the legacy assessment, it cites it as *evidence about a prior system's
documented intent and observed defects* — never as authority for what V2 must do.

**Critical scoping caveat (SOURCE, `INTENSICARE_TECHNICAL_ASSESSMENT.md:56`):** the
legacy assessment states, verbatim, "**No stakeholder interviews or observed ICU
workflow studies were performed.** Persona and workflow conclusions derive from
repository documentation." Therefore every user-, setting-, and workflow-related
element below inherits an unobserved foundation. This is the central reason Gate G1
cannot be closed on the strength of this document.

---

## 1. Clinical problem being addressed

### IU-01 — Problem framing

**SOURCE** (`INTENSICARE_TECHNICAL_ASSESSMENT.md:21`): the legacy product thesis was to
"convert fragmented ICU observations into a clinically prioritized command center using
deterministic early-warning scores, declarative clinical pathways, explainable alerts,
and patient drill-down workflows." The assessment characterizes this thesis as "strong."

**SOURCE** (`INTENSICARE_TECHNICAL_ASSESSMENT.md:98`): the legacy documented intent was
"continuous ICU monitoring and clinical decision support for Brazilian critical-care
environments," with intended outcomes including "earlier detection of deterioration, less
manual score calculation, fewer false positives, faster clinical response, explainable
recommendations, unit-level acuity visibility, and auditable/versioned decisions."

**PROPOSAL — candidate V2 problem statement (requires validation before use):**

> In critical-care units, clinically relevant physiological deterioration is often
> recognizable from data that already exists but is fragmented across sources, arrives at
> different times and qualities, and must be assembled mentally by clinicians who are
> simultaneously interrupted, handing over, or attending another patient. The resulting
> harm is *delayed recognition* and *delayed coordinated action* — not an absence of data.

**VALIDATION REQUIRED** — This framing is derived from documentation about a prior
system, not from observation of V2's intended users. It must be confirmed or refuted by
the contextual inquiry defined in `../02-users-and-workflows/user-research-plan.md`
before `AUTH-INTENDED-USE` approves it. Study type required: contextual inquiry plus
retrospective chart/alert review to establish that delayed recognition (rather than, e.g.,
delayed escalation, staffing, or bed availability) is the dominant contributor.

### IU-02 — What the platform is intended to do about the problem

**SOURCE** (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:31`): the mission is to "design and
implement the smallest coherent platform that safely helps validated users recognize,
prioritize, explain, and coordinate responses to clinically relevant deterioration in the
validated care setting."

**SOURCE** (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:33-43`) — the minimum candidate safety
loop, quoted:

```text
trusted clinical input
  → identity, encounter, provenance, and quality validation
  → versioned deterministic evaluation
  → explicit valid / partial / not-evaluated / stale / invalid result
  → durable and explainable work item or alert when warranted
  → authorized human acknowledgment, escalation, reassignment, resolution, or override
  → immutable audit, reconciliation, outcome measurement, and rule-performance feedback
```

**INFERENCE** (reasoning from `INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:31` and `:33-45`):
the intended use of IntensiCare V2 is coextensive with this loop and no wider. The prompt
states at `:45` that breadth must not expand "until this loop is demonstrated end to end
under normal, missing, stale, duplicate, delayed, conflicting, corrected, unauthorized,
disconnected, and partially failed conditions." Any capability outside the loop is, by
construction, outside the current intended use.

---

## 2. Care-setting boundary

### IU-03 — Proposed initial setting: ICU only

**PROPOSAL:** the initial intended care setting is the **adult intensive care unit (ICU)
of a single validated pilot site**, in Brazil, in pt-BR.

Supporting evidence:

- **SOURCE** (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:23-24`): runtime variables set
  `target_country_initial: Brazil` and `target_language_initial: pt-BR`.
- **SOURCE** (`INTENSICARE_TECHNICAL_ASSESSMENT.md:98`): the legacy system's documented
  scope was "Brazilian critical-care environments."
- **SOURCE** (`INTENSICARE_TECHNICAL_ASSESSMENT.md:152`): the legacy assessment judged
  that "the present UI is most credible for an intensivist/nurse monitoring loop. It does
  not yet establish the coordinator analytics/export or rapid-response mobile journeys."
- **INFERENCE** (from `:152` and `:322`): narrowing V2's initial setting to the ICU
  monitoring loop is the boundary for which the *most* prior evidence exists and the
  *least* unvalidated breadth is inherited.

### IU-04 — Explicitly UNDECIDED settings

**SOURCE** (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:257`): Gate G1 requires validation of
"ICU, step-down, ward, rapid-response, or command-center boundaries."

The following are **UNDECIDED — VALIDATION REQUIRED**. None may be claimed, marketed,
demonstrated, or enabled until `AUTH-INTENDED-USE` decides each explicitly:

| # | Setting | Status | Why it is not settled |
|---|---|---|---|
| IU-04a | **Step-down / intermediate care** | UNDECIDED | No evidence collected on monitoring cadence, data availability, or staffing ratios in this setting. Score thresholds validated for ICU may not transfer. |
| IU-04b | **General ward** | UNDECIDED | Data density and observation frequency differ materially from ICU; the `not_evaluated`/`stale` semantics (`../03-domain/status-dimensions.md`) would dominate. |
| IU-04c | **Rapid-response team (RRT) / mobile** | UNDECIDED | **SOURCE** (`INTENSICARE_TECHNICAL_ASSESSMENT.md:152`, `:322`): the legacy system did "not yet establish ... the rapid-response mobile journeys"; `:322` records "no verified ... rapid-response mobile workflow." Inheriting this journey would inherit an unvalidated one. |
| IU-04d | **Multi-unit / multi-site command centre** | UNDECIDED | **SOURCE** (`INTENSICARE_TECHNICAL_ASSESSMENT.md:322`): "no verified coordinator KPI/export workflow." Additionally the AMH tenant-grain question is unresolved (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:99`), so cross-organization aggregation has no settled identity model. |
| IU-04e | **Emergency department** | UNDECIDED | Not addressed in any evidence input reviewed. Recorded here so its absence is explicit rather than silent. |
| IU-04f | **Inter-hospital transport / pre-hospital** | UNDECIDED | Not addressed in any evidence input reviewed. Connectivity assumptions in the safety loop would not hold. |

**VALIDATION REQUIRED** — Each row requires: (a) a decision by `AUTH-INTENDED-USE`;
(b) for any setting that is enabled, separate clinical validation of score/pathway
performance in that setting, because performance does not transfer across settings by
assumption. See `../02-users-and-workflows/g1-validation-backlog.md`.

---

## 3. Population boundary

### IU-05 — Proposed initial population: adult only

**PROPOSAL:** the initial intended population is **adults (proposed threshold: ≥18 years
at admission)** admitted to the validated ICU.

**VALIDATION REQUIRED** — the specific age threshold, and how it interacts with
adolescent patients admitted to adult ICUs, must be set by `AUTH-CLINSAFETY` jointly with
`AUTH-INTENDED-USE`. The threshold above is a drafting placeholder, not a clinical
recommendation.

### IU-06 — 🚩 BLOCKING DECISION: paediatric and neonatal populations

**SOURCE** (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:256`): Gate G1 requires validation of
"adult/pediatric/neonatal population boundaries."

**SOURCE** (`INTENSICARE_TECHNICAL_ASSESSMENT.md:997`), open question #1 verbatim: "What
exact intended use, patient population, care setting, and exclusions will be claimed?
Adult ICU only? Advisory or directive behavior?" — the legacy assessment recorded this as
**unresolved**.

**INFERENCE** (reasoning from `INTENSICARE_TECHNICAL_ASSESSMENT.md:108` and `:997`): the
legacy system implemented MEWS, NEWS2, SOFA and qSOFA. These are adult instruments. A
system that computes them and presents the result carries an implicit adult-population
assumption. If a paediatric or neonatal patient is admitted to a unit where V2 is active
and V2 evaluates them with adult instruments, the result is not merely out of scope — it
is **actively misleading**, because the output would be rendered in the same visual
vocabulary as a validated adult result.

**This is flagged as a BLOCKING DECISION** for the following reason: it is not sufficient
to declare paediatric/neonatal "out of scope" in prose. The scope boundary must be
**enforced in the system's behaviour** — i.e. V2 must be able to determine, from trusted
identity/encounter data, whether a patient is inside the approved population, and must
render an explicit non-evaluation (not a score, not `normal`) when they are outside it or
when age is unknown. That requirement depends on this decision, so architecture cannot
proceed past it.

| Decision needed | Status | Owner |
|---|---|---|
| Is paediatric in scope for V2 v1? | **UNDECIDED — BLOCKING** | `AUTH-INTENDED-USE` + `AUTH-CLINSAFETY` — both UNASSIGNED |
| Is neonatal in scope for V2 v1? | **UNDECIDED — BLOCKING** | `AUTH-INTENDED-USE` + `AUTH-CLINSAFETY` — both UNASSIGNED |
| If out of scope: what does V2 do when an out-of-population patient occupies a monitored bed? | **UNDECIDED — BLOCKING** | `AUTH-CLINSAFETY` — UNASSIGNED |
| If out of scope: what does V2 do when age/DOB is missing, unparseable, or conflicting? | **UNDECIDED — BLOCKING** | `AUTH-CLINSAFETY` — UNASSIGNED |

**PROPOSAL (pending the above):** paediatric and neonatal populations are **excluded**
from V2 v1, and an out-of-population or unknown-age patient must render as an explicit
non-evaluated state consistent with `../03-domain/status-dimensions.md`, never as a score
and never as `normal`. This aligns with `INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:119`:
"Never coerce missing, stale, invalid, partial, conflicting, or unevaluable clinical data
to zero, normal, no-risk, or silent no-fire."

### IU-07 — Other population sub-boundaries not yet addressed

**VALIDATION REQUIRED** — the following sub-populations are neither included nor excluded
by any evidence reviewed, and are recorded so their absence is explicit. Each requires a
decision by `AUTH-CLINSAFETY`: pregnancy/obstetric critical care; patients on
extracorporeal support (ECMO/CRRT) whose physiology may invalidate score assumptions;
patients under palliative or comfort-focused goals of care, where an escalation prompt may
be clinically inappropriate; post-operative cardiac surgical patients with
protocol-expected physiological derangement; and patients with documented
treatment-limitation orders.

**INFERENCE:** the palliative/treatment-limitation case is materially different from the
others. For those patients the system could be *technically correct and clinically wrong*
— generating an escalation work item that contradicts an agreed goal of care. No evidence
reviewed addresses this. It is recorded in the G1 backlog as a distinct hazard-adjacent
question.

---

## 4. Intended users

**SOURCE** (`INTENSICARE_TECHNICAL_ASSESSMENT.md:133-139`) — the legacy documented user
set, derived (per `:56`) from repository documentation and **not** from observation.
Details and hypotheses are developed in `../02-users-and-workflows/user-roles-hypotheses.md`.

**PROPOSAL — intended users of V2 v1, narrowed to the ICU monitoring loop:**

| # | Intended user | Intended interaction | Status |
|---|---|---|---|
| IU-08a | **Intensivist / ICU physician** | Review prioritized work items, inspect contributing signals and evaluation provenance, decide and record clinical action. | PROPOSAL — VALIDATION REQUIRED |
| IU-08b | **ICU nurse (bedside)** | Receive and acknowledge work items, understand rationale, record action taken, escalate. | PROPOSAL — VALIDATION REQUIRED |
| IU-08c | **ICU nurse coordinator / charge nurse** | Unit-level view of outstanding work and acuity; ownership and reassignment of work items. | PROPOSAL — VALIDATION REQUIRED |

**Explicitly NOT intended users of v1** (recorded to prevent silent scope growth):
patients and family members; rapid-response teams as a distinct mobile workflow
(see IU-04c); unit coordinators acting in an analytics/export capacity (see IU-04d);
hospital executives or quality departments consuming aggregate reporting.

**VALIDATION REQUIRED** — the boundary between IU-08b and IU-08c (bedside nurse vs.
coordinator) is a *hypothesis about how ICU work is divided in the pilot site*, not an
observation. Brazilian ICU staffing models, nurse-to-patient ratios, and the role of the
*enfermeiro coordenador* must be observed before this table is treated as real. See
`../02-users-and-workflows/user-research-plan.md`.

**Constraint on all users — SOURCE** (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:118`): "Do
not infer tenant, patient, encounter, unit, or authorization context from caller-controlled
values." **INFERENCE:** therefore "intended user" is not a self-declared attribute; V2 must
derive a user's role and scope from verified identity, and a person outside the intended
user set must not be able to obtain a clinical view by asserting a role.

---

## 5. The advisory-not-directive boundary

### IU-09 — Statement of the boundary

**SOURCE** (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:127`), rule 15 verbatim: "Keep clinical
decision authority with accountable humans. Automation may calculate, summarize, route,
and explain within approved intended use; it may not silently expand the intended use."

**PROPOSAL — the V2 advisory boundary, stated operationally:**

IntensiCare V2 is **advisory**. Its outputs are inputs to a human decision, never a
decision. Concretely:

| V2 **may** | V2 **may not** |
|---|---|
| **Calculate** a versioned, deterministic evaluation from validated inputs. | Decide whether a clinical intervention is warranted. |
| **Summarize** the state of a patient or unit, including what it could *not* evaluate. | Present a summary as a complete clinical picture. |
| **Route** a durable work item to an authorized human. | Perform, order, schedule, or cancel any clinical action. |
| **Explain** why an evaluation produced its result, with the rule version and contributing inputs. | Substitute its explanation for clinical reasoning or for the medical record. |
| **Record** an authorized human's acknowledgment, escalation, reassignment, resolution, or override. | Auto-resolve, auto-acknowledge, or time-out a work item into a closed state without a human actor. |
| **Escalate** by making an unattended work item *more visible* per an approved, versioned policy. | Escalate by taking clinical action, contacting a patient, or altering therapy. |

**INFERENCE** (reasoning from `INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:41` and `:127`): the
safety loop names the human actions — "authorized human acknowledgment, escalation,
reassignment, resolution, or override" — as a distinct step *after* the durable work item.
The presence of "override" in that list means the human's disagreement with the system is
an intended, first-class, recorded outcome, not an error state. **PROPOSAL:** V2 must make
override at least as easy as agreement, and must record the override without implying
fault.

### IU-10 — What "advisory" does *not* excuse

**INFERENCE** (reasoning from `INTENSICARE_TECHNICAL_ASSESSMENT.md:330` and `:26`): an
advisory label does not neutralize harm from a *wrong or falsely reassuring display*. The
legacy assessment's most severe UX finding was semantic: "an occupied bed without
sufficient measurements can be shown as `normal`" (`:330`), and "the system does not
consistently distinguish fresh, stale, expired, missing, invalid, and partially evaluated
states ... That is likely to create false reassurance." A clinician who de-prioritizes a
patient because an advisory display said `normal` has been harmed by the advisory system.

**PROPOSAL:** V2 must treat *false reassurance* as a first-class hazard class of equal
standing to false alerting, and must never render an absence of evaluation in the same
visual vocabulary as a low-risk evaluation. Hazard identification and acceptance belong to
`AUTH-CLINSAFETY` (`docs/00-governance/decision-rights.md:42`); this document only asserts
that intended use cannot be read as a defence against this failure mode.

### IU-11 — MCP / AI outputs are inside the advisory boundary, not above it

**SOURCE** (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:121`): "Real-time delivery must be
derived from durable, replayable state or events. WebSocket/SSE/MCP responses are not the
clinical system of record."

**SOURCE** (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:1063`): never "let an MCP/AI agent
become an unreviewed source of clinical truth."

**PROPOSAL:** any MCP or model-generated output is an *assistive rendering* of the
deterministic evaluation record and never a substitute for it. See
`non-intended-uses.md` NIU-05.

---

## 6. Claims explicitly NOT made

**SOURCE** (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:123`), rule 11 verbatim: "Do not claim
clinical effectiveness, regulatory compliance, security, availability, or AMH compatibility
without corresponding evidence and named approval."

**SOURCE** (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:1061`): never "make generic standards
claims such as 'FHIR compatible,' 'HL7 compliant,' 'secure,' 'accessible,' or 'highly
available' without named versions, profiles, scenarios, and evidence."

As of 2026-08-14, IntensiCare V2 makes **none** of the following claims. Each is listed so
that its absence is explicit and auditable:

| # | Claim NOT made | Why not, and what would be required to make it |
|---|---|---|
| IU-12a | **No regulatory claim.** V2 is not stated to be a registered medical device, ANVISA-cleared, CE-marked, or FDA-cleared, and no regulatory classification has been determined. | **SOURCE** (`INTENSICARE_TECHNICAL_ASSESSMENT.md:42`): the legacy assessment listed as "investigate before reuse" the question of "whether the declared clinical sign-off is adequate for the intended regulatory route." A regulatory classification hypothesis is a SPARK "R" output (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:216`) and does not yet exist. Requires `AUTH-PRIVACY-LEGAL` + `AUTH-CLINSAFETY` and named regulatory counsel. |
| IU-12b | **No clinical-effectiveness claim.** V2 is not claimed to reduce mortality, length of stay, missed deterioration, or any clinical outcome. | **SOURCE** (`INTENSICARE_TECHNICAL_ASSESSMENT.md:100`): legacy documented goals including "clinical evaluation of sensitivity, positive predictive value, mortality, and alarm fatigue" are recorded as "targets, not demonstrated service levels." Requires a prospective study; see `success-and-harm-metrics.md`. |
| IU-12c | **No diagnostic-accuracy claim.** No sensitivity, specificity, PPV, or NPV figure is claimed for any score or pathway. | **SOURCE** (`INTENSICARE_TECHNICAL_ASSESSMENT.md:125`): the legacy clinical sign-off "honestly records that the approver's CRM/institution is not verifiable and formal statistical validation remains pending." No V2 measurement exists. |
| IU-12d | **No AMH-compatibility claim.** V2 is not claimed to be compatible with the AMH data platform. | **SOURCE** (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:53`): compatibility must be "testable ... at a pinned revision." See `docs/08-interoperability/amh-data/`. Gate G3 governs. |
| IU-12e | **No FHIR/HL7 conformance claim.** No claim of "FHIR compatible" or "HL7 compliant" is made. | Per `INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:1061`, such a claim requires named versions, profiles, and scenarios. **SOURCE** (`:96`): the AMH FHIR IG's only Observation profile is `Observation-amh-laboratory` and "is not a general vital-signs profile." |
| IU-12f | **No security, availability, or performance claim.** No SLO, uptime, or alert-latency figure is claimed. | **SOURCE** (`INTENSICARE_TECHNICAL_ASSESSMENT.md:100`, `:304`): legacy targets (p95 <30 s, 99.9% availability) were "targets, not demonstrated service levels," and `:304` records the target "cannot be established without a streaming lane and production measurements." |
| IU-12g | **No accessibility-conformance claim.** No WCAG conformance level is claimed. | **SOURCE** (`INTENSICARE_TECHNICAL_ASSESSMENT.md:349`): in the legacy system, "runtime contrast, zoom/reflow, reduced motion, touch targets, screen-reader reading order, and keyboard operation of all dialogs remain **[V] unverified**." |
| IU-12h | **No claim of validated workflow fit.** No claim that V2 fits any real ICU workflow. | **SOURCE** (`INTENSICARE_TECHNICAL_ASSESSMENT.md:56`): no stakeholder interviews or observed workflow studies were performed for the legacy system, and **none have been performed for V2**. This is the Gate G1 blocker. |
| IU-12i | **No claim of population or setting generalization.** Nothing is claimed about performance outside the approved population/setting. | See IU-04, IU-06. |

**INFERENCE:** IU-12h is the claim most at risk of being made accidentally — for example
by a demonstration, a screenshot, or a slide that shows a plausible ICU workflow. A
rendered interface is not evidence of workflow fit. This mirrors
`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:1062`, which forbids accepting "an infrastructure
render, health endpoint, test count, sign-off document, or model-generated report as
sufficient release evidence."

---

## 7. Conditions under which this statement becomes approvable

**SOURCE** (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:251-262`), Gate G1: "Do not approve
solution architecture until intended users have been observed or the absence is explicitly
accepted as a blocking risk."

**INFERENCE:** the prompt offers exactly two routes past G1 — observation, or explicit
accepted-blocking-risk. There is no third route in which the absence of observation is
simply not mentioned. As of 2026-08-14, V2 has taken neither route: no observation has
occurred and no named human has accepted the risk.

This statement becomes approvable when **all** of the following hold:

1. `AUTH-INTENDED-USE` is staffed by a named human (Gate G0,
   `INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:247-248`).
2. `AUTH-CLINSAFETY` is staffed and has decided IU-06 (paediatric/neonatal).
3. Either the contextual inquiry in `../02-users-and-workflows/user-research-plan.md` has
   been executed and its findings reconciled against §§1–5, **or** a named human has
   recorded acceptance of unobserved-users as a blocking risk, with rationale, in
   `docs/00-governance/registers/risk-register.md`.
4. Every UNDECIDED row in §2 and §3 is either decided or explicitly deferred with a named
   owner and date (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:249`: "unknowns have owners and
   dates rather than silent defaults").
5. The non-intended uses in `non-intended-uses.md` are approved by the same authority in
   the same act — **INFERENCE:** approving what a system is for, without simultaneously
   approving what it is not for, leaves the boundary undefined and therefore unenforceable.

**Stop condition — SOURCE** (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:1043`): work must stop
and request named human authority when "intended use, patient population, clinical
ownership, or human action cannot be established." All four are currently unestablished.

---

## 8. Cross-references

- `non-intended-uses.md` — the enforceable exclusions that bound this statement.
- `success-and-harm-metrics.md` — how benefit and harm would be measured.
- `../02-users-and-workflows/user-roles-hypotheses.md` — who monitors, acts, escalates, closes.
- `../02-users-and-workflows/workflow-hypotheses.md` — the journeys this intended use assumes.
- `../02-users-and-workflows/user-research-plan.md` — the G1 evidence route.
- `../02-users-and-workflows/g1-validation-backlog.md` — every question blocking G1.
- `../00-governance/authority-model.md` — `AUTH-INTENDED-USE` and peers.
- `../03-domain/status-dimensions.md` — the evaluation-status vocabulary this document relies on.
