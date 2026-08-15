---
doc_id: AMH-PATHWAY-SOURCE-MATRIX-RULES-HUMAN
title: Matriz via-insumo-fonte (§7.2) — leitura humana para RULE-SOFA, RULE-NEWS2 e RULE-GCS
status: PROPOSAL
label: PROPOSAL
owner: UNASSIGNED — VALIDATION REQUIRED
approver_role: AUTH-CLINSAFETY (conteúdo clínico) + AUTH-DATA-PLATFORM (fonte)
source: >
  INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §7.2 (formato de linha e regras duras);
  docs/05-clinical-safety/rule-releases/{sofa,news2,gcs}/specification.md e sofa/logic.yaml
  (estado de working tree não commitado — 0.2.0 em revisão);
  docs/08-interoperability/amh-data/{four-layer-dossier.md, compatibility-finding.md,
  contracts.lock.draft.yaml, vital-signs-decision/pacote-decisao-c1-sinais-vitais.md,
  vital-signs-decision/impacto-no-portfolio.md, ordens-de-servico-amh-2026-08-15.md,
  identity-adjudication/adjudicacao-decisoes-2026-08-15.md};
  docs/05-clinical-safety/pathway-portfolio/{candidate-inventory.md, hard-gate-assessment.md,
  pathway-to-source-matrix.yaml} (REFERENCIADOS, NÃO ALTERADOS)
date_collected: 2026-08-15
last_updated: 2026-08-15
collector: arquiteto de compatibilidade AMH-dados (ciclo 1 — matriz §7.2)
machine_readable_companion: matrix.yaml
provenance:
  source_repo: intensicare-V2
  path_or_url: docs/08-interoperability/amh-data/pathway-source-matrix/matriz-leitura.md
  commit_sha_or_version: working tree não commitado sobre cycle-1/clinical-content @ 0c36f03
  section_or_lines: documento inteiro
  date_collected: 2026-08-15
  collector: arquiteto de compatibilidade AMH-dados
  transformation: >
    Renderização humana de matrix.yaml. O YAML é normativo para os vinte campos
    do §7.2; este arquivo agrupa por regra, sintetiza e comenta, e não omite
    nada material. Onde os dois divergirem, o YAML vence e este arquivo é defeito.
  confidence: alta quanto à transcrição do lado regra; baixa quanto a qualquer afirmação de fonte
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  requirements: []
  hazards: [HAZ-0005, HAZ-0032, HAZ-0036, HAZ-0038, HAZ-0043, HAZ-0044]
  adrs: [ADR-0001, ADR-0005, ADR-0007, ADR-0008, ADR-0028, ADR-0029]
  tests: []
  pr: null
supersedes: null
superseded_by: null
---

# Matriz via-insumo-fonte (§7.2) — leitura humana

> ## O resultado, em três linhas
>
> **47 linhas de insumo. Insumos com fonte evidenciada: ZERO. Elegíveis hoje: ZERO.**
>
> Não é "poucos". Não é "quase lá". Não há um único insumo, em nenhuma das três regras,
> que satisfaça o §7.2 — e a maioria falha em **seis a nove** dos seus requisitos
> simultaneamente, não em um.
>
> `matrix.yaml` é normativo. Este arquivo é a mesma matriz para leitura humana.

---

## 0. Cinco coisas antes de ler qualquer linha

### 0.1 A regra do §7.2 que este documento existe para não deixar esquecer

> "Profile existe", "tabela existe", "HTTP 200" e "a consulta funcionou" **não são
> evidência de que um insumo esteja povoado ou apto ao uso.**

Isto não é uma formalidade de auditoria. É a diferença entre um projeto que sabe que não
tem dado e um projeto que acha que tem. As quatro camadas de evidência são:

| Camada | O que prova | Estado hoje |
|---|---|---|
| 1 — contrato declarado | existe schema/profile/ADR/dono | **substancialmente estabelecida**, com 4 contradições abertas |
| 2 — capacidade implantada | a interface é alcançável e autorizada em um ambiente | **sem evidência** |
| 3 — dado povoado | há linhas/recursos reais, com distribuições de campo significativas | **sem evidência observada** |
| 4 — aptidão operacional | latência, completude, ordenação, correção, disponibilidade, replay medidos | **sem evidência** |

Passar numa camada anterior nunca implica passar numa posterior. **Toda afirmação
afirmativa que a V2 possui sobre a AMH é de camada 1.**

### 0.2 Os códigos desta matriz não são pinos

Cada código LOINC/ATC e cada unidade UCUM aqui foi **transcrito da própria especificação
da regra**, e as três especificações declaram esses vínculos como **candidatos
(PROPOSAL)**. Nenhum servidor de terminologia foi consultado, nenhum value set foi
expandido, LOINC e UCUM não têm release pinado. A autoridade de mapeamento é do arquiteto
de terminologia, sob o processo do **ADR-0029**. Nada aqui autoriza um vínculo.

### 0.3 As specs estão em working tree não commitado

As três especificações 0.2.0 estão sendo editadas por uma sessão concorrente. Toda
citação a elas é **estado de working tree não commitado (0.2.0 em revisão)**. Se uma spec
mudar, as linhas correspondentes precisam ser re-transcritas antes de uso.

### 0.4 O que mudou desde a matriz de portfólio de 2026-08-14

A matriz de candidatos (`pathway-portfolio/pathway-to-source-matrix.yaml`, 25 linhas)
continua válida no que afirma. Esta matriz é **complementar**, por insumo de regra, e
registra quatro atualizações:

| # | O que mudou | Consequência |
|---|---|---|
| **1** | As specs passaram a declarar códigos e unidades candidatos (não declaravam em 14/08) | A matriz de portfólio registra `NOT_SPECIFIED` corretamente para a data dela; aqui os códigos aparecem, ainda como candidatos sem pin |
| **2** | GDEC-0007 ratificou **todas** as janelas de frescor das três regras (quita VAL-0023 para SOFA, NEWS2 e GCS) | A lacuna de frescor **migrou, não fechou**: o lado regra está resolvido; falta a política de frescor **da fonte** e a latência medida |
| **3** | A exclusão estrutural é **mais ampla** do que sinais vitais | O mesmo `pattern` fixado em `laboratory` exclui `survey`/`exam` — ou seja, GCS, RASS, ACVPU e diurese |
| **4** | A ausência de `MedicationAdministration` é uma **ausência nomeada**, não um espaço não inventariado | Bloqueia SOFA-CV e, menos obviamente, **a RULE-GCS inteira** (gate sedativo) — e não tem ordem de serviço |

### 0.5 Vocabulário de motivo (resumido)

| Código | Significa |
|---|---|
| **M-01** | Exclusão estrutural de toda `Observation` não-laboratorial |
| **M-02** | `Observation` laboratorial bloqueada com fonte vazia |
| **M-03** | Caminho de desbloqueio não conforme — e **implementado**, não apenas planejado |
| **M-04** | Nenhum contrato inventariado (ausência, não negativa conhecida) |
| **M-05** | Sem profile `MedicationAdministration` (classe D) |
| **M-06** | Sem latência medida; canal declarado como não near-real-time |
| **M-07** | Sem medição de povoamento |
| **M-08** | Sem ambiente semelhante a produção (só `dev`) |
| **M-09** | Sem pin de terminologia |
| **M-10** | Sem semântica de duplicata/ordem/correção/cancelamento |
| **M-11** | Identidade e tenant decididos, mas sem artefato |
| **M-12** | Sem fonte clínica conceitual (juízo, ato de beira-leito ou ordem) |
| **M-13** | Janela ratificada no lado regra, sem política de frescor da fonte |
| **M-14** | Ambiguidade da spec — insumo exigido pela lógica e não tabelado |

---

## 1. RULE-SOFA 0.2.0 — 21 linhas

**Regra de composição (SOURCE, spec §5.2):** o total 0–24 é emitido **somente** com os
seis componentes legíveis. Não existe SOFA parcial genérico. Portanto todo insumo
obrigatório de componente é, na prática, obrigatório para o total.

### 1.1 Os 14 insumos tabelados na spec §3.1

| # | Insumo | Classe | Código declarado (candidato) | Unidade canônica | Janela ratificada | Fonte AMH | Motivo dominante |
|---|---|---|---|---|---|---|---|
| SOFA-01 | Idade | demográfico | 30525-0 | `a` | constante do encontro | **Patient declarado (camada 1)** | M-07 |
| SOFA-02 | PaO2 arterial | laboratório | 2703-7 | `mm[Hg]` (kPa ×7,50062) | 24 h / 48 h | laboratorial **bloqueada, fonte vazia** | M-02 + M-03 |
| SOFA-03 | FiO2 | dispositivo | 3150-0, 19994-3 | fração (percentual ÷100) | pareada 30 min ao PaO2 | **nenhuma** | M-04 + M-01 |
| SOFA-04 | Suporte respiratório | dispositivo/registro | **nenhum — a spec declara VALIDATION REQUIRED** | conceito codificado | pareada 1 h ao PaO2 | **nenhuma** | M-04 + M-09 |
| SOFA-05 | Plaquetas | laboratório | 777-3, 26515-7 | `10*3/uL` | 24 h / 48 h | laboratorial **bloqueada** | M-02 + M-03 |
| SOFA-06 | Bilirrubina total | laboratório | 1975-2, 14631-6 | `mg/dL` (µmol/L ÷17,104) | 24 h / 48 h | laboratorial **bloqueada** | M-02 + M-03 |
| SOFA-07 | PAM | **sinal vital** | 8478-0 | `mm[Hg]` | 4 h / 8 h | **excluída estruturalmente** | M-01 |
| SOFA-08 | Identidade do vasoativo | administração | ATC candidatos; pin RxNorm VALIDATION REQUIRED | conceito codificado | ativa em T | **sem profile de administração** | M-05 |
| SOFA-09 | Taxa de dose do vasoativo | administração | **nenhum — atributo de administração** | `ug/kg/min` | ativa ≥60 min; confirmação ≤2 h; expiração 4 h | **sem profile de administração** | M-05 |
| SOFA-10 | Peso corporal | sinal vital | 29463-7 | `kg` | 7 d / 14 d | **excluída estruturalmente** | M-01 |
| SOFA-11 | GCS total (E/V/M) | beira-leito | 9269-2 (9267-6, 9270-0, 9268-4) | escore adimensional | 12 h / 24 h | **excluída estruturalmente** | M-01 + M-12 |
| SOFA-12 | RASS (gate) | beira-leito | **nenhum — a spec declara VALIDATION REQUIRED** | ordinal −5..+4 | pareada 1 h à GCS | **excluída estruturalmente** | M-01 + M-12 |
| SOFA-13 | Creatinina | laboratório | 2160-0, 14682-9 | `mg/dL` (µmol/L ÷88,42) | 24 h / 48 h | laboratorial **bloqueada** | M-02 + M-03 |
| SOFA-14 | Diurese por intervalo | registro de enfermagem | 9187-6, 3167-4 | mL sobre intervalo de 24 h | intervalo terminando ≤4 h antes de T | **excluída estruturalmente** | M-01 + M-12 |

### 1.2 Os 7 insumos que a lógica decidida exige e a spec não tabela

Esta é a contribuição desta matriz que não existe em nenhum outro documento. As decisões
de GDEC-0007 criaram exigências de dado que a tabela §3.1 não acompanhou. **Nada disso é
resolvido aqui** — é transcrito como lacuna (motivo M-14) para o autor da spec e o revisor
clínico.

> **Verificação cruzada com `logic.yaml` (OBSERVADO 2026-08-15).** O bloco `inputs:` do
> artefato legível por máquina da regra contém **exatamente as mesmas 14 entradas** da
> tabela §3.1, com os mesmos códigos candidatos, unidades e janelas — nenhuma divergência,
> nenhuma linha desta matriz precisou de correção. E os carve-outs decididos aparecem lá
> num bloco **separado** (`carve_outs_decided:`), fora de `inputs:`, sem chave de insumo,
> sem código, sem unidade e sem janela. **A ambiguidade abaixo está nos dois artefatos da
> spec, não é efeito de leitura da prosa.**

| # | Insumo exigido | Exigido por | O que falta na spec |
|---|---|---|---|
| SOFA-D1 | Estado de terapia substitutiva renal | §1.3.3 — marcação obrigatória "em TSR" | sem código, unidade, janela; **e sem comportamento declarado quando o estado é desconhecido** |
| SOFA-D2 | Estado de ECMO | §1.3.4 — respiratório `not_evaluated` | idem; **desconhecido é fail-closed ou fail-open? a spec não diz** |
| SOFA-D3 | Ordem de limitação terapêutica | §1.3.1 — supressão de escalonamento (controle de HAZ-0044) | não é medida, é **ordem**: exige contrato de ordem clínica que ninguém inventariou |
| SOFA-D4 | Disfunção orgânica crônica documentada | §1.3.2 — anotação obrigatória | sem vínculo declarado a `Condition`; sem definição de que condições contam |
| SOFA-D5 | Exposição sedativa | §4.5 — gate fail-closed | exige distinguir **ativa × desconhecida × ausência documentada** (três estados, três consequências) |
| SOFA-D6 | PAS e PAD | §4.4 — fallback de PAM derivada | **a spec do SOFA não declara código para PAS nem PAD**; sem faixa plausível, sem janela, sem regra de pareamento entre as duas |
| SOFA-D7 | Concentração e taxa volumétrica | §3.1 linha 9 — conversão de dose | a própria spec declara a política de conversão VALIDATION REQUIRED |

### 1.3 Síntese honesta — RULE-SOFA

- **Insumos com fonte evidenciada: 0 de 21.**
- **Componentes computáveis a partir de fonte evidenciada: 0 de 6.**
- Quatro insumos (SOFA-02, 05, 06, 13) têm profile declarado e **conforme** — e fonte
  vazia. Dois (SOFA-01 e, indiretamente, SOFA-D4) apoiam-se no corpus de contexto, que é
  a metade afirmativa do achado de compatibilidade e continua **não medido**.
- O componente cardiovascular depende inteiramente da **classe D** (administração de
  medicamentos), que não tem profile, não tem ordem de serviço e não está no caminho
  crítico.
- **O que a decisão C-1 mudaria:** no escopo estreito ("só sinais vitais"), entrega uma
  fonte *candidata* para PAM e peso — dois insumos de um componente que ainda depende de
  dose vasoativa. No escopo amplo ("toda `Observation` não-laboratorial"), acrescenta GCS,
  RASS e diurese. **Em nenhum dos dois cenários o SOFA fica computável**, porque falta
  laboratório (OS-20) e falta administração de medicamento (sem ordem de serviço).
- **O que OS-20 mudaria:** com o caminho **estruturado** entregue e conforme (LOINC +
  `valueQuantity` UCUM), quatro insumos laboratoriais passariam a ter fonte *candidata*.
  Atenção: "Observation desbloqueada" **não significa** valor numérico codificado com
  unidade — o caminho implementado hoje emitiria texto livre, e nenhuma regra de limiar
  consome texto livre.
- **O que a lacuna de `MedicationAdministration` mudaria:** é a única das três que
  bloqueia **dois componentes** (cardiovascular via dose, neurológico via gate sedativo) e
  a única sem dono, sem ordem e sem pergunta aberta.

---

## 2. RULE-NEWS2 0.2.0 — 13 linhas

**Regra de composição (SOURCE, spec §5.1/§5.2):** o total computa **somente** com os sete
parâmetros válidos e na janela. `partial` é **permanentemente inalcançável** (decisão
N-8). **6 de 7 é `not_evaluated`, não um escore menor.**

### 2.1 Os 8 insumos tabelados na spec §2.1

| # | Insumo | Classe | Código declarado (candidato) | Unidade | Janela / expiração | Fonte AMH | Motivo dominante |
|---|---|---|---|---|---|---|---|
| NEWS2-01 | Frequência respiratória | sinal vital | 9279-1 | `/min` | 1 h / 8 h | **excluída estruturalmente** | M-01 |
| NEWS2-02 | SpO2 | sinal vital | 59408-5 (2708-6 alternativa; vínculo ao arquiteto) | percentual | 1 h / 8 h | **excluída estruturalmente** | M-01 + M-09 |
| NEWS2-03 | Estado de O2 suplementar | terapia/registro | derivado de 3151-8 ou dispositivo documentado; VALIDATION REQUIRED | booleano | 4 h / 24 h | **nenhuma — e não vem de monitor** | M-04 + M-12 |
| NEWS2-04 | PA sistólica | sinal vital | 8480-6 | `mm[Hg]` | 1 h / 8 h | **excluída estruturalmente** | M-01 |
| NEWS2-05 | Pulso | sinal vital | 8867-4 | `/min` | 1 h / 8 h | **excluída estruturalmente** | M-01 |
| NEWS2-06 | Consciência ACVPU | beira-leito | 67775-7 — **a answer list não tem conceito para nova confusão** | token de conjunto fechado | 4 h / 24 h | **excluída estruturalmente** | M-01 + M-12 + M-09 |
| NEWS2-07 | Temperatura | sinal vital | 8310-5 | `Cel` | 4 h / 24 h | **excluída estruturalmente** | M-01 |
| NEWS2-G | Atribuição de escala de SpO2 | **ordem/flag, não `Observation`** | nenhum (a spec o diz explicitamente) | enum + proveniência | persistente no encontro; reconfirmação a cada 7 d, não bloqueante | **nenhuma — exige contrato de ORDEM** | M-04 + M-12 |

### 2.2 Os 5 insumos derivados

| # | Insumo | Exigido por | Observação |
|---|---|---|---|
| NEWS2-D1 | Idade verificada | gate §1.2 | **a spec da NEWS2 não declara código para idade**; SOFA e GCS declaram 30525-0 |
| NEWS2-D2 | Documentação de gravidez | gate §1.2 | a própria spec declara: nenhuma fonte confiável de gravidez é evidenciada |
| NEWS2-D3 | Ordem de limitação terapêutica | §1.2/§4.2 | mesma ausência de SOFA-D3 |
| NEWS2-D4 | Estado de sedação (anotação obrigatória no ACVPU) | nota de §2.1 | **assimetria entre as regras** — ver §2.3 |
| NEWS2-D5 | Lesão medular documentada | §1.2 | **único insumo OPCIONAL de toda a matriz**: sua ausência não bloqueia, apenas suprime uma cautela publicada |

### 2.3 Síntese honesta — RULE-NEWS2

- **Insumos com fonte evidenciada: 0 de 13.** E a regra exige **7 de 7**.
- **A leitura mais importante desta seção:** cinco dos sete parâmetros pontuados (FR,
  SpO2, PAS, pulso, temperatura) são sinais vitais e viriam de monitor. **Dois não vêm de
  monitor**: estado de O2 suplementar (NEWS2-03) e consciência ACVPU (NEWS2-06). Uma
  decisão de C-1 que entregue sinais vitais e **não** entregue esses dois deixa a regra
  exatamente onde está: `not_evaluated`, permanentemente. *5 de 7 não é 71% do NEWS2; é
  zero NEWS2.*
- **NEWS2-G não é alcançado nem pela leitura mais ampla de C-1**: não é `Observation`, é
  uma **ordem clínica atribuível**, e não existe contrato de ordem em lugar nenhum. O
  default escala 1 é seguro e vem da fonte publicada — mas um sistema que nunca recebe
  ordem de escala 2 pontua pacientes hipercápnicos na escala errada sem que ninguém
  perceba. Risco a registrar; não é decisão desta matriz.
- **Assimetria de sedação entre as três regras, transcrita e não resolvida:** RULE-GCS e
  RULE-SOFA adotam gate **fail-closed** explícito (estado desconhecido → `not_evaluated`);
  RULE-NEWS2 adota **anotação obrigatória** e não declara regra para estado desconhecido.
  Se isso é deliberado (direção de erro aceitável: mais alarme) ou lacuna de redação é
  matéria do revisor clínico e do ADR-0028.
- **O que a decisão C-1 mudaria:** escopo estreito → 5 de 7 insumos com fonte candidata,
  regra continua `not_evaluated`. Escopo amplo → 6 de 7 (acrescenta ACVPU); o estado de O2
  ainda depende de um caminho de registro/terapia que **nenhuma opção do pacote entrega
  por si**. Mais NEWS2-G, que nenhuma delas alcança.
- **O que OS-20 mudaria:** nada. Nenhum parâmetro do NEWS2 é laboratorial.
- **O que a lacuna de `MedicationAdministration` mudaria:** afeta NEWS2-D4 (anotação de
  sedação), não os parâmetros pontuados.

---

## 3. RULE-GCS 0.2.0 — 10 linhas

**Regra de composição (SOURCE, spec §3.5/§6.1):** total 3–15 **somente** com os três
componentes testados (inteiros), na janela, contemporâneos entre si (30 min), com gate
populacional e gate sedativo permitindo. **Qualquer componente NT → nenhum total.**

### 3.1 Os 7 insumos tabelados na spec §5.1

| # | Insumo | Classe | Código declarado (candidato) | Unidade | Janela | Fonte AMH | Motivo dominante |
|---|---|---|---|---|---|---|---|
| GCS-01 | Idade | demográfico | 30525-0 | `a` | constante do encontro | **Patient declarado (camada 1)** | M-07 |
| GCS-02 | Componente ocular (E) | beira-leito | 9267-6 | escore, 1–4 **ou NT** | 12 h / 24 h + 30 min mútuos | **excluída estruturalmente** | M-01 + M-12 |
| GCS-03 | Componente verbal (V) | beira-leito | 9270-0 | escore, 1–5 **ou NT** | 12 h / 24 h + 30 min mútuos | **excluída estruturalmente** | M-01 + M-12 |
| GCS-04 | Componente motor (M) | beira-leito | 9268-4 | escore, 1–6 **ou NT** | 12 h / 24 h + 30 min mútuos | **excluída estruturalmente** | M-01 + M-12 |
| GCS-05 | Total fornecido pela fonte | beira-leito | 9269-2 | escore, 3–15 | 12 h / 24 h | **excluída estruturalmente** | M-01 |
| GCS-06 | RASS (gate) | beira-leito | **nenhum pinado** (a spec observa que a answer list LL6536-8 existe; o pin é do arquiteto) | ordinal −5..+4 | pareada 1 h à GCS | **excluída estruturalmente** | M-01 + M-09 |
| GCS-07 | Estado de infusão sedativa | administração | **nenhum vínculo pinado** | conceito codificado, 4 estados | contemporâneo à avaliação | **sem profile de administração** | M-05 |

### 3.2 Os 3 insumos derivados

| # | Insumo | Exigido por | Observação |
|---|---|---|---|
| GCS-D1 | Motivo NT por componente | §3.3 — vocabulário governado fechado | **o requisito de fonte mais exigente da matriz** — ver §3.3 abaixo |
| GCS-D2 | Bloqueio neuromuscular ativo | §3.3 (decisão OQ-GCS-4) | bloqueio ativo → os **três** componentes NT; sem código, sem janela, **sem regra para estado desconhecido** |
| GCS-D3 | Ordem de limitação terapêutica | §1.3.1 | **divergência entre as três specs**: decidido em SOFA e NEWS2, **sinalizado** (não decidido) na GCS |

### 3.3 Síntese honesta — RULE-GCS

- **Insumos com fonte evidenciada: 0 de 10.**
- **O achado mais importante desta seção, e o menos óbvio:** a RULE-GCS é bloqueada pela
  **classe D** (administração de medicamentos) tanto quanto pela classe B (beira-leito).
  O gate sedativo é **fail-closed**: sem estado de exposição sedativa, o total é
  `not_evaluated` — **mesmo com E, V e M perfeitamente povoados**. Uma decisão de C-1 em
  escopo amplo desbloquearia os componentes e ainda assim não produziria um total.
- **GCS-D1 é um requisito estrutural sobre a fonte, não de povoamento.** A fonte precisa
  distinguir três estados: *testado sem resposta* (valor 1), *não testável com motivo*
  (token NT) e *ausente*. Quase todo sistema de registro colapsa os três em um número ou
  em um vazio. **Corrigir o profile da AMH não cria essa estrutura** — e o defeito legado
  central desta família foi exatamente coagir componente não testado ao mínimo.
- **GCS-05 tem uma consequência de contrato declarada honestamente pela própria spec:**
  fontes que só produzem o total (o padrão legado) são **inutilizáveis** até fornecerem
  componentes. Um feed futuro que carregue apenas o total **não desbloqueia a regra**.
  Isso precisa entrar na especificação de qualquer fonte futura — hoje não está em
  nenhuma.
- **O que a decisão C-1 mudaria:** escopo estreito → **nada**. Escopo amplo → E, V, M,
  RASS e total passam a ter fonte *candidata*; o gate sedativo (GCS-07) continua
  bloqueado, e com ele a regra inteira.
- **O que OS-20 mudaria:** nada. Nenhum insumo da GCS é laboratorial.
- **O que a lacuna de `MedicationAdministration` mudaria:** é o que separa "componentes
  disponíveis" de "regra utilizável".

---

## 4. Contagem consolidada

| Regra | Linhas | Tabeladas | Derivadas | Com fonte evidenciada | Elegíveis hoje |
|---|---:|---:|---:|---:|---:|
| Contexto (§7.2) | 3 | — | 3 | **0** | **0** |
| RULE-SOFA 0.2.0 | 21 | 14 | 7 | **0** | **0** |
| RULE-NEWS2 0.2.0 | 13 | 8 | 5 | **0** | **0** |
| RULE-GCS 0.2.0 | 10 | 7 | 3 | **0** | **0** |
| **Total** | **47** | **29** | **18** | **0** | **0** |

Por requisito do §7.2, atendidos hoje em qualquer linha:

| Requisito do §7.2 | Linhas que o atendem |
|---|---:|
| Fonte autoritativa com contrato AMH | **0** (6 linhas têm contrato **declarado**; declarado não é fonte apta) |
| Código clínico pinado | **0** |
| Unidade com política de conversão acordada com a fonte | **0** |
| Vínculo paciente/encontro garantido | **0** (`Observation.encounter` é **opcional** no único profile declarado) |
| Semântica de timestamp acordada | **0** |
| Política de frescor **da fonte** | **0** (janelas do lado regra: **47 de 47** ratificadas) |
| Comportamento de correção/cancelamento | **0** |
| Medição de povoamento representativa | **0** |

**A linha do meio é a mais importante:** o lado da regra está feito. As 47 janelas de
frescor estão ratificadas, os comportamentos de ausência estão decididos, o vocabulário de
status está definido. **A totalidade do bloqueio está do lado da fonte.**

---

## 5. Onde as três decisões pendentes efetivamente tocam

| Decisão pendente | SOFA | NEWS2 | GCS | O que ela **não** resolve |
|---|---|---|---|---|
| **C-1, escopo estreito** (só sinais vitais) | PAM, peso — 2 de 21 | 5 de 13 | **nada** | ACVPU, O2, GCS, RASS, diurese, laboratório, dose, ordens |
| **C-1, escopo amplo** (toda `Observation` não-laboratorial) | + GCS, RASS, diurese — 5 de 21 | 6 de 13 (falta O2 e a ordem de escala) | E, V, M, RASS, total — 5 de 10 | gate sedativo, laboratório, dose, ordens clínicas |
| **OS-20** (laboratório estruturado) | 4 de 21 | **nada** | **nada** | tudo o mais; e exige o caminho **estruturado**, não o de texto livre |
| **`MedicationAdministration`** (sem ordem de serviço) | dose vasoativa + gate sedativo | anotação de sedação | **o gate que trava a regra inteira** | nada dos vitais, nada do laboratório |

**As três juntas, no melhor cenário, não produzem uma via acionável.** Isto não é
pessimismo: os portões de programa (uso pretendido aprovado, dono clínico nomeado, fluxo
observado, linha de base, vigilância financiada) falham para todos os candidatos por
razões que **nenhum insumo conserta**.

---

## 6. O que esta matriz não faz

Não admite via alguma a portfólio. Não classifica candidato. Não decide mapeamento
terminológico nem propõe pin. Não cria nenhum registro DECIDED. Não altera as
especificações de regra, o inventário de candidatos, a avaliação de portões, os ADRs nem
qualquer registro de governança. Não afirma, em lugar nenhum, que algum insumo exista
povoado na AMH — e não poderia, porque nenhuma evidência de camada 3 existe e nenhuma
poderia existir sem acesso a ambiente.

Não contém limiar, banda, ponto de corte ou peso clínico. Não contém PHI, credencial,
CPF ou identificador real.

---

## 7. Referências cruzadas

- [`matrix.yaml`](./matrix.yaml) — a matriz normativa, legível por máquina.
- [`lacunas-e-proximas-evidencias.md`](./lacunas-e-proximas-evidencias.md) — por lacuna,
  qual evidência a fecharia e quem teria de agir.
- `docs/05-clinical-safety/rule-releases/{sofa,news2,gcs}/specification.md` — as
  especificações (working tree não commitado, 0.2.0 em revisão), fonte de todo código,
  unidade, janela e comportamento de ausência transcrito aqui.
- `docs/08-interoperability/amh-data/vital-signs-decision/` — o pacote de decisão C-1 e o
  impacto por candidato.
- `docs/08-interoperability/amh-data/{four-layer-dossier,compatibility-finding,contracts.lock.draft.yaml}`
  — a evidência por camada.
- `docs/05-clinical-safety/pathway-portfolio/pathway-to-source-matrix.{md,yaml}` — a matriz
  por candidato de portfólio (**referenciada, não alterada**; prevalece quanto a
  portfólio).

---

*Preparado pelo arquiteto de compatibilidade AMH-dados em 2026-08-15. As especificações de
regra e os documentos de portfólio foram lidos e referenciados, nunca alterados. Nada foi
escrito no repositório AMH; nenhum ambiente foi acessado; nenhuma credencial usada. Nenhuma
decisão foi tomada e nenhuma contradição foi adjudicada.*
