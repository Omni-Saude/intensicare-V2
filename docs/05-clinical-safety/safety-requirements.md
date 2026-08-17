---
id: SAFETY-REQUIREMENTS-V2
title: IntensiCare V2 Safety Requirements (SAF-0001..SAF-0042)
label: PROPOSAL
statement: >
  Forty-two safety requirements derived from the seeded hazard log. Every requirement
  is status PROPOSAL, owner UNASSIGNED, and unverified. None is implemented; none is
  accepted. A requirement here is a claim about what V2 must do, not evidence that it does.
  SAF-0042 was added on 2026-08-15 (in pt-BR per DEC-G0-10, cycle-0 English body not
  rewritten) as the clinical-safety face of SEC-0057, closing the declared analysis defect
  that HAZ-0045 had no SAF child. It is DET-only and explicitly insufficient: it records
  that HAZ-0045 (S5) does not satisfy the single-barrier rule and that no V2-side control
  can make it satisfy it, because the preventive barrier is owned outside this organization.
provenance:
  source_repo: intensicare-V2
  path_or_url: docs/05-clinical-safety/safety-requirements.md
  commit_sha_or_version: uncommitted (working tree at cb35521)
  section_or_lines: whole document
  date_collected: 2026-08-14
  collector: clinical safety-case engineer (Wave 1 specialist agent)
  transformation: derived per safety-plan.md §6.4 from hazard-log.md; cross-checked against orchestrator prompt non-negotiables §3
  confidence: medium
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  requirements: [SAF-0001, SAF-0037]
  hazards: [HAZ-0001, HAZ-0040]
  adrs: []
  tests: []
  pr: null
supersedes: null
superseded_by: null
---

# IntensiCare V2 — Safety Requirements (PROPOSAL)

> Every requirement below: **status `PROPOSAL`**, **owner `UNASSIGNED — VALIDATION REQUIRED`**,
> **verification `NOT PERFORMED`**. Writing a requirement is not a control. Per
> `safety-plan.md` §6.4, a `SAF` whose only evidence is a document is **not satisfied**.

> **2026-08-15:** SAF-0038/0039 added with HAZ-0041/0042 (minted from the Wave 2 threat
> model); SAF-0040/0041 added with HAZ-0043/0044 (minted from the pathway portfolio's
> portfolio-level hazards). See `hazard-log.md` §4. All four are in §H.
>
> **2026-08-15 (ciclo 1, extensão do contrato AMH):** **SAF-0042** acrescentado com
> **HAZ-0045**, em **§C** (identidade) e em **pt-BR** por `DEC-G0-10`. Ele fecha o defeito de
> análise declarado — HAZ-0045 sem filho `SAF` — e é a face de segurança clínica de
> **SEC-0057**. Nenhum `SAF` novo foi cunhado para **HAZ-0046** nem para **HAZ-0047**: o
> primeiro é coberto por SAF-0005/0034/0035/0023; o segundo depende de uma **determinação
> jurídica que nenhum agente pode autorar** — ver §I e `hazard-log.md`.

## 0. Reading key

- **Barrier:** `ELIM` eliminate by construction · `PREV` prevent · `DET` detect/surface ·
  `MIT` mitigate harm · `PROC` human procedure (`safety-plan.md` §6.4).
- **Verification:** the method that would demonstrate satisfaction. Naming it is mandatory;
  none has been executed.
- Rule (PROPOSAL, `safety-plan.md` §6.4): an S4/S5 hazard may not rely on `PROC` alone,
  and may not rely on a single barrier.
- `PROMPT:n` = `https://github.com/Omni-Saude/intensicare-V2/blob/main/INTENSICARE_V2_ORCHESTRATOR_PROMPT.md` line n.
- `LEGACY-TA:n` = `INTENSICARE_TECHNICAL_ASSESSMENT.md` line n (read-only input).

---

## A. Evaluation status and the prohibition on coercion

### SAF-0001 — Every evaluation result carries an explicit evaluation status
Every clinical evaluation output — score, criterion, pathway result, projection cell, API
field, and UI element — MUST carry exactly one status from `valid | partial |
not_evaluated | stale | invalid`, and MUST NOT be representable without one. A bare numeric
or severity value with no status MUST be unconstructible in the domain model and rejectable
at the API/schema boundary.
- **Hazards:** HAZ-0005, HAZ-0006, HAZ-0021, HAZ-0038, HAZ-0040
- **Barrier:** `ELIM` + `PREV`
- **Basis:** SOURCE `PROMPT:39`, `PROMPT:551` ("Safety state precedes severity"); INFERENCE from `LEGACY-TA:478` ("The metadata is not elevated into an evaluation-status contract")
- **Verification:** type-level/schema test that an unstatused result cannot be constructed or serialized; contract test on every API response; UI component test per status
- **Depends on:** `evaluation-status-semantics.md`
- **Status:** PROPOSAL · **Owner:** UNASSIGNED — VALIDATION REQUIRED

### SAF-0002 — No numeric or categorical default for missing, stale, or invalid clinical data
No code path may substitute `0`, a midpoint, a last-known value, a "normal" band, or any
other default for a clinical input that is missing, stale, invalid, quarantined, or
unevaluable. Absence MUST propagate as absence to an explicit status. This applies to
scoring functions, aggregates, projections, cache fills, API serializers, export jobs,
and analytics.
- **Hazards:** HAZ-0005, HAZ-0006, HAZ-0032, HAZ-0039
- **Barrier:** `ELIM`
- **Basis:** SOURCE `PROMPT:119` (non-negotiable rule 7); SOURCE `LEGACY-TA:469-478` (all four scorers returned `0` with all inputs absent — **the failure actually occurred**); SOURCE `LEGACY-TA:878` ("A numeric zero is not a safe substitute for missing clinical evidence")
- **Verification:** the **absent-input probe** (`safety-plan.md` §5.1 item 4) run as a *blocking* automated suite over every value-producing function and endpoint; property tests asserting no output value when any required input is absent; mutation testing on the safety kernel
- **Status:** PROPOSAL · **Owner:** UNASSIGNED — VALIDATION REQUIRED

### SAF-0003 — Versioned, independently approved completeness policy per pathway version
Each pathway/score version MUST declare, as part of its immutable release bundle, which
inputs are required, which are optional, which combinations yield `partial` versus
`not_evaluated`, and any clinically approved bounds (e.g. "best case / worst case"
substitution) — and that policy MUST be approved by a clinical approver who is not its
author. A missing completeness policy makes the pathway ineligible for actionable use.
- **Hazards:** HAZ-0005, HAZ-0019, HAZ-0036
- **Barrier:** `PREV`
- **Basis:** SOURCE `PROMPT:296`, `PROMPT:341-345`, `PROMPT:122`; SOURCE `LEGACY-TA:646` (remediation requires "a versioned completeness policy… independently ratify per-score policies"); SOURCE `LEGACY-TA:999` (open question: which components invalidate versus degrade each score)
- **Verification:** release-bundle schema gate (bundle without completeness policy fails to load); reference vectors per policy branch; named clinical approver recorded in the bundle
- **Status:** PROPOSAL · **Owner:** UNASSIGNED — VALIDATION REQUIRED

### SAF-0006 — An aggregate may never be more reassuring than its least-evaluated member
Any roll-up — bed state, unit summary, ward heat map, KPI, count of "normal" beds — MUST
NOT report a reassuring category derived from members that were `not_evaluated`, `stale`,
`invalid`, or `partial`. Unevaluated members MUST be counted and displayed in their own
category, never folded into "normal" and never omitted.
- **Hazards:** HAZ-0005, HAZ-0039
- **Barrier:** `ELIM` + `DET`
- **Basis:** SOURCE `LEGACY-TA:330` (an occupied bed without sufficient measurements was shown as `normal` although the design standard required `não avaliado` and separate unit counts); SOURCE `LEGACY-TA:646`; SOURCE `PROMPT:262`
- **Verification:** property test — for every aggregate, injecting an unevaluated member never improves the aggregate category; UI component tests per aggregate state; human-factors check that the unevaluated category is noticed
- **Status:** PROPOSAL · **Owner:** UNASSIGNED — VALIDATION REQUIRED

### SAF-0032 — Source data quality and V2 evaluation status are two dimensions, never one
Source data-quality state (including AMH `valid | warning | quarantined`) and V2 evaluation
status MUST be stored, transported, and displayed as independent fields. Collapsing,
aliasing, or defaulting one from the other is prohibited. An explicit, versioned mapping
matrix MUST exist and MUST be tested; a `quarantined` source MUST NOT become an ordinary V2
value, and a `valid` source MUST NOT by itself yield a `valid` evaluation.
- **Hazards:** HAZ-0040, HAZ-0006, HAZ-0039
- **Barrier:** `ELIM` + `PREV`
- **Basis:** SOURCE `PROMPT:497-502`, `PROMPT:102`
- **Verification:** schema test that both fields are present and independently settable; exhaustive mapping-matrix table test; negative test that no code path derives one from the other
- **Depends on:** `evaluation-status-semantics.md` §5
- **Status:** PROPOSAL · **Owner:** UNASSIGNED — VALIDATION REQUIRED

---

## B. Time, provenance, freshness

### SAF-0004 — Per-input freshness policy, computed not assumed
Every clinical input concept MUST have a declared, versioned freshness window per pathway
version. Staleness MUST be computed from the preserved source clinical time against a
trusted evaluation clock — never from receipt time and never from row insertion order. An
input outside its window MUST drive the evaluation to `stale` (or `partial`/`not_evaluated`
per SAF-0003), never to a silently accepted value.
- **Hazards:** HAZ-0006, HAZ-0010, HAZ-0026, HAZ-0030
- **Barrier:** `PREV` + `DET`
- **Basis:** SOURCE `PROMPT:119`, `PROMPT:294`; SOURCE `LEGACY-TA:307`; SOURCE `LEGACY-TA:469` (legacy HAZ-024)
- **Verification:** boundary/property tests at window edges; clock-skew tests; replay corpus with delayed arrivals
- **Status:** PROPOSAL · **Owner:** UNASSIGNED — VALIDATION REQUIRED

### SAF-0005 — Freshness, source, and missingness are visible wherever a clinical value is shown
Every clinically relevant value displayed to a user MUST carry, without additional
navigation, its evaluation status, its source clinical time (or explicit absence), and a
non-color-only cue distinguishing fresh / aging / stale / missing / invalid / conflicted /
superseded. Suppressed and partially completed items MUST be visible in the same view.
- **Hazards:** HAZ-0006, HAZ-0004, HAZ-0022, HAZ-0025, HAZ-0030, HAZ-0033
- **Barrier:** `DET`
- **Basis:** SOURCE `PROMPT:667-675`, `PROMPT:683-690`; SOURCE `LEGACY-TA:330` ("the system does not consistently distinguish fresh, stale, expired, missing, invalid, and partially evaluated states… likely to create false reassurance")
- **Verification:** component/interaction test per state; accessibility validation (SAF-0034); representative ICU simulation — **VALIDATION REQUIRED** (human-factors study, no named owner)
- **Status:** PROPOSAL · **Owner:** UNASSIGNED — VALIDATION REQUIRED

### SAF-0010 — Source timestamps are preserved, never invented
The original source time value, its timezone/offset, and its stated precision MUST be
persisted verbatim alongside the normalized UTC instant. When a source omits or malforms a
clinical time, the system MUST record its absence and mark the record's quality state — it
MUST NOT substitute receipt time, ingest time, or "now".
- **Hazards:** HAZ-0007, HAZ-0026
- **Barrier:** `ELIM`
- **Basis:** SOURCE `PROMPT:120` (non-negotiable rule 8); SOURCE `LEGACY-TA:442`, `LEGACY-TA:642`
- **Verification:** ingest contract test rejecting timestamp substitution; fixture set with absent/malformed/ambiguous times; assertion that no default-now expression exists on any clinical time field (static check)
- **Status:** PROPOSAL · **Owner:** UNASSIGNED — VALIDATION REQUIRED

### SAF-0011 — Distinct clinical time dimensions are modelled separately
Observed, effective, issued, source-ingested, received, persisted, evaluated, alerted,
displayed, acknowledged, acted, corrected, and reconciled times MUST be distinct persisted
fields. No two may share a column, and none may be derived by defaulting from another.
- **Hazards:** HAZ-0007, HAZ-0010, HAZ-0011, HAZ-0026
- **Barrier:** `ELIM` + `DET`
- **Basis:** SOURCE `PROMPT:598`, `PROMPT:476`
- **Verification:** schema/migration test; end-to-end synthetic probe measuring each interval (feeds SAF-0031)
- **Status:** PROPOSAL · **Owner:** UNASSIGNED — VALIDATION REQUIRED

### SAF-0012 — Clock skew and timezone anomalies are detected and quarantined
Ingest MUST detect implausible clinical times (future-dated beyond tolerance, pre-admission,
skew beyond a declared bound, ambiguous DST-local times) and quarantine or explicitly flag
them rather than accept them. Tolerances MUST be declared per source and versioned.
- **Hazards:** HAZ-0026, HAZ-0012
- **Barrier:** `DET` + `PREV`
- **Basis:** SOURCE `PROMPT:761`, `PROMPT:378`, `PROMPT:803`
- **Verification:** clock-skew test suite; DST-transition fixtures for `America/Sao_Paulo`
- **Status:** PROPOSAL · **Owner:** UNASSIGNED — VALIDATION REQUIRED

---

## C. Identity, tenancy, authorization

### SAF-0007 — Tenant, patient, encounter, and purpose context are fail-closed and never caller-supplied
All authorization context MUST be derived from verified identity (token/workload identity),
never from a request header, query parameter, body field, or any other caller-controlled
value. When tenant, identity, purpose, or consent context is missing, mismatched, or
unverifiable, the operation MUST fail closed — no partial result, no degraded read, no
default tenant.
- **Hazards:** HAZ-0001, HAZ-0003, HAZ-0013, HAZ-0014, HAZ-0018
- **Barrier:** `PREV`
- **Basis:** SOURCE `PROMPT:118` (non-negotiable rule 6), `PROMPT:448-449`, `PROMPT:451`; SOURCE `LEGACY-TA:305` ("Caller header wins; equality check is tautological"); SOURCE `LEGACY-TA:879` ("Authorization checks are meaningless when resource ownership is supplied by the caller or absent from the data")
- **Verification:** adversarial cross-tenant test suite (blocking); negative-auth tests; penetration test — accepted by a verifier who did not implement it (`PROMPT:201`)
- **Status:** PROPOSAL · **Owner:** UNASSIGNED — VALIDATION REQUIRED

### SAF-0008 — Tenant and encounter ownership are storage-level invariants on every clinical fact
Every clinical fact, evaluation record, alert, work item, audit row, cache key, event, and
subscription MUST carry immutable tenant (and, where applicable, encounter) ownership
enforced at the storage layer — not compensated for in application code. No unscoped
repository method, query, projection, topic, or subscription may exist.
- **Hazards:** HAZ-0002, HAZ-0003, HAZ-0004, HAZ-0013
- **Barrier:** `ELIM`
- **Basis:** SOURCE `PROMPT:552`, `PROMPT:605`, `PROMPT:1060`; SOURCE `LEGACY-TA:855` ("Tenant and encounter ownership are database invariants"); SOURCE `LEGACY-TA:263`, `LEGACY-TA:632`
- **Verification:** persistence constraint tests; row-level-isolation tests; static check that no query builder can omit the ownership predicate
- **Status:** PROPOSAL · **Owner:** UNASSIGNED — VALIDATION REQUIRED

### SAF-0009 — Identity/encounter resolution is explicit, scoped, and separate from authorization
Subject and encounter references MUST be resolved through a declared, versioned resolution
contract scoped by tenant and facility/encounter context. Identifiers MUST NOT be joined
across tenants, clinical legal entities, or source partitions merely because a value
matches. A resolved identity does not grant access; authorization is a separate decision.
Unresolvable identity MUST yield `not_evaluated`, never a best guess.
- **Hazards:** HAZ-0001, HAZ-0002, HAZ-0004, HAZ-0027, HAZ-0038
- **Barrier:** `PREV`
- **Basis:** SOURCE `PROMPT:444-449`; SOURCE `PROMPT:99` (ADR-041 vs ADR-006 contradiction — must not be resolved silently); SOURCE `LEGACY-TA:1006`
- **Verification:** contract tests against the pinned AMH identity contract; negative tests for cross-PJ joins; referential-gap measurement (SAF-0033)
- **Blocked by:** the AMH tenant/MPI contradiction record — **VALIDATION REQUIRED**, owner: AMH tenant-and-identity adjudication analyst + named identity-policy approver
- **Status:** PROPOSAL · **Owner:** UNASSIGNED — VALIDATION REQUIRED

### SAF-0029 — Merge, unmerge, and reassignment have defined replay consequences
Identity merge, unmerge, alias, reassignment, deceased, discharge, and correction events
MUST have declared semantics covering: which historical facts are re-associated, what
happens to open alerts and work items, whether prior evaluations are recomputed or marked
superseded, and what the clinician sees during the transition. Silent re-association and
silent non-association are both prohibited.
- **Hazards:** HAZ-0027, HAZ-0002, HAZ-0008
- **Barrier:** `PREV` + `DET`
- **Basis:** SOURCE `PROMPT:447`, `PROMPT:494`; SOURCE `LEGACY-TA:455`
- **Verification:** merge/unmerge replay scenario suite; reconciliation report proving no silent loss
- **Status:** PROPOSAL · **Owner:** UNASSIGNED — VALIDATION REQUIRED

### SAF-0042 — Telemetria de anomalia de identidade: detecção compensatória, explicitamente insuficiente

> *Requisito acrescentado em 2026-08-15, redigido em **pt-BR** conforme `DEC-G0-10` (material
> novo em pt-BR; o corpo em inglês dos §§A–J **não é reescrito**). Alojado em §C por ser
> controle de identidade — junto de SAF-0009 e SAF-0029, com que forma cadeia — e não em §H,
> onde SAF-0038..0041 foram agrupados por conveniência de ordem de cunhagem.*

A V2 DEVE medir e alarmar anomalias **com forma de identidade**, observáveis **sem** manter
qualquer estrutura de correspondência cross-PJ e **sem** identificadores de fonte:

1. mudança brusca do perfil demográfico/clínico transportado no encontro para uma **mesma
   ref** (faixa etária, sexo, tipo sanguíneo quando presente, degrau de peso/altura
   fisiologicamente implausível);
2. `merge`/`alias` que unifica refs cujas histórias de encontro **se sobrepõem no tempo** em
   unidades ou estabelecimentos distintos;
3. taxa de eventos de identidade por tenant, por tipo e por janela **fora de limites
   declarados** — incluindo explicitamente o caso **"nenhum evento"**, que é o sinal de perda
   silenciosa de evento de identidade (HAZ-0027, condição estendida);
4. descontinuidade fisiologicamente implausível na série de fatos de uma ref **após** uma
   transição de identidade;
5. `resolve` que muda de resposta para o **mesmo** `(ref, as_of)` entre duas chamadas —
   violação direta do determinismo exigido pela cláusula de contrato.

A resposta ao alarme DEVE ser **revisão clínica humana + suspensão da reatribuição
automática**. A V2 **NÃO DEVE** desfazer merge, resolver duplicata nem inferir identidade —
isso é capacidade AMH e permanece proibida à V2 (`IDP-04`, `IDP-09`; ADR-0004 §5.2.1).
**Restrição de desenho vinculante:** este controle **NÃO PODE** persistir, derivar ou inferir
correspondência entre sujeitos de PJs distintas — isso recriaria dentro da V2 exatamente a
estrutura que AQ-4 mantém fora (`SEC-0010`).

- **Hazards:** HAZ-0045 (primário), HAZ-0027, HAZ-0047, HAZ-0001
- **Barrier:** `DET` — **e somente `DET`**
- **Basis:** SOURCE `lgpd-os16/minuta-parecer-os-16.md` §3.6 **R-a5** (contaminação silenciosa
  da V2) e **R-a3** (falso-positivo cross-PJ = dano de privacidade **e** perigo clínico
  simultâneos); SOURCE `threat-model.md` §12.3.4 **THR-0080** e §12.5.1 item 3; SOURCE
  `security-controls-catalog.md` **SEC-0057**, do qual este requisito é a face de segurança
  clínica — os cinco sinais e a restrição de desenho são os mesmos, deliberadamente, para que
  segurança e segurança clínica não especifiquem controles divergentes sob o mesmo nome
- **Limites declarados — leia-os antes de citar este requisito** (SEC-0057 §"Limites"):
  1. **Não previne nada.** Detecta *depois* que a atribuição errada já entrou e já pôde ser
     avaliada, alertada e agida.
  2. **Não detecta o caso difícil.** Um par falso-positivo entre dois pacientes de perfil
     demográfico e clínico **semelhante** — que é precisamente o caso em que o par errado é
     *mais* provável — passa invisível.
  3. **Taxa de falso-positivo desconhecida e não medida, e isso é um conflito entre dois
     perigos deste log:** em UTI, alarme com FP alto produz fadiga de alarme, que é
     **HAZ-0016**. Calibrar exige dados que não existem. Um limiar não calibrado troca
     HAZ-0045 por HAZ-0016 em vez de reduzir risco líquido.
  4. **Não transfere a propriedade do controle preventivo para dentro da V2.** O preventivo
     pertence à governança do índice do ADR-043 e ao parecer jurídico da OS-16
     (`AUTH-AMH-OWNER`, `AUTH-PRIVACY-LEGAL`, ambos UNASSIGNED).
  5. **Conformidade com a restrição de desenho é VALIDATION REQUIRED** por revisor
     independente — não é asseverável por quem implementa.
- **Consequência para a regra de barreira única (§0), declarada e não contornada:** HAZ-0045 é
  **S5** e, do lado da V2, tem **apenas `DET`**. A regra PROPOSAL de `safety-plan.md` §6.4 —
  um perigo S4/S5 não pode depender de barreira única — **não é satisfeita para HAZ-0045, e
  nenhum controle da V2 pode satisfazê-la**, porque a barreira preventiva tem dono fora desta
  organização de software. Isto é registro de uma lacuna estrutural, **não** um pedido de
  dispensa e **não** aceitação de risco: fechar exige ato humano nomeado sobre a governança do
  índice, não mais engenharia na V2.
- **Verification:** detecção com anomalias **plantadas** em dados sintéticos, por sinal (os
  cinco acima); medição da taxa de falso-positivo antes de qualquer exposição a clínico;
  teste negativo de que nenhum caminho de código persiste, deriva ou infere correspondência
  entre PJs; asserção de que o alarme **não** dispara reatribuição automática; revisão
  independente da restrição de desenho. **NOT PERFORMED · TST: UNASSIGNED**
- **Status:** PROPOSAL · **Owner:** UNASSIGNED — VALIDATION REQUIRED

---

## D. Idempotency, ordering, correction

### SAF-0013 — Canonical idempotency on every ingested envelope and every command
Every ingested source envelope and every state-changing command MUST carry a canonical,
source-derived idempotency key that is durable and cross-process. A key derived from
mutable or patient-derived data (rather than message identity) is prohibited. Replays MUST
be provably no-ops, not "usually" no-ops.
- **Hazards:** HAZ-0009, HAZ-0012, HAZ-0016, HAZ-0023, HAZ-0013
- **Barrier:** `PREV`
- **Basis:** SOURCE `PROMPT:707-708`, `PROMPT:724`; SOURCE `LEGACY-TA:443` (patient-derived fallback key caused distinct messages to be mistaken for replay); SOURCE `LEGACY-TA:444` (process-local replay store)
- **Verification:** duplicate-delivery and crash-point replay tests; idempotency property tests
- **Status:** PROPOSAL · **Owner:** UNASSIGNED — VALIDATION REQUIRED

### SAF-0014 — Ordering, correction, and supersession are explicit; history is append-only
Out-of-order arrival MUST NOT allow an older value to overwrite a newer one. Corrections,
amendments, cancellations, and tombstones MUST be modelled as new linked facts that
supersede prior ones; they MUST NOT mutate or delete history. Every superseded evaluation
and every alert derived from a corrected value MUST be explicitly retracted or re-evaluated,
and that retraction MUST be visible.
- **Hazards:** HAZ-0008, HAZ-0009, HAZ-0011, HAZ-0027, HAZ-0034
- **Barrier:** `ELIM` + `DET`
- **Basis:** SOURCE `PROMPT:476`, `PROMPT:494`, `PROMPT:553`; SOURCE `LEGACY-TA:856`, `LEGACY-TA:931`
- **Verification:** out-of-order and correction scenario matrices (`PROMPT:795`); replay determinism test
- **Status:** PROPOSAL · **Owner:** UNASSIGNED — VALIDATION REQUIRED

### SAF-0028 — Unknown codes and units are quarantined, never coerced
An unrecognised clinical code, an unmapped concept, a missing unit, or a non-canonical unit
string MUST cause the value to be quarantined or explicitly represented as unmappable. It
MUST NOT be coerced to a default unit, nearest code, or assumed concept. Unit normalization
MUST preserve the source value and record mapping provenance and terminology version.
- **Hazards:** HAZ-0032, HAZ-0007, HAZ-0006
- **Barrier:** `ELIM` + `PREV`
- **Basis:** SOURCE `PROMPT:716`; SOURCE `LEGACY-TA:459`, `LEGACY-TA:586` (unit validator fails on three `unit='anyOf:'` values)
- **Verification:** terminology conformance suite with unknown-code and bad-unit fixtures; blocking unit-validation gate (a failing unit validator may not be advisory — see SAF-0030)
- **Status:** PROPOSAL · **Owner:** UNASSIGNED — VALIDATION REQUIRED

---

## E. Rule governance and the evaluation record

### SAF-0019 — Immutable evaluation record, including why a rule did NOT fire
Every evaluation MUST produce an immutable record capturing: rule bundle identity and
content hash, rule version, terminology snapshot version, every input used with its source
time and quality state, every input that was missing/stale/invalid, the resulting evaluation
status, the outcome, and — when no alert was raised — **the explicit machine-readable reason
for the no-fire**. A no-fire with no recorded reason is a defect.
- **Hazards:** HAZ-0021, HAZ-0005, HAZ-0008, HAZ-0019, HAZ-0022, HAZ-0035, HAZ-0029
- **Barrier:** `DET` + `ELIM`
- **Basis:** SOURCE `LEGACY-TA:486` ("No immutable evaluation record captures why a rule did **not** run or did not fire"); SOURCE `PROMPT:119`, `PROMPT:758`, `PROMPT:794`
- **Verification:** replay determinism test (same inputs + same bundle → same record); assertion that every evaluation emits a record including no-fire reason; mutation testing on the kernel
- **Status:** PROPOSAL · **Owner:** UNASSIGNED — VALIDATION REQUIRED

### SAF-0020 — Rule bundles are immutable, versioned, signed, and author ≠ approver
Clinical logic MUST be released only as an immutable, versioned, signed bundle whose
signature and content hash are verified at load. The bundle MUST link evidence, intended
use/population/exclusions, terminology versions, completeness/freshness policy, test
vectors, hazard/control links, clinical owner, and an independent approver who is not the
author. Unsigned, unverifiable, or unapproved content MUST fail to load — failing closed,
not falling back.
- **Hazards:** HAZ-0019, HAZ-0020, HAZ-0036
- **Barrier:** `PREV`
- **Basis:** SOURCE `PROMPT:122` (non-negotiable rule 10), `PROMPT:330-345`; SOURCE `LEGACY-TA:487`, `LEGACY-TA:857`
- **Verification:** signature-verification test; bundle-schema gate; negative test that an unapproved bundle cannot activate; recorded approver identity distinct from author
- **Status:** PROPOSAL · **Owner:** UNASSIGNED — VALIDATION REQUIRED

### SAF-0021 — Single active version, transactional activation, rollback, and per-bundle kill switch
At any instant, every runtime instance MUST agree on exactly one active version per rule
bundle. Activation and rollback MUST be transactional and auditable. A **kill switch per
rule bundle** MUST exist, be exercisable without a code deploy, take effect across all
instances within a declared bound, and put affected evaluations into an explicit
`not_evaluated` state — never into a silent no-fire.
- **Hazards:** HAZ-0020, HAZ-0019, HAZ-0036
- **Barrier:** `MIT` + `PREV`
- **Basis:** SOURCE `PROMPT:345`, `PROMPT:862`, `PROMPT:897`; SOURCE `LEGACY-TA:722-726` (multiple engine instances holding divergent state)
- **Verification:** multi-instance activation/rollback test; kill-switch drill measuring propagation time and resulting status; game-day exercise
- **Status:** PROPOSAL · **Owner:** UNASSIGNED — VALIDATION REQUIRED

### SAF-0035 — Non-actioning by default; intended-use boundary is enforced, not described
A pathway MUST be non-actioning (shadow/evaluation-only) until it has passed its portfolio
gate (G2) and its source-eligibility gate (G3). The system MUST enforce the approved
intended use — population, care setting, exclusions — and MUST refuse to evaluate outside
it with an explicit `not_evaluated` reason rather than producing a result. Output language
MUST remain advisory within the approved boundary.
- **Hazards:** HAZ-0036, HAZ-0030, HAZ-0038, HAZ-0039
- **Barrier:** `PREV`
- **Basis:** SOURCE `PROMPT:127` (rule 15), `PROMPT:349`, `PROMPT:515`, `PROMPT:1052`; SOURCE `LEGACY-TA:497-499`
- **Verification:** out-of-population and out-of-setting negative tests; mode-flag test that an ungated pathway cannot produce an actionable alert
- **Status:** PROPOSAL · **Owner:** UNASSIGNED — VALIDATION REQUIRED

---

## F. Alert durability, delivery, and suppression transparency

### SAF-0015 — Durable before visible: real-time delivery is a view of committed state
An alert or work item MUST be durably committed, with its outbox entry, in the same
transaction as the state change that warrants it, before any real-time delivery is
attempted. WebSocket/SSE/MCP output is a projection, never the system of record and never
the only copy. Delivery failure MUST NOT lose the alert; it MUST leave it recoverable and
visible by polling.
- **Hazards:** HAZ-0015, HAZ-0012, HAZ-0017
- **Barrier:** `ELIM`
- **Basis:** SOURCE `PROMPT:121` (non-negotiable rule 9), `PROMPT:556`; SOURCE `LEGACY-TA:859`, `LEGACY-TA:880`; SOURCE `LEGACY-TA:669-677` (IC-005)
- **Verification:** crash-point tests between commit and publish; outbox replay tests; kill-the-socket test proving the alert is still reachable
- **Status:** PROPOSAL · **Owner:** UNASSIGNED — VALIDATION REQUIRED

### SAF-0016 — Generated-to-displayed is measured, and undelivered alerts are detected
The system MUST measure and expose, as an SLI, the interval and loss between alert
generation, durable commit, delivery, display, and acknowledgment. An alert generated but
not displayed to any authorized human within a declared bound MUST raise an operational
signal and MUST be visible to the clinical operator. Dedup/grouping MUST NOT reduce this
count silently.
- **Hazards:** HAZ-0015, HAZ-0016, HAZ-0017, HAZ-0018, HAZ-0024
- **Barrier:** `DET`
- **Basis:** SOURCE `PROMPT:804`, `PROMPT:870-875`; SOURCE `LEGACY-TA:495`, `LEGACY-TA:560` (no such monitor existed)
- **Verification:** synthetic end-to-end safety probe (`PROMPT:612`, `PROMPT:804`); failover test measuring loss; alert-delivery reconciliation report
- **Status:** PROPOSAL · **Owner:** UNASSIGNED — VALIDATION REQUIRED

### SAF-0022 — Suppression is transparent and auditable
Every suppression, cooldown, deduplication, or grouping decision MUST be recorded with its
rule, its window, and the suppressed instances, and MUST be visible to the clinician
viewing the affected patient or queue. A condition that continues or escalates while
suppressed MUST break through suppression per a clinically approved policy. Silent
suppression is prohibited.
- **Hazards:** HAZ-0022, HAZ-0016
- **Barrier:** `DET`
- **Basis:** SOURCE `PROMPT:758`, `PROMPT:1059`; SOURCE `LEGACY-TA:494`, `LEGACY-TA:308`
- **Verification:** suppression audit test; UI test showing suppressed instances; escalation-breakthrough scenario test
- **Status:** PROPOSAL · **Owner:** UNASSIGNED — VALIDATION REQUIRED

### SAF-0031 — Declared, measured latency budget; no actionable pathway on a lane that cannot meet it
Each pathway MUST declare a clinically justified end-to-end budget from source event to
clinician-visible alert. The delivering lane's actual latency MUST be **measured** in a
production-like environment. If measured latency cannot meet the declared budget, the
pathway MUST NOT be actionable on that lane; it must be re-scoped, re-laned, or classified
`DEFER`/`RESEARCH`. Batch/analytical lanes MUST NOT back safety-critical alerting.
- **Hazards:** HAZ-0030, HAZ-0010, HAZ-0017, HAZ-0015
- **Barrier:** `PREV` + `DET`
- **Basis:** SOURCE `LEGACY-TA:231,239,304` (sub-30-minute Gold vs sub-30-second objective); SOURCE `PROMPT:95` (ADR-040: "explicitly says the path is not near-real-time"); SOURCE `PROMPT:431-436`, `PROMPT:510`
- **Verification:** measured latency percentiles per lane (not documented targets); synthetic probes; explicit gate blocking actionable status when budget > measured p95/p99
- **Status:** PROPOSAL · **Owner:** UNASSIGNED — VALIDATION REQUIRED

---

## G. Human action, concurrency, and responsibility

### SAF-0017 — Alert lifecycle is a concurrency-safe, idempotent, attributed state machine
Alert/work-item transitions MUST be defined as an explicit state machine with: optimistic
concurrency (version token), idempotent commands, mandatory actor identity, transition-
appropriate mandatory rationale, and escalation timers. A conflicting concurrent transition
MUST be rejected and surfaced to the user — never silently merged or last-write-wins.
- **Hazards:** HAZ-0023, HAZ-0024, HAZ-0016, HAZ-0033, HAZ-0035
- **Barrier:** `PREV` + `DET`
- **Basis:** SOURCE `PROMPT:555`, `PROMPT:707`, `PROMPT:760`; SOURCE `LEGACY-TA:709-717` (IC-009: lost updates, absent resolve actor, no transition audit)
- **Verification:** concurrency property tests (two-writer race); idempotent-retry tests; state-machine model tests covering every transition and rejection
- **Clinical dependency:** allowed transitions, roles, timers, and handoff rules require clinical governance definition — **VALIDATION REQUIRED** (`LEGACY-TA:717`)
- **Status:** PROPOSAL · **Owner:** UNASSIGNED — VALIDATION REQUIRED

### SAF-0018 — Group actions are atomic or transparently partial
A bulk action over a safety-relevant queue MUST either apply atomically or return an
explicit per-item result that the UI renders item-by-item. Optimistic UI state MUST NOT
show a group as acted-on while any item failed, and MUST NOT retain a stale aggregate that
contradicts server state.
- **Hazards:** HAZ-0033, HAZ-0023, HAZ-0018, HAZ-0016
- **Barrier:** `PREV` + `DET`
- **Basis:** SOURCE `PROMPT:684-686` ("no local optimistic state that can mask a failed safety-relevant command"); SOURCE `LEGACY-TA:324`
- **Verification:** partial-failure scenario test at API and UI level; test that no optimistic state survives a failed command
- **Status:** PROPOSAL · **Owner:** UNASSIGNED — VALIDATION REQUIRED

### SAF-0024 — Explicit degraded mode, downtime procedure, and post-recovery reconciliation
Degradation MUST be explicit at component, data, rule, workflow, and UI levels. Readiness
MUST represent safe clinical capability — not process liveness — and MUST fail when rule
bundles failed to load, a required feed is stale, or delivery is impaired. A documented,
exercised downtime procedure and a post-recovery reconciliation workflow MUST exist and
MUST tell clinicians what was and was not evaluated during the outage.
- **Hazards:** HAZ-0025, HAZ-0020, HAZ-0024, HAZ-0034, HAZ-0037
- **Barrier:** `DET` + `MIT` + `PROC`
- **Basis:** SOURCE `PROMPT:557`, `PROMPT:881`, `PROMPT:693`; SOURCE `LEGACY-TA:490`, `LEGACY-TA:560`, `LEGACY-TA:860`
- **Verification:** readiness test asserting failure on rule-load failure and feed staleness; game-day/downtime exercise with reconciliation output — **VALIDATION REQUIRED** (operational exercise)
- **Status:** PROPOSAL · **Owner:** UNASSIGNED — VALIDATION REQUIRED

### SAF-0025 — Feed outage and staleness are visible to clinicians, not only to operators
When an integration is down, degraded, lagging, or delivering stale data, the affected
clinical views MUST show it at the point of care — on the affected beds/patients — with the
time of last trusted data. Operator-only dashboards do not satisfy this requirement. The
interface MUST never appear healthy when feeds, workers, rules, identity, or freshness are
impaired.
- **Hazards:** HAZ-0025, HAZ-0006, HAZ-0010, HAZ-0017, HAZ-0020, HAZ-0030
- **Barrier:** `DET`
- **Basis:** SOURCE `PROMPT:502` ("make safety-impacting breaches visible to clinicians and operators"), `PROMPT:860`, `PROMPT:1059`; SOURCE `LEGACY-TA:754`
- **Verification:** feed-outage scenario test asserting per-patient degraded indicators; ICU simulation confirming clinicians notice it — **VALIDATION REQUIRED**
- **Status:** PROPOSAL · **Owner:** UNASSIGNED — VALIDATION REQUIRED

### SAF-0034 — Clinical state changes are announced accessibly and cued non-visually
New, escalating, and resolved clinical alerts MUST be announced through coalesced,
rate-limited live regions, and MUST be distinguishable without color. Announcement behaviour
MUST be tested with representative assistive technology, not only by automated rule checks.
- **Hazards:** HAZ-0037, HAZ-0005, HAZ-0025
- **Barrier:** `DET`
- **Basis:** SOURCE `PROMPT:690-691`; SOURCE `LEGACY-TA:345`, `LEGACY-TA:349`
- **Verification:** automated accessibility suite (blocking) plus manual assistive-technology validation — **VALIDATION REQUIRED** (accessibility sign-off owner, `PROMPT:186`)
- **Status:** PROPOSAL · **Owner:** UNASSIGNED — VALIDATION REQUIRED

---

## H. Audit, evidence, PHI, AI surfaces, and gates

### SAF-0023 — Immutable, tamper-evident, complete audit of every read, change, decision, and action
Every clinical read, state change, evaluation, alert transition, override, suppression,
configuration change, and rule activation MUST produce an append-only, tamper-evident audit
record with actor, purpose, tenant, resource, timestamp, and correlation. Audit records MUST
be encrypted where they contain PHI, MUST NOT be mutable, and MUST be exportable as evidence.
- **Hazards:** HAZ-0035, HAZ-0008, HAZ-0014, HAZ-0022, HAZ-0023, HAZ-0028, HAZ-0034
- **Barrier:** `DET`
- **Basis:** SOURCE `PROMPT:594`, `PROMPT:768`; SOURCE `LEGACY-TA:311`, `LEGACY-TA:712`, `LEGACY-TA:884`
- **Verification:** audit-completeness test per state transition; tamper-evidence test; evidence-export integrity check
- **Status:** PROPOSAL · **Owner:** UNASSIGNED — VALIDATION REQUIRED

### SAF-0026 — PHI minimization and redaction across every non-clinical surface
PHI, identifiers, credentials, tokens, and raw clinical payloads MUST NOT appear in logs,
traces, metrics, error responses, queues, caches, exports, notifications, backups,
screenshots, tickets, fixtures, source control, or agent/model prompts. Development and test
MUST use synthetic or formally de-identified data. Redaction MUST be enforced by the
platform, not by developer discipline.
- **Hazards:** HAZ-0028, HAZ-0013, HAZ-0014, HAZ-0029, HAZ-0035
- **Barrier:** `PREV` + `DET`
- **Basis:** SOURCE `PROMPT:124` (non-negotiable rule 12), `PROMPT:562`, `PROMPT:757`; SOURCE `LEGACY-TA:447`, `LEGACY-TA:516`, `LEGACY-TA:560`
- **Verification:** log/trace redaction tests with PHI-shaped fixtures; secret and PHI scanning in CI (blocking); error-body contract tests
- **Status:** PROPOSAL · **Owner:** UNASSIGNED — VALIDATION REQUIRED

### SAF-0027 — AI/MCP surfaces are read-only by default, grounded, and never the clinical record
MCP/AI tool surfaces MUST be narrow, typed, versioned, read-only by default, and subject to
the same identity/tenant/purpose/audit policy as first-party APIs. Untrusted clinical or
document content MUST be structurally separated from instructions. Model-generated prose
MUST NOT replace, restate as authoritative, or contradict the signed deterministic
evaluation record, and MUST carry provenance, freshness, and uncertainty. High-consequence
writes require explicit human confirmation; autonomous clinical action is prohibited unless
separately approved.
- **Hazards:** HAZ-0029, HAZ-0028, HAZ-0036
- **Barrier:** `PREV` + `DET`
- **Basis:** SOURCE `PROMPT:728-742`, `PROMPT:764`, `PROMPT:1063`
- **Verification:** injection, exfiltration, confused-deputy, cross-tenant-inference, unsafe-chaining, replay, and stale-data tests (`PROMPT:741`); assertion that no clinical decision path consumes model prose
- **Handoff:** MCP clinical-tool safety engineer + Wave 2 threat model
- **Status:** PROPOSAL · **Owner:** UNASSIGNED — VALIDATION REQUIRED

### SAF-0033 — Continuous live-data fitness checks on every consumed source
The system MUST continuously measure, per consumed source and tenant/facility: emptiness,
null distribution on business-critical columns, tenant/facility coverage, referential
completeness (e.g. clinical resources referencing absent encounters), freshness, correction
lag, and duplicate rate. Breaches with safety impact MUST be visible to clinicians and
operators (SAF-0025) and MUST be capable of forcing affected evaluations to
`not_evaluated`/`stale`.
- **Hazards:** HAZ-0038, HAZ-0039, HAZ-0006, HAZ-0007, HAZ-0008, HAZ-0010, HAZ-0011, HAZ-0012, HAZ-0026, HAZ-0032, HAZ-0040
- **Barrier:** `DET`
- **Basis:** SOURCE `PROMPT:502`, `PROMPT:414-415`; SOURCE `PROMPT:103` (measured Gold sweep: 21 empty tables, 21 all-null); SOURCE `PROMPT:105` (52,452 rows referencing absent encounters)
- **Verification:** fitness-check suite executed against the pinned AMH environment; alerting on breach; evidence that "query succeeds" never counts as fitness
- **Status:** PROPOSAL · **Owner:** UNASSIGNED — VALIDATION REQUIRED

### SAF-0030 — Safety-critical gates are blocking, and a gate that validates nothing FAILS
Every safety-critical check — clinical reference vectors, missing/stale/invalid/partial
matrices, tenant isolation, migration clean-install/upgrade/rollback, contract conformance,
accessibility, authenticated end-to-end journeys, restore — MUST be a required, blocking
status check. A gate that collects **zero** cases, silently skips, self-skips, or excludes a
suite MUST fail the pipeline rather than pass. No production release may rely on an
advisory safety gate.
- **Hazards:** HAZ-0031, HAZ-0005, HAZ-0019, HAZ-0021
- **Barrier:** `PREV` + `DET`
- **Basis:** SOURCE `PROMPT:125` (non-negotiable rule 13), `PROMPT:808`; SOURCE `LEGACY-TA:584` ("All 0" pass — "False-green gate; validates nothing"), `LEGACY-TA:729-737`, `LEGACY-TA:886` ("Quality gates must fail when they validate nothing")
- **Verification:** meta-test asserting each safety gate fails on an empty corpus; branch-protection configuration check as an automated assertion, not a claim
- **Status:** PROPOSAL · **Owner:** UNASSIGNED — VALIDATION REQUIRED

### SAF-0036 — Backup, restore, and post-downtime reconciliation are demonstrated before reliance
Backup integrity, restore to a declared RPO/RTO, migration rollback, and post-downtime
clinical reconciliation MUST be **exercised and measured** before any clinical reliance.
Documented plans, provisioned resources, and passing health checks do not satisfy this.
- **Hazards:** HAZ-0034, HAZ-0025
- **Barrier:** `MIT`
- **Basis:** SOURCE `PROMPT:763`, `PROMPT:879`, `PROMPT:894`; SOURCE `LEGACY-TA:562` ("DR document explicitly describes resources as not yet provisioned… No backup restore evidence")
- **Verification:** executed restore drill with measured RTO/RPO; migration rollback rehearsal; reconciliation report — verifier ≠ migration implementer (`PROMPT:204`)
- **Status:** PROPOSAL · **Owner:** UNASSIGNED — VALIDATION REQUIRED

### SAF-0038 — External notification channels are non-authoritative and authenticated
No external notification channel (SMS, email, pager, push) may be the authoritative
statement of a clinical alert. Every notification MUST be verifiable against the durable
record inside the authenticated application — by an opaque reference the clinician can
open, never by trusting message content. Notifications MUST carry no clinical detail that
would let a clinician act without opening the authoritative view, MUST be authenticated to
the extent the channel permits, and MUST record provider acceptance as **transmission, not
receipt** — a distinct state from displayed-to-a-human (SAF-0016). Clinicians MUST be
trained that an unverifiable alert is not an alert, and the system MUST provide a fast path
to verify one.
- **Hazards:** HAZ-0041, HAZ-0015, HAZ-0018, HAZ-0028
- **Barrier:** `ELIM` (channel cannot carry clinical authority) + `PREV` + `DET`
- **Basis:** SOURCE `PROMPT:121` (non-negotiable rule 9 — real-time/notification output is
  not the clinical system of record), `PROMPT:759`; SOURCE
  `docs/11-security-privacy-compliance/threat-model.md` THR-0041 ("Provider acceptance is
  not human receipt"); INFERENCE — an unauthenticated channel that carries actionable
  clinical content is indistinguishable, to the clinician, from an attacker with the same
  channel
- **Verification:** spoofed-notification test (a fabricated message must be unverifiable
  and must not resolve to a record); test that notification payloads carry no actionable
  clinical detail or PHI; transmission≠receipt state test; human-factors check that
  clinicians actually verify rather than act on the message — **VALIDATION REQUIRED**
- **Status:** PROPOSAL · **Owner:** UNASSIGNED — VALIDATION REQUIRED

### SAF-0039 — Backups are immutable and outside the production blast radius
At least one backup copy of the clinical record, audit evidence, and the keys required to
read them MUST be immutable (write-once, deletion-protected for a declared retention) and
MUST NOT be reachable using production credentials, production network paths, or the same
account/region as production. Restore MUST be exercised **from that isolated copy**, not
only from the convenient one. Key custody MUST survive the loss of the production
environment, and key loss MUST be treated as a data-loss event with a named recovery owner.
- **Hazards:** HAZ-0042, HAZ-0034
- **Barrier:** `PREV` (blast-radius separation) + `MIT`
- **Basis:** SOURCE `PROMPT:763`, `PROMPT:879`; SOURCE
  `docs/11-security-privacy-compliance/threat-model.md` THR-0058 (backups reachable from
  the same credential/network/account — "no immutability, no isolation"), THR-0053 (key
  loss); SOURCE `LEGACY-TA:562` (no restore evidence of any kind existed)
- **Verification:** restore drill executed **from the isolated immutable copy** with
  measured RTO/RPO; negative test that production credentials cannot delete or alter the
  immutable copy; key-custody recovery rehearsal; verifier ≠ implementer (`PROMPT:204`)
- **Status:** PROPOSAL · **Owner:** UNASSIGNED — VALIDATION REQUIRED

### SAF-0040 — Persistent non-evaluation bars admission and triggers retirement review
A pathway MUST NOT be admitted to the portfolio while any of its **required** inputs has no
authoritative, populated, measured source — "profile exists", "table exists", "HTTP 200",
and "query succeeds" are not evidence of population. After admission, the rate of `valid`
(and approved `partial`) evaluations per eligible patient MUST be measured continuously; a
pathway that fails to evaluate for a declared window MUST raise an operational signal, MUST
be surfaced to clinicians as *absent surveillance* rather than as a quiet pathway, and MUST
enter a retirement/re-gating review. Permanent `not_evaluated` is a **defect state, not a
steady state**.
- **Hazards:** HAZ-0043, HAZ-0039, HAZ-0025, HAZ-0030
- **Barrier:** `PREV` (admission bar) + `DET` (habituation breaker)
- **Basis:** SOURCE `PROMPT:414-415` ("A missing authoritative source… makes the input
  ineligible for actionable evaluation"), `PROMPT:417` (at the evidence snapshot, laboratory
  Observation is blocked and no demonstrated general vital-sign feed exists — "Record this
  as a hard portfolio constraint"), `PROMPT:103`; SOURCE
  `pathway-portfolio/g2-validation-backlog.md` §3.3 (PH-10); INFERENCE — a state that is
  always present is a state nobody sees, so permanence itself is the hazard mechanism and
  needs its own detector
- **Verification:** admission gate test (a pathway whose required input lacks measured
  population cannot reach actionable status); evaluation-yield SLI per pathway with a
  declared floor; test that a never-evaluating pathway renders as absent surveillance, not
  as quiet; retirement-review trigger fires
- **Status:** PROPOSAL · **Owner:** UNASSIGNED — VALIDATION REQUIRED

### SAF-0041 — Goals-of-care context gates escalation, and unknown never means unrestricted
Documented goals-of-care and treatment-limitation context MUST be a first-class, provenance-
carrying input to alerting and routing — not an afterthought applied by the responding
clinician. Where such a restriction is recorded, escalation behaviour MUST follow a clinically
approved policy for that patient (suppress, re-route, re-word, or notify a different role)
and the applied policy MUST be visible and audited. **Where the context is absent, stale, or
unverifiable, the system MUST NOT infer "no restriction"** — it MUST mark the care-goal
context explicitly unknown and follow the approved default, which is a clinical decision, not
an engineering default.
- **Hazards:** HAZ-0044, HAZ-0036, HAZ-0022
- **Barrier:** `PREV` + `DET`
- **Basis:** SOURCE `pathway-portfolio/candidate-inventory.md` §5 (PH-12);
  SOURCE `intended-use-statement.md:227-242` (palliative and treatment-limitation
  sub-populations are **neither included nor excluded** — an unresolved intended-use
  boundary, not a settled exclusion); SOURCE `PROMPT:119` (rule 7 — unknown must not be
  coerced to a reassuring default; here the reassuring default would be "escalate freely"),
  `PROMPT:127`
- **Verification:** scenario tests per approved policy branch; negative test that absent
  care-goal context never resolves to "unrestricted"; audit of applied policy; clinician
  and ethics review of the default — **VALIDATION REQUIRED**
- **Clinical dependency:** the policy itself, and the default when context is unknown, MUST
  be set by clinical governance. This agent proposes no default.
- **Status:** PROPOSAL · **Owner:** UNASSIGNED — VALIDATION REQUIRED

### SAF-0037 — Independence is enforced as a process control, not an aspiration
The system of record for safety evidence MUST record, for every control, who implemented it
and who verified/accepted it, and MUST reject a record where those are the same identity.
Rule author ≠ clinical approver; safety-control implementer ≠ safety-case accepter;
security-control implementer ≠ penetration verifier; migration implementer ≠ restore
verifier; release pipeline owner ≠ go-live authority. No agent may occupy any acceptance
role.
- **Hazards:** all — this is the meta-control that prevents the legacy failure mode of a
  documented-but-unverified safety claim (HAZ-0031, HAZ-0019, HAZ-0005)
- **Barrier:** `PREV` + `PROC`
- **Basis:** SOURCE `PROMPT:197-207`; SOURCE `LEGACY-TA:465` ("the validating person/institution is not independently evidenced")
- **Verification:** evidence-record schema constraint rejecting same-identity implement/accept pairs; audit of the safety-case evidence table before G6 and G8
- **Status:** PROPOSAL · **Owner:** UNASSIGNED — VALIDATION REQUIRED

---

## I. Hazard → requirement traceability

Every seeded hazard has at least one candidate control; every requirement has at least one
hazard parent (`safety-plan.md` §8).

| Hazard | Candidate controls |
|---|---|
| HAZ-0001 wrong patient | SAF-0007, SAF-0008, SAF-0009, SAF-0029 |
| HAZ-0002 wrong encounter | SAF-0008, SAF-0009, SAF-0014, SAF-0029 |
| HAZ-0003 wrong tenant | SAF-0007, SAF-0008, SAF-0013, SAF-0026 |
| HAZ-0004 wrong unit/bed | SAF-0009, SAF-0008, SAF-0005 |
| HAZ-0005 missing → zero/normal | SAF-0001, SAF-0002, SAF-0003, SAF-0006, SAF-0019, SAF-0030 |
| HAZ-0006 stale scored as current | SAF-0004, SAF-0005, SAF-0001, SAF-0002, SAF-0025 |
| HAZ-0007 invented timestamp | SAF-0010, SAF-0011, SAF-0028, SAF-0033 |
| HAZ-0008 correction/conflict lost | SAF-0014, SAF-0019, SAF-0023, SAF-0033 |
| HAZ-0009 duplicate input | SAF-0013, SAF-0014, SAF-0016 |
| HAZ-0010 delayed input | SAF-0004, SAF-0011, SAF-0025, SAF-0031, SAF-0033 |
| HAZ-0011 reordered events | SAF-0011, SAF-0014, SAF-0019, SAF-0033 |
| HAZ-0012 lost input | SAF-0012, SAF-0013, SAF-0015, SAF-0033 |
| HAZ-0013 cross-tenant read | SAF-0007, SAF-0008, SAF-0013, SAF-0026 |
| HAZ-0014 fail-open identity | SAF-0007, SAF-0026, SAF-0023, SAF-0013 |
| HAZ-0015 never-displayed alert | SAF-0015, SAF-0016, SAF-0025, SAF-0031 |
| HAZ-0016 duplicated alert | SAF-0013, SAF-0016, SAF-0022, SAF-0017 |
| HAZ-0017 delayed alert | SAF-0016, SAF-0031, SAF-0025, SAF-0015 |
| HAZ-0018 misrouted alert | SAF-0018, SAF-0007, SAF-0016, SAF-0024 |
| HAZ-0019 unsafe rule activation | SAF-0020, SAF-0021, SAF-0019, SAF-0030 |
| HAZ-0020 rollback failure / drift | SAF-0021, SAF-0020, SAF-0024, SAF-0025 |
| HAZ-0021 no-fire opacity | SAF-0019, SAF-0001, SAF-0023, SAF-0030 |
| HAZ-0022 suppression opacity | SAF-0022, SAF-0005, SAF-0023, SAF-0019 |
| HAZ-0023 concurrent conflicting actions | SAF-0017, SAF-0013, SAF-0023, SAF-0018 |
| HAZ-0024 ambiguous responsibility | SAF-0017, SAF-0024, SAF-0016, SAF-0023 |
| HAZ-0025 stale-feed opacity | SAF-0025, SAF-0024, SAF-0005, SAF-0033 |
| HAZ-0026 clock skew / timezone | SAF-0010, SAF-0011, SAF-0012, SAF-0033 |
| HAZ-0027 MPI merge/unmerge | SAF-0029, SAF-0014, SAF-0023, SAF-0009 |
| HAZ-0028 PHI leakage | SAF-0026, SAF-0027, SAF-0023 |
| HAZ-0029 prompt injection / ungrounded text | SAF-0027, SAF-0019, SAF-0026, SAF-0023 |
| HAZ-0030 batch-latency mismatch | SAF-0031, SAF-0035, SAF-0025, SAF-0005 |
| HAZ-0031 false-green gates | SAF-0030, SAF-0019, SAF-0023 |
| HAZ-0032 unknown code/unit coercion | SAF-0028, SAF-0002, SAF-0033 |
| HAZ-0033 partial group action | SAF-0018, SAF-0017, SAF-0005 |
| HAZ-0034 restore/reconciliation failure | SAF-0036, SAF-0024, SAF-0023, SAF-0014 |
| HAZ-0035 incomplete audit | SAF-0023, SAF-0017, SAF-0019, SAF-0026 |
| HAZ-0036 silent intended-use expansion | SAF-0035, SAF-0027, SAF-0020, SAF-0023 |
| HAZ-0037 inaccessible state change | SAF-0034, SAF-0005, SAF-0024 |
| HAZ-0038 absent encounter context | SAF-0009, SAF-0033, SAF-0035, SAF-0001 |
| HAZ-0039 empty/null source as "no findings" | SAF-0002, SAF-0006, SAF-0033, SAF-0035 |
| HAZ-0040 DQ/evaluation-status collapse | SAF-0032, SAF-0001, SAF-0033 |
| HAZ-0041 fabricated alert via spoofed channel | SAF-0038, SAF-0015, SAF-0016, SAF-0023, SAF-0026 |
| HAZ-0042 destructive attack, backups in blast radius | SAF-0039, SAF-0036, SAF-0024, SAF-0023 |
| HAZ-0043 premature admission → permanent `not_evaluated` | SAF-0040, SAF-0035, SAF-0033, SAF-0025, SAF-0006 |
| HAZ-0044 escalation contrary to goals of care | SAF-0041, SAF-0035, SAF-0022, SAF-0017, SAF-0023 |
| HAZ-0045 contaminação de identidade a montante (cross-PJ) | **SAF-0042** (`DET`, compensatório), SAF-0009, SAF-0029, SAF-0008, SAF-0023, SAF-0033 — **preventivo: nenhum controle da V2** |
| HAZ-0046 ausência do rótulo "registro limitado a esta instituição" | SAF-0005, SAF-0034, SAF-0035, SAF-0023 |
| HAZ-0047 tombstone de erasure não aplicado, ou aplicado amplo demais | SAF-0014, SAF-0023, SAF-0026, SAF-0033, SAF-0042 — **nenhum define a semântica de aplicação; ver nota abaixo** |

*(Linhas acrescentadas em 2026-08-15, ciclo 1, pt-BR por `DEC-G0-10`.)*

**Nota sobre HAZ-0047 — lacuna declarada, não disfarçada.** A linha tem filhos `SAF`, logo
não há defeito de análise no sentido de `safety-plan.md` §8. Mas **nenhum deles define o que
"aplicar o tombstone de erasure" significa** — eliminar, bloquear, ou reter sob obrigação
clínica/regulatória. Essa determinação é de `AUTH-PRIVACY-LEGAL` (`UNASSIGNED`, `BLK-0004`),
e **este agente não a autora**: escrever um `SAF` que fixasse a semântica seria fabricar uma
decisão jurídica sob aparência de requisito de engenharia. O `SAF` que falta só pode ser
escrito **depois** da determinação, e a ausência dele é a razão pela qual HAZ-0047 não pode
avançar.

### Single-barrier check (PROPOSAL rule, `safety-plan.md` §6.4)

Every S4/S5 hazard above lists ≥2 candidate controls of differing barrier type, and none
relies on `PROC` alone. SAF-0024 and SAF-0037 include a `PROC` component but are each
paired with `DET`/`PREV` controls. **VALIDATION REQUIRED:** barrier independence is claimed
by construction here and has not been analysed for common-cause failure — that analysis is
owed before G6.

> **Exceção declarada, 2026-08-15 (pt-BR, `DEC-G0-10`) — a regra acima NÃO é satisfeita por
> HAZ-0045.** HAZ-0045 é **S5** e, **do lado da V2**, dispõe apenas de `DET` (SAF-0042).
> SAF-0009/0029/0008 endereçam a resolução de identidade *interna* à V2 e **não alcançam** um
> par falso-positivo decidido a montante, que chega válido pelo contrato. A barreira
> preventiva pertence à governança do índice do ADR-043 e ao parecer jurídico da OS-16 —
> **fora desta organização de software**. Consequências, registradas sem atenuação:
> (i) a frase de abertura desta subseção passa a ter **uma exceção conhecida**, e não deve
> ser citada como se não tivesse; (ii) a exceção **não pode ser fechada por engenharia da
> V2**, apenas por ato humano nomeado sobre a governança do índice; (iii) isto **não é**
> dispensa da regra nem aceitação de risco — é o registro de que o registro de perigos
> precisa poder representar um perigo cujo controle preventivo não pertence a quem o
> registra (`threat-model.md` §12.5.1 item 3).

## J. What this document does not do

It does not implement anything, does not verify anything, and does not accept anything.
No `SAF` requirement here has an owner, an ADR, a contract, a test, or an implementation.
Wave 1 output stops at PROPOSAL.
