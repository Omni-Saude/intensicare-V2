---
id: ADR-0002
title: Deployment-unit strategy — modular-monolith baseline and the criteria required to extract a service
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
      Options, drivers and the *form* of the extraction criteria drafted from prompt
      §9.1 principle 8 and §9.2. NO decision is recorded. No quantitative extraction
      threshold is set, because thresholds require validated SLOs (Gate G1).
date: 2026-08-14
owner: UNASSIGNED — VALIDATION REQUIRED
approvers:
  - UNASSIGNED — VALIDATION REQUIRED   # candidate role: AUTH-PRODUCT
  - UNASSIGNED — VALIDATION REQUIRED   # candidate role: AUTH-OPERATIONS
  - UNASSIGNED — VALIDATION REQUIRED   # candidate role: AUTH-SECURITY (security-boundary extraction rationale)
decision_deadline: UNSET — VALIDATION REQUIRED
deciding_authority_rule: >
  docs/00-governance/decision-rights.md §2, row "Architecture decisions (ADR
  ratification)": AUTH-PRODUCT plus the relevant domain owner per topic — here
  AUTH-OPERATIONS (who carries the operational consequence of the deployment unit) and
  AUTH-SECURITY for any extraction justified by a security boundary. Agents may draft
  options and drivers; agents may not ratify their own ADR proposal.
independence_check: >
  This ADR's author is a preparer and may not approve. Per decision-rights.md §3 pair 7
  (release pipeline owner != go-live authority), the specialist who later owns the build
  and deployment pipeline (ADR-0022) may not be the sole approver of a deployment-unit
  change that their pipeline motivates.
links:
  drivers:
    domain_invariants: [DOM-0001, DOM-0003, DOM-0005, DOM-0006, DOM-0007]
    quality_scenarios: [QAS-0004, QAS-0008, QAS-0009, QAS-0012, QAS-0014, QAS-0015, QAS-0018, QAS-0020, QAS-0021, QAS-0022, QAS-0023, QAS-0024, QAS-0026, QAS-0027]
    risks: ["pending risk register IDs"]
  constrains:
    requirements: ["REQ: pending requirement catalog"]
    clinical: ["CLR: not applicable — this ADR binds no clinical content"]
    safety: [SAF-0008, SAF-0013, SAF-0015, SAF-0016, SAF-0017, SAF-0018, SAF-0019, SAF-0021, SAF-0023, SAF-0024, SAF-0030]
  hazards: [HAZ-0009, HAZ-0012, HAZ-0013, HAZ-0015, HAZ-0016, HAZ-0017, HAZ-0020, HAZ-0021, HAZ-0022, HAZ-0023, HAZ-0025, HAZ-0033]
  tests: ["TST: pending test architecture"]
  validations: ["VAL: pending validation backlog"]
  adrs:
    depends_on: [ADR-0001]
    feeds: [ADR-0010, ADR-0011, ADR-0019, ADR-0021, ADR-0022]
  gates: [G4]
  evidence:
    - INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §9.1 principle 8, §9.2, §9.4, §3 rule 14
    - docs/03-domain/invariants/DOM-invariants.md
    - docs/03-domain/conceptual-model.md
supersedes: null
superseded_by: null
provenance:
  source_repo: intensicare-V2
  path_or_url: docs/06-architecture/adrs/ADR-0002-modular-monolith-and-extraction-criteria.md
  commit_sha_or_version: cb35521 (repo HEAD at authoring; this file is uncommitted)
  section_or_lines: >
    INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §9.1 (lines 549-563), §9.2 (lines 564-578),
    §9.4 (lines 600-614), §3 rule 14, §10 item 2
  date_collected: 2026-08-14
  collector: candidate-architecture and ADR-program engineer (Wave 2)
  transformation: reasoned-from
  confidence: medium
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
---

# ADR-0002 — Deployment-unit strategy: modular-monolith baseline and service-extraction criteria

> **Status: proposed. This document presents options and drivers. It records NO decision.**
> The prompt supplies a *candidate baseline*, explicitly "to test, not blindly adopt"
> (§9's own heading). Reproducing that baseline here is not adopting it.

---

## 1. Context and problem statement

SOURCE (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md` §9, line 547): *"Begin with this candidate
baseline because it addresses the assessment's systemic failures. Ratify or replace each
choice through ADRs."*

SOURCE (§9.1 principle 8, line 561): *"Start as a modular monolith unless independent
scale, security boundary, release cadence, or failure isolation justifies extraction."*

SOURCE (§9.2, lines 576–578): *"Do not split these into network services by default.
Enforce module ownership, dependency direction, schemas, ports, and tests inside one
deployable application. Extract only through an accepted ADR with quantitative trigger,
failure-boundary rationale, operational owner, migration path, and rollback plan."*

**Question.** Does IntensiCare V2 begin as one deployable application containing the
§9.2 bounded contexts as enforced internal modules — and, whichever way that is answered,
what must an extraction proposal *contain* before any module may become a separately
deployed service?

The two halves are separable and both must be answered. The second half is arguably the
more durable: a program can survive starting with the wrong number of deployment units; it
cannot survive extracting them ad hoc, because each ungoverned extraction permanently adds
a network partition to the clinical safety loop.

**Out of scope:**

- Runtime platform, orchestration, region, residency — ADR-0019.
- The event backbone's shape and delivery guarantees — ADR-0010 (a *consequence* of this
  decision, not an input to it).
- Frontend/BFF separation — ADR-0021. A BFF is a distinct question from splitting the
  domain into services; conflating them is a common error and is explicitly avoided here.
- Language, framework, runtime, database product. **This ADR is technology-free by
  construction.** SOURCE (prompt §3 rule 14): no such choice may be inherited from the
  legacy repository.
- The module list itself. §9.2's eleven bounded contexts are the working set; refining
  them is domain work, not a deployment-unit decision.

**Relationship to ADR-0001.** Conditional. Options B and C below are unaffected by the AMH
boundary; but if ADR-0001 were accepted as option (b) — V2 as a module inside the AMH
platform — the deployment unit would be partly determined by AMH's platform conventions
rather than chosen here. This ADR therefore **cannot be accepted before ADR-0001's
direction is known**, though it can be fully drafted and reviewed now.

---

## 2. Evidence and assumptions

### 2.1 Evidence

| # | Label | Statement | Source | Confidence |
|---|---|---|---|---|
| E1 | SOURCE | The candidate baseline is a modular monolith; extraction requires an accepted ADR carrying a quantitative trigger, failure-boundary rationale, operational owner, migration path and rollback plan. | prompt §9.1 p8, §9.2 | high |
| E2 | SOURCE | Eleven bounded contexts are named, and are explicitly module boundaries inside one deployable application, not services by default. | prompt §9.2 | high |
| E3 | SOURCE | The legacy assessment recommends retaining the deterministic safety kernel **rather than** the legacy tenancy/deployment model. | prompt §2, line 74 | high |
| E4 | SOURCE | "Do not choose microservices, Kubernetes, a cloud provider, a database extension, a broker, or an AI model because the legacy repository used it." | prompt §3 rule 14 | high |
| E5 | SOURCE | Commands must be "idempotent, concurrency-safe, authorized, audited, and **transactionally published**" (§9.1 p5), and the candidate topology names a "transactional outbox plus durable broker/stream" (§9.4). | prompt §9.1 p5, §9.4; DOM-0005 | high |
| E6 | SOURCE | "Durability precedes immediacy; projections and real-time views are rebuildable" (§9.1 p6); real-time delivery must derive from durable, replayable state (§3 rule 9). | prompt §9.1 p6, §3 r9; DOM-0006 | high |
| E7 | SOURCE | Tenant and encounter ownership are invariants "from identity through storage, cache, event, query, subscription, and audit" (§9.1 p2). | prompt §9.1 p2; DOM-0001 | high |
| E8 | SOURCE | The deterministic safety kernel must be "isolated from delivery/UI dependencies" (§9.4). **"Isolated" is stated as a dependency property, not a process or network property** — the prompt does not say the kernel must be a separate service. | prompt §9.4 | high |
| E9 | SOURCE | Evaluation must be deterministic, versioned, replayable and independent of UI/infrastructure frameworks (§9.1 p4). | prompt §9.1 p4; DOM-0003 | high |
| E10 | SOURCE | "Prefer reversible decisions and record extraction/revisit triggers" (§9.1 p11). | prompt §9.1 p11 | high |
| E11 | INFERENCE | Rule 14's naming of microservices and Kubernetes suggests the legacy system used at least some of them. That is a reason to require **positive justification** for such choices — not a reason to reject them. Rejecting a technology because legacy used it is the same error as adopting it for that reason. | reasoned from E4 | medium |

### 2.2 Assumptions

To be filed in `docs/00-governance/registers/assumptions-register.md`; **no `ASM` IDs are
minted here** (that register is the minting catalog).

| # | Assumption | Why needed | What invalidates it | Owner |
|---|---|---|---|---|
| A1 | The delivery organization's size, structure and operational maturity are not yet known. | Deployment-unit count is partly a team-topology question; without team facts, any answer is under-evidenced. | Staffing plan and operating model becoming known. | UNASSIGNED — VALIDATION REQUIRED |
| A2 | Load, tenant count, and per-module resource profiles are unknown and unmeasurable before a system exists. | Every "independent scale" argument for extraction is currently unfalsifiable. | Measured load from a pilot (Gate G8) or a validated capacity model. | UNASSIGNED — VALIDATION REQUIRED |
| A3 | The §9.2 bounded-context list is a reasonable working module set. | Extraction criteria are expressed per module. | Domain work materially changing the context boundaries. | UNASSIGNED — VALIDATION REQUIRED |
| A4 | ADR-0001 will not be accepted as option (b). | If it is, the deployment unit is partly AMH's to define. | ADR-0001 accepted as (b). | UNASSIGNED — VALIDATION REQUIRED |

---

## 3. Decision drivers and measurable quality attributes

| # | Driver | Why it discriminates | Measurable quality attribute | Target |
|---|---|---|---|---|
| D1 | **Transactional integrity of the safety loop** — a command must be authorized, applied, audited and its event published in one atomic step (E5, DOM-0005) | In one deployable unit with one transactional store this is a local transaction plus an outbox. Split across services it becomes a distributed-consistency problem with compensations. This is the sharpest technical discriminator. | QAS-0021, QAS-0004 | VALIDATION REQUIRED |
| D2 | **Failure isolation / blast radius** | The stated justification for extraction (E1). More units = smaller blast radius per unit, but more partitions inside the clinical loop, each a new failure mode. Both directions carry safety consequences and neither is free. | QAS-0023 | VALIDATION REQUIRED |
| D3 | **Independent scale** | An explicit extraction justification (E1). Currently unfalsifiable (A2) — no measured per-module resource profile can exist before the system does. | QAS-0008, QAS-0009 | VALIDATION REQUIRED |
| D4 | **Security boundary enforceability** | An explicit extraction justification (E1). Some boundaries (e.g. key custody, PHI-handling isolation) may be more credibly enforced across a process/network boundary than within one; others (tenant scoping, E7/DOM-0001) are enforced identically either way and are *harder* to keep invariant across more hops. | QAS-0014, QAS-0018 | VALIDATION REQUIRED (Gate G6) |
| D5 | **Independent release cadence** | An explicit extraction justification (E1). Note the counter-pressure: clinical rule bundles are versioned release artifacts with their own approval chain (§6.4) — cadence independence may be achievable through *artifact* versioning rather than *deployment* separation. | QAS-0026 | VALIDATION REQUIRED |
| D6 | **Deterministic replay integrity** (E9, DOM-0003) | Replay must reproduce a historical evaluation exactly. Distributing the evaluator's inputs across services introduces ordering, clock and partial-failure variables into a computation that must be byte-identical on replay. | QAS-0020 | VALIDATION REQUIRED |
| D7 | **Operational capability and cost** | Each additional deployment unit adds on-call surface, deployment topology, observability cost, and a restore/DR path. A4/A1: the operating organization's capacity is unknown. | QAS-0015, QAS-0012 | VALIDATION REQUIRED |
| D8 | **Reversibility and exit cost** (E10) | Merging services back is generally cheaper than splitting a monolith badly, but both are costly. Cheapest of all is a monolith whose module boundaries are *enforced* — extraction then becomes mechanical. This makes **boundary enforcement** a driver in its own right. | QAS-0024, QAS-0027 | VALIDATION REQUIRED |
| D9 | **Evidence availability for the decision itself** | Options differ in how much evidence they require *before* being chosen. Choosing a distributed topology now commits to unfalsifiable claims about scale and isolation (A2). | n/a — meta-driver | n/a |

---

## 4. Alternatives considered

### Option A — Modular monolith with enforced boundaries (the prompt's candidate baseline)

**Description.** One deployable application containing the §9.2 bounded contexts as
modules. Enforcement is **mechanical, not cultural**: module ownership, allowed dependency
direction, per-module schemas/ports, and per-module tests, with an automated check that
fails the build on a boundary violation. Extraction is possible later and is governed by
§5.2's criteria.

**Against the drivers.** D1 strongest (local transaction + outbox); D6 strongest
(single-process deterministic evaluation); D7 lowest operational surface; D8 best *if and
only if* enforcement is real; D2 weakest (one process = one blast radius); D3 weakest
(cannot scale one module independently); D4 mixed — tenant invariance is easiest here,
key-custody isolation is not.

**Positive consequences.** The safety loop's atomicity is a local property; deterministic
replay has no distributed-ordering variables; one restore path; one audit store; the
smallest set of things that can be partially down; module boundaries can be *tested*
rather than assumed; matches E3's warning against inheriting the legacy deployment model.

**Negative consequences.** A single resource-exhaustion or memory fault takes the whole
system down, including the safety loop — which for a clinical system is a hazard requiring
an explicit degraded-mode answer (DOM-0007); no independent scaling; one release cadence
for eleven contexts, which becomes a coordination cost as the team grows; "modular
monolith" degrades to "monolith" within one or two releases if the boundary checks are
advisory rather than blocking — and prompt §13 rule 13 forbids relying on advisory gates
for anything that matters.

**What would have to be true.** Boundary enforcement is automated and build-blocking from
the first commit; the operating organization can accept a single blast radius for the
initial scope; no security boundary in the initial scope demands process isolation.

**Exit cost if later reversed.** Low-to-moderate *if* boundaries were enforced; high if
they were not — which is precisely the failure mode this option must be designed against.

**Variant A2 — modular monolith with the deterministic safety kernel as a separate
process.** E8 requires the kernel to be *isolated from delivery/UI dependencies*, which is
a dependency-direction property satisfiable in-process. This variant additionally isolates
it at runtime. *Positive:* rule evaluation cannot be starved by UI/delivery load; the
kernel's attack surface and its release cadence (D5) can be governed separately, which
matters because rule bundles are signed release artifacts. *Negative:* introduces a network
hop into the evaluation path, adding a partial-failure mode and complicating D1/D6; needs
its own availability target. Listed as a variant, not a sub-option, because it is a
one-boundary refinement of A rather than a different strategy.

### Option B — Microservices-first

**Description.** The §9.2 bounded contexts (or a subset) are separately deployed services
from the outset, each with its own store and release cycle, communicating over the network.

**Against the drivers.** D2 and D3 strongest by construction; D4 strongest for boundaries
that genuinely need process isolation; D1 weakest (distributed transactions or
compensations inside the clinical command path); D6 weak (ordering and partial failure
enter the evaluation path); D7 highest operational cost; D9 weakest — it commits now to
scale and isolation claims that A2 says cannot yet be evidenced.

**Positive consequences.** Failure and security boundaries are physical; independent scale
and cadence per context; forces interface discipline early; team-scaling story is clear if
the organization is large.

**Negative consequences.** Every clinical command that must be atomic (E5) becomes a
distributed-consistency problem, and the failure mode is precisely the one the legacy
assessment flagged — a command that appears to succeed while its safety-relevant effect
did not publish; tenant/encounter invariance (E7) must be re-proved at every hop, and
every hop is a place it can be dropped; deterministic replay must reconstruct a
distributed input ordering; operational cost is multiplied before there is any measured
need; **prompt §3 rule 14 explicitly forbids choosing this because the legacy repository
did** — so this option requires positive, measured justification that A2 says does not yet
exist.

**What would have to be true.** Measured per-module scale divergence, or a security
boundary that cannot be enforced in-process, or an organization already structured around
independent service teams — and a distributed-transaction strategy that preserves DOM-0005
and DOM-0003.

**Exit cost if later reversed.** High — consolidating services means merging stores,
schemas, and operational histories.

### Option C — Serverless-first

**Description.** Functions-as-a-service for command handling, evaluation, projections and
delivery, with managed stores and managed event transport.

**Against the drivers.** D3 strong (elastic scale without capacity planning); D7 mixed
(low infrastructure operations, high platform-specific expertise); D1 weak (transaction +
outbox semantics depend heavily on the managed store's guarantees); D6 weak-to-mixed (cold
starts and at-least-once invocation put retry/duplicate semantics directly into the
evaluation path — survivable only if evaluation is rigorously idempotent, which DOM-0005
requires anyway); D8 **weakest of all options** — managed-service dependence and exit cost
are a named evaluation criterion in prompt §9.4.

**Positive consequences.** No server operations; elastic cost; forces idempotency and
statelessness, both of which the domain requires regardless.

**Negative consequences.** Deep coupling to one provider's transactional, ordering and
identity semantics, which prompt §9.4 requires to be evaluated against portability and
exit cost; execution-time and payload limits sit awkwardly with replay and backfill;
residency and processor terms (LGPD) become provider-determined (ADR-0019, ADR-0017);
observability and deterministic replay of a function fleet is materially harder;
**selecting it now would also be a de facto cloud-provider choice**, which this ADR has no
authority to make and prompt §3 rule 14 constrains.

**What would have to be true.** A provider decision already made on independent grounds
(ADR-0019); measured workload spikiness; an accepted exit-cost position.

**Exit cost if later reversed.** High and provider-specific.

### Option Z — Defer / do nothing

**Description.** Record no deployment-unit stance. Build the domain modules with enforced
boundaries and postpone the packaging question until Gate G7's vertical slice forces it.

**Positive consequences.** No premature commitment; the boundary-enforcement work — which
every option needs — proceeds regardless; consistent with D9.

**Negative consequences.** "No stance" is not neutral in practice: the first deployable
artifact anyone builds becomes the de facto answer, chosen by whoever was implementing
that week rather than by an authority; the extraction criteria (§5.2) — the durable half of
this ADR — would also be deferred, leaving ad-hoc extraction ungoverned in the meantime.

**Cost of delay.** Low until Gate G7; the missing extraction criteria are a cost from the
moment a second team starts work.

### 4.1 Comparison against drivers

| Driver | A — modular monolith | A2 — + kernel process | B — microservices-first | C — serverless-first | Z — defer |
|---|---|---|---|---|---|
| D1 transactional integrity | Strongest | Strong, one hop added | Weakest | Weak (store-dependent) | Unresolved |
| D2 failure isolation | Weakest | Kernel isolated | Strongest | Strong | Unresolved |
| D3 independent scale | Weakest | Kernel scales separately | Strongest | Strongest | Unresolved |
| D4 security boundary | Mixed | Kernel surface reduced | Strongest where process isolation is needed | Provider-dependent | Unresolved |
| D5 release cadence | One cadence | Kernel cadence separable | Per service | Per function | Unresolved |
| D6 replay determinism | Strongest | Strong | Weak | Weak-mixed | Unresolved |
| D7 ops capability/cost | Lowest surface | +1 unit | Highest | Lowest infra, highest platform expertise | Unresolved |
| D8 reversibility/exit | Best if boundaries enforced | Similar | High cost | Highest cost | Preserved |
| D9 evidence available now | Requires least | Requires least+ | Requires evidence that does not exist (A2) | Requires a provider decision not yet made | n/a |

---

## 5. Decision and scope

> **NO DECISION IS RECORDED.**
>
> Neither the deployment-unit strategy nor the extraction thresholds are decided here. The
> prompt's candidate baseline (option A) is reproduced because §9 instructs that it be
> *tested*, and its presence must not be read as adoption. Filling this section is reserved
> to the deciding authority in the front matter.

### 5.1 Conditions that must be satisfied before this ADR can be accepted

| # | Condition | Owner | Evidence that would close it | Status |
|---|---|---|---|---|
| C1 | ADR-0001's direction is known (specifically, whether option (b) is live). | `AUTH-DATA-PLATFORM` | ADR-0001 accepted, or option (b) formally excluded. | **OPEN** |
| C2 | Named `AUTH-PRODUCT` and `AUTH-OPERATIONS` decision owners exist. | Gate G0 | `authority-model.md` populated. | **OPEN** |
| C3 | Delivery-organization size, structure and operational capability are known (A1). | `AUTH-OPERATIONS` | Staffing and operating model. | **OPEN** |
| C4 | Quality-attribute targets exist for at least D1, D2 and D7 (Gate G1 validated needs). | `AUTH-CLINSAFETY` + `AUTH-OPERATIONS` | Targets in `../quality-attributes/quality-attribute-scenarios.md` no longer read `VALIDATION REQUIRED`. | **OPEN** |
| C5 | A boundary-enforcement mechanism is specified and is **build-blocking**, not advisory (prompt §3 rule 13). | Implementer + `AUTH-SECURITY` | An automated check that fails on a module-boundary violation, and a test proving it fails. | **OPEN** |

### 5.2 Extraction criteria — the required contents of any future extraction ADR

SOURCE (prompt §9.2): extraction happens "only through an accepted ADR with quantitative
trigger, failure-boundary rationale, operational owner, migration path, and rollback plan."

PROPOSAL — this ADR proposes the **form** those five elements must take. It sets no
threshold values: a quantitative trigger without a validated SLO to breach is a number
invented to justify a preference, and prompt §15.3 requires SLOs to come from validated
user/safety needs (Gate G1). **This is the half of this ADR most likely to be durable
regardless of which option is chosen — Options A, A2, B and C all need governed extraction
(or consolidation) criteria.**

| # | Required element | What the extraction ADR must contain | What is NOT acceptable |
|---|---|---|---|
| X1 | **Quantitative trigger** | A named, already-measured metric; the SLO or budget it breaches; the measurement window and environment; the percentile; the observation period showing the breach is sustained, not spiky; and why no in-process remedy resolves it. | "It will not scale"; a projection with no measurement; a single incident; a synthetic benchmark that does not correspond to a validated need; a threshold invented in the same document that cites it. |
| X2 | **Failure-boundary rationale** | Which failure is being isolated; its current blast radius; the blast radius after extraction; the **new** failure modes the network partition introduces (timeout, partial failure, duplicate delivery, ordering, split-brain); how each new mode is detected and degraded (DOM-0007); and the net safety argument, not just the isolation claim. | "Microservices are more resilient"; an isolation claim that ignores the failure modes extraction adds. |
| X3 | **Operational owner** | A named accountable role for the new unit: on-call, SLOs, capacity, upgrades, restore rehearsal, incident command, and its own runbook. Confirmation that the owner has accepted the load. | An unowned service; "the platform team" without a named accountable role; an owner who has not been consulted. |
| X4 | **Migration path** | How state moves (or is split); how tenant/encounter ownership stays invariant across the move (DOM-0001); how in-flight commands, outbox entries and unacknowledged alerts are handled; how deterministic replay of pre-migration evaluations remains possible (DOM-0003); how the audit chain stays continuous and verifiable (DOM-0002); expand/contract sequencing; and the dual-run/verification plan. | A cutover with no dual-run; a migration that breaks historical replay; an audit chain with a gap. |
| X5 | **Rollback plan** | The trigger to roll back; who may invoke it and within what time; how state written to the extracted unit is reconciled back; the maximum data-loss window; the clinical fallback while rolling back; and evidence that the rollback has been **rehearsed**, not merely written. | An untested rollback; "revert the deployment" as a state-migration plan. |
| X6 | **Additional, proposed by this ADR** | Which quality-attribute scenarios the extraction is expected to improve, with the **measurement plan that will confirm or refute it after the fact**; and a revisit date at which the claimed improvement is checked. | Extraction whose benefit is never measured — the most common way an architecture accumulates unjustified services. |

The same six elements should govern the reverse move (**consolidating** two units into
one), which is a real and under-planned operation.

---

## 6. Consequences

Consequences of this ADR existing in `proposed` state:

### 6.1 Positive

- The deployment-unit question is explicit rather than settled by the first person to write
  a deployment manifest.
- The extraction criteria (§5.2) are usable **immediately** as a review checklist, whatever
  is later decided — they do not depend on which option is chosen.
- The tension between D1/D6 (favouring fewer units) and D2/D3/D4 (favouring more) is
  recorded as a genuine tension rather than resolved by preference.

### 6.2 Negative

- Deferring the packaging question leaves an ambiguity that implementation pressure will
  resolve by default (Option Z's negative consequence applies to the current state).
- Boundary-enforcement work (C5) is needed under every option, but without an accepted ADR
  it has no owner and may not be funded — and an unenforced module boundary is the failure
  mode that makes option A degrade and option B's later consolidation expensive.

### 6.3 Neutral / structural

- Nothing here selects a language, framework, runtime, database, broker, orchestrator or
  cloud provider. Any reading of this ADR as implying one is a misreading.

---

## 7. Cross-cutting implications

| Dimension | Implication | Label | Owner role | Follow-up ID |
|---|---|---|---|---|
| Clinical safety | The deployment unit determines the safety loop's atomicity (D1) and the blast radius of a single failure (D2). Under every option, a partially failed command must never appear to have succeeded (DOM-0005) and degraded mode must be explicit and clinician-visible (DOM-0007). **HAZ-0015 and HAZ-0020 are the hazards this ADR most directly bears on**, and both are process-topology hazards: the hazard log records the predecessor's process-local fan-out losing broadcasts across processes/pods so an alert was generated but never displayed, and multiple runtime instances holding different active rule versions. Adding deployment units without X1–X6 discipline reproduces exactly these. | INFERENCE from E5, E6 | `AUTH-CLINSAFETY` | HAZ-0015, HAZ-0020, HAZ-0012, HAZ-0016, HAZ-0017, HAZ-0023; SAF-0015, SAF-0021, SAF-0017 |
| Security | More units means more authenticated hops, each of which must re-establish trusted identity and tenant context — and each is a place DOM-0001 can be dropped. Fewer units means one process holding more privilege, which raises the value of in-process isolation and key custody. | INFERENCE from E7 | `AUTH-SECURITY` | ADR-0016, ADR-0017 |
| Privacy | Each unit that handles PHI expands the surface over which minimization, retention and audit must be enforced, including its logs, traces, caches and backups. | INFERENCE | `AUTH-PRIVACY-LEGAL` | ADR-0017, ADR-0018 |
| Interoperability | Not directly affected — external contracts (FHIR, HL7, AMH, API) should be identical under every option. **If an external contract's shape would change with the deployment unit, that is a design smell**: the contract is leaking internal topology. | INFERENCE | `AUTH-DATA-PLATFORM` | ADR-0012, ADR-0013 |
| Accessibility | No direct implication. Indirect: more partitions produce more partial-failure states, and every additional visible degraded state must be announced accessibly and non-color-only (prompt §11). | INFERENCE | `AUTH-UX` | ADR-0021 |
| Operational | Directly determines on-call surface, deployment topology, observability cost, DR complexity and restore paths (D7). Each unit needs its own readiness semantics representing *safe capability*, not process liveness (§15.3). | INFERENCE | `AUTH-OPERATIONS` | ADR-0019, ADR-0020 |
| Cost | Infrastructure, observability and operational-labour cost scale with unit count. No cost model exists; none is invented here. | VALIDATION REQUIRED | `AUTH-PRODUCT` | pending |
| Migration | Extraction is a state migration with clinical-record and audit-continuity obligations (X4), never a redeploy. Reversing an extraction is equally a migration. | INFERENCE | `AUTH-OPERATIONS` | ADR-0023 |

---

## 8. Reversibility, revisit triggers, kill/rollback

### 8.1 Reversibility assessment

| Option | Reversibility | What is stranded | Label |
|---|---|---|---|
| A | High **if** boundaries are enforced; low if they are not — enforcement is the entire reversibility argument | Nothing structural, if extraction was anticipated at the module boundary | INFERENCE |
| A2 | High for the kernel boundary; same as A elsewhere | The kernel's transport contract | INFERENCE |
| B | Low — consolidation means merging stores, schemas and operational histories | Per-service infrastructure and operational history | INFERENCE |
| C | Lowest — provider-specific semantics permeate the code | Provider-coupled implementation and operational tooling | INFERENCE |
| Z | n/a | n/a | INFERENCE |

### 8.2 Revisit triggers

| # | Trigger | Detection | Notify | Action |
|---|---|---|---|---|
| T1 | A sustained, measured SLO breach attributable to one module's resource profile. | QAS-0008, QAS-0009 + per-module telemetry | `AUTH-OPERATIONS` | Open an extraction ADR meeting X1–X6 |
| T2 | A security boundary is identified that provably cannot be enforced in-process. | Threat model (Gate G6) | `AUTH-SECURITY` | Open an extraction ADR; X2 must carry the security rationale |
| T3 | Release-cadence conflict between contexts becomes a measured delivery cost. | Delivery metrics | `AUTH-PRODUCT` | Evaluate artifact-level versioning (D5) **before** deployment separation |
| T4 | A single-process failure causes a clinically significant outage of the safety loop. | Incident record | `AUTH-CLINSAFETY` | Re-open D2; consider A2 or targeted extraction |
| T5 | A module-boundary violation reaches the main branch. | Build-blocking boundary check (C5) | Module owner | Fix immediately — this is the leading indicator that option A is degrading |
| T6 | ADR-0001 accepted as option (b). | ADR-0001 | `AUTH-PRODUCT` | Re-open: the deployment unit becomes partly AMH's to define |
| T7 | Delivery-organization size or structure changes materially (A1). | Operating model | `AUTH-PRODUCT` | Re-evaluate D7 and D5 |

### 8.3 Kill switch / rollback strategy

Nothing to kill while `proposed`. Standing constraint until accepted: **no module may be
extracted into a separately deployed service without an ADR satisfying §5.2 X1–X6.** An
extraction that appears in a pull request without such an ADR is a review-blocking defect,
and reviewers should treat "we can write the ADR afterwards" as a rejection.

On acceptance, the chosen option must define: for A/A2, what happens when the single unit
(or the kernel) is unavailable — the clinician-visible degraded mode and manual fallback;
for B/C, per-unit kill switches and the safety-loop behaviour when any one unit is down.

---

## 9. Validation method and linked evidence

| # | Claim | Validation method | Environment | Linked IDs |
|---|---|---|---|---|
| V1 | Module boundaries are actually enforced, not aspirational. | Automated dependency/boundary check in CI that **fails the build**, plus a deliberately violating fixture proving the check fires. | CI | QAS-0024; SAF-0030; TST: pending test architecture |
| V2 | Safety-relevant commands are atomic with their published events. | Outbox crash-point tests: kill between commit and publish, assert no lost or duplicated effect. | Test environment | QAS-0021; DOM-0005; HAZ-0009, HAZ-0012, HAZ-0023; SAF-0013, SAF-0015, SAF-0017 |
| V3 | Deterministic replay reproduces historical evaluations exactly under the chosen topology. | Replay tests over a recorded corpus; mutation tests against the evaluator. | Test environment | QAS-0020; DOM-0003; HAZ-0020, HAZ-0021; SAF-0019, SAF-0021 |
| V4 | Projections and real-time views are rebuildable from durable state. | Destroy and rebuild projections; compare against a reference; measure rebuild time. | Test environment | QAS-0009, QAS-0022; DOM-0006; HAZ-0015, HAZ-0017; SAF-0015, SAF-0016 |
| V5 | Tenant/encounter ownership survives every hop the chosen topology introduces. | Adversarial cross-tenant tests at each boundary. | Test environment | QAS-0018; DOM-0001; HAZ-0003, HAZ-0013; SAF-0007, SAF-0008 |
| V6 | Degraded mode is explicit and clinician-visible when a unit is unavailable. | Fault injection per unit + human-factors validation. | Test + usability environments | QAS-0023; DOM-0007; HAZ-0024, HAZ-0025; SAF-0024, SAF-0025; VAL: pending validation backlog |
| V7 | Any future extraction delivered its claimed improvement. | The X6 measurement plan, executed after the revisit date. | Production-like | QAS: per extraction ADR |

---

## 10. Supersession relationships

- **Supersedes:** none.
- **Superseded by:** none.
- **Relationship notes:** individual extraction ADRs do **not** supersede this one — they
  are governed *by* it and must cite it. Only a change to the baseline strategy itself, or
  to the §5.2 criteria, supersedes this ADR.

---

## 11. Self-check against the template's completeness gate

All sections present; four alternatives plus a variant plus defer; each with positive and
negative consequences; drivers discriminating and mapped to quality-attribute scenarios;
**no numeric threshold invented** — §5.2 X1 explicitly refuses to set one; all eight
cross-cutting rows present; reversibility, triggers, kill/rollback present; validation
methods with honest placeholders; supersession present; **no technology selected**; no
approval fabricated; `adr-index.md` updated in the same change.
