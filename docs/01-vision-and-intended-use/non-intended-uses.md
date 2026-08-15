---
doc_id: VIS-NON-INTENDED-USES
title: IntensiCare V2 — Non-Intended Uses (Explicit Exclusions)
status: PROPOSAL
label: PROPOSAL
approver: UNASSIGNED — VALIDATION REQUIRED
approver_role: AUTH-INTENDED-USE (docs/00-governance/authority-model.md:34)
owner: UNASSIGNED — VALIDATION REQUIRED
validation_status: VALIDATION REQUIRED
last_updated: 2026-08-14
provenance:
  source_repo: intensicare-V2
  path_or_url: docs/01-vision-and-intended-use/non-intended-uses.md
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
    lines_used: "33-45, 111-127, 251-262, 1039-1063"
  - repo: intensicare (legacy, READ-ONLY, risk-informed input NOT authority)
    path: INTENSICARE_TECHNICAL_ASSESSMENT.md
    commit: 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79
    lines_used: "19-42, 94-152, 298-316, 318-357, 639-647, 993-1029"
---

# IntensiCare V2 — Non-Intended Uses

> **STATUS: PROPOSAL — NOT APPROVED. APPROVER: UNASSIGNED — VALIDATION REQUIRED.**
>
> This document is the enforceable complement to `intended-use-statement.md`. Neither is
> binding until `AUTH-INTENDED-USE` approves both. Per
> `intended-use-statement.md` §7.5, they should be approved in the same act.
>
> `NIU-nn` anchors are document-local review handles, not catalog IDs
> (`docs/00-governance/traceability-policy.md:21-39`).

## 0. Why this document exists separately

**INFERENCE** (reasoning from `INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:127` and `:1052`):
the orchestrator prompt forbids automation that "silently expand[s] the intended use," and
lists as a stop condition any action that "would silently broaden intended use or automate
a clinical decision beyond approved boundaries." A boundary can only be detected as
crossed if it was written down first. An intended-use statement alone describes a centre;
this document describes the edge.

**PROPOSAL — how these exclusions are meant to function:** each exclusion below is
intended to be *testable*, not merely declarative. An exclusion that cannot be violated in
a detectable way is not a control. Where an exclusion implies a system behaviour, it is
marked **[behavioural]** and should generate a requirement and a test in the catalogs owned
by other specialists (`docs/00-governance/traceability-policy.md:21-39`). Where it can only
be enforced by human governance, it is marked **[governance]**.

---

## NIU-01 — Not a substitute for medical-device diagnosis or clinical judgment

**Excluded:** using IntensiCare V2 as a diagnostic device, as a substitute for a
registered medical device, or as a replacement for clinical examination, clinical
judgment, or a physician's or nurse's independent assessment.

**Basis:**

- **SOURCE** (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:127`): "Keep clinical decision
  authority with accountable humans. Automation may calculate, summarize, route, and
  explain within approved intended use."
- **SOURCE** (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:123`): no claim of "clinical
  effectiveness [or] regulatory compliance ... without corresponding evidence and named
  approval."
- **SOURCE** (`INTENSICARE_TECHNICAL_ASSESSMENT.md:125`): in the legacy system the clinical
  sign-off "honestly records that the approver's CRM/institution is not verifiable and
  formal statistical validation remains pending" — i.e. no diagnostic validation existed.
- **INFERENCE:** V2 has performed no diagnostic validation of any kind as of 2026-08-14.
  Any diagnostic use would therefore be use without evidence.

**[behavioural]** V2 output must be presented as an input to a human decision, carrying its
rule version and the identity/completeness of its inputs. **[governance]** No V2 material
(interface copy, documentation, demonstration, or sales material) may describe an output as
a diagnosis, a diagnosis suggestion, or a rule-out.

**VALIDATION REQUIRED** — the regulatory classification that would determine whether V2 is
a medical device under ANVISA rules is **not yet determined** (`intended-use-statement.md`
IU-12a). This exclusion is written to hold regardless of how that classification resolves;
it must be re-examined by `AUTH-PRIVACY-LEGAL` once it does.

---

## NIU-02 — Not autonomous clinical action

**Excluded:** any configuration in which IntensiCare V2 initiates, orders, adjusts,
withholds, schedules, or cancels a clinical intervention; changes therapy or device
settings; contacts a patient or family; or closes a clinical work item without an
authorized human actor.

**Basis:**

- **SOURCE** (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:41`): the safety loop's human step is
  "authorized human acknowledgment, escalation, reassignment, resolution, or override."
- **SOURCE** (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:1052`): stop when an action "would
  silently broaden intended use or automate a clinical decision beyond approved boundaries."

**[behavioural]** Every state transition of a clinical work item must record an
authenticated human actor. **INFERENCE:** this exclusion specifically forbids
*auto-resolution* and *expiry-to-closed* behaviours. A work item that disappears because a
timer elapsed is an autonomous clinical decision that the deterioration no longer matters
— the fact that no clinician was involved is precisely what makes it autonomous, not what
makes it safe.

**Boundary clarification (PROPOSAL):** automated *visibility* changes are permitted and are
not autonomous action. A versioned, approved policy that makes an unattended work item more
prominent, or adds it to a coordinator's view, does not decide anything clinical. The line
is: V2 may change **who sees what, and how urgently it is presented**; V2 may not change
**what happens to the patient**.

**VALIDATION REQUIRED** — the escalation-visibility policy itself is clinical content and
requires `AUTH-CLINSAFETY` ratification; per
`docs/00-governance/decision-rights.md:43` and `INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:122`,
"Rule authors may not approve their own clinical content."

---

## NIU-03 — Not a system of record for the EHR

**Excluded:** using IntensiCare V2 as the legal medical record, as the authoritative source
of clinical documentation, as a replacement for EHR/prontuário documentation, or as the
authoritative store of patient identity, encounters, orders, results, or medication data.

**Basis:**

- **SOURCE** (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:121`): "WebSocket/SSE/MCP responses are
  not the clinical system of record."
- **SOURCE** (`INTENSICARE_TECHNICAL_ASSESSMENT.md:231`): the legacy architecture's own ADR
  positioned IntensiCare as a *consumer* of the platform — "use Gold/Athena, MPI, FHIR R4,
  inherited IAM/KMS/ABAC ... rather than recreate ingestion/platform responsibilities."
- **INFERENCE** (from `INTENSICARE_TECHNICAL_ASSESSMENT.md:302`): the legacy assessment
  found "boundary drift" where a "direct vitals API plus standalone MLLP" coexisted with
  the documented consumer boundary, concluding "source-of-truth and latency strategy are
  unresolved." **PROPOSAL:** V2 must state its source-of-truth boundary before building
  ingestion, not after.

**[behavioural]** Clinical facts consumed from an upstream source must retain their source
identity, source timestamp, and provenance, per
`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:120`: "Never invent a source timestamp. Preserve the
original value, timezone/offset, precision, received time, and quality state."

**Important nuance (INFERENCE):** V2 *is* the system of record for **its own** artifacts —
its evaluation records, its work items, its human-action audit trail. Excluding V2 as the
EHR system of record does not permit V2's own audit trail to be non-durable. The safety
loop requires "immutable audit, reconciliation, outcome measurement, and rule-performance
feedback" (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:42`). These two statements are
complementary: V2 owns the record of *what V2 evaluated and what humans did about it*; it
does not own the record of *the patient*.

**VALIDATION REQUIRED** — whether a V2 work-item action must also be written back to the
hospital EHR, and whether such writeback is legally part of the medical record, is
undetermined. Owners: `AUTH-PRIVACY-LEGAL` and `AUTH-DATA-PLATFORM`.

---

## NIU-04 — Not validated for populations, settings, or languages outside approved scope

**Excluded:** use with any patient population, in any care setting, at any site, on any
device class, or in any language other than those explicitly approved in
`intended-use-statement.md` §§2–3.

**Basis:**

- **SOURCE** (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:256-257`): Gate G1 requires validated
  "adult/pediatric/neonatal population boundaries" and "ICU, step-down, ward,
  rapid-response, or command-center boundaries."
- **SOURCE** (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:260`): Gate G1 also requires validated
  "languages, accessibility needs, target devices, unit size, environmental constraints, and
  time-to-decision goals."
- **SOURCE** (`INTENSICARE_TECHNICAL_ASSESSMENT.md:997`): the legacy assessment left "what
  exact intended use, patient population, care setting, and exclusions will be claimed"
  explicitly open.

Specifically excluded until separately approved and separately validated:

| # | Excluded use | Note |
|---|---|---|
| NIU-04a | Paediatric or neonatal patients | **BLOCKING decision — see `intended-use-statement.md` IU-06.** Adult instruments (MEWS/NEWS2/SOFA/qSOFA) applied to these populations produce output that is misleading rather than merely absent. |
| NIU-04b | Step-down, ward, ED, RRT, transport, or command-centre settings | See IU-04. Score performance does not transfer across settings by assumption. |
| NIU-04c | Sites other than the approved pilot site | Data availability, staffing, and workflow differ per site; per-site validation required. |
| NIU-04d | Languages other than pt-BR | **SOURCE** (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:24`): `target_language_initial: pt-BR`. Clinical terminology is not safely machine-translatable; see `../02-users-and-workflows/user-research-plan.md` §6. |
| NIU-04e | Device classes not validated (e.g. personal mobile devices, shared kiosks) | **SOURCE** (`INTENSICARE_TECHNICAL_ASSESSMENT.md:349`): touch targets, zoom/reflow, and screen-reader behaviour were "**[V]** unverified" in the legacy system. |

**[behavioural]** **PROPOSAL:** exclusion NIU-04a in particular must be enforced by the
system, not only by policy — see `intended-use-statement.md` IU-06. A patient whose age is
outside scope, or unknown, must render an explicit non-evaluated state, never a score and
never `normal`.

---

## NIU-05 — MCP/AI output never replaces the signed deterministic evaluation record

**Excluded:** treating any Model Context Protocol response, model-generated summary,
natural-language explanation, or other AI-produced artifact as the clinical evaluation, as
evidence of an evaluation, or as a substitute for the versioned deterministic evaluation
record.

**Basis:**

- **SOURCE** (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:1063`): never "let an MCP/AI agent
  become an unreviewed source of clinical truth."
- **SOURCE** (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:121`): "WebSocket/SSE/MCP responses are
  not the clinical system of record."
- **SOURCE** (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:109`): "No current normative MCP server
  contract was found in the active AMH architecture ... Treat MCP as a new V2 interface
  requiring its own ADR and contracts, not as inherited AMH compatibility."
- **SOURCE** (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:122`): "Clinical rules are immutable,
  versioned release artifacts."
- **SOURCE** (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:38-39`): the safety loop specifies
  "versioned deterministic evaluation" producing an "explicit valid / partial /
  not-evaluated / stale / invalid result."

**INFERENCE:** "deterministic" and "generative" are mutually exclusive properties for the
same artifact. If an evaluation result can vary between two runs on identical inputs, it
cannot serve the loop's audit and reproducibility function
(`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:42`, "immutable audit, reconciliation, outcome
measurement, and rule-performance feedback"). Therefore an AI-generated artifact can never
occupy the evaluation slot in the loop, regardless of its quality.

**[behavioural]** **PROPOSAL:** any AI/MCP-generated rendering presented to a clinician must
(a) be visually and structurally distinguishable from the deterministic record; (b) carry a
reference to the specific deterministic evaluation record it describes; (c) never be the
only representation of a clinical state; and (d) never be stored as, or promoted to, the
evaluation record. **INFERENCE:** requirement (c) matters most in degraded operation — if
the deterministic record is unavailable, the correct behaviour is to say so, not to fall
back to a generated summary.

**[governance]** Per `INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:122`, "Rule authors may not
approve their own clinical content" — and per `docs/00-governance/decision-rights.md:43`, an
agent may not approve its own authored rule. **INFERENCE:** an AI system authoring or
mutating clinical rule content is the same self-approval failure with a machine in the
author's seat, and is excluded on the same grounds.

---

## NIU-06 — Not a staffing, billing, rationing, or performance-management tool

**Excluded:** using IntensiCare V2 data to allocate staff, determine bed or ICU admission
priority, support billing or reimbursement, evaluate individual clinician performance, or
support any disciplinary or employment process.

**Basis:**

- **INFERENCE** (reasoning from `INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:31`): the mission
  scopes V2 to helping users "recognize, prioritize, explain, and coordinate responses to
  clinically relevant deterioration." Staffing, billing, rationing, and performance
  management are none of these, and each would create an incentive that distorts the
  clinical behaviour the system depends on.
- **INFERENCE** (reasoning from `INTENSICARE_TECHNICAL_ASSESSMENT.md:145` and `:311`): the
  legacy system recorded acknowledge/escalate/resolve actions but its audit of those
  transitions was incomplete (`:311`: "alert transitions are not audited"). **PROPOSAL:**
  when V2 corrects this and *does* durably record who acknowledged what and when, it
  creates a dataset that is directly usable for clinician surveillance. The exclusion must
  be stated **before** the data exists, not after.

**[governance]** **VALIDATION REQUIRED** — this exclusion has employment-law and works-council
implications in Brazil and requires `AUTH-PRIVACY-LEGAL`. It is listed as a non-intended use
on clinical-safety grounds (a clinician who believes acknowledgment is being scored will
acknowledge differently), and that reasoning requires `AUTH-CLINSAFETY` confirmation.

---

## NIU-07 — Not a research dataset or secondary-use platform without separate basis

**Excluded:** using V2-held clinical data for research, algorithm training, quality
benchmarking, or any secondary purpose, absent a separately established lawful basis,
approval, and governance.

**Basis:**

- **SOURCE** (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:1046`): stop when "privacy/legal basis,
  processor terms, residency, retention, or PHI use is unresolved."
- **SOURCE** (`INTENSICARE_TECHNICAL_ASSESSMENT.md:1010`), legacy open question #11: "What
  data is PHI, what purposes/lawful bases apply, and what retention, deletion, legal-hold,
  and localization obligations exist?" — recorded as unresolved.
- **SOURCE** (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:124`): "Use synthetic or formally
  de-identified data in development and tests."

**INFERENCE:** `success-and-harm-metrics.md` proposes measuring alert precision/recall
against adjudicated outcomes. That measurement *is* a secondary use of clinical data and
therefore falls inside this exclusion until a basis exists. This is noted so the metrics
plan is not read as self-authorizing.

---

## NIU-08 — Not a real-time alarm system, and not a substitute for bedside monitoring

**Excluded:** relying on IntensiCare V2 as a physiological alarm system, as a substitute for
bedside monitor alarms, or for any time-critical notification whose failure would go
undetected.

**Basis:**

- **SOURCE** (`INTENSICARE_TECHNICAL_ASSESSMENT.md:231`): the legacy ADR's "sub-30-minute
  Gold freshness conflict[s] with the product's sub-30-second alert objective."
- **SOURCE** (`INTENSICARE_TECHNICAL_ASSESSMENT.md:239`): "batch Gold reads cannot satisfy
  seconds-level bedside alerting. A successor needs an explicit two-lane model."
- **SOURCE** (`INTENSICARE_TECHNICAL_ASSESSMENT.md:304`): the p95-under-30-seconds target
  "cannot be established without a streaming lane and production measurements."
- **SOURCE** (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:95`): AMH ADR-040 "explicitly says the
  path is not near-real-time."

**INFERENCE:** this is the single most important exclusion to state early, because it is the
one most likely to be assumed away. A user who believes V2 will alarm on acute
deterioration will, rationally, attend less closely to other signals. If V2's actual data
cadence is minutes-to-tens-of-minutes, that belief is a direct patient-safety hazard created
by the product's framing rather than by any defect in its code.

**[behavioural]** **PROPOSAL:** V2 must display the *actual freshness* of the data behind any
state, and must make the achieved latency visible rather than implied. Per
`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:1059`, never "hide 'unknown,' 'not evaluated,'
degradation, partial failure, or alert-delivery uncertainty."

**VALIDATION REQUIRED** — whether V2 v1 has any near-real-time lane at all is an open
architecture question (Gate G3 / `docs/08-interoperability/amh-data/`). Until it is
resolved, no time-criticality may be claimed or implied. Owner: `AUTH-DATA-PLATFORM` with
`AUTH-CLINSAFETY`.

---

## NIU-09 — Not a source of truth during degraded or disconnected operation

**Excluded:** relying on a V2 display as an accurate representation of current patient state
when V2 is degraded, disconnected, stale, or partially failed.

**Basis:**

- **SOURCE** (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:45`): the loop must be demonstrated
  under "normal, missing, stale, duplicate, delayed, conflicting, corrected, unauthorized,
  disconnected, and partially failed conditions."
- **SOURCE** (`INTENSICARE_TECHNICAL_ASSESSMENT.md:330`): in the legacy system "stale
  historical data can be returned when the 24-hour window is empty," and fresh/stale/
  expired/missing/invalid/partial states were not consistently distinguished.
- **SOURCE** (`INTENSICARE_TECHNICAL_ASSESSMENT.md:26`): missing input became "reassuring
  numeric zero," and "the dashboard floors an unscored bed to `normal`."

**[behavioural]** Per `INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:119`: "Never coerce missing,
stale, invalid, partial, conflicting, or unevaluable clinical data to zero, normal, no-risk,
or silent no-fire." **INFERENCE:** the corollary is that degraded operation must be *visible
at the point of clinical use* — a status banner on an admin page does not discharge this,
because the clinician reading a bed tile is not reading the admin page.

**VALIDATION REQUIRED** — what clinicians should be instructed to do when V2 is degraded is
a workflow question with no current answer. See `../02-users-and-workflows/workflow-hypotheses.md`
WF-05.

---

## NIU-10 — Not approved for any use at all, as of 2026-08-14

**OBSERVED** (V2 repository, `cb355212b96fc5e63ab79474d50538cc86d96a5d`, inspected
2026-08-14): IntensiCare V2 consists of documentation and an orchestrator prompt. No
implementation, no validation, no clinical approval, and no named approver exists.

**INFERENCE:** therefore the complete and accurate statement of V2's current approved use is
**none**. Every "intended use" in `intended-use-statement.md` is a proposal for a future
approved use. This entry exists so that no reader of these documents mistakes a drafted
intended use for an approved one.

---

## Cross-references

- `intended-use-statement.md` — the positive boundary these exclusions bound.
- `success-and-harm-metrics.md` — HM-series harm metrics detect several of these exclusions being violated in practice.
- `../02-users-and-workflows/g1-validation-backlog.md` — the open questions that must close before any exclusion can be relaxed.
- `../00-governance/decision-rights.md` — who may relax an exclusion (`AUTH-INTENDED-USE`; never an agent).
- `../03-domain/status-dimensions.md` — the vocabulary NIU-09 depends on.
