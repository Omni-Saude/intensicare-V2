---
id: RULE-GCS-MIG-0100
title: RULE-GCS v0.2.0 — notas de migração rule-local (o que esta especificação supersede e rejeita do legado)
label: PROPOSAL
status: REVISADO CLINICAMENTE 2026-08-15 (GDEC-0007) — decisões incorporadas; aprovação formal pendente do mecanismo de bundle assinado (ADR-0007); NOT ACTIONABLE (inalterado)
last_updated: 2026-08-15
statement: >
  Sumário rule-local da disposição de cada artefato GCS legado relativo a RULE-GCS
  v0.2.0, citando os registros forenses REV-NS-01 (GCS) e REV-NS-02 (RASS, para o gate
  de avaliabilidade). Nada foi importado; o modelo de instrumento foi re-derivado de
  Teasdale & Jennett 1974 e glasgowcomascale.org. A coerção-a-1 do motor de formulários,
  o missing→0 dos consumidores, o status-"normal" na deterioração e o bloco de
  intubação comentado-e-nunca-implementado são todos rejeitados e codificados como
  vetores de regressão. O manifesto de migração de repositório é entregável de outro
  especialista; este arquivo é apenas a visão local de RULE-GCS.
provenance:
  source_repo: intensicare-V2
  path_or_url: docs/05-clinical-safety/rule-releases/gcs/migration-notes.md
  commit_sha_or_version: uncommitted (working tree on cycle-1/clinical-content; HEAD ddac9bc)
  section_or_lines: whole document
  date_collected: 2026-08-15
  collector: GCS-instrument V2 clinical-content specification author (cycle 1, Task 2); accountable reviewer rodaquino-OMNI
  transformation: >
    Disposições sumarizadas de REV-NS-01 §1-§6 e REV-NS-02 §1/§3-§5 (repo legado pinado
    em 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79; SHA-256 por arquivo em
    docs/archive/legacy-provenance/legacy-pin-cycle-1.md) e mapeadas às seções de
    specification.md que as supersedem.
  confidence: high (disposições fielmente transportadas); medium (revisão clínica nomeada GDEC-0007 2026-08-15; aprovação formal via bundle assinado ADR-0007 pendente)
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  requirements: [SAF-0001, SAF-0002, SAF-0030]
  hazards: [HAZ-0005, HAZ-0006, HAZ-0036]
  adrs: [ADR-0008 (pending), ADR-0028 (pending, sedation confounding)]
  tests: []
  pr: null
supersedes: null
superseded_by: null
---

# RULE-GCS v0.2.0 — notas de migração rule-local

Escopo: somente o instrumento GCS (e a entrada de gate RASS na medida em que RULE-GCS a
consome). O manifesto de migração completo é arquivo de outro especialista. O legado é
citado exclusivamente através dos registros de revisão hasheados em
`docs/05-clinical-safety/legacy-review/neuro-sedation-scores/` (pin legado `1dc1ea6c…`;
manifesto `docs/archive/legacy-provenance/legacy-pin-cycle-1.md`).

## 1. Regra de proveniência aplicada

**Nada em `specification.md` foi copiado de código legado.** O modelo de componentes,
as enumerações e a proibição de total-com-NT foram re-derivados de Teasdale & Jennett
1974 e glasgowcomascale.org (verificados em specification.md §2). Onde números V2
coincidem com números legados (faixa 3–15 na API, bandas Vincent nos consumidores), é
porque o legado coincidia com a fonte primária; a proveniência do valor V2 é a fonte
publicada, nunca a constante legada. A importação de legado permanece bloqueada de
qualquer forma por `docs/00-governance/legacy-import-policy.md` §3.

## 2. Tabela de disposição — achados de REV-NS-01 (GCS)

O veredito da revisão forense é **TRANSFORM**: reter o conceito, rejeitar o modelo.
Disposição por achado:

| Elemento legado (achado da revisão) | Veredito da revisão | Disposição RULE-GCS 0.2.0 |
|---|---|---|
| Faixa 3–15 na API (`schemas/vitals.py:73`, ge=3 le=15) — numericamente correta | OBSERVED (correta) | **Superseded por re-derivação** — mesma faixa, proveniência nova (Teasdale & Jennett 1974; spec §3.5). Enumerações por componente agora aplicadas (E 1–4, V 1–5, M 1–6); fora → `invalid`, nunca clamp. Vetores CRV-GCS-0217/0218. |
| Armazenamento apenas do total (`vital_sign.py:49` — coluna única, sem E/V/M, sem constraint de BD) | OBSERVED (defeito estrutural) | **REJEITADO** — o modelo V2 é componente-primeiro (spec §3.1); total-apenas da fonte não aceito para computação (spec §5.2, OQ-GCS-6). Constraints de domínio explícitas no modelo declarativo (spec §9). |
| **Coerção-a-1 do motor de formulários** (`domain_formularios.py:731-753`: componente ausente → mínimo; formulário vazio → GCS 3.0 indistinguível de coma profundo verdadeiro) | OBSERVED — **VIOLAÇÃO HAZ-0005 (coerção inversa)** | **REJEITADO em cheio.** "1" significa exclusivamente "testado, sem resposta" (spec §3.2); não testado é NT de primeira classe (spec §3.3); ausência é `missing_required_input` (spec §3.4). Vetores de regressão CRV-GCS-0205 (E4 M6 V→1 = GCS 11 falso), CRV-GCS-0207 (formulário vazio → 3.0), CRV-GCS-0208. Esta é exatamente a prática que glasgowcomascale.org proíbe verbatim ("Do not use number '1' to record missing component"). |
| **Missing→0 nos consumidores** (SOFA `sofa.py:358-359, 487-489`; qSOFA `qsofa.py:113-114, 148-158`; forms-SOFA `domain_formularios.py:611-626` sem metadado algum) | OBSERVED — **VIOLAÇÃO HAZ-0005 (padrão E1)** | **REJEITADO.** RULE-GCS emite status + reason, nunca número substituto (spec §6.2); o contrato de consumidor (spec §7) proíbe qualquer consumidor de fabricar 0/valor a partir de ausência — comportamento dos consumidores já re-especificado em RULE-SOFA-0100 §4.5/§5 (referenciado, não editado aqui). Vetor CRV-GCS-0208. |
| **Status "normal" em ausência** na deterioração (`domain_piora_clinica.py:427-428`: sem dados de GCS → literal "normal") | OBSERVED — VIOLAÇÃO HAZ-0005 | **REJEITADO.** Ausência → `not_evaluated` com motivo, contado em categoria própria em todo roll-up (evaluation-status-semantics.md §3.3; spec §6.1). |
| **Bloco de intubação comentado e nunca implementado** (`domain_formularios.py:131-132`, verbatim: `# "glasgow_intubated_block": { ... },`) — a única consciência legada do problema | OBSERVED | **Superseded pela implementação de primeira classe** — o que era placeholder comentado vira o núcleo do modelo: V-NT(`endotracheal_intubation`/`tracheostomy`) com nenhum total (spec §3.3/§3.5). O caso canônico intubado é o vetor CRV-GCS-0205. |
| **Nenhum gate de sedação em lugar algum** (RASS não é entrada de `sofa.py`, `qsofa.py` nem `_eval_gcs_drop`; RASS −4 sob propofol escorava SOFA CNS 4 e disparava permanentemente "coma crítico") | OBSERVED (REV-NS-01 §4.3) | **Superseded pelo gate de avaliabilidade** (spec §4): RASS contemporâneo pareado (1 h); `sedation_confounded` sob RASS ≤ −3 + exposição sedativa ativa **ou desconhecida** ou infusão sem janela de interrupção; sedação desconhecida → FAIL-CLOSED (`sedation_state_unknown`) — DECIDIDO GDEC-0007, OQ-GCS-2/3 (política conjunta com RULE-SOFA OQ-8 e ADR-0028 Q2); coma não sedado escorável. Vetores CRV-GCS-0209/0210/0212/0219/0220 (0213 aposentado/superseded). |
| Padrão CAM-ICU do próprio V1 (`domain_sedacao.py:271-291`: gate RASS ≤ −4 "não avaliável") — prova de que o padrão existia e não foi aplicado à GCS | OBSERVED | **Conceito TRANSFORMADO** — a ideia "instrumento neuro gated por RASS" é a única herança conceitual aceita desta família, generalizada como gate de avaliabilidade (spec §4) com limiar re-ancorado na fonte (Sessler 2002; sedação profunda ≤ −3 conforme prática PADIS), não importada do valor legado −4. |
| Bandas de severidade institucionais (`_glasgow_severity`: subdivisão `grave 6-8`/`muito_grave 3-5`) | OBSERVED (subdivisão sem fonte) | **REJEITADO / fora de escopo** — RULE-GCS 0.2.0 não emite banda de severidade alguma (spec §0, OQ-GCS-9); qualquer banda futura exige fonte nomeada e ratificação própria. |
| Banda `[0,9)` do pathway desmame (`desmame.yaml:85-105`) admitindo silenciosamente os valores impossíveis 0–2 | OBSERVED | **Irrepresentável no V2** — o domínio de valor do total é 3–15 com enumerações por componente; 0–2 não é construível (spec §3.5/§9). |
| Δ-GCS estruturalmente morto (`api/v1/deterioration.py:123`: `glasgow_24h_ago` hard-coded `None`) | OBSERVED | **Não migrado** — nenhum critério de tendência/ΔGCS em RULE-GCS 0.2.0; se um consumidor futuro quiser ΔGCS, é conteúdo próprio com fonte própria, e o padrão "ramo estruturalmente inalcançável" é lição de teste (vetores de replay obrigatórios, spec §12 M-5). |
| Ausência de gate populacional em todos os consumidores (REV-NS-01 §3 população) | INFERENCE (da revisão) | **Superseded** — gate etário aplicável ≥18 com `population_unverified`/`out_of_population_scope` (spec §1.2; ADR-0027; VAL-0006/0007). Vetores CRV-GCS-0215/0216. |

## 3. Tabela de disposição — achados de REV-NS-02 (RASS) na medida consumida por RULE-GCS

RASS é instrumento separado (veredito REFINE; especificação própria pertence a outra
tarefa). Aqui apenas o que o gate de RULE-GCS consome:

| Elemento legado | Veredito da revisão | Disposição no gate RULE-GCS |
|---|---|---|
| Enumeração −5..+4 e rótulos pt-BR fiéis a Sessler 2002 | OBSERVED (correta) | **Superseded por re-derivação** — domínio −5..+4 re-ancorado em Sessler 2002 (spec §4.1); fora do domínio → `invalid`. |
| Missing RASS → 0.0 "Alerta e calmo" no motor de formulários (`domain_formularios.py:685-686`) | OBSERVED — **VIOLAÇÃO HAZ-0005 (pior achado do registro)** | **REJEITADO.** RASS ausente NUNCA vira 0/alerta; ausência de RASS pareado → estado de sedação desconhecido → `not_evaluated(sedation_state_unknown)` — FAIL-CLOSED DECIDIDO (GDEC-0007, OQ-GCS-2 (b); spec §4.4). Vetor CRV-GCS-0219 (supersede CRV-GCS-0211). |
| Clamp silencioso de RASS fora de faixa (+10 → +4) | OBSERVED — designed behaviour | **REJEITADO.** Fora do domínio → `invalid` (reason `out_of_range`), nunca clamp (spec §4.1; evaluation-status-semantics.md §3.5). |
| Avaliador de alertas RASS inimportável (módulo morto) | OBSERVED | **Não migrado** — nada de alerta RASS em RULE-GCS; lição operacional coberta por M-5 (replay obrigatório). |

## 4. O que deliberadamente NÃO migra

1. Qualquer código executável, modelo ou forma de persistência (coluna `gcs` inteira
   nullable sem componentes — a metade de persistência de HAZ-0005).
2. Qualquer expectativa de teste legada: os testes legados **afirmam** missing→0 como
   correto (REV-NS-01 §5: `tests/test_sofa.py`/`test_qsofa.py`, hash-noted) e são o
   anti-oráculo; os vetores V2 afirmam o oposto.
3. A convenção de exibição "GCS 11" para intubados (qualquer aritmética com componente
   não testado). A notação de modalidade ("10T") sobrevive apenas como apresentação,
   nunca como número computável (spec §3.5).
4. As bandas de severidade institucionais e as bandas de pathway (`desmame.yaml`) — sem
   fonte, fora de escopo.
5. O sentinela 0 = "não medido" do predecessor (RULE-SINAIS-VITAIS-011, já ausente da
   API V1 mas vivo no piso de banda do desmame) — irrepresentável no domínio V2.

## 5. Fronteira com regras vizinhas

- **RULE-SOFA (CNS)** — consumidor; seu tratamento de GCS (RULE-SOFA-0100 §4.5) é
  consistente com esta especificação e não é editado por ela. A janela GCS 12 h/24 h e o
  pareamento RASS 1 h são deliberadamente idênticos nos dois documentos.
- **RULE-NEWS2 (ACVPU)** — sem mapeamento automático GCS→ACVPU em nenhum dos lados
  (spec §7.3; RULE-NEWS2 Q4).
- **qSOFA** — nenhum rule-release existe; o contrato de mentação está registrado em
  spec §7.2 para citação futura.
- **RASS como instrumento** (alertas de sedação, metas PADIS, bandas de pathway
  `sedacao.yaml`/`delirium.yaml`) — fora de escopo; pertence a uma futura especificação
  RASS própria. RULE-GCS consome RASS somente como entrada de gate.

*Sumário rule-local apenas; o manifesto de migração de repositório é de outro
especialista. Sem PHI; todos os valores são definições publicadas ou exemplos
sintéticos.*
