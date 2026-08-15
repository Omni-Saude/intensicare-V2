---
id: ADR-0008
title: Semântica normativa do status de avaliação e das transições de completude/atualidade por escore — que álgebra torna a afirmação insegura irrepresentável?
status: accepted (2026-08-15, GDEC-0007)
status_history:
  - status: not-started
    date: 2026-08-14
    by: engenheiro de arquitetura candidata e do programa de ADRs (Onda 2)
    note: ID reservado em adr-index.md (prompt §10, item 8)
  - status: proposed
    date: 2026-08-15
    by: autor dos ADRs clínicos de status de avaliação e de política de insumo ausente (ciclo 1, Tarefa 4)
    note: >
      Opções, drivers e minuta normativa redigidos a partir da proposta de cinco estados
      (docs/05-clinical-safety/evaluation-status-semantics.md), da revisão forense do
      legado (ciclo 1, Tarefa 1) e do modelo de domínio (docs/03-domain/). NENHUMA
      decisão é registrada. Toda cláusula clínica é PROPOSAL — AWAITING NAMED CLINICAL
      REVIEW (reviewer: rodaquino-OMNI). Idioma pt-BR conforme DEC-G0-10.
  - status: accepted (2026-08-15, GDEC-0007)
    date: 2026-08-15
    by: rodaquino-OMNI (revisor clínico nomeado, GDEC-0003) — transcrito pelo orquestrador clínico do ciclo 1 (escriba)
    note: >
      Decisão por escrito, em sessão, do titular nomeado, registrada em
      decision-register.md GDEC-0007 (folha de decisão do ciclo 1, §5, linhas A8-1 a
      A8-6). Opção C-com-default-A (Q1) e precedência P-a (Q2) tornam-se decisão; a
      minuta normativa N1-N9 do §4.2 torna-se anexo normativo aceito. Ver §5.0.
date: 2026-08-15
owner: >
  rodaquino-OMNI — dono da decisão para as cláusulas CLÍNICAS deste ADR (candidato
  AUTH-CLINSAFETY, por GDEC-0003 em docs/00-governance/registers/decision-register.md).
  Dono das cláusulas não clínicas (contrato de runtime, exibição, API):
  UNASSIGNED — VALIDATION REQUIRED
approvers:
  - rodaquino-OMNI — cláusulas clínicas (candidato AUTH-CLINSAFETY, GDEC-0003; credencial autoatestada — BLK-0002 residual)
  - UNASSIGNED — VALIDATION REQUIRED  # candidato AUTH-PRODUCT — ratificação de ADR per decision-rights.md §2, linha "Architecture decisions (ADR ratification)"
  - UNASSIGNED — VALIDATION REQUIRED  # candidato AUTH-UX — consequências de exibição e compreensão dos estados
decision_deadline: >
  Antes do fechamento do Gate G2 e antes da ratificação de qualquer especificação de
  rule release que dependa do contrato de status (adr-index.md §5 lista ADR-0008 como
  bloqueador de G2 e G4). Data-calendário: UNSET — VALIDATION REQUIRED.
deciding_authority_rule: >
  docs/00-governance/decision-rights.md §2, linhas "Clinical rule content ratification"
  (cláusulas clínicas — AUTH-CLINSAFETY) e "Architecture decisions (ADR ratification)"
  (AUTH-PRODUCT + dono de domínio relevante). Agentes redigem; nenhum agente aceita.
independence_check: >
  decision-rights.md §3, par 1 (autor de regra ≠ aprovador clínico): o agente autor
  deste ADR não aprova nada. Quando rodaquino-OMNI for também autor material de uma
  cláusula, aplica-se a regra de supersessão de GDEC-0003 (autor humano ≠ aprovador
  humano — segundo revisor exigido). Quem implementar o runtime de status NÃO pode
  aceitar a evidência de verificação correspondente (par implementador ≠ verificador).
links:
  drivers:
    domain_invariants: [DOM-0003, DOM-0004, DOM-0007, DOM-0008, DOM-0009]
    quality_scenarios: [QAS-0003, QAS-0007, QAS-0017, QAS-0020]
    risks: ["pendente de risk-register — risco de habituação a not_evaluated permanente (HAZ-0043) a registrar"]
  constrains:
    requirements: ["REQ: pendente de catálogo de requisitos (docs/04-product-requirements ainda não existe)"]
    clinical: ["CLR: pendente do portfólio de vias clínicas (Gate G2); CAND-0001..CAND-0004 em pathway-portfolio/candidate-inventory.md"]
    safety: [SAF-0001, SAF-0002, SAF-0003, SAF-0004, SAF-0005, SAF-0006, SAF-0019, SAF-0030, SAF-0032, SAF-0040]
  hazards: [HAZ-0005, HAZ-0006, HAZ-0021, HAZ-0032, HAZ-0038, HAZ-0039, HAZ-0040, HAZ-0043]
  tests: ["TST: pendente de arquitetura de testes; suíte de vetores CRV — prefixo proposto, pendente de ratificação (GDEC-0002)"]
  validations: [VAL-0023, VAL-0026, VAL-0027, VAL-0031]
  adrs:
    depends_on: [ADR-0005, ADR-0006, ADR-0007]
    feeds: [ADR-0009, ADR-0011, ADR-0021, ADR-0024, ADR-0026]
  gates: [G2, G4]
  evidence:
    - docs/05-clinical-safety/evaluation-status-semantics.md
    - docs/05-clinical-safety/legacy-review/sepsis-scores/sofa-review.md
    - docs/05-clinical-safety/legacy-review/ews/news2-review.md
    - docs/05-clinical-safety/legacy-review/ews/shared-findings.md
    - docs/05-clinical-safety/legacy-review/alert-threshold-engine/engine-review.md
    - docs/05-clinical-safety/hazard-log.md
    - docs/03-domain/status-dimensions.md
    - docs/03-domain/time-semantics.md
supersedes: null
superseded_by: null
provenance:
  source_repo: intensicare-V2
  path_or_url: docs/06-architecture/adrs/ADR-0008-evaluation-status-and-completeness-freshness-semantics.md
  commit_sha_or_version: ddac9bc (HEAD do repositório na redação; branch cycle-1/clinical-content; este arquivo não está commitado)
  section_or_lines: >
    INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §10 item 8; PROMPT:39, PROMPT:119 (regra 7),
    PROMPT:418, PROMPT:497-502, PROMPT:551; sofa-review.md §6-§7 (INPUT TO ADR-0008);
    news2-review.md §5; shared-findings.md SF-3/SF-5/SF-7; engine-review.md §1 e §7;
    hazard-log.md HAZ-0005/HAZ-0043; g1-validation-backlog.md VAL-0023
  date_collected: 2026-08-15
  collector: autor dos ADRs clínicos de status de avaliação e de política de insumo ausente (ciclo 1, Tarefa 4)
  transformation: >
    reasoned-from — este ADR NÃO re-verificou nenhum artefato legado nem nenhum
    artefato AMH; cita as verificações OBSERVED dos revisores forenses do ciclo 1 e da
    Onda 1 como SOURCE, conforme evidence-notation.md §2.
  confidence: medium
  owner: rodaquino-OMNI (cláusulas clínicas) / UNASSIGNED — VALIDATION REQUIRED (demais)
  validation_status: VALIDATION REQUIRED
---

# ADR-0008 — Semântica normativa do status de avaliação e das transições de completude/atualidade por escore

> **Status: `accepted (2026-08-15, GDEC-0007)`.** O revisor clínico nomeado
> (rodaquino-OMNI, GDEC-0003) decidiu, por escrito, em sessão de 2026-08-15
> (transcrição-mestre: `decision-register.md` GDEC-0007), a minuta normativa N1-N9 do
> §4.2 e a escolha Opção C-com-default-A (Q1) + precedência P-a (Q2) como decisão — ver
> §5.0 para o registro por questão (A8-1 a A8-6). Aprovadores não clínicos
> (`AUTH-PRODUCT`, `AUTH-UX`) permanecem `UNASSIGNED — VALIDATION REQUIRED` e não são
> fechados por esta aceitação.
> Este ADR e o [ADR-0026 — Política clínica de insumo ausente por classe de escore](./ADR-0026-missing-input-clinical-policy-per-score-class.md)
> foram redigidos e são aceitos **em conjunto**, como par acoplado: **este ADR fixa a
> álgebra (estados, precedência, agregação, transições temporais); o ADR-0026 fixa a
> política clínica por classe de escore que instancia essa álgebra.** Nenhum dos dois
> contradiz o outro; onde a fronteira aparecer ambígua, a regra está em §1 ("fora de
> escopo").

---

## 1. Contexto e formulação do problema

O defeito clínico mais grave confirmado no predecessor não foi um erro de fórmula: foi a
**ausência de um tipo no qual "este paciente não foi avaliado" pudesse ser expresso**.
SOURCE (`hazard-log.md` HAZ-0005, evidência E1 — *ocorreu*): com todos os insumos
clínicos ausentes, os quatro escores legados retornaram `0`, o valor foi persistido e
pôde dirigir um estado de leito `normal`. SOURCE (`engine-review.md` §1): o piso
`or "normal"` em `dashboard.py:115` exibia um paciente jamais aferido exatamente como um
paciente aferido e bem. SOURCE (`engine-review.md` §7): das quinze vias de ausência
varridas no legado, treze resolvem em direção à reassurança ou ao silêncio.

A Onda 1 produziu a proposta de semântica dos cinco estados
(`docs/05-clinical-safety/evaluation-status-semantics.md` — PROPOSAL, não ratificada), e
o ciclo 1 produziu a evidência forense por escore, incluindo o §7 de
`sofa-review.md`, marcado "INPUT TO ADR-0008". O runtime de regras, os componentes de
exibição de escore e o harness de testes de vetores de referência estão todos bloqueados
até que exista um contrato de status decidível — e o adr-index.md §5 lista este ADR como
bloqueador dos Gates G2 e G4.

**Questão.** Quais são as semânticas normativas dos cinco estados de avaliação
(`valid | partial | not_evaluated | stale | invalid`), qual a precedência quando várias
condições valem simultaneamente, como o status se agrega de componente → escore →
exibição, quais são as transições de atualidade (in-window/out-of-window, expiração,
correção, chegada tardia) — e, em particular, **um total parcial de escore pode existir,
e sob que condições?**

**Fora de escopo** (cada item nomeado para conter deriva de escopo):

- **Política clínica de insumo ausente por classe de escore** — qual classe pode ter
  política parcial, com que convenção e com que racional clínico: [ADR-0026](./ADR-0026-missing-input-clinical-policy-per-score-class.md).
- **Valores numéricos de janelas de atualidade e horizontes de expiração por insumo** —
  conteúdo clínico versionado de rule release (VAL-0023, `g1-validation-backlog.md`);
  este ADR fixa apenas a *semântica* das transições, jamais números. As especificações
  concorrentes em `docs/05-clinical-safety/rule-releases/` (sofa/`specification.md`
  §3.2; news2/`specification.md` §2.2) já propõem, como PROPOSAL, janelas e horizontes
  por insumo que descarregariam VAL-0023 por regra na ratificação — divisão consistente
  com este ADR: a semântica de N5 (§4.2) aqui; os números lá.
- Formato, assinatura, ativação e rollback de bundles de regra — ADR-0007 (formato de
  bundle de regra; em autoria concorrente; referenciado apenas por ID/título).
- Máquina de estados de alerta/work item, concorrência, escalonamento — ADR-0009.
- Modelo canônico de observação/proveniência/tempo — ADR-0005 (este ADR consome
  `time-semantics.md` como está).
- Preenchimento da matriz de mapeamento qualidade-de-fonte AMH × status V2 — dono
  próprio em `status-dimensions.md` (placeholder); este ADR apenas restata DOM-0008.
- Desenho visual dos estados na UI — ADR-0021; este ADR fixa o conjunto de estados e as
  obrigações de distinguibilidade, não o desenho.

---

## 2. Evidências e premissas

### 2.1 Evidências

**Nota epistêmica, dita uma vez e válida para toda a tabela.** Este ADR não re-verificou
nenhum artefato legado ou AMH. Toda linha derivada das revisões forenses do ciclo 1 é
rotulada `SOURCE` porque cita verificações `OBSERVED` registradas por outro agente em
documento hasheado e pinado (`evidence-notation.md` §2: só quem verificou escreve
OBSERVED).

| # | Rótulo | Afirmação | Fonte | Confiança |
|---|---|---|---|---|
| E1 | SOURCE | HAZ-0005 é **E1 — ocorreu**: todos os insumos ausentes → MEWS 0, NEWS2 0, SOFA 0, qSOFA 0, persistidos, dirigindo leito `normal`. | `hazard-log.md` HAZ-0005; `LEGACY-TA:469-478` via aquele registro | alta |
| E2 | SOURCE | No NEWS2 legado, **todos os sete insumos** são coagidos a zero quando ausentes, sem marcador, e o comportamento é *afirmado como correto pela suíte de testes*; o schema de resposta documenta o comportamento seguro ("None se dados insuficientes") que o código não implementa. | `news2-review.md` §5; `shared-findings.md` SF-7 | alta |
| E3 | SOURCE | No SOFA legado, cada componente ausente contribui 0; o curto-circuito cardiovascular descarta evidência positiva de choque (MAP ausente + vasopressor presente → CV=0); um total de 3 órgãos tem o mesmo tipo e faixa que um total de 6 órgãos; `missing_components` existe no resultado mas o modelo de persistência o descarta estruturalmente. | `sofa-review.md` §4 (D-07, D-16, D-17), §6 | alta |
| E4 | SOURCE | **Análise parcial-SOFA (INPUT TO ADR-0008):** no snapshot de evidência AMH pinado (`0a07a6f1…`), o número de componentes SOFA computáveis é **zero de seis**; no melhor futuro "labs conformes", o teto é **2 de 6 componentes completos mais metade de um terceiro** (coagulação + fígado + metade creatinina do renal), máx. 12 de 24 pontos — exatamente a metade *não aguda* do instrumento (sem hemodinâmica, sem oxigenação, sem consciência). Recomendação do revisor: **jamais computar um total parcial**; fragmento computável, se exibido, como componentes por órgão, nunca somados; SOFA `not_evaluated` até que os seis componentes tenham fontes evidenciadas e dentro de janela. | `sofa-review.md` §7.1-§7.3 | alta |
| E5 | SOURCE | **Não existe política de atualidade legada para importar**: os escores legados pontuam os campos coexistentes numa única linha de sinais vitais; nenhuma janela por insumo, nenhuma política de completude, nenhum carry-forward na via de pontuação. Este é o insumo concreto de VAL-0023. | `shared-findings.md` SF-5 | alta |
| E6 | SOURCE | Além da ausência, o legado coage **tokens inválidos** ao polo reassegurador (AVPU não reconhecido → 0 no MEWS; "C" via HL7 → None → 0 nos dois instrumentos), com inconsistência por rota de ingestão. | `shared-findings.md` SF-3 | alta |
| E7 | SOURCE | A proposta de cinco estados existe como PROPOSAL, com: entrada/saída por estado, regra de fallback (`not_evaluated` como default honesto), precedência proposta `invalid > not_evaluated > stale > partial > valid`, regra de expiração (`stale` → `not_evaluated` além do horizonte), proibições P-1..P-8 e a regra das duas dimensões (§5). | `evaluation-status-semantics.md` §3, §4, §5 | alta |
| E8 | SOURCE | O vocabulário de cinco estados é prescrito pelo prompt (`PROMPT:39`, `PROMPT:500`), origina-se de uma recomendação de remediação do assessor legado (IC-002) e **não é um conjunto de termos de padrão externo**; sua suficiência exige confirmação clínica (p.ex. estado `conflicted`, `PROMPT:672`). | `evaluation-status-semantics.md` §1 | alta |
| E9 | SOURCE | Duas dimensões independentes: qualidade de dado da fonte (AMH `valid \| warning \| quarantined`) e status de avaliação V2 **nunca colapsam** (DOM-0008); a matriz de mapeamento é placeholder com dono próprio; combinação não mapeada falha fechada para `not_evaluated`/`invalid`. | `status-dimensions.md`; `PROMPT:497-502` | alta |
| E10 | SOURCE | Doze pontos temporais distintos; instantes em UTC preservando offset/precisão/valor-fonte; **nunca inventar timestamp de fonte** (DOM-0009); `Evaluated` vincula-se ao conjunto de fatos `Persisted` naquele instante; correção posterior não reescreve um `EvaluationRecord` passado — apenas dispara nova avaliação (DOM-0003). | `time-semantics.md` | alta |
| E11 | SOURCE | HAZ-0043: uma via admitida sem fonte populada roda **permanentemente** em `not_evaluated` e a permanência é habituada como quietude reasseguradora; SAF-0040 exige que não-avaliação persistente seja estado de defeito com detector próprio, jamais estado de regime. | `hazard-log.md` HAZ-0043; `safety-requirements.md` SAF-0040 | alta |
| E12 | SOURCE | Requisitos de segurança já propostos que este ADR operacionaliza: SAF-0001 (resultado sem status é inconstruível), SAF-0002 (nenhum default numérico/categórico para ausente — sonda de insumo ausente **bloqueante**), SAF-0003 (política de completude versionada e aprovada por versão de via), SAF-0004 (atualidade computada do tempo clínico de fonte, nunca de recebimento), SAF-0005 (status/tempo/ausência visíveis onde o valor aparece), SAF-0006 (agregado nunca mais reassegurador que seu membro menos avaliado). | `safety-requirements.md` §A, §B | alta |
| E13 | SOURCE | QAS-0007 fixa a medida: contagem de defeitos de coerção encontrados por testes de vetores de referência **deve ser zero**; a visibilidade é "invariante vinculante, não um ajustável — DOM-0004 não admite orçamento de erro". | `quality-attribute-scenarios.md` QAS-0007 | alta |

### 2.2 Premissas

Cada premissa deve ser protocolada em
`docs/00-governance/registers/assumptions-register.md`; **este ADR não cunha IDs `ASM`**
(catálogo de cunhagem é o registro; cunhagem concorrente colidiria). Protocolar é item de
handoff.

| # | Premissa | Por que é necessária | O que a invalida | Dono |
|---|---|---|---|---|
| A1 | O vocabulário de cinco estados é suficiente para o portfólio que o Gate G2 aprovar. | Todo o contrato abaixo assume cinco estados + razões codificadas. | Demonstração clínica de que um sexto estado de primeira classe (p.ex. `conflicted`) é necessário para leitura segura (E8; questão aberta Q3 em §12). | rodaquino-OMNI (clínico) — VALIDATION REQUIRED |
| A2 | Cada rule release declarará janelas de atualidade e horizonte de expiração por insumo (fechamento de VAL-0023 por versão de regra). | As transições temporais de §4.2 não são executáveis sem janelas declaradas. | Rule releases sem slots de janela; ADR-0007 aceito sem esses campos no schema de bundle. | rodaquino-OMNI + autor do ADR-0007 — VALIDATION REQUIRED |
| A3 | Clínicos distinguem, com desenho adequado, `not_evaluated` de baixo risco (VAL-0027) e compreendem o pt-BR dos estados (VAL-0031). | A segurança do contrato depende de compreensão, não só de renderização. | Estudo M3 mostrando confusão persistente entre estados. | AUTH-UX + AUTH-CLINSAFETY — UNASSIGNED |
| A4 | O runtime pode recomputar status dependente de tempo na leitura/exibição dentro dos orçamentos de latência. | A cláusula "status congelado na escrita é proibido para `stale`" (§4.2) tem custo operacional. | Medição em G4 mostrando inviabilidade; exigiria varredura assíncrona com SLA declarado, não abandono da cláusula. | AUTH-OPERATIONS — UNASSIGNED |
| A5 | A matriz de mapeamento AMH DQ × status V2 será preenchida pelos seus donos designados; até lá vale o fail-closed de `status-dimensions.md`. | O status V2 restringe-se, mas não se deriva, da qualidade de fonte. | Colapso das dimensões em qualquer schema ou enum (HAZ-0040). | donos da matriz — UNASSIGNED |

### 2.3 Hipóteses a testar

| # | Hipótese | Como seria testada | Quem testa | Status |
|---|---|---|---|---|
| H1 | Hoje **não existe** política parcial clinicamente aprovável para nenhum escore candidato (não há fonte populada contra a qual aprová-la — E4). | Reavaliar a cada mudança de evidência de fonte AMH (gatilho T4, §8.2). | arquiteto de compatibilidade AMH + revisor clínico | NÃO REFUTADA no snapshot atual |
| H2 | Exibir componentes por órgão *sem* total é compreensível e não induz soma mental indevida. | Simulação M3 com clínicos pt-BR (VAL-0027). | AUTH-UX + AUTH-CLINSAFETY | UNTESTED |
| H3 | Recomputação de `stale` na leitura cabe no orçamento de latência de projeção. | Bancada de carga na fase G4. | engenharia de plataforma | UNTESTED |

---

## 3. Drivers de decisão e atributos de qualidade mensuráveis

Alvos numéricos clínicos são `VALIDATION REQUIRED` (Gate G1); os alvos estruturais
abaixo derivam de invariantes já propostos (DOM-0004 "não admite orçamento de erro" —
E13) e não são invenção deste ADR.

| # | Driver | Por que discrimina | Atributo mensurável | Alvo |
|---|---|---|---|---|
| D1 | **Irrepresentabilidade da afirmação insegura** — um valor clínico sem status não pode existir | As opções diferem em quantos caminhos permitem que um número "sozinho" chegue a um consumidor (opção B cria totais parciais numéricos; A não). | QAS-0017; teste de tipo/schema: resultado sem status é inconstruível e inserializável (SAF-0001) | 100% — invariante vinculante |
| D2 | **Zero coerção silenciosa e zero parcial silencioso** | Núcleo do HAZ-0005. Mede diretamente as opções da Q1. | QAS-0007: contagem de defeitos de coerção em vetores de referência; sonda de insumo ausente (SAF-0002) como gate bloqueante (SAF-0030); **100% dos vetores com insumo obrigatório ausente produzem status não-`valid`**; **zero exibições de total parcial sem política parcial ratificada** | zero defeitos; 100% dos vetores |
| D3 | **Distinguibilidade clínica de `not_evaluated` vs baixo risco** | HAZ-0005/HAZ-0043: o estado deve ser lido como "olhe para cá", nunca como quietude. | QAS-0007 (proporção de estados visivelmente distintos sem cor isolada); estudo de compreensão M3 (VAL-0027, VAL-0031) | VALIDATION REQUIRED (humano) |
| D4 | **Monotonicidade de agregação** — agregado nunca mais reassegurador que o pior membro | Discrimina as regras de precedência e de roll-up (Q2 e §4.2-N4). | SAF-0006 como teste de propriedade: injetar membro de status pior nunca melhora a categoria agregada | 100% — invariante |
| D5 | **Determinismo e replay** — mesmos fatos persistidos + mesmo instante de relógio ⇒ mesmo status | Exclui semânticas dependentes de ordem de chegada ou de relógio de recebimento. | QAS-0020 (DOM-0003): replay bit-a-bit do status; divergência = defeito | zero divergência |
| D6 | **Fidelidade definicional do instrumento** (PROMPT:418: jamais alterar silenciosamente a definição clínica) | Pesa contra a opção B (um total parcial "SOFA" é outro instrumento com o mesmo nome — E4). | Revisão clínica por vetor: nenhum resultado rotulado com o nome do instrumento sem satisfazer a definição publicada ou uma política parcial nomeada e ratificada | 100% |
| D7 | **Custo/complexidade de runtime, UI e autoria** | Estados e transições devem ser enumeráveis e totais; opção C adiciona uma camada (classe) que A pura não tem; B adiciona semântica de piso por escore. | QAS-0003 (latência de avaliação não materialmente afetada); nº de ramos por estado no runtime; nº de estados de componente de UI | VALIDATION REQUIRED (G4) |

**Excluído como não discriminante:** "o legado fazia assim" — proibido como argumento
(prompt §3, regra 14 por analogia; toda herança legada aqui é catálogo de falhas, E1-E3, E6).

---

## 4. Alternativas consideradas

A questão contestada central é a **Q1 (totais parciais)**; a **Q2 (precedência)** tem
duas ordenações defensáveis e é apresentada em seguida. As demais cláusulas (definições
por estado, agregação, transições temporais, interação com alertas) têm uma única
formulação séria compatível com os invariantes já propostos e são apresentadas como
minuta normativa em §4.2 — igualmente PROPOSAL, igualmente sem decisão registrada.

### Q1 — Um total parcial de escore pode existir?

#### Opção A — Nunca computar total parcial; apenas statuses por componente

**Descrição.** Um total de escore existe somente quando **todos** os componentes
exigidos pela versão da regra estão `valid` e dentro de janela. Em qualquer outra
condição o total é `not_evaluated` (com razão listando o que falta), e o fragmento
computável, se exibido, aparece como **componentes individuais, cada um com seu próprio
status e sua própria atualidade — jamais somados**. É a recomendação do revisor de
sepse (E4, `sofa-review.md` §7.3).

**Contra os drivers.** D1/D2: máxima — nenhum número parcial existe para vazar. D3:
forte — `not_evaluated` aparece com frequência honesta. D4/D5: simples de provar. D6:
máxima — o nome do instrumento nunca rotula um subconjunto. D7: runtime mais simples;
custo deslocado para a UI (exibir componentes sem total) e para o clínico (nenhum
resumo quando faltam dados).

**Consequências positivas.** A afirmação insegura ("parcial lido como total baixo") é
irrepresentável; alinhada à lição central do HAZ-0005 (um número baixo produzido de
ausência lê-se como reassurança).

**Consequências negativas.** Com fontes pobres, quase tudo fica `not_evaluated` —
risco de habituação (HAZ-0043) se admitido prematuramente; joga *toda* a informação
parcial para o nível de componente, o que pode subutilizar sinal clínico legítimo
(p.ex. tendência de plaquetas); rigidez uniforme ignora que classes de escore têm
riscos distintos (um rastreio 2-de-3 positivo com item faltante é epistemicamente
diferente de um composto de 6 órgãos com 3 faltantes).

**O que precisaria ser verdade.** Que nenhuma classe de escore tenha uso parcial
clinicamente defensável — o ADR-0026 examina exatamente isso e encontra ao menos um
contraexemplo estrutural (rastreios binários: positivo atingido com itens presentes).

**Custo de saída.** Baixo→moderado: afrouxar depois (A→C/B) é aditivo; ver §8.1.

#### Opção B — Totais parciais permitidos, com marcação obrigatória e semântica de piso

**Descrição.** Um total pode ser computado sobre o subconjunto disponível, sempre em
status `partial`, com: marcação visual/status obrigatória e não-colorimétrica; lista
explícita dos ausentes; **semântica de piso** declarada ("o valor verdadeiro é ≥ o
exibido, dado que componentes ausentes só poderiam somar"); direção de incerteza
declarada por instrumento.

**Contra os drivers.** D1: satisfeito formalmente (o número carrega status `partial`),
mas o número existe e ancora. D2: exige disciplina de exibição perfeita em todas as
superfícies (P-6/P-7 de `evaluation-status-semantics.md` §4) — cada projeção, export e
notificação vira ponto de falha. D3: enfraquecido — um "SOFA 2 (parcial)" num paciente
em choque vasopressor-dependente é o D-07 em escala de portfólio (E4). D6: violado a
menos que cada total parcial seja um instrumento separadamente nomeado e evidenciado
(PROMPT:418) — o que colapsa B numa variante cara de C. D7: semântica de piso não é
verdadeira para todo instrumento (componentes NEWS2 de SpO2 escala 2 não são monótonos
na mesma direção; a "direção de incerteza" precisa de prova por instrumento).

**Consequências positivas.** Aproveita sinal parcial; menos telas "vazias".

**Consequências negativas.** A âncora numérica é o mecanismo exato do dano legado; a
prova de segurança se espalha por toda superfície de exibição; ΔSOFA fica
não-ancorável (subconjuntos diferentes em dias diferentes — E4); custo de validação
humana por instrumento e por superfície.

**O que precisaria ser verdade.** Evidência humana (M3) de que a marcação impede
ancoragem — hoje inexistente (VAL-0027 aberta); e prova de monotonicidade por
instrumento.

**Custo de saída.** Alto: retirar totais parciais depois de exibidos é contração de
produto com re-treinamento clínico e re-baselining de métricas.

#### Opção C — Política por classe de escore: este ADR fixa a maquinaria; ADR-0026 fixa a política clínica por classe

**Descrição.** Este ADR fixa as regras invariantes: (i) `partial` **só existe** sob
política parcial explícita, versionada e ratificada por aprovador clínico independente,
embutida no rule release (SAF-0003; `evaluation-status-semantics.md` §3.2); (ii) na
ausência de política, o resultado é `not_evaluated` — **o default de toda classe é a
Opção A**; (iii) qual classe *pode* ratificar política parcial, com que convenção e com
que racional, é matéria do [ADR-0026](./ADR-0026-missing-input-clinical-policy-per-score-class.md),
instanciada por rule release. Para compostos multiorgânicos (SOFA), o ADR-0026 propõe
vedação de total parcial (Opção A vinculante para a classe), honrando E4.

**Contra os drivers.** D1/D2: iguais a A no default; a superfície de risco de B só se
abre onde uma política nomeada, com dono e vetores, existir. D3: preservado. D6:
satisfeito — a política parcial ratificada *é* a definição separadamente evidenciada
que PROMPT:418 exige. D7: adiciona a camada "classe", mas ela já é necessária para o
padrão de autoria de rule specs (ADR-0026 §"o que desbloqueia").

**Consequências positivas.** Mantém a direção segura como default estrutural; dá à
governança clínica um lugar único e auditável para exceções; coerente com SAF-0003, que
já exige política de completude por versão de via.

**Consequências negativas.** Duas camadas de documento (álgebra aqui, política lá) —
risco de contradição entre os pares se editados separadamente (mitigação: autoria
conjunta agora, e §10 exige supersessão conjunta); a palavra "classe" precisa de dono e
de lista fechada (ADR-0026 §5).

**O que precisaria ser verdade.** Que as classes do ADR-0026 sejam exaustivas para o
portfólio aprovado e que o schema de bundle (ADR-0007) carregue o slot de política de
completude (A2, A4).

**Custo de saída.** Baixo para apertar (C→A: revogar a possibilidade de política
parcial é remoção de cláusula); alto para afrouxar além de B.

#### Opção Z — Adiar

**Descrição.** Não decidir semântica; cada rule spec e cada componente de UI decide
localmente, ou o desenvolvimento espera.

**Consequências positivas.** Nenhum compromisso prematuro antes do portfólio G2.

**Consequências negativas.** É a condição que produziu o legado: sem tipo comum, cada
ponto de chamada inventa uma coerção, e a evidência mostra que "toda coerção escolheu a
direção insegura" (`engine-review.md` §7). Bloqueia runtime, UI e harness CRV
(adr-index: ADR-0008 bloqueia G2/G4). O custo de adiar não é neutro: é regressão
provável ao padrão inseguro.

**Custo do atraso.** Sobe a cada artefato que nasce sem o contrato; após os primeiros
registros persistidos, vira migração.

### Q2 — Precedência de resolução quando várias condições valem simultaneamente

O pacote de tarefa levanta a ordenação `invalid > stale > not_evaluated > partial >
valid` como candidata; a proposta da Onda 1 é `invalid > not_evaluated > stale >
partial > valid` (E7). As duas são comparadas honestamente.

#### Opção P-a — `invalid > not_evaluated > stale > partial > valid` (recomendada — PROPOSAL)

**Justificativa.** A precedência ordena do menos ao mais reassegurador, de modo que
nenhuma combinação produza estado mais reassegurador que sua pior componente (análogo
de SAF-0006 no nível de status — E7). `not_evaluated` deve dominar `stale` porque
**`stale` ainda afirma "uma conclusão foi validamente alcançada no instante T e
envelheceu"**; se a completude nunca foi satisfeita, não existe conclusão para estar
envelhecida — exibir `stale` implicaria uma aferição prévia válida que nunca ocorreu
(fabricação de reassurança retrospectiva). A informação útil que `stale` carrega
(idade, última aferição válida) não se perde: ela viaja nos metadados/razões do
`not_evaluated` ("última avaliação válida: T; motivo atual: insumo X ausente").
`invalid` domina tudo: integridade em dúvida torna qualquer outra leitura inutilizável
(`evaluation-status-semantics.md` §3.5: proibido rebaixar `invalid` a `partial`
descartando o insumo ofensor).

**Fraqueza honesta.** Num fluxo em que o clínico pergunta "quando foi a última vez que
este paciente foi avaliado?", `stale` é mais informativo como *estado de topo*; P-a
responde isso por metadado, não por estado — exige que a UI exponha o metadado
(SAF-0005). É juízo clínico, não de engenharia: Q1 de §12.

#### Opção P-b — `invalid > stale > not_evaluated > partial > valid`

**Justificativa possível.** `stale` acima de `not_evaluated` privilegia informação
("existe conclusão antiga") sobre ausência.

**Objeção.** Cria a combinação insegura: insumo obrigatório ausente **agora** + outro
insumo fora de janela → estado exibido `stale`, que o leitor interpreta como "houve
avaliação válida, apenas velha" — falso. Também torna a precedência não monótona em
reassurança (um `stale` derivado pode mascarar um `not_evaluated` estrutural —
exatamente a permanência que HAZ-0043 habitua). Rejeição recomendada, registrada com a
ressalva clínica acima.

#### Opção P-z — Adiar a precedência

Deixa indefinido o comportamento do runtime em toda co-ocorrência — inaceitável para um
contrato determinístico (D5); rejeição recomendada.

### 4.1 Comparação contra os drivers (Q1)

Células qualitativas; sem pesos — nenhum dono ratificou pesos.

| Driver | A — nunca parcial | B — parcial marcado c/ piso | C — por classe (default A) | Z — adiar |
|---|---|---|---|---|
| D1 irrepresentabilidade | máxima | formal, mas número existe e ancora | igual a A no default | nula |
| D2 zero coerção/parcial silencioso | trivial de provar | prova espalhada por toda superfície | prova localizada nas exceções ratificadas | regressão provável |
| D3 distinguibilidade | forte | enfraquecida (ancoragem) | forte | — |
| D4 monotonicidade | simples | exige prova por instrumento | simples + prova local | — |
| D5 determinismo | simples | simples | simples | indefinido |
| D6 fidelidade definicional | máxima | violada salvo renomeação/evidência própria | satisfeita (política = definição separada) | — |
| D7 custo | runtime simples; UI de componentes | validação humana por instrumento/superfície | camada de classe (já necessária p/ autoria) | custo de atraso crescente |

**Decisão (GDEC-0007, 2026-08-15): Opção C com default A**, com vedação de total
parcial para compostos multiorgânicos ratificada no ADR-0026 (A26-2/A26-4); e **Opção
P-a** para a precedência. Ambas eram recomendação do autor e são agora decisão do
revisor clínico nomeado — ver §5.0.

### 4.2 Minuta normativa aceita (GDEC-0007, 2026-08-15 — anexo normativo desta ADR)

Cada cláusula N-x era uma proposta individual; todas foram aceitas como escritas pela
decisão de 2026-08-15 (GDEC-0007), sem emenda cláusula a cláusula. Cláusulas
originalmente marcadas ◆ (aguardando rodaquino-OMNI) estão, a partir desta aceitação,
**decididas** — o marcador ◆ é preservado abaixo apenas como registro histórico de
quais cláusulas eram clínicas.

**N1 — Vocabulário e relação com a proposta da Onda 1.** ◆ Este ADR **ratifica-como-
proposto** o documento `docs/05-clinical-safety/evaluation-status-semantics.md`
(definições §3.1-§3.5, proibições §4, regra das duas dimensões §5), que passa a anexo
normativo deste ADR na aceitação — com os seguintes **apertos** (emendas aditivas, sem
contradição): N2-N8 abaixo. Nada é superseded; o documento da Onda 1 permanece a fonte
das definições por estado.

**N2 — Precedência.** ◆ Conforme Q2/P-a: `invalid > not_evaluated > stale > partial >
valid`. A precedência aplica-se em toda co-ocorrência de condições **no mesmo nível**
(componente, escore, exibição). Metadados obrigatórios preservam a informação do estado
dominado (p.ex. idade e última avaliação válida quando `stale` é dominado).

**N3 — Razões codificadas.** Todo status não-`valid` carrega **ao menos uma razão
legível por máquina** de um vocabulário enumerado e versionado no rule release (p.ex.
`missing_required_input:<insumo>`, `stale_input:<insumo>`, `expired`,
`quarantined_input`, `unmappable_unit`, `unresolved_encounter`, `source_empty`,
`rule_unavailable`, `out_of_population`, `conflicting_inputs`,
`missing_clinical_time:<insumo>`, `unspecified_condition`). Razões são tokens
enumerados, **nunca texto livre** (bloqueio de PHI em razão — ver §7 privacidade).
Status sem razão é inconstruível (SAF-0019, HAZ-0021).

**N4 — Agregação componente → escore → exibição.** ◆ (i) Cada componente/insumo
avaliado carrega seu próprio status. (ii) O status do escore deriva dos statuses dos
componentes **através da política de completude da versão da regra** (SAF-0003; classe
por ADR-0026), com a restrição de monotonicidade: o status do escore nunca é mais
reassegurador (na ordem de N2) que o pior status de componente **obrigatório**.
(iii) Roll-ups de exibição (leito, unidade, fila, KPI) contam cada status não-`valid`
em categoria própria; proibido dobrar em "normal", omitir da lista ou florear para
normal (SAF-0006; P-3/P-8; `engine-review.md` §1 REJECT do piso-para-normal).
(iv) Nenhum consumidor promove status (P-7).

**N5 — Transições de atualidade (semântica; números são conteúdo de rule release —
VAL-0023).** ◆
- *Base de cálculo:* a idade de um insumo computa-se do **tempo clínico de fonte**
  (Observed/Effective, conforme o modelo do ADR-0005/`time-semantics.md`) contra o
  relógio de avaliação confiável — nunca do tempo de recebimento, nunca de ordem de
  linha (SAF-0004).
- *Dois limiares por insumo e por versão de regra:* **janela de atualidade** (dentro →
  contribui; fora → dirige o resultado a `stale` ou, conforme a política de completude,
  `partial`/`not_evaluated`) e **horizonte de expiração** (além dele, a avaliação
  transita `stale` → `not_evaluated`, razão `expired` — uma conclusão arbitrariamente
  velha não é conclusão degradada; é não-conclusão). Valores: VALIDATION REQUIRED,
  nunca propostos aqui.
- *Recomputação:* status dependente de tempo (`stale`, expiração) é **recomputado na
  leitura/exibição**, jamais congelado na escrita; projeções e caches recomputam ou
  invalidam (A4).
- *Timestamp ausente/inválido:* um insumo sem tempo clínico utilizável **não pode
  demonstrar atualidade**; nunca se assume "agora" ou tempo de recebimento (DOM-0009).
  Ele entra na política de completude como indisponível, com razão
  `missing_clinical_time` — distinta de `missing_required_input` (a distinção é
  auditável). Tempo implausível/ambíguo (skew, DST `America/Sao_Paulo`) segue
  quarentena SAF-0012 → contribui como `invalid`.
- *Relógio e fuso:* comparações em UTC normalizado com offset/precisão/valor-fonte
  preservados (`time-semantics.md`, regra de preservação §9.3).

**N6 — Correção e chegada tardia.** ◆ Um `EvaluationRecord` é imutável; correção ou
chegada tardia de insumo **nunca** reescreve status passado — dispara **nova
avaliação** vinculada ao novo conjunto de fatos persistidos (DOM-0003;
`time-semantics.md`). Se a correção invalida insumo consumido por avaliação anterior, a
avaliação anterior é marcada como superseded-por-nova-avaliação (relação explícita,
histórico visível) e todo alerta/work item derivado é reconciliado pela máquina de
estados do ADR-0009 — jamais silenciosamente retirado (HAZ-0008, HAZ-0022). Chegada
tardia que completa a completude transita o estado *corrente* de `not_evaluated` para o
que a nova avaliação produzir; o intervalo não avaliado permanece registrado.

**N7 — Interação com alertas e leito.** ◆ `not_evaluated` é **visivelmente distinto de
baixo risco** em toda superfície (HAZ-0005; VAL-0027); **proibido qualquer piso de
estado de leito para "normal"** (E1; `engine-review.md` §1); severidade/cor só é
legível quando o status é `valid` — ou `partial` sob política ratificada — (PROMPT:551,
"safety state precedes severity"; QAS-0017); todo no-fire persiste razão (SAF-0019);
supressão é transparente (SAF-0022); **`not_evaluated` persistente é sinal operacional
e gatilho de revisão de retirada** (SAF-0040; HAZ-0043), e é exibido como *vigilância
ausente*, não como via quieta.

**N8 — Duas dimensões.** Qualidade de dado da fonte e status de avaliação V2
permanecem campos separados em entidades separadas; combinação não mapeada falha
fechada (`not_evaluated`/`invalid` com razão) — restatement de DOM-0008/SAF-0032 e do
fail-closed de `status-dimensions.md`; a matriz pertence a seus donos designados.

**N9 — Fallback total.** Toda condição não coberta resolve para `not_evaluated` com
razão `unspecified_condition`, e a ocorrência é sinal operacional
(`evaluation-status-semantics.md` §3.3). Não existe caminho "desconhecido → presumir
bem".

---

## 5. Decisão e escopo

### 5.0 Decisão (GDEC-0007, 2026-08-15)

> decided_by: **rodaquino-OMNI** (revisor clínico nomeado, GDEC-0003; também titular
> interino de papéis `AUTH-*` de fase de projeto per GDEC-0004 onde pertinente).
>
> As cláusulas clínicas ◆ (N1, N2, N4-N7) e a escolha Q1/Q2 são aceitas como decisão.
> Registro por questão, per a folha de decisão do ciclo 1
> (`docs/05-clinical-safety/cycle-1-review-decision-sheet.md` §5, linhas A8-1 a A8-6):
>
> - **A8-1 →** precedência decidida: **Opção P-a** — `invalid > not_evaluated > stale >
>   partial > valid` (N2).
> - **A8-2 →** totais parciais decididos: **Opção C com default A** — `partial` só
>   existe sob política parcial explícita, versionada e ratificada por classe
>   (instanciada no ADR-0026); ausência de política ⇒ `not_evaluated`.
> - **A8-3 →** `conflicted` decidido como **razão de `invalid`**
>   (`conflicting_inputs`), não sexto estado de primeira classe (N3).
> - **A8-4 →** confirmada a transição `stale` → `not_evaluated` no horizonte de
>   expiração, razão `expired`; os dois limiares (janela e horizonte) permanecem
>   `VALIDATION REQUIRED` por insumo e por versão de regra — nenhum número é decidido
>   aqui (N5).
> - **A8-5 →** confirmado: parâmetro-vermelho isolado escala com o total
>   `not_evaluated` (coerente com INV-B, ratificado em A26-1/ADR-0026).
> - **A8-6 →** redação pt-BR dos cinco estados decidida: válido / parcial / não
>   avaliado / desatualizado / inválido → glossário normativo em ADR-0029; "não
>   avaliado" nunca com vocabulário tranquilizador (N7).
>
> **rationale:** conforme folha de decisão do ciclo 1 (GDEC-0007); fundamentos por
> linha na própria folha (`cycle-1-review-decision-sheet.md` §5).
>
> **supersessão:** rege-se pela própria seção de gatilhos de revisita desta ADR (§8.2)
> — nenhum gatilho adicional é criado por esta transcrição.
>
> **Nota de escopo.** Esta decisão fecha as cláusulas CLÍNICAS. Aprovadores não
> clínicos (`AUTH-PRODUCT` — ratificação arquitetural do ADR; `AUTH-UX` —
> consequências de exibição) permanecem `UNASSIGNED — VALIDATION REQUIRED` e não são
> nomeados por esta decisão (C2 abaixo permanece OPEN).

### 5.1 Condições — situação após a decisão de 2026-08-15 (GDEC-0007)

| # | Condição | Dono | Evidência que a fecha | Status |
|---|---|---|---|---|
| C1 | Revisão clínica nomeada das cláusulas ◆ (N1, N2, N4-N7) e da escolha Q1/Q2. | rodaquino-OMNI (GDEC-0003) | Registro de revisão com data e disposição por cláusula | **FECHADA — ver §5.0, GDEC-0007, 2026-08-15** |
| C2 | Aprovadores não clínicos nomeados (AUTH-PRODUCT; AUTH-UX para consequências de exibição). | Gate G0 residual | authority-model.md atualizado | OPEN |
| C3 | Coerência com o ADR-0007 (formato de bundle): o schema comporta política de completude, janelas/horizontes por insumo e vocabulário de razões versionado (A2). | autor ADR-0007 + este autor | Referência cruzada verificada nos dois textos | OPEN — verificação cruzada de schema ainda pendente, mesmo com ADR-0007 já aceito |
| C4 | Aceitação conjunta com o ADR-0026 (o par não pode divergir; ver §10). | mesmas autoridades | Aceitação registrada dos dois | **FECHADA — ADR-0026 aceito na mesma decisão, GDEC-0007, 2026-08-15** |
| C5 | Rota de VAL-0023 definida por versão de regra (janelas declaradas) ou risco aceito com registro. | rodaquino-OMNI | Registro em rule release ou risk-register | OPEN — números permanecem VALIDATION REQUIRED (A8-4) |
| C6 | Prefixo da suíte de vetores (CRV) ratificado ou placeholder oficial adotado (GDEC-0002). | dono da traceability | GDEC-0002 resolvido | OPEN — GDEC-0002 continua PROPOSAL |

---

## 6. Consequências

Como nenhuma opção foi escolhida, estas são consequências da existência deste ADR em
`proposed`.

### 6.1 Positivas

- A questão do total parcial está enumerada com a evidência SOFA anexada (E4) — a
  discussão deixa de ser implícita em cada rule spec.
- O runtime, a UI e o harness de testes ganham um alvo de contrato único para revisar,
  em vez de cinco definições locais divergentes.
- As duas ordenações de precedência estão registradas com suas objeções — a escolha
  ficará auditável.

### 6.2 Negativas

- Até a aceitação, nenhum rule release pode declarar política de completude "final";
  autoria concorrente carrega condicionais.
- O par ADR-0008/ADR-0026 introduz acoplamento documental que exige disciplina de
  supersessão conjunta (§10) — custo real de manutenção.

### 6.3 Neutras / estruturais

- Nada aqui altera o relatório vigente da relação AMH (`integration candidate`) nem
  torna nenhuma via acionável (H5 do ADR-0001 permanece vinculante).
- Nenhum número clínico (janela, horizonte, limiar) é proposto neste documento.

### 6.4 O que a aceitação desbloqueia (desenvolvimento)

1. **Contrato de status para o runtime de regras** — o tipo `evaluation_status` +
   razões, funções totais por estado, precedência N2 e transições N5/N6 são
   especificáveis e implementáveis sem decisão local.
2. **Componentes de exibição de escore** — conjunto fechado de estados, obrigações de
   distinguibilidade (N7) e exibição por componente (Q1-A/C) para o ADR-0021.
3. **Asserções do harness CRV** — vetores por célula: cada estado × cada razão × cada
   transição temporal × matriz de duas dimensões (negativos incluídos), com o alvo D2
   ("100% dos vetores com insumo ausente produzem status não-`valid`; zero exibições
   parciais silenciosas") como gate bloqueante.
4. **Padrão de autoria de rule releases** — slots de completude/atualidade com
   semântica fixa (números por VAL-0023), classe por ADR-0026.

---

## 7. Implicações transversais

| Dimensão | Implicação | Rótulo | Papel dono | Follow-up |
|---|---|---|---|---|
| Segurança clínica | Este ADR é o controle primário proposto de HAZ-0005 (E1 — ocorreu) e co-controle de HAZ-0006/0021/0039/0040/0043; a escolha da Q1 determina se "parcial lido como total" é irrepresentável ou apenas marcado. | INFERENCE de E1-E13 | AUTH-CLINSAFETY | HAZ-0005, HAZ-0006, HAZ-0021, HAZ-0039, HAZ-0040, HAZ-0043 |
| Segurança (security) | Status e razão são parte do registro assinado da avaliação (integridade — nada de inferência client-side, `PROMPT:665`); alteração de status fora do runtime é violação de integridade; o vocabulário de razões entra no bundle assinado (ADR-0007). | INFERENCE | AUTH-SECURITY | ADR-0007, ADR-0018 |
| Privacidade (LGPD) | Razões são tokens enumerados — proibido texto livre em razão de status, para que nenhum caminho de razão carregue PHI para logs/notificações (HAZ-0028). | PROPOSAL | AUTH-PRIVACY-LEGAL | ADR-0017, ADR-0018 |
| Interoperabilidade | Status nunca é exportado sem binding de vocabulário; qualidade de fonte AMH permanece dimensão separada no contrato (N8; DOM-0008); perda de distinção na camada anticorrupção é contabilizada, não normalizada. | SOURCE (PROMPT:497-502) | AUTH-DATA-PLATFORM | ADR-0013 |
| Acessibilidade | Cada estado é distinto sem depender de cor e é anunciável por tecnologia assistiva (SAF-0034; HAZ-0037); a distinção `stale` vs `valid` não pode ser só um timestamp (E7, `evaluation-status-semantics.md` §3.4). | SOURCE/PROPOSAL | AUTH-UX | ADR-0021; VAL-0033 |
| Operacional | Recomputação na leitura (N5) tem custo (A4/H3); `not_evaluated` persistente vira sinal operacional com SLI de rendimento de avaliação (SAF-0040); varreduras de expiração precisam de SLA declarado. | PROPOSAL | AUTH-OPERATIONS | ADR-0020 |
| Custo | Modesto e antecipado: sistema de tipos, vocabulário de razões, suíte de vetores; evita o custo tardio (auditoria + retrofit de status em registros persistidos). Nenhum modelo de custo existe; nada é inventado. | INFERENCE | AUTH-PRODUCT | pendente |
| Migração | O vocabulário de status entra em registros imutáveis persistidos; mudança futura de vocabulário exige ADR supersessor + política explícita de re-rotulagem/versionamento de registros históricos — nunca re-rotulagem silenciosa. | PROPOSAL | AUTH-OPERATIONS | ADR-0023 |

---

## 8. Reversibilidade, gatilhos de revisita, kill/rollback

### 8.1 Avaliação de reversibilidade

| Opção | Reversibilidade | O que fica encalhado na reversão | Rótulo |
|---|---|---|---|
| A — nunca parcial | **Alta** — afrouxar (A→C) é aditivo: cria-se a via de política parcial sem tocar registros passados | nada material | INFERENCE |
| B — parcial marcado | **Baixa** — retirar totais parciais já exibidos é contração de produto: re-treinamento, re-baselining de métricas, registros históricos com totais parciais persistidos | totais parciais persistidos e hábitos clínicos formados | INFERENCE |
| C — por classe, default A | **Alta no default; local nas exceções** — cada política parcial ratificada é revogável por retirada do rule release (mecanismo ADR-0007) | apenas os releases da exceção revogada | INFERENCE |
| P-a / P-b (precedência) | Trocar precedência após persistência é re-semantização de registros históricos — **baixa**; decidir cedo e bem importa mais aqui que na Q1 | interpretações históricas de co-ocorrências | INFERENCE |
| Z — adiar | n/a — mas o custo de atraso cresce e vira migração após os primeiros registros | n/a | INFERENCE |

A assimetria (afrouxar é barato, contrair é caro) é ela própria um argumento
registrado a favor de começar restritivo (A/C), coerente com o princípio 11 do prompt
§9.1 (preferir decisões reversíveis).

### 8.2 Gatilhos de revisita

| # | Gatilho | Detecção | Notificar | Ação |
|---|---|---|---|---|
| T1 | Gate G2 aprova portfólio cujas classes reais não casam com as premissas daqui/do ADR-0026 | registro do G2 | AUTH-CLINSAFETY | Reabrir Q1 por classe |
| T2 | VAL-0023 ratifica janelas por insumo em algum rule release | registro do release | AUTH-CLINSAFETY | N5 ganha números; vetores de borda gerados |
| T3 | Evidência humana (M3/VAL-0027, VAL-0031) de má leitura de estados ou da ordem P-a | relatório do estudo | AUTH-UX + AUTH-CLINSAFETY | Reabrir N2/N7 |
| T4 | AMH publica fontes populadas que alterem a computabilidade SOFA/NEWS2 (E4, H1) | detecção de drift de contrato | AUTH-DATA-PLATFORM + AUTH-CLINSAFETY | Reavaliar H1; ADR-0026 classe 2 |
| T5 | Demonstração de necessidade de estado de primeira classe `conflicted` (A1) | revisão clínica / desenho de interação | AUTH-CLINSAFETY | Emenda de vocabulário por ADR supersessor |
| T6 | ADR-0007 aceito com schema de bundle sem os slots exigidos por C3 | revisão cruzada | ambos os autores | Reconciliar antes de aceitar qualquer um |
| T7 | SLI de SAF-0040 dispara (via em `not_evaluated` persistente) | sinal operacional | AUTH-CLINSAFETY + AUTH-OPERATIONS | Revisão de retirada da via; verificar habituação (HAZ-0043) |

### 8.3 Kill switch / rollback

Enquanto `proposed`, nada a matar. Após aceitação: (i) mudança de semântica de estados
só por ADR supersessor com política de migração de registros (§7 migração) — não há
"hotfix" de semântica; (ii) uma **política parcial** cujo defeito seja descoberto é
morta pelo mecanismo de kill/rollback de bundle do ADR-0007 — as avaliações do release
morto transitam para `not_evaluated` (razão `rule_unavailable`), jamais no-fire
silencioso (`evaluation-status-semantics.md` §5.3, última linha); (iii) fallback
clínico: o estado exibido durante qualquer rollback é `not_evaluated` com razão — o
default honesto é o próprio modo degradado (DOM-0007).

---

## 9. Método de validação e evidência vinculada

| # | Alegação deste ADR | Método de validação | Ambiente | IDs vinculados |
|---|---|---|---|---|
| V1 | Nenhum caminho produz valor sem status; ausente nunca vira 0/normal/silêncio | **Sonda de insumo ausente** (SAF-0002) como suíte bloqueante (SAF-0030) sobre toda função/endpoint/projeção que produza valor; vetores negativos de E1-E3/E6 do legado como regressão | teste (dado sintético) | SAF-0001, SAF-0002; HAZ-0005; QAS-0007; TST: pendente |
| V2 | Precedência e agregação são monótonas | Testes de propriedade: co-ocorrências geradas × ordem N2; injetar membro pior nunca melhora o agregado | teste | SAF-0006; QAS-0017 |
| V3 | Transições temporais corretas nas bordas | Vetores de borda de janela/horizonte (valores por release), fixtures DST `America/Sao_Paulo`, timestamps ausentes/ambíguos | teste | SAF-0004, SAF-0012; DOM-0009 |
| V4 | Determinismo/replay do status | Replay do corpus com relógio fixado; divergência = defeito | teste/G4 | DOM-0003; QAS-0020 |
| V5 | Estados compreendidos por clínicos pt-BR (inclusive `não avaliado` ≠ baixo risco) | Estudo de compreensão M3 com clínicos; wording pt-BR | ambiente de usabilidade | VAL-0026, VAL-0027, VAL-0031; SAF-0005, SAF-0034 |
| V6 | Matriz de duas dimensões nunca colapsa | Teste exaustivo por célula, incluindo combinações proibidas como negativos; código sem derivação entre dimensões | teste | SAF-0032; HAZ-0040; DOM-0008 |
| V7 | API/eventos nunca emitem status nulo nem inferível no cliente | Testes de contrato em toda resposta | teste | SAF-0001; ADR-0012 |

**Disciplina de placeholder.** `REQ:` e `TST:` permanecem placeholders verbatim; nenhum
ID REQ/TST/CRV foi inventado aqui; todo HAZ/SAF/VAL/QAS/DOM citado foi lido dos
documentos em disco.

---

## 10. Relações de supersessão

- **Supersedes:** nenhum.
- **Superseded by:** nenhum.
- **Notas de relação:** (i) na aceitação, `evaluation-status-semantics.md` torna-se
  anexo normativo deste ADR (ratificado-como-proposto com os apertos N2-N9) — não é
  superseded; (ii) **acoplamento de par:** este ADR e o ADR-0026 devem ser aceitos,
  emendados e supersedidos **em conjunto** — um ADR que altere um dos dois deve
  declarar o impacto no outro; (iii) o ADR-0007 (formato/assinatura/ativação/rollback
  de bundle de regra — em autoria concorrente) é dependência: divergência de schema
  resolve-se antes da aceitação de qualquer um (C3).

---

## 11. Autochecagem contra o gate de completude do template

Todas as seções presentes; ≥2 alternativas viáveis + adiar (quatro na Q1, três na Q2);
cada alternativa com consequências positivas e negativas; drivers discriminantes
mapeados a QAS; **nenhum alvo numérico clínico inventado** (alvos estruturais derivam
de invariantes já propostos, com fonte); as oito linhas transversais presentes;
reversibilidade/gatilhos/kill presentes; métodos de validação com placeholders
honestos; supersessão presente; nenhuma tecnologia selecionada; nenhuma aprovação
fabricada. `adr-index.md` **não** foi editado por este autor — integração do índice é
ato do orquestrador (escopo de escrita desta tarefa).

## 12. Questões abertas para o revisor nomeado (rodaquino-OMNI)

> **RESOLVIDO — 2026-08-15, GDEC-0007.** As seis questões abaixo foram respondidas
> pelo titular na revisão do ciclo 1: 1→A8-1 (P-a); 2→A8-2 (Opção C-com-default-A);
> 3→A8-3 (conflicted = razão de invalid); 4→A8-4 (confirmado, números seguem
> VALIDATION REQUIRED); 5→A26-1/ADR-0026 (INV-B ratificado); 6→A8-6 (wording pt-BR
> aceito). Ver §5.0 para o registro formal. O texto original é preservado abaixo como
> registro histórico das perguntas feitas.

1. **Precedência (Q2):** ratificar P-a (`invalid > not_evaluated > stale > partial >
   valid`)? A alternativa P-b privilegia a informação de "houve conclusão antiga" — se
   preferida em algum fluxo, indicar qual, para modelar por metadado ou por exceção.
2. **Totais parciais (Q1):** a recomendação C-com-default-A basta, ou a v1 deve ser A
   pura (nenhuma política parcial admissível em nenhuma classe até segunda ordem)?
   Nota: hoje H1 sustenta que nenhuma política parcial é aprovável de fato (sem fonte
   populada), então A pura e C-default-A coincidem na prática da v1.
3. **`conflicted`:** manter conflito não resolvido mapeado em `invalid` (razão
   `conflicting_inputs`), com "conflito" como distinção de razão na UI — ou é
   necessário sexto estado de primeira classe (PROMPT:672)?
4. **Horizonte de expiração:** confirmar a transição `stale` → `not_evaluated` (razão
   `expired`) além do horizonte declarado, com os dois limiares (janela e horizonte)
   como parâmetros clínicos por insumo e por versão de regra (valores: VALIDATION
   REQUIRED)?
5. **Evidência positiva presente com co-insumos ausentes:** um parâmetro presente já em
   banda vermelha pode escalar isoladamente enquanto o total está `not_evaluated`?
   (Princípio de assimetria — proposto e detalhado no ADR-0026, INV-B; a decisão é de
   lá, sinalizada aqui por afetar N7.)
6. **Wording pt-BR dos cinco estados** (em especial `não avaliado`) — encaminhar a
   VAL-0031 ou aceitar interinamente os termos da proposta da Onda 1?
