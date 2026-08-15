---
id: ADR-0027
title: Enforcement de gating etário e populacional para instrumentos clínicos validados em adultos
status: accepted (2026-08-15, GDEC-0007)
status_history:
  - status: proposed
    date: 2026-08-15
    by: autor da ADR de enforcement de gating etário/populacional (IntensiCare V2, ciclo 1, Tarefa 4)
    note: >
      Opções, direcionadores, vocabulário de gating e condições de aceitação redigidos a
      partir dos itens BLOQUEANTES VAL-0006/VAL-0007 do backlog, de
      intended-use-statement.md IU-05/IU-06/IU-07, hazard-log.md HAZ-0036/HAZ-0044,
      safety-requirements.md SAF-0035/SAF-0041, dos achados legados de gating populacional
      do EWS/SOFA, e da evidência de adjudicação de identidade da AMH que estabelece que
      hoje não existe nenhuma fonte confiável de idade/demografia. NENHUMA decisão está
      registrada e nenhuma pode ser inferida. Esta ADR não pode avançar além de `proposed`
      até que um titular humano seja nomeado para AUTH-CLINSAFETY e AUTH-INTENDED-USE em
      `authority-model.md` (Gate G0) e VAL-0006/VAL-0007 sejam resolvidos.
  - status: accepted (2026-08-15, GDEC-0007)
    date: 2026-08-15
    by: rodaquino-OMNI (revisor clínico nomeado, GDEC-0003) — transcrito pelo orquestrador clínico do ciclo 1 (escriba)
    note: >
      Decisão por escrito, em sessão, do titular nomeado, registrada em
      decision-register.md GDEC-0007 (folha de decisão do ciclo 1, §8, linhas A27-1 a
      A27-7). Opção A (locus de enforcement) fixada, com o híbrido A+B+C adotado como
      emenda deste ADR (A27-6) e as disposições de carve-out decididas (A27-4). Ver §5.0.
      Bloco de decisão redigido em pt-BR per DEC-G0-10; o restante do documento
      permanece em inglês (tradução material adiada, P-4).
date: 2026-08-15
owner: UNASSIGNED — VALIDAÇÃO NECESSÁRIA
approvers:
  - UNASSIGNED — VALIDAÇÃO NECESSÁRIA   # papel candidato: AUTH-CLINSAFETY — rodaquino-OMNI é o titular *candidato* per GDEC-0003 (revisor clínico nomeado/aprovador de conteúdo clínico para os artefatos do ciclo 1), mas o próprio GDEC-0003 não ratifica uma nomeação AUTH-CLINSAFETY em authority-model.md; aquela linha permanece UNASSIGNED lá.
  - UNASSIGNED — VALIDAÇÃO NECESSÁRIA   # papel candidato: AUTH-INTENDED-USE — mesma candidatura e mesma ressalva; a linha de authority-model.md permanece UNASSIGNED.
decision_deadline: >
  NÃO DEFINIDO — VALIDAÇÃO NECESSÁRIA. Forçado por dois eventos independentes: (a) a
  aprovação do portfólio de vias do Gate G2, já que nenhuma via pode entrar em modo
  `actionable` (SAF-0035) enquanto seu locus de enforcement de gating populacional não
  estiver desenhado; e (b) a resolução de VAL-0006/VAL-0007, já que a fronteira de faixa
  etária que o gate desta ADR deve impor (§4) não pode ser finalizada enquanto o escopo
  pediátrico/neonatal permanecer indefinido.
deciding_authority_rule: >
  docs/00-governance/decision-rights.md §2, duas linhas regem conjuntamente esta ADR:
  "Aceitação de risco clínico / risco residual" (AUTH-CLINSAFETY — esta ADR
  operacionaliza arquiteturalmente SAF-0035/SAF-0041) e "Uso pretendido / uso não
  pretendido" (AUTH-INTENDED-USE — esta ADR estende a fronteira populacional de
  IU-05/IU-06/IU-07 para um comportamento de sistema exigível). Agentes podem redigir as
  opções de enforcement; apenas a autoridade conjunta nomeada pode aceitar uma delas,
  per `intended-use-statement.md` §7.1.
independence_check: >
  O autor desta ADR é um especialista de redação e não está listado como aprovador
  (decision-rights.md §3). Nenhum par de independência exigida é acionado pela
  *redação* desta ADR. O Par 1 (autor da regra ≠ aprovador clínico, decision-rights.md
  §3) é acionado no momento em que os predicados do gate escolhido forem redigidos
  dentro de um pacote de regras (ADR-0007) e deve ser reverificado naquele momento — o
  especialista que implementa o predicado do gate não pode também ser o aprovador
  clínico que ratifica os valores de faixa etária/gravidez/care-setting que ele impõe.
  SAF-0037 (independência como controle de processo) aplica-se a qualquer evidência de
  aceitação posterior deste gate.

links:
  drivers:
    domain_invariants: [DOM-0004, DOM-0007, DOM-0008]
    quality_scenarios: [QAS-0017, QAS-0007, QAS-0023, QAS-0019, QAS-0027]
    risks: ["IDs pendentes no registro de riscos — ver docs/00-governance/registers/risk-register.md"]
  constrains:
    requirements: ["REQ: catálogo de requisitos pendente (docs/04-product-requirements ainda não criado)"]
    clinical: ["CLR: portfólio de vias pendente (Gate G2)"]
    safety: [SAF-0035, SAF-0041, SAF-0027, SAF-0020, SAF-0023, SAF-0006, SAF-0019, SAF-0022, SAF-0017]
  hazards: [HAZ-0036, HAZ-0044]
  tests: ["TST: arquitetura de testes pendente"]
  validations: [VAL-0006, VAL-0007, VAL-0008, VAL-0009, VAL-0010]
  adrs:
    depends_on: [ADR-0004]
    feeds: [ADR-0007, ADR-0008]
  gates: [G2]
  evidence:
    - docs/02-users-and-workflows/g1-validation-backlog.md
    - docs/01-vision-and-intended-use/intended-use-statement.md
    - docs/05-clinical-safety/hazard-log.md
    - docs/05-clinical-safety/safety-requirements.md
    - docs/05-clinical-safety/evaluation-status-semantics.md
    - docs/05-clinical-safety/legacy-review/ews/shared-findings.md
    - docs/05-clinical-safety/legacy-review/sepsis-scores/sofa-review.md
    - docs/08-interoperability/amh-data/compatibility-finding.md
    - docs/08-interoperability/amh-data/identity-adjudication/interim-identity-policy.md
    - docs/08-interoperability/amh-data/identity-adjudication/adjudicacao-decisoes-2026-08-15.md

supersedes: null
superseded_by: null

provenance:
  source_repo: intensicare-V2
  path_or_url: docs/06-architecture/adrs/ADR-0027-age-and-population-gating-enforcement.md
  commit_sha_or_version: ddac9bc (HEAD do repositório no momento da redação, branch cycle-1/clinical-content; este arquivo estava não commitado)
  section_or_lines: >
    g1-validation-backlog.md §B (VAL-0006, VAL-0007, VAL-0008, VAL-0009, VAL-0010);
    intended-use-statement.md §3 (IU-05, IU-06, IU-07); hazard-log.md HAZ-0036, HAZ-0044;
    safety-requirements.md SAF-0035, SAF-0041; evaluation-status-semantics.md §3.3;
    ews/shared-findings.md SF-6; sepsis-scores/sofa-review.md linha 010 e §7;
    compatibility-finding.md §3; identity-adjudication/interim-identity-policy.md IDP-06,
    IDP-11; identity-adjudication/adjudicacao-decisoes-2026-08-15.md §2 (AQ-1..AQ-6)
  date_collected: 2026-08-15
  collector: autor da ADR de enforcement de gating etário/populacional (IntensiCare V2, ciclo 1, Tarefa 4)
  transformation: >
    reasoned-from — opções e direcionadores de enforcement derivados dos artefatos
    citados de governança, segurança clínica, uso pretendido, revisão legada e
    interoperabilidade da V2. Esta ADR não realizou nenhuma verificação clínica
    independente e não mintou nenhum ID novo de HAZ, SAF, VAL, DOM ou QAS; ela cita os
    já existentes. Ela não reverificou diretamente o perfil Patient do FHIR IG da AMH
    (ver E13, uma INFERENCE a partir de uma ausência).
  confidence: média
  owner: UNASSIGNED — VALIDAÇÃO NECESSÁRIA
  validation_status: VALIDAÇÃO NECESSÁRIA
---

# ADR-0027 — Enforcement de gating etário e populacional para instrumentos clínicos validados em adultos

> Traduzido EN→pt-BR em 2026-08-15 (GDEC-0008 item 8, tranche 1); original EN preservado no histórico git (commit 3530295).

> **Status: `accepted (2026-08-15, GDEC-0007)`.** O revisor clínico nomeado
> (rodaquino-OMNI, GDEC-0003) decidiu, por escrito, em sessão de 2026-08-15
> (transcrição-mestre: `decision-register.md` GDEC-0007), o locus de enforcement
> (Option A), a política de gravidez, o gate de care-setting, os quatro carve-outs de
> subpopulação e a adoção do híbrido A+B+C como emenda — ver §5.0 para o registro por
> questão (A27-1 a A27-7). O valor concreto do limiar etário passa a ser **≥18
> produto-wide**, com pisos por instrumento (ex.: NEWS2 ≥16) registrados porém
> **inativos**. A contratação de fonte demográfica confiável (C8) e a verificação de
> engenharia do ponto único de avaliação (C6/A27-5) permanecem `VALIDATION REQUIRED` e
> não são fechadas por esta aceitação.

---

## 1. Contexto e enunciado do problema

O predecessor legado do IntensiCare V2 calculava escores de alerta precoce e de
disfunção orgânica validados em adultos (NEWS2, MEWS, SOFA, qSOFA) **sem nenhum gating
de idade, gravidez ou care-setting em nenhum ponto do caminho de escoragem ou de
ingestão** — SOURCE, o achado cross-score SF-6 da revisão legada do EWS
(`legacy-review/ews/shared-findings.md`): "não existe gating de idade, gravidez ou
care-setting em nenhum ponto de nenhum dos dois caminhos de escoragem; o esquema de
ingestão não carrega nenhum campo de data de nascimento ou idade." Nos próprios termos
de seu editor, o NEWS2 é "projetado para uso em pacientes com 16 anos ou mais e não é
recomendado para uso em crianças com menos de 16 anos ou durante a gravidez" (SOURCE,
relatório RCP 2017 §2, citado em `shared-findings.md` SF-6 e
`legacy-review/ews/news2-review.md:163`); o MEWS deriva de uma coorte adulta de
admissões clínicas (Subbe 2001). A revisão legada do SOFA confirma, de forma
independente, que o tratamento de idade estava fora do próprio escopo desse instrumento
e "relevante apenas para o gating populacional (VAL-0006/0007)"
(`legacy-review/sepsis-scores/sofa-review.md` linha 010), e declara claramente que a
álgebra de status de avaliação do SOFA para insumo ausente "alimenta a ADR-0008
diretamente" — esta ADR é o análogo, em fronteira populacional, dessa mesma questão em
aberto.

**A própria redação de uso pretendido do IntensiCare V2 herda, e aguça, a mesma
fronteira.** `intended-use-statement.md` propõe uma população exclusivamente adulta
(IU-05, limiar ≥18 como **placeholder de redação, não recomendação clínica**), mas
sinaliza a inclusão pediátrica/neonatal como uma **DECISÃO BLOQUEANTE** (IU-06): "não
basta declarar em prosa que o pediátrico/neonatal está 'fora de escopo'. A fronteira de
escopo deve ser **imposta no comportamento do sistema**." A IU-06 registra ainda, como o
mecanismo que esta ADR existe para endereçar: "a V2 deve conseguir determinar, a partir
de dados confiáveis de identidade/encontro, se um paciente está dentro da população
aprovada, e deve renderizar uma não-avaliação explícita … quando estiver fora dela ou
quando a idade for desconhecida." A IU-07 registra quatro subpopulações adicionais como
**nem incluídas nem excluídas por nenhuma evidência revisada**: cuidado crítico
obstétrico/gravidez, suporte extracorpóreo (ECMO/CRRT), pacientes pós-cirúrgicos
cardíacos, e pacientes sob restrição documentada de metas de cuidado.

`g1-validation-backlog.md` registra a mesma fronteira como dois itens BLOQUEANTES —
**VAL-0006** ("A população pediátrica está em escopo para a V2 v1?") e **VAL-0007** ("A
população neonatal está em escopo para a V2 v1?") — mais dois itens dependentes,
também BLOQUEANTES: **VAL-0008** ("O que a V2 deve fazer quando um paciente está fora
da população aprovada, ou sua idade é desconhecida, não interpretável ou conflitante?")
e **VAL-0010** (exclusão de subpopulação, citando o caso paliativo como materialmente
distinto porque "a V2 poderia estar tecnicamente correta e clinicamente errada").

`hazard-log.md` **HAZ-0036** nomeia o mecanismo concreto de falha: "lógica de
instrumento validado em adultos avaliando um paciente pediátrico ou de idade
desconhecida porque o gating populacional não pode ser imposto a partir de dados
confiáveis, **já que não existe fonte confiável de idade**" (severidade S4,
probabilidade L3, classificado Unacceptable). `safety-requirements.md` **SAF-0035** já
declara o requisito ao qual esta ADR deve dar uma arquitetura: "O sistema DEVE impor o
uso pretendido aprovado — população, care setting, exclusões — e DEVE recusar-se a
avaliar fora dele com uma razão `not_evaluated` explícita, em vez de produzir um
resultado." `evaluation-status-semantics.md` §3.3 já lista "o sujeito está fora da
população ou do setting aprovado (SAF-0035)" como uma das condições de entrada para
`not_evaluated`, e declara o fallback geral: "qualquer condição não explicitamente
coberta por esta especificação resolve para `not_evaluated` … Não existe caminho
'desconhecido → presumir que está tudo bem'." **Isto é consistente com, e é a instância
específica de população da, regra inegociável 7 do orchestrator-prompt** (citada neste
repositório como DOM-0004: "Nunca coagir dado clínico ausente, desatualizado, inválido,
parcial, conflitante ou inavaliável para zero, normal, sem risco, ou não-disparo
silencioso").

**Por que "não existe fonte confiável de idade" não é um floreio retórico.** A
adjudicação de identidade da AMH de 2026-08-15 (`adjudicacao-decisoes-2026-08-15.md` §2,
decisões AQ-1 a AQ-6) resolveu o escopo do MPI, o elemento de identidade no wire, o gate
de base legal/consentimento para o laço clínico, o identificador de fronteira
(`portable_subject_ref`), os eventos de ciclo de vida de identidade, e o bypass de
tenant/cross-tenant — **nenhuma das seis decisões trata de idade, data de nascimento, ou
qualquer outro atributo demográfico de gating.** A `ADR-0004` (identidade/encontro/MPI,
redigida concomitantemente neste ciclo) igualmente não contém nenhum conteúdo
relacionado a idade (grep em todo o seu texto, 2026-08-15). O E13 do §2.1 abaixo registra
que nenhum documento no corpus de evidência AMH deste repositório discute
`Patient.birthDate` ou idade, de forma alguma. O achado da IU-06 de que "não existe fonte
confiável de idade" não é, portanto, meramente afirmado por esta ADR; ele é consistente
com todo artefato do lado AMH que este programa produziu até hoje, nenhum dos quais
menciona o atributo.

**Pergunta.** Onde, no sistema, e por qual mecanismo, o IntensiCare V2 impõe que um
instrumento clínico validado em adultos nunca avalie um paciente cuja idade seja
desconhecida ou esteja fora da faixa validada do instrumento — e o que o sistema faz,
concretamente, na ausência de uma fonte confiável de idade?

**Fora de escopo para esta ADR** (cada item nomeado para prevenir scope creep):

- **Se as populações pediátrica ou neonatal estão em escopo para a V2 v1, de todo.**
  Isso é VAL-0006/VAL-0007, uma decisão clínica de `AUTH-INTENDED-USE` +
  `AUTH-CLINSAFETY`, não uma questão de arquitetura. Esta ADR é redigida para estar
  correta **independentemente de como VAL-0006/VAL-0007 se resolvam** — ver §8.2 T1.
- **O(s) valor(es) específico(s) do limiar etário.** O ≥18 da IU-05 é um placeholder; a
  fronteira RCP ≥16 do NEWS2 é citada no §4 como exemplo concreto por regra para o
  revisor, não adotada. Fixar o(s) limiar(es) real(is) é uma decisão clínica.
- **De onde vem a própria fonte confiável de idade/população** (`Patient.birthDate` da
  AMH, se e quando existir no wire, um sistema de cadastro não-AMH, atestação manual do
  clínico, ou outra fonte). Isso é uma questão de sourcing de dados/contrato para
  `AUTH-DATA-PLATFORM`, adjacente a, mas distinta da, questão de fronteira da
  `ADR-0001`. Esta ADR trata "hoje não existe fonte confiável" como um fato para se
  desenhar em torno, não como uma questão que ela resolve.
- **A semântica de status de avaliação como álgebra geral**
  (`valid`/`partial`/`not_evaluated`/`stale`/`invalid`) — isso é a `ADR-0008`, redigida
  concomitantemente. Esta ADR consome `not_evaluated` já definido em
  `evaluation-status-semantics.md` §3.3 e não acrescenta nenhum valor de status novo;
  ela decide apenas onde e como a condição de entrada de população-fora-de-escopo é
  avaliada e imposta.
- **Formato de pacote de regras, assinatura e fluxo de aprovação** — `ADR-0007`. Esta
  ADR declara que campos de população devem existir no schema do pacote (§4), mas não
  desenha esse schema.
- **A *política* de supressão de escalonamento por metas-de-cuidado/paliativo** — essa
  é a própria resolução da HAZ-0044, para a qual a SAF-0041 já declara o formato
  ("desconhecido nunca significa irrestrito"). Esta ADR trata paliativo/metas-de-cuidado
  apenas como uma **categoria de carve-out nomeada** que requer seu próprio gate (§4),
  não como uma política a redigir.

---

## 2. Evidências e premissas

### 2.1 Evidências

**Nota epistêmica.** Esta ADR não reverificou nenhum artefato da AMH de forma
independente; as declarações derivadas da AMH são rotuladas `SOURCE` porque citam
documentos produzidos por outros especialistas em commits fixados (pinned), per
`evidence-notation.md` §2 ("somente o agente que realizou uma verificação pode rotulá-la
`OBSERVED`").

| # | Rótulo | Declaração | Fonte | Confiança |
|---|---|---|---|---|
| E1 | SOURCE | VAL-0006 e VAL-0007 (escopo de população pediátrica e neonatal) estão ambos sinalizados 🚩 e marcados como **BLOQUEANTES** contra `intended-use-statement.md` IU-06. | `g1-validation-backlog.md` §B, linhas VAL-0006, VAL-0007 | alta |
| E2 | SOURCE | VAL-0008 ("O que a V2 deve fazer quando um paciente está fora da população aprovada, ou sua idade é desconhecida, não interpretável ou conflitante?") é BLOQUEANTE e declara explicitamente que "Exclusão em prosa não é enforcement." | `g1-validation-backlog.md` §B, linha VAL-0008 | alta |
| E3 | SOURCE | A IU-06 é uma **DECISÃO BLOQUEANTE** nomeada: o status de escopo pediátrico/neonatal está INDECIDIDO, assim como o comportamento do sistema quando idade/data de nascimento está ausente, não interpretável ou conflitante. A própria PROPOSAL do documento (pendente da decisão bloqueante) é que um paciente fora-da-população ou de idade desconhecida deve renderizar um estado explícito de não-avaliado, nunca um escore, nunca `normal`. | `intended-use-statement.md` IU-06 | alta |
| E4 | SOURCE | A IU-05 propõe adultos (limiar placeholder ≥18) como a população inicial; o documento declara explicitamente que o limiar "é um placeholder de redação, não uma recomendação clínica", e como ele interage com adolescentes em UTIs de adultos permanece indefinido. | `intended-use-statement.md` IU-05 | alta |
| E5 | SOURCE | IU-07: as subpopulações gravidez/obstétrica, ECMO/CRRT, pós-cirúrgica cardíaca, e paliativa/limitação-de-tratamento **não estão incluídas nem excluídas** por nenhuma evidência revisada; o caso paliativo é sinalizado como materialmente diferente porque o sistema "poderia estar tecnicamente correto e clinicamente errado." | `intended-use-statement.md` IU-07 | alta |
| E6 | SOURCE | A HAZ-0036 nomeia o mecanismo: lógica de instrumento validado em adultos avaliando um paciente pediátrico ou de idade desconhecida "porque o gating populacional não pode ser imposto a partir de dados confiáveis, já que não existe fonte confiável de idade". Severidade S4, probabilidade L3, classificação Unacceptable. Controles candidatos SAF-0035, SAF-0027, SAF-0020, SAF-0023. | `hazard-log.md` HAZ-0036 | alta |
| E7 | SOURCE | HAZ-0044: um work item de escalonamento gerado para um paciente paliativo/limitação-de-tratamento/metas-de-cuidado porque o contexto de meta de cuidado não é um insumo da avaliação ou do roteamento — "tecnicamente correto pela regra e clinicamente errado para este paciente." Explicitamente registrado como **não** sendo uma violação de uso pretendido hoje (as subpopulações da IU-07 estão indecididas, não excluídas) e, portanto, distinto da HAZ-0036. Severidade S3, probabilidade L4, classificação Undesirable. | `hazard-log.md` HAZ-0044 | alta |
| E8 | SOURCE | SAF-0035: "Uma via DEVE ser não-acionante … até ter passado por seu gate de portfólio (G2) e seu gate de elegibilidade de fonte (G3). O sistema DEVE impor o uso pretendido aprovado — população, care setting, exclusões — e DEVE recusar-se a avaliar fora dele com uma razão `not_evaluated` explícita, em vez de produzir um resultado." | `safety-requirements.md` SAF-0035 | alta |
| E9 | SOURCE | SAF-0041: o contexto de metas-de-cuidado/limitação-de-tratamento "DEVE ser um insumo de primeira classe, portador de proveniência"; onde ausente/desatualizado/não verificável, "o sistema NÃO DEVE inferir 'sem restrição'" — deve marcar o contexto como explicitamente desconhecido e seguir um default aprovado, "o que é uma decisão clínica, não um default de engenharia." | `safety-requirements.md` SAF-0041 | alta |
| E10 | SOURCE | `evaluation-status-semantics.md` §3.3 já lista "o sujeito está fora da população ou do setting aprovado (SAF-0035)" como condição de entrada para `not_evaluated`, e declara a regra de fallback: qualquer condição não explicitamente coberta resolve para `not_evaluated` com razão `unspecified_condition` — "Não existe caminho 'desconhecido → presumir que está tudo bem'." | `evaluation-status-semantics.md` §3.3 | alta |
| E11 | SOURCE | Achado legado do EWS SF-6: OBSERVED (pelo especialista de revisão legada) que nem `news2.py`, nem `mews.py`, nem o esquema de ingestão de sinais vitais, carregam nenhum gate de idade, gravidez ou care-setting; o próprio editor do NEWS2 delimita seu escopo a ≥16 anos e não durante a gravidez (RCP 2017 §2). | `legacy-review/ews/shared-findings.md` SF-6 | alta |
| E12 | SOURCE | Revisão legada do SOFA: o tratamento de idade na linhagem trilhas foi avaliado como "DISCREPANCY, low" e julgado "fora do escopo do SOFA; relevante apenas para o gating populacional (VAL-0006/0007)"; separadamente, a revisão declara que o próprio tratamento de status de avaliação para insumo ausente do SOFA "alimenta a ADR-0008 diretamente", estabelecendo a relação de autoria concomitante que esta ADR compartilha com a ADR-0008. | `legacy-review/sepsis-scores/sofa-review.md` linha 010, §7 | alta |
| E13 | INFERENCE | Nenhum documento em `docs/08-interoperability/amh-data/` (o corpus de evidência AMH completo, fixado) discute `Patient.birthDate`, data de nascimento, ou idade (grep, 2026-08-15). Isso é consistente com, mas não confirma de forma independente, o achado da IU-06 de que "não existe fonte confiável de idade" — esta ADR não reverificou, ela mesma, o perfil `Patient` do FHIR IG da AMH. | ausência de correspondências em `docs/08-interoperability/amh-data/**/*.md`, coleta de 2026-08-15 | média |
| E14 | SOURCE | A adjudicação de identidade da AMH de 2026-08-15 resolveu seis questões de identidade/tenant/consentimento (AQ-1 escopo do MPI, AQ-2 elemento de identidade no wire, AQ-3 gate de base legal/consentimento, AQ-4 identificador de fronteira, AQ-5 eventos de ciclo de vida de identidade, AQ-6 enumeração/bypass de tenant). Nenhuma delas trata de idade ou de qualquer outro atributo demográfico de gating. | `identity-adjudication/adjudicacao-decisoes-2026-08-15.md` §2 | alta |
| E15 | SOURCE | O padrão fail-closed da política de identidade interina (IDP-06: identidade não resolvida → `not_evaluated`, contabilizada, nunca um valor; IDP-11: toda condição listada de ausência/incompatibilidade/não-verificabilidade é uma negação, contabilizada, registrada em log, visível; nenhum caminho global "modo degradado = permissivo" pode existir) tem, arquiteturalmente, o mesmo formato que esta ADR propõe aplicar a idade/população, em vez de identidade. | `identity-adjudication/interim-identity-policy.md` IDP-06, IDP-11 | alta |
| E16 | SOURCE | DOM-0004 (invariante de domínio): "Sempre que um insumo obrigatório, observação, ou precondição de avaliação estiver ausente, desatualizado, inválido, parcial, conflitante, ou de outra forma inavaliável, o sistema deve [não coagi-lo] … não em risco." Referenciado a `PROMPT:119` / regra inegociável 7 do orchestrator-prompt. | `docs/03-domain/invariants/DOM-invariants.md` DOM-0004 | alta |

### 2.2 Premissas

Cada premissa deve ser registrada em
`docs/00-governance/registers/assumptions-register.md` com um ID `ASM-xxxx`. **Esta ADR
não minta IDs `ASM`.**

| # | Premissa | Por que é necessária | O que a invalida | Titular | Status no registro |
|---|---|---|---|---|---|
| A1 | Pelo menos um instrumento validado em adultos (NEWS2, MEWS, SOFA, qSOFA, ou um equivalente de autoria V2) sobrevive à aprovação de via clínica do Gate G2 e é destinado ao modo `actionable`. | Se nenhum instrumento chegar a `actionable`, o locus de enforcement desta ADR não tem nada para gatear e a questão fica moot até que chegue. | O Gate G2 aprovar um portfólio com zero vias de instrumento adulto em modo `actionable`. | UNASSIGNED — VALIDAÇÃO NECESSÁRIA | a ser registrada |
| A2 | Não existirá fonte confiável de idade/população no lançamento da V1. | Impulsiona a consequência "todo instrumento fica `not_evaluated` até que uma fonte seja contratada", em §4 e §6. | Uma fonte demográfica contratada, populada e portadora de proveniência (AMH ou outra) chegando antes do lançamento da V1. | UNASSIGNED — VALIDAÇÃO NECESSÁRIA | a ser registrada |
| A3 | VAL-0006/VAL-0007 (escopo pediátrico/neonatal) serão decididos antes que qualquer via de instrumento adulto alcance o modo `actionable`. | Se falsa, um instrumento adulto poderia alcançar prontidão G2/G3 enquanto a população que ele deve excluir ainda está indefinida, o que o gate desta ADR sozinho não consegue reparar. | O Gate G2 aprovar uma via para modo `actionable` enquanto VAL-0006/VAL-0007 permanecerem ABERTOS. | UNASSIGNED — VALIDAÇÃO NECESSÁRIA | a ser registrada |
| A4 | O runtime de avaliação de regras (objeto da baseline modular-monolito da `ADR-0002`) tem um único ponto pelo qual toda requisição de avaliação clínica passa antes de a lógica de regra executar. | A Opção A (§4) requer isso; se os pontos de entrada de avaliação forem arquiteturalmente plurais e não puderem ser unificados, a alegação de "choke point único" da Opção A se enfraquece para "um choke point por caminho de entrada." | A `ADR-0002` ou sua sucessora estabelecerem múltiplos pontos de entrada de avaliação independentes e não mediados. | UNASSIGNED — VALIDAÇÃO NECESSÁRIA | a ser registrada |
| A5 | Um CRV (vetor de referência clínico) / corpus de replay, per `clinical-reference-vector-standard.md`, existirá e será consultável para "alguma avaliação com idade desconhecida/fora de faixa produziu um status diferente de `not_evaluated`" antes do Gate G6/G8. | Impulsiona o direcionador mensurável D4 no §3 ("zero avaliações com idade desconhecida no corpus CRV/replay"). | Nenhum corpus CRV, ou um corpus CRV que não carregue campos de idade/população por vetor. | UNASSIGNED — VALIDAÇÃO NECESSÁRIA | a ser registrada |

### 2.3 Hipóteses a testar

| # | Hipótese | Como seria testada | Quem testa | Status atual |
|---|---|---|---|---|
| H1 | Um único gate de pré-avaliação no runtime (Opção A) consegue impor fronteiras de população/idade para todo pacote de regras sem deriva de duplicação por pacote. | Análise estática do call graph do motor de regras: provar que toda invocação de avaliação passa pelo gate; teste adversarial de que um pacote redigido sem declaração de população não consegue alcançar a avaliação. | Engenheiro de rule-runtime + engenheiro de arquitetura de testes com foco em segurança | **NÃO TESTADA** — ainda não existe runtime de regras |
| H2 | Declarar que "todo instrumento fica `not_evaluated` até que uma fonte demográfica confiável seja contratada" (§4, direcionador D2) é um custo de disponibilidade aceitável frente ao benefício de segurança. | Prevalência medida de `not_evaluated` (QAS-0007) contra uma tolerância clinicamente fixada, uma vez que exista um portfólio e um cronograma de fonte confiável. | `AUTH-CLINSAFETY` + `AUTH-PRODUCT` | **NÃO TESTADA e um julgamento clínico/de produto, não uma medição de engenharia** |
| H3 | O status de gravidez desconhecido pode ser tratado de forma idêntica à idade desconhecida (fail-closed) sem custo de disponibilidade materialmente diferente. | Comparar a completude medida da fonte de população para idade vs. status de gravidez, uma vez que exista uma fonte confiável; se o status de gravidez for sistematicamente menos obtível do que a idade, o gating fail-closed de gravidez produziria estados `not_evaluated` desproporcionalmente mais numerosos. | `AUTH-CLINSAFETY` + `AUTH-DATA-PLATFORM` | **NÃO TESTADA** — hoje não existe fonte de dados para nenhum dos dois atributos |

---

## 3. Direcionadores de decisão e atributos de qualidade mensuráveis

As metas são `VALIDAÇÃO NECESSÁRIA` — nenhuma meta numérica é inventada aqui (o Gate G1
não validou nenhuma).

| # | Direcionador | Por que discrimina entre as opções | Atributo de qualidade mensurável | Meta |
|---|---|---|---|---|
| D1 | **Segurança — o invariante de enforcement se sustenta sem lacuna.** Nenhum instrumento validado em adultos produz um resultado `valid`/`partial` para um paciente cuja idade seja desconhecida, não interpretável, conflitante, ou fora de faixa. | Este é o direcionador que a ADR inteira existe para servir (HAZ-0036, SAF-0035). As opções diferem em quantos lugares precisam acertar isso independentemente e, portanto, quão fácil é quebrar o invariante por omissão. | QAS-0017 (estado de segurança precede severidade) | VALIDAÇÃO NECESSÁRIA |
| D2 | **Dependência de uma fonte demográfica confiável que hoje não existe.** E13/E14 estabelecem que não existe fonte confiável de idade no snapshot de evidência fixado. Toda opção deve declarar, honestamente, o que faz com zero insumo confiável — que, para todas as opções hoje, é a condição real e atual. | Nenhuma opção consegue fazer uma fonte existir; as opções diferem apenas em se a *ausência* é imposta de forma ruidosa ou silenciosa. | QAS-0007 (prevalência e visibilidade da condição do dado) | VALIDAÇÃO NECESSÁRIA |
| D3 | **Custo de disponibilidade.** Um gate corretamente imposto contra uma fonte confiável inexistente significa que todo instrumento que requer confirmação de população fica `not_evaluated` no lançamento. Esta é a tensão honesta contra o D1: um sistema que é maximamente seguro contra dano fora-de-população e produz zero valor clínico também não é um bom resultado — a SAF-0035 exige recusa, não que a recusa seja gratuita. | QAS-0023 (modo degradado explícito); QAS-0007 | VALIDAÇÃO NECESSÁRIA |
| D4 | **Consistência e testabilidade — um único locus de enforcement vs. muitos.** As opções diferem em quantos caminhos de código precisam implementar o mesmo predicado independentemente, e quão completamente o teste adversarial/negativo (vetores CRV, corpus de replay) consegue cobrir todos eles. Uma meta mensurável, uma vez que exista um runtime e um corpus CRV: zero avaliações com idade desconhecida/fora de faixa no corpus CRV/replay produzem um status diferente de `not_evaluated`; 100% dos pacotes de regras declaram um escopo de população. | QAS-0007; TST: arquitetura de testes pendente | VALIDAÇÃO NECESSÁRIA |
| D5 | **Completude de subpopulação.** Idade é apenas um eixo. Gravidez, care setting, e os carve-outs nomeados (ECMO/CRRT, pós-cirúrgica cardíaca, paliativo/metas-de-cuidado) são gates distintos com disponibilidade de dado distinta e modos de falha distintos (HAZ-0044 não é HAZ-0036). Uma opção que só trata idade é incompleta por construção. | *Nenhum cenário ainda* — novo QAS candidato para completude de cobertura de população/subpopulação, titular: steward de atributo de qualidade (ainda não ativado) | VALIDAÇÃO NECESSÁRIA |
| D6 | **Reversibilidade à medida que o escopo se expande.** VAL-0006/VAL-0007 podem eventualmente admitir populações pediátricas ou neonatais com seus próprios instrumentos validados. As opções diferem em quão caro é ampliar o gate de "apenas-adulto" para "adulto-ou-pediátrico-com-instrumento-X" sem retocar todo pacote de regras. | QAS-0027 (reversibilidade e custo de saída) | VALIDAÇÃO NECESSÁRIA |
| D7 | **Auditabilidade da própria decisão de gating.** Toda admissão e toda rejeição devem ser um registro durável e explicável (SAF-0019, SAF-0023) — um gate que descarta uma requisição silenciosamente é, ele mesmo, um novo hazard (cf. IDP-11: "nenhuma configuração torna qualquer negação permissiva" e "nunca tratada como evidência de ausência"). | QAS-0019 (integridade de proveniência e correção) | VALIDAÇÃO NECESSÁRIA |

**Excluído por não-discriminar:** "o gate verifica a idade" — toda opção faz isso; o que
discrimina é *onde* e *com quanta consistência*.

---

## 4. Alternativas consideradas

Pelo menos duas alternativas viáveis mais "adiar / não fazer nada". Antes que as opções
de locus de enforcement possam ser comparadas, o *conteúdo* que um gate avalia precisa
ser nomeado — este vocabulário é voltado ao revisor e deixado em aberto, não é uma
decisão.

### 4.0 Vocabulário de gating por pacote de regras

**Faixa etária.** Cada pacote de regras (ou cada instrumento que o pacote implementa)
precisa de uma faixa etária válida declarada. **Exemplo, não uma decisão:** a própria
faixa validada do NEWS2 é ≥16 anos, per seu editor (RCP 2017 §2, E11) — uma fronteira
**diferente** do placeholder ≥18 da IU-05 de `intended-use-statement.md` para a proposta
de população geral da V2. **Esta é exatamente o tipo de decisão por regra que esta ADR
sinaliza para o revisor em vez de resolver**: se a V2 admite adultos ≥18 mas um
instrumento específico dentro dessa população foi validado a partir de 16, é a faixa do
*instrumento* ou a fronteira populacional do *produto* que é autoritativa para um
paciente de 17 anos admitido em uma UTI de adultos? Registrado como questão aberta 1 no
§11.1; não decidido aqui.

**Tratamento do status de gravidez.** Duas posições são argumentadas honestamente,
porque a evidência não decide entre elas:

- **Argumento a favor do fail-closed** (gravidez desconhecida → `not_evaluated`, igual
  à idade desconhecida). O NEWS2 é explicitamente "não recomendado para uso … durante a
  gravidez" (E11); a gravidez muda materialmente diversas baselines de sinais vitais
  que o escore presume. Tratar o status de gravidez desconhecido de forma idêntica à
  idade desconhecida é a regra mais simples de declarar, testar e auditar, e é
  consistente com a postura geral de DOM-0004/regra 7.
- **Argumento a favor de sinalizado-mas-não-bloqueante** (gravidez desconhecida →
  avaliada com uma ressalva visível, não `not_evaluated`). O status de gravidez pode ser
  sistematicamente menos confiavelmente obtível do que a idade, mesmo uma vez que exista
  uma fonte demográfica confiável (a idade frequentemente está em um documento de
  identidade; o status de gravidez é um fato clínico que requer apuração ativa) — a H3
  no §2.3 nomeia isso diretamente. Um gate fail-closed de gravidez arrisca uma taxa de
  `not_evaluated` desproporcionalmente alta que poderia, ela mesma, se tornar um hazard
  de habituação (cf. HAZ-0043: "`not_evaluated` permanente lido como silêncio
  tranquilizador").
- **Recomendação (PROPOSAL, não decidida):** fail-closed por consistência com o gate
  etário e com o espírito da regra 7, **a menos e até que** uma taxa medida de
  completude de status de gravidez (H3) demonstre que o custo de disponibilidade é
  materialmente pior do que o da idade — momento em que uma exceção
  sinalizada-não-bloqueante precisaria de sua própria análise de hazard e aprovação
  clínica, não uma mudança silenciosa de default.

**Gate de care-setting.** A IU-03 de `intended-use-statement.md` propõe apenas-UTI como
o setting inicial, com step-down/enfermaria/RRT/centro-de-comando todos registrados
INDECIDIDOS (IU-04a–f). A mesma questão de enforcement que esta ADR levanta para idade
se aplica identicamente ao care setting: qualquer que seja o locus que impõe idade
também deve conseguir impor setting, a partir do mesmo problema de dependência de fonte
confiável (um atributo de care-setting também precisa de uma fonte de proveniência).
Esta ADR trata o gating de care-setting como **estruturalmente o mesmo problema que o
gating de idade** e assume (adjacente à A4) que ambos são impostos pelo mesmo locus,
não por mecanismos separados — mas não decide, ela mesma, a fronteira de setting.

**Carve-outs de subpopulação nomeados**, deixados explicitamente para o revisor, cada um
requerendo sua própria decisão clínica per IU-07 e, onde já existe um hazard,
referenciado a ele:

- **Cuidado crítico obstétrico/gravidez** — acima.
- **Suporte extracorpóreo (ECMO/CRRT)** — a fisiologia pode invalidar as premissas do
  escore (IU-07); nenhuma linha de hazard nomeia atualmente este mecanismo
  especificamente. **Sinalizado como decisão do revisor, não decidida aqui.**
- **Pacientes pós-operatórios de cirurgia cardíaca** — um distúrbio fisiológico
  esperado pelo protocolo pode tornar clinicamente esperado um escore que de outra
  forma seria anormal (IU-07). **Sinalizado como decisão do revisor, não decidida
  aqui.**
- **Paliativo / metas-de-cuidado / limitação-de-tratamento documentada** — referencia
  diretamente **HAZ-0044** e **SAF-0041**. Este é o único carve-out com um requisito de
  segurança já existente (SAF-0041: o contexto de meta de cuidado desconhecido nunca
  deve resolver para "irrestrito"), mas a própria SAF-0041 declara que "a política em
  si, e o default quando o contexto é desconhecido, DEVEM ser fixados pela governança
  clínica. Este agente não propõe nenhum default" — e esta ADR também não propõe. O que
  esta ADR de fato afirma: **o carve-out paliativo é um gate distinto do gate de
  idade/população**, porque a IU-07 o registra como "nem incluído nem excluído" (uma
  questão de escopo em aberto) em vez de como uma população excluída, do jeito que o
  pediátrico é proposto a ser (IU-06) — confundir os dois afirmaria, per E7, uma
  exclusão que ninguém aprovou.

### Opção A — Gate de pré-avaliação no runtime, dentro do motor de regras (choke point único)

**Descrição.** Um componente de gating dedicado fica entre "uma requisição de avaliação
é aceita" e "um pacote de regras executa." Ele recebe o contexto de sujeito/encontro
resolvido (da camada de identidade/PSR que a `ADR-0004` estabelece) mais os metadados de
população declarados de cada pacote de regras candidato (faixa etária, tratamento de
gravidez, escopo de care-setting, exclusões de subpopulação — os campos de schema de
pacote que a `ADR-0007` precisaria acrescentar), e ou admite a avaliação ou retorna
`not_evaluated` com uma razão legível por máquina antes que qualquer lógica de regra
execute. Nenhum pacote de regras consegue contorná-lo, porque os pacotes não têm um
ponto de entrada alternativo para a avaliação (A4).

**Como responde a cada direcionador.**

- D1: **Mais forte.** Um componente para acertar, um componente para testar
  adversarialmente, um lugar onde a condição de fonte ausente é garantidamente
  verificada antes que qualquer lógica clínica veja a requisição.
- D2: O gate é o lugar natural para codificar "sem fonte confiável → negar", tornando a
  dependência explícita e centralmente visível em vez de espalhada.
- D3: Por ser centralizado, o *volume* de saída `not_evaluated` é fácil de medir e
  reportar como um único número (QAS-0007) — custo visível, não custo escondido.
- D4: Mira diretamente a meta mensurável do D4 — um único caminho de código para provar
  fechado por análise estática mais testes adversariais, em vez de N implementações por
  pacote para auditar individualmente.
- D5: Um único gate pode ser estendido com predicados adicionais de subpopulação
  (gravidez, setting, carve-outs) sem tocar na própria lógica de cada pacote — mas isso
  também significa que o componente do gate cresce em complexidade à medida que regras
  de subpopulação se acumulam, o que é uma consequência negativa real, não uma extensão
  gratuita.
- D6: Ampliar o gate (por exemplo, admitir um instrumento pediátrico validado) é uma
  mudança em um único lugar mais novos metadados de pacote, não uma reauditoria de todo
  pacote existente.
- D7: Um choke point único também é um único lugar para garantir que o registro de
  auditoria seja produzido — mas também um único ponto cuja própria falha (um bug, um
  bypass, um campo de metadado ausente assumindo o default errado) afeta todo pacote de
  uma vez. **Este risco de concentração é o negativo honesto que esta opção carrega e
  que a Opção B não carrega.**

**Consequências positivas.** Testável como um único componente; um pacote com metadado
ausente falha fechado (fail closed) por construção, em vez de depender de cada autor de
pacote lembrar de verificar; o volume de `not_evaluated` que isso produz é um único
número reportável; ampliar ou estreitar a fronteira populacional é uma mudança de
configuração/metadado, não uma reescrita de lógica de regra.

**Consequências negativas.** Um único ponto de falha para toda via clínica de uma vez —
um defeito aqui não fica isolado a um instrumento do jeito que um bug por regra ficaria;
requer que a arquitetura do motor de regras (trabalho sucessor da `ADR-0002`) garanta
que de fato existe apenas um ponto de entrada de avaliação (A4), o que ainda não está
estabelecido; acrescenta um hop obrigatório a toda avaliação, com um custo de latência
que esta ADR não mede; a própria correção do gate se torna tão crítica para a segurança
quanto as regras que ele gateia, o que eleva sua própria barra de verificação
independente (SAF-0037) em vez de reduzir o encargo de verificação geral.

**O que precisaria ser verdade para esta ser a resposta certa.** A4 se sustenta (um
único ponto de entrada de avaliação); o schema de pacote da `ADR-0007` consegue carregar
metadado de população; o próprio componente de gate recebe pelo menos o mesmo nível de
rigor de teste adversarial que um pacote de regras receberia (do contrário, a alegação
de "mais forte" do D1 não é conquistada, apenas presumida).

**Custo de saída se escolhida e depois revertida.** Baixo-a-moderado: o gate é um
componente bem delimitado atrás de uma interface clara; removê-lo ou substituí-lo não
requer tocar no conteúdo de pacote de regras, apenas no(s) ponto(s) de chamada que o
invocam.

### Opção B — Duplicação de predicado por regra em cada pacote

**Descrição.** Todo pacote de regras carrega sua própria lógica de gating populacional
como parte de seu próprio conjunto de predicado/precondição — sem componente
compartilhado; cada autor de pacote (e cada aprovador clínico daquele pacote) é
independentemente responsável por verificar idade, gravidez, setting, e carve-outs
antes que a lógica clínica do pacote execute.

**Como responde a cada direcionador.**

- D1: **Mais fraco.** O invariante só se sustenta se todo autor de pacote acertar
  sempre; um pacote novo que esquece a verificação é uma regressão silenciosa que a
  arquitetura não faz nada para prevenir. Este é estruturalmente o mesmo modo de falha
  que SF-6 documenta para o sistema legado — lógica de gating que não existe em lugar
  nenhum é trivialmente "duplicada em lugar nenhum."
- D2: A dependência de "sem fonte confiável" precisa ser codificada independentemente —
  e mantida correta independentemente — em todo pacote.
- D3: O volume de `not_evaluated` fica espalhado entre pacotes; medir o custo de
  disponibilidade agregado (D3) requer agregar N implementações independentes em vez de
  ler a saída de um único componente.
- D4: Não consegue atingir a meta mensurável do D4 ("100% dos pacotes declaram
  população") apenas por construção — declaração e enforcement são o mesmo ato aqui,
  então não existe verificação independente de que o gate autodeclarado de um pacote
  está de fato correto.
- D5: Os predicados de subpopulação precisariam ser copiados (ou, pior, sutilmente
  reimplementados de forma diferente) em todo pacote que precisar deles — um
  amplificador direto do risco de deriva.
- D6: Ampliar o escopo significa tocar no predicado de todo pacote existente, não no
  metadado de um único componente.
- D7: Os registros de auditoria dependem de todo pacote produzi-los independentemente,
  de forma consistente.

**Consequências positivas.** Nenhuma dependência da correção ou disponibilidade de um
único componente compartilhado; um autor de pacote tem contexto local completo sobre
exatamente para quais populações seu instrumento específico foi validado, o que poderia,
em princípio, produzir um gating por instrumento *mais* clinicamente preciso do que um
gate compartilhado genérico (por exemplo, a própria fronteira ≥16 do NEWS2 vs. um ≥18
produto-wide) — esta é uma força real que a Opção A não tem, a menos que seu schema de
metadado seja igualmente expressivo.

**Consequências negativas.** Nenhuma garantia arquitetural contra omissão; exatamente a
classe de defeito que HAZ-0036 e SF-6 já documentam como tendo ocorrido no sistema
legado; enforcement inconsistente entre pacotes é um resultado previsível, não um risco
remoto; a completude de teste requer N suítes de teste adversarial independentes, em vez
de uma.

**O que precisaria ser verdade para esta ser a resposta certa.** A precisão de gating
por instrumento (por exemplo, honrar o ≥16 do NEWS2 vs. uma fronteira produto-wide mais
grosseira) é julgada pela `AUTH-CLINSAFETY` como mais importante do que o risco de
omissão — e um controle compensatório (por exemplo, um campo de população obrigatório
em nível de schema, verificado por CI, aquém de um gate em runtime) fecha a lacuna que o
D1 deixaria aberta de outra forma.

**Custo de saída se escolhida e depois revertida.** Moderado-a-alto: consolidar N
predicados de autoria independente em um gate compartilhado depois requer auditar a
lógica existente de todo pacote em busca de deriva comportamental antes da
consolidação, não apenas acrescentar um componente novo.

### Opção C — Marcação de população somente no lado da ingestão

**Descrição.** Atributos de população/demografia são validados e marcados (tagged) uma
única vez, na ingestão (a camada anticorrupção que `ADR-0001`/`ADR-0004` estabelecem),
produzindo um atributo de escopo de população no registro canônico de sujeito/encontro.
Não existe gate separado em tempo de avaliação; confia-se que os pacotes de regras (ou
seu runtime) leiam e honrem a tag.

**Como responde a cada direcionador.**

- D1: Depende inteiramente de todo consumidor da tag de fato verificá-la — esta é a
  lacuna de enforcement da Opção B realocada de "por pacote de regras" para "por
  consumidor da tag", o que não a fecha, apenas a move. Uma tag que existe mas não é
  autoritativamente *imposta* em tempo de avaliação não é diferente, em espécie, do
  achado da IU-06 de que "exclusão em prosa não é enforcement" sobre uma declaração de
  população que não é comportamentalmente vinculante.
- D2: O problema de "sem fonte confiável" é visível exatamente uma vez, na ingestão —
  o que é uma força genuína: um único número mensurável de "fração de sujeitos
  ingeridos com tag de população não resolvida" existe desde o dia um.
- D3: Como a marcação acontece independentemente de algum instrumento vir a verificá-la
  depois, a marcação do lado da ingestão *sozinha* não produz, por si só, nenhum estado
  `not_evaluated` — ela produz dado que a lógica downstream *poderia* usar para produzir
  esses estados, o que é uma propriedade de segurança significativamente mais fraca do
  que o D1 requer.
- D4: A mera existência de uma tag não é evidência de enforcement; a meta mensurável do
  D4 no corpus CRV/replay ("zero avaliações com idade desconhecida produzem um status
  diferente de `not_evaluated`") não é satisfeita apenas pela marcação — ela requer que
  *algo* downstream aja sobre a tag, o que retorna à Opção A ou à Opção B para a metade
  de enforcement.
- D5/D6/D7: Mesma lacuna estrutural do D1 — a marcação é uma precondição necessária
  para qualquer um deles, não um mecanismo suficiente para nenhum deles.

**Consequências positivas.** Centraliza a *medição* do problema de fonte confiável no
ponto mais precoce possível; a tag é reutilizável por qualquer consumidor futuro
(analytics, reconciliação, uma futura via pediátrica) sem re-derivar o escopo de
população; mais barata de construir do que um gate completo em runtime.

**Consequências negativas.** **Não satisfaz, por si só, o "DEVE recusar-se a avaliar" da
SAF-0035** — ela produz informação que um mecanismo de recusa poderia usar, mas não é,
ela mesma, esse mecanismo. Apresentar a Opção C como suficiente por si só seria a mesma
categoria de erro que a IU-06 já nomeia ("exclusão em prosa não é enforcement", aqui se
tornando "tag de dado não é enforcement"). Registrado aqui honestamente como a opção
mais fraca contra o D1, **não** porque a marcação do lado da ingestão não tenha valor —
ela é um componente necessário sob toda opção — mas porque ela não pode ser o *único*
locus de enforcement sem deixar o invariante central sem imposição.

**O que precisaria ser verdade para esta ser a resposta certa.** Apenas se combinada com
um contrato de consumidor downstream obrigatório e verificado independentemente (o que
então seria, em substância, a Opção A ou a Opção B com outro nome) — como opção
**isolada**, nenhuma evidência revisada sustenta que ela satisfaça o D1.

**Custo de saída se escolhida e depois revertida.** Baixo: a própria tag sobrevive como
dado útil sob qualquer uma das outras opções; apenas a metade (ausente) de enforcement
precisaria ser construída.

### Opção Z — Adiar / não fazer nada

**Descrição.** Não registrar nenhuma decisão de locus de enforcement. Todo pacote de
regras prossegue pelo desenho do Gate G2/G7 sem um mecanismo de gating populacional
desenhado, sob o entendimento de que a SAF-0035 já existe como requisito e
presumivelmente será satisfeita por qualquer que seja o componente que acabe
implementando a avaliação.

**Consequências positivas.** Nenhum comprometimento arquitetural prematuro enquanto o
trabalho sucessor da `ADR-0002` e o schema de pacote da `ADR-0007` ainda estão
indesenhados (A4 não resolvida); nenhuma decisão é tomada sem uma autoridade
clínica/arquitetural nomeada.

**Consequências negativas.** A SAF-0035 é um **requisito de controle de hazard para um
hazard classificado como Unacceptable (HAZ-0036)** sem nenhuma proposta de desenho;
adiar além do ponto em que um primeiro pacote de regras é redigido arrisca exatamente o
resultado que SF-6 documenta para o sistema legado — lógica de gating que ninguém
desenhou e que, portanto, não existe. **Esta é uma postura de adiamento materialmente
pior do que a da `ADR-0001`** (que adia uma escolha de fronteira de plataforma mantendo
explicitamente o adaptador AMH atrás de uma porta para preservar reversibilidade): não
existe um padrão equivalente de "manter atrás de uma porta" para um gate *ausente* — a
própria ausência é o hazard.

**Custo do atraso.** Sobe de forma acentuada e imediata, não em algum gate futuro: todo
pacote de regras redigido antes que esta ADR se resolva é redigido sem um locus de
enforcement desenhado para chamar, que é exatamente a condição que HAZ-0036 descreve
como Unacceptable.

### 4.1 Comparação contra os direcionadores

| Direcionador | A — gate em runtime | B — duplicação por regra | C — apenas tagging na ingestão | Z — adiar |
|---|---|---|---|---|
| D1 invariante de segurança | Forte — um único choke point imposto | Fraco — depende de todo autor | Fraco sozinho — tag ≠ enforcement | Nenhum — nenhum desenho existe |
| D2 dependência de fonte | Explícita, centralmente visível | Espalhada, codificada independentemente | Visível na ingestão; não imposta | Não endereçada |
| D3 custo de disponibilidade | Mensurável como um único número | Espalhado entre pacotes | Nenhum `not_evaluated` produzido apenas pela tagging | Não medido |
| D4 consistência/testabilidade | Um único caminho de código para provar fechado | N suítes independentes | Necessária mas não suficiente | n/a |
| D5 completude de subpopulação | Extensível em um lugar, complexidade crescente | Copiada/desviada por pacote | Dado disponível; sem enforcement | n/a |
| D6 reversibilidade | Mudança de metadado | Reauditar todo pacote | Tag persiste; enforcement ainda necessário | Zero agora, hazard sobe imediatamente |
| D7 auditabilidade | Um único lugar para garantir registros | Depende de todo pacote | Depende do consumidor downstream | n/a |

**Decisão (GDEC-0007, 2026-08-15): Opção A**, com o híbrido observado abaixo adotado
como emenda (A27-6) em vez de uma quarta opção analisada — ver §5.0. Argumento
originalmente oferecido como recomendação, agora decisão: a Opção A responde mais
diretamente ao D1, direcionador ao qual todo outro direcionador é subordinado dada a
classificação Unacceptable da HAZ-0036 — mas a própria fraqueza honesta da Opção A (o
risco de concentração do D1, e a dependência da A4 de uma propriedade de runtime de
avaliação ainda não estabelecida pelo trabalho sucessor da `ADR-0002`) significa que ela
não é livre de risco, apenas diferentemente formatada em relação à da Opção B. **Um
híbrido é visível e não é avaliado por completo aqui**: a Opção A como o choke point
imposto, com a marcação do lado da ingestão da Opção C como sua fonte de dado (não como
substituto dela), e a precisão por instrumento da Opção B (por exemplo, o ≥16 do NEWS2)
expressa como metadado declarado no pacote, *lido pelo* gate da Opção A em vez de
*imposto por* cada pacote independentemente. Esta composição é sinalizada para
consideração do revisor (§11.1 item 6) em vez de apresentada como uma quarta opção
totalmente analisada, porque ela é, ao se inspecionar, "a Opção A corretamente
construída", não uma alternativa distinta.

---

## 5. Decisão e escopo

### 5.0 Decisão (GDEC-0007, 2026-08-15)

> *Bloco redigido em português (pt-BR) per DEC-G0-10; o restante deste documento
> permanece em inglês como conteúdo pré-existente (tradução material adiada — P-4).*
>
> decided_by: **rodaquino-OMNI** (revisor clínico nomeado, GDEC-0003; também titular
> interino de papéis `AUTH-*` de fase de projeto per GDEC-0004 onde pertinente).
>
> O invariante de enforcement, o vocabulário de gate (§4.0) e o locus de enforcement
> (§4, Option A) são aceitos como decisão. Registro por questão, per a folha de
> decisão do ciclo 1
> (`docs/05-clinical-safety/cycle-1-review-decision-sheet.md` §8, linhas A27-1 a
> A27-7):
>
> - **A27-1 →** limiar etário decidido: **≥18 produto-wide**; pisos por instrumento
>   (ex.: NEWS2 ≥16) ficam **registrados, porém inativos** — um único gate, uma única
>   verdade.
> - **A27-2 →** política de gravidez decidida (= N-2/ADR-0028): sem documentação →
>   escora com anotação "gravidez não verificada"; gravidez **documentada** →
>   `not_evaluated` para o instrumento (não validado para gestação) — não fail-closed
>   universal.
> - **A27-3 →** care-setting gating confirmado no **mesmo locus** de enforcement do
>   gate etário — um único choke point testável.
> - **A27-4 →** os quatro carve-outs do IU-07 decididos: obstétrica → **fora** do
>   gate (instrumentos próprios); ECMO/TSR → **dentro**, com flags por componente;
>   pós-cardíaca → **dentro**, com anotação; paliativo → **dentro**, com
>   escalonamento suprimido (HAZ-0044) — nenhuma exclusão silenciosa.
> - **A27-5 →** A4 (ponto único de avaliação) **assumido para fins de design**;
>   verificação de engenharia no primeiro slice de implementação permanece pendente
>   (C6 abaixo).
> - **A27-6 →** o híbrido (Option A como choke point aplicado, lendo tags de
>   ingestão estilo Option C, hospedando metadados por instrumento estilo Option B) é
>   **adotado como emenda deste ADR**, sem necessidade de ADR novo.
> - **A27-7 →** nenhum teto de prevalência de `not_evaluated` é fixado agora; fica
>   estabelecida a **obrigação de medição e revisão em shadow mode**.
>
> **rationale:** conforme folha de decisão do ciclo 1 (GDEC-0007); fundamentos por
> linha na própria folha (`cycle-1-review-decision-sheet.md` §8).
>
> **supersessão:** rege-se pela própria seção de gatilhos de revisão desta ADR (§8) —
> nenhum gatilho adicional é criado por esta transcrição.
>
> **Nota de escopo.** Esta decisão fecha as cláusulas CLÍNICAS listadas acima. A
> ratificação formal de `AUTH-CLINSAFETY`/`AUTH-INTENDED-USE` em `authority-model.md`
> (C1), a contratação de fonte demográfica confiável (C8) e a verificação cruzada com
> o esquema do ADR-0007 (C7) permanecem OPEN e não são fechadas por esta aceitação.

### 5.1 Condições — status após a decisão de 2026-08-15 (GDEC-0007)

| # | Condição | Titular | Evidência que a fecharia | Status |
|---|---|---|---|---|
| C1 | `AUTH-CLINSAFETY` e `AUTH-INTENDED-USE` são nomeados e ratificados em `authority-model.md` §1 (Gate G0). | Gate G0 | Linhas de `authority-model.md` preenchidas com humanos nomeados, não apenas uma declaração de candidato. | **ABERTA** |
| C2 | VAL-0006 e VAL-0007 (escopo pediátrico/neonatal) são resolvidos. | `AUTH-INTENDED-USE` + `AUTH-CLINSAFETY` | Decisão registrada em `g1-validation-backlog.md` / `intended-use-statement.md` IU-06. | **PARCIALMENTE FECHADA — A27-1 fixa ≥18 produto-wide; o fechamento formal de VAL-0006/VAL-0007 no próprio documento de backlog é de titularidade daquele documento, fora do write_scope desta transcrição** |
| C3 | A(s) faixa(s) etária(s) concreta(s), por instrumento ou por fronteira de produto (§4.0), são fixadas. | `AUTH-CLINSAFETY` | Um valor DECIDED substituindo o placeholder ≥18 da IU-05, com a questão por-regra estilo NEWS2-≥16 do §4.0 explicitamente respondida. | **FECHADA — ver §5.0, GDEC-0007, 2026-08-15 (A27-1)** |
| C4 | A posição de tratamento do status de gravidez (§4.0) é decidida, não apenas argumentada. | `AUTH-CLINSAFETY` | Uma regra DECIDED, com a questão de disponibilidade de dado da H3 respondida ou explicitamente adiada com um titular e uma data. | **FECHADA — ver §5.0, GDEC-0007, 2026-08-15 (A27-2)** |
| C5 | Cada carve-out de subpopulação nomeado (§4.0) tem sua própria decisão clínica ou um adiamento explícito e datado. | `AUTH-CLINSAFETY` | Decisões registradas por carve-out; resolução de HAZ-0044/SAF-0041 especificamente para o caso paliativo. | **FECHADA — ver §5.0, GDEC-0007, 2026-08-15 (A27-4)** |
| C6 | A4 (ponto único de entrada de avaliação) é confirmada ou refutada pela arquitetura de rule-runtime. | Engenheiro de rule-runtime (sucessor da `ADR-0002`) | Evidência de arquitetura mostrando o call graph de avaliação. | **ABERTA — A27-5 autoriza presumir A4 para fins de design; a verificação de engenharia em si permanece pendente** |
| C7 | O desenho de schema de pacote da `ADR-0007` acomoda quaisquer que sejam os campos de metadado de população que a opção aceita requeira. | Autor da `ADR-0007` | Minuta de schema de pacote revisada contra os requisitos desta ADR. | **ABERTA — ADR-0007 aceita em 2026-08-15 (GDEC-0007); a checagem cruzada contra os requisitos de metadado desta ADR ainda está pendente** |
| C8 | Uma fonte demográfica confiável é contratada, ou a consequência "todo instrumento fica `not_evaluated` até lá" (§6.2) é explicitamente aceita como condição de lançamento por `AUTH-PRODUCT` + `AUTH-CLINSAFETY`. | `AUTH-DATA-PLATFORM` + `AUTH-PRODUCT` + `AUTH-CLINSAFETY` | Um contrato de fonte assinado, **ou** uma aceitação de risco registrada e datada. | **ABERTA** |

---

## 6. Consequências

Como nenhuma opção é escolhida, estas são as consequências **da existência desta ADR em
estado `proposed`**, não de nenhuma decisão.

### 6.1 Positivas

- A questão de enforcement que a HAZ-0036 levanta agora tem uma questão de arquitetura
  nomeada com opções enumeradas, em vez de existir apenas como uma linha de hazard não
  endereçada.
- Os autores do schema de pacote da `ADR-0007` e o eventual engenheiro de rule-runtime
  agora têm uma lista explícita de requisitos de metadado de população contra a qual
  desenhar, mesmo antes de uma opção ser escolhida (§4.0).
- A tensão honesta entre D1 (segurança) e D3 (custo de disponibilidade) é registrada
  explicitamente, prevenindo uma presunção implícita de que o gating é gratuito.

### 6.2 Negativas

- **Até que esta ADR seja aceita e uma fonte demográfica confiável seja contratada
  (C8), a única postura segura consistente com SAF-0035/DOM-0004 é que toda via de
  instrumento adulto fica `not_evaluated` para todo paciente**, porque nenhuma idade
  pode ser confiada de forma alguma — não apenas para pacientes fora de faixa. Esta é a
  consequência honesta e inevitável do achado de E13/E14 de que hoje não existe fonte
  confiável de idade, declarada claramente em vez de deixada implícita. **Isto deveria
  ser registrado no registro de riscos como uma consequência de disponibilidade
  bloqueante de lançamento**, distinta da própria HAZ-0036.
- Todo pacote de regras redigido antes que esta ADR se resolva e antes que o schema da
  `ADR-0007` acomode metadado de população é redigido sem um gate desenhado para
  chamar — o risco da Opção Z do §4 se aplica ao período interino independentemente de
  qual opção seja escolhida depois.

### 6.3 Neutras / estruturais

- Nada nesta ADR autoriza avaliar qualquer paciente com qualquer instrumento; o
  requisito de não-acionamento-por-default da SAF-0035 e o Gate G2/G3 permanecem
  plenamente vinculantes independentemente de qual locus de enforcement seja aceito
  depois.
- Esta ADR não decide VAL-0006/VAL-0007; ela é redigida para permanecer correta sob
  qualquer uma das resoluções (§8.2 T1).

---

## 7. Implicações transversais

Cada linha é obrigatória. Escrever `Não aplicável — <razão>` em vez de omitir uma linha.

| Dimensão | Implicação | Rótulo de evidência | Papel titular | ID de acompanhamento |
|---|---|---|---|---|
| Segurança clínica | Esta ADR é, ela mesma, a resposta arquitetural à HAZ-0036 (Unacceptable) e nomeia a HAZ-0044 como um hazard distinto e relacionado que requer seu próprio gate. Nenhuma opção fecha nenhum dos dois hazards por si só; seriam necessários aceitação mais implementação mais verificação (§9 V2, V6). | SOURCE (E6, E7) | `AUTH-CLINSAFETY` | HAZ-0036, HAZ-0044; SAF-0035, SAF-0041 |
| Segurança (security) | Qualquer que seja a opção escolhida, ela deve obter seu metadado de população do mesmo contexto autenticado e escopado por tenant que `ADR-0004`/`ADR-0016` estabelecem — uma alegação de idade ou população fornecida pelo chamador nunca deve ser confiada, espelhando a IDP-05: "o contexto de tenant é derivado do servidor, nunca afirmado pelo cliente." | INFERENCE a partir de IDP-05 (E15) | `AUTH-SECURITY` | ADR-0016 |
| Privacidade (LGPD, minimização, propósito) | Idade e status de gravidez são atributos sensíveis, adjacentes à saúde; qualquer que seja a fonte que eventualmente os forneça está sujeita à mesma disciplina de propósito-de-uso e minimização que IDP-07/IDP-11 já estabelecem para outros atributos originados na AMH. Nenhuma questão nova de base legal é levantada além do que a fronteira da `ADR-0001` e a base legal do laço clínico da IDP-07 já cobrem — esta ADR não precisa, ela mesma, de uma determinação LGPD separada, mas o eventual contrato de *fonte* (C8) precisa. | INFERENCE a partir de IDP-07 (E15) | `AUTH-PRIVACY-LEGAL` | ADR-0017 |
| Interoperabilidade | Nenhuma fonte demográfica está atualmente contratada (E13/E14); se a AMH vier a ser a fonte, isso exigiria um perfil/contrato novo ou emendado, seguindo a mesma disciplina de "verificar o formato entregue antes de tratá-lo como confiável" que a `ADR-0001` T2 aplica à Observation. | SOURCE (E13, E14) | `AUTH-DATA-PLATFORM` | ADR-0001, ADR-0013 |
| Acessibilidade | Um estado `not_evaluated` produzido por este gate deve ser renderizado com a mesma disciplina de acessibilidade que qualquer outro estado `not_evaluated` (VAL-0031/VAL-0033) — esta ADR não introduz nenhuma superfície de UI nova, mas seu volume de saída (D3) pode ser uma fração grande do que os clínicos veem, elevando a importância de acertar essa renderização. | INFERENCE | `AUTH-UX` | ADR-0021 |
| Operacional | Um gate centralizado (Opção A) se torna uma dependência operacional para toda avaliação clínica; sua disponibilidade e seu modo de falha devem ser observáveis (QAS-0023) e devem falhar em direção à negação, nunca em direção a um default permissivo. | INFERENCE a partir de DOM-0007 | `AUTH-OPERATIONS` | ADR-0020 |
| Custo | Nenhum modelo de custo existe para construir ou operar qualquer opção; não avaliado aqui. | VALIDAÇÃO NECESSÁRIA | `AUTH-PRODUCT` | pendente |
| Migração | Se a Opção B for escolhida primeiro e depois consolidada em direção à Opção A (§8.1), migração significa auditar o predicado local de todo pacote existente em busca de deriva comportamental antes da consolidação — não um simples redeploy. | INFERENCE | `AUTH-OPERATIONS` | ADR-0023 |

---

## 8. Reversibilidade, gatilhos de revisita, kill switch/rollback

### 8.1 Avaliação de reversibilidade

| Opção | Reversibilidade | O que fica encalhado na reversão | Custo de saída estimado | Rótulo |
|---|---|---|---|---|
| A — gate em runtime | **Alta** — um componente delimitado atrás de uma interface clara | A própria suíte de testes do gate e qualquer schema de metadado de pacote construído para ele (o metadado em si é reutilizável sob B ou C) | Baixo-a-moderado (§4) | INFERENCE |
| B — duplicação por regra | **Baixa** — reverter significa auditar e consolidar N predicados de autoria independente | A lógica local de gating de todo pacote e seu próprio registro de aprovação clínica para aquela lógica | Moderado-a-alto (§4) | INFERENCE |
| C — apenas tagging na ingestão | **Alta** — a tag é dado aditivo, útil sob qualquer opção | Nada estrutural; apenas a metade ausente de enforcement precisaria ser construída de qualquer forma | Baixo (§4) | INFERENCE |
| Z — adiar | **n/a** — nada a reverter, mas o hazard está ativo, não dormente, durante o adiamento | n/a | n/a | INFERENCE |

SOURCE (prompt §9.1 princípio 11): "Preferir decisões reversíveis e registrar gatilhos
de extração/revisita."

### 8.2 Gatilhos de revisita

| # | Gatilho | Como é detectado | Quem é notificado | Ação no gatilho |
|---|---|---|---|---|
| T1 | VAL-0006 ou VAL-0007 se resolve (pediátrico ou neonatal admitido ao escopo). | Registro do Gate G0/G1 | `AUTH-CLINSAFETY`, `AUTH-INTENDED-USE` | A opção escolhida por esta ADR deve ser ampliada para admitir um segundo par instrumento/faixa-etária (validado), não reutilizada silenciosamente para a nova população; reabrir C3/C5. |
| T2 | Uma fonte demográfica confiável é contratada (qualquer fonte — `Patient.birthDate` da AMH em uma versão futura do IG, ou não-AMH). | Detecção de deriva de contrato / notificação de mudança da sucessora da `ADR-0001` | `AUTH-DATA-PLATFORM`, `AUTH-CLINSAFETY` | C8 fecha; a consequência "todo instrumento `not_evaluated`" do §6.2 é levantada para quaisquer que sejam os atributos de população que a fonte de fato populate — **verificar o formato entregue antes de tratá-lo como confiável**, per a mesma disciplina que a `ADR-0001` T2 aplica à Observation da AMH. |
| T3 | A arquitetura de rule-runtime sucessora da `ADR-0002` é desenhada. | Revisão de arquitetura | Engenheiro de rule-runtime | A4 é confirmada ou refutada; se refutada (existem múltiplos pontos de entrada de avaliação independentes), a alegação de "choke point único" da Opção A deve ser reargumentada por ponto de entrada, não presumida. |
| T4 | O primeiro pacote de regras é redigido sob a `ADR-0007`. | Revisão de schema da `ADR-0007` | `AUTH-CLINSAFETY`, engenheiro de rule-runtime | Se esta ADR ainda estiver `proposed`, o pacote não pode declarar modo `actionable` per SAF-0035 sem um mecanismo de gating interino, explicitamente registrado — escalar como bloqueador, não prosseguir silenciosamente (risco da Opção Z realizado). |
| T5 | A completude medida da fonte de status de gravidez (H3) difere materialmente da completude medida da fonte de idade. | Medição de qualidade de dado uma vez que uma fonte exista | `AUTH-CLINSAFETY` | Reabrir a recomendação do §4.0; uma exceção sinalizada-não-bloqueante pode se justificar, mas apenas por meio de uma decisão clínica registrada, não uma mudança silenciosa de default. |
| T6 | HAZ-0044 (metas-de-cuidado) é resolvida com uma política de default concreta. | Registro de `hazard-log.md` / safety-case | `AUTH-CLINSAFETY` | O carve-out paliativo do §4.0 ganha um predicado concreto; o locus de enforcement desta ADR deve conseguir hospedá-lo, reconfirmando C5/C7. |

### 8.3 Estratégia de kill switch / rollback

Enquanto `proposed`, não há nada para desligar — nenhum gate foi construído. O controle
relevante é a **restrição permanente** que já se aplica independentemente desta ADR: a
SAF-0035 proíbe que qualquer via alcance o modo `actionable` antes de G2/G3, e a regra de
fallback do §3.3 de `evaluation-status-semantics.md` significa que qualquer condição não
tratada — incluindo "ainda não existe gate" — resolve para `not_evaluated`, nunca para
um escore produzido. **Nenhuma via de dano clínico depende do estado desta ADR hoje**,
desde que aquela restrição permanente seja honrada por qualquer que seja o componente
que primeiro tentar a avaliação (T4).

Na aceitação, a opção aceita deve definir seu próprio kill switch: o que acontece se o
próprio componente de gate falhar (Opção A) ou se o runtime não conseguir verificar a
conformidade por pacote (Opção B) — a direção segura de falha é inequívoca (negar, per
DOM-0004/DOM-0007), mas o mecanismo, sua detecção, e sua visibilidade para o operador não
são desenhados aqui.

---

## 9. Método de validação e evidência vinculada

| # | Alegação que esta ADR faz | Método de validação | Ambiente requerido | IDs vinculados |
|---|---|---|---|---|
| V1 | Hoje não existe fonte confiável de idade/população (E13/E14). | Reexecutar a verificação de grep/citação contra o corpus de evidência AMH e a `ADR-0004` no commit de execução; diff contra E13/E14 desta ADR. | Nenhum (acesso somente leitura ao repositório) | HAZ-0036; TST: arquitetura de testes pendente |
| V2 | O locus de enforcement escolhido impõe o invariante sem lacuna (D1). | Testes adversariais por opção aceita: para a Opção A, prova estática de call-graph mais testes negativos tentando alcançar a avaliação sem o gate; para a Opção B, testes negativos por pacote em todo pacote; para a Opção C sozinha, esta alegação não pode ser validada como verdadeira (§4, Opção C). | Ambiente de teste de rule-runtime | DOM-0004; SAF-0035; TST: arquitetura de testes pendente |
| V3 | Zero avaliações com idade desconhecida/fora de faixa produzem um status diferente de `not_evaluated` (D4). | Consulta ao corpus CRV/replay per `clinical-reference-vector-standard.md`, uma vez que A5 (um corpus consultável) exista. | Ambiente de corpus CRV/replay | QAS-0007; VAL: backlog de validação pendente |
| V4 | 100% dos pacotes de regras declaram um escopo de população (D4). | Consulta ao bundle-registry contra o schema da `ADR-0007`, uma vez que exista. | Bundle registry | ADR-0007; TST: arquitetura de testes pendente |
| V5 | A prevalência de `not_evaluated` proveniente do gating populacional é medida e reportada, não apenas produzida (D3). | Instrumentação QAS-0007 sobre a saída do gate. | Ambiente similar-a-produção | QAS-0007; QAS-0023 |
| V6 | O carve-out paliativo/metas-de-cuidado (§4.0) é distinto do gate populacional da HAZ-0036, e não o absorve silenciosamente. | Testes de cenário distinguindo razões de negação "fora-de-população" de razões de negação/supressão "restrição de metas-de-cuidado". | Ambiente de teste (dado sintético) | HAZ-0036; HAZ-0044; SAF-0041 |
| V7 | Toda decisão de gate (admitir ou negar) é um registro durável, explicável e auditável (D7). | Verificação de completude de auditoria per SAF-0019/SAF-0023, espelhando o padrão da IDP-11 "toda negação é contabilizada, registrada em log, observável". | Ambiente de teste | SAF-0019; SAF-0023; QAS-0019 |

**Disciplina de placeholder.** Nenhum ID `REQ`, `TST`, ou `VAL` foi inventado neste
documento além do que é citado de catálogos existentes; onde ainda não existe entrada de
catálogo, o placeholder verbatim é usado.

---

## 10. Relações de supersessão

- **Supersede:** nenhuma.
- **Superseded by:** nenhuma.
- **Notas de relação:** se VAL-0006/VAL-0007 admitirem uma população pediátrica ou
  neonatal com seu próprio instrumento validado, isso **não** é uma supersessão desta
  ADR — o invariante de enforcement (§1) e a decisão de locus de enforcement (§4/§5,
  uma vez tomada) são redigidos para se estender a um segundo par
  instrumento-validado/faixa-etária via novo metadado de pacote (T1), não para serem
  redecididos. Uma supersessão seria necessária apenas se o próprio *locus* de
  enforcement escolhido precisasse mudar (por exemplo, Opção B escolhida inicialmente,
  depois substituída arquiteturalmente pela Opção A) — isso seria uma ADR nova que
  supersede esta, não uma edição de uma decisão aceita. A relação desta ADR com a
  `ADR-0008` (semântica de status de avaliação, redigida concomitantemente) é
  **cross-referencial, não hierárquica**: esta ADR consome `not_evaluated` conforme
  definido pela matéria da `ADR-0008` e não acrescenta nenhum valor de status
  concorrente; a `ADR-0008`, por sua vez, deveria citar o §4 desta ADR como o exemplo
  trabalhado de uma condição de entrada de `not_evaluated` (escopo de população) que
  ela não precisa rederivar.

---

## 11. Checklist de completude (gate do revisor)

- [x] O ID estável corresponde ao nome do arquivo (`ADR-0027-age-and-population-gating-enforcement.md`)
- [x] O status é um dos valores permitidos (`accepted (2026-08-15, GDEC-0007)`) — **ainda
      não reconciliado contra `adr-index.md`, que lista "próximo ID livre: ADR-0025" na
      sua última atualização; o `write_scope` desta tarefa exclui explicitamente editar
      `adr-index.md`. Reconciliar a faixa de alocação concorrente `ADR-0025`–`ADR-0028`
      é deixado ao titular de rastreabilidade, per o mesmo precedente de cautela de
      numeração que `g1-validation-backlog.md` registra para IDs `VAL` alocados
      concorrentemente.**
- [x] Titular, aprovadores, prazo de decisão presentes (apenas placeholders; nenhum nome
      inventado)
- [x] O autor não está listado como aprovador; pares de independência verificados
      (front matter)
- [x] O contexto (§1) declara uma *pergunta* de decisão com uma fronteira de escopo
      explícita
- [x] Toda declaração material carrega um rótulo de evidência
- [x] A tabela de evidências (§2.1) distingue SOURCE/INFERENCE; nenhum OBSERVED alegado
      para artefatos que esta ADR não verificou ela mesma
- [x] As premissas (§2.2) têm cada uma uma condição de invalidação e um titular
- [x] Três alternativas totalmente analisadas (A, B, C) mais adiar (Z) — excede o mínimo
      de ≥2
- [x] Toda alternativa tem tanto consequências positivas quanto negativas
- [x] Os direcionadores (§3) são discriminantes e mapeiam para atributos de qualidade
      mensuráveis, ou registram honestamente "nenhum cenário ainda"
- [x] Nenhuma meta numérica inventada; tanto o ≥18 da IU-05 quanto o ≥16 do NEWS2 são
      citados como valores de outras partes, nunca propostos aqui como números novos
- [x] Todas as oito linhas de implicação transversal presentes (§7)
- [x] Reversibilidade, gatilhos de revisita, kill/rollback presentes (§8)
- [x] Método de validação com IDs HAZ/SAF/QAS/TST/VAL vinculados (ou honestamente
      placeheld) (§9)
- [x] Campos de supersessão presentes (§10)
- [x] Nenhuma tecnologia escolhida por herança do legado ou da AMH — esta ADR propõe um
      padrão arquitetural (um gate), não um produto ou fornecedor
- [ ] `adr-index.md` atualizado na mesma mudança — **deliberadamente não feito; excluído
      pelo `write_scope` desta tarefa, que restringe as mudanças apenas a este arquivo**

### 11.1 Questões abertas para o revisor (numeradas)

> **RESOLVIDA — 2026-08-15, GDEC-0007.** As sete questões abaixo foram respondidas
> pela autoridade nomeada na revisão do ciclo 1: 1→A27-1 (≥18 produto-wide governa;
> pisos por instrumento registrados, inativos); 2→A27-2 (fail-closed apenas quando a
> gravidez é documentada e não validada para o instrumento; anotada, não bloqueada,
> quando não documentada); 3→A27-3 (confirmada — mesmo locus); 4→A27-4 (disposições
> por carve-out fixadas); 5→A27-5 (presumida para fins de design; verificação de
> engenharia pendente); 6→A27-6 (híbrido adotado como emenda, sem ADR nova); 7→A27-7
> (nenhum teto agora; medição + revisão em shadow mode obrigatórias). Ver §5.0 para o
> registro formal. Texto original preservado abaixo como registro histórico das
> questões colocadas.

1. A fronteira de população *produto-wide* (IU-05, placeholder ≥18) ou a faixa validada
   *por instrumento* (por exemplo, o ≥16 do NEWS2, §4.0) é autoritativa quando
   diferem, para um paciente dentro de uma faixa mas fora da outra?
2. O status de gravidez desconhecido é fail-closed (PROPOSAL desta ADR, §4.0) ou
   sinalizado-não-bloqueante, e a resposta depende de medir a completude da fonte de
   status de gravidez separadamente da completude da fonte de idade (H3)?
3. O gating de care-setting (§4.0) é afirmado como sendo "estruturalmente o mesmo
   problema" que o gating de idade e presumido a compartilhar um locus de enforcement —
   deveria compartilhar, ou step-down/enfermaria/RRT (IU-04a–c) justificam um mecanismo
   materialmente diferente uma vez que esses settings sejam decididos?
4. Para cada um dos quatro carve-outs de subpopulação da IU-07 (gravidez, ECMO/CRRT,
   pós-cirúrgica cardíaca, paliativo/metas-de-cuidado, §4.0): em escopo, excluído, ou
   sinalizado-com-ressalva para a V1 — e por qual evidência?
5. A4 (um único ponto de entrada de avaliação) se sustenta para a arquitetura de
   rule-runtime pretendida, ou a alegação de "choke point único" da Opção A deve ser
   reargumentada por ponto de entrada?
6. O híbrido observado ao final do §4.1 (Opção A como choke point imposto, lendo tags de
   ingestão estilo Opção C, hospedando metadado por instrumento estilo Opção B)
   deveria ser analisado como sua própria opção antes da aceitação, em vez de deixado
   como nota de rodapé?
7. Qual é o teto aceitável de prevalência de `not_evaluated` (D3) antes que "seguro mas
   clinicamente inútil" se torne seu próprio julgamento de produto/segurança, e quem
   fixa esse teto — `AUTH-CLINSAFETY` sozinha, ou em conjunto com `AUTH-PRODUCT`?
