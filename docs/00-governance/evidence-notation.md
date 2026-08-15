---
doc_id: GOV-EVIDENCE-NOTATION
status: PROPOSAL
owner: UNASSIGNED — VALIDATION REQUIRED
source: INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §2 (Evidence baseline and epistemic discipline)
last_updated: 2026-08-14
---

# Evidence Notation Standard

INFERENCE (drawn from `INTENSICARE_V2_ORCHESTRATOR_PROMPT.md` §2, lines 59–70): this
document operationalizes the orchestrator prompt's evidence-labeling requirement so
every specialist, register, and deliverable in IntensiCare V2 uses one shared
vocabulary. This is a governance PROPOSAL awaiting human ratification; it is not
itself a DECIDED policy.

## 1. Purpose

Every material statement in IntensiCare V2 — requirement, risk, hazard, decision,
status report, or code comment referencing external authority — must carry exactly
one of the six labels below, plus a provenance block where the label requires one
(see §3). Unlabeled material statements are non-conformant and must be rejected in
review.

## 2. The six labels

| Label | Definition (SOURCE: prompt §2) | Provenance required | Who may apply it |
|---|---|---|---|
| **SOURCE** | A statement copied or faithfully summarized from a cited artifact. | Yes — full block | Any agent, if the citation is verifiable |
| **OBSERVED** | Directly verified in the V2 or pinned external repository, test, environment, or interview. | Yes — full block | Any agent that performed the verification itself |
| **INFERENCE** | Reasoned conclusion based on cited evidence. | Yes — cite the evidence(s) reasoned from | Any agent; must show the chain of reasoning |
| **PROPOSAL** | A new recommendation awaiting decision. | Optional; cite what motivates it | Any agent |
| **VALIDATION REQUIRED** | Requires a named qualified human, external system, production-like environment, or empirical study before it can be relied upon. | State what validation is required and by whom | Any agent that identifies the gap |
| **DECIDED** | Accepted by the named authority with date, rationale, and supersession rules. | Full block plus decision metadata (§4) | Only the named human authority; no agent may self-apply this label |

### Usage rules

1. A statement may carry only one primary label. If a statement mixes fact and
   recommendation, split it: cite the OBSERVED/SOURCE fact, then state the
   PROPOSAL separately with a cross-reference.
2. **INFERENCE** must name every SOURCE/OBSERVED item it reasons from. An
   inference with no traceable input is invalid and must be rejected.
3. **PROPOSAL** is never self-executing. A proposal becomes binding only when a
   named human authority relabels it **DECIDED** with the metadata in §4.
4. **VALIDATION REQUIRED** is the default state for anything touching clinical
   correctness, legal/privacy basis, security acceptance, or residual risk until
   a qualified human or empirical study closes it. No agent may promote its own
   VALIDATION REQUIRED item to DECIDED.
5. **DECIDED** is irreversible only until superseded. A DECIDED entry must state
   its supersession rule (what would trigger revisiting it) even if that rule is
   "revisit at next phase gate."
6. Registers (evidence, assumptions, decisions, risks, blockers — see
   `registers/`) are the durable home for labeled statements. Narrative docs may
   summarize but must link back to the register entry ID.
7. No agent may invent a person, approval, interface, or capability to satisfy a
   label. If the true owner is unknown, the label's owner field reads
   `UNASSIGNED — VALIDATION REQUIRED`, verbatim, never a placeholder name.

## 3. Mandatory provenance block

Every material artifact — and every register row — must carry this provenance
block, per prompt §2, line 70:

| Field | Meaning |
|---|---|
| `source_repo` | Repository the evidence came from (e.g. `intensicare-V2`, `Omni-Saude/amh-data-platform`, `intensicare` legacy). |
| `path_or_url` | Relative file path within the repo, or a full URL to the artifact. |
| `commit_sha_or_version` | The exact commit SHA (full 40-char preferred) or package/version pinned at collection time. |
| `section_or_lines` | Section heading, anchor, or line range within the artifact, where available. |
| `date_collected` | ISO date (`YYYY-MM-DD`) the evidence was collected/verified. |
| `collector` | Human or named agent/specialist role that collected it. |
| `transformation` | What was done to the raw material to produce this statement (copied verbatim, summarized, translated, computed, etc.). `none` if verbatim. |
| `confidence` | `low` \| `medium` \| `high` — collector's own confidence, not a validation status. |
| `owner` | The accountable human role for this statement going forward. `UNASSIGNED — VALIDATION REQUIRED` until named. |
| `validation_status` | `VALIDATION REQUIRED` \| `VALIDATED (<date>, <validator>)` \| `N/A` (for PROPOSAL-only items not yet requiring validation). |

## 4. Additional metadata required for DECIDED entries

A **DECIDED** label additionally requires:

- `decided_by`: the named human authority (never a role placeholder, never an
  agent).
- `decided_date`: ISO date.
- `rationale`: why, in enough detail that a future reviewer can assess whether
  the rationale still holds.
- `supersession_rule`: what event, date, or condition requires the decision to
  be revisited.

## 5. Copy-paste YAML front-matter template

Use this front matter at the top of any file, requirement, ADR, or register
entry that makes a material, evidence-labeled statement:

```yaml
---
id: <STABLE-ID>              # e.g. SAF-0001, RISK-0004, EVID-0007 — see traceability-policy.md
title: <short title>
label: SOURCE | OBSERVED | INFERENCE | PROPOSAL | VALIDATION REQUIRED | DECIDED
statement: >
  <the material statement itself, one or two sentences>
provenance:
  source_repo: <repo name>
  path_or_url: <relative path or URL>
  commit_sha_or_version: <full commit SHA or version string>
  section_or_lines: <section heading or line range>
  date_collected: <YYYY-MM-DD>
  collector: <name or specialist role>
  transformation: <none | summarized | computed | translated | ...>
  confidence: low | medium | high
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED | VALIDATED (<date>, <validator>) | N/A
# Required only when label: DECIDED
decision:
  decided_by: <named human authority>
  decided_date: <YYYY-MM-DD>
  rationale: >
    <why>
  supersession_rule: >
    <what would trigger revisiting this>
links:
  requirements: []            # e.g. [PRD-0003, SAF-0002]
  hazards: []                 # e.g. [HAZ-0001]
  adrs: []                    # e.g. [ADR-0001]
  tests: []                   # e.g. [TST-0004]
  pr: null                    # PR URL/number once implementation lands
supersedes: null
superseded_by: null
---
```

## 6. Relationship to registers

This notation is enforced through five registers under `registers/`:

- `evidence-register.md` — OBSERVED / SOURCE facts with provenance.
- `assumptions-register.md` — INFERENCE / PROPOSAL items standing in for
  unverified facts, each with an owner and validation path.
- `decision-register.md` — DECIDED (and pending PROPOSAL) governance decisions.
- `risk-register.md` — RISK-labeled entries per `traceability-policy.md`.
- `blockers-register.md` — hard stops requiring a named human action before a
  gate (see prompt §5 Gate G0, §20) can close.

Every register row must carry the fields in §3 at minimum, and a stable ID per
`traceability-policy.md`.
