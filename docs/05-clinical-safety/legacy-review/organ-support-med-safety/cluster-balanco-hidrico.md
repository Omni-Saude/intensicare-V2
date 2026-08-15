---
id: LEGREV-OSMS-CL-BH
title: Legacy review — balanco-hidrico rule cluster (62 rules) with per-rule dispositions
label: PROPOSAL
status: PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI)
statement: >
  Cluster-level review of the legacy extracted-rule cluster balanco-hidrico
  (62 rule records across seven category directories), with a per-rule
  disposition table under docs/00-governance/legacy-import-policy.md §4.
provenance:
  source_repo: intensicare (legacy V1, READ-ONLY)
  path_or_url: docs/rules/*/RULE-BALANCO-HIDRICO-*.md (62 files)
  commit_sha_or_version: 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79 (HEAD at pin; every rule file is individually hashed in the cycle-1 pin manifest)
  section_or_lines: whole cluster; upstream citations inherit the records' own audit provenance (ahlabs-trilhas @ 8166c07e, trilhas-frontend @ f9656be2 — NOT mounted, NL-1)
  date_collected: 2026-08-15
  last_updated: 2026-08-15
  collector: legacy organ-support and medication-safety forensics reviewer (cycle 1, Task 1, wave 1b)
  transformation: every rule record read (metadata, statement, logic, provenance); one-line summaries condensed; verdicts are this reviewer's proposals
  confidence: high (record contents) / medium (dispositions)
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  hazards: [HAZ-0005, HAZ-0008, HAZ-0021]
  adrs: []
  pr: null
supersedes: null
superseded_by: null
---

# Balanco-hidrico rule cluster — disposition review

> **PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).**
> Verdict method identical to `../alert-threshold-engine/alert-threshold-cluster-review.md` §1.
> NL-1 caveat: every upstream `repo:path:line` citation points into
> repositories not mounted in cycle 1; quotes inherit the records' own 2026-07-03 audit provenance.
> The legacy team's own dispositions (shards `balanco-hidrico-p1.yaml` /
> `-p2.yaml`, hashed in README) propose ADOPT 31 / ADAPT 20 / ADOPT-CORRECTED 3 / RETIRE 8 —
> materially more permissive than this review (25 REJECT); the delta is for the named reviewer.

## Per-rule disposition table

| Rule ID | What it does (one line) | Verdict |
|---|---|---|
| RULE-BALANCO-HIDRICO-001 | Cumulative balance across all days = Σ non-deleted intake − Σ output (aht balanco.py:32-59) | VALIDATE |
| RULE-BALANCO-HIDRICO-002 | Daily intake total, non-deleted entradas (balanco.py:61-71) | VALIDATE |
| RULE-BALANCO-HIDRICO-003 | Daily output total, non-deleted saidas (balanco.py:73-85) | VALIDATE |
| RULE-BALANCO-HIDRICO-004 | Day-shift balance 07:00-19:00 by criado_em range (balanco.py:87-117) | VALIDATE |
| RULE-BALANCO-HIDRICO-005 | Night balance = stored 24h running total − day balance (balanco.py:119-121) | TRANSFORM — never derive from a mutable running total |
| RULE-BALANCO-HIDRICO-006 | 24h nursing-day balance via month-agnostic criado_em day filters (utils.py:212-276) | REJECT — breaks across month boundaries; second predicate drops 00:00-07:00 rows |
| RULE-BALANCO-HIDRICO-007 | Ganhos over nursing day, same two-queryset windows (utils.py:107-138) | REJECT — same window defect family |
| RULE-BALANCO-HIDRICO-008 | Diureses (tipo diurese_espontanea/sonda) over nursing day (utils.py:68-104) | REJECT as implemented — tipo filter sound, windows defective |
| RULE-BALANCO-HIDRICO-009 | Evacuacoes over nursing day; exact-datetime-equality second queryset (utils.py:30-65) | REJECT — unsatisfiable predicate |
| RULE-BALANCO-HIDRICO-010 | Max temperature over nursing day, max of window maxima (utils.py:141-174) | REJECT as implemented — window family |
| RULE-BALANCO-HIDRICO-011 | Max capillary glucose (HGT) over nursing day (utils.py:177-209) | REJECT as implemented — window family |
| RULE-BALANCO-HIDRICO-012 | Evolution-form 24h rollups delegating to the helpers (formulario.py:147-262) | REFINE — inherits helper fixes; superseded inline formula documented |
| RULE-BALANCO-HIDRICO-013 | 2h bucket grid 08:00-anchored; degenerate 22:00-00:00 BETWEEN (utils.py:288-358) | REJECT as implemented — wrap bug (fixed in V1's own re-implementation) |
| RULE-BALANCO-HIDRICO-014 | Intake creation increments stored balanco_24h running total (entradas.py:100-101) | REJECT — mutable running total vs recompute-from-source |
| RULE-BALANCO-HIDRICO-015 | Output creation decrements running total (saidas.py:111-112) | REJECT — same |
| RULE-BALANCO-HIDRICO-016 | tempo_criacao uses timedelta.seconds (intra-day only) as recency guard (sinais_vitais.py:110-113) | REJECT — >24h-old records pass "<N hours" checks; feeds sepsis criteria |
| RULE-BALANCO-HIDRICO-017 | Second-most-recent vitals record accessor (sinais_vitais.py:115-123) | VALIDATE |
| RULE-BALANCO-HIDRICO-018 | BP display: components shown only if >0, else "--" (ItemSinaisVitais.tsx:29-48) | REFINE — zero suppressed as absent |
| RULE-BALANCO-HIDRICO-019 | Pain branch: verbal→NRS 0-10, observed→BPS 3-12 (dataFormBalancoHidrico.ts:582-622) | VALIDATE — instrument content owned by clinical-scoring rules 015/016 (neuro-sedation-scores; cross-check) |
| RULE-BALANCO-HIDRICO-020 | Enteral-diet intake without volume defaults to 200 mL (entradas.py:88-91) | REJECT — fabricated volume enters the ledger silently |
| RULE-BALANCO-HIDRICO-021 | Spontaneous-presence output defaults quantity to 200 (saidas.py:94-95) | REJECT — same |
| RULE-BALANCO-HIDRICO-022 | Presence-grade to 100/200/300 mL with operator-precedence bug (saidas.py:96-103) | REJECT — precedence bug + estimated volumes unlabeled |
| RULE-BALANCO-HIDRICO-023 | Default day = today if hour≥7 else yesterday (balanco_hidrico.py:32-37) | VALIDATE |
| RULE-BALANCO-HIDRICO-024 | Fixed 07:00-07:00 shift window pinned in UI (balanco index.tsx:67-69,321-335) | VALIDATE |
| RULE-BALANCO-HIDRICO-025 | Overview cell visibility: desktop !=0 vs mobile >0 (GridView.tsx:81-96) | REJECT — two thresholds for same data (concordant with ATE review) |
| RULE-BALANCO-HIDRICO-026 | Sub-record delete authorization (permission OR author, not soft-deleted) | TRANSFORM |
| RULE-BALANCO-HIDRICO-027 | Pre-07:00 entries assigned to previous day's balance; lexicographic HH:MM compare (utils.py:496-506) | REFINE — works for zero-padded times; fragile |
| RULE-BALANCO-HIDRICO-028 | PDF 24h rows gated on sinais_vitais truthiness but valued from indicadores_24h | REJECT — gate/value source mismatch hides or misattributes data |
| RULE-BALANCO-HIDRICO-029 | Intake type decision tree (8 types, ml-terminated) (dataFormBalancoHidrico.ts:1-302) | VALIDATE |
| RULE-BALANCO-HIDRICO-030 | Oral-diet acceptance conditional volume; refusal = implicit 0 | VALIDATE |
| RULE-BALANCO-HIDRICO-031 | Output type decision tree (5 types, presence/aspect enums) | VALIDATE |
| RULE-BALANCO-HIDRICO-032 | Vital-sign ventilation conditional (O2 flow vs FiO2) | VALIDATE |
| RULE-BALANCO-HIDRICO-033 | Digital-signature eligibility (registered credentials, unsigned, author) | TRANSFORM |
| RULE-BALANCO-HIDRICO-034 | Action authorization by manage/delete permissions | TRANSFORM |
| RULE-BALANCO-HIDRICO-035 | List endpoint silently replaces caller-supplied 'dia' before 07:00 (views) | REJECT — parameter discarded; wrong day served |
| RULE-BALANCO-HIDRICO-036 | Auto-create day record as GET side effect; no write endpoints | REJECT — state-changing read |
| RULE-BALANCO-HIDRICO-037 | Scheduled daily auto-creation for occupied homecare beds | TRANSFORM |
| RULE-BALANCO-HIDRICO-038 | Entrada soft-delete subtracts from running total + audit action | REJECT — running-total family |
| RULE-BALANCO-HIDRICO-039 | Saida soft-delete adds back to running total + audit action | REJECT — same |
| RULE-BALANCO-HIDRICO-040 | Write payload injection (balanco id, assinar passthrough) | TRANSFORM |
| RULE-BALANCO-HIDRICO-041 | Row type-label resolution and signature-date format | SUPERSEDE |
| RULE-BALANCO-HIDRICO-042 | Sign eligibility flow (active, unsigned, permitted) | TRANSFORM |
| RULE-BALANCO-HIDRICO-043 | Saida sign handler posts to the "entrada" route (bug) (ItemSaida) | REJECT — wrong-route signature |
| RULE-BALANCO-HIDRICO-044 | Module navigation into four sub-routes | SUPERSEDE |
| RULE-BALANCO-HIDRICO-045 | Record lifecycle shape (ativo/signed/deleted flags), shape-only inference | TRANSFORM |
| RULE-BALANCO-HIDRICO-046 | PDF export with optional signatures | SUPERSEDE |
| RULE-BALANCO-HIDRICO-047 | Every Entrada forced checado=True on creation (entradas serializer) | REJECT — auto-verification falsifies checking semantics |
| RULE-BALANCO-HIDRICO-048 | Quantidade fallback to 0 before persist | REJECT — zero-coercion at persist (HAZ-0005 data-layer) |
| RULE-BALANCO-HIDRICO-049 | Default display name from tipo | SUPERSEDE |
| RULE-BALANCO-HIDRICO-050 | 'dia' parameter YYYY-MM-DD validation | TRANSFORM |
| RULE-BALANCO-HIDRICO-051 | Listing includes soft-deleted records (default manager) | REJECT — deleted clinical data displayed |
| RULE-BALANCO-HIDRICO-052 | Vitals field set; rows rendered only when truthy (0 hidden) | REJECT — zero is a valid clinical value (pain 0, etc.) hidden |
| RULE-BALANCO-HIDRICO-053 | Intake/output field sets, volume fixed as ml | VALIDATE |
| RULE-BALANCO-HIDRICO-054 | Overview empty-state rendering | SUPERSEDE |
| RULE-BALANCO-HIDRICO-055 | IV hydration solution vocabulary (7 items) | VALIDATE |
| RULE-BALANCO-HIDRICO-056 | Continuous-infusion drug vocabulary (32 items, brand names, misspellings) | REFINE — vocabulary needs pharmacist normalization |
| RULE-BALANCO-HIDRICO-057 | Antibiotic vocabulary (41 items, mostly brand names) | REFINE — same |
| RULE-BALANCO-HIDRICO-058 | Electrolyte replacement vocabulary (8 ions) | VALIDATE |
| RULE-BALANCO-HIDRICO-059 | Consciousness-level enum (AVDI-like, 7 states) | VALIDATE |
| RULE-BALANCO-HIDRICO-060 | Complaint flag requires free-text reason | VALIDATE |
| RULE-BALANCO-HIDRICO-061 | Required strict 24h HH:MM event time | VALIDATE |
| RULE-BALANCO-HIDRICO-062 | Unused day FilterSet (filter_class commented out) | REJECT — dead code |

## Tally

VALIDATE 18 · REJECT 25 · TRANSFORM 9 · REFINE 5 · SUPERSEDE 5 (= 62).
No RETAIN: the window/running-total/default-volume defect families and the
absence of an evaluation-status contract disqualify as-is import; the sound
concepts are already re-derived in `domain_fluid_balance.py`
(fluid-balance-review.md).
