---
id: ADR-0015
title: Modelo de autenticação/sessão e identidade máquina-a-máquina
status: PROPOSAL   # rótulo de evidência DESTE ARQUIVO (evidence-notation.md §2). O estado de ciclo de vida do ADR está em `adr_lifecycle_status`.
adr_lifecycle_status: "accepted (direção GDEC-0016; minuta materializada em construção — GDEC-0015)"
status_history:
  - status: not-started
    date: 2026-08-14
    by: engenheiro de arquitetura candidata e do programa de ADRs (Onda 2)
    note: ID e tópico reservados no adr-index.md (§10 item 15 do prompt); nenhuma minuta existia.
  - status: "accepted (direção)"
    date: 2026-08-16
    by: rodaquino-OMNI (titular)
    note: GDEC-0016 — aceite em lote das direções dos treze ADRs not-started; a minuta formal é trabalho de implementação.
  - status: "minuta materializada"
    date: 2026-08-16
    by: especialista de arquitetura de segurança (ciclo 6 — construção)
    note: >
      Esta minuta DOCUMENTA E DETALHA a direção já aceita; não reabre a decisão.
      Todo detalhe que vai além da direção aceita está marcado como PREMISSA
      reversível de uma linha (GDEC-0015/0017).
date: 2026-08-16
owner: >
  UNASSIGNED — VALIDATION REQUIRED (candidato por adr-index.md §3: AUTH-SECURITY,
  detido interinamente por rodaquino-OMNI apenas para a fase de projeto, DEC-G0-02)
approvers:
  - UNASSIGNED — VALIDATION REQUIRED   # papel: AUTH-SECURITY (DEC-G0-02, interino de fase de projeto)
decision_deadline: >
  UNSET — VALIDATION REQUIRED. Restrição de ordem: adr-index.md §5 lista este ADR
  entre os que o Gate G5 e o Gate G6 aguardam; a direção já está aceita (GDEC-0016).
deciding_authority_rule: >
  docs/00-governance/decision-rights.md §2, linha "Architecture decisions (ADR
  ratification)"; cláusulas de segurança adicionais sob AUTH-SECURITY.
independence_check: >
  decision-rights.md §3 — quem implementar o verificador de identidade NÃO pode
  aceitar a evidência adversarial correspondente (par implementador ≠ verificador).
  Esta minuta foi redigida por agente; nenhum agente aprova ADR.
links:
  drivers:
    domain_invariants: [DOM-0001]
    quality_scenarios: [QAS-0014, QAS-0018, QAS-0027, QAS-0028]
    risks: ["pendente — docs/00-governance/registers/risk-register.md"]
  constrains:
    requirements: ["REQ: pendente de catálogo de requisitos"]
    clinical: ["CLR: pendente do portfólio de vias clínicas (Gate G2)"]
    safety: [SAF-0007, SAF-0008, SAF-0009]
  hazards: [HAZ-0003, HAZ-0013, HAZ-0014]
  tests: ["TST: pendente de arquitetura de teste"]
  validations: ["VAL: pendente do backlog de validação"]
  adrs:
    depends_on: [ADR-0001, ADR-0003]
    feeds: [ADR-0011, ADR-0014, ADR-0016, ADR-0021]
  gates: [G5, G6]
  evidence:
    - docs/11-security-privacy-compliance/threat-model.md §2.1, §2.2, §4.E
    - docs/11-security-privacy-compliance/security-controls-catalog.md SEC-0001..SEC-0008
    - docs/06-architecture/adrs/ADR-0003-tenancy-organizacao-facility-propriedade-de-recurso.md §5.0
    - docs/00-governance/registers/decision-register.md GDEC-0016, GDEC-0017
supersedes: null
superseded_by: null
provenance:
  source_repo: intensicare-V2
  path_or_url: docs/06-architecture/adrs/ADR-0015-autenticacao-sessao-identidade-m2m.md
  commit_sha_or_version: 33c749a (HEAD de cycle-6/construcao-g7 na redação)
  section_or_lines: >
    INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §9.1 princípio 2, §9.4, §10 item 15, §13;
    threat-model.md §2.1/§2.2; security-controls-catalog.md §A
  date_collected: 2026-08-16
  collector: especialista de arquitetura de segurança (ciclo 6 — construção)
  transformation: reasoned-from — direção aceita em GDEC-0016 detalhada contra controles e ameaças já catalogados; nenhum ambiente foi testado
  confidence: medium
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
---

# ADR-0015 — Modelo de autenticação/sessão e identidade máquina-a-máquina

> **Status do ADR: accepted (direção GDEC-0016; minuta materializada em construção —
> GDEC-0015).** Esta minuta registra e detalha a direção **já aceita** pelo titular; ela
> não reabre a decisão e não a amplia. Detalhes de construção que vão além da direção
> aceita aparecem como **PREMISSA reversível de uma linha**. Nada aqui fecha gate,
> bloqueador, perigo ou risco, e nada aqui é alegação de segurança comprovada.

> **Divergência conhecida de bookkeeping:** `adr-index.md` ainda registra este ADR como
> `not-started`. A atualização do índice está **fora do escopo de escrita** desta tarefa
> e fica registrada como pendência (ver §9).

> **Correção (2026-08-19, especialista de consistência documental e
> rastreabilidade — reconciliação ADR-0015).** A frase acima estava correta em
> 2026-08-16, quando esta minuta foi redigida, e deixou de estar: `adr-index.md`
> já foi atualizado (tabela `§1`/`§3`, linhas 106 e 240; grafo `§4.2`) pela
> "Correção de sincronização (ACH-09, 2026-08-17)" registrada no próprio
> índice. O índice hoje registra `ADR-0015` como `accepted (direção GDEC-0016;
> minuta redigida 2026-08-16, ciclo 6)` — **não** `not-started`. Isto não
> promove `ADR-0015` além de "direção aceita, minuta materializada": a §9
> abaixo continua correta quanto a G5/G6, que permanecem sem fechar (uma ADR
> `accepted` não é evidência `implemented`/`verified` — `adr-index.md` §5,
> "Lembrete"). Esta é uma correção de citação cruzada desatualizada, não uma
> nova decisão sobre o mérito do ADR; nenhuma autoridade além da já registrada
> em `GDEC-0015`/`GDEC-0016` é invocada aqui.

## 1. Contexto e problema

A V2 precisa de um contexto de identidade confiável antes de qualquer leitura clínica,
porque o invariante mais carregado do sistema — DOM-0001 / princípio 2 da §9.1 do prompt
("propriedade de tenant e encontro é invariante da identidade até o armazenamento, cache,
evento, consulta, subscrição e auditoria") — só é aplicável se existir uma fonte
verificada de onde derivar tenant, sujeito e propósito.

Três fatos tornam a questão urgente e não trivial:

- **SOURCE** (`threat-model.md` §2.1): a posição de autenticação da AMH no endpoint FHIR
  é **divergente em três vias** (OAuth/SMART; mTLS interno com SMART marcado como futuro;
  um authorizer OIDC/JWT implementado com seis claims obrigatórias e `tenant` nunca
  defaultada). Qual das três está implantada é evidência de Camada 2, e não há Camada 2.
- **SOURCE** (`threat-model.md` §2.2): o lado remoto da fronteira TB-06 (provedor de
  identidade da V2) **não está decidido** — nenhum IdP foi selecionado, e a §3 regra 14 do
  prompt proíbe selecionar tecnologia por herança.
- **SOURCE** (`hazard-log.md` HAZ-0014, citando a revisão do legado): o sistema legado
  implementou exatamente a falha que este ADR precisa impedir — "a validação IAM cai para
  JWT local em qualquer erro", cookies sem `Secure`, tokens em URL, e o predecessor do
  refresh permanecendo válido.

**Pergunta:** que modelo de autenticação de usuário/sessão e de identidade
máquina-a-máquina a V2 adota, e o que a **fatia vertical G7** usa enquanto nenhum
provedor de identidade está contratado?

**Fora de escopo:** decisão de autorização e enforcement de isolamento (ADR-0016);
criptografia e custódia de chave (ADR-0017); perfis FHIR/SMART concretos (ADR-0013);
superfície MCP (ADR-0014); plataforma e residência (ADR-0019).

## 2. Direcionadores de decisão

| # | Direcionador | Por que discrimina | Atributo de qualidade | Alvo |
|---|---|---|---|---|
| D1 | **Fail-closed sem caminho alternativo** — nenhuma verificação local de contingência, nenhum "modo degradado de auth" (SEC-0004) | Opções que reaproveitam um IdP externo como única verificação tendem a criar fallback quando ele oscila | QAS-0018 | VALIDAÇÃO NECESSÁRIA |
| D2 | **`tenant` obrigatório e nunca defaultado**, no grão aceito pelo ADR-0003 (raiz de CNPJ, espelhado 1:1) | Discrimina modelos que derivam tenant de header/subdomínio (SEC-0001) | QAS-0018, QAS-0014 | VALIDAÇÃO NECESSÁRIA |
| D3 | **Identidade de workload separada da de usuário, com delegação que carrega contexto** (SEC-0006) | Sem isso, o BFF vira deputado confuso para trabalhadores de fundo e futura superfície MCP | QAS-0018 | VALIDAÇÃO NECESSÁRIA |
| D4 | **Custo de saída e portabilidade** — nenhum IdP pode ser escolhido agora (§3 regra 14) | Discrimina opções que acoplam o domínio ao formato de token de um fornecedor | QAS-0027 | VALIDAÇÃO NECESSÁRIA |
| D5 | **Compatibilidade futura com SMART on FHIR sem antecipá-la** | A AMH pode publicar SMART; construir SMART agora seria decidir por hipótese | QAS-0025 | VALIDAÇÃO NECESSÁRIA |
| D6 | **Higiene de sessão em contexto clínico à beira-leito** (SEC-0005) | Estação compartilhada e sessão remota são contextos de risco distintos; um timeout mal calibrado é um controle que será contornado | QAS-0028 | VALIDAÇÃO NECESSÁRIA |

## 3. Alternativas consideradas

### Opção A — Fronteira de verificação própria, compatível com OIDC, IdP injetável (a direção aceita)

**Descrição.** A V2 define um contrato interno de **contexto de identidade verificado** e
um verificador único que aceita tokens OIDC (assinatura contra fonte de chave pinada,
`iss`, `aud`, `exp`, `sub`, `tenant`, `scope`), sem qualquer caminho alternativo. O
provedor concreto é uma porta injetável e **não é selecionado** aqui. SMART on FHIR entra
depois como **perfil de escopos** sobre o mesmo verificador (ADR-0013).

**Positivas.** Atende D1–D5; o domínio nunca vê um token; trocar de IdP troca um adaptador.
**Negativas.** Exige disciplina para que o verificador permaneça o único ponto de entrada;
a compatibilidade real com o IdP futuro só é comprovável quando ele existir.
**Custo de saída.** Baixo — o adaptador e o mapeamento de claims.

### Opção B — Sessão própria (credencial local + sessão em banco), sem OIDC

**Positivas.** Simples, sem dependência externa, entregável na fatia sem contrato algum.
**Negativas.** A V2 passa a ser custodiante de credenciais clínicas, o que amplia
drasticamente a superfície (THR-0023, THR-0024) sem que exista dono `AUTH-SECURITY`
nomeado; incompatível com D5; migração posterior para OIDC descarta o trabalho.
**Custo de saída.** Alto — armazenamento de credencial e fluxo de recuperação são
irrecuperáveis como investimento.

### Opção C — Consumir diretamente o token do IdP da AMH

**Positivas.** Uma identidade só entre AMH e V2; alinhado ao "V2 sempre consome da AMH".
**Negativas.** Depende de resolver a divergência de três vias da TB-05, que é ato do dono
da AMH (`BLK-0010`); herda um eventual `cross_tenant_authorized=true` que a V2 não
controla (IDN-C-5); acopla a sessão clínica da V2 à disponibilidade do IdP da AMH — e o
ADR-0006 (Opção A aceita) coloca a **lane operacional da V2 como autoritativa no laço
clínico**, o que torna essa dependência incoerente com a decisão já tomada.
**Custo de saída.** Médio-alto — a sessão clínica ficaria refém de uma fronteira externa.

### Opção Z — Adiar (sem identidade na fatia)

**Positivas.** Nenhum trabalho agora.
**Negativas.** A fatia G7 nasceria com endpoints sem contexto verificado, e todo escopo de
tenant (ADR-0016) seria construído sobre um contexto fabricado no código de aplicação —
exatamente o antipadrão do legado. **Custo do atraso:** cresce a cada módulo escrito.

### 3.1 Comparação

| Direcionador | Opção A | Opção B | Opção C | Opção Z |
|---|---|---|---|---|
| D1 fail-closed | atende por construção | atende, mas com custódia própria | depende de terceiro | não atende |
| D2 tenant obrigatório | atende (claim obrigatória) | atende, com mapeamento próprio | risco de bypass herdado | não atende |
| D3 M2M separado | atende | exige construir do zero | indefinido | não atende |
| D4 portabilidade | alta | baixa | baixa | n/a |
| D5 SMART futuro | perfil sobre o mesmo verificador | incompatível | possível, mas fora de controle | n/a |

## 4. Decisão

**Direção aceita (GDEC-0016, titular rodaquino-OMNI, 2026-08-16) — Opção A.**

1. **Autenticação de usuário/sessão compatível com OIDC**, com um verificador único e
   fail-closed; **SMART on FHIR é perfil futuro**, não requisito desta fatia.
2. **Identidade máquina-a-máquina distinta da de usuário**, separadamente auditável; toda
   chamada feita em nome de um usuário carrega tenant, propósito e escopo de recurso até o
   ponto de decisão — nenhum downstream autoriza pela identidade do intermediário (SEC-0006).
3. **Na fatia G7: stub sintético com tenant no token**, verificado pelo mesmo verificador
   de produção.

**Escopo vinculado:** todo módulo e ambiente da V2 que produza ou consuma contexto de
identidade. **Não vincula:** seleção de IdP, de nuvem ou de biblioteca de token; o
mecanismo de autorização (ADR-0016); perfis FHIR/SMART (ADR-0013).

### 4.1 Premissas de construção (reversíveis, uma linha cada)

- PREMISSA (reversível, GDEC-0015/0017): na fatia G7 a autenticação é um emissor local **sintético** (`dev-issuer`) que produz exatamente o mesmo conjunto de claims obrigatórias do verificador de produção, sem qualquer caminho alternativo, e nenhum IdP é selecionado por este ADR.
- PREMISSA (reversível, GDEC-0015/0017): as claims obrigatórias mínimas são seis — `iss`, `aud`, `exp`, `sub`, `tenant`, `scope` — com `nbf` verificada quando presente e `tenant` **nunca** defaultada nem derivada de valor controlado pelo chamador.
- PREMISSA (reversível, GDEC-0015/0017): o emissor sintético só é habilitável sob perfil `dev`/`test`; em qualquer outro perfil a aplicação **falha ao iniciar** em vez de degradar.
- PREMISSA (reversível, GDEC-0015/0017): o contexto de identidade verificado é um tipo do domínio (`VerifiedIdentityContext`) construível **apenas** pelo verificador, de modo que código de aplicação não possa fabricá-lo.
- PREMISSA (reversível, GDEC-0015/0017): a sessão do navegador usa cookie do BFF com `Secure`, `HttpOnly` e `SameSite`, token nunca em URL nem em armazenamento legível por script, e rotação de refresh que invalida o predecessor atomicamente.
- PREMISSA (reversível, GDEC-0015/0017): identidades de workload (relay de outbox, trabalhadores, futura superfície MCP) recebem sujeito próprio e asserção de ator (`on-behalf-of`) carregando `tenant`/`purpose`; nenhuma delas recebe escopo de leitura clínica ampla.
- PREMISSA (reversível, GDEC-0015/0017): o tempo de sessão e o timeout de inatividade são configuráveis por perfil e ficam `VALIDAÇÃO NECESSÁRIA` até revisão de fatores humanos — nenhum número clínico é inventado aqui.

## 5. Consequências

**Positivas.** O contexto verificado passa a ser pré-condição estrutural (não convencional)
de qualquer consulta; ADR-0016 ganha um objeto concreto de onde derivar escopo; a troca de
IdP fica confinada a um adaptador; o antipadrão do legado (fallback local) é impedido por
tipo e por teste, não por revisão.

**Negativas.** Um verificador próprio é código de segurança escrito em casa — precisa de
matriz de testes negativos séria e de verificador independente; o stub sintético é uma
superfície que **não pode** vazar para fora de `dev`/`test`, e essa contenção vira um
requisito de CI permanente; a compatibilidade real com a AMH permanece não demonstrada
enquanto a TB-05 estiver divergente.

**Neutras.** Nada aqui seleciona fornecedor, biblioteca ou nuvem (§3 regra 14); nada aqui
torna a AMH consumível.

## 6. Implicações transversais

| Dimensão | Implicação | Rótulo | Papel dono |
|---|---|---|---|
| Segurança clínica | Identidade fail-open é a causa direta de exibir o paciente errado a um clínico (HAZ-0003/HAZ-0013/HAZ-0014); o modelo aceito ataca a raiz, mas não fecha nenhum perigo | INFERENCE de HAZ-0014 | AUTH-CLINSAFETY |
| Segurança | Cobre SEC-0001, SEC-0004, SEC-0005, SEC-0006; **não** cobre SEC-0007 (break-glass), que permanece aberto | SOURCE do catálogo | AUTH-SECURITY |
| Privacidade | Token não carrega identificador de paciente; propósito viaja como claim para permitir limitação de finalidade a jusante | PROPOSAL | AUTH-PRIVACY-LEGAL (UNASSIGNED) |
| Interoperabilidade | SMART fica como perfil de escopos sobre o mesmo verificador; nenhuma conformidade é alegada | PROPOSAL | AUTH-DATA-PLATFORM |
| Acessibilidade | Expiração e reautenticação precisam de anúncio acessível e recuperação sem perda de trabalho em curso (WCAG 2.2 AA como requisito de projeto); um timeout agressivo em beira-leito é barreira de acessibilidade | INFERENCE | AUTH-UX |
| Operação | Falha da fonte de chave deve resultar em **negação**, e a negação precisa ser observável (QAS-0014); rotação de chave do IdP é procedimento operacional futuro | PROPOSAL | AUTH-OPERATIONS |
| Custo | Baixo na fatia (emissor sintético); custo real desloca-se para o contrato de IdP futuro | INFERENCE | AUTH-PRODUCT |
| Migração | Trocar o emissor sintético pelo IdP real é trocar um adaptador e reconfigurar a fonte de chave; nenhum dado migra | INFERENCE | AUTH-OPERATIONS |

## 7. Reversibilidade e gatilhos de revisita

**Reversibilidade: alta.** O que fica retido em caso de reversão é o mapeamento de claims e
a matriz de testes negativos — ambos reaproveitáveis por qualquer IdP.

| # | Gatilho (evento observável) | Ação |
|---|---|---|
| T1 | A AMH resolve a divergência de três vias da TB-05 e publica a posição implantada | Reavaliar se a Opção C se torna viável para federação (não para sessão clínica) |
| T2 | Um IdP é contratado | Substituir o adaptador; o stub sintético é removido do caminho de produção por configuração e por teste |
| T3 | SMART on FHIR passa a ser exigido por um consumidor real | Abrir perfil de escopos em ADR-0013 sem alterar o verificador |
| T4 | Qualquer código de fallback de verificação for detectado por análise estática | Falha de build; revisita imediata do ADR |
| T5 | Revisão de fatores humanos indicar que o timeout provoca contorno | Recalibrar D6 com evidência, não com preferência |

**Kill switch.** Desabilitar o emissor sintético é uma mudança de configuração que **nega
tudo** (fail-closed) — não existe modo de contorno. Não há fallback clínico para "sem
identidade": a UI deve declarar indisponibilidade, nunca exibir dado sem contexto.

## 8. Validação

| # | Alegação | Método | Ambiente | IDs |
|---|---|---|---|---|
| V1 | Nenhum caminho alternativo de verificação existe | Análise estática + matriz de testes negativos (emissor errado, audiência errada, expirado, `alg` inseguro, sem assinatura, `tenant` ausente, `tenant` divergente) | dev/CI | TST: pendente |
| V2 | `tenant` nunca é derivado de valor do chamador | Teste negativo por fonte de contexto + verificação estática | dev/CI | SAF-0007 |
| V3 | Falha da fonte de chave resulta em negação, não em fallback | Injeção de falha na fonte de chave | dev/CI | THR-0021 |
| V4 | Delegação carrega contexto até o ponto de decisão | Suíte de deputado confuso por fronteira | dev/CI | THR-0026 |
| V5 | O emissor sintético não é habilitável fora de `dev`/`test` | Teste de inicialização por perfil (deve falhar ao iniciar) | dev/CI | SEC-0017 |

Evidência adversarial independente (Gate G6) permanece **não produzida**; nada aqui a
substitui.

## 9. Supersessão e pendências

- **Supersede:** nenhuma. **Superseded por:** nenhuma.
- **Pendência:** `adr-index.md` continua marcando `ADR-0015` como `not-started` e a §5 do
  índice ainda o lista como bloqueador de G5/G6; atualizar o índice está fora do escopo de
  escrita desta tarefa.

  > **Correção (2026-08-19, especialista de consistência documental e
  > rastreabilidade).** A primeira metade desta pendência está desatualizada —
  > ver a correção de topo deste arquivo: `adr-index.md` não marca mais
  > `ADR-0015` como `not-started`. A segunda metade permanece verdadeira e não
  > é afetada por esta correção: `adr-index.md` §5 continua listando
  > `ADR-0015` entre as ADRs que G5 e G6 aguardam, porque aceitação de direção
  > não equivale a evidência `implemented`/`verified` — G5 e G6 permanecem, de
  > fato, sem fechar.
- **Pendência:** `AUTH-SECURITY` para as cláusulas de operação (break-glass, revisão de
  acesso) permanece `UNASSIGNED` (`BLK-0003`).
