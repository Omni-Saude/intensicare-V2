---
doc_id: QVT-CLINICAL-REFERENCE-VECTOR-STANDARD
status: PROPOSAL
owner: UNASSIGNED — VALIDATION REQUIRED
source: INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §14 ("independent clinical reference vectors, including no-fire reasons"; "missing/stale/invalid/partial/conflict/correction/out-of-order test matrices"), §6.4 (Clinical release package — "reference vectors, properties, boundary cases, and replay corpus"), §9.3 (RuleBundle → RuleVersion/TerminologySnapshot/TestPack/Approval), §3 rules 7/10/12
date_collected: 2026-08-14
collector: Safety-focused test architecture engineer
last_updated: 2026-08-15
---

# IntensiCare V2 — Clinical Reference-Vector Standard

## 0. Status and authority boundary

**PROPOSAL.** This document defines a machine-readable **format**, an **ID scheme**,
and an **authorship-independence rule** for clinical reference vectors. It does
**not**:

- author, approve, or clinically validate any vector's expected outcome (that
  authority is a named qualified clinician, always `UNASSIGNED — VALIDATION
  REQUIRED` in this document — `decisions_prohibited: clinical correctness
  sign-off`);
- select any specific pathway, rule, threshold, or clinical evidence source (that
  is the Clinical pathway portfolio optimizer's and Clinical evidence
  methodologist's work);
- claim that any vector below exists as a ratified, clinically reviewed artifact.
  The one worked example in §7 is explicitly **illustrative only** and must never
  be treated as a real vector.

## 1. Purpose and where vectors are used

A clinical reference vector is a single, independently authored, machine-readable
statement of: *given exactly these inputs, at exactly these times, with exactly
this provenance, a specific `RuleVersion` must produce this exact
`EvaluationRecord` — including, if it does not fire, why not.* Vectors are the
concrete evidence artifact for two required test layers in
`test-strategy.md` §4.2:

- **Layer 4** — independent clinical reference vectors, including no-fire reasons.
- **Layer 5** — missing/stale/invalid/partial/conflict/correction/out-of-order test
  matrices (vectors are how each matrix cell's expected behavior is expressed).

Vectors are also the `TestPack` member of a `RuleBundle`'s release artifact
(`PROMPT:591`: `RuleBundle → RuleVersion/TerminologySnapshot/TestPack/Approval`;
`PROMPT:341`: "reference vectors, properties, boundary cases, and replay corpus" as
a required element of every clinical release package). A `RuleVersion` without a
ratified vector set has no `TestPack` and per `test-strategy.md` §6 cannot enter
actionable production mode.

## 2. Citation shorthand

| Token | Resolves to |
|---|---|
| `PROMPT:n-m` | `/Users/familia/code/intensicare-V2/INTENSICARE_V2_ORCHESTRATOR_PROMPT.md`, lines n–m |
| `DOM-xxxx` | `docs/03-domain/invariants/DOM-invariants.md` |
| `GLOSSARY` | `docs/03-domain/glossary.md` |
| `TIME-SEMANTICS` | `docs/03-domain/time-semantics.md` |
| `STATUS-DIMENSIONS` | `docs/03-domain/status-dimensions.md` |

## 3. `CRV-xxxx` — a proposed extension to the stable-ID taxonomy

`docs/00-governance/traceability-policy.md` §1 lists sixteen prompt-defined
prefixes and, in that same document, records one prior precedent for a steward
extending the taxonomy under its own `decisions_allowed` (the governance-scoped
`EVID`/`ASM`/`GDEC`/`BLK` prefixes, explicitly labeled PROPOSAL pending ADR
ratification). This document proposes the same pattern for clinical vectors,
under this task's own `decisions_allowed: vector format`:

| Prefix | Meaning | Register (proposed, not created) |
|---|---|---|
| `CRV` | Clinical Reference Vector | `docs/12-quality-validation-and-testing/clinical-reference-vectors/catalog.md` (or per-pathway catalogs; location is not decided here) |

**Format:** `CRV-<NNNN>`, sequential, 4-digit, zero-padded, globally unique within
the prefix — identical numbering rule to every other prefix in
`traceability-policy.md` §2. A `CRV-xxxx` ID is permanent once assigned; a retired
or superseded vector is marked `STATUS: SUPERSEDED`/`STATUS: RETIRED`, never
deleted or renumbered, mirroring DOM-0002's provenance-preservation principle
applied reflexively to the vectors themselves.

**Non-authoritative filesystem slug (optional, for human readability only):**
directory/file layout may additionally encode a human-readable slug, e.g.
`clinical-reference-vectors/<pathway-slug>/<rule-version>/CRV-0001-missing-lactate.yaml`.
The slug is never part of the authoritative ID and must never be relied upon by
tooling for identity — only `vector_id: CRV-0001` (inside the file) is
authoritative, matching how `traceability-policy.md` §2 rule 5 requires exact-ID
citation everywhere.

**This extension itself is a PROPOSAL requiring the same ratification path as
`traceability-policy.md`'s prior extension** — it does not bind implementation
until a named authority accepts it (`decision-rights.md`).

**Scribe note (governance-and-traceability steward, 2026-08-15) — per-score
`CRV-<RULE>-<NNNN>` harmonization check, no live reference found here.**
`traceability-policy.md` §1.1 records that `GDEC-0007` (clinical review of the
cycle-1 rule releases) established a per-score prefix for real vectors —
`CRV-SOFA-03NN`, `CRV-NEWS2-01NN`, `CRV-GCS-02NN` — superseding this document's
own bare `CRV-<NNNN>` illustration for those three scores specifically. This
document's own `CRV-0000`/`CRV-0001` mentions (§3, §4.2, §7) were checked
against that composed form and left **unchanged**: every one of them names the
*generic schema placeholder*, not a real SOFA/NEWS2/GCS vector — `CRV-0000` is
explicitly "reserved and permanently retired for illustration," and `CRV-0001`
is the generic sequential-numbering example in the schema comment, neither
tied to any specific score. There is no live reference in this file to
mechanically rename. Future scores that do **not** collide on a numeric range
may still mint plain `CRV-<NNNN>` IDs under this document's own scheme; the
per-score prefix is a namespace-collision remedy recorded in
`traceability-policy.md` §1.1, not a rewrite of this standard's base format.

## 4. The YAML vector format

### 4.1 Design principles

1. **One vector, one expected `EvaluationRecord`.** A vector never asserts two
   independent clinical claims; if a scenario needs two assertions, it is two
   vectors, each independently traceable and independently reviewable.
2. **Every field that could silently default is explicit or explicitly absent.**
   Per DOM-0004/DOM-0009, a vector must never rely on a schema default to stand in
   for a missing source value — if the scenario is "timestamp absent," the field
   is present and explicitly marked absent, not omitted from the YAML.
3. **The format is data, not logic.** A vector never contains executable
   evaluation code; it is inert until a test harness (framework not decided here)
   loads it and asserts the harness's own evaluation output matches.
4. **A vector is unusable as release evidence until its provenance and
   authorship-independence fields are fully populated and its review status is
   `VALIDATED`** (§6). An `UNREVIEWED` vector may still be used to write a
   *failing* test during red/green TDD (§14 steps 3–4), but that test's `passing`
   status can never be cited as clinical evidence per `test-strategy.md` §4.2 row 4.

### 4.2 Full schema (PROPOSAL)

```yaml
# --- Identity and target ---
vector_id: CRV-0001                    # sequential, per §3; assigned at authoring time
title: <short human-readable scenario name>
pathway_id: <CLR-xxxx>                 # the clinical requirement/rule this vector targets
rule_version:
  bundle: <RuleBundle name — not a physical package, a domain concept per GLOSSARY>
  version: <semver, e.g. 1.2.0>
  content_hash: <hash of the signed rule content this vector was authored against>
  status: draft | signed | activated | withdrawn   # mirrors the RuleVersion lifecycle, not decided by this document

# --- Scenario classification ---
scenario_class: typical | boundary | edge | adversarial
boundary_edge_class: []                # zero or more tags from the taxonomy in §5; empty only if scenario_class: typical
description: >
  Free-text clinical narrative: what real (or realistically synthetic) situation
  this vector represents and why it matters. Must be readable by a clinician who
  has not seen the rule implementation.

# --- Tenant/encounter scope (synthetic only — see synthetic-data-strategy.md) ---
context:
  tenant_id: <synthetic, reserved-range identifier>
  encounter_id: <synthetic, reserved-range identifier>
  facility_id: <synthetic>
  care_unit_id: <synthetic>
  bed_id: <synthetic>
  population: adult | pediatric | neonatal              # per PROMPT:256's population-boundary requirement
  data_provenance: synthetic-only                        # mandatory literal value; see synthetic-data-strategy.md

# --- Inputs ---
input_observations:
  - observation_ref: <local id within this vector, for readability>
    code:
      system: <terminology system URI, e.g. LOINC>       # candidate binding; terminology architect owns actual value sets
      value: <code>
      display: <human-readable label>
    value:
      present: true | false            # explicit — a "missing" scenario sets present: false, not an omitted block
      quantity: <number>               # only if present: true and applicable
      unit: <UCUM>                     # only if present: true and applicable; preserved verbatim, never silently converted
      unit_conversion_applied: null | <description>   # explicit if V2 converted the source unit
    time:
      observed: {value: <ISO 8601>, offset: <e.g. -03:00>, precision: <date|minute|second|subsecond>, present: true|false}
      effective: {value: ..., offset: ..., precision: ..., present: true|false}
      issued: {value: ..., offset: ..., precision: ..., present: true|false}
      received: {value: <ISO 8601 UTC>, present: true}   # received time is always present — it is IntensiCare's own clock
      # See TIME-SEMANTICS for full 12-point time model; a vector need only populate
      # the time points relevant to its scenario, but each populated point must
      # carry offset/precision/present exactly as the source would (or explicitly
      # would not) provide, per DOM-0009.
    source_data_quality: valid | warning | quarantined | not_applicable   # AMH-shaped dimension 1, per STATUS-DIMENSIONS — "not_applicable" only for non-AMH sources whose own vocabulary differs
    provenance:
      source_system: <synthetic source system label>
      correction_of: null | <observation_ref of the fact this supersedes>
      conflicts_with: []               # list of observation_ref this value disagrees with, if any
  # repeat per required/optional input the pathway consumes

# --- Expected outcome ---
expected_evaluation_status: valid | partial | not_evaluated | stale | invalid   # exact five values, per STATUS-DIMENSIONS — this document does not redefine them
expected_outcome:
  fires: true | false
  fire_reason: null | <required and non-null if fires: true — which criteria matched, in clinician-readable terms>
  no_fire_reason: null | <required and non-null if fires: false — see §6 taxonomy; NEVER left null when fires: false>
  score_or_criterion_detail: <optional structured detail — e.g. computed score value, matched/unmatched criteria list>
explanation_requirements:
  must_show_inputs_used: true          # per PROMPT:689 — every vector implicitly asserts the explanation surface's minimum content
  must_show_missing_inputs: true
  must_show_rule_version: true
  must_show_source_time_and_freshness: true

# --- Provenance of the clinical expectation (NOT the input data's provenance — this is the expectation's own provenance) ---
clinical_expectation_provenance:
  owner: UNASSIGNED — VALIDATION REQUIRED   # a named qualified clinician; never a role placeholder, never an agent
  evidence_basis: <citation to the clinical guideline/evidence this expected outcome is drawn from — may itself be UNASSIGNED pending the Clinical evidence methodologist>
  reviewed_independently_of_rule_author: false   # MUST be explicitly set true only when §6's independence rule is satisfied and recorded
  review_status: UNREVIEWED | VALIDATION REQUIRED | VALIDATED
  review_date: null
  reviewer: UNASSIGNED — VALIDATION REQUIRED

# --- Authorship independence (see §6) ---
authorship:
  vector_author: UNASSIGNED — VALIDATION REQUIRED
  rule_implementer: UNASSIGNED — VALIDATION REQUIRED
  independence_confirmed: false        # true only when vector_author != rule_implementer AND a named accepter has confirmed it

# --- Lifecycle ---
status: DRAFT | VALIDATION REQUIRED | RATIFIED | SUPERSEDED | RETIRED
supersedes: null
superseded_by: null
last_updated: <ISO date>
```

### 4.3 Field notes

- **`vector_id` is the only authoritative identity.** Filename, directory, and
  `title` are for humans; a test harness must resolve identity by `vector_id`
  alone.
- **`present: false` is not the same as omitting a field.** A vector modeling
  "this required lactate observation never arrived" must include the
  `input_observations` entry with `value.present: false`, not skip the entry
  entirely — an entirely absent entry cannot distinguish "this input does not
  apply to this pathway" from "this input applies and is missing," which is
  exactly the DOM-0004 ambiguity this format exists to prevent.
- **`unit` is always the source unit, never silently normalized in this field.**
  If UCUM normalization happened, `unit_conversion_applied` names it explicitly —
  the vector never hides a unit conversion inside a bare "expected value."
- **`no_fire_reason` is mandatory whenever `fires: false`.** A vector with
  `fires: false` and `no_fire_reason: null` is malformed and must be rejected by
  schema validation before it can be linked to any `TST-xxxx` — see §6 for the
  reason taxonomy.

## 5. Boundary/edge class taxonomy (`boundary_edge_class`)

A vector's `scenario_class: boundary` or `edge` must carry one or more of the
following tags (PROPOSAL; extend only through this document's future revision,
not ad hoc per pathway):

| Tag | Meaning |
|---|---|
| `threshold-exact-match` | An input value equals a rule threshold exactly (not above, not below). |
| `threshold-just-below` | An input value is the smallest representable step below a threshold. |
| `threshold-just-above` | An input value is the smallest representable step above a threshold. |
| `unit-conversion-boundary` | A value near a threshold when expressed in the source unit but not when expressed in the canonical UCUM unit (or vice versa) — proves conversion happens before threshold comparison, not after. |
| `precision-boundary` | The source provided a coarser precision than the rule's window needs (e.g., date-only where hour-level matters), per `TIME-SEMANTICS`. |
| `timezone-offset-boundary` | A source timestamp's offset, if mis-applied, would move the instant across a freshness-window or day boundary. |
| `freshness-window-edge` | An input's age is exactly at, just inside, or just outside its pathway-specific freshness window. |
| `out-of-order-arrival` | A later-effective-time fact is received before an earlier-effective-time fact for the same encounter. |
| `duplicate-delivery` | The same source fact arrives more than once (same idempotency key or equivalent). |
| `correction-supersession` | A correction arrives for a fact already used in a prior evaluation; the vector asserts both the original evaluation's immutability and the new evaluation's correct re-computation, per DOM-0002/DOM-0003. |
| `conflicting-sources` | Two source-derived values disagree for the same clinical fact and neither has been reconciled. |
| `population-exclusion-boundary` | The encounter is exactly at an inclusion/exclusion population edge (e.g., age boundary between adult and pediatric scope). |
| `multi-criteria-combination` | The pathway's fire condition depends on a specific combination of criteria, and the vector isolates a combination that a single-criterion test would not catch. |
| `single-input-missing` | Exactly one required input is absent; all others are present and valid — isolates `partial` vs `not_evaluated` policy. |
| `all-inputs-missing` | Every required input is absent — the direct regression vector for HAZ-0005 (legacy: absent inputs scored as numeric zero). |
| `tenant-encounter-scope-boundary` | An input or context value is scoped to a different tenant/encounter than the evaluation target, exercising DOM-0001. |
| `source-quality-vs-evaluation-status-independence` | A source-`valid` input that must still yield a non-`valid` V2 evaluation status (or vice versa) — the direct regression vector for DOM-0008/HAZ-0040. |

## 6. No-fire reason taxonomy (`no_fire_reason`)

A `fires: false` vector's reason must be one of the following (PROPOSAL; this
taxonomy is what makes DOM-0004's "explicit, never silent" requirement concrete
and machine-checkable):

| Reason code | Meaning | Typical `expected_evaluation_status` |
|---|---|---|
| `criteria_not_met` | Evaluation ran to completion with sufficient, fresh, valid data; the patient's values genuinely did not meet the pathway's fire condition. The only reason code representing a true clinical negative. | `valid` |
| `insufficient_data` | One or more required inputs were absent; evaluation could not reach a determination (or reached only a partial one). | `not_evaluated` or `partial` |
| `stale_data` | Required input(s) were present but aged past the pathway's freshness window. | `stale` |
| `invalid_data` | Required input(s) were present but conflicting, unparseable, or otherwise untrustworthy (including a source-`quarantined` state that the mapping matrix in `STATUS-DIMENSIONS` routes to `invalid`). | `invalid` |
| `out_of_population_scope` | The encounter falls outside the pathway's approved population/exclusion boundary (`PROMPT:291`, hard eligibility gate 1). | `not_evaluated` |
| `suppressed` | The alert fired internally but was explicitly, auditably suppressed per a recorded rule (e.g., known-duplicate suppression) — distinct from every other reason because evaluation *did* determine the condition was met; see `GLOSSARY` "Suppression," which explicitly forbids conflating this with silent no-fire. | `valid` (evaluation succeeded; suppression is a downstream alert-management decision, not an evaluation-status change) |
| `superseded_by_correction` | A correction arrived that changed a prior `fires: true` determination to `fires: false` for the same fact-as-of-instant; the vector must also reference the original vector's `vector_id` it supersedes in spirit (not necessarily in the `supersedes` field, which is for the vector document itself, not the clinical fact). | Depends on the corrected evaluation's own status |

**Rule:** `criteria_not_met` is the *only* reason code that may accompany
`expected_evaluation_status: valid`. Every other reason code implies the
evaluation itself was degraded, incomplete, or overridden — never a silent
"nothing to show." A vector combining `no_fire_reason: criteria_not_met` with any
status other than `valid` is malformed.

## 7. Illustrative example — NOT a real vector

**This example is fictional, unratified, and must never be cited as evidence.**
It exists only to demonstrate the schema in §4.2 concretely.

```yaml
vector_id: CRV-0000                    # CRV-0000 is reserved and permanently retired for illustration; real vectors start at CRV-0001
title: "ILLUSTRATIVE ONLY — single missing required input yields not_evaluated, never zero"
pathway_id: CLR-EXAMPLE-0000           # placeholder — no such requirement exists yet
rule_version:
  bundle: "example-only-pathway"
  version: "0.0.0-illustrative"
  content_hash: "not-a-real-hash"
  status: draft
scenario_class: edge
boundary_edge_class: [single-input-missing]
description: >
  ILLUSTRATIVE. A pathway requiring two inputs (A and B) receives only input A;
  input B never arrives. Demonstrates that the missing input must yield an
  explicit not_evaluated status, never a numeric substitute — the direct
  regression shape of HAZ-0005.
context:
  tenant_id: "synthetic-tenant-0000"
  encounter_id: "synthetic-encounter-0000"
  facility_id: "synthetic-facility-0000"
  care_unit_id: "synthetic-unit-0000"
  bed_id: "synthetic-bed-0000"
  population: adult
  data_provenance: synthetic-only
input_observations:
  - observation_ref: input-a
    code: {system: "EXAMPLE", value: "0000-0", display: "Illustrative input A"}
    value: {present: true, quantity: 1, unit: "1"}
    time:
      observed: {value: "2026-08-14T10:00:00-03:00", offset: "-03:00", precision: second, present: true}
      received: {value: "2026-08-14T13:00:05Z", present: true}
    source_data_quality: valid
    provenance: {source_system: "synthetic-source", correction_of: null, conflicts_with: []}
  - observation_ref: input-b
    code: {system: "EXAMPLE", value: "0000-1", display: "Illustrative input B"}
    value: {present: false}
    time:
      observed: {present: false}
      received: {present: false}
    source_data_quality: not_applicable
    provenance: {source_system: "synthetic-source", correction_of: null, conflicts_with: []}
expected_evaluation_status: not_evaluated
expected_outcome:
  fires: false
  fire_reason: null
  no_fire_reason: insufficient_data
  score_or_criterion_detail: "Input B absent; ILLUSTRATIVE pathway requires both A and B."
explanation_requirements:
  must_show_inputs_used: true
  must_show_missing_inputs: true
  must_show_rule_version: true
  must_show_source_time_and_freshness: true
clinical_expectation_provenance:
  owner: UNASSIGNED — VALIDATION REQUIRED
  evidence_basis: "ILLUSTRATIVE — none; this vector is not clinically real"
  reviewed_independently_of_rule_author: false
  review_status: UNREVIEWED
  review_date: null
  reviewer: UNASSIGNED — VALIDATION REQUIRED
authorship:
  vector_author: UNASSIGNED — VALIDATION REQUIRED
  rule_implementer: UNASSIGNED — VALIDATION REQUIRED
  independence_confirmed: false
status: DRAFT
supersedes: null
superseded_by: null
last_updated: "2026-08-14"
```

## 8. Authorship-independence rule

### 8.1 The rule

**A vector's `authorship.vector_author` must never be the same person as
`authorship.rule_implementer` for the same `RuleVersion`.** This is distinct from,
and additional to, the existing `decision-rights.md` §3 pair 1 ("Rule author ≠
clinical approver"): that pair governs who may *approve* clinical rule content;
this rule governs who may *author the independent test oracle* the rule is judged
against. A single implementer who both writes the rule logic and writes the
vectors it is tested against can (even unintentionally) encode the same
misunderstanding into both, producing a green suite that verifies nothing —
structurally the same failure class as HAZ-0031, applied to authorship rather than
to gate configuration.

### 8.2 Status of this rule

This is a **PROPOSAL** for a new required-independence pair, inferred from
`PROMPT:794` ("independent clinical reference vectors") but not itself one of the
seven pairs explicitly enumerated at `PROMPT:197-207` / `decision-rights.md` §3.
Because `decision-rights.md` is outside this document's write scope, this document
**recommends** — it does not enact — that `decision-rights.md` §3 be amended to add:

| # (proposed) | Implementer / preparer | Must be independent from |
|---|---|---|
| 8 (proposed) | Clinical reference-vector author | `RuleVersion` implementer |

Until that amendment is ratified, this document's own schema (§4.2
`authorship.independence_confirmed`) is the operative control: a vector with
`independence_confirmed: false` may be used only for red/green TDD authoring
(`test-strategy.md` §2 steps 3–4), never cited as clinical release evidence.

### 8.3 Relationship to `clinical_expectation_provenance`

`authorship` (§8.1) and `clinical_expectation_provenance` (§4.2) are deliberately
separate blocks answering different questions: `authorship` asks *"is the person
who wrote this test oracle different from the person who wrote the rule it
tests?"*; `clinical_expectation_provenance` asks *"has a qualified clinician,
independent of the rule's author, confirmed the expected outcome is clinically
correct?"* A vector can satisfy one without the other (e.g., an engineer
independent of the rule author writes a syntactically correct vector whose
clinical expectation is still unreviewed by any clinician). **Both** must be
satisfied — `authorship.independence_confirmed: true` **and**
`clinical_expectation_provenance.review_status: VALIDATED` — before a vector's
`status` may become `RATIFIED`.

## 9. Vector lifecycle and versioning

1. A vector starts `status: DRAFT` the moment it is authored, before any
   clinical or independence review.
2. It becomes `status: VALIDATION REQUIRED` once syntactically complete and
   linked to a `TST-xxxx` for automated execution (`test-strategy.md` §5), but
   before `clinical_expectation_provenance.review_status: VALIDATED` and
   `authorship.independence_confirmed: true` both hold.
3. It becomes `status: RATIFIED` only when both conditions in §8.3 hold and a
   named human records `review_date`/`reviewer`. Only `RATIFIED` vectors count
   toward a pathway's `TestPack` completeness for actionable production mode
   (`test-strategy.md` §6).
4. When a `RuleVersion` changes, every vector referencing the prior version must
   be re-evaluated: either it still applies unchanged (re-linked to the new
   `rule_version.version`/`content_hash` with a recorded confirmation), or it is
   retired (`status: RETIRED`, `superseded_by:` the new vector's ID) and a new
   vector is authored. A vector is never silently carried forward against a new
   `content_hash` without an explicit re-confirmation record — this mirrors
   DOM-0003's determinism guarantee: the vector's own binding to a specific rule
   content hash must be as precise as an `EvaluationRecord`'s binding to a
   specific `RuleVersion`.
5. A vector is never deleted. A vector found to be clinically wrong is marked
   `status: RETIRED` with `superseded_by:` the corrected vector's ID and a
   recorded rationale — this preserves the same audit trail DOM-0002 requires of
   clinical facts, applied to the test oracles that judge them.

## 10. Candidate file location — not created by this document

**PROPOSAL, illustrative only:** vectors likely belong alongside the `RuleBundle`
release artifact they test, e.g.
`docs/05-clinical-safety/rule-releases/<pathway>/<rule-version>/vectors/CRV-xxxx.yaml`,
per the documentation hierarchy's `05-clinical-safety/rule-releases/` node
(`PROMPT:925`). This directory does not exist yet and creating it is outside this
document's write scope (`docs/12-quality-validation-and-testing/` only). The
format standard defined here applies wherever vectors are eventually stored.

## 11. What this document deliberately does not decide

- Any pathway's actual required inputs, thresholds, or clinical logic.
- Any vector's actual expected outcome — every example above is fictional.
- The mutation-testing/property-testing tooling that will load and execute
  vectors (`test-strategy.md` §4.2 already forbids this document from choosing
  one).
- The physical storage location/format for the `CRV` catalog (§10 is illustrative
  only).
- Ratification of the `CRV` prefix extension (§3) or the proposed independence
  pair (§8.2) — both require `decision-rights.md`/`traceability-policy.md`
  amendment by a named authority, not this document.

## Handoff

**Recipient:** first-vertical-slice implementers, and the future Clinical pathway
portfolio optimizer / Clinical evidence methodologist / Deterministic rule-runtime
engineer specialists who will author real vectors against real pathways.

- **OBSERVED:** `PROMPT:341` (clinical release package requires reference
  vectors/properties/boundary cases/replay corpus), `PROMPT:591` (`RuleBundle →
  RuleVersion/TerminologySnapshot/TestPack/Approval`), `PROMPT:794-795` (§14
  layers 4–5), `STATUS-DIMENSIONS` (the five-value evaluation-status vocabulary,
  reproduced verbatim, not redefined), `TIME-SEMANTICS` (the 12-point time model
  this format's `time:` block draws its fields from), `decision-rights.md` §3
  (existing independence pairs, extended by proposal in §8.2 here).
- **CHANGED:** created this document; no other file modified.
- **TESTED:** N/A — no vector in this document is real; the one worked example
  (§7) is explicitly illustrative and reserved (`CRV-0000`) so it can never be
  mistaken for a real ID.
- **NOT TESTED:** the schema itself has not been validated against a real test
  harness or a real pathway because neither exists yet.
- **ASSUMED:** that a YAML format (per the task packet's own suggestion) is
  appropriate; that per-vector independent clinical review is feasible at the
  volume a real pathway portfolio will require (unverified — a future capacity
  question for the Clinical validation biostatistician / clinical owners).
- **DECIDED (proposals only, none binding):** the full YAML schema (§4.2); the
  `CRV-<NNNN>` ID format (§3); the boundary/edge class taxonomy (§5); the no-fire
  reason taxonomy (§6); the authorship-independence rule and its two-condition
  ratification gate (§8).
- **REJECTED:** allowing `no_fire_reason: null` under any `fires: false`
  condition — rejected because it would silently reopen exactly the DOM-0004 gap
  this whole document exists to close; allowing a single independence check
  (author-only or clinical-review-only) to be sufficient for `RATIFIED` status —
  rejected in favor of requiring both (§8.3), since either alone can hide the
  other's gap.
- **LEFT OPEN:** ratification of the `CRV` prefix and the proposed
  vector-author/rule-implementer independence pair; the real storage location for
  vectors; per-pathway vector-count minimums; whether `boundary_edge_class` needs
  pathway-specific extensions once real pathways exist.
