---
id: LEGREV-ALTB-INDEX
title: Legacy review — V1 alert-and-threshold engine (cycle 1, Task 1) — index
label: PROPOSAL
status: PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI)
statement: >
  Index and provenance record for the cycle-1 forensic review of the legacy
  (V1) alert generation, severity/bed-state derivation, threshold
  configuration, and alert-precedence logic. Every finding in this directory
  is a PROPOSAL; nothing is imported, selected, or ratified.
provenance:
  source_repo: intensicare (legacy V1, READ-ONLY)
  path_or_url: https://github.com/Omni-Saude/intensicare
  commit_sha_or_version: 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79 (HEAD at pin time; per-file SHA-256 below)
  section_or_lines: see per-record citations
  date_collected: 2026-08-15
  last_updated: 2026-08-15
  collector: rodaquino-OMNI (legacy alert-and-threshold engine forensics reviewer, cycle 1 Task 1)
  transformation: >
    Read from source; summarized and analyzed. No legacy code, schema, rule,
    threshold, or YAML content is imported by this review.
  confidence: high (mechanical citations) / medium (clinical assessments)
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  hazards: [HAZ-0005, HAZ-0015, HAZ-0016, HAZ-0017, HAZ-0021, HAZ-0022, HAZ-0036]
  adrs: []
  pr: null
supersedes: null
superseded_by: null
---

# Legacy review — alert-and-threshold engine (index)

> **PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).**
> Per `docs/00-governance/legacy-import-policy.md` §1 the default is **do not
> copy**. These records document what the legacy system does, verified from
> source, and propose per-artifact verdicts. No verdict here is self-executing.

## Records in this directory

| Record | Scope |
|---|---|
| `engine-review.md` | Alert generation (`alert_engine.py`), bed-severity derivation and the floor-to-normal mechanism (`dashboard.py`), severity model (`schemas/severity.py`), precedence/rollup (`domain_alertas.py` + rule cluster), cooldown/dedup/grouping, correlation engine, alert compiler, notification worker, clinical copy, alert API |
| `thresholds-seed-review.md` | Threshold configuration model/resolver/API, migration `0038` seeded clinical threshold values reviewed against published sources, `reference_ranges.py` hardcoded defaults, governance findings marked **INPUT TO ADR-0007** |
| `alert-threshold-cluster-review.md` | Cluster-level review of `docs/rules/alert-threshold/` (116 rule records) with a per-rule disposition table |

## Provenance discipline

- Legacy repo pinned at git HEAD `1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79`
  (2026-08-15). Because clinical content includes untracked working-tree
  files, **every cited file is verified by SHA-256** against
  `docs/archive/legacy-provenance/legacy-pin-cycle-1.md` (the cycle-1 pin
  manifest). Files absent from the manifest are hashed here ("hash-and-note").
- OBSERVED (2026-08-15): all 23 engine/model/schema/API/seed files cited by
  these records match the manifest hashes. Five cited artifacts are **not**
  in the manifest and are hash-and-noted below.

### Hash-and-note (absent from the cycle-1 manifest)

SHA-256 computed 2026-08-15 over the working tree at the pinned HEAD; paths
relative to `https://github.com/Omni-Saude/intensicare`:

```text
0e748e0fb19a1aeee884f270f228367bff9663f9135cf50ee43ade7d82d81044  docs/adr/0014-no-abnormal-value-threshold-flagging.md
4149c15cacdda78f9b5a66ddd9092e33cde2cadb3c2bdd70db20b18e648b30f9  tests/test_threshold_resolver.py
b72ddec4201e42948e5b43c2f0c5d94a0f2e278df431dcc4a2d26371d9e15571  tests/test_thresholds.py
712d9ccde209d099f80c4d5abb11e77e33564e03f347f931a363537c1031e9b8  docs/plan/_work/alerts/early-warning-scores.yaml
51336b4cdce32905270b7dcb241824083c4003142527a8d7b71e6e576dbab06b  docs/plan/_work/alerts/correlation-engine.yaml
```

## Headline findings (detail and citations inside the records)

1. **Floor-to-normal located in code**: `derive_bed_severity`
   (`src/intensicare/services/dashboard.py:93-115`, floor at line 115)
   renders an unscored/unevaluated bed as `normal`. Verdict: **REJECT** the
   pattern (HAZ-0005; candidate-inventory 1.1g confirmed at source level).
2. **Assistido (attended) precedence masks severity** at bed, pathway, and
   sector level (RULE-ALERTAS-011, RULE-TRILHAS-ENGINE-004,
   RULE-INDICADORES-ETL-002/006). Verdict: **REJECT** the override;
   **TRANSFORM** acknowledgement display (state alongside severity, never
   replacing it).
3. **Silent suppression without record** on the live alert path (missing
   config, rate limit, cooldown, missing patient cache) — HAZ-0021/0022.
4. **SOFA/qSOFA are scored and routed to the alert engine but have no seeded
   thresholds**, so they can never alert under default configuration, with no
   recorded no-fire reason.
5. **Duplicated, divergent threshold resolution**: the live alert path does
   not use `threshold_resolver.resolve_threshold` and implements different
   (and defective) scope semantics.

All of the above are PROPOSALS pending named clinical review.
