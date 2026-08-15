---
id: HAZARD-LOG-V2
title: IntensiCare V2 Clinical Hazard Log (seed)
label: PROPOSAL
statement: >
  Seed hazard log for IntensiCare V2. Forty-four hazards (HAZ-0001..HAZ-0044) identified by
  structured what-if over the candidate safety loop, with fault-tree and STPA-style
  supplements, cross-referenced to the Wave 2 threat model (THR-0001..THR-0067) and to the
  pathway portfolio's candidate hazards PH-01..PH-12. Every
  severity and likelihood is a PROPOSAL. Every hazard is OPEN. Every owner is UNASSIGNED.
  No hazard in this file is closed, accepted, or verified.
provenance:
  source_repo: intensicare-V2
  path_or_url: docs/05-clinical-safety/hazard-log.md
  commit_sha_or_version: uncommitted (working tree at cb35521)
  section_or_lines: whole document
  date_collected: 2026-08-14
  collector: clinical safety-case engineer (Wave 1 specialist agent)
  transformation: >
    Hazards derived from INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §§1,3,7.6,13 and from the
    legacy technical assessment (read-only). Legacy findings are cited as evidence that a
    failure mode is real and has occurred; they are NOT imported as V2 design.
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

# IntensiCare V2 — Hazard Log (seed, Wave 1)

> **Every row: `Status = OPEN`, `Owner = UNASSIGNED — VALIDATION REQUIRED`.**
> Severity and likelihood are **PROPOSAL** pre-control estimates for a system that does
> not yet exist. They are triage aids. **They are not severity sign-off and not risk
> acceptance.** Both require named humans (see `safety-plan.md` §4.1, §6.2).

## 1. Conventions

- **ID:** `HAZ-xxxx`, sequential, never reused, never deleted.
- **Statement form:** *condition → event → harm* (`safety-plan.md` §6.1).
- **Phase:** P0 platform/lifecycle (cross-cutting) · P1 trusted input · P2 identity/
  encounter/provenance/quality validation · P3 versioned deterministic evaluation ·
  P4 explicit evaluation status · P5 durable explainable alert/work item · P6 authorized
  human action · P7 audit/reconciliation/outcome/rule-performance
  (SOURCE `PROMPT:33-45`).
- **S / L / Class:** scales defined in `safety-plan.md` §6.3. All **PROPOSAL**.
- **Controls:** candidate `SAF-xxxx` from `safety-requirements.md`. All **PROPOSAL**.
- **`joint`** tag = requires a joint hazard/threat-model session (`PROMPT:750`); these
  are the Wave 2 handoff set.

### Citation shorthand

| Token | Resolves to |
|---|---|
| `PROMPT:n-m` | `/Users/familia/code/intensicare-V2/INTENSICARE_V2_ORCHESTRATOR_PROMPT.md` lines n–m |
| `LEGACY-TA:n-m` | `/Users/familia/intensicare/INTENSICARE_TECHNICAL_ASSESSMENT.md` lines n–m — READ-ONLY, risk-informed input, **not authority** |

## 2. Evidence-strength grading used in the `Evidence` column

| Grade | Meaning |
|---|---|
| **E1 — occurred** | The assessment reports the failure as *confirmed behaviour of the legacy system*, verified by the assessor (e.g. a controlled function call). Strongest available evidence that the failure mode is real and reachable. |
| **E2 — assessed** | The assessment reports it as a finding/gap based on reading legacy code, with a cited legacy path. This agent verified the *assessment text*, not the legacy source file. |
| **E3 — required by prompt** | The orchestrator prompt names the failure mode as something V2 must address. Authority for *inclusion*, not evidence of occurrence. |
| **E4 — inference** | Reasoned from E1–E3 items named in the row. |

**OBSERVED, and load-bearing:** this agent read the legacy *assessment document* only.
It did not open any legacy source file. No hazard below is an observation of IntensiCare
V2 behaviour — the V2 repository contains no source code as of 2026-08-14.

### 2.1 THR cross-references (integrated 2026-08-15)

Rows carry `**THR:**` and, where applicable, `**THR (supply chain, closes G-1):**` segments
in the Evidence column. These are **adversarial/systemic threat paths** to the same hazard
condition, supplied by the Wave 2 healthcare threat-model specialist
(`docs/11-security-privacy-compliance/threat-model.md` §9, THR-0001..THR-0067).

Three rules govern them:

1. A THR link is a **causal path**, not evidence grade. It does not raise or lower any
   S/L value. The threat model states explicitly that it supplies "linkage only" and that
   severity, likelihood, and hazard class remain this owner's act (threat-model §9.2).
2. THR IDs and HAZ IDs are **independent sequences**. Any numeric coincidence
   (e.g. THR-0041 / HAZ-0041) is accidental and carries no meaning.
3. A hazard with THR links is **not** thereby better controlled. Linking a threat to a
   hazard records that a second causal path exists — it makes the hazard *harder* to
   close, not easier.

---

## 3. Hazard table

### P1 — Trusted clinical input

| HAZ | Hazard statement (condition → event → harm) | Phase | Evidence | S | L | Class | Candidate controls | Status | Owner |
|---|---|---|---|---|---|---|---|---|---|
| **HAZ-0007** | Source system omits or malforms a clinical timestamp → ingestion substitutes receipt time ("now") as the clinical time → a hours-old observation appears current; clinician judges trend and acuity on a fabricated time; deterioration is missed or a resolved state is treated as active | P1 | **E1** `LEGACY-TA:442` (MLLP: "Invalid/missing source timestamps become current time… damaging provenance and freshness"); **E1** `LEGACY-TA:642` (`recorded_at` defaults to request time); **E3** `PROMPT:120` (rule 8: never invent a source timestamp) | S4 | L4 | Unacceptable | SAF-0010, SAF-0011, SAF-0028, SAF-0033 | OPEN | UNASSIGNED — VALIDATION REQUIRED |
| **HAZ-0009** | At-least-once transport or retried ingest delivers the same observation twice with no canonical idempotency key → duplicate clinical facts persist → double-counted trends, duplicate alerts, alert fatigue, and a false impression of measurement frequency | P1 | **E2** `LEGACY-TA:443` (missing MSH-10 → patient-derived fallback key; distinct messages mistaken for replay); **E2** `LEGACY-TA:444` (process-local replay store); **E3** `PROMPT:754`, `PROMPT:708` | S3 | L4 | Undesirable | SAF-0013, SAF-0014, SAF-0016 | OPEN | UNASSIGNED — VALIDATION REQUIRED |
| **HAZ-0010** | Upstream backlog, retry, or batch cadence delays an observation past its clinical usefulness → evaluation fires late or not at all → the window for intervention closes; deterioration is recognised after harm | P1 | **E3** `PROMPT:754`; **E1** `LEGACY-TA:231,239` (batch Gold freshness vs. seconds-level objective); see also HAZ-0030 | S4 | L4 | Unacceptable | SAF-0004, SAF-0011, SAF-0025, SAF-0031, SAF-0033 | OPEN | UNASSIGNED — VALIDATION REQUIRED |
| **HAZ-0011** | Partitioned or multi-lane delivery presents observations out of chronological order → a superseded older value overwrites a newer one, or a trend is computed on a reordered series → the patient's direction of travel is inverted; improving reads as deteriorating or vice versa | P1 | **E3** `PROMPT:754`, `PROMPT:378`, `PROMPT:494` | S4 | L3 | Undesirable | SAF-0011, SAF-0014, SAF-0019, SAF-0033 | OPEN | UNASSIGNED — VALIDATION REQUIRED |
| **HAZ-0012** | Ingest acknowledges an observation before it is durably persisted, or a non-durable queue drops it → the clinical fact is silently lost → evaluation runs on an incomplete record and reports a reassuring result that no human knows is incomplete | P1 | **E2** `LEGACY-TA:444` (no durable store-and-forward); **E3** `PROMPT:724` ("Never acknowledge durable acceptance before the agreed persistence boundary is met"), `PROMPT:121` | S4 | L3 | Unacceptable | SAF-0012, SAF-0013, SAF-0015, SAF-0033 | OPEN | UNASSIGNED — VALIDATION REQUIRED |
| **HAZ-0026** | Source device, interface engine, or ingest host has skewed clock or ambiguous/absent timezone offset (incl. DST transitions in `America/Sao_Paulo`) → clinical instants are stored with wrong absolute time → ordering, freshness windows, and time-to-treatment measurements are wrong; a stale value passes a freshness gate or a current value is rejected as stale | P1 | **E3** `PROMPT:761`, `PROMPT:378`, `PROMPT:598`; **E2** `LEGACY-TA:442` | S3 | L3 | Undesirable | SAF-0010, SAF-0011, SAF-0012, SAF-0033 | OPEN | UNASSIGNED — VALIDATION REQUIRED |
| **HAZ-0032** | An unrecognised clinical code, unit, or non-canonical unit string arrives → the adapter coerces it to a default or nearest match instead of quarantining → a value is evaluated in the wrong unit or under the wrong concept; a normal value scores as critical or a critical value scores as normal | P1 | **E1** `LEGACY-TA:459,586` (unit validator fails on three non-canonical `unit='anyOf:'` values; no verified SNOMED CT/LOINC/UCUM validation pipeline found); **E3** `PROMPT:716` ("Unknown codes or units must be quarantined or explicitly represented—not silently coerced") | S4 | L3 | Unacceptable | SAF-0028, SAF-0002, SAF-0033 | OPEN | UNASSIGNED — VALIDATION REQUIRED |
| **HAZ-0038** | A clinical resource arrives referencing an encounter that has not been ingested (ingestion skew) → the resource is treated as validly contextualised because it parses → an observation is attributed to the wrong episode of care, or an evaluation runs without the encounter context that determines its applicability | P1 | **E1** `PROMPT:105` (AMH reports 52,452 clinical rows referencing absent encounters due to ingestion skew); **E3** `PROMPT:502` (referential-gap fitness checks) | S4 | L4 | Unacceptable | SAF-0009, SAF-0033, SAF-0035, SAF-0001 | OPEN | UNASSIGNED — VALIDATION REQUIRED |
| **HAZ-0039** | A source table/feed is empty or has 100%-null business columns, and the query succeeds → absence of data is read as absence of abnormality → an unmonitored patient is displayed as having no findings; deterioration is invisible | P1 | **E1** `PROMPT:103` (measured Gold sweep: 21 empty tables, 21 tables with entirely null business columns; "a present schema and successful query can still return misleading absence"); **E1** `PROMPT:97` (Tasy `PACIENTE_EXAME` zero rows); **E3** `PROMPT:414` | S5 | L4 | Unacceptable | SAF-0002, SAF-0006, SAF-0033, SAF-0035 | OPEN | UNASSIGNED — VALIDATION REQUIRED |

### P2 — Identity, encounter, provenance, quality validation

| HAZ | Hazard statement (condition → event → harm) | Phase | Evidence | S | L | Class | Candidate controls | Status | Owner |
|---|---|---|---|---|---|---|---|---|---|
| **HAZ-0001** | Patient identity is resolved from a caller-supplied or non-unique identifier → an observation, evaluation, or alert is attached to the wrong patient → a clinician acts on another patient's physiology: unnecessary intervention on one patient and missed deterioration on another | P2 | **E2** `LEGACY-TA:632` (patient lookup by `mpi_id` only; unowned fact rows); **E1** `LEGACY-TA:1006` (open question: is `mpi_id` globally unique across organizations and encounters?); **E3** `PROMPT:118`, `PROMPT:753` | S5 | L3 | Unacceptable | SAF-0007, SAF-0008, SAF-0009, SAF-0029 | OPEN | UNASSIGNED — VALIDATION REQUIRED |
| **HAZ-0002** | A clinical fact is associated with the wrong encounter/episode (readmission, transfer, or overlapping encounter) → evaluation applies an encounter-scoped rule to the wrong episode → an alert fires against a discharged episode, or a current deterioration is filed under a closed encounter and never surfaces | P2 | **E2** `LEGACY-TA:742` (missing fact FKs/tenant keys, nullable natural-key field); **E3** `PROMPT:753`, `PROMPT:444`, `PROMPT:592` | S4 | L3 | Unacceptable | SAF-0008, SAF-0009, SAF-0014, SAF-0029 | OPEN | UNASSIGNED — VALIDATION REQUIRED |
| **HAZ-0003** `joint` | Tenant/organization context is derived from a caller-controlled value rather than verified identity → clinical facts, rules, or alerts cross an organizational boundary → PHI disclosure to another legal entity and clinical action taken under another organization's rule configuration | P2 | **E1** `LEGACY-TA:305` (implemented: "Caller header wins; equality check is tautological; core facts lack tenant"); **E1** `LEGACY-TA:629-637` (IC-001, Critical/High); **E3** `PROMPT:118`, `PROMPT:753`, `PROMPT:755`; **THR:** THR-0001, THR-0003, THR-0018, THR-0020, THR-0022, THR-0026, THR-0048 | S5 | L4 | Unacceptable | SAF-0007, SAF-0008, SAF-0013, SAF-0026 | OPEN | UNASSIGNED — VALIDATION REQUIRED |
| **HAZ-0004** | Bed/care-unit/location assignment is stale or wrong → a bed grid shows a patient in the wrong bed or a discharged bed as occupied → response is dispatched to the wrong bedside; time is lost during a time-critical deterioration | P2 | **E3** `PROMPT:753`, `PROMPT:585`, `PROMPT:592`; **E4** inference from HAZ-0002 and `LEGACY-TA:324` (unit filter matches name/pathway strings rather than a reliable unit field, returning semantically incorrect results) | S4 | L3 | Undesirable | SAF-0009, SAF-0008, SAF-0005 | OPEN | UNASSIGNED — VALIDATION REQUIRED |
| **HAZ-0008** | A corrected, amended, cancelled, or superseded source value arrives → the correction silently overwrites history, or is silently ignored → an evaluation and any alert derived from the erroneous value remain unretracted; the audit trail cannot reconstruct what the clinician actually saw | P2 | **E3** `PROMPT:120`, `PROMPT:378`, `PROMPT:476`, `PROMPT:494`; **E2** `LEGACY-TA:746` (no dedup/conflict workflow; "correction does not erase history" listed as a target invariant, `LEGACY-TA:931`) | S4 | L3 | Undesirable | SAF-0014, SAF-0019, SAF-0023, SAF-0033 | OPEN | UNASSIGNED — VALIDATION REQUIRED |
| **HAZ-0027** | An MPI merge or unmerge occurs upstream → prior observations, evaluations, and open alerts are not re-associated (or are wrongly re-associated across a tenant boundary) → clinical history is split or wrongly joined; a clinician sees a partial history and judges stability that the full record contradicts | P2 | **E2** `LEGACY-TA:455` ("no local merge/unmerge reconciliation workflow is established"); **E1** `PROMPT:99` (ADR-041 tenant-local MPI vs. ADR-006/FHIR-IG longitudinal language — an unresolved contradiction); **E3** `PROMPT:446-447`, `PROMPT:761` | S4 | L3 | Unacceptable | SAF-0029, SAF-0014, SAF-0023, SAF-0009 | OPEN | UNASSIGNED — VALIDATION REQUIRED |
| **HAZ-0040** | AMH source data-quality status (`valid \| warning \| quarantined`) is collapsed into, or read as, V2 evaluation status (`valid \| partial \| not_evaluated \| stale \| invalid`) → a source marked `valid` is treated as a valid *evaluation*, or a `quarantined` source becomes an ordinary V2 value → an evaluation is presented as trustworthy when its inputs were quarantined, or staleness is masked by upstream validity | P2/P4 | **E1** `PROMPT:102` (AMH DQ vocabulary is only `valid\|warning\|quarantined`; "must not be conflated"); **E3** `PROMPT:497-502` ("Define an explicit mapping matrix but never collapse the dimensions") | S4 | L4 | Unacceptable | SAF-0032, SAF-0001, SAF-0033 | OPEN | UNASSIGNED — VALIDATION REQUIRED |

### P3 / P4 — Deterministic evaluation and explicit evaluation status

| HAZ | Hazard statement (condition → event → harm) | Phase | Evidence | S | L | Class | Candidate controls | Status | Owner |
|---|---|---|---|---|---|---|---|---|---|
| **HAZ-0005** | A required clinical input is missing, and the scoring function treats absence as the numeric contribution zero → a numerically low, "normal-looking" score is produced and persisted for a patient who was never assessed → **false reassurance; the patient is de-prioritised on the bed grid and deterioration is missed.** This is the single highest-priority hazard in this log because it is the failure that actually occurred in the predecessor system. | P3/P4 | **E1 — occurred.** `LEGACY-TA:469-478`: controlled pure-function check with **all clinical inputs absent** returned MEWS `0`, NEWS2 `0`, SOFA `0`, qSOFA `0`; "The numeric result is persisted and can drive a `normal` bed state. The metadata is not elevated into an evaluation-status contract. This is a confirmed violation of documented intent and the most serious clinical safety defect in the repository." **E1** `LEGACY-TA:639-647` (IC-002, Critical/High; absent MEWS components contribute zero; bed severity floors to normal; legacy `HAZ-030` required `not evaluated`). **E1** `LEGACY-TA:306` (gap table: "Direct contradiction with HAZ-030"). **E3** `PROMPT:119` (rule 7). | S5 | L4 | Unacceptable | SAF-0001, SAF-0002, SAF-0003, SAF-0006, SAF-0019, SAF-0030 | OPEN | UNASSIGNED — VALIDATION REQUIRED |
| **HAZ-0006** | An input is present but older than its clinically valid window, and no uniform staleness policy invalidates or annotates the evaluation → a stale value is scored as if current → the displayed acuity reflects a state the patient has already left; deterioration since the last measurement is invisible | P3/P4 | **E1** `LEGACY-TA:307` ("no uniform score invalidation/suppression; timestamp can default now"); **E1** `LEGACY-TA:330` (stale historical data returned when the 24-hour window is empty); **E2** `LEGACY-TA:469` (legacy `HAZ-024` required freshness windows and explicit stale handling); **E3** `PROMPT:119`, `PROMPT:39` | S5 | L4 | Unacceptable | SAF-0004, SAF-0005, SAF-0001, SAF-0002, SAF-0025 | OPEN | UNASSIGNED — VALIDATION REQUIRED |
| **HAZ-0019** | An unapproved, unsigned, malformed, or withdrawn rule bundle is activated in a running environment → patients are evaluated by clinical logic no clinical approver ratified → systematically wrong thresholds across an entire unit; harm is correlated, not isolated | P3 | **E2** `LEGACY-TA:487` ("Score-version identifiers are strings in code rather than a signed release registry tied to approved evidence and test packs"); **E2** `LEGACY-TA:719-727` (IC-010: multiple engine instances, legacy fallback, best-effort boot sync); **E3** `PROMPT:122`, `PROMPT:330-345`, `PROMPT:758`; **THR (supply chain, closes G-1):** THR-0050, THR-0051, THR-0052, THR-0054, THR-0055, THR-0056 — each ends with clinical logic executing that no clinical approver ratified, reached by a **build-system** path rather than a rule-registry path; THR-0056 additionally tampers with the *evidence* layer (vectors, test packs, approval records) so a defective bundle passes its own gate | S5 | L3 | Unacceptable | SAF-0020, SAF-0021, SAF-0019, SAF-0030 | OPEN | UNASSIGNED — VALIDATION REQUIRED |
| **HAZ-0020** | A rule bundle rollback fails, or two runtime instances hold different active versions → different clinicians receive different evaluations for the same patient at the same moment, and a withdrawn rule keeps firing → inconsistent clinical direction; loss of trust; an identified defect cannot be stopped | P3 | **E2** `LEGACY-TA:722-724` (multiple `TrilhasEngine` instances; "Different instances can hold different suppression/load state; DB registry can be stale; reproducibility is weakened"); **E3** `PROMPT:758`, `PROMPT:862` | S4 | L3 | Unacceptable | SAF-0021, SAF-0020, SAF-0024, SAF-0025 | OPEN | UNASSIGNED — VALIDATION REQUIRED |
| **HAZ-0021** | A rule does not run, or runs and does not fire, and no immutable record captures **why** → a no-fire is indistinguishable from a negative evaluation → nobody can tell whether a patient was assessed and found well, or never assessed at all; the same defect can recur undetected across every patient | P3/P4/P7 | **E1** `LEGACY-TA:486` ("No immutable evaluation record captures why a rule did **not** run or did not fire"); **E3** `PROMPT:119` ("silent no-fire"), `PROMPT:758` ("no-fire opacity"), `PROMPT:794` | S5 | L4 | Unacceptable | SAF-0019, SAF-0001, SAF-0023, SAF-0030 | OPEN | UNASSIGNED — VALIDATION REQUIRED |
| **HAZ-0030** | An approved pathway requires seconds-level recognition, but its only available source lane is batch with tens-of-minutes freshness → the alert is architecturally incapable of arriving in time, while the product implies it will → clinicians rely on surveillance that cannot detect acute deterioration in its actionable window | P1/P3/P5 | **E1** `LEGACY-TA:231` (ADR-001 sub-30-minute Gold freshness "conflict[s] with the product's sub-30-second alert objective"); **E1** `LEGACY-TA:239` ("batch Gold reads cannot satisfy seconds-level bedside alerting"); **E1** `LEGACY-TA:304` (gap table: "Target cannot be established without a streaming lane and production measurements"); **E1 (independent)** `PROMPT:95` (ADR-040 "explicitly says the path is not near-real-time"); **E3** `PROMPT:431-436` | S5 | L4 | Unacceptable | SAF-0031, SAF-0035, SAF-0025, SAF-0005 | OPEN | UNASSIGNED — VALIDATION REQUIRED |
| **HAZ-0036** | Automation summarises, routes, or phrases output in a way that reads as a directive, or evaluates a population/setting outside the approved intended use → the intended use silently expands → a clinician follows guidance never validated for that patient class; accountability for the decision becomes ambiguous | P3/P5/P6 | **E3** `PROMPT:127` (rule 15), `PROMPT:1052`; **E2** `LEGACY-TA:497-499` ("A disclaimer cannot compensate for misleading `normal` state or unreliable delivery"); **E2** `LEGACY-TA:769-777` (IC-015: product breadth exceeds the validated product model); **E4** `pathway-portfolio/candidate-inventory.md` §5 **PH-11** (mapped here, not minted separately — see §4 gap G-2): supplies a concrete mechanism for this row's out-of-population condition — adult-instrument logic evaluating a paediatric or unknown-age patient because population gating cannot be enforced from trusted data, since no trusted age source exists (`intended-use-statement.md` IU-06, BLOCKING) | S4 | L3 | Unacceptable | SAF-0035, SAF-0027, SAF-0020, SAF-0023 | OPEN | UNASSIGNED — VALIDATION REQUIRED |

### P5 — Durable, explainable alert / work item

| HAZ | Hazard statement (condition → event → harm) | Phase | Evidence | S | L | Class | Candidate controls | Status | Owner |
|---|---|---|---|---|---|---|---|---|---|
| **HAZ-0015** | An alert is generated and durably stored but never rendered to any human (process-local fan-out, dropped socket, unauthorised channel, or client never reconnects), and no monitor detects the gap → **generated ≠ displayed** → the deterioration the system correctly detected is never acted on; the audit record shows a "successful" alert nobody saw | P5 | **E1** `LEGACY-TA:669-677` (IC-005 Critical/High: separate in-memory managers, process-local SSE list, "Broadcasts are lost across processes/pods, worker events never reach endpoint-owned connections"); **E1** `LEGACY-TA:495` ("There is no demonstrated escalation timer, delivery receipt, handoff reconciliation, or 'alert generated but not displayed' monitor"); **E1** `LEGACY-TA:560` ("No external event-delivery SLI measures generated-to-visible latency or missed display"); **E3** `PROMPT:121`, `PROMPT:759` | S5 | L4 | Unacceptable | SAF-0015, SAF-0016, SAF-0025, SAF-0031 | OPEN | UNASSIGNED — VALIDATION REQUIRED |
| **HAZ-0016** | The same clinical condition produces repeated or duplicated alerts across transports, retries, or engine instances → alert volume inflates → alarm fatigue; clinicians desensitise and a genuine alert is dismissed with the noise | P5 | **E2** `LEGACY-TA:674` ("duplicate refreshes"), `LEGACY-TA:495` ("unbounded or duplicate transports create delayed/duplicate-alert risk"); **E3** `PROMPT:759`, `PROMPT:324` (interruptive-alert budgets) | S3 | L4 | Undesirable | SAF-0013, SAF-0016, SAF-0022, SAF-0017 | OPEN | UNASSIGNED — VALIDATION REQUIRED |
| **HAZ-0017** | An alert is delivered later than the clinical response window (queue lag, replay backlog, projection lag, reconnect backoff) → the alert arrives after the intervention window has closed → intervention is delayed; the alert may even mislead by describing a state that has already changed | P5 | **E2** `LEGACY-TA:495`, `LEGACY-TA:673` (slow queues can grow); **E3** `PROMPT:759`, `PROMPT:870-875` | S4 | L4 | Unacceptable | SAF-0016, SAF-0031, SAF-0025, SAF-0015 | OPEN | UNASSIGNED — VALIDATION REQUIRED |
| **HAZ-0018** | Routing configuration sends an alert to the wrong unit, role, or on-call target (or to an overbroad "firehose" audience) → nobody with responsibility for that patient receives it, or everyone receives everything → the alert is not owned; each recipient assumes another will act (diffusion of responsibility) | P5/P6 | **E2** `LEGACY-TA:673` ("any authenticated consumer may receive an overbroad firehose"); **E2** `LEGACY-TA:511` (alert-routing CRUD needs only authentication); **E3** `PROMPT:759` | S4 | L3 | Unacceptable | SAF-0018, SAF-0007, SAF-0016, SAF-0024 | OPEN | UNASSIGNED — VALIDATION REQUIRED |
| **HAZ-0022** | Cooldown, deduplication, or grouping suppresses an alert, and the suppression is not visible or auditable → a recurring or escalating condition is silently withheld → the clinician believes the condition resolved because the alerts stopped; escalation is not triggered | P5 | **E2** `LEGACY-TA:494` (cooldown and grouping exist; delivery/suppression state can drift, `LEGACY-TA:308`); **E3** `PROMPT:758` ("alert suppression"), `PROMPT:1059` ("Never hide 'unknown,' 'not evaluated,' degradation, partial failure, or alert-delivery uncertainty") | S4 | L4 | Unacceptable | SAF-0022, SAF-0005, SAF-0023, SAF-0019 | OPEN | UNASSIGNED — VALIDATION REQUIRED |
| **HAZ-0041** `joint` | An external notification channel (SMS, email, pager, push) is spoofed, or compromised at the provider, and V2 provides no way to verify an alert against the authoritative record → a clinician receives a **fabricated alert that V2 never generated**, or acts on a genuine-looking message whose content was altered in transit → intervention is performed on a patient who does not need it, and response capacity is diverted away from a patient who does; repeated exposure destroys trust in the alert channel itself | P5 | **E4** (INFERENCE) from `docs/11-security-privacy-compliance/threat-model.md` THR-0041 (P1: "Clinicians act on a **fabricated clinical alert**… Provider acceptance is not human receipt"); reasoned against **E3** `PROMPT:121` (real-time/notification output is not the clinical system of record) and **E3** `PROMPT:759`; **THR:** THR-0041 | S4 | L2 | Undesirable | SAF-0038, SAF-0015, SAF-0016, SAF-0023, SAF-0026 | OPEN | UNASSIGNED — VALIDATION REQUIRED |

### P6 — Authorized human action

| HAZ | Hazard statement (condition → event → harm) | Phase | Evidence | S | L | Class | Candidate controls | Status | Owner |
|---|---|---|---|---|---|---|---|---|---|
| **HAZ-0023** | Two clinicians act on the same alert concurrently with no optimistic-concurrency token → one transition silently overwrites the other (lost update) → the alert appears handled while the actual responder's rationale, assignment, or escalation is discarded; the patient is left unattended by both | P6 | **E1** `LEGACY-TA:709-717` (IC-009: "state mutations… lack locking/versioning/idempotency… Lost updates, inconsistent grouped actions, incomplete forensic history, duplicate commands"); **E2** `LEGACY-TA:495` ("transition concurrency is uncontrolled, some rationale fields are ignored, resolve actor is absent"); **E3** `PROMPT:760`, `PROMPT:707` | S4 | L4 | Unacceptable | SAF-0017, SAF-0013, SAF-0023, SAF-0018 | OPEN | UNASSIGNED — VALIDATION REQUIRED |
| **HAZ-0024** | Ownership of acknowledgment / escalation / closure is ambiguous across shift handover, break coverage, or downtime → an alert is acknowledged without anyone assuming responsibility for the response → the alert is closed administratively while the clinical action never happens | P6 | **E1** `LEGACY-TA:1000` (open question: "Who owns acknowledgment, escalation, reassignment, override, and closure during shift changes and downtime?"); **E2** `LEGACY-TA:495` ("no demonstrated escalation timer… handoff reconciliation"); **E3** `PROMPT:760` | S4 | L4 | Unacceptable | SAF-0017, SAF-0024, SAF-0016, SAF-0023 | OPEN | UNASSIGNED — VALIDATION REQUIRED |
| **HAZ-0033** | A bulk/group action over a queue issues sequential per-item requests, and one fails mid-sequence → the group appears acted-on while some items are untouched, and the UI retains a stale aggregate → a subset of alerts is silently abandoned in a safety-relevant queue | P6 | **E1** `LEGACY-TA:324` ("Group operations issue multiple sequential requests; a mid-sequence failure can leave a partially acknowledged group. Optimistic updates deliberately retain some stale group aggregates until revalidation"); **E3** `PROMPT:684-686` | S3 | L4 | Undesirable | SAF-0018, SAF-0017, SAF-0005 | OPEN | UNASSIGNED — VALIDATION REQUIRED |
| **HAZ-0037** | A clinically significant state change is rendered visually only, with no coalesced live-region announcement or non-color cue → an assistive-technology user is not informed of a new or escalating alert → that clinician is excluded from timely response; deterioration is missed for their patients | P6 | **E1** `LEGACY-TA:345` ("Login errors lack an assertive status/live region… no current application use of `aria-live` was found. Dynamic clinical changes therefore lack a tested, coalesced screen-reader announcement strategy"); **E3** `PROMPT:690`, `PROMPT:186` | S3 | L4 | Undesirable | SAF-0034, SAF-0005, SAF-0024 | OPEN | UNASSIGNED — VALIDATION REQUIRED |

### P7 — Audit, reconciliation, outcome, rule-performance feedback

| HAZ | Hazard statement (condition → event → harm) | Phase | Evidence | S | L | Class | Candidate controls | Status | Owner |
|---|---|---|---|---|---|---|---|---|---|
| **HAZ-0025** | An upstream feed stops or degrades, and readiness/health continues to report healthy → the bed grid keeps showing the last known values with no degraded-mode indication → clinicians trust a frozen board and stop performing the manual surveillance the board replaced | P0/P7 | **E1** `LEGACY-TA:560` ("Readiness can still be falsely positive… pathway load failures are omitted"); **E1** `LEGACY-TA:490` (`load_failures` not exposed in readiness/operations); **E2** `LEGACY-TA:754` ("Clinicians may trust a stale board"); **E3** `PROMPT:881`, `PROMPT:860` | S5 | L4 | Unacceptable | SAF-0025, SAF-0024, SAF-0005, SAF-0033 | OPEN | UNASSIGNED — VALIDATION REQUIRED |
| **HAZ-0031** | A safety-critical quality gate passes while validating zero cases, or is configured as advisory/non-blocking → a clinically material regression merges and releases under a green signal → an undetected defect reaches patients with the *appearance* of having been tested | P0/P7 | **E1** `LEGACY-TA:584` ("Vector coverage — Warned all 9 domain YAML lack `alert_groups`; then 'All 0' pass — **False-green gate; validates nothing**"); **E1** `LEGACY-TA:586` (unit validation fails); **E1** `LEGACY-TA:729-737` (IC-011: test job not required, build/a11y gates non-blocking, authenticated E2E skipped); **E1** `LEGACY-TA:581` (882 setup errors → "no clinical assertion ran"); **E3** `PROMPT:808`, `PROMPT:125`; **THR (supply chain, closes G-1):** THR-0055, THR-0056 — a gate that validates nothing, or validates against tampered evidence, is this hazard's exact condition arriving adversarially rather than by neglect; the threat model records **OBSERVED** that branch protection is not configured in this repository today | S5 | L5 | Unacceptable | SAF-0030, SAF-0019, SAF-0023 | OPEN | UNASSIGNED — VALIDATION REQUIRED |
| **HAZ-0034** `joint` | Backups are corrupt, restore has never been exercised, or post-downtime reconciliation is undefined → after an outage the clinical record is incomplete or divergent and nobody knows which facts are missing → clinicians resume work on a silently incomplete record; alerts generated during the outage are never reconciled | P0/P7 | **E1** `LEGACY-TA:562` ("The DR document explicitly describes resources as not yet provisioned… No backup restore evidence, recovery-time measurement, multi-AZ failure test, migration rollback drill, or downtime clinical procedure was found"); **E1** `LEGACY-TA:749-757` (IC-013); **E3** `PROMPT:763`, `PROMPT:879`; **THR:** THR-0057, THR-0058, THR-0059, THR-0060; **THR (supply chain, closes G-1):** THR-0053 — key *loss* (as distinct from key exposure) is a restore failure with clinical consequences. THR-0058's *deliberate-destruction* half is not held here; it is HAZ-0042 (§3.6) | S4 | L3 | Unacceptable | SAF-0036, SAF-0024, SAF-0023, SAF-0014 | OPEN | UNASSIGNED — VALIDATION REQUIRED |
| **HAZ-0035** | Audit coverage is incomplete (reads, alert transitions, or overrides unrecorded, or snapshots stored unencrypted/mutable) → the decision and action history cannot be reconstructed → a safety investigation cannot determine what the clinician saw or who acted; rule-performance feedback is built on an incomplete record and misdirects future clinical change | P7 | **E1** `LEGACY-TA:311` ("Trigger concept exists; some snapshots are plaintext bytes; alert transitions are not audited — Cannot reconstruct complete decision/action history"); **E1** `LEGACY-TA:712` (no AuditTrail writes for alert transitions); **E3** `PROMPT:594`, `PROMPT:768` | S4 | L4 | Unacceptable | SAF-0023, SAF-0017, SAF-0019, SAF-0026 | OPEN | UNASSIGNED — VALIDATION REQUIRED |

### P0 — Platform and lifecycle (cross-cutting)

| HAZ | Hazard statement (condition → event → harm) | Phase | Evidence | S | L | Class | Candidate controls | Status | Owner |
|---|---|---|---|---|---|---|---|---|---|
| **HAZ-0013** `joint` | A query, cache key, projection, event topic, or real-time subscription is not scoped by the verified tenant → a clinician or an automated consumer reads another organization's patients → PHI disclosure across legal entities and clinical action informed by another organization's patients | P0/P2/P5 | **E1** `LEGACY-TA:629-637` (IC-001: global dashboard query, missing tenant columns, arbitrary-tenant alert-routing CRUD); **E1** `LEGACY-TA:672-673` (no tenant/patient channel authorization on WS/SSE); **E3** `PROMPT:755`, `PROMPT:1060`; **E1** `PROMPT:100` (HAPI: authenticated token tenant must equal URL tenant; cross-partition references disabled); **THR:** THR-0002, THR-0004, THR-0015, THR-0016, THR-0017, THR-0018, THR-0019, THR-0020, THR-0026, THR-0027, THR-0040, THR-0063, THR-0067; **THR (supply chain, closes G-1):** THR-0050, THR-0051, THR-0052, THR-0053, THR-0054 — code running inside the application reads tenant context and store directly, defeating storage-level isolation | S5 | L4 | Unacceptable | SAF-0007, SAF-0008, SAF-0013, SAF-0026 | OPEN | UNASSIGNED — VALIDATION REQUIRED |
| **HAZ-0014** `joint` | Identity validation fails open (fallback to a local issuer on error), tokens travel in URLs, or refresh predecessors stay valid → an unauthenticated or replayed principal obtains a clinical session → unauthorised PHI access and unauthorised clinical actions attributed to a legitimate clinician | P0/P2/P6 | **E1** `LEGACY-TA:513` ("Fail-open identity: IAM validation falls back to local JWT on any error"); **E1** `LEGACY-TA:699-707` (IC-008: cookies not Secure, URL tokens, refresh predecessor remains valid); **E3** `PROMPT:756`, `PROMPT:718`; **THR:** THR-0021, THR-0022, THR-0023, THR-0024, THR-0025, THR-0049 | S4 | L4 | Unacceptable | SAF-0007, SAF-0026, SAF-0023, SAF-0013 | OPEN | UNASSIGNED — VALIDATION REQUIRED |
| **HAZ-0028** `joint` | PHI or identifiers are written to logs, traces, metrics, error bodies, fixtures, screenshots, tickets, agent prompts, or model-provider requests → clinical data leaves its purpose and residency boundary → privacy breach with legal, contractual, and patient-trust consequences; no clinical benefit offsets it | P0 | **E1** `LEGACY-TA:447` ("Logs include MPI identifiers and clinical values"); **E1** `LEGACY-TA:516`; **E2** `LEGACY-TA:560` (health responses include exception class/message); **E3** `PROMPT:124` (rule 12), `PROMPT:757`, `PROMPT:736`; **THR:** THR-0023, THR-0027, THR-0028, THR-0029, THR-0030, THR-0031, THR-0032, THR-0033, THR-0060, THR-0062; **THR (supply chain, closes G-1):** THR-0050, THR-0051, THR-0052, THR-0053 — exfiltration from *inside* the trust boundary, through channels no perimeter control inspects | S3 | L4 | Undesirable | SAF-0026, SAF-0027, SAF-0023 | OPEN | UNASSIGNED — VALIDATION REQUIRED |
| **HAZ-0029** `joint` | Untrusted clinical text (a note, document, or source record) carries injected instructions into an MCP/AI context, or model prose is presented alongside clinical output without grounding → ungrounded or attacker-influenced clinical text reaches a clinician as if it were system output → the clinician acts on fabricated or manipulated clinical content that no deterministic evaluation supports | P0/P5 | **E3** `PROMPT:737-742` ("Separate trusted instructions from untrusted clinical/document content"; "never let model-generated prose replace the signed deterministic evaluation record"), `PROMPT:764`, `PROMPT:109` (MCP is a **new** V2 interface, not inherited AMH compatibility); **THR:** THR-0029, THR-0041, THR-0061, THR-0062, THR-0063, THR-0064, THR-0065, THR-0066, THR-0067 — note THR-0041's *channel-spoofing* half is not held here; it is HAZ-0041 (§3.1) | S4 | L3 | Unacceptable | SAF-0027, SAF-0019, SAF-0026, SAF-0023 | OPEN | UNASSIGNED — VALIDATION REQUIRED |
| **HAZ-0042** `joint` | A destructive attack or destructive insider action (ransomware, mass deletion) reaches backups because they share a credential, network, account, or region with production, and no copy is immutable or isolated → **the clinical record and the decision support built on it are totally unavailable during active patient care, with no recovery path** → clinicians lose the surveillance the unit reorganised around, mid-shift, with no fallback record of what was already evaluated, acknowledged, or escalated; the availability failure *is* the clinical harm | P0/P7 | **E4** (INFERENCE) from `docs/11-security-privacy-compliance/threat-model.md` THR-0058 (P1: "backups are reachable from the same credential, network, or account as production — no immutability, no isolation… The availability failure *is* the clinical harm"); reasoned against **E1** `LEGACY-TA:562` (no restore evidence, DR resources unprovisioned) and **E3** `PROMPT:763`; **THR:** THR-0058, THR-0053 | S5 | L2 | Unacceptable | SAF-0039, SAF-0036, SAF-0024, SAF-0023 | OPEN | UNASSIGNED — VALIDATION REQUIRED |

### Portfolio-level — hazards of the admission decision itself

These are **not** per-pathway hazards. They arise from the decision to admit (or to keep
admitting) pathways, they apply **even while the portfolio is empty**, and they cannot wait
for a pathway to be selected — the harm in HAZ-0043 is *caused by* premature admission.
Integrated from `pathway-portfolio/g2-validation-backlog.md` §3.3 (see §4, gap G-2).

| HAZ | Hazard statement (condition → event → harm) | Phase | Evidence | S | L | Class | Candidate controls | Status | Owner |
|---|---|---|---|---|---|---|---|---|---|
| **HAZ-0043** | A pathway is admitted to the portfolio while its required inputs have no authoritative populated source → the pathway runs permanently in `not_evaluated`, and because it has *never* been in any other state, clinicians and operators habituate to it → the product displays a monitoring capability that is structurally incapable of evaluating anything, and the permanent emptiness is read as reassuring quiet rather than as absent surveillance | P0/P3/P4 | **E4** (INFERENCE) from `pathway-portfolio/candidate-inventory.md` §5 PH-10 and `pathway-portfolio/g2-validation-backlog.md` §3.3 ("describes a harm that occurs *because* something was admitted prematurely, so deferring it until after admission defeats its purpose"); reasoned against **E1** `PROMPT:97` (laboratory Observation blocked: preferred source not ingested), **E1** `PROMPT:103` (21 empty tables, 21 all-null), **E1** `PROMPT:417` (no demonstrated general vital-sign feed — "a hard portfolio constraint"), **E3** `PROMPT:415`. **Distinct from** HAZ-0039 (a *source* is empty — data level) and HAZ-0025 (a *healthy feed degrades* — transition level): this row is a capability that was never possible, normalised by permanence | S4 | L4 | Unacceptable | SAF-0040, SAF-0035, SAF-0033, SAF-0025, SAF-0006 | OPEN | UNASSIGNED — VALIDATION REQUIRED |
| **HAZ-0044** | A pathway generates an escalation work item for a patient under palliative care, a treatment-limitation order, or other documented goals-of-care restriction, because care-goal context is not an input to evaluation or routing → the system is **technically correct by the rule and clinically wrong for this patient** → distress to patient and family, intervention contrary to documented wishes, moral distress in staff, and erosion of clinician trust in every other alert the system raises | P5/P6 | **E4** (INFERENCE) from `pathway-portfolio/candidate-inventory.md` §5 PH-12 and `g2-validation-backlog.md` §3.3; **E1** `intended-use-statement.md:227-242` (palliative, obstetric, ECMO/CRRT and post-cardiac-surgical sub-populations are recorded as **neither included nor excluded** — so this is *not* an intended-use violation today and cannot be folded into HAZ-0036); **E3** `PROMPT:127` (clinical decision authority stays with accountable humans), `PROMPT:324` (alert burden and overlap constrain the portfolio) | S3 | L4 | Undesirable | SAF-0041, SAF-0035, SAF-0022, SAF-0017, SAF-0023 | OPEN | UNASSIGNED — VALIDATION REQUIRED |

---

## 4. Coverage check against `PROMPT:750-764`

Every failure mode the prompt requires to be addressed maps to at least one seeded hazard.

| Prompt §13 item (`PROMPT:753-764`) | Hazards |
|---|---|
| wrong patient/encounter/tenant/unit association | HAZ-0001, HAZ-0002, HAZ-0003, HAZ-0004 |
| missing/stale/invalid/conflicting/corrected data | HAZ-0005, HAZ-0006, HAZ-0008, HAZ-0032, HAZ-0039 |
| duplicate, delayed, reordered, replayed, or lost input/event/command | HAZ-0009, HAZ-0010, HAZ-0011, HAZ-0012, HAZ-0016 |
| cross-tenant access and inference | HAZ-0003, HAZ-0013 |
| excessive privilege, issuer confusion, token leakage, fail-open identity | HAZ-0014, HAZ-0018 |
| PHI in logs, prompts, traces, queues, caches, exports, backups | HAZ-0028 |
| unsafe rule activation, rollback failure, version drift, no-fire opacity, suppression | HAZ-0019, HAZ-0020, HAZ-0021, HAZ-0022 |
| missed, duplicated, delayed, misrouted, never-displayed alerts | HAZ-0015, HAZ-0016, HAZ-0017, HAZ-0018 |
| concurrent human actions and ambiguous responsibility | HAZ-0023, HAZ-0024, HAZ-0033 |
| integration outage, terminology drift, MPI merge/unmerge, clock skew, correction | HAZ-0025, HAZ-0032, HAZ-0027, HAZ-0026, HAZ-0008 |
| supply-chain compromise, secret/key loss, artifact substitution | HAZ-0019, HAZ-0013, HAZ-0028, HAZ-0031, HAZ-0034 — via THR-0050..THR-0056; **G-1 closed by linkage** |
| backup corruption, failed restore, partial outage, reconciliation after downtime | HAZ-0034, HAZ-0042 |
| MCP/AI prompt injection, exfiltration, unsafe tool chaining, ungrounded output | HAZ-0029, HAZ-0041 |
| *(task packet)* batch-latency mismatch with seconds-level alerting | HAZ-0030 |
| *(task packet)* tests passing while validating nothing | HAZ-0031 |
| *(task packet)* alert suppression opacity | HAZ-0022 |
| *(task packet)* integration outage and stale-feed opacity | HAZ-0025 |
| *(prompt §7.6)* AMH DQ vs V2 evaluation status collapse | HAZ-0040 |
| *(portfolio §3.3)* premature admission → permanent `not_evaluated` read as quiet | HAZ-0043 |
| *(portfolio §3.3)* escalation contrary to documented goals of care | HAZ-0044 |

### Declared coverage gaps

- **G-1 — supply chain. CLOSED BY LINKAGE, 2026-08-15.** Supply-chain compromise,
  secret/key loss, malicious dependency, and artifact substitution (`PROMPT:762`) were
  deliberately unseeded in Wave 1, because assigning clinical severity to them before a
  threat model existed would have been fabrication. The Wave 2 healthcare threat-model
  specialist returned THR-0050..THR-0056, each linked into an existing hazard row whose
  *clinical* harm pathway it reaches: HAZ-0019 (unratified clinical logic executes via the
  build system), HAZ-0013 (in-process code defeats storage-level tenant isolation),
  HAZ-0028 (exfiltration from inside the trust boundary), HAZ-0031 (false-green gate
  arriving adversarially rather than by neglect), HAZ-0034 (key loss as restore failure).
  **What "closed" means here, precisely:** the *coverage* gap is closed — no required
  failure mode is now unrepresented. It does **not** mean the supply chain is controlled,
  and **no per-threat clinical severity has been assessed**. The threat model states it
  supplies linkage only (`threat-model.md` §9.2). Assessing whether these THR paths change
  any S/L value remains this owner's act and is **VALIDATION REQUIRED** before G6.
- **G-2 — pathway-specific hazards. PARTIALLY CLOSED 2026-08-15; per-pathway portion STILL
  OPEN.** False-positive/false-negative harm, alert burden per patient-day, and
  subgroup/equity risk are **per-pathway** and cannot be stated before a pathway portfolio
  is approved (`PROMPT:280`, `PROMPT:319-322`). The pathway portfolio optimizer has
  delivered twelve candidate hazards **PH-01..PH-12**:
  - full condition→event→harm statements: `pathway-portfolio/candidate-inventory.md` §5;
  - integration rules and the portfolio-level argument:
    `pathway-portfolio/g2-validation-backlog.md` §3.1–§3.3 (integration tracked there as
    `G2-VAL-0005`).

  **Disposition (this owner's act, 2026-08-15).** The specialist's §3.3 argument is
  **accepted**: PH-10/PH-11/PH-12 are hazards of the *portfolio decision itself*, not of any
  pathway, and my original "one hazard row per admitted pathway" rule would have dropped
  them precisely when they matter most — before admission. PH-10 is the sharpest case: its
  harm is *caused by* premature admission, so deferring it until after admission defeats its
  purpose. Accordingly:
  - **PH-10 → minted as HAZ-0043** (portfolio-level). Existing rows cover only fragments:
    HAZ-0039 is the *data* level (a source is empty), HAZ-0025 is the *transition* level (a
    feed that was healthy degrades). Neither covers a pathway that was **never** capable of
    evaluating and whose permanent `not_evaluated` state becomes habituated into reassuring
    quiet. That gap is real and is now a row.
  - **PH-11 → mapped to HAZ-0036, not minted.** HAZ-0036's condition already reads
    "…or evaluates a population/setting outside the approved intended use → the intended use
    silently expands", with SAF-0035 as its control. PH-11 supplies a *mechanism* for that
    condition (population gating unenforceable because no trusted age source exists), not a
    new harm. Minting would duplicate a row and split its evidence. HAZ-0036's evidence cell
    now carries the PH-11 pointer.
  - **PH-12 → minted as HAZ-0044** (portfolio-level). Not covered anywhere: the alert is
    *correct by the rule* and *wrong for this patient*, which no existing row states.
    Note it is **not** an intended-use violation today — `intended-use-statement.md:227-242`
    records palliative and treatment-limitation sub-populations as **neither included nor
    excluded** — so folding it into HAZ-0036 would have asserted an exclusion nobody approved.
  - **PH-01..PH-09 remain unminted, deliberately.** Each specialises a generic row that
    already exists (e.g. PH-08 → HAZ-0005/0021/0022/0040; PH-09 → HAZ-0005/0025), and a
    per-pathway hazard is only meaningful once its pathway is admitted — every candidate
    currently fails at least one hard gate. This log gains one row per **admitted** pathway
    at G2. Until then `candidate-inventory.md` §5 is the authoritative source for them.

  *(Historical note: when this gap was first updated earlier on 2026-08-15,
  `g2-validation-backlog.md` was referenced by sibling portfolio documents but did not yet
  exist on disk, and this entry recorded that as a discrepancy. The file was written at
  00:45 by the pathway specialist's resumed run. **The discrepancy is resolved; the file
  exists.** The note is retained only to explain the earlier pointer.)*
- **G-3 — no V2 design hazards.** Hazards arising from V2's *actual* architecture cannot
  exist yet. This log must be re-run as a SWIFT pass against the ratified architecture at
  G4 (`safety-plan.md` §6.5).

### Row-widening decisions (threat-model §9.3), 2026-08-15

The threat-model specialist correctly declined to mint HAZ IDs and referred two threats to
this owner. **Both referrals accepted; both resolved by minting a new hazard rather than
widening an existing row.**

| Referral | Decision | Rationale |
|---|---|---|
| **THR-0041** fabricated alert via a legitimate-looking external channel | **New hazard HAZ-0041** (P5). Rejected widening HAZ-0015/0018/0029 | HAZ-0015 (never displayed) and HAZ-0018 (misrouted) are **omission** hazards — the harm is that a real alert fails to arrive. THR-0041 is a **commission** hazard — the harm is that an *unreal* alert does arrive. The harm pathway is different (unnecessary intervention plus diversion of response capacity away from a genuinely deteriorating patient), and so is the barrier family: message provenance and channel authentication, plus the rule that a notification is never authoritative (SAF-0038), rather than delivery-durability controls. Widening HAZ-0029 was rejected because HAZ-0029's condition is scoped to **AI/MCP-generated** text; a spoofed SMS involves no model at all, so folding it in would misattribute the causal path and let the hazard wrongly inherit the MCP control set. Folding a commission hazard into an omission row would hide it — the collapse §6.1 of `safety-plan.md` exists to prevent. **The half of THR-0041 that *is* an omission** ("provider acceptance is not human receipt") stays with HAZ-0015 under SAF-0016. |
| **THR-0058** deliberate destruction with backups in the same blast radius | **New hazard HAZ-0042** (P0/P7). Rejected widening HAZ-0034 | HAZ-0034's harm is a **silently incomplete or divergent** record after an outage — the clinician does not know what is missing. THR-0058's harm is **total unavailability of the record during active care, with no recovery path** — the clinician knows exactly what is missing, namely everything. Different harm, different severity (S5 vs S4), different barrier family (immutability and blast-radius/credential isolation vs restore-integrity and reconciliation), and a different precondition (adversarial/insider action vs neglect). Widening HAZ-0034 would have made one row carry two severities and two barrier families, which defeats the single-barrier and common-cause checks in `safety-requirements.md` §I. |

Both new hazards are **PROPOSAL**, evidence grade **E4 (inference)**, status **OPEN**,
owner **UNASSIGNED — VALIDATION REQUIRED**, and tagged `joint` — they originate in
adversarial analysis and must be reviewed in a joint hazard/threat session
(`safety-plan.md` §5.4). Both required a new safety requirement, per the rule that a
hazard with no `SAF` child is an analysis defect (`safety-plan.md` §8): **SAF-0038**
(notification channels are non-authoritative and authenticated) and **SAF-0039** (backup
immutability and blast-radius isolation).

**Likelihood note (INFERENCE, VALIDATION REQUIRED):** both are proposed at **L2 (remote)**
— lower than most rows in this log — because they require deliberate adversarial action
rather than the ordinary neglect that drives the rest of the log, and because V2 has no
deployed attack surface to estimate against. The threat model rates both **P1**. A P1
threat priority and an L2 clinical likelihood are not in conflict: they measure different
things (attacker-facing priority vs. clinical-harm frequency). Neither is sign-off.

## 5. What this log does NOT establish

1. No hazard here is closed, verified, or accepted.
2. No severity here is signed off. S/L values are PROPOSAL triage estimates
   (`safety-plan.md` §6.3) and carry the explicit warning that V2 has no code to measure.
3. `Unacceptable` in the Class column does **not** block anything by itself; blocking
   happens at G6 through named human acceptance (`PROMPT:770-772`).
4. Legacy occurrence (E1) is evidence that a failure mode is *reachable in this domain*.
   It is **not** evidence about V2, and it must not be used to argue V2 is safe merely
   because V2 is greenfield.
