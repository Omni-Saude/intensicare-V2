---
id: LEGREV-CDF-ADR0028
title: Legacy review — context classification of ADR-0028 (evolucoes clinical-notes architecture)
label: PROPOSAL
status: PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI)
statement: >
  Context classification (not an audit) of the legacy repository's own
  ADR-0028, which documents that repository's prior, unratified planning for
  a hybrid SBAR clinical-notes architecture. Recorded so the ADR's content
  and its authority (or lack of it) are not conflated with IntensiCare V2's
  own decisions.
provenance:
  source_repo: intensicare (legacy V1, READ-ONLY)
  path_or_url: docs/adr/0028-evolucoes-clinical-notes-architecture.md
  commit_sha_or_version: 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79
  section_or_lines: whole document (301 lines)
  date_collected: 2026-08-15
  last_updated: 2026-08-15
  collector: legacy clinical-documentation and forms forensics reviewer (cycle 1, Task 1, wave 1b, workstream CDF)
  transformation: summarized; not imported
  confidence: high (what the document says) / low (whether it should influence V2 — that is VALIDATION REQUIRED)
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  hazards: [HAZ-0036]
  adrs: []
  pr: null
supersedes: null
superseded_by: null
---

# ADR-0028 (legacy) — context classification only

> **PROPOSAL — AWAITING NAMED CLINICAL REVIEW.** Per this workstream's task
> packet, this is a **classification of context**, not a line-by-line audit.
> The audit of the actual code this ADR describes is in
> `evolucoes-domain-review.md`.

## 0. Integrity

OBSERVED 2026-08-15: `shasum -a 256
docs/adr/0028-evolucoes-clinical-notes-architecture.md` →
`d478d0a9ec7b4754c98404f8bff8fe78cf7e8ab3a8720e61c91b954f71c195e8`, matching
`docs/archive/legacy-provenance/legacy-pin-cycle-1.md`.

## 1. What this document is

`docs/adr/0028-evolucoes-clinical-notes-architecture.md`, dated 2026-07-07,
status "accepted" (**within the legacy repository's own, separate governance
— this status has no standing in IntensiCare V2**), is an Architecture
Decision Record authored as part of a **prior planning effort that already
called itself "V2"**, conducted entirely inside the legacy repository
(`/Users/familia/intensicare`). That prior effort has its own ADR sequence
(the document cites ADR-0005, ADR-0007, ADR-0008, ADR-0015, ADR-0020,
ADR-0025, ADR-0029 as siblings, plus the legacy-internal `ADR-001-amh-data-
platform-consumer.md`) which is **entirely separate from, and has no
authority over, the current IntensiCare V2 repository's own ADR sequence** in
`intensicare-V2`. This document is therefore treated as risk-informed input
material (per `legacy-import-policy.md` §2), not as a ratified architectural
decision for the product actually being built in this repository.

## 2. What it decides (for its own, prior context)

Facing three options for how structured clinical-note documentation should
be (free text only / hybrid SBAR with structured Background + free-text
Assessment-Recommendation / fully coded FHIR-observation-only), it selects
**Option 2, the hybrid SBAR model**:

- **S**ituation and **B**ackground sections are structured, typed,
  pre-filled fields (vitals from the EWS/NRT pipeline, scores "pré-
  calculados pelo `PioraClinicaService` e serviços de scoring" — i.e.
  computed by the canonical scoring services, not locally — line 184-185).
- **A**ssessment and **R**ecommendation are free-text rich content, with an
  LLM offered as an assistive (never decision-making) layer, explicitly tied
  to that prior effort's own ADR-0008 "L0-hard: system never decides
  conduct."
- Immutability via SHA-256 content hash and adenda-only correction (never
  in-place edit), citing CFM 1.638/2002 and 1.821/2007 recordkeeping
  resolutions.
- Explicitly names the SOFA-badge pattern this workstream was asked to
  investigate: *"SOFA pré-calculado exibido como badge no topo do
  formulário (RULE-EVOLUCOES-001/002), demonstrando que mesmo o campo
  'narrativo' carrega dados estruturados computados server-side"* (line
  25-26).

## 3. Relevance to this workstream's findings

- The ADR's own stated design intent (scores sourced from canonical
  services, never computed locally in the notes domain) is **consistent
  with** what `evolucoes-domain-review.md` §5 found in the actual code: no
  local SOFA fork inside `domain_evolucoes.py`.
- The ADR's stated requirement for structured, validated Background fields
  is **not met** by the actual `create_evolution()`/`EvolutionSection`
  implementation reviewed in `evolucoes-domain-review.md` §1.1/§2/§7, which
  only ever persists an opaque free-text `content` string per section. This
  is an architecture-vs-implementation gap **within the legacy repository
  itself**, not a V2 defect — but it is exactly the kind of gap a future V2
  design (if it adopts anything from this ADR's reasoning) must not repeat.
- The ADR cites an **81-rule** evolucoes catalog; this workstream's assigned,
  reconciled cluster is **77 rules** — see
  `evolucoes-domain-review.md` §8 and `evolucoes-cluster-review.md` §0 for
  the discrepancy note.
- The LLM-assistant framing (§7 of the ADR: summarization, entity
  extraction, bundle suggestion, "nenhuma dessas funções bloqueia o fluxo
  clínico") is the kind of automation-output-reads-as-directive pattern
  HAZ-0036 exists to catch; recorded as a link on this record for whichever
  V2 workstream eventually designs any LLM-assisted documentation feature —
  no such feature exists in the reviewed code today, so this is a forward
  pointer, not a finding against current source.

## 4. Classification

**Context only — not proposed for import, and not audited as an artifact.**
If a future V2 clinical-forms design revisits the hybrid-SBAR question, this
document is legitimate INFERENCE-grade background reading (it reasons
through real trade-offs with cited clinical rationale), but every concrete
claim in it — the CFM citations, the "reduces documentation time 2-5
minutes" estimate, the LLM recall/precision framing — is itself unverified
by this review and would need independent verification before carrying any
weight in a V2 decision.

**PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).**
