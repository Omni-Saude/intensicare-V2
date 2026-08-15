---
id: RULE-SOFA-MIG-0100
title: RULE-SOFA v0.1.0 — rule-local migration notes (what this spec supersedes and rejects from legacy)
label: PROPOSAL
status: PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI)
statement: >
  Rule-local summary of the disposition of every legacy SOFA artifact relative to
  RULE-SOFA v0.1.0, citing the forensic review records LEGREV-SOFA-0001 and
  LEGREV-QSOFA-0001. Nothing was imported; cut-points were re-derived from Vincent 1996;
  all legacy missing-input handling is rejected and encoded as regression vectors. The
  repository-wide migration manifest is a separate specialist's deliverable; this file
  is only the RULE-SOFA-local view.
provenance:
  source_repo: intensicare-V2
  path_or_url: docs/05-clinical-safety/rule-releases/sofa/migration-notes.md
  commit_sha_or_version: uncommitted (working tree on cycle-1/clinical-content)
  section_or_lines: whole document
  date_collected: 2026-08-15
  collector: SOFA-family V2 clinical-content specification author (cycle 1, Task 2); accountable reviewer rodaquino-OMNI
  transformation: >
    Dispositions summarized from LEGREV-SOFA-0001 §4-§9 and LEGREV-QSOFA-0001 §6-§8
    (legacy repo pinned at 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79; per-file SHA-256 in
    docs/archive/legacy-provenance/legacy-pin-cycle-1.md) and mapped to the sections of
    specification.md that supersede them.
  confidence: high (dispositions faithfully carried); low (clinical ratification — none exists)
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  requirements: [SAF-0001, SAF-0002, SAF-0030]
  hazards: [HAZ-0005, HAZ-0006, HAZ-0032, HAZ-0036]
  adrs: [ADR-0008 (pending)]
  tests: []
  pr: null
supersedes: null
superseded_by: null
---

# RULE-SOFA v0.1.0 — rule-local migration notes

Scope: the SOFA rule only. The full migration manifest is another specialist's file;
this is the rule-local summary required by the release-package precursor. Legacy is
cited exclusively through the hashed review records in
`docs/05-clinical-safety/legacy-review/sepsis-scores/` (legacy pin `1dc1ea6c…`).

## 1. Provenance rule applied

**Nothing in `specification.md` or `logic.yaml` was copied from legacy code.** Every
band value was re-derived from Vincent 1996 (verified per `specification.md` §2).
Where V2 numbers equal legacy numbers, that is because legacy happened to match the
primary source (LEGREV-SOFA-0001 verdicts "VALIDATE" on cut-point constants); the
provenance of the V2 value is the 1996 table, not the legacy constant. Legacy import
remains blocked regardless by `docs/00-governance/legacy-import-policy.md` §3
(no owner, license, or clinical review exists for any legacy artifact).

## 2. Disposition table — live V1 engine (`services/sofa.py`, reviewed in LEGREV-SOFA-0001)

| Legacy element (review finding) | Review verdict | RULE-SOFA 0.1.0 disposition |
|---|---|---|
| Cut-point constants and band structure (D-01, D-05, D-06 numeric, D-08, D-11, D-14, D-15) | VALIDATE | **Superseded by re-derivation** — same numbers, new provenance (spec §4, from Vincent 1996 directly). Never imported as code. |
| Ventilation gate + cap-at-2 interpretation (D-02) | VALIDATE (uncited convention) | **Superseded** by spec §4.1 I-1/I-2: support scope enumerated (invasive MV + NIV/CPAP; HFNC excluded by default) and cap-at-2 derived from the highest-satisfied-band reading; both flagged for ratification (OQ-1/OQ-2). |
| Absent SpO2/FiO2 surrogate (D-03) | (recorded) | **Deliberately preserved as absent** (spec §4.1); any surrogate needs its own citation and ratification. |
| Missing/invalid-input handling — all of §6's zero-coercion table | **REJECT** | **Rejected in full.** Replaced by the §5 status algebra (no zero-coercion, no partial totals). Every §6 row is encoded as a negative reference vector (CRV-0117..0123); the three failure algebras of D-04 (exception / coerced zero / dropped status) are replaced by the single five-state algebra. |
| Cardiovascular missing-MAP short-circuit (D-07) | **REJECT** | **Rejected and inverted**: vasopressor evidence dominates; MAP required only when no tabulated agent is active (spec §4.4). Regression vector CRV-0119. |
| Cardiovascular unknown-dose / unknown-agent default tiers (D-10) | **REJECT** | **Rejected**: missing dose → `not_evaluated(missing_dose)`; untabulated agent → `not_evaluated(vasoactive_agent_unmapped)` (spec §4.4 I-5, OQ-5). Vectors CRV-0121/0122. Combination therapy now representable (max-of-tiers, I-4) — the legacy single-string agent model could not represent norepinephrine + vasopressin at all. |
| Missing vasopressor duration condition (D-09) | DEV | **Fixed**: Vincent's ≥1 h condition operationalized (spec §4.4 I-3, OQ-3). |
| Bilirubin unit ambiguity, mg/dL-only thresholds with "mg/dL or µmol/L" docstring (D-06) | DEV (units) | **Superseded**: canonical mg/dL with exact ÷17.104 conversion before banding (spec §3.1 I-6); unmappable unit → `invalid`. Vectors CRV-0110/0130. |
| GCS no sedation handling (D-12), no range check (D-13) | DEV | **Superseded**: range 3–15 enforced (`invalid` outside); sedation-confounding default `not_evaluated`, subordinate to the pending sedation ADR (spec §4.5 I-8; REV-NS-01-gcs.md §4). Vectors CRV-0131/0133. |
| Renal one-input silent scoring (D-16); urine-output "24 h" label with no window assembly (D-15) | DEV/REJECT | **Superseded**: both sub-inputs required by default (OQ-7 offers the reviewer a declared partial policy instead); urine output is an explicit 24-h interval with end-lag freshness (spec §3.1 row 14, §4.6 I-7). Vectors CRV-0123/0134. |
| Partial totals typed identically to complete totals; persistence drops status (D-17) | **REJECT** | **Rejected**: total emitted only when all six components valid; otherwise status + reasons, numeric total never emitted (spec §5.2). The `missing_components` metadata concept (TRANSFORM verdict) survives as first-class per-component statuses. Vectors CRV-0117/0118. |
| Mortality-risk banding (D-18) | **REJECT** | **Rejected**: RULE-SOFA emits no banding; any future banding needs a named source and its own ratification (spec §0, OQ-13). |
| "CLINICALLY RATIFIED per RAT-*" claims (D-19) | **REJECT** | **Rejected**: void under evidence-notation §2 rule 3; RULE-SOFA carries PROPOSAL status until a named human authority decides. |
| Freshness — none anywhere in legacy (Q-10 analogue; HAZ-0006) | REJECT | **Superseded**: per-input windows and expiry horizons proposed (spec §3.2), discharging VAL-0023 for SOFA upon ratification. Vectors CRV-0124/0125. |

## 3. Disposition table — trilhas-era rule set (RULE-CLINICAL-SCORING-001…-012, reviewed as documented)

Review verdict: **REJECT (retain as failure catalog)**. RULE-SOFA retains it exactly
that way — as named regression vectors:

| Trilhas defect | Vector |
|---|---|
| Bilirubin dead gaps [1.9,2.0)/[5.9,6.0)/[11.9,12.0) → `None` → crash (rule 004) | CRV-0109 (continuous bands make the gap unrepresentable) |
| Creatinine exactly 5.0 matches no branch → 0 points (rule 007) | CRV-0115 |
| FiO2 percent/fraction incoherence → ~100× ratio error (rules 002/008) | CRV-0130 (unit discipline; no heuristic division) |
| Platelets 0 as no-data sentinel (rule 003); GCS 0/>15 → "no data" (rule 006) | CRV-0132, CRV-0131 (value-domain overload of "missing onto healthy" is unrepresentable) |
| No ventilation gate on resp 3–4 (rule 002) | CRV-0105/0106/0107 (gate explicit) |
| Noradrenaline dosed in ml volume (rule 005) | Spec §3.1 row 9 (UCUM µg/kg/min only; unmappable → `invalid`) |
| `None` sub-scores raise `TypeError` on sum (rule 001) | Spec §5.2 (a non-valid component makes the total un-emittable by construction, not by crash) |

## 4. qSOFA boundary (LEGREV-QSOFA-0001)

qSOFA is a **separate instrument** and is not part of RULE-SOFA. Recorded here only to
prevent scope creep: the SSC 2021 strong recommendation against single-tool qSOFA
screening (verified live, spec §2 source 3) and the rejected "Alta probabilidade de
sepse" framing must not be reintroduced through this rule's explanation surfaces; and
RULE-SOFA emits no sepsis determination (ΔSOFA needs a ratified baseline convention —
OQ-14, LEGREV-SOFA-0001 §7.3).

## 5. What deliberately does NOT migrate

1. Any executable code, model, or persistence shape (`clinical_score.score_value` bare
   non-null int — REJECT, the persistence half of HAZ-0005).
2. Any legacy test expectation: legacy tests **assert** zero-coercion as correct
   (LEGREV-SOFA-0001 §6) and are the anti-oracle; V2 vectors assert the opposite.
3. The labs-only partial SOFA idea (compatibility-era proposal): rejected per the
   partial-SOFA analysis (LEGREV-SOFA-0001 §7.3) — no partial totals under any source
   state; per-organ components only, and only under a future ratified policy.
4. Legacy mortality percentages quoted in docstrings (unattributed; resemble Ferreira
   2001 but uncited — LEGREV-SOFA-0001 §3 note).

*Rule-local summary only; the repository-wide migration manifest is owned elsewhere. No
PHI; all values are published thresholds or synthetic examples.*
