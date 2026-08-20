---
id: ADR-0016
title: Autorização e enforcement de isolamento de tenant
status: PROPOSAL   # rótulo de evidência DESTE ARQUIVO (evidence-notation.md §2). O estado de ciclo de vida do ADR está em `adr_lifecycle_status`.
adr_lifecycle_status: "accepted (direção GDEC-0016; minuta materializada em construção — GDEC-0015)"
status_history:
  - status: not-started
    date: 2026-08-14
    by: engenheiro de arquitetura candidata e do programa de ADRs (Onda 2)
    note: ID e tópico reservados no adr-index.md (§10 item 16 do prompt); nenhuma minuta existia.
  - status: "accepted (direção)"
    date: 2026-08-16
    by: rodaquino-OMNI (titular)
    note: GDEC-0016 — aceite em lote das direções dos treze ADRs not-started; a minuta formal é trabalho de implementação.
  - status: "minuta materializada"
    date: 2026-08-16
    by: especialista de arquitetura de segurança (ciclo 6 — construção)
    note: >
      Esta minuta DOCUMENTA E DETALHA a direção já aceita; não reabre a decisão.
      Detalhes além da direção aceita estão marcados como PREMISSA reversível de
      uma linha (GDEC-0015/0017).
date: 2026-08-16
owner: >
  UNASSIGNED — VALIDATION REQUIRED (candidato por adr-index.md §3: AUTH-SECURITY,
  detido interinamente por rodaquino-OMNI apenas para a fase de projeto, DEC-G0-02)
approvers:
  - UNASSIGNED — VALIDATION REQUIRED   # papel: AUTH-SECURITY (DEC-G0-02)
decision_deadline: >
  UNSET — VALIDATION REQUIRED. Restrição de ordem: adr-index.md §5 lista este ADR
  como um dos que o Gate G6 aguarda, e o G6 exige evidência adversarial além da aceitação.
deciding_authority_rule: >
  docs/00-governance/decision-rights.md §2, linha "Architecture decisions (ADR ratification)".
independence_check: >
  decision-rights.md §3 — a campanha adversarial multi-tenant DEVE ser conduzida por
  quem não implementou o isolamento (SEC-0009). Minuta redigida por agente; nenhum
  agente aprova ADR.
links:
  drivers:
    domain_invariants: [DOM-0001]
    quality_scenarios: [QAS-0014, QAS-0018, QAS-0024, QAS-0028]
    risks: ["pendente — docs/00-governance/registers/risk-register.md"]
  constrains:
    requirements: ["REQ: pendente de catálogo de requisitos"]
    clinical: ["CLR: pendente do portfólio de vias clínicas (Gate G2)"]
    safety: [SAF-0007, SAF-0008, SAF-0009]
  hazards: [HAZ-0003, HAZ-0013]
  tests: ["TST-DOM-0001", "TST: pendente de arquitetura de teste"]
  validations: ["VAL: pendente do backlog de validação"]
  adrs:
    depends_on: [ADR-0003, ADR-0015]
    feeds: [ADR-0011, ADR-0014, ADR-0018]
  gates: [G6]
  evidence:
    - docs/06-architecture/adrs/ADR-0003-tenancy-organizacao-facility-propriedade-de-recurso.md §5.0 (grão A + enforcement E-c)
    - docs/11-security-privacy-compliance/security-controls-catalog.md SEC-0001, SEC-0003, SEC-0009, SEC-0010, SEC-0033
    - docs/11-security-privacy-compliance/threat-model.md §4.D
    - docs/00-governance/registers/decision-register.md GDEC-0016, GDEC-0017
supersedes: null
superseded_by: null
provenance:
  source_repo: intensicare-V2
  path_or_url: docs/06-architecture/adrs/ADR-0016-autorizacao-isolamento-de-tenant.md
  commit_sha_or_version: 33c749a (HEAD de cycle-6/construcao-g7 na redação)
  section_or_lines: >
    INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §9.1 princípio 2, §9.4, §10 item 16, §13;
    ADR-0003 §5.0; security-controls-catalog.md §A
  date_collected: 2026-08-16
  collector: especialista de arquitetura de segurança (ciclo 6 — construção)
  transformation: reasoned-from — direção aceita em GDEC-0016 detalhada contra ADR-0003 e o catálogo de controles; nenhum ambiente foi testado
  confidence: medium
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
---

# ADR-0016 — Autorização e enforcement de isolamento de tenant

> **Status do ADR: accepted (direção GDEC-0016; minuta materializada em construção —
> GDEC-0015).** Esta minuta registra e detalha a direção **já aceita**; não reabre a
> decisão. Detalhes de construção aparecem como **PREMISSA reversível de uma linha**.
> Nada aqui fecha gate, bloqueador, perigo ou risco; nada aqui é alegação de isolamento
> comprovado — o Gate G6 exige evidência adversarial que **não existe**.

> **Divergência conhecida de bookkeeping:** `adr-index.md` ainda registra este ADR como
> `not-started`; a atualização do índice está fora do escopo de escrita desta tarefa (§9).

> **Correção (2026-08-19, especialista de consistência documental e
> rastreabilidade — reconciliação ADR-0016).** A frase acima estava correta em
> 2026-08-16, quando esta minuta foi redigida, e deixou de estar: `adr-index.md`
> já foi atualizado (tabela `§1`/`§3`, linhas 107 e 241; grafo `§4.2`) pela
> "Correção de sincronização (ACH-09, 2026-08-17)" registrada no próprio
> índice. O índice hoje registra `ADR-0016` como `accepted (direção GDEC-0016;
> minuta redigida 2026-08-16, ciclo 6)` — **não** `not-started`. Isto não
> promove `ADR-0016` além de "direção aceita, minuta materializada": a §9
> abaixo continua correta quanto ao Gate G6, que permanece sem fechar (uma
> ADR `accepted` não é evidência `implemented`/`verified` — `adr-index.md`
> §5, "Lembrete"; V6 desta minuta — a campanha adversarial por verificador
> independente, §8 — segue **NÃO EXECUTADA**). Esta é uma correção de citação
> cruzada desatualizada, não uma nova decisão sobre o mérito do ADR; nenhuma
> autoridade além da já registrada em `GDEC-0015`/`GDEC-0016` é invocada
> aqui.

## 1. Contexto e problema

**SOURCE** (prompt §9.1, princípio 2): *"Tenant and encounter ownership are invariants
from identity through storage, cache, event, query, subscription, and audit."* O
enunciado é uma cadeia: o invariante não vale se **uma única** superfície escapar.

**SOURCE** (`ADR-0003` §5.0, aceito em GDEC-0008): o grão é **Opção A** — tenant da V2 =
tenant da AMH (raiz de CNPJ), espelhado 1:1; a hierarquia
`Organization → Facility → CareUnit → Bed` vive **dentro** do tenant como estrutura
clínico-operacional, não como fronteira de isolamento. A classe de enforcement aceita é
**E-c, defesa em profundidade** (aplicação obrigatória + política no armazenamento onde a
tecnologia suportar + suíte adversarial contínua).

**SOURCE** (`security-controls-catalog.md` SEC-0001): o sistema legado implementou a
negação exata deste controle — *"o header do chamador vence; a checagem de igualdade é
tautológica"*.

**Pergunta:** como a V2 impõe autorização e isolamento de tenant de modo que **nenhuma**
superfície — consulta, evento, projeção, cache, subscrição, exportação, auditoria — possa
existir sem escopo, e que a ausência de escopo seja detectável mecanicamente e não por
revisão humana?

**Fora de escopo:** de onde vem o contexto verificado (ADR-0015); grão de tenant
(ADR-0003, já decidido); criptografia (ADR-0017); integridade de auditoria (ADR-0018);
seleção de banco de produção (ADR-0019).

## 2. Direcionadores de decisão

| # | Direcionador | Por que discrimina | Atributo de qualidade | Alvo |
|---|---|---|---|---|
| D1 | **Impossibilidade estrutural de consulta sem escopo** (SEC-0009: "nenhum método de repositório sem escopo pode existir") | Separa opções que dependem de disciplina de programação das que falham no compilador ou no banco | QAS-0018 | VALIDAÇÃO NECESSÁRIA |
| D2 | **Defesa em profundidade já aceita (E-c)** — aplicação **e** armazenamento | Uma opção de camada única contraria uma decisão vigente | QAS-0018 | VALIDAÇÃO NECESSÁRIA |
| D3 | **Autorização por instância de recurso, não por rota** (SEC-0003) | Escopos por rota não impedem IDOR intra-tenant | QAS-0018 | VALIDAÇÃO NECESSÁRIA |
| D4 | **Ausência de oráculo de existência cross-tenant** | Códigos/erros/timings distintos entre "não existe" e "existe em outro tenant" vazam informação (THR-0016/THR-0017) | QAS-0014 | VALIDAÇÃO NECESSÁRIA |
| D5 | **Custo operacional e de migração** | Isolamento físico por tenant multiplica migrações, backups e operação | QAS-0027 | VALIDAÇÃO NECESSÁRIA |
| D6 | **Verificabilidade adversarial** (exigência explícita do G6) | Uma opção cujo isolamento não é testável adversarialmente não passa no gate | QAS-0014 | VALIDAÇÃO NECESSÁRIA |

## 3. Alternativas consideradas

### Opção A — RLS na persistência + escopo obrigatório em toda superfície (a direção aceita)

**Descrição.** Políticas de segurança em nível de linha (RLS) no armazenamento de classe
PostgreSQL, com o tenant da sessão de banco definido pela transação a partir do contexto
verificado; **acima** disso, escopo obrigatório estrutural em toda consulta, evento,
projeção, cache, subscrição e exportação, e autorização por instância de recurso.

**Positivas.** Atende D1–D4 e D6; materializa exatamente o E-c aceito no ADR-0003; a falha
de um lado ainda encontra o outro; o teste adversarial tem alvos concretos.
**Negativas.** Duas camadas para manter em sincronia; RLS exige um papel de banco que
**não** a contorne (superusuário/dono ignora RLS conforme configuração), o que impõe uma
disciplina de papéis desde o dev; políticas mal escritas degradam desempenho.
**Custo de saída.** Médio — as políticas são SQL; o escopo de aplicação é reaproveitável.

### Opção B — Somente aplicação (repositórios escopados, sem RLS)

**Positivas.** Simples, portável para qualquer motor, sem disciplina de papéis.
**Negativas.** Contraria E-c (D2); um único caminho de consulta esquecido é um vazamento
cross-tenant (THR-0018); SEC-0009 é explícito: *"não compensado em código de aplicação"*.
**Custo de saída.** Baixo, mas o risco assumido no intervalo é alto.

### Opção C — Isolamento físico (banco ou schema por tenant)

**Positivas.** Isolamento forte e intuitivo; erro de escopo tende a virar erro de conexão.
**Negativas.** Multiplica migrações, backups, restore e observabilidade por tenant (D5);
consultas operacionais legítimas entre tenants (nenhuma existe hoje — SEC-0010 as proíbe)
ficariam impossíveis, o que é bom, mas o custo é pago mesmo com um único tenant piloto;
não dispensa o escopo em cache, evento e projeção.
**Custo de saída.** Alto — consolidar depois é migração de dados real.

### Opção Z — Adiar até a seleção do banco de produção

**Positivas.** Nenhum compromisso com um motor.
**Negativas.** A fatia G7 escreveria repositórios sem escopo e o retrofit tocaria todas as
consultas. **Custo do atraso:** cresce com cada tabela e cada projeção criada.

### 3.1 Comparação

| Direcionador | Opção A | Opção B | Opção C | Opção Z |
|---|---|---|---|---|
| D1 impossibilidade estrutural | banco + tipos | só tipos/disciplina | conexão | ausente |
| D2 coerência com E-c | atende | contraria | atende parcialmente | não atende |
| D3 por instância | camada de autorização própria | idem | não resolve intra-tenant | n/a |
| D5 custo operacional | baixo/médio | baixo | alto | n/a |
| D6 verificabilidade | alta | média | alta, mas cara | nula |

## 4. Decisão

**Direção aceita (GDEC-0016, titular rodaquino-OMNI, 2026-08-16) — Opção A:**
**RLS na persistência + escopo obrigatório em toda consulta, evento, projeção e cache**,
como materialização do invariante do §9.1 princípio 2 e do enforcement E-c do ADR-0003
(que continua definindo o **grão**; este ADR define o **mecanismo**).

**Escopo vinculado:** todos os módulos, superfícies e ambientes da V2, inclusive dev e
teste. **Não vincula:** seleção de banco de produção (ADR-0019); modelo de papéis clínicos
definitivo; política de consentimento/propósito além do transporte do claim.

### 4.1 Premissas de construção (reversíveis, uma linha cada)

- PREMISSA (reversível, GDEC-0015/0017): toda tabela de dado clínico ou operacional carrega `tenant_id` **NOT NULL e imutável**, com RLS habilitada e forçada, e um teste de conformidade de esquema reprova qualquer tabela nova sem política.
- PREMISSA (reversível, GDEC-0015/0017): o tenant é propagado ao banco por parâmetro de sessão definido **dentro da mesma transação** (`SET LOCAL`), derivado exclusivamente do `VerifiedIdentityContext` (ADR-0015); nenhuma transação abre sem defini-lo.
- PREMISSA (reversível, GDEC-0015/0017): o acesso ao banco passa por um único invólucro de transação que exige o contexto verificado como argumento — não existe caminho de consulta que o receba como opcional.
- PREMISSA (reversível, GDEC-0015/0017): chaves de cache, nomes de canal SSE e chaves de idempotência são construídas por um tipo `TenantScopedKey`, tornando **impossível por tipo** produzir chave sem tenant.
- PREMISSA (reversível, GDEC-0015/0017): envelopes de evento da outbox (ADR-0010) carregam `tenant_id` e o consumidor **reescopa** a partir do envelope, jamais confiando no escopo do produtor.
- PREMISSA (reversível, GDEC-0015/0017): a entrega SSE (ADR-0011) reavalia autorização **por evento**, não apenas na abertura da assinatura, e encerra a assinatura quando a autorização deixa de valer.
- PREMISSA (reversível, GDEC-0015/0017): negação e inexistência retornam o **mesmo** `problem+json` (mesmo código, mesma forma, mensagem em pt-BR sem detalhe de existência), e toda negação emite sinal de segurança contável (QAS-0014).
- PREMISSA (reversível, GDEC-0015/0017): na fatia G7 o modelo de papéis é mínimo — leitor clínico, atuante clínico e administrador de tenant — com autorização por instância decidida em um único ponto do módulo de autorização.
- PREMISSA (reversível, GDEC-0015/0017): **limitação registrada** — em PGlite o papel de desenvolvimento pode contornar RLS; a fatia executa os testes de isolamento também sob um papel de aplicação não privilegiado quando o motor permitir, e onde não permitir a lacuna é registrada como pendência em vez de ser encoberta pelo escopo de aplicação.
- **REQUISITO DE PRODUÇÃO (não é premissa reversível — ACHADO-01 da verificação de controles da fatia G7).** O rebaixamento de papel dentro da conexão **não é fronteira de segurança**: mediu-se que `SET SESSION AUTHORIZATION postgres` restaura o superusuário na mesma conexão, momento em que a RLS deixa de valer para todos os tenants — enquanto `SET ROLE postgres` é negado, dando falsa impressão de caminho fechado (cenário THR-0050, P0). Consequência vinculante: **a aplicação deve conectar-se ao banco já autenticada como papel não superusuário, com credencial própria e sem `SUPERUSER`/`BYPASSRLS`**; o rebaixamento por sessão serve à ergonomia de teste, jamais como controle. Enquanto o motor de desenvolvimento (PGlite, embarcado e monousuário) não suportar essa separação, a conclusão sobre RLS **não é transferível** para produção e precisa ser refeita contra PostgreSQL real com papéis distintos — evidência exigida antes de G6. Ver `docs/11-security-privacy-compliance/verificacao-de-controles-fatia-g7.md`.
- PREMISSA (reversível, GDEC-0015/0017): nenhuma estrutura que correlacione sujeitos entre tenants é criada (SEC-0010), e um teste de esquema reprova índice, chave ou visão que atravesse `tenant_id`.

## 5. Consequências

**Positivas.** O invariante DOM-0001 passa a ter dois enforcements independentes e um alvo
de teste explícito por superfície; o ADR-0011 (projeções/SSE) e o ADR-0018 (auditoria)
herdam escopo por construção; a campanha adversarial do G6 tem escopo delimitado.

**Negativas.** Disciplina de papéis de banco desde o dev, com uma limitação honesta em
PGlite; políticas RLS são código de segurança que precisa de revisão própria; o custo de
uma política mal indexada aparece como latência, não como erro; duas camadas podem
divergir silenciosamente se a suíte de conformidade não for mantida.

**Neutras.** Nada aqui seleciona motor de banco de produção (§3 regra 14) nem altera o
grão de tenant do ADR-0003.

## 6. Implicações transversais

| Dimensão | Implicação | Rótulo | Papel dono |
|---|---|---|---|
| Segurança clínica | Vazamento cross-tenant é, antes de tudo, risco de **paciente errado** (HAZ-0003/HAZ-0013); o mecanismo aceito ataca a raiz, mas não fecha nenhum perigo | INFERENCE do hazard-log | AUTH-CLINSAFETY |
| Segurança | Materializa SEC-0009 e SEC-0001; SEC-0003 (por instância) e SEC-0010 (proibição cross-PJ) ficam explicitamente dentro do escopo | SOURCE do catálogo | AUTH-SECURITY |
| Privacidade | Escopo obrigatório é pré-condição de limitação de finalidade; o propósito viaja no contexto e é registrado na auditoria (ADR-0018) | PROPOSAL | AUTH-PRIVACY-LEGAL (UNASSIGNED) |
| Interoperabilidade | Conectores e futura superfície MCP (ADR-0014) recebem o mesmo escopo; nenhum caminho de integração é isento | PROPOSAL | AUTH-DATA-PLATFORM |
| Acessibilidade | Mensagem de negação em pt-BR clínico, sem jargão e sem revelar existência, precisa ser anunciada de forma acessível e não pode induzir o clínico a repetir a ação | INFERENCE | AUTH-UX |
| Operação | Negações cross-tenant são sinal operacional de primeira classe (QAS-0014); rebuild de projeção precisa preservar escopo | PROPOSAL | AUTH-OPERATIONS |
| Custo | Baixo em construção; o custo real é a suíte adversarial contínua e sua manutenção | INFERENCE | AUTH-PRODUCT |
| Migração | Migrar para outro motor exige reescrever políticas RLS; o escopo de aplicação e os tipos permanecem | INFERENCE | AUTH-OPERATIONS |

## 7. Reversibilidade e gatilhos de revisita

**Reversibilidade: média-alta.** Reverter para camada única é trivial tecnicamente e
contraria E-c; migrar para isolamento físico (Opção C) é caro e fica retido o trabalho de
políticas.

| # | Gatilho (evento observável) | Ação |
|---|---|---|
| T1 | O motor de produção selecionado não suportar RLS equivalente | Revisita imediata — a seleção deveria ter o suporte como critério (SEC-0009, nota) |
| T2 | Um teste adversarial encontrar qualquer superfície sem escopo | Falha de gate; a superfície entra na suíte de conformidade permanente |
| T3 | Surgir requisito legítimo de leitura entre tenants | Não implementar; escalar a SEC-0010 e ao dono de privacidade — a proibição é anterior a este ADR |
| T4 | Degradação de latência atribuível a política RLS | Revisitar indexação, não relaxar a política |
| T5 | O grão de tenant do ADR-0003 mudar | Revisita conjunta (o mecanismo depende do grão) |

**Kill switch.** Não existe desligamento de isolamento. A única operação de emergência
admissível é **negar mais**, nunca menos; qualquer necessidade de acesso excepcional passa
por break-glass governado (SEC-0007), que **não** está decidido aqui.

## 8. Validação

| # | Alegação | Método | Ambiente | IDs |
|---|---|---|---|---|
| V1 | Nenhuma consulta pode omitir o predicado de tenant | Teste de conformidade de esquema + análise estática do invólucro de transação | dev/CI | TST-DOM-0001 |
| V2 | RLS nega leitura de linha de outro tenant sob papel de aplicação | Teste de isolamento em nível de linha com dois tenants sintéticos | dev/CI | SEC-0009 |
| V3 | Cache, canal SSE e chave de idempotência não podem existir sem tenant | Teste de tipo (compilação) + teste de runtime negativo | dev/CI | QAS-0018 |
| V4 | Negação e inexistência são indistinguíveis para o chamador | Teste de forma de erro e de código; comparação de resposta entre os dois casos | dev/CI | THR-0016 |
| V5 | Nenhum índice/visão atravessa tenant | Afirmação de esquema | dev/CI | SEC-0010 |
| V6 | Isolamento resiste a ataque | **Campanha adversarial por verificador independente** — NÃO EXECUTADA | ambiente similar a produção (inexistente) | G6 |

V6 é a evidência que o Gate G6 exige e que **nenhuma quantidade de teste próprio
substitui**.

## 9. Supersessão e pendências

- **Supersede:** nenhuma. **Superseded por:** nenhuma.
- **Pendência:** `adr-index.md` continua marcando `ADR-0016` como `not-started`; atualizar
  o índice está fora do escopo de escrita desta tarefa.

  > **Correção (2026-08-19, especialista de consistência documental e
  > rastreabilidade).** Esta pendência está desatualizada — ver a correção de
  > topo deste arquivo: `adr-index.md` não marca mais `ADR-0016` como
  > `not-started`. O Gate G6 permanece, de fato, sem fechar: `adr-index.md`
  > §5 continua listando `ADR-0016` entre as ADRs que G6 aguarda, porque
  > aceitação de direção não equivale a evidência `implemented`/`verified` —
  > e V6 (campanha adversarial por verificador independente, §8) segue **NÃO
  > EXECUTADA**.
- **Pendência:** limitação de RLS sob papel privilegiado em PGlite (ver §4.1) — precisa de
  decisão explícita quando o motor de produção for selecionado (ADR-0019).
- **Pendência:** break-glass (SEC-0007) e revisão de acesso (SEC-0008) permanecem sem ADR
  e sem dono nomeado (`BLK-0003`).
