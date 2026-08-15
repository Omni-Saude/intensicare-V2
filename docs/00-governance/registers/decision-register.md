---
doc_id: GOV-DECISION-REGISTER
status: OPEN
owner: UNASSIGNED — VALIDATION REQUIRED
source: format per ../evidence-notation.md; ID scheme per ../traceability-policy.md
last_updated: 2026-08-15
---

# Decision Register

This register is the durable home for every governance decision — both
pending PROPOSALs and, once a named human authority accepts them, DECIDED
entries. No agent may write a `DECIDED` row; only a named human authority may
(`../evidence-notation.md` §2, rule 3; §4). This governance-steward task is
explicitly prohibited from approving any policy — every entry created in this
session is therefore `status: PROPOSAL`.

## Entry template

```yaml
id: GDEC-NNNN
title: <short title>
status: PROPOSAL | DECIDED | REJECTED | SUPERSEDED
statement: >
  <what is being decided>
decided_by: <named human authority, or UNASSIGNED — VALIDATION REQUIRED>
decided_date: <YYYY-MM-DD, or n/a while PROPOSAL>
rationale: >
  <why, required once DECIDED>
supersession_rule: >
  <what would trigger revisiting this, required once DECIDED>
links:
  requirements: []
  hazards: []
  adrs: []
provenance:
  source_repo: intensicare-V2
  path_or_url: <path>
  commit_sha_or_version: <sha>
  section_or_lines: <ref>
  date_collected: <YYYY-MM-DD>
  collector: <name/role>
  transformation: none
  confidence: low | medium | high
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED | VALIDATED | N/A
```

## GDEC-0001 — Use of `cycle-0/spark-foundation` branch and `docs/` hierarchy

```yaml
id: GDEC-0001
title: Adopt cycle-0/spark-foundation as the Phase 0 work branch and docs/ as the canonical documentation hierarchy
status: PROPOSAL
statement: >
  Propose that IntensiCare V2 Phase 0 (Authority/access/bootstrap) work
  proceeds on branch `cycle-0/spark-foundation`, and that the documentation
  hierarchy under `docs/` follows exactly the structure specified in
  INTENSICARE_V2_ORCHESTRATOR_PROMPT.md section 16 (00-governance through
  16-validation-backlog, plus archive/legacy-provenance), adaptable only
  through a future ADR. This governance-steward task has created
  docs/00-governance/ per that structure as the first instance of it.
decided_by: UNASSIGNED — VALIDATION REQUIRED
decided_date: n/a
rationale: >
  n/a — not yet decided. Rationale to be supplied by the named authority who
  accepts or rejects this proposal.
supersession_rule: >
  n/a — not yet decided. To be defined at acceptance (a candidate trigger,
  not yet agreed: any structural change to the docs/ hierarchy must be
  proposed as an ADR under docs/06-architecture/adrs/, not made ad hoc).
links:
  requirements: []
  hazards: []
  adrs: []
provenance:
  source_repo: intensicare-V2
  path_or_url: INTENSICARE_V2_ORCHESTRATOR_PROMPT.md
  commit_sha_or_version: n/a (prompt text, not a pinned artifact; repo commit cb35521 at time of writing)
  section_or_lines: "INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:902-950 (§16 Documentation architecture)"
  date_collected: 2026-08-14
  collector: governance-and-traceability bootstrap steward
  transformation: none — structure taken verbatim from prompt §16
  confidence: high
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
```

## GDEC-0002 — Taxonomy-extension ratification needed

```yaml
id: GDEC-0002
title: Ratify or reject the proposed ID-prefix extensions to traceability-policy.md §1
status: PROPOSAL
statement: >
  Multiple specialists have minted ID prefixes beyond the 17-prefix taxonomy
  in ../traceability-policy.md §1 (which already documents this steward's own
  EVID/ASM/GDEC/BLK extensions): THR (threat-model.md, THR-0001..0067), CRV
  (clinical-reference-vector-standard.md), QAS (quality-attribute-scenarios.md,
  document-local, QAS-0001..0029), IDP/IDN (identity-adjudication/, non-
  conformant ID formats), and document-local NIU/SM/HM/WF/UR labels
  (01-vision-and-intended-use/, 02-users-and-workflows/). SEC-catalog usage
  (security-controls-catalog.md, SEC-0001..0050) was checked and found
  consistent with the already-ratified SEC prefix — no action needed there.
  A VAL-numbering collision risk was also flagged: VAL-0001..0043 is minted
  concurrently in 01-vision-and-intended-use/02-users-and-workflows and in
  05-clinical-safety/pathway-portfolio/, with no central VAL register to
  coordinate the next-available number. Full detail:
  ../traceability-policy.md §1.1. This decision proposes that a named human
  authority either (a) ratify each extension into §1 as a permanent prefix,
  (b) direct conversion of a prefix's content into an existing ratified
  prefix (e.g. QAS -> NFR, per Option A recorded there), or (c) reject a
  prefix and direct its minting document to be reworked. No option is
  selected here.
decided_by: UNASSIGNED — VALIDATION REQUIRED
decided_date: n/a
rationale: >
  n/a — not yet decided. Rationale to be supplied by the named authority who
  accepts, rejects, or partially accepts this proposal per prefix.
supersession_rule: >
  n/a — not yet decided. Candidate trigger (not yet agreed): any further
  undocumented prefix discovered after this decision should reopen it rather
  than start a parallel GDEC entry.
links:
  requirements: []
  hazards: []
  adrs: []
provenance:
  source_repo: intensicare-V2
  path_or_url: docs/00-governance/traceability-policy.md
  commit_sha_or_version: n/a (created this session, uncommitted)
  section_or_lines: "traceability-policy.md §1.1 (Proposed prefix extensions — PENDING RATIFICATION)"
  date_collected: 2026-08-15
  collector: governance-and-traceability bootstrap steward
  transformation: consolidated from six specialists' self-flagged prefix gaps into one decision
  confidence: high
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
```

## Index

| ID | Title | Status | Decided by | Decided date |
|---|---|---|---|---|
| GDEC-0001 | Adopt `cycle-0/spark-foundation` branch and `docs/` hierarchy | PROPOSAL | UNASSIGNED — VALIDATION REQUIRED | n/a |
| GDEC-0002 | Ratify or reject proposed ID-prefix extensions (THR, CRV, QAS, IDP/IDN, NIU/SM/HM/WF/UR) | PROPOSAL | UNASSIGNED — VALIDATION REQUIRED | n/a |

## Notes

- This register starts empty of `DECIDED` entries by design: this task's
  `decisions_prohibited` forbids approving any policy. Every entry above is a
  `PROPOSAL` awaiting a named human authority per `../decision-rights.md`.
- Future entries should be appended with the next sequential `GDEC-NNNN` ID
  per `../traceability-policy.md` §2.
