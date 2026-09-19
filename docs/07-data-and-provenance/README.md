---
doc_id: STUB-07-DATA-AND-PROVENANCE
status: PROPOSAL
owner: UNASSIGNED — VALIDATION REQUIRED
source: INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §9.3, §16; docs/06-architecture/adrs/adr-index.md
date_collected: 2026-08-15
collector: delivery orchestrator
last_updated: 2026-09-19
addenda:
  - "2026-09-19: premissa do esvaziamento lapidou — ADR-0005 accepted (2026-08-15, GDEC-0008) e ADR-0006 accepted (2026-08-16, GDEC-0016, Opção A); o stub PERMANECE vazio até o conteúdo físico real existir (achado MIN-3 / ECA-35)"
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

---

**Adendo datado (2026-09-19 — varredura de verdade documental ORQ-7; achado
MIN-3, registrado como ECA-35 em
`docs/01-vision-and-intended-use/exclusoes-e-capacidades-adiadas.md`).** A
premissa do esvaziamento acima lapidou: `ADR-0005` está `accepted` desde
2026-08-15 (GDEC-0008) e `ADR-0006` está `accepted` desde 2026-08-16
(GDEC-0016, Opção A — cabeçalhos dos próprios arquivos; a atualização de
2026-08-16 do `adr-index.md` registra o aceite em lote). A condição
"Populated when" já está satisfeita; este diretório segue VAZIO porque o
conteúdo físico ainda não foi escrito, não porque as decisões pendam. Este
adendo registra a obsolescência; AUTORAR o conteúdo físico de docs/07 está
FORA do escopo da varredura documental — permanece trabalho próprio,
encaminhado ao destinatário que o ECA-35 já aponta (`AUTH-DATA-PLATFORM`).
