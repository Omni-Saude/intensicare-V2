---
doc_id: STUB-09-API-EVENTS-MCP
status: PROPOSAL
owner: UNASSIGNED — VALIDATION REQUIRED
source: INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §12, §16, Gate G4/G5; docs/06-architecture/adrs/adr-index.md
date_collected: 2026-08-15
collector: delivery orchestrator
last_updated: 2026-08-15
---

# 09 — API, events, and MCP (deliberately empty)

**Why empty:** prompt §12 requires versioned OpenAPI/AsyncAPI contracts
*before implementation* — but a contract authored before the AMH platform
boundary (ADR-0001, `proposed`), API versioning/error-model strategy
(ADR-0012), FHIR/HL7 profiles (ADR-0013), and MCP exposure policy (ADR-0014)
are decided would be an invented interface, which non-negotiable rule and §2
discipline forbid ("never fabricate an interface"). MCP additionally requires
its own ADR and threat coverage (§12.4; THR-0061..0067 already enumerate its
threat surface in `docs/11-security-privacy-compliance/threat-model.md`).

**Populated when:** ADR-0001 and ADR-0012..0014 are accepted; first artifacts
will be the OpenAPI/AsyncAPI drafts for the G7 vertical slice, with contract
tests per `docs/12-quality-validation-and-testing/test-strategy.md`.
