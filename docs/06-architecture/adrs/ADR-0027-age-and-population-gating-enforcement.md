---
id: ADR-0027
title: Age and population gating enforcement for adult-validated clinical instruments
status: accepted (2026-08-15, GDEC-0007)
status_history:
  - status: proposed
    date: 2026-08-15
    by: age/population gating-enforcement ADR author (IntensiCare V2, cycle 1, Task 4)
    note: >
      Options, drivers, gating vocabulary and acceptance conditions drafted from the
      BLOCKING VAL-0006/VAL-0007 backlog items, intended-use-statement.md IU-05/IU-06/
      IU-07, hazard-log.md HAZ-0036/HAZ-0044, safety-requirements.md SAF-0035/SAF-0041,
      the legacy EWS/SOFA population-gating findings, and the AMH identity-adjudication
      evidence establishing that no trusted age/demographic source exists today. NO
      decision is recorded and none may be inferred. This ADR cannot advance past
      `proposed` until a human owner is named for AUTH-CLINSAFETY and AUTH-INTENDED-USE
      in `authority-model.md` (Gate G0) and VAL-0006/VAL-0007 are resolved.
  - status: accepted (2026-08-15, GDEC-0007)
    date: 2026-08-15
    by: rodaquino-OMNI (revisor clínico nomeado, GDEC-0003) — transcrito pelo orquestrador clínico do ciclo 1 (escriba)
    note: >
      Decisão por escrito, em sessão, do titular nomeado, registrada em
      decision-register.md GDEC-0007 (folha de decisão do ciclo 1, §8, linhas A27-1 a
      A27-7). Opção A (locus de enforcement) fixada, com o híbrido A+B+C adotado como
      emenda deste ADR (A27-6) e as disposições de carve-out decididas (A27-4). Ver §5.0.
      Bloco de decisão redigido em pt-BR per DEC-G0-10; o restante do documento
      permanece em inglês (tradução material adiada, P-4).
date: 2026-08-15
owner: UNASSIGNED — VALIDATION REQUIRED
approvers:
  - UNASSIGNED — VALIDATION REQUIRED   # candidate role: AUTH-CLINSAFETY — rodaquino-OMNI is the *candidate* holder per GDEC-0003 (named clinical reviewer/clinical-content approver for cycle-1 artifacts), but GDEC-0003 does not itself ratify an authority-model.md AUTH-CLINSAFETY appointment; that row remains UNASSIGNED there.
  - UNASSIGNED — VALIDATION REQUIRED   # candidate role: AUTH-INTENDED-USE — same candidacy and same caveat; authority-model.md row remains UNASSIGNED.
decision_deadline: >
  UNSET — VALIDATION REQUIRED. Forced by two independent events: (a) Gate G2
  pathway-portfolio approval, since no pathway may enter `actionable` mode
  (SAF-0035) while its population-gating enforcement locus is undesigned; and
  (b) resolution of VAL-0006/VAL-0007, since the age-range boundary this ADR's
  gate must enforce (§4) cannot be finalized while paediatric/neonatal scope is
  undecided.
deciding_authority_rule: >
  docs/00-governance/decision-rights.md §2, two rows jointly govern this ADR: "Clinical
  hazard / residual-risk acceptance" (AUTH-CLINSAFETY — this ADR operationalizes
  SAF-0035/SAF-0041 architecturally) and "Intended use / non-intended use"
  (AUTH-INTENDED-USE — this ADR extends IU-05/IU-06/IU-07's population boundary into an
  enforceable system behaviour). Agents may draft the enforcement options; only the
  named joint authority may accept one, per `intended-use-statement.md` §7.1.
independence_check: >
  The author of this ADR is a drafting specialist and is not listed as an approver
  (decision-rights.md §3). No required-independence pair is engaged by *drafting* this
  ADR. Pair 1 (rule author ≠ clinical approver, decision-rights.md §3) is engaged the
  moment the chosen gate's predicates are authored inside a rule bundle (ADR-0007) and
  must be re-checked at that time — the specialist who implements the gate predicate
  may not also be the clinical approver who ratifies the age-range/pregnancy/setting
  values it enforces. SAF-0037 (independence as a process control) applies to any later
  acceptance evidence for this gate.

links:
  drivers:
    domain_invariants: [DOM-0004, DOM-0007, DOM-0008]
    quality_scenarios: [QAS-0017, QAS-0007, QAS-0023, QAS-0019, QAS-0027]
    risks: ["pending risk register IDs — see docs/00-governance/registers/risk-register.md"]
  constrains:
    requirements: ["REQ: pending requirement catalog (docs/04-product-requirements not yet created)"]
    clinical: ["CLR: pending pathway portfolio (Gate G2)"]
    safety: [SAF-0035, SAF-0041, SAF-0027, SAF-0020, SAF-0023, SAF-0006, SAF-0019, SAF-0022, SAF-0017]
  hazards: [HAZ-0036, HAZ-0044]
  tests: ["TST: pending test architecture"]
  validations: [VAL-0006, VAL-0007, VAL-0008, VAL-0009, VAL-0010]
  adrs:
    depends_on: [ADR-0004]
    feeds: [ADR-0007, ADR-0008]
  gates: [G2]
  evidence:
    - docs/02-users-and-workflows/g1-validation-backlog.md
    - docs/01-vision-and-intended-use/intended-use-statement.md
    - docs/05-clinical-safety/hazard-log.md
    - docs/05-clinical-safety/safety-requirements.md
    - docs/05-clinical-safety/evaluation-status-semantics.md
    - docs/05-clinical-safety/legacy-review/ews/shared-findings.md
    - docs/05-clinical-safety/legacy-review/sepsis-scores/sofa-review.md
    - docs/08-interoperability/amh-data/compatibility-finding.md
    - docs/08-interoperability/amh-data/identity-adjudication/interim-identity-policy.md
    - docs/08-interoperability/amh-data/identity-adjudication/adjudicacao-decisoes-2026-08-15.md

supersedes: null
superseded_by: null

provenance:
  source_repo: intensicare-V2
  path_or_url: docs/06-architecture/adrs/ADR-0027-age-and-population-gating-enforcement.md
  commit_sha_or_version: ddac9bc (repo HEAD at authoring, branch cycle-1/clinical-content; this file is uncommitted)
  section_or_lines: >
    g1-validation-backlog.md §B (VAL-0006, VAL-0007, VAL-0008, VAL-0009, VAL-0010);
    intended-use-statement.md §3 (IU-05, IU-06, IU-07); hazard-log.md HAZ-0036, HAZ-0044;
    safety-requirements.md SAF-0035, SAF-0041; evaluation-status-semantics.md §3.3;
    ews/shared-findings.md SF-6; sepsis-scores/sofa-review.md row 010 and §7;
    compatibility-finding.md §3; identity-adjudication/interim-identity-policy.md IDP-06,
    IDP-11; identity-adjudication/adjudicacao-decisoes-2026-08-15.md §2 (AQ-1..AQ-6)
  date_collected: 2026-08-15
  collector: age/population gating-enforcement ADR author (IntensiCare V2, cycle 1, Task 4)
  transformation: >
    reasoned-from — enforcement options and drivers derived from cited V2 governance,
    clinical-safety, intended-use, legacy-review and interoperability artifacts. This
    ADR performed no independent clinical verification and minted no new HAZ, SAF, VAL,
    DOM, or QAS ID; it cites existing ones. It did not re-verify the AMH FHIR IG's
    Patient profile directly (see E13, an INFERENCE from an absence).
  confidence: medium
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
---

# ADR-0027 — Age and population gating enforcement for adult-validated clinical instruments

> **Status: `accepted (2026-08-15, GDEC-0007)`.** O revisor clínico nomeado
> (rodaquino-OMNI, GDEC-0003) decidiu, por escrito, em sessão de 2026-08-15
> (transcrição-mestre: `decision-register.md` GDEC-0007), o locus de enforcement
> (Option A), a política de gravidez, o gate de care-setting, os quatro carve-outs de
> subpopulação e a adoção do híbrido A+B+C como emenda — ver §5.0 para o registro por
> questão (A27-1 a A27-7). O valor concreto do limiar etário passa a ser **≥18
> produto-wide**, com pisos por instrumento (ex.: NEWS2 ≥16) registrados porém
> **inativos**. A contratação de fonte demográfica confiável (C8) e a verificação de
> engenharia do ponto único de avaliação (C6/A27-5) permanecem `VALIDATION REQUIRED` e
> não são fechadas por esta aceitação.

---

## 1. Context and problem statement

IntensiCare V2's legacy predecessor computed adult-validated early-warning and organ-
dysfunction scores (NEWS2, MEWS, SOFA, qSOFA) with **no age, pregnancy, or care-setting
gating anywhere in the scoring or ingestion path** — SOURCE, the legacy EWS review's
cross-score finding SF-6 (`legacy-review/ews/shared-findings.md`): "no age, pregnancy, or
care-setting gating exists anywhere in either scoring path; the ingestion schema carries
no date of birth or age field at all." NEWS2 is, on its publisher's own terms, "designed
for use in patients aged 16 years and more and is not recommended for use in children
aged under 16 years or during pregnancy" (SOURCE, RCP 2017 report §2, quoted in
`shared-findings.md` SF-6 and `legacy-review/ews/news2-review.md:163`); MEWS derives from
an adult medical-admissions cohort (Subbe 2001). The SOFA legacy review independently
confirms age handling was out of that instrument's own scope and "relevant only to
population gating (VAL-0006/0007)" (`legacy-review/sepsis-scores/sofa-review.md` row
010), and states plainly that SOFA's absent-input evaluation-status algebra "feeds
ADR-0008 directly" — this ADR is the population-boundary analogue of that same open
question.

**IntensiCare V2's own intended-use drafting inherits, and sharpens, the same boundary.**
`intended-use-statement.md` proposes an adult-only population (IU-05, threshold ≥18 as a
**drafting placeholder, not a clinical recommendation**) but flags paediatric/neonatal
inclusion as a **BLOCKING DECISION** (IU-06): "it is not sufficient to declare
paediatric/neonatal 'out of scope' in prose. The scope boundary must be **enforced in the
system's behaviour**." IU-06 further records, as the mechanism this ADR exists to
address: "V2 must be able to determine, from trusted identity/encounter data, whether a
patient is inside the approved population, and must render an explicit non-evaluation
… when they are outside it or when age is unknown." IU-07 records four further
sub-populations as **neither included nor excluded by any evidence reviewed**: pregnancy/
obstetric critical care, extracorporeal support (ECMO/CRRT), post-cardiac-surgical
patients, and patients under documented goals-of-care restriction.

`g1-validation-backlog.md` records the same boundary as two BLOCKING items —
**VAL-0006** ("Is the paediatric population in scope for V2 v1?") and **VAL-0007** ("Is
the neonatal population in scope for V2 v1?") — plus two dependent, also-BLOCKING items:
**VAL-0008** ("What must V2 do when a patient is outside the approved population, or
their age is unknown, unparseable, or conflicting?") and **VAL-0010** (sub-population
exclusion, citing the palliative case as materially distinct because "V2 could be
technically correct and clinically wrong").

`hazard-log.md` **HAZ-0036** names the concrete failure mechanism: "adult-instrument
logic evaluating a paediatric or unknown-age patient because population gating cannot be
enforced from trusted data, **since no trusted age source exists**" (severity S4,
likelihood L3, classified Unacceptable). `safety-requirements.md` **SAF-0035** already
states the requirement this ADR must give an architecture to: "The system MUST enforce
the approved intended use — population, care setting, exclusions — and MUST refuse to
evaluate outside it with an explicit `not_evaluated` reason rather than producing a
result." `evaluation-status-semantics.md` §3.3 already lists "the subject is outside the
approved population or setting (SAF-0035)" as one of the entry conditions for
`not_evaluated`, and states the general fallback: "any condition not explicitly covered
by this specification resolves to `not_evaluated` … There is no 'unknown → assume fine'
path." **This is consistent with, and is the population-specific instance of,
orchestrator-prompt non-negotiable rule 7** (cited in this repository as DOM-0004:
"Never coerce missing, stale, invalid, partial, conflicting, or unevaluable clinical data
to zero, normal, no-risk, or silent no-fire").

**Why "no trusted age source" is not a rhetorical flourish.** The AMH identity
adjudication of 2026-08-15 (`adjudicacao-decisoes-2026-08-15.md` §2, decisions AQ-1
through AQ-6) resolved MPI scope, the wire identity element, the legal-basis/consent
gate for the clinical loop, the boundary identifier (`portable_subject_ref`), identity
lifecycle events, and tenant/cross-tenant bypass — **none of the six decisions
addresses age, date of birth, or any other demographic gating attribute.**
`ADR-0004` (identity/encounter/MPI, drafted concurrently this cycle) likewise contains no
age-related content (grep across its full text, 2026-08-15). §2.1 E13 below records that
no document in this repository's AMH evidence corpus discusses `Patient.birthDate` or age
at all. IU-06's finding that "no trusted age source exists" is therefore not merely
asserted by this ADR; it is consistent with every AMH-side artifact this program has
produced to date, none of which mentions the attribute.

**Question.** Where, in the system, and by what mechanism, does IntensiCare V2 enforce
that an adult-validated clinical instrument never evaluates a patient whose age is
unknown or outside the instrument's validated range — and what does the system do,
concretely, in the absence of a trusted age source?

**Out of scope for this ADR** (each named to prevent scope creep):

- **Whether paediatric or neonatal populations are in scope for V2 v1 at all.** That is
  VAL-0006/VAL-0007, a clinical decision for `AUTH-INTENDED-USE` + `AUTH-CLINSAFETY`,
  not an architecture question. This ADR is written to be correct **regardless of how
  VAL-0006/VAL-0007 resolve** — see §8.2 T1.
- **The specific age threshold value(s).** IU-05's ≥18 is a placeholder; NEWS2's ≥16
  RCP boundary is cited in §4 as a concrete per-rule example for the reviewer, not
  adopted. Setting the actual threshold(s) is a clinical decision.
- **Where the trusted age/population source itself comes from** (AMH `Patient.birthDate`
  if and when it exists on the wire, a non-AMH registration system, manual clinician
  attestation, or another source). That is a data-sourcing/contract question for
  `AUTH-DATA-PLATFORM`, adjacent to but distinct from `ADR-0001`'s boundary question.
  This ADR treats "no trusted source exists today" as a fact to design around, not a
  question it resolves.
- **Evaluation-status semantics as a general algebra** (`valid`/`partial`/`not_evaluated`/
  `stale`/`invalid`) — that is `ADR-0008`, drafted concurrently. This ADR consumes
  `not_evaluated` as already defined in `evaluation-status-semantics.md` §3.3 and adds no
  new status value; it decides only where and how the population-outside-scope entry
  condition is evaluated and enforced.
- **Rule bundle format, signing, and approval workflow** — `ADR-0007`. This ADR states
  that population fields must exist in the bundle schema (§4) but does not design that
  schema.
- **The goals-of-care/palliative escalation-suppression *policy*** — that is HAZ-0044's
  own resolution, for which SAF-0041 already states the shape ("unknown never means
  unrestricted"). This ADR treats palliative/goals-of-care only as a **named carve-out
  category** requiring its own gate (§4), not as a policy to author.

---

## 2. Evidence and assumptions

### 2.1 Evidence

**Epistemic note.** This ADR did not re-verify any AMH artifact independently; AMH-derived
statements are labeled `SOURCE` because they cite documents produced by other specialists
at pinned commits, per `evidence-notation.md` §2 ("only the agent that performed a
verification may label it `OBSERVED`").

| # | Label | Statement | Source | Confidence |
|---|---|---|---|---|
| E1 | SOURCE | VAL-0006 and VAL-0007 (paediatric and neonatal population scope) are both flagged 🚩 and marked **BLOCKING** against `intended-use-statement.md` IU-06. | `g1-validation-backlog.md` §B, rows VAL-0006, VAL-0007 | high |
| E2 | SOURCE | VAL-0008 ("What must V2 do when a patient is outside the approved population, or their age is unknown, unparseable, or conflicting?") is BLOCKING and explicitly states "Prose exclusion is not enforcement." | `g1-validation-backlog.md` §B, row VAL-0008 | high |
| E3 | SOURCE | IU-06 is a named **BLOCKING DECISION**: paediatric/neonatal in-scope status is UNDECIDED, and so is system behaviour when age/DOB is missing, unparseable, or conflicting. The document's own PROPOSAL (pending the blocking decision) is that an out-of-population or unknown-age patient must render an explicit non-evaluated state, never a score, never `normal`. | `intended-use-statement.md` IU-06 | high |
| E4 | SOURCE | IU-05 proposes adults (placeholder threshold ≥18) as the initial population; the document states explicitly the threshold "is a drafting placeholder, not a clinical recommendation," and how it interacts with adolescents in adult ICUs is unset. | `intended-use-statement.md` IU-05 | high |
| E5 | SOURCE | IU-07: pregnancy/obstetric, ECMO/CRRT, post-cardiac-surgical, and palliative/treatment-limitation sub-populations are **neither included nor excluded** by any evidence reviewed; the palliative case is flagged as materially different because the system "could be technically correct and clinically wrong." | `intended-use-statement.md` IU-07 | high |
| E6 | SOURCE | HAZ-0036 names the mechanism: adult-instrument logic evaluating a paediatric or unknown-age patient "because population gating cannot be enforced from trusted data, since no trusted age source exists." Severity S4, likelihood L3, classification Unacceptable. Candidate controls SAF-0035, SAF-0027, SAF-0020, SAF-0023. | `hazard-log.md` HAZ-0036 | high |
| E7 | SOURCE | HAZ-0044: an escalation work item generated for a palliative/treatment-limitation/goals-of-care patient because care-goal context is not an input to evaluation or routing — "technically correct by the rule and clinically wrong for this patient." Explicitly recorded as **not** an intended-use violation today (IU-07's sub-populations are undecided, not excluded) and therefore distinct from HAZ-0036. Severity S3, likelihood L4, classification Undesirable. | `hazard-log.md` HAZ-0044 | high |
| E8 | SOURCE | SAF-0035: "A pathway MUST be non-actioning … until it has passed its portfolio gate (G2) and its source-eligibility gate (G3). The system MUST enforce the approved intended use — population, care setting, exclusions — and MUST refuse to evaluate outside it with an explicit `not_evaluated` reason rather than producing a result." | `safety-requirements.md` SAF-0035 | high |
| E9 | SOURCE | SAF-0041: goals-of-care/treatment-limitation context "MUST be a first-class, provenance-carrying input"; where absent/stale/unverifiable "the system MUST NOT infer 'no restriction'" — it must mark the context explicitly unknown and follow an approved default, "which is a clinical decision, not an engineering default." | `safety-requirements.md` SAF-0041 | high |
| E10 | SOURCE | `evaluation-status-semantics.md` §3.3 already lists "the subject is outside the approved population or setting (SAF-0035)" as a `not_evaluated` entry condition, and states the fallback rule: any condition not explicitly covered resolves to `not_evaluated` with reason `unspecified_condition` — "There is no 'unknown → assume fine' path." | `evaluation-status-semantics.md` §3.3 | high |
| E11 | SOURCE | Legacy EWS finding SF-6: OBSERVED (by the legacy-review specialist) that neither `news2.py` nor `mews.py`, nor the vitals ingestion schema, carries any age, pregnancy, or care-setting gate; NEWS2's own publisher scopes it to ≥16 years and not during pregnancy (RCP 2017 §2). | `legacy-review/ews/shared-findings.md` SF-6 | high |
| E12 | SOURCE | SOFA legacy review: age handling in the trilhas lineage was assessed "DISCREPANCY, low" and judged "out of SOFA scope; relevant only to population gating (VAL-0006/0007)"; separately, the review states SOFA's own absent-input evaluation-status handling "feeds ADR-0008 directly," establishing the concurrent-authorship relationship this ADR shares with ADR-0008. | `legacy-review/sepsis-scores/sofa-review.md` row 010, §7 | high |
| E13 | INFERENCE | No document in `docs/08-interoperability/amh-data/` (the full pinned AMH evidence corpus) discusses `Patient.birthDate`, date of birth, or age (grep, 2026-08-15). This is consistent with, but does not independently confirm, IU-06's "no trusted age source exists" finding — this ADR did not itself re-verify the AMH FHIR IG's `Patient` profile. | absence of matches across `docs/08-interoperability/amh-data/**/*.md`, 2026-08-15 collection | medium |
| E14 | SOURCE | The AMH identity adjudication of 2026-08-15 resolved six identity/tenant/consent questions (AQ-1 MPI scope, AQ-2 wire identity element, AQ-3 legal basis/consent gate, AQ-4 boundary identifier, AQ-5 identity lifecycle events, AQ-6 tenant enumeration/bypass). None addresses age or any other demographic gating attribute. | `identity-adjudication/adjudicacao-decisoes-2026-08-15.md` §2 | high |
| E15 | SOURCE | The interim identity policy's fail-closed pattern (IDP-06: unresolved identity → `not_evaluated`, counted, never a value; IDP-11: every listed missing/mismatched/unverifiable condition is a denial, counted, logged, visible; no global "degraded mode = permissive" path may exist) is architecturally the same shape this ADR proposes to apply to age/population instead of identity. | `identity-adjudication/interim-identity-policy.md` IDP-06, IDP-11 | high |
| E16 | SOURCE | DOM-0004 (domain invariant): "Whenever a required input, observation, or evaluation precondition is missing, stale, invalid, partial, conflicting, or otherwise unevaluable, the system must [not coerce it] … not at risk." Sourced to `PROMPT:119` / orchestrator-prompt non-negotiable rule 7. | `docs/03-domain/invariants/DOM-invariants.md` DOM-0004 | high |

### 2.2 Assumptions

Each assumption must be filed in `docs/00-governance/registers/assumptions-register.md`
with an `ASM-xxxx` ID. **This ADR does not mint `ASM` IDs.**

| # | Assumption | Why it is needed | What invalidates it | Owner | Register status |
|---|---|---|---|---|---|
| A1 | At least one adult-validated instrument (NEWS2, MEWS, SOFA, qSOFA, or a V2-authored equivalent) survives Gate G2 clinical-pathway approval and is intended for `actionable` mode. | If no instrument is ever `actionable`, this ADR's enforcement locus has nothing to gate and the question is moot until it does. | Gate G2 approving a portfolio with zero adult-instrument pathways in `actionable` mode. | UNASSIGNED — VALIDATION REQUIRED | to be filed |
| A2 | No trusted age/population source will exist at V1 launch. | Drives the "every instrument is `not_evaluated` until a source is contracted" consequence in §4 and §6. | A contracted, populated, provenance-bearing demographic source (AMH or otherwise) landing before V1 launch. | UNASSIGNED — VALIDATION REQUIRED | to be filed |
| A3 | VAL-0006/VAL-0007 (paediatric/neonatal scope) will be decided before any adult-instrument pathway reaches `actionable` mode. | If false, an adult instrument could reach G2/G3 readiness while the population it must exclude is still undefined, which this ADR's gate alone cannot repair. | Gate G2 approving a pathway to `actionable` mode while VAL-0006/VAL-0007 remain OPEN. | UNASSIGNED — VALIDATION REQUIRED | to be filed |
| A4 | The rule-evaluation runtime (subject of `ADR-0002`'s modular-monolith baseline) has a single point through which every clinical evaluation request passes before rule logic executes. | Option A (§4) requires this; if evaluation entry points are architecturally plural and cannot be unified, Option A's "single choke point" claim weakens to "one choke point per entry path." | `ADR-0002` or its successor establishing multiple independent, unmediated evaluation entry points. | UNASSIGNED — VALIDATION REQUIRED | to be filed |
| A5 | A CRV (clinical reference vector) / replay corpus, per `clinical-reference-vector-standard.md`, will exist and be queryable for "did any evaluation with unknown/out-of-range age produce a non-`not_evaluated` status" before Gate G6/G8. | Drives the measurable D4 driver in §3 ("zero evaluations with unknown age in the CRV/replay corpus"). | No CRV corpus, or a CRV corpus that does not carry age/population fields per vector. | UNASSIGNED — VALIDATION REQUIRED | to be filed |

### 2.3 Hypotheses to test

| # | Hypothesis | How it would be tested | Who tests it | Current status |
|---|---|---|---|---|
| H1 | A single runtime pre-evaluation gate (Option A) can enforce population/age boundaries for every rule bundle without per-bundle duplication drift. | Static analysis of the rule engine's call graph: prove every evaluation invocation passes through the gate; adversarial test that a bundle authored without a population declaration cannot reach evaluation. | Rule-runtime engineer + safety-focused test architecture engineer | **UNTESTED** — no rule runtime exists yet |
| H2 | Declaring "every instrument is `not_evaluated` until a trusted demographic source is contracted" (§4, driver D2) is an acceptable availability cost relative to the safety benefit. | Measured `not_evaluated` prevalence (QAS-0007) against a clinically set tolerance, once a portfolio and a trusted-source timeline exist. | `AUTH-CLINSAFETY` + `AUTH-PRODUCT` | **UNTESTED and a clinical/product judgment, not an engineering measurement** |
| H3 | Unknown-pregnancy status can be handled identically to unknown age (fail-closed) without materially different availability cost. | Compare measured population-source completeness for age vs. pregnancy status once a trusted source exists; if pregnancy status is systematically less obtainable than age, fail-closed pregnancy gating would produce disproportionately more `not_evaluated` states. | `AUTH-CLINSAFETY` + `AUTH-DATA-PLATFORM` | **UNTESTED** — no data source exists for either attribute today |

---

## 3. Decision drivers and measurable quality attributes

Targets are `VALIDATION REQUIRED` — no numeric target is invented here (Gate G1 has not
validated any).

| # | Driver | Why it discriminates between the options | Measurable quality attribute | Target |
|---|---|---|---|---|
| D1 | **Safety — the enforcement invariant holds with no gap.** No adult-validated instrument produces a `valid`/`partial` result for a patient whose age is unknown, unparseable, conflicting, or out of range. | This is the driver the whole ADR exists to serve (HAZ-0036, SAF-0035). Options differ in how many places must independently get this right, and therefore how easy the invariant is to break by omission. | QAS-0017 (safety state precedes severity) | VALIDATION REQUIRED |
| D2 | **Dependency on a trusted demographic source that does not exist today.** E13/E14 establish no trusted age source exists at the pinned evidence snapshot. Every option must state, honestly, what it does with zero trusted input — which for all options today is the actual, current condition. | No option can make a source exist; options differ only in whether the *absence* is enforced loudly or silently. | QAS-0007 (data-condition prevalence and visibility) | VALIDATION REQUIRED |
| D3 | **Availability cost.** A correctly enforced gate against a nonexistent trusted source means every instrument that requires population confirmation is `not_evaluated` at launch. This is the honest tension against D1: a system that is maximally safe against out-of-population harm and produces zero clinical value is not a good outcome either — SAF-0035 requires refusal, not that the refusal be free. | QAS-0023 (explicit degraded mode); QAS-0007 | VALIDATION REQUIRED |
| D4 | **Consistency and testability — one enforcement locus vs. many.** Options differ in how many code paths must independently implement the same predicate, and how completely adversarial/negative testing (CRV vectors, replay corpus) can cover all of them. A measurable target once a runtime and a CRV corpus exist: zero evaluations with unknown/out-of-range age in the CRV/replay corpus produce a non-`not_evaluated` status; 100% of rule bundles declare a population scope. | QAS-0007; TST: pending test architecture | VALIDATION REQUIRED |
| D5 | **Sub-population completeness.** Age is only one axis. Pregnancy, care setting, and the named carve-outs (ECMO/CRRT, post-cardiac-surgical, palliative/goals-of-care) are distinct gates with distinct data availability and distinct failure modes (HAZ-0044 is not HAZ-0036). An option that only handles age is incomplete by construction. | *No scenario yet* — candidate new QAS for population/sub-population coverage completeness, owner: quality-attribute steward (not yet activated) | VALIDATION REQUIRED |
| D6 | **Reversibility as scope expands.** VAL-0006/VAL-0007 may eventually admit paediatric or neonatal populations with their own validated instruments. Options differ in how expensive it is to widen the gate from "adult-only" to "adult-or-paediatric-with-instrument-X" without re-touching every rule bundle. | QAS-0027 (reversibility and exit cost) | VALIDATION REQUIRED |
| D7 | **Auditability of the gating decision itself.** Every admit and every reject must be a durable, explainable record (SAF-0019, SAF-0023) — a gate that silently drops a request is itself a new hazard (cf. IDP-11's "no configuration makes any denial permissive" and "never treated as evidence of absence"). | QAS-0019 (provenance and correction integrity) | VALIDATION REQUIRED |

**Excluded as non-discriminating:** "the gate checks age" — every option does this; what
discriminates is *where* and *how consistently*.

---

## 4. Alternatives considered

At least two viable alternatives plus "defer / do nothing." Before the enforcement-locus
options can be compared, the *content* a gate evaluates must be named — this vocabulary
is reviewer-facing and left open, not a decision.

### 4.0 Gating vocabulary per rule bundle

**Age range.** Each rule bundle (or each instrument the bundle implements) needs a
declared valid age range. **Example, not a decision:** NEWS2's own validated range is
≥16 years, per its publisher (RCP 2017 §2, E11) — a **different** boundary from
`intended-use-statement.md` IU-05's placeholder ≥18 for V2's overall population
proposal. **This is exactly the kind of per-rule decision this ADR flags for the
reviewer rather than resolves**: if V2 admits adults ≥18 but a specific instrument
inside that population was validated down to 16, is the *instrument's* range or the
*product's* population boundary authoritative for a 17-year-old admitted to an adult
ICU? Recorded as open question 1 in §11.1; not decided here.

**Pregnancy status handling.** Two positions are argued honestly, because the evidence
does not settle between them:

- **Argument for fail-closed** (unknown pregnancy → `not_evaluated`, same as unknown
  age). NEWS2 is explicitly "not recommended for use … during pregnancy" (E11);
  pregnancy materially changes several vital-sign baselines the score assumes. Treating
  unknown pregnancy status identically to unknown age is the simplest rule to state,
  test, and audit, and is consistent with DOM-0004/rule 7's general posture.
- **Argument for flagged-but-not-blocking** (unknown pregnancy → evaluated with a
  visible caveat, not `not_evaluated`). Pregnancy status may be systematically less
  reliably obtainable than age even once a trusted demographic source exists (age is
  often on an identity document; pregnancy status is a clinical fact requiring active
  ascertainment) — H3 in §2.3 names this directly. A fail-closed pregnancy gate risks a
  disproportionately high `not_evaluated` rate that could itself become a habituation
  hazard (cf. HAZ-0043's "permanent `not_evaluated` read as reassuring quiet").
- **Recommendation (PROPOSAL, not decided):** fail-closed for consistency with the age
  gate and with rule 7's spirit, **unless and until** a measured pregnancy-status
  completeness rate (H3) demonstrates the availability cost is materially worse than
  age's — at which point a flagged-non-blocking exception would need its own hazard
  analysis and clinical sign-off, not a silent default change.

**Care-setting gate.** `intended-use-statement.md` IU-03 proposes ICU-only as the
initial setting, with step-down/ward/RRT/command-centre all recorded UNDECIDED
(IU-04a–f). The same enforcement question this ADR raises for age applies identically
to care setting: whichever locus enforces age must also be able to enforce setting,
from the same trusted-source dependency problem (a care-setting attribute needs a
provenance source too). This ADR treats care-setting gating as **structurally the same
problem as age gating** and assumes (A4-adjacent) that both are enforced through the
same locus, not through separate mechanisms — but does not itself decide the setting
boundary.

**Named sub-population carve-outs**, left explicitly to the reviewer, each requiring
its own clinical decision per IU-07 and, where a hazard already exists, cross-referenced
to it:

- **Pregnancy/obstetric critical care** — above.
- **Extracorporeal support (ECMO/CRRT)** — physiology may invalidate score assumptions
  (IU-07); no hazard row currently names this mechanism specifically. **Flagged as a
  reviewer decision, not decided here.**
- **Post-operative cardiac surgical patients** — protocol-expected physiological
  derangement may make an otherwise-abnormal score clinically expected (IU-07).
  **Flagged as a reviewer decision, not decided here.**
- **Palliative / goals-of-care / documented treatment-limitation** — cross-references
  **HAZ-0044** and **SAF-0041** directly. This is the one carve-out with an existing
  safety requirement (SAF-0041: unknown care-goal context must never resolve to
  "unrestricted"), but SAF-0041 itself states "the policy itself, and the default when
  context is unknown, MUST be set by clinical governance. This agent proposes no
  default" — and this ADR does not either. What this ADR does assert: **the palliative
  carve-out is a distinct gate from the age/population gate**, because IU-07 records it
  as "neither included nor excluded" (an open scope question) rather than as an
  excluded population the way paediatric is proposed to be (IU-06) — conflating the two
  would, per E7, assert an exclusion nobody approved.

### Option A — Runtime pre-evaluation gate in the rule engine (single choke point)

**Description.** A dedicated gating component sits between "an evaluation request is
accepted" and "a rule bundle executes." It receives the resolved subject/encounter
context (from the identity/PSR layer `ADR-0004` establishes) plus each candidate rule
bundle's declared population metadata (age range, pregnancy handling, care-setting scope,
sub-population exclusions — the bundle-schema fields `ADR-0007` would need to add), and
either admits the evaluation or returns `not_evaluated` with a machine-readable reason
before any rule logic runs. No rule bundle can bypass it, because bundles do not have an
alternative entry point into evaluation (A4).

**How it answers each driver.**

- D1: **Strongest.** One component to get right, one component to test adversarially,
  one place a missing-source condition is guaranteed to be checked before any clinical
  logic sees the request.
- D2: The gate is the natural place to encode "no trusted source → deny," making the
  dependency explicit and centrally visible rather than scattered.
- D3: Because it is centralized, the *volume* of `not_evaluated` output is easy to
  measure and report as one number (QAS-0007) — visible cost, not hidden cost.
- D4: Directly targets the measurable target in D4 — one code path to prove closed by
  static analysis plus adversarial tests, rather than N per-bundle implementations to
  audit individually.
- D5: A single gate can be extended with additional sub-population predicates (pregnancy,
  setting, carve-outs) without touching every bundle's own logic — but this also means
  the gate component grows in complexity as sub-population rules accumulate, which is a
  real negative consequence, not a free extension.
- D6: Widening the gate (e.g., admitting a validated paediatric instrument) is a change
  in one place plus new bundle metadata, not a re-audit of every existing bundle.
- D7: A single choke point is also a single place to guarantee the audit record is
  produced — but also a single point whose own failure (a bug, a bypass, a missing
  metadata field defaulting the wrong way) affects every bundle at once. **This
  concentration risk is the honest negative this option carries and Option B does not.**

**Positive consequences.** Testable as one component; a missing-metadata bundle fails
closed by construction rather than by every bundle author remembering to check; the
`not_evaluated` volume this produces is a single, reportable number; widening or
narrowing the population boundary is a configuration/metadata change, not a rule-logic
rewrite.

**Negative consequences.** A single point of failure for every clinical pathway at once —
a defect here is not isolated to one instrument the way a per-rule bug would be; requires
the rule-engine architecture (`ADR-0002` successor work) to guarantee there is in fact
only one evaluation entry point (A4), which is not yet established; adds a mandatory hop
to every evaluation, with a latency cost this ADR does not measure; the gate's own
correctness becomes as safety-critical as the rules it gates, which raises its own bar for
independent verification (SAF-0037) rather than lowering the overall verification burden.

**What would have to be true for this to be the right answer.** A4 holds (one evaluation
entry point); `ADR-0007`'s bundle schema can carry population metadata; the gate component
itself receives at least the same level of adversarial testing rigor as a rule bundle
would (otherwise D1's "strongest" claim is not earned, only assumed).

**Exit cost if chosen and later reversed.** Low-to-moderate: the gate is a well-bounded
component behind a clear interface; removing or replacing it does not require touching
rule-bundle content, only the call site(s) that invoke it.

### Option B — Per-rule predicate duplication in each bundle

**Description.** Every rule bundle carries its own population-gating logic as part of its
own predicate/precondition set — no shared component; each bundle author (and each
clinical approver of that bundle) is independently responsible for checking age, pregnancy,
setting, and carve-outs before the bundle's clinical logic executes.

**How it answers each driver.**

- D1: **Weakest.** The invariant holds only if every bundle author gets it right every
  time; a new bundle that forgets the check is a silent regression the architecture does
  nothing to prevent. This is structurally the same failure mode SF-6 documents for the
  legacy system — gating logic that exists nowhere is trivially "duplicated nowhere."
- D2: The "no trusted source" dependency must be independently encoded — and
  independently kept correct — in every bundle.
- D3: `not_evaluated` volume is scattered across bundles; measuring the aggregate
  availability cost (D3) requires aggregating N independent implementations rather than
  reading one component's output.
- D4: Cannot meet the D4 measurable target ("100% of bundles declare population") by
  construction alone — declaration and enforcement are the same act here, so there is no
  independent check that a bundle's self-declared gate is actually correct.
- D5: Sub-population predicates would need to be copied (or, worse, subtly
  re-implemented differently) into every bundle that needs them — a direct amplifier of
  drift risk.
- D6: Widening scope means touching every existing bundle's predicate, not one
  component's metadata.
- D7: Audit records depend on every bundle independently producing them consistently.

**Positive consequences.** No dependency on a single shared component's correctness or
availability; a bundle author has full local context about exactly which populations
their specific instrument was validated for, which could in principle produce
*more* clinically precise per-instrument gating than a generic shared gate (e.g., NEWS2's
own ≥16 boundary vs. a product-wide ≥18) — this is a real strength Option A does not
have unless its metadata schema is equally expressive.

**Negative consequences.** No architectural guarantee against omission; the exact defect
class HAZ-0036 and SF-6 already document as having occurred in the legacy system;
inconsistent enforcement across bundles is a foreseeable outcome, not a remote risk;
testing completeness requires N independent adversarial test suites rather than one.

**What would have to be true for this to be the right answer.** Per-instrument gating
precision (e.g., honoring NEWS2's ≥16 vs. a coarser product-wide boundary) is judged by
`AUTH-CLINSAFETY` to matter more than the omission risk — and a compensating control
(e.g., a mandatory schema-level population field checked by CI, short of a runtime gate)
closes the gap D1 otherwise leaves open.

**Exit cost if chosen and later reversed.** Moderate-to-high: consolidating N
independently-authored predicates into a shared gate later requires auditing every
bundle's existing logic for behavioral drift before consolidation, not just adding a new
component.

### Option C — Ingestion-side population tagging only

**Description.** Population/demographic attributes are validated and tagged once, at
ingestion (the anti-corruption layer `ADR-0001`/`ADR-0004` establish), producing a
population-scope attribute on the canonical subject/encounter record. No separate
evaluation-time gate exists; rule bundles (or their runtime) are trusted to read and
honor the tag.

**How it answers each driver.**

- D1: Depends entirely on every consumer of the tag actually checking it — this is
  Option B's enforcement gap relocated from "per rule bundle" to "per consumer of the
  tag," which does not close it, only moves it. A tag that exists but is not
  authoritatively *enforced* at evaluation time is not different in kind from IU-06's
  "prose exclusion is not enforcement" finding about a population statement that isn't
  behaviorally binding.
- D2: The "no trusted source" problem is visible exactly once, at ingestion — which is a
  genuine strength: a single measurable "fraction of ingested subjects with an
  unresolved population tag" number exists from day one.
- D3: Because tagging happens regardless of whether any instrument later checks it,
  ingestion-side tagging *alone* does not by itself produce any `not_evaluated` states —
  it produces data that downstream logic *could* use to produce them, which is a
  meaningfully weaker safety property than D1 requires.
- D4: A tag's mere existence is not evidence of enforcement; the CRV/replay-corpus
  measurable target in D4 ("zero evaluations with unknown age produce a non-`not_evaluated`
  status") is not satisfied by tagging alone — it requires *something* downstream to act
  on the tag, which returns to either Option A or Option B for the enforcement half.
- D5/D6/D7: Same structural gap as D1 — tagging is a necessary precondition for any of
  these, not a sufficient mechanism for any of them.

**Positive consequences.** Centralizes *measurement* of the trusted-source problem at the
earliest possible point; the tag is reusable by any future consumer (analytics,
reconciliation, a future paediatric pathway) without re-deriving population scope;
cheaper to build than a full runtime gate.

**Negative consequences.** **Does not, by itself, satisfy SAF-0035's "MUST refuse to
evaluate"** — it produces information a refusal mechanism could use, but is not itself
that mechanism. Presenting Option C as sufficient on its own would be the same category
of error IU-06 already names ("prose exclusion is not enforcement," here becoming "data
tag is not enforcement"). Recorded here honestly as the weakest option against D1,
**not** because ingestion-side tagging is worthless — it is a necessary component under
every option — but because it cannot be the *only* enforcement locus without leaving the
core invariant unenforced.

**What would have to be true for this to be the right answer.** Only if paired with a
mandatory, independently-verified downstream consumer contract (which would then, in
substance, be Option A or Option B wearing a different name) — as a **standalone**
option, no evidence reviewed supports it satisfying D1.

**Exit cost if chosen and later reversed.** Low: the tag itself survives as useful data
under any of the other options; only the (absent) enforcement half would need building.

### Option Z — Defer / do nothing

**Description.** Record no enforcement-locus decision. Every rule bundle proceeds through
Gate G2/G7 design without a designed population-gating mechanism, on the understanding
that SAF-0035 already exists as a requirement and will presumably be satisfied by
whichever component ends up implementing evaluation.

**Positive consequences.** No premature architectural commitment while `ADR-0002`'s
successor work and `ADR-0007`'s bundle schema are still undesigned (A4 unresolved); no
decision is made without a named clinical/architecture authority.

**Negative consequences.** SAF-0035 is a **hazard-controlling requirement for an
Unacceptable-classified hazard (HAZ-0036)** with no design proposal at all; deferring
past the point a first rule bundle is authored risks exactly the outcome SF-6 documents
for the legacy system — gating logic that nobody designed and that therefore does not
exist. **This is a materially worse deferral posture than `ADR-0001`'s** (which defers a
platform-boundary choice while explicitly keeping the AMH adapter behind a port to
preserve reversibility): there is no equivalent "keep it behind a port" holding pattern
for an *absent* gate — the absence itself is the hazard.

**Cost of delay.** Rises sharply and immediately, not at some future gate: any rule
bundle authored before this ADR resolves is authored without a designed enforcement
locus to call, which is the precise condition HAZ-0036 describes as Unacceptable.

### 4.1 Comparison against drivers

| Driver | A — runtime gate | B — per-rule duplication | C — ingestion tagging only | Z — defer |
|---|---|---|---|---|
| D1 safety invariant | Strong — one enforced choke point | Weak — depends on every author | Weak alone — tag ≠ enforcement | None — no design exists |
| D2 source dependency | Explicit, centrally visible | Scattered, independently encoded | Visible at ingestion; not enforced | Unaddressed |
| D3 availability cost | Measurable as one number | Scattered across bundles | No `not_evaluated` produced by tagging alone | Unmeasured |
| D4 consistency/testability | One code path to prove closed | N independent suites | Necessary but not sufficient | n/a |
| D5 sub-population completeness | Extensible in one place, growing complexity | Copied/drifted per bundle | Data available; no enforcement | n/a |
| D6 reversibility | Metadata change | Re-audit every bundle | Tag persists; enforcement still needed | Zero now, hazard rises immediately |
| D7 auditability | One place to guarantee records | Depends on every bundle | Depends on downstream consumer | n/a |

**Decision (GDEC-0007, 2026-08-15): Option A**, with the hybrid noted below adopted as
an amendment (A27-6) rather than a fourth analyzed option — see §5.0. Argument
originally offered as recommendation, now decision: Option A most directly
answers D1, which is the driver every other driver is subordinate to given HAZ-0036's
Unacceptable classification — but Option A's own honest weakness (D1's concentration
risk, and A4's dependency on an evaluation-runtime property not yet established by
`ADR-0002`'s successor work) means it is not free of risk, only differently shaped from
Option B's. **A hybrid is visible and not evaluated in full here**: Option A as the
enforced choke point, with Option C's ingestion-side tagging as its data source (not as a
substitute for it), and Option B's per-instrument precision (e.g., NEWS2's ≥16) expressed
as bundle-declared metadata *read by* the Option A gate rather than *enforced by* each
bundle independently. This composition is flagged for the reviewer's consideration
(§11.1 item 6) rather than presented as a fourth fully-analyzed option, because it is, on
inspection, "Option A correctly built" rather than a distinct alternative.

---

## 5. Decision and scope

### 5.0 Decisão (GDEC-0007, 2026-08-15)

> *Bloco redigido em português (pt-BR) per DEC-G0-10; o restante deste documento
> permanece em inglês como conteúdo pré-existente (tradução material adiada — P-4).*
>
> decided_by: **rodaquino-OMNI** (revisor clínico nomeado, GDEC-0003; também titular
> interino de papéis `AUTH-*` de fase de projeto per GDEC-0004 onde pertinente).
>
> O invariante de enforcement, o vocabulário de gate (§4.0) e o locus de enforcement
> (§4, Option A) são aceitos como decisão. Registro por questão, per a folha de
> decisão do ciclo 1
> (`docs/05-clinical-safety/cycle-1-review-decision-sheet.md` §8, linhas A27-1 a
> A27-7):
>
> - **A27-1 →** limiar etário decidido: **≥18 produto-wide**; pisos por instrumento
>   (ex.: NEWS2 ≥16) ficam **registrados, porém inativos** — um único gate, uma única
>   verdade.
> - **A27-2 →** política de gravidez decidida (= N-2/ADR-0028): sem documentação →
>   escora com anotação "gravidez não verificada"; gravidez **documentada** →
>   `not_evaluated` para o instrumento (não validado para gestação) — não fail-closed
>   universal.
> - **A27-3 →** care-setting gating confirmado no **mesmo locus** de enforcement do
>   gate etário — um único choke point testável.
> - **A27-4 →** os quatro carve-outs do IU-07 decididos: obstétrica → **fora** do
>   gate (instrumentos próprios); ECMO/TSR → **dentro**, com flags por componente;
>   pós-cardíaca → **dentro**, com anotação; paliativo → **dentro**, com
>   escalonamento suprimido (HAZ-0044) — nenhuma exclusão silenciosa.
> - **A27-5 →** A4 (ponto único de avaliação) **assumido para fins de design**;
>   verificação de engenharia no primeiro slice de implementação permanece pendente
>   (C6 abaixo).
> - **A27-6 →** o híbrido (Option A como choke point aplicado, lendo tags de
>   ingestão estilo Option C, hospedando metadados por instrumento estilo Option B) é
>   **adotado como emenda deste ADR**, sem necessidade de ADR novo.
> - **A27-7 →** nenhum teto de prevalência de `not_evaluated` é fixado agora; fica
>   estabelecida a **obrigação de medição e revisão em shadow mode**.
>
> **rationale:** conforme folha de decisão do ciclo 1 (GDEC-0007); fundamentos por
> linha na própria folha (`cycle-1-review-decision-sheet.md` §8).
>
> **supersessão:** rege-se pela própria seção de gatilhos de revisão desta ADR (§8) —
> nenhum gatilho adicional é criado por esta transcrição.
>
> **Nota de escopo.** Esta decisão fecha as cláusulas CLÍNICAS listadas acima. A
> ratificação formal de `AUTH-CLINSAFETY`/`AUTH-INTENDED-USE` em `authority-model.md`
> (C1), a contratação de fonte demográfica confiável (C8) e a verificação cruzada com
> o esquema do ADR-0007 (C7) permanecem OPEN e não são fechadas por esta aceitação.

### 5.1 Conditions — status after the 2026-08-15 decision (GDEC-0007)

| # | Condition | Owner | Evidence that would close it | Status |
|---|---|---|---|---|
| C1 | `AUTH-CLINSAFETY` and `AUTH-INTENDED-USE` are named and ratified in `authority-model.md` §1 (Gate G0). | Gate G0 | `authority-model.md` rows populated with named humans, not just a candidate declaration. | **OPEN** |
| C2 | VAL-0006 and VAL-0007 (paediatric/neonatal scope) are resolved. | `AUTH-INTENDED-USE` + `AUTH-CLINSAFETY` | Recorded decision in `g1-validation-backlog.md` / `intended-use-statement.md` IU-06. | **PARTIALLY CLOSED — A27-1 fixes ≥18 product-wide; formal closure of VAL-0006/VAL-0007 in the backlog document itself is owned by that document, out of this transcription's write_scope** |
| C3 | The concrete age range(s), per instrument or per product boundary (§4.0), are set. | `AUTH-CLINSAFETY` | A DECIDED value replacing IU-05's ≥18 placeholder, with the NEWS2-≥16-style per-rule question in §4.0 explicitly answered. | **CLOSED — see §5.0, GDEC-0007, 2026-08-15 (A27-1)** |
| C4 | The pregnancy-status-handling position (§4.0) is decided, not merely argued. | `AUTH-CLINSAFETY` | A DECIDED rule, with H3's data-availability question answered or explicitly deferred with an owner and date. | **CLOSED — see §5.0, GDEC-0007, 2026-08-15 (A27-2)** |
| C5 | Each named sub-population carve-out (§4.0) has its own clinical decision or an explicit, dated deferral. | `AUTH-CLINSAFETY` | Recorded decisions per carve-out; HAZ-0044/SAF-0041 resolution for the palliative case specifically. | **CLOSED — see §5.0, GDEC-0007, 2026-08-15 (A27-4)** |
| C6 | A4 (single evaluation entry point) is confirmed or refuted by the rule-runtime architecture. | Rule-runtime engineer (successor to `ADR-0002`) | Architecture evidence showing the evaluation call graph. | **OPEN — A27-5 authorizes assuming A4 for design purposes; the engineering verification itself remains pending** |
| C7 | `ADR-0007`'s bundle schema design accommodates whichever population-metadata fields the accepted option requires. | `ADR-0007` author | Bundle schema draft reviewed against this ADR's requirements. | **OPEN — ADR-0007 accepted 2026-08-15 (GDEC-0007); cross-check against this ADR's metadata requirements still pending** |
| C8 | A trusted demographic source is contracted, or the "every instrument is `not_evaluated` until then" consequence (§6.2) is explicitly accepted as a launch condition by `AUTH-PRODUCT` + `AUTH-CLINSAFETY`. | `AUTH-DATA-PLATFORM` + `AUTH-PRODUCT` + `AUTH-CLINSAFETY` | A signed source contract, **or** a recorded, dated risk acceptance. | **OPEN** |

---

## 6. Consequences

Because no option is chosen, these are the consequences **of this ADR's existence in
`proposed` state**, not of any decision.

### 6.1 Positive

- The enforcement question HAZ-0036 raises now has a named architecture question with
  enumerated options, rather than existing only as an unaddressed hazard row.
- `ADR-0007`'s bundle-schema authors and the eventual rule-runtime engineer now have an
  explicit list of population-metadata requirements to design against, even before an
  option is chosen (§4.0).
- The honest tension between D1 (safety) and D3 (availability cost) is recorded
  explicitly, preventing an implicit assumption that gating is free.

### 6.2 Negative

- **Until this ADR is accepted and a trusted demographic source is contracted (C8), the
  only safe posture consistent with SAF-0035/DOM-0004 is that every adult-instrument
  pathway is `not_evaluated` for every patient**, because no age can be trusted at all —
  not merely for out-of-range patients. This is the honest, unavoidable consequence of
  E13/E14's finding that no trusted age source exists today, stated plainly rather than
  left implicit. **This should be filed in the risk register as a launch-blocking
  availability consequence**, distinct from HAZ-0036 itself.
- Any rule bundle authored before this ADR resolves and before `ADR-0007`'s schema
  accommodates population metadata is authored without a designed gate to call — the
  Option Z risk from §4 applies to the interim period regardless of which option is
  later chosen.

### 6.3 Neutral / structural

- Nothing in this ADR authorizes evaluating any patient with any instrument; SAF-0035's
  non-actioning-by-default requirement and Gate G2/G3 remain fully binding regardless of
  which enforcement locus is later accepted.
- This ADR does not decide VAL-0006/VAL-0007; it is written to remain correct under
  either resolution (§8.2 T1).

---

## 7. Cross-cutting implications

Each row is mandatory. Write `Not applicable — <reason>` rather than omitting a row.

| Dimension | Implication | Evidence label | Owner role | Follow-up ID |
|---|---|---|---|---|
| Clinical safety | This ADR is itself the architectural response to HAZ-0036 (Unacceptable) and names HAZ-0044 as a distinct, related hazard requiring its own gate. No option closes either hazard by itself; acceptance plus implementation plus verification (§9 V2, V6) would be required. | SOURCE (E6, E7) | `AUTH-CLINSAFETY` | HAZ-0036, HAZ-0044; SAF-0035, SAF-0041 |
| Security | Whichever option is chosen must source its population metadata from the same authenticated, tenant-scoped context `ADR-0004`/`ADR-0016` establish — a caller-supplied age or population claim must never be trusted, mirroring IDP-05's "tenant context is server-derived, never client-asserted." | INFERENCE from IDP-05 (E15) | `AUTH-SECURITY` | ADR-0016 |
| Privacy (LGPD, minimization, purpose) | Age and pregnancy status are sensitive health-adjacent attributes; whichever source eventually supplies them is subject to the same purpose-of-use and minimization discipline IDP-07/IDP-11 already establish for other AMH-sourced attributes. No new legal-basis question is raised beyond what `ADR-0001`'s boundary and IDP-07's clinical-loop legal basis already cover — this ADR does not itself need a separate LGPD determination, but the eventual *source* contract (C8) does. | INFERENCE from IDP-07 (E15) | `AUTH-PRIVACY-LEGAL` | ADR-0017 |
| Interoperability | No demographic source is currently contracted (E13/E14); if AMH is later the source, it would require a new or amended profile/contract, following the same "verify the delivered shape before treating it as trustworthy" discipline `ADR-0001` T2 applies to Observation. | SOURCE (E13, E14) | `AUTH-DATA-PLATFORM` | ADR-0001, ADR-0013 |
| Accessibility | A `not_evaluated` state produced by this gate must be rendered with the same accessibility discipline as any other `not_evaluated` state (VAL-0031/VAL-0033) — this ADR introduces no new UI surface, but its output volume (D3) may be a large fraction of what clinicians see, raising the stakes of getting that rendering right. | INFERENCE | `AUTH-UX` | ADR-0021 |
| Operational | A centralized gate (Option A) becomes an operational dependency for every clinical evaluation; its availability and failure mode must be observable (QAS-0023) and must fail toward denial, never toward permissive default. | INFERENCE from DOM-0007 | `AUTH-OPERATIONS` | ADR-0020 |
| Cost | No cost model exists for building or operating any option; not evaluated here. | VALIDATION REQUIRED | `AUTH-PRODUCT` | pending |
| Migration | If Option B is chosen first and later consolidated toward Option A (§8.1), migration means auditing every existing bundle's local predicate for behavioral drift before consolidation — not a simple redeploy. | INFERENCE | `AUTH-OPERATIONS` | ADR-0023 |

---

## 8. Reversibility, revisit triggers, kill/rollback

### 8.1 Reversibility assessment

| Option | Reversibility | What is stranded on reversal | Estimated exit cost | Label |
|---|---|---|---|---|
| A — runtime gate | **High** — a bounded component behind a clear interface | The gate's own test suite and any bundle metadata schema built for it (metadata itself is reusable under B or C) | Low-to-moderate (§4) | INFERENCE |
| B — per-rule duplication | **Low** — reversing means auditing and consolidating N independently authored predicates | Every bundle's local gating logic and its own clinical sign-off record for that logic | Moderate-to-high (§4) | INFERENCE |
| C — ingestion tagging only | **High** — the tag is additive data, useful under any option | Nothing structural; only the absent enforcement half would need building regardless | Low (§4) | INFERENCE |
| Z — defer | **n/a** — nothing to reverse, but the hazard is live, not dormant, during deferral | n/a | n/a | INFERENCE |

SOURCE (prompt §9.1 principle 11): "Prefer reversible decisions and record
extraction/revisit triggers."

### 8.2 Revisit triggers

| # | Trigger | How it is detected | Who is notified | Action on trigger |
|---|---|---|---|---|
| T1 | VAL-0006 or VAL-0007 resolves (paediatric or neonatal admitted to scope). | Gate G0/G1 record | `AUTH-CLINSAFETY`, `AUTH-INTENDED-USE` | This ADR's chosen option must be widened to admit a second (validated) instrument/age-range pair, not silently reused for the new population; re-open C3/C5. |
| T2 | A trusted demographic source is contracted (any source — AMH `Patient.birthDate` on a future IG version, or non-AMH). | Contract-drift detection / `ADR-0001`-successor change notification | `AUTH-DATA-PLATFORM`, `AUTH-CLINSAFETY` | C8 closes; the "every instrument `not_evaluated`" consequence in §6.2 lifts for whichever population attributes the source actually populates — **verify the delivered shape before treating it as trustworthy**, per the same discipline `ADR-0001` T2 applies to AMH Observation. |
| T3 | `ADR-0002`'s successor rule-runtime architecture is designed. | Architecture review | Rule-runtime engineer | A4 is confirmed or refuted; if refuted (multiple independent evaluation entry points exist), Option A's "single choke point" claim must be re-argued per entry point, not assumed. |
| T4 | The first rule bundle is authored under `ADR-0007`. | `ADR-0007` schema review | `AUTH-CLINSAFETY`, rule-runtime engineer | If this ADR is still `proposed`, the bundle cannot declare `actionable` mode per SAF-0035 without an interim, explicitly-recorded gating mechanism — escalate as a blocker, do not proceed silently (Option Z's risk realized). |
| T5 | Measured pregnancy-status source completeness (H3) differs materially from measured age-source completeness. | Data-quality measurement once a source exists | `AUTH-CLINSAFETY` | Re-open §4.0's recommendation; a flagged-non-blocking exception may be warranted, but only through a recorded clinical decision, not a silent default change. |
| T6 | HAZ-0044 (goals-of-care) is resolved with a concrete default policy. | `hazard-log.md` / safety-case record | `AUTH-CLINSAFETY` | The palliative carve-out in §4.0 gains a concrete predicate; this ADR's enforcement locus must be able to host it, re-confirming C5/C7. |

### 8.3 Kill switch / rollback strategy

While `proposed`, there is nothing to kill — no gate has been built. The relevant control
is the **standing constraint** that already applies independent of this ADR: SAF-0035
forbids any pathway from reaching `actionable` mode before G2/G3, and
`evaluation-status-semantics.md` §3.3's fallback rule means any unhandled condition —
including "no gate exists yet" — resolves to `not_evaluated`, never to a produced score.
**No clinical harm pathway depends on this ADR's state today**, provided that standing
constraint is honored by whatever component first attempts evaluation (T4).

On acceptance, the accepted option must define its own kill switch: what happens if the
gate component itself fails (Option A) or if the runtime cannot verify per-bundle
compliance (Option B) — the safe failure direction is unambiguous (deny, per DOM-0004/
DOM-0007), but the mechanism, its detection, and its operator visibility are not designed
here.

---

## 9. Validation method and linked evidence

| # | Claim this ADR makes | Validation method | Environment required | Linked IDs |
|---|---|---|---|---|
| V1 | No trusted age/population source exists today (E13/E14). | Re-run the grep/citation check against the AMH evidence corpus and `ADR-0004` at the execution commit; diff against this ADR's E13/E14. | None (read-only repository access) | HAZ-0036; TST: pending test architecture |
| V2 | The chosen enforcement locus enforces the invariant with no gap (D1). | Adversarial tests per accepted option: for Option A, static call-graph proof plus negative tests attempting to reach evaluation without the gate; for Option B, per-bundle negative tests across every bundle; for Option C alone, this claim cannot be validated true (§4, Option C). | Rule-runtime test environment | DOM-0004; SAF-0035; TST: pending test architecture |
| V3 | Zero evaluations with unknown/out-of-range age produce a non-`not_evaluated` status (D4). | CRV/replay-corpus query per `clinical-reference-vector-standard.md`, once A5 (a queryable corpus) exists. | CRV/replay corpus environment | QAS-0007; VAL: pending validation backlog |
| V4 | 100% of rule bundles declare a population scope (D4). | Bundle-registry query against `ADR-0007`'s schema, once it exists. | Bundle registry | ADR-0007; TST: pending test architecture |
| V5 | `not_evaluated` prevalence from population gating is measured and reported, not merely produced (D3). | QAS-0007 instrumentation on the gate's output. | Production-like environment | QAS-0007; QAS-0023 |
| V6 | The palliative/goals-of-care carve-out (§4.0) is distinct from, and does not silently absorb, HAZ-0036's population gate. | Scenario tests distinguishing "out-of-population" denial reasons from "goals-of-care restriction" denial/suppression reasons. | Test environment (synthetic data) | HAZ-0036; HAZ-0044; SAF-0041 |
| V7 | Every gate decision (admit or deny) is a durable, explainable, auditable record (D7). | Audit-completeness check per SAF-0019/SAF-0023, mirroring IDP-11's "every denial is counted, logged, observable" pattern. | Test environment | SAF-0019; SAF-0023; QAS-0019 |

**Placeholder discipline.** No `REQ`, `TST`, or `VAL` ID has been invented in this
document beyond what is cited from existing catalogs; where no catalog entry exists yet,
the verbatim placeholder is used.

---

## 10. Supersession relationships

- **Supersedes:** none.
- **Superseded by:** none.
- **Relationship notes:** if VAL-0006/VAL-0007 admit a paediatric or neonatal population
  with its own validated instrument, that is **not** a supersession of this ADR — the
  enforcement invariant (§1) and the enforcement-locus decision (§4/§5, once made) are
  written to extend to a second validated instrument/age-range pair via new bundle
  metadata (T1), not to be re-decided. A supersession would be required only if the
  chosen enforcement *locus* itself needed to change (e.g., Option B chosen initially,
  later replaced architecturally by Option A) — that would be a new ADR that supersedes
  this one, not an edit to an accepted decision. This ADR's relationship to `ADR-0008`
  (evaluation-status semantics, drafted concurrently) is **cross-referential, not
  hierarchical**: this ADR consumes `not_evaluated` as `ADR-0008`'s subject matter
  defines it and adds no competing status value; `ADR-0008` should, in turn, cite this
  ADR's §4 as the worked example of one `not_evaluated` entry condition (population
  scope) it need not re-derive.

---

## 11. Completeness checklist (reviewer's gate)

- [x] Stable ID matches the filename (`ADR-0027-age-and-population-gating-enforcement.md`)
- [x] Status is one of the permitted values (`accepted (2026-08-15, GDEC-0007)`) — **not yet reconciled against
      `adr-index.md`, which lists "next free ID: ADR-0025" as of its last update; this
      task's `write_scope` explicitly excludes editing `adr-index.md`. Reconciling the
      `ADR-0025`–`ADR-0028` concurrent-allocation range is left to the traceability
      owner, per the same numbering-caution precedent `g1-validation-backlog.md` records
      for concurrently allocated `VAL` IDs.**
- [x] Owner, approvers, decision deadline present (placeholders only; no invented names)
- [x] Author is not listed as an approver; independence pairs checked (front matter)
- [x] Context (§1) states a decision *question* with an explicit scope boundary
- [x] Every material statement carries an evidence label
- [x] Evidence table (§2.1) distinguishes SOURCE/INFERENCE; no OBSERVED claimed for
      artifacts this ADR did not itself verify
- [x] Assumptions (§2.2) each have an invalidation condition and an owner
- [x] Three fully analyzed alternatives (A, B, C) plus defer (Z) — exceeds the ≥2 minimum
- [x] Every alternative has both positive and negative consequences
- [x] Drivers (§3) are discriminating and map to measurable quality attributes, or
      honestly record "no scenario yet"
- [x] No invented numeric target; IU-05's ≥18 and NEWS2's ≥16 are both cited as other
      parties' values, never proposed here as new numbers
- [x] All eight cross-cutting implication rows present (§7)
- [x] Reversibility, revisit triggers, kill/rollback present (§8)
- [x] Validation method with linked (or honestly placeheld) HAZ/SAF/QAS/TST/VAL IDs (§9)
- [x] Supersession fields present (§10)
- [x] No technology chosen by inheritance from legacy or AMH — this ADR proposes an
      architectural pattern (a gate), not a product or vendor
- [ ] `adr-index.md` updated in the same change — **deliberately not done; excluded by
      this task's `write_scope`, which restricts changes to this file only**

### 11.1 Open questions for the reviewer (numbered)

> **RESOLVED — 2026-08-15, GDEC-0007.** The seven questions below were answered by
> the named authority in the cycle-1 review: 1→A27-1 (≥18 product-wide governs;
> per-instrument floors recorded, inactive); 2→A27-2 (fail-closed only when pregnancy
> is documented and unvalidated for the instrument; annotated, not blocked, when
> undocumented); 3→A27-3 (confirmed — same locus); 4→A27-4 (per-carve-out
> dispositions fixed); 5→A27-5 (assumed for design; engineering verification
> pending); 6→A27-6 (hybrid adopted as amendment, no new ADR); 7→A27-7 (no ceiling
> now; measurement + shadow-mode review obligatory). See §5.0 for the formal record.
> Original text preserved below as a historical record of the questions asked.

1. Is the *product-wide* population boundary (IU-05, placeholder ≥18) or the
   *per-instrument* validated range (e.g., NEWS2's ≥16, §4.0) authoritative when they
   differ, for a patient inside one range but outside the other?
2. Is unknown pregnancy status fail-closed (this ADR's PROPOSAL, §4.0) or
   flagged-non-blocking, and does the answer depend on measuring pregnancy-status source
   completeness separately from age-source completeness (H3)?
3. Care-setting gating (§4.0) is asserted to be "structurally the same problem" as age
   gating and assumed to share an enforcement locus — should it, or does step-down/ward/
   RRT (IU-04a–c) warrant a materially different mechanism once those settings are
   decided?
4. For each of the four IU-07 sub-population carve-outs (pregnancy, ECMO/CRRT,
   post-cardiac-surgical, palliative/goals-of-care, §4.0): in scope, excluded, or
   flagged-with-caveat for V1 — and by what evidence?
5. Does A4 (a single evaluation entry point) hold for the intended rule-runtime
   architecture, or must Option A's "single choke point" claim be re-argued per entry
   point?
6. Should the hybrid noted at the end of §4.1 (Option A as enforced choke point, reading
   Option C-style ingestion tags, hosting Option B-style per-instrument metadata) be
   analyzed as its own option before acceptance, rather than left as a footnote?
7. What is the acceptable `not_evaluated` prevalence ceiling (D3) before "safe but
   clinically useless" becomes its own product/safety judgment call, and who sets that
   ceiling — `AUTH-CLINSAFETY` alone, or jointly with `AUTH-PRODUCT`?
