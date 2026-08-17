---
doc_id: 10-ux-indice
title: 10 — UX e acessibilidade (índice dos artefatos §11)
status: PROPOSAL
label: PROPOSAL
owner: UNASSIGNED — VALIDATION REQUIRED
collector: especialista de UX e acessibilidade (ciclo 6, SPR-G4-3)
source: >
  INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §11, §16, Gates G1/G4; GDEC-0013..0017
  (MODO CONSTRUÇÃO; UX/UI de primeira classe — GDEC-0016/ADR-0021);
  docs/02-users-and-workflows/dossie-substituto-multi-fonte-g1.md v0.1.1
date_collected: 2026-08-16
last_updated: 2026-08-16
---

# 10 — UX e acessibilidade

Este diretório era um stub deliberadamente vazio enquanto a evidência do G1
não existia. **O que mudou (SOURCE):** por GDEC-0009, a evidência do G1 passou
a ser o dossiê substituto multi-fonte (v0.1.1, VIVE 4/4 no painel AGT-4); por
GDEC-0013..0017 (MODO CONSTRUÇÃO) e GDEC-0016 (UX/UI de primeira classe;
ADR-0021), os artefatos de UX do prompt §11 passam a ser construídos sobre
essa base — **evidence-based ou rotulados como hipótese**, jamais como
observação. Nenhum usuário da V2 foi observado (RISK-0013, aceito pelo
titular); a validação com usuários é SPR-G4-5 e retroalimenta tudo aqui.

## Artefatos (SPR-G4-3)

| Artefato | Conteúdo |
|---|---|
| [`arquitetura-de-informacao.md`](./arquitetura-de-informacao.md) | Navegação direta grade-de-leitos/paciente/via, priorização em quatro níveis, agrupamento de alertas sem perda de fonte, navegação acessível, cache ciente de privacidade |
| [`modelo-de-estados-obrigatorios.md`](./modelo-de-estados-obrigatorios.md) | Modelo COMPLETO do §11 — por dado (9 estados de frescor), por avaliação (5 estados, ADR-0008), por alerta (8 estados, ADR-0009), por sessão/autorização, por componente e por conectividade; tabela estado × sinal não-só-cor × texto pt-BR × comportamento |
| [`service-blueprint.md`](./service-blueprint.md) | Fluxo clínico ATUAL (da evidência do dossiê, com dores documentadas) e DESEJADO (V2 como copiloto consultivo), frontstage/backstage/sistemas, pontos de falha e degradação |
| [`tabela-contrato-ui-backend.md`](./tabela-contrato-ui-backend.md) | Tabela de contrato UI↔backend por elemento da fatia SPR-G7-2 (fonte, estado, erro, authz, auditoria), alinhada a `packages/contratos/openapi.yaml`, com divergências observadas registradas |
| [`requisito-registro-limitado-instituicao.md`](./requisito-registro-limitado-instituicao.md) | HAZ-0046/ADR-0004 §6.2 decomposto em requisito de UI verificável (cláusulas RLI-* documento-locais) |

## Regras transversais do diretório

- **WCAG 2.2 AA é critério de projeto em todo artefato** (prompt §11;
  ADR-0021 F7). **Preferência estética não é critério de aceite** (encargo
  §4.4; nota da linha SPR-G4-3 do mapa).
- Identificadores de estado são do backend; o texto pt-BR é da camada de
  apresentação, auditável por identificador (ADR-0021 F1/F3); textos são
  provisórios até o processo ADR-0029 (C2 ABERTA).
- Estado factual preservado: 0 vias acionáveis; 47/47 inelegíveis; Observation
  da AMH não consumível; relação com a AMH = candidato a integração; safety
  case M0; nenhum dado real acessado — tudo aqui opera sobre dados sintéticos
  `SYNTH-`.
- Nada neste diretório fecha gate, bloqueador, risco ou hazard; nenhuma
  aprovação humana é presumida.

## Pendências conhecidas

- Validação com usuários (cenários simulados de tempo crítico + usuários de
  tecnologia assistiva) — SPR-G4-5; VAL-0027/0031/0033.
- Vocabulário pt-BR ratificado — processo ADR-0029 (ADR-0021 C2).
- Rótulo "registro limitado a esta instituição" ainda não implementado na
  fatia (OBSERVED) — ver RLI-6.
- Divergências contrato × fatia × ADRs registradas em
  `tabela-contrato-ui-backend.md` §5 (pendências de integração).
