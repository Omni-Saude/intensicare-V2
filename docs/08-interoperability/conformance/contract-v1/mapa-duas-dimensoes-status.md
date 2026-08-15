---
doc_id: CONF-V1-MAPA-DUAS-DIMENSOES-STATUS
title: Mapa das duas dimensões de status na fronteira v1 — qualidade de fonte AMH × status de avaliação V2, por cenário de ingestão
status: PROPOSAL
owner: UNASSIGNED — VALIDATION REQUIRED
collector: engenheiro de camada anticorrupção e conformidade AMH (ciclo 1)
source: >
  INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §7.6 ("Keep two independent status dimensions… never
  collapse the dimensions"); docs/03-domain/status-dimensions.md (definições e placeholder de
  matriz); docs/03-domain/invariants/DOM-invariants.md DOM-0004 e DOM-0008;
  docs/06-architecture/adrs/ADR-0008-evaluation-status-and-completeness-freshness-semantics.md
  §4.2 N2/N3/N4/N5/N6/N8/N9 — **accepted (2026-08-15, GDEC-0007)**, arquivo lido em estado de
  working tree não commitado; docs/06-architecture/adrs/ADR-0005-modelo-canonico-*.md §5.2 M4 e
  M7 — **proposed**; docs/08-interoperability/amh-data/contract-inventory.md A3 (CodeSystem
  amh-data-quality-status: valid | warning | quarantined); docs/08-interoperability/amh-data/
  four-layer-dossier.md Layer 3 (VALIDATION REQUIRED: se `_dq_status` chega aos recursos FHIR);
  docs/05-clinical-safety/hazard-log.md (HAZ-0005, HAZ-0021, HAZ-0039, HAZ-0040, HAZ-0043)
date_collected: 2026-08-15
last_updated: 2026-08-15
---

# Mapa das duas dimensões de status — fronteira do contrato v1

> **Status: PROPOSAL.** Alinha-se ao **ADR-0008 (aceito, GDEC-0007, 2026-08-15)** e ao **ADR-0005
> (proposed — nenhuma decisão registrada)**, citando ambos com seus estados reais. Este documento
> **não** altera nenhum dos dois, **não** cria vocabulário e **não** ratifica a matriz de
> `status-dimensions.md`, cuja ratificação pertence aos donos lá designados.

## 1. As duas dimensões

**SOURCE (§7.6):**

> *"Keep two independent status dimensions throughout mapping: source data quality, including AMH
> `valid | warning | quarantined`; and V2 evaluation status, including
> `valid | partial | not_evaluated | stale | invalid`. Define an explicit mapping matrix but never
> collapse the dimensions. A source marked `valid` can still be stale or insufficient for a
> pathway; a quarantined source must not become a normal V2 value."*

| | Dimensão 1 — **qualidade de fonte** | Dimensão 2 — **status de avaliação V2** |
|---|---|---|
| Vocabulário | `valid \| warning \| quarantined` (CodeSystem AMH `content: complete`, escopo `_dq_status` Silver-Rules) | `valid \| partial \| not_evaluated \| stale \| invalid` |
| Do que fala | Do que a **fonte** pensa do dado que produziu | Do que a **V2** conclui sobre a **avaliação** que tentou fazer |
| Onde mora | No fato/proveniência (ADR-0005 M4, proposto) | No `EvaluationRecord` (ADR-0008 N8, **aceito**) |
| Quem decide | A fonte | A política de completude/atualidade da **versão da regra** |

**Proibição (DOM-0008; ADR-0008 N8, aceito; HAZ-0040):** as duas jamais são colapsadas nem uma é
inferida da outra. Combinação não mapeada **falha fechada** para `not_evaluated`/`invalid` com
razão — **nunca** default a `valid`.

## 2. A regra estrutural que impede o colapso

**SOURCE (ADR-0005 §5.2 M4 — PROPOSAL):** a qualidade de fonte mapeia para **admissibilidade do
fato como insumo** — *"nunca diretamente para status de avaliação, que é computado pelo ADR-0008 a
partir de admissibilidade + completude + atualidade"*.

```
qualidade de fonte  ──►  ADMISSIBILIDADE do fato como insumo
                                    │
                                    ├── + completude (política da versão da regra)
                                    ├── + atualidade (janela / horizonte — ADR-0008 N5)
                                    └──►  STATUS DE AVALIAÇÃO V2  (ADR-0008)
```

Toda seta que pule a caixa do meio é o colapso proibido. **Nenhuma célula da matriz do §5 é uma
derivação direta**; cada uma diz o que é **alcançável** e sob que condição.

## 3. O achado desta fronteira: a dimensão 1 **não chega**

**OBSERVADO** (`eventos-ciclo-de-vida-identidade.md` §2): o envelope de 11 campos **não tem campo
de qualidade de fonte**. Nenhum dos seis tipos de evento carrega `valid | warning | quarantined`.

**OBSERVADO** (`four-layer-dossier.md` Layer 3; `contract-inventory.md` A3): já era
`VALIDATION REQUIRED` saber se o `_dq_status` AMH é carregado aos recursos FHIR. Para **esta** lane,
a resposta é conhecida **por desenho**: **não é**.

**INFERENCE.** A hipótese **H1** do ADR-0005 (*"a lane FHIR não carrega sinal de qualidade — a V2
precisará derivar qualidade por checagens próprias"*) está, para a lane de identidade,
**confirmada pelo texto do contrato**, não por medição. Aplica-se a **última linha** da matriz M4:

> *(sinal ausente — fonte não carrega qualidade)* → **Fail-closed com registro**: o fato carrega
> `quality: unknown` explícito na proveniência; admissibilidade só existe se a lane tiver sido
> aceita no G3 **com essa limitação declarada** e coberta por checagens de aptidão próprias da V2.
> **Jamais** default silencioso a `valid`.

**Consequência imediata e desconfortável:** a lane **não** foi aceita no G3 (o G3 não foi
aproximado). Logo, hoje, **nenhum fato desta fronteira é admissível como insumo de avaliação
clínica acionável** — o que é coerente com a postura vigente de *avaliação clínica não-acionante*
enquanto o achado for "candidato a integração".

## 4. Como um evento de identidade toca a dimensão 2 (sempre **indiretamente**)

**INFERENCE.** Um evento de identidade **não é um fato clínico** e **não tem** status de avaliação
próprio. Ele afeta a **malha de refs**, que condiciona o **chaveamento** dos fatos clínicos
(`(tenant, PSR, encontro)` — ADR-0005 M2). A cadeia é:

```
evento de identidade ──► malha de refs (projeção) ──► chaveamento do fato clínico
                                                   └──► admissibilidade do fato ──► status de avaliação
```

Portanto, **toda** linha do §5 responde à pergunta: *"o que acontece com a avaliação dos fatos
clínicos daquele sujeito quando a malha está neste estado?"* — e a resposta **nunca** é "nada",
porque "nada" seria silêncio, e silêncio é o modo de falha de **HAZ-0005** e **HAZ-0043**.

## 5. Matriz explícita — qualidade de fonte × status de avaliação

Linhas = dimensão 1. Colunas = dimensão 2. Cada célula: **alcançável sob que condição**, ou
**PROIBIDO**. **Nenhuma célula é automática.**

| Dim. 1 ↓ / Dim. 2 → | `valid` | `partial` | `stale` | `not_evaluated` | `invalid` |
|---|---|---|---|---|---|
| **`valid`** | Alcançável **somente** se completude e atualidade também passarem. Fonte `valid` **não promove nada** | Alcançável sob política de escore ratificada (ADR-0008 N4; classe por ADR-0026) | Alcançável — fonte `valid` **nada afirma** sobre frescor | Alcançável — insumos obrigatórios faltando | Alcançável — p.ex. unidade não mapeável, tempo implausível |
| **`warning`** | Alcançável **apenas** com a razão de *warning* **carregada** na proveniência e propagada ao registro; a política clínica por classe decide se contribui normalmente. **Nunca silencioso** | idem, com razão carregada | Alcançável | Alcançável | Alcançável |
| **`quarantined`** | **PROIBIDO** — *"a quarantined source must not become a normal V2 value"* | **PROIBIDO como contribuição.** Alcançável **apenas** se o fato quarentenado **não for insumo** daquela avaliação — e então o `partial` decorre de **outros** motivos, jamais do quarentenado | **PROIBIDO como contribuição** (mesma regra) | **Esperado** — razão `quarantined_input` | **Esperado** — razão `quarantined_input` |
| **`unknown`** *(sinal ausente — o caso desta fronteira)* | **PROIBIDO** — seria o default silencioso a `valid` que M4 veda | **PROIBIDO** hoje | **PROIBIDO** hoje | **Estado corrente desta lane** — fail-closed com razão | Alcançável se houver, além da qualidade ausente, condição de invalidez própria |

**Leitura obrigatória.** A linha `unknown` **não** é hipótese: é a linha em que a fronteira v1
opera hoje (§3). As três primeiras linhas descrevem o comportamento **quando e se** a AMH passar a
carregar a dimensão 1 nesta lane.

## 6. Matriz por **cenário de ingestão**

Cada cenário: o que a dimensão 1 vale, o que a dimensão 2 se torna **para os fatos clínicos do
sujeito afetado**, a razão codificada, o que é **proibido**, e o hazard.

| # | Cenário de ingestão | Dim. 1 (qualidade de fonte) | Dim. 2 (avaliação dos fatos do sujeito) | Razão (ADR-0008 N3) | **Proibido** | Hazard |
|---|---|---|---|---|---|---|
| **S1** | Evento válido aplicado; malha consistente | `unknown` (ausente por desenho) | Inalterada **pelo evento**; segue a política de completude/atualidade dos insumos clínicos | conforme os insumos | Concluir que "identidade OK" ⇒ "avaliação válida" | HAZ-0040 |
| **S2** | Evento **inválido** quarentenado (CTS-07/08/09/20) | `unknown`; o **evento** está em quarentena V2 | O sujeito fica com **identidade em revisão** ⇒ avaliações que dependam do chaveamento vão a `not_evaluated` | `quarantined_input` (o insumo é a **transição**, não um valor clínico) — ver §7 | Prosseguir "com a malha anterior" como se nada tivesse chegado | HAZ-0005, HAZ-0027 |
| **S3** | Duplicata deduplicada | `unknown` | **Inalterada** — é o modo normal | — | Alarmar como incidente (habitua a ignorar) | HAZ-0009 |
| **S4** | Fora de ordem, projeção reconstruída | `unknown` | Inalterada após reconstrução; **durante** a reconstrução, `not_evaluated` para os sujeitos afetados | `unspecified_condition` (não há token para "projeção em reconstrução") | Servir estado parcial de projeção como se fosse final | HAZ-0011 |
| **S5** | Atraso material da lane | `unknown` | **Não** é `stale` do insumo clínico: é **lane degradada**. Avaliações seguem com os insumos que têm, com o atraso **visível** | `stale_input:<insumo>` **apenas** se o insumo clínico estiver fora da janela — jamais por causa da lane | Reportar lane saudável; confundir atraso de lane com frescor de insumo | HAZ-0010, HAZ-0017, HAZ-0025 |
| **S6** | `correction_of` pendente (EC-8) | `unknown` | `not_evaluated` para o sujeito enquanto pendente | `unspecified_condition` | Aplicar supondo o conteúdo do evento referenciado | HAZ-0008 |
| **S7** | `reassignment` com alcance indefinido (**L-10**) | `unknown`; evento quarentenado | `not_evaluated` para **todos** os fatos da ref de origem, marcados como identidade em revisão | `quarantined_input` + `unresolved_encounter` quando aplicável | Reatribuir **todos** os fatos por suposição; ou ignorar o evento | **HAZ-0001**, **HAZ-0002** |
| **S8** | `erasure` ⇒ ref `retired` | `unknown` | Fatos existentes **não** desaparecem; o sujeito é distinguível de "ref desconhecida"; elegibilidade clínica é **política**, nunca inferência da camada de identidade | conforme a política; nunca inventada aqui | Tratar `retired` como deleção; tratar como "paciente sem achados" | HAZ-0005, HAZ-0039 |
| **S9** | `resolve` **nega** (ref desconhecida, malformada, fora de escopo, `as_of` fora de janela) | `unknown` | `not_evaluated` — ref bem-formada porém desconhecida ⇒ `not_evaluated`, **nunca** suposição (ADR-0004 §5.2, regra vinculante derivada) | `unspecified_condition` (não há token para "identidade não resolvida") | Degradar para resolução "atual"; presumir continuidade | **HAZ-0005**, HAZ-0021 |
| **S10** | `resolve` **indisponível** (EC-7) | `unknown` | `not_evaluated` com indisponibilidade **visível**, para os sujeitos que dependam da resolução | `rule_unavailable` **não** serve (é sobre regra); ⇒ `unspecified_condition` | Servir resposta em cache por chave incompleta; assumir última resolução conhecida | HAZ-0025 |
| **S11** | **Deriva de contrato** detectada (CTS-17/CTS-22) | `unknown`; lane sob suspeita | `not_evaluated` para o escopo afetado, com lane **parada visivelmente** | `unspecified_condition` | Coagir o novo formato ao antigo; afrouxar a verificação para "destravar" | HAZ-0032, HAZ-0031 |
| **S12** | **Lacuna** detectada após *downtime* (CTS-16) | `unknown` | `not_evaluated` para os sujeitos não confirmados pela conferência de integridade | `unspecified_condition` | Assumir "recebi tudo que importa" | **HAZ-0012**, HAZ-0025 |
| **S13** | **Silêncio da lane** — nenhum evento jamais recebido | `unknown` | **Não** é "nada mudou". É **ausência de sinal**, indistinguível de "nada ocorreu" sem conferência ativa | `source_empty` quando a checagem de aptidão confirmar lane vazia | Ler quietude como tranquilidade | **HAZ-0039**, **HAZ-0043** |

**S13 merece ênfase.** O ADR-0008 **N7** (aceito) determina que *"`not_evaluated` persistente é
sinal operacional e gatilho de revisão de retirada"*, exibido como **vigilância ausente**, não como
via quieta. Uma lane de identidade que nunca entrega nada é exatamente esse caso.

## 7. Vocabulário de razões — o que existe e o que falta

**SOURCE (ADR-0008 N3, aceito):** todo status não-`valid` carrega **ao menos uma razão legível por
máquina**, de vocabulário **enumerado e versionado no rule release**; razões são **tokens
enumerados, nunca texto livre**; status sem razão é **inconstruível**.

| Condição desta fronteira | Token existente aplicável | Adequação |
|---|---|---|
| Transição quarentenada por invariante | `quarantined_input` | **Boa** — se "insumo" comportar "transição de identidade" |
| Encontro não resolvível após transição | `unresolved_encounter` | Boa |
| Lane de identidade vazia | `source_empty` | Boa (via checagem de aptidão) |
| Insumo clínico fora da janela | `stale_input:<insumo>` / `expired` | Boa — **não** confundir com atraso de lane (S5) |
| **Identidade não resolvida** (S9) | — | **Sem token** |
| **`resolve` indisponível** (S10) | — | **Sem token** (`rule_unavailable` é sobre regra, não sobre identidade) |
| **Projeção em reconstrução** (S4) | — | **Sem token** |
| **Deriva de contrato** (S11) | — | **Sem token** |
| **Lacuna não confirmada** (S12) | — | **Sem token** |

**Postura obrigatória hoje:** as cinco condições sem token resolvem, **fail-closed**, para
`not_evaluated` com razão **`unspecified_condition`** — o *fallback* total do **N9**, que também
determina que *"a ocorrência é sinal operacional"* e que *"não existe caminho 'desconhecido →
presumir bem'"*.

**PROPOSAL (não cunhada como existente).** Cinco tokens **candidatos** —
`identity_unresolved`, `identity_resolution_unavailable`, `identity_projection_rebuilding`,
`contract_drift`, `delivery_gap_unconfirmed` — resolveriam a perda de especificidade do
*fallback*. **Nenhum deles existe.** Estender o vocabulário é ato de quem versiona o rule release
sob o ADR-0008, com o dono nomeado — **não deste papel**. Registrado como **CONF-Q-23**.

## 8. Proibições verificáveis (anti-colapso)

| # | Proibição | Teste |
|---|---|---|
| **AC-1** | Derivar status de avaliação diretamente de qualidade de fonte, sem passar pela admissibilidade | Checagem estática + teste de contrato (ADR-0005 V4; TST-DOM-0008) |
| **AC-2** | Default silencioso a `valid` quando a qualidade de fonte é ausente | Teste com envelope sem dimensão 1 (**é o caso de toda mensagem desta lane**) |
| **AC-3** | Fato quarentenado contribuindo para avaliação | Vetor com fato quarentenado exigido pela regra ⇒ `not_evaluated`/`invalid` com razão |
| **AC-4** | Status sem razão | Construção de status sem razão deve ser **impossível**, não apenas rejeitada em revisão |
| **AC-5** | Colapsar dimensão 1 na dimensão 2 na **exibição** (mostrar "fonte válida" como "avaliação válida") | Teste de exibição/roll-up (ADR-0008 N4-iii: proibido dobrar em "normal") |
| **AC-6** | Promover status em qualquer consumidor a jusante | ADR-0008 N4-iv (*nenhum consumidor promove status*) |

## 9. Alinhamento declarado com os dois ADRs

| Item | ADR-0008 (**accepted**, GDEC-0007) | ADR-0005 (**proposed**) | Este documento |
|---|---|---|---|
| Dimensões separadas, fail-closed | **N8** | **M4** | §1, §5 — restatement, sem alteração |
| Precedência `invalid > not_evaluated > stale > partial > valid` | **N2** | — | Assumida em §6; nenhuma célula a contraria |
| Razão obrigatória e enumerada | **N3** | — | §7 — lacunas declaradas, tokens **não** cunhados |
| Base de tempo = tempo clínico de fonte | **N5** | **M3** | Ecoada em S5 (atraso de lane ≠ frescor de insumo) |
| Correção não reescreve avaliação passada | **N6** | **M8** | S6, e CTS-10 |
| *Fallback* total `unspecified_condition` | **N9** | — | §7 — postura corrente das cinco condições sem token |
| Admissibilidade como caixa do meio | — | **M4** (PROPOSAL) | §2 — **depende de um ADR não aceito**, e assim se declara |

**Risco de acoplamento registrado.** A caixa do meio (§2) vem de um ADR **`proposed`**. Se o
ADR-0005 for aceito com emenda a M4, este mapa muda. O inverso não vale: nada aqui é insumo para
alterar M4 — a ratificação da matriz de `status-dimensions.md` pertence aos donos lá designados
(condição **C3** do ADR-0005, **ABERTA**).

## 10. Questões abertas deste documento

| # | Questão | Para quem |
|---|---|---|
| **CONF-Q-23** | O vocabulário de razões do ADR-0008 N3 será estendido para as cinco condições de identidade sem token? | Dono do rule release sob ADR-0008 |
| **CONF-Q-24** | A AMH passará a carregar a dimensão 1 nesta lane (campo de qualidade no envelope)? Seria mudança **compatível** | Dono AMH |
| **CONF-Q-25** | "Insumo" no token `quarantined_input` comporta **transição de identidade**, ou é exclusivo de valor clínico? | Dono do ADR-0008 + donos de `status-dimensions.md` |
| **CONF-Q-26** | Sob qualidade de fonte **ausente**, que checagens próprias de aptidão a V2 executará nesta lane (M4 exige que existam)? | AUTH-DATA-PLATFORM + AUTH-CLINSAFETY (não nomeados) |

---

*Redigido pelo engenheiro de camada anticorrupção e conformidade AMH (ciclo 1). Nenhum vocabulário
cunhado; nenhuma matriz ratificada; nenhum ADR editado; nenhuma decisão registrada. ADR-0008 citado
como **aceito** e ADR-0005 como **proposto**, com seus estados reais. Sem PHI, credenciais ou
identificadores reais.*
