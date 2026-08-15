---
doc_id: PORT-CANDIDATE-INVENTORY
title: IntensiCare V2 — Clinical-Pathway Candidate Inventory
status: PROPOSAL
label: PROPOSAL
owner: UNASSIGNED — VALIDATION REQUIRED
approver_role: AUTH-CLINSAFETY (docs/00-governance/authority-model.md:28)
validation_status: VALIDATION REQUIRED
source: INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §6.1 (lines 268-285), §6.2 (287-303), §7.2 (397-420); legacy INTENSICARE_TECHNICAL_ASSESSMENT.md (READ-ONLY, risk-informed input, not authority)
date_collected: 2026-08-14
last_updated: 2026-08-14
collector: clinical pathway portfolio optimizer (candidate inventory / source-eligibility phase)
provenance:
  source_repo: intensicare-V2
  path_or_url: docs/05-clinical-safety/pathway-portfolio/candidate-inventory.md
  commit_sha_or_version: uncommitted (working tree at cb35521)
  section_or_lines: whole document
  date_collected: 2026-08-14
  collector: clinical pathway portfolio optimizer
  transformation: >
    Candidates enumerated by exhaustive reading of the legacy technical assessment.
    Legacy content is REFERENCED with path+line provenance per
    docs/00-governance/legacy-import-policy.md; no legacy rule logic, threshold,
    band, predicate, or YAML content was read, copied, or imported.
  confidence: medium
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
evidence_inputs:
  - repo: intensicare (legacy, READ-ONLY, risk-informed input NOT authority)
    path: INTENSICARE_TECHNICAL_ASSESSMENT.md
    commit: 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79
    branch: chore/v3-wip-landing
    lines_used: "21, 26, 31, 33, 39, 42, 108-109, 113, 117, 125-126, 143-147, 181-182, 233, 252, 261, 276-295, 308, 315, 322, 324, 328, 330, 345, 348, 455, 459, 465, 469-499, 570-602, 719-727, 729-737, 769-777, 813-814, 828-830, 847, 857, 881, 993-1010, 1037-1048, 1079-1084, 1095"
  - repo: intensicare-V2
    path: docs/08-interoperability/amh-data/compatibility-finding.md
    lines_used: "59-95, 99-134, 168-180"
  - repo: intensicare-V2
    path: docs/01-vision-and-intended-use/intended-use-statement.md
    lines_used: "133-243, 279-338, 340-371"
  - repo: intensicare-V2
    path: docs/02-users-and-workflows/g1-validation-backlog.md
    lines_used: "79-83, 93-98, 122-131, 165-170, 178-182"
  - repo: intensicare-V2
    path: docs/05-clinical-safety/hazard-log.md
    lines_used: "109-115, 181-196"
links:
  requirements: []
  hazards: []
  adrs: []
  tests: []
  pr: null
supersedes: null
superseded_by: null
---

# IntensiCare V2 — Clinical-Pathway Candidate Inventory

> **STATUS: PROPOSAL. NOTHING HERE IS SELECTED, APPROVED, OR IMPORTED.**
>
> This is an *inventory of candidates*, produced under `INTENSICARE_V2_ORCHESTRATOR_PROMPT.md`
> §6.1. Per `PROMPT:266`: "Do not begin with the legacy count of 12 pathways, the documented
> catalog of 959 rules/27 clusters, or any predetermined target. Treat all legacy content as
> candidates." **No portfolio is selected in this document or in this phase.** Selection
> requires ratified MCDA weights and named human owners and is gated at G2
> (`PROMPT:347-349`). Both preconditions are unmet.

## 0. How to read this document

### 0.1 Labels

Every material statement carries exactly one evidence label per
`docs/00-governance/evidence-notation.md:27-34`. **No statement in this document carries
the label `DECIDED`.**

### 0.2 Citation shorthand

| Token | Resolves to |
|---|---|
| `LEGACY-TA:n` | `/Users/familia/intensicare/INTENSICARE_TECHNICAL_ASSESSMENT.md` line *n*, READ-ONLY. Risk-informed input, **not authority** (`PROMPT:72`). See the provenance caveat below. |
| `PROMPT:n` | `/Users/familia/code/intensicare-V2/INTENSICARE_V2_ORCHESTRATOR_PROMPT.md` line *n*. |
| `AMH-CF §n` | `docs/08-interoperability/amh-data/compatibility-finding.md` section *n*. |

**Provenance precision — OBSERVED 2026-08-14, and it matters.** The legacy assessment is an
**untracked working-tree file**: `git ls-files --error-unmatch` reports it is not known to
git, and it has no commit history. It is therefore **not** contained in commit
`1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79`; that SHA is only the legacy repository's `HEAD`
(branch `chore/v3-wip-landing`) **at the moment of reading**. Every `LEGACY-TA:n` citation in
this directory means *"line n of the working-tree copy read on 2026-08-14, while legacy HEAD
was 1dc1ea6c…"* — **not** *"line n of that file at that commit."* An uncommitted evidence
source cannot be re-verified by SHA, so **line numbers may drift without any recorded change**.
Any future re-verification must re-read the file and re-locate the quoted text, not trust the
line numbers alone. Recorded because sibling artifacts in this repository cite the same file
with the same SHA in a form that could be read as commit-contained.

### 0.3 ID convention — read this before citing an ID elsewhere

`CAND-nn` anchors are **document-local reference handles for review, not catalog IDs**.
`docs/00-governance/traceability-policy.md:21-39` declares the ID taxonomy exhaustive and
forbids a specialist inventing a new prefix without an ADR. `CAND` is not in that taxonomy.
Any candidate that survives to a clinical requirement must be re-issued a `CLR-nnnn` ID by
the traceability owner. The same applies to the `PH-nn` candidate-hazard handles in §5 —
they are **not** `HAZ-nnnn` allocations. This mirrors the precedent set in
`docs/01-vision-and-intended-use/intended-use-statement.md:46-48`.

### 0.4 What was and was not read

**OBSERVED, and load-bearing.** This agent read the legacy **assessment document only**. It
did **not** open any legacy source file, pathway YAML, rule definition, scoring table, test
vector, or clinical sign-off artifact. Every legacy statement below is a statement about
*what the assessment says*, never about what the legacy code does. Per
`docs/00-governance/legacy-import-policy.md:17-37`, the default is **do not copy**; this
inventory is a reference-with-provenance record and contains **no legacy rule content** —
no threshold, band, predicate, weight, cut-point, recommendation text, or YAML fragment.

---

## 1. What the legacy assessment actually documents — and what it does not

This section is the honest answer to the task's stop condition
(*"if the legacy assessment lacks pathway detail, inventory what IS documented and record
the gap — do not fabricate candidates"*). **The stop condition is met: the assessment counts
pathways and rules but does not enumerate them.**

### 1.1 What IS documented

| # | Documented item | Evidence |
|---|---|---|
| 1.1a | Four clinical scores, **named**: MEWS, NEWS2, SOFA, qSOFA. | **SOURCE** `LEGACY-TA:108` ("Versioned deterministic MEWS/NEWS2/SOFA/qSOFA"); `LEGACY-TA:181`; `LEGACY-TA:283`; `LEGACY-TA:473-476`; `LEGACY-TA:828`. |
| 1.1b | **Twelve** pathway definitions loaded and active at the assessment commit, with zero compile failures. **Counted, not named.** | **SOURCE** `LEGACY-TA:482` ("The pathway engine loaded 12 definitions, all active, with zero compile failures in a controlled check"); `LEGACY-TA:583`; `LEGACY-TA:1084`. |
| 1.1c | Structural pathway-gate statistics: 12 paths, 118 units, 38 band sets, 58 predicates, 2 rationale records. **Counted, not named.** | **SOURCE** `LEGACY-TA:582`; `LEGACY-TA:1079`. |
| 1.1d | Exactly **one** pathway named anywhere in the assessment: the **ventilator pathway**, described as a **stub**. | **SOURCE** `LEGACY-TA:117` ("The ventilator pathway is explicitly described as a stub (`README.md:162`)"). |
| 1.1e | A domain-rule catalog of **959 documented extracted rules across 27 clusters**. **Counted, not named; no cluster is named.** | **SOURCE** `LEGACY-TA:33`; `LEGACY-TA:772`. |
| 1.1f | Score-derived alert rules exist (score → alert evaluation, with severity, cooldown, grouping). **Counted, not specified.** | **SOURCE** `LEGACY-TA:146`; `LEGACY-TA:494`. |
| 1.1g | A bed-grid severity derivation exists that floors an unscored bed to `normal`. | **SOURCE** `LEGACY-TA:143`; `LEGACY-TA:330`; `LEGACY-TA:478`. |
| 1.1h | Nine domain YAML files exist and **all nine lack `alert_groups`**; the vector-coverage gate then reported "All 0" pass. | **SOURCE** `LEGACY-TA:584` ("False-green gate; validates nothing"). |

### 1.2 What is NOT documented — declared gaps

**OBSERVED (2026-08-14, by exhaustive case-insensitive whole-word search of
`INTENSICARE_TECHNICAL_ASSESSMENT.md` at the pinned commit):**

| Gap | Finding |
|---|---|
| **INV-GAP-1** | **Eleven of the twelve pathways are never named.** Only the ventilator stub (`LEGACY-TA:117`) is identified. The other eleven exist in the assessment only as a count. |
| **INV-GAP-2** | **None of the 27 rule clusters is named, and none of the 959 rules is described.** The assessment's own disposition for the catalog is `**Investigate**` (`LEGACY-TA:847`), with the reason "High domain value potential; requires provenance, clinical prioritization, schema normalization, and real data coverage." |
| **INV-GAP-3** | The words **`sepsis` / `sepse`, `delirium`, `acute kidney injury`, `Glasgow`, `GCS`, `SpO2`, and `oxygen` do not appear anywhere in the assessment** (0 whole-word matches each). **INFERENCE:** the illustrative list in this phase's task packet and in `PROMPT:416` ("NEWS2, MEWS, SOFA, qSOFA, sepsis, respiratory, renal") must **not** be read as a list of legacy candidates. A sepsis, respiratory, or renal pathway is **not** documented in the legacy evidence. **No such candidate is inventoried here, because inventorying one would be fabrication.** |
| **INV-GAP-4** | **The assessment does not document a single input, code, unit, time window, exclusion, contraindication, threshold, band, or recommendation for any of the four named scores.** It documents only their names, their determinism, their version strings, and their missing-data defect. Therefore **every input row in `pathway-to-source-matrix.yaml` is a PROPOSAL restated from the published instruments' generally known input concepts, and is NOT sourced from legacy content** — see §4 of that file. |
| **INV-GAP-5** | The assessment documents **no clinical evidence grade, guideline citation, or validation study** for any candidate. It records the opposite: "Several guideline references are documented as weak or pending refinement" (`LEGACY-TA:489`), and that the clinical sign-off "honestly records that the approver's CRM/institution is not verifiable and formal statistical validation remains pending" (`LEGACY-TA:125`, `LEGACY-TA:465`). |
| **INV-GAP-6** | The assessment documents **no incidence, benefit, false-positive, false-negative, alert-per-patient-day, time-to-action, override, or outcome figure** for any candidate. `LEGACY-TA:1002` records all of these as an **unanswered open question**. |

**INFERENCE (from INV-GAP-1, INV-GAP-2, INV-GAP-4):** the legacy assessment is sufficient to
establish *that* clinical logic existed and *that* it had specific, evidenced defects. It is
**not** sufficient to establish *what* eleven of the twelve pathways were, what any of the
959 rules were, or what any candidate's inputs are. **A complete candidate inventory cannot
be produced from the assessment alone.** Closing INV-GAP-1 and INV-GAP-2 requires a separate,
scoped, read-only enumeration pass over the legacy repository's pathway YAML and rule catalog
— which is a distinct task with its own provenance obligations under
`legacy-import-policy.md` §3, and which this phase did **not** perform.

### 1.3 Candidate count produced by this phase

**9 candidate entries** — of which **2 are placeholder entries for unenumerated sets**
(CAND-0006, CAND-0007), **1 is a name-only stub** (CAND-0005), and **1 is recommended for
rejection as a pathway candidate** (CAND-0009).

**This number is not a target and is not a portfolio.** Per `PROMPT:328`, "The output is an
evidence-justified number, not a target chosen in advance." The evidence-justified number of
candidates *implementable in actionable mode today* is stated in `hard-gate-assessment.md`
and is **zero**.

---

## 2. Candidate entries

Each entry records the fourteen `PROMPT:270-285` fields plus a provenance block. Field
values that are not documented read `UNKNOWN — not documented` or
`VALIDATION REQUIRED`, verbatim. **No field is filled by estimation.**

---

### CAND-0001 — NEWS2 (National Early Warning Score 2)

| §6.1 field | Value |
|---|---|
| **Clinical problem / target population** | Aggregate physiological early warning of deterioration. Population **AS DOCUMENTED: not documented.** The legacy assessment names the instrument but states no population (`LEGACY-TA:108`). **INFERENCE** (from `intended-use-statement.md:197-203`): NEWS2 is an adult instrument, so its use carries an implicit adult-population assumption; the proposed V2 boundary is adult ICU (`intended-use-statement.md:135-136, 179-180`), itself **PROPOSAL, unapproved**. Paediatric/neonatal scope is a **BLOCKING undecided** (`g1-validation-backlog.md` VAL-0006/VAL-0007). |
| **User and workflow moment** | **UNKNOWN — not documented.** The legacy assessment records a bed-grid surveillance and patient-drill-down loop (`LEGACY-TA:143-144`) but performed **no** stakeholder interviews or workflow observation (`LEGACY-TA:56`, quoted in `intended-use-statement.md:63-65`). Who monitors, who acts, who escalates and who closes are all OPEN (`g1-validation-backlog.md` VAL-0012–VAL-0016). |
| **Decision / action enabled** | **UNKNOWN — not documented.** No escalation protocol, response tier, or clinical action is documented for this score in the assessment. **VALIDATION REQUIRED** — `AUTH-CLINSAFETY`. |
| **External authority + evidence strength (AS DOCUMENTED)** | **NOT DOCUMENTED. VALIDATION REQUIRED.** No guideline citation, publisher, version, or evidence grade for NEWS2 appears in the assessment (INV-GAP-5). What *is* documented is adverse: guideline references "documented as weak or pending refinement" (`LEGACY-TA:489`); sign-off approver identity unverifiable and statistical validation pending (`LEGACY-TA:125`). **This agent does not grade evidence** — grading is the clinical evidence methodologist's task (task packet, `decisions_prohibited`). |
| **Required inputs (codes, units, windows, exclusions, contraindications)** | **NOT DOCUMENTED IN LEGACY (INV-GAP-4).** A **PROPOSAL** input list — respiratory rate; oxygen saturation; supplemental-oxygen status; temperature; systolic blood pressure; pulse rate; level of consciousness — is carried in `pathway-to-source-matrix.yaml` rows `NEWS2-01`..`NEWS2-07`, restated from the published instrument's generally known input concepts and **explicitly not from legacy content**. **No threshold, band, or scoring rule is stated anywhere in this portfolio directory.** Codes: **NOT SPECIFIED — VALIDATION REQUIRED** (no terminology service verified; LOINC/UCUM releases unpinned, `contracts.lock.draft.yaml:165-167`). Time windows: **OPEN** (`g1-validation-backlog.md` VAL-0023). Exclusions/contraindications: **UNKNOWN — not documented**; `intended-use-statement.md:227-242` records obstetric, ECMO/CRRT, post-cardiac-surgical and palliative sub-populations as neither included nor excluded. |
| **Expected AMH/source availability, latency, completeness, correction, provenance** | **INELIGIBLE — hard constraint.** All seven inputs are vital signs. **SOURCE** `AMH-CF §3.2`: the AMH IG has **no vital-signs profile**; its only Observation profile pattern-fixes `category` to `laboratory`, so "a conformant instance **cannot** carry a vital-signs category… Vital signs would require a new profile to be authored, published, versioned and populated." Latency: **unmeasured** (`AMH-CF §4.3`). Completeness/population: **no observed evidence** (`AMH-CF §4.1`, Layer 3). Correction semantics: **undefined**. Provenance: **undefined**. |
| **Missing / stale / conflicting-data behavior** | **NOT DEFINED FOR V2. VALIDATION REQUIRED.** V2 has a five-state vocabulary as PROPOSAL (`evaluation-status-semantics.md`), but the per-input freshness windows and the per-component invalidate-vs-degrade rule are **OPEN** (`g1-validation-backlog.md` VAL-0023; legacy open question `LEGACY-TA:999`). Legacy behavior is **evidenced-defective**: with all clinical inputs absent, NEWS2 returned `0` (`LEGACY-TA:474`), persisted, and could drive a `normal` bed state (`LEGACY-TA:478`) — the single hazard `HAZ-0005` is built on. **This defect is why no legacy missing-data behavior may be inherited.** |
| **Expected incidence and clinical benefit** | **UNKNOWN — no figure documented** (INV-GAP-6; `LEGACY-TA:1002`). No incidence or benefit estimate is offered here; estimating one would be fabrication. |
| **FP / FN / duplicate / delay / alert-fatigue harms** | **UNKNOWN — no measured figure documented** (INV-GAP-6). Harm *mechanisms* are known and logged generically: `HAZ-0005` false reassurance, `HAZ-0016` duplicate alerts/alarm fatigue, `HAZ-0017` late alert, `HAZ-0015` generated-but-never-displayed. **Per-pathway** harm is hazard-log gap **G-2** (`hazard-log.md:190-193`) and is addressed as candidate hazards in §5 below. |
| **Overlap / dependency with other candidates** | **HIGH overlap with CAND-0002 (MEWS) and CAND-0004 (qSOFA)**: all three consume respiratory rate, systolic blood pressure, pulse/heart rate and level of consciousness. **INFERENCE:** deploying more than one of these against the same population is very likely to produce correlated alerts on the same physiological event — the exact condition `PROMPT:324` requires be penalized ("Penalize pairwise pathway overlap and competing alerts"). Quantified overlap is **impossible today** (no data, no site). See `portfolio-method.md` §6. |
| **Explanation and human-confirmation needs** | Component-level explanation is required. **SOURCE** `LEGACY-TA:486`: legacy had "**No** immutable evaluation record captur[ing] why a rule did **not** run or did not fire" — so a V2 NEWS2 must explain both fire and **no-fire** (`HAZ-0021`). Human confirmation: advisory-only per `intended-use-statement.md:287-299`, itself **PROPOSAL**. |
| **Dataset and reference-test availability** | **UNKNOWN — none identified.** No site has been identified or contacted (`g1-validation-backlog.md` VAL-0039, OBSERVED). No AMH data access exists (`AMH-CF §4.4`: only `dev` is provisioned). No adjudicated deterioration outcome definition exists (VAL-0036). Retrospective validation is therefore **not currently feasible**. |
| **Clinical owner, maintenance burden, evidence-update cadence** | **Owner: UNASSIGNED — VALIDATION REQUIRED** (`AUTH-CLINSAFETY`, `authority-model.md:28`). Maintenance burden and evidence-update cadence: **UNKNOWN — no funding or staffing decision exists.** |
| **Regulatory / intended-use impact** | **VALIDATION REQUIRED.** No regulatory classification exists (`intended-use-statement.md:355`, IU-12a). Admitting an aggregate early-warning score into an advisory ICU product is a plausible driver of classification and must be assessed by `AUTH-PRIVACY-LEGAL` + `AUTH-CLINSAFETY` with named regulatory counsel, **before** admission, not after. |
| **Provenance** | Legacy reference: `INTENSICARE_TECHNICAL_ASSESSMENT.md` @ `1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79`, lines `108, 181, 283, 474, 813, 828`. Reference-with-provenance only; **no import**. Collected 2026-08-14 by the clinical pathway portfolio optimizer; transformation: name and defect extracted, summarized; confidence medium; validation_status VALIDATION REQUIRED. |

---

### CAND-0002 — MEWS (Modified Early Warning Score)

| §6.1 field | Value |
|---|---|
| **Clinical problem / target population** | Aggregate physiological early warning of deterioration. Population **AS DOCUMENTED: not documented** (`LEGACY-TA:108`). Adult-instrument assumption and BLOCKING paediatric/neonatal question as CAND-0001. |
| **User and workflow moment** | **UNKNOWN — not documented.** As CAND-0001. |
| **Decision / action enabled** | **UNKNOWN — not documented. VALIDATION REQUIRED.** |
| **External authority + evidence strength (AS DOCUMENTED)** | **NOT DOCUMENTED. VALIDATION REQUIRED** (INV-GAP-5). |
| **Required inputs** | **NOT DOCUMENTED IN LEGACY (INV-GAP-4).** PROPOSAL input list in `pathway-to-source-matrix.yaml` rows `MEWS-01`..`MEWS-05` (systolic blood pressure; pulse/heart rate; respiratory rate; temperature; level of consciousness), restated from the published instrument, **not from legacy content**. No thresholds stated. Codes/windows/exclusions as CAND-0001. |
| **Expected AMH/source availability…** | **INELIGIBLE — hard constraint.** All five inputs are vital signs or a bedside neurological assessment; `AMH-CF §3.2` applies identically. |
| **Missing / stale / conflicting-data behavior** | **NOT DEFINED FOR V2. VALIDATION REQUIRED.** Legacy behavior evidenced-defective and **worse than silent**: MEWS returned `0` **with `missing_components` metadata** (`LEGACY-TA:473`) — i.e. the system *knew* inputs were missing and still emitted a reassuring number. **INFERENCE:** this is the strongest single argument in the entire evidence base that missing-data semantics must be a *contract*, not metadata (`evaluation-status-semantics.md`, `HAZ-0005`). |
| **Expected incidence and clinical benefit** | **UNKNOWN — no figure documented** (INV-GAP-6). |
| **FP / FN / duplicate / delay / alert-fatigue harms** | **UNKNOWN — no measured figure documented.** Per-pathway harms: §5 (PH-02), hazard-log gap G-2. |
| **Overlap / dependency** | **VERY HIGH overlap with CAND-0001 (NEWS2)** — four of five MEWS inputs are also NEWS2 inputs. **INFERENCE:** NEWS2 and MEWS are alternative aggregations of a largely shared input set; running both is a near-duplicate alerting surface. Also high overlap with CAND-0004. **This pair is the clearest case in the inventory for `PROMPT:326`'s remove-one-and-recheck step.** |
| **Explanation and human-confirmation needs** | As CAND-0001, plus: any explanation must state *which* components were missing rather than emitting metadata alongside a number. |
| **Dataset and reference-test availability** | **UNKNOWN — none identified.** As CAND-0001. |
| **Clinical owner / maintenance / cadence** | **UNASSIGNED — VALIDATION REQUIRED.** |
| **Regulatory / intended-use impact** | **VALIDATION REQUIRED.** As CAND-0001. |
| **Provenance** | Legacy reference: `INTENSICARE_TECHNICAL_ASSESSMENT.md` @ `1dc1ea6c…`, lines `108, 181, 283, 473, 642, 813, 828`. Reference only; no import. Collected 2026-08-14; confidence medium; VALIDATION REQUIRED. |

---

### CAND-0003 — SOFA (Sequential Organ Failure Assessment)

| §6.1 field | Value |
|---|---|
| **Clinical problem / target population** | Organ-dysfunction severity assessment. Population **AS DOCUMENTED: not documented** (`LEGACY-TA:108`). Adult instrument; adult-ICU proposal and BLOCKING paediatric/neonatal question as CAND-0001. |
| **User and workflow moment** | **UNKNOWN — not documented.** **INFERENCE:** SOFA's documented clinical use is typically periodic/daily severity characterization rather than continuous minute-scale surveillance; whether that workflow moment exists at the (unidentified) pilot site is **unobserved** and must be established by `AUTH-UX`/`AUTH-CLINSAFETY` (VAL-0012, VAL-0020). |
| **Decision / action enabled** | **UNKNOWN — not documented. VALIDATION REQUIRED.** |
| **External authority + evidence strength (AS DOCUMENTED)** | **NOT DOCUMENTED. VALIDATION REQUIRED** (INV-GAP-5). |
| **Required inputs** | **NOT DOCUMENTED IN LEGACY (INV-GAP-4).** PROPOSAL component list in `pathway-to-source-matrix.yaml` rows `SOFA-01`..`SOFA-06` (respiratory: oxygenation ratio with respiratory-support status; coagulation: platelet count; hepatic: bilirubin; cardiovascular: mean arterial pressure with vasoactive-agent exposure and dose; neurological: consciousness assessment; renal: creatinine and/or urine output). **No thresholds or organ-score bands stated.** **This candidate has the most heterogeneous input set in the inventory: numeric laboratory results, vital signs, a medication-administration exposure with dose, and a fluid-balance measurement.** |
| **Expected AMH/source availability…** | **INELIGIBLE — hard constraint, twice over.** Laboratory components (platelets, bilirubin, creatinine, blood-gas–derived oxygenation) are blocked: **SOURCE** `AMH-CF §3.1` — Observation is `bloqueado até os resultados de exame serem ingeridos no Bronze`, the Bronze source table `PACIENTE_EXAME` returned **0 rows**, and the structured LIS source is **not ingested**. Additionally `AMH-CF §3.1` records that the *unblocking plan* would emit `Observation.code = {text: "Resultado de exame"}` and `valueString` — **free text, not a LOINC-coded UCUM quantity** — and states bluntly: "No ICU scoring rule — NEWS2, MEWS, SOFA, qSOFA, or any threshold logic — can consume a `valueString`." Vital-sign and consciousness components are blocked by `AMH-CF §3.2`. Vasoactive dose exposure: **UNKNOWN** — no medication-administration contract, coverage, or dose-granularity evidence was collected. Urine output: **UNKNOWN — no source identified.** |
| **Missing / stale / conflicting-data behavior** | **NOT DEFINED FOR V2. VALIDATION REQUIRED.** Legacy: SOFA returned `0` with missing metadata when all inputs were absent (`LEGACY-TA:475`). **INFERENCE:** for an organ-failure instrument, a spurious `0` reads as "no organ dysfunction" — the most reassuring possible output for the most severely ill population. |
| **Expected incidence and clinical benefit** | **UNKNOWN — no figure documented** (INV-GAP-6). |
| **FP / FN / duplicate / delay / alert-fatigue harms** | **UNKNOWN — no measured figure documented.** §5 (PH-03). |
| **Overlap / dependency** | **Partial overlap with CAND-0004 (qSOFA)** on the consciousness component and with CAND-0001/0002 on blood pressure. **Distinct incremental coverage**: SOFA is the only candidate whose inputs include laboratory and medication data, so it would add coverage the others cannot — *if* those sources existed, which they do not. **Dependency:** SOFA is the candidate most dependent on unblocking AMH Observation **conformantly** (coded + UCUM quantity), not merely unblocking it. |
| **Explanation and human-confirmation needs** | Per-organ component explanation required; a single aggregate number without organ attribution is not explainable in the sense `PROMPT:338` requires. Missing-organ handling must be explicit (which organ could not be assessed), not a silent contribution. |
| **Dataset and reference-test availability** | **UNKNOWN — none identified.** As CAND-0001, and additionally requires laboratory and medication-administration data that AMH does not currently supply. |
| **Clinical owner / maintenance / cadence** | **UNASSIGNED — VALIDATION REQUIRED.** |
| **Regulatory / intended-use impact** | **VALIDATION REQUIRED.** |
| **Provenance** | Legacy reference: `INTENSICARE_TECHNICAL_ASSESSMENT.md` @ `1dc1ea6c…`, lines `108, 181, 283, 475, 813, 828`. Reference only; no import. Collected 2026-08-14; confidence medium; VALIDATION REQUIRED. |

---

### CAND-0004 — qSOFA (quick SOFA)

| §6.1 field | Value |
|---|---|
| **Clinical problem / target population** | Rapid bedside identification of patients at higher risk of poor outcome from suspected infection. **Note (INV-GAP-3): the legacy assessment never mentions sepsis or infection.** The clinical problem stated here is a **PROPOSAL** drawn from the published instrument's stated purpose, **not** from legacy documentation, and requires ratification. Population **AS DOCUMENTED: not documented**; adult instrument. |
| **User and workflow moment** | **UNKNOWN — not documented. INFERENCE:** qSOFA's published purpose is conditioned on *suspected infection* — a clinical judgement, not an observation. **No evidence input identifies any source from which "suspected infection" could be determined.** Applying qSOFA to an undifferentiated ICU population is a *different* use of the instrument from its published one and would require separate evidence (`PROMPT:418`: "If only a safe subset of a pathway can be evaluated, define it as a separately evidenced pathway… never silently alter the clinical definition"). |
| **Decision / action enabled** | **UNKNOWN — not documented. VALIDATION REQUIRED.** |
| **External authority + evidence strength (AS DOCUMENTED)** | **NOT DOCUMENTED. VALIDATION REQUIRED** (INV-GAP-5). |
| **Required inputs** | **NOT DOCUMENTED IN LEGACY (INV-GAP-4).** PROPOSAL list in `pathway-to-source-matrix.yaml` rows `QSOFA-01`..`QSOFA-03` (respiratory rate; systolic blood pressure; altered mentation), plus the **unsourced gating condition "suspected infection"**. No thresholds stated. |
| **Expected AMH/source availability…** | **INELIGIBLE — hard constraint** (`AMH-CF §3.2`) for all three physiological inputs. The infection-suspicion gate has **no identified source of any kind** — not blocked, simply **absent from the contract inventory**. |
| **Missing / stale / conflicting-data behavior** | **NOT DEFINED FOR V2. VALIDATION REQUIRED.** Legacy: qSOFA returned `0` with missing metadata (`LEGACY-TA:476`). |
| **Expected incidence and clinical benefit** | **UNKNOWN — no figure documented** (INV-GAP-6). |
| **FP / FN / duplicate / delay / alert-fatigue harms** | **UNKNOWN — no measured figure documented.** §5 (PH-04). |
| **Overlap / dependency** | **HIGH overlap with CAND-0001 and CAND-0002** (respiratory rate, systolic blood pressure, consciousness are shared). **Dependency:** on an infection-suspicion signal that does not exist in any inventoried contract. |
| **Explanation and human-confirmation needs** | Explanation must state the gating condition, not only the three components; presenting a qSOFA result without disclosing that infection suspicion was *assumed* rather than *established* would be a silent alteration of the clinical definition. |
| **Dataset and reference-test availability** | **UNKNOWN — none identified.** |
| **Clinical owner / maintenance / cadence** | **UNASSIGNED — VALIDATION REQUIRED.** |
| **Regulatory / intended-use impact** | **VALIDATION REQUIRED.** |
| **Provenance** | Legacy reference: `INTENSICARE_TECHNICAL_ASSESSMENT.md` @ `1dc1ea6c…`, lines `108, 181, 283, 476, 828`. Reference only; no import. Collected 2026-08-14; confidence medium; VALIDATION REQUIRED. |

---

### CAND-0005 — Ventilator / mechanical-ventilation pathway (name only; documented as a stub)

| §6.1 field | Value |
|---|---|
| **Clinical problem / target population** | **UNKNOWN — not documented.** The assessment names this pathway once and only to record that it is a stub: **SOURCE** `LEGACY-TA:117` — "The ventilator pathway is explicitly described as a stub (`README.md:162`)." No clinical problem, population, logic, or content is documented. |
| **User and workflow moment** | **UNKNOWN — not documented.** |
| **Decision / action enabled** | **UNKNOWN — not documented.** |
| **External authority + evidence strength** | **NOT DOCUMENTED. VALIDATION REQUIRED.** |
| **Required inputs** | **UNKNOWN — none documented.** **INFERENCE:** any ventilation pathway would depend on ventilator device data (settings, modes, measured parameters). **No evidence input read this cycle identifies any device-data contract at AMH.** `AMH-CF §3.2` records a *contradicting* AMH diagram claim of "sinais vitais de dispositivos IoT" but also records that the claim is unresolved (contradiction C-1) and that "no file read this cycle claims a **populated** vital-sign feed exists in any environment." |
| **Expected AMH/source availability…** | **UNKNOWN — no source identified.** Not merely blocked: no device or ventilator contract has been inventoried at all. |
| **Missing / stale / conflicting-data behavior** | **N/A — no logic exists to define behavior for.** |
| **Expected incidence and clinical benefit** | **UNKNOWN — no figure documented.** |
| **FP / FN / duplicate / delay / alert-fatigue harms** | **UNKNOWN.** Cannot be assessed for logic that does not exist. §5 (PH-05 records the meta-hazard of a stub being mistaken for a functioning pathway). |
| **Overlap / dependency** | **UNKNOWN.** |
| **Explanation and human-confirmation needs** | **UNKNOWN.** |
| **Dataset and reference-test availability** | **UNKNOWN — none identified.** |
| **Clinical owner / maintenance / cadence** | **UNASSIGNED — VALIDATION REQUIRED.** |
| **Regulatory / intended-use impact** | **VALIDATION REQUIRED.** **INFERENCE:** a ventilation pathway is materially more likely than an aggregate score to imply directive content (settings, weaning, escalation of respiratory support). That would engage the advisory-vs-directive boundary (`intended-use-statement.md:287-299`, VAL-0011) directly. |
| **Provenance** | Legacy reference: `INTENSICARE_TECHNICAL_ASSESSMENT.md` @ `1dc1ea6c…`, line `117`. Reference only; no import. Collected 2026-08-14; confidence high (that it is a stub); VALIDATION REQUIRED. |

---

### CAND-0006 — The eleven unnamed pathway definitions (PLACEHOLDER — inventory gap INV-GAP-1)

> **This entry is a declared gap, not a candidate.** It exists so that eleven unknown
> pathways are visible in the inventory rather than silently absent. **It must not be
> counted as eleven candidates, and it must not be counted as one.**

| §6.1 field | Value |
|---|---|
| **Clinical problem / target population** | **UNKNOWN — UNENUMERATED.** **SOURCE** `LEGACY-TA:482`: twelve definitions loaded and active. **SOURCE** `LEGACY-TA:117`: exactly one (the ventilator stub) is named anywhere in the assessment. Eleven are therefore known only as a count. |
| **User and workflow moment** | **UNKNOWN — UNENUMERATED.** |
| **Decision / action enabled** | **UNKNOWN — UNENUMERATED.** |
| **External authority + evidence strength** | **NOT DOCUMENTED.** What *is* documented about the set as a whole: 12 paths, 118 units, 38 band sets, 58 predicates and only **2 rationale records** (`LEGACY-TA:582`) — the assessment's own reading is "Good structural compilation signal, **limited rationale coverage**." **INFERENCE:** 2 rationale records across 12 pathways means the overwhelming majority of this set carried **no recorded clinical rationale at all**. |
| **Required inputs** | **UNKNOWN — UNENUMERATED.** |
| **Expected AMH/source availability…** | **UNKNOWN.** **INFERENCE:** any member of this set whose inputs reduce to vital signs or numeric laboratory results is ineligible for the same reasons as CAND-0001..0004 (`AMH-CF §3.3`). Which members those are cannot be known without enumeration. |
| **Missing / stale / conflicting-data behavior** | **UNKNOWN.** Generic legacy defects apply to the engine, not to individual definitions: dual runtime and legacy fallback (`LEGACY-TA:719-727`), best-effort post-persistence evaluation so "an exception can leave scores/alerts committed while pathway state is stale" (`LEGACY-TA:384`), and load failures not exposed in readiness (`LEGACY-TA:490`). |
| **Expected incidence and clinical benefit** | **UNKNOWN.** |
| **FP / FN / duplicate / delay / alert-fatigue harms** | **UNKNOWN.** §5 (PH-06). |
| **Overlap / dependency** | **UNKNOWN — and unknowable without enumeration.** **INFERENCE:** this is portfolio-relevant. `PROMPT:324` requires penalizing pairwise overlap; overlap cannot be computed against an unenumerated set, so **no portfolio containing any member of this set can satisfy §6.3 until enumeration is complete.** |
| **Explanation and human-confirmation needs** | **UNKNOWN.** |
| **Dataset and reference-test availability** | **UNKNOWN.** Note `LEGACY-TA:584`: all nine domain YAML lacked `alert_groups` and the vector gate then reported "All 0" pass — "False-green gate; validates nothing." **INFERENCE:** any claim that this set was "tested" is unsupported. |
| **Clinical owner / maintenance / cadence** | **UNASSIGNED — VALIDATION REQUIRED.** |
| **Regulatory / intended-use impact** | **VALIDATION REQUIRED.** |
| **What would close this gap** | A scoped, read-only enumeration pass over the legacy pathway definitions producing one CAND entry per definition **with path+line provenance and no content import**, per `legacy-import-policy.md` §3. **Not performed in this phase.** Recorded as backlog item **G2-VAL-0002** in `g2-validation-backlog.md`. |
| **Provenance** | Legacy reference: `INTENSICARE_TECHNICAL_ASSESSMENT.md` @ `1dc1ea6c…`, lines `117, 482, 582, 583, 584, 1084`. Reference only; no import. Collected 2026-08-14; confidence high (that the gap exists); VALIDATION REQUIRED. |

---

### CAND-0007 — The 959-rule / 27-cluster domain catalog (PLACEHOLDER — inventory gap INV-GAP-2)

> **This entry is a declared gap, not a candidate.** It is a *catalog*, and — per the
> legacy assessment's own conclusion — a catalog is not a portfolio.

| §6.1 field | Value |
|---|---|
| **Clinical problem / target population** | **UNKNOWN — UNENUMERATED.** **SOURCE** `LEGACY-TA:33` and `LEGACY-TA:772`: "959 documented extracted rules, 27 clusters." No cluster and no rule is named or described anywhere in the assessment. |
| **User and workflow moment** | **UNKNOWN.** **SOURCE** `LEGACY-TA:33`: the catalog is contrasted with "only seven current UI routes", and `LEGACY-TA:117` records that "many domain catalogs are not implemented end to end." |
| **Decision / action enabled** | **UNKNOWN — none demonstrated.** |
| **External authority + evidence strength (AS DOCUMENTED)** | **NOT DOCUMENTED, and explicitly flagged as a risk by the assessment itself.** **SOURCE** `LEGACY-TA:42` — listed under "**Investigate before reuse**": "the broad domain-rule catalog, **formal clinical provenance of each rule**…". **SOURCE** `LEGACY-TA:847` — disposition `**Investigate**`: "requires provenance, clinical prioritization, schema normalization, and real data coverage." **SOURCE** `LEGACY-TA:881`: "A large rule catalog is not a product until its inputs, evidence, workflow, and outcomes are validated." |
| **Required inputs** | **UNKNOWN — UNENUMERATED.** |
| **Expected AMH/source availability…** | **UNKNOWN.** |
| **Missing / stale / conflicting-data behavior** | **UNKNOWN.** Note `LEGACY-TA:488`: "Domain definitions and pathway YAML use different schemas and validation coverage" — **INFERENCE:** the catalog and the pathway set are not one governed body of content. |
| **Expected incidence and clinical benefit** | **UNKNOWN.** |
| **FP / FN / duplicate / delay / alert-fatigue harms** | **UNKNOWN.** §5 (PH-07). |
| **Overlap / dependency** | **UNKNOWN — unknowable without enumeration.** **INFERENCE:** 959 rules is a scale at which overlap and alert-volume interaction become the *dominant* portfolio risk, not a secondary one. |
| **Explanation and human-confirmation needs** | **UNKNOWN.** |
| **Dataset and reference-test availability** | **UNKNOWN.** |
| **Clinical owner / maintenance / cadence** | **UNASSIGNED — VALIDATION REQUIRED.** **INFERENCE:** maintenance burden scales with admitted rule count; a 959-rule catalog implies an evidence-surveillance and re-validation obligation that no current staffing or funding decision covers. `PROMPT:301` makes funded versioning/rollback/surveillance/retirement a **hard gate**. |
| **Regulatory / intended-use impact** | **VALIDATION REQUIRED.** **SOURCE** `LEGACY-TA:769-777` (IC-015): product breadth exceeded the validated product model. `HAZ-0036` covers silent intended-use expansion. |
| **What would close this gap** | Enumeration is **necessary but not sufficient**. Per `PROMPT:266` the catalog is a candidate pool, not a backlog; per `LEGACY-TA:881` it is not a product until validated. Recorded as backlog item **G2-VAL-0003**. |
| **Provenance** | Legacy reference: `INTENSICARE_TECHNICAL_ASSESSMENT.md` @ `1dc1ea6c…`, lines `33, 42, 488, 772, 847, 881`. Reference only; no import. Collected 2026-08-14; confidence high (that the gap exists); VALIDATION REQUIRED. |

---

### CAND-0008 — Score-threshold alert rules (dependent rule set)

> **Not an independently clinically actionable pathway.** Recorded because it is a documented
> rule set (`PROMPT:270` — "each candidate score, pathway, **or rule set**") and because its
> alert-volume behavior is a §6.3 portfolio constraint in its own right.

| §6.1 field | Value |
|---|---|
| **Clinical problem / target population** | Conversion of a score result into a durable, severity-classified alert. **SOURCE** `LEGACY-TA:146`: "computes and persists four scores → evaluates score alerts". Population: inherits from the score it wraps. |
| **User and workflow moment** | **UNKNOWN — not documented.** Alert triage is a documented legacy screen (`LEGACY-TA:322`) but the *workflow* is unobserved (VAL-0012–VAL-0016). |
| **Decision / action enabled** | Acknowledge / escalate / reassign / resolve / override. **UNKNOWN in detail** — `LEGACY-TA:1000` records ownership during shift change and downtime as an **unanswered** legacy open question. |
| **External authority + evidence strength (AS DOCUMENTED)** | **NOT DOCUMENTED.** Alert thresholds and severity mapping have no documented external authority (INV-GAP-5). **SOURCE** `LEGACY-TA:123` (via `g1-validation-backlog.md` VAL-0032): legacy carried **two conflicting severity vocabularies**, unresolved. |
| **Required inputs** | A score result **plus** its evaluation status. **INFERENCE — critical:** the legacy design took a *number* as its input. Under `evaluation-status-semantics.md:184-192` a V2 alert rule must take a *(value, status)* pair, and must not fire, or must fire differently, on `partial` / `stale` / `not_evaluated` / `invalid`. **That contract does not exist yet.** |
| **Expected AMH/source availability…** | **INELIGIBLE — inherits the source ineligibility of every score it wraps.** No independent source. |
| **Missing / stale / conflicting-data behavior** | **NOT DEFINED. VALIDATION REQUIRED.** Legacy evidence is adverse: cooldown/dedup/grouping existed but suppression state could drift and was not auditable (`LEGACY-TA:494`, `LEGACY-TA:308`; `HAZ-0022`). |
| **Expected incidence and clinical benefit** | **UNKNOWN — no alert-rate figure documented** (`LEGACY-TA:1002`). **INFERENCE:** this is the single most important missing number for `PROMPT:324`'s interruptive-alert budget constraint, and it cannot be estimated without a site and a baseline (VAL-0035 — and baselines are **unobtainable once V2 is deployed**). |
| **FP / FN / duplicate / delay / alert-fatigue harms** | Mechanisms documented: duplicate transports, unbounded fan-out, process-local delivery (`LEGACY-TA:495`, `LEGACY-TA:669-677`). Magnitudes **UNKNOWN**. §5 (PH-08). |
| **Overlap / dependency** | **Total dependency on CAND-0001..0004.** **INFERENCE:** correlated scores produce correlated alerts; the overlap penalty of `PROMPT:324` is realized *here*, not at the score layer. |
| **Explanation and human-confirmation needs** | Must explain fire, no-fire, and **suppression** (`HAZ-0022`; `PROMPT:1059` forbids hiding alert-delivery uncertainty). |
| **Dataset and reference-test availability** | **UNKNOWN — none.** |
| **Clinical owner / maintenance / cadence** | **UNASSIGNED — VALIDATION REQUIRED.** Threshold-change authority is itself an open question (VAL-0017). |
| **Regulatory / intended-use impact** | **VALIDATION REQUIRED.** Alert wording is where advisory content most easily becomes directive (`HAZ-0036`). |
| **Provenance** | Legacy reference: `INTENSICARE_TECHNICAL_ASSESSMENT.md` @ `1dc1ea6c…`, lines `123, 146, 308, 494-495, 669-677, 1000, 1002`. Reference only; no import. Collected 2026-08-14; confidence medium; VALIDATION REQUIRED. |

---

### CAND-0009 — Bed-grid severity derivation (recommended REJECT as a pathway candidate)

| §6.1 field | Value |
|---|---|
| **Clinical problem / target population** | Derivation of a per-bed acuity state for unit-level surveillance. **SOURCE** `LEGACY-TA:143`: "severity is derived → UI presents bed cards and freshness… **no-data beds are labeled normal**." |
| **User and workflow moment** | Unit-level scanning. **Unobserved** (VAL-0012). |
| **Decision / action enabled** | Attention allocation across a unit — i.e. **de-prioritization** as much as prioritization. **INFERENCE:** a de-prioritization decision has the same harm potential as an escalation decision and must be evidenced to the same standard. |
| **External authority + evidence strength (AS DOCUMENTED)** | **NONE DOCUMENTED.** This is a display-state derivation, not a published clinical instrument. |
| **Required inputs** | Score results, evaluation statuses, freshness, bed/unit assignment. |
| **Expected AMH/source availability…** | **INELIGIBLE** — inherits from the scores; additionally **bed/unit assignment has no verified source**: `LEGACY-TA:324` records that the legacy unit filter "matches patient-name/pathway strings rather than a reliable unit field, so it can return semantically incorrect results" (`HAZ-0004`). |
| **Missing / stale / conflicting-data behavior** | **EVIDENCED-DEFECTIVE IN LEGACY, AND THIS IS THE DECISIVE FACT.** **SOURCE** `LEGACY-TA:478`: the zero score "is persisted and can drive a `normal` bed state… **This is a confirmed violation of documented intent and the most serious clinical safety defect in the repository.**" `LEGACY-TA:330`: "an occupied bed without sufficient measurements can be shown as `normal`." |
| **Expected incidence and clinical benefit** | **UNKNOWN.** |
| **FP / FN / duplicate / delay / alert-fatigue harms** | The dominant harm is **false reassurance**, not false alerting — `HAZ-0005`, and `intended-use-statement.md:319-323` ("V2 must treat *false reassurance* as a first-class hazard class of equal standing to false alerting"). §5 (PH-09). |
| **Overlap / dependency** | Total dependency on CAND-0001..0004 and CAND-0008. |
| **Explanation and human-confirmation needs** | Must render non-evaluation in a **visually distinct** vocabulary from low risk (`intended-use-statement.md:320-321`); comprehension of that distinction is itself unvalidated (VAL-0027, VAL-0031). |
| **Dataset and reference-test availability** | **UNKNOWN.** |
| **Clinical owner / maintenance / cadence** | **UNASSIGNED — VALIDATION REQUIRED.** |
| **Regulatory / intended-use impact** | **VALIDATION REQUIRED.** |
| **Portfolio disposition (PROPOSAL)** | **REJECT as a pathway candidate** — see `hard-gate-assessment.md` §4. Rationale: it is a **presentation-state derivation**, not an independently evidenced clinical pathway; admitting it to a pathway portfolio would place a UX/status-rendering requirement inside a clinical-content approval process where it does not belong. **It must instead be specified as a V2 status-rendering requirement** under `evaluation-status-semantics.md` and `status-dimensions.md`, owned by `AUTH-UX` + `AUTH-CLINSAFETY` jointly. **REJECT here means "not a pathway", not "not needed".** |
| **Provenance** | Legacy reference: `INTENSICARE_TECHNICAL_ASSESSMENT.md` @ `1dc1ea6c…`, lines `143, 324, 330, 478`. Reference only; no import. Collected 2026-08-14; confidence high; VALIDATION REQUIRED. |

---

## 3. Overlap map (PROPOSAL — qualitative only)

`PROMPT:281` requires overlap/dependency per candidate; `PROMPT:324` requires it be
*penalized* in selection. **No quantitative overlap can be computed today** — that requires
patient-level data, which does not exist (no site, no AMH access). The following is a
**qualitative input-sharing map only.**

| | CAND-0001 NEWS2 | CAND-0002 MEWS | CAND-0003 SOFA | CAND-0004 qSOFA |
|---|---|---|---|---|
| **CAND-0001 NEWS2** | — | **very high** (RR, SBP, pulse, consciousness, temperature shared) | low (BP-family only) | **high** (RR, SBP, consciousness) |
| **CAND-0002 MEWS** | very high | — | low (BP-family only) | **high** (RR, SBP, consciousness) |
| **CAND-0003 SOFA** | low | low | — | moderate (consciousness; BP-family) |
| **CAND-0004 qSOFA** | high | high | moderate | — |

**INFERENCE:** CAND-0001 / CAND-0002 / CAND-0004 form a **single correlated cluster** over a
shared physiological input set. Treating them as three independent portfolio candidates would
systematically understate alert volume and overstate incremental coverage. Any future MCDA run
must score criterion 9 (*incremental coverage*) and criterion 12 (*alert-volume contribution
and overlap/correlation*) for this cluster **jointly**, not per-candidate. Recorded as a
constraint in `portfolio-method.md` §6.

**CAND-0006 and CAND-0007 are absent from this map because they are unenumerated.** Their
absence is not evidence of no overlap; it is evidence that overlap analysis is incomplete.

---

## 4. Cross-cutting statements that apply to every candidate

1. **No candidate has a named clinical owner.** `AUTH-CLINSAFETY` is `UNASSIGNED — VALIDATION REQUIRED` (`authority-model.md:28`). This alone fails hard gate 2 for all nine (`PROMPT:292`).
2. **No candidate has documented evidence provenance.** INV-GAP-5. **This agent has not graded, and will not grade, any candidate's evidence** — that is the clinical evidence methodologist's role (task packet, `handoff_recipient`).
3. **No candidate has a defined missing/stale/conflicting-data contract**, because per-input freshness windows and the invalidate-vs-degrade rule are OPEN (VAL-0023; `LEGACY-TA:999`).
4. **No candidate has a dataset.** No site (VAL-0039, OBSERVED: none identified or contacted); no AMH environment beyond `dev` (`AMH-CF §4.4`); no pre-registered outcome definition (VAL-0036).
5. **No candidate's benefit or harm has been quantified**, and none is quantified here. `success-and-harm-metrics.md` SM-03 additionally constrains any future measurement: precision/recall must be computed **only over valid patient-time**, so a candidate that spends most of its time in `not_evaluated` will have a small denominator, and that must be reported rather than hidden.
6. **Legacy determinism is not V2 determinism.** `LEGACY-TA:813` records deterministic versioned scores with 16 passing property tests — but `LEGACY-TA:487` records that "Score-version identifiers are strings in code rather than a signed release registry," and `LEGACY-TA:719-727` records dual runtimes. **Neither the logic nor its test evidence may be inherited** (`legacy-import-policy.md` §1, §3).

---

## 5. Candidate per-pathway hazards — for hazard-log integration (gap G-2)

`hazard-log.md:190-193` declares gap **G-2**: "pathway-specific hazards… are **per-pathway**
and cannot be stated before a pathway portfolio exists… Owned by the clinical pathway
portfolio optimizer; this log will gain one hazard row per admitted pathway at G2."

**These are recorded HERE, in this specialist's own file, per the task's write scope. The
sibling `hazard-log.md` was NOT modified.** `PH-nn` are document-local handles, **not**
`HAZ-nnnn` allocations (§0.3). The clinical safety-case engineer allocates real IDs at
integration.

**No severity or likelihood is assigned.** `hazard-log.md:36-39` reserves S/L to that log's
conventions and to `AUTH-CLINSAFETY`; assigning them here would duplicate and pre-empt a
judgement this agent is not authorized to make.

| Handle | Candidate | Candidate hazard (condition → event → harm) | Related existing hazard |
|---|---|---|---|
| **PH-01** | CAND-0001 NEWS2 | An aggregate score is computed from a *subset* of its seven inputs because only some vital signs are available → the aggregate is presented with the same visual weight as a complete one → clinicians read a partial aggregate as a complete assessment; the missing physiological axis is exactly the one deteriorating | HAZ-0005, HAZ-0021 |
| **PH-02** | CAND-0002 MEWS | Two aggregate early-warning scores over a shared input set are shown for the same patient and disagree (one crosses its threshold, one does not) → the clinician must adjudicate between two unvalidated instruments at the bedside → decision delay, or selective attention to whichever score confirms a prior judgement | HAZ-0016, HAZ-0036 |
| **PH-03** | CAND-0003 SOFA | Laboratory components arrive on a slower cadence than physiological components → an organ-dysfunction score mixes hours-old laboratory values with minutes-old vital signs under a single timestamp → the composite describes a patient state that never existed at any instant | HAZ-0006, HAZ-0011, HAZ-0026 |
| **PH-04** | CAND-0004 qSOFA | An infection-gated instrument is evaluated on an undifferentiated ICU population because no infection-suspicion signal exists → the instrument is applied outside its published condition of use without disclosure → the result carries an authority it has not earned; intended use silently expands | HAZ-0036 |
| **PH-05** | CAND-0005 ventilator (stub) | A pathway that exists in name, registry, or UI but contains no evaluated logic is displayed as present/active → a clinician infers that ventilation is being monitored → surveillance is believed to be occurring where none is | HAZ-0025, HAZ-0021 |
| **PH-06** | CAND-0006 unnamed pathway set | Pathways are activated from a legacy bundle whose individual clinical content was never enumerated or ratified → patients are evaluated by logic no clinical approver has read → systematically wrong clinical direction, correlated across a whole unit | HAZ-0019 |
| **PH-07** | CAND-0007 959-rule catalog | A large rule catalog is admitted in bulk on the strength of its size → alert volume and pairwise overlap exceed any measured or measurable response capacity → alarm fatigue converts a true alert into an ignored one | HAZ-0016, HAZ-0022 |
| **PH-08** | CAND-0008 score alert rules | An alert rule consumes a score *value* without its evaluation *status* → an alert fires (or fails to fire) on a `partial`, `stale`, or `not_evaluated` result as if it were `valid` → an alert asserts a clinical state the inputs never supported, or a genuine deterioration is silently withheld | HAZ-0005, HAZ-0021, HAZ-0022, HAZ-0040 |
| **PH-09** | CAND-0009 bed-grid severity | Absence of evaluation is rendered in the same visual vocabulary as a low-risk evaluation across an entire unit view → many unmonitored patients read as many well patients → unit-wide false reassurance; attention is allocated away from the least-observed patients | HAZ-0005, HAZ-0025 |
| **PH-10** | **all candidates** | A pathway is admitted to the portfolio while its inputs have no authoritative populated source → the pathway runs permanently in `not_evaluated` → the product displays a monitoring capability that is structurally incapable of evaluating anything, and the emptiness is mistaken for reassuring quiet | HAZ-0025, HAZ-0039 |
| **PH-11** | **all candidates** | Adult-instrument logic evaluates a patient outside the approved population (paediatric, or unknown age) because population gating is not enforced from trusted data → an out-of-population result renders in the same vocabulary as a validated one | HAZ-0036; `intended-use-statement.md` IU-06 (BLOCKING) |
| **PH-12** | **all candidates** | A pathway generates an escalation work item for a patient under palliative or treatment-limitation goals of care → the system is technically correct and clinically wrong → distress, inappropriate intervention, and erosion of clinician trust in every other alert | `intended-use-statement.md:238-242`; VAL-0010 |

**Handoff:** these twelve handles are offered to the clinical safety-case engineer for
integration into `hazard-log.md` under gap G-2. **PH-10, PH-11 and PH-12 are portfolio-wide
and are relevant even if the portfolio remains empty** — PH-10 in particular describes a
failure mode of *admitting anything at all* under today's source conditions.

---

## 6. What this inventory does NOT establish

1. **It does not select a portfolio.** No candidate is chosen, ranked, or recommended for implementation. Selection is Gate G2 (`PROMPT:347-349`) and requires ratified weights and named owners — neither exists.
2. **It does not approve clinical content.** No threshold, band, recommendation, or instrument version is endorsed.
3. **It does not grade evidence.** Every evidence field reads AS DOCUMENTED or NOT DOCUMENTED. Grading belongs to the clinical evidence methodologist.
4. **It does not import anything.** No legacy rule content is reproduced. Every legacy reference carries repo, commit, path and line per `legacy-import-policy.md` §3.2, and no import decision is proposed.
5. **It does not treat legacy logic as validated.** `LEGACY-TA:465` records the legacy safety case as not closed; `LEGACY-TA:125` records the sign-off's own admission that the approver is unverifiable and statistical validation pending.
6. **It is not complete.** INV-GAP-1 and INV-GAP-2 leave eleven pathways and 959 rules unenumerated. **A future enumeration pass may add candidates; it may also confirm that some of the twelve were stubs, duplicates, or non-clinical.** Either outcome is legitimate; neither is assumed.

## 7. Cross-references

- `hard-gate-assessment.md` — the eleven `PROMPT:287-303` gates applied to these nine candidates.
- `pathway-to-source-matrix.yaml` / `.md` — per-input source eligibility (`PROMPT:397-420`).
- `portfolio-method.md` — the MCDA method (`PROMPT:305-328`), execution blocked.
- `g2-validation-backlog.md` — what must happen before any pathway enters actionable production mode.
- `../hazard-log.md` — gap G-2 is answered by §5 above (integration pending, by the safety engineer).
- `../evaluation-status-semantics.md` — the `valid | partial | not_evaluated | stale | invalid` contract every candidate depends on.
- `../../08-interoperability/amh-data/compatibility-finding.md` — the hard portfolio constraint.
