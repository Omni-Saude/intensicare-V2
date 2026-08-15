---
doc_id: GOV-EVIDENCE-REGISTER
status: OPEN
owner: UNASSIGNED — VALIDATION REQUIRED
source: Orchestrator-collected OBSERVED facts, 2026-08-14; format per ../evidence-notation.md
last_updated: 2026-08-14
---

# Evidence Register

Every row is an evidence-notation entry (`../evidence-notation.md` §3). All
entries below were collected 2026-08-14 by the orchestrator and are labeled
**OBSERVED** unless noted otherwise. This register does not accept, reject, or
act on any entry — it only records what was verified and by whom, per this
task's `decisions_prohibited`.

## EVID-0001 — V2 repository independent history

- **Label:** OBSERVED
- **Statement:** The IntensiCare V2 repository exists at
  `/Users/familia/code/intensicare-V2` with independent git history — a single
  initial commit `cb35521` on `main`. Work proceeds on branch
  `cycle-0/spark-foundation`.
- **Provenance:**
  - `source_repo`: `intensicare-V2`
  - `path_or_url`: `.git` (repo root)
  - `commit_sha_or_version`: `cb35521`
  - `section_or_lines`: n/a (repository-level fact)
  - `date_collected`: 2026-08-14
  - `collector`: orchestrator
  - `transformation`: none
  - `confidence`: high
  - `owner`: UNASSIGNED — VALIDATION REQUIRED
  - `validation_status`: VALIDATION REQUIRED (re-verify branch/commit at each phase gate)
- **Links:** `../traceability-policy.md`; supports Gate G0 criterion "the new
  repository exists" (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:243`).

## EVID-0002 — V2 work branch

- **Label:** OBSERVED
- **Statement:** The active work branch is `cycle-0/spark-foundation`.
- **Provenance:**
  - `source_repo`: `intensicare-V2`
  - `path_or_url`: `.git/HEAD`
  - `commit_sha_or_version`: `cb35521` (branch tip at time of collection)
  - `section_or_lines`: n/a
  - `date_collected`: 2026-08-14
  - `collector`: orchestrator
  - `transformation`: none
  - `confidence`: high
  - `owner`: UNASSIGNED — VALIDATION REQUIRED
  - `validation_status`: N/A
- **Links:** `registers/decision-register.md` `GDEC-0001`.

## EVID-0003 — Legacy repository present, read-only, technical assessment

- **Label:** OBSERVED
- **Statement:** The legacy repository is present read-only at
  `/Users/familia/intensicare/`, including
  `INTENSICARE_TECHNICAL_ASSESSMENT.md` (118,287 bytes). Treated as
  risk-informed input, not authority, per
  `INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:72`.
- **Provenance:**
  - `source_repo`: `intensicare` (legacy)
  - `path_or_url`: `/Users/familia/intensicare/INTENSICARE_TECHNICAL_ASSESSMENT.md`
  - `commit_sha_or_version`: not recorded by orchestrator at collection time — VALIDATION REQUIRED
  - `section_or_lines`: whole file (118,287 bytes)
  - `date_collected`: 2026-08-14
  - `collector`: orchestrator
  - `transformation`: none (existence/size check only)
  - `confidence`: high (file presence/size), medium (content not re-verified by this steward)
  - `owner`: UNASSIGNED — VALIDATION REQUIRED
  - `validation_status`: VALIDATION REQUIRED
- **Links:** `../legacy-import-policy.md` §2.

## EVID-0004 — Legacy repository present, read-only, docs intelligence audit

- **Label:** OBSERVED
- **Statement:** The legacy repository also contains
  `INTENSICARE_DOCS_INTELLIGENCE_AUDIT.md` (2,351,029 bytes), present
  read-only.
- **Provenance:**
  - `source_repo`: `intensicare` (legacy)
  - `path_or_url`: `/Users/familia/intensicare/INTENSICARE_DOCS_INTELLIGENCE_AUDIT.md`
  - `commit_sha_or_version`: not recorded by orchestrator at collection time — VALIDATION REQUIRED
  - `section_or_lines`: whole file (2,351,029 bytes)
  - `date_collected`: 2026-08-14
  - `collector`: orchestrator
  - `transformation`: none (existence/size check only)
  - `confidence`: high (file presence/size), medium (content not re-verified by this steward)
  - `owner`: UNASSIGNED — VALIDATION REQUIRED
  - `validation_status`: VALIDATION REQUIRED
- **Links:** `../legacy-import-policy.md` §2;
  `registers/assumptions-register.md` `ASM-0003` (line-citation accuracy).

## EVID-0005 — AMH repository pinned commit, no drift from evidence baseline

- **Label:** OBSERVED
- **Statement:** `github.com/Omni-Saude/amh-data-platform` is private; default
  branch `main`; current `main` HEAD pinned 2026-08-14 =
  `0a07a6f1fab36fb2f5eeee0fcd8e945c95f67116`, which is **identical** to the
  evidence snapshot commit cited in the orchestrator prompt
  (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:89`). No drift between evidence
  baseline and execution commit was observed at collection time.
- **Provenance:**
  - `source_repo`: `Omni-Saude/amh-data-platform`
  - `path_or_url`: `https://github.com/Omni-Saude/amh-data-platform`
  - `commit_sha_or_version`: `0a07a6f1fab36fb2f5eeee0fcd8e945c95f67116`
  - `section_or_lines`: n/a (repository HEAD)
  - `date_collected`: 2026-08-14
  - `collector`: orchestrator (via `gh` CLI / GitHub API)
  - `transformation`: none
  - `confidence`: high
  - `owner`: UNASSIGNED — VALIDATION REQUIRED
  - `validation_status`: VALIDATION REQUIRED — must be re-pinned at execution
    time (see `registers/assumptions-register.md` `ASM-0002`); a point-in-time
    match does not guarantee no drift later in cycle 0.
- **Links:** Gate G0 criterion on pinning AMH commit
  (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:245`).

## EVID-0006 — Maezo published-contract manifest producer commit

- **Label:** OBSERVED
- **Statement:** A Maezo published-contract manifest producer commit
  `09a0a282e69f49aa9c6944b25afb35eee65fcc9c` (dated 2026-08-05) exists in the
  AMH repository. This commit is **different** from the evidence snapshot
  commit `0a07a6f1fab36fb2f5eeee0fcd8e945c95f67116` — the two must not be
  conflated.
- **Provenance:**
  - `source_repo`: `Omni-Saude/amh-data-platform`
  - `path_or_url`: `schemas/contracts/maezo/v1/contract-manifest.yaml`
  - `commit_sha_or_version`: `09a0a282e69f49aa9c6944b25afb35eee65fcc9c`
  - `section_or_lines`: manifest producer-commit field
  - `date_collected`: 2026-08-14 (manifest dated 2026-08-05)
  - `collector`: orchestrator
  - `transformation`: none
  - `confidence`: high
  - `owner`: UNASSIGNED — VALIDATION REQUIRED
  - `validation_status`: VALIDATION REQUIRED
- **Links:** Gate G0 criterion
  (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:245`); does **not** license reuse of
  the Maezo interface — see `INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:104`
  ("V2 must create an AMH×IntensiCare contract rather than reuse Maezo's
  interface").

## EVID-0007 — GitHub access verified via gh CLI OAuth

- **Label:** OBSERVED
- **Statement:** GitHub access was verified via `gh` CLI OAuth on account
  `rodaquino-OMNI`, with token scopes `gist`, `read:org`, `repo`, `workflow`.
- **Provenance:**
  - `source_repo`: n/a (GitHub account/tooling fact)
  - `path_or_url`: `gh auth status` output
  - `commit_sha_or_version`: n/a
  - `section_or_lines`: n/a
  - `date_collected`: 2026-08-14
  - `collector`: orchestrator
  - `transformation`: none
  - `confidence`: high
  - `owner`: UNASSIGNED — VALIDATION REQUIRED
  - `validation_status`: VALIDATION REQUIRED
- **Note:** This fact is distinct from, and does not establish, GitHub App
  installation access. The orchestrator prompt describes access "through the
  GitHub App installation" on `rodaquino-OMNI`
  (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:243-244,87`); what was actually
  observed is a `gh` CLI OAuth token on that account. This discrepancy is
  recorded as `registers/assumptions-register.md` `ASM-0001` and
  `registers/blockers-register.md` `BLK-0009`.
- **Links:** Gate G0 criterion "access ... revalidated"
  (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:244`).

## EVID-0008 — AMH repository license reported NOASSERTION

- **Label:** OBSERVED
- **Statement:** The AMH repository's license, as reported by the GitHub API,
  is `NOASSERTION` — no SPDX license was detected.
- **Provenance:**
  - `source_repo`: `Omni-Saude/amh-data-platform`
  - `path_or_url`: GitHub REST API `licenses` field for the repository
  - `commit_sha_or_version`: `0a07a6f1fab36fb2f5eeee0fcd8e945c95f67116` (repo state at query time)
  - `section_or_lines`: n/a (repository metadata field)
  - `date_collected`: 2026-08-14
  - `collector`: orchestrator
  - `transformation`: none
  - `confidence`: high
  - `owner`: UNASSIGNED — VALIDATION REQUIRED
  - `validation_status`: VALIDATION REQUIRED
- **Consequence:** Recorded as a BLOCKER — license/IP authority for any AMH
  artifact reuse is unestablished. See
  `registers/risk-register.md` `RISK-0002` and
  `registers/blockers-register.md` `BLK-0010`.
- **Links:** `../legacy-import-policy.md` §3.1; Gate G0 criterion "AMH
  license/ownership ... are recorded"
  (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:246`).

## EVID-0009 — Branch protection on `main` not configured; docs-gates checks not enforced

- **Label:** OBSERVED
- **Statement:** As reported by the CI foundation / repository-foundation and
  CI-policy engineer specialist, `main` in `rodaquino-OMNI/intensicare-V2` has
  no branch protection configured. The `Docs Gates` CI workflow
  (`.github/workflows/docs-gates.yml`, jobs `doc-conventions` and
  `forbidden-content`) runs and reports results, but nothing currently
  prevents a direct push, force push, or a merge despite a red check, because
  no required status checks, PR-required rule, or force-push restriction is
  configured on `main`.
- **Provenance:**
  - `source_repo`: `intensicare-V2`
  - `path_or_url`: `docs/14-devsecops-and-delivery/branch-protection-request.md` (§1–2); `.github/workflows/docs-gates.yml`
  - `commit_sha_or_version`: n/a (created this session, uncommitted)
  - `section_or_lines`: `branch-protection-request.md` §1 "Why this is blocking, not advisory"
  - `date_collected`: 2026-08-14
  - `collector`: repository-foundation and CI-policy engineer (source doc); recorded in this register by the governance-and-traceability bootstrap steward
  - `transformation`: summarized from the specialist's request document
  - `confidence`: high
  - `owner`: UNASSIGNED — VALIDATION REQUIRED
  - `validation_status`: VALIDATION REQUIRED
- **Links:** `registers/blockers-register.md` `BLK-0011`;
  `INTENSICARE_V2_ORCHESTRATOR_PROMPT.md` §15.1, §3 rule 13.

## Index

| ID | Statement (short) | Label | Validation status |
|---|---|---|---|
| EVID-0001 | V2 repo independent history, commit `cb35521`, `main` | OBSERVED | VALIDATION REQUIRED |
| EVID-0002 | V2 work branch `cycle-0/spark-foundation` | OBSERVED | N/A |
| EVID-0003 | Legacy repo read-only, technical assessment (118,287 B) | OBSERVED | VALIDATION REQUIRED |
| EVID-0004 | Legacy repo read-only, docs intelligence audit (2,351,029 B) | OBSERVED | VALIDATION REQUIRED |
| EVID-0005 | AMH `main` HEAD pinned = evidence snapshot, no drift | OBSERVED | VALIDATION REQUIRED |
| EVID-0006 | Maezo manifest producer commit `09a0a282e...` (2026-08-05) | OBSERVED | VALIDATION REQUIRED |
| EVID-0007 | GitHub access via `gh` CLI OAuth, `rodaquino-OMNI` | OBSERVED | VALIDATION REQUIRED |
| EVID-0008 | AMH repo license = `NOASSERTION` | OBSERVED | VALIDATION REQUIRED |
| EVID-0009 | Branch protection on `main` not configured; CI gates not enforced | OBSERVED | VALIDATION REQUIRED |
