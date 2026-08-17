---
doc_id: VIS-EXCLUSOES-CAPACIDADES-ADIADAS
title: IntensiCare V2 — Exclusões explícitas e capacidades adiadas, consolidadas
status: PROPOSAL
label: PROPOSAL
owner: UNASSIGNED — VALIDAÇÃO NECESSÁRIA
validation_status: VALIDATION REQUIRED
last_updated: 2026-08-16
provenance:
  source_repo: intensicare-V2
  path_or_url: docs/01-vision-and-intended-use/exclusoes-e-capacidades-adiadas.md
  commit_sha_or_version: 32d44e7acaad67d0f49c0e418479123c06e84c31 (branch cycle-6/construcao-g7, HEAD no momento da coleta)
  section_or_lines: documento inteiro
  date_collected: 2026-08-16
  collector: agente de consolidação de exclusões e capacidades adiadas (ciclo 6, SPARK output 15)
  transformation: consolidação por referência — nenhuma fonte citada é alterada, movida ou reescrita; este documento apenas indexa, tabula e reconcilia o que já está declarado alhures
  confidence: medium
  owner: UNASSIGNED — VALIDAÇÃO NECESSÁRIA
  validation_status: VALIDATION REQUIRED
evidence_inputs:
  - repo: intensicare-V2
    path: docs/01-vision-and-intended-use/non-intended-uses.md
    lines_used: "NIU-01..NIU-10, whole document"
  - repo: intensicare-V2
    path: docs/01-vision-and-intended-use/intended-use-statement.md
    lines_used: "§2 IU-04, §3 IU-06/IU-07, §6 IU-12a..IU-12i"
  - repo: intensicare-V2
    path: docs/04-product-requirements/README.md
  - repo: intensicare-V2
    path: docs/07-data-and-provenance/README.md
  - repo: intensicare-V2
    path: docs/10-ux-and-accessibility/README.md
  - repo: intensicare-V2
    path: docs/13-operations-and-reliability/README.md
  - repo: intensicare-V2
    path: docs/16-validation-backlog/README.md
  - repo: intensicare-V2
    path: docs/06-architecture/premissas-de-construcao.md
    lines_used: "PRE-01, PRE-08, PRE-09, PRE-10"
  - repo: intensicare-V2
    path: docs/06-architecture/adrs/adr-index.md
    lines_used: "§1, §3, §4.1, §5"
  - repo: intensicare-V2
    path: docs/06-architecture/adrs/ADR-0009-maquina-de-estados-alerta-item-de-trabalho.md
    lines_used: "W5 (timers de escalada)"
  - repo: intensicare-V2
    path: docs/06-architecture/adrs/ADR-0010-backbone-transacao-outbox-eventos-garantias-de-entrega.md
    lines_used: "H1, §7 operacional, §8.2 T1"
  - repo: intensicare-V2
    path: docs/06-architecture/adrs/ADR-0011-projecoes-de-leitura-e-entrega-tempo-real-autorizada.md
  - repo: intensicare-V2
    path: docs/06-architecture/adrs/ADR-0013-perfis-fhir-hl7-terminologia-writeback.md
  - repo: intensicare-V2
    path: docs/06-architecture/adrs/ADR-0015-autenticacao-sessao-identidade-m2m.md
    lines_used: "D5, Opção A, §7 tabela, T3"
  - repo: intensicare-V2
    path: docs/06-architecture/adrs/ADR-0022-build-dependencias-supply-chain.md
    lines_used: "E11, §2.2 premissa Stryker, Opção A §S8/D4, §8 T1/T2/T5"
  - repo: intensicare-V2
    path: packages/dominio/src/work-item.ts
    lines_used: "comentário JSDoc sobre timers de escalada fora de escopo"
  - repo: intensicare-V2
    path: docs/00-governance/evidence-notation.md
  - repo: intensicare-V2
    path: docs/00-governance/traceability-policy.md
    lines_used: "§1.1 Proposed prefix extensions — PENDING RATIFICATION"
---

# IntensiCare V2 — Exclusões explícitas e capacidades adiadas (consolidado)

> **STATUS: PROPOSAL — NÃO APROVADO.** Este documento não decide, aprova, exclui,
> adia ou reabre nada por si mesmo. Ele **consolida por referência** o que já está
> declarado em `non-intended-uses.md`, `intended-use-statement.md`, nos cinco
> READMEs-stub "deliberadamente vazios" e nos artefatos de construção do ciclo 6
> (`premissas-de-construcao.md` e ADRs 0009–0024). Nenhuma fonte citada é alterada
> por este documento; onde este documento e uma fonte divergirem, **a fonte
> prevalece** e a divergência deve ser corrigida aqui, não lá.
>
> `ECA-nn` são âncoras document-locais de revisão, **não** IDs de catálogo —
> mesmo regime de `NIU-nn`, `IU-nn` e do par `MD`/`MG`/`EPC`/`SPR`/`SR`/`OC` de
> `docs/14-devsecops-and-delivery/`: pendente de ratificação em
> `docs/00-governance/traceability-policy.md` §1.1 antes de qualquer uso como ID
> global de rastreabilidade.

**PREMISSA (reversível, GDEC-0015/0017):** a classificação de três vias usada
neste documento (`EXCLUÍDO` × `UNDECIDED` × `ADIADO`, definidas no §1 abaixo) e o
prefixo document-local `ECA-nn` são escolhas de **estrutura de documento**, não
decisões de escopo clínico, regulatório ou arquitetural — nenhuma delas altera o
conteúdo, o status ou a autoridade de qualquer item consolidado. Uma decisão
futura do titular, ou a ratificação de `ECA` em `traceability-policy.md` §1.1,
substitui esta premissa sem exigir justificativa adicional.

## 0. Por que este documento existe

**INFERENCE** (a partir da tarefa que originou este artefato, SPARK output 15):
as exclusões, os limites não decididos e as capacidades deliberadamente adiadas
do IntensiCare V2 hoje vivem espalhados em pelo menos onze arquivos —
`non-intended-uses.md`, `intended-use-statement.md`, cinco READMEs-stub e cinco
ADRs/premissas de construção. Um leitor que precise responder "o que este
sistema explicitamente não faz, o que ainda está em aberto, e o que foi adiado
de propósito — e sob qual condição cada um desses três estados muda" precisa
hoje ler onze documentos. Este arquivo é esse índice único, sem substituir
nenhuma das fontes.

**Nota de precedência:** as exclusões de `non-intended-uses.md` e as fronteiras
de `intended-use-statement.md` são, elas mesmas, **PROPOSAL — não aprovadas**
(ver o aviso de status no topo de cada uma). Consolidá-las aqui não as promove a
um status mais forte. "EXCLUÍDO" nas tabelas abaixo significa *"a fonte
declara esta exclusão explicitamente"*, não *"esta exclusão está ratificada por
autoridade humana nomeada"* — nenhuma está.

## 1. Como ler as tabelas — os três tipos

| Tipo | Significado | Diferença central |
|---|---|---|
| **EXCLUÍDO** | A fonte declara, com o vocabulário do §2 de `evidence-notation.md`, que este uso, alegação ou capacidade **não é** feito/reivindicado, hoje. É um estado afirmativo negativo — algo foi escrito para ficar de fora. | Diferente de UNDECIDED: aqui existe uma frase declarativa de exclusão a citar, não um silêncio. |
| **UNDECIDED** | A fonte declara explicitamente que a questão está em aberto — **nem incluída, nem excluída** — aguardando decisão de autoridade nomeada. | Diferente de EXCLUÍDO: nenhuma frase de exclusão existe; existe uma frase de "ainda não decidido". Tratar um item UNDECIDED como se fosse EXCLUÍDO (ou vice-versa) inverte o ônus da prova. |
| **ADIADO** | A capacidade **é** parte da direção aceita (arquitetural ou de conteúdo de documento) mas sua construção/redação foi conscientemente postergada nesta fatia, com um gatilho objetivo de retomada já nomeado na própria fonte. | Diferente de EXCLUÍDO: não há intenção de excluir — há um "ainda não", com critério de "quando". Diferente de UNDECIDED: a *direção* já foi aceita (GDEC-0016/0017); o que falta é a *construção*, não a *decisão*. |

Nenhuma linha abaixo fecha gate, bloqueador, risco ou hazard. Nenhuma linha
constitui alegação de efetividade clínica, conformidade regulatória ou
segurança comprovada. Nenhuma linha presume aprovação humana onde a fonte não a
registra.

---

## 2. EXCLUÍDO — usos não pretendidos (`non-intended-uses.md`, NIU-01..NIU-10)

Fonte: `docs/01-vision-and-intended-use/non-intended-uses.md`. Documento
PROPOSAL, aprovador `AUTH-INTENDED-USE` — UNASSIGNED. Todas as linhas abaixo
preservam o rótulo epistêmico original (majoritariamente SOURCE/INFERENCE
`[behavioural]`/`[governance]`, com `VALIDATION REQUIRED` pontual) — ver a
fonte para o texto completo de cada base.

| ECA | Item excluído | Fonte | Critério objetivo de reentrada/decisão | Autoridade |
|---|---|---|---|---|
| ECA-01 | Substituto de dispositivo médico diagnóstico, exame clínico, julgamento clínico ou avaliação independente de médico/enfermeiro | NIU-01 | Classificação regulatória ANVISA determinada **e** validação diagnóstica formal realizada; a exclusão é redesenhada para se manter válida sob qualquer resultado dessa classificação (não desaparece com ela) | `AUTH-PRIVACY-LEGAL` (classificação regulatória) + `AUTH-CLINSAFETY` (validação diagnóstica) |
| ECA-02 | Ação clínica autônoma — iniciar, ordenar, ajustar, suspender, agendar ou cancelar intervenção; auto-resolução ou expiração-para-fechado de item de trabalho sem ator humano | NIU-02 | Política de visibilidade de escalada versionada e aprovada — mas a linha entre "mudar quem vê o quê" (permitido) e "mudar o que acontece ao paciente" (excluído) permanece, mesmo após a política existir | `AUTH-CLINSAFETY` (regra: "autores de regra não aprovam seu próprio conteúdo clínico", `decision-rights.md`) |
| ECA-03 | Sistema de registro (system of record) do prontuário/EHR; fonte autoritativa de identidade, encontro, ordens, resultados ou medicação do paciente | NIU-03 | Decisão sobre se uma ação de item de trabalho da V2 precisa ser escrita de volta ao EHR do hospital, e se essa escrita passa a integrar o prontuário legal | `AUTH-PRIVACY-LEGAL` + `AUTH-DATA-PLATFORM` |
| ECA-04 | Uso com população, ambiente de cuidado, site ou classe de dispositivo fora do aprovado em `intended-use-statement.md` §§2–3 (NIU-04, guarda-chuva) | NIU-04 | Ver linhas UNDECIDED da §3 abaixo (IU-04a..f, IU-06) — a exclusão-guarda-chuva permanece até cada sub-decisão de escopo ser resolvida individualmente | `AUTH-INTENDED-USE` |
| ECA-04a | Sub-item: idiomas além de pt-BR | NIU-04d | Nenhum critério de reentrada declarado — dependeria de nova decisão de escopo de idioma, não coberta pelas fontes revisadas | `AUTH-INTENDED-USE` |
| ECA-04b | Sub-item: classes de dispositivo não validadas (ex.: dispositivo pessoal, quiosque compartilhado) | NIU-04e | Verificação de alvo de toque, zoom/reflow e leitor de tela per `docs/10-ux-and-accessibility/` (ver ECA-30 abaixo — depende de Gate G1) | `AUTH-UX` |
| ECA-05 | Resposta/renderização de MCP ou de modelo generativo como substituto do registro determinístico de avaliação versionado e assinado | NIU-05 | Estrutural — nenhum gatilho de relaxamento é proposto; a fonte trata "determinístico" e "generativo" como propriedades mutuamente exclusivas para o mesmo artefato | `AUTH-CLINSAFETY` |
| ECA-06 | Ferramenta de alocação de equipe, prioridade de leito/UTI, faturamento/reembolso, avaliação de desempenho individual de clínico, ou processo disciplinar/trabalhista | NIU-06 | Base legal trabalhista/sindical brasileira estabelecida **e** confirmação de que o risco de distorção comportamental (clínico que sabe que o reconhecimento é medido age diferente) foi endereçado | `AUTH-PRIVACY-LEGAL` (implicações trabalhistas) + `AUTH-CLINSAFETY` (razão de segurança clínica) |
| ECA-07 | Base de dados de pesquisa, treinamento de algoritmo, benchmarking de qualidade ou qualquer uso secundário de dado clínico retido pela V2 | NIU-07 | Base legal, aprovação e governança separadas e explicitamente estabelecidas para o uso secundário pretendido (inclui a própria medição de `success-and-harm-metrics.md`, citada na fonte como caso dentro desta exclusão até ter base própria) | `AUTH-PRIVACY-LEGAL` |
| ECA-08 | Sistema de alarme fisiológico em tempo real; substituto de alarme de monitor à beira-leito; notificação time-critical cuja falha passaria despercebida | NIU-08 | Resposta arquitetural de que a V2 v1 tem (ou não) qualquer lane near-real-time (questão aberta de Gate G3 / `docs/08-interoperability/amh-data/`) | `AUTH-DATA-PLATFORM` + `AUTH-CLINSAFETY` |
| ECA-09 | Fonte de verdade sobre estado atual do paciente quando a V2 está degradada, desconectada, obsoleta (`stale`) ou parcialmente falha | NIU-09 | Definição do que clínicos devem fazer quando a V2 está degradada — questão de fluxo de trabalho hoje sem resposta (`WF-05` em `../02-users-and-workflows/workflow-hypotheses.md`) | `AUTH-CLINSAFETY` |
| ECA-10 | Qualquer uso aprovado da V2, de qualquer tipo, na data de coleta da fonte (2026-08-14) | NIU-10 | Qualquer aprovação nomeada e registrada de qualquer uso pretendido — nenhuma existe | `AUTH-INTENDED-USE` |

---

## 3. UNDECIDED — fronteiras explicitamente não decididas

**Distinção deliberada da §2 acima:** as linhas desta seção não carregam frase
de exclusão na fonte. Elas carregam a palavra `UNDECIDED` ou
`VALIDATION REQUIRED` de forma explícita, com a nota de que o item está **"nem
incluído, nem excluído."** Tratá-las como excluídas anteciparia uma decisão que
ninguém tomou; tratá-las como incluídas ignoraria a mesma frase.

### 3.1 Ambientes de cuidado (`intended-use-statement.md` §2, IU-04)

| ECA | Item não decidido | Fonte | Critério objetivo de reentrada/decisão | Autoridade |
|---|---|---|---|---|
| ECA-11 | Cuidado intermediário / step-down | IU-04a | Coleta de evidência sobre cadência de monitorização, disponibilidade de dado e razão de equipe nesse ambiente; decisão de `AUTH-INTENDED-USE` | `AUTH-INTENDED-USE` |
| ECA-12 | Enfermaria geral | IU-04b | Mesma coleta; densidade de dado e frequência de observação divergem materialmente da UTI (`../03-domain/status-dimensions.md`) | `AUTH-INTENDED-USE` |
| ECA-13 | Time de resposta rápida (RRT) / fluxo móvel | IU-04c | Nenhuma jornada móvel foi estabelecida nem no legado nem na V2; decisão requer evidência de fluxo de trabalho observado | `AUTH-INTENDED-USE` |
| ECA-14 | Centro de comando multi-unidade / multi-site | IU-04d | Modelo de identidade de agregação cross-organização resolvido (grão de tenant AMH hoje não cobre isso) | `AUTH-INTENDED-USE` + `AUTH-DATA-PLATFORM` |
| ECA-15 | Pronto-socorro | IU-04e | Nenhuma evidência revisada aborda este ambiente; decisão requer coleta nova, não apenas leitura do que já existe | `AUTH-INTENDED-USE` |
| ECA-16 | Transporte inter-hospitalar / pré-hospitalar | IU-04f | Premissas de conectividade do laço de segurança não se sustentam neste ambiente sem revisão própria | `AUTH-INTENDED-USE` |

Cada linha acima exige, adicionalmente, per `intended-use-statement.md` §2:
validação clínica separada de desempenho de escore/via *naquele* ambiente
específico, porque desempenho não transfere entre ambientes por suposição.

### 3.2 População pediátrica/neonatal — decisão bloqueante (`intended-use-statement.md` §3, IU-06)

| ECA | Item não decidido | Fonte | Critério objetivo de reentrada/decisão | Autoridade |
|---|---|---|---|---|
| ECA-17 | Pediátrico está no escopo da V2 v1? | IU-06, linha 1 da tabela | Decisão nomeada — **bloqueante**: a arquitetura de gating etário (ADR-0027) não pode prosseguir sem ela | `AUTH-INTENDED-USE` + `AUTH-CLINSAFETY` (ambas UNASSIGNED na fonte) |
| ECA-18 | Neonatal está no escopo da V2 v1? | IU-06, linha 2 | Mesma decisão nomeada, bloqueante | `AUTH-INTENDED-USE` + `AUTH-CLINSAFETY` |
| ECA-19 | Comportamento da V2 quando um leito monitorado é ocupado por paciente fora da população aprovada | IU-06, linha 3 | Decisão de comportamento do sistema (renderizar não-avaliado, nunca escore/`normal`) — bloqueante para arquitetura | `AUTH-CLINSAFETY` |
| ECA-20 | Comportamento da V2 quando idade/data de nascimento está ausente, ilegível ou conflitante | IU-06, linha 4 | Mesma decisão de comportamento, bloqueante | `AUTH-CLINSAFETY` |

**Nota:** `intended-use-statement.md` registra uma **PROPOSAL** (pendente das
quatro decisões acima) de que pediátrico/neonatal fiquem excluídos por
default até decisão em contrário — mas o próprio documento marca essa
proposta como não decidida, então ela permanece nesta seção UNDECIDED e não na
§2 EXCLUÍDO.

### 3.3 Subpopulações não endereçadas (`intended-use-statement.md` §3, IU-07)

| ECA | Item não decidido | Fonte | Critério objetivo de reentrada/decisão | Autoridade |
|---|---|---|---|---|
| ECA-21 | Gestação / cuidado crítico obstétrico | IU-07 | Nenhuma evidência revisada aborda esta subpopulação; decisão de `AUTH-CLINSAFETY` necessária antes de inclusão ou exclusão formal | `AUTH-CLINSAFETY` |
| ECA-22 | Pacientes em suporte extracorpóreo (ECMO/CRRT) cuja fisiologia pode invalidar premissas de escore | IU-07 | Mesma decisão pendente | `AUTH-CLINSAFETY` |
| ECA-23 | Pacientes sob metas de cuidado paliativo/conforto, onde um prompt de escalada pode ser clinicamente inadequado | IU-07 | **INFERENCE da fonte:** este caso é qualitativamente diferente dos demais — o sistema pode estar tecnicamente correto e clinicamente errado; registrado no backlog G1 como questão adjacente a hazard, não apenas de escopo | `AUTH-CLINSAFETY` |
| ECA-24 | Pacientes de pós-operatório cardíaco com derangement fisiológico esperado pelo protocolo | IU-07 | Mesma decisão pendente | `AUTH-CLINSAFETY` |
| ECA-25 | Pacientes com ordens documentadas de limitação terapêutica | IU-07 | Mesma decisão pendente | `AUTH-CLINSAFETY` |

---

## 4. EXCLUÍDO — alegações explicitamente não feitas (`intended-use-statement.md` §6, IU-12a..IU-12i)

Fonte: `intended-use-statement.md` §6, "Claims explicitly NOT made" — regra 11
do prompt orquestrador, citada na fonte: "Do not claim clinical effectiveness,
regulatory compliance, security, availability, or AMH compatibility without
corresponding evidence and named approval." Diferente da §2 (usos excluídos),
esta seção lista **alegações de propriedade do produto** que a V2 explicitamente
não faz — uma alegação de conformidade/efetividade excluída, não um uso
excluído.

| ECA | Alegação não feita | Fonte | Critério objetivo de reentrada/decisão | Autoridade |
|---|---|---|---|---|
| ECA-26 | Alegação regulatória (dispositivo médico registrado, ANVISA, CE, FDA) | IU-12a | Classificação regulatória determinada; parecer de assessoria jurídica brasileira nomeada | `AUTH-PRIVACY-LEGAL` + `AUTH-CLINSAFETY` |
| ECA-27 | Alegação de efetividade clínica (mortalidade, tempo de internação, deterioração perdida) | IU-12b | Estudo prospectivo conduzido; ver `success-and-harm-metrics.md` | `AUTH-CLINSAFETY` |
| ECA-28 | Alegação de acurácia diagnóstica (sensibilidade/especificidade/VPP/VPN) | IU-12c | Medição formal realizada — nenhuma existe na V2 até a data de coleta | `AUTH-CLINSAFETY` |
| ECA-29 | Alegação de compatibilidade AMH | IU-12d | Compatibilidade testável em revisão fixada, per Gate G3 (`docs/08-interoperability/amh-data/`) | `AUTH-DATA-PLATFORM` |
| ECA-30 | Alegação de conformidade FHIR/HL7 | IU-12e | Versões, perfis e cenários nomeados e testados; ver ADR-0013 (perfis FHIR restritos, direção aceita GDEC-0016) | `AUTH-DATA-PLATFORM` |
| ECA-31 | Alegação de segurança, disponibilidade ou desempenho (SLO/uptime/latência) | IU-12f | Ambiente similar-a-produção com medição real, não meta declarada; ver ADR-0020 (`not-started`→minuta ciclo 6) | `AUTH-OPERATIONS` |
| ECA-32 | Alegação de conformidade de acessibilidade (nível WCAG) | IU-12g | Verificação de contraste, zoom/reflow, ordem de leitura de leitor de tela e operação por teclado — hoje `[V] não verificado`; depende de Gate G1 (ver ECA-34) | `AUTH-UX` |
| ECA-33 | Alegação de adequação de fluxo de trabalho validado | IU-12h | Inquérito contextual do Gate G1 (`../02-users-and-workflows/user-research-plan.md`) executado e reconciliado — **INFERENCE da fonte:** esta é a alegação com maior risco de ser feita acidentalmente (demonstração, captura de tela, slide) | `AUTH-INTENDED-USE` |
| ECA-34a | Alegação de generalização de população/ambiente | IU-12i | Ver ECA-11..ECA-25 (§3 acima) | `AUTH-INTENDED-USE` |

---

## 5. ADIADO — READMEs-stub "deliberadamente vazios" (§16 hierarquia)

Cada um dos cinco diretórios abaixo tem front matter próprio com `status:
PROPOSAL` e um README que declara, por design, ausência de conteúdo — não
omissão. O gatilho de desbloqueio de cada um está citado verbatim ou
parafraseado da fonte.

| ECA | Diretório vazio | Fonte | Critério objetivo de reentrada/decisão | Autoridade |
|---|---|---|---|---|
| ECA-34 | `docs/04-product-requirements/` — catálogo de requisitos PRD/USR | `docs/04-product-requirements/README.md` (`STUB-04-PRODUCT-REQUIREMENTS`) | Gate G1 passa (fluxos de trabalho observados + aprovador de uso pretendido nomeado); os ADRs em `docs/06-architecture/adrs/` carregam placeholders `REQ:` a substituir por IDs PRD/USR reais quando este diretório for populado | `AUTH-INTENDED-USE` (Gate G1) |
| ECA-35 | `docs/07-data-and-provenance/` — esquema físico de dado/proveniência | `docs/07-data-and-provenance/README.md` (`STUB-07-DATA-AND-PROVENANCE`) | ADR-0005 e ADR-0006 alcançam `accepted` — **INFERENCE (observação desta consolidação, não da fonte):** per `docs/06-architecture/adrs/adr-index.md` §3, ADR-0005 está `accepted` desde 2026-08-15 (GDEC-0008) e ADR-0006 está `accepted` desde 2026-08-16 (GDEC-0016, Opção A); o README-stub, datado 2026-08-15, ainda não foi atualizado para refletir isso — este é um achado a levar ao dono do stub, não uma decisão deste documento | `AUTH-DATA-PLATFORM` |
| ECA-36 | `docs/10-ux-and-accessibility/` — arquitetura de informação/UX | `docs/10-ux-and-accessibility/README.md` (`STUB-10-UX-ACCESSIBILITY`) | Inquérito contextual do Gate G1 entrega relatórios de fluxo de trabalho observado; então arquitetura de informação, design de estado de interação e tabelas de contrato UI/backend por tela (prompt §11) entram, sob os testes de coerência do Gate G4 | `AUTH-UX` (Gate G1/G4) |
| ECA-37 | `docs/13-operations-and-reliability/` — SLOs/operação | `docs/13-operations-and-reliability/README.md` (`STUB-13-OPERATIONS-RELIABILITY`) | Gate G1 valida necessidade de usuário/segurança **e** ADR-0019/ADR-0020 são aceitas — **INFERENCE (observação desta consolidação):** ambas já constam `accepted` (direção GDEC-0016) em `adr-index.md`, mas o Gate G1 (pré-condição conjunta) permanece aberto; as 29 cenas de atributo de qualidade candidatas em `docs/06-architecture/quality-attributes/quality-attribute-scenarios.md` já existem, todas com `target: VALIDATION REQUIRED` | `AUTH-OPERATIONS` (Gate G1) |
| ECA-38 | `docs/16-validation-backlog/` — backlog central de validação | `docs/16-validation-backlog/README.md` (`STUB-16-VALIDATION-BACKLOG`) | Uma ADR resolve se o backlog é centralizado aqui ou se o layout distribuído atual (G1/G2/adjudicação-de-identidade/G6, listados na própria fonte) é ratificado com este README como índice — nenhuma autoridade de ADR é nomeada na fonte para esta decisão específica | Não nomeada na fonte (autoridade da ADR que vier a resolver) |

---

## 6. ADIADO — capacidades da construção do ciclo 6 (SPR-G7-1)

Fonte primária: `docs/06-architecture/premissas-de-construcao.md` (premissas
PRE-01, PRE-08, PRE-09, PRE-10) e os ADRs 0009–0024 que cada premissa cita como
seu tópico mais próximo. Todos os seis itens abaixo têm **direção já aceita**
(GDEC-0016/0017) — a construção, não a decisão, é o que está pendente; por
isso são `ADIADO`, não `UNDECIDED`.

| ECA | Capacidade adiada | Fonte | Critério objetivo de reentrada/decisão | Autoridade |
|---|---|---|---|---|
| ECA-39 | SBOM, atestado de proveniência assinado e verificação de assinatura de artefato no deploy | ADR-0022 §S8/D4 (Opção A aceita, GDEC-0016); `premissas-de-construcao.md` PRE-01 cita o mesmo ADR | Nomeado como pendência do **Gate G8**; gatilho antecipado (T1 do ADR): fecha a condição C2 do ADR-0019 (fornecedor/registro de artefato selecionado) → inicia a construção de S8 (SBOM/proveniência/assinatura) contra o registro real; gatilho adicional (T2): aproximação do Gate G8 transforma S8 de pendência em condição bloqueante de promoção | `AUTH-SECURITY` + `AUTH-OPERATIONS` |
| ECA-40 | SMART on FHIR como perfil de autenticação/escopo | ADR-0015 D5 e §7 tabela ("SMART fica como perfil de escopos sobre o mesmo verificador; nenhuma conformidade é alegada"); ADR-0013 (perfis FHIR) | Gatilho T3 do ADR-0015: "SMART on FHIR passa a ser exigido por um consumidor real" → abrir perfil de escopos em ADR-0013 sem alterar o verificador OIDC já construído; gatilho alternativo T1: a AMH resolve a divergência de três vias da TB-05 e publica a posição implantada | `AUTH-DATA-PLATFORM` |
| ECA-41 | Testes de mutação (Stryker) sobre o kernel clínico determinístico | `premissas-de-construcao.md` PRE-08 ("testes baseados em propriedade... e testes de mutação (Stryker) ficam como pendência registrada — não implementados nesta fatia"); ADR-0022 §2.2 premissa; `mapa-de-projeto-ate-producao.md` linhas SPR-G2-3/SPR-G6-2/SPR-G7-2 (citado como leitura de contexto, não como fonte alterável por este documento) referenciam "kernel com mutation testing" como condição de controles SAF de alta severidade | Nenhum ADR dedicado existe para estratégia de teste entre os 24 do `adr-index.md`; o gatilho objetivo mais próximo na fonte é a própria fatia de segurança (SPR-G6-2/SPR-G7-2): controles SAF de alta severidade "implementados e verificados no código" exigindo mutação sobre o kernel | Não nomeada — nenhuma ADR de estratégia de teste tem titular decisor candidato registrado |
| ECA-42 | Server-Sent Events (SSE) com cursores para entrega em tempo real | `premissas-de-construcao.md` PRE-09 ("quando implementada — nenhuma fatia entregue até agora inclui essa superfície"); ADR-0011 (projeções de leitura e gateway realtime autorizado, Opção A aceita GDEC-0008) | Construção da superfície SSE sobre o gateway único autorizado por push já decidido em ADR-0011 (projeções server-side + autorização por push avaliada a cada push, cursores, filas limitadas); nenhum gatilho de data é registrado — é item de backlog de implementação, não de decisão | `AUTH-PRODUCT` + `AUTH-SECURITY` (autoridade candidata do ADR-0011) |
| ECA-43 | Relay do outbox — validação de latência/carga sob volume real | ADR-0010 H1 ("O relay do outbox (polling ou tailing) sustenta a latência exigida pelo laço com folga sob o volume A2" — estado **UNTESTED**); §7 tabela operacional ("Relay, lag de outbox, DLQ... viram deveres operacionais com dono de plantão") | H1 muda de `UNTESTED` para testado via testes de carga na fatia G7 com fixtures sintéticas (percentis outbox→consumidor), per a própria hipótese na fonte; gatilho de revisita T1 do §8.2: "Lag medido do relay/outbox excede o limiar declarado... sob carga real" → executar a migração de classe de transporte prevista em B9 | `AUTH-OPERATIONS` (execução do teste) + verificador independente (per regra autor≠verificador) |
| ECA-44 | Timers de escalada — valores numéricos e disparo executável | ADR-0009 W5 ("Nenhum valor numérico é proposto aqui — VALIDATION REQUIRED... Timers são duráveis e re-armáveis a partir do estado persistido"); código-fonte `packages/dominio/src/work-item.ts` (comentário JSDoc: "timers de escalada/expiração ficam fora de escopo: ADR-0009 W5 marca os valores como VALIDATION REQUIRED") | Valores default por via/classe **vêm do bundle de regra** (ADR-0007) — portanto o gatilho é: um rule bundle concreto, assinado e aprovado por aprovador independente do autor (ADR-0007), define os valores numéricos por via/classe; configuração local de site só pode apertar (nunca afrouxar) esses valores publicados | `AUTH-CLINSAFETY` (autor do conteúdo clínico) + aprovador independente nomeado (ADR-0007, autor≠aprovador); cláusulas de UX de ADR-0009 permanecem `AUTH-UX` — UNASSIGNED |

---

## 7. O que este documento não faz

Não aprova, ratifica, decide, exclui, inclui, adia ou antecipa nada que as
onze fontes citadas já não digam. Não fecha nenhum gate G0–G8. Não cria
nenhuma nova alegação de efetividade clínica, conformidade regulatória ou
segurança. Não presume aprovação humana onde a fonte registra
`UNASSIGNED — VALIDAÇÃO NECESSÁRIA`. Não atribui prazo a nenhum item — nenhuma
das fontes atribui prazo, e este documento não inventaria um. Onde este
documento observa uma aparente defasagem entre uma fonte e outra (ECA-35,
ECA-37 — READMEs-stub cujo gatilho de ADR já parece satisfeito segundo
`adr-index.md`, mas cujo próprio texto não foi atualizado), essa observação é
rotulada `INFERENCE (observação desta consolidação)` e endereçada ao dono do
stub original, não resolvida aqui.

## 8. Referências cruzadas

- `non-intended-uses.md` — texto integral de NIU-01..NIU-10 (§2 acima).
- `intended-use-statement.md` — texto integral de IU-04, IU-06, IU-07, §6
  (§§3–4 acima).
- `docs/04-product-requirements/README.md`, `docs/07-data-and-provenance/README.md`,
  `docs/10-ux-and-accessibility/README.md`, `docs/13-operations-and-reliability/README.md`,
  `docs/16-validation-backlog/README.md` — texto integral de cada stub (§5 acima).
- `docs/06-architecture/premissas-de-construcao.md` — PRE-01..PRE-11 (§6 acima usa
  PRE-01, PRE-08, PRE-09, PRE-10).
- `docs/06-architecture/adrs/adr-index.md` — status corrente de todas as 29 ADRs.
- `docs/06-architecture/adrs/ADR-0009-maquina-de-estados-alerta-item-de-trabalho.md`,
  `ADR-0010-backbone-transacao-outbox-eventos-garantias-de-entrega.md`,
  `ADR-0011-projecoes-de-leitura-e-entrega-tempo-real-autorizada.md`,
  `ADR-0013-perfis-fhir-hl7-terminologia-writeback.md`,
  `ADR-0015-autenticacao-sessao-identidade-m2m.md`,
  `ADR-0022-build-dependencias-supply-chain.md` — fonte de §6.
- `docs/00-governance/evidence-notation.md` — vocabulário de rótulo epistêmico usado
  em todas as fontes citadas.
- `docs/00-governance/traceability-policy.md` §1.1 — regime de ratificação pendente
  para prefixos document-locais, incluindo `ECA` deste documento.
