---
id: THREAT-MODEL-V2
title: IntensiCare V2 Threat Model (seed, joint with the clinical hazard log)
label: PROPOSAL
statement: >
  Anticipatory threat model for the candidate IntensiCare V2 architecture. Twelve trust
  boundaries and sixty-seven threats (THR-0001..THR-0067) enumerated by STRIDE-per-trust-
  boundary with an expanded actor model, LINDDUN-derived privacy threats, and clinical
  abuse cases. Every threat is status OPEN, owner UNASSIGNED, priority PROPOSAL. No
  control named here is implemented. No finding here is closed, accepted, or verified.
  This document makes no compliance claim of any kind.
  EXTENSAO DO CICLO 1 (secao 12, em pt-BR por DEC-G0-10, 2026-08-15): dezesseis ameacas
  adicionais (THR-0068..THR-0083) sobre a superficie nova introduzida pela minuta do
  contrato v1 AMHxIntensiCare — lane de eventos de ciclo de vida de identidade,
  resolve(ref, as_of), PSR como pseudonimo, contaminacao cross-PJ a montante (R-a5),
  fixtures/dados sinteticos e drift de contrato. Total: 83 ameacas, TODAS OPEN, nenhuma
  aceita. As secoes 0-11 permanecem sem reescrita.
provenance:
  source_repo: intensicare-V2
  path_or_url: docs/11-security-privacy-compliance/threat-model.md
  commit_sha_or_version: uncommitted (working tree at cb35521)
  section_or_lines: whole document
  date_collected: 2026-08-14
  collector: healthcare threat-model specialist (Wave 2 specialist agent)
  transformation: >
    Threats derived from INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §§3, 7.4, 9.4, 12.4, 13
    applied to the candidate runtime topology, and joined to the completed Wave 1 safety
    package (docs/05-clinical-safety/hazard-log.md, safety-requirements.md) and to the
    AMH trust-boundary evidence (docs/08-interoperability/amh-data/). No V2 system,
    environment, endpoint, or artifact was tested; none exists.
  confidence: medium
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
extension_ciclo_1:
  section: "12 (THR-0068..THR-0083)"
  date_collected: 2026-08-15
  collector: especialista em modelo de ameacas de saude (ciclo 1)
  language: pt-BR (DEC-G0-10)
  source_surface: docs/08-interoperability/amh-data/contract-v1/ (manifesto draft, clausula de ciclo de vida de identidade, fixtures, memoria de desenho) — status DRAFT/PROPOSAL, pinned false
  also_read: docs/11-security-privacy-compliance/lgpd-os16/minuta-parecer-os-16.md (§1.3 P-PSR-1; §3.6 R-a3/R-a5/R-a7); docs/06-architecture/adrs/ADR-0004-identidade-paciente-encontro-mpi.md (§5.1 D-04..D-08, §5.2); docs/05-clinical-safety/hazard-log.md (verificacao de IDs HAZ)
  transformation: threat modelling anticipatorio sobre a superficie nova; nenhum ambiente, endpoint ou artefato executavel foi testado (nenhum existe)
  confidence: medium
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
  acceptance: nenhuma — aceitacao pertence a AUTH-SECURITY (BLK-0003), UNASSIGNED
links:
  requirements: [SAF-0001, SAF-0037, SEC-0001, SEC-0050]
  hazards: [HAZ-0003, HAZ-0013, HAZ-0014, HAZ-0028, HAZ-0029, HAZ-0034]
  adrs: [ADR-0001]
  tests: []
  pr: null
supersedes: null
superseded_by: null
---

# IntensiCare V2 — Threat Model (seed, Wave 2)

> **Every threat row: `Status = OPEN`, `Owner = UNASSIGNED — VALIDATION REQUIRED`,
> `Priority = PROPOSAL`.**
> Priority is a triage aid for a system that does not yet exist. **It is not risk
> acceptance, not security sign-off, and not a statement that the P2 items are
> tolerable.** Threat-model acceptance belongs to `AUTH-SECURITY`
> (`docs/00-governance/authority-model.md` §1), which is `UNASSIGNED` and blocked as
> `BLK-0003`.
>
> **This document states no compliance position.** Whether LGPD, ANVISA/SaMD, ISO 27001,
> SOC 2, HIPAA, or any other framework applies to IntensiCare V2 is a determination
> reserved to Brazilian legal/regulatory specialists and `AUTH-PRIVACY-LEGAL`
> (`PROMPT:766`). Nothing here may be cited as evidence of compliance, security, or
> control effectiveness.

## 0. Citation shorthand and evidence grading

| Token | Resolves to |
|---|---|
| `PROMPT:n-m` | `/Users/familia/code/intensicare-V2/INTENSICARE_V2_ORCHESTRATOR_PROMPT.md` lines n–m |
| `HAZLOG` | `docs/05-clinical-safety/hazard-log.md` (read 2026-08-14, working tree at cb35521) |
| `SAFREQ` | `docs/05-clinical-safety/safety-requirements.md` |
| `DOSSIER` | `docs/08-interoperability/amh-data/four-layer-dossier.md` |
| `COMPAT` | `docs/08-interoperability/amh-data/compatibility-finding.md` |
| `IDN-CONTRA` | `docs/08-interoperability/amh-data/identity-adjudication/contradiction-record.md` |
| `IDP-nn` | `docs/08-interoperability/amh-data/identity-adjudication/interim-identity-policy.md` rule nn |
| `LEGACY-TA:n` | legacy technical assessment line n — cited **only** as transcribed into `HAZLOG`; this agent did not open the legacy file |

Evidence labels follow `docs/00-governance/evidence-notation.md` §2. Where a threat row
cites `LEGACY-TA`, the label is **second-hand**: the evidence that the failure mode is
reachable in this domain was verified by the Wave 1 safety engineer, not by this agent.

**OBSERVED, and load-bearing:** the IntensiCare V2 repository contains **no application
source code, no infrastructure code, no running environment, and no deployed artifact**
as of 2026-08-14 (verified by full enumeration of the repository tree). Therefore **no
threat below is an observation of V2 behaviour.** Every threat is an anticipatory
statement about a *candidate* architecture (`PROMPT:600-614`) that has not been ratified
by any ADR. When the architecture is ratified, this model must be re-run against it.

---

## 1. Method — what was chosen, and why

### 1.1 The method

**PROPOSAL — STRIDE-per-trust-boundary over the candidate runtime topology
(`PROMPT:600-614`), with three deliberate extensions:**

1. **An expanded actor model.** Classical STRIDE assumes an adversary. `PROMPT:750-764`
   requires this model to cover failure modes that have no adversary at all — missing
   data, clock skew, terminology drift, delayed alerts, lost events. This model therefore
   admits four actor classes, and every threat row names which one it assumes:
   - `EXT` — external unauthenticated or weakly-authenticated party;
   - `AUTH` — an authenticated principal (clinician, workload, tenant admin, integration
     client) acting outside its intended authority, whether maliciously or by confusion;
   - `INS` — a privileged insider or a compromised privileged credential (operator,
     rule author, CI runner, support engineer);
   - `SYS` — **no adversary**: a fault, misconfiguration, race, drift, outage, or
     omission that produces the same loss of a security/safety property.
   Admitting `SYS` is what makes the model joinable with the hazard log. A threat model
   that only enumerates attackers cannot meet `PROMPT:750`.
2. **LINDDUN-derived privacy threats at boundaries where data is disclosed or correlated**
   — specifically *linkability* and *identifiability* (cross-tenant inference, cross-PJ
   correlation, side channels), which STRIDE's *Information disclosure* under-specifies
   for a multi-legal-entity health platform.
3. **Clinical abuse/misuse cases** for the workflow threats §13 requires (suppression,
   misrouting, ambiguous responsibility, ungrounded output). These are stated as
   scenarios, not as protocol-level attacks, because the asset at risk is a clinical
   decision, not a byte.

Each threat is classified against STRIDE (`S`poofing, `T`ampering, `R`epudiation,
`I`nformation disclosure, `D`enial of service, `E`levation of privilege) plus `L`
(linkability/inference, LINDDUN-derived) and `A` (clinical-abuse case) where the STRIDE
letters do not carry the meaning.

### 1.2 Why this method, over the alternatives

| Candidate method | Why not chosen as the primary frame |
|---|---|
| **STRIDE-per-element** | Requires a validated DFD with named processes and stores. V2 has no architecture ADR, no chosen stack, no database, no broker (`docs/14-devsecops-and-delivery/ci-policy.md` §2). Per-element decomposition of a topology that is still a *candidate* would produce findings that dissolve the moment an ADR lands. Boundaries, by contrast, are stable: the user/edge, V2/AMH, and CI/runtime boundaries exist under every plausible ADR outcome. |
| **Attack trees / PASTA / kill-chain** | Both need an attacker profile and an asset valuation this project does not yet have (no intended-use approval, no pathway portfolio, no named security owner). They also bias toward adversarial threats and would silently drop the `SYS` half of `PROMPT:750-764`. |
| **LINDDUN as the primary frame** | Excellent for the privacy half, blind to the integrity-of-clinical-meaning half (an unsigned rule bundle is not a privacy threat). Retained as an *extension*, not the frame. |
| **STPA-Sec** | Genuinely attractive here, and closest in spirit to the joint requirement. Rejected as the *primary* frame for one reason: the Wave 1 safety engineer already performed STPA-style analysis over the same safety loop (`HAZLOG` §1). Re-running it would duplicate their work in a different vocabulary and make the two documents harder, not easier, to join. Instead this model **consumes** their control-structure analysis and attaches boundary threats to it. |
| **Threat modelling deferred until the architecture is ratified** | Prohibited by sequencing: Gate G6 conditions (`PROMPT:770-772`) and Gate G4/G5 conditions all reference threat-model findings, and `PROMPT:750` places threat modelling alongside hazard analysis, which is already done. Deferring would also mean the ADR program (`PROMPT:634-659`, 24 ADRs) is written without threat input — the exact failure the legacy assessment documents. |

**The joint seam.** `PROMPT:750` requires threat modelling and hazard analysis to be
performed *together where failures cross boundaries*. The Wave 1 safety engineer tagged
six hazards `joint` — HAZ-0003, HAZ-0013, HAZ-0014, HAZ-0028, HAZ-0029, HAZ-0034 — and
declared coverage gap **G-1** (supply chain has no clinical hazard rows because assigning
clinical severity before a threat model existed would be fabrication, `HAZLOG` §4). This
document discharges G-1 by supplying the threat IDs, and maintains bidirectional links in
§9. **It does not edit the hazard log**; that integration is the hazard-log owner's act.

### 1.3 What this method does *not* give you

- **No attack surface measurement.** There is no deployed surface to measure.
- **No exploitability rating.** Nothing was tested. "Priority" is impact-and-reachability
  triage, not likelihood.
- **No coverage claim beyond §13.** §10 shows the mapping to every `PROMPT:752-764`
  bullet. Coverage of *that list* is demonstrated; coverage of "all threats to V2" is not
  claimed and cannot be.
- **No residual risk.** Residual risk requires controls to be implemented and verified.
  None are. Every row's residual risk is therefore identical to its inherent risk.

### 1.4 A naming caveat this model must declare

`docs/00-governance/traceability-policy.md` §1 fixes the ID taxonomy and states that "no
specialist may invent a new prefix without an ADR amending this document." `SEC` is in
the taxonomy; **`THR` is not**. This task's packet authorises `THR-xxxx` threat IDs, so
they are minted here — but the prefix requires an ADR amending
`traceability-policy.md` §1 before it is legitimate repo-wide. Recorded in §11 as an open
item, not silently adopted.

---

## 2. Trust-boundary inventory

A trust boundary here is a place where **data or control crosses between parties with
different authority, different failure domains, or different verification status**. Twelve
are identified. `Evidence` states what is actually known about each boundary today —
which, for a greenfield system, is usually "nothing."

| TB | Boundary | What crosses | Trust asymmetry / why it is a boundary | Evidence status today | Primary threats |
|---|---|---|---|---|---|
| **TB-01** | Clinician / user ↔ identity-aware edge or BFF | Credentials, session, clinical reads, human actions on alerts | The user is authenticated but not trusted to assert *what they may see*; the browser is fully attacker-controllable | **NO EVIDENCE** — no edge exists; no session model chosen (ADR 15 of `PROMPT:650` unwritten) | THR-0021..THR-0025, THR-0043, THR-0044 |
| **TB-02** | Edge/BFF ↔ REST command/query API | Commands, queries, tenant/purpose context, idempotency keys | The BFF is not an authorization boundary; a compromised or bypassed BFF must not confer authority | **NO EVIDENCE** | THR-0001, THR-0002, THR-0004, THR-0026 |
| **TB-03** | Application ↔ operational store, object storage, cache | Clinical facts, evaluation records, audit rows, source envelopes | Storage-level tenant ownership is an invariant (`SAF-0008`); application-layer compensation is not a boundary control | **NO EVIDENCE** — no database chosen; row-level enforcement is conditional in the candidate topology (`PROMPT:605` "if the selected technology supports it") | THR-0002, THR-0019, THR-0031, THR-0060 |
| **TB-04** | Transactional outbox ↔ durable broker/stream ↔ read projections | Domain events, replay traffic, projection rebuilds | Anything that can publish to the internal stream can fabricate a clinical fact downstream; the stream is inside the blast radius, not outside it | **NO EVIDENCE** — no broker chosen | THR-0011..THR-0015, THR-0039 |
| **TB-05** | **V2 ↔ AMH-data platform** | FHIR reads, contract artifacts, identity/tenant claims, data-quality state | Two organizations, two legal entities, two release cadences. V2 is a *consumer* with no authority over AMH's controls | **PARTIAL, and contradictory** — see §2.1. Layer 1 substantially established; **Layers 2–4 have no evidence at all** (`DOSSIER` Layer 2 verdict: "NO EVIDENCE. Not assessed.") | THR-0018, THR-0027, THR-0046, THR-0047, THR-0048 |
| **TB-06** | V2 ↔ identity provider | Tokens, JWKS, issuer/audience metadata, claims incl. tenant | **The provider is UNDECIDED.** No IdP is chosen; no ADR exists (`PROMPT:650` ADR 15). A boundary whose far side is undefined cannot be secured, only bounded | **NO EVIDENCE — and no decision.** AMH's own auth position is three-way contradictory (§2.1) | THR-0021, THR-0022, THR-0024, THR-0026 |
| **TB-07** | V2 ↔ real-time gateway (WS/SSE) and external notification channels | Alert content, delivery receipts, subscription/channel identity | Real-time transport is a *projection*, never the record (`PROMPT:121`); external channels (SMS/email/push/pager) are third parties outside V2's control plane | **NO EVIDENCE** — no channel, no provider, no contract | THR-0016, THR-0032, THR-0039..THR-0042 |
| **TB-08** | V2 ↔ MCP surface (server exposed and/or client consumed) | Tool invocations, tool results, clinical text, model-provider traffic | **MCP is not an authorization boundary** (`PROMPT:728`) and is a *new* V2 interface, not inherited AMH compatibility (`PROMPT:109`, corroborated by `DOSSIER`: zero MCP material in the active AMH tree) | **NO EVIDENCE** — no MCP ADR (`PROMPT:649` ADR 14 unwritten), no tool catalogue, no model-provider decision | THR-0061..THR-0067, THR-0029 |
| **TB-09** | Source/CI/CD ↔ dependency, artifact, and signing chain ↔ runtime | Source, dependencies, build actions, images, SBOMs, signatures, secrets, deployment digests | The build system is a *production-authority* system: whatever it emits runs against patients. Anyone who can influence the build can influence a clinical output | **PARTIAL** — exactly two blocking docs-gates jobs exist, actions pinned by SHA; **branch protection is NOT configured**, so a human with write access can merge past a red check (`docs/14-devsecops-and-delivery/ci-policy.md` §1) | THR-0050..THR-0056 |
| **TB-10** | V2 ↔ observability, telemetry, ticketing, and support surfaces | Logs, traces, metrics, error bodies, screenshots, support exports, agent/model messages | These sinks routinely have *weaker* access control, *longer* retention, and *wider* audience than the clinical store they describe | **NO EVIDENCE** — no telemetry stack; PHI redaction is currently a documented intent only | THR-0028..THR-0033 |
| **TB-11** | V2 ↔ backup, restore, DR, and evidence-export chain | Full clinical datasets, keys, audit evidence | A backup is a complete copy of the crown jewels with different controls and often a different blast radius; restore is an *unverified* code path until exercised | **NO EVIDENCE** — nothing to back up | THR-0057..THR-0060, THR-0033 |
| **TB-12** | Clinical rule authoring/approval ↔ runtime activation | Rule bundles, terminology snapshots, test packs, approvals, kill-switch commands | This is a **clinical-content supply chain**: it delivers executable clinical judgement into the patient path with the same authority as code, on a different lifecycle | **NO EVIDENCE** — no bundle format, no signing scheme (`PROMPT:641` ADR 7 unwritten) | THR-0034..THR-0038, THR-0056 |

### 2.1 TB-05, in detail: the observed three-way authentication contradiction

**OBSERVED (transcribed from `COMPAT` §4.2 and `DOSSIER` §Layer 1, which verified it
against pinned AMH commits):** AMH's authentication position for the FHIR endpoint is
**three-way divergent**, and all three positions are live in the same repository:

| Side | Position | Artifact |
|---|---|---|
| **A** | `OAuth` + `SMART-on-FHIR`, Cognito + IAM Identity Center | CapabilityStatement dated 2026-05-10 |
| **B** | `mTLS para serviços internos`; SMART marked `(futuro)` | HAPI README |
| **C** | An implemented, unit-tested OIDC/JWT/SMART-scope authorizer — JWKS validation, six required claims incl. a mandatory never-defaulted `tenant` claim, per-verb scope matching, method-ARN-scoped Allow, explicit fail-closed Deny | `applications/lambdas/lambda-authorizer-fhir/`, found in-tree |

`COMPAT` states the consequence exactly: *"A consumer cannot choose client behavior
against three positions."*

**Why this is a threat-model finding and not merely an integration inconvenience
(INFERENCE, from the three sides above plus `PROMPT:107` and `PROMPT:451`):**

1. A consumer that guesses wrong builds a client that either **fails closed and cannot
   integrate**, or **fails open** — e.g. implements bearer-token-only against an endpoint
   that is actually reachable over an internal ALB described as `sem WAF e sem rate-limit`
   (`DOSSIER` Layer 2 item 2). The second outcome is THR-0027 and THR-0018.
2. `PROMPT:107` warns that an AMH FHIR access procedure contains **illustrative
   authentication pseudocode that must not be imported as an implemented control.** A
   three-way contradiction is precisely the condition under which a team imports the
   most convenient of the three descriptions as if it were the deployed one.
3. It compounds with **IDN-C-5** (`IDN-CONTRA` §2): two AMH documents describe two
   *different* tenant-enforcement mechanisms for the same server, and one of them
   advertises a `cross_tenant_authorized=true` bypass claim that the other's configuration
   (`allow_references_across_partitions: false`, URL-derived partition, client-supplied
   partition headers rejected with 403) gives no evident way to express. **If a
   cross-tenant bypass claim is real and deployed, it is a cross-tenant authorization
   surface V2 would be consuming without knowing it exists** → THR-0018.
4. **Which of the three is deployed is Layer 2 evidence, and Layer 2 has none**
   (`DOSSIER`: no environment accessed, no endpoint contacted, no `/metadata` retrieved).
   `PROMPT:451` already requires V2 to *test* the URL/claim equality rule empirically
   rather than trust any description of it.

**This model does not resolve the contradiction.** Resolution is an AMH-owner act
(`AUTH-AMH-OWNER`, `UNASSIGNED`, `BLK-0010`). It is recorded as an **open trust-boundary
defect** that blocks any V2 authentication design against TB-05, and it is the reason
THR-0018/THR-0027/THR-0046 cannot be down-prioritised on the argument that "AMH handles
auth."

### 2.2 TB-06, in detail: a boundary with an undecided far side

The candidate topology assumes "identity-aware edge or BFF with OIDC/SMART-compatible
session handling" (`PROMPT:602`). **No identity provider is selected.** `PROMPT:650`
lists the authentication/session and machine-to-machine identity ADR as required and
unwritten.

**INFERENCE (from `PROMPT:602`, `PROMPT:650`, `HAZLOG` HAZ-0014, and `SAFREQ` SAF-0007):**
the most severe identity threat in this model — THR-0021, fail-open identity — is
*specifically* a property of how the undecided boundary is implemented, and the legacy
system's recorded failure was exactly this ("IAM validation falls back to local JWT on
any error", `HAZLOG` HAZ-0014 citing `LEGACY-TA:513`). The threat therefore precedes the
decision and must constrain it. **Recorded as a required input to ADR 15** (`PROMPT:650`),
not as a finding awaiting an architecture.

### 2.3 Boundaries deliberately *not* modelled, and why

- **V2 ↔ analytics/outcomes consumers.** `PROMPT:576` foresees a purpose-approved,
  minimized outcomes surface. No consumer, purpose, or minimization policy exists; the
  boundary would be entirely hypothetical. Listed in §11 as an open item.
- **V2 ↔ writeback into AMH or a source EMR.** `PROMPT:473` lists writeback as a
  *candidate, not pre-approved* contract. Modelling it now would imply it is planned.
- **Physical/facility and endpoint-device boundaries** (shared ICU workstations, screen
  visibility, device loss). Real, and materially relevant to a bedside product — but they
  depend on deployment context that does not exist and on `AUTH-OPERATIONS`, who is
  unnamed. §11 open item.
- **Legacy IntensiCare.** Mounted read-only, never modified, no runtime relationship
  (`PROMPT:114`). It is an evidence source, not a boundary.

---

## 3. Reading the threat tables

Every row carries: **ID · Boundary · STRIDE/L/A class · Actor class · Path · Impact and
clinical harm pathway (with `HAZ` link) · Candidate controls (`SEC`) · Priority.**
Every row is `Status = OPEN`, `Owner = UNASSIGNED — VALIDATION REQUIRED` — stated once
here rather than repeated 67 times.

**Priority definitions (PROPOSAL).** These are triage bands, not risk classes:

| Band | Definition |
|---|---|
| **P0** | Realization plausibly yields, in one step: cross-tenant or cross-legal-entity PHI disclosure; an unauthenticated or impersonated clinical session; or systematically wrong clinical output across a population. Gate G6 requires P0 findings closed or accepted (`PROMPT:772`). |
| **P1** | Serious harm to one patient or one unit, or a P0 outcome requiring an additional precondition (a second compromise, a specific misconfiguration, an insider). Also G6-gating. |
| **P2** | Real, but bounded in blast radius, or contingent on a design decision not yet made. **P2 does not mean acceptable** — it means the ordering of work, not the ordering of importance. |

---

## 4. Threat catalogue

### 4.A — Wrong patient / encounter / tenant / unit association (`PROMPT:752`)

| THR | TB | Class | Actor | Path | Impact and clinical harm pathway | HAZ | Candidate SEC | Pri |
|---|---|---|---|---|---|---|---|---|
| **THR-0001** | TB-02 | S, E | `AUTH` | A caller supplies tenant/organization context in a header, query parameter, body field, JWT claim it can influence, or a subdomain, and the server uses it — or "validates" it by comparing it to itself | Clinical facts, rules, and alerts cross an organizational boundary. PHI disclosure to another legal entity **and** clinical action taken under another organization's rule configuration. The legacy system implemented exactly this: "Caller header wins; equality check is tautological" | **HAZ-0003** `joint` | SEC-0001, SEC-0002, SEC-0009, SEC-0003 | **P0** |
| **THR-0002** | TB-02, TB-03 | I, E | `AUTH`, `SYS` | One query, repository method, cache key, projection, event topic, subscription, export job, or admin endpoint omits the tenant predicate. No adversary is required — a single unscoped `SELECT` suffices | A clinician or automated consumer reads another organization's patients. Clinical action informed by another organization's patients; PHI disclosure across legal entities | **HAZ-0013** `joint` | SEC-0009, SEC-0001, SEC-0003, SEC-0033 | **P0** |
| **THR-0003** | TB-05 | S, L | `SYS`, `AUTH` | Subject resolution joins records because an identifier value matches — CPF, `mpi_id`, name+DOB — across tenants, clinical PJs, or source partitions. `IDN-CONTRA` records five unresolved axes on exactly what `mpi_id` scopes to | Observations, evaluations, or alerts attach to the wrong patient: unnecessary intervention on one patient, missed deterioration on another. Also a privacy threat: cross-PJ re-identification | **HAZ-0001**, HAZ-0027 | SEC-0010, SEC-0001, SEC-0026, SEC-0003 | **P0** |
| **THR-0004** | TB-02 | E, I | `AUTH` | Direct object reference on an encounter, alert, patient, or bed identifier that is guessable or enumerable, with authorization checked at the route but not at the resource | A clinical fact is read from, or attached to, the wrong episode of care; an alert fires against a discharged episode or is filed under a closed encounter and never surfaces | HAZ-0002, HAZ-0013 | SEC-0003, SEC-0009, SEC-0033 | **P1** |
| **THR-0005** | TB-05, TB-04 | T | `EXT`, `SYS` | Bed/care-unit/location assignment arrives on a feed with weaker authentication than clinical data, or is stale, and is trusted for routing | Response is dispatched to the wrong bedside; time is lost during a time-critical deterioration. A "location" feed is a *clinical* feed and inherits clinical trust requirements | HAZ-0004 | SEC-0026, SEC-0002, SEC-0022 | **P1** |

### 4.B — Missing / stale / invalid / conflicting / corrected data as an integrity threat (`PROMPT:753`)

Treating this bullet as a *threat* class, not only a data-quality concern, is deliberate:
the property at risk is **integrity of clinical meaning**, and it can be lost with or
without an adversary. `HAZ-0005` is the failure that actually occurred in the predecessor
system.

| THR | TB | Class | Actor | Path | Impact and clinical harm pathway | HAZ | Candidate SEC | Pri |
|---|---|---|---|---|---|---|---|---|
| **THR-0006** | TB-05, TB-04 | T | `SYS`, `AUTH` | An upstream (faulty, degraded, or hostile) supplies empty, partial, or all-null payloads and a downstream path coerces absence to a value — `0`, a midpoint, "normal", or a last-known value. AMH's own measured Gold sweep found 21 empty tables and 21 tables with entirely null business columns (`PROMPT:103`) | **False reassurance.** A patient who was never assessed is displayed as normal and de-prioritised on the bed grid; deterioration is missed. This is the single highest-priority clinical failure in the hazard log | **HAZ-0005**, HAZ-0039 | SEC-0026, SEC-0040, SEC-0021 | **P0** |
| **THR-0007** | TB-05, TB-03 | T, D | `SYS`, `AUTH` | An old value is re-presented, cached, or replayed such that it passes a freshness gate — or the freshness gate reads receipt time rather than preserved source clinical time | A stale value is scored as current. Displayed acuity reflects a state the patient has already left; deterioration since the last measurement is invisible | HAZ-0006 | SEC-0024, SEC-0021, SEC-0026 | **P1** |
| **THR-0008** | TB-05 | T | `SYS`, `INS` | A correction, amendment, cancellation, or supersession is dropped at the boundary, silently overwrites history, or is applied without retracting derived evaluations and alerts | The alert derived from an erroneous value remains unretracted; the audit trail cannot reconstruct what the clinician actually saw. Also destroys forensic capability for any later investigation | HAZ-0008, HAZ-0035 | SEC-0026, SEC-0032, SEC-0027 | **P1** |
| **THR-0009** | TB-05 | T | `SYS`, `AUTH` | An unrecognised code or a non-canonical unit string is coerced to a default or nearest match instead of quarantined. AMH's own unit validator was observed failing on three non-canonical `unit='anyOf:'` values (`HAZLOG` HAZ-0032) | A value is evaluated in the wrong unit or under the wrong concept: a normal value scores critical, or a critical value scores normal | HAZ-0032 | SEC-0025, SEC-0026, SEC-0040 | **P1** |
| **THR-0010** | TB-05, TB-04 | S, T | `SYS`, `AUTH` | A source timestamp is absent or malformed and the system substitutes receipt time ("now"); or a timestamp is attacker-influenced on an insufficiently authenticated feed | An hours-old observation appears current; a clinician judges trend and acuity on a fabricated time. Forging *time* forges *freshness*, which is the property every safety gate keys on | HAZ-0007, HAZ-0026 | SEC-0024, SEC-0026, SEC-0022 | **P1** |

### 4.C — Duplicate / delayed / reordered / replayed / lost input, event, or command (`PROMPT:754`)

| THR | TB | Class | Actor | Path | Impact and clinical harm pathway | HAZ | Candidate SEC | Pri |
|---|---|---|---|---|---|---|---|---|
| **THR-0011** | TB-04, TB-02 | T, S | `AUTH`, `SYS` | A message or command is replayed — by at-least-once transport, by retry, or deliberately — and the idempotency key is absent, process-local, or derived from mutable/patient data rather than message identity | Duplicate clinical facts persist; double-counted trends; duplicate alerts and alarm fatigue; a duplicated *command* re-executes a clinical state transition. The legacy system's patient-derived fallback key also caused the inverse: **distinct messages mistaken for replays and dropped** | HAZ-0009, HAZ-0016, HAZ-0023 | SEC-0021, SEC-0027, SEC-0022 | **P1** |
| **THR-0012** | TB-04 | D | `SYS` | Ingest acknowledges before the durability boundary, or a non-durable queue drops the message on restart, eviction, or backpressure | The clinical fact is silently lost. Evaluation runs on an incomplete record and reports a reassuring result **that no human knows is incomplete** | HAZ-0012 | SEC-0023, SEC-0021, SEC-0026 | **P1** |
| **THR-0013** | TB-04 | T | `SYS` | Partitioned or multi-lane delivery presents observations out of chronological order; a superseded older value overwrites a newer one | The patient's direction of travel is inverted: improving reads as deteriorating, or deteriorating reads as improving | HAZ-0011 | SEC-0021, SEC-0024, SEC-0026 | **P1** |
| **THR-0014** | TB-04, TB-05, TB-07 | D | `EXT`, `AUTH`, `SYS` | Volumetric flood, an expensive-query amplification, a replay-storm, or an upstream backlog saturates the ingest, evaluation, or delivery lane. Note the internal ALB path AMH describes as `sem WAF e sem rate-limit` (`DOSSIER`) | Alerts arrive after the intervention window closes, or not at all. **Availability of the safety loop is a clinical-safety property, not an ops metric** | HAZ-0010, HAZ-0017 | SEC-0050, SEC-0049, SEC-0034 | **P1** |
| **THR-0015** | TB-04 | S, T, E | `INS`, `AUTH` | Anything able to publish to the internal stream/outbox topic — a compromised worker, an over-broad IAM role, an untrusted producer, a mis-scoped test harness — injects a fabricated observation, evaluation, or alert event | Fabricated clinical facts enter the record with the authority of the system. Downstream this is indistinguishable from a genuine measurement: an alert on a patient who is fine, or a suppressed picture of a patient who is not | HAZ-0001, HAZ-0005, HAZ-0013 | SEC-0022, SEC-0002, SEC-0003, SEC-0032 | **P0** |

### 4.D — Cross-tenant access and inference (`PROMPT:755`)

| THR | TB | Class | Actor | Path | Impact and clinical harm pathway | HAZ | Candidate SEC | Pri |
|---|---|---|---|---|---|---|---|---|
| **THR-0016** | TB-07 | I, E | `AUTH` | A WebSocket/SSE subscription, channel, or topic is authorized only by *authentication*, not by tenant/patient/resource scope. The legacy system did exactly this: "any authenticated consumer may receive an overbroad firehose" | Continuous cross-tenant PHI stream to an authenticated but unauthorized consumer. Real-time surfaces leak *continuously*, unlike a single request | **HAZ-0013** `joint`, HAZ-0018 | SEC-0009, SEC-0003, SEC-0002, SEC-0033 | **P0** |
| **THR-0017** | TB-02, TB-03 | L, I | `AUTH` | Aggregate counts, unit-level summaries, search result totals, autocomplete, error-code differences (404 vs 403), or response-timing differences reveal the existence and attributes of records in another tenant, without ever returning a record | Cross-tenant **inference** — expressly named in `PROMPT:755`. Existence of a patient at a competing institution is itself disclosure; census and acuity distributions are commercially and personally sensitive | **HAZ-0013** `joint` | SEC-0009, SEC-0033, SEC-0016, SEC-0003 | **P1** |
| **THR-0018** | TB-05 | E, I | `AUTH`, `SYS` | A cross-partition FHIR reference is followed, or a `cross_tenant_authorized=true` style bypass claim exists and is honoured, or the token-tenant/URL-partition equality check is not actually deployed as documented. **IDN-C-5 records two AMH documents describing two different mechanisms for the same server, one advertising a bypass the other cannot express** | V2 consumes another PJ's clinical data believing it is consuming its own, or is *itself* the confused deputy that widens an AMH bypass. Cross-legal-entity PHI disclosure with V2 as the vector | **HAZ-0003** `joint`, **HAZ-0013** `joint` | SEC-0001, SEC-0009, SEC-0002, SEC-0010 | **P0** |
| **THR-0019** | TB-03 | I | `SYS` | A shared cache, memoization layer, connection-pooled session variable, or projection keyed without tenant returns tenant A's data to tenant B — including after a deploy, a key collision, or a cache warm | Silent cross-tenant read with no request-level trace. Especially insidious because it is intermittent and will not reproduce in a single-tenant test | **HAZ-0013** `joint` | SEC-0009, SEC-0019, SEC-0033 | **P1** |
| **THR-0020** | TB-03, TB-05 | L | `SYS`, `INS` | V2 accumulates, caches, or derives a cross-PJ / cross-tenant correspondence structure — even incidentally, e.g. a dedup table, an MPI cache, a "same person" heuristic, or an analytics join | V2 becomes the uncontrolled copy of a structure AMH deliberately isolated behind a dedicated role and a **pending legal opinion** (`IDP-09`; ADR-043's index "roda com role dedicada" and does not persist attributes). Re-identification across legal entities with no legal basis and no owner | HAZ-0003, HAZ-0013 | SEC-0010, SEC-0016, SEC-0020 | **P0** |

### 4.E — Excessive privilege, issuer confusion, token leakage, session expiry, fail-open identity (`PROMPT:756`)

| THR | TB | Class | Actor | Path | Impact and clinical harm pathway | HAZ | Candidate SEC | Pri |
|---|---|---|---|---|---|---|---|---|
| **THR-0021** | TB-06, TB-01 | S, E | `EXT` | Identity validation **fails open**: on JWKS fetch failure, network error, parse error, clock skew, or unknown issuer, the code path falls back to a local/weaker issuer, a cached decision, or "allow". Recorded as implemented legacy behaviour: "IAM validation falls back to local JWT on any error" | An unauthenticated principal obtains a clinical session. Unauthorised PHI access **and unauthorised clinical actions attributed to a legitimate clinician** — which also destroys the audit trail's meaning | **HAZ-0014** `joint` | SEC-0004, SEC-0001, SEC-0002, SEC-0049 | **P0** |
| **THR-0022** | TB-06, TB-05 | S, E | `EXT`, `AUTH` | Issuer or audience confusion: a token minted by a different issuer, for a different audience, for a different tenant, or for a different environment (dev token against pilot) is accepted because `iss`/`aud`/`tenant` are unchecked, checked loosely, or checked after use | Impersonation across environments or tenants. Compounded at TB-05 by the three-way auth contradiction: a consumer that cannot tell which issuer is authoritative cannot pin one | **HAZ-0014** `joint`, HAZ-0003 | SEC-0004, SEC-0001, SEC-0002 | **P0** |
| **THR-0023** | TB-01, TB-10 | I, S | `EXT`, `SYS` | Tokens travel in URLs (browser history, `Referer`, proxy logs, screenshots, shared links), in non-`Secure`/non-`HttpOnly` cookies, or are written to application logs and traces. Legacy: "cookies not Secure, URL tokens" | Session theft → full clinical session as the victim clinician. This is also the highest-frequency *accidental* leak path, and it lands in TB-10 where retention is long and audience is wide | **HAZ-0014** `joint`, **HAZ-0028** `joint` | SEC-0005, SEC-0015, SEC-0014 | **P1** |
| **THR-0024** | TB-01, TB-06 | S | `EXT`, `AUTH` | Session/refresh handling flaws: the refresh predecessor stays valid after rotation, sessions never expire, logout does not revoke server-side, or session fixation is possible. Legacy: "refresh predecessor remains valid" | A stolen or previously-issued token remains usable indefinitely; revocation is not actually revocation. Removes the only compensating control after any token leak | **HAZ-0014** `joint` | SEC-0005, SEC-0004, SEC-0008 | **P1** |
| **THR-0025** | TB-01, TB-02 | E | `AUTH`, `INS` | Over-broad scopes or roles; role creep across rotations; break-glass/emergency access with no time-box, no second authorization, no automatic expiry, and no loud audit; support tooling with standing production PHI access | Standing excessive privilege converts any single account compromise into a bulk PHI incident, and makes insider misuse indistinguishable from normal work | HAZ-0014, HAZ-0035 | SEC-0003, SEC-0007, SEC-0008, SEC-0032 | **P1** |
| **THR-0026** | TB-02, TB-06, TB-08 | E | `AUTH`, `SYS` | **Confused deputy.** A service, worker, BFF, or MCP server holds a broad workload identity and performs actions "on behalf of" a caller without carrying that caller's tenant, purpose, and resource scope into the downstream call | The downstream sees a trusted internal identity and applies no user-level authorization. This is how a correctly-authenticated user reads data they are not entitled to, with every individual component behaving "correctly" | **HAZ-0013** `joint`, HAZ-0003 | SEC-0006, SEC-0002, SEC-0001, SEC-0003 | **P0** |
| **THR-0027** | TB-05, TB-09 | S, I | `EXT`, `INS` | The machine-to-machine credential V2 uses against AMH (client secret, private key, mTLS cert, or IAM role) is exfiltrated from CI, an image layer, a config store, a log, or a developer machine — or is over-scoped for the pathways actually approved | Bulk PHI retrieval from AMH under V2's identity, at V2's authorization level, against an endpoint whose actual rate-limiting and WAF posture is unknown (`DOSSIER` Layer 2 item 2) | **HAZ-0013** `joint`, **HAZ-0028** `joint` | SEC-0014, SEC-0013, SEC-0011, SEC-0003, SEC-0033 | **P0** |

### 4.F — PHI in logs, prompts, traces, queues, caches, exports, notifications, backups, screenshots, support (`PROMPT:757`)

`PROMPT:757` enumerates ten surfaces. Each gets its own threat because each has a
different owner, a different retention, and a different audience — a single "PHI leakage"
row would hide that.

| THR | TB | Class | Actor | Path | Impact and clinical harm pathway | HAZ | Candidate SEC | Pri |
|---|---|---|---|---|---|---|---|---|
| **THR-0028** | TB-10 | I | `SYS` | PHI and identifiers written to application logs, distributed traces, metric labels/cardinality, or exception/error response bodies. Legacy: "Logs include MPI identifiers and clinical values"; health responses included exception class and message | Clinical data leaves its purpose and residency boundary into a system with weaker access control and longer retention. **No clinical benefit offsets it** | **HAZ-0028** `joint` | SEC-0015, SEC-0016, SEC-0032 | **P1** |
| **THR-0029** | TB-08, TB-10 | I | `SYS`, `AUTH` | PHI placed into model prompts, MCP tool arguments/results, agent-to-agent messages, or requests to a model provider — including "just for debugging" and including in *this* repository's own agent workflows (`PROMPT:124` rule 12 names agent messages explicitly) | PHI crosses an organizational **and possibly national** boundary to a third-party processor with no contract, no residency determination, and no legal basis established. Determination of what that means legally is `VALIDATION REQUIRED`, owner `AUTH-PRIVACY-LEGAL` | **HAZ-0028** `joint`, **HAZ-0029** `joint` | SEC-0046, SEC-0016, SEC-0015, SEC-0017 | **P0** |
| **THR-0030** | TB-09 | I | `SYS`, `INS` | Real patient data in fixtures, seed files, test recordings, snapshot tests, CI artifacts, screenshots attached to issues, or committed to source control — where it is effectively permanent (git history) | Permanent, widely-readable PHI disclosure that cannot be deleted by policy alone. Directly prohibited by `PROMPT:124` rule 12; partially defended today by the repo's `forbidden-content` gate, which is **content-pattern based and therefore incomplete** | **HAZ-0028** `joint` | SEC-0017, SEC-0014, SEC-0040 | **P1** |
| **THR-0031** | TB-03, TB-04 | I | `SYS` | PHI durably resident in queues, dead-letter queues, quarantine stores, caches, search indexes, or debug dumps — components typically provisioned with weaker encryption, weaker access control, and no retention policy | A quarantine store is, by design, full of the *worst-quality* PHI with the *least* governance. It is the surface most likely to be forgotten in an access review | **HAZ-0028** `joint` | SEC-0012, SEC-0016, SEC-0020, SEC-0008 | **P1** |
| **THR-0032** | TB-07 | I | `SYS` | PHI in outbound notification payloads: SMS/email bodies, push-notification previews rendered on a locked device, pager text, webhook bodies to third parties | Disclosure to anyone in visual range of a locked screen, and to the notification provider as a processor. A notification is the one surface deliberately designed to be seen *outside* the application | **HAZ-0028** `joint` | SEC-0018, SEC-0016, SEC-0046 | **P1** |
| **THR-0033** | TB-11, TB-10 | I | `INS`, `SYS` | PHI in backups, snapshots, DR copies, evidence exports, and support/ticketing workflows — including screen-shares and "send me the record so I can debug it" | Copies of the clinical record proliferate into systems with different controls, different retention, and different (often unlogged) access. Support workflows are the classic uncontrolled disclosure path | **HAZ-0028** `joint`, **HAZ-0034** `joint` | SEC-0012, SEC-0019, SEC-0020, SEC-0047 | **P1** |

### 4.G — Unsafe rule activation, rollback failure, version drift, no-fire opacity, alert suppression (`PROMPT:758`)

TB-12 is a supply chain. Everything in §4.K about code applies here to *clinical
judgement*, on a different lifecycle and with a different approver.

| THR | TB | Class | Actor | Path | Impact and clinical harm pathway | HAZ | Candidate SEC | Pri |
|---|---|---|---|---|---|---|---|---|
| **THR-0034** | TB-12 | T, E | `INS`, `AUTH`, `SYS` | An unapproved, unsigned, malformed, tampered, withdrawn, or author-self-approved rule bundle is activated in a running environment; or signature verification exists but falls back to "load anyway" on error | Patients are evaluated by clinical logic no clinical approver ratified. **Systematically wrong thresholds across an entire unit — harm is correlated, not isolated.** The clinical equivalent of running unsigned code | HAZ-0019 | SEC-0028, SEC-0029, SEC-0030, SEC-0031 | **P0** |
| **THR-0035** | TB-12 | T, D | `SYS` | Rollback fails, or two runtime instances hold different active bundle versions (boot-time sync, stale registry, per-instance cache). Legacy: multiple engine instances, "different instances can hold different suppression/load state" | Different clinicians receive different evaluations for the same patient at the same moment, and a withdrawn rule keeps firing. An identified defect **cannot be stopped** | HAZ-0020 | SEC-0030, SEC-0028, SEC-0049 | **P1** |
| **THR-0036** | TB-12 | D, E | `AUTH`, `INS`, `SYS` | The per-bundle kill switch either does not exist / requires a deploy (cannot stop harm), **or** is reachable without strong authorization and audit (an attacker or a mistaken operator silently disables a pathway) | Both failure directions are clinical: an un-stoppable bad rule, or a silently disabled good one. A disabled pathway must produce explicit `not_evaluated`, never a silent no-fire | HAZ-0020, HAZ-0021 | SEC-0030, SEC-0003, SEC-0032, SEC-0007 | **P1** |
| **THR-0037** | TB-12 | R | `SYS` | A rule does not run, or runs and does not fire, and no immutable record captures **why**. Legacy: "No immutable evaluation record captures why a rule did not run or did not fire" | A no-fire is indistinguishable from a negative evaluation. Nobody can tell whether a patient was assessed and found well, or never assessed at all — and **the same defect recurs undetected across every patient**. Also defeats every post-incident investigation | HAZ-0021, HAZ-0035 | SEC-0032, SEC-0028, SEC-0034 | **P0** |
| **THR-0038** | TB-12, TB-07 | T, A | `INS`, `AUTH` | Suppression, cooldown, dedup, grouping, or routing configuration is modified — deliberately or by error — to silence alerts for a patient, a unit, or a time window, with no visibility to clinicians and no audit of the config change | A recurring or escalating condition is silently withheld; the clinician believes the condition resolved because the alerts stopped. This is the most plausible **malicious-insider clinical** attack in the model, and the hardest to detect after the fact | HAZ-0022, HAZ-0018 | SEC-0032, SEC-0003, SEC-0033, SEC-0034 | **P1** |

### 4.H — Missed, duplicated, delayed, misrouted, never-displayed alerts (`PROMPT:759`)

| THR | TB | Class | Actor | Path | Impact and clinical harm pathway | HAZ | Candidate SEC | Pri |
|---|---|---|---|---|---|---|---|---|
| **THR-0039** | TB-07, TB-04 | D | `SYS` | An alert is generated and durably stored but never rendered to any human: process-local fan-out, dropped socket, client never reconnects, unauthorized channel, or a pod that owns the connection and not the event. **And no monitor detects the gap** | **Generated ≠ displayed.** The deterioration the system correctly detected is never acted on, while the audit record shows a "successful" alert nobody saw. Legacy: "Broadcasts are lost across processes/pods; worker events never reach endpoint-owned connections" | **HAZ-0015** | SEC-0023, SEC-0034, SEC-0049 | **P0** |
| **THR-0040** | TB-07 | T, I | `AUTH`, `INS`, `SYS` | Alert-routing configuration is wrong or tampered: sent to the wrong unit/role/on-call target, or to an over-broad "firehose" audience. Legacy: alert-routing CRUD required only authentication, for an arbitrary tenant | Nobody with responsibility receives it, or everyone receives everything → diffusion of responsibility, nobody acts. The over-broad direction is simultaneously a cross-tenant disclosure (THR-0016) | HAZ-0018, HAZ-0013 | SEC-0003, SEC-0009, SEC-0032, SEC-0034 | **P1** |
| **THR-0041** | TB-07 | S, D | `EXT`, `SYS` | An external notification channel is spoofed (a fabricated "IntensiCare alert" SMS/email), compromised at the provider, or unavailable — and V2 treats channel acceptance as delivery | Clinicians act on a **fabricated clinical alert**, or are unknowingly not covered because the provider silently dropped the message. Provider acceptance is not human receipt | HAZ-0015, HAZ-0018, HAZ-0029 | SEC-0034, SEC-0018, SEC-0011, SEC-0002, SEC-0022 | **P1** |
| **THR-0042** | TB-07 | D | `EXT`, `AUTH`, `SYS` | Real-time gateway connection exhaustion, unbounded per-connection queues, reconnect-storm after a deploy, or replay backlog on resume cursors | Alerts arrive after the clinical response window has closed — and may actively mislead by describing a state that has already changed | HAZ-0017, HAZ-0015 | SEC-0050, SEC-0034, SEC-0049, SEC-0023 | **P1** |

### 4.I — Concurrent human actions and ambiguous responsibility (`PROMPT:760`)

| THR | TB | Class | Actor | Path | Impact and clinical harm pathway | HAZ | Candidate SEC | Pri |
|---|---|---|---|---|---|---|---|---|
| **THR-0043** | TB-01, TB-02 | T | `SYS` | Two clinicians transition the same alert concurrently with no optimistic-concurrency token; last write wins. Legacy IC-009: "state mutations lack locking/versioning/idempotency" | One transition silently overwrites the other. The alert appears handled while the actual responder's assignment, rationale, or escalation is discarded — **the patient is left unattended by both** | HAZ-0023, HAZ-0024 | SEC-0027, SEC-0021, SEC-0032 | **P1** |
| **THR-0044** | TB-01, TB-02 | R | `AUTH`, `SYS` | Actor identity is absent, shared (a ward account), or not bound to the transition record; alert transitions are not audited. Legacy: "alert transitions are not audited"; "resolve actor is absent" | **Repudiation.** No one can establish who acknowledged, overrode, escalated, or closed — during a safety investigation or a clinical dispute. Shared accounts also defeat every access review and every anomaly detection built on identity | HAZ-0023, **HAZ-0035** | SEC-0032, SEC-0027, SEC-0008, SEC-0003 | **P1** |
| **THR-0045** | TB-01, TB-02 | T, A | `SYS` | A bulk/group action issues sequential per-item requests; one fails mid-sequence; the UI retains a stale optimistic aggregate | A subset of alerts is silently abandoned in a safety-relevant queue while the queue reports itself handled | HAZ-0033 | SEC-0027, SEC-0021, SEC-0049 | **P2** |

### 4.J — Integration outage, terminology drift, MPI merge/unmerge, clock skew, correction (`PROMPT:761`)

| THR | TB | Class | Actor | Path | Impact and clinical harm pathway | HAZ | Candidate SEC | Pri |
|---|---|---|---|---|---|---|---|---|
| **THR-0046** | TB-05 | D | `SYS`, `EXT` | AMH is unavailable, degraded, rate-limits, or **changes its authentication model** (the three-way contradiction of §2.1 means V2 cannot know which model it is coupled to) — while V2 readiness continues to report healthy. Legacy: "Readiness can still be falsely positive" | The bed grid keeps showing last-known values with no degraded indication. **Clinicians trust a frozen board and stop performing the manual surveillance the board replaced.** Availability failure presented as normality | HAZ-0025, HAZ-0010 | SEC-0049, SEC-0034, SEC-0002 | **P0** |
| **THR-0047** | TB-05 | T | `SYS` | Terminology, value-set, or profile versions drift at the boundary without detection: LOINC/SNOMED/UCUM version change, a profile tightening, or a producer emitting a shape the profile forbids. `DOSSIER` C-4 records exactly this in AMH's own plan: an Observation emitting `code = {text: ...}` and `valueString` against a profile that binds `code` to a LOINC ValueSet and fixes UCUM on `valueQuantity` | Values are silently reinterpreted under different semantics; **a numeric threshold rule cannot consume a `valueString`**, so a pathway either breaks loudly or, worse, coerces (THR-0009) | HAZ-0032, HAZ-0040 | SEC-0025, SEC-0026, SEC-0038 | **P1** |
| **THR-0048** | TB-05 | T, L | `SYS` | An upstream MPI merge or unmerge is replayed into V2 and prior observations, evaluations, and open alerts are not re-associated — or are wrongly re-associated **across a tenant boundary**. `IDN-CONTRA` records five unresolved axes on MPI scope | Clinical history is split or wrongly joined; a clinician sees a partial history and judges stability the full record contradicts. The cross-tenant re-association direction is simultaneously a THR-0003/THR-0020 privacy event | HAZ-0027, HAZ-0003 | SEC-0010, SEC-0001, SEC-0026, SEC-0032 | **P1** |
| **THR-0049** | TB-03, TB-04, TB-09 | T, R | `SYS`, `INS` | Host/NTP clock skew, unauthenticated time sources, DST ambiguity in `America/Sao_Paulo`, or a container with a drifting clock — affecting freshness gates, token expiry validation, ordering, **and audit-record ordering** | A stale value passes a freshness gate or a current value is rejected as stale; expired tokens validate; the audit trail's ordering — the basis of every reconstruction — becomes untrustworthy | HAZ-0026, HAZ-0035, HAZ-0014 | SEC-0024, SEC-0032, SEC-0004 | **P1** |

### 4.K — Supply-chain compromise, secret/key loss, malicious dependency, artifact substitution (`PROMPT:762`)

**These seven threats discharge hazard-log coverage gap G-1.** `HAZLOG` §4 declared supply
chain deliberately unseeded, stating that its *clinical* harm pathway runs through hazards
already logged, and handed the threat IDs to this document. The `HAZ` column below is the
requested linkage; §9.2 states it as an integration instruction.

| THR | TB | Class | Actor | Path | Impact and clinical harm pathway | HAZ | Candidate SEC | Pri |
|---|---|---|---|---|---|---|---|---|
| **THR-0050** | TB-09 | T, E | `EXT` | A malicious, typosquatted, hijacked-maintainer, or compromised transitive dependency enters the build graph; or a post-install/build script executes in CI | Attacker code runs **inside the deterministic safety kernel's process**. It can alter a score, suppress a fire, exfiltrate PHI, or read the tenant context — and the resulting clinical output is indistinguishable from correct output. Clinical pathway: → HAZ-0019 (evaluation by logic no one ratified), → HAZ-0028 (exfiltration), → HAZ-0013 (tenant-context read) | HAZ-0019, HAZ-0028, HAZ-0013 | SEC-0036, SEC-0037, SEC-0039, SEC-0040 | **P0** |
| **THR-0051** | TB-09 | T, S | `INS`, `EXT` | The artifact deployed is not the artifact built: unsigned images, mutable tags (`latest`), no digest pinning at deploy, an unverified registry, or a compromised registry serving a substituted layer. `PROMPT:864` forbids `latest`, placeholder secrets, and unpinned actions outright | Arbitrary substituted clinical logic reaches patients under a green release record. Clinical pathway: → HAZ-0019, → HAZ-0013, → HAZ-0028 | HAZ-0019, HAZ-0013, HAZ-0028 | SEC-0038, SEC-0028, SEC-0039 | **P0** |
| **THR-0052** | TB-09 | E, I | `EXT`, `AUTH` | CI/CD pipeline compromise: an unpinned or hijacked action, a workflow trigger reachable from a fork/untrusted PR with access to secrets, script injection through PR metadata, a long-lived over-scoped CI token, or a shared/persistent runner | The build system holds production authority: pipeline compromise **is** production compromise, and it also grants the secrets in TB-05 and TB-11. Clinical pathway: → HAZ-0019, → HAZ-0028, → HAZ-0013 | HAZ-0019, HAZ-0028, HAZ-0013 | SEC-0039, SEC-0014, SEC-0003, SEC-0032 | **P0** |
| **THR-0053** | TB-09, TB-11 | S, I | `INS`, `EXT`, `SYS` | Secret or key loss/exposure: signing key, data-encryption key, AMH client credential, database credential — committed, logged, baked into an image layer, left in a runner cache, or simply **lost** (no rotation, no escrow, no custodian separation) | Exposure → impersonation and bulk disclosure (THR-0027). **Loss** → an unrecoverable clinical record or an unverifiable audit trail, which is a restore failure with clinical consequences. Clinical pathway: → HAZ-0028, → HAZ-0013, → HAZ-0034 | HAZ-0028, HAZ-0013, HAZ-0034 | SEC-0013, SEC-0014, SEC-0047, SEC-0012 | **P0** |
| **THR-0054** | TB-09 | T | `EXT`, `SYS` | Compromised or unmaintained base image / runtime layer / build toolchain; an unpinned toolchain producing non-reproducible builds so substitution cannot be detected by comparison | Same execution position as THR-0050, below the application's own dependency review. Clinical pathway: → HAZ-0019, → HAZ-0013 | HAZ-0019, HAZ-0013 | SEC-0036, SEC-0037, SEC-0038, SEC-0039 | **P1** |
| **THR-0055** | TB-09 | D, A | `SYS`, `INS` | A security or safety gate is advisory, `continue-on-error`, self-skipping, excluded, or **validates zero cases and reports green**. Observed precedent at AMH: only `Security Gate` is required and several demonstration workflows were red while not blocking (`PROMPT:106`, `docs/14-devsecops-and-delivery/ci-policy.md` §3). **In this repository today, branch protection is not configured at all**, so both existing gates can be merged past | Every other control in this catalogue becomes unenforced simultaneously. A false-green gate is worse than no gate: it manufactures evidence of verification that did not occur. Clinical pathway: → HAZ-0031, → HAZ-0019 | HAZ-0031, HAZ-0019 | SEC-0040, SEC-0037, SEC-0039 | **P0** |
| **THR-0056** | TB-12, TB-09 | T | `INS`, `AUTH` | The clinical-content supply chain is compromised at the *evidence* layer: reference vectors, test packs, terminology snapshots, or approval records are tampered with so that a defective bundle passes its own gate | A bad rule bundle arrives carrying apparently valid proof of correctness. The verification artifact and the artifact under verification share a trust root. Clinical pathway: → HAZ-0019, → HAZ-0031 | HAZ-0019, HAZ-0031 | SEC-0031, SEC-0029, SEC-0028, SEC-0032 | **P1** |

### 4.L — Backup corruption, failed restore, partial outage, reconciliation after downtime (`PROMPT:763`)

| THR | TB | Class | Actor | Path | Impact and clinical harm pathway | HAZ | Candidate SEC | Pri |
|---|---|---|---|---|---|---|---|---|
| **THR-0057** | TB-11 | T, D | `SYS` | Backups are corrupt, incomplete, encrypted with an unavailable key, or have never been restore-tested. Legacy: "The DR document explicitly describes resources as not yet provisioned… No backup restore evidence, recovery-time measurement, multi-AZ failure test, migration rollback drill, or downtime clinical procedure was found" | After an outage the clinical record is incomplete or divergent **and nobody knows which facts are missing**. Clinicians resume work on a silently incomplete record | **HAZ-0034** `joint` | SEC-0047, SEC-0048, SEC-0013 | **P1** |
| **THR-0058** | TB-11 | D, T | `EXT`, `INS` | Destructive attack or destructive insider action (ransomware, mass deletion) where backups are reachable from the same credential, network, or account as production — no immutability, no isolation | Total loss of the clinical record during active patient care, with no recovery path. The availability failure *is* the clinical harm | **HAZ-0034** `joint`, HAZ-0025 | SEC-0047, SEC-0003, SEC-0035, SEC-0013 | **P1** |
| **THR-0059** | TB-11, TB-04 | T, D | `SYS` | Partial regional/site/zone outage produces divergent or split-brain state; post-recovery reconciliation is undefined, so alerts generated during the outage are never reconciled and gaps are never surfaced | Clinicians cannot tell what was and was not evaluated during the outage — the specific harm `HAZ-0034` names. Silent gaps are worse than a declared outage | **HAZ-0034** `joint`, HAZ-0025 | SEC-0048, SEC-0049, SEC-0034 | **P1** |
| **THR-0060** | TB-11 | I | `INS`, `AUTH` | A backup, snapshot, or evidence export is restored into a lower environment, a developer machine, or an unapproved region — for debugging, testing, or analytics | Full-fidelity PHI in an environment with development-grade controls and no audit. Also a data-residency event whose legal significance is `VALIDATION REQUIRED`, owner `AUTH-PRIVACY-LEGAL` | **HAZ-0028** `joint`, **HAZ-0034** `joint` | SEC-0020, SEC-0017, SEC-0012, SEC-0003 | **P1** |

### 4.M — MCP / AI prompt injection, exfiltration, unsafe chaining, ungrounded output (`PROMPT:764`, `PROMPT:726-742`)

**Framing (SOURCE `PROMPT:728`, `PROMPT:109`):** MCP is an integration/tool surface — *not*
a clinical source of truth and *not* an authorization boundary — and it is a **new V2
interface**, not inherited AMH compatibility (`DOSSIER` confirms zero MCP material in the
active AMH tree). Every threat below therefore applies to a surface that does not exist
yet and whose ADR (`PROMPT:649`) is unwritten. That is the moment to constrain it.

| THR | TB | Class | Actor | Path | Impact and clinical harm pathway | HAZ | Candidate SEC | Pri |
|---|---|---|---|---|---|---|---|---|
| **THR-0061** | TB-08 | T, E | `EXT` (via content) | **Indirect prompt injection.** Instructions embedded in untrusted clinical content — a nursing note, a scanned document, a device-supplied string, a patient-supplied field, an external report — are read into a model context that does not structurally separate instructions from data | Attacker-influenced text reaches a clinician as if it were system output. The clinician acts on fabricated or manipulated clinical content **that no deterministic evaluation supports**. The injecting party need never touch V2's network | **HAZ-0029** `joint` | SEC-0042, SEC-0041, SEC-0043, SEC-0045 | **P0** |
| **THR-0062** | TB-08 | I | `EXT` (via content), `AUTH` | **Exfiltration through the tool channel.** Injected content instructs the agent to call a tool with PHI in its arguments, embed PHI in a URL/image/markdown link it renders, or write PHI into a lower-trust destination the agent can reach | PHI leaves the boundary through a channel that looks like normal tool use, with no perimeter to cross. Combines THR-0061 with THR-0029 | **HAZ-0029** `joint`, **HAZ-0028** `joint` | SEC-0042, SEC-0046, SEC-0045, SEC-0016 | **P0** |
| **THR-0063** | TB-08 | E | `AUTH`, `SYS` | **Confused deputy on MCP.** The MCP server holds a broad identity and executes tools without carrying the caller's tenant, purpose, and resource scope — precisely what `PROMPT:734` forbids ("enforce the same identity, tenant, purpose, resource, and audit policy as first-party APIs") | Cross-tenant read or write via a surface explicitly declared *not* to be an authorization boundary. A single mis-scoped tool undoes storage-level isolation | **HAZ-0029** `joint`, **HAZ-0013** `joint` | SEC-0006, SEC-0041, SEC-0001, SEC-0009 | **P0** |
| **THR-0064** | TB-08 | E, A | `EXT` (via content), `AUTH` | **Unsafe tool chaining.** A read tool's output becomes another tool's input and the chain reaches a state-changing operation — acknowledging an alert, closing a work item, writing back — without explicit human confirmation. `PROMPT:733` requires read-only by default and prohibits autonomous clinical action unless separately approved | Automation takes a clinical action no accountable human authorized, and the audit trail attributes it to a human's session. Silent expansion of the intended use (`PROMPT:127` rule 15) | **HAZ-0029** `joint`, HAZ-0036, HAZ-0023 | SEC-0044, SEC-0041, SEC-0045, SEC-0027 | **P0** |
| **THR-0065** | TB-08 | T, A | `SYS` | **Ungrounded output.** Model prose is presented alongside or in place of the signed deterministic evaluation record — summarising, restating, "explaining", or contradicting it — without provenance, freshness, or uncertainty. `PROMPT:742`: "never let model-generated prose replace the signed deterministic evaluation record" | A clinician acts on fluent text that no rule bundle produced and no clinical approver ratified. Fluency reads as authority; the ratified evaluation becomes the less prominent artifact | **HAZ-0029** `joint`, HAZ-0036 | SEC-0043, SEC-0041, SEC-0032 | **P0** |
| **THR-0066** | TB-08, TB-04 | T | `SYS`, `AUTH` | MCP is used as an ingestion transport or treated as a system of record — a tool response is persisted as a clinical fact, or a real-time MCP response is the only copy. Expressly excluded by `PROMPT:478` and `PROMPT:121` | Clinical facts enter the record without the ingest path's validation, provenance, quarantine, idempotency, and durability guarantees. Bypasses §4.B and §4.C wholesale | HAZ-0029, HAZ-0012, HAZ-0015 | SEC-0041, SEC-0023, SEC-0026 | **P1** |
| **THR-0067** | TB-08 | L, I | `AUTH` | Cross-tenant inference through the MCP surface: tool responses, shared context windows, conversation history, retrieval caches, or embeddings built across tenants; `PROMPT:741` names cross-tenant inference as a required test | Another tenant's clinical data is inferable from a tool that never returns another tenant's record directly. Retrieval indexes and embeddings are the least-governed copies of the clinical corpus | **HAZ-0013** `joint`, **HAZ-0029** `joint` | SEC-0009, SEC-0041, SEC-0016, SEC-0033 | **P1** |

---

## 5. Priority summary (PROPOSAL — not risk acceptance)

| Priority | Count | THR IDs |
|---|---|---|
| **P0** | 27 | THR-0001, THR-0002, THR-0003, THR-0006, THR-0015, THR-0016, THR-0018, THR-0020, THR-0021, THR-0022, THR-0026, THR-0027, THR-0029, THR-0034, THR-0037, THR-0039, THR-0046, THR-0050, THR-0051, THR-0052, THR-0053, THR-0055, THR-0061, THR-0062, THR-0063, THR-0064, THR-0065 |
| **P1** | 39 | THR-0004, THR-0005, THR-0007..THR-0014, THR-0017, THR-0019, THR-0023, THR-0024, THR-0025, THR-0028, THR-0030..THR-0033, THR-0035, THR-0036, THR-0038, THR-0040, THR-0041, THR-0042, THR-0043, THR-0044, THR-0047, THR-0048, THR-0049, THR-0054, THR-0056..THR-0060, THR-0066, THR-0067 |
| **P2** | 1 | THR-0045 |
| **Total** | **67** | THR-0001..THR-0067 |

> **VALIDATION REQUIRED:** the priority assignment has had **no independent review**.
> `AUTH-SECURITY` is `UNASSIGNED` (`BLK-0003`), and per `PROMPT:197-207` no agent may
> accept its own triage. The concentration of findings in P0/P1 is a property of a system
> with **zero controls in place**, not a claim that 66 items are equally urgent: with no
> control implemented anywhere, almost every threat's inherent path is unobstructed.
> Priorities will need re-triage against each ADR as controls become real.

**Gate G6 consequence (`PROMPT:772`):** G6 requires that "threat-model P0/P1 findings are
closed or accepted." **66 of 67 findings are P0 or P1, and all 67 are OPEN.** No finding
in this document can be closed today because closing requires an implemented, verified
control, and nothing is implemented. See `g6-readiness.md`.

---

## 6. Threats that are architecturally *decidable* right now

**INFERENCE (from §2 boundary evidence and `PROMPT:634-659`):** most threats here cannot
be closed before an architecture exists — but a subset directly constrains ADRs that are
about to be written, and those constraints are cheap now and expensive later. Recorded as
**required threat inputs to the ADR program**, not as decisions:

| ADR (`PROMPT:634-659`) | Threats that must constrain it |
|---|---|
| 3 — tenant/organization/facility and resource-ownership model | THR-0001, THR-0002, THR-0016, THR-0017, THR-0019 |
| 4 — patient/encounter/MPI identity and merge/unmerge | THR-0003, THR-0020, THR-0048 |
| 7 — rule bundle format, signing, approval, activation, rollback | THR-0034, THR-0035, THR-0036, THR-0056 |
| 10 — transaction/outbox/event backbone and delivery guarantees | THR-0011..THR-0015 |
| 11 — read projections and authorized real-time delivery | THR-0016, THR-0039, THR-0042 |
| 14 — MCP exposure, permitted tool classes, human confirmation, PHI policy | THR-0061..THR-0067, THR-0029 |
| 15 — authentication/session and machine-to-machine identity | THR-0021..THR-0027 (TB-06 is undecided — §2.2) |
| 16 — authorization and tenant isolation enforcement | THR-0001..THR-0004, THR-0016..THR-0019, THR-0026 |
| 17 — encryption/key management and searchable PHI tradeoffs | THR-0053, THR-0031, THR-0033, THR-0060 |
| 18 — audit integrity, retention, legal hold, correction, evidence export | THR-0037, THR-0044, THR-0049 |
| 20 — observability, SLOs, readiness, degraded modes, backup, restore, DR | THR-0028, THR-0046, THR-0057..THR-0059 |
| 22 — build, dependency, artifact-signing, software-supply-chain strategy | THR-0050..THR-0056 |

---

## 7. Abuse cases (narrative — the scenarios STRIDE rows compress)

Recorded because the tabular form loses the sequence, and the sequence is what makes these
plausible. All are **hypothetical scenarios about a system that does not exist**.

**AC-1 — The quiet tenant leak.** A projection is added for a new bed-grid widget. Its
query is written against a view that already filters by tenant, so the developer omits the
predicate. A cache is added in front of it, keyed by unit ID — which is unique per
facility but not per tenant. Two customers share a facility naming convention. No test
fails, because every test runs single-tenant. → THR-0002 + THR-0019. **Detection today:
none. The only control that catches this is adversarial multi-tenant testing (SEC-0009),
which Gate G6 requires as evidence and which does not exist.**

**AC-2 — The three-way handshake that never happened.** V2 builds its AMH client from the
CapabilityStatement (OAuth + SMART). Integration testing against `dev` succeeds, because
`dev` is the only environment that exists. At pilot, the deployed path is the internal ALB
with mTLS and no WAF, and the SMART advertisement was aspirational. The team adds a
network-level exception to unblock the pilot. → THR-0022 + THR-0027 + THR-0046. **The root
cause is not a coding error; it is an unresolved contradiction (§2.1) that nobody was
assigned to close.**

**AC-3 — The note that gave instructions.** A referral document is scanned into the source
EMR containing text that reads, in part, as an instruction to an assistant. An MCP tool
summarises the patient's recent documents into a clinician-facing panel. The summary now
contains an instruction-shaped sentence that the model followed: it omits a critical value
and adds a reassuring statement. The clinician reads fluent prose adjacent to a real
evaluation record and does not distinguish them. → THR-0061 + THR-0065. **No V2 component
was compromised. The attack surface was a PDF.**

**AC-4 — The dependency that scored.** A transitive dependency of a date-handling library
is compromised. It runs inside the evaluation process. It does not exfiltrate anything —
it adjusts one comparison boundary in a score by one unit. Reference vectors still pass,
because the vectors were generated after the change and committed by the same pipeline. →
THR-0050 + THR-0056. **This is why THR-0056 exists separately from THR-0050: the
verification artifact and the artifact under verification must not share a trust root.**

**AC-5 — The alert that was suppressed on purpose.** A staff member with routing-config
access adds a suppression rule scoped to one bed for one shift. There is no audit of
configuration changes, and suppression is not visible to the clinician viewing the
patient. The condition escalates. The absence of alerts is read as the absence of a
problem. → THR-0038 + THR-0037. **The insider-clinical threat is the one this model can
least afford to treat as exotic, and the one most cheaply mitigated by SEC-0032 plus the
existing `SAF-0022` transparency requirement.**

---

## 8. What this threat model does NOT establish

1. **No threat here is closed, accepted, mitigated, or verified.** All 67 are OPEN.
2. **No control named in the `SEC` column is implemented.** `security-controls-catalog.md`
   marks every one `PROPOSAL / NOT-IMPLEMENTED`. A control ID in a threat row is a
   *candidate*, not a mitigation.
3. **No compliance statement is made or implied.** LGPD, ANVISA/SaMD, ISO 27001, SOC 2,
   HIPAA — applicability itself is `VALIDATION REQUIRED`, owner `AUTH-PRIVACY-LEGAL`
   (`PROMPT:766`).
4. **No penetration test, no adversarial evidence, no security testing of any kind has
   been performed.** There is nothing to test.
5. **Priorities are not risk ratings** and have had no independent review.
6. **This is not a complete threat model of V2.** It is a threat model of a *candidate*
   topology against a *specified* threat list (`PROMPT:752-764`). It must be re-run
   against the ratified architecture, and again before G7 and G8.
7. **Legacy evidence (`LEGACY-TA` via `HAZLOG`) proves a failure mode is reachable in this
   domain. It proves nothing about V2**, and must not be used to argue V2 is safe merely
   because V2 is greenfield.

---

## 9. THR ↔ HAZ back-links for the clinical safety-case engineer

**This document does not modify `docs/05-clinical-safety/hazard-log.md`.** The links below
are recorded here for the hazard-log owner to integrate. They are stated as `PROPOSAL`;
whether a threat belongs in a given hazard row is a clinical-safety judgement, and
assigning or revising clinical severity is that owner's act, not this agent's.

### 9.1 The six `joint` hazards — threats to attach

| HAZ | Hazard (abbreviated) | THR IDs to link |
|---|---|---|
| **HAZ-0003** | Tenant context from caller-controlled value → cross-tenant association | THR-0001, THR-0003, THR-0018, THR-0020, THR-0022, THR-0026, THR-0048 |
| **HAZ-0013** | Unscoped query/cache/topic/subscription → cross-tenant read and inference | THR-0002, THR-0004, THR-0015, THR-0016, THR-0017, THR-0018, THR-0019, THR-0020, THR-0026, THR-0027, THR-0040, THR-0050, THR-0051, THR-0052, THR-0053, THR-0054, THR-0063, THR-0067 |
| **HAZ-0014** | Fail-open identity, token leakage, replayed session | THR-0021, THR-0022, THR-0023, THR-0024, THR-0025, THR-0049 |
| **HAZ-0028** | PHI in logs/prompts/traces/queues/caches/exports/notifications/backups/screenshots/support | THR-0023, THR-0027, THR-0028, THR-0029, THR-0030, THR-0031, THR-0032, THR-0033, THR-0050, THR-0051, THR-0052, THR-0053, THR-0060, THR-0062 |
| **HAZ-0029** | MCP/AI injection, ungrounded output reaching a clinician | THR-0029, THR-0041, THR-0061, THR-0062, THR-0063, THR-0064, THR-0065, THR-0066, THR-0067 |
| **HAZ-0034** | Backup corruption / failed restore / unreconciled downtime | THR-0053, THR-0057, THR-0058, THR-0059, THR-0060 |

### 9.2 Closing hazard-log gap G-1 (supply chain)

`HAZLOG` §4 G-1 states supply-chain failure modes were deliberately unseeded and "handed
to the Wave 2 healthcare threat-model specialist, which must return threat IDs that link
back into these hazard rows." **Returned:**

| Existing hazard row | Supply-chain THR IDs to add to its evidence/controls | Why this hazard is the clinical pathway |
|---|---|---|
| **HAZ-0019** unsafe rule activation | THR-0050, THR-0051, THR-0052, THR-0054, THR-0055, THR-0056 | Every one of these ends with clinical logic executing that no clinical approver ratified — which is HAZ-0019's condition, reached by a build-system path rather than a rule-registry path |
| **HAZ-0013** cross-tenant read | THR-0050, THR-0051, THR-0052, THR-0053, THR-0054 | Code running inside the application reads the tenant context and the store directly, defeating storage-level isolation |
| **HAZ-0028** PHI leakage | THR-0050, THR-0051, THR-0052, THR-0053 | Exfiltration from inside the trust boundary, through channels no perimeter control inspects |
| **HAZ-0031** false-green gates | THR-0055, THR-0056 | A gate that validates nothing, or validates against tampered evidence, is HAZ-0031's exact condition arriving from the supply chain |
| **HAZ-0034** backup/restore | THR-0053 | Key loss (as distinct from key exposure) is a restore failure with clinical consequences |

**Explicitly NOT supplied:** severity, likelihood, or hazard class for any of the above.
`HAZLOG` §5 reserves those to the clinical safety-case engineer and states they are not
sign-off. This agent proposes linkage only.

### 9.3 Candidate hazard-row *widenings* (for the safety engineer to accept or reject)

Not new `HAZ` IDs — this agent does not mint them. Two threats sit slightly outside the
condition text of their nearest hazard, and the safety engineer should decide whether to
widen the row or open a new one:

1. **THR-0041 (notification-channel spoofing).** HAZ-0015/HAZ-0018 cover *missed* and
   *misrouted* alerts; HAZ-0029 covers attacker-influenced clinical *text*. None squarely
   covers **a fabricated alert delivered through a legitimate-looking external channel**,
   where the clinician acts on an alert V2 never generated. Suggested home: widen
   HAZ-0029, or a new hazard under P5.
2. **THR-0058 (destructive attack / ransomware).** HAZ-0034 covers corrupt backups and
   failed restore. It does not squarely cover **deliberate destruction with backups inside
   the same blast radius**, where the harm is total unavailability of the clinical record
   during active care. Suggested home: widen HAZ-0034's condition, or a new P0 hazard.

### 9.4 Threats that reinforce hazards *not* tagged `joint`

Offered as information; no action requested. THR-0006→HAZ-0005; THR-0037→HAZ-0021;
THR-0039→HAZ-0015; THR-0046→HAZ-0025; THR-0055→HAZ-0031. These hazards were not tagged
`joint` by the safety engineer, and this model does not reclassify them — it records that
each now has an adversarial or systemic threat path in addition to its fault path.

---

## 10. Coverage check against `PROMPT:750-764`

Every failure mode `PROMPT:752-764` requires this model to address maps to at least one
threat. This demonstrates coverage **of that list** — not coverage of all threats to V2
(§1.3).

| `PROMPT` §13 bullet | Threats |
|---|---|
| wrong patient/encounter/tenant/unit association (`752`) | THR-0001..THR-0005 |
| missing/stale/invalid/conflicting/corrected data (`753`) | THR-0006..THR-0010 |
| duplicate, delayed, reordered, replayed, or lost input/event/command (`754`) | THR-0011..THR-0015 |
| cross-tenant access and inference (`755`) | THR-0016..THR-0020, THR-0067 |
| excessive privilege, issuer confusion, token leakage, session expiry, fail-open identity (`756`) | THR-0021..THR-0027 |
| PHI in logs, prompts, traces, queues, caches, exports, notifications, backups, screenshots, support (`757`) | THR-0028..THR-0033, THR-0023, THR-0060, THR-0062 |
| unsafe rule activation, rollback failure, version drift, no-fire opacity, alert suppression (`758`) | THR-0034..THR-0038 |
| missed, duplicated, delayed, misrouted, never-displayed alerts (`759`) | THR-0039..THR-0042, THR-0011, THR-0014 |
| concurrent human actions and ambiguous responsibility (`760`) | THR-0043..THR-0045 |
| integration outage, terminology drift, MPI merge/unmerge, clock skew, correction (`761`) | THR-0046..THR-0049, THR-0008 |
| supply-chain compromise, secret/key loss, malicious dependency, artifact substitution (`762`) | THR-0050..THR-0056 — **closes `HAZLOG` gap G-1** |
| backup corruption, failed restore, partial regional/site outage, reconciliation after downtime (`763`) | THR-0057..THR-0060 |
| MCP/AI prompt injection, data exfiltration, unsafe tool chaining, ungrounded output (`764`, `726-742`) | THR-0061..THR-0067, THR-0029 |
| *(task packet)* the observed AMH three-way authentication contradiction | §2.1; THR-0018, THR-0022, THR-0027, THR-0046 |
| *(task packet)* V2 ↔ identity provider, undecided | §2.2; THR-0021..THR-0027 |

### Declared coverage gaps

- **T-1 — no architecture, so no per-element analysis.** Threats below the boundary level
  (memory safety, injection classes, deserialization, framework-specific issues) cannot be
  enumerated before a stack ADR. This model must be re-run as STRIDE-per-element after the
  architecture is ratified, and again before G7.
- **T-2 — physical, endpoint-device, and facility boundaries not modelled** (§2.3). A
  bedside product in a shared clinical space has real threats here. Owner would be
  `AUTH-OPERATIONS`, `UNASSIGNED` (`BLK-0007`).
- **T-3 — no per-pathway threat analysis.** Pathway-specific abuse (e.g. gaming a sepsis
  bundle metric, deliberate score manipulation to influence bed allocation or billing)
  cannot be stated before the pathway portfolio exists (`HAZLOG` gap G-2). One pass is
  owed per admitted pathway at G2.
- **T-4 — no third-party/processor threat analysis.** The processor inventory is EMPTY
  (`privacy-data-map.md` §6); no notification provider, model provider, cloud provider, or
  managed service has been selected, so supplier-specific threats cannot be enumerated.
- **T-5 — no quantitative anything.** No likelihood, no exploitability, no CVSS-style
  scoring, no attack-cost estimate. Deliberate: all would be fabricated.

---

## 11. Open items and required decisions

1. **`THR` prefix is outside the ratified ID taxonomy** (`traceability-policy.md` §1). An
   ADR amending §1 to add `THR` is required before these IDs are legitimate repo-wide.
   Minted here under this task's explicit authorisation; flagged rather than assumed.
2. **`AUTH-SECURITY` is UNASSIGNED (`BLK-0003`).** No one can accept this threat model, and
   no P0/P1 finding can be closed or accepted, until that role is staffed. This is the
   single hardest blocker on Gate G6.
3. **`AUTH-PRIVACY-LEGAL` is UNASSIGNED (`BLK-0004`).** Every legal determination in
   `privacy-data-map.md` is blocked on it.
4. **TB-06's far side is undecided.** ADR 15 (`PROMPT:650`) must be written with
   THR-0021..THR-0027 as inputs. See §2.2.
5. **The AMH three-way authentication contradiction (§2.1) is unresolved** and is an
   AMH-owner act (`AUTH-AMH-OWNER`, `BLK-0010`). V2 cannot design TB-05 authentication
   against three positions.
6. **IDN-C-5 (`cross_tenant_authorized` bypass claim)** requires an explicit AMH answer:
   does a cross-tenant authorization path exist in the deployed FHIR server, and can any
   V2 credential reach it? THR-0018 cannot be assessed without it.
7. **Adversarial tenant-isolation evidence does not exist and cannot be produced today** —
   no V2 system, and AMH has only `dev` provisioned (`RISK-0004`), so production-like
   testing is unavailable to anyone. Gate G6 explicitly requires this evidence
   (`PROMPT:772`). See `g6-readiness.md`.
8. **Boundaries deliberately unmodelled** (§2.3) need owners before they can be scheduled.
9. **This model has had no independent review.** `PROMPT:201` requires the verifier not be
   the implementer; here, the author is an agent and no human has read it.

---

## 12. Extensão do ciclo 1 — a superfície do contrato AMH×IntensiCare v1 (minuta)

> **Nota de idioma.** As seções 0–11 acima foram redigidas em inglês no ciclo 0 e
> **permanecem sem reescrita**. Esta seção 12 é redigida em **pt-BR** conforme a política
> de idioma `DEC-G0-10`, seguindo o precedente já exercido em
> `docs/08-interoperability/amh-data/open-questions-for-amh-owners.md` §pt-BR. Nenhum
> conteúdo anterior foi alterado, renumerado ou removido.

**Escopo desta extensão.** Modela **apenas** a superfície nova introduzida pela minuta do
contrato v1 — `docs/08-interoperability/amh-data/contract-v1/` (manifesto draft, cláusula de
ciclo de vida de identidade, fixtures, memória de desenho), publicada em 2026-08-15 e
**posterior** ao modelo do ciclo 0. Não re-modela nada que as §§4.A–4.M já cobrem: onde uma
ameaça existente já cobre o caso, esta seção **referencia** em vez de duplicar (§12.2).

**Estado epistêmico, sem mudança.** Todas as declarações do §8 continuam valendo para as
ameaças novas: **nenhuma está fechada, aceita, mitigada ou verificada**; nenhum `SEC` citado
está implementado; nada aqui é declaração de conformidade. Nenhum risco é aceito nesta seção —
aceitação pertence a `AUTH-SECURITY`, que segue `UNASSIGNED` (`BLK-0003`).

### 12.1 O que é a superfície nova, e por que ela é uma superfície

**OBSERVADO** (leitura de `contract-v1/contract-manifest.draft.yaml`,
`eventos-ciclo-de-vida-identidade.md`, `memoria-de-desenho.md` e `fixtures/README.md`, todos
em 2026-08-15, estado `DRAFT`/`PROPOSAL`, `pinned: false`, `aceito: false`): a minuta acrescenta
à fronteira **TB-05** (V2 ↔ plataforma AMH-data) dois canais que o modelo do ciclo 0 não
conhecia, e um identificador que passa a chavear todo fato clínico da V2.

| Canal / artefato | O que atravessa | Por que muda o modelo de ameaças |
|---|---|---|
| **Canal E — lane de eventos de ciclo de vida de identidade** (6 tipos `identity.*.v1`) | Envelope mínimo de 11 campos; transições de ref (`subject_ref_antiga` → `subject_ref_nova`) | É a primeira lane em que a AMH **empurra** mutações de estado para a V2. Entrega `at-least-once`, ordenação **apenas por sujeito**, transporte **não escolhido**. A lane não altera dado clínico — altera **a chave de todo dado clínico** |
| **Canal R — operação `resolve(ref, as_of)`** | `ref` opaca + instante; resposta com resolução vigente naquele instante e cadeia de alias | É uma **dependência síncrona de correção clínica**: sem ela o replay determinístico (`DOM-0003`) não é reproduzível. É também uma operação de consulta sobre um espaço de identificadores — logo, um possível oráculo |
| **PSR (`portable_subject_ref`)** | `amh:psr:v1:<uuidv4>`, estável em `{amh_tenant, legal_entity}` | Passa a ser **a chave de todo fato clínico persistido** (ADR-0004 D-04/D-05, `(PSR, encontro)`). **É pseudonimização, não anonimização** — `lgpd-os16/minuta-parecer-os-16.md` §1.3, PROPOSTA **P-PSR-1** |
| **Artefatos de contrato** (manifesto, esquema, 10 fixtures) | Definição executável da fronteira | São **artefatos de verificação** que entram no caminho do Gate G3. Todo digest está `null`; `pinned: false` |

**Decisão deliberada de não cunhar `TB-13`/`TB-14`.** Os dois canais são, pela definição do
§2, o mesmo cruzamento de autoridade que TB-05 já nomeia (duas pessoas jurídicas, dois
cadências de release, a V2 como consumidora sem autoridade sobre os controles da AMH). Criar
fronteiras novas fragmentaria a análise sem acrescentar assimetria de confiança. As linhas
abaixo trazem `TB-05` na coluna `TB` e **nomeiam o canal no texto do caminho**. Onde o
transporte escolhido for um broker, `TB-04` também incide — registrado por linha.

**A superfície é `PROPOSAL` e ainda negociável — e é exatamente por isso que ela é modelada
agora.** Quatro das ameaças abaixo (THR-0068, THR-0071, THR-0083 e, em parte, THR-0070)
apontam **lacunas no envelope proposto**, não defeitos de implementação. Corrigi-las custa uma
emenda compatível hoje e uma mudança **major** com janela de depreciação depois.

### 12.2 Verificação antes de cunhar: o que o ciclo 0 já cobre

**INFERÊNCIA** (comparação linha a linha das §§4.A–4.M contra as seis superfícies do pacote de
tarefa). Nenhuma ameaça nova foi cunhada onde uma existente já basta; onde a ameaça nova
existe, a coluna "incremento" declara **o que exatamente ela acrescenta**.

| Caso do pacote | THR existente mais próximo | Basta? | Incremento que justifica a entrada nova |
|---|---|---|---|
| Evento forjado/injetado | **THR-0015** (injeção no stream interno, TB-04) | **Não** | THR-0015 é sobre o stream **interno** da V2. O canal E vem de **outra pessoa jurídica**, com transporte indefinido, e seu envelope mínimo **não tem campo de assinatura nem digest de manifesto** (excluídos em `memoria-de-desenho.md` §5) → **THR-0068** |
| Replay / duplicata | **THR-0011** (replay sem idempotência), **THR-0013** (reordenação) | **Parcialmente** | A `idempotency_key` é **campo do envelope, fornecido pelo produtor** — não é chave canônica derivada pela V2, que é o que `SEC-0021` exige. A idempotência vira **dependência de confiança no produtor** → **THR-0069**; e a ordenação prometida é só *por sujeito*, enquanto um `merge` é um fato sobre **um par** → **THR-0071** |
| Merge não aplicado | **THR-0048** (merge/unmerge a montante, fatos não re-associados) | **Não** | THR-0048 pressupõe que o evento **chegou**. O caso novo é o evento que **nunca chega** e cuja ausência é indetectável: o envelope não tem número de sequência, marca-d'água nem heartbeat → **THR-0070** |
| Tombstone de erasure não aplicado | *(nenhum)* | **Não** | Nenhuma ameaça do ciclo 0 trata **retenção indevida após exercício de direito de eliminação a montante**. THR-0008 é sobre correção clínica perdida; THR-0028/THR-0033 são sobre **vazamento**, não sobre reter o que deveria ter sido retirado → **THR-0072** |
| `resolve` adulterado/stale, cache envenenado | **THR-0007** (stale), **THR-0019** (colisão de cache) | **Parcialmente** | O objeto agora é a **resolução de identidade**, não um valor clínico; e a degradação específica é "responder o **agora** quando foi pedido o **então**", que nenhuma linha existente descreve → **THR-0073**, **THR-0074** |
| Oráculo de enumeração | **THR-0017** (inferência cross-tenant por canal lateral) | **Não** | THR-0017 é sobre existência de **registros** de outro tenant. Aqui o canal lateral revela **fatos sobre o ciclo de vida da identidade** — inclusive que uma ref foi `retired`, isto é, que **um titular exerceu direito de eliminação** → **THR-0075** |
| Deputado confuso | **THR-0026** (padrão genérico), **THR-0063** (em MCP) | **Não** | A instância nova tem o *downstream* **fora da V2 e fora da OMNI**: quem decide autorização é a AMH, e o portão de finalidade (`tratamento` + contexto profissional, AQ-3) precisa **viajar** com a chamada → **THR-0076** |
| PSR — re-identificação, logs, sintético↔produção | **THR-0020** (V2 como índice cross-PJ), **THR-0028/0029/0030** (PHI em sinks), **THR-0017** | **Não** | THR-0020 exige estrutura **cross-PJ**; a re-identificação por quase-identificadores acontece **dentro de um tenant** (THR-0077). O PSR é opaco e por isso **escapa** de defesas desenhadas para PHI óbvio, inclusive do gate de conteúdo proibido deste repositório (THR-0078). E a fronteira sintético↔produção tem, aqui, um sentido novo — **ref sintética aceita em produção** (THR-0079) |
| Contaminação cross-PJ a montante (R-a5) | **THR-0003** (junção por igualdade de identificador) | **Não** | Em THR-0003 **a V2 faz a junção errada**. Em R-a5 a V2 **cumpre o contrato corretamente** e ainda assim recebe o par errado: o controle preventivo tem dono **fora da V2** → **THR-0080** |
| Fixtures / dessincronia | **THR-0055** (gate que valida zero casos), **THR-0056** (artefato de verificação adulterado) | **Parcialmente** | THR-0055/0056 são do TB-09/TB-12 (cadeia de build e de conteúdo clínico). O caso novo é a **regra de tolerant reader implementada pela metade** na fronteira de dados (THR-0081) e a suíte de conformidade que atesta um esquema que ninguém consome (THR-0082) |
| Drift de contrato | **THR-0047** (drift de terminologia/perfil), **THR-0051** (substituição de artefato) | **Não** | THR-0047 é drift de **vocabulário clínico**; THR-0051 é da cadeia de build. Este é o drift do **contrato de identidade e de tempo**, cuja âncora única — `manifest_sha256` — está `null` e cujo envelope **exclui por desenho** a referência de manifesto por mensagem → **THR-0083** |

### 12.3 Catálogo — THR-0068..THR-0083

Todas as linhas: `Status = OPEN`, `Owner = UNASSIGNED — VALIDATION REQUIRED`,
`Priority = PROPOSAL`. As bandas P0/P1/P2 são as do §3, sem redefinição. `HAZ` cita apenas
identificadores **verificados em** `docs/05-clinical-safety/hazard-log.md` na leitura de
2026-08-15; nenhum `HAZ` novo é cunhado aqui (§12.5 propõe alargamentos ao dono daquele
documento).

#### 12.3.1 Canal E — consumo de eventos de ciclo de vida de identidade

| THR | TB | Classe | Ator | Caminho | Impacto e via de dano clínico | HAZ | SEC candidatos | Pri |
|---|---|---|---|---|---|---|---|---|
| **THR-0068** | TB-05 (canal E), TB-04 | S, T | `EXT`, `AUTH`, `INS` | **Evento de identidade forjado.** Uma parte capaz de publicar na lane — ou de se passar pela AMH sobre um transporte ainda não escolhido — emite um `identity.merge.v1` ou `identity.alias.v1` fabricado. **OBSERVADO:** o envelope mínimo de 11 campos não carrega assinatura de produtor, digest de payload nem digest de manifesto (excluídos deliberadamente em `memoria-de-desenho.md` §5), portanto a autenticidade de origem depende **inteiramente** do transporte, que a minuta declara `null` | Um merge fabricado une duas pessoas distintas na visão da V2: a partir dele, o score é computado sobre valores de dois pacientes e o alerta é emitido sobre o paciente errado. Um `erasure` fabricado retira uma ref viva — negação de serviço **na camada de identidade**, com o paciente saindo da vigilância sem que nada falhe | HAZ-0001, HAZ-0003, HAZ-0027 | SEC-0051, SEC-0022, SEC-0002, SEC-0032, SEC-0059 | **P0** |
| **THR-0069** | TB-05 (canal E), TB-04 | T, S | `AUTH`, `SYS`, `EXT` | **Replay e duplicata sob chave de idempotência fornecida pelo produtor.** A dedup é por `idempotency_key`, que é **campo do envelope**. Um produtor defeituoso que reutilize a chave entre fatos distintos faz a V2 **descartar um fato real**; um replay de um `restore` antigo, após um `merge` mais novo, reintroduz uma aresta já superada. `SEC-0021` exige chave canônica derivada pela V2 — aqui não há material para derivá-la, porque o envelope **é** a carga | Estado de identidade reconstruído diverge do estado real sem erro visível. Um fato de identidade descartado por colisão de chave é indistinguível de um fato que nunca ocorreu — precedente exato do sistema legado, cuja chave derivada do paciente fazia mensagens distintas serem tomadas por replays e descartadas (§4.C, THR-0011) | HAZ-0009, HAZ-0027 | SEC-0021, SEC-0051, SEC-0052, SEC-0058 | **P1** |
| **THR-0070** | TB-05 (canal E), TB-04 | D, T | `SYS` | **Evento perdido — merge nunca aplicado.** Entrega `at-least-once` protege contra perda **no transporte declarado**, não contra: consumidor que confirma antes de persistir, quarentena que engole a mensagem, janela de retenção do produtor menor que a indisponibilidade do consumidor, ou filtro de escopo mal configurado. **OBSERVADO:** o envelope mínimo **não tem** número de sequência, marca-d'água nem heartbeat, e a lane não declara latência (`VALIDATION_REQUIRED`) — logo **não existe sinal de lacuna**. Sem adversário | Fatos clínicos continuam sendo chaveados por uma ref que o produtor já considera superada: **a história do paciente fica partida em duas** e o clínico julga estabilidade que o registro completo contradiz. A equivalência replay ⇔ `resolve` (§3 da cláusula), que é o critério de aceitação do Gate G3, quebra **em silêncio**. Numa janela de indisponibilidade, atinge **todos** os sujeitos que transicionaram nela — por isso P0, e não P1 | HAZ-0012, HAZ-0027, HAZ-0025 | SEC-0052, SEC-0049, SEC-0026, SEC-0023 | **P0** |
| **THR-0071** | TB-05 (canal E), TB-04 | T | `SYS` | **Fora de ordem através de uma cadeia de refs.** A garantia é ordenação **por sujeito**; um `merge` é um fato sobre **um par** (antiga, nova), e uma cadeia `A→B` seguida de `B→C` atravessa **dois pares distintos**, para os quais nenhuma ordem é prometida. **OBSERVADO:** o desempate de `occurred_at` idêntico é, no texto da cláusula, "ordem de emissão declarada pelo produtor" — mas **nenhum campo do envelope mínimo carrega essa ordem** (`emitted_at` é timestamp, não sequência, e pode empatar). Aplicar a cadeia fora de ordem produz um grafo de alias diferente | O grafo de alias diverge do da fonte: `resolve(ref, as_of)` e a visão derivada dos eventos passam a discordar, e a discordância aparece como reatribuição errada — ou não-reatribuição — de história clínica. Reforça a lacuna do envelope apontada em THR-0068 | HAZ-0011, HAZ-0027 | SEC-0052, SEC-0021, SEC-0024, SEC-0051 | **P1** |
| **THR-0072** | TB-05 (canal E), TB-03, TB-11 | T, I | `SYS`, `INS` | **Tombstone de erasure não aplicado — retenção indevida.** `identity.erasure.v1` comunica que a ref foi marcada `retired` a montante (tipicamente exercício de direito de eliminação) e que o mapeamento para a identidade de origem foi rompido. Se a V2 não aplicar a transição — porque o evento se perdeu (THR-0070), porque o consumidor a trata como no-op (`subject_ref_nova: null` é o único caso válido e é fácil de tratar como malformado), ou porque a aplicação não alcança **todas** as cópias (projeções, caches, cache de `resolve`, índices, exports, telemetria dentro da retenção) — a V2 segue apresentando e avaliando o sujeito | Dado pessoal sensível retido e **em uso ativo** depois de o titular ter exercido direito de eliminação a montante. Agrava-se por uma tensão real que a V2 **não pode resolver sozinha**: o PSR é a chave de todo fato clínico, e apagá-lo destruiria o registro clínico e a trilha de auditoria — o que "aplicar o tombstone" significa juridicamente (eliminar, bloquear, ou reter sob obrigação clínica/regulatória) é determinação de `AUTH-PRIVACY-LEGAL`, `UNASSIGNED` (`BLK-0004`) | HAZ-0028 | SEC-0053, SEC-0020, SEC-0032, SEC-0052 | **P1** |

#### 12.3.2 Canal R — `resolve(ref, as_of)`

| THR | TB | Classe | Ator | Caminho | Impacto e via de dano clínico | HAZ | SEC candidatos | Pri |
|---|---|---|---|---|---|---|---|---|
| **THR-0073** | TB-05 (canal R) | T, S | `EXT`, `SYS` | **Resposta adulterada ou "atual servida como então".** A cláusula exige determinismo, semântica ponto-no-tempo e *fail-closed*, mas **não define autenticação nem prova de integridade da resposta**, e o transporte é `null`. Três realizações: (i) intermediário/proxy adultera a cadeia de alias; (ii) implementação degradada responde a resolução **atual** quando `as_of` está fora da janela suportada, em vez de negar; (iii) resposta stale servida por um intermediário que não conhece a semântica de `as_of` | O replay deixa de ser determinístico **sem levantar erro**: avaliações históricas são reatribuídas a sujeitos diferentes daqueles com que foram computadas, contrariando `DOM-0002`/`DOM-0003` e ADR-0004 §5.2. Como o `resolve` é a âncora da certificação de replay do Gate G3, uma resposta errada **valida** uma reconstrução errada | HAZ-0006, HAZ-0027, HAZ-0035 | SEC-0054, SEC-0011, SEC-0051, SEC-0024 | **P1** |
| **THR-0074** | TB-05 (canal R), TB-03 | T, I | `SYS`, `AUTH` | **Cache de `resolve` envenenado ou mal chaveado.** A chave correta é `(ref, as_of, amh_tenant, legal_entity, versão de contrato)`; a chave "natural" que um desenvolvedor escreve é `ref`. Consequências: resposta de um instante servida para outro; cache negativo de `nao-mintada-em-as_of` congelando um sujeito como inexistente; ausência de invalidação quando um evento de identidade chega; e — se a chave omitir `{amh_tenant, legal_entity}` — resposta de um escopo servida a outro | Reatribuição silenciosa e intermitente, que **não reproduz** em teste single-tenant nem em teste de instância única (mesmo defeito estrutural de THR-0019). O cache negativo é o pior caso: um sujeito real passa a `not_evaluated` permanente e sai da vigilância sem que nenhum alarme dispare | HAZ-0013, HAZ-0027, HAZ-0025 | SEC-0054, SEC-0009, SEC-0019, SEC-0052 | **P1** |
| **THR-0075** | TB-05 (canal R) | L, I | `AUTH`, `INS` | **`resolve` como oráculo de enumeração e de metadado de identidade.** As condições de resposta são, por desenho, **explícitas e distinguíveis**: `nao-mintada-em-as_of`, `status: retired` + data do fato, "ref desconhecida", "fora de escopo". Um chamador autenticado que itere `as_of` sobre refs já vistas obtém a **data de minting**, a **cadeia de transições** e o **fato de que uma ref foi retirada**. O espaço UUIDv4 não é enumerável por força bruta — o oráculo é útil **sobre o conjunto de refs já vistas** (vazadas em log, export, ticket ou fixture; ver THR-0078). Diferenças de latência e de forma de erro são canal adicional | Correlação e re-identificação por metadado, e **vazamento de um fato jurídico sensível**: `retired` sinaliza, com data, que um titular exerceu direito de eliminação — informação sobre o titular que nenhuma finalidade `tratamento` justifica. Constrói, do lado do chamador, parte do mapa que AQ-4 e `SEC-0010` existem para impedir | HAZ-0013, HAZ-0028 | SEC-0054, SEC-0033, SEC-0050, SEC-0016, SEC-0032 | **P1** |
| **THR-0076** | TB-05 (canal R), TB-02, TB-08 | E | `AUTH`, `SYS` | **Deputado confuso sobre `resolve`.** Um BFF, um worker de replay, um job de reconciliação ou uma ferramenta MCP chama `resolve` com a **identidade de carga de trabalho da V2**, sem carregar tenant, entidade legal, propósito-de-uso e contexto profissional do chamador humano. Do outro lado, a AMH autoriza pelo cliente — não pelo usuário. A cláusula exige "propósito-de-uso `tratamento` + contexto profissional", mas quem tem de **transportar** esse contexto é a V2 | Um usuário sem vínculo assistencial com o sujeito obtém resolução de identidade **do outro lado de uma fronteira de pessoa jurídica**, com a autoridade da V2 e sob o registro de auditoria da V2. Cada componente comporta-se "corretamente"; a autorização de usuário simplesmente nunca é avaliada. É THR-0026 realizado onde o *downstream* pertence a outra organização | HAZ-0003, HAZ-0013 | SEC-0006, SEC-0054, SEC-0001, SEC-0003, SEC-0041 | **P0** |

#### 12.3.3 PSR — pseudônimo tratado como se fosse anonimato

**Base normativa (SOURCE, via `lgpd-os16/minuta-parecer-os-16.md` §1.3 e PROPOSTA P-PSR-1):**
o PSR **não é derivável** (é UUIDv4 mintado, não digest de atributo) — e o desenho merece
crédito por isso — **mas é re-associável por consulta**, porque existe, do lado AMH, tabela de
registro que mantém `mpi_id` ao lado do `subject_ref`. Portanto o PSR realiza
**pseudonimização, não anonimização**; a definição do art. 13, §4º é expressamente "para os
efeitos deste artigo" e não é porto seguro geral; e o art. 12 não é satisfeito, porque a
reversão "exige uma consulta a uma tabela existente, sob contrato entre as partes". As três
ameaças abaixo são as realizações técnicas do erro que P-PSR-1 proíbe.

| THR | TB | Classe | Ator | Caminho | Impacto e via de dano clínico | HAZ | SEC candidatos | Pri |
|---|---|---|---|---|---|---|---|---|
| **THR-0077** | TB-03, TB-10, TB-05 | L, I | `INS`, `AUTH`, `SYS` | **Re-identificação por correlação sobre dados chaveados por PSR, dentro de um único tenant.** O PSR é estável em `{amh_tenant, legal_entity}` e chaveia **todo** fato clínico (ADR-0004 D-04/D-05). O acervo da V2 acumula, por PSR, série temporal de sinais/scores, leito, unidade, instantes de admissão/alta e transições de alerta — quase-identificadores que, numa UTI de dezenas de leitos, individualizam um paciente para qualquer pessoa com acesso operacional ou com conhecimento da unidade. O gatilho prático é um export, painel ou conjunto de análise descrito como "pseudonimizado" e por isso tratado como não-pessoal | Divulgação de dado pessoal **sensível** sob rótulo errado, e habilitação de uso secundário sem base legal — exatamente o que AQ-3 bloqueia. Distingue-se de THR-0020: **não é necessário nenhum cruzamento cross-PJ**; o acervo intra-tenant basta. Também é o caminho pelo qual um artefato da V2 poderia afirmar "sem PHI" e estar errado | HAZ-0028 | SEC-0055, SEC-0016, SEC-0020, SEC-0010, SEC-0033 | **P1** |
| **THR-0078** | TB-10, TB-09, TB-08 | I | `SYS` | **PSR em logs, traces, rótulos de métrica, fixtures, tickets e mensagens de agente.** Por ser opaco, o PSR "parece" seguro e **escapa das defesas desenhadas para PHI óbvio**: aparece naturalmente em chaves de correlação, em cardinalidade de métrica, em corpos de erro, em argumentos e resultados de ferramenta MCP e no bloco `_fixture`. **OBSERVADO:** `scripts/check_forbidden_content.py` reconhece padrões de credencial, CPF **formatado**, e-mail e canários — **não há padrão para `amh:psr:v1:`**; e um redator de logs que filtre por lista de campos clínicos não filtra a **chave** | Um sink de retenção longa e audiência ampla (TB-10) passa a carregar o identificador que chaveia todo o registro clínico. Combinado com THR-0075, refs vazadas viram entradas úteis no oráculo; combinado com THR-0077, viram chave de junção para qualquer export. Instância específica de THR-0028/THR-0029/THR-0030 — registrada à parte porque **os controles existentes não a alcançam por construção** | HAZ-0028, HAZ-0029 | SEC-0055, SEC-0015, SEC-0016, SEC-0046, SEC-0017 | **P1** |
| **THR-0079** | TB-09, TB-03, TB-05 | T, I | `SYS`, `INS` | **Fronteira sintético ↔ produção do PSR, nos dois sentidos.** (a) **Ref sintética aceita em produção**: `amh:psr:v1:SYNTH-...` **não é** um UUIDv4 e portanto viola o formato normativo; um validador que aceite "qualquer coisa após `amh:psr:v1:`" cria um sujeito fantasma sobre o qual fatos clínicos podem ser chaveados sem que a AMH jamais tenha mintado a ref. (b) **Ref de produção em ambiente inferior** (fixtures, CI, demo) — instância de THR-0030, agravada porque o PSR não dispara nenhum gate de conteúdo (THR-0078). (c) O marcador `SYNTH` é **convenção de nome, não separação técnica**: nada impede um produtor de dev de mintar refs sem o marcador, e nada impede o inverso | (a) contamina o registro clínico com um sujeito inexistente, cujos fatos nunca serão reconciliáveis e cujo `resolve` sempre negará — produzindo `not_evaluated` permanente que parece defeito de integração; (b) é PHI/dado pessoal em ambiente com controles de desenvolvimento; (c) transforma a garantia de sintetismo de `DEC-G0-03` em promessa não verificável | HAZ-0001, HAZ-0028 | SEC-0056, SEC-0017, SEC-0026, SEC-0055 | **P1** |

#### 12.3.4 Contaminação cross-PJ a montante — R-a5

| THR | TB | Classe | Ator | Caminho | Impacto e via de dano clínico | HAZ | SEC candidatos | Pri |
|---|---|---|---|---|---|---|---|---|
| **THR-0080** | TB-05 (canal E e R) | T, L, A | `SYS` (a montante), `AUTH` (a montante) | **Par falso-positivo no índice cross-PJ atribui fatos ao paciente errado, sem que a V2 tenha como detectar.** SOURCE: `minuta-parecer-os-16.md` §3.6 **R-a5** — *"se a resolução de identidade a montante passar a depender do índice, um par errado entra na V2 como fato clínico do paciente errado, sem que a V2 tenha como saber"* — e **R-a3** (falso-positivo cross-PJ como dano de privacidade **e** perigo clínico simultâneos, ADR-043 RB-07). Pré-condições: (i) o índice cross-PJ do ADR-043 entra em operação — hoje **gated** no parecer DPO/jurídico (ADR-0004 D-02); (ii) a resolução a montante passa a depender dele; (iii) um par falso-positivo é aceito. A V2 então recebe `identity.merge.v1`/`alias` **válido, autêntico, ordenado e idempotente**, e o aplica corretamente | História clínica de duas pessoas fundida numa só: score computado sobre valores de dois pacientes, alerta emitido sobre o paciente errado, e ausência de alerta para quem precisava. Simultaneamente, evento de privacidade cross-PJ — dados de um titular expostos no contexto assistencial de outro. **A V2 cumpre o contrato corretamente e ainda assim causa dano.** Por AQ-4 ela **não pode** conferir o par: não hospeda o índice, não vê os atributos que o sustentaram e não pode receber identificador de fonte | HAZ-0001, HAZ-0003, HAZ-0027 | **Preventivo: nenhum controle da V2.** Compensatório (apenas detecção): **SEC-0057** (PROPOSAL); auxiliares: SEC-0026, SEC-0032, SEC-0049, SEC-0035 | **P0** |

**Declaração de propriedade do controle (INFERÊNCIA, e o ponto mais importante desta seção).**
THR-0080 é a única ameaça deste modelo cujo **controle preventivo tem dono fora da V2 e fora
da OMNI-como-fornecedora de software**: ele pertence à governança do índice do ADR-043 (AMH) e
ao parecer jurídico da OS-16, e a `AUTH-AMH-OWNER` / `AUTH-PRIVACY-LEGAL`, ambos `UNASSIGNED`
(`BLK-0010`, `BLK-0004`). **Isto não é aceitação de risco, e não pode ser lido como tal.** É o
registro de que:

1. a V2 **não pode** fechar esta ameaça por controle próprio, hoje ou depois;
2. o único movimento disponível à V2 é **detecção compensatória parcial** (SEC-0057), que **não
   previne** o dano e cuja taxa de falso-positivo é desconhecida e não medida;
3. a decisão de operar com o índice ligado é decisão **de negócio e jurídica**, com dono humano
   nomeado, e não decisão de engenharia;
4. a concentração de autoridade registrada em **R-a7** da minuta LGPD (a mesma pessoa decide
   pelos dois lados) **remove o atrito que normalmente funciona como controle entre
   controladores distintos** — o que torna a nomeação explícita do dono deste risco mais
   necessária, não menos.

#### 12.3.5 Fixtures, dados sintéticos e drift de contrato

| THR | TB | Classe | Ator | Caminho | Impacto e via de dano clínico | HAZ | SEC candidatos | Pri |
|---|---|---|---|---|---|---|---|---|
| **THR-0081** | TB-05, TB-09 | T, A | `SYS` | **Fixture inválida aceita por parser permissivo — a regra de tolerant reader implementada pela metade.** A invariante 6 tem duas metades: ignorar campos **adicionais** desconhecidos (fácil, e o caminho natural de qualquer desserializador) **e** rejeitar mensagem sem campos **obrigatórios** do envelope mínimo (exige verificação explícita). Um parser que implemente só a primeira aceita as quatro fixtures inválidas — e, em produção, aceita evento sem `idempotency_key` (dedup impossível), com `emitted_at < occurred_at` (ordenação corrompida), `merge` com ref nova igual à antiga, e **identificador de fonte cru**, que é o caso que a fixture `erasure.identificador-de-fonte-cru.invalid.json` existe justamente para provar rejeitado | A fronteira de minimização de AQ-4/XRD-05 **deixa de existir sem que nada falhe**: identificador de fonte atravessa para o domínio clínico da V2, e a dedup e a ordenação — de que depende toda a §12.3.1 — ficam desligadas para **todas** as mensagens. Um defeito único desativa simultaneamente vários controles, o que é o padrão de falha de causa comum já apontado no §13.1 do catálogo de controles | HAZ-0031, HAZ-0028 | SEC-0058, SEC-0026, SEC-0040, SEC-0016 | **P0** |
| **THR-0082** | TB-09, TB-05 | T, A, R | `SYS`, `INS` | **Dessincronia fixture × esquema publicada como "conformidade".** **OBSERVADO:** as dez fixtures têm `sha256: null`, o manifesto tem `manifest_sha256: null` e `pinned: false`. Se o esquema publicado mudar e o conjunto de fixtures não for regerado — ou, na direção mais perigosa, se as fixtures forem editadas para passar num validador defeituoso — a suíte de conformidade **continua verde** e passa a atestar aderência a um esquema que ninguém consome. É o defeito estrutural de THR-0056 (artefato de verificação e artefato verificado compartilhando raiz de confiança) aplicado à fronteira de dados, agravado porque parser e fixtures tenderiam a ser mantidos pela mesma equipe e pelo mesmo pipeline | Evidência falsa de fronteira apresentada ao Gate G3. Uma fronteira "verificada" contra um esquema obsoleto é pior que uma fronteira não verificada: ela **fabrica confiança** exatamente onde a decisão de admitir dado real será tomada | HAZ-0031 | SEC-0058, SEC-0059, SEC-0031, SEC-0040 | **P1** |
| **THR-0083** | TB-05, TB-09 | T, S | `SYS`, `INS`, `EXT` | **Drift de contrato: manifesto/digest não verificado → esquema alterado consumido em silêncio.** **OBSERVADO:** `manifest_sha256: null`, `ig_dependency.package_digest: null`, `pinned: false`; e o envelope mínimo **exclui deliberadamente** `contract_manifest_digest` por mensagem (`memoria-de-desenho.md` §5), de modo que **nenhuma mensagem carrega prova de qual versão de contrato a produziu**. A âncora única é o pin no `contracts.lock` da V2, hoje `pinned: false`. A própria política de compatibilidade manda o consumidor **rejeitar** pacote divergente — o que exige computar e comparar digest, isto é, precisamente o controle ausente | Uma republicação do esquema (mudança "compatível" na intenção do produtor, ou substituição maliciosa — THR-0051 aplicado ao contrato em vez do artefato de build) é consumida sem sinal. A semântica de **ref** ou de **tempo** pode mudar sob os pés da V2 sem janela de depreciação; o replay deixa de ser reproduzível, e as avaliações antes e depois do drift tornam-se incomparáveis sem que a proveniência registre por quê | HAZ-0031, HAZ-0040 | SEC-0059, SEC-0025, SEC-0038, SEC-0051, SEC-0052 | **P1** |

### 12.4 Resumo de prioridades da extensão (PROPOSAL — não é aceitação de risco)

| Prioridade | Qtd. | THR |
|---|---|---|
| **P0** | 5 | THR-0068, THR-0070, THR-0076, THR-0080, THR-0081 |
| **P1** | 11 | THR-0069, THR-0071, THR-0072, THR-0073, THR-0074, THR-0075, THR-0077, THR-0078, THR-0079, THR-0082, THR-0083 |
| **P2** | 0 | — |
| **Total desta extensão** | **16** | THR-0068..THR-0083 |

O §5 permanece **sem reescrita** e seus totais (67) referem-se ao conjunto do ciclo 0. Somados,
o modelo passa a conter **83** ameaças, **todas OPEN**. A consequência do Gate G6 declarada no
§5 agrava-se na mesma proporção: nenhuma das dezesseis pode ser fechada hoje, porque fechar
exige controle implementado e verificado, e nada está implementado.

> **VALIDATION REQUIRED, nos mesmos termos do §5:** estas prioridades não tiveram revisão
> independente. `AUTH-SECURITY` segue `UNASSIGNED` (`BLK-0003`) e nenhum agente aceita a
> própria triagem (`PROMPT:197-207`).

### 12.5 Retroligações THR ↔ HAZ propostas ao dono do registro de perigos

**Este documento não edita `docs/05-clinical-safety/hazard-log.md`.** As ligações abaixo são
`PROPOSAL` para integração pelo dono daquele registro; severidade, verossimilhança e classe de
perigo **não** são fornecidas — são ato dele (§9.2 aplica-se sem alteração).

| HAZ existente | THR desta extensão a vincular |
|---|---|
| **HAZ-0001** identidade resolvida errada → fato no paciente errado | THR-0068, THR-0079, THR-0080 |
| **HAZ-0003** `joint` contexto de tenant de valor controlado pelo chamador | THR-0076, THR-0080 |
| **HAZ-0009** duplicata sem chave canônica de idempotência | THR-0069 |
| **HAZ-0011** entrega fora de ordem | THR-0071 |
| **HAZ-0012** fato clínico silenciosamente perdido | THR-0070 |
| **HAZ-0013** `joint` leitura cross-tenant por chave/escopo ausente | THR-0074, THR-0075, THR-0076 |
| **HAZ-0025** feed degradado com readiness saudável | THR-0070, THR-0074 |
| **HAZ-0027** merge/unmerge a montante sem re-associação | THR-0068, THR-0069, THR-0070, THR-0071, THR-0073, THR-0074, THR-0080 |
| **HAZ-0028** `joint` PHI/identificadores em sinks de retenção longa | THR-0072, THR-0075, THR-0077, THR-0078, THR-0079 |
| **HAZ-0029** `joint` superfície MCP/IA | THR-0078 (PSR em argumento/resultado de ferramenta) |
| **HAZ-0031** gate que valida zero casos / passa validando nada | THR-0081, THR-0082, THR-0083 |
| **HAZ-0035** cobertura de auditoria incompleta | THR-0073 |
| **HAZ-0040** estado de qualidade da fonte colapsado no estado de avaliação da V2 | THR-0083 |

#### 12.5.1 Alargamentos candidatos de linha de perigo (aceitar ou rejeitar é ato do dono)

Nenhum `HAZ` novo é cunhado aqui. Três ameaças ficam **fora do texto da condição** do perigo
mais próximo:

1. **THR-0070 — perda silenciosa de evento de identidade.** `HAZ-0027` descreve o merge que
   **ocorre** e não é re-associado; `HAZ-0012` descreve a perda de um **fato clínico**. Nenhum
   cobre a perda de um **fato de identidade** cuja ausência não produz sinal algum. Sugestão:
   alargar a condição de `HAZ-0027`, ou abrir linha nova.
2. **THR-0072 — retenção após erasure a montante.** `HAZ-0028` cobre **vazamento**; nenhuma
   linha cobre **reter e continuar avaliando** um sujeito cuja ref foi retirada por exercício de
   direito. Envolve também conflito com a retenção clínica/auditoria. Sugestão: linha nova,
   com dono conjunto clínico + `AUTH-PRIVACY-LEGAL`.
3. **THR-0080 — contaminação cross-PJ a montante.** `HAZ-0001` pressupõe que **a V2** resolve a
   identidade a partir de um identificador ruim. Aqui a V2 age corretamente e o defeito entra
   pronto, sem via de detecção própria. Sugestão: linha nova, explicitando no campo de controle
   que o barreira preventiva é **externa à V2** — o registro de perigos precisa poder
   representar um perigo cujo controle não pertence a quem o registra.

### 12.6 Cobertura das seis superfícies exigidas pelo pacote de tarefa

| # | Superfície exigida | Onde está coberta |
|---|---|---|
| 1 | Consumo de eventos de identidade: forjado/replayado; perdido (merge não aplicado); fora de ordem/duplicado; tombstone de erasure não aplicado | **THR-0068** (forjado), **THR-0069** (replay/duplicata), **THR-0070** (perdido), **THR-0071** (fora de ordem), **THR-0072** (tombstone). Referências: THR-0011, THR-0013, THR-0015, THR-0048 |
| 2 | `resolve(ref, as_of)`: resposta adulterada/stale; cache envenenado; oráculo de enumeração; deputado confuso | **THR-0073**, **THR-0074**, **THR-0075**, **THR-0076**. Referências: THR-0007, THR-0017, THR-0019, THR-0026, THR-0063 |
| 3 | PSR: re-identificação por correlação; vazamento em logs/traces/fixtures; sintético ↔ produção | **THR-0077**, **THR-0078**, **THR-0079**, com base em `minuta-parecer-os-16.md` §1.3 / P-PSR-1. Referências: THR-0020, THR-0028, THR-0029, THR-0030 |
| 4 | Contaminação cross-PJ a montante (R-a5), com dono de controle fora da V2 e detecção compensatória | **THR-0080** + declaração de propriedade de controle (§12.3.4) + **SEC-0057** marcado `PROPOSAL` e explicitamente compensatório |
| 5 | Fixtures e dados sintéticos: fixture inválida aceita por parser permissivo; dessincronia fixture × esquema publicada como conformidade | **THR-0081**, **THR-0082**. Referências: THR-0030, THR-0055, THR-0056 |
| 6 | Drift de contrato: manifesto/digest não verificado → esquema alterado consumido em silêncio | **THR-0083**. Referências: THR-0047, THR-0051 |

### 12.7 Lacunas declaradas desta extensão

- **T-6 — o transporte não está escolhido.** `transport.escolhido: null`. Ameaças específicas
  de broker, de canal FHIR ou de troca em lote (autorização de tópico, retenção do log de
  eventos, semântica de *offset*, entrega em lote) **não podem ser enumeradas** antes do ADR de
  fronteira. Esta seção modela o que é invariante às três opções; **um novo passo é devido
  quando o transporte for decidido**.
- **T-7 — o contrato é minuta.** Envelope, invariantes e semântica de `resolve` são `PROPOSAL`
  e negociáveis (pontos N-1..N-10). Quatro entradas acima apontam lacunas **do envelope
  proposto** (THR-0068, THR-0070, THR-0071, THR-0083); se a negociação as corrigir, as ameaças
  mudam de forma — não desaparecem.
- **T-8 — nada foi testado, porque nada existe.** Não há lane, não há `resolve`, não há
  consumidor, não há PSR mintado. Todas as dezesseis são antecipatórias, como todas as 67
  anteriores (§8, item 4).
- **T-9 — a análise de re-identificação de THR-0077 não é quantitativa.** Não há estudo de
  *k*-anonimato, nem medida de unicidade sobre acervo real — e não poderia haver, porque não
  existe acervo. A afirmação é qualitativa e depende de premissas de tamanho de unidade;
  `VALIDATION REQUIRED`, dono `AUTH-PRIVACY-LEGAL` em conjunto com governança clínica.
- **T-10 — SEC-0057 não tem taxa de falso-positivo conhecida** e pode, se mal desenhado,
  **virar ele próprio uma estrutura de correlação** que `SEC-0010` proíbe. A restrição de
  desenho está declarada no controle; a verificação de que ela é respeitada é
  `VALIDATION REQUIRED`.

### 12.8 Itens em aberto acrescentados por esta extensão

Complementam o §11, sem alterá-lo:

10. **O envelope mínimo não tem prova de origem nem de versão de contrato** (THR-0068,
    THR-0083). Emenda **compatível** hoje (campos opcionais novos); mudança **major** depois.
    Insumo para a negociação AMH e para o ADR de fronteira — **não é decisão deste documento**.
11. **O envelope mínimo não tem token de continuidade** (sequência, marca-d'água ou heartbeat),
    logo a perda de evento é indetectável (THR-0070) e o desempate de `occurred_at` refere-se a
    uma "ordem de emissão declarada pelo produtor" que **nenhum campo carrega** (THR-0071).
    **Ponto de negociação novo a propor** — este documento não o registra em
    `memoria-de-desenho.md`, que pertence a outro dono.
12. **A divergência 5 × 6 tipos de evento (ponto N-8) tem consequência de segurança**: um
    consumidor que trate `identity.reassignment.v1` como tipo desconhecido, sob tolerant reader,
    **ignora silenciosamente uma reatribuição de fatos** — que é exatamente THR-0070 por outra
    porta. Enquanto N-8 não fechar, o consumidor deve tratar tipo `identity.*` desconhecido como
    **erro fail-closed**, nunca como campo adicional tolerável.
13. **O que "aplicar o tombstone de erasure" significa** juridicamente para um registro clínico
    (THR-0072) é determinação de `AUTH-PRIVACY-LEGAL` (`BLK-0004`), não de engenharia.
14. **O gate `scripts/check_forbidden_content.py` não reconhece o padrão de PSR** (OBSERVADO).
    **PROPOSAL** ao dono daquele gate: acrescentar padrão para `amh:psr:v1:` fora dos caminhos
    do pacote de contrato. Este documento **não altera scripts**.
15. **THR-0080 precisa de dono humano nomeado** antes de qualquer operação com o índice cross-PJ
    ligado. É a única ameaça deste modelo cujo controle preventivo não pertence à V2, e a
    concentração de autoridade registrada em **R-a7** torna a nomeação mais necessária, não
    menos.
