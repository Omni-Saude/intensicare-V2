---
id: PRIVACY-DATA-MAP-V2
title: IntensiCare V2 Privacy and Data Map (skeleton)
label: PROPOSAL
statement: >
  Skeleton privacy/data map for IntensiCare V2. It structures the questions a privacy and
  legal authority must answer; it does not answer them. No data category is confirmed, no
  purpose is approved, no retention period is set, no legal basis is determined, no
  processor is selected, and no data flow is approved. Every legal determination is
  VALIDATION REQUIRED with owner AUTH-PRIVACY-LEGAL, which is UNASSIGNED (BLK-0004).
  This document makes no compliance claim of any kind.
provenance:
  source_repo: intensicare-V2
  path_or_url: docs/11-security-privacy-compliance/privacy-data-map.md
  commit_sha_or_version: uncommitted (working tree at cb35521)
  section_or_lines: whole document
  date_collected: 2026-08-14
  collector: healthcare threat-model specialist (Wave 2 specialist agent)
  transformation: >
    Structure derived from INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §13 (§768 minimization,
    purpose limitation, retention/legal hold, subject-right/correction, secure deletion;
    §766 the prohibition on stating compliance) and §9.3 conceptual data model. Anticipated
    data categories inferred from the conceptual model and the consumed-source evidence in
    docs/08-interoperability/amh-data/. No personal data of any kind has been collected,
    processed, or observed by this agent or by IntensiCare V2, which does not exist.
  confidence: low
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  requirements: [SEC-0016, SEC-0017, SEC-0020, SEC-0046, SAF-0026]
  hazards: [HAZ-0028, HAZ-0013, HAZ-0003, HAZ-0029]
  adrs: []
  tests: []
  pr: null
supersedes: null
superseded_by: null
---

# IntensiCare V2 — Privacy and Data Map (skeleton)

> ## Read this before anything else
>
> **This document determines no legal question.** Whether the Lei Geral de Proteção de
> Dados (LGPD) applies to IntensiCare V2, which legal hypothesis (`hipótese legal`) would
> authorise any given processing, whether health data here constitutes `dado pessoal
> sensível`, whether ANVISA/SaMD obligations attach, what records/localization/professional-
> practice/institutional obligations exist, and what contractual duties flow from any
> hospital agreement — **all of these are determinations reserved to Brazilian legal and
> regulatory specialists and to `AUTH-PRIVACY-LEGAL`.**
>
> SOURCE (`PROMPT:766`): *"Do not state compliance. Have Brazilian legal/regulatory
> specialists determine applicable LGPD, ANVISA/SaMD, records, localization,
> professional-practice, contractual, and institutional obligations; use IEC 62304,
> ISO 14971, IEC 62366-1, ISO 27001/SOC 2, HIPAA, or other frameworks only when
> applicability is established."*
>
> `AUTH-PRIVACY-LEGAL` is **UNASSIGNED — VALIDATION REQUIRED**
> (`docs/00-governance/authority-model.md` §1; blocker `BLK-0004`). **There is currently no
> one who can answer any question in this document.** That is the finding, not a formatting
> placeholder.
>
> **Forbidden phrasings.** No artifact in this repository may state or imply that
> IntensiCare V2 is "LGPD-compliant", "HIPAA-compliant", "ISO 27001 certified", "privacy by
> design certified", or "compliant" with anything. Not now, and not after this skeleton is
> filled in — compliance is asserted by an accountable organization on evidence, never by a
> document and never by an agent.

## 0. Status of everything below

**OBSERVED:** IntensiCare V2 has no code, no environment, no database, no user, and no
data. **No personal data has been processed.** Every row below describes data the
*candidate architecture* would handle if built (`PROMPT:580-598`, `PROMPT:600-614`). Each
is therefore `ANTICIPATED`, not `OBSERVED`.

| Field | Value for every row in this document, unless stated otherwise |
|---|---|
| Status | `ANTICIPATED — PROPOSAL` |
| Legal determination | `VALIDATION REQUIRED` |
| Determination owner | `AUTH-PRIVACY-LEGAL` — **UNASSIGNED** (`BLK-0004`) |
| Retention period | `PLACEHOLDER — NOT SET` |
| Legal basis / hypothesis | `NOT DETERMINED` |
| Processor | `NONE SELECTED` (§6) |
| Data flow approval | `NONE` (§8) |

---

## 1. Data categories anticipated

Derived from the conceptual data model (`PROMPT:584-596`) and the six categories named in
this task's scope. `Sensitivity` is this agent's engineering triage for control selection —
**it is not a legal classification** and carries no legal consequence.

| Category | What it would contain (anticipated) | Where it would live | Sensitivity (engineering triage) | Legal classification |
|---|---|---|---|---|
| **1. Identity and organization** | Organization/facility/care-unit/bed records; user, practitioner, role, membership, purpose assignments; professional registration identifiers where required for clinical accountability | Operational store; identity provider (**UNDECIDED**, TB-06) | High — the join key that makes every other category attributable | `VALIDATION REQUIRED` |
| **2. Patient identity and encounter** | Internal opaque subject key minted by V2 (`IDP-02`); source identifiers as received; encounter/episode; location and bed assignment; admission/transfer/discharge; alias/merge/unmerge/deceased events | Operational store; integration ingress; audit | **Highest** — directly identifying, and the axis on which every cross-tenant threat operates (THR-0003, THR-0020, THR-0048) | `VALIDATION REQUIRED` — including whether the internal opaque key is itself personal data |
| **3. Clinical observations and source envelopes** | Vital signs, laboratory results, codes, units, values, reference ranges, provenance, source data-quality state, immutable raw source envelopes, quarantine records, corrections | Operational store; object storage; quarantine store; broker/stream | **Highest** — health data about identified individuals | `VALIDATION REQUIRED` — including whether this is `dado pessoal sensível` and what that requires |
| **4. Evaluations, alerts, actions** | Evaluation records (inputs used, missing inputs, status, no-fire reasons, rule bundle identity); alerts/work items; assignments, acknowledgments, escalations, overrides, resolutions with actor identity and rationale | Operational store; projections; real-time gateway; notification channels | **Highest** — health data *plus* an inference about the person *plus* attributed professional conduct | `VALIDATION REQUIRED` — automated-decision and professional-record questions both attach here |
| **5. Audit and access records** | Append-only records of every read, change, decision, action, override, suppression, configuration change, rule activation; actor, purpose, tenant, resource, time, correlation | Audit store (tamper-evident, SEC-0032) | **Highest** — a complete behavioural record of both patients and staff; it is the surveillance surface as well as the accountability surface | `VALIDATION REQUIRED` — retention here is usually the *longest* and most legally constrained, and staff monitoring raises separate questions |
| **6. Credentials, keys, secrets** | Tokens, session material, signing keys, data-encryption keys, integration client credentials, break-glass credentials | Secret store; key management (**UNDECIDED**) | **Highest** — compromise converts to categories 1–5 at scale (THR-0027, THR-0053) | Not personal data as such; governed by security obligations that are themselves `VALIDATION REQUIRED` |
| **7. Telemetry and operational data** *(added — `PROMPT:757` requires it be treated as in scope)* | Logs, traces, metrics, error records, queue and cache contents, support tickets, screenshots, synthetic probe results | Observability stack; ticketing (both **UNDECIDED**) | High — **this category is only supposed to contain non-PHI, which is exactly why it is the most common leak path** (THR-0028..THR-0033) | `VALIDATION REQUIRED` — the classification depends entirely on whether redaction actually works, which is unverified |
| **8. Development and test data** *(added — rule 12)* | Fixtures, seeds, snapshots, reference vectors, E2E journey data | Source control; CI artifacts | **Must be synthetic-only.** `PROMPT:124` rule 12 forbids PHI here outright | `VALIDATION REQUIRED` — and note that formal de-identification is itself a legal determination, not an engineering one |

### 1.1 Two categories this map deliberately does not yet contain

- **Consent records.** V2 has no consent data and, on current evidence, **cannot obtain a
  consent decision it can rely on.** SOURCE (`IDP-07`, citing AMH ADR-045, `Accepted`
  2026-08-06): there is *"**Não existe escritor.** Nenhum `INSERT INTO mpi.consent_log` no
  repositório inteiro … **zero produtores**"*, and the only permission field reaching the
  lake is a **contact** permission which `IDP-07` states plainly *"usá-lo como consentimento
  LGPD seria fabricar base legal."* **V2 must not fabricate a legal basis.** Where a use
  would require consent, that use is **blocked and recorded**, not worked around.
- **Analytics/outcomes data.** `PROMPT:576` foresees a purpose-approved, minimized outcomes
  dataset. No purpose is approved and no minimization policy exists, so no such category is
  declared. Declaring it would imply it is planned and permitted.

---

## 2. Purposes (anticipated, none approved)

Purpose limitation requires purposes to be **stated in advance, specific, and enforced**
(`PROMPT:768`). The list below is the *candidate* purpose vocabulary. **None is approved**,
and the vocabulary itself is contested upstream: `IDP-07` records that AMH's own `scope`
vocabulary is *"partido em dois"* between a DDL enumeration
(`analytics | research | sharing_amh_internal | external_sharing`) and an agent-gate
enumeration (`treatment | research | billing | ml_training | operational_analytics`). V2
cannot adopt either until that is resolved.

| Purpose (candidate) | What it would authorise | Categories touched | Approval | Legal basis |
|---|---|---|---|---|
| `direct_care` | Evaluating a patient under an approved pathway and surfacing the result to the clinician responsible for that patient | 2, 3, 4 | **NOT APPROVED** | `NOT DETERMINED` |
| `care_coordination` | Routing, assignment, escalation, handover of alerts and work items within the responsible care team | 1, 2, 4 | **NOT APPROVED** | `NOT DETERMINED` |
| `clinical_safety_investigation` | Reconstructing what a clinician saw and what the system did, after an incident | 2, 3, 4, 5 | **NOT APPROVED** | `NOT DETERMINED` |
| `security_and_audit` | Detecting unauthorised access, cross-tenant anomalies, and misuse | 1, 5, 6 | **NOT APPROVED** | `NOT DETERMINED` |
| `operational_reliability` | Keeping the safety loop running: monitoring, degraded-mode detection, delivery reconciliation | 7 (and 4 in metadata form only) | **NOT APPROVED** | `NOT DETERMINED` |
| `rule_performance_feedback` | Measuring whether a clinical pathway performs as intended | 3, 4 (minimized) | **NOT APPROVED** | `NOT DETERMINED` |
| `product_development` | Building and testing V2 itself | **8 only** — synthetic data only, never 2/3/4 (`PROMPT:124` rule 12) | **NOT APPROVED** | `NOT DETERMINED` |

**Purposes explicitly out of scope unless separately and specifically approved:** secondary
research; model training of any kind; commercial analytics; benchmarking across
organizations; any cross-PJ correlation (prohibited outright by `IDP-09` — see §5.4); any
disclosure to a model provider (§5.5).

**Enforcement note (PROPOSAL, links SEC-0001):** a purpose that is not carried as a
verified, server-derived attribute on every request and every audit record is not a purpose
limitation — it is a sentence in a document. `IDP-07` requires an explicit `purpose_of_use`
on every AMH request and every internal use of AMH-derived data.

---

## 3. Minimization stance (PROPOSAL)

SOURCE (`PROMPT:562`, architecture principle 12): *"Minimize PHI collection, movement,
display, retention, and disclosure."* SOURCE (`PROMPT:124`, non-negotiable rule 12): *"Use
synthetic or formally de-identified data in development and tests. Do not place PHI,
credentials, access tokens, patient identifiers, or raw clinical payloads in prompts,
source control, logs, traces, fixtures, screenshots, tickets, or agent messages."*

The stance below is a PROPOSAL. It is **not implemented**; it is the position this map
recommends be ratified and then enforced technically.

| # | Stance | Enforced by (candidate) | Status |
|---|---|---|---|
| **M-1** | **Field-level minimization at every contract boundary.** V2 requests and stores the smallest field set a named purpose requires. Contracts declare fields explicitly; "give me the resource" is not a minimization posture. `PROMPT:476` warns specifically against blindly copying a 28-field envelope "if a smaller rigorously governed contract suffices" | SEC-0016 | PROPOSAL |
| **M-2** | **Synthetic-only in development and test.** No production data, no "anonymised" production extract, in any non-production environment — including for debugging, including "just once". Formal de-identification, if ever proposed, is a legal determination (`AUTH-PRIVACY-LEGAL`), never an engineering one | SEC-0017, SEC-0040 | PROPOSAL — partially supported today by the repository's `forbidden-content` CI gate, which is pattern-based and therefore **incomplete by construction** |
| **M-3** | **PHI never in prompts, agent messages, or model-provider requests.** Applies to the product's own AI surfaces *and* to the agent workflows building this repository | SEC-0046, SEC-0042 | PROPOSAL |
| **M-4** | **PHI never in logs, traces, metrics, error bodies, or health responses.** Redaction enforced by the platform, not by developer discipline — a rule that depends on every developer remembering it has already failed | SEC-0015 | PROPOSAL |
| **M-5** | **Notification payload minimization.** External channels carry a pointer and a severity, never clinical content or identifiers (THR-0032) | SEC-0018 | PROPOSAL |
| **M-6** | **Display minimization.** The UI shows what the clinical task requires; bulk listing, export, and "show all" affordances are privileges, not defaults | SEC-0003, SEC-0016 | PROPOSAL |
| **M-7** | **No cross-PJ correspondence structure in V2, ever** (§5.4) | SEC-0010 | PROPOSAL |
| **M-8** | **Movement minimization.** Every copy — cache, projection, queue, dead-letter, quarantine, backup, export, search index, embedding — is a new disclosure surface and must be justified, inventoried, and governed with the same controls as its source | SEC-0012, SEC-0020, SEC-0031 | PROPOSAL |

**A minimization stance is not a legal basis.** Minimizing data does not authorise
processing it. The two questions are independent, and only the second is `AUTH-PRIVACY-LEGAL`'s.

---

## 4. Retention, legal hold, and deletion — placeholders

**Nothing here is set.** Retention periods are legal and clinical determinations
constrained by medical-record obligations, professional-practice rules, contractual terms
with each institution, and any applicable data-protection law — none of which has been
determined for V2.

| Category | Retention | Legal hold | Secure deletion | Determination owner |
|---|---|---|---|---|
| 1 Identity/organization | `PLACEHOLDER — NOT SET` | `PLACEHOLDER` | `PLACEHOLDER` | `AUTH-PRIVACY-LEGAL` + `AUTH-PRODUCT` |
| 2 Patient identity/encounter | `PLACEHOLDER — NOT SET` | `PLACEHOLDER` | `PLACEHOLDER` | `AUTH-PRIVACY-LEGAL` + `AUTH-CLINSAFETY` |
| 3 Observations/source envelopes | `PLACEHOLDER — NOT SET` | `PLACEHOLDER` | `PLACEHOLDER` | `AUTH-PRIVACY-LEGAL` + `AUTH-DATA-PLATFORM` |
| 4 Evaluations/alerts/actions | `PLACEHOLDER — NOT SET` | `PLACEHOLDER` | `PLACEHOLDER` | `AUTH-PRIVACY-LEGAL` + `AUTH-CLINSAFETY` |
| 5 Audit/access records | `PLACEHOLDER — NOT SET` | `PLACEHOLDER` | `PLACEHOLDER` | `AUTH-PRIVACY-LEGAL` + `AUTH-SECURITY` |
| 6 Credentials/keys | `PLACEHOLDER — NOT SET` (rotation ≠ retention) | N/A | `PLACEHOLDER` | `AUTH-SECURITY` |
| 7 Telemetry | `PLACEHOLDER — NOT SET` | `PLACEHOLDER` | `PLACEHOLDER` | `AUTH-SECURITY` + `AUTH-OPERATIONS` |
| 8 Dev/test | `PLACEHOLDER` — synthetic only, so retention is an engineering, not legal, question | N/A | `PLACEHOLDER` | `AUTH-PRODUCT` |

### 4.1 Four tensions a retention policy must resolve, recorded now

These are engineering observations for the future policy author, not legal conclusions:

1. **Audit immutability vs. deletion.** SEC-0032 requires append-only, tamper-evident
   audit; a deletion obligation may require removing content from it. The usual resolutions
   (crypto-shredding, tombstoning, separating identifiers from audit bodies) are **design
   decisions with legal consequences** and must be decided jointly, before the audit schema
   is fixed — retrofitting deletion into a hash-chained store is extremely expensive.
2. **Safety evidence vs. minimization.** Reconstructing what a clinician saw (`SAF-0023`)
   requires retaining the *displayed state*, which is more data, retained longer, than care
   delivery alone needs.
3. **Backups vs. deletion.** A deletion that does not reach backups, snapshots, and DR
   copies is not a deletion (THR-0033, THR-0060). Backup retention therefore sets a floor
   on every deletion commitment.
4. **Correction vs. immutability.** `SAF-0014` requires corrections to be new linked facts
   that never mutate history. A correction workflow and a deletion workflow are different
   things and must not be conflated in either the schema or the policy.

---

## 5. Data flows and boundaries (anticipated)

Each flow crosses a trust boundary from `threat-model.md` §2. **`Approved` is `NO` for
every flow** — `PROMPT:772` requires privacy/legal owners to approve data flows before
Gate G6, and `AUTH-PRIVACY-LEGAL` is unassigned.

| Flow | From → To | Categories | Boundary | Approved | Key threats |
|---|---|---|---|---|---|
| **F-1** | AMH-data platform → V2 ingestion | 2, 3 | TB-05 | **NO** | THR-0018, THR-0027, THR-0046, THR-0047 |
| **F-2** | V2 → clinician browser/device | 2, 3, 4 | TB-01 | **NO** | THR-0016, THR-0017, THR-0023 |
| **F-3** | V2 → external notification channel | 4 (+2 if not minimized) | TB-07 | **NO** | THR-0032, THR-0041 |
| **F-4** | V2 → observability / ticketing / support | 7 (+ leaked 2/3/4) | TB-10 | **NO** | THR-0028, THR-0031, THR-0033 |
| **F-5** | V2 → MCP surface → model provider | 3, 4 (+2) | TB-08 | **NO** | THR-0029, THR-0062, THR-0067 |
| **F-6** | V2 → backup / DR / evidence export | 1–5 | TB-11 | **NO** | THR-0057..THR-0060 |
| **F-7** | V2 → analytics/outcomes consumer | 3, 4 (minimized) | not modelled | **NO — and no consumer exists** | T-4 (`threat-model.md` §10) |
| **F-8** | V2 → writeback to AMH or a source EMR | 4 | not modelled | **NO — candidate contract only** (`PROMPT:473`) | not enumerated |
| **F-9** | Production → non-production environment | **must be NONE** | TB-09, TB-11 | **PROHIBITED** by M-2 / rule 12 | THR-0030, THR-0060 |

### 5.1 Residency and cross-border

**NOT DETERMINED.** No cloud provider, no region, no managed service, and no model provider
has been selected (`PROMPT:126` rule 14 forbids selecting any of these without an ADR;
`docs/14-devsecops-and-delivery/ci-policy.md` §2 confirms none exists). Residency
requirements — if any apply — are `VALIDATION REQUIRED`, owner `AUTH-PRIVACY-LEGAL`, and
must be an input to the platform ADR (`PROMPT:654`), not a discovery after it.

**Flows F-5 and F-3 are the ones most likely to cross a border silently**, because model
providers and notification providers are commonly multi-region by default and are often
adopted without a residency review. Recorded as a specific pre-decision warning.

### 5.2 Automated processing and human decision authority

`PROMPT:127` (rule 15) keeps clinical decision authority with accountable humans:
automation may calculate, summarize, route, and explain within approved intended use, and
may not silently expand it. `SAF-0035` and `SEC-0044` carry this technically.

**Whether any of the anticipated processing engages rules on automated decision-making, and
what rights or review obligations would follow, is `VALIDATION REQUIRED`, owner
`AUTH-PRIVACY-LEGAL`.** This document deliberately does not characterise the system's
outputs in legal terms — describing an evaluation as "not a decision" would itself be a
legal conclusion.

### 5.3 Data-subject categories

Two distinct groups, often conflated, with different rights postures and different risks:

- **Patients** — categories 2, 3, 4, and their traces in 5 and 7.
- **Clinical and operational staff** — categories 1, 4 (as actors), 5, 7. The audit trail
  is simultaneously a clinical-accountability record and a **staff monitoring** dataset.
  Its governance is not the same question as patient-data governance, and it is the one
  most often forgotten. `VALIDATION REQUIRED`.

### 5.4 The cross-PJ correlation prohibition

**PROPOSAL, adopted from `IDP-09` and carried here as a privacy control (SEC-0010):** V2
never builds, hosts, imports, caches, or derives a cross-PJ / cross-tenant correspondence
structure. If cross-PJ context is ever required, it arrives only through an explicit,
purpose-bound, consent-filtered, AMH-owned interface, under a published contract, after the
identity contradiction record is adjudicated.

SOURCE (`IDP-09`, citing AMH ADR-043): the AMH correspondence index *"roda com role
dedicada, fora das roles de tenant"*, **does not persist the attributes**, and access is
governed by an explicit separate grant — *"Nenhum consumidor herda acesso ao índice por ser
de um dos tenants pareados"*. It is also **awaiting a legal opinion**.

**INFERENCE:** the privacy failure to prevent is V2 becoming, incidentally, the
uncontrolled copy of a structure AMH deliberately isolated behind a dedicated role and a
pending legal opinion. This can happen without anyone deciding to do it — a dedup table, an
MPI cache, or an analytics join is enough (THR-0020).

### 5.5 Disclosure to model providers

SOURCE (`PROMPT:736`): *"minimize and redact PHI; do not send PHI to model providers
without approved legal, privacy, security, residency, and contractual controls."*

**Current state: none of those five controls exists, and no model provider is selected.**
Therefore, as a PROPOSAL for immediate adoption: **no category 2, 3, or 4 data may reach
any model provider, in any environment, under any framing (including "de-identified",
"summarised", or "just the values"), until all five are in place and approved by
`AUTH-PRIVACY-LEGAL` and `AUTH-SECURITY`.** THR-0029, THR-0062.

---

## 6. Processor inventory — **EMPTY**

| Processor | Role | Categories | Location | Contract | Approval |
|---|---|---|---|---|---|
| *(none)* | — | — | — | — | — |

**No processor, sub-processor, cloud provider, managed service, notification provider,
model provider, observability vendor, or support tool has been selected for IntensiCare V2.**
This is an accurate statement of fact, not an incomplete section.

**Consequence for Gate G6 (`PROMPT:772`):** G6 requires that "privacy/legal owners approve
data flows and processors." With an empty inventory and no named owner, this G6 condition
is **not merely unmet — it is not yet approachable.** See `g6-readiness.md`.

**Required before any processor is engaged** (PROPOSAL — the checklist, not an approval):
identify the processing and its purpose; determine the legal basis and any transfer
mechanism (`AUTH-PRIVACY-LEGAL`); assess security posture (`AUTH-SECURITY`); establish
contractual terms including sub-processor disclosure, breach notification, deletion on
termination, and audit rights; determine residency; record the decision in
`registers/decision-register.md`; add the row above. **AMH is not a processor of V2's data
in this direction** — the F-1 flow makes V2 a consumer of AMH data, and the responsibility
allocation between the two organizations is itself unresolved (`PROMPT:465` requires the
contract manifest to carry "threat, privacy, consent, purpose-of-use, retention, audit and
incident responsibilities"; no such manifest exists).

---

## 7. Data-subject rights workflow — placeholder

**No workflow exists.** Which rights apply, to whom, on what timeline, with what identity
verification, and subject to what clinical-record exceptions, is `VALIDATION REQUIRED`,
owner `AUTH-PRIVACY-LEGAL`. The skeleton below records the *engineering* obligations each
generic right would create, so that they can constrain the schema before it is fixed —
implementing them retroactively is far harder.

| Generic right | Engineering capability it would require | Exists | Blocked on |
|---|---|---|---|
| Confirmation / access | Enumerate all data about one subject **across every store**: operational, projections, caches, queues, quarantine, audit, backups, exports, search indexes | **NO** | Architecture; SEC-0032; a data inventory that stays accurate |
| Correction | `SAF-0014`'s correction-as-new-linked-fact model, plus re-evaluation and explicit retraction of derived alerts | **NO** | ADR 5 (`PROMPT:640`) |
| Deletion / anonymization | Secure deletion reaching every copy incl. backups, reconciled against audit-immutability and medical-record retention (§4.1) | **NO** | §4 retention determination; audit-schema design |
| Portability | Export in a structured, interoperable form with provenance | **NO** | Contract/format decisions |
| Information about sharing | An accurate, current processor and flow inventory (§5, §6) | **NO** — inventory is empty | Processor selection |
| Objection / review of automated processing | Identify which outputs are automated, and a human-review path | **NO** | §5.2 `VALIDATION REQUIRED` |
| Revocation of consent | A consent state V2 can read and honour — **which does not exist upstream** (§1.1) | **NO** | AMH consent writer; `IDP-07` |

**Cross-cutting engineering prerequisite:** every right above needs *the ability to find all
data about one subject*. That capability must be a design constraint on the data model from
the first migration. It cannot be added later without a migration of every store, and it is
in direct tension with M-8's proliferation of copies — which is precisely why M-8 requires
every copy to be inventoried.

---

## 8. Data-flow approval register — **EMPTY**

| Flow | Approver | Date | Scope | Conditions |
|---|---|---|---|---|
| *(none)* | — | — | — | — |

No data flow has been approved by anyone. `AUTH-PRIVACY-LEGAL` is `UNASSIGNED` (`BLK-0004`);
`AUTH-SECURITY` is `UNASSIGNED` (`BLK-0003`). No agent may approve a data flow
(`docs/00-governance/evidence-notation.md` §2 rule 3: no agent may self-apply `DECIDED`).

---

## 9. Impact-assessment placeholder

Whether a formal impact assessment (e.g. a `Relatório de Impacto à Proteção de Dados
Pessoais`) is required, in what form, and at what trigger point, is **`VALIDATION REQUIRED`,
owner `AUTH-PRIVACY-LEGAL`.** This document is **not** such an assessment and must not be
cited as one, in whole or in part.

What this document *does* provide as input, should one be commissioned: the anticipated
category inventory (§1), the candidate purpose vocabulary (§2), the minimization stance
(§3), the flow inventory (§5), and the privacy-relevant threat enumeration in
`threat-model.md` §4.D and §4.F (THR-0016..THR-0020, THR-0028..THR-0033, THR-0060,
THR-0062, THR-0067).

---

## 10. Breach and incident placeholder

No incident-response process exists (SEC-0035, `PROPOSAL / NOT-IMPLEMENTED`). Notification
obligations — to whom, within what period, on what threshold — are `VALIDATION REQUIRED`,
owner `AUTH-PRIVACY-LEGAL`.

**One engineering prerequisite is worth recording now, because it is a design constraint
rather than a process document:** determining the *scope* of a breach requires the audit
trail to record **reads**, not only writes (`SAF-0023`, SEC-0032). A system that cannot say
who read what cannot scope a disclosure incident, and will be forced to notify on the
worst-case assumption. That requirement must land in the audit schema before it is fixed.

---

## 11. What this document does NOT do

1. It does not determine that LGPD, ANVISA/SaMD, or any other framework applies — or does
   not apply — to IntensiCare V2.
2. It does not establish a legal basis or hypothesis for any processing.
3. It does not classify any data as `dado pessoal sensível` or any other legal category.
4. It does not approve any purpose, flow, processor, retention period, or transfer.
5. It does not claim compliance with anything, and no derived artifact may.
6. It does not constitute an impact assessment, a record of processing activities, or legal
   advice.
7. It does not assert that any minimization stance in §3 is implemented. **None is.**
8. It contains no personal data, no PHI, no credentials, and no real identifiers — and none
   may ever be added to it.
