---
doc_id: LEGREV-KPI-IND
title: Legacy KPI review — 31-indicator clinical quality catalogue (api/v1/indicators.py)
status: PROPOSAL
label: OBSERVED (behaviour as implemented) + PROPOSAL (verdicts)
owner: UNASSIGNED — VALIDATION REQUIRED
reviewer: rodaquino-OMNI
source: /Users/familia/intensicare (legacy V1, READ-ONLY), pinned per docs/archive/legacy-provenance/legacy-pin-cycle-1.md
date_collected: 2026-08-15
last_updated: 2026-08-15
provenance:
  source_repo: intensicare (legacy V1)
  path_or_url: src/intensicare/api/v1/indicators.py
  commit_sha_or_version: 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79 (HEAD at pin)
  date_collected: 2026-08-15
  collector: legacy clinical-KPI forensics reviewer (cycle 1, Task 1); accountable reviewer rodaquino-OMNI
  transformation: catalogue metadata transcribed; mechanism reviewed from code
  confidence: high (hash matches pin manifest)
  validation_status: VALIDATION REQUIRED — every verdict is PROPOSAL — AWAITING NAMED CLINICAL REVIEW
---

# Legacy KPI review — the 31-indicator "clinical quality" catalogue

All verdicts are **PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI)**.

## 0. Provenance

| File | SHA-256 | In pin manifest |
|---|---|---|
| `src/intensicare/api/v1/indicators.py` | `dc54ca40408ec2a90d37bb412ea5e09c5889c1490abf4c479b57fde134f2d597` | yes |
| `tests/test_indicators.py` | `6cf5036379700e724b2e7631791274653278e4053683eef502782e839779ad54` | no — hash-and-note |

## 1. Headline finding — the entire catalogue serves fabricated values

**OBSERVED** (`src/intensicare/api/v1/indicators.py`):

- Every indicator's `current_value` is `random.random()` scaled into its own
  reference range: `_random_float(ref["low"], ref["high"])` (`indicators.py:366-368,
  394-408`). By construction the value is almost always **inside the target range**.
- `trend` is `random.choice(["improving", "stable", "declining", "unknown"])`
  (`:371-373`).
- `history` is 30 mock points sampled inside the reference range with deliberate
  ~10% out-of-range "spikes for realism" (`:376-391`).
- The summary's `alerts_out_of_range` is a count of indicators for which a *fresh
  random draw* returned "declining" (`:521`), not a comparison of any value to any
  target.
- All three endpoints require authentication (`Depends(get_current_user)`,
  `:427-436,488-491,537-541`) and nothing in the response marks the data as mock.

**INFERENCE:** this is the strongest false-green mechanism in the legacy KPI surface —
stronger than the HAZ-0005 unscored-as-normal pattern, because here the reassuring
number is not even derived from absent data; it is invented inside the target band and
presented in a clinical vocabulary (SMR, PAV/1000 VM-day, IPCS). Test evidence
confirms intent: `tests/test_indicators.py` asserts structure, counts, pagination and
auth only — no test asserts any relationship between a served value and any data
(`test_indicators.py:22-166`).

## 2. Per-KPI record — mechanism (applies to all 31 identically)

1. **Name and location.** Catalogue defined `indicators.py:29-341`; list endpoint
   `GET /api/v1/indicators` (`:427-480`); detail `GET /api/v1/indicators/{id}`
   (`:537-554`); summary `GET /api/v1/indicators/summary` (`:488-529`). No frontend-v3
   consumer located (OBSERVED: no references to these routes under `frontend-v3/app`
   or `frontend-v3/lib`); display surface is therefore the API itself plus any
   external client.
2. **Definition as implemented.** For every indicator: numerator — none; denominator —
   none; filters/exclusions — none; time window — none; aggregation level — none.
   The only implemented artefacts are catalogue metadata (name, category, prose
   description, unit, target string, reference range) and the random-value generator.
   The prose descriptions imply definitions (e.g. "per 1000 pacientes-dia") that are
   nowhere computed.
3. **Evaluation-status handling.** None. There is no data path at all, so 100% of
   patient-time is unevaluated, yet values are always served — the limiting case of an
   SM-03 violation (a metric reported with zero valid patient-time in the
   denominator).
4. **PPV** — n/a.
5. **Clinical meaningfulness.** The *names* are recognizable ICU quality indicators
   (ANVISA/CDC-style device-associated infection densities, SMR, sedation/ventilation
   bundles). As implemented, none has any validity. Serving them fabricated maps
   directly to HM-03 (false reassurance) at the organizational level.
6. **Baseline timing.** See per-indicator table (column "Baseline flag").
7. **Verdict — split:**
   - **Mechanism (mock generator, summary, history): REJECT.** Must never be imported
     in any form; documented so it is not re-proposed. A V2 metric endpoint that has
     no measurement must say so (`success-and-harm-metrics.md` §0 rule 3), never
     synthesize.
   - **Catalogue as a candidate metric list: VALIDATE.** The 31 names/targets are a
     plausible starting inventory for the V2 metric catalog, but every target value
     (e.g. "< 5%", "< 2.5/1000 CVC-dia") is an unreferenced constant and every
     definition is missing its numerator/denominator/exclusion specification.
   PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).

## 3. The 31 indicators as catalogued (metadata verbatim from `indicators.py:29-341`)

Baseline flag: 🚩 = joins G2-VAL-0025 / VAL-0035 (meaningful only against a
pre-deployment baseline of the unit's alarm/practice environment); ⏱ = baseline
desirable but reconstructable retrospectively from EHR data (subject to
`AUTH-PRIVACY-LEGAL`); — = not baseline-bound.

| ID | Name (pt-BR as implemented) | EN gloss | Unit | Target | Baseline flag |
|---|---|---|---|---|---|
| ind-tlp-001 | Taxa de Lesão por Pressão | Pressure-injury rate | % | < 5% | ⏱ |
| ind-tlp-002 | Incidência de Úlcera por Pressão | Pressure-ulcer incidence | /1000 pac-dia | < 10 | ⏱ |
| ind-tlp-003 | Prevalência de Lesão por Pressão | Pressure-injury prevalence | % | < 3% | ⏱ |
| ind-ocup-001 | Taxa de Ocupação | Occupancy rate | % | < 85% | ⏱ |
| ind-ocup-002 | Tempo Médio de Permanência | Mean length of stay | dias | < 7 | ⏱ |
| ind-ocup-003 | Taxa de Rotatividade de Leitos | Bed turnover rate | adm/leito | > 4 | ⏱ |
| ind-sed-001 | Taxa de Sedação Adequada (RASS) | Adequate-sedation rate | % | > 80% | ⏱ |
| ind-sed-002 | Tempo de Despertar Diário | Daily sedation-interruption rate | % | > 90% | ⏱ |
| ind-sed-003 | Incidência de Delirium | Delirium incidence | % | < 20% | ⏱ |
| ind-vent-001 | Taxa de Pneumonia Associada à VM (PAV) | VAP density | /1000 VM-dia | < 5 | ⏱ |
| ind-vent-002 | Duração Média de Ventilação Mecânica | Mean MV duration | dias | < 7 | ⏱ |
| ind-vent-003 | Taxa de Sucesso de Extubação | Extubation success rate | % | > 85% | ⏱ |
| ind-vent-004 | Taxa de Reintubação em 48h | 48 h reintubation rate | % | < 10% | ⏱ |
| ind-hemo-001 | Tempo de PAM < 65 mmHg | Time with MAP < 65 | % | < 10% | ⏱ |
| ind-hemo-002 | Uso de Vasopressores | Vasopressor use > 24 h | % | < 30% | ⏱ |
| ind-hemo-003 | Taxa de Choque Séptico | Septic-shock incidence | % | < 15% | ⏱ |
| ind-nutr-001 | Taxa de Nutrição Enteral Precoce | Early enteral nutrition rate | % | > 70% | ⏱ |
| ind-nutr-002 | Adequação Calórica | Caloric adequacy | % | > 80% | ⏱ |
| ind-nutr-003 | Tempo para Início de Nutrição Enteral | Time to enteral nutrition | horas | < 48 | ⏱ |
| ind-infec-001 | Taxa de IPCS (Cateter Central) | CLABSI density | /1000 CVC-dia | < 2.5 | ⏱ |
| ind-infec-002 | Taxa de ITU Associada a Cateter Vesical | CAUTI density | /1000 CVD-dia | < 3 | ⏱ |
| ind-infec-003 | Densidade de Uso de Antimicrobianos (DOT) | Antimicrobial DOT density | DOT/1000 pac-dia | < 800 | ⏱ |
| ind-safe-001 | Taxa de Eventos Adversos | Adverse-event rate | /1000 pac-dia | < 5 | 🚩 (reporting-culture dependent; pre-V2 reporting rate unrecoverable) |
| ind-safe-002 | Taxa de Quedas | Fall rate | /1000 pac-dia | < 2 | ⏱ |
| ind-safe-003 | Taxa de Erros de Medicação | Medication-error rate | /1000 pac-dia | < 3 | 🚩 (same reporting-culture caveat) |
| ind-mob-001 | Taxa de Mobilização Precoce | Early-mobilization rate | % | > 60% | ⏱ |
| ind-mob-002 | Dias até Primeira Deambulação | Days to first ambulation | dias | < 5 | ⏱ |
| ind-mob-003 | Taxa de Pacientes Mobilizados | Mobilized-patient rate | % | > 75% | ⏱ |
| ind-other-001 | Taxa de Mortalidade Padronizada (SMR) | Standardized mortality ratio | razão | < 1.0 | ⏱ |
| ind-other-002 | Taxa de Readmissão em 48h | 48 h ICU readmission rate | % | < 2% | ⏱ |
| ind-other-003 | Índice de Satisfação Familiar (FS-ICU 24) | Family satisfaction (FS-ICU 24) | score | > 80 | 🚩 (survey-based; pre-V2 state only measurable before deployment) |

**INFERENCE on baseline flags:** the two notification-based safety rates (ind-safe-001,
-003) and the family-satisfaction survey are flagged 🚩 because V2 deployment itself is
expected to change reporting/response behaviour, making the pre-V2 level unrecoverable —
the same irreversibility logic as VAL-0035. The remainder are ⏱ because their raw events
(infections, reintubations, mortality) exist in the EHR independently of V2, so a
retrospective baseline is possible in principle; whether it is lawful and reliable is a
`AUTH-PRIVACY-LEGAL` + `AUTH-CLINSAFETY` question, not settled here.
