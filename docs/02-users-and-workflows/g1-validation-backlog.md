---
doc_id: USR-G1-VALIDATION-BACKLOG
title: IntensiCare V2 — Gate G1 Validation Backlog
status: PROPOSAL
label: VALIDATION REQUIRED
approver: UNASSIGNED — VALIDATION REQUIRED
owner: UNASSIGNED — VALIDATION REQUIRED
validation_status: VALIDATION REQUIRED
last_updated: 2026-08-14
provenance:
  source_repo: intensicare-V2
  path_or_url: docs/02-users-and-workflows/g1-validation-backlog.md
  commit_sha_or_version: cb355212b96fc5e63ab79474d50538cc86d96a5d (V2 repo HEAD at collection; this file is new and uncommitted)
  section_or_lines: whole document
  date_collected: 2026-08-14
  collector: critical-care intended-use analyst
  transformation: Gate G1 requirements decomposed into discrete questions; legacy open questions re-scoped to G1
  confidence: medium
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
evidence_inputs:
  - repo: intensicare-V2
    path: INTENSICARE_V2_ORCHESTRATOR_PROMPT.md
    commit: staged but NOT committed at collection time (git status "A"); working-tree copy read
    lines_used: "239-262, 1039-1052"
  - repo: intensicare (legacy, READ-ONLY, risk-informed input NOT authority)
    path: INTENSICARE_TECHNICAL_ASSESSMENT.md
    commit: 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79
    lines_used: "52-58, 94-152, 229-241, 298-316, 318-357, 993-1029"
---

# IntensiCare V2 — Gate G1 Validation Backlog

> **Every item below is OPEN. Every owner is UNASSIGNED. Gate G1 is NOT satisfied.**
>
> **SOURCE** (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:253`): "Do not approve solution architecture
> until intended users have been observed or the absence is explicitly accepted as a blocking
> risk."
>
> `VAL-nnnn` IDs use the `VAL` prefix ("Human/external validation") from
> `docs/00-governance/traceability-policy.md:37`. **Numbering caution:** no canonical `VAL`
> register exists yet; if another specialist has allocated `VAL` IDs concurrently, these must be
> renumbered by the traceability owner before ratification. IDs here are provisional.

## 0. Summary

| Category | Open items | Blocking G1 | Blocking G0 first |
|---|---|---|---|
| A. Authority and ownership | 5 | 5 | 5 |
| B. Population and setting boundary | 6 | 6 | — |
| C. User roles and responsibility | 6 | 6 | — |
| D. Workflow and context | 8 | 8 | — |
| E. Safety representation | 5 | 5 | — |
| F. Language and accessibility | 4 | 4 | — |
| G. Metrics and measurement | 4 | 3 | — |
| H. Research feasibility | 5 | 5 | partly |
| **Total** | **43** | **42** | **5** |

**INFERENCE:** category A blocks every other category. No research can be commissioned, no
boundary decided, and no risk accepted without a named human. **The five category-A items are the
true critical path**; the remaining 38 are downstream of them.

**Stop condition currently met — SOURCE** (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:1043`): "intended
use, patient population, clinical ownership, or human action cannot be established." All four are
unestablished as of 2026-08-14.

**Legend:** *Why blocking* explains the consequence of proceeding without an answer. *Evidence
needed* states what would close the item — a document alone never closes an item that requires
observation or a human decision.

---

## A. Authority and ownership (also Gate G0)

**SOURCE** (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:247-249`), Gate G0.

| ID | Question | Why blocking | Evidence needed | Owner role |
|---|---|---|---|---|
| VAL-0001 | Who is the named human approver of intended use? | **SOURCE** (`:248`): G0 does not close without one. Every artifact in `docs/01-vision-and-intended-use/` is unapprovable until this exists. Per `docs/00-governance/decision-rights.md:41`, no agent may approve it. | A named person accepting the `AUTH-INTENDED-USE` role, recorded in `docs/00-governance/authority-model.md` | `AUTH-INTENDED-USE` — **UNASSIGNED** |
| VAL-0002 | Who is the named clinical-safety decision owner? | Population boundary, hazard acceptance, threshold setting, and scenario realism all require this role. No clinical content may be ratified without it. | A named person accepting `AUTH-CLINSAFETY` | `AUTH-CLINSAFETY` — **UNASSIGNED** |
| VAL-0003 | Who is the named privacy/legal owner? | **SOURCE** (`:1046`): stop when "privacy/legal basis ... or PHI use is unresolved." All fieldwork is blocked (`user-research-plan.md` §5). | A named person accepting `AUTH-PRIVACY-LEGAL` | `AUTH-PRIVACY-LEGAL` — **UNASSIGNED** |
| VAL-0004 | Who is the named UX/research owner, and who will moderate independently of hypothesis authorship? | **SOURCE** (`docs/00-governance/decision-rights.md:64`), independence pair #5. Without independence, the study confirms its own hypotheses. | Two distinct named people, recorded before fieldwork | `AUTH-UX` — **UNASSIGNED** |
| VAL-0005 | Will a named human accept "intended users have not been observed" as a blocking risk, or commission observation? | **SOURCE** (`:253`): G1 offers exactly two routes. Neither has been taken. Silence is the one option the gate does not permit. | A dated, reasoned decision in `docs/00-governance/registers/risk-register.md` | `AUTH-CLINSAFETY` + `AUTH-PRODUCT` — **UNASSIGNED** |

---

## B. Population and care-setting boundary

**SOURCE** (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:256-257`).

| ID | Question | Why blocking | Evidence needed | Owner role |
|---|---|---|---|---|
| VAL-0006 | 🚩 Is the paediatric population in scope for V2 v1? | **BLOCKING (`../01-vision-and-intended-use/intended-use-statement.md` IU-06).** MEWS/NEWS2/SOFA/qSOFA are adult instruments; applying them to children yields output that is misleading, not merely absent. Determines whether population enforcement is a system requirement. | Clinical decision plus, if in scope, separate paediatric instrument selection and validation | `AUTH-CLINSAFETY` + `AUTH-INTENDED-USE` — **UNASSIGNED** |
| VAL-0007 | 🚩 Is the neonatal population in scope for V2 v1? | As VAL-0006; neonatal physiology and instruments differ again from paediatric. | Clinical decision | `AUTH-CLINSAFETY` + `AUTH-INTENDED-USE` — **UNASSIGNED** |
| VAL-0008 | 🚩 What must V2 do when a patient is outside the approved population, or their age is unknown, unparseable, or conflicting? | Prose exclusion is not enforcement. Without this, an out-of-scope patient may receive an in-scope-looking score. Directly engages `:119` (never coerce to normal). | A specified behaviour, testable, tied to `../03-domain/status-dimensions.md` | `AUTH-CLINSAFETY` — **UNASSIGNED** |
| VAL-0009 | Which care settings are approved: ICU only, or also step-down, ward, RRT, command centre? | **SOURCE** (`:257`). Score performance does not transfer across settings by assumption; data density differs materially. | Decision per setting, plus per-setting clinical validation for any setting enabled | `AUTH-INTENDED-USE` — **UNASSIGNED** |
| VAL-0010 | Are sub-populations excluded: obstetric, ECMO/CRRT, post-cardiac-surgery, palliative/treatment-limitation? | `intended-use-statement.md` IU-07. **INFERENCE:** the palliative case is distinct — V2 could be technically correct and clinically wrong by prompting escalation that contradicts an agreed goal of care. | Clinical decision per sub-population; hazard analysis for the palliative case | `AUTH-CLINSAFETY` — **UNASSIGNED** |
| VAL-0011 | Is V2 advisory only, and is that boundary enforced rather than merely stated? | **SOURCE** (`:258`) requires validating "advisory versus directive behavior." **SOURCE** (`INTENSICARE_TECHNICAL_ASSESSMENT.md:997`) left it open. | Decision plus a testable statement of what V2 may never do (`../01-vision-and-intended-use/non-intended-uses.md` NIU-02) | `AUTH-INTENDED-USE` + `AUTH-CLINSAFETY` — **UNASSIGNED** |

---

## C. User roles and responsibility

**SOURCE** (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:255`): "who monitors, who acts, who owns
escalation, and who closes work."

| ID | Question | Why blocking | Evidence needed | Owner role |
|---|---|---|---|---|
| VAL-0012 | Who monitors? | Determines whether V2 is a monitoring surface or a notification system — different products. Currently a **low-confidence** hypothesis (`user-roles-hypotheses.md` §2). | M1 shadowing | `AUTH-UX` — **UNASSIGNED** |
| VAL-0013 | Who acts, and what is the nurse/physician action boundary? | Scope-of-practice rules (COFEN/CFM) have not been reviewed. Routing a work item to a role that cannot act on it creates delay disguised as delivery. | M1 + review of site protocols and Brazilian scope-of-practice rules | `AUTH-CLINSAFETY` + `AUTH-UX` — **UNASSIGNED** |
| VAL-0014 | Who owns escalation? | **Very low confidence.** An escalation path that does not match reality produces work items routed to nobody. | M1 + M2 | `AUTH-UX` + `AUTH-CLINSAFETY` — **UNASSIGNED** |
| VAL-0015 | Who closes work, and may someone close an item they did not act on? | NIU-02 forbids autonomous closure, so every item needs a human closer. If no closer exists, items accumulate indefinitely — an unaddressed design consequence. | M1 + M2 + explicit design decision | `AUTH-UX` + `AUTH-CLINSAFETY` — **UNASSIGNED** |
| VAL-0016 | Who owns acknowledgment, escalation, reassignment, override and closure **during shift change and downtime**? | **SOURCE** (`INTENSICARE_TECHNICAL_ASSESSMENT.md:1000`), unresolved in legacy. The handover window is where ownership is most likely to be dropped. | M2 handover observation | `AUTH-UX` + `AUTH-CLINSAFETY` — **UNASSIGNED** |
| VAL-0017 | Who may change clinical thresholds, and are they clinical or technical staff? | If a non-clinical administrator can alter thresholds, clinical rule content can change without clinical approval — forbidden by `:122`. | M1 + site administration review | `AUTH-CLINSAFETY` + `AUTH-SECURITY` — **UNASSIGNED** |

---

## D. Workflow and context

**SOURCE** (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:259-261`).

| ID | Question | Why blocking | Evidence needed | Owner role |
|---|---|---|---|---|
| VAL-0018 | What actually happens at shift handover, and what happens to unresolved work items? | **The legacy journey list contains no handover journey at all** (`workflow-hypotheses.md` WF-04). Inheriting that list inherits the gap. | M2 | `AUTH-UX` — **UNASSIGNED** |
| VAL-0019 | Is there a window in which nobody owns a work item? | If it exists it is the highest-risk period of the day, and the durable-work-item design must address it. | M2 | `AUTH-UX` + `AUTH-CLINSAFETY` — **UNASSIGNED** |
| VAL-0020 | What is the measured interruption rate, and which tasks must never be interrupted? | If interruption is the norm, partial states are normal and every task must be resumable. V2 is itself an interruption source. | M1 + M2 time-motion observation | `AUTH-UX` + `AUTH-CLINSAFETY` — **UNASSIGNED** |
| VAL-0021 | What should clinicians do when V2 is degraded or unavailable, and is there a practised fallback? | **SOURCE** (`:259`) requires validating downtime and connectivity loss. Without an answer, degraded mode has no defined clinical behaviour. | M1 + site downtime-procedure review + M3 | `AUTH-OPERATIONS` + `AUTH-CLINSAFETY` — **UNASSIGNED** |
| VAL-0022 | How are conflicting values resolved today, and what should V2 do when it detects a conflict? | `:1058` forbids silently resolving contradictions. A most-recent-wins rule is silent resolution wearing an algorithm. | M1 + M3 conflict scenarios | `AUTH-CLINSAFETY` — **UNASSIGNED** |
| VAL-0023 | What freshness window applies to each clinical input, and which missing components invalidate versus degrade a score? | **SOURCE** (`INTENSICARE_TECHNICAL_ASSESSMENT.md:999`), unresolved in legacy. Determines when `stale`/`partial`/`not_evaluated` apply — the loop's core distinction. | Clinical decision per input and per score, versioned | `AUTH-CLINSAFETY` — **UNASSIGNED** |
| VAL-0024 | What are the target devices, physical placement, unit size, and environmental constraints? | **SOURCE** (`:260`). A design validated on a desktop may be unusable on the device actually within reach of gloved hands. Also a privacy question — who else can see a shared screen. | M1 | `AUTH-UX` — **UNASSIGNED** |
| VAL-0025 | What existing workarounds (paper lists, whiteboards, messaging) are in use? | **SOURCE** (`:214`) requires observing "current workarounds." A workaround is the strongest available evidence of a real unmet need; none was collected for the legacy system. | M1 + M4 | `AUTH-UX` — **UNASSIGNED** |

---

## E. Safety representation

**SOURCE** (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:262`): "what must never be represented as
normal or complete."

| ID | Question | Why blocking | Evidence needed | Owner role |
|---|---|---|---|---|
| VAL-0026 | Is the candidate never-normal list (`workflow-hypotheses.md` §1) correct and complete? | Directly implements `:262` and `:119`. An omission here is a silent false-reassurance route. | M1 + M3 + clinical ratification | `AUTH-CLINSAFETY` — **UNASSIGNED** |
| VAL-0027 | Do clinicians actually interpret an explicit non-evaluated state as "you must look at this"? | **Rendering a state correctly and a clinician understanding it are different facts.** Only the second protects a patient, and only M3 can establish it. | M3 simulation | `AUTH-UX` + `AUTH-CLINSAFETY` — **UNASSIGNED** |
| VAL-0028 | How should degradation be surfaced at the point of clinical use without becoming its own alarm problem? | An admin-page banner does not reach the clinician reading a bed tile. Over-signalling creates a new fatigue source. | M3 | `AUTH-UX` + `AUTH-CLINSAFETY` — **UNASSIGNED** |
| VAL-0029 | What explanation does a clinician need in order to **disagree** with V2 with confidence? | Trust calibration must run in both directions. No legacy evidence addresses appropriate distrust. | M3 + M1 | `AUTH-UX` + `AUTH-CLINSAFETY` — **UNASSIGNED** |
| VAL-0030 | How should a work item behave on patient discharge, transfer, death, or identity merge? | **SOURCE** (`INTENSICARE_TECHNICAL_ASSESSMENT.md:1006`), unresolved in legacy. A work item outliving its patient is both a safety and a dignity failure. | Clinical decision + identity-model resolution | `AUTH-CLINSAFETY` + `AUTH-DATA-PLATFORM` — **UNASSIGNED** |

---

## F. Language and accessibility

**SOURCE** (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:260`).

| ID | Question | Why blocking | Evidence needed | Owner role |
|---|---|---|---|---|
| VAL-0031 | Are the pt-BR clinical state terms interpreted by clinicians as intended — especially `não avaliado`? | The single most safety-critical term in the product. A `lang="pt-BR"` attribute is a technical declaration, not validation (`user-research-plan.md` §6). | M3 comprehension testing with clinicians | `AUTH-UX` + `AUTH-CLINSAFETY` — **UNASSIGNED** |
| VAL-0032 | Which severity vocabulary is correct in pt-BR? | **SOURCE** (`INTENSICARE_TECHNICAL_ASSESSMENT.md:123`): legacy carried two conflicting vocabularies (`CRIT/URG/WARN/INFO` vs `critical/urgent/watch/normal`) unresolved. V2 must not inherit either unvalidated. | M1 + M3 + clinical ratification | `AUTH-CLINSAFETY` + `AUTH-UX` — **UNASSIGNED** |
| VAL-0033 | Can assistive-technology users complete every task in the safety loop? | **SOURCE** (`INTENSICARE_TECHNICAL_ASSESSMENT.md:345`): the legacy system had no `aria-live` usage found and no tested announcement strategy. For a system whose function is announcing change, this is a safety defect, not only an accessibility one. | M5 with **real** AT users, task-based | `AUTH-UX` — **UNASSIGNED** |
| VAL-0034 | What accessibility needs exist among the actual clinical workforce? | **SOURCE** (`:260`) requires validating "accessibility needs." Designing for a hypothetical AT user rather than the real workforce misses the actual needs. | M1 + M5 recruitment | `AUTH-UX` — **UNASSIGNED** |

---

## G. Metrics and measurement

| ID | Question | Why blocking | Evidence needed | Owner role |
|---|---|---|---|---|
| VAL-0035 | What is the pre-V2 baseline for time-to-recognition, alert burden, fatigue, and interruption? | **Baselines are unobtainable once V2 is deployed.** This is the strongest scheduling constraint in the programme: research delayed past deployment permanently loses these measurements. | Baseline observational study, before any deployment | `AUTH-PRODUCT` + `AUTH-UX` — **UNASSIGNED** |
| VAL-0036 | What is the pre-registered clinical definition of "deterioration" for adjudication? | Without pre-registration, definitions can be fitted post hoc and every accuracy figure becomes unfalsifiable. | Clinical definition + adjudication rubric, pre-registered | `AUTH-CLINSAFETY` — **UNASSIGNED** |
| VAL-0037 | What is the lawful basis for outcome adjudication and subgroup analysis? | **SOURCE** (`:1046`). `../01-vision-and-intended-use/non-intended-uses.md` NIU-07 places this analysis inside the secondary-use exclusion until a basis exists. Equity monitoring (HM-06) and data minimization pull in opposite directions. | Legal determination | `AUTH-PRIVACY-LEGAL` — **UNASSIGNED** |
| VAL-0038 | What time-to-decision goals do clinicians actually hold? | **SOURCE** (`:260`) requires validating "time-to-decision goals." **SOURCE** (`INTENSICARE_TECHNICAL_ASSESSMENT.md:152`): the legacy "under 30 seconds" objective required task analysis that was never performed. *(Blocks metric ratification rather than G1 itself.)* | M1 + M3 task analysis | `AUTH-UX` + `AUTH-CLINSAFETY` — **UNASSIGNED** |

---

## H. Research feasibility and buyer/user distinction

| ID | Question | Why blocking | Evidence needed | Owner role |
|---|---|---|---|---|
| VAL-0039 | Which site(s) will host the research, and who is the named site clinical sponsor? | **OBSERVED (2026-08-14): no site has been identified or contacted.** Without a site there is no research, and without research G1 has only the risk-acceptance route. | A named site and named sponsor | `AUTH-PRODUCT` — **UNASSIGNED** |
| VAL-0040 | Is an ethics (CEP/CONEP) submission required, and what is the route? | **SOURCE** (`:1046`). All fieldwork is blocked until resolved (`user-research-plan.md` §5, C1). | Legal/ethics determination + submission if required | `AUTH-PRIVACY-LEGAL` — **UNASSIGNED** |
| VAL-0041 | What is the LGPD basis for observing clinicians, and how is incidental patient-data exposure handled? | **SOURCE** (`:124`) prohibits PHI in any V2 artifact. Constrains what a researcher may write down — a methodological limit that must be set before fieldwork. | Legal determination + no-PHI field protocol | `AUTH-PRIVACY-LEGAL` — **UNASSIGNED** |
| VAL-0042 | How is consent obtained such that declining is invisible and costless to the clinician? | Consent from an observed employee is not straightforwardly free. If declining is visible to management, consent is nominal. Also engages NIU-06. | Consent design reviewed with nursing leadership | `AUTH-PRIVACY-LEGAL` + `AUTH-UX` — **UNASSIGNED** |
| VAL-0043 | Who are the purchasing and governance stakeholders, and what do they value versus what clinicians use daily? | **SOURCE** (`:261`). **INFERENCE** (`user-roles-hypotheses.md` §3): the legacy coordinator analytics/export capability was documented but unbuilt and unverified — a pattern consistent with building what sells rather than what is used. | M6 stakeholder interviews, separate from clinician sessions | `AUTH-PRODUCT` — **UNASSIGNED** |

---

## I. Dependencies on other workstreams

**INFERENCE — items that cannot be closed by user research alone:**

| ID | Depends on | Note |
|---|---|---|
| VAL-0009, VAL-0039 | AMH compatibility (`docs/08-interoperability/amh-data/`) | **SOURCE** (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:98`): a documented contradiction exists over whether ICU vital signs are available at all, with the explicit warning "do not infer that ICU vitals are available." Observing workflows V2 could never support would produce a well-researched, undeliverable design. |
| VAL-0021 | Architecture / degraded-mode design | Clinical fallback behaviour cannot be specified before failure modes are known. |
| VAL-0023 | Clinical pathway portfolio (Wave 2 recipient) | Freshness and invalidation rules are per-rule clinical content. |
| VAL-0030 | Identity/tenant model | **SOURCE** (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:99`): AMH ADR-041 vs ADR-006 conflict on longitudinal identity is unresolved and must not be silently resolved by V2. |
| VAL-0035 | Programme schedule | Baseline measurement has a hard deadline: the day before deployment. |

---

## J. How this backlog closes

**PROPOSAL:**

1. Category A closes first, by naming humans. Nothing else can proceed. **INFERENCE:** these five
   items are not research tasks — they are staffing decisions, and no amount of analysis
   substitutes for them.
2. VAL-0005 then determines the route: commissioned observation, or explicitly accepted blocking
   risk with recorded rationale. Both are permitted by `:253`; silence is not.
3. If observation is commissioned, categories C–F close through `user-research-plan.md`, and
   category H closes first as its precondition.
4. Categories B and G close through named human decisions informed by, but not replaced by,
   research.
5. Gate G1 closes only when every item is CLOSED or explicitly ACCEPTED-AS-RISK by a named human
   with a date and rationale. **SOURCE** (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:249`): "unknowns
   have owners and dates rather than silent defaults."

**No agent may close any item in this backlog.** Per
`docs/00-governance/decision-rights.md:27-29`, an agent may produce evidence and proposals only;
per `docs/00-governance/evidence-notation.md:48`, "No agent may promote its own VALIDATION
REQUIRED item to DECIDED."

---

## K. Cross-references

- `user-roles-hypotheses.md` — role hypotheses behind category C.
- `workflow-hypotheses.md` — workflow hypotheses behind categories D and E.
- `user-research-plan.md` — the study that closes categories C–F and H.
- `../01-vision-and-intended-use/intended-use-statement.md` — §7 approval conditions.
- `../01-vision-and-intended-use/success-and-harm-metrics.md` — category G.
- `../00-governance/authority-model.md` — the `AUTH-*` roles, all currently UNASSIGNED.
