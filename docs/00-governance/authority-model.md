---
doc_id: GOV-AUTHORITY-MODEL
status: PROPOSAL
owner: UNASSIGNED — VALIDATION REQUIRED
source: INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §5 (Gate G0), §4 (Required specialist pool)
last_updated: 2026-08-15
---

# Authority Model

PROPOSAL — this document names the decision-owner *roles* required to pass Gate
G0 (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:239-249`). No human is named. Every
`owner` field below reads `UNASSIGNED — VALIDATION REQUIRED` verbatim, per this
task's `decisions_prohibited: naming any human owner/approver`. This document
does not, and cannot, close Gate G0 by itself — it only creates the skeleton
that a human authority must fill in.

## 1. Decision-owner roles required by the prompt

SOURCE (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:247-249`): Gate G0 requires that
"product, clinical safety, security, privacy/legal, data-platform, UX, and
operations decision owners are named" and that "intended use has a named human
approver."

| Role ID | Role | Accountable for | Owner (name) | Status |
|---|---|---|---|---|
| `AUTH-PRODUCT` | Product decision owner | Product scope, prioritization, outcome tree, non-clinical acceptance | UNASSIGNED — VALIDATION REQUIRED | OPEN |
| `AUTH-CLINSAFETY` | Clinical safety decision owner | Hazard acceptance, safety-case sign-off, residual-risk acceptance | UNASSIGNED — VALIDATION REQUIRED | OPEN |
| `AUTH-SECURITY` | Security decision owner | Threat-model acceptance, penetration-test acceptance, security exceptions | UNASSIGNED — VALIDATION REQUIRED | OPEN |
| `AUTH-PRIVACY-LEGAL` | Privacy/legal decision owner | LGPD basis, processor terms, residency, retention, legal holds | UNASSIGNED — VALIDATION REQUIRED | OPEN |
| `AUTH-DATA-PLATFORM` | Data-platform decision owner | AMH boundary, contract acceptance, data-quality policy | UNASSIGNED — VALIDATION REQUIRED | OPEN |
| `AUTH-UX` | UX decision owner | Participant-research acceptance, accessibility sign-off, workflow acceptance | UNASSIGNED — VALIDATION REQUIRED | OPEN |
| `AUTH-OPERATIONS` | Operations decision owner | SLO/RTO/RPO acceptance, go-live operational readiness | UNASSIGNED — VALIDATION REQUIRED | OPEN |
| `AUTH-INTENDED-USE` | Intended-use approver | Care setting, population, exclusions, advisory-vs-directive boundary | UNASSIGNED — VALIDATION REQUIRED | OPEN |

## 2. AMH owners (external authority, not V2-internal)

SOURCE (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:169,173-176,246`): several
specialist roles explicitly "must not self-approve" AMH acceptance —
"AMH owner sign-off," "AMH contract acceptance," "AMH or V2 contract
acceptance." AMH ownership is external to IntensiCare V2 and belongs to
`Omni-Saude/amh-data-platform`.

| Role ID | Role | Accountable for | Owner (name) | Status |
|---|---|---|---|---|
| `AUTH-AMH-OWNER` | AMH-data platform owner(s) | License/IP authority, contract publication approval, tenant/MPI policy resolution (ADR-006/ADR-039/ADR-041 conflict) | UNASSIGNED — VALIDATION REQUIRED | OPEN — no AMH-side contact has been established in the evidence collected as of 2026-08-14 |

INFERENCE (from `INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:104,246` and the observed
GitHub API license status recorded in `registers/evidence-register.md`
`EVID-0008`): until an AMH owner is named and reachable, no AMH artifact reuse,
contract acceptance, or identity-policy decision can be DECIDED — only
PROPOSAL. See `registers/blockers-register.md` `BLK-0009` and `BLK-0010`.

## 3. Escalation model (skeleton)

PROPOSAL — the following escalation skeleton is a starting structure only; it
requires validation and ratification by the named owners above once they exist.

1. **Specialist level** — a specialist agent or contributor identifies a
   decision that requires human acceptance (clinical, legal, privacy,
   regulatory, operational, or residual-risk per
   `INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:207`). It records the item as
   `VALIDATION REQUIRED` in the relevant register with the correct `AUTH-*`
   role tagged as the required decider.
2. **Role level** — the named human holding that `AUTH-*` role reviews the
   item. They may DECIDE it directly if it is within their sole authority, or
   escalate if it crosses roles (e.g. a change with both clinical-safety and
   privacy/legal implications escalates to both `AUTH-CLINSAFETY` and
   `AUTH-PRIVACY-LEGAL`).
3. **Cross-role conflict** — if two named owners disagree, or if a decision
   requires trading off between roles (e.g. product speed vs. clinical
   safety), escalate to a joint review. This document does not name who
   convenes that review; that is itself `VALIDATION REQUIRED` and should be
   decided when the first `AUTH-*` roles are staffed.
4. **No self-approval** — per prompt §4 "Required independence"
   (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:197-207`) and the specialist-pool
   table's "must not self-approve" column, no role may approve its own
   implementation output. See `decision-rights.md` §2 for the enforced pairs.
5. **Unresolvable / out-of-scope** — if no named owner exists, or the required
   independence cannot be satisfied (e.g. only one person available for both
   sides of a required-independence pair), the item is not decided. It is
   logged as a blocker (`registers/blockers-register.md`) and work that
   depends on it stops, per prompt §20 stop conditions.

## 4. What this document does not do

- It does not name any person. Doing so is explicitly out of scope for this
  task (`decisions_prohibited`).
- It does not accept any risk or approve any policy. All approvals referenced
  here remain `UNASSIGNED — VALIDATION REQUIRED`.
- It does not close Gate G0. Gate G0 closes only when every row in §1 and §2
  has a named, reachable human and the escalation model in §3 has itself been
  validated. Until then, see `registers/blockers-register.md`.

---

## 5. Apêndice — titulares interinos nomeados (2026-08-15)

**Nota de idioma e de forma:** esta seção é conteúdo **novo**, redigida em
pt-BR conforme `decision-register.md` `GDEC-0006` (política de idioma,
DEC-G0-10). Os §§1–4 acima são o corpus do ciclo 0, em inglês, e **não são
reescritos** por esta adição — permanecem como registro histórico do estado
"nenhum titular nomeado" que vigorava até 2026-08-14. Este §5 é a fonte
prática e atual de quem detém cada papel; onde houver conflito aparente
entre "UNASSIGNED" nas tabelas de §1–2 e este apêndice, **este apêndice
prevalece por ser posterior e mais específico**, mas nenhuma tabela acima
foi alterada — a discrepância é intencional e documenta a evolução no
tempo, não um erro.

**Titular único:** `rodaquino-OMNI` — CEO e acionista principal da OMNI e da
AMH, médico intensivista. Autoridade e fundamento de cada papel estão
registrados em `registers/g0-resolucoes-2026-08-15.md` (`DEC-G0-01` a
`DEC-G0-09`) e alocados como `decision-register.md` `GDEC-0004`.

| Papel (`Role ID`) | Titular | Escopo / restrição | Decisão-fonte |
|---|---|---|---|
| `AUTH-PRODUCT` | rodaquino-OMNI | Interino; gatilho de revisão: entrada de líder de produto ou parceiro comercial | `DEC-G0-01` |
| `AUTH-CLINSAFETY` | rodaquino-OMNI | **Parcial — apenas artefatos do ciclo 1** (revisor clínico / aprovador de conteúdo clínico); credencial autodeclarada, não verificada independentemente; exige segundo revisor para conteúdo que o próprio titular redigir; papel pleno permanece `VALIDAÇÃO NECESSÁRIA` (`BLK-0002` continua `OPEN`) | `GDEC-0003` |
| `AUTH-SECURITY` | rodaquino-OMNI | **Somente decisões de fase de projeto.** Aceitação do Gate G6 (teste de intrusão, risco residual) exige verificador terceiro independente — o titular aceita o laudo, não pode ser o verificador | `DEC-G0-02` |
| `AUTH-PRIVACY-LEGAL` | *(nenhum — não resolvido)* | Reclassificado de G0 para pré-condição de G6/G8; desenvolvimento prossegue somente com dados sintéticos; parecer jurídico brasileiro obrigatório antes de qualquer dado real | `DEC-G0-03` |
| `AUTH-DATA-PLATFORM` | rodaquino-OMNI | Lado V2; ver também `AUTH-AMH-OWNER` abaixo (mesmo titular) | `DEC-G0-04` |
| `AUTH-UX` | rodaquino-OMNI | Interino; conhecimento clínico próprio do titular vale como hipótese de especialista, nunca como evidência de observação do Gate G1 | `DEC-G0-05` |
| `AUTH-OPERATIONS` | rodaquino-OMNI | Interino; gatilho: no Gate G8, par "dono do pipeline ≠ autoridade de go-live" exige segundo humano | `DEC-G0-06` |
| `AUTH-INTENDED-USE` | rodaquino-OMNI | **Parcial — apenas artefatos do ciclo 1**; a declaração de uso pretendido em si (`docs/01-vision-and-intended-use/`) permanece PROPOSAL não revisada pelo próprio titular como revisor nomeado; papel pleno permanece `VALIDAÇÃO NECESSÁRIA` (`BLK-0008` continua `OPEN`) | `GDEC-0003` |

### 5.1 AMH-side (fora de §2 acima)

| Papel (`Role ID`) | Titular | Escopo / restrição | Decisão-fonte |
|---|---|---|---|
| `AUTH-AMH-OWNER` | rodaquino-OMNI | Declarado, na qualidade de CEO e acionista principal de ambas as empresas (OMNI e AMH); consequência imediata: adjudicação de identidade AQ-1..AQ-6 tornou-se respondível (ver `decision-register.md` `GDEC-0005`) | `DEC-G0-04` |

### 5.2 Risco registrado, não resolvido por esta seção

A concentração de praticamente todos os papéis `AUTH-*` em um único titular
— que é também a autoridade declarada do lado AMH em um contrato
AMH×IntensiCare — está registrada como risco em
`registers/risk-register.md` `RISK-0007`. Este apêndice **descreve** a
titularidade decidida; não a avalia nem a aceita como suficiente. Os pares
de independência do prompt §4 continuam vinculantes nos portões de
verificação (G1, G6, G8), conforme `decision-rights.md` §3.

### 5.3 O que este apêndice não faz

- Não substitui a necessidade de titulares permanentes com credencial
  verificada e linha de reporte organizacional — os gatilhos de revisão
  registrados na tabela acima permanecem em aberto.
- Não altera o §4 acima: este documento, como um todo, ainda não fecha o
  Gate G0 por si só (dois papéis têm resolução apenas parcial —
  `AUTH-CLINSAFETY`, `AUTH-INTENDED-USE` — e um não tem titular —
  `AUTH-PRIVACY-LEGAL`, reclassificado).
