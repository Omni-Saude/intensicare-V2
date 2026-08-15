---
id: ADR-0026
title: Política clínica de insumo ausente por classe de escore — que comportamento cada classe de instrumento deve ter quando falta um insumo?
status: proposed
status_history:
  - status: proposed
    date: 2026-08-15
    by: autor dos ADRs clínicos de status de avaliação e de política de insumo ausente (ciclo 1, Tarefa 4)
    note: >
      ID ADR-0026 alocado pelo pacote de tarefa do orquestrador do ciclo 1, além dos 24
      IDs reservados; adr-index.md registrava "próximo ID livre: ADR-0025" — a
      verificação de colisão e a integração do índice são atos do orquestrador/dono da
      traceability, não deste autor (escopo de escrita restrito a este arquivo e ao
      ADR-0008). Redigido em conjunto com o ADR-0008 por um mesmo autor para garantir
      coerência do par. NENHUMA decisão é registrada; toda cláusula clínica é
      PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).
      Idioma pt-BR conforme DEC-G0-10.
date: 2026-08-15
owner: >
  rodaquino-OMNI — dono da decisão para as cláusulas CLÍNICAS deste ADR (candidato
  AUTH-CLINSAFETY, por GDEC-0003 em docs/00-governance/registers/decision-register.md).
  Dono das cláusulas não clínicas (schema de bundle, checagens de runtime):
  UNASSIGNED — VALIDATION REQUIRED
approvers:
  - rodaquino-OMNI — cláusulas clínicas (candidato AUTH-CLINSAFETY, GDEC-0003; credencial autoatestada — BLK-0002 residual)
  - UNASSIGNED — VALIDATION REQUIRED  # candidato AUTH-PRODUCT — ratificação de ADR per decision-rights.md §2
  - UNASSIGNED — VALIDATION REQUIRED  # candidato AUTH-UX — consequências de exibição por classe
decision_deadline: >
  Antes da ratificação da primeira especificação de rule release de qualquer escore
  (a política de completude por versão de regra — SAF-0003 — precisa declarar a sua
  classe) e antes do fechamento do Gate G2. Data-calendário: UNSET — VALIDATION REQUIRED.
deciding_authority_rule: >
  docs/00-governance/decision-rights.md §2, linhas "Clinical rule content ratification"
  (AUTH-CLINSAFETY — as políticas por classe SÃO conteúdo clínico) e "Architecture
  decisions (ADR ratification)". Agentes redigem; nenhum agente aceita.
independence_check: >
  decision-rights.md §3, par 1 (autor de regra ≠ aprovador clínico): este autor não
  aprova nada. A política parcial de uma classe exige aprovador clínico que não seja o
  seu autor (SAF-0003); quando rodaquino-OMNI for autor material de uma política,
  aplica-se a regra de segundo revisor de GDEC-0003. Implementador das checagens de
  completude ≠ verificador da sua evidência.
links:
  drivers:
    domain_invariants: [DOM-0004, DOM-0007, DOM-0008, DOM-0009]
    quality_scenarios: [QAS-0007, QAS-0017, QAS-0020]
    risks: ["pendente de risk-register — risco de falso negativo por ausência em rastreios (classe 3) a registrar"]
  constrains:
    requirements: ["REQ: pendente de catálogo de requisitos"]
    clinical: ["CLR: pendente do portfólio (Gate G2); CAND-0001 (NEWS2), CAND-0002 (MEWS), CAND-0003 (SOFA), CAND-0004 (qSOFA) em pathway-portfolio/candidate-inventory.md"]
    safety: [SAF-0001, SAF-0002, SAF-0003, SAF-0006, SAF-0019, SAF-0035, SAF-0040]
  hazards: [HAZ-0005, HAZ-0006, HAZ-0021, HAZ-0032, HAZ-0036, HAZ-0043]
  tests: ["TST: pendente de arquitetura de testes; vetores CRV por classe — prefixo proposto, pendente de ratificação (GDEC-0002)"]
  validations: [VAL-0006, VAL-0007, VAL-0023, VAL-0026, VAL-0027]
  adrs:
    depends_on: [ADR-0007, ADR-0008]
    feeds: [ADR-0009, ADR-0021, ADR-0024]
  gates: [G2]
  evidence:
    - docs/05-clinical-safety/legacy-review/ews/news2-review.md
    - docs/05-clinical-safety/legacy-review/ews/mews-review.md
    - docs/05-clinical-safety/legacy-review/ews/shared-findings.md
    - docs/05-clinical-safety/legacy-review/sepsis-scores/sofa-review.md
    - docs/05-clinical-safety/legacy-review/sepsis-scores/qsofa-review.md
    - docs/05-clinical-safety/legacy-review/sepsis-scores/sepse-pathway-clinical-review.md
    - docs/05-clinical-safety/legacy-review/neuro-sedation-scores/README.md
    - docs/05-clinical-safety/legacy-review/neuro-sedation-scores/REV-NS-01-gcs.md
    - docs/05-clinical-safety/legacy-review/alert-threshold-engine/engine-review.md
    - docs/05-clinical-safety/evaluation-status-semantics.md
supersedes: null
superseded_by: null
provenance:
  source_repo: intensicare-V2
  path_or_url: docs/06-architecture/adrs/ADR-0026-missing-input-clinical-policy-per-score-class.md
  commit_sha_or_version: ddac9bc (HEAD do repositório na redação; branch cycle-1/clinical-content; este arquivo não está commitado)
  section_or_lines: >
    PROMPT:119 (regra 7), PROMPT:418, PROMPT:551; revisões forenses do ciclo 1 citadas
    em links.evidence, com verificação OBSERVED registrada pelos respectivos revisores;
    g1-validation-backlog.md VAL-0006/0007/0023
  date_collected: 2026-08-15
  collector: autor dos ADRs clínicos de status de avaliação e de política de insumo ausente (ciclo 1, Tarefa 4)
  transformation: >
    reasoned-from — nenhuma re-verificação de artefato legado/AMH foi feita por este
    autor; afirmações da literatura clínica não verificadas na revisão do ciclo 1 são
    explicitamente rotuladas VALIDATION REQUIRED, jamais SOURCE.
  confidence: medium
  owner: rodaquino-OMNI (cláusulas clínicas) / UNASSIGNED — VALIDATION REQUIRED (demais)
  validation_status: VALIDATION REQUIRED
---

# ADR-0026 — Política clínica de insumo ausente por classe de escore

> **Status: proposed. Este documento apresenta classes, opções e drivers. NÃO registra
> decisão alguma.** Toda cláusula clínica é PROPOSAL — AWAITING NAMED CLINICAL REVIEW
> (reviewer: rodaquino-OMNI, GDEC-0003); aprovadores não clínicos UNASSIGNED. Este ADR
> forma um **par** com o
> [ADR-0008 — Semântica normativa do status de avaliação](./ADR-0008-evaluation-status-and-completeness-freshness-semantics.md):
> o ADR-0008 fixa a álgebra dos cinco estados, a precedência, a agregação e as
> transições temporais; **este ADR fixa o que cada classe de instrumento clínico faz
> quando falta um insumo** — e é a via pela qual a "Opção C, default A" do ADR-0008 Q1
> se instancia. Os dois devem ser aceitos, emendados e supersedidos em conjunto.

---

## 1. Contexto e formulação do problema

A regra não negociável 7 do prompt (SOURCE, `PROMPT:119`): *"Never coerce missing,
stale, invalid, partial, conflicting, or unevaluable clinical data to zero, normal,
no-risk, or silent no-fire."* Ela é o invariante — mas não é, sozinha, uma política:
dizer o que **não** fazer com um insumo ausente não diz o que **fazer**, e a revisão
forense do ciclo 1 mostra que a resposta segura difere por tipo de instrumento:

- Num **EWS agregado** (NEWS2), um total sem a frequência respiratória não é um total
  (SOURCE: `news2-review.md` §5 — o legado somava assim mesmo, com os sete insumos
  zero-coagidos).
- Num **composto multiorgânico** (SOFA), um total de 3 órgãos é *outro instrumento* com
  o mesmo nome, e a metade ausente é sistematicamente a metade aguda (SOURCE:
  `sofa-review.md` §7 — INPUT TO ADR-0008).
- Num **rastreio binário 2-de-3** (qSOFA), dois critérios presentes e positivos já
  atingem o limiar — a ausência do terceiro não pode subtrair o que os presentes
  provaram (OBSERVED-via-SOURCE: `qsofa-review.md` §2 — estrutura 2-de-3 verificada).
- Numa **enumeração de instrumento único** (GCS), não existe "parcial" — mas existe
  componente *não testável* (verbal sob intubação), que tem convenção publicada própria
  e que o legado coagia ao mínimo, prática que a fonte do instrumento proíbe (SOURCE:
  `REV-NS-01-gcs.md` §3 — "do not use 1 for missing").
- Num **predicado de via clínica**, um insumo ausente num AND/OR que resolve para
  "não disparou" é o no-fire silencioso que HAZ-0021 proíbe (SOURCE:
  `engine-review.md` §2.2 F2.1 — quatro vias de no-fire sem registro).

Uma política única para todos os casos ou proíbe demais (rastreios que não podem
disparar positivo com item faltante deixam de reconhecer deterioração — direção
insegura) ou permite demais (totais parciais de composto — o mecanismo do HAZ-0005).

**Questão.** A política clínica de insumo ausente deve ser uniforme, por classe de
escore, ou apenas por regra — e, se por classe, quais são as classes, e qual o
comportamento normativo de cada uma?

**Fora de escopo:** a álgebra de estados, precedência, agregação e transições
temporais (ADR-0008); valores de janelas/horizontes (VAL-0023, conteúdo de rule
release); seleção de quais instrumentos entram no portfólio (Gate G2); formato do
bundle que transporta a política (ADR-0007 — formato, assinatura, aprovação, ativação,
rollback e retirada de bundles de regra; em autoria concorrente; referenciado por
ID/título); gating populacional adulto/pediátrico (VAL-0006/VAL-0007 — adjacente,
não decidido aqui).

---

## 2. Evidências e premissas

### 2.1 Evidências

**Nota epistêmica.** Este ADR não re-verificou artefato algum; linhas derivadas das
revisões do ciclo 1 são `SOURCE` (citam OBSERVED de outro agente, por
`evidence-notation.md` §2). Afirmações de literatura clínica **não** verificadas pela
revisão do ciclo 1 aparecem apenas como VALIDATION REQUIRED.

| # | Rótulo | Afirmação | Fonte | Confiança |
|---|---|---|---|---|
| E1 | SOURCE | HAZ-0005 (E1 — ocorreu): ausência coagida a zero nos quatro escores legados; persistida; dirigia leito `normal`. | `hazard-log.md` HAZ-0005 | alta |
| E2 | SOURCE | NEWS2: sete insumos zero-coagidos sem marcador; comportamento afirmado por teste; nenhum metadado de ausência no resultado. RCP 2017 verificado do PDF do emissor (Charts 1-3 transcritos); **nenhuma convenção de total parcial aparece no material revisado**. | `news2-review.md` §2, §5 | alta |
| E3 | SOURCE | MEWS: mesma coerção de ausência; além disso, token AVPU inválido → 0 silencioso (presente-mas-inválido coagido ao polo reassegurador), com inconsistência por rota de ingestão. | `shared-findings.md` SF-3; `mews-review.md` via SF | alta |
| E4 | SOURCE | SOFA: (i) zero de seis componentes computáveis no snapshot AMH pinado; teto futuro labs-only de 2,5/6 componentes (12/24 pontos), sem hemodinâmica/oxigenação/consciência; (ii) recomendação do revisor: **jamais total parcial**; componentes por órgão, nunca somados; SOFA `not_evaluated` até seis componentes evidenciados em janela; (iii) ΔSOFA exige convenção de baseline ratificada; (iv) meia-ausência renal (só creatinina) era parcial silencioso dentro de componente (D-16); (v) MAP ausente com vasopressor presente descartava evidência de choque (D-07). | `sofa-review.md` §4, §6, §7 | alta |
| E5 | SOURCE | Sepsis-3 (verificado pelo revisor no artigo): baseline SOFA "assumido zero em pacientes não sabidamente portadores de disfunção orgânica preexistente" — uma convenção de ausência publicada, **restrita ao baseline**, não um licenciamento de parcial corrente. | `sofa-review.md` §3 | alta |
| E6 | SOURCE | qSOFA: estrutura 2-de-3 verificada (RR ≥22; PAS ≤100; GCS <15; positivo ≥2); a condição definicional de **suspeita de infecção** estava ausente do scorer (Q-05) — um qSOFA sem contexto é uso não evidenciado (HAZ-0036); ausência de item coagida a 0 com lista `missing_criteria` descartável. | `qsofa-review.md` §2, §4 | alta |
| E7 | SOURCE | GCS: fluxo de vitais armazena só o total; o único caminho com E/V/M **coage componente não testado ao mínimo (1)** — prática que a fonte do instrumento proíbe ("do not use 1 for missing"); a convenção publicada para componente não testável é registrá-lo **"NT (not testable)"**; um bloqueio para intubação foi contemplado no legado e nunca implementado; paciente intubado tem duas codificações possíveis, ambas erradas (omitir → 0 no SOFA-CNS; V=1 → coma espúrio). | `REV-NS-01-gcs.md` §2-§4 | alta |
| E8 | SOURCE | Instrumentos de enumeração única revisados (GCS, RASS, NRS, BPS, CAM-ICU, SDRA, FOIS) — índice e vereditos por registro; a revisão inclui análise obrigatória de confundimento sedação/intubação do GCS marcada como insumo de ADR. | `neuro-sedation-scores/README.md` §1-§2 | alta |
| E9 | SOURCE | Predicados/engine: quatro vias de no-fire silencioso sem registro (F2.1); SOFA/qSOFA estruturalmente incapazes de alertar sob configuração default (F2.2); no engine de correlação, `missing_inputs` é registrado mas um não-disparo-por-inavaliável ainda é `fired=False` sem status distinto. | `engine-review.md` §2.2, §6.1, §7 | alta |
| E10 | SOURCE | A maquinaria que este ADR instancia: `partial` só existe sob política explícita, versionada, com aprovador clínico independente (SAF-0003; `evaluation-status-semantics.md` §3.2); sem política → `not_evaluated`, nunca redução silenciosa; PROMPT:418 — subconjunto seguro é via separadamente evidenciada ou `partial`/`not_evaluated`, jamais alteração silenciosa da definição clínica. | `evaluation-status-semantics.md` §3.2; ADR-0008 §4.2-N4 | alta |
| E11 | SOURCE | HAZ-0043/SAF-0040: `not_evaluated` permanente é estado de defeito com detector, não regime; a política de ausência por classe deve conviver com o bar de admissão (fonte populada exigida antes de admitir a via). | `hazard-log.md` HAZ-0043; `safety-requirements.md` SAF-0040 | alta |
| E12 | VALIDATION REQUIRED | Convenções de manejo de ausência em SOFA seriado na literatura de ensaios (p.ex. carry-forward de último valor, assumir normal para componente ausente em séries) são citadas com frequência em protocolos de estudo, mas **não foram verificadas pela revisão do ciclo 1** — nenhuma delas pode ser adotada sem verificação de fonte primária e ratificação. | memória clínica do autor — não verificada; nenhuma fonte citável neste repositório | baixa |
| E13 | VALIDATION REQUIRED | CAM-ICU tem convenção publicada de "não avaliável" condicionada ao nível de sedação (RASS profundo), e o uso de SIRS como rastreio é matéria de recomendação de diretriz (SSC 2021) revisada em `qsofa-review.md` §6 — os detalhes pertencem aos registros respectivos e exigem verificação antes de qualquer cláusula normativa. | memória clínica do autor + `qsofa-review.md` §6 (não relido aqui) | baixa |

### 2.2 Premissas

A protocolar em `assumptions-register.md` (handoff; este ADR não cunha `ASM`).

| # | Premissa | Por que é necessária | O que a invalida | Dono |
|---|---|---|---|---|
| A1 | As cinco classes de §4.2 cobrem todos os candidatos do portfólio previsível (CAND-0001..0004 + instrumentos neuro/sedação + predicados). | A política por classe só funciona se a lista de classes for exaustiva e com dono. | Gate G2 admitindo instrumento sem classe (p.ex. escore de ML — ADR-0024). | rodaquino-OMNI — VALIDATION REQUIRED |
| A2 | O schema de bundle (ADR-0007) carregará `score_class` e a política de completude por versão de regra. | A conformidade classe→política é checável em CI apenas se o slot existir. | ADR-0007 aceito sem os campos. | autor ADR-0007 + este autor |
| A3 | O ADR-0008 será aceito com a maquinaria N4 (agregação via política de completude) e Q1 = C-com-default-A ou A pura. | Este ADR instancia aquela maquinaria. | ADR-0008 aceito com Q1 = B (parcial marcado geral) — exigiria reescrever as classes 1-2 daqui. | mesmas autoridades do par |
| A4 | O contexto clínico exigido por rastreios (suspeita de infecção para qSOFA) terá fonte de dado ou fluxo de registro próprio. | Sem contexto, a classe 3 fica permanentemente `not_evaluated`/fora de escopo (HAZ-0043). | Nenhuma fonte de contexto evidenciada até o G2. | AUTH-CLINSAFETY + AUTH-DATA-PLATFORM |

### 2.3 Hipóteses a testar

| # | Hipótese | Como seria testada | Quem testa | Status |
|---|---|---|---|---|
| H1 | O princípio de assimetria (INV-B, §4.1) é clinicamente aceitável: evidência presente pode escalar; ausência jamais reassegura. | Revisão clínica nomeada + simulação M3 (carga de alarme da via assimétrica medida). | rodaquino-OMNI + AUTH-UX | UNTESTED |
| H2 | Exibir componentes de composto sem total (classe 2) não induz soma mental indevida. | M3 (VAL-0027); compartilhada com ADR-0008 H2. | AUTH-UX + AUTH-CLINSAFETY | UNTESTED |
| H3 | A carga de alerta da regra "vermelho isolado dispara mesmo com total não computável" (classe 1) é tolerável. | Medição em sombra (shadow mode) quando existir fonte; até lá, vetores sintéticos. | AUTH-CLINSAFETY | UNTESTED |

---

## 3. Drivers de decisão e atributos de qualidade mensuráveis

| # | Driver | Por que discrimina | Atributo mensurável | Alvo |
|---|---|---|---|---|
| D1 | **Direção segura preservada por tipo de instrumento** — ausência nunca reassegura; presença positiva nunca é descartada | É o driver que a política uniforme não consegue satisfazer nas duas pontas (rastreios vs compostos). | Vetores CRV por classe: (i) nenhum vetor em que reter um insumo converta um positivo-de-limiar-atingido em negativo/no-fire (classe 3/5); (ii) nenhum vetor em que insumo ausente produza total exibido (classes 1-2); sonda de insumo ausente (SAF-0002) bloqueante | zero violações; 100% dos vetores |
| D2 | **Nenhum no-fire sem razão** | Classes 3/5 são onde o legado silenciava (E9). | SAF-0019: 100% dos no-fire com razão codificada persistida | 100% — invariante |
| D3 | **Conformidade declarável e checável** — cada rule release declara classe e política conforme | Discrimina "por classe" de "por regra apenas" (na segunda, não há contra o que checar). | Gate de schema de bundle: 100% dos releases com `score_class` + política de completude validada contra a classe | 100% (depende de A2) |
| D4 | **Consistência do modelo mental clínico** | Cinco políticas coerentes por classe são aprendíveis; N políticas por regra não são. | Estudo de compreensão M3 (VAL-0027); taxa de interpretação correta por classe | VALIDATION REQUIRED (humano) |
| D5 | **Custo de autoria e de verificação** | Uniforme é mais barato; por regra é o mais caro em revisão clínica repetida. | Nº de decisões clínicas por release (política herdada da classe vs re-litigada) | VALIDATION REQUIRED |
| D6 | **Fidelidade definicional por instrumento** (PROMPT:418) | Compostos exigem vedação; rastreios exigem a leitura correta do próprio limiar publicado. | Revisão por vetor: nenhum resultado com nome de instrumento fora da definição publicada ou de política nomeada ratificada | 100% |
| D7 | **Reversibilidade** | Apertar/afrouxar política por classe é local; mudar uma política uniforme é global. | QAS-0027 (análogo); análise §8.1 | qualitativo |

---

## 4. Alternativas consideradas

### 4.1 Invariantes transversais propostos (valem sob QUALQUER opção — PROPOSAL)

- **INV-A (restatement da regra não negociável 7 — o invariante inegociável):** nenhum
  caminho, em nenhuma classe, coage dado ausente, stale, inválido, parcial,
  conflitante ou inavaliável a zero, normal, sem-risco ou no-fire silencioso. Toda
  ausência propaga como ausência até um status explícito com razão (SAF-0001/0002;
  ADR-0008 N3/N9). Isto não é matéria de opção; as opções abaixo diferem apenas em
  **como** o comportamento seguro se organiza.
- **INV-B (princípio de assimetria — PROPOSAL ◆, aguardando rodaquino-OMNI):**
  informação incompleta pode **elevar** preocupação, nunca **rebaixá-la**. Evidência
  positiva presente (um parâmetro em banda vermelha; um subconjunto de critérios que já
  atinge o limiar do rastreio) pode escalar mesmo com co-insumos ausentes; a ausência
  dos demais jamais é usada para afastar, normalizar ou reduzir. Racional clínico: a
  lição D-07 do SOFA legado (MAP ausente descartando evidência de choque presente) na
  direção inversa — descartar evidência presente por causa de ausência alheia é o
  mesmo defeito com sinal trocado.
- **INV-C:** `invalid` ≠ ausente. Token fora de enumeração, unidade inmapeável, valor
  fisiologicamente impossível → `invalid` com razão (nunca 0, nunca descartado para
  virar `partial`) — E3/SF-3; `evaluation-status-semantics.md` §3.5; HAZ-0032.
- **INV-D:** contexto definicional é insumo. Quando a definição publicada condiciona o
  instrumento a um contexto (suspeita de infecção para qSOFA; decisão clínica de
  escala 2 para SpO2 no NEWS2), o contexto ausente torna o resultado `not_evaluated`
  (razão de contexto) ou fora de escopo (SAF-0035) — nunca um número sem qualificação
  (E6; `news2-review.md` D-3).

### Opção U — Política uniforme para todas as classes

**Descrição.** Uma única regra: qualquer insumo obrigatório ausente → `not_evaluated`;
nenhum disparo, nenhuma exibição de fragmento, em nenhuma classe.

**Contra os drivers.** D1: falha na ponta dos rastreios — um qSOFA com dois critérios
presentes e positivos e o terceiro ausente ficaria `not_evaluated` e **não
reconheceria** a deterioração que os dados presentes já provam (direção insegura;
contradiz INV-B). D2/D3: simples. D4: máxima simplicidade aparente, mas obriga o
clínico a re-derivar mentalmente o que o sistema se recusou a concluir. D5: mínimo.
D6: sobre-restrição também é infidelidade — o limiar publicado do qSOFA é atingível
com 2 de 3.

**Positivas.** Prova de segurança trivial; zero superfícies parciais.

**Negativas.** Suprime evidência presente; maximiza o volume de `not_evaluated`
(alimenta HAZ-0043); trata instrumentos epistemicamente distintos como iguais.

**O que precisaria ser verdade.** Que a supressão de positivos parciais de rastreio
fosse clinicamente aceitável — INV-B nega; ninguém a defendeu na evidência.

**Custo de saída.** Moderado: afrouxar depois por classe é possível, mas re-treina
comportamento já aprendido como "o sistema não conclui nada incompleto".

### Opção K — Política por classe (recomendada — PROPOSAL)

**Descrição.** As cinco classes de §4.2, cada uma com comportamento normativo de
ausência, consequência de exibição/alerta e racional clínico próprios. Cada rule
release declara sua classe e instancia a política dentro dos limites dela (SAF-0003);
CI valida conformidade classe→política (D3).

**Contra os drivers.** D1: satisfeito nas duas pontas (vedação de total nas classes
1-2; positividade monótona nas classes 3/5). D2: uniforme via INV-A. D3: checável.
D4: cinco padrões aprendíveis. D5: decisão clínica uma vez por classe + instanciação
leve por release. D6: cada classe honra a estrutura publicada do seu tipo de
instrumento. D7: revisões locais.

**Positivas.** É a menor estrutura que preserva a direção segura em todos os casos
evidenciados; dá ao par ADR-0008/ADR-0026 um ponto único de exceção auditável.

**Negativas.** A taxonomia de classes precisa de dono e de manutenção (instrumento
novo → classificar antes de especificar); risco de classe errada atribuída a um
instrumento (mitigação: a classe é campo do bundle aprovado pelo revisor clínico).

**O que precisaria ser verdade.** A1 (classes exaustivas para o portfólio) e A2
(slot no bundle).

**Custo de saída.** Baixo — ver §8.1.

### Opção R — Política apenas por regra (sem camada de classe)

**Descrição.** Cada rule release define sua política de ausência do zero; nenhuma
restrição de classe acima de SAF-0003.

**Contra os drivers.** D1: sem invariante estrutural além de INV-A — cada release
re-litiga a fronteira; a história legada mostra o resultado de decisões locais
("toda coerção escolheu a direção insegura", `engine-review.md` §7). D3: nada contra
o que checar além do genérico. D4: N políticas ≠ modelo mental. D5: máximo custo de
revisão clínica repetida. D7: flexível, mas a flexibilidade é o risco.

**Positivas.** Máxima adaptação caso a caso; nenhuma taxonomia a manter.

**Negativas.** Incoerência inter-instrumento provável (o mesmo padrão de ausência com
comportamentos diferentes em telas vizinhas); auditoria dispersa.

**O que precisaria ser verdade.** Que a governança clínica tenha capacidade de revisar
cada política isoladamente com consistência — contra a evidência de capacidade atual
(um revisor, GDEC-0003).

**Custo de saída.** Alto: consolidar políticas divergentes já lançadas.

### Opção Z — Adiar

**Descrição.** Nenhuma política; rule specs esperam ou improvisam.

**Positivas.** Nenhum compromisso antes do G2.

**Negativas.** Bloqueia o padrão de autoria de rule specs (cada spec precisa da
política de completude — SAF-0003); improvisação regride ao padrão legado; o par com o
ADR-0008 fica manco (a "Opção C" de lá delega para cá — adiar aqui esvazia lá).

**Custo do atraso.** Cresce com cada spec autorada; após o primeiro release ratificado
sem classe, vira retrofit.

### 4.2 As classes e suas políticas propostas (matéria da decisão — PROPOSAL ◆)

**Tabela-síntese (uma linha por classe; normativa detalhada abaixo):**

| # | Classe | Exemplares | Comportamento com insumo ausente (síntese) |
|---|---|---|---|
| 1 | EWS agregado fisiológico | NEWS2, MEWS (CAND-0001/0002) | Nenhum total com parâmetro obrigatório ausente → `not_evaluated` + lista de ausentes; parâmetro presente em banda vermelha pode escalar isoladamente (INV-B); nenhuma convenção parcial publicada identificada. |
| 2 | Composto multiorgânico | SOFA (CAND-0003) | **Nunca** total parcial; componentes por órgão com status próprios, jamais somados; total `not_evaluated` até os seis componentes evidenciados em janela; ΔSOFA só após convenção de baseline ratificada. |
| 3 | Rastreio binário de poucos itens | qSOFA (CAND-0004); SIRS (se admitido) | Positivo determinável quando critérios **presentes** já atingem o limiar (ausência nunca subtrai); resultado negativo/"afastado" exige todos os itens evidenciados; contexto definicional ausente → `not_evaluated`/fora de escopo (INV-D). |
| 4 | Enumeração de instrumento único | GCS, RASS, NRS, BPS, CAM-ICU, FOIS | Sem aferição → `not_evaluated` (não há parcial de enumeração única); componente não testável (GCS verbal sob intubação) é valor de primeira classe ("NT"), nunca coagido ao mínimo; token fora de enumeração → `invalid` (INV-C); precondições (RASS para CAM-ICU) são contexto (INV-D). |
| 5 | Predicado de via clínica | critérios de sepse; regras de correlação | Lógica trivalente: ausente = desconhecido, nunca falso; ramo satisfeito por evidência presente pode disparar (INV-B); "não disparou por inavaliável" = `not_evaluated` com razão persistida — jamais no-fire silencioso. |

#### Classe 1 — EWS agregado fisiológico (NEWS2, MEWS)

- **Ausência:** qualquer parâmetro obrigatório da versão da regra ausente ou fora de
  janela → total `not_evaluated`, razão `missing_required_input:<param>` (ou
  `stale_input:<param>`), com a lista completa de ausentes exibível (E2; a exigência de
  "dizer *quais* componentes faltaram" já consta de CAND-0002).
- **Convenção parcial publicada:** **nenhuma identificada** para o total NEWS2 no
  material do emissor revisado (E2). Afirmar inexistência categórica exige varredura
  dedicada — VALIDATION REQUIRED; até lá, nenhuma política parcial de classe 1 é
  proponível por falta de base publicada.
- **Exibição:** parâmetros presentes podem ser exibidos individualmente com seus
  próprios statuses e tempos (maquinaria ADR-0008 N4-i); o slot do total exibe o
  estado, nunca um número.
- **Alerta:** ◆ um parâmetro **presente** em banda vermelha (pontuação 3 individual —
  o tier "red score" do RCP) pode disparar o gatilho de parâmetro único mesmo com o
  total não computável (INV-B; H3 mede a carga). A ausência dos demais parâmetros
  jamais suprime esse gatilho. Um total baixo computado *completo* segue as bandas
  agregadas normais.
- **Racional clínico:** o agregado é uma soma ponderada desenhada para ser lida
  completa; um "total" sem RR ou sem consciência é numericamente menor por construção
  — exatamente o vetor de falsa reassurança do HAZ-0005. Já a banda vermelha isolada é
  informação positiva completa em si (o RCP lhe dá um tier próprio — E2/Chart 2).

#### Classe 2 — Composto multiorgânico (SOFA)

- **Ausência:** qualquer componente de órgão ausente → total `not_evaluated`, razão
  por componente. **Vedado total parcial em qualquer estado de fonte** (E4 — Opção A
  do ADR-0008 Q1 vinculante para esta classe). O fragmento computável, se a governança
  quiser exibi-lo, aparece como **componentes por órgão, cada um com status e
  atualidade próprios, jamais somados** — e sem o rótulo "SOFA" para o conjunto
  (PROMPT:418: subconjunto = via separadamente nomeada e evidenciada).
- **Parcial dentro de componente:** o componente renal com apenas creatinina (sem
  débito urinário) é *ele próprio* um parcial e deve ser explícito: ou a versão da
  regra ratifica a convenção intra-componente com citação, ou o componente é
  `not_evaluated` (E4-iv/D-16 — o parcial silencioso intra-componente do legado é
  REJECT).
- **Convenções publicadas:** o baseline-zero de Sepsis-3 é verificado e restrito ao
  baseline (E5); convenções de carry-forward/assumir-normal em SOFA seriado são
  E12 — VALIDATION REQUIRED, não adotáveis sem verificação primária e ratificação.
- **Δ-escore:** ΔSOFA (critério diagnóstico de Sepsis-3) exige convenção de baseline
  ratificada **antes de existir**; um Δ sobre subconjuntos variáveis de componentes é
  vedado (E4-iii: "um composto descrevendo um estado de paciente que nunca existiu").
- **Exibição/alerta:** slot de total mostra estado; alertas de composto só sobre total
  `valid`; tendências por componente (p.ex. plaquetas) pertencem à classe do insumo,
  não ao composto.
- **Racional clínico:** a validade prognóstica do SOFA está no agregado de seis
  órgãos; a metade indisponível no cenário real de fontes é sistematicamente a metade
  **aguda** (hemodinâmica, oxigenação, consciência) — um parcial labs-only pontua
  menos exatamente quando o eixo em falência é o não medido (E4).

#### Classe 3 — Rastreio binário de poucos itens (qSOFA; SIRS se admitido)

- **Ausência com positividade atingida:** ◆ se os critérios **presentes e
  evidenciados** já satisfazem o limiar publicado (qSOFA: 2 de 3), o rastreio pode
  produzir a determinação **positiva** — a política de completude da versão da regra
  declara os subconjuntos suficientes para o ramo positivo (maquinaria SAF-0003/
  ADR-0008 N4-ii). Não é "parcial encoberto": é a estrutura publicada do próprio
  instrumento — critérios ausentes só poderiam *somar*, nunca subtrair (INV-B).
- **Negativo exige completude:** ◆ um resultado "negativo/afastado" (ou "baixo
  risco") **só** com todos os itens evidenciados e em janela; com item ausente e
  limiar não atingido pelos presentes, o resultado é `not_evaluated` (razão por item)
  — nunca "negativo". A assimetria é o núcleo da classe.
- **Contexto definicional:** qSOFA é condicionado a suspeita de infecção e a cenário
  não-UTI na definição publicada (E6, Q-05/Q-06); contexto ausente → `not_evaluated`
  (razão de contexto) ou fora de escopo (SAF-0035/HAZ-0036). SIRS: inclusão no
  portfólio e papel de rastreio são matéria do G2 e das diretrizes revisadas em
  `qsofa-review.md` §6 (E13) — nenhuma cláusula SIRS específica é proposta aqui.
- **Exibição/alerta:** o positivo-com-ausente exibe quais critérios o sustentam e
  quais estão ausentes; alerta do positivo permitido; nenhuma exibição de "0 de 3"
  quando itens faltam.
- **Racional clínico:** rastreios existem para *não perder* deterioração; suprimir um
  positivo já provado por causa de um item faltante inverte a função do instrumento.
  O inverso (afastar com dados faltando) é a falsa reassurança clássica.

#### Classe 4 — Enumeração de instrumento único (GCS, RASS, NRS, BPS, CAM-ICU, FOIS)

- **Ausência:** sem aferição registrada → `not_evaluated`. Não existe "parcial" de uma
  enumeração única — o estado intermediário honesto é a ausência declarada.
- **Subcomponentes (GCS E/V/M):** total só com os três componentes testáveis
  presentes; **componente não testável é valor de primeira classe** (convenção
  publicada "NT", p.ex. verbal sob intubação — E7), representado explicitamente e
  jamais coagido ao mínimo (a prática legada de V=1 para não testado é REJECT — E7).
  Como pontuar um total com componente NT (p.ex. notação "GCS 8T") é convenção
  clínica a ratificar com citação — VALIDATION REQUIRED; até lá, componente NT ⇒
  total `not_evaluated` com razão `component_not_testable`.
- **Precondições:** instrumentos condicionados a outro instrumento (CAM-ICU condicionado
  ao nível de sedação/RASS — E13) tratam a precondição como contexto (INV-D): precondição
  não satisfeita ou ausente → estado "não avaliável" explícito com razão, conforme a
  convenção publicada do instrumento (verificação nos registros REV-NS — VALIDATION
  REQUIRED).
- **Token inválido:** valor fora da enumeração (AVPU desconhecido; GCS fora de 3-15)
  → `invalid`, nunca 0, nunca o vizinho mais próximo (INV-C; E3).
- **Exibição/alerta:** exibe-se a enumeração aferida + status; consumo por outros
  escores (GCS no SOFA/qSOFA) herda o status do insumo — um GCS `not_evaluated`
  propaga ausência ao consumidor, jamais 0 (E7: as duas codificações legadas do
  intubado eram ambas erradas).
- **Racional clínico:** nessas escalas o valor *é* o achado do exame; um default é uma
  aferição fabricada. O caso NT mostra por que "ausente" e "não testável" são estados
  clínicos diferentes que a razão codificada deve distinguir.

#### Classe 5 — Predicado de via clínica (critérios de sepse; regras de correlação)

- **Ausência em árvore lógica:** ◆ avaliação trivalente (verdadeiro / falso /
  desconhecido): insumo ausente = **desconhecido**, nunca falso. Um AND com
  desconhecido não é falso; um OR com um ramo verdadeiro **presente** é verdadeiro e
  pode disparar (INV-B). O predicado inteiro só é "não satisfeito" quando isso é
  demonstrável com todos os termos necessários evidenciados.
- **No-fire:** todo não-disparo registra razão codificada persistida; não-disparo
  **por inavaliável** é `not_evaluated` do predicado — estado distinto de "avaliado e
  não satisfeito" (E9: o `fired=False` indistinto do engine de correlação é o
  anti-padrão; HAZ-0021).
- **Exibição/alerta:** vias exibem qual termo sustentou o disparo e quais termos
  estavam desconhecidos; supressões transparentes (SAF-0022 via ADR-0009).
- **Racional clínico:** o predicado é a camada onde o silêncio mata a auditoria — "não
  disparou porque avaliou e afastou" e "não disparou porque não pôde avaliar" têm
  condutas clínicas diferentes e devem ser distinguíveis à beira-leito e na revisão de
  incidente.

### 4.3 Comparação contra os drivers

| Driver | U — uniforme | K — por classe | R — por regra | Z — adiar |
|---|---|---|---|---|
| D1 direção segura | falha nos rastreios (suprime positivo provado) | satisfeito nas duas pontas | dependente de cada autor | regressão provável |
| D2 no-fire com razão | ok (INV-A) | ok (INV-A) | ok se cada regra lembrar | — |
| D3 conformidade checável | trivial | checável contra a classe | nada além do genérico | — |
| D4 modelo mental | simples porém enganoso (sistema "não conclui nada") | 5 padrões aprendíveis | N padrões | — |
| D5 custo de autoria | mínimo | 1 decisão/classe + instância leve | máximo (re-litiga por release) | atraso crescente |
| D6 fidelidade | sobre-restringe rastreios | honra cada estrutura publicada | variável | — |
| D7 reversibilidade | global | local | dispersa | n/a |

**Recomendação (PROPOSAL — aguardando rodaquino-OMNI): Opção K**, com as políticas de
§4.2 e os invariantes de §4.1. Não é decisão.

---

## 5. Decisão e escopo

> **NENHUMA DECISÃO ESTÁ REGISTRADA.** Este ADR apresenta classes, opções e drivers.
> Preencher esta seção é reservado às autoridades nomeadas no front matter:
> rodaquino-OMNI para as cláusulas clínicas (GDEC-0003); aprovadores não clínicos
> UNASSIGNED.

### 5.1 Condições que devem ser satisfeitas antes da aceitação

| # | Condição | Dono | Evidência que a fecha | Status |
|---|---|---|---|---|
| C1 | Revisão clínica nomeada de INV-B e das cinco políticas de classe (◆), inclusive as questões abertas de §12. | rodaquino-OMNI (GDEC-0003) | Registro de revisão com disposição por cláusula | OPEN |
| C2 | Aceitação conjunta com o ADR-0008 (A3; o par não pode divergir). | mesmas autoridades | Aceitação registrada dos dois | OPEN |
| C3 | Slot `score_class` + política de completude no schema de bundle (A2; ADR-0007). | autor ADR-0007 | Referência cruzada verificada | OPEN — ADR-0007 em autoria concorrente |
| C4 | Verificações VALIDATION REQUIRED de convenções publicadas usadas normativamente (NT do GCS já verificado — E7; total-com-NT, CAM-ICU/RASS, carry-forward SOFA, convenção parcial NEWS2) resolvidas ou explicitamente adiadas com registro. | rodaquino-OMNI + revisores dos registros REV-NS | Citações primárias anexadas aos rule releases | OPEN |
| C5 | Aprovadores não clínicos nomeados. | Gate G0 residual | authority-model.md | OPEN |
| C6 | Taxonomia de classes com dono designado (quem classifica instrumento novo). | AUTH-CLINSAFETY | Registro de dono | OPEN |

---

## 6. Consequências

### 6.1 Positivas

- Toda rule spec do ciclo ganha um padrão de autoria: declarar classe → herdar
  política → instanciar insumos/janelas — em vez de re-litigar ausência a cada spec.
- As duas direções de erro do legado (reassurança por ausência; supressão de evidência
  presente) ficam ambas vedadas por invariantes nomeados (INV-A/INV-B).
- O checador de CI ganha um alvo concreto (classe → política conforme — D3).

### 6.2 Negativas

- INV-B (assimetria) pode elevar a carga de alarme (H3) — precisa de medição antes de
  qualquer uso acionável; a mitigação (orçamentos de alerta) pertence ao ADR-0009.
- A taxonomia de classes é um artefato vivo a manter (C6); classe atribuída errada é
  um novo modo de falha (mitigado por revisão clínica do campo no bundle).
- Cláusulas dependentes de convenções ainda não verificadas (C4) não podem ser
  instanciadas de imediato — mais VALIDATION REQUIRED na fila do revisor único.

### 6.3 Neutras / estruturais

- Nada aqui admite via alguma ao portfólio (Gate G2 intocado; SAF-0040 continua
  barrando admissão sem fonte populada — E11).
- Nenhum número clínico é proposto (janelas, limiares, orçamentos: VAL-0023/G1).

### 6.4 O que a aceitação desbloqueia (desenvolvimento)

1. **Padrão de autoria de rule specs** — template por classe: campos obrigatórios da
   política de completude, ramos positivo/negativo (classe 3), componentes (classes
   2/4), termos trivalentes (classe 5).
2. **Checagens de completude no runtime** — implementáveis como validação
   parametrizada por classe (subconjuntos suficientes, vedação de soma, propagação de
   status de insumo), sem lógica ad hoc por escore.
3. **Taxonomia de vetores CRV por classe** — inclusive os vetores de regressão do
   legado já catalogados (`sofa-review.md` §6; `news2-review.md` §5; SF-3) mapeados à
   classe correspondente.
4. **Contratos de exibição por classe** para o ADR-0021 (slot de total com estado;
   componentes com status; critérios sustentadores do positivo).

---

## 7. Implicações transversais

| Dimensão | Implicação | Rótulo | Papel dono | Follow-up |
|---|---|---|---|---|
| Segurança clínica | Controle proposto de HAZ-0005 (por classe) e de HAZ-0021 (classes 3/5); INV-B é cláusula nova de segurança que exige sign-off próprio; interação com HAZ-0043 (classes com contexto indisponível não podem ser admitidas só para viver em `not_evaluated`). | INFERENCE de E1-E11 | AUTH-CLINSAFETY | HAZ-0005, HAZ-0021, HAZ-0032, HAZ-0036, HAZ-0043 |
| Segurança (security) | A classe e a política viajam no bundle assinado (ADR-0007); alterar política sem novo release é violação de integridade; nenhuma configuração de operador pode rebaixar a política de uma classe (lição SF-4: limiar configurável sem piso). | INFERENCE | AUTH-SECURITY | ADR-0007 |
| Privacidade (LGPD) | Razões e listas de ausentes usam tokens/nomes de insumo enumerados — nunca texto livre com dado de paciente (herda N3 do ADR-0008). | PROPOSAL | AUTH-PRIVACY-LEGAL | ADR-0018 |
| Interoperabilidade | A política de classe consome statuses de insumo derivados da camada anticorrupção sem colapsar qualidade de fonte em status V2 (DOM-0008); unidade inmapeável → `invalid` na fronteira (INV-C; contrato UCUM — E4/§9.2 de sofa-review). | SOURCE/INFERENCE | AUTH-DATA-PLATFORM | ADR-0013 |
| Acessibilidade | Os estados por classe (total ausente; positivo-com-ausentes; componente NT) precisam de representação não-colorimétrica e anunciável (SAF-0034); herda as obrigações do ADR-0008 N7. | PROPOSAL | AUTH-UX | ADR-0021; VAL-0033 |
| Operacional | Checagens por classe rodam no caminho quente de avaliação (custo baixo — validação de conjunto); SLI de rendimento por classe alimenta SAF-0040. | INFERENCE | AUTH-OPERATIONS | ADR-0020 |
| Custo | Antecipado e modesto (template + validação de schema); evita o custo repetido de decisão por release (D5). Nenhum modelo de custo existe; nada é inventado. | INFERENCE | AUTH-PRODUCT | pendente |
| Migração | Nenhum conteúdo legado é importado (vereditos REJECT/TRANSFORM das revisões permanecem); vetores legados entram apenas como regressão negativa. Mudança futura de classe de um instrumento exige novo release + reavaliação dos vetores. | SOURCE (revisões ciclo 1) | AUTH-CLINSAFETY | ADR-0023 |

---

## 8. Reversibilidade, gatilhos de revisita, kill/rollback

### 8.1 Avaliação de reversibilidade

| Opção | Reversibilidade | O que fica encalhado na reversão | Rótulo |
|---|---|---|---|
| U — uniforme | Moderada — afrouxar para K depois re-treina expectativa clínica formada | expectativa "sistema nunca conclui com ausência" | INFERENCE |
| K — por classe | **Alta e local** — apertar/afrouxar uma classe é revisão de uma seção + releases daquela classe; a taxonomia sobrevive | releases da classe alterada | INFERENCE |
| R — por regra | Baixa — consolidar N políticas divergentes já lançadas é retrofit clínico e técnico | políticas divergentes persistidas | INFERENCE |
| Z — adiar | n/a — custo de atraso crescente | n/a | INFERENCE |

### 8.2 Gatilhos de revisita

| # | Gatilho | Detecção | Notificar | Ação |
|---|---|---|---|---|
| T1 | Gate G2 admite instrumento sem classe (A1) — p.ex. escore de ML (ADR-0024) | registro do G2 | AUTH-CLINSAFETY | Nova classe por emenda supersessora do par |
| T2 | Medição de carga de alarme da INV-B fora do orçamento (H3) | shadow mode / QAS de carga | AUTH-CLINSAFETY + AUTH-UX | Reabrir INV-B e classe 1/3; mitigar via ADR-0009 |
| T3 | Verificação primária das convenções C4 (NT-total, CAM-ICU/RASS, carry-forward SOFA) conclui contra a cláusula proposta | registro de verificação | rodaquino-OMNI | Emendar a classe afetada |
| T4 | AMH popula fontes que mudem a computabilidade por classe (E4) | drift de contrato | AUTH-DATA-PLATFORM + AUTH-CLINSAFETY | Reavaliar políticas de classe 1/2 contra fontes reais |
| T5 | ADR-0008 aceito com Q1 ≠ C/A (A3) | aceitação do par | ambas as autoridades | Reescrever classes 1-2 antes de aceitar este |
| T6 | Evidência humana (M3) de má compreensão de "positivo com ausentes" ou de componentes-sem-total | relatório VAL-0027 | AUTH-UX + AUTH-CLINSAFETY | Reabrir exibição por classe |

### 8.3 Kill switch / rollback

Enquanto `proposed`, nada a matar. Após aceitação: uma política de classe defeituosa é
retirada **release a release** pelo mecanismo de kill/rollback do ADR-0007 — as
avaliações dos releases mortos transitam para `not_evaluated` (razão
`rule_unavailable`), jamais silêncio; o fallback clínico de qualquer rollback é o
default da Opção A herdado do ADR-0008 (total/`not_evaluated` + componentes com
status). Não existe caminho em que matar uma política produza um comportamento *menos*
conservador que o default.

---

## 9. Método de validação e evidência vinculada

| # | Alegação deste ADR | Método de validação | Ambiente | IDs vinculados |
|---|---|---|---|---|
| V1 | Nenhuma classe coage ausência (INV-A) | Sonda de insumo ausente (SAF-0002) bloqueante sobre exemplar de cada classe; vetores de regressão legados (`sofa-review.md` §6; `news2-review.md` §5; SF-3) por classe | teste (sintético) | SAF-0002, SAF-0030; HAZ-0005; QAS-0007 |
| V2 | Classe 3/5: ausência nunca converte positivo-atingido em negativo/no-fire | Vetores CRV: para cada rastreio/predicado, reter cada insumo por vez com limiar já atingido pelos presentes → determinação positiva persiste; limiar não atingido → `not_evaluated`, nunca "negativo" | teste | SAF-0019; HAZ-0021; QAS-0017 |
| V3 | Classes 1-2: nenhum total exibido com obrigatório ausente | Vetores por parâmetro/órgão retido → slot de total exibe estado; propriedade: nenhum caminho de soma alcançável com componente não-`valid` | teste | SAF-0001, SAF-0006; QAS-0007 |
| V4 | Classe 4: NT e token inválido são estados distintos e não coagidos | Vetores GCS (componente NT; V=1 espúrio como negativo), AVPU inválido → `invalid` | teste | HAZ-0032; SAF-0002 |
| V5 | Conformidade classe→política checável | Gate de schema de bundle (release sem `score_class` ou com política fora da classe falha ao carregar) | CI | SAF-0003; ADR-0007; TST: pendente |
| V6 | Compreensão clínica dos padrões por classe | Estudo M3 (VAL-0026/0027); wording pt-BR (VAL-0031 via ADR-0008 V5) | usabilidade | VAL-0026, VAL-0027 |
| V7 | Carga de alarme da INV-B tolerável | Medição em shadow mode quando houver fonte; até lá, estimativa por vetores sintéticos declarada como não-evidência | shadow/produção-like | HAZ-0016 (adjacente); VAL: pendente |

**Disciplina de placeholder.** Nenhum ID REQ/TST/CRV inventado; `TST:`/`REQ:`
permanecem placeholders verbatim; todo HAZ/SAF/VAL/CAND/QAS citado foi lido em disco.

---

## 10. Relações de supersessão

- **Supersedes:** nenhum.
- **Superseded by:** nenhum.
- **Notas de relação:** (i) **par acoplado** com o ADR-0008 — aceitação, emenda e
  supersessão conjuntas; um ADR que altere um dos dois declara o impacto no outro;
  (ii) este ADR instancia (não emenda) `evaluation-status-semantics.md` §3.2 e
  SAF-0003 — a política de classe é a camada entre o invariante e a política por
  release; (iii) dependência do ADR-0007 (slot de classe no bundle — C3); divergência
  de schema resolve-se antes da aceitação de qualquer um.

---

## 11. Autochecagem contra o gate de completude do template

Todas as seções presentes; quatro alternativas (U/K/R/Z) com consequências positivas e
negativas; drivers discriminantes com atributos mensuráveis; **nenhum alvo numérico
clínico inventado**; as oito linhas transversais presentes; reversibilidade, gatilhos
e kill presentes; validação com placeholders honestos; supersessão presente; nenhuma
tecnologia selecionada; nenhuma aprovação fabricada; nenhuma afirmação de literatura
não verificada rotulada acima de VALIDATION REQUIRED. `adr-index.md` não foi tocado
por este autor (integração e checagem de colisão de ID: orquestrador/dono da
traceability).

## 12. Questões abertas para o revisor nomeado (rodaquino-OMNI)

Nenhuma pode ser fechada por agente.

1. **INV-B (assimetria):** ratificar que evidência positiva presente pode escalar com
   co-insumos ausentes — especificamente (a) o gatilho de parâmetro vermelho isolado
   da classe 1 com total não computável, e (b) o positivo 2-de-3 da classe 3 com o
   terceiro item ausente? Se sim, com que salvaguardas de carga de alarme (H3)?
2. **Classe 2 — exibição de fragmento:** componentes por órgão podem ser exibidos
   enquanto o total está `not_evaluated`? Sob que nome (para não vestir o rótulo
   "SOFA" num subconjunto — PROMPT:418)? Ou nada de fragmento na v1?
3. **Classe 4 — GCS:** adotar "NT" como valor de primeira classe e decidir a convenção
   de total com componente NT (notação tipo "8T" vs total `not_evaluated`) — com
   citação primária a anexar (C4)? Qual política de confundimento por sedação (a
   análise de REV-NS-01 §4 aponta gate por RASS — decidir lá ou aqui)?
4. **SIRS:** entra em alguma via do portfólio (decisão G2)? Se sim, esta classe 3 o
   cobre, mas o papel de rastreio vs critério precisa da posição da diretriz revisada
   em `qsofa-review.md` §6.
5. **Δ-escores:** confirmar que nenhum Δ (ΔSOFA) existe antes de convenção de baseline
   ratificada — e quem verifica as convenções de literatura de E12 antes de qualquer
   proposta de carry-forward?
6. **Classe 5 — lógica trivalente:** ratificar "ausente = desconhecido, nunca falso"
   como normativa para todos os predicados de via, inclusive regras de correlação
   (com a distinção `fired=False-avaliado` vs `not_evaluated` persistida)?
