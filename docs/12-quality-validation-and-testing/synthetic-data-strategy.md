---
doc_id: QVT-SYNTHETIC-DATA-STRATEGY
status: PROPOSAL
owner: UNASSIGNED — VALIDATION REQUIRED
source: INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §3 rule 12 (non-negotiable), §14 ("authenticated end-to-end clinical journeys using synthetic data", "synthetic end-to-end safety probes with strict PHI redaction"), §15.1 ("secret scanning and synthetic-data policy from the first commit"), §9.1 principle 12 (minimize PHI collection/movement/display/retention/disclosure)
date_collected: 2026-08-14
collector: Safety-focused test architecture engineer
last_updated: 2026-08-14
---

# IntensiCare V2 — Synthetic-Data Strategy

## 0. Status and authority boundary

**PROPOSAL.** This document operationalizes non-negotiable rule 12 for every test
layer in `test-strategy.md`. It does **not** select a data-generation tool,
library, or framework (`decisions_prohibited`); does not itself approve any
de-identification method as sufficient (that is `AUTH-PRIVACY-LEGAL`'s decision
per `decision-rights.md` §2, row "Privacy/legal basis, LGPD, retention,
residency"); and does not claim any fixture set currently exists (none does — no
V2 source code exists as of this writing).

## 1. The non-negotiable rule, verbatim

SOURCE (`PROMPT:124`, rule 12): "Use synthetic or formally de-identified data in
development and tests. Do not place PHI, credentials, access tokens, patient
identifiers, or raw clinical payloads in prompts, source control, logs, traces,
fixtures, screenshots, tickets, or agent messages."

Two consequences follow directly and are the spine of this document:

1. **Two paths are permitted — synthetic, or *formally* de-identified — and no
   other.** "We copied production data and removed the name" is neither path.
   §2 defines why this document treats "synthetic" as the default and
   "de-identified" as a validation-gated exception, not an equal alternative.
2. **The prohibition on PHI/credentials/tokens/identifiers/raw-payloads names
   eight specific surfaces** — prompts, source control, logs, traces, fixtures,
   screenshots, tickets, agent messages — and is not limited to "the database." A
   synthetic-data strategy that only governs test fixtures and ignores logs,
   traces, screenshots, or agent conversations (this very conversation included)
   does not satisfy rule 12. §7 addresses enforcement across all eight surfaces.

## 2. Citation shorthand

| Token | Resolves to |
|---|---|
| `PROMPT:n-m` | `https://github.com/Omni-Saude/intensicare-V2/blob/main/INTENSICARE_V2_ORCHESTRATOR_PROMPT.md`, lines n–m |
| `HAZ-0028` | `docs/05-clinical-safety/hazard-log.md`, "PHI or identifiers are written to logs, traces, metrics, error bodies, fixtures, screenshots, tickets, agent prompts, or model-provider requests" (`joint`, classified `Undesirable`, S3/L4) |
| `AMH-DOSSIER` | `docs/08-interoperability/amh-data/four-layer-dossier.md` |
| `AMH-INVENTORY` | `docs/08-interoperability/amh-data/contract-inventory.md` |

`HAZ-0028`'s condition list is, almost verbatim, rule 12's surface list — this
strategy is one of `HAZ-0028`'s named candidate controls (`SAF-0026`, `SAF-0027`,
`SAF-0023` per the hazard log) and should be read as such: **failing to follow it
is not merely a policy lapse, it is the direct trigger condition for an open,
`joint`-owned hazard.**

## 3. Why synthetic is the default path, not de-identification

### 3.1 The two paths are not equivalent in risk or in readiness

| | Synthetic | Formally de-identified |
|---|---|---|
| **Origin** | Generated; never derived from a real patient record. | Derived from real patient data by removing/transforming identifiers. |
| **Residual re-identification risk** | None by construction (there is no real underlying person). | Non-zero; depends entirely on the rigor of the method used, the auxiliary data an attacker might combine it with, and how many quasi-identifiers survive. |
| **Legal/privacy basis required to create it** | None beyond the generation process itself being sound. | An LGPD-adequate anonymization/pseudonymization basis, a named privacy authority's approval, and (per rule 12's plain reading) *formality* — not an ad hoc scrub. |
| **Available today** | Yes, in principle, without any external approval. | **No.** No AMH data, and no legacy data, has been through any recorded de-identification process at the time of this writing. `AMH-DOSSIER` records that AMH's own repository claims about its data (11.4M FHIR resources, 386,288 encounters, etc.) are **SOURCE claims about AMH's own real/production-adjacent data**, not de-identified V2 test fixtures — using them as V2 fixtures merely because a claim about their existence was read would repeat the dossier's own named error ("I read the schema and asserted content"). |

### 3.2 Default rule

**Default: fully synthetic, generated data, for every environment except a
future, explicitly gated staging/pilot tier (see `test-environment-design.md`
§4).** De-identification of real data is **not** a substitute default when
synthetic generation is merely inconvenient or slower to build. It is a distinct,
higher-authority path used only when a specific, named need cannot be met by
synthetic data at all (for example: retrospective/prospective clinical validation
requiring real-world outcome distributions, `test-strategy.md` §4.2 layers 15–16)
— and even then, only after §4 below is satisfied.

### 3.3 De-identification requires named privacy-owner approval — VALIDATION REQUIRED

No agent may declare data "de-identified." Per `decision-rights.md` §2 ("Privacy/legal
basis, LGPD, retention, residency" → `AUTH-PRIVACY-LEGAL` decides; agents may only
"draft data map, propose retention schedule" and may not "conclude legal
sufficiency"), every use of formally de-identified data requires, before any such
data enters any test environment:

1. a named `AUTH-PRIVACY-LEGAL` approval of the specific de-identification method
   (e.g., a stated LGPD Art. 12-adequate anonymization standard — this document
   does not itself determine LGPD adequacy, per `safety-plan.md` §9's identical
   posture on regulatory frameworks: "use... only when applicability is
   established");
2. a recorded assessment of residual re-identification risk for the *specific*
   dataset and its *specific* intended test use, not a generic "we de-identified
   it" claim;
3. an entry in `docs/00-governance/registers/decision-register.md` (or the
   privacy program's own register, once it exists) naming the approver, date, and
   scope of approval — the same evidence-notation discipline
   (`evidence-notation.md`) every other DECIDED item in this program requires;
4. the same fixture-versioning and provenance discipline as synthetic fixtures
   (§6), plus an explicit `data_class: formally-de-identified` marker distinct
   from `data_class: synthetic` so no downstream consumer can conflate the two.

**Until all four are satisfied, no de-identified dataset may be used, and the
default synthetic-only rule governs without exception.**

## 4. Generation principles

### 4.1 Structurally realistic

Synthetic fixtures must validate against the same schemas/profiles a real payload
would: FHIR R4 profile conformance (where a fixture represents an AMH-shaped
resource), the relevant OpenAPI/AsyncAPI schema, HL7 v2 message structure, and any
AMH contract shape V2 consumes. A fixture that is structurally sloppy does not
exercise the code paths (validation, quarantine, conformance tests) it exists to
test — an unrealistic fixture silently narrows test coverage exactly as an
advisory gate silently narrows enforcement (`test-strategy.md` §3, HAZ-0031). Per
`AMH-INVENTORY` A6, AMH's own Maezo manifest fixture set (9 fixtures, 3
deliberately invalid) is a useful **pattern** — deliberately including invalid
fixtures alongside valid ones — without reusing Maezo's actual contract or
payload shape (`PROMPT:455`, `PROMPT:476`).

### 4.2 Clinically plausible ranges

A synthetic vital sign or lab value must fall within a physiologically plausible
range for its stated population (adult/pediatric/neonatal, per `PROMPT:256`) —
not because plausibility itself is a clinical decision this document can make
(it explicitly cannot; ranges are `VALIDATION REQUIRED` pending clinical owners),
but because an implausible fixture (e.g., a heart rate of 900) either trivially
passes a threshold rule for the wrong reason or triggers a validation-layer
rejection that masks whether the *clinical* logic being tested actually works. The
source of truth for plausible ranges is the same clinical owner who authors
`clinical-reference-vector-standard.md` vectors — this document does not invent
ranges; it requires that whoever generates fixtures uses ranges a named clinical
owner has supplied or reviewed, not an engineer's guess.

### 4.3 Explicitly impossible-as-real markers

Every synthetic identifier, name, and record must be **structurally
distinguishable from a real one on inspection**, so that its accidental appearance
outside a test environment is immediately detectable — this is a control in its
own right, independent of environment segregation, because environment boundaries
have already been shown fallible elsewhere in this program's evidence base
(`AMH-DOSSIER` Layer 2: documented configuration has "demonstrably diverged from
deployed behavior before").

Required markers (PROPOSAL — exact values are an implementation detail for the
generator, not decided here, but the *properties* below are non-negotiable):

- **Reserved tenant/facility/encounter/patient identifier ranges or namespaces**
  (e.g., a `synthetic-`/`test-` prefix or a reserved numeric block) that can never
  collide with a real identifier issued by any real identity system V2 or AMH
  uses.
- **Reserved names/labels** unambiguously marked as test data (e.g., "SYNTHETIC
  PATIENT — TEST ONLY" as a display name), never a plausible-looking real Brazilian
  name.
- **Brazilian national-identifier formats (CPF) must never use real check-digit
  patterns.** A generated CPF-shaped value must deterministically **fail** the
  official CPF check-digit validation algorithm (e.g., by corrupting the computed
  check digits, or by using one of the publicly known always-invalid repeated-digit
  sequences), so that no generated value can ever collide with, or be mistaken
  for, a real CPF. This document does not specify the check-digit algorithm's
  implementation (no code, no library choice) — only the property every generated
  CPF-shaped value must have: **provably invalid by the standard algorithm, on
  purpose, every time.**
- **Other Brazilian identifier formats (CNS — Cartão Nacional de Saúde; CNPJ for
  synthetic facility/tenant entities) follow the same principle**: structurally
  valid-*looking* for schema/format validation purposes, but deterministically
  failing the real checksum/validation rule where one exists, or drawn from a
  reserved block where no public checksum exists.
- **Reserved sentinel dates** (e.g., a fixed, documented synthetic
  date-of-birth/admission-date pattern) so date-shaped fields are also
  inspectable as synthetic without needing to cross-reference the identifier
  fields.

### 4.4 What this section deliberately does not decide

The exact reserved ranges, prefixes, sentinel values, or check-digit-corruption
method are implementation details for whichever specialist builds the generator
(a future capability-specific implementer, per `PROMPT:195`, not a generic
"tester"). This document fixes the *properties* those choices must satisfy
(distinguishable, provably-invalid-as-real, schema-valid), not the literal
values.

## 5. Relationship to clinical reference vectors

Every `input_observations` entry in a `CRV-xxxx` vector
(`clinical-reference-vector-standard.md` §4.2) is itself synthetic fixture data
and must satisfy §4 above. The vector standard's `context.data_provenance:
synthetic-only` field is the enforcement point: a vector missing that literal
value, or asserting anything else without the §3.3 approval chain, is malformed
and cannot be `RATIFIED`. Conversely, this document does not duplicate the
vector standard's clinical-provenance requirements (who reviewed the *expected
outcome*) — that is `clinical-reference-vector-standard.md` §4.2's
`clinical_expectation_provenance` block, a distinct concern from *how the input
data was generated*.

## 6. Fixture versioning and provenance

### 6.1 Required metadata per fixture set

Every named fixture set (a `CRV-xxxx` vector's inputs, a contract-test fixture
bundle, a load-test dataset, an E2E-journey dataset) carries:

```yaml
fixture_set_id: <stable id, scheme TBD — candidate: reuse CRV-xxxx where the fixture IS a vector's inputs; a separate FIX-xxxx prefix, ADR pending, otherwise>
data_class: synthetic | formally-de-identified
generation_method: >
  Description of how the data was produced (e.g., "hand-authored", "generated
  from a documented value-range table", "property-based generator with fixed
  seed"). No tool/library name is asserted as a decision here — see §6.3.
generator_tool: candidate, ADR pending    # never a final decision in this document
target_schema_or_profile:
  - name: <e.g. Observation-amh-laboratory, OpenAPI path, AsyncAPI channel>
    version: <version/digest>
    pinned_commit: <where applicable, e.g. AMH evidence snapshot commit>
seed_or_determinism: <fixed seed / deterministic-generation reference, so the fixture set is reproducible byte-for-byte>
synthetic_markers_present: true          # confirms §4.3's markers are actually in this fixture set, not merely policy
review_status: UNREVIEWED | VALIDATION REQUIRED | VALIDATED
owner: UNASSIGNED — VALIDATION REQUIRED
date_created: <ISO date>
last_updated: <ISO date>
never_promote_to_production: true        # a literal, checked guard field — see §7.3
```

This mirrors `evidence-notation.md` §3's provenance-block discipline, adapted for
fixtures rather than narrative statements — a fixture is itself a material
artifact and needs the same accountability.

### 6.2 Versioning against consumed contracts

A fixture set that targets an external contract (AMH, FHIR, OpenAPI, AsyncAPI,
HL7 v2, terminology) is pinned to the exact schema/profile version and, where
applicable, the exact upstream commit — mirroring the discipline
`AMH-INVENTORY` A6 documents in AMH's own Maezo manifest pattern (pinned producer
commit, per-artifact digests) without reusing that manifest. When the upstream
contract's pinned commit is re-pinned (per `docs/00-governance/registers/assumptions-register.md`
`ASM-0002`, which already records that the AMH evidence snapshot commit must be
re-pinned at execution time), every fixture set targeting that contract must be
re-validated against the new pin before being trusted again — an un-revalidated
fixture set after a re-pin is exactly the "schema drift... must fail the
pipeline" condition in `test-strategy.md` §6.

### 6.3 No tool/framework decision here

`generator_tool` in §6.1 is explicitly `candidate, ADR pending` in every instance.
This document does not choose a synthetic-data-generation library, a
property-based testing framework, or a fixture-management tool — that selection
belongs to a future ADR with measurable decision drivers (`PROMPT:126`), owned by
whichever engineer builds the first fixture generator.

## 7. Enforcement across all eight named surfaces

Rule 12 names eight surfaces (prompts, source control, logs, traces, fixtures,
screenshots, tickets, agent messages). This document is a strategy, not a control
implementation — each surface's actual enforcement mechanism belongs to a named
future owner, listed here so the obligation is visible and not silently dropped:

| Surface | Enforcement mechanism (candidate, owner TBD) | Owner (candidate) |
|---|---|---|
| Fixtures (test data) | §4–§6 above: generation principles + fixture provenance metadata + review gate. | Whichever implementer builds fixtures for a given capability |
| Source control | Secret scanning "from the first commit" (`PROMPT:844`) plus a synthetic-data-shape linter rejecting PHI-shaped literals outside reserved synthetic markers. | Software supply-chain and CI policy engineer |
| Logs / traces | Structured logging with mandatory field-level redaction for any clinically identifying field; OpenTelemetry-compatible pipelines with "strict PHI redaction" (`PROMPT:612`). | Platform reliability and SRE engineer |
| Screenshots | Screenshot capture (accessibility evidence, UX evidence, agent-produced artifacts) must use synthetic fixtures exclusively; no screenshot may be taken against a real/de-identified environment without the §3.3 approval chain already covering that environment's data. | Accessibility and inclusive-use specialist / Design-system contract engineer, for their respective evidence types |
| Tickets | Process control (issue templates, review checklists) — outside this document's scope. | Release evidence controller |
| Agent messages / prompts | Every specialist's task packet and every produced artifact — including this one — must not contain real PHI. This document itself, and its companion documents, contain **zero** patient-identifying content; verified by construction, since no real patient data was consulted to write them. | Every specialist, self-enforced, and independently checked by whichever review process governs agent output |
| Credentials / access tokens | Never placed in any of the above regardless of data class (synthetic or real) — this is a security control (`SEC`), not a data-class question, and is out of this document's scope beyond restating the rule. | Software supply-chain and CI policy engineer / Tenant-isolation and authorization engineer |

### 7.1 This document does not design any of the mechanisms in the table above

Naming the surface and a candidate owner is not the same as specifying a secret
scanner, a redaction library, or a linter rule set — none of which this document
selects (`decisions_prohibited`).

### 7.2 Relationship to `HAZ-0028`

Every row in §7's table is a candidate control contributing to `HAZ-0028`'s
closure. This document does not close `HAZ-0028` — only a named safety authority
can accept residual risk (`decision-rights.md` §2) — but records that a
synthetic-data strategy without §7's cross-surface enforcement would leave
`HAZ-0028` open even if fixtures alone were perfectly synthetic.

### 7.3 `never_promote_to_production` guard

Every fixture-set record (§6.1) carries a literal `never_promote_to_production:
true` field. This is a deliberately redundant, machine-checkable assertion
alongside `data_class: synthetic` — two independent signals are harder to
silently lose than one, and a future promotion pipeline (`PROMPT:850-864`) can
check this field mechanically as a release-blocking guard without needing to
re-derive intent from `data_class` alone.

## 8. Applicability across environments

This strategy applies in **every** environment named in
`test-environment-design.md` §2–4 (local deterministic, CI hermetic, AMH
conformance target) without exception, and continues to apply to any future
production-like staging/shadow/pilot tier **until** the §3.3 approval chain
specifically authorizes formally de-identified (never raw real) data for a named,
scoped purpose in that tier. There is no environment tier in this program where
raw, non-de-identified real patient data is permitted for development or testing
— rule 12 draws no such exception, and neither does this document.

## 9. What this document deliberately does not decide

- Any specific generator tool, library, or framework (§6.3).
- The literal reserved-identifier ranges, sentinel values, or CPF/CNS/CNPJ
  corruption method (§4.4).
- Whether or when any specific de-identification method meets LGPD adequacy —
  reserved to `AUTH-PRIVACY-LEGAL` (§3.3).
- Clinically plausible value ranges for any specific observation type (§4.2) —
  reserved to named clinical owners.
- The physical location/technology of the fixture-set catalog (§6.1's
  `fixture_set_id` scheme is left open, including whether it reuses `CRV-xxxx` or
  introduces a new prefix).
- Log/trace/screenshot redaction mechanisms (§7).

## Handoff

**Recipient:** first-vertical-slice implementers, and any future fixture-generation
or CI-policy implementer.

- **OBSERVED:** `PROMPT:124` (rule 12, verbatim), `PROMPT:844` ("secret scanning
  and synthetic-data policy from the first commit"), `PROMPT:612` ("synthetic
  end-to-end safety probes with strict PHI redaction"), `docs/05-clinical-safety/hazard-log.md`
  HAZ-0028 (`joint`, S3/L4, `Undesirable`, candidate controls SAF-0026/SAF-0027/SAF-0023),
  `docs/08-interoperability/amh-data/four-layer-dossier.md` (AMH's own data
  population claims are SOURCE, not usable V2 fixtures merely because documented),
  `docs/08-interoperability/amh-data/contract-inventory.md` A6 (Maezo's
  fixture-pattern precedent — 9 fixtures, 3 deliberately invalid — cited as
  pattern, not reused as contract), `decision-rights.md` §2 (privacy/legal
  decision authority).
- **CHANGED:** created this document; no other file modified.
- **TESTED:** N/A — no fixture, generator, or CI check described here has been
  built or run.
- **NOT TESTED:** the entire §7 enforcement table is a list of candidate
  mechanisms, none implemented.
- **ASSUMED:** that a YAML-shaped metadata block (§6.1) is an adequate provenance
  format, consistent with `clinical-reference-vector-standard.md`'s format choice;
  that CPF/CNS check-digit corruption is achievable without needing to name a
  specific algorithm implementation in this document.
- **DECIDED (proposals only, none binding):** synthetic-as-default /
  de-identification-as-gated-exception (§3); the four generation principles (§4);
  the fixture-provenance metadata schema (§6.1); the cross-surface enforcement
  table (§7); universal applicability across every environment absent a specific
  §3.3 approval (§8).
- **REJECTED:** treating synthetic and de-identified data as interchangeable
  defaults — rejected per the task packet's explicit instruction and because the
  two paths carry materially different residual risk (§3.1); treating "fixtures"
  as the only surface rule 12 governs — rejected because rule 12 names seven
  other surfaces explicitly (§7).
- **LEFT OPEN:** the fixture_set_id scheme (reuse `CRV-xxxx` vs. a new prefix);
  every named "candidate, ADR pending" tool/mechanism; the actual reserved
  identifier ranges and CPF/CNS corruption method; when (if ever) a
  de-identification approval will be sought and by whom.
