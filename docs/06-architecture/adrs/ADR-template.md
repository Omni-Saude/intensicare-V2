---
doc_id: ARCH-ADR-TEMPLATE
status: PROPOSAL
owner: UNASSIGNED — VALIDATION REQUIRED
source: INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §10 (ADR program — mandatory fields and lifecycle); docs/00-governance/evidence-notation.md; docs/00-governance/traceability-policy.md; docs/00-governance/decision-rights.md
date_collected: 2026-08-14
collector: candidate-architecture and ADR-program engineer (Wave 2)
last_updated: 2026-08-14
---

# ADR Template — IntensiCare V2

**Status of this file: PROPOSAL.** This template operationalizes the mandatory ADR
fields listed verbatim in `INTENSICARE_V2_ORCHESTRATOR_PROMPT.md` §10 (lines 616–660).
It is not itself a ratified standard; it requires DECIDED ratification per
`docs/00-governance/decision-rights.md` §2 (row "Architecture decisions (ADR
ratification)"). Until then it is the working convention for Wave-2 ADR drafts.

---

## 1. How to use this template

1. Copy everything between the `<!-- BEGIN TEMPLATE -->` and `<!-- END TEMPLATE -->`
   markers into a new file named `ADR-NNNN-<kebab-case-slug>.md` in this directory.
2. Take the next free `ADR-NNNN` from [`adr-index.md`](./adr-index.md) — that index is
   the single source of truth for the `ADR` prefix's next-available number
   (`docs/00-governance/traceability-policy.md` §2 rule 4). Never reuse a retired ID.
3. Fill **every** section. A section that does not apply is written
   `Not applicable — <one-line reason>`, never deleted and never left blank. A missing
   section makes the ADR non-conformant and it must be rejected in review.
4. Label every material statement `SOURCE` / `OBSERVED` / `INFERENCE` / `PROPOSAL` /
   `VALIDATION REQUIRED` / `DECIDED` per `docs/00-governance/evidence-notation.md` §2.
   Unlabeled material statements are non-conformant.
5. Update [`adr-index.md`](./adr-index.md) in the same change: status, dependencies,
   blocking gate.
6. **No agent may write `status: accepted` (or any later status) on any ADR.** Only the
   named human authority for that decision type may, per
   `docs/00-governance/decision-rights.md` §1.2 and `evidence-notation.md` §2 rule 3.
   An agent-authored ADR is `proposed` and nothing else.

### Non-negotiable authoring rules

- **No technology may be selected because the legacy repository or AMH used it**
  (SOURCE: prompt §3 rule 14). Every technology-bearing ADR must show measurable
  decision drivers and an evaluation against them.
- **No fabricated approvals.** `approvers:` lists *role IDs* from
  `docs/00-governance/authority-model.md`, each resolved to
  `UNASSIGNED — VALIDATION REQUIRED` until a human is named. Never invent a name.
- **The author is not an approver.** Check the required-independence pairs in
  `decision-rights.md` §3 before listing approvers.
- **Alternatives are real or the ADR is theatre.** At least two viable alternatives plus
  "defer / do nothing" where meaningful (SOURCE: prompt §10). An alternative written only
  to be dismissed must still carry its honest consequences.

---

## 2. Lifecycle

The canonical lifecycle, its transition rules, and who may perform each transition are
defined once in [`adr-index.md`](./adr-index.md) §2. Summary of the permitted `status`
values (SOURCE: prompt §10, line 618):

`not-started` → `proposed` → `under-review` → `accepted` | `rejected` → `implemented` → `verified` → `superseded` | `retired`

- `not-started` is a **backlog bookkeeping state added by this program**, not one of
  §10's lifecycle states: the ID is reserved and the topic is known, but no draft exists.
  It is labeled PROPOSAL, not SOURCE — see `adr-index.md` §2.1.
- SOURCE (prompt §10, line 618): *"'Accepted' does not mean implemented; 'implemented'
  does not mean verified."* Never advance two states in one change.

---

<!-- BEGIN TEMPLATE -->

```yaml
---
# ---- Mandatory identity block (prompt §10: stable ID, title, status, date, owner,
#      approvers, decision deadline) ----
id: ADR-NNNN
title: <imperative, decision-shaped title — what is being decided, not the answer>
status: proposed            # not-started | proposed | under-review | accepted | rejected |
                            # implemented | verified | superseded | retired
status_history:
  - status: proposed
    date: <YYYY-MM-DD>
    by: <authoring specialist role>
    note: <why the state changed>
date: <YYYY-MM-DD>          # date of the current status
owner: UNASSIGNED — VALIDATION REQUIRED     # accountable human role, per authority-model.md
approvers:                  # role IDs only; never a human name invented by an agent
  - UNASSIGNED — VALIDATION REQUIRED  # (candidate role: AUTH-XXXX — see decision-rights.md §2)
decision_deadline: UNSET — VALIDATION REQUIRED   # a date, or the gate/event that forces it
deciding_authority_rule: <which decision-rights.md §2 row governs this ADR>
independence_check: <which decision-rights.md §3 pairs apply; who may NOT approve>

# ---- Traceability (traceability-policy.md §3 rule 3) ----
links:
  drivers:                  # NFR / DOM / RISK items this ADR responds to
    domain_invariants: []   # e.g. [DOM-0001, DOM-0006]
    quality_scenarios: []   # see ../quality-attributes/quality-attribute-scenarios.md
    risks: []               # e.g. [RISK-0004]
  constrains:               # PRD / CLR / SAF items this ADR enables or constrains
    requirements: []        # "pending requirement catalog" if docs/04 does not yet exist
    clinical: []
    safety: []
  hazards: []               # "pending safety log" if docs/05-clinical-safety/hazard-log.md absent
  tests: []                 # "pending test architecture" if no TST catalog exists
  validations: []           # VAL items — human/external validation
  adrs:
    depends_on: []
    feeds: []
  gates: []                 # G0..G8 this ADR blocks
  evidence: []              # EVID-xxxx rows, or explicit paths to the evidence documents

# ---- Supersession (prompt §10) ----
supersedes: null
superseded_by: null

# ---- Provenance (evidence-notation.md §3 — every material artifact carries this) ----
provenance:
  source_repo: intensicare-V2
  path_or_url: <this file's path>
  commit_sha_or_version: <repo commit at authoring>
  section_or_lines: <the prompt/evidence sections this ADR derives from>
  date_collected: <YYYY-MM-DD>
  collector: <authoring specialist role>
  transformation: <none | summarized | reasoned-from>
  confidence: low | medium | high
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
---
```

# ADR-NNNN — <title>

> **Status: <status>. <One sentence stating exactly what this document does and does not
> do.>** An ADR in `proposed` state records options and drivers; it records **no
> decision**. Nothing below may be cited as settled.

## 1. Context and problem statement

<What forces the question now? What breaks if it is not answered? State the problem as a
question with a scope boundary. Cite the prompt section, gate, or evidence that raises it.
Every material sentence carries an evidence label.>

**Question:** <the decision question, phrased so that each alternative in §4 is a direct
answer to it.>

**Out of scope:** <adjacent questions deliberately left to other ADRs, each named by ID.>

## 2. Evidence and assumptions

### 2.1 Evidence

| # | Label | Statement | Source (repo / path / commit / section) | Confidence |
|---|---|---|---|---|
| E1 | SOURCE / OBSERVED / INFERENCE | | | |

State plainly whether this ADR **re-verified** each item or is **citing another
specialist's verification**. Citing a Wave-1 dossier is `SOURCE`, not `OBSERVED` — only
the agent that performed the verification may write `OBSERVED`
(`evidence-notation.md` §2).

### 2.2 Assumptions

| # | Assumption | Why it is needed | What invalidates it | Owner | Register status |
|---|---|---|---|---|---|
| A1 | | | | UNASSIGNED — VALIDATION REQUIRED | to be filed in `docs/00-governance/registers/assumptions-register.md` |

### 2.3 Hypotheses to test (where the prompt supplies a starting hypothesis)

| # | Hypothesis | How it would be tested | Who tests it | Current status |
|---|---|---|---|---|
| H1 | | | | UNTESTED |

## 3. Decision drivers and measurable quality attributes

| # | Driver | Why it matters here | Measurable quality attribute | Target |
|---|---|---|---|---|
| D1 | | | <scenario ID in `../quality-attributes/quality-attribute-scenarios.md`> | VALIDATION REQUIRED |

Drivers must be **discriminating** — a driver that every alternative satisfies equally
does not belong in the table. Targets are written `VALIDATION REQUIRED` until validated
user/safety needs exist (Gate G1); **do not invent numeric targets**.

## 4. Alternatives considered

At least two viable alternatives plus "defer / do nothing" where meaningful.

### Option A — <name>

**Description.** <what it concretely means for this system>

**How it answers each driver.** <D1..Dn, honestly, including where it is weak>

**Positive consequences.** <+>

**Negative consequences.** <−>

**What would have to be true for this to be the right answer.** <the falsifiable
preconditions>

**Exit cost if chosen and later reversed.** <what is stranded>

### Option B — <name>

<same structure>

### Option Z — Defer / do nothing

**Description.** <what "not deciding" concretely means, including what work proceeds
anyway and under what reversibility constraint>

**Positive / negative consequences.** <+ / −>

**Cost of delay.** <what becomes more expensive or less reversible with time>

### 4.1 Comparison against drivers

| Driver | Option A | Option B | Option Z |
|---|---|---|---|
| D1 | | | |

Use qualitative, evidence-labeled cells. Do not score numerically unless the weights have
been ratified by the named owners (cf. prompt §6.3 for the portfolio analogue).

## 5. Decision and scope

> **While `status: proposed` this section reads exactly:**
> **NO DECISION IS RECORDED.** This ADR presents options and drivers only. Filling this
> section is reserved to the named deciding authority in the front matter.

On acceptance, this section must state: the chosen option; the precise scope it binds
(which modules, tenants, environments, pathways, releases); what it explicitly does
**not** bind; and the date and rationale of acceptance.

### 5.1 Conditions that must be satisfied before this ADR can be accepted

| # | Condition | Owner | Evidence that would close it | Status |
|---|---|---|---|---|
| C1 | | | | OPEN |

## 6. Consequences

### 6.1 Positive

### 6.2 Negative

### 6.3 Neutral / structural

## 7. Cross-cutting implications

Each row is mandatory (SOURCE: prompt §10). Write `Not applicable — <reason>` rather than
omitting a row.

| Dimension | Implication | Evidence label | Owner role | Follow-up ID |
|---|---|---|---|---|
| Clinical safety | | | | HAZ: pending safety log |
| Security | | | | |
| Privacy (LGPD, minimization, purpose) | | | | |
| Interoperability | | | | |
| Accessibility | | | | |
| Operational | | | | |
| Cost | | | | |
| Migration | | | | |

## 8. Reversibility, revisit triggers, kill/rollback

### 8.1 Reversibility assessment

| Option | Reversibility | What is stranded on reversal | Estimated exit cost | Label |
|---|---|---|---|---|

SOURCE (prompt §9.1 principle 11): *"Prefer reversible decisions and record
extraction/revisit triggers."*

### 8.2 Revisit triggers

Triggers must be **observable events or measurements**, not calendar hopes.

| # | Trigger | How it is detected | Who is notified | Action on trigger |
|---|---|---|---|---|
| T1 | | | | |

### 8.3 Kill switch / rollback strategy

<What is switched off, by whom, within what time, with what clinical fallback, and how the
system reconciles afterwards. If the decision has no kill switch, say so explicitly and
record it as a risk.>

## 9. Validation method and linked evidence

| # | Claim this ADR makes | Validation method | Environment required | Linked IDs |
|---|---|---|---|---|
| V1 | | | | REQ: … / HAZ: … / TST: … |

Where a catalog does not yet exist, write the placeholder verbatim and never an invented
ID: `REQ: pending requirement catalog`, `HAZ: pending safety log`,
`TST: pending test architecture`, `VAL: pending validation backlog`.

SOURCE (prompt §10): validation method and linked requirements/hazards/tests are
mandatory. An ADR whose claims cannot be validated by any named method is not ready for
`under-review`.

## 10. Supersession relationships

- **Supersedes:** <ADR ID(s) or `none`>
- **Superseded by:** <ADR ID or `none`>
- **Relationship notes:** <partial supersession, scope carve-outs, migration order>

## 11. Completeness checklist (reviewer's gate)

- [ ] Stable ID matches the filename and `adr-index.md`
- [ ] Status is one of the permitted values and matches `adr-index.md`
- [ ] Owner, approvers, decision deadline present (placeholders permitted; invented names are not)
- [ ] Author is not listed as an approver; independence pairs checked
- [ ] Context states a decision *question* with an explicit scope boundary
- [ ] Every material statement carries an evidence label
- [ ] Evidence table distinguishes re-verified (`OBSERVED`) from cited (`SOURCE`)
- [ ] Assumptions each have an invalidation condition and an owner
- [ ] ≥2 viable alternatives plus defer/do-nothing
- [ ] Every alternative has both positive and negative consequences
- [ ] Drivers are discriminating and map to measurable quality attributes
- [ ] No invented numeric target; unvalidated targets read `VALIDATION REQUIRED`
- [ ] All eight cross-cutting implication rows present
- [ ] Reversibility, revisit triggers, kill/rollback present
- [ ] Validation method with linked (or honestly placeheld) REQ/HAZ/TST IDs
- [ ] Supersession fields present
- [ ] No technology chosen by inheritance from legacy or AMH (prompt §3 rule 14)
- [ ] `adr-index.md` updated in the same change

<!-- END TEMPLATE -->

---

## 3. What this template deliberately does not do

- It does **not** grant any agent authority to accept an ADR.
- It does **not** define the quality-attribute targets an ADR must meet — those live in
  [`../quality-attributes/quality-attribute-scenarios.md`](../quality-attributes/quality-attribute-scenarios.md)
  and are all `VALIDATION REQUIRED` until Gate G1.
- It does **not** prescribe a document length. An ADR that answers a two-option question
  in one page is better than one that pads.
- It does **not** replace the registers. A decision is not durable until it also appears
  in `docs/00-governance/registers/decision-register.md`.
