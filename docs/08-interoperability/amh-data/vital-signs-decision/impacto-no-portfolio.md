---
doc_id: AMH-C1-PORTFOLIO-IMPACT
title: Impacto das opções O1–O4 de C-1 sobre o portfólio de vias candidatas
status: PROPOSAL
label: PROPOSAL
owner: UNASSIGNED — VALIDATION REQUIRED
decisor_designado: rodaquino-OMNI
source: >
  Companheiro de ./pacote-decisao-c1-sinais-vitais.md;
  docs/05-clinical-safety/pathway-portfolio/{candidate-inventory.md §8, hard-gate-assessment.md §2.4/§7.5,
  pathway-to-source-matrix.yaml} (REFERENCIADOS, NÃO ALTERADOS);
  Omni-Saude/amh-data-platform @ 0a07a6f1fab36fb2f5eeee0fcd8e945c95f67116 (leitura somente leitura)
date_collected: 2026-08-15
collector: engenheiro de contrato de sinais clínicos AMH
last_updated: 2026-08-15
provenance:
  source_repo: intensicare-V2
  path_or_url: docs/08-interoperability/amh-data/vital-signs-decision/impacto-no-portfolio.md
  commit_sha_or_version: working tree em 0c36f03 (não commitado)
  section_or_lines: documento inteiro
  date_collected: 2026-08-15
  collector: engenheiro de contrato de sinais clínicos AMH
  transformation: >
    Classes de insumo por candidato derivadas do candidate-inventory (§§2, 8.2-8.4) e das
    especificações de rule-release; cruzadas com as opções O1-O4 do pacote de decisão.
    Nenhum limiar, banda ou conteúdo clínico foi lido, copiado ou reproduzido.
  confidence: medium
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  requirements: []
  hazards: []
  adrs: [ADR-0001]
  tests: []
  pr: null
supersedes: null
superseded_by: null
---

# Impacto das opções O1–O4 sobre o portfólio

Companheiro de [`pacote-decisao-c1-sinais-vitais.md`](./pacote-decisao-c1-sinais-vitais.md).
Responde a uma pergunta só: **para cada candidato do inventário, o que cada opção de C-1
muda no portão 4 (elegibilidade de insumos)?**

---

## 0. Como ler

### 0.1 O inventário não foi alterado

`docs/05-clinical-safety/pathway-portfolio/candidate-inventory.md`,
`hard-gate-assessment.md` e `pathway-to-source-matrix.yaml` são **referenciados, não
editados**. Nenhum veredito, classificação ou ID deste documento substitui os deles. Onde
houver divergência, **prevalecem os documentos do portfólio**.

### 0.2 Vocabulário de efeito — e o que ele deliberadamente não contém

| Efeito | Significado |
|---|---|
| **SEM EFEITO** | A opção não altera nenhuma classe de insumo ausente deste candidato. |
| **PARCIAL** | A opção supre parte das classes ausentes; o candidato **continua FAIL no portão 4**. |
| **INSUMOS COMPLETÁVEIS** | **Todas** as classes de insumo passariam a ter uma fonte candidata. Ainda **não** é PASS: o portão 4 exige semântica, unidade, tempo, identidade, encontro, proveniência, política de qualidade **e medição de população representativa** (`PROMPT:415`) — nada disso é entregue por uma decisão. |

**Não existe a categoria "PASS" neste documento.** Nenhuma opção, sozinha ou combinada com
todas as outras, faz qualquer candidato passar em qualquer portão. **FONTE (V2)** —
`hard-gate-assessment.md` §7.7: os portões **1, 2, 5, 9, 10 e 11 falham para todos os 20
candidatos** por razões de programa (sem uso pretendido aprovado, sem dono clínico
nomeado, sem fluxo observado, sem linha de base, sem vigilância financiada). **Nenhum
insumo conserta isso.**

### 0.3 Escopo estreito × escopo amplo (face D-c)

Todas as opções são avaliadas em duas leituras, porque a diferença é grande:

- **estreito** — a decisão cobre apenas `category = vital-signs`;
- **amplo** — cobre **toda `Observation` não-laboratorial**, incluindo avaliações de
  beira-leito (GCS, RASS, ACVPU, CAM-ICU, BPS) e registro de enfermagem (diurese).

**OBSERVADO** (pacote §2.2, `Observation-amh-laboratory-profile.json@0a07a6f1`): é o mesmo
`patternCodeableConcept` fixado em `laboratory` que bloqueia as duas leituras. A diferença
não está na natureza do defeito — está no escopo da correção.

---

## 1. As cinco classes de insumo ausentes

**INFERÊNCIA** (das tabelas de insumo em `rule-releases/{news2,sofa,gcs}/specification.md`
§§2.1/3.1/5.1, do `candidate-inventory.md` §§8.2–8.4 e da leitura pinada do commit
`0a07a6f1`). Todo bloqueio de portão 4 no inventário reduz-se a uma destas cinco:

| Classe | Situação na AMH (commit pinado) | Quem a desbloquearia |
|---|---|---|
| **A — Sinais vitais** (FR, SpO2, PA/PAM, FC, temperatura, peso) | Sem profile capaz; nenhuma fonte nomeada no repositório | **Esta decisão** (O1/O2/O3) |
| **B — Avaliações de beira-leito e registro de enfermagem** (GCS E/V/M, RASS, ACVPU, CAM-ICU, BPS, diurese) | Excluídas pelo mesmo `pattern` `laboratory` | **Esta decisão, apenas no escopo amplo** |
| **C — Laboratório estruturado** (plaquetas, bilirrubina, creatinina, gasometria, lactato, PCT, eletrólitos) | `Observation` bloqueada; fonte com 0 linhas; caminho de texto livre **implementado** (pacote §2.4) | **OS-20** |
| **D — Administração de medicamentos** (identidade e **taxa de dose** de vasoativo, sedativo, antimicrobiano, haloperidol) | **OBSERVADO:** não há profile `MedicationAdministration` entre os 21 JSON de nível superior de `schemas/fhir-profiles/@0a07a6f1`. Existem `Medication`, `MedicationRequest` e `MedicationDispense` — **dispensação não é administração titulada** | **Nenhuma ordem de serviço existente** |
| **E — Dispositivo/ventilador** (FiO2, PEEP, estado de suporte respiratório, RSBI, NIF) | Nenhum artefato de ingestão de dispositivo na árvore (pacote §2.6) | O2/O3, **se o escopo do ingresso incluir ventiladores** |

> **Achado a sinalizar, não a decidir.** A **classe D** bloqueia cinco a seis candidatos e
> **não tem nenhuma ordem de serviço, nenhuma pergunta aberta e nenhum item de caminho
> crítico associado**. Ela tem a mesma forma da C-1: um recurso FHIR que o consumidor
> precisa e para o qual a IG não tem profile. Registrado aqui para que a ausência não seja
> lida como afirmação; endereçá-la é ato do orquestrador, não deste especialista.

---

## 2. Efeito por candidato

Legenda de classes: **A** vitais · **B** beira-leito/enfermagem · **C** laboratório ·
**D** administração de medicamentos · **E** dispositivo/ventilador.
Todos os candidatos partem de **portão 4 = FAIL** (`hard-gate-assessment.md` §2.4, §7.5).

| CAND | Via | Classes ausentes | **O1** estreito | **O1** amplo | **O2** (dispositivos V2) | **O3** (híbrido) | **O4** (diferir) |
|---|---|---|---|---|---|---|---|
| **0001** | NEWS2 | A, B | **PARCIAL** — 5 de 7 insumos; ACVPU e estado de O2 continuam sem fonte → segue `not_evaluated` | **INSUMOS COMPLETÁVEIS** *se* a fonte povoada cobrir os 7 | **PARCIAL** sem caminho de registro (monitor dá 5 de 7); **COMPLETÁVEIS** com ele (QD-9) | como O2 no curto prazo; como O1-amplo no médio | **SEM EFEITO** |
| **0002** | MEWS | A, B | **PARCIAL** — 4 de 5 | **INSUMOS COMPLETÁVEIS** | idem 0001 | idem 0001 | **SEM EFEITO** |
| **0003** | SOFA | A, B, C, D, E | **PARCIAL** — só PAM e peso | **PARCIAL** — soma GCS/RASS | **PARCIAL** — soma FiO2/suporte se ventiladores no escopo | **PARCIAL** | **SEM EFEITO** |
| **0004** | qSOFA | A, B **+ gate de suspeita de infecção (sem fonte de nenhum tipo)** | PARCIAL | PARCIAL — os 3 componentes teriam fonte, **o gate não** | idem | idem | **SEM EFEITO** |
| **0005** | ventilador (REJECT proposto) | C, E | **SEM EFEITO** | SEM EFEITO | **PARCIAL** se ventiladores no escopo | PARCIAL | SEM EFEITO |
| **0006** | placeholder quitado | — | n/a — entrada descarregada (`candidate-inventory.md` §8.3); não contar | n/a | n/a | n/a | n/a |
| **0007** | catálogo de 959 regras | **desconhecidas** | **SEM EFEITO** — não há mapeamento insumo→fonte por regra; segue UNKNOWN | idem | idem | idem | idem |
| **0008** | alertas por limiar de escore | herda 0001–0004 **+** contrato de status de avaliação (ADR-0008, `proposed`) | herda | herda | herda | herda | **SEM EFEITO** |
| **0009** | grade de leitos (REJECT proposto) | herda tudo **+** leito/unidade | **SEM EFEITO** como via. *Nota:* leito/unidade é a única classe com fonte AMH declarada — OBSERVADO no diagrama de fluxo: `INTERNACAO → Encounter (inpatient), location com leito/unidade` (camada 1 apenas) | idem | idem | idem | idem |
| **0010** | sepse | A, B, C, D | PARCIAL | PARCIAL | PARCIAL | PARCIAL | SEM EFEITO |
| **0011** | desmame | B, E | **SEM EFEITO** | **PARCIAL** (Glasgow) | **PARCIAL** (mecânica ventilatória) | PARCIAL | SEM EFEITO |
| **0012** | nutrição enteral | B (registro nutricional) | **SEM EFEITO** | **PARCIAL** | PARCIAL se registro no escopo | PARCIAL | SEM EFEITO |
| **0013** | estabilidade hemodinâmica | A, C, D | **PARCIAL** (PAM, FC) | PARCIAL | PARCIAL | PARCIAL | SEM EFEITO |
| **0014** | sedação | B, D | **SEM EFEITO** | **PARCIAL** (RASS, BPS) | PARCIAL | PARCIAL | SEM EFEITO |
| **0015** | profilaxia | B, D | **SEM EFEITO** | PARCIAL | PARCIAL | PARCIAL | SEM EFEITO |
| **0016** | antimicrobiano | C, D | **SEM EFEITO** | **SEM EFEITO** | **SEM EFEITO** | **SEM EFEITO** | SEM EFEITO |
| **0017** | equilíbrio hidroeletrolítico | **C apenas** | **SEM EFEITO** | **SEM EFEITO** | **SEM EFEITO** | **SEM EFEITO** | SEM EFEITO — depende **só de OS-20** |
| **0018** | função renal / AKI | B (diurese), C (creatinina) | **SEM EFEITO** | **PARCIAL** (diurese) | PARCIAL | PARCIAL | SEM EFEITO |
| **0019** | delirium | B, D | **SEM EFEITO** | **PARCIAL** (CAM-ICU, RASS) | PARCIAL | PARCIAL | SEM EFEITO |
| **0020** | insuficiência respiratória | A, C, E | **PARCIAL** (SpO2, FR) | PARCIAL | **PARCIAL** (soma FiO2 se ventiladores no escopo) | PARCIAL | SEM EFEITO |

---

## 3. A contagem honesta

**INFERÊNCIA**, das linhas acima. Considere-se o cenário **mais favorável** que este pacote
de decisão consegue produzir: **escopo amplo (D-c), opção O3 executada e OS-20 entregue
conforme** — isto é, vitais **e** beira-leito **e** laboratório estruturado, todos com
fonte.

| Situação de insumos | Candidatos |
|---|---|
| **INSUMOS COMPLETÁVEIS** | **CAND-0001 (NEWS2)**, **CAND-0002 (MEWS)**, **CAND-0017 (equilíbrio)**, **CAND-0018 (renal/AKI)** |
| Continuam **PARCIAIS**, bloqueados pela **classe D** (administração de medicamentos, sem profile e sem ordem de serviço) | 0003 SOFA, 0010 sepse, 0013 estabilidade, 0014 sedação, 0015 profilaxia, 0016 antimicrobiano, 0019 delirium |
| Continuam **PARCIAIS**, bloqueados pela **classe E** (ventilador) | 0005, 0011, 0020 |
| Continuam bloqueados por **ausência de sinal específico** | 0004 qSOFA (suspeita de infecção) |
| **UNKNOWN**, inalterado | 0007 (959 regras) |
| Herdados / não-vias | 0006 (descarregado), 0008 (herda), 0009 (REJECT proposto como via) |

**Quatro de dezesseis candidatos avaliáveis** teriam todas as classes de insumo com fonte,
no melhor cenário deste pacote. E as quatro ressalvas que fazem essa contagem não ser boa
notícia:

1. **`INSUMOS COMPLETÁVEIS` não é elegibilidade.** O portão 4 exige medição em dado real —
   população, nulos, cobertura por tenant, taxas de conformidade de código e unidade,
   vínculo com encontro, distribuição de latência. Nada disso existe, e nada disso é
   verificável enquanto só `dev` estiver provisionado.
2. **CAND-0002 (MEWS) provavelmente não deve ser desbloqueado.** `candidate-inventory.md`
   §8.3 registra a proposta de **SUPERSEDE por NEWS2**, e §3 marca a sobreposição
   NEWS2×MEWS como *very high*. Desbloquear os dois é, deliberadamente, uma superfície
   duplicada de alerta.
3. **CAND-0017 não depende desta decisão.** É o único candidato cujo bloqueio de insumo é
   **puramente laboratorial** — quem o entrega é **OS-20**, não C-1. Ele estaria na mesma
   posição sob **O4**.
4. **Os portões 1, 2, 5, 9, 10 e 11 continuam FAIL para os quatro.** A contagem de vias
   **acionáveis** permanece **zero** em todos os cenários deste documento.

---

## 4. As três leituras que mais importam para a decisão

**INFERÊNCIA:**

1. **C-1 na acepção estreita compra pouco.** Só CAND-0001 e CAND-0002 têm sinais vitais
   como classe dominante — e nenhum dos dois computa sem a classe B (ACVPU). **A face D-c
   não é formalidade: no escopo estreito, o resultado do investimento é zero candidato com
   insumos completáveis.**
2. **A classe D é a segunda C-1, e ninguém a nomeou ainda.** Sete candidatos param nela;
   ela não tem profile, não tem ordem de serviço, não tem pergunta aberta e não está no
   caminho crítico. Se o portfólio-alvo incluir SOFA, sepse, sedação, delirium,
   antimicrobiano ou profilaxia, **a classe D precisa da mesma sessão de decisão que C-1**.
3. **O4 não é neutra em relação ao portfólio — é neutra em relação a tudo.** Nenhuma linha
   da tabela de §2 muda sob O4. O único candidato que poderia avançar sob O4 (CAND-0017)
   avança por OS-20, que também não tem data.

---

## 5. Limites deste documento

- As **classes de insumo por candidato** foram derivadas do inventário e das especificações
  de rule-release, **não** de leitura de conteúdo clínico legado. **Nenhum limiar, banda,
  ponto de corte ou peso aparece aqui**, e nenhum foi lido para produzi-lo.
- Para CAND-0010..0020, as classes vêm das descrições de uma linha de
  `candidate-inventory.md` §8.2/§8.4. O detalhe campo a campo está nos registros de
  revisão citados por aquele documento e **não** foi reproduzido. Uma classificação por
  candidato pode mudar quando o mapeamento insumo→fonte por via for feito — o que é
  trabalho de ciclo 2, sinalizado em `hard-gate-assessment.md` §7.5.
- **CAND-0007 permanece UNKNOWN e deve continuar assim.** Rotulá-lo de outra forma sem
  mapeamento por regra seria fabricação.
- Nada aqui é decisão, admissão, aprovação ou classificação de via. Todo veredito de
  portfólio continua sendo **PROPOSAL — AGUARDANDO REVISÃO CLÍNICA NOMEADA (revisor:
  rodaquino-OMNI)**, nos documentos do portfólio, não neste.

---

*Preparado pelo engenheiro de contrato de sinais clínicos AMH em 2026-08-15. Os documentos
do portfólio foram lidos e referenciados, nunca alterados. Nada foi escrito no repositório
AMH. Sem PHI, credenciais, identificadores reais ou conteúdo clínico normativo.*
