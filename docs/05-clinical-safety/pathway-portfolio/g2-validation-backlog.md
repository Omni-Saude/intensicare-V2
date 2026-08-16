---
doc_id: PORT-G2-VALIDATION-BACKLOG
title: IntensiCare V2 — Gate G2 Validation Backlog (pathway portfolio)
status: PROPOSAL
label: VALIDATION REQUIRED
owner: UNASSIGNED — VALIDATION REQUIRED
approver_role: AUTH-CLINSAFETY (docs/00-governance/authority-model.md:28)
validation_status: VALIDATION REQUIRED
source: INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §6.2 (287-303), §6.3 (305-328), §6.4 (330-345), Gate G2 (347-349), §7.2 (397-420); docs/05-clinical-safety/hazard-log.md gap G-2 (lines 190-193)
date_collected: 2026-08-14
last_updated: 2026-08-15
collector: clinical pathway portfolio optimizer (candidate inventory / source-eligibility phase)
provenance:
  source_repo: intensicare-V2
  path_or_url: docs/05-clinical-safety/pathway-portfolio/g2-validation-backlog.md
  commit_sha_or_version: uncommitted (working tree at cb35521)
  section_or_lines: whole document
  date_collected: 2026-08-14
  collector: clinical pathway portfolio optimizer
  transformation: >
    Gate G2 prerequisites decomposed into ordered, owned items from the gate
    verdicts in hard-gate-assessment.md, the inventory gaps in
    candidate-inventory.md, and the eligibility findings in
    pathway-to-source-matrix.yaml. Candidate per-pathway hazards are carried
    here for hazard-log gap G-2 integration; hazard-log.md was NOT modified.
  confidence: medium
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  requirements: []
  hazards: []
  adrs: []
  tests: []
  pr: null
supersedes: null
superseded_by: null
---

# Gate G2 Validation Backlog — Clinical Pathway Portfolio

> **Every item is OPEN. Every owner is UNASSIGNED. Gate G2 is NOT satisfied and cannot be
> approached today.**
>
> **SOURCE** (`PROMPT:347-349`), Gate G2 verbatim: "No pathway enters actionable production
> mode until a qualified human committee approves the portfolio method, the individual
> release package, residual hazards, and the staged validation plan. Shadow/non-actioning
> evaluation may precede this approval only with privacy, security, and research/governance
> authorization."
>
> **No agent may close any item in this backlog** (`decision-rights.md:27-29`;
> `evidence-notation.md:48`).

## 0. Conventions

- **IDs.** `G2-VAL-nnnn` are **document-local reference handles**, not catalog IDs. The `VAL` prefix in `traceability-policy.md:37` belongs to a canonical register that does not yet exist, and `g1-validation-backlog.md:40-43` already flags a numbering collision risk for `VAL-nnnn`. **The `G2-` prefix is used deliberately to avoid colliding with that specialist's `VAL-nnnn` series.** The traceability owner must reconcile both series before ratification.
- **Owner roles** are `AUTH-*` from `authority-model.md`. **All are `UNASSIGNED — VALIDATION REQUIRED`.** No item names a person, because no person has been named.
- **`Blocks`** names what cannot proceed until the item closes. **`Blocked by`** names the item's own prerequisites.
- **Citation shorthand** is that of `candidate-inventory.md` §0.2.

## 1. Summary

| Category | Items | Within programme control? | Gate(s) unblocked |
|---|:--:|---|---|
| **A. Authority** | 1 | Yes — a staffing decision | G2 (all), G1, G5, G11 |
| **B. Inventory completeness** | 5 | Yes | G3, G4 (UNKNOWN→determinate) |
| **C. Clinical evidence and population** | 4 | Yes, once A closes | G1, G3 |
| **D. Source eligibility** | 7 | **Mostly NO — AMH-owner critical path** | G4 |
| **E. Data-quality and status contract** | 3 | Yes, once A closes | G6 |
| **F. Workflow and human response** | 3 | Yes, once A closes | G5, G10 |
| **G. Validation and measurement** | 6 | Partly — needs a site | G8, G9, G10 |
| **H. Method execution and release** | 6 | Yes, once A–G close | G2 itself |
| **Total** | **35** | — | — |

**Category A is the critical path for 34 of 35 items.** **INFERENCE:** this backlog is not
primarily an analysis problem. It is a staffing problem with an analysis problem downstream
of it.

**The one item with an irreversible deadline is `G2-VAL-0025`** (pre-deployment alert-burden
baseline). Every other item can be closed late at the cost of delay; that one can be closed
**only before deployment, or never** (`g1-validation-backlog.md` VAL-0035).

---

## 2. The backlog, in dependency order

### A. Authority — closes first, blocks everything else

| ID | Item | Why blocking | Evidence that closes it | Owner role |
|---|---|---|---|---|
| **G2-VAL-0001** | Name a qualified clinical owner (`AUTH-CLINSAFETY`), and confirm the five further roles required to ratify MCDA weights (`AUTH-PRODUCT`, `AUTH-UX`, `AUTH-DATA-PLATFORM`, `AUTH-OPERATIONS`, `AUTH-SECURITY`/`AUTH-PRIVACY-LEGAL`) | **Hard gate 2 fails for all nine candidates on this alone** (`PROMPT:292`). No clinical content may be ratified, no weight set, no hazard accepted, no threshold approved. `LEGACY-TA:125` records that no inherited owner exists either — the legacy sign-off's approver "CRM/institution is not verifiable" | Named people accepting each role, recorded in `authority-model.md` and the decision register | **All `AUTH-*` — UNASSIGNED** |

**This item is not a research task.** It is a decision, and no amount of analysis substitutes
for it.

> **Atualização 2026-08-15/16 — disposição PARCIAL de G2-VAL-0001 por GDEC-0009/AGT-3
> (transcrição de escriba, ciclo 5, sprint SPR-G2-1; pt-BR conforme DEC-G0-10; nada
> decidido por agente):** a perna "confirmar os cinco papéis para ratificar pesos MCDA"
> está **disposta** — a ratificação de pesos passou a ser exercível por agentes sob a
> autorização permanente do titular (GDEC-0009/AGT-3, contra-assinada e ratificada pelo
> 2º revisor clínico — GDEC-0011 itens 1-2), mediante o painel adversarial AGT-4, cuja
> definição operacional 0.1.1-draft foi aprovada pelo próprio painel (VIVE, unanimidade
> — trilha imutável em `docs/15-release-evidence/painel-agt4/trilha/`); pré-requisito
> P1 do método marcado como disposto (`portfolio-method.md`, bloco de status;
> `hard-gate-assessment.md` §7). A perna "**nomear dono clínico qualificado**"
> (hard gate 2, por candidato) **permanece OPEN**: os hard gates §6.2 são inalteráveis
> (condição 1 da AGT-3) e designações de *revisor* (GDEC-0003; GDEC-0010 — Dr. Marcelo
> Villaca Lima, aceite formal e verificação de credencial pendentes) não constituem
> aceite de dono de conteúdo por via. Efeito líquido: G2-VAL-0001 deixa de bloquear a
> *definição/execução do método* e continua bloqueando a *admissão de candidatos* pela
> perna do dono clínico. A vigência da definição do painel aguarda ratificação humana
> (0.1.1 §1.3).

### B. Inventory completeness — makes the candidate set knowable

| ID | Item | Why blocking | Evidence that closes it | Owner role | Blocked by |
|---|---|---|---|---|---|
| **G2-VAL-0002** | Enumerate the **eleven unnamed legacy pathway definitions** (CAND-0006) by a scoped, read-only pass, producing one candidate entry each with repo+commit+path+line provenance and **no content import** | INV-GAP-1. Overlap analysis is **undefined** against an unenumerated set, so `portfolio-method.md` §4.2 cannot run and no portfolio containing any member can satisfy §6.3 | One inventory entry per definition, per `legacy-import-policy.md` §3 | `AUTH-CLINSAFETY` (content) + `AUTH-DATA-PLATFORM` (provenance) | G2-VAL-0001 |
| **G2-VAL-0003** | Enumerate and clinically triage the **959-rule / 27-cluster catalog** (CAND-0007) | INV-GAP-2. The legacy assessment's own disposition is `Investigate` (`LEGACY-TA:847`), and `LEGACY-TA:881`: "A large rule catalog is not a product until its inputs, evidence, workflow, and outcomes are validated" — **enumeration is necessary but not sufficient** | Cluster-level enumeration with provenance, then a triage decision per cluster | `AUTH-CLINSAFETY` | G2-VAL-0001 |
| **G2-VAL-0004** | Reconcile the document-local `CAND-nn` and `PH-nn` handles into canonical `CLR-nnnn` / `HAZ-nnnn` IDs | `traceability-policy.md:21-39` declares the prefix taxonomy exhaustive; `CAND` and `PH` are not in it and were used explicitly as review handles (`candidate-inventory.md` §0.3) | Allocated IDs in the canonical registers | Traceability owner (`AUTH-PRODUCT`) | G2-VAL-0001 |
| **G2-VAL-0005** | **Integrate the twelve candidate hazards `PH-01`..`PH-12` (§3) into `hazard-log.md`**, closing declared gap **G-2** | `hazard-log.md:190-193` reserves per-pathway hazards for this specialist and states "this log will gain one hazard row per admitted pathway at G2". The hazards exist; the integration does not | `HAZ-nnnn` rows with severity/likelihood set by `AUTH-CLINSAFETY`, per that log's conventions | `AUTH-CLINSAFETY` + clinical safety-case engineer | G2-VAL-0001 |
| **G2-VAL-0006** | Author a clinical definition for the **ventilator pathway stub** (CAND-0005), or retire the candidate | `LEGACY-TA:117` — the only documented fact is that it is a stub. Candidate hazard **PH-05**: a pathway present in name but empty of logic reads as surveillance that is not occurring | A clinical definition with inputs and evidence, or a recorded retirement | `AUTH-CLINSAFETY` | G2-VAL-0001 |

### C. Clinical evidence and population

| ID | Item | Why blocking | Evidence that closes it | Owner role | Blocked by |
|---|---|---|---|---|---|
| **G2-VAL-0007** | Produce a **clinical evidence dossier per candidate**: external authority, publisher, instrument version, evidence grade, transportability to a Brazilian adult ICU | Hard gate 3 fails for all nine (INV-GAP-5). `LEGACY-TA:489` records legacy references as "weak or pending refinement". Supplies MCDA criteria **C1** and **C4** | A dossier per candidate, authored by the **clinical evidence methodologist** — expressly **not** this specialist | `AUTH-CLINSAFETY` + clinical evidence methodologist | G2-VAL-0001 |
| **G2-VAL-0008** | **Ratify the input specification** per candidate — concepts, codes, value sets, units, conversion policy, exclusions, contraindications — against each instrument's authoritative published specification | INV-GAP-4: the legacy assessment documents **zero** inputs for any score. Every input row in the source matrix is a **PROPOSAL** awaiting exactly this ratification | A signed input specification per candidate version | `AUTH-CLINSAFETY` | G2-VAL-0001, G2-VAL-0007 |
| **G2-VAL-0009** | Decide the **population boundary and its enforcement behaviour** — paediatric/neonatal in or out, and what V2 does when a patient is out-of-population or their age is unknown | `intended-use-statement.md` IU-06 is a **BLOCKING** decision; `g1-validation-backlog.md` VAL-0006/0007/0008. Candidate hazard **PH-11**. Prose exclusion is not enforcement | A decision plus a testable enforcement behaviour tied to `status-dimensions.md` | `AUTH-CLINSAFETY` + `AUTH-INTENDED-USE` | G2-VAL-0001 |
| **G2-VAL-0010** | Decide the **sub-population exclusions** — obstetric, ECMO/CRRT, post-cardiac-surgical, palliative / treatment-limitation | `intended-use-statement.md:227-242`; VAL-0010. Candidate hazard **PH-12** — for a palliative patient V2 could be *technically correct and clinically wrong* | A decision per sub-population, with hazard analysis for the palliative case | `AUTH-CLINSAFETY` | G2-VAL-0001 |

### D. Source eligibility — **the AMH-owner critical path**

`AMH-CF §5`: "Six of eight conditions require an AMH-owner act or an AMH environment. **The
critical path for V2's AMH compatibility runs primarily through AMH, not through V2
engineering.**"

| ID | Item | Why blocking | Evidence that closes it | Owner role | Blocked by |
|---|---|---|---|---|---|
| **G2-VAL-0011** | **AMH owners resolve contradiction C-1** — state whether a populated vital-sign feed exists or is planned, under what profile, codes, units and freshness | **12 of 25 matrix rows fail on this alone.** The IG's only Observation profile pattern-fixes `category` to `laboratory`; vitals require a **new profile authored, published, versioned and populated** — "not a reuse, not a configuration change, not a mapping" (`AMH-CF §3.2`) | A written AMH-owner position, and a published profile if affirmative | `AUTH-AMH-OWNER` (**UNASSIGNED; no AMH-side contact established**) + `AUTH-DATA-PLATFORM` | External |
| **G2-VAL-0012** | **AMH owners resolve contradiction C-4** — state the Observation ingestion timeline **and** whether the delivered shape will be profile-conformant (LOINC-coded, UCUM `valueQuantity`) | 4 matrix rows. The announced unblocking plan emits `valueString` free text; `AMH-CF §3.1`: "**No ICU scoring rule … can consume a `valueString`.**" **V2 must make conformant shape an acceptance condition, not accept "unblocked" as sufficient** | A written AMH-owner position plus a conformance commitment | `AUTH-AMH-OWNER` + `AUTH-DATA-PLATFORM` | External |
| **G2-VAL-0013** | Inventory contracts for the **input classes with no source at all** (reason codes R4/R12): respiratory-support status, medication administration with agent identity and weight-normalised dose rate, body weight, urine output / fluid balance, consciousness assessment, infection suspicion | **9 rows fail on R4 and 6 on R12.** **INFERENCE (matrix finding F-5): even a complete AMH vitals-and-labs feed would leave these six unsourced.** Any plan resting on "AMH will eventually supply the inputs" is wrong for roughly a quarter of the matrix | A contract inventory per input class, or a recorded finding that none exists | `AUTH-DATA-PLATFORM` | G2-VAL-0001 |
| **G2-VAL-0014** | Obtain a **V2-reachable environment** with credentials, network path and a designated tenant; then **measure** evidence layers 3 and 4 per input — population, coverage, null/invalid distributions, linkage, code/unit conformance, latency percentiles, ordering, correction, replay | Layers 2–4 have **no evidence** (`contracts.lock.draft.yaml:461-479`). `AMH-CF §4.4`: only `dev` is provisioned; Gate G3's production-like condition "cannot currently be satisfied by anyone" and is assigned to `Negócio / orçamento` | Measured distributions per input, recorded in the source matrix | `AUTH-DATA-PLATFORM` + `AUTH-AMH-OWNER` | External + budget |
| **G2-VAL-0015** | Resolve **identity / tenancy adjudication** (ADR-006 / ADR-039 / ADR-041 / FHIR-IG conflict) | 3 context rows (R8). `PROMPT:438-447` forbids V2 silently resolving it. Hazards `HAZ-0001`, `HAZ-0002`, `HAZ-0027` | An AMH-owner decision recorded in the contradiction record | `AUTH-AMH-OWNER` + `AUTH-DATA-PLATFORM` | External |
| **G2-VAL-0016** | **Pin terminology**: LOINC and UCUM release versions, value sets and expansions, and a **unit conversion policy** with explicit quarantine of unknown codes/units | **17 rows fail on R9.** `contracts.lock.draft.yaml:165-167`; `LEGACY-TA:459,586` (unit validator failed on three non-canonical values); `HAZ-0032`. **SOFA-03 and SOFA-06 carry a specific mass-vs-molar conversion risk that a default would silently realize** | A pinned terminology manifest and a ratified conversion policy | `AUTH-DATA-PLATFORM` + `AUTH-CLINSAFETY` | G2-VAL-0001 |
| **G2-VAL-0017** | **Re-verify the entire source matrix at the execution commit** and revise on new evidence | `PROMPT:420` makes the matrix a hard input to the optimizer. "A stale eligibility matrix used to justify a portfolio is exactly the failure `PROMPT:414` warns against" | A re-verified matrix with a new pinned commit and date | `AUTH-DATA-PLATFORM` | G2-VAL-0011..0016 |

### E. Data-quality and evaluation-status contract

| ID | Item | Why blocking | Evidence that closes it | Owner role | Blocked by |
|---|---|---|---|---|---|
| **G2-VAL-0018** | Ratify **per-input freshness windows** and the **invalidate-vs-degrade rule** per component per candidate | **No row in the matrix has a defined freshness window — 25 of 25.** Hard gate 6 fails for all. `g1-validation-backlog.md` VAL-0023; legacy open question `LEGACY-TA:999`. **Largely within programme control — the largest body of eligibility work not blocked on AMH** | A versioned, per-input, per-candidate policy | `AUTH-CLINSAFETY` | G2-VAL-0001, G2-VAL-0008 |
| **G2-VAL-0019** | Define **duplicate, ordering, correction, cancellation and out-of-order semantics** per input, including conflicting simultaneous measurements | **Undefined on 25 of 25 rows.** `PROMPT:1058` forbids silently resolving contradictions; most-recent-wins is silent resolution wearing an algorithm (VAL-0022). Hazards `HAZ-0008`, `HAZ-0009`, `HAZ-0011`. **NEWS2-05 specifically**: invasive and non-invasive blood pressure coexist in ICU with no defined resolution | A specified, testable policy per input | `AUTH-CLINSAFETY` + `AUTH-DATA-PLATFORM` | G2-VAL-0001 |
| **G2-VAL-0020** | Ratify the **AMH data-quality → V2 evaluation-status mapping matrix**, without collapsing the two dimensions | `evaluation-status-semantics.md` §5 carries the matrix as PROPOSAL; `HAZ-0040`. A `quarantined` source must never become a normal V2 value | A ratified mapping matrix | `AUTH-CLINSAFETY` + `AUTH-DATA-PLATFORM` | G2-VAL-0001 |

### F. Workflow and accountable human response

| ID | Item | Why blocking | Evidence that closes it | Owner role | Blocked by |
|---|---|---|---|---|---|
| **G2-VAL-0021** | Establish, **per candidate**, the named accountable human response: who receives, who acts, who escalates, who closes — **including shift handover and downtime** | Hard gate 5 fails for all nine. VAL-0012–VAL-0016; escalation ownership rated "**very low confidence**"; `LEGACY-TA:1000` unanswered. Routing to a role that cannot act creates **delay disguised as delivery** | Observed workflow (M1/M2) plus a decision per candidate | `AUTH-UX` + `AUTH-CLINSAFETY` | G2-VAL-0001 |
| **G2-VAL-0022** | Validate **comprehension** of the non-evaluated state and the pt-BR clinical vocabulary with real clinicians | VAL-0027, VAL-0031. **Rendering a state correctly and a clinician understanding it are different facts, and only the second protects a patient.** Candidate hazards **PH-09**, **PH-01** | M3 simulation with comprehension testing | `AUTH-UX` + `AUTH-CLINSAFETY` | G2-VAL-0001 |
| **G2-VAL-0023** | Ratify the **interruptive-alert budget** per patient-day and per clinician shift, and measure available response/escalation capacity | Constraints K1–K3 in `portfolio-method.md` §4 are unmeasurable without this. Hard gate 10 fails for all | A ratified budget plus a measured capacity figure | `AUTH-CLINSAFETY` + `AUTH-OPERATIONS` + `AUTH-UX` | G2-VAL-0001, G2-VAL-0025 |

### G. Validation and measurement

| ID | Item | Why blocking | Evidence that closes it | Owner role | Blocked by |
|---|---|---|---|---|---|
| **G2-VAL-0024** | **Pre-register** the clinical definition of deterioration and its blinded adjudication rubric | VAL-0036. Without pre-registration, definitions can be fitted post hoc and every accuracy figure becomes unfalsifiable. Supplies MCDA **C1**, **C11** | A pre-registered definition and rubric | `AUTH-CLINSAFETY` | G2-VAL-0001 |
| **G2-VAL-0025** | 🚩 **Measure the pre-V2 baseline** for alert burden, fatigue, interruption and time-to-recognition — **BEFORE ANY DEPLOYMENT** | **THE ONE IRREVERSIBLE ITEM.** `g1-validation-backlog.md` VAL-0035: "**Baselines are unobtainable once V2 is deployed.**" Without it, constraints K1/K2 can never be demonstrated and criterion C12 can never be scored — permanently | A completed baseline observational study, dated before deployment | `AUTH-PRODUCT` + `AUTH-UX` | G2-VAL-0001, G2-VAL-0026 |

> **COMISSIONADO 2026-08-15 pelo titular (GDEC-0007, decisão K-10):** estudo
> observacional de baseline pré-implantação autorizado a iniciar; execução requer
> desenho do estudo (junto à pesquisa G1) e permanece pré-condição irreversível
> antes de qualquer deployment. Status do item: comissionado — não concluído.
> Fonte da decisão: `docs/00-governance/registers/decision-register.md` GDEC-0007;
> `docs/05-clinical-safety/cycle-1-review-decision-sheet.md` K-10. Este item
> continua bloqueado por `G2-VAL-0001` (nomeação de `AUTH-PRODUCT`/`AUTH-UX`) e
> `G2-VAL-0026` (site e ética) — o comissionamento autoriza o início do desenho do
> estudo; não os dispensa.
| **G2-VAL-0026** | Identify a **site and named clinical sponsor**; obtain the ethics (CEP/CONEP) route and the LGPD basis for research, adjudication and subgroup analysis | **OBSERVED: no site has been identified or contacted** (VAL-0039). VAL-0040, VAL-0041, VAL-0037. Without a site there is no data, no baseline, no validation — hard gates 9 and 10 cannot close | A named site, named sponsor, and legal/ethics determinations | `AUTH-PRODUCT` + `AUTH-PRIVACY-LEGAL` | G2-VAL-0001 |
| **G2-VAL-0027** | Author **boundary, exception, negative, delayed-data, missing, stale, conflicting and failure test vectors** per candidate version, and make them **blocking** in CI | Hard gate 8 fails for all. **The specific legacy trap: `LEGACY-TA:584` — a coverage gate that passed while validating "All 0" cases; "False-green gate; validates nothing"** (`HAZ-0031`). Any future gate-8 claim **must state the number of cases actually executed** | Executed vectors with counts, enforced as required checks | `AUTH-CLINSAFETY` + `AUTH-SECURITY` (CI enforcement) | G2-VAL-0001, G2-VAL-0008 |
| **G2-VAL-0028** | Run **retrospective replay and shadow (non-actioning) evaluation** — with privacy, security and research/governance authorization | `PROMPT:349` permits shadow evaluation before G2 **only** with that authorization. Note the dependency trap: shadow evaluation still requires a **populated source**, which does not exist | Authorized shadow-mode results with measured alert volume and precision/recall over **valid patient-time** (SM-03) | `AUTH-CLINSAFETY` + `AUTH-PRIVACY-LEGAL` + `AUTH-SECURITY` | G2-VAL-0014, G2-VAL-0024, G2-VAL-0026 |
| **G2-VAL-0029** | Pre-register the **subgroup / equity analysis plan** and its lawful basis | MCDA criterion **C13**; constraint K4. VAL-0037 — equity monitoring and data minimization pull in opposite directions and the tension must be resolved, not ignored | A pre-registered plan plus a legal determination | `AUTH-PRIVACY-LEGAL` + `AUTH-CLINSAFETY` | G2-VAL-0001, G2-VAL-0026 |

### H. Method execution, release, and the G2 decision itself

| ID | Item | Why blocking | Evidence that closes it | Owner role | Blocked by |
|---|---|---|---|---|---|
| **G2-VAL-0030** | **Ratify the MCDA criterion weights** — six owner roles, independently proposed, simultaneously revealed, divergence surfaced not averaged, frozen and versioned **before any scoring** | `PROMPT:307`. `portfolio-method.md` §2. **Weights chosen after seeing scores are rationalizations of a preferred answer** | A signed, dated, versioned weight vector in the decision register | All six `AUTH-*` roles jointly | G2-VAL-0001 |
| **G2-VAL-0031** | **Execute the MCDA** with lower-confidence-bound estimates, the non-compensatory C5 floor, the overlap penalty, and the add/remove convergence procedure — then report **weight sensitivity** | `portfolio-method.md` §§3, 4.2, 5. **Step 0 terminates immediately while the gate-passing set is empty** | A recorded run: selected set, every marginal computation, every rejected addition with reason, and the sensitivity disclosure | `AUTH-CLINSAFETY` (chair) | G2-VAL-0002..0030 |
| **G2-VAL-0032** | Assemble a **clinical release package** per admitted pathway version — all fourteen elements of `PROMPT:332-345`, including an **independent approver** distinct from the clinical owner | Selection is necessary but not sufficient. `decision-rights.md` §3 forbids self-review. `LEGACY-TA:487`: legacy score versions were "strings in code rather than a signed release registry" (`HAZ-0019`) | An immutable, signed bundle per pathway version | `AUTH-CLINSAFETY` + an independent approver | G2-VAL-0031 |
| **G2-VAL-0033** | **Fund** versioning, rollback, surveillance, kill-switch and retirement responsibilities | Hard gate 11 fails for all nine. The gate's word is **funded** — a resourcing commitment, not a design intention | A recorded funding and staffing decision | `AUTH-PRODUCT` + `AUTH-OPERATIONS` | G2-VAL-0001 |
| **G2-VAL-0034** | Ratify the **per-site recalculation policy** and the anti-drift obligations — one approved logic and content hash across all sites; site variation only in enablement and constraints | `PROMPT:326`: "never silently customize approved clinical logic by site". `portfolio-method.md` §6. Legacy counter-evidence: dual runtimes held divergent state (`HAZ-0020`) | A ratified policy plus runtime observability of active portfolio, weight version and bundle hashes | `AUTH-CLINSAFETY` + `AUTH-OPERATIONS` | G2-VAL-0031 |
| **G2-VAL-0035** | **Gate G2 committee approval** of (a) the portfolio method, (b) each individual release package, (c) residual hazards, (d) the staged validation plan | `PROMPT:347-349`. All four are required; approving one is not approving the gate | A recorded, dated committee decision with named members | Qualified human committee — **does not exist** | G2-VAL-0001..0034 |

---

## 3. Candidate per-pathway hazards — for `hazard-log.md` gap **G-2** integration

`hazard-log.md:190-193` declares gap **G-2**: per-pathway hazards "cannot be stated before a
pathway portfolio exists… **Owned by the clinical pathway portfolio optimizer**; this log will
gain one hazard row per admitted pathway at G2."

**These twelve candidate hazards are the response to that gap.** They are recorded **here**,
in this specialist's own file, per this phase's write scope. **`hazard-log.md` was NOT
modified.** Integration is `G2-VAL-0005`, owned by the clinical safety-case engineer and
`AUTH-CLINSAFETY`.

### 3.1 Integration rules

1. **`PH-nn` are document-local handles, not `HAZ-nnnn` allocations.** The safety-case engineer allocates real IDs on integration (`candidate-inventory.md` §0.3).
2. **No severity or likelihood is assigned here.** `hazard-log.md:36-39` reserves S/L to that log's conventions and to `AUTH-CLINSAFETY`. Assigning them here would duplicate and pre-empt a judgement this specialist is not authorized to make.
3. **PH-10, PH-11 and PH-12 are portfolio-wide** and apply **even if the portfolio remains empty**. PH-10 in particular is a hazard of *admitting anything at all* under today's source conditions — it does not wait for a pathway to be selected.
4. **Full statements** (condition → event → harm) are in `candidate-inventory.md` §5. This table carries the handle, target and integration note.

### 3.2 The twelve

| Handle | Candidate | Hazard, in brief | Links to existing hazards | Integration note |
|---|---|---|---|---|
| **PH-01** | CAND-0001 NEWS2 | A partial aggregate computed from a subset of inputs is presented with the weight of a complete one | HAZ-0005, HAZ-0021 | Ties directly to `G2-VAL-0018` (invalidate-vs-degrade) |
| **PH-02** | CAND-0002 MEWS | Two correlated early-warning scores disagree at the bedside; the clinician adjudicates between two unvalidated instruments | HAZ-0016, HAZ-0036 | Argues for treating the NEWS2/MEWS/qSOFA cluster jointly (`portfolio-method.md` §4.2) |
| **PH-03** | CAND-0003 SOFA | Hours-old laboratory values are combined with minutes-old vital signs under one timestamp; the composite describes a state that never existed | HAZ-0006, HAZ-0011, HAZ-0026 | Mixed-cadence policy is missing entirely; `G2-VAL-0018` |
| **PH-04** | CAND-0004 qSOFA | An infection-gated instrument is applied to an undifferentiated population because no infection signal exists | HAZ-0036 | `PROMPT:418` — this is a *different* pathway, not a configuration |
| **PH-05** | CAND-0005 ventilator | A stub present in registry or UI reads as surveillance that is not occurring | HAZ-0025, HAZ-0021 | `G2-VAL-0006` — define or retire |
| **PH-06** | CAND-0006 unnamed set | Pathways activated from a bundle whose content no clinical approver has read; harm correlated across a whole unit | HAZ-0019 | `G2-VAL-0002` — enumeration is the control |
| **PH-07** | CAND-0007 959-rule catalog | Bulk admission on the strength of catalog size; alert volume exceeds any measurable response capacity | HAZ-0016, HAZ-0022 | `G2-VAL-0003`, `G2-VAL-0023` |
| **PH-08** | CAND-0008 alert rules | An alert rule consumes a score *value* without its evaluation *status*; fires (or withholds) as if `valid` | HAZ-0005, HAZ-0021, HAZ-0022, HAZ-0040 | `G2-VAL-0020`; the *(value, status)* contract is the control |
| **PH-09** | CAND-0009 bed-grid | Absence of evaluation rendered like low risk across a whole unit view; unit-wide false reassurance | HAZ-0005, HAZ-0025 | Belongs to the status-rendering requirement, not to a pathway (`hard-gate-assessment.md` §3) |
| **PH-10** | **All candidates** | A pathway admitted while its inputs have no populated source runs permanently in `not_evaluated`; structural emptiness is mistaken for reassuring quiet | HAZ-0025, HAZ-0039 | **Applies now, to the empty portfolio.** The control is the non-compensatory C5 floor (`portfolio-method.md` §1.1) |
| **PH-11** | **All candidates** | Adult-instrument logic evaluates an out-of-population or unknown-age patient because gating is not enforced from trusted data | HAZ-0036; IU-06 (BLOCKING) | `G2-VAL-0009`; CTX-01 has no trusted age source |
| **PH-12** | **All candidates** | An escalation work item is generated for a patient under palliative or treatment-limitation goals of care — technically correct, clinically wrong | VAL-0010; `intended-use-statement.md:238-242` | `G2-VAL-0010`; erodes trust in every other alert |

### 3.3 What the safety engineer should notice

**INFERENCE:** three of the twelve (PH-10, PH-11, PH-12) are **not** per-pathway at all — they
are hazards of the *portfolio decision itself*. `hazard-log.md` gap G-2 anticipated "one hazard
row per admitted pathway"; these three would have **no** admitted pathway to attach to and
would be lost under a strictly per-pathway integration. **They should be integrated as
portfolio-level hazards now, not deferred until a pathway is admitted.** PH-10 is the sharpest:
it describes a harm that occurs *because* something was admitted prematurely, so deferring it
until after admission defeats its purpose.

---

## 4. How this backlog closes

**PROPOSAL:**

1. **`G2-VAL-0001` closes first, by naming humans.** 34 of 35 items are downstream of it.
2. **`G2-VAL-0026` and `G2-VAL-0025` are sequenced next despite appearing later**, because the baseline has an irreversible deadline and requires a site to exist first.
3. **Category B (inventory) and Category E (freshness/correction semantics) proceed in parallel**, because they are within programme control and blocked only on `G2-VAL-0001`. Together they are the largest body of eligibility work not gated on AMH.
4. **Category D is escalated to AMH owners immediately and tracked as an external dependency**, not as engineering work. `AMH-CF §5`: "Any plan that treats compatibility as a V2 implementation task will mis-schedule it."
5. **Category H cannot begin until A–G close.** In particular, `G2-VAL-0030` (weights) must precede `G2-VAL-0031` (scoring) — not the reverse.
6. **Gate G2 closes only when `G2-VAL-0035` records a dated committee decision on all four required approvals.** Nothing less closes it, and no agent may record it.

**A legitimate outcome of this entire backlog is that the portfolio remains empty**
(`PROMPT:324`). Closing the backlog obliges the programme to reach an evidence-justified
number — it does not oblige that number to be greater than zero.

## 5. Cross-references

- `candidate-inventory.md` — the nine candidates, the §6.1 fields, the inventory gaps, and the full PH-01..PH-12 hazard statements.
- `hard-gate-assessment.md` — the eleven-gate verdicts that generated most of this backlog.
- `pathway-to-source-matrix.yaml` / `.md` — the eligibility evidence behind Category D.
- `portfolio-method.md` — what Category H executes.
- `../hazard-log.md` — declared gap **G-2**, answered by §3 (integration pending, `G2-VAL-0005`).
- `../../02-users-and-workflows/g1-validation-backlog.md` — the G1 items this backlog depends on; **G1 must close before G2**.
- `../../00-governance/authority-model.md` — every owner role named here, all UNASSIGNED.
