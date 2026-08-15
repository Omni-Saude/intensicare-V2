---
doc_id: STUB-07-DATA-AND-PROVENANCE
status: PROPOSAL
owner: UNASSIGNED — VALIDATION REQUIRED
source: INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §9.3, §16; docs/06-architecture/adrs/adr-index.md
date_collected: 2026-08-15
collector: delivery orchestrator
last_updated: 2026-08-15
---

# 07 — Data and provenance (deliberately empty)

**Why empty:** the *conceptual* time/provenance/status model already exists in
`docs/03-domain/` (`time-semantics.md`, `status-dimensions.md`,
`invariants/DOM-invariants.md`). The *physical* data-and-provenance design
that belongs here depends on undecided ADRs: ADR-0005 (canonical observation,
provenance, quality, correction and time model) and ADR-0006 (operational vs
analytical source-of-truth and reconciliation) — both `not-started` in
`docs/06-architecture/adrs/adr-index.md`. Writing physical schemas before
those decisions would violate non-negotiable rule 14 (no technology by
inheritance) and prompt §9.3 ("without prematurely choosing a physical schema").

**Populated when:** ADR-0005/ADR-0006 reach `accepted`, carrying the physical
model, lineage design, and correction/conflict handling with their evidence.
