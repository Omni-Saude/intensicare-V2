---
id: REV-NS-00
title: Legacy review — neuro/sedation/ancillary clinical instruments (cycle 1, Task 1) — index and method
label: PROPOSAL
statement: >
  Index of intensivist-rigor review records for the clinical instruments implemented in legacy
  V1 beyond the four aggregate scores: GCS, RASS, NRS, BPS, CAM-ICU/delirium logic, ARDS severity
  enumeration, FOIS, consciousness enums (AVDI-like/AVPU), and sedation/weaning domain logic.
  All verdicts are PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).
provenance:
  source_repo: intensicare (legacy V1, READ-ONLY mount at /Users/familia/intensicare)
  path_or_url: docs/05-clinical-safety/legacy-review/neuro-sedation-scores/
  commit_sha_or_version: legacy pinned at 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79 (2026-08-15); per-file SHA-256 in docs/archive/legacy-provenance/legacy-pin-cycle-1.md
  section_or_lines: whole directory
  date_collected: 2026-08-15
  collector: legacy neuro/sedation instrument forensics reviewer (cycle 1, Task 1); accountable reviewer rodaquino-OMNI
  transformation: index and method summary; per-instrument evidence lives in the individual records
  confidence: high
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  requirements: [SAF-0001, SAF-0002]
  hazards: [HAZ-0005, HAZ-0036]
  adrs: []
  tests: []
  pr: null
supersedes: null
superseded_by: null
---

# Legacy review — neuro/sedation/ancillary instruments (index)

## 1. Scope and method

OBSERVED: the legacy repository `/Users/familia/intensicare` was reviewed READ-ONLY at git
HEAD `1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79` (2026-08-15). Every cited file was hashed at
read time (`shasum -a 256`) and compared against the cycle-1 pin manifest
(`docs/archive/legacy-provenance/legacy-pin-cycle-1.md`). All cited `src/`, `_work/alerts/`,
and `docs/rules/` files MATCHED the manifest. Six cited files are **absent from the manifest**
and are hash-noted in §4 below per the hash-and-note rule.

Each record follows the mandated structure: (1) as-implemented verbatim with `path:line` and
SHA-256; (2) published instrument with primary citations; (3) discrepancy analysis
(enumeration completeness/ordering, ranges, units, cut-points, missing-data behavior, adult
population applicability per `docs/02-users-and-workflows/g1-validation-backlog.md`
VAL-0006/VAL-0007); (4) for GCS, the mandatory sedation/intubation confounding analysis with
"INPUT TO ADR"; (5) HAZ-0005 zero-coercion check from source; (6) verdict per
`docs/00-governance/legacy-import-policy.md` §4.

IMPORTANT provenance caveat (OBSERVED): the extracted rule catalog
(`docs/rules/clinical-scoring/` in the legacy repo) documents an **older predecessor codebase**
(`ahlabs-trilhas` and `trilhas-frontend` snapshots) that is **not mounted** in the pinned
legacy repository. Where an instrument exists only in that catalog (FOIS, the SDRA enum, the
piora/sepse consciousness rules), the review is limited to the catalog as secondary evidence
and says so explicitly. The V1 Python service layer (`src/intensicare/`) is the primary,
directly verified source.

## 2. Records

| Record | Instrument | Headline verdict (PROPOSAL) |
|---|---|---|
| `REV-NS-01-gcs.md` | Glasgow Coma Scale + downstream consumers, **including the mandatory GCS-under-sedation/intubation analysis and INPUT TO ADR** | TRANSFORM |
| `REV-NS-02-rass.md` | RASS (Richmond Agitation-Sedation Scale) | REFINE |
| `REV-NS-03-nrs.md` | NRS pain 0-10 | REFINE |
| `REV-NS-04-bps.md` | BPS behavioural pain 3-12 | REFINE |
| `REV-NS-05-cam-icu.md` | CAM-ICU / delirium logic | REFINE (forms path REJECT) |
| `REV-NS-06-ards-severity.md` | SDRA/ARDS severity enumeration | SUPERSEDE |
| `REV-NS-07-fois.md` | FOIS (Functional Oral Intake Scale) | VALIDATE (primary source not mounted) |
| `REV-NS-08-consciousness-enums.md` | AVDI-like consciousness enums, AVPU/ACVPU handling | TRANSFORM (one REJECT) |
| `REV-NS-09-sedation-weaning-domain.md` | Sedation/weaning (desmame) domain logic and pathway instrument usage | REFINE (specific REJECTs) |

All verdicts: **PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).**

## 3. Cross-cutting findings (summary; evidence in the records)

1. **HAZ-0005 zero-coercion is live in V1 for the neuro instruments.** Missing GCS scores 0
   in SOFA CNS and qSOFA mentation ("missing" recorded but not elevated); missing RASS is
   coerced to 0 = "Alerta e calmo" in the clinical-forms engine; absent CAM-ICU features
   default to a negative screen; missing AVPU scores 0 in MEWS/NEWS2 consciousness.
2. **No sedation/intubation handling for GCS anywhere in V1** — no "T"/"NT" designation, no
   RASS gating, no verbal substitution; only a commented-out placeholder
   (`glasgow_intubated_block`). See REV-NS-01 §4 (INPUT TO ADR).
3. **A whole sedation/delirium alert module is dead code**: `domain_pharmaco_delirium.py`
   imports a nonexistent `maezo` package; the legacy repo's own `pyproject.toml` documents
   this and excludes the tests. Its RASS/CAM-ICU evaluators never run in production.
4. **The predecessor catalog documents severe pain-instrument bugs** (severe-pain bands
   unreachable via `7 <= dor > 10`-style misparse; an inverted consciousness-deterioration
   comparison firing on improvement) — retained here as REJECT-with-documentation so they are
   not re-proposed.
5. **Population**: every instrument in this cluster is adult-validated. V1 nowhere gates by
   age; this maps to VAL-0006/VAL-0007 and HAZ-0036 (intended-use expansion).

## 4. Hash addendum — cited files ABSENT from the cycle-1 manifest

OBSERVED, hashed in place 2026-08-15 at legacy HEAD `1dc1ea6…` (hash-and-note rule; paths
relative to `/Users/familia/intensicare/`):

```text
716a9354b75face954281e215ee8f21d2d895cbab2ab2a31b159d561a2c4d800  pyproject.toml
b5f0371333331b8ee45d4e4355902fa9da14773282c375f8d1dd959ad659a627  docs/plan/_work/alerts/neuro-sedation.yaml
20f27aea93662d16276c988899a83018829095612f40fdaa40a3f761efe634a6  tests/test_domain_sedacao.py
33ac907a5922170769b2c6ad0582f69db1033f5b532682444407c609778053e2  tests/test_domain_formularios.py
ed463f369f95d1a2ecd1766b5f095b149f78815a35b0927cdb43d590b3465e13  tests/test_qsofa.py
95278fe50179a4f7904eacb256285472f51cf86ea3bfbf6c92a5890ab42610c7  tests/test_sofa.py
a971ffc31f3c9ffffd3cfe861fae82e4914433a1660cf200e622a4f98ae443b6  tests/test_mews.py
```

All other files cited in this directory match the pin manifest hashes exactly (verified
2026-08-15).

## 5. Boundary with concurrent workstreams

The deep score-side review of MEWS/NEWS2/SOFA/qSOFA aggregates and the pathway-structure
review belong to other cycle-1 workstreams. This directory covers those files **only** as
consumers of GCS/AVPU/RASS inputs, and cross-references them by path rather than duplicating
their analysis.
