---
doc_id: QVT-TEST-ENVIRONMENT-DESIGN
status: PROPOSAL
owner: UNASSIGNED — VALIDATION REQUIRED
source: INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §14 (required test layers), §7.6 (Anti-corruption and conformance layer — consumer-driven contract tests against a pinned AMH sandbox or faithful emulator), §15.2 (Environments and delivery), Gate G3 (§7 closing)
date_collected: 2026-08-14
collector: Safety-focused test architecture engineer
last_updated: 2026-08-14
---

# IntensiCare V2 — Test Environment Design

## 0. Status and authority boundary

**PROPOSAL.** This document defines the environment *tiers* the test strategy
requires and the fidelity policy governing the AMH conformance target. It does
**not** select a hosting platform, cloud provider, container runtime, CI product,
or emulator implementation technology (`decisions_prohibited`) — every such
mention below is `(candidate, ADR pending)`. It does not claim any environment
described here currently exists for V2; none does (`OBSERVED`,
`docs/05-clinical-safety/safety-plan.md` §11 item 7).

## 1. Citation shorthand

| Token | Resolves to |
|---|---|
| `PROMPT:n-m` | `https://github.com/Omni-Saude/intensicare-V2/blob/main/INTENSICARE_V2_ORCHESTRATOR_PROMPT.md`, lines n–m |
| `AMH-DOSSIER` | `docs/08-interoperability/amh-data/four-layer-dossier.md` |
| `AMH-INVENTORY` | `docs/08-interoperability/amh-data/contract-inventory.md` |
| `AMH-LOCK-DRAFT` | `docs/08-interoperability/amh-data/contracts.lock.draft.yaml` |

## 2. Environment tiers required by §14/§7.6

`PROMPT:846-848` (§15.2) names seven environment concepts generally: "development,
ephemeral preview, integration/conformance, staging, shadow, pilot, and
production." The task packet names four specifically for this document, which map
onto that list as follows:

| This document's tier | §15.2 name(s) it corresponds to | Primary purpose |
|---|---|---|
| **Local deterministic** (§3) | `development` | Fast TDD red/green loop (`test-strategy.md` §2 steps 3–6) |
| **CI hermetic** (§4) | Not separately named; the automated gate every PR passes through before any environment promotion | Blocking evidence per `test-strategy.md` §4.3 |
| **AMH conformance target** (§5) | `integration/conformance` | Contract-layer evidence for AMH-shaped inputs, per `PROMPT:493` ("consumer-driven contract tests against a pinned AMH sandbox or faithful emulator") |
| **Production-like staging (future, gate-bound)** (§6) | `staging`, `shadow`, `pilot`, `production` | Layers 2–4 AMH conformance evidence, load/soak/chaos/restore, and any future formally de-identified data use |
| *(not separately detailed)* | `ephemeral preview` | A per-change disposable environment for review — noted in §6.4 as an open item, not designed here |

**Every tier is synthetic-data-only** per `synthetic-data-strategy.md` §8, without
exception, until a specific §3.3 approval in that document authorizes otherwise
for a specific scoped purpose in a specific tier.

## 3. Local deterministic

### 3.1 Purpose

The environment a developer (human or capability-specific implementer agent) runs
against while executing `test-strategy.md` §2's TDD loop steps 3–6: write a
failing test, write the smallest passing behavior, refactor. Optimized for speed
and determinism, not for breadth of scenario coverage.

### 3.2 Required properties

- **Deterministic clock.** Any test exercising DOM-0003 (replay determinism),
  DOM-0009 (timestamp preservation), or freshness-window logic (`time-semantics.md`)
  must be able to inject/freeze the "now" the system under test observes — a local
  environment whose tests depend on the real wall clock cannot reliably test
  freshness boundaries (`clinical-reference-vector-standard.md` §5
  `freshness-window-edge`).
- **No live external network dependency.** No test in this tier may depend on a
  real AMH endpoint, a real external identity provider, or any other live
  third-party system — those belong to §5/§6. A local-tier test that silently
  depends on network reachability produces flaky, non-reproducible results, which
  is itself a form of the "advisory/non-blocking by accident" failure
  `test-strategy.md` §3 exists to prevent (a test nobody can trust cannot
  meaningfully block).
- **Synthetic-only fixtures**, per `synthetic-data-strategy.md`, loaded from the
  same fixture sets CI will use (§4) — no separate, undocumented "just for my
  machine" data.
- **Fast enough to run on every save/command** — a specific performance target is
  not decided here (owner: whichever engineering authority ratifies the
  development-loop ADR), but the requirement itself (fast enough that steps 3–6
  are not disrupted) is load-bearing for the TDD discipline to be followed at all.

### 3.3 What runs here

Primarily `test-strategy.md` §4.2 layers 1–2 (unit, property/boundary) and,
where feasible without a live AMH dependency, layers 4–5 (clinical reference
vectors, data-quality matrices) and 7–9 (persistence/tenant-isolation against a
local database instance, outbox, UI-state components). Layers depending on a
real or emulated external contract (layer 6), load/chaos (layer 13), or
multi-process crash-point testing (layer 8, partially) may run in a reduced or
mocked form locally, with the authoritative run happening in CI (§4).

## 4. CI hermetic

### 4.1 Purpose

The mandatory, blocking evidence-producing environment every change passes
through before any promotion, per `PROMPT:850-864` (§15.2) steps 1–2: "validate
source, schemas, docs, ADR status, migrations, contracts, rule bundles, and
traceability" and "run deterministic tests and risk-based integration/E2E
suites."

### 4.2 "Hermetic" means

- **No dependency on any live external system's actual availability at the
  moment of the run.** Contract tests against AMH-shaped payloads run against the
  pinned fixture set / emulator defined in §5, never against a live AMH
  environment — a CI run cannot be allowed to fail (or, worse, silently
  short-circuit) because a real external system happened to be unreachable.
- **Reproducible from a clean checkout**, including the "clean-install test"
  `PROMPT:117` requires for the migration history.
- **Every contract/schema/digest consumed is pinned**, not resolved dynamically
  at run time — this is the direct enforcement point for `test-strategy.md` §6's
  "schema drift... must fail the pipeline": a hermetic CI run compares the
  observed schema against the pinned value in a lock file (`AMH-LOCK-DRAFT` shows
  the shape such a lock file might take for AMH specifically; the actual V2 lock
  file per `AMH-INVENTORY` B0 does not yet exist).

### 4.3 What runs here

Every `BLOCKING (always)` layer from `test-strategy.md` §4.2 (1, 3, 4, 5, 8, and
the schema-drift-detection sub-check of 6) runs here on every change, without
exception. `BLOCKING (by G8)` layers run here too, in whatever advisory/blocking
state their ramp-up window (`test-strategy.md` §4.3) currently specifies, with
that state visible in the pipeline output.

## 5. AMH conformance target

### 5.1 The problem this section exists to solve

`AMH-DOSSIER`'s consolidated verdict (§Layer 2) is unambiguous: **"NO EVIDENCE —
not assessed"** for deployed capability, because — per the AMH repository's own
README, quoted in `AMH-DOSSIER` — "1 de 4 provisionado. Só `dev` existe — `stg`,
`prod` e `dr` custam US\$ 0,00 e não têm tfstate." `AMH-DOSSIER` draws the direct
inference: "if only `dev` is provisioned, then Layer 2 verification in a
production-like environment — which Gate G3 requires — cannot currently be
performed at all, by anyone, regardless of access. This is not a scheduling gap.
It is an environment that does not exist."

`PROMPT:493` nonetheless requires "consumer-driven contract tests against a
pinned AMH sandbox or **faithful emulator**." Because no sandbox exists in a
production-like form, and `dev` itself is not confirmed reachable by a V2
workload (`AMH-DOSSIER` §Layer 2 lists "whether the HAPI FHIR endpoint is
reachable by a V2 workload" as unresolved), this document designs for the
**faithful-emulator / pinned-fixture-set path as the primary near-term
conformance target**, with an authenticated-`dev` tier as a distinct, still
insufficient-for-G3, later addition.

### 5.2 Two candidate approaches (both `candidate, ADR pending`)

| Approach | What it is | What it is good for | What it cannot do |
|---|---|---|---|
| **A — Pinned fixture set** | A frozen collection of request/response (or event) payloads captured or hand-derived from AMH's declared Layer 1 contracts (schemas, profiles, the Maezo manifest pattern per `AMH-INVENTORY` A6) at the pinned commit, replayed statically in hermetic CI. | Fast, fully hermetic, easy to pin and diff for drift; sufficient for straightforward schema/shape conformance (`test-strategy.md` §4.2 layer 6's baseline). | Cannot express stateful, multi-step, or timing-dependent scenarios (duplicate delivery over time, out-of-order arrival relative to a prior fixture, downtime-then-recovery) — these need something that behaves like a system, not a static payload. |
| **B — Faithful emulator** | A test double implementing the same declared request/response surface and behavioral rules AMH's Layer 1 artifacts specify (tenant-partition equality checks, fail-closed 403s, the `valid|warning|quarantined` data-quality vocabulary, pagination/error shapes where declared), capable of stateful scenario sequences. | Scenario-level tests §7.6 explicitly requires: "duplicate, delay, out-of-order, correction, merge/unmerge, downtime, and backfill test scenarios." | Cannot know, and must not guess, anything AMH's Layer 1 does not declare (§5.4). |

**Both may be needed together**: fixture-set for fast/cheap baseline conformance
checks in every CI run, emulator for the deeper scenario-level tests that a
static fixture cannot express. Neither is chosen as the sole approach here — that
choice, including any concrete emulator technology, is `(candidate, ADR pending)`.

### 5.3 What this tier is pinned to

Both approaches must be traceable to the exact commits already recorded as
runtime variables in the orchestrator prompt (`PROMPT:21-22`):

```yaml
amh_evidence_snapshot_commit: 0a07a6f1fab36fb2f5eeee0fcd8e945c95f67116
amh_published_contract_manifest_commit: 09a0a282e69f49aa9c6944b25afb35eee65fcc9c
```

Per `docs/00-governance/registers/assumptions-register.md` `ASM-0002`, this pin
is an assumption of convenience for cycle 0 and must be re-verified/re-pinned at
execution time — when it is re-pinned, both the fixture set and the emulator must
be re-derived and re-validated against the new commit before being trusted again
(same rule as `synthetic-data-strategy.md` §6.2).

### 5.4 The AMH-emulator fidelity policy — the load-bearing rule of this section

**Emulator (and fixture-set) behavior must be traceable to the pinned commit's
contract files. It must never be invented.**

This is a direct application of `PROMPT:27` ("Never fabricate an interface,
approval, evidence source, or stakeholder decision") and rule 15 (`PROMPT:107`:
"An AMH FHIR access procedure contains illustrative authentication pseudocode and
must not be imported as an implemented control") to the specific case of building
a test double for a system nobody has observed running.

Operational rules:

1. **Every emulated behavior must cite the specific AMH artifact and
   section/line that justifies it.** Example: if the emulator rejects a request
   whose token-tenant claim does not equal the URL-partition tenant with a 403,
   that behavior is traceable to `AMH-DOSSIER`'s OBSERVED citation of
   `applications/hapi-fhir/config/partitioning-config.md` ("nega quando
   divergem"). An emulator behavior with no such citation is not permitted to
   exist.
2. **Where AMH's declared (Layer 1) contract says nothing, the emulator must not
   invent plausible behavior.** `AMH-DOSSIER` is explicit that Layers 2
   (deployed capability), 3 (populated data), and 4 (operational fitness) have
   **zero evidence** at the pinned snapshot. This means the emulator has no
   authoritative source for: actual measured latency distributions, actual
   pagination/rate-limit behavior under load, actual downtime/recovery timing,
   actual correction-propagation lag, or actual referential-integrity rates. For
   each such property, the emulator must do one of two things, never a third:
   - **(i) Parameterize it explicitly and flag it.** Configure the property as an
     adjustable test parameter whose value is visibly labeled
     `UNVALIDATED ASSUMPTION` in test output, so any test result depending on it
     is legible as depending on an assumption, not a measurement — this mirrors
     `AMH-DOSSIER`'s own discipline of never letting a design inference read as a
     measurement ("a design inference is not a measurement," Layer 4 verdict); or
   - **(ii) Omit the scenario from emulation entirely** until AMH owners provide
     the missing evidence, rather than emulate a guess.
   An emulator is never permitted to silently default an unvalidated property to
   a "reasonable-looking" value with no flag — that would be the same silent
   failure DOM-0007 forbids at the architecture level, reproduced inside the test
   harness itself.
3. **The Layer 1 contradictions `AMH-DOSSIER` records (C-1 vitals, C-2 auth, C-3
   manifest status, C-4 Observation shape) must not be silently resolved by the
   emulator picking one side.** Where the emulator must choose a behavior to be
   runnable at all (e.g., which auth mechanism to simulate for C-2), the choice
   is recorded as an explicit, visible `UNVALIDATED ASSUMPTION` naming which side
   of the contradiction it emulates and citing `AMH-DOSSIER`'s contradiction
   table row — never presented as if the contradiction were resolved.
4. **A change to the emulator's behavior requires the same evidence discipline as
   a change to a real contract dependency** — i.e., it is itself subject to
   `test-strategy.md` §6's "schema drift... must fail the pipeline" if it drifts
   from what it last claimed to represent without a corresponding re-citation.

### 5.5 What passing this tier's tests is, and is not, evidence of

Per `PROMPT:395` ("Passing an earlier layer never implies passing a later
layer") and `AMH-DOSSIER`'s explicit application of that rule:

| Passing... | Is evidence of | Is **NOT** evidence of |
|---|---|---|
| Fixture-set conformance tests (§5.2 A) | Layer 1 (declared-contract) shape conformance for the specific fixtures exercised | Layer 2 (deployed capability), Layer 3 (populated data), or Layer 4 (operational fitness) — none of these can be produced from a static fixture, by construction |
| Emulator scenario tests (§5.2 B), including any `UNVALIDATED ASSUMPTION`-flagged scenario | Layer 1 behavioral conformance to the *declared* contract, for the behaviors that are actually traceable per §5.4 | Any property left as an `UNVALIDATED ASSUMPTION`; Layer 2/3/4 evidence generally |
| A future authenticated `dev`-tier run (§5.6) | Layer 2 evidence, scoped to `dev` only | Layer 3/4 evidence, and **not** Layer 2 evidence for `stg`/`prod`/`dr`, which `AMH-DOSSIER` records do not exist |

**No release-evidence bundle may cite this tier's results as "AMH compatible"
without naming exactly which of the above rows produced the evidence** — a bare
"AMH conformance tests passed" statement is precisely the kind of unqualified
standards claim `PROMPT:1061` forbids ("FHIR compatible," "HL7 compliant"
without named versions, profiles, scenarios, and evidence).

### 5.6 Future tier — AMH `dev`-authenticated

When (and only when) an authorized V2 workload can reach AMH's `dev` environment
with real credentials (per `AMH-DOSSIER` §Layer 2's still-unresolved question 2),
that becomes a distinct, additional tier — not a replacement for §5.2's
fixture/emulator tier, because `dev` alone still cannot satisfy Gate G3's
"production-like environment" requirement (`PROMPT:511`). Tests run here produce
Layer 2 evidence **scoped to `dev`**, explicitly labeled as such, and must not be
generalized to any other AMH environment or to a V2 production release
readiness claim.

## 6. Production-like staging (future, gate-bound)

### 6.1 Status

**Does not exist. Not designed in operational detail by this document.** This
section records what it is *for* and what gates it, consistent with this
document's task-packet write scope (test strategy and environment design, not
infrastructure implementation).

### 6.2 What it is for

- Layer 2–4 AMH conformance evidence in a real, network-reachable environment
  (contingent on AMH itself provisioning something beyond `dev` — currently, per
  `AMH-DOSSIER`, **nobody can produce this evidence, regardless of V2 readiness**,
  because the target environment does not exist on the AMH side either).
- `test-strategy.md` §4.2 layer 13 (load, soak, chaos, restore, game-day) at
  representative scale.
- `test-strategy.md` §4.2 layer 14 (synthetic safety probes) measured under
  realistic network/infrastructure topology rather than local/CI approximations.
- The first environment tier where a `synthetic-data-strategy.md` §3.3-approved
  formally de-identified dataset could, in principle, be used for a specific,
  scoped, privacy-approved purpose — never by default, and never before that
  approval exists.

### 6.3 What gates entry to it

Per the phase table (`PROMPT:973-985`), this tier's meaningful use is gated by
**G3** (AMH compatibility — currently unattainable per `AMH-DOSSIER`'s own
verdict: "Gate G3 cannot be approached from here"), **G6** (safety/security
design), and ultimately **G8** (pilot/production promotion). No test result from
this tier may be treated as release evidence before its corresponding gate has
been passed by the named human authority for that gate (`decision-rights.md`).

### 6.4 Open items not designed here

- **Ephemeral preview environments** (`PROMPT:848`) — a per-change disposable
  environment for review. Not designed in this document; noted so it is not
  silently dropped from the environment taxonomy.
- **Shadow and pilot as distinct sub-tiers of "production-like"** — `PROMPT:900`
  ("Start with shadow mode, then a limited supervised pilot, then staged
  site/capability rollout") implies shadow and pilot are not identical to a
  generic staging tier; their exact relationship (same infrastructure, different
  gating; or genuinely separate environments) is left to the Platform reliability
  and SRE engineer and is explicitly out of this document's scope.
- **Concrete hosting/infrastructure technology** for any of the above —
  `(candidate, ADR pending)` per `PROMPT:126`/§10 ADR program items 19–20.

## 7. Environment-to-test-layer matrix

Cross-reference of `test-strategy.md` §4.2's sixteen layers against the tiers
defined above. `✓` = normally runs here; `(✓)` = may run in a reduced/mocked form
here, with the authoritative run elsewhere; `—` = does not run in this tier.

| Layer (`test-strategy.md` §4.2 #) | Local (§3) | CI hermetic (§4) | AMH conformance target (§5) | Staging (§6, future) |
|---|:--:|:--:|:--:|:--:|
| 1 Unit / domain invariant | ✓ | ✓ | — | — |
| 2 Property / boundary | ✓ | ✓ | — | — |
| 3 Mutation (safety kernel + authz) | (✓) | ✓ | — | — |
| 4 Clinical reference vectors | (✓) | ✓ | — | — |
| 5 Data-quality matrices | (✓) | ✓ | — | — |
| 6 Schema / consumer-driven contract | — | ✓ (fixture-set) | ✓ (fixture-set + emulator; §5.6 `dev` when available) | ✓ (Layer 2–4 evidence, when the tier exists) |
| 7 Persistence / tenant-isolation / migration | (✓) | ✓ | — | ✓ (at representative scale) |
| 8 Outbox crash-point / replay / ordering | (✓) | ✓ | — | ✓ |
| 9 UI-state component | ✓ | ✓ | — | — |
| 10 Accessibility (automated + manual AT) | (✓) automated only | ✓ automated | — | — manual AT is a human-validation activity, not tied to a specific infra tier |
| 11 Authenticated E2E clinical journeys (synthetic) | (✓) | ✓ | — | ✓ (broader scale/topology) |
| 12 Security (SAST/SCA/secret/IaC/SBOM/artifact/pentest) | (✓) partial | ✓ (automated) | — | pentest: staging or a dedicated security-test tier |
| 13 Load/soak/backpressure/failover/chaos/clock-skew/dependency-outage/restore/game-day | — | (✓) smoke-scale only | — | ✓ (primary tier) |
| 14 Synthetic safety probes (latency/loss) | — | (✓) smoke-scale only | — | ✓ (primary tier) + continuous in any live environment thereafter |
| 15 Retrospective replay / shadow validation | — | (✓) determinism sub-check only | — | ✓ (shadow sub-tier) |
| 16 Clinical performance analyses | — | — | — | ✓ (shadow/pilot, human-interpreted) |

This matrix operationalizes `PROMPT:858` (§15.2 step 7: "run AMH/connector
conformance, synthetic safety probes, security, accessibility, performance, and
restore checks appropriate to the stage") — "appropriate to the stage" is made
concrete here rather than left implicit.

## 8. What this document deliberately does not decide

- Any hosting platform, cloud provider, container/orchestration technology, CI
  product, or emulator implementation technology.
- Whether approach A (fixture-set) or B (emulator) in §5.2 is built first, or
  both — an engineering-effort and ADR decision.
- The literal lock-file format/location pinning AMH contract digests (§4.2
  references `AMH-LOCK-DRAFT`'s shape as illustrative only; the real V2 lock file
  per `AMH-INVENTORY` B0 does not exist).
- Whether/when AMH provisions `stg`/`prod`/`dr`, or whether V2 builds its own
  production-like staging first — both are external dependencies this document
  cannot resolve.
- Any specific SLO threshold, load target, or restore RTO/RPO number — those
  belong to the not-yet-created operability design (`PROMPT:868-880`) and the
  Platform reliability and SRE engineer.

## Handoff

**Recipient:** first-vertical-slice implementers, and the AMH-data compatibility
architect / AMH clinical-signal contract engineer for the §5 fidelity policy
specifically.

- **OBSERVED:** `PROMPT:493` (§7.6, pinned sandbox or faithful emulator
  requirement), `PROMPT:846-864` (§15.2), `AMH-DOSSIER` in full (especially the
  Layer 2 verdict — "NO EVIDENCE — not assessed" — and the README quote "1 de 4
  provisionado. Só `dev` existe"), `AMH-INVENTORY` A6 (Maezo fixture pattern),
  `docs/00-governance/registers/assumptions-register.md` `ASM-0002` (AMH commit
  pin is an assumption requiring re-verification).
- **CHANGED:** created this document; no other file modified.
- **TESTED:** N/A — no environment described here has been built.
- **NOT TESTED:** every tier in §3–§6 is a design proposal only.
- **ASSUMED:** that the fixture-set/emulator distinction in §5.2 is the right
  decomposition (an engineering judgment, not verified against any built
  system); that AMH's Layer 1 evidence is stable enough at the pinned commit to
  build an emulator against (itself subject to `ASM-0002`'s re-verification
  requirement).
- **DECIDED (proposals only, none binding):** the four-tier environment
  taxonomy and its §15.2 mapping (§2); the local/CI/AMH-conformance/staging
  property requirements (§3–§6); the AMH-emulator fidelity policy (§5.4) as the
  central control of this document; the environment-to-test-layer matrix (§7).
- **REJECTED:** treating AMH `dev` access as sufficient to satisfy Gate G3 —
  rejected directly on `AMH-DOSSIER`'s own evidence that only `dev` exists and
  Gate G3 requires a production-like environment (§5.6); allowing an emulator to
  fill an evidence gap with a "reasonable" invented value — rejected in favor of
  the explicit `UNVALIDATED ASSUMPTION` flag-or-omit rule (§5.4 item 2), because
  a plausible-looking invented value is indistinguishable from a real one once
  it starts producing green test runs — the same failure shape DOM-0009 forbids
  for timestamps, applied here to emulated system behavior.
- **LEFT OPEN:** whether AMH will ever provision a production-like environment;
  the emulator/fixture-set build order and technology; the real AMH-contract
  lock-file location; every staging/shadow/pilot infrastructure detail in §6.4.
