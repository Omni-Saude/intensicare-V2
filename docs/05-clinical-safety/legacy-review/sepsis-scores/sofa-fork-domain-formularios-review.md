---
id: LEGREV-SOFA-0002
title: Legacy review supplement — independent SOFA reimplementation in domain_formularios.py (_calculate_sofa fork)
label: PROPOSAL
status: PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI)
statement: >
  Supplementary forensic review of the second, independent SOFA implementation found at
  legacy services/domain_formularios.py (_calculate_sofa), diffed component-by-component
  against both the canonical services/sofa.py engine and Vincent 1996, with HAZ-0005
  zero-coercion tracing and an import verdict. Supplements LEGREV-SOFA-0001
  (sofa-review.md); authoritative citations are reused from that record, not re-derived.
provenance:
  source_repo: intensicare (legacy V1, READ-ONLY)
  path_or_url: src/intensicare/services/domain_formularios.py
  commit_sha_or_version: 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79 (HEAD at pin; SHA-256 in §1)
  section_or_lines: lines 512-670 primarily; see per-citation references
  date_collected: 2026-08-15
  collector: legacy sepsis-score forensics reviewer (cycle 1, Task 1 supplement); accountable reviewer rodaquino-OMNI
  transformation: verbatim excerpts plus reviewer analysis; analysis labeled INFERENCE/PROPOSAL
  confidence: high (source verification); low (clinical dispositions — unratified)
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  requirements: [SAF-0001, SAF-0002, SAF-0020]
  hazards: [HAZ-0005, HAZ-0019, HAZ-0032]
  adrs: []
  tests: []
  pr: null
supersedes: null
superseded_by: null
---

# SOFA fork in `domain_formularios.py` — supplementary review

**PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).** Supplements
`sofa-review.md` (LEGREV-SOFA-0001), which covers the canonical engine. This record
covers only the fork; the neighbouring form scorers in the same file (RASS, CAM-ICU,
Glasgow, BPS/NRS) belong to other workstreams and are not reviewed here.

## 1. Source verified, with hash

| Artifact | SHA-256 | Manifest |
|---|---|---|
| `src/intensicare/services/domain_formularios.py` | `61db0316a942ce3c1310be15ff0411b3f5bbbd58754aa4f58b2912f0230499d3` | **match** (`docs/archive/legacy-provenance/legacy-pin-cycle-1.md` line 1323) |

Repo pinned at git HEAD `1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79`; hash re-computed
2026-08-15.

OBSERVED — this is a genuine fork, not a delegation: `_calculate_sofa`
(`domain_formularios.py:512-658`) recomputes every organ band inline and never imports
`intensicare.services.sofa`. It is wired into the clinical-forms surface at
`domain_formularios.py:477-479` (`score = _calculate_sofa(data); severity =
_sofa_severity(score); return score, severity`) and carries its own version identity:
`VALID_DEFINITION_VERSIONS["sofa"] = frozenset({"sofa-v1.0", "1.0.0"})`
(`domain_formularios.py:212`) — while the canonical engine declares
`SOFA_VERSION = "SOFA-v2.0.0"` (`sofa.py:20`).

## 2. Logic as implemented (verbatim excerpts)

Missing-component pattern — each organ block is simply skipped when its input is `None`
(respiration shown; identical shape for all six):

```python
    total = 0
    # --- Respiratory (PaO2/FiO2) ---
    pao2_fio2 = _num(resp.get("pao2_fio2"))
    vent = bool(resp.get("ventilacao_mecanica", False))
    if pao2_fio2 is not None:
        if pao2_fio2 >= 400: pass  # 0
        elif pao2_fio2 >= 300: total += 1
        elif pao2_fio2 >= 200: total += 2
        elif vent: total += 3 if pao2_fio2 >= 100 else 4
        else: total += 2  # Cap at 2 without ventilation
```
(`domain_formularios.py:528-545`)

Cardiovascular — `domain_formularios.py:585-609`:

```python
    if pam is not None:
        if not vasopressor or str(vasopressor).lower() in ("", "none"):
            if pam < 70: total += 1
        else:
            vtype = str(vasopressor).lower().strip()
            dose = dose_vaso if dose_vaso is not None else 0
            if vtype == "dopamina":
                if dose <= 5: total += 2
                elif dose <= 15: total += 3
                else: total += 4
            elif vtype in ("epinefrina", "norepinefrina", "noradrenalina"):
                if dose <= 0.1: total += 3
                else: total += 4
            elif vtype in ("dobutamina",): total += 2
            else: total += 2  # Unknown vasopressor
```

Renal — `domain_formularios.py:633-656`: creatinine bands <1.2/<2.0/<3.5/<5.0/≥5.0;
urine output <200→4, <500→3; `total += max(cr_score, uo_score)`; a missing half simply
leaves its sub-score at 0. Neuro — `domain_formularios.py:615-626`: `gcs_i = int(gcs)`
then 15/13-14/10-12/6-9/<6. Return — `domain_formularios.py:658`: `return float(total)`.
Severity — `domain_formularios.py:661-670`: `<=6 baixo_risco, <=9 risco_moderado,
<=12 risco_alto, else risco_muito_alto`. Helper `_num`
(`domain_formularios.py:842-851`): `None → None`, `bool → 1.0/0.0`, unparseable → `None`.

## 3. Component-by-component diff — fork vs canonical `services/sofa.py` vs Vincent 1996

Authorities as cited and verified in `sofa-review.md` §3 (Vincent 1996; Singer 2016);
no new research performed. Canonical findings referenced by their D-numbers.

| Component | Fork cut-points | vs canonical | vs Vincent 1996 |
|---|---|---|---|
| Respiration | 400/300/200/100; scores 3-4 gated on `ventilacao_mecanica`; unventilated <200 capped at 2 (`:536-545`) | Cut-points and gate identical. **Fork lacks the FiO2-percent guard** (`sofa.py:174-182` raises on P/F <20; fork scores P/F 2.0 as 4-if-ventilated/2-if-not) and lacks the `invalid_type` check — a bool arrives via `_num` as 1.0/0.0 and is *scored* (True → P/F 1.0 → 4 points ventilated) where canonical returns a flagged 0 (`sofa.py:171-172`) | MATCH on numbers; same D-02 interpretation (single MV boolean; cap-at-2 uncited) |
| Coagulation | ≥150/≥100/≥50/≥20 ×10³/µL (`:551-561`) | Identical | MATCH |
| Liver | <1.2/<2.0/<6.0/<12.0 mg/dL (`:567-577`) | Identical bands. Fork docstring names the unit only via the comment "Bilirubin mg/dL" — it avoids canonical's "mg/dL or µmol/L" docstring error (D-06) but has the same absent unit enforcement | MATCH (mg/dL) |
| Cardiovascular | MAP <70→1; dopamine ≤5→2, ≤15→3, >15→4; epi/norepi ≤0.1→3, >0.1→4; dobutamine→2; unknown→2 (`:585-609`) | Tier values identical, **but**: (a) same missing-MAP short-circuit as D-07 — the entire block is inside `if pam is not None:`, so a vasopressor-dependent patient with no MAP recorded scores CV 0, now with *no missing flag either*; (b) **agent vocabulary is Portuguese-only** ("dopamina", "epinefrina", "norepinefrina", "noradrenalina", "dobutamina") where canonical matches English-only ("dopamine", "epinephrine", "norepinephrine", "noradrenaline") — an English `"dopamine"` at any dose falls to the fork's unknown branch and scores 2 (a >15 µg/kg/min patient undercounted by 2 points), and vice-versa across the boundary; (c) missing dose defaults to `0` → dopamine 2 / adrenergic 3 — numerically the same guess as canonical D-10 but produced by a falsified dose value rather than an explicit default | Tier values MATCH; same D-09 (no ≥1 h duration), D-10 (unknown-agent guessing, no combination therapy) gaps |
| Neurological | 15/13-14/10-12/6-9/<6 (`:615-626`) | Identical bands; fork adds `int(gcs)` truncation (GCS 14.9 → 14 → 1 point) and, like canonical (D-13), no 3-15 range validation | MATCH |
| Renal | <1.2/<2.0/<3.5/<5.0; UO <500→3, <200→4; `max()` (`:633-656`) | Identical, including the D-16 silent-partial behavior (one missing half contributes 0 unflagged) — with the aggravation that the fork does not even flag the both-missing case | MATCH on numbers; same D-15 gap (24 h urine window is a label, not a measurement) |
| Total + severity | `float(total)`; bands ≤6/≤9/≤12/else with pt-BR labels (`:658, 661-670`) | Same uncited banding as D-18, independently reimplemented; return type diverges (float vs int + structured `SOFAResult`) | Banding not part of Vincent 1996; uncited (D-18 applies) |

**Summary: the fork's numeric cut-points are identical to the canonical engine on all
six components (and match Vincent 1996 wherever the canonical does).** Every divergence
is in the safety envelope: missing-data metadata deleted, input-validation guards
deleted, vasopressor vocabulary forked by language, result type stripped to a bare
float, and a second version identity ("sofa-v1.0") attached to logic equivalent to
"SOFA-v2.0.0". INFERENCE: this is drift-by-duplication — the exact mechanism
RULE-CLINICAL-SCORING-001's single-source principle and the G1-G3 screening history
(`sepse-pathway-clinical-review.md` §3.3) show ends in silent contradiction. Two
"SOFA" numbers computed for the same patient by the two engines can already differ
today whenever an English agent name, a bool-typed input, or a sub-20 P/F reaches them.

## 4. Missing-data / zero-coercion behavior (HAZ-0005) — traced

| Input state | Fork behavior | Decisive lines |
|---|---|---|
| Any single component absent | organ block skipped; contributes 0 to `total`; **no missing list, no status, no flag of any kind** | `domain_formularios.py:535, 551, 567, 585, 615, 636, 648` |
| All inputs absent (`data={}`) | returns `0.0`; consumer attaches severity `"baixo_risco"` and returns both to the forms surface | `domain_formularios.py:528, 658, 661-665, 477-479` |
| MAP absent, vasopressor present | entire CV block skipped → 0, unflagged | `domain_formularios.py:585` |
| Vasopressor dose absent | coerced to `0` → scored as low-dose tier (2 or 3) | `domain_formularios.py:592` |
| Bool-typed numeric input | `_num` converts to 1.0/0.0 and it is **scored** (no `invalid_type` path) | `domain_formularios.py:842-847` |
| Renal half absent | absent half scores 0 inside a "present" component, unflagged | `domain_formularios.py:633-656` |

**HAZ-0005 verdict: confirmed and strictly worse than the canonical engine.** The
canonical scorer at least returns `(0, "missing")` per component and populates
`missing_components` (`sofa-review.md` §6); the fork deletes even that advisory
metadata and pairs the coerced `0.0` with an explicit reassuring label
(`"baixo_risco"`). A never-assessed patient and a fully-assessed healthy patient are
byte-identical at this interface. This is the purest expression of the HAZ-0005
mechanism found in the legacy codebase.

## 5. Clinical verdict — PROPOSAL, per legacy-import-policy §4

| Artifact | Verdict | Rationale |
|---|---|---|
| `_calculate_sofa` fork + `_sofa_severity` (`domain_formularios.py:512-670`) | **REJECT** | (1) Duplicate clinical logic violating single-source rule consistency — one instrument, two engines, two version identities (`"sofa-v1.0"` at `:212` vs `"SOFA-v2.0.0"` at `sofa.py:20`), guaranteed drift (HAZ-0019/SAF-0020 territory); (2) HAZ-0005 in aggravated form (§4) — zero-coercion with zero metadata plus a reassuring severity label; (3) safety guards present in the canonical engine are absent here; (4) the language-forked vasopressor vocabulary silently mis-tiers across the naming boundary. Nothing in the fork adds clinical content absent from the canonical engine, so nothing survives it: cut-point reference values are already covered by `sofa-review.md` §8 (VALIDATE, re-derived from Vincent 1996). V2 rule: **exactly one implementation per instrument, version-governed**; a clinical-forms surface consumes the pathway engine's evaluated result (with status), never recomputes it. |

Carry into V2 as tests only: the fork's failure modes (all-absent → `0.0`/"baixo_risco";
English-vs-Portuguese agent name; bool input scored; missing dose coerced to 0) as
SAF-0002 absent-input probe and HAZ-0032 unit/vocabulary regression vectors, and the
two-engines-two-versions condition itself as a named negative test for V2's rule-bundle
governance (no duplicate scorer may register for the same instrument).

*Reviewed by rodaquino-OMNI (accountable reviewer of record, GDEC-0003). No PHI; all
values are published thresholds or synthetic examples.*
