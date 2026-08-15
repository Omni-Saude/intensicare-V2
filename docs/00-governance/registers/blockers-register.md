---
doc_id: GOV-BLOCKERS-REGISTER
status: OPEN
owner: UNASSIGNED — VALIDATION REQUIRED
source: Gate G0 criteria, INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §5 lines 239-249
last_updated: 2026-08-14
---

# Blockers Register — Gate G0 (Authority and Access)

SOURCE (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:239-249`): Gate G0 cannot close
until the new repository exists and legacy/AMH sources are read-only, GitHub
App access is revalidated, AMH pinning/license/authority are recorded,
product/clinical-safety/security/privacy-legal/data-platform/UX/operations
decision owners are named, intended use has a named approver, and unknowns
have owners and dates. Every blocker below names the exact gap and the exact
text to send to unblock it. No blocker in this register is closed by this
task — closing requires the named human to act.

## Entry template

```yaml
id: BLK-NNNN
title: <short title>
status: OPEN | CLOSED
what_is_blocked: <what cannot proceed>
who_must_act: <AUTH-* role, UNASSIGNED — VALIDATION REQUIRED>
unblock_request: >
  <exact text to send to request the unblock>
gate: G0
links: []
```

## BLK-0001 — No named product decision owner

```yaml
id: BLK-0001
title: No named product decision owner
status: OPEN
what_is_blocked: >
  Product scope, prioritization, outcome-tree acceptance, and any PROPOSAL
  reaching DECIDED status for product decisions.
who_must_act: AUTH-PRODUCT — UNASSIGNED — VALIDATION REQUIRED
unblock_request: >
  "Please name one accountable human as the IntensiCare V2 product decision
  owner (AUTH-PRODUCT). This person accepts product scope, prioritization,
  and non-clinical requirement decisions, and must not self-approve where
  independence rules apply. Reply with the name, role/title, and
  organizational reporting line."
gate: G0
links: [RISK-0001]
```

## BLK-0002 — No named clinical safety decision owner

```yaml
id: BLK-0002
title: No named clinical safety decision owner
status: OPEN
what_is_blocked: >
  Hazard acceptance, safety-case sign-off, residual-risk acceptance, and
  clinical rule-content ratification (rule author independence cannot be
  enforced without this role).
who_must_act: AUTH-CLINSAFETY — UNASSIGNED — VALIDATION REQUIRED
unblock_request: >
  "Please name one accountable, clinically qualified human as the
  IntensiCare V2 clinical safety decision owner (AUTH-CLINSAFETY). This
  person accepts hazard analyses, safety-case arguments, and residual
  clinical risk, and must not be the same person who authors clinical rule
  content for the item under review. Reply with the name, clinical
  credential/qualification, and organizational reporting line."
gate: G0
links: [RISK-0001]
```

## BLK-0003 — No named security decision owner

```yaml
id: BLK-0003
title: No named security decision owner
status: OPEN
what_is_blocked: >
  Threat-model acceptance, penetration-test acceptance, and security
  exception approval.
who_must_act: AUTH-SECURITY — UNASSIGNED — VALIDATION REQUIRED
unblock_request: >
  "Please name one accountable human as the IntensiCare V2 security decision
  owner (AUTH-SECURITY). This person accepts threat models and
  penetration-test results, and must not be the same person who implements
  the security control under review. Reply with the name, role/title, and
  organizational reporting line."
gate: G0
links: [RISK-0001]
```

## BLK-0004 — No named privacy/legal decision owner

```yaml
id: BLK-0004
title: No named privacy/legal decision owner
status: OPEN
what_is_blocked: >
  LGPD legal-basis determination, processor-terms review, data-residency and
  retention decisions, and legal-hold handling. Blocks any conclusion of
  legal sufficiency for PHI handling.
who_must_act: AUTH-PRIVACY-LEGAL — UNASSIGNED — VALIDATION REQUIRED
unblock_request: >
  "Please name one accountable human (qualified in Brazilian LGPD and
  healthcare data law) as the IntensiCare V2 privacy/legal decision owner
  (AUTH-PRIVACY-LEGAL). This person accepts legal-basis, retention, and
  residency decisions for PHI. Reply with the name, legal
  credential/qualification, and organizational reporting line."
gate: G0
links: [RISK-0001]
```

## BLK-0005 — No named data-platform decision owner

```yaml
id: BLK-0005
title: No named data-platform decision owner
status: OPEN
what_is_blocked: >
  AMH boundary decisions, AMH×IntensiCare contract acceptance (jointly with
  an AMH owner — see BLK-0010), and data-quality policy acceptance.
who_must_act: AUTH-DATA-PLATFORM — UNASSIGNED — VALIDATION REQUIRED
unblock_request: >
  "Please name one accountable human as the IntensiCare V2 data-platform
  decision owner (AUTH-DATA-PLATFORM). This person accepts the AMH
  compatibility boundary and contract decisions jointly with a named AMH
  owner. Reply with the name, role/title, and organizational reporting
  line."
gate: G0
links: [RISK-0001]
```

## BLK-0006 — No named UX decision owner

```yaml
id: BLK-0006
title: No named UX decision owner
status: OPEN
what_is_blocked: >
  Participant-research acceptance, accessibility sign-off, and workflow
  acceptance (independent of the UX designer who ran the research).
who_must_act: AUTH-UX — UNASSIGNED — VALIDATION REQUIRED
unblock_request: >
  "Please name one accountable human as the IntensiCare V2 UX decision owner
  (AUTH-UX). This person accepts participant-research findings and
  accessibility sign-off, and must not be the same person who moderated the
  research session under review. Reply with the name, role/title, and
  organizational reporting line."
gate: G0
links: [RISK-0001]
```

## BLK-0007 — No named operations decision owner

```yaml
id: BLK-0007
title: No named operations decision owner
status: OPEN
what_is_blocked: >
  SLO/RTO/RPO acceptance and operational go-live readiness decisions.
who_must_act: AUTH-OPERATIONS — UNASSIGNED — VALIDATION REQUIRED
unblock_request: >
  "Please name one accountable human as the IntensiCare V2 operations
  decision owner (AUTH-OPERATIONS). This person accepts SLO/RTO/RPO targets
  and operational readiness evidence, and must not be the same person who
  owns the release pipeline for the item under review. Reply with the name,
  role/title, and organizational reporting line."
gate: G0
links: [RISK-0001]
```

## BLK-0008 — No named intended-use approver

```yaml
id: BLK-0008
title: No named intended-use approver
status: OPEN
what_is_blocked: >
  Approval of the intended-use statement (care setting, population,
  exclusions, advisory-vs-directive boundary). Gate G1 (problem and intended
  use) cannot open meaningfully without this, and solution architecture
  approval is blocked per Gate G1's own precondition.
who_must_act: AUTH-INTENDED-USE — UNASSIGNED — VALIDATION REQUIRED
unblock_request: >
  "Please name one accountable human as the IntensiCare V2 intended-use
  approver (AUTH-INTENDED-USE). This person approves the care setting,
  patient population, exclusions, and advisory-versus-directive boundary
  before any solution architecture is approved. Reply with the name,
  clinical/regulatory credential if applicable, and organizational reporting
  line."
gate: G0
links: [RISK-0001]
```

## BLK-0009 — GitHub App installation access not revalidated

```yaml
id: BLK-0009
title: GitHub App installation access on rodaquino-OMNI not revalidated (OAuth token observed instead)
status: OPEN
what_is_blocked: >
  Gate G0's requirement that "access through the GitHub App installation
  owned by rodaquino-OMNI to Omni-Saude/amh-data-platform has been
  revalidated" cannot be confirmed. What was observed (EVID-0007) is a gh CLI
  OAuth token, not confirmation of the App installation itself
  (ASM-0001). Any AMH-dependent decision that relies on the specific
  access-control properties of a GitHub App installation (as opposed to a
  personal OAuth token) is unverified.
who_must_act: AUTH-DATA-PLATFORM and AUTH-SECURITY — both UNASSIGNED — VALIDATION REQUIRED
unblock_request: >
  "Please confirm whether a GitHub App is installed for account
  rodaquino-OMNI on Omni-Saude/amh-data-platform, and if so, revalidate that
  installation's access and permission scope without exposing credentials.
  If no App installation exists, please confirm whether the gh CLI OAuth
  token (scopes: gist, read:org, repo, workflow) is the sanctioned access
  mechanism for AMH repository inspection, and update
  INTENSICARE_V2_ORCHESTRATOR_PROMPT.md's access-method description
  accordingly. Reply with the determination and the name of who confirmed
  it."
gate: G0
links: [RISK-0001, ASM-0001]
```

## BLK-0010 — AMH license/ownership authority unestablished

```yaml
id: BLK-0010
title: AMH license/ownership authority unestablished (NOASSERTION)
status: OPEN
what_is_blocked: >
  Gate G0's requirement that "AMH license/ownership and the authority of each
  selected contract are recorded" is only partially satisfiable: the license
  status IS recorded (NOASSERTION — EVID-0008), but no positive license/IP
  authority has been established. This blocks any import of AMH artifacts
  under ../legacy-import-policy.md §3.1, and blocks Gate G3 (AMH
  compatibility) acceptance of any AMH-derived contract material.
who_must_act: AUTH-DATA-PLATFORM (IntensiCare V2 side) jointly with AUTH-AMH-OWNER (AMH side) — both UNASSIGNED — VALIDATION REQUIRED
unblock_request: >
  "The GitHub API reports Omni-Saude/amh-data-platform's license as
  NOASSERTION (no SPDX license file/declaration detected) as of 2026-08-14 at
  commit 0a07a6f1fab36fb2f5eeee0fcd8e945c95f67116. Please identify the
  accountable AMH-side owner who can state the license/IP terms under which
  IntensiCare V2 (a separate, independent product) may reference, reuse, or
  build a contract against AMH schemas, profiles, or interfaces — including
  whether any reuse is permitted at all. Reply with the AMH owner's name,
  organizational role, and the applicable license/IP terms, or confirm that
  no reuse is currently authorized."
gate: G0
links: [RISK-0002, EVID-0008]
```

## BLK-0011 — Branch protection for `main` not configured

```yaml
id: BLK-0011
title: Branch protection for main not configured
status: OPEN
what_is_blocked: >
  Enforcement of the docs-gates required status checks (doc-conventions and
  forbidden-content, defined in .github/workflows/docs-gates.yml) as blocking
  merge requirements; prevention of force pushes to main; requirement that
  changes land via reviewed pull request rather than direct push. Until
  closed, these CI gates are observable but not enforced on main, which is
  inconsistent with INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §15.1
  ("branch protection and required status checks") and §3 rule 13
  ("No production release may rely on advisory/non-blocking ... gates").
  Raised by the CI foundation / repository-foundation and CI-policy engineer
  specialist in docs/14-devsecops-and-delivery/branch-protection-request.md,
  which is BLOCKED pending this same repository-admin action and could not
  write to this register (outside that task's write_scope).
who_must_act: >
  Repository administrator of rodaquino-OMNI/intensicare-V2
  (role: AUTH-SECURITY + repo admin) — UNASSIGNED — VALIDATION REQUIRED
unblock_request: >
  "Please apply the branch-protection settings requested in
  docs/14-devsecops-and-delivery/branch-protection-request.md §2 to the main
  branch of rodaquino-OMNI/intensicare-V2: require a pull request before
  merging (no direct pushes), require the doc-conventions and
  forbidden-content status checks to pass before merging, require branches
  to be up to date before merging, disable force pushes, and require linear
  history. Confirm back with the settings actually applied, which may differ
  from the request (e.g. on required-approval count, which that document
  deliberately leaves open pending AUTH-SECURITY/AUTH-OPERATIONS naming —
  see BLK-0003, BLK-0007)."
gate: G0
links: [EVID-0009]
```

## Index

| ID | Title | Gate | Who must act |
|---|---|---|---|
| BLK-0001 | No named product decision owner | G0 | AUTH-PRODUCT |
| BLK-0002 | No named clinical safety decision owner | G0 | AUTH-CLINSAFETY |
| BLK-0003 | No named security decision owner | G0 | AUTH-SECURITY |
| BLK-0004 | No named privacy/legal decision owner | G0 | AUTH-PRIVACY-LEGAL |
| BLK-0005 | No named data-platform decision owner | G0 | AUTH-DATA-PLATFORM |
| BLK-0006 | No named UX decision owner | G0 | AUTH-UX |
| BLK-0007 | No named operations decision owner | G0 | AUTH-OPERATIONS |
| BLK-0008 | No named intended-use approver | G0 | AUTH-INTENDED-USE |
| BLK-0009 | GitHub App installation access not revalidated | G0 | AUTH-DATA-PLATFORM + AUTH-SECURITY |
| BLK-0010 | AMH license/ownership authority unestablished | G0 | AUTH-DATA-PLATFORM + AUTH-AMH-OWNER |
| BLK-0011 | Branch protection for `main` not configured | G0 | AUTH-SECURITY + repo admin |

**Gate G0 status: NOT CLOSED.** All eleven blockers above are `OPEN` as of
2026-08-14.
