---
doc_id: USR-RESEARCH-PLAN
title: IntensiCare V2 — Gate G1 Contextual-Inquiry Research Plan
status: PROPOSAL
label: PROPOSAL
approver: UNASSIGNED — VALIDATION REQUIRED
approver_roles:
  - AUTH-UX (research design and findings acceptance)
  - AUTH-PRIVACY-LEGAL (consent, ethics, data handling — BLOCKING)
  - AUTH-CLINSAFETY (simulation scenario safety, clinical realism)
  - AUTH-PRODUCT (funding and scheduling)
owner: UNASSIGNED — VALIDATION REQUIRED
validation_status: VALIDATION REQUIRED
last_updated: 2026-08-15
extended_by:
  date: 2026-08-15
  by: líder de pesquisa contextual de UTI (ciclo 2)
  what: >
    Acrescentada a §10 (ponteiro para o kit comissionável em g1-kit/). Nenhuma linha das
    §§1–9 foi alterada, removida ou reescrita; o corpus do ciclo 0 permanece íntegro e em
    inglês, conforme DEC-G0-10 (que se aplica a material NOVO). O campo last_updated foi
    movido de 2026-08-14 para 2026-08-15 apenas por causa desse acréscimo.
provenance:
  source_repo: intensicare-V2
  path_or_url: docs/02-users-and-workflows/user-research-plan.md
  commit_sha_or_version: cb355212b96fc5e63ab79474d50538cc86d96a5d (V2 repo HEAD at collection; this file is new and uncommitted)
  section_or_lines: whole document
  date_collected: 2026-08-14
  collector: critical-care intended-use analyst
  transformation: research design proposed from Gate G1 requirements; no site, participant, or ethics body has been contacted
  confidence: medium
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
evidence_inputs:
  - repo: intensicare-V2
    path: INTENSICARE_V2_ORCHESTRATOR_PROMPT.md
    commit: staged but NOT committed at collection time (git status "A"); working-tree copy read
    lines_used: "23-24, 111-127, 209-262, 1039-1063"
  - repo: intensicare (legacy, READ-ONLY, risk-informed input NOT authority)
    path: INTENSICARE_TECHNICAL_ASSESSMENT.md
    commit: 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79
    lines_used: "52-58, 94-152, 318-357, 993-1029"
---

# IntensiCare V2 — Gate G1 Contextual-Inquiry Research Plan

> **STATUS: PROPOSAL — NOT APPROVED, NOT FUNDED, NOT SCHEDULED.**
>
> **OBSERVED (2026-08-14):** no site has been identified. No participant has been recruited. No
> ethics submission has been prepared. No researcher has been assigned. No named human holds any
> approving role. **Nothing in this plan has been actioned.**
>
> This document describes what would satisfy Gate G1
> (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:251-262`). It does not represent work performed.

## 1. Purpose and the standard this plan must meet

**SOURCE** (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:253`): "Do not approve solution architecture
until intended users have been observed or the absence is explicitly accepted as a blocking
risk."

**SOURCE** (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:214`), SPARK "P": "**observed** users,
workflows, responsibilities, interruptions, handoffs, current workarounds, purchasing and
governance stakeholders."

**INFERENCE — the word "observed" is doing the work.** The prompt does not ask for user input,
consultation, or feedback; it asks for observation. This rules out a research design built on
interviews and preference questions, and it is the reason §2 excludes preference-only methods
explicitly.

**Cautionary precedent — SOURCE** (`INTENSICARE_TECHNICAL_ASSESSMENT.md:56`): the legacy system
reached an advanced prototype stage with "**[V] No stakeholder interviews or observed ICU
workflow studies ... performed.** Persona and workflow conclusions derive from repository
documentation." **INFERENCE:** the legacy failure was not that research went wrong; it is that
documents accumulated in place of research, and each new document made the absence harder to
notice. This plan exists to prevent V2 repeating that pattern with better-labelled documents.

---

## 2. Methods

### 2.1 Required methods

| # | Method | What it produces | Which hypotheses it tests |
|---|---|---|---|
| M1 | **Shadowing / contextual inquiry** — observe clinicians during real work, full shifts, across day/night/weekend | Actual task sequences, physical context, device reality, interruption rates, workarounds | WF-01, WF-02, WF-03, WF-07; UR-01–03 |
| M2 | **Interruption and handover observation** — structured observation of *passagem de plantão* and of interruption events | Handover structure and artifacts; ownership transfer; the "no owner" window; resumption behaviour | WF-04, WF-07; G1 "who owns escalation / who closes work" |
| M3 | **Simulated time-critical scenarios** — scripted deterioration scenarios with a prototype, including degraded, stale, conflicting, and *wrong-system* conditions | Behaviour under time pressure; trust calibration; whether explicit non-evaluated states are correctly interpreted | WF-05, WF-06, WF-08; `../01-vision-and-intended-use/success-and-harm-metrics.md` HM-03 |
| M4 | **Artifact and workaround inventory** — catalogue existing lists, whiteboards, spreadsheets, messaging practices | What clinicians already built for themselves | WF-01, WF-04; UR-02 |
| M5 | **Assistive-technology task evaluation** — real AT users completing real safety-loop tasks | Whether the loop is completable with AT | HM-07; UR-08 |
| M6 | **Buyer/governance stakeholder interviews** — separate sessions with purchasing and governance stakeholders | Purchase criteria, distinct from daily-use needs | Gate G1 "what buyers value versus what clinicians use daily" (`:261`) |

**SOURCE** (`INTENSICARE_TECHNICAL_ASSESSMENT.md:357`) supports M3 and M5 jointly: the legacy
assessment called for validation "through representative ICU simulations with physicians, nurses,
coordinators, and assistive-technology users."

### 2.2 Explicitly excluded methods

**PROPOSAL — the following do not satisfy Gate G1 and must not be reported as if they did:**

| Excluded | Why |
|---|---|
| Preference-only interviews ("would you find this useful?") | **INFERENCE:** measures politeness and imagination, not behaviour. Clinicians reliably cannot predict their own behaviour under interruption and time pressure — which is precisely the condition of interest. |
| Surveys as a primary method | Cannot observe workflow. Acceptable only as a supplement (e.g. the validated fatigue instrument in HM-02). |
| Demonstrations followed by feedback | **INFERENCE:** anchors participants on the proposed solution and forecloses discovery of the actual problem. This is the specific method most likely to be substituted for real research under schedule pressure. |
| Advisory-board or KOL consultation | Valuable for clinical content; not observation of work. Must not be recorded as user research. |
| Analysis of legacy documentation | **SOURCE** (`INTENSICARE_TECHNICAL_ASSESSMENT.md:56`) — this is exactly what the legacy system did instead of research. |
| Agent- or model-generated personas or synthetic users | **INFERENCE:** per `docs/00-governance/evidence-notation.md:55-57`, no agent may invent a person. A synthetic participant is a fabricated stakeholder and is prohibited. |

### 2.3 M3 design requirement — scenarios must include system failure

**PROPOSAL:** simulated scenarios must include cases where the system is **wrong, stale,
degraded, or silent**, not only cases where it performs correctly. Specifically:

- a patient deteriorating while their tile shows an explicit non-evaluated state;
- a patient deteriorating while the system is silent (missed deterioration, HM-04);
- a plausible but incorrect work item (false alert, HM-01);
- conflicting values between two sources (WF-06);
- V2 unavailable mid-task (WF-05);
- session expiry mid-task (`INTENSICARE_TECHNICAL_ASSESSMENT.md:347`).

**INFERENCE:** a study containing only success scenarios measures whether the interface is
usable when it is right. The safety-relevant question is what clinicians do when it is wrong,
because that determines whether V2's failures are caught or amplified. This is the only method in
this plan capable of producing evidence about automation bias before deployment.

**VALIDATION REQUIRED** — scenario clinical realism and safety require `AUTH-CLINSAFETY`.
Simulations must be clearly bounded so that no participant believes a simulated patient is real,
and no simulated work item can reach a live clinical system.

---

## 3. Participants

**PROPOSAL — participant roles, per Gate G1 and `user-roles-hypotheses.md`:**

| Role | Rationale | Sampling requirement |
|---|---|---|
| ICU physicians (intensivists) | UR-01 | Must span *diarista* and *plantonista* patterns, and include night/weekend cover |
| ICU nurses (bedside) | UR-02 — highest-frequency user | Must span shifts including night; must span experience levels |
| Nurse coordinators / charge nurses | UR-03 — least-evidenced role | Include even if the role differs from the hypothesis; the difference is the finding |
| Physiotherapists and other bedside professionals | **INFERENCE:** absent from the legacy persona set (`:133-139`), yet routinely present at the ICU bedside in Brazil. Their absence from legacy personas is itself a signal those personas were not observation-derived. | At least exploratory inclusion |
| Administrators / threshold owners | UR-05 | Identify who can change clinical thresholds |
| Assistive-technology users | UR-08, HM-07 | **Must be real AT users**, not simulated by sighted researchers |
| Purchasing / governance stakeholders | Gate G1 `:261` | Interviewed separately from clinicians |

**Sampling requirements (PROPOSAL):**

1. **Night and weekend coverage is mandatory.** **INFERENCE:** staffing, supervision, and
   escalation paths differ most at exactly the times when deterioration response is most
   fragile. A study conducted only on weekday day shifts would observe the best-staffed
   conditions and generalize from them.
2. Participants must not be exclusively volunteers with existing enthusiasm for clinical
   software — that selects for the users least likely to reveal adoption failure modes.
3. Sample size is determined by saturation of workflow variation, not by a fixed target. A
   pre-committed number would encourage stopping at the number rather than at understanding.

**VALIDATION REQUIRED — no participant has been recruited, and no participant may be named,
described, or characterized in any V2 artifact before consent is obtained** (see §5).

---

## 4. Sites

**OBSERVED (2026-08-14): no site has been identified, contacted, or agreed. No site is named in
any evidence reviewed.**

**PROPOSAL — site requirements, not site selections:**

| # | Requirement | Rationale |
|---|---|---|
| S1 | At least one adult ICU in Brazil operating in pt-BR | `INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:23-24` |
| S2 | A site where the intended data sources plausibly exist | **SOURCE** (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:97`): AMH's laboratory Observation source request records that "Tasy `PACIENTE_EXAME` had zero rows." **INFERENCE:** observing a workflow that V2 could never support with real data would produce a well-researched, undeliverable design. |
| S3 | More than one unit, ideally more than one institution | Distinguishes universal ICU practice from local practice; single-site findings cannot support any generalization claim |
| S4 | A named clinical sponsor at the site | Access, safety, and interpretation of local practice |
| S5 | A site willing to permit observation during handover and at night | Without this, M2 cannot be executed |

**Dependency note (INFERENCE):** S2 links this plan to the AMH compatibility work
(`docs/08-interoperability/amh-data/`). If AMH cannot supply ICU vital signs — and
`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:98` records a documented **contradiction** on exactly this
point, warning "do not infer that ICU vitals are available" — then the workflows worth observing
may differ substantially. **PROPOSAL:** these two workstreams must exchange findings before site
selection is finalized. This document does not resolve the contradiction and must not be read as
assuming it away.

---

## 5. Consent, ethics, and data protection — BLOCKING

> **⚠️ NO FIELDWORK MAY BEGIN UNTIL THIS SECTION IS CLOSED BY A NAMED PRIVACY/LEGAL OWNER.**
> **Owner: `AUTH-PRIVACY-LEGAL` — UNASSIGNED — VALIDATION REQUIRED.**

**SOURCE** (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:1046`): stop when "privacy/legal basis,
processor terms, residency, retention, or PHI use is unresolved."

**SOURCE** (`INTENSICARE_TECHNICAL_ASSESSMENT.md:1010`), legacy open question #11: "What data is
PHI, what purposes/lawful bases apply, and what retention, deletion, legal-hold, and localization
obligations exist?" — unresolved.

**SOURCE** (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:124`): "Do not place PHI, credentials, access
tokens, patient identifiers, or raw clinical payloads in prompts, source control, logs, traces,
fixtures, screenshots, tickets, or agent messages."

**Requirements — each VALIDATION REQUIRED, all owners UNASSIGNED:**

| # | Requirement | Owner role |
|---|---|---|
| C1 | Determine whether an ethics submission (CEP / CONEP route) is required, and complete it if so | `AUTH-PRIVACY-LEGAL` + site research contact |
| C2 | Establish the LGPD basis for observing clinicians at work and for any incidental patient data exposure | `AUTH-PRIVACY-LEGAL` |
| C3 | Informed consent from every observed clinician, in pt-BR, with a genuine right to withdraw | `AUTH-UX` + `AUTH-PRIVACY-LEGAL` |
| C4 | Patient/family notification approach for observation conducted at the bedside | Site + `AUTH-PRIVACY-LEGAL` |
| C5 | **No-PHI field protocol**: no photography, no screen capture of live systems, no recording of patient identifiers; notes de-identified at the point of capture | `AUTH-PRIVACY-LEGAL` |
| C6 | Data handling: where notes are stored, residency, retention, deletion | `AUTH-PRIVACY-LEGAL` |
| C7 | Employment-relations position — observation must not be, or appear to be, performance assessment | `AUTH-PRIVACY-LEGAL`; see `../01-vision-and-intended-use/non-intended-uses.md` NIU-06 |
| C8 | Withdrawal procedure, including retrospective withdrawal of already-collected data | `AUTH-PRIVACY-LEGAL` |

**INFERENCE on C3 and C7 together:** consent from an employee observed at work is not
straightforwardly free. If clinicians perceive that declining is visible to management, consent is
nominal. **PROPOSAL:** the consent mechanism must make declining invisible and costless, and
this property should be verified with nursing leadership rather than assumed by the research
team.

**INFERENCE on C5:** the no-PHI protocol constrains method design, not just data storage.
Observation of a clinician reading a patient's data necessarily exposes the researcher to that
data. The protocol must therefore specify what the researcher may *write down*, which is a
methodological limit — one that must be designed before fieldwork, not negotiated during it.

---

## 6. pt-BR clinical language validation

**SOURCE** (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:24`): `target_language_initial: pt-BR`.

**SOURCE** (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:260`): Gate G1 requires validating
"languages."

**SOURCE** (`INTENSICARE_TECHNICAL_ASSESSMENT.md:336`): the legacy root layout declared
`lang="pt-BR"`. **INFERENCE:** a language attribute is a technical declaration, not evidence that
clinical terminology was validated with clinicians.

**SOURCE** (`INTENSICARE_TECHNICAL_ASSESSMENT.md:330`): the legacy design standard used the term
`não avaliado`. **INFERENCE:** this term was documented in a design artifact but the
implementation contradicted it by rendering `normal` instead — so there is no evidence any
clinician ever saw or validated it.

**PROPOSAL — required language validation:**

1. **Every clinical state term must be validated with clinicians**, especially the terms that
   carry safety meaning: how should `valid | partial | not_evaluated | stale | invalid`
   (`../03-domain/status-dimensions.md`) be expressed in pt-BR so that ICU clinicians interpret
   each *as intended*? **INFERENCE:** the test is comprehension, not translation accuracy — a
   correctly translated term that clinicians read as "fine" has failed.
2. **`não avaliado` must be specifically tested.** It is the single most safety-critical term in
   the product: it must read as "you must look at this," not as "nothing to report."
3. **Severity vocabulary must be validated.** **SOURCE**
   (`INTENSICARE_TECHNICAL_ASSESSMENT.md:123`): legacy specifications retained an older
   `CRIT/URG/WARN/INFO` vocabulary while implementation used `critical/urgent/watch/normal` — an
   unresolved inconsistency. V2 must not inherit either without validation.
4. **Local terminology must be captured, not imposed.** Unit names, role names, and escalation
   language vary by institution; M1/M4 must record what is actually said.
5. **Abbreviations and regionalisms** used in handover must be recorded — they are the natural
   vocabulary for any handover-adjacent feature.
6. **Translation must not be machine-only.** Clinical terminology requires bilingual clinical
   review. **INFERENCE:** this is a specific instance of
   `../01-vision-and-intended-use/non-intended-uses.md` NIU-05 — a model-generated artifact is not
   a validated clinical artifact, and clinical terminology is clinical content.

**VALIDATION REQUIRED** — owner `AUTH-UX` with clinical review by `AUTH-CLINSAFETY`. Both
UNASSIGNED.

---

## 7. What must never be represented as normal or complete — research obligation

**SOURCE** (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:262`), Gate G1's final requirement.

**PROPOSAL:** the candidate list in `workflow-hypotheses.md` §1 is a *hypothesis about what
clinicians need distinguished*. This research must (a) confirm or extend the list from
observation, and (b) test — via M3 — whether the intended representation is actually interpreted
as intended.

**INFERENCE — the two-part obligation is the point.** Rendering a state correctly and a clinician
understanding it correctly are different facts. Only the second protects a patient, and only M3
can establish it. A design review, an accessibility audit, and a screenshot can all confirm the
first while the second remains false.

This research must also apply the same standard to itself. **PROPOSAL — the research must never
be represented as:**

- complete, when night/weekend/handover observation has not occurred;
- generalizable, when conducted at a single site;
- validating a design, when it was conducted to discover a problem;
- clinician endorsement, when it was observation;
- satisfying Gate G1, when any of §5's consent items remain open.

---

## 8. Outputs and how findings change the record

**PROPOSAL — required outputs, per `INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:226`
("user research plan and **observed-workflow reports**"):**

1. Observed-workflow reports per method, separating observation from interpretation.
2. A reconciliation pass over `user-roles-hypotheses.md` and `workflow-hypotheses.md` in which
   **every** hypothesis is marked CONFIRMED / REFUTED / MODIFIED / NOT TESTED. **INFERENCE:** the
   NOT TESTED category must be preserved explicitly, or unexamined hypotheses will silently
   inherit the credibility of the tested ones.
3. Revisions to `../01-vision-and-intended-use/intended-use-statement.md` §§1–5 where observation
   contradicts the draft.
4. A service blueprint of current-state workflow (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:227`).
5. Baseline measurements for `../01-vision-and-intended-use/success-and-harm-metrics.md` —
   **INFERENCE:** SM-01, SM-04, HM-02, and HM-05 all require pre-deployment baselines that become
   permanently unobtainable once V2 is live. This is the strongest scheduling argument in the
   plan: it is not merely better to research early, it is the only time some measurements exist.
6. Updates to `g1-validation-backlog.md` closing answered items and adding discovered ones.

**Independence requirement — SOURCE** (`docs/00-governance/decision-rights.md:64`, pair #5): the
UX designer must be independent of the participant-research moderator/acceptance owner.
**PROPOSAL:** the author of these hypotheses must not moderate the study that tests them, and
this must be recorded before fieldwork begins.

**Stop condition — SOURCE** (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:1048`): stop when
"representative user validation contradicts the proposed workflow." **INFERENCE:** contradiction
is a successful research outcome, not a failure. The plan is worth running only if it is genuinely
capable of overturning the documents that motivated it.

---

## 10. Kit comissionável do G1 — acréscimo do ciclo 2 (pt-BR, DEC-G0-10)

> **Nota de escopo:** esta seção é **conteúdo novo**, acrescentado em 2026-08-15. As §§1–9
> acima são o corpus do ciclo 0 e **não foram alteradas**. Onde houver conflito aparente,
> as §§1–9 prevalecem quanto ao **padrão epistêmico** (métodos excluídos, consentimento,
> o que a pesquisa nunca pode ser representada como) e o kit prevalece quanto à
> **mecânica de execução**.

**PROPOSAL:** este plano descreve *o que* precisa ser observado e *por quê*. Ele não era
executável por um terceiro sem redesenho — faltavam instrumentos, amostragem, critérios de
inclusão de unidade e o mapeamento para os itens do backlog. O ciclo 2 acrescentou esse
material em `g1-kit/`:

| Documento | O que entrega |
|---|---|
| `g1-kit/protocolo-pesquisa-g1.md` | Desenho executável: fases, sítios e critérios de inclusão de unidade, papéis, amostragem mínima defensável, duração, controles de viés e o **mapeamento item-a-item dos 43 itens** de `g1-validation-backlog.md` (42 bloqueantes) |
| `g1-kit/guias-de-observacao-e-entrevista.md` | Fichas de campo, roteiros de observação e de entrevista por papel, testes de compreensão de terminologia e as **regras de registro sem PHI** que operacionalizam a §5 C5 acima |
| `g1-kit/protocolo-baselines-pereciveis.md` | Protocolo **autocontido** para `VAL-0035` / `G2-VAL-0025` — a única medição do programa que não pode ser feita depois |
| `g1-kit/plano-de-recrutamento-e-etica.md` | Perfil e canal de recrutamento, consentimento com recusa invisível, guarda de material, compensação e a matriz de independência exigida por `DEC-G0-05` |
| `g1-kit/pedido-de-comissionamento.md` | Texto de decisão para o titular: o que se pede, custo e duração com premissas explícitas, e o que fica bloqueado ou permanentemente perdido |

**Restrição adicionada desde o ciclo 0 — SOURCE**
(`../00-governance/registers/g0-resolucoes-2026-08-15.md:56-61`, `DEC-G0-05`): o conhecimento
clínico do titular vale como insumo de hipótese de especialista, **nunca** como evidência de
observação do Gate G1; o G1 continua exigindo participantes clínicos externos, com dono da
aceitação ≠ moderador ≠ participante único. **INFERENCE:** isso reforça, e não substitui, o
requisito de independência da §8 acima (par #5 de `decision-rights.md` §3).

**OBSERVED (2026-08-15):** nada mudou quanto ao estado de execução declarado no topo deste
documento — nenhum sítio, nenhum participante, nenhuma submissão ética, nenhum moderador.
O kit torna a pesquisa **comissionável**; ele não a executa e não fecha nenhum item.

---

## 9. Cross-references

- `g1-kit/` — o kit comissionável descrito na §10 (protocolo, guias, baselines perecíveis, recrutamento/ética, pedido de comissionamento).
- `user-roles-hypotheses.md`, `workflow-hypotheses.md` — the hypotheses under test.
- `g1-validation-backlog.md` — the consolidated Gate G1 question list.
- `../01-vision-and-intended-use/success-and-harm-metrics.md` — study types per metric.
- `../01-vision-and-intended-use/non-intended-uses.md` — NIU-06 (not performance management), NIU-07 (secondary use).
- `../00-governance/decision-rights.md` — independence pair #5.
