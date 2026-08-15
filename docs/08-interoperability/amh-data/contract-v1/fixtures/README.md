---
doc_id: AMH-CONTRACT-V1-FIXTURES
title: Fixtures sintéticas da minuta do contrato AMH×IntensiCare v1
status: PROPOSAL
owner: UNASSIGNED — VALIDATION REQUIRED
collector: steward de publicação de contrato AMH×IntensiCare
source: >
  docs/08-interoperability/amh-data/contract-v1/eventos-ciclo-de-vida-identidade.md
  (envelope e invariantes); OS-17 critério 4 de ordens-de-servico-amh-2026-08-15.md;
  padrão de fixtures do manifesto Maezo (válidas E deliberadamente inválidas),
  OBSERVADO em Omni-Saude/amh-data-platform@0a07a6f1fab36fb2f5eeee0fcd8e945c95f67116
date_collected: 2026-08-15
last_updated: 2026-08-15
---

# Fixtures — 100% sintéticas (MINUTA)

Dez fixtures JSON para os **seis tipos de evento** da cláusula de ciclo de vida de
identidade: **1 válida por tipo (6)** e **4 deliberadamente inválidas**, seguindo o padrão
Maezo de acompanhar o contrato com casos válidos E inválidos.

## Garantias de sintetismo (zero PHI)

1. **Todo PSR carrega o marcador `SYNTH`** (`amh:psr:v1:SYNTH-...`) — forma deliberadamente
   distinta de uma ref real (`amh:psr:v1:<uuidv4>`), impossível de colidir com ref mintada.
2. **Tenant e entidade legal são sintéticos** (`SYNTH-TENANT-A`, `SYNTH-LE-00000001`) — a
   enumeração real dos 12 tenants é pinada da IG 1.1.0, nunca transcrita ou simulada aqui.
3. **O único identificador com forma de documento** aparece na fixture inválida
   `erasure.identificador-de-fonte-cru.invalid.json`, existe **para ser rejeitado** (viola
   AQ-4/XRD-05) e é `cpf:00000000000`: todos os dígitos iguais **reprovam no dígito
   verificador** de CPF — nenhum CPF real tem essa forma. Ele é mantido **sem formatação**
   (sem pontos/hífen) de propósito: o gate `scripts/check_forbidden_content.py` sinaliza
   qualquer padrão formatado `ddd.ddd.ddd-dd` para revisão humana, e esta fixture não deve
   disparar revisão por um valor que é, por construção, irrepresentável como CPF real.
4. UUIDs de evento são sequências fabricadas (`11111111-…`, `22222222-…`), não gerados de
   dado algum.

## Inventário

| Arquivo | Papel | O que exercita |
|---|---|---|
| `alias.valid.json` | válida | alias: ref antiga passa a resolver para a sobrevivente |
| `merge.valid.json` | válida | merge: absorção com refs distintas |
| `unmerge.valid.json` | válida | split como fato novo; `correction_of` aponta o merge desfeito |
| `restore.valid.json` | válida | reversão carimbada; `correction_of` obrigatório |
| `reassignment.valid.json` | válida | correção de associação sem unificação (tipo pendente de confirmação — ponto N-8) |
| `erasure.valid.json` | válida | `retired`; único caso de `subject_ref_nova: null` válido |
| `alias.missing-idempotency-key.invalid.json` | inválida | invariante 2 — sem chave de idempotência |
| `merge.ref-nova-igual-antiga.invalid.json` | inválida | invariante 3 — ref nova igual à antiga em merge |
| `unmerge.emissao-antes-do-fato.invalid.json` | inválida | invariante 4 — tempo de emissão anterior ao tempo do fato |
| `erasure.identificador-de-fonte-cru.invalid.json` | inválida | invariante 1 — identificador de fonte cru na fronteira |

Cada arquivo carrega um bloco `_fixture` autodescritivo (papel, motivo de invalidade quando
aplicável). O bloco é um campo ADICIONAL tolerado pela regra de tolerant reader (invariante 6)
e não faz parte do envelope.

*Sem PHI, credenciais ou identificadores reais. Nada aqui foi escrito no repositório AMH.*
