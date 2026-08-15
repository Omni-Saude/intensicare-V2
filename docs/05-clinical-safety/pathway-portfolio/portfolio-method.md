---
doc_id: PORT-PORTFOLIO-METHOD
title: IntensiCare V2 — Clinical-Pathway Portfolio Selection Method (MCDA)
status: PROPOSAL
label: PROPOSAL
execution_status: BLOCKED — NOT EXECUTED
owner: UNASSIGNED — VALIDATION REQUIRED
approver_role: AUTH-CLINSAFETY + AUTH-PRODUCT + AUTH-UX + AUTH-DATA-PLATFORM + AUTH-OPERATIONS + AUTH-SECURITY (joint ratification, docs/00-governance/authority-model.md:27-33)
validation_status: VALIDATION REQUIRED
source: INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §6.3 (lines 305-328), §6.2 (287-303), §6.4 (330-345), Gate G2 (347-349), §7.2 (397-420)
date_collected: 2026-08-14
last_updated: 2026-08-15
collector: clinical pathway portfolio optimizer (candidate inventory / source-eligibility phase)
provenance:
  source_repo: intensicare-V2
  path_or_url: docs/05-clinical-safety/pathway-portfolio/portfolio-method.md
  commit_sha_or_version: uncommitted (working tree at cb35521)
  section_or_lines: whole document
  date_collected: 2026-08-14
  collector: clinical pathway portfolio optimizer
  transformation: >
    The PROMPT:305-328 multi-criteria decision analysis operationalized into an
    executable procedure. METHOD ONLY. No weight is set, no candidate is scored,
    and no portfolio is selected in this document or in this phase.
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

# Clinical-Pathway Portfolio Selection Method

> ## Status: **METHOD PROPOSAL. EXECUTION BLOCKED.**
>
> This document describes **how** a portfolio would be selected. It does **not** select one,
> score one, weight one, or rank anything.
>
> **Execution is blocked on three independent preconditions, all currently unmet:**
>
> | # | Precondition | State (2026-08-15) | Evidence |
> |---|---|---|---|
> | **P1** | Six owner roles ratify the criterion weights **before** any scoring | **UNMET — all six are `UNASSIGNED`** | `authority-model.md:27-33`; `PROMPT:307` |
> | **P2** | The pathway-to-source eligibility matrix supplies a source-readiness value per candidate | **UNMET in substance — the matrix returns `INELIGIBLE` on 25 of 25 rows** | `pathway-to-source-matrix.yaml`; `PROMPT:420` |
> | **P3** | At least one candidate passes all eleven hard gates | **UNMET — 0 of 9 candidates pass any gate** | `hard-gate-assessment.md` §1 |
>
> **`PROMPT:307` is explicit: owners "ratify weights *before* scoring."** Scoring first and
> seeking ratification afterwards inverts the control and is the specific failure this
> sequencing exists to prevent — weights chosen after seeing scores are rationalizations of a
> preferred answer. **No agent may ratify weights** (`decision-rights.md`;
> `evidence-notation.md:48`).

## 0. Scope, and what this method is for

`PROMPT:305-328` requires "a transparent multi-criteria decision analysis" over the candidate
set, subject to hard gates, uncertainty discipline, overlap penalties and capacity
constraints. This document is that method.

**The method's output is a number, and that number is not chosen in advance.**
`PROMPT:328`: "The output is an evidence-justified number, not a target chosen in advance."
`PROMPT:324`: "Its initial size may legitimately be **zero** if no candidate passes the hard
gates or has positive conservative net value."

**Order of operations is not negotiable.** The hard gates (`PROMPT:289-303`) are a
**filter**, not a criterion. A candidate that fails a hard gate is not scored, is not
weighted, and cannot be compensated for by strength elsewhere. **MCDA runs only over
gate-passing candidates.** Today that set is empty, so the MCDA has nothing to run over —
which is a second, independent reason execution is blocked.

---

## 1. The fourteen criteria (`PROMPT:309-322`)

All fourteen required criteria, verbatim in meaning, each with the evidence source that
would supply its value and the reason it cannot be scored today.

| # | Criterion (`PROMPT:309-322`) | Evidence source that supplies the value | Scoreable today? |
|---|---|---|---|
| **C1** | Clinical impact and preventability | Clinical evidence dossier (`G2-VAL-0007`) + adjudicated outcome definition (`G2-VAL-0024`) | **No** — no dossier; no candidate has a documented evidence grade (INV-GAP-5) |
| **C2** | Frequency / burden in the intended population | Site epidemiology at the pilot unit; retrospective cohort | **No** — no site identified (VAL-0039); incidence UNKNOWN for every candidate (INV-GAP-6) |
| **C3** | Intervention actionability and time sensitivity | Observed workflow (M1/M2) + response-capacity measurement | **No** — no workflow observation has ever been performed (`LEGACY-TA:56`) |
| **C4** | Evidence strength and transportability | **Clinical evidence methodologist** — explicitly *not* this specialist (`decisions_prohibited`) | **No** — and must not be attempted here |
| **C5** | Source-data readiness and AMH compatibility | **`pathway-to-source-matrix.yaml`** — the hard input per `PROMPT:420` | **Yes, and it returns the floor value for every candidate** — see §1.1 |
| **C6** | Workflow fit and cognitive burden | Contextual inquiry + simulation (M1/M3) | **No** — unobserved |
| **C7** | Explainability and user trust | Human-factors simulation; trust-calibration testing (VAL-0029) | **No** — no artifact exists to test |
| **C8** | Validation feasibility and sample availability | Site + data access + pre-registered endpoints | **No** — gate 9 fails for all (`hard-gate-assessment.md` §2.9) |
| **C9** | Incremental coverage beyond selected pathways | Overlap analysis over patient-level data | **No** — requires data; and is **undefined against an unenumerated candidate set** (CAND-0006/0007) |
| **C10** | Engineering / operational / maintenance cost | Engineering estimate + funded-lifecycle decision | **No** — no funding decision exists (gate 11 fails for all) |
| **C11** | False-positive and false-negative harm | Retrospective adjudicated study (SM-03 / HM-01) | **No** — no measured figure exists anywhere (`LEGACY-TA:1002`, unanswered) |
| **C12** | Alert-volume contribution and overlap / correlation | Shadow-mode alert counting against a measured baseline | **No** — baseline unmeasured (VAL-0035) and **unobtainable after deployment** |
| **C13** | Equity / subgroup risk | Pre-registered subgroup analysis with a lawful basis | **No** — lawful basis undetermined (VAL-0037) |
| **C14** | Vendor or terminology dependence | Contract inventory + terminology pinning | **Partially** — the dependence is *documented* (AMH single-source, LOINC/UCUM unpinned) but cannot be scored against unscoreable peers |

**Twelve of fourteen criteria have no evidence source in existence today.** Running an MCDA
where twelve of fourteen inputs are unmeasured would not be a decision procedure; it would be
a weighted average of guesses wearing the costume of one.

### 1.1 C5 is the criterion that is already determined, and it is determined at the floor

`PROMPT:420` designates the source matrix a **hard input**. It returns
`INELIGIBLE_FOR_ACTIONABLE_EVALUATION` on **25 of 25 rows**, for **every** candidate with
enumerable inputs.

**PROPOSAL — the C5 floor rule.** C5 is not merely a low score for these candidates; it is a
**hard-gate condition wearing a criterion's clothes**. `PROMPT:415` states that a missing
authoritative source, code, unit, link, timestamp, freshness policy, correction behaviour or
population measurement "makes the input **ineligible for actionable evaluation**" — a binary
disqualification, not a penalty. Therefore:

> **A candidate with any `INELIGIBLE` mandatory input scores C5 = 0 AND is disqualified from
> the actionable portfolio regardless of its total weighted score.** C5 is non-compensatory.
> No weighting scheme may allow strength on C1–C4 or C6–C14 to purchase admission for a
> candidate that cannot be fed.

**INFERENCE:** without this rule, a sufficiently high weight on clinical impact could admit a
pathway whose inputs do not exist — producing a pathway permanently in `not_evaluated` and
realizing candidate hazard **PH-10** ("the product displays a monitoring capability that is
structurally incapable of evaluating anything, and the emptiness is mistaken for reassuring
quiet"). This rule exists to make that arithmetically impossible.

---

## 2. Weight ratification process (`PROMPT:307`)

> "Have product, clinical, safety, data, UX, and operations owners ratify weights **before**
> scoring."

### 2.1 The six ratifying roles — all currently UNASSIGNED

| Prompt role | `authority-model.md` role | State |
|---|---|---|
| product | `AUTH-PRODUCT` | **UNASSIGNED — VALIDATION REQUIRED** (`:27`) |
| clinical + safety | `AUTH-CLINSAFETY` | **UNASSIGNED — VALIDATION REQUIRED** (`:28`) |
| data | `AUTH-DATA-PLATFORM` | **UNASSIGNED — VALIDATION REQUIRED** (`:31`) |
| UX | `AUTH-UX` | **UNASSIGNED — VALIDATION REQUIRED** (`:32`) |
| operations | `AUTH-OPERATIONS` | **UNASSIGNED — VALIDATION REQUIRED** (`:33`) |
| *(added by this method)* security/privacy | `AUTH-SECURITY` + `AUTH-PRIVACY-LEGAL` | **UNASSIGNED** (`:29`, `:30`) |

**PROPOSAL — why security/privacy is added.** `PROMPT:307` says "at least" these owners.
C13 (equity/subgroup risk) cannot be scored without a lawful basis for subgroup analysis
(VAL-0037), which is `AUTH-PRIVACY-LEGAL`'s decision. A weight set that assigns C13 any
non-zero weight while its measurement is legally unauthorized is unexecutable.

### 2.2 Ratification procedure (PROPOSAL)

1. **Publish the criteria first, unweighted**, with each criterion's *evidence source* named (the table in §1). Owners must see what a weight would be applied *to*.
2. **Each owner independently proposes a weight vector**, in writing, before seeing any other owner's. Simultaneous-reveal, not sequential — sequential elicitation anchors.
3. **Divergence is surfaced, not averaged away.** Where owners' weights diverge by more than a ratified threshold on any criterion, the divergence is recorded as a **disagreement of value**, discussed, and resolved explicitly. Averaging silently is how an unowned compromise becomes an unowned decision.
4. **Weights are frozen, versioned, dated, and signed** before any candidate is scored, and recorded in `docs/00-governance/registers/decision-register.md` as a `GDEC` entry.
5. **Re-scoring under changed weights requires a new dated ratification** and must retain the prior weight version. A portfolio justified by weights that no longer exist is unauditable.
6. **No agent participates in ratification.** Agents may draft the criteria, compute scores under given weights, and show sensitivity — never set or approve a weight.

### 2.3 Mandatory sensitivity disclosure

**PROPOSAL:** any executed MCDA must report, alongside its result, **how much the weight
vector would have to change to alter the selected portfolio**. A portfolio that flips under a
small weight perturbation is not a decision supported by evidence; it is a decision supported
by the weights. Owners are entitled to know which of the two they have ratified.

---

## 3. Estimation under uncertainty — the lower-confidence-bound rule (`PROMPT:324`)

> "For each candidate, estimate benefit, harm, and delivery/validation cost with uncertainty;
> **prefer a lower-confidence-bound estimate over an optimistic point estimate.**"

### 3.1 The rule, stated operationally (PROPOSAL)

For every criterion, a candidate is scored with an **interval**, not a point, and the interval
is collapsed **conservatively with respect to patients**:

| Quantity | Collapse to | Rationale |
|---|---|---|
| **Benefit** (C1, C2, C3, C9) | the **lower** bound | Overstating benefit admits a pathway that does not help |
| **Harm** (C11, C12, C13) | the **upper** bound | Understating harm admits a pathway that hurts |
| **Cost** (C10) | the **upper** bound | Understating cost produces an unmaintainable portfolio, and gate 11 requires funded lifecycle |
| **Evidence strength** (C4) | the **lower** bound | Set by the clinical evidence methodologist, not here |
| **Source readiness** (C5) | the **floor**, non-compensatory | §1.1 |

**Asymmetric by design.** Benefit and harm are *not* treated symmetrically, because their
errors are not symmetric in consequence: an overstated benefit produces a useless alert, an
understated harm produces a harmful one.

### 3.2 The unknown-is-not-zero rule

**PROPOSAL — and this is the rule most likely to be violated in practice:**

> **A criterion with no evidence scores as its worst plausible value, not as zero, not as a
> midpoint, and not as "excluded from the average".**

**INFERENCE:** dropping unmeasured criteria from a weighted average silently redistributes
their weight to the measured ones — which are, systematically, the *easy* ones (engineering
cost, terminology dependence). Harm and equity are the hardest to measure and would be
dropped first. The result would be a portfolio optimized for what was convenient to measure.
This mirrors the domain's governing rule (`PROMPT:119`): never coerce missing or unevaluable
data to zero, normal, or no-risk. **The same discipline applies to the portfolio decision as
to a patient's evaluation.**

### 3.3 Consequence for today's candidate set

Applying §3.1 and §3.2 to `candidate-inventory.md`: twelve of fourteen criteria are unmeasured
for every candidate, so every candidate would score at its worst plausible value on twelve
criteria, at the floor on C5, and would be disqualified before weighting by the hard gates
anyway. **Every path through this method terminates at the same place today: a portfolio of
size zero.** That is a convergent result from three independent directions (gates, C5 floor,
LCB estimation), which is the strongest form the finding can take.

---

## 4. Hard constraints the portfolio must satisfy (`PROMPT:324`)

These are **constraints**, not criteria. A portfolio violating any one is invalid regardless
of its score.

| # | Constraint (`PROMPT:324`) | Measurable today? | State |
|---|---|---|---|
| **K1** | Interruptive-alert budget **per patient-day** | **No** | No baseline (VAL-0035); no alert-rate figure documented (`LEGACY-TA:1002`) |
| **K2** | Interruptive-alert budget **per clinician shift** | **No** | Requires observed staffing and interruption rate (VAL-0020) |
| **K3** | Available response / escalation capacity | **No** | Escalation ownership is "very low confidence" (VAL-0014) |
| **K4** | Subgroup safety limits | **No** | No lawful basis for subgroup analysis (VAL-0037) |
| **K5** | Source freshness and coverage | **No** | Unmeasured on 25 of 25 rows; no window defined (VAL-0023) |
| **K6** | Validation capacity | **No** | No site, no sponsor, no ethics route (VAL-0039/0040) |
| **K7** | Delivery reliability | **No** | Legacy: generated ≠ displayed, no delivery SLI (`HAZ-0015`); V2 has no implementation |
| **K8** | Maintenance capacity | **No** | Gate 11 fails for all — lifecycle is unfunded |

**All eight constraints are currently unmeasurable.** **INFERENCE:** a portfolio cannot be
declared feasible against constraints none of which can be evaluated. **An unmeasurable
constraint must be treated as violated, not as satisfied** — the same asymmetry as §3.2.

### 4.1 The alert-budget constraint has an irreversible deadline

**K1 and K2 require a *pre-deployment* baseline.** `g1-validation-backlog.md` VAL-0035:
"**Baselines are unobtainable once V2 is deployed.**" **INFERENCE — the single strongest
scheduling constraint on this method:** every other input to the MCDA can be obtained late at
the cost of delay. The alert-burden baseline can be obtained **only before deployment, or
never**. A programme that deploys before measuring it has permanently destroyed the
denominator of its own alert-budget constraint and can never afterwards demonstrate K1 or K2.
This is recorded as `g2-validation-backlog.md` **G2-VAL-0025** and should be sequenced ahead
of work that appears more urgent.

### 4.2 Overlap penalty (`PROMPT:324`, "Penalize pairwise pathway overlap and competing alerts")

**PROPOSAL — the overlap procedure:**

1. Compute **pairwise overlap** for every admitted pair on two axes: **input overlap** (shared required inputs) and **event overlap** (proportion of patient-events on which both would fire).
2. **Input overlap is computable today; event overlap is not.** Input overlap for the current candidates is mapped qualitatively in `candidate-inventory.md` §3 and is **high to very high** across CAND-0001 / CAND-0002 / CAND-0004.
3. **Score the correlated cluster jointly, never per-candidate**, on C9 (incremental coverage) and C12 (alert-volume contribution). Scoring three correlated instruments independently triple-counts their coverage and under-counts their combined alert volume.
4. **Overlap is penalized against the *marginal* candidate**, not shared between the pair — the second instrument added to a cluster bears the penalty, not the first.
5. **Overlap analysis is undefined against an unenumerated candidate set.** CAND-0006 (eleven unnamed pathways) and CAND-0007 (959 rules) cannot be overlap-analysed at all. **Therefore no portfolio containing any member of those sets can satisfy this procedure until enumeration is complete** (`G2-VAL-0002`, `G2-VAL-0003`).

---

## 5. Add / remove convergence procedure (`PROMPT:326`)

> "Add a pathway only when its marginal validated clinical/user value exceeds its marginal
> safety, alarm, validation, operational, and maintenance cost. Recompute overlap, capacity,
> and uncertainty after every addition. **Remove each selected pathway in turn and repeat the
> coverage/harm analysis to detect under-selection. Add the next-ranked candidate and repeat
> to detect over-selection.** Continue until neither removal nor addition improves the
> ratified objective subject to hard safety constraints."

### 5.1 The procedure (PROPOSAL)

```text
S := {}                              # selected portfolio, starts EMPTY
G := candidates passing ALL 11 hard gates      # today: G = {} — procedure terminates at step 0

step 0.  if G is empty: STOP. Portfolio = {} . This is a valid result (PROMPT:324).

step 1.  ADD PASS
         for each candidate c in G \ S, ranked by ratified weighted LCB score:
             compute MARGINAL value of adding c to S
               (recompute C9 incremental coverage against S, not against nothing)
             compute MARGINAL cost of adding c to S
               (recompute C10, C11, C12 and the overlap penalty against S)
             re-evaluate ALL constraints K1..K8 for S ∪ {c}
             if marginal value > marginal cost AND every constraint holds:
                 S := S ∪ {c} ; restart step 1   # recompute after EVERY addition
         # note: ranking is recomputed after each addition — a static ranked list is wrong,
         # because C9 and C12 are defined relative to what is already selected.

step 2.  REMOVE PASS (detects UNDER-selection)
         for each c in S:
             evaluate S \ {c} : does coverage loss exceed the harm/alarm/cost saved?
             if removing c IMPROVES the ratified objective: S := S \ {c} ; goto step 1

step 3.  ADD-NEXT PASS (detects OVER-selection)
         take the next-ranked candidate not in S; run step 1's test for it
         if it would be admitted, the ranking or the constraints were mis-specified —
         record and re-examine rather than silently admitting

step 4.  CONVERGENCE
         repeat 1-3 until neither an addition nor a removal improves the ratified
         objective subject to K1..K8. Record the final S, the weight version, every
         marginal computation, and every REJECTED addition with its reason.
```

### 5.2 Three properties this procedure must preserve

1. **It starts empty and grows on evidence.** It never starts from the legacy twelve, from the 959-rule catalog, or from any target (`PROMPT:266`, `PROMPT:328`). **A candidate is not "removed"; it is never added.**
2. **Recomputation after every single addition is mandatory, not an optimization.** C9, C12 and K1–K3 are all *relative to what is already selected*. A batch admission of several pathways at once is not this procedure and must not be represented as it.
3. **Every rejected addition is recorded with its reason.** A portfolio's credibility rests as much on what it declined as on what it admitted, and a rejection record is what prevents the same candidate being re-proposed without new evidence.

### 5.3 Execution today

**Step 0 terminates immediately.** `G = {}` — no candidate passes all eleven hard gates
(`hard-gate-assessment.md`: 0 PASS across 99 cells). **The procedure's output is the empty
portfolio, reached at step 0, without any weighting or scoring having occurred.** This is not
a failure of the method; it is the method working.

---

## 6. Per-site recalculation policy (`PROMPT:326`)

> "Use retrospective replay, shadow evaluation, human-factors simulation, and pilot evidence
> to **recalculate the portfolio per site and release**; **never silently customize approved
> clinical logic by site**."

### 6.1 The distinction the policy turns on (PROPOSAL)

| May vary by site | May **never** vary by site |
|---|---|
| **Which** approved pathways are enabled | The **clinical logic** of an approved pathway |
| Alert-budget and capacity constraints (K1–K3), because staffing and unit size differ | Thresholds, bands, components, or recommendation content |
| Freshness windows **only if** re-ratified as a versioned variant with its own evidence | Freshness windows changed silently to fit a slower local feed |
| Routing, escalation targets, and workflow integration | The evaluation-status contract (`valid`/`partial`/`not_evaluated`/`stale`/`invalid`) |
| The **selection** decision (portfolio membership) | The **content** decision (what a pathway does) |

**PROPOSAL:** a site that requires different clinical logic does not get a "configuration"; it
gets a **separately evidenced, separately versioned pathway** with its own release package
(`PROMPT:330-345`) and its own clinical approval. This is `PROMPT:418` applied to sites:
"never silently alter the clinical definition."

### 6.2 Recalculation triggers

The portfolio is recalculated — not merely re-reviewed — when any of these changes:

1. **A new site** is added (different population, staffing, capacity, source feeds).
2. **A release** changes any admitted pathway's version, or the evaluation-status contract.
3. **The source matrix changes** — a newly eligible or newly ineligible input. `PROMPT:420` makes the matrix a hard input; a change to a hard input invalidates the result derived from it.
4. **Measured alert burden diverges** from the value assumed at selection (K1/K2 breach).
5. **Post-release surveillance** shows a pathway's measured performance differs from the LCB estimate that admitted it.
6. **A weight re-ratification** occurs.
7. **The AMH compatibility finding changes** at Gate G3.

### 6.3 Anti-drift obligations

- **One approved clinical logic, one content hash, all sites.** Site variation lives in the *enablement and constraint* layer, never in the rule bundle. Legacy counter-evidence: dual runtimes and a legacy fallback meant "different instances can hold different suppression/load state" (`LEGACY-TA:722-724`; `HAZ-0020`).
- **Every site's active portfolio, weight version, and rule-bundle hashes must be observable at runtime.** Legacy counter-evidence: `load_failures` were not exposed in readiness (`LEGACY-TA:490`; `HAZ-0025`).
- **A per-site portfolio decision is a decision** and belongs in the decision register with a named human, not in a configuration file with a commit message.

---

## 7. What this method deliberately does not do

1. **It sets no weights.** Six owner roles ratify them; all six are UNASSIGNED.
2. **It scores no candidate.** Twelve of fourteen criteria have no evidence source in existence.
3. **It selects no portfolio.** Step 0 terminates on an empty gate-passing set.
4. **It does not rank candidates against each other.** `hard-gate-assessment.md` §1 records that today's blockers are **columnar** — every candidate is blocked by the same things in the same way — so a ranking would carry no decision value while implying one.
5. **It does not treat the legacy count of 12, or 959, or any number as a starting point** (`PROMPT:266`).
6. **It does not decide.** Gate G2 (`PROMPT:347-349`) requires "a qualified human committee [to] approve the portfolio method, the individual release package, residual hazards, and the staged validation plan." **This document is a candidate for the first of those four approvals and nothing more.**

## 8. Relationship to the clinical release package (`PROMPT:330-345`)

Selection is necessary but not sufficient. A selected pathway still cannot enter actionable
production mode until it has an immutable, signed release bundle carrying all fourteen
elements of `PROMPT:332-345` — identifier and semantic version, intended use/population/
exclusions, external evidence and snapshot date, clinical owner **and independent approver**,
machine-readable logic and content hash, terminology/value-set versions, completeness and
freshness policy, reference vectors and replay corpus, hazard/control links, explanation text
and UX acceptance criteria, validation status, and monitoring thresholds with rollback
criteria, kill switch and retirement date.

**INFERENCE:** the release package is where this method's output becomes governable. Ordered
work for both is in `g2-validation-backlog.md` (`G2-VAL-0032`).

## 9. Cross-references

- `candidate-inventory.md` — the candidate set the MCDA would run over, and its gaps.
- `hard-gate-assessment.md` — the filter that runs **before** this method; currently empties it.
- `pathway-to-source-matrix.yaml` / `.md` — the hard input to criterion C5 (`PROMPT:420`).
- `g2-validation-backlog.md` — ordered prerequisites, including weight ratification.
- `../../01-vision-and-intended-use/success-and-harm-metrics.md` — SM-03 / HM-01 supply C11.
- `../../00-governance/authority-model.md` — the six ratifying roles, all UNASSIGNED.
- `../../00-governance/registers/decision-register.md` — where a ratified weight vector must be recorded.
