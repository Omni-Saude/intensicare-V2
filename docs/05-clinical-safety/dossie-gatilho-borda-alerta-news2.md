---
doc_id: RULE-NEWS2-GATILHO-BORDA-ALERTA
title: >
  Dossiê de ratificação — política de gatilho do alerta de deterioração
  NEWS2 (gatilho de borda + supressão) e premissas de engenharia associadas
  (achados CRIT-1 e CRIT-2)
status: PROPOSAL
label: PROPOSAL
owner: UNASSIGNED — VALIDATION REQUIRED
statement: >
  A spec pinada do alvo (RULE-NEWS2 0.2.0) governa as BANDAS e a semântica
  de EXIBIÇÃO consultiva (§4.2) e a monotonicidade (§4.3), mas é SILANTE
  sobre a política de GATILHO do alerta durável de deterioração (borda vs.
  patamar estático, cooldown, teto de taxa). O kernel implementado disparava
  alerta por PATAMAR ESTÁTICO (`fires` = banda != baixo), consumido
  diretamente pela criação de item de trabalho a cada ingestão — sem
  deduplicação, sem cooldown, sem teto (admissão literal no README da API).
  Este stream implementou o default DOCUMENTADO do repositório irmão
  (gatilho de borda + supressão PT4H/3-per-24h), SEM tocar nenhuma banda,
  escala, mapeamento ACVPU ou gatilho publicado de exibição (NEWS2-C-01;
  §4.3 respeitado — nada afrouxado). A DECISÃO da política de gatilho é
  clínica e permanece pendente de ratificação (RAT-EWS trigger policy);
  nenhum valor aqui é alegado como ratificado.
provenance:
  source_repo: intensicare-V2 (spec pinada + kernel + API); intensicare (irmão — SOMENTE LEITURA, citado como intenção)
  path_or_url: docs/05-clinical-safety/dossie-gatilho-borda-alerta-news2.md
  commit_sha_or_version: d7a49dddc3fc0473ba35860ef3ddecf31d0741ae (base do alvo); irmão lido na árvore de trabalho de 2026-09-19
  section_or_lines: >
    [alvo] rule-releases/news2/specification.md:280-316 (§4.2 exibição
    consultiva; §4.3 monotonicidade — SILANTE sobre gatilho de alerta);
    [alvo] packages/kernel-clinico/src/news2.ts:751 (defeito: fires estático
    consumido como gatilho); [alvo] apps/api/README.md:83-85 (admissão de
    ausência de dedup, agora reescrita);
    [irmão] docs/plan/clinical/domains/early-warning-scores.md:119-125
    (edge-trigger + rearm);
    [irmão] docs/plan/clinical/alert-catalog.md:5172-5299 (entrada
    ALERT-EWS-NEWS2-DETERIORATION-01: trigger.logic, suppression, TV-1..TV-4)
  date_collected: 2026-09-19
  collector: stream ORQ-3 (alerta-borda-supressao) — engenharia de remediação; decisão clínica NÃO tomada por agente
  transformation: >
    implementação ao default documentado do irmão, marcada pendente de
    ratificação; nenhuma banda/escala/gatilho de exibição alterado; valores
    de janela parametrizados como premissas de engenharia reversíveis
  confidence: high
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  requirements: [SAF-0001, SAF-0002]
  hazards: [HAZ-0005]
  adrs: [ADR-0009, ADR-0026, ADR-0027]
  findings: [CRIT-1, CRIT-2]
  prepares: [ORQ-8]
---

# Dossiê — política de gatilho do alerta de deterioração NEWS2 (RAT-EWS trigger policy)

## 1. O que a spec pinada decide — e o que ela NÃO decide

A spec pinada `docs/05-clinical-safety/rule-releases/news2/specification.md`
(RULE-NEWS2 0.2.0) decide:

- **§4.2 — Exibição consultiva**: os quatro tiers são semântica de
  EXIBIÇÃO/informação; nenhuma auto-escalada (PROPOSAL, conteúdo RCP 2017).
  **Intocado por este stream** — `fires` no kernel continua sendo a condição
  de exibição estática de banda (low_medium/medium/high), vetor a vetor.
- **§4.3 — Monotonicidade**: nenhuma configuração pode AFROUXAR os gatilhos
  publicados (vermelho; 5; 7) ou rebandear parâmetro. **Respeitado** — este
  stream não introduz configuração alguma e não altera gatilho publicado.

A spec pinada **NÃO decide** a política de GATILHO do alerta durável de
deterioração (quando um item de trabalho nasce): borda vs. patamar,
cooldown, teto de taxa. Essa política existe documentada no repositório
IRMÃO (intenção, somente leitura):

> `edge_trigger := ( news2_score >= 7 AND news2_score_prev < 7 ) OR (
> any_single_parameter_score == 3 AND that_parameter_was_not_red_at_prev_
> measurement )` … "Edge-triggered on the transition, NOT on persistent
> high state." — `[irmão] alert-catalog.md:5181-5187`
>
> `suppression: dedup_key: patient_id+alert_id · cooldown: PT4H ·
> rate_limit: 3/24h/patient · maintenance_window_aware: true` … "re-arms
> only after the score drops below 7 and no red parameter persists." —
> `[irmão] alert-catalog.md:5243-5249`

## 2. O que foi implementado (ao default documentado do irmão)

1. **Kernel puro (`alertCrossing`)**: `evaluateNews2` ganhou insumo opcional
   `priorState` (`news2_prev` + vermelhos anteriores) e o registro passou a
   carregar o veredito de borda (`alertCrossing`, `alertCrossingReason`,
   `alertCrossingInputs`). `fires` (exibição, §4.2) permanece intacto.
   Coberto por 11 vetores novos (CRV-NEWS2-0201..0211 — inclui TV-1..TV-4
   do irmão) no test pack executável do bundle; corpus 93 → 104.
2. **Primitiva de supressão (`@intensicare/dominio`)**:
   `deveriaEmitirAlerta(chave, agoraMs, estado, política, janelaManutencao)`
   — pura, tempo injetado, motivos explícitos (`cooldown`, `taxa_24h`,
   `janela_de_manutencao`). Nenhum número mágico na lógica.
3. **Fiação na API (`apps/api/src/db.ts`)**: o last-emit é lido
   EM-TRANSAÇÃO dos itens de trabalho já existentes do encontro; acima do
   patar com supressão ativa, a ingestão segue avaliada/auditada e o motivo
   da supressão é gravado no livro de auditoria (`command:
   "alerta-suprimido"`). A criação de item de trabalho passa a exigir
   cruzamento (requerAlerta → `alertCrossing`) E veredito `emitir`.
4. **README da API**: a admissão "sem deduplicação nesta fatia" foi
   substituída pela descrição do comportamento novo (verdade documental).

## 3. Tabela de premissas de engenharia (reversíveis — pendentes de ratificação RAT-EWS)

| # | Premissa | Valor implementado | Âncora | Reversibilidade/efeito da mudança |
|---|---|---|---|---|
| P1 | Cooldown entre emissões | PT4H | irmão `alert-catalog.md:5245` | Constante `PREMISSA_COOLDOWN_NEWS2_MS`; mudar value = mudar constante, zero lógica |
| P2 | Teto de taxa por 24 h rolantes | 3 emissões/paciente | irmão `alert-catalog.md:5246` | Constante `PREMISSA_TAXA_MAXIMA_NEWS2_24H` |
| P3 | Consciência de janela de manutenção | `true` (o mecanismo é parametrizado; o V2 não tem janelas de manutenção — nenhuma ativa) | irmão `alert-catalog.md:5247`; prompt ORQ-3 (críticos atravessam) | Flag `conscienteJanelaManutencao`; alertas de segurança-crítica passam `false` |
| P4 | Estado anterior DESCONHECIDO ARMA o gatilho | primeira medição ≥7 (ou com vermelho) emite | silêncio dos dois docs; direção alert-permissiva para a primeira piora observada | Vetor CRV-NEWS2-0204 documenta; ratificar ou trocar por "primeira medição não emite" |
| P5 | Vermelhos anteriores DESCONHECIDOS ⇒ qualquer vermelho atual é novo | idem, alert-permissivo | silêncio dos dois docs | Anotado no kernel; ratificar |
| P6 | Substrato de dedup por ENCONTRO (não por paciente) | leitura em-transação de itens do encontro | limitação de `packages/persistencia` (consulta por paciente inexistente; stream sem escrita lá) | Transferências entre encontros podem re-emitir; exigiria nova consulta + migração |
| P7 | Banda média (5–6) NÃO cria alerta de deterioração | rota da TENDÊNCIA (ALERT-EWS-TREND-RISING-02), que NÃO EXISTE ainda no V2 | irmão TV-2 + early-warning-scores.md:123-125 | Enquanto a tendência não existe, média fica só em EXIBIÇÃO — GAP DOCUMENTADO, não silenciado |
| P8 | Corrida de ingestões concorrentes (READ COMMITTED) pode emitir em duplicidade numa janela estreita | documentado como residual no README da API | limitação de isolamento; teto P2 limita o dano | Serialização estrita exigiria `SELECT FOR UPDATE` (persistencia) |

## 4. O que este stream NÃO alterou (NEWS2-C-01)

- Nenhuma banda de parâmetro, tabela da Escala 2, mapeamento ACVPU ou
  gatilho publicado de exibição (§4.2/§4.3).
- Nenhum gatilho de SOFA/GCS; nenhum contrato público de API (a superfície
  nova é interna: campos opcionais em insumos/registros do kernel e da API).
- Nenhum gate (`scripts/check_*`), nenhum timeout, nenhuma asserção
  enfraquecida; corpus de vetores só CRESCER (93 → 104).
- O repositório irmão não foi escrito (SOMENTE LEITURA).

## 5. Evidência de execução red→green

- RED: os 11 vetores de cruzamento falham contra o kernel base
  (`alertCrossing` inexistente) — capturado em 2026-09-19 no worktree
  `orq3/alerta-borda-supressao`.
- GREEN: corpus completo 104/104 + suíte do kernel (316 testes) verde;
  suíte do domínio (29 testes, 13 novos da primitiva) verde; suíte da API
  com tempestade (5 ingestões ⇒ 1 item + 4 supressões auditadas), rearme
  (queda + recruzamento após PT4H com tempo injetado) e TV-2 (média não
  emite) verdes.
- Mutação: baseline do `main` quebrado ANTES deste stream (evidência
  pristine-main no PR do ORQ-4, achados F1/F2); delta deste stream
  registrado no PR.
