---
id: SAFETY-PLAN-V2
title: IntensiCare V2 Clinical Safety Plan
label: PROPOSAL
statement: >
  This plan defines how clinical safety is engineered, evidenced, and governed for
  IntensiCare V2: scope, lifecycle mapped to gates G0–G8, roles, hazard-analysis
  method, hazard-log process, safety-requirement derivation, and independence rules.
  It is a PROPOSAL. No part of it constitutes residual-risk acceptance, hazard
  closure, severity sign-off, or clinical content approval.
provenance:
  source_repo: intensicare-V2
  path_or_url: docs/05-clinical-safety/safety-plan.md
  commit_sha_or_version: uncommitted (working tree at cb35521)
  section_or_lines: whole document
  date_collected: 2026-08-14
  collector: clinical safety-case engineer (Wave 1 specialist agent)
  transformation: synthesized from orchestrator prompt §§1,2,3,13,14 and legacy technical assessment (read-only)
  confidence: medium
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  requirements: [SAF-0001, SAF-0037]
  hazards: [HAZ-0001, HAZ-0040]
  adrs: []
  tests: []
  pr: null
supersedes: null
superseded_by: null
---

# IntensiCare V2 — Clinical Safety Plan

> **Status: PROPOSAL.** Every role in this plan is `UNASSIGNED — VALIDATION REQUIRED`.
> No agent may accept residual risk, close a hazard, sign off a severity, or approve
> clinical content. Those acts require named, qualified humans (orchestrator prompt
> §4 "Required independence", `INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:197-207`).

## 0. Citation shorthand

| Token | Resolves to |
|---|---|
| `PROMPT:n-m` | `/Users/familia/code/intensicare-V2/INTENSICARE_V2_ORCHESTRATOR_PROMPT.md`, lines n–m |
| `LEGACY-TA:n-m` | `/Users/familia/intensicare/INTENSICARE_TECHNICAL_ASSESSMENT.md`, lines n–m (READ-ONLY, risk-informed input, **not authority**) |

Legacy paths quoted *inside* `LEGACY-TA` excerpts (e.g. `src/intensicare/services/mews.py:11-13`)
are the assessment's own citations into the legacy repository. This document has **not**
independently verified legacy source files; it verified the assessment text only. That
distinction is preserved in every hazard row (see `hazard-log.md` §2).

## 1. Scope

### 1.1 In scope

SOURCE (`PROMPT:33-45`): the minimum candidate safety loop that this plan governs.

```text
P1  trusted clinical input
P2  → identity, encounter, provenance, and quality validation
P3  → versioned deterministic evaluation
P4  → explicit valid / partial / not-evaluated / stale / invalid result
P5  → durable and explainable work item or alert when warranted
P6  → authorized human acknowledgment, escalation, reassignment, resolution, or override
P7  → immutable audit, reconciliation, outcome measurement, and rule-performance feedback
```

This plan additionally governs a cross-cutting phase **P0 — platform and lifecycle**
(INFERENCE from `PROMPT:748-768`): supply chain, secrets, PHI handling, CI gates,
backup/restore, and MCP/AI surfaces, because failures there defeat every loop phase
without appearing in any single one.

Safety engineering covers: hazard identification and analysis; derivation of safety
requirements (`SAF-xxxx`); the control-to-evidence argument (`safety-case/`); the
evaluation-status semantics that the whole loop depends on
(`evaluation-status-semantics.md`); and the hazard log as a live register.

### 1.2 Out of scope for this document

- **Pathway portfolio selection and clinical content.** Reserved for the clinical
  pathway portfolio optimizer (`PROMPT:264-349`); this agent's write scope explicitly
  excludes `pathway-portfolio/`.
- **Security threat modeling.** Handed to the healthcare threat-model specialist
  (Wave 2). This plan states *where* hazard analysis and threat modeling must be run
  jointly (§5.4) but does not perform the threat model.
- **Regulatory classification.** See §9. Not established. Not assumed.
- **Any acceptance decision.** See §4 and §7.

### 1.3 Explicit non-claims

INFERENCE (from `PROMPT:123`, `PROMPT:1054-1063`): the existence of this plan, the
hazard log, or the safety-case skeleton does **not** constitute a safety case, a
compliance claim, a clinical-effectiveness claim, or evidence of a safe system. It
is a structure into which evidence must be placed and independently accepted.

## 2. Why a safety plan is the first V2 clinical artifact

SOURCE (`LEGACY-TA:461-465`): the legacy repository contained "a hazard log, design
mitigations, clinical rule references, a clinical sign-off artifact, test vectors,
and regulatory planning… substantially better than undocumented clinical logic. It is
not yet a closed safety case: several high-severity hazards remain open, mitigation
code and tests are incomplete, the validating person/institution is not independently
evidenced, and retrospective/prospective performance is pending."

SOURCE (`LEGACY-TA:469-478`): legacy documented hazard `HAZ-030` required that missing
required input produce `not evaluated`, not a silent no-fire — and the implementation
returned numeric `0` for MEWS, NEWS2, SOFA and qSOFA when all clinical inputs were
absent, persisted that number, and let it drive a `normal` bed state. The assessment
calls this "a confirmed violation of documented intent and the most serious clinical
safety defect in the repository."

INFERENCE: a hazard log without traceable, testable, blocking controls does not
prevent harm. The legacy system had the *right hazard statement written down* and
shipped the *exact hazard anyway*. Therefore this plan's central design constraint is:
**every hazard must terminate in a `SAF-xxxx` requirement, and every `SAF-xxxx`
requirement must terminate in a blocking automated gate or a named human acceptance —
never in a document.** This is restated as a hard rule in §6.4 and as `SAF-0030`.

## 3. Safety lifecycle mapped to gates G0–G8

SOURCE (`PROMPT:239-249, 251-262, 347-349, 504-515, 698-700, 744-746, 770-772, 810-828, 883-900`)
for gate definitions. The safety-activity column is PROPOSAL.

| Gate | Prompt definition (SOURCE) | Safety activity required to enter | Safety artifact produced | Accepter |
|---|---|---|---|---|
| **G0** authority & access | `PROMPT:239-249` | Name the clinical safety owner and the independent safety-case accepter; open the hazard log; register the Brazilian regulatory-applicability question as a blocker, not a default | `safety-plan.md`, `hazard-log.md` v0 (this wave) | UNASSIGNED — VALIDATION REQUIRED |
| **G1** problem & intended use | `PROMPT:251-262` | Preliminary hazard analysis bounded by the *approved* intended use; harm definitions tied to the validated care setting; "what must never be represented as normal or complete" (`PROMPT:262`) answered explicitly | Intended-use-scoped hazard set; severity scale ratified | UNASSIGNED — VALIDATION REQUIRED |
| **G2** pathway portfolio | `PROMPT:347-349` | Per-pathway hazard analysis (false-positive/false-negative harm, alert burden, overlap); no pathway becomes actionable without hazard links | Per-pathway hazard rows + residual-risk statement (input to portfolio optimizer, produced *with* it, not by safety alone) | Qualified human committee (`PROMPT:349`) |
| **G3** AMH compatibility | `PROMPT:504-515` | Data-availability hazards re-estimated against *measured* feeds, not schemas; freshness/latency hazards quantified | Updated likelihoods for HAZ-0006, HAZ-0030, HAZ-0038, HAZ-0039 | AMH + V2 owners |
| **G4** UX/domain/API coherence | `PROMPT:698-700` | Every evaluation status and degraded state has a visibly distinct, tested UI representation (`PROMPT:667-675`) | UI-state ↔ hazard traceability rows | UX acceptance owner (≠ designer, `PROMPT:203`) |
| **G5** connector conformance | `PROMPT:744-746` | Duplicate / delayed / reordered / lost / corrected / replayed scenarios exercised per connector | Connector hazard evidence slots filled | External conformance accepter |
| **G6** safety/security design | `PROMPT:770-772` | **The controlling gate for this plan.** High-severity hazards must have *implemented and verified* controls or *formally accepted* residual risk by authorized humans; threat-model P0/P1 closed or accepted; tenant isolation has adversarial evidence; privacy/legal approve data flows | Safety case at "argument complete, evidence partial" maturity | Residual-risk acceptance authority + security acceptance + privacy/legal (three distinct humans) |
| **G7** first safe vertical slice | `PROMPT:810-828` | The slice must demonstrate the failure/degraded paths, not only the happy path; missing/stale/invalid/partial behaviour is the acceptance criterion, not a stretch goal | Executable safety evidence for one loop instance | Safety-case accepter (≠ implementer) |
| **G8** pilot & production | `PROMPT:883-900` | Open hazards and accepted residual risk enumerated in the go/no-go record; kill switches and rollback authority demonstrated | Release safety-evidence bundle | Go-live authority (≠ pipeline owner, `PROMPT:205`) |

INFERENCE: G6 is where this plan's output is consumed, so hazard rows must reach
"implemented + independently verified control, or explicitly accepted residual risk"
maturity before a production-like pilot. Nothing in Wave 1 can satisfy G6.

## 4. Roles and decision rights

All roles are `UNASSIGNED — VALIDATION REQUIRED`. Naming a person is a human act; no
agent may populate these (PROMPT:27, `evidence-notation.md` §2 rule 7).

| Role | Accountable for | Explicitly may NOT |
|---|---|---|
| **Clinical Safety Owner** | The safety case as a whole; hazard-log integrity; that every open high-severity hazard is visible at every gate | Approve their own clinical content; accept residual risk they also mitigated |
| **Residual-Risk Acceptance Authority** | Formally accepting or rejecting residual risk at G6 and G8, with rationale and date | Delegate acceptance to an agent, a document, or a passing test |
| **Independent Safety-Case Accepter** | Judging whether the argument + evidence actually supports the top claim | Have implemented any safety control being argued (`PROMPT:200`) |
| **Clinical Content Approver** | Approving pathway/rule clinical content and thresholds | Be the rule author (`PROMPT:122`, `PROMPT:199`) |
| **Hazard Log Custodian** | Hazard IDs, statuses, dedup, that no hazard is silently deleted | Change a severity without the severity-ratifying authority |
| **Safety-Control Implementer(s)** | Building the `SAF-xxxx` controls | Accept the safety case (`PROMPT:200`); mark their own control "verified" |
| **Human-Factors / Alerting Lead** | Alarm burden, prioritization, explainability, acknowledgement behaviour | UX acceptance (`PROMPT:167`) |
| **Healthcare Threat-Model Specialist** | Abuse cases, trust boundaries, AI/MCP threats (Wave 2 recipient) | Security acceptance (`PROMPT:183`) |
| **Brazilian Regulatory / Legal Counsel** | Determining which frameworks actually apply (§9) | — (this is the *only* role that may close §9) |
| **Clinical Validation Biostatistician** | Study design, endpoints, calibration, subgroup analysis | Release decision (`PROMPT:166`) |

### 4.1 Decisions this plan explicitly cannot make

SOURCE (task packet `decisions_prohibited`; consistent with `PROMPT:207`):
residual-risk acceptance; hazard closure; severity sign-off; clinical content
approval. Every severity and likelihood in `hazard-log.md` is therefore labelled
**PROPOSAL** and carries no acceptance weight.

## 5. Hazard-analysis method

### 5.1 Chosen method (PROPOSAL) and justification

A **three-technique composite**, applied in this order:

1. **Structured What-If Technique (SWIFT) over each safety-loop phase P0–P7.**
   *Justification:* the loop is defined (`PROMPT:33-45`) but the implementation is not
   — there is no V2 code, schema, or architecture yet to decompose. SWIFT is the
   appropriate breadth-first technique when the design is still abstract: it needs only
   a phase decomposition and a guideword set, and it produces coverage rather than
   depth. Guidewords are taken directly from `PROMPT:45`, which is unusually
   prescriptive: *normal, missing, stale, duplicate, delayed, conflicting, corrected,
   unauthorized, disconnected, partially failed* — plus *reordered, lost, replayed*
   from `PROMPT:754-755`. Using the prompt's own condition list as the guideword set
   makes coverage auditable against the prompt rather than against this agent's
   imagination.

2. **Fault Tree Analysis (FTA) on a small set of top events.**
   *Justification:* SWIFT finds hazards but does not decompose them into the several
   independent contributors that each need their own control. The top events proposed
   for FTA are the ones where legacy evidence shows multiple simultaneous contributors:
   - TE-1 "Clinician acts on, or is reassured by, a clinical state the system had not
     validly evaluated" (contributors: zero-coercion, stale fallback, bed-severity
     flooring, missing freshness display — all four evidenced separately at
     `LEGACY-TA:306-307`, `LEGACY-TA:330`, `LEGACY-TA:469-478`, `LEGACY-TA:639-647`);
   - TE-2 "A warranted alert is never seen by a human who could act";
   - TE-3 "A clinical fact is attributed to the wrong patient / encounter / tenant";
   - TE-4 "An unapproved or withdrawn rule version evaluates a patient".
   FTA is what turns each top event into *independent* `SAF` requirements, which is
   the property legacy lacked: legacy had one documented hazard (`HAZ-030`) and no
   independent barrier behind it.

3. **STPA-style unsafe-control-action review for phases P5–P6 only.**
   *Justification:* P5–P6 is a human-in-the-loop control problem, not a component-failure
   problem. The harms there are of the form "control action provided when unsafe /
   not provided when needed / provided too late / stopped too soon" — which is exactly
   STPA's taxonomy and which FTA models poorly. `LEGACY-TA:493-495` describes precisely
   these: uncontrolled transition concurrency, absent resolve actor, no escalation
   timer, no delivery receipt, no "alert generated but not displayed" monitor. A
   component-failure technique would not have found "two clinicians acknowledge
   concurrently and one silently wins".

4. **Additional targeted technique — "absent-input probe" (PROPOSAL, novel to V2).**
   *Justification:* SOURCE `LEGACY-TA:469-478` shows the legacy defect was found by a
   *controlled pure-function check calling every scorer with all clinical inputs
   absent*. That is a cheap, mechanical, high-yield probe. This plan mandates it as a
   standing analysis obligation and as a test obligation: for every function, query,
   projection, aggregate, API response, and UI cell that can produce a clinical
   value, record what it produces when its inputs are absent, stale, or invalid — and
   assert that it is never `0`, `normal`, `no-risk`, or a silent absence. Formalized as
   `SAF-0002` and enforced by `SAF-0030`.

### 5.2 Rejected alternatives (recorded, per `PROMPT:626`)

| Alternative | Why rejected here |
|---|---|
| FMEA as the primary technique | Requires a component/failure-mode inventory that does not exist pre-architecture; risks anchoring hazard analysis to a presumed design and inheriting legacy structure — which `PROMPT:6` and `PROMPT:115` forbid |
| HAZOP with process guidewords (no/more/less/reverse) | Poor semantic fit for clinical data-quality states; the prompt already supplies a domain-correct guideword set (`PROMPT:45`) |
| Bow-tie only | Good for communication, weak for deriving independent barriers; retained as an optional *presentation* format for the safety case, not as the analysis method |
| Reusing the legacy hazard log wholesale | `PROMPT:115-116` forbids default import; legacy hazard IDs (`HAZ-030`, `HAZ-024`) are cited here as *evidence that a documented hazard was violated*, not imported as V2 hazards |

### 5.3 Guideword set (PROPOSAL)

Applied to every phase P0–P7: `normal` · `missing` · `stale` · `invalid` · `partial` ·
`duplicate` · `delayed` · `reordered` · `replayed` · `lost` · `conflicting` ·
`corrected` · `unauthorized` · `disconnected` · `partially failed` · `unevaluable`.

SOURCE for the set: `PROMPT:45` and `PROMPT:754-755`.

### 5.4 Joint hazard/threat sessions

SOURCE (`PROMPT:750`): "Perform threat modeling and hazard analysis together where
failures cross boundaries." PROPOSAL: joint sessions are mandatory for hazards tagged
`joint` in the hazard log — HAZ-0003, HAZ-0013, HAZ-0014, HAZ-0028, HAZ-0029, HAZ-0034
(the original Wave 2 handoff set), plus HAZ-0041 and HAZ-0042, which were **minted from**
the threat model and are therefore joint by origin.

**Status 2026-08-15:** the Wave 2 threat model
(`docs/11-security-privacy-compliance/threat-model.md`, THR-0001..THR-0067) has been
delivered and its THR↔HAZ links integrated (`hazard-log.md` §2.1, §4). Hazard-log gap G-1
(supply chain) is closed by linkage. **The joint sessions themselves have not occurred** —
integration of two documents is not a joint analysis session, and no session may be
recorded as held without named human participants. Still **VALIDATION REQUIRED**.

## 6. Hazard-log process

### 6.1 Identification and IDs

- IDs are `HAZ-xxxx`, 4-digit, sequential, **never reused and never deleted**. A hazard
  that turns out to be invalid is marked `WITHDRAWN` with rationale; the row stays.
- A hazard statement must be written as **condition → event → harm**. A statement that
  cannot name a harm is not a hazard; it is a defect or a risk and belongs in
  `registers/risk-register.md`.
- Every hazard must cite either a `SOURCE` (prompt section or `LEGACY-TA` line range)
  or be labelled `INFERENCE` with its reasoning chain shown.

### 6.2 Lifecycle states (PROPOSAL)

`OPEN` → `ANALYSED` → `CONTROLLED (controls specified)` → `IMPLEMENTED` →
`VERIFIED (independently)` → `CLOSED` **or** `RESIDUAL-RISK ACCEPTED`.

Rules:
- Only the Independent Safety-Case Accepter may move a hazard to `VERIFIED`.
- Only the Residual-Risk Acceptance Authority may move a hazard to
  `RESIDUAL-RISK ACCEPTED`, and must record name, date, rationale, and review trigger.
- **No agent may move a hazard past `CONTROLLED`.** Wave 1 leaves every seeded hazard
  at `OPEN`.
- A hazard may not be closed because a mitigating *document* exists. Closure requires a
  linked, executed, blocking test or a named human acceptance. (This rule exists
  because `LEGACY-TA:469-478` documents a hazard that was written down, "mitigated" in
  documentation, and violated in code.)

### 6.3 Severity and likelihood scales (PROPOSAL — not ratified)

Severity (`S`), harm to the patient, assuming the clinician relies on the system within
its intended use:

| S | Label | Definition (PROPOSAL) |
|---|---|---|
| S5 | Catastrophic | Death or permanent major harm plausible, and plausibly to more than one patient from a single failure (systemic) |
| S4 | Major | Death or permanent harm plausible to a single patient |
| S3 | Serious | Non-permanent harm requiring escalation, intervention, or prolonged stay |
| S2 | Minor | Recoverable delay, rework, or inefficiency; no lasting harm |
| S1 | Negligible | No credible patient harm |

Likelihood (`L`), **pre-control**, per deployed care unit per year, for a system that
does not yet exist:

| L | Label |
|---|---|
| L5 | Frequent — expected repeatedly in normal operation |
| L4 | Probable — expected at least once |
| L3 | Occasional — credible within the deployment life |
| L2 | Remote — requires an unusual combination |
| L1 | Improbable — requires multiple independent failures |

**Epistemic warning (INFERENCE):** V2 has no code, no architecture, and no measured
feed. Every likelihood below is a pre-control estimate reasoned from (a) whether the
failure *actually occurred in legacy* and (b) whether the prompt's non-negotiables
already forbid the enabling design. Likelihoods MUST be re-estimated against the
actual V2 design at G4 and against measured AMH feeds at G3. **VALIDATION REQUIRED.**

Risk class (PROPOSAL) = S × L band, reported as `Unacceptable` / `Undesirable` /
`Tolerable` / `Broadly acceptable`. **A risk class is a triage aid, not an acceptance.**
`Tolerable` does not mean accepted; only a named human acceptance means accepted.

### 6.4 Derivation of safety requirements

Every hazard must produce at least one `SAF-xxxx` candidate control, and each control
must declare its **barrier type** (PROPOSAL taxonomy):

| Barrier type | Meaning | Preferred where |
|---|---|---|
| `ELIM` | Eliminates the hazard by construction (the unsafe state is unrepresentable) | Always preferred — e.g. no numeric type that can hold "missing" as zero |
| `PREV` | Prevents the enabling condition (fail-closed check) | Identity, tenant, authorization |
| `DET` | Detects and surfaces the condition | Staleness, feed outage, drift |
| `MIT` | Limits harm once the condition occurs | Kill switch, rollback, degraded mode |
| `PROC` | Human procedure | Last resort; never the sole barrier for S4/S5 |

Rule (PROPOSAL): **an S4 or S5 hazard may not rely on `PROC` alone, and may not rely on
a single barrier.** INFERENCE from `LEGACY-TA:497-499`: "A disclaimer cannot compensate
for misleading `normal` state or unreliable delivery."

Rule (PROPOSAL): **every `SAF` requirement must name its verification method** —
automated test, adversarial test, measured SLI, replay corpus, human-factors study, or
named human acceptance. A `SAF` with no verification method is not a requirement.

### 6.5 Review cadence

PROPOSAL: hazard log reviewed at every gate (G1–G8); on every new pathway candidate;
on every connector change; on every safety incident; and on a fixed cadence to be set
by the Clinical Safety Owner. **VALIDATION REQUIRED** for the cadence value — this
agent will not invent a number.

## 7. Independence rules

SOURCE (`PROMPT:197-207`), applied to safety specifically:

1. **Safety-control implementer ≠ safety-case accepter.** (`PROMPT:200`) The person or
   agent that builds `SAF-0002` may not judge whether the argument for HAZ-0005 holds.
2. **Rule author ≠ clinical approver.** (`PROMPT:199`, `PROMPT:122`)
3. **Security-control implementer ≠ penetration verifier.** (`PROMPT:201`) Relevant to
   the joint hazards in §5.4.
4. **Hazard analyst ≠ residual-risk accepter.** INFERENCE from `PROMPT:207`: "Agents
   prepare evidence; qualified humans accept clinical, legal, privacy, regulatory,
   operational, and residual-risk decisions."
5. **No agent may satisfy any of these roles as a human.** Where a required approval
   would be self-approval, work stops and escalates (`PROMPT:1051`).

INFERENCE — why this is load-bearing: `LEGACY-TA:465` records that in legacy "the
validating person/institution is not independently evidenced". A sign-off artifact
existed; independence did not. V2 must therefore record *who* accepted, *what they saw*,
and *that they did not build it* — as fields, not as prose.

## 8. Safety-requirement derivation and traceability

Requirements live in `safety-requirements.md` with IDs `SAF-xxxx` and status
`PROPOSAL`. Required traceability (SOURCE `PROMPT:519-541`, `PROMPT:541`):

```text
HAZ-xxxx  →  SAF-xxxx  →  {ADR, API/EVT contract, UX state, DOM invariant}
                       →  TST-xxxx (blocking automated evidence)
                       →  VAL-xxxx (named human / empirical validation)
```

Rules:
- A `SAF` requirement with no `HAZ` parent is out of scope for this plan (it may be a
  legitimate `NFR` or `SEC` — route it there).
- A `HAZ` with no `SAF` child is an analysis defect and blocks the gate it belongs to.
- A `SAF` whose only evidence is a document is **not satisfied**.
- Every implementation PR must link the `HAZ`/`SAF`/`ADR`/`TST` it changes
  (`PROMPT:541`).

## 9. Relation to IEC 62304, ISO 14971, IEC 62366-1 — CONDITIONAL, NOT ESTABLISHED

**VALIDATION REQUIRED — this section may not be closed by any agent.**

SOURCE (`PROMPT:766`): "Do not state compliance. Have Brazilian legal/regulatory
specialists determine applicable LGPD, ANVISA/SaMD, records, localization,
professional-practice, contractual, and institutional obligations; use IEC 62304,
ISO 14971, IEC 62366-1, ISO 27001/SOC 2, HIPAA, or other frameworks **only when
applicability is established**."

SOURCE (`LEGACY-TA:529`): "No claim of LGPD, HIPAA, SOC 2, ISO 27001, IEC 62304,
ISO 14971, IEC 62366-1, or SaMD compliance is supported solely by this repository…
Applicable frameworks and classification must be determined with Brazilian
legal/regulatory counsel and the intended customers."

Therefore:

1. **This plan does not claim conformance to ISO 14971, IEC 62304, or IEC 62366-1.**
2. This plan *deliberately resembles* a risk-management-file structure (hazard log,
   risk analysis, risk controls, residual risk, traceability) so that **if** Brazilian
   regulatory analysis later establishes applicability — e.g. ANVISA software-as-a-
   medical-device classification — the artifacts can be mapped rather than rewritten.
   That is a **PROPOSAL of convenience, not a conformance claim.**
3. The following are **open questions owned by Brazilian Regulatory / Legal Counsel**,
   with no default answer:
   - Is IntensiCare V2 a medical device / SaMD under ANVISA rules, and at what class?
   - Does the advisory-only boundary (`PROMPT:127`, `PROMPT:1052`) change that answer?
   - Which of ISO 14971 / IEC 62304 / IEC 62366-1 / IEC 82304-1 apply, in which
     national-adoption version?
   - What LGPD lawful basis, retention, residency, and data-subject obligations apply
     to the ICU data flows?
   - What professional-practice (CFM/COREN) and institutional obligations attach to
     alert acknowledgment and escalation records?
4. Until those are answered, the words "compliant", "certified", "validated", and
   "safe" may not appear unqualified in any V2 artifact (`PROMPT:1061`).
5. **No agent may mark this section resolved.** If a later artifact asserts framework
   applicability without a named counsel decision, that assertion is non-conformant and
   must be rejected in review.

## 10. Relationship to other Wave artifacts

| Artifact | Relationship |
|---|---|
| `hazard-log.md` | The register this plan governs; seeded in Wave 1, all rows `OPEN` |
| `safety-requirements.md` | `SAF-xxxx` derived per §6.4; all `PROPOSAL` |
| `safety-case/safety-case-skeleton.md` | The argument structure; evidence slots deliberately EMPTY |
| `evaluation-status-semantics.md` | The semantic foundation for P4; prerequisite for HAZ-0005/0006/0040 |
| `pathway-portfolio/` | **NOT created by this agent** — reserved for the clinical pathway portfolio optimizer |
| `rule-releases/` | Not created in Wave 1; will hold signed bundle records per `PROMPT:330-345` |
| Wave 2 threat model | Receives the `joint` hazards in §5.4 |

## 11. Discrepancies recorded while reading the evidence

Per the task packet ("Verify by reading; record discrepancies"):

1. **Citation refinement — `LEGACY-TA:298-316`.** The task packet cites 298–316 for
   "missing data coerced to numeric zero/normal". Verified: lines 298–316 are the
   *Architecture–Implementation Gap Analysis* table; the relevant content is a single
   row at `LEGACY-TA:306` ("Missing data | `not evaluated`, never silent no-fire/zero |
   Missing score components contribute zero; bed severity floors normal | Direct
   contradiction with HAZ-030") plus a stale-data row at `LEGACY-TA:307`. The
   *strongest* evidence — a controlled pure-function check showing MEWS/NEWS2/SOFA/qSOFA
   all return `0` with all inputs absent — is at **`LEGACY-TA:469-478`**, which the task
   packet did not name. Hazard rows cite all three ranges.
2. **`LEGACY-TA:639-647` verified exactly as described** (IC-002, Critical/High), and it
   is the source of the *recommended* status vocabulary
   (`valid`, `partial`, `not_evaluated`, `stale`, `invalid`) at `LEGACY-TA:646` —
   i.e. the V2 evaluation-status vocabulary in `PROMPT:39` originates as a legacy
   remediation recommendation. Recorded because it means the vocabulary is a
   *proposal inherited from an assessment*, not a ratified clinical standard.
   **VALIDATION REQUIRED** before it is treated as settled.
3. **`LEGACY-TA:229-241` verified.** The contradiction is stated at `LEGACY-TA:231`
   (ADR-001 sub-30-minute Gold freshness vs. the product's sub-30-second alert
   objective) and `LEGACY-TA:239`. Corroborated independently at `PROMPT:95` (ADR-040:
   batch-first, "explicitly says the path is not near-real-time"). Two independent
   sources agree; likelihood of HAZ-0030 is raised accordingly.
4. **`LEGACY-TA:461-499` verified** and is the basis for the safety-case skeleton's
   explicit non-closure statement.
5. **`LEGACY-TA:564-602` verified.** The false-green gate is precisely at
   `LEGACY-TA:584`: "Warned all 9 domain YAML lack `alert_groups`; then 'All 0' pass —
   False-green gate; validates nothing." Corroborated at `LEGACY-TA:729-737` (IC-011).
6. **Governance dependency gap (OBSERVED).** `docs/00-governance/evidence-notation.md`
   §6 references `registers/evidence-register.md`, `assumptions-register.md`,
   `decision-register.md`, `risk-register.md`, `blockers-register.md`, and §5 references
   `traceability-policy.md`; `authority-model.md`, `decision-rights.md`, and
   `legacy-import-policy.md` are named in `PROMPT:908-913`. **None of these files exist**
   — `docs/00-governance/registers/` is empty and `evidence-notation.md` is the only
   governance file present (verified 2026-08-14 at working tree `cb35521`). This plan's
   cross-references to registers are therefore forward references to artifacts another
   specialist must create. Recorded as a dependency, not a blocker for Wave 1.
7. **No V2 source code exists** (OBSERVED: repository contains only `LICENSE`,
   `.gitignore`, the orchestrator prompt, and `docs/`). Every hazard is therefore
   anticipatory. Nothing in the hazard log is an observation of V2 behaviour.

## 12. Stop conditions for this plan

Escalate to a named human, per `PROMPT:1041-1052`, when: a hazard's harm cannot be
characterized without clinical input; a control would require accepting residual risk;
a required approval would be self-approval; regulatory applicability blocks a design
decision; or an artifact asserts a closed hazard without linked executed evidence.
