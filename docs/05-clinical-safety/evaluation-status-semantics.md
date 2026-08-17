---
id: EVAL-STATUS-SEMANTICS-V2
title: V2 Evaluation Status Semantics (valid | partial | not_evaluated | stale | invalid)
label: PROPOSAL
statement: >
  Proposed normative semantics for the five V2 clinical evaluation states, the hard rule
  that AMH source data-quality status is a separate dimension that must never be collapsed
  into them, and the obligation to publish and test an explicit mapping matrix between the
  two dimensions. PROPOSAL only — requires clinical ratification before any rule depends on it.
provenance:
  source_repo: intensicare-V2
  path_or_url: docs/05-clinical-safety/evaluation-status-semantics.md
  commit_sha_or_version: uncommitted (working tree at cb35521)
  section_or_lines: whole document
  date_collected: 2026-08-14
  collector: clinical safety-case engineer (Wave 1 specialist agent)
  transformation: >
    Vocabulary taken verbatim from PROMPT:39 and PROMPT:500; two-dimension rule and mapping-matrix
    obligation from PROMPT:497-502 and PROMPT:102; semantics proposed by this agent.
  confidence: medium
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  requirements: [SAF-0001, SAF-0002, SAF-0003, SAF-0004, SAF-0005, SAF-0006, SAF-0032, SAF-0033]
  hazards: [HAZ-0005, HAZ-0006, HAZ-0021, HAZ-0032, HAZ-0038, HAZ-0039, HAZ-0040]
  adrs: []
  tests: []
  pr: null
supersedes: null
superseded_by: null
---

# V2 Evaluation Status Semantics — PROPOSAL

> **PROPOSAL. Not ratified.** These semantics determine what a clinician is told about
> whether a patient was assessed. No rule, API, projection, or UI may depend on them until
> a named clinical authority ratifies them (`safety-plan.md` §4). The definitions below are
> this agent's proposal; the *vocabulary* is prescribed by the orchestrator prompt.

## 1. Why this document exists before any code

SOURCE (`PROMPT:551`): architecture principle 1 — **"Safety state precedes severity."**

SOURCE (`INTENSICARE_TECHNICAL_ASSESSMENT.md:478`): in the
predecessor, missing inputs produced a numeric `0` that was persisted and could drive a
`normal` bed state — "The metadata **is not elevated into an evaluation-status contract**.
This is a confirmed violation of documented intent and the most serious clinical safety
defect in the repository."

SOURCE (`LEGACY-TA:869`): the assessment's own recommendation — "Make the
data-quality/evaluation-status contract the **first successor specification**; it affects
ingestion, algorithms, API, UI, alerts, analytics, and studies."

INFERENCE: the legacy defect was not a scoring bug. The scorers computed what they were
asked to compute. The defect was the **absence of a type in which "we did not assess this
patient" could be expressed**, so absence was rendered in the only available type — a
number — and a number in a severity model means "low risk". Therefore this specification's
primary requirement is not a validation rule; it is an **algebra in which the unsafe
statement is unrepresentable** (SAF-0001, SAF-0002).

### Provenance of the vocabulary — recorded honestly

The five-state vocabulary is prescribed at `PROMPT:39` and `PROMPT:500`. Its origin is
`LEGACY-TA:646`, where it appears as a **remediation recommendation** in finding IC-002:

> "introduce `evaluation_status` (`valid`, `partial`, `not_evaluated`, `stale`, `invalid`)…"

INFERENCE, and **VALIDATION REQUIRED**: the vocabulary is therefore an assessor's proposed
remediation that the orchestrator prompt adopted — not a clinically ratified standard and
not an external-standard term set. It is fit for purpose as a starting point, and its
sufficiency for the approved pathways must be confirmed by clinical governance (e.g. is a
distinct `conflicted` state needed, given `PROMPT:672` lists `conflicted` among required UI
states?). See §7 open questions.

## 2. What an evaluation status is — and is not

**Definition (PROPOSAL):** an *evaluation status* is a statement about the **epistemic
standing of one evaluation of one subject by one rule version at one instant** — i.e.
whether the system was able to reach a clinically meaningful conclusion, and if not, why.

It is **not**: a severity; a data-quality score; a confidence score; a probability; a
source health indicator; or a UI hint. It is a precondition for reading anything else.

**Hard ordering rule (PROPOSAL, from `PROMPT:551`):** severity, score value, priority, and
bed colour are **only readable when status is `valid`, or `partial` within an approved
partial policy**. In every other status the consumer MUST render the status and MUST NOT
render a severity as though it were assessed.

## 3. The five states

Each state below gives: definition, entry conditions, what the clinician must be told,
what the system must NOT do, and the linked hazards.

### 3.1 `valid`
**Definition:** all inputs required by the rule version were present, within their freshness
windows, of acceptable source quality, correctly unit- and code-mapped, and attributable to
the correct subject and encounter — and the rule executed to completion.

- **Entry:** completeness policy satisfied in full (SAF-0003); every input within window
  (SAF-0004); no quarantined input; identity and encounter resolved (SAF-0009).
- **Clinician is told:** the result, its severity, the inputs used, their source times, and
  the rule version.
- **MUST NOT:** be assigned because the source system reported `valid` data quality — that
  is a different dimension (§5). MUST NOT be assigned when any required input is absent,
  regardless of how low the resulting number would be.
- **Hazards:** HAZ-0005, HAZ-0040.

### 3.2 `partial`
**Definition:** the rule executed under an **explicitly approved** partial-evaluation policy
with a defined subset of inputs, and the result is clinically meaningful *only within the
bounds that policy declares*.

- **Entry:** the rule version declares a partial policy (SAF-0003), the available inputs
  satisfy that policy, and the policy has an independent clinical approver.
- **Clinician is told:** the result, **which inputs were missing**, the direction of
  uncertainty the policy declares (e.g. "this result can only be an underestimate"), and
  that it is partial.
- **MUST NOT:** exist without an approved policy. Absent a declared partial policy, the
  correct state is `not_evaluated`, **never** `partial` and never a silently reduced score.
  MUST NOT be silently upgraded to `valid` by any consumer, projection, or export.
  MUST NOT be used to redefine the clinical rule (`PROMPT:418`: "If only a safe subset of a
  pathway can be evaluated, define it as a separately evidenced pathway or return
  `partial`/`not_evaluated`; never silently alter the clinical definition").
- **Hazards:** HAZ-0005, HAZ-0036.

### 3.3 `not_evaluated`
**Definition:** the system did not reach a clinical conclusion. This is the **honest default**
and the safe fallback for every unhandled condition.

- **Entry (non-exhaustive):** a required input is absent; no partial policy applies; identity
  or encounter is unresolved (HAZ-0038); the subject is outside the approved population or
  setting (SAF-0035); the rule bundle is killed, rolling back, or failed to load (SAF-0021);
  a required source is empty or fully null (HAZ-0039); a dependency is unavailable.
- **Clinician is told:** that no assessment exists, **the reason**, and what would be needed
  (e.g. which measurement is missing). A `not_evaluated` bed must be counted in its own
  category on every roll-up (SAF-0006).
- **MUST NOT:** be rendered as `normal`, low severity, zero, blank, or absent from a list.
  MUST NOT be silently omitted from a queue or aggregate — omission reads as "nothing to
  see". MUST NOT be produced without a machine-readable reason (SAF-0019).
- **Hazards:** HAZ-0005, HAZ-0021, HAZ-0038, HAZ-0039.

**PROPOSAL — the fallback rule:** any condition not explicitly covered by this
specification resolves to `not_evaluated` with reason `unspecified_condition`, and that
occurrence is itself an operational signal. There is no "unknown → assume fine" path.

### 3.4 `stale`
**Definition:** an evaluation was produced, but one or more of its inputs is now outside its
clinically valid freshness window, so the conclusion may no longer describe the patient.

- **Entry:** computed from preserved **source clinical time** against the trusted evaluation
  clock (SAF-0004, SAF-0010) — never from receipt time or row order.
- **Clinician is told:** that it is stale, the age of the oldest contributing input, and the
  last time the patient was validly assessed.
- **MUST NOT:** be inferred from source data-quality status. MUST NOT quietly persist as
  `valid` because it was `valid` when computed — staleness is a function of *now*, so
  status MUST be recomputed on read/display, not frozen at write. MUST NOT be presented
  identically to `valid` with only a timestamp difference (`LEGACY-TA:330`: a clinician may
  see the timestamp and still not perceive the state).
- **Hazards:** HAZ-0006, HAZ-0010, HAZ-0026, HAZ-0030.

**PROPOSAL — `stale` vs `not_evaluated`:** staleness is graded per rule version. Beyond a
declared *expiry* horizon (distinct from the staleness threshold), the evaluation MUST
transition from `stale` to `not_evaluated`, because an arbitrarily old conclusion is not a
degraded conclusion — it is no conclusion. Both thresholds are clinical parameters:
**VALIDATION REQUIRED**; this agent proposes no numbers.

### 3.5 `invalid`
**Definition:** an input or the evaluation itself violates a correctness constraint, so the
result cannot be trusted at all — as distinct from being merely incomplete or old.

- **Entry (non-exhaustive):** a value physiologically impossible or outside the accepted
  range; an unmappable code or unit (HAZ-0032); an implausible or contradictory timestamp
  (HAZ-0026); a quarantined source value; conflicting simultaneous values with no resolution
  policy; a bundle whose signature or content hash fails verification; an internal
  evaluation error.
- **Clinician is told:** that the evaluation is not usable, the reason, and what the last
  trustworthy assessment was.
- **MUST NOT:** be downgraded to `partial` by dropping the offending input — that converts a
  detected data-integrity problem into a silently reduced assessment. MUST NOT be retried
  into `valid` without the underlying input actually being corrected. MUST NOT be discarded:
  an `invalid` evaluation is a durable, auditable event (SAF-0019, SAF-0023).
- **Hazards:** HAZ-0008, HAZ-0026, HAZ-0032.

### 3.6 Summary and safe-default ordering

| Status | Clinical conclusion exists? | Severity readable? | Safe default when uncertain |
|---|---|---|---|
| `valid` | Yes, complete | Yes | — |
| `partial` | Yes, bounded by approved policy | Yes, **with declared bounds** | Downgrade to `not_evaluated` if no policy |
| `stale` | Was reached, may no longer hold | **No** — show age and last valid | Downgrade to `not_evaluated` past expiry |
| `not_evaluated` | No | **No** | **This is the safe default** |
| `invalid` | No, and inputs are untrustworthy | **No** | Prefer over `partial` when integrity is in doubt |

**PROPOSAL — resolution precedence when several conditions hold simultaneously:**
`invalid` > `not_evaluated` > `stale` > `partial` > `valid`. Rationale (INFERENCE): the
precedence orders from *least* to *most* reassuring, so that no combination of conditions
can produce a more reassuring state than its worst component. This is the
status-level analogue of SAF-0006. **VALIDATION REQUIRED** — clinical governance may
justifiably prefer surfacing `stale` over `not_evaluated` in some workflows, since "stale"
carries more information; that is a clinical judgement, not an engineering one.

## 4. Non-negotiable prohibitions

SOURCE (`PROMPT:119`, non-negotiable rule 7): "Never coerce missing, stale, invalid,
partial, conflicting, or unevaluable clinical data to zero, normal, no-risk, or silent
no-fire."

Restated as testable prohibitions (each maps to a `SAF`):

| # | Prohibition | Control |
|---|---|---|
| P-1 | No numeric, categorical, or "last known" default may substitute for a missing input | SAF-0002 |
| P-2 | No clinical value may exist without a status field | SAF-0001 |
| P-3 | No aggregate may be more reassuring than its least-evaluated member | SAF-0006 |
| P-4 | No status may be assigned from source data-quality status | SAF-0032 |
| P-5 | No no-fire may occur without a recorded machine-readable reason | SAF-0019 |
| P-6 | No status may be lost in a projection, cache, export, notification, or UI cell | SAF-0001, SAF-0005 |
| P-7 | No consumer may upgrade a status (`partial`→`valid`, `stale`→`valid`) | SAF-0001 |
| P-8 | No unevaluated subject may be omitted from a queue or count | SAF-0006 |

**Verification obligation (SAF-0002):** the **absent-input probe** — call every
value-producing function, endpoint, projection, and aggregate with inputs absent, stale,
and invalid, and assert the output is never `0`, `normal`, `no-risk`, blank, or absent.
This is a *blocking* gate (SAF-0030), because the legacy defect was found exactly this way
(`LEGACY-TA:469-478`) and would have been caught by it on day one.

## 5. The two-dimension rule — AMH data quality is NOT V2 evaluation status

### 5.1 The rule

SOURCE (`PROMPT:497-502`):

> "Keep two independent status dimensions throughout mapping: **source data quality**,
> including AMH `valid | warning | quarantined`; and **V2 evaluation status**, including
> `valid | partial | not_evaluated | stale | invalid`. Define an explicit mapping matrix but
> **never collapse the dimensions**. A source marked `valid` can still be stale or
> insufficient for a pathway; a quarantined source must not become a normal V2 value."

SOURCE (`PROMPT:102`): "The AMH data-quality vocabulary is only `valid | warning |
quarantined`. It must not be conflated with IntensiCare's clinical evaluation states…"

**NORMATIVE (PROPOSAL):**

1. Source data quality and V2 evaluation status are **separate persisted fields** on
   separate entities: data quality belongs to the **source fact**; evaluation status belongs
   to the **evaluation record**. They MUST NOT share a column, an enum, or a name.
2. The token `valid` appears in **both** vocabularies with **different meanings**. This
   collision is a live hazard (HAZ-0040). PROPOSAL: V2 code and schemas MUST qualify the
   names — e.g. `source_data_quality` ∈ {`amh_valid`, `amh_warning`, `amh_quarantined`} and
   `evaluation_status` ∈ {`valid`, `partial`, `not_evaluated`, `stale`, `invalid`} — so that
   no expression can compare or assign across the two.
3. Neither dimension may be **derived** from the other by default. A mapping matrix
   constrains what an evaluation *may* be given a source quality; it never determines it.
4. A **third** dimension exists and must also not be collapsed: *identity/encounter
   attribution confidence* (HAZ-0038 — a resource that parses may still lack encounter
   context). PROPOSAL: model it explicitly rather than folding it into either dimension.

### 5.2 The mapping-matrix obligation

SOURCE (`PROMPT:497-502`) requires an explicit mapping matrix. PROPOSAL for its shape —
the matrix constrains the *permitted* evaluation statuses for a given source quality; the
actual status is determined by the rule version's completeness and freshness policies.

| AMH source data quality | Permitted V2 evaluation statuses | Prohibited | Note |
|---|---|---|---|
| `valid` | `valid`, `partial`, `not_evaluated`, `stale`, `invalid` | — | **Upstream validity constrains nothing downstream.** A `valid` source can be stale, insufficient for the pathway, wrongly attributed, or physiologically impossible for this patient. |
| `warning` | `partial`, `not_evaluated`, `stale`, `invalid` | **`valid`** | PROPOSAL: a `warning` input MUST NOT yield a fully `valid` evaluation, and the warning MUST be surfaced. Whether it yields `partial` or `not_evaluated` is per-rule-version and clinically ratified. |
| `quarantined` | `not_evaluated`, `invalid` | **`valid`, `partial`, `stale`** | SOURCE `PROMPT:502`: "a quarantined source must not become a normal V2 value". A quarantined input MUST NOT contribute to any result. |
| *absent / unknown quality* | `not_evaluated`, `invalid` | **`valid`, `partial`** | INFERENCE: unknown provenance quality is not evidence of good quality (`PROMPT:414`). |

**Obligations attached to the matrix (PROPOSAL):**

1. It MUST be versioned, published, and pinned alongside the AMH contract manifest
   (`PROMPT:453-466`).
2. It MUST be **exhaustively tested** — one test per cell, including the prohibited
   combinations as negative tests. A prohibited combination reaching a clinical consumer is
   a release blocker.
3. It MUST be extended, not overwritten, when AMH adds a data-quality code; an unrecognised
   source quality code resolves to the *absent/unknown* row (fail safe), never to `valid`.
4. It MUST be re-verified at each pinned AMH commit (`PROMPT:508`), because AMH's own
   documentation states several principles are not yet fully sustained by implementation
   (`PROMPT:94`).
5. Loss accounting: where the anti-corruption layer cannot represent a source quality
   distinction, that loss MUST be recorded, not silently normalized (`PROMPT:482`,
   `PROMPT:495`).

### 5.3 Worked cases (PROPOSAL, illustrative)

| Case | Source quality | Freshness | Completeness | Proposed evaluation status |
|---|---|---|---|---|
| All required vitals present, recent, clean | `amh_valid` | in window | complete | `valid` |
| All present and clean, oldest input past window | `amh_valid` | out of window | complete | `stale` |
| All present and clean, past expiry horizon | `amh_valid` | expired | complete | `not_evaluated` (reason `expired`) |
| Respiratory rate absent, no partial policy | `amh_valid` | in window | incomplete | `not_evaluated` (reason `missing_required_input:rr`) |
| Respiratory rate absent, approved partial policy exists | `amh_valid` | in window | incomplete | `partial` with declared bounds + missing-input list |
| One input flagged upstream | `amh_warning` | in window | complete | `partial` **or** `not_evaluated` per rule version — never `valid` |
| One required input quarantined upstream | `amh_quarantined` | in window | complete | `not_evaluated` (reason `quarantined_input`) |
| Value physiologically impossible | `amh_valid` | in window | complete | `invalid` |
| Unit string unmappable | `amh_valid` | in window | complete | `invalid` (reason `unmappable_unit`) — **not** dropped to `partial` |
| Encounter reference absent (ingestion skew) | `amh_valid` | in window | complete | `not_evaluated` (reason `unresolved_encounter`) |
| Source table empty / business columns 100% null | `amh_valid` | n/a | no data | `not_evaluated` (reason `source_empty`) — **never** "no findings" |
| Rule bundle killed / rolling back | any | any | any | `not_evaluated` (reason `rule_unavailable`) — **never** silent no-fire |

The last four rows are the cases the legacy system and the AMH evidence show are most
likely to be silently misread as reassurance (`LEGACY-TA:469-478`; `PROMPT:103`;
`PROMPT:105`).

## 6. Downstream obligations

| Surface | Obligation |
|---|---|
| Domain model | Status is part of the evaluation type; an unstatused result is unconstructible (SAF-0001) |
| Persistence | Status, reason code, and contributing-input inventory persisted immutably with the evaluation record (SAF-0019) |
| API / events | Status and reason are required fields; no nullable-status response; status never inferred client-side (`PROMPT:665`) |
| Projections / caches | Status recomputed for time-dependent states (`stale`) rather than frozen; never dropped for storage efficiency |
| UI | Each of the five states is visibly distinct, non-color-only, and announced accessibly (SAF-0005, SAF-0034; `PROMPT:667-675`) |
| Alerting | A no-fire records its reason; suppression is transparent (SAF-0019, SAF-0022) |
| Analytics / outcomes | `partial`, `stale`, `not_evaluated`, and `invalid` evaluations MUST NOT be pooled with `valid` ones — doing so produces the "polluted outcome datasets… unsafe alarm-performance claims" of `LEGACY-TA:644` |
| pt-BR presentation | Clinical wording for each state validated with pt-BR clinicians (`PROMPT:692`) — `LEGACY-TA:330` shows the legacy design standard already used `não avaliado`; wording is **VALIDATION REQUIRED**, not a translation exercise |

## 7. Open questions — VALIDATION REQUIRED

None of these may be closed by an agent.

1. **Is a distinct `conflicted` state needed?** `PROMPT:672` lists `conflicted` among
   required UI data states, while `PROMPT:39`'s evaluation vocabulary has five members. This
   proposal maps unresolved conflict to `invalid`; that may be wrong for the clinician.
   *Owner:* clinical governance + interaction-state designer.
2. **Freshness and expiry thresholds per input and per pathway.** No numbers are proposed
   here deliberately. *Owner:* clinical evidence methodologist + clinical owner
   (`LEGACY-TA:999`).
3. **Which components invalidate versus degrade each score**, i.e. where the `partial`/
   `not_evaluated` boundary sits per pathway. *Owner:* clinical approver (`LEGACY-TA:999`).
4. **Is `partial` clinically safe to display at all**, or does it invite anchoring on an
   incomplete number? *Owner:* alerting human-factors specialist; requires simulation
   evidence (evidence slot E-5.6).
5. **Precedence order** in §3.6 — engineering-conservative, may not be clinically optimal.
   *Owner:* clinical governance.
6. **Does the five-state vocabulary suffice** for the approved pathway portfolio once it
   exists? *Owner:* clinical safety owner + portfolio optimizer.
7. **AMH data-quality code stability** — whether `valid | warning | quarantined` is
   contractually stable at the execution commit and how additions are notified.
   *Owner:* AMH contract-publication steward (`PROMPT:508`).

## 8. Status of this document

PROPOSAL. Owner UNASSIGNED — VALIDATION REQUIRED. Not ratified, not implemented, not tested.
Ratification of this document is evidence slot **E-5.7** in
`safety-case/safety-case-skeleton.md`, and it gates sub-claim C-5 — the pivotal sub-claim.
