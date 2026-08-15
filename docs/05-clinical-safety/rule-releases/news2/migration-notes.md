---
id: RULE-NEWS2-MIGRATION-NOTES
title: NEWS2 rule-release precursor — rule-local migration notes (legacy disposition)
label: PROPOSAL
statement: >
  Rule-local summary of what RULE-NEWS2 0.1.0 supersedes, retains as re-derived
  published content, and rejects from the legacy V1 implementation, citing only the
  cycle-1 forensic review records. PROPOSAL — AWAITING NAMED CLINICAL REVIEW
  (reviewer: rodaquino-OMNI).
provenance:
  source_repo: intensicare-V2 (review records; legacy cited only through them)
  path_or_url: docs/05-clinical-safety/legacy-review/ews/ (news2-review.md, mews-review.md, shared-findings.md)
  commit_sha_or_version: "legacy pin 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79 per docs/archive/legacy-provenance/legacy-pin-cycle-1.md; review records at working tree 2026-08-15"
  section_or_lines: news2-review.md sections 3-6; shared-findings.md SF-1..SF-9; mews-review.md section 6
  date_collected: 2026-08-15
  collector: NEWS2 V2 clinical-content specification author (cycle-1 Task 2 agent); accountable reviewer rodaquino-OMNI
  transformation: summarized from the cited review records; no legacy source consulted directly by this author
  confidence: high
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  requirements: [SAF-0001, SAF-0002, SAF-0003]
  hazards: [HAZ-0005]
  adrs: []
  tests: []
  pr: null
supersedes: null
superseded_by: null
---

# RULE-NEWS2 0.1.0 — migration notes (rule-local)

Scope: this file records only the NEWS2-rule-local disposition. The full V2 migration
manifest is another specialist's deliverable; nothing here amends it. All legacy
citations are **via the review records only** (`../../legacy-review/ews/`), legacy
pinned at `1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79`
(`docs/archive/legacy-provenance/legacy-pin-cycle-1.md`). This author read no legacy
source directly.

## 1. Verdict inherited from the forensic review

SOURCE (`news2-review.md` §6): legacy NEWS2 verdict **TRANSFORM** with element-level
REJECT and VALIDATE — "the published instrument was transcribed mostly faithfully at
the band level, but the implementation is unsafe as a whole... Nothing may be imported
as code." RULE-NEWS2 0.1.0 is the TRANSFORM output: a re-derivation from the RCP 2017
primary source, not a port.

## 2. Retained — as re-derived published content only (never as legacy code)

| Element | Where in RULE-NEWS2 | Basis |
|---|---|---|
| Seven-parameter band tables matching the published chart (RR, SpO2 Scale 1, air/oxygen +2, SBP, pulse, temperature, consciousness Alert=0/CVPU=3) | `specification.md` §4.1 | Re-derived from the issuer PDF by this author (2026-08-15), cross-checked against `news2-review.md` §2. Legacy agreement (news2-review.md §3 "Faithful" list) is corroboration, not provenance. |
| Aggregate cut-points 5 and 7 and the four-tier response model **including the Low–medium single-red tier** legacy never delivered in production (D-5/D-6) | `specification.md` §4.2 | Re-derived from RCP Chart 2 (issuer PDF). |
| Float-rounding guard **concept** (compare at chart resolution) | `specification.md` §4.1, REFINEd; tie direction open (Q7) | `news2-review.md` §6 RETAIN-as-concept. |
| Versioned algorithm-identity **concept** | rule id + semver + content hash under ADR-0007 bundle lifecycle | `news2-review.md` §6 — V1's own version practice is the counter-example (§3 version-identity finding). |
| Edge-triggered/cooldown alerting design intent | NOT adopted in 0.1.0 (advisory display only); left to alerting specialists | `news2-review.md` §6 marks it VALIDATE (unimplemented, unvalidated in legacy — SF-1: the runner was dead code). |

## 3. Rejected — with the RULE-NEWS2 replacement

| Legacy element (review citation) | Why rejected | RULE-NEWS2 replacement |
|---|---|---|
| Both Scale-2 band branches: on-O2 branch scoring ≤92→0 (D-1, SpO2 70 % on O2 scored 0); off-O2 branch shifted one band, scoring the BTS 88–92 target as abnormal (D-2) | Under-scores profound hypoxaemia to reassurance; over-scores at-target patients | Correct Scale-2 table from RCP Chart 1 (`specification.md` §3.3): low bands apply regardless of oxygen; 88–92 = 0. Vectors CRV-0119/0120, CRV-0124–0137 |
| Scale-selection mechanism: `hypercapnic` parameter no workflow could set (D-3); supplemental-O2-selects-Scale-2 in the NRT runner (D-4) | Scale 2 unreachable in every production aggregate path; O2 status must never select the scale | Governed clinician order `spo2_scale_assignment` with provenance; Scale 1 default when absent (`specification.md` §3.2). Vectors CRV-0121–0123 |
| Zero-coercion of every missing input (`news2-review.md` §5, decisive line news2.py:84-85; HAZ-0005 E1 — occurred) and unknown-O2-status ≡ "air" (§4.2) | All-absent yielded total 0 / "low" / bed "normal"; legacy tests asserted this as correct | `not_evaluated` with per-input reasons; no numeric substitute anywhere (`specification.md` §5). Vectors CRV-0102–0109 |
| Consciousness coercions: HL7 path dropped 'C' to None→0 (D-7); scorer scored any non-A string 3 (D-8); no chronic/new distinction; GCS collected but never mapped | Path-dependent under/over-scoring; invalid tokens coerced to a pole | Explicit ACVPU token set; unmapped token → `invalid`, never 0, never 3 (`specification.md` §2.1, §5.4); GCS mapping deferred to reviewer/ADR (Q4). Vectors CRV-0116, CRV-0172–0176 |
| Aggregate-only production alerting with configurable thresholds and no clinical floor (D-6; SF-4) | Red-score tier absent; the accidental watch=3 mitigation collapses under tenant override | Four-tier advisory display incl. Low–medium; monotonicity constraint — config may tighten, never loosen (ADR-0007 hook) (`specification.md` §4.2–4.3). Vector CRV-0189 |
| No population gating anywhere (D-9; SF-6) | Out-of-population output produced silently; no age field even expressible | Enforceable age gate; unknown age → `not_evaluated`, never assumed adult (`specification.md` §1.2; VAL-0006/0007). Vectors CRV-0114/0115 |
| "NEWS2-v3.0.0" version/ratification trail (§3 version-identity finding; SF-2) | Version string does not identify the algorithm that ran; ratification trail terminates in a migration docstring; sign-off approver lacked verifiable registration | Fresh identity RULE-NEWS2 0.1.0; nothing inherited; every band requires fresh named ratification (evidence-notation.md §2 rule 3) |
| Scoring rows regardless of field staleness — no freshness policy at the scoring boundary (SF-5) | VAL-0023's concrete legacy input; nothing to import | Per-input windows and expiry horizons proposed for named review (`specification.md` §2.2). Vectors CRV-0110–0112 |

## 4. MEWS — family disposition (informative; no MEWS spec is authored)

SOURCE (`mews-review.md` §6): MEWS verdict **VALIDATE**, with its primary source
(Subbe 2001 Table 1) verified only at abstract level — blocking VALIDATION REQUIRED
before any MEWS band could be labeled SOURCE (SF-9 item 2). The portfolio records
propose NEWS2 as the early-warning-score **family representative**, with MEWS a likely
portfolio-level SUPERSEDE by NEWS2. Accordingly, this task authored **no MEWS
specification**; whether MEWS is formally superseded is a portfolio decision for the
named reviewer, not a disposition this file can make. If that decision lands,
`supersedes` fields are updated at the portfolio level — not here preemptively.

## 5. What this precursor supersedes in V2

Nothing. `supersedes: null` — there is no prior V2 NEWS2 rule release. This file
exists so that the first real release (1.0.0, post-review, signed bundle per ADR-0007)
inherits a complete legacy-disposition trail from day one.
