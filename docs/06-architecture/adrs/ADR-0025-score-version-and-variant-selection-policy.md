---
id: ADR-0025
title: >
  Política de seleção de versão/variante de escore clínico (NEWS2, MEWS, SOFA, qSOFA) e
  vigilância de atualização de edição
status: accepted (2026-08-15, GDEC-0007)
status_history:
  - status: proposed
    date: 2026-08-15
    by: especialista redator de ADR de seleção de versão/variante de escore (ciclo 1, Task 4)
    note: >
      Primeira redação, derivada das quatro revisões forenses de escore do ciclo 1 (Task 1):
      news2-review.md, mews-review.md, shared-findings.md, sofa-review.md e qsofa-review.md.
      Nenhuma decisão registrada. Toda cláusula clínica é PROPOSAL — AWAITING NAMED CLINICAL
      REVIEW (revisor: rodaquino-OMNI, GDEC-0003). Este ADR não recebeu ID reservado prévio
      em `adr-index.md` (a tarefa que o originou restringe `write_scope` a este único
      arquivo); ver aviso de proveniência abaixo.
  - status: accepted (2026-08-15, GDEC-0007)
    date: 2026-08-15
    by: rodaquino-OMNI (revisor clínico nomeado, GDEC-0003) — transcrito pelo orquestrador clínico do ciclo 1 (escriba)
    note: >
      Decisão por escrito, em sessão, do titular nomeado, registrada em
      decision-register.md GDEC-0007 (folha de decisão do ciclo 1, §7, linhas A25-1 a
      A25-7). As quatro linhas de edição canônica de §5.1 são ratificadas; MEWS/NEWS2
      assumido SUPERSEDE dormente; qSOFA GCS<15; restrição SSC-2021 vinculante. Ver §5.0.
date: 2026-08-15
owner: >
  rodaquino-OMNI — revisor clínico nomeado do ciclo 1 e aprovador de conteúdo clínico
  (GDEC-0003); candidato a titular de AUTH-CLINSAFETY. Este campo cita uma decisão DECIDED
  já registrada (GDEC-0003), não inventa uma aprovação — ver E1 abaixo.
approvers:
  - >
    rodaquino-OMNI — AUTH-CLINSAFETY (candidato, papel aceito para artefatos clínicos do
    ciclo 1 por GDEC-0003) — ratifica o conteúdo clínico: edições canônicas, regra de
    variante, uso normativo restrito de qSOFA.
  - UNASSIGNED — VALIDATION REQUIRED — AUTH-PRODUCT (ratificação arquitetural do ADR em si,
    per decision-rights.md §2 linha "Architecture decisions (ADR ratification)")
decision_deadline: >
  UNSET — VALIDATION REQUIRED. Não há uma data-calendário. Esta política é um insumo
  bloqueante para: (a) qualquer bundle de regras (ADR-0007, ainda not-started) que cite uma
  edição de NEWS2/MEWS/SOFA/qSOFA; (b) a decisão de portfólio do Gate G2 sobre reter ou
  substituir (SUPERSEDE) MEWS por NEWS2 (CAND-0001/CAND-0002); (c) os campos de citação da
  especificação de escore da Task 2 do ciclo 1 (`docs/05-clinical-safety/rule-releases/
  <escore>/specification.md`, em redação concorrente — ver §1).
deciding_authority_rule: >
  docs/00-governance/decision-rights.md §2, duas linhas aplicáveis: "Clinical rule content
  ratification" (decisor: AUTH-CLINSAFETY — decide QUAIS edições são citáveis e a regra de
  variante, que é conteúdo clínico, não arquitetura de sistema) e "Architecture decisions
  (ADR ratification)" (decisor: AUTH-PRODUCT + titular de domínio pertinente — ratifica este
  documento como artefato do programa de ADRs). GDEC-0003
  (`docs/00-governance/registers/decision-register.md`) já nomeia rodaquino-OMNI como
  candidato a AUTH-CLINSAFETY para artefatos clínicos do ciclo 1; AUTH-PRODUCT permanece
  UNASSIGNED.
independence_check: >
  decision-rights.md §3, par 1: "autor da regra" deve ser independente do "aprovador
  clínico". O autor deste ADR é um agente (esta especialidade); não é aprovador de nada
  aqui — nenhum agente pode escrever `accepted`. rodaquino-OMNI é, simultaneamente, o
  revisor nomeado das cinco revisões forenses citadas como evidência em §2.1 e o candidato
  aprovador clínico deste ADR; isso é consistente com GDEC-0003, que já lhe atribuiu ambos
  os papéis para o ciclo 1, e não constitui um par de independência violado (o par restringe
  agente-preparador vs. humano-aprovador, não dois papéis do mesmo humano aprovador). A
  concentração de autoridade correspondente já está registrada em `ADR-0004` §11.2 e deve
  ser lida em conjunto com este documento — não é repetida aqui como um risco novo.
links:
  drivers:
    domain_invariants: [DOM-0002, DOM-0003, DOM-0008]
    quality_scenarios: [QAS-0011, QAS-0013, QAS-0025]
    risks: ["pending risk register IDs — ver docs/00-governance/registers/risk-register.md"]
  constrains:
    requirements: ["REQ: pendente de catálogo de requisitos (docs/04-product-requirements ainda não existe)"]
    clinical: ["CLR: pendente do portfólio de vias clínicas (Gate G2)"]
    safety: [SAF-0001, SAF-0002, SAF-0003, SAF-0020]
  hazards: [HAZ-0005, HAZ-0019, HAZ-0020, HAZ-0032, HAZ-0036, HAZ-0043]
  tests: ["TST: pending test architecture"]
  validations: ["VAL: pending validation backlog"]
  adrs:
    depends_on: []
    feeds: []
  gates: [G2, G6]
  evidence:
    - docs/05-clinical-safety/legacy-review/ews/news2-review.md
    - docs/05-clinical-safety/legacy-review/ews/mews-review.md
    - docs/05-clinical-safety/legacy-review/ews/shared-findings.md
    - docs/05-clinical-safety/legacy-review/sepsis-scores/sofa-review.md
    - docs/05-clinical-safety/legacy-review/sepsis-scores/qsofa-review.md
    - docs/05-clinical-safety/pathway-portfolio/candidate-inventory.md
    - docs/05-clinical-safety/rule-releases/sofa/logic.yaml
supersedes: null
superseded_by: null
provenance:
  source_repo: intensicare-V2
  path_or_url: docs/06-architecture/adrs/ADR-0025-score-version-and-variant-selection-policy.md
  commit_sha_or_version: ddac9bce19e7fb40f145ed892724f3d0ebdfaa1e (HEAD do repositório na redação; branch cycle-1/clinical-content; este arquivo é novo/não commitado)
  section_or_lines: >
    docs/06-architecture/adrs/ADR-template.md (conformidade integral); ADR-0001 (exemplar
    de estrutura); docs/00-governance/evidence-notation.md §5; as cinco revisões forenses
    listadas em `links.evidence` acima, integralmente
  date_collected: 2026-08-15
  collector: especialista redator de ADR de seleção de versão/variante de escore (ciclo 1, Task 4)
  transformation: >
    síntese arquitetural — nenhuma nova verificação de fonte primária (RCP 2017, Subbe 2001,
    Vincent 1996, Singer 2016, SSC 2021) foi realizada por este documento. Toda verificação
    primária é citada das cinco revisões forenses listadas acima e rotulada SOURCE aqui, não
    OBSERVED, per evidence-notation.md §2 ("citar a verificação de outro especialista é
    SOURCE, não OBSERVED — só o agente que verificou pode escrever OBSERVED").
  confidence: medium
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
---

# ADR-0025 — Política de seleção de versão/variante de escore clínico e vigilância de atualização de edição

> **Status: `accepted (2026-08-15, GDEC-0007)`.** O revisor clínico nomeado
> (rodaquino-OMNI, GDEC-0003) decidiu, por escrito, em sessão de 2026-08-15
> (transcrição-mestre: `decision-register.md` GDEC-0007), a tabela de edição canônica
> de §5.1, a regra de seleção de variante de §5.2 e o desenho de vigilância de §5.3
> como decisão — ver §5.0 para o registro por questão (A25-1 a A25-7). Condições
> não clínicas (verificação da Table 1 de Subbe 2001, ativação do metodologista de
> evidência, atualização de `adr-index.md`) permanecem `VALIDATION REQUIRED` /
> pendentes e não são fechadas por esta aceitação.

> **Aviso de proveniência e de escopo de escrita, dito uma vez, válido para todo o
> documento.** Esta tarefa restringe `write_scope` estritamente a este arquivo. O passo 5
> do `ADR-template.md` ("Atualizar `adr-index.md` na mesma mudança: status, dependências,
> gate bloqueante") **não foi executado** — não por descuido, mas porque a tarefa que
> originou este ADR proíbe explicitamente tocar `adr-index.md` ou qualquer outro arquivo.
> `adr-index.md` §7 item 4 já registra que "vinte e uma tópicos não têm rascunho" e que
> novos IDs a partir de `ADR-0025` estão livres para uso; este documento consome o próximo
> ID livre declarado ali (`ADR-0025`) mas **não** registra sua própria existência no índice.
> **Isso é uma dívida de handoff explícita**, não uma decisão sobre o índice: o
> ADR-program engineer (ou quem detiver esse papel) deve adicionar uma linha para
> `ADR-0025` em `adr-index.md` §3/§6 e no grafo de dependências §4 na próxima mudança que
> tiver esse arquivo em seu `write_scope`. Nenhuma alegação de completude do programa de
> ADRs pode contar este documento até que essa atualização ocorra.

> **Política de idioma.** Redigido em português (pt-BR) per `DEC-G0-10`
> (`docs/00-governance/registers/g0-resolucoes-2026-08-15.md`): "Todo material produzido a
> partir de 2026-08-15 será redigido em português (pt-BR)". `ADR-0004` é o precedente pt-BR
> para este programa de ADRs.

---

## 1. Contexto e problema

INFERENCE, a partir de §2 abaixo: as cinco revisões forenses do ciclo 1 (Task 1) que
examinaram byte a byte o V1 legado encontraram um padrão recorrente que atravessa os
quatro escores — NEWS2, MEWS, SOFA e qSOFA: (a) um identificador de versão em código
(`algorithm_version = "NEWS2-v3.0.0"`, `"MEWS-v3.0.0"`, `"SOFA-v2.0.0"`) que **não
identifica o comportamento real** — o comportamento da Scale-2 do NEWS2 foi invertido sem
mudar a string de versão (news2-review.md §3, "version-identity finding"; shared-findings.md
SF-2); (b) limiares institucionais citados sob o nome de uma fonte primária que na
verdade não os contém — os cortes MEWS watch=3/urgent=4 são atribuídos a Subbe 2001, mas o
abstract verificado da fonte só sustenta "≥5" (mews-review.md M-4); e (c) uma tabela
primária (Subbe 2001, Table 1) que nunca foi verificada célula a célula porque está atrás
de paywall — a comparação usada é a transcrição mais citada, rotulada INFERENCE +
VALIDATION REQUIRED, não SOURCE (mews-review.md §2.3). SF-2 conclui, para o portfólio
inteiro: *"nenhuma ratificação legada pode ser herdada; toda tabela de bandas e todo limiar
que entrar na V2 requer ratificação nova por uma autoridade clínica nomeada"*.

Ao mesmo tempo, a Task 2 do ciclo 1 já está em redação concorrente
(`docs/05-clinical-safety/rule-releases/sofa/logic.yaml`, visto neste commit) e seu próprio
cabeçalho de proveniência já assume uma citação — "re-derived from Vincent 1996
(doi:10.1007/BF01709751) and Singer 2016 Sepsis-3 (doi:10.1001/jama.2016.0287)" — sem que
exista, em nenhum lugar do repositório, um documento arquitetural que **fixe** essa
citação como política ou que defina o que aconteceria se um especialista diferente citasse
uma edição diferente para o mesmo escore. Esse é exatamente o vácuo que este ADR fecha.

**Pergunta.** Qual é a política da IntensiCare V2 para (i) selecionar a edição canônica de
cada escore de portfólio candidato (NEWS2, MEWS, SOFA, qSOFA); (ii) distinguir uma
*variante declarada* de uma *alteração silenciosa* da mesma edição; e (iii) vigiar,
detectar e responder à publicação de uma nova edição pelo emissor?

**Fora de escopo** (cada um nomeado para não se confundir com este ADR):

- **Se** algum desses escores é admitido no portfólio clínico da V2 — decisão do **Gate
  G2**, não desta ADR. Este documento assume, sem decidir, que ao menos um dos quatro
  candidatos (`CAND-0001`..`CAND-0004`) pode ser admitido, e escreve uma política que se
  aplica igualmente se nenhum for.
- **Os valores numéricos exatos de banda/limiar** de qualquer escore — esses vivem na
  especificação V2 do próprio escore (`docs/05-clinical-safety/rule-releases/<escore>/
  specification.md`, Task 2) e no bundle de regra assinado que a implementa (**ADR-0007**,
  `not-started`). Este ADR fixa **qual edição** é citável e **como** uma variante se
  declara — não recomputa nem ratifica nenhuma banda.
- **O formato do bundle de regra, sua assinatura, ativação, rollback e retirada** —
  **ADR-0007** (`not-started`, `adr-index.md` §3). Este ADR consome a garantia de
  imutabilidade de bundle que ADR-0007 promete definir mecanicamente (SAF-0020) como uma
  restrição já vinculante hoje via `safety-requirements.md`, não a redefine.
- **A semântica de status de avaliação, completude e frescor por entrada** —
  **ADR-0008** (`not-started`). Este ADR não define o que acontece quando uma entrada de
  um escore falta ou está obsoleta; isso é orçamento de outro documento.
- **A força/grau da evidência clínica de cada escore candidato** — tarefa do
  **metodologista de evidência clínica**, explicitamente vedada a outros especialistas
  (`portfolio-method.md` C4: "explicitamente *não* este especialista"). Este ADR cita o que
  as revisões forenses já verificaram sobre a fonte primária (existe/não existe, é
  acessível/paywalled); não gradua a força daquela evidência para fins de portfólio.
- **Se um instrumento regulatório brasileiro** (ANVISA, resolução do CFM, Ministério da
  Saúde) exige uma edição específica de escore de alerta precoce — nenhum foi localizado na
  base de evidência deste repositório (E14 abaixo); esta ADR não afirma nem exclui a
  existência de tal instrumento, apenas registra que sua descoberta é um gatilho de
  revisão (§8.2, T6).

---

## 2. Evidência e premissas

### 2.1 Evidência

**Nota epistêmica única, válida para toda a tabela.** Este ADR **não reverificou** nenhuma
fonte primária (RCP 2017, Subbe 2001, Vincent 1996, Singer 2016, SSC 2021). Toda linha
abaixo cita uma das cinco revisões forenses do ciclo 1, que registraram suas próprias
verificações `OBSERVED`/`SOURCE` em disco. Per `evidence-notation.md` §2, só o agente que
verificou a fonte primária pode rotular `OBSERVED`; citar a verificação de outro
especialista é `SOURCE`.

| # | Rótulo | Afirmação | Fonte | Confiança |
|---|---|---|---|---|
| E1 | SOURCE | NEWS2 2017 (Royal College of Physicians) foi verificado a partir do PDF do próprio emissor (`rcp.ac.uk/media/a4ibkkbf/news2-final-report_0_0.pdf`, páginas 29-31 e 35), incluindo as sete bandas de parâmetro, os cortes agregados 5/7 e o quarto nível "red score" (parâmetro único = 3). | `news2-review.md` §2 | alta |
| E2 | SOURCE | A "clarificação de dezembro de 2022" do NEWS2 **NÃO foi verificada** — as páginas de recursos do próprio RCP, consultadas em 2026-08-15, mostram uma edição especial de *Clinical Medicine* de novembro de 2022, não um documento de clarificação de dezembro; nenhuma afirmação dela foi usada na revisão. | `news2-review.md` §2 (linhas finais); `shared-findings.md` SF-9 item 1 | alta |
| E3 | SOURCE | O V1 legado seedou/ratificou `NEWS2-v3.0.0` como "supplemental O₂ auto-ativa Scale 2", depois o código inverteu esse comportamento **sem mudar a string de versão** — `algorithm_version` persistido não identifica o algoritmo que de fato rodou. `RAT-NEWS2-SCALE-2` está ausente da tabela aprovada de `CLINICAL_SIGNOFF.md`. | `news2-review.md` §3 ("version-identity finding"); `shared-findings.md` SF-2 | alta |
| E4 | SOURCE | O MEWS do V1 legado é identificado como a variante **Subbe CP, Kruger M, Rutherford P, Gemmel L. QJM 2001;94(10):521-526** (DOI `10.1093/qjmed/94.10.521`), pelo conjunto de cinco parâmetros (PAS, FC, FR, temperatura, AVPU) — sem débito urinário, o que exclui variantes ao estilo Stenhouse. | `mews-review.md` §2 itens 1-2 | alta |
| E5 | SOURCE | A **Table 1** do Subbe 2001 (as bandas por parâmetro) está atrás de paywall e **não foi recuperável** a partir da fonte primária no momento da revisão; a tabela usada para comparação é a transcrição mais citada do MEWS, rotulada explicitamente **INFERENCE + VALIDATION REQUIRED**, não SOURCE. É uma precondição bloqueante antes que qualquer especificação V2 cite essas bandas como SOURCE. | `mews-review.md` §2 item 3, §6; `shared-findings.md` SF-9 item 2 | alta (quanto à lacuna); a comparação em si é confiança **média** |
| E6 | SOURCE | Os limiares de escalonamento MEWS implementados (`watch=3, urgent=4`) são atribuídos a Subbe no código-fonte legado, mas o abstract verificado da fonte primária só sustenta "**≥5**" como o limiar de associação a desfecho — não há "≥4" nem "≥3" na fonte primária. Direção conservadora (alerta mais cedo), mas a alegação de proveniência é falsa. | `mews-review.md` M-4 | alta |
| E7 | SOURCE | **Vincent JL et al. 1996** (*Intensive Care Medicine* 22(7):707-710) foi verificado contra o registro da editora e contra a renderização secundária PMC6880479 (Lambden S et al., *Crit Care* 2019); a tabela definidora cobre respiração (PaO2/FiO2), coagulação (plaquetas), fígado (bilirrubina), cardiovascular (PAM + vasopressor, doses em µg/kg/min por ≥1h), neurológico (GCS) e renal (creatinina **ou** débito urinário). | `sofa-review.md` §3 | alta |
| E8 | SOURCE | **Singer M et al. 2016** (Sepsis-3, *JAMA* 315(8):801-810) opera o SOFA como critério diagnóstico — "aumento agudo do escore SOFA total ≥2 pontos consequente à infecção", com "SOFA basal … assumido como zero em pacientes sem disfunção orgânica pré-existente conhecida" — um elemento que **não** está em Vincent 1996; é uma camada de operacionalização de Sepsis-3 sobre a tabela de componentes de Vincent 1996. | `sofa-review.md` §3 | alta |
| E9 | SOURCE | O banding de risco de mortalidade do SOFA implementado no V1 (`<=6 baixo, <=9 moderado, <=12 alto, senão muito_alto`, com percentuais no docstring) **não está em Vincent 1996**, é internamente inconsistente com suas próprias faixas citadas, e não tem nenhuma citação no código. | `sofa-review.md` §2 ("mortality-risk banding"), D-18 | alta |
| E10 | SOURCE | **Singer M et al. 2016** também define qSOFA — "frequência respiratória ≥22/min, alteração da mentalidade, ou pressão arterial sistólica ≤100 mmHg", positivo em ≥2 de 3, verbatim verificado; a implementação legada acerta exatamente os três cortes e o limiar 2-de-3. A operacionalização de "alteração da mentalidade" usada pelo grupo de força-tarefa foi GCS≤13 na coorte de derivação, mas o texto publicado generaliza para "qualquer GCS <15" — uma ambiguidade que a V2 precisa escolher e citar explicitamente. | `qsofa-review.md` §3, Q-01..Q-04 | alta |
| E11 | SOURCE | A **Surviving Sepsis Campaign 2021** (Evans L et al., *Crit Care Med* 2021;49(11):e1063-e1143) emite recomendação **forte, evidência de qualidade moderada**, **contra** usar qSOFA isoladamente — comparado a SIRS, NEWS ou MEWS — como ferramenta única de triagem para sepse/choque séptico. | `qsofa-review.md` §6, citação verbatim | alta |
| E12 | SOURCE | Strings de versão não identificam comportamento em nenhum dos quatro escores revisados; toda alegação "RAT-*"/"CLINICALLY RATIFIED" do V1 legado remete a uma autoridade de "delegação do dono do repositório", não a um aprovador clínico nomeado e verificável — inválida per `evidence-notation.md` §2 regra 3. | `shared-findings.md` SF-2; `sofa-review.md` D-19; `qsofa-review.md` §6 item 2 | alta |
| E13 | SOURCE | `CAND-0001` (NEWS2) e `CAND-0002` (MEWS) têm sobreposição **"VERY HIGH"** — quatro dos cinco insumos do MEWS também são insumos do NEWS2 — e o inventário de portfólio nomeia esse par como "o caso mais claro do inventário" para o passo "remover-um-e-reconferir" de `PROMPT:326`. A revisão forense do MEWS já antecipa que, se o portfólio remover MEWS, a classificação terminal correta é **SUPERSEDE** (pela via NEWS2), não REJECT. | `candidate-inventory.md`, linha CAND-0002, §3 "Overlap"; `mews-review.md` §6 | alta |
| E14 | SOURCE | Nenhum instrumento regulatório brasileiro (ANVISA, resolução do CFM, Ministério da Saúde, COFEN) exigindo uma edição específica de escore de alerta precoce foi localizado em nenhum documento deste repositório na data de coleta (busca textual, 2026-08-15, sobre `docs/`). Ausência de evidência não é evidência de ausência — **VALIDATION REQUIRED** antes que este ADR afirme ou exclua tal mandato. | busca própria deste documento sobre `docs/**` (2026-08-15) | média (busca textual, não uma consulta jurídica) |
| E15 | SOURCE | Toda liberação de lógica clínica DEVE ser um bundle imutável, versionado e assinado, cujo conteúdo é verificado no carregamento; conteúdo não assinado, não verificável ou não aprovado DEVE falhar ao carregar. `ADR-0007` (`Rule bundle format, signing, approval, activation, rollback, retirement`) é o ADR designado para essa mecânica e está `not-started`. | `safety-requirements.md` SAF-0020; `adr-index.md` §3 linha ADR-0007 | alta |
| E16 | SOURCE | A especificação V2 do SOFA já em redação concorrente (`rule-releases/sofa/logic.yaml`, `RULE-SOFA v0.1.0`) já assume, em seu próprio cabeçalho de proveniência, "re-derived from Vincent 1996 (doi:10.1007/BF01709751) and Singer 2016 Sepsis-3 (doi:10.1001/jama.2016.0287); never copied from the legacy repository" — corroboração independente, do lado da Task 2, da mesma dupla-citação proposta em §5 deste ADR (E7/E8), sem que qualquer política arquitetural tivesse fixado isso antes. | `docs/05-clinical-safety/rule-releases/sofa/logic.yaml`, cabeçalho | alta |
| E17 | INFERENCE | Nenhuma ferramenta de vigilância de atualização de diretriz (assinatura de feed do emissor, changelog automatizado, alerta de nova edição) existe hoje neste repositório — INFERÊNCIA da ausência de qualquer artefato correspondente sob `docs/` ou `scripts/` (busca própria, 2026-08-15). O desenho de vigilância em §5.3 é, portanto, item de backlog, não ferramenta existente. | ausência observada sob `docs/`, `scripts/` (2026-08-15) | média |

### 2.2 Premissas

Cada premissa deve ser arquivada em `assumptions-register.md` com um ID `ASM-xxxx`; este
ADR não cunha esse ID (é catálogo de outro especialista, `traceability-policy.md` §2 regra 4).

| # | Premissa | Por que é necessária | O que a invalida | Dono | Status no registro |
|---|---|---|---|---|---|
| A1 | A decisão de portfólio do Gate G2 sobre `CAND-0001`(NEWS2)/`CAND-0002`(MEWS) resolverá se MEWS é retido, e nesse caso sua edição canônica (Subbe 2001) só passa a valer operacionalmente após essa decisão. | A linha "MEWS" da tabela canônica em §5 é condicional a essa decisão de portfólio, não independente dela. | Gate G2 decidir manter os dois escores lado a lado, ou nenhum dos dois. | UNASSIGNED — VALIDATION REQUIRED | a arquivar |
| A2 | A verificação célula a célula da Table 1 de Subbe 2001 (E5) será concluída antes que qualquer bundle de regra V2 cite Subbe 2001 como `SOURCE` para as bandas por parâmetro. | Sem isso, uma citação "SOURCE: Subbe 2001" para as bandas numéricas seria uma alegação não verificada disfarçada de verificada — exatamente o erro que este ADR existe para impedir. | A obtenção do artigo original e sua verificação célula a célula. | UNASSIGNED — VALIDATION REQUIRED | a arquivar |
| A3 | Um papel de metodologista de evidência clínica, distinto do autor deste ADR e do aprovador clínico, será ativado para graduar a força da evidência por escore candidato antes da admissão em portfólio. | `portfolio-method.md` C4 proíbe outros especialistas de graduar evidência; este ADR consome esse resultado, não o produz. | O papel nunca ser ativado — nesse caso a graduação de evidência permanece `VALIDATION REQUIRED` indefinidamente. | UNASSIGNED — VALIDATION REQUIRED | a arquivar |
| A4 | `ADR-0007` definirá o mecanismo de bundle (formato, assinatura, versionamento) contra o qual a regra "novo ID de regra, nunca edição silenciosa" (§5.2) será tecnicamente aplicada. | Sem `ADR-0007`, a regra de §5.2 é uma restrição de processo sem mecanismo de aplicação automatizado — permanece dependente de revisão humana apenas. | `ADR-0007` ser aceito com um modelo incompatível com "novo ID por variante". | UNASSIGNED — VALIDATION REQUIRED | a arquivar |
| A5 | Nenhum instrumento regulatório brasileiro hoje mandata uma edição específica; isso pode mudar. | Drive a Opção A (fixar edições agora) versus o risco de precisar revisitar por mandato externo. | Descoberta de um instrumento regulatório brasileiro vigente (ANVISA/CFM/Ministério da Saúde) que mandate uma edição — ver T6. | UNASSIGNED — VALIDATION REQUIRED | a arquivar |
| A6 | O RCP não publicou, até a data de coleta, uma "clarificação de dezembro de 2022" que altere o conteúdo normativo do NEWS2 2017. | Se existisse e alterasse bandas/cortes, a linha NEWS2 de §5 mudaria. | A localização de tal documento nas páginas oficiais do RCP, com conteúdo normativo verificável. | UNASSIGNED — VALIDATION REQUIRED | a arquivar |

### 2.3 Hipóteses a testar

| # | Hipótese | Como seria testada | Quem testa | Status atual |
|---|---|---|---|---|
| H1 | Fixar uma edição canônica por escore nesta ADR (Opção A) reduz a zero as variantes institucionais não declaradas, medido como 100% das regras ativas citando uma edição verificável de fonte primária. | Auditoria automatizada de todo bundle de regra ativo contra o campo de citação exigido; contagem de regras sem citação verificável (deve ser zero). | Metodologista de evidência clínica + engenheiro de runtime de regra determinístico (verificador independente) | NÃO TESTADA |
| H2 | Delegar a citação de edição inteiramente a cada pacote de release (Opção B), sem registro canônico central, alcança auditabilidade equivalente com menor custo de manutenção central. | Comparar, ao longo de N releases, a taxa de discrepância de citação entre pacotes sob Opção A vs. simulação de Opção B. | Não testável sem um histórico de releases que ainda não existe | NÃO TESTADA — e a comparação em §4 já indica por que esta hipótese é fraca |
| H3 | O par NEWS2/MEWS será resolvido pelo Gate G2 como SUPERSEDE (MEWS retirado a favor de NEWS2), tornando a linha "MEWS" desta política transitória. | Decisão de portfólio do Gate G2, informada por `candidate-inventory.md` CAND-0002 e pela análise de sobreposição "remover-um-e-reconferir". | `AUTH-PRODUCT` + `AUTH-CLINSAFETY` (decisão de portfólio) | NÃO TESTADA — E13 é o insumo, não a decisão |

---

## 3. Drivers de decisão e atributos de qualidade mensuráveis

Alvos são `VALIDATION REQUIRED` — per o template, nenhum alvo numérico é inventado antes do
Gate G1 validar necessidades reais.

| # | Driver | Por que discrimina entre as opções | Atributo de qualidade mensurável | Alvo |
|---|---|---|---|---|
| D1 | **Rastreabilidade de proveniência clínica** — toda regra ativa cita uma edição de fonte primária verificável, não uma string de versão opaca (E3, E12) | Opções diferem em quão central e obrigatória é a citação; a Opção C (sempre-a-mais-recente) tende a maximizar atualidade às custas desta rastreabilidade se a citação não for travada junto com a mudança | QAS-0025 (conformidade a padrões com evidência — "conformidade demonstrada por testes executados contra versões fixadas de perfil"; aqui aplicado por analogia a citação de edição de escore, não a perfil FHIR) | VALIDATION REQUIRED |
| D2 | **Tempestividade da vigilância de atualização** — tempo entre a publicação de uma nova edição pelo emissor e sua avaliação por um revisor nomeado | Opções diferem em quem monitora o quê e com que cadência; a Opção Z (adiar) não tem vigilância nenhuma até ser retomada | QAS-0013 (detecção de deriva de contrato de conector — usada aqui por analogia/INFERENCE: uma nova edição de diretriz clínica é uma forma de "deriva" do contrato de evidência, não um contrato de sistema externo no sentido literal do QAS) | VALIDATION REQUIRED |
| D3 | **Zero variantes institucionais não declaradas** — nenhum limiar/banda entra no sistema citando uma fonte que não o sustenta (padrão M-4: MEWS watch=3/urgent=4 atribuído a Subbe sem base) | A Opção A permite um ponto único de verificação; a Opção B multiplica os pontos de decisão e, portanto, as chances de repetição do padrão M-4 sem coordenação central | QAS-0025 (por analogia — "count of silent coercions found (must be zero)" generalizado aqui para "count of unlabeled variants found (must be zero)") | vinculante: zero (o padrão M-4 é o precedente concreto de falha) |
| D4 | **Imutabilidade e versionamento de bundle** — uma mudança de edição nunca é uma edição in-place de um bundle já ativo | Todas as opções operacionais (A, B, C) devem respeitar isso; discrimina apenas contra qualquer leitura de Opção C que imaginasse "atualizar o bundle atual" em vez de publicar um novo | QAS-0011 (saúde de bundle/versão/carregamento de regra) | vinculante per DOM-0003 e SAF-0020 |
| D5 | **Independência autor-de-regra / metodologista-de-evidência / aprovador-clínico** — nenhum papel avalia sua própria citação | Discrimina entre quem "assessa uma nova edição" em cada opção; a Opção C, sem processo humano explícito, tende a colapsar essa distinção em favor de automação sem revisão | `decision-rights.md` §3 par 1 — nenhum QAS ainda cobre isto explicitamente | N/A — regra de governança, não alvo numérico |
| D6 | **Custo de manutenção da vigilância** — quantas fontes devem ser monitoradas e com que esforço humano recorrente | A Opção A concentra o custo em um documento central de fácil auditoria; a Opção B distribui o custo (e o risco de duplicação/divergência) por pacote; a Opção C exige tooling automatizado que hoje não existe (E17) | nenhum QAS ainda cobre isto | VALIDATION REQUIRED |
| D7 | **Conformidade à restrição de uso normativa do próprio escore** — por exemplo, a recomendação forte da SSC 2021 contra qSOFA como triagem isolada (E11) não é uma banda numérica, é uma condição de uso que precisa sobreviver à seleção de edição | Uma política que só fixa números e ignora condições de uso publicadas repetiria o erro do V1 legado (`sepsis_qsofa_alert`, rejeitado em `qsofa-review.md` §6.1 por violar exatamente essa recomendação) | QAS-0025 (não-coerção silenciosa, aplicado por analogia à não-omissão silenciosa de uma restrição de uso normativa) | vinculante: nenhum alerta de triagem isolada de qSOFA é admissível sem contrariar a SSC 2021 explicitamente e com autoridade nomeada para isso |

**Excluído como não discriminante:** "usa um DOI", "cita algum artigo", "tem uma string de
versão" — o próprio V1 legado tinha todas as três características e ainda assim falhou
(E3, E6, E12).

---

## 4. Alternativas consideradas

### Opção A — Fixar as edições canônicas nesta ADR, com vigilância de processo central

**Descrição.** Este documento fixa, em §5 (uma vez aceito), a edição canônica de cada
escore candidato (NEWS2 = RCP 2017; SOFA = Vincent 1996 + Sepsis-3 Singer 2016; qSOFA =
Singer 2016 + restrição de uso SSC 2021; MEWS = Subbe 2001 *se retido*), a regra que
distingue variante de alteração silenciosa, e um processo de vigilância central (lista de
observação por escore, cadência de revisão, papel avaliador) que qualquer bundle de regra
deve seguir. Mudar a edição citada exige reabrir este ADR ou uma ADR sucessora — nunca uma
edição silenciosa do bundle.

**Como responde a cada driver.**

- D1: máxima rastreabilidade — um único documento central lista, para cada escore, qual
  edição é a fonte de verdade citável; qualquer bundle que cite outra coisa é, por
  definição, uma variante e precisa se declarar como tal (§5.2).
- D2: a vigilância fica centralizada e auditável, mas depende de um humano nomeado
  executá-la com a cadência declarada — o risco não é técnico, é de execução.
- D3: mais forte contra o padrão M-4, porque há um único lugar para verificar "isso está
  na edição canônica?" antes de aprovar qualquer bundle.
- D4: neutro — não resolve nem piora D4 por si; consome a garantia de ADR-0007.
- D5: mais fácil de aplicar — um processo central nomeia claramente quem assessa uma nova
  edição (§5.3), separado de quem escreve a regra.
- D6: custo concentrado, mas não trivial: alguém precisa manter a lista de observação e
  revisitar este documento quando algo mudar; se ninguém for designado, o processo
  degrada silenciosamente — este é o risco honesto desta opção.
- D7: explicitamente carrega as restrições de uso (SSC 2021) como parte da política, não
  como uma nota à parte.

**Consequências positivas.** Um único ponto de verdade elimina a ambiguidade "qual
citação vale?" que a Task 2 já enfrentaria sem esta ADR (E16 mostra que a Task 2 já
precisou *adivinhar* uma citação, sem política fixada); reduz drasticamente o risco do
padrão M-4/E3/E12 se repetir; barato de auditar (um documento, não N pacotes de release).

**Consequências negativas.** Um documento central que não é mantido fica desatualizado
silenciosamente — se o RCP publicar uma nova edição e ninguém revisitar este ADR, cada
bundle novo continuará citando RCP 2017 mesmo depois de obsoleto, e o próprio mecanismo
que deveria pegar isso (§5.3) depende de execução humana disciplinada; centraliza uma
decisão que talvez devesse variar por escore (por exemplo, o MEWS pode nunca precisar de
vigilância se for retirado no Gate G2, mas esta opção vigia todos os quatro igualmente até
alguém decidir o contrário).

**O que precisaria ser verdade para esta ser a resposta certa.** Existe (ou existirá) um
dono nomeado que efetivamente executa a cadência de vigilância declarada em §5.3; o Gate G2
resolve o par NEWS2/MEWS em tempo hábil para que a linha "MEWS" não fique órfã por muito
tempo; `ADR-0007` é aceito com um modelo de bundle compatível com "novo ID por variante".

**Custo de saída se revertida depois.** Baixo — reverter significa reescrever a tabela de
edições canônicas em uma ADR sucessora (ou nesta mesma, se ainda `proposed`); nenhum
bundle de regra precisa ser reescrito só por causa da mudança de política, apenas os
*próximos* bundles precisam citar a nova edição.

### Opção B — Delegar a citação de edição a cada pacote de release; fixar apenas o processo aqui

**Descrição.** Este ADR fixa apenas as *regras de processo* — como declarar uma variante,
como versionar, quem assessa uma nova edição — mas **não** lista qual edição é canônica
para cada escore. Cada bundle de regra (via ADR-0007) declara e justifica sua própria
citação no momento da sua aprovação.

**Como responde a cada driver.**

- D1: mais fraco — sem uma tabela central, dois bundles do mesmo escore, aprovados em
  momentos diferentes, poderiam citar edições diferentes sem que isso seja
  automaticamente visível como uma divergência que precisa de decisão.
- D2: a vigilância também fica fragmentada — cada pacote de release precisaria monitorar
  seu próprio escore, multiplicando o esforço e o risco de um deles nunca revisitar.
- D3: mais fraco na prática: sem um ponto único de verificação, o padrão M-4 (limiar
  institucional citado sob nome errado) fica mais fácil de repetir, porque cada aprovador
  de bundle teria que reverificar a fonte primária do zero.
- D4: neutro, como na Opção A.
- D5: ainda aplicável, mas cada bundle precisa nomear seu próprio avaliador — mais chance
  de inconsistência entre pacotes.
- D6: custo distribuído em vez de concentrado — parece mais barato por pacote, mas soma
  mais no total porque o trabalho de encontrar/verificar a fonte primária se repete a
  cada bundle em vez de ser feito uma vez.
- D7: risco real de que uma restrição de uso (como a da SSC 2021 contra qSOFA isolado)
  seja esquecida em um pacote futuro se não estiver fixada centralmente.

**Consequências positivas.** Mais flexível caso escores diferentes precisem, de fato, de
cadências e fontes de vigilância muito diferentes; nenhum documento central fica
"desatualizado" porque não há um documento central com esse papel.

**Consequências negativas.** Reproduz exatamente a condição estrutural que permitiu o
padrão M-4 no V1 legado: decisões de citação tomadas pontualmente, sem um ponto de
verificação central; mais fácil para duas equipes/tarefas concorrentes citarem edições
diferentes do mesmo escore sem perceber (o que já quase aconteceu — E16 mostra a Task 2
citando por conta própria, sem uma política para conferir contra).

**O que precisaria ser verdade para esta ser a resposta certa.** Os quatro escores
tivessem trajetórias de edição genuinamente independentes e sem sobreposição de portfólio
(o oposto do que E13 mostra: NEWS2/MEWS têm sobreposição "VERY HIGH"); ou o programa
tivesse capacidade de auditoria cruzada entre pacotes de release que hoje não existe.

**Custo de saída se revertida depois.** Moderado — migrar para a Opção A exigiria
retroativamente auditar todo bundle já aprovado para verificar se as citações convergem, e
resolver qualquer divergência encontrada.

### Opção C — Rastreamento sempre-a-edição-mais-recente (automatizado)

**Descrição.** Em vez de fixar uma edição, a V2 adotaria automaticamente a edição mais
recente publicada pelo emissor assim que detectada, via alguma automação de vigilância
(feed do emissor, scraping, alerta).

**Como responde a cada driver.**

- D1: paradoxalmente mais fraco no curto prazo — "a mais recente" não é uma citação
  estável até que a automação prove, de forma auditável, qual edição está ativa em cada
  instante.
- D2: no papel, o melhor da tabela — tempestividade máxima, quase por definição.
- D3: risco novo, não mitigado pelas outras opções: uma "edição" detectada
  automaticamente pode ser mal-interpretada por uma ferramenta (por exemplo, confundir uma
  errata com uma nova edição, ou uma revisão de estilo com uma mudança de banda) — a
  própria E2 mostra que verificar manualmente se algo é "a clarificação de dezembro de
  2022" já foi difícil para um revisor humano cauteloso; uma automação teria o mesmo
  problema sem o mesmo cuidado.
- D4: em tensão direta com D4 — "adotar automaticamente" soa como o oposto de "nunca
  editar um bundle in-place"; só é compatível com D4 se cada adoção automática ainda
  gerar um novo bundle assinado com aprovação humana antes de ativar, o que elimina boa
  parte do ganho de tempestividade que motiva esta opção.
- D5: a mais fraca das quatro — automação, por definição, tende a colapsar a distinção
  entre "detectar uma mudança" e "aprovar uma mudança", exatamente o par que D5 exige
  manter separado.
- D6: exige construir e manter uma ferramenta que hoje não existe (E17) — o custo inicial é
  o mais alto das três opções operacionais.
- D7: uma restrição de uso (como a recomendação SSC 2021) não é algo que uma automação de
  "detectar nova edição" naturalmente capturaria — restrições de uso não são, elas
  mesmas, novas edições do escore.

**Consequências positivas.** Se algum dia executada bem, seria a opção com menor
defasagem entre publicação e adoção.

**Consequências negativas.** Nenhuma ferramenta de vigilância automatizada existe hoje
(E17); construir uma é um investimento de engenharia não trivial cujo retorno (quantas
edições por escore mudam por ano?) é desconhecido; risco de falso-positivo (tratar uma
errata como edição nova) ou falso-negativo (não detectar uma mudança publicada fora do
canal monitorado); tensiona diretamente com D4 e D5, os dois drivers vinculantes desta
tabela — adotar esta opção sem resolver essa tensão seria, na prática, criar um caminho
que contorna a imutabilidade de bundle.

**O que precisaria ser verdade para esta ser a resposta certa.** Existisse orçamento de
engenharia dedicado à vigilância automatizada; os emissores relevantes (RCP, JAMA/Sepsis-3,
SSC/SCCM/ESICM) publicassem em um formato estruturado, monitorável de forma confiável; e
uma camada de aprovação humana obrigatória fosse mantida entre "detectado" e "ativado" —
o que efetivamente reduziria esta opção a "Opção A com um passo de detecção acelerado",
não a uma alternativa genuinamente distinta.

**Custo de saída se revertida depois.** Alto — a ferramenta construída, seus alertas
falso-positivos históricos e qualquer bundle ativado por ela precisariam ser
reauditados manualmente contra a política central se a automação for desativada.

### Opção Z — Adiar / não decidir

**Descrição.** Não fixar nenhuma edição canônica agora. Cada especialista que tocar um
escore (como a Task 2 já fez para SOFA, E16) continua citando o que julgar apropriado, sem
nenhuma política de variante nem de vigilância, até que este ADR — ou outra — seja
retomado.

**Consequências positivas.** Nenhum trabalho é feito prematuramente; se o Gate G2 decidir
não admitir nenhum dos quatro escores candidatos, todo o esforço desta política teria sido
evitável.

**Consequências negativas.** A Task 2 já está em andamento concorrente (E16) e já tomou uma
decisão de citação de fato, sem política — adiar não impede o trabalho de continuar, apenas
o impede de ter uma política central contra a qual se verificar; o padrão M-4 (citação sob
nome errado) fica mais provável de se repetir sem nenhum ponto de verificação; se dois
pacotes de release citarem edições diferentes do mesmo escore antes que este ADR seja
retomado, a reconciliação retroativa custa mais do que teria custado decidir agora.

**Custo do adiamento.** INFERENCE: sobe rapidamente assim que o primeiro bundle de regra
(ADR-0007) é de fato aprovado citando qualquer coisa — nesse ponto, adiar deixa de ser
gratuito e passa a ser uma migração retroativa.

### 4.1 Comparação com os drivers

Apenas qualitativo. Sem pontuação numérica — pesos não foram ratificados por nenhum titular.

| Driver | A — fixar aqui | B — delegar por pacote | C — sempre-mais-recente | Z — adiar |
|---|---|---|---|---|
| D1 rastreabilidade | Forte — um ponto de verdade | Fraca — divergência entre pacotes possível | Fraca até a automação provar auditabilidade | Nenhuma |
| D2 tempestividade | Depende de execução humana disciplinada | Fragmentada, mais lenta no agregado | Potencialmente a mais rápida, se construída | Nenhuma |
| D3 zero variante não declarada | Mais forte — ponto único de checagem | Mais fraca — padrão M-4 mais fácil de repetir | Novo risco de má-classificação automatizada | Sem controle nenhum |
| D4 imutabilidade de bundle | Neutro, compatível | Neutro, compatível | Em tensão direta se não gated por aprovação humana | Sem bundle nenhum ainda, N/A |
| D5 independência de papéis | Mais fácil de aplicar centralmente | Precisa ser reaplicada por pacote | A mais fraca — tende a colapsar detecção/aprovação | N/A |
| D6 custo de manutenção | Concentrado, moderado | Distribuído, soma maior no total | Alto investimento inicial de tooling | Zero agora, sobe depois |
| D7 restrições de uso normativas | Explicitamente incluída | Risco de esquecimento por pacote | Não capturada por definição do mecanismo | Nenhuma |

---

## 5. Decisão e escopo

### 5.0 Decisão (GDEC-0007, 2026-08-15)

> decided_by: **rodaquino-OMNI** (revisor clínico nomeado, GDEC-0003; também titular
> interino de papéis `AUTH-*` de fase de projeto per GDEC-0004 onde pertinente).
>
> As tabelas de §5.1–§5.3 são ratificadas como decisão. Registro por questão, per a
> folha de decisão do ciclo 1
> (`docs/05-clinical-safety/cycle-1-review-decision-sheet.md` §7, linhas A25-1 a A25-7):
>
> - **A25-1 →** as quatro linhas de edição canônica de §5.1 são **ratificadas**:
>   NEWS2 = RCP 2017; SOFA = Vincent 1996 via Sepsis-3; qSOFA = Singer 2016 +
>   restrição SSC 2021; MEWS = Subbe 2001, condicional (A1/A25-2).
> - **A25-2 →** enquanto o Gate G2 não decide, **assume-se SUPERSEDE do MEWS pelo
>   NEWS2**; a linha MEWS de §5.1/§5.3 permanece registrada como **dormente**, não
>   retirada do documento, até decisão formal de portfólio.
> - **A25-3 →** a verificação célula a célula da Table 1 de Subbe 2001 (C2) é
>   **moot sob A25-2**; se o MEWS retornar ao portfólio, a verificação é tarefa do
>   metodologista de evidência clínica quando ativado — não trabalho imediato.
> - **A25-4 →** qSOFA: "alteração da mentalidade" operacionalizada como **GCS<15**
>   (definição do texto publicado, Singer 2016/JAMA), com nota registrada sobre a
>   derivação de Seymour (coorte de derivação, GCS≤13) como leitura alternativa não
>   adotada.
> - **A25-5 →** a restrição SSC 2021 (recomendação forte contra qSOFA como
>   ferramenta única de triagem) é **vinculante** no portfólio — nenhum bundle pode
>   admitir qSOFA como gatilho de triagem isolado sem justificativa registrada por
>   autoridade nomeada.
> - **A25-6 →** o registro em `adr-index.md` (C7/C9) — já concluído na integração do
>   ciclo 1 — é **confirmado**; próximo ID livre permanece ADR-0030.
> - **A25-7 →** a checagem regulatória brasileira (ANVISA/CFM/MS, enquadramento
>   SaMD) é **comissionada agora**, como ordem de serviço paralela — não diferida.
>
> **rationale:** conforme folha de decisão do ciclo 1 (GDEC-0007); fundamentos por
> linha na própria folha (`cycle-1-review-decision-sheet.md` §7).
>
> **supersessão:** rege-se pela própria seção de gatilhos de revisão desta ADR (§8.2,
> T1–T7) — nenhum gatilho adicional é criado por esta transcrição.
>
> **Nota de escopo.** Esta decisão fecha as cláusulas CLÍNICAS. A verificação
> primária da Table 1 de Subbe 2001 (C2, moot sob A25-2), a ativação do metodologista
> de evidência (C5), a aceitação do ADR-0007 com slot compatível (C4) e a atualização
> de `adr-index.md`/dependências (C7/C9, dívida de handoff — ver aviso de proveniência
> no topo) permanecem OPEN e não são fechadas por esta aceitação.

### 5.1 Tabela de edição canônica, por escore (ratificada — GDEC-0007, 2026-08-15)

| Escore | Edição canônica proposta | O que exatamente vem de onde | Status de verificação da fonte |
|---|---|---|---|
| **NEWS2** | Royal College of Physicians, *National Early Warning Score (NEWS) 2*, 2017 (relatório do PDF do emissor) | As sete bandas de parâmetro, os cortes agregados 0-4/5-6/≥7 e o "red score" de parâmetro único = 3 (E1) | **Verificado a partir do PDF do emissor** (E1). A "clarificação de dezembro de 2022" citada por alguns materiais secundários **NÃO foi localizada** nas páginas oficiais do RCP na data de coleta e permanece **VALIDATION REQUIRED** — nenhuma cláusula desta política ou de qualquer bundle pode citá-la até verificação (E2, A6). |
| **SOFA** | **Vincent JL et al.** *Intensive Care Medicine* 1996;22(7):707-710, **como operacionalizado pelo critério diagnóstico de Sepsis-3 (Singer M et al., *JAMA* 2016;315(8):801-810)** | De **Vincent 1996**: a tabela dos seis componentes (respiração PaO2/FiO2, coagulação plaquetas, fígado bilirrubina, cardiovascular PAM+vasopressor em µg/kg/min por ≥1h, neurológico GCS, renal creatinina-ou-débito-urinário) e seus cortes numéricos. De **Sepsis-3 (Singer 2016)**: exclusivamente o critério diagnóstico "ΔSOFA ≥2 a partir de um basal assumido zero" — este elemento **não** está em Vincent 1996 e não deve ser confundido com a tabela de componentes. O banding de risco de mortalidade do V1 legado (E9) **não** vem de nenhuma das duas fontes e **não** é proposto como conteúdo canônico. | **Ambas verificadas** (E7, E8; PMC6880479 como renderização secundária de apoio). Quatro pontos de interpretação que Vincent 1996 deixa em aberto (escopo de "suporte respiratório", tratamento de P/F<200 sem suporte, condição de duração do vasopressor, combinação de vasopressores) **permanecem abertos para ratificação explícita** — ver `sofa-review.md` §9 item 1 — esta ADR não os fecha. |
| **qSOFA** | **Singer M et al.** *JAMA* 2016;315(8):801-810 (Sepsis-3), **com a restrição de uso normativa da Surviving Sepsis Campaign 2021 (Evans L et al.) anexada como condição de uso, não como uma edição alternativa** | Os três critérios (FR≥22, PAS≤100, alteração da mentalidade) e o limiar 2-de-3 (E10). A operacionalização de "alteração da mentalidade" — **GCS<15 (o texto publicado generalizado) versus GCS≤13 (a coorte de derivação da força-tarefa)** — é uma escolha explícita que qualquer bundle de regra deve declarar e citar, não uma ambiguidade a herdar silenciosamente. | **Verificado** (E10). A restrição SSC 2021 — "recomendamos **contra** usar qSOFA... como ferramenta única de triagem" (recomendação forte, evidência de qualidade moderada) — está **verificada** (E11) e é proposta como **vinculante**: nenhum bundle de regra pode admitir qSOFA como gatilho de alerta autônomo de triagem de sepse sem que uma autoridade clínica nomeada registre, por escrito, por que está contrariando uma recomendação forte de uma diretriz vigente. |
| **MEWS** | **Subbe CP et al.** *QJM* 2001;94(10):521-526 — **somente se retido no portfólio** (Gate G2, condicional a A1) | O conjunto de cinco parâmetros (PAS, FC, FR, temperatura, AVPU) está confirmado a nível de citação (E4). **As bandas por parâmetro (Table 1) NÃO estão verificadas** — a comparação usada nas revisões forenses é a transcrição mais citada, rotulada INFERENCE, não SOURCE (E5). | **NÃO verificado a nível de Table 1 — VALIDATION REQUIRED, bloqueante.** Nenhuma especificação V2 pode citar Subbe 2001 como `SOURCE` para as bandas numéricas do MEWS até essa verificação primária concluir (A2). Mesmo se retido, o **resultado mais provável** desta linha, per E13, é que o Gate G2 escolha **SUPERSEDE** (retirar MEWS a favor de NEWS2, dada a sobreposição "VERY HIGH") — nesse caso, esta linha inteira se torna histórica, não operacional; este ADR não antecipa essa decisão, apenas a registra como o desfecho mais provável indicado pela evidência de portfólio já coletada. |

### 5.2 Regra de seleção de variante (ratificada — GDEC-0007, 2026-08-15)

1. **O que conta como "a mesma edição" do escore.** Dois conjuntos de conteúdo clínico são
   a mesma edição de um escore se, e somente se: (a) o mesmo conjunto de parâmetros de
   entrada; (b) a mesma estrutura de agregação (soma simples, `max()` entre subcomponentes,
   etc.); e (c) os mesmos valores numéricos de banda/corte — todos os três, sem exceção.
   Qualquer divergência em (c) sozinha, mesmo de um único limite de banda, já é uma
   **variante** dessa edição, não "a mesma coisa com um ajuste".
2. **O que conta como uma variante (e não um escore diferente).** Uma variante mantém (a) e
   (b) mas diverge em (c) — por exemplo, o gap resolvido pelo V1 legado no limite HR=40 do
   MEWS (`mews-review.md` M-3: 40 pontuado como 1, a banda mais branda, em uma tabela com um
   buraco documentado entre "<40" e "41-50"). Uma divergência em (a) — por exemplo, um MEWS
   que adicionasse débito urinário — **não** é uma variante; é, per a disciplina de
   `PROMPT:418` já citada em `sofa-review.md` §7.3 ("proibição de alterar silenciosamente
   uma definição clínica"), **um instrumento diferente**, que precisa de sua própria
   evidência, seu próprio nome e sua própria citação — nunca herdar o nome do escore
   original.
3. **Proibição de variante institucional não declarada.** É proibido que um bundle de regra
   cite a edição canônica de §5.1 enquanto contém um valor numérico que diverge dela, sem
   declarar explicitamente essa divergência. O precedente negativo é exatamente M-4: os
   cortes `watch=3/urgent=4` do MEWS legado foram atribuídos a Subbe 2001 quando a fonte
   primária verificada só sustenta "≥5" — uma variante institucional **disfarçada** de
   citação primária. O padrão positivo a generalizar é M-3, que **declarou** sua resolução
   de gap como decisão institucional, não como conteúdo publicado — essa é a forma exigida
   para toda variante: declarada, nomeada, e citada como o que é.
4. **Como uma adaptação local deliberada deve se declarar.** Uma variante deliberada
   (institucional ou de portfólio) DEVE: (a) receber um **novo identificador de regra**
   (não reutilizar o ID/versão da edição canônica) dentro do esquema de bundle que
   `ADR-0007` definirá; (b) declarar explicitamente, no próprio bundle, quais valores
   divergem da edição canônica de §5.1 e por quê (decisão institucional documentada, não
   uma citação inventada); e (c) ser aprovada pelo mesmo processo de aprovador-clínico
   independente que qualquer bundle de regra requer (SAF-0020) — nunca ser uma edição
   in-place de um bundle cujo ID/versão ainda alega ser a edição canônica. Isso é uma
   aplicação direta da imutabilidade de bundle (E15, `ADR-0007`) ao problema específico de
   variante: o defeito de E3 (a string `NEWS2-v3.0.0` sobreviver a uma mudança de
   comportamento) é, estruturalmente, o mesmo defeito que uma variante não declarada
   produziria se fosse permitida — este item o proíbe nos dois casos com a mesma regra.

### 5.3 Desenho de vigilância de atualização (ratificado — GDEC-0007, 2026-08-15)

**Lista de observação, por escore (PROPOSAL):**

- **NEWS2** — páginas de recursos do Royal College of Physicians
  (`rcp.ac.uk/resources/national-early-warning-score-news-2/`) e edições especiais
  relevantes da revista *Clinical Medicine* (RCP).
- **MEWS** — página do artigo na Oxford Academic/*QJM* (`academic.oup.com/qjmed`) e
  literatura de validação subsequente citando Subbe 2001 — vigilância condicional à
  retenção de MEWS no portfólio (A1); se o Gate G2 escolher SUPERSEDE, esta linha é
  retirada da lista ativa, não mantida indefinidamente sem uso.
- **SOFA** — *Intensive Care Medicine* (linhagem Vincent) e *JAMA* (linhagem Sepsis-3,
  Singer et al. e força-tarefa correlata), monitorando tanto revisões da tabela de
  componentes quanto de sua operacionalização diagnóstica.
- **qSOFA** — o mesmo canal *JAMA*/Sepsis-3, mais as diretrizes conjuntas da Surviving
  Sepsis Campaign (SCCM/ESICM) para a condição de uso — a SSC 2021 é a edição vigente da
  restrição de uso; sua sucessora é o gatilho relevante, não apenas uma nova edição do
  qSOFA em si.

**Cadência de revisão.** `VALIDATION REQUIRED` — nenhum número é inventado aqui. **PROPOSTA**
para ratificação pelo titular: revisão no mínimo a cada Gate de portfólio relevante (G2 e
qualquer revisão de G6 que reabra bundles de escore), **e** imediatamente ao primeiro
sinal detectado em qualquer canal da lista de observação — a cadência exata (mensal?
trimestral? por evento apenas?) é uma decisão do titular nomeado, não desta ADR.

**Quem avalia uma nova edição.** O titular clínico (candidato `AUTH-CLINSAFETY`,
rodaquino-OMNI per GDEC-0003) em conjunto com o **metodologista de evidência clínica**
(papel especialista ainda não ativado, `portfolio-method.md` C4) — o metodologista gradua
a força e a transportabilidade da nova evidência; o titular clínico aceita ou rejeita a
adoção. Nenhum dos dois pode ser o autor da regra que implementaria a mudança
(`decision-rights.md` §3 par 1).

**Como uma mudança de edição flui para uma nova versão de bundle.** Nunca in-place. Uma
nova edição adotada gera uma nova `RuleVersion` dentro de um novo bundle imutável e
assinado (SAF-0020, `ADR-0007`), com seu próprio registro de aprovação, que **substitui**
(não sobrescreve) a versão anterior — a versão anterior permanece no histórico do bundle
para fins de replay determinístico (DOM-0003), exatamente como qualquer outra alteração
de regra.

### 5.4 Condições que devem ser satisfeitas antes que este ADR possa ser aceito

| # | Condição | Dono | Evidência que a fecharia | Status |
|---|---|---|---|---|
| C1 | Um revisor clínico nomeado ratifica ou rejeita a tabela de edição canônica de §5.1, cláusula por cláusula. | `AUTH-CLINSAFETY` (candidato: rodaquino-OMNI, GDEC-0003) | Registro de revisão assinado, cláusula por cláusula, per o processo já usado nas cinco revisões forenses citadas. | **FECHADA — ver §5.0, GDEC-0007, 2026-08-15 (A25-1)** |
| C2 | A Table 1 de Subbe 2001 (MEWS) é verificada célula a célula a partir da fonte primária. | UNASSIGNED — VALIDATION REQUIRED | O artigo original obtido e comparado linha a linha contra a transcrição usada nas revisões forenses. | **ABERTA, porém MOOT sob A25-2 (MEWS assumido SUPERSEDE-dormente) — só reabre se MEWS retornar ao portfólio** |
| C3 | O Gate G2 resolve a decisão de portfólio NEWS2×MEWS (retenção vs. SUPERSEDE). | `AUTH-PRODUCT` + `AUTH-CLINSAFETY` | Registro de decisão de portfólio do Gate G2. | **ABERTA — A25-2 é a assunção operante até o Gate G2 decidir formalmente** |
| C4 | `ADR-0007` é redigido e aceito com um modelo de bundle compatível com "novo ID de regra por variante, nunca edição silenciosa" (§5.2 item 4). | UNASSIGNED — VALIDATION REQUIRED | `ADR-0007` aceito. | **FECHADA quanto à aceitação — `ADR-0007` aceito em 2026-08-15 (GDEC-0007); verificação de compatibilidade de schema ainda pendente** |
| C5 | Um metodologista de evidência clínica é ativado e grada a força de evidência de cada escore candidato admitido em portfólio. | `AUTH-PRODUCT` (ativação do papel) | Papel preenchido; graduação de evidência registrada por candidato. | **ABERTA** |
| C6 | A ambiguidade GCS<15 vs. GCS≤13 (qSOFA, E10) é resolvida por escolha explícita e citada, não herdada silenciosamente. | `AUTH-CLINSAFETY` | Registro de escolha, com citação, na especificação V2 do qSOFA. | **FECHADA — ver §5.0, GDEC-0007, 2026-08-15 (A25-4: GCS<15)** |
| C7 | `adr-index.md` é atualizado para registrar `ADR-0025` (fora do `write_scope` desta tarefa — ver aviso de proveniência no topo). | ADR-program engineer (papel a designar) | `adr-index.md` §3/§4/§6 atualizado com esta ADR. | **CONFIRMADA CONCLUÍDA per A25-6 (integração do ciclo 1); atualização de status para `accepted` permanece a cargo do orquestrador (fora do write_scope desta transcrição)** |
| C8 | `assumptions-register.md` recebe IDs `ASM-xxxx` para A1–A6. | UNASSIGNED — VALIDATION REQUIRED | Entradas registradas. | **ABERTA** |
| C9 | `adr-index.md` §4 registra a relação de dependência entre `ADR-0025` e `ADR-0007` (consome o mecanismo de bundle) e entre `ADR-0025` e a decisão de portfólio do Gate G2. | ADR-program engineer | Grafo de dependências atualizado. | **CONFIRMADA CONCLUÍDA per A25-6 — mesma nota de C7** |

---

## 6. Consequências

Como nenhuma opção foi escolhida, o que segue são as consequências **da existência deste
ADR em estado `proposed`**, não de uma decisão.

### 6.1 Positivas

- A pergunta "qual edição vale para este escore?" agora tem um lugar único e nomeado para
  ser respondida, em vez de ser decidida implicitamente pelo primeiro pacote de release a
  tocar o assunto (o que já quase aconteceu — E16).
- O padrão de falha concreto do V1 legado (M-4: limiar institucional citado sob nome
  errado; E3: string de versão que não acompanha o comportamento) tem, pela primeira vez
  neste programa, uma regra explícita desenhada contra ele (§5.2), não apenas um relato
  histórico do que deu errado.
- A restrição de uso da SSC 2021 contra qSOFA como triagem isolada (E11) é elevada de uma
  nota de rodapé de uma revisão forense para uma condição vinculante candidata desta
  política — reduz o risco de o V1 legado's `sepsis_qsofa_alert` (já REJECT per
  `qsofa-review.md`) reaparecer disfarçado em um bundle novo.
- Torna visível, e não silenciosa, a lacuna real: a Table 1 do MEWS nunca foi verificada
  (E5) e a "clarificação de dezembro de 2022" do NEWS2 nunca foi localizada (E2) — ambas
  seguem `VALIDATION REQUIRED` explícitas, não presumidas resolvidas.

### 6.2 Negativas

- Enquanto `proposed`, nenhum bundle de regra tem, ainda, uma política aceita contra a
  qual se verificar — o trabalho concorrente da Task 2 (E16) continua tomando decisões de
  citação por conta própria até que este ADR seja aceito.
- A dívida de handoff de `adr-index.md` (C7, C9) é um risco real de descoberta tardia: até
  que alguém com `write_scope` sobre `adr-index.md` incorpore esta ADR, ela é
  descobrível apenas por quem souber procurá-la diretamente neste diretório.
- A condicionalidade da linha MEWS (A1, C2, C3) significa que qualquer leitor apressado de
  §5.1 pode tratar "Subbe 2001" como definitivamente canônico quando, na verdade, é
  condicional a uma decisão de portfólio ainda não tomada e a uma verificação de fonte
  primária ainda não concluída — isso deve ser sinalizado enfaticamente em qualquer
  citação futura desta ADR.

### 6.3 Neutras / estruturais

- Nenhuma cláusula clínica aqui é `DECIDED`; todas seguem `PROPOSAL — AWAITING NAMED
  CLINICAL REVIEW`, per GDEC-0003 e `evidence-notation.md` §2 regra 3.
- Nada neste documento admite nenhum dos quatro escores no portfólio clínico — essa
  continua sendo, exclusivamente, uma decisão do Gate G2.

---

## 7. Implicações transversais

| Dimensão | Implicação | Rótulo | Papel dono | ID de acompanhamento |
|---|---|---|---|---|
| Segurança clínica | Esta política é um controle direto contra HAZ-0019 (bundle não ratificado ativado) e HAZ-0020 (deriva de versão entre instâncias) na dimensão específica de "qual edição/citação está ativa"; também é o controle textual para HAZ-0036 (uso de instrumento fora de sua condição de uso normativa, especificamente qSOFA sem gate de infecção suspeita — a restrição SSC 2021 de §5.1 é a barreira). Se MEWS for admitido sem a verificação C2, HAZ-0005 (zero-coerção) permaneceria controlado por SAF-0001/0002, mas o próprio conteúdo das bandas ficaria sem base verificada — um risco distinto, de conteúdo, não de coerção. | INFERENCE a partir de E3, E5, E6, E11 e do hazard-log | `AUTH-CLINSAFETY` | HAZ-0005, HAZ-0019, HAZ-0020, HAZ-0032, HAZ-0036, HAZ-0043 |
| Segurança (security) | Nenhuma implicação direta de controle de acesso ou superfície de ataque; a única superfície relevante é a integridade da cadeia de assinatura do bundle que carrega a citação — de responsabilidade de `ADR-0007`/SAF-0020, não desta ADR. | INFERENCE | `AUTH-SECURITY` | ADR-0007 |
| Privacidade (LGPD, minimização, propósito) | Não aplicável — esta política trata de citação de fonte primária publicada (diretrizes clínicas públicas), não de dados de paciente. | Not applicable — nenhum dado pessoal é tratado por esta política | n/a | n/a |
| Interoperabilidade | Nenhuma edição canônica proposta aqui depende de nenhum perfil FHIR/terminologia específico; a vigilância de atualização (§5.3) é independente do canal de interoperabilidade com a AMH (`ADR-0001`) — esses são escores computados sobre entradas, não recursos consumidos diretamente da AMH sem transformação. | INFERENCE | `AUTH-DATA-PLATFORM` | Not applicable — sem ID de acompanhamento identificado |
| Acessibilidade | Nenhuma implicação direta. Indireta: se/quando um escore for exibido com sua citação de edição na interface (por exemplo, "NEWS2 (RCP 2017)"), essa citação deve ser acessível a tecnologia assistiva como qualquer outro texto de proveniência — mesma obrigação geral já registrada em `ADR-0001` §7. | INFERENCE | `AUTH-UX` | ADR-0021 |
| Operacional | O processo de vigilância (§5.3) é, em si, uma nova responsabilidade operacional recorrente — alguém precisa efetivamente monitorar os canais listados e revisitar este documento; se não for atribuído com clareza, degrada silenciosamente (risco já nomeado em §4, Opção A). | INFERENCE | `AUTH-OPERATIONS` | pending |
| Custo | Custo de manutenção humana recorrente (D6); nenhum modelo de custo foi construído nem é inventado aqui. | VALIDATION REQUIRED | `AUTH-PRODUCT` | pending |
| Migração | Se uma edição canônica mudar após bundles já estarem ativos, a migração é: publicar um novo bundle (nunca editar o existente), reavaliar cada `EvaluationRecord` histórico apenas por replay determinístico (DOM-0003) contra a `RuleVersion` que estava ativa no momento — nunca reescrever resultados passados à luz da nova edição. | INFERENCE a partir de DOM-0003, E15 | `AUTH-OPERATIONS` | ADR-0023 |

---

## 8. Reversibilidade, gatilhos de revisão, kill/rollback

### 8.1 Avaliação de reversibilidade

| Opção | Reversibilidade | O que fica retido na reversão | Rótulo |
|---|---|---|---|
| A — fixar aqui | **Alta** — reverter é reescrever a tabela de §5.1 em uma ADR sucessora; nenhum bundle já aprovado precisa ser reescrito só por isso | O texto desta ADR como registro histórico; nenhum artefato de sistema | INFERENCE |
| B — delegar por pacote | **Alta**, mas o custo de migrar para A é retroativo (auditar todo bundle já aprovado) | O histórico de citações por pacote, potencialmente divergente | INFERENCE |
| C — sempre-a-mais-recente | **Baixa a moderada** — depende de quanta automação foi construída; desativar a automação sem um plano de reauditoria deixa bundles ativados por ela em um estado de proveniência incerta | A ferramenta construída e seu histórico de decisões automatizadas | INFERENCE |
| Z — adiar | **n/a** — nada a reverter; valor de opção preservado, a um custo de portador que sobe (§4, "custo do adiamento") | n/a | INFERENCE |

### 8.2 Gatilhos de revisão

| # | Gatilho | Como é detectado | Quem é notificado | Ação no gatilho |
|---|---|---|---|---|
| T1 | O RCP publica uma nova edição do NEWS (ex.: "NEWS3") ou confirma/publica a "clarificação de dezembro de 2022". | Vigilância manual do canal RCP (§5.3), até que ferramenta exista (E17) | `AUTH-CLINSAFETY` | Reabrir §5.1 linha NEWS2; reverificar a partir do PDF do emissor antes de qualquer citação nova |
| T2 | Uma sucessora de Sepsis-3/Sepsis-4 é publicada em *JAMA* ou veículo equivalente, alterando a definição de sepse, o critério SOFA, ou a condição de uso do qSOFA. | Vigilância manual do canal *JAMA*/Sepsis-3 (§5.3) | `AUTH-CLINSAFETY` | Reabrir §5.1 linhas SOFA e qSOFA; reverificar contra a nova publicação antes de qualquer citação nova |
| T3 | A Surviving Sepsis Campaign publica uma sucessora da diretriz 2021, alterando a recomendação sobre qSOFA como triagem. | Vigilância manual do canal SSC/SCCM/ESICM (§5.3) | `AUTH-CLINSAFETY` | Reavaliar se a restrição vinculante de §5.1 (qSOFA) ainda se sustenta como escrita |
| T4 | A verificação célula a célula da Table 1 de Subbe 2001 (C2) conclui. | Registro de verificação primária arquivado | `AUTH-CLINSAFETY` | A linha MEWS de §5.1 pode sair de `VALIDATION REQUIRED` para citação verificada, condicional ainda a C3 |
| T5 | O Gate G2 decide a questão de portfólio NEWS2×MEWS (C3). | Registro de decisão de portfólio | `AUTH-PRODUCT`, `AUTH-CLINSAFETY` | Se SUPERSEDE: a linha MEWS de §5.1 e a entrada correspondente em §5.3 são retiradas da vigilância ativa e mantidas apenas como registro histórico |
| T6 | Um instrumento regulatório brasileiro (ANVISA, CFM, Ministério da Saúde) que mandate uma edição específica de escore de alerta precoce é identificado. | Consulta jurídica/regulatória formal — fora do escopo desta ADR (`AUTH-PRIVACY-LEGAL`/consultoria regulatória) | `AUTH-CLINSAFETY`, `AUTH-PRIVACY-LEGAL` | Reabrir esta ADR inteira; um mandato regulatório pode ter precedência sobre a edição proposta em §5.1 |
| T7 | `ADR-0007` é aceito com um modelo de bundle. | Registro de aceitação de `ADR-0007` | `AUTH-CLINSAFETY` | Verificar se o modelo de bundle aceito é de fato compatível com a regra de variante de §5.2 item 4; se não, reabrir esta ADR |

### 8.3 Kill switch / estratégia de rollback

Enquanto `proposed`, não há nada para desligar — nenhum bundle de regra depende ainda desta
política. A restrição vigente até a aceitação é: **nenhum bundle de regra de escore pode
citar uma edição sem que essa citação seja verificável na fonte primária pelo aprovador
clínico independente** (SAF-0003, SAF-0020) — essa é já uma obrigação vinculante
independente desta ADR, e esta ADR não a enfraquece nem a substitui enquanto `proposed`.

Após a aceitação, se uma edição citada precisar ser retirada (por exemplo, a descoberta de
que uma citação usada era, na verdade, uma variante não declarada — o padrão M-4
descoberto tardiamente), o rollback é: (a) o bundle que a contém é retirado — nunca editado
in-place — per SAF-0020; (b) um novo bundle com a citação corrigida é publicado e aprovado
independentemente; (c) todo `EvaluationRecord` histórico gerado sob o bundle retirado
permanece intacto para fins de replay e auditoria (DOM-0003) — a correção nunca reescreve o
passado, apenas fecha o caminho futuro.

---

## 9. Método de validação e evidência vinculada

| # | Afirmação desta ADR | Método de validação | Ambiente necessário | IDs vinculados |
|---|---|---|---|---|
| V1 | A edição canônica proposta em §5.1 para cada escore ainda corresponde à publicação vigente do emissor. | Reverificação manual periódica contra o canal de vigilância de §5.3; diff contra a citação registrada aqui. | Nenhum (acesso de leitura à publicação do emissor) | `TST: pending test architecture` |
| V2 | Nenhum bundle de regra ativo cita uma edição diferente da fixada em §5.1 sem se declarar explicitamente como variante (§5.2). | Auditoria automatizada do campo de citação de todo bundle ativo, uma vez que `ADR-0007` definir o formato de bundle. | Ambiente com o registro de bundles já implementado (depende de `ADR-0007`) | HAZ: HAZ-0019, HAZ-0020; SAF-0020; `TST: pending test architecture` |
| V3 | Nenhum bundle admite qSOFA como gatilho de triagem de sepse isolado sem uma justificativa explícita contrariando a SSC 2021 por uma autoridade nomeada. | Revisão manual de todo bundle candidato de qSOFA contra a restrição de §5.1, antes da aprovação. | Nenhum (revisão documental) | HAZ-0036; SAF-0003; `TST: pending test architecture` |
| V4 | A Table 1 de Subbe 2001 (MEWS) foi verificada célula a célula antes de qualquer citação `SOURCE` das bandas MEWS. | Obtenção do artigo original e comparação linha a linha; registro de verificação arquivado. | Acesso à publicação (pode exigir assinatura institucional) | C2; `VAL: pending validation backlog` |
| V5 | A regra de variante (§5.2) é suficiente, na prática, para impedir uma repetição do padrão M-4 (limiar institucional citado sob nome errado). | Vetor de teste negativo reconstruindo o cenário M-4 (um limiar institucional citando uma fonte que não o sustenta) contra o processo de aprovação de bundle, uma vez existente. | Ambiente de teste com o processo de aprovação de `ADR-0007` implementado | HAZ-0019; `TST: pending test architecture` |

**Disciplina de placeholder.** Nenhum ID `HAZ`, `SAF`, `REQ`, `TST` ou `VAL` foi inventado
neste documento; todo `HAZ`/`SAF` citado foi lido de `docs/05-clinical-safety/`. `REQ`,
`TST` e `VAL` permanecem placeholders verbatim onde nenhum catálogo existe ainda.

---

## 10. Relações de supersessão

- **Supersede:** nenhuma.
- **Superseded by:** nenhuma.
- **Notas de relação.** Se, no futuro, a edição canônica de qualquer escore mudar (T1/T2/T3
  acima), a mudança deve ser registrada em uma **nova ADR que supersede esta**, ou em uma
  revisão desta mesma ADR enquanto ainda `proposed`/`under-review` — nunca como uma edição
  silenciosa da tabela de §5.1 depois de aceita. Se o Gate G2 retirar MEWS do portfólio
  (SUPERSEDE por NEWS2, per E13), a linha MEWS desta política se torna histórica dentro
  deste mesmo documento (não gera uma ADR separada), e essa disposição deve ser anotada
  explicitamente em uma futura revisão de status.

---

## 11. Checklist de completude (autoverificação do revisor)

- [x] ID estável corresponde ao nome do arquivo (`ADR-0025-score-version-and-variant-selection-policy.md`)
- [x] Status é um dos valores permitidos (`accepted (2026-08-15, GDEC-0007)`)
- [ ] `adr-index.md` reflete este ADR — **NÃO feito**, deliberadamente, por restrição de `write_scope` desta tarefa (ver aviso de proveniência no topo; C7/C9)
- [x] Dono, aprovadores, prazo de decisão presentes (placeholders permitidos; nenhum nome inventado — `owner`/`approvers` citam GDEC-0003, uma decisão já `DECIDED` existente, não uma aprovação nova)
- [x] Autor não está listado como aprovador; pares de independência verificados (§ independence_check no cabeçalho)
- [x] Contexto declara uma pergunta de decisão com fronteira de escopo explícita (§1)
- [x] Toda afirmação material carrega um rótulo de evidência
- [x] Tabela de evidência distingue reverificado (`OBSERVED`) de citado (`SOURCE`) — este documento não reverificou nenhuma fonte primária; toda linha é `SOURCE` ou `INFERENCE`, nunca `OBSERVED`
- [x] Premissas têm condição de invalidação e dono cada uma (§2.2)
- [x] ≥2 alternativas viáveis mais adiar/não-fazer (quatro alternativas operacionais + adiar, §4)
- [x] Toda alternativa tem consequências positivas e negativas
- [x] Drivers são discriminantes e mapeiam para atributos de qualidade mensuráveis (§3)
- [x] Nenhum alvo numérico inventado; alvos não validados leem `VALIDATION REQUIRED`
- [x] Todas as oito linhas de implicação transversal presentes (§7)
- [x] Reversibilidade, gatilhos de revisão e kill/rollback presentes (§8)
- [x] Método de validação com IDs REQ/HAZ/TST vinculados (ou honestamente placeholders) (§9)
- [x] Campos de supersessão presentes (§10)
- [x] Nenhuma tecnologia selecionada por herança do legado ou da AMH — não aplicável a este ADR (não há seleção de tecnologia; é uma política de citação clínica)
- [ ] `adr-index.md` atualizado na mesma mudança — **explicitamente NÃO feito**; ver aviso de proveniência e condições C7/C9. Este item permanece **em aberto** e deve ser resolvido antes que este ADR avance para `under-review`.
