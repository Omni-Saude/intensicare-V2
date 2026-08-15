---
doc_id: USR-ROLES-HYPOTHESES
title: IntensiCare V2 — User Role Hypotheses and Decision-Rights Inputs
status: PROPOSAL
label: PROPOSAL
approver: UNASSIGNED — VALIDATION REQUIRED
approver_roles:
  - AUTH-UX (participant-research acceptance, workflow acceptance)
  - AUTH-INTENDED-USE (which roles are intended users)
owner: UNASSIGNED — VALIDATION REQUIRED
validation_status: VALIDATION REQUIRED
last_updated: 2026-08-14
provenance:
  source_repo: intensicare-V2
  path_or_url: docs/02-users-and-workflows/user-roles-hypotheses.md
  commit_sha_or_version: cb355212b96fc5e63ab79474d50538cc86d96a5d (V2 repo HEAD at collection; this file is new and uncommitted)
  section_or_lines: whole document
  date_collected: 2026-08-14
  collector: critical-care intended-use analyst
  transformation: legacy persona statements summarized and RE-LABELLED as hypotheses; no persona adopted as fact
  confidence: low
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
evidence_inputs:
  - repo: intensicare-V2
    path: INTENSICARE_V2_ORCHESTRATOR_PROMPT.md
    commit: staged but NOT committed at collection time (git status "A"); working-tree copy read
    lines_used: "33-45, 111-127, 213-217, 239-262, 1039-1063"
  - repo: intensicare (legacy, READ-ONLY, risk-informed input NOT authority)
    path: INTENSICARE_TECHNICAL_ASSESSMENT.md
    commit: 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79
    lines_used: "52-58, 94-152, 318-357, 993-1029"
---

# IntensiCare V2 — User Role Hypotheses and Decision-Rights Inputs

> ## ⚠️ NO USER OF INTENSICARE V2 HAS EVER BEEN OBSERVED
>
> **OBSERVED** (V2 repository at `cb355212b96fc5e63ab79474d50538cc86d96a5d`, inspected
> 2026-08-14): no user research, interview, observation, or site visit has been conducted for
> IntensiCare V2. No site has been identified. No participant has been recruited.
>
> **SOURCE** (`INTENSICARE_TECHNICAL_ASSESSMENT.md:56`), verbatim: "**[V] No stakeholder
> interviews or observed ICU workflow studies were performed.** Persona and workflow
> conclusions derive from repository documentation."
>
> **INFERENCE:** the legacy personas are therefore *documentation about documentation*. Every
> role below is a **HYPOTHESIS** at two removes from reality: a V2 restatement of a legacy
> document that was itself never validated against a clinician. Treating any statement below
> as a description of real ICU work would be an error.
>
> **Gate G1 status — SOURCE** (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:253`): "Do not approve
> solution architecture until intended users have been observed **or the absence is explicitly
> accepted as a blocking risk**." As of 2026-08-14 neither has occurred. **The absence of
> observation is a BLOCKING RISK that no named human has accepted**, because no human is
> named. See `g1-validation-backlog.md`.

`UR-nn` anchors are document-local review handles, not catalog IDs
(`docs/00-governance/traceability-policy.md:21-39`); they map to the `USR` prefix.

---

## 1. Hypothesized user roles

Derived from `INTENSICARE_TECHNICAL_ASSESSMENT.md:133-139`. The legacy assessment cited
`docs/product/personas.md` in the legacy repository; that file was **not** independently read
for this document, so the citations below are to the assessment's summary of it, at one
remove. This is recorded rather than smoothed over.

### UR-01 — Intensivist / ICU physician

**SOURCE** (`INTENSICARE_TECHNICAL_ASSESSMENT.md:133`, summarizing legacy
`docs/product/personas.md:3-21`): "Intensivist: identify deterioration quickly, understand
contributing signals and trends, and act with clinical accountability."

**HYPOTHESIS (PROPOSAL):** the intensivist is the role holding final clinical accountability
for action on a deterioration signal, consumes V2 primarily for *explanation and
corroboration* rather than for first notification, and is frequently not physically present
in the unit.

**Questions observation must answer:**
1. Is the intensivist ever the *first* to see a V2 work item, or always second after a nurse?
2. How many patients, and how many units, is one intensivist responsible for, by shift and by
   day-of-week? Does this change overnight or at weekends?
3. Is the intensivist present in the unit, in the hospital, or remote/on-call? Does V2's value
   change between these states?
4. What does "act with clinical accountability" mean in recorded practice — is there a
   documentation artifact, and would V2 duplicate or replace it?
5. In Brazilian ICU practice, how do *diarista* and *plantonista* roles differ in relation to
   deterioration response? **INFERENCE:** this distinction is absent from the legacy persona
   set entirely, which is itself evidence that the personas were not derived from Brazilian
   ICU observation.

---

### UR-02 — ICU nurse (bedside)

**SOURCE** (`INTENSICARE_TECHNICAL_ASSESSMENT.md:134`, summarizing legacy
`docs/product/personas.md:23-41`): "ICU nurse: avoid manual score calculation, understand
alert rationale, acknowledge and communicate actions with minimal interaction."

**HYPOTHESIS (PROPOSAL):** the bedside nurse is the highest-frequency user, is most often the
first human to encounter a work item, and interacts under the greatest time pressure and the
most frequent interruption.

**INFERENCE — a caution about "avoid manual score calculation":** the legacy persona framed
manual calculation as a burden to remove. But manual calculation also produces *engagement
with the underlying values*. Automating it may remove burden **and** remove the clinician's
independent mental model — which is precisely the mechanism of automation bias measured by
HM-03 in `../01-vision-and-intended-use/success-and-harm-metrics.md`. Whether this trade is
net-positive is unknown and is a research question, not a design assumption.

**Questions observation must answer:**
1. Does the nurse currently calculate scores manually at all? At what frequency, and is the
   calculation actually used in a decision?
2. What is the nurse-to-patient ratio in the target unit, by shift? (Brazilian ICU staffing
   norms must be observed, not assumed from other health systems.)
3. Where is the nurse physically when a work item would arrive — at a bedside, at a station,
   in a corridor? What device is within reach, and are their hands free or gloved?
4. What does "minimal interaction" mean in practice: how many seconds, how many taps, and
   what is the maximum tolerable before the nurse defers or ignores?
5. Do nurses currently use any workaround (paper list, whiteboard, personal messaging) to
   track deteriorating patients? **INFERENCE:** an existing workaround is the strongest
   available evidence of a real unmet need, and the legacy evidence contains none because
   none was collected.

---

### UR-03 — Unit coordinator / charge nurse (*enfermeiro coordenador*)

**SOURCE** (`INTENSICARE_TECHNICAL_ASSESSMENT.md:135`, summarizing legacy
`docs/product/personas.md:43-61`): "Unit coordinator: understand occupancy and acuity, monitor
operational/quality indicators, and export data."

**HYPOTHESIS (PROPOSAL):** the coordinator holds unit-level awareness of outstanding work and
is the likely owner of reassignment when a work item is unattended.

**⚠️ Evidence caution — SOURCE** (`INTENSICARE_TECHNICAL_ASSESSMENT.md:152`): "It does not yet
establish the coordinator analytics/export or rapid-response mobile journeys." **SOURCE**
(`:322`): "there is no verified coordinator KPI/export workflow." **INFERENCE:** the
coordinator persona was documented but the corresponding workflow was never built or
validated in the legacy system. This role has the widest gap between documented intent and
any evidence, and is correspondingly the least safe to design against.

**Questions observation must answer:**
1. Does this role exist as described in the target site, and what is it actually called?
2. Is the coordinator's interest clinical (who needs attention now) or managerial (occupancy,
   indicators)? The legacy persona conflates both; they imply different products.
3. Does the coordinator have authority to reassign clinical work, or only to request it?
4. Is "export data" a real daily need or an artifact of a purchasing conversation? See §3
   (buyer vs. user).

---

### UR-04 — Rapid-response team

**SOURCE** (`INTENSICARE_TECHNICAL_ASSESSMENT.md:136`, summarizing legacy
`docs/product/personas.md:63-81`): "Rapid-response team: receive concise mobile escalation
context and navigate to the patient."

**Status: OUT OF SCOPE for V2 v1** per `../01-vision-and-intended-use/intended-use-statement.md`
IU-04c and `../01-vision-and-intended-use/non-intended-uses.md` NIU-04b. Retained here so the
exclusion is traceable rather than silent.

**INFERENCE:** an RRT is a *cross-unit* actor. Including it would immediately expand the care
setting beyond the ICU (IU-03), which is why the setting boundary and this role must be
decided together rather than separately.

---

### UR-05 — Administrators, security, and compliance

**SOURCE** (`INTENSICARE_TECHNICAL_ASSESSMENT.md:137`): "Administrators/security/compliance:
manage access, tenants, thresholds, and audit evidence. **Current frontend panels for several
of these are placeholders.**"

**INFERENCE:** the legacy assessment records this role as documented but substantially
unimplemented — `:322` notes "several admin destinations are visual placeholders," and `:148`
identifies specific placeholder components. **PROPOSAL:** V2 must treat administrative
capability as in-scope-but-unbuilt rather than assumed, because access management and audit
are preconditions for the safety loop's final step
(`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:42`), not optional accessories.

**Questions observation must answer:** who administers clinical thresholds in the target
institution, and is that person clinical or technical? **INFERENCE:** if threshold
administration is available to a non-clinical administrator, that is a route by which clinical
rule content could change without clinical approval — which
`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:122` forbids ("Clinical rules are immutable, versioned
release artifacts. Rule authors may not approve their own clinical content").

---

### UR-06 — Hospital IT / data platform teams

**SOURCE** (`INTENSICARE_TECHNICAL_ASSESSMENT.md:138`): "Hospital IT/data platform teams:
supply identity, MPI, FHIR/HL7/Gold data, terminology, network, and operational services."

**INFERENCE:** not a clinical user but a *dependency owner*. V2's ability to satisfy its own
safety loop depends on this role's systems, and the AMH-side counterpart
(`AUTH-AMH-OWNER`) is recorded in `docs/00-governance/authority-model.md:46` as "OPEN — no
AMH-side contact has been established in the evidence collected as of 2026-08-14."

---

### UR-07 — Clinical governance / regulatory stakeholders

**SOURCE** (`INTENSICARE_TECHNICAL_ASSESSMENT.md:139`): "Clinical governance/regulatory
stakeholders: approve rules, evaluate performance, manage hazards, and define human
responsibility boundaries."

**INFERENCE:** this role is the human counterpart of `AUTH-CLINSAFETY`. It is not a user of the
clinical interface but is the authority without which no clinical content may ship.

---

### UR-08 — Assistive-technology users (cross-cutting, not a separate persona)

**SOURCE** (`INTENSICARE_TECHNICAL_ASSESSMENT.md:357`): the legacy assessment called for
validation "through representative ICU simulations with physicians, nurses, coordinators, and
**assistive-technology users**."

**INFERENCE:** the legacy persona set (`:133-139`) does **not** include assistive-technology
users, yet the legacy UX conclusion (`:357`) names them as required research participants.
This is an internal inconsistency in the legacy evidence and is recorded as such. **PROPOSAL:**
V2 should treat assistive-technology use as a cross-cutting attribute of UR-01/02/03 rather
than a separate persona — a nurse who uses a screen reader is a nurse, and segregating them
into their own persona is how their needs become an optional workstream.

---

## 2. The four Gate G1 questions

**SOURCE** (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:255`), Gate G1 requires validating "who
monitors, who acts, who owns escalation, and who closes work."

**SOURCE** (`INTENSICARE_TECHNICAL_ASSESSMENT.md:1000`), legacy open question #4: "Who owns
acknowledgment, escalation, reassignment, override, and closure **during shift changes and
downtime**?" — recorded as unresolved.

**All four answers below are HYPOTHESES. None is observed.**

| G1 question | Hypothesis (PROPOSAL) | Confidence | Why it is not settled |
|---|---|---|---|
| **Who monitors?** | UR-02 continuously at bedside; UR-03 at unit level; UR-01 intermittently. | **Low** | Whether anyone "monitors" a screen in a real ICU, versus being alerted by it, is unknown. A system designed for monitoring that is used for notification is the wrong product. |
| **Who acts?** | UR-02 for immediate assessment; UR-01 for therapeutic decisions. | **Low** | The nurse/physician action boundary is institution-specific and protocol-specific, and in Brazil is shaped by COFEN/CFM scope-of-practice rules that have not been reviewed. |
| **Who owns escalation?** | UR-02 escalates to UR-01; UR-03 escalates unattended items. | **Very low** | No evidence at all. **INFERENCE:** escalation is the single most consequential unknown, because an escalation path that does not match reality produces work items that are routed to nobody. |
| **Who closes work?** | The acting clinician, with an audit record. | **Very low** | **Unresolved sub-question:** may a work item be closed by someone who did not act? May it be closed because it is no longer relevant? **NIU-02 forbids autonomous closure**, which means every work item requires a human closer — and if none exists, items accumulate indefinitely. This interaction has not been designed or observed. |

**INFERENCE — the compounding risk:** these four answers are not independent. If "who
escalates" is wrong, "who closes" is also wrong, and the durable-work-item design in the
safety loop (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:40-41`) rests on both. A single
observation study can resolve all four; no amount of documentation can resolve any of them.

---

## 3. Buyer vs. daily user — an explicitly unanswered question

**SOURCE** (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:261`), Gate G1 requires validating "what
buyers value versus what clinicians use daily."

**SOURCE** (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:214`), SPARK "P" requires "purchasing and
governance stakeholders."

**OBSERVED:** no purchasing stakeholder has been identified for V2. No commercial model,
customer, or buyer exists in any evidence reviewed.

**INFERENCE (hypothesis, from `INTENSICARE_TECHNICAL_ASSESSMENT.md:135` and `:322`):** the
legacy coordinator persona emphasized "operational/quality indicators, and export," and the
legacy assessment found that capability documented but unbuilt and unverified. A plausible
reading is that indicators/export served a *purchasing* narrative rather than a *daily-use*
need. This is a hypothesis about the legacy product's history, **not** a finding about any
real buyer, and it must not be repeated as fact. It is recorded because it predicts a specific
failure mode for V2: building the dashboard that sells rather than the work surface that gets
used.

**VALIDATION REQUIRED** — identify purchasing and governance stakeholders at the target site
and characterize their evaluation criteria separately from clinician daily-use needs. Owner:
`AUTH-PRODUCT` — UNASSIGNED.

---

## 4. Decision-rights inputs (roles requiring named humans)

**PROPOSAL — this section supplies *inputs* to the stakeholder/decision-rights map required by
`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:224`.** The authoritative map is
`docs/00-governance/authority-model.md` and `docs/00-governance/decision-rights.md`, which are
outside this specialist's write scope. Nothing here overrides them.

**SOURCE** (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:247-248`), Gate G0: "product, clinical
safety, security, privacy/legal, data-platform, UX, and operations decision owners are named"
and "intended use has a named human approver."

### 4.1 Decisions this specialist's work is blocked on

| Decision needed | Authority role | Current holder | Blocks |
|---|---|---|---|
| Approve intended use | `AUTH-INTENDED-USE` | **UNASSIGNED** | `../01-vision-and-intended-use/intended-use-statement.md` in its entirety |
| Decide paediatric/neonatal boundary | `AUTH-CLINSAFETY` + `AUTH-INTENDED-USE` | **UNASSIGNED** | IU-06 — flagged BLOCKING |
| Decide care-setting boundary | `AUTH-INTENDED-USE` | **UNASSIGNED** | IU-04 |
| Accept or reject "users unobserved" as a risk | `AUTH-CLINSAFETY` + `AUTH-PRODUCT` | **UNASSIGNED** | Gate G1 itself |
| Approve the research plan, consent, and ethics route | `AUTH-PRIVACY-LEGAL` + `AUTH-UX` | **UNASSIGNED** | `user-research-plan.md` |
| Accept research findings | `AUTH-UX` | **UNASSIGNED** | Any conversion of hypothesis → observation |
| Approve metric definitions and thresholds | `AUTH-CLINSAFETY` + `AUTH-PRODUCT` | **UNASSIGNED** | `../01-vision-and-intended-use/success-and-harm-metrics.md` |

### 4.2 Independence constraints that apply to user research

**SOURCE** (`docs/00-governance/decision-rights.md:64`), required-independence pair #5: "UX
designer" must be independent from "Participant-research moderator/acceptance owner."

**INFERENCE:** applied to this work — the specialist who authored these hypotheses must not be
the party who validates them. A researcher who wrote the hypothesis and then runs the study
will confirm the hypothesis. **PROPOSAL:** the contextual inquiry in `user-research-plan.md`
must be moderated and accepted by a party independent of the authorship of this document, and
that independence must be recorded before fieldwork begins, not asserted afterwards.

### 4.3 Site-side roles that must be named before any fieldwork

**OBSERVED:** none of the following exists. Each is a *role to be filled*, and naming a person
is a human act — no agent may invent one
(`docs/00-governance/evidence-notation.md:55-57`).

- Site clinical sponsor (a named intensivist accountable at the site).
- Site nursing leadership contact.
- Site research/ethics contact (CEP — *Comitê de Ética em Pesquisa* — route owner).
- Site data protection officer / LGPD contact.
- Site IT and identity contact.
- Site scheduling contact for shift access.

**VALIDATION REQUIRED** for every row. Until they exist, `user-research-plan.md` cannot be
executed, only proposed.

---

## 5. Statement of epistemic status

**INFERENCE — summarizing this document:** IntensiCare V2 currently has seven role
*hypotheses*, zero role *observations*, four unanswered Gate G1 ownership questions, one
identified internal inconsistency in the legacy evidence (UR-08), and no named human in any
authority role. Per `INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:1043`, this satisfies the stop
condition "intended use, patient population, clinical ownership, or human action cannot be
established."

**This document is evidence that the question is open, not an answer to it.**

---

## 6. Cross-references

- `workflow-hypotheses.md` — the journeys these roles are hypothesized to perform.
- `user-research-plan.md` — how each hypothesis would be tested.
- `g1-validation-backlog.md` — the consolidated blocking-question list.
- `../01-vision-and-intended-use/intended-use-statement.md` §4 — intended users.
- `../00-governance/authority-model.md`, `../00-governance/decision-rights.md` — the authoritative decision-rights map.
