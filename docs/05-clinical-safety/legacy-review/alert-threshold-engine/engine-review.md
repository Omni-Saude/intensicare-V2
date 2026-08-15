---
id: LEGREV-ALTB-ENGINE
title: Legacy review — V1 alert engine, bed-severity derivation, precedence, and suppression logic
label: PROPOSAL
status: PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI)
statement: >
  Source-verified review of the V1 alert generation engine, the bed-severity
  floor-to-normal derivation, the severity/color model, the
  assistido-precedence family, cooldown/de-duplication/grouping windows, the
  correlation engine, the alert compiler, and the notification worker, with
  per-artifact verdicts under docs/00-governance/legacy-import-policy.md.
provenance:
  source_repo: intensicare (legacy V1, READ-ONLY)
  path_or_url: src/intensicare/ (services, models, schemas, api)
  commit_sha_or_version: 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79 (HEAD at pin; per-file SHA-256 in section 0)
  section_or_lines: cited per finding as path:lines
  date_collected: 2026-08-15
  last_updated: 2026-08-15
  collector: rodaquino-OMNI (legacy alert-and-threshold engine forensics reviewer, cycle 1 Task 1)
  transformation: read from source; quoted or faithfully summarized; analyzed against V2 hazard log and evaluation-status semantics
  confidence: high (citations) / medium (clinical assessments)
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  hazards: [HAZ-0005, HAZ-0015, HAZ-0016, HAZ-0017, HAZ-0021, HAZ-0022, HAZ-0036]
  adrs: []
  pr: null
supersedes: null
superseded_by: null
---

# V1 alert engine and severity derivation — forensic review

> **PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).**
> Verdict vocabulary per `docs/00-governance/legacy-import-policy.md` §4.
> Nothing here is imported. Every verdict is a proposal to the named clinical
> authority; none is self-executing.

## 0. Cited files and integrity

All paths relative to `/Users/familia/intensicare/`. OBSERVED 2026-08-15:
every SHA-256 below matches `docs/archive/legacy-provenance/legacy-pin-cycle-1.md`.

```text
80980e3966626480a95af4ebe4ba379794dd4b74eaa99fb455923c2530df20ee  src/intensicare/services/alert_engine.py
ae60425f025bc7387c720dfe2c35fa89b0c2e053d33e2ad81d78828a68ac1489  src/intensicare/services/dashboard.py
122806b0dc39da514952f152bdfcf8fa296a7e684f41607fb2620dfd95baabb9  src/intensicare/services/domain_alertas.py
9f383ab935f3e90e796e81473d158354736c95d0550ad0f2020ee0d8a4a4066f  src/intensicare/schemas/severity.py
80001a3664c84b746aa43068864a3dd1f01c2aee9e01d13c4dfa1f276ab8bb96  src/intensicare/services/correlation_engine.py
a3d2223155e817d7463d4cefed29da98a9ca994d464f3fdb53cec117417b8a8a  src/intensicare/services/alert_compiler.py
5eec634394d5d146eb26849bcd63d91631197385b1764eed9434bf024f3da158  src/intensicare/services/alert_copy.py
0b8d7293e23b476399f30b59192536ed8fa156bac7ecc95a48ca73de887e0976  src/intensicare/services/notification_worker.py
7bcde809fab96bd09f57061df37d1715ae4b40ccea772d1a6fa0b66d1396f3e1  src/intensicare/services/altb_trigger.py
9ad826e9e31be584a17285a721697243e8654d9209ca68b9abec1230ed3c7fe6  src/intensicare/services/ews_nrt_runner.py
dcd1e76e7086106e659dce52e59a374350d8a4a662b63d9959a562dbf32eff64  src/intensicare/services/vitals.py
c86cde30ad675cde0cddd632a3a74f40c4d95bab013fd0abeb51880a8aff2f88  src/intensicare/models/alert.py
6eeb4024842c4e2332bb643cc048b0a69759664a2d3e9a49982de2a3d63588f7  src/intensicare/models/alert_definition_version.py
2a7ff1e52ce5d28259e06b705df2485e15353fad82812cded1af878546966e5e  src/intensicare/models/algorithm_registry.py
ef93899feeede67132e45ea7c7670045fc0044ab53be14a612b60c794db07385  src/intensicare/models/correlation_event.py
c23243f811fdd81c004f219e84f8c3154b4f73444dab149376ffb023854bd309  src/intensicare/schemas/alerts.py
46d6b5042ac6acb76bfe01068f614e87a5c3bd7ececa4e3123ea8c2b35a3c939  src/intensicare/api/v1/alerts.py
```

Hash-and-note (absent from the manifest — recorded in `README.md` §hash-and-note):
`docs/plan/_work/alerts/early-warning-scores.yaml`,
`docs/plan/_work/alerts/correlation-engine.yaml`.

---

## 1. FINDING 1 — bed-severity floor-to-normal (candidate-inventory 1.1g; HAZ-0005)

### 1.1 The mechanism, located

OBSERVED (`src/intensicare/services/dashboard.py:93-115`):

```python
def derive_bed_severity(
    alert_severity: str | None,
    pathway_severities: list[str | None] | None,
    mews: int | None,
    news2: int | None,
    thresholds: dict[str, tuple[int, int, int]],
) -> str:
    """Derive a bed's clinical severity — never null. ..."""
    candidates: list[str | None] = [alert_severity]
    if pathway_severities:
        candidates.extend(pathway_severities)
    candidates.append(_score_band_severity(mews, thresholds.get("MEWS")))
    candidates.append(_score_band_severity(news2, thresholds.get("NEWS2")))

    derived = max_severity(*candidates)
    return derived or SeverityLevel.NORMAL.value
```

The floor is the final line (`dashboard.py:115`). Supporting coercions:

- `_score_band_severity` (`dashboard.py:79-90`) returns `None` when the
  score is `None`; `max_severity` over all-`None` returns `None`
  (`src/intensicare/schemas/severity.py:176-182`, `:150-173`); line 115 then
  converts that `None` — "nothing was evaluated" — into the string
  `"normal"`.
- Pathway severities are individually coerced:
  `"severity": pp.severity or "normal"` (`dashboard.py:353`) — a pathway with
  a null severity is presented as `normal` before aggregation.
- The module's own comment states the intent (`dashboard.py:100-107`):
  "Floor is 'normal': a bed with no alerts, no active pathways, and no
  scores is still 'normal', not null — fixes beds silently disappearing from
  severity views".

### 1.2 End-to-end trace: score absent to bed state shown

1. A patient has no `ClinicalScore` rows (or none for MEWS/NEWS2): the
   window-function subqueries (`dashboard.py:209-265`) return no row for
   that `mpi_id`, so `mews_map.get(p.mpi_id)` is `None` (`dashboard.py:317`).
2. No active alerts: `alert_severities.get(p.mpi_id)` is `None`
   (`dashboard.py:333`).
3. No active pathways: `active_pathways` is `[]` (`dashboard.py:346-355`).
4. `derive_bed_severity(None, [], None, None, thresholds)` →
   `max_severity(None, None, None)` → `None` → floored to `"normal"`
   (`dashboard.py:360-366`, `:115`).
5. `PatientBedSummary.severity = "normal"` (`dashboard.py:402`); the
   triple-encoded rendering for `normal` is a green circle labeled "Normal"
   with description "Sem alerta ativo"
   (`src/intensicare/schemas/severity.py:79-85`).

Result: **a patient who was never assessed is displayed exactly as a patient
assessed and found well.** This is the concrete code-level confirmation of
candidate-inventory item 1.1g and the mechanism class of HAZ-0005 (E1
occurred-in-predecessor). It also interacts with the upstream defect recorded
in the hazard log: scorers that treat absent inputs as zero produce a low
score, which this function then bands as `normal` with full confidence.

### 1.3 Discrepancy analysis

- **Missing-data semantics**: the design goal ("never null") is solved in the
  wrong direction — the type system is forced to answer with a severity when
  the honest answer is "not evaluated". V2's
  `docs/05-clinical-safety/evaluation-status-semantics.md` §3.3 and
  prohibition P-1/P-2 make this state unrepresentable.
- **Population**: the same floor applies to every bed regardless of whether
  the patient is in the approved population (HAZ-0036 adjacency).
- **Aggregation**: `critical_count` (`dashboard.py:367-368`) counts only
  derived `critical`; a unit of 20 unassessed beds reports zero critical and
  zero anything-else — maximum reassurance from zero information (P-3, P-8).

### 1.4 Verdict — floor-to-normal pattern

**REJECT** (entire pattern: the `or "normal"` floor at `dashboard.py:115`,
the `pp.severity or "normal"` coercion at `dashboard.py:353`, and the
absence of any not-evaluated state in `PatientBedSummary`). The legitimate
requirement buried in it — "a bed must never silently disappear from the
severity view" — is already superseded by V2's `not_evaluated` state, which
keeps the bed visible with an honest label (SAF-0006). Rationale: this is
the failure mode that actually occurred in the predecessor (HAZ-0005, E1).
PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).

---

## 2. Alert generation engine (`alert_engine.py`)

### 2.1 Implemented logic (verbatim summary, cited)

`check_score_against_thresholds` (`src/intensicare/services/alert_engine.py:20-131`):

1. Threshold lookup — its **own** two-tier resolution (unit, then
   tenant-global), lines 32-44. It does **not** call
   `threshold_resolver.resolve_threshold` (see `thresholds-seed-review.md`
   §2) and has **no bed tier**.
2. `config is None` → `return None` (lines 46-48). No record of the no-fire.
3. Severity banding (lines 50-62): `score >= critical_threshold` →
   `critical`; `>= urgent_threshold` → `urgent`; `>= watch_threshold` →
   `watch`; below `watch` → `None` → `return None`.
4. Rate limit (lines 68-75): Redis key per `mpi_id + score_type`;
   `config.rate_limit_per_hour or 10` (hardcoded fallback 10/h); at limit →
   `return None`. No record.
5. Cooldown (lines 77-83): only if `config.cooldown_minutes` is truthy;
   Redis key per `mpi_id + score_type + severity`; in cooldown →
   `return None`. No record.
6. Alert creation (lines 93-110): title/body from `build_alert_copy`;
   `Alert(..., severity, status="active", ...)`. **`definition_version_id`
   is never set** although the column and the
   `alert_definition_version` table exist
   (`src/intensicare/models/alert.py:36-40`,
   `src/intensicare/models/alert_definition_version.py:12-30`).
7. Rate-limit counter + cooldown key set (lines 112-121; 1-hour window,
   cooldown TTL `cooldown_minutes * 60`).
8. Best-effort WebSocket publish (lines 123-172): failure is logged and
   swallowed — generated but possibly never displayed (HAZ-0015).

`process_clinical_score` (lines 175-192): patient-cache miss → `return None`
(lines 184-185) — **no tenant, no alert, no record**.

Wiring (OBSERVED `src/intensicare/services/vitals.py:388-408`): MEWS, NEWS2,
SOFA, and qSOFA scores are all routed through `process_clinical_score` on
every vitals ingestion.

### 2.2 Findings

- **F2.1 (HAZ-0021 — silent no-fire, four paths).** Missing config, below
  watch, rate-limited, in-cooldown, and patient-cache-miss all return `None`
  with no persisted reason. A no-fire is indistinguishable from a negative
  evaluation.
- **F2.2 (HAZ-0021/HAZ-0005).** SOFA and qSOFA are scored and checked, but
  migration 0038 seeds thresholds only for MEWS and NEWS2
  (`alembic/versions/0038_seed_default_threshold_config.py:48-71`), so under
  default configuration **SOFA/qSOFA can never alert**, silently, on every
  patient (path 2.1 step 2).
- **F2.3 (defect).** The unit-tier query (lines 38-40) filters
  `unit == unit` but not `bed_id IS NULL`. If both a unit-level and a
  bed-level row exist for the same tenant/unit/score_type,
  `scalar_one_or_none()` raises `MultipleResultsFound` — the scoring path
  throws instead of alerting; if only a bed-level row exists for that unit it
  is silently misapplied unit-wide.
- **F2.4 (version opacity, HAZ-0036-adjacent).** Alerts carry no rule
  version (`definition_version_id` never stamped), so the exact logic that
  produced a given alert cannot be reconstructed. The registry tables
  (`alert_definition_version`, `algorithm_registry`) exist but the live path
  bypasses them.
- **F2.5 (second, undisciplined creation path).** `ews_nrt_runner.py`
  constructs `Alert()` directly, bypassing cooldown/rate-limit, with an
  explicit in-code wiring warning
  (`src/intensicare/services/ews_nrt_runner.py:656-670`). Two engines, two
  disciplines (HAZ-0016/HAZ-0020 class).

### 2.3 Verdict — alert engine

**TRANSFORM.** The concept — configured, per-scope thresholds evaluated on
score write, with severity bands and burden controls — carries forward; the
implementation does not: silent suppression (F2.1), coverage gaps that
silently disable scores (F2.2), the resolution defect (F2.3), version
opacity (F2.4), and the duplicate creation path (F2.5) are each
disqualifying for RETAIN/REFINE. V2 requires: no-fire reasons persisted
(SAF-0019), a single resolution service, a stamped rule version on every
alert, and one creation path.
PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).

---

## 3. FINDING 2 — assistido (attended) precedence and rollup (bed, sector, dashboard)

Sources: `docs/rules/alert-threshold/` RULE-ALERTAS-005..011, 027-029,
RULE-TRILHAS-ENGINE-004, RULE-INDICADORES-ETL-001/002/006 (all
manifest-hashed; the rule records cite the audited upstream repos at their
own pinned commits) and `src/intensicare/services/domain_alertas.py`
(ratified re-implementations of RULE-ALERTAS-001/002).

### 3.1 The precedence chain as implemented

- **Bed color**: worst pathway color with red-dominates precedence
  (RULE-ALERTAS-005/006; LARANJA — interactive sepsis — outranks all on
  automatic beds per 006).
- **Attended override (the masking step)**: if `assistido === true`, the
  rendered status key is `ASSISTIDO` (blue) **regardless of the alert value**
  — border, background, ball color, gender-icon color — at patient/bed card
  and at trilha chip level (RULE-ALERTAS-011, duplicated verbatim in two
  components; RULE-TRILHAS-ENGINE-004 repeats it at the pathway tab).
- **Attendance determination**: a bed is attended only if every non-NEUTRO
  pathway is attended; an all-NEUTRO bed is *not* attended
  (RULE-ALERTAS-009).
- **Unmasked parallel channel**: `alerta_nao_assistido` keeps the
  attendance-ignoring worst color per bed (RULE-ALERTAS-007/008) and feeds
  the sector `total_alertas` KPI (RULE-ALERTAS-028).
- **Sector card**: ASSISTIDO takes top priority; otherwise the
  **highest-count** color wins, not the highest severity
  (RULE-INDICADORES-ETL-006); at 100% assisted the whole card flips to
  ASSISTIDO (RULE-INDICADORES-ETL-002).
- **Sector counts with absent data**: `aggregate_alert_counts`
  (`src/intensicare/services/domain_alertas.py:87-112`) counts a
  movimentacao whose four pathway alerts are **all `None`** as `NEUTRO`
  (`_worst_alert_color`, lines 75-84: anything not VERMELHO/AMARELO —
  including all-absent — returns NEUTRO). Absence becomes "no alert" in the
  sector denominator (HAZ-0005 at rollup level).

### 3.2 Clinical safety assessment — may attendance mask severity?

**Yes, in the primary visual channel.** Once a clinician marks a pathway
attended, the red/amber state disappears from the card, chip, and tab and is
replaced by blue; at 100% attendance an entire sector's card stops showing
severity. "Attended" is an acknowledgement of awareness, not evidence of
resolution: a patient can be attended and still deteriorating, and the color
channel now under-reports exactly the patients already known to be sickest.
Mitigations exist but are secondary: `alerta_nao_assistido` preserves
unmasked severity in sector KPIs (007/008/028), and the count-buckets keep a
VERMELHO tally. Two aggravating defects: (a) the sector card resolves ties by
**count**, so one red bed among five amber beds shows amber
(RULE-INDICADORES-ETL-006) — an aggregate more reassuring than its worst
member (violates V2 prohibition P-3); (b) when neither attended nor alerted
the status key is the empty string and **no** border/background is rendered
at all (RULE-ALERTAS-011 edge case) — unevaluated is rendered as
absence-of-signal (HAZ-0005 again).

### 3.3 Verdict — assistido precedence family

**REJECT** the override-precedence (ASSISTIDO replacing the severity color:
RULE-ALERTAS-011, RULE-TRILHAS-ENGINE-004, RULE-INDICADORES-ETL-002/006
flip behavior) and the count-based sector tie-break. **TRANSFORM** the
underlying concepts that are sound: (i) acknowledgement state must be
visible *alongside* — never instead of — severity; (ii) an
attendance-ignoring severity channel (the `alerta_nao_assistido` idea) is
the correct invariant and should become the primary channel, not the
fallback; (iii) highest-severity-wins rollup (already present in V1's own
newer `schemas/severity.py:150-182` "P0-10 highest-severity-wins, never
last-writer-wins") is the correct aggregation and contradicts the older
frontend count-based card — evidence V1 itself identified the defect.
PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).

---

## 4. FINDING 3 — cooldown / de-duplication / grouping windows

### 4.1 Values found (all OBSERVED, cited)

| Mechanism | Value | Source |
|---|---|---|
| Per-severity cooldown | `cooldown_minutes` config column; skipped entirely when NULL/0; seed 0038 leaves it NULL | `alert_engine.py:77-83,116-120`; `0038_seed...py:48-71` |
| Rate limit | `rate_limit_per_hour` config column; hardcoded fallback **10/h** per patient+score; 1-hour Redis window | `alert_engine.py:68-75,112-115` |
| Resolver defaults (dataclass, unused by live path) | watch/urgent/critical 0; rate 10/h; cooldown 5 min | `threshold_resolver.py:17-35` |
| Notification dedup | `dedup_key` TTL **300 s** (5 min) | `notification_worker.py:41-42,108-125` |
| Notification retry | backoff 1,2,4,8,16,32 s; max 6 tries; then DLQ + operational alert | `notification_worker.py:30-32,190-213` |
| Declarative catalog suppression | cooldown PT4H / PT6H / PT12H; rate limits 2-3 per 24 h per patient; `dedup_key: patient_id+alert_id` | `docs/plan/_work/alerts/early-warning-scores.yaml` (hash-and-note) |
| Correlation join windows | SA-AKI 72 h; resp+hemo 6 h; QTc+electrolyte 24 h; exam redundancy per-class 120-720 h | `correlation_engine.py:60-74` |
| Read-time grouping | group by (mpi_id, score_type); zero information loss; `escalating` flag pierces the rollup | `api/v1/alerts.py:172-254`; `schemas/alerts.py:40-67` |
| Content-diff dedup while red | re-notify only when red content changes | RULE-ALERTAS-016 (`docs/rules/alert-threshold/`) |

### 4.2 Clinical defensibility

- The **seeded configuration has no cooldown at all** (0038 leaves
  `cooldown_minutes` NULL, so `alert_engine.py:78` skips the block):
  alarm-fatigue protection in production rests solely on the 10/h rate limit
  — and that limit then **silently discards the 11th alert of the hour with
  no record** (HAZ-0016 vs HAZ-0022 traded blindly).
- Cooldown is keyed per severity, so escalation to a higher severity is
  never blocked by a lower band's cooldown — this part is clinically
  correct.
- Same-severity re-deterioration inside a cooldown window is
  indistinguishable from silence; there is no "suppressed alert" artifact,
  no escalation timer, and no suppression audit (HAZ-0022, SAF-0022).
- The declarative catalog windows (PT4H-PT12H, 2-3 per 24 h) are plausible
  burden budgets but are **enforced nowhere**: the compiler that loads them
  performs no suppression (section 6), and the live engine reads only
  `threshold_config`. Two disjoint suppression vocabularies exist.
- The notification dedup (5 min) sits *below* the alerting layer and can
  eat a legitimate second notification for a genuinely new alert if the
  caller reuses a dedup key; suppression is logged but not surfaced
  clinically.
- The `escalating` flag in the read-time grouping (`schemas/alerts.py:48-56`)
  is a genuinely good control: acknowledged members never suppress it, and
  it is computed only among still-active members.

### 4.3 Verdict — cooldown/dedup/grouping

**VALIDATE** the window values (no cooldown by default, 10/h, 5-min dedup,
PT4H-PT12H, 2-3 per 24 h): the missed-re-deterioration vs alarm-fatigue
trade-off is a clinical judgement that no engineering artifact here
evidences; every value must be set (or confirmed) by the clinical owner with
recorded rationale. **REJECT** silent suppression without a persisted,
reason-coded record (all suppression paths in 4.1 rows 1-2 and 5).
**REFINE** the ADR-0039 read-time grouping with the escalating override —
the one artifact in this family designed with explicit
zero-information-loss reasoning.
PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).

---

## 5. FINDING 4 — severity model and color mapping

### 5.1 As implemented

- Canonical ordinal severity `normal < watch < urgent < critical` with
  integer ranks, DB CHECK vocabulary, and highest-severity-wins aggregation
  (`src/intensicare/schemas/severity.py:15-67,150-182`).
- **Triple encoding** — color + icon + shape + pt-BR label + description per
  level (`severity.py:70-147`), explicitly for accessibility ("non-color-only").
- Criteria-count color mapping exists in the *legacy rule layer*, not in the
  V1 Python engine: count of triggered criteria mapped to VERMELHO/AMARELO/
  NEUTRO per pathway (RULE-ALERTAS-001/003/004; re-implemented as ratified
  utilities in `domain_alertas.py:35-57`).

### 5.2 Assessment

- The Python-side model **is** clinically ordinal and non-color-only
  (rank + icon + shape + label). This is the strongest artifact in the
  review.
- Defects: (a) `normal` is a member of the severity enum, so "no concern"
  and "not evaluated" collapse into one representable value — the type-level
  root of Finding 1; (b) the `p10_score` mapping (0/3/7/10,
  `severity.py:58-64`) is an uncited magic scale; (c) the legacy color
  vocabulary (VERMELHO/AMARELO/NEUTRO + special-case LARANJA + ASSISTIDO)
  is color-only, inconsistent across surfaces (a fourth LARANJA bucket
  exists in exactly one frontend type — RULE-INDICADORES-ETL-007), and
  count-derived rather than severity-derived in places (section 3.2).

### 5.3 Verdict

**REFINE** the canonical ordinal + triple-encoding + highest-severity-wins
model (import of the *concept* with V2 changes: remove `normal` from the
alertable set, add explicit evaluation-status states, evidence the encoding
choices, drop `p10_score` or evidence it). **REJECT** the criteria-count →
color mechanism (absence counts as zero → count under-states severity;
HAZ-0005) and the VERMELHO/AMARELO/NEUTRO/LARANJA color-only vocabulary.
PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).

---

## 6. Correlation engine, compiler, copy, notification worker (secondary artifacts)

### 6.1 Correlation engine (`correlation_engine.py`)

Four cross-domain rules; members folded ("member_suppressed") into one
richer alert; QTc chain amplifies two watch-level members to critical
(lines 41-102, 165-415). Missing inputs are *recorded* in the result
(`missing_inputs`, lines 182-217 etc.) — better than the main engine — but a
not-fired-because-unevaluable result is still `fired=False` with no distinct
evaluation status, and `emit_correlation_event` returns `None` for any
non-fired result (lines 608-620). Cut-point review is in
`thresholds-seed-review.md` §5. Member suppression is a clinical-review
item: folding ALERT-ELY-POTASSIUM-01 into a correlation must not hide the
electrolyte alert from workflows that subscribe to it (HAZ-0022).
**Verdict: VALIDATE** (concept plausible and mostly evidence-anchored;
suppression semantics and windows require clinical validation).

### 6.2 Alert compiler (`alert_compiler.py`) — candidate-inventory 1.1h confirmed

- Parses clinical trigger logic **with regular expressions** over free-text
  `logic` strings (BAND_PATTERN/FACADE_PATTERN, lines 115-137) and ships
  gates A/B/C over the parse results.
- `evaluate_alert_definition` (lines 374-414) does not evaluate the rule at
  all: it looks up the **best-matching test vector** and returns that
  vector's expected outcome — the test oracle is the implementation.
  Empty inputs → `False` (lines 392-394); unknown alert → `False`.
- OBSERVED 2026-08-15: `grep -l alert_groups docs/plan/_work/alerts/*.yaml`
  matches **none of the nine** domain YAMLs — the coverage gate's "all
  zero" pass validates nothing (candidate-inventory 1.1h, "false-green
  gate"; HAZ-0031 class).

**Verdict: REJECT** (regex-parsed clinical logic, circular evaluator,
false-green gate). The *goal* — build-time verification that rendered
thresholds equal evaluated predicates (Gate C's intent) — is sound and
should be rebuilt on a real AST in V2.

### 6.3 Clinical copy (`alert_copy.py`)

Centralized pt-BR 3-part explanation; unknown score types get a deliberately
non-committal generic fallback (lines 117-131) — safe by construction.
Defect: the "por que importa" clauses hardcode guideline claims
("NEWS2 entre 5 e 6", lines 85-115) while thresholds are operator-configurable
— an operator override desynchronizes the wording from the firing rule
(facade/predicate divergence in prose). Unrecognized severity falls back to
the *least* severe copy (lines 173-201) — under-communication on a model
mismatch. **Verdict: VALIDATE** (wording requires pt-BR clinician
validation; bind copy to the configured threshold values, not to prose
constants; unknown-severity fallback must fail loud, not soft-quiet).

### 6.4 Notification worker (`notification_worker.py`)

Retry with exponential backoff, DLQ with operational alert, atomic dedup —
sound delivery-durability concepts (HAZ-0015/0017 mitigations). Defects:
`mobile`/`sms` channels are placeholders that log and drop; **unknown
channels are silently ignored** (lines 64-73) — a misconfigured channel name
becomes a silent delivery black hole. **Verdict: TRANSFORM** (retry/DLQ/
dedup concepts carry; silent channel drops rejected; delivery receipt to a
human remains unproven — HAZ-0015 stands).

### 6.5 ALT-B latency trigger (`altb_trigger.py`)

Latency-governance instrumentation (30 s p95 over 7 days), not alert logic;
reviewed for completeness. **Verdict: SUPERSEDE** — V2's architecture and
SLO work defines its own latency governance (HAZ-0030 owns the clinical
side).

### 6.6 Alert workflow API (`api/v1/alerts.py`)

Lifecycle transitions validated with 409s (lines 326-492); read-time
grouping preserves every member (§4.1). Defects: `resolved_by` not tracked
(line 118), acknowledge/resolve/escalate all mapped to one ABAC action
(lines 55-62), no optimistic concurrency (HAZ-0023). **Verdict: TRANSFORM.**

---

## 7. Zero/absence handling — consolidated HAZ-0005 sweep (FINDING 6)

Every reviewed path, from source:

| # | Path | Behavior on absent/None/zero | Cited | Assessment |
|---|---|---|---|---|
| 1 | Bed severity, no scores/alerts/pathways | floored to `normal` | `dashboard.py:115` | REJECT (Finding 1) |
| 2 | Pathway severity null | coerced to `"normal"` | `dashboard.py:353` | REJECT |
| 3 | Sector rollup, all four pathway alerts None | counted as `NEUTRO` | `domain_alertas.py:75-84,109-112` | REJECT |
| 4 | Criterion flag None or non-1 | not counted as in-alert | `domain_alertas.py:53-57` (RULE-ALERTAS-004) | REJECT — unknown coerced to not-in-alert |
| 5 | Alert engine, no threshold config | silent `None` | `alert_engine.py:46-48` | REJECT — no-fire without record |
| 6 | Alert engine, patient cache miss | silent `None` | `alert_engine.py:184-185` | REJECT |
| 7 | Alert engine, SOFA/qSOFA (no seeded config) | never alert | `vitals.py:400-408` + `0038:48-71` | REJECT — structural silent no-fire |
| 8 | Correlation, missing inputs | `fired=False`, missing list recorded, no event emitted | `correlation_engine.py:182-217,608-620` | REFINE — reason capture exists, status contract missing |
| 9 | Compiler, empty inputs / unknown alert | `False` | `alert_compiler.py:388-394` | REJECT |
| 10 | Frontend status key empty (not attended, no alert) | no border/background rendered at all | RULE-ALERTAS-011 edge case | REJECT — unevaluated rendered as absence |
| 11 | Attendance, all-NEUTRO bed | treated as *not* attended | RULE-ALERTAS-009 | conservative direction; acceptable concept |
| 12 | Reference ranges, empty config table | silent hardcoded defaults | `api/reference_ranges.py:99-117` | REJECT (see seed review §4) |
| 13 | Notification, unknown channel | silently ignored | `notification_worker.py:73` | REJECT |
| 14 | Grouping, unknown score type | grouped as `"UNKNOWN"`, never dropped | `api/v1/alerts.py:147-169` | REFINE — the one absence path that stays visible |
| 15 | 24 h history empty | falls back to 50 most recent rows regardless of age | `dashboard.py:503-542` | VALIDATE — stale-as-current risk (HAZ-0006); age must be explicit |

Pattern: with two exceptions (rows 8 and 14), **every absence path resolves
toward reassurance or silence**. This is systemic, not incidental — the
absence of an evaluation-status type forces every call site to invent a
coercion, and every coercion chose the unsafe direction.

---

## 8. Summary of verdicts (this record)

| Artifact | Verdict |
|---|---|
| Floor-to-normal bed severity (`derive_bed_severity` + coercions) | **REJECT** |
| Alert engine (`alert_engine.py`) | **TRANSFORM** |
| Assistido override precedence (bed/pathway/sector) | **REJECT** (override) / **TRANSFORM** (acknowledgement-alongside-severity, unmasked channel) |
| Sector count-based color tie-break | **REJECT** |
| Cooldown/rate-limit/dedup window values | **VALIDATE** (values) / **REJECT** (silent suppression) |
| ADR-0039 read-time grouping + escalating flag | **REFINE** |
| Severity model (ordinal + triple encoding + max-wins) | **REFINE** |
| Criteria-count → color mechanism | **REJECT** |
| Correlation engine | **VALIDATE** |
| Alert compiler + gates | **REJECT** |
| Clinical copy | **VALIDATE** |
| Notification worker | **TRANSFORM** |
| ALT-B trigger | **SUPERSEDE** |
| Alert workflow API | **TRANSFORM** |

All verdicts: PROPOSAL — AWAITING NAMED CLINICAL REVIEW
(reviewer: rodaquino-OMNI).
