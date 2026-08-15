---
id: ADR-0007
title: Formato do bundle de regras clínicas, assinatura, fluxo de aprovação, ativação, rollback e retirada
status: proposed
status_history:
  - status: not-started
    date: 2026-08-14
    by: engenheiro de arquitetura candidata e do programa de ADRs (Onda 2)
    note: ID reservado em adr-index.md; tópico fixado pela §10 item 7 do prompt.
  - status: proposed
    date: 2026-08-15
    by: especialista em ciclo-de-vida de bundle de regras (ciclo 1, Tarefa 4)
    note: >
      Redigido a partir dos achados forenses da Tarefa 1 (motor de alertas/limiares
      legado), dos requisitos SAF-0019/SAF-0020/SAF-0021 já propostos pelo caso de
      segurança clínica, e do modelo de domínio já estabelecido
      (`RuleBundle → RuleVersion/TerminologySnapshot/TestPack/Approval`). Apresenta
      opções e drivers para os sete eixos do prompt §10 item 7. NENHUMA decisão é
      registrada. A separação autor≠aprovador (regra não negociável 10) é codificada
      estruturalmente no fluxo de aprovação proposto (§4.3), não apenas descrita em
      prosa — ver a nota de independência abaixo.
date: 2026-08-15
owner: rodaquino-OMNI — candidato AUTH-CLINSAFETY (GDEC-0003, escopo ciclo-1); ver nota de independência
approvers:
  - rodaquino-OMNI — candidato AUTH-CLINSAFETY (GDEC-0003, escopo ciclo-1) — cláusulas
    clínicas (eixos 1, 3, 4, 5, 6, 7). Rótulo desta ADR permanece PROPOSAL até revisão
    escrita por ele; nenhum agente aplica DECIDED.
  - UNASSIGNED — VALIDATION REQUIRED — candidato AUTH-SECURITY — cláusulas de
    assinatura/custódia de chave (eixo 2 e a parte de integridade do eixo 1).
    VALIDATION REQUIRED — sem titular nomeado.
decision_deadline: >
  UNSET — sem data-calendário fixada por nenhum titular. Forçada indiretamente pelos
  Gates G2 (portfólio de vias) e G6 (design de segurança/proteção), ambos listados em
  `adr-index.md` §3 como bloqueados por esta ADR: nenhum bundle pode ser ativado para
  avaliação acionável antes de G2 fechar, e nenhuma cláusula de assinatura pode ser
  tratada como suficiente antes de G6 fechar.
deciding_authority_rule: >
  `docs/00-governance/decision-rights.md` §2, linha "Architecture decisions (ADR
  ratification)": AUTH-PRODUCT + titular de domínio pertinente ao tópico da ADR.
  `adr-index.md` §3 nomeia o titular candidato desta ADR como AUTH-CLINSAFETY +
  AUTH-SECURITY (conjunta). Nenhum agente pode marcar esta ADR `accepted`
  (`evidence-notation.md` §2 regra 3; `adr-index.md` §2.1).
independence_check: >
  `decision-rights.md` §3 par 1 ("Rule author / Clinical approver") é o par
  estruturalmente central desta ADR: o eixo 3 (fluxo de aprovação, §4.3) existe para
  tornar esse par impossível de violar por construção, não apenas por política.
  Aplicação ao humano nomeado, registrada com honestidade: rodaquino-OMNI é o
  "collector" (autor) dos achados forenses em
  `docs/05-clinical-safety/legacy-review/alert-threshold-engine/` que esta ADR cita
  como evidência (§2.1). Isso NÃO o desqualifica de revisar ESTA ADR — um documento de
  arquitetura sobre o ciclo de vida do bundle, não um bundle de regra clínica em si.
  Mas GDEC-0003 registra textualmente que "um segundo revisor é necessário para
  conteúdo que o aprovador redigiu pessoalmente" — essa cláusula é precisamente o
  resíduo que o eixo 3 (§4.3) codifica para bundles futuros: se rodaquino-OMNI autorar
  o CONTEÚDO de um bundle de regra (por exemplo, valores de limiar por ele
  re-derivados, como em `docs/05-clinical-safety/rule-releases/sofa/logic.yaml`), ele
  não pode ser o aprovador independente DAQUELE bundle específico, mesmo sendo o único
  AUTH-CLINSAFETY hoje nomeado — o bloqueio correspondente deve ser registrado em
  `blockers-register.md` (`decision-rights.md` §3 regra 3), nunca contornado por uma
  segunda função do mesmo humano.
links:
  drivers:
    domain_invariants: [DOM-0003, DOM-0004]
    quality_scenarios: [QAS-0011, QAS-0020, QAS-0026, QAS-0027]
    risks:
      - "risco de bloqueio estrutural por escassez de segundo revisor clínico — a
        registrar em risk-register.md (ver §2.2 A3 e §11.2 desta ADR)"
  constrains:
    requirements: ["REQ: pendente de catálogo de requisitos (docs/04-product-requirements ainda não existe)"]
    clinical: ["CLR: pendente do portfólio de vias clínicas (Gate G2)"]
    safety: [SAF-0019, SAF-0020, SAF-0021, SAF-0030, SAF-0035]
  hazards: [HAZ-0005, HAZ-0019, HAZ-0020, HAZ-0021, HAZ-0022, HAZ-0031, HAZ-0036]
  tests: ["TST-DOM-0003", "TST: pendente de arquitetura de testes (demais casos)"]
  validations: ["VAL: pendente do backlog de validação"]
  adrs:
    depends_on: []
    feeds: [ADR-0008, ADR-0009, ADR-0013, ADR-0022]
  gates: [G2, G6]
  evidence:
    - docs/05-clinical-safety/legacy-review/alert-threshold-engine/README.md
    - docs/05-clinical-safety/legacy-review/alert-threshold-engine/engine-review.md
    - docs/05-clinical-safety/legacy-review/alert-threshold-engine/thresholds-seed-review.md
    - docs/05-clinical-safety/legacy-review/alert-threshold-engine/alert-threshold-cluster-review.md
    - docs/05-clinical-safety/legacy-review/ews/shared-findings.md
    - docs/05-clinical-safety/safety-requirements.md
    - docs/05-clinical-safety/hazard-log.md
    - docs/05-clinical-safety/evaluation-status-semantics.md
    - docs/03-domain/conceptual-model.md
    - docs/03-domain/invariants/DOM-invariants.md
    - docs/06-architecture/quality-attributes/quality-attribute-scenarios.md
    - docs/00-governance/registers/decision-register.md (GDEC-0003, GDEC-0006)
    - docs/00-governance/decision-rights.md
    - docs/05-clinical-safety/rule-releases/sofa/logic.yaml
supersedes: null
superseded_by: null
provenance:
  source_repo: intensicare-V2
  path_or_url: docs/06-architecture/adrs/ADR-0007-rule-bundle-format-signing-approval-activation-rollback-retirement.md
  commit_sha_or_version: >
    ddac9bc (HEAD do repositório na redação; a árvore de trabalho tem outras edições
    concorrentes não commitadas de especialistas paralelos do ciclo 1 — este arquivo
    é novo e não colide com nenhuma delas)
  section_or_lines: >
    INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §6.4 (linhas 330-346, campos obrigatórios do
    bundle assinado), Gate G2 (linhas 347-349), §10 item 7 (linha 645), §3 regra 10
    (autor ≠ aprovador), §4 (independência exigida, linhas 199-206)
  date_collected: 2026-08-15
  collector: especialista em ciclo-de-vida de bundle de regras (ciclo 1, Tarefa 4)
  transformation: >
    raciocinado a partir dos achados da Tarefa 1 (forense do motor de alertas/limiares
    legado), dos requisitos SAF-0019/SAF-0020/SAF-0021 já propostos pelo caso de
    segurança clínica (Onda 1) e do modelo de domínio já estabelecido
    (conceptual-model.md §5). Nenhuma verificação independente de código foi refeita
    por este agente; todo achado legado é citado como SOURCE, nunca reclassificado
    como OBSERVED (evidence-notation.md §2).
  confidence: medium
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
---

# ADR-0007 — Formato do bundle de regras clínicas, assinatura, fluxo de aprovação, ativação, rollback e retirada

> **Status: `proposed`. Este documento apresenta opções, drivers e uma recomendação
> não vinculante por eixo. NENHUMA decisão é registrada.** Nenhum agente pode marcar
> este ADR `accepted`. A seção 5 lê exatamente "NENHUMA DECISÃO É REGISTRADA" e nada
> antes dela pode ser citado como decidido — inclusive as recomendações do §4.9, que
> são PROPOSAL e não vinculam nenhum bundle real.

> **Nota de proveniência, dita uma vez e válida para todo o documento.** Esta ADR foi
> redigida em paralelo a outros dois artefatos do ciclo 1 diretamente relevantes: (a)
> `docs/05-clinical-safety/rule-releases/sofa/logic.yaml`, um precursor `0.1.0` já em
> disco que se autodeclara `semver_meaning: "0.x precursor — unsigned, unapproved, not
> releasable"` e `classification: NOT_ACTIONABLE_AUTHORSHIP_ARTIFACT` — tratado aqui
> como evidência concreta do padrão de precursor que o eixo 3 (§4.3) formaliza, não
> como um bundle já conforme a este ADR; (b) `docs/05-clinical-safety/evaluation-status-semantics.md`,
> referenciada apenas por ID por instrução do encaminhamento desta tarefa, sem
> reabertura de seu conteúdo. Divergência entre esta ADR e qualquer decisão futura
> sobre esses artefatos resolve-se a favor do artefato mais recente, e esta ADR é
> corrigida.

---

## 1. Contexto e problema

### 1.1 Por que este ADR é necessário agora

SOURCE (`PROMPT:330-346`, §6.4): toda versão aprovada de uma via clínica deve ser "an
immutable, signed bundle" carregando, no mínimo: identificador da regra e versão
semântica; uso pretendido/população/exclusões; evidência externa e data do snapshot;
titular clínico e aprovador independente; lógica/esquema legível por máquina e hash de
conteúdo; versões de terminologia/value-set; política de completude e frescor; vetores
de referência, propriedades, casos de fronteira e corpus de replay; vínculos de
perigo/controle; texto de explicação e critérios de aceitação de UX; status de
validação retrospectiva/prospectiva; e limiares de monitoramento, critérios de
rollback, kill switch e data/cadência de retirada. SOURCE (`PROMPT:645`, §10 item 7):
este é exatamente o tópico que este ADR deve resolver — "rule bundle format, signing,
approval, activation, rollback, and retirement".

O caso de segurança clínica da Onda 1 já **propôs** (não decidiu) três requisitos que
pressupõem a existência de exatamente o mecanismo que este ADR desenha: SAF-0019
(registro imutável de avaliação, incluindo por que uma regra NÃO disparou), SAF-0020
(bundles imutáveis, versionados, assinados, autor ≠ aprovador) e SAF-0021 (versão ativa
única, ativação/rollback transacionais, kill switch por bundle). Este ADR não inventa
esses requisitos; ele desenha o mecanismo concreto que os satisfaz.

### 1.2 A evidência do que acontece sem esse mecanismo

A revisão forense da Tarefa 1 (`legacy-review/alert-threshold-engine/`,
`legacy-review/ews/shared-findings.md`) documenta, a partir do código-fonte do sistema
legado (V1), exatamente a classe de defeito que este ADR existe para tornar
estruturalmente impossível:

- **Sem versionamento real.** "Rows are updated in place... A threshold change is
  therefore effective immediately, invisible on the alerts it subsequently shapes, and
  reconstructable only by forensic audit replay" (`thresholds-seed-review.md` §1,
  achado marcado **INPUT TO ADR-0007** pelo próprio revisor).
- **Sem separação autor/aprovador.** "All CRUD requires only the `admin` role... there
  is no clinical-approver step, no independent review, no ordering validation — the
  schema accepts `watch=10, urgent=2, critical=1`" (idem, §1) — uma configuração
  clinicamente absurda (limiares invertidos) que o esquema aceita silenciosamente.
- **Identidade de versão que não identifica comportamento.** "`algorithm_version`
  strings do not identify behavior. NEWS2-v3.0.0 was seeded/ratified as '...', then the
  code inverted that behavior... with the version string unchanged" e "the sign-off
  document itself records that the approver is the code-owner without verifiable
  professional registration" (`shared-findings.md` SF-2). Nenhuma ratificação legada
  pode ser herdada por V2 — cada tabela de banda/limiar que entrar em V2 exige
  ratificação nova por autoridade clínica nomeada.
- **Sem piso clínico para configuração local.** "`threshold_config` resolves bed ≻ unit
  ≻ tenant... but nothing bounds the values an operator may set. The de-facto safety
  mitigation... silently disappears if any scope raises `watch_threshold`"
  (`shared-findings.md` SF-4) — o defeito exato que o eixo 7 (§4.7) deve prevenir
  mecanicamente, não apenas documentar como política.
- **Três implementações divergentes da mesma semântica de resolução.** "One scope
  model, three implementations, two of them divergent. Threshold governance is
  meaningless if the resolution semantics differ per consumer"
  (`thresholds-seed-review.md` §2) — a lição de que deve existir exatamente **um**
  ponto de execução que consulta o bundle assinado, nunca vários caminhos paralelos.
- **Versão nunca carimbada na avaliação.** "`definition_version_id` is never set
  although the column and the `alert_definition_version` table exist"
  (`engine-review.md` §2.2 F2.4) — um registro de versão que existe mas que o caminho
  de execução real ignora é, na prática, equivalente a não ter registro nenhum.

### 1.3 A pergunta que este ADR responde

**Pergunta:** Qual é o formato do artefato de bundle de regra, o esquema de assinatura,
o fluxo de aprovação, o modelo de ativação, o mecanismo de rollback e a política de
retirada para o conteúdo clínico (regras/limiares) do IntensiCare V2 — e,
especificamente, **qual mecanismo estrutural garante que o autor de uma regra nunca
possa ser também seu aprovador** (regra não negociável 10, `PROMPT:122`)?

Este ADR trata sete eixos de decisão relacionados sob uma única pergunta, porque os
sete são interdependentes (o formato do eixo 1 precisa ter campos para a assinatura do
eixo 2; o fluxo do eixo 3 precisa de estados que a ativação do eixo 4 consome; etc.) e
tratá-los como sete ADRs separadas fragmentaria exatamente a coerência que
`PROMPT:645` pede como um único item. **Nota de estrutura, dita com transparência:** o
template de ADR (`ADR-template.md` §4) foi desenhado para uma pergunta com um conjunto
único de alternativas; esta ADR adapta a seção 4 para sete sub-perguntas, cada uma com
seu próprio conjunto de Opções A/B/Z, preservando todos os elementos obrigatórios do
checklist (§11) — pelo menos duas alternativas viáveis mais "adiar" por eixo,
consequências positivas e negativas em cada opção, e uma tabela de comparação contra os
drivers.

### 1.4 Fora de escopo

- **Seleção do portfólio clínico** (quais vias/regras existem) — Gate G2, `PROMPT` §6.3
  (MCDA), não esta ADR.
- **Semântica de status de avaliação** (`valid`/`partial`/`not_evaluated`/`stale`/
  `invalid`) — `evaluation-status-semantics.md`, referenciada aqui apenas por ID
  conforme instrução de escopo; possível ADR-0008 concorrente.
- **Máquina de estados de alerta/work item** — ADR-0009.
- **Onde o serviço executor de regras é hospedado** (monólito modular vs extração) —
  ADR-0002.
- **Mecânica concreta de custódia de chave/assinatura de software supply-chain**
  (HSM/KMS, ferramenta específica de assinatura) — futura ADR-0022; esta ADR define
  **o que** deve ser assinado e **por quem**, não **com qual ferramenta**.
- **Versionamento de terminologia/value-set em si** (LOINC/SNOMED/UCUM) — futura
  ADR-0013; esta ADR apenas exige que o bundle referencie um snapshot estável por ID.
- **Valores clínicos específicos** (limiares numéricos, cadência de retirada em dias) —
  conteúdo clínico, não arquitetura de ciclo de vida; permanece VALIDATION REQUIRED
  por titular clínico, nunca inventado aqui (`PROMPT` §15.3, disciplina já seguida por
  `evaluation-status-semantics.md` e `sofa/logic.yaml`).

---

## 2. Evidência e premissas

### 2.1 Evidência

**Nota epistêmica, válida para toda a tabela.** Este agente não reabriu nem
re-verificou nenhum arquivo-fonte do sistema legado; toda linha abaixo derivada da
revisão forense é rotulada `SOURCE` porque cita o registro da Tarefa 1 (que registrou
sua própria verificação como `OBSERVED`, sob a autoria de rodaquino-OMNI). Tratar uma
citação como observação seria exatamente o erro que `evidence-notation.md` §2 regra 3
proíbe.

| # | Rótulo | Declaração | Fonte | Confiança |
|---|---|---|---|---|
| E1 | SOURCE | O bundle assinado deve carregar, no mínimo, os 12 campos listados em §6.4: id+semver; população/exclusões; evidência+data; titular clínico e aprovador independente; lógica/esquema+hash; versões de terminologia; política de completude/frescor; vetores de referência+corpus de replay; vínculos de perigo/controle; texto de explicação pt-BR/EN+critérios de UX; status de validação; monitoramento/rollback/kill-switch/retirada. | `PROMPT:330-346` | high |
| E2 | SOURCE | "Clinical rules are immutable, versioned release artifacts. Rule authors may not approve their own clinical content." | `PROMPT:122` (regra não negociável 10) | high |
| E3 | SOURCE | Par de independência exigido: "Rule author ≠ clinical approver." | `PROMPT:199` (§4) | high |
| E4 | SOURCE | `decision-rights.md` §3 par 1 formaliza E3 como par de independência obrigatório; §3 regra 3 exige que, quando um par não pode ser satisfeito por falta de pessoal, a decisão **não** é tomada — é registrada em `blockers-register.md`. | `docs/00-governance/decision-rights.md` §3 | high |
| E5 | SOURCE | SAF-0019/SAF-0020/SAF-0021 já propõem, sem ratificação, exatamente o mecanismo desta ADR: registro imutável com razão de não-disparo; bundle assinado com aprovador distinto do autor; versão ativa única com ativação/rollback transacional e kill switch por bundle. | `docs/05-clinical-safety/safety-requirements.md` §E | high |
| E6 | SOURCE | O modelo de domínio já estabelece a estrutura `RuleBundle → RuleVersion/TerminologySnapshot/TestPack/Approval`, governada por DOM-0003 (avaliação determinística, versionada e replayable). | `docs/03-domain/conceptual-model.md` §5; `docs/03-domain/invariants/DOM-invariants.md` (DOM-0003) | high |
| E7 | SOURCE | Configuração de limiar legada não tem versionamento real: linhas são atualizadas *in place*; a mudança é efetiva imediatamente, invisível nos alertas que ela subsequentemente molda, e só reconstruível por replay forense de auditoria. Achado marcado **INPUT TO ADR-0007** pelo revisor. | `thresholds-seed-review.md` §1 | high |
| E8 | SOURCE | Mutação de limiar exige apenas papel `admin`; não há etapa de aprovador clínico, revisão independente ou validação de ordenação — o esquema aceita `watch=10, urgent=2, critical=1`. Achado marcado **INPUT TO ADR-0007**. | `thresholds-seed-review.md` §1 | high |
| E9 | SOURCE | "Configurable thresholds have no clinical floor" — nada limita os valores que um operador pode definir; a mitigação de segurança de fato (a banda `watch` capturando qualquer parâmetro único pontuando 3) desaparece silenciosamente se qualquer escopo elevar `watch_threshold`. | `shared-findings.md` SF-4 | high |
| E10 | SOURCE | Strings de versão de algoritmo não identificam comportamento: `NEWS2-v3.0.0` foi ratificado com um comportamento documentado e o código depois o inverteu com a string de versão inalterada; o documento de sign-off registra que o aprovador é o dono do código sem registro profissional verificável. | `shared-findings.md` SF-2 | high |
| E11 | SOURCE | Um modelo de escopo, três implementações, duas delas divergentes: o caminho de alerta ao vivo não usa o resolvedor real e implementa sua própria semântica de dois níveis, sem o nível de leito e sem excluir linhas de leito da consulta de unidade — defeito distinto do resolvedor testado e correto. | `thresholds-seed-review.md` §2; `engine-review.md` §2.2 F2.3 | high |
| E12 | SOURCE | `definition_version_id` nunca é gravado no alerta, embora a coluna e a tabela `alert_definition_version` existam — a lógica exata que produziu um alerta não pode ser reconstruída; um registro que existe mas que o caminho ao vivo ignora. | `engine-review.md` §2.2 F2.4 | high |
| E13 | SOURCE | O esquema de criação de configuração de limiar não tem campo `bed_id`, então o escopo mais específico (leito) só é configurável por escrita direta no banco, fora da API/auditoria. | `thresholds-seed-review.md` §1 | high |
| E14 | SOURCE | `evaluation-status-semantics.md` já define que um bundle morto/em rollback/que falhou ao carregar resolve para `not_evaluated` com razão `rule_unavailable` — nunca um não-disparo silencioso. Este ADR deve produzir um mecanismo de rollback/kill-switch compatível com essa semântica já proposta. | `evaluation-status-semantics.md` §3.3 (referenciado por ID apenas, conforme escopo desta tarefa) | high |
| E15 | SOURCE | GDEC-0003: rodaquino-OMNI aceita, para o ciclo 1, o papel de revisor clínico nomeado/aprovador de conteúdo clínico; divisão explícita — agentes são AUTORES DE REGRA, rodaquino-OMNI é APROVADOR CLÍNICO; nada que um agente escreva se torna DECIDED sem sua revisão. | `docs/00-governance/registers/decision-register.md` GDEC-0003 | high |
| E16 | SOURCE | QAS-0011 ("Rule bundle, version, and load health") já traça explicitamente para `ADR-0007`; exige que a versão ativa por via seja conhecida, verificável e auditável a todo instante, que um bundle não verificável nunca seja ativado, e que uma falha de carga seja um estado degradado explícito, nunca um retorno silencioso a um conjunto de regras anterior ou vazio. QAS-0020 exige reprodução de replay de 100%. QAS-0026 exige um pacote de evidência de release completo, montado pelo pipeline, como precondição do Gate G8. | `docs/06-architecture/quality-attributes/quality-attribute-scenarios.md` QAS-0011, QAS-0020, QAS-0026 | high |
| E17 | SOURCE | Um precursor real já existe em disco: `docs/05-clinical-safety/rule-releases/sofa/logic.yaml`, versão `0.1.0`, autodeclarado `semver_meaning: "0.x precursor — unsigned, unapproved, not releasable"`, `classification: NOT_ACTIONABLE_AUTHORSHIP_ARTIFACT`, `status: "PROPOSAL — AWAITING NAMED CLINICAL REVIEW"`. É evidência concreta e contemporânea do padrão "precursor 0.x → release 1.0 assinado" que o eixo 3 (§4.3) formaliza — não é, em si, um bundle conforme a este ADR. | `docs/05-clinical-safety/rule-releases/sofa/logic.yaml` linhas 21-27 | high |

### 2.2 Premissas

| # | Premissa | Por que é necessária | O que a invalida | Titular | Status no registro |
|---|---|---|---|---|---|
| A1 | V2 terá seu próprio armazenamento de objetos/artefatos de release (não reaproveitando ferramental da AMH), consistente com `PROMPT` §9.4 já listar "object storage for immutable source envelopes and release/evidence artifacts" na topologia candidata. | Necessária para o eixo 1 avaliar Opção A (arquivo assinado endereçado por conteúdo) como algo que não exige infraestrutura nova a partir do zero. | Uma ADR de plataforma de implantação (item 19) que rejeite armazenamento de objetos dedicado. | UNASSIGNED — VALIDATION REQUIRED | a arquivar em `assumptions-register.md` |
| A2 | Versionamento de terminologia/value-set (LOINC/SNOMED/UCUM) terá um mecanismo de snapshot estável referenciável por ID/hash, que o bundle apenas referencia, sem incorporar. | O campo §6.4 "versões de terminologia/value-set" só é bem definido se existir esse mecanismo externo. | Ausência de uma ADR de terminologia (futura ADR-0013) que force incorporação em vez de referência. | UNASSIGNED — VALIDATION REQUIRED | a arquivar |
| A3 | **Um segundo revisor clínico qualificado, distinto de rodaquino-OMNI, será alocado antes de qualquer bundle cujo autor seja rodaquino-OMNI poder alcançar o estado `approved`.** Hoje só existe um clínico nomeado (GDEC-0003) — sem esta premissa, o eixo 3 fica estruturalmente inatingível para exatamente o conteúdo mais provável de ser produzido no ciclo 1 (ex.: `sofa/logic.yaml`, cujo autor de conteúdo é o mesmo rodaquino-OMNI). | Sem ela, todo bundle de conteúdo clínico do ciclo 1 fica bloqueado em `independent-clinical-review` indefinidamente — não é um bug do fluxo, é a realidade de pessoal hoje. | A alocação de um segundo revisor, ou uma exceção formal e registrada (que hoje não existe). | UNASSIGNED — VALIDATION REQUIRED | **carga real hoje — ver §11.2** |
| A4 | Um mecanismo de custódia de chave de assinatura (HSM/KMS ou equivalente) existirá antes de qualquer bundle ser ativado fora de `dev`. | Necessária para o eixo 2 Opção A ser exercitável em produção. | Ausência da futura ADR-0022 (supply-chain) ou decisão explícita de adiar assinatura real além de `dev`. | UNASSIGNED — VALIDATION REQUIRED, candidato AUTH-SECURITY | a arquivar |
| A5 | A configuração local de site permanecerá um mecanismo limitado, auditado e restrito por esquema (não texto livre), tornando o eixo 7 (aperta-nunca-afrouxa) mecanicamente aplicável em vez de apenas documentado. | Sem isso, o eixo 7 Opção A (§4.7) não é implementável como controle estrutural. | Um desenho que permita sobrescrita de configuração fora do envelope declarado pelo bundle. | UNASSIGNED — VALIDATION REQUIRED | a arquivar |

### 2.3 Hipóteses a testar

| # | Hipótese | Como seria testada | Quem testa | Status atual |
|---|---|---|---|---|
| H1 | Bundles assinados endereçados por conteúdo, com contra-assinatura obrigatória de aprovador distinto do autor, eliminam os defeitos de opacidade de versão/integridade de ratificação encontrados no legado (SF-2, F2.4). | Teste negativo: tentar ativar um bundle cujo signatário de autoria e de aprovação sejam a mesma identidade; deve falhar fechado (fail closed). | implementador do carregador de regras + verificador independente | NÃO TESTADA |
| H2 | Um limite de configuração de site "aperta-nunca-afrouxa" (uma sobrescrita local só pode tornar um gatilho mais sensível, nunca menos, em relação ao valor publicado) previne o defeito SF-4 ("sem piso clínico") sem eliminar a customização legítima de site. | Teste baseado em propriedades: nenhuma mutação de configuração pode produzir um limiar efetivo menos sensível que o valor publicado do bundle. | a definir (engenheiro de runtime de regras) | NÃO TESTADA |
| H3 | Um kill switch por bundle, exercitável sem deploy de código, resolvendo avaliações afetadas para `not_evaluated`, satisfaz o invariante de QAS-0011 ("contagem de avaliações executadas contra uma versão de regra não verificada ou ambígua deve ser zero"). | Drill de kill switch multi-instância medindo tempo de propagação e o status resultante de cada avaliação em curso. | engenheiro de operações + verificador independente | NÃO TESTADA |

---

## 3. Drivers de decisão e atributos de qualidade mensuráveis

| # | Driver | Por que discrimina entre as opções | Atributo de qualidade mensurável | Alvo |
|---|---|---|---|---|
| D1 | **Zero regras ativas não assinadas.** | Discrimina diretamente entre um formato/esquema de assinatura que torna isso verificável no carregamento (eixo 1/2 Opção A) e qualquer opção que deixe a verificação opcional ou fora de banda. | QAS-0011 ("contagem de avaliações executadas contra uma versão não verificada deve ser zero" — invariante) | VALIDATION REQUIRED (Gate G1 para o alvo numérico de tempo; o "deve ser zero" já é invariante) |
| D2 | **100% dos bundles ativos com identidades de autor e aprovador distintas e não sobrepostas.** | É o driver central desta ADR (regra não negociável 10). Discrimina fortemente entre eixo 2 Opção A (contra-assinatura estrutural) e Opção B (atestação em banco, mais fraca) e entre eixo 3 Opção A (máquina de estados que reclassifica editor-que-aprova como novo autor) e Opção C/Z (sem essa reclassificação). | Nova métrica — proporção de bundles ativos cujo `author_key_id` ≠ `approver_key_id` estruturalmente (não apenas por convenção de nome de campo) | VALIDATION REQUIRED — invariante-alvo é 100% |
| D3 | **Tempo até rollback / tempo de atuação do kill switch.** | Discrimina o eixo 5: Opção A (primitivas dedicadas) tende a um tempo de atuação medido e limitado; Opção B (rollback via redeploy de infraestrutura geral) tem um piso mais alto e menos previsível. | QAS-0011 ("kill-switch actuation time") | VALIDATION REQUIRED (Gate G1) |
| D4 | **Determinismo de replay (100%).** | Discrimina o eixo 1: um formato endereçado por conteúdo com serialização canônica dá identidade forte ao par bundle+entradas; um esquema de linhas mutáveis em banco (eixo 1 Opção B) depende inteiramente de disciplina de aplicação para não quebrar esse invariante. | QAS-0020; DOM-0003 | VALIDATION REQUIRED (100% é o alvo declarado) |
| D5 | **Completude do pacote de evidência de release.** | Discrimina o eixo 1 e o eixo 6: um artefato único endereçado por conteúdo produz naturalmente a evidência que QAS-0026 exige "montada pelo pipeline"; um modelo de linhas em múltiplas tabelas exige montagem manual em tempo de release, o que QAS-0026 penaliza explicitamente. | QAS-0026 (precondição do Gate G8) | VALIDATION REQUIRED |
| D6 | **Custo de saída / reversibilidade da própria escolha de formato/mecanismo.** | Discrimina entre um formato com esquema versionável (eixo 1 Opção A, custo moderado de migração de envelope) e um acoplamento a uma ferramenta específica (ex.: eixo 1 Opção C git-tag, que acopla liberação clínica a infraestrutura de controle de versão de código-fonte). | Análogo de QAS-0027 | VALIDATION REQUIRED |
| D7 | **Segurança da fronteira de configuração** — contagem de sobrescritas locais que afrouxariam um gatilho publicado (deve ser zero, prevenido mecanicamente, não apenas por política). | Discrimina diretamente o eixo 7: Opção A (envelope declarado e verificado no mesmo carregador que verifica a assinatura) versus Opção Z (política documentada, sem imposição mecânica — o padrão legado que produziu SF-4). | Nova métrica — nenhuma cenário QAS ainda existe; candidato a criar em trabalho futuro de atributos de qualidade | VALIDATION REQUIRED |
| D8 | **Custo operacional/de engenharia para construir e operar o carregador e o pipeline.** | Discrimina eixo 1 Opção B (reaproveita o armazenamento operacional já necessário, menor custo inicial) de Opção A (exige infraestrutura de hash/assinatura/armazenamento de objetos nova). Nenhum modelo de custo existe; analista de FinOps não ativado. | *Nenhum cenário ainda* | VALIDATION REQUIRED |
| D9 | **Portabilidade / dependência de fornecedor do mecanismo de assinatura escolhido.** | Discrimina o eixo 2: uma serialização canônica aberta (JSON/YAML determinístico) mais assinatura desacoplada de ferramenta específica versus um formato ou registro proprietário. Referenciado à futura ADR-0022, não decidido aqui. | *Nenhum cenário ainda* | VALIDATION REQUIRED |

**Excluído por não discriminar:** "usa hash" ou "é auditado" isoladamente — o sistema
legado já tem mutações auditadas (E8) e isso não preveniu nenhum dos defeitos
documentados; auditoria por si só não é o driver, a **imutabilidade estruturalmente
verificável** é.

---

## 4. Alternativas consideradas

**Nota de estrutura (repetida do §1.3 para leitura autônoma desta seção):** cada um
dos sete eixos do prompt §10 item 7 recebe seu próprio conjunto de opções A/B/(C)/Z,
seguido de uma recomendação não vinculante em §4.9. A tabela de comparação consolidada
contra os drivers está em §4.8.

### 4.1 Eixo 1 — Formato do bundle

**Opção A — Arquivo único assinado, endereçado por conteúdo** (estilo artefato OCI /
tarball assinado com manifesto).

- **Descrição.** Uma serialização canônica (determinística) reúne todos os campos do
  §6.4 — lógica/predicados, `TerminologySnapshot` por referência, `TestPack`,
  `Approval` — em um artefato imutável, endereçado pelo hash de seu próprio conteúdo,
  armazenado em armazenamento de objetos e referenciado por esse hash em todo lugar
  (registros de avaliação, eventos de ativação, UI). Alinha-se diretamente ao modelo de
  domínio já estabelecido (E6) e ao precursor real já em disco (E17).
- **Contra os drivers.** D1: ajuste direto — uma unidade única verificável. D2: ajuste
  direto — o bloco de assinatura exige estruturalmente duas identidades distintas
  (detalhado no eixo 2). D3: bom — rollback é apontar o ponteiro de ativação para um
  hash anterior, rápido. D4: excelente — determinismo de replay ligado ao hash exato
  (D4/DOM-0003). D5: excelente — a evidência de release é o próprio artefato mais seu
  digest, satisfazendo QAS-0026 sem montagem manual. D6: moderado — o formato pode
  evoluir, mas um esquema inicial ruim tem custo de migração. D7: não resolve por si só
  a fronteira config-vs-conteúdo (precisa do eixo 7), mas mantém o conteúdo
  estruturalmente imutável, o que é a metade fácil do problema. D8: complexidade
  moderada (exige infraestrutura nova de hash/serialização canônica/armazenamento).
  D9: baixa dependência de fornecedor se a serialização for aberta (JSON/YAML
  determinístico) em vez de um formato de registro proprietário.
- **Consequências positivas.** Alinha-se ao modelo de domínio já ratificado como
  PROPOSAL (`RuleBundle → RuleVersion/.../Approval`); imita o padrão de publicação de
  contrato já demonstrado maduro pela AMH (`PROMPT` §7.5: "the most valuable thing AMH
  offers V2 — as a pattern to imitate, not an interface to reuse" — citado por analogia,
  não por dependência técnica de AMH); uma unidade verificável única simplifica
  auditoria (SAF-0019); `PROMPT` §9.4 já lista armazenamento de objetos para
  "release/evidence artifacts" na topologia candidata, então isto não é infraestrutura
  fora de plano.
- **Consequências negativas.** Exige construir armazenamento de objetos + hashing +
  ferramental de manifesto que ainda não existe; a determinicidade da serialização
  canônica é, ela mesma, um detalhe de design que pode falhar sutilmente (ordem de
  chaves, espaços em branco) e precisa de teste dedicado.
- **O que precisaria ser verdade.** Armazenamento de objetos existe (A1); um mecanismo
  de hash/assinatura canônico é escolhido e testado por determinismo.
- **Custo de saída se revertida.** Moderado — migrar para outro formato de envelope
  exigiria reassinar/republicar todo bundle histórico, a menos que o hash cubra o
  conteúdo lógico e não os bytes brutos do envelope (nuance de design sinalizada como
  questão em aberto, §11.3 Q1).

**Opção B — Registros versionados em banco de dados** (linhas append-only em uma
tabela `rule_bundle_version`, sem artefato binário separado).

- **Descrição.** `RuleVersion`, referência a `TerminologySnapshot`, referência a
  `TestPack` e campos de `Approval` vivem como linhas estruturadas; imutabilidade
  imposta por restrições de banco (sem `UPDATE`, apenas `INSERT` + coluna de status) em
  vez de endereçamento por conteúdo.
- **Contra os drivers.** D1: alcançável via restrições de banco, mas "assinado" é
  estranho para uma linha de banco — seria necessário assinar um hash computado da
  linha de qualquer forma, o que reintroduz o conceito de hash de conteúdo da Opção A
  com passos extras. D2: alcançável de forma simples via colunas `author_id`/
  `approver_id` com `CHECK author_id <> approver_id`. D3: rápido (atualizar uma flag
  ativa) e a ativação transacional é naturalmente forte aqui (transações nativas de
  banco) — vantagem real. D4: depende inteiramente de disciplina fora do banco (nada
  impede adicionar colunas mutáveis depois) — garantia estrutural mais fraca que
  endereçamento por conteúdo. D5: mais fraco — a evidência de release precisa ser
  montada consultando várias tabelas no momento do release, mais peças móveis
  (QAS-0026 penaliza "itens manuais/atestados que deveriam ser automatizados"). D6:
  menor novidade de engenharia (V2 já precisa de um banco) — mais barato de construir
  primeiro. D7: sem conexão natural com a fronteira config/conteúdo em nenhum sentido.
  D8: menor custo de engenharia — reaproveita o armazenamento operacional já
  necessário, sem pipeline novo de hashing/armazenamento de objetos. D9: depende
  inteiramente da tecnologia de banco escolhida (adiado a uma ADR de seleção de banco
  ainda não redigida).
- **Consequências positivas.** Mais barato de construir; ativação transacional nativa;
  superfície de auditoria mais simples (SQL).
- **Consequências negativas.** "Imutabilidade" é uma convenção de política imposta por
  código de aplicação e permissões, não uma propriedade estrutural do artefato — isso é
  precisamente o defeito legado reproduzido em outra camada, a menos que muito
  cuidadosamente restringido (`thresholds-seed-review.md` §1: "Rows are updated in
  place... history exists only as audit-trail JSON blobs"); um hash de conteúdo real
  ainda seria necessário para evidência de violação (tamper-evidence) genuína, então
  esta opção ou duplica o mecanismo da Opção A ou é mais fraca que ela.
- **O que precisaria ser verdade.** Um esquema suficientemente disciplinado
  (append-only, sem permissão de `UPDATE`) e uma coluna de hash/assinatura computada
  da mesma forma que a Opção A computaria.
- **Custo de saída se revertida.** Baixo para migrar para fora ("é só uma tabela"), mas
  o custo de saída da *garantia mais fraca em si* é um risco permanente, não um custo
  de migração único.

**Opção C — Tag de git como release** (o conteúdo da regra vive em arquivos
versionados em um repositório git; uma tag git assinada marca a versão aprovada).

- **Descrição.** Tratar o repositório de conteúdo de regras (ou um subdiretório do
  repositório principal) da forma como releases de software são versionados por tag;
  tags git assinadas por GPG marcam versões aprovadas.
- **Contra os drivers.** D1: alcançável (assinaturas de tag git existem), mas a
  "verificação no carregamento" passaria a depender de infraestrutura git/GPG
  alcançável a partir do runtime — uma dependência incomum para um kernel de avaliação
  clínica que `PROMPT` §9.4 quer isolado de dependências de entrega/UI. D2:
  alcançável via autoria de commit + assinante de tag sendo chaves distintas, mas
  autoria de commit git é trivialmente reatribuível (`git commit --author`) e não é
  trilha de auditoria forte o suficiente para o "identidade de aprovador registrada
  distinta do autor" de SAF-0020 sem ferramental extra de qualquer forma. D3: rollback
  = re-tag/checkout, desajeitado para um sistema em execução com múltiplas instâncias
  (SAF-0021 exige que todas as instâncias concordem instantaneamente — `git checkout`
  não é naturalmente atômico em uma frota). D4: moderado. D5: mau ajuste para o "montado
  pelo pipeline" de QAS-0026 — histórico git é adjacente a evidência, mas não é um
  artefato autocontido. D6: quase zero engenharia nova (o repositório já existe) —
  atraente para um começo rápido. D7/D8/D9: fracos/pouco claros.
- **Consequências positivas.** Ferramental mínimo novo; desenvolvedores já entendem
  git; trilha de auditoria gratuita (`git log`) para *autoria*, ainda que não para
  *aprovação*.
- **Consequências negativas.** Confunde histórico de controle de código-fonte (onde
  qualquer pessoa com permissão de commit pode reescrever/rebasear, e onde a história
  de auditoria é mais fraca que um registro de artefato assinado dedicado) com um
  sistema de aprovação de release clínico; não produz naturalmente a primitiva
  "verificar no carregamento" sem construir o equivalente da Opção A por cima de
  qualquer forma; o próprio sistema legado já tentou algo adjacente a isto
  (`alert_definition_version`/`algorithm_registry` existiam, mas o caminho ao vivo os
  ignorava — E12) — um registro que o runtime não consulta de fato é exatamente o
  padrão de falha a evitar, e um esquema de tag git corre alto risco do mesmo "registro
  existe, runtime ignora" se não for conectado diretamente ao carregador.
- **O que precisaria ser verdade.** Uma organização disposta a operar gestão de chave
  GPG para tags git (isso duplica o trabalho de custódia de chave que a Opção A
  precisaria de qualquer forma) e um carregador de runtime que de fato busque e
  verifique a partir do git em toda ativação (não apenas "alguém marcou uma tag").
- **Custo de saída se revertida.** Baixo.

**Opção Z — Adiar** (não padronizar o formato do bundle ainda).

- **Descrição.** Não padronizar o formato do bundle agora; deixar a prototipagem inicial
  do runtime de regras prosseguir de forma ad hoc (por exemplo, o padrão YAML já usado
  por `sofa/logic.yaml` ou por constantes de código), mantendo esta ADR em `proposed`,
  revisitando quando um engenheiro de runtime de regras e um portfólio concreto de vias
  (Gate G2) existirem para testar o formato contra formas reais de lógica clínica.
- **Consequências positivas.** Evita superprojetar um formato antes que o portfólio
  aprovado de vias do Gate G2 seja conhecido (o tamanho do portfólio pode
  legitimamente ser zero, `PROMPT` §6.3); evita restringir o motor de execução de
  regras (AST vs. DSL vs. tabela declarativa) antes de ele ser escolhido.
- **Consequências negativas.** SAF-0020/SAF-0021/SAF-0030 já existem como requisitos
  PROPOSAL sucessores que pressupõem que *algum* bundle imutável assinado exista;
  adiar o formato bloqueia os Gates G2 e G6 (`adr-index.md` §3); e, dado que o sistema
  legado teve exatamente esta ambiguidade (tabelas de registro existiam, não usadas),
  adiar arrisca cair na mesma armadilha "construir primeiro, governar depois" que
  produziu HAZ-0019/HAZ-0020.
- **Custo do atraso.** Sobe abruptamente assim que qualquer prototipagem de runtime de
  regras começar sem um formato — retroadaptar assinatura/hashing a um conteúdo já
  moldado ad hoc é exatamente o padrão de custo de migração sinalizado por QAS-0027.

### 4.2 Eixo 2 — Assinatura e integridade

**Opção A (quem assina, o que a assinatura cobre, custódia de chave) — Dupla
assinatura estrutural.** O autor assina o hash de conteúdo da serialização canônica
(atesta autoria/conteúdo); um aprovador independente contra-assina o **mesmo** hash de
conteúdo após revisão (atesta aprovação); o bundle carrega ambas as assinaturas e
identidades de signatário; a verificação no carregamento exige que ambas as
assinaturas validem contra o mesmo hash **e** que as duas identidades de signatário
sejam estruturalmente diferentes (`author_key_id != approver_key_id`, imposto pelo
carregador, não apenas por convenção) — codifica diretamente a regra não negociável 10
e o "identidade de aprovador registrada distinta do autor" de SAF-0020. Custódia de
chave é referenciada, não decidida aqui: futura ADR-0022.

- Positivo: verificação é uma função pura do artefato (não precisa de consulta externa
  para saber "isto foi aprovado" — embora um registro ainda seja necessário para
  revogação/kill-switch, eixo 5); espelha `Approval` como um registro assinado de
  primeira classe, não um efeito colateral de log de auditoria (diferente do legado —
  `before_state`/`after_state` em JSON de auditoria, E7).
- Negativo: exige uma capacidade real de gestão de chave (quem detém a chave do autor
  vs. a do aprovador) que ainda não existe — esta é a dependência aberta que mais pesa,
  explicitamente adiada à futura ADR-0022; se apenas um humano está alocado (realidade
  de hoje, GDEC-0003 — um único clínico), esta opção **ainda não é exercitável** sem
  (a) um segundo revisor qualificado, ou (b) uma exceção formal e registrada, que hoje
  não existe (ver A3, §11.2).
- Precondições: pelo menos duas identidades distintas qualificadas com chaves de
  assinatura distintas por escopo de bundle.
- Custo de saída: moderado — o esquema de assinatura (por exemplo, assinaturas
  destacadas sobre um hash canônico) pode ser trocado se o formato de chave mudar,
  desde que o padrão "hash-então-assina" seja preservado; o hash de conteúdo em si é
  identidade durável.

**Opção B — Autor assina; aprovação registrada como atestação separada verificada em
banco** (aprovação é uma linha/evento que referencia o hash do bundle, não uma
contra-assinatura criptográfica).

- Positivo: menor esforço de engenharia (não precisa de uma segunda chave de
  assinatura imediatamente — um evento de aprovação registrado, auditado, com
  identidade autenticada do aprovador, armazenado append-only, pode ser construído
  mais rápido que uma PKI de dupla assinatura completa).
- Negativo: evidência de violação mais fraca — o registro de aprovação e o artefato são
  duas coisas separadas que precisam ser mantidas consistentes por lógica de aplicação,
  não por vínculo criptográfico; isto reproduz (de forma mais branda) o padrão legado
  em que "a tabela `alert_definition_version` existe mas o caminho ao vivo nunca
  carimba uma" (E12) — um registro que não é estruturalmente determinante tende a
  divergir do que é de fato imposto.
- Precondições: um armazenamento de eventos de aprovação autenticado e auditado existe,
  e o carregador de fato o consulta em toda ativação (não apenas na hora da autoria).
- Custo de saída: baixo para construir, mas representa uma garantia mais fraca e
  duradoura a menos que depois seja atualizada para a Opção A — tratar como um caminho
  em estágios legítimo (padrão análogo à Opção D-3 de ADR-0001), não como resposta
  permanente ao eixo 2.

**Opção Z — Adiar o design de custódia de chave; expedir os campos de assinatura no
esquema do bundle (per §6.4) já agora, mas deixar a verificação em modo consultivo/
apenas-log até um titular AUTH-SECURITY nomeado desenhar a PKI real.**

- Positivo: desbloqueia o trabalho do eixo 1 (formato) sem esperar por ferramental de
  segurança.
- Negativo: **diretamente proibido pela regra não negociável 13** ("No production
  release may rely on advisory/non-blocking safety... gates") se isto chegasse a
  qualquer ambiente não-`dev`; aceitável APENAS como um placeholder estritamente
  restrito a `dev`, explicitamente limitado no tempo, nunca como a resposta do eixo 2
  para qualquer ambiente onde uma avaliação clínica seja acionável.
- Custo do atraso: baixo enquanto não-acionável (a restrição permanente equivalente a
  H5 de ADR-0001 se aplica aqui também — nenhum bundle pode ser ativado para avaliação
  acionável sem assinatura real), sobe abruptamente no Gate G6.

### 4.3 Eixo 3 — Estados do fluxo de aprovação

**Opção A — Máquina de estados explícita**: `draft` → `authored` (assinado pelo autor)
→ `independent-clinical-review` → `approved` (contra-assinado) → `activatable`;
rejeição retorna a `draft` **como uma nova versão** (nunca retrabalho no lugar, porque
o conteúdo anterior é imutável — lição direta de E7); **um aprovador que edita
materialmente o conteúdo é automaticamente rerrotulado como o (novo) autor da versão
resultante e perde o direito de aprovação para essa versão** — o resíduo de GDEC-0003
codificado estruturalmente. Como a identidade de conteúdo é o hash (eixo 1), "editar" e
"criar uma nova versão de propriedade de um novo autor" são, por construção, a mesma
operação — a forma mais limpa de impedir que um aprovador silenciosamente melhore o
conteúdo e depois aprove sua própria versão melhorada.

- Positivo: fecha exatamente a lacuna que GDEC-0003 sinalizou como resíduo ("um
  segundo revisor é necessário para conteúdo que o aprovador redigiu pessoalmente");
  a máquina de estados é auditável e casa com a linguagem de SAF-0019/SAF-0020.
- Negativo: com apenas um clínico qualificado alocado hoje, vários estados
  (`independent-clinical-review`, `approved`) **não são alcançáveis** para qualquer
  bundle cujo autor seja esse mesmo clínico — isto não é uma falha do fluxo, é um
  bloqueio honesto de pessoal que deve ser registrado (`decision-rights.md` §3 regra
  3: "a decisão não é tomada... é registrada em `blockers-register.md`"), não
  contornado.
- Precondições: pelo menos dois revisores qualificados OU um processo de exceção
  aceito para bundles de revisor único (não existe hoje; exigiria sua própria entrada
  DECIDED).
- Custo de saída: baixo — é um modelo de fluxo/estado, não um formato de
  armazenamento; pode ser refinado sem tocar o formato do bundle.

**Opção B — Fluxo leve de dois estados** (`draft` → `approved`), com "revisão
independente" imposta apenas por política/checklist no momento da aprovação, em vez de
um estado distinto rastreado.

- Positivo: mais simples de implementar primeiro; menos estados para construir
  ferramental.
- Negativo: colapsa "foi revisado independentemente" em "foi aprovado", perdendo a
  distinção de auditoria entre *a revisão aconteceu* e *a revisão foi suficiente* —
  trilha de evidência mais fraca para QAS-0026; mais exposto ao padrão SF-2 (um selo
  de ratificação que não reflete de forma confiável o que aconteceu) se a revisão não
  for seu próprio evento registrado.
- Precondições: log de auditoria externo forte para compensar os estados colapsados.
- Custo de saída: moderado — trabalho posterior para adicionar os estados faltantes
  significa preencher retroativamente evidência de revisão de bundles históricos, que
  pode não existir.

**Opção Z — Adiar**: sem máquina de estados formal; aprovação é um comentário de
sign-off em texto livre em um pull request ou ticket (o mais próximo do padrão legado
de CRUD apenas-`admin` + JSON de trilha de auditoria, E7/E8).

- Positivo: zero ferramental novo.
- Negativo: isto é, funcionalmente, o defeito legado restaurado — "mutações SÃO
  auditadas... mas nenhuma etapa de aprovador clínico, nenhuma revisão independente,
  nenhuma validação de ordenação" (E8) — conhecido por ter produzido valores
  UNCITED/discrepantes chegando a um padrão semeado (`thresholds-seed-review.md` §3.1)
  sem nenhum portão estrutural autor≠aprovador. Recomendado contra diretamente pela
  base de evidência desta própria ADR.
- Custo do atraso: esta opção não tem realmente um enquadramento de "atraso" — é mais
  próxima de "adotar o padrão conhecidamente defeituoso" — sinalizada por completude
  de honestidade do template, não porque seja atraente.

### 4.4 Eixo 4 — Ativação

**Opção A — Ativação explícita com escopo de ambiente**: ativar uma versão de bundle
em um ambiente (dev/stg/prod, e por escopo de tenant/unidade se ADR-0003 exigir) é uma
ação distinta, autorizada por humano, por ambiente — sem auto-ativação em merge/CI
verde; ativação de versão é monotônica por escopo por padrão (não pode reativar
silenciosamente uma versão mais antiga sobre uma mais nova) com um caminho de exceção
documentado e registrado (por exemplo, um rollback de emergência, que é coberto pelo
eixo 5, não uma exceção silenciosa); modo shadow/não-acionante é um estado de ativação
distinto, autorizado separadamente — um bundle pode ser "ativado em shadow"
(avaliado, registrado, nunca exposto como alerta acionante) como sua própria transição
autorizada, casando com a linguagem explícita do Gate G2 (`PROMPT:347-349`): "Shadow/
non-actioning evaluation may precede this approval only with privacy, security, and
research/governance authorization."

- Positivo: implementa diretamente a linguagem do Gate G2 do prompt; previne o
  mecanismo exato que HAZ-0019 descreve ("systematically wrong thresholds across an
  entire unit... reached by a build-system path rather than a rule-registry path").
- Negativo: ativação com escopo de ambiente adiciona superfície operacional (alguém
  precisa executar e registrar N ações de ativação através de N ambientes) — um custo
  real de vazão a ser pesado contra D5/QAS-0026.
- Precondições: autoridade humana de ativação nomeada por ambiente existe (liga-se ao
  "comitê humano qualificado" do Gate G2 e ao Gate G6).
- Custo de saída: baixo — um fluxo de autorização de ativação é aditivo ao, não
  emaranhado com, o formato do bundle.

**Opção B — Auto-ativação por CI/CD** (merge para um branch de release + testes
passando = ativo), comum em entrega de software geral.

- Positivo: rápido, padrão, baixo atrito; casa com como a maior parte do software
  não-clínico é entregue.
- Negativo: **viola diretamente o requisito explícito do Gate G2 do prompt** de que
  "No pathway enters actionable production mode until a qualified human committee
  approves..." — auto-ativação em merge colapsa o evento de aprovação e o evento de
  ativação em um único gatilho de CI, exatamente o que a regra não negociável 10 e o
  "unapproved content MUST fail to load" de SAF-0020 existem para impedir por padrão de
  pipeline. Rejeitada como resposta do eixo 4 para qualquer ambiente acionável; pode
  ser legítima para avaliação shadow apenas-`dev` sem acionabilidade clínica, que na
  prática é o estado shadow da Opção A alcançado por um caminho mais rápido — não é
  genuinamente uma opção diferente uma vez adicionado o escopo de
  ambiente/acionabilidade.
- Precondições: nenhuma (este é o próprio argumento contra ela — não exige nenhum
  portão humano, que é o problema).
- Custo de saída: baixo para construir, mas reverter um hábito de auto-ativação em
  toda uma cultura de entrega é um custo organizacional, não apenas técnico.

**Opção Z — Adiar** a modelagem de ambiente/ativação; tratar "implantado" e "ativo"
como o mesmo evento (o que está implantado é o que roda).

- Positivo: engenharia mínima.
- Negativo: não consegue expressar "o bundle existe e está assinado, mas não é a
  versão ativa para este escopo" — colapsa exatamente a distinção que SAF-0021 exige
  ("every runtime instance MUST agree on exactly one active version"); não suporta o
  modelo multi-ambiente e monotônico-com-exceções com o qual o futuro item 19
  (ADR de plataforma de implantação) precisará compor.
- Custo do atraso: sobe no momento em que mais de um ambiente existir (o Gate G3 já
  estabelece que stg/prod/dr não existem hoje, per ADR-0001 E7, então isto é "grátis"
  hoje mas não permanecerá assim).

### 4.5 Eixo 5 — Rollback

**Opção A — Rollback apenas para versão previamente aprovada + kill switch como
primitiva separada.** Rollback sempre aponta para uma versão anterior específica que
ela mesma passou pelo fluxo de aprovação completo (nunca "reverter para o que estava
lá antes", nunca uma edição de correção no lugar); o kill switch é uma primitiva
distinta — desativar sem substituição — usável quando até a versão anterior é
suspeita, colocando todas as avaliações afetadas em `not_evaluated` (nunca um
não-disparo silencioso, per `evaluation-status-semantics.md` §3.3 e SAF-0021). Ambas as
ações produzem sua própria trilha de evidência assinada/autenticada (quem, quando, por
quê, de-qual-versão, para-qual-versão-ou-nenhuma) e são exercitáveis sem deploy de
código (SAF-0021).

- Positivo: casa literalmente com SAF-0021; casa com a razão explícita `not_evaluated`
  `rule_unavailable` de `evaluation-status-semantics.md`; o design de duas primitivas
  (rollback vs. kill switch) reflete a realidade operacional de que às vezes você sabe
  o bom estado anterior (rollback) e às vezes não sabe (kill switch) — colapsar as duas
  em um único mecanismo força uma escolha que você pode não estar pronto para fazer
  durante um incidente.
- Negativo: exige que o carregador de runtime mantenha versões previamente aprovadas
  prontamente ativáveis (não coletadas como lixo) e exponha um caminho de kill switch
  com sua própria autorização/autenticação distinta da ativação normal — duas
  primitivas operacionais novas para construir, testar e treinar (a medida "drill de
  kill switch" de QAS-0011).
- Precondições: um histórico de versões já aprovadas (não apenas autoradas) existe;
  ativação transacional multi-instância (eixo 4) está em vigor para que
  rollback/kill de fato alcancem toda instância dentro de um limite declarado.
- Custo de saída: baixo — são primitivas de fluxo/runtime, não compromissos de nível de
  formato.

**Opção B — Rollback por reimplantação de um commit de código anterior** (rollback é
um rollback de implantação geral, não uma operação específica de bundle de regra; o
bundle de regra simplesmente é o que quer que o código/config reimplantado carregue).

- Positivo: nenhum ferramental de rollback específico de bundle é necessário —
  reaproveita o mecanismo geral de rollback de release.
- Negativo: confunde rollback de lógica clínica com rollback de infraestrutura — um
  rollback de código pode reverter mudanças não relacionadas e não-clínicas, ou pode
  não de fato mudar a versão de regra ativa se a referência ao bundle for armazenada
  separadamente (o que o eixo 1 Opção A/B tornaria verdadeiro por design) — cria
  ambiguidade sobre o que um "rollback" de fato reverteu, exatamente o perigo
  "diferentes instâncias de runtime mantêm diferentes versões ativas" que HAZ-0020
  descreve, caso as duas noções de rollback divirjam mesmo que brevemente.
- Precondições: a identidade do bundle de regra precisaria estar fortemente acoplada a
  uma versão de artefato implantável, minando o versionamento independente do eixo 1.
- Custo de saída: moderado — desacoplar depois exige construir as primitivas da Opção A
  de qualquer forma, depois de já ter vivido com a ambiguidade do acoplamento.

**Opção Z — Adiar um kill switch dedicado**; depender apenas de rollback (sem
primitiva "desativar sem substituição").

- Positivo: uma primitiva a menos para construir inicialmente.
- Negativo: contradiz diretamente o requisito explícito de SAF-0021 para "a kill
  switch per rule bundle"; não deixa resposta para o caso em que até a versão
  imediatamente anterior é suspeita (por exemplo, um defeito recém-descoberto na
  *própria fórmula de pontuação*, não apenas no último ajuste de limiar) — o cenário
  "systematically wrong thresholds across an entire unit" de HAZ-0019 não teria parada
  rápida e segura.
- Custo do atraso: alto e imediato assim que qualquer bundle for acionável — este é o
  eixo em que adiar é menos defensável entre os sete.

### 4.6 Eixo 6 — Retirada

**Opção A — Data/cadência de revisão de retirada obrigatória por bundle**, declarada
no momento da aprovação (parte da lista de campos do §6.4 — "retirement date/review
cadence"), com um link `superseded_by` obrigatório assim que uma versão posterior for
aprovada; um bundle além de sua data de cadência de revisão sem aprovação renovada
surge automaticamente como pendente-de-revisão (não continua silenciosamente sem
revisão) — espelha o padrão de invariante já existente em
`evaluation-status-semantics.md` §3.4 (distinção stale/expiry) aplicado ao próprio
ciclo de vida do bundle, não apenas às suas entradas de dados.

- Positivo: fecha diretamente o defeito SF-2 ("trilhas de ratificação não confiáveis")
  na origem — um bundle não pode sobreviver silenciamente ao seu próprio horizonte de
  revisão da forma como a string de versão do NEWS2-v3.0.0 silenciosamente parou de
  corresponder ao seu comportamento ratificado.
- Negativo: exige um processo operacional para de fato agir sobre sinais de
  pendente-de-revisão (uma flag pendente-de-revisão sem ninguém observando é o padrão
  SF-2 uma camada acima) — é uma dependência de pessoal/processo, não técnica, e deve
  ser registrada como risco se não alocada.
- Precondições: alguém é nomeado para receber notificações de pendente-de-revisão
  (liga-se à restrição de disponibilidade de aprovador do eixo 3).
- Custo de saída: baixo.

**Opção B — Sem data de retirada obrigatória**; bundles permanecem ativos
indefinidamente até serem manualmente substituídos.

- Positivo: sem função forçadora que interrompa um bundle ainda válido; evita trabalho
  desnecessário de reaprovar conteúdo genuinamente estável.
- Negativo: este é exatamente o padrão legado (E7 — linhas mutáveis atualizadas no
  lugar, sem expiração) que produziu valores cuja base evidencial (Subbe 2001, RCP
  NEWS2 2017) envelheceu sem nenhum mecanismo para provocar reverificação contra
  literatura de diretriz atualizada; "ainda ativo" silencioso passa a significar
  "ainda correto", o mesmo padrão de tranquilização-pelo-silêncio que DOM-0004 e
  SAF-0019 existem para proibir para *dados* clínicos — não há razão de princípio para
  o ciclo de vida do *bundle* ser isento da mesma disciplina.
- Precondições: nenhuma.
- Custo de saída: baixo para adicionar um campo de retirada depois, mas cada bundle já
  ativo naquele momento precisaria de uma data retroativa atribuída — uma migração, não
  um começo limpo.

**Opção Z — Adiar a política de retirada por inteiro** até que um portfólio de vias
real exista (Gate G2), já que "cadência de revisão" é um parâmetro de governança
clínica que este programa não deveria inventar (espelha a recusa explícita de
`evaluation-status-semantics.md` em inventar números de frescor).

- Positivo: evita inventar uma cadência arbitrária (por exemplo, "revisar anualmente")
  sem base clínica — consistente com a disciplina geral deste programa contra alvos
  numéricos inventados.
- Negativo: o *campo* (data de retirada/cadência de revisão) continua obrigatório per
  §6.4 independentemente do valor que o preenche — adiar a *política que define o
  número* é correto (VALIDATION REQUIRED, sem número inventado), mas adiar o
  *requisito estrutural de que o campo existe e é imposto no nível do esquema do
  bundle* deixaria um buraco em forma de `null` exatamente onde SF-2 mostra que o
  legado deixou um. **Esta ADR propõe: o campo e sua imposição são a Opção A já
  agora; os valores específicos de cadência são VALIDATION REQUIRED por bundle,
  decididos pelo titular clínico, nunca inventados aqui** — então este "adiar" se
  aplica só aos números, não ao mecanismo.
- Custo do atraso: nenhum para o mecanismo (construir agora); crescente para qualquer
  bundle ativado antes de sua cadência ser definida por um titular clínico.

### 4.7 Eixo 7 — Fronteira config-vs-conteúdo

**Opção A — Divisão bundle-imutável vs. site-configurável com restrição
aperta-nunca-afrouxa imposta mecanicamente.** O bundle assinado publica cada gatilho
como um valor mais um intervalo/direção configurável explícito (por exemplo:
"`watch_threshold`: publicado 3; sobrescrita de site permitida apenas na direção que
dispara MAIS facilmente — isto é, um ponto de gatilho numérico mais baixo para uma
anormalidade 'alta', nunca mais alto — até um piso declarado pelo bundle, nunca abaixo
dele"); qualquer mutação de configuração fora desse envelope declarado e assinado é
rejeitada pelo **mesmo** carregador que verifica a assinatura do bundle (não por uma
checagem de papel-`admin` separada e contornável, como no legado, E8); toda
sobrescrita de configuração permanece totalmente auditada (quem, quando, de qual valor
publicado, para qual valor de sobrescrita, e confirmação de que satisfaz a restrição
aperta-nunca-afrouxa) e é visivelmente distinta na UI/texto de explicação do valor
publicado do bundle (para que um clínico veja explicitamente "sobrescrita de site",
endereçando o risco de dessincronização silenciosa de SF-4/`alert_copy.py`).

- Positivo: responde diretamente a SF-4 ("alerting thresholds tied to published
  trigger levels are clinical content requiring the same change control as band
  tables... configurability, if kept, needs declared floors and clinical sign-off per
  change") com um mecanismo estrutural, não apenas de política; resolve o defeito
  legado específico em que `watch=10, urgent=2, critical=1` (uma configuração
  invertida, clinicamente absurda) era permitida pelo esquema (E8) — um envelope
  aperta-nunca-afrouxa, limitado pelo bundle, torna uma configuração invertida ou mais
  frouxa mecanicamente irrepresentável, não apenas indesejável.
- Negativo: "apertar" não é sempre um conceito unidimensional (por exemplo: baixar um
  período de *cooldown* é um aperto, já que dispara mais vezes, mas aumentar um
  *rate limit* é um afrouxamento mesmo sendo um campo diferente do limiar clínico em
  si?) — o esquema do bundle precisa declarar, por campo configurável, qual *direção*
  conta como apertar; este é um trabalho de design clínico-de-engenharia não trivial
  que esta ADR sinaliza mas não resolve (VALIDATION REQUIRED, titular clínico +
  engenheiro de runtime de regras).
- Precondições: o esquema do bundle (eixo 1) tem espaço para um
  intervalo-e-direção-configurável declarado por campo, não apenas um valor estático;
  o carregador (eixo 2/4) é o ponto único de imposição (ecoando a lição de E11 — "um
  modelo de escopo, três implementações, duas divergentes" — deve haver exatamente um
  lugar onde isto é checado).
- Custo de saída: baixo para construir corretamente desde o início; alto para
  retroadaptar se uma superfície de configuração permissiva embarcar primeiro (o
  padrão legado é exatamente esse caso de retroadaptação-nunca-aconteceu).

**Opção B — Sem configurabilidade de site alguma**; todo limiar/gatilho é fixo pelo
bundle, e qualquer necessidade específica de site vira uma nova versão de bundle
através do fluxo de aprovação completo.

- Positivo: elimina a fronteira config-vs-conteúdo inteira eliminando um dos lados
  dela; modelo mental mais simples possível; nada pode nunca afrouxar porque nada pode
  nunca mudar fora do fluxo de aprovação.
- Negativo: torna o ajuste de site rotineiro e clinicamente legítimo (por exemplo, uma
  unidade com mix de gravidade diferente querendo um padrão mais sensível) tão caro
  quanto um release clínico completo, o que pode ser desproporcional e criar pressão
  para contornar o fluxo informalmente (planilhas paralelas, sobrescritas verbais) — um
  modo de falha diferente do legado, mas não obviamente mais seguro na prática; perde
  inteiramente o principal benefício da mitigação de "piso declarado" (ajuste
  legítimo de site dentro de um envelope seguro).
- Precondições: nenhuma técnica; exige que a organização clínica/operacional aceite que
  todo ajuste passa por ciclos completos de release.
- Custo de saída: moderado — adicionar configurabilidade depois exige retroadaptar o
  design de envelope declarado da Opção A de qualquer forma.

**Opção Z — Adiar** o mecanismo aperta-nunca-afrouxa; manter a configurabilidade mas
apenas como política documentada (mudança exige sign-off clínico, não imposição de
esquema) — o mais próximo do padrão legado hoje, auditado mas sem limite, menos a
lacuna "sem piso clínico" sendo explicitamente nomeada como risco conhecido.

- Positivo: mais rápido de entregar; casa com o que SF-4 já tem parcialmente (mutações
  auditadas).
- Negativo: SF-4 é literalmente a evidência que esta ADR foi instruída a tratar como o
  defeito a prevenir; adiar a imposição mecânica reproduz o defeito com melhor
  papelada, o que não é o mesmo que corrigi-lo — recomendado contra.
- Custo do atraso: o registro legado mostra que isto não é hipotético — já aconteceu
  (config-shadowing, sem piso, dessincronização silenciosa do texto clínico).

### 4.8 Comparação consolidada contra os drivers

Apenas qualitativo; cada célula compara a **combinação recomendada** (Opção A em todos
os sete eixos, §4.9) contra dois pontos de referência honestos: o **padrão
equivalente-ao-legado** (a combinação de opções mais próxima do que o sistema V1
de fato fazia — Opção B/Z-leve na maioria dos eixos) e o **adiamento total** (Opção Z
em todos os sete eixos).

| Driver | Combinação recomendada (A em todos os eixos) | Padrão equivalente-ao-legado | Adiamento total (Z em todos) |
|---|---|---|---|
| D1 zero não assinado | Estruturalmente zero (carregador impõe) | Não imposto — legado permitia mutação sem assinatura (E7, E8) | Indefinido — nada existe ainda |
| D2 100% autor≠aprovador | Estruturalmente imposto (eixo 2+3) | Não imposto — CRUD `admin`-apenas (E8) | Indefinido |
| D3 tempo de rollback | Primitivas dedicadas, medíveis (eixo 5) | Reconstrução forense de auditoria apenas (E7) | Indefinido |
| D4 determinismo de replay | Alto — hash de conteúdo + `RuleVersion` fixo (eixo 1) | Fraco — mudança efetiva imediata, invisível (E7) | Indefinido |
| D5 evidência de release completa | Alto — artefato único + digest (eixo 1) | Fraco — reconstrução forense apenas | Indefinido |
| D6 custo de saída | Moderado, avaliado por eixo | N/A — sem estrutura para reverter | Baixo agora, alto depois do primeiro protótipo (QAS-0027) |
| D7 fronteira config segura | Mecanicamente imposta (eixo 7) | **Não imposta — SF-4, o defeito nomeado nesta tarefa** | Indefinido |
| D8 custo operacional | Moderado-alto (infraestrutura nova) | Baixo (nada novo) | Mínimo agora |
| D9 portabilidade | Alta se serialização aberta (adiado a ADR-0022) | N/A | Indefinido |

### 4.9 Recomendação consolidada por eixo (PROPOSAL — não é decisão)

**Esta subseção é uma recomendação deste especialista, rotulada PROPOSAL. Não é
autoexecutável, não vincula nenhum bundle real, e não substitui o §5, que permanece
"NENHUMA DECISÃO É REGISTRADA".**

1. **Formato do bundle:** Opção A (arquivo único assinado, endereçado por conteúdo) —
   alinha com o modelo de domínio já estabelecido e com o precursor real já em disco
   (E17); Opção B pode coexistir como implementação de armazenamento *desde que* as
   linhas carreguem o mesmo hash e assinatura da Opção A — não é uma alternativa
   independente suficiente por si só.
2. **Assinatura e integridade:** Opção A (dupla assinatura estrutural) como alvo;
   Opção B (atestação em banco) como caminho em estágios legítimo enquanto A3 não é
   satisfeita, com gatilho de revisão explícito para migrar a A quando um segundo
   revisor for alocado.
3. **Fluxo de aprovação:** Opção A (máquina de estados com reclassificação
   editor→autor) — é a única opção que codifica o resíduo de GDEC-0003
   estruturalmente em vez de por convenção.
4. **Ativação:** Opção A (escopo de ambiente, autorização humana explícita, modo
   shadow como estado distinto) — implementa a linguagem do Gate G2 literalmente.
5. **Rollback:** Opção A (rollback-para-versão-aprovada + kill switch como primitiva
   separada) — única opção que satisfaz SAF-0021 por completo.
6. **Retirada:** Opção A (campo e imposição obrigatórios agora; valores de cadência
   VALIDATION REQUIRED por titular clínico, nunca inventados).
7. **Fronteira config-vs-conteúdo:** Opção A (envelope aperta-nunca-afrouxa, imposto
   pelo mesmo carregador que verifica a assinatura) — responde diretamente a SF-4.

---

## 5. Decisão e escopo

> **NENHUMA DECISÃO É REGISTRADA.**
>
> Esta ADR apresenta opções, drivers, evidência e uma recomendação não vinculante por
> eixo. Nenhuma opção é escolhida, preferida de forma vinculante, ou provisoriamente
> adotada como bundle real. Preencher esta seção é reservado à autoridade decisora
> nomeada no cabeçalho: `AUTH-CLINSAFETY` + `AUTH-SECURITY` (conjunta, por tópico —
> `adr-index.md` §3), hoje `AUTH-CLINSAFETY` candidato (rodaquino-OMNI, GDEC-0003,
> escopo ciclo-1) e `AUTH-SECURITY` `UNASSIGNED — VALIDATION REQUIRED`.

### 5.1 Condições que devem ser satisfeitas antes que esta ADR possa ser aceita

| # | Condição | Titular | Evidência que a fecharia | Status |
|---|---|---|---|---|
| C1 | Um segundo revisor clínico qualificado, distinto de rodaquino-OMNI, está alocado — ou uma exceção formal e registrada para bundles de revisor único existe. | Gate G0 / titular do programa | Entrada em `blockers-register.md` fechada, ou entrada GDEC nomeando o segundo revisor. | **OPEN — carga real hoje, ver §11.2** |
| C2 | Um titular AUTH-SECURITY nomeado existe para as cláusulas de assinatura/custódia de chave. | Gate G0 | `authority-model.md` linha AUTH-SECURITY preenchida com humano. | **OPEN** |
| C3 | A taxonomia de direção "aperta-nunca-afrouxa" por campo configurável (eixo 7) é ratificada pelo titular clínico. | AUTH-CLINSAFETY | Tabela publicada campo→direção, com justificativa. | **OPEN** |
| C4 | O portfólio de vias aprovado (Gate G2) existe, para que o formato do bundle seja pressionado contra formas reais de lógica clínica antes de aceitação. | AUTH-PRODUCT + AUTH-CLINSAFETY | Registro do Gate G2. | **OPEN** |
| C5 | Um mecanismo de custódia de chave (futura ADR-0022) existe ou uma decisão explícita de escopo `dev`-apenas para o eixo 2 é registrada. | AUTH-SECURITY | ADR-0022 aceita, ou entrada GDEC de escopo restrito. | **OPEN** |
| C6 | Um mecanismo de snapshot de terminologia/value-set (futura ADR-0013) existe para que o campo "versões de terminologia" do bundle seja referenciável, não incorporado ad hoc. | AUTH-DATA-PLATFORM + AUTH-CLINSAFETY | ADR-0013 aceita. | **OPEN** |
| C7 | Armazenamento de objetos para artefatos de release/evidência existe no ambiente de execução alvo (eixo 1 Opção A). | AUTH-OPERATIONS | Ambiente provisionado e alcançável. | **OPEN — apenas `dev` existe hoje (herdado de ADR-0001 E7 sobre a AMH; V2's próprio inventário de ambiente ainda não confirmado nesta ADR)** |

---

## 6. Consequências

Como nenhuma opção é escolhida, estas são as consequências **da existência desta ADR
em estado `proposed`**, não de uma decisão.

### 6.1 Positivas

- A pergunta de ciclo de vida do bundle está agora explícita, decomposta em sete eixos
  rastreáveis, com a evidência que limita cada opção anexada.
- Os requisitos SAF-0019/SAF-0020/SAF-0021, antes abstratos, agora têm um mecanismo
  concreto candidato por eixo contra o qual podem ser verificados quando ratificados.
- O resíduo de GDEC-0003 ("segundo revisor para conteúdo pessoalmente redigido pelo
  aprovador") está agora codificado como uma condição estrutural do fluxo de aprovação
  (eixo 3), não apenas uma nota de política — tornando-o testável.
- O precursor real já em disco (`sofa/logic.yaml`) tem agora um caminho de promoção
  nomeado (0.x precursor → fluxo do eixo 3 → 1.0 assinado) em vez de permanecer um
  artefato sem destino declarado.

### 6.2 Negativas

- Nenhum bundle pode avançar além de `draft`/`authored` para conteúdo cujo único autor
  clínico qualificado é também o único aprovador candidato — isto bloqueia todo
  conteúdo clínico de ciclo 1 até A3/C1 serem satisfeitas. **Este é o risco mais
  imediato e deve ser registrado no risk-register (ver §11.2).**
- Trabalho de design dependente (o próprio motor de execução de regras, o carregador,
  o pipeline de assinatura) precisa esperar por ratificação desta ADR ou aceitar o
  risco de retroadaptação de QAS-0027 se prosseguir antes.
- A adaptação estrutural do template (sete eixos em vez de uma única pergunta) impõe
  carga de leitura maior neste documento do que uma ADR de eixo único — mitigado pela
  nota de transparência em §1.3 e pela tabela consolidada em §4.8/§4.9.

### 6.3 Neutras / estruturais

- Nada nesta ADR autoriza a ativação de nenhum bundle real; `sofa/logic.yaml`
  permanece `NOT_ACTIONABLE_AUTHORSHIP_ARTIFACT` independentemente do estado desta ADR.
- A recomendação do §4.9 não é citável como precedente de aceitação para nenhuma
  decisão de segurança ou clínica futura até que esta ADR seja formalmente aceita pela
  autoridade nomeada.

---

## 7. Implicações transversais

| Dimensão | Implicação | Rótulo | Titular | ID de acompanhamento |
|---|---|---|---|---|
| Segurança clínica | O ciclo de vida do bundle determina se HAZ-0019 (ativação insegura de regra), HAZ-0020 (falha de rollback/deriva de versão), HAZ-0021 (opacidade de não-disparo) e HAZ-0022 (opacidade de supressão) podem ocorrer estruturalmente. O eixo 5 (rollback/kill switch) deve resolver para `not_evaluated`, nunca para não-disparo silencioso (evaluation-status-semantics.md §3.3, referenciado por ID). HAZ-0036 (expansão silenciosa de uso pretendido) é adjacente: um bundle ativado fora de escopo populacional é a mesma classe de falha que a ativação sem aprovação. | INFERENCE de E1-E14, DOM-0004 | AUTH-CLINSAFETY | HAZ-0005, HAZ-0019, HAZ-0020, HAZ-0021, HAZ-0022, HAZ-0031, HAZ-0036; SAF-0019, SAF-0020, SAF-0021, SAF-0030, SAF-0035 |
| Segurança (security) | O eixo 2 (assinatura/custódia de chave) é um problema de supply-chain de software: `hazard-log.md` já vincula HAZ-0019 aos itens de ameaça de supply-chain THR-0050/0051/0052/0054/0055/0056 (bundle não aprovado/não assinado ativado por um caminho de sistema de build em vez de um caminho de registro de regra). A custódia de chave concreta é adiada à futura ADR-0022; esta ADR apenas define o que deve ser assinado e por quem. | SOURCE (hazard-log.md linha HAZ-0019) | AUTH-SECURITY | ADR-0022 |
| Privacidade (LGPD, minimização, propósito) | O bundle em si é lógica/configuração, não dado de paciente — mas o campo "vetores de referência, propriedades, casos de fronteira e corpus de replay" (§6.4) pode conter dados sintéticos formatados como clínicos. A regra não negociável 12 exige dado sintético ou formalmente de-identificado em desenvolvimento/teste; nenhum PHI em nenhum artefato de bundle, fixture ou log. | SOURCE `PROMPT:129` (regra não negociável 12) | AUTH-PRIVACY-LEGAL | pendente |
| Interoperabilidade | O campo "versões de terminologia/value-set" do bundle deve referenciar, não incorporar, um snapshot estável — mecânica concreta adiada à futura ADR-0013. | INFERENCE (E1, A2) | AUTH-DATA-PLATFORM | ADR-0013 |
| Acessibilidade | O campo "texto de explicação e critérios de aceitação de UX" do §6.4 deve satisfazer a exigência de `PROMPT` §11 de pistas não somente por cor e anúncio acessível — indireto a este ADR, mas um campo obrigatório do formato que o eixo 1 deve reservar. | INFERENCE | AUTH-UX | pendente |
| Operacional | Ativação/rollback/kill-switch (eixos 4-5) exigem runbooks e drills medidos (a medida "tempo de atuação do kill switch" de QAS-0011); pendente-de-revisão de retirada (eixo 6) exige um destinatário nomeado de notificação. | INFERENCE de QAS-0011 | AUTH-OPERATIONS | pendente |
| Custo | Infraestrutura de armazenamento de objetos + assinatura + carga de trabalho de revisão humana têm custo real; nenhum modelo de custo existe; analista de FinOps não ativado (padrão análogo a ADR-0001 D9). | VALIDATION REQUIRED | AUTH-PRODUCT | pendente |
| Migração | O conteúdo de regra legado (`docs/rules/alert-threshold/`, 116 registros, zero veredito RETAIN/REFINE per `alert-threshold-cluster-review.md` §3) NÃO é importado como está; qualquer conteúdo transformado que reentre como bundle V2 deve passar pelo ciclo de vida completo desta ADR a partir de `draft` — conteúdo legado é referência de design apenas, nunca um bundle pré-aprovado inicial. | SOURCE (`alert-threshold-cluster-review.md` §3; `legacy-import-policy.md`) | AUTH-CLINSAFETY | pendente |

---

## 8. Reversibilidade, gatilhos de revisita, kill/rollback

### 8.1 Avaliação de reversibilidade (do próprio mecanismo de ciclo de vida proposto)

| Eixo/Opção recomendada | Reversibilidade | O que fica preso na reversão | Rótulo |
|---|---|---|---|
| Eixo 1 — Opção A (arquivo assinado) | **Moderada** — formato de envelope versionável, mas migração exige reassinar/republicar bundles históricos a menos que o hash cubra conteúdo lógico, não bytes de envelope | Artefatos e seus digests já publicados | INFERENCE |
| Eixo 2 — Opção A (dupla assinatura) | **Alta** — esquema de assinatura pode ser trocado se o padrão hash-então-assina for preservado | Chaves específicas emitidas, não o mecanismo em si | INFERENCE |
| Eixo 3 — Opção A (máquina de estados) | **Alta** — modelo de fluxo, não formato de armazenamento | Histórico de transições de estado já registrado | INFERENCE |
| Eixo 4 — Opção A (ativação com escopo) | **Alta** — aditiva ao formato do bundle | Registros de eventos de ativação | INFERENCE |
| Eixo 5 — Opção A (rollback + kill switch dedicados) | **Alta** — primitivas de runtime | Nenhum, se bem versionado desde o início | INFERENCE |
| Eixo 6 — Opção A (retirada obrigatória) | **Alta** — campo de esquema | Datas retroativas precisariam ser atribuídas a bundles já ativos se adotado tarde | INFERENCE |
| Eixo 7 — Opção A (envelope aperta-nunca-afrouxa) | **Moderada** — retroadaptar depois de uma superfície permissiva já ter embarcado é caro (é exatamente o padrão legado) | Configurações de site já fora de qualquer envelope declarado | INFERENCE |

SOURCE (`PROMPT` §9.1 princípio 11): "Prefer reversible decisions and record
extraction/revisit triggers." Registrar esta avaliação não é uma recomendação
disfarçada de decisão — reversibilidade é um driver entre nove (D6), e D1/D2/D7 podem
legitimamente pesar mais.

### 8.2 Gatilhos de revisita

| # | Gatilho | Como é detectado | Quem é notificado | Ação no gatilho |
|---|---|---|---|---|
| T1 | Um segundo revisor clínico qualificado é alocado. | Registro de governança / `authority-model.md` atualizado | AUTH-CLINSAFETY, orquestrador | A3/C1 fecham; eixo 3 Opção A torna-se alcançável para conteúdo de rodaquino-OMNI |
| T2 | Um titular AUTH-SECURITY é nomeado. | `authority-model.md` atualizado | AUTH-SECURITY | C2 fecha; eixo 2 pode avançar de Opção B (atestação em banco) para Opção A (dupla assinatura real) |
| T3 | A futura ADR-0022 (supply-chain/assinatura) é aceita. | Registro de ADR | AUTH-SECURITY | C5 fecha; mecânica concreta de custódia de chave do eixo 2 é resolvida |
| T4 | O Gate G2 aprova um portfólio de vias. | Registro do Gate G2 | AUTH-PRODUCT, AUTH-CLINSAFETY | C4 fecha; o formato do bundle é pressionado contra formas reais de lógica; eixo 6 recebe valores de cadência não inventados |
| T5 | Um segundo precursor real (além de `sofa/logic.yaml`) é redigido com forma de lógica distinta (por exemplo, uma via com predicados compostos ou janelas temporais). | Revisão de novo arquivo em `rule-releases/` | engenheiro de runtime de regras | Testar se o formato do eixo 1 acomoda a nova forma sem mudança de esquema disruptiva |
| T6 | Uma tentativa real de ativação de bundle expõe que a taxonomia aperta-nunca-afrouxa (eixo 7, C3) está subespecificada para um campo real. | Revisão de implementação / teste de propriedade falhando | AUTH-CLINSAFETY | C3 reaberta; taxonomia revisada |

### 8.3 Estratégia de kill switch / rollback (desta ADR, no nível meta)

Enquanto `proposed`, não há nada real para desligar — nenhum bundle foi ativado por
força desta ADR. A restrição vigente, análoga ao padrão H5 de ADR-0001, é:

1. Nenhum bundle pode ser ativado para avaliação clínica acionável sem que os eixos 2
   (assinatura real, não modo consultivo) e 3 (fluxo com autor≠aprovador
   estruturalmente distinto) estejam ambos implementados e alcançáveis. `sofa/logic.yaml`
   permanece `NOT_ACTIONABLE_AUTHORSHIP_ARTIFACT` até então.
2. Nenhum outro trabalho de design (motor de execução, carregador, pipeline) pode
   assumir silenciosamente qualquer opção específica desta ADR como decidida — cada
   consumidor deve declarar sua própria condicionalidade em relação ao eixo relevante,
   igual ao padrão exigido por ADR-0001 §8.3 item 2 para a fronteira AMH.
3. Ao ser aceita, a opção aceita por eixo deve definir seu próprio kill switch: o que
   é desabilitado, por quem, em que prazo, qual é o fallback clínico, e como o sistema
   reconcilia depois — isto é precisamente o conteúdo do eixo 5 desta própria ADR, e
   permanece PROPOSAL até aceitação.

---

## 9. Método de validação e evidência vinculada

| # | Reivindicação desta ADR | Método de validação | Ambiente necessário | IDs vinculados |
|---|---|---|---|---|
| V1 | Um bundle não assinado/não verificável nunca ativa. | Teste negativo de verificação de assinatura no carregador. | Ambiente de teste | HAZ-0019; SAF-0020; TST: pendente de arquitetura de testes |
| V2 | Um bundle cujo `author_key_id == approver_key_id` nunca alcança `approved`. | Teste de fluxo negativo na máquina de estados do eixo 3. | Ambiente de teste | SAF-0020; `decision-rights.md` §3 par 1; TST: pendente |
| V3 | Rollback/kill switch alcançam todas as instâncias dentro de um limite declarado; o estado resultante é `not_evaluated`, nunca não-disparo silencioso. | Drill multi-instância. | Ambiente com múltiplas instâncias em execução (não existe hoje fora de `dev`) | SAF-0021; HAZ-0020; QAS-0011; `evaluation-status-semantics.md` §3.3 |
| V4 | Determinismo de replay de 100% (mesmo bundle + mesmas entradas → mesmo registro). | Teste de replay reproduzindo um `EvaluationRecord` histórico byte-a-byte/campo-a-campo. | Ambiente de teste | DOM-0003; SAF-0019; QAS-0020; `TST-DOM-0003` |
| V5 | Nenhuma mutação de configuração de site produz um gatilho efetivo mais frouxo que o valor publicado do bundle. | Teste baseado em propriedades sobre o envelope aperta-nunca-afrouxa do eixo 7. | Ambiente de teste | reivindicação própria desta ADR (§4.7); adjacente a SAF-0035; TST: pendente |
| V6 | O pacote de evidência de release é completo e montado pelo pipeline, não manualmente. | Medida de QAS-0026 — proporção de releases com pacote completo. | Pipeline de CI/release | QAS-0026; Gate G8 |
| V7 | O campo de retirada/cadência de revisão está presente e imposto no nível de esquema para todo bundle ativo. | Portão de esquema (schema gate) no carregador/CI. | Ambiente de teste + CI | evidência SF-2 (remediação); TST: pendente |

**Disciplina de placeholder.** `docs/05-clinical-safety/hazard-log.md` e
`safety-requirements.md` já existem e são citados por ID real acima. Nenhum catálogo
de requisitos (`REQ`) ou de testes (`TST`) formal existe ainda, então essas referências
permanecem placeholders textuais, nunca IDs inventados — igual à disciplina de
ADR-0001 §9.

---

## 10. Relações de supersessão

- **Supersede:** nenhuma.
- **Superseded by:** nenhuma.
- **Notas de relação:** esta ADR, uma vez aceita, determinaria retroativamente o
  destino dos componentes de configuração de limiar legados
  (`threshold_config`/`threshold_resolver`/`reference_ranges`) cujos vereditos já
  foram propostos como REFINE/TRANSFORM/REJECT pela Tarefa 1 — mas essa determinação é
  uma consequência da aceitação, não uma relação de supersessão de ADR-para-ADR, e os
  campos `supersedes`/`superseded_by` permanecem `null` porque não há ADR anterior
  sobre este tópico. Relação de alimentação (`feeds`) declarada no cabeçalho:
  ADR-0008 (semântica de status de avaliação consome a política de completude/frescor
  do bundle definida aqui), ADR-0009 (máquina de estados de alerta/work item consome a
  versão/kill-switch do bundle), ADR-0013 (terminologia — o eixo 1 apenas referencia,
  não decide, versionamento de terminologia), ADR-0022 (supply-chain/assinatura —
  mecânica concreta de custódia de chave do eixo 2).

---

## 11. Autoverificação contra o portão de completude do template

### 11.1 Checklist

- [x] ID estável corresponde ao nome do arquivo (verificação pendente contra
      `adr-index.md`, que este agente está proibido de editar per escopo de tarefa)
- [x] Status é um dos valores permitidos (`proposed`)
- [x] Titular, aprovadores, prazo de decisão presentes (placeholders permitidos;
      nomes inventados não)
- [x] Autor não está listado como aprovador; pares de independência verificados
      (§ cabeçalho `independence_check`, nota de aplicação a rodaquino-OMNI)
- [x] Contexto declara uma pergunta de decisão com fronteira de escopo explícita (§1.3,
      §1.4)
- [x] Toda declaração material carrega um rótulo de evidência
- [x] Tabela de evidência distingue reverificado (`OBSERVED`) de citado (`SOURCE`) —
      **nota: nenhum item é `OBSERVED` nesta ADR; este agente não reverificou nenhum
      código-fonte, apenas citou verificações de outros especialistas — todos os 17
      itens são honestamente `SOURCE`**
- [x] Premissas têm cada uma uma condição de invalidação e um titular
- [x] ≥2 alternativas viáveis mais adiar/não-fazer-nada — **por eixo, sete vezes**
- [x] Toda alternativa tem consequências positivas e negativas
- [x] Drivers são discriminantes e mapeiam para atributos de qualidade mensuráveis
- [x] Nenhum alvo numérico inventado; alvos não validados leem `VALIDATION REQUIRED`
- [x] Todas as oito linhas de implicação transversal presentes
- [x] Reversibilidade, gatilhos de revisita e kill/rollback presentes
- [x] Método de validação com IDs REQ/HAZ/TST vinculados (ou honestamente placeheld)
- [x] Campos de supersessão presentes
- [x] Nenhuma tecnologia escolhida por herança do legado ou da AMH (`PROMPT` §3 regra
      14) — nenhuma ferramenta de assinatura, banco ou serialização específica é
      escolhida; apenas o mecanismo estrutural é
- [x] `adr-index.md` **não** foi tocado, per escopo de tarefa (`write_scope`) —
      atualização daquele arquivo é responsabilidade de outro especialista/turno

### 11.2 Risco residual mais importante desta ADR, dito com honestidade

**A opção recomendada para os eixos 2 e 3 (dupla assinatura estrutural, máquina de
estados com reclassificação editor→autor) não é hoje exercitável para nenhum conteúdo
clínico cujo autor seja rodaquino-OMNI**, porque ele é, hoje, o único
AUTH-CLINSAFETY candidato nomeado (GDEC-0003). Isto não é um defeito do desenho — é o
próprio desenho funcionando como pretendido: recusar-se a permitir que a mesma pessoa
seja autor e aprovador, mesmo quando essa pessoa é a única disponível. A consequência
prática é que **todo conteúdo clínico do ciclo 1 cujo autor de conteúdo (não apenas
"collector" de evidência) seja rodaquino-OMNI fica estruturalmente preso em
`independent-clinical-review` até um segundo revisor ser alocado**. Isto deve ser
registrado como item de `risk-register.md` (referenciado em `links.drivers.risks`
acima) e como bloqueio potencial em `blockers-register.md` quando o primeiro bundle
real de conteúdo (não precursor) tentar avançar além de `authored`.

### 11.3 Questões em aberto numeradas para o revisor nomeado (rodaquino-OMNI, AUTH-CLINSAFETY candidato) e para AUTH-SECURITY quando nomeado

1. **[AUTH-CLINSAFETY]** A recomendação do eixo 3 (§4.3 Opção A) implica que nenhum
   bundle cujo conteúdo clínico você mesmo redigir pode ser aprovado por você. Isso é
   aceitável como princípio permanente, ou deveria existir um processo de exceção
   formal e registrado para o período de pessoal único do ciclo 1 (por exemplo, uma
   revisão externa ad hoc, registrada como tal)? Uma resposta aqui fecha a premissa A3.
2. **[AUTH-CLINSAFETY]** A taxonomia "aperta-nunca-afrouxa" do eixo 7 (§4.7) precisa,
   por campo configurável, de uma decisão sobre qual direção conta como "mais
   sensível" — isto vale para todo campo (cooldown, rate limit, cada limiar de banda)
   ou apenas para os limiares de banda em si? Uma resposta fecha C3.
3. **[AUTH-CLINSAFETY]** A cadência de revisão de retirada (eixo 6) é, por design,
   deixada `VALIDATION REQUIRED` sem número proposto por este agente. Existe uma
   cadência padrão razoável específica para IntensiCare V2 (por exemplo, ligada à
   frequência de atualização de diretrizes como RCP NEWS2 ou Sepsis-3), ou isso deve
   ser definido por bundle sem padrão global?
4. **[AUTH-SECURITY, quando nomeado]** O eixo 2 recomenda dupla assinatura estrutural
   (Opção A) como alvo, com atestação em banco (Opção B) como estágio intermediário
   aceitável. Isso é consistente com a direção que a futura ADR-0022 deve tomar, ou
   existe uma preferência de mecanismo de custódia de chave que deveria já moldar o
   esquema do eixo 1 antes da ADR-0022 ser redigida?
5. **[AUTH-CLINSAFETY + AUTH-SECURITY]** O eixo 4 (ativação) propõe que o modo shadow
   seja um estado de ativação distinto e separadamente autorizado. A autorização de
   modo shadow (privacidade/segurança/governança de pesquisa, per linguagem do Gate
   G2) deveria ser a MESMA autorização humana que ativa em modo acionante mais tarde,
   ou uma autorização estruturalmente diferente (por exemplo, papéis diferentes)?
