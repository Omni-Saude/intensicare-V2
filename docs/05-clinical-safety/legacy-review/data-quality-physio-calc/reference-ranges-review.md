---
id: LEGREV-DQPC-REFRANGES
title: Legacy review — api/reference_ranges.py, units/naming lens (supplementary to alert-threshold-engine's value-level review)
label: PROPOSAL
status: PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI)
statement: >
  Supplementary forensic review of `src/intensicare/api/reference_ranges.py`
  from a units/UCUM-correctness and cross-artifact naming-consistency lens.
  This record deliberately does NOT re-review the 24 vital-sign bound
  values, the SOFA display bands, or the config-shape defect — all fully
  reviewed and given a REJECT verdict already by the alert-threshold-engine
  workstream's `thresholds-seed-review.md` §4.2, cited and cross-referenced
  here rather than duplicated.
provenance:
  source_repo: intensicare (legacy V1, READ-ONLY)
  path_or_url: src/intensicare/api/reference_ranges.py
  commit_sha_or_version: 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79 (HEAD at pin; SHA-256 in §0)
  section_or_lines: whole file (117 lines)
  date_collected: 2026-08-15
  last_updated: 2026-08-15
  collector: rodaquino-OMNI (legacy data-quality/physiological-calculation forensics reviewer, cycle 1 Task 1, wave 1b)
  transformation: read from source; cross-checked against this workstream's own units_normalizer.py registry and units-registry.md; no code imported.
  confidence: high (source citations) / medium (naming-consistency judgment)
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  hazards: [HAZ-0005]
  adrs: []
  pr: null
supersedes: null
superseded_by: null
---

# `api/reference_ranges.py` — supplementary units/naming review

> **PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).**
> **Read `docs/05-clinical-safety/legacy-review/alert-threshold-engine/
> thresholds-seed-review.md` §4.2 first.** That workstream already
> reviewed this file's 24 vital-sign bound values against RCP NEWS2 2017
> (finding 5 discrepancies), the SOFA display-band set (8 edge values,
> flagged UNCITED and contradicting Sepsis-3), and the config-shape defect
> (score configs mapped into the vitals shape, unit hardcoded empty, urgent
> threshold dropped) — proposing **REJECT** for the whole endpoint. **None
> of that is repeated here.** This record covers only what that review's
> threshold-value lens did not: unit-*string* correctness and
> cross-artifact parameter-*naming* consistency within this DQPC
> workstream's own file set.

## 0. Sources and integrity

```text
79a7f055c8d33b4f8d0f2866bd136af0cbbe389bae079736b5f133c511605acc  src/intensicare/api/reference_ranges.py
```

OBSERVED 2026-08-15: matches `docs/archive/legacy-provenance/
legacy-pin-cycle-1.md` and `inventory.md`. This is the same file and same
hash the alert-threshold-engine workstream cites in
`thresholds-seed-review.md` §0 — one file, two independent lenses, both
PROPOSAL.

## 1. Unit-string correctness (UCUM lens)

OBSERVED (`reference_ranges.py:23-72`, `DEFAULT_VITAL_THRESHOLDS`):

| Vital | Declared `unit` string | Assessment |
|---|---|---|
| `heart_rate` | `"bpm"` | Conventional, unambiguous |
| `systolic_bp` / `diastolic_bp` | `"mmHg"` | Conventional, UCUM-compatible |
| `respiratory_rate` | `"rpm"` | **Non-standard for this quantity.** `rpm` conventionally denotes *revolutions* per minute (mechanical/audio usage); it is not a UCUM code for respiratory rate. Cross-reference: `docs/plan/clinical/units-registry.md` §2.7 (this same workstream's own item) **also** canonicalizes `frequencia_respiratoria` as `rpm` with `irpm` as a 1:1 alias — so this is not a one-off typo in this file, it is a naming choice **repeated in the design document itself**. `irpm` ("incursões respiratórias por minuto," a legitimate PT-BR clinical abbreviation) is the more defensible of the two; bare `rpm` should be flagged **UNCITED** as a respiratory-rate unit label pending a named decision (`/min` or a documented `irpm`/breaths-per-minute code) |
| `spo2` | `"%"` | Conventional; `high_warn == high_critical == 100` is already flagged incoherent by `thresholds-seed-review.md` §4.2, not repeated here |
| `temperature` | `"°C"` | Conventional unit string — but see §2 below for the parameter-**name** problem this row exposes |

## 2. Parameter-naming incoherence with `units_normalizer.py` (new finding)

OBSERVED: `reference_ranges.py`'s six vital names — `heart_rate`,
`systolic_bp`, `diastolic_bp`, `respiratory_rate`, `spo2`, `temperature`
— are **English**. `units_normalizer.py`'s `_PARAMETER_REGISTRY` keys —
`creatinina`, `fio2`, `lactato_arterial`, `pao2`, `temperatura` — are
**Portuguese** (matching the rest of the clinical domain vocabulary, per
`docs/00-governance/legacy-import-policy.md`'s general observation that
PT-BR clinical terms are preserved verbatim throughout this codebase).

The only name that is even a close cognate is `temperature` /
`temperatura` — and they are **not the same string**.
`units_normalizer.normalize_value("temperature", value, "°C")` would raise
`UnitNormalizationError: Parâmetro desconhecido: 'temperature'`, even
though `"temperatura"` **is** a registered parameter one file away in the
same service directory. There is no mapping layer anywhere in this
workstream's file set (`units_normalizer.py`, `gold_reader.py`,
`gold_schema.py`, `gold_writer.py`, this file) that translates between
the two vocabularies. **None of `reference_ranges.py`'s six vital names
would successfully resolve against `units_normalizer.py`'s registry if
anything ever tried to route a value between them** — not because the
conversion factors are wrong, but because the two artifacts this same
workstream owns do not agree on what to call the same clinical
quantities.

This is squarely a data-quality finding this record's lens exists to
catch, and it is **not** a duplicate of anything in
`thresholds-seed-review.md` (which reviewed threshold *values*, not
parameter *names* or their cross-file resolvability).

**Verdict: REJECT** the current, unreconciled naming split;
**VALIDATION REQUIRED** — a named decision on one canonical parameter
vocabulary (this reviewer has no basis to prefer English or Portuguese;
`units-registry.md`'s own PT-BR-preserving convention is the more
consistent choice given the rest of the domain, but that is a naming
governance decision, not a units-review finding this reviewer can make
unilaterally).

## 3. Coverage gap: FiO2 is absent from the exposed reference set

OBSERVED: `DEFAULT_VITAL_THRESHOLDS` exposes exactly six vitals (§1
table); **FiO2 has no entry.** This is notable precisely because FiO2 is
one of only five parameters `units_normalizer.py` actually implements
(`units-normalization-review.md` §2) and is the single most-cited unit
hazard in this whole review (SYS-01, ~100×). The frontend's
`useThreshold` hook (this endpoint's only documented consumer,
`reference_ranges.py:1-6, 92-94`) therefore has **no server-declared
plausible range for FiO2 at all** — any client-side FiO2 display logic is
unanchored to any reference value this endpoint provides.

**Verdict: REJECT** (coverage gap); **VALIDATION REQUIRED** on whether
FiO2 (and, by the same logic, PaCO2/PaO2/lactate/bilirubin — all reviewed
in `units-normalization-review.md`) belong in this endpoint's exposed set
before any V2 successor is built.

## 4. Precision/rounding

OBSERVED: every bound in `DEFAULT_VITAL_THRESHOLDS` and
`DEFAULT_SCORE_BANDS` is a plain integer literal; no rounding or
floating-point formatting logic exists in this file to review beyond what
`thresholds-seed-review.md` already covers for the values themselves.
Nothing additional to flag here.

## 5. Verdict summary (this record)

| Finding | Verdict |
|---|---|
| `respiratory_rate` unit string `"rpm"` | UNCITED — non-standard label, also present in `units-registry.md`'s own design vocabulary; VALIDATION REQUIRED for a named unit-code decision |
| Parameter-name split (English here vs. Portuguese in `units_normalizer.py`) | **REJECT** the current unreconciled split; VALIDATION REQUIRED for one canonical vocabulary |
| FiO2 absent from the exposed reference set | **REJECT** (coverage gap) |
| Endpoint overall (concurring with `thresholds-seed-review.md` §4.2) | **REJECT** — this record's findings are independent, additional grounds for the same verdict already proposed there; not a second, competing review of the same 24 values |

All verdicts: PROPOSAL — AWAITING NAMED CLINICAL REVIEW
(reviewer: rodaquino-OMNI).
