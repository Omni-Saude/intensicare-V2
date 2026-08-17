---
doc_id: LEGREV-KPI-OPS-ETL
title: Legacy KPI review — operational/time-window building blocks and KPI-defining extracted rules (docs/rules clusters)
status: PROPOSAL
label: OBSERVED (definitions as implemented) + PROPOSAL (verdicts)
owner: UNASSIGNED — VALIDATION REQUIRED
reviewer: rodaquino-OMNI
source: https://github.com/Omni-Saude/intensicare (legacy V1, READ-ONLY), pinned per docs/archive/legacy-provenance/legacy-pin-cycle-1.md
date_collected: 2026-08-15
last_updated: 2026-08-15
provenance:
  source_repo: intensicare (legacy V1)
  path_or_url: src/intensicare/services/domain_operacional.py; docs/rules/ (extracted catalog)
  commit_sha_or_version: 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79 (HEAD at pin)
  date_collected: 2026-08-15
  collector: legacy clinical-KPI forensics reviewer (cycle 1, Task 1); accountable reviewer rodaquino-OMNI
  transformation: definitions transcribed from code and from the extracted rule catalog; verdicts are reviewer proposals
  confidence: high for code; medium for catalog-only rules (primary repos not mounted — see section 4)
  validation_status: VALIDATION REQUIRED — every verdict is PROPOSAL — AWAITING NAMED CLINICAL REVIEW
---

# Legacy KPI review — operational building blocks and KPI-defining extracted rules

All verdicts are **PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI)**.

## 0. Provenance

| File | SHA-256 | In pin manifest |
|---|---|---|
| `src/intensicare/services/domain_operacional.py` | `b0a3d04086a8a07c7a5fdec957232a40a52b9eab0e6b5276cf68f955dc3ff2ce` | yes |
| `src/intensicare/core/metrics.py` | `a2ffd1fba94995030cff6b4d84ee92d4dc7f382c8294b4de72654bf6ebf8facd` | yes |
| `docs/rules/alert-threshold/RULE-INDICADORES-ETL-001-...md` | `7f1de10ea517323ea999c7dfe386bbc144b5d62fd312eb93b6adc76cde56cea5` | yes |
| `docs/rules/alert-threshold/RULE-INDICADORES-ETL-002-...md` | `c3e72cedc175b7044687f963f08d9e3f5a6e579235a31cd4ef78057ffaeab003` | yes |
| `docs/rules/alert-threshold/RULE-INDICADORES-ETL-005-...md` | `e45168c37a97e461060df64e72a9eed4120eaa1fa12fcaa22fc14df7a0a1720e` | yes |
| `docs/rules/alert-threshold/RULE-INDICADORES-ETL-006-...md` | `b891050cbcfd2f4b60eafd160084c96665f5c0fd33b6fc0a15fa7eabdd738122` | yes |
| `docs/rules/alert-threshold/RULE-INDICADORES-ETL-007-...md` | `874c293a54c14a65184684620a5a19f7ace2cbc0a6773af4750d575e9bb14f60` | yes |
| `docs/rules/billing-administrative/RULE-INDICADORES-ETL-018-...md` | `5e11d58853f96a43a988647c320e27154639d864be0d1f83e08907facb0649bd` | yes |
| `docs/rules/billing-administrative/RULE-INDICADORES-ETL-023-...md` | `66ccd2e5886d44baca055dbb8e672ed1f656623661bcc1e98d1b5c93e1bbf8ef` | yes |
| `docs/rules/billing-administrative/RULE-DOCUMENTACAO-FATURAMENTO-019-...md` | `c8aeb646eb16e6118f0fcd2649d9c9251f60aff746b4c0160d96d6280b43afe1` | yes |
| `docs/rules/billing-administrative/RULE-DOCUMENTACAO-FATURAMENTO-002-...md` | `ac7c08d3aa67c814d43a2725c8db71c0141532743bd85021bb0d0852f5618a52` | yes |
| `docs/rules/scheduling-operational/RULE-INDICADORES-ETL-013-...md` | `06c71c427da78be4e7875bedc4223ea6453db362cc036de2edccd3c13aa60bc7` | yes |
| `docs/rules/scheduling-operational/RULE-INDICADORES-ETL-014-...md` | `3093106646ad2e931a8e9de39f12b48d94e3fc6b574149227f3f9ef262b3ffde` | yes |
| `docs/rules/scheduling-operational/RULE-INDICADORES-ETL-017-...md` | `e77358a4261b7dcf0140efdfd7cc5621974e22ae81859497ec9dc077ef697418` | yes |
| `docs/rules/scheduling-operational/RULE-OPERACIONAL-INFRA-035-...md` | `83e5514cd2629f6be3e7e1076e024233dba0dcaac6fd52c4d73dfd3d18c4cbd7` | yes |
| `docs/rules/scheduling-operational/RULE-OPERACIONAL-INFRA-006-...md` | `00f94b23164a3dc4539bf708224aa38cbabc0de007a4433ca24988ac2176f749` | yes |

## 1. Operational/time-window building blocks (`domain_operacional.py`)

These are not display KPIs themselves but define the denominators and windows any V1
KPI inherits.

### KPI-OPS-01 — Tempo de permanência (Length of stay, whole days)

1. `compute_length_of_stay`, `domain_operacional.py:222-235` (RULE-OPERACIONAL-INFRA-006).
2. **Definition:** `(today_utc − admission_date).days` — partial days truncated
   (`.date()` difference, `:234-235`). Patient-level; no discharge handling in this
   function (always "now" minus admission).
3. **Evaluation-status handling:** none — an absent/incorrect admission date is the
   caller's problem; no unit tests for LOS located in `tests/`.
4. n/a. 5. Feeds `ind-ocup-002` (mean LOS) conceptually and KPI-EFF-04. Truncation
   systematically undercounts (admission 23:00 to next-day 01:00 = 0 days). UTC date
   arithmetic for a Brazilian site shifts day boundaries versus local time.
6. ⏱. 7. **Verdict: REFINE** — LOS is required; V2 must define timezone, admission/
   discharge anchor events, and fractional-day policy clinically.
   PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).

### KPI-OPS-02 — Clinical/reporting day boundaries (07:00 conventions)

1. `get_real_day`, `domain_operacional.py:130-152` (clinical day rolls at 07:00,
   RULE-OPERACIONAL-INFRA-004); RULE-OPERACIONAL-INFRA-035 (`data_7_as_7` — reporting
   day is 07:00-to-07:00; catalog record, primary in `ahlabs-trilhas utils/handlers.py:226-229`,
   not mounted); related RULE-OPERACIONAL-INFRA-029/034/049.
2. **Definition:** before 07:00 the clinical/reporting day is the previous calendar
   date. Note `get_real_day` uses **UTC** (`:146`) while the catalog rule used
   process-local time — the two implementations of "the same" convention disagree by
   the site's UTC offset (03:00-04:00 local América/São Paulo vs 07:00 UTC).
3. n/a (window rule). 5. Any per-day KPI (census, alerts/day, balance) shifts events
   across days depending on which variant computes it — a silent cross-system
   denominator inconsistency.
6. —. 7. **Verdict: VALIDATE** — the 7-to-7 convention is plausibly the site's real
   operational day, but must be confirmed with the site and implemented once, with an
   explicit timezone, before any per-day KPI exists.
   PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).

### KPI-OPS-03 — `get_number` safe numeric coercion

1. `domain_operacional.py:412-445` (RULE-OPERACIONAL-INFRA-011).
2. **Definition:** any unparseable or `None` value → `0.0` (`:431,445`).
3. **Evaluation-status handling — prohibited pattern.** This is the
   coerce-missing-to-zero primitive named verbatim in `evaluation-status-semantics.md`
   §4 P-1 and PROMPT rule 7. Wherever it touches a clinical quantity, a missing value
   becomes numeric 0.
7. **Verdict: REJECT** for any clinical or KPI data path (documented so it is not
   re-proposed); numeric-parse failures must produce `invalid`/`not_evaluated`, never
   0.0. PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).

## 2. KPI-defining extracted rules — cluster-level review

The `docs/rules/` catalog in the pinned repo describes the *previous* legacy
generation (Django `ahlabs-trilhas` + React `trilhas-frontend`); see section 4 for the
source-availability limits. KPI-defining rules found in the assigned clusters
(billing-administrative, scheduling-operational) plus grep-extended `INDICADORES-ETL`
rules in alert-threshold:

| Rule (catalog path, hashed above) | KPI content as recorded | SM-03 / HAZ-0005 exposure | Verdict (all PROPOSAL — AWAITING NAMED CLINICAL REVIEW, reviewer: rodaquino-OMNI) |
|---|---|---|---|
| RULE-INDICADORES-ETL-001 (alert-threshold) | Sector alert-share %: `alertPercent = alert*100/(NEUTRO+AMARELO+VERMELHO)`, 0 when total 0. **Computed client-side** (DashboardCard.tsx) — finding | Zero-alert sector renders 0% for every bucket — indistinguishable from unevaluated sector | TRANSFORM — compute server-side over statused counts |
| RULE-INDICADORES-ETL-002 (alert-threshold) | Assisted-share %: `assist*100/(AMARELO+VERMELHO)`, 0 when total 0. **Client-side** — finding | Catalog's own edge note: assisted patients with zero yellow/red alerts yield 0% (not 100%), blocking the ASSISTIDO card state — denominator artifact misrepresents care state | TRANSFORM |
| RULE-INDICADORES-ETL-005 (alert-threshold) | Occupancy dial colors: red > 70%, amber > 50%, green ≤ 50% (client display thresholds; `ocupacao` computed server-side upstream, formula not located) | Unreferenced thresholds; occupancy formula unreviewable (§4) | VALIDATE |
| RULE-INDICADORES-ETL-006 (alert-threshold) | Sector aggregate alert-color decision tree | Alert-rollup semantics — pointer for the alerts/severity reviewer; not re-reviewed here | (out of KPI scope — pointer) |
| RULE-INDICADORES-ETL-007 (alert-threshold) | `TotalAlerta` has 4 buckets (adds LARANJA) while every other alert count has 3 — recorded DISCREPANCY | A count bucket that exists in one surface and not others makes cross-surface totals non-reconcilable | REJECT as-is (resolve the enum before any count is defined) |
| RULE-INDICADORES-ETL-013 (scheduling-operational) | Occupancy-indicator ETL watermark load (`dt_referencia >=` last local; duplicated verbatim in two modules) | Mechanics; boundary row reprocessed each run (idempotent) | SUPERSEDE — V2 ingestion architecture replaces ETL |
| RULE-INDICADORES-ETL-014 (scheduling-operational) | Macro-indicator ETL loads **current server month only**; upsert keyed on sector only → **at most one macro row per sector survives; history destroyed; no backfill ever** | A KPI store that keeps only the latest month cannot support any trend, baseline, or audit — structurally incompatible with baseline obligations (VAL-0035) | REJECT |
| RULE-INDICADORES-ETL-017 (scheduling-operational) | Sector-occupancy dashboard auto-reload interval | Not a KPI (refresh cadence) — noted, no review | (not a KPI) |
| RULE-INDICADORES-ETL-018 (billing-administrative) | Recursive DashboardItem shape: same KPI set (total_leitos, total_assistidos, total_leitos_ocupados, macro_indicadores, qtd_mensagens, total_alertas, ocupacao) at empresa > estabelecimento > setor | Roll-up shape has no per-status categories — cannot satisfy P-3/P-8 (no aggregate more reassuring than its least-evaluated member; no unevaluated subject omitted) | TRANSFORM — hierarchy concept retained; shape rebuilt on statused counts |
| RULE-INDICADORES-ETL-023 (billing-administrative) | Six macro-KPIs per node: `vidas_salvas` (lives saved), `obitos`, `tempo_permanencia`, `tx_mortalidade`, `tx_ocupacao`, `admissao` — **no units, no ranges, no formulas recorded** | "Vidas salvas" served as a number with no recorded definition anywhere is an untraceable clinical claim; formulas computed upstream in Tasy — SOURCE NOT LOCATED (§4) | VALIDATE (the six names as candidate macro set); REJECT serving any of them without a ratified definition |
| RULE-DOCUMENTACAO-FATURAMENTO-019 (billing-administrative) | Evolution-note counts by type with leading "Total" row (frontend util) | Documentation-productivity count; non-clinical; honest empty case (`Total: 0`) | REFINE (ops/documentation metric only — must never be read as care quality; see `non-intended-uses.md` NIU-06 performance-management ban) |
| RULE-DOCUMENTACAO-FATURAMENTO-002 (billing-administrative) | "Glosa Zero" 16-criteria billing-documentation alert engine | Pure billing mechanics — outside clinical-KPI scope; noted for the billing/documentation reviewer | (out of KPI scope — pointer) |

Other rules inspected in the two assigned clusters (access/auth, log retention, page
sizes, PDF export, Tasy posting codes, tenancy lifecycle, tempo-permanencia already
covered above) are administrative mechanics with no KPI content — reviewed by title
and rule text at the pinned hashes listed in
`docs/archive/legacy-provenance/legacy-pin-cycle-1.md`; not individually recorded.

## 3. Software telemetry — noted and excluded

OBSERVED: `src/intensicare/core/metrics.py` (hash above) is Prometheus-style software
telemetry (`ingested_rows`, `alerts_raised`, retries, DLQ, stage latencies,
`last_poll_success_at`, `last_score_at`; `/metrics` endpoint `:325-350`). Out of
clinical-KPI scope per task definition. One boundary note: `intensicare_alerts_raised_total`
and `last_score_at` are *clinical-adjacent* counters; per
`success-and-harm-metrics.md` §0 (study-type table), instrumented telemetry is "valid
only for V2-internal facts, never for clinical truth" — they must never be re-badged
as alert-burden or coverage KPIs. The OTEL instruments inside `ppv_tracker.py` are
reviewed in `kpi-ppv-tracker.md` finding (e).

## 4. SOURCE NOT LOCATED — cannot review (stop-condition record)

Per the review packet's stop condition, the following were **not reconstructed**:

1. **Primary sources of the extracted rule catalog.** The catalog cites
   `ahlabs-trilhas @ 8166c07e` (Django backend) and `trilhas-frontend @ f9656be2`
   (React). Neither repository is contained within `https://github.com/Omni-Saude/intensicare`
   (OBSERVED: filesystem search 2026-08-15 finds only the catalog itself and
   similarly-named test files for the new engine). All section-2 reviews rest on the
   catalog text at the pinned hashes, not on primary code.
2. **Formulas for the six macro indicators** (RULE-INDICADORES-ETL-023):
   `vidas_salvas`, `obitos`, `tempo_permanencia`, `tx_mortalidade`, `tx_ocupacao`,
   `admissao` are loaded from upstream Tasy Oracle objects (`MacroIndicadoresTasy`,
   RULE-INDICADORES-ETL-014) — the computing SQL/views live in the hospital's Tasy
   system and are not in any mounted repository. **SOURCE NOT LOCATED — cannot
   review** their numerators, denominators, or exclusions.
3. **Server-side `ocupacao` percentage formula** consumed by
   RULE-INDICADORES-ETL-005/-018 — computed in `ahlabs-trilhas` (not mounted).
   **SOURCE NOT LOCATED — cannot review.**
4. **`total_assistidos` / `total_leitos_ocupados` counting rules** behind
   RULE-INDICADORES-ETL-018 — same unmounted primary. Related assistance semantics
   are recorded in alert-threshold rules (RULE-ALERTAS-009/027/028/029, hashed in the
   pin manifest) and belong to the alerts reviewer's scope.
