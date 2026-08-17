---
id: LEGREV-OSMS-AKI
title: Legacy review — renal/AKI domain (KDIGO staging evaluator, catalog, pathway, seed)
label: PROPOSAL
status: PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI)
statement: >
  Forensic review of the legacy V1 renal/AKI clinical content: domain_aki.py
  (KDIGO 2012 staging micro-batch evaluator), the runtime catalog aki.yaml,
  the pathway definition renal.yaml, the domain spec aki.md, and migration
  0015. Every verdict is a PROPOSAL under docs/00-governance/legacy-import-policy.md;
  nothing is imported.
provenance:
  source_repo: intensicare (legacy V1, READ-ONLY)
  path_or_url: https://github.com/Omni-Saude/intensicare
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
  hazards: [HAZ-0005, HAZ-0006, HAZ-0019, HAZ-0021, HAZ-0022]
  adrs: []
  pr: null
supersedes: null
superseded_by: null
---

# Legacy review — renal/AKI domain

> **PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).**
> Default is do-not-copy (`legacy-import-policy.md` §1). Guideline comparisons
> below rely on this reviewer's trained knowledge of KDIGO 2012 and were NOT
> re-fetched from the publisher — every guideline statement is **VALIDATION
> REQUIRED** for re-verification against the primary source.

## 0. Artifacts and integrity (OBSERVED 2026-08-15)

SHA-256 recomputed from the working tree at pinned HEAD; all match
`00-inventory/inventory.md` (values marked `(rt)` there were hashed at read
time, outside the pin manifest — that marking is preserved here).

| Artifact | SHA-256 |
|---|---|
| `src/intensicare/services/domain_aki.py` | `82284ef37a681baca80daab55d00f65f8ba5b1a8e58edb2423954503bfb66e09` |
| `docs/plan/_work/alerts/aki.yaml` | `409f363d356311514b605df0876ffb0a1e9ec1f2d15017e7b42342778453e42c` (rt) |
| `_work/alerts/pathways/renal.yaml` | `a052e6c26835e3c7c8ade5e62ed7272b779edf95cfd47c6a3105fc3d90db4153` |
| `docs/plan/clinical/domains/aki.md` | `89e6f17cd3a7e8da89b3645159fd9f7a26eb1da21ef7f1d78afa1b5612e809cd` (rt) |
| `alembic/versions/0015_seed_aki_definitions.py` | `e85170497ec0a5bca36cf618494063bc87b2388664515d3e88527f2bd0c331d6` (rt) |

## 1. Implemented logic, verbatim thresholds

### 1.1 Creatinine axis (`domain_aki.py:79-98`)

```text
stage 3: creatinina >= 3.0*creatinina_basal
         OR (creatinina >= 4.0 AND delta_cr_48h >= 0.5)
         OR terapia_renal_substitutiva
stage 2: creatinina >= 2.0*creatinina_basal
stage 1: delta_cr_48h >= 0.3 OR creatinina >= 1.5*creatinina_basal
```

All of the above sits inside `if creatinina is not None and creatinina_basal
is not None:` (line 82).

### 1.2 Urine-output axis (`domain_aki.py:100-125`)

Two consecutive blocks assign `stage_uo`. The first (lines 103-116:
`<0.3 → 3; elif <0.5 → 2; elif <0.5 → 1`) is **entirely overwritten** by the
second (lines 121-125):

```python
if debito_urinario_horario is not None:
    if debito_urinario_horario < 0.3:
        stage_uo = 3
    elif debito_urinario_horario < 0.5:
        stage_uo = 1  # conservative: stage 1 for UO < 0.5
```

Final stage = `max(stage_cr, stage_uo)`; stage 1 → watch, 2 → urgent,
3 → critical (`domain_aki.py:56-64`).

### 1.3 Progression and nephrotoxin alerts

- `evaluate_progression` (`domain_aki.py:171-204`): fires when
  `kdigo_stage_now > kdigo_stage_24h_ago` (both non-null); urgent, critical
  when new stage == 3. Null-prior guard present.
- `evaluate_nephrotoxin` (`domain_aki.py:237-280`): `rising_cr = creatinina -
  creatinina_basal > 0.2` (strict) AND one of four combinations
  (vanco+aminoglycoside, vanco+iodinated contrast, aminoglycoside+NSAID,
  ACEi/ARB+hypovolemia); severity watch.

### 1.4 Stale-data auto-resolution (`domain_aki.py:313-331`)

```python
if alert_result.severity == SeverityLevel.CRITICAL:
    return False  # NEVER auto-resolve CRIT
return is_stale
```

Watch/urgent alerts auto-resolve **because** the data is stale.

## 2. Published-definition comparison (KDIGO 2012, VALIDATION REQUIRED)

Reference: KDIGO Clinical Practice Guideline for Acute Kidney Injury, Kidney
Int Suppl 2012;2(1):1-138, staging §2.1 (also cited by the legacy code and
catalog; not re-fetched).

| Axis | KDIGO 2012 | Legacy code | Verdict on fidelity |
|---|---|---|---|
| Stage 1 Cr | rise ≥0.3 mg/dL in 48 h OR 1.5-1.9× baseline within 7 d | matches (inclusive ≥1.5×); 7-day window delegated to input construction | faithful |
| Stage 2 Cr | 2.0-2.9× baseline | matches | faithful |
| Stage 3 Cr | ≥3.0× baseline OR Cr ≥4.0 mg/dL OR RRT | code additionally requires `delta_cr_48h >= 0.5` for the Cr ≥4.0 arm (AKIN-era condition). Stricter than KDIGO → possible under-staging of a slowly rising Cr ≥4.0 | DISCREPANCY (conservative direction, still a deviation) |
| Stage 1 UO | <0.5 mL/kg/h for 6-12 h | 0.3≤UO<0.5 → stage 1 | window ignored |
| Stage 2 UO | <0.5 mL/kg/h for ≥12 h | **unreachable** — overwritten block demotes all 0.3-0.5 values to stage 1 | **DISCREPANCY — under-staging** |
| Stage 3 UO | <0.3 mL/kg/h for ≥24 h OR anuria ≥12 h | <0.3 → stage 3, no window; anuria criterion absent | partial |
| RRT | stage 3 regardless of Cr values | RRT check nested inside the Cr-presence guard: a patient on RRT with either creatinine value missing is staged **0** | **DEFECT** |

The runtime catalog `aki.yaml:18-20` specifies the KDIGO-correct three-band
UO logic (24h <0.3 OR anuria(12h) → 3; 12h <0.5 → 2; 6h <0.5 → 1); the code
does not implement it. **Code and its own catalog disagree**: a patient with
UO 0.4 mL/kg/h sustained ≥12 h is urgent per catalog, watch per code.

The pathway `renal.yaml:31-107` is a third, divergent surface:
- `crit-renal-creatinina` bands **absolute** creatinine (1.2/2.0/4.0 mg/dL)
  and labels the bands "KDIGO 2"/"KDIGO 3" — KDIGO stages are defined
  relative to baseline, not absolute. A CKD patient with stable Cr 2.5 would
  be labeled "AKI moderada — KDIGO 2"; a patient with baseline 0.5 now 1.5
  (true 3.0×, stage 3) falls in the "watch" band. **Mislabeled staging.**
- `crit-renal-debito` labels [0, 0.3) "Anúria — emergência nefrológica";
  0.25 mL/kg/h is severe oliguria, not anuria. Label misstatement.
- `crit-renal-debito` band [0.5, 1.0) → watch has no KDIGO basis (UNCITED).

Migration 0015 seeds three `alert_definition_version` rows whose descriptions
match the catalog, with `spec_hash` values `a1b2c3d4e5f6a7b8`,
`b2c3d4e5f6a7b8c9`, `c3d4e5f6a7b8c9d0` — **sequential placeholder strings,
not real content hashes** (same values re-declared in
`AKI_ALERT_DEFINITIONS`, `domain_aki.py:339-376`). The integrity field
carries no integrity (HAZ-0019 lineage).

Citation audit: "KDIGO Drug-Induced AKI 2023" (code line 373, catalog line
165) — this reviewer knows of no standalone KDIGO guideline by that title;
**UNVERIFIED CITATION — do not carry forward without locating the primary
source**. The Rybak 2020 vancomycin citation (catalog line 165) is plausible
(Am J Health-Syst Pharm 2020;77:835-864) but not re-fetched. The `+0.2 mg/dL
rising-Cr` gate is UNCITED to any primary authority.

## 3. HAZ-0005 zero-coercion assessment

| Path | Behavior on absent input | Assessment |
|---|---|---|
| `compute_kdigo_stage` Cr axis | both Cr values required, else `stage_cr = 0` | Missing labs → stage 0 → `fired=False`; a never-measured patient is indistinguishable from an assessed-normal patient. No evaluation-status output. **HAZ-0005 pattern present** (no-fire opacity, HAZ-0021) |
| RRT flag | ignored when Cr values missing | **Active RRT coerced to stage 0** — a true false-normal, the strongest HAZ-0005 instance in this module |
| UO axis | `None` → `stage_uo = 0` | absent-UO-as-normal; same pattern |
| `evaluate_progression` | null prior stage → no fire (documented boundary) | acceptable design, but still no not-evaluated record |
| `evaluate_nephrotoxin` | drug flags default `False` | unrecorded medication = no risk; silent |
| `should_auto_resolve` | stale data → watch/urgent auto-resolve | inverse coercion: staleness treated as recovery (HAZ-0006 + HAZ-0022) |

No numeric score is coerced to a reassuring value, but stage 0 metadata is
emitted with no "not evaluated" discriminator, and the stale-auto-resolve
rule silently retires live alerts.

## 4. Verdicts (all PROPOSAL)

| Artifact / path | Verdict | Rationale (one line) |
|---|---|---|
| Cr-axis staging (`domain_aki.py:79-98`) | VALIDATE | KDIGO-faithful except stage-3 Cr≥4.0 delta gate; needs named nephrology confirmation of the delta condition |
| UO-axis staging (`domain_aki.py:100-127`) | REJECT as implemented | stage 2 unreachable (dead overwritten block); windows and anuria absent; under-stages oliguric AKI |
| RRT handling (`domain_aki.py:82-88`) | REJECT | RRT must confer stage 3 independent of Cr availability |
| `evaluate_progression` | VALIDATE | sound deterioration signal; dedup design in catalog is reasonable |
| `evaluate_nephrotoxin` | VALIDATE | plausible combination list; +0.2 threshold UNCITED; citation "KDIGO Drug-Induced AKI 2023" unverified |
| `should_auto_resolve` | REJECT | staleness must never auto-resolve an alert (HAZ-0006/0022); require explicit staleness annotation |
| `aki.yaml` catalog | VALIDATE | the strongest artifact: KDIGO-correct logic, real citation, 17 boundary-tested vectors; must become the single source and the code corrected to it |
| `renal.yaml` pathway bands | REJECT (bands) / TRANSFORM (pathway concept) | absolute-Cr bands mislabeled as KDIGO stages; "Anúria" label wrong; parallel divergent surface |
| `domains/aki.md` spec | VALIDATE | baseline-resolver hierarchy, rolling-window design and unit hazards are well-reasoned; carries the design intent V2 should inherit |
| migration 0015 | REJECT (spec_hash) / VALIDATE (descriptions) | placeholder hashes void the integrity contract; description text matches catalog |

**Worst finding:** the UO stage-2 band is unreachable in the shipping
evaluator, so KDIGO stage-2-by-oliguria patients are staged 1 (watch instead
of urgent) — an under-alerting divergence between code, its own catalog, and
KDIGO 2012, compounded by the RRT-under-Cr-guard defect that can stage a
dialysed patient 0.
