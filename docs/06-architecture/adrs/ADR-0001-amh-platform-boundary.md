---
id: ADR-0001
title: Fronteira de plataforma pretendida entre o IntensiCare V2 e a plataforma de dados AMH
status: accepted (2026-08-15, GDEC-0008)
status_history:
  - status: not-started
    date: 2026-08-14
    by: engenheiro de arquitetura candidata e do programa de ADRs (Onda 2)
    note: ID reservado em adr-index.md
  - status: proposed
    date: 2026-08-14
    by: engenheiro de arquitetura candidata e do programa de ADRs (Onda 2)
    note: >
      Opções, direcionadores, hipótese-a-testar e condições de aceitação redigidas a
      partir do prompt §7.0/§7.3 e do dossiê AMH da Onda 1. NENHUMA decisão está
      registrada e nenhuma pode ser inferida. Esta ADR não pode avançar além de
      `proposed` até que um titular humano seja nomeado (Gate G0).
  - status: proposed
    date: 2026-08-15
    by: arquiteto de decisões de fronteira e modelo canônico
    note: >
      REVISÃO (sem mudança de status): incorpora o estado de 2026-08-15 — a ata de
      adjudicação AQ-1..AQ-6 lida em disco, as ordens de serviço AMH (OS-17/18/19 como
      cláusulas vinculantes do contrato v1) e as dependências que seguem abertas
      (C-1 vitais, só `dev` existe, camada 4 sem evidência). A hipótese §7.0 é
      desenvolvida como proposta encaminhada ao titular em §5.2. Corpo original em EN
      preservado para auditabilidade do diff; conteúdo novo em pt-BR (DEC-G0-10).
  - status: accepted (2026-08-15, GDEC-0008)
    date: 2026-08-15
    by: rodaquino-OMNI (titular) — transcrito por escriba de decisão-transcrição de ADR
    note: >
      Aceito por escrito pelo titular na sessão de decisão GDEC-0008 (item 4;
      `docs/00-governance/registers/decision-register.md`), com a formulação própria
      do titular como a posição decidida — ver §5.0 e a nota de composição obrigatória
      ali registrada (interação com GDEC-0008 item 2, C-1 = O3). Nenhum agente decidiu
      — transcrição de decisão já tomada.
date: 2026-08-15
owner: rodaquino-OMNI — detém AUTH-DATA-PLATFORM e a autoridade do lado AMH (DEC-G0-04); ADR aceito por escrito em GDEC-0008 item 4
approvers:
  - rodaquino-OMNI — AUTH-DATA-PLATFORM (DEC-G0-04); aceito em GDEC-0008 item 4
  - rodaquino-OMNI — AUTH-AMH-OWNER (DEC-G0-04, DEC-G0-08); aceito em GDEC-0008 item 4
  - UNASSIGNED — VALIDAÇÃO NECESSÁRIA   # papel candidato: AUTH-CLINSAFETY (consequências do laço de segurança) — não exigido pela deciding_authority_rule desta ADR
  - UNASSIGNED — VALIDAÇÃO NECESSÁRIA   # papel candidato: AUTH-PRIVACY-LEGAL (consequências de controller/processor) — não exigido pela deciding_authority_rule desta ADR
decision_deadline: NÃO DEFINIDO — VALIDAÇÃO NECESSÁRIA
deciding_authority_rule: >
  docs/00-governance/decision-rights.md §2, linha "Aceitação de contrato/fronteira
  AMH": AUTH-DATA-PLATFORM em conjunto com AUTH-AMH-OWNER. Agentes podem redigir o
  dossiê e as opções de fronteira; agentes NÃO podem aceitar o contrato ou a fronteira.
independence_check: >
  O arquiteto de compatibilidade de dados AMH (Onda 1) e este engenheiro do programa de
  ADRs (Onda 2) são ambos preparadores. Nenhum dos dois pode aprovar. Per
  decision-rights.md §3 par 4 (implementador do conector ≠ aceitador de conformidade
  externa), o especialista que mais tarde implementar o adaptador AMH não pode aceitar
  a evidência de conformidade AMH para esta fronteira.
links:
  drivers:
    domain_invariants: [DOM-0001, DOM-0002, DOM-0004, DOM-0006, DOM-0008, DOM-0009]
    quality_scenarios: [QAS-0001, QAS-0002, QAS-0003, QAS-0004, QAS-0005, QAS-0006, QAS-0007, QAS-0010, QAS-0012, QAS-0013, QAS-0014, QAS-0015, QAS-0018, QAS-0019, QAS-0023, QAS-0027, QAS-0028]
    risks: ["IDs pendentes no registro de riscos — ver docs/00-governance/registers/risk-register.md"]
  constrains:
    requirements: ["REQ: catálogo de requisitos pendente (docs/04-product-requirements ainda não criado)"]
    clinical: ["CLR: portfólio de vias pendente (Gate G2)"]
    safety: [SAF-0002, SAF-0007, SAF-0008, SAF-0009, SAF-0010, SAF-0011, SAF-0025, SAF-0026, SAF-0028, SAF-0029, SAF-0031, SAF-0032, SAF-0033, SAF-0035, SAF-0036]
  hazards: [HAZ-0003, HAZ-0005, HAZ-0006, HAZ-0007, HAZ-0010, HAZ-0013, HAZ-0025, HAZ-0027, HAZ-0030, HAZ-0032, HAZ-0034, HAZ-0038, HAZ-0039, HAZ-0040]
  tests: ["TST: arquitetura de testes pendente"]
  validations: ["VAL: backlog de validação pendente"]
  adrs:
    depends_on: []
    feeds: [ADR-0002, ADR-0003, ADR-0004, ADR-0005, ADR-0006, ADR-0013, ADR-0015, ADR-0019]
  gates: [G3]
  evidence:
    - docs/08-interoperability/amh-data/compatibility-finding.md
    - docs/08-interoperability/amh-data/four-layer-dossier.md
    - docs/08-interoperability/amh-data/contract-inventory.md
    - docs/08-interoperability/amh-data/open-questions-for-amh-owners.md
    - docs/08-interoperability/amh-data/claim-verification-matrix.md
    - docs/08-interoperability/amh-data/identity-adjudication/adjudicacao-decisoes-2026-08-15.md
    - docs/08-interoperability/amh-data/ordens-de-servico-amh-2026-08-15.md
supersedes: null
superseded_by: null
provenance:
  source_repo: intensicare-V2
  path_or_url: docs/06-architecture/adrs/ADR-0001-amh-platform-boundary.md
  commit_sha_or_version: 0c36f03 (HEAD do repositório na revisão de 2026-08-15; esta revisão estava não commitada)
  section_or_lines: >
    INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §7.0 (linhas 355-367), §7.3 (linhas 422-436),
    §7.4, §7.5, §7.6, Gate G3 (linhas 504-515), §9.1, §10 item 1; ata IDN-ADJ-2026-08-15
    §2, §4, §6; ordens de serviço AMH §6 (OS-17/18/19), §9 (o que segue aberto)
  date_collected: 2026-08-14
  collector: engenheiro de arquitetura candidata e do programa de ADRs (Onda 2); revisão 2026-08-15 pelo arquiteto de decisões de fronteira e modelo canônico
  transformation: >
    reasoned-from — opções e direcionadores derivados do prompt e do dossiê AMH da
    Onda 1. Esta ADR não realizou NENHUMA verificação independente de nenhum artefato
    AMH e não fez nenhuma chamada de rede para nenhum ambiente AMH.
  confidence: média
  owner: rodaquino-OMNI
  validation_status: >
    N/A — ADR aceita pelo titular (GDEC-0008 item 4). A nota de composição sobre a
    interação com GDEC-0008 item 2 (C-1 = O3) permanece marcada "sujeita a confirmação
    do titular" — ver §5.0. Demais condições de §5.1 seguem VALIDAÇÃO NECESSÁRIA.
---

# ADR-0001 — Fronteira de plataforma pretendida entre o IntensiCare V2 e a plataforma de dados AMH

> Traduzido EN→pt-BR em 2026-08-15 (GDEC-0008 item 8, tranche 2); original EN preservado no histórico git.

> **Status: `accepted (2026-08-15, GDEC-0008)`.** O titular (rodaquino-OMNI) aceitou
> este ADR por escrito na sessão de decisão GDEC-0008 (item 4), com sua própria
> formulação — **"a V2 SEMPRE consome dados da AMH; nunca ingestão direta"** — como a
> posição decidida da fronteira. Ver §5.0 para o registro completo, incluindo a nota de
> composição obrigatória sobre a interação com GDEC-0008 item 2 (C-1 = O3). **Aceito não
> significa implantado nem verificado** — as doze condições de §5.1 continuam a governar
> a operacionalização.

> **Adendo de revisão — 2026-08-15 (pt-BR).** Esta revisão incorpora o estado de
> 2026-08-15 **sem alterar o status `proposed`**: (i) as restrições **DECIDED** de
> AQ-3/AQ-4/AQ-5/AQ-6 passam a vincular *todas* as opções de fronteira — ver §2.4;
> (ii) as ordens de serviço AMH tornam OS-17 (eventos de ciclo de vida), OS-18
> (`resolve(ref, as_of)`) e OS-19 (pacote de contrato v1) cláusulas vinculantes do
> contrato, com efeito direto no Gate G3; (iii) as dependências honestas permanecem
> registradas: a contradição **C-1 (sinais vitais) segue aberta**, **apenas `dev`
> existe** do lado AMH, e a **camada 4 (aptidão operacional) segue sem evidência**;
> (iv) a hipótese §7.0 é desenvolvida como **proposta encaminhada ao titular** em §5.2 —
> rotulada PROPOSAL, jamais decisão. **Política de idioma (DEC-G0-10):** o corpo EN do
> ciclo 0 é preservado intacto para auditabilidade do diff; todo conteúdo novo desta
> revisão está em pt-BR. A tradução retroativa do corpo permanece decisão em aberto do
> titular (registrada no `adr-index.md`).

---

## 1. Contexto e enunciado do problema

O IntensiCare V2 é uma plataforma greenfield de apoio à decisão clínica cujo laço mínimo
de segurança (SOURCE, prompt §1) corre de insumo clínico confiável, passando por
validação de identidade/proveniência/qualidade e avaliação determinística versionada,
até um item de trabalho durável e explicável, uma ação humana autorizada, e auditoria
imutável. Todo estágio desse laço exige dado clínico que a V2 não gera por si própria.

A plataforma de dados AMH (`Omni-Saude/amh-data-platform`) é a fonte candidata. SOURCE
(prompt §7.3, linhas 422–428) exige que esta ADR resolva se a V2 é:

1. um consumidor da AMH com seu próprio armazenamento operacional crítico para
   segurança;
2. um módulo AMH implantado dentro da fronteira da plataforma;
3. um híbrido com uma lane AMH quase em tempo real mais reconciliação analítica;
4. outro modelo explicitamente justificado.

**Pergunta.** Onde fica a fronteira de accountability, hospedagem, e propriedade de
dado entre o IntensiCare V2 e a plataforma de dados AMH — especificamente: quem é dono
do armazenamento operacional crítico para segurança, quem é responsável pela latência e
disponibilidade do laço de segurança, e por qual(is) lane(s) os sinais clínicos chegam
à V2?

**Por que agora.** INFERENCE: a fronteira é o nó arquitetural mais a montante do
programa — `adr-index.md` §4.3 registra que oito ADRs dependem dela diretamente e todas
as demais, exceto uma, dependem dela transitivamente. Adiá-la custa valor de opção em
toda ADR dependente; decidi-la sem evidência do Gate G3 violaria a instrução explícita
do prompt §7.0 de "ratificar ou rejeitar esta hipótese por meio de evidência e ADRs."

**Fora de escopo para esta ADR** (cada item nomeado para prevenir scope creep):

- Seleção de transporte (FHIR REST/Subscriptions vs. event stream vs. batch) — o prompt
  §7.5 exige que estas sejam comparadas por seus próprios méritos; adiado para a
  ADR-0013 e o pacote de contrato AMH×IntensiCare.
- Grão de tenant e modelo de propriedade de recurso — ADR-0003.
- Identidade de paciente/encounter/MPI e a contradição ADR-006/ADR-039/ADR-041 —
  ADR-0004.
- Modelo canônico de observação/proveniência/tempo — ADR-0005.
- Precedência operacional-versus-analítica, conflito, e *mecânica* de reconciliação —
  ADR-0006. (Esta ADR fixa apenas se duas lanes existem, de todo, como uma propriedade
  de fronteira.)
- Plataforma de implantação, região, e residência — ADR-0019.
- Se qualquer via clínica é viável, de todo — Gate G2, não uma decisão de arquitetura.

---

## 2. Evidências e premissas

### 2.1 Evidências

**Nota epistêmica, declarada uma vez e aplicando-se a toda a tabela.** Esta ADR **não**
reverificou nenhum artefato AMH. Toda linha derivada da AMH abaixo é rotulada `SOURCE`
porque cita o dossiê da Onda 1, que registrou suas próprias verificações `OBSERVED` em
um commit fixado. Per `docs/00-governance/evidence-notation.md` §2, apenas o agente que
realizou uma verificação pode rotulá-la `OBSERVED`. Tratar uma citação como uma
observação é precisamente o erro que o próprio dossiê se recusa a repetir
(`four-layer-dossier.md` §0).

| # | Rótulo | Declaração | Fonte | Confiança |
|---|---|---|---|---|
| E1 | SOURCE | A relação AMH é classificada como **"candidata a integração; não atualmente demonstrada compatível para avaliação acionável de UTI."** | prompt §7.0 linha 357; restatada e justificada em `compatibility-finding.md` §7 | alta |
| E2 | SOURCE | Das quatro camadas de evidência, apenas a **Camada 1 (contrato declarado)** tem evidência substancial. As Camadas 2 (capacidade implantada), 3 (dado populado) e 4 (aptidão operacional) **não têm evidência** no ciclo da Onda 1; a Camada 3 contém zero entradas OBSERVED. | `four-layer-dossier.md` §0; `compatibility-finding.md` §4.1 | alta |
| E3 | SOURCE | **Observation de laboratório está bloqueada** — os próprios documentos da AMH declaram que o bloqueio é causado por uma fonte vazia (`PACIENTE_EXAME` retornou zero linhas; a fonte estruturada Diagnose/LIS não é ingerida), não por código ausente. | `compatibility-finding.md` §3.1 | alta |
| E4 | SOURCE | O plano de desbloqueio para Observation emitiria `code = {text: "Resultado de exame"}` e `valueString`, o que **não está conforme** com o binding LOINC e a exigência de quantidade UCUM do perfil. Um anúncio de "Observation desbloqueada" poderia, portanto, entregar texto livre, não números. | `compatibility-finding.md` §3.1 (contradição C-4) | alta |
| E5 | SOURCE | O **único** padrão de perfil Observation do FHIR IG da AMH fixa (pattern-fix) `category` em `laboratory`, então uma instância conforme **não pode** carregar sinais vitais. Sinais vitais exigiriam um novo perfil a ser autorado, publicado, versionado e populado. Diagramas AMH de fato afirmam sinais vitais (contradição C-1), e essa contradição é preservada não resolvida para os donos da AMH. | `compatibility-finding.md` §3.2 | alta |
| E6 | SOURCE | O produtor FHIR atual é **batch-first a partir do Bronze Iceberg**; CDC/MSK/Flink está estacionado; a ADR-040 declara explicitamente que o caminho **não é** quase em tempo real. O frescor real ponta a ponta é **inteiramente não medido**. | prompt §2 evidência 3; `compatibility-finding.md` §4.3 | alta |
| E7 | SOURCE | **Apenas `dev` está provisionado.** `stg`, `prod` e `dr` não existem e não têm tfstate; as metas de NFR declaradas não são SLAs de produção medidos porque não há produção. A condição de "ambiente similar-a-produção" do Gate G3 é, portanto, **atualmente insatisfazível por qualquer um, em qualquer nível de acesso**. | prompt §2 evidência 1; `compatibility-finding.md` §4.4 | alta |
| E8 | SOURCE | O grão de tenant da AMH é **CNPJ raiz**; a ADR-041 escolhe MPI local-a-tenant e rejeita identidade longitudinal cross-PJ, conflitando com a ADR-006 e o FHIR IG. O HAPI impõe igualdade entre URL-partition e token-tenant e desabilita referências cross-partition. | prompt §2 evidências 7–8; `compatibility-finding.md` §2 item 2 | alta |
| E9 | SOURCE | Existe uma **divergência de autenticação de três vias** (contradição C-2): o CapabilityStatement anuncia OAuth+SMART; o README do HAPI descreve mTLS com SMART como trabalho futuro; um autorizador OIDC/JWT/SMART-scope implementado existe na árvore. Um consumidor não pode escolher comportamento de cliente contra três posições. | `compatibility-finding.md` §4.2 | alta |
| E10 | SOURCE | O **padrão de contrato publicado** da AMH (commit de produtor fixado, digests, fixtures incluindo negativos deliberados, modo de compatibilidade, classificação, registro de aprovação, IDs de registro) é maduro e é descrito como "a coisa mais valiosa que a AMH oferece à V2 — como um *padrão a imitar*, não uma interface a reutilizar." Um pacote de contrato V2 precisa ser criado; a interface da Maezo não pode ser reutilizada. | `compatibility-finding.md` §2 item 3; prompt §7.5 | alta |
| E11 | SOURCE | **Seis das oito condições** que teriam que mudar para que o achado de compatibilidade mudasse exigem um ato do dono da AMH ou um ambiente AMH. "O caminho crítico para a compatibilidade AMH da V2 corre primariamente através da AMH, não através da engenharia da V2." | `compatibility-finding.md` §5 | alta |
| E12 | **SUPERADA em 2026-08-15** — era: "Nenhum contato com o dono da AMH foi estabelecido." **Agora OBSERVED:** rodaquino-OMNI detém `AUTH-DATA-PLATFORM` e declara a autoridade do lado AMH como CEO e principal acionista de ambas as empresas (DEC-G0-04), e concedeu à V2 direitos de leitura + derivação de contrato sobre o repositório AMH (DEC-G0-08). Escrever no repositório AMH permanece proibido. | `docs/00-governance/registers/g0-resolucoes-2026-08-15.md` DEC-G0-04, DEC-G0-08 | alta |
| E13 | SOURCE | A V2 deve existir em um novo repositório com histórico, namespace, secrets, ambientes, bancos de dados, pipeline e identidade de release independentes; a AMH e o legado são montados como somente-leitura e nunca modificados. | prompt §3 regras 1–2 | alta |
| E14 | SOURCE | "Nunca crie duas fontes clínicas de verdade não governadas. Defina o comportamento de precedência, conflito, correção, replay, e reconciliação." | prompt §7.3 linhas 434–436 | alta |
| E15 | SOURCE | Nada pode ser escrito no repositório AMH; criar um contrato AMH×IntensiCare exige autoridade e revisão separadas do dono da AMH. Essa autoridade agora está nomeada (E12), mas a proibição de a V2 escrever no repositório AMH permanece. | prompt §7.5; `compatibility-finding.md` §6; DEC-G0-08 | alta |
| E16 | SOURCE | **A incerteza de identidade/tenant/MPI que ofuscava toda opção de fronteira foi adjudicada** (2026-08-15): MPI por tenant, índice cross-PJ governado condicionado a um parecer DPO/jurídico, `identifier:mpiId` autoritativo no wire sob um futuro IG 1.1.0, e um `portable_subject_ref` opaco obrigatório na fronteira, com a V2 chaveando fatos clínicos por `(PSR, encounter)`. **Isso melhora a linha de base de evidência desta ADR sem decidi-la** — as opções de fronteira agora são avaliadas contra um modelo de identidade conhecido, em vez de uma contradição de seis vias. Note que isso também *acrescenta* dependências do lado AMH (IG 1.1.0, gates PSR SP-1…SP-7, eventos de ciclo de vida de identidade), reforçando o achado de caminho crítico do E11. | [`ADR-0004`](./ADR-0004-identidade-paciente-encontro-mpi.md) §5.1; `g0-resolucoes-2026-08-15.md` DEC-G0-04 | alta — reconciliação item a item executada em 2026-08-15 contra a ata lida em disco (ADR-0004 §5.5) |
| E17 | OBSERVED (esta revisão, pt-BR) | A **ata de adjudicação existe em disco e foi lida integralmente** por este revisor em 2026-08-15 (`doc_id: IDN-ADJ-2026-08-15`). Ela registra as seis decisões do titular com metadados DECIDED, a disposição consolidada dos artefatos AMH (§3), o alvo de pinagem **IG 1.1.0 — decidido, AINDA NÃO PUBLICADO** (§4) e, em §6, **o que as decisões NÃO desbloqueiam**: `Observation` segue não consumível (três pernas abertas), sinais vitais seguem indisponíveis, Gate G3 segue inalcançável. | `identity-adjudication/adjudicacao-decisoes-2026-08-15.md` §2–§6 | alta |
| E18 | SOURCE (pt-BR) | As ordens de serviço AMH derivadas das resoluções tornam **OS-17 (eventos de ciclo de vida de identidade) e OS-18 (`resolve(ref, as_of)`) cláusulas OBRIGATÓRIAS do contrato v1** — *"sem OS-17+OS-18, G3 NÃO PASSA"* — e **OS-19** define o pacote de contrato v1 (campo sujeito = PSR; exclusões explícitas mínimas: sinais vitais e `Observation` laboratorial enquanto não houver evidência aceita). | `ordens-de-servico-amh-2026-08-15.md` §2 (ONDA D), §6 (OS-17/18/19) | alta |
| E19 | SOURCE (pt-BR) | **O que segue aberto após as decisões** (ordens §9): a contradição **C-1 (sinais vitais) permanece aberta** — *"mesmo com todas as 21 ordens executadas, a V2 continua sem sinais vitais da AMH"*; **apenas `dev` está provisionado** (Q6) e nenhuma ordem cria ambiente; a **camada 4 permanece intocada** — nenhuma ordem mede latência, completude, ordenação, disponibilidade, replay ou recuperação. O achado permanece `candidato a integração`. | `ordens-de-servico-amh-2026-08-15.md` §9.1–§9.3, §10 | alta |
| E20 | SOURCE (pt-BR) | **Alvo de pinagem decidido, artefato inexistente:** a V2 pina a **IG 1.1.0**, que **ainda não foi publicada** — *"a V2 não pode pinar o que não existe"*. O commit `0a07a6f1` permanece base de evidência histórica, não alvo de pin. Consequência de calendário registrada pela própria ata. | ata §4 | alta |

### 2.2 Premissas

Cada premissa deve ser registrada em
`docs/00-governance/registers/assumptions-register.md` com um ID `ASM-xxxx`. **Esta ADR
não minta IDs `ASM`** — aquele registro é o catálogo de mintagem daquele prefixo
(`traceability-policy.md` §2 regra 4) e mintagem concorrente colidiria. Registrá-las é
um item de handoff.

| # | Premissa | Por que é necessária | O que a invalida | Titular |
|---|---|---|---|---|
| A1 | O snapshot de evidência AMH fixado ainda descreve a intenção da AMH no commit de execução. | Toda opção abaixo é avaliada contra evidência de Camada 1 de um único commit. | Qualquer commit AMH que mude o IG, a sucessora da ADR-040, o contrato de particionamento, ou o inventário de ambiente. O prompt §7.0 exige reteste no commit de execução. | UNASSIGNED — VALIDAÇÃO NECESSÁRIA |
| A2 | O portfólio de vias clínicas aprovado (Gate G2) exigirá ao menos uma classe de insumo que a AMH hoje não popula (vitais ou labs numéricos). | Se verdadeira, a fronteira deve acomodar uma fonte de sinal clínico não-AMH; se falsa, o espaço de opção se estreita drasticamente. | Gate G2 aprovar um portfólio cujos insumos obrigatórios sejam satisfeitos inteiramente por contexto de encounter/condition/coverage/medicação. | UNASSIGNED — VALIDAÇÃO NECESSÁRIA |
| A3 | Uma exigência de latência de laço de segurança de segundos-a-poucos-minutos sobreviverá à validação do Gate G1. | Impulsiona D1 e a questão de duas lanes na opção (c). | Necessidades de usuário/segurança validadas estabelecendo uma tolerância que o frescor de batch consiga atender — ou uma mais rígida que não consiga. **Nenhuma meta numérica pode ser presumida antes do G1.** | UNASSIGNED — VALIDAÇÃO NECESSÁRIA |
| A4 | A V2 será operada por uma organização capaz de possuir um armazenamento operacional crítico para segurança (on-call, DR, ensaio de restore). | As opções (a), (c) e (d) colocam a accountability operacional na V2. | Evidência de que nenhuma capacidade de operações do lado V2 será financiada — o que tornaria a opção (b) estruturalmente mais atraente e é uma razão legítima para revisitar. | UNASSIGNED — VALIDAÇÃO NECESSÁRIA |
| A5 | Escrever no repositório AMH permanecerá fora da autoridade da V2. | Restringe a opção (b) e o caminho de pacote de contrato. | Uma concessão explícita e registrada de autoridade sobre o repositório AMH pelos donos da AMH. | UNASSIGNED — VALIDAÇÃO NECESSÁRIA |
| A6 | Os papéis de controller/processor da LGPD diferem materialmente entre "a V2 detém o dado clínico" e "a AMH o detém em nome da V2". | Impulsiona D7; a postura jurídica não resolvida afeta o custo e a reversibilidade da fronteira. | Uma determinação de privacidade/jurídico de que os papéis são equivalentes sob qualquer fronteira. | UNASSIGNED — VALIDAÇÃO NECESSÁRIA |

### 2.3 Hipóteses a testar

SOURCE (prompt §7.0, linhas 361–367) — reproduzida como o orquestrador a forneceu, com
o próprio enquadramento do prompt preservado: *"Use o seguinte como uma hipótese de
partida a testar — não como uma decisão predeterminada."* e *"Ratifique ou rejeite esta
hipótese por meio de evidência e ADRs."*

| # | Hipótese (SOURCE, prompt §7.0) | Como seria testada | Quem testa | Status atual |
|---|---|---|---|---|
| H1 | O IntensiCare V2 consome identidade/contexto governados da AMH e o dado clínico disponível por meio de uma camada anticorrupção. | Evidência de Camada 2/3 de que os recursos de identidade+contexto são alcançáveis, autorizados, populados e semanticamente mapeáveis para o escopo de tenant aprovado; contabilização de perda de ACL per §7.6. | Engenheiro de contrato de sinal clínico AMH + engenheiro de conformidade FHIR/SMART | **NÃO TESTADA** — Camadas 2 e 3 sem evidência (E2) |
| H2 | A V2 é dona de seu estado operacional crítico para segurança, registros de avaliação, alertas/itens de trabalho, auditoria, e replay determinístico. | Não testável contra evidência AMH; isto é uma **decisão**, não uma medição. Só se torna testável como consequência de qual opção for aceita (testes de replay/auditoria/restore). | Autoridade decisora, depois engenheiro de arquitetura de teste focado em segurança | **INDECIDIDA** — esta é a substância desta ADR |
| H3 | As saídas Gold/Athena/Iceberg da AMH são usadas para reconciliação, backfill, desfechos, vigilância de qualidade e analytics, não o laço vivo de segurança. | Frescor de Camada 4 medido do caminho analítico vs. a necessidade de latência validada no G1; medição de divergência de reconciliação (QAS-0010). | Arquiteto de compatibilidade de dados AMH + engenheiro de confiabilidade de plataforma | **NÃO TESTADA** — nenhuma medição de frescor existe (E6) |
| H4 | Uma lane durável de sinal clínico AMH×IntensiCare precisa ser desenhada e publicada se as vias aprovadas exigirem frescor ou observações que os contratos atuais não conseguem fornecer. | Condicional ao portfólio do Gate G2 (A2) e à disposição/capacidade do dono da AMH (E11, E12). | Otimizador de portfólio de vias clínicas → steward de publicação de contrato AMH → donos da AMH | **NÃO TESTADA e externamente gateada** |
| H5 | Nenhuma via se torna acionável até que seu contrato de insumo completo e o desempenho de feed observado passem no Gate G3 e a via passe no Gate G2. | Esta é uma regra de governança já vinculante, não uma hipótese sobre a AMH; é restatada aqui para que nenhuma opção seja lida como enfraquecendo-a. | Autoridades de gate | **VINCULANTE** independentemente de qual opção seja aceita |

**Relatório vigente até o Gate G3 (SOURCE, prompt §7.3/§7.5):** a relação é `candidato
a integração` e a avaliação clínica permanece **não-acionante**. Aceitar qualquer opção
abaixo não muda isso.

### 2.4 Restrições DECIDED de 2026-08-15 que vinculam todas as opções (adendo pt-BR)

As decisões abaixo foram tomadas por **rodaquino-OMNI em 2026-08-15** (autoridade
verificada em DEC-G0-04; teor na ata `IDN-ADJ-2026-08-15` §2). Este ADR **não as
re-litiga**: elas entram aqui como **restrições de contorno** que qualquer opção de
fronteira — A, B, C, D ou Z — precisa satisfazer. Nenhuma delas decide a fronteira.

| # | Restrição (DECIDED, 2026-08-15, rodaquino-OMNI) | Fonte | Efeito sobre as opções deste ADR |
|---|---|---|---|
| R1 | **PSR obrigatório na fronteira** (AQ-4, Opção A plena): o `portable_subject_ref` (`amh:psr:v1:<uuidv4>`) é o identificador de fronteira do contrato v1; nativo na V2 desde o dia um; sintético em dev; **nenhum `mpi_id` cru, CPF ou identificador de fonte atravessa a fronteira**; fatos clínicos chaveados por `(PSR, encontro)`. | ata §2 AQ-4 | Toda opção que mova dados clínicos através da fronteira usa PSR. Nenhuma opção pode propor chave interna paralela (IDP-02 superada — ADR-0004 D-07). |
| R2 | **Eventos de ciclo de vida de identidade + `resolve(ref, as_of)` obrigatórios no contrato v1** (AQ-5, vinculante): entrega at-least-once, ordenação por sujeito; *"Sem eles, replay afetado por identidade NÃO é certificável e o Gate G3 NÃO passa. Não se admite janela-teto como paliativo."* | ata §2 AQ-5; ordens OS-17/OS-18 | Nenhuma opção passa no G3 sem as duas capacidades. A opção B (módulo interno) não as dispensa: co-locação não substitui contrato de replay. |
| R3 | **12 tenants pós-ADR-041, sem bypass cross-tenant** (AQ-6): `cross_tenant_authorized` é deriva documental — *nenhum bypass existirá*; testes negativos da V2 **afirmam a impossibilidade**; enumeração autoritativa pinada a partir da IG 1.1.0. | ata §2 AQ-6 | Fixa o grão AMH que toda opção consome (insumo do ADR-0003) e o modelo de ameaça da fronteira (D2). |
| R4 | **Base legal do laço clínico = tutela da saúde** (LGPD Art. 11, II, "f"); sem portão de consentimento no laço; usos secundários **bloqueados**; ratificação por advogados antes de qualquer dado real (DEC-G0-03). | ata §2 AQ-3 | Restringe D7 em toda opção: nenhuma lane pode condicionar o laço clínico a consentimento, e nenhuma opção habilita usos secundários. |

**Dependências honestas que as restrições NÃO removem (OBSERVED/SOURCE, E17–E20):**
a IG 1.1.0 é alvo decidido **não publicado**; os portões SP-1…SP-7 do PSR seguem com
parecer DPO/jurídico pendente (OS-16, única dependência externa); **C-1 (vitais) segue
aberta**; **só `dev` existe**; **camada 4 sem evidência**. As restrições mudaram o
bloqueio de *indefinição* para *execução* — não o removeram (ordens §1.1, §10).

---

## 3. Direcionadores de decisão e atributos de qualidade mensuráveis

Metas são `VALIDAÇÃO NECESSÁRIA` — SOURCE (prompt §15.3): SLOs são definidos "a partir
de necessidades validadas de usuário/segurança", que não existem antes do Gate G1.
**Nenhuma meta numérica é inventada aqui.**

| # | Direcionador | Por que discrimina entre as opções | Atributo de qualidade mensurável | Meta |
|---|---|---|---|---|
| D1 | **Latência do laço de segurança** — fonte→aceito→avaliação→item de trabalho durável→visível→confirmado | As opções diferem em quantos hops de plataforma e quantas fronteiras de batch o laço atravessa. E6 registra que o caminho FHIR atual da AMH é batch-first e explicitamente não quase em tempo real. | QAS-0001, QAS-0003, QAS-0004, QAS-0005, QAS-0006 | VALIDAÇÃO NECESSÁRIA (Gate G1) |
| D2 | **Isolamento de tenant e invariância de propriedade** (DOM-0001) | As opções colocam o ponto de imposição de forma diferente: dentro da V2, dentro da AMH, ou dividido entre ambas. O grão da AMH é CNPJ raiz com binding de URL-partition (E8); o grão de tenant aprovado da V2 é indecidido (ADR-0003). Um ponto de imposição dividido é uma superfície de ameaça distinta. | QAS-0014, QAS-0018 | VALIDAÇÃO NECESSÁRIA (evidência adversarial do Gate G6) |
| D3 | **Propriedade e accountability operacional** — quem é acionado quando o laço de segurança degrada | A opção (b) transfere on-call, DR e accountability de restore para a organização AMH; (a) e (c) mantêm isso com a V2; (d) varia. E7 registra que a AMH não tem ambiente não-dev hoje. | QAS-0012, QAS-0015, QAS-0023 | VALIDAÇÃO NECESSÁRIA |
| D4 | **Maturidade AMH no commit de execução** — ambientes, dado populado, ciclo de vida de contrato | Limita diretamente com o que qualquer opção pode contar. E2/E3/E5/E7 registram: três das quatro camadas de evidência sem evidência, labs bloqueados, nenhum perfil de vitais, apenas `dev` provisionado. | QAS-0002, QAS-0012, QAS-0013 | VALIDAÇÃO NECESSÁRIA (Gate G3 camadas 2–4) |
| D5 | **Custo de saída e reversibilidade** (prompt §9.1 princípio 11) | As opções diferem em uma ordem de magnitude no que fica encalhado na reversão: um adaptador versionado, versus uma aplicação co-implantada, versus um contrato publicado conjuntamente com a cadência de release de um dono externo. | QAS-0027 | VALIDAÇÃO NECESSÁRIA |
| D6 | **Uma única fonte de verdade clínica governada** (E14, DOM-0002, DOM-0008) | Toda opção precisa definir precedência, conflito, correção, replay e reconciliação. Opções que introduzem uma segunda lane (c) ou um segundo armazenamento (a, b) carregam risco de divergência diferente. | QAS-0010, QAS-0019 | VALIDAÇÃO NECESSÁRIA |
| D7 | **Postura de accountability de privacidade/jurídico** (controller/processor LGPD, residência, minimização) | Onde o PHI descansa de forma durável, e sob controle de quem, muda a análise jurídica (A6). O prompt §13 proíbe declarar conformidade sem uma determinação jurídica brasileira. | QAS-0028 | VALIDAÇÃO NECESSÁRIA (`AUTH-PRIVACY-LEGAL`) |
| D8 | **Exposição de cronograma/caminho crítico a uma organização externa** | E11: seis das oito condições de desbloqueio são do lado AMH. As opções diferem em quanto da entrega da V2 fica bloqueada em atos da AMH. | *Nenhum cenário de atributo de qualidade ainda* — este é um risco de entrega, a ser registrado no registro de riscos | n/a |
| D9 | **Custo total, economia de capacidade, e dependência de serviço gerenciado** | O prompt §9.4 exige que a seleção de tecnologia avalie capacidade do operador, custo total, custo de saída e dependência de serviço gerenciado. Nenhum modelo de custo existe ainda. | *Nenhum cenário ainda* — titular: analista de FinOps e dependência de fornecedor (ainda não ativado) | VALIDAÇÃO NECESSÁRIA |

**Excluído por não-discriminar:** "usa FHIR", "compartilha identificadores", "ambos são
sistemas de saúde". SOURCE (prompt §7.0): *"Não chame os repositórios atuais de
'compatíveis' apenas porque ambos contêm FHIR, APIs, eventos, ou identificadores
correspondentes."*

---

## 4. Alternativas consideradas

Os quatro modelos fornecidos pelo prompt, mais adiar. **A ordem de apresentação segue o
prompt §7.3 e não carrega nenhum ranking.** As consequências de cada opção são
declaradas honestamente, inclusive onde a opção que este programa poderia ser presumido
a favorecer é fraca.

### Opção A — Consumidor AMH com armazenamento operacional próprio crítico para segurança

**Descrição.** A V2 é um sistema independente. Ela consome identidade/contexto da AMH e
qualquer dado clínico que a AMH consiga fornecer, por meio de uma camada anticorrupção
versionada (§7.6). A V2 é dona de seu próprio armazenamento operacional, registros de
avaliação, alertas/itens de trabalho, auditoria e replay. As saídas analíticas da AMH
são usadas para reconciliação, backfill, desfechos e vigilância. A V2 é implantada,
operada, e lançada em sua própria plataforma e cadência.

**Contra os direcionadores.**

- D1: a V2 controla todo hop após o ingresso, mas **herda o frescor de ingresso da
  AMH**. Se a única lane AMH é batch (E6), o piso do laço é fixado por um componente que
  a V2 não possui. Esta opção não resolve por si só a contradição de frescor; ela isola
  o resto do laço dela.
- D2: um único ponto de imposição dentro da V2 — mais simples de raciocinar e de testar
  adversarialmente — mas a V2 precisa rederivar independentemente o contexto de tenant a
  partir do grão da AMH (E8), e qualquer descasamento se torna um hazard de mapeamento
  do lado V2.
- D3: a V2 possui operações ponta a ponta. Exige que A4 se sustente.
- D4: menos dependente da maturidade AMH para o *laço de segurança*; ainda totalmente
  dependente para *insumos clínicos*, que E3/E5 dizem não estar populados.
- D5: menor custo de saída das quatro — o acoplamento é um adaptador versionado atrás de
  uma porta.
- D6: dois armazenamentos existem (o da AMH e o da V2) e a precedência precisa ser
  explícita; o risco é divergência, não duplicação não governada, **desde que**
  correção e reconciliação sejam especificadas (E14).
- D7: o PHI descansa de forma durável na V2; a organização da V2 assume a postura
  jurídica correspondente.
- D8: menor bloqueio externo para trabalho interno da V2; **inalterado** bloqueio
  externo para insumos clínicos.

**Consequências positivas.** Accountability clara; cadência de release independente;
kernel de segurança isolado da maturidade operacional de outra organização; a camada
anticorrupção é um lugar natural para contabilização de perda e quarentena (§7.6);
satisfaz o requisito de independência do prompt §3 regra 1 sem tensão.

**Consequências negativas.** A V2 precisa financiar e contratar operações, DR e ensaio
de restore (A4); armazenamento duplicado de fatos clínicos com uma obrigação de
reconciliação explícita (D6); **não** resolve o problema de vitais/labs ausentes (E3,
E5) — um armazenamento próprio da V2 sem nada clinicamente acionável para colocar nele
não é progresso; a rederivação de identidade é uma nova superfície de hazard.

**O que precisaria ser verdade para esta ser a resposta certa.** Capacidade de
operações do lado V2 existe e é financiada (A4); a AMH consegue fornecer ao menos o
dado de contexto que o portfólio aprovado precisa; a organização aceita deter PHI de
forma durável na V2 (A6).

**Custo de saída se depois revertida.** Moderado: o adaptador e a porta sobrevivem; o
armazenamento operacional, suas migrações, e seu histórico operacional teriam que ser
migrados para o que quer que o substitua.

### Opção B — Módulo implantado dentro da fronteira da plataforma AMH

**Descrição.** A V2 é construída e implantada como um módulo da plataforma AMH:
infraestrutura compartilhada, tenancy e imposição de identidade compartilhadas,
propriedade operacional e processo de release compartilhados. O dado clínico não
atravessa uma fronteira organizacional.

**Contra os direcionadores.**

- D1: potencialmente o caminho de dado mais curto — nenhum hop cross-plataforma — **mas**
  apenas se a própria AMH tiver uma lane quase em tempo real. E6 registra que ela não
  tem hoje; co-locação não converte batch em streaming.
- D2: o isolamento é imposto uma vez, pela AMH, no grão CNPJ raiz (E8). Se o grão
  aprovado da V2 (ADR-0003) diferir de CNPJ raiz, esta opção força a V2 a adotar o grão
  da AMH ou a sobrepor uma segunda imposição dentro dela.
- D3: a accountability operacional se move para a organização AMH. Isso é uma vantagem
  apenas se aquela organização estiver disposta, staffada e financiada para uma carga de
  trabalho **crítica para segurança**; E7 registra que nenhum ambiente não-dev existe
  hoje, e a pendência do README atribui a lacuna de ambiente a "Negócio / orçamento".
- D4: acoplamento máximo à maturidade da AMH — toda limitação da AMH se torna uma
  limitação da V2.
- D5: **custo de saída mais alto.** Implantação, identidade, armazenamento, release e
  on-call estão entrelaçados com a plataforma de outra organização.
- D6: potencialmente um armazenamento — atraente para D6 — ao preço de D5 e D3.
- D7: a organização AMH se torna a custodiante durável dos registros clínicos da V2; a
  análise LGPD muda materialmente (A6) e a questão de custódia de evidência de
  segurança (quem consegue produzir a trilha de auditoria em um incidente) precisa ser
  respondida.
- D8: bloqueio externo máximo — a V2 não conseguiria implantar sem a AMH.

**Consequências positivas.** Nenhuma movimentação de dado cross-fronteira; um único
ponto de imposição de tenancy; potencialmente um único armazenamento clínico; o rigor
de contrato e particionamento da AMH se aplica diretamente; nenhum custo de
infraestrutura duplicada.

**Consequências negativas.** Contradiz diretamente a exigência do prompt §3 regra 1 de
ambientes, bancos de dados, pipeline e identidade de release independentes — **esta
opção não pode ser aceita sem uma exceção explícita e registrada a uma regra
não-negociável, concedida pela autoridade que possui aquela regra**; a cadência de
release da V2, a autoridade de kill-switch de segurança, e o comando de incidente
seriam compartilhados ou subordinados; o kernel de segurança determinístico ficaria
dentro de uma plataforma cujo próprio documento de princípios declara que vários
princípios ainda não são plenamente sustentados por implementação (prompt §2 evidência
2); custo de saída mais alto; A5 diz que a V2 hoje não tem autoridade para escrever no
repositório AMH, de todo.

**O que precisaria ser verdade para esta ser a resposta certa.** Os donos da AMH
quiserem isso ativamente e financiarem operações críticas para segurança; a exceção da
regra 1 do §3 for concedida por uma autoridade nomeada; o grão de tenant da V2 puder ser
CNPJ raiz; a autoridade de incidente e release das organizações puder ser unificada sem
ambiguidade.

**Custo de saída se depois revertida.** Alto — aproximando-se de uma reescrita de tudo
abaixo do núcleo de domínio.

### Opção C — Híbrida: lane operacional durável AMH quase em tempo real mais reconciliação analítica

**Descrição.** Duas lanes explícitas, como o prompt §7.3 as descreve: uma lane
operacional durável quase em tempo real carregando sinais clínicos críticos para
segurança da AMH para a V2, e uma lane analítica/de reconciliação (Gold/Athena/Iceberg)
para backfill, desfechos, auditoria e avaliação de regra. A V2 é dona de seu
armazenamento operacional e do laço de segurança; a AMH desenha, publica e opera a lane
quase em tempo real como um contrato governado (§7.5).

**Contra os direcionadores.**

- D1: a única opção que *mira diretamente* a contradição de frescor — mas o faz exigindo
  que a AMH construa algo que não existe. E6: CDC/MSK/Flink está estacionado.
- D2: duas lanes significa dois caminhos que precisam ambos impor binding de tenant, e
  uma regra de precedência entre eles (E14). Mais superfície do que (a).
- D3: a V2 é dona do laço de segurança; a AMH é dona da disponibilidade da lane — uma
  accountability **dividida** que precisa ser escrita no pacote de contrato ou será
  descoberta durante um incidente.
- D4: maior dependência do *investimento* AMH, distinto do *estado atual* da AMH.
- D5: custo de saída moderado-a-alto — um contrato publicado conjuntamente com uma
  cadência de release externa e uma janela de depreciação.
- D6: força a definição de precedência/conflito/correção/replay que E14 exige; isso é um
  benefício, se de fato for especificado, em vez de presumido.
- D7: PHI se move através da fronteira continuamente; a minimização do payload da lane
  se torna uma obrigação de design de primeira ordem (prompt §7.5: "Minimize campos e
  PHI").
- D8: alto bloqueio externo — a lane não pode existir sem aprovação, capacidade de
  design, e financiamento do dono da AMH.

**Consequências positivas.** Endereça diretamente a contradição não resolvida de
frescor-de-batch-versus-latência-de-alerta do assessment legado; torna explícita a
questão de duas fontes de verdade, em vez de emergente; produz um artefato de contrato
governado que é auditável; usa a força demonstrada da AMH (E10 — seu padrão de
publicação de contrato) para exatamente aquilo em que ela é boa.

**Consequências negativas.** Exige que a AMH construa e opere nova infraestrutura quase
em tempo real que está estacionada; multiplica o número de condições do lado AMH no
caminho crítico da V2 (E11); duas lanes carregando os mesmos fatos clínicos é
precisamente a situação contra a qual E14 alerta, e é segura apenas se precedência e
reconciliação forem especificadas e testadas; o risco de cronograma está em grande
parte fora do controle da V2.

**O que precisaria ser verdade para esta ser a resposta certa.** Uma necessidade de
latência validada que o batch não consiga atender (A3); comprometimento e financiamento
do dono da AMH para a lane; um modelo de precedência/correção/replay especificado
(ADR-0006); divergência de reconciliação mensurável (QAS-0010).

**Custo de saída se depois revertida.** Moderado-a-alto — o contrato publicado, seus
consumidores, suas fixtures e suas obrigações de depreciação.

### Opção D — Outro modelo explicitamente justificado

SOURCE (prompt §7.3 item 4) permite "outro modelo explicitamente justificado". Três
variantes concretas são visíveis a partir da evidência da Onda 1. Elas são enumeradas
para que "outro" não seja uma caixa vazia; **nenhuma é preferida aqui**, e qualquer uma
delas exigiria sua própria análise completa antes da aceitação.

**D-1 — AMH para contexto, fontes não-AMH para sinais clínicos.** A V2 consome a AMH
para contexto de identidade/encounter/condition/coverage, e obtém vitais e labs
numéricos de uma fonte diferente (gateway de dispositivo, motor de interface HL7 v2, ou
integração direta com EHR). *Justificativa a partir da evidência:* E3 e E5 dizem que as
duas classes de insumo que a maioria das vias de UTI precisa não estão populadas na AMH
e, para vitais, são estruturalmente excluídas pelo único perfil Observation. *Custo:*
um segundo programa de integração com seu próprio ônus de conformidade, segurança e
operação (prompt §12.3), e um problema mais difícil de vinculação de identidade entre
duas fontes. *Nota:* esta variante é a mais diretamente responsiva à evidência real e
também a de maior custo não escopado. Ela exige sua própria ADR candidata (ver
`adr-index.md` §6).

**D-2 — V2 apenas-contexto sem avaliação clínica acionável no primeiro release.** A V2
inicialmente entrega workflow, coordenação, e explicação sobre dado de contexto AMH,
com avaliação apenas em modo shadow/não-acionante, adiando a questão de sinal.
*Justificativa:* consistente com o relatório vigente de `candidato a integração` e com a
provisão do Gate G2 de que o tamanho inicial do portfólio "pode legitimamente ser
zero". *Custo:* um produto cuja proposta de valor clínico não está comprovada; risco de
construir o workflow errado em torno de insumos que depois mudam de forma.

**D-3 — Fronteira estagiada: começar como (a), com uma opção contratada sobre (c).** A
V2 se constrói como um consumidor independente enquanto um pacote de contrato
AMH×IntensiCare é negociado para uma futura lane quase em tempo real, com a ausência da
lane explicitamente desenhada (modo degradado, DOM-0007). *Justificativa:* preserva
reversibilidade (D5) enquanto as condições externamente gateadas (E11) se resolvem.
*Custo:* carrega o custo de desenhar para uma lane que talvez nunca seja financiada;
risco de se tornar (a) permanentemente enquanto é descrita como (c) — uma deriva de
descrição-versus-realidade que este programa sinaliza como seu próprio hazard.

### Opção Z — Adiar / não fazer nada

**Descrição.** Não registrar nenhuma decisão de fronteira. Continuar o design das
Ondas 2/3 sob uma restrição rígida de que nenhuma ADR dependente pode presumir nenhuma
fronteira específica; manter o adaptador AMH atrás de uma porta (§7.6) de modo que (a),
(c) e (d-1) permaneçam todas alcançáveis; revisitar no Gate G3.

**Consequências positivas.** Nenhuma decisão é tomada sem evidência de Camada 2/3/4, que
é exatamente o que o prompt §7.0 e o Gate G3 exigem; preserva o valor de opção máximo no
nó mais a montante do programa; não custa nada que já não esteja bloqueado.

**Consequências negativas.** Toda ADR dependente precisa carregar ramos condicionais, o
que é um custo de design real e um risco de deriva de documentação; a ambiguidade sobre
quem é dono do armazenamento operacional pode se propagar silenciosamente para escolhas
de implementação; o adiamento só é gratuito enquanto o trabalho dependente for
genuinamente agnóstico à fronteira, e deixa de ser gratuito no momento em que a primeira
fatia vertical (Gate G7) precisar de um armazenamento.

**Custo do atraso.** INFERENCE: sobe acentuadamente no Gate G7. Antes disso, o
adiamento custa design condicional; depois que um armazenamento existe, o adiamento se
torna uma migração.

### 4.1 Comparação contra os direcionadores

Apenas qualitativa. As células declaram a *direção* do efeito e sua base de evidência.
**Nenhum score, nenhum peso** — o análogo da §6.3 do prompt exige que titulares
ratifiquem pesos antes do scoring, e nenhum titular existia (E12).

| Direcionador | A — consumidor | B — módulo in-platform | C — híbrida de duas lanes | D-1 — sinais não-AMH | Z — adiar |
|---|---|---|---|---|---|
| D1 latência | V2 controla pós-ingresso; piso de ingresso fixado pelo batch AMH (E6) | Caminho mais curto apenas se AMH construir NRT; co-locação ≠ streaming | Mira diretamente; depende da AMH construir a lane | Contorna a AMH para a classe crítica em tempo | Não resolvido |
| D2 isolamento | Um ponto de imposição na V2; hazard de mapeamento de grão | Um ponto, grão da AMH (E8); força alinhamento de grão | Dois caminhos, ambos precisam vincular tenant | Dois domínios de fonte a vincular | Não resolvido |
| D3 propriedade de operações | V2 é dona; precisa de A4 | AMH é dona; sem ambiente não-dev hoje (E7) | Dividida — precisa ser contratada explicitamente | V2 é dona, mais um segundo conector | Não resolvido |
| D4 dependência de maturidade AMH | Moderada | Máxima | Alta (depende do *investimento* AMH) | Mais baixa para sinais; moderada para contexto | n/a |
| D5 custo de saída | Mais baixo | Mais alto | Moderado-alto (contrato publicado) | Moderado, superfície de integração dobrada | Zero agora, subindo após G7 |
| D6 fonte única de verdade | Dois armazenamentos; precedência exigida | Potencialmente um armazenamento | Duas lanes; precedência obrigatória (E14) | Dois domínios de fonte; proveniência crítica | Não resolvido |
| D7 postura de privacidade | PHI durável na V2 | PHI durável na AMH | PHI cruzando continuamente; minimizar payload | PHI de uma fonte adicional | Não resolvido |
| D8 bloqueio externo | Baixo para interno da V2; alto para insumos | Máximo | Alto | Mais baixo na AMH; novas dependências em outro lugar | n/a |
| D9 custo | V2 paga por sua própria plataforma | Infra compartilhada; modelo de custo compartilhado | Ambos, mais construção da lane | Mais alto — dois programas de integração | n/a |

**Nota sobre a opção (b).** Ela é listada e analisada por completo porque o prompt
§7.3 exige que seja considerada. Sua análise registra que ela conflita com a regra 1 do
§3 do prompt. Registrar o conflito não é o mesmo que rejeitar a opção — apenas a
autoridade decisora pode rejeitá-la, e ela poderia ser aceita com uma exceção explícita
e registrada. Omiti-la silenciosamente seria o erro.

---

## 5. Decisão e escopo

> **DECISÃO REGISTRADA (GDEC-0008, 2026-08-15).** O titular aceitou este ADR com sua
> própria formulação como a posição decidida da fronteira — ver §5.0. A hipótese de
> partida do §7.0/§2.3 é, por esta aceitação, **ratificada** na forma da formulação do
> titular, que é mais estrita do que qualquer opção redigida em §4 — ver a nota de
> composição obrigatória em §5.0.

### 5.0 Decisão (GDEC-0008, 2026-08-15)

> **decided_by:** rodaquino-OMNI (titular; `AUTH-DATA-PLATFORM` + `AUTH-AMH-OWNER`,
> ambos por DEC-G0-04; papéis interinos GDEC-0004).
>
> **Posição decidida — formulação própria do titular:** **"a V2 SEMPRE consome dados
> da AMH; nunca ingestão direta."**
>
> Esta formulação é aceita como a decisão da fronteira. Ela ratifica o núcleo da
> Opção A (§4 — consumidor com armazenamento operacional crítico próprio, camada
> anticorrupção versionada) tal como elaborada em §5.2 (proposta P1–P5, em particular
> P1: consumo exclusivo de identidade/contexto governados da AMH), na variante
> estagiada Opção D-3 (começar como A, com opção contratada sobre C — preserva
> reversibilidade enquanto as condições externas de E11 resolvem). **A formulação do
> titular é mais estrita do que qualquer opção redigida em §4**: ela fecha
> definitivamente a Opção D-1 (sinais clínicos por fonte não-AMH — dispositivo, HL7
> v2, EHR direto) como caminho para a V2 — nenhuma ingestão direta pela V2, sob
> nenhuma circunstância, supera o texto de §4 onde D-1 era listada como variante a
> considerar. A Opção B (módulo interno à AMH) permanece rejeitada pelas razões já
> registradas em §4 (conflito com a regra não-negociável §3-1); a Opção C (lane
> híbrida) permanece disponível **apenas como capacidade do lado AMH**, nunca como
> ingestão direta da V2 — ver a nota de composição abaixo.
>
> **Nota de composição (GDEC-0008), obrigatória.** Porque o item 2 da mesma sessão de
> decisão (GDEC-0008) decidiu simultaneamente C-1 = O3 (híbrida, trilha de monitor de
> curto prazo) para a contradição de sinais vitais, a interpretação registrada —
> marcada **"interpretação de composição registrada (GDEC-0008), sujeita a
> confirmação do titular"** — é que a trilha de monitor/dispositivo da O3 é
> implementada como capacidade de ingestão DO LADO AMH, preservando a AMH como ponto
> único de ingresso; o contrato de consumo da V2 permanece inalterado.
>
> **rationale:** conforme sessão de decisão GDEC-0008.
>
> **supersessão:** rege-se pelos gatilhos de revisão já registrados nesta ADR (§8.2,
> T1–T10); em particular T6 (Gate G2 aprovar portfólio cujos insumos obrigatórios a
> AMH não pode suprir) e T9 (publicação da IG 1.1.0) continuam a reabrir a avaliação
> operacional, mas não reabrem "nunca ingestão direta" por si sós — flexibilizar essa
> cláusula exige nova decisão do titular, nunca inferência de um gatilho.
>
> **O que esta decisão NÃO fecha:** as doze condições de §5.1 seguem regendo a
> operacionalização — em particular C3–C7 (camadas de evidência do Gate G3, ambiente
> production-like) e C11 (determinação jurídica de privacidade). Decidido ≠
> implantado ≠ verificado.

### 5.1 Condições que precisam ser satisfeitas antes que esta ADR possa ser aceita

**Esta ADR não pode ser aceita até que: (i) exista uma aprovação de fronteira do dono
da AMH, e (ii) as camadas de evidência do Gate G3 estejam satisfeitas para o escopo da
fronteira.** Expandido:

| # | Condição | Titular | Evidência que a fecharia | Status |
|---|---|---|---|---|
| C1 | Um dono AMH nomeado e alcançável existe e aprovou a fronteira de responsabilidade por escrito. | `AUTH-AMH-OWNER` | Aprovação registrada nomeando a fronteira, as responsabilidades de cada lado, e a rota de escalonamento. | **FECHADA em 2026-08-15** — DECISÃO (GDEC-0008): o dono está nomeado e alcançável (E12) e aprovou a fronteira por escrito — a própria aceitação desta ADR (§5.0), GDEC-0008 item 4 |
| C2 | Um titular decisor nomeado de plataforma de dados V2 existe. | Gate G0 | Linha de `authority-model.md` preenchida com um humano. | **FECHADA em 2026-08-15** — rodaquino-OMNI, DEC-G0-04 (nota: mesmo humano que C1; concentração de autoridade registrada em ADR-0004 §11.2) |
| C3 | Gate G3 **Camada 2** (capacidade implantada): um ambiente AMH alcançável pela V2, credenciais, caminho de rede, e escopo de tenant designado. | Donos AMH + provisionamento + orçamento | Discovery contra um ambiente nomeado; interface alcançável autorizada. | **ABERTA** — nenhum acesso a ambiente; apenas `dev` provisionado (E7) |
| C4 | Gate G3 **Camada 3** (dado populado): cobertura representativa, recursos não vazios, distribuições nulo/inválido medidas para todo insumo que o portfólio aprovado exige. | Arquiteto de compatibilidade de dados AMH (medição) | Matriz de elegibilidade via-para-fonte preenchida com medições, não presença de schema. | **ABERTA** — zero entradas OBSERVED de Camada 3 (E2) |
| C5 | Gate G3 **Camada 4** (aptidão operacional): latência ponta a ponta medida, completude, ordenação, correção, disponibilidade, replay e recuperação. | Confiabilidade de plataforma + donos AMH | Percentis medidos contra uma necessidade validada no G1. | **ABERTA** — nada medido (E2, E6) |
| C6 | As contradições C-1 (sinais vitais), C-2 (autenticação), C-3 (status do manifesto), C-4 (forma do Observation) resolvidas pelos donos AMH. | `AUTH-AMH-OWNER` | Resolução escrita por contradição. | **PARCIALMENTE ABERTA (2026-08-15)** — as resoluções AQ-1..AQ-6 e as ordens de serviço dão direção decidida a C-2/C-3/C-4, cujo **fechamento depende de execução AMH e verificação** (OS-01..OS-09, OS-20); **C-1 permanece integralmente aberta — nenhuma decisão a resolve** (E19; ordens §9.1) |
| C7 | Um ambiente similar-a-produção existe no qual testes de conformidade possam passar (o Gate G3 exige isso explicitamente). | Decisão de orçamento AMH | O ambiente existe e é alcançável. | **ABERTA — atualmente insatisfazível por qualquer um** (E7; reconfirmado 2026-08-15: nenhuma ordem de serviço cria ambiente — ordens §9.2) |
| C8 | O portfólio de vias clínicas aprovado (Gate G2) é conhecido, para que a fronteira possa ser avaliada contra os insumos de fato exigidos. | `AUTH-CLINSAFETY` + `AUTH-PRODUCT` | Registro do Gate G2. | **ABERTA** |
| C9 | Necessidades de latência de usuário/segurança validadas existem (Gate G1), para que D1 tenha uma meta em vez de um palpite. | `AUTH-INTENDED-USE` + `AUTH-CLINSAFETY` | Registro do Gate G1; metas de atributo de qualidade substituídas a partir de `VALIDAÇÃO NECESSÁRIA`. | **ABERTA** |
| C10 | Se a opção (b) estiver sob consideração: uma exceção explícita e registrada à regra 1 do §3 do prompt (repositório, ambientes, bancos de dados, pipeline e identidade de release independentes), concedida pela autoridade que possui aquela regra. | Autoridade do orquestrador | A exceção registrada, ou a remoção da opção. | **N/A** — DECISÃO (GDEC-0008): a opção (b) não faz parte da fronteira decidida (§5.0); nenhuma exceção é buscada |
| C11 | Determinação de privacidade/jurídico da postura de controller/processor sob a fronteira candidata (A6). | `AUTH-PRIVACY-LEGAL` | Determinação jurídica registrada; o prompt §13 proíbe afirmar conformidade sem uma. | **ABERTA** (reforçada por AQ-3: a base legal decidida exige ratificação por advogados antes de dado real — OS-16) |
| C12 | Um pacote de contrato AMH×IntensiCare é redigido, possuído, aprovado e publicado pela AMH, e pinado pela V2 — para qualquer que seja a opção que exija um contrato. | `AUTH-AMH-OWNER` + steward de publicação de contrato AMH | Manifesto publicado com digests, fixtures, aprovações; arquivo de lock do lado V2. | **ABERTA — com cláusulas decididas (2026-08-15)**: campo sujeito = PSR (R1), eventos + `resolve(ref, as_of)` obrigatórios (R2), modelo de finalidade AQ-3 (R4), exclusões mínimas vitais/`Observation` (OS-19). O pacote em si **não existe**; a IG 1.1.0 a pinar **não foi publicada** (E20) |

**Seis destas doze condições são do lado AMH** (C1, C3, C6, C7, C12, e parcialmente
C4), consistente com o achado de `compatibility-finding.md` §5 de que o caminho
crítico corre primariamente através da AMH.

### 5.2 Hipótese §7.0 desenvolvida como proposta encaminhada ao titular (adendo pt-BR, 2026-08-15)

**DECISÃO (GDEC-0008): proposta aceita cláusula a cláusula, com a formulação do
titular (§5.0) prevalecendo onde for mais estrita.** O prompt §7.0 fornece uma
hipótese de partida e manda *"ratificá-la ou rejeitá-la através de evidência e ADRs"*.
Com as restrições DECIDED de §2.4 e a evidência E16–E20, este revisor **desenvolveu a
hipótese na forma de uma proposta**, que o titular ratificou por escrito em
GDEC-0008 (item 4) — cláusula a cláusula:

| # | Cláusula proposta (PROPOSAL) | Mapeamento nas opções §4 | Base |
|---|---|---|---|
| P1 | A V2 consome identidade/contexto governados da AMH **exclusivamente** através de camada anticorrupção versionada, com o PSR como identificador de fronteira (R1) e validação sobre `identifier:mpiId` pinado na IG 1.1.0. | Núcleo da Opção A; compatível com D-3 | §7.0 hipótese 1; AQ-2/AQ-4; §7.6 |
| P2 | A V2 é **dona do estado operacional crítico de segurança**: armazenamento operacional, registros de avaliação, alertas/itens de trabalho, auditoria e replay determinístico. | Opção A / D-3; exclui a Opção B sem exceção registrada à regra §3-1 | §7.0 hipótese 2; DOM-0003, DOM-0006 |
| P3 | Saídas Gold/analíticas da AMH servem **reconciliação, backfill, desfechos, vigilância de qualidade e analytics — nunca o laço vivo de segurança**. Precedência, conflito, correção e replay entre lanes são matéria do ADR-0006. | Metade analítica da Opção C, sem exigir hoje a lane NRT | §7.0 hipótese 3; E6; E14 |
| P4 | Uma **lane clínica durável AMH×IntensiCare** é desenhada e publicada **se e somente se** o portfólio aprovado (G2) exigir frescor ou observações que os contratos atuais não fornecem — na forma da Opção D-3 (começar como A, com opção contratada sobre C), preservando reversibilidade (D5) enquanto as condições externas (E11) resolvem. | D-3 explícita | §7.0 hipótese 4; A2/A3 |
| P5 | Nenhuma via clínica torna-se acionável antes de G2 + G3 (H5) — restrição já vinculante, restatada para que a proposta não seja lida como atalho. | Todas | §7.0 hipótese 5 |

**O que esta proposta NÃO faz:** não escolhe transporte (ADR-0013/§7.5), não fixa grão
interno de tenant (ADR-0003), não declara compatibilidade (G3), não dispensa nenhuma das
doze condições de §5.1 — em particular C7 (ambiente production-like inexistente) e C6
(C-1 aberta). **Risco honesto da proposta, registrado:** a variante D-3 carrega o risco,
já nomeado em §4, de tornar-se A permanentemente enquanto descrita como C — o gatilho T5
(necessidade de latência validada no G1) é o teste objetivo que decide se a lane NRT é
necessária. **Quem decide:** exclusivamente o titular (`AUTH-DATA-PLATFORM` +
`AUTH-AMH-OWNER`, ambos detidos por rodaquino-OMNI via DEC-G0-04), e a aceitação plena
continua condicionada às condições de §5.1.

---

## 6. Consequências

Como nenhuma opção é escolhida, estas são as consequências **da existência desta ADR em
estado `proposed`**, não de nenhuma decisão.

### 6.1 Positivas

- A questão de fronteira agora está explícita, enumerada, e rastreável, com a evidência
  que limita cada opção anexada.
- Toda ADR dependente (`adr-index.md` §4.1) agora consegue declarar sua própria
  condicionalidade de fronteira, em vez de presumir uma silenciosamente.
- As doze condições de aceitação tornam visível que a fronteira é **externamente
  gateada** — útil para planejamento, e uma defesa contra um cronograma construído sob
  a presunção de que a compatibilidade AMH é uma tarefa de engenharia da V2 (E11).

### 6.2 Negativas

- O trabalho de design dependente precisa carregar ramos condicionais até que isto se
  resolva, o que custa esforço e arrisca deriva entre os ramos e a realidade.
- Uma fronteira não resolvida é uma ambiguidade permanente que a pressão de
  implementação vai tentar resolver por default — o primeiro time que precisar de um
  banco de dados vai criar um, e essa escolha vai parecer uma resposta a esta ADR sem
  ter sido decidida. **Este risco deveria ser registrado no registro de riscos.**

### 6.3 Neutras / estruturais

- O relatório vigente permanece `candidato a integração`; a avaliação clínica permanece
  não-acionante independentemente de qual opção seja aceita depois (H5).
- Nada nesta ADR autoriza nenhuma escrita no repositório AMH (E15).

---

## 7. Implicações transversais

| Dimensão | Implicação | Rótulo | Papel titular | ID de acompanhamento |
|---|---|---|---|---|
| Segurança clínica | A fronteira fixa o piso da latência do laço de segurança e determina quem é dono do kill switch e do procedimento de modo degradado. Sob toda opção, DOM-0004 vincula: vitais/labs AMH ausentes precisam aparecer como `not_evaluated`/`missing`, nunca como normal ou zero. **HAZ-0030 é o hazard ao qual esta ADR mais diretamente se aplica** — uma via aprovada cuja única lane é batch não consegue reconhecer deterioração dentro de sua janela acionável, e SAF-0031 proíbe uma via acionável em uma lane que não consegue atender seu orçamento declarado. HAZ-0039 (fonte vazia/nula lida como ausência de anormalidade) é realizado pela própria varredura Gold medida da AMH. | INFERENCE a partir de E3, E5, E6, DOM-0004 | `AUTH-CLINSAFETY` | HAZ-0030, HAZ-0039, HAZ-0038, HAZ-0010, HAZ-0005, HAZ-0006; SAF-0031, SAF-0033, SAF-0035 |
| Segurança (security) | As opções diferem em onde a imposição de isolamento de tenant vive e quantas fronteiras de confiança o dado clínico atravessa. A igualdade URL-partition/token-tenant da AMH (E8) precisa ser honrada por qualquer opção consumidora; headers de partição fornecidos pelo chamador são rejeitados. A autenticação não pode ser desenhada contra a divergência de três vias C-2 (E9). | INFERENCE a partir de E8, E9 | `AUTH-SECURITY` | ADR-0015, ADR-0016 |
| Privacidade (LGPD) | Onde o PHI descansa de forma durável e quem o controla difere materialmente por opção (A6). O prompt §7.5 exige que o payload da fronteira minimize campos e PHI; a opção (c) torna a minimização de payload uma obrigação contínua. Nenhuma conformidade pode ser afirmada sem uma determinação jurídica brasileira (prompt §13). | VALIDAÇÃO NECESSÁRIA | `AUTH-PRIVACY-LEGAL` | ADR-0017, ADR-0018 |
| Interoperabilidade | A fronteira determina quais contratos a V2 precisa consumir e se um pacote AMH×IntensiCare precisa ser publicado (E10, E15). A interface da Maezo não pode ser reutilizada; seu *padrão* deveria ser imitado. | SOURCE a partir do prompt §7.5 | `AUTH-DATA-PLATFORM` | ADR-0013 |
| Acessibilidade | Nenhuma implicação direta. Indireta: a fronteira fixa o frescor do dado, e frescor/obsolescência precisam ser *visivelmente* representados na UI (prompt §11), inclusive para tecnologia assistiva — um indicador de dado obsoleto que só transmitisse estado por cor falharia o WCAG 2.2 AA. | INFERENCE | `AUTH-UX` | ADR-0021 |
| Operacional | Determina a propriedade de on-call, a responsabilidade de DR, o ensaio de restore, o comando de incidente, e o inventário de ambiente que a V2 precisa construir. E7 registra que a AMH não tem ambiente não-dev hoje. | INFERENCE a partir de E7 | `AUTH-OPERATIONS` | ADR-0019, ADR-0020 |
| Custo | As opções diferem em infraestrutura duplicada, contagem de integração, e dependência de serviço gerenciado. **Nenhum modelo de custo existe** e nenhum é inventado aqui; o analista de FinOps e dependência de fornecedor ainda não foi ativado. | VALIDAÇÃO NECESSÁRIA | `AUTH-PRODUCT` | pendente |
| Migração | Reverter a fronteira depois que um armazenamento existir é uma migração de dado com obrigações de custódia de registro clínico e continuidade de auditoria, não um redeploy. Esta é a principal razão pela qual o custo de adiamento sobe no Gate G7. | INFERENCE | `AUTH-OPERATIONS` | ADR-0023 |

---

## 8. Reversibilidade, gatilhos de revisita, kill/rollback

### 8.1 Avaliação de reversibilidade

| Opção | Reversibilidade | O que fica encalhado na reversão | Rótulo |
|---|---|---|---|
| A — consumidor | **Alta** — o acoplamento é um adaptador versionado atrás de uma porta (§7.6) | As migrações do armazenamento operacional e seu histórico operacional | INFERENCE |
| B — módulo in-platform | **Baixa** — implantação, identidade, armazenamento, release e on-call estão entrelaçados com uma plataforma externa | Aproximadamente tudo abaixo do núcleo de domínio | INFERENCE |
| C — híbrida de duas lanes | **Moderada** — um contrato publicado carrega uma janela de depreciação externa e consumidores externos | A lane, suas fixtures, suas obrigações de contrato | INFERENCE |
| D-1 — sinais não-AMH | **Moderada** — dois programas de integração, cada um independentemente reversível | O conector que for descartado | INFERENCE |
| Z — adiar | **n/a** — nada a reverter; valor de opção preservado, a um custo de carregamento crescente | n/a | INFERENCE |

SOURCE (prompt §9.1 princípio 11): "Preferir decisões reversíveis e registrar gatilhos
de extração/revisita." Registrar esta ordenação **não** é uma recomendação da opção
(a); a reversibilidade é um direcionador entre nove, e D1/D6 podem legitimamente
superá-la em peso.

### 8.2 Gatilhos de revisita

| # | Gatilho | Detecção | Notifica | Ação |
|---|---|---|---|---|
| T1 | O commit de execução AMH difere do snapshot de evidência fixado no IG, na sucessora da ADR-040, no contrato de particionamento, ou no inventário de ambiente. | Detecção de deriva de contrato (§7.6); QAS-0013 | `AUTH-DATA-PLATFORM` | Reverificar E1–E11; reabrir esta ADR |
| T2 | A AMH anuncia o desbloqueio de Observation. | Rota de notificação de mudança AMH | `AUTH-DATA-PLATFORM`, `AUTH-CLINSAFETY` | **Verificar a forma entregue antes de tratá-la como um insumo** — C-4 (E4) diz que a forma planejada pode ser texto livre, que nenhuma regra de scoring consegue consumir |
| T3 | A AMH publica um perfil de sinal vital ou um feed de sinal vital populado. | Detecção de deriva de contrato | `AUTH-DATA-PLATFORM`, `AUTH-CLINSAFETY` | Reabrir; A2 pode ser invalidada |
| T4 | Um ambiente AMH não-dev é provisionado. | Notificação de mudança AMH | `AUTH-OPERATIONS` | C3, C5, C7 se tornam alcançáveis |
| T5 | O Gate G1 estabelece uma necessidade de latência validada. | Registro do Gate G1 | `AUTH-CLINSAFETY` | D1 ganha uma meta; a necessidade da opção (c) se torna testável (A3) |
| T6 | O Gate G2 aprova um portfólio cujos insumos obrigatórios a AMH não consegue suprir. | Registro do Gate G2 | `AUTH-PRODUCT` | A opção D-1 passa de enumerada a exigindo análise |
| T7 | A divergência de reconciliação medida entre as lanes operacional e analítica excede a tolerância (ainda não fixada). | QAS-0010 | `AUTH-DATA-PLATFORM` | Reabrir a ADR-0006 e esta ADR |
| T8 | Um dono AMH é nomeado e alcançável. | Registro de governança | Orquestrador | **DISPARADO em 2026-08-15** — DEC-G0-04 (E12); C1 tornou-se acionável; a revisão desta data responde a este gatilho |
| T9 | *(novo, 2026-08-15)* Publicação da IG 1.1.0 com digest citável (OS-05). | Detecção de deriva de contrato (QAS-0013); rota de notificação AMH | `AUTH-DATA-PLATFORM` | Pinar o pacote; reavaliar C12; verificar enumeração de 12 tenants (R3) |
| T10 | *(novo, 2026-08-15)* Contra-assinatura da ata pelo titular ou alocação de IDs `GDEC-nnnn` para AQ-1..AQ-6 (pendência 1 da ata §8). | Registro de governança (`decision-register.md`) | Orquestrador + steward de governança | Eleva a cadeia de custódia das restrições de §2.4 de "ata de escriba" para registro ratificado — pré-condição de forma do G3 (ordens §0.2) |

### 8.3 Estratégia de kill switch / rollback

Enquanto `proposed`, não há nada para desligar. O controle relevante é a **restrição
permanente** que se aplica até que esta ADR seja aceita:

1. O adaptador AMH permanece atrás de uma porta versionada, sem que nenhum tipo AMH
   alcance o núcleo do domínio clínico (§7.6). Isso preserva as opções (a), (c) e (d-1)
   a baixo custo.
2. Nenhuma ADR dependente pode ser aceita com uma presunção rígida sobre a fronteira;
   cada uma precisa declarar explicitamente sua condicionalidade de fronteira.
3. A avaliação clínica permanece não-acionante (H5) — então nenhum caminho de dano
   clínico depende do estado desta ADR hoje.

Na aceitação, a opção aceita precisa definir seu próprio kill switch: o que é
desabilitado, por quem, dentro de qual prazo, qual é o fallback clínico, e como a
reconciliação ocorre após a recuperação (prompt §15.3). Para a opção (c)
especificamente, "a lane quase em tempo real está fora do ar" precisa ser um modo
degradado *desenhado*, visível ao clínico (DOM-0007), não uma descoberta de incidente.

---

## 9. Método de validação e evidência vinculada

| # | Alegação | Método de validação | Ambiente exigido | IDs vinculados |
|---|---|---|---|---|
| V1 | A evidência AMH em §2.1 ainda se sustenta no commit de execução. | Reexecutar a matriz de verificação de alegações da Onda 1 contra o commit de execução; diff. | Nenhum (acesso de repositório somente leitura) | `claim-verification-matrix.md`; TST: arquitetura de testes pendente |
| V2 | As interfaces AMH das quais a opção escolhida depende são alcançáveis e autorizadas. | Discovery + testes negativos de autorização em um ambiente nomeado. | **Um ambiente AMH alcançável pela V2 — não existe para não-dev hoje (E7)** | TST: arquitetura de testes pendente |
| V3 | Os insumos exigidos são populados com distribuições utilizáveis. | Matriz de elegibilidade via-para-fonte preenchida com medições (§7.2). | Acesso a dado de Camada 3 | REQ: catálogo de requisitos pendente |
| V4 | O frescor ponta a ponta atende à necessidade validada. | Sondas sintéticas ponta a ponta medindo fonte→avaliação→visível→confirmado (§14). | Ambiente similar-a-produção (C7) | QAS-0001, QAS-0003, QAS-0004, QAS-0005, QAS-0006 |
| V5 | O isolamento de tenant se sustenta através da fronteira. | Testes adversariais cross-tenant: claims de tenant forjadas/ausentes/descasadas, referências cross-partition, headers fornecidos pelo chamador. | Ambiente nomeado | QAS-0014, QAS-0018; DOM-0001; HAZ-0003, HAZ-0013; SAF-0007, SAF-0008 |
| V6 | Nenhuma perda ou coerção semântica silenciosa ocorre na camada anticorrupção. | Relatórios de reconciliação + contabilização de perda de mapeamento em nível de campo (§7.6). | Dado de Camada 3 | QAS-0019; DOM-0002, DOM-0008; HAZ-0032, HAZ-0040; SAF-0028, SAF-0032 |
| V7 | Insumos AMH ausentes aparecem como estados explícitos não-normais, nunca como zero/normal. | Testes de "razão de não-disparo" de vetor de referência retendo cada insumo exigido por vez. | Ambiente de teste (dado sintético) | DOM-0004; HAZ-0005, HAZ-0006, HAZ-0039; SAF-0001, SAF-0002, SAF-0033; TST: arquitetura de testes pendente |
| V8 | O modo degradado da fronteira escolhida é visível ao clínico e acionável. | Validação de fatores humanos sob interrupção de lane simulada. | Ambiente de usabilidade | VAL: backlog de validação pendente; DOM-0007; HAZ-0025; SAF-0024, SAF-0025 |
| V9 | Uma via aprovada nunca se torna acionável em uma lane que não consegue atender seu orçamento de latência declarado. | Orçamento declarado por via + desempenho de lane medido; a via permanece não-acionante até que ambos existam. | Ambiente similar-a-produção (C7) | HAZ-0030; SAF-0031, SAF-0035; QAS-0001, QAS-0003 |

**Disciplina de placeholder.** `docs/05-clinical-safety/hazard-log.md` e
`safety-requirements.md` foram escritos pelo engenheiro de safety-case clínico da Onda 1
durante este ciclo e **agora são citados por ID real acima**. Nenhum catálogo de
requisito ou teste existe ainda, então as referências `REQ:` e `TST:` permanecem
placeholders verbatim. **Nenhum ID HAZ, SAF, REQ, TST ou VAL foi inventado neste
documento**; todo ID HAZ/SAF citado foi lido de `docs/05-clinical-safety/`.

---

## 10. Relações de supersessão

- **Supersede:** nenhuma.
- **Superseded by:** nenhuma.
- **Notas de relação:** se a fronteira for depois re-decidida (por exemplo, a variante
  estagiada D-3 amadurecendo para (c)), a mudança precisa ser uma **nova ADR que
  supersede esta**, não uma edição a uma decisão aceita. Supersessão parcial é
  permitida por tenant, facility, ambiente ou modo de operação — a concessão de
  compatibilidade do prompt §7.3 é explicitamente por interface e por escopo, e uma
  decisão de fronteira pode legitimamente ser escopada da mesma forma. Ela nunca deve
  ser generalizada a partir de um resultado parcial.

---

## 11. Autoverificação contra o gate de completude do template

Todas as seções presentes; ≥2 alternativas viáveis mais adiar (cinco apresentadas);
toda alternativa carrega consequências positivas e negativas; direcionadores são
discriminantes e mapeados a cenários de atributo de qualidade; **nenhuma meta numérica
inventada**; todas as oito linhas transversais presentes; reversibilidade, gatilhos, e
kill/rollback presentes; métodos de validação carregam placeholders honestos;
supersessão presente; **nenhuma tecnologia escolhida**; nenhuma aprovação fabricada;
`adr-index.md` atualizado na mesma mudança.

**Autoverificação da revisão de 2026-08-15 (pt-BR):** o status desta revisão era
`proposed` e a seção 5 registrava "NENHUMA DECISÃO É REGISTRADA" — §5.2 era PROPOSAL
encaminhada, não decisão; as restrições de §2.4 eram DECIDED do titular, citadas com
fonte e data, jamais auto-aplicadas; nenhum dono foi nomeado por este revisor
(candidaturas citavam DEC-G0-04); nenhum ID de hazard/SAF/QAS foi inventado; corpo EN
preservado, conteúdo novo em pt-BR (DEC-G0-10). **Atualização (GDEC-0008,
2026-08-15):** o titular aceitou este ADR na sessão de decisão GDEC-0008 (item 4) com
a formulação própria registrada em §5.0 — a proposta de §5.2 tornou-se decisão; ver
§5.0 para o registro completo e a nota de composição obrigatória.
