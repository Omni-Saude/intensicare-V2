---
doc_id: UX-FRESCOR-ORDEM-SEVERIDADE
title: >
  Dossiê-ponteiro — ordem de severidade de frescor exibida ao clínico,
  não ratificada (§6.1 de docs/10)
status: PROPOSAL
label: PROPOSAL
owner: UNASSIGNED — VALIDATION REQUIRED
statement: >
  A ordem relativa entre os nove estados de frescor exibidos na tela
  (atual < corrigido < substituido < conflitante < envelhecendo <
  desatualizado < expirado < ausente < invalido) é PROVISÓRIA: é juízo
  clínico sobre o que mais compromete uma decisão à beira do leito, e
  ninguém a ratificou. Este documento não duplica a análise do doc pai —
  registra o ponteiro rastreável e o que fecharia o item.
provenance:
  source_repo: intensicare-V2
  path_or_url: docs/05-clinical-safety/dossie-ordem-severidade-frescor.md
  commit_sha_or_version: d7a49dddc3fc0473ba35860ef3ddecf31d0741ae
  section_or_lines: docs/10-ux-and-accessibility/analise-de-lacunas-frontend.md §6.1 (linhas 922-951)
  date_collected: 2026-09-19
  collector: varredura de verdade documental ORQ-7
  transformation: ponteiro — o conteúdo autoritativo permanece no doc pai; nada duplicado
  confidence: high
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  requirements: []
  hazards: []
  adrs: [ADR-0029]
  tests: []
  pr: null
supersedes: null
superseded_by: null
---

# Dossiê-ponteiro — ordem de severidade de frescor (§6.1 de docs/10)

## O item pendente

`docs/10-ux-and-accessibility/analise-de-lacunas-frontend.md` §6.1 (linhas
922-951), "Ordem de severidade de frescor exibida ao clínico — PROVISÓRIA":
a DIREÇÃO fail-closed da ordenação é engenharia feita; a ORDEM RELATIVA
entre os nove estados é afirmação sobre o que compromete mais uma decisão à
beira do leito — "juízo clínico, não de engenharia" (linhas 937-942;
Contrato de Agentes §3 põe a taxonomia de razões de status fora da
autoridade de qualquer agente). O doc pai marca o item com
`owner: UNASSIGNED — VALIDATION REQUIRED` (linha 951) e nomeia quem decide:
a autoridade clínica que ratifica a taxonomia de frescor — matéria de
ADR-0029 (vocabulário pt-BR) e do §11 do prompt. O HANDOFF registra o mesmo
ato humano (seção `ondas_3_e_4_2026_08_18`, chave
`atos_humanos_novos_criados_por_este_trabalho`: "Ordem de severidade de
frescor EXIBIDA. So a direcao fail-closed foi engenharia; a ordem relativa
nao.").

## Por que este ponteiro existe

O bloco inline do doc pai não tinha ID estável nem entrada em registro —
verificado em 2026-09-19: nenhuma entrada em
docs/00-governance/registers/ para ordem de severidade de frescor; os IDs
`LAC-*` do doc pai são documento-locais, pendentes de ratificação
(docs/10, linhas 48-51). Pela convenção de rastreabilidade
(docs/00-governance/evidence-notation.md §6; traceability-policy.md), item
pendente trackável precisa de ID estável e caminho de validação. O gate de
convenções de documento (`pnpm check:docs`) valida front-matter por ARQUIVO
e não sinaliza blocos inline — a insuficiência aqui é contra a convenção de
rastreabilidade, não contra o gate. Este dossiê acrescenta SOMENTE o ID e o
ponteiro; a análise autoritativa permanece no doc pai e não é duplicada.

## O que fecharia

Autoridade clínica nomeada ratifica (ou corrige) a ordem relativa; a
ratificação migra o item para o registro de decisões com o ID de registro
correspondente. Enquanto isso, o item segue VALIDATION REQUIRED; nenhum gate
é bloqueado por ele hoje (§6.1, linha 944: "Efeito bloqueante hoje: nenhum
gate").
