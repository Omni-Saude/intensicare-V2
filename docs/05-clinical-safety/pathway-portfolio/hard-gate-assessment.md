---
doc_id: PORT-HARD-GATE-ASSESSMENT
title: IntensiCare V2 — Hard Eligibility Gate Assessment (candidate × gate)
status: PROPOSAL
label: PROPOSAL
owner: UNASSIGNED — VALIDATION REQUIRED
approver_role: AUTH-CLINSAFETY (docs/00-governance/authority-model.md:28)
validation_status: VALIDATION REQUIRED
source: INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §6.2 (lines 287-303), Gate G2 (347-349), §7.2 (397-420)
date_collected: 2026-08-14
last_updated: 2026-08-15
collector: clinical pathway portfolio optimizer (candidate inventory / source-eligibility phase)
provenance:
  source_repo: intensicare-V2
  path_or_url: docs/05-clinical-safety/pathway-portfolio/hard-gate-assessment.md
  commit_sha_or_version: uncommitted (working tree at cb35521)
  section_or_lines: whole document
  date_collected: 2026-08-14
  collector: clinical pathway portfolio optimizer
  transformation: >
    Each of the eleven PROMPT:289-301 gates evaluated against each of the nine
    candidates in candidate-inventory.md, using only evidence already on disk in
    this repository plus referenced (never imported) legacy assessment lines.
  confidence: medium
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  requirements: []
  hazards: []
  adrs: []
  tests: []
  pr: null
supersedes: null
superseded_by: null
---

# IntensiCare V2 — Hard Eligibility Gate Assessment

> ## The finding, stated plainly
>
> **ZERO candidates are currently implementable-actionable.**
>
> Across **9 candidates × 11 hard gates = 99 cells**, there are **0 `PASS`**, **88 `FAIL`**,
> and **11 `UNKNOWN`**. `PROMPT:289` admits a pathway to the implementable portfolio "only
> if **all** are true." No candidate satisfies **any** gate today.
>
> Per `PROMPT:303`: "If any hard gate fails, classify the pathway as `RESEARCH`, `VALIDATE`,
> `DEFER`, or `REJECT`; **do not weaken the gate to reach a desired count.**" No gate has
> been weakened, reinterpreted, or scoped down in this assessment. **The implementable
> portfolio today is empty, and `PROMPT:324` expressly permits that: "Its initial size may
> legitimately be zero if no candidate passes the hard gates."**
>
> **Cycle-1 update (2026-08-15):** source-verified evidence moves some verdicts on gates
> 3, 6, 7 and 8 from FAIL/UNKNOWN to **PARTIAL** for precursor-covered candidates — see
> §7. **Gate 4 remains FAIL on unchanged AMH evidence, PARTIAL is not PASS, and the
> actionable-pathway count remains ZERO.**

## 0. Method and verdict vocabulary

### 0.1 Scope

Candidates are `CAND-0001`..`CAND-0009` from `candidate-inventory.md` §2. Gates are the
eleven at `PROMPT:289-301`, quoted verbatim in §2 below. Citation shorthand is that of
`candidate-inventory.md` §0.2.

### 0.2 Verdict vocabulary — applied strictly

| Verdict | Definition used here | Discipline |
|---|---|---|
| `PASS` | Evidence on disk **positively establishes** that the gate condition is met for this candidate. | Requires evidence, not plausibility. Awarded **0 times**. |
| `FAIL` | Evidence on disk **positively establishes** that the gate condition is **not** met. | The absence of a required named human, artifact, contract, or measurement **is** positive evidence of non-satisfaction — a gate that requires a named owner is failed, not unknown, when the register records `UNASSIGNED`. |
| `UNKNOWN` | The evidence is **insufficient to determine** the verdict either way. | Used only where the candidate itself is unenumerated, or where the artifact the gate asks about does not yet exist in any form to be judged. |

**A note on the FAIL/UNKNOWN boundary, because it matters.** It would be softer, and wrong,
to mark every gate `UNKNOWN` on the grounds that V2 is greenfield. Where the repository
positively records `UNASSIGNED`, `blocked`, `no evidence`, or `structurally excluded`, that
is a determination, and the honest verdict is `FAIL`. `UNKNOWN` is reserved for the two
places where it is genuinely earned (gate 4 for the unenumerated candidate sets, and gate 7
for every candidate — see §2.7).

### 0.3 Classification vocabulary (`PROMPT:303`) — definitions proposed by this specialist

`PROMPT:303` names four classifications but does not define them. These definitions are a
**PROPOSAL** under this phase's `decisions_allowed`, and are applied consistently:

| Classification | Proposed definition | Binding constraint |
|---|---|---|
| `RESEARCH` | The candidate is not yet **specified** well enough to be assessed. Work required is enumeration, definition, or characterization — not validation. | *We do not know what this is.* |
| `VALIDATE` | The candidate is specified, and the binding constraint is clinical/evidence/human-factors work that **can begin now**. | *We know what this is; we must show it is right.* |
| `DEFER` | The candidate is specified, but admission is blocked on a dependency **outside this programme's control** (an AMH-owner act, an environment, a funding decision). Validation work may proceed in parallel but cannot unblock admission. | *We know what this is; we cannot feed it.* |
| `REJECT` | The candidate should not be pursued **as a pathway portfolio candidate**, on evidence, and should not be re-proposed without new evidence. | *This does not belong here.* |

**`DEFER` is not `REJECT` and must not be read as one.** `AMH-CF §5` records that six of the
eight conditions for changing the compatibility finding "require an AMH-owner act or an AMH
environment" — "The critical path for V2's AMH compatibility runs primarily through AMH, not
through V2 engineering."

---

## 1. Summary matrix — candidate × gate

`F` = FAIL · `U` = UNKNOWN · `P` = PASS (none). Gate numbers are `PROMPT:291-301`.

| Candidate | G1 use/pop | G2 owner | G3 evidence | G4 inputs | G5 human | G6 missing/stale | G7 determ. | G8 vectors | G9 retro | G10 burden | G11 lifecycle | **Classification** |
|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|---|
| **CAND-0001** NEWS2 | F | F | F | F | F | F | U | F | F | F | F | **DEFER** |
| **CAND-0002** MEWS | F | F | F | F | F | F | U | F | F | F | F | **DEFER** |
| **CAND-0003** SOFA | F | F | F | F | F | F | U | F | F | F | F | **DEFER** |
| **CAND-0004** qSOFA | F | F | F | F | F | F | U | F | F | F | F | **DEFER** |
| **CAND-0005** ventilator (stub) | F | F | F | F | F | F | U | F | F | F | F | **RESEARCH** |
| **CAND-0006** 11 unnamed pathways | F | F | F | **U** | F | F | U | F | F | F | F | **RESEARCH** |
| **CAND-0007** 959-rule catalog | F | F | F | **U** | F | F | U | F | F | F | F | **RESEARCH** |
| **CAND-0008** score alert rules | F | F | F | F | F | F | U | F | F | F | F | **DEFER** |
| **CAND-0009** bed-grid severity | F | F | F | F | F | F | U | F | F | F | F | **REJECT** (as a pathway candidate) |
| **Column totals** | 9F | 9F | 9F | 7F 2U | 9F | 9F | 9U | 9F | 9F | 9F | 9F | **0 PASS / 99** |

**Read the columns, not only the rows.** Eight of eleven gates fail **uniformly** for every
candidate. That is the load-bearing structural finding of this assessment: **today's blockers
are almost entirely programme-level, not candidate-level.** No amount of candidate selection,
re-scoping, or clinical cleverness moves any of those eight columns. They are moved by naming
humans (G2, G5, G11), by obtaining a source (G4), by obtaining data and a site (G9, G10), and
by authoring V2 artifacts (G6, G8).

> **Cycle-1 note (2026-08-15):** the matrix above is the cycle-0 record and is preserved
> unchanged. Cycle-1 verdict movements (gates 3, 6, 7, 8 only, to PARTIAL at most) and the
> gate posture of the new candidates CAND-0010..0020 are in §7. Zero cells are PASS.

**INFERENCE — the practical consequence.** Because the blockers are columnar, *ranking
candidates against each other today would produce information of no decision value*: every
candidate is blocked by the same things, in the same way, to the same degree. This is an
independent argument — beyond the unratified weights — for why `portfolio-method.md` records
execution as **BLOCKED** rather than running the MCDA on placeholder weights.

---

## 2. Gate-by-gate detail — one line of evidence per cell

### 2.1 Gate 1 — "It fits the approved intended use and population." (`PROMPT:291`)

**Verdict for all nine: `FAIL`. Not because of demonstrated misfit — because there is no
approved intended use to fit.** `intended-use-statement.md` front matter reads
`status: PROPOSAL`, `approver: UNASSIGNED — VALIDATION REQUIRED`, and its line 36 states
"**STATUS: PROPOSAL — NOT APPROVED.**" Gate G0 does not close without a named intended-use
approver (`PROMPT:248`).

| Candidate | Verdict | Evidence (one line) |
|---|:--:|---|
| CAND-0001 NEWS2 | FAIL | No approved intended use exists (`intended-use-statement.md:36-44`); additionally the adult/paediatric boundary this adult instrument depends on is **BLOCKING undecided** (IU-06, VAL-0006/0007). |
| CAND-0002 MEWS | FAIL | As CAND-0001; same adult-instrument dependency on the unresolved population boundary. |
| CAND-0003 SOFA | FAIL | As CAND-0001; additionally ECMO/CRRT sub-population — whose physiology may invalidate organ-score assumptions — is neither included nor excluded (`intended-use-statement.md:227-236`, VAL-0010). |
| CAND-0004 qSOFA | FAIL | As CAND-0001; additionally its published use is conditioned on suspected infection, a condition of use no approved intended-use statement addresses. |
| CAND-0005 ventilator | FAIL | As CAND-0001; and no clinical problem or population is documented for it at all (`LEGACY-TA:117`), so fit cannot be argued even informally. |
| CAND-0006 unnamed set | FAIL | As CAND-0001; fit cannot be assessed for unenumerated content, and unenumerated content cannot be declared to fit an unapproved scope. |
| CAND-0007 959 catalog | FAIL | As CAND-0001; `LEGACY-TA:769-777` (IC-015) records that the legacy catalog's breadth **exceeded** its validated product model — the precise failure this gate exists to prevent. |
| CAND-0008 alert rules | FAIL | As CAND-0001; alert phrasing is where advisory content most easily becomes directive, and the advisory boundary is unratified (VAL-0011). |
| CAND-0009 bed-grid | FAIL | As CAND-0001; its legacy realization actively contradicted intended use by rendering unmeasured beds as `normal` (`LEGACY-TA:478`). |

### 2.2 Gate 2 — "A qualified clinical owner is named." (`PROMPT:292`)

**Verdict for all nine: `FAIL`. This gate fails identically and unambiguously for every
candidate.** `AUTH-CLINSAFETY` is `UNASSIGNED — VALIDATION REQUIRED` (`authority-model.md:28`),
recorded as OPEN. `g1-validation-backlog.md` VAL-0002 records it as blocking. `LEGACY-TA:125`
additionally records that the *legacy* clinical sign-off's approver "CRM/institution is not
verifiable" — so no inherited owner exists either.

| Candidate | Verdict | Evidence (one line) |
|---|:--:|---|
| CAND-0001 … CAND-0009 (all) | FAIL | `AUTH-CLINSAFETY` = `UNASSIGNED — VALIDATION REQUIRED` (`authority-model.md:28`); no candidate has a named clinical owner, and `decision-rights.md` forbids an agent supplying one. |

**This single row is sufficient, on its own, to make the implementable portfolio empty.**
Every other gate could be satisfied and this one would still hold the portfolio at zero.

### 2.3 Gate 3 — "Evidence provenance and applicability are documented." (`PROMPT:293`)

| Candidate | Verdict | Evidence (one line) |
|---|:--:|---|
| CAND-0001 NEWS2 | FAIL | No guideline citation, publisher, version, or applicability statement exists in any evidence input (INV-GAP-5); `LEGACY-TA:489` records legacy guideline references as "documented as weak or pending refinement." |
| CAND-0002 MEWS | FAIL | As CAND-0001; no provenance documented. |
| CAND-0003 SOFA | FAIL | As CAND-0001; applicability to the (undecided) population and to ECMO/CRRT physiology is undocumented. |
| CAND-0004 qSOFA | FAIL | As CAND-0001; and the applicability question is sharper — the legacy assessment never mentions infection or sepsis at all (INV-GAP-3). |
| CAND-0005 ventilator | FAIL | No evidence of any kind is documented for a stub (`LEGACY-TA:117`). |
| CAND-0006 unnamed set | FAIL | 12 pathways carried **2 rationale records** in total (`LEGACY-TA:582`), which the assessment itself reads as "limited rationale coverage." |
| CAND-0007 959 catalog | FAIL | `LEGACY-TA:42` lists "formal clinical provenance of each rule" under **"Investigate before reuse"**; `LEGACY-TA:847` disposition is `Investigate`. |
| CAND-0008 alert rules | FAIL | No external authority for severity mapping; `LEGACY-TA:123` records **two conflicting severity vocabularies**, unresolved (VAL-0032). |
| CAND-0009 bed-grid | FAIL | A display-state derivation with no external clinical authority of any kind. |

**Boundary note.** This gate asks whether provenance is **documented**, not whether the
evidence is **good**. Grading evidence quality is the clinical evidence methodologist's task
and is expressly outside this phase (`decisions_prohibited`). Every cell above is a
documentation finding, not an evidence grade.

**Cycle-1 update (2026-08-15):** FAIL → **PARTIAL** for CAND-0001..0004 (source-verified
formulas and primary citations now documented in review records and, for NEWS2/SOFA,
0.x precursors); remains FAIL for all others — see §7.1.

### 2.4 Gate 4 — "Required inputs have defined semantics, units, timing, identity, encounter, provenance, and data-quality policies." (`PROMPT:294`)

**This is the gate the AMH hard constraint acts on.** Full per-input detail is in
`pathway-to-source-matrix.yaml`; the one-line verdicts follow.

| Candidate | Verdict | Evidence (one line) |
|---|:--:|---|
| CAND-0001 NEWS2 | FAIL | All seven inputs are vital signs; the AMH IG's **only** Observation profile pattern-fixes `category` to `laboratory`, so a conformant instance **cannot** carry vitals (`AMH-CF §3.2`) — plus no freshness window (VAL-0023), no pinned codes (`contracts.lock.draft.yaml:165-167`), and unresolved identity/encounter semantics (`HAZ-0001`, `HAZ-0002`). |
| CAND-0002 MEWS | FAIL | As CAND-0001 — all five inputs are vital signs or a bedside neurological assessment. |
| CAND-0003 SOFA | FAIL | Doubly blocked: laboratory Observation is `bloqueado` with a **0-row** Bronze source (`AMH-CF §3.1`), the unblocking plan would deliver `valueString` free text rather than a coded UCUM quantity (contradiction C-4), and the vital-sign and consciousness components are blocked by `AMH-CF §3.2`; vasoactive dose and urine output have **no identified contract at all**. |
| CAND-0004 qSOFA | FAIL | Three physiological inputs blocked as CAND-0001; the infection-suspicion gate has **no identified source of any kind**. |
| CAND-0005 ventilator | FAIL | No input set is documented, and no device/ventilator contract has been inventoried; AMH's IoT-vitals claim is an unresolved contradiction (C-1, `AMH-CF §3.2`) with no populated feed asserted anywhere. |
| CAND-0006 unnamed set | **UNKNOWN** | Inputs are unenumerated (INV-GAP-1). Some members might depend only on encounter/condition data, for which AMH has declared (Layer-1) profiles — that cannot be ruled in or out without enumeration. **This is a genuine UNKNOWN, not a soft FAIL.** |
| CAND-0007 959 catalog | **UNKNOWN** | As CAND-0006 (INV-GAP-2). |
| CAND-0008 alert rules | FAIL | Its true input is a *(value, evaluation-status)* pair; the evaluation-status contract exists only as PROPOSAL (`evaluation-status-semantics.md`) and the per-input policy that populates it is OPEN (VAL-0023). |
| CAND-0009 bed-grid | FAIL | Inherits every score's input failure, and adds one of its own: bed/unit assignment has no verified source (`LEGACY-TA:324`; `HAZ-0004`). |

**`PROMPT:415` is decisive here:** "A missing authoritative source, code, unit,
patient/encounter link, timestamp, freshness policy, correction behavior, or representative
population measurement makes the input **ineligible for actionable evaluation**." Every
`FAIL` above is missing *several* of those, not one.

**Cycle-1 update (2026-08-15): gate 4 verdicts do NOT improve.** The AMH evidence has not
changed — zero populated observations, no vital-signs profile (`AMH-CF §3.1/§3.2`). The
CAND-0006 UNKNOWN is resolved to **FAIL** by enumeration (a determination, not a
weakening) — see §7.5.

### 2.5 Gate 5 — "The workflow has an actionable, accountable human response." (`PROMPT:295`)

**Verdict for all nine: `FAIL`.** No intended user has been observed; no responder is named.

| Candidate | Verdict | Evidence (one line) |
|---|:--:|---|
| CAND-0001 … CAND-0009 (all) | FAIL | Who monitors, who acts, who owns escalation and who closes work are all OPEN (`g1-validation-backlog.md` VAL-0012–VAL-0016), escalation ownership is rated "**very low confidence**" (VAL-0014), no stakeholder interview or workflow observation has ever been performed (`LEGACY-TA:56`), and ownership across shift change and downtime was an **unanswered** legacy open question (`LEGACY-TA:1000`). |
| CAND-0005 ventilator (additional) | FAIL | A stub has no response to be accountable for. |
| CAND-0009 bed-grid (additional) | FAIL | Its principal effect is *de-prioritization*, for which no accountable human response is even conceptually defined. |

### 2.6 Gate 6 — "Missing, stale, conflicting, duplicate, corrected, and out-of-order behavior is explicit and safe." (`PROMPT:296`)

**Verdict for all nine: `FAIL`.** V2 has a *vocabulary* (`evaluation-status-semantics.md`,
five states, PROPOSAL) but no *per-candidate policy*, and the vocabulary alone does not
satisfy this gate.

| Candidate | Verdict | Evidence (one line) |
|---|:--:|---|
| CAND-0001 NEWS2 | FAIL | Per-input freshness windows and the invalidate-vs-degrade rule are OPEN (VAL-0023; legacy open question `LEGACY-TA:999`); the only evidenced behavior in this domain is the legacy `0`-for-absent defect (`LEGACY-TA:474`, `HAZ-0005`). |
| CAND-0002 MEWS | FAIL | As CAND-0001, and worse-evidenced: legacy returned `0` **with `missing_components` metadata** (`LEGACY-TA:473`) — the absence was known and still not surfaced as status. |
| CAND-0003 SOFA | FAIL | As CAND-0001 (`LEGACY-TA:475`); additionally requires a mixed-cadence policy (labs vs. vitals) that does not exist anywhere. |
| CAND-0004 qSOFA | FAIL | As CAND-0001 (`LEGACY-TA:476`). |
| CAND-0005 ventilator | FAIL | No logic exists for which behavior could be defined. |
| CAND-0006 unnamed set | FAIL | Engine-level defects documented (best-effort evaluation leaving pathway state stale after committed scores, `LEGACY-TA:384`; load failures absent from readiness, `LEGACY-TA:490`); no V2 policy exists. |
| CAND-0007 959 catalog | FAIL | `LEGACY-TA:488`: domain definitions and pathway YAML "use different schemas and validation coverage" — not one governed body of content. |
| CAND-0008 alert rules | FAIL | Suppression/cooldown state could drift and was not auditable (`LEGACY-TA:494`, `LEGACY-TA:308`; `HAZ-0022`); no V2 policy exists. |
| CAND-0009 bed-grid | FAIL | The confirmed legacy behavior is precisely the unsafe one this gate forbids (`LEGACY-TA:478`). |

**Cycle-1 update (2026-08-15):** FAIL → **PARTIAL** for CAND-0001 and CAND-0003
(missing/stale/invalid behavior now *specified* in the NOT ACTIONABLE precursors and
drafted in ADR-0008/ADR-0026, both `proposed`); remains FAIL elsewhere — see §7.2.

### 2.7 Gate 7 — "The logic is deterministic and explainable, or any non-determinism has a separately approved validation plan." (`PROMPT:297`)

**Verdict for all nine: `UNKNOWN` — and this is the one column where `UNKNOWN` is the honest
verdict rather than a euphemism.**

**Why not `PASS`:** the four named scores are deterministic arithmetic *as published
instruments*, but this gate asks about **the logic**, and **V2 contains no clinical logic** —
the V2 repository has no source code as of 2026-08-14 (`hazard-log.md:72-73`). Determinism
is a property of an implementation, not of an intention. Awarding `PASS` on the strength of
"the instrument is arithmetic" would be exactly the gate-weakening `PROMPT:303` forbids.

**Why not `FAIL`:** nothing establishes that a future V2 implementation would be
non-deterministic or unexplainable. The legacy assessment records deterministic versioned
scores with 16 passing property tests (`LEGACY-TA:579`, `LEGACY-TA:813`) — evidence that the
determinism half is achievable — while also recording that the *explainability* half was not
achieved: "No immutable evaluation record captures why a rule did **not** run or did not
fire" (`LEGACY-TA:486`; `HAZ-0021`).

| Candidate | Verdict | Evidence (one line) |
|---|:--:|---|
| CAND-0001 … CAND-0005, CAND-0008, CAND-0009 | UNKNOWN | No V2 logic artifact exists to assess; legacy determinism evidence exists (`LEGACY-TA:813`) but legacy explainability was incomplete (`LEGACY-TA:486`), and neither may be inherited (`legacy-import-policy.md` §1). |
| CAND-0006, CAND-0007 | UNKNOWN | Unenumerated content could include non-deterministic or non-declarative logic; the legacy engine did precompile criteria and avoid arbitrary `eval`/`exec` (`LEGACY-TA:252`), but that is an engine property, not a per-rule property. |

**This is the cheapest column to convert.** It becomes `PASS` for a given candidate the
moment V2 authors that candidate's logic declaratively **and** implements a no-fire/why-not
evaluation record. It requires no AMH act, no site, and no data. It is therefore the natural
first engineering target — but converting it alone changes nothing about admissibility,
because ten other gates remain.

**Cycle-1 update (2026-08-15):** the predicted conversion has partially happened:
UNKNOWN → **PARTIAL** for CAND-0001 and CAND-0003, whose logic now exists declaratively as
0.x precursor specifications with drafted pt-BR+EN explanation text and no-fire reason
codes — authored, un-reviewed, unimplemented; remains UNKNOWN elsewhere — see §7.3.

### 2.8 Gate 8 — "Boundary, exception, negative, delayed-data, and failure test vectors exist." (`PROMPT:298`)

**Verdict for all nine: `FAIL`.**

| Candidate | Verdict | Evidence (one line) |
|---|:--:|---|
| CAND-0001 … CAND-0009 (all) | FAIL | **V2 has no tests and no code** (`hazard-log.md:72-73`); and the legacy vector evidence that might be pointed to is discredited by its own gate — `LEGACY-TA:584`: all nine domain YAML lacked `alert_groups`, the coverage gate then reported "All 0" pass, "**False-green gate; validates nothing**" (`HAZ-0031`), while `LEGACY-TA:599` records that **no** clinical stale/missing vectors were found at all. |

**INFERENCE:** this gate is the one most likely to be *falsely* claimed in future, because
"we have test vectors" is easy to assert and the legacy repository contains files that look
like vectors. `LEGACY-TA:584` is the standing counter-evidence: a passing gate that validated
zero cases. Any future claim against gate 8 must state the **number of cases actually
executed** and the **missing/stale/boundary cases among them**.

**Cycle-1 update (2026-08-15):** FAIL → **PARTIAL** for CAND-0001 and CAND-0003: 89 + 34
(+18 GCS-component) DRAFT clinical reference vectors now exist on paper, including the
boundary/missing/invalid classes this gate demands — but **zero have been executed** (no
code, no CI) and authorship independence is NOT satisfied. Stated per this section's own
discipline: cases actually executed = **0**. See §7.4.

### 2.9 Gate 9 — "Retrospective validation is feasible with representative data and defined endpoints." (`PROMPT:299`)

**Verdict for all nine: `FAIL`.** Both halves fail independently.

| Candidate | Verdict | Evidence (one line) |
|---|:--:|---|
| CAND-0001 … CAND-0009 (all) | FAIL | **No representative data:** no site has been identified or contacted (VAL-0039, OBSERVED), only AMH `dev` is provisioned with `stg`/`prod`/`dr` non-existent (`AMH-CF §4.4`), and populated-data evidence is `NO_OBSERVED_EVIDENCE` (`contracts.lock.draft.yaml:469-474`). **No defined endpoints:** the pre-registered clinical definition of "deterioration" and its adjudication rubric do not exist (VAL-0036), and the lawful basis for outcome adjudication is undetermined (VAL-0037). |

**`success-and-harm-metrics.md` SM-03 adds a constraint that will bind even after data
exists:** precision and recall must be computed **only over valid patient-time**. **INFERENCE:**
under today's source conditions a candidate would spend essentially *all* patient-time in
`not_evaluated`, so its valid-patient-time denominator would approach zero — a retrospective
validation would be not merely infeasible but *undefined*.

### 2.10 Gate 10 — "Alert burden and interaction risks can be measured." (`PROMPT:300`)

**Verdict for all nine: `FAIL`.**

| Candidate | Verdict | Evidence (one line) |
|---|:--:|---|
| CAND-0001 … CAND-0009 (all) | FAIL | No pre-V2 baseline for alert burden, fatigue, or interruption exists (VAL-0035), no alert-rate figure is documented anywhere (`LEGACY-TA:1002`, unanswered), no telemetry exists (V2 has no code), and no site exists to measure in (VAL-0039). |

**Schedule-critical, and it is the only gate with an irreversible deadline.**
`g1-validation-backlog.md` VAL-0035: "**Baselines are unobtainable once V2 is deployed.**"
**INFERENCE:** every other gate can be closed late at the cost of delay; this one can be
closed only *before* deployment or **never**. It should be sequenced first among the
measurement items in `g2-validation-backlog.md` for that reason alone.

### 2.11 Gate 11 — "Versioning, rollback, surveillance, and retirement responsibilities are funded." (`PROMPT:301`)

**Verdict for all nine: `FAIL`.** The word in this gate is **funded** — a resourcing
commitment, not a design intention.

| Candidate | Verdict | Evidence (one line) |
|---|:--:|---|
| CAND-0001 … CAND-0009 (all) | FAIL | No owner exists to hold the responsibility (`authority-model.md:27-34`, all `UNASSIGNED`), no signed rule-release registry or bundle process exists in V2, no surveillance or retirement cadence is defined, and no funding decision is recorded anywhere in this repository. |
| CAND-0007 (additional) | FAIL | A 959-rule catalog implies a re-validation and evidence-surveillance obligation whose magnitude is itself unestimated; `LEGACY-TA:881`: "A large rule catalog is not a product until its inputs, evidence, workflow, and outcomes are validated." |

**Legacy counter-evidence that this gate is real:** `LEGACY-TA:487` — score versions were
"strings in code rather than a signed release registry tied to approved evidence and test
packs"; `LEGACY-TA:719-727` (IC-010) — multiple engine instances, legacy fallback, best-effort
boot sync, load failures absent from health (`HAZ-0019`, `HAZ-0020`).

---

## 3. Classification and rationale, per candidate

| Candidate | Classification | Rationale (why this label and not the others) |
|---|---|---|
| **CAND-0001 NEWS2** | **DEFER** | Specified enough to assess, so not `RESEARCH`. Not `REJECT` — an aggregate early-warning score is a coherent, plausible ICU candidate and nothing in evidence condemns it. Not `VALIDATE` as the *primary* label, because the binding constraint is **outside this programme**: all seven inputs are vital signs and `AMH-CF §3.2` establishes that AMH's only Observation profile *structurally excludes* them, requiring "a new profile to be authored, published, versioned and populated." **VALIDATE-track work is nevertheless authorized in parallel** (evidence dossier, input specification, freshness policy) — see §5. |
| **CAND-0002 MEWS** | **DEFER** | As CAND-0001. **Additional note for the future portfolio (not a rejection):** CAND-0002's inputs are a near-subset of CAND-0001's, so under `PROMPT:326`'s remove-one-and-recheck procedure this pair is the first place a future optimizer should look for over-selection. That is a *selection* judgement and is expressly not made here. |
| **CAND-0003 SOFA** | **DEFER** | As CAND-0001, with the strongest source blockage in the inventory: laboratory Observation is blocked by an empty Bronze source, and the announced unblocking path would deliver `valueString` free text — `AMH-CF §3.1`: "**No ICU scoring rule … can consume a `valueString`.**" Vasoactive dose and urine output have no contract at all. Deferral here depends on *two* AMH-owner acts, not one. |
| **CAND-0004 qSOFA** | **DEFER** | As CAND-0001 for its three physiological inputs. **Flagged for the evidence methodologist:** its published condition of use (suspected infection) has no identified source, so any future proposal to run it on an undifferentiated population is a **different pathway requiring separate evidence** (`PROMPT:418`), not a configuration of this one. |
| **CAND-0005 ventilator (stub)** | **RESEARCH** | Not `DEFER` — deferral presumes a specified candidate, and there is nothing to defer: the only documented fact is that it is a stub (`LEGACY-TA:117`). Not `REJECT` — ventilation surveillance is not condemned by any evidence; it is simply undefined. The required work is *definition*, which is `RESEARCH` by the §0.3 vocabulary. |
| **CAND-0006 11 unnamed pathways** | **RESEARCH** | The candidates are not identified (INV-GAP-1). No other classification can be honestly applied to content nobody has enumerated. Required work: a scoped read-only enumeration pass with provenance and **no content import** (`g2-validation-backlog.md` G2-VAL-0002). |
| **CAND-0007 959-rule catalog** | **RESEARCH** | As CAND-0006 (INV-GAP-2), and consistent with the legacy assessment's own disposition, `Investigate` (`LEGACY-TA:847`). **Enumeration is necessary but not sufficient** — `LEGACY-TA:881`. |
| **CAND-0008 score alert rules** | **DEFER** | Cannot be admitted independently of the scores it wraps, all of which are `DEFER`. **Its specification work should not wait**, however: the *(value, evaluation-status)* input contract and the suppression-auditability requirement are V2-internal and blocked on nothing external. |
| **CAND-0009 bed-grid severity** | **REJECT** *(as a pathway portfolio candidate)* | The only `REJECT` in this assessment, and it is a **scope** judgement, not a dismissal. It is a presentation-state derivation with no external clinical authority; admitting it to a *pathway* portfolio would route a UX/status-rendering requirement through a clinical-content approval process where it does not belong, and would let the portfolio count absorb something that is not a pathway. **It must be specified instead as a V2 status-rendering requirement** under `evaluation-status-semantics.md` / `status-dimensions.md`, jointly owned by `AUTH-UX` + `AUTH-CLINSAFETY`. **Rejecting it here increases safety obligation rather than reducing it** — `HAZ-0005` and `intended-use-statement.md:319-323` make false reassurance a first-class hazard that must be designed against regardless of the portfolio's contents. |

### 3.1 Distribution

| Classification | Count | Candidates |
|---|:--:|---|
| `RESEARCH` | 3 | CAND-0005, CAND-0006, CAND-0007 |
| `VALIDATE` | 0 | — (no candidate's binding constraint is validation alone; see §3.2) |
| `DEFER` | 5 | CAND-0001, CAND-0002, CAND-0003, CAND-0004, CAND-0008 |
| `REJECT` | 1 | CAND-0009 |
| **Admitted to the implementable portfolio** | **0** | **—** |

### 3.2 Why zero candidates are classified `VALIDATE`

`VALIDATE` (§0.3) means the binding constraint is clinical/evidence work that can begin now.
**No candidate qualifies, because for every specified candidate the source blockage is
binding and external.** Recording a candidate as `VALIDATE` would imply that completing
clinical validation would make it admissible — it would not: a fully validated NEWS2 with a
named owner and a complete evidence dossier would **still** fail gate 4, because AMH cannot
supply its inputs. **Labelling by the constraint that actually binds is the point of the
vocabulary.** This is recorded explicitly so that a future reader does not mistake the empty
`VALIDATE` row for an oversight.

---

## 4. The plain statement required of this assessment

1. **Zero candidates are currently implementable-actionable.** Not "few". Not "pending minor work". Zero, on eleven gates, for all nine candidates.
2. **Gate 2 fails for every candidate** because no clinical owner exists anywhere in this programme. This is a staffing fact, not an analytical one, and no analysis can resolve it.
3. **Gate 4 fails or is unknown for every observation-dependent candidate**, because AMH laboratory Observation is blocked at an empty source and the IG's only Observation profile *structurally excludes* vital signs. This is `PROMPT:417`'s hard portfolio constraint, re-verified at the pinned commit by `AMH-CF §3`.
4. **No gate was weakened, and no candidate was scoped down to fit through one.** Where a gate could have been read leniently (gate 7's "deterministic"), it was recorded `UNKNOWN` with the reasoning shown.
5. **A portfolio of size zero is a legitimate, prompt-sanctioned outcome** (`PROMPT:324`), and it is the outcome the evidence supports **today**. It is a status report on evidence, not a verdict on any candidate's clinical worth.
6. **Nothing here is a decision.** `AUTH-CLINSAFETY` and the G2 committee decide; this document is input to them.

---

## 5. What would change these verdicts, in dependency order

**PROPOSAL.** Ordered detail, with owner roles, is in `g2-validation-backlog.md`.

| Order | Change | Gates it moves | Blocked on |
|---|---|---|---|
| 1 | Name `AUTH-CLINSAFETY` and `AUTH-INTENDED-USE` | G2; unblocks G1, G5, G11 | A staffing decision — nothing else |
| 2 | Approve the intended-use statement incl. the paediatric/neonatal BLOCKING decision | G1 | Order 1 |
| 3 | Enumerate CAND-0006 / CAND-0007 (read-only, provenance, no import) | G4 `UNKNOWN` → determinate | Nothing external; a scoped task |
| 4 | AMH owners resolve contradiction C-1 (vital signs) and C-4 (Observation shape/conformance) | G4 | **AMH-owner act — outside this programme** (`AMH-CF §5`) |
| 5 | Author V2 candidate logic declaratively **with a no-fire/why-not evaluation record** | G7 | Orders 1–2 (clinical content needs an owner) |
| 6 | Ratify per-input freshness windows and the invalidate-vs-degrade rule (VAL-0023) | G6 | Order 1 |
| 7 | Author boundary/missing/stale/delayed/failure vectors and require them in CI as blocking | G8 | Order 5 |
| 8 | Identify a site, a sponsor, a lawful basis, and **measure the pre-V2 baseline** | G9, G10 | Orders 1–2; **irreversible deadline — before deployment** |
| 9 | Fund versioning, rollback, surveillance and retirement | G11 | A budget decision |

**INFERENCE:** orders 1, 3, 5, 6 and 7 are within this programme's control. Order 4 is not,
and it alone gates every observation-dependent candidate. **A programme plan that treats
order 4 as a V2 engineering task will mis-schedule the entire clinical portfolio**
(`AMH-CF §5`: "The critical path for V2's AMH compatibility runs primarily through AMH, not
through V2 engineering").

## 6. Cross-references

- `candidate-inventory.md` — the nine candidates and their §6.1 fields.
- `pathway-to-source-matrix.yaml` / `.md` — the per-input evidence behind every gate-4 verdict.
- `portfolio-method.md` — what happens *after* a candidate passes all eleven gates.
- `g2-validation-backlog.md` — ordered work, with owner roles, and the candidate hazards.
- `../../08-interoperability/amh-data/compatibility-finding.md` — the hard constraint.

---

## 7. Cycle-1 assessment update (2026-08-15)

> **PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).**
> This section supplements the cycle-0 assessment; §§0–6 are preserved unchanged as the
> 2026-08-14 record. Evidence base: the cycle-1 source-verified review corpus
> (`../legacy-review/`, citation shorthand `LR:` and `PATH-IDX` per
> `candidate-inventory.md` §8.0), the three rule-release precursors
> (`../rule-releases/{news2,sofa,gcs}/`, shorthand `RR:`), and the ADR drafts cited by ID.
>

> **[DECISÃO REGISTRADA 2026-08-15 — GDEC-0007, item P-1]** Os movimentos de gate desta
> seção (G3/G6/G7/G8 FAIL→PARTIAL; G4 FAIL; contagem acionável 0) foram **ratificados
> como revisados** pelo revisor clínico nomeado (rodaquino-OMNI, GDEC-0003), conforme
> `../cycle-1-review-decision-sheet.md` §12 P-1 e
> `../../00-governance/registers/decision-register.md` GDEC-0007. PARTIAL continua **não
> contando** para admissão; a contagem acionável permanece **0**. O front matter permanece
> PROPOSAL por convenção (evidence-notation §2 regra 3); o registro mestre é o
> decision-register.
> **Language-policy note (DEC-G0-10 / GDEC-0006):** written in English for coherence with
> the cycle-0 file it extends; the tension is recorded here once (see
> `candidate-inventory.md` §8 header).

### 7.0 Verdict-vocabulary extension: `PARTIAL`

Cycle-1 evidence sits between §0.2's FAIL and PASS: artifacts now exist that address a
gate's condition, but they are **un-reviewed PROPOSAL artifacts** (author ≠ approver not
satisfied; no named clinical owner; no runtime). This section therefore uses one additional
verdict:

| Verdict | Definition | Discipline |
|---|---|---|
| `PARTIAL` | An artifact addressing the gate condition **exists on disk and is cited**, but the gate condition is **not met**: the artifact is a 0.x / DRAFT / `proposed` PROPOSAL, pending named clinical review, with no execution evidence. | **PARTIAL is not PASS and never counts toward admission.** It may never be awarded above what un-reviewed PROPOSAL artifacts justify. Movements are restricted to gates 3, 6, 7, 8; gate 4 is expressly excluded (§7.5). |

No gate is weakened by this addition: every PARTIAL below was FAIL or UNKNOWN and would
remain so under §0.2's binary vocabulary; the added value is only that the blocking work
is now *named and citable* instead of nonexistent.

### 7.1 Gate 3 (evidence provenance documented) — FAIL → PARTIAL for CAND-0001..0004

| Candidate | Cycle-0 | Cycle-1 | Evidence (one line) |
|---|:--:|:--:|---|
| CAND-0001 NEWS2 | FAIL | **PARTIAL** | Implemented bands source-verified against the issuer-verified RCP NEWS2 (2017) definition (`LR:ews/news2-review.md`); RULE-NEWS2 0.1.0 precursor carries primary citations (`RR:news2/specification.md`). Applicability to the (still unapproved) population remains undocumented. |
| CAND-0002 MEWS | FAIL | **PARTIAL** | Variant identified and compared against the Subbe 2001 citation V1 itself claims (`LR:ews/mews-review.md`); **primary Table 1 remains unretrieved (paywalled)** — SOURCE-level verification outstanding, so this PARTIAL is the weakest of the four. |
| CAND-0003 SOFA | FAIL | **PARTIAL** | Components source-verified against Vincent 1996 and Sepsis-3 (`LR:sepsis-scores/sofa-review.md` §8); RULE-SOFA v0.1.0 precursor with primary citations (`RR:sofa/specification.md`). |
| CAND-0004 qSOFA | FAIL | **PARTIAL** | Cut-points verified numerically exact to Sepsis-3, with the mandatory post-2021 SSC standing analysis (`LR:sepsis-scores/qsofa-review.md` §§2, 6). No precursor authored. |
| CAND-0005..0009, CAND-0010..0020 | FAIL | FAIL | For the twelve pathways, 12/12 file-level citations now exist and are DOI-audited (8 MATCH / 1 BROKEN / 1 MISMATCH / 1 PARTIAL — `PATH-IDX` §4), but **"a citation at the file level is not threshold provenance"** (`PATH-IDX` §4 INFERENCE): no band or cut-point carries its own citation. Documented ≠ satisfied; verdict unmoved. |

### 7.2 Gate 6 (missing/stale/conflicting behavior explicit and safe) — FAIL → PARTIAL for CAND-0001, CAND-0003

| Candidate | Cycle-0 | Cycle-1 | Evidence (one line) |
|---|:--:|:--:|---|
| CAND-0001 NEWS2 | FAIL | **PARTIAL** | RULE-NEWS2 0.1.0 specifies missing-input behavior (any missing input → `not_evaluated`/`partial` per policy, never 0; standing HAZ-0005 regression vector CRV-NEWS2-0102: all seven inputs absent → **no total, never 0**) — `RR:news2/`; policy algebra drafted in ADR-0008 and per-score-class policy in ADR-0026 (both `proposed`). |
| CAND-0003 SOFA | FAIL | **PARTIAL** | RULE-SOFA v0.1.0 + the §7 partial-SOFA analysis (`LR:sepsis-scores/sofa-review.md` §7): never sum a labs-only partial; `not_evaluated` with `missing_required_input:<component>` until all six components have evidenced in-window sources — feeds ADR-0008 directly. |
| All others | FAIL | FAIL | No precursor specifies their behavior; per-input freshness windows (VAL-0023) and the invalidate-vs-degrade rule remain OPEN; ADR-0008/0026 are drafts, not ratified policy. The newly enumerated pathways make this gate *worse*-evidenced, not better: the trilhas engine renders missing input as silent "normal", **tested as intended behavior**, and its severity vocabulary has no "not evaluated" member (`PATH-IDX` §6). |

**Why PARTIAL and not PASS:** the gate demands behavior that is explicit **and safe** —
safety here is a clinical judgement that only a named reviewer can make of a PROPOSAL
specification, and no per-candidate freshness/conflict/correction policy is ratified.

### 7.3 Gate 7 (deterministic and explainable) — UNKNOWN → PARTIAL for CAND-0001, CAND-0003

| Candidate | Cycle-0 | Cycle-1 | Evidence (one line) |
|---|:--:|:--:|---|
| CAND-0001 NEWS2 | UNKNOWN | **PARTIAL** | Deterministic declarative logic now exists as an authored artifact (RULE-NEWS2 0.1.0), with drafted explanation text and no-fire/why-not reason codes (`insufficient_data`, per-parameter `missing_required_input:*`) in the vector set — `RR:news2/`. No runtime implementation exists; nothing has ever executed. |
| CAND-0003 SOFA | UNKNOWN | **PARTIAL** | RULE-SOFA v0.1.0 + machine-readable `RR:sofa/logic.yaml`; explanation text drafted (pt-BR terminology validation itself pending ADR-0029). Same caveat: authored, not implemented. |
| All others | UNKNOWN | UNKNOWN | For CAND-0010..0020 the *legacy* definitions are declarative and deterministic at file level, but the engine that gave them meaning is proposed SUPERSEDE and legacy explainability was never achieved (no no-fire record); V2 logic for them does not exist. §0.2's reasoning stands: determinism is a property of an implementation. |

### 7.4 Gate 8 (test vectors exist) — FAIL → PARTIAL for CAND-0001, CAND-0003

**SOURCE** `RR:news2/reference-vectors.md` (89 vectors), `RR:sofa/reference-vectors.md`
(34 vectors), `RR:gcs/reference-vectors.md` (18 vectors, supporting the consciousness
component, not a candidate of its own): **141 DRAFT clinical reference vectors** spanning
boundary, missing-input, invalid-enumeration, and legacy-defect regression classes —
including the HAZ-0005 standing vectors (all-inputs-absent must yield `not_evaluated`,
never a numeric total).

**Why PARTIAL and not PASS, stated bluntly:** (1) every vector is `status: DRAFT`/PROPOSAL;
(2) **authorship independence is NOT satisfied** — vector author = specification author,
exactly the self-confirmation risk this gate exists to catch; (3) **zero vectors have been
executed** — V2 still has no code and no CI, so the §2.8 discipline applies: number of
cases actually executed = 0. All other candidates: FAIL unchanged (the only pathway-level
legacy vectors remain the sepse parity suite, 31 vectors, sepse only — `PATH-IDX` §3).

### 7.5 Gate 4 (input source eligibility) — restated: FAIL, unchanged

**The AMH evidence has not changed.** `AMH-CF §3.1`: laboratory Observation blocked at a
0-row Bronze source, with the announced unblocking path delivering `valueString` free text
("No ICU scoring rule — NEWS2, MEWS, SOFA, qSOFA, or any threshold logic — can consume a
`valueString`"). `AMH-CF §3.2`: the IG's only Observation profile pattern-fixes `category`
to `laboratory`, structurally excluding vital signs. **Zero populated observations are
evidenced for any candidate input** — the same fact the three precursors record as their
own classification: **NOT ACTIONABLE — no evidenced populated source** (`RR:news2/`,
`RR:sofa/`, `RR:gcs/` specifications, front matter and §0).

Movements within FAIL (determinations, not improvements, and not weakenings):

- **CAND-0006 (placeholder): UNKNOWN → FAIL, and the entry is discharged.** Enumeration
  (`PATH-IDX` §1) shows the eleven formerly unnamed pathways' 60 evaluation inputs are
  vitals, laboratory results, medication administrations, and bedside assessments — every
  class AMH cannot supply. The cycle-0 hope that "some members might depend only on
  encounter/condition data" is now disproven. Assessment transfers to CAND-0010..0020.
- **CAND-0007 (959-rule catalog): remains UNKNOWN.** Clusters are enumerated and assigned
  (`LR:00-inventory/coverage-map.md`), but no per-rule input-to-source mapping exists yet;
  honest verdict unchanged.
- **CAND-0010..0020 (new): enter as FAIL** — same unchanged AMH citation, plus (renal)
  the source-verified unit-mismatch lesson (`urine_output_ml_day` feeding a mL/kg/h
  input — `PATH-IDX` §6.5) and (SOFA-hepatic-adjacent) the absent bilirubin conversion
  (`LR:data-quality-physio-calc/README.md`) as standing examples of why gate 4 demands
  more than a nominally existing feed.

### 7.6 The new candidates (CAND-0010..0020) — gate posture and classification

The eleven new candidates (`candidate-inventory.md` §8.4) enter this assessment subject to
the same columnar failures as every cycle-0 candidate: **G1, G2, G5, G9, G10, G11 FAIL**
(no approved intended use, no named owner, no observed workflow, no data, no baseline, no
funding — all programme-level facts unchanged since 2026-08-14) and **G4 FAIL** (§7.5).
Gates 3/6/7 as per §§7.1–7.3 (FAIL/UNKNOWN — no precursor covers them); gate 8 FAIL.

**Classification (PROPOSAL, §0.3 vocabulary):** all eleven are **DEFER** — each is now
specified (source-verified YAML + review record), nothing in evidence condemns the
clinical intent of any of them (the review-level verdicts VALIDATE/TRANSFORM under
`legacy-import-policy.md` §4 are a *different vocabulary* answering "may legacy content
inform a V2 spec?", not "is this admissible?"), and the binding admission constraint for
every one of them is the external AMH source blockage plus unowned governance. None is
`VALIDATE` in §0.3 terms for exactly the §3.2 reason: full clinical validation would still
leave gate 4 failed. None is `REJECT`: the one enumerated pathway that merits REJECT as a
pathway (ventilacao, a stub) is already CAND-0005, whose RESEARCH classification is now
superseded by a source-verified **REJECT-as-pathway proposal** (`PATH-IDX` §7) — a
determination cycle-0 could not make and review must now confirm.

### 7.7 The plain statement, cycle-1 edition

1. **The actionable-pathway count remains ZERO.** Twenty candidate handles, eleven gates:
   **0 PASS cells.** The cycle-1 movements produce PARTIALs on gates 3/6/7/8 for at most
   four candidates, and PARTIAL is not PASS (§7.0).
2. **Gate 2 still fails for every candidate for the same one-line reason** — no named,
   accepted clinical owner for any candidate's content (review assignments to
   rodaquino-OMNI are *reviewer* designations on PROPOSAL artifacts, not owner
   acceptance of a pathway; `authority-model.md` §5 appendix governs, and no CAND has a
   recorded content owner).
3. **Gate 4 fails on unchanged AMH evidence** (§7.5), and it alone still blocks every
   candidate regardless of any other progress — including the three precursors, which say
   so themselves (NOT ACTIONABLE).
4. **What actually moved** is exactly what §5 predicted could move without any external
   act: enumeration (order 3 — done: INV-GAP-1 closed), declarative authoring with
   explanation/no-fire semantics (order 5 — partially done: NEWS2, SOFA), missing-data
   policy drafting (order 6 — drafted, unratified: ADR-0008/0026), and vector authoring
   (order 7 — authored, unexecuted, non-independent).
5. **No gate was weakened.** Every movement is FAIL/UNKNOWN → PARTIAL on gates 3/6/7/8
   only, each with its blocking caveat stated, or UNKNOWN → FAIL (a determination).
6. **Nothing here is a decision.** Every verdict movement is PROPOSAL — AWAITING NAMED
   CLINICAL REVIEW (reviewer: rodaquino-OMNI).
