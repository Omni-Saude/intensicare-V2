---
id: ADR-0009
title: Máquina de estados de alerta/item de trabalho — concorrência, idempotência, auditoria e timers de escalada
status: accepted (2026-08-15, GDEC-0008)
status_history:
  - status: not-started
    date: 2026-08-14
    by: candidate-architecture and ADR-program engineer (Wave 2)
    note: ID reservado em adr-index.md (§10 item 9 do prompt)
  - status: proposed
    date: 2026-08-15
    by: arquiteto de decisões de runtime e entrega (ciclo 1)
    note: >
      Redigido em pt-BR (DEC-G0-10). Ratifica-ou-corrige o diagrama candidato
      maquina-estados-alerta-acao-humana.md (o diagrama segue o ADR, não o
      contrário); duas divergências candidatas são registradas em §4.3 para
      correção do diagrama SE a opção recomendada for aceita. NENHUMA decisão
      é registrada e nenhum agente pode registrá-la.
  - status: accepted (2026-08-15, GDEC-0008)
    date: 2026-08-15
    by: rodaquino-OMNI (titular) — transcrito por escriba de decisão-transcrição de ADR
    note: >
      Aceito por escrito pelo titular na sessão de decisão GDEC-0008 (item 4;
      `docs/00-governance/registers/decision-register.md`), nas opções recomendadas
      — Q1-A (máquina única de WorkItem + entrega paralela) e Q2-A (concorrência
      otimista) — e na minuta W1–W12 de §5.2. Ver §5.0. Nenhum agente decidiu —
      transcrição de decisão já tomada.
date: 2026-08-15
owner: rodaquino-OMNI — AUTH-CLINSAFETY (GDEC-0003); ADR aceito por escrito em GDEC-0008 item 4
approvers:
  - rodaquino-OMNI — AUTH-CLINSAFETY (semântica de supressão, escalada, override, reabertura, GDEC-0003); aceito em GDEC-0008 item 4
  - UNASSIGNED — VALIDATION REQUIRED   # role: AUTH-UX (visibilidade dos estados em toda superfície; prompt §11) — não fechado por esta aceitação; ver C3
decision_deadline: >
  UNSET — VALIDATION REQUIRED. Restrição de ordem: o Gate G4 lista este ADR
  entre os que precisam estar resolvidos (adr-index.md §5); a fatia vertical G7
  exige "concurrent-safe human action", que pressupõe este ADR decidido.
deciding_authority_rule: >
  docs/00-governance/decision-rights.md §2, linha "Architecture decisions (ADR
  ratification)"; cláusulas com consequência clínica direta (supressão,
  escalada, override, reabertura, fechamento) exigem adicionalmente
  AUTH-CLINSAFETY; consequências de exibição exigem AUTH-UX.
independence_check: >
  decision-rights.md §3: quem implementar a gestão de alertas/itens de trabalho
  NÃO pode verificar independentemente os testes de concorrência/auditoria
  correspondentes (implementador ≠ verificador). Este ADR foi redigido por
  agente; nenhum agente o aprova; o autor não é aprovador.
links:
  drivers:
    domain_invariants: [DOM-0001, DOM-0004, DOM-0005, DOM-0006, DOM-0007]
    quality_scenarios: [QAS-0004, QAS-0005, QAS-0006, QAS-0016, QAS-0017, QAS-0021, QAS-0022]
    risks: ["pending risk register IDs — see docs/00-governance/registers/risk-register.md"]
  constrains:
    requirements: ["REQ: pendente de catálogo de requisitos (docs/04-product-requirements ainda não existe)"]
    clinical: ["CLR: pendente do portfólio de vias clínicas (Gate G2)"]
    safety: [SAF-0005, SAF-0013, SAF-0016, SAF-0017, SAF-0018, SAF-0019, SAF-0022, SAF-0023, SAF-0024, SAF-0035, SAF-0041]
  hazards: [HAZ-0016, HAZ-0018, HAZ-0021, HAZ-0022, HAZ-0023, HAZ-0024, HAZ-0033, HAZ-0035, HAZ-0036, HAZ-0044]
  tests: ["TST-DOM-0005", "TST: pendente de arquitetura de teste"]
  validations: ["VAL: pendente do backlog de validação"]
  adrs:
    depends_on: [ADR-0008, ADR-0010]
    feeds: [ADR-0011, ADR-0012, ADR-0021]
  gates: [G4]
  evidence:
    - docs/06-architecture/components/maquina-estados-alerta-acao-humana.md
    - docs/06-architecture/components/sequencia-observacao-avaliacao-alerta.md
    - docs/03-domain/glossary.md
    - docs/03-domain/invariants/DOM-invariants.md
    - docs/05-clinical-safety/hazard-log.md
    - docs/06-architecture/adrs/ADR-0008-evaluation-status-and-completeness-freshness-semantics.md
supersedes: null
superseded_by: null
provenance:
  source_repo: intensicare-V2
  path_or_url: docs/06-architecture/adrs/ADR-0009-maquina-de-estados-alerta-item-de-trabalho.md
  commit_sha_or_version: 0c36f03 (HEAD do repositório na redação; este arquivo não está commitado)
  section_or_lines: >
    INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §1 (laço mínimo), §3 regras 7 e 15, §9.1
    princípios 1/5/6, §9.3, §10 item 9, §11 (estados mínimos, linha "unassigned,
    assigned, acknowledged, escalated, overridden, resolved, suppressed, reopened"),
    §13 (ações humanas concorrentes; supressão de alerta), §20 (jamais esconder
    incerteza de entrega/no-fire); glossary.md §5; ADR-0008 §4.2 N6/N7
  date_collected: 2026-08-15
  collector: arquiteto de decisões de runtime e entrega (ciclo 1)
  transformation: >
    reasoned-from — estados e transições derivados do glossário §5, do prompt §11 e
    do diagrama candidato do ciclo 1; nenhuma semântica clínica nova é criada.
  confidence: medium
  owner: rodaquino-OMNI
  validation_status: >
    N/A — ADR aceito pelo titular (GDEC-0008 item 4) nas cláusulas clínicas, nas
    opções recomendadas. As condições de §5.1 (C3 validação de fatores humanos,
    C4 vocabulário pt-BR) seguem VALIDATION REQUIRED conforme registradas.
---

# ADR-0009 — Máquina de estados de alerta/item de trabalho: concorrência, idempotência, auditoria e timers de escalada

> **Status: `accepted (2026-08-15, GDEC-0008)`.** O titular aceitou este ADR por
> escrito na sessão de decisão GDEC-0008 (item 4), nas opções recomendadas — Q1-A
> (máquina única de WorkItem) e Q2-A (concorrência otimista) — e na minuta W1–W12
> de §5.2. Ver §5.0. Duas restrições do prompt não são alternativas em avaliação: a
> regra §3-7 (ausência jamais vira no-fire silencioso — DOM-0004) e a regra §3-15 (a
> autoridade de decisão clínica permanece com humanos responsáveis). **Aceito não
> significa implantado nem verificado** — as condições de §5.1 continuam a governar
> a operacionalização.

---

## 1. Contexto e formulação do problema

SOURCE (prompt §1): o laço mínimo de segurança termina em *"authorized human
acknowledgment, escalation, reassignment, resolution, or override → immutable
audit"*. SOURCE (prompt §11): o modelo de estados compartilhado deve suportar,
visivelmente distintos, *"unassigned, assigned, acknowledged, escalated,
overridden, resolved, suppressed, reopened"*. SOURCE (prompt §13): a análise de
hazard deve cobrir *"concurrent human actions and ambiguous responsibility"* e
*"alert suppression"*; SOURCE (prompt §20): jamais esconder *"alert-delivery
uncertainty"* ou não-disparo.

OBSERVED (em disco): o ciclo 1 produziu um **diagrama candidato**
(`maquina-estados-alerta-acao-humana.md`) que se declara explicitamente sem ADR
("nenhuma transição foi ratificada... este diagrama não decide nada que ADR-0009
deveria decidir"). Este ADR é o instrumento reservado para decidir; **o diagrama
segue o ADR, não o contrário** — as divergências entre o diagrama e a opção
recomendada estão registradas em §4.3 como correções candidatas.

INFERENCE (de HAZ-0023/HAZ-0024 e do precedente legado citado em THR-0043/0044):
sem decisão sobre concorrência e idempotência, a primeira implementação repetirá o
padrão legado — *"state mutations lack locking"*, transições não auditadas, contas
compartilhadas — exatamente os modos de falha que o hazard log registra como
abertos.

**Pergunta.** Quais são os estados, transições, comandos, regras de concorrência,
timers de escalada e semântica de supressão/override/reabertura do ciclo de vida
de alerta/item de trabalho — de modo que toda ação humana seja idempotente,
concorrência-segura, autorizada, auditada e transacionalmente publicada
(DOM-0005), e que nenhuma supressão jamais esconda um no-fire (DOM-0004, §20)?

**Fora de escopo** (cada item nomeado):

- *Quando* um alerta é gerado (condições clínicas, thresholds) — conteúdo de
  rule release (ADR-0007/0025-0028) e semântica de status (ADR-0008, aceito).
  Este ADR começa quando o `EvaluationRecord` já sinalizou condição que merece
  atenção humana.
- Publicação transacional, entrega e replay dos eventos de transição —
  **ADR-0010** (consumido como dependência).
- Projeção dos estados para leitura/tempo real e roll-ups de fila — **ADR-0011**
  (consome os estados daqui).
- Canal de notificação, seu conteúdo e se pode carregar PHI — **ADR-0011/0019**
  (permanece ⚠ UNDECIDED em `system-context.md` F7).
- Valores numéricos de timers de escalada — conteúdo de rule release,
  `VALIDATION REQUIRED`; o envelope aperta-nunca-afrouxa é do ADR-0007 (A7-2).
- Roteamento organizacional (quem é o alvo de escalada em cada unidade) —
  configuração operacional sob o envelope do ADR-0007, não estrutura.

---

## 2. Evidência e premissas

### 2.1 Evidência

**Nota epistêmica única.** Linhas do glossário, invariantes, hazard log e ADRs
são `SOURCE`/`OBSERVED` conforme leitura em disco por este autor; nenhuma
alegação legada foi reverificada no repositório legado (linhas legadas são SOURCE
via hazard log/threat model, que citam o assessment).

| # | Rótulo | Afirmação | Fonte | Confiança |
|---|---|---|---|---|
| E1 | SOURCE | Estados mínimos exigidos, visivelmente distintos: *"unassigned, assigned, acknowledged, escalated, overridden, resolved, suppressed, reopened"*. | prompt §11 | alta |
| E2 | SOURCE | DOM-0005: todo comando de estado (Assignment, Acknowledgment, Escalation, Override, Resolution, Suppression) é idempotente, concorrência-seguro, autorizado, auditado e **transacionalmente publicado**. | DOM-invariants.md DOM-0005 | alta |
| E3 | SOURCE | Glossário §5: Alert (fato clínico durável e explicável) ≠ WorkItem (unidade acionável/atribuível que o humano opera; pode agregar mais de um Alert sem perder a identidade de cada um) ≠ Notification (evento de canal de entrega, jamais registro de sistema). Acknowledgment = ciência, não conclusão; Escalation não fecha; Assignment reatribuível N vezes; Resolution terminal porém potencialmente reabrível; Suppression sempre explícita e auditável, categoricamente distinta de no-fire silencioso; Override pontual com racional obrigatório, distinto de Suppression. | glossary.md §5 | alta |
| E4 | OBSERVED | O diagrama candidato do ciclo 1 propõe estados Levantado/Notificado/Atribuído/Reatribuído/Reconhecido/Escalado/Sobreposto/Suprimido/Resolvido/Reaberto e declara-se integralmente candidato, sem ADR. | maquina-estados-alerta-acao-humana.md §2-§4 | alta |
| E5 | SOURCE | HAZ-0023 (S alto): dois clínicos transicionam o mesmo alerta concorrentemente sem token de concorrência otimista → última escrita vence silenciosamente; precedente legado explícito ("state mutations lack locking" — IC-009 via THR-0043). | hazard-log.md HAZ-0023; threat-model.md THR-0043 | alta |
| E6 | SOURCE | HAZ-0024: responsabilidade ambígua em passagem de plantão/cobertura → alerta reconhecido por ninguém-de-fato; HAZ-0018: roteamento errado/firehose → ninguém com responsabilidade vê. | hazard-log.md HAZ-0024, HAZ-0018 | alta |
| E7 | SOURCE | HAZ-0022: cooldown/dedup/agrupamento suprime alerta sem visibilidade/auditabilidade → condição recorrente ou em escalada fica oculta. HAZ-0021: no-fire sem registro imutável do porquê é indistinguível de avaliação negativa (SAF-0019: todo no-fire persiste razão). | hazard-log.md HAZ-0022, HAZ-0021 | alta |
| E8 | SOURCE | HAZ-0033/THR-0045: ação em grupo com falha no meio da sequência → o grupo parece tratado enquanto itens ficaram para trás; o prompt §11 exige "atomic group operations or transparent per-item partial results". | hazard-log.md HAZ-0033; prompt §11 | alta |
| E9 | SOURCE | THR-0044: identidade de ator ausente/compartilhada (conta de posto) ou não vinculada ao registro de transição → transições não auditáveis; HAZ-0035: cobertura de auditoria incompleta destrói a reconstituibilidade da decisão. | threat-model.md THR-0044; hazard-log.md HAZ-0035 | alta |
| E10 | SOURCE | ADR-0008 N6 (aceito): correção/chegada tardia dispara nova avaliação; avaliação anterior fica superseded e **todo alerta/work item derivado é reconciliado pela máquina de estados do ADR-0009 — jamais silenciosamente retirado**. N7: severidade só é legível com status `valid` (ou `partial` sob política); supressão é transparente (SAF-0022). | ADR-0008 §4.2 N6, N7 | alta |
| E11 | SOURCE | ADR-0007 (aceito): configuração operacional só pode **apertar** o envelope do bundle (banda→escala mais cedo; cooldown→menor; rate limit→maior — A7-2); timers de escalada default são conteúdo versionado de bundle, jamais número local. | ADR-0007 §4.9 item 7, §5.0 A7-2 | alta |
| E12 | SOURCE | HAZ-0044: item de escalada gerado para paciente em cuidado paliativo/limitação terapêutica — o *conteúdo* de quem pode fechar/suprimir nesses casos é autoridade clínica humana, não automação (regra §3-15). | hazard-log.md HAZ-0044; prompt §3 regra 15 | alta |
| E13 | SOURCE | Nenhum código de gestão de alerta/trabalho existe (greenfield); a decisão aqui precede qualquer implementação. | ci-policy.md §1 via diagrama candidato §4 | alta |

### 2.2 Premissas

A registrar em `assumptions-register.md`; **nenhum ID `ASM` é cunhado aqui**.

| # | Premissa | Por que é necessária | O que a invalida | Dono |
|---|---|---|---|---|
| A1 | O par Alert(fato)×WorkItem(acionável) do glossário §5 sobrevive à validação de usuário (G1/G4): clínicos operam *itens de trabalho*, possivelmente agregando alertas. | Estrutura as opções do eixo Q1. | Validação de usuário mostrando que a agregação N:1 confunde mais do que ajuda. | UNASSIGNED — VALIDATION REQUIRED |
| A2 | Toda transição pode ser expressa como comando discreto com chave de idempotência — nenhuma exige sessão longa com estado intermediário não persistido. | Sustenta W2/W6. | Descoberta de fluxo de UI que exija transação de longa duração. | UNASSIGNED — VALIDATION REQUIRED |
| A3 | Timers de escalada podem ser implementados como timers duráveis re-armáveis a partir do estado persistido (crash-safe), sem agendador exótico. | Sustenta W5. | Restrição de plataforma que impeça timers duráveis — improvável. | UNASSIGNED — VALIDATION REQUIRED |
| A4 | O volume de ações concorrentes reais sobre o MESMO item é baixo (dois ou três atores em janelas curtas), não um problema de alta contenção. | Justifica concorrência otimista como candidata principal (Q2). | Medição em uso real mostrando contenção alta e taxa de conflito inaceitável para o fluxo clínico. | UNASSIGNED — VALIDATION REQUIRED |

### 2.3 Hipóteses a testar

| # | Hipótese | Como seria testada | Quem testa | Estado |
|---|---|---|---|---|
| H1 | Conflito otimista com retorno do estado corrente é resolvível pelo clínico em segundos sem perda de contexto (não vira fricção perigosa). | Validação de fatores humanos com cenários simulados de ação concorrente (prompt §11: cenários críticos de tempo, não entrevistas de preferência). | especialista de fatores humanos + AUTH-UX | UNTESTED |
| H2 | A reconciliação N6 (avaliação superseded → item reconciliado) é compreensível na UI sem parecer "alerta que sumiu". | Mesmo método; cenário de correção chegando após reconhecimento. | idem | UNTESTED |
| H3 | Agregação de múltiplos alertas num item de trabalho preserva rastreabilidade individual sem sobrecarga cognitiva. | Validação com fila realista simulada. | idem | UNTESTED |

---

## 3. Direcionadores de decisão e atributos de qualidade mensuráveis

Alvos numéricos: `VALIDATION REQUIRED` (G1) — **nenhum é inventado**.

| # | Driver | Por que discrimina | Atributo mensurável | Alvo |
|---|---|---|---|---|
| D1 | **Nenhuma perda silenciosa de ação humana** (E5): retry, corte de rede e concorrência jamais duplicam nem descartam efeito sem sinal | As opções de concorrência (Q2) diferem exatamente em como o conflito aparece: erro explícito × bloqueio × última-escrita-vence | QAS-0021; TST-DOM-0005 | Vinculante (DOM-0005) |
| D2 | **Responsabilidade inequívoca a cada instante** (E6) | Os modelos de estado (Q1) diferem em se "quem é responsável agora" é derivável do estado ou de heurística | QAS-0016 (auditoria reconstrói), QAS-0006 | VALIDATION REQUIRED |
| D3 | **Supressão e override visíveis e auditáveis; no-fire nunca oculto** (E7; §20) | Um modelo que trate supressão como fim de ciclo silencioso reedita HAZ-0022; a distinção supressão×no-fire×resolução precisa ser estrutural | QAS-0017; SAF-0019, SAF-0022 | Vinculante (regra §3-7 + §20) |
| D4 | **Escalada garantida sob falha** (timers crash-safe) | Timer em memória de processo morre com o processo (precedente legado de fan-out process-local); timer durável re-armável sobrevive | QAS-0006, QAS-0022 | VALIDATION REQUIRED (valores por bundle) |
| D5 | **Auditoria imutável por transição com ator individual** (E9) | Opções diferem em se o registro de auditoria é subproduto (mesma transação) ou efeito colateral (melhor esforço) | QAS-0016, QAS-0021 | Vinculante (DOM-0005) |
| D6 | **Autoridade clínica humana preservada** (E12; regra §3-15) | Nenhuma opção pode fechar/suprimir clinicamente por automação; as opções diferem em quão explícito isso fica na estrutura | QAS-0017 | Vinculante (regra §3-15) |
| D7 | **Custo de implementação e de operação da máquina** | Duas máquinas (Alert×WorkItem) custam mais que uma; estados demais custam compreensão de UI | — (modelo de custo inexistente) | VALIDATION REQUIRED |

---

## 4. Alternativas consideradas

O espaço de decisão tem dois eixos independentes: **Q1 — forma do modelo de
estados**; **Q2 — controle de concorrência**. Cada eixo tem suas alternativas e
seu adiar.

### Q1 — Forma do modelo de estados

#### Opção Q1-A — Uma máquina de WorkItem com os oito estados do §11; entrega como dimensão paralela; Alert como fato imutável associado

**Descrição.** O `Alert` é o fato clínico durável e explicável (glossário §5) —
criado imutável pelo resultado de avaliação, sem máquina de estados própria além
de ativo/reconciliado/superseded (via N6). O `WorkItem` é a única entidade com
ciclo de vida operado por humanos, com exatamente os estados nucleares do §11:
`não-atribuído → atribuído → reconhecido → escalado/sobreposto → resolvido`,
mais `suprimido` e `reaberto`. Reatribuição é transição (novo Assignment) que
permanece em `atribuído` — não estado próprio. **Entrega (Notification) não é
estado do ciclo de vida**: é dimensão paralela por canal (pendente/entregue/
falhou/reenviado), consistente com o glossário ("Notification nunca é o registro
de sistema") e com DOM-0006.

**Frente aos drivers.** D1: uma máquina única simplifica o token de concorrência
(um agregado, uma versão). D2: responsabilidade = estado + Assignment corrente —
derivável sem heurística. D3: `suprimido` é estado de primeira classe com razão,
escopo e prazo; no-fire nem entra nesta máquina (nunca houve item) — a distinção
é estrutural. D4/D5: timers e auditoria ancoram num único agregado. D6: comandos
de fechamento exigem ator humano autorizado por construção. D7: a mais barata das
opções completas.

**Consequências positivas.** Mapeia 1:1 os estados exigidos pelo §11; o estado de
entrega não polui o estado de responsabilidade (uma Notification perdida não
regride o item — E3); agregação de alertas (A1) cabe sem segunda máquina.

**Consequências negativas.** A dimensão paralela de entrega precisa de disciplina
própria (ADR-0011) — o risco de tratá-la como "detalhe" existe e é dito; um único
agregado WorkItem concentra contenção de escrita (mitigado por A4, a validar).

**O que precisaria ser verdade.** A1 (par Alert×WorkItem validado); H1-H3
favoráveis.

**Custo de saída.** Moderado: dividir em duas máquinas depois é migração de
estados com histórico preservável.

#### Opção Q1-B — Duas máquinas: ciclo de vida de Alert e ciclo de vida de WorkItem, com agregação N:1

**Descrição.** O Alert tem máquina própria (levantado → em-tratamento → fechado/
suprimido/superseded) e o WorkItem outra (os oito estados do §11); um WorkItem
agrega N alertas; regras de propagação conectam as duas (fechar o item não fecha
o alerta automaticamente, e vice-versa, salvo regra explícita).

**Frente aos drivers.** D1: dois agregados = dois tokens de concorrência e
transições distribuídas entre eles (mais superfície de corrida). D2: responsável
é claro no item; o *estado do alerta* subjacente pode divergir do item — expressivo
porém mais difícil de exibir sem ambiguidade. D3: supressão pode existir nos dois
níveis — mais fiel ao mundo (suprimir uma condição × silenciar um item), ao custo
de dupla semântica a validar clinicamente. D5: auditoria em dois agregados. D7: a
mais cara.

**Consequências positivas.** Modela fielmente agrupamento sem perda de origem
(prompt §11 "alert grouping without source loss"); permite política de supressão
por condição clínica distinta de silêncio de item.

**Consequências negativas.** Duas máquinas acopladas por regras de propagação são
o dobro da superfície de teste e o dobro da chance de estado combinado sem
significado claro; o risco de o item dizer "resolvido" com alerta subjacente vivo
precisa de regra explícita — e essa regra é exatamente o tipo de decisão clínica
que exigiria validação extra.

**O que precisaria ser verdade.** H3 mostrando que a agregação rica é necessária
E que a dupla semântica é compreensível; volume de alertas por item alto o
suficiente para justificar o custo.

**Custo de saída.** Alto: colapsar duas máquinas em uma exige adjudicar cada par
de estados combinados do histórico.

#### Opção Q1-C — Estado inclui a entrega (forma do diagrama candidato: `Notificado` como estado do ciclo de vida)

**Descrição.** A forma desenhada no diagrama candidato: o ciclo de vida inclui um
estado `Notificado` entre o levantamento e a atribuição, com regressão a
`Levantado` em falha de entrega.

**Frente aos drivers.** D1: a entrega (at-least-once, multi-canal, reenvio) força
o estado do item a oscilar por razões que nada dizem de responsabilidade — o
token de concorrência passa a disputar com o pipeline de entrega. D2: "notificado"
não diz *quem* é responsável — não avança D2. D3: neutro. D5: transições de
entrega inflam a auditoria do item com eventos de canal. D6: neutro. D7: barata
de desenhar, cara de manter.

**Consequências positivas.** Torna visível no próprio item que houve tentativa de
entrega — informação clinicamente útil (HAZ-0015: alerta nunca renderizado).

**Consequências negativas.** Conflita com a definição-fonte do glossário
(Notification é preocupação de entrega, jamais registro de sistema — E3) e com
DOM-0006: o estado do item deixaria de derivar exclusivamente de fatos duráveis
de responsabilidade. A informação útil ("foi entregue? a quem? quando?") cabe
integralmente na dimensão paralela da Q1-A, exibível junto ao item sem ser estado
dele.

**O que precisaria ser verdade.** Que a dimensão paralela de entrega fosse
inviável de exibir — nenhuma evidência sugere isso.

**Custo de saída.** Moderado: remover um estado depois de implementado é migração
+ reeducação de usuários.

#### Opção Q1-Z — Adiar

**Descrição.** Seguir apenas com o diagrama candidato, sem ADR.

**Consequências positivas.** Nenhum compromisso.

**Consequências negativas.** O G4 mantém pendência; a fatia G7 ("concurrent-safe
human action") não tem base decidida; o diagrama candidato — que se declara
não-decisão — passaria a funcionar como decisão de fato por inércia, o exato
anti-padrão que o prompt §20 proíbe ("document recency... as proof of authority").

**Custo do atraso.** Cresce até a primeira implementação de fila/ação humana.

### Q2 — Controle de concorrência de comandos

#### Opção Q2-A — Concorrência otimista: token de versão obrigatório por comando; conflito → falha explícita com estado corrente

**Descrição.** Todo comando de transição carrega a versão do item que o ator via;
versão divergente → o comando falha com resposta explícita contendo o estado
corrente (e quem o produziu); o ator redecide com contexto. Idempotência por chave
própria de comando: reenvio da MESMA intenção (mesma chave) retorna o resultado
original sem duplicar efeito.

**Frente aos drivers.** D1: nenhum efeito silencioso — conflito é visível e
resolvível por quem está na frente do paciente; retry seguro por chave. D6: a
redecisão é humana por construção. Custo honesto: fricção nos (raros — A4)
conflitos reais; H1 precisa validar que a fricção é aceitável em cenário crítico.

**Consequências positivas.** Sem locks a expirar em cenário clínico (um lock
esquecido bloquearia ação urgente); o modo de falha é informação, não perda.

**Consequências negativas.** Exige que TODA superfície (UI, API, MCP futuro)
transporte o token — disciplina de contrato (ADR-0012); conflito mal exibido na
UI vira irritação e retrabalho (H1).

**O que precisaria ser verdade.** A4 (baixa contenção real) e H1 (conflito
resolvível em segundos).

**Custo de saída.** Baixo: trocar por pessimista depois é mudança de mecanismo
sob o mesmo contrato de comando.

#### Opção Q2-B — Concorrência pessimista: lease/claim exclusivo antes de agir

**Descrição.** O ator adquire posse temporária do item ("estou tratando"); demais
atores veem posse alheia e não comandam até expirar/liberar.

**Frente aos drivers.** D1: elimina conflito de escrita por construção; cria o
modo de falha do lease órfão (ator saiu, item preso até expirar) — numa UTI, um
item urgente preso é hazard operacional (parente de HAZ-0024). D2: a posse é
visível — ponto forte real. D7: exige gestão de expiração/quebra de lease com
autoridade própria.

**Consequências positivas.** "Quem está com isso agora" fica explícito; sem
conflitos tardios.

**Consequências negativas.** Expiração de lease é um timer de segurança a mais
para errar; quebra de lease ("takeover") precisa de autorização e auditoria
próprias; o caso raro (concorrência) passa a custar no caso comum (toda ação
exige claim).

**O que precisaria ser verdade.** A4 invalidada (contenção alta medida) ou
validação de usuário preferindo posse explícita.

**Custo de saída.** Moderado.

#### Opção Q2-C — Última escrita vence (sem controle)

**Descrição.** Comandos aplicam-se na ordem de chegada; sem token, sem lease.

**Consequências positivas.** Implementação trivial; zero fricção aparente.

**Consequências negativas.** É literalmente o hazard HAZ-0023/THR-0043 (lost
update — precedente legado); perda de ação humana **silenciosa**, violando
DOM-0005. Listada porque é o default acidental de qualquer implementação sem
decisão — nomeá-la é a defesa contra adotá-la por omissão.

**O que precisaria ser verdade.** Nada a torna aceitável sob DOM-0005; consta
para registro honesto.

**Custo de saída.** Alto depois de dado real: ações perdidas não se recuperam.

#### Opção Q2-Z — Adiar

Sem decisão de concorrência, Q2-C vira o default de fato na primeira
implementação — adiar Q2 é escolher Q2-C sem dizer. Registrado como
inaceitável de adotar silenciosamente; se a autoridade quiser adiar, que o faça
com essa consequência escrita.

### 4.1 Comparação frente aos drivers

| Driver | Q1-A única + entrega paralela | Q1-B duas máquinas | Q1-C entrega no estado | Q2-A otimista | Q2-B pessimista | Q2-C LWW |
|---|---|---|---|---|---|---|
| D1 perda silenciosa | Um token, um agregado | Dois tokens, mais corridas | Token disputado pelo pipeline de entrega | Conflito explícito; retry seguro | Sem conflito; lease órfão | **Perda silenciosa — HAZ-0023** |
| D2 responsabilidade | Estado + Assignment derivável | Expressivo, exibição ambígua | "Notificado" não diz quem | Neutro | Posse explícita (forte) | Indeterminável |
| D3 supressão/no-fire | Estrutural (estado próprio; no-fire fora da máquina) | Dupla semântica a validar | Neutro | Neutro | Neutro | Neutro |
| D4 escalada crash-safe | Um agregado a re-armar | Dois | Um, com ruído de entrega | Neutro | Lease + timer = dois relógios | Neutro |
| D5 auditoria | Por transição, mesma transação | Em dois agregados | Inflada por eventos de canal | Por comando | Por comando + lease | Incompleta por definição |
| D7 custo | Menor das completas | Maior | Média, cara de manter | Menor | Média | "Grátis" até o incidente |

### 4.2 Semânticas transversais às opções (aplicam-se a qualquer combinação aceita)

Supressão (D3), timers (D4), reconciliação N6 e ações em grupo não variam por
opção — estão na minuta §5.2 como cláusulas próprias, porque qualquer combinação
Q1×Q2 aceita precisa delas.

### 4.3 Divergências com o diagrama candidato (correções candidatas — o diagrama segue o ADR)

Registradas para o handoff; **nenhuma vira correção antes da aceitação deste ADR**:

| # | Diagrama candidato | Este ADR (opção recomendada Q1-A) | Efeito se Q1-A for aceita |
|---|---|---|---|
| DIV-1 | `Notificado` como estado do ciclo de vida, com regressão a `Levantado` em falha de entrega | Entrega é dimensão paralela por canal; jamais estado do item (E3; DOM-0006) | Remover o estado `Notificado` do diagrama; adicionar nota da dimensão de entrega |
| DIV-2 | `Reatribuído` como estado distinto com ida-e-volta a `Atribuído` | Reatribuição é transição (novo Assignment) permanecendo em `atribuído` | Colapsar `Reatribuido` em auto-transição de `Atribuido` |
| DIV-3 | `Levantado` como estado inicial separado de atribuição | Compatível: `Levantado` ≙ `não-atribuído` do §11 (mesmo estado, nome distinto) | Renomear para alinhar ao vocabulário do §11/ADR-0029 (glossário pt-BR) |

O restante do diagrama (Reconhecido/Escalado/Sobreposto/Suprimido/Resolvido/
Reaberto, supressão jamais silenciosa, auditoria na mesma transação) é
**ratificado-como-proposto** pela opção Q1-A — sem contradição.

---

## 5. Decisão e escopo

> **DECISÃO REGISTRADA (GDEC-0008, 2026-08-15).** O titular aceitou este ADR nas
> opções recomendadas, incluindo a minuta §5.2 integral — ver §5.0.

### 5.0 Decisão (GDEC-0008, 2026-08-15)

> **decided_by:** rodaquino-OMNI (titular; `AUTH-CLINSAFETY`, GDEC-0003).
>
> **Opções aceitas:** **Q1-A** (§4, Q1) — uma máquina única de `WorkItem` com os
> oito estados do §11, entrega como dimensão paralela, `Alert` como fato imutável
> associado — e **Q2-A** (§4, Q2) — concorrência otimista com token de versão
> obrigatório, conflito → falha explícita com estado corrente. A **minuta W1–W12 de
> §5.2 é aceita integralmente**, incluindo as correções candidatas DIV-1..3 de §4.3
> ao diagrama `maquina-estados-alerta-acao-humana.md` (o diagrama passa a seguir
> este ADR).
>
> **rationale:** conforme sessão de decisão GDEC-0008.
>
> **supersessão:** rege-se pelos próprios gatilhos de revisita desta ADR (§8.2,
> T1–T6) — nenhum gatilho adicional é criado por esta transcrição.

### 5.1 Condições que devem ser satisfeitas antes da aceitação

| # | Condição | Dono | Evidência que a fecha | Estado |
|---|---|---|---|---|
| C1 | ADR-0010 (backbone) com direção registrada — W6 (auditoria+evento na mesma transação) pressupõe publicação transacional. | autoridade do ADR-0010 | ADR-0010 aceito ou direção registrada | **FECHADA** — DECISÃO (GDEC-0008): ADR-0010 aceito na mesma sessão (item 4) |
| C2 | Reconciliação declarada com o texto aceito do ADR-0008 (N6/N7): a maquinaria daqui implementa a reconciliação de alerta superseded e a regra "severidade só legível com status permitido". | autoridade deste ADR | Nota de reconciliação na aceitação | **FECHADA** — DECISÃO (GDEC-0008): compatibilidade declarada — W9 implementa N6, W12/severidade respeita N7 (E10) |
| C3 | Validação de fatores humanos H1/H2/H3 executada, OU aceitação registrando explicitamente decisão estrutural com validação de usuário pendente como condição de G4. | AUTH-UX + especialista de fatores humanos | Registro de validação com cenários críticos simulados | **PARCIALMENTE FECHADA** — DECISÃO (GDEC-0008): opção recomendada aceita com a estrutura decidida; validação de usuário permanece pendente como condição de G4 (cláusula "OU" desta condição) |
| C4 | Vocabulário pt-BR dos estados ratificado via processo do ADR-0029 (aceito) — nomes exibidos jamais tranquilizadores para estados não terminais. | AUTH-CLINSAFETY + AUTH-UX | Glossário normativo atualizado | ABERTA — genuinamente pendente do processo do ADR-0029 |
| C5 | Política clínica de quem pode suprimir/fechar em cenários HAZ-0044 (paliativo/limitação terapêutica) registrada pelo titular clínico — a estrutura daqui a comporta, não a substitui. | AUTH-CLINSAFETY | Registro clínico de política | ABERTA |

### 5.2 Minuta normativa proposta (DECISÃO — GDEC-0008: minuta W1–W12 aceita integralmente)

Cláusulas marcadas ◆ têm consequência clínica direta e permanecem sob AUTH-CLINSAFETY.

**W1 — Estados nucleares.** ◆ O `WorkItem` tem exatamente os estados
`não-atribuído | atribuído | reconhecido | escalado | sobreposto | resolvido |
suprimido | reaberto` (E1), com as definições do glossário §5 como fonte.
Nenhum estado adicional sem emenda deste ADR. Entrega é dimensão paralela por
canal — jamais estado do item (Q1-A; DIV-1).

**W2 — Idempotência de comando.** Todo comando de transição carrega chave de
idempotência própria; reenvio da mesma chave retorna o resultado original sem
duplicar efeito (DOM-0005; TST-DOM-0005). Chave derivada da intenção do ator,
jamais de heurística sobre dados do paciente.

**W3 — Concorrência.** ◆ Conforme a opção Q2 aceita. Sob Q2-A (recomendada):
token de versão obrigatório; conflito → falha explícita com estado corrente e
autor da mudança vencedora; **jamais** última-escrita-vence silenciosa
(HAZ-0023). A resposta de conflito não carrega PHI além do necessário à
redecisão.

**W4 — Autorização e ator.** Todo comando é autorizado por tenant + encontro +
papel no momento da execução (DOM-0001; regra §3-6) e vinculado a um **ator
humano individual** — conta compartilhada não transiciona item (THR-0044). Break-
glass, se existir, é matéria do ADR-0016 e entra auditada como tal.

**W5 — Timers de escalada.** ◆ Timers são duráveis e re-armáveis a partir do
estado persistido: queda e religada de processo jamais perdem escalada pendente
(D4). Valores default por via/classe vêm do bundle (ADR-0007); configuração local
só **aperta** (A7-2). Nenhum valor numérico é proposto aqui — `VALIDATION
REQUIRED`. Escalada automática muda roteamento/urgência; **não** fecha, não
suprime, não decide clinicamente (E3; regra §3-15).

**W6 — Auditoria e publicação transacionais.** Toda transição grava
`AuditEvidence` imutável (ator, comando, chave, versão vista, estado
anterior→novo, tempo conforme `time-semantics.md`) **na mesma transação** do
efeito, com evento publicado via outbox (ADR-0010) na mesma fronteira
transacional (DOM-0005; QAS-0021). Auditoria "melhor esforço" é não-conforme.

**W7 — Supressão.** ◆ Supressão é **sempre** ato explícito com: ator autorizado,
razão codificada (vocabulário versionado — jamais texto livre, espelhando N3),
escopo declarado (este item; jamais "condição inteira" implícita) e prazo/condição
de expiração. Item suprimido permanece visível em toda superfície com contagem
própria (N4-iii); supressão expira para estado ativo, nunca para silêncio.
**Supressão jamais representa ou esconde no-fire**: no-fire tem registro e razão
próprios fora desta máquina (SAF-0019; HAZ-0021/0022; §20) — um item suprimido
existiu e está suprimido; um no-fire nunca gerou item e tem sua razão persistida
no registro de avaliação.

**W8 — Override.** ◆ Sobreposição é ato pontual sobre item específico, com
racional obrigatório registrado (glossário §5), distinto de supressão; jamais
padrão de silenciamento. Overrides são contáveis e monitoráveis como sinal de
qualidade de regra (prompt §14: análises de override).

**W9 — Reconciliação com avaliação (N6).** ◆ Quando a avaliação que originou o
item é superseded (correção/chegada tardia), o item é **reconciliado**: transição
explícita e auditada com vínculo à nova avaliação — apresentada como atualização
de contexto, **jamais** remoção silenciosa (E10). Se a nova avaliação sustenta a
condição, o item permanece com contexto atualizado; se não sustenta, o item vai a
estado terminal próprio de reconciliação, visível no histórico, jamais apagado.

**W10 — Reabertura.** ◆ `resolvido → reaberto` exige comando humano autorizado
com razão, OU reconciliação W9; reaberto segue para `atribuído` (novo
Assignment). Reabertura não apaga a resolução anterior — o histórico completo
permanece (DOM-0005/auditoria).

**W11 — Ações em grupo.** Operações sobre múltiplos itens são atômicas OU
retornam resultado por item transparente (prompt §11); falha parcial jamais exibe
o grupo como tratado (HAZ-0033; THR-0045). Nenhum estado agregado otimista de
cliente mascara falha de comando de segurança (prompt §11).

**W12 — Autoridade humana.** ◆ A máquina calcula, roteia, temporiza, registra e
explica; **não** reconhece, não resolve, não suprime e não sobrepõe por conta
própria (regra §3-15; HAZ-0036). Toda transição para estado que comunica
"tratado" tem ator humano. Escalada automática (W5) é a única transição sem ator
humano — e ela nunca comunica "tratado".

### 5.3 Escopo do que a aceitação vincularia

**Vincula:** estados, transições, comandos e suas garantias (W1-W12) para todo
alerta/item de trabalho da V2, em todo tenant e ambiente.

**Não vincula:** condições clínicas de geração de alerta (rule release); valores
de timers (VALIDATION REQUIRED, por bundle); canal/conteúdo de notificação
(ADR-0011/0019); roteamento organizacional concreto (configuração sob envelope
ADR-0007); tecnologia de persistência/broker (§3 regra 14; ADR-0010).

---

## 6. Consequências

Consequências **da existência deste ADR em `proposed`**.

### 6.1 Positivas

- O diagrama candidato ganha o instrumento de decisão que ele próprio declara não
  ser; as divergências viram itens nomeados (DIV-1..3) em vez de deriva.
- A fatia G7 ("concurrent-safe human action") e o ADR-0012 (API expõe a máquina)
  ganham base decidível.
- A reconciliação N6 — já aceita no ADR-0008 — ganha a contraparte estrutural que
  aquele texto referencia.

### 6.2 Negativas

- A minuta W1-W12 é extensa; risco de aceitação em bloco sem exame — mitigado
  pela numeração e marcas ◆.
- H1-H3 (fatores humanos) seguem não testadas; aceitar estrutura antes da
  validação de usuário é legítimo, mas C3 existe para que isso seja dito, não
  presumido.

### 6.3 Neutras / estruturais

- Nada aqui gera alertas: sem via aprovada (G2) e fonte elegível (G3), a máquina
  opera apenas sobre fixtures sintéticas.
- Nada aqui decide tecnologia de timer, fila ou armazenamento.

---

## 7. Implicações transversais

| Dimensão | Implicação | Rótulo | Papel responsável | IDs |
|---|---|---|---|---|
| Segurança clínica | W7/W9 decidem se supressão e retirada de alerta podem acontecer sem traço — os hazards de opacidade (HAZ-0021/0022) e de responsabilidade ambígua (HAZ-0024) são o objeto direto; HAZ-0044 exige a política C5 do titular clínico. | INFERENCE de E6, E7, E12 | AUTH-CLINSAFETY | HAZ-0016, HAZ-0021, HAZ-0022, HAZ-0023, HAZ-0024, HAZ-0033, HAZ-0044; SAF-0017, SAF-0019, SAF-0022 |
| Segurança | Comandos autorizados por tenant/encontro/papel com ator individual (W4); THR-0043/0044/0045 são os cenários de ameaça correspondentes; break-glass pertence ao ADR-0016. | INFERENCE | AUTH-SECURITY | THR-0040, THR-0043, THR-0044, THR-0045; ADR-0016 |
| Privacidade (LGPD) | Razões codificadas (W7) e respostas de conflito (W3) sem texto livre bloqueiam PHI em razão/erro; auditoria de transição minimiza conteúdo clínico (referencia o registro, não o repete). Nenhuma conformidade declarada. | VALIDATION REQUIRED | AUTH-PRIVACY-LEGAL (não nomeado) | ADR-0018; QAS-0028 |
| Interoperabilidade | A máquina é exposta por comandos/consultas versionados (ADR-0012); writeback de reconhecimento a sistemas externos (se aprovado) consome os estados daqui (§7.5 candidato). | INFERENCE | AUTH-PRODUCT | ADR-0012, ADR-0013 |
| Acessibilidade | Cada um dos oito estados precisa ser distinguível sem depender de cor, com anúncio coalescido a tecnologia assistiva em mudança de estado (HAZ-0037 via ADR-0011/0021; prompt §11). | INFERENCE | AUTH-UX | ADR-0021; SAF-0034 (via ADR-0008 N7) |
| Operacional | Timers duráveis, monitoração de itens presos/suprimidos-expirando e reconciliação pós-downtime de itens (HAZ-0034 via ADR-0006/0020) viram deveres operacionais. | INFERENCE | AUTH-OPERATIONS | ADR-0020; QAS-0006, QAS-0022 |
| Custo | Uma máquina única (Q1-A) é a opção completa mais barata; nenhum modelo de custo existe; D7 registrado como não quantificado. | VALIDATION REQUIRED | AUTH-PRODUCT | — |
| Migração | Estados legados de alerta (se algum dia importados sob ADR-0023) mapeiam para os estados daqui com proveniência de importação; nenhum estado legado entra sem mapeamento explícito. | INFERENCE | AUTH-OPERATIONS | ADR-0023 |

---

## 8. Reversibilidade, gatilhos de revisita, kill/rollback

### 8.1 Avaliação de reversibilidade

| Item | Reversibilidade | O que fica encalhado ao reverter | Rótulo |
|---|---|---|---|
| Q1-A (máquina única) | Moderada→Q1-B (dividir depois é migração com histórico preservável) | Projeções e contratos de API sobre a máquina única | INFERENCE |
| Q1-B (duas máquinas) | Baixa→Q1-A (colapsar exige adjudicar estados combinados) | O histórico combinado | INFERENCE |
| Q2-A (otimista) | Alta→Q2-B (mesmo contrato de comando, outro mecanismo) | Pouco | INFERENCE |
| Q2-B (pessimista) | Moderada→Q2-A | Fluxos de claim na UI | INFERENCE |
| W7 (semântica de supressão) | Alta no aperto, baixa no afrouxamento: tornar supressão menos visível depois é mudança de segurança que exige novo ADR | Nada — é a direção segura | INFERENCE |

### 8.2 Gatilhos de revisita

| # | Gatilho | Detecção | Notificar | Ação |
|---|---|---|---|---|
| T1 | H1 falha: conflito otimista mostra-se irresolvível em cenário crítico simulado | Validação de fatores humanos (C3) | AUTH-UX, AUTH-CLINSAFETY | Reavaliar Q2 (pessimista ou híbrido por estado) |
| T2 | A4 invalidada: contenção real alta medida em uso | Telemetria de conflito (taxa de falha W3) | autoridade deste ADR | Reavaliar Q2 |
| T3 | Emenda/supersessão do ADR-0008 tocando N6/N7 | Registro de decisão | autoridade deste ADR | Reconciliar W9/W12 (C2) |
| T4 | Medição de overrides/supressões em uso além do esperado (sinal de regra ruim ou de fricção) | Monitoração W8/W7 (prompt §14 análises) | AUTH-CLINSAFETY | Revisar regra/via antes de afrouxar a máquina |
| T5 | Escopo de agrupamento rico exigido por validação (H3 a favor de Q1-B) | Registro de validação | autoridade deste ADR | Reabrir Q1 |
| T6 | Política HAZ-0044 registrada (C5) exigindo estado/transição que W1 não comporta | Registro clínico | AUTH-CLINSAFETY | Emenda de W1 por decisão, jamais por implementação |

### 8.3 Kill switch / rollback

Enquanto `proposed`, não há mecanismo a desligar. Na aceitação, os controles
estruturais propostos: (i) **escalada automática tem kill switch próprio** —
desligável por decisão operacional registrada, com o desligamento **visível**
como modo degradado (DOM-0007): itens continuam operáveis manualmente, e a
ausência de escalada automática jamais aparenta normalidade; (ii) **supressão em
massa não existe como operação** — silenciar uma classe de alerta é ato de rule
release (rollback/retirada do bundle, ADR-0007 SAF-0021), nunca varredura de
supressão na máquina; (iii) transições não têm rollback destrutivo — reversão é
nova transição auditada (reabertura, reconciliação), nunca apagamento.

---

## 9. Método de validação e evidência vinculada

| # | Afirmação a validar | Método | Ambiente | IDs vinculados |
|---|---|---|---|---|
| V1 | Comando duplicado (mesma chave) não duplica efeito; comandos concorrentes conflitantes produzem exatamente um vencedor e uma falha explícita | Testes de propriedade/concorrência sobre o agregado | Teste (sintético) | TST-DOM-0005; DOM-0005; QAS-0021; HAZ-0023 |
| V2 | Toda transição aceita produz AuditEvidence na mesma transação; auditoria e evento publicados jamais divergem | Testes de crash-point (com ADR-0010) + verificação de paridade | Teste | DOM-0005; QAS-0016, QAS-0021; HAZ-0035 |
| V3 | Comando não autorizado / cross-tenant / de conta compartilhada falha fechado | Testes adversariais de autorização | Teste | DOM-0001; THR-0043, THR-0044; QAS-0014 (via ADR-0016) |
| V4 | Queda de processo com escalada pendente: religada re-arma e dispara; nenhuma escalada perdida | Testes de falha/restart com timers duráveis | Teste | QAS-0006, QAS-0022; SAF-0016 |
| V5 | Item suprimido permanece visível com contagem própria; supressão expira para ativo; nenhum caminho exibe suprimido como resolvido/normal | Testes de projeção/UI por estado (com ADR-0011/0021) | Teste | HAZ-0022; SAF-0022; QAS-0017 |
| V6 | Avaliação superseded reconcilia item com transição visível — jamais remoção silenciosa | Teste do fluxo N6→W9 | Teste | HAZ-0021; SAF-0019; QAS-0019 |
| V7 | Ação em grupo com falha parcial reporta por item; o grupo jamais aparenta tratado | Testes de operação em lote com falha injetada | Teste | HAZ-0033; THR-0045; SAF-0018 |
| V8 | Cenários simulados de ação concorrente/handoff são operáveis pelos usuários representativos (H1-H3) | Validação de fatores humanos com cenários críticos | Ambiente de usabilidade | VAL: pendente do backlog de validação; C3 |

**Disciplina de marcadores.** Todos os IDs DOM/HAZ/SAF/QAS/THR/TST-DOM citados
foram lidos dos catálogos existentes antes da citação; `REQ:`/`VAL:` (geral)
permanecem marcadores literais. **Nenhum ID foi inventado.**

---

## 10. Relações de supersessão

- **Supera:** nenhum ADR. Em relação ao diagrama candidato
  `maquina-estados-alerta-acao-humana.md`: **não o supera** — o diagrama é
  PROPOSAL de outro autor; se este ADR for aceito, o diagrama deve ser
  **corrigido para segui-lo** (DIV-1..3 em §4.3), por seu fluxo próprio de
  edição, fora do escopo de escrita desta sessão.
- **Superado por:** nenhum.
- **Notas de relação:** acoplamento com ADR-0008 (C2 — N6/N7), dependência de
  ADR-0010 (C1 — publicação transacional) e alimentação de ADR-0011/0012/0021.
  Supersessão parcial por tenant/ambiente é permitida e jamais generalizada.

---

## 11. Autoverificação contra o gate de completude do template

Todos os campos do §10 do prompt presentes; dois eixos com ≥2 alternativas reais
cada + adiar (Q2-C existe para nomear o default perigoso — e isso é dito); toda
alternativa com consequências positivas E negativas; drivers discriminantes
ligados a QAS; **nenhum alvo numérico inventado** (timers VALIDATION REQUIRED);
oito linhas transversais presentes; reversibilidade, gatilhos e kill/rollback
presentes; validação com IDs reais verificados; supersessão declarada; **nenhuma
tecnologia selecionada**; nenhuma aprovação fabricada; nenhum dono nomeado;
autoridade clínica humana preservada em toda cláusula (W12). **Nota da aceitação
(GDEC-0008, 2026-08-15):** `adr-index.md` atualizado na mesma mudança da
transcrição de decisão; correções DIV-1..3 do diagrama seguem registradas para o
fluxo próprio de edição daquele documento, não executadas aqui (fora do escopo de
escrita desta transcrição).
