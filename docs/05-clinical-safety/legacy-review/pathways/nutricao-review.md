---
id: LEGREV-PATH-NUTRICAO
title: Legacy pathway review — Nutrição Enteral (nutricao.yaml)
label: OBSERVED
status: PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI)
statement: >
  Source-verified review of the V1 enteral-nutrition pathway. Caloric/protein targets
  match the verified ESPEN 2019 anchor; the gastric-residual banding partially
  conflicts with the also-cited ASPEN/SCCM 2016 guidance; no input is auto-sourced.
  Proposed verdict VALIDATE.
provenance:
  source_repo: intensicare (legacy V1, READ-ONLY)
  path_or_url: _work/alerts/pathways/nutricao.yaml
  commit_sha_or_version: 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79 (legacy HEAD at pin, 2026-08-15)
  section_or_lines: whole file (211 lines); SHA-256 b2dc4ae2f7fff4bcad5e1923647053fdcfd1565c7b5a0f9cf850628bd561dd95 (pin manifest)
  date_collected: 2026-08-15
  collector: legacy care-pathway definitions forensics reviewer (cycle 1, Task 1)
  transformation: read in full; thresholds tabulated verbatim; verdict proposed
  confidence: high
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  hazards: [HAZ-0005, HAZ-0043]
supersedes: null
superseded_by: null
---

# Nutrição Enteral (`nutricao`) — legacy review

## 1. Identity and structure

OBSERVED (`nutricao.yaml:3-10`): id 4, slug `nutricao`, version `3.0.0`, active,
mode micro-batch. 6 inputs, 6 criteria (all graded → 6 band sets — the largest
graded count of any pathway; 18 band rows), 4 states, suppression cooldown 60 min /
rate 3/h.

## 2. Clinical intent and target condition

SOURCE (`nutricao.yaml:9`, verbatim): "Acompanhamento da terapia nutricional enteral
(TNE) em pacientes críticos. Triagem nutricional, progressão da dieta até meta
calórico-proteica, monitorização de tolerância e transição para via oral." Target:
enteral nutrition therapy adequacy and tolerance in ICU patients.

## 3. Inclusion / enrollment criteria as implemented

OBSERVED: none in the YAML. Manual enrollment. Advisory eligibility Rule 18
(`domain_trilhas_engine.py:318-339`): eligible when keys intersect `{triagem, nrs,
crit-nut-triagem}` OR `{nutricional, calorias, proteinas, crit-nut-calorias}`;
`eligible=True` presumption with no data.

## 4. Inputs (verbatim)

| name | source | unit |
|---|---|---|
| `nrs_score` | amh_gold | points |
| `aporte_calorico` | amh_gold | % |
| `aporte_proteico` | amh_gold | g/kg/dia |
| `residuo_gastrico` | amh_gold | mL |
| `albumina` | amh_gold | g/dL |
| `diarreia_episodios` | amh_gold | episódios/dia |

Auto-sourcing (OBSERVED): **none** (`pathway_auto_evaluation.py:113-158`). All
criteria manual-PUT-only (HAZ-0043 shape).

## 5. Criteria, band sets, thresholds (verbatim, `nutricao.yaml:40-171`)

**crit-nut-triagem — Triagem NRS-2002** (graded, points): [0,3) normal "Sem risco
nutricional"; [3,5) watch "Risco nutricional moderado"; [5,+inf) urgent "Alto risco
nutricional — TNE precoce indicada".

**crit-nut-calorias — Aporte Calórico** (graded, % of daily target): [0,60) critical
"muito abaixo da meta"; [60,80) watch "parcial"; [80,+inf) normal "Meta calórica
atingida".

**crit-nut-proteinas — Aporte Proteico** (graded, g/kg/dia): [0,0.8) critical
"insuficiente"; [0.8,1.2) watch "subótimo"; [1.2,+inf) normal "Meta proteica
atingida".

**crit-nut-residuo — Resíduo Gástrico** (graded, mL): [0,200) normal "Tolerância
adequada"; [200,500) watch "Intolerância leve — reduzir velocidade"; [500,+inf)
critical "Intolerância grave — suspender dieta".

**crit-nut-albumina — Albumina Sérica** (graded, g/dL): [0,2.5) critical; [2.5,3.0)
watch; [3.0,+inf) normal.

**crit-nut-diarreia — Diarreia** (graded, episódios/dia): [0,1) normal; [1,4) watch;
[4,+inf) urgent "Diarreia grave".

States: `initial` (Avaliação Nutricional) → `progressao` → `meta` → `alta` (terminal,
"Via Oral Plena").

Severity-direction note (INFERENCE): unlike deterioration pathways, low intake
severity here means "target not reached" — a care-process deficiency, not acute
physiology. Mixing this in the same `critical` token as, e.g., anuria contributes to
severity-vocabulary pollution across the portfolio (one shared CON-SEED-11 scale for
physiologic danger and process shortfall).

## 6. Timing / cadence

Declared **micro-batch** — the mode that would most plausibly fit daily nutrition
data. OBSERVED: no micro-batch scheduler exists; the mode is dead metadata
(`engine-review.md` §3). Effective triggers: vitals-ingestion hook (sources nothing
here) and manual PUT; i.e., the pathway evaluates only when someone else's vitals
event or a manual action happens to occur.

## 7. Missing-data behavior (HAZ-0005 lens)

Engine-generic silent-skip → `normal` (`trilhas_evaluator.py:388-397`, `472-481`).
Pathway-specific: nutrition inputs are once-daily human-computed quantities with no
identified live source; the realistic steady state is all-pending → enrollment
severity `normal` (`pathway_enrollment.py:779-780`) — a nutrition pathway that
displays as active/normal while auditing no intake at all. A 60%-of-target patient
whose intake was never recorded is indistinguishable from a patient meeting target.

## 8. alert_groups

Absent (schema forbids; `pathway-index.md` §3). No test vectors.

## 9. Guideline anchoring

OBSERVED (`nutricao.yaml:204-205`): `guideline: "ESPEN Guideline on Clinical
Nutrition in the Intensive Care Unit (2019); ASPEN/SCCM Guidelines for Nutrition
Support in Critically Ill Adult Patients (2016)"`, `doi: 10.1016/j.clnu.2018.08.037`.
Crossref (2026-08-15): Singer P et al., "ESPEN guideline on clinical nutrition in
the intensive care unit", Clin Nutr 2019 — **MATCH** (ASPEN/SCCM 2016 named without
DOI).

INFERENCE — implemented values vs. anchors (labeled inference):

- **Agree:** NRS-2002 >= 3 as at-risk and >= 5 as high risk; early EN within 24-48h;
  protein >= 1.2 g/kg/day (ESPEN 2019 recommends ~1.3; ASPEN 1.2-2.0); reaching a
  substantial fraction of the caloric target by ~72h with hypocaloric early feeding
  tolerated — the >= 80% band is a defensible operationalization.
- **Partially conflicting:** routine gastric-residual banding. ASPEN/SCCM 2016 —
  cited by this very file — advises **against** using GRV as a routine monitoring
  variable, and where used, against holding EN below 500 mL absent other signs. The
  [200,500) "watch — reduzir velocidade" band therefore encodes practice the cited
  anchor discourages; only the >= 500 "suspender" step is anchor-consistent.
- **Weakly anchored:** albumin as a nutrition-status marker — contemporary guidance
  treats albumin as an inflammation marker, not a nutrition target; retaining it as
  a nutrition criterion needs explicit clinical justification.

## 10. Verdict

**PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI): VALIDATE.**
Rationale: real, mostly anchor-consistent content with a verified primary citation,
but the GRV banding contradicts a cited anchor, albumin's role is outdated, the
declared cadence is unimplemented, and no input has a live source. Requires named
clinical owner and per-criterion evidence adjudication before any import decision.
Not DECIDED; import blocked until `legacy-import-policy.md` §3 is satisfied.
