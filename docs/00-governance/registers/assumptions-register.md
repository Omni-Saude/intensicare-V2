---
doc_id: GOV-ASSUMPTIONS-REGISTER
status: OPEN
owner: UNASSIGNED — VALIDATION REQUIRED
source: Orchestrator-collected facts, 2026-08-14; format per ../evidence-notation.md
last_updated: 2026-08-14
---

# Assumptions Register

Every row is an INFERENCE or PROPOSAL standing in for an unverified fact. Each
must have a named validation path and, once staffed, a named owner. No
assumption in this register may be silently treated as fact — see
`../evidence-notation.md` §2, rule 3–4.

## ASM-0001 — GitHub App installation vs OAuth token discrepancy

- **Label:** INFERENCE (reasoned from `EVID-0007` and
  `INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:243-244,87`)
- **Statement:** The orchestrator prompt states that the AMH repository "was
  inspected through the GitHub App installation" and that Gate G0 requires
  "access through the GitHub App installation owned by `rodaquino-OMNI`" to be
  revalidated. What was actually observed (`EVID-0007`) is a `gh` CLI OAuth
  token on account `rodaquino-OMNI` with scopes `gist`, `read:org`, `repo`,
  `workflow` — not confirmation of a GitHub App installation. **This is an
  assumed equivalence that has not been validated**; an OAuth token and an App
  installation are different access mechanisms with different revocation,
  scope, and audit properties.
- **Why it matters:** Gate G0 cannot be closed on the basis of OAuth access
  alone if the governing prompt specifically requires App-installation access.
  Continuing to treat them as interchangeable risks an access-control gap
  going unnoticed (e.g. different effective permissions, different
  installation-level repository restrictions).
- **Validation required:** Confirm whether a GitHub App installation exists
  for `rodaquino-OMNI` on `Omni-Saude/amh-data-platform`, and if so, whether it
  or the OAuth token was actually used for prior AMH inspection. If no App
  installation exists, the prompt's Gate G0 access-method description and the
  actual access mechanism must be reconciled by a named human authority.
- **Owner:** UNASSIGNED — VALIDATION REQUIRED (`AUTH-DATA-PLATFORM` per
  `../authority-model.md`, jointly with `AUTH-SECURITY`)
- **Provenance:**
  - `source_repo`: `intensicare-V2` (this task packet) and
    `INTENSICARE_V2_ORCHESTRATOR_PROMPT.md`
  - `path_or_url`: `INTENSICARE_V2_ORCHESTRATOR_PROMPT.md`
  - `commit_sha_or_version`: n/a (prompt text, not a pinned artifact)
  - `section_or_lines`: `INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:87,243-244`
  - `date_collected`: 2026-08-14
  - `collector`: orchestrator / this governance steward
  - `transformation`: cross-referenced two statements to surface the discrepancy
  - `confidence`: high (the discrepancy itself is clearly documented); low
    (whether it is materially significant, pending validation)
  - `validation_status`: VALIDATION REQUIRED
- **Links:** `registers/blockers-register.md` `BLK-0009`.

## ASM-0002 — AMH `main` will not drift during cycle 0

- **Label:** PROPOSAL / assumption of convenience
- **Statement:** It is assumed, for planning purposes only, that
  `Omni-Saude/amh-data-platform@main` will not drift materially from the
  pinned evidence snapshot `0a07a6f1fab36fb2f5eeee0fcd8e945c95f67116`
  (`EVID-0005`) during the remainder of cycle 0. This assumption **must be
  re-verified (re-pinned) at execution time** for every gate, contract
  decision, and compatibility claim — a point-in-time match on 2026-08-14 is
  not evidence about any later date.
- **Why it matters:** AMH is an actively developed external repository not
  under IntensiCare V2's control. ADRs, FHIR profiles, or the Maezo manifest
  could change at any time. Any V2 decision that cites AMH content must
  re-confirm the commit SHA at the time of that decision, not rely on this
  register entry.
- **Validation required:** Re-pin and diff `main` against
  `0a07a6f1fab36fb2f5eeee0fcd8e945c95f67116` immediately before any
  compatibility-dependent decision (Gate G3 and beyond), and record the result
  as a new `EVID-*` entry.
- **Owner:** UNASSIGNED — VALIDATION REQUIRED (`AUTH-DATA-PLATFORM`)
- **Provenance:**
  - `source_repo`: `Omni-Saude/amh-data-platform`
  - `path_or_url`: repository `main` branch
  - `commit_sha_or_version`: baseline `0a07a6f1fab36fb2f5eeee0fcd8e945c95f67116`
  - `section_or_lines`: n/a
  - `date_collected`: 2026-08-14
  - `collector`: this governance steward (assumption stated, not verified)
  - `transformation`: none — explicit statement of an unverified forward-looking assumption
  - `confidence`: medium (reasonable default, not evidence)
  - `validation_status`: VALIDATION REQUIRED (recurring — re-check at each phase gate, per `INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:245`)
- **Links:** `registers/evidence-register.md` `EVID-0005`, `EVID-0006`; Gate G3.

## ASM-0003 — Legacy assessment line citations accurate pending verification

- **Label:** PROPOSAL / assumption of convenience
- **Statement:** The orchestrator prompt cites specific line ranges within
  `INTENSICARE_TECHNICAL_ASSESSMENT.md` (e.g. lines 19-42, 94-152, 229-241,
  298-316, 639-647, 318-357, 759-767, 375-386, 709-727, 435-459, 779-787,
  461-499, 564-602, 729-737, 850-887, 889-940, 993-1029 — see
  `INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:74-85`). This register assumes those
  citations accurately reflect the current content of the legacy file at
  `/Users/familia/intensicare/INTENSICARE_TECHNICAL_ASSESSMENT.md`
  (`EVID-0003`). **This has not been independently re-verified line-by-line by
  this steward.**
- **Why it matters:** The legacy assessment is explicitly "a risk-informed
  input, not authority" (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:72`). If any
  cited line range has drifted (e.g. the legacy file was edited after the
  prompt was authored) or was mis-transcribed, downstream specialists could
  build requirements or hazards on a misquoted source.
- **Validation required:** Any specialist relying on a specific legacy-line
  citation must re-open the legacy file and re-confirm the cited content
  before treating it as SOURCE evidence, per `../evidence-notation.md`.
- **Owner:** UNASSIGNED — VALIDATION REQUIRED (whichever `AUTH-*` role owns
  the requirement/hazard/decision built on the citation)
- **Provenance:**
  - `source_repo`: `intensicare` (legacy)
  - `path_or_url`: `/Users/familia/intensicare/INTENSICARE_TECHNICAL_ASSESSMENT.md`
  - `commit_sha_or_version`: not recorded — legacy repo has no pinned commit cited in the orchestrator prompt for this file
  - `section_or_lines`: multiple, see statement above
  - `date_collected`: 2026-08-14
  - `collector`: this governance steward (assumption stated, not verified)
  - `transformation`: none
  - `confidence`: medium
  - `validation_status`: VALIDATION REQUIRED
- **Links:** `registers/evidence-register.md` `EVID-0003`, `EVID-0004`.

## Index

| ID | Assumption (short) | Type | Validation status | Owner |
|---|---|---|---|---|
| ASM-0001 | GitHub App installation vs OAuth token discrepancy | INFERENCE | VALIDATION REQUIRED | UNASSIGNED |
| ASM-0002 | AMH `main` will not drift during cycle 0 | PROPOSAL | VALIDATION REQUIRED (recurring) | UNASSIGNED |
| ASM-0003 | Legacy assessment line citations accurate | PROPOSAL | VALIDATION REQUIRED | UNASSIGNED |
