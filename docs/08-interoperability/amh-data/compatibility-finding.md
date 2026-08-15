---
doc_id: AMH-COMPATIBILITY-FINDING
status: PROPOSAL
owner: UNASSIGNED — VALIDATION REQUIRED
source: Omni-Saude/amh-data-platform @ 0a07a6f1fab36fb2f5eeee0fcd8e945c95f67116 (pinned evidence snapshot, main); INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §7.0 and §7.2 (hard portfolio constraint)
date_collected: 2026-08-14
collector: AMH-data compatibility architect
last_updated: 2026-08-14
---

# AMH×IntensiCare — Compatibility Finding

**Finding, restated (prompt §7.0):**

> **Integration candidate; not currently demonstrated compatible for actionable ICU evaluation.**

**Pinned evidence snapshot.** `Omni-Saude/amh-data-platform@0a07a6f1fab36fb2f5eeee0fcd8e945c95f67116` (`main`), verified 2026-08-14 to be the current HEAD.

**Status of this document.** This is a **restatement and justification** of the orchestrator's §7.0 classification against re-verified evidence. It is **not** a compatibility determination. Gate G3 is the only body that can grant compatibility, and it is far away — three of its six conditions require evidence layers for which nothing exists (see [`four-layer-dossier.md`](./four-layer-dossier.md)).

---

## 1. What the finding asserts, precisely

The classification has two halves, and both must be read.

**"Integration candidate"** — affirmative. AMH is a serious, well-documented healthcare data platform with a real FHIR R4 Implementation Guide, rigorous tenant isolation design, a mature contract-publication pattern, and an engineering culture that documents its own defects with unusual honesty. It is a credible integration partner. This is not a rejection.

**"Not currently demonstrated compatible for actionable ICU evaluation"** — three qualifiers carry the weight:

- **"currently"** — a statement about the pinned commit and this evidence cycle, not about AMH's trajectory. New evidence can change it.
- **"demonstrated"** — the burden is on evidence, not on plausibility. Absence of demonstration is the finding; it is not an assertion that compatibility is impossible.
- **"for actionable ICU evaluation"** — the scope is a *clinically actionable* ICU pathway. AMH data may be perfectly suitable for reconciliation, cohort analysis, outcomes, quality surveillance, and retrospective study. The finding does not condemn those uses.

**What the finding does NOT assert:** that AMH is low quality; that integration should not proceed; that AMH data is unusable; or that the boundary decision, transport choice, or platform placement has been settled. None of those are within this specialist's authority (prompt: `decisions_prohibited`).

---

## 2. The affirmative case — why "integration candidate" is warranted

All OBSERVED at the pinned commit; see [`claim-verification-matrix.md`](./claim-verification-matrix.md) for verbatim quotes and blob SHAs.

1. **A real FHIR R4 Implementation Guide exists.** Package `br.com.americashealth.fhir` v1.0.0, FHIR `4.0.1`, `status: active`, 19 profile StructureDefinitions plus extensions, NamingSystems, CodeSystems, ValueSets and SearchParameters. Patient, Encounter, Condition, Coverage, Organization, Location, Practitioner and more are profiled. This is the substrate of the "useful patient/encounter/condition context" §7.0 credits.

2. **Tenant isolation at the FHIR layer is specified with unusual rigor.** URL-based partition identification; a mandatory equality check between the token tenant claim and the URL tenant, denying divergence *and* denying a missing URL tenant; 403 rejection of client-supplied partition headers; `allow_references_across_partitions: false`. Notably, the document **retracts five configuration keys it previously documented** which Spring silently ignored — a platform that publicly corrects its own security documentation is a platform whose remaining documentation is worth more.

3. **A mature contract-publication pattern exists and has been exercised end-to-end.** The Maezo manifest pins a producer commit, digests every artifact, freezes a 28-field envelope with fixed ordering, declares `BACKWARD` compatibility, ships 9 fixtures including 3 deliberately invalid negatives, classifies PHI per artifact, records four named-role approvals, carries a compatibility report with dry-run and evidence IDs, and registers three schema version IDs in Glue. **This is the most valuable thing AMH offers V2** — as a *pattern to imitate*, not an interface to reuse.

4. **A read-only, purpose-bound, fail-closed context API is specified.** Opaque `portable_subject_ref` keying, mandatory `purpose_of_use`, 403 with explicit reason on consent failure, no free text, no named practitioners. This is exactly the privacy posture prompt §7.4 asks for at an integration boundary.

5. **An implemented, unit-tested OAuth2/JWT/SMART-scope authorizer exists in the tree** — JWKS validation, six required claims, per-verb scope matching, mandatory never-defaulted tenant claim, explicit fail-closed deny. Its existence indicates the authentication path is further along than the HAPI README's `(futuro)` suggests, though it remains Layer 1 evidence.

6. **Batch clinical resources and analytical reconciliation are claimed at scale.** SOURCE: 11,451,908 FHIR resources across 7 of 8 clinical types; 386,288 Encounters in HAPI reconciling one-to-one with `gold.fact_atendimento`. If verified, that is a substantial context corpus and a working reconciliation lane.

**This is a real platform with real assets. The negative half of the finding is not a judgment of its quality.**

---

## 3. The hard portfolio constraint

> **At the evidence snapshot, AMH laboratory Observation is blocked and no demonstrated general vital-sign profile/feed exists. Record this as a hard portfolio constraint until new evidence is accepted.** (prompt §7.2)

Re-verified at the pinned commit, this constraint is **confirmed and, in two respects, stronger than stated**.

### 3.1 Laboratory Observation is blocked — confirmed, by two independent files

**Declared blocked (OBSERVED).** ADR-040's accepted consequences: `` `Observation` fica bloqueado até os resultados de exame serem ingeridos no Bronze ``.

**Source empty (OBSERVED).** The source request states the block is `**bloqueado por falta de dado**, não por código` — the mapper is written and ready; the Bronze source table is empty. `PACIENTE_EXAME` `existe no catálogo mas veio com 0 linhas`. The preferred structured Diagnose/LIS source `**não é ingerido**` in the data lake.

**Corroborated by the IG itself (OBSERVED).** The IG maps its sole Observation profile to source `bronze_diagnose.diagnose_exame_resultado` — the exact Diagnose/LIS path the source request says is not ingested. **The IG's declared source for its only Observation profile is, by the repository's own account, absent.** Two independent documents at the same commit agree.

**Stronger than stated — the unblocking plan does not restore conformance (C-4).** The planned Observation construction emits `Observation.code = {text: "Resultado de exame"}` and `Observation.valueString = ds_resultado`. The verified profile binds `code` to the `amh-loinc-laboratory` ValueSet and fixes `valueQuantity.system` to UCUM. **Free text plus a string payload is not a LOINC-coded UCUM quantity.** The document names the conformant alternative — Diagnose/LIS structured results giving `analito/valor/unidade` and permitting `valueQuantity` — and characterizes it as `Maior esforço`, recommended for a later phase.

**Consequence for V2, stated bluntly (INFERENCE):** even if "Observation unblocked" is announced, the announcement may deliver **free-text strings, not numbers**. No ICU scoring rule — NEWS2, MEWS, SOFA, qSOFA, or any threshold logic — can consume a `valueString`. V2 must require, as an acceptance condition, that unblocked Observations arrive LOINC-coded with UCUM quantities. Both sides of C-4 are recorded; which path AMH intends is an owner question.

### 3.2 No demonstrated general vital-sign profile or feed — confirmed, and structurally so

**The IG has no vital-signs profile (OBSERVED).** Nineteen StructureDefinitions; exactly one Observation profile; that profile **pattern-fixes** `Observation.category` to `laboratory`.

**Stronger than stated — this is structural exclusion, not absence of coverage.** A pattern-fixed category means a conformant instance of `Observation-amh-laboratory` **cannot** carry a vital-signs category. The IG does not merely fail to profile vitals; its only Observation profile forbids them. **Vital signs would require a new profile to be authored, published, versioned and populated — not a reuse, not a configuration change, not a mapping.**

**The contradicting claims are real and are recorded, not dismissed (C-1).** The AMH diagrams do assert vital signs: `EVOLUCAO_PACIENTE → ... Observation para sinais vitais` and `Observation | ✅ (sinais vitais de dispositivos IoT) | ✅ (sinais vitais, resultados) | P95 < 200ms`. Per instruction, this contradiction is **preserved for AMH owner resolution and is not resolved here.**

Three observations sharpen it without settling it: the C4 component diagram is internally self-inconsistent (its mapper list shows `EVOLUCAO_PACIENTE → ClinicalImpression` with no Observation branch, contradicting its own table); the data-flow diagram is dated `Maio 2026` and describes the CDC path ADR-040 replaced in July; and its `P95 < 200ms` sits in the same table, which README L13 independently characterizes as a declared target with no production to measure. **None of these is an adjudication.** An earlier date does not void a claim. Only AMH owners can say whether the vital-sign intent survived ADR-040.

**What is not in dispute:** no file read this cycle claims a **populated** vital-sign feed exists in any environment. The diagrams assert capability and intent; nothing asserts data.

### 3.3 Why this constraint is portfolio-determining, not merely inconvenient

Vital signs and numeric laboratory results are the two input classes on which essentially every actionable ICU deterioration pathway depends. On AMH's own account, **both are unpopulated** — one blocked by an empty source with a non-conformant unblocking plan, the other lacking any profile at all.

**INFERENCE:** the pathway portfolio optimizer (prompt §6) must treat AMH-sourced vital signs and AMH-sourced numeric labs as **unavailable inputs** until new evidence is accepted at Gate G3. Pathways whose mandatory inputs reduce to those classes are ineligible for actionable evaluation from AMH data — regardless of how well their clinical logic is understood. Per §7.2, `Do not assume NEWS2, MEWS, SOFA, qSOFA, sepsis, respiratory, renal, or any other score/pathway is feasible merely because its logic is known.`

This does not empty the portfolio. It relocates the question: what, if anything, can be evaluated safely from **encounter, condition, coverage, medication and context** data alone — and whether such a pathway carries genuine clinical value or is a technically feasible artifact in search of a purpose. That determination belongs to the clinical pathway specialists and Gate G2, not here.

---

## 4. Why "not currently demonstrated compatible" — the four-part justification

### 4.1 Compatibility is a four-layer claim, and three layers have no evidence

Prompt §7.1: `Passing an earlier layer never implies passing a later layer.`

| Layer | Status |
|---|---|
| 1 — Declared contract | Substantially established (with 4 recorded contradictions) |
| 2 — Deployed capability | **NO EVIDENCE** — no environment access this cycle |
| 3 — Populated data | **NO OBSERVED EVIDENCE** — SOURCE claims only |
| 4 — Operational fitness | **NO EVIDENCE** — nothing measured |

A finding of "compatible" resting on Layer 1 alone would be precisely the error prompt §7.0 forbids: `Do not call the current repositories "compatible" merely because both contain FHIR, APIs, events, or matching identifiers.`

### 4.2 Even at Layer 1, four contradictions are unresolved

Any of the four could change V2's design materially. All are recorded, none resolved (recorded in [`four-layer-dossier.md`](./four-layer-dossier.md) as C-1 through C-4):

- **C-1 vital signs** — diagrams claim them; the IG structurally excludes them.
- **C-2 authentication** — a **three-way** divergence: CapabilityStatement advertises OAuth + SMART; the HAPI README says mTLS now, SMART `(futuro)`; and an implemented OIDC/JWT/SMART-scope authorizer exists in the tree. A consumer cannot choose client behavior against three positions.
- **C-3 manifest status** — the README describes the Maezo manifest as `UNPUBLISHED` with null registry fields; the manifest itself reads `PUBLISHED` with populated fields. Two files at one commit disagree about a third.
- **C-4 Observation shape** — the unblocking plan produces free text; the profile requires coded quantities.

### 4.3 The freshness question — the original contradiction — remains open

ADR-040 states the FHIR channel `**não é near-real-time**` while CDC is parked; ingestion is watermark-incremental batch. **INFERENCE:** a batch-first design makes seconds-level clinical delivery architecturally unavailable through the current FHIR channel.

But the actual end-to-end freshness distribution is **entirely unmeasured**. Every latency figure in the repository is either a target in a draft document, or AMH's own bulk-write throughput into HAPI (`~412/s` for batch Bundles; `7-65/s` with 504s for per-resource PUT) — neither is a consumer read-path measurement. The legacy assessment's unresolved batch-freshness versus alert-latency contradiction (prompt §2) is **still unresolved**, and §7.3 requires it be tested rather than assumed in either direction.

### 4.4 Production-like verification is presently impossible for anyone

**SOURCE:** only `dev` is provisioned; `stg`, `prod` and `dr` do not exist and have no tfstate. Tier 0 NFR targets are `alvo declarado, não SLA medido em produção: não há produção`. The Maezo publication — AMH's one exercised end-to-end contract publication — was `environment: dev`.

Gate G3 requires that conformance tests `pass in a production-like environment`. **INFERENCE:** that condition cannot currently be satisfied by anyone, at any level of access, because the environment does not exist. README pendência #2 assigns it to `Negócio / orçamento`. Any V2 schedule assuming production-like AMH conformance testing is available on request is planning against a resource that must first be funded and built.

---

## 5. What would have to change for the finding to change

Necessary conditions, in dependency order. **None is sufficient alone**, and satisfying all of them still only enables a Gate G3 hearing — it does not pre-decide it.

| # | Condition | Layer | Blocked on |
|---|---|---|---|
| 1 | AMH owners resolve C-1: state whether a populated vital-sign feed exists or is planned, under what profile, codes, units and freshness | 1 | AMH owner decision |
| 2 | AMH owners resolve C-2 and empirical discovery confirms the deployed auth mechanism per environment | 1→2 | AMH owner + environment access |
| 3 | AMH owners state the Observation ingestion timeline **and** whether the delivered shape will be profile-conformant (C-4) | 1 | AMH owner decision |
| 4 | A V2-reachable environment exists with credentials, network path, and a designated tenant scope | 2 | AMH owner + provisioning + budget |
| 5 | Population, coverage, null-distribution, linkage and code/unit conformance measured on real data for every candidate input | 3 | Depends on 4 |
| 6 | End-to-end freshness, ordering, correction, replay, downtime and backfill behavior measured | 4 | Depends on 4 |
| 7 | An AMH×IntensiCare contract package is authored, owned, approved and published by AMH; V2 pins it | 1 | AMH owner authority (see §6) |
| 8 | A production-like environment exists in which conformance tests can pass | 2–4 | AMH budget decision |

**Note the shape of this list.** Six of eight conditions require an AMH-owner act or an AMH environment. **The critical path for V2's AMH compatibility runs primarily through AMH, not through V2 engineering.** Any plan that treats compatibility as a V2 implementation task will mis-schedule it. This is a strong argument for V2 architecting to be robust to AMH data being **unavailable or late** — not as pessimism, but as the schedule-risk posture the evidence supports.

---

## 6. Boundaries of this finding

**What this document does not do**, per `decisions_prohibited`:

- It does **not** declare compatibility. Gate G3 alone can, and it is far away.
- It does **not** choose a transport. FHIR REST/Subscriptions, an event stream, controlled batch and other options remain open and must be compared per §7.5.
- It does **not** approve the platform boundary. Whether V2 is an AMH consumer, an in-platform module, or a hybrid is an ADR decision under §7.3.
- It does **not** resolve any contradiction. C-1 through C-4 are recorded with both (or three) sides intact.
- It does **not** adjudicate identity or tenancy. That is the Wave 2 specialist's.
- It carries **no AMH-owner sign-off**. Nothing here has been reviewed or accepted by AMH.
- Nothing was written to the AMH repository, and nothing should be. The Maezo manifest states the boundary is `AMH-owned — edição SOMENTE em Omni-Saude/amh-data-platform`; an AMH×IntensiCare contract would require AMH-owner authority to create.

**Standing report until Gate G3 (prompt §7.5):** `integration candidate`. Clinical evaluation remains **non-actioning**.

---

## 7. Statement of the finding

**PROPOSAL — for orchestrator acceptance, not a decision:**

At `Omni-Saude/amh-data-platform@0a07a6f1fab36fb2f5eeee0fcd8e945c95f67116`, AMH-data is confirmed an **integration candidate** and is **not demonstrated compatible for actionable ICU evaluation**.

The declared-contract layer is substantially established and materially useful. The deployed-capability, populated-data, and operational-fitness layers have **no evidence** in this cycle. AMH's own documents state that **laboratory Observation is blocked by an empty source**, and the IG's **only Observation profile structurally excludes vital signs** — placing the two input classes most ICU pathways require outside what AMH currently provides. Four documentary contradictions remain unresolved and are reserved for AMH owners. Production-like verification is presently impossible because only `dev` is provisioned.

This finding must be re-tested at the execution commit and revised on new evidence. It is a status report on evidence, not a verdict on AMH.

---

*Prepared by the AMH-data compatibility architect (Wave 1). Read-only verification at a pinned commit. No PHI, credentials, or tokens appear in this document.*
