---
id: LEGREV-OSMS-MEDSAFE
title: Legacy review — medication safety (antimicrobial stewardship, prophylaxis, prescription, efficiency/transfusion, drug safety/interactions, ADR-0026/0027)
label: PROPOSAL
status: PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI)
statement: >
  Forensic review of the legacy V1 medication-safety clinical content:
  domain_antimicrobiano.py, domain_profilaxia.py, domain_prescricao.py,
  domain_eficiencia.py, drug_safety.py, drug_interactions.py,
  anvisa_drug_database.py, the antimicrobial/medication/prescricao/
  prophylaxis models+schemas+APIs, pathways antimicrobiano.yaml and
  profilaxia.yaml, the pharmaco-interaction catalog+spec, and ADRs 0026 and
  0027. All verdicts are PROPOSALS; nothing is imported.
provenance:
  source_repo: intensicare (legacy V1, READ-ONLY)
  path_or_url: /Users/familia/intensicare
  commit_sha_or_version: 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79 (HEAD at pin; per-file SHA-256 below)
  section_or_lines: cited per finding
  date_collected: 2026-08-15
  last_updated: 2026-08-15
  collector: legacy organ-support and medication-safety forensics reviewer (cycle 1, Task 1, wave 1b)
  transformation: read from source; summarized and analyzed; no content imported
  confidence: high (mechanical citations) / medium (clinical assessments)
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  hazards: [HAZ-0005, HAZ-0019, HAZ-0021, HAZ-0036]
  adrs: []
  pr: null
supersedes: null
superseded_by: null
---

# Legacy review — medication safety

> **PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).**
> Pharmacology comparisons rely on trained knowledge of standard references
> (IDSA/SHEA ASP 2016; ASHP stress-ulcer prophylaxis guidance; TRICC/AABB
> restrictive transfusion; NICE-SUGAR glycemic targets; product labeling for
> renal dosing) — none re-fetched; every such statement is VALIDATION
> REQUIRED. A clinical pharmacist must be a named co-reviewer for this
> record's dispositions.

## 0. Artifacts and integrity (OBSERVED 2026-08-15; all hashes match inventory)

| Artifact | SHA-256 |
|---|---|
| `src/intensicare/services/domain_antimicrobiano.py` | `d6d0e02f42a8a0bd412adffcaa3f4d13fb6688f3c1092ef114c445a5cab1e858` |
| `src/intensicare/services/domain_profilaxia.py` | `de349e49f84dedf68a08cdaef4ec7fc488ad9e69184149dc7e24bb3816eaf921` |
| `src/intensicare/services/domain_prescricao.py` | `31bb4dae220f129a9f56a27fa006adc0e507aae17d43487abba955f1e6c211de` |
| `src/intensicare/services/domain_eficiencia.py` | `c9f779e3ef88ee0b807092b6ecc5c2784dafa3fd17cb5b9e7237254b011b5128` |
| `src/intensicare/services/drug_safety.py` | `f4197af10f451fd20f2a2320ca7a25baedc88202fd9458670faa567d2ad2bbb7` |
| `src/intensicare/services/drug_interactions.py` | `199afda58f6131dc57e985bc90120e0205ace1cf5fc94b40051d38a09ff08ed8` |
| `src/intensicare/services/anvisa_drug_database.py` | `158d465e46619339503573254e579a07b8a7630f19cb69891424de859eae5ac9` |
| `src/intensicare/models/antimicrobial.py` | `543b696f311da4adfd91c1c5043da659efab7c3fc50559492c6c88f0288231b2` |
| `src/intensicare/models/medication.py` | `88ed99a3cfdd6935526f2f794f6b1bc0713f62a3e6ab3abfdce9dfc2c1e6cab2` |
| `src/intensicare/models/prescricao.py` | `f186fe95321270c06cea9b30c159c0ffa6f0539032b55cca6d6c8aa467de7e87` |
| `src/intensicare/models/prophylaxis.py` | `ce9d805dfcad2de9829194f7046980a1ca7f4954c4248cbc042210eea97d8c32` |
| `src/intensicare/schemas/antimicrobial.py` | `24dbbbbb7d3836f4ed7cde6bc3b50a6ada279086ae6247fabc1bcc9cee83377a` |
| `src/intensicare/schemas/prescricao.py` | `d429742f59d5fe801471298796e2a0d1f8c5fe7335aee4ddb9340d00f4cfa0c5` |
| `src/intensicare/schemas/prophylaxis.py` | `d99465de24233e1f5bf1b1d3fd5c5987e6b412ffa0f35edf3d848634a459d791` |
| `src/intensicare/api/v1/antimicrobial.py` | `3038aa9c5a411e6491e6cc97458fcb00cf2722082e84400a3bff207d80c52d5d` |
| `src/intensicare/api/v1/prescricao.py` | `2bce7c481dfd0cb527f6ed9b653fb32ee61dce49cfa4082ea41e5acc0be655df` |
| `src/intensicare/api/v1/prophylaxis.py` | `e467de1686914991217fce1ace20b59082f21e366e5fa93bc850b471243799c9` |
| `src/intensicare/api/v1/efficiency.py` | `530a04f6bfc5ec539548c5de52e9b0609dc8e20743ecec958101ea6a23783559` |
| `_work/alerts/pathways/antimicrobiano.yaml` | `0ef987c51ad18ab9dea0123da1fec8c2c07b96833abe6a5ce9ee6db8e4e3758f` |
| `_work/alerts/pathways/profilaxia.yaml` | `0e33e945a67e0671c7f6cc957215c1f221d7b1f13e5ef01f8d024ad0584598bc` |
| `docs/plan/_work/alerts/pharmaco-interaction.yaml` | `ee403fbe4d63d694993ac4858f83f8bc3cc920cbe413f3323b3e6c8fae6fc992` (rt) |
| `docs/plan/clinical/domains/pharmaco-interaction.md` | `4fd1bed23543bcf5244d4a078d55534fc1132745214041561641ab0ab7e5706d` (rt) |
| `docs/adr/0026-prescricao-drug-interaction-safety.md` | `3d95b144f2a199594bf2cb7116ce7e08a4952a81a70f953e30159c16e45957e0` (rt) |
| `docs/adr/0027-prescricao-lifecycle-state-machine.md` | `7385d8c3b5b1a5b76f77401268218cd8eaa8083ec0c5d3d48c9c304ebd55a00e` (rt) |

## 1. Antimicrobial stewardship (`domain_antimicrobiano.py`)

12 criteria (crit-001..012: duration >7 d; over-broad spectrum; dose out of
range for weight/renal function; CVC >7 d; candidemia without de-escalation
≤72 h; cultures pending >72 h; CAP without severity criteria; double
gram-negative coverage; vancomycin >72 h without MRSA; surgical prophylaxis
>24 h; vancomycin/aminoglycoside >72 h without levels; CVC without dressing
documentation). Criteria are clinically plausible IDSA/SHEA-style
stewardship items (uncited in code).

**Defects (verbatim-anchored):**

1. **Broken predicate — every criterion marks met when inputs supplied.**
   `domain_antimicrobiano.py:212-215`:

   ```python
   is_met = crit_def["id"] in criteria_met_set or (
       inputs is not None
       and evaluate_criterion(crit_def, inputs.get(crit_def["id"])) is not None
   )
   ```

   `evaluate_criterion` always returns a result object (never None), so any
   inputs-driven assessment sets all 12 criteria met → score 12 → VERMELHO
   for every patient. The rule engine itself is a placeholder that always
   returns `met=False` (lines 155-186) — the automated path is both wired
   wrong and empty.
2. **Count-as-severity with a reassuring floor**: score ≤3 → NEUTRO with
   recommendation "Prescrição antimicrobiana dentro dos parâmetros
   adequados" (230-263). A patient whose single non-conformity is
   crit-005 (candidemia without de-escalation) is rendered NEUTRO/adequate —
   severity by count, not by criterion criticality (HAZ-0005-adjacent false
   reassurance).
3. Legacy color vocabulary NEUTRO/AMARELO/VERMELHO, not the canonical
   severity model.

## 2. Prophylaxis bundles (`domain_profilaxia.py`)

Five checklists (stress ulcer/LAMGD, VTE, glycemic control, early
mobilization, invasive devices); score = %criteria met of applicable;
no automated triggers. Values embedded: glycemic target 140-180 mg/dL
(NICE-SUGAR-consistent), monitoring q4-6h, cuff 20-30 cmH2O, HOB 30-45°,
CVC dressing 7 d, hydrocortisone >300 mg/d as steroid risk factor
(literature commonly uses >250 mg hydrocortisone-equivalent —
VALIDATE), coagulopathy INR >1.5 or platelets <50k, MV >48 h (classic
Cook-era SUP risk factors).

**Semantic incoherence**: the LAMGD bundle's four "criteria" are risk-factor
*indications* (MV >48 h, coagulopathy, shock, steroids) while TEV/glycemia
bundles list *adherence* items — marking all four LAMGD indications met
yields "complete (100%)" as if compliant, and **no criterion anywhere checks
that stress-ulcer prophylaxis is actually prescribed**. The bundle cannot
detect its own headline failure (indicated-but-absent prophylaxis; that
signal lives only in RULE-PROFILAXIA-005's legacy predicate and nowhere in
this service).

## 3. Prescription domain (`domain_prescricao.py`, plus ADR-0026/0027)

- State machine (160-380): draft→active→{completed, discontinued,
  suspended}; suspended→{active, discontinued}; terminal states locked;
  reasons required on discontinue/suspend; end_time auto-set;
  optimistic-locking `version` on the model — consistent with ADR-0027 and
  a genuine improvement over the legacy dose-level flags (HAZ-0023-aware).
- `_parse_dosage` (75-90): unparseable dosage strings → `(0.0, "mg")`.
  A Brazilian comma-decimal dosage ("2,5mg") fails the regex and the float
  fallback and is **silently zeroed** — the SYS-09 comma-decimal defect
  family recurring on medication doses. New prescriptions are protected by
  R03 (dose must be positive), but *stored* records surface through
  `_model_to_record` with dose 0.0 in interaction/display paths.
- Validators: V03 "allergy check" (1202-1224) **never consults the
  patient's allergy list** — it emits a generic "verify allergy history"
  warning whenever the drug belongs to any group and always passes. The
  advertised drug-allergy interaction type is not implemented against
  patient data. V04 blocks only `contraindicated`; `severe` interactions
  (e.g., fentanyl+midazolam apnea risk) warn only — a deliberate policy that
  must be re-decided by V2 governance, not inherited.
- R15 hard cap 15 active prescriptions; R16 polypharmacy warn ≥8 —
  operational values, UNCITED.

## 4. Dose safety (`drug_safety.py`)

21-drug table (min/max single dose, max daily, infusion caps, weight-based
doses, renal multipliers for 7 drugs, elderly −50% advisories for
midazolam/morphine, pediatric fraction-of-adult factors).

**Defects (verbatim-anchored):**

1. **Non-mg drugs are never dose-checked.** `_validate_dose` reads only
   `max_single_mg`/`min_single_mg` (606-617), but insulin/heparin define
   `max_single_ui`, KCl `max_single_mEq`, NaCl 3% `max_single_mL`,
   norepinephrine/dobutamine `max_single_mcg_kg_min`, fentanyl
   `max_single_mcg`. For every one of these high-alert drugs the single-dose
   check silently no-ops — insulin 500 UI or KCl 200 mEq passes with no
   warning. R34's infusion check reads `infusion_rate_max_mg_h` (defined
   only for vancomycin), so `max_infusion_ui_h` (insulin, heparin) is dead
   too. **The safety net has holes exactly over the highest-risk drugs.**
2. `_mass_to_mg` maps mL→1.0 ("assume 1 mg/mL"), UI→1.0, mEq→1.0
   (442-453) — dimensionally invalid equivalences that make any cross-unit
   comparison meaningless (a mL-written dipirona dose is off 500×).
3. R33 pediatric dosing = fixed fraction of adult dose per age bracket
   (neonate 5% … adolescent 75%, 410-416) — not a recognized pediatric
   dosing method for these drugs; dangerous as advisory text in an adult
   ICU product that may see boundary ages.
4. `_validate_dose` always returns `valid=True` (695-697) — every breach is
   advisory; no hard stop exists even for the KCl >20 mEq/h arrhythmia
   warning (R35, which also conflates a q6h dose with an hourly rate).
5. Table values (meropenem 500-2000 mg, max 6 g/d; vancomycin 15 mg/kg,
   infusion ≤1 g/h; propofol ≤4 mg/kg/h; KCl ≤40 mEq single, ≤20 mEq/h;
   NaCl 3% ≤100 mL/h; enoxaparin renal multipliers; meropenem full dose at
   GFR 26-50 — label-discordant, most references reduce at CrCl ≤50) are a
   plausible-but-UNCITED pharmacopeia; several rows need pharmacist
   re-derivation (VALIDATION REQUIRED as a set).

## 5. Interaction knowledge base (`drug_interactions.py`, `anvisa_drug_database.py`)

Hardcoded pairwise KB over the same 21 drugs + class groupings + allergy
cross-reactivity groups + stacking rules (R21 ≥2 opioids severe; R22 ≥3
sedatives severe; R23 ≥2 anticoagulants contraindicated; R24 ≥8 drugs
polypharmacy).

**Content audit (clinically dubious or wrong entries):**

| Entry | Claim | Assessment |
|---|---|---|
| vancomicina × amiodarona (`drug_interactions.py:67-76`) | "severe — QT prolongation/Torsades" | vancomycin is not a recognized QT-prolonging agent; pair absent from standard DDI references — **UNVERIFIED/likely fabricated** |
| noradrenalina × dobutamina (127-136) | "physical incompatibility same line — crystallization risk" | the agents are commonly co-infused and standard compatibility references list them Y-site compatible — **UNVERIFIED/likely fabricated** |
| ceftriaxona × cloreto_de_sodio_3% (167-176, and R26 411-421) | "contraindicated — calcium-containing solutions (including NaCl 3%)" | ceftriaxone-calcium precipitation applies to calcium-containing solutions; **hypertonic saline contains no calcium** — factually wrong contraindication |
| meropenem × vancomicina (147-156) | "minor — expected synergism" | a non-interaction editorialized into the KB; noise |
| heparina × enoxaparina (97-106) | "absolute contraindication" | duplicate therapeutic anticoagulation is a genuine severe flag; "absolute contraindication" phrasing overstates transition scenarios — REFINE wording |

R18 "drug-allergy" check (293-304) tests whether two *prescribed* drugs
share an allergy group — that is duplication detection mislabeled as allergy
checking; patient allergies are never read (matches the V03 finding).
Coverage is arbitrary: known pairs among the same 21 drugs are missing
(e.g., amiodarone×fentanyl, omeprazole×enoxaparin-class effects), so the KB
is simultaneously over- and under-inclusive. `anvisa_drug_database.py` is an
explicit stub ("Future endpoint (speculative)") whose in-memory records
present themselves as ANVISA Bulário content — fabricated-registry risk if
ever surfaced as authoritative.

Contrast: the **pharmaco-interaction catalog**
(`docs/plan/_work/alerts/pharmaco-interaction.yaml`, 8 alerts / 34 vectors /
17 citations) anchors its QTc alert to CredibleMeds Known-Risk + Tisdale
2013, serotonin syndrome to Boyer & Shannon NEJM 2005 + Hunter criteria,
CNS-depression to Overdyk 2016, with symptom gates and controlled-ventilation
suppression — a materially higher evidence standard than the hardcoded KB.
The two surfaces are **parallel and divergent**; V2 must have exactly one
interaction source of truth. (Its runtime loader `domain_pharmaco_delirium.py`
is reviewed by neuro-sedation-scores; catalog content is owned here —
cross-check note, no double assignment.)

## 6. Efficiency / transfusion appropriateness (`domain_eficiencia.py`)

12 transfusion criteria (TF-001..012), restraint (>4 h reassessment),
frailty (CFS 1-9, Rockwood-consistent categories), LOS outlier (>1.5×
expected or >14 d).

**Defects (verbatim-anchored):**

1. **TF-002 inverted against the restrictive strategy.**
   `domain_eficiencia.py:290-307`:

   ```python
   # TF-002: Hb >= 7 g/dL (gatilho restritivo) — met means it's WITHIN threshold (appropriate)
   tf002_met = hb_pre is not None and hb_pre >= 7.0
   ```

   The criterion catalog says transfusion at Hb ≥7 "requer justificativa"
   (the detail string for the met case even says so), yet `met` **adds a
   point toward appropriateness** exactly when the transfusion violates the
   restrictive trigger (TRICC/AABB direction). A liberal transfusion scores
   as more appropriate.
2. **Count-based appropriateness**: `appropriate = met_count >= 8` of 12
   (479) — a transfusion with unconfirmed ABO compatibility, no consent and
   a transfusion reaction can still be "appropriate" on documentation
   points. Never-event-class criteria must be individually blocking, not
   poolable.
3. CFS/restraint/LOS components are plausible (CFS ≥5 frail; >4 h restraint
   reassessment) — UNCITED in code.

## 7. Pathway content (`antimicrobiano.yaml`, `profilaxia.yaml`)

- ATB duration bands 0-3/3-7/7-10/≥10 d → normal/watch/urgent/critical;
  IDSA/SHEA 2016 cited (`doi 10.1093/cid/ciw118` — consistent with the
  implementation guideline; not re-fetched). Duration alone reaching
  "critical" overloads the emergency tier (stewardship-priority semantics).
- PCT bands 0-0.25/0.25-0.5/0.5-2.0/≥2.0 → normal→critical: the catalog
  narrative (de-escalate when PCT <0.5 or −80% from peak) is
  evidence-consistent; banding *high* PCT as critical converts a
  de-escalation guide into a severity alarm — needs deliberate clinical
  decision.
- **Boolean criterion polarity ambiguity (blocking):** `profilaxia.yaml`
  criteria fire on `tev_profilaxia == true` / `ugb_profilaxia == true` /
  `mobilizacao_status == true`; `antimicrobiano.yaml` on
  `culturas_resultado == true` and `descalonamento_status == true`. If the
  trilhas engine raises alerts when predicates match, these alert on
  prophylaxis *given* and de-escalation *done* — inverted signals. Whether
  criterion-match means "alert" or "milestone achieved" is an engine
  semantic owned by the pathways workstream — **cross-workstream flag
  raised; verdict on these booleans is blocked pending that engine ruling.**
- Head-of-bed bands (<20° critical / 20-30 watch / ≥30 normal)
  direction-correct for VAP prevention.

## 8. HAZ-0005 zero-coercion assessment

| Path | Behavior | Assessment |
|---|---|---|
| Antimicrobial score | ≤3 non-conformities → NEUTRO "adequate" | count floor renders real findings as adequacy — false reassurance |
| Antimicrobial inputs path | all criteria met on any inputs (defect §1.1) | inverse failure: fabricated positives (alarm-integrity, HAZ-0036) |
| Prophylaxis bundles | unmarked criteria = pending, not risk | acceptable checklist semantics; no coercion |
| `_parse_dosage` | unparseable/comma-decimal → 0.0 mg | zero-coercion on stored medication doses |
| Dose validation | non-mg drugs skip checks silently | absence of validation indistinguishable from validated-safe (HAZ-0021 analogue) |
| V03 allergy validator | no patient allergy data → always passes | absent data = no risk, by construction |
| TF-002 | missing Hb → criterion unmet, but TF-001 already flags undocumented Hb | partial mitigation; inversion defect dominates |

## 9. Verdicts (all PROPOSAL)

| Artifact / path | Verdict | Rationale |
|---|---|---|
| `domain_antimicrobiano.py` evaluate path | REJECT | always-true met predicate; count-as-severity; placeholder engine |
| 12 stewardship criteria (content) | VALIDATE | IDSA/SHEA-plausible checklist items worth carrying as *criteria*, with per-criterion severity, under pharmacist/ID review |
| `domain_profilaxia.py` | REFINE | checklist mechanics fine; LAMGD bundle must gain a prophylaxis-prescribed member and separate indication from adherence semantics |
| Prescription state machine (+ADR-0027) | REFINE | sound design, optimistic locking; carry concept with V2 acceptance tests |
| `_parse_dosage` | REJECT | silent zeroing incl. comma-decimal — the documented legacy locale-parse hazard class |
| Validators V03/V04 | REJECT (V03) / VALIDATE-with-policy-decision (V04) | allergy check is not an allergy check; severe-warn-only needs an explicit V2 decision |
| `drug_safety.py` validation logic | REJECT as implemented | unit-key mismatches disable checks for the highest-alert drugs; mL/UI/mEq→mg equivalences invalid; advisory-only everywhere |
| `drug_safety.py` table values | VALIDATE | plausible uncited pharmacopeia; per-row pharmacist re-derivation required (meropenem renal row discordant) |
| Pediatric fraction dosing (R33) | REJECT | not a recognized dosing method; out of adult-ICU intended use |
| `drug_interactions.py` KB | REJECT (content) / TRANSFORM (mechanism) | fabricated/wrong entries (vanco-amio QT, NaCl-3% calcium, nora-dobuta incompatibility); rebuild from an authoritative source per the pharmaco spec |
| Stacking rules R21-R24 | VALIDATE | blunt but defensible class-level guards |
| `anvisa_drug_database.py` | ARCHIVE | explicit stub; never surface stub data as registry content |
| `pharmaco-interaction.yaml` + `domains/pharmaco-interaction.md` | VALIDATE | best-cited artifact in the OSMS scope (CredibleMeds/Tisdale/Boyer-Shannon/Hunter/Overdyk); make it the single interaction source |
| `domain_eficiencia.py` transfusion score | REJECT | TF-002 inversion + count-based appropriateness masking never-event criteria |
| CFS / restraint / LOS components | VALIDATE | Rockwood-consistent; uncited |
| `antimicrobiano.yaml` pathway | VALIDATE (duration/PCT values) with severity-tier note | boolean-polarity items blocked on engine semantics |
| `profilaxia.yaml` pathway | VALIDATE (HOB bands) / BLOCKED (boolean polarity) | potential inverted alerts pending pathways-engine ruling |
| Models/schemas/APIs (antimicrobial, medication, prescricao, prophylaxis, efficiency) | ARCHIVE/REFINE | persistence and transport; prescricao model default status "active" (not draft) noted; schemas bake count contracts (0-12, 0-100) that fall with the count-severity rejections |
| ADR-0026 | ARCHIVE (reference) | hybrid local-KB decision context; its 4-severity vocabulary survives, its KB content does not |

**Worst finding:** the medication-safety layer's protective checks are
structurally hollow at the highest-risk points — the antimicrobial evaluator
marks every criterion met (or none, via the placeholder), the dose validator
silently skips insulin/heparin/KCl/vasopressor/fentanyl limits through
unit-key mismatches, the allergy check never reads patient allergies, and
the interaction KB contains fabricated entries — while presenting itself as
an active safety net (HAZ-0021/HAZ-0036 class: the appearance of checking
without the checking).
