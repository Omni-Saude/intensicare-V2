# IntensiCare V2

> This README follows the evidence-labeling convention defined in
> `docs/00-governance/evidence-notation.md`: material statements are
> marked **OBSERVED** (verified directly, in this repository, as of the
> date given), **SOURCE** (drawn from the orchestrator prompt), or
> **PROPOSAL** (a recommendation, not yet ratified by any named human
> authority). Unlabeled sentences in this file are structural/navigational,
> not claims.

## What IntensiCare V2 is

**SOURCE** (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md` §1): IntensiCare V2
is a greenfield clinical decision-support platform whose mission is to
"design and implement the smallest coherent platform that safely helps
validated users recognize, prioritize, explain, and coordinate responses
to clinically relevant deterioration in the validated care setting."

**This is explicitly advisory, not autonomous or directive.** Per prompt
§3 rule 15: "Keep clinical decision authority with accountable humans.
Automation may calculate, summarize, route, and explain within approved
intended use; it may not silently expand the intended use." Every
alert, score, or recommendation IntensiCare V2 ever produces is
designed to end in "authorized human acknowledgment, escalation,
reassignment, resolution, or override" (prompt §1, the minimum candidate
safety loop) — never in an automated clinical action.

## Greenfield policy

**SOURCE** (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md` §3 rules 1–5, full
text in `docs/00-governance/legacy-import-policy.md`):

- V2 lives in a new repository with independent history, package
  namespace, secrets, environments, databases, deployment pipeline, and
  release identity.
- A prior system (`/Users/familia/intensicare/`, referred to as
  "legacy") and an external data platform
  (`Omni-Saude/amh-data-platform`, referred to as "AMH") are mounted
  **read-only**. Neither is ever modified as part of V2 work.
- **Default: do not copy** legacy or AMH code, schemas, migrations,
  infrastructure, dependencies, clinical rules, screenshots, or tests.
  An import requires a recorded license/IP decision, provenance, owner,
  current-relevance statement, security review, clinical-relevance
  review where applicable, a transformation log, and new V2 acceptance
  tests — see `docs/00-governance/legacy-import-policy.md` §3 for the
  full checklist. Nothing has been imported under this policy yet.
- V2 does not use legacy database migrations as its baseline; it starts
  with one reproducible migration history and a clean-install test
  (not yet built — no database has been chosen; see "Current status"
  below).

## Evidence discipline

**SOURCE** (`docs/00-governance/evidence-notation.md` §2): every
material statement in this repository — requirement, risk, hazard,
decision, status report, or code comment citing external authority —
must carry exactly one of six labels:

| Label | Meaning |
|---|---|
| **SOURCE** | Copied or faithfully summarized from a cited artifact. |
| **OBSERVED** | Directly verified in this repository, a pinned external repository, a test, or an environment. |
| **INFERENCE** | A reasoned conclusion, naming every SOURCE/OBSERVED item it reasons from. |
| **PROPOSAL** | A new recommendation awaiting a named human authority's decision. Not self-executing. |
| **VALIDATION REQUIRED** | The default state for anything touching clinical correctness, legal/privacy basis, security acceptance, or residual risk, until a qualified human or empirical study closes it. |
| **DECIDED** | Accepted by a named human authority, with date, rationale, and a supersession rule. **No agent may self-apply this label.** |

Full rules, the required provenance block, and the copy-paste
front-matter template are in `docs/00-governance/evidence-notation.md`.
The CI gate that enforces front-matter presence (not label correctness,
which is a human judgment) is described under "Running the docs
checks" below.

## Current status (OBSERVED, 2026-08-14)

**SPARK discovery cycle 0, pre-Gate-G0.** Per
`docs/00-governance/authority-model.md` and
`docs/00-governance/registers/blockers-register.md`: Gate G0 (authority
and access) is **NOT CLOSED**. As of 2026-08-14 all ten recorded
blockers are `OPEN`, the majority because no named human holds any of
the required `AUTH-*` decision-owner roles (product, clinical safety,
security, privacy/legal, data-platform, UX, operations, intended-use
approver — see `docs/00-governance/authority-model.md` §1). This is
stated plainly rather than implied: **this repository currently has no
named accountable human for any decision domain.** Every `owner` field
in every document under `docs/` reads `UNASSIGNED — VALIDATION
REQUIRED`, verbatim, by design — no agent may invent one.

No application technology stack has been chosen, and none may be
chosen by this task or by inference from the legacy repository (prompt
§3 rule 14). Stack, platform, and database decisions are reserved for
the ADR program (`docs/06-architecture/adrs/`, currently only a
template — see `docs/06-architecture/adrs/ADR-template.md`).

Documentation is being populated by multiple specialist contributors in
parallel under the tree below; expect directories to fill in over time
and treat any directory not yet listed as simply "not started," not as
evidence of a decision to skip it.

## Documentation map

**SOURCE** (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md` §16, "Documentation
architecture" — adapt only through an ADR):

```text
docs/
├── 00-governance/              governance conventions, registers, authority model
├── 01-vision-and-intended-use/ intended-use statement, non-intended uses, harm metrics
├── 02-users-and-workflows/     user-role and workflow hypotheses
├── 03-domain/                  glossary, conceptual model, invariants
├── 04-product-requirements/
├── 05-clinical-safety/         safety plan, hazard log, safety requirements
├── 06-architecture/
│   ├── system-context/
│   ├── containers/
│   ├── components/
│   ├── quality-attributes/
│   └── adrs/                   architecture decision records (template only so far)
├── 07-data-and-provenance/
├── 08-interoperability/
│   ├── amh-data/                AMH compatibility dossier, contract inventory
│   ├── fhir-smart/
│   ├── hl7v2/
│   ├── terminology/
│   └── conformance/
├── 09-api-events-and-mcp/
├── 10-ux-and-accessibility/
├── 11-security-privacy-compliance/
├── 12-quality-validation-and-testing/  test strategy
├── 13-operations-and-reliability/
├── 14-devsecops-and-delivery/   this document's siblings: CI policy, branch-protection request
├── 15-release-evidence/
├── 16-validation-backlog/
└── archive/
    └── legacy-provenance/
```

**OBSERVED (2026-08-14):** directories `00`, `01`, `02`, `03`, `05`,
`06` (partial — `adrs/` only), `08`, `12`, and `14` contain at least one
file. `04`, `07`, `09`, `10`, `11`, `13`, `15`, `16`, and `archive/` do
not yet exist in this repository. Re-run `find docs -mindepth 1
-maxdepth 1 -type d | sort` for the current state — this list is a
snapshot, not a standing guarantee.

## Running the docs checks

Two Python 3 standard-library-only scripts implement the only CI gates
that exist today (see `docs/14-devsecops-and-delivery/ci-policy.md` for
the full policy, including which future gates are blocked on which
ADRs):

```bash
python3 scripts/check_doc_conventions.py   # front-matter presence/shape on docs/**/*.md
python3 scripts/check_forbidden_content.py # credentials, CPF-shaped, email, PHI-canary scan
```

Both run automatically on every push and pull request via
`.github/workflows/docs-gates.yml` and are designed to be **blocking**,
never advisory (prompt §3 rule 13). Note: the workflow running is not
the same as it being *enforced* — see
`docs/14-devsecops-and-delivery/branch-protection-request.md`, status
BLOCKED pending repository-admin action.

Ownership of review paths is defined (as an inactive skeleton — every
rule is commented out pending named owners) in `.github/CODEOWNERS`.

## Disclaimer

**This repository, as of 2026-08-14, makes no clinical claim, no
regulatory claim, and no compatibility claim of any kind.** Nothing
here has been validated for clinical effectiveness, cleared or approved
by any regulatory body, or demonstrated compatible with any external
data platform for actionable clinical use. Per prompt §3 rule 11: "Do
not claim clinical effectiveness, regulatory compliance, security,
availability, or AMH compatibility without corresponding evidence and
named approval." Where this repository currently states a compatibility
finding (`docs/08-interoperability/amh-data/compatibility-finding.md`),
it explicitly classifies AMH as an "integration candidate; not
currently demonstrated compatible for actionable ICU evaluation" — a
finding about the current evidence, not a rejection and not a
clearance.

## License

See `LICENSE` at the repository root.
