---
# ---- Mandatory identity block (ADR-template.md; prompt §10) ----
id: ADR-0028
title: >
  Política de confundimento por sedação e avaliação neurológica — como a
  escoragem dependente de consciência (GCS/SOFA CNS, mentação do qSOFA,
  consciência do NEWS2/MEWS) deve se comportar sob sedação, intubação, e
  componentes não testáveis
status: accepted (2026-08-15, GDEC-0007)   # transcrito per GDEC-0007; o agente é escriba, não decisor
status_history:
  - status: proposed
    date: 2026-08-15
    by: autor da ADR de política de confundimento por sedação/avaliação neurológica (ciclo 1, Tarefa 4)
    note: >
      Redigida a partir da seção obrigatória "INPUT TO ADR" da revisão legada de
      neuro/sedação do ciclo 1 (REV-NS-01 §4), das revisões legadas de SOFA/NEWS2, e
      de evaluation-status-semantics.md. Registra apenas opções e direcionadores;
      NENHUMA decisão. Todas as cláusulas clínicas são
      "PROPOSAL — AGUARDANDO REVISÃO CLÍNICA NOMEADA (revisor: rodaquino-OMNI)".
  - status: accepted (2026-08-15, GDEC-0007)
    date: 2026-08-15
    by: rodaquino-OMNI (revisor clínico nomeado, GDEC-0003) — transcrito pelo orquestrador clínico do ciclo 1 (escriba)
    note: >
      Decisão por escrito, em sessão, do titular nomeado, registrada em
      decision-register.md GDEC-0007 (folha de decisão do ciclo 1, §9, linhas A28-1 a
      A28-8). Option A com gatilho por conjunção-com-exposição, RASS ≤ −3, política
      intervalo-parcial aceita, e sedação desconhecida FAIL-CLOSED (overriding
      qualquer default de escora-com-divulgação, inclusive o rascunho 0.1.0 da spec
      SOFA). Ver §5.0. Bloco de decisão redigido em pt-BR per DEC-G0-10.
date: 2026-08-15
owner: >
  rodaquino-OMNI — titular candidato de AUTH-CLINSAFETY para os artefatos do ciclo 1
  per GDEC-0003 (decision-register.md); titular permanente de AUTH-CLINSAFETY
  UNASSIGNED — VALIDAÇÃO NECESSÁRIA
approvers:                  # IDs de papel; titular candidato nomeado apenas onde uma entrada DECIDED do registro o nomeia
  - AUTH-CLINSAFETY — titular candidato rodaquino-OMNI per GDEC-0003 (escopo ciclo-1); titular permanente UNASSIGNED — VALIDAÇÃO NECESSÁRIA
  - AUTH-INTENDED-USE — cláusulas de escopo populacional (VAL-0006/VAL-0007); titular candidato rodaquino-OMNI per GDEC-0003; titular permanente UNASSIGNED — VALIDAÇÃO NECESSÁRIA
  - AUTH-PRODUCT — linha de ratificação de ADR de decision-rights.md §2; UNASSIGNED — VALIDAÇÃO NECESSÁRIA
decision_deadline: >
  NÃO DEFINIDO — VALIDAÇÃO NECESSÁRIA. Evento forçador (PROPOSAL): Gate G2
  (portfólio de vias) — nenhuma especificação de regra dependente de consciência
  (SOFA CNS, qSOFA, consciência do NEWS2/MEWS) pode sair do estado de rascunho, e
  nenhuma categoria de vetor de referência CRV para insumos neurológicos pode ser
  congelada, até que esta política seja decidida.
deciding_authority_rule: >
  docs/00-governance/decision-rights.md §2, linhas "Ratificação de conteúdo de
  regra clínica" (AUTH-CLINSAFETY — esta política é conteúdo de regra clínica) e
  "Decisões de arquitetura (ratificação de ADR)" (AUTH-PRODUCT + titular de
  domínio relevante). Agentes podem redigir as opções da política e citar
  evidência; agentes NÃO PODEM ratificá-las.
independence_check: >
  decision-rights.md §3 par 1 (o autor da regra deve ser independente do
  aprovador clínico): o agente autor é o autor da regra e não pode aprovar. A
  regra de supersessão (c) do GDEC-0003 vincula adicionalmente o revisor humano:
  se rodaquino-OMNI emendar materialmente o conteúdo da política (em vez de
  revisar conteúdo de autoria de agente), um segundo revisor clínico
  independente é requerido.

# ---- Rastreabilidade (traceability-policy.md §3 regra 3) ----
links:
  drivers:
    domain_invariants: [DOM-0004]
    quality_scenarios: [QAS-0007, QAS-0017]
    risks: ["IDs pendentes no registro de riscos — o risco de perda de disponibilidade do gating fail-closed (§6.2) deveria ser registrado em docs/00-governance/registers/risk-register.md"]
  constrains:
    requirements: ["REQ: catálogo de requisitos pendente"]
    clinical: ["CLR: portfólio de vias pendente (Gate G2); as especificações de regra concorrentes do ciclo 1 docs/05-clinical-safety/rule-releases/sofa/specification.md §4.5 e docs/05-clinical-safety/rule-releases/news2/specification.md (insumo de consciência) são insumos para, e são restringidas por, esta ADR"]
    safety: [SAF-0001, SAF-0002, SAF-0003, SAF-0005, SAF-0006, SAF-0019, SAF-0035]
  hazards: [HAZ-0005, HAZ-0036]
  tests: ["TST: arquitetura de testes pendente"]
  validations: [VAL-0006, VAL-0007, "VAL: backlog de validação pendente (novos itens VAL propostos no §9)"]
  adrs:
    depends_on: [ADR-0008]   # semântica de status de avaliação; completude e frescor de escore/via — sendo redigida concomitantemente no ciclo 1; referenciada de forma cruzada apenas por ID/título, não lida
    feeds: [ADR-0026]        # ADR clínica concorrente do ciclo 1; referenciada de forma cruzada apenas por ID per a diretiva do ciclo 1 (autoria concorrente — a reconciliação de título é tarefa do steward do adr-index)
  gates: [G2]
  evidence:
    - docs/05-clinical-safety/legacy-review/neuro-sedation-scores/REV-NS-01-gcs.md
    - docs/05-clinical-safety/legacy-review/neuro-sedation-scores/REV-NS-02-rass.md
    - docs/05-clinical-safety/legacy-review/neuro-sedation-scores/REV-NS-05-cam-icu.md
    - docs/05-clinical-safety/legacy-review/sepsis-scores/sofa-review.md
    - docs/05-clinical-safety/legacy-review/ews/news2-review.md
    - docs/05-clinical-safety/evaluation-status-semantics.md

# ---- Supersessão (prompt §10) ----
supersedes: null
superseded_by: null

# ---- Proveniência (evidence-notation.md §3) ----
provenance:
  source_repo: intensicare-V2
  path_or_url: docs/06-architecture/adrs/ADR-0028-sedation-and-neuro-assessment-confounding-policy.md
  commit_sha_or_version: ddac9bc (HEAD do repositório no momento da redação; este arquivo e o corpus de revisão do ciclo 1 são artefatos não commitados da working tree)
  section_or_lines: >
    REV-NS-01 §1.2, §1.3, §4 (INPUT TO ADR), §5; REV-NS-02 §1, §3, §4;
    REV-NS-05 §1.1, §3, §4; sofa-review.md §3, §4 (D-11..D-13, D-17), §6;
    news2-review.md §2, §3 (D-7, D-8), §4.3; evaluation-status-semantics.md
    §2, §3, §4; hazard-log.md HAZ-0005, HAZ-0036; decision-register.md GDEC-0003
  date_collected: 2026-08-15
  collector: autor da ADR de política de confundimento por sedação/avaliação neurológica (ciclo 1, Tarefa 4)
  transformation: reasoned-from — opções e direcionadores derivados das revisões e documentos de governança do ciclo 1 citados; duas verificações externas realizadas por este autor são rotuladas OBSERVED no §2.1
  confidence: média
  owner: rodaquino-OMNI — titular candidato de AUTH-CLINSAFETY per GDEC-0003; titular permanente UNASSIGNED — VALIDAÇÃO NECESSÁRIA
  validation_status: VALIDAÇÃO NECESSÁRIA
---

# ADR-0028 — Política de confundimento por sedação e avaliação neurológica

> Traduzido EN→pt-BR em 2026-08-15 (GDEC-0008 item 8, tranche 1); original EN preservado no histórico git (commit 3530295).

> **Status: `accepted (2026-08-15, GDEC-0007)`.** O revisor clínico nomeado
> (rodaquino-OMNI, GDEC-0003) decidiu, por escrito, em sessão de 2026-08-15
> (transcrição-mestre: `decision-register.md` GDEC-0007), **Option A** (fail-closed
> assessability gating) com o gatilho de confundimento por **conjunção-com-exposição**
> (não a disjunção do REV-NS-01 §4), limiar **RASS ≤ −3**, a política intervalo-parcial
> de §4.0.1 **aceita** como única forma de parcial ratificado, e a **sedação
> desconhecida resolvendo FAIL-CLOSED** — ver §5.0 para o registro por questão
> (A28-1 a A28-8). Esta última cláusula **substitui** (overrides) qualquer default de
> "escora-com-divulgação" em qualquer especificação concorrente, inclusive o rascunho
> 0.1.0 da spec SOFA citado em §4 Option A item 3.

---

## 1. Contexto e enunciado do problema

A revisão forense legada do ciclo 1 constatou que a V1 não tinha **nenhuma
representação** para "a consciência deste paciente não pôde ser validamente
avaliada" (SOURCE: REV-NS-01 §4 item 1 — nenhuma designação NT, nenhuma
substituição verbal, nenhum gating de RASS em nenhum lugar da base de código da
V1; o único vestígio é um placeholder comentado `glasgow_intubated_block`). As
consequências foram concretas e bidirecionais (SOURCE: REV-NS-01 §4 item 2):

- **Direção de falso alarme:** um paciente intubado alerta (E4, M6, verbal
  não testável) só podia ser codificado coagindo o componente verbal para 1,
  resultando em GCS 11 → SOFA CNS 2 e mentação do qSOFA 1 — um sinal de
  deterioração fabricado para um paciente que está acordado.
- **Direção de falsa tranquilização:** omitir o GCS inteiramente fazia com
  que todo escorador o tratasse como ausente → SOFA CNS 0 / mentação do qSOFA
  0 — exatamente o mecanismo da HAZ-0005 (ausência renderizada como o valor
  mais saudável), que hazard-log.md registra como **E1 — ocorrido** no
  predecessor.
- **Confundimento por sedação:** um paciente sedado com propofol, RASS −4,
  escorava SOFA CNS 4 e disparava permanentemente o ramo `GCS ≤ 8 → "coma"
  crítico` do critério de deterioração, sem nenhuma covariável de sedação em
  lugar nenhum (SOURCE: REV-NS-01 §4 item 3; sofa-review.md D-12).

SOURCE (REV-NS-05 §1.1): o próprio serviço de sedação do CAM-ICU na V1 *de
fato* gateava em RASS ≤ −4 ("não avaliável"), provando que o padrão de gating
estava disponível na base de código legada e simplesmente nunca foi aplicado
ao GCS ou a seus consumidores.

O instrumento publicado é explícito (OBSERVED, §2.1 E3): quando um
componente do GCS não pode ser testado, ele é registrado como **NT (not
testable)**; "não usar o número '1' para registrar componente ausente"; e
**não reportar um escore total quando um componente é Not Testable**. A V1
violou as três regras. A V2 deve, portanto, decidir, antes que qualquer
especificação de regra dependente de consciência possa avançar, o que o
sistema registra quando uma avaliação neurológica está confundida, e o que
cada escore consumidor faz a respeito.

**Pergunta.** Quando um insumo dependente de consciência (GCS E/V/M, ACVPU)
está confundido por sedação, tem um componente não testável, ou está ausente,
qual estado de avaliabilidade a V2 deve registrar com a observação, quais
dados de contexto contemporâneos (RASS, estado de infusão sedativa, status de
intubação) são requeridos para estabelecer esse estado, e como cada
consumidor — SOFA CNS, mentação do qSOFA, consciência do NEWS2/MEWS — deve se
comportar em cada estado?

**Fora de escopo** (cada item nomeado para prevenir scope creep):

- A álgebra geral de status de avaliação de cinco estados, a maquinaria de
  política parcial, e a semântica de frescor/expiração — **ADR-0008**
  ("Semântica de status de avaliação; completude e frescor de escore/via",
  redigida concomitantemente no ciclo 1; esta ADR consome seu vocabulário
  conforme especificado hoje em `evaluation-status-semantics.md` e não o
  redefine).
- **ADR-0026** (ADR clínica concorrente do ciclo 1 — referenciada de forma
  cruzada apenas por ID; nenhuma das duas minutas bloqueia a leitura da
  outra).
- O conteúdo do algoritmo CAM-ICU e a cadência de triagem de delirium —
  território de especificação de regra; REV-NS-05 é citada aqui apenas por
  seu precedente de gating por RASS.
- Governança de limiar de alerta e pisos de override por tenant — ADR-0007.
- Escopo de população pediátrica/neonatal — VAL-0006/VAL-0007 (esta ADR é
  redigida apenas-adulto e o declara; ela não decide a questão de população).
- As janelas numéricas concretas de frescor para GCS e RASS — parâmetros
  clínicos propostos na especificação SOFA concorrente (§4.5) e listados aqui
  como condições de aceitação, não decididos aqui.
- Transporte de dado e seleção de sistema de origem — ADR-0001/ADR-0013.

### 1.1 Vocabulário compartilhado — a dimensão de avaliabilidade (PROPOSAL)

Todas as opções no §4 compartilham o seguinte modelo; elas diferem apenas no
**comportamento do consumidor**. PROPOSAL (operacionalizando REV-NS-01 §4
itens 1–3): toda observação dependente de consciência carrega um **estado de
avaliabilidade**, uma dimensão distinta tanto da qualidade de dado de origem
da AMH quanto do status de avaliação da V2 (a regra de duas dimensões de
`evaluation-status-semantics.md` §5; esta é uma propriedade da *observação*,
que restringe a *avaliação*):

| Estado | Definição | Dado de contexto requerido |
|---|---|---|
| `testable` | Todo componente do instrumento foi validamente avaliável e avaliado, e nenhuma condição de confundidor se sustenta. | RASS contemporâneo dentro de uma janela de frescor clinicamente ratificada (VALIDAÇÃO NECESSÁRIA — a spec SOFA concorrente propõe "dentro de 1h do GCS qualificante"); contexto de exposição sedativa conforme abaixo. |
| `not_testable` (NT), **por componente** | Um componente específico do GCS não pode ser testado (por exemplo, verbal sob intubação endotraqueal/traqueostomia; abertura ocular sob edema periorbital). Registrado como NT naquele componente, nunca como 1, nunca como ausente (OBSERVED, §2.1 E3). Um total não é computável enquanto qualquer componente estiver NT. | Status de intubação/via aérea — **questão de fonte sinalizada, VALIDAÇÃO NECESSÁRIA**: nenhuma fonte confiável de status de intubação da V2 está decidida (a revisão respiratória legada do SOFA mostra apenas um booleano `mechanical_ventilation` não ratificado, sofa-review.md D-02). |
| `sedation_confounded` | A avaliação reflete efeito de droga em vez de estado neurológico. Gatilho do revisor (SOURCE: REV-NS-01 §4 item 2): **RASS ≤ −3 contemporâneo ou uma infusão sedativa ativa sem uma janela de interrupção**. A especificação SOFA concorrente (§4.5) refina isto: a **exposição** sedativa deveria ser um conjunto obrigatório, porque RASS ≤ −3 com ausência documentada de exposição sedativa é coma estrutural, que deve ser escorado, não gateado. Reconciliar estas duas formulações é a questão aberta OQ-1 (§2.3 H3, §5.1 C4). | RASS contemporâneo; **contexto de infusão sedativa — VALIDAÇÃO NECESSÁRIA: hoje não existe fonte evidenciada** (SOURCE: sofa-review.md §7.1 — nenhum contrato de administração de medicamento com granularidade de dose foi evidenciado no commit AMH fixado 0a07a6f1fab36fb2f5eeee0fcd8e945c95f67116). |
| `missing` | Nenhuma observação qualificante existe na janela de frescor (ou o próprio contexto de gating necessário para classificá-la está ausente — o subcaso "estado de sedação desconhecido", OQ-2). | n/a |

Convenção de exibição (PROPOSAL, per REV-NS-01 §4 item 1): notação de
modalidade como "GCS 10T" ou reporte por componente "E4 M6 V-NT" é
**apresentação, não aritmética** — nenhum total numérico é derivado de uma
avaliação contendo NT em nenhuma opção abaixo.

---

## 2. Evidências e premissas

### 2.1 Evidências

Nota epistêmica: as linhas E3 e E9 são **OBSERVED** — este autor realizou
essas verificações ele mesmo em 2026-08-15 (web fetch das URLs citadas). Toda
outra linha **cita** um dossiê ou documento de governança do ciclo 1 e é,
portanto, `SOURCE` per `evidence-notation.md` §2 — a verificação de código
subjacente foi realizada pelo revisor legado do ciclo 1 no pin legado
`1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79`, não reperformada aqui.

| # | Rótulo | Declaração | Fonte (repo / caminho / seção) | Confiança |
|---|---|---|---|---|
| E1 | SOURCE | A V1 coage componentes E/V/M do GCS não testados para seu mínimo (docstring: "Se algum componente estiver ausente, escora o mínimo para aquele componente"); um formulário totalmente vazio resulta em GCS 3.0, indistinguível de coma profundo. Não existe estado NT, nenhum gating de GCS por RASS, e nenhuma covariável de sedação no SOFA CNS, qSOFA, ou nos critérios de deterioração. | intensicare-V2 / docs/05-clinical-safety/legacy-review/neuro-sedation-scores/REV-NS-01-gcs.md §1.2, §4 (pin legado 1dc1ea6…) | alta |
| E2 | SOURCE | GCS ausente → SOFA CNS `(0, "missing")` e mentação do qSOFA 0; o marcador "missing" é metadado que nenhum consumidor eleva; o caminho forms-SOFA descarta o componente sem nenhum marcador sequer; o critério de deterioração retorna o status literal `"normal"` quando o GCS está ausente. Este comportamento é afirmado como correto em testes legados — desenhado, não acidental. | REV-NS-01 §1.3, §5; sofa-review.md §6 | alta |
| E3 | **OBSERVED** | FAQ de glasgowcomascale.org ("Dealing with missing information"), obtido em 2026-08-15 por este autor: "Não usar o número '1' para registrar componente ausente; usar 'NT' (Not testable)"; "Não reportar um escore total quando um componente é Not Testable, porque o escore ficará baixo e isso poderia ser confuso"; para intubação endotraqueal/traqueostomia o componente verbal "pode ser denotado como 'not testable', NT. Os componentes motor e ocular ainda podem ser avaliados e a tendência ainda será útil." | https://www.glasgowcomascale.org/faq/ | alta |
| E4 | SOURCE | Teasdale G, Jennett B. *Assessment of coma and impaired consciousness: a practical scale.* Lancet. 1974;2(7872):81-84 — E (1-4) + V (1-5) + M (1-6), total 3-15. Citação carregada de REV-NS-01 §2 (registrada lá como verificada em 2026-08-15). A própria re-resolução de DOI deste autor (10.1016/S0140-6736(74)91639-0) alcançou o resolvedor de link do editor mas não uma página bibliográfica legível; a citação é citada, não reverificada, aqui. | REV-NS-01 §2 | alta |
| E5 | SOURCE | Sessler CN et al. *The Richmond Agitation-Sedation Scale: validity and reliability in adult ICU patients.* Am J Respir Crit Care Med. 2002;166(10):1338-1344 — dez níveis +4..−5; e Devlin JW et al. (SCCM PADIS). Crit Care Med. 2018;46(9):e825-e873 — sequência de avaliação RASS-primeiro; alvo de sedação leve comumente operacionalizado como RASS −2..0; sedação profunda ≤ −3. Citações carregadas de REV-NS-02 §2 (população de validação em UTI de adultos anotada lá). | REV-NS-02 §2, §3 | alta |
| E6 | SOURCE | Precedente legado: o serviço de sedação da V1 gateia o CAM-ICU em RASS ≤ −4 → `cam_icu_assessable = False`, "não avaliável", reavaliar após redução da sedação — combinando com Ely 2001 (pacientes não despertáveis à voz não são avaliáveis). O caminho paralelo de forms diverge (bloqueia apenas em RASS = −5) e ambos os caminhos assumem por default que features ausentes são uma triagem negativa. | REV-NS-05 §1.1, §1.2, §3 | alta |
| E7 | SOURCE | Vincent 1996 (SOFA) define as faixas de SNC (15/13-14/10-12/6-9/<6) e **não define como escorar pacientes sedados**; nenhuma regra publicada nele licencia substituir o valor sedado. O SOFA legado "não tem nenhum tratamento de sedação de qualquer tipo" (D-12) e nenhuma verificação de faixa de GCS (D-13); totais parciais são tipados e persistidos de forma idêntica a totais completos (D-17 — o mecanismo da HAZ-0005). | REV-NS-01 §2; sofa-review.md §3, §4 D-11..D-13, D-17 | alta |
| E8 | SOURCE | A consciência do NEWS2 é ACVPU, não GCS: Alerta = 0, C/V/P/U = 3; confusão só escora quando **nova** ("sem escore se crônica", RCP Chart 3). Defeitos legados: o caminho HL7 descarta 'C' para None → escora 0 (D-7); o GCS é coletado mas nunca mapeado para consciência quando o ACVPU está ausente, então um paciente comatoso com GCS registrado e ACVPU ausente escora 0 (D-8); um paciente sedado não-alerta escora +3 sem nenhum marcador de confundimento (REV-NS-01 §4 item 5). | news2-review.md §2, §3 D-7/D-8, §4.3 | alta |
| E9 | **OBSERVED** | Lambden S et al., *The SOFA score — development, utility and challenges of accurate assessment in clinical trials*, Crit Care 2019;23:374 (PMC6880479), obtido em 2026-08-15 por este autor: o componente neurológico é "o menos acuradamente medido e associado ao maior número de erros"; ensaios clínicos "usaram um valor assumido para o GCS em pacientes recebendo sedação" (carregando adiante o último GCS pré-intubação, ou inferindo um GCS 15 normal quando nenhum existe), produzindo "variabilidade significativa no valor registrado"; existe evidência limitada sobre o atraso antes de uma avaliação confiável após a suspensão de hipnóticos. **A prática de GCS assumido é uma convenção de reporte, não um método de imputação à beira do leito validado.** | https://pmc.ncbi.nlm.nih.gov/articles/PMC6880479/ | alta |
| E10 | SOURCE | A semântica de status de avaliação da V2: a severidade só é legível quando o status é `valid` ou `partial` dentro de uma política aprovada; `partial` NÃO DEVE existir sem uma política parcial explicitamente aprovada; insumos ausentes NÃO DEVEM ser coagidos para zero/normal (proibições P-1..P-8); a sonda de insumo ausente (SAF-0002) é um gate de verificação bloqueante. | docs/05-clinical-safety/evaluation-status-semantics.md §2, §3.2, §3.3, §4 | alta |
| E11 | SOURCE | O próprio insumo de gating está em risco: o motor de forms da V1 coage um **RASS ausente para 0.0 = "Alerta e calmo"** e silenciosamente satura valores fora de faixa — então qualquer desenho de gating por RASS na V2 deve tratar o RASS com a mesma disciplina de não-coerção que o escore que ele gateia. | REV-NS-02 §1, §4 | alta |
| E12 | SOURCE | Realidade de disponibilidade de dado no commit AMH fixado (0a07a6f1…): zero Observations populadas de qualquer categoria; nenhum contrato de administração de medicamento com granularidade de dose evidenciado (→ nenhuma fonte de infusão sedativa); nenhuma fonte de status de intubação evidenciada; a classe de insumo neurológico é estruturalmente excluída pelo perfil de Observation fixado em laboratório. Qualquer gatilho de confundimento que requeira contexto de infusão é, portanto, **inexecutável contra as fontes evidenciadas hoje**. | sofa-review.md §7.1, §7.2 | alta |
| E13 | SOURCE | HAZ-0005 (S5/L4, Unacceptable, E1 — ocorrido): insumo ausente escorado como zero → escore persistido com aparência normal → falsa tranquilização. HAZ-0036: avaliação fora-de-população expande silenciosamente o uso pretendido — todos os consumidores aqui são instrumentos validados em adultos. | docs/05-clinical-safety/hazard-log.md HAZ-0005, HAZ-0036 | alta |
| E14 | SOURCE | A especificação de regra SOFA concorrente do ciclo 1 já redige uma cláusula §4.5 de confundimento por sedação subordinada a esta ADR (not_evaluated com razão `sedation_confounded`; último GCS pré-sedação apresentado na explicação; formulação RASS-≤−3-com-exposição; questão aberta OQ-8 sobre o caso de sedação desconhecida), e a especificação NEWS2 roteia seu confundidor de sedação (linha de matriz NEWS2-07) e a questão de mapeamento GCS→ACVPU para esta ADR. Estas são as seções de spec da Tarefa 2 que esta ADR desbloqueia. | docs/05-clinical-safety/rule-releases/sofa/specification.md §4.5, OQ-8; docs/05-clinical-safety/rule-releases/news2/specification.md (insumo de consciência, questão aberta 4) | alta |

### 2.2 Premissas

Premissas a serem registradas em
`docs/00-governance/registers/assumptions-register.md` pelo steward do registro
(esta ADR não minta IDs ASM — mintagem concorrente colidiria, per o precedente
da ADR-0001).

| # | Premissa | Por que é necessária | O que a invalida | Titular | Status no registro |
|---|---|---|---|---|---|
| A1 | Um RASS contemporâneo pode ser capturado no fluxo de trabalho clínico da V2 junto de todo GCS grau-de-escoragem, com encargo de documentação aceitável. | A detecção de confundimento de toda opção depende da disponibilidade do RASS (E5, E14). | Validação de fluxo de trabalho mostrando que enfermeiros não conseguem ou não vão registrar RASS+GCS pareados; ou uma análise de fonte mostrando que o RASS é incapturável a partir dos sistemas disponíveis. | UNASSIGNED — VALIDAÇÃO NECESSÁRIA | a ser registrada |
| A2 | Uma fonte de dado de infusão sedativa (administração de medicamento) confiável eventualmente existirá, mas hoje não existe (E12). | Determina se o ramo de infusão do gatilho de confundimento é executável no lançamento ou adiado (gatilho de revisita T1). | Evidência de que nenhuma fonte de administração de medicamento será integrada no horizonte do programa. | UNASSIGNED — VALIDAÇÃO NECESSÁRIA | a ser registrada |
| A3 | O escopo de população inicial da V2 para estes instrumentos é UTI de adultos (E5, E13/HAZ-0036), pendente de VAL-0006/VAL-0007. | A validade dos consumidores de GCS e o instrumento RASS são validados em adultos; a política é redigida apenas-adulto. | VAL-0006/VAL-0007 decidindo pediátrico/neonatal em escopo — o que exigiria instrumentos separados, não uma extensão desta política. | AUTH-CLINSAFETY + AUTH-INTENDED-USE (candidato rodaquino-OMNI per GDEC-0003) | a ser registrada |
| A4 | Janelas de frescor clinicamente defensáveis para GCS e RASS pareado existem e podem ser ratificadas (a spec SOFA concorrente propõe GCS 12h / expiração 24h, RASS dentro de 1h do GCS). | A contemporaneidade é o que torna o RASS um gate de confundidor válido. | Revisão clínica rejeitando as janelas propostas sem substitutos. | UNASSIGNED — VALIDAÇÃO NECESSÁRIA | a ser registrada |

### 2.3 Hipóteses a testar

| # | Hipótese | Como seria testada | Quem testa | Status atual |
|---|---|---|---|---|
| H1 | Os estados confundido-por-sedação e NT são suficientemente frequentes na população-alvo de UTI para que seu tratamento mude materialmente a disponibilidade de escore e o encargo de alerta (INFERENCE a partir de E5/E9: sedação profunda e intubação são rotina em UTI). | Estudo de frequência retrospectivo em um dataset representativo uma vez que exista uma fonte de dado; medição em shadow mode da distribuição de estado de avaliabilidade. | Metodologista de evidência clínica + AUTH-CLINSAFETY | NÃO TESTADA |
| H2 | O gating fail-closed (Opção A) não suprime a detecção de deterioração neurológica verdadeira, porque a deterioração em um paciente sedado é detectada pela avaliação de interrupção de sedação e pelos outros eixos orgânicos, não pela escoragem do GCS drogado. | Comparação em shadow mode de conjuntos de alerta com e sem gating contra eventos de deterioração adjudicados por clínico. | Engenheiro de teste com foco em segurança + AUTH-CLINSAFETY | NÃO TESTADA |
| H3 | O gatilho de confundimento requer exposição sedativa como um conjunto (RASS ≤ −3 sozinho não deve gatear, ou coma estrutural não sedado ficaria inescorável) — o refinamento da spec SOFA concorrente sobre o gatilho do revisor em REV-NS-01. | Revisão clínica nomeada (OQ-1); walkthrough de vetor de caso (coma estrutural, coma sedado, sedação-com-agitação). | rodaquino-OMNI (GDEC-0003) | NÃO TESTADA |

---

## 3. Direcionadores de decisão e atributos de qualidade mensuráveis

As metas são `VALIDAÇÃO NECESSÁRIA` até que existam necessidades validadas
pelo Gate G1/G2 — nenhuma meta numérica é inventada aqui. Os direcionadores são
discriminantes: as opções no §4 diferem em toda linha.

| # | Direcionador | Por que importa aqui | Atributo de qualidade mensurável | Meta |
|---|---|---|---|---|
| D1 | **Eliminação de falsa tranquilização (HAZ-0005).** Um insumo neurológico ausente/NT/confundido deve ser irrepresentável como 0, mínimo-de-componente, ou "normal". | Esta é a falha que de fato ocorreu (E2, E13) — em ambas as direções (E1). | Sonda de insumo ausente SAF-0002 estendida com vetores NT/confundidos: contagem de subescores de SNC/mentação/consciência computados a partir de componentes NT ou confundidos no corpus de vetor de referência CRV (prefixo CRV per GDEC-0002, ratificação pendente). **Medida proposta: zero.** QAS-0017. | VALIDAÇÃO NECESSÁRIA |
| D2 | **Observabilidade de avaliabilidade.** O clínico e todo consumidor downstream devem conseguir ver *por que* um escore está ausente ou limitado. | O marcador legado "missing" existia e não era elevado por nenhum consumidor (E2); a observabilidade é o que falhou, não a computação. | Fração de avaliações persistidas de GCS/ACVPU carregando um estado de avaliabilidade e uma razão legível por máquina. **Medida proposta: 100%.** QAS-0007. | VALIDAÇÃO NECESSÁRIA |
| D3 | **Disponibilidade clínica.** Fração de paciente-horas em UTI nas quais escores dependentes de consciência são legíveis, de todo. | O gating fail-closed converte os números (errados) de hoje em `not_evaluated` — uma perda de disponibilidade real que os clínicos vão sentir (H1). | Taxa de `not_evaluated` e delta de encargo de alerta medidos em shadow mode contra a baseline não-gateada; o delta deve ser **limitado e clinicamente aceito**, não presumido. | VALIDAÇÃO NECESSÁRIA |
| D4 | **Fidelidade à semântica do instrumento publicado.** NT por componente, nenhum total sobre NT (E3); ACVPU é seu próprio instrumento, não uma projeção do GCS (E8); avaliação RASS-primeiro (E5). | Desviar da orientação do editor é o que tornou os números da V1 indefensáveis (E1, E7). | Revisão de conformidade do modelo de dado e das specs de regra contra as fontes primárias E3/E4/E5/E8. | VALIDAÇÃO NECESSÁRIA |
| D5 | **Executabilidade contra fontes evidenciadas.** A política deve declarar o que roda quando o contexto de RASS ou de infusão está ausente — porque hoje a fonte de infusão simplesmente não existe (E12) e o próprio RASS era coagido no legado (E11). | Uma política que presume silenciosamente dado de contexto indisponível recria o defeito legado um nível acima. | Matriz de disponibilidade de fonte por gatilho (quais ramos de gatilho estão ativos vs. dormentes) publicada com o pacote de regras. | VALIDAÇÃO NECESSÁRIA |
| D6 | **Auditabilidade do julgamento de confundimento.** Se um GCS era grau-de-escoragem deve ser reconstruível (qual RASS, qual janela, qual ramo de gatilho) para toda avaliação. | Tanto o replay determinístico (contexto QAS-0020) quanto a revisão de incidente precisam disso; a trilha legada terminava em marcadores não verificáveis (E2). | Todo registro de avaliação carrega os insumos de gating e seus horários de origem. | VALIDAÇÃO NECESSÁRIA |

---

## 4. Alternativas consideradas

Todas as opções consomem o vocabulário de avaliabilidade compartilhado do
§1.1 e o vocabulário de status de avaliação de `evaluation-status-semantics.md`
(matéria da ADR-0008). Elas diferem no que os consumidores fazem com um estado
diferente de `testable`.

### Opção A — Gating fail-closed de avaliabilidade (a política recomendada pelo revisor, REV-NS-01 §4)

**Descrição.** A avaliabilidade é uma precondição de primeira classe para a
escoragem:

1. **O GCS é modelado como componentes E/V/M com um estado NT explícito por
   componente.** Um total é computável apenas quando os três componentes são
   testados; um componente NT torna o total irrepresentável — não 3, não 15,
   não preenchido-pelo-mínimo (E3). A exibição de modalidade estilo "GCS 10T"
   é apenas apresentação (§1.1).
2. **GCS grau-de-escoragem requer um RASS contemporâneo** (janela per A4,
   VALIDAÇÃO NECESSÁRIA). Se o gatilho de confundimento se sustentar (RASS ≤
   −3 com exposição sedativa, ou uma infusão sedativa ininterrupta —
   formulação exata per OQ-1/H3), o GCS ainda é **registrado**, mas
   sinalizado `sedation_confounded`.
3. **Comportamento do consumidor por estado** (a tabela normativa desta
   opção):

| Estado de avaliabilidade | SOFA CNS | Mentação do qSOFA (GCS < 15) | Consciência do NEWS2/MEWS (ACVPU) |
|---|---|---|---|
| `testable` | Computado; status de avaliação per regras de completude/frescor da ADR-0008. | Computada. | Computado a partir do token ACVPU observado (nunca derivado do GCS — E8, e nenhum mapeamento automático GCS→ACVPU, per a spec NEWS2 concorrente). |
| Componente `not_testable` (ex.: verbal-NT, intubado) | Nenhum total existe → subescore de SNC `not_evaluated` (razão `nt_component`), **ou** uma política parcial explicitamente ratificada per a semântica do ADR-0008 §3.2 — formato candidato no §4.0.1 abaixo. Nunca um total a partir de componentes preenchidos-pelo-mínimo. | O predicado GCS < 15 às vezes é decidível apenas a partir dos componentes testados (§4.0.1); onde decidível, uma política parcial ratificada pode avaliá-lo; onde indeterminado → `not_evaluated` (razão `nt_component`). | O ACVPU é uma avaliação à beira do leito separada e pode, ela mesma, ainda ser realizável em um paciente intubado; se realizada, computada; se não realizada → `not_evaluated`. |
| `sedation_confounded` | `not_evaluated` (razão `sedation_confounded`) como o default clinicamente honesto; o último GCS pré-sedação é **apresentado apenas para exibição** na explicação, nunca alimentado à aritmética (sua idade permissível: OQ-6). Uma política parcial ratificada pode refinar isto depois; nenhuma é presumida. | O mesmo: `not_evaluated` (razão `sedation_confounded`). | O ACVPU observado é registrado; o componente **pode** ser computado a partir do estado observado (o instrumento escora o que é observado, e a direção do erro é excesso-de-alarme, não tranquilização — E8), mas a avaliação deve carregar a marcação `sedation_confounded` e nunca deve ser apresentada como um `valid` não qualificado; se é `partial`-com-limites-declarados ou `not_evaluated` é uma decisão clínica nomeada (OQ-4). |
| `missing` (nenhuma observação qualificante, ou contexto de gating ausente → estado de sedação desconhecido) | `not_evaluated` (razão `missing_input:gcs` ou `rass_unavailable`) — nunca 0 (E2, E10 P-1). O subcaso de sedação desconhecida (GCS presente, contexto de RASS e de infusão ambos ausentes) é OQ-2: escorar-com-divulgação vs. bloquear. | `not_evaluated` — nunca 0. | `not_evaluated` (razão `missing_input:consciousness`) — nunca 0 e nunca um "A" por default (E8 D-7/D-8). |

4. **Nunca coagir** (E10 P-1..P-8): os três comportamentos legados —
   ausente→0, ausente→mínimo-de-componente, ausente→status-"normal" — são
   todos rejeitados; valores inválidos/fora-de-faixa resolvem para `invalid`,
   não saturados (E11).
5. **Gate de população:** apenas-adulto até que VAL-0006/VAL-0007 decidam
   diferente (A3).

#### 4.0.1 Formato candidato da política parcial ratificada (PROPOSAL — não presumido pela Opção A)

Semântica de intervalo, aritmética exata em vez de imputação: um
componente NT contribui com sua faixa de componente completa, então um GCS
parcialmente testado é um intervalo `[soma dos mínimos testados + mínimos não
testados, soma dos máximos testados + máximos não testados]`. Um consumidor
cujo predicado é decidível sobre o intervalo inteiro pode avaliar: E3 + M5 +
V-NT dá um total de no máximo 13 < 15, então "GCS < 15" é **verdadeiro**
independentemente do verbal não testável — a mentação do qSOFA é decidível.
E4 + M6 + V-NT abrange 12..15 — indeterminado → `not_evaluated`. O SOFA CNS só
é decidível quando o intervalo cai inteiramente dentro de uma faixa de
Vincent. Isto é apresentado como a alternativa *honesta* à imputação (não
fabrica nenhum valor), mas é uma política parcial sob
`evaluation-status-semantics.md` §3.2 e, portanto, **requer um aprovador
clínico independente antes mesmo de existir** (OQ-3). A Opção A permanece
completa sem ela — a ausência de ratificação por default é `not_evaluated`.

**Como responde a cada direcionador.** D1: plenamente — as declarações
inseguras se tornam irrepresentáveis (o tipo não tem total sobre NT, nenhum
escore sem avaliabilidade). D2: plenamente — estados e razões são
obrigatórios. D3: **mais fraco aqui** — a contribuição de SNC/mentação de
todo paciente profundamente sedado apaga (H1 diz que isso é uma fração grande
das horas-UTI); a perda honesta de disponibilidade é o preço de eliminar a
falsa tranquilização, e a H2 (deterioração detectada por outros meios) não é
testada. D4: totalmente alinhado com E3/E5/E8. D5: parcialmente — o ramo de
infusão do gatilho fica dormente até que exista uma fonte (E12); a política
deve rodar apenas-com-RASS com uma regra explícita de sedação desconhecida
(OQ-2). D6: plenamente — os insumos de gating são parte do registro de
avaliação.

**Consequências positivas.** Elimina ambas as direções de dano legado (E1)
no nível do tipo; combina com a orientação do editor (E3) e com o próprio
melhor padrão do sistema legado (E6); dá às especificações da Tarefa 2 uma
semântica única e testável (E14); torna os vetores NT/confundidos do corpus
CRV afirmáveis (D1).

**Consequências negativas.** Perda de disponibilidade real e sentida (D3)
com aceitabilidade clínica não testada (H2); depende de o registro pareado de
RASS de fato acontecer (A1) — se o registro de RASS for pobre, grandes
volumes resolvem para `not_evaluated (rass_unavailable)`, o que os clínicos
podem perceber como o sistema se recusando a funcionar; requer captura em
nível E/V/M, que é um contrato de ingestão mais pesado do que um único
inteiro; a via de avaliação de interrupção de sedação ("sedation vacation")
que os clínicos de fato usam para obter um GCS válido em pacientes sedados é
um fluxo de trabalho que esta política referencia mas que a V2 não consegue,
ela mesma, prover.

**O que precisaria ser verdade para esta ser a resposta certa.** H2 se
sustenta (nenhuma perda de sensibilidade para deterioração verdadeira); A1
se sustenta (o RASS pareado é capturável); a governança clínica aceita
`not_evaluated` como o default honesto para pacientes sedados (E14 mostra que
a spec SOFA concorrente já redige exatamente isto, subordinada a esta ADR).

**Custo de saída se escolhida e depois revertida.** Baixo-a-moderado: os
estados de avaliabilidade registrados, o GCS em nível de componente, e o
RASS pareado são estritamente mais informação do que qualquer alternativa
precisa; a reversão para B ou C consome o mesmo dado. Nada fica encalhado
exceto a lógica de gating.

### Opção B — Convenção de imputação documentada (a alternativa de convenção de ensaio clínico, argumentada honestamente)

**Descrição.** Adotar a convenção usada por muitos ensaios clínicos e
registros (E9): para uma avaliação confundida por sedação, o insumo de SNC é
**imputado** — ou o último GCS pré-sedação carregado adiante, ou um GCS 15
normal-assumido onde nenhum existe — e os consumidores computam normalmente.
A imputação é sinalizada no registro de avaliação e na exibição ("GCS 15,
baseline pré-sedação assumida"), e o status de avaliação é `partial` sob uma
política declarada nomeando a imputação.

**O caso honesto a favor.** É o que grande parte da literatura de SOFA de
fato faz (E9); preserva a continuidade do escore e as linhas de tendência
através de episódios de sedação; o próprio Sepsis-3 tolera um SOFA baseline
assumido-zero em pacientes sem disfunção pré-existente conhecida (SOURCE:
sofa-review.md §3, Singer 2016), então a literatura do instrumento não é
alérgica a convenções documentadas; e a triagem baseada em ΔSOFA permanece
computável, o que a Opção A quebra durante a sedação.

**O caso honesto contra.** A convenção é uma convenção de reporte para
pesquisa, não um método de imputação à beira do leito validado — Lambden
registra "variabilidade significativa" e evidência explicitamente limitada
(E9, OBSERVED). Sua direção de erro é sistematicamente em direção à
tranquilização: assumir GCS 15 escora CNS 0 para um paciente cujo verdadeiro
estado neurológico é desconhecido — um paciente que adquire uma catástrofe
intracraniana nova sob sedação escora normal até que alguém interrompa a
sedação. Esse é o fenótipo da HAZ-0005 produzido deliberadamente (E13).
Também viola a P-1 ("nenhum default numérico, categórico, ou de 'último
conhecido' pode substituir um insumo ausente", E10), a menos que uma
autoridade clínica nomeada ratifique explicitamente a imputação como a
política parcial declarada — que é precisamente o que esta ADR existiria
para registrar: ela está **disponível como uma decisão clínica nomeada,
nunca como um default**.

**Como responde a cada direcionador.** D1: falha por default; passa
apenas se aceita que uma imputação sinalizada não é uma coerção — a flag
deve sobreviver a toda projeção (P-6), que é exatamente o que o metadado
legado não fazia (E2). D2: parcial — o estado é registrado mas o número
ainda se lê como um número. D3: mais forte — disponibilidade de escore
completa através da sedação. D4: conflita com o "não reportar um total" da
E3 para NT e com o silêncio de Vincent sobre sedação (E7). D5: executável
hoje (precisa apenas do último valor pré-sedação). D6: auditável se a fonte
da imputação for registrada.

**Consequências positivas.** Nenhuma perda de disponibilidade;
continuidade de tendência; combina com datasets de pesquisa externos,
facilitando a comparabilidade de desfechos.

**Consequências negativas.** Institucionaliza um canal de falsa
tranquilização; o número imputado será consumido por todo agregado
downstream, e qualquer consumidor que descarte a flag reproduz o defeito
legado; analytics agrupando escores de SNC imputados com medidos polui
datasets de desfecho (`evaluation-status-semantics.md` §6).

**O que precisaria ser verdade para esta ser a resposta certa.** Uma
autoridade clínica nomeada julga a continuidade do escore para triagem de
sepse mais protetiva do que o risco de falsa tranquilização; a flag é
comprovada como não-descartável em toda superfície (P-6 verificada
adversarialmente); a baseline pré-sedação está confiavelmente disponível e
fresca.

**Custo de saída se escolhida e depois revertida.** Alto para o dado:
escores imputados persistidos são permanentemente ambíguos no registro
histórico e nunca podem ser separados retroativamente dos medidos para
analytics ou estudos de validação — esta é a opção menos reversível em seus
efeitos sobre o dado.

### Opção C — Anotação de exibição sensível à sedação, sem mudança de status

**Descrição.** Computar todos os escores exatamente como medidos (o GCS 3
de um paciente RASS −4 escora SOFA CNS 4), mas anotar a UI: "a avaliação de
consciência pode estar confundida por sedação". O status de avaliação
permanece `valid`.

**Como responde a cada direcionador.** D1: falha — a direção de
severidade-fabricada (o ramo de falso-alarme da E1 e o disparo permanente do
ramo "coma" de REV-NS-01 §4 item 3) persiste intocada, e o ramo de
insumo-ausente está inteiramente fora do escopo desta opção. D2:
cosmeticamente — uma anotação não é um estado legível por máquina e não
restringe nenhum consumidor. D3: disponibilidade completa. D4: conflita com
E3. D5: trivialmente executável. D6: não.

**Consequências positivas.** Engenharia mínima; nenhuma perda de
disponibilidade; o clínico é ao menos avisado na superfície de exibição.

**Consequências negativas.** Isto é, arquiteturalmente, o defeito legado
reafirmado: metadado que nenhum consumidor eleva (E2) — alertas, agregados,
roll-ups de severidade de leito, analytics e exportações todos consomem o
número confundido como limpo; uma anotação de UI é invisível para todo
consumidor não-UI; e a regra dura de ordenação do §2 de
`evaluation-status-semantics.md` (severidade só legível quando o status a
licencia) é violada por desenho. Também não faz nada pelos componentes NT —
não tem resposta para o paciente intubado exceto as duas codificações
erradas da V1.

**O que precisaria ser verdade para esta ser a resposta certa.** Seria
preciso concluir que os clínicos descontam de forma confiável o GCS sedado
na tela e que nenhum consumidor downstream importa — ambos contraditos pela
evidência legada (E2, E13: o dano correu pelo bed grid, não pelo
prontuário).

**Custo de saída se escolhida e depois revertida.** Baixo em código, alto
em dado acumulado: escores persistidos como `valid` durante o interim são
indistinguíveis dos limpos para sempre (mesmo mecanismo do custo de dado da
Opção B, sem sequer a flag).

### Opção Z — Adiar / não fazer nada

**Descrição.** Não registrar nenhuma política. Os veredictos do REV-NS se
mantêm (comportamento da V1 REJEITADO), mas a V2 não tem semântica de
substituição. Concretamente: o modelo de dado de GCS não pode ser
especificado (componente vs. total, a representabilidade de NT está
indecidida); a cláusula §4.5 e a OQ-8 da especificação SOFA concorrente, e a
questão aberta 4 de consciência da especificação NEWS2, permanecem abertas
(E14); categorias de vetor CRV para insumos neurológicos não podem ser
congeladas; toda regra dependente de consciência permanece em rascunho.

**Consequências positivas.** Nenhuma política clínica é fixada sem o
revisor nomeado; nenhuma engenharia é construída sobre um gatilho de
confundimento não ratificado.

**Consequências negativas.** A decisão não é de fato evitada — o primeiro
esquema de ingestão implementado para o GCS *é* a decisão (uma coluna de
inteiro único impede o NT; uma coluna nullable sem avaliabilidade impede o
gating), tomada implicitamente e sem revisão clínica. Os entregáveis da
Tarefa 2 do ciclo 1 permanecem bloqueados (E14).

**Custo do atraso.** Sobe na primeira implementação de contrato de
ingestão ou de pacote de regras, o que vier primeiro; depois que um esquema
de GCS apenas-total for lançado, esta ADR se torna uma migração em vez de
uma escolha de design.

### 4.1 Comparação contra os direcionadores

Qualitativa, rotulada por evidência; nenhuma pontuação numérica (pesos
não ratificados).

| Direcionador | A — gating fail-closed | B — imputação documentada | C — anotação apenas-exibição | Z — adiar |
|---|---|---|---|---|
| D1 eliminação de falsa tranquilização | Estados inseguros irrepresentáveis (E3, E10) | Canal de tranquilização por desenho; seguro apenas se a flag for inperdível (E2 diz que ela foi perdida) | Falha — mecanismo legado reafirmado (E2) | Não resolvido; decisão implícita de schema paira |
| D2 observabilidade de avaliabilidade | Estado + razão obrigatórios | Estado registrado, número ainda se lê limpo | Apenas-UI, não legível por máquina | Nenhuma |
| D3 disponibilidade clínica | Mais fraca — horas sedadas ficam `not_evaluated` (H1/H2 não testadas) | Mais forte | Completa | n/a |
| D4 fidelidade ao instrumento | Alinhada (E3/E5/E8) | Conflita com E3; convenção não validada (E9) | Conflita com E3 | n/a |
| D5 executabilidade hoje | Ramo RASS ativo se registrado; ramo de infusão dormente (E12); regra de sedação desconhecida necessária (OQ-2) | Executável | Executável | n/a |
| D6 auditabilidade | Insumos de gating no registro de avaliação | Auditável se a fonte da imputação for registrada | Não | n/a |

### 4.2 Decisão de autoria (GDEC-0007, 2026-08-15)

A **Opção A** é decidida, como a operacionalização da própria política recomendada
pelo revisor do ciclo 1 (REV-NS-01 §4) — com duas clarificações fixadas pela decisão,
não deixadas ao próprio enquadramento da opção: (1) o gatilho de confundimento é a
formulação de **conjunção-com-exposição** (RASS ≤ −3 **e** exposição sedativa; coma
estrutural sem sedação escora), não a disjunção de REV-NS-01 (A28-1); (2) o estado de
sedação desconhecido resolve **FAIL-CLOSED** para `not_evaluated (rass_unavailable)`
(A28-2), não a alternativa de escorar-com-divulgação que a própria tabela desta opção
havia deixado em aberto. O formato de intervalo-parcial do §4.0.1 é **aceito** como a
única política parcial ratificada para a classe qSOFA/SOFA-CNS (A28-3) — não é mais
apenas oferecido. A Opção B (imputação documentada) permanece disponível apenas como
uma *decisão clínica nomeada* que uma autoridade futura pode tomar, com suas
consequências registradas — esta decisão não a adota. Ver §5.0 para o registro
completo por questão.

---

## 5. Decisão e escopo

### 5.0 Decisão (GDEC-0007, 2026-08-15)

> *Bloco redigido em português (pt-BR) per DEC-G0-10; o restante deste documento
> permanece em inglês como conteúdo pré-existente (tradução material adiada — P-4).*
>
> decided_by: **rodaquino-OMNI** (revisor clínico nomeado, GDEC-0003; também titular
> interino de papéis `AUTH-*` de fase de projeto per GDEC-0004 onde pertinente).
>
> Option A (fail-closed assessability gating) é aceita como decisão, com as
> especificações fixadas abaixo. Registro por questão, per a folha de decisão do
> ciclo 1 (`docs/05-clinical-safety/cycle-1-review-decision-sheet.md` §9, linhas
> A28-1 a A28-8):
>
> - **A28-1 →** gatilho de confundimento decidido como **conjunção-com-exposição**:
>   RASS ≤ −3 **e** exposição sedativa → confundido; coma estrutural **sem** sedação
>   escora. A disjunção do REV-NS-01 §4 não é adotada.
> - **A28-2 →** sedação desconhecida decidida **FAIL-CLOSED** —
>   `not_evaluated (rass_unavailable)`. **Esta cláusula substitui (overrides)
>   qualquer default de "escora-com-divulgação" em qualquer spec concorrente**,
>   inclusive o rascunho 0.1.0 da spec SOFA (§4 Option A item 3) — a mesma resposta
>   vale para RULE-GCS G-2 e RULE-SOFA OQ-8.
> - **A28-3 →** a política intervalo-parcial de §4.0.1 é **aceita** como única forma
>   de parcial ratificado para a classe qSOFA-mentação/SOFA-CNS — não fabrica valor;
>   decide apenas o que é decidível no intervalo.
> - **A28-4 →** NEWS2/MEWS sob sedação: o escore é marcado **"confundido"**, nunca
>   `valid` sem qualificação; **sem supressão** — o ACVPU observado sob sedação é
>   estado real (direção do erro = mais alarme, aceitável por INV-B).
> - **A28-5 →** limiar RASS decidido em **≤ −3** (PADIS), não o ≤ −4 do precedente
>   CAM-ICU (que responde a outra pergunta — avaliabilidade de delirium).
> - **A28-6 →** último GCS pré-sedação: **display-only**, idade máxima **72h**,
>   timestamp visível; nunca entra em cômputo.
> - **A28-7 →** janelas de frescor **ratificadas**: GCS 12h (staleness) / 24h
>   (expiração); RASS dentro de 1h do GCS qualificante.
> - **A28-8 →** convenções de exibição **ratificadas**: "GCS 10T" / "E4 M6 V-NT", com
>   redação pt-BR "não testável — NT"; entrada de glossário via ADR-0029.
>
> **rationale:** conforme folha de decisão do ciclo 1 (GDEC-0007); fundamentos por
> linha na própria folha (`cycle-1-review-decision-sheet.md` §9). A prioridade
> máxima do titular ("uma resposta única de sedação... deliberadamente mais estrita
> que o default 'escora-com-divulgação'") está registrada verbatim no resumo
> executivo daquela folha.
>
> **supersessão:** rege-se pela própria seção de gatilhos de revisita desta ADR
> (§8.2, T1–T6) — nenhum gatilho adicional é criado por esta transcrição.
>
> **Nota de escopo.** Esta decisão fecha as cláusulas CLÍNICAS. A aceitação conjunta
> com o ADR-0008 (C2), a fonte confiável de infusão sedativa (C5) e a medição em
> shadow mode (C6) permanecem OPEN e não são fechadas por esta aceitação.

### 5.1 Condições — status após a decisão de 2026-08-15 (GDEC-0007)

| # | Condição | Titular | Evidência que a fecharia | Status |
|---|---|---|---|---|
| C1 | Revisão clínica nomeada do modelo de avaliabilidade (§1.1) e da tabela de consumidor da opção escolhida, cláusula por cláusula. | rodaquino-OMNI (GDEC-0003, escopo ciclo-1) | Revisão registrada resolvendo OQ-1..OQ-8 (§11.1). | **FECHADA — ver §5.0, GDEC-0007, 2026-08-15** |
| C2 | A ADR-0008 alcança pelo menos `under-review`, para que "política parcial explicitamente ratificada" tenha semântica assentada à qual esta ADR possa se vincular. | AUTH-CLINSAFETY | Mudança de status da ADR-0008 em adr-index.md. | **FECHADA — ADR-0008 aceita em 2026-08-15 (GDEC-0007)** |
| C3 | Janelas de frescor para GCS e RASS pareado propostas e clinicamente ratificadas (A4; os valores de 12h / 24h / 1h da spec SOFA concorrente são propostas). | AUTH-CLINSAFETY | Tabela de janela ratificada nas especificações de regra. | **FECHADA — ver §5.0 (A28-7)** |
| C4 | A formulação do gatilho de confundimento é fixada (disjunção do revisor em REV-NS-01 vs. o refinamento de conjunção-com-exposição da spec SOFA — H3/OQ-1), incluindo o caso de sedação desconhecida (OQ-2). | AUTH-CLINSAFETY | Resolução registrada; vetores de caso (coma estrutural, coma sedado) acrescentados ao corpus CRV. | **FECHADA quanto à formulação (A28-1/A28-2) — o acréscimo de vetor de caso CRV permanece um follow-up de engenharia, ainda aberto** |
| C5 | As questões de fonte de infusão sedativa e status de intubação são respondidas — uma fonte confiável nomeada, ou um registro explícito de que esses ramos de gatilho/NT estão dormentes no lançamento (E12, §1.1). | AUTH-DATA-PLATFORM + AUTH-CLINSAFETY | Matriz de disponibilidade de fonte por gatilho (D5) publicada. | ABERTA |
| C6 | Existe medição em shadow mode (ou retrospectiva) das frequências de estado de avaliabilidade e do delta de encargo de alerta, para que o custo do D3 seja conhecido, não adivinhado (H1, H2). | Engenheiro de teste com foco em segurança + AUTH-CLINSAFETY | Relatório de medição anexado a esta ADR. | ABERTA |
| C7 | Escopo de população confirmado como apenas-adulto ou diferente (VAL-0006/VAL-0007) para todo consumidor nomeado aqui (A3, HAZ-0036). | AUTH-CLINSAFETY + AUTH-INTENDED-USE | Registro do Gate G1/G2. | **FECHADA quanto ao default apenas-adulto — ver ADR-0027 §5.0 (A27-1); o fechamento formal de VAL-0006/VAL-0007 no próprio documento de backlog permanece ABERTA** |

---

## 6. Consequências

Como nenhuma opção é escolhida, §6.1–6.3 declaram as consequências da existência
desta ADR em estado `proposed`; consequências por opção estão no §4.

### 6.1 Positivas

- A questão de confundimento — insumo obrigatório de REV-NS-01 §4 — agora tem
  uma única superfície de decisão com sua evidência anexada; as especificações
  SOFA e NEWS2 concorrentes podem citar a ADR-0028 por ID em vez de um
  placeholder de ADR pendente (E14).
- O trade-off disponibilidade-vs-falsa-tranquilização (D1 vs. D3) é
  declarado com ambas as direções argumentadas, então o revisor nomeado o
  decide explicitamente em vez de herdá-lo de qualquer que seja o esquema
  lançado primeiro.
- A alternativa de convenção de ensaio clínico (Opção B) está registrada com
  seu status de evidência honesto (E9: convenção, não validação), prevenindo
  que ela seja adotada depois "porque a literatura faz isso" sem uma decisão
  nomeada.

### 6.2 Negativas

- Até ser decidido, todo entregável dependente de consciência carrega um
  ramo condicional sobre esta ADR — um custo de coordenação real através do
  trabalho concorrente do ciclo 1.
- O risco permanente (a ser registrado per `links.drivers.risks` do front
  matter): um esquema de ingestão ou pacote de regras implementado antes da
  aceitação decidiria esta ADR implicitamente (§4 Opção Z) — a pressão de
  implementação resolve a ambiguidade por default, e esse default é,
  historicamente, o inseguro.

### 6.3 Neutras / estruturais

- Esta ADR acrescenta uma dimensão em nível de observação (avaliabilidade)
  ao lado das dimensões de qualidade de dado de origem e de status de
  avaliação; a regra de duas dimensões de `evaluation-status-semantics.md`
  §5 se torna uma regra de nunca-colapsar de três vias para insumos
  neurológicos (a dimensão de atribuição do ponto 4 do §5.1 não é afetada).
- Nada aqui muda o relato permanente de que a avaliação clínica é
  não-acionante; nenhum consumidor nomeado nesta ADR é capaz de ação hoje.

### 6.4 O que decidir esta ADR desbloqueia (INFERENCE a partir de E14)

1. **Modelo de dado GCS E/V/M + NT** — contrato de captura em nível de
   componente, representabilidade de NT, vínculo com RASS pareado.
2. **Componente de gating por RASS no rule runtime** — um avaliador de
   avaliabilidade reutilizável (o precedente do CAM-ICU E6 generalizado),
   consumido pelo SOFA CNS, qSOFA, e os instrumentos de sedação/delirium.
3. **Categorias de vetor de referência CRV** — vetores de componente-NT,
   vetores confundidos-por-sedação, vetores de sedação desconhecida,
   contra-vetores de coma estrutural (C4), e a afirmação de contagem-zero do
   D1.
4. **Seções de especificação da Tarefa 2** — especificação SOFA §4.5 e
   OQ-8; insumo de consciência da especificação NEWS2 e sua questão aberta 4
   (anotação de estado de sedação, proibição de mapeamento GCS→ACVPU).

---

## 7. Implicações transversais

| Dimensão | Implicação | Rótulo de evidência | Papel titular | ID de acompanhamento |
|---|---|---|---|---|
| Segurança clínica | Esta ADR é a superfície de controle para o ramo neurológico da HAZ-0005 (ambas as direções de dano, E1/E2) e restringe a HAZ-0036 (consumidores validados em adultos). A escolha da opção determina se o estado de SNC de um paciente sedado pode alguma vez se ler como "normal" sem avaliação. | INFERENCE a partir de E1, E2, E13 | AUTH-CLINSAFETY | HAZ-0005, HAZ-0036 |
| Segurança (security) | Nenhuma fronteira de confiança nova. O contexto pareado de RASS/infusão entra pela mesma ingestão governada que outros fatos clínicos; nenhuma superfície de ataque adicional além dos controles de integridade de insumo existentes. | INFERENCE | AUTH-SECURITY | Não aplicável — nenhuma superfície nova identificada; revisitar se uma fonte de dispositivo à beira do leito for introduzida para o RASS |
| Privacidade (LGPD, minimização, propósito) | O contexto de infusão sedativa é dado de medicação — uma classe de dado nova cuja coleta deve ser justificada por este propósito (detecção de confundimento) sob minimização; o desenho de ramo-dormente (C5) evita coletá-lo antes que seja usado. | INFERENCE a partir de E12 | AUTH-PRIVACY-LEGAL | entrada de mapa de dado de privacidade pendente |
| Interoperabilidade | GCS em nível de componente (LOINC 9267-6/9270-0/9268-4 per a tabela de insumo da spec SOFA concorrente), RASS (nenhum código fixado — VALIDAÇÃO NECESSÁRIA per aquela spec), lacuna de conceito 'C' do ACVPU (spec NEWS2: a lista de respostas carece de um conceito "C" padrão). A representabilidade de NT deve sobreviver ao contrato de ingestão — um campo de inteiro apenas-total não consegue carregar esta política. | SOURCE (E14) | AUTH-DATA-PLATFORM | ADR-0013 |
| Acessibilidade | Os estados `not_evaluated (sedation_confounded)` e NT devem ser visivelmente distintos, não apenas-por-cor, e anunciados para tecnologia assistiva, como todo estado de avaliação (`evaluation-status-semantics.md` §6); a redação pt-BR para "não avaliável — sedação" é VALIDAÇÃO NECESSÁRIA com clínicos. | SOURCE (E10 §6 linha UI) | AUTH-UX | ADR-0021 |
| Operacional | Nova dimensão de monitoramento: distribuição de estado de avaliabilidade (um pico súbito em `rass_unavailable` é uma falha de fluxo de trabalho-de-registro ou de ingestão, não um evento clínico, e não deve ser silencioso — QAS-0007). | INFERENCE | AUTH-OPERATIONS | ADR-0020 |
| Custo | A captura em nível de componente e a ingestão de RASS pareado são um contrato maior do que um único inteiro de GCS; nenhum modelo de custo existe e nenhum é inventado. | VALIDAÇÃO NECESSÁRIA | AUTH-PRODUCT | pendente |
| Migração | Registros legados de GCS são apenas-total, sem contexto de avaliabilidade (E1); eles nunca podem ser classificados retroativamente e devem ser importados (se algum dia forem) como `avaliabilidade desconhecida`, nunca como `testable` — restringe a ADR-0023. | INFERENCE a partir de E1 | AUTH-OPERATIONS | ADR-0023 |

---

## 8. Reversibilidade, gatilhos de revisita, kill switch/rollback

### 8.1 Avaliação de reversibilidade

| Opção | Reversibilidade | O que fica encalhado na reversão | Custo de saída estimado | Rótulo |
|---|---|---|---|---|
| A — gating fail-closed | Alta — os estados registrados são um superconjunto do que qualquer alternativa consome; a lógica de gating é um comportamento de pacote de regras | Apenas o avaliador de gating; todo dado capturado permanece válido | Baixo-moderado | INFERENCE |
| B — imputação documentada | Baixa para o dado — escores imputados persistidos são permanentemente ambíguos no registro histórico e não podem ser separados dos medidos depois | O histórico de escore poluído (analytics, estudos de validação) | Alto (dado), baixo (código) | INFERENCE |
| C — anotação de exibição | Alta em código; os escores confundidos marcados `valid` do interim ficam encalhados como poluição não rotulada | Histórico de escore do interim | Baixo (código), alto (dado) | INFERENCE |
| Z — adiar | n/a até que um schema seja lançado; depois disso o adiamento se torna uma migração | n/a | Subindo no primeiro contrato de ingestão | INFERENCE |

SOURCE (prompt §9.1 princípio 11): "Preferir decisões reversíveis e
registrar gatilhos de extração/revisita." Observe a assimetria: A é reversível
em direção a B/C a qualquer momento; B e C são apenas parcialmente
reversíveis em direção a A porque seu dado do interim é permanentemente não
rotulado ou imputado.

### 8.2 Gatilhos de revisita

| # | Gatilho | Como é detectado | Quem é notificado | Ação no gatilho |
|---|---|---|---|---|
| T1 | Uma fonte de dado de infusão sedativa (administração de medicamento) confiável chega com granularidade de dose/tempo. | Inventário de contrato / registro de onboarding de conector | AUTH-CLINSAFETY, AUTH-DATA-PLATFORM | Ativar o ramo de gatilho de infusão dormente (C5); reexecutar as medições de C6; reabrir a formulação do gatilho se necessário |
| T2 | A medição em shadow mode/retrospectiva (C6) mostra frequência de estado confundido/NT ou encargo de `not_evaluated` fora do que a governança clínica aceitou. | O pipeline de medição de C6; dashboards QAS-0007 | AUTH-CLINSAFETY | Reabrir o D3; considerar ratificar a política parcial do §4.0.1 ou uma decisão de Opção B com escopo delimitado |
| T3 | A ADR-0008 é aceita com semântica de política parcial materialmente diferente de `evaluation-status-semantics.md` §3.2 conforme consumida aqui. | Mudança de status em adr-index.md | titular desta ADR | Reconciliar a tabela de consumidor antes da aceitação, ou reabrir se já aceita |
| T4 | Surge um método publicado e validado para escoragem de SNC ajustada por sedação (E9 registra que nenhum existe hoje). | Vigilância de evidência clínica | AUTH-CLINSAFETY | Avaliar como uma política parcial ratificada candidata, superseding o default `not_evaluated` |
| T5 | VAL-0006/VAL-0007 decidem populações pediátrica ou neonatal em escopo. | Registro do Gate G1/G2 | AUTH-CLINSAFETY, AUTH-INTENDED-USE | Esta política não se estende — instrumentos separados e uma ADR separada são requeridos (A3) |
| T6 | Um esquema de ingestão ou pacote de regras para o GCS é proposto enquanto esta ADR está indecidida. | Revisão de design / revisão de PR | AUTH-CLINSAFETY | Bloquear nesta ADR (o risco de decisão implícita do §6.2) |

### 8.3 Estratégia de kill switch / rollback

O gate de avaliabilidade é comportamento de pacote de regras e
compartilha a maquinaria de kill/rollback do rule runtime (território da
ADR-0007/ADR-0008). A restrição crítica-para-segurança específica desta ADR:
**a direção de fallback é fixa.** Se o próprio avaliador de gating falhar,
for mal configurado, ou for desligado, toda avaliação afetada dependente de
consciência resolve para `not_evaluated (reason: rule_unavailable)` per
`evaluation-status-semantics.md` §3.3 — o caminho de rollback NÃO DEVE
reabilitar escoragem não gateada ou totais coagidos, porque o comportamento
pré-gating é o hazard rejeitado, não um estado prévio seguro. Não existe
configuração em que um insumo confundido ou NT produza silenciosamente um
número; se esse invariante não puder ser mantido durante um incidente, os
escores afetados são desligados inteiramente e o modo degradado visível ao
clínico o declara. Rotulado INFERENCE; o próprio procedimento operacional é
follow-up de ADR-0020/ADR-0007.

---

## 9. Método de validação e evidência vinculada

| # | Alegação que esta ADR faz | Método de validação | Ambiente requerido | IDs vinculados |
|---|---|---|---|---|
| V1 | Nenhum consumidor consegue produzir um valor de SNC/mentação/consciência de 0, mínimo, ou "normal" a partir de um insumo NT, confundido, ou ausente (D1). | Sonda de insumo ausente SAF-0002 estendida com vetores NT e confundidos; afirmação do corpus CRV "zero desses subescores computados"; testes negativos por consumidor por estado (a tabela da Opção A do §4, um teste por célula). | Ambiente de teste, dado sintético | SAF-0001, SAF-0002; HAZ-0005; DOM-0004; TST: arquitetura de testes pendente |
| V2 | 100% das avaliações persistidas de GCS/ACVPU carregam um estado de avaliabilidade e uma razão legível por máquina (D2). | Teste de inconstrutibilidade em nível de schema (nenhuma avaliação sem-estado é construível) + consulta de auditoria de registro persistido. | Ambiente de teste | SAF-0001, SAF-0019; QAS-0007; TST: arquitetura de testes pendente |
| V3 | O gating fail-closed não suprime a detecção de deterioração neurológica verdadeira (H2). | Comparação em shadow mode contra eventos de deterioração adjudicados por clínico; requer uma fonte de dado populada, que hoje não existe (E12). | Ambiente similar-a-produção com dado clínico real ou replayed | VAL: backlog de validação pendente |
| V4 | A frequência de estado confundido/NT e o delta de encargo de alerta estão conforme a governança clínica aceitou (D3, C6). | Medição de frequência retrospectiva ou em shadow mode; relatório anexado ao registro de aceitação. | Mesmo que V3 | VAL: backlog de validação pendente; QAS-0007 |
| V5 | O gatilho de confundimento classifica corretamente os vetores de caso canônicos (coma estrutural escorado; coma sedado gateado; sedação desconhecida per a resolução de OQ-2). | Suíte de vetor de caso CRV revisada pelo revisor clínico nomeado (C4). | Ambiente de teste | SAF-0035; HAZ-0036; TST: arquitetura de testes pendente |
| V6 | A redação pt-BR dos estados confundido/NT é entendida pelos clínicos como "não avaliado", não como tranquilização ou erro de sistema. | Validação de fatores humanos com clínicos pt-BR (`evaluation-status-semantics.md` §6). | Ambiente de usabilidade | SAF-0005; VAL: backlog de validação pendente |

**Disciplina de placeholder.** Nenhum catálogo REQ/TST existe; os
placeholders são verbatim per o template. Nenhum ID HAZ, SAF, DOM, QAS, VAL
ou GDEC neste documento foi inventado; todo ID citado foi lido de
`docs/05-clinical-safety/`, `docs/03-domain/`,
`docs/06-architecture/quality-attributes/`, `docs/02-users-and-workflows/`,
ou `docs/00-governance/registers/`.

---

## 10. Relações de supersessão

- **Supersede:** nenhuma.
- **Superseded by:** nenhuma.
- **Notas de relação:** a ADR-0008 e a ADR-0026 estão sendo redigidas
  concomitantemente no ciclo 1; esta ADR as referencia de forma cruzada
  apenas por ID e não leu suas minutas. Se a semântica de política parcial
  aceita da ADR-0008 divergir de `evaluation-status-semantics.md` §3.2
  conforme consumida aqui, o gatilho T3 se aplica. Um futuro método de
  escoragem ajustada por sedação validado (T4) seria adotado via uma ADR
  superseding, não editando esta.

---

## 11. Checklist de completude (gate do revisor) — autoverificação

- [x] O ID estável corresponde ao nome do arquivo
- [ ] Linha de `adr-index.md` — **deliberadamente NÃO atualizada nesta
  mudança**: a autoria concorrente do ciclo 1 atribui a cada especialista um
  escopo de escrita de arquivo único para evitar colisões de escrita no
  índice; a reconciliação do índice (linhas ADR-0026/0027/0028, avanço do
  próximo-ID-livre além da nota obsoleta "ADR-0025") é tarefa do steward do
  adr-index e é registrada aqui como um desvio conhecido e intencional da
  regra 5 do template — não uma omissão.
- [x] Status `accepted (2026-08-15, GDEC-0007)`; decisão registrada no
  §5.0, transcrita de decision-register.md GDEC-0007
- [x] Titular, aprovadores, prazo de decisão presentes; nenhum nome
  inventado (o único humano nomeado, rodaquino-OMNI, é nomeado pela entrada
  DECIDED do registro GDEC-0003)
- [x] O autor não é um aprovador; pares de independência verificados (§
  front matter)
- [x] O contexto declara uma pergunta de decisão com fronteira de escopo
  explícita
- [x] Toda declaração material carrega um rótulo de evidência
- [x] A tabela de evidências distingue reverificado (OBSERVED: E3, E9) de
  citado (SOURCE)
- [x] As premissas têm cada uma uma condição de invalidação e um titular
- [x] Três alternativas viáveis mais adiar; toda alternativa tem tanto
  consequências positivas quanto negativas, incluindo o caso honesto a favor
  das opções argumentadas contra
- [x] Direcionadores discriminantes e mapeados para atributos de qualidade
  mensuráveis
- [x] Nenhuma meta numérica inventada; todas as metas VALIDAÇÃO NECESSÁRIA
- [x] Todas as oito linhas transversais presentes
- [x] Reversibilidade, gatilhos de revisita, kill/rollback presentes
- [x] Métodos de validação com placeholders honestos
- [x] Campos de supersessão presentes
- [x] Nenhuma tecnologia selecionada por herança do legado ou da AMH — a
  única importação legada é o precedente de *conceito* (E6), explicitamente
  rederivado do instrumento publicado (E3/E5), não da implementação legada

### 11.1 Questões abertas para o revisor clínico nomeado (rodaquino-OMNI, per GDEC-0003)

> **RESOLVIDA — 2026-08-15, GDEC-0007.** As oito questões abaixo foram
> respondidas pela autoridade nomeada na revisão do ciclo 1: OQ-1→A28-1
> (formulação de conjunção-com-exposição); OQ-2→A28-2 (**fail-closed**,
> substituindo qualquer default de escora-com-divulgação); OQ-3→A28-3
> (política intervalo-parcial aceita como única parcial ratificada);
> OQ-4→A28-4 (marcada "confundida", nunca `valid` não qualificado, sem
> supressão); OQ-5→A28-5 (RASS ≤ −3, PADIS); OQ-6→A28-6 (apenas exibição,
> idade máxima 72h, timestamp visível); OQ-7→A28-7 (janelas ratificadas: GCS
> 12h/24h, RASS 1h); OQ-8→A28-8 (convenções de exibição ratificadas, entrada
> de glossário pt-BR via ADR-0029). Ver §5.0 para o registro formal. Texto
> original preservado abaixo como registro histórico das questões colocadas.

1. **OQ-1 — Formulação do gatilho de confundimento.** A disjunção do
   revisor em REV-NS-01 §4 ("RASS ≤ −3 **ou** infusão sedativa
   ininterrupta") vs. o refinamento da spec SOFA concorrente §4.5
   (**exposição** sedativa requerida como um conjunto, para que RASS ≤ −3
   proveniente de coma estrutural seja escorado, não gateado). Qual
   formulação, e com qual definição de janela de interrupção?
2. **OQ-2 — Estado de sedação desconhecido.** GCS presente, mas RASS
   ausente e nenhum contexto de infusão (o caso comum de integração
   precoce, E12): escorar com divulgação obrigatória de "estado de sedação
   não avaliado" (a minuta 0.1.0 da spec SOFA), ou bloquear para
   `not_evaluated (rass_unavailable)`?
3. **OQ-3 — Política intervalo-parcial (§4.0.1).** A avaliação de
   predicado-decidível sobre GCS parcialmente testado (por exemplo,
   E3+M5+V-NT ⇒ GCS < 15 verdadeiro) é aceitável como a política parcial
   ratificada para a mentação do qSOFA e o SOFA CNS, ou toda avaliação
   contendo NT deve ser `not_evaluated`?
4. **OQ-4 — Consciência do NEWS2/MEWS sob sedação.** Escorar o ACVPU
   observado com a marcação `sedation_confounded` (direção de
   excesso-de-alarme, o instrumento escora o que é observado), ou resolver
   para `not_evaluated`? E uma anotação de estado de sedação é requerida em
   **todo** insumo de consciência (a questão aberta 4 da spec NEWS2)?
5. **OQ-5 — Limiar de RASS.** Confirmar ≤ −3 para o confundimento do GCS
   (sedação profunda PADIS) versus o ≤ −4 do precedente CAM-ICU
   (não-despertável-à-voz, Ely) — duas âncoras publicadas diferentes para
   dois instrumentos diferentes; tornar a diferença explícita ou unificar.
6. **OQ-6 — Último GCS pré-sedação.** É proposta a apresentação
   apenas-para-exibição: confirmar que ele nunca pode entrar em aritmética,
   e fixar sua idade máxima permissível.
7. **OQ-7 — Janelas de frescor.** Ratificar ou substituir as propostas da
   spec SOFA concorrente (GCS 12h de staleness / 24h de expiração; RASS
   dentro de 1h do GCS qualificante).
8. **OQ-8 — Exibição de modalidade.** Aprovar as convenções de
   apresentação "GCS 10T" / "E4 M6 V-NT" e suas renderizações pt-BR (V6).
