---
id: LGPD-OS16-Q15-EVIDENCIA-CONSULTIVO
title: Evidência consolidada e citável do caráter consultivo dos escores e alertas (parecer OS-16, Q-15)
label: PROPOSAL
statement: >
  Consolidação citável da evidência de que os escores e alertas do IntensiCare V2
  são consultivos — a decisão clínica permanece com profissional de saúde
  responsável — exigida pelo parecer jurídico OS-16 (item III, condicionante 1;
  Q-13; Q-15). Formula o requisito candidato EC-R1, descreve a trilha de revisão
  humana decidida no ADR-0009 e mapeia os artefatos existentes. Este documento
  não alega conformidade regulatória, não fecha gate, bloqueador, risco ou
  hazard, e nada aqui é DECIDED.
provenance:
  source_repo: intensicare-V2
  path_or_url: docs/11-security-privacy-compliance/evidencia-carater-consultivo.md
  commit_sha_or_version: 33c749afd0f4cf82c06202aa3ec8c79702c2cde9 (HEAD de cycle-6/construcao-g7 na redação; este arquivo ainda não commitado)
  section_or_lines: documento inteiro
  date_collected: "2026-08-16"
  collector: especialista de privacidade e conformidade (SPR-G4-7, ciclo 6)
  transformation: >
    consolidação — citações verbatim e resumos fiéis dos artefatos citados;
    nenhuma leitura jurídica nova é criada (a leitura jurídica pertence ao
    parecer OS-16); o único conteúdo novo é a formulação do requisito EC-R1,
    rotulada PROPOSAL.
  confidence: medium
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
last_updated: "2026-08-16"
links:
  requirements: []
  hazards: [HAZ-0046]
  adrs: [ADR-0004, ADR-0008, ADR-0009]
  tests: ["TST-DOM-0005 (método de validação planejado — ADR-0009 §9 V1)"]
  pr: null
supersedes: null
superseded_by: null
---

# Evidência consolidada do caráter consultivo dos escores e alertas do IntensiCare V2

> **Natureza deste documento.** Consolidação citável, produzida para atender à
> condicionante do laço clínico do parecer OS-16 (Q-15): *o caráter consultivo
> deve estar documentado e verificável*. Este documento **documenta** e aponta
> **como se verifica**; ele **não** alega conformidade regulatória, efetividade
> clínica ou segurança comprovada, **não** fecha nenhum gate, bloqueador ou
> hazard, e **não** substitui a leitura jurídica — que é do parecerista.
> Rótulos epistêmicos conforme `docs/00-governance/evidence-notation.md` §2.
> Âncoras `EC-*` são identificadores locais deste documento, **não** IDs de
> catálogo (`docs/00-governance/traceability-policy.md`).

---

## 1. A exigência que este documento atende (parecer OS-16, Q-15)

SOURCE (`docs/11-security-privacy-compliance/lgpd-os16/parecer-os16-2026-08-15-recebido.md`,
item III, condicionante 1 — verbatim):

> "o caráter **consultivo** dos escores e alertas (a decisão clínica permanece
> com profissional responsável) deve estar documentado e verificável — é isso
> que afasta a incidência autônoma do art. 20 (Q-15); recomendo registrar como
> evidência os requisitos de UX/traçabilidade já existentes no repositório"

SOURCE (mesmo arquivo, item VI, respostas Q-13 e Q-15):

> Q-13: "Procedimento dirigido por profissional habilitado; o software é
> instrumento — condição verificável pelo caráter consultivo documentado."
>
> Q-15: "Art. 20 não acionado enquanto a decisão for de profissional;
> evidência: rastro de que alertas são consultivos e há revisão humana."

SOURCE (mesmo arquivo, "Análise de conformidade ATUALIZADA", efeitos 1 e 5): o
que o parecer libera para o laço clínico, libera sob a condicionante "caráter
consultivo documentado e verificável"; a "evidência do caráter consultivo
(UX/traçabilidade)" é listada como trabalho novo criado pelas condicionantes.

INFERENCE (das três fontes acima): a evidência exigida tem dois componentes —
(i) **documentação** de que os escores/alertas são consultivos por desenho
(seções 2 e 4 abaixo) e (ii) **verificabilidade** de que cada alerta exige
reconhecimento ou ação de humano identificado, com rastro auditável (seção 3
abaixo). Este documento consolida os dois componentes a partir de artefatos que
já existem no repositório, exatamente como o parecerista recomendou.

---

## 2. Requisito formulado — EC-R1 (caráter consultivo verificável)

**PROPOSAL — EC-R1 (candidato a requisito vinculante; aguarda ratificação da
autoridade humana; nenhum ID de catálogo é cunhado aqui):**

> **EC-R1.** Todo escore, alerta ou item de trabalho produzido pelo IntensiCare
> V2 é **consultivo**: constitui insumo para a decisão de profissional de saúde
> responsável e **jamais** decisão clínica. Em consequência, e de forma
> verificável por teste automatizado e por trilha de auditoria:
>
> - **EC-R1.a — nenhum fechamento sem humano.** Nenhum caminho de código
>   transiciona um alerta/item de trabalho para estado que comunique "tratado"
>   (reconhecido, resolvido, sobreposto, suprimido) sem comando de **ator
>   humano individual, autorizado e identificado** (ADR-0009, cláusulas W4 e
>   W12, aceitas).
> - **EC-R1.b — rastro imutável por transição.** Toda transição grava evidência
>   de auditoria imutável (ator, comando, estado anterior→novo) na mesma
>   transação do efeito (ADR-0009 W6).
> - **EC-R1.c — discordância humana de primeira classe.** Override e supressão
>   são atos humanos explícitos, com racional/razão registrados, visíveis e
>   contáveis — jamais silenciamento (ADR-0009 W7 e W8).
> - **EC-R1.d — limites declarados na superfície.** Toda superfície que exiba
>   escore/alerta declara os limites do registro que o sustenta — no mínimo o
>   rótulo vinculante "registro limitado a esta instituição" (ADR-0004 §6.2;
>   HAZ-0046) — para que o profissional decida sobre um insumo cujas bordas
>   conhece.
> - **EC-R1.e — automação nunca decide.** A automação calcula, resume, roteia,
>   temporiza, registra e explica; não reconhece, não resolve, não suprime, não
>   sobrepõe e não executa conduta clínica (prompt §3 regra 15; ADR-0009 W12;
>   intended-use IU-09).

PREMISSA (reversível, GDEC-0015/0017): EC-R1 é tratado como vinculante para
fins de construção (testes e CI da fatia G7) enquanto permanece PROPOSAL, até
ratificação ou correção pelo titular; qualquer implementação que o contrarie é
não-conforme para o trabalho de construção em curso.

INFERENCE (de EC-R1 contra as fontes da seção 4): EC-R1 não cria semântica
nova — ele **consolida em um enunciado testável** obrigações que já constam,
dispersas, no uso pretendido, no prompt §1/§3/§11 e nos ADRs aceitos 0004,
0008 e 0009. A remoção de qualquer alínea exigiria emenda dos artefatos-fonte,
não apenas deste documento.

---

## 3. Trilha de revisão humana — como cada alerta exige reconhecimento/ação humana

### 3.1 O laço termina em humano, por desenho

SOURCE (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md` §1): o laço mínimo de segurança
é *"trusted clinical input → ... → durable and explainable work item or alert
when warranted → **authorized human acknowledgment, escalation, reassignment,
resolution, or override** → immutable audit, reconciliation, outcome
measurement..."*. A ação humana autorizada é uma etapa nomeada do laço, entre o
alerta e a auditoria imutável — não um acessório.

SOURCE (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md` §11): o modelo de estados
compartilhado deve suportar, visivelmente distintos, *"unassigned, assigned,
acknowledged, escalated, overridden, resolved, suppressed, reopened"* — oito
estados cujas transições relevantes são atos humanos; e *"no local optimistic
state that can mask a failed safety-relevant command"*.

### 3.2 A máquina de estados aceita (ADR-0009, GDEC-0008) operacionaliza a trilha

SOURCE (`docs/06-architecture/adrs/ADR-0009-maquina-de-estados-alerta-item-de-trabalho.md`,
status `accepted (2026-08-15, GDEC-0008)`, minuta W1–W12 aceita integralmente).
Cláusulas que constituem a trilha de revisão humana:

| Cláusula | O que garante para o caráter consultivo |
|---|---|
| **W1** | Todo alerta que merece atenção humana vira `WorkItem` com exatamente os oito estados do §11; nenhum estado adicional sem emenda de ADR. |
| **W2/W3** | Comandos humanos idempotentes e com token de concorrência: conflito → falha explícita com o estado corrente, e "a redecisão é humana por construção" (opção Q2-A aceita); jamais última-escrita-vence silenciosa. |
| **W4** | Todo comando é autorizado (tenant + encontro + papel) e vinculado a **ator humano individual** — conta compartilhada não transiciona item. |
| **W5** | Escalada automática apenas **aumenta visibilidade** (roteamento/urgência); "não fecha, não suprime, não decide clinicamente". |
| **W6** | Toda transição grava `AuditEvidence` imutável (ator, comando, estado anterior→novo) **na mesma transação** do efeito; auditoria "melhor esforço" é não-conforme. |
| **W7** | Supressão é sempre ato humano explícito com razão codificada, escopo e expiração; item suprimido permanece visível; supressão jamais esconde no-fire (que tem registro e razão próprios — SAF-0019). |
| **W8** | Override é ato humano pontual com racional obrigatório, contável e monitorável como sinal de qualidade de regra. |
| **W9** (com ADR-0008 N6/N7) | Correção/chegada tardia reconcilia o item por transição explícita e auditada — jamais remoção silenciosa de alerta. |
| **W12** | Verbatim: "A máquina calcula, roteia, temporiza, registra e explica; **não** reconhece, não resolve, não suprime e não sobrepõe por conta própria (regra §3-15...). **Toda transição para estado que comunica 'tratado' tem ator humano.** Escalada automática (W5) é a única transição sem ator humano — e ela nunca comunica 'tratado'." |

INFERENCE (de W1–W12): o "rastro de que alertas são consultivos e há revisão
humana" exigido em Q-15 é, na V2, uma propriedade estrutural decidida: o único
caminho de um alerta até qualquer estado de conclusão passa por comando de
humano identificado, autorizado e auditado na mesma transação. Não existe, por
construção aceita, rota de fechamento automático.

### 3.3 Como isso se verifica (métodos já definidos; execução pendente)

SOURCE (ADR-0009 §9): os métodos de validação V1–V8 já vinculam a trilha a
testes — V1 (comando duplicado/concorrente: um vencedor, uma falha explícita;
TST-DOM-0005), V2 (auditoria na mesma transação, crash-point), V3 (comando não
autorizado/conta compartilhada falha fechado), V5 (suprimido permanece visível),
V6 (reconciliação jamais silenciosa), V8 (cenários simulados com usuários
representativos).

OBSERVED (repositório em 2026-08-16, integração da fatia G7): os testes
**formais** V1–V8 do ADR-0009 §9 (TST-DOM-0005) **ainda não estão implementados
nem executados como evidência formal**. A árvore JÁ contém, porém, testes
automatizados VERDES que exercitam as mesmas propriedades em nível de fatia
sintética: concorrência de comando com um vencedor e falha explícita
(`packages/persistencia/src/outbox-and-audit.test.ts` — conflito de versão não
altera, não audita, não publica; `apps/api/src/e2e.fatia.test.ts` — If-Match
divergente ⇒ 412 com estado corrente) e atomicidade de auditoria/outbox na
mesma transação da transição (mesmos arquivos; rollback reverte fato E evento).
Esses testes referenciam EC-R1.a–EC-R1.c e o ADR-0009 §9 nos comentários (como
a seção 6 pede), mas **não substituem** os V1–V8 formais — nada aqui fecha
TST-DOM-0005. VALIDATION REQUIRED: a passagem dos testes V1–V7 em CI e a
validação de fatores humanos V8 (condição C3 do ADR-0009, pendente para G4) são
o que converterá "verificável" em "verificado". Este documento não antecipa esse
resultado.

---

## 4. Mapeamento aos artefatos existentes

Tabela citável — cada linha é um componente da evidência do caráter consultivo:

| # | Afirmação | Artefato (fonte) | Rótulo | Estado do artefato |
|---|---|---|---|---|
| EC-M1 | Uso pretendido declara a V2 **advisory**: "Its outputs are inputs to a human decision, never a decision", com tabela may/may-not (calcular/rotear/explicar vs. decidir/executar conduta) | `docs/01-vision-and-intended-use/intended-use-statement.md` §5, IU-09 | SOURCE | PROPOSAL; aprovador do uso pretendido pendente |
| EC-M2 | Regra inegociável do programa: "Keep clinical decision authority with accountable humans. Automation may calculate, summarize, route, and explain within approved intended use" | `INTENSICARE_V2_ORCHESTRATOR_PROMPT.md` §3, regra 15 | SOURCE | Vigente (prompt do programa) |
| EC-M3 | O laço mínimo termina em "authorized human acknowledgment, escalation, reassignment, resolution, or override → immutable audit" | `INTENSICARE_V2_ORCHESTRATOR_PROMPT.md` §1 | SOURCE | Vigente |
| EC-M4 | Estados obrigatórios de ação humana, visivelmente distintos, e proibição de estado otimista local que mascare comando de segurança | `INTENSICARE_V2_ORCHESTRATOR_PROMPT.md` §11 | SOURCE | Vigente |
| EC-M5 | Máquina de estados com autoridade humana estrutural (W1–W12; ver §3.2) | `docs/06-architecture/adrs/ADR-0009-...md` §5.2 | SOURCE | **Aceito** (GDEC-0008); não implantado, não verificado |
| EC-M6 | Reconciliação de avaliação superseded jamais retira alerta silenciosamente (N6); severidade só legível com status permitido (N7) | ADR-0008 §4.2 N6/N7, citado via ADR-0009 E10 | SOURCE | Aceito |
| EC-M7 | Rótulo vinculante de limitação institucional: "a UI da V2 DEVE exibir a limitação ao clínico — em linguagem equivalente a 'registro limitado a esta instituição'. Esta é uma obrigação de segurança clínica, não uma preferência de UX" (população exposta medida: 4.220 pacientes, 3,88%) | `docs/06-architecture/adrs/ADR-0004-...md` §6.2 (requisito da ata AQ-1) | SOURCE | Aceito como requisito; **não implementado** |
| EC-M8 | Hazard cunhado para a ausência do rótulo: leitura da tela como "o registro do paciente" em vez de "o registro do paciente **nesta instituição**" | `docs/05-clinical-safety/hazard-log.md` HAZ-0046 | SOURCE | **OPEN**, severidade S4, Unacceptable — mitigação pendente |
| EC-M9 | O rótulo "advisory" não desculpa exibição falsamente tranquilizadora; falsa tranquilização é classe de hazard de primeira classe | `intended-use-statement.md` §5, IU-10 | SOURCE | PROPOSAL |
| EC-M10 | Saídas de MCP/IA ficam **dentro** da fronteira consultiva, nunca acima dela; jamais fonte não revisada de verdade clínica | `intended-use-statement.md` §5, IU-11; prompt §12.4 | SOURCE | PROPOSAL |

INFERENCE (de EC-M1..M10): o repositório já contém, em artefatos com dono e
trilha próprios, todos os elementos que o parecerista pediu para "registrar
como evidência" — declaração de uso pretendido consultivo (EC-M1, EC-M9,
EC-M10), regra de autoridade humana (EC-M2, EC-M3), requisitos de UX/estados
(EC-M4, EC-M7), traçabilidade estrutural decidida (EC-M5, EC-M6) e o registro
honesto do risco residual de apresentação (EC-M8). Este documento é o índice
consolidado desses elementos, não a sua fonte.

---

## 5. O que esta evidência NÃO estabelece

- **Não é alegação de conformidade.** A conclusão de que o caráter consultivo
  "afasta a incidência autônoma do art. 20" é do parecer OS-16 (SOURCE), sob as
  condições e limites que o próprio parecer declara (seções VII e VIII). Este
  documento apenas fornece a evidência condicionante; não emite juízo jurídico.
- **Documentado ≠ implementado ≠ verificado.** OBSERVED (atualizado na
  integração da fatia G7, 2026-08-16): a V2 agora TEM uma UI de fatia sintética
  (`apps/web` — grade de leitos, detalhe do paciente, reconhecer alerta) com o
  banner permanente exibindo o rótulo "registro limitado a esta instituição"
  (EC-R1.d; ver `apps/web/src/components/BannerContexto.tsx` e o teste de
  renderização correspondente), e testes de concorrência/atomicidade verdes em
  `packages/persistencia` e `apps/api` (ver §3.3). Isso NÃO fecha HAZ-0046 (a
  reclassificação da mitigação é do fluxo do hazard log — gatilho G-3 abaixo —
  e a UI é de fatia sintética, não produto validado); os testes V1–V8 formais
  do ADR-0009 §9 seguem não executados (TST-DOM-0005); a validação de fatores
  humanos (C3) e o vocabulário pt-BR dos estados (C4) seguem pendentes.
- **Nada aqui fecha gate, bloqueador, risco ou hazard.** HAZ-0046 permanece
  OPEN; G4/G6 permanecem nos estados dos seus próprios artefatos
  (`g6-readiness.md`: NOT READY).
- **Nenhuma aprovação humana é presumida.** EC-R1 é PROPOSAL; a PREMISSA da
  seção 2 é reversível e registrada conforme GDEC-0015/0017.

---

## 6. Como citar este documento

**No RIPD** (exigido pelo parecer OS-16, Q-09, antes do primeiro apply do
índice cross-PJ; e pertinente à descrição do laço clínico): citar como —

> "Caráter consultivo dos escores e alertas: documentado e com plano de
> verificação em `docs/11-security-privacy-compliance/evidencia-carater-consultivo.md`
> (EC-R1; trilha de revisão humana do ADR-0009 W1–W12; mapeamento EC-M1..M10),
> conforme condicionante do parecer OS-16, item III.1 e Q-15."

**No G6** (safety/security design): citar EC-R1 e a tabela EC-M1..M10 como
evidência de desenho da privacidade do laço clínico; registrando que a
verificação (testes V1–V7 em CI; V8 com usuários) é condição a satisfazer — a
citação **não** move o estado do gate.

**Em código e testes da fatia G7**: testes que provem EC-R1.a–EC-R1.c devem
referenciar este documento e o ADR-0009 §9 (V1, V2, V3, V5, V6) nos seus
comentários, para que a trilha exigida por Q-15 ("rastro de que alertas são
consultivos e há revisão humana") seja reconstituível do teste à fonte jurídica.

---

## 7. Gatilhos de revisita deste documento

| # | Gatilho | Fonte do gatilho |
|---|---|---|
| G-1 | Regulamentação ou decisão da ANPD sobre o art. 20 (condição de revisão 1 do parecer, seção VIII) | parecer OS-16 §VIII |
| G-2 | Emenda ou supersessão do ADR-0009 (em especial W4/W6/W7/W8/W12) ou do ADR-0008 N6/N7 | ADR-0009 §8.2 |
| G-3 | Implementação da UI: EC-R1.d deixa de ser "formulado" e passa a exigir verificação (fecha ou reclassifica a mitigação de HAZ-0046 pelo fluxo do hazard log, não por este documento) | hazard-log.md HAZ-0046 |
| G-4 | Ratificação, correção ou rejeição de EC-R1 pelo titular (encerra a PREMISSA da seção 2) | GDEC-0015/0017 |
| G-5 | Qualquer caminho de código que crie transição sem ator humano para estado de conclusão — não-conformidade com EC-R1.a a tratar como regressão de segurança | ADR-0009 W12 |
