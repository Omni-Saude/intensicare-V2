---
id: ADR-0001
title: Intended platform boundary between IntensiCare V2 and the AMH data platform
status: proposed
status_history:
  - status: not-started
    date: 2026-08-14
    by: candidate-architecture and ADR-program engineer (Wave 2)
    note: ID reserved in adr-index.md
  - status: proposed
    date: 2026-08-14
    by: candidate-architecture and ADR-program engineer (Wave 2)
    note: >
      Options, drivers, hypothesis-to-test and acceptance conditions drafted from
      prompt §7.0/§7.3 and the Wave-1 AMH dossier. NO decision is recorded and none
      may be inferred. This ADR cannot advance past `proposed` until a human owner is
      named (Gate G0).
  - status: proposed
    date: 2026-08-15
    by: arquiteto de decisões de fronteira e modelo canônico
    note: >
      REVISÃO (sem mudança de status): incorpora o estado de 2026-08-15 — a ata de
      adjudicação AQ-1..AQ-6 lida em disco, as ordens de serviço AMH (OS-17/18/19 como
      cláusulas vinculantes do contrato v1) e as dependências que seguem abertas
      (C-1 vitais, só `dev` existe, camada 4 sem evidência). A hipótese §7.0 é
      desenvolvida como proposta encaminhada ao titular em §5.2. Corpo original em EN
      preservado para auditabilidade do diff; conteúdo novo em pt-BR (DEC-G0-10).
date: 2026-08-15
owner: >
  UNASSIGNED — VALIDATION REQUIRED (candidato factual: rodaquino-OMNI, que detém
  AUTH-DATA-PLATFORM e a autoridade do lado AMH por DEC-G0-04; a confirmação como dono
  deste ADR é ato do titular, não deste autor)
approvers:
  - UNASSIGNED — VALIDATION REQUIRED   # role: AUTH-DATA-PLATFORM — detido por rodaquino-OMNI (DEC-G0-04); aceitação pendente
  - UNASSIGNED — VALIDATION REQUIRED   # role: AUTH-AMH-OWNER — detido por rodaquino-OMNI (DEC-G0-04, DEC-G0-08); aceitação pendente
  - UNASSIGNED — VALIDATION REQUIRED   # candidate role: AUTH-CLINSAFETY (safety-loop consequences)
  - UNASSIGNED — VALIDATION REQUIRED   # candidate role: AUTH-PRIVACY-LEGAL (controller/processor consequences)
decision_deadline: UNSET — VALIDATION REQUIRED
deciding_authority_rule: >
  docs/00-governance/decision-rights.md §2, row "AMH contract / boundary acceptance":
  AUTH-DATA-PLATFORM jointly with AUTH-AMH-OWNER. Agents may draft the dossier and the
  boundary options; agents may NOT accept the contract or the boundary.
independence_check: >
  The AMH-data compatibility architect (Wave 1) and this ADR-program engineer (Wave 2)
  are both preparers. Neither may approve. Per decision-rights.md §3 pair 4
  (connector implementer != external conformance accepter), the specialist who later
  implements the AMH adapter may not accept AMH conformance evidence for this boundary.
links:
  drivers:
    domain_invariants: [DOM-0001, DOM-0002, DOM-0004, DOM-0006, DOM-0008, DOM-0009]
    quality_scenarios: [QAS-0001, QAS-0002, QAS-0003, QAS-0004, QAS-0005, QAS-0006, QAS-0007, QAS-0010, QAS-0012, QAS-0013, QAS-0014, QAS-0015, QAS-0018, QAS-0019, QAS-0023, QAS-0027, QAS-0028]
    risks: ["pending risk register IDs — see docs/00-governance/registers/risk-register.md"]
  constrains:
    requirements: ["REQ: pending requirement catalog (docs/04-product-requirements not yet created)"]
    clinical: ["CLR: pending pathway portfolio (Gate G2)"]
    safety: [SAF-0002, SAF-0007, SAF-0008, SAF-0009, SAF-0010, SAF-0011, SAF-0025, SAF-0026, SAF-0028, SAF-0029, SAF-0031, SAF-0032, SAF-0033, SAF-0035, SAF-0036]
  hazards: [HAZ-0003, HAZ-0005, HAZ-0006, HAZ-0007, HAZ-0010, HAZ-0013, HAZ-0025, HAZ-0027, HAZ-0030, HAZ-0032, HAZ-0034, HAZ-0038, HAZ-0039, HAZ-0040]
  tests: ["TST: pending test architecture"]
  validations: ["VAL: pending validation backlog"]
  adrs:
    depends_on: []
    feeds: [ADR-0002, ADR-0003, ADR-0004, ADR-0005, ADR-0006, ADR-0013, ADR-0015, ADR-0019]
  gates: [G3]
  evidence:
    - docs/08-interoperability/amh-data/compatibility-finding.md
    - docs/08-interoperability/amh-data/four-layer-dossier.md
    - docs/08-interoperability/amh-data/contract-inventory.md
    - docs/08-interoperability/amh-data/open-questions-for-amh-owners.md
    - docs/08-interoperability/amh-data/claim-verification-matrix.md
    - docs/08-interoperability/amh-data/identity-adjudication/adjudicacao-decisoes-2026-08-15.md
    - docs/08-interoperability/amh-data/ordens-de-servico-amh-2026-08-15.md
supersedes: null
superseded_by: null
provenance:
  source_repo: intensicare-V2
  path_or_url: docs/06-architecture/adrs/ADR-0001-amh-platform-boundary.md
  commit_sha_or_version: 0c36f03 (repo HEAD at 2026-08-15 revision; this revision is uncommitted)
  section_or_lines: >
    INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §7.0 (lines 355-367), §7.3 (lines 422-436),
    §7.4, §7.5, §7.6, Gate G3 (lines 504-515), §9.1, §10 item 1; ata IDN-ADJ-2026-08-15
    §2, §4, §6; ordens de serviço AMH §6 (OS-17/18/19), §9 (o que segue aberto)
  date_collected: 2026-08-14
  collector: candidate-architecture and ADR-program engineer (Wave 2); revisão 2026-08-15 pelo arquiteto de decisões de fronteira e modelo canônico
  transformation: >
    reasoned-from — options and drivers derived from the prompt and from the Wave-1 AMH
    dossier. This ADR performed NO independent verification of any AMH artifact and made
    no network call to any AMH environment.
  confidence: medium
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
---

# ADR-0001 — Intended platform boundary between IntensiCare V2 and the AMH data platform

> **Status: proposed. This document presents options, drivers, and acceptance conditions.
> It records NO decision, expresses no preference among the options, and may not be cited
> as settling the boundary, the transport, the hosting model, or the source of clinical
> signals.** The starting hypothesis quoted in §2.3 is a *hypothesis to test*, supplied by
> the orchestrator prompt — it is explicitly **not** a provisional decision and must not
> be read as one.

> **Adendo de revisão — 2026-08-15 (pt-BR).** Esta revisão incorpora o estado de
> 2026-08-15 **sem alterar o status `proposed`**: (i) as restrições **DECIDED** de
> AQ-3/AQ-4/AQ-5/AQ-6 passam a vincular *todas* as opções de fronteira — ver §2.4;
> (ii) as ordens de serviço AMH tornam OS-17 (eventos de ciclo de vida), OS-18
> (`resolve(ref, as_of)`) e OS-19 (pacote de contrato v1) cláusulas vinculantes do
> contrato, com efeito direto no Gate G3; (iii) as dependências honestas permanecem
> registradas: a contradição **C-1 (sinais vitais) segue aberta**, **apenas `dev`
> existe** do lado AMH, e a **camada 4 (aptidão operacional) segue sem evidência**;
> (iv) a hipótese §7.0 é desenvolvida como **proposta encaminhada ao titular** em §5.2 —
> rotulada PROPOSAL, jamais decisão. **Política de idioma (DEC-G0-10):** o corpo EN do
> ciclo 0 é preservado intacto para auditabilidade do diff; todo conteúdo novo desta
> revisão está em pt-BR. A tradução retroativa do corpo permanece decisão em aberto do
> titular (registrada no `adr-index.md`).

---

## 1. Context and problem statement

IntensiCare V2 is a greenfield clinical decision-support platform whose minimum safety
loop (SOURCE, prompt §1) runs from trusted clinical input, through identity/provenance/
quality validation and versioned deterministic evaluation, to a durable explainable work
item, an authorized human action, and immutable audit. Every stage of that loop requires
clinical data that V2 does not itself generate.

The AMH data platform (`Omni-Saude/amh-data-platform`) is the candidate source. SOURCE
(prompt §7.3, lines 422–428) requires that this ADR resolve whether V2 is:

1. an AMH consumer with its own safety-critical operational store;
2. an AMH module deployed inside the platform boundary;
3. a hybrid with an AMH near-real-time lane plus analytical reconciliation;
4. another explicitly justified model.

**Question.** Where does the accountability, hosting, and data-ownership boundary between
IntensiCare V2 and the AMH data platform lie — specifically: who owns the safety-critical
operational store, who is accountable for the safety loop's latency and availability, and
through what lane(s) do clinical signals reach V2?

**Why now.** INFERENCE: the boundary is the most upstream architectural node in the
program — `adr-index.md` §4.3 records that eight ADRs depend on it directly and all but
one depend on it transitively. Deferring it costs option value in every dependent ADR;
deciding it without Gate G3 evidence would violate prompt §7.0's explicit instruction to
"ratify or reject this hypothesis through evidence and ADRs."

**Out of scope for this ADR** (each named to prevent scope creep):

- Transport selection (FHIR REST/Subscriptions vs. event stream vs. batch) — prompt §7.5
  requires these be compared on their own merits; deferred to ADR-0013 and the AMH×
  IntensiCare contract package.
- Tenant grain and resource-ownership model — ADR-0003.
- Patient/encounter/MPI identity and the ADR-006/ADR-039/ADR-041 contradiction — ADR-0004.
- Canonical observation/provenance/time model — ADR-0005.
- Operational-vs-analytical precedence, conflict, and reconciliation *mechanics* —
  ADR-0006. (This ADR fixes only whether two lanes exist at all as a boundary property.)
- Deployment platform, region, and residency — ADR-0019.
- Whether any clinical pathway is feasible at all — Gate G2, not an architecture decision.

---

## 2. Evidence and assumptions

### 2.1 Evidence

**Epistemic note, stated once and applying to the whole table.** This ADR did **not**
re-verify any AMH artifact. Every AMH-derived row below is labeled `SOURCE` because it
cites the Wave-1 dossier, which recorded its own `OBSERVED` verifications at a pinned
commit. Per `docs/00-governance/evidence-notation.md` §2, only the agent that performed a
verification may label it `OBSERVED`. Treating a citation as an observation is precisely
the error the dossier itself declines to repeat (`four-layer-dossier.md` §0).

| # | Label | Statement | Source | Confidence |
|---|---|---|---|---|
| E1 | SOURCE | The AMH relationship is classified **"integration candidate; not currently demonstrated compatible for actionable ICU evaluation."** | prompt §7.0 line 357; restated and justified in `compatibility-finding.md` §7 | high |
| E2 | SOURCE | Of the four evidence layers, only **Layer 1 (declared contract)** has substantial evidence. Layers 2 (deployed capability), 3 (populated data) and 4 (operational fitness) have **no evidence** in the Wave-1 cycle; Layer 3 contains zero OBSERVED entries. | `four-layer-dossier.md` §0; `compatibility-finding.md` §4.1 | high |
| E3 | SOURCE | **Laboratory Observation is blocked** — AMH's own documents state the block is caused by an empty source (`PACIENTE_EXAME` returned zero rows; the structured Diagnose/LIS source is not ingested), not by missing code. | `compatibility-finding.md` §3.1 | high |
| E4 | SOURCE | The unblocking plan for Observation would emit `code = {text: "Resultado de exame"}` and `valueString`, which **does not conform** to the profile's LOINC binding and UCUM quantity requirement. An "Observation unblocked" announcement may therefore deliver free text, not numbers. | `compatibility-finding.md` §3.1 (contradiction C-4) | high |
| E5 | SOURCE | The AMH FHIR IG's **only** Observation profile pattern-fixes `category` to `laboratory`, so a conformant instance **cannot** carry vital signs. Vital signs would require a new profile to be authored, published, versioned and populated. AMH diagrams do assert vital signs (contradiction C-1), and that contradiction is preserved unresolved for AMH owners. | `compatibility-finding.md` §3.2 | high |
| E6 | SOURCE | The current FHIR producer is **batch-first from Bronze Iceberg**; CDC/MSK/Flink is parked; ADR-040 explicitly states the path is **not near-real-time**. Actual end-to-end freshness is **entirely unmeasured**. | prompt §2 evidence 3; `compatibility-finding.md` §4.3 | high |
| E7 | SOURCE | **Only `dev` is provisioned.** `stg`, `prod` and `dr` do not exist and have no tfstate; declared NFR targets are not measured production SLAs because there is no production. Gate G3's "production-like environment" condition is therefore **currently unsatisfiable by anyone, at any access level**. | prompt §2 evidence 1; `compatibility-finding.md` §4.4 | high |
| E8 | SOURCE | AMH's tenant grain is **root CNPJ**; ADR-041 chooses tenant-local MPI and rejects cross-PJ longitudinal identity, conflicting with ADR-006 and the FHIR IG. HAPI enforces URL-partition = token-tenant equality and disables cross-partition references. | prompt §2 evidence 7–8; `compatibility-finding.md` §2 item 2 | high |
| E9 | SOURCE | A **three-way authentication divergence** exists (contradiction C-2): the CapabilityStatement advertises OAuth+SMART; the HAPI README describes mTLS with SMART as future work; an implemented OIDC/JWT/SMART-scope authorizer exists in the tree. A consumer cannot choose client behavior against three positions. | `compatibility-finding.md` §4.2 | high |
| E10 | SOURCE | AMH's **published-contract pattern** (pinned producer commit, digests, fixtures including deliberate negatives, compatibility mode, classification, approval record, registry IDs) is mature and is described as "the most valuable thing AMH offers V2 — as a *pattern to imitate*, not an interface to reuse." A V2 contract package must be created; Maezo's interface must not be reused. | `compatibility-finding.md` §2 item 3; prompt §7.5 | high |
| E11 | SOURCE | **Six of the eight conditions** that would have to change for the compatibility finding to change require an AMH-owner act or an AMH environment. "The critical path for V2's AMH compatibility runs primarily through AMH, not through V2 engineering." | `compatibility-finding.md` §5 | high |
| E12 | **SUPERSEDED 2026-08-15** — was: "No AMH-owner contact has been established." **Now OBSERVED:** rodaquino-OMNI holds `AUTH-DATA-PLATFORM` and declares the AMH-side authority as CEO and principal shareholder of both companies (DEC-G0-04), and has granted V2 read + contract-derivation rights over the AMH repository (DEC-G0-08). Writing to the AMH repository remains prohibited. | `docs/00-governance/registers/g0-resolucoes-2026-08-15.md` DEC-G0-04, DEC-G0-08 | high |
| E13 | SOURCE | V2 must exist in a new repository with independent history, namespace, secrets, environments, databases, pipeline and release identity; AMH and legacy are mounted read-only and never modified. | prompt §3 rules 1–2 | high |
| E14 | SOURCE | "Never create two ungoverned clinical sources of truth. Define precedence, conflict, correction, replay, and reconciliation behavior." | prompt §7.3 lines 434–436 | high |
| E15 | SOURCE | Nothing may be written to the AMH repository; creating an AMH×IntensiCare contract requires separate AMH-owner authority and review. That authority is now named (E12), but the prohibition on V2 writing to the AMH repository stands. | prompt §7.5; `compatibility-finding.md` §6; DEC-G0-08 | high |
| E16 | SOURCE | **The identity/tenant/MPI uncertainty that clouded every boundary option has been adjudicated** (2026-08-15): MPI per tenant, governed cross-PJ index gated on a DPO/legal opinion, `identifier:mpiId` authoritative on the wire under a future IG 1.1.0, and a mandatory opaque `portable_subject_ref` at the boundary with V2 keying clinical facts by `(PSR, encounter)`. **This improves this ADR's evidence baseline without deciding it** — the boundary options are now evaluated against a known identity model rather than a six-way contradiction. Note that it also *adds* AMH-side dependencies (IG 1.1.0, PSR gates SP-1…SP-7, identity lifecycle events), reinforcing E11's critical-path finding. | [`ADR-0004`](./ADR-0004-identidade-paciente-encontro-mpi.md) §5.1; `g0-resolucoes-2026-08-15.md` DEC-G0-04 | high — reconciliação item a item executada em 2026-08-15 contra a ata lida em disco (ADR-0004 §5.5) |
| E17 | OBSERVED (esta revisão, pt-BR) | A **ata de adjudicação existe em disco e foi lida integralmente** por este revisor em 2026-08-15 (`doc_id: IDN-ADJ-2026-08-15`). Ela registra as seis decisões do titular com metadados DECIDED, a disposição consolidada dos artefatos AMH (§3), o alvo de pinagem **IG 1.1.0 — decidido, AINDA NÃO PUBLICADO** (§4) e, em §6, **o que as decisões NÃO desbloqueiam**: `Observation` segue não consumível (três pernas abertas), sinais vitais seguem indisponíveis, Gate G3 segue inalcançável. | `identity-adjudication/adjudicacao-decisoes-2026-08-15.md` §2–§6 | alta |
| E18 | SOURCE (pt-BR) | As ordens de serviço AMH derivadas das resoluções tornam **OS-17 (eventos de ciclo de vida de identidade) e OS-18 (`resolve(ref, as_of)`) cláusulas OBRIGATÓRIAS do contrato v1** — *"sem OS-17+OS-18, G3 NÃO PASSA"* — e **OS-19** define o pacote de contrato v1 (campo sujeito = PSR; exclusões explícitas mínimas: sinais vitais e `Observation` laboratorial enquanto não houver evidência aceita). | `ordens-de-servico-amh-2026-08-15.md` §2 (ONDA D), §6 (OS-17/18/19) | alta |
| E19 | SOURCE (pt-BR) | **O que segue aberto após as decisões** (ordens §9): a contradição **C-1 (sinais vitais) permanece aberta** — *"mesmo com todas as 21 ordens executadas, a V2 continua sem sinais vitais da AMH"*; **apenas `dev` está provisionado** (Q6) e nenhuma ordem cria ambiente; a **camada 4 permanece intocada** — nenhuma ordem mede latência, completude, ordenação, disponibilidade, replay ou recuperação. O achado permanece `candidato a integração`. | `ordens-de-servico-amh-2026-08-15.md` §9.1–§9.3, §10 | alta |
| E20 | SOURCE (pt-BR) | **Alvo de pinagem decidido, artefato inexistente:** a V2 pina a **IG 1.1.0**, que **ainda não foi publicada** — *"a V2 não pode pinar o que não existe"*. O commit `0a07a6f1` permanece base de evidência histórica, não alvo de pin. Consequência de calendário registrada pela própria ata. | ata §4 | alta |

### 2.2 Assumptions

Each assumption must be filed in `docs/00-governance/registers/assumptions-register.md`
with an `ASM-xxxx` ID. **This ADR does not mint `ASM` IDs** — the assumptions register is
that prefix's minting catalog (`traceability-policy.md` §2 rule 4) and concurrent minting
would collide. Filing them is a handoff item.

| # | Assumption | Why it is needed | What invalidates it | Owner |
|---|---|---|---|---|
| A1 | The pinned AMH evidence snapshot still describes AMH's intent at the execution commit. | Every option below is evaluated against Layer-1 evidence from one commit. | Any AMH commit that changes the IG, ADR-040's successor, the partitioning contract, or the environment inventory. Prompt §7.0 requires re-testing at the execution commit. | UNASSIGNED — VALIDATION REQUIRED |
| A2 | The approved clinical pathway portfolio (Gate G2) will require at least one input class AMH does not currently populate (vitals or numeric labs). | If true, the boundary must accommodate a non-AMH clinical-signal source; if false, option space narrows sharply. | Gate G2 approving a portfolio whose mandatory inputs are satisfied entirely by encounter/condition/coverage/medication context. | UNASSIGNED — VALIDATION REQUIRED |
| A3 | A seconds-to-low-minutes safety-loop latency requirement will survive Gate G1 validation. | Drives D1 and the two-lane question in option (c). | Validated user/safety needs establishing a tolerance that batch freshness can meet — or a tighter one it cannot. **No numeric target may be assumed before G1.** | UNASSIGNED — VALIDATION REQUIRED |
| A4 | V2 will be operated by an organization capable of owning a safety-critical operational store (on-call, DR, restore rehearsal). | Options (a), (c) and (d) place operational accountability on V2. | Evidence that no V2-side operations capability will be funded — which would make option (b) structurally more attractive and is a legitimate reason to revisit. | UNASSIGNED — VALIDATION REQUIRED |
| A5 | Writing to the AMH repository will remain out of V2's authority. | Constrains option (b) and the contract-package path. | An explicit, recorded grant of AMH-repository authority by AMH owners. | UNASSIGNED — VALIDATION REQUIRED |
| A6 | LGPD controller/processor roles differ materially between "V2 holds clinical data" and "AMH holds it on V2's behalf". | Drives D7; unresolved legal posture affects the boundary's cost and reversibility. | A privacy/legal determination that the roles are equivalent under either boundary. | UNASSIGNED — VALIDATION REQUIRED |

### 2.3 Hypotheses to test

SOURCE (prompt §7.0, lines 361–367) — reproduced as the orchestrator supplied it, with the
prompt's own framing preserved: *"Use the following as a starting hypothesis to test — not
as a predetermined decision."* and *"Ratify or reject this hypothesis through evidence and
ADRs."*

| # | Hypothesis (SOURCE, prompt §7.0) | How it would be tested | Who tests it | Current status |
|---|---|---|---|---|
| H1 | IntensiCare V2 consumes governed AMH identity/context and available clinical data through an anti-corruption layer. | Layer-2/3 evidence that identity+context resources are reachable, authorized, populated and semantically mappable for the approved tenant scope; ACL loss accounting per §7.6. | AMH clinical-signal contract engineer + FHIR/SMART conformance engineer | **UNTESTED** — Layers 2 and 3 unevidenced (E2) |
| H2 | V2 owns its safety-critical operational state, evaluation records, alerts/work items, audit, and deterministic replay. | Not testable against AMH evidence; this is a **decision**, not a measurement. It becomes testable only as a consequence of whichever option is accepted (replay/audit/restore tests). | Deciding authority, then safety-focused test architecture engineer | **UNDECIDED** — this is the substance of this ADR |
| H3 | AMH Gold/Athena/Iceberg outputs are used for reconciliation, backfill, outcomes, quality surveillance and analytics, not the live safety loop. | Measured Layer-4 freshness of the analytical path vs. the G1-validated latency need; reconciliation divergence measurement (QAS-0010). | AMH-data compatibility architect + platform reliability engineer | **UNTESTED** — no freshness measurement exists (E6) |
| H4 | A durable AMH×IntensiCare clinical-signal lane must be designed and published if approved pathways require freshness or observations the current contracts cannot provide. | Conditional on Gate G2's portfolio (A2) and on AMH-owner willingness/capacity (E11, E12). | Clinical pathway portfolio optimizer → AMH contract-publication steward → AMH owners | **UNTESTED and externally gated** |
| H5 | No pathway is action-capable until its complete input contract and observed feed performance pass Gate G3 and the pathway passes Gate G2. | This is a governance rule already binding, not a hypothesis about AMH; it is restated here so no option is read as weakening it. | Gate authorities | **BINDING** regardless of which option is accepted |

**Standing report until Gate G3 (SOURCE, prompt §7.3/§7.5):** the relationship is
`integration candidate` and clinical evaluation remains **non-actioning**. Accepting any
option below does not change that.

### 2.4 Restrições DECIDED de 2026-08-15 que vinculam todas as opções (adendo pt-BR)

As decisões abaixo foram tomadas por **rodaquino-OMNI em 2026-08-15** (autoridade
verificada em DEC-G0-04; teor na ata `IDN-ADJ-2026-08-15` §2). Este ADR **não as
re-litiga**: elas entram aqui como **restrições de contorno** que qualquer opção de
fronteira — A, B, C, D ou Z — precisa satisfazer. Nenhuma delas decide a fronteira.

| # | Restrição (DECIDED, 2026-08-15, rodaquino-OMNI) | Fonte | Efeito sobre as opções deste ADR |
|---|---|---|---|
| R1 | **PSR obrigatório na fronteira** (AQ-4, Opção A plena): o `portable_subject_ref` (`amh:psr:v1:<uuidv4>`) é o identificador de fronteira do contrato v1; nativo na V2 desde o dia um; sintético em dev; **nenhum `mpi_id` cru, CPF ou identificador de fonte atravessa a fronteira**; fatos clínicos chaveados por `(PSR, encontro)`. | ata §2 AQ-4 | Toda opção que mova dados clínicos através da fronteira usa PSR. Nenhuma opção pode propor chave interna paralela (IDP-02 superada — ADR-0004 D-07). |
| R2 | **Eventos de ciclo de vida de identidade + `resolve(ref, as_of)` obrigatórios no contrato v1** (AQ-5, vinculante): entrega at-least-once, ordenação por sujeito; *"Sem eles, replay afetado por identidade NÃO é certificável e o Gate G3 NÃO passa. Não se admite janela-teto como paliativo."* | ata §2 AQ-5; ordens OS-17/OS-18 | Nenhuma opção passa no G3 sem as duas capacidades. A opção B (módulo interno) não as dispensa: co-locação não substitui contrato de replay. |
| R3 | **12 tenants pós-ADR-041, sem bypass cross-tenant** (AQ-6): `cross_tenant_authorized` é deriva documental — *nenhum bypass existirá*; testes negativos da V2 **afirmam a impossibilidade**; enumeração autoritativa pinada a partir da IG 1.1.0. | ata §2 AQ-6 | Fixa o grão AMH que toda opção consome (insumo do ADR-0003) e o modelo de ameaça da fronteira (D2). |
| R4 | **Base legal do laço clínico = tutela da saúde** (LGPD Art. 11, II, "f"); sem portão de consentimento no laço; usos secundários **bloqueados**; ratificação por advogados antes de qualquer dado real (DEC-G0-03). | ata §2 AQ-3 | Restringe D7 em toda opção: nenhuma lane pode condicionar o laço clínico a consentimento, e nenhuma opção habilita usos secundários. |

**Dependências honestas que as restrições NÃO removem (OBSERVED/SOURCE, E17–E20):**
a IG 1.1.0 é alvo decidido **não publicado**; os portões SP-1…SP-7 do PSR seguem com
parecer DPO/jurídico pendente (OS-16, única dependência externa); **C-1 (vitais) segue
aberta**; **só `dev` existe**; **camada 4 sem evidência**. As restrições mudaram o
bloqueio de *indefinição* para *execução* — não o removeram (ordens §1.1, §10).

---

## 3. Decision drivers and measurable quality attributes

Targets are `VALIDATION REQUIRED` — SOURCE (prompt §15.3): SLOs are defined "from
validated user/safety needs", which do not exist before Gate G1. **No numeric target is
invented here.**

| # | Driver | Why it discriminates between the options | Measurable quality attribute | Target |
|---|---|---|---|---|
| D1 | **Safety-loop latency** — source→accepted→evaluation→durable work item→visible→acknowledged | Options differ in how many platform hops and how many batch boundaries the loop crosses. E6 records that the current AMH FHIR path is batch-first and explicitly not near-real-time. | QAS-0001, QAS-0003, QAS-0004, QAS-0005, QAS-0006 | VALIDATION REQUIRED (Gate G1) |
| D2 | **Tenant isolation and ownership invariance** (DOM-0001) | Options place the enforcement point differently: inside V2, inside AMH, or split across both. AMH's grain is root CNPJ with URL-partition binding (E8); V2's approved tenant grain is undecided (ADR-0003). A split enforcement point is a distinct threat surface. | QAS-0014, QAS-0018 | VALIDATION REQUIRED (Gate G6 adversarial evidence) |
| D3 | **Operational ownership and accountability** — who is paged when the safety loop degrades | Option (b) transfers on-call, DR and restore accountability to the AMH organization; (a) and (c) keep it with V2; (d) varies. E7 records that AMH has no non-dev environment today. | QAS-0012, QAS-0015, QAS-0023 | VALIDATION REQUIRED |
| D4 | **AMH maturity at the execution commit** — environments, populated data, contract lifecycle | Directly bounds what any option can rely on. E2/E3/E5/E7 record: three of four evidence layers unevidenced, labs blocked, no vitals profile, only `dev` provisioned. | QAS-0002, QAS-0012, QAS-0013 | VALIDATION REQUIRED (Gate G3 layers 2–4) |
| D5 | **Exit cost and reversibility** (prompt §9.1 principle 11) | Options differ by an order of magnitude in what is stranded on reversal: a versioned adapter, versus a co-deployed application, versus a jointly published contract with an external owner's release cadence. | QAS-0027 | VALIDATION REQUIRED |
| D6 | **One governed clinical source of truth** (E14, DOM-0002, DOM-0008) | Every option must define precedence, conflict, correction, replay and reconciliation. Options that introduce a second lane (c) or a second store (a, b) carry different divergence risk. | QAS-0010, QAS-0019 | VALIDATION REQUIRED |
| D7 | **Privacy/legal accountability posture** (LGPD controller/processor, residency, minimization) | Where PHI durably rests, and under whose control, changes the legal analysis (A6). Prompt §13 forbids stating compliance without a Brazilian legal determination. | QAS-0028 | VALIDATION REQUIRED (`AUTH-PRIVACY-LEGAL`) |
| D8 | **Schedule/critical-path exposure to an external organization** | E11: six of eight unblocking conditions are AMH-side. Options differ in how much V2 delivery is blocked on AMH acts. | *No quality-attribute scenario yet* — this is a delivery risk, to be filed in the risk register | n/a |
| D9 | **Total cost, capacity economics, and managed-service dependence** | Prompt §9.4 requires technology selection to evaluate operator capability, total cost, exit cost and managed-service dependence. No cost model exists yet. | *No scenario yet* — owner: FinOps and vendor-dependence analyst (not yet activated) | VALIDATION REQUIRED |

**Excluded as non-discriminating:** "uses FHIR", "shares identifiers", "both are
healthcare systems". SOURCE (prompt §7.0): *"Do not call the current repositories
'compatible' merely because both contain FHIR, APIs, events, or matching identifiers."*

---

## 4. Alternatives considered

All four prompt-supplied models plus defer. **Presentation order follows prompt §7.3 and
carries no ranking.** Each option's consequences are stated honestly, including where the
option this program might be assumed to favour is weak.

### Option A — AMH consumer with its own safety-critical operational store

**Description.** V2 is an independent system. It consumes AMH identity/context and
whatever clinical data AMH can supply, through a versioned anti-corruption layer (§7.6).
V2 owns its own operational store, evaluation records, alerts/work items, audit and
replay. AMH analytical outputs are used for reconciliation, backfill, outcomes and
surveillance. V2 is deployed, operated, and released on its own platform and cadence.

**Against the drivers.**

- D1: V2 controls every hop after ingress, but **inherits AMH's ingress freshness**. If the
  only AMH lane is batch (E6), the loop's floor is set by a component V2 does not own.
  This option does not by itself solve the freshness contradiction; it isolates the rest of
  the loop from it.
- D2: single enforcement point inside V2 — simplest to reason about and to test
  adversarially — but V2 must independently re-derive tenant context from AMH's grain (E8),
  and any mismatch becomes a V2-side mapping hazard.
- D3: V2 owns operations end to end. Requires A4 to hold.
- D4: least dependent on AMH maturity for the *safety loop*; still fully dependent for
  *clinical inputs*, which E3/E5 say are not populated.
- D5: lowest exit cost of the four — the coupling is a versioned adapter behind a port.
- D6: two stores exist (AMH's and V2's) and precedence must be explicit; the risk is
  divergence, not ungoverned duplication, **provided** correction and reconciliation are
  specified (E14).
- D7: PHI rests durably in V2; V2's organization takes the corresponding legal posture.
- D8: lowest external blocking for V2-internal work; **unchanged** external blocking for
  clinical inputs.

**Positive consequences.** Clear accountability; independent release cadence; safety
kernel isolated from another organization's operational maturity; the anti-corruption
layer is a natural place for loss accounting and quarantine (§7.6); satisfies prompt §3
rule 1's independence requirement without tension.

**Negative consequences.** V2 must fund and staff operations, DR and restore rehearsal
(A4); duplicate storage of clinical facts with an explicit reconciliation obligation
(D6); does **not** solve the missing vitals/labs problem (E3, E5) — a V2-owned store with
nothing clinically actionable to put in it is not progress; identity re-derivation is a
new hazard surface.

**What would have to be true for this to be the right answer.** V2-side operations
capability exists and is funded (A4); AMH can supply at least the context data the
approved portfolio needs; the organization accepts holding PHI durably in V2 (A6).

**Exit cost if later reversed.** Moderate: the adapter and the port survive; the
operational store, its migrations, and its operational history would have to be migrated
into whatever replaces it.

### Option B — Module deployed inside the AMH platform boundary

**Description.** V2 is built and deployed as a module of the AMH platform: shared
infrastructure, shared tenancy and identity enforcement, shared operational ownership and
release process. Clinical data does not cross an organizational boundary.

**Against the drivers.**

- D1: potentially the shortest data path — no cross-platform hop — **but** only if AMH
  itself has a near-real-time lane. E6 records it does not today; co-location does not
  convert batch into streaming.
- D2: isolation is enforced once, by AMH, at root-CNPJ grain (E8). If V2's approved grain
  (ADR-0003) differs from root CNPJ, this option forces V2 to adopt AMH's grain or to
  layer a second enforcement inside it.
- D3: operational accountability moves to the AMH organization. That is an advantage only
  if that organization is willing, staffed and funded for a **safety-critical** workload;
  E7 records no non-dev environment exists today, and README pendência assigns the
  environment gap to "Negócio / orçamento".
- D4: maximum coupling to AMH maturity — every AMH limitation becomes a V2 limitation.
- D5: **highest exit cost.** Deployment, identity, storage, release and on-call are
  entangled with another organization's platform.
- D6: potentially one store — attractive for D6 — at the price of D5 and D3.
- D7: AMH's organization becomes the durable custodian of V2's clinical records; the LGPD
  analysis changes materially (A6) and the safety-evidence custody question (who can
  produce the audit trail in an incident) must be answered.
- D8: maximum external blocking — V2 could not deploy without AMH.

**Positive consequences.** No cross-boundary data movement; one tenancy enforcement point;
potentially one clinical store; AMH's contract and partitioning rigor applies directly;
no duplicate infrastructure cost.

**Negative consequences.** Directly contradicts prompt §3 rule 1's requirement for
independent environments, databases, pipeline and release identity — **this option cannot
be accepted without an explicit, recorded exception to a non-negotiable rule, granted by
the authority that owns that rule**; V2's release cadence, safety kill-switch authority and
incident command would be shared or subordinate; the deterministic safety kernel would sit
inside a platform whose own principles document states several principles are not yet
fully sustained by implementation (prompt §2 evidence 2); highest exit cost; A5 says V2
does not today have authority to write to the AMH repository at all.

**What would have to be true for this to be the right answer.** AMH owners actively want
it and will fund safety-critical operations; the §3 rule 1 exception is granted by a named
authority; V2's tenant grain can be root CNPJ; the organizations' incident and release
authority can be unified without ambiguity.

**Exit cost if later reversed.** High — approaching a rewrite of everything below the
domain core.

### Option C — Hybrid: durable AMH near-real-time operational lane plus analytical reconciliation

**Description.** Two explicit lanes, as prompt §7.3 describes them: a durable near-real-
time operational lane carrying safety-critical clinical signals from AMH to V2, and an
analytical/reconciliation lane (Gold/Athena/Iceberg) for backfill, outcomes, audit and
rule evaluation. V2 owns its operational store and the safety loop; AMH designs, publishes
and operates the near-real-time lane as a governed contract (§7.5).

**Against the drivers.**

- D1: the only option that *directly targets* the freshness contradiction — but it targets
  it by requiring AMH to build something that does not exist. E6: CDC/MSK/Flink is parked.
- D2: two lanes means two paths that must both enforce tenant binding, and a precedence
  rule between them (E14). More surface than (a).
- D3: V2 owns the safety loop; AMH owns the lane's availability — a **split** accountability
  that must be written into the contract package or it will be discovered during an
  incident.
- D4: highest dependency on AMH *investment*, as distinct from AMH *current state*.
- D5: moderate-to-high exit cost — a jointly published contract with an external release
  cadence and a deprecation window.
- D6: forces the precedence/conflict/correction/replay definition that E14 demands; that
  is a benefit, if it is actually specified rather than assumed.
- D7: PHI moves across the boundary continuously; minimization of the lane's payload
  becomes a first-order design obligation (prompt §7.5: "Minimize fields and PHI").
- D8: high external blocking — the lane cannot exist without AMH-owner approval, design
  capacity, and funding.

**Positive consequences.** Directly addresses the legacy assessment's unresolved
batch-freshness-versus-alert-latency contradiction; makes the two-source-of-truth question
explicit rather than emergent; produces a governed contract artifact that is auditable;
uses AMH's demonstrated strength (E10 — its contract-publication pattern) for exactly what
it is good at.

**Negative consequences.** Requires AMH to build and operate new near-real-time
infrastructure it has parked; multiplies the number of AMH-side conditions on V2's critical
path (E11); two lanes carrying the same clinical facts is precisely the situation E14 warns
about, and it is safe only if precedence and reconciliation are specified and tested;
schedule risk is largely outside V2's control.

**What would have to be true for this to be the right answer.** A validated latency need
that batch cannot meet (A3); AMH-owner commitment and funding for the lane; a specified
precedence/correction/replay model (ADR-0006); measurable reconciliation divergence
(QAS-0010).

**Exit cost if later reversed.** Moderate-to-high — the published contract, its consumers,
its fixtures and its deprecation obligations.

### Option D — Another explicitly justified model

SOURCE (prompt §7.3 item 4) permits "another explicitly justified model". Three concrete
variants are visible from Wave-1 evidence. They are enumerated so that "other" is not an
empty box; **none is preferred here**, and any of them would require its own full analysis
before acceptance.

**D-1 — AMH for context, non-AMH sources for clinical signals.** V2 consumes AMH for
identity/encounter/condition/coverage context, and takes vitals and numeric labs from a
different source (device gateway, HL7 v2 interface engine, or direct EHR integration).
*Rationale from evidence:* E3 and E5 say the two input classes most ICU pathways need are
not populated in AMH and, for vitals, are structurally excluded by the only Observation
profile. *Cost:* a second integration program with its own conformance, security and
operational burden (prompt §12.3), and a harder identity-linkage problem across two
sources. *Note:* this variant is the one most directly responsive to the actual evidence
and is also the one with the largest unscoped cost. It requires its own candidate ADR
(see `adr-index.md` §6).

**D-2 — Context-only V2 with no actionable clinical evaluation in the first release.**
V2 initially delivers workflow, coordination, and explanation over AMH context data, with
evaluation in shadow/non-actioning mode only, deferring the signal question. *Rationale:*
consistent with the standing `integration candidate` report and with Gate G2's provision
that the portfolio's initial size "may legitimately be zero". *Cost:* a product whose
clinical value proposition is unproven; risk of building the wrong workflow around inputs
that later change shape.

**D-3 — Staged boundary: start as (a), with a contracted option on (c).** V2 builds as an
independent consumer while an AMH×IntensiCare contract package is negotiated for a future
near-real-time lane, with the lane's absence explicitly designed for (degraded mode,
DOM-0007). *Rationale:* preserves reversibility (D5) while the externally gated conditions
(E11) resolve. *Cost:* carries the cost of designing for a lane that may never be funded;
risks becoming (a) permanently while being described as (c) — a description-versus-reality
drift this program flags as its own hazard.

### Option Z — Defer / do nothing

**Description.** Record no boundary decision. Continue Wave-2/3 design under a hard
constraint that no dependent ADR may assume any specific boundary; keep the AMH adapter
behind a port (§7.6) so that (a), (c) and (d-1) all remain reachable; revisit at Gate G3.

**Positive consequences.** No decision is made without Layer-2/3/4 evidence, which is
exactly what prompt §7.0 and Gate G3 require; preserves maximum option value on the
program's most upstream node; costs nothing that is not already blocked.

**Negative consequences.** Every dependent ADR must carry conditional branches, which is
real design overhead and a documentation-drift risk; ambiguity about who owns the
operational store can silently propagate into implementation choices; deferral is only
free while the dependent work is genuinely boundary-agnostic, and it stops being free the
moment the first vertical slice (Gate G7) needs a store.

**Cost of delay.** INFERENCE: rises sharply at Gate G7. Before then, deferral costs
conditional design; after a store exists, deferral becomes a migration.

### 4.1 Comparison against drivers

Qualitative only. Cells state the *direction* of the effect and its evidence basis. **No
scoring, no weights** — prompt §6.3's analogue requires owners to ratify weights before
scoring, and no owner exists (E12).

| Driver | A — consumer | B — in-platform module | C — hybrid two-lane | D-1 — non-AMH signals | Z — defer |
|---|---|---|---|---|---|
| D1 latency | V2 controls post-ingress; ingress floor set by AMH batch (E6) | Shortest path only if AMH builds NRT; co-location ≠ streaming | Directly targets it; depends on AMH building the lane | Bypasses AMH for the time-critical class | Unresolved |
| D2 isolation | One enforcement point in V2; grain mapping hazard | One point, AMH's grain (E8); forces grain alignment | Two paths, both must bind tenant | Two source domains to bind | Unresolved |
| D3 ops ownership | V2 owns; needs A4 | AMH owns; no non-dev env today (E7) | Split — must be contracted explicitly | V2 owns, plus a second connector | Unresolved |
| D4 AMH maturity dependence | Moderate | Maximum | High (depends on AMH *investment*) | Lowest for signals; moderate for context | n/a |
| D5 exit cost | Lowest | Highest | Moderate-high (published contract) | Moderate, doubled integration surface | Zero now, rising after G7 |
| D6 single SoT | Two stores; precedence required | Potentially one store | Two lanes; precedence mandatory (E14) | Two source domains; provenance critical | Unresolved |
| D7 privacy posture | PHI durable in V2 | PHI durable in AMH | PHI continuously crossing; minimize payload | PHI from an additional source | Unresolved |
| D8 external blocking | Low for V2-internal; high for inputs | Maximum | High | Lower on AMH; new dependencies elsewhere | n/a |
| D9 cost | V2 pays for its own platform | Shared infra; shared cost model | Both, plus lane build | Highest — two integration programs | n/a |

**Note on option (b).** It is listed and analysed in full because prompt §7.3 requires it
to be considered. Its analysis records that it conflicts with prompt §3 rule 1. Recording
the conflict is not the same as rejecting the option — only the deciding authority may
reject it, and it could be accepted with an explicit, recorded exception. Silently omitting
it would be the error.

---

## 5. Decision and scope

> **NO DECISION IS RECORDED.**
>
> This ADR presents options, drivers, evidence, and acceptance conditions only. No option
> is chosen, preferred, or provisionally adopted. The §7.0 starting hypothesis in §2.3 is a
> hypothesis to test, not a decision, and its presence here must not be read as a
> soft acceptance of option (a) or (c).
>
> Filling this section is reserved to the deciding authority named in the front matter:
> `AUTH-DATA-PLATFORM` jointly with `AUTH-AMH-OWNER`, per
> `docs/00-governance/decision-rights.md` §2. Both roles are currently
> `UNASSIGNED — VALIDATION REQUIRED`.

### 5.1 Conditions that must be satisfied before this ADR can be accepted

**This ADR cannot be accepted until: (i) an AMH-owner boundary approval exists, and
(ii) Gate G3's evidence layers are satisfied for the boundary's scope.** Expanded:

| # | Condition | Owner | Evidence that would close it | Status |
|---|---|---|---|---|
| C1 | A named, reachable AMH owner exists and has approved the responsibility boundary in writing. | `AUTH-AMH-OWNER` | Recorded approval naming the boundary, the responsibilities on each side, and the escalation route. | **PARTIALLY CLOSED 2026-08-15** — the owner is named and reachable (E12); the **boundary approval itself is still outstanding**, and it is this ADR's own acceptance |
| C2 | A named V2 data-platform decision owner exists. | Gate G0 | `authority-model.md` row populated with a human. | **CLOSED 2026-08-15** — rodaquino-OMNI, DEC-G0-04 (note: same human as C1; authority concentration recorded in ADR-0004 §11.2) |
| C3 | Gate G3 **Layer 2** (deployed capability): a V2-reachable AMH environment, credentials, network path and designated tenant scope. | AMH owners + provisioning + budget | Discovery against a named environment; authorized reachable interface. | **OPEN** — no environment access; only `dev` provisioned (E7) |
| C4 | Gate G3 **Layer 3** (populated data): representative coverage, non-empty resources, measured null/invalid distributions for every input the approved portfolio requires. | AMH-data compatibility architect (measurement) | Pathway-to-source eligibility matrix filled with measurements, not schema presence. | **OPEN** — zero OBSERVED Layer-3 entries (E2) |
| C5 | Gate G3 **Layer 4** (operational fitness): measured end-to-end latency, completeness, ordering, correction, availability, replay and recovery. | Platform reliability + AMH owners | Measured percentiles against a G1-validated need. | **OPEN** — nothing measured (E2, E6) |
| C6 | Contradictions C-1 (vital signs), C-2 (authentication), C-3 (manifest status), C-4 (Observation shape) resolved by AMH owners. | `AUTH-AMH-OWNER` | Written resolution per contradiction. | **PARCIALMENTE ABERTA (2026-08-15)** — as resoluções AQ-1..AQ-6 e as ordens de serviço dão direção decidida a C-2/C-3/C-4, cujo **fechamento depende de execução AMH e verificação** (OS-01..OS-09, OS-20); **C-1 permanece integralmente aberta — nenhuma decisão a resolve** (E19; ordens §9.1) |
| C7 | A production-like environment exists in which conformance tests can pass (Gate G3 explicitly requires this). | AMH budget decision | The environment exists and is reachable. | **OPEN — currently unsatisfiable by anyone** (E7; reconfirmado 2026-08-15: nenhuma ordem de serviço cria ambiente — ordens §9.2) |
| C8 | The approved clinical pathway portfolio (Gate G2) is known, so the boundary can be evaluated against the inputs actually required. | `AUTH-CLINSAFETY` + `AUTH-PRODUCT` | Gate G2 record. | **OPEN** |
| C9 | Validated user/safety latency needs exist (Gate G1), so D1 has a target rather than a guess. | `AUTH-INTENDED-USE` + `AUTH-CLINSAFETY` | Gate G1 record; quality-attribute targets replaced from `VALIDATION REQUIRED`. | **OPEN** |
| C10 | If option (b) is under consideration: an explicit recorded exception to prompt §3 rule 1 (independent repository, environments, databases, pipeline, release identity), granted by the authority that owns that rule. | Orchestrator authority | The recorded exception, or the option's removal. | **OPEN — conditional** |
| C11 | Privacy/legal determination of the controller/processor posture under the candidate boundary (A6). | `AUTH-PRIVACY-LEGAL` | Recorded legal determination; prompt §13 forbids asserting compliance without one. | **OPEN** (reforçada por AQ-3: a base legal decidida exige ratificação por advogados antes de dado real — OS-16) |
| C12 | An AMH×IntensiCare contract package is authored, owned, approved and published by AMH, and pinned by V2 — for whichever option requires a contract. | `AUTH-AMH-OWNER` + AMH contract-publication steward | Published manifest with digests, fixtures, approvals; V2-side lock file. | **OPEN — com cláusulas decididas (2026-08-15)**: campo sujeito = PSR (R1), eventos + `resolve(ref, as_of)` obrigatórios (R2), modelo de finalidade AQ-3 (R4), exclusões mínimas vitais/`Observation` (OS-19). O pacote em si **não existe**; a IG 1.1.0 a pinar **não foi publicada** (E20) |

**Six of these twelve conditions are AMH-side** (C1, C3, C6, C7, C12, and partly C4),
consistent with `compatibility-finding.md` §5's finding that the critical path runs
primarily through AMH.

### 5.2 Hipótese §7.0 desenvolvida como proposta encaminhada ao titular (adendo pt-BR, 2026-08-15)

**PROPOSAL — não é decisão, não é preferência do programa, e a seção §5 acima permanece
integralmente válida: NENHUMA DECISÃO ESTÁ REGISTRADA.** O prompt §7.0 fornece uma
hipótese de partida e manda *"ratificá-la ou rejeitá-la através de evidência e ADRs"*.
Com as restrições DECIDED de §2.4 e a evidência E16–E20, este revisor **desenvolve a
hipótese na forma de uma proposta** para que o titular tenha um objeto concreto a
ratificar, emendar ou rejeitar — cláusula a cláusula:

| # | Cláusula proposta (PROPOSAL) | Mapeamento nas opções §4 | Base |
|---|---|---|---|
| P1 | A V2 consome identidade/contexto governados da AMH **exclusivamente** através de camada anticorrupção versionada, com o PSR como identificador de fronteira (R1) e validação sobre `identifier:mpiId` pinado na IG 1.1.0. | Núcleo da Opção A; compatível com D-3 | §7.0 hipótese 1; AQ-2/AQ-4; §7.6 |
| P2 | A V2 é **dona do estado operacional crítico de segurança**: armazenamento operacional, registros de avaliação, alertas/itens de trabalho, auditoria e replay determinístico. | Opção A / D-3; exclui a Opção B sem exceção registrada à regra §3-1 | §7.0 hipótese 2; DOM-0003, DOM-0006 |
| P3 | Saídas Gold/analíticas da AMH servem **reconciliação, backfill, desfechos, vigilância de qualidade e analytics — nunca o laço vivo de segurança**. Precedência, conflito, correção e replay entre lanes são matéria do ADR-0006. | Metade analítica da Opção C, sem exigir hoje a lane NRT | §7.0 hipótese 3; E6; E14 |
| P4 | Uma **lane clínica durável AMH×IntensiCare** é desenhada e publicada **se e somente se** o portfólio aprovado (G2) exigir frescor ou observações que os contratos atuais não fornecem — na forma da Opção D-3 (começar como A, com opção contratada sobre C), preservando reversibilidade (D5) enquanto as condições externas (E11) resolvem. | D-3 explícita | §7.0 hipótese 4; A2/A3 |
| P5 | Nenhuma via clínica torna-se acionável antes de G2 + G3 (H5) — restrição já vinculante, restatada para que a proposta não seja lida como atalho. | Todas | §7.0 hipótese 5 |

**O que esta proposta NÃO faz:** não escolhe transporte (ADR-0013/§7.5), não fixa grão
interno de tenant (ADR-0003), não declara compatibilidade (G3), não dispensa nenhuma das
doze condições de §5.1 — em particular C7 (ambiente production-like inexistente) e C6
(C-1 aberta). **Risco honesto da proposta, registrado:** a variante D-3 carrega o risco,
já nomeado em §4, de tornar-se A permanentemente enquanto descrita como C — o gatilho T5
(necessidade de latência validada no G1) é o teste objetivo que decide se a lane NRT é
necessária. **Quem decide:** exclusivamente o titular (`AUTH-DATA-PLATFORM` +
`AUTH-AMH-OWNER`, ambos detidos por rodaquino-OMNI via DEC-G0-04), e a aceitação plena
continua condicionada às condições de §5.1.

---

## 6. Consequences

Because no option is chosen, these are the consequences **of this ADR's existence in
`proposed` state**, not of any decision.

### 6.1 Positive

- The boundary question is now explicit, enumerated, and traceable, with the evidence that
  bounds each option attached.
- Every dependent ADR (`adr-index.md` §4.1) can now state its own boundary-conditionality
  rather than silently assuming one.
- The twelve acceptance conditions make visible that the boundary is **externally gated**
  — useful for planning, and a defence against a schedule built on the assumption that
  AMH compatibility is a V2 engineering task (E11).

### 6.2 Negative

- Dependent design work must carry conditional branches until this resolves, which costs
  effort and risks drift between the branches and reality.
- An unresolved boundary is a standing ambiguity that implementation pressure will try to
  resolve by default — the first team that needs a database will create one, and that
  choice will look like an answer to this ADR without having been decided. **This risk
  should be filed in the risk register.**

### 6.3 Neutral / structural

- The standing report remains `integration candidate`; clinical evaluation remains
  non-actioning regardless of which option is later accepted (H5).
- Nothing in this ADR authorizes any write to the AMH repository (E15).

---

## 7. Cross-cutting implications

| Dimension | Implication | Label | Owner role | Follow-up ID |
|---|---|---|---|---|
| Clinical safety | The boundary sets the floor on safety-loop latency and determines who owns the kill switch and the degraded-mode procedure. Under every option, DOM-0004 binds: absent AMH vitals/labs must surface as `not_evaluated`/`missing`, never as normal or zero. **HAZ-0030 is the hazard this ADR most directly bears on** — an approved pathway whose only lane is batch cannot recognise deterioration in its actionable window, and SAF-0031 forbids an actionable pathway on a lane that cannot meet its declared budget. HAZ-0039 (empty/null source read as absence of abnormality) is realized by AMH's own measured Gold sweep. | INFERENCE from E3, E5, E6, DOM-0004 | `AUTH-CLINSAFETY` | HAZ-0030, HAZ-0039, HAZ-0038, HAZ-0010, HAZ-0005, HAZ-0006; SAF-0031, SAF-0033, SAF-0035 |
| Security | Options differ in where tenant-isolation enforcement lives and how many trust boundaries clinical data crosses. AMH's URL-partition/token-tenant equality (E8) must be honored by any consuming option; caller-supplied partition headers are rejected. Authentication cannot be designed against the three-way divergence C-2 (E9). | INFERENCE from E8, E9 | `AUTH-SECURITY` | ADR-0015, ADR-0016 |
| Privacy (LGPD) | Where PHI durably rests and who controls it differs materially per option (A6). Prompt §7.5 requires the boundary payload to minimize fields and PHI; option (c) makes payload minimization a continuous obligation. No compliance may be asserted without a Brazilian legal determination (prompt §13). | VALIDATION REQUIRED | `AUTH-PRIVACY-LEGAL` | ADR-0017, ADR-0018 |
| Interoperability | The boundary determines which contracts V2 must consume and whether an AMH×IntensiCare package must be published (E10, E15). Maezo's interface must not be reused; its *pattern* should be imitated. | SOURCE from prompt §7.5 | `AUTH-DATA-PLATFORM` | ADR-0013 |
| Accessibility | No direct implication. Indirect: the boundary sets data freshness, and freshness/staleness must be *visibly* represented in the UI (prompt §11) including to assistive technology — a stale-data indicator that only conveys state by color would fail WCAG 2.2 AA. | INFERENCE | `AUTH-UX` | ADR-0021 |
| Operational | Determines on-call ownership, DR responsibility, restore rehearsal, incident command and the environment inventory V2 must build. E7 records AMH has no non-dev environment today. | INFERENCE from E7 | `AUTH-OPERATIONS` | ADR-0019, ADR-0020 |
| Cost | Options differ in duplicate infrastructure, integration count, and managed-service dependence. **No cost model exists** and none is invented here; the FinOps and vendor-dependence analyst is not yet activated. | VALIDATION REQUIRED | `AUTH-PRODUCT` | pending |
| Migration | Reversing the boundary after a store exists is a data migration with clinical-record custody and audit-continuity obligations, not a redeploy. This is the main reason the cost of deferral rises at Gate G7. | INFERENCE | `AUTH-OPERATIONS` | ADR-0023 |

---

## 8. Reversibility, revisit triggers, kill/rollback

### 8.1 Reversibility assessment

| Option | Reversibility | What is stranded on reversal | Label |
|---|---|---|---|
| A — consumer | **High** — coupling is a versioned adapter behind a port (§7.6) | The operational store's migrations and operational history | INFERENCE |
| B — in-platform module | **Low** — deployment, identity, storage, release and on-call are entangled with an external platform | Approximately everything below the domain core | INFERENCE |
| C — hybrid two-lane | **Moderate** — a published contract carries an external deprecation window and external consumers | The lane, its fixtures, its contract obligations | INFERENCE |
| D-1 — non-AMH signals | **Moderate** — two integration programs, each independently reversible | Whichever connector is dropped | INFERENCE |
| Z — defer | **n/a** — nothing to reverse; option value preserved, at a rising carrying cost | n/a | INFERENCE |

SOURCE (prompt §9.1 principle 11): "Prefer reversible decisions and record
extraction/revisit triggers." Recording this ordering is **not** a recommendation of
option (a); reversibility is one driver among nine, and D1/D6 may legitimately outweigh it.

### 8.2 Revisit triggers

| # | Trigger | Detection | Notify | Action |
|---|---|---|---|---|
| T1 | The AMH execution commit differs from the pinned evidence snapshot in the IG, ADR-040's successor, the partitioning contract, or the environment inventory. | Contract-drift detection (§7.6); QAS-0013 | `AUTH-DATA-PLATFORM` | Re-verify E1–E11; re-open this ADR |
| T2 | AMH announces Observation unblocking. | AMH change-notification route | `AUTH-DATA-PLATFORM`, `AUTH-CLINSAFETY` | **Verify the delivered shape before treating it as an input** — C-4 (E4) says the planned shape may be free text, which no scoring rule can consume |
| T3 | AMH publishes a vital-sign profile or a populated vital-sign feed. | Contract-drift detection | `AUTH-DATA-PLATFORM`, `AUTH-CLINSAFETY` | Re-open; A2 may be invalidated |
| T4 | A non-dev AMH environment is provisioned. | AMH change notification | `AUTH-OPERATIONS` | C3, C5, C7 become reachable |
| T5 | Gate G1 establishes a validated latency need. | Gate G1 record | `AUTH-CLINSAFETY` | D1 gains a target; option (c)'s necessity becomes testable (A3) |
| T6 | Gate G2 approves a portfolio whose mandatory inputs AMH cannot supply. | Gate G2 record | `AUTH-PRODUCT` | Option D-1 moves from enumerated to required-to-analyse |
| T7 | Measured reconciliation divergence between operational and analytical lanes exceeds the (not yet set) tolerance. | QAS-0010 | `AUTH-DATA-PLATFORM` | Re-open ADR-0006 and this ADR |
| T8 | An AMH owner is named and reachable. | Governance register | Orchestrator | **DISPARADO 2026-08-15** — DEC-G0-04 (E12); C1 tornou-se acionável; a revisão desta data responde a este gatilho |
| T9 | *(novo, 2026-08-15)* Publicação da IG 1.1.0 com digest citável (OS-05). | Detecção de deriva de contrato (QAS-0013); rota de notificação AMH | `AUTH-DATA-PLATFORM` | Pinar o pacote; reavaliar C12; verificar enumeração de 12 tenants (R3) |
| T10 | *(novo, 2026-08-15)* Contra-assinatura da ata pelo titular ou alocação de IDs `GDEC-nnnn` para AQ-1..AQ-6 (pendência 1 da ata §8). | Registro de governança (`decision-register.md`) | Orquestrador + steward de governança | Eleva a cadeia de custódia das restrições de §2.4 de "ata de escriba" para registro ratificado — pré-condição de forma do G3 (ordens §0.2) |

### 8.3 Kill switch / rollback strategy

While `proposed`, there is nothing to kill. The relevant control is the **standing
constraint** that applies until this ADR is accepted:

1. The AMH adapter stays behind a versioned port with no AMH type reaching the clinical
   domain core (§7.6). This preserves options (a), (c) and (d-1) at low cost.
2. No dependent ADR may be accepted with a hard assumption about the boundary; each must
   state its boundary-conditionality explicitly.
3. Clinical evaluation remains non-actioning (H5) — so no clinical harm pathway depends on
   this ADR's state today.

On acceptance, the accepted option must define its own kill switch: what is disabled, by
whom, within what time, what the clinical fallback is, and how reconciliation occurs after
recovery (prompt §15.3). For option (c) specifically, "the near-real-time lane is down"
must be a *designed*, clinician-visible degraded mode (DOM-0007), not an incident
discovery.

---

## 9. Validation method and linked evidence

| # | Claim | Validation method | Environment required | Linked IDs |
|---|---|---|---|---|
| V1 | The AMH evidence in §2.1 still holds at the execution commit. | Re-run the Wave-1 claim-verification matrix against the execution commit; diff. | None (read-only repository access) | `claim-verification-matrix.md`; TST: pending test architecture |
| V2 | AMH interfaces the chosen option depends on are reachable and authorized. | Discovery + negative-auth tests in a named environment. | **A V2-reachable AMH environment — does not exist for non-dev today (E7)** | TST: pending test architecture |
| V3 | Required inputs are populated with usable distributions. | Pathway-to-source eligibility matrix filled with measurements (§7.2). | Layer-3 data access | REQ: pending requirement catalog |
| V4 | End-to-end freshness meets the validated need. | Synthetic end-to-end probes measuring source→evaluation→visible→acknowledged (§14). | Production-like environment (C7) | QAS-0001, QAS-0003, QAS-0004, QAS-0005, QAS-0006 |
| V5 | Tenant isolation holds across the boundary. | Adversarial cross-tenant tests: forged/missing/mismatched tenant claims, cross-partition references, caller-supplied headers. | Named environment | QAS-0014, QAS-0018; DOM-0001; HAZ-0003, HAZ-0013; SAF-0007, SAF-0008 |
| V6 | No silent semantic loss or coercion occurs in the anti-corruption layer. | Reconciliation reports + field-level mapping loss accounting (§7.6). | Layer-3 data | QAS-0019; DOM-0002, DOM-0008; HAZ-0032, HAZ-0040; SAF-0028, SAF-0032 |
| V7 | Missing AMH inputs surface as explicit non-normal states, never as zero/normal. | Reference-vector "no-fire reason" tests withholding each required input in turn. | Test environment (synthetic data) | DOM-0004; HAZ-0005, HAZ-0006, HAZ-0039; SAF-0001, SAF-0002, SAF-0033; TST: pending test architecture |
| V8 | The chosen boundary's degraded mode is clinician-visible and actionable. | Human-factors validation under simulated lane outage. | Usability environment | VAL: pending validation backlog; DOM-0007; HAZ-0025; SAF-0024, SAF-0025 |
| V9 | An approved pathway is never made actionable on a lane that cannot meet its declared latency budget. | Declared budget per pathway + measured lane performance; the pathway stays non-actioning until both exist. | Production-like environment (C7) | HAZ-0030; SAF-0031, SAF-0035; QAS-0001, QAS-0003 |

**Placeholder discipline.** `docs/05-clinical-safety/hazard-log.md` and
`safety-requirements.md` were written by the Wave-1 clinical safety-case engineer during
this cycle and **are now cited by real ID above**. No requirement or test catalog exists
yet, so `REQ:` and `TST:` references remain verbatim placeholders. **No HAZ, SAF, REQ, TST
or VAL ID has been invented in this document**; every HAZ/SAF ID cited was read from
`docs/05-clinical-safety/`.

---

## 10. Supersession relationships

- **Supersedes:** none.
- **Superseded by:** none.
- **Relationship notes:** if the boundary is later re-decided (e.g. staged option D-3
  maturing into (c)), the change must be a **new ADR that supersedes this one**, not an
  edit to an accepted decision. Partial supersession is permitted per tenant, facility,
  environment or operating mode — prompt §7.3's compatibility grant is explicitly
  per-interface and per-scope, and a boundary decision may legitimately be scoped the same
  way. It must never be generalized from a partial result.

---

## 11. Self-check against the template's completeness gate

All sections present; ≥2 viable alternatives plus defer (five presented); every alternative
carries positive and negative consequences; drivers are discriminating and mapped to
quality-attribute scenarios; **no numeric target invented**; all eight cross-cutting rows
present; reversibility, triggers, and kill/rollback present; validation methods carry
honest placeholders; supersession present; **no technology selected**; no approval
fabricated; `adr-index.md` updated in the same change.

**Autoverificação da revisão de 2026-08-15 (pt-BR):** o status permanece `proposed` e a
seção 5 permanece "NO DECISION IS RECORDED" — §5.2 é PROPOSAL encaminhada, não decisão;
as restrições de §2.4 são DECIDED **do titular, citadas com fonte e data**, jamais
auto-aplicadas; nenhum dono foi nomeado por este revisor (candidaturas citam DEC-G0-04);
nenhum ID de hazard/SAF/QAS foi inventado; corpo EN preservado, conteúdo novo em pt-BR
(DEC-G0-10).
