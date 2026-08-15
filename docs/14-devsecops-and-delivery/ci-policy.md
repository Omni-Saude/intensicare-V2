---
doc_id: DEVSECOPS-CI-POLICY
status: PROPOSAL
owner: UNASSIGNED — VALIDATION REQUIRED
source: INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §15.1 (Repository foundation), §15.2 (Environments and delivery), §3 rules 12-14; .github/workflows/docs-gates.yml (this repository)
date_collected: 2026-08-14
collector: repository-foundation and CI-policy engineer
last_updated: 2026-08-14
---

# CI Policy — Current State and Future Stages

PROPOSAL — this document is not itself a ratified policy; it requires
DECIDED ratification per `docs/00-governance/decision-rights.md` before
it binds anyone. It is, however, an accurate OBSERVED description of
what exists in this repository as of 2026-08-14, plus a PROPOSAL for
how future pipeline stages should be sequenced against the ADR program.

## 0. Scope of this document

This document answers exactly two questions:

1. Which CI gates **exist today**, and are they blocking? (§1)
2. Which `INTENSICARE_V2_ORCHESTRATOR_PROMPT.md` §15.2 pipeline stages
   are **not yet built**, and what specifically blocks each one? (§2)

It does **not** choose an application stack, a cloud provider, a
database, a broker, or an AI model — those are prohibited to this task
(`decisions_prohibited: product technology/stack selection`) and are
reserved for the ADR program (prompt §10). Nothing in this document
should be read as asserting that any §15.2 pipeline stage exists beyond
what §1 states.

## 1. What exists today (OBSERVED)

**OBSERVED** (`.github/workflows/docs-gates.yml`, this repository,
2026-08-14): exactly one workflow exists, `Docs Gates`, triggered on
every `push` and `pull_request` to every branch. It runs two jobs, both
on `ubuntu-latest`, both using actions pinned by full commit SHA (see
the workflow file's header comment for the pin rationale), and **both
BLOCKING** — neither uses `continue-on-error` or any mechanism that
would let a failure pass silently:

| Job | What it runs | What it checks |
|---|---|---|
| `doc-conventions` | `python3 scripts/check_doc_conventions.py` | Every file under `docs/**/*.md` has a YAML front-matter block carrying status/label, source/provenance, a date, and an owner/collector, using the synonym sets documented in the script; flags any front-matter `status`/`label: DECIDED` (no ratification process exists yet — see `docs/00-governance/evidence-notation.md` §2 rule 3). |
| `forbidden-content` | `python3 scripts/check_forbidden_content.py` | `docs/`, `scripts/`, `.github/`, and root `README.md` for credential-shaped strings (GitHub tokens, AWS access keys, PEM private-key headers), CPF-shaped digit patterns, non-allowlisted email addresses, and a reserved synthetic-data canary string. |

**This is the entire CI surface of this repository today.** There is no
build, no test runner, no linter, no type checker, no SBOM step, no
signing step, and no deployment of any kind, because none of those can
exist without a chosen application stack (prompt §3 rule 14: "Do not
choose ... a cloud provider, a database extension, a broker, or an AI
model because the legacy repository used it. Ratify choices through
measurable decision drivers and ADRs" — and no ADR has been written; the
ADR program itself is only a template as of this writing, see
`docs/06-architecture/adrs/ADR-template.md`).

**A gap this document records rather than hides:** these two jobs
running and reporting pass/fail on every push/PR is **not** the same as
them being *enforced*. Enforcement (blocking a merge on a red check)
requires branch protection configured by a repository admin, which has
not been done — see `branch-protection-request.md` in this directory,
status **BLOCKED**. Until that is configured, a human with write access
could merge past a failing check. That gap is itself recorded as a
blocker, not silently accepted as acceptable.

## 2. What does NOT exist yet, and what blocks each stage (PROPOSAL)

`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md` §15.2 lists an 11-step pipeline.
**None of the 11 steps below exist in this repository.** Each is listed
with the specific decision it is blocked on. This table is a PROPOSAL
for how to reason about sequencing, not a claim that work has begun on
any of them.

| §15.2 step | What it requires | Blocked on |
|---|---|---|
| 1. Validate source, schemas, docs, ADR status, migrations, contracts, traceability | A schema/contract/migration format to validate — i.e. a language and framework | Stack ADR(s) (none exist; only the docs-conventions slice of this step exists today, per §1) |
| 2. Deterministic tests + risk-based integration/E2E suites | A test runner and test framework | Stack ADR(s) |
| 3. Build minimal non-root artifacts from dedicated runtime dependencies | A build toolchain and container/runtime base image policy | Stack ADR(s), container/runtime ADR |
| 4. Generate SBOM, vulnerability/license results, provenance attestations, signed immutable artifacts | Language-specific SBOM tooling; a signing-key and attestation policy | Stack ADR(s); a separate signing/provenance ADR (this is itself `security exception approval`-adjacent and is `decisions_prohibited` for this task) |
| 5. Deploy by digest to an ephemeral environment | A deployment target | Platform/cloud-provider ADR (prompt §3 rule 14 explicitly forbids choosing this without one) |
| 6. Run migrations with compatibility/backup/timeout/rollback strategy | A database | Database ADR |
| 7. AMH/connector conformance, synthetic safety probes, security, accessibility, performance, restore checks | A resolved AMH boundary and contract | Gate G3 (AMH compatibility), itself blocked — see `docs/08-interoperability/amh-data/four-layer-dossier.md` and `BLK-0010` in the blockers register; plus stack ADR(s) |
| 8. Create a release evidence bundle | Steps 1–7 to produce evidence from | All of the above |
| 9. Require separation-of-duties approvals | Distinct named humans who are not the same person on both sides of a required-independence pair | Gate G0 — every `AUTH-*` role is `UNASSIGNED — VALIDATION REQUIRED` (`docs/00-governance/authority-model.md` §1; `BLK-0001`–`BLK-0008`) |
| 10. Promote the identical artifact through environments | Environments (dev/preview/integration/staging/shadow/pilot/production) to promote through | Platform ADR (prompt §15.2: "Use infrastructure as code only after the platform ADR") |
| 11. Rapid rollback/roll-forward, rule kill switch, connector isolation, reconciliation | A running system with a rule engine and connectors | All of the above |

**This task does not attempt to build or schedule any of the above.**
Doing so would be a stack-selection decision, which is explicitly
`decisions_prohibited` for the task that produced this document.

## 3. The rule that never changes regardless of stack

Per `INTENSICARE_V2_ORCHESTRATOR_PROMPT.md` §3 rule 13, verbatim: **"No
production release may rely on advisory/non-blocking safety,
tenant-isolation, migration, security, accessibility, contract, restore,
or clinical test gates."** This applies to every future stage in §2
above, exactly as it applies to the two gates that exist today: when a
gate is built, it must be a required, blocking status check from the
moment it is added — never `continue-on-error: true`, never a
"warn-only" mode that is meant to be tightened "later."

**A cautionary OBSERVED example, not a criticism of a third party's
engineering choices in general:** `docs/08-interoperability/amh-data/claim-verification-matrix.md`
records (re-verifying `README.md` at a pinned commit of
`Omni-Saude/amh-data-platform`) that in that external repository, "the
only required status check is `Security Gate`... the demonstration
workflows run but do not block merge, and several were red at the time
of the observed snapshot." This is recorded here as the exact anti-
pattern rule 13 forbids IntensiCare V2 from adopting — evidence that
non-blocking CI gates are the industry-observed default failure mode to
plan against, not an invented risk.

## 4. What this document explicitly does not do

- It does not enable branch protection or call the GitHub API/`gh` CLI
  to change any repository setting (see `branch-protection-request.md`).
- It does not approve any security exception.
- It does not assert that any §15.2 stage beyond §1 exists.
- It does not choose a stack, platform, database, or AI model.
