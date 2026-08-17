---
doc_id: QVT-TEST-STRATEGY
status: PROPOSAL
owner: UNASSIGNED — VALIDATION REQUIRED
source: INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §14 (TDD and verification strategy, incl. Gate G7), §7.6 (Anti-corruption and conformance layer), §3 rules 5/7/12, §15.2 (Environments and delivery pipeline)
date_collected: 2026-08-14
collector: Safety-focused test architecture engineer
last_updated: 2026-08-14
---

# IntensiCare V2 — Test Strategy

## 0. Status and what this document is not

**PROPOSAL.** This document defines the outside-in TDD discipline and the required
test-layer taxonomy for IntensiCare V2, per the task packet's `decisions_allowed:
strategy structure, vector format, taxonomy, TST-xxxx ID scheme`. It requires
ratification by the accountable engineering, safety, and quality authorities before
it binds implementation work (see `docs/00-governance/decision-rights.md`).

This document does **not**:

- select a test framework, runner, language, mutation-testing tool, contract-testing
  tool, load-testing tool, or CI product. Every tool reference below is explicitly
  marked `(candidate, ADR pending)` where named at all — per `PROMPT:126` ("Do not
  choose... because the legacy repository used it. Ratify choices through measurable
  decision drivers and ADRs") and the task packet's `decisions_prohibited`.
- claim that any test exists, has been written, has run, or has passed. Zero tests
  have been authored in this repository as of this document's date
  (`OBSERVED`, `docs/05-clinical-safety/safety-plan.md` §11 item 7: "No V2 source code
  exists"). Every `TST-xxxx` reference below is a **scheme definition**, not a
  populated registry entry.
- approve any clinical pathway, rule, or reference vector as clinically correct. That
  authority belongs to a named qualified clinician per
  `docs/12-quality-validation-and-testing/clinical-reference-vector-standard.md` and
  `decision-rights.md`.

## 1. Citation shorthand

| Token | Resolves to |
|---|---|
| `PROMPT:n-m` | `https://github.com/Omni-Saude/intensicare-V2/blob/main/INTENSICARE_V2_ORCHESTRATOR_PROMPT.md`, lines n–m |
| `DOM-xxxx` | `docs/03-domain/invariants/DOM-invariants.md`, entry xxxx |
| `HAZ-xxxx` | `docs/05-clinical-safety/hazard-log.md`, entry xxxx |
| `AMH-DOSSIER` | `docs/08-interoperability/amh-data/four-layer-dossier.md` |
| `AMH-INVENTORY` | `docs/08-interoperability/amh-data/contract-inventory.md` |

## 2. The outside-in TDD loop (§14 steps 1–8)

SOURCE (`PROMPT:776-787`), the mandatory loop for **every** capability, verbatim
structure:

| Step | Prompt text | Non-negotiable consequence |
|---|---|---|
| 1 | "start with a user/clinical scenario and measurable acceptance condition" | No implementation work begins from a technical task alone; every unit of work traces to an observed user/clinical scenario (`USR`/`CLR`) with a stated, measurable pass condition. |
| 2 | "link it to requirements, hazards, ADRs, API/events, UX states, and controls" | The scenario is not accepted as workable until it carries `PRD`/`CLR`/`SAF`/`HAZ`/`ADR`/`API`/`EVT`/`UX` links per `docs/00-governance/traceability-policy.md` §3. An unlinked scenario cannot proceed to step 3. |
| 3 | "write the failing acceptance/contract test" | The first artifact created for any capability is a test, and it must fail for the right reason (missing behavior, not a broken harness) before any production code exists. |
| 4 | "write the smallest failing unit/property tests" | Unit- and property-level tests are derived *from* the acceptance test's decomposition, not written speculatively ahead of it. |
| 5 | "implement the smallest behavior to pass" | No behavior is implemented beyond what the current failing test requires. |
| 6 | "refactor without changing observable behavior" | Refactors are covered by the same test suite; a refactor that requires changing a test's expected observable behavior is not a refactor — it is a new step-1 scenario. |
| 7 | "run the full affected safety, security, contract, and regression set" | Passing the new test alone is insufficient exit criteria; the full affected blocking set (§4 below) must also pass before the change is considered done. |
| 8 | "update traceability and evidence in the same change" | Traceability-catalog and evidence-bundle updates are part of the same change, not a follow-up ticket — an unlinked or undocumented passing test is not release evidence (`PROMPT:1062`). |

**"No code before a failing test" applies to behavior** (`PROMPT:787`, quoted
exactly). Repository/bootstrap configuration (toolchain pinning, CI scaffolding,
lockfiles, project skeletons) may be introduced with validation tests in the *same*
change, without a preceding failing behavioral test, because it has no clinical or
user-facing behavior to specify in advance. This carve-out is narrow: it covers
configuration and scaffolding only, never clinical logic, authorization logic, or
any code path a user or another system observes.

## 3. Why this taxonomy exists — the failure this strategy is built to prevent

SOURCE (`docs/05-clinical-safety/hazard-log.md` **HAZ-0031**, `P0/P7`, severity S5,
classified `Unacceptable`): "A safety-critical quality gate passes while validating
zero cases, or is configured as advisory/non-blocking → a clinically material
regression merges and releases under a green signal → an undetected defect reaches
patients with the *appearance* of having been tested." Its cited evidence
(`LEGACY-TA:584`) records the predecessor system's CI passing "All 0" cases against
nine domain files that a prior warning had already flagged as missing
`alert_groups` — a documented false-green gate that validated nothing while
reporting success.

Every gate-policy decision in §4 exists to make **that specific failure mode
structurally impossible to reproduce**: a test layer with zero collected cases, an
advisory safety job, an unreviewed exclusion, or an undetected schema drift must
each independently and visibly **fail** the pipeline, per `PROMPT:808` (quoted in
full in §6).

## 4. Required test-layer taxonomy

### 4.1 How to read this table

| Column | Meaning |
|---|---|
| **Layer** | The test category, quoted/paraphrased from `PROMPT:791-806`. |
| **Purpose** | What clinical/engineering failure this layer exists to catch. |
| **Gate** | `BLOCKING (always)` — must fail the pipeline at every stage from first CI run onward, no exceptions, no pre-production advisory phase; `BLOCKING (by G8)` — per `PROMPT:125` (rule 13) may run in an advisory/warn-only mode only during an explicitly time-boxed, documented ramp-up (see §4.3), but must be blocking before any production release; `HUMAN VALIDATION` — not a binary pipeline gate at all; produces evidence a named human must review (`VAL-xxxx`), and is never satisfied by automated pass/fail alone. |
| **TST rule** | How this layer's tests are identified and linked, per §5. |
| **Evidence output** | What artifact the layer must produce as release evidence (`PROMPT:1062`: a green run alone is not evidence). |

### 4.2 The sixteen required layers

| # | Layer (SOURCE `PROMPT:791-806`) | Purpose | Gate | TST rule | Evidence output |
|---|---|---|---|---|---|
| 1 | Pure unit tests for domain invariants and state transitions | Verify each `DOM-xxxx` invariant (DOM-0001–0009 today; the index grows) holds at the smallest testable unit, independent of infrastructure. | **BLOCKING (always)** | One or more `TST-xxxx` per `DOM-xxxx`; front matter `layer: unit-domain-invariant`, `verifies: [DOM-xxxx, ...]`. | Per-invariant pass/fail record; a `DOM-xxxx` with zero linked `TST-xxxx` is a traceability defect that blocks the catalog check (§4.3). |
| 2 | Property/boundary tests for scores, rules, time windows, units, idempotency, and concurrency | Catch the class of defect a fixed example cannot: threshold-exact values, unit-conversion edges, freshness-window boundaries (`time-semantics.md`), idempotency-key reuse, and concurrent command interleavings. | **BLOCKING (always)** for safety-kernel and command-handling properties; **BLOCKING (by G8)** for non-safety-relevant properties (e.g., pure UI-formatting boundaries). | `layer: property-boundary`; `verifies:` the `CLR`/`SAF`/`DOM`/`API` item and, where applicable, the `boundary_edge_class` taxonomy in `clinical-reference-vector-standard.md`. | Generated-case count and shrink-report per run; a property suite reporting a fixed, hand-picked example count only (no generation) is non-conformant and must be flagged. |
| 3 | Mutation testing for the deterministic safety kernel and authorization policies | Prove the safety-kernel and authorization test suites actually detect logic changes, not merely execute code — the direct structural answer to HAZ-0031's false-green pattern for the two subsystems where a false-green is least tolerable. | **BLOCKING (always)** | `layer: mutation`; `scope: safety-kernel \| authorization-policy`; a mutation score threshold is itself a `DECIDED` value (owner: named safety + engineering authority, not this document) — until decided, **no minimum score may be silently assumed**; the run must report the score and a human must set the threshold before this layer can gate. | Mutation-score report naming survived/killed mutants per module; any mutant classified "equivalent" requires a recorded human rationale, never an automated dismissal. |
| 4 | Independent clinical reference vectors, including no-fire reasons | Verify pathway logic against clinically authored, independently reviewed expected outcomes — including the expected *reason* a pathway did not fire, per DOM-0004. | **BLOCKING (always)** for any pathway in `actionable` mode (`PROMPT:365`); a pathway with zero ratified vectors cannot enter actionable mode at all (see §6). | `layer: clinical-reference-vector`; `verifies:` the `CLR`/pathway id and `RuleVersion`; one `TST-xxxx` executes one or more `CRV-xxxx` vectors — see `clinical-reference-vector-standard.md`. | Per-vector pass/fail plus the vector's own review/provenance status; a passing `TST-xxxx` whose vectors are still `UNREVIEWED` is evidence of *engineering* correctness only, never of *clinical* correctness (see that document §4). |
| 5 | Missing/stale/invalid/partial/conflict/correction/out-of-order test matrices | Systematically exercise every data-quality/timing failure mode named in `PROMPT:45` and DOM-0002/0004/0008/0009, per required input, not just the happy path. | **BLOCKING (always)** | `layer: data-quality-matrix`; `verifies:` DOM-0002, DOM-0004, DOM-0008, DOM-0009 plus the specific `CLR` input; matrix cell identity recorded in metadata (`condition: missing\|stale\|invalid\|partial\|conflict\|correction\|out-of-order`). | A matrix-coverage report per required pathway input showing every named condition is exercised; an input with an untested condition is a visible gap, not a silent pass (mirrors the g7-slice-test-plan.md condition matrix, §7). |
| 6 | Schema and consumer-driven contract tests for OpenAPI, AsyncAPI, AMH, FHIR, HL7, terminology, notifications, and MCP | Detect breaking changes and drift against every published contract V2 depends on or publishes, before a consumer or producer is affected in a live environment. | **BLOCKING (by G8)**; **BLOCKING (always)** specifically for schema-drift detection (§6: "schema drift... must fail the pipeline" admits no ramp-up). | `layer: contract`; `verifies:` the `API`/`EVT` id and, for AMH, the pinned commit/digest per `test-environment-design.md` §3; contract-provider name recorded (`openapi \| asyncapi \| amh \| fhir \| hl7v2 \| terminology \| notification \| mcp`). | Compatibility report per contract per provider/consumer pair, naming exact schema version/digest tested — mirrors the pattern `AMH-INVENTORY` A6 documents (producer commit, digests, compatibility mode, fixtures) without reusing AMH's specific contract. |
| 7 | Persistence constraints, row-level tenant isolation, migration clean-install/upgrade/rollback-compatibility tests | Prove DOM-0001 (tenant/encounter ownership) holds at the storage layer, and that the migration history is reproducible from empty and safely reversible. | **BLOCKING (always)** for tenant isolation (HAZ-0003, HAZ-0013 are S5/S4 `Unacceptable`); **BLOCKING (by G8)** for migration rollback-compatibility where a documented, human-accepted interim risk exists. | `layer: persistence-tenant-migration`; `verifies:` DOM-0001 and the relevant `SAF`; adversarial tenant-isolation cases are tagged `adversarial: true`. | Clean-install-from-empty log; upgrade/rollback drill result; adversarial cross-tenant read/write attempt log with explicit fail-closed outcome per attempt. |
| 8 | Transaction/outbox crash-point, replay, duplicate, ordering, and reconciliation tests | Prove DOM-0005 (transactional publication) and DOM-0006 (durability precedes immediacy) survive process crashes at every meaningful point in the write path. | **BLOCKING (always)** | `layer: outbox-transactional`; `verifies:` DOM-0005, DOM-0006; each test names the specific crash point simulated (`pre-commit \| post-commit-pre-publish \| post-publish-pre-ack \| mid-replay`). | Crash-point coverage matrix; replay-determinism proof (same crash point replayed twice yields the same durable outcome). |
| 9 | Component and interaction tests for every UI state | Prove every named UI/domain state in `PROMPT:667-675` (loading/empty/unavailable/forbidden/timeout/retrying/partially-loaded; fresh/aging/stale/expired/missing/invalid/conflicted/corrected/superseded; the five evaluation statuses; work-item lifecycle states; online/degraded/offline/reconnecting/replaying/reconciled; session states) renders as a visibly distinct, tested state — never silently collapsed to "normal-looking." | **BLOCKING (by G8)**; the specific state-completeness check (no state silently missing a test) is **BLOCKING (always)** once any UI component exists, because an untested state is exactly the DOM-0007 failure this layer exists to prevent. | `layer: ui-state-component`; `verifies:` the `UX` id and the named state value; a coverage check enumerates the full state vocabulary from `PROMPT:667-675` against tested states. | State-coverage matrix (state value → tested? → screenshot/interaction evidence); any state present in the vocabulary but absent from the matrix is a visible gap. |
| 10 | Accessibility automation plus manual assistive-technology validation | Prove WCAG 2.2 AA and the specific safety-relevant accessibility failure already recorded (HAZ-0037: no live-region announcement for clinically significant state changes). | **BLOCKING (by G8)** for automated checks; **HUMAN VALIDATION** for manual AT sessions (`VAL-xxxx`, owner: Accessibility and inclusive-use specialist, acceptance ≠ designer per `decision-rights.md` pair 5). | `layer: accessibility-automated \| accessibility-manual`; `verifies:` the `UX` id and, where applicable, `HAZ-0037`. | Automated scan report (violations by WCAG criterion); manual AT session report naming participant role, assistive technology used, and pass/fail per scenario — never a document asserting "accessible" without both. |
| 11 | Authenticated end-to-end clinical journeys using synthetic data | Prove the full P1–P7 loop (`PROMPT:36-43`) works end to end as an authenticated user would experience it, using only synthetic data (`synthetic-data-strategy.md`). | **BLOCKING (by G8)**; the specific journeys required for Gate G7 are **BLOCKING (always)** for that gate — see `g7-slice-test-plan.md`. | `layer: e2e-clinical-journey`; `verifies:` the full `USR`→`CLR`→`SAF` chain for the journey; `data_provenance: synthetic-only` is a mandatory, checked field. | Journey pass/fail with step-by-step evidence (each of P1–P7 individually observed, not merely a final assertion); a journey test containing any non-synthetic-marked fixture fails the synthetic-data policy check independent of its functional result. |
| 12 | Security unit/integration tests, SAST, SCA, secret scanning, IaC/container scanning, SBOM/license checks, artifact verification, and penetration tests | Prove the security controls in `PROMPT:748-768` are implemented and hold under adversarial testing, and that the supply chain producing the artifact is itself trustworthy. | **BLOCKING (by G8)** for automated scanning categories, **BLOCKING (always)** once secret-scanning exists at all (`PROMPT:844`: "secret scanning... from the first commit" admits no ramp-up); **HUMAN VALIDATION** for penetration tests (`VAL-xxxx`, owner: Healthcare threat-model specialist's external verifier, independent per `decision-rights.md` pair 3). | `layer: security-{sast\|sca\|secret\|iac\|sbom\|artifact\|pentest}`; `verifies:` the `SEC` id and, where applicable, the joint `HAZ` (HAZ-0013, HAZ-0014, HAZ-0028, HAZ-0029 are all `joint` per hazard-log.md and require this layer plus threat-model sign-off). | Scan report per category with a named severity threshold; SBOM artifact; pentest report with named independent tester and finding-remediation status. |
| 13 | Load, soak, backpressure, failover, chaos, clock-skew, dependency-outage, restore, and game-day tests | Prove the system behaves safely (explicit degraded states per DOM-0007, no silent data loss) under sustained load, partial failure, and full dependency loss — not merely that it is fast under ideal conditions. | **BLOCKING (by G8)** for restore specifically (rule 13 names "restore" explicitly as forbidden-advisory-in-production); **HUMAN VALIDATION** (game days) for the broader resilience program — a game day is evidence a human must interpret, not an automated pass/fail. | `layer: resilience-{load\|soak\|backpressure\|failover\|chaos\|clock-skew\|dependency-outage\|restore}`; `verifies:` the relevant `OPS`/`NFR`/`SAF`; restore tests additionally `verifies: HAZ-0034`. | SLO-adherence report under each named condition; restore-drill report with measured RTO/RPO against the target (not merely "restore succeeded" — see HAZ-0034's own evidence that DR runbooks describing nonexistent resources is a documented AMH-side precedent for false restore confidence, `AMH-DOSSIER` §Layer 2). |
| 14 | End-to-end synthetic probes measuring source-to-evaluation-to-visible-to-acknowledged latency and loss | Continuously (not just at release time) measure the actual latency and loss of the full safety loop in each environment where it runs, using synthetic, PHI-free probe data (`PROMPT:612`: "synthetic end-to-end safety probes with strict PHI redaction"). | **BLOCKING (by G8)** as a release-readiness input; **operational** (continuous, not a one-time pipeline gate) once live — see `test-environment-design.md` §5 and `OPS` SLOs in the not-yet-created operability design. | `layer: synthetic-safety-probe`; `verifies:` the SLOs named in `PROMPT:868-880` (source-to-accepted, accepted-to-evaluation, evaluation-to-work-item, generated-to-visible, generated-to-acknowledged). | Continuous latency/loss time series per environment; breach of a probe threshold must be visible to clinicians and operators per `PROMPT:502`, not only to an internal dashboard. |
| 15 | Retrospective replay and, when authorized, shadow/prospective clinical validation | Prove a `RuleVersion`'s behavior against representative historical/synthetic data before and during supervised exposure, per DOM-0003's determinism guarantee and `PROMPT:326` ("Use retrospective replay, shadow evaluation... to recalculate the portfolio"). | **HUMAN VALIDATION** — this layer produces evidence for a qualified human committee (Gate G2/G8), not an automated pipeline pass/fail; determinism itself (same input → same output on replay) IS automatable and is **BLOCKING (always)** as a sub-check within this layer. | `layer: retrospective-replay \| shadow-validation`; `verifies:` DOM-0003 (determinism sub-check) and the pathway's `VAL-xxxx` clinical-validation record. | Replay-determinism proof (byte/field-identical output); shadow-mode non-actioning evaluation log for human committee review — never auto-promoted to actioning status (`PROMPT:349`: "Shadow/non-actioning evaluation may precede this approval only with privacy, security, and research/governance authorization"). |
| 16 | Subgroup, calibration, sensitivity, specificity, PPV, NPV, false-alert burden, alerts per patient-day, time-to-action, override, and outcome analyses | Measure clinical performance and equity/subgroup safety, feeding portfolio recalculation (`PROMPT:324-326`) and post-release surveillance (`PROMPT:868`, Phase 10). | **HUMAN VALIDATION** — statistical/clinical analyses interpreted by the Clinical validation biostatistician and clinical owners; never a binary CI gate. | `layer: clinical-performance-analysis`; `verifies:` the pathway's `VAL-xxxx`; each analysis names its dataset provenance (synthetic, retrospective-real-with-approval, or prospective-shadow) per `synthetic-data-strategy.md`. | Analysis report with confidence intervals/uncertainty, subgroup breakdowns, and an explicit statement of dataset representativeness limitations — never a bare point estimate presented as sufficient (`PROMPT:324`: "prefer a lower-confidence-bound estimate over an optimistic point estimate"). |

### 4.3 Advisory ramp-up is bounded, documented, and time-boxed — never silent

`PROMPT:125` (rule 13) forbids **production releases** from relying on
advisory/non-blocking gates for safety, tenant-isolation, migration, security,
accessibility, contract, restore, or clinical tests. `PROMPT:808` additionally
forbids **advisory safety jobs** at any pipeline stage, with no production-only
qualifier. Reconciling the two:

1. **Safety-kernel-adjacent layers (1, 3, 4, 5, 8) are `BLOCKING (always)`** —
   they may never run in advisory/warn-only mode, at any stage, per `PROMPT:808`'s
   unqualified prohibition. This is the strictest reading and is deliberately
   chosen: HAZ-0031 exists precisely because a "temporary" advisory gate became a
   permanent false-green.
2. Layers whose rule-13 category applies (tenant-isolation, migration, security,
   accessibility, contract, restore, clinical-journey) but whose §14 name is not
   itself "safety" may run advisory **only** during an initial, explicitly time-boxed
   ramp-up window, and only if all of the following hold simultaneously:
   - the ramp-up window has a recorded end date and owner (`GDEC-xxxx` per
     `evidence-notation.md`);
   - the advisory status is visible in the pipeline output, not merely in
     configuration a reviewer must go find;
   - the layer is `BLOCKING` no later than the phase's exit gate (G4 for UX-state
     completeness, G5 for connector conformance, G6 for security/accessibility
     design, G7 for the first vertical slice's own scope, G8 for production);
   - a named human, not an agent, approves the ramp-up window and its end date.
3. **No pathway may enter actionable production mode (`PROMPT:365`) while any of
   its layer-4/5 tests are advisory.** This is stricter than rule 13's general
   floor because clinical reference vectors and data-quality matrices are the most
   direct technical descendants of HAZ-0005/HAZ-0006/HAZ-0021 (the confirmed
   legacy silent-no-fire defect).
4. Layers marked `HUMAN VALIDATION` in §4.2 are not "advisory" in the rule-13
   sense at all — they are not automated pipeline gates and were never claimed to
   be. Do not conflate an evidence-producing human-review layer with a
   non-blocking automated check; conflating the two would itself repeat HAZ-0031's
   pattern by making a human-judgment layer look like a green CI signal.

## 5. TST-xxxx ID scheme

### 5.1 Relationship to `traceability-policy.md`

`docs/00-governance/traceability-policy.md` §1 already reserves the `TST` prefix
("Automated test/evidence") and §2 fixes its format: `TST-<NNNN>`, sequential,
4-digit, zero-padded, globally unique within the prefix, assigned by "the single
source of truth for its own prefix's next-available number" — here, the future
test catalog (§5.3). This document does not alter that format. It specifies:

- what metadata every `TST-xxxx` entry must carry (§5.2);
- how the `TST-DOM-xxxx` placeholder notation already used in
  `docs/03-domain/invariants/DOM-invariants.md` reconciles with the flat,
  non-namespaced `TST-<NNNN>` rule (§5.4);
- where the authoritative catalog will live (§5.3, not created by this document).

### 5.2 Required metadata per `TST-xxxx` entry

Every `TST-xxxx` entry, wherever it is eventually recorded, must carry at minimum:

```yaml
id: TST-0001                    # sequential, assigned only when the test is authored
title: <short human-readable title>
layer: <one of the 16 layer keys in §4.2's "TST rule" column>
gate: blocking-always | blocking-by-g8 | human-validation
verifies:
  requirements: []               # PRD/CLR/SAF/SEC/NFR/DOM/API/EVT/UX ids
  hazards: []                    # HAZ ids, mandatory if layer touches a HAZ-linked control
authoring:
  author: UNASSIGNED — VALIDATION REQUIRED
  independent_reviewer: UNASSIGNED — VALIDATION REQUIRED   # required for layers 3, 4, 12 (pentest), 15
data_provenance: synthetic-only | n/a   # per synthetic-data-strategy.md; "n/a" only for pure-logic unit tests with no fixture data at all
status: not-yet-authored | authored-failing | passing | quarantined
quarantine_reason: null          # required, non-null, and independently reviewed if status is quarantined — see §6
evidence_artifact: <path or URL to the produced report>
pr: null
```

`status: quarantined` is not a silent skip. Per §6, a quarantined test still
requires a recorded, independently reviewed reason, and quarantine of a layer-1/3/4/5/8
(`BLOCKING (always)`) test is itself an unacceptable state under HAZ-0031's control
intent until a named human accepts the residual risk (`decision-rights.md` §2, "Clinical
hazard / residual-risk acceptance").

### 5.3 Catalog location — not created by this document

The authoritative `TST` catalog (the file that owns "next-available number" per
`traceability-policy.md` §1 rule 4) does not yet exist. This document proposes,
without creating, that it live at `docs/12-quality-validation-and-testing/test-catalog.md`
(or a generated equivalent once a test framework is chosen), populated
incrementally as tests are actually authored — never retroactively backfilled to
make historical coverage look larger than it was. Populating it with real entries
is explicitly **out of this document's scope** (`decisions_prohibited: claiming any
test exists or passes`).

### 5.4 Reconciling `TST-DOM-xxxx` placeholders

`docs/03-domain/invariants/DOM-invariants.md` uses the notation `TST-DOM-0001`
through `TST-DOM-0009` as a **verification idea** shorthand — a mnemonic pointer
from a domain invariant to a not-yet-authored test, not a claim that a test with
that literal ID exists. This is useful for readability but is not itself a
conformant `TST-xxxx` ID under §5.1's flat-numbering rule (a literal ID
`TST-DOM-0001` would violate `<PREFIX>-<NNNN>`'s exactly-one-hyphen, numeric-suffix
format).

**Resolution (PROPOSAL):** when a test verifying `DOM-0001` is actually authored,
it receives the next sequential `TST-<NNNN>` from the catalog (§5.3) and records
`verifies: {requirements: [DOM-0001]}` per §5.2 — the DOM-invariant document's
`TST-DOM-0001` mnemonic becomes prose describing intent, not the test's real
identifier. This same resolution applies to any other document that has used a
namespaced `TST-<PREFIX>-xxxx` mnemonic before a real ID scheme existed. No
existing document requires editing as a result of this resolution — the mnemonics
remain valid as prose pointers.

## 6. Zero-tolerance pipeline-failure conditions

SOURCE (`PROMPT:808`), quoted in full: "Zero collected tests, zero clinical
vectors, skipped critical scenarios, advisory safety jobs, unexpected test
exclusions, schema drift, or unreviewed snapshot changes must fail the pipeline."

| Condition | What "fail the pipeline" means operationally | Detection approach (candidate, ADR pending) |
|---|---|---|
| Zero collected tests | A test-runner reporting "0 tests found" for a layer that has ever had a `TST-xxxx` entry is a **failure**, not a no-op pass — mirrors HAZ-0031's evidence exactly (`LEGACY-TA:581`: "882 setup errors → no clinical assertion ran"). | A collected-test-count floor per layer, checked and asserted non-zero, not merely "exit code 0." |
| Zero clinical vectors | A pathway with zero `CRV-xxxx` vectors cannot be in `actionable` mode (§4.2 row 4); the pipeline must reject, not silently permit, a pathway release with an empty `TestPack`. | A pre-release check counting ratified vectors per pathway/`RuleVersion` against a minimum the clinical owner sets. |
| Skipped critical scenarios | A test-runner "skip" annotation on any test tagged `gate: blocking-always` fails the pipeline; a skip on a `blocking-by-g8` test is permitted only inside a recorded, time-boxed ramp-up per §4.3. | Static check over test metadata (§5.2) for `skip` + `gate: blocking-*` co-occurrence outside an approved ramp-up window. |
| Advisory safety jobs | Any job whose layer is `BLOCKING (always)` per §4.2 configured as non-blocking/warn-only in the pipeline definition is itself a pipeline defect, independent of the job's own pass/fail result. | Pipeline-configuration lint against the layer table in §4.2. |
| Unexpected test exclusions | A test file, tag, or path excluded from a run that is not named in a reviewed, dated exclusion record is a failure. | Exclusion allow-list requiring the same review discipline as a production change; an exclusion with no matching allow-list entry fails the build. |
| Schema drift | Any consumed contract (OpenAPI, AsyncAPI, AMH, FHIR, HL7, terminology, MCP) whose observed schema/digest differs from the pinned value in the relevant lock file fails the contract layer (#6) — mirrors `AMH-DOSSIER`'s point that "documented configuration in this codebase has demonstrably diverged from deployed behavior before" (Layer 2 verdict). | Digest comparison against `config/integrations/.../contracts.lock.*` (pattern proposed in `AMH-INVENTORY` B0; exact V2 file not yet created). |
| Unreviewed snapshot changes | A UI/contract snapshot diff merged without a recorded human reviewer's explicit approval of *that* diff fails the pipeline, regardless of whether the snapshot "passes" mechanically. | Snapshot-review metadata requirement, analogous to `authoring.independent_reviewer` in §5.2. |

## 7. Relationship to companion documents

- `clinical-reference-vector-standard.md` — the format for layer 4/5's vectors and
  the `CRV-xxxx` ID scheme.
- `synthetic-data-strategy.md` — the data-provenance rule every layer's
  `data_provenance: synthetic-only` field enforces.
- `test-environment-design.md` — which environment tier each layer actually runs
  in, including the AMH conformance-target policy for layer 6's AMH sub-category.
- `g7-slice-test-plan.md` — the concrete, condition-by-condition test obligations
  for the first vertical slice, which draws on every layer in §4.2 but does not
  duplicate this document's general definitions.

## 8. What this document deliberately does not decide

- Any test framework, runner, mutation-testing tool, contract-testing tool,
  load-testing tool, or CI product (`decisions_prohibited`).
- The mutation-score threshold for layer 3 (owner: named safety + engineering
  authority).
- The collected-test-count floor and vector-count minimum per pathway in §6
  (owner: clinical + engineering authority per pathway).
- Whether any specific test in this taxonomy has been written or has passed —
  none have (`decisions_prohibited: claiming any test exists or passes`).
- Clinical correctness of any pathway, rule, or vector — reserved to
  `clinical-reference-vector-standard.md`'s named clinical owner and
  `decision-rights.md`.
- The physical location/technology of the future `test-catalog.md` (§5.3).

## Handoff

**Recipient:** first-vertical-slice implementers (per this task's
`handoff_recipient`), and any future capability-specific builder agent whose task
packet requires "write the failing acceptance/contract test" (§14 step 3).

- **OBSERVED:** `PROMPT:774-828` (§14 full text), `PROMPT:113-127` (§3 rules 1–15),
  `PROMPT:846-864` (§15.2), `docs/05-clinical-safety/hazard-log.md` (HAZ-0001–0040,
  especially HAZ-0031), `docs/03-domain/invariants/DOM-invariants.md` (DOM-0001–0009),
  `docs/00-governance/traceability-policy.md`, `docs/00-governance/decision-rights.md`,
  `docs/08-interoperability/amh-data/four-layer-dossier.md` and
  `contract-inventory.md`. Zero V2 source code and zero V2 tests exist as of this
  writing.
- **CHANGED:** created this document; no other file modified.
- **TESTED:** N/A — this document defines a test strategy; it does not itself
  execute tests. No claim of test existence or pass/fail is made anywhere above.
- **NOT TESTED:** every layer in §4.2 is unimplemented; the taxonomy itself has not
  been exercised against a real capability.
- **ASSUMED:** that `docs/00-governance/traceability-policy.md`'s `TST` prefix
  format (flat `TST-<NNNN>`) is the correct one to build on, per its own
  ratification status (PROPOSAL, not yet DECIDED); that HAZ-0031's existing
  classification (`Unacceptable`, S5) correctly represents this program's risk
  tolerance for false-green gates.
- **DECIDED (proposals only, none binding):** the 16-layer taxonomy's gate
  classification (§4.2 "Gate" column); the TST-xxxx metadata schema (§5.2); the
  `CRV-DOM-xxxx` reconciliation rule (§5.4); the ramp-up conditions (§4.3).
- **REJECTED:** a design where any safety-kernel-adjacent layer could run
  advisory even temporarily — rejected in favor of `BLOCKING (always)` per §4.3
  item 1, because `PROMPT:808`'s wording admits no production-only qualifier and
  HAZ-0031 is direct evidence of what a "temporary" exception becomes in practice.
- **LEFT OPEN:** the mutation-score threshold; the vector-count minimum per
  pathway; the physical test-catalog location and its next-available-number
  bootstrapping; ramp-up window owners and end dates for each `blocking-by-g8`
  layer; whether any additional test layer becomes necessary once a concrete
  pathway/architecture ADR exists.
