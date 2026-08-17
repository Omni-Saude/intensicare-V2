---
doc_id: OPS-13-RUNBOOK-INCIDENTE
status: PROPOSAL
owner: AUTH-OPERATIONS (detida por rodaquino-OMNI, DEC-G0-06) — ratificação VALIDATION REQUIRED
source: >
  INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §15.3 (procedimentos de downtime, degradação
  visível, fallback manual, recuperação, replay e reconciliação), Gate G8 ("incident and
  downtime runbooks", "kill switches, and rollback authority"), §20 (condições de parada);
  docs/06-architecture/adrs/ADR-0020-observabilidade-slos-backup-dr.md O4/O5/O7/O8;
  ADR-0007 §4.5 (kill switch e rollback como primitivas distintas);
  ADR-0008 §8.3 (release morto → not_evaluated com razão rule_unavailable);
  docs/03-domain/invariants/DOM-invariants.md (DOM-0004, DOM-0007);
  packages/observabilidade/src/kill-switch.ts, degradation.ts, readiness.ts
date_collected: 2026-08-16
collector: agente de prontidão operacional (ciclo 6, sprint SPR-G8-1)
last_updated: 2026-08-16
---

# Runbook de incidente

> **PROPOSAL não ensaiado.** Nenhum incidente real ou simulado foi conduzido com este
> runbook. SOURCE (Gate G8): a promoção exige "trained support/operations users, incident
> and downtime runbooks" — **usuários treinados** é um requisito humano que este documento
> não satisfaz por existir. Um runbook não lido em plantão é papel.

## 1. Escopo e limites

**Cobre:** incidentes que afetam o laço clínico do IntensiCare V2 (ingestão → avaliação →
alerta durável → visibilidade → reconhecimento) e seus mecanismos de suporte.

**Não cobre:** incidentes da plataforma AMH (fora da fronteira — ADR-0001), incidentes
clínicos do paciente (matéria do protocolo institucional), nem incidentes de privacidade
com dado real — **nenhum dado real foi acessado por este sistema até esta data**, e um
incidente de PHI real exigiria acionar o processo institucional de privacidade, não este
runbook.

## 2. Princípio que ordena tudo abaixo

SOURCE (§20; DOM-0007): **é sempre preferível falhar visivelmente a funcionar de forma
plausível e errada.** Toda decisão deste runbook, em caso de dúvida, escolhe o caminho que
torna a limitação visível ao clínico — mesmo quando isso significa exibir "não avaliado"
em vez de um número.

Corolário prático: **`não avaliado` não é sinônimo de `sem risco`.** Um incidente que
resolve avaliações para `não avaliado` não reduziu o risco do paciente; ele apenas parou de
afirmar coisas sobre ele.

## 3. Classificação de severidade (proposta)

Sem metas validadas (G1), a severidade é definida por **efeito clínico**, não por número.

| Sev | Definição por efeito | Exemplos |
|---|---|---|
| **S1** | O sistema pode ter apresentado informação clínica **errada como se fosse correta** | Regra clínica com defeito produzindo escore válido; dado de um paciente exibido sob outro; alerta exibido como reconhecido sem ter sido |
| **S2** | O laço de segurança está quebrado **em silêncio** (sem estado degradado visível) | Publicador parado sem sinal; projeção congelada exibida como corrente; sonda sintética reprovando sem ninguém notificado |
| **S3** | O laço está degradado, **e a degradação está visível** ao clínico | Regra desligada por kill switch com aviso na tela; canal de tempo real caído com estado "reconectando" |
| **S4** | Impacto operacional sem efeito clínico | Perda de telemetria; lentidão de painel administrativo |

**Regra de escalada:** na dúvida entre S1 e S2, é S1. Na dúvida entre S2 e S3, é S2 — a
diferença entre S2 e S3 é exatamente "o clínico consegue ver?", e presumir que sim é o erro
mais caro.

## 4. Papéis

| Papel | Responsabilidade | Estado |
|---|---|---|
| Comandante do incidente | Conduz, decide, registra | **UNASSIGNED — VALIDATION REQUIRED** |
| Autoridade de kill switch / rollback | Autoriza desligar regra clínica | `AUTH-CLINSAFETY` (detida por rodaquino-OMNI) — SOURCE: ADR-0007/ADR-0008 |
| Autoridade operacional | Autoriza rollback de código/schema e ações de infraestrutura | `AUTH-OPERATIONS` (detida por rodaquino-OMNI, DEC-G0-06) |
| Comunicação clínica | Informa a unidade assistencial | **UNASSIGNED — VALIDATION REQUIRED** |

> Nenhum nome de pessoa foi inventado. Enquanto os papéis estiverem `UNASSIGNED`, **não
> existe plantão**: o runbook descreve o que fazer, não quem acorda às 3h.

## 5. Fluxo do incidente

### 5.1 Detectar

Fontes de detecção, em ordem de confiabilidade **desejada** (e o estado real de cada uma):

| Fonte | Estado real |
|---|---|
| Sonda sintética ponta a ponta reprovando (`intensicare.probe.run.total`, `outcome=failed`) | implementada; **sem agendador real** — ninguém a executa periodicamente |
| Veredito de prontidão `not_ready`/`degraded` (`reportReadiness`) | implementado; **não ligado a endpoint** |
| Contador de degradação **não exibida** ≠ 0 | implementado; não conectado |
| Relato humano da unidade assistencial | **é hoje a única fonte que de fato funcionaria** |

INFERENCE: com as três primeiras desligadas, a detecção real depende de alguém no leito
perceber. Isso é o oposto do que o §15.3 pede e é a razão de P-OPS-01/03/07 existirem.

### 5.2 Estabilizar (ordem obrigatória)

1. **Tornar o estado visível antes de qualquer conserto.** Entrar explicitamente no modo
   degradado correspondente (`DegradationRegistry.enter`) e confirmar que ele foi exibido
   em ao menos um canal (`markSurfaced`). Enquanto `unsurfaced()` não estiver vazio, a
   prontidão é `not_ready` por construção — **o sistema recusa-se a se declarar pronto
   enquanto esconde o próprio estado**.
2. **Parar de afirmar, não parar de funcionar.** Se a suspeita recai sobre a regra clínica,
   aciona-se o **kill switch** (§6), que resolve as avaliações para `não avaliado` com
   razão `rule_unavailable` — o sistema continua no ar, apenas deixa de afirmar escore.
3. **Preservar evidência.** A auditoria é append-only por trigger
   (`packages/persistencia`); nada deve ser apagado. Exportação de evidência com
   verificação de integridade: ver `backup-restore-e-rollback.md` §6.
4. **Comunicar à unidade** o que o sistema deixou de fazer, em linguagem clínica, com o
   fallback manual do modo degradado correspondente
   (`runbook-degradacao-e-downtime.md` §3).

### 5.3 Corrigir

- Correção de **regra clínica**: nunca "hotfix no lugar". SOURCE (ADR-0007 eixo 5): rollback
  aponta para uma versão **previamente aprovada**; se nem a anterior é confiável, usa-se o
  kill switch (sem substituição). As duas são primitivas distintas, e colapsá-las é
  proibido.
- Correção de **código/schema**: ver `backup-restore-e-rollback.md` §5.
- Correção de **dado**: correção é registro novo com proveniência, jamais edição destrutiva
  (ADR-0005). Um incidente não autoriza reescrever histórico.

### 5.4 Recuperar

1. Sair do modo degradado somente quando a **condição de saída** catalogada for satisfeita
   (cada modo tem a sua, em `packages/observabilidade/src/degradation.ts`).
2. Executar a **reconciliação pós-recuperação**: replay do backbone (ADR-0010 B4) e
   reconciliação por polling das projeções (ADR-0011 P8).
   **Estado real: nenhum dos dois existe em código.** Enquanto não existirem, a saída de
   um modo degradado é uma afirmação sem verificação — e deve ser tratada como tal.
3. Reavaliar prontidão e registrar o veredito.
4. Executar a sonda sintética manualmente e exigir `passed` antes de declarar recuperação.

### 5.5 Pós-incidente

Registro mínimo (proposto), sem PHI:

- linha do tempo com instantes de detecção, mitigação e recuperação;
- classificação de severidade e por quê;
- se houve avaliação clínica afetada: **quantas e em que estado ficaram** (contagem, nunca
  identificação de paciente no relatório operacional);
- se a degradação esteve invisível em algum intervalo — e por quanto tempo (é o dado mais
  importante do relatório);
- itens de correção com dono nomeado;
- se um perigo novo apareceu: **registrar no hazard log para arbitragem humana**. Este
  runbook não fecha perigo, risco, ADR nem gate.

## 6. Decisão de kill switch de regra clínica

SOURCE (ADR-0007 §4.5 Opção A; ADR-0008 §8.3).

```text
Suspeita de defeito na REGRA (não no dado, não na entrega)?
  ├─ Existe versão anterior aprovada e confiável?
  │     ├─ Sim  → ROLLBACK para essa versão (autoridade: AUTH-CLINSAFETY)
  │     └─ Não  → KILL SWITCH (desligar sem substituição)
  └─ Não → não é caso de kill switch; ver runbook-degradacao-e-downtime.md
```

Efeito garantido em código (testado em `kill-switch.test.ts`):

- a função de avaliação **não é executada** (verificado: contador de chamadas = 0);
- o retorno é `{ kind: "not_evaluated", reason: "rule_unavailable", notice }` — não existe
  caminho que devolva `null` ou silêncio;
- a razão é **codificada** (`defeito_de_regra_suspeito`, `evidencia_clinica_retirada`,
  `falha_de_verificacao_de_assinatura`, `ordem_do_titular_clinico`,
  `incidente_de_seguranca`, `ensaio_operacional`), nunca texto livre;
- o ator é registrado **pseudonimizado** (`op_` + 16 hex);
- a avaliação não realizada **entra na série** como `status=not_evaluated` — ela não some
  das métricas, senão a prevalência do §15.3 b5 mentiria por construção;
- o processo continua no ar.

**Limite crítico:** SOURCE (ADR-0007 H3/D3) — o kill switch aqui age **somente no processo
corrente**. Não há propagação multi-instância, nem medição de tempo de atuação. Em uma
implantação com várias instâncias, acionar o kill switch em uma delas deixaria as demais
avaliando. **Isto é bloqueador de G8** e está registrado como P-OPS-05.

## 7. Anti-atalhos (§20) — proibições explícitas neste runbook

Durante um incidente, é proibido:

- ocultar "desconhecido", "não avaliado", degradação, falha parcial ou incerteza de entrega;
- coagir dado ausente/obsoleto/inválido a zero, normal ou "sem risco" para "destravar" a tela;
- desligar a sonda sintética porque ela está "fazendo barulho" — sonda reprovando é o sinal,
  não o ruído;
- usar `GET /v1/healthz` (que executa `select 1`) como prova de que o sistema está apto:
  isso é liveness, não capacidade segura;
- declarar o incidente encerrado sem reconciliação pós-recuperação (e, enquanto ela não
  existir, sem declarar explicitamente que ela **não** foi feita);
- aceitar relatório gerado por modelo como evidência de encerramento.

## 8. O que falta para este runbook virar prontidão

| # | Falta | Depende de |
|---|---|---|
| 1 | Papéis nomeados e escala de plantão | ato humano |
| 2 | Treinamento e simulado com quem está de plantão | ato humano (Gate G8) |
| 3 | Detecção automática ligada (sonda agendada, readiness, degradação não exibida) | P-OPS-01/03/07 |
| 4 | Replay e reconciliação pós-recuperação em código | P-OPS-04 |
| 5 | Kill switch multi-instância medido | P-OPS-05, ADR-0019 |
| 6 | Canal de comunicação clínica acordado com a unidade | ato humano |
