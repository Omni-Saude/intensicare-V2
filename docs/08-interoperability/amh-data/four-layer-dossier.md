---
doc_id: AMH-FOUR-LAYER-DOSSIER
status: PROPOSAL
owner: UNASSIGNED — VALIDATION REQUIRED
source: Omni-Saude/amh-data-platform @ 0a07a6f1fab36fb2f5eeee0fcd8e945c95f67116 (pinned evidence snapshot, main); INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §2 and §7.1
date_collected: 2026-08-14
collector: AMH-data compatibility architect
last_updated: 2026-08-14
---

# AMH×IntensiCare — Four-Layer Evidence Dossier

**Scope.** Evidence layers per orchestrator prompt §7.1, assessed at the pinned AMH evidence snapshot.

**Pinned evidence snapshot.** `Omni-Saude/amh-data-platform@0a07a6f1fab36fb2f5eeee0fcd8e945c95f67116` (`main`). Verified 2026-08-14 to be the current `main` HEAD — no drift at verification time.

**Companion documents.** Per-claim verification with verbatim quotes and blob SHAs is in [`claim-verification-matrix.md`](./claim-verification-matrix.md). The classification argument is in [`compatibility-finding.md`](./compatibility-finding.md). Candidate interfaces are in [`contract-inventory.md`](./contract-inventory.md). Questions for AMH owners are in [`open-questions-for-amh-owners.md`](./open-questions-for-amh-owners.md). The draft pin is [`contracts.lock.draft.yaml`](./contracts.lock.draft.yaml).

---

## 0. The rule this dossier exists to enforce

> **Passing an earlier layer never implies passing a later layer.** (prompt §7.1)

| Layer | Question it answers | Evidence available this cycle |
|---|---|---|
| **1. Declared contract** | What does AMH say its interfaces are? | **Substantial** — 17 files read at the pinned commit |
| **2. Deployed capability** | Is a described interface reachable and authorized in a named environment? | **NONE** |
| **3. Populated data** | Do representative tenants have non-empty resources with meaningful field distributions? | **NONE OBSERVED.** AMH's own documentary claims exist and are recorded as SOURCE |
| **4. Operational fitness** | Measured latency, completeness, ordering, correction, availability, replay, recovery | **NONE** |

This cycle had **no environment access, no credentials, and no network calls to any AMH runtime.** The only actions taken were read-only GitHub API calls against a pinned commit. Layers 2 and 4 are therefore **entirely unevidenced**, and Layer 3 contains **zero OBSERVED entries**.

### The single most important epistemic distinction in this dossier

AMH's repository states, in its own documents, that 11,451,908 FHIR resources exist, that 52,452 clinical rows reference absent encounters, and that 21 Gold tables are empty. **These are SOURCE claims — AMH asserting facts about its own data.** This specialist read the *documents* (OBSERVED); it did not read the *data* (not observed).

A SOURCE claim about population is not Layer 3 evidence. It is Layer 1 evidence *that a claim was made*. Treating "the repository says 11.4M resources exist" as "11.4M resources exist" is precisely the error the AMH Gold sweep documents its own author committing — `eu li o esquema e afirmei conteúdo` ("I read the schema and asserted content", `docs/status/varredura-de-vazios-na-gold-2026-08-13.md` L127). This dossier declines to repeat it.

---

## Layer 1 — Declared contract

*schema, profile, API/event specification, manifest, ADR and owner*

### What IS established at the pinned commit

**OBSERVED — a FHIR Implementation Guide exists and is internally coherent.**
Package `br.com.americashealth.fhir`, version `1.0.0`, FHIR R4 `4.0.1`, status `active`. Canonical URL `https://fhir.americashealth.com.br/ImplementationGuide/amh`. Nineteen profile StructureDefinitions at the package root, plus extensions, NamingSystems, CodeSystems, ValueSets and SearchParameters. This is a real IG, not a stub.

**OBSERVED — exactly one Observation profile exists, and it is structurally laboratory-only.**
`Observation-amh-laboratory` (v1.0.0) requires `subject` (1..*), `effective[x]` (1..*), `status` (1..*), `code` (1..*, bound to ValueSet `amh-loinc-laboratory`), and **pattern-fixes** `category` to `http://terminology.hl7.org/CodeSystem/observation-category#laboratory`. `valueQuantity.system` is fixed to `http://unitsofmeasure.org`. It additionally requires two extensions the orchestrator snapshot did not name: `extension:mpiId` (1..1) and `extension:tenantId` (1..1). `Observation.encounter` is **optional**.

*Consequence (INFERENCE):* because `category` is pattern-fixed, a conformant instance **cannot** carry a vital-sign category. The IG does not merely lack vital-sign coverage — it structurally excludes vitals from its only Observation profile. Vital signs would require a **new profile**, not a reuse.

**OBSERVED — the FHIR producer architecture is decided, documented, and batch-first.**
ADR-040 (`Accepted`, 2026-07-25) makes Bronze Iceberg the source for the FHIR channel via a batch adapter (Athena → R4 mapping → idempotent PUT into HAPI), with Flink/CDC parked. It states plainly: `o canal FHIR **não é near-real-time** enquanto o CDC estiver parqueado`. Ingestion is watermark-incremental.

**OBSERVED — tenant isolation at the FHIR layer is specified with unusual rigor.**
`applications/hapi-fhir/config/partitioning-config.md` establishes URL-based tenant identification (`UrlBaseTenantIdentificationStrategy`, registered by the mere presence of the `partitioning` block), a mandatory equality check between the token's tenant claim and the URL tenant (`nega quando divergem`, and denies when the URL carries no tenant), rejection with 403 of client-supplied `X-Partition-Name` / `X-Request-Partition-IDs`, and `allow_references_across_partitions: false`. The document also **retracts five configuration keys it previously documented** that Spring silently ignored.

**OBSERVED — a mature contract-publication pattern exists and has been exercised once.**
`schemas/contracts/maezo/v1/contract-manifest.yaml` demonstrates: pinned producer commit, per-artifact SHA-256 digests, frozen 28-field envelope with fixed field order, `BACKWARD` compatibility mode, 9 fixtures (3 deliberately invalid), per-artifact PHI/security classification, a 4-role approval record, a compatibility report with dry-run and evidence IDs, and Glue Schema Registry version IDs. **This is the single most reusable asset AMH offers V2** — as a *pattern*, not as an interface.

**OBSERVED — a read-only, purpose-bound, fail-closed context API is specified.**
`subject-context.openapi.yaml` (v1.0.0): four GET operations keyed by opaque `portable_subject_ref`, requiring `purpose_of_use`, returning 403 with an explicit reason when consent is absent. Its response sections are a **closed enum** — `[encounters, conditions, coverage]`. Observations are structurally absent, not merely unimplemented.

**OBSERVED — a data-quality vocabulary is closed and defined.**
`CodeSystem-amh-data-quality-status` v1.0.0, `content: complete`, `count: 3`: `valid | warning | quarantined`, scoped to the Silver-Rules `_dq_status` column.

**OBSERVED — an OAuth2/JWT/SMART-scope authorizer exists as code with tests.**
`applications/lambdas/lambda-authorizer-fhir/` — JWKS validation, required `exp`/`iss`/`aud`/`sub`/`tenant`/`scope` claims, per-verb SMART scope matching, mandatory never-defaulted `tenant` claim, method-ARN-scoped Allow, explicit fail-closed Deny, four test modules.

### What is VALIDATION REQUIRED at Layer 1

**Three contradictions are recorded and deliberately unresolved.** Resolving them is an AMH-owner act, not an analyst's.

| # | Contradiction | Side A | Side B | Side C |
|---|---|---|---|---|
| **C-1** | **Vital signs** | Diagrams: `EVOLUCAO_PACIENTE → Observation para sinais vitais`; `Observation ✅ (sinais vitais de dispositivos IoT)` | IG: one Observation profile, category pattern-fixed to `laboratory`; no vital-signs profile among 19 | — |
| **C-2** | **Authentication** | CapabilityStatement (2026-05-10): `OAuth` + `SMART-on-FHIR`, Cognito + IAM Identity Center | HAPI README: `mTLS para serviços internos`; SMART `(futuro)` | **Found this cycle:** implemented `lambda-authorizer-fhir` enforcing OIDC JWT + SMART scopes |
| **C-3** | **Manifest status** | README L176: manifest is `status: UNPUBLISHED`, registry/version IDs null | The manifest file itself: `status: PUBLISHED`, registry `amh-fhir-dev`, three populated UUIDs, `evidence_id` set | — |

Contextual observations offered *without* adjudication: the vital-sign diagram is dated `Versão 1.0 | Maio 2026` and describes the CDC path that ADR-040 (2026-07-25) replaced; the C-1 diagrams are also self-inconsistent (the C4 component's own mapper list shows `EVOLUCAO_PACIENTE → ClinicalImpression` with no Observation branch, contradicting its own table two sections later); and the README anticipates C-3 with `Esta linha envelhece rápido — confira ao vivo antes de agir`. **None of this resolves anything.** Chronology is not authority.

**A fourth contradiction found this cycle, not in the orchestrator snapshot (C-4).** The Observation unblocking plan of record (`docs/reference/fhir-observation-source-request.md` L45–54) would emit `Observation.code = {text: "Resultado de exame"}` and `Observation.valueString = ds_resultado` — free text and a string payload. That **does not conform** to the profile verified above, which binds `code` to a LOINC ValueSet and fixes UCUM on `valueQuantity`. The same document identifies the conformant path (Diagnose/LIS structured results) as `Maior esforço` and unscheduled. **VALIDATION REQUIRED:** "Observation unblocked" must not be read as "numeric, coded, unit-bearing lab values." A numeric threshold rule cannot consume a `valueString`.

**Further Layer 1 gaps:**

- **Canonical principles file not read.** `docs/architecture/principles.md` designates itself derived and points to `architecture/principles.md` (unread) and SAD §5. Its outbound links use a `github.com/amh/amh-data-platform` URL that is not the real repository path.
- **ADR-006 and ADR-039 not read** — deliberately, per write-scope; identity adjudication belongs to the Wave 2 specialist.
- **No AMH×IntensiCare contract exists.** `schemas/contracts/` holds `maezo/` and `source-authority/` only. Verified by full-tree enumeration (3,685 entries).
- **No MCP material in the active tree** (zero path matches, zero code-search hits). MCP is a new V2 interface requiring its own ADR — not inherited compatibility.
- **License is `NOASSERTION`.** Code-reuse licensing and ownership (prompt §7.1) is unresolved.
- **Reconnaissance is incomplete against the full §7.1 checklist.** Not established this cycle: pagination, rate limits, quotas, retries, idempotency and concurrency semantics for any read interface V2 would use; merge/unmerge, correction, deletion, discharge, deceased and backfill behavior; timezone, precision, clock-skew, late-arrival and ordering semantics; residency, retention and de-identification expectations; sandbox and test-fixture availability for a non-Maezo consumer; deprecation and change-notification process. These are Layer 1 questions that further document reading may partly answer.

### Layer 1 verdict

**Substantially established, with four recorded contradictions and material gaps.** A declared FHIR contract exists and is real. It declares **no vital-sign capability** and **one laboratory Observation profile whose declared source the repository says is not ingested**.

---

## Layer 2 — Deployed capability

*environment-specific discovery/configuration and reachable authorized interface*

### What IS established

**Nothing. This layer has no evidence in this cycle.**

No environment was accessed. No endpoint was contacted. No token was obtained, and none would have been appropriate to obtain. No `/metadata` document was retrieved from any running server. No partition was enumerated. There is **no OBSERVED evidence of any kind** at this layer.

### What the declared layer says about deployment — SOURCE, not evidence

These are AMH's own statements, recorded because they bound what Layer 2 verification could even find:

- **SOURCE:** `1 de 4 provisionado. Só `dev` existe — `stg`, `prod` e `dr` custam US$ 0,00 e não têm tfstate` (README L8). Corroborated by README L28: `Hoje **nada está** [em produção] — só o ambiente `dev` existe.`
- **SOURCE:** Tier 0 NFR targets (RPO < 15 min, RTO < 1h, 99.95% FHIR API) are `alvo declarado, não SLA medido em produção: não há produção` (README L13).
- **SOURCE:** the SAD is `Status: Draft for Internal Review` (README L9).
- **SOURCE:** HAPI partition bootstrap `não está implementado`; `PartitionInitializer` does not exist; consequently `as partições não são criadas por este servidor`, and a request to `/fhir/<tenant>/...` for a tenant lacking a partition **fails**. Only two partitions are listed as pre-created, against ADR-041's twelve tenants.
- **SOURCE:** the Maezo manifest's one exercised publication was `environment: dev`.
- **SOURCE:** the only required CI status check is `Security Gate`; other workflows run without blocking merge, and several were red in the 2026-08-04 snapshot.

**INFERENCE, stated plainly:** if only `dev` is provisioned, then Layer 2 verification in a production-like environment — which Gate G3 requires — **cannot currently be performed at all**, by anyone, regardless of access. This is not a scheduling gap. It is an environment that does not exist. A V2 plan that assumes production-like AMH conformance testing is available on request is planning against a resource that must first be funded and built (README pendência #2 assigns this to `Negócio / orçamento`).

**A cautionary precedent for Layer 2 (INFERENCE):** the partitioning document records five configuration keys that were documented in this very repository *and in its YAML files*, which Spring **silently ignored** — configuring nothing. Documented configuration in this codebase has demonstrably diverged from deployed behavior before. This is a concrete, in-repository argument for why Gate G3 demands empirical verification rather than document review.

### What is VALIDATION REQUIRED at Layer 2

Everything. Minimally, before any compatibility claim:

1. Which environments exist, and which is the intended target for a V2 integration.
2. Whether the HAPI FHIR endpoint is reachable by a V2 workload, and over what network path (the README describes an internal ALB with mTLS; ADR-040 §5 notes bulk ingestion uses an **internal** ALB `sem WAF e sem rate-limit`, never the public one).
3. What the live `/fhir/<tenant>/metadata` actually advertises — the decisive empirical test for contradiction **C-2**.
4. Whether `lambda-authorizer-fhir` is in the live request path, and what issuer/audience/JWKS it is configured with.
5. Which tenant partitions actually exist, given that nothing creates them automatically.
6. Whether a sandbox or faithful emulator exists for consumer-driven contract tests (prompt §7.6) — and if not, what would be required to create one.

### Layer 2 verdict

**NO EVIDENCE. Not assessed. Cannot be inferred from Layer 1 under any circumstances.**

---

## Layer 3 — Populated data

*representative tenant coverage, non-empty rows/resources, meaningful field distributions*

### What IS established

**Nothing is OBSERVED at this layer.** Zero rows, resources, or field distributions were read.

### AMH's documentary claims about its own data — SOURCE, pending environment verification

Recorded faithfully, labeled correctly, and **not** treated as population evidence:

| SOURCE claim | Where AMH states it | Nature |
|---|---|---|
| `11.451.908` FHIR resources across 7 of 8 clinical types | ADR-040 L58–59 (`Resultado medido`) | Measurement claim, 2026-07-25 |
| `386.288` Encounters in HAPI = `386.288` rows in `gold.fact_atendimento` | ADR-040 L56–57 | Reconciliation claim |
| `52.452` clinical rows referencing an encounter absent from the landing zone | README L169 | Ingestion-skew defect claim |
| 21 Gold tables with zero rows; 21 with a 100%-null business column, across 93 tables / 12 companies | Gold sweep §1–§2, measured 2026-08-13 | Measurement claim |
| `austa_hospital.fact_atendimento`: 344,414 rows with `insurance_guide`, `total_amount_raw`, `paid_amount_raw` 100% null | Gold sweep §2 | Measurement claim |
| Tasy `PACIENTE_EXAME` `existe no catálogo mas veio com 0 linhas`; Diagnose/LIS `não é ingerido` | Observation source request L16–19 | Absence claim, 2026-07-24 |
| 49 establishments / 49 CNPJs inside `austa_clinicas`; only 12 with clinical data; Austa Hospital alone = 89.2% of encounters; 4,220 patients (3.88%) span more than one PJ | ADR-041 L20–22 | Measurement claim, 2026-07-26 |

**These are AMH asserting facts about AMH. They are credible, specific, dated, and method-described — and they are still SOURCE.** V2 must measure independently before any pathway depends on them.

### The three things the SOURCE claims themselves establish about Layer 3

Even taken at face value — which is generous, not rigorous — AMH's own documents assert:

1. **The laboratory Observation source is empty.** Zero rows in `PACIENTE_EXAME`; the preferred structured source not ingested. The only Observation profile therefore has no populated source. *(Claims 3, 4, 6)*
2. **No vital-sign source is claimed as populated anywhere.** The vital-sign assertions in the diagrams are capability/intent statements in a document predating the governing ADR; no file read this cycle claims a populated vital-sign feed exists. *(Claim 7 / contradiction C-1)*
3. **Referential integrity is measurably imperfect.** 52,452 clinical rows point at a nonexistent encounter, from ingestion skew between tables that advanced at different rates. Because the profile makes `Observation.encounter` **optional** while `subject` is mandatory, encounter linkage cannot be assumed from conformance — it must be measured per resource.

**INFERENCE:** the two data classes an ICU evaluation engine most needs — vital signs and numeric laboratory results — are, on AMH's own account, the two that are not populated. This is the hard portfolio constraint of prompt §7.2, and it is not a matter of interpretation.

### What is VALIDATION REQUIRED at Layer 3

Per prompt §7.2, for every candidate pathway input: resource/table/event and exact field path; population counts and null/invalid distributions; tenant and facility coverage; patient/encounter linkage rates; code system and unit conformance rates in the actual data (not the profile); observed/issued/received/available timestamps; duplicate, ordering, correction and cancellation semantics as they actually occur.

**A specific and non-obvious warning carried from the Gold sweep:** an empty table returns `NULL` with HTTP 200 — `quem consome lê ausência como afirmação` ("the consumer reads absence as assertion"). A V2 conformance suite that checks only for successful responses will pass against entirely empty data. Fitness checks must assert **non-emptiness and distribution**, not response codes. The sweep also notes such checks `precisa de AWS e de dado real` and cannot live in CI — meaning Layer 3 verification requires environment access that does not currently exist for V2.

**Also VALIDATION REQUIRED:** whether AMH's `_dq_status` (`valid | warning | quarantined`) is carried onto FHIR resources at all. The CodeSystem is scoped to Silver-Rules. If the FHIR lane carries no quality signal, a V2 consumer receives **no source-quality dimension whatsoever** — a stronger constraint than a vocabulary mismatch, and one that would force V2 to derive quality independently.

**Scope caveat:** the Gold sweep measures the **analytical** layer, not HAPI FHIR resources. It is evidence about the reconciliation lane. No equivalent population sweep of the FHIR lane was found this cycle.

### Layer 3 verdict

**NO OBSERVED EVIDENCE. SOURCE claims recorded and pending environment verification.** Those SOURCE claims, taken at face value, indicate the two most ICU-critical data classes are **absent**, not merely unmeasured.

---

## Layer 4 — Operational fitness

*measured end-to-end latency, completeness, ordering, correction, availability, replay, recovery*

### What IS established

**Nothing. This layer has no evidence in this cycle.** No latency was measured, no availability observed, no replay or recovery exercised, no correction behavior tested.

### Numbers that must NOT be mistaken for Layer 4 evidence

Several figures in the repository look like performance measurements. Each is disqualified, for a stated reason:

| Figure | Where | Why it is not Layer 4 evidence for V2 |
|---|---|---|
| `P95 < 200ms` for Observation, `< 300ms`, `< 500ms`, `< 2s` per resource | `data-flow-fhir-clinical.md` L133–145 | **Targets in a draft diagram dated Maio 2026**, in the same table as the disputed vital-sign claim. README L13 independently characterizes all such NFR figures as declared targets with no production to measure. |
| `~412/s` batch Bundle throughput; `7-65/s` for per-resource PUT with 504s under concurrency | ADR-040 L74–76 | **AMH's own bulk-ingestion write path into HAPI**, recorded as a pitfall lesson. Not a read-path latency for an external consumer, and not a freshness measurement in either direction. |
| RPO < 15 min, RTO < 1h, 99.95% FHIR API | README L13 / `architecture/nfrs.md` | Explicitly `alvo declarado, não SLA medido em produção: não há produção`. |
| `90 passed` provider contract tests; `compatibility_report.result: PASSED` | Maezo manifest | Real, but scoped to the **AMH×Maezo** contract in **dev**. Says nothing about an IntensiCare interface. |
| `939 tests collected`, zero errors | README L102 | Repository test collection. Not conformance, not data quality, not release evidence. |

**The controlling architectural fact for Layer 4 is Layer 1's, and it is decisive:** ADR-040 states the FHIR channel `**não é near-real-time**` while CDC is parked, and ingestion is watermark-incremental batch. **INFERENCE:** the batch-first design makes a seconds-level clinical delivery lane architecturally unavailable through the current FHIR channel — this is a *design* conclusion drawn from a declared contract, and it does not substitute for measurement. What the actual end-to-end freshness distribution is remains entirely unmeasured. This is the unresolved batch-freshness versus alert-latency contradiction the legacy assessment raised (prompt §2), and it remains unresolved here.

**Additional Layer 4 unknowns, all VALIDATION REQUIRED:** availability and error-rate distributions under a V2 read pattern; ordering guarantees and late-arrival behavior; correction/supersession propagation and its lag; replay and backfill semantics for a consumer; behavior during AMH downtime and during backfill windows; rate limits and quotas; recovery/rollback and incident ownership across the boundary. The DR runbooks exist but, per README pendência #2, `descrevem failover de recursos inexistentes`, and the `tests/dr` suite is wired into no workflow.

### Layer 4 verdict

**NO EVIDENCE. Not assessed.** The declared architecture (Layer 1) gives strong prior reason to expect batch-scale rather than seconds-scale freshness, but **a design inference is not a measurement**, and Gate G3 requires measurement.

---

## Consolidated layer status

| Layer | Status at pinned commit | Basis |
|---|---|---|
| **1 — Declared contract** | **Substantially established**, with 4 recorded contradictions (C-1 vitals, C-2 auth, C-3 manifest status, C-4 Observation shape) and named gaps | OBSERVED across 17 files |
| **2 — Deployed capability** | **NO EVIDENCE — not assessed** | No environment access this cycle |
| **3 — Populated data** | **NO OBSERVED EVIDENCE.** SOURCE claims recorded; they indicate the two most ICU-critical classes are absent | Documents read, data not read |
| **4 — Operational fitness** | **NO EVIDENCE — not assessed** | Nothing measured |

**Gate G3 cannot be approached from here.** Three of its six conditions (populated-data proof, production-like conformance testing, demonstrated failure/recovery) require Layers 2–4, for which no evidence exists and — given that only `dev` is provisioned — cannot presently be produced in a production-like environment by anyone.

**Per prompt §7.0 and §7.5, the correct standing report is `integration candidate`, and clinical evaluation must remain non-actioning.** See [`compatibility-finding.md`](./compatibility-finding.md).

---

## Handoff to the Wave 2 identity adjudication analyst

Three items from this cycle bear directly on identity adjudication and are handed over without adjudication here:

1. **The identity conflict is a hard blocker on Observation consumption, not a parallel concern.** `Observation-amh-laboratory` requires `extension:mpiId` (1..1) and `extension:tenantId` (1..1). Every conformant Observation carries an MPI reference whose cross-tenant semantics are exactly what ADR-006 and ADR-041 dispute.
2. **Both sides of the MPI conflict are quoted at the pinned commit** in the claim matrix (Claim 8): ADR-041 §6 `O MPI **NÃO cruza tenants**` versus IG README L257 `← chave estável cross-tenant`, plus principle #4 `MPI é única para identidade longitudinal`. ADR-006 and ADR-039 were **not** read this cycle and remain to be examined.
3. **The population the decision affects is measured:** 4,220 patients (3.88%) have encounters in more than one PJ (ADR-041 L22). ADR-040 L69 adds that the deterministic `mpi_id = f(CPF)` `não resolve duplicidade sem CPF`.

---

*Prepared by the AMH-data compatibility architect (Wave 1). Read-only verification at a pinned commit; nothing was written to the AMH repository. No PHI, credentials, or tokens appear in this document. This dossier does not declare compatibility, choose a transport, or approve a platform boundary — all three are reserved decisions.*
