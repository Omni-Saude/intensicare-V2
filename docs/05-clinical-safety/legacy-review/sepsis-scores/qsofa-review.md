---
id: LEGREV-QSOFA-0001
title: Legacy review — qSOFA scoring clinical content (V1 services/qsofa.py and consumers)
label: PROPOSAL
status: PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI)
statement: >
  Intensivist-rigor forensic review of the legacy V1 qSOFA implementation against Sepsis-3
  (Singer 2016) and the Surviving Sepsis Campaign 2021 guideline, including exact cut-point
  verification, HAZ-0005 zero-coercion tracing, the mandatory post-2021 SSC standing
  analysis, and import verdicts. Everything herein is PROPOSAL; no clinical authority has
  ratified any statement.
provenance:
  source_repo: intensicare (legacy V1, READ-ONLY)
  path_or_url: src/intensicare/services/qsofa.py and consumers (see per-citation table §1)
  commit_sha_or_version: 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79 (HEAD at pin; per-file SHA-256 in §1)
  section_or_lines: per-citation line references throughout
  date_collected: 2026-08-15
  collector: legacy sepsis-score forensics reviewer (cycle 1, Task 1); accountable reviewer rodaquino-OMNI
  transformation: verbatim excerpts plus reviewer analysis; analysis labeled INFERENCE/PROPOSAL
  confidence: high (source verification); low (clinical dispositions — unratified)
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  requirements: [SAF-0001, SAF-0002, SAF-0035]
  hazards: [HAZ-0005, HAZ-0006, HAZ-0036, HAZ-0043]
  adrs: []
  tests: []
  pr: null
supersedes: null
superseded_by: null
---

# qSOFA — legacy clinical-content review

**PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).**

## 1. Sources verified, with hashes

Paths relative to `/Users/familia/intensicare` (READ-ONLY), pinned at git HEAD
`1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79`; hashes re-computed 2026-08-15 against
`docs/archive/legacy-provenance/legacy-pin-cycle-1.md`.

| Artifact | SHA-256 | Manifest |
|---|---|---|
| `src/intensicare/services/qsofa.py` | `48b69f39f7b789c5f12f005931c9d02cc9b8da562c9aecee804d594530bab8ce` | match |
| `src/intensicare/services/domain_sepsis.py` (qSOFA consumer) | `853d2e38a8167d28e7eb242872e871024abe00b4868fc22f7c02502f99d3ccf8` | match |
| `src/intensicare/services/sepsis_input_provider.py` | `650bdd8c512fd08e673cde124269dd5c05a214ac07510011d53954cdd738b1cb` | match |
| `_work/alerts/sepse.yaml` (root — standalone qSOFA alert) | `1af8062d535ff0a9efa12a1606c7b37b975bd0635a8800f155491e958ced5dfa` | match |
| `_work/alerts/pathways/sepse.yaml` (v4 pathway — qSOFA criteria) | `b84c9693295f5d820cb2796b6a789f10cfb9200409741af4e0ba78b7ad4ec7f0` | match |
| `tests/test_qsofa.py` | `ed463f369f95d1a2ecd1766b5f095b149f78815a35b0927cdb43d590b3465e13` | **not in manifest — hashed at review time (hash-and-note)** |

No dedicated qSOFA rule doc exists in `docs/rules/` (grep for "qsofa" hits only sepse/
sedacao/estabilidade cluster records, reviewed in `sepse-pathway-clinical-review.md`).

## 2. Formula as implemented (verbatim, `services/qsofa.py`)

Constants — `qsofa.py:25-28`:

```python
QSOFA_HIGH_RISK_MIN = 2  # total >= 2 (of 3) -> high risk for sepsis
QSOFA_RR_TACHYPNEA_MIN = 22  # respiratory rate >= 22/min -> 1 point
QSOFA_SBP_HYPOTENSION_MAX = 100  # systolic BP <= 100 mmHg -> 1 point
QSOFA_GCS_NORMAL = 15  # GCS < 15 (altered mentation) -> 1 point
```

Criterion functions — `qsofa.py:79-81, 96-98, 113-115`:

```python
    if rr is None:
        return 0, "missing"
    return (1, None) if rr >= QSOFA_RR_TACHYPNEA_MIN else (0, None)
...
    if sbp is None:
        return 0, "missing"
    return (1, None) if sbp <= QSOFA_SBP_HYPOTENSION_MAX else (0, None)
...
    if gcs is None:
        return 0, "missing"
    return (1, None) if gcs < QSOFA_GCS_NORMAL else (0, None)
```

Aggregation — `qsofa.py:138-164`: three independent criterion scores summed
(`total = rr_score + sbp_score + gcs_score`, `qsofa.py:158`), `missing_criteria` list
collected per criterion (`qsofa.py:141-150`). Threshold — `qsofa.py:50-59`:
`is_high_risk = total_score >= 2`; `risk_level` is the binary `"high_risk"` /
`"low_risk"`.

**Combination logic, stated precisely:** each of the three criteria is an independent
binary point (no AND/OR structure between the cut-points); the positive-screen condition
is `sum >= 2`, i.e. 2-of-3. This matches the published instrument's structure.

## 3. Authoritative definition

- **Singer M, Deutschman CS, Seymour CW, et al.** The Third International Consensus
  Definitions for Sepsis and Septic Shock (Sepsis-3). *JAMA*. 2016;315(8):801-810.
  doi:10.1001/jama.2016.0287, <https://pmc.ncbi.nlm.nih.gov/articles/PMC4968574/> —
  qSOFA criteria verbatim: "respiratory rate of 22/min or greater, altered mentation, or
  systolic blood pressure of 100 mm Hg or less"; positive at ≥2 of 3; intended for
  "out-of-hospital, emergency department, or general hospital ward settings" to identify
  adult patients **with suspected infection** likely to have poor outcomes. On mentation:
  the task force derivation used "Glasgow Coma Scale score of 13 or less" but chose to
  "emphasize altered mentation because it represents any Glasgow Coma Scale score less
  than 15".
- **Evans L, Rhodes A, Alhazzani W, et al.** Surviving Sepsis Campaign 2021. *Crit Care
  Med* 2021;49(11):e1063-e1143 / *Intensive Care Med* 2021;47:1181-1247.
  doi:10.1007/s00134-021-06506-y — screening recommendation quoted in §6.

## 4. Discrepancy table — `services/qsofa.py` vs Sepsis-3

| # | Item | Finding | Verdict | Evidence |
|---|---|---|---|---|
| Q-01 | RR cut-point | `>= 22` /min | MATCH ("22/min or greater") | `qsofa.py:26,81` |
| Q-02 | SBP cut-point | `<= 100` mmHg | MATCH ("100 mm Hg or less") | `qsofa.py:27,98` |
| Q-03 | Mentation cut-point | `GCS < 15` | MATCH (Sepsis-3's stated operationalization "any Glasgow Coma Scale score less than 15"; note the derivation cohort used GCS ≤13 — V2 must pick one and cite it) | `qsofa.py:28,115` |
| Q-04 | Threshold | `>= 2` of 3 | MATCH | `qsofa.py:25,52` |
| Q-05 | Suspected-infection condition | **Absent from the scorer.** `calculate_qsofa` evaluates any patient; the infection gate exists only in one consumer (`domain_sepsis._eval_screen_01`) | **DEV (definitional)** — qSOFA's published meaning is conditional on suspected infection; an ungated qSOFA number on an undifferentiated ICU population is a different, unevidenced use (candidate-inventory CAND-0004; PH-04 → HAZ-0036). | `qsofa.py:123-164`; `domain_sepsis.py:276-278` |
| Q-06 | Setting | Module docstring markets qSOFA without setting restriction; Sepsis-3 scopes it to non-ICU settings (in ICU, full SOFA is the recommended instrument). The root alert file gates one alert on `icu_setting == false` (`_work/alerts/sepse.yaml:23-36`) — the *only* place the setting condition survives — but no code computes `icu_setting` (grep of `src/` finds no producer), so the gate is structurally unevaluable. | **DEV** | `qsofa.py:1-10`; `_work/alerts/sepse.yaml:30-32` |
| Q-07 | Purpose framing | Docstring: "Identifies patients at high risk for sepsis"; result property `sepsis` framing (`is_high_risk`), pathway band label "Alta probabilidade de sepse" (v4 `crit-sep-qsofa`) | **DEV (mischaracterization)** — Sepsis-3 frames qSOFA as a predictor of *poor outcome* (mortality, prolonged ICU stay) in suspected infection, explicitly **not** a diagnostic or probability-of-sepsis statement, and the v4 band label "Disfunção orgânica" for qSOFA=2 conflates qSOFA with the SOFA-based organ-dysfunction criterion. | `qsofa.py:4,9-10,50-52`; `_work/alerts/pathways/sepse.yaml:97-104` |
| Q-08 | Input validation | No range checks: RR of 0 scores 0 (bradypnea/apnea contributes nothing — faithful to the instrument but worth stating), GCS values outside 3-15 accepted, negative values accepted | **DEV (minor)** | `qsofa.py:79-115`; `tests/test_qsofa.py:39` |
| Q-09 | Pre-computed override in consumer | `domain_sepsis._compute_qsofa_points`: if a `qsofa` input key is present it is trusted verbatim — `_num` converts `True → 1.0`, floats are truncated by `int()`, and no 0-3 range check exists (a payload `qsofa: 7` is accepted) | **DEV (consumer)** — the canonical scorer can be bypassed by an unvalidated upstream value. | `domain_sepsis.py:247-250, 163-172` |
| Q-10 | Freshness | `sepsis_input_provider` feeds qSOFA from the **latest persisted VitalSign with no age bound** (`_fetch_latest_vital` orders by `recorded_at desc`, no window) | **DEV (HAZ-0006)** — an arbitrarily stale RR/SBP/GCS triple scores as current. VAL-0023 unresolved. | `sepsis_input_provider.py:126-134, 374` |

**Discrepancy count: 6 DEV (Q-05, Q-06, Q-07, Q-08, Q-09, Q-10); 4 MATCH (Q-01..Q-04).**
The three cut-points and the 2-of-3 threshold are exactly Sepsis-3; every deviation is in
*conditions of use*, not arithmetic.

Three worst: **Q-05** (infection condition absent from the instrument itself), **Q-09**
(unvalidated pre-computed score bypasses the scorer), **Q-10** (unbounded input staleness).

## 5. HAZ-0005 zero-coercion — traced per criterion

| Criterion | Missing input | Behavior | Decisive lines |
|---|---|---|---|
| Respiratory rate | `rr=None` | `(0, "missing")` — contributes 0 to the sum | `qsofa.py:79-80` |
| Systolic BP | `sbp=None` | `(0, "missing")` | `qsofa.py:96-97` |
| Mentation | `gcs=None` | `(0, "missing")` | `qsofa.py:113-114` |
| Total | all `None` | `total_score=0`, `is_high_risk=False`, `missing_criteria=['respiratory_rate','systolic_bp','gcs']` — a never-assessed patient is typed identically to a screened-negative patient | `qsofa.py:138-164` |

Consequences downstream, verified:

- `domain_sepsis._compute_qsofa_points` returns the coerced 0-2 partial sum as a plain
  int; `_eval_screen_01` then reports "qSOFA=0 < 2" as a *reason string*, not a status
  (`domain_sepsis.py:280-288`).
- `sepsis_input_provider._build_sirs_qsofa_inputs` makes the coercion **unconditional at
  the pathway boundary**: while every other input key is deliberately *omitted when
  unknown* ("never guessed, never defaulted", `sepsis_input_provider.py:16-25`), the two
  keys `sirs_count`/`qsofa_score` "are always present" even with zero underlying
  measurements — the module docstring itself names this "inherited canonical behavior, not
  invented here" (`sepsis_input_provider.py:21-25, 197-231, 360-361`). A patient with no
  vitals at all therefore enters the declarative pathway with `qsofa_score: 0`.
- Intent evidence: `tests/test_qsofa.py:31,55,79` assert `(None, (0, "missing"))` per
  criterion — designed and test-enforced.

**HAZ-0005 verdict: confirmed for all three criteria and for the total; aggravated at the
provider boundary, where the one component with a safe-omission contract carves out an
explicit exception for exactly these two scores.** For a 2-of-3 instrument the clinical
direction is one-way: missingness can only ever *suppress* a positive screen (false
reassurance), never create one.

## 6. qSOFA POST-2021 STANDING — mandatory section

SOURCE — Surviving Sepsis Campaign 2021 (Evans L, et al., *Crit Care Med*
2021;49(11):e1063-e1143 / *Intensive Care Med* 2021;47:1181-1247,
doi:10.1007/s00134-021-06506-y), screening recommendations:

> "We recommend **against** using qSOFA compared with SIRS, NEWS, or MEWS as a single
> screening tool for sepsis or septic shock." — **strong recommendation,
> moderate-quality evidence.**

(Companion recommendation: performance-improvement programmes for sepsis should include
sepsis screening and standard operating procedures; the guideline's rationale for the
qSOFA recommendation is qSOFA's poor *sensitivity* as a screen — it is specific but misses
too many septic patients at presentation.)

Application to the legacy artifacts, per artifact:

1. **`sepsis_qsofa_alert` (`_work/alerts/sepse.yaml:23-36`)** — `qsofa_score >= 2 AND
   icu_setting == false`, severity high, guideline_source cites Singer 2016. This is
   structurally a **single-tool qSOFA sepsis screen** — precisely the pattern SSC 2021
   issues a strong recommendation against. The 2016 citation was defensible when written;
   it is superseded. Retaining this alert in V2 would implement a practice the current
   authoritative guideline strongly recommends against. **Verdict: REJECT.**
2. **`ALERT-SEPSIS-SCREEN-01` / v4 `crit-sep-screen`** (`domain_sepsis.py:269-288`;
   `_work/alerts/pathways/sepse.yaml:218-245`) — infection gate AND (qSOFA ≥2 **OR**
   SIRS ≥2). This is *not* a single-tool qSOFA screen: the OR with SIRS restores
   sensitivity, and the infection gate respects the instrument's condition of use. It is,
   however, self-labeled "SSC-2021 RATIFIED" — an overstatement: SSC 2021 does not endorse
   any specific composite, and its preferred screening instruments are NEWS/MEWS/SIRS;
   a locally assembled qSOFA-OR-SIRS composite is an **unvalidated institutional
   instrument** requiring its own evidence. The "RATIFIED (RAT-SEPSE-01/02)" provenance
   traces to `docs/plan/_work/ratification-decisions.yaml:1-3`, whose stated authority is
   "repository owner delegation (session directive …)" — not a named clinical authority
   (see `sofa-review.md` D-19). **Verdict: VALIDATE (concept), REJECT (the ratification
   claim).**
3. **v4 `crit-sep-qsofa` graded criterion** (`pathways/sepse.yaml:85-105`) — a standalone
   graded qSOFA band (0-2 normal / 2 urgent "Disfunção orgânica" / 3 critical "Alta
   probabilidade de sepse") with **no infection gate and no setting gate** on the
   criterion itself. As a driver of severity display it re-creates the single-tool
   pattern with additionally misleading labels (Q-07). **Verdict: REJECT as an alert
   driver; at most VALIDATE as a *displayed component* subordinate to a ratified
   screening policy.**

INFERENCE — implications for any V2 qSOFA-driven alert: (a) a qSOFA-only sepsis screening
alert cannot be admitted without contradicting a strong recommendation of the governing
2021 guideline — the burden of evidence to overrule it is on a named clinical authority,
not on legacy precedent; (b) qSOFA may still legitimately appear as a *component* of a
multi-signal screen or as contextual display, but that composite is a new instrument that
must be separately evidenced (PROMPT:418 discipline); (c) the ICU-setting question is
sharper than legacy acknowledged — IntensiCare's stated population is ICU, where Sepsis-3
recommends full SOFA and where qSOFA's evidence base is weakest; VAL-0009 (approved care
settings) gates this decision. Cross-reference: CAND-0004's infection-suspicion source gap
("no identified source of any kind") remains unresolved and is decisive — see
`sepse-pathway-clinical-review.md` §5.

## 7. Clinical verdicts — PROPOSAL, per legacy-import-policy §4

| Artifact | Verdict | Rationale |
|---|---|---|
| qSOFA cut-points and 2-of-3 threshold (`qsofa.py:25-28,52`) | **VALIDATE** | Numerically exact to Sepsis-3; usable in a V2 spec only as re-derived, cited reference values, and only inside a ratified use-context (infection gate + setting) that legacy lacks. GCS <15 vs ≤13 operationalization must be explicitly chosen and cited. |
| Missing-input handling (§5) | **REJECT** | HAZ-0005 mechanism, test-enforced; superseded by V2 evaluation-status algebra (SAF-0001/0002). Carry §5 rows as absent-input probe vectors. |
| `missing_criteria` metadata concept | **TRANSFORM** | Same disposition as `SOFAResult.missing_components` (`sofa-review.md` §8): the intent survives as a first-class evaluation status, not an advisory list. |
| Standalone qSOFA alert (`_work/alerts/sepse.yaml:23-36`) | **REJECT** | Contradicts SSC 2021 strong recommendation (§6.1). |
| qSOFA-OR-SIRS + infection-gate screen concept (SCREEN-01 / crit-sep-screen) | **VALIDATE** | Clinically plausible composite; unvalidated instrument; requires named clinical ownership, an evidenced infection-suspicion source, and its own performance evidence before admission. |
| Pre-computed `qsofa` passthrough (`domain_sepsis.py:247-250`) | **REJECT** | Unvalidated override of the canonical scorer. |
| "high risk for sepsis" / "Alta probabilidade de sepse" framing (Q-07) | **REJECT** | Misstates the instrument's validated claim; wording for any V2 surface is pt-BR clinician-validated per evaluation-status-semantics.md §6. |

## 8. Surviving elements proposed for V2 specs (PROPOSAL)

1. The three cut-points and 2-of-3 threshold, cited to Singer 2016, with the GCS
   operationalization decision (any GCS <15 vs derivation's ≤13) recorded as an explicit
   ratification item.
2. The rule that qSOFA output is only interpretable under a documented
   suspected-infection condition — as a *precondition in the type*, not a consumer
   convention (CAND-0004's gate finding).
3. SSC 2021's screening recommendation as a standing constraint on portfolio admission:
   no single-tool qSOFA sepsis alert (§6).
4. §5's rows as SAF-0002 absent-input probe vectors, including the provider-boundary
   case (zero vitals persisted → `qsofa_score: 0` emitted) as a named regression test.

*Reviewed by rodaquino-OMNI (accountable reviewer of record, GDEC-0003). No PHI; all
values are published thresholds or synthetic examples.*
