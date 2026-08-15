---
doc_id: GOV-DECISION-RIGHTS
status: PROPOSAL
owner: UNASSIGNED — VALIDATION REQUIRED
source: INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §4 (Orchestration policy) and §4 (Required independence)
last_updated: 2026-08-14
---

# Decision Rights

PROPOSAL — maps decision types to the roles in `authority-model.md` and encodes
the required-independence rules from
`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:197-207`. No human is named; every
`decider` cell below is a role ID from `authority-model.md`, resolved to
`UNASSIGNED — VALIDATION REQUIRED` until staffed.

## 1. Core principle

SOURCE (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:207`): "Agents prepare evidence;
qualified humans accept clinical, legal, privacy, regulatory, operational, and
residual-risk decisions."

Corollary rules applied throughout IntensiCare V2:

1. An agent (specialist or otherwise) may **propose**, **analyze**, **draft**,
   **implement**, and **evidence** any artifact within its `write_scope`.
2. An agent may never **DECIDE** a clinical, legal, privacy, regulatory,
   operational, or residual-risk matter. It may only produce a PROPOSAL and the
   supporting evidence for a human to decide.
3. A human decision is only valid if made by the named role with authority over
   that decision type (per §2 below) and is not one of the two sides of a
   required-independence pair for the same artifact (per §3 below).
4. Silence is not consent. An unreviewed PROPOSAL remains a PROPOSAL
   indefinitely; it never auto-promotes to DECIDED.

## 2. Who may decide what

| Decision type | Deciding role (`authority-model.md`) | Agents may... | Agents may NOT... |
|---|---|---|---|
| Product scope/prioritization | `AUTH-PRODUCT` | draft outcome tree, requirement catalog, MCDA scoring | accept the final portfolio |
| Intended use / non-intended use | `AUTH-INTENDED-USE` | draft intended-use statement, exclusions | approve it as binding |
| Clinical hazard / residual-risk acceptance | `AUTH-CLINSAFETY` | perform hazard analysis, propose controls | accept residual risk |
| Clinical rule content ratification | `AUTH-CLINSAFETY` | author rule logic, cite evidence grade | approve their own authored rule (see §3) |
| Security threat-model / control acceptance | `AUTH-SECURITY` | build threat model, implement controls | accept the threat model or pass their own control |
| Privacy/legal basis, LGPD, retention, residency | `AUTH-PRIVACY-LEGAL` | draft data map, propose retention schedule | conclude legal sufficiency |
| AMH contract / boundary acceptance | `AUTH-DATA-PLATFORM` jointly with `AUTH-AMH-OWNER` | draft compatibility dossier, contract matrix | accept the contract unilaterally |
| Tenant/MPI identity policy (ADR-006/039/041 conflict) | `AUTH-DATA-PLATFORM` jointly with `AUTH-AMH-OWNER` | document the contradiction | silently resolve it |
| UX/accessibility/participant-research acceptance | `AUTH-UX` | design, run moderated sessions | accept their own research findings (see §3) |
| Operational readiness / RTO / RPO acceptance | `AUTH-OPERATIONS` | build DR/observability plans | accept RTO/RPO targets |
| Go-live / release promotion | Joint: `AUTH-PRODUCT`, `AUTH-CLINSAFETY`, `AUTH-SECURITY`, `AUTH-OPERATIONS` | assemble evidence bundle | self-declare go-live (see §3) |
| Architecture decisions (ADR ratification) | `AUTH-PRODUCT` + relevant domain owner per ADR topic | draft ADR options and drivers | ratify their own ADR proposal |
| Migration / restore verification | `AUTH-OPERATIONS` (must differ from implementer) | implement migration | verify their own migration's restore/reconciliation (see §3) |

## 3. Required-independence pairs

SOURCE (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:199-206`), verbatim rules:

| # | Implementer / preparer | Must be independent from (approver/verifier) |
|---|---|---|
| 1 | Rule author | Clinical approver |
| 2 | Safety-control implementer | Safety-case accepter |
| 3 | Security-control implementer | Penetration verifier |
| 4 | Connector implementer | External conformance accepter |
| 5 | UX designer | Participant-research moderator/acceptance owner |
| 6 | Migration implementer | Restore/reconciliation verifier |
| 7 | Release pipeline owner | Go-live authority |

Enforcement:

1. Every task packet issued to a specialist (per prompt §4 template) must state
   `decisions_prohibited` explicitly covering any pair above the specialist's
   work touches.
2. A single human may not hold both sides of the same pair for the same
   artifact. Holding both roles *in general* (e.g. one person is both
   `AUTH-CLINSAFETY` and `AUTH-SECURITY`) is permitted if the specific artifact
   under review does not create a self-approval conflict; each case is
   evaluated per-artifact, not per-role-title.
3. Where staffing cannot yet satisfy a pair (e.g. only one clinical reviewer
   exists), the decision is not made. It is logged in
   `registers/blockers-register.md`, per prompt §20 stop conditions
   ("a required approval would be self-approval").

## 4. Escalation on disagreement or gap

See `authority-model.md` §3. This document defines *who decides what*;
`authority-model.md` defines *who is reachable when roles conflict or are
unstaffed*.

## 5. Status

This document is a PROPOSAL. It requires DECIDED ratification, itself subject
to the same rule it describes (§1.2): no agent may self-ratify it. See
`registers/decision-register.md`.
