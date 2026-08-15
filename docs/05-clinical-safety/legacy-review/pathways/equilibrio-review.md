---
id: LEGREV-PATH-EQUILIBRIO
title: Legacy pathway review — Equilíbrio Hidroeletrolítico (equilibrio.yaml)
label: OBSERVED
status: PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI)
statement: >
  Source-verified review of the V1 electrolyte-balance pathway. Band values are
  conventional, but the citation is the weakest in the portfolio: the DOI is not
  registered at Crossref (HTTP 404), the named "ESICM Guidelines on Electrolyte
  Disorders" could not be identified as a real edition, and UpToDate is a tertiary
  source. Proposed verdict VALIDATE.
provenance:
  source_repo: intensicare (legacy V1, READ-ONLY)
  path_or_url: _work/alerts/pathways/equilibrio.yaml
  commit_sha_or_version: 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79 (legacy HEAD at pin, 2026-08-15)
  section_or_lines: whole file (186 lines); SHA-256 5d3af65ac19c81d4574a8c5848f4599949aad666ef0be808cdeb672607e60194 (pin manifest)
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

# Equilíbrio Hidroeletrolítico (`equilibrio`) — legacy review

## 1. Identity and structure

OBSERVED (`equilibrio.yaml:3-10`): id 9, slug `equilibrio`, version `3.0.1`, active,
mode hybrid. 4 inputs, 4 criteria (all graded → 4 band sets, 18 band rows — the
largest band-row contributor tied with nutricao/respiratorio), 4 states, suppression
cooldown 30 min / rate 6/h.

Version note (`equilibrio.yaml:14-16`, verbatim comment): "NOTA: fosforo removido
(órfão — critério que o consuma pendente de autoria clínica; reposição de fósforo já
mencionada em evidence.recommendations mas sem thresholds definidos)" — phosphate was
dropped for lack of clinical authorship while the recommendations still tell the
clinician to monitor it. Documented drift between recommendation text and evaluated
content.

## 2. Clinical intent and target condition

SOURCE (`equilibrio.yaml:9`, verbatim): "Monitorização e correção de distúrbios
hidroeletrolíticos em pacientes críticos. Avaliação sistemática de sódio, potássio,
magnésio, cálcio iônico e fósforo com reposição guiada por protocolo." Target:
electrolyte disturbances in ICU patients. Note: the description promises five
electrolytes; the definition evaluates four (phosphate removed, §1).

## 3. Inclusion / enrollment criteria as implemented

OBSERVED: none in the YAML. Manual enrollment; no `equilibrio` branch in
`check_pathway_eligibility` — generic fallback `eligible=True`
(`domain_trilhas_engine.py:359-362`).

## 4. Inputs (verbatim)

| name | source | unit |
|---|---|---|
| `sodio` | amh_gold | mEq/L |
| `potassio` | amh_gold | mEq/L |
| `magnesio` | amh_gold | mg/dL |
| `calcio_ionico` | amh_gold | mmol/L |

Auto-sourcing (OBSERVED): **none** (`pathway_auto_evaluation.py:113-158` provides no
electrolyte keys). All criteria manual-PUT-only (HAZ-0043 shape).

## 5. Criteria, band sets, thresholds (verbatim, `equilibrio.yaml:35-146`)

**crit-eq-sodio — Sódio Sérico** (graded, mEq/L):

| Range | Severity | Score | Label (verbatim) |
|---|---|---|---|
| [0, 125) | critical | 3 | "Hiponatremia grave — risco neurológico" |
| [125, 135) | watch | 1 | "Hiponatremia leve" |
| [135, 145) | normal | 0 | "Sódio normal" |
| [145, 155) | watch | 1 | "Hipernatremia leve" |
| [155, +inf) | critical | 3 | "Hipernatremia grave" |

**crit-eq-potassio — Potássio Sérico** (graded, mEq/L):

| Range | Severity | Score | Label (verbatim) |
|---|---|---|---|
| [0, 2.5) | critical | 3 | "Hipocalemia grave — risco de arritmia" |
| [2.5, 3.5) | urgent | 2 | "Hipocalemia moderada" |
| [3.5, 5.0) | normal | 0 | "Potássio normal" |
| [5.0, 6.0) | watch | 1 | "Hipercalemia leve" |
| [6.0, +inf) | critical | 3 | "Hipercalemia grave — risco de parada cardíaca" |

**crit-eq-magnesio — Magnésio Sérico** (graded, mg/dL): [0,1.5) critical, [1.5,1.8)
watch, [1.8,2.5) normal, [2.5,+inf) watch "Hipermagnesemia — monitorizar".

**crit-eq-calcio — Cálcio Iônico** (graded, mmol/L): [0,0.8) critical, [0.8,1.0)
watch, [1.0,1.3) normal, [1.3,+inf) watch "Hipercalcemia — investigar".

States: `initial` → `correcao` → `monitorizacao` → `alta` (terminal; ">48h" stability
window is prose only).

## 6. Timing / cadence

Declared hybrid; dead metadata (`engine-review.md` §3). The recommendations text
("Monitorizar… a cada 12-24h") has no enforcing mechanism. Effective triggers:
vitals-ingestion hook (sources nothing here) and manual PUT.

## 7. Missing-data behavior (HAZ-0005 lens)

Engine-generic: absent electrolyte → criterion silently skipped → `overall_severity
normal` (`trilhas_evaluator.py:388-397`, `472-481`). Pathway-specific: electrolyte
panels are intermittent by nature; between draws every value is absent, so the
realistic steady state of this pathway is "normal by silence." No staleness handling
exists — a 5-day-old potassium (if manually PUT once) would keep classifying forever
(`engine-review.md` §4). Severe asymmetric risks: a missing K+ in a digoxin/CRRT
patient renders identically to a verified-normal K+.

## 8. alert_groups

Absent (schema forbids; `pathway-index.md` §3). No test vectors.

## 9. Guideline anchoring

OBSERVED (`equilibrio.yaml:179-180`): `guideline: "ESICM Guidelines on Electrolyte
Disorders in the ICU; UpToDate: Management of Electrolyte Disturbances in Critically
Ill Patients"`, `doi: 10.1007/s00134-012-2768-4`. Verification (2026-08-15):
Crossref returns **HTTP 404 — the DOI is not registered** (BROKEN). No ESICM
guideline with the quoted title could be identified as a real published edition.
UpToDate is a tertiary reference, not a citable primary authority under
`evidence-notation.md` discipline. **Effectively UNCITED at any verifiable level.**

INFERENCE — what the authoritative anchors WOULD be (proposal for V2 authorship, not
a claim about V1): hyponatremia — European hyponatraemia guideline (Spasovski G et
al., Intensive Care Med 2014;40(3):320-331, doi 10.1007/s00134-014-3210-2);
hyperkalemia emergency management — resuscitation-council/renal association guidance;
severe electrolyte derangements — society consensus per electrolyte. Where the
implemented values sit vs. convention: Na 135-145, K 3.5-5.0, Mg 1.8-2.5 mg/dL,
iCa 1.0-1.3 mmol/L normal ranges and the severe cut-offs (Na <125/>155, K <2.5/>=6.0,
iCa <0.8) are within commonly used laboratory-and-textbook conventions; note iCa
normal is conventionally quoted ~1.12-1.32 mmol/L, so [1.0,1.12) reading "normal"
here is mildly permissive; hypermagnesemia and hypercalcemia never exceed `watch`
severity — arguably under-weighted for extreme values (e.g. iCa 2.0 → watch).

## 10. Verdict

**PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI): VALIDATE.**
Rationale: the band values are conventional and mostly defensible, but the citation
is broken/tertiary (the weakest in the portfolio), the upper-severity ceiling for
hyper-states is questionable, phosphate silently vanished from evaluation while
remaining in the recommendations, and no input has a live source. Requires named
clinical owner, real primary citations per electrolyte, and completeness decision
(phosphate) before any import. Not DECIDED; import blocked until
`legacy-import-policy.md` §3 is satisfied.
