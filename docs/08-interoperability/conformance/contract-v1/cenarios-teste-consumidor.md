---
doc_id: CONF-V1-CENARIOS-TESTE-CONSUMIDOR
title: Cenários de teste dirigidos pelo consumidor contra o contrato v1 — especificação executável (dado/quando/então)
status: PROPOSAL
owner: UNASSIGNED — VALIDATION REQUIRED
collector: engenheiro de camada anticorrupção e conformidade AMH (ciclo 1)
source: >
  INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §7.6 (consumer-driven contract tests against a pinned AMH
  sandbox or faithful emulator; duplicate, delay, out-of-order, correction, merge/unmerge,
  downtime, backfill scenarios) e Gate G3;
  docs/08-interoperability/amh-data/contract-v1/eventos-ciclo-de-vida-identidade.md §2-§4;
  docs/08-interoperability/amh-data/contract-v1/fixtures/README.md e as 10 fixtures sintéticas;
  docs/05-clinical-safety/hazard-log.md (HAZ-0001, HAZ-0002, HAZ-0003, HAZ-0005, HAZ-0008,
  HAZ-0009, HAZ-0010, HAZ-0011, HAZ-0012, HAZ-0013, HAZ-0021, HAZ-0025, HAZ-0026, HAZ-0027,
  HAZ-0039, HAZ-0040, HAZ-0043 — todos verificados no log antes da citação);
  docs/06-architecture/adrs/ADR-0008-*.md §4.2 N3/N6/N9 (accepted GDEC-0007, lido em estado de
  working tree não commitado); docs/03-domain/invariants/DOM-invariants.md
date_collected: 2026-08-15
last_updated: 2026-08-15
---

# Cenários de teste dirigidos pelo consumidor — contrato v1

> **Status: PROPOSAL.** Especificação executável **em texto**, não em código. **Nenhum cenário foi
> executado.** Nenhum é evidência de compatibilidade.

## 1. A restrição epistêmica que precede todos os cenários

**SOURCE (§7.6):** o exigido são *"consumer-driven contract tests against a pinned AMH sandbox or
faithful emulator"*.

**OBSERVADO:** não existe *sandbox* AMH pinado (camada 2 sem evidência) e não existe emulador.

**INFERENCE — a armadilha que este documento recusa.** Um emulador escrito pela própria V2, a
partir da minuta escrita pela própria V2, executaria **V2 contra V2**. Todos os cenários
passariam, e o resultado provaria apenas que a V2 é internamente consistente. **Fidelidade de
emulador só é demonstrável contra a interface real.** Portanto:

| O que um cenário pode provar hoje | O que **não** pode provar |
|---|---|
| Que a camada anticorrupção da V2 **recusa** o que deve recusar e **preserva** o que deve preservar | Que a AMH **emite** o que o contrato descreve |
| Que a lógica de dedup, ordem, replay e fail-closed é interna e determinística | Que a AMH **impede** o que o contrato proíbe |
| Que as fixtures inválidas são rejeitadas pela razão certa | Qualquer latência, completude, disponibilidade ou ordenação real |

**Estado de execução de todo cenário abaixo: `NÃO EXECUTADO`.** A coluna "camada que produz"
indica o máximo que cada cenário pode gerar **quando** houver contra o que executá-lo.

## 2. Convenções

- **Fixtures.** Referenciadas por nome de arquivo existente em
  `docs/08-interoperability/amh-data/contract-v1/fixtures/`. Nenhuma fixture nova foi criada por
  este documento (a pasta de fixtures está fora do escopo de escrita deste papel); cenários que
  exigiriam fixture inexistente estão marcados **[FIXTURE AUSENTE]** e listados no §5.
- **Refs.** Todos os PSRs citados são sintéticos, com marcador `SYNTH`, exatamente como nas
  fixtures. Nenhum identificador real aparece.
- **Razões.** Tokens de razão citados vêm do vocabulário enumerado de **ADR-0008 N3**; onde não
  há token adequado, o cenário usa o *fallback* total `unspecified_condition` (**N9**) e registra
  a lacuna — **nenhum token novo é cunhado como se existisse**.
- **Rótulo de resultado.** *Então* descreve comportamento **exigido**, não observado.

---

## 3. Cenários

### CTS-01 — Linha de base: evento válido é aplicado com proveniência completa

| | |
|---|---|
| **Interface** | IF-01 |
| **Fixture** | `alias.valid.json` |
| **Camada que produz** | 1 (conformidade estrutural) — nunca 2/3/4 |

- **Dado** um consumidor com o contrato pinado e a malha de refs vazia;
- **Quando** chega `alias.valid.json`;
- **Então** o envelope é **persistido imutável antes de qualquer reconhecimento**; a transição é
  aplicada com `occurred_at` como tempo do fato; a proveniência registra `event_id`,
  `idempotency_key`, versão de contrato, versão de mapeamento e **`quality: unknown` explícito**
  (perda **L-02**); e **nenhum** fato clínico passado é re-chaveado.
- **Controle/hazard:** HAZ-0012 (reconhecimento antes da persistência durável); DOM-0002.

### CTS-02 — Duplicata: redelivery exata não altera o estado

| | |
|---|---|
| **Interface** | IF-01..IF-06 |
| **Fixture** | `alias.valid.json`, entregue **duas vezes** |
| **Camada que produz** | 1 |

- **Dado** que a entrega é **at-least-once** e o mesmo fato pode ser reentregue;
- **Quando** o mesmo envelope chega uma segunda vez, com a mesma `idempotency_key`;
- **Então** a segunda entrega é **deduplicada**; o estado da malha é **idêntico** ao de CTS-01; a
  duplicata é **contada como operação normal**, não como incidente; e a aplicação repetida da
  mesma transição (caso a detecção falhasse) produziria o mesmo estado — **idempotência de efeito**
  como segunda defesa.
- **Controle/hazard:** **HAZ-0009** (duplicata sem chave canônica de idempotência; precedente
  legado de chave derivada do paciente). Verificação adicional: a chave usada é a **do contrato**,
  jamais derivada de dado do paciente.

### CTS-03 — `idempotency_key` igual em tenant distinto **não** é duplicata

| | |
|---|---|
| **Interface** | IF-01..IF-06 |
| **Fixture** | `alias.valid.json` + variante com `amh_tenant` distinto **[FIXTURE AUSENTE]** |
| **Camada que produz** | 1 |

- **Dado** dois escopos `{amh_tenant, legal_entity}` distintos e autorizados;
- **Quando** chegam dois eventos com a **mesma** `idempotency_key`, um em cada escopo;
- **Então** **ambos** são aplicados; deduplicar entre escopos seria **descarte de fato legítimo** e
  violação de isolamento.
- **Controle/hazard:** HAZ-0013 (escopo), HAZ-0012 (perda silenciosa).

### CTS-04 — Atraso: chegada tardia é degradação **visível**, não silêncio

| | |
|---|---|
| **Interface** | IF-01..IF-06 |
| **Fixture** | `merge.valid.json` com entrega retardada |
| **Camada que produz** | 1 (comportamento); **4 exigiria medição real** |

- **Dado** uma lane com atraso material entre `emitted_at` e o recebimento;
- **Quando** o evento chega muito depois do fato;
- **Então** ele é aplicado **na sua posição por `occurred_at`** (nunca "agora"); a idade e o atraso
  da lane são **expostos como sinal operacional**; e a saúde da lane **não** é reportada como
  normal enquanto o atraso persistir.
- **Controle/hazard:** **HAZ-0010** (atraso além da utilidade clínica), **HAZ-0017**, **HAZ-0025**
  (readiness verde com lane degradada); DOM-0007.

### CTS-05 — Fora de ordem: evento antigo após evento novo não regride estado

| | |
|---|---|
| **Interface** | IF-01..IF-06 |
| **Fixture** | `alias.valid.json` e `merge.valid.json` entregues em ordem invertida de `occurred_at` |
| **Camada que produz** | 1 |

- **Dado** dois eventos do mesmo sujeito com `occurred_at` t1 < t2;
- **Quando** o de t2 chega primeiro e o de t1 depois;
- **Então** a projeção é **reconstruída** incluindo t1 na sua posição; o estado final é idêntico ao
  da ordem cronológica; **nenhum valor mais novo é sobrescrito por um mais velho**; e o resultado é
  idêntico ao de um replay completo.
- **Controle/hazard:** **HAZ-0011** (ordem invertida inverte a direção de viagem do paciente);
  DOM-0006.

### CTS-06 — Empate total de tempos: fail-closed em vez de escolha arbitrária

| | |
|---|---|
| **Interface** | IF-01..IF-06 |
| **Fixture** | dois eventos do mesmo sujeito com `occurred_at` **e** `emitted_at` idênticos **[FIXTURE AUSENTE]** |
| **Camada que produz** | 1 |

- **Dado** que o contrato desempata por *"ordem de emissão declarada pelo produtor"* e o envelope
  só carrega `emitted_at`;
- **Quando** dois eventos do mesmo sujeito empatam em ambos os tempos;
- **Então** o par é **quarentenado com alarme**; **nenhuma** ordem é escolhida arbitrariamente; e a
  lacuna de contrato é registrada (**CONF-Q-12**).
- **Controle/hazard:** HAZ-0011; DOM-0004 (nada indefinido vira normalidade).

### CTS-07 — Evento inválido: sem chave de idempotência

| | |
|---|---|
| **Interface** | IF-01 |
| **Fixture** | **`alias.missing-idempotency-key.invalid.json`** |
| **Camada que produz** | 1 |

- **Dado** o envelope mínimo com `idempotency_key` 1..1;
- **Quando** chega a fixture sem a chave;
- **Então** a mensagem é **quarentenada** com a razão correta (invariante 2), **não** é aplicada,
  **não** é descartada, e o envelope íntegro é retido; a contagem de quarentena sobe e é visível.
- **Controle/hazard:** HAZ-0009; DOM-0004.

### CTS-08 — Evento inválido: `merge` com ref nova igual à antiga

| | |
|---|---|
| **Interface** | IF-02 |
| **Fixture** | **`merge.ref-nova-igual-antiga.invalid.json`** |
| **Camada que produz** | 1 |

- **Dado** a invariante 3 do envelope;
- **Quando** chega um `merge` cujas refs coincidem;
- **Então** a mensagem é **quarentenada** (evento sem efeito é **defeito do produtor**, jamais
  *no-op* silenciosamente absorvido) e alarmada.
- **Controle/hazard:** HAZ-0027 (histórico erroneamente unido/dividido).

### CTS-09 — Evento inválido: emissão anterior ao fato

| | |
|---|---|
| **Interface** | IF-03 |
| **Fixture** | **`unmerge.emissao-antes-do-fato.invalid.json`** |
| **Camada que produz** | 1 |

- **Dado** a invariante 4 (`emitted_at >= occurred_at`);
- **Quando** chega a fixture com emissão anterior ao fato;
- **Então** a mensagem é **quarentenada**; **jamais** se "corrige" invertendo campos nem se
  substitui tempo algum; a razão registrada distingue **tempo implausível** de **campo ausente**.
- **Controle/hazard:** **HAZ-0026** (relógio enviesado / fuso ambíguo, incl. horário de verão em
  `America/Sao_Paulo`); regra §3-8; ADR-0008 N5 (tempo implausível ⇒ quarentena).

### CTS-10 — Correção e supersessão, incluindo referência pendente

| | |
|---|---|
| **Interface** | IF-04 (e qualquer tipo com `correction_of`) |
| **Fixture** | `restore.valid.json`; caso pendente **[FIXTURE AUSENTE]** |
| **Camada que produz** | 1 |

- **Dado** um evento anterior aplicado e um `restore` que o corrige via `correction_of`;
- **Quando** o `restore` chega;
- **Então** o evento corrigido **permanece recuperável** (nada é sobrescrito nem apagado); a
  relação de correção é explícita e datada; nenhuma avaliação passada é reescrita — se houver
  consequência, dispara **nova avaliação** e a anterior é marcada como superada, com alertas
  reconciliados, **jamais silenciosamente retirados**.
- **E dado** um `correction_of` apontando `event_id` **nunca visto**;
- **Então** o evento fica em **retenção pendente** com alarme; **não** é aplicado por suposição;
  e, se não resolver, o sujeito é marcado como **identidade em revisão**.
- **Controle/hazard:** **HAZ-0008** (correção sobrescreve ou é ignorada), HAZ-0022; ADR-0008 **N6**;
  ADR-0005 M8.

### CTS-11 — Merge/unmerge com replay: equivalência malha ⇔ `resolve`

| | |
|---|---|
| **Interface** | IF-02, IF-03 + IF-07 |
| **Fixture** | `merge.valid.json`, `unmerge.valid.json`, `restore.valid.json` |
| **Camada que produz** | 1 estruturalmente; **a equivalência real exige camadas 2-4** |

- **Dado** uma sequência de eventos de identidade sobre o mesmo sujeito (alias → merge → unmerge →
  restore), com `occurred_at` t1 < t2 < t3 < t4;
- **Quando** o consumidor reprocessa o fluxo **desde o início** e, para cada instante
  `t ∈ {t1..t4, e pontos intermediários}`, consulta `resolve(ref, as_of=t)`;
- **Então** para **todo** `t`, o estado derivado dos eventos com `occurred_at <= t` **coincide**
  com a resposta de `resolve`; a **cadeia de alias** retornada cruza, por `event_id`, exatamente
  com os eventos recebidos; o *split* **não reescreve** histórico; o `restore` aparece como
  **carimbo** e o replay anterior ao carimbo ainda enxerga a aresta como vigente; e **nenhuma
  avaliação histórica é re-chaveada**.
- **Controle/hazard:** **HAZ-0027**; DOM-0002, **DOM-0003**; critério de aceitação do §3 do
  contrato. **Divergência em qualquer `t` reprova o cenário e é sinal de deriva semântica (D9).**

### CTS-12 — *Backfill* de eventos de identidade

| | |
|---|---|
| **Interface** | IF-01..IF-06 |
| **Fixture** | as seis fixtures válidas, entregues em lote histórico |
| **Camada que produz** | 1; **2/4 exigem produtor real** |

- **Dado** um consumidor novo (ou uma lacuna a preencher) e um lote histórico de eventos;
- **Quando** o lote é processado;
- **Então** o resultado é **idêntico** ao do processamento incremental (CTS-11); duplicatas do
  lote são deduplicadas; e o *backfill* **não** produz alertas retroativos como se os fatos fossem
  novos.
- **Nota de escopo obrigatória:** este cenário cobre **apenas** o *backfill* de **eventos de
  identidade**. *Backfill*, replay e correção de **dados clínicos** estão **explicitamente
  excluídos do contrato v1** — nenhuma garantia existe e nenhuma é presumida aqui.

### CTS-13 — `erasure` / *tombstone*: aposentadoria **não é** deleção

| | |
|---|---|
| **Interface** | IF-06 (+ IF-07) |
| **Fixture** | `erasure.valid.json` |
| **Camada que produz** | 1 |

- **Dado** uma ref com histórico aplicado;
- **Quando** chega `erasure.valid.json` (com `subject_ref_nova: null`, válido **somente** neste
  tipo);
- **Então** a ref é marcada `retired`; **não é deletada nem reutilizada**; `resolve` **continua
  respondendo** para ela; o `null` é interpretado como **"não há sucessor"** e **nunca** confundido
  com campo ausente; e a V2 **não** implementa deleção local por conta própria.
- **Limite explícito:** o que a V2 faz com **seus próprios** envelopes e fatos retidos após um
  `erasure` **não é decidido por este contrato nem por este documento** (política de retenção:
  ADR-0018 + determinação legal pendente).
- **Controle/hazard:** DOM-0002 (proveniência imutável); ADR-0004 §5.2.

### CTS-14 — `resolve` com `as_of` **anterior ao minting** da ref

| | |
|---|---|
| **Interface** | IF-07 |
| **Fixture** | ref de `alias.valid.json`, com `as_of` anterior a `occurred_at` **[FIXTURE AUSENTE]** |
| **Camada que produz** | 1 |

- **Dado** uma ref mintada em `t0`;
- **Quando** a V2 consulta `resolve(ref, as_of=t)` com `t < t0`;
- **Então** a resposta carrega a condição explícita **`nao-mintada-em-as_of`**; a V2 a trata como
  **"sujeito inexistente naquele instante"** — estado explícito, **jamais** "sem dados, logo
  normal"; e **nenhuma** avaliação clínica é produzida como se o sujeito existisse.
- **Controle/hazard:** **HAZ-0005** (ausência de insumo virando resultado "normal" — a falha
  **ocorrida** no legado), **HAZ-0039** (ausência lida como ausência de anormalidade); DOM-0004.

### CTS-15 — `resolve` sobre ref `retired`

| | |
|---|---|
| **Interface** | IF-07 |
| **Fixture** | ref de `erasure.valid.json` **[FIXTURE AUSENTE para a resposta]** |
| **Camada que produz** | 1 |

- **Dado** uma ref aposentada por `erasure`;
- **Quando** a V2 consulta `resolve(ref, as_of)` para instante posterior ao fato;
- **Então** a resposta carrega **`status: retired`** e a data do fato; a V2 **distingue** "sujeito
  eliminado" de "ref desconhecida"; e **nenhuma** das duas condições é apresentada como "paciente
  sem achados".
- **E quando** o `as_of` é **anterior** à aposentadoria, **então** a resolução vigente naquele
  instante é devolvida — o passado **não** é reescrito pela aposentadoria.
- **Controle/hazard:** HAZ-0005, HAZ-0039, HAZ-0021 (impossível distinguir "avaliado e bem" de
  "nunca avaliado").

### CTS-16 — *Downtime* do consumidor, recuperação e detecção de lacuna

| | |
|---|---|
| **Interface** | IF-01..IF-07 |
| **Fixture** | sequência das seis válidas, com interrupção no meio **[FIXTURE AUSENTE para a lacuna]** |
| **Camada que produz** | 1 (comportamento); **2/4 exigem ambiente** |

- **Dado** um consumidor que fica indisponível durante parte do fluxo;
- **Quando** ele retorna;
- **Então** nenhuma mensagem foi reconhecida sem persistência durável; a recuperação **não assume**
  ter recebido tudo; a **conferência de integridade** malha × `resolve(ref, as_of)` é executada
  para os sujeitos afetados; e enquanto a conferência não confirmar, esses sujeitos ficam marcados
  como **identidade em revisão**, **visíveis**, com a lane reportando estado degradado.
- **E quando** um evento foi definitivamente perdido, **então** a divergência com `resolve`
  **detecta** a lacuna — porque o envelope **não** carrega número de sequência nem marca d'água
  (§7.3 da matriz de erro).
- **Controle/hazard:** **HAZ-0012** (perda silenciosa), **HAZ-0025** (readiness falsamente
  positivo), **HAZ-0043** (quietude permanente lida como tranquilidade).

### CTS-17 — Deriva: versão desconhecida, campo obrigatório removido, campo novo

| | |
|---|---|
| **Interface** | IF-00, IF-01..IF-06 |
| **Fixture** | variantes de `alias.valid.json` **[FIXTURES AUSENTES]** |
| **Camada que produz** | 1 |

- **Dado** um contrato pinado;
- **Quando** chega evento com `event_type_version` desconhecida (**D2**), **então** a mensagem é
  quarentenada e alarmada — nunca interpretada "por parecer com a v1";
- **Quando** chega evento **sem** um campo obrigatório do envelope mínimo, em lane antes válida
  (**D4**), **então** quarentena + alarme alto (mudança incompatível sem major nem janela);
- **Quando** chega evento com **campo adicional desconhecido** (**D3**), **então** a mensagem é
  **aceita** (invariante 6, *tolerant reader*), o campo é **retido e contado**, e um alarme
  informativo é emitido — *tolerant reader* significa **não falhar**, não **não notar**;
- **Quando** o sufixo de `event_type` e `event_type_version` **discordam** (**L-09**), **então**
  quarentena — jamais escolha entre os dois.
- **Controle/hazard:** HAZ-0032 (coerção de código/unidade é o mesmo modo de falha aplicado a
  vocabulário); QAS-0013.

### CTS-18 — Transição cruzando `{amh_tenant, legal_entity}` é **rejeitada**

| | |
|---|---|
| **Interface** | IF-01..IF-06 |
| **Fixture** | `merge.valid.json` com refs de escopos distintos **[FIXTURE AUSENTE]** |
| **Camada que produz** | 1 do lado consumidor; **a afirmação de impossibilidade exige camada 2** |

- **Dado** que o PSR é estável **dentro** de `{amh_tenant, legal_entity}`;
- **Quando** chega uma transição cujas refs pertencem a escopos distintos;
- **Então** ela é **rejeitada fail-closed** com alarme de segurança **e** de segurança clínica;
  **jamais** é tratada como caso de negócio a acomodar; e **nenhum** histórico clínico é unido
  entre entidades legais.
- **Controle/hazard:** **HAZ-0003**, **HAZ-0013** (divulgação entre entidades legais),
  **HAZ-0027** (histórico erroneamente unido); AQ-6 (DECIDIDO).

### CTS-19 — `resolve` fora do escopo autorizado: negativa e impossibilidade de *bypass*

| | |
|---|---|
| **Interface** | IF-07 |
| **Fixture** | — (teste negativo de autorização) |
| **Camada que produz** | 1 do lado consumidor; **a impossibilidade só é evidenciável na camada 2** |

- **Dado** um escopo autorizado A;
- **Quando** se tenta resolver uma ref do escopo B — por parâmetro, cabeçalho, *claim* forjada ou
  qualquer sinalizador de *bypass*;
- **Então** a operação **nega** com condição explícita; a V2 **não** envia escopo derivado de valor
  controlado pelo chamador; e, se a resposta contiver **qualquer** ref fora do escopo autorizado,
  a resposta inteira é **descartada e alarmada** (defesa em profundidade — R-4).
- **Controle/hazard:** **HAZ-0013**, HAZ-0014 (identidade fail-open), regra §3.6; AQ-6 exige que a
  V2 mantenha teste negativo afirmando a **impossibilidade** do *bypass* — o que **só** é
  demonstrável contra a interface real.

### CTS-20 — Identificador de fonte cru no envelope é **rejeitado**

| | |
|---|---|
| **Interface** | IF-06 (fixture disponível), aplicável a todos |
| **Fixture** | **`erasure.identificador-de-fonte-cru.invalid.json`** |
| **Camada que produz** | 1 |

- **Dado** a invariante 1 (só refs opacas atravessam a fronteira);
- **Quando** chega a fixture com identificador de fonte cru;
- **Então** a mensagem é **rejeitada e alarmada** como violação de **contrato e de política de
  dados**; **nunca** é "aceita ignorando o campo extra" (o que a regra de *tolerant reader*
  poderia sugerir se aplicada sem esta exceção); o envelope é retido em **quarentena de acesso
  segregado**, por conter justamente o que não deveria ter atravessado.
- **Controle/hazard:** AQ-4/XRD-05; HAZ-0001 (identidade resolvida por identificador impróprio).

### CTS-21 — Propósito fora do vocabulário fechado é **rejeitado**

| | |
|---|---|
| **Interface** | transversal (IF-01..IF-07) |
| **Fixture** | — |
| **Camada que produz** | 1 |

- **Dado** o contrato mono-propósito (`tratamento`) e a ausência de gate de consentimento no loop
  clínico (**DECIDIDO AQ-3 = C**);
- **Quando** um consumo é tentado sob qualquer outro propósito;
- **Então** é **rejeitado fail-closed**;
- **E quando** algum caminho tentar derivar base legal de **permissão de contato**;
- **Então** o teste **falha** — a invariante *"jamais deriva de `ie_perm_sms_email` ou de qualquer
  permissão de contato"* é declarada pela ata como **verificável em teste**, e este é o teste.
- **Controle/hazard:** AQ-3; DEC-G0-03 (dados sintéticos até ratificação jurídica).

### CTS-22 — Pin do contrato: digest divergente reprova o pacote inteiro

| | |
|---|---|
| **Interface** | IF-00 |
| **Fixture** | — (requer manifesto publicado) |
| **Camada que produz** | 1 |

- **Dado** um manifesto publicado e pinado por digest;
- **Quando** o digest calculado diverge do pinado, **ou** o manifesto descreve o que o artefato não
  é (**D8**);
- **Então** o **pacote inteiro é rejeitado** — divergência é **defeito de publicação**, não
  situação a acomodar; a lane para **visivelmente**; e nenhuma mensagem é processada sob contrato
  não verificado.
- **Estado:** **não executável** — nenhum manifesto existe, `digest: null`, `pinned: false`.

---

## 4. Matriz de cobertura exigida pelo §7.6

| Exigência do §7.6 | Cenário |
|---|---|
| duplicate | CTS-02, CTS-03 |
| delay | CTS-04 |
| out-of-order | CTS-05, CTS-06 |
| correction | CTS-10 |
| merge/unmerge (com replay) | CTS-11 |
| downtime (e recuperação) | CTS-16 |
| backfill | CTS-12 |
| evento inválido | CTS-07, CTS-08, CTS-09, CTS-20 |
| erasure / *tombstone* | CTS-13 |
| `resolve` `as_of` pré-*minting* e ref *retired* | CTS-14, CTS-15 |
| tenant-isolation / negative-auth | CTS-18, CTS-19, CTS-21 |
| drift detection | CTS-17, CTS-22 |
| replay / reconciliação sem perda silenciosa | CTS-11, CTS-12, CTS-16 |

**Exigências do §7.6 ainda sem cenário possível:** *provider tests* (exigem o produtor), medição de
latência/completude (camada 4), e **relatórios de reconciliação** sobre dado real. Registradas como
ausentes em vez de simuladas.

## 5. Fixtures que faltariam

**Nenhuma foi criada por este documento** — a pasta `contract-v1/fixtures/` pertence ao pacote de
contrato e está fora do escopo de escrita deste papel. A lista abaixo é **insumo para quem tiver
essa autoridade**, não uma solicitação atendida.

| # | Fixture ausente | Cenário | Observação |
|---|---|---|---|
| F-1 | Mesma `idempotency_key` em tenant distinto | CTS-03 | Válida (dois eventos legítimos) |
| F-2 | Empate de `occurred_at` **e** `emitted_at` | CTS-06 | Expõe **CONF-Q-12** |
| F-3 | `correction_of` apontando evento inexistente | CTS-10 | Nem válida nem inválida por invariante — é **condição operacional** |
| F-4 | `subject_ref_nova: null` fora de `erasure` | invariante 5 | **A única invariante sem fixture** hoje |
| F-5 | `event_type_version` desconhecida; campo obrigatório removido; campo adicional desconhecido | CTS-17 | Três fixtures de deriva |
| F-6 | Transição cruzando `{amh_tenant, legal_entity}` | CTS-18 | Maior consequência de segurança |
| F-7 | Respostas de `resolve` (sucesso, `nao-mintada-em-as_of`, `retired`, negativa) | CTS-14, CTS-15, CTS-19 | **Não existe esquema de resposta** — fixture exigiria antes responder CONF-Q-10 |

## 6. O que a execução destes cenários **não** produzirá

1. Compatibilidade (Gate G3) — três de suas seis condições dependem de camadas 2-4.
2. Evidência de latência, completude, disponibilidade ou frescor.
3. Prova de que a AMH impede o que o contrato proíbe (CTS-18, CTS-19).
4. Ambiente similar a produção: **só `dev` está provisionado**, e o próprio manifesto registra que
   a condição do G3 *"NÃO pode ser satisfeita com dev apenas"*.

**O achado permanece: candidato a integração; compatibilidade não demonstrada para avaliação de
UTI acionável.**

---

*Redigido pelo engenheiro de camada anticorrupção e conformidade AMH (ciclo 1). Nenhum cenário
executado; nenhuma fixture criada ou alterada; nenhum ID de hazard inventado (todos verificados em
`hazard-log.md` antes da citação); nenhuma decisão registrada. Sem PHI, credenciais ou
identificadores reais — todas as refs citadas são sintéticas com marcador `SYNTH`.*
