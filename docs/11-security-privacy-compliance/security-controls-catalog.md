---
id: SECURITY-CONTROLS-CATALOG-V2
title: IntensiCare V2 Security Control Candidates (SEC-0001..SEC-0050)
label: PROPOSAL
statement: >
  Fifty candidate security and privacy controls derived from threat-model.md. Every control
  is status PROPOSAL and implementation status NOT-IMPLEMENTED. Nothing in this catalog
  exists, is configured, is verified, or is accepted. A control statement is a claim about
  what V2 must do; it is not evidence that V2 does it, and it is not a compliance claim.
  EXTENSAO DO CICLO 1 (secao 15, em pt-BR por DEC-G0-10, 2026-08-15): nove controles
  adicionais (SEC-0051..SEC-0059) derivados de THR-0068..THR-0083 (threat-model.md §12),
  cobrindo a lane de eventos de ciclo de vida de identidade, resolve(ref, as_of), o PSR
  como pseudonimo (nao anonimato), a contaminacao cross-PJ a montante (R-a5, apenas
  deteccao compensatoria), fixtures e drift de contrato. Total: 59 controles, TODOS
  PROPOSAL e NOT-IMPLEMENTED. As secoes 0-14 permanecem sem reescrita.
provenance:
  source_repo: intensicare-V2
  path_or_url: docs/11-security-privacy-compliance/security-controls-catalog.md
  commit_sha_or_version: uncommitted (working tree at cb35521)
  section_or_lines: whole document
  date_collected: 2026-08-14
  collector: healthcare threat-model specialist (Wave 2 specialist agent)
  transformation: >
    Controls derived from docs/11-security-privacy-compliance/threat-model.md THR-0001..
    THR-0067, constrained by INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §768 (the control list
    the prompt names), §12.4 (MCP), §15.1-15.2 (supply chain and delivery), §3 rules
    6/9/10/12/13, and §7.4 (fail-closed identity). Cross-checked against
    docs/05-clinical-safety/safety-requirements.md so that SEC controls complement, never
    restate or contradict, the SAF requirements.
  confidence: medium
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
extension_ciclo_1:
  section: "15 (SEC-0051..SEC-0059)"
  date_collected: 2026-08-15
  collector: especialista em modelo de ameacas de saude (ciclo 1)
  language: pt-BR (DEC-G0-10)
  derived_from: threat-model.md §12 (THR-0068..THR-0083)
  source_surface: docs/08-interoperability/amh-data/contract-v1/ — status DRAFT/PROPOSAL, pinned false
  also_read: docs/11-security-privacy-compliance/lgpd-os16/minuta-parecer-os-16.md (§1.3 P-PSR-1; §3.6 R-a3/R-a5/R-a7); docs/06-architecture/adrs/ADR-0004-identidade-paciente-encontro-mpi.md
  transformation: derivacao de controles candidatos; nenhum controle implementado, configurado ou verificado
  confidence: medium
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
  acceptance: nenhuma — aceitacao pertence a AUTH-SECURITY (BLK-0003) e, para controles de privacidade, a AUTH-PRIVACY-LEGAL (BLK-0004)
links:
  requirements: [SAF-0007, SAF-0008, SAF-0009, SAF-0023, SAF-0026, SAF-0027, SAF-0030, SAF-0036, SAF-0037]
  hazards: [HAZ-0003, HAZ-0013, HAZ-0014, HAZ-0028, HAZ-0029, HAZ-0034]
  adrs: []
  tests: []
  pr: null
supersedes: null
superseded_by: null
---

# IntensiCare V2 — Security Control Candidates (PROPOSAL)

> **Every control below: `Status = PROPOSAL` · `Implementation = NOT-IMPLEMENTED` ·
> `Verification = NOT PERFORMED` · `Owner = UNASSIGNED — VALIDATION REQUIRED`.**
>
> **OBSERVED:** IntensiCare V2 has no application code, no infrastructure, no environment,
> and no deployed artifact as of 2026-08-14. **No control in this catalog is implemented,
> configured, tested, or verified.** Writing a control is not implementing a control. Per
> `docs/05-clinical-safety/safety-plan.md` §6.4's principle, adopted here: *a control whose
> only evidence is a document is not satisfied.*
>
> **No compliance claim.** These controls are not mapped to ISO 27001, SOC 2, HIPAA, LGPD,
> or any other framework, because applicability of those frameworks is itself
> `VALIDATION REQUIRED` (`PROMPT:766`). Any future mapping must follow the applicability
> determination, never precede it.

## 0. How to read a control

| Field | Meaning |
|---|---|
| **Control statement** | What V2 must do. Written to be testable, not aspirational. |
| **Threats** | The `THR` IDs from `threat-model.md` this control addresses. Every control traces to at least one threat; every threat has at least one control (§13). |
| **Type** | `PREV` prevent · `DET` detect · `RESP` respond/contain · `ASSUR` assurance-of-other-controls · `GOV` governance/process. |
| **Verification** | The method that would demonstrate the control works. Naming it is mandatory. **None has been executed.** `TST` IDs are deliberately not minted here — that is the safety-focused test architecture engineer's act; every entry reads `TST: UNASSIGNED`. |
| **Depends on** | The ADR or decision that must exist before the control can be designed, where applicable. |

**Independence rule, applying to every verification below (SOURCE `PROMPT:197-207`,
`SAF-0037`):** the implementer of a control may not be its verifier or accepter. No agent
may occupy any acceptance role.

---

## A. Identity, authorization, and tenant isolation

### SEC-0001 — Fail-closed, server-derived tenant, identity, and purpose context
Tenant, organization, patient, encounter, and purpose context MUST be derived exclusively
from verified identity (validated token claims or verified workload identity) and
server-side authoritative data. It MUST NOT be derived from any caller-controlled value —
header, query parameter, body field, path segment chosen by the client, cookie, or
subdomain. When tenant, identity, purpose, or consent context is missing, mismatched, or
unverifiable, the operation MUST fail closed: no partial result, no degraded read, no
default tenant, no "first tenant", no cached prior context.
- **Threats:** THR-0001, THR-0002, THR-0003, THR-0018, THR-0021, THR-0022, THR-0026, THR-0048
- **Type:** `PREV`
- **Basis:** SOURCE `PROMPT:118` (rule 6), `PROMPT:448-449`; `IDP-05`, `IDP-06`, `IDP-11`
- **Complements:** `SAF-0007` (identical requirement stated from the safety side). **This is
  deliberate duplication across the two disciplines — it is the single most load-bearing
  requirement in both documents, and the legacy system implemented its exact negation
  ("Caller header wins; equality check is tautological").**
- **Blocked linkage:** `SAF-0009` is recorded **blocked** by the AMH tenant/MPI contradiction
  record (`safety-requirements.md`: *"Blocked by: the AMH tenant/MPI contradiction record —
  VALIDATION REQUIRED"*). **SEC-0001 inherits that block**: V2 cannot finalise what "verified
  tenant context" means at TB-05 while `IDN-CONTRA` records five unresolved axes on identity
  scope and IDN-C-5 records two different tenant-enforcement mechanisms for the same server.
  See `threat-model.md` §2.1.
- **Verification:** adversarial cross-tenant suite (blocking); negative tests for every
  context source; static analysis proving no code path reads tenant from a request-supplied
  value; fuzzing of context-bearing fields. **TST: UNASSIGNED**
- **Depends on:** ADR 3, ADR 16 (`PROMPT:638`, `PROMPT:651`)
- **Status:** PROPOSAL · NOT-IMPLEMENTED

### SEC-0002 — Zero trust between boundaries: no authority from network position
Every crossing of a trust boundary in `threat-model.md` §2 MUST be independently
authenticated and authorized. Network location, VPC membership, an internal load balancer,
a service mesh, or "it's behind the BFF" MUST NOT confer authority. Service-to-service calls
MUST carry verifiable workload identity; internal event streams MUST NOT be treated as
trusted merely because they are internal.
- **Threats:** THR-0005, THR-0015, THR-0018, THR-0021, THR-0022, THR-0026, THR-0027, THR-0041, THR-0046
- **Type:** `PREV`
- **Basis:** SOURCE `PROMPT:768` ("zero trust between boundaries"); `DOSSIER` records an AMH
  internal ALB path described as `sem WAF e sem rate-limit` — a concrete instance of network
  position being load-bearing
- **Verification:** per-boundary authentication tests; a negative test per boundary proving
  an unauthenticated internal caller is refused; network-path assumptions asserted in code,
  not documented in prose. **TST: UNASSIGNED**
- **Status:** PROPOSAL · NOT-IMPLEMENTED

### SEC-0003 — Least privilege, enforced at the resource, not the route
Authorization MUST be decided per resource instance (this patient, this encounter, this
alert, this tenant), not only per route or per scope. Every human role, workload identity,
CI token, database role, and cloud role MUST hold the minimum permission set for a declared
purpose, with no standing production PHI access for support or engineering roles. Scopes
alone are insufficient (`PROMPT:718`: "resource-level authorization beyond scopes").
- **Threats:** THR-0001, THR-0002, THR-0004, THR-0016, THR-0017, THR-0025, THR-0026, THR-0036, THR-0038, THR-0040, THR-0052, THR-0058, THR-0060
- **Type:** `PREV`
- **Basis:** SOURCE `PROMPT:768` ("least privilege"), `PROMPT:718`
- **Verification:** per-resource authorization tests incl. IDOR probes; **mutation testing on
  authorization policies** (`PROMPT:793` requires this explicitly); periodic effective-
  permission diff against declared policy. **TST: UNASSIGNED**
- **Status:** PROPOSAL · NOT-IMPLEMENTED

### SEC-0004 — Token validation policy with no fallback path
Token validation MUST verify signature against a pinned trusted key source, plus issuer,
audience, expiry, not-before, subject, tenant claim, and required scopes — with the tenant
claim **mandatory and never defaulted**. Any validation failure, key-fetch failure, network
error, parse error, or unknown issuer MUST result in denial. **No fallback issuer, no local
verification path, no cached-allow, no "degraded auth mode" may exist in the codebase** —
its absence MUST be assertable by static analysis, not merely by policy.
- **Threats:** THR-0021, THR-0022, THR-0024, THR-0049
- **Type:** `PREV`
- **Basis:** SOURCE `PROMPT:718`, `PROMPT:756`, `PROMPT:448`; `HAZ-0014` (legacy: "IAM
  validation falls back to local JWT on any error"); `PROMPT:107` (an AMH FHIR access
  procedure contains illustrative authentication pseudocode that **must not be imported as an
  implemented control**)
- **Verification:** negative-auth matrix (wrong issuer, wrong audience, expired, `alg=none`,
  unsigned, wrong key, absent tenant claim, tenant mismatch); **fault-injection on the key
  source proving denial rather than fallback**; static assertion that no alternate verification
  path exists. **TST: UNASSIGNED**
- **Depends on:** ADR 15 (`PROMPT:650`) — **TB-06's far side is undecided** (`threat-model.md` §2.2)
- **Status:** PROPOSAL · NOT-IMPLEMENTED

### SEC-0005 — Session and token handling hygiene
Tokens MUST NOT appear in URLs, path segments, query strings, referrers, or client-side
storage readable by scripts. Session cookies MUST be `Secure`, `HttpOnly`, and `SameSite`-
constrained. Refresh rotation MUST invalidate the predecessor atomically. Logout and
administrative revocation MUST take effect server-side within a declared bound. Session
lifetime and idle timeout MUST be explicit and clinically justified — a bedside workstation
and a remote session are different risk contexts.
- **Threats:** THR-0023, THR-0024
- **Type:** `PREV`
- **Basis:** SOURCE `PROMPT:718`, `PROMPT:756`; `HAZ-0014` (legacy: "cookies not Secure, URL
  tokens, refresh predecessor remains valid")
- **Verification:** token-in-URL scanner across routes and logs; refresh-reuse test asserting
  predecessor rejection; revocation-propagation timing test; clinical human-factors review of
  timeout values (a timeout that forces workarounds is a control that will be defeated).
  **TST: UNASSIGNED**
- **Status:** PROPOSAL · NOT-IMPLEMENTED

### SEC-0006 — Workload identity distinct from user identity; delegation carries context
Machine-to-machine identity MUST be separate from user identity and separately auditable.
Any call made on behalf of a user MUST carry that user's tenant, purpose, and resource scope
to the downstream decision point; a downstream MUST NOT authorize on the intermediary's
identity alone. Applies to the BFF, background workers, and **every MCP tool** (`PROMPT:734`).
- **Threats:** THR-0026, THR-0063, THR-0027
- **Type:** `PREV`
- **Basis:** SOURCE `PROMPT:650` (ADR 15 machine-to-machine identity), `PROMPT:718`, `PROMPT:734`
- **Verification:** confused-deputy test suite per boundary; assertion that no downstream
  authorization decision reads only the intermediary identity. **TST: UNASSIGNED**
- **Status:** PROPOSAL · NOT-IMPLEMENTED

### SEC-0007 — Break-glass access is governed, time-boxed, and loud
Emergency/elevated access MUST require a stated reason, be time-boxed with automatic expiry,
require a second authorizer where feasible, be restricted in scope, generate an immediate
high-visibility notification to a named owner, and produce an enriched audit record reviewed
within a declared period. Break-glass MUST NOT be a permanent role, and its non-use MUST be
as observable as its use.
- **Threats:** THR-0025, THR-0036
- **Type:** `PREV` + `DET` + `GOV`
- **Basis:** SOURCE `PROMPT:768` ("break-glass governance")
- **Verification:** expiry test; dual-authorization test; alerting test; audit-completeness
  test; periodic review evidence. **TST: UNASSIGNED**
- **Status:** PROPOSAL · NOT-IMPLEMENTED

### SEC-0008 — Access review, joiner/mover/leaver, and no shared accounts
Every human and machine identity MUST have a named owner and a periodic recertification.
Role changes MUST remove old permissions, not only add new ones. Departure MUST revoke
access within a declared bound. **Shared or ward accounts are prohibited** — they defeat
attribution (SEC-0032), access review, and anomaly detection simultaneously.
- **Threats:** THR-0024, THR-0025, THR-0031, THR-0044
- **Type:** `PREV` + `GOV`
- **Basis:** SOURCE `PROMPT:768` ("access review"); INFERENCE from THR-0044 (repudiation)
- **Verification:** recertification evidence; automated orphaned-account detection; assertion
  that authentication cannot succeed for a non-personal credential on clinical routes.
  **TST: UNASSIGNED**
- **Status:** PROPOSAL · NOT-IMPLEMENTED

### SEC-0009 — Tenant isolation enforced at the storage layer, with adversarial evidence
Tenant ownership MUST be an immutable column/attribute on every clinical fact, evaluation,
alert, work item, audit row, cache key, event, projection, and subscription, and MUST be
enforced by the storage layer (row-level security or equivalent) — **not compensated for in
application code**. No unscoped repository method, query builder path, topic, or subscription
may exist. Tenant isolation MUST have **adversarial evidence**, which Gate G6 requires
explicitly (`PROMPT:772`).
- **Threats:** THR-0001, THR-0002, THR-0004, THR-0016, THR-0017, THR-0018, THR-0019, THR-0063, THR-0067
- **Type:** `PREV` + `ASSUR`
- **Basis:** SOURCE `PROMPT:552`, `PROMPT:605`, `PROMPT:772`, `PROMPT:797`; complements `SAF-0008`
- **Verification:** row-level isolation tests; static check that no query can omit the
  ownership predicate; **an adversarial multi-tenant test campaign performed by someone who
  did not implement the isolation**, covering queries, caches, projections, topics,
  subscriptions, exports, error codes, and timing. Penetration test accepted by an
  independent verifier (`PROMPT:201`). **TST: UNASSIGNED**
- **Note:** the candidate topology hedges — "row-level tenant enforcement **if** the selected
  technology supports it" (`PROMPT:605`). **PROPOSAL: make storage-level enforcement a
  selection criterion for the datastore ADR rather than a property to be discovered
  afterwards.**
- **Depends on:** ADR 16, and the datastore choice
- **Status:** PROPOSAL · NOT-IMPLEMENTED

### SEC-0010 — No cross-tenant / cross-PJ correspondence capability in V2
V2 MUST NOT build, host, import, cache, or derive any structure that correlates subjects
across tenants, clinical legal entities (PJs), or source partitions — including dedup tables,
MPI caches, "same person" heuristics, analytics joins, and search indexes spanning tenants.
Identifiers MUST NOT be joined merely because a value matches. If cross-PJ context is ever
required, it arrives only through an explicit, purpose-bound, consent-filtered, AMH-owned
interface under a published contract.
- **Threats:** THR-0003, THR-0018, THR-0020, THR-0048
- **Type:** `PREV`
- **Basis:** SOURCE `PROMPT:446`, `IDP-09` (AMH's own index runs under a dedicated role, does
  not persist attributes, and awaits a legal opinion); complements `SAF-0009`
- **Verification:** schema assertion that no table/index/key spans tenants; negative tests for
  cross-PJ joins; architectural fitness function failing any query spanning tenant scope.
  **TST: UNASSIGNED**
- **Status:** PROPOSAL · NOT-IMPLEMENTED

---

## B. Data protection

### SEC-0011 — Encryption in transit on every hop, with verified peers
All traffic — external, internal, service-to-service, to datastores, brokers, caches, object
storage, and third parties — MUST use current TLS with certificate validation and no
downgrade path. Peer identity MUST be verified, not merely encrypted to. Internal hops are
**not** exempt (SEC-0002).
- **Threats:** THR-0018, THR-0022, THR-0027, THR-0041
- **Type:** `PREV`
- **Basis:** SOURCE `PROMPT:768` ("encryption in transit/at rest")
- **Verification:** TLS configuration tests incl. downgrade and invalid-certificate negative
  cases; assertion that no plaintext internal hop exists. **TST: UNASSIGNED**
- **Status:** PROPOSAL · NOT-IMPLEMENTED

### SEC-0012 — Encryption at rest across every copy, including the forgotten ones
Encryption at rest MUST cover the operational store, object storage, **queues, dead-letter
queues, quarantine stores, caches, search indexes, backups, snapshots, DR copies, evidence
exports, and log/trace storage**. The inventory of encrypted stores MUST be derived from the
data map (`privacy-data-map.md` §1) rather than from memory.
- **Threats:** THR-0031, THR-0033, THR-0053, THR-0060
- **Type:** `PREV`
- **Basis:** SOURCE `PROMPT:768`; `SAF-0023` (audit records containing PHI must be encrypted);
  `HAZ-0035` (legacy: "some snapshots are plaintext bytes")
- **Verification:** per-store encryption assertion in IaC tests; a periodic reconciliation
  proving the encrypted-store inventory matches the data map. **TST: UNASSIGNED**
- **Status:** PROPOSAL · NOT-IMPLEMENTED

### SEC-0013 — Managed key lifecycle: rotation, custody separation, and recoverability
Keys MUST be generated, stored, rotated, and revoked through a managed service with
documented rotation periods and automated rotation. Key custodians MUST be separate from
application operators. **Loss of a key MUST NOT mean loss of the clinical record**: recovery
procedures MUST be defined and exercised (paired with SEC-0048). Signing keys, data-
encryption keys, and integration credentials MUST have separate lifecycles and blast radii.
- **Threats:** THR-0027, THR-0053, THR-0057, THR-0058
- **Type:** `PREV` + `RESP`
- **Basis:** SOURCE `PROMPT:768` ("managed key rotation"), `PROMPT:652` (ADR 17)
- **Verification:** rotation drill with measured propagation; **key-loss recovery drill**;
  assertion of custodian separation. **TST: UNASSIGNED**
- **Status:** PROPOSAL · NOT-IMPLEMENTED

### SEC-0014 — Secret isolation and short-lived credentials
Secrets MUST NOT appear in source control, image layers, build logs, CI output, error
messages, configuration committed to the repository, or agent messages. Application and CI
credentials MUST be short-lived and workload-scoped wherever the platform allows. Secret
scanning MUST run from the first commit (`PROMPT:844`) and MUST be blocking. Configuration
MUST fail closed at startup when a required secret is absent — never fall back to a default
or a placeholder (`PROMPT:864` forbids placeholder secrets outright).
- **Threats:** THR-0023, THR-0027, THR-0030, THR-0052, THR-0053
- **Type:** `PREV`
- **Basis:** SOURCE `PROMPT:844`, `PROMPT:864`, `PROMPT:124` (rule 12)
- **Verification:** blocking secret scanning incl. git history; image-layer scanning;
  startup-fail-closed test with a required secret removed. **TST: UNASSIGNED**
- **Partial precedent:** the repository's `forbidden-content` CI job scans for credential-
  shaped strings today (`docs/14-devsecops-and-delivery/ci-policy.md` §1) — **but branch
  protection is not configured, so it does not block a merge** (THR-0055)
- **Status:** PROPOSAL · NOT-IMPLEMENTED

### SEC-0015 — Platform-enforced PHI redaction on every telemetry and error surface
Redaction MUST be enforced by the logging/tracing/metrics/error-serialization layer itself —
structured logging with allowlisted fields, typed problem details with no internal exception
text, metric labels that cannot carry identifiers. **Redaction MUST NOT depend on developer
discipline at each call site.** Health and readiness responses MUST expose degradation without
leaking PHI or internal secrets (`PROMPT:881`).
- **Threats:** THR-0023, THR-0028, THR-0029
- **Type:** `PREV` + `DET`
- **Basis:** SOURCE `PROMPT:124`, `PROMPT:710`, `PROMPT:757`, `PROMPT:881`; complements
  `SAF-0026`; `HAZ-0028` (legacy: "Logs include MPI identifiers and clinical values")
- **Verification:** PHI-shaped canary fixtures pushed through every log/trace/metric/error
  path with assertion of redaction; contract tests on error bodies; a log-sink scanner that
  fails the build on identifier-shaped content. **TST: UNASSIGNED**
- **Status:** PROPOSAL · NOT-IMPLEMENTED

### SEC-0016 — Data minimization enforced at contract boundaries
Every contract — API response, event envelope, projection, export, notification, MCP tool
result — MUST declare its fields explicitly and MUST NOT return "the whole resource" by
default. New fields require a stated purpose. Field sets MUST be reviewable as a diff.
`PROMPT:476` warns specifically against copying a 28-field envelope "if a smaller rigorously
governed contract suffices."
- **Threats:** THR-0017, THR-0028, THR-0029, THR-0031, THR-0032, THR-0062, THR-0067
- **Type:** `PREV`
- **Basis:** SOURCE `PROMPT:562` (principle 12), `PROMPT:476`, `PROMPT:768` ("data
  minimization, purpose limitation")
- **Verification:** schema tests asserting closed field sets; contract-diff review gate;
  assertion that no endpoint serializes a domain object directly. **TST: UNASSIGNED**
- **Status:** PROPOSAL · NOT-IMPLEMENTED

### SEC-0017 — Synthetic-only data outside production
No production data — and no extract, sample, or "anonymised" derivative of it — may exist in
development, test, preview, CI, or demo environments. Test data MUST be synthetic
(`docs/12-quality-validation-and-testing/synthetic-data-strategy.md`). Restoring production
data into a lower environment MUST be technically prevented, not merely discouraged.
- **Threats:** THR-0029, THR-0030, THR-0060
- **Type:** `PREV`
- **Basis:** SOURCE `PROMPT:124` (rule 12); complements `SAF-0026`
- **Verification:** canary detection in fixtures and CI artifacts (a precedent exists in the
  repository's `forbidden-content` job); environment-boundary control blocking production
  restore targets; periodic scan of non-production stores. **TST: UNASSIGNED**
- **Status:** PROPOSAL · NOT-IMPLEMENTED

### SEC-0018 — Notification payload minimization
Outbound notifications on external channels (SMS, email, push, pager, webhook) MUST carry
only a non-identifying reference and a severity/urgency indicator sufficient to prompt the
recipient to open the authenticated application. **No clinical values, no patient identifiers,
no names, no bed identifiers where they identify a patient in context** — including in push
previews rendered on a locked device.
- **Threats:** THR-0032, THR-0041
- **Type:** `PREV`
- **Basis:** SOURCE `PROMPT:757` (notifications named explicitly), `PROMPT:562`
- **Verification:** payload contract tests per channel; a rendering test of the locked-screen
  preview; assertion that the notification builder cannot access clinical fields.
  **TST: UNASSIGNED**
- **Status:** PROPOSAL · NOT-IMPLEMENTED

### SEC-0019 — Support, ticketing, and screen-sharing workflows are technically constrained
Support workflows MUST NOT require or permit copying clinical data into tickets, chats,
screenshots, or shared documents. Diagnostic capability MUST be provided by tooling that
carries the same authorization and audit as the application (support access is *access*, and
is auditable as such), with time-boxed elevation via SEC-0007. Client-side caches MUST be
clearable and MUST be cleared on session end.
- **Threats:** THR-0019, THR-0033
- **Type:** `PREV` + `GOV`
- **Basis:** SOURCE `PROMPT:757` ("support workflows"), `PROMPT:663` ("privacy-aware cache
  clearing")
- **Verification:** support-tool audit-coverage test; cache-clearing test on logout and
  session expiry; periodic ticket-content scan. **TST: UNASSIGNED**
- **Status:** PROPOSAL · NOT-IMPLEMENTED

### SEC-0020 — Secure deletion and controlled export
Deletion MUST be implementable across **every** copy identified in the data map, including
backups, caches, projections, queues, search indexes, and exports — reconciled against audit
immutability and retention obligations (`privacy-data-map.md` §4.1). Every export MUST be
authorized, purpose-bound, minimized, logged, and integrity-verifiable.
- **Threats:** THR-0020, THR-0031, THR-0033, THR-0060
- **Type:** `PREV` + `GOV`
- **Basis:** SOURCE `PROMPT:768` ("policy-driven retention/legal hold… secure deletion")
- **Verification:** deletion-reach test across every declared store; export authorization and
  audit tests; evidence-export integrity check (`PROMPT:879`). **TST: UNASSIGNED**
- **Blocked on:** the retention determination — `AUTH-PRIVACY-LEGAL`, **UNASSIGNED**
- **Status:** PROPOSAL · NOT-IMPLEMENTED

---

## C. Integrity of the clinical data flow

### SEC-0021 — Canonical idempotency and replay protection
Every ingested envelope and every state-changing command MUST carry a canonical,
source-derived, durable, cross-process idempotency key. Keys derived from mutable or
patient-derived values are prohibited. Replays MUST be provably no-ops. Replay windows and
ordering scope MUST be explicit (`PROMPT:708`).
- **Threats:** THR-0007, THR-0011, THR-0012, THR-0013, THR-0043, THR-0045
- **Type:** `PREV`
- **Basis:** SOURCE `PROMPT:707-708`, `PROMPT:724`; complements `SAF-0013`
- **Verification:** duplicate-delivery and crash-point replay tests; idempotency property
  tests; adversarial replay of captured requests. **TST: UNASSIGNED**
- **Status:** PROPOSAL · NOT-IMPLEMENTED

### SEC-0022 — Authenticated provenance on internal events and ingested envelopes
Every event on the internal stream and every ingested source envelope MUST carry verifiable
provenance — an authenticated producer identity, and integrity protection appropriate to the
transport — such that a fabricated or modified event is detectable. Publish rights MUST be
scoped per topic and per producer; **no component may publish to a topic it does not own.**
- **Threats:** THR-0005, THR-0010, THR-0011, THR-0015, THR-0041
- **Type:** `PREV` + `DET`
- **Basis:** SOURCE `PROMPT:476` (envelope must define source system/record/version,
  correlation/causation, schema reference, manifest digest), `PROMPT:724`
- **Verification:** forged-event rejection test; publish-authorization test per topic;
  provenance-completeness assertion on every envelope. **TST: UNASSIGNED**
- **Status:** PROPOSAL · NOT-IMPLEMENTED

### SEC-0023 — Durability precedes delivery
State changes MUST be committed durably with their outbox entry in the same transaction
before any real-time delivery is attempted. WebSocket/SSE/MCP output is a projection, never
the system of record and never the only copy. Delivery failure MUST leave the item
recoverable and reachable by polling.
- **Threats:** THR-0012, THR-0039, THR-0042, THR-0066
- **Type:** `PREV`
- **Basis:** SOURCE `PROMPT:121` (rule 9), `PROMPT:556`; complements `SAF-0015`
- **Verification:** crash-point tests between commit and publish; outbox replay tests;
  kill-the-socket test proving reachability. **TST: UNASSIGNED**
- **Status:** PROPOSAL · NOT-IMPLEMENTED

### SEC-0024 — Trusted time
Hosts MUST synchronize to an authenticated, monitored time source with alerting on drift
beyond a declared bound. The evaluation clock MUST be explicit and testable rather than
implicit host time. Implausible clinical times MUST be detected and quarantined, never
accepted or defaulted. Token expiry validation MUST tolerate a bounded, declared skew and no
more. Audit ordering MUST NOT depend on unverified host clocks.
- **Threats:** THR-0007, THR-0010, THR-0013, THR-0049
- **Type:** `PREV` + `DET`
- **Basis:** SOURCE `PROMPT:598`, `PROMPT:761`, `PROMPT:803` (clock-skew tests);
  complements `SAF-0012`
- **Verification:** clock-skew test suite; DST-transition fixtures for `America/Sao_Paulo`;
  drift alerting test; token-expiry boundary tests. **TST: UNASSIGNED**
- **Status:** PROPOSAL · NOT-IMPLEMENTED

### SEC-0025 — Terminology and profile version pinning with digest verification
Terminology systems, value sets, FHIR profiles, and IG packages MUST be pinned to exact
versions with verified digests, recorded in every evaluation record, and changed only through
a reviewed, tested update. Drift MUST be detected automatically at the boundary and MUST fail
closed rather than reinterpret.
- **Threats:** THR-0009, THR-0047
- **Type:** `PREV` + `DET`
- **Basis:** SOURCE `PROMPT:716`, `PROMPT:508` (digest-verified, pinned to exact commits);
  `DOSSIER` C-4 (a producer plan emitting a shape its own profile forbids)
- **Verification:** contract-drift detection against the pinned manifest; terminology
  conformance suite; negative test that an unpinned or digest-mismatched package fails to
  load. **TST: UNASSIGNED**
- **Status:** PROPOSAL · NOT-IMPLEMENTED

### SEC-0026 — Validate and quarantine at ingress; never coerce
Every ingested item MUST be validated structurally **and semantically** before acceptance.
Unknown codes, unmapped concepts, missing or non-canonical units, absent timestamps,
references to absent encounters, and out-of-contract shapes MUST be quarantined or explicitly
represented — **never coerced to a default, a nearest match, or a zero**. Quarantine MUST be
durable, inspectable, and itself governed as a PHI store (SEC-0012).
- **Threats:** THR-0005..THR-0010, THR-0012, THR-0013, THR-0047, THR-0048, THR-0066
- **Type:** `PREV`
- **Basis:** SOURCE `PROMPT:716`, `PROMPT:119` (rule 7), `PROMPT:724`; complements `SAF-0028`,
  `SAF-0002`; `PROMPT:105` (52,452 clinical rows referencing absent encounters)
- **Verification:** malformed/unknown/absent-field fixture matrices; assertion that no
  serializer or scorer accepts an unvalidated item; quarantine round-trip test.
  **TST: UNASSIGNED**
- **Status:** PROPOSAL · NOT-IMPLEMENTED

### SEC-0027 — Optimistic concurrency and mandatory actor attribution on state change
Every state-changing operation MUST require a concurrency token and MUST record the
authenticated actor, purpose, tenant, and rationale where the transition requires one.
Conflicting concurrent transitions MUST be rejected and surfaced — never silently merged or
last-write-wins. Bulk operations MUST be atomic or return explicit per-item results.
- **Threats:** THR-0011, THR-0043, THR-0044, THR-0045, THR-0064
- **Type:** `PREV` + `DET`
- **Basis:** SOURCE `PROMPT:707`, `PROMPT:760`; complements `SAF-0017`, `SAF-0018`
- **Verification:** two-writer race property tests; idempotent-retry tests; assertion that no
  transition can persist without an actor. **TST: UNASSIGNED**
- **Status:** PROPOSAL · NOT-IMPLEMENTED

---

## D. Clinical-content supply chain (TB-12)

### SEC-0028 — Rule bundles are signed, and verification fails closed
Clinical rule bundles MUST be immutable, versioned, and cryptographically signed. Signature
and content hash MUST be verified at load. **Verification failure MUST prevent activation —
there MUST be no "load anyway", no unsigned-development-mode reachable in a deployed
environment, and no fallback to a previously cached bundle without an explicit, audited
decision.** The active bundle's identity and hash MUST appear in every evaluation record.
- **Threats:** THR-0034, THR-0035, THR-0051, THR-0056
- **Type:** `PREV`
- **Basis:** SOURCE `PROMPT:122` (rule 10), `PROMPT:641` (ADR 7); complements `SAF-0020`
- **Verification:** signature-verification test incl. tampered-bundle negative case;
  assertion that an unsigned bundle cannot activate in any environment flagged as clinical.
  **TST: UNASSIGNED**
- **Status:** PROPOSAL · NOT-IMPLEMENTED

### SEC-0029 — Author ≠ approver, enforced technically
The rule-bundle registry MUST record author and clinical approver as distinct identities and
MUST reject a bundle where they are the same. The same constraint MUST apply to security-
control implementation vs. verification, and to migration implementation vs. restore
verification.
- **Threats:** THR-0034, THR-0056
- **Type:** `PREV` + `GOV`
- **Basis:** SOURCE `PROMPT:122`, `PROMPT:197-207`; complements `SAF-0037`
- **Verification:** registry constraint test rejecting same-identity pairs; audit of the
  evidence table before G6 and G8. **TST: UNASSIGNED**
- **Status:** PROPOSAL · NOT-IMPLEMENTED

### SEC-0030 — One active version, transactional activation/rollback, authorized kill switch
Every runtime instance MUST agree on exactly one active version per bundle at any instant.
Activation and rollback MUST be transactional and audited. A per-bundle kill switch MUST
exist, be exercisable without a code deploy, take effect within a declared bound across all
instances, **require strong authorization and produce a loud audit record**, and put affected
evaluations into an explicit `not_evaluated` state — never a silent no-fire.
- **Threats:** THR-0034, THR-0035, THR-0036
- **Type:** `PREV` + `RESP`
- **Basis:** SOURCE `PROMPT:862`, `PROMPT:345`; complements `SAF-0021`
- **Verification:** multi-instance activation/rollback test; kill-switch drill measuring
  propagation and resulting status; negative test that an unauthorized caller cannot trigger
  it. **TST: UNASSIGNED**
- **Status:** PROPOSAL · NOT-IMPLEMENTED

### SEC-0031 — Verification artifacts have an independent trust root
Reference vectors, test packs, terminology snapshots, and approval records MUST be
digest-pinned, tamper-evident, and **not modifiable by the same pipeline identity that
produces the artifact they verify**. A change to a test vector MUST be as visible and as
reviewed as a change to the rule it validates.
- **Threats:** THR-0056, THR-0034, THR-0055
- **Type:** `ASSUR`
- **Basis:** INFERENCE from `PROMPT:794`, `PROMPT:808`, and abuse case AC-4
  (`threat-model.md` §7); `docs/12-quality-validation-and-testing/clinical-reference-vector-standard.md`
- **Verification:** digest verification of the vector corpus at test time; separation-of-
  identity assertion in CI; review gate on vector diffs. **TST: UNASSIGNED**
- **Status:** PROPOSAL · NOT-IMPLEMENTED

---

## E. Audit, detection, and response

### SEC-0032 — Tamper-evident, append-only audit covering reads as well as writes
Audit MUST record every clinical **read**, state change, evaluation, alert transition,
override, suppression, configuration change, routing change, rule activation, kill-switch
use, break-glass use, and export — with actor, purpose, tenant, resource, time, and
correlation. Records MUST be append-only and tamper-evident (hash-chained, WORM, or
equivalent), retained per policy, and exportable as evidence.
- **Threats:** THR-0008, THR-0015, THR-0025, THR-0028, THR-0036, THR-0037, THR-0038, THR-0040, THR-0043, THR-0044, THR-0049, THR-0052, THR-0065
- **Type:** `DET`
- **Basis:** SOURCE `PROMPT:594`, `PROMPT:768` ("tamper-evident audit"); complements `SAF-0023`;
  `HAZ-0035` (legacy: "alert transitions are not audited")
- **Why reads specifically:** without read audit, the scope of a disclosure incident cannot be
  determined and notification must assume worst case (`privacy-data-map.md` §10).
- **Verification:** audit-completeness test per operation type incl. reads; tamper-evidence
  test (a modified record must be detectable); evidence-export integrity check.
  **TST: UNASSIGNED**
- **Status:** PROPOSAL · NOT-IMPLEMENTED

### SEC-0033 — Security monitoring and anomaly detection on access patterns
The system MUST monitor and alert on: cross-tenant policy denials, bulk read volume outside
normal clinical patterns, access to patients outside a user's unit/assignment, off-hours
access anomalies, repeated authorization failures, unusual export activity, and MCP tool
usage anomalies. `PROMPT:878` names "cross-tenant policy denials and suspicious access" as a
required operability signal.
- **Threats:** THR-0002, THR-0004, THR-0016, THR-0017, THR-0019, THR-0025, THR-0027, THR-0038, THR-0040, THR-0067
- **Type:** `DET`
- **Basis:** SOURCE `PROMPT:878`
- **Verification:** detection tests with simulated anomalous patterns; alert-routing test to a
  named owner; measured false-positive rate. **TST: UNASSIGNED**
- **Status:** PROPOSAL · NOT-IMPLEMENTED

### SEC-0034 — Delivery reconciliation: generated ≠ displayed is measured and alerted
The interval and loss between alert generation, durable commit, delivery, display, and
acknowledgment MUST be measured as an SLI. An alert generated but not displayed to any
authorized human within a declared bound MUST raise an operational signal visible to the
clinical operator. Suppression and dedup MUST NOT reduce this count silently.
- **Threats:** THR-0014, THR-0037, THR-0038, THR-0039, THR-0040, THR-0041, THR-0042, THR-0059
- **Type:** `DET`
- **Basis:** SOURCE `PROMPT:804`, `PROMPT:870-875`; complements `SAF-0016`
- **Included here rather than only in the safety package because** the same monitor is the
  detection control for a deliberate suppression attack (THR-0038) and for a delivery denial
  of service (THR-0042) — availability of the safety loop is a security property.
- **Verification:** synthetic end-to-end probes; failover test measuring loss; reconciliation
  report. **TST: UNASSIGNED**
- **Status:** PROPOSAL · NOT-IMPLEMENTED

### SEC-0035 — Incident response, including a privacy-breach path
A documented, exercised incident-response process MUST exist covering detection, triage,
containment, eradication, recovery, clinical-safety escalation, and a **distinct
privacy-breach assessment and notification path** with named owners and declared timelines.
Clinical incidents and security incidents MUST have a joint escalation path — the six `joint`
hazards are precisely the cases where one is the other.
- **Threats:** THR-0058, and containment for all
- **Type:** `RESP` + `GOV`
- **Basis:** SOURCE `PROMPT:768` ("incident response"), `PROMPT:898`
- **Verification:** tabletop and game-day exercises with measured detection-to-containment
  time; a joint clinical/security escalation drill. **TST: UNASSIGNED**
- **Blocked on:** `AUTH-SECURITY` (`BLK-0003`), `AUTH-PRIVACY-LEGAL` (`BLK-0004`),
  `AUTH-OPERATIONS` (`BLK-0007`) — all **UNASSIGNED**
- **Status:** PROPOSAL · NOT-IMPLEMENTED

---

## F. Software supply chain (TB-09)

### SEC-0036 — Dependency pinning, lockfile integrity, and reviewed additions
All dependencies (direct and transitive) MUST be pinned with integrity hashes in a committed
lockfile. Toolchains MUST be pinned. Builds MUST be reproducible where the ecosystem allows,
so substitution is detectable by comparison. New dependencies MUST require review;
install/build scripts MUST be disabled or explicitly allowlisted.
- **Threats:** THR-0050, THR-0054
- **Type:** `PREV`
- **Basis:** SOURCE `PROMPT:838` ("pinned toolchains/dependencies and deterministic
  lockfiles"), `PROMPT:657` (ADR 22)
- **Verification:** lockfile-integrity CI check (blocking); reproducibility comparison across
  two independent builds; assertion that no unpinned dependency resolves. **TST: UNASSIGNED**
- **Status:** PROPOSAL · NOT-IMPLEMENTED

### SEC-0037 — SBOM, vulnerability, and license gating — blocking
Every build MUST produce an SBOM and vulnerability/license results, retained as release
evidence. Thresholds MUST be defined and MUST **block**, with exceptions requiring a named
approver, an expiry date, and a register entry — never an indefinite silent waiver.
- **Threats:** THR-0050, THR-0054, THR-0055
- **Type:** `DET` + `ASSUR`
- **Basis:** SOURCE `PROMPT:855`, `PROMPT:802`, `PROMPT:125` (rule 13)
- **Verification:** meta-test proving the gate fails on a seeded vulnerable dependency and on
  an empty scan result; exception-register audit. **TST: UNASSIGNED**
- **Status:** PROPOSAL · NOT-IMPLEMENTED

### SEC-0038 — Artifact signing, provenance attestation, and deploy-by-digest
Build artifacts MUST be signed with provenance attestation binding artifact → source commit →
build environment. Deployment MUST reference an **immutable digest**, never a mutable tag,
and MUST verify the signature and attestation at admission. `PROMPT:864`: *"Never deploy
`latest`, placeholder secrets, unpinned actions, or environment-specific builds."* The
identical artifact MUST be promoted through environments (`PROMPT:861`).
- **Threats:** THR-0051, THR-0054, THR-0047
- **Type:** `PREV`
- **Basis:** SOURCE `PROMPT:855-856`, `PROMPT:861`, `PROMPT:864`, `PROMPT:657`
- **Verification:** admission test rejecting an unsigned or unattested artifact; negative test
  substituting a digest; promotion test asserting digest equality across environments.
  **TST: UNASSIGNED**
- **Status:** PROPOSAL · NOT-IMPLEMENTED

### SEC-0039 — Hardened CI/CD
CI MUST: pin all actions/plugins by full commit SHA; grant least-privilege, short-lived
tokens per job; deny secret access to workflows triggered by untrusted contributions; use
ephemeral, non-shared runners for release builds; treat all PR-supplied metadata as untrusted
input (no script injection); separate build identity from deploy identity; and audit workflow
changes as code changes with `CODEOWNERS` review.
- **Threats:** THR-0050, THR-0051, THR-0052, THR-0054, THR-0055
- **Type:** `PREV`
- **Basis:** SOURCE `PROMPT:832-844`, `PROMPT:864`
- **Partial precedent:** the repository's one existing workflow already pins actions by full
  commit SHA (`docs/14-devsecops-and-delivery/ci-policy.md` §1) — **a good pattern to preserve,
  not evidence of a control**
- **Verification:** workflow-lint asserting SHA pinning and permission scoping; a negative test
  proving a fork-triggered workflow cannot reach secrets. **TST: UNASSIGNED**
- **Status:** PROPOSAL · NOT-IMPLEMENTED

### SEC-0040 — Every safety and security gate blocks, and a gate that validates nothing FAILS
Safety- and security-critical checks MUST be required, blocking status checks from the moment
they are introduced — never `continue-on-error`, never "warn-only to be tightened later". **A
gate that collects zero cases, self-skips, or silently excludes a suite MUST fail the pipeline
rather than pass.** Branch protection MUST enforce this.
- **Threats:** THR-0006, THR-0030, THR-0055, and assurance for all
- **Type:** `ASSUR`
- **Basis:** SOURCE `PROMPT:125` (rule 13), `PROMPT:808`; complements `SAF-0030`; observed
  anti-pattern precedent at AMH (`PROMPT:106`, only `Security Gate` required)
- **OBSERVED gap today:** the repository's two docs-gates jobs run on every push and PR and are
  not `continue-on-error` — **but branch protection is not configured**, so a writer can merge
  past a red check (`docs/14-devsecops-and-delivery/ci-policy.md` §1;
  `branch-protection-request.md`, status BLOCKED). **This is THR-0055 in the present tense, in
  this repository, today.**
- **Verification:** meta-test asserting each gate fails on an empty corpus; **branch-protection
  configuration asserted programmatically, not claimed in prose**. **TST: UNASSIGNED**
- **Status:** PROPOSAL · NOT-IMPLEMENTED

---

## G. MCP and AI surfaces (TB-08)

### SEC-0041 — Narrow, typed, versioned, read-only-by-default MCP tools under first-party policy
Every MCP tool MUST be narrowly scoped to one domain query or command, strongly typed,
versioned, and **read-only by default**. Tools MUST enforce the same identity, tenant,
purpose, resource, and audit policy as first-party APIs — MCP is *not* an authorization
boundary and *not* a clinical source of truth. Tool inputs and outputs MUST be validated, and
outputs MUST carry provenance, freshness, warnings, and confidence.
- **Threats:** THR-0061, THR-0063, THR-0064, THR-0065, THR-0066, THR-0067
- **Type:** `PREV`
- **Basis:** SOURCE `PROMPT:728-742`, `PROMPT:109`; complements `SAF-0027`
- **Verification:** unauthorized-access, cross-tenant-inference, confused-deputy, replay,
  injection, exfiltration, unsafe-chaining, stale-data, and partial-failure tests — the exact
  list `PROMPT:741` requires. **TST: UNASSIGNED**
- **Depends on:** ADR 14 (`PROMPT:649`) — unwritten
- **Status:** PROPOSAL · NOT-IMPLEMENTED

### SEC-0042 — Structural separation of trusted instructions from untrusted content, plus injection defenses
Untrusted content — clinical notes, documents, source records, device strings, patient-
supplied fields, and **tool outputs** — MUST be structurally separated from instructions
(distinct channels/roles/delimited envelopes), never concatenated into an instruction stream.
Content MUST be treated as data at all times: no instruction-following from within content, no
tool invocation derived solely from content, no rendering of content-supplied links, images,
or markup that can initiate a request. Outputs MUST be validated against an expected schema
before use or display.
- **Threats:** THR-0061, THR-0062, THR-0029
- **Type:** `PREV`
- **Basis:** SOURCE `PROMPT:737-738` ("defend against prompt injection and malicious data
  embedded in source records or documents"; "separate trusted instructions from untrusted
  clinical/document content"); complements `SAF-0027`
- **Verification:** an injection corpus embedded in every untrusted field type, asserting no
  instruction is followed and no tool is invoked; egress assertion that no content-derived URL
  is fetched or rendered; output-schema conformance tests. **TST: UNASSIGNED**
- **Realism note:** injection defenses are **mitigations, not solutions**. Their limits are the
  reason SEC-0041 (read-only by default), SEC-0044 (human confirmation), and SEC-0043
  (grounding) exist — the architecture must remain safe when SEC-0042 fails.
- **Status:** PROPOSAL · NOT-IMPLEMENTED

### SEC-0043 — Grounding: model prose never replaces the signed deterministic record
Model-generated text MUST NOT replace, restate as authoritative, summarise away, or contradict
the signed deterministic evaluation record. Where prose is shown, it MUST be visually and
structurally distinguished from ratified clinical output, MUST carry provenance, freshness and
uncertainty, and MUST be traceable to the specific records it derives from. **No clinical
decision path may consume model prose as an input.**
- **Threats:** THR-0065, THR-0061
- **Type:** `PREV` + `DET`
- **Basis:** SOURCE `PROMPT:742`, `PROMPT:739`, `PROMPT:1063`; complements `SAF-0027`
- **Verification:** assertion that no evaluation, alert, or state transition takes model output
  as an input; UI component tests for the distinction; a human-factors check that clinicians
  actually perceive it — **VALIDATION REQUIRED**, no named owner. **TST: UNASSIGNED**
- **Status:** PROPOSAL · NOT-IMPLEMENTED

### SEC-0044 — Explicit human confirmation for high-consequence writes; no autonomous clinical action
Any state-changing operation reachable through an AI/MCP path MUST require explicit human
confirmation showing exactly what will change, and MUST record the confirming human as the
actor. Autonomous clinical action is prohibited unless separately approved through the
intended-use and clinical-safety governance path. Tool chains MUST NOT reach a write through
composition without that confirmation.
- **Threats:** THR-0064
- **Type:** `PREV`
- **Basis:** SOURCE `PROMPT:733`, `PROMPT:127` (rule 15); complements `SAF-0027`, `SAF-0035`
- **Verification:** chaining tests proving no composed path reaches a write without
  confirmation; audit assertion that the actor on any AI-originated change is a human.
  **TST: UNASSIGNED**
- **Status:** PROPOSAL · NOT-IMPLEMENTED

### SEC-0045 — Per-tool rate limiting, monitoring, revocation, and kill switch
Each MCP tool MUST have independent rate limits and quotas, usage monitoring with anomaly
alerting, individual revocation, and a kill switch effective without a deploy. Disabling a
tool MUST degrade explicitly and visibly, never silently.
- **Threats:** THR-0061, THR-0062, THR-0064, THR-0067
- **Type:** `DET` + `RESP`
- **Basis:** SOURCE `PROMPT:740`
- **Verification:** rate-limit tests; kill-switch drill with measured propagation; monitoring
  coverage assertion per tool. **TST: UNASSIGNED**
- **Status:** PROPOSAL · NOT-IMPLEMENTED

### SEC-0046 — No PHI to model providers absent approved legal, privacy, security, residency, and contractual controls
No patient-identifying or clinical data may be transmitted to any model provider, in any
environment, under any framing — including "de-identified", "summarised", or "only the
values" — until **all five** controls named in `PROMPT:736` are in place and approved by
`AUTH-PRIVACY-LEGAL` and `AUTH-SECURITY`. Enforcement MUST be technical (egress control and
payload inspection at the boundary), not policy alone.
- **Threats:** THR-0029, THR-0032, THR-0062
- **Type:** `PREV`
- **Basis:** SOURCE `PROMPT:736`; `privacy-data-map.md` §5.5
- **Current state:** **no model provider is selected and none of the five controls exists.**
  The control's present operative meaning is therefore a prohibition, not a configuration.
- **Verification:** egress-boundary test with PHI-shaped canaries asserting block; assertion
  that no prompt-construction path can read a clinical field. **TST: UNASSIGNED**
- **Status:** PROPOSAL · NOT-IMPLEMENTED

---

## H. Resilience, recovery, and degradation

### SEC-0047 — Backup integrity verification and isolated, immutable copies
Backups MUST be encrypted, integrity-verified on write and periodically thereafter, and held
in a location **outside the production credential and network blast radius**, with immutability
/ object-lock for a declared window. Backup access MUST be separately authorized and audited.
Restoring into a non-production environment MUST be technically prevented (SEC-0017).
- **Threats:** THR-0033, THR-0053, THR-0057, THR-0058, THR-0060
- **Type:** `PREV` + `RESP`
- **Basis:** SOURCE `PROMPT:768`, `PROMPT:879`; complements `SAF-0036`
- **Verification:** periodic integrity verification with alerting; a negative test proving
  production credentials cannot delete or alter backups. **TST: UNASSIGNED**
- **Status:** PROPOSAL · NOT-IMPLEMENTED

### SEC-0048 — Exercised restore and post-downtime reconciliation, verified independently
Restore to a declared RPO/RTO, migration rollback, key-loss recovery, and post-downtime
clinical reconciliation MUST be **exercised and measured** before any clinical reliance.
Documented plans, provisioned resources, and passing health checks do not satisfy this. The
restore verifier MUST NOT be the migration implementer (`PROMPT:204`). Reconciliation MUST
tell clinicians what was and was not evaluated during the outage.
- **Threats:** THR-0053, THR-0057, THR-0059
- **Type:** `RESP` + `ASSUR`
- **Basis:** SOURCE `PROMPT:763`, `PROMPT:879`, `PROMPT:894`; complements `SAF-0036`, `SAF-0024`;
  `HAZ-0034` (legacy: no restore evidence of any kind was found)
- **Verification:** executed restore drill with measured RTO/RPO; rollback rehearsal;
  reconciliation report; game-day exercise. **TST: UNASSIGNED**
- **Status:** PROPOSAL · NOT-IMPLEMENTED

### SEC-0049 — Fail-visible degradation; readiness represents safe capability
Readiness MUST represent safe clinical capability, not process liveness, and MUST fail when
rule bundles failed to load, a required feed is stale, identity validation is impaired, or
delivery is degraded. Degradation MUST be explicit at component, data, rule, workflow, and UI
levels and visible **at the point of care**, not only on an operator dashboard — without
leaking PHI or internal secrets.
- **Threats:** THR-0014, THR-0021, THR-0035, THR-0039, THR-0042, THR-0046, THR-0059
- **Type:** `DET`
- **Basis:** SOURCE `PROMPT:881`, `PROMPT:557`; complements `SAF-0024`, `SAF-0025`;
  `HAZ-0025` (legacy: "Readiness can still be falsely positive")
- **Security framing:** a system that reports healthy while an authentication or integration
  dependency is failing converts an availability incident into a **silent integrity incident** —
  which is why this appears in the security catalog as well as the safety requirements.
- **Verification:** readiness tests asserting failure on each impairment class; feed-outage
  scenario test asserting per-patient degraded indicators. **TST: UNASSIGNED**
- **Status:** PROPOSAL · NOT-IMPLEMENTED

### SEC-0050 — Rate limiting, quotas, and backpressure on every ingress
Every ingress — public API, internal API, integration ingest, real-time gateway, MCP surface —
MUST have rate limits, connection and queue bounds, per-tenant quotas preventing one tenant
from degrading another, and explicit backpressure that **sheds load without silently dropping
clinical facts** (`SEC-0023` durability applies). Expensive queries MUST be bounded and
paginated.
- **Threats:** THR-0014, THR-0042
- **Type:** `PREV`
- **Basis:** SOURCE `PROMPT:707` (pagination/cursors), `PROMPT:740`, `PROMPT:803` (load, soak,
  backpressure tests)
- **Verification:** load and backpressure tests asserting no clinical fact is lost under shed;
  per-tenant noisy-neighbour test. **TST: UNASSIGNED**
- **Status:** PROPOSAL · NOT-IMPLEMENTED

---

## 13. Threat → control coverage

Every threat in `threat-model.md` has at least one candidate control; every control traces to
at least one threat.

| THR | Candidate controls |
|---|---|
| THR-0001 wrong/forged tenant context | SEC-0001, SEC-0002, SEC-0009, SEC-0003 |
| THR-0002 unscoped query/projection | SEC-0009, SEC-0001, SEC-0003, SEC-0033 |
| THR-0003 identifier-match cross-scope join | SEC-0010, SEC-0001, SEC-0026, SEC-0003 |
| THR-0004 IDOR on encounter/alert/patient | SEC-0003, SEC-0009, SEC-0033 |
| THR-0005 location/bed feed poisoning | SEC-0026, SEC-0002, SEC-0022 |
| THR-0006 absence coerced to a value | SEC-0026, SEC-0040, SEC-0021 |
| THR-0007 staleness masked | SEC-0024, SEC-0021, SEC-0026 |
| THR-0008 correction dropped/overwritten | SEC-0026, SEC-0032, SEC-0027 |
| THR-0009 code/unit coercion | SEC-0025, SEC-0026, SEC-0040 |
| THR-0010 timestamp forgery/substitution | SEC-0024, SEC-0026, SEC-0022 |
| THR-0011 replay without idempotency | SEC-0021, SEC-0027, SEC-0022 |
| THR-0012 pre-durability ACK / lost message | SEC-0023, SEC-0021, SEC-0026 |
| THR-0013 reordering across lanes | SEC-0021, SEC-0024, SEC-0026 |
| THR-0014 flood / lane saturation | SEC-0050, SEC-0049, SEC-0034 |
| THR-0015 internal event injection | SEC-0022, SEC-0002, SEC-0003, SEC-0032 |
| THR-0016 unauthorized real-time subscription | SEC-0009, SEC-0003, SEC-0002, SEC-0033 |
| THR-0017 cross-tenant inference / side channel | SEC-0009, SEC-0033, SEC-0016, SEC-0003 |
| THR-0018 cross-partition reference / bypass claim | SEC-0001, SEC-0009, SEC-0002, SEC-0010 |
| THR-0019 cache/projection key collision | SEC-0009, SEC-0019, SEC-0033 |
| THR-0020 V2 as cross-PJ correspondence index | SEC-0010, SEC-0016, SEC-0020 |
| THR-0021 fail-open identity | SEC-0004, SEC-0001, SEC-0002, SEC-0049 |
| THR-0022 issuer/audience confusion | SEC-0004, SEC-0001, SEC-0002 |
| THR-0023 token leakage | SEC-0005, SEC-0015, SEC-0014 |
| THR-0024 session/refresh flaws | SEC-0005, SEC-0004, SEC-0008 |
| THR-0025 over-privilege / ungoverned break-glass | SEC-0003, SEC-0007, SEC-0008, SEC-0032 |
| THR-0026 confused deputy | SEC-0006, SEC-0002, SEC-0001, SEC-0003 |
| THR-0027 M2M credential compromise | SEC-0014, SEC-0013, SEC-0011, SEC-0003, SEC-0033 |
| THR-0028 PHI in logs/traces/errors | SEC-0015, SEC-0016, SEC-0032 |
| THR-0029 PHI in prompts / model requests | SEC-0046, SEC-0016, SEC-0015, SEC-0017 |
| THR-0030 PHI in fixtures/source control/CI | SEC-0017, SEC-0014, SEC-0040 |
| THR-0031 PHI in queues/caches/quarantine | SEC-0012, SEC-0016, SEC-0020, SEC-0008 |
| THR-0032 PHI in notifications | SEC-0018, SEC-0016, SEC-0046 |
| THR-0033 PHI in backups/exports/support | SEC-0012, SEC-0019, SEC-0020, SEC-0047 |
| THR-0034 unsigned/unapproved rule bundle | SEC-0028, SEC-0029, SEC-0030, SEC-0031 |
| THR-0035 rollback failure / version drift | SEC-0030, SEC-0028, SEC-0049 |
| THR-0036 kill switch absent or unprotected | SEC-0030, SEC-0003, SEC-0032, SEC-0007 |
| THR-0037 no-fire opacity | SEC-0032, SEC-0028, SEC-0034 |
| THR-0038 suppression/routing tampering | SEC-0032, SEC-0003, SEC-0033, SEC-0034 |
| THR-0039 generated but never displayed | SEC-0023, SEC-0034, SEC-0049 |
| THR-0040 misrouted / firehose alerts | SEC-0003, SEC-0009, SEC-0032, SEC-0034 |
| THR-0041 notification channel spoof/compromise | SEC-0034, SEC-0018, SEC-0011, SEC-0002, SEC-0022 |
| THR-0042 real-time gateway DoS | SEC-0050, SEC-0034, SEC-0049, SEC-0023 |
| THR-0043 lost update | SEC-0027, SEC-0021, SEC-0032 |
| THR-0044 action repudiation | SEC-0032, SEC-0027, SEC-0008, SEC-0003 |
| THR-0045 masked partial bulk failure | SEC-0027, SEC-0021, SEC-0049 |
| THR-0046 integration outage presented as healthy | SEC-0049, SEC-0034, SEC-0002 |
| THR-0047 terminology/profile drift | SEC-0025, SEC-0026, SEC-0038 |
| THR-0048 MPI merge/unmerge misassociation | SEC-0010, SEC-0001, SEC-0026, SEC-0032 |
| THR-0049 clock skew / time manipulation | SEC-0024, SEC-0032, SEC-0004 |
| THR-0050 malicious dependency | SEC-0036, SEC-0037, SEC-0039, SEC-0040 |
| THR-0051 artifact substitution | SEC-0038, SEC-0028, SEC-0039 |
| THR-0052 CI/CD compromise | SEC-0039, SEC-0014, SEC-0003, SEC-0032 |
| THR-0053 secret/key loss or exposure | SEC-0013, SEC-0014, SEC-0047, SEC-0012 |
| THR-0054 base image / toolchain compromise | SEC-0036, SEC-0037, SEC-0038, SEC-0039 |
| THR-0055 advisory / false-green gate | SEC-0040, SEC-0037, SEC-0039 |
| THR-0056 tampered verification artifacts | SEC-0031, SEC-0029, SEC-0028, SEC-0032 |
| THR-0057 backup corruption / untested restore | SEC-0047, SEC-0048, SEC-0013 |
| THR-0058 destructive attack / insider | SEC-0047, SEC-0003, SEC-0035, SEC-0013 |
| THR-0059 partial outage / unreconciled divergence | SEC-0048, SEC-0049, SEC-0034 |
| THR-0060 backup/export to unapproved environment | SEC-0020, SEC-0017, SEC-0012, SEC-0003 |
| THR-0061 indirect prompt injection | SEC-0042, SEC-0041, SEC-0043, SEC-0045 |
| THR-0062 exfiltration via tool channel | SEC-0042, SEC-0046, SEC-0045, SEC-0016 |
| THR-0063 MCP confused deputy | SEC-0006, SEC-0041, SEC-0001, SEC-0009 |
| THR-0064 unsafe tool chaining to a write | SEC-0044, SEC-0041, SEC-0045, SEC-0027 |
| THR-0065 ungrounded prose as clinical output | SEC-0043, SEC-0041, SEC-0032 |
| THR-0066 MCP as ingestion / system of record | SEC-0041, SEC-0023, SEC-0026 |
| THR-0067 cross-tenant inference via MCP | SEC-0009, SEC-0041, SEC-0016, SEC-0033 |

### 13.1 Controls that defend a P0 threat *alone* — a common-cause warning

**INFERENCE (from the table above):** several P0 threats currently rest on a single primary
control — notably THR-0021 on SEC-0004, THR-0037 on SEC-0032, and THR-0065 on SEC-0043.
`safety-requirements.md` §I applies a rule that an S4/S5 hazard may not rely on a single
barrier, and records that **barrier independence has not been analysed for common-cause
failure**. The same gap exists here and is worse, because several controls above share a
single point of failure: **if SEC-0040 (blocking gates) is not real, every verification
method in this catalog is unenforced simultaneously.** A common-cause analysis across SAF and
SEC barriers is owed before G6.

---

## 14. What this catalog does NOT establish

1. **No control is implemented.** Not one. There is no code, no configuration, no environment.
2. **No control is verified.** Every `Verification` field describes a method that has never
   been executed. **TST IDs are deliberately unminted** — assigning them is the test
   architect's act, and minting them here would imply tests exist.
3. **No control is accepted.** Acceptance requires `AUTH-SECURITY` (`BLK-0003`, UNASSIGNED)
   and, for privacy controls, `AUTH-PRIVACY-LEGAL` (`BLK-0004`, UNASSIGNED).
4. **No compliance mapping is made**, to any framework, deliberately (`PROMPT:766`).
5. **No residual risk is stated or accepted.** With zero controls implemented, residual risk
   equals inherent risk for every threat.
6. **This catalog is incomplete by construction.** Controls below the boundary level (input
   validation classes, framework hardening, platform configuration) cannot be specified before
   the stack ADRs exist. It must be revised after the architecture is ratified, and again
   before G7 and G8.
7. **SEC-0001 inherits `SAF-0009`'s blocked status.** The AMH tenant/MPI contradiction means
   the definition of "verified tenant context" at TB-05 is not yet knowable.

---

## 15. Extensão do ciclo 1 — controles para a superfície do contrato AMH×IntensiCare v1

> **Nota de idioma.** As seções 0–14 acima foram redigidas em inglês no ciclo 0 e
> **permanecem sem reescrita**. Esta seção 15 é redigida em **pt-BR** conforme `DEC-G0-10`,
> seguindo o precedente de `docs/08-interoperability/amh-data/open-questions-for-amh-owners.md`.
> Nenhum controle anterior foi alterado, renumerado ou removido.

**Escopo.** Nove controles candidatos — **SEC-0051..SEC-0059** — derivados exclusivamente das
ameaças **THR-0068..THR-0083** (`threat-model.md` §12), que modelam a superfície nova da minuta
do contrato v1. Onde um controle existente já basta, esta seção **o referencia** em vez de
duplicá-lo; onde um controle novo **estende** um existente, o texto diz exatamente o que ele
acrescenta e por quê.

**O cabeçalho do documento aplica-se sem exceção:** cada controle abaixo é
`Status = PROPOSAL` · `Implementation = NOT-IMPLEMENTED` · `Verification = NOT PERFORMED` ·
`Owner = UNASSIGNED — VALIDATION REQUIRED`. Escrever um controle não é implementá-lo. Nenhum
`TST` é cunhado. Nenhum risco é aceito nesta seção.

**Uma restrição que atravessa os nove (INFERÊNCIA, de `contract-manifest.draft.yaml`
`transport.escolhido: null` e do estado `PROPOSAL` da minuta):** vários destes controles **não
são implementáveis unilateralmente pela V2** — dependem de campos que o envelope proposto não
tem, ou de garantias que só a AMH pode declarar e medir. Onde isso ocorre, o controle traz o
campo **"Depende de negociação"**, e a coisa honesta a fazer é levá-lo à negociação **agora**,
enquanto uma emenda é compatível, e não depois, quando será mudança **major** com janela de
depreciação.

### 15.1 Controles novos

#### SEC-0051 — Autenticidade e integridade de origem verificáveis por evento de identidade
Todo evento de ciclo de vida de identidade DEVE trazer **prova verificável de origem e de
integridade**, ligando ao menos `event_id`, `event_type` + versão, as duas refs, `occurred_at`,
`amh_tenant`/`legal_entity` e a **versão/digest do contrato que o produziu**. A verificação DEVE
ocorrer **antes** de o evento alterar qualquer estado de identidade na V2. Falha de verificação
DEVE **falhar fechada** e enviar o evento à quarentena (`SEC-0026`) — nunca "aplicar mesmo
assim", nunca aplicar e alertar depois. O direito de publicar na lane DEVE ser escopado por
produtor; a V2 NÃO DEVE aceitar evento de identidade por nenhum caminho que não o canal
declarado no contrato.
- **Ameaças:** THR-0068, THR-0069, THR-0071, THR-0073, THR-0083
- **Tipo:** `PREV` + `DET`
- **Estende:** `SEC-0022` (proveniência autenticada em eventos internos e envelopes ingeridos).
  **O que acrescenta:** SEC-0022 governa o stream **interno** da V2, onde a V2 controla produtor
  e transporte. Aqui o produtor é **outra pessoa jurídica**, o transporte é `null`, e o objeto do
  evento não é um fato clínico — é **a chave de todos os fatos clínicos**. A consequência de
  aceitar um evento forjado não é um dado errado: é uma **identidade** errada.
- **Base:** OBSERVADO — `memoria-de-desenho.md` §5 exclui deliberadamente `payload_hash` e
  `contract_manifest_digest` do envelope mínimo; `contract-manifest.draft.yaml`
  `transport.escolhido: null`. SOURCE `PROMPT:476`, `PROMPT:724`
- **Verificação:** teste de rejeição de evento forjado; teste de rejeição de evento com prova
  de origem ausente; teste negativo provando que **não existe** caminho de ingestão alternativo
  para eventos de identidade; teste de que a falha de verificação não altera estado.
  **TST: UNASSIGNED**
- **Depende de negociação:** o envelope proposto **não tem** campo de assinatura nem de digest.
  Acrescentá-los é **emenda compatível** hoje (campo opcional novo). Sem eles, a autenticidade
  fica inteiramente a cargo do transporte — que ainda não foi escolhido (ADR de fronteira, N-3).
- **Status:** PROPOSAL · NOT-IMPLEMENTED

#### SEC-0052 — Continuidade da lane de identidade: detecção de lacuna e reconciliação replay ⇔ `resolve`
A V2 DEVE tratar **a ausência de eventos como um estado observável**, não como silêncio normal.
Exige-se: (a) um **sinal de continuidade** por sujeito e por lane — sequência, marca-d'água ou
heartbeat declarado pelo produtor — de modo que uma lacuna seja **detectável**, com alarme
operacional visível ao operador clínico; (b) **reconciliação periódica** afirmando a
equivalência da cláusula §3 (estado derivado dos eventos com `occurred_at <= t` ≡ resposta de
`resolve(ref, as_of=t)`) sobre amostra de refs, incluindo obrigatoriamente refs com transição
recente; (c) divergência ou lacuna DEVE produzir **degradação visível** (`SEC-0049`) e
suspensão da reatribuição automática — **nunca** continuar em silêncio; (d) o atraso da lane
DEVE ser medido como SLI contra a latência que a AMH declarar (hoje `VALIDATION_REQUIRED`).
- **Ameaças:** THR-0069, THR-0070, THR-0071, THR-0073, THR-0074, THR-0080 (detecção parcial),
  THR-0083
- **Tipo:** `DET` + `ASSUR`
- **Complementa:** `SEC-0034` (reconciliação de entrega: "gerado ≠ exibido") — mesmo princípio,
  aplicado à identidade: **"emitido ≠ aplicado"**. Complementa `SEC-0049` e `SEC-0021`.
- **Base:** OBSERVADO — o envelope mínimo não carrega sequência, marca-d'água nem heartbeat;
  `identity_lifecycle.latencia: VALIDATION_REQUIRED`. A equivalência replay ⇔ `resolve` é
  requisito vinculante da cláusula (OS-17 critério 5) e, portanto, é **testável como controle
  de runtime**, não apenas como teste de aceitação.
- **Verificação:** injeção de lacuna em ambiente de teste com asserção de que o alarme dispara
  dentro de um limite declarado; teste de reconciliação com divergência plantada; teste de que
  a reconciliação **falha** quando a lane está parada (um reconciliador que passa com lane
  morta é um gate que valida zero casos — `SEC-0040`). **TST: UNASSIGNED**
- **Depende de negociação:** o token de continuidade **não existe** no envelope proposto.
  **Ponto de negociação a propor** junto com SEC-0051.
- **Status:** PROPOSAL · NOT-IMPLEMENTED

#### SEC-0053 — Propagação verificável do tombstone de erasure, com prova de aplicação
Ao receber `identity.erasure.v1`, a V2 DEVE executar uma transição de estado **declarada e
testável** que alcance **todas** as cópias em que a ref aparece — armazenamento operacional,
projeções, caches (incluindo o cache de `resolve`), índices de busca, filas e quarentenas,
exports emitidos e telemetria ainda dentro da retenção — e DEVE registrar **prova de
aplicação** (o quê, onde, quando), auditável sem PHI. A V2 NÃO DEVE continuar a apresentar,
avaliar ou alertar sobre o sujeito como ativo após a aplicação. Um evento `erasure` cuja
aplicação não possa ser comprovada em toda a superfície DEVE gerar **incidente de privacidade**
(`SEC-0035`), não um aviso de log.
- **Ameaças:** THR-0072, THR-0075, THR-0077
- **Tipo:** `PREV` + `GOV` + `DET`
- **Complementa:** `SEC-0020` (deleção segura e export controlado) e o mapa de cópias de
  `privacy-data-map.md` §4.1 — SEC-0053 é o **gatilho por evento** que torna aquele alcance
  exercitável, em vez de declarado.
- **Base:** cláusula §1 tipo 6 e §4.1 (`retired`, ref nunca deletada nem reutilizada);
  `minuta-parecer-os-16.md` §1.3 (o PSR é pseudonimização; a informação adicional está do lado
  AMH).
- **Bloqueado em (e isto é o essencial):** **o que "aplicar" significa juridicamente para um
  registro clínico é determinação de `AUTH-PRIVACY-LEGAL` (`BLK-0004`, UNASSIGNED)** — eliminar,
  bloquear, ou reter sob obrigação clínica/regulatória e de auditoria. O PSR é a chave de todo
  fato clínico: apagá-lo destruiria o registro e a trilha de auditoria. **Nenhum agente decide
  isto, e este controle não o presume.** O controle especifica a *mecânica* (alcance, prova,
  auditoria); a *política* é ato humano nomeado.
- **Verificação:** teste de alcance da transição em cada cópia declarada no mapa de dados;
  asserção de que nenhuma superfície de leitura apresenta o sujeito como ativo após aplicação;
  teste de que a prova de aplicação é gerada e é imutável. **TST: UNASSIGNED**
- **Status:** PROPOSAL · NOT-IMPLEMENTED

#### SEC-0054 — `resolve(ref, as_of)` como dependência clínica governada: fail-closed, cache correto, sem oráculo
Quatro exigências, todas verificáveis:
1. **Integridade e semântica da resposta.** A resposta DEVE ser autenticada e íntegra, e DEVE
   ser rejeitada se não afirmar explicitamente o `as_of` a que corresponde. Uma resposta que
   degrade para "resolução atual" DEVE ser tratada como **erro**, jamais consumida. Ausência de
   resposta, resposta ambígua ou `as_of` fora da janela DEVEM produzir `not_evaluated`
   explícito (`DOM-0004`, `SAF-0002`) — nunca suposição, nunca última resolução conhecida.
2. **Cache.** A chave de cache DEVE incluir `(ref, as_of, amh_tenant, legal_entity, versão de
   contrato)`. Respostas para `as_of` **passado** são imutáveis e podem ser cacheadas;
   `as_of = agora` NÃO DEVE ser cacheado como se fosse imutável. **Não DEVE haver cache negativo
   persistente** de `nao-mintada-em-as_of`. Todo cache DEVE ser invalidado ao chegar evento de
   identidade que toque a ref.
3. **Anti-oráculo.** Limites de taxa e cotas por chamador **e por finalidade**; forma e tempo de
   resposta **uniformes** entre "desconhecida", "fora de escopo" e "não mintada em `as_of`" na
   medida em que a semântica clínica permitir; auditoria de toda chamada (quem, quando, qual
   ref, qual `as_of`) **sem PHI**; alerta sobre padrões de acesso com forma de enumeração
   (`SEC-0033`). O sinal `status: retired` DEVE ser tratado como **metadado sensível** e sua
   exposição restringida ao mínimo necessário à decisão clínica.
4. **Não reexposição.** A V2 NÃO DEVE expor `resolve` — direta ou transitivamente, por rota de
   BFF, ferramenta MCP, export ou relatório — como consulta de propósito geral. Toda chamada
   DEVE carregar tenant, entidade legal, propósito-de-uso (`tratamento`) e contexto profissional
   **do chamador**, não apenas a identidade de carga de trabalho da V2 (`SEC-0006`).
- **Ameaças:** THR-0073, THR-0074, THR-0075, THR-0076
- **Tipo:** `PREV` + `DET`
- **Complementa:** `SEC-0006` (identidade de carga de trabalho distinta da de usuário),
  `SEC-0050` (limites de taxa), `SEC-0033` (detecção de anomalia), `SEC-0019` (cache limpo),
  `SEC-0041` (ferramentas MCP tipadas e estreitas). **O que acrescenta:** trata `resolve` como o
  que ele é — uma **dependência de correção clínica** cuja resposta errada é indistinguível de
  uma resposta certa para quem a consome.
- **Base:** cláusula §4.1 (fail-closed declarado; `as_of` pré-minting; `retired`) e §4.2
  (determinismo, autorização, auditoria); `slos.resolve_latency_e_limites: VALIDATION_REQUIRED`.
- **Verificação:** teste de rejeição de resposta sem `as_of` afirmado; teste de degradação
  (resposta "atual" apresentada a uma consulta com `as_of` passado DEVE falhar); testes de chave
  de cache incluindo colisão cross-escopo e invalidação por evento; campanha de enumeração
  adversarial medindo o que um chamador autenticado consegue inferir; teste de que nenhuma
  ferramenta MCP ou rota de BFF alcança `resolve` sem contexto de chamador. **TST: UNASSIGNED**
- **Depende de:** ADR 14 (MCP), ADR 15/16 (identidade e autorização), ADR de fronteira
  (transporte); e dos limites de uso que a AMH ainda não declarou.
- **Status:** PROPOSAL · NOT-IMPLEMENTED

#### SEC-0055 — O PSR é dado pessoal sensível em todo artefato, e é tratado como identificador
1. **Rotulagem.** Nenhum artefato da V2 — documento, esquema, painel, export, comentário de
   código ou mensagem de agente — PODE descrever dado chaveado por PSR como "anonimizado",
   "desidentificado" ou "não pessoal". Dado chaveado por PSR é **dado pessoal sensível**
   (`minuta-parecer-os-16.md` §1.3, PROPOSTA **P-PSR-1**).
2. **Sinks.** O PSR NÃO DEVE aparecer em logs de aplicação, traces, rótulos/cardinalidade de
   métrica, corpos de erro, tickets, capturas de tela, prompts de modelo, argumentos ou
   resultados de ferramenta MCP, ou mensagens entre agentes. Onde uma correlação técnica for
   necessária, DEVE ser usado um identificador **derivado por request e não reversível pelo
   destinatário do log**, nunca o PSR.
3. **Redação por padrão, não por lista de campos.** A redação DEVE reconhecer o **formato** do
   PSR (`amh:psr:v1:…`), porque um filtro baseado em lista de campos clínicos não filtra a
   **chave** — e é precisamente a chave que abre todo o registro.
4. **Exports.** Todo export chaveado por PSR é export de dado pessoal e segue `SEC-0016` e
   `SEC-0020`, com finalidade declarada. Não existe export "seguro por ser pseudonimizado".
- **Ameaças:** THR-0077, THR-0078, THR-0079, THR-0075
- **Tipo:** `PREV` + `GOV`
- **Complementa:** `SEC-0015` (redação de PHI em telemetria), `SEC-0016` (minimização),
  `SEC-0017` (dado sintético fora de produção), `SEC-0046` (nada de PHI a provedor de modelo).
  **O que acrescenta:** os controles existentes foram escritos contra PHI **reconhecível**. O
  PSR é opaco, e opacidade é exatamente o que faz um revisor humano concluir que ele "pode ir
  para o log".
- **Base:** SOURCE — `minuta-parecer-os-16.md` §1.3 (art. 5º III e XI; art. 12; art. 13 §4º
  aplicável apenas "para os efeitos deste artigo"; a pseudonimização é medida de segurança e
  minimização — arts. 6º VII e VIII, 46 — **não é base legal e não é isenção**). OBSERVADO —
  `scripts/check_forbidden_content.py` reconhece credenciais, CPF **formatado**, e-mail e
  canários; **não há padrão para `amh:psr:v1:`**.
- **PROPOSAL ao dono do gate de conteúdo proibido (não executada aqui):** acrescentar padrão de
  detecção para `amh:psr:v1:` fora dos caminhos do pacote de contrato. **Este catálogo não
  altera scripts** — a mudança é ato do dono daquele gate.
- **Verificação:** testes de redação com strings em formato de PSR em cada sink; asserção de
  cardinalidade de métrica proibindo rótulo por sujeito; varredura periódica de logs e artefatos
  de CI por formato de PSR; revisão documental afirmando que nenhum artefato descreve dado
  chaveado por PSR como não pessoal. **TST: UNASSIGNED**
- **Bloqueado em:** a qualificação jurídica final é `AUTH-PRIVACY-LEGAL` (`BLK-0004`). O
  controle adota a posição **mais protetiva** enquanto o parecer não existir — o que é a única
  postura defensável, não uma antecipação da decisão.
- **Status:** PROPOSAL · NOT-IMPLEMENTED

#### SEC-0056 — Separação técnica, não convencional, entre refs sintéticas e refs de produção
Caminhos de produção DEVEM **rejeitar, fail-closed**, qualquer ref que não seja um
`amh:psr:v1:<uuidv4>` bem formado — em particular DEVEM rejeitar o marcador sintético — e
caminhos não-produtivos DEVEM rejeitar refs mintadas em produção. A separação DEVE ser
imposta por **validação de formato + fronteira de ambiente**, ambas falhando fechadas, e **NÃO
DEVE depender do marcador de nome**: `SYNTH` é convenção legível, não separação técnica.
Nenhum componente da V2 PODE mintar um PSR (ADR-0004 D-06); uma ref que apareça sem ter sido
recebida da AMH DEVE ser tratada como defeito de integridade, não como sujeito novo.
- **Ameaças:** THR-0079, THR-0081, THR-0078
- **Tipo:** `PREV`
- **Complementa:** `SEC-0017` (dado sintético fora de produção) — **o que acrescenta** é o
  sentido **inverso**, que SEC-0017 não cobre: dado **sintético entrando em produção**. Numa
  camada de identidade, esse sentido é o mais perigoso dos dois, porque cria um sujeito clínico
  que a fonte jamais reconhecerá.
- **Base:** `subject.formato: "amh:psr:v1:<uuidv4>"` e `ambiente_de_desenvolvimento` (marcador
  `SYNTH`) no manifesto draft; `DEC-G0-03` (apenas dado sintético até ratificação jurídica);
  ADR-0004 D-06.
- **Verificação:** teste negativo por ambiente, nos dois sentidos; teste de validação de formato
  com UUID malformado, marcador sintético e ref de comprimento/forma inesperados; asserção de
  que nenhum caminho de código constrói um PSR. **TST: UNASSIGNED**
- **Status:** PROPOSAL · NOT-IMPLEMENTED

#### SEC-0057 — Telemetria de anomalia de identidade como detecção compensatória (R-a5)
**Controle explicitamente compensatório e explicitamente insuficiente.** A V2 DEVERIA medir e
alertar sobre anomalias com forma de identidade, observáveis **sem** manter nenhuma estrutura de
correspondência cross-PJ e **sem** identificadores de fonte:
- mudança brusca do perfil demográfico/clínico transportado no encontro para uma mesma ref
  (faixa etária, sexo, tipo sanguíneo quando presente, degrau de peso/altura fisiologicamente
  implausível);
- `merge`/`alias` que unifica refs cujas histórias de encontro **se sobrepõem no tempo** em
  unidades ou estabelecimentos distintos;
- taxa de eventos de identidade por tenant, por tipo e por janela fora de limites declarados —
  incluindo o caso "nenhum evento", que é o sinal de THR-0070;
- descontinuidade fisiologicamente implausível na série de fatos de uma ref após uma transição
  de identidade;
- `resolve` que muda de resposta para o **mesmo** `(ref, as_of)` entre duas chamadas — violação
  direta do determinismo exigido pela cláusula §4.2.

A resposta ao alarme DEVE ser **revisão clínica humana + suspensão da reatribuição automática**.
A V2 NÃO DEVE desfazer merge, resolver duplicata nem inferir identidade — isso é capacidade AMH
e permanece proibida à V2 (`IDP-04`, `IDP-09`; ADR-0004 §5.2.1).

- **Ameaças:** THR-0080 (detecção **parcial**), THR-0068, THR-0071, THR-0073
- **Tipo:** `DET` — **e somente `DET`**
- **Estende:** `SEC-0033` (monitoração e detecção de anomalia em padrões de acesso). **O que
  acrescenta:** SEC-0033 observa **acesso**; SEC-0057 observa **identidade**, e existe porque a
  ameaça que ele endereça não tem barreira preventiva do lado da V2.
- **Base:** SOURCE — `minuta-parecer-os-16.md` §3.6 **R-a5** (contaminação silenciosa da V2) e
  **R-a3** (falso-positivo cross-PJ = dano de privacidade **e** perigo clínico simultâneos);
  `threat-model.md` §12.3.4.
- **Limites declarados — leia-os antes de citar este controle:**
  1. **Não previne nada.** Detecta *depois* que a atribuição errada entrou.
  2. **Não detecta o caso difícil.** Um falso-positivo entre dois pacientes de perfil
     demográfico e clínico semelhante — que é o caso em que o par errado é *mais* provável —
     passa invisível.
  3. **Taxa de falso-positivo desconhecida e não medida.** Em UTI, alarme com FP alto produz
     fadiga de alarme, que é ela própria um perigo registrado (`HAZ-0016`). Calibrar exige dados
     que não existem.
  4. **Não transfere a propriedade do controle preventivo para dentro da V2.** O controle
     preventivo pertence à governança do índice do ADR-043 e ao parecer jurídico da OS-16.
  5. **Restrição de desenho vinculante:** este controle **NÃO PODE** persistir, derivar ou
     inferir correspondência entre sujeitos de PJs distintas — isso violaria `SEC-0010` e
     recriaria, dentro da V2, exatamente a estrutura que AQ-4 mantém fora. Que a implementação
     respeita esta restrição é `VALIDATION REQUIRED` por revisor independente.
- **Verificação:** detecção com anomalias plantadas em dados sintéticos; medição da taxa de
  falso-positivo antes de qualquer ativação de alarme clínico; asserção arquitetural de que
  nenhuma estrutura cross-PJ é criada ou persistida; teste de que o alarme **não** dispara
  reatribuição automática. **TST: UNASSIGNED**
- **Depende de:** ADR-0004 D-02 (o índice cross-PJ segue *gated* no parecer DPO/jurídico) e da
  nomeação humana do dono de THR-0080.
- **Status:** PROPOSAL · NOT-IMPLEMENTED

#### SEC-0058 — Conformidade de contrato verificada por fixtures: bloqueante, anti-permissiva e independente
O validador consumidor da V2 DEVE aceitar **todas** as fixtures `valid` e **rejeitar cada**
fixture `invalid` **pelo motivo declarado** — não apenas rejeitá-la. A suíte DEVE **falhar** se:
qualquer fixture inválida for aceita; qualquer invariante do envelope não tiver ao menos uma
fixture negativa; o conjunto de fixtures divergir do digest do esquema publicado; ou a suíte
executar **zero** casos. O comportamento de *tolerant reader* DEVE ser implementado nas **duas
metades**, com teste para cada uma: campos **adicionais** desconhecidos ignorados **e** campos
**obrigatórios** ausentes rejeitados. Tipo `identity.*` desconhecido DEVE ser tratado como
**erro fail-closed**, nunca como campo adicional tolerável — enquanto a divergência 5 × 6 tipos
(ponto N-8) não estiver fechada, tolerar um tipo desconhecido é ignorar silenciosamente uma
reatribuição de fatos. A suíte DEVE ser bloqueante (`SEC-0040`) e, onde a independência for
alcançável, as fixtures não DEVEM ser mantidas pela mesma parte que mantém o parser
(princípio de `SEC-0031`).
- **Ameaças:** THR-0081, THR-0082, THR-0069, THR-0072
- **Tipo:** `ASSUR` + `DET` + `PREV`
- **Complementa:** `SEC-0026` (validar e pôr em quarentena; nunca coagir), `SEC-0040` (todo gate
  bloqueia; gate que valida zero casos FALHA), `SEC-0031` (raiz de confiança independente para
  artefatos de verificação).
- **Base:** OBSERVADO — dez fixtures (6 válidas + 4 inválidas) com `sha256: null`; invariante 6
  (tolerant reader) tem duas metades e só uma delas é o caminho natural de um desserializador;
  divergência N-8 registrada em `memoria-de-desenho.md` §8.
- **Verificação:** meta-teste que **muta o validador** para aceitar cada fixture inválida e
  exige que a suíte fique vermelha (teste de mutação — `PROMPT:793` já o exige para políticas de
  autorização; o mesmo raciocínio se aplica aqui); asserção de contagem de casos > 0; verificação
  de digest do conjunto de fixtures contra o esquema publicado. **TST: UNASSIGNED**
- **Status:** PROPOSAL · NOT-IMPLEMENTED

#### SEC-0059 — Pin por digest do contrato, verificado a cada consumo, com falha fechada
A V2 DEVE pinar o manifesto publicado **por digest criptográfico** em `contracts.lock`, DEVE
verificar o digest do manifesto e do esquema efetivamente em uso **na inicialização e a cada
mudança**, e DEVE **falhar fechada** em divergência — nunca prosseguir com aviso. A versão e o
digest do contrato DEVEM ser registrados na proveniência de **cada** registro de avaliação
(`DOM-0002`), para que duas avaliações separadas por um drift sejam **comparáveis com o motivo
explícito**. A ausência de referência de contrato **por mensagem** (excluída do envelope mínimo
por desenho) é **limitação declarada — não aceita**: enquanto persistir, uma mensagem já
consumida não é atribuível a uma versão de contrato, e a única compensação disponível é a
verificação no arranque, que **não cobre** uma mudança ocorrida entre dois arranques.
- **Ameaças:** THR-0083, THR-0082, THR-0068
- **Tipo:** `PREV` + `DET`
- **Estende:** `SEC-0025` (pinagem de terminologia e perfis com verificação de digest). **O que
  acrescenta:** SEC-0025 pina o **vocabulário clínico**; SEC-0059 pina o **contrato de identidade
  e de tempo**, cuja mudança silenciosa não altera um valor — altera **o significado de uma ref
  e de um instante**. Complementa `SEC-0038` (assinatura de artefato e deploy por digest).
- **Base:** OBSERVADO — `manifest_sha256: null`, `ig_dependency.package_digest: null`,
  `pinned: false`, `aceito: false`; `compatibility_policy` manda o consumidor **rejeitar** pacote
  divergente do manifesto — o que exige exatamente este controle para ser executável.
- **Verificação:** teste negativo com manifesto adulterado provando falha de arranque; asserção
  de que nenhuma avaliação persiste sem versão+digest de contrato na proveniência; verificação
  periódica do digest publicado contra o pin. **TST: UNASSIGNED**
- **Depende de negociação:** referência de contrato por mensagem é **emenda compatível** (campo
  opcional novo) e deve ser levada à negociação enquanto ainda o é.
- **Status:** PROPOSAL · NOT-IMPLEMENTED

### 15.2 Cobertura ameaça → controle da extensão

Complementa o §13 sem alterá-lo. Cada ameaça nova tem ao menos um controle candidato; cada
controle novo traça para ao menos uma ameaça nova.

| THR | Controles candidatos |
|---|---|
| THR-0068 evento de identidade forjado | SEC-0051, SEC-0022, SEC-0002, SEC-0032, SEC-0059 |
| THR-0069 replay/duplicata sob chave do produtor | SEC-0021, SEC-0051, SEC-0052, SEC-0058 |
| THR-0070 evento perdido — merge não aplicado | SEC-0052, SEC-0049, SEC-0026, SEC-0023 |
| THR-0071 fora de ordem através de cadeia de refs | SEC-0052, SEC-0021, SEC-0024, SEC-0051 |
| THR-0072 tombstone de erasure não aplicado | SEC-0053, SEC-0020, SEC-0032, SEC-0052 |
| THR-0073 `resolve` adulterado / "atual como então" | SEC-0054, SEC-0011, SEC-0051, SEC-0024 |
| THR-0074 cache de `resolve` envenenado/mal chaveado | SEC-0054, SEC-0009, SEC-0019, SEC-0052 |
| THR-0075 `resolve` como oráculo de enumeração | SEC-0054, SEC-0033, SEC-0050, SEC-0016, SEC-0032 |
| THR-0076 deputado confuso sobre `resolve` | SEC-0006, SEC-0054, SEC-0001, SEC-0003, SEC-0041 |
| THR-0077 re-identificação por correlação sobre PSR | SEC-0055, SEC-0016, SEC-0020, SEC-0010, SEC-0033 |
| THR-0078 PSR em logs/traces/fixtures/prompts | SEC-0055, SEC-0015, SEC-0016, SEC-0046, SEC-0017 |
| THR-0079 fronteira sintético ↔ produção do PSR | SEC-0056, SEC-0017, SEC-0026, SEC-0055 |
| THR-0080 contaminação cross-PJ a montante (R-a5) | **nenhum preventivo na V2**; SEC-0057 (compensatório, `DET`), SEC-0026, SEC-0032, SEC-0049, SEC-0035 |
| THR-0081 fixture inválida aceita por parser permissivo | SEC-0058, SEC-0026, SEC-0040, SEC-0016 |
| THR-0082 dessincronia fixture × esquema como "conformidade" | SEC-0058, SEC-0059, SEC-0031, SEC-0040 |
| THR-0083 drift de contrato sem verificação de digest | SEC-0059, SEC-0025, SEC-0038, SEC-0051, SEC-0052 |

### 15.3 Aviso de causa comum, específico desta extensão

**INFERÊNCIA (da tabela §15.2, aplicando o mesmo raciocínio do §13.1).** Três concentrações
merecem registro:

1. **THR-0080 não tem barreira preventiva alguma do lado da V2.** É a única linha deste catálogo
   cuja coluna de controle começa com "nenhum". `safety-requirements.md` §I proíbe que um perigo
   S4/S5 dependa de barreira única — aqui não há sequer uma barreira preventiva. A resposta
   correta não é escrever mais controles: é **nomear o dono humano** e tratar a operação com o
   índice ligado como decisão gateada.
2. **SEC-0051 e SEC-0052 dependem de campos que o envelope proposto não tem.** Enquanto a
   negociação não os acrescentar, cinco ameaças (THR-0068, THR-0069, THR-0070, THR-0071,
   THR-0083) repousam sobre controles **que a V2 não pode implementar sozinha**. Isso é um
   estado de dependência externa, não um plano de mitigação.
3. **SEC-0058 é a raiz comum de toda a evidência de fronteira.** Se a suíte de fixtures não for
   bloqueante e anti-permissiva, THR-0081 e THR-0082 se realizam **juntos** e desligam, de uma
   vez, a verificação de todos os demais controles desta seção — o mesmo padrão que o §13.1 já
   registrou para `SEC-0040`.

Uma análise de independência de barreiras que cubra `SAF`, `SEC` **e** estas dependências
externas é devida antes do G6 — agora com um item novo: **barreiras cujo dono está fora da
organização que responde pelo produto.**

### 15.4 O que esta extensão NÃO estabelece

Aplicam-se, sem exceção, os sete itens do §14. Acrescentam-se três, específicos desta seção:

8. **Nenhum dos nove controles é implementável hoje**, e três deles (SEC-0051, SEC-0052,
   SEC-0059 na parte de referência por mensagem) **não são implementáveis pela V2 em nenhum
   momento sem emenda ao contrato**. Registrar a dependência não a resolve.
9. **SEC-0057 não fecha THR-0080, e nada nesta seção deve ser citado como se fechasse.** Ele é
   detecção parcial de uma ameaça cujo controle preventivo pertence a outra organização.
10. **Nenhuma posição jurídica é tomada.** SEC-0053 e SEC-0055 adotam a postura mais protetiva
    enquanto `AUTH-PRIVACY-LEGAL` (`BLK-0004`) não existir; isso é prudência de engenharia, não
    determinação legal, e não antecipa o parecer da OS-16.
