---
doc_id: KPI-REVIEW-CYCLE1-TASK3
title: Clinical KPI review — keep / drop / redefine for every legacy V1 KPI (cycle 1, Task 3)
status: REVISADO 2026-08-15 (GDEC-0007) — decisões incorporadas
label: REVISADO 2026-08-15 (GDEC-0007) — decisões do §8 incorporadas (ver "DECISÃO" por questão); as definições de §1/§3 e os pisos numéricos residuais permanecem PROPOSAL — VALIDATION REQUIRED, exceto onde §8 registra decisão em contrário
owner: UNASSIGNED — VALIDATION REQUIRED
reviewer: rodaquino-OMNI
date_collected: 2026-08-15
last_updated: 2026-08-15
provenance:
  source_repo: intensicare-V2
  path_or_url: docs/05-clinical-safety/pathway-portfolio/clinical-kpi-review.md
  commit_sha_or_version: working tree on branch cycle-1/clinical-content (uncommitted at authoring)
  section_or_lines: whole document
  date_collected: 2026-08-15
  collector: clinical-KPI methodologist (cycle 1, Task 3); accountable reviewer rodaquino-OMNI
  transformation: >
    Keep/drop/redefine policy derived exclusively from the completed forensic records in
    docs/05-clinical-safety/legacy-review/kpi/ (legacy pin
    1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79) mapped against
    docs/01-vision-and-intended-use/success-and-harm-metrics.md and
    docs/05-clinical-safety/evaluation-status-semantics.md. No legacy code was re-read;
    all line citations herein are quoted from the forensic records.
  confidence: high for decisions traceable to OBSERVED forensic findings; medium for successor definitions (all PROPOSAL)
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED — every decision is PROPOSAL — AWAITING NAMED CLINICAL REVIEW
links:
  requirements: [SAF-0001, SAF-0002, SAF-0006, SAF-0019]
  hazards: [HAZ-0005, HAZ-0031]
  adrs: []
  tests: []
  pr: null
supersedes: null
superseded_by: null
---

# Clinical KPI review — keep / drop / redefine (cycle 1, Task 3)

> **EVERY DECISION IN THIS DOCUMENT IS: PROPOSAL — AWAITING NAMED CLINICAL REVIEW
> (reviewer: rodaquino-OMNI).** This document decides nothing. It converts the
> completed cycle-1 Task 1 forensic records
> (`docs/05-clinical-safety/legacy-review/kpi/`) into a reviewable keep/drop/redefine
> policy with clinically defensible successor definitions. Nothing here authorizes
> import (`docs/00-governance/legacy-import-policy.md` §3), sets a threshold
> (`AUTH-CLINSAFETY`, UNASSIGNED), or adopts a metric
> (`success-and-harm-metrics.md` §0 rule 1). Successor IDs `KPIR-nn` are
> document-local review handles, not catalog IDs.
>
> **REVISADO 2026-08-15 (GDEC-0007).** O revisor nomeado (rodaquino-OMNI) decidiu as
> doze questões de §8: onze aceitas como recomendado; **K-8 MODIFICADO** — dos seis
> macro-nomes legados, cinco permanecem DROP definitivo e "vidas_salvas" é MANTIDO,
> redefinido como **KPIR-14 "Altas vivas da UTI"** (§3). Cada questão de §8 carrega
> agora sua marca **DECISÃO**. Fora dessas doze decisões, o restante do documento —
> as definições completas de §1/§3 e os pisos numéricos residuais — permanece
> PROPOSAL — VALIDATION REQUIRED. Transcrição-mestre da decisão:
> `docs/00-governance/registers/decision-register.md` GDEC-0007.

## 0. Scope, method, and decision vocabulary

**Evidence base (SOURCE — read in full, not re-derived):** `kpi-inventory.md` plus the
five per-domain forensic records in `docs/05-clinical-safety/legacy-review/kpi/`:
`kpi-bed-grid-dashboard.md` (KPI-DASH-01..08), `kpi-indicators-catalogue.md` (the
31-member mock catalogue), `kpi-efficiency-stewardship.md` (KPI-EFF-01..05),
`kpi-ppv-tracker.md` (KPI-PPV-01 constructs), and
`kpi-operational-time-and-etl-rules.md` (KPI-OPS-01..03 + extracted rules). Normative
frame: `docs/01-vision-and-intended-use/success-and-harm-metrics.md` (SM-01..05,
HM-01..07, and the SM-03 rule: compute only over `valid` patient-time; report
non-valid patient-time as a separate denominator) and
`docs/05-clinical-safety/evaluation-status-semantics.md` (five states, prohibitions
P-1..P-8).

**Decision vocabulary of this review (PROPOSAL):**

| Decision | Meaning | Maps from forensic verdict |
|---|---|---|
| **KEEP** | The clinical concept and its basic mechanism are retained; V2 rebuilds it with the stated refinements (always including evaluation-status handling). | RETAIN, REFINE |
| **REDEFINE** | The clinical concept is wanted; the legacy computation is discarded entirely and a successor definition is specified in §3. Nothing of the implemented arithmetic is imported. | TRANSFORM |
| **REDEFINE — CONDITIONAL** | The concept may re-enter only after a named human closes the stated validation gap; no successor definition can responsibly be written yet. | VALIDATE |
| **DROP** | Not carried into V2 in any form as implemented. Where a forensic verdict was SUPERSEDE, the replacing V2-native design is cross-referenced. Anti-patterns are recorded so they are not re-proposed. | SUPERSEDE, REJECT |
| **OUT OF SCOPE** | Not a clinical KPI; pointered to the owning reviewer/workstream. | pointered entries |

**Coverage:** 34 decision rows below (8 dashboard + 2 indicators-catalogue mechanism
entries + 5 efficiency + 4 PPV constructs + 3 operational building blocks + 12
extracted rules), plus the 31 catalogue members individually dispositioned in §5.
This is 100% of the forensic inventory (`kpi-inventory.md` §1). The inventory's
finding that **9 entries violate SM-03 as implemented** (`kpi-inventory.md` §2) is
honoured structurally: **no KPI is kept in its implemented form; the keep/redefine
count of legacy computations imported unchanged is zero.**

## 1. Per-KPI decision table

All rows: **PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).**
Column "SM/HM" maps the legacy KPI to the normative frame. Column "Successor" points
to the definition block in §3 (kept/redefined) or requirement block in §4
(conditional).

### 1.1 Bed-grid dashboard (forensic record: `kpi-bed-grid-dashboard.md`)

| ID | Legacy content | Decision | SM/HM | One-line clinical rationale | Successor |
|---|---|---|---|---|---|
| KPI-DASH-01 | Active-patient census (`total`) | **KEEP** (refined) | denominator for SM-04/SM-05 | Census is legitimate denominator infrastructure, but must be partitioned by evaluation status before anything divides by it (P-8). | KPIR-01 |
| KPI-DASH-02 | Critical-patient count (`critical_count`) | **REDEFINE** | SM-05 complement; HM-03 | "How many patients are critical now" is clinically wanted; the floor-to-`normal` derivation that counts unscored patients as non-critical (SM-03/HAZ-0005 violation) must not be imported in any form. | KPIR-02 |
| KPI-DASH-03 | Active-alert total (`active_alerts_total`) | **REDEFINE** | SM-04 | Raw alert count without patient-day normalization, severity split, rule-version attribution or no-fire accounting cannot support burden management; rebuild in SM-04's shape. | KPIR-03 |
| KPI-DASH-04 | Per-unit census (`unit_counts`) | **KEEP** (refined) | denominator infrastructure | Navigation census is legitimate; silently dropping null-unit patients from every tab violates P-8 — the unassigned-unit bucket must be explicit. | KPIR-01 |
| KPI-DASH-05 | NEWS2 risk banding (`news2_risk`) | **REDEFINE — CONDITIONAL** | input to SM-01/SM-03 pathways | Banding plausibly matches published NEWS2 trigger levels, but may only ship bound to a versioned rule artifact, staleness/expiry policy, and evaluation status — all requiring clinical ratification. | §4.1 |
| KPI-DASH-06 | Derived bed severity (floor `normal`) | **DROP** (superseded) | HM-03(b), target zero | Absence of evaluation rendered in severity vocabulary as `normal` is the exact defect the V2 status algebra makes unrepresentable; superseded by `evaluation-status-semantics.md` §2. Only the highest-severity-wins composition idea is preserved as a status-precedence analogue. | — |
| KPI-DASH-07 | Score trend (first-vs-last) | **REDEFINE** | supports SM-01 | Trend display is wanted; a noise-sensitive two-point sign over unstatused, unwindowed scores is not clinically defensible. | KPIR-04 |
| KPI-DASH-08 | Vitals-staleness indicator (client-side) | **REDEFINE** | SM-05; HM-03 | Staleness is an evaluation-status output and must be computed server-side from source clinical time; the `synced_at` fallback that lets a never-measured patient display "fresh" must not be imported. | KPIR-05 |

### 1.2 Indicators catalogue (forensic record: `kpi-indicators-catalogue.md`; full treatment in §5)

| ID | Legacy content | Decision | SM/HM | One-line clinical rationale | Successor |
|---|---|---|---|---|---|
| KPI-IND mechanism | Mock generator, summary, history endpoints serving `random` values | **DROP** (rejected; recorded anti-pattern) | HM-03 at organizational level | Fabricated clinical quality values served to authenticated users are the strongest false-green mechanism found; must never be imported or re-proposed in any form. | §5 |
| KPI-IND catalogue (31 members) | Names, units, targets, reference ranges | **DROP as implemented; concepts REDEFINE — CONDITIONAL individually** | candidate V2 metric catalog | Every member is never-implemented (no numerator, denominator, exclusion, window, or data path exists); the names are a plausible candidate list whose targets are unreferenced constants. | §5 |

### 1.3 Efficiency and stewardship (forensic record: `kpi-efficiency-stewardship.md`)

| ID | Legacy content | Decision | SM/HM | One-line clinical rationale | Successor |
|---|---|---|---|---|---|
| KPI-EFF-01 | Transfusion appropriateness (TF-001..TF-012, 8/12 cutoff) | **REDEFINE** | future stewardship metric (no current SM/HM) | Guideline-anchored stewardship audit is wanted; absence-as-compliance (TF-003/TF-006), the inverted TF-002, and the unreferenced 8/12 aggregate make the implemented score clinically uninterpretable. | KPIR-06 |
| KPI-EFF-02 | Mechanical-restraint monitoring | **REDEFINE** | safety-practice audit | Restraint duration/reassessment auditing is recognized practice; `duration_hours=0` default makes an untracked restraint compliant by definition — the metric currently measures documentation coverage, not care. | KPIR-07 |
| KPI-EFF-03 | Frailty scoring (CFS banding) | **KEEP** (refined) | case-mix/coverage input | The only honest not-assessed state in the legacy KPI surface ("não avaliada", `assessed: false`) is preserved as the pattern; per-scale band guards and pt-BR label ratification are required. | KPIR-08 |
| KPI-EFF-04 | ICU LOS outlier (1.5× / 14-day fallback) | **REDEFINE — CONDITIONAL** | efficiency benchmark family | LOS benchmarking is standard, but multipliers, benchmark source, and case-mix adjustment are unreferenced/absent; `days=0` default reporting "dentro do esperado" on missing admission data must not recur. | §4.2 |
| KPI-EFF-05 | Efficiency endpoint serving full assessments from empty inputs | **DROP** (rejected) | HM-03 generator | A surface that fabricates affirmative clinical narrative from zero data, for any patient identifier, is a false-reassurance generator; a V2 endpoint with no data returns `not_evaluated` with reasons. | — |

### 1.4 PPV / alert precision (forensic record: `kpi-ppv-tracker.md`; full redesign in §6)

| ID | Legacy content | Decision | SM/HM | One-line clinical rationale | Successor |
|---|---|---|---|---|---|
| KPI-PPV-01(a) | PPV computation TP/(TP+FP), TP includes `intervention_done`, dead code | **DROP** (superseded by SM-03 design) | SM-03 | Clinician action counted as alert correctness, self-adjudication at resolve time, and a feedback-resolved-only denominator measure neither precision nor anything clinically defensible. | §6 |
| KPI-PPV-01(b) | "Fatigue rate" = FP share of resolutions | **DROP** (rejected) | HM-02 | FP-share of voluntarily labelled resolutions is not alert fatigue; HM-02 defines the real composite (dismissal drift, latency drift, validated instrument, bulk dismissal). | §6 |
| KPI-PPV-01(c) | Assume-OK-below-n target logic (targets "met" with < 10 resolutions) | **DROP** (rejected; recorded anti-pattern) | §0 rule 1 of success-and-harm-metrics | Zero-data-validates-success is the named legacy stop-condition pattern (HAZ-0031 class); no V2 metric may ever default to target-met. | §6 |
| KPI-PPV-01(d) | Resolution-label capture at the resolve endpoint | **KEEP** (refined) | feedback signal for SM-03 adjudication sampling | Clinician feedback labels are worth capturing with named-user attribution and timestamps — explicitly as a feedback signal, never as outcome ground truth (HM-01 rule). | KPIR-13 |

### 1.5 Operational building blocks and extracted rules (forensic record: `kpi-operational-time-and-etl-rules.md`)

| ID | Legacy content | Decision | SM/HM | One-line clinical rationale | Successor |
|---|---|---|---|---|---|
| KPI-OPS-01 | Length of stay (whole-day truncation, UTC) | **KEEP** (refined) | denominator infrastructure; feeds LOS metrics | LOS is required, but truncation systematically undercounts and UTC date arithmetic shifts day boundaries for a Brazilian site; anchors, timezone and fractional-day policy must be defined clinically. | KPIR-09 |
| KPI-OPS-02 | Clinical/reporting day boundary (07:00 conventions; UTC vs local disagreement) | **REDEFINE — CONDITIONAL** | window rule for every per-day KPI | Two implementations of "the same" 7-to-7 convention disagree by the UTC offset — the convention must be confirmed with the site and implemented once, with an explicit timezone, before any per-day KPI exists. | §4.3 |
| KPI-OPS-03 | `get_number` coerce-to-zero primitive | **DROP** (rejected; recorded anti-pattern) | P-1 prohibition | The coerce-missing-to-zero primitive is prohibited verbatim by `evaluation-status-semantics.md` §4 P-1; parse failures must produce `invalid`/`not_evaluated`, never 0.0. | — |
| RULE-INDICADORES-ETL-001 | Sector alert-share % (client-side) | **REDEFINE** | SM-04 family | Severity-share of a sector is useful only over statused, server-side counts; a zero-alert sector must be distinguishable from an unevaluated sector. | KPIR-10 |
| RULE-INDICADORES-ETL-002 | Assisted-share % (client-side) | **REDEFINE** | SM-04 family | Same rebuild; the catalogued edge case (assisted patients with zero yellow/red alerts rendering 0%) is a denominator artifact misrepresenting care state. | KPIR-10 |
| RULE-INDICADORES-ETL-005 | Occupancy dial thresholds (70/50) | **REDEFINE — CONDITIONAL** | operational context metric | Thresholds are unreferenced and the upstream `ocupacao` formula is SOURCE NOT LOCATED — nothing to keep until a defined occupancy metric exists. | §4.4 |
| RULE-INDICADORES-ETL-006 | Sector aggregate alert-colour decision tree | **OUT OF SCOPE** | — | Alert-rollup semantics belong to the alerts/severity reviewer (pointered in the forensic record). | — |
| RULE-INDICADORES-ETL-007 | `TotalAlerta` 4-bucket vs 3-bucket discrepancy | **DROP** (as-is) | — | A count bucket that exists in one surface and not others makes cross-surface totals non-reconcilable; the severity enum must be resolved before any count is defined. | — |
| RULE-INDICADORES-ETL-013 | Occupancy ETL watermark load | **DROP** (superseded) | — | ETL mechanics; the V2 ingestion architecture replaces it. | — |
| RULE-INDICADORES-ETL-014 | Macro-indicator ETL keeping only current month, history destroyed | **DROP** (rejected) | incompatible with VAL-0035 | A KPI store that destroys history cannot support any trend, baseline, or audit — structurally incompatible with the programme's baseline obligations. | — |
| RULE-INDICADORES-ETL-017 | Dashboard auto-reload interval | **OUT OF SCOPE** | — | Refresh cadence, not a KPI. | — |
| RULE-INDICADORES-ETL-018 | Recursive hierarchy roll-up shape (empresa > estabelecimento > setor) | **REDEFINE** | aggregation constraint for all KPIs | The hierarchy concept is retained; the shape must carry per-status categories at every node so no aggregate is more reassuring than its least-evaluated member (P-3/P-8). | KPIR-11 |
| RULE-INDICADORES-ETL-023 | Six macro-KPIs (`vidas_salvas`, `obitos`, `tempo_permanencia`, `tx_mortalidade`, `tx_ocupacao`, `admissao`) with no recorded formulas | **RESOLVIDO (GDEC-0007, K-8, MODIFICAÇÃO):** cinco nomes — `obitos`, `tempo_permanencia`, `tx_mortalidade`, `tx_ocupacao`, `admissao` — **DROP definitivo**; `vidas_salvas` **KEEP (redefinido)**, nome de missão/cultura preservado pelo titular | candidate macro set | Cinco nomes seguem sem fonte revisável (Tasy SOURCE NOT LOCATED) e sem valor clínico mensurável; `vidas_salvas` é preservado como KPI de missão institucional com definição mensurável nova e honesta (contagem, não alegação causal). | KPIR-14 (`vidas_salvas`); §4.5 (demais cinco, DROP) |
| RULE-DOCUMENTACAO-FATURAMENTO-019 | Evolution-note counts by type | **KEEP** (refined) | operational/documentation only | Honest empty case; legitimate documentation-operations count — with a hard ban on reading it as care quality or individual performance (NIU-06). | KPIR-12 |
| RULE-DOCUMENTACAO-FATURAMENTO-002 | "Glosa Zero" billing-documentation engine | **OUT OF SCOPE** | — | Pure billing mechanics; pointered to the billing/documentation reviewer. | — |

### 1.6 Decision tally

| Decision | Count | Entries |
|---|---|---|
| KEEP (refined) | 7 | KPI-DASH-01, KPI-DASH-04, KPI-EFF-03, KPI-OPS-01, RULE-DOCUMENTACAO-FATURAMENTO-019, KPI-PPV-01(d) resolution-label capture, `vidas_salvas`→**KPIR-14** (RULE-INDICADORES-ETL-023, partial — GDEC-0007 K-8 MODIFICAÇÃO) |
| REDEFINE | 9 | KPI-DASH-02, KPI-DASH-03, KPI-DASH-07, KPI-DASH-08, KPI-EFF-01, KPI-EFF-02, RULE-INDICADORES-ETL-001, RULE-INDICADORES-ETL-002, RULE-INDICADORES-ETL-018 |
| REDEFINE — CONDITIONAL | 5 | KPI-DASH-05, KPI-EFF-04, KPI-OPS-02, RULE-INDICADORES-ETL-005, KPI-IND catalogue-as-candidate-list (31 concepts, individually) — RULE-INDICADORES-ETL-023 is no longer in this row: resolved 2026-08-15 by GDEC-0007 K-8 (see KEEP and DROP rows) |
| DROP | 11 (+31 members as implemented) | KPI-DASH-06, KPI-EFF-05, KPI-IND mechanism, KPI-PPV-01(a)(b)(c), KPI-OPS-03, RULE-INDICADORES-ETL-007, -013, -014, plus `obitos`/`tempo_permanencia`/`tx_mortalidade`/`tx_ocupacao`/`admissao` (RULE-INDICADORES-ETL-023, partial — DROP definitivo per GDEC-0007 K-8); all 31 catalogue members as implemented (§5) |
| OUT OF SCOPE | 3 | RULE-INDICADORES-ETL-006, RULE-INDICADORES-ETL-017, RULE-DOCUMENTACAO-FATURAMENTO-002 |

Zero legacy computations are kept as implemented. Every KEEP is a rebuild with the
stated refinements; every REDEFINE discards the legacy arithmetic entirely. The one
exception to "zero legacy computations kept" remains true even after GDEC-0007:
KPIR-14 keeps only the **name** `vidas_salvas` (a titular's mission/culture decision)
— its measurable definition is new (§3, KPIR-14) and the legacy Tasy formula is not
imported in any form.

## 2. Shared definitional rules for every kept or redefined KPI

**PROPOSAL — these four rules apply to every KPIR block in §3 and are part of each
definition by reference.**

### 2.1 SM-03 computation rule (restated as the operative rule of this review)

Every KPI is computed **only over patient-time (or events) whose V2 evaluation
status is `valid`, or `partial` under an explicitly approved partial policy**
(`evaluation-status-semantics.md` §2, §3.2). Patient-time or events in
`not_evaluated`, `stale`, or `invalid` status are excluded from **both the numerator
and the denominator** — never pooled into either side, never silently dropped
(`success-and-harm-metrics.md` SM-03; `evaluation-status-semantics.md` §6
analytics obligation). Exclusion is by status at the clinically relevant time, with
status recomputed on read for time-dependent states (`stale`), never frozen at write.

### 2.2 The data-completeness companion metric (the DC rule)

**A KPI whose denominator silently shrinks is a new hazard**: excluding non-valid
patient-time without accounting for it converts the legacy false-green defect into a
false-denominator defect — precision-style gaming by "evaluating only easy
patient-time" (`success-and-harm-metrics.md` §4). Therefore:

1. **Every KPI in §3 is a pair, not a number.** For KPI `K`, a companion metric
   `DC(K)` is defined as: numerator — eligible patient-time (or events) excluded
   from `K` under §2.1, broken down by status (`partial`-without-policy,
   `not_evaluated`, `stale`, `invalid`) and by machine-readable reason; denominator —
   **all** eligible patient-time (or events), before any status exclusion. `DC(K)`
   is computed at the same aggregation levels and cadence as `K` and is displayed
   with equal prominence wherever `K` is displayed. Reporting `K` without `DC(K)` is
   a reporting defect (per the anti-gaming pairing rule).
2. **Minimum-completeness display floor.** Below a per-KPI minimum valid fraction
   (numeric value **VALIDATION REQUIRED — `AUTH-CLINSAFETY`**; no number proposed
   here), `K` renders as "insufficient valid data — n of N eligible" and never as a
   value. A system that evaluates 40% of patient-time with 95% precision has not
   achieved 95% precision.
3. **Denominator-shrink surveillance.** A downward drift in `DC(K)`'s valid fraction
   is itself an operational signal routed to the SM-05 coverage monitoring, because
   it is the observable trace of both data-pipeline failure and denominator gaming.

### 2.3 Server-side, statused, versioned computation

Per `evaluation-status-semantics.md` §6 ("status never inferred client-side") and
the forensic client-side findings (`kpi-inventory.md` §6): every V2 KPI is computed
server-side, over statused data, attributed to the versioned rule/metric definition
artifact that produced it. Zero-denominator cases render an explicit "no eligible
subjects" state — never 0%, never blank.

### 2.4 No default-met targets

No KPI carries a target until `AUTH-CLINSAFETY` ratifies one, and no target may ever
evaluate as "met" by default, on low n, or on absent data (`kpi-ppv-tracker.md`
finding (b); `success-and-harm-metrics.md` §0 rule 1). Absence of measurement is
rendered as absence of measurement.

## 3. Successor definitions for kept and redefined KPIs

All blocks: **PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).**
Update cadences and windows marked (p) are methodologist proposals requiring
ratification; none is adopted.

### KPIR-01 — Status-partitioned patient census (succeeds KPI-DASH-01 + KPI-DASH-04; decision: KEEP refined)

- **Numerator:** count of admitted, active patients at the snapshot instant, reported
  **partitioned by evaluation-status roll-up category**
  (`valid | partial | not_evaluated | stale | invalid`) and by unit, including an
  explicit `unit unassigned` bucket. Every active patient appears in exactly one
  status category and one unit bucket (P-8: no unevaluated subject omitted).
- **Denominator:** none — absolute count (census is itself the denominator
  infrastructure for SM-04/SM-05).
- **Exclusions:** none. Discharged/inactive patients leave the census on the ratified
  discharge anchor event (KPIR-09); no other exclusion is permitted.
- **Evaluation-status handling (SM-03):** the census is deliberately the one metric
  that does **not** exclude non-valid patient-time — it *partitions* by it. Its
  per-status categories are the primary data-completeness surface for every other
  KPI: `DC(K)` denominators for patient-level KPIs are read from this census.
- **Companion DC metric:** self-companioning — the status partition **is** the
  completeness metric. A census that cannot state its status partition must not
  render at all.
- **Aggregation:** bed → unit (with `unit unassigned`) → site → tenant, per KPIR-11.
- **Cadence:** computed on read (snapshot); status recomputed on read per §2.1.
- **Gaming/bias threats and mitigations:** denominator manipulation by
  discharging/"deactivating" patients from the cache without a clinical discharge —
  mitigate by binding census membership to ratified admission/discharge anchor
  events, not cache flags; omission of unassigned-unit patients — mitigated by the
  mandatory explicit bucket.
- **Baseline:** not baseline-bound (`kpi-bed-grid-dashboard.md` KPI-DASH-01 §6).

### KPIR-02 — Critical-patient count over assessable census (succeeds KPI-DASH-02; decision: REDEFINE)

- **Numerator:** active patients whose current evaluation has status `valid` (or
  `partial` under an approved policy) **and** severity `critical`, per the versioned
  V2 severity rule. Severity is readable only in those states
  (`evaluation-status-semantics.md` §2); there is no floor value and no default
  severity.
- **Denominator (displayed):** the **assessable census** — active patients with a
  `valid`/approved-`partial` current evaluation. Displayed jointly with KPIR-01's
  full census, never alone.
- **Exclusions:** patients outside the approved population/setting (they are
  `not_evaluated` with reason, per §3.3 of the status semantics, and appear in the
  companion — never silently missing).
- **Evaluation-status handling (SM-03):** patients in `not_evaluated`, `stale`, or
  `invalid` status are excluded from **both** numerator and denominator, and are
  rendered as their own counted categories **with equal display prominence** to the
  critical count (the mandatory display form is "N critical of M assessable; plus K
  not assessed / stale / invalid" — the K figure may never be visually subordinate).
  An unscored patient is never a non-critical patient.
- **Companion DC metric:** `DC(KPIR-02)` = non-assessable active patients / all
  active patients, by status and reason, from KPIR-01's partition.
- **Aggregation:** unit → site → tenant (KPIR-11 constraint applies).
- **Cadence:** computed on read; `stale` transitions recomputed on read, with the
  staleness→expiry→`not_evaluated` handover per status semantics §3.4.
- **Gaming/bias threats and mitigations:** *denominator manipulation* — evaluating
  fewer patients lowers the critical count; mitigated by the equal-prominence
  companion and SM-05 coverage surveillance (§2.2.3). *Surveillance bias* — the
  count rises with measurement frequency, not only acuity; mitigated by reporting
  evaluation cadence alongside and by trend interpretation rules at ratification.
  *Staleness immortality* — an old score banding a bed forever; mitigated by the
  expiry horizon (clinical parameter, VALIDATION REQUIRED).
- **Baseline: PRE-DEPLOYMENT-ONLY — joins G2-VAL-0025 / VAL-0035** (§7): the pre-V2
  acuity/alarm display environment is part of the baseline study scope and is
  unrecoverable after deployment.

### KPIR-03 — Alert burden per patient-day (succeeds KPI-DASH-03; decision: REDEFINE; target shape: SM-04)

- **Numerator:** count of user-visible work items (alerts) **created** in the
  reporting window, split by severity, unit, shift, and originating rule version
  (all four splits are mandatory per SM-04). Suppressed, cooled-down, and
  deduplicated would-be alerts are counted in a separate, equally reported
  suppression series with machine-readable reasons (P-5/SAF-0019) — never silently
  absent.
- **Denominator:** occupied patient-days in the window **partitioned by evaluation
  status**; the headline rate divides by *evaluated* patient-days (status
  `valid`/approved-`partial` for the alerting rules in scope). Patient-day
  construction uses the ratified day-boundary convention (§4.3 — blocked until
  confirmed) and KPIR-09 anchors.
- **Exclusions:** none beyond §2.1. An alert is never removed from the numerator by
  later resolution status; burden measures what clinicians experienced.
- **Evaluation-status handling (SM-03):** unevaluated/stale/invalid patient-days are
  excluded from both sides and reported via `DC(KPIR-03)`; zero alerts over
  unevaluated patient-time is rendered as "not evaluated", never as zero burden
  (P-5: no-fire visibility — zero alerts must be distinguishable from zero
  evaluation).
- **Companion DC metric:** `DC(KPIR-03)` = non-evaluated occupied patient-days /
  all occupied patient-days, by status and reason.
- **Aggregation:** unit → site → tenant; per severity; per rule version; per shift.
- **Cadence (p):** daily aggregate, weekly and monthly roll-ups; no real-time target
  display.
- **Gaming/bias threats and mitigations:** *downward gaming by suppression/cooldown*
  (anti-gaming table: SM-04 vs HM-04/HM-03) — mitigated by the mandatory suppression
  series and no-fire reasons; *rule-version confounding* — mitigated by mandatory
  per-version attribution; *denominator inflation* by counting unevaluated
  patient-days — excluded by construction.
- **Baseline: PRE-DEPLOYMENT-ONLY — joins G2-VAL-0025 / VAL-0035** (§7): alert
  burden is explicitly in VAL-0035's unobtainable-after-deployment list; the
  baseline must cover the clinician's **total** alarm environment, not V2's share.

### KPIR-04 — Deterioration-score trend (succeeds KPI-DASH-07; decision: REDEFINE)

- **Form:** patient-level derived display value, not a ratio. Inputs: the statused
  score series of one score type for one patient over a declared window.
- **Numerator/denominator:** n/a (patient-level derived indicator); the population
  companion below is the ratio form.
- **Computation (p, starting sketch only — not an approved method):** direction and
  magnitude over a declared window with minimum sample count and a fit-quality
  floor, per the pattern of the legacy `deterioration_trend.py` constants block
  (12 h window, minimum 3 points, explicit "sem dado, sem previsão"), which the
  forensic record identifies as the better-specified alternative already present in
  the legacy repo. Exact window, minimum n, and method: VALIDATION REQUIRED.
- **Exclusions:** scores whose evaluation status is not `valid`/approved-`partial`
  are excluded from the series; a series mixing statuses does not silently degrade —
  it either satisfies the valid-sample minimum or renders the insufficient-data
  state.
- **Evaluation-status handling (SM-03):** below minimum valid samples, the output is
  an explicit `insufficient data` state — never a default direction, never `stable`.
  not_evaluated/stale/invalid scores never enter the series (both "numerator" and
  the sample count that acts as denominator).
- **Companion DC metric:** `DC(KPIR-04)` = proportion of assessable patients for
  whom a trend is computable (valid series ≥ minimum n) — surfacing how much of the
  unit the trend display actually covers.
- **Aggregation:** patient (display); unit-level computability rate via the
  companion.
- **Cadence:** recomputed on new valid score and on read (staleness re-check).
- **Gaming/bias threats and mitigations:** *endpoint sensitivity* (single artifactual
  reading flips a two-point trend) — mitigated by the multi-point fit and quality
  floor; *surveillance bias* (more frequent scoring manufactures "trends") —
  mitigated by reporting the sampling cadence with the trend and by the window rule.
- **Baseline:** not baseline-bound.

### KPIR-05 — Evaluation coverage and staleness (succeeds KPI-DASH-08; decision: REDEFINE; target shape: SM-05)

- **Numerator:** monitored patient-time in each evaluation status
  (`valid | partial | not_evaluated | stale | invalid`), per rule version, computed
  server-side from **source clinical time** against the trusted evaluation clock —
  never from receipt/sync time (`evaluation-status-semantics.md` §3.4; the legacy
  `synced_at` fallback is banned by name).
- **Denominator:** total monitored patient-time in the window (every monitored
  patient-time interval is in exactly one status — the partition is exhaustive by
  construction, so this metric has no silent-shrink mode).
- **Exclusions:** none — this is the one metric family computed over *all*
  patient-time; it is the ledger the SM-03 rule reports non-valid time into.
- **Evaluation-status handling:** KPIR-05 **is** the generalized companion metric:
  every `DC(K)` in this document is a view of KPIR-05 restricted to `K`'s
  eligibility window and population. Its second component (SM-05's fidelity part) —
  count of non-`valid` states rendered in reassuring visual vocabulary — is a hazard
  metric with target zero, owned by the hazard log (HM-03(b)).
- **Companion DC metric:** self-companioning (exhaustive partition).
- **Aggregation:** patient → unit → site → tenant; per rule version; per input
  stream.
- **Cadence:** continuous accumulation; displayed staleness recomputed on read;
  reported (p) daily/weekly.
- **Gaming/bias threats and mitigations:** *coverage gaming by coercing incomplete
  data to `valid`* (anti-gaming table SM-05 row) — mitigated by the absent-input
  probe (SAF-0002 blocking gate) and P-1/P-7 prohibitions; *freshness-window
  relaxation* to reduce apparent staleness — mitigated by windows being versioned
  clinical parameters requiring `AUTH-CLINSAFETY` change control.
- **Baseline:** not baseline-bound (V2-internal telemetry; but see §7 note — it can
  only ever describe V2, never the pre-V2 state).

### KPIR-06 — Transfusion stewardship audit (succeeds KPI-EFF-01; decision: REDEFINE)

- **Unit of analysis:** the transfusion episode (one administration event), not the
  patient-day.
- **Numerator (per criterion):** transfusion episodes in which criterion `c` was
  evaluated with status `valid` **and** met. Reported **per criterion** — the
  composite "appropriate" verdict and any aggregate cutoff (the legacy 8/12) are
  suspended until `AUTH-CLINSAFETY` ratifies an aggregate rule; no composite is
  computed before that.
- **Denominator (per criterion):** transfusion episodes in which criterion `c` was
  evaluable with status `valid` (all inputs the criterion requires were present,
  fresh, and plausible).
- **Exclusions:** episodes outside the ratified stewardship protocol scope (e.g.
  massive-transfusion protocol activations, if so ratified) — exclusion list itself
  VALIDATION REQUIRED; every exclusion counted and reported, never silent.
- **Criterion content:** the twelve criterion *themes* (restrictive threshold,
  single-unit strategy, reaction monitoring, documentation, infusion timing) enter
  redefinition; **TF-002's direction must be resolved under clinical review before
  it is specified** — as implemented, a transfusion at Hb at or above the
  restrictive trigger *raised* the appropriateness score; **TF-003 and TF-006
  absence-as-compliance defaults are banned** (absent units documentation or absent
  reaction record → criterion status `not_evaluated`, never met).
- **Evaluation-status handling (SM-03):** an episode with missing inputs for
  criterion `c` is excluded from both numerator and denominator of `c` and counted
  in `DC` by reason (e.g. `missing:pre_transfusion_hb`). Documentation completeness
  is itself clinically meaningful here, so the companion is a first-class
  stewardship output, not a footnote.
- **Companion DC metric:** `DC(KPIR-06)` = per criterion, non-evaluable episodes /
  all episodes, by missing-input reason — the documentation-completeness profile of
  transfusion practice.
- **Aggregation:** episode → unit → site; monthly.
- **Cadence (p):** monthly audit cycle; not a real-time display.
- **Gaming/bias threats and mitigations:** *denominator manipulation via
  documentation* (only well-documented episodes enter per-criterion denominators —
  under-documenting hides non-compliance) — mitigated by the mandatory DC companion
  with a completeness floor (§2.2.2) and by sourcing episode existence from
  blood-bank issue records rather than bedside documentation (feasibility
  VALIDATION REQUIRED); *criterion cherry-picking* (permanently failing some
  criteria while a composite reads "appropriate") — mitigated by suspending the
  composite and reporting per criterion.
- **Baseline:** ⏱ retrospective baseline possible from blood-bank/EHR records,
  subject to `AUTH-PRIVACY-LEGAL` + `AUTH-CLINSAFETY`; not pre-deployment-only.

### KPIR-07 — Mechanical-restraint monitoring (succeeds KPI-EFF-02; decision: REDEFINE)

- **Unit of analysis:** the restraint episode, modelled on explicit start/stop/
  reassessment events (the legacy vestigial state machine — dead `elif`, unreachable
  states — is not imported; a real episode data model is a precondition).
- **Numerator (two paired rates):** (a) restraint episodes with documented duration
  within the ratified limit; (b) restraint-days with a documented reassessment.
  The 4-hour limit is carried as the legacy value pending ratification, not adopted.
- **Denominator:** (a) restraint episodes with `valid` duration data (documented
  start and end/ongoing marker); (b) restraint-days with `valid` reassessment-status
  data.
- **Exclusions:** none beyond §2.1; contraindicated/planned states, if ratified into
  the model, are separate categories, not exclusions.
- **Evaluation-status handling (SM-03):** an untracked or partially documented
  restraint episode is `not_evaluated` and excluded from both sides — **an
  undocumented restraint is never compliant** (the legacy `duration_hours=0 →
  within-limit` default is banned). Excluded episodes surface in `DC` by reason.
- **Companion DC metric:** `DC(KPIR-07)` = restraint episodes (and restraint-days)
  with missing/invalid documentation / all detected episodes, by reason. Because
  undocumented restraint is itself a safety concern, a rising DC is escalated, not
  merely reported.
- **Aggregation:** episode → unit → site; monthly.
- **Cadence (p):** daily reassessment series; monthly audit roll-up.
- **Gaming/bias threats and mitigations:** *episode under-detection* (restraints
  that generate no record at all vanish from both K and DC) — mitigation requires an
  independent detection channel (e.g. nursing-record cross-check or unit safety
  rounds; design VALIDATION REQUIRED — this residual bias cannot be closed by
  computation alone and must be stated wherever the KPI is displayed);
  *documentation-driven denominator manipulation* — same DC-floor mitigation as
  KPIR-06.
- **Baseline:** ⏱ retrospective possible; not pre-deployment-only.

### KPIR-08 — Frailty assessment and coverage (succeeds KPI-EFF-03; decision: KEEP refined)

- **Patient-level display:** frailty category from the documented scale score, with
  **per-scale banding logic** (the legacy CFS integer bands applied to any scale is
  banned; an mFI value through CFS bands is nonsense per the forensic record) and
  the preserved explicit not-assessed state ("não avaliada", `assessed: false`) —
  the single honest legacy pattern, kept by name. pt-BR band labels: VALIDATION
  REQUIRED with pt-BR clinicians.
- **Coverage KPI numerator:** admissions with a `valid` frailty assessment within
  the ratified window from admission (window (p): 48 h — VALIDATION REQUIRED).
- **Denominator:** admissions in the eligible population (eligibility rule — e.g.
  age threshold — VALIDATION REQUIRED).
- **Exclusions:** admissions shorter than the assessment window (censoring rule to
  be ratified; excluded admissions counted in DC).
- **Evaluation-status handling (SM-03):** unassessed patients are excluded from any
  frailty-distribution statistic (both sides) and appear as the explicit
  not-assessed category on every display and in the coverage complement; an absent
  score never defaults to any band.
- **Companion DC metric:** the coverage KPI is itself the completeness metric for
  the display; `DC` additionally splits non-assessment by reason
  (not documented vs invalid scale value vs out-of-population).
- **Aggregation:** patient (display); unit/site monthly (coverage).
- **Cadence:** on read (display); monthly (coverage).
- **Gaming/bias threats and mitigations:** *coverage gaming by low-quality bulk
  scoring* — mitigated by pairing coverage with score-distribution review at audit;
  *scale mixing* — banned by the per-scale guard.
- **Baseline:** ⏱ retrospective possible; not pre-deployment-only.

### KPIR-09 — Length of stay (succeeds KPI-OPS-01; decision: KEEP refined)

- **Form:** per-stay duration = discharge anchor − admission anchor, in fractional
  days, computed in the ratified site timezone (América/São Paulo assumed —
  VALIDATION REQUIRED with the site; the legacy UTC whole-day truncation is banned:
  it undercounts systematically and shifts day boundaries).
- **Numerator (aggregate):** sum of completed-stay durations in the reporting
  window (or median/percentiles — reporting statistics (p): median and IQR, not
  mean alone).
- **Denominator:** completed stays discharged in the window with `valid` admission
  **and** discharge anchors.
- **Exclusions:** stays with missing/implausible anchors (→ `not_evaluated` /
  `invalid`, excluded both sides, counted in DC); still-admitted patients are
  **not** pooled into completed-stay statistics (see immortal-time threat below) —
  they are reported as a separate census-linked open-stay series.
- **Evaluation-status handling (SM-03):** an absent admission timestamp never yields
  a zero-day stay (legacy `days=0` default banned); anchor-missing stays are
  excluded from both sides and surfaced in `DC(KPIR-09)` by reason.
- **Companion DC metric:** stays with missing/invalid anchors / all stays ended in
  window.
- **Aggregation:** stay → unit → site; monthly.
- **Cadence (p):** monthly, with rolling median for operational review.
- **Gaming/bias threats and mitigations:** *immortal-time / censoring bias* —
  computing LOS only over completed stays understates during rising occupancy and
  excludes long-stayers still in the unit; mitigated by publishing the open-stay
  series (count and current durations) alongside, and by survival-analysis methods
  at formal review (method choice VALIDATION REQUIRED); *anchor manipulation*
  (administrative re-admission splitting a long stay) — mitigated by defining the
  stay over ratified clinical admission/discharge events, with transfer rules made
  explicit at ratification.
- **Baseline:** ⏱ retrospective possible from EHR; not pre-deployment-only.

### KPIR-10 — Sector severity-share and assisted-share (succeeds RULE-INDICADORES-ETL-001/-002; decision: REDEFINE)

- **Numerator:** per sector, count of patients whose current `valid`/
  approved-`partial` evaluation places them in severity class `s` (share metric);
  count of patients under active assistance among those with qualifying alert
  states (assisted-share) — assistance semantics per the alerts reviewer's scope.
- **Denominator:** patients in that sector with `valid`/approved-`partial` current
  evaluations (assessable sector census, from KPIR-01). The legacy denominators
  (raw alert-colour counts, client-side) are not imported.
- **Exclusions:** per §2.1 only.
- **Evaluation-status handling (SM-03):** unevaluated/stale/invalid patients are in
  neither side; a sector with zero assessable patients renders "no assessable
  patients", **never 0%** (the legacy zero-total → 0% artifact, and the catalogued
  assisted-share edge case where assisted patients with no yellow/red alerts render
  0%, are both banned). An unevaluated sector is visually distinct from a
  quiet sector.
- **Companion DC metric:** `DC(KPIR-10)` = non-assessable patients / all patients,
  per sector — displayed on the same card.
- **Aggregation:** sector → establishment → company, under the KPIR-11 constraint.
- **Cadence:** computed server-side on read.
- **Gaming/bias threats and mitigations:** *denominator manipulation by
  non-evaluation* — equal-prominence DC display; *cross-surface non-reconcilability*
  (legacy 3-vs-4 severity bucket discrepancy, RULE-INDICADORES-ETL-007) — mitigated
  by a single ratified severity enum shared by every count in V2.
- **Baseline: PRE-DEPLOYMENT-ONLY for the alert-share family — joins G2-VAL-0025 /
  VAL-0035** (§7): sector alert counts belong to the alert-burden baseline family.

### KPIR-11 — Hierarchy roll-up constraint (succeeds RULE-INDICADORES-ETL-018; decision: REDEFINE; a constraint, not a metric)

- **Statement:** the empresa > estabelecimento > setor roll-up concept is retained.
  Every aggregate at every node **must** carry the per-status categories of its
  members, computed such that: no aggregate is more reassuring than its
  least-evaluated member (P-3); no subject is omitted from any level (P-8); and the
  status partition sums exactly to the census at every node (reconciliation is a
  releasable invariant test, not a report).
- **Evaluation-status handling:** aggregates never average away status — they
  partition by it. A node's headline figure is accompanied by its DC figures at the
  same visual level.
- **Threats and mitigations:** *roll-up laundering* (a reassuring parent node hiding
  an unevaluated child) — prevented by the P-3 invariant test; *silent membership
  loss* (the legacy null-unit drop generalized) — prevented by the exhaustive
  partition requirement.
- **Baseline:** n/a.

### KPIR-12 — Evolution-note counts by type (succeeds RULE-DOCUMENTACAO-FATURAMENTO-019; decision: KEEP refined)

- **Numerator:** count of evolution notes of type `t` authored in the window.
- **Denominator:** none (absolute count with honest zero — the legacy honest empty
  case is kept).
- **Exclusions:** none; notes with unclassifiable type are counted in an explicit
  `unclassified` bucket, not dropped.
- **Evaluation-status handling:** operational count over documentation events; the
  SM-03 patient-time rule does not apply, but the unclassified bucket plays the DC
  role: `DC(KPIR-12)` = unclassified notes / all notes.
- **Aggregation:** unit → site; per period.
- **Cadence (p):** daily/monthly operational reporting.
- **Hard use restriction:** documentation-operations metric **only**. It must never
  be displayed as, or adjacent to, care quality, and never used for individual
  performance management (`non-intended-uses.md` NIU-06 ban, carried from the
  forensic verdict). Any per-clinician breakdown is out of scope of this review and
  would require its own governance decision.
- **Gaming/bias threats and mitigations:** note-count inflation by fragmenting
  documentation — mitigated by the use restriction (nothing is optimized against
  this count) and audit-only cadence.
- **Baseline:** not baseline-bound.

### KPIR-13 — Alert-resolution feedback capture (succeeds KPI-PPV-01(d); decision: KEEP refined; a data capture, not an outcome metric)

- **Captured record:** at alert resolution — a label from a **validated closed
  enum** (invalid strings rejected at the API boundary, unlike the legacy tracker
  which counted junk strings into denominators), the named resolving user, the
  timestamp, the alert identifier, and the originating rule version. Label taxonomy
  (whether `intervention_done` remains a distinct label) — VALIDATION REQUIRED.
- **Derived process metric — feedback-labelling rate.** Numerator: alerts resolved
  with a feedback label in the window. Denominator: **all** alerts created in the
  window (not only resolved ones — the legacy resolved-only denominator is banned).
- **Exclusions:** none; unresolved and abandoned alerts remain in the denominator
  as their own categories — their share is itself informative (they are plausibly
  the least useful alerts).
- **Evaluation-status handling (SM-03):** alerts fired during non-`valid`
  patient-time are tabulated separately per §6; the feedback rate itself is a
  V2-internal process metric (instrumented telemetry — "valid only for V2-internal
  facts, never for clinical truth").
- **Companion DC metric:** unresolved + unlabelled-resolved shares, by category.
- **Hard use restriction:** feedback labels are a signal for adjudication sampling
  and rule-improvement triage. **They are never ground truth, never enter any PPV
  or precision figure, and never stand in for adjudicated outcomes** (HM-01:
  dismissal-as-ground-truth makes fatigue appear as improved precision).
- **Aggregation:** rule version → unit → site; weekly (p).
- **Gaming/bias threats and mitigations:** *reflexive labelling* under workload —
  mitigated by the use restriction (labels drive sampling, not scores);
  *selection bias* — mitigated by the all-alerts denominator.
- **Baseline:** the capture is V2-internal (post-deployment by nature); the
  precision/fatigue **baselines** its successor studies depend on are
  pre-deployment-only (§6, §7).

### KPIR-14 — Altas vivas da UTI ("vidas_salvas") (succeeds part of RULE-INDICADORES-ETL-023; decision: K-8 MODIFICAÇÃO — GDEC-0007 — KEEP, redefinido)

**PROPOSAL — AWAITING NAMED CLINICAL REVIEW on the numeric/procedural details below;
the KEEP decision itself and the mission/culture name are already DECIDED**
(`docs/00-governance/registers/decision-register.md` GDEC-0007, §8 K-8). The name
`vidas_salvas` is the titular's decision, preserved for institutional mission and
culture; the measurable definition below is what this KPI actually computes, and it
is new — nothing of the legacy Tasy formula is imported. Of the six legacy
macro-KPI names, the other five (`obitos`, `tempo_permanencia`, `tx_mortalidade`,
`tx_ocupacao`, `admissao`) remain **DROP definitivo** — see §4.5.

- **Numerator:** count of ICU episodes (encounters) ending in discharge alive from
  the ICU in the reporting period.
- **Denominator:** none — this is an absolute count, like KPIR-01/KPIR-12, **always
  displayed jointly with two companion figures at equal prominence** (never as a
  rate, a percentage, or a ratio of any kind):
  1. total ICU discharges in the same period (alive + dead);
  2. ICU deaths in the same period.

  This triad is what forecloses reading "altas vivas" as a rate improving over time,
  or as a proportion of anything — it is a count, displayed next to the two counts
  that give it context.
- **Exclusions:** none beyond §2.1; episodes with a missing or implausible discharge
  anchor are `not_evaluated`/`invalid`, excluded from the count, and surfaced in
  `DC(KPIR-14)` by reason. No episode is ever defaulted into "alive" or "dead" from
  absent data.
- **Anchors:** the discharge event is the **documented** ICU-discharge timestamp, in
  the ratified site timezone, under the civil-day convention decided at K-6 (§8) and
  the KPIR-09 admission/discharge anchor rules — never an administrative, billing, or
  bed-management timestamp.
- **Evaluation-status handling (SM-03):** an ICU episode without a `valid` discharge
  anchor, or without a `valid` alive-vs-dead disposition at discharge, is excluded
  from the count on both the numerator and both companion figures, and counted in
  `DC(KPIR-14)` by reason — never silently pooled into either outcome.
- **Companion DC metric:** `DC(KPIR-14)` = ICU episodes closed in the period with a
  missing/invalid discharge anchor or a missing/invalid alive-vs-dead disposition /
  all ICU episodes closed in the period, by reason — displayed with equal prominence
  to the three headline counts, per the §2.2 DC rule.
- **Aggregation:** unit → site → tenant; per period (monthly default (p) —
  VALIDATION REQUIRED), under the KPIR-11 hierarchy constraint (no aggregate more
  reassuring than its least-evaluated member).
- **Cadence (p):** monthly; the two companion figures are computed and displayed at
  the same cadence and the same visual level — never delayed or demoted relative to
  the headline count.
- **Honesty note — recorded as part of this definition, not a caveat placed
  elsewhere:** "contagem de altas vivas — não é atribuição causal de vidas salvas
  pelo sistema." KPIR-14 counts a clinical outcome (discharge alive from the ICU); it
  is not an effect estimate, not a counterfactual, and not a comparison to any
  baseline, expected-mortality model, or pre-V2 rate. It must never be displayed,
  cited, or reported as evidence that the system "saved" the counted number of
  patients.
- **Sub-decisions — VALIDATION REQUIRED (`AUTH-CLINSAFETY`), not yet closed by
  GDEC-0007:**
  1. **Transfer-out-to-other-ICU handling** — whether a transfer to another ICU
     (intra- or inter-facility) counts as a discharge-alive event, a censored/
     excluded episode, or its own category. No default is adopted here.
  2. **Readmission de-duplication window** — whether, and over what window, a
     readmission to the same ICU is treated as a new episode (which would count the
     same patient twice as "altas vivas") or linked back to a prior episode. No
     default window is adopted here.

  Until both close, KPIR-14 may be computed and displayed only with these two gaps
  disclosed alongside it, never silently defaulted either way.
- **Gaming/bias threats and mitigations:** *denominator-free inflation* — because
  KPIR-14 has no denominator of its own, the two equal-prominence companion figures
  (total discharges, deaths) are mandatory specifically to prevent the count from
  being read in isolation as an improving rate without context; *transfer-out
  gaming* — transferring unstable patients out before death could inflate the count
  under an unfavourable default on sub-decision 1, which is exactly why no default is
  adopted here; *readmission double-counting* — mitigated only once sub-decision 2
  closes.
- **Baseline:** not on the pre-deployment-only list of §7.1 (it is a clinical outcome
  count, not an alert/alarm-burden or fatigue metric); retrospective reconstruction
  from discharge records is possible in principle (⏱), subject to
  `AUTH-PRIVACY-LEGAL` + `AUTH-CLINSAFETY`.

## 4. REDEFINE — CONDITIONAL entries: what must be closed, and by whom

All entries: **PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).**
No successor definition is written for these — writing one now would launder an
unvalidated constant or an unlocatable formula into a "definition". Each lists the
validation that unblocks it. Until closed, the concept is **not kept**.

### 4.1 KPI-DASH-05 — NEWS2 risk banding
**VALIDATION REQUIRED (`AUTH-CLINSAFETY`):** (a) ratify the banding against the
published NEWS2 trigger levels as a versioned rule artifact; (b) set per-input
freshness and expiry windows (no "latest score regardless of age"); (c) bind display
to evaluation status per §2.1. The upstream missing-component scoring defect is the
scores reviewer's scope; this KPI may not ship while its input can be computed from
absent components contributing zero.

### 4.2 KPI-EFF-04 — ICU LOS outlier
**VALIDATION REQUIRED (`AUTH-CLINSAFETY` + site operations):** benchmark source,
outlier multiplier (legacy 1.5× and 14-day fallback are unreferenced), and case-mix/
severity adjustment method. Depends on KPIR-09 anchors. Absent admission data maps
to `not_evaluated` — the legacy zero-days-is-within-expected default is banned
regardless of the eventual definition.

### 4.3 KPI-OPS-02 — Clinical/reporting day boundary
**VALIDATION REQUIRED (site operations + `AUTH-CLINSAFETY`):** confirm whether the
7-to-7 convention is the site's real operational day, fix the timezone explicitly,
and implement it **once**. Blocking dependency for every per-day KPI in §3
(KPIR-03 patient-days, KPIR-07 restraint-days, KPIR-12 periods). The legacy UTC vs
process-local disagreement is recorded as the cautionary case.

### 4.4 RULE-INDICADORES-ETL-005 — Occupancy metric and display thresholds
**VALIDATION REQUIRED:** the occupancy formula itself is SOURCE NOT LOCATED
(`kpi-operational-time-and-etl-rules.md` §4) — a V2 occupancy metric must be defined
from scratch (numerator, denominator, bed-state model) before any display threshold
is discussed; the 70/50 colour thresholds are unreferenced constants and are not
carried.

### 4.5 RULE-INDICADORES-ETL-023 — The six macro-KPI names — RESOLVED 2026-08-15 (GDEC-0007, K-8 MODIFICAÇÃO)
**Was VALIDATION REQUIRED; the titular decided K-8 as a MODIFICATION of the agent's
recommendation** (`decision-register.md` GDEC-0007, §8 below). Of the six names
(`vidas_salvas`, `obitos`, `tempo_permanencia`, `tx_mortalidade`, `tx_ocupacao`,
`admissao`), five — `obitos`, `tempo_permanencia`, `tx_mortalidade`, `tx_ocupacao`,
`admissao` — are **DROP definitivo**: their formulas live in unmounted upstream Tasy
Oracle objects (**SOURCE NOT LOCATED — cannot review**), and no V2-native successor
is defined for any of them; they do not re-enter without a fresh decision. The
sixth, `vidas_salvas`, is **KEPT** as a mission/culture display name (titular's
decision) and **redefined** with a new, measurable, non-causal definition:
**KPIR-14 "Altas vivas da UTI"** (§3). The legacy Tasy formula for `vidas_salvas` is
not imported in any form — only the name survives, carrying a wholly new
computation. Residual VALIDATION REQUIRED items for KPIR-14 (not closed by K-8) are
listed in its §3 block: transfer-out-to-other-ICU handling, readmission
de-duplication window, cadence ratification, and monthly aggregation window.

### 4.6 The 31 catalogue concepts
Individually eligible for re-entry through this review's redefine path — see §5.3.

## 5. The fabricated-indicators finding — 31 clinical indicators served as random values

**OBSERVED (from `kpi-indicators-catalogue.md` §1, quoted):** every indicator's
`current_value` was `random.random()` scaled **inside its own target reference
range**; `trend` was a random choice; `history` was 30 mock points with deliberate
~10% out-of-range "spikes for realism"; the summary's `alerts_out_of_range` was a
fresh random draw, not a comparison of any value to any target. All endpoints
required authentication. **Nothing in any response marked the data as mock.** No
frontend-v3 consumer was located, so the display surface was the authenticated API
plus any external client. Tests asserted structure, pagination, and auth — no test
related any served value to any data.

### 5.1 Clinical-governance implications

1. **Fabricated clinical quality data was served to authenticated users in clinical
   vocabulary** (SMR, PAV/1000 VM-day, IPCS). By construction the values were
   almost always inside target — a *designed* false-green, stronger than the
   HAZ-0005 unscored-as-normal pattern because the reassurance was not even derived
   from absent data; it was invented inside the target band.
2. **Institutional-trust consequence:** any historical report, screenshot, export,
   or decision that ever cited these endpoints is evidence of nothing. If any such
   figure reached quality committees or external reporting, that is a governance
   incident for the *legacy* operator to assess; V2 inherits only the obligation to
   ensure the mechanism is unrepeatable.
3. **The catalogue's targets are unreferenced constants.** Even the *metadata*
   (e.g. "< 2.5/1000 CVC-dia") carries no citation and confers no validity.

### 5.2 Why all 31 must be treated as never-implemented

For every member: numerator — none; denominator — none; exclusions — none; time
window — none; data path — none (`kpi-indicators-catalogue.md` §2). A metric is its
measurement procedure, and none exists. Therefore **all 31 are dropped as
implemented — there is nothing to keep, refine, or transform**; "porting" any part
of the serving mechanism, seeded history, or summary logic is prohibited. The
*names* are recognizable ICU quality indicators, so the catalogued **concepts**
(the 31 rows tabulated with baseline flags in `kpi-indicators-catalogue.md` §3,
ind-tlp-001 through ind-other-003) remain individually eligible to re-enter through
this review's redefine path only.

### 5.3 Re-entry conditions (per concept, individually)

A catalogue concept re-enters only when a named clinical owner sponsors it with:
(a) a full definition block in the §3 format — numerator, denominator, exclusions,
SM-03 status handling, DC companion, aggregation, cadence, gaming threats;
(b) a **referenced** target source (published benchmark or surveillance definition
— e.g. the national/CDC-style surveillance definitions their pt-BR names imply —
cited, not asserted); (c) a data path that actually measures it; (d) baseline
classification per §7 (ind-safe-001, ind-safe-003, ind-other-003 are
pre-deployment-only 🚩; the remaining 28 are ⏱ retrospectively reconstructable in
principle, pending `AUTH-PRIVACY-LEGAL` + `AUTH-CLINSAFETY`); and (e) passage of
the absent-input probe (SAF-0002). Priority order among the 31 is a clinical-value
judgement: VALIDATION REQUIRED — this review proposes no ranking.

### 5.4 The safety lesson (recorded so it is never re-learned)

The legacy failure mode was not a missing feature; it was **a metric surface with
no obligation to be true**. The V2 controls that make it unrepeatable, all already
in the normative frame: a metric endpoint that has no measurement must say so
(`success-and-harm-metrics.md` §0 rule 3 — unmeasurable is recorded, not
synthesized); no clinical value exists without a status field (P-2/SAF-0001); no
random or synthetic generation in any clinical data path outside explicitly marked
test fixtures, enforced in CI; and the absent-input probe as a blocking gate
(SAF-0002/SAF-0030). The deepest lesson is epistemic: **authentication and a
clinical vocabulary give a number authority it has not earned** — which is why
every V2 KPI carries provenance (rule version, inputs, status) to its display
surface.

## 6. PPV / alert-precision redesign (succeeds KPI-PPV-01(a); per SM-03)

**PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).** The
legacy tracker is superseded whole; this is the replacing design, per
`success-and-harm-metrics.md` SM-03/HM-01/HM-02.

1. **Denominator: all work items.** Every user-visible alert enters the evaluation
   denominator at creation — resolved or not, labelled or not. Unresolved and
   abandoned alerts are strata, never exclusions (the legacy feedback-resolved-only
   denominator is the "evaluating only easy patient-time" gaming mode by
   construction).
2. **Independent adjudication is the only ground truth.** True/false-positive
   status is assigned by a blinded adjudication panel against the **pre-registered**
   deterioration definition and rubric (G2-VAL-0024), with inter-rater agreement
   reported. Clinician resolution labels (KPIR-13) select and prioritize cases for
   adjudication; they never substitute for it. Clinician action is never evidence
   of alert correctness (`intervention_done`-as-TP is banned; HM-01).
3. **Compute only over valid patient-time.** Precision (and, in shadow mode,
   recall) is computed over alerts raised during `valid`/approved-`partial`
   patient-time; alerts raised during other statuses, and patient-time in
   `partial`/`not_evaluated`/`stale`/`invalid`, are reported as separate
   denominators per the SM-03 rule — excluded from both numerator and denominator
   of the headline figure and surfaced via the DC companion (a precision claim is
   always accompanied by the coverage over which it holds).
4. **Minimum-n before display; no assume-green, ever.** No precision figure is
   displayed below a pre-registered minimum adjudicated count (numeric value
   VALIDATION REQUIRED — `AUTH-CLINSAFETY`); below it the display reads
   "insufficient adjudicated data — n of N required". No target may default to
   "met" at any n, including zero (§2.4). The legacy assume-OK-below-10 logic is
   the recorded anti-pattern.
5. **Attribution and pairing.** Reported per rule version, per severity, per unit,
   and per pre-registered subgroup (HM-06); always published jointly with HM-04
   (missed deterioration, by failure mode) and SM-05 coverage, per the anti-gaming
   pairings — precision alone is not reportable.
6. **Persistence and audit.** Adjudications and computed figures are durable,
   versioned records (never in-memory process-lifetime counters); every figure is
   reproducible from its stored inputs.
7. **Fatigue is measured as HM-02**, the four-component composite (dismissal drift,
   latency drift, validated pt-BR instrument, bulk-dismissal rate) against the
   clinician's **total** alarm environment — not any FP-share.
8. **Study sequencing.** Retrospective adjudicated study, then prospective
   shadow/silent mode (recall is measurable without treatment-effect contamination
   only there), then live surveillance — each requiring `AUTH-CLINSAFETY`,
   `AUTH-PRIVACY-LEGAL` (NIU-07 lawful basis), and the G2-VAL-0026 site/ethics
   route. **The fatigue and total-alarm baselines are pre-deployment-only (§7).**

## 7. Baseline timing

### 7.1 Pre-deployment-only baselines (join G2-VAL-0025 / VAL-0035 — PERMANENTLY LOST after go-live)

This subsection is the citable list for the cycle handoff. Per
`docs/05-clinical-safety/pathway-portfolio/g2-validation-backlog.md` G2-VAL-0025
("THE ONE IRREVERSIBLE ITEM") and
`docs/02-users-and-workflows/g1-validation-backlog.md` VAL-0035 ("Baselines are
unobtainable once V2 is deployed"):

| # | KPI (this review) | What must be measured before any deployment |
|---|---|---|
| 1 | KPIR-02 critical-patient count | Pre-V2 acuity/alarm display environment of the unit (distribution of the critical census under current practice) |
| 2 | KPIR-03 alert burden (SM-04) | Total existing alarm/alert burden per patient-day — explicitly in VAL-0035's unobtainable list; must cover the whole alarm environment, not a V2 share |
| 3 | KPIR-10 sector severity/alert-share family | Sector-level alert counts and shares (same alert-burden family) |
| 4 | §6 precision/fatigue successors of KPI-PPV-01 (SM-03, HM-02) | Pre-V2 alert fatigue (validated instrument), total alarm load, interruption, and time-to-recognition environment |
| 5 | ind-safe-001 (adverse-event rate), ind-safe-003 (medication-error rate) — if re-entered per §5.3 | Pre-V2 notification/reporting rates: reporting culture changes with deployment; the pre-V2 level is unrecoverable |
| 6 | ind-other-003 (FS-ICU 24 family satisfaction) — if re-entered per §5.3 | Pre-V2 survey administration; the pre-V2 state is only measurable before deployment |

Scheduling consequence (unchanged from the backlog): these close **only before
deployment, or never**. They depend on G2-VAL-0026 (site, sponsor, ethics, LGPD
basis) existing first.

### 7.2 Baseline classification of every kept/redefined KPI

| KPI | Baseline window required | Pre-deployment-only? |
|---|---|---|
| KPIR-01 census | None (denominator infrastructure) | No |
| KPIR-02 critical count | Pre-V2 acuity/alarm environment study window (per baseline study protocol) | **YES — §7.1** |
| KPIR-03 alert burden | Pre-V2 total alarm burden study window | **YES — §7.1** |
| KPIR-04 score trend | None | No |
| KPIR-05 coverage/staleness | None (V2-internal; can never describe the pre-V2 state) | No |
| KPIR-06 transfusion stewardship | Retrospective window from blood-bank/EHR (⏱, pending `AUTH-PRIVACY-LEGAL` + `AUTH-CLINSAFETY`) | No |
| KPIR-07 restraint monitoring | Retrospective window (⏱, same authorities) | No |
| KPIR-08 frailty | Retrospective window (⏱) | No |
| KPIR-09 LOS | Retrospective window (⏱) | No |
| KPIR-10 sector shares | Pre-V2 sector alert counts | **YES — §7.1** |
| KPIR-11 roll-up constraint | n/a | n/a |
| KPIR-12 note counts | None | No |
| KPIR-13 feedback capture | Capture is V2-internal; its successor studies' fatigue/precision baselines are pre-deployment-only | **Successor studies: YES — §7.1** |
| KPIR-14 altas vivas da UTI (`vidas_salvas`) | None on the §7.1 list (clinical outcome count, not alarm-burden/fatigue); retrospective reconstruction possible from discharge records (⏱, pending `AUTH-PRIVACY-LEGAL` + `AUTH-CLINSAFETY`) | No |

## 8. Open questions for the named reviewer

**All VALIDATION REQUIRED; none may be closed by an agent. Reviewer of record:
rodaquino-OMNI; deciding authorities as noted (all AUTH-* roles currently
UNASSIGNED).**

1. **Decision-mapping ratification.** Confirm or amend the verdict-to-decision
   mapping of §0 and each row of §1 — in particular that no legacy computation
   survives unchanged, and that SUPERSEDE entries (KPI-DASH-06, KPI-PPV-01(a)) are
   correctly treated as DROP-with-named-successor. (Reviewer.)
   **DECISÃO (GDEC-0007, 2026-08-15):** K-1 ratificado como recomendado — o
   mapeamento de veredictos (34+31) e cada linha de §1 são confirmados; nenhum
   cálculo legado sobrevive sem alteração; as entradas SUPERSEDE (KPI-DASH-06,
   KPI-PPV-01(a)) permanecem corretamente tratadas como DROP com sucessor nomeado.
2. **Transfusion criteria.** Resolve TF-002's direction (restrictive-trigger
   semantics); decide which of the twelve criterion themes survive; ratify or
   reject any composite aggregate to replace the 8/12 cutoff. (`AUTH-CLINSAFETY`.)
   **DECISÃO (GDEC-0007, 2026-08-15):** K-2 aceito como recomendado — TF-002
   resolvido na direção restritiva (alerta em transfusão ACIMA do gatilho
   restritivo sem indicação documentada); o composto agregado (substituto do
   corte 8/12) permanece suspenso até que `AUTH-CLINSAFETY` ratifique uma regra
   de agregação própria — nenhum composto é computado antes disso.
3. **Critical-census display semantics.** Should the attention-demanding headline
   be "critical" alone with equal-prominence not-assessed counts (as specified in
   KPIR-02), or a combined "critical OR not-assessed requires attention" count?
   This is a clinical display-priority judgement. (`AUTH-CLINSAFETY` + `AUTH-UX`.)
   **DECISÃO (GDEC-0007, 2026-08-15):** K-3 aceito como recomendado — contagens
   separadas com igual proeminência ("X críticos avaliados + Y não avaliáveis");
   nunca combinadas em uma única contagem "requer atenção". Combinar reconstruiria
   o HAZ-0005 como KPI.
4. **Numeric floors.** Set every number this review deliberately left open: per-KPI
   minimum valid-fraction display floors (§2.2.2), minimum adjudicated n for
   precision display (§6.4), trend window/minimum samples (KPIR-04), frailty
   assessment window (KPIR-08), restraint duration limit (KPIR-07).
   (`AUTH-CLINSAFETY`.)
   **DECISÃO (GDEC-0007, 2026-08-15):** K-4 aceito como recomendado — valores de
   partida: fração válida mínima 70%, n mínimo 30 para taxas; permanecem
   VALIDATION REQUIRED e serão calibrados em shadow mode antes de qualquer uso
   operacional. Os demais pisos numéricos listados nesta questão seguem a mesma
   regra: valor de partida declarado e revisável, nunca ausência de piso.
5. **NEWS2 banding and staleness windows** (§4.1): ratify bands as a versioned rule
   artifact and set freshness/expiry windows per input. (`AUTH-CLINSAFETY`.)
   **DECISÃO (GDEC-0007, 2026-08-15):** K-5 aceito como recomendado — reutilizar as
   janelas de frescor do RULE-NEWS2 (1h/8h) como fonte única de verdade para
   frescor nos KPIs; a ratificação das bandas como artefato de regra versionado
   (§4.1) permanece VALIDATION REQUIRED.
6. **Time conventions** (§4.3, KPIR-09): confirm the 7-to-7 operational day and
   site timezone with the site; ratify admission/discharge anchor events and
   fractional-day policy. (Site operations + `AUTH-CLINSAFETY`.)
   **DECISÃO (GDEC-0007, 2026-08-15):** K-6 aceito como recomendado — dia civil
   00:00–24:00 no fuso horário do sítio (não a convenção 7h-às-7h); as âncoras de
   LOS (e de KPIR-14) são ancoradas em timestamps **documentados** de
   admissão/alta; uma convenção censitária local divergente, se necessária, é
   decisão de sítio a ser registrada separadamente, não um default do produto.
7. **Catalogue re-entry.** Decide which of the 31 concepts (§5.3) are sponsored for
   re-entry, in what priority order, and against which referenced target sources.
   (`AUTH-CLINSAFETY` + `AUTH-PRODUCT`.)
   **DECISÃO (GDEC-0007, 2026-08-15):** K-7 aceito como recomendado — nenhum dos 31
   conceitos catalogados reentra no ciclo 2; reentrada individual só ocorre quando
   existir fonte de dados própria para o conceito específico, com infecção/SMR
   priorizados por último por exigirem ajuste de risco.
8. **The six macro names** (§4.5): pursue the Tasy formulas for review, define
   V2-native successors, or drop permanently — explicitly including whether
   "vidas_salvas" should exist as a KPI at all. (`AUTH-CLINSAFETY` +
   `AUTH-PRODUCT`.)
   **DECISÃO (GDEC-0007, 2026-08-15) — MODIFICAÇÃO:** dos seis macro-nomes legados,
   cinco permanecem **DROP definitivo** (`obitos`, `tempo_permanencia`,
   `tx_mortalidade`, `tx_ocupacao`, `admissao` — fórmulas Tasy inverificáveis, sem
   sucessor V2-nativo definido). **`vidas_salvas` é MANTIDO**, por decisão do
   titular, como nome de missão e cultura institucional — redefinido com uma
   definição mensurável nova e honesta em **KPIR-14 "Altas vivas da UTI"** (§3): a
   fórmula Tasy legada permanece descartada por inteiro; nada de sua aritmética é
   importado. Sub-decisões de KPIR-14 (tratamento de transferência para outra UTI;
   janela de deduplicação de readmissão) permanecem VALIDATION REQUIRED.
9. **Adjudication preconditions** (§6): pre-register the deterioration definition
   and rubric (G2-VAL-0024) and resolve the lawful basis for adjudication and
   subgroup analysis (NIU-07 / VAL-0037). (`AUTH-CLINSAFETY` +
   `AUTH-PRIVACY-LEGAL`.)
   **DECISÃO (GDEC-0007, 2026-08-15):** K-9 aceito como recomendado — a rubrica de
   deterioração e sua base legal são comissionadas junto à pesquisa G1
   (G2-VAL-0024); a definição e a rubrica devem ser pré-registradas antes de
   qualquer estudo de adjudicação — sem rubrica pré-registrada o desfecho é
   inauditável.
10. **Commission the pre-deployment baseline study** (§7.1) before any deployment —
    the one irreversible scheduling item (G2-VAL-0025; requires G2-VAL-0026 site
    and ethics first). (`AUTH-PRODUCT` + `AUTH-UX`.)
    **DECISÃO (GDEC-0007, 2026-08-15):** K-10 aceito como recomendado — o estudo de
    baseline pré-implantação (§7.1; `g2-validation-backlog.md` G2-VAL-0025) é
    **COMISSIONADO AGORA**, a única prioridade máxima da revisão e o único item
    irreversível. Comissionamento não é conclusão: o estudo ainda requer desenho
    (junto à pesquisa G1) e site/ética (G2-VAL-0026) antes de qualquer execução —
    ver nota correspondente em `g2-validation-backlog.md` G2-VAL-0025.
11. **Partial-policy scope.** For each kept KPI, decide whether `partial`-status
    patient-time is admissible in denominators at all, and under which approved
    partial policies — this review admits it only where such a policy exists, but
    whether any should exist per KPI is a clinical judgement.
    (`AUTH-CLINSAFETY`.)
    **DECISÃO (GDEC-0007, 2026-08-15):** K-11 aceito como recomendado — nenhum
    status `partial` é admissível em denominadores de KPI na v1; `DC(K)` já expõe a
    incompletude sem necessidade de uma política de parcial por KPI. Parcial em KPI
    é o denominador-que-encolhe com outro nome.
12. **Restraint episode detection** (KPIR-07): approve an independent detection
    channel for undocumented restraint episodes, since the residual
    under-detection bias cannot be closed by computation. (`AUTH-CLINSAFETY` +
    nursing leadership.)
    **DECISÃO (GDEC-0007, 2026-08-15):** K-12 aceito como recomendado — o canal
    independente de detecção é diferido até existir fonte própria (ex.:
    cruzamento com registro de enfermagem ou rondas de segurança da unidade);
    KPIR-07 permanece documentation-based, com o viés de sub-detecção anotado
    explicitamente onde o KPI é exibido. Sem fonte, "independente" seria ficção.

## 9. Cross-references

- Forensic evidence base: `docs/05-clinical-safety/legacy-review/kpi/` (all six
  records; legacy pin `1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79`).
- Normative frame: `docs/01-vision-and-intended-use/success-and-harm-metrics.md`
  (SM/HM set, SM-03 rule, anti-gaming pairings, §0 rules).
- Status algebra: `docs/05-clinical-safety/evaluation-status-semantics.md`
  (five states, P-1..P-8, two-dimension rule).
- Baseline obligations: `pathway-portfolio/g2-validation-backlog.md` G2-VAL-0025;
  `docs/02-users-and-workflows/g1-validation-backlog.md` VAL-0035.
- Import preconditions: `docs/00-governance/legacy-import-policy.md` §3 — nothing
  in this review authorizes import.
- Use restrictions: `docs/01-vision-and-intended-use/non-intended-uses.md` NIU-06
  (no performance management), NIU-07 (secondary use / lawful basis).
