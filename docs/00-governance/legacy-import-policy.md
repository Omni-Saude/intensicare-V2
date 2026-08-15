---
doc_id: GOV-LEGACY-IMPORT-POLICY
status: PROPOSAL
owner: UNASSIGNED — VALIDATION REQUIRED
source: INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §3 (Non-negotiable rules 2–5), §16 (Documentation architecture)
last_updated: 2026-08-14
---

# Legacy Import Policy

PROPOSAL — this policy operationalizes prompt §3 rules 2–5 and the
migration-manifest template in prompt §16. It governs how (and whether) any
idea, code, schema, migration, rule, test, or asset from the legacy repository
(`/Users/familia/intensicare/`, mounted read-only) or from AMH
(`Omni-Saude/amh-data-platform`, mounted read-only) may enter IntensiCare V2.

## 1. Default: DO NOT COPY

SOURCE (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:113-117`), verbatim rules:

1. V2 is created in a new repository with independent history, package
   namespace, secrets, environments, databases, deployment pipeline, and
   release identity. (Rule 1 — already satisfied: this repo has a single
   initial commit `cb35521`, independent of legacy history.)
2. Legacy and AMH repositories are mounted **read-only**. They are never
   modified as part of V2 work.
3. **Default: do not copy** legacy code, schemas, migrations, infrastructure,
   dependencies, clinical rules, screenshots, or tests.
4. V2 does **not** use legacy database migrations as its baseline. V2 starts
   with one reproducible migration history and a clean-install test.

This applies equally to AMH-derived material: AMH's Maezo published-contract
pattern, HAPI configuration, FHIR profiles, and pseudocode examples are
reference material, not importable implementation (see
`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:104,107` — "V2 must create an AMH×
IntensiCare contract rather than reuse Maezo's interface"; "must not be
imported as an implemented control").

## 2. What counts as "the legacy repository" for this policy

- Legacy: `/Users/familia/intensicare/` (READ-ONLY), including
  `INTENSICARE_TECHNICAL_ASSESSMENT.md` and
  `INTENSICARE_DOCS_INTELLIGENCE_AUDIT.md`. Treated as risk-informed input, not
  authority (prompt §2, line 72).
- AMH: `Omni-Saude/amh-data-platform` (private, READ-ONLY), pinned evidence
  snapshot `0a07a6f1fab36fb2f5eeee0fcd8e945c95f67116` on `main` as of
  2026-08-14. Must be re-pinned at execution time — see
  `registers/assumptions-register.md` `ASM-0002`.

## 3. Import requires a recorded decision

SOURCE (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:116`), verbatim: "An imported
artifact requires a recorded license/IP decision, provenance, owner, current
relevance, security review, clinical relevance review where applicable,
transformation log, and V2 acceptance tests."

No idea, code fragment, schema, or rule may be imported without **all** of the
following recorded, before the import lands in a PR:

1. **License/IP decision** — who holds rights to the source material and
   whether IntensiCare V2 (a new, independent repository/product) has a lawful
   basis to reuse it. For AMH material specifically, this is currently
   **blocked**: the AMH repository's license is reported by the GitHub API as
   `NOASSERTION` (no SPDX license detected) — see
   `registers/evidence-register.md` `EVID-0008` and
   `registers/risk-register.md` `RISK-0002`/`registers/blockers-register.md`
   `BLK-0010`. No AMH artifact may be imported until this blocker clears.
2. **Provenance** — exact repo, path, commit SHA, and lines, per
   `evidence-notation.md` §3.
3. **Owner** — the named human accountable for the imported artifact going
   forward (never `UNASSIGNED` at the point of actual import — imports are
   blocked while the owner is unassigned).
4. **Current relevance** — an explicit statement of why the legacy/AMH idea
   still applies to V2's intended use, not merely that it existed.
5. **Security review** — independent of whoever proposes the import
   (`decision-rights.md` §3, pair 3 where applicable).
6. **Clinical relevance review** — required whenever the artifact touches
   clinical logic, data interpretation, or patient-facing behavior; performed
   by `AUTH-CLINSAFETY`, independent of the rule/idea's author
   (`decision-rights.md` §3, pair 1).
7. **Transformation log** — precisely what was changed between the legacy/AMH
   form and the V2 form, and why.
8. **V2 acceptance tests** — new tests, written against V2's own requirements
   and hazards, that the imported artifact must pass. Legacy/AMH test results
   do not substitute for V2 acceptance tests (prompt §20: "tests validate zero
   cases" is a stop condition; inherited "passing" tests validate nothing about
   V2).

Until all eight items are recorded, the artifact's classification is
`ARCHIVE` at most (kept as reference, not imported) — see §4.

## 4. Classification vocabulary

Every legacy/AMH idea considered for V2 is classified using exactly one of:

| Classification | Meaning |
|---|---|
| `RETAIN` | Import largely as-is once §3 is fully satisfied (rare; still requires new V2 acceptance tests). |
| `REFINE` | Import with modification; underlying idea is sound, implementation needs improvement. |
| `TRANSFORM` | Substantially rebuilt; only the concept/intent is retained. |
| `VALIDATE` | Idea is plausible but requires empirical/clinical validation before any import decision. |
| `SUPERSEDE` | A V2-native design replaces the legacy/AMH idea; the old idea is documented for context only. |
| `ARCHIVE` | Kept as historical/reference material only; not imported. |
| `REJECT` | Explicitly rejected; documented so it is not re-proposed without new evidence. |

## 5. Migration-manifest template

SOURCE (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:954-967`), verbatim template.
One manifest entry is required for **every** retained legacy/AMH idea,
regardless of classification, and is stored under
`docs/archive/legacy-provenance/` (outside this steward's write scope; created
by the specialist performing the import, per prompt §16 documentation
hierarchy):

```yaml
legacy_source: <REPO_COMMIT_PATH_LINES>
artifact_or_idea: <NAME>
classification: RETAIN | REFINE | TRANSFORM | VALIDATE | SUPERSEDE | ARCHIVE | REJECT
license_ip_status: <STATUS>
preserved_intelligence: <WHAT_AND_WHY>
rejected_constraints: <WHAT_AND_WHY>
v2_destination: <PATH_OR_COMPONENT>
requirements_hazards_adrs: <IDS>
transformer: <OWNER>
independent_reviewers: <OWNERS>
tests_and_evidence: <LINKS>
decision_status: <STATUS_DATE>
```

Field notes:

- `license_ip_status` must reflect §3.1 above; for any AMH-sourced entry it
  cannot read anything stronger than `BLOCKED — NOASSERTION, pending AMH owner
  resolution` until `BLK-0010` clears.
- `transformer` and `independent_reviewers` must satisfy
  `decision-rights.md` §3 (no self-review).
- `decision_status` uses the evidence-notation labels
  (`evidence-notation.md` §2): a manifest entry starts at `PROPOSAL` and only
  becomes `DECIDED (<date>)` when a named human authority accepts it.

## 6. Relationship to registers

- Every import attempt, whether it proceeds or is rejected, should have a
  corresponding row in `registers/decision-register.md` once it reaches a
  human decider.
- Any import blocked by missing license/IP status is tracked in
  `registers/blockers-register.md`.
- The AMH license `NOASSERTION` finding itself is recorded as
  `registers/evidence-register.md` `EVID-0008` and propagated to
  `registers/risk-register.md` `RISK-0002`.

## 7. Status

PROPOSAL. Requires DECIDED ratification per `decision-rights.md` before any
import may proceed under this policy.
