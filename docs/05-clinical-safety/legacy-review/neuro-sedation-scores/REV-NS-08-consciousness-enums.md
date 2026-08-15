---
id: REV-NS-08
title: Legacy review — consciousness enums (AVDI-like ladder, AVPU/ACVPU handling, graded consciousness sub-scores)
label: PROPOSAL
statement: >
  The predecessor's 7-item AVDI-like consciousness enum, its custom ordinal severity ladder,
  and its graded +/- sub-scores match no published scale; one consumer's deterioration
  detector is direction-inverted (fires on improvement). V1 src replaces these with
  ACVPU-validated capture but scores missing AVPU as 0 in MEWS/NEWS2 and silently scores the
  stored "C" (confusion) value as 0 in MEWS. Verdict: TRANSFORM, with the inverted
  comparator REJECTED. PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).
provenance:
  source_repo: intensicare (legacy V1, READ-ONLY)
  path_or_url: src/intensicare/services/mews.py; src/intensicare/services/news2.py; src/intensicare/schemas/vitals.py; docs/rules/clinical-scoring/ (SEPSE-005/-033, PIORA-CLINICA-005, BALANCO-HIDRICO-059)
  commit_sha_or_version: 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79 (per-file SHA-256 in §1; MATCH against legacy-pin-cycle-1.md unless noted)
  section_or_lines: cited per finding
  date_collected: 2026-08-15
  collector: legacy neuro/sedation instrument forensics reviewer (cycle 1, Task 1); accountable reviewer rodaquino-OMNI
  transformation: verbatim excerpts plus reviewer analysis
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

# REV-NS-08 — Consciousness enums and AVPU/ACVPU handling

## 1. As implemented (OBSERVED, verbatim)

| Path | Lines | SHA-256 | Manifest |
|---|---|---|---|
| `src/intensicare/schemas/vitals.py` | 13, 79-88 | `f6afffd444038f2d1dec19d7047a0013f908d9a7106c52ce9895cbc1ba14308f` | MATCH |
| `src/intensicare/models/vital_sign.py` | 37 | `4a145e9b4135fd943043d96c5efe3a3981f84053f78710b0f6fe66bd126d4a12` | MATCH |
| `src/intensicare/services/mews.py` | 151-165, 199-223 | `43f7a8e17a31ea21f61ec53b2bcee68ff64067387c687e23714382f4737e922c` | MATCH |
| `src/intensicare/services/news2.py` | 213-224, 288 | `d3399fe2bb9853222dde6b16167a4f6093c6daac7b1559474b628deeff246bc8` | MATCH |
| `src/intensicare/models/deterioration.py` | 16 | `36934798b1c26526c9cc4759b6d58221bb0329a0cb1be2f4f83cea489d5bdb27` | MATCH |
| `docs/rules/clinical-scoring/RULE-BALANCO-HIDRICO-059-…md` | whole file | `09d8a768bdb09cd23c82fc48eb71fbe278d53207fe4b8a448c4a0124833f4ddb` | MATCH |
| `docs/rules/clinical-scoring/RULE-SEPSE-005-…md` | whole file | `6fcbf6895b4c221d673b8f5aa20be0fc596456430236fea4066685836a2fbfb9` | MATCH |
| `docs/rules/clinical-scoring/RULE-SEPSE-033-…md` | whole file | `fe602cb8e0f12bba4878298bd3574ff42ccec0fbcadea66bae508b17d4837c3c` | MATCH |
| `docs/rules/clinical-scoring/RULE-PIORA-CLINICA-005-…md` | whole file | `f8ae36b45f8a925c7cd73708515b9228d6e4dab96eb8843e3b57df90e3c9bc38` | MATCH |
| `tests/test_mews.py` | 139-165 | see README §4 | ABSENT (hash-noted) |

### 1.1 V1 src — ACVPU capture, AVPU-map scoring

- Capture: `schemas/vitals.py:13` — `AVPU_VALUES = frozenset({"A", "C", "V", "P", "U"})`
  (ACVPU, including C = new confusion); validator (`:79-88`) normalises case and rejects
  anything else. Stored as `String(4)` (`models/vital_sign.py:37`).
- NEWS2 (`news2.py:213-224`), verbatim: `if avpu is None: return 0`; `"A" → 0`; anything
  else → 3. So C/V/P/U → 3 (correct NEWS2 behaviour) but **missing → 0 = Alert-equivalent**.
- MEWS (`mews.py:151-165`): `None → {"avpu": 0, "avpu_status": "missing"}` (zero plus
  side-band metadata); `avpu_map = {"A": 0, "V": 1, "P": 2, "U": 3}`;
  `pts = avpu_map.get(upper, 0)` — **the stored, schema-valid value "C" is not in the map
  and silently scores 0 (Alert)**. Test suite fixes the A/V/P/U mapping only
  (`tests/test_mews.py:139-165`).

### 1.2 Predecessor catalog (secondary evidence; `ahlabs-trilhas` source not mounted)

- RULE-BALANCO-HIDRICO-059: 7-item capture enum `acordado, sonolencia, agitacao,
  reage_verbal, reage_tatil, coma, convulsao` — AVDI-like but with three members
  (sonolência, agitação, convulsão pós-ictal) that exist in no published reactivity ladder;
  catalog verdict UNVERIFIABLE.
- RULE-SEPSE-005: custom ordinal severity `{acordado:1, sonolencia:2, agitacao:3,
  convulsao:3, reage_verbal:4, reage_tatil:5, coma:6}`; agitação/convulsão tie at 3, so a
  transition between them registers no change; unmapped value → None.
- RULE-SEPSE-033 (**direction-inverted comparator**): the sepsis "variação do nível de
  consciência" criterion returns `anterior > atual` on that ladder — since higher rank =
  worse, it **fires on clinical improvement and stays silent on deterioration**
  (awake→coma returns False). Catalog impact: moderate; recorded verbatim there.
- RULE-PIORA-CLINICA-005: graded sub-score mapping the enum to `"1+/2+/3+"` (reactivity
  ladder) and `"1-/2-/3-"` (sonolência/agitação/convulsão), with `acordado` **and any
  unmapped value** → `"0"`. The `+/-` result type survives into V1:
  `models/deterioration.py:16` — `score: String(4), comment "0, 1+, 1-, 3+, 3-"`.

## 2. Published instruments (SOURCE)

- AVPU: 4 ordinal states (Alert / responds to Voice / responds to Pain / Unresponsive);
  bedside comparison against GCS: McNarry AF, Goldhill DR. Anaesthesia. 2004;59(1):34-37.
- ACVPU with "C = new confusion" and the consciousness weighting (A=0, any of C/V/P/U=3) is
  defined by NEWS2: Royal College of Physicians. *National Early Warning Score (NEWS) 2.*
  London: RCP, 2017.
- MEWS consciousness (AVPU 0-3 graded): Subbe CP et al. QJM. 2001;94(10):521-526.
- The 7-item enum, the 1-6 ladder, and the `+/-` sub-scores match **no** published
  instrument (catalog concurs).

## 3. Discrepancy analysis

| Dimension | Finding | Label |
|---|---|---|
| Enumeration completeness | V1 capture is full ACVPU; MEWS's scoring map covers only AVPU, so one schema-valid member ("C") falls through to 0 — a valid stored abnormal state scored as normal. | OBSERVED |
| Ordering | Predecessor ladder is monotonic but unvalidated; the agitação/convulsão tie erases transitions; `reage_verbal` ranks *worse* than `agitacao`, which no published ladder supports. | OBSERVED / INFERENCE |
| Cut-points | NEWS2 A-vs-rest weighting (3 points) matches RCP 2017; MEWS V/P/U 1/2/3 matches Subbe. | OBSERVED |
| Missing data | NEWS2 missing → 0 with no marker at all; MEWS missing → 0 with a side-band `avpu_status` no consumer elevates. Both are HAZ-0005. | OBSERVED |
| Direction | RULE-SEPSE-033 comparator inverted (fires on improvement). | SOURCE (catalog) |
| Result typing | The `0/1+/1-/3+/3-` string score is a bespoke, orderless type (is "1-" worse than "1+"? undefined), carried into a V1 persisted column. | OBSERVED |
| Population | MEWS/NEWS2/AVPU weightings are adult-validated → VAL-0006/0007, HAZ-0036. | INFERENCE |

## 4. HAZ-0005 zero-coercion check (from source)

**VIOLATION — three live instances in V1 src.** (a) `news2.py:219-220` missing AVPU → 0
consciousness points, indistinguishable from documented Alert; (b) `mews.py:159-160`
missing → 0 with non-elevated metadata; (c) `mews.py:162-164` unknown-but-valid "C" → 0 via
`dict.get(default=0)`. Predecessor additions: unmapped enum value → "0" sub-score
(PIORA-005) and the inverted comparator (SEPSE-033), which converts real deterioration into
silence — functionally the same false-reassurance harm.

## 5. Verdict

**TRANSFORM** overall — V2 should standardise consciousness capture on a single validated
vocabulary (ACVPU per NEWS2, with GCS as the granular instrument per REV-NS-01), derive all
score contributions from that one source, and make missing/unknown values unrepresentable
as 0 (evaluation-status instead). The predecessor 7-item enum, 1-6 ladder, and `+/-`
sub-score typing are documented for context only.
**REJECT** (do-not-reimport, with negative tests): the RULE-SEPSE-033 inverted comparator;
`dict.get(…, 0)`-style default scoring of consciousness values; missing→0 in MEWS/NEWS2
consciousness. The MEWS "C"→0 fall-through must be fixed in any interim use.

**PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).**
