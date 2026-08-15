---
id: LEGREV-EWS-SHARED
title: Legacy EWS review — cross-score shared findings (NEWS2 + MEWS) and grep-hit disposition
label: PROPOSAL
statement: >
  Findings common to the NEWS2 and MEWS legacy review records, hazard-log follow-ups
  proposed from source-verified evidence, and the disposition of every docs/rules grep
  hit for NEWS/MEWS/early-warning content. PROPOSAL — AWAITING NAMED CLINICAL REVIEW
  (reviewer: rodaquino-OMNI).
provenance:
  source_repo: intensicare (legacy V1, READ-ONLY) + intensicare-V2
  path_or_url: /Users/familia/intensicare (per-file hashes in news2-review.md §0 and mews-review.md §0)
  commit_sha_or_version: 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79 (legacy HEAD at pin)
  section_or_lines: per-citation line references throughout
  date_collected: 2026-08-15
  collector: legacy EWS forensics reviewer (cycle-1 Task 1 agent); accountable reviewer rodaquino-OMNI
  transformation: reviewer synthesis across the two review records; no new formula claims
  confidence: high
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  requirements: [SAF-0001, SAF-0002, SAF-0006]
  hazards: [HAZ-0005]
  adrs: []
  tests: []
  pr: null
supersedes: null
superseded_by: null
---

# Shared findings — legacy EWS review (NEWS2 + MEWS)

Citations use the hash tables in `news2-review.md` §0 and `mews-review.md` §0.
Legacy paths relative to `/Users/familia/intensicare/`.

## SF-1 — The event-driven EWS alert layer is dead code

OBSERVED: `ews_nrt_runner.py` implements the four designed EWS alerts
(NEWS2 ≥7 edge-crossing + new red parameter; NEWS2/MEWS trend delta ≥3 over 8h;
SOFA acute-rise; discharge readiness) and its docstring instructs "Call this from
ingest_vitals()" (ews_nrt_runner.py:685), but no module under `src/` imports
`process_ews_nrt` or `process_ews_after_vital_insert` — only tests do (grep,
2026-08-15). Production alerting is therefore aggregate-threshold-only
(`alert_engine.py:50-59` via vitals.py:387-408). Consequences: the published
NEWS2 red-score tier and the trend alerts exist only as unreachable code and
design YAML (`docs/plan/_work/alerts/early-warning-scores.yaml`). Any V2 claim
that legacy "had" red-score or trend alerting is false at the wiring level.
INFERENCE: legacy tests passing on this runner are intent evidence only and
validate nothing about deployed behavior (consistent with
`legacy-import-policy.md` §3 item 8).

## SF-2 — Version identity and ratification trails are unreliable

OBSERVED: `algorithm_version` strings do not identify behavior. NEWS2-v3.0.0 was
seeded/ratified as "supplemental O₂ auto-activates Scale 2"
(0021_activate_news2_v3_0_0.py:7-12; 0029_ratification_record.py:13-15), then the
code inverted that behavior (news2.py:118-122, 275-280) with the version string
unchanged. `RAT-NEWS2-SCALE-2` is absent from the approved table in
`docs/audit/fullspectrum/CLINICAL_SIGNOFF.md`; the MEWS row (RAT-MEWS-SUBBE-2001-R2)
is approved there, while mews.py:19 still carries "pending clinical sign-off" —
and mews.py:19 / 0039_activate_mews_v3_0_0.py:20-22 disagree with
CLINICAL_SIGNOFF.md on that status. The sign-off document itself records that the
approver is the code-owner without verifiable professional registration.
INFERENCE: no legacy ratification may be inherited; every band table and
threshold entering V2 requires fresh ratification by a named clinical authority
per `evidence-notation.md` §2 rule 3.

## SF-3 — Proposed hazard-log follow-up: invalid-input coercion (beyond HAZ-0005)

HAZ-0005 covers *absent* inputs. Source review found two *present-but-invalid*
paths that coerce to the most reassuring value with no marker:

1. MEWS AVPU: any non-A/V/P/U token → 0 silently (`avpu_map.get(upper, 0)`,
   mews.py:162-164). Reachable with the schema-admitted ACVPU token "C"
   (schemas/vitals.py:13): new confusion scores 0 in MEWS while scoring 3 in
   NEWS2 from the same payload.
2. HL7 MLLP consciousness: OBX AVPU values outside A/V/P/U — including "C" —
   are parsed to `None` (mllp_listener.py:200-204), which then scores 0 in both
   instruments. Path-dependent: the same patient state scores differently by
   ingestion route.

PROPOSAL: log as a new hazard (invalid/unmappable clinical token coerced to the
reassuring pole, per-route inconsistency) linked to HAZ-0005 and HAZ-0032-family
semantics in `evaluation-status-semantics.md` §3.5 (`invalid` state — "an
unmappable code ... MUST NOT be downgraded"). Owner: UNASSIGNED — VALIDATION
REQUIRED.

## SF-4 — Configurable thresholds have no clinical floor

OBSERVED: `threshold_config` resolves bed ≻ unit ≻ tenant
(threshold_resolver.py:50-117); mutations are audited
(threshold_resolver.py:120-150) but nothing bounds the values an operator may
set. The de-facto safety mitigation for the missing red-score tier (NEWS2
watch=3 catching any single 3-scoring parameter, news2-review.md D-6) silently
disappears if any scope raises `watch_threshold`. PROPOSAL for V2: alerting
thresholds tied to published trigger levels are clinical content requiring the
same change control as band tables — configurability, if kept, needs declared
floors and clinical sign-off per change.

## SF-5 — No freshness or completeness policy at the scoring boundary (VAL-0023)

OBSERVED: both scorers score whatever fields co-exist on one `vital_sign` row;
there is no per-input freshness window, no completeness policy, and no
carry-forward logic anywhere in the scoring path (news2.py, mews.py, vitals.py).
The only staleness logic in the EWS family lives in the unwired runner's
trend/baseline lookups (8h/24h windows, ews_nrt_runner.py:481-531) and in design
YAML `staleness_max` fields that nothing enforces (early-warning-scores.yaml).
This is the concrete legacy input to VAL-0023: freshness/invalidation must be
specified per input and per score in V2; there is no legacy policy to import.

## SF-6 — Adult-instrument boundary is unenforced (VAL-0006 / VAL-0007)

OBSERVED: no age, pregnancy, or care-setting gating exists anywhere in either
scoring path; the ingestion schema carries no date of birth or age field at all
(schemas/vitals.py:16-88), so population enforcement is not even expressible at
this boundary. SOURCE (RCP 2017 report, §2): NEWS2 "designed for use in patients
aged 16 years and more and is not recommended for use in children aged under 16
years or during pregnancy". SOURCE (publisher abstract): the Subbe 2001 MEWS
cohort is adult medical admissions. Both feed the BLOCKING questions VAL-0006
and VAL-0007 unchanged.

## SF-7 — Documented intent contradicts implementation on missing data

OBSERVED: `VitalSignResponse` documents `mews_score`/`news2_score` as "None se
dados insuficientes" (schemas/vitals.py:98-101), but the implementation never
returns None for insufficient data — it returns the zero-coerced integer
(news2-review.md §5, mews-review.md §5). The legacy system's own API contract
states the safe behavior while the code does the unsafe one. This is
independent, source-level confirmation of the HAZ-0005 "confirmed violation of
documented intent" characterization.

## SF-8 — Disposition of every docs/rules grep hit (completeness record)

`grep -ril "news\|mews\|early warning" docs/rules` (2026-08-15) returned the
files below (all [pin] in the cycle-1 manifest). Each was reviewed for whether
it contains NEWS2/MEWS rules in scope for this record:

| Hit | Content | Disposition |
|---|---|---|
| `docs/rules/AUDIT-REPORT.md`, `docs/rules/ESCALATIONS.md` | Audit/escalation index; uses NEWS2/MEWS as published anchors for verifying *other* rules | Context only; no NEWS2/MEWS implementation rules. |
| `docs/rules/clinical-scoring/RULE-PIORA-CLINICA-001/-002/-003/-004/-005/-008/-009` and `docs/rules/alert-threshold/RULE-PIORA-CLINICA-010` | The proprietary "piora clínica" graded sub-score instrument, *compared against* NEWS2 Scale 1/Scale 2/CVPU by the legacy extractors; RULE-PIORA-CLINICA-010 documents its single-red-parameter violation | **Out of scope here — a distinct proprietary instrument, not NEWS2/MEWS.** Its NEWS2-referenced defects (e.g. SpO2 sign inversion, 81-87% coverage gap, red-downgrade-by-overwrite) belong to the piora-clinica review task. No NEWS2/MEWS scoring logic is implemented in these rules. |
| `docs/rules/clinical-scoring/RULE-SEPSE-028/-029/-032/-035` | Sepsis screening criteria citing NEWS2 thresholds as supportive references | Out of scope — sepsis-rule review. No NEWS2/MEWS logic implemented. |
| `docs/rules/extraction/phase1/BE-06.yaml`, `phase2/catalog/{sepse,piora-clinica}.yaml`, `phase3*/{sepse,piora-clinica}-batch*.yaml`, `phase1/phase1-summaries.json` | Extraction worksheets for the above rule families | Same dispositions as their rule files. |

INFERENCE: the only NEWS2/MEWS *implementations* in the legacy repository are
`services/news2.py` and `services/mews.py` (plus their call sites reviewed in
the two review records). No implementing source was unlocated; the stop
condition ("SOURCE NOT LOCATED") was not triggered for any reviewed rule.

## SF-9 — Items this review could not verify (recorded honestly)

1. RCP "December 2022 clarification": not surfaced on the RCP resource pages at
   collection time (news2-review.md §2). Not cited; VALIDATION REQUIRED if wanted.
2. Subbe 2001 Table 1 cell values: primary source paywalled; verified only at
   abstract level (mews-review.md §2.3). Blocking VALIDATION REQUIRED before any
   V2 spec labels the MEWS bands SOURCE.
3. `EWSScoreSnapshot.news2_components` (ews_nrt_runner.py:54) is declared but
   never populated — minor dead field, noted for completeness.
