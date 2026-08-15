---
doc_id: AMH-CONTRACT-V1-IDENTITY-LIFECYCLE
title: Contrato AMH×IntensiCare v1 — cláusula de ciclo de vida de identidade e resolve(ref, as_of)
status: PROPOSAL
owner: UNASSIGNED — VALIDATION REQUIRED
collector: steward de publicação de contrato AMH×IntensiCare
source: >
  DECIDIDO — AQ-5 = A vinculante, rodaquino-OMNI, 2026-08-15 (ata
  docs/08-interoperability/amh-data/identity-adjudication/adjudicacao-decisoes-2026-08-15.md §2);
  derivação de engenharia: OS-17 e OS-18 de
  docs/08-interoperability/amh-data/ordens-de-servico-amh-2026-08-15.md §6;
  semântica interna FONTE (adjudicação): AMH-020b @
  Omni-Saude/amh-data-platform@0a07a6f1fab36fb2f5eeee0fcd8e945c95f67116
date_collected: 2026-08-15
last_updated: 2026-08-15
---

# Cláusula de ciclo de vida de identidade + `resolve(ref, as_of)` — especificação (MINUTA)

**Status: PROPOSAL — minuta negociável.** Esta é a especificação, do lado V2, da cláusula
que **AQ-5 = A (vinculante)** torna **obrigatória** no contrato v1: *"sem eventos de ciclo de
vida de identidade e `resolve(ref, as_of)`, o replay afetado por identidade NÃO é certificável
e o Gate G3 NÃO passa. Não se admite janela-teto como paliativo."* (DECIDIDO, rodaquino-OMNI,
2026-08-15, ata IDN-ADJ-2026-08-15 §2.)

A OS-17 registra que esta é uma ordem de **exposição, não de invenção**: a semântica interna
já está especificada no desenho AMH-020b (FONTE via adjudicação — a ref nunca morre e nunca é
re-mintada; *split* não reescreve histórico; *restore* carimba a revogação em vez de apagá-la;
*erasure* marca `status=retired` sem deletar nem reutilizar a ref). Esta minuta propõe o
**contrato de consumo** dessa semântica.

---

## 1. Os seis tipos de evento

| # | Tipo (`event_type`) | Fato que comunica | `subject_ref_antiga` | `subject_ref_nova` |
|---|---|---|---|---|
| 1 | `identity.alias.v1` | A ref antiga passa a ser **alias** da ref nova (sobrevivente); ambas continuam resolvendo | ref que vira alias | ref sobrevivente |
| 2 | `identity.merge.v1` | Duas identidades foram unificadas; a ref antiga é absorvida pela nova | ref absorvida | ref sobrevivente |
| 3 | `identity.unmerge.v1` | Um merge anterior foi desfeito (*split*); o histórico **não** é reescrito — o desfazimento é um fato novo | ref do agregado desfeito | ref reativada/destacada |
| 4 | `identity.restore.v1` | Um evento anterior (p.ex. erasure ou merge indevido) foi revertido; a reversão é carimbada, nunca apagada | ref no estado revertido | ref restaurada |
| 5 | `identity.reassignment.v1` | A associação da ref à identidade subjacente foi corrigida (fatos reatribuídos) | ref de origem da reatribuição | ref de destino |
| 6 | `identity.erasure.v1` | A ref foi marcada `retired` (p.ex. exercício de direito de eliminação); a ref **nunca** é deletada nem reutilizada | ref retirada | `null` |

> **OBSERVADO — divergência registrada (ponto em aberto N-8).** A ata IDN-ADJ-2026-08-15 §2
> (AQ-5) lista literalmente **cinco** tipos ("alias, merge, unmerge, restore, erasure"); a
> OS-17 (critério 1) e o bloco `decisions` do `contracts.lock.draft.yaml` listam **seis**,
> incluindo `reassignment`. Esta minuta segue os **seis da OS-17**, por ser a derivação de
> engenharia mais específica e por `reassignment` ser semanticamente distinto de `merge`
> (correção de associação sem unificação de identidades). A ata prevalece quanto ao teor das
> decisões: a confirmação do titular está registrada como ponto de negociação/pendência em
> `memoria-de-desenho.md` §8. Remover `reassignment`, se for o caso, é emenda simples e
> compatível.

## 2. Envelope mínimo por evento

**PROPOSAL** — campos conforme OS-17 critério 1. Deliberadamente **menor** que o envelope de
28 campos do Maezo (racional de minimização campo a campo em `memoria-de-desenho.md` §5).

| Campo | Tipo | Card. | Semântica |
|---|---|---|---|
| `event_id` | UUID | 1..1 | Identidade única do evento; nunca reutilizado |
| `event_type` | enum §1 | 1..1 | Um dos seis tipos, com versão no nome (`.v1`) |
| `event_type_version` | string | 1..1 | Versão do esquema do envelope (`"1"` no v1); mudanças seguem a política de compatibilidade do manifesto |
| `idempotency_key` | string | 1..1 | Chave de deduplicação do consumidor; estável entre redeliveries do mesmo fato |
| `amh_tenant` | string | 1..1 | Tenant (enumeração autoritativa pós-ADR-041, pinada da IG 1.1.0 — não transcrita aqui) |
| `legal_entity` | string | 1..1 | Entidade legal (raiz de CNPJ) do escopo do PSR `{amh_tenant, legal_entity}` |
| `subject_ref_antiga` | PSR opaco | 1..1 | Ref opaca ANTES do fato — formato `amh:psr:v1:<uuidv4>` |
| `subject_ref_nova` | PSR opaco | 0..1 | Ref opaca DEPOIS do fato; `null` apenas em `erasure` |
| `occurred_at` | timestamp UTC | 1..1 | **Tempo do fato** — quando a transição de identidade ocorreu na fonte |
| `emitted_at` | timestamp UTC | 1..1 | **Tempo de emissão** — quando o evento foi publicado; `emitted_at >= occurred_at` sempre |
| `correction_of` | UUID | 0..1 | Vínculo de correção/supersessão: `event_id` do evento que este corrige/reverte (obrigatório em `restore`; presente em correções) |

**Invariantes do envelope (todas verificáveis nas fixtures):**

1. Nenhum campo transporta identificador de fonte (mpi_id cru, CPF, prontuário) — só refs
   opacas atravessam a fronteira (AQ-4; XRD-05). Fixture inválida:
   `erasure.identificador-de-fonte-cru.invalid.json`.
2. `idempotency_key` é obrigatória. Fixture inválida: `alias.missing-idempotency-key.invalid.json`.
3. Em `merge`, `subject_ref_nova ≠ subject_ref_antiga`. Fixture inválida:
   `merge.ref-nova-igual-antiga.invalid.json`.
4. `emitted_at >= occurred_at`. Fixture inválida: `unmerge.emissao-antes-do-fato.invalid.json`.
5. `subject_ref_nova = null` é válido **somente** em `identity.erasure.v1`.
6. Campos desconhecidos ADICIONAIS não invalidam a mensagem (tolerant reader); campos do
   envelope mínimo ausentes invalidam.

## 3. Semântica de ordenação, entrega e replay

**DECIDIDO (ata AQ-5):** entrega **at-least-once**; **ordenação por sujeito**.

- **Ordenação.** Para uma mesma ref (e para o par antiga/nova de um mesmo fato), os eventos
  são entregues na ordem de `occurred_at`; entre sujeitos distintos nenhuma ordem global é
  prometida. Empate de `occurred_at` no mesmo sujeito é desfeito por ordem de emissão
  declarada pelo produtor.
- **Entrega.** At-least-once: o consumidor DEVE deduplicar por `idempotency_key`; redelivery
  não altera o estado reconstruído. Exactly-once não é exigido nem presumido.
- **Replay (requisito vinculante — OS-17 critério 5).** Um consumidor que processe o fluxo de
  eventos desde o início reconstrói a **visão histórica correta** da malha de refs: para
  qualquer instante `t`, o estado derivado dos eventos com `occurred_at <= t` coincide com a
  resposta de `resolve(ref, as_of=t)`. Esta equivalência é o critério de aceitação do teste
  de replay, e sustenta as invariantes V2 `DOM-0002` (proveniência imutável) e `DOM-0003`
  (avaliação determinística e replayável).
- **Latência.** Declarada **e medida** pela AMH (OS-17 critério 3) — `VALIDATION_REQUIRED`;
  nenhum número inventado nesta minuta.

## 4. `resolve(ref, as_of)` — resolução ponto-no-tempo (OS-18)

**DECIDIDO (AQ-5):** obrigatória. Eventos empurram; `resolve` puxa; **o G3 exige os dois**.

### 4.1 Contrato da operação

- **Entrada:** `ref` (PSR opaco) e `as_of` (timestamp UTC; se omitido, assume o instante da
  consulta — mas o consumidor V2 SEMPRE informa `as_of` explícito em replay).
- **Saída (sucesso):** a resolução **vigente naquele instante** — "a que esta ref se referia
  em `as_of`", nunca apenas "a que se refere agora" — mais a **cadeia de alias aplicável**
  (sequência ordenada de transições com `event_id` e `occurred_at` de cada uma), para que o
  consumidor saiba que houve transição e possa auditá-la.
- **`as_of` anterior ao minting da ref:** a operação responde com condição explícita
  `nao-mintada-em-as_of` — não é erro do chamador nem adivinhação; a V2 trata como
  "sujeito inexistente naquele instante".
- **Ref `retired` (pós-erasure):** a ref **continua resolvendo** (nunca morre — AMH-020b via
  ata); a resposta carrega `status: retired` e a data do fato, permitindo à V2 distinguir
  "sujeito eliminado" de "ref desconhecida".
- **Fail-closed:** ref desconhecida, malformada, fora do escopo `{amh_tenant, legal_entity}`
  autorizado, ou `as_of` fora da janela suportada ⇒ **NEGA** com condição explícita. A
  operação **nunca adivinha** e nunca degrada para resolução "atual".

### 4.2 Propriedades exigidas

| Propriedade | Exigência |
|---|---|
| Determinismo | Mesma `(ref, as_of)` ⇒ mesma resposta, sempre — inclusive após novos eventos (o passado não é reescrito) |
| Consistência com eventos | Equivalência do §3 (replay) — verificada por teste |
| Autorização | Mesmo modelo do contrato: propósito-de-uso `tratamento` + contexto profissional; sem bypass cross-tenant (AQ-6) |
| Auditoria | Toda chamada auditável (quem, quando, qual ref, qual `as_of`) — sem PHI no log |
| Latência e limites de uso | Declarados pela AMH — `VALIDATION_REQUIRED` (OS-18 critério 5) |

### 4.3 O que esta minuta NÃO fixa

- **Transporte/binding** da operação (REST síncrono, consulta sobre stream materializado,
  outro) — decisão do ADR de fronteira; a semântica acima é neutra quanto ao binding.
- **Janela de retenção de histórico** — a garantia FONTE é "toda ref já vista resolve para
  sempre"; o custo/forma de sustentá-la é da AMH e entra na negociação (SLOs).

## 5. Rastreabilidade

| Item desta especificação | Sustentado por |
|---|---|
| Obrigatoriedade da cláusula; sem ela G3 não passa | DECIDIDO AQ-5 (ata §2), 2026-08-15 |
| Seis tipos de evento e campos do envelope | OS-17 critério 1 (derivação PROPOSAL) |
| At-least-once + ordenação por sujeito | DECIDIDO — texto da ata AQ-5 |
| Ref nunca morre/nunca re-mintada; split não reescreve; restore carimba; erasure = retired | FONTE (adjudicação) — AMH-020b @0a07a6f1 |
| `resolve` com `as_of`, cadeia de alias, fail-closed | OS-18 critérios 1–4 |
| Latências e limites não inventados | OS-17 critério 3, OS-18 critério 5 — VALIDATION REQUIRED |
| Divergência 5×6 tipos | OBSERVADO nesta redação — ponto em aberto N-8 |

---

*Minuta redigida pelo steward de publicação de contrato AMH×IntensiCare. Nenhuma decisão nova
foi tomada; nada foi escrito no repositório AMH; sem PHI, credenciais ou identificadores
reais. Fixtures 100% sintéticas em `fixtures/`.*
