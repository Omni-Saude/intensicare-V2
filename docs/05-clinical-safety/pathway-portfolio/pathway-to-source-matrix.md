---
doc_id: PORT-PATHWAY-SOURCE-MATRIX-HUMAN
title: IntensiCare V2 — Pathway-to-Source Eligibility Matrix (human-readable)
status: PROPOSAL
label: PROPOSAL
owner: UNASSIGNED — VALIDATION REQUIRED
approver_role: AUTH-CLINSAFETY + AUTH-DATA-PLATFORM (docs/00-governance/authority-model.md:28,31)
validation_status: VALIDATION REQUIRED
source: INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §7.2 (lines 397-420); docs/08-interoperability/amh-data/compatibility-finding.md; docs/08-interoperability/amh-data/contracts.lock.draft.yaml
date_collected: 2026-08-14
last_updated: 2026-08-14
collector: clinical pathway portfolio optimizer (candidate inventory / source-eligibility phase)
machine_readable_companion: pathway-to-source-matrix.yaml
provenance:
  source_repo: intensicare-V2
  path_or_url: docs/05-clinical-safety/pathway-portfolio/pathway-to-source-matrix.md
  commit_sha_or_version: uncommitted (working tree at cb35521)
  section_or_lines: whole document
  date_collected: 2026-08-14
  collector: clinical pathway portfolio optimizer
  transformation: >
    Human rendering of pathway-to-source-matrix.yaml. The YAML is normative for
    all twenty PROMPT:401-410 fields; this file adds grouping and commentary and
    omits nothing material.
  confidence: medium
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  requirements: []
  hazards: []
  adrs: []
  tests: []
  pr: null
supersedes: null
superseded_by: null
---

# Pathway-to-Source Eligibility Matrix — human-readable

> ## Result
>
> **25 input rows. 0 eligible. 25 `INELIGIBLE_FOR_ACTIONABLE_EVALUATION`.**
>
> `PROMPT:420`: "Use this matrix as a **hard input** to the pathway portfolio optimizer."
> Its hard input today is that **no candidate has a single eligible input**.

**`pathway-to-source-matrix.yaml` is normative.** This file renders the same 25 rows and the
same twenty `PROMPT:401-410` fields for human review. Where the two disagree, the YAML wins
and this file is a defect.

## 0. Four things to know before reading a single row

1. **The input lists are PROPOSALS, not legacy content.** The legacy technical assessment
   documents **zero** inputs, codes, units, windows, thresholds or bands for any score
   (`candidate-inventory.md` INV-GAP-4 — verified: the strings `SpO2`, `oxygen`, `GCS` and
   `Glasgow` do not occur anywhere in it). The input concepts here are restated from the
   published instruments' generally known composition and require ratification by
   `AUTH-CLINSAFETY` against each instrument's authoritative specification. **They are not
   imported from legacy code, YAML, or rule definitions** (`legacy-import-policy.md` §1).
2. **No threshold, band, cut-point, weight or recommendation appears anywhere in this
   directory.** Those are clinical content; approving them is outside this phase and
   importing them is forbidden.
3. **No clinical code is fabricated.** Every code/value-set cell reads `NOT_SPECIFIED`. No
   terminology server was verified and LOINC/UCUM releases are unpinned
   (`contracts.lock.draft.yaml:165-167`). Inventing a plausible-looking LOINC code would be
   fabricated evidence.
4. **"A profile exists" is not evidence** (`PROMPT:414`). Rows backed by a *declared* AMH
   profile are still ineligible, because declared contract is evidence Layer 1 and Layers
   2–4 have **no evidence** (`contracts.lock.draft.yaml:461-479`).

---

## 1. Which of the twenty fields vary, and which are constant across all 25 rows

This table is the fastest honest summary of the matrix's state, and it is the reason 25
near-identical per-row tables are not reproduced here.

| # | `PROMPT:401-410` field | Varies? | Constant value where constant |
|---|---|---|---|
| 1 | pathway / version | **varies** | — (but **every** version reads `NO VERSION` — no V2 rule bundle exists) |
| 2 | input concept | **varies** | — |
| 3 | mandatory / optional | no | `MANDATORY` — all 25 |
| 4 | clinical code / value set | no | `NOT_SPECIFIED` — all 25 (R9) |
| 5 | expected unit + conversion policy | **varies** (unit) | conversion policy `NOT DEFINED` — all 25 |
| 6 | patient / encounter / tenant scope | no | unresolved for all 25 (CTX-01/02/03; R8) |
| 7 | source system + authoritative AMH contract | **varies** | — |
| 8 | AMH artifact version / digest | **varies** | `package_digest: null` wherever a package is named |
| 9 | resource / table / event + field path | **varies** | — |
| 10 | source/observed/issued/received/available times | no | `NOT DEFINED` — all 25 |
| 11 | freshness window + measured latency percentiles | no | **no window and no measurement — all 25** (R5, R6) |
| 12 | tenant / facility coverage | no | `UNKNOWN` or `N/A` — all 25 (R11) |
| 13 | population + null/invalid distributions | **varies** | `UNKNOWN` for 21; **measured ZERO** for the 4 laboratory rows |
| 14 | provenance | no | none beyond Layer-1 declaration — all 25 |
| 15 | duplicate / order / correction / cancellation | no | `UNDEFINED` — all 25 (R10) |
| 16 | confidence | no | `LOW` for the 3 context rows, `HIGH` for the 22 candidate rows — *confidence in the **ineligibility finding***, not in the input |
| 17 | owner | no | `UNASSIGNED — VALIDATION REQUIRED` — all 25 |
| 18 | conformance evidence | no | `NONE` — all 25 |
| 19 | unresolved gap | **varies** | — (the most information-dense column; §4) |
| 20 | eligibility decision | no | `INELIGIBLE_FOR_ACTIONABLE_EVALUATION` — all 25 |

**Fourteen of twenty fields are constant across every row.** **INFERENCE:** the matrix is not
recording a set of inputs at differing readiness levels; it is recording a **uniformly absent
input contract**. That is a materially different finding from "some inputs need work", and it
should be read as such by anyone planning a schedule.

---

## 2. Ineligibility reason codes

Full text in the YAML (`ineligibility_reason_codes`). Summarized:

| Code | Reason | Rows citing it as an independent ground |
|---|---|:--:|
| **R1** | Vital signs **structurally excluded** — the AMH IG's only Observation profile pattern-fixes `category` to `laboratory`; a conformant instance *cannot* carry vitals | 12 |
| **R2** | Laboratory Observation **blocked at an empty source** — `bloqueado por falta de dado, não por código`; `PACIENTE_EXAME` returned **0 rows**; the structured LIS source is not ingested | 4 |
| **R3** | The **unblocking plan is non-conformant** — it would emit `valueString` free text, not a LOINC-coded UCUM quantity (contradiction C-4) | 4 |
| **R4** | **No contract identified at all** — not blocked, *absent* from the inventory | 9 |
| **R5** | **No freshness policy** — no per-input window, no invalidate-vs-degrade rule (VAL-0023) | 21 |
| **R6** | **No measured latency** — every AMH latency figure is a target or a bulk-write throughput, never a consumer read-path measurement | 1 |
| **R7** | **No population measurement** — Layer 3 `NO_OBSERVED_EVIDENCE`, Layer 4 `NO_EVIDENCE` | 20 |
| **R8** | **Identity / tenancy unresolved** — the ADR-006 / ADR-039 / ADR-041 / IG conflict | 3 |
| **R9** | **No terminology pin** — no server, no expansion, LOINC/UCUM unpinned | 17 |
| **R10** | **No correction semantics** — duplicate/order/correction/cancellation undefined | 9 |
| **R11** | **No environment** — only `dev` exists; production-like conformance testing is impossible for anyone | 3 |
| **R12** | **No clinical source concept** — the input is a judgement or bedside assessment with no machine source anywhere | 6 |

**Counting rule (matters — do not read these numbers as the whole story):** a code is counted
only where it is an **independent, decisive** ground. R5, R6, R7 and R10 are recorded in the
corresponding *field* of **every** row — no row anywhere has a freshness window, a latency
measurement, a population measurement, or defined correction semantics. They are listed as
formal grounds only where they add something the absence of a source does not already entail.

---

## 3. The rows

Fields constant across a candidate are stated once in that candidate's header block; only
genuinely varying fields appear per row. This is a faithful rendering, not an abridgement —
every one of the twenty fields is accounted for, here or in the constant block of §1.

### 3.1 Shared context inputs — required by every candidate (CTX-01 … CTX-03)

**Constant for this group:** mandatory; code/value set `NOT_SPECIFIED`; conversion policy not
defined; times not defined; no freshness window; no latency measurement; provenance Layer-1
declared only; duplicate/order/correction **undefined**; confidence **LOW**; owner
`UNASSIGNED — VALIDATION REQUIRED`; conformance evidence **NONE**; eligibility
**INELIGIBLE**.

| Row | Input concept | Source + authoritative AMH contract | Artifact version / digest | Field path | Coverage / population | Unresolved gap | Reasons |
|---|---|---|---|---|---|---|---|
| **CTX-01** | Patient identity + date of birth / age at encounter (**required to enforce the approved population boundary**) | AMH FHIR R4 IG **Patient profile — declared**. No AMH×IntensiCare contract exists (`schemas/contracts/` has no `intensicare/` path) | `br.com.americashealth.fhir` v1.0.0, FHIR 4.0.1, `ig_status: active`; **`package_digest: null`** | `Patient.identifier` / `Patient.birthDate` — no agreed consumer path | No tenant designated; population unmeasured | Population enforcement is a **BLOCKING** intended-use decision (IU-06, VAL-0006/0007) **and** has no trusted source → candidate hazard **PH-11** | R7, R8, R10, R11 |
| **CTX-02** | Encounter / episode of care, incl. unit and bed location | AMH FHIR R4 IG **Encounter / Location / Organization — declared** | as CTX-01 | `Encounter.*` / `Location.*` | Unmeasured — **and a documented negative: 52,452 clinical rows reference absent encounters** due to ingestion skew (`HAZ-0038`) | **Bed/unit assignment has no verified source** — the legacy unit filter matched name/pathway strings, returning semantically incorrect results (`HAZ-0004`). Without a trusted unit/bed link, an alert has no destination | R7, R8, R10, R11 |
| **CTX-03** | Tenant / organization context — the authorization and isolation boundary | AMH HAPI partition model — URL partition + mandatory token-tenant equality, 403 on divergence, cross-partition references disabled | pinned commit `0a07a6f1…`; no versioned consumer contract | HAPI partition URL + token tenant claim | **No tenant designated for V2** | Contradiction **C-2** (authentication) is three-way and unresolved — a consumer cannot choose client behaviour against three positions | R8, R11 |

**Note on CTX-01 / CTX-02 — the only structurally hopeful rows in the matrix.** These rest on
**declared, existing** AMH profiles rather than absent ones. Their ineligibility is about
unmeasured population and unresolved identity, not about a contract that does not exist.
**INFERENCE:** if any part of this matrix becomes eligible first, it will be these two — and
notably, **neither is a clinical measurement**. That is a sobering shape for a clinical
portfolio.

### 3.2 CAND-0001 — NEWS2 (7 rows)

**Constant for this candidate:** pathway version `NO VERSION`; all inputs **mandatory**;
code/value set `NOT_SPECIFIED`; conversion policy not defined; scope per CTX-01/02/03 (all
unresolved); artifact version **N/A — no contract to version**; field path **N/A**; times
**N/A — no source**; no freshness window, no latency measurement; coverage **N/A**;
population **N/A**; provenance **N/A**; duplicate/order/correction **UNDEFINED**; confidence
**HIGH** (in the ineligibility finding); owner `UNASSIGNED — VALIDATION REQUIRED`;
conformance evidence **NONE**; eligibility **INELIGIBLE**.

| Row | Input concept (PROPOSAL) | Unit (UCUM, PROPOSAL) | Source | Unresolved gap | Reasons |
|---|---|---|---|---|---|
| **NEWS2-01** | Respiratory rate | `/min` | **NONE** (R1) | Contradiction **C-1** — AMH diagrams assert vital signs (`Observation para sinais vitais`, `sinais vitais de dispositivos IoT`) while the IG structurally excludes them. **Preserved for AMH owners; not resolved here.** | R1, R5, R6, R7, R9, R10 |
| **NEWS2-02** | Oxygen saturation | `%` | **NONE** (R1) | NEWS2 is published with **two saturation scales** whose selection depends on a patient-level clinical determination. **No source for that determination exists.** Defaulting to one scale would silently alter the clinical definition — forbidden by `PROMPT:418` | R1, R5, R7, R9, R12 |
| **NEWS2-03** | Supplemental-oxygen status / delivery | categorical | **NONE — absent, not blocked** (R4) | Not a vital sign, so not blocked by R1 — simply absent from every inventoried contract. **Separate evidence question, recorded not graded:** in a population where supplemental oxygen is near-universal, this component's discriminatory value may differ from the ward populations the instrument is usually described in | R4, R5, R7, R9 |
| **NEWS2-04** | Body temperature | `Cel` | **NONE** (R1) | Measurement-site semantics (oral / axillary / core) would be mandatory even if a source existed; no contract carries them | R1, R5, R7, R9 |
| **NEWS2-05** | Systolic blood pressure | `mm[Hg]` | **NONE** (R1) | **Invasive vs. non-invasive method provenance is not distinguished by any contract, and in ICU both coexist for one patient.** Conflicting simultaneous arterial-line and cuff values are a foreseeable conflict with no defined resolution — `PROMPT:1058` forbids silent resolution, and most-recent-wins is silent resolution wearing an algorithm (VAL-0022) | R1, R5, R7, R9, R10 |
| **NEWS2-06** | Pulse / heart rate | `/min` | **NONE** (R1) | Monitor-derived heart rate and manually recorded pulse are different concepts with different reliability; no contract distinguishes them | R1, R5, R7, R9 |
| **NEWS2-07** | Level of consciousness | categorical/ordinal | **NONE — a bedside assessment with no machine source** (R4/R12) | **ICU validity question:** in a sedated or ventilated patient this component may reflect sedation rather than neurological deterioration. Recorded for the clinical evidence methodologist; **not graded here.** Applies equally to MEWS-05, QSOFA-03, SOFA-05 | R4, R5, R7, R12 |

### 3.3 CAND-0002 — MEWS (5 rows)

**Constant for this candidate:** as CAND-0001.

| Row | Input concept (PROPOSAL) | Unit (UCUM, PROPOSAL) | Source | Shared with | Reasons |
|---|---|---|---|---|---|
| **MEWS-01** | Systolic blood pressure | `mm[Hg]` | **NONE** (R1) | NEWS2-05, QSOFA-02 | R1, R5, R7, R9 |
| **MEWS-02** | Pulse / heart rate | `/min` | **NONE** (R1) | NEWS2-06 | R1, R5, R7, R9 |
| **MEWS-03** | Respiratory rate | `/min` | **NONE** (R1) | NEWS2-01, QSOFA-01 | R1, R5, R7, R9 |
| **MEWS-04** | Body temperature | `Cel` | **NONE** (R1) | NEWS2-04 | R1, R5, R7, R9 |
| **MEWS-05** | Level of consciousness | categorical/ordinal | **NONE** (R4/R12) | NEWS2-07, QSOFA-03, SOFA-05 — **but each published instrument specifies a *different* scale** | R4, R5, R7, R12 |

**Unresolved gap for the group:** every MEWS input is shared with at least one other
candidate. **A single source failure disables three candidates simultaneously** — which is
also why their alert behaviour would be correlated (`candidate-inventory.md` §3).
**MEWS-05 specifically:** four candidates need a consciousness assessment and each specifies a
different scale; **mapping between them to save a source would silently alter each clinical
definition** (`PROMPT:418`). Recorded, not resolved.

### 3.4 CAND-0004 — qSOFA (4 rows)

**Constant for this candidate:** as CAND-0001.

| Row | Input concept (PROPOSAL) | Unit (UCUM, PROPOSAL) | Source | Unresolved gap | Reasons |
|---|---|---|---|---|---|
| **QSOFA-01** | Respiratory rate | `/min` | **NONE** (R1) | shared with NEWS2-01, MEWS-03 | R1, R5, R7, R9 |
| **QSOFA-02** | Systolic blood pressure | `mm[Hg]` | **NONE** (R1) | shared with NEWS2-05, MEWS-01 | R1, R5, R7, R9 |
| **QSOFA-03** | Altered mentation | categorical/ordinal | **NONE** (R4/R12) | see MEWS-05 — scales must not be silently mapped | R4, R5, R7, R12 |
| **QSOFA-04** | **Suspected infection — the published GATING CONDITION, not one of the three components** | boolean clinical judgement | **NONE.** A Condition resource, an antimicrobial order or a culture order are **proxies, not the concept**; substituting one is a silent alteration of the clinical definition (R12) | **The most important single row for CAND-0004.** Running the instrument on an undifferentiated ICU population without this gate is a **different pathway requiring separate evidence** (`PROMPT:418`), not a configuration of this one. Candidate hazard **PH-04** | R4, R12, R7 |

### 3.5 CAND-0003 — SOFA (6 rows, one per organ component)

**Constant for this candidate:** pathway version `NO VERSION`; all components **mandatory**;
code/value set `NOT_SPECIFIED`; scope per CTX-01/02/03; no freshness window; no latency
measurement; coverage `UNKNOWN`; provenance none; duplicate/order/correction **UNDEFINED**;
confidence **HIGH**; owner `UNASSIGNED — VALIDATION REQUIRED`; conformance evidence **NONE**;
eligibility **INELIGIBLE**.

| Row | Component (PROPOSAL) | Unit / conversion | Source + AMH contract | Population at source | Unresolved gap | Reasons |
|---|---|---|---|---|---|---|
| **SOFA-01** | Respiratory — arterial oxygenation ratio (blood-gas-derived) **+** respiratory-support status | `mm[Hg]` + dimensionless fraction; **ratio derivation policy NOT DEFINED** | Lab half → `Observation-amh-laboratory` v1.0.0, **BLOCKED**; declared source `bronze_diagnose.diagnose_exame_resultado` is **not ingested**. Support half → **no contract at all** | **MEASURED ZERO** — `PACIENTE_EXAME` returned 0 rows | **Specimen-collection time vs. result-issue time** is a clinically material distinction no contract carries. Blood gases and continuous vitals have different cadences → candidate hazard **PH-03** | R2, R3, R4, R5, R9, R10 |
| **SOFA-02** | Coagulation — platelet count | count-per-volume; **exact unit and conversion must be ratified, not guessed** | `Observation-amh-laboratory` — **BLOCKED** (R2), non-conformant unblocking plan (R3) | **MEASURED ZERO** | C-4 | R2, R3, R5, R9, R10 |
| **SOFA-03** | Hepatic — bilirubin | **NOT DEFINED — Brazilian laboratories commonly report mass-per-volume while some published tables use molar units. A conversion policy is MANDATORY and does not exist; silent mis-conversion is `HAZ-0032`** | `Observation-amh-laboratory` — **BLOCKED**, non-conformant plan | **MEASURED ZERO** | **Unit-system conversion is the specific risk on this row**, over and above C-4 | R2, R3, R5, R9, R10 |
| **SOFA-04** | Cardiovascular — mean arterial pressure **+** vasoactive-agent exposure, agent identity **and** weight-normalised dose rate | `mm[Hg]` + a weight-normalised dose-rate unit; **dose-rate conversion and body-weight sourcing NOT DEFINED** | Pressure → **NONE** (R1). Vasoactive → **no medication-administration contract, no dose granularity, no infusion-rate representation, no body-weight source** (R4) | N/A | **The most compound row in the matrix** — four sub-inputs across three contract families, none with an authoritative populated source. **An infusion is an interval, not an instant, and no contract carries interval semantics. Even a full AMH Observation unblock would not make this row eligible.** | R1, R4, R5, R7, R9, R10 |
| **SOFA-05** | Neurological — consciousness assessment | ordinal | **NONE** (R4/R12) | N/A | Sedation confounding (see NEWS2-07) applies **with particular force** to an organ-failure instrument | R4, R5, R7, R12 |
| **SOFA-06** | Renal — creatinine **and/or** urine output over a defined interval | creatinine carries the same mass-vs-molar risk as SOFA-03; **urine output requires a volume over an interval, not an instantaneous value** | Creatinine → `Observation-amh-laboratory`, **BLOCKED**, non-conformant plan. Urine output → **no contract; fluid balance is a nursing-record concept absent from every inventoried contract** | **MEASURED ZERO** (laboratory half) | **Choosing between the two alternatives because only one is available would change the instrument's behaviour.** `PROMPT:418` — define a safe subset as a separately evidenced pathway or return `partial` / `not_evaluated`; never silently alter the definition | R2, R3, R4, R5, R9, R10 |

### 3.6 Candidates contributing **no** rows — and why that is a finding

| Candidate | Why no rows | What would produce rows |
|---|---|---|
| **CAND-0005** ventilator (stub) | **No inputs are documented.** The legacy assessment names it once, to record that it is a stub (`LEGACY-TA:117`). A row set would have to be **invented**. | A clinical definition authored by a named clinical owner — backlog **G2-VAL-0006** |
| **CAND-0006** 11 unnamed pathways | **Unenumerated** (INV-GAP-1). Their inputs cannot be listed because the pathways themselves are never named. | A scoped read-only enumeration pass, with provenance, **no content import** — backlog **G2-VAL-0002** |
| **CAND-0007** 959-rule catalog | **Unenumerated** (INV-GAP-2). No cluster and no rule is named or described anywhere. | Enumeration, then clinical triage — backlog **G2-VAL-0003**. Enumeration is *necessary but not sufficient* (`LEGACY-TA:881`) |
| **CAND-0008** score alert rules | **Has no external source inputs.** Its input is a V2-internal *(value, evaluation-status)* pair; it inherits the eligibility of the scores it consumes and **cannot be more eligible than the least eligible of them.** | N/A — governed by `evaluation-status-semantics.md`, not by a source contract |
| **CAND-0009** bed-grid severity | Classified **REJECT** as a pathway candidate. Its inputs are V2-internal results plus bed/unit assignment (CTX-02, no verified source). | N/A — to be specified as a V2 status-rendering requirement, not a pathway |

**Empty is a result.** Recording these as empty is the honest outcome; inventing rows for them
would be fabrication and is the specific thing this phase's stop condition forbids.

---

## 4. Aggregate findings

| # | Finding |
|---|---|
| **F-1** | **No row fails for exactly one reason.** The median row cites four to six independent grounds. **INFERENCE:** unblocking AMH Observation would be *necessary* but nowhere near *sufficient* — freshness policy, correction semantics, terminology pinning and population measurement are V2-side or joint obligations that no AMH act closes. |
| **F-2** | **No row anywhere has a defined freshness window or defined correction semantics — 25 of 25.** Both are largely within this programme's control (freshness is OPEN as VAL-0023). **They are the largest body of eligibility work that is not blocked on an AMH-owner act**, and can begin as soon as `AUTH-CLINSAFETY` is named. |
| **F-3** | The two rows resting on **declared** AMH profiles (CTX-01 Patient, CTX-02 Encounter) are the only ones whose ineligibility is about *unmeasured population and unresolved identity* rather than a *structurally missing contract*. If anything becomes eligible first, it will be these — and neither is a clinical measurement. |
| **F-4** | **Twelve rows fail on R1**, a constraint closable only by AMH authoring, publishing, versioning **and populating** a new vital-signs profile — `AMH-CF §3.2`: "not a reuse, not a configuration change, not a mapping." |
| **F-5** | **Six rows fail on R12** — the input is a clinical judgement or bedside assessment (consciousness ×4, infection suspicion, supplemental-oxygen status) with **no machine source anywhere**. **INFERENCE: even a complete AMH vitals-and-labs feed would leave these six unsourced.** Any plan resting on "AMH will eventually supply the inputs" is wrong for roughly a quarter of the matrix. |
| **F-6** | **The four laboratory rows carry the only *measured* population figure in the entire matrix, and it is zero** (`PACIENTE_EXAME` — 0 rows). Everywhere else the population is simply unknown. **INFERENCE:** SOFA is simultaneously the best-evidenced ineligibility and the worst-sourced candidate. |

---

## 5. What this matrix does **not** establish

1. **It does not select or rank any pathway.** That is Gate G2 and requires ratified weights and named owners.
2. **It does not grade clinical evidence** for any candidate. That is the clinical evidence methodologist's task.
3. **It does not declare AMH incompatible.** `AMH-CF §7` is explicit: the finding "is a status report on evidence, not a verdict on AMH", and AMH is affirmed an **integration candidate**.
4. **It does not resolve contradictions C-1 … C-4.** They are recorded with both sides intact and reserved for AMH owners.
5. **It is not complete.** CAND-0006 and CAND-0007 contribute no rows because they are unenumerated. **Absent rows are an inventory gap, not an eligibility finding.**
6. **It is not permanent.** `PROMPT:420` makes it a hard input to the optimizer; it **must** be re-verified at the execution commit and revised on new evidence. A stale eligibility matrix used to justify a portfolio is exactly the failure `PROMPT:414` warns against.

## 6. Cross-references

- `pathway-to-source-matrix.yaml` — **normative**; all twenty fields, all 25 rows.
- `candidate-inventory.md` — the candidates and the inventory gaps.
- `hard-gate-assessment.md` — gate 4 verdicts rest on this matrix.
- `portfolio-method.md` — criterion 5 (source-data readiness) is scored from this matrix.
- `../../08-interoperability/amh-data/compatibility-finding.md` — the hard portfolio constraint.
- `../../08-interoperability/amh-data/contracts.lock.draft.yaml` — the pinned AMH artifacts.
