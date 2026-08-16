---
doc_id: STUB-09-API-EVENTS-MCP
status: PROPOSAL
owner: UNASSIGNED — VALIDATION REQUIRED
source: >
  INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §12, §16, Gate G4/G5;
  docs/06-architecture/adrs/adr-index.md; GDEC-0013..0017 (regime de
  construção); mapa-de-projeto-ate-producao.md item SPR-G4-4
date_collected: 2026-08-15
collector: delivery orchestrator; atualizado por especialista de publicação
  de contratos como documentação (SPR-G4-4, ciclo 6)
last_updated: 2026-08-16
---

# 09 — API, events, and MCP

**Atualização (2026-08-16, SPR-G4-4):** ADR-0001 (accepted, GDEC-0008) e
ADR-0012/0013/0014 (accepted em direção, GDEC-0016; minutas materializadas
em construção, GDEC-0015) tornaram este diretório populável sob o regime
de construção vigente — aceite de ADR deixou de ser pré-condição de
implementação (GDEC-0015). Este diretório deixa de estar deliberadamente
vazio; contém agora um índice de contratos e três documentos PROPOSAL
contract-first:

- [`indice-de-contratos.md`](./indice-de-contratos.md) — o que existe de
  fato (fonte de verdade real: `packages/contratos/openapi.yaml`), versão,
  estado, e o que é apenas plano.
- [`catalogo-de-eventos.md`](./catalogo-de-eventos.md) — eventos do outbox
  real (`packages/persistencia`) desta fatia, como semente de uma futura
  especificação AsyncAPI (ainda inexistente).
- [`politica-mcp.md`](./politica-mcp.md) — espelho operacional da
  ADR-0014; afirma explicitamente que nenhuma superfície MCP existe
  implementada.
- [`perfis-fhir-plano.md`](./perfis-fhir-plano.md) — plano de perfis FHIR
  R4 restritos por recurso (`Observation`, `Encounter`, `Patient`) desta
  fatia; afirma explicitamente que nenhum perfil FHIR existe implementado.

Nenhum destes quatro documentos eleva o status de ciclo de vida de nenhuma
ADR em `adr-index.md` (não tocado por esta tarefa) — a ratificação
cláusula a cláusula de ADR-0012/0013/0014 pelo titular permanece um ato
humano futuro e separado (GDEC-0016 aceitou apenas a direção em lote).

**Histórico — por que estava vazio antes desta atualização:** prompt §12
exige contratos OpenAPI/AsyncAPI versionados *antes da implementação* — mas
um contrato redigido antes de a fronteira da plataforma AMH (ADR-0001), a
estratégia de versionamento/erro de API (ADR-0012), os perfis FHIR/HL7
(ADR-0013) e a política de exposição MCP (ADR-0014) terem ao menos direção
registrada seria uma interface inventada, proibida pela regra não
negociável e pela disciplina do §2 ("never fabricate an interface"). MCP
exige adicionalmente cobertura de ameaça própria (§12.4; THR-0061..0067 já
enumeradas em `docs/11-security-privacy-compliance/threat-model.md`).
