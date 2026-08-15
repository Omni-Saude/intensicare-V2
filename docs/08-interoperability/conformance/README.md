---
doc_id: CONF-README
title: Camada anticorrupção e harness de conformidade — índice
status: PROPOSAL
owner: UNASSIGNED — VALIDATION REQUIRED
collector: engenheiro de camada anticorrupção e conformidade AMH (ciclo 1)
source: >
  INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §7.6 (lista de artefatos exigidos) e Gate G3;
  docs/08-interoperability/amh-data/contract-v1/ (minuta do contrato v1, base deste trabalho);
  docs/08-interoperability/amh-data/compatibility-finding.md (achado corrente)
date_collected: 2026-08-15
last_updated: 2026-08-15
---

# Conformidade e camada anticorrupção — índice

**Este diretório é desenho, não evidência.** Nada aqui altera o achado corrente:
**candidato a integração; compatibilidade não demonstrada para avaliação de UTI acionável**
(`../amh-data/compatibility-finding.md`). As camadas de evidência 2, 3 e 4 permanecem vazias;
nenhum cenário foi executado; nenhum contrato foi aceito; nenhum transporte foi escolhido.

## `contract-v1/` — conformidade contra a minuta do contrato AMH×IntensiCare v1

Os sete artefatos exigidos pelo §7.6, produzidos no ciclo 1:

| Artefato | Responde a |
|---|---|
| [`inventario-interfaces-e-matriz-compatibilidade.md`](./contract-v1/inventario-interfaces-e-matriz-compatibilidade.md) | Quais interfaces existem (6 eventos + `resolve` + o próprio pacote), e o que cada uma tem em cada camada de evidência |
| [`mapeamento-semantico.md`](./contract-v1/mapeamento-semantico.md) | Campo a campo do envelope de 11 campos e da resposta de `resolve`; contabilidade de perda; proveniência preservada |
| [`matriz-erro-retry-idempotencia-replay.md`](./contract-v1/matriz-erro-retry-idempotencia-replay.md) | Erros, retry seguro/inseguro, idempotência, dedup, ordem, replay, correção/supersessão/*tombstone* |
| [`mapeamento-seguranca-tenant.md`](./contract-v1/mapeamento-seguranca-tenant.md) | Como o contexto de tenant/entidade legal viaja e é verificado fail-closed; o que **nunca** é aceito do chamador |
| [`deteccao-mudanca-contrato.md`](./contract-v1/deteccao-mudanca-contrato.md) | Como a deriva é detectada e o que se faz — quarentena, alarme, jamais coerção silenciosa |
| [`cenarios-teste-consumidor.md`](./contract-v1/cenarios-teste-consumidor.md) | 22 cenários dado/quando/então, ligados a hazards e às fixtures existentes |
| [`mapa-duas-dimensoes-status.md`](./contract-v1/mapa-duas-dimensoes-status.md) | Qualidade de fonte AMH × status de avaliação V2, por cenário de ingestão, jamais colapsadas |

## Como ler estes documentos

1. **Nenhum código foi escrito.** O stack não tem ADR; o desenho está pronto para virar código
   quando houver decisão.
2. **Rótulos epistêmicos** conforme `../../00-governance/evidence-notation.md`. `DECIDIDO` refere-se
   exclusivamente às decisões de rodaquino-OMNI de 2026-08-15 (ata `IDN-ADJ-2026-08-15`); todo o
   resto é `SOURCE`, `OBSERVADO`, `INFERENCE`, `PROPOSAL` ou `VALIDATION REQUIRED`.
3. **Questões abertas** usam IDs locais `CONF-Q-nn` (CONF-Q-01 a CONF-Q-26). **Não são entradas de
   registro** — convertê-las em entradas de `../../00-governance/registers/` é ato de outro papel.
4. **Nenhum arquivo de `../amh-data/contract-v1/` foi alterado** por este trabalho, incluindo as
   fixtures. Fixtures ausentes estão listadas em `cenarios-teste-consumidor.md` §5 como insumo,
   não como pedido atendido.

## O que este diretório deliberadamente **não** faz

Não escolhe transporte, protocolo ou stack; não aceita contrato; não declara compatibilidade nem
aproxima o Gate G3; não nomeia donos; não cunha vocabulário de razões; não cria decisões.
