---
doc_id: GOV-AUTHORITY-MODEL
status: PROPOSAL
owner: UNASSIGNED — VALIDATION REQUIRED
source: INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §5 (Gate G0), §4 (Required specialist pool)
last_updated: 2026-08-14
---

# Authority Model

PROPOSAL — this document names the decision-owner *roles* required to pass Gate
G0 (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:239-249`). No human is named. Every
`owner` field below reads `UNASSIGNED — VALIDATION REQUIRED` verbatim, per this
task's `decisions_prohibited: naming any human owner/approver`. This document
does not, and cannot, close Gate G0 by itself — it only creates the skeleton
that a human authority must fill in.

## 1. Decision-owner roles required by the prompt

SOURCE (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:247-249`): Gate G0 requires that
"product, clinical safety, security, privacy/legal, data-platform, UX, and
operations decision owners are named" and that "intended use has a named human
approver."

| Role ID | Role | Accountable for | Owner (name) | Status |
|---|---|---|---|---|
| `AUTH-PRODUCT` | Product decision owner | Product scope, prioritization, outcome tree, non-clinical acceptance | UNASSIGNED — VALIDATION REQUIRED | OPEN |
| `AUTH-CLINSAFETY` | Clinical safety decision owner | Hazard acceptance, safety-case sign-off, residual-risk acceptance | UNASSIGNED — VALIDATION REQUIRED | OPEN |
| `AUTH-SECURITY` | Security decision owner | Threat-model acceptance, penetration-test acceptance, security exceptions | UNASSIGNED — VALIDATION REQUIRED | OPEN |
| `AUTH-PRIVACY-LEGAL` | Privacy/legal decision owner | LGPD basis, processor terms, residency, retention, legal holds | UNASSIGNED — VALIDATION REQUIRED | OPEN |
| `AUTH-DATA-PLATFORM` | Data-platform decision owner | AMH boundary, contract acceptance, data-quality policy | UNASSIGNED — VALIDATION REQUIRED | OPEN |
| `AUTH-UX` | UX decision owner | Participant-research acceptance, accessibility sign-off, workflow acceptance | UNASSIGNED — VALIDATION REQUIRED | OPEN |
| `AUTH-OPERATIONS` | Operations decision owner | SLO/RTO/RPO acceptance, go-live operational readiness | UNASSIGNED — VALIDATION REQUIRED | OPEN |
| `AUTH-INTENDED-USE` | Intended-use approver | Care setting, population, exclusions, advisory-vs-directive boundary | UNASSIGNED — VALIDATION REQUIRED | OPEN |

## 2. AMH owners (external authority, not V2-internal)

SOURCE (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:169,173-176,246`): several
specialist roles explicitly "must not self-approve" AMH acceptance —
"AMH owner sign-off," "AMH contract acceptance," "AMH or V2 contract
acceptance." AMH ownership is external to IntensiCare V2 and belongs to
`Omni-Saude/amh-data-platform`.

| Role ID | Role | Accountable for | Owner (name) | Status |
|---|---|---|---|---|
| `AUTH-AMH-OWNER` | AMH-data platform owner(s) | License/IP authority, contract publication approval, tenant/MPI policy resolution (ADR-006/ADR-039/ADR-041 conflict) | UNASSIGNED — VALIDATION REQUIRED | OPEN — no AMH-side contact has been established in the evidence collected as of 2026-08-14 |

INFERENCE (from `INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:104,246` and the observed
GitHub API license status recorded in `registers/evidence-register.md`
`EVID-0008`): until an AMH owner is named and reachable, no AMH artifact reuse,
contract acceptance, or identity-policy decision can be DECIDED — only
PROPOSAL. See `registers/blockers-register.md` `BLK-0009` and `BLK-0010`.

## 3. Escalation model (skeleton)

PROPOSAL — the following escalation skeleton is a starting structure only; it
requires validation and ratification by the named owners above once they exist.

1. **Specialist level** — a specialist agent or contributor identifies a
   decision that requires human acceptance (clinical, legal, privacy,
   regulatory, operational, or residual-risk per
   `INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:207`). It records the item as
   `VALIDATION REQUIRED` in the relevant register with the correct `AUTH-*`
   role tagged as the required decider.
2. **Role level** — the named human holding that `AUTH-*` role reviews the
   item. They may DECIDE it directly if it is within their sole authority, or
   escalate if it crosses roles (e.g. a change with both clinical-safety and
   privacy/legal implications escalates to both `AUTH-CLINSAFETY` and
   `AUTH-PRIVACY-LEGAL`).
3. **Cross-role conflict** — if two named owners disagree, or if a decision
   requires trading off between roles (e.g. product speed vs. clinical
   safety), escalate to a joint review. This document does not name who
   convenes that review; that is itself `VALIDATION REQUIRED` and should be
   decided when the first `AUTH-*` roles are staffed.
4. **No self-approval** — per prompt §4 "Required independence"
   (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:197-207`) and the specialist-pool
   table's "must not self-approve" column, no role may approve its own
   implementation output. See `decision-rights.md` §2 for the enforced pairs.
5. **Unresolvable / out-of-scope** — if no named owner exists, or the required
   independence cannot be satisfied (e.g. only one person available for both
   sides of a required-independence pair), the item is not decided. It is
   logged as a blocker (`registers/blockers-register.md`) and work that
   depends on it stops, per prompt §20 stop conditions.

## 4. What this document does not do

- It does not name any person. Doing so is explicitly out of scope for this
  task (`decisions_prohibited`).
- It does not accept any risk or approve any policy. All approvals referenced
  here remain `UNASSIGNED — VALIDATION REQUIRED`.
- It does not close Gate G0. Gate G0 closes only when every row in §1 and §2
  has a named, reachable human and the escalation model in §3 has itself been
  validated. Until then, see `registers/blockers-register.md`.
