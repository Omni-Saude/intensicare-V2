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
