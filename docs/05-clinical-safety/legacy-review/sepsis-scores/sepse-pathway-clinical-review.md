---
id: LEGREV-SEPSE-PATHWAY-0001
title: Legacy review — sepsis pathway clinical content (domain_sepsis.py, sepse.yaml v4, root sepse.yaml, rule catalog)
label: PROPOSAL
status: PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI)
statement: >
  Intensivist-rigor forensic review of the legacy V1 sepsis pathway clinical logic —
  inclusion criteria, bands, predicates and timing — against Sepsis-3 (Singer 2016) and
  the Surviving Sepsis Campaign 2021 guideline. Scope is clinical content only; engine
  mechanics and cross-pathway structure belong to the pathways workstream. Everything
  herein is PROPOSAL; no clinical authority has ratified any statement.
provenance:
  source_repo: intensicare (legacy V1, READ-ONLY)
  path_or_url: src/intensicare/services/domain_sepsis.py, _work/alerts/pathways/sepse.yaml, _work/alerts/sepse.yaml, docs/rules (see §1)
  commit_sha_or_version: 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79 (HEAD at pin; per-file SHA-256 in §1)
  section_or_lines: per-citation line references throughout
  date_collected: 2026-08-15
  collector: legacy sepsis-score forensics reviewer (cycle 1, Task 1); accountable reviewer rodaquino-OMNI
  transformation: verbatim excerpts plus reviewer analysis; analysis labeled INFERENCE/PROPOSAL
  confidence: high (source verification); low (clinical dispositions — unratified)
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  requirements: [SAF-0001, SAF-0002, SAF-0019, SAF-0035]
  hazards: [HAZ-0005, HAZ-0006, HAZ-0021, HAZ-0036, HAZ-0040, HAZ-0043]
  adrs: [ADR-0008 (pending — via sofa-review.md §7)]
  tests: []
  pr: null
supersedes: null
superseded_by: null
---

# Sepsis pathway — legacy clinical-content review

**PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).** Engine
mechanics (compiler, suppression, state machine execution) are out of scope here and
belong to the pathways workstream; this record reviews **clinical logic only**.

## 1. Sources verified, with hashes

Paths relative to `/Users/familia/intensicare` (READ-ONLY), pinned at git HEAD
`1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79`; hashes re-computed 2026-08-15 against
`docs/archive/legacy-provenance/legacy-pin-cycle-1.md`.

| Artifact | SHA-256 | Manifest |
|---|---|---|
| `src/intensicare/services/domain_sepsis.py` | `853d2e38a8167d28e7eb242872e871024abe00b4868fc22f7c02502f99d3ccf8` | match |
| `src/intensicare/services/sepsis_input_provider.py` | `650bdd8c512fd08e673cde124269dd5c05a214ac07510011d53954cdd738b1cb` | match |
| `_work/alerts/pathways/sepse.yaml` (pathway v4.0.0) | `b84c9693295f5d820cb2796b6a789f10cfb9200409741af4e0ba78b7ad4ec7f0` | match |
| `_work/alerts/sepse.yaml` (root, 6 alert definitions) | `1af8062d535ff0a9efa12a1606c7b37b975bd0635a8800f155491e958ced5dfa` | match |
| `docs/rules/clinical-scoring/RULE-SEPSE-001/-002/-005` | manifest lines 495-497 (match) | match |
| `docs/rules/alert-threshold/RULE-SEPSE-003/-004/-058` | manifest lines 159-160, 180 (match) | match |
| `tests/test_domain_sepsis.py` | `f86b57fa985705b279c8cbe0b0b212b3d47b0096d67db81ef39de82be81f22d5` | **not in manifest — hash-and-note** |
| `tests/test_sepse_yaml_parity.py` | `8d7e5557db0cd8e92077f87fc3be2e76b7e129b8b9e006432170023415e77017` | **not in manifest — hash-and-note** |
| `docs/plan/_work/ratification-decisions.yaml` | `b90c3cbbf11f22e440d7258e1e9c8fd556009a4c572717b839f51e73f7ee4751` | **not in manifest — hash-and-note** |
| `docs/plan/_work/dispositions/sepse-p1.yaml` | `cd15c8b1968f0f1c72c0bb11862757a545b4b260fff0625d2b5275b4e3e57b90` | **not in manifest — hash-and-note** |

Rule-catalog coverage: `docs/rules` contains **99 RULE-SEPSE records across seven
clusters** plus sepsis-adjacent records in ALERTAS/ESTABILIDADE/EVOLUCOES/TRILHAS-ENGINE
clusters. The clinically material screening/threshold records (SEPSE-001…-005, -058, and
the criterion families -007…-037 and -038…-057 they aggregate) were reviewed; workflow/UI
records (care-pathway cluster -071…-097) are out of clinical-content scope and are noted
for the pathways workstream. The trilhas-era code these records document
(`ahlabs-trilhas@8166c07eae`) is **SOURCE NOT LOCATED** — reviewed as documented only.

**Five generations of sepsis clinical logic coexist in the legacy evidence:**

| Gen | Artifact | Screening concept |
|---|---|---|
| G1 | trilhas v1 + manual pathway (RULE-SEPSE-001/-004) | 9 major + 11 minor criteria; fires on **maiores ≥3 AND menores ≥4** (red) / ≥2 AND ≥3 (yellow) |
| G2 | trilhas homecare (RULE-SEPSE-003) | 7 major + 4 minor; strict `>2`/`==2` bands; minor-driven red **unreachable** (criterio_11 hard-coded false) |
| G3 | trilhas v3 (RULE-SEPSE-002, -058, criterion records -007…-037) | 11 major + 9 minor; fires on **OR**; regrouped criteria; label-vs-predicate divergences |
| G4 | `domain_sepsis.py` v3.0.0 (six alerts) | Sepsis-3/SSC-2021-styled: infection gate + qSOFA/SIRS; lactate; shock; bundle timers; PCT stewardship |
| G5 | `_work/alerts/pathways/sepse.yaml` v4.0.0 + `sepsis_input_provider.py` | Declarative port of G4 plus graded lab/hemodynamic criteria and a 5-state care flow |

The root `_work/alerts/sepse.yaml` is a sixth, free-standing alert set (Sepsis-3-cited)
not wired to the others. G1-G3 contradict each other on the *same nominal screen* (AND vs
OR vs strict-equality aggregation; different criterion counts and numbering) — documented
internally at RULE-SEPSE-002's divergence note and left unresolved by the legacy
"ratification" (§6).

## 2. Authoritative definitions

- **Singer M, et al.** Sepsis-3. *JAMA*. 2016;315(8):801-810. doi:10.1001/jama.2016.0287,
  <https://pmc.ncbi.nlm.nih.gov/articles/PMC4968574/> — sepsis = life-threatening organ
  dysfunction from dysregulated host response, operationalized as **acute SOFA increase
  ≥2** consequent to infection; septic shock (clinical criteria) = "vasopressor
  requirement to maintain a mean arterial pressure of 65 mm Hg or greater **and** serum
  lactate level greater than 2 mmol/L (>18 mg/dL) in the absence of hypovolemia";
  hospital mortality in septic shock "greater than 40%".
- **Evans L, et al.** Surviving Sepsis Campaign 2021. *Crit Care Med*
  2021;49(11):e1063-e1143 / *Intensive Care Med* 2021;47:1181-1247.
  doi:10.1007/s00134-021-06506-y. Recommendations verified for this review: screening —
  against qSOFA as a single tool (strong, moderate quality; see `qsofa-review.md` §6);
  MAP target 65 mmHg (strong, moderate); antimicrobials **within 1 h** for septic shock
  or high likelihood of sepsis (strong, low), and for possible sepsis **without** shock a
  rapid assessment with antimicrobials **within 3 h** if concern persists (weak, very
  low); ≥30 mL/kg crystalloid within the first 3 h (weak, low — downgraded from earlier
  strong); lactate-guided resuscitation (weak, low); blood cultures before antimicrobials
  when no substantial delay (<45 min) results (best practice statement); **against** PCT +
  clinical evaluation to decide when to *start* antimicrobials (weak, very low); PCT +
  clinical evaluation to decide when to *discontinue* antimicrobials with adequate source
  control (weak, low).
- **Bone RC, et al.** ACCP/SCCM Consensus Conference (SIRS). *Chest*.
  1992;101(6):1644-1655 — SIRS: temperature >38 °C or <36 °C; heart rate >90/min;
  respiratory rate >20/min or PaCO2 <32 mmHg; WBC >12,000/mm³ or <4,000/mm³ or >10%
  immature bands.

## 3. G4 — `domain_sepsis.py` six alerts: clinical logic vs authority

### 3.1 As implemented (verbatim excerpts)

Infection gate — `domain_sepsis.py:188-194`:

```python
def _infection_present(inputs):
    return (_bool(inputs.get("cultura_positiva"))
        or _bool(inputs.get("atb_iniciado_ultimas_24h"))
        or _bool(inputs.get("suspeita_infeccao_documentada")))
```

SIRS — `domain_sepsis.py:197-235`: temp >38.0 or <36.0; HR >90; RR >20 else PaCO2 <32;
WBC >12 or <4 (×10³/µL) else bands >10%. Screen — `domain_sepsis.py:269-288`:
`infection AND (qSOFA >= 2 OR SIRS >= 2)`. Organ — `domain_sepsis.py:291-322`:
`qSOFA >= 2 AND (lactate > 2.0 OR delta-lactate > 0.5 mmol/L/h over default 6 h)`.
Shock — `domain_sepsis.py:325-347`:

```python
    if lactate is not None and lactate >= 4.0:
        return True, f"Lactate={lactate} >= 4 mmol/L (septic shock marker)"
    if map_val is not None and map_val < 65:
        if (vasopressor is not None and vasopressor > 0) or fluid_bolus:
            return True, ...
```

Bundle timer — `domain_sepsis.py:350-391`: `protocol_active AND NOT item_checked AND
minutes_since_accept > 60` (item "primeira_hora") or `> 180` ("reavaliacao"); unknown
package label defaults to 60. PCT rising — `domain_sepsis.py:394-420`: `ATB >= 48 h AND
PCT rising AND delta > 0.25 ng/mL` (nominally over 24 h). PCT de-escalation —
`domain_sepsis.py:423-454`: `stable AND ATB >= 48 h AND (PCT < 0.25 OR >80% drop from
peak)`.

### 3.2 Discrepancy table — G4 vs Sepsis-3 / SSC 2021

| # | Item | Finding | Evidence |
|---|---|---|---|
| P-01 | SIRS cut-points | MATCH Bone 1992 exactly (incl. PaCO2 and bands alternates) | `domain_sepsis.py:197-235` |
| P-02 | Screen composite | qSOFA-OR-SIRS + infection gate: not any guideline's instrument; self-label "SSC-2021 RATIFIED" overstates (see `qsofa-review.md` §6.2). Missing SIRS/qSOFA components silently contribute 0 (HAZ-0005, §7) — a screen that can only under-trigger on sparse data | `domain_sepsis.py:269-288` |
| P-03 | "Organ dysfunction" alert | **DEV (definitional)** — Sepsis-3 organ dysfunction is **SOFA Δ≥2**; G4 substitutes `qSOFA ≥2 AND lactate` and never consults the SOFA engine that exists in the same codebase. The only Sepsis-3-conformant criterion in the repository (`sofa_delta >= 2`, root `sepse.yaml:51-61`) has **no producer**: grep of `src/` finds nothing computing `sofa_delta` — a dead criterion. Delta-lactate >0.5 mmol/L/h is uncited | `domain_sepsis.py:291-322`; `_work/alerts/sepse.yaml:51-61` |
| P-04 | Septic shock alert | **DEV (definitional, worst in file)** — fires on `lactate >= 4.0` **alone**, with no infection context, no vasopressor requirement, no resuscitation condition: any hyperlactatemia ≥4 (seizure, metformin, hepatic failure) raises a "septic shock" assertion. The alternative arm (MAP <65 AND vasopressor-or-bolus) *under*-identifies Sepsis-3 shock: a patient *stabilized* on norepinephrine (MAP held ≥65) with lactate 3 **is** septic shock by Sepsis-3 and fires nothing. Sepsis-3's actual criteria (vasopressor requirement to maintain MAP ≥65 **AND** lactate >2 despite adequate resuscitation) are implemented nowhere. The 4.0 threshold echoes the pre-2016 severe-sepsis era; uncited | `domain_sepsis.py:325-347` |
| P-05 | Competing shock definition | Root `sepse.yaml:63-81` defines shock as `lactate > 2 AND vasopressors AND map < 65` — closer to Sepsis-3 on lactate but adds the refractory MAP<65-on-pressors condition (same under-identification). **Two mutually inconsistent septic-shock definitions coexist** in one repository; a third variant is v4's `crit-sep-shock` (`>= 4.0` OR refractory) | `_work/alerts/sepse.yaml:63-81`; `pathways/sepse.yaml:266-288` |
| P-06 | Hour-1 bundle timing | 60-min ATB timer per item; anchored to **protocol acceptance**, not to recognition/presentation as SSC frames it — and the provider derives `minutes_since_accept` from pathway *enrollment* (`sepsis_input_provider.py:282-299`), one more remove. No 1 h (shock) vs 3 h (possible sepsis without shock) stratification — SSC 2021 splits these; G4/G5 apply 60 min to all | `domain_sepsis.py:350-391` |
| P-07 | "Reavaliacao" 180-min item repurposed | v4 binds the 180-min timer to **cultures collection** ("Bundle 3h — Culturas Pendentes", `pathways/sepse.yaml:308-324`) while simultaneously requiring cultures **before** antibiotics that are due at 60 min (`crit-sep-culturas-antes-atb`, `pathways/sepse.yaml:326-334`; evidence list "coletar culturas antes… sem atrasar a primeira dose", `pathways/sepse.yaml:429`). **Internally contradictory timing**: a culture deadline 3× later than the antibiotic deadline cannot enforce a cultures-first sequence. SSC 2021's actual statement: obtain cultures before antimicrobials when it causes no substantial delay (<45 min) | `pathways/sepse.yaml:290-334,429` |
| P-08 | Fluid criterion | 30 mL/kg target bands (0-20 critical / 20-30 urgent / ≥30 normal, `pathways/sepse.yaml:191-211`) — SSC 2021 grades 30 mL/kg as **weak, low quality**; the 20 mL/kg sub-band is invented; and severity semantics are inverted for the non-resuscitation phase (a patient *not requiring* fluids shows "Volume insuficiente"/critical). Input never persisted (§5) | `pathways/sepse.yaml:191-211` |
| P-09 | PCT rising = treatment failure | No SSC 2021 recommendation supports alerting "treatment failure" on PCT rise; delta 0.25 ng/mL/24 h uncited. The 24 h delta window is enforced only by the provider's ±6 h tolerance search (`sepsis_input_provider.py:96-98,316-326`), not by the evaluator, which accepts any `procalcitonina_anterior` | `domain_sepsis.py:394-420` |
| P-10 | PCT de-escalation | Direction matches SSC 2021's *discontinuation* suggestion (weak, low; with adequate source control) — but thresholds (<0.25 ng/mL; >80% peak drop) are trial-protocol-style values, uncited; "de-escalation" (spectrum narrowing) is not the guideline's *discontinuation* concept; and source control adequacy is not an input | `domain_sepsis.py:423-454` |
| P-11 | Lactate/PCT/PAM graded bands | Lactato 2.0/4.0 (label at ≥4: "Choque séptico" — same P-04 conflation); PCT 0.5/2.0 bands uncited (assay-convention values); PAM <65 critical / ≥65 normal matches SSC 2021's target (band edge at exactly 65 handled as ≥65 normal) | `pathways/sepse.yaml:107-167` |
| P-12 | qSOFA banding labels | See `qsofa-review.md` Q-07/§6.3 (band "Disfunção orgânica" at qSOFA 2; "Alta probabilidade de sepse" at 3; no gate on the criterion) | `pathways/sepse.yaml:85-105` |

### 3.3 G1-G3 (trilhas catalogs) — clinical content status

The 20-criterion major/minor screens are **institutional instruments with no external
authority** (RULE-SEPSE-001/-004 verdict "UNVERIFIABLE": "No published reference defines
the specific 'N maiores AND M menores' aggregation"). Their internal state is worse than
unvalidated: three aggregation rules disagree for the same nominal screen (AND vs OR vs
strict-equality with a dead red branch); RULE-SEPSE-058 documents label-vs-predicate
divergences inside G3 itself (platelet label "<150.000" vs firing predicate <100,000;
fever label ≥38.2 vs predicate >38.2; hypotension label omitting the PAD/PAM arms the
predicate has; criterion *numbering* differs between the display catalog and the model).
External deltas recorded there: fever 38.2 vs SIRS 38.0; GCS <14 vs qSOFA's <15; lactate
≥3 vs Sepsis-3's >2; criterio_11 hard-coded false (RULE-SEPSE-037). INFERENCE: G1-G3 are
un-importable as clinical content; their only V2 value is as evidence that multi-variant
screening logic without single-source governance diverges silently — the exact failure
V2's rule-bundle governance (SAF-0020/0021) exists to prevent.

## 4. Timing, freshness and staleness of pathway inputs

| Input class | Window as implemented | Assessment |
|---|---|---|
| Vitals feeding qSOFA/SIRS | **latest row, no age bound** (`_fetch_latest_vital`, `sepsis_input_provider.py:126-134`) | HAZ-0006: arbitrarily stale RR/SBP/GCS scored as current; VAL-0023 unresolved |
| Labs feeding SIRS (WBC, bands, PaCO2) + lactate | 72 h lookback (`_RECENT_LABS_WINDOW`, `sepsis_input_provider.py:89`) | A 3-day-old WBC can satisfy a "current" SIRS criterion; uncited window |
| PCT history | 14 d (`_PCT_HISTORY_WINDOW`, `sepsis_input_provider.py:93`); 24 h ± 6 h prior-sample tolerance | Defensible for PCT kinetics; uncited |
| Bundle clocks | `PatientPathway.enrolled_at` proxies "accept" for **both** ATB and culture items (`sepsis_input_provider.py:48-55, 282-299`) | Single-clock proxy documented honestly in-source; still a timing fidelity gap |
| Stability gate | all `StabilityAssessment` rows over 48 h must be "estavel" (`sepsis_input_provider.py:335-342`) | Fail-safe direction (absence of rows → key omitted → criterion pending) |

## 5. Structural evaluability — the decisive finding

OBSERVED (`sepsis_input_provider.py:30-47, 362-366`): the provider documents that **no
persisted source exists** for `infeccao_suspeita` (none of the three infection-evidence
signals has storage), `atb_ativa_horas` (no antibiotic administration-confirmation
signal), `culturas_antes_atb` (no blood-culture persistence "anywhere in this codebase"),
and `fluid_volume` (no fluid-balance persistence). These keys are **always omitted**.

INFERENCE — consequences for the v4 pathway as shipped:

1. `crit-sep-screen` requires `infeccao_suspeita` in **both** OR arms
   (`pathways/sepse.yaml:222-245`) → the SSC-styled screening criterion **can never
   fire** for any patient. A sepsis pathway whose front door is structurally
   unevaluable is the HAZ-0043 pattern (permanent non-evaluation habituated into quiet)
   and, because the no-fire is unrecorded, HAZ-0021.
2. `crit-sep-pct-rising` and `crit-sep-pct-deesc` require `atb_ativa_horas` → never fire.
3. `crit-sep-culturas-antes-atb` and `crit-sep-fluid` → never evaluable.
4. Meanwhile `qsofa_score`/`sirs_count` are **always emitted** even from zero
   measurements (`sepsis_input_provider.py:21-25, 360-361`) — so the criteria that *can*
   evaluate are exactly the zero-coerced ones (§7). The pathway's live surface therefore
   reduces to: possibly-stale qSOFA/SIRS bands, lactate/PCT/PAM bands where labs exist,
   and the shock/bundle criteria on partial inputs.

Cross-reference: for V2, `compatibility-finding.md` §3 makes even that reduced surface
unavailable from AMH today (zero populated Observations of any category; no vital-signs
profile; no medication-administration or fluid-balance contract). CAND-0004's
infection-gate source gap ("absent from the contract inventory — not blocked, simply
absent") remains the single hardest dependency of any Sepsis-3-faithful pathway.

## 6. Governance finding — the "RATIFIED" claims

`domain_sepsis.py:10-11, 62-66` and `pathways/sepse.yaml:221` claim "CLINICALLY RATIFIED
(RAT-SEPSE-01/02)". OBSERVED: `docs/plan/_work/ratification-decisions.yaml:1-3` states
the ratifying authority as `'repository owner delegation (session directive: "use deep
think to decide on the RATIFICATION items and close PR #3 …")'` — an en-bloc delegation
executed 2026-07-04 over 269 decisions, and `dispositions/sepse-p1.yaml:24` shows
RAT-SEPSE-01 was the *generation-choice* decision (G1-AND vs G3-OR) taken under that same
delegation. No named clinical approver with verifiable credentials appears anywhere in the
chain (consistent with LEGACY-TA:125/465). Under `evidence-notation.md` §2 rule 3 and
§4, none of these claims can stand as DECIDED in V2; every legacy "RATIFIED" badge on
sepsis content is void for V2 purposes and is re-opened by this review.

## 7. HAZ-0005 zero-coercion — pathway-level trace

| Site | Mechanism | Decisive lines |
|---|---|---|
| SIRS count | each unmeasured criterion contributes 0; four-`None` inputs give SIRS = 0, indistinguishable from four-normal | `domain_sepsis.py:206-234` |
| qSOFA points | inherits `calculate_qsofa` coercion; pre-computed `qsofa` key trusted unvalidated | `domain_sepsis.py:247-261`; `qsofa.py:79-115` |
| Provider boundary | `sirs_count`/`qsofa_score` always emitted, even with zero measurements — the sole exception to the provider's own omit-when-unknown contract, acknowledged in-source as "inherited canonical behavior" | `sepsis_input_provider.py:21-25, 197-231, 360-361` |
| Screen no-fire | missing infection evidence → `(False, "No infection evidence…")` — an unpersisted reason string; with no evaluation-status contract the no-fire is silent (HAZ-0021) | `domain_sepsis.py:276-278` |
| Shock arm | `map_val is None` → arm skipped → not-fired; absent MAP reads as not-in-shock | `domain_sepsis.py:335-347` |
| Evaluator errors | exceptions become `severity="unknown", fired=False` result rows — errors coerced to non-alerts | `domain_sepsis.py:558-568` |

**Verdict: HAZ-0005 confirmed at every aggregation point; the declarative v4 design
*correctly* treats missing inputs as pending criteria (fail-safe) except for the two
score keys, where the coercion is deliberately preserved for compatibility — the
exception swallows the rule, because those two keys drive the primary screening bands.**

## 8. Clinical verdicts — PROPOSAL, per legacy-import-policy §4

| Artifact | Verdict | Rationale |
|---|---|---|
| G1-G3 major/minor screening catalogs (RULE-SEPSE-001…-005, -007…-058 families) | **REJECT (retain as failure catalog)** | No external authority; three mutually contradictory generations; dead branches; label-vs-predicate drift. Regression-vector value only. |
| G4/G5 screen concept (infection gate + qSOFA-OR-SIRS) | **VALIDATE** | Plausible composite, unvalidated instrument, no infection-suspicion source exists; admission gated on CAND-0004 resolution and named clinical ownership. |
| G4 "organ dysfunction" (qSOFA + lactate) | **REJECT** | Substitutes an unvalidated proxy for Sepsis-3's SOFA Δ≥2 while a SOFA engine exists; misleading alert name. |
| Root `sepse.yaml` `sepsis_sofa_alert` (`sofa_delta >= 2`) | **TRANSFORM** | The only Sepsis-3-conformant sepsis criterion in the repository; currently a dead criterion (no producer). Concept survives into V2 only with a ratified baseline convention and full-SOFA evaluability (`sofa-review.md` §7). |
| Septic-shock alerts (all three variants) | **REJECT** | None implements Sepsis-3 shock; lactate-≥4-alone asserts shock without infection or vasopressor context; refractory-MAP arms under-identify stabilized shock. V2 must derive shock criteria directly from Singer 2016. |
| Hour-1 bundle timer concept | **REFINE** | Escalating on overdue bundle items is sound SSC-2021 practice support; requires: anchor redefined to recognition time, 1 h vs 3 h stratification by shock/likelihood, culture timing subordinated to the antibiotics-first-with-cultures-before rule (P-07), real accept/administration timestamps. |
| Cultures-before-antibiotics criterion | **REFINE** | Correct SSC intent; needs the <45-min no-substantial-delay framing and an actual culture data source. |
| Fluid 30 mL/kg criterion | **REJECT** | Weak-recommendation content hard-coded as critical-severity banding with invented sub-bands, inverted severity semantics outside resuscitation, and no data source. |
| PCT rising "treatment failure" alert | **REJECT** | No guideline basis; uncited thresholds. |
| PCT de-escalation criterion | **VALIDATE** | Direction consistent with SSC 2021 discontinuation suggestion (weak); thresholds and the de-escalation-vs-discontinuation framing need clinical restatement and citation; stability gate is a good instinct. |
| SIRS computation | **VALIDATE** | Cut-points exact to Bone 1992; role of SIRS in a 2021-era screen is itself a clinical decision (SSC 2021 prefers NEWS/MEWS/SIRS over qSOFA but endorses none as definitive). |
| `sepsis_input_provider` omit-when-unknown contract | **TRANSFORM** | The only legacy component whose missing-data philosophy matches V2's (absence = pending, never defaulted) — minus its two-score exception. Its "Known data gaps" docstring is a model of honest evidence practice. Concept survives as V2's evaluation-status algebra; code does not. |
| v4 five-state care flow (`states:`, `pathways/sepse.yaml:384-413`) | **VALIDATE** | Clinically coherent narrative (triage → confirmation → treatment → stabilization → resolution) but transitions are not bound to criteria in the reviewed content; belongs to the pathways workstream for structural review. |
| "SSC-2021 RATIFIED" / RAT-SEPSE badges | **REJECT** | §6. Void authority chain. |

## 9. Surviving elements proposed for V2 specs (PROPOSAL)

1. **Definitions come only from Singer 2016 + Evans 2021, cited per criterion** — every
   numeric threshold in a V2 sepsis pathway carries its own citation or is explicitly
   labeled institutional-and-ratified. The legacy corpus demonstrates what accretes
   without this rule (three shock definitions, three screen aggregations, ≥3 lactate
   thresholds).
2. **Screening instrument choice is a named clinical decision**, constrained by SSC
   2021's qSOFA recommendation (`qsofa-review.md` §6) and by source evaluability
   (infection-suspicion signal first — CAND-0004).
3. **Organ dysfunction = ΔSOFA ≥2 or nothing**: no qSOFA/lactate proxy wearing the name;
   gated on `sofa-review.md` §7 (INPUT TO ADR-0008) — today that means the sepsis
   pathway's confirmation tier is `not_evaluated` until SOFA inputs exist.
4. **Septic shock re-derived verbatim from Sepsis-3** (vasopressor requirement to
   maintain MAP ≥65 AND lactate >2 despite adequate resuscitation), with the
   stabilized-on-pressors case explicitly test-vectored, since all three legacy variants
   miss it.
5. **Bundle timers anchored to recognition with 1 h/3 h stratification** and real
   administration/collection timestamps; cultures-before-ATB as a sequencing check with
   the <45-min delay bound.
6. The provider's **omit-when-unknown contract, universalized** (no score-key exception),
   plus §7's rows as SAF-0002 absent-input probe vectors and §5's never-evaluable
   criteria as the standing HAZ-0043 test case.
7. Freshness windows per input as ratified clinical parameters (VAL-0023): the legacy
   values (none for vitals; 72 h labs; 14 d PCT) are evidence of the question, not
   answers.

*Reviewed by rodaquino-OMNI (accountable reviewer of record, GDEC-0003). No PHI; all
values are published thresholds or synthetic examples.*
