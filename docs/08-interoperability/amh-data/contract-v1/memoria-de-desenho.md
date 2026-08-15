---
doc_id: AMH-CONTRACT-V1-MEMORIA-DE-DESENHO
title: Minuta do contrato AMH×IntensiCare v1 — memória de desenho
status: PROPOSAL
owner: UNASSIGNED — VALIDATION REQUIRED
collector: steward de publicação de contrato AMH×IntensiCare
source: >
  Decisões DECIDIDAS por rodaquino-OMNI em 2026-08-15 (ata
  docs/08-interoperability/amh-data/identity-adjudication/adjudicacao-decisoes-2026-08-15.md,
  IDN-ADJ-2026-08-15 — AQ-3, AQ-4, AQ-5); derivações OS-13/OS-17/OS-18/OS-19 e §9 de
  docs/08-interoperability/amh-data/ordens-de-servico-amh-2026-08-15.md;
  INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §7.5; padrão Maezo OBSERVADO em
  schemas/contracts/maezo/v1/contract-manifest.yaml @
  Omni-Saude/amh-data-platform@0a07a6f1fab36fb2f5eeee0fcd8e945c95f67116 (leitura via API
  de conteúdo, 2026-08-15, somente leitura)
date_collected: 2026-08-15
last_updated: 2026-08-15
---

# Memória de desenho — minuta do contrato AMH×IntensiCare v1

**Status: PROPOSAL.** Este documento explica **por que cada seção da minuta existe**, qual
decisão do titular (AQ-n) ou requisito do prompt (§7.5) a sustenta, o que foi
**deliberadamente minimizado** frente ao envelope Maezo e por quê, quais alternativas foram
rejeitadas, e quais pontos permanecem **abertos para negociação com a AMH**.

**Limites deste papel (repetidos porque importam):** o steward que redigiu a minuta **não
aceita** contrato, **não escolhe** transporte, **não nomeia** donos, **não marca** DECIDED
novo e **não escreve** no repositório AMH. A minuta é o insumo V2 para a OS-19; a publicação
é ato AMH; a aceitação exige donos AMH e V2 nomeados.

---

## 1. Por que uma minuta do lado V2

A OS-19 descreve o pacote que **a AMH criará** no repositório dela (`schemas/contracts/
intensicare/v1/`, caminho proposto). O contrato é AMH-owned (XRD-04): *"a V2 propõe, não
coloca"*. Sem uma proposta concreta, a negociação começaria do zero e cada critério da OS-19
seria redescoberto. A minuta converte as três cláusulas já DECIDIDAS (AQ-3/4/5) e os
critérios da OS-19 em texto negociável, deixando **explícito e nulo** tudo que só a AMH pode
preencher (commit produtor, digests, dono, SLOs medidos, registry).

## 2. Racional seção a seção do manifesto

| Seção da minuta | Por que existe | Sustentação |
|---|---|---|
| `producer` / `consumer` (commits) | O G3 exige contrato pinado por commit dos dois lados. Commit produtor = `VALIDATION_REQUIRED` (só existirá na publicação); commit consumidor = HEAD observado na redação (`fc8c98f1…`) | §7.5; OS-19 crit. 1 |
| `governance_roles` | Donos e steward de dado clínico são condição de aceitação; nenhum agente nomeia pessoas — campos `UNASSIGNED — VALIDATION REQUIRED`, verbatim | evidence-notation.md §2 regra 7; OS-19 crit. 1 e 6 |
| `ig_dependency` (pin por digest) | DECIDIDO: a V2 pina a IG **1.1.0** quando publicada, por **digest do artefato** — não blob SHAs. A 1.1.0 não existe; a minuta registra o alvo sem fingir o pin | AQ-2 (ata §4); OS-05 crit. 4 |
| `subject` | Cláusula 1 do contrato: PSR obrigatório, escopo `{amh_tenant, legal_entity}`, sempre qualificado por encontro; nenhum identificador de fonte cruza a fronteira | **DECIDIDO AQ-4 = A plena**; XRD-05 |
| `identity_lifecycle` + doc anexo | Cláusula 2, vinculante: sem eventos + `resolve(ref, as_of)`, o G3 não passa. Especificação completa em `eventos-ciclo-de-vida-identidade.md` | **DECIDIDO AQ-5 = A vinculante**; OS-17/OS-18 |
| `purpose_model` | Cláusula 3: tutela da saúde (LGPD Art. 11, II, "f") no loop clínico; sem gate de consentimento; usos secundários bloqueados; `ie_perm_sms_email` jamais como consentimento; ratificação jurídica antes de dado real | **DECIDIDO AQ-3 = C**; DEC-G0-03; OS-13/OS-16 |
| `security_classification` | Todo artefato declarado sem PHI/refs opacas — padrão Maezo de classificação por artefato, replicado sem copiar conteúdo | OS-19 crit. 1; padrão Maezo OBSERVADO |
| `approval_record: []` + estrutura | O registro nasce vazio por honestidade: nenhuma aprovação foi buscada. A estrutura (papéis mínimos, campos por entrada) fica pronta para o ato humano | OS-19 crit. 1; evidence-notation.md (nenhum agente aprova) |
| `compatibility_policy` / `deprecation_window` / `change_notification_route` | Mudança de contrato precisa de regra ANTES da primeira mudança. BACKWARD proposto por ser o modo já exercido no Maezo; janela e canal ficam `VALIDATION_REQUIRED` (números e canais não se inventam) | OS-19 crit. 1; lição do OS-05 crit. 3 (compatibilidade "dita, não descoberta") |
| `supported_tenants` / `supported_environments` | Só `dev` sintético (DEC-G0-03; único ambiente provisionado — Q6). Enumeração de tenants **pinada, não transcrita** (OS-03 crit. 4). Tenant piloto: adiado pelo titular (ata §8, pendência 8) | OS-19 crit. 1; AQ-6; DEC-G0-03 |
| `slos` (estrutura com valores nulos) | O OS-19 exige a estrutura; inventar valor fabricaria evidência de camada 4, que este ciclo não tem. `null` + `VALIDATION_REQUIRED` é a única resposta honesta | OS-19 crit. 1; ata §6 (camadas 2–4 sem evidência) |
| `fixtures` | Padrão Maezo: válidas E deliberadamente inválidas acompanham o contrato. 6 válidas + 4 inválidas, 100% sintéticas | OS-19 crit. 1; OS-17 crit. 4 |
| `explicit_exclusions` | Ausência nunca pode ser lida como afirmação (defeito que a varredura da Gold descreve). Vitais (C-1), Observation laboratorial (até OS-20 aceita), replay/backfill/correção clínica + reconciliação, usos secundários, writeback, corpus histórico | OS-19 crit. 1 e 5; §9 das ordens |
| `transport` (nulo, com opções) | Nenhum transporte é escolhido nem implícito; a escolha é do ADR de fronteira. As opções e critérios ficam registrados para a comparação | §7.5; decisão proibida ao steward |

## 3. Cláusula de sujeito — decisões incorporadas sem re-decidir

Tudo na seção `subject` é transcrição de decisão existente, não desenho novo: PSR
obrigatório, formato `amh:psr:v1:<uuidv4>`, nativo na V2 desde o dia um (sintético em dev),
independente de encontro e sempre qualificado por encontro, chaveamento V2 por
`(PSR, encontro)` — **DECIDIDO AQ-4** (ata §2, §4). A única contribuição da minuta é a
ressalva operacional: eventos de identidade e `resolve` operam sobre a ref em si (sem
qualificação de encontro), porque o objeto deles é a ref, não o fato clínico.

## 4. Cláusula de ciclo de vida — o que a minuta acrescenta ao já decidido

O decidido (AQ-5): obrigatoriedade, at-least-once, ordenação por sujeito, `resolve(ref,
as_of)`, reprovação do G3 sem eles. O que a minuta **propõe** por cima (tudo PROPOSAL,
rastreado no doc da cláusula §5): o envelope mínimo de 11 campos, as 6 invariantes
verificáveis por fixture, a equivalência replay ⇔ `resolve` como critério de teste, e a
semântica explícita para `as_of` pré-minting e ref `retired` (exigida pela OS-18 crit. 3).

## 5. Minimização deliberada frente ao envelope Maezo — campo a campo

§7.5: *"não copie cegamente o envelope de 28 campos do Maezo se um contrato menor e
rigorosamente governado bastar"*. A minuta usa **11 campos**. Disposição dos 28 do Maezo
(lista de campos OBSERVADA no manifesto pinado; conteúdo não reutilizado):

| Campo Maezo | Disposição na minuta | Por quê |
|---|---|---|
| `event_id`, `event_type`, `occurred_at`, `idempotency_key`, `amh_tenant`, `legal_entity` | **MANTIDO** (mesmos nomes) | Carga mínima de identidade, dedup e escopo — sem eles não há replay certificável |
| `canonical_schema_version` | **MANTIDO** como `event_type_version` | Versão viaja na mensagem; renomeado para escopo por tipo de evento |
| `ingested_at` | **SUBSTITUÍDO** por `emitted_at` | A OS-17 pede tempo de emissão; ingestão é fato do pipeline do produtor, irrelevante ao consumidor |
| `portable_subject_ref` | **DESDOBRADO** em `subject_ref_antiga`/`subject_ref_nova` | Evento de identidade comunica uma TRANSIÇÃO; uma ref só não a expressa |
| — (sem equivalente) | **ACRESCENTADO** `correction_of` | Vínculo de correção/supersessão exigido pela OS-17 crit. 1 |
| `source_vendor`, `source_product`, `source_instance`, `source_tenant`, `source_entity`, `source_position`, `protected_source_record_ref` | **EXCLUÍDOS** (7 campos) | Linhagem de fonte é assunto interno do produtor; carregá-la na fronteira contraria a direção de AQ-4 (só refs opacas atravessam) e acopla a V2 ao inventário de fontes da AMH |
| `amh_mpi_ref` | **EXCLUÍDO — PROIBIDO** | AQ-4/XRD-05: nenhum mpi_id, nem opaco-opcional, atravessa esta fronteira |
| `beneficiary_ref` | **EXCLUÍDO** | O loop de UTI é clínico, não de plano; a OS-14 registra que dizer "não precisa" é resultado válido. Reentra por emenda se a OS-14 concluir o contrário |
| `consent_decision_ref` | **EXCLUÍDO do envelope** | AQ-3 = C: sem gate de consentimento no loop clínico; a OS-13 crit. 3 manda não sugerir gate inexistente. Forma final = negociação N-6, condicionada ao parecer da OS-16 |
| `purpose_of_use` | **ELEVADO ao nível do contrato** | Contrato mono-propósito (`tratamento`); repetir por mensagem seria ruído sem decisão adicional. Reentra como campo se a AMH exigir simetria com Maezo |
| `data_classification` | **ELEVADO ao nível do manifesto** | Constante por construção (sem PHI, refs opacas) — `security_classification` |
| `correlation_id`, `causation_id`, `trace_id` | **EXCLUÍDOS do mínimo** | Observabilidade valiosa, porém não sustenta o caso de segurança do replay; aceitáveis como campos opcionais compatíveis (tolerant reader já os tolera) |
| `producer_version`, `contract_manifest_digest` | **EXCLUÍDOS do mínimo** | Versionamento viaja em `event_type_version` + pin do manifesto no lock. Vincular digest por mensagem é robustez extra que a AMH pode propor (compatível) |
| `payload_hash`, `replay_count` | **EXCLUÍDOS** | Não há payload livre (o envelope É a carga) — nada a canonicalizar; dedup é por `idempotency_key` |

**Resultado:** 28 → 11 campos, com dois acréscimos exigidos pela OS-17 (`subject_ref_nova`
implícito no desdobramento, `correction_of`). Cada exclusão é reversível por mudança
**compatível** (campo opcional novo) — a minimização não cria beco sem saída.

## 6. Alternativas rejeitadas

| Alternativa | Por que foi rejeitada | Quem rejeitou |
|---|---|---|
| Copiar o envelope de 28 campos / tópicos / payloads do Maezo | Proibição explícita do §7.5; campos inaplicáveis (fonte, beneficiário, consent) carregariam semântica que AQ-3/AQ-4 negam | Prompt §7.5 (norma); esta minuta (aplicação) |
| Consulta de resolução sem `as_of` (opção B de AQ-5) | Não sustenta replay — resolve "como é agora", não "como era então" | **DECIDIDO** — titular, 2026-08-15 |
| Janela-teto como paliativo (opção C de AQ-5) | Não sustenta o caso de segurança; explicitamente inadmitida | **DECIDIDO** — titular, 2026-08-15 |
| Chave interna V2 + reconciliação posterior (IDP-02) | Dívida de migração na camada mais sensível; PSR nativo custa menos e é mais seguro | **DECIDIDO AQ-4** (IDP-02 superseded) |
| `consent_decision_ref` presente e nulo no envelope | Sugeriria gate de consentimento que AQ-3 declara inexistente no loop clínico (risco nomeado pela OS-13 crit. 3) | Esta minuta (PROPOSAL — reversível em N-6) |
| Inventar valores de SLO/latência/janela de depreciação | Fabricaria evidência de camada 4 e números que só a AMH pode declarar e medir | Ordem expressa da tarefa; ata §6 |
| Transcrever a enumeração dos 12 tenants | A V2 **pina** a enumeração legível por máquina da IG 1.1.0 (OS-03 crit. 4); transcrever criaria segunda fonte de verdade | OS-03; esta minuta |
| Escolher transporte nesta minuta | Decisão proibida; pertence ao ADR de fronteira com comparação formal | Prompt §7.5; pacote de tarefa |
| Nomear dono AMH, steward clínico ou tenant piloto | Nomeações são atos humanos; tenant piloto foi **adiado pelo titular** (AQ-6 item 4) | evidence-notation.md §2 regra 7; ata §8 |

## 7. Transporte — opções registradas SEM escolha

**Nenhum transporte é implícito.** A escolha pertence ao ADR de fronteira (§7.5), com esta
comparação como insumo. As cláusulas da minuta foram redigidas para serem satisfativeis por
qualquer opção (envelope autocontido; ordenação por sujeito; at-least-once; `resolve`
neutro quanto a binding).

| Critério (§7.5) | FHIR REST/Subscriptions | Stream de eventos publicado | Lote controlado |
|---|---|---|---|
| Latência | Pull/poll ou subscription; dependente do canal HAPI — que ADR-040 declara "não é near-real-time" | Potencialmente a menor; **não medida** | A maior; janelas discretas |
| Durabilidade/retenção | Do servidor FHIR; histórico de eventos de identidade não é recurso FHIR nativo óbvio | Nativa do log de eventos; retenção configurável | Nativa dos artefatos de lote |
| Replay | Frágil para eventos (Subscription não re-entrega histórico) | **Forte** — replay desde offset é primitiva do modelo | Possível por reprocessamento de lotes |
| Acoplamento | Ao HAPI e à IG (que a V2 já pina para contexto clínico) | A um broker/registry novo na fronteira | O menor operacional; maior latência |
| Aderência a padrões | Alta (FHIR R4); modelar evento de identidade exigiria profile/operation custom | AsyncAPI/schema registry (precedente Maezo em `dev`) | Baixa padronização; simples |
| Realidade operacional AMH | HAPI existe em `dev`; partições incompletas (OS-09) | Publicação Maezo exercida em `dev` (Glue registry) — precedente OBSERVADO | Batch bronze→FHIR é o modo dominante atual (ADR-040) |
| Custo | Reuso de infra existente | Infra de streaming na fronteira | Menor custo incremental |

**Nota de honestidade:** as linhas "realidade operacional" e "latência" citam apenas o
OBSERVADO/FONTE no dossiê; nenhuma célula é medida deste ciclo. A comparação decisória
exigirá evidência de camada 2/4 que hoje não existe.

## 8. Pontos de NEGOCIAÇÃO abertos com a AMH

| # | Ponto | O que precisa acontecer | Referência |
|---|---|---|---|
| **N-1** | **Dono AMH do contrato** | AMH nomeia o dono produtor (critério 6 da OS-19 — a minuta NÃO o satisfaz; campo `UNASSIGNED`) | OS-19 crit. 6 |
| **N-2** | **Caminho no repo AMH** | Confirmar `schemas/contracts/intensicare/v1/contract-manifest.yaml` (proposto como *for example* no §7.5) | OS-19; B0 do inventário |
| **N-3** | **Transporte** | ADR de fronteira compara as opções do §7 com evidência de camada 2/4; nenhuma escolha até lá | §7.5 |
| **N-4** | **Janela de depreciação** | AMH propõe aviso mínimo + período de convivência de versões; V2 avalia contra necessidade clínica | manifesto `deprecation_window` |
| **N-5** | **Canal humano de notificação de mudança** | Definir canal e responsável; nenhum endereço registrado por agente | manifesto `change_notification_route` |
| **N-6** | **Forma do `consent_decision_ref`** | OS-13: ausente (proposta da minuta) vs presente-com-marcador-de-base-legal; ratificação junto ao parecer OS-16 | AQ-3; OS-13 |
| **N-7** | **Corpus histórico** | AMH decide destino dos recursos com URL de profile incorreta (reprocessar/remapear/marcar) — determina se a V2 consome acervo ou só produção nova | OS-07 crit. 4; §9.4 |
| **N-8** | **Cinco ou seis tipos de evento** | Ata (AQ-5) lista 5; OS-17 e lock listam 6 (`reassignment`). Confirmação do titular; a minuta segue os 6 da OS-17 e remover é emenda compatível | ata §2; OS-17 |
| **N-9** | **Valores de SLO** | AMH declara E mede disponibilidade, frescor, latência de eventos e de `resolve` (OS-17 crit. 3; OS-18 crit. 5) | manifesto `slos` |
| **N-10** | **Tenant piloto** | Decisão do titular, adiada para a redação do contrato (AQ-6 item 4; ata §8 pendência 8) | AQ-6 |

## 9. Critérios de aceitação da OS-19 — correspondência na minuta

| Critério OS-19 | Onde está | Estado |
|---|---|---|
| 1. Manifesto com todos os campos (commits, versões, digests, donos, steward, classificação, aprovação, compatibilidade, depreciação, notificação, fixtures, tenants/ambientes, SLOs, exclusões) | `contract-manifest.draft.yaml` — todas as seções presentes; valores impossíveis de conhecer estão `null`/`VALIDATION_REQUIRED` com razão declarada | **Correspondido (como minuta)** |
| 2. Campo sujeito = PSR | seção `subject` | **Correspondido** (DECIDIDO AQ-4) |
| 3. Cláusula obrigatória de eventos + `resolve(ref, as_of)` | seção `identity_lifecycle` + `eventos-ciclo-de-vida-identidade.md` | **Correspondido** (DECIDIDO AQ-5) |
| 4. Modelo de finalidade AQ-3 = C | seção `purpose_model` | **Correspondido** (DECIDIDO AQ-3) |
| 5. Exclusões explícitas ≥ {sinais vitais, Observation laboratorial} | seção `explicit_exclusions` (6 itens) | **Correspondido** |
| 6. Dono AMH nomeado | `producer.owner: UNASSIGNED — VALIDATION REQUIRED` | **NÃO satisfazível pela minuta** — só a AMH nomeia (N-1). Registrado, não contornado |

## 10. O que esta minuta não muda

O achado de compatibilidade permanece **candidato a integração; compatibilidade não
demonstrada para avaliação de UTI acionável**. Nada está pinado (`pinned: false`, digests
`null`). Camadas de evidência 2, 3 e 4 seguem sem observação. A minuta reduz o custo de
negociação e publicação — não substitui nenhuma das duas.

---

*Redigida pelo steward de publicação de contrato AMH×IntensiCare. Nenhuma decisão nova foi
tomada; decisões citadas como DECIDED pertencem ao titular, com data e ata. Nada foi escrito
no repositório AMH. Sem PHI, credenciais ou identificadores reais.*
