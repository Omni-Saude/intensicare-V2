---
# ---- Mandatory identity block (ADR-template.md; prompt §10) ----
id: ADR-0028
title: >
  Sedation and neuro-assessment confounding policy — how consciousness-dependent
  scoring (GCS/SOFA CNS, qSOFA mentation, NEWS2/MEWS consciousness) must behave
  under sedation, intubation, and untestable components
status: accepted (2026-08-15, GDEC-0007)   # transcribed per GDEC-0007; agent is scribe, not decider
status_history:
  - status: proposed
    date: 2026-08-15
    by: sedation/neuro-assessment confounding-policy ADR author (cycle 1, Task 4)
    note: >
      Drafted from the mandatory "INPUT TO ADR" section of the cycle-1 legacy
      neuro/sedation review (REV-NS-01 §4), the SOFA/NEWS2 legacy reviews, and
      evaluation-status-semantics.md. Records options and drivers only; NO
      decision. All clinical clauses are
      "PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI)".
  - status: accepted (2026-08-15, GDEC-0007)
    date: 2026-08-15
    by: rodaquino-OMNI (revisor clínico nomeado, GDEC-0003) — transcrito pelo orquestrador clínico do ciclo 1 (escriba)
    note: >
      Decisão por escrito, em sessão, do titular nomeado, registrada em
      decision-register.md GDEC-0007 (folha de decisão do ciclo 1, §9, linhas A28-1 a
      A28-8). Option A com gatilho por conjunção-com-exposição, RASS ≤ −3, política
      intervalo-parcial aceita, e sedação desconhecida FAIL-CLOSED (overriding
      qualquer default de escora-com-divulgação, inclusive o rascunho 0.1.0 da spec
      SOFA). Ver §5.0. Bloco de decisão redigido em pt-BR per DEC-G0-10.
date: 2026-08-15
owner: >
  rodaquino-OMNI — candidate AUTH-CLINSAFETY holder for cycle-1 artifacts per
  GDEC-0003 (decision-register.md); permanent AUTH-CLINSAFETY holder
  UNASSIGNED — VALIDATION REQUIRED
approvers:                  # role IDs; candidate holder named only where a DECIDED register entry names them
  - AUTH-CLINSAFETY — candidate holder rodaquino-OMNI per GDEC-0003 (cycle-1 scope); permanent holder UNASSIGNED — VALIDATION REQUIRED
  - AUTH-INTENDED-USE — population-scope clauses (VAL-0006/VAL-0007); candidate holder rodaquino-OMNI per GDEC-0003; permanent holder UNASSIGNED — VALIDATION REQUIRED
  - AUTH-PRODUCT — ADR-ratification row of decision-rights.md §2; UNASSIGNED — VALIDATION REQUIRED
decision_deadline: >
  UNSET — VALIDATION REQUIRED. Forcing event (PROPOSAL): Gate G2 (pathway
  portfolio) — no consciousness-dependent rule specification (SOFA CNS, qSOFA,
  NEWS2/MEWS consciousness) can leave draft state, and no CRV reference-vector
  category for neuro inputs can be frozen, until this policy is decided.
deciding_authority_rule: >
  docs/00-governance/decision-rights.md §2, rows "Clinical rule content
  ratification" (AUTH-CLINSAFETY — this policy is clinical rule content) and
  "Architecture decisions (ADR ratification)" (AUTH-PRODUCT + relevant domain
  owner). Agents may author the policy options and cite evidence; agents may NOT
  ratify them.
independence_check: >
  decision-rights.md §3 pair 1 (rule author must be independent from clinical
  approver): the authoring agent is the rule author and may not approve.
  GDEC-0003 supersession rule (c) additionally binds the human reviewer: if
  rodaquino-OMNI materially amends the policy content (rather than reviewing
  agent-authored content), a second independent clinical reviewer is required.

# ---- Traceability (traceability-policy.md §3 rule 3) ----
links:
  drivers:
    domain_invariants: [DOM-0004]
    quality_scenarios: [QAS-0007, QAS-0017]
    risks: ["pending risk register IDs — the availability-loss risk of fail-closed gating (§6.2) should be filed in docs/00-governance/registers/risk-register.md"]
  constrains:
    requirements: ["REQ: pending requirement catalog"]
    clinical: ["CLR: pending pathway portfolio (Gate G2); concurrent cycle-1 rule specifications docs/05-clinical-safety/rule-releases/sofa/specification.md §4.5 and docs/05-clinical-safety/rule-releases/news2/specification.md (consciousness input) are inputs to and constrained by this ADR"]
    safety: [SAF-0001, SAF-0002, SAF-0003, SAF-0005, SAF-0006, SAF-0019, SAF-0035]
  hazards: [HAZ-0005, HAZ-0036]
  tests: ["TST: pending test architecture"]
  validations: [VAL-0006, VAL-0007, "VAL: pending validation backlog (new VAL items proposed in §9)"]
  adrs:
    depends_on: [ADR-0008]   # evaluation-status semantics; score/pathway completeness and freshness — being authored concurrently in cycle 1; cross-referenced by ID/title only, not read
    feeds: [ADR-0026]        # concurrent cycle-1 clinical ADR; cross-referenced by ID only per the cycle-1 directive (concurrent authoring — title reconciliation is the adr-index steward's task)
  gates: [G2]
  evidence:
    - docs/05-clinical-safety/legacy-review/neuro-sedation-scores/REV-NS-01-gcs.md
    - docs/05-clinical-safety/legacy-review/neuro-sedation-scores/REV-NS-02-rass.md
    - docs/05-clinical-safety/legacy-review/neuro-sedation-scores/REV-NS-05-cam-icu.md
    - docs/05-clinical-safety/legacy-review/sepsis-scores/sofa-review.md
    - docs/05-clinical-safety/legacy-review/ews/news2-review.md
    - docs/05-clinical-safety/evaluation-status-semantics.md

# ---- Supersession (prompt §10) ----
supersedes: null
superseded_by: null

# ---- Provenance (evidence-notation.md §3) ----
provenance:
  source_repo: intensicare-V2
  path_or_url: docs/06-architecture/adrs/ADR-0028-sedation-and-neuro-assessment-confounding-policy.md
  commit_sha_or_version: ddac9bc (repo HEAD at authoring; this file and the cycle-1 review corpus are uncommitted working-tree artifacts)
  section_or_lines: >
    REV-NS-01 §1.2, §1.3, §4 (INPUT TO ADR), §5; REV-NS-02 §1, §3, §4;
    REV-NS-05 §1.1, §3, §4; sofa-review.md §3, §4 (D-11..D-13, D-17), §6;
    news2-review.md §2, §3 (D-7, D-8), §4.3; evaluation-status-semantics.md
    §2, §3, §4; hazard-log.md HAZ-0005, HAZ-0036; decision-register.md GDEC-0003
  date_collected: 2026-08-15
  collector: sedation/neuro-assessment confounding-policy ADR author (cycle 1, Task 4)
  transformation: reasoned-from — options and drivers derived from the cited cycle-1 reviews and governance documents; two external verifications performed by this author are labeled OBSERVED in §2.1
  confidence: medium
  owner: rodaquino-OMNI — candidate AUTH-CLINSAFETY per GDEC-0003; permanent holder UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
---

# ADR-0028 — Sedation and neuro-assessment confounding policy

> **Status: `accepted (2026-08-15, GDEC-0007)`.** O revisor clínico nomeado
> (rodaquino-OMNI, GDEC-0003) decidiu, por escrito, em sessão de 2026-08-15
> (transcrição-mestre: `decision-register.md` GDEC-0007), **Option A** (fail-closed
> assessability gating) com o gatilho de confundimento por **conjunção-com-exposição**
> (não a disjunção do REV-NS-01 §4), limiar **RASS ≤ −3**, a política intervalo-parcial
> de §4.0.1 **aceita** como única forma de parcial ratificado, e a **sedação
> desconhecida resolvendo FAIL-CLOSED** — ver §5.0 para o registro por questão
> (A28-1 a A28-8). Esta última cláusula **substitui** (overrides) qualquer default de
> "escora-com-divulgação" em qualquer especificação concorrente, inclusive o rascunho
> 0.1.0 da spec SOFA citado em §4 Option A item 3.

---

## 1. Context and problem statement

The cycle-1 legacy forensic review found that V1 had **no representation at
all** for "this patient's consciousness could not be validly assessed"
(SOURCE: REV-NS-01 §4 item 1 — no NT designation, no verbal substitution, no
RASS gating anywhere in the V1 codebase; the only trace is a commented-out
`glasgow_intubated_block` placeholder). The consequences were concrete and
bidirectional (SOURCE: REV-NS-01 §4 item 2):

- **False alarm direction:** an alert intubated patient (E4, M6, verbal
  untestable) could only be encoded by coercing the verbal component to 1,
  yielding GCS 11 → SOFA CNS 2 and qSOFA mentation 1 — a fabricated
  deterioration signal for a patient who is awake.
- **False reassurance direction:** omitting GCS entirely made every scorer
  treat it as missing → SOFA CNS 0 / qSOFA mentation 0 — the exact HAZ-0005
  mechanism (absence rendered as the healthiest value), which hazard-log.md
  records as **E1 — occurred** in the predecessor.
- **Sedation confounding:** a propofol-sedated RASS −4 patient scored SOFA
  CNS 4 and permanently tripped the deterioration criterion's
  `GCS ≤ 8 → critical "coma"` branch, with no sedation covariate anywhere
  (SOURCE: REV-NS-01 §4 item 3; sofa-review.md D-12).

SOURCE (REV-NS-05 §1.1): V1's own CAM-ICU sedation service *did* gate on
RASS ≤ −4 ("não avaliável") — proving the gating pattern was available in the
legacy codebase and simply never applied to GCS or its consumers.

The published instrument is explicit (OBSERVED, §2.1 E3): when a GCS component
cannot be tested, it is recorded **NT (not testable)**; "do not use number '1'
to record missing component"; and **do not report a total score when a
component is Not Testable**. V1 violated all three. V2 must therefore decide,
before any consciousness-dependent rule specification can advance, what the
system records when a neuro assessment is confounded, and what each consuming
score does about it.

**Question.** When a consciousness-dependent input (GCS E/V/M, ACVPU) is
sedation-confounded, has an untestable component, or is missing, what
assessability state must V2 record with the observation, what contemporaneous
context data (RASS, sedative-infusion state, intubation status) is required to
establish that state, and how must each consumer — SOFA CNS, qSOFA mentation,
NEWS2/MEWS consciousness — behave in each state?

**Out of scope** (each named to prevent scope creep):

- The general five-state evaluation-status algebra, partial-policy machinery,
  and freshness/expiry semantics — **ADR-0008** ("Evaluation-status semantics;
  score/pathway completeness and freshness", being authored concurrently in
  cycle 1; this ADR consumes its vocabulary as specified today in
  `evaluation-status-semantics.md` and does not redefine it).
- **ADR-0026** (concurrent cycle-1 clinical ADR — cross-referenced by ID only;
  neither draft read-blocks on the other).
- CAM-ICU algorithm content and delirium screening cadence — rule
  specification territory; REV-NS-05 is cited here only for its RASS-gating
  precedent.
- Alert threshold governance and tenant override floors — ADR-0007.
- Paediatric/neonatal population scope — VAL-0006/VAL-0007 (this ADR is
  drafted adult-only and says so; it does not decide the population question).
- The concrete numeric freshness windows for GCS and RASS — clinical
  parameters proposed in the concurrent SOFA specification (§4.5) and listed
  here as acceptance conditions, not decided here.
- Data transport and source-system selection — ADR-0001/ADR-0013.

### 1.1 Shared vocabulary — the assessability dimension (PROPOSAL)

All options in §4 share the following model; they differ only in **consumer
behavior**. PROPOSAL (operationalizing REV-NS-01 §4 items 1–3): every
consciousness-dependent observation carries an **assessability state**, a
dimension distinct from both AMH source data quality and V2 evaluation status
(the two-dimension rule of `evaluation-status-semantics.md` §5; this is a
property of the *observation*, constraining the *evaluation*):

| State | Definition | Required context data |
|---|---|---|
| `testable` | Every component of the instrument was validly assessable and assessed, and no confounder condition holds. | Contemporaneous RASS within a clinically ratified freshness window (VALIDATION REQUIRED — the concurrent SOFA spec proposes "within 1 h of the qualifying GCS"); sedation-exposure context per below. |
| `not_testable` (NT), **per component** | A specific GCS component cannot be tested (e.g. verbal under endotracheal intubation/tracheostomy; eye opening under periorbital swelling). Recorded as NT on that component, never as 1, never as absent (OBSERVED, §2.1 E3). A total is not computable while any component is NT. | Intubation/airway status — **source question flagged, VALIDATION REQUIRED**: no trusted V2 intubation-status source is decided (the legacy SOFA respiratory review shows only an unratified `mechanical_ventilation` boolean, sofa-review.md D-02). |
| `sedation_confounded` | The assessment reflects drug effect rather than neurological state. Reviewer's trigger (SOURCE: REV-NS-01 §4 item 2): contemporaneous **RASS ≤ −3 or an active sedative infusion without an interruption window**. The concurrent SOFA specification (§4.5) refines this: sedative **exposure** should be a required conjunct, because RASS ≤ −3 with documented absence of sedative exposure is structural coma, which must be scored, not gated. Reconciling these two formulations is open question OQ-1 (§2.3 H3, §5.1 C4). | Contemporaneous RASS; **sedative-infusion context — VALIDATION REQUIRED: no evidenced source exists today** (SOURCE: sofa-review.md §7.1 — no medication-administration contract with dose granularity was evidenced at the pinned AMH commit 0a07a6f1fab36fb2f5eeee0fcd8e945c95f67116). |
| `missing` | No qualifying observation exists in the freshness window (or the gating context needed to classify it is itself absent — the "unknown sedation state" sub-case, OQ-2). | n/a |

Display convention (PROPOSAL, per REV-NS-01 §4 item 1): modality notation such
as "GCS 10T" or component-wise reporting "E4 M6 V-NT" is **presentation, not
arithmetic** — no numeric total is derived from an NT-containing assessment in
any option below.

---

## 2. Evidence and assumptions

### 2.1 Evidence

Epistemic note: rows E3 and E9 are **OBSERVED** — this author performed those
verifications itself on 2026-08-15 (web fetch of the cited URLs). Every other
row **cites** a cycle-1 dossier or governance document and is therefore
`SOURCE` per `evidence-notation.md` §2 — the underlying code verification was
performed by the cycle-1 legacy reviewer at legacy pin
`1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79`, not re-performed here.

| # | Label | Statement | Source (repo / path / section) | Confidence |
|---|---|---|---|---|
| E1 | SOURCE | V1 coerces untested GCS E/V/M components to their minimum (docstring: "If any component is missing, scores minimum for that component"); a fully empty form yields GCS 3.0, indistinguishable from deep coma. There is no NT state, no RASS gating of GCS, and no sedation covariate in SOFA CNS, qSOFA, or the deterioration criteria. | intensicare-V2 / docs/05-clinical-safety/legacy-review/neuro-sedation-scores/REV-NS-01-gcs.md §1.2, §4 (legacy pin 1dc1ea6…) | high |
| E2 | SOURCE | Missing GCS → SOFA CNS `(0, "missing")` and qSOFA mentation 0; the "missing" marker is metadata no consumer elevates; the forms-SOFA path drops the component with no marker at all; the deterioration criterion returns status literal `"normal"` on missing GCS. This behavior is asserted as correct in legacy tests — designed, not accidental. | REV-NS-01 §1.3, §5; sofa-review.md §6 | high |
| E3 | **OBSERVED** | glasgowcomascale.org FAQ ("Dealing with missing information"), fetched 2026-08-15 by this author: "Do not use number '1' to record missing component; use 'NT' (Not testable)"; "Do not report a total score when a component is Not Testable because the score will be low and this could be confusing"; for endotracheal intubation/tracheostomy the verbal component "can be denoted as 'not testable', NT. The motor and eye components can still be assessed and the trend will still be useful." | https://www.glasgowcomascale.org/faq/ | high |
| E4 | SOURCE | Teasdale G, Jennett B. *Assessment of coma and impaired consciousness: a practical scale.* Lancet. 1974;2(7872):81-84 — E (1-4) + V (1-5) + M (1-6), total 3-15. Citation carried from REV-NS-01 §2 (recorded there as verified 2026-08-15). This author's own DOI re-resolution (10.1016/S0140-6736(74)91639-0) reached the publisher's link resolver but not a readable bibliographic page; the citation is cited, not re-verified, here. | REV-NS-01 §2 | high |
| E5 | SOURCE | Sessler CN et al. *The Richmond Agitation-Sedation Scale: validity and reliability in adult ICU patients.* Am J Respir Crit Care Med. 2002;166(10):1338-1344 — ten levels +4..−5; and Devlin JW et al. (SCCM PADIS). Crit Care Med. 2018;46(9):e825-e873 — RASS-first assessment sequence; light-sedation target commonly operationalised as RASS −2..0; deep sedation ≤ −3. Citations carried from REV-NS-02 §2 (adult ICU validation population noted there). | REV-NS-02 §2, §3 | high |
| E6 | SOURCE | Legacy precedent: V1's sedation service gates CAM-ICU at RASS ≤ −4 → `cam_icu_assessable = False`, "não avaliável", reassess after sedation reduction — matching Ely 2001 (patients unarousable to voice are not assessable). The parallel forms path deviates (blocks only at RASS = −5) and both paths default absent features to a negative screen. | REV-NS-05 §1.1, §1.2, §3 | high |
| E7 | SOURCE | Vincent 1996 (SOFA) defines the CNS bands (15/13-14/10-12/6-9/<6) and **does not define how to score sedated patients**; no published rule in it licenses substituting the sedated value. Legacy SOFA has "no sedation handling of any kind" (D-12) and no GCS range check (D-13); partial totals are typed and persisted identically to complete totals (D-17 — the HAZ-0005 mechanism). | REV-NS-01 §2; sofa-review.md §3, §4 D-11..D-13, D-17 | high |
| E8 | SOURCE | NEWS2 consciousness is ACVPU, not GCS: Alert = 0, C/V/P/U = 3; confusion scores only when **new** ("no score if chronic", RCP Chart 3). Legacy defects: the HL7 path drops 'C' to None → scores 0 (D-7); GCS is collected but never mapped to consciousness when ACVPU is absent, so a comatose patient with GCS recorded and ACVPU absent scores 0 (D-8); a sedated non-alert patient scores +3 with no confounding marker (REV-NS-01 §4 item 5). | news2-review.md §2, §3 D-7/D-8, §4.3 | high |
| E9 | **OBSERVED** | Lambden S et al., *The SOFA score — development, utility and challenges of accurate assessment in clinical trials*, Crit Care 2019;23:374 (PMC6880479), fetched 2026-08-15 by this author: the neurological component is "the least accurately measured and associated with the most errors"; trials have "used an assumed value for the GCS in patients receiving sedation" (carrying forward the last pre-intubation GCS, or inferring a normal GCS 15 when none exists), producing "significant variability in the recorded value"; limited evidence exists for the delay before reliable assessment after stopping hypnotics. **The assumed-GCS practice is a reporting convention, not a validated bedside imputation method.** | https://pmc.ncbi.nlm.nih.gov/articles/PMC6880479/ | high |
| E10 | SOURCE | V2's evaluation-status semantics: severity is readable only when status is `valid` or `partial` within an approved policy; `partial` MUST NOT exist without an explicitly approved partial policy; missing inputs MUST NOT be coerced to zero/normal (prohibitions P-1..P-8); the absent-input probe (SAF-0002) is a blocking verification gate. | docs/05-clinical-safety/evaluation-status-semantics.md §2, §3.2, §3.3, §4 | high |
| E11 | SOURCE | The gating input is itself at risk: V1's forms engine coerces a **missing RASS to 0.0 = "Alerta e calmo"** and silently clamps out-of-range values — so any V2 RASS-gating design must treat RASS with the same no-coercion discipline as the score it gates. | REV-NS-02 §1, §4 | high |
| E12 | SOURCE | Data-availability reality at the pinned AMH commit (0a07a6f1…): zero populated Observations of any category; no medication-administration contract with dose granularity evidenced (→ no sedative-infusion source); no evidenced intubation-status source; the neurological input class is structurally excluded by the laboratory-fixed Observation profile. Any confounding trigger that requires infusion context is therefore **unexecutable against today's evidenced sources**. | sofa-review.md §7.1, §7.2 | high |
| E13 | SOURCE | HAZ-0005 (S5/L4, Unacceptable, E1 — occurred): missing input scored as zero → normal-looking persisted score → false reassurance. HAZ-0036: out-of-population evaluation silently expands intended use — all consumers here are adult-validated instruments. | docs/05-clinical-safety/hazard-log.md HAZ-0005, HAZ-0036 | high |
| E14 | SOURCE | The concurrent cycle-1 SOFA rule specification already drafts a §4.5 sedation-confounding clause subordinated to this ADR (not_evaluated with reason `sedation_confounded`; last pre-sedation GCS surfaced in the explanation; RASS-≤−3-with-exposure formulation; open question OQ-8 on the unknown-sedation case), and the NEWS2 specification routes its sedation confounder (matrix row NEWS2-07) and the GCS→ACVPU mapping question to this ADR. These are the Task-2 spec sections this ADR unblocks. | docs/05-clinical-safety/rule-releases/sofa/specification.md §4.5, OQ-8; docs/05-clinical-safety/rule-releases/news2/specification.md (consciousness input, open question 4) | high |

### 2.2 Assumptions

Assumptions to be filed in `docs/00-governance/registers/assumptions-register.md`
by the register steward (this ADR does not mint ASM IDs — concurrent minting
would collide, per the ADR-0001 precedent).

| # | Assumption | Why it is needed | What invalidates it | Owner | Register status |
|---|---|---|---|---|---|
| A1 | A contemporaneous RASS can be captured in V2's clinical workflow alongside every scoring-grade GCS, at acceptable documentation burden. | Every option's confounding detection depends on RASS availability (E5, E14). | Workflow validation showing nurses cannot or will not chart paired RASS+GCS; or a source analysis showing RASS is uncapturable from available systems. | UNASSIGNED — VALIDATION REQUIRED | to be filed |
| A2 | A trusted sedative-infusion (medication-administration) data source will eventually exist, but does not today (E12). | Determines whether the infusion arm of the confounding trigger is executable at launch or deferred (revisit trigger T1). | Evidence that no medication-administration source will be integrated in the program horizon. | UNASSIGNED — VALIDATION REQUIRED | to be filed |
| A3 | V2's initial population scope for these instruments is adult ICU (E5, E13/HAZ-0036), pending VAL-0006/VAL-0007. | GCS-consumer validity and the RASS instrument are adult-validated; the policy is drafted adult-only. | VAL-0006/VAL-0007 deciding paediatric/neonatal in scope — which would require separate instruments, not an extension of this policy. | AUTH-CLINSAFETY + AUTH-INTENDED-USE (candidate rodaquino-OMNI per GDEC-0003) | to be filed |
| A4 | Clinically defensible freshness windows for GCS and paired RASS exist and can be ratified (the concurrent SOFA spec proposes GCS 12 h / expiry 24 h, RASS within 1 h of the GCS). | Contemporaneity is what makes RASS a valid confounder gate. | Clinical review rejecting the proposed windows without substitutes. | UNASSIGNED — VALIDATION REQUIRED | to be filed |

### 2.3 Hypotheses to test

| # | Hypothesis | How it would be tested | Who tests it | Current status |
|---|---|---|---|---|
| H1 | Sedation-confounded and NT states are frequent enough in the target ICU population that their handling materially changes score availability and alert burden (INFERENCE from E5/E9: deep sedation and intubation are routine in ICU). | Retrospective frequency study on a representative dataset once a data source exists; shadow-mode measurement of assessability-state distribution. | Clinical evidence methodologist + AUTH-CLINSAFETY | UNTESTED |
| H2 | Fail-closed gating (Option A) does not suppress detection of true neurological deterioration, because deterioration in a sedated patient is detected by sedation-interruption assessment and by the other organ axes, not by scoring the drugged GCS. | Shadow-mode comparison of alert sets with and without gating against clinician-adjudicated deterioration events. | Safety-focused test engineer + AUTH-CLINSAFETY | UNTESTED |
| H3 | The confounding trigger requires sedative **exposure** as a conjunct (RASS ≤ −3 alone must not gate, or unsedated structural coma would be unscorable) — the concurrent SOFA spec's refinement of the reviewer's REV-NS-01 trigger. | Named clinical review (OQ-1); case-vector walkthrough (structural coma, sedated coma, sedation-with-agitation). | rodaquino-OMNI (GDEC-0003) | UNTESTED |

---

## 3. Decision drivers and measurable quality attributes

Targets are `VALIDATION REQUIRED` until Gate G1/G2 validated needs exist — no
numeric target is invented here. Drivers are discriminating: the options in §4
differ on every row.

| # | Driver | Why it matters here | Measurable quality attribute | Target |
|---|---|---|---|---|
| D1 | **False-reassurance elimination (HAZ-0005).** A missing/NT/confounded neuro input must be unrepresentable as 0, component-minimum, or "normal". | This is the failure that actually occurred (E2, E13) — in both directions (E1). | SAF-0002 absent-input probe extended with NT/confounded vectors: count of CNS/mentation/consciousness sub-scores computed from NT or confounded components in the CRV reference-vector corpus (CRV prefix per GDEC-0002, ratification pending). **Proposed measure: zero.** QAS-0017. | VALIDATION REQUIRED |
| D2 | **Assessability observability.** The clinician and every downstream consumer must be able to see *why* a score is absent or bounded. | The legacy "missing" marker existed and was elevated by no consumer (E2); observability is what failed, not computation. | Share of persisted GCS/ACVPU evaluations carrying an assessability state and machine-readable reason. **Proposed measure: 100%.** QAS-0007. | VALIDATION REQUIRED |
| D3 | **Clinical availability.** Fraction of ICU patient-hours in which consciousness-dependent scores are readable at all. | Fail-closed gating converts today's (wrong) numbers into `not_evaluated` — a real availability loss that clinicians will feel (H1). | `not_evaluated`-rate and alert-burden delta measured in shadow mode against the ungated baseline; the delta must be **bounded and clinically accepted**, not assumed. | VALIDATION REQUIRED |
| D4 | **Fidelity to published instrument semantics.** NT per component, no totals over NT (E3); ACVPU is its own instrument, not a GCS projection (E8); RASS-first assessment (E5). | Deviating from issuer guidance is what made V1's numbers undefendable (E1, E7). | Conformance review of the data model and rule specs against E3/E4/E5/E8 primary sources. | VALIDATION REQUIRED |
| D5 | **Executability against evidenced sources.** The policy must state what runs when RASS or infusion context is absent — because today the infusion source does not exist at all (E12) and RASS itself was coerced in legacy (E11). | A policy that silently assumes unavailable context data recreates the legacy defect one level up. | Per-trigger source-availability matrix (which trigger arms are live vs dormant) published with the rule bundle. | VALIDATION REQUIRED |
| D6 | **Auditability of the confounding judgment.** Whether a GCS was scoring-grade must be reconstructable (which RASS, which window, which trigger arm) for every evaluation. | Deterministic replay (QAS-0020 context) and incident review both need it; the legacy trail terminated in unverifiable markers (E2). | Every evaluation record carries the gating inputs and their source times. | VALIDATION REQUIRED |

---

## 4. Alternatives considered

All options consume the shared assessability vocabulary of §1.1 and the
evaluation-status vocabulary of `evaluation-status-semantics.md` (ADR-0008's
subject matter). They differ in what consumers do with a non-`testable` state.

### Option A — Fail-closed assessability gating (the reviewer's recommended policy, REV-NS-01 §4)

**Description.** Assessability is a first-class precondition for scoring:

1. **GCS is modeled as E/V/M components with an explicit NT state per
   component.** A total is computable only when all three components are
   tested; an NT component makes the total unrepresentable — not 3, not 15,
   not minimum-filled (E3). "GCS 10T"-style modality display is presentation
   only (§1.1).
2. **Scoring-grade GCS requires a contemporaneous RASS** (window per A4,
   VALIDATION REQUIRED). If the confounding trigger holds (RASS ≤ −3 with
   sedative exposure, or an uninterrupted sedative infusion — exact
   formulation per OQ-1/H3), the GCS is still **recorded** but flagged
   `sedation_confounded`.
3. **Consumer behavior per state** (the normative table of this option):

| Assessability state | SOFA CNS | qSOFA mentation (GCS < 15) | NEWS2/MEWS consciousness (ACVPU) |
|---|---|---|---|
| `testable` | Computed; evaluation status per ADR-0008 completeness/freshness rules. | Computed. | Computed from the observed ACVPU token (never derived from GCS — E8, and no automatic GCS→ACVPU mapping, per the concurrent NEWS2 spec). |
| `not_testable` component (e.g. verbal-NT, intubated) | No total exists → CNS sub-score `not_evaluated` (reason `nt_component`), **or** an explicitly ratified partial policy per ADR-0008 §3.2 semantics — candidate shape in §4.0.1 below. Never a total from minimum-filled components. | The predicate GCS < 15 is sometimes decidable from tested components alone (§4.0.1); where decidable, a ratified partial policy may evaluate it; where indeterminate → `not_evaluated` (reason `nt_component`). | ACVPU is a separate bedside assessment and may itself still be performable on an intubated patient; if performed, computed; if not performed → `not_evaluated`. |
| `sedation_confounded` | `not_evaluated` (reason `sedation_confounded`) as the clinically honest default; the last pre-sedation GCS is **surfaced display-only** in the explanation, never fed to arithmetic (its permissible age: OQ-6). A ratified partial policy may later refine this; none is assumed. | Same: `not_evaluated` (reason `sedation_confounded`). | The observed ACVPU is recorded; the component **may** be computed from the observed state (the instrument scores what is observed, and the error direction is over-alarm, not reassurance — E8), but the evaluation must carry the `sedation_confounded` marking and must never be presented as an unqualified `valid`; whether it is `partial`-with-declared-bounds or `not_evaluated` is a named clinical decision (OQ-4). |
| `missing` (no qualifying observation, or gating context absent → sedation state unknown) | `not_evaluated` (reason `missing_input:gcs` or `rass_unavailable`) — never 0 (E2, E10 P-1). The unknown-sedation sub-case (GCS present, RASS and infusion context both absent) is OQ-2: score-with-disclosure vs block. | `not_evaluated` — never 0. | `not_evaluated` (reason `missing_input:consciousness`) — never 0 and never a default "A" (E8 D-7/D-8). |

4. **Never coerce** (E10 P-1..P-8): the three legacy behaviors — missing→0,
   missing→component-minimum, missing→status-"normal" — are all rejected;
   invalid/out-of-range values resolve to `invalid`, not clamped (E11).
5. **Population gate:** adult-only until VAL-0006/VAL-0007 decide otherwise (A3).

#### 4.0.1 Candidate shape of the ratified partial policy (PROPOSAL — not assumed by Option A)

Interval semantics, exact arithmetic rather than imputation: an NT component
contributes its full component range, so a partially tested GCS is an interval
`[sum of tested minima + untested minima, sum of tested maxima + untested
maxima]`. A consumer whose predicate is decidable over the whole interval may
evaluate: E3 + M5 + V-NT gives total at most 13 < 15, so "GCS < 15" is
**true** regardless of the untestable verbal — qSOFA mentation is decidable.
E4 + M6 + V-NT spans 12..15 — indeterminate → `not_evaluated`. SOFA CNS is
decidable only when the interval falls entirely inside one Vincent band. This
is presented as the *honest* alternative to imputation (it fabricates no
value), but it is a partial policy under `evaluation-status-semantics.md`
§3.2 and therefore **requires an independent clinical approver before it
exists at all** (OQ-3). Option A stands complete without it — the default
absent ratification is `not_evaluated`.

**How it answers each driver.** D1: fully — the unsafe statements become
unrepresentable (the type has no total over NT, no score without
assessability). D2: fully — states and reasons are mandatory. D3: **weakest
here** — every deeply sedated patient's CNS/mentation contribution goes dark
(H1 says that is a large share of ICU-hours); honest availability loss is the
price of eliminating false reassurance, and H2 (deterioration detected by
other means) is untested. D4: fully aligned with E3/E5/E8. D5: partially —
the infusion arm of the trigger is dormant until a source exists (E12); the
policy must run on RASS-only with an explicit unknown-sedation rule (OQ-2).
D6: fully — the gating inputs are part of the evaluation record.

**Positive consequences.** Eliminates both legacy harm directions (E1) at the
type level; matches issuer guidance (E3) and the legacy system's own best
pattern (E6); gives Task-2 specifications a single, testable semantics
(E14); makes the CRV corpus's NT/confounded vectors assertable (D1).

**Negative consequences.** Real, felt availability loss (D3) with untested
clinical acceptability (H2); depends on paired RASS charting actually
happening (A1) — if RASS charting is poor, large volumes resolve to
`not_evaluated (rass_unavailable)`, which clinicians may perceive as the
system refusing to work; requires E/V/M-level capture, which is a heavier
ingestion contract than a single integer; the sedation-interruption
("sedation vacation") assessment pathway that clinicians actually use to get
a valid GCS in sedated patients is workflow this policy references but V2
cannot itself provide.

**What would have to be true for this to be the right answer.** H2 holds (no
sensitivity loss for true deterioration); A1 holds (paired RASS is
capturable); clinical governance accepts `not_evaluated` as the honest
default for sedated patients (E14 shows the concurrent SOFA spec already
drafts exactly this, subordinate to this ADR).

**Exit cost if chosen and later reversed.** Low-to-moderate: the recorded
assessability states, component-level GCS, and paired RASS are strictly more
information than any alternative needs; reversal to B or C consumes the same
data. Nothing is stranded except gating logic.

### Option B — Documented-imputation convention (the trial-convention alternative, argued honestly)

**Description.** Adopt the convention used by many trials and registries
(E9): for a sedation-confounded assessment, the CNS input is **imputed** —
either the last pre-sedation GCS carried forward, or an assumed-normal GCS 15
where none exists — and consumers compute normally. The imputation is flagged
in the evaluation record and display ("GCS 15, assumed pre-sedation
baseline"), and the evaluation status is `partial` under a declared policy
naming the imputation.

**The honest case for it.** It is what much of the SOFA literature actually
does (E9); it preserves score continuity and trend lines through sedation
episodes; Sepsis-3 itself tolerates an assumed-zero baseline SOFA in patients
not known to have pre-existing dysfunction (SOURCE: sofa-review.md §3, Singer
2016), so the instrument's literature is not allergic to documented
conventions; and ΔSOFA-based screening remains computable, which Option A
breaks during sedation.

**The honest case against it.** The convention is a **reporting convention
for research, not a validated bedside imputation method** — Lambden records
"significant variability" and explicitly limited evidence (E9, OBSERVED).
Its error direction is systematically toward reassurance: assuming GCS 15
scores CNS 0 for a patient whose true neurological state is unknown — a
patient who acquires a new intracranial catastrophe *under sedation* scores
normal until someone interrupts sedation. That is HAZ-0005's phenotype
produced deliberately (E13). It also violates P-1 ("no numeric, categorical,
or 'last known' default may substitute for a missing input", E10) unless a
named clinical authority explicitly ratifies the imputation as the declared
partial policy — which is precisely what this ADR would exist to record: it
is **available as a named clinical decision, never as a default**.

**How it answers each driver.** D1: fails by default; passes only if one
accepts that a flagged imputation is not a coercion — the flag must survive
every projection (P-6), which is exactly what legacy metadata did not do
(E2). D2: partial — the state is recorded but the number still reads as a
number. D3: strongest — full score availability through sedation. D4:
conflicts with E3's "do not report a total" for NT and with Vincent's silence
on sedation (E7). D5: executable today (needs only the last pre-sedation
value). D6: auditable if the imputation source is recorded.

**Positive consequences.** No availability loss; trend continuity; matches
external research datasets, easing outcome comparability.

**Negative consequences.** Institutionalizes a false-reassurance channel; the
imputed number will be consumed by every downstream aggregate, and any
consumer that drops the flag reproduces the legacy defect; analytics pooling
imputed with measured CNS scores pollutes outcome datasets
(`evaluation-status-semantics.md` §6).

**What would have to be true for this to be the right answer.** A named
clinical authority judges score continuity for sepsis screening more
protective than the false-reassurance risk; the flag is proven un-droppable
across every surface (P-6 verified adversarially); the pre-sedation baseline
is reliably available and fresh.

**Exit cost if chosen and later reversed.** High for data: persisted imputed
scores are permanently ambiguous in the historical record and can never be
retroactively separated from measured ones for analytics or validation
studies — this is the least reversible option in its data effects.

### Option C — Sedation-aware display-only annotation, no status change

**Description.** Compute all scores exactly as measured (a RASS −4 patient's
GCS 3 scores SOFA CNS 4), but annotate the UI: "consciousness assessment may
be sedation-confounded". Evaluation status remains `valid`.

**How it answers each driver.** D1: fails — the fabricated-severity direction
(E1's false-alarm arm and the permanent "coma"-branch trip of REV-NS-01 §4
item 3) persists untouched, and the missing-input arm is out of this option's
scope entirely. D2: cosmetically — an annotation is not a machine-readable
state and constrains no consumer. D3: full availability. D4: conflicts with
E3. D5: trivially executable. D6: no.

**Positive consequences.** Minimal engineering; no availability loss; the
clinician is at least warned at the display surface.

**Negative consequences.** This is architecturally the **legacy defect
restated**: metadata that no consumer elevates (E2) — alerts, aggregates,
bed-severity roll-ups, analytics and exports all consume the confounded
number as clean; a UI annotation is invisible to every non-UI consumer; and
`evaluation-status-semantics.md` §2's hard ordering rule (severity readable
only when status licenses it) is violated by design. It also does nothing for
NT components — it has no answer to the intubated patient except V1's two
wrong encodings.

**What would have to be true for this to be the right answer.** One would
have to conclude that clinicians reliably discount sedated GCS at the glass
and that no downstream consumer matters — both contradicted by the legacy
evidence (E2, E13: the harm ran through the bed grid, not the chart).

**Exit cost if chosen and later reversed.** Low in code, high in
accumulated data: scores persisted as `valid` during the interim are
indistinguishable from clean ones forever (same mechanism as Option B's data
cost, without even the flag).

### Option Z — Defer / do nothing

**Description.** Record no policy. The REV-NS verdicts stand (V1 behavior
REJECTED), but V2 has no replacement semantics. Concretely: the GCS data
model cannot be specified (component vs total, NT representability is
undecided); the concurrent SOFA specification's §4.5 clause and OQ-8, and
the NEWS2 specification's consciousness open question 4, remain open (E14);
CRV vector categories for neuro inputs cannot be frozen; every
consciousness-dependent rule stays in draft.

**Positive consequences.** No clinical policy is fixed without the named
reviewer; no engineering is built on an unratified confounding trigger.

**Negative consequences.** The decision is not actually avoided — the first
implemented ingestion schema for GCS *is* the decision (a single-integer
column forecloses NT; a nullable column without assessability forecloses
gating), made implicitly and without clinical review. Cycle-1 Task-2
deliverables stay blocked (E14).

**Cost of delay.** Rises at the first ingestion-contract or rule-bundle
implementation, whichever comes first; after a total-only GCS schema ships,
this ADR becomes a migration instead of a design choice.

### 4.1 Comparison against drivers

Qualitative, evidence-labeled; no numeric scoring (weights unratified).

| Driver | A — fail-closed gating | B — documented imputation | C — display-only annotation | Z — defer |
|---|---|---|---|---|
| D1 false-reassurance elimination | Unsafe states unrepresentable (E3, E10) | Reassurance channel by design; safe only if the flag is unlosable (E2 says it was lost) | Fails — legacy mechanism restated (E2) | Unresolved; implicit schema decision looms |
| D2 assessability observability | Mandatory state + reason | State recorded, number still reads clean | UI-only, not machine-readable | None |
| D3 clinical availability | Weakest — sedated hours go `not_evaluated` (H1/H2 untested) | Strongest | Full | n/a |
| D4 instrument fidelity | Aligned (E3/E5/E8) | Conflicts with E3; convention unvalidated (E9) | Conflicts with E3 | n/a |
| D5 executability today | RASS arm live if charted; infusion arm dormant (E12); unknown-sedation rule needed (OQ-2) | Executable | Executable | n/a |
| D6 auditability | Gating inputs in the evaluation record | Auditable if imputation source recorded | No | n/a |

### 4.2 Decisão de autoria (GDEC-0007, 2026-08-15)

**Option A** is decided, as the operationalization of the cycle-1 reviewer's own
recommended policy (REV-NS-01 §4) — with two clarifications fixed by the decision,
not left to the option's own framing: (1) the confounding trigger is the
**exposure-conjunct** formulation (RASS ≤ −3 **and** sedative exposure; structural
coma without sedation scores), not REV-NS-01's disjunction (A28-1); (2) unknown
sedation state resolves **FAIL-CLOSED** to `not_evaluated (rass_unavailable)`
(A28-2), not the score-with-disclosure alternative this option's own table had left
open. §4.0.1's interval-partial shape is **accepted** as the sole ratified partial
policy for the qSOFA/SOFA-CNS class (A28-3) — it is no longer merely offered.
Option B (documented imputation) remains available only as a *named clinical
decision* a future authority may take with its consequences on record — this
decision does not adopt it. See §5.0 for the full per-question record.

---

## 5. Decision and scope

### 5.0 Decisão (GDEC-0007, 2026-08-15)

> *Bloco redigido em português (pt-BR) per DEC-G0-10; o restante deste documento
> permanece em inglês como conteúdo pré-existente (tradução material adiada — P-4).*
>
> decided_by: **rodaquino-OMNI** (revisor clínico nomeado, GDEC-0003; também titular
> interino de papéis `AUTH-*` de fase de projeto per GDEC-0004 onde pertinente).
>
> Option A (fail-closed assessability gating) é aceita como decisão, com as
> especificações fixadas abaixo. Registro por questão, per a folha de decisão do
> ciclo 1 (`docs/05-clinical-safety/cycle-1-review-decision-sheet.md` §9, linhas
> A28-1 a A28-8):
>
> - **A28-1 →** gatilho de confundimento decidido como **conjunção-com-exposição**:
>   RASS ≤ −3 **e** exposição sedativa → confundido; coma estrutural **sem** sedação
>   escora. A disjunção do REV-NS-01 §4 não é adotada.
> - **A28-2 →** sedação desconhecida decidida **FAIL-CLOSED** —
>   `not_evaluated (rass_unavailable)`. **Esta cláusula substitui (overrides)
>   qualquer default de "escora-com-divulgação" em qualquer spec concorrente**,
>   inclusive o rascunho 0.1.0 da spec SOFA (§4 Option A item 3) — a mesma resposta
>   vale para RULE-GCS G-2 e RULE-SOFA OQ-8.
> - **A28-3 →** a política intervalo-parcial de §4.0.1 é **aceita** como única forma
>   de parcial ratificado para a classe qSOFA-mentação/SOFA-CNS — não fabrica valor;
>   decide apenas o que é decidível no intervalo.
> - **A28-4 →** NEWS2/MEWS sob sedação: o escore é marcado **"confundido"**, nunca
>   `valid` sem qualificação; **sem supressão** — o ACVPU observado sob sedação é
>   estado real (direção do erro = mais alarme, aceitável por INV-B).
> - **A28-5 →** limiar RASS decidido em **≤ −3** (PADIS), não o ≤ −4 do precedente
>   CAM-ICU (que responde a outra pergunta — avaliabilidade de delirium).
> - **A28-6 →** último GCS pré-sedação: **display-only**, idade máxima **72h**,
>   timestamp visível; nunca entra em cômputo.
> - **A28-7 →** janelas de frescor **ratificadas**: GCS 12h (staleness) / 24h
>   (expiração); RASS dentro de 1h do GCS qualificante.
> - **A28-8 →** convenções de exibição **ratificadas**: "GCS 10T" / "E4 M6 V-NT", com
>   redação pt-BR "não testável — NT"; entrada de glossário via ADR-0029.
>
> **rationale:** conforme folha de decisão do ciclo 1 (GDEC-0007); fundamentos por
> linha na própria folha (`cycle-1-review-decision-sheet.md` §9). A prioridade
> máxima do titular ("uma resposta única de sedação... deliberadamente mais estrita
> que o default 'escora-com-divulgação'") está registrada verbatim no resumo
> executivo daquela folha.
>
> **supersessão:** rege-se pela própria seção de gatilhos de revisita desta ADR
> (§8.2, T1–T6) — nenhum gatilho adicional é criado por esta transcrição.
>
> **Nota de escopo.** Esta decisão fecha as cláusulas CLÍNICAS. A aceitação conjunta
> com o ADR-0008 (C2), a fonte confiável de infusão sedativa (C5) e a medição em
> shadow mode (C6) permanecem OPEN e não são fechadas por esta aceitação.

### 5.1 Conditions — status after the 2026-08-15 decision (GDEC-0007)

| # | Condition | Owner | Evidence that would close it | Status |
|---|---|---|---|---|
| C1 | Named clinical review of the assessability model (§1.1) and of the chosen option's consumer table, clause by clause. | rodaquino-OMNI (GDEC-0003, cycle-1 scope) | Recorded review resolving OQ-1..OQ-8 (§11.1). | **CLOSED — see §5.0, GDEC-0007, 2026-08-15** |
| C2 | ADR-0008 reaches at least `under-review`, so "explicitly ratified partial policy" has settled semantics for this ADR to bind to. | AUTH-CLINSAFETY | ADR-0008 status change in adr-index.md. | **CLOSED — ADR-0008 accepted 2026-08-15 (GDEC-0007)** |
| C3 | Freshness windows for GCS and paired RASS proposed and clinically ratified (A4; the concurrent SOFA spec's 12 h / 24 h / 1 h figures are proposals). | AUTH-CLINSAFETY | Ratified window table in the rule specifications. | **CLOSED — see §5.0 (A28-7)** |
| C4 | The confounding trigger formulation is fixed (reviewer's REV-NS-01 disjunction vs the SOFA spec's exposure-conjunct refinement — H3/OQ-1), including the unknown-sedation case (OQ-2). | AUTH-CLINSAFETY | Recorded resolution; case vectors (structural coma, sedated coma) added to the CRV corpus. | **CLOSED as to formulation (A28-1/A28-2) — CRV case-vector addition remains an engineering follow-up, still open** |
| C5 | The sedative-infusion and intubation-status source questions are answered — a named trusted source, or an explicit record that those trigger/NT arms are dormant at launch (E12, §1.1). | AUTH-DATA-PLATFORM + AUTH-CLINSAFETY | Per-trigger source-availability matrix (D5) published. | OPEN |
| C6 | Shadow-mode (or retrospective) measurement of assessability-state frequencies and alert-burden delta exists, so D3's cost is known, not guessed (H1, H2). | Safety-focused test engineer + AUTH-CLINSAFETY | Measurement report attached to this ADR. | OPEN |
| C7 | Population scope confirmed adult-only or otherwise (VAL-0006/VAL-0007) for every consumer named here (A3, HAZ-0036). | AUTH-CLINSAFETY + AUTH-INTENDED-USE | Gate G1/G2 record. | **CLOSED as to the adult-only default — see ADR-0027 §5.0 (A27-1); formal VAL-0006/VAL-0007 closure in the backlog document itself remains OPEN** |

---

## 6. Consequences

Because no option is chosen, §6.1–6.3 state the consequences of this ADR's
existence in `proposed` state; per-option consequences are in §4.

### 6.1 Positive

- The confounding question — mandatory input from REV-NS-01 §4 — now has a
  single decision surface with its evidence attached; the concurrent SOFA and
  NEWS2 specifications can cite ADR-0028 by ID instead of a pending-ADR
  placeholder (E14).
- The availability-vs-false-reassurance trade (D1 vs D3) is stated with both
  directions argued, so the named reviewer decides it explicitly rather than
  inheriting it from whichever schema ships first.
- The trial-convention alternative (Option B) is on record with its honest
  evidence status (E9: convention, not validation), preventing it from being
  adopted later "because the literature does it" without a named decision.

### 6.2 Negative

- Until decided, every consciousness-dependent deliverable carries a
  conditional branch on this ADR — a real coordination cost across concurrent
  cycle-1 work.
- The standing risk (to be filed per front-matter `links.drivers.risks`): an
  ingestion schema or rule bundle implemented before acceptance would decide
  this ADR implicitly (§4 Option Z) — implementation pressure resolves
  ambiguity by default, and that default is historically the unsafe one.

### 6.3 Neutral / structural

- This ADR adds an observation-level dimension (assessability) beside the
  source-data-quality and evaluation-status dimensions; the two-dimension rule
  of `evaluation-status-semantics.md` §5 becomes a three-way
  never-collapse rule for neuro inputs (the §5.1 point-4 attribution
  dimension is unaffected).
- Nothing here changes the standing report that clinical evaluation is
  non-actioning; no consumer named in this ADR is action-capable today.

### 6.4 What deciding this ADR unblocks (INFERENCE from E14)

1. **GCS E/V/M + NT data model** — component-level capture contract, NT
   representability, paired-RASS linkage.
2. **RASS-gating component in the rule runtime** — a reusable assessability
   evaluator (the CAM-ICU precedent E6 generalized), consumed by SOFA CNS,
   qSOFA, and the sedation/delirium instruments.
3. **CRV reference-vector categories** — NT-component vectors, sedation-
   confounded vectors, unknown-sedation vectors, structural-coma
   counter-vectors (C4), and the D1 zero-count assertion.
4. **Task-2 specification sections** — SOFA specification §4.5 and OQ-8;
   NEWS2 specification consciousness input and its open question 4
   (sedation-state annotation, GCS→ACVPU mapping prohibition).

---

## 7. Cross-cutting implications

| Dimension | Implication | Evidence label | Owner role | Follow-up ID |
|---|---|---|---|---|
| Clinical safety | This ADR is the control surface for HAZ-0005's neuro arm (both harm directions, E1/E2) and constrains HAZ-0036 (adult-validated consumers). Option choice determines whether a sedated patient's CNS state can ever read "normal" without assessment. | INFERENCE from E1, E2, E13 | AUTH-CLINSAFETY | HAZ-0005, HAZ-0036 |
| Security | No new trust boundary. The paired RASS/infusion context enters through the same governed ingestion as other clinical facts; no additional attack surface beyond existing input-integrity controls. | INFERENCE | AUTH-SECURITY | Not applicable — no new surface identified; revisit if a bedside-device source is introduced for RASS |
| Privacy (LGPD, minimization, purpose) | Sedative-infusion context is medication data — a new data class whose collection must be justified by this purpose (confounding detection) under minimization; dormant-arm design (C5) avoids collecting it before it is used. | INFERENCE from E12 | AUTH-PRIVACY-LEGAL | pending privacy data-map entry |
| Interoperability | Component-level GCS (LOINC 9267-6/9270-0/9268-4 per the concurrent SOFA spec's input table), RASS (no code pinned — VALIDATION REQUIRED per that spec), ACVPU 'C' concept gap (NEWS2 spec: answer list lacks a standard "C" concept). NT representability must survive the ingestion contract — a total-only integer field cannot carry this policy. | SOURCE (E14) | AUTH-DATA-PLATFORM | ADR-0013 |
| Accessibility | `not_evaluated (sedation_confounded)` and NT states must be visibly distinct, non-color-only, and announced to assistive technology, like every evaluation state (`evaluation-status-semantics.md` §6); pt-BR wording for "não avaliável — sedação" is VALIDATION REQUIRED with clinicians. | SOURCE (E10 §6 row UI) | AUTH-UX | ADR-0021 |
| Operational | New monitoring dimension: assessability-state distribution (a sudden spike in `rass_unavailable` is a charting-workflow or ingestion failure, not a clinical event, and must not be silent — QAS-0007). | INFERENCE | AUTH-OPERATIONS | ADR-0020 |
| Cost | Component-level capture and paired-RASS ingestion are a larger contract than a single GCS integer; no cost model exists and none is invented. | VALIDATION REQUIRED | AUTH-PRODUCT | pending |
| Migration | Legacy GCS records are total-only with no assessability context (E1); they can never be classified retroactively and must import (if ever) as `assessability unknown`, never as `testable` — constrains ADR-0023. | INFERENCE from E1 | AUTH-OPERATIONS | ADR-0023 |

---

## 8. Reversibility, revisit triggers, kill/rollback

### 8.1 Reversibility assessment

| Option | Reversibility | What is stranded on reversal | Estimated exit cost | Label |
|---|---|---|---|---|
| A — fail-closed gating | High — recorded states are a superset of what any alternative consumes; gating logic is a rule-bundle behavior | Gating evaluator only; all captured data remains valid | Low-moderate | INFERENCE |
| B — documented imputation | Low for data — persisted imputed scores are permanently ambiguous in the historical record and cannot be separated from measured ones afterwards | The polluted score history (analytics, validation studies) | High (data), low (code) | INFERENCE |
| C — display annotation | High in code; the interim's `valid`-stamped confounded scores are stranded as unlabeled pollution | Interim score history | Low (code), high (data) | INFERENCE |
| Z — defer | n/a until a schema ships; afterwards deferral becomes a migration | n/a | Rising at first ingestion contract | INFERENCE |

SOURCE (prompt §9.1 principle 11): "Prefer reversible decisions and record
extraction/revisit triggers." Note the asymmetry: A is reversible toward B/C
at any time; B and C are only partially reversible toward A because their
interim data is permanently unlabeled or imputed.

### 8.2 Revisit triggers

| # | Trigger | How it is detected | Who is notified | Action on trigger |
|---|---|---|---|---|
| T1 | A trusted sedative-infusion (medication-administration) data source lands with dose/timing granularity. | Contract inventory / connector onboarding record | AUTH-CLINSAFETY, AUTH-DATA-PLATFORM | Activate the dormant infusion trigger arm (C5); re-run C6 measurements; re-open the trigger formulation if needed |
| T2 | Shadow-mode/retrospective measurement (C6) shows confounded/NT-state frequency or `not_evaluated` burden outside what clinical governance accepted. | The C6 measurement pipeline; QAS-0007 dashboards | AUTH-CLINSAFETY | Re-open D3; consider ratifying the §4.0.1 partial policy or a scoped Option-B decision |
| T3 | ADR-0008 is accepted with partial-policy semantics materially different from `evaluation-status-semantics.md` §3.2 as consumed here. | adr-index.md status change | this ADR's owner | Reconcile the consumer table before acceptance, or re-open if already accepted |
| T4 | A published, validated method for sedation-adjusted CNS scoring appears (E9 records none exists today). | Clinical evidence surveillance | AUTH-CLINSAFETY | Evaluate as a candidate ratified partial policy superseding the `not_evaluated` default |
| T5 | VAL-0006/VAL-0007 decide paediatric or neonatal populations in scope. | Gate G1/G2 record | AUTH-CLINSAFETY, AUTH-INTENDED-USE | This policy does not extend — separate instruments and a separate ADR are required (A3) |
| T6 | An ingestion schema or rule bundle for GCS is proposed while this ADR is undecided. | Design review / PR review | AUTH-CLINSAFETY | Block on this ADR (the §6.2 implicit-decision risk) |

### 8.3 Kill switch / rollback strategy

The assessability gate is rule-bundle behavior and shares the rule runtime's
kill/rollback machinery (ADR-0007/ADR-0008 territory). The safety-critical
constraint specific to this ADR: **the fallback direction is fixed.** If the
gating evaluator itself fails, misconfigures, or is killed, every affected
consciousness-dependent evaluation resolves to `not_evaluated (reason:
rule_unavailable)` per `evaluation-status-semantics.md` §3.3 — the rollback
path MUST NOT re-enable ungated scoring or coerced totals, because the
pre-gating behavior is the rejected hazard, not a safe prior state. There is
no configuration in which a confounded or NT input silently produces a
number; if that invariant cannot be maintained during an incident, the
affected scores are switched off entirely and the clinician-visible degraded
mode says so. INFERENCE labeled; the operational procedure itself is
ADR-0020/ADR-0007 follow-up.

---

## 9. Validation method and linked evidence

| # | Claim this ADR makes | Validation method | Environment required | Linked IDs |
|---|---|---|---|---|
| V1 | No consumer can produce a CNS/mentation/consciousness value of 0, minimum, or "normal" from an NT, confounded, or missing input (D1). | SAF-0002 absent-input probe extended with NT and confounded vectors; CRV corpus assertion "zero such sub-scores computed"; negative tests per consumer per state (the §4 Option-A table, one test per cell). | Test environment, synthetic data | SAF-0001, SAF-0002; HAZ-0005; DOM-0004; TST: pending test architecture |
| V2 | 100% of persisted GCS/ACVPU evaluations carry an assessability state and machine-readable reason (D2). | Schema-level unconstructibility test (no unstatused evaluation is constructible) + persisted-record audit query. | Test environment | SAF-0001, SAF-0019; QAS-0007; TST: pending test architecture |
| V3 | Fail-closed gating does not suppress detection of true neurological deterioration (H2). | Shadow-mode comparison against clinician-adjudicated deterioration events; requires a populated data source, which does not exist today (E12). | Production-like environment with real or replayed clinical data | VAL: pending validation backlog |
| V4 | The confounded/NT-state frequency and alert-burden delta are as clinical governance accepted (D3, C6). | Retrospective or shadow-mode frequency measurement; report attached to acceptance record. | Same as V3 | VAL: pending validation backlog; QAS-0007 |
| V5 | The confounding trigger classifies the canonical case vectors correctly (structural coma scored; sedated coma gated; unknown sedation per OQ-2 resolution). | CRV case-vector suite reviewed by the named clinical reviewer (C4). | Test environment | SAF-0035; HAZ-0036; TST: pending test architecture |
| V6 | pt-BR wording of the confounded/NT states is understood by clinicians as "not assessed", not as reassurance or system error. | Human-factors validation with pt-BR clinicians (`evaluation-status-semantics.md` §6). | Usability environment | SAF-0005; VAL: pending validation backlog |

**Placeholder discipline.** No REQ/TST catalog exists; placeholders are
verbatim per the template. No HAZ, SAF, DOM, QAS, VAL or GDEC ID in this
document was invented; every cited ID was read from `docs/05-clinical-safety/`,
`docs/03-domain/`, `docs/06-architecture/quality-attributes/`,
`docs/02-users-and-workflows/`, or `docs/00-governance/registers/`.

---

## 10. Supersession relationships

- **Supersedes:** none.
- **Superseded by:** none.
- **Relationship notes:** ADR-0008 and ADR-0026 are being authored
  concurrently in cycle 1; this ADR cross-references them by ID only and did
  not read their drafts. If ADR-0008's accepted partial-policy semantics
  diverge from `evaluation-status-semantics.md` §3.2 as consumed here,
  trigger T3 applies. A future validated sedation-adjusted scoring method
  (T4) would be adopted via a superseding ADR, not by editing this one.

---

## 11. Completeness checklist (reviewer's gate) — self-check

- [x] Stable ID matches the filename
- [ ] `adr-index.md` row — **deliberately NOT updated in this change**:
  cycle-1 concurrent authoring assigns each specialist a single-file write
  scope to avoid index write collisions; index reconciliation (ADR-0026/0027/
  0028 rows, next-free-ID advance past the stale "ADR-0025" note) is the
  adr-index steward's task and is recorded here as a known, intentional
  deviation from template rule 5 — not an oversight.
- [x] Status `accepted (2026-08-15, GDEC-0007)`; decision recorded in §5.0, transcribed from decision-register.md GDEC-0007
- [x] Owner, approvers, decision deadline present; no invented names (the only
  named human, rodaquino-OMNI, is named by DECIDED register entry GDEC-0003)
- [x] Author is not an approver; independence pairs checked (§ front matter)
- [x] Context states a decision question with explicit scope boundary
- [x] Every material statement carries an evidence label
- [x] Evidence table distinguishes re-verified (OBSERVED: E3, E9) from cited (SOURCE)
- [x] Assumptions each have an invalidation condition and an owner
- [x] Three viable alternatives plus defer; every alternative has both positive
  and negative consequences, including the honest case *for* the options argued against
- [x] Drivers discriminating and mapped to measurable quality attributes
- [x] No invented numeric target; all targets VALIDATION REQUIRED
- [x] All eight cross-cutting rows present
- [x] Reversibility, revisit triggers, kill/rollback present
- [x] Validation methods with honest placeholders
- [x] Supersession fields present
- [x] No technology selected by inheritance from legacy or AMH — the only
  legacy import is the *concept* precedent (E6), explicitly re-derived from
  the published instrument (E3/E5), not from the legacy implementation

### 11.1 Open questions for the named clinical reviewer (rodaquino-OMNI, per GDEC-0003)

> **RESOLVED — 2026-08-15, GDEC-0007.** The eight questions below were answered by
> the named authority in the cycle-1 review: OQ-1→A28-1 (exposure-conjunct
> formulation); OQ-2→A28-2 (**fail-closed**, overriding any score-with-disclosure
> default); OQ-3→A28-3 (interval-partial policy accepted as sole ratified partial);
> OQ-4→A28-4 (marked "confounded", never unqualified `valid`, no suppression);
> OQ-5→A28-5 (RASS ≤ −3, PADIS); OQ-6→A28-6 (display-only, max age 72h, timestamp
> visible); OQ-7→A28-7 (windows ratified: GCS 12h/24h, RASS 1h); OQ-8→A28-8 (display
> conventions ratified, pt-BR glossary entry via ADR-0029). See §5.0 for the formal
> record. Original text preserved below as a historical record of the questions asked.

1. **OQ-1 — Confounding trigger formulation.** Reviewer's REV-NS-01 §4
   disjunction ("RASS ≤ −3 **or** uninterrupted sedative infusion") vs the
   concurrent SOFA spec §4.5 refinement (sedative **exposure** required as a
   conjunct, so RASS ≤ −3 from structural coma is scored, not gated). Which
   formulation, and with what interruption-window definition?
2. **OQ-2 — Unknown sedation state.** GCS present, but RASS absent and no
   infusion context (the common early-integration case, E12): score with
   mandatory "sedation state not assessed" disclosure (the SOFA spec's 0.1.0
   draft), or block to `not_evaluated (rass_unavailable)`?
3. **OQ-3 — Interval-partial policy (§4.0.1).** Is decidable-predicate
   evaluation over partially tested GCS (e.g. E3+M5+V-NT ⇒ GCS < 15 true)
   acceptable as the ratified partial policy for qSOFA mentation and SOFA
   CNS, or must every NT-containing assessment be `not_evaluated`?
4. **OQ-4 — NEWS2/MEWS consciousness under sedation.** Score the observed
   ACVPU with `sedation_confounded` marking (over-alarm direction, instrument
   scores what is observed), or resolve to `not_evaluated`? And is a
   sedation-state annotation required on **every** consciousness input (the
   NEWS2 spec's open question 4)?
5. **OQ-5 — RASS threshold.** Confirm ≤ −3 for GCS confounding (PADIS deep
   sedation) versus the CAM-ICU precedent's ≤ −4 (unarousable-to-voice, Ely) —
   two different published anchors for two different instruments; make the
   difference explicit or unify.
6. **OQ-6 — Last pre-sedation GCS.** Display-only surfacing is proposed:
   confirm it may never enter arithmetic, and set its maximum permissible age.
7. **OQ-7 — Freshness windows.** Ratify or replace the concurrent SOFA spec's
   proposals (GCS 12 h staleness / 24 h expiry; RASS within 1 h of the
   qualifying GCS).
8. **OQ-8 — Modality display.** Approve "GCS 10T" / "E4 M6 V-NT"
   presentation conventions and their pt-BR renderings (V6).
