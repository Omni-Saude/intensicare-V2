---
id: ADR-0020
title: Observabilidade OpenTelemetry-compatível, SLOs medidos, modos degradados explícitos e backup/restore/DR ensaiados
status: PROPOSAL   # regra de CI (agente não grava DECIDED/accepted no front matter); status do ADR no corpo: accepted (direção GDEC-0016; minuta materializada em construção — GDEC-0015)
date: 2026-08-16
last_updated: 2026-08-16
owner: rodaquino-OMNI (titular decisor da direção — GDEC-0016); redator - agente de minutas de ADR (ciclo 6); o redator não é aprovador
approvers:
  - AUTH-OPERATIONS (detida por rodaquino-OMNI, DEC-G0-06)
source: >
  INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §15.3 (operabilidade, SLOs, degradação, backup/
  restore/DR), Gate G8, §20; docs/06-architecture/adrs/adr-index.md (linha ADR-0020;
  dependências 0006/0019 e metas G1; Gate G8); GDEC-0016 (aceite de direção, 2026-08-16);
  ADR-0006 (aceito, Opção A — reconciliação entre lanes), ADR-0010 (aceito, B1-B10),
  ADR-0011 (aceito, P1-P10); DOM-0007 (degradação explícita)
provenance:
  source_repo: intensicare-V2
  path_or_url: docs/06-architecture/adrs/ADR-0020-observabilidade-slos-backup-dr.md
  commit_sha_or_version: 33c749a (branch cycle-6/construcao-g7, base da redação)
  section_or_lines: prompt §15.3, Gate G8; adr-index.md §3, §4.1, §5
  date_collected: 2026-08-16
  collector: agente de minutas de ADR (ciclo 6)
  transformation: reasoned-from — materialização em minuta de direção já aceita pelo titular (GDEC-0016); a decisão não é reaberta
  confidence: medium
  validation_status: VALIDATION REQUIRED (conferência do titular sobre a materialização; metas numéricas permanecem VALIDATION REQUIRED até G1)
links:
  adrs:
    depends_on: [ADR-0006, ADR-0010, ADR-0011, ADR-0019]
    feeds: []
  gates: [G8]
supersedes: null
superseded_by: null
---

# ADR-0020 — Observabilidade, SLOs, modos degradados e backup/restore/DR

> **Status: accepted (direção GDEC-0016; minuta materializada em construção — GDEC-0015).**
> A direção foi aceita pelo titular em 2026-08-16 (GDEC-0016); esta minuta a documenta e
> detalha sem reabri-la. Aceito ≠ implementado ≠ verificado: o Gate G8 exige ensaios
> **executados e medidos**, não este texto. **Nenhuma meta numérica é inventada aqui** —
> metas são VALIDATION REQUIRED até existirem necessidades validadas (G1).

## 1. Contexto e formulação do problema

SOURCE (prompt §15.3): SLOs e orçamentos de erro derivam de necessidades validadas de
usuário/segurança e cobrem, no mínimo: latência e perda fonte→aceito, aceito→avaliação,
avaliação→item de trabalho durável, gerado→visível e gerado→reconhecido; prevalência de
obsoleto/ausente/inválido/conflito; lag de fila, backlog de replay, lag de projeção e
divergência de reconciliação; saúde de rule bundle; disponibilidade de conector e drift
de contrato; negativas de política cross-tenant; sucesso de backup, integridade de
restore, RPO/RTO e integridade de exportação de evidência. SOURCE (§15.3): *readiness*
representa capacidade segura, não apenas processo vivo; degradação é exposta sem vazar
PHI. SOURCE (Gate G8): backup restore, RTO/RPO medidos e exercícios de modo degradado
são condição de promoção a piloto/produção.

INFERENCE (de ADR-0010/0011/0006 aceitos): o backbone (outbox, DLQ visível B6), as
projeções (lag, reconciliação por polling P8) e a reconciliação entre lanes (ADR-0006)
já definem **o que** precisa ser medido; falta decidir **como** a telemetria é emitida,
como SLOs são medidos e como backup/restore/DR viram evidência ensaiada.

**Pergunta.** Que arquitetura de telemetria, que conjunto de SLOs medidos, que modelo de
modos degradados e que política de backup/restore/DR a V2 adota, de modo que o Gate G8
tenha evidência executável?

**Fora de escopo:** plataforma de implantação, residência e seleção de backend de
telemetria (ADR-0019); metas numéricas (G1); procedimento clínico de downtime (tópico
candidato próprio no adr-index §6).

## 2. Drivers de decisão

| # | Driver | Por que importa aqui |
|---|---|---|
| D1 | ADR-0019 (plataforma) tem direção aceita mas não materializada | A instrumentação não pode acoplar-se a backend/vendor antes da plataforma |
| D2 | Metas dependem de G1 (§15.3) | Medir desde já; fixar alvo depois — nunca inventar número |
| D3 | Degradação explícita é invariante (DOM-0007; §20) | Ocultar "unknown"/parcial/degradado é atalho proibido |
| D4 | PHI fora da telemetria (§13/§15.3) | Logs/traces/métricas são superfície clássica de vazamento |
| D5 | G8 exige ensaio, não documento | Backup sem restore ensaiado é ficção operacional |
| D6 | Custo operacional de observabilidade | Instrumentação portável evita retrabalho pós-ADR-0019 |

## 3. Alternativas consideradas

### Opção A — Instrumentação OpenTelemetry-compatível + SLOs medidos com metas adiadas a G1 + degradação explícita + backup/restore/DR ensaiados (DIREÇÃO ACEITA — GDEC-0016)

- **Positivas:** portável entre backends (não antecipa ADR-0019); semântica única de
  traces/métricas/logs com correlação/causalidade já exigidas pelo contrato; SLOs nascem
  como medições reais e recebem metas quando G1 as validar; DR vira evidência de G8.
- **Negativas:** camada de compatibilidade OTel tem custo próprio de aprendizado e
  configuração; medições sem meta podem gerar falsa sensação de controle até G1; ensaios
  de restore/DR consomem tempo de engenharia recorrente.

### Opção B — Pilha proprietária de vendor de observabilidade escolhida agora

- **Positivas:** experiência integrada imediata, dashboards prontos.
- **Negativas:** antecipa e restringe o ADR-0019 (plataforma/residência) sem drivers
  medidos — violaria a disciplina do §3 regra 14; lock-in de formato de telemetria;
  custos contratuais precoces. **Rejeitada.**

### Opção C — Logging simples ad hoc até o piloto

- **Positivas:** custo inicial mínimo.
- **Negativas:** sem lag de projeção/fila/replay medidos, as cláusulas já aceitas
  B6/P5/P8 ficam inverificáveis; G8 se tornaria um mutirão tardio; SLOs sem série
  histórica não têm baseline. **Rejeitada.**

### Opção Z — Adiar

- **Custo do adiamento:** a fatia G7 já produz eventos/projeções cuja saúde precisa ser
  visível; instrumentar depois custa retrofit em todo módulo. **Rejeitada pela aceitação
  da direção (GDEC-0016).**

## 4. Decisão e escopo

> **DIREÇÃO ACEITA (GDEC-0016, 2026-08-16; decided_by: rodaquino-OMNI, titular —
> AUTH-OPERATIONS).** Opção A, materializada na minuta normativa O1–O10 (GDEC-0015).
> Detalhamentos além da direção estão marcados como PREMISSA reversível.

**O1 — Telemetria OpenTelemetry-compatível.** Traces, métricas e logs estruturados são
emitidos pela API OpenTelemetry (semântica OTel: trace/span, IDs de correlação e
causalidade propagados desde o contrato ADR-0012 e o envelope interno ADR-0010 B8).
Nenhum backend/coletor é selecionado aqui (matéria do ADR-0019). PREMISSA (reversível,
GDEC-0015/0017): em dev/teste, exportadores em memória/console; nenhum agente/coletor
externo na construção.

**O2 — SLOs medidos, metas adiadas.** As medições do §15.3 são implementadas como
métricas nomeadas desde a fatia G7 — no mínimo: latências fonte→aceito, aceito→avaliação,
avaliação→item durável, gerado→visível, gerado→reconhecido; perda por etapa; prevalência
de obsoleto/ausente/inválido/conflito; lag de fila/outbox, backlog de replay, lag de
projeção, divergência de reconciliação (ADR-0006); saúde de rule bundle (versão
carregada, falha de carga); disponibilidade de conector e drift de contrato; negativas
cross-tenant e acesso suspeito; sucesso de backup, integridade de restore, RPO/RTO,
integridade de exportação de evidência. **Toda meta numérica é VALIDATION REQUIRED até
G1**; orçamentos de erro só existem depois das metas.

**O3 — Nenhum PHI na telemetria.** Logs/traces/métricas carregam apenas identificadores
opacos (IDs internos), nunca payload clínico, nome, documento ou identificador de
paciente (§13; §3 regra 12). O CI de conteúdo proibido cobre fixtures e docs; testes
cobrem os emissores.

**O4 — Readiness = capacidade segura.** Sondas de prontidão verificam capacidade segura
— bundle de regras carregado e íntegro (ADR-0007), dependências obrigatórias, frescor de
projeção, identidade/chaves obrigatórias (fail-closed, §15.2) — e não apenas liveness de
processo.

**O5 — Modos degradados explícitos.** Degradação de dependência, regra, frescor, evento,
projeção e entrega é exposta como estado nomeado (DOM-0007), propagada ao contrato e à
UI (estados obrigatórios do §11; coerente com P6/P10 do ADR-0011): jamais ocultar
"unknown", parcial ou atraso (§20). Cada modo degradado tem: condição de entrada,
comportamento seguro, fallback manual e condição de saída com reconciliação
pós-recuperação (replay ADR-0010 B4; polling P8).

**O6 — Backup e restore ensaiados.** Backups automatizados de todo estado durável
(fatos, outbox, auditoria, projeções reconstruíveis podem ser excluídas por serem
deriváveis — P1); **integridade de restore verificada por ensaio periódico** com dados
sintéticos, medindo RPO/RTO reais. Restore que nunca foi ensaiado não conta como backup
para G8.

**O7 — DR como exercício, não documento.** Estratégia de DR documentada e exercitada
(game day) com: cenários de perda parcial/total, ordem de recuperação, reconciliação
pós-recuperação entre lanes (ADR-0006) e replay do backbone; resultados registrados como
evidência de G8.

**O8 — Observabilidade do backbone e das projeções.** DLQ/quarentena visíveis (B6),
crash-points monitorados (B5), lag e rebuild de projeção (P1/P5), shed honesto (P5) —
tudo com métrica e alerta operacional (alerta de operação ≠ alerta clínico; nomenclatura
distinta obrigatória).

**O9 — Exportação de evidência íntegra.** O bundle de evidência de release (§15.2 item 8)
e a exportação de auditoria têm verificação de integridade medida (checksum/atestado),
reportada como métrica O2.

**O10 — Vigilância de desempenho de alerta.** Métricas de carga de alerta (alertas por
paciente-dia, taxa de reconhecimento, tempo-até-ação) são coletadas como série
operacional desde o piloto — **sem meta clínica inventada**; a interpretação clínica é
matéria de G1/G2 e do titular clínico.

**Escopo vinculado:** toda a V2 (apps/api, apps/web, workers, conectores). **Não
vincula:** backend/coletor/dashboard (ADR-0019), metas numéricas (G1), procedimento
clínico de downtime (tópico candidato próprio).

## 5. Consequências

- **Positivas:** G8 ganha lista executável de evidências; cláusulas já aceitas
  (B5/B6, P5/P8, reconciliação ADR-0006) tornam-se observáveis; portabilidade de backend
  preserva o espaço de decisão do ADR-0019.
- **Negativas:** custo recorrente de ensaios (restore, game day); risco de métrica sem
  meta virar ruído até G1; disciplina O3 exige revisão contínua de logs.
- **Neutras/estruturais:** a taxonomia de métricas vira contrato interno versionado;
  alerta operacional e alerta clínico ficam estruturalmente separados.

## 6. Implicações transversais

| Dimensão | Implicação | Rótulo |
|---|---|---|
| Segurança clínica | O5 impede ocultação de degradação/frescor (DOM-0007); O10 vigia carga de alerta sem meta inventada | SOURCE (§15.3/§20) |
| Segurança (security) | O2 inclui negativas cross-tenant e acesso suspeito; O3 evita PHI em telemetria; O9 dá integridade à evidência | INFERENCE |
| Privacidade (LGPD, minimização, propósito) | O3: minimização estrutural na telemetria; retenção de telemetria segue ADR-0018/0019 quando materializados | INFERENCE |
| Interoperabilidade | Drift de contrato de conector é métrica O2; conector degradado é estado O5, não silêncio | INFERENCE |
| Acessibilidade | Estados degradados visíveis na UI seguem WCAG 2.2 AA (ADR-0021); degradação compreensível é requisito de fatores humanos (C6 do ADR-0011) | INFERENCE |
| Operacional | Núcleo do ADR: readiness segura, ensaios de restore/DR, kill switches monitorados | SOURCE (§15.3) |
| Custo | OTel evita lock-in precoce; custo real está nos ensaios recorrentes — explícito e orçável | PROPOSAL |
| Migração | Restore ensaiado cobre também migração de schema (compatibilidade/rollback §15.2 item 6); telemetria portável sobrevive à decisão ADR-0019 | INFERENCE |

## 7. Reversibilidade, gatilhos de revisita e rollback

**Reversibilidade:** alta na instrumentação (API OTel é camada fina); média nos ensaios
(processo, não código). Encalhado em reversão: instrumentação e séries históricas.

| # | Gatilho de revisita | Detecção | Ação |
|---|---|---|---|
| T1 | Metas G1 validadas passam a existir | Registro G1 | Converter medições O2 em SLOs com orçamento de erro |
| T2 | ADR-0019 materializado (plataforma/backend) | Aceite da minuta | Selecionar coletor/backend; reavaliar O1 sem mudar a API de instrumentação |
| T3 | Ensaio de restore falha ou RPO/RTO medido inaceitável | Ensaio O6 | Bloqueio de promoção G8; correção antes de nova tentativa |
| T4 | Telemetria flagrada com PHI | CI/revisão/incidente | Incidente de privacidade; purga; correção do emissor |
| T5 | Métrica O2 sem consumidor por ciclo prolongado | Revisão operacional | Podar — métrica morta é custo sem evidência |

**Kill/rollback:** telemetria é degradável sem afetar o laço clínico (perda de
observabilidade é, ela mesma, um estado degradado O5 e nunca derruba avaliação); ensaios
de DR têm ambiente isolado; não há kill switch para backup — sua ausência é defeito, não
modo.

## 8. Validação

| # | Alegação | Método | Vínculos |
|---|---|---|---|
| V1 | Medições O2 existem e são corretas | Testes de instrumentação com exportador em memória (red/green) | TST: pendente de arquitetura de teste |
| V2 | Readiness falha fechado sem bundle/dependência | Teste de prontidão negativo | TST: pendente |
| V3 | Telemetria livre de PHI | Vetores SYNTH- + CI de conteúdo proibido sobre saídas | scripts/check_forbidden_content.py; TST: pendente |
| V4 | Restore íntegro com RPO/RTO medidos | Ensaio de restore documentado com dados sintéticos | VAL: pendente (critério G8) |
| V5 | Modos degradados visíveis ponta a ponta | Teste E2E de degradação (derrubar dependência → estado na UI) | TST: pendente; G4/G8 |

## 9. Supersessão

- **Supersede:** nenhum. **Superseded por:** nenhum.
- Relações: consome ADR-0006/0010/0011 (o que medir) e ADR-0019 (onde rodar, pendente de
  materialização); alimenta a evidência do Gate G8.
