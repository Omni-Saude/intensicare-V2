---
id: ADR-0029
title: >
  Processo de validação da terminologia clínica em pt-BR e de sua consistência com os
  vínculos terminológicos de máquina (LOINC/SNOMED CT/UCUM)
status: accepted (2026-08-15, GDEC-0007)
status_history:
  - status: not-started
    date: 2026-08-15
    by: orquestrador de entrega (ciclo 1)
    note: >
      Tópico já listado como candidato em adr-index.md §6 ("pt-BR clinical language and
      localization strategy", prompt §11) desde a Onda 2; nenhum rascunho existia.
  - status: proposed
    date: 2026-08-15
    by: especialista pt-BR clinical-terminology validation-process (ciclo 1, Tarefa 4)
    note: >
      Rascunho redigido a partir de PROMPT §11 (linha 692), DEC-G0-10, GDEC-0003, do
      achado de revisão legada de `alert_copy.py` (mistura pt-BR/EN sem trilha de
      validação) e de `docs/03-domain/glossary.md` (35 termos, todos PROPOSAL, todas as
      candidatas de tradução VALIDATION REQUIRED). Nenhuma decisão é registrada; nenhum
      termo de glossário é ratificado por este documento.
  - status: accepted (2026-08-15, GDEC-0007)
    date: 2026-08-15
    by: rodaquino-OMNI (revisor clínico nomeado, GDEC-0003) — transcrito pelo orquestrador clínico do ciclo 1 (escriba)
    note: >
      Decisão por escrito, em sessão, do titular nomeado, registrada em
      decision-register.md GDEC-0007 (folha de decisão do ciclo 1, §10, linhas A29-1 a
      A29-6). Opção A (glossário + revisor nomeado) fixada; verificação de consistência
      terminológica prossegue LOINC/UCUM-only, pendente de verificação de licenciamento
      SNOMED CT. Ver §5.0. Nenhum termo do glossário é ratificado por esta decisão.
date: 2026-08-15
owner: >
  rodaquino-OMNI — revisor clínico nomeado e aprovador de conteúdo clínico do ciclo 1
  (GDEC-0003); candidato AUTH-UX interino (DEC-G0-05). Ver "independence_check" abaixo:
  este ADR não lhe atribui autoria de nenhuma string pt-BR — apenas a revisão delas.
approvers:
  - rodaquino-OMNI — candidato AUTH-CLINSAFETY interino para conteúdo clínico do ciclo 1,
    por GDEC-0003 (docs/00-governance/registers/decision-register.md). NOTA DE HONESTIDADE:
    `authority-model.md` linha 28 registra `AUTH-CLINSAFETY` como
    UNASSIGNED — VALIDATION REQUIRED em caráter geral; GDEC-0003 é uma nomeação mais
    estreita ("named clinical reviewer / clinical-content approver for cycle-1
    artifacts"), não uma nomeação plena e permanente de AUTH-CLINSAFETY. Este ADR cita
    GDEC-0003, não reafirma AUTH-CLINSAFETY como preenchido.
  - rodaquino-OMNI — candidato AUTH-UX interino, por DEC-G0-05
    (docs/00-governance/registers/g0-resolucoes-2026-08-15.md). Restrição vinculante de
    DEC-G0-05, repetida aqui: o conhecimento clínico do titular vale como insumo de
    hipótese de especialista, nunca como evidência observacional de Gate G1 — um segundo
    revisor clínico pt-BR, externo, continua exigido antes que qualquer validação de
    linguagem clínica seja tratada como evidência de nível G1.
  - UNASSIGNED — VALIDATION REQUIRED — segundo revisor clínico pt-BR independente,
    necessário quando o próprio titular tiver redigido ou materialmente emendado uma
    string (par de independência 1, decision-rights.md §3: autor de regra ≠ aprovador
    clínico; o mesmo se aplica ao humano, não só ao agente).
decision_deadline: >
  Sem data-calendário fixa. Gatilho vinculante: ANTES de qualquer congelamento de
  RuleVersion (escopo ADR-0007, ainda not-started) que carregue texto de explicação em
  pt-BR, e ANTES de qualquer fatia de UI (escopo ADR-0021, ainda not-started) que exiba
  texto clínico pt-BR fora de um ambiente sintético. Data-calendário: UNSET — VALIDATION
  REQUIRED.
deciding_authority_rule: >
  docs/00-governance/decision-rights.md §2, linha "Clinical rule content ratification"
  (`AUTH-CLINSAFETY`) para o conteúdo e a semântica clínica das strings; linha
  "UX/accessibility/participant-research acceptance" (`AUTH-UX`) para legibilidade,
  política de abreviação e critérios de exibição sob pressão de tempo. Hoje ambos os
  papéis, na forma interina, são exercidos pelo mesmo humano nomeado (rodaquino-OMNI,
  GDEC-0003 + DEC-G0-05) — concentração de autoridade já registrada como risco em
  ADR-0004 §11.2 e aqui reafirmada, não reintroduzida.
independence_check: >
  Par 1 de decision-rights.md §3 (autor de regra ≠ aprovador clínico) e par 5 (designer de
  UX ≠ responsável por aceitar a própria pesquisa com participantes) aplicam-se
  diretamente: o §4 Opção A deste ADR atribui a AUTORIA de cada par pt-BR/EN ao
  agente/especialista que redige o conteúdo clínico, nunca ao revisor. rodaquino-OMNI
  revisa; não deve também ser o autor de origem de uma string que em seguida aprova. Onde
  isso não puder ser mantido (por exemplo, se o próprio titular redigir uma string), um
  segundo revisor independente é exigido antes da validação — condição registrada em §5.1.
links:
  drivers:
    domain_invariants: [DOM-0002, DOM-0004, DOM-0008]
    quality_scenarios: [QAS-0017, QAS-0023]
    risks: ["pendente docs/00-governance/registers/risk-register.md — ver §6.2"]
  constrains:
    requirements: ["REQ: pendente de catálogo de requisitos (docs/04-product-requirements ainda não existe)"]
    clinical: ["CLR: pendente do portfólio de vias clínicas (Gate G2)"]
    safety: [SAF-0001, SAF-0002, SAF-0003, SAF-0005, SAF-0006, SAF-0019, SAF-0020, SAF-0022, SAF-0023, SAF-0027, SAF-0030, SAF-0035]
  hazards: [HAZ-0005, HAZ-0021, HAZ-0022, HAZ-0036]
  tests: ["TST: pendente de arquitetura de teste"]
  validations: ["VAL: pendente do backlog de validação (ver também g1-validation-backlog.md — este ADR não minta um novo VAL-ID)"]
  adrs:
    depends_on: []
    feeds: [ADR-0007, ADR-0008, ADR-0021]
  gates: [G2, G4]
  evidence:
    - INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §11 (linha 692)
    - docs/00-governance/evidence-notation.md §5
    - docs/00-governance/registers/g0-resolucoes-2026-08-15.md (DEC-G0-10, DEC-G0-05)
    - docs/00-governance/registers/decision-register.md (GDEC-0003)
    - docs/00-governance/decision-rights.md §2, §3
    - docs/03-domain/glossary.md
    - docs/03-domain/status-dimensions.md
    - docs/03-domain/invariants/DOM-invariants.md (DOM-0004)
    - docs/05-clinical-safety/hazard-log.md (HAZ-0005, HAZ-0021, HAZ-0022, HAZ-0036)
    - docs/05-clinical-safety/legacy-review/alert-threshold-engine/engine-review.md §6.3, §7
    - docs/05-clinical-safety/legacy-review/pathways/pathway-index.md §1
    - docs/05-clinical-safety/rule-releases/sofa/logic.yaml
    - docs/12-quality-validation-and-testing/clinical-reference-vector-standard.md §4.2
    - docs/12-quality-validation-and-testing/g7-slice-test-plan.md (Passo 8)
    - docs/06-architecture/adrs/adr-index.md §3 (linha ADR-0007), §6
supersedes: null
superseded_by: null
provenance:
  source_repo: intensicare-V2
  path_or_url: docs/06-architecture/adrs/ADR-0029-pt-br-clinical-terminology-validation-process.md
  commit_sha_or_version: ddac9bc (HEAD do repositório na redação; este arquivo não está commitado; trabalho concorrente em curso no branch cycle-1/clinical-content)
  section_or_lines: >
    INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §11 (linhas 661-701, especialmente linha 692);
    docs/00-governance/evidence-notation.md §5; g0-resolucoes-2026-08-15.md DEC-G0-10 e
    DEC-G0-05; decision-register.md GDEC-0003; docs/03-domain/glossary.md (todo o
    documento); legacy-review/alert-threshold-engine/engine-review.md §6.3 e §7;
    legacy-review/pathways/pathway-index.md §1; hazard-log.md linhas HAZ-0005, HAZ-0021,
    HAZ-0022, HAZ-0036.
  date_collected: 2026-08-15
  collector: especialista pt-BR clinical-terminology validation-process (ciclo 1, Tarefa 4)
  transformation: >
    reasoned-from — nenhum termo do glossário é traduzido ou ratificado aqui; o processo é
    desenhado a partir da lacuna observada (V1 misturou pt-BR e EN sem trilha de
    validação) e das exigências explícitas do prompt §11 e de DEC-G0-10. Nenhum fato de
    licenciamento do SNOMED CT no Brasil é afirmado — ver E12 em §2.1, explicitamente
    marcado VALIDATION REQUIRED por instrução da tarefa.
  confidence: medium
  owner: rodaquino-OMNI
  validation_status: VALIDATION REQUIRED — aceitação do processo escrito pelo titular, mais revisão clínica nomeada de qualquer conteúdo pt-BR concreto que este processo venha a produzir
---

# ADR-0029 — Processo de validação da terminologia clínica em pt-BR e de sua consistência com os vínculos terminológicos de máquina

> **Status: `accepted (2026-08-15, GDEC-0007)`.** O revisor clínico nomeado
> (rodaquino-OMNI, GDEC-0003) decidiu, por escrito, em sessão de 2026-08-15
> (transcrição-mestre: `decision-register.md` GDEC-0007), o PROCESSO pelo qual
> linguagem clínica pt-BR voltada ao clínico é redigida, validada clinicamente e
> mantida consistente com os vínculos terminológicos de máquina — **Opção A**
> (glossário em repositório + revisão por clínico nomeado por pacote), com a
> verificação de consistência terminológica prosseguindo **LOINC/UCUM-only**,
> licenciamento SNOMED CT permanecendo `VALIDATION REQUIRED` — ver §5.0 para o
> registro por questão (A29-1 a A29-6). **Esta decisão não ratifica nenhum termo do
> glossário** e não afirma nenhum fato de licenciamento terminológico — apenas o
> processo pelo qual termos futuros serão validados.

---

## 1. Contexto e problema

DEC-G0-10 (`g0-resolucoes-2026-08-15.md`) **DECIDIU** — pelo titular nomeado, não por
agente — que todo material produzido a partir de 2026-08-15 é redigido em português
(pt-BR), ainda que as interações com agentes ocorram em inglês. Este próprio ADR está
redigido em pt-BR em conformidade com essa decisão. Ao mesmo tempo, SOURCE
(`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md` §11, linha 692) exige explicitamente, como
requisito não-opcional da camada UX/UI: **"pt-BR clinical language validation and a
localization strategy."** Nenhum dos dois documentos-fonte especifica *como* essa
validação ocorre, quem a executa, ou como ela permanece sincronizada com os identificadores
de máquina (nomes de código internos, DOM/HAZ/SAF/REQ-IDs, e os sistemas terminológicos
clínicos — LOINC, potencialmente SNOMED CT, UCUM) que o sistema usa por baixo do texto
exibido.

**Por que agora, e por que isto não é teórico.** A revisão forense do V1 (SOURCE,
`legacy-review/alert-threshold-engine/engine-review.md` §6.3) OBSERVOU que
`alert_copy.py` já continha uma "Centralized pt-BR 3-part explanation" — texto clínico
pt-BR embutido no código — com dois defeitos concretos e sem qualquer trilha de validação
clínica registrada em lugar algum do repositório V1: (a) as cláusulas "por que importa"
fixavam em prosa um limiar codificado ("NEWS2 entre 5 e 6") que era, ao mesmo tempo,
configurável pelo operador — de modo que uma reconfiguração do limiar dessincronizava
silenciosamente o texto exibido do critério que de fato disparava o alerta; (b) uma
severidade não reconhecida caía para a cópia *menos* severa disponível — sob-comunicação
exatamente no caso em que o modelo de dados já havia divergido. O veredito da revisão foi
explícito: **"VALIDATE (wording requires pt-BR clinician validation...)"** — ou seja, o
próprio V1 já continha texto clínico pt-BR nunca submetido a um revisor clínico nomeado.
Esse é o vácuo que este ADR propõe fechar para a V2, não repeti-lo.

Em paralelo, `legacy-review/pathways/pathway-index.md` §1 mostra que as doze vias clínicas
do V1 já carregam nomes clínicos em pt-BR (*Sepse*, *Desmame*, *Equilíbrio
Hidroeletrolítico*, *Insuficiência Respiratória* etc.) ao lado de identificadores internos
em inglês (`sepse`, `desmame`, `equilibrio`, `respiratorio` como slugs; `pathway.id`
numérico) — outra instância do mesmo padrão de mistura pt-BR/EN sem processo de
consistência declarado.

**Pergunta.** Qual processo governa como a linguagem clínica pt-BR voltada ao clínico é
(1) redigida, (2) clinicamente validada por um revisor nomeado, e (3) mantida consistente
com os vínculos terminológicos de máquina que ela representa — ao longo de todo o ciclo
de vida de um pacote de regras (`RuleBundle`/`RuleVersion`, escopo ADR-0007)?

**Fora de escopo** (cada item nomeado para não se confundir com este ADR):

- **A seleção dos próprios sistemas terminológicos** (quais códigos LOINC/SNOMED
  CT/RxNorm/ATC a V2 de fato vincula) — isso é modelagem de domínio e de perfis FHIR,
  ADR-0013 (`not-started`). Este ADR assume que *algum* conjunto de vínculos existirá e
  define como o texto pt-BR permanece consistente com ele, seja ele qual for.
- **O formato, a assinatura e a ativação do pacote de regras** — ADR-0007 (`not-started`),
  citado aqui apenas como o destino onde o texto de explicação validado é congelado.
- **A implementação de componentes de UI e acessibilidade** (contraste, leitor de tela,
  anúncios de região viva) — ADR-0021 (`not-started`). Este ADR trata do *conteúdo*
  linguístico, não do componente que o renderiza.
- **A base legal de LGPD e a decisão de tradução retroativa do corpus do ciclo 0** —
  DEC-G0-10 deixa a tradução retroativa como "decisão em aberto do titular (custo ×
  benefício a avaliar)"; este ADR não a resolve nem a pressupõe.
- **Localização para qualquer idioma além do pt-BR** — DEC-G0-10 fixa pt-BR como idioma de
  trabalho para o material produzido; nenhuma exigência multi-idioma está evidenciada
  nesta fase (ver Premissa A4).
- **Quais das 14 vias clínicas serão de fato aprovadas (Gate G2)** — `pathway-portfolio/`;
  este ADR assume que qualquer via aprovada, sepse ou outra, terá texto pt-BR e nomes que
  passam pelo mesmo processo, não define quais vias existirão.

---

## 2. Evidência e premissas

### 2.1 Evidência

| # | Rótulo | Afirmação | Fonte | Confiança |
|---|---|---|---|---|
| E1 | SOURCE | DEC-G0-10: material produzido a partir de 2026-08-15 é redigido em pt-BR, decidido pelo titular nomeado; corpus do ciclo 0 em inglês permanece válido; tradução retroativa é decisão em aberto. | `g0-resolucoes-2026-08-15.md` DEC-G0-10 | alta |
| E2 | SOURCE | "pt-BR clinical language validation and a localization strategy" é listado como requisito explícito, não opcional, entre os requisitos da camada UX/UI. | `INTENSICARE_V2_ORCHESTRATOR_PROMPT.md` §11, linha 692 | alta |
| E3 | SOURCE | O `alert_copy.py` do V1 já continha explicação clínica pt-BR de 3 partes, com "por que importa" fixando em prosa um limiar ("NEWS2 entre 5 e 6") que era, ao mesmo tempo, configurável pelo operador — divergência prosa/regra silenciosa — e com fallback de severidade não reconhecida caindo para a cópia menos severa. Veredito da revisão: **VALIDATE — "wording requires pt-BR clinician validation."** | `legacy-review/alert-threshold-engine/engine-review.md` §6.3 | alta |
| E4 | SOURCE | As doze vias clínicas do V1 nomeiam-se em pt-BR (*Sepse*, *Desmame*, *Equilíbrio Hidroeletrolítico* etc.) ao lado de slugs/IDs internos em inglês, sem processo de consistência terminológica documentado em lugar algum do repositório V1 revisado. | `legacy-review/pathways/pathway-index.md` §1 | alta |
| E5 | SOURCE | DOM-0004 exige que dado ausente, obsoleto ou inválido nunca seja coercionado a zero, "normal", "sem risco" ou ausência silenciosa de alerta — deve ser representado explicitamente (`not_evaluated`, `partial`, `stale`, `invalid`). HAZ-0005 registra que essa exata coerção **já ocorreu** no V1 (`LEGACY-TA:469-478`) e é classificada como o achado de segurança mais grave do repositório legado. | `docs/03-domain/invariants/DOM-invariants.md` DOM-0004; `hazard-log.md` HAZ-0005 | alta |
| E6 | SOURCE | `docs/03-domain/glossary.md` já enumera 35 termos canônicos com candidata de tradução pt-BR — mas **todas as 35 linhas** trazem a mesma anotação: "VALIDATION REQUIRED (owner: UNASSIGNED)". Nenhuma tradução ali é ratificada; o próprio glossário afirma: "No term in this table has an approved pt-BR translation." | `docs/03-domain/glossary.md` §Cross-reference summary (linhas 834-878) | alta |
| E7 | SOURCE | O padrão de vetor de referência clínico já formaliza um campo `explanation_requirements` (mostrar inputs usados, inputs ausentes, versão da regra, tempo de origem e frescor) e exige que `fire_reason`/`no_fire_reason` sejam escritos "in clinician-readable terms" — mas **não** especifica, hoje, um par bilíngue pt-BR/EN estruturado para essas razões. | `docs/12-quality-validation-and-testing/clinical-reference-vector-standard.md` linhas 172-182; `g7-slice-test-plan.md` Passo 8 | alta |
| E8 | SOURCE | A especificação declarativa de RULE-SOFA (0.x, precursora, não assinada) já marca explicitamente vínculos terminológicos como candidatos não confirmados: `loinc_candidates` (nunca um único código fixado), `"RxNorm pin VALIDATION REQUIRED"`, `"terminology pin VALIDATION REQUIRED"` para RASS. Ou seja: mesmo os vínculos de máquina que o texto pt-BR precisaria refletir **ainda não estão fixados** para o primeiro conteúdo clínico em elaboração. | `docs/05-clinical-safety/rule-releases/sofa/logic.yaml` linhas 76, 117, 148 | alta |
| E9 | SOURCE | GDEC-0003: rodaquino-OMNI aceita, para o ciclo 1, o papel de revisor clínico nomeado e aprovador de conteúdo clínico (candidato detentor de AUTH-CLINSAFETY/AUTH-INTENDED-USE). Divisão de trabalho: agentes são AUTORES DE REGRA; rodaquino-OMNI é APROVADOR CLÍNICO. Este registro já vincula `[ADR-0007]` como um dos ADRs relacionados. | `docs/00-governance/registers/decision-register.md` GDEC-0003 | alta |
| E10 | SOURCE | DEC-G0-05: rodaquino-OMNI assume AUTH-UX em caráter interino; restrição vinculante: o conhecimento clínico próprio do titular vale como **insumo de hipótese de especialista**, nunca como evidência de observação do Gate G1 — o G1 continua exigindo participantes clínicos externos. | `g0-resolucoes-2026-08-15.md` DEC-G0-05 | alta |
| E11 | SOURCE | ADR-0007 ("Rule bundle format, signing, approval, activation, rollback, retirement") está reservado, `not-started`, autoridade candidata `AUTH-CLINSAFETY + AUTH-SECURITY`, e depende de ADR-0005/ADR-0022. `adr-index.md` §6 já lista "pt-BR clinical language and localization strategy" como tópico candidato adicional, citando exatamente o prompt §11 aqui evidenciado (E2). | `docs/06-architecture/adrs/adr-index.md` §3 (linha ADR-0007), §6 | alta |
| E12 | **VALIDATION REQUIRED — nenhum fato afirmado.** O status de licenciamento e distribuição do SNOMED CT no Brasil (associação com um National Release Center, termos de uso, custo) **não foi verificado nesta tarefa e não é afirmado aqui a partir de memória.** Nenhuma menção a status de licenciamento do SNOMED CT Brasil foi encontrada em nenhum documento deste repositório na data de coleta. | busca exaustiva em `docs/` em 2026-08-15 — nenhuma ocorrência encontrada | n/a — ausência de evidência, não confirmação de ausência de licença |
| E13 | SOURCE | `authority-model.md` linha 28 registra `AUTH-CLINSAFETY` como "Clinical safety decision owner ... UNASSIGNED — VALIDATION REQUIRED ... OPEN" em caráter geral e permanente — distinto e mais amplo do que a nomeação estreita de GDEC-0003 para artefatos do ciclo 1. Este ADR não confunde os dois. | `docs/00-governance/authority-model.md` linha 28 | alta |
| E14 | SOURCE | HAZ-0036 registra o hazard de "automation summarises, routes, or phrases output in a way that reads as a directive" — a fraseologia da automação, por si, é uma superfície de hazard já catalogada, independente do idioma. | `hazard-log.md` HAZ-0036 | alta |
| E15 | SOURCE | HAZ-0021 (no-fire opaco, sem registro do motivo) e HAZ-0022 (supressão de alerta não visível/auditável) exigem, respectivamente, que a ausência de disparo e a supressão sejam sempre explícitas e nunca indistinguíveis de "nada a relatar" — uma exigência que qualquer redação pt-BR de estado "sem alerta" deve honrar. | `hazard-log.md` HAZ-0021, HAZ-0022 | alta |

### 2.2 Premissas

Cada premissa deve ser registrada em `docs/00-governance/registers/assumptions-register.md`
com um `ASM-xxxx`. **Este ADR não minta IDs `ASM`** — o registro de premissas é o
catálogo que minta esse prefixo (`traceability-policy.md` §2 regra 4); mintar aqui
colidiria com trabalho concorrente.

| # | Premissa | Por que é necessária | O que a invalida | Dono |
|---|---|---|---|---|
| A1 | Um formato de pacote de regras (escopo ADR-0007) definirá texto de explicação como conteúdo do pacote, imutável por versão. | §4 Opção A e §5.1 pressupõem esse destino de congelamento; sem ele, "validado" não tem onde ficar fixado de forma auditável. | ADR-0007 adotar um modelo em que o texto de explicação é editável fora de uma nova `RuleVersion`. | UNASSIGNED — VALIDATION REQUIRED |
| A2 | Ao menos um médico intensivista brasileiro nomeado permanece acessível para revisar as strings pt-BR do ciclo 1 — hoje, apenas rodaquino-OMNI (GDEC-0003). | Todo o processo depende de um revisor humano nomeado existir; sem ele, nada sai de PROPOSAL. | Indisponibilidade do titular sem substituto nomeado — bloqueador imediato de qualquer congelamento de conteúdo clínico pt-BR. | UNASSIGNED — VALIDATION REQUIRED |
| A3 | LOINC e UCUM serão, no mínimo, sistemas terminológicos vinculados pela V2 (evidenciado por `contracts.lock.draft.yaml` e por `rule-releases/sofa/logic.yaml`); o uso de SNOMED CT permanece incerto. | A etapa de verificação de consistência terminológica (§4 Opção A, passo 3) precisa de ao menos um sistema-alvo real contra o qual comparar. | ADR-0013 (`not-started`) adotar um conjunto de sistemas terminológicos diferente ou não vincular nenhum. | UNASSIGNED — VALIDATION REQUIRED |
| A4 | pt-BR é o único idioma de trabalho voltado ao clínico exigido nesta fase (DEC-G0-10); nenhum requisito multi-idioma está evidenciado. | Delimita o escopo deste ADR a um único par pt-BR/EN, não a uma estratégia de i18n geral. | Uma decisão de produto (`AUTH-PRODUCT`) que exija um segundo idioma clínico. | UNASSIGNED — VALIDATION REQUIRED |
| A5 | `docs/03-domain/glossary.md` permanece o artefato semente do glossário controlado e será estendido, não substituído. | §4 Opção A trata o glossário como base de "um termo, um conceito"; se ele for substituído, o processo precisa de novo ponto de partida. | Um ADR ou decisão de produto que crie um glossário canônico distinto. | UNASSIGNED — VALIDATION REQUIRED |
| A6 | Os termos de licenciamento/distribuição do SNOMED CT no Brasil são desconhecidos e não devem ser presumidos livres nem presumidos incluídos em nenhuma licença já detida pela organização. | Protege §4 Opção A, passo 3, de assumir silenciosamente um fato de licenciamento não verificado (ver E12). | Uma determinação jurídica/de licenciamento nomeada — ver Questão em aberto 1 em §RETORNO. | UNASSIGNED — VALIDATION REQUIRED |

### 2.3 Hipóteses a testar

| # | Hipótese | Como seria testada | Quem testa | Status atual |
|---|---|---|---|---|
| H1 | Um glossário controlado em repositório + revisão por clínico nomeado por pacote de regras é suficiente para atingir 100% das strings voltadas ao clínico com entrada pt-BR validada em um pacote ativo. | Auditoria de cobertura do glossário + lint de string em CI no primeiro congelamento real de `RuleVersion`. | Especialista de terminologia clínica + revisor clínico nomeado | NÃO TESTADA |
| H2 | A verificação de consistência terminológica (rótulo pt-BR × nome de exibição LOINC/SNOMED CT/UCUM) pode ser parcialmente automatizada como um diff de nomes de exibição, não apenas manual. | Protótipo de lint contra os `loinc_candidates`/`terminology pin` de `rule-releases/*/logic.yaml`, uma vez que estejam fixados (ver A3). | Arquiteto de terminologia (não ainda ativado) | NÃO TESTADA — depende de A3 |
| H3 | A "lista de ambiguidade proibida" (§4 Opção A) é enumerável antecipadamente e aplicável por lint, sem exigir julgamento clínico caso a caso em tempo de execução. | Autoria da lista semente (§4 Opção A) e verificação de que os cinco valores de `evaluation_status` mapeiam para termos pt-BR não sobrepostos. | Especialista de terminologia clínica + revisor clínico nomeado | PARCIALMENTE TESTADA NESTE DOCUMENTO — lista semente proposta em §4 Opção A; cobertura completa é VALIDATION REQUIRED |

---

## 3. Direcionadores de decisão e atributos de qualidade mensuráveis

Metas são `VALIDATION REQUIRED` — SOURCE (prompt §15.3): SLOs derivam de necessidades
validadas de usuário/segurança, que não existem antes do Gate G1. **Nenhuma meta numérica
é inventada aqui.**

| # | Direcionador | Por que discrimina entre as opções | Atributo de qualidade mensurável | Meta |
|---|---|---|---|---|
| D1 | **Dano clínico zero por ambiguidade/erro de tradução** — em especial, `not_evaluated` nunca exibido com vocabulário tranquilizador (lição HAZ-0005/DOM-0004). | Toda opção lida com o mesmo risco central (E5), mas com graus diferentes de rigor mecânico de verificação. | QAS-0017 (estado de segurança precede severidade) | VALIDATION REQUIRED |
| D2 | **Fidelidade terminológica** — o rótulo pt-BR não pode divergir silenciosamente do conceito LOINC/SNOMED CT/UCUM que representa. | Diretamente motivado por E8: os próprios vínculos de máquina ainda não estão fixados; o processo precisa sobreviver a essa instabilidade sem produzir rótulos órfãos. | *Nenhum QAS ainda mintado* — análogo estrutural a DOM-0002 (proveniência, nunca coerção silenciosa) | VALIDATION REQUIRED |
| D3 | **Gargalo do revisor único / risco de fator de ônibus** — hoje existe apenas um revisor clínico nomeado (E9, E10). | Um processo que exige o titular em toda string não escala e é um risco de cronograma se o portfólio de vias crescer; distingue fortemente as opções (a) vs (b). | *Nenhum QAS ainda mintado* — risco de entrega, a registrar no risk-register (§6.2) | VALIDATION REQUIRED |
| D4 | **Auditabilidade/imutabilidade** — texto pt-BR validado deve ser congelado por `RuleVersion` (ADR-0007), nunca editável in-place após o congelamento. | Motivado por E11 e pela premissa A1; distingue opções que produzem um artefato versionado das que não produzem. | *Nenhum QAS ainda mintado* — análogo a DOM-0002 aplicado a texto, não a fato clínico | VALIDATION REQUIRED |
| D5 | **Métricas de cobertura objetivas, exigíveis em CI** ("100% das strings voltadas ao clínico validadas", "zero violações da lista de ambiguidade"). | E6 mostra que, hoje, 0 de 35 termos do glossário está validado — a linha de base é mensurável e nula; qualquer opção deve mover esse número de forma auditável. | *Nenhum QAS ainda mintado* — métrica de processo, não de runtime | VALIDATION REQUIRED |
| D6 | **Nível de leitura / carga cognitiva sob pressão de tempo.** | SOURCE, prompt §11: "low-cognitive-load prioritization tested during interruptions and handoffs"; "explainability ... without overwhelming users." | QAS-0023 (modo degradado explícito — analogamente, explicação parcial nunca deve confundir) | VALIDATION REQUIRED |

**Excluído por não discriminar:** "está em português" (toda opção satisfaz isso por
construção — DEC-G0-10 já decidiu o idioma); "está escrito em algum lugar" (trivial).

---

## 4. Alternativas consideradas

Três alternativas — as duas explicitamente cotadas na tarefa mais o adiamento — mais uma
variante de reforço externo enumerada por completude. Nenhuma ordem de apresentação
implica preferência.

### Opção A — Glossário em repositório + revisão por clínico nomeado por pacote *(decidida — GDEC-0007, 2026-08-15)*

**Descrição.** Um pipeline de quatro passos, executado por par de string a cada novo
conteúdo clínico:

1. **Autoria.** O agente/especialista que redige conteúdo clínico (nome de via, texto de
   alerta, rótulo de estado de exibição) produz sempre um **par pt-BR + EN**, nunca apenas
   um dos dois, e cita o termo correspondente em `docs/03-domain/glossary.md` sob a regra
   **um-termo-um-conceito** (glossário §Cross-reference summary já lista os 35 conceitos
   candidatos). Um termo sem entrada correspondente no glossário é uma string não-conforme
   até que o glossário seja estendido — nunca uma exceção silenciosa.
2. **Revisão de linguagem clínica.** O revisor clínico nomeado (hoje, rodaquino-OMNI,
   GDEC-0003) revisa cada par contra: (i) a **lista de ambiguidade proibida** (semente
   abaixo); (ii) a política de nível de leitura e abreviação para exibição sob pressão de
   tempo (D6); (iii) a independência autor≠aprovador (E9, `independence_check` acima). Uma
   string não revisada permanece `PROPOSAL — AWAITING NAMED CLINICAL REVIEW`
   indefinidamente — silêncio não é consentimento (evidence-notation.md §2 regra 3).
3. **Verificação de consistência terminológica.** Compara-se o par validado contra os
   nomes de exibição LOINC/SNOMED CT/UCUM vinculados na `TerminologySnapshot` daquele
   pacote de regras. **O status de licenciamento do SNOMED CT no Brasil é
   VALIDATION REQUIRED (E12/A6, exigência da tarefa) — nenhum nome de exibição SNOMED CT
   pode ser usado antes de essa determinação existir.** Onde só LOINC/UCUM estão fixados
   (E8: hoje é o caso), a verificação roda contra esses dois apenas.
4. **Congelamento.** Uma vez validado, o conjunto de strings é congelado como conteúdo de
   explicação da `RuleVersion` correspondente (escopo ADR-0007, A1) — imutável dali em
   diante; qualquer mudança de redação exige uma nova versão assinada, nunca uma edição
   in-place.

**Lista semente de ambiguidade proibida** (PROPOSAL — não exaustiva; cada item cita a
lição de segurança ou de glossário que o motiva):

| # | Par ambíguo | Por que é perigoso confundir | Base |
|---|---|---|---|
| P1 | *"normal"* × *"não avaliado"* | A lição central de HAZ-0005: um `not_evaluated` nunca pode ser redigido com vocabulário que sugira avaliação normal ("sem alterações", "estável", "tudo bem") — essa é exatamente a coerção que já causou o achado de segurança mais grave do V1. | HAZ-0005; DOM-0004 |
| P2 | *"válido"* (status de avaliação V2 `valid`) × *"válido"* (qualidade de dado de origem AMH `valid`) | DOM-0008 proíbe colapsar as duas dimensões em uma única palavra exibida; a redação pt-BR precisa de qualificadores distintos (ex.: "avaliação válida" vs. "dado de origem válido"). | `status-dimensions.md`; DOM-0008 |
| P3 | *"estável"* (juízo clínico) × *"estabilidade"* como nome de via com status `not_evaluated`/`stale` | Redigir o nome da via junto de um estado não-avaliado pode ler como afirmação de estabilidade clínica quando só o *nome* da via, não seu resultado, está em pauta. | `pathway-index.md` (via "Estabilidade Hemodinâmica") |
| P4 | *"alerta"* × *"notificação"* | O próprio glossário sinaliza este como o par mais confundido do vocabulário: um Alerta é o fato clínico durável; uma Notificação é o evento de entrega. Uma notificação perdida ou atrasada nunca pode ser descrita em texto pt-BR como se o próprio Alerta tivesse desaparecido. | `glossary.md` §5 (nota de leitura) |
| P5 | *"resolvido"* (Resolution — encerramento) × *"reconhecido"/"ciência"* (Acknowledgment — apenas ciência) | Confundir os dois na cópia de UI pode levar um clínico a crer que um item foi encerrado quando apenas houve ciência. | `glossary.md` §5 |
| P6 | *"suprimido"* (Suppression — ato explícito e auditável) × ausência não rotulada | HAZ-0021/HAZ-0022: a ausência de texto de alerta nunca pode ser apresentada como "nada a informar" sem distinguir um não-disparo genuíno de uma supressão explícita ou de um `not_evaluated`. | HAZ-0021; HAZ-0022; `glossary.md` (Suppression) |
| P7 | *"parcial"* × uma glosa coloquial como *"quase completo"* | `partial` é um estado de alerta de dado incompleto, não uma aproximação tranquilizadora de "completo"; a redação não pode suavizar esse status. | `status-dimensions.md` (`partial`) |
| P8 | *"desatualizado"/"obsoleto"* (stale) × *"indisponível"* (missing) | DOM-0008 trata frescor e ausência como estados distintos; compartilhar uma única palavra de exibição para ambos apaga uma distinção clinicamente relevante. | `glossary.md` (Freshness/Staleness) |
| P9 | Rótulos operacionais que implicam severidade já tratada (ex.: precedência tipo "Assistido" mascarando severidade, achado 2 da revisão legada) | O vocabulário operacional pt-BR não pode implicar que uma condição foi resolvida/tratada quando apenas um estado administrativo (ex.: paciente atendido por outro motivo) foi registrado. | `legacy-review/alert-threshold-engine/README.md` achado 2 |

**Contra os direcionadores.** D1: mecanismo mais direto — a lista de ambiguidade e a
revisão nomeada atacam HAZ-0005 explicitamente, mas dependem inteiramente da atenção e da
disponibilidade de um único revisor (fraqueza honesta: nada aqui é automaticamente
infalível). D2: forte — a etapa 3 é desenhada exatamente para não deixar o rótulo pt-BR
divergir do vínculo de máquina, mas sua eficácia real depende de A3 (vínculos ainda não
fixados, E8) — hoje a etapa 3 só pode rodar contra LOINC/UCUM. D3: **é a fraqueza mais
honesta desta opção** — todo o pipeline passa pelo mesmo humano nomeado (E9/E10); é um
gargalo real, não hipotético. D4: forte — o congelamento por `RuleVersion` (A1) dá
auditabilidade real. D5: forte — cada um dos quatro passos produz um artefato verificável
(entrada de glossário, registro de revisão, relatório de consistência, hash da versão
congelada), o que permite métricas de CI. D6: parcialmente endereçado pela política de
nível de leitura no passo 2, mas nenhum teste de compreensão com usuários existe ainda
(E-5.6 do safety-case, vazio).

**Consequências positivas.** Reaproveita infraestrutura já existente (`glossary.md`,
GDEC-0003, o padrão de `RuleVersion` congelada); ataca diretamente a lição HAZ-0005 com uma
lista nomeada e revisável; produz artefatos auditáveis por CI (D5); não pressupõe nenhum
fornecedor externo nem custo recorrente.

**Consequências negativas.** Depende de um único revisor humano hoje (D3) — um ponto único
de falha operacional e um risco de cronograma se o volume de conteúdo clínico crescer
(portfólio de vias, múltiplos pacotes); a verificação terminológica (passo 3) está, na
prática, bloqueada em vínculos que ainda não existem fixados (E8) até que ADR-0013 avance;
não resolve, por si, a questão de licenciamento do SNOMED CT (E12) — apenas a torna uma
condição de bloqueio explícita para o passo 3.

**O que precisaria ser verdade para esta ser a resposta certa.** Um segundo revisor
clínico pt-BR nomeado surge antes do primeiro congelamento real de `RuleVersion`
(mitigando D3); ADR-0013 fixa ao menos LOINC/UCUM (A3 se sustenta); o glossário
(`glossary.md`) continua sendo estendido em vez de substituído (A5).

**Custo de saída se revertida.** Baixo-moderado: o glossário e a lista de ambiguidade
sobrevivem como artefato reutilizável mesmo que o mecanismo de revisão mude; o que se
perde é o histórico de revisões atreladas a um processo específico, não o conteúdo
validado em si (que permanece congelado por versão, per D4).

### Opção B — Serviço profissional externo de tradução médica por release

**Descrição.** Cada release de conteúdo clínico (conjunto de pacotes de regras) é
enviado a um serviço profissional de tradução/localização médica externo, especializado
em terminologia clínica pt-BR, que produz e certifica os pares pt-BR/EN antes do
congelamento.

**Contra os direcionadores.** D1: potencialmente mais forte em qualidade linguística
média (tradutores médicos profissionais), mas **não elimina** o risco central HAZ-0005 —
um tradutor externo, sem acesso ao modelo de domínio da V2, pode produzir uma tradução
linguisticamente correta que ainda assim usa vocabulário tranquilizador para
`not_evaluated`, porque não conhece a semântica de status da V2. D2: mais fraco por
padrão — o vendor não tem visibilidade dos vínculos LOINC/SNOMED CT/UCUM internos a menos
que isso seja explicitamente contratado como parte do escopo (custo adicional não
orçado). D3: resolve o gargalo do revisor único ao preço de introduzir uma dependência
externa com seu próprio cronograma e custo por release. D4: neutro — o congelamento por
versão ainda seria necessário e não depende de qual opção produz o texto. D5: mais difícil
de medir em CI — cobertura e conformidade dependeriam de entregáveis de terceiro, não de
um artefato em repositório. D6: depende inteiramente do escopo contratado com o vendor.

**Consequências positivas.** Qualidade de tradução profissional; remove o gargalo de um
único revisor interno; potencialmente mais escalável em volume.

**Consequências negativas.** Custo recorrente não orçado (nenhum modelo de custo existe —
FinOps ainda não ativado, mesmo padrão de lacuna registrado em ADR-0001 D9); introduz uma
dependência de cronograma externa a cada release; risco real de o vendor produzir
linguagem clinicamente "correta" mas semanticamente desalinhada com o modelo de status da
V2 sem uma etapa de verificação interna equivalente ao passo 3 da Opção A — ou seja, **a
Opção B provavelmente ainda precisaria de uma revisão interna posterior**, o que a torna
um complemento da Opção A mais do que um substituto puro; não resolve a questão de
licenciamento SNOMED CT (E12) — o vendor tampouco teria autoridade sobre isso.

**O que precisaria ser verdade para esta ser a resposta certa.** Um orçamento e um
processo de contratação de vendor existem; o vendor aceita ser instruído sobre o modelo de
status de cinco valores da V2 e sobre a lista de ambiguidade proibida como parte do
contrato (i.e., não é uma tradução genérica); uma etapa de verificação interna
equivalente ao passo 3 é mantida mesmo assim.

**Custo de saída se revertida.** Moderado: depende dos termos contratuais e de
propriedade sobre as traduções entregues; sem um contrato favorável, o material entregue
pode não ser livremente reutilizável ou auditável do mesmo modo que um artefato em
repositório.

### Opção C — Adiar até a primeira fatia de UI

**Descrição.** Nenhum processo de validação pt-BR é formalizado agora. Conteúdo clínico
pt-BR continua sendo escrito ad hoc (como no V1) até que a primeira fatia vertical de UI
(Gate G7) precise exibir texto clínico a um usuário real, momento em que um processo seria
desenhado.

**Consequências positivas.** Nenhum esforço de processo é gasto antes de haver conteúdo
concreto para validar; evita desenhar um processo em torno de vínculos terminológicos
ainda não fixados (E8).

**Consequências negativas.** Repete exatamente o padrão que E3 documenta como já tendo
falhado no V1 — texto clínico pt-BR embutido sem trilha de revisão, descoberto apenas em
auditoria retrospectiva; cada dia de conteúdo clínico produzido sem processo (e conteúdo
já está sendo produzido — `rule-releases/sofa/logic.yaml`, E8) aumenta o volume de dívida
de validação a ser resolvida de uma vez, sob pressão de prazo, exatamente no momento (Gate
G7) em que a atenção clínica nomeada é mais escassa.

**Custo do adiamento.** INFERENCE: cresce de forma **não-linear**, não linear — cada
pacote de regras redigido sem o par pt-BR/EN e sem a lista de ambiguidade aplicada (como
já é o caso de `rule-releases/sofa/logic.yaml`, que hoje não contém nenhum texto de
explicação pt-BR) precisará ser retroativamente revisado, com o mesmo risco que a Opção A
existe precisamente para prevenir.

### 4.1 Comparação frente aos direcionadores

Apenas qualitativo — sem pesos, sem pontuação (nenhum dono ratificou pesos; mesma
disciplina de `portfolio-method.md`).

| Direcionador | A — glossário + revisor nomeado | B — vendor externo por release | C — adiar |
|---|---|---|---|
| D1 dano zero por ambiguidade | Ataca HAZ-0005 diretamente via lista nomeada; depende de disponibilidade do revisor | Qualidade linguística forte, mas não conhece a semântica de status da V2 sem instrução explícita | Risco recorrente enquanto conteúdo continua sendo produzido sem processo |
| D2 fidelidade terminológica | Etapa dedicada, hoje limitada a LOINC/UCUM (E8) | Requer escopo contratual explícito; não garantido por padrão | Nenhuma verificação até G7 |
| D3 gargalo do revisor único | Fraqueza confessa — um só revisor hoje | Resolve o gargalo, ao custo de uma nova dependência externa | Não resolvido; adiado |
| D4 auditabilidade/imutabilidade | Forte, via congelamento por `RuleVersion` (A1) | Neutro — depende do mesmo mecanismo de congelamento | Nenhuma até G7 |
| D5 métricas exigíveis em CI | Forte — artefatos em repositório são verificáveis | Mais fraco — depende de entregáveis de terceiro | Nenhuma métrica até G7 |
| D6 nível de leitura/carga cognitiva | Política declarada no passo 2; sem teste de compreensão ainda | Depende do escopo contratado | Nenhum até G7 |
| Custo | Sem custo recorrente novo; custo de tempo do revisor único | Custo recorrente não orçado (nenhum modelo de custo existe) | Custo zero agora, dívida crescente depois |
| Reversibilidade | Alta — ver §8.1 | Moderada — depende de termos contratuais | n/a — nada a reverter, valor de opção preservado a um custo de carregamento crescente |

---

## 5. Decisão e escopo

### 5.0 Decisão (GDEC-0007, 2026-08-15)

> decided_by: **rodaquino-OMNI** (revisor clínico nomeado, GDEC-0003; também titular
> interino de papéis `AUTH-*` de fase de projeto per GDEC-0004/DEC-G0-05 onde
> pertinente).
>
> A Opção A (§4) é aceita como decisão para o PROCESSO de validação terminológica.
> Registro por questão, per a folha de decisão do ciclo 1
> (`docs/05-clinical-safety/cycle-1-review-decision-sheet.md` §10, linhas A29-1 a
> A29-6):
>
> - **A29-1 →** licenciamento SNOMED CT Brasil não verificado: **prossegue
>   LOINC/UCUM-only** (passo 3 da Opção A roda apenas contra esses dois sistemas);
>   verificação de licenciamento é **comissionada** separadamente (C2 abaixo).
> - **A29-2 →** segundo revisor de linguagem pt-BR: **não exigido** na fase
>   sintética atual; **obrigatório** antes de qualquer exposição de texto clínico
>   pt-BR a clínico real.
> - **A29-3 →** tradução retroativa do corpus de ciclo 0/1 (DEC-G0-10) é **paralela,
>   não bloqueante** — traduzir na próxima revisão material de cada documento; o
>   corpus EN permanece evidência válida.
> - **A29-4 →** pinagem de terminologia (ADR-0013, `not-started`) é decidida: **semear
>   o ADR-0013 apenas com versões LOINC/UCUM** no próximo ciclo, sem esperar pelo
>   perfil FHIR completo.
> - **A29-5 →** dono do lint de string em CI (D5): **backlog do engenheiro de
>   supply-chain/CI**; não é trabalho imediato deste ADR.
> - **A29-6 →** escopo do processo: **inclui todo texto visível a clínico**
>   (inclusive MCP/alertas); **exclui** erros de API voltados a desenvolvedor — o
>   critério é quem lê o texto, não onde ele vive.
>
> **rationale:** conforme folha de decisão do ciclo 1 (GDEC-0007); fundamentos por
> linha na própria folha (`cycle-1-review-decision-sheet.md` §10).
>
> **supersessão:** rege-se pela própria seção de gatilhos de revisão desta ADR (§8) —
> nenhum gatilho adicional é criado por esta transcrição.
>
> **Nota de escopo.** Esta decisão fixa o PROCESSO; nenhum termo do glossário é
> ratificado. O segundo revisor pt-BR independente (C1), a verificação de
> licenciamento SNOMED CT (C2) e a ratificação item-a-item da lista de ambiguidade
> proibida (C6) permanecem OPEN e não são fechados por esta aceitação.

### 5.1 Condições — situação após a decisão de 2026-08-15 (GDEC-0007)

| # | Condição | Dono | Evidência que a encerraria | Status |
|---|---|---|---|---|
| C1 | Um segundo revisor clínico pt-BR independente é identificado ou uma justificativa explícita registra por que o processo pode operar com um único revisor durante o ciclo 1 (par de independência 1, decision-rights.md §3). | `AUTH-CLINSAFETY` | Nomeação registrada em decision-register.md, ou aceitação explícita do risco de fator único no risk-register. | **PARCIALMENTE FECHADA — A29-2 aceita operar com revisor único na fase sintética; segundo revisor permanece obrigatório antes de exposição a clínico real** |
| C2 | Determinação de licenciamento/distribuição do SNOMED CT no Brasil — se a V2 pretende usar nomes de exibição SNOMED CT no passo 3 da Opção A. | UNASSIGNED — VALIDATION REQUIRED (jurídico/licenciamento; possivelmente `AUTH-PRIVACY-LEGAL` ou um dono de licenciamento terminológico ainda não nomeado) | Parecer/registro de licenciamento nomeado. | **ABERTA — A29-1 comissiona a verificação; enquanto isso, LOINC/UCUM-only** |
| C3 | ADR-0013 fixa ao menos um sistema terminológico (LOINC no mínimo) para que o passo 3 da opção escolhida tenha um alvo real, não hipotético. | `AUTH-DATA-PLATFORM` + `AUTH-CLINSAFETY` | ADR-0013 alcança `accepted` ou ao menos `proposed` com um vínculo concreto. | **ABERTA — ADR-0013 continua `not-started`; A29-4 decide semeá-lo com LOINC/UCUM no próximo ciclo** |
| C4 | ADR-0007 define onde e como o texto de explicação é congelado por `RuleVersion` (Premissa A1). | `AUTH-CLINSAFETY` + `AUTH-SECURITY` | ADR-0007 alcança ao menos `proposed` com essa cláusula. | **FECHADA quanto à aceitação — ADR-0007 aceito em 2026-08-15 (GDEC-0007)** |
| C5 | A opção escolhida (A, B, C ou híbrida) é registrada por escrito pela autoridade nomeada, com a mesma disciplina de não-autoaprovação de `decision-rights.md` §1.2. | `AUTH-CLINSAFETY` + `AUTH-UX` | Este documento passa a `under-review` e depois `accepted` com a decisão escrita em §5. | **FECHADA — ver §5.0, GDEC-0007, 2026-08-15 (Opção A)** |
| C6 | A lista semente de ambiguidade proibida (§4 Opção A) é revisada, corrigida e ratificada — ou explicitamente rejeitada — pelo revisor clínico nomeado antes de ser tratada como base de lint em CI. | `AUTH-CLINSAFETY` | Registro de revisão da lista, item a item. | **ABERTA — não coberta item a item pela folha de decisão do ciclo 1** |

---

## 6. Consequências

Como nenhuma opção é escolhida, o que segue são consequências **da existência deste ADR em
estado `proposed`**, não de uma decisão.

### 6.1 Positivas

- A lacuna que o V1 deixou aberta (E3: texto clínico pt-BR sem trilha de validação) agora
  tem um processo candidato nomeado, evidenciado e revisável, em vez de permanecer
  implícita.
- A lista semente de ambiguidade proibida (§4 Opção A) já pode ser usada como insumo de
  revisão mesmo antes da aceitação formal deste ADR — reduzindo o risco de que conteúdo
  clínico pt-BR continue sendo produzido (como `rule-releases/sofa/logic.yaml`, E8) sem
  nenhum ponto de referência.
- Torna explícito que a verificação de consistência terminológica está hoje bloqueada em
  vínculos de máquina não fixados (E8) e em uma questão de licenciamento não resolvida
  (E12) — útil para planejamento, e uma defesa contra a suposição implícita de que
  "validar o texto" é só uma tarefa de revisão de prosa.

### 6.2 Negativas

- Enquanto este ADR permanece `proposed`, nenhum texto clínico pt-BR produzido tem um
  processo formalmente aceito atrás de si — cada pacote de regras em elaboração
  (`rule-releases/`) corre o risco de precisar de revisão retroativa quando o processo for
  aceito.
- O gargalo do revisor único (D3) é uma ambiguidade real que a pressão de entrega tentará
  resolver por padrão — por exemplo, um agente redigindo e "auto-aprovando" uma tradução
  por urgência. **Este risco deve ser registrado no risk-register.**
- A dependência em ADR-0007 e ADR-0013, ambos `not-started`, significa que a Opção A não
  pode ser executada por completo hoje — apenas seus passos 1 e 2 (autoria e revisão de
  linguagem) são executáveis; o passo 3 (consistência terminológica) está parcialmente
  bloqueado.

### 6.3 Neutras / estruturais

- O relatório permanente do glossário (`glossary.md`) — "No term in this table has an
  approved pt-BR translation" — não muda em razão deste ADR; nenhuma tradução é ratificada
  aqui.
- Nada neste ADR autoriza o uso de nomes de exibição SNOMED CT antes que C2 (§5.1) seja
  fechada.

---

## 7. Implicações transversais

| Dimensão | Implicação | Rótulo | Papel dono | ID de acompanhamento |
|---|---|---|---|---|
| Segurança clínica | O processo existe precisamente para prevenir a recorrência de HAZ-0005 em texto de exibição (não apenas em lógica de avaliação): um `not_evaluated` mal traduzido é tão perigoso quanto um `not_evaluated` mal computado. HAZ-0021, HAZ-0022 e HAZ-0036 (fraseologia que lê como diretiva) aplicam-se diretamente à redação, não só à lógica. | INFERENCE de E5, E14, E15 | `AUTH-CLINSAFETY` | HAZ-0005, HAZ-0021, HAZ-0022, HAZ-0036 |
| Segurança (security) | Não aplicável diretamente — texto de exibição não é uma superfície de autenticação/autorização. Nota: se o processo vier a incluir um lint de CI (D5), esse lint é uma ferramenta de build, sujeita à mesma política de cadeia de suprimentos de software que qualquer outra (ADR-0022, `not-started`). | INFERENCE | `AUTH-SECURITY` | ADR-0022 |
| Privacidade (LGPD, minimização, propósito) | Texto de explicação clínica não deve, por si, carregar PHI (nomes de pacientes, identificadores) — apenas rótulos de conceito e razões estruturadas. Nenhuma alegação de conformidade LGPD é feita aqui; DEC-G0-03 mantém o desenvolvimento restrito a dados sintéticos até parecer jurídico. | VALIDATION REQUIRED | `AUTH-PRIVACY-LEGAL` | pendente |
| Interoperabilidade | A etapa de verificação de consistência terminológica (§4 Opção A, passo 3) é o ponto de contato entre este processo e ADR-0013 (perfis FHIR/terminologia); os nomes de exibição LOINC/SNOMED CT/UCUM não são escolhidos aqui — apenas consumidos como alvo de verificação uma vez fixados. | INFERENCE de E8 | `AUTH-DATA-PLATFORM` | ADR-0013 |
| Acessibilidade | A política de nível de leitura e abreviação (D6, passo 2) tem implicação direta em WCAG 2.2 AA — abreviações não expandidas e jargão de baixo nível de leitura são barreiras de compreensão, especialmente sob leitor de tela e pressão de tempo (prompt §11). Nenhum teste de compreensão com usuários existe ainda (E-5.6, vazio). | INFERENCE do prompt §11 | `AUTH-UX` | ADR-0021 |
| Operacional | Nenhuma implicação operacional de runtime direta; a implicação é de processo de autoria/revisão de conteúdo, não de infraestrutura. | Não aplicável — nenhuma implicação operacional de runtime identificada nesta análise | `AUTH-OPERATIONS` | Não aplicável — nenhum ID de acompanhamento aberto |
| Custo | A Opção B introduz um custo recorrente não orçado (nenhum modelo de custo existe — mesma lacuna geral registrada em ADR-0001 D9); a Opção A tem custo de tempo do revisor único, não custo monetário direto novo. | VALIDATION REQUIRED | `AUTH-PRODUCT` | pendente |
| Migração | Se a Opção C (adiar) for seguida e depois abandonada, o conteúdo clínico pt-BR já produzido sem processo (ex.: `rule-releases/sofa/logic.yaml`, hoje sem texto de explicação pt-BR) precisaria de revisão retroativa completa — um custo de migração de conteúdo, não de dado ou de esquema. | INFERENCE | `AUTH-CLINSAFETY` | pendente |

---

## 8. Reversibilidade, gatilhos de revisão, kill/rollback

### 8.1 Avaliação de reversibilidade

| Opção | Reversibilidade | O que fica preso na reversão | Rótulo |
|---|---|---|---|
| A — glossário + revisor nomeado | **Alta** — o glossário e a lista de ambiguidade são artefatos em repositório, reutilizáveis mesmo que o mecanismo de revisão mude | O histórico de revisões atrelado ao processo específico (não o conteúdo validado, que permanece congelado por versão) | INFERENCE |
| B — vendor externo por release | **Moderada** — depende de termos contratuais de propriedade sobre as traduções entregues | Potencialmente o próprio conteúdo traduzido, se os termos contratuais não garantirem reuso livre | INFERENCE |
| C — adiar | **n/a** — nada a reverter; valor de opção preservado a um custo de carregamento crescente (ver §4 Opção C "Custo do adiamento") | n/a | INFERENCE |

SOURCE (prompt §9.1 princípio 11): "Prefer reversible decisions and record
extraction/revisit triggers." Registrar esta ordenação não é uma recomendação da Opção A;
reversibilidade é um entre seis direcionadores.

### 8.2 Gatilhos de revisão

| # | Gatilho | Como é detectado | Quem é notificado | Ação no gatilho |
|---|---|---|---|---|
| T1 | ADR-0013 fixa (ou rejeita) SNOMED CT como sistema vinculado. | Registro de ADR-0013 | `AUTH-CLINSAFETY`, `AUTH-DATA-PLATFORM` | C2/C3 (§5.1) tornam-se acionáveis; a etapa 3 da opção escolhida pode incluir SNOMED CT |
| T2 | ADR-0007 define (ou não) o congelamento de texto de explicação por `RuleVersion`. | Registro de ADR-0007 | `AUTH-CLINSAFETY` | C4 (§5.1) fecha; Premissa A1 é confirmada ou invalidada |
| T3 | Um segundo revisor clínico pt-BR nomeado surge. | Registro de governança | `AUTH-CLINSAFETY` | C1 (§5.1) fecha; o risco de fator único (D3) é mitigado |
| T4 | O volume de conteúdo clínico pt-BR produzido sem revisão nomeada excede um limiar (ainda não fixado) de strings pendentes. | Auditoria de cobertura do glossário (§4 Opção A, passo 1) | `AUTH-CLINSAFETY`, orquestrador | Escalar para decisão urgente entre Opção A e Opção B — o gargalo D3 deixou de ser teórico |
| T5 | Determinação de licenciamento do SNOMED CT no Brasil é emitida (qualquer resultado). | Registro jurídico/de licenciamento | `AUTH-CLINSAFETY`, `AUTH-PRIVACY-LEGAL` | C2 (§5.1) fecha; a etapa 3 da Opção A é atualizada para incluir ou excluir formalmente nomes de exibição SNOMED CT |

### 8.3 Kill switch / rollback

Enquanto `proposed`, não há nada a desligar. O controle vigente é a **restrição
permanente** que já se aplica independentemente da aceitação deste ADR:

1. Nenhuma tradução deste documento, nem da lista semente de ambiguidade, é tratada como
   `DECIDED` — todas permanecem `PROPOSAL — AWAITING NAMED CLINICAL REVIEW` até revisão
   explícita (mesma disciplina de `legacy-review/`).
2. Nenhum agente aplica um rótulo `DECIDED` a uma tradução de glossário ou a este processo
   (`evidence-notation.md` §2 regra 6).
3. Se um pacote de regras for congelado (ADR-0007) contendo texto pt-BR não revisado por
   um clínico nomeado, isso é um defeito de processo a ser registrado como bloqueador, não
   uma exceção silenciosamente aceita — ecoando exatamente o achado E3 que motivou este
   ADR.

Na aceitação, a opção escolhida deve definir seu próprio mecanismo de correção: como uma
tradução já congelada e posteriormente identificada como ambígua ou incorreta é corrigida
(sempre via nova `RuleVersion`, nunca edição in-place, per D4) e como clínicos em campo são
notificados da mudança.

---

## 9. Método de validação e evidência vinculada

| # | Afirmação | Método de validação | Ambiente necessário | IDs vinculados |
|---|---|---|---|---|
| V1 | A lista semente de ambiguidade proibida (§4 Opção A) cobre os casos de confusão realmente observados no V1 e no vocabulário de status da V2. | Revisão item a item pelo revisor clínico nomeado; comparação contra `glossary.md` e `status-dimensions.md`. | Nenhum (revisão documental) | HAZ-0005, HAZ-0021, HAZ-0022; TST: pendente de arquitetura de teste |
| V2 | 100% das strings voltadas ao clínico em um pacote de regras congelado têm uma entrada pt-BR validada. | Auditoria de cobertura automatizada sobre o glossário + os pacotes de regras congelados (D5). | Ambiente de CI/build | TST: pendente de arquitetura de teste; REQ: pendente de catálogo de requisitos |
| V3 | Zero violações da lista de ambiguidade em um pacote de regras ativo. | Lint de string em CI contra a lista semente (§4 Opção A), uma vez ratificada (C6). | Ambiente de CI/build | HAZ-0005; TST: pendente de arquitetura de teste |
| V4 | Nenhum rótulo pt-BR diverge do nome de exibição LOINC/SNOMED CT/UCUM vinculado, para os sistemas terminológicos efetivamente fixados (A3). | Diff automatizado entre rótulo pt-BR e nome de exibição do vínculo terminológico, uma vez que ADR-0013 fixe os sistemas-alvo. | Ambiente de CI/build; depende de ADR-0013 | ADR-0013; TST: pendente de arquitetura de teste |
| V5 | A política de nível de leitura é compreensível por clínicos reais sob simulação de pressão de tempo. | Estudo de simulação com participantes clínicos externos (Gate G1, per DEC-G0-05 — o julgamento do próprio titular não basta como evidência G1). | Ambiente de pesquisa com usuários | VAL: pendente do backlog de validação; DOM-0004 |
| V6 | Nenhum nome de exibição SNOMED CT é usado antes de uma determinação de licenciamento nomeada. | Verificação estática: nenhuma ocorrência de vínculo SNOMED CT em pacote congelado sem a condição C2 fechada. | Ambiente de CI/build | pendente — nenhum HAZ/SAF específico de licenciamento mintado ainda |

---

## 10. Relações de supersessão

- **Supersede:** nenhum.
- **Superseded by:** nenhum.
- **Notas de relação:** este ADR opera a fatia "processo de validação terminológica" do
  tópico candidato mais amplo listado em `adr-index.md` §6, "pt-BR clinical language and
  localization strategy" — ele não esgota esse tópico. Uma estratégia de localização mais
  ampla (por exemplo, cobertura de acessibilidade completa, ou um segundo idioma clínico)
  permanece em aberto para um ADR futuro ou para uma revisão deste, caso o escopo de
  `adr-index.md` §6 seja formalmente dividido. Se ADR-0007 ou ADR-0013 adotarem, eles
  próprios, uma cláusula de validação terminológica incompatível com o processo aqui
  proposto, a reconciliação deve ocorrer como emenda a este ADR ou como um novo ADR que o
  supersede — nunca como uma divergência silenciosa entre documentos.

---

## 11. Autoverificação e registros de honestidade

### 11.1 Contra a lista de completude do template

Todas as seções presentes; três alternativas reais mais adiamento (A, B, C) — cada uma com
consequências positivas e negativas; direcionadores são discriminantes e mapeados a
QAS onde um QAS existe, e explicitamente marcados "nenhum QAS ainda mintado" onde não
existe; **nenhuma meta numérica inventada**; as oito linhas de implicação transversal
presentes (duas explicitamente "Não aplicável" com razão, não omitidas); reversibilidade,
gatilhos e kill/rollback presentes; método de validação com placeholders honestos
(`TST:`, `REQ:`, `VAL:` verbatim, nenhum ID inventado); supersessão presente; **nenhuma
tecnologia escolhida por herança da legada ou da AMH** — este ADR não escolhe nenhuma
tecnologia, apenas um processo; nenhuma aprovação fabricada — `rodaquino-OMNI` é citado
apenas onde GDEC-0003/DEC-G0-05 já o nomeiam por escrito, nunca inventado.

### 11.2 Registros de honestidade — o que um revisor deve olhar com desconfiança

- **A Opção A era chamada de "candidata recomendada nesta PROPOSTA" em §4** porque a
  tarefa que originou este rascunho pediu explicitamente essa recomendação; essa
  caracterização é agora superada — o revisor clínico nomeado aceitou a Opção A como
  decisão em 2026-08-15 (GDEC-0007, ver §5.0). Registrado aqui como histórico honesto
  do rascunho, não como um resíduo de indecisão.
- **E12 é uma ausência de evidência, não uma confirmação de ausência de licença.** Uma
  busca exaustiva em `docs/` não encontrar menção ao licenciamento do SNOMED CT no Brasil
  não prova que o SNOMED CT seja livre de licenciamento no Brasil, nem que a organização
  não o detenha por outra via não documentada neste repositório. A condição C2 (§5.1)
  permanece aberta precisamente por essa razão.
- **A concentração de autoridade (GDEC-0003 + DEC-G0-05 no mesmo humano) é reafirmada, não
  descoberta por este ADR** — ela já está registrada como risco em ADR-0004 §11.2 e nos
  itens de integração de `g0-resolucoes-2026-08-15.md`. Este ADR a cita porque é
  diretamente relevante ao par de independência autor≠aprovador (`independence_check`
  acima), não porque a esteja denunciando pela primeira vez.
- **A lista semente de ambiguidade proibida (§4 Opção A) é PROPOSAL de um agente, não de
  um clínico.** Ela foi construída a partir de achados de revisão já evidenciados
  (HAZ-0005, glossário, revisão legada), não de julgamento clínico original deste
  documento — mas continua exigindo ratificação nomeada (condição C6, §5.1) antes de
  qualquer uso como base de lint obrigatório em CI.
