---
id: ADR-0011
title: Projeções de leitura reconstruíveis e entrega em tempo real autorizada
status: proposed
status_history:
  - status: not-started
    date: 2026-08-14
    by: candidate-architecture and ADR-program engineer (Wave 2)
    note: ID reservado em adr-index.md (§10 item 11 do prompt)
  - status: proposed
    date: 2026-08-15
    by: arquiteto de decisões de runtime e entrega (ciclo 1)
    note: >
      Redigido em pt-BR (DEC-G0-10). Opções, drivers e minuta normativa proposta;
      autorização por tenant/encontro avaliada em CADA push; WebSocket/SSE jamais
      fonte de verdade. NENHUMA decisão é registrada e nenhum agente pode
      registrá-la.
date: 2026-08-15
owner: >
  UNASSIGNED — VALIDATION REQUIRED (candidatos por adr-index.md §3:
  AUTH-PRODUCT e AUTH-SECURITY — AUTH-PRODUCT detido interinamente por
  rodaquino-OMNI via DEC-G0-01; AUTH-SECURITY de fase de projeto via DEC-G0-02;
  a confirmação como dono é ato humano, não deste autor)
approvers:
  - UNASSIGNED — VALIDATION REQUIRED   # role: AUTH-PRODUCT (forma das projeções e do gateway)
  - UNASSIGNED — VALIDATION REQUIRED   # role: AUTH-SECURITY (autorização por push, escopo de subscrição, superfície de PHI)
decision_deadline: >
  UNSET — VALIDATION REQUIRED. Restrição de ordem: o Gate G4 lista este ADR
  (adr-index.md §5); a fatia G7 exige "authorized read model and real-time
  update" demonstrados.
deciding_authority_rule: >
  docs/00-governance/decision-rights.md §2, linha "Architecture decisions (ADR
  ratification)"; cláusulas de exibição de estado degradado/frescor com
  consequência clínica (P6/P7) exigem adicionalmente AUTH-CLINSAFETY e AUTH-UX.
independence_check: >
  decision-rights.md §3: quem implementar o gateway/projeções NÃO pode aceitar a
  evidência adversarial de isolamento de tenant correspondente (controle de
  segurança × caso de segurança). Este ADR foi redigido por agente; nenhum
  agente o aprova; o autor não é aprovador.
links:
  drivers:
    domain_invariants: [DOM-0001, DOM-0004, DOM-0006, DOM-0007, DOM-0008]
    quality_scenarios: [QAS-0005, QAS-0006, QAS-0008, QAS-0009, QAS-0014, QAS-0017, QAS-0018, QAS-0022, QAS-0023, QAS-0029]
    risks: ["pending risk register IDs — see docs/00-governance/registers/risk-register.md"]
  constrains:
    requirements: ["REQ: pendente de catálogo de requisitos (docs/04-product-requirements ainda não existe)"]
    clinical: ["CLR: pendente do portfólio de vias clínicas (Gate G2)"]
    safety: [SAF-0005, SAF-0006, SAF-0007, SAF-0008, SAF-0015, SAF-0016, SAF-0024, SAF-0025, SAF-0026, SAF-0031, SAF-0034]
  hazards: [HAZ-0004, HAZ-0013, HAZ-0015, HAZ-0016, HAZ-0017, HAZ-0025, HAZ-0037, HAZ-0041]
  tests: ["TST-DOM-0001", "TST-DOM-0006", "TST: pendente de arquitetura de teste"]
  validations: ["VAL: pendente do backlog de validação"]
  adrs:
    depends_on: [ADR-0010, ADR-0016]
    feeds: [ADR-0012, ADR-0021]
  gates: [G4]
  evidence:
    - docs/03-domain/invariants/DOM-invariants.md
    - docs/05-clinical-safety/hazard-log.md
    - docs/11-security-privacy-compliance/threat-model.md
    - docs/06-architecture/adrs/ADR-0008-evaluation-status-and-completeness-freshness-semantics.md
    - docs/06-architecture/components/sequencia-observacao-avaliacao-alerta.md
supersedes: null
superseded_by: null
provenance:
  source_repo: intensicare-V2
  path_or_url: docs/06-architecture/adrs/ADR-0011-projecoes-de-leitura-e-entrega-tempo-real-autorizada.md
  commit_sha_or_version: 0c36f03 (HEAD do repositório na redação; este arquivo não está commitado)
  section_or_lines: >
    INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §3 regras 6 e 9, §9.1 princípios 2/6/7,
    §9.2 (contextos de projeções e entrega autorizada), §9.4 (gateway único com
    cursores de retomada, filas limitadas, reconciliação por polling), §10 item 11,
    §11 (estados de conexão e de frescor; requisitos de servidor-autoritativo),
    §20 (jamais esconder incerteza de entrega); ADR-0008 §4.2 N4/N5/N7
  date_collected: 2026-08-15
  collector: arquiteto de decisões de runtime e entrega (ciclo 1)
  transformation: >
    reasoned-from — opções derivadas do baseline candidato §9.4, dos invariantes e
    do precedente legado registrado em hazard/threat (WS/SSE sem autorização de
    canal); nenhum artefato legado foi reverificado.
  confidence: medium
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
---

# ADR-0011 — Projeções de leitura reconstruíveis e entrega em tempo real autorizada

> **Status: `proposed`. Este documento apresenta opções, drivers e uma minuta
> normativa proposta (§5.2). NÃO registra decisão.** Três restrições não são
> alternativas em avaliação: regra §3-9 (tempo real deriva de estado durável;
> WebSocket/SSE/MCP jamais são o registro clínico), regra §3-6 (contexto de
> tenant jamais inferido de valor controlado pelo chamador) e DOM-0006
> (projeções rebuildáveis). Elas vinculam toda opção abaixo.

---

## 1. Contexto e formulação do problema

SOURCE (prompt §9.3): a cadeia terminal do modelo conceitual é
`Durable events → RebuildableProjection → Authorized UI/notification`. SOURCE
(§9.4): a topologia candidata nomeia *"rebuildable read projections"* e *"one
authorized real-time gateway with resume cursors, bounded queues, telemetry, and
polling reconciliation"*. SOURCE (§11): a UI exige estados visivelmente
distintos de conexão (*online, degraded, offline, reconnecting, replaying,
reconciled*) e de frescor (*fresh, aging, stale, expired…*), com filtragem,
paginação, agregação e autorização **server-authoritative**.

INFERENCE (do precedente registrado): o legado teve exatamente os modos de falha
que este ADR existe para tornar irrepresentáveis — canais WS/SSE autorizados
apenas por autenticação, sem escopo de tenant/paciente/canal (HAZ-0013, com
citação legada "no tenant/patient channel authorization on WS/SSE"; THR-0016);
alerta durável nunca renderizado a humano algum por fan-out process-local ou
socket caído (HAZ-0015); grade de leitos congelada exibindo últimos valores como
se atuais (HAZ-0025).

Este ADR consome o backbone do ADR-0010 (eventos duráveis dos quais projeções
derivam) e a máquina do ADR-0009 (estados que as filas/grades exibem), e alimenta
ADR-0012 (contrato de API) e ADR-0021 (frontend/BFF).

**Pergunta.** Como a V2 constrói as visões de leitura (grade de leitos, linha do
tempo do paciente, explicação de via, filas de trabalho) e as entrega em tempo
real — de modo que toda projeção seja reconstruível de eventos duráveis, toda
entrega push seja autorizada por tenant/encontro **a cada push**, toda lacuna de
entrega seja reconciliável por polling e explícita, e nenhum canal de tempo real
jamais funcione como fonte de verdade?

**Fora de escopo** (cada item nomeado):

- O backbone que produz os eventos duráveis — **ADR-0010**.
- Os estados de alerta/item exibidos — **ADR-0009**.
- Semântica dos cinco estados de avaliação e recomputação de atualidade —
  **ADR-0008** (aceito; consumido como restrição N4/N5/N7).
- Contrato REST/paginação/erros/versionamento — **ADR-0012**.
- Autenticação/sessão e o mecanismo concreto de imposição de autorização —
  **ADR-0015/0016** (este ADR fixa *onde e quando* a autorização é avaliada na
  entrega; o *como* é de lá).
- Canal de notificação **externa** (SMS/push/pager), seu conteúdo e PHI —
  permanece ⚠ UNDECIDED (`system-context.md` F7; ADR-0019); aqui entra apenas a
  regra estrutural P9 (derivação do registro durável).
- Design visual/interação das superfícies — ADR-0021 e prompt §11 (validação com
  usuários).
- Tecnologia de transporte push (WebSocket × SSE × long-poll é decisão de
  contrato/plataforma futura com drivers medidos; as garantias daqui são
  neutras ao transporte — §3-14).

---

## 2. Evidência e premissas

### 2.1 Evidência

**Nota epistêmica única.** Linhas de invariantes/hazards/threats/ADRs são
`SOURCE`/`OBSERVED` por leitura em disco deste autor; alegações legadas são
SOURCE via hazard log/threat model; nenhum artefato legado foi reverificado.

| # | Rótulo | Afirmação | Fonte | Confiança |
|---|---|---|---|---|
| E1 | SOURCE | Regra §3-9: *"Real-time delivery must be derived from durable, replayable state or events. WebSocket/SSE/MCP responses are not the clinical system of record."* | prompt §3 | alta |
| E2 | SOURCE | Regra §3-6: contexto de tenant/paciente/encontro/autorização jamais inferido de valor controlado pelo chamador. | prompt §3 | alta |
| E3 | SOURCE | DOM-0006: toda projeção é rebuildável somente de eventos duráveis; entrega em tempo real jamais carrega fato não persistido; DOM-0001: toda subscrição/cache/consulta/projeção é atribuível a exatamente um tenant (e encontro onde aplicável) em toda camada. | DOM-invariants.md | alta |
| E4 | SOURCE | HAZ-0013 (S5/L4, Unacceptable): consulta/cache/projeção/tópico/subscrição sem escopo de tenant verificado → leitura cross-tenant; precedente legado: dashboard global, CRUD de roteamento com tenant arbitrário, WS/SSE sem autorização de canal. | hazard-log.md HAZ-0013 | alta |
| E5 | SOURCE | THR-0016: subscrição autorizada só por autenticação, não por escopo; THR-0019: cache/projeção/sessão de pool sem chave de tenant devolve dados de A para B; THR-0017: agregados/contagens/erros diferenciais vazam existência cross-tenant. | threat-model.md THR-0016, THR-0017, THR-0019 | alta |
| E6 | SOURCE | HAZ-0015: alerta gerado e durável **nunca renderizado** a humano algum (fan-out process-local, socket caído, canal não autorizado, filtro de cliente) — o par estrutural do "entregue mas não durável". | hazard-log.md HAZ-0015 | alta |
| E7 | SOURCE | HAZ-0025: feed para/degrada e a UI segue exibindo últimos valores com aparência de atuais; a grade congelada plausível é mais perigosa que a visivelmente quebrada (DOM-0007). | hazard-log.md HAZ-0025 | alta |
| E8 | SOURCE | THR-0042: exaustão de conexões do gateway, filas por conexão sem limite, tempestade de reconexão pós-deploy, backlog de replay em cursores de retomada — o modo de falha do próprio gateway. | threat-model.md THR-0042 | alta |
| E9 | SOURCE | ADR-0008 (aceito): status dependente de tempo é **recomputado na leitura/exibição**, jamais congelado na escrita; projeções e caches recomputam ou invalidam (N5); roll-ups contam cada status não-`valid` em categoria própria, proibido dobrar em normal (N4-iii); nenhum consumidor promove status (N4-iv); severidade só legível com status `valid`/`partial`-sob-política (N7). | ADR-0008 §4.2 N4, N5, N7 | alta |
| E10 | SOURCE | Prompt §11: sem estado otimista local que mascare falha de comando de segurança; fonte e frescor explícitos onde clinicamente relevante; anúncios coalescidos de live-region e pistas não-cromáticas (HAZ-0037). | prompt §11; hazard-log.md HAZ-0037 | alta |
| E11 | SOURCE | Prompt §20: jamais esconder *"alert-delivery uncertainty"*, degradação ou falha parcial. | prompt §20 | alta |
| E12 | SOURCE | HAZ-0041: canal de notificação externa falsificado/comprometido sem meio de verificar contra o registro autoritativo → clínico age sobre alerta fabricado; a verificabilidade contra o registro durável é o controle estrutural. | hazard-log.md HAZ-0041 | alta |
| E13 | SOURCE | QAS-0005 (gerado→visível), QAS-0006 (gerado→reconhecido), QAS-0009 (lag e rebuild de projeção), QAS-0029 (readiness representa capacidade segura, não vivacidade de processo) são os cenários de medição; alvos VALIDATION REQUIRED. | quality-attribute-scenarios.md | alta |

### 2.2 Premissas

A registrar em `assumptions-register.md`; **nenhum ID `ASM` é cunhado aqui**.

| # | Premissa | Por que é necessária | O que a invalida | Dono |
|---|---|---|---|---|
| A1 | A decisão de autorização por push pode ser avaliada com custo aceitável (cache de decisão com invalidação por mudança de contexto conta como avaliação, desde que a invalidação seja imposta pelo servidor — nunca TTL cego sobre mudança de acesso). | Sustenta P3 sem inventar número de custo. | Medição futura mostrando custo proibitivo mesmo com cache de decisão bem invalidado — reabriria a granularidade, jamais o princípio. | UNASSIGNED — VALIDATION REQUIRED |
| A2 | O conjunto de superfícies do §9.2 (grade de leitos, linha do tempo, explicação de via, filas) cobre as projeções iniciais; novas superfícies entram pelo mesmo contrato. | Delimita o alcance da minuta sem enumerar UI futura. | Portfólio/validação de usuário exigindo superfície que não caiba no contrato de projeção. | UNASSIGNED — VALIDATION REQUIRED |
| A3 | O polling de reconciliação pode servir de caminho de verdade de recuperação para TODA superfície (nenhuma superfície é push-only). | Sustenta P8; é a rede de segurança do gateway. | Superfície cuja semântica exija push exclusivo — seria defeito de desenho a corrigir, não exceção. | UNASSIGNED — VALIDATION REQUIRED |
| A4 | Clientes toleram desconexão explícita com instrução de reconciliar (P5) sem perda de trabalho (proteção de trabalho não salvo é do ADR-0021). | Permite filas limitadas com shed honesto. | Validação de usuário mostrando que desconexão explícita em cenário crítico é inaceitável — reabriria a política de shed, não o princípio de fila limitada. | UNASSIGNED — VALIDATION REQUIRED |

### 2.3 Hipóteses a testar

| # | Hipótese | Como seria testada | Quem testa | Estado |
|---|---|---|---|---|
| H1 | A reconstrução completa das projeções dentro da janela de replay do ADR-0010 cabe na janela operacional aceitável (rebuild não é evento de indisponibilidade prolongada). | Rebuild cronometrado na fatia G7 com volume sintético representativo. | engenharia de plataforma + verificador independente | UNTESTED |
| H2 | A avaliação de autorização por push (A1) sustenta o volume de eventos×conexões da fatia com folga. | Teste de carga do gateway na fatia G7. | idem | UNTESTED |
| H3 | Os estados de conexão/frescor exigidos pelo §11 são compreensíveis e acionáveis pelos usuários representativos em cenário degradado. | Validação de fatores humanos sob desconexão/staleness simuladas. | especialista de fatores humanos + AUTH-UX | UNTESTED |

---

## 3. Direcionadores de decisão e atributos de qualidade mensuráveis

Alvos numéricos: `VALIDATION REQUIRED` — **nenhum é inventado**.

| # | Driver | Por que discrimina | Atributo mensurável | Alvo |
|---|---|---|---|---|
| D1 | **Isolamento de tenant/encontro em toda entrega** (E4, E5): cada push, cada linha de projeção, cada chave de cache | As opções diferem em *onde* o escopo é imposto: no servidor por push, na subscrição apenas, ou no cliente (que E2 proíbe) | QAS-0014, QAS-0018; TST-DOM-0001 | Vinculante (DOM-0001; regra §3-6) |
| D2 | **Nenhum fato clínico visível sem lastro durável; nenhum lastro durável invisível sem sinal** (E1, E6) | Opções diferem em se o caminho push é derivação exclusiva do durável e se a lacuna de entrega é detectável (cursor+polling) ou silenciosa | QAS-0005, QAS-0022; TST-DOM-0006 | Vinculante (DOM-0006; regra §3-9) |
| D3 | **Degradação explícita** (E7, E11): desconexão, staleness e backlog visíveis como estados, jamais grade congelada plausível | Opções diferem em se o estado de conexão/frescor é parte do contrato ou cortesia do cliente | QAS-0023, QAS-0017 | Vinculante (DOM-0007) |
| D4 | **Reconstruibilidade e recuperação** (E3): projeção deletável e reconstruível; cliente retomável por cursor; reconciliação por polling | Opções diferem em existir ou não caminho de verdade de recuperação independente do push | QAS-0009, QAS-0022 | Vinculante (DOM-0006) |
| D5 | **Fidelidade de status na leitura** (E9): recomputação N5, roll-ups N4, sem promoção N4-iv | Opções server-authoritative impõem isso uma vez; composição no cliente re-implementa N vezes | QAS-0017 | Vinculante (ADR-0008 aceito) |
| D6 | **Resiliência do próprio gateway** (E8): filas limitadas, shed declarado, tempestade de reconexão | Opções diferem na superfície exposta a exaustão | QAS-0008; THR-0042 | VALIDATION REQUIRED |
| D7 | **Custo e complexidade operacional** | Gateway + projeções + reconciliação custam operação; polling-only custa latência; sem modelo de custo | QAS-0027 | VALIDATION REQUIRED |

---

## 4. Alternativas consideradas

### Opção A — Projeções server-side rebuildáveis + gateway único de tempo real com autorização por push, cursores e reconciliação por polling (elaboração do baseline §9.4)

**Descrição.** As superfícies de leitura são projeções server-side derivadas
exclusivamente dos eventos duráveis do ADR-0010, chaveadas por tenant (e
encontro onde aplicável), deletáveis e reconstruíveis. Um único gateway de tempo
real entrega deltas: cada push é autorizado contra o contexto verificado da
sessão no momento da entrega (P3); o cliente mantém cursor durável de retomada;
lacuna ou dúvida → reconciliação por polling server-authoritative (P8); filas
por conexão são limitadas com política declarada (P5).

**Frente aos drivers.** D1: imposição única, server-side, por push — testável
adversarialmente num único lugar. D2: push é derivação do durável por construção;
a tríade cursor+telemetria+polling torna a lacuna detectável (E6 endereçado).
D3: estado de conexão/frescor faz parte do contrato de projeção (P6). D4: por
construção. D5: N4/N5/N7 impostas uma vez, no servidor. D6: o gateway é um ponto
único a proteger contra E8 — superfície concentrada, com o benefício de ser UMA
superfície. D7: o conjunto completo (projeções + gateway + reconciliação) é o
mais caro das opções de push.

**Consequências positivas.** Implementa literalmente o baseline §9.4; um único
lugar para evidência adversarial de isolamento (G6); a UI recebe estados prontos
(inclusive frescor recomputado), reduzindo o risco de reimplementação divergente
de N4/N5 em cada cliente.

**Consequências negativas.** O gateway é componente crítico com modos de falha
próprios (E8) que exigem projeto e teste dedicados; a autorização por push tem
custo (A1/H2); manter cursores e reconciliação é disciplina permanente de
contrato; latência levemente maior que fan-out ingênuo — paga como preço da
autorização.

**O que precisaria ser verdade.** A1 (custo de decisão aceitável — H2) e A3
(polling cobre tudo).

**Custo de saída.** Moderado: as projeções sobrevivem a qualquer mudança de
transporte; o contrato de cursor/reconciliação é o que os clientes acoplam.

### Opção B — Somente polling: projeções server-side + consulta periódica; sem canal push

**Descrição.** As mesmas projeções rebuildáveis da Opção A, consumidas
exclusivamente por polling autenticado/autorizado por requisição; nenhum
gateway push.

**Frente aos drivers.** D1: autorização por requisição — o modelo mais simples e
mais testado que existe. D2: nenhum canal paralelo a auditar; a "lacuna de
entrega" vira apenas intervalo de polling. D3: staleness é o intervalo — fácil de
exibir honestamente. D4: trivial. D5: idêntico à A. D6: elimina o gateway e seus
modos de falha (E8 desaparece); cria carga de polling agregada (N clientes ×
frequência) e o teto de latência vira o intervalo. D7: a mais barata de operar.

**Consequências positivas.** Menor superfície de segurança da onda; sem
tempestade de reconexão; recuperação e reconciliação são o caminho normal, não o
excepcional; honestidade estrutural (o que se vê tem no máximo a idade do
intervalo, e isso é exibível).

**Consequências negativas.** O teto de latência gerado→visível é o intervalo de
polling — **se** o alvo G1 (inexistente hoje) exigir visibilidade mais rápida
que um intervalo operacionalmente sustentável, esta opção não o atinge; polling
agressivo de muitas grades simultâneas tem custo de carga real; "quase tempo
real" via intervalo curto tende a recriar os problemas do push sem suas
ferramentas (cursor, telemetria de entrega).

**O que precisaria ser verdade.** Alvo G1 de latência de visibilidade compatível
com intervalo de polling sustentável — hoje desconhecido (VALIDATION REQUIRED);
carga agregada suportável no volume esperado.

**Custo de saída.** Baixo: adicionar o gateway da Opção A depois é aditivo — as
projeções e o polling de reconciliação continuam exatamente como estão (a Opção
A **contém** a B como seu caminho de recuperação).

### Opção C — Fan-out direto ao cliente: subscrição do cliente ao transporte de eventos / fan-out em processo, sem camada de projeção-entrega própria

**Descrição.** Clientes (ou o BFF por sessão) subscrevem diretamente tópicos do
transporte interno, filtrando por interesse; a "projeção" é composta no cliente.

**Frente aos drivers.** D1: o escopo do tópico vira o escopo de segurança — a
autorização fina por tenant/encontro/papel precisa ser re-imposta em cada ponte
de subscrição, e o histórico registrado mostra exatamente essa ponte falhando
(E4: WS/SSE sem autorização de canal; THR-0016). D2: o cliente passa a compor
estado a partir de eventos — a fidelidade N4/N5 (E9) vira responsabilidade de
cada cliente, N implementações da mesma regra crítica (o anti-padrão que N4-iv
proíbe). D3/D4: cursores e reconciliação teriam de ser inventados por cliente.
D6: expõe o transporte interno à borda — acoplamento que o ADR-0010 B10
(produtor/consumidor autorizado) teria de esticar até navegadores.

**Consequências positivas.** Menor latência teórica; menos componentes
server-side nomeados; rápido de demonstrar.

**Consequências negativas.** Reedita estruturalmente HAZ-0013/HAZ-0015/HAZ-0016;
espalha a imposição de isolamento por N pontes; espalha N4/N5 por N clientes;
acopla o contrato interno de eventos à borda pública (toda evolução de esquema
vira quebra de cliente). Listada porque é a arquitetura acidental de qualquer
demo que "só conecta no tópico" — nomeá-la com consequências é a defesa contra
adotá-la por omissão.

**O que precisaria ser verdade.** Nada a torna aceitável sob DOM-0001/0006 com o
precedente E4 registrado; consta para registro honesto.

**Custo de saída.** Alto após clientes reais acoplados ao esquema interno de
eventos.

### Opção Z — Adiar

**Descrição.** Não fixar a camada de leitura/entrega; cada superfície improvisa.

**Consequências positivas.** Nenhum compromisso antes do alvo G1 de latência.

**Consequências negativas.** O G4 mantém pendência; a fatia G7 exige "authorized
read model and real-time update" — adiar bloqueia a fatia; "cada superfície
improvisa" converge para a Opção C por gravidade; o ADR-0021 (frontend) fica sem
contrato.

**Custo do atraso.** Cresce até a primeira superfície implementada; depois vira
migração de contrato de cliente.

### 4.1 Comparação frente aos drivers

| Driver | A — projeções + gateway autorizado | B — somente polling | C — fan-out direto | Z — adiar |
|---|---|---|---|---|
| D1 isolamento | Imposição única server-side por push | Por requisição — a mais simples | Re-imposta por ponte; precedente de falha (E4) | Converge para C |
| D2 durável→visível | Por construção + lacuna detectável | Por construção; lacuna = intervalo | Cliente compõe; lacuna invisível | Não resolvido |
| D3 degradação explícita | Estado de conexão no contrato | Staleness = intervalo, exibível | Por cliente, se lembrar | Não resolvido |
| D4 rebuild/recuperação | Por construção (B contida em A) | Trivial | Inexistente por padrão | Não resolvido |
| D5 fidelidade N4/N5 | Uma imposição server-side | Idêntica à A | N implementações no cliente | Não resolvido |
| D6 resiliência gateway | Superfície concentrada a proteger (E8) | Sem gateway; carga de polling | Transporte interno exposto à borda | n/a |
| D7 custo | O mais caro das opções push | O mais barato | Barato até o incidente | Zero agora |

**Relação estrutural registrada (INFERENCE):** a Opção A contém a Opção B como
seu caminho de reconciliação (P8). Uma sequência legítima — a decidir pela
autoridade, não por este autor — seria aceitar as cláusulas de projeção
(P1/P2/P7) e o polling (P8) primeiro, e ativar o gateway (P3-P6) quando o alvo
G1 existir e H2 for medida; essa sequência está disponível às autoridades como
variante de aceitação por cláusula, sem novo ADR.

---

## 5. Decisão e escopo

> **NENHUMA DECISÃO ESTÁ REGISTRADA.** Este ADR apresenta opções, drivers e a
> minuta §5.2. Preencher esta seção é reservado à autoridade decisora nomeada no
> front matter. A minuta abaixo é o que a aceitação **vincularia** — nada dela
> vige antes.

### 5.1 Condições que devem ser satisfeitas antes da aceitação

| # | Condição | Dono | Evidência que a fecha | Estado |
|---|---|---|---|---|
| C1 | ADR-0010 com direção registrada — projeções derivam do backbone (janela de replay B4 determina o rebuild H1). | autoridade do ADR-0010 | ADR-0010 aceito ou direção registrada | ABERTA (0010 `proposed` na mesma data) |
| C2 | ADR-0016 (autorização/isolamento) com direção registrada — P3 fixa *quando* a decisão é avaliada; o mecanismo é de lá. O `adr-index.md` §4.1 já registra esta dependência. | autoridade do ADR-0016 | ADR-0016 aceito ou direção registrada | ABERTA (0016 `not-started`) |
| C3 | Reconciliação declarada com o texto aceito do ADR-0008 (N4/N5/N7) — as projeções implementam recomputação e roll-ups de lá. | autoridade deste ADR | Nota de reconciliação na aceitação | ABERTA |
| C4 | Alvo G1 de latência gerado→visível existente, OU aceitação registrando explicitamente decisão estrutural com alvo pendente (afeta a escolha A×B, não as cláusulas P1/P2/P7/P8). | AUTH-INTENDED-USE + AUTH-CLINSAFETY | Registro G1 | ABERTA — nenhum alvo existe (VALIDATION REQUIRED) |
| C5 | Evidência adversarial de isolamento planejada para o gateway/projeções (G6 exigirá; o desenho de teste precisa existir na aceitação). | AUTH-SECURITY | Especificação de testes adversariais registrada | ABERTA |
| C6 | Validação de fatores humanos H3 (estados degradados compreensíveis) executada ou explicitamente pendente como condição de G4. | AUTH-UX | Registro de validação | ABERTA |

### 5.2 Minuta normativa proposta (PROPOSAL — o que a aceitação vincularia)

Cláusulas marcadas ◆ têm consequência clínica direta e exigem AUTH-CLINSAFETY;
cláusulas marcadas ● têm consequência de segurança primária e exigem
AUTH-SECURITY.

**P1 — Reconstruibilidade.** Toda projeção de leitura é derivada exclusivamente
dos eventos duráveis do backbone (ADR-0010) e é deletável e reconstruível por
replay, com equivalência verificada por teste (DOM-0006; TST-DOM-0006). Uma
projeção que exija fonte fora do backbone/acervo canônico é não-conforme.

**P2 — Escopo em toda chave.** ● Toda projeção, cache, cursor e subscrição é
chaveada por tenant — e por encontro onde aplicável — em toda camada (DOM-0001;
THR-0019). Não existe projeção "global"; agregados cross-tenant não existem na
V2 (nem para administração — qualquer visão administrativa é por tenant).
Contagens/agregados respeitam o escopo para não vazar existência (THR-0017).

**P3 — Autorização a cada push.** ● Cada entrega push é autorizada contra o
contexto verificado da sessão **no momento da entrega**: identidade, tenant,
escopo de recurso (encontro/unidade), propósito. Subscrição autorizada não é
entrega pré-autorizada (E5): mudança de acesso, expiração de sessão ou mudança
de contexto invalida a decisão e interrompe a entrega — imposta pelo servidor
(A1). Nenhum parâmetro de escopo vem do cliente sem verificação (regra §3-6).

**P4 — Cursores de retomada.** O cliente retoma de cursor durável; o servidor
declara até onde o cursor é retomável (alinhado à janela de replay B4). Cursor
irretomável → o cliente é instruído a reconciliar por polling (P8) — a lacuna é
**explícita**, jamais silenciosamente pulada (E11).

**P5 — Filas limitadas com shed honesto.** ● Filas por conexão são limitadas
(valores VALIDATION REQUIRED); ao exceder, o servidor **desconecta explicitamente
com instrução de reconciliação** — jamais descarta deltas silenciosamente
mantendo a conexão com aparência de saúde (E8; DOM-0007). Tempestade de
reconexão é mitigada por política declarada (backoff/jitter server-driven);
telemetria de entrega (QAS-0005) é obrigatória.

**P6 — Estado de conexão e frescor no contrato.** ◆ O contrato de projeção
inclui, por superfície: estado de conexão (*online, degraded, offline,
reconnecting, replaying, reconciled* — prompt §11), fonte e idade/frescor do
dado exibido onde clinicamente relevante, e o instante de última reconciliação.
Uma grade que perde o feed exibe-se **visivelmente degradada** — nunca últimos
valores com aparência de atuais (HAZ-0025; HAZ-0004). A distinção é perceptível
sem depender de cor e anunciada a tecnologia assistiva (HAZ-0037; via ADR-0021).

**P7 — Fidelidade de status.** ◆ As projeções implementam as regras aceitas do
ADR-0008: status dependente de tempo recomputado na leitura/exibição, jamais
congelado (N5); roll-ups contam cada status não-`valid` em categoria própria,
proibido dobrar em normal ou omitir (N4-iii); **nenhuma projeção, gateway ou
cliente promove status** (N4-iv); severidade/cor só onde N7 permite. A projeção
entrega o status pronto — o cliente não o deriva.

**P8 — Reconciliação por polling.** O polling server-authoritative é o caminho
de verdade de recuperação de TODA superfície (A3): qualquer dúvida do cliente
(lacuna de cursor, reconexão, divergência local) resolve-se por consulta à
projeção autoritativa, com filtragem/paginação/agregação/autorização
server-side (prompt §11). O push é otimização de latência sobre P8 — nunca o
contrário (regra §3-9).

**P9 — Notificação externa derivada.** ◆ Toda notificação externa (quando o
canal for decidido — fora de escopo aqui) deriva do registro durável e carrega
referência verificável contra ele — jamais conteúdo clínico autoritativo próprio
(E12; glossário: Notification nunca é o registro). Falha de canal externo não
regride o item (ADR-0009 W1) — é estado da dimensão de entrega, visível e
reconciliável.

**P10 — Incerteza de entrega jamais oculta.** ◆ A telemetria de entrega
(gerado→visível, por superfície) é medida (QAS-0005/0006); alerta durável sem
evidência de exibição dentro da janela declarada (valores VALIDATION REQUIRED) é
sinal operacional visível (E6; E11) — o par de entrega de HAZ-0015 — e dispara o
caminho de contingência operacional definido no ADR-0020 (a política clínica de
contingência é humana, não deste ADR).

### 5.3 Escopo do que a aceitação vincularia

**Vincula:** a forma das projeções (P1/P2/P7), o modelo de entrega e sua
autorização (P3-P5), a visibilidade de degradação/frescor (P6), a reconciliação
(P8) e as regras estruturais de notificação/telemetria (P9/P10) — para toda
superfície de leitura da V2, em todo tenant e ambiente.

**Não vincula:** transporte concreto de push (contrato/plataforma futura, com
drivers medidos); canal e conteúdo de notificação externa (⚠ UNDECIDED —
ADR-0019/`system-context.md` F7); mecanismo de imposição de autorização
(ADR-0016); paginação/erros/versionamento do contrato (ADR-0012); design de
interação (ADR-0021); valores de janelas/limites (VALIDATION REQUIRED).

---

## 6. Consequências

Consequências **da existência deste ADR em `proposed`**.

### 6.1 Positivas

- O último dos quatro ADRs de runtime desta onda fecha o circuito
  evento→projeção→entrega com as mesmas garantias vinculantes ponta a ponta; o
  G4 ganha seus seis ADRs (0002, 0009, 0010, 0011, 0012, 0021) com quatro
  drafts existentes.
- O precedente legado mais grave desta camada (WS/SSE sem autorização de canal —
  E4) ganha a contraparte estrutural nomeada (P3) e testável (C5).
- A relação A-contém-B dá à autoridade um caminho de aceitação em estágios sem
  novo ADR.

### 6.2 Negativas

- Sem alvo G1 (C4), a escolha A×B não tem seu driver principal quantificado — a
  autoridade pode legitimamente aceitar estrutura e adiar a ativação do gateway,
  mas isso precisa ser dito na aceitação, não descoberto depois.
- O custo de autorização por push (A1) é assumido sem medição (H2) — se a
  medição futura o refutar, a granularidade da decisão será revisitada sob T2,
  nunca o princípio.

### 6.3 Neutras / estruturais

- Nada aqui decide transporte, broker, banco ou framework de UI (§3-14).
- Nada aqui cria superfície nova de PHI: as projeções exibem o que a autorização
  já permite; o canal externo permanece indecidido.

---

## 7. Implicações transversais

| Dimensão | Implicação | Rótulo | Papel responsável | IDs |
|---|---|---|---|---|
| Segurança clínica | P6/P7/P10 decidem se um clínico pode olhar uma grade congelada plausível (HAZ-0025), um roll-up que dobra não-avaliado em normal (N4), ou um alerta durável que ninguém viu (HAZ-0015) — os três modos de falha clinicamente silenciosos desta camada. | INFERENCE de E6, E7, E9 | AUTH-CLINSAFETY | HAZ-0004, HAZ-0015, HAZ-0017, HAZ-0025; SAF-0005, SAF-0006, SAF-0015, SAF-0025, SAF-0031 |
| Segurança | P2/P3/P5 são a contraparte estrutural de THR-0016/0017/0019/0042; a evidência adversarial de isolamento do G6 tem no gateway seu alvo concentrado (C5); imposição concreta via ADR-0016. | INFERENCE | AUTH-SECURITY | THR-0016, THR-0017, THR-0019, THR-0042; HAZ-0013; SAF-0007, SAF-0008, SAF-0026 |
| Privacidade (LGPD) | Push minimiza PHI (delta referencia o registro; conteúdo além do necessário à superfície não viaja); telemetria de entrega não carrega conteúdo clínico; canal externo (indecidido) terá análise própria. Nenhuma conformidade declarada. | VALIDATION REQUIRED | AUTH-PRIVACY-LEGAL (não nomeado) | ADR-0018; QAS-0028 |
| Interoperabilidade | O contrato de projeção/cursor/reconciliação é parte do contrato público versionado (ADR-0012); consumidores externos autorizados (se houver) entram pelo mesmo contrato, jamais pelo transporte interno. | INFERENCE | AUTH-PRODUCT | ADR-0012, ADR-0021 |
| Acessibilidade | P6 exige distinção não-cromática e anúncio coalescido de live-region para mudanças de estado clínico e de conexão (HAZ-0037; prompt §11: WCAG 2.2 AA + validação com tecnologia assistiva). | SOURCE prompt §11 | AUTH-UX | HAZ-0037; SAF-0034; ADR-0021 |
| Operacional | Rebuild de projeção, monitoração de lag (QAS-0009), telemetria de entrega (P10), política de shed/reconexão (P5) e readiness que representa capacidade segura (QAS-0029 — gateway "vivo" com projeção atrasada NÃO é pronto) viram deveres operacionais. | INFERENCE | AUTH-OPERATIONS | ADR-0020; QAS-0008, QAS-0009, QAS-0029 |
| Custo | Gateway + projeções + reconciliação têm custo operacional permanente; a Opção B minimiza; **nenhum modelo de custo existe e nenhum número é inventado**. | VALIDATION REQUIRED | AUTH-PRODUCT | QAS-0027 |
| Migração | Projeções são deletáveis por construção (P1) — migração de esquema de projeção é rebuild, não migração de dados; mudança de contrato de cursor segue a política de compatibilidade do ADR-0012. | INFERENCE | AUTH-OPERATIONS | ADR-0012; QAS-0009 |

---

## 8. Reversibilidade, gatilhos de revisita, kill/rollback

### 8.1 Avaliação de reversibilidade

| Item | Reversibilidade | O que fica encalhado ao reverter | Rótulo |
|---|---|---|---|
| Opção A (gateway + projeções) | Alta para B (desligar push mantém tudo — B está contida em A); moderada para mudanças de contrato de cursor | Contrato de cursor dos clientes | INFERENCE |
| Opção B (polling-only) | Alta para A (aditiva) | Nada relevante | INFERENCE |
| Opção C (fan-out direto) | Baixa após clientes acoplados ao esquema interno | Todos os clientes | INFERENCE |
| P2 (escopo em toda chave) | Direção segura — reverter para chaves sem tenant é mudança de segurança que exige novo ADR com evidência | Nada — é a direção segura | INFERENCE |
| Z (adiar) | n/a — custo de opção crescente até a primeira superfície | n/a | INFERENCE |

### 8.2 Gatilhos de revisita

| # | Gatilho | Detecção | Notificar | Ação |
|---|---|---|---|---|
| T1 | Alvo G1 de latência gerado→visível estabelecido | Registro G1 | autoridade deste ADR | Fechar C4; decidir/rever A×B com o driver quantificado |
| T2 | H2 medida: custo de autorização por push acima do sustentável | Teste de carga G7 | AUTH-SECURITY + autoridade deste ADR | Revisitar a *granularidade* da decisão (cache de decisão, escopo por canal) — jamais entregar sem autorização |
| T3 | H1 medida: rebuild além da janela operacional aceitável | Rebuild cronometrado | AUTH-OPERATIONS | Rever particionamento de projeção/janela B4 com o ADR-0010 |
| T4 | Emenda/supersessão do ADR-0008 tocando N4/N5/N7 | Registro de decisão | autoridade deste ADR | Reconciliar P6/P7 (C3) |
| T5 | Decisão do canal de notificação externa (F7 deixa de ser UNDECIDED) | Registro de decisão (ADR-0019) | autoridade deste ADR | Instanciar P9 no canal decidido; análise de PHI própria |
| T6 | Telemetria P10 revelando lacuna sistemática gerado→visível | QAS-0005 monitorada | AUTH-OPERATIONS + AUTH-CLINSAFETY | Tratar como incidente de entrega; jamais ajustar a telemetria para silenciar |
| T7 | Proposta de superfície que não caiba no contrato de projeção (invalida A2) | Revisão de arquitetura | autoridade deste ADR | Emenda deliberada — jamais canal lateral de leitura |

### 8.3 Kill switch / rollback

Enquanto `proposed`, não há mecanismo a desligar. Na aceitação, os controles
estruturais propostos: (i) **o push tem kill switch por superfície e global** —
desligado, toda superfície degrada explicitamente para polling (P8), com o
estado degradado **visível** (P6): a plataforma perde latência, nunca verdade;
(ii) **projeção defeituosa é deletada e reconstruída** (P1) — rollback de
projeção é rebuild, jamais edição in-place; (iii) **conexões são derrubáveis em
massa com instrução de reconciliação** (P5) para contenção de incidente do
gateway, e a derrubada é explícita ao usuário; (iv) nenhum kill switch desta
camada apaga fatos — a camada inteira é derivada e reconstituível (DOM-0006), e
essa propriedade é o próprio mecanismo de recuperação.

---

## 9. Método de validação e evidência vinculada

| # | Afirmação a validar | Método | Ambiente | IDs vinculados |
|---|---|---|---|---|
| V1 | Toda projeção deletada reconstrói estado equivalente só de eventos duráveis | Rebuild + comparação bit a bit/campo a campo | Teste (sintético) | TST-DOM-0006; DOM-0006; QAS-0009, QAS-0022 |
| V2 | Push sem autorização vigente no momento da entrega é bloqueado: sessão expirada, acesso revogado, mudança de contexto, escopo forjado/omisso | Testes adversariais por push (não só por subscrição) | Teste | TST-DOM-0001; DOM-0001; THR-0016; HAZ-0013; SAF-0007, SAF-0008; QAS-0014, QAS-0018 |
| V3 | Cache/projeção/cursor jamais retorna dado de outro tenant, inclusive sob reuso de conexão/pool | Testes adversariais de chave de escopo | Teste | THR-0019; DOM-0001; QAS-0018 |
| V4 | Lacuna de cursor produz instrução explícita de reconciliação; nenhum delta silenciosamente pulado | Testes de corte/retomada de canal com verificação de paridade pós-polling | Teste | DOM-0007; QAS-0022; E11 |
| V5 | Fila cheia → desconexão explícita com reconciliação; jamais descarte silencioso com conexão "saudável" | Testes de backpressure/exaustão (chaos no gateway) | Teste | THR-0042; QAS-0008; SAF-0016 |
| V6 | Feed interrompido → superfície visivelmente degradada com idade do dado; jamais últimos valores com aparência de atuais | Injeção de falha de feed + verificação de estado de UI por superfície | Teste | HAZ-0025, HAZ-0004; DOM-0007; QAS-0023; SAF-0025 |
| V7 | Roll-ups contam não-`valid` em categoria própria; recomputação de frescor na leitura; nenhuma promoção de status em nenhuma camada de entrega | Testes de contrato de projeção contra vetores do ADR-0008 | Teste | QAS-0017; SAF-0005, SAF-0006; N4/N5/N7 (ADR-0008) |
| V8 | Alerta durável sem exibição dentro da janela declarada gera sinal operacional | Sonda sintética fim-a-fim gerado→visível (§14) | Teste + ambiente | HAZ-0015; QAS-0005; SAF-0015; P10 |
| V9 | Estados degradados/reconexão são compreensíveis e acionáveis por usuários representativos, inclusive com tecnologia assistiva | Validação de fatores humanos sob degradação simulada (H3) | Ambiente de usabilidade | VAL: pendente do backlog de validação; HAZ-0037; SAF-0034 |

**Disciplina de marcadores.** Todos os IDs DOM/HAZ/SAF/QAS/THR/TST-DOM citados
foram lidos dos catálogos existentes antes da citação; `REQ:`/`VAL:` permanecem
marcadores literais. **Nenhum ID foi inventado.**

---

## 10. Relações de supersessão

- **Supera:** nenhum ADR. Em relação ao diagrama de sequência
  `sequencia-observacao-avaliacao-alerta.md`: **não o supera nem o contradiz** —
  aquele diagrama marca o canal de notificação como ⚠ UNDECIDED apontando para
  este ADR; a minuta P9/P10 dá a *estrutura* (derivação do durável, telemetria),
  e o canal concreto permanece indecidido como lá registrado — nenhuma correção
  do diagrama é necessária por este ADR.
- **Superado por:** nenhum.
- **Notas de relação:** dependências ADR-0010 (C1) e ADR-0016 (C2 — registrada
  no índice §4.1); alimenta ADR-0012/0021. A futura seleção de transporte push
  será decisão de contrato/plataforma que complementa este ADR sem supersedê-lo.
  Supersessão parcial por superfície, tenant ou ambiente é permitida e jamais
  generalizada.

---

## 11. Autoverificação contra o gate de completude do template

Todos os campos do §10 do prompt presentes; três alternativas + adiar (C existe
para nomear a arquitetura acidental de demo, com consequências honestas; a
relação A-contém-B registrada como caminho de aceitação em estágios); drivers
discriminantes ligados a QAS; **nenhum alvo numérico inventado** (janelas,
limites de fila e alvos de latência VALIDATION REQUIRED); oito linhas
transversais presentes; reversibilidade, gatilhos e kill/rollback presentes;
validação com IDs reais verificados; supersessão declarada; **nenhuma tecnologia
selecionada** (transporte push explicitamente diferido); nenhuma aprovação
fabricada; nenhum dono nomeado. **Nota da janela concorrente:** `adr-index.md`
NÃO foi atualizado por este autor — linha de índice no handoff.
