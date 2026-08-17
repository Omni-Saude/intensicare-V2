---
doc_id: OPS-13-RUNBOOK-DEGRADACAO-DOWNTIME
status: PROPOSAL
owner: AUTH-OPERATIONS (detida por rodaquino-OMNI, DEC-G0-06) + AUTH-CLINSAFETY para o procedimento clínico — ratificação VALIDATION REQUIRED
source: >
  INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §15.3 ("Provide downtime procedures, visible UI
  degraded states, manual fallback, recovery, replay, and post-recovery reconciliation"),
  §11 (estados visivelmente distintos; guia de modo degradado visível), §20;
  docs/06-architecture/adrs/ADR-0020-observabilidade-slos-backup-dr.md O5;
  docs/03-domain/invariants/DOM-invariants.md DOM-0004 e DOM-0007;
  ADR-0008 §8.3; ADR-0010 (B4 replay); ADR-0011 (P8 reconciliação por polling);
  packages/observabilidade/src/degradation.ts (catálogo dos sete modos)
date_collected: 2026-08-16
collector: agente de prontidão operacional (ciclo 6, sprint SPR-G8-1)
last_updated: 2026-08-16
---

# Runbook de degradação e procedimento de downtime

> **PROPOSAL sem validação clínica.** SOURCE (prompt §11): o desenho de trabalho deve ser
> validado com médicos, enfermeiros, coordenadores e usuários de tecnologia assistiva, em
> cenários simulados de tempo crítico. **Isso não ocorreu.** O procedimento de downtime
> abaixo é uma proposta de engenharia; ele não é o protocolo institucional da unidade e não
> substitui julgamento clínico em nenhuma hipótese.

## 1. A regra que não se negocia

SOURCE (DOM-0007): falha de componente, indisponibilidade/obsolescência de dado,
incapacidade de avaliar regra, interrupção de fluxo e degradação de UI/conectividade **devem
cada uma ser representadas como estado explícito e visível no seu nível** — nunca rebaixadas
silenciosamente a um estado aparentemente normal.

Como isso está imposto em código (não apenas escrito):

- entrar em modo degradado devolve um `DegradedNotice` e o marca como **NÃO EXIBIDO**;
- a degradação só conta como exibida depois que alguém chama `markSurfaced(id, canal)` —
  isto é, depois que o contrato de API, a UI ou o console operacional efetivamente a
  transportou;
- enquanto houver degradação ativa não exibida, `evaluateReadiness` devolve `not_ready`;
- o contador `intensicare.ops.degradation.unsurfaced` diferente de zero é **defeito de
  segurança clínica**, não ruído operacional.

**Lacuna real e grave:** hoje **nada chama `markSurfaced`**, porque o `DegradedNotice` não
é transportado pelo contrato de API nem renderizado por `apps/web` (P-OPS-02). Ou seja: a
maquinaria que torna a degradação visível existe e é testada, e a superfície que a
mostraria ao clínico não. Enquanto isso durar, toda degradação é, na prática, silenciosa.

## 2. Os sete modos degradados catalogados

Fonte normativa em código: `packages/observabilidade/src/degradation.ts`. Cada modo carrega
os quatro campos exigidos pelo ADR-0020 O5 — condição de entrada, comportamento seguro,
fallback manual e condição de saída — e o teste `kill-switch.test.ts` falha se algum vier
vazio.

| Modo | Domínio | Entrada | Comportamento seguro | Fallback manual | Saída (com reconciliação) |
|---|---|---|---|---|---|
| `regra_clinica_desligada` | regra | Kill switch acionado ou falha de carga do bundle | Avaliações resolvem para **não avaliado / regra indisponível**; nunca escore antigo, nunca silêncio | Avaliação à beira do leito pelo protocolo institucional | Bundle reativado ou rollback concluído + reavaliação do período |
| `projecao_atrasada` | projeção | Lag acima do limite declarado | A projeção informa o instante do último fato incorporado | Consulta direta ao caminho de leitura autoritativo | Lag no limite **e** reconciliação por polling concluída (ADR-0011 P8) |
| `outbox_acumulando` | evento | Profundidade crescendo sem publicação | Fato e item de trabalho seguem duráveis na mesma transação; a **entrega** é declarada atrasada | Comunicação clínica pelo canal institucional de contingência | Publicação retomada, backlog drenado, replay sem lacuna de sequência |
| `entrega_tempo_real_indisponivel` | entrega | Canal autorizado caído/desconectado | UI em estado explícito "reconectando"/"reproduzindo"; nada apresentado como ao vivo | Recarregar consulta autoritativa; escalonamento institucional | Canal restabelecido, cursor retomado, polling sem divergência |
| `insumo_sem_frescor` | frescor | Insumo fora da janela aplicável | Avaliação vira `desatualizado`/`não avaliado` com razão | Nova aferição à beira do leito | Insumo novo dentro da janela + reavaliação registrada |
| `dependencia_indisponivel` | dependência | Banco, identidade ou chave inacessível | **Fail-closed**: operação recusada com estado explícito | Procedimento de downtime (§4) | Dependência restabelecida + prontidão reavaliada |
| `telemetria_indisponivel` | telemetria | Coletor/emissor caído ou descartando | O laço clínico **segue funcionando**; a perda de observabilidade é ela própria declarada | Acompanhamento operacional manual | Emissão restabelecida; lacuna de série declarada no registro |

> A janela de frescor de `insumo_sem_frescor` é **VALIDATION REQUIRED** (ADR-0008 N5). O
> modo existe; o número que o dispara, não. Isso está declarado, não escondido.

## 3. Procedimento por modo — o que o operador faz

Para todo modo, na ordem:

1. **Confirmar a entrada explícita.** O modo tem de estar registrado; degradação percebida
   e não registrada é o pior estado possível.
2. **Confirmar a exibição.** Verificar que o aviso chegou a um canal
   (`markSurfaced`). Enquanto P-OPS-02 estiver aberta, **este passo tem de ser feito por
   comunicação humana à unidade** — a UI não o fará.
3. **Aplicar o fallback manual** da linha correspondente na tabela do §2, comunicando-o à
   equipe assistencial em linguagem clínica.
4. **Não tentar compensar automaticamente.** É proibido preencher lacuna com o último valor
   conhecido, com média, com zero ou com "normal" (DOM-0004; §3 regra 7 do prompt).
5. **Sair somente pela condição de saída catalogada**, e executar a reconciliação
   pós-recuperação — declarando explicitamente quando ela **não** pôde ser executada
   (hoje: sempre, porque replay e polling de reconciliação não existem em código).

## 4. Procedimento de downtime clínico (PROPOSAL — não validado)

Aplicável quando o sistema está indisponível ou em `dependencia_indisponivel`.

### 4.1 Antes (preparação)

- A unidade precisa ter um caminho de vigilância que **não dependa do IntensiCare V2**.
  SOURCE (§1 do prompt): o sistema é copiloto; ele nunca é a única barreira.
- O material de contingência (formulário/rotina de aferição e escalonamento) é do protocolo
  institucional — **este repositório não o define e não deve fingir defini-lo**.

### 4.2 Durante

1. Comunicar à unidade: **o que parou**, **o que continua confiável** e **o que o sistema
   deixou de afirmar**.
2. Enfatizar a assimetria: ausência de alerta durante downtime **não é ausência de risco**.
3. Registrar manualmente as ações clínicas conforme o protocolo institucional.
4. Não usar telas em cache como se fossem correntes. SOURCE (§11): "privacy-aware cache
   clearing" e estados visivelmente distintos existem exatamente por isso.

### 4.3 Depois (recuperação e reconciliação)

1. Restabelecer o serviço e reavaliar **prontidão** (não liveness).
2. Executar replay do backbone e reconciliação das projeções — **e, enquanto não
   existirem, declarar por escrito que o período de downtime não foi reconciliado**.
3. Reavaliar os pacientes do período com dado fresco: o sistema **não** deve inferir
   retroativamente estado clínico do intervalo sem insumo.
4. Registrar a lacuna de série na telemetria (o período em que não houve medição).
5. Sonda sintética manual com desfecho `passed` antes de declarar normalidade.

## 5. Estados de UI que precisam existir (§11) — e o que existe

SOURCE (prompt §11): estados visivelmente distintos para carregando, vazio, indisponível,
proibido, timeout, tentando de novo, parcialmente carregado; fresco, envelhecendo, obsoleto,
expirado, ausente, inválido, conflitante, corrigido, superado; avaliação válida, parcial,
não avaliada, obsoleta, inválida; não atribuído … reaberto; online, degradado, offline,
reconectando, reproduzindo, reconciliado; sessão expirando/expirada/recuperada.

| Eixo | Estado no repositório |
|---|---|
| Estados de avaliação (5, ADR-0008) | Existem no domínio e no contrato; **renderização completa não verificada** |
| Estados de item de trabalho (8, ADR-0009) | Existem no domínio (`WORK_ITEM_STATES`) e são a fonte do vocabulário de telemetria |
| Estados de conectividade/degradação | **`DegradedNotice` não trafega no contrato nem é renderizado** (P-OPS-02) |
| Estados de carregamento/erro em `apps/web` | Parcial — há pendência registrada em `biome.jsonc` sobre `.then` sem `.catch` em dois componentes, que hoje deixa a tela presa em "carregando" numa falha de rede |

INFERENCE: o item da última linha é literalmente um modo degradado **invisível** já
existente no frontend. Ele é pequeno e é exatamente a classe de defeito que o DOM-0007
proíbe.

## 6. O que este runbook NÃO autoriza

- Não autoriza suprimir alerta clínico para "reduzir ruído" durante incidente. Supressão é
  ato explícito, com razão codificada, escopo e expiração (ADR-0009 W7), e um item suprimido
  **continua existindo e visível**.
- Não autoriza desligar a exibição de estados degradados para "não assustar" a equipe.
- Não autoriza tratar `não avaliado` como `sem risco` em nenhum relatório, painel ou
  conversa.
- Não fecha o Gate G8 nem substitui o exercício de modo degradado exigido por ele
  ("degraded-mode exercises" — que exige ambiente e pessoas, e não ocorreu).
