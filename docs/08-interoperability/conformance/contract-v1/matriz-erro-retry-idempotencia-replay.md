---
doc_id: CONF-V1-MATRIZ-ERRO-RETRY-IDEMPOTENCIA-REPLAY
title: Matriz de erro, retry, idempotência e replay por interface do contrato v1
status: PROPOSAL
owner: UNASSIGNED — VALIDATION REQUIRED
collector: engenheiro de camada anticorrupção e conformidade AMH (ciclo 1)
source: >
  docs/08-interoperability/amh-data/contract-v1/eventos-ciclo-de-vida-identidade.md §2 (invariantes),
  §3 (at-least-once, ordenação por sujeito, replay vinculante) e §4 (resolve, fail-closed);
  docs/08-interoperability/amh-data/contract-v1/contract-manifest.draft.yaml (identity_lifecycle,
  slos com valores null/VALIDATION_REQUIRED); docs/06-architecture/adrs/ADR-0005-modelo-canonico-*.md
  §5.2 M8/M9 (proposed); docs/06-architecture/adrs/ADR-0008-*.md §4.2 N6/N9 (accepted GDEC-0007,
  lido em estado de working tree não commitado); docs/05-clinical-safety/hazard-log.md
  (HAZ-0008, HAZ-0009, HAZ-0010, HAZ-0011, HAZ-0012, HAZ-0017, HAZ-0025, HAZ-0026, HAZ-0027);
  INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §3 regras 7-9, §7.6
date_collected: 2026-08-15
last_updated: 2026-08-15
---

# Matriz de erro, retry, idempotência e replay — contrato v1

> **Status: PROPOSAL.** Desenho de comportamento do consumidor. **Nenhum transporte é escolhido
> nem implícito** — as exigências abaixo são formuladas como **propriedades que o transporte
> escolhido terá de satisfazer**, e como **obrigações do consumidor** independentes dele. Nenhum
> número de latência, janela ou limite é inventado: os SLOs do manifesto são `null` /
> `VALIDATION_REQUIRED` por construção.

## 1. Premissas de entrega, declaradas pelo contrato

**SOURCE** (`eventos-ciclo-de-vida-identidade.md` §3; ata AQ-5):

- Entrega **at-least-once** — *"o consumidor DEVE deduplicar por `idempotency_key`; redelivery não
  altera o estado reconstruído. Exactly-once não é exigido nem presumido."*
- Ordenação **por sujeito** — para a mesma ref, e para o par antiga/nova de um mesmo fato, na
  ordem de `occurred_at`. **Entre sujeitos distintos, nenhuma ordem global é prometida.**
- **Replay vinculante** — processar o fluxo desde o início reconstrói a visão histórica correta;
  para qualquer instante `t`, o estado derivado dos eventos com `occurred_at <= t` **coincide com**
  `resolve(ref, as_of=t)`.
- Latência: **VALIDATION REQUIRED** (declarada **e medida** pela AMH — OS-17 critério 3).

**INFERENCE.** Três consequências estruturais decorrem daí, e governam tudo abaixo:

1. Como a entrega é ao-menos-uma-vez, **duplicata não é anomalia — é o caso normal**. Um
   consumidor que trate duplicata como erro alarmará sobre operação saudável e habituará a equipe
   a ignorar o alarme.
2. Como não há ordem global, **o estado corrente é uma projeção reconstruível pelos tempos do
   fato**, nunca um acumulador dependente da ordem de chegada (DOM-0006).
3. Como o envelope **não carrega número de sequência nem marca d'água por sujeito**, um consumidor
   **não consegue detectar, por inspeção da mensagem, que perdeu um evento**. A única detecção
   possível é o cruzamento com `resolve(ref, as_of)` — o que torna IF-07 mecanismo de **integridade**,
   não apenas de consulta. Ver §7.3 e **CONF-Q-02**.

## 2. Taxonomia de erros

| ID | Classe | Exemplos | Determinístico? | Destino |
|---|---|---|:--:|---|
| **EC-1** | **Envelope inválido** | Invariantes 1-5 violadas: identificador de fonte cru; sem `idempotency_key`; `merge` com refs iguais; `emitted_at < occurred_at`; `null` em `subject_ref_nova` fora de `erasure` | Sim | **Quarentena** + alarme. Jamais correção, jamais descarte |
| **EC-2** | **Deriva de contrato** | `event_type` fora do enum; `event_type_version` desconhecida; campo obrigatório do envelope mínimo ausente por mudança do produtor; discordância de versão (L-09) | Sim | **Quarentena** + alarme de deriva (`deteccao-mudanca-contrato.md`) |
| **EC-3** | **Violação de escopo/segurança** | `amh_tenant` fora da enumeração pinada ou fora do escopo autorizado; transição cruzando o par `{amh_tenant, legal_entity}`; identificador de fonte presente (também EC-1) | Sim | **Rejeição fail-closed** + alarme de segurança. Nunca reprocessar "para ver se passa" |
| **EC-4** | **Falha transitória do consumidor** | Camada de persistência indisponível; projeção em reconstrução | Não | **Não reconhecer** a mensagem antes da persistência durável; permitir redelivery |
| **EC-5** | **Falha transitória de entrega** | Redelivery, reconexão, reentrega em lote | Não | Caso normal: **deduplicar** e seguir |
| **EC-6** | **Negativa fail-closed de `resolve`** | Ref desconhecida; ref malformada; fora do escopo autorizado; `as_of` fora da janela suportada | Sim | Estado explícito com condição; **retry inútil**; jamais degradar para resolução "atual" |
| **EC-7** | **Indisponibilidade de `resolve`** | Timeout, canal indisponível | Não | Estado explícito de indisponibilidade; **retry seguro somente com `as_of` explícito** (§4) |
| **EC-8** | **Referência pendente** | `correction_of` apontando `event_id` ainda não visto (lacuna ou fora de ordem) | Não (pode resolver-se) | **Retenção pendente** com prazo; **jamais** aplicar assumindo que o evento referenciado era inócuo |
| **EC-9** | **Condição não coberta** | Qualquer combinação não prevista | — | **Fail-closed**: `not_evaluated` com razão `unspecified_condition` (ADR-0008 N9) + sinal operacional |

**Regra transversal.** Nenhuma classe acima pode resultar em **descarte silencioso** nem em
**valor coagido**. O contrato não tem estado "ignorado" (regra §3-7; DOM-0004).

## 3. Matriz por interface

| Interface | Erros esperados | Retry **seguro** | Retry **inseguro/inútil** | Chave de idempotência | Dedup | Fora de ordem | Replay |
|---|---|---|---|---|---|---|---|
| **IF-01** `alias` | EC-1, EC-2, EC-3, EC-4, EC-5 | EC-4, EC-5 (redelivery é o modo normal) | EC-1/EC-2/EC-3 — determinísticos: retentar só multiplica o alarme | `idempotency_key` (contrato) | Obrigatória, durável | Reordena por `occurred_at`; projeção reconstruída | Idempotente por construção: aplicar N vezes = aplicar 1 vez |
| **IF-02** `merge` | idem + invariante 3 (`nova ≠ antiga`) | idem | idem | idem | idem | idem; **par antiga/nova ordenado** pelo contrato | idem |
| **IF-03** `unmerge` | idem + invariante 4 | idem | idem | idem | idem | idem | Split é **fato novo**: replay não reescreve histórico (ADR-0004 §5.2) |
| **IF-04** `restore` | idem; `correction_of` **obrigatório** ⇒ ausência é EC-1; alvo não visto é EC-8 | EC-4, EC-5, EC-8 (nova tentativa após o alvo chegar) | EC-1/EC-2/EC-3 | idem | idem | idem | Reversão **carimbada**: replay anterior ao carimbo ainda vê a aresta vigente |
| **IF-05** `reassignment` | idem + **alcance indefinido (L-10)** | EC-4, EC-5 | EC-1/EC-2/EC-3 | idem | idem | idem | **Bloqueado por desenho**: quarentena até CONF-Q-08 ser respondida |
| **IF-06** `erasure` | idem; `subject_ref_nova` deve ser `null` | EC-4, EC-5 | EC-1/EC-2/EC-3 | idem | idem | idem | `retired` é **estado**, não deleção: replay continua possível |
| **IF-07** `resolve(ref, as_of)` | EC-3, EC-6, EC-7 | **EC-7 com `as_of` explícito** — leitura determinística e idempotente | **EC-7 com `as_of` omitido** (resposta muda com o tempo — não reprodutível); EC-6 (determinístico); EC-3 (proibido reprocessar) | n/a (operação de leitura) | Cache **somente** por chave completa `(ref, as_of)` | n/a | É a **referência** do replay: equivalência do §1 |
| **IF-00** pacote de contrato | Divergência manifesto × artefato; digest não confere | Reverificação após republicação | Aceitar pacote divergente | n/a | n/a | n/a | Pin é pré-condição de qualquer replay honesto |

## 4. Idempotência

**PROPOSAL**, elaborando ADR-0005 M9.

1. **Chave.** A chave de dedup é `idempotency_key`, **fornecida pelo contrato**. É **proibido**
   derivar chave de idempotência de dados do paciente ou de qualquer heurística — o precedente
   negativo do legado está registrado em **HAZ-0009** (chave de fallback derivada do paciente na
   ausência de `MSH-10`, levando mensagens distintas a serem tomadas por replay).
2. **Escopo da chave.** `idempotency_key` é deduplicada **dentro** do escopo
   `{amh_tenant, legal_entity}`. Chave igual em tenants diferentes é **coincidência**, nunca
   duplicata — deduplicar entre tenants seria descarte de fato clínico legítimo e violação de
   isolamento.
3. **Armazenamento de dedup durável e compartilhado.** O registro de dedup **não** pode ser local
   ao processo: o legado falhou exatamente assim (*"process-local replay store"*, base de
   HAZ-0009), e um consumidor com mais de uma instância deduplicaria contra si mesmo apenas.
4. **Idempotência de efeito, não só de detecção.** As transições são aplicadas como **atribuição
   de aresta** ("a partir de `occurred_at`, esta ref resolve assim"), nunca como alternância
   (*toggle*) ou incremento. Assim, mesmo que a detecção falhe, aplicar a mesma transição duas
   vezes produz o mesmo estado. Detecção e efeito são **duas defesas independentes**.
5. **Janela de dedup — não dimensionável hoje.** Dimensionar a janela exige conhecer a janela
   máxima de redelivery do produtor, que **não está declarada** (SLOs `null`). Duas posturas
   possíveis, ambas registradas sem escolha:
   - **P-a (fail-closed conservadora):** dedup **sem expiração** por chave — custo de
     armazenamento crescente, correção garantida.
   - **P-b:** dedup por janela dimensionada ao dobro da janela de redelivery **declarada** — não
     aplicável enquanto a declaração não existir.
   **CONF-Q-11:** qual janela máxima de redelivery a AMH declara? Sem resposta, P-a é a única
   postura que não perde correção — e seu custo é dito, não escondido.
6. **Reconhecimento após persistência.** Nenhuma mensagem é reconhecida antes de o envelope estar
   **duravelmente persistido** (regra §3-9; **HAZ-0012**: *ingest acknowledges before durable
   persistence → o fato clínico é silenciosamente perdido*). Reconhecer cedo transforma
   at-least-once em at-most-once sem que ninguém perceba.

## 5. Ordem e fora de ordem

| Situação | Comportamento exigido | Hazard |
|---|---|---|
| Evento antigo chega depois de um mais novo (mesmo sujeito) | **Não regride estado.** A projeção é **reconstruída** incluindo o evento em sua posição por `occurred_at`; o estado corrente é recomputado, não sobrescrito | **HAZ-0011** |
| Eventos de sujeitos distintos intercalados | Esperado — não há ordem global. A malha só é consistente **por sujeito**, e o par antiga/nova de um mesmo fato é ordenado pelo contrato | HAZ-0011 |
| Empate de `occurred_at` no mesmo sujeito | O contrato desempata *"por ordem de emissão declarada pelo produtor"*. O envelope carrega `emitted_at`; **empate duplo (`occurred_at` e `emitted_at` iguais) é indefinido** ⇒ **CONF-Q-12**; postura fail-closed até resposta: quarentena do par com alarme, jamais escolha arbitrária | HAZ-0011 |
| Atraso além da utilidade clínica | Não é erro de contrato; é **degradação visível**: a idade do insumo e o atraso da lane são sinal operacional exposto a clínicos e operadores (DOM-0007) | **HAZ-0010**, **HAZ-0017**, **HAZ-0025** |
| Relógio da fonte enviesado (`occurred_at` implausível) | Quarentena por tempo implausível — **jamais** ajuste, jamais substituição por tempo de recebimento (regra §3-8; ADR-0008 N5: tempo implausível/ambíguo segue quarentena) | **HAZ-0026** |

## 6. Correção, supersessão e *tombstone*

| Conceito | Como o contrato o expressa | Comportamento V2 exigido |
|---|---|---|
| **Correção** | Campo `correction_of` (0..1), obrigatório em `restore` | Novo evento **liga-se** ao corrigido; **nunca** sobrescreve nem apaga (ADR-0005 M8; DOM-0002). O corrigido permanece recuperável |
| **Supersessão em cadeia** | `correction_of` pode encadear-se | Cadeia percorrida integralmente; **ciclo** (A corrige B corrige A) é EC-1 ⇒ quarentena. Profundidade de cadeia não é limitada pelo contrato — limite arbitrário do consumidor seria coerção |
| **Referência pendente** | `correction_of` apontando evento não visto | **EC-8**: retenção pendente + alarme se não resolver. **Proibido** aplicar assumindo conteúdo do alvo |
| ***Tombstone*** | **Não existe deleção neste contrato.** `erasure` marca `status = retired`; a ref *"nunca é deletada nem reutilizada"* (FONTE, AMH-020b via ata) | A V2 **não** implementa `erasure` como deleção. A ref aposentada continua resolvendo com `status: retired` e a data do fato, o que preserva a distinção entre **sujeito eliminado** e **ref desconhecida** |
| **Efeito da avaliação passada** | — | Correção **não reescreve avaliação passada**: dispara nova avaliação vinculada ao novo conjunto de fatos, e a anterior é marcada como superada com histórico visível (ADR-0008 **N6**, aceito). Alertas derivados são reconciliados pela máquina de estados, **jamais silenciosamente retirados** (**HAZ-0008**, HAZ-0022) |

**Limite explícito deste documento.** O que a V2 faz com **seus próprios** envelopes retidos e
fatos derivados quando recebe um `erasure` — retenção, minimização, política por classe de dado —
**não é decidido aqui e não é decidido pelo contrato v1**. O ADR-0005 §7 registra que a política
de retenção é do ADR-0018 e *"exige determinação legal — nenhuma conformidade declarada"*. Este
documento apenas fixa que **`erasure` não é deleção do lado do produtor** e que a camada
anticorrupção não pode inventar semântica de apagamento local.

## 7. Replay, lacuna e recuperação

### 7.1 Duas fontes de replay, com custos diferentes

| Origem do replay | O que permite | Depende de |
|---|---|---|
| **Envelopes retidos pela V2** (imutáveis) | Reprocessar a malha inteira sob mapeamento corrigido, sem pedir nada à AMH; base do determinismo (DOM-0003) | Só da própria V2 — **preferível** |
| **Fluxo do produtor desde o início** | *Bootstrap* inicial, preenchimento de lacuna e conferência independente | Retenção do produtor — **não declarada** (**CONF-Q-03**) e dependente do transporte não escolhido |

**PROPOSAL.** O replay determinístico da V2 é definido como: *mesmos envelopes retidos + mesma
versão de mapeamento + mesmo manifesto pinado ⇒ mesma malha*. Trocar a versão de mapeamento
produz malha **diferente** — o que é reinterpretação legítima e **datada**, registrada como nova
versão de projeção, jamais reescrita da anterior.

### 7.2 Critério de aceitação do replay

**SOURCE** (contrato §3): para qualquer `t`, o estado derivado dos eventos com `occurred_at <= t`
coincide com `resolve(ref, as_of=t)`. Esta equivalência é o critério de teste (CTS-11) e sustenta
**DOM-0002** e **DOM-0003**.

### 7.3 Detecção de lacuna — o vão estrutural

**INFERENCE (consequência de desenho, não defeito de redação).** O envelope não tem número de
sequência nem marca d'água por sujeito, e a resposta de `resolve` não declara eco de `as_of`
(L-13). Logo:

- uma **lacuna** (evento nunca entregue, ou perdido antes da persistência durável) é
  **invisível por inspeção**;
- a única detecção disponível é a **divergência** entre a malha reconstruída e `resolve(ref,
  as_of)` — isto é, IF-07 é o **mecanismo de integridade** de IF-01..IF-06;
- portanto, **a periodicidade e a amostragem dessa conferência são controle de segurança**, não
  otimização. Frequência e cobertura: **VALIDATION REQUIRED** (dependem de limites de uso de
  IF-07, `resolve_latency_e_limites`, hoje `null`).

**Consequência para downtime.** Após indisponibilidade do consumidor, a recuperação **não pode**
assumir "recebi tudo que importa". A postura fail-closed: enquanto a conferência de integridade
não confirmar a malha para os sujeitos afetados, esses sujeitos são marcados como **identidade em
revisão** — visíveis, não silenciosos (**HAZ-0025**: readiness que continua verde com a lane
degradada; **HAZ-0043**: quietude permanente lida como tranquilidade).

### 7.4 *Backfill*

**Distinção obrigatória** (`contract-manifest.draft.yaml`, `explicit_exclusions`): *"replay/backfill/
correção de **dados clínicos** e procedimento de reconciliação"* estão **fora** do v1; o **replay de
eventos de identidade** é cláusula **obrigatória**. Portanto:

- *backfill* de **eventos de identidade** está no contrato e é exercitado por CTS-12;
- *backfill* de **dados clínicos** **não tem garantia contratual** — qualquer suposição a respeito
  é inventada, e este documento não a faz.

## 8. O que é proibido em toda a matriz

1. Reconhecer antes de persistência durável (HAZ-0012).
2. Descartar mensagem inválida sem quarentena e sem contagem.
3. Retentar erro determinístico (EC-1/EC-2/EC-3) — não corrige e polui o sinal.
4. Reprocessar rejeição por escopo (EC-3) — amplificaria uma tentativa de violação.
5. Degradar `resolve` para "resolução atual" quando `as_of` não for satisfatível (contrato §4).
6. Cachear resposta de `resolve` por chave incompleta (só `ref`).
7. Derivar chave de idempotência de dados do paciente (HAZ-0009).
8. Deduplicar entre tenants distintos.
9. Aplicar `correction_of` pendente por suposição (EC-8).
10. Tratar `erasure` como deleção.
11. Tratar duplicata como incidente (é o modo normal do at-least-once) — o incidente é **duplicata
    não deduplicada**.
12. Declarar saúde da lane sem conferência de integridade (§7.3).

## 9. Questões abertas deste documento

| # | Questão | Para quem | Ligação |
|---|---|---|---|
| **CONF-Q-11** | Qual a janela máxima de redelivery declarada pelo produtor? | Dono AMH | §4.5; SLOs `null` |
| **CONF-Q-12** | Como desempatar eventos com `occurred_at` **e** `emitted_at` idênticos no mesmo sujeito? | Dono AMH | §5 |
| **CONF-Q-13** | Há mecanismo de detecção de lacuna (sequência, marca d'água, *snapshot* periódico) previsto, ou a conferência via `resolve` é a única? | Dono AMH + ADR de fronteira | §7.3; CONF-Q-02 |
| **CONF-Q-14** | `resolve` suporta consulta em lote, e com que limites? | Dono AMH | §7.3 (viabilidade da conferência) |

---

*Redigido pelo engenheiro de camada anticorrupção e conformidade AMH (ciclo 1). Nenhum transporte
escolhido; nenhum SLO inventado; nenhuma decisão registrada. Nada escrito em `contract-v1/`, em
ADRs, em registros ou no repositório AMH. Sem PHI, credenciais ou identificadores reais.*
