---
id: REV-NS-07
title: Legacy review — FOIS (Functional Oral Intake Scale)
label: PROPOSAL
statement: >
  FOIS has no implementation in V1 src; it exists only in the predecessor rule catalog
  (7-level enum whose labels match Crary 2005, with a level-6 source typo), captured in
  frontend/homecare code that is not mounted in the pinned legacy repository. Review beyond
  the catalog is not possible. Verdict: VALIDATE.
  PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).
provenance:
  source_repo: intensicare (legacy V1, READ-ONLY)
  path_or_url: docs/rules/clinical-scoring/RULE-CLINICAL-SCORING-018-fois-functional-oral-intake-scale-enumeration.md; docs/rules/clinical-scoring/RULE-NUTRICAO-002-fois-functional-oral-intake-scale-enum-of-7-levels.md
  commit_sha_or_version: 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79 (per-file SHA-256 in §1; MATCH against legacy-pin-cycle-1.md)
  section_or_lines: whole files
  date_collected: 2026-08-15
  collector: legacy neuro/sedation instrument forensics reviewer (cycle 1, Task 1); accountable reviewer rodaquino-OMNI
  transformation: verbatim excerpts plus reviewer analysis
  confidence: medium
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  requirements: [SAF-0001]
  hazards: [HAZ-0036]
  adrs: []
  tests: []
  pr: null
supersedes: null
superseded_by: null
---

# REV-NS-07 — FOIS

## 1. As implemented (OBSERVED, with source-location limit)

| Path | Lines | SHA-256 | Manifest |
|---|---|---|---|
| `docs/rules/clinical-scoring/RULE-CLINICAL-SCORING-018-…md` | whole file | `cab66d9ebcdad1a1d1450a41d07cdc2dc2a443caa66e85aaeb224282d200bade` | MATCH |
| `docs/rules/clinical-scoring/RULE-NUTRICAO-002-…md` | whole file | `907a3b0e9d99f7d564023476d3ee5e8f6a8dea86a9ce6bc92e88779e0fb1cf76` | MATCH |

- **V1 `src/intensicare` contains no FOIS implementation** (repository-wide grep for `fois`
  across `src/` at the pinned HEAD: zero hits). The nutrição pathway
  (`_work/alerts/pathways/nutricao.yaml`) does not use FOIS as an input.
- Both catalog records (secondary evidence) document the predecessor capture: a 7-level
  ordinal enum `nivel1..nivel7`, worst→best, with pt-BR labels — `nivel1 Nada por via oral`
  … `nivel7 Via oral total sem restricoes`; frontend speech-therapy form and homecare
  backend choices; a transcription typo in the level-6 label ("oucompensacoes"); no
  computation performed on the value. Verification verdict inside the catalog: VERIFIED
  against Crary 2005, all seven labels and the non-oral (1-3) / total-oral (4-7) partition
  correct.
- **SOURCE NOT LOCATED — cannot review beyond the catalog.** The primary sources the catalog
  cites (`trilhas-frontend src/utils/dataForms/dataFormFonoaudiologo.ts:146-181` and
  `trilha_homecare/models/choices/formulario.py:375-403`, snapshots `f9656be266` /
  `8166c07eae`) are repositories **not mounted** inside `/Users/familia/intensicare` at the
  pinned HEAD. Per the stop condition, no reconstruction is attempted; the enumeration
  content above is attributed to the catalog, not to verified source.

## 2. Published instrument (SOURCE)

- Crary MA, Mann GDC, Groher ME. *Initial psychometric assessment of a functional oral
  intake scale for dysphagia in stroke patients.* Arch Phys Med Rehabil.
  2005;86(8):1516-1520. Seven ordinal levels: 1 nothing by mouth; 2 tube-dependent, minimal
  oral; 3 tube-dependent, consistent oral; 4 total oral, single consistency; 5 total oral,
  multiple consistencies, special preparation; 6 total oral, no special preparation but
  specific restrictions; 7 total oral, no restrictions.

## 3. Discrepancy analysis

| Dimension | Finding | Label |
|---|---|---|
| Enumeration | Per catalog: 7 levels, ordering and labels match Crary 2005 (level-6 typo cosmetic). | SOURCE (catalog) |
| Missing data | Not analysable — no scoring/consumption logic existed; capture-only enum. | OBSERVED |
| Population | FOIS was validated in adult stroke patients; use as a general ICU oral-intake scale (the predecessor context) is itself an intended-use extension needing clinical sign-off; paediatric use out of scope (VAL-0006/0007). | INFERENCE |
| Verifiability | Primary source not mounted → catalog-only confidence (medium). | OBSERVED |

## 4. HAZ-0005 zero-coercion check

Not assessable from available source: no V1 code path consumes FOIS. The catalog shows no
missing-data sentinel inside the enum (unlike SDRA's ''), and no computation to coerce.

## 5. Verdict

**VALIDATE** — the idea (structured FOIS capture for dysphagia/oral-intake tracking) is
plausible and the catalog transcription matches the published scale, but the primary source
is unverifiable at this pin and the intended-use question (general ICU population vs the
validated stroke population) is open. Any V2 adoption requires: re-verification against a
mounted primary source or fresh authoring from Crary 2005, clinical ratification of the ICU
intended use, and evaluation-status semantics for unassessed patients.

**PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).**
