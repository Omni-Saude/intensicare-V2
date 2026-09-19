---
doc_id: UX-FRESCOR-SELO-GRADE
title: >
  Dossiê-ponteiro — ausência de selo de frescor em todo cartão da grade,
  aceitável ou não (§6.2 de docs/10)
status: PROPOSAL
label: PROPOSAL
owner: UNASSIGNED — VALIDATION REQUIRED
statement: >
  Nenhum cartão da grade exibe selo de frescor hoje: a projeção publica
  `contribuicoes: []` para todo leito e afirmar frescor a partir de nada
  deixou de ser permitido. Não afirmar é correto — honesto —, mas falta
  decidir se a AUSÊNCIA é aceitável numa tela clínica de UTI ou se a
  projeção da grade deve publicar frescor por leito (mudança de contrato).
  Este documento não duplica a análise do doc pai — registra o ponteiro
  rastreável e o que fecharia o item.
provenance:
  source_repo: intensicare-V2
  path_or_url: docs/05-clinical-safety/dossie-selo-frescor-grade.md
  commit_sha_or_version: d7a49dddc3fc0473ba35860ef3ddecf31d0741ae
  section_or_lines: docs/10-ux-and-accessibility/analise-de-lacunas-frontend.md §6.2 (linhas 953-982); referência cruzada na linha 749 (ACH-O3-12)
  date_collected: 2026-09-19
  collector: varredura de verdade documental ORQ-7
  transformation: ponteiro — o conteúdo autoritativo permanece no doc pai; nada duplicado
  confidence: high
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  requirements: [QAS-0017]
  hazards: []
  adrs: [ADR-0011]
  tests: []
  pr: null
supersedes: null
superseded_by: null
---

# Dossiê-ponteiro — selo de frescor na grade (§6.2 de docs/10)

## O item pendente

`docs/10-ux-and-accessibility/analise-de-lacunas-frontend.md` §6.2 (linhas
953-982), "Ausência de selo de frescor em TODO cartão da grade — aceitável
ou não?": como a projeção da grade publica `contribuicoes: []` e afirmar
frescor a partir de nada deixou de ser permitido, **nenhum cartão da grade
exibe selo de frescor hoje** — "Não afirmar é correto … Mas 'correto' aqui
significa 'honesto', não 'suficiente'" (linhas 955-964). O doc pai registra
as DUAS saídas possíveis (linhas 968-971): (A) a ausência é aceitável na
grade; o frescor por insumo vive só no detalhe — ratificação do estado
atual, decisão da autoridade clínica/UX; (B) a grade deve exibir frescor —
a PROJEÇÃO passa a publicar frescor por leito, mudança de CONTRATO
(`packages/contratos`, projeção da grade), decisão do dono de ADR-0011 mais
a autoridade clínica. O doc pai marca `owner: UNASSIGNED — VALIDATION
REQUIRED` (linha 982) e nota que registrar a escolha como aberta é
deliberado (linhas 973-975). Referência cruzada: ACH-O3-12, linha 749
("ADR-0011 P7; QAS-0017").

## Por que este ponteiro existe

O bloco inline do doc pai não tinha ID estável nem entrada em registro —
verificado em 2026-09-19: nenhuma entrada em
docs/00-governance/registers/ para selo de frescor na grade; os IDs `LAC-*`
do doc pai são documento-locais, pendentes de ratificação (docs/10, linhas
48-51). O gate de convenções de documento (`pnpm check:docs`) valida
front-matter por ARQUIVO e não sinaliza blocos inline — a insuficiência é
contra a convenção de rastreabilidade (evidence-notation.md §6;
traceability-policy.md), não contra o gate. Este dossiê acrescenta SOMENTE
o ID e o ponteiro; a análise autoritativa permanece no doc pai e não é
duplicada.

## O que fecharia

Autoridade clínica/UX escolhe (A) ou (B); se (B), o dono de ADR-0011 abre a
mudança de contrato. A escolha migra para o registro de decisões com o ID
de registro correspondente. Enquanto isso o item segue VALIDATION REQUIRED;
nenhum gate é bloqueado por ele hoje (§6.2, linha 981: "Efeito bloqueante
hoje: nenhum gate; é lacuna de informação na tela primária").
