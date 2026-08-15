---
id: LEGREV-PATH-PROFILAXIA
title: Legacy pathway review — Profilaxia (profilaxia.yaml)
label: OBSERVED
status: PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI)
statement: >
  Source-verified review of the V1 ICU prophylaxis-bundle pathway. As implemented, its
  three boolean compliance criteria fire an "urgent" alert when prophylaxis IS
  administered and stay silent when it is missing — the alerting direction is inverted
  relative to the pathway's own stated intent. The cited DOI resolves to a different
  guideline (PAD 2013). Proposed verdict TRANSFORM.
provenance:
  source_repo: intensicare (legacy V1, READ-ONLY)
  path_or_url: _work/alerts/pathways/profilaxia.yaml
  commit_sha_or_version: 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79 (legacy HEAD at pin, 2026-08-15)
  section_or_lines: whole file (120 lines); SHA-256 0e33e945a67e0671c7f6cc957215c1f221d7b1f13e5ef01f8d024ad0584598bc (pin manifest)
  date_collected: 2026-08-15
  collector: legacy care-pathway definitions forensics reviewer (cycle 1, Task 1)
  transformation: read in full; thresholds tabulated verbatim; verdict proposed
  confidence: high
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  hazards: [HAZ-0005, HAZ-0021, HAZ-0043]
supersedes: null
superseded_by: null
---

# Profilaxia (`profilaxia`) — legacy review

## 1. Identity and structure

OBSERVED (`profilaxia.yaml:3-10`): id 7, slug `profilaxia`, version `3.0.0`, active.
4 inputs, 4 criteria (3 boolean + 1 graded → 1 band set, 3 band rows), 3 states
(the only pathway with fewer than 4), suppression cooldown 60 min / rate limit 2 per
hour.

## 2. Clinical intent and target condition

SOURCE (`profilaxia.yaml:9`, verbatim): "Bundle de profilaxias essenciais em UTI:
tromboembolismo venoso (TEV), úlcera gástrica por estresse (UGE), mobilização precoce
e cabeceira elevada. Prevenção de complicações evitáveis em pacientes críticos." —
essential ICU prophylaxis bundle: VTE, stress-ulcer, early mobilization, head-of-bed
elevation. Target: prevention of avoidable ICU complications; effectively a
compliance-audit pathway.

## 3. Inclusion / enrollment criteria as implemented

OBSERVED: none in the YAML. Manual enrollment via `pathway_enrollment.enroll_patient`.
No `profilaxia` branch in `check_pathway_eligibility`; the generic fallback returns
`eligible=True` ("Sem contraindicações automáticas identificadas…",
`domain_trilhas_engine.py:359-362`) even with zero patient data.

## 4. Inputs (verbatim)

| name | source | unit | description (summarized) |
|---|---|---|---|
| `tev_profilaxia` | amh_gold | ratio | VTE prophylaxis prescribed and administered (true = per protocol) |
| `ugb_profilaxia` | amh_gold | ratio | stress-ulcer prophylaxis prescribed (true = per protocol) |
| `mobilizacao_status` | amh_gold | ratio | early mobilization performed (true = performed) |
| `cabeca_elevada` | vitals_stream | graus | head-of-bed elevation angle (degrees) |

Auto-sourcing (OBSERVED): **none** of the four inputs is provided by
`_build_generic_vitals_inputs` (`pathway_auto_evaluation.py:113-158`). All criteria
remain pending forever unless manually PUT.

## 5. Criteria, thresholds (verbatim, `profilaxia.yaml:32-86`)

Boolean criteria (each: `operator: "==", value: true`; note the compiler ignores
`operator`/`value` on booleans and uses truthiness only — `trilhas_compiler.py:403-423`,
`607-627`):

| id | name | fires (met=True) when… | severity when met |
|---|---|---|---|
| crit-prof-tev | Profilaxia de TEV | VTE prophylaxis **is** given per protocol | urgent (hard-coded, score 1) |
| crit-prof-ugb | Profilaxia de Úlcera Gástrica | stress-ulcer prophylaxis **is** prescribed | urgent |
| crit-prof-mobilizacao | Mobilização Precoce | mobilization **was** performed | urgent |

**crit-prof-cabeca — Cabeceira Elevada** (graded, graus):

| Range | Severity | Score | Label (verbatim) |
|---|---|---|---|
| [0, 20) | critical | 3 | "Cabeceira abaixo do recomendado" |
| [20, 30) | watch | 1 | "Cabeceira em ângulo subótimo" |
| [30, +inf) | normal | 0 | "Cabeceira em posição adequada" |

States: `initial` (Auditoria de Profilaxias) → `conformidade` → `alta` (terminal,
"Bundle Completo").

## 6. Timing / cadence

Declared `evaluation.mode: micro-batch` (`profilaxia.yaml:13`). OBSERVED: no
micro-batch scheduler exists anywhere in the codebase read this cycle; the mode is
dead metadata (`engine-review.md` §3). Effective cadence: the vitals-ingestion hook
(which can source none of these inputs) and manual PUT — i.e., in practice, never.

## 7. Missing-data behavior — and the inversion (HAZ-0005 lens)

- Absent input → criterion silently skipped → zero firings → `overall_severity
  "normal"` (`trilhas_evaluator.py:388-397`, `472-481`). A patient whose prophylaxis
  status was never recorded reads as normal.
- **Alerting-direction inversion (OBSERVED, decisive).** In the declarative engine a
  criterion produces a firing only when `met=True`
  (`trilhas_evaluator.py:399-401`), and a boolean is met when its input is truthy.
  The three compliance booleans are therefore met — and fire, at severity `urgent` —
  precisely when prophylaxis **was correctly given**, and produce **no firing at all**
  (indistinguishable from "not evaluated", both rendering `normal`) when prophylaxis
  is **missing** — the state the pathway exists to catch. The YAML's own description
  ("Todos os pacientes críticos devem receber profilaxia, salvo contraindicação
  documentada", `profilaxia.yaml:36`) makes the intended alarm direction unmistakable.
  The engine supports `negate: true` for booleans (`trilhas_compiler.py:403-416`) and
  the sepse v4 file uses it correctly for exactly this pattern
  (`pathways/sepse.yaml:298-300`, antibiotic NOT yet given); profilaxia does not.
- No-fire is unrecorded: a non-firing criterion leaves no trace (no reason, no event)
  — HAZ-0021 shape.
- Enrollment-severity side effect (OBSERVED, `pathway_enrollment._determine_severity`,
  lines 684-782): boolean criteria evaluated `true` classify as severity `urgent`, so
  a **fully compliant** bundle would raise the enrollment's severity to urgent, while
  a wholly undocumented bundle reads normal. Severity is inversely related to care
  quality in both directions.

## 8. alert_groups

Absent (schema forbids; `pathway-index.md` §3). No test vectors exist for this pathway.

## 9. Guideline anchoring

OBSERVED (`profilaxia.yaml:112-114`): `guideline: "SCCM/ACCM Guidelines; IHI
Ventilator Bundle; Surviving Sepsis Campaign; WHO Patient Safety Guidelines"`,
`doi: 10.1097/CCM.0b013e3182783b72`. Crossref (2026-08-15): the DOI resolves to
Barr J et al., "Clinical Practice Guidelines for the Management of Pain, Agitation,
and Delirium in Adult Patients in the Intensive Care Unit", Crit Care Med 2013 —
**MISMATCH**: a sedation/delirium guideline, not a prophylaxis authority. The four
named sources are institution/program names, not citable guideline editions —
effectively **UNCITED at the level of any specific threshold**.

INFERENCE — what the authoritative anchors WOULD be (proposal for V2 authorship, not
a claim about V1): VTE prophylaxis — ACCP Antithrombotic Therapy and Prevention of
Thrombosis, 9th ed (Chest 2012;141(2 Suppl)) and ASH 2018 VTE guidelines (Blood Adv
2018;2(22):3198-3225); stress-ulcer prophylaxis — SUP-ICU trial (Krag M et al., N Engl
J Med 2018;379:2199-2208) and BMJ Rapid Recommendation 2020 (BMJ 2020;368:l6722);
head-of-bed 30-45 degrees — VAP-prevention guidance (SHEA/IDSA Strategies to Prevent
VAP, Infect Control Hosp Epidemiol 2022;43(6):687-713). Implemented values: the
30-45 degree head-of-bed target agrees with VAP-prevention guidance; the boolean
criteria carry no thresholds to compare; the [20,30) "watch" band is an authoring
choice with no cited basis.

## 10. Verdict

**PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI): TRANSFORM.**
Rationale: a prophylaxis-bundle audit pathway is clinically valuable and V2-relevant,
but this implementation alerts on compliance and is silent on the harm state, has no
populated data source for any input, and cites no usable authority. Only the intent
survives; a V2 successor must alert on *absence* of indicated prophylaxis, encode
contraindication exceptions, and be anchored to the specific guidelines listed in §9
under a named clinical owner. Not DECIDED; import blocked until
`legacy-import-policy.md` §3 is satisfied.
