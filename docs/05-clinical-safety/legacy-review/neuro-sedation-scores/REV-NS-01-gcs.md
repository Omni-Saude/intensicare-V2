---
id: REV-NS-01
title: Revisão legada — Escala de Coma de Glasgow (captura, computação, consumidores a jusante, confundimento por sedação/intubação)
label: PROPOSAL
statement: >
  A V1 captura o GCS como um inteiro anulável 3-15, computa-o no motor de formulários coagindo
  componentes E/V/M não testados ao seu mínimo, alimenta-o no CNS do SOFA e no qSOFA com
  semântica de escore-ausente-zero, e não tem representação alguma para "verbal-não-testável"
  (intubação) ou GCS confundido por sedação. Veredito: TRANSFORM.
  PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).
provenance:
  source_repo: intensicare (legado V1, READ-ONLY)
  path_or_url: src/intensicare/services/domain_formularios.py; src/intensicare/services/sofa.py; src/intensicare/services/qsofa.py; src/intensicare/models/vital_sign.py; src/intensicare/schemas/vitals.py
  commit_sha_or_version: 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79 (SHA-256 por arquivo na tabela §1; todos MATCH docs/archive/legacy-provenance/legacy-pin-cycle-1.md salvo indicação em contrário)
  section_or_lines: citado por achado abaixo
  date_collected: 2026-08-15
  collector: revisor forense de instrumentos legados de neuro/sedação (ciclo 1, Tarefa 1); revisor responsável rodaquino-OMNI
  transformation: >
    traduzido EN→pt-BR, tranche 4, GDEC-0008 item 8 (trechos verbatim mais análise do revisor)
  confidence: alta
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  requirements: [SAF-0001, SAF-0002, SAF-0003]
  hazards: [HAZ-0005, HAZ-0036]
  adrs: []
  tests: []
  pr: null
supersedes: null
superseded_by: null
---

> Traduzido EN→pt-BR em 2026-08-16 (GDEC-0008 item 8, tranche 4); original EN preservado no histórico git.

# REV-NS-01 — Escala de Coma de Glasgow

## 1. Conforme implementado (OBSERVED, verbatim)

Fontes (caminhos relativos a `https://github.com/Omni-Saude/intensicare`; status de manifesto conforme pin do ciclo-1):

| Caminho | Linhas | SHA-256 | Manifesto |
|---|---|---|---|
| `src/intensicare/models/vital_sign.py` | 49 | `4a145e9b4135fd943043d96c5efe3a3981f84053f78710b0f6fe66bd126d4a12` | MATCH |
| `src/intensicare/schemas/vitals.py` | 73 | `f6afffd444038f2d1dec19d7047a0013f908d9a7106c52ce9895cbc1ba14308f` | MATCH |
| `src/intensicare/services/domain_formularios.py` | 75-84, 131-133, 611-626, 731-765 | `61db0316a942ce3c1310be15ff0411b3f5bbbd58754aa4f58b2912f0230499d3` | MATCH |
| `src/intensicare/services/sofa.py` | 86-90, 343-369, 487-489 | `731b3507cc07b2d5318f4759229527d2eac1f45b62eba269168d43560739b84a` | MATCH |
| `src/intensicare/services/qsofa.py` | 28, 101-115, 148-158 | `48b69f39f7b789c5f12f005931c9d02cc9b8da562c9aecee804d594530bab8ce` | MATCH |
| `src/intensicare/services/domain_piora_clinica.py` | 335-351, 422-440 | `ca8cbe35c00a8390a2d963ca5af9f235f0f454bf87c406cb5646d27d04221994` | MATCH |
| `src/intensicare/api/v1/deterioration.py` | 108, 123 | `6a0c3bd1a14947f203be56bd0d2a678ab4d7870730f43816ab18c678154ce7f7` | MATCH |
| `src/intensicare/services/domain_respiratory.py` | 336-415, 747-778 | `51344a4db6e5e168e64a28ea371e308fc76d4291e3cbad8d91c93342414738b9` | MATCH |
| `src/intensicare/services/ews_nrt_runner.py` | 403-406 | `9ad826e9e31be584a17285a721697243e8654d9209ca68b9abec1230ed3c7fe6` | MATCH |
| `src/intensicare/services/domain_trilhas_engine.py` | 297-316 | `6dca0013e99a6db21bf92303062bf033c40314a0c79c999896eea3aa04cadd56` | MATCH |
| `src/intensicare/services/sepsis_input_provider.py` | 215-216 | `650bdd8c512fd08e673cde124269dd5c05a214ac07510011d53954cdd738b1cb` | MATCH |
| `src/intensicare/services/domain_sepsis.py` | 248-261 | `853d2e38a8167d28e7eb242872e871024abe00b4868fc22f7c02502f99d3ccf8` | MATCH |
| `_work/alerts/pathways/desmame.yaml` | 23-26, 85-105 | `808e81b2de592b0bd9f1bae09e505e5db2d910b6f09fc21ec1f5ef56ecf2574a` | MATCH |
| `_work/alerts/schema/pathway.schema.json` | 156 | `68ca230a47b7ad5be991cdfc4319ad1d6a6e6112d14b185506588ebed772a203` | MATCH |
| `docs/rules/clinical-scoring/RULE-CLINICAL-SCORING-013-…md` | arquivo inteiro | `9e47872ed70d2411ea06cb3ab5ba42cca24b14e9e3d78efd3c92ef3b696656ea` | MATCH |
| `docs/rules/clinical-scoring/RULE-CLINICAL-SCORING-006-…md` | arquivo inteiro | `66750c00b709c23a5f18872d72160bc0bb72216f60f51b44ab0b43437a87eef0` | MATCH |
| `docs/rules/clinical-scoring/RULE-SINAIS-VITAIS-011-…md` | arquivo inteiro | `5041e6afbb5ae8556030e7f109550d9a24d65a54a329c1264fd64df3f94ce0ad` | MATCH |
| `tests/test_sofa.py`, `tests/test_qsofa.py` | vetores de entrada ausente | ver README §4 | ABSENT (hash-notado) |

### 1.1 Captura

- `models/vital_sign.py:49` — `gcs: Mapped[int | None] = mapped_column(Integer)` — anulável,
  **sem restrição de faixa em nível de BD**, apenas escore total (sem colunas E/V/M).
- `schemas/vitals.py:73` — `gcs: int | None = Field(None, ge=3, le=15, …)` — a ingestão da API
  valida 3-15 inclusive; `None` é permitido. Nenhum sentinela-zero é aceito na API da V1
  (diferente do `GlasgowValidator` do predecessor, que isentava 0 como "não medido" —
  RULE-SINAIS-VITAIS-011).

### 1.2 Computação no motor de formulários (`domain_formularios.py:731-753`)

```text
o = max(1, min(4, int(ocular)))  if ocular  is not None else 1
v = max(1, min(5, int(verbal)))  if verbal  is not None else 1
m = max(1, min(6, int(motora)))  if motora  is not None else 1
return float(o + v + m)
```

Docstring, verbatim (linha 739): *"If any component is missing, scores minimum for that
component."* ("Se algum componente está ausente, pontua o mínimo para esse componente.")
Faixas de gravidade (`_glasgow_severity`, linhas 756-765): `>=13 leve`,
`>=9 moderado`, `>=6 grave`, senão `muito_grave`.

### 1.3 Consumidores a jusante do GCS (a superfície de propagação do confundimento)

| Consumidor | Caminho de código | Comportamento com um valor | Comportamento quando ausente |
|---|---|---|---|
| CNS do SOFA | `sofa.py:343-369` (`15→0, 13-14→1, 10-12→2, 6-9→3, <6→4`) | corresponde exatamente às faixas de Vincent 1996 | `(0, "missing")` → contribui 0 ao total; `"gcs"` é anexado a `missing_components` (`sofa.py:487-489`) |
| SOFA (caminho de formulários) | `domain_formularios.py:611-626` | mesmas faixas | o componente é silenciosamente pulado → contribui 0, **nenhum metadado de ausência de forma alguma** |
| Mentação do qSOFA | `qsofa.py:101-115` (`GCS<15 → 1`) | corresponde ao Sepsis-3 | `(0, "missing")` → contribui 0; listado em `missing_criteria` (`qsofa.py:148-158`) |
| Recomputação do qSOFA em piora clínica | `domain_piora_clinica.py:341-351` | igual | cada entrada ausente contribui 0 sem nenhum marcador |
| Critério de deterioração "Queda de GCS ≥2/24h" | `domain_piora_clinica.py:422-440` | `GCS<=8 → critical`; `ΔGCS<=-2/-3 → alert/critical` | `(False, "normal", "sem dados de GCS")` — **status literal "normal"** |
| Alimentação da API de deterioração | `api/v1/deterioration.py:108,123` | `"glasgow": vital.gcs` | `"glasgow_24h_ago": None` é **hard-coded** — o ramo de Δ é estruturalmente inalcançável por essa rota |
| Prontidão para desmame | `domain_respiratory.py:389-391` (gate `GCS>=10`), `:771-778` (`GCS>8 OR RASS>=-2`) | gate conjuntivo | `None` → critério falha → NÃO pronto (direção conservadora) |
| Pathway de desmame | `desmame.yaml:85-105` — faixas `[11,∞) normal / [9,11) watch / [0,9) critical` (limite inferior inclusive/superior exclusivo conforme `pathway.schema.json:156`) | GCS ≥11 adequado | o piso 0 da faixa admite silenciosamente os valores impossíveis 0-2 em "critical" |
| Elegibilidade de trilhas | `domain_trilhas_engine.py:297-316` | precisa de dados de neuro ou de mecânica | ausente → `eligible=False` com um motivo pt-BR explícito (padrão honesto de não-avaliado) |
| Prontidão para step-down | `ews_nrt_runner.py:403-406` | `GCS>=14` | `None` → falha `"GCS unavailable"` (fail-safe, explícito) |
| Entradas de sepse | `sepsis_input_provider.py:215-216`; `domain_sepsis.py:248-261` | passa `glasgow` apenas quando presente | chave ausente → ausente-como-zero do qSOFA a jusante |

## 2. Instrumento publicado (SOURCE)

- Teasdale G, Jennett B. *Assessment of coma and impaired consciousness: a practical scale.*
  Lancet. 1974;2(7872):81-84. Total = ocular (1-4) + verbal (1-5) + motor (1-6); faixa 3-15.
- Orientação atual de avaliação estruturada: glasgowcomascale.org (Teasdale et al., a abordagem
  estruturada de Glasgow; ver também Teasdale G et al., *The Glasgow Coma Scale at 40 years*,
  Lancet Neurol. 2014;13(8):844-854). Verificado em 2026-08-15: quando um componente não pode
  ser testado (p. ex., verbal sob intubação endotraqueal/traqueostomia), ele é registrado
  **"NT" (não testável)**; a orientação é explicitamente **não relatar um escore total quando
  um componente é NT** (um total fabricado-baixo representa erroneamente o paciente), e **não
  usar "1" para registrar um componente não testável**.
- Operacionalização do CNS do SOFA a partir do GCS: Vincent JL et al. Intensive Care Med.
  1996;22(7):707-710 (faixas 15/13-14/10-12/6-9/<6). A publicação original do SOFA não define
  como pontuar pacientes sedados; nenhuma regra publicada nela licencia substituir o valor
  sedado.
- qSOFA: Singer M et al. (Sepsis-3). JAMA. 2016;315(8):801-810; mentação alterada
  operacionalizada como GCS < 15 (Seymour CW et al. JAMA. 2016;315(8):762-774).
- Âncora de prática de sedação: Devlin JW et al. (SCCM PADIS). Crit Care Med.
  2018;46(9):e825-e873.

## 3. Análise de discrepância

| Dimensão | Achado | Rótulo |
|---|---|---|
| Faixa | 3-15 inclusive na API e na camada de regras — corresponde a Teasdale-Jennett. O sentinela 0-isento do predecessor (RULE-SINAIS-VITAIS-011) **não** é carregado para o schema da API da V1, mas o piso da faixa `[0,9)` de `desmame.yaml` ainda o acomoda. Nenhuma restrição de BD respalda a validação da API. | OBSERVED |
| Modelagem de componente | O stream de vitais armazena apenas o total; apenas o motor de formulários tem E/V/M e ele **coage um componente não testado ao seu mínimo (1)** — exatamente a prática que glasgowcomascale.org proíbe ("não usar 1 para ausente"). Um formulário totalmente vazio produz 3.0, indistinguível de coma profundo verdadeiro. | OBSERVED |
| Faixas de gravidade | `_glasgow_severity` divide o "grave 3-8" publicado em `grave 6-8` / `muito_grave 3-5`; os limites 13/9 correspondem aos pontos de corte publicados de leve/moderado. Subdivisão institucional, não um erro numérico. | OBSERVED |
| Comportamento em dado ausente | Divergente por consumidor (tabela §1.3): coerção-zero (SOFA/qSOFA), coerção-ao-pior (formulários E/V/M), status-"normal" (deterioração), recusa fail-safe (desmame, step-down, trilhas). Nenhuma política única. | OBSERVED |
| Caminhos mortos estruturais | `glasgow_24h_ago` hard-coded como `None` na API de deterioração mata o critério ΔGCS nessa rota. | OBSERVED |
| População | O próprio GCS é usado em adultos e crianças, mas todo consumidor aqui (SOFA, qSOFA, bundles de desmame) é validado para adultos; a V1 não tem gating por idade → VAL-0006/VAL-0007, HAZ-0036. | INFERENCE |

## 4. OBRIGATÓRIO — validade do GCS sob sedação/intubação

**O que a V1 realmente faz (OBSERVED):**

1. **Não existe designação "T"/"NT", nem substituição verbal, nem gating por RASS do GCS em
   lugar algum da base de código da V1.** O único traço de consciência é um placeholder
   comentado no registro de invariantes cross-field — `domain_formularios.py:131-132`,
   verbatim: `# Future invariants can be added here:` / `# "glasgow_intubated_block": { ... },`
   — ou seja, um bloco de intubação para o GCS foi contemplado e nunca implementado.
2. Para um **paciente intubado** (verbal não testável) o sistema oferece exatamente duas
   codificações, ambas erradas: (a) omitir o GCS → todo escorador trata como `missing` → CNS
   do SOFA 0 / mentação do qSOFA 0 (falsa tranquilização, padrão HAZ-0005); ou (b) submeter o
   motor de formulários com `verbal` ausente ou 1 → `_calculate_glasgow` coage V=1, de modo
   que um paciente intubado alerta (E4, M6) se torna GCS 11 → CNS do SOFA 2 e mentação do
   qSOFA 1 (falso alarme e escores poluídos na direção oposta).
3. Para um **paciente profundamente sedado (RASS ≤ -3)** o GCS medido reflete o efeito da
   droga. A V1 computa o CNS do SOFA e a mentação do qSOFA a partir dele **sem nenhuma
   covariável de sedação**: o RASS não é uma entrada para `sofa.py`, `qsofa.py`, nem
   `domain_piora_clinica._eval_gcs_drop`; nada marca o subescore de CNS resultante como
   confundido por sedação. Um paciente sedado com propofol em RASS -4 pontua CNS do SOFA 4 e
   dispara permanentemente o ramo `GCS<=8 → critical "coma"` do critério de deterioração
   (`domain_piora_clinica.py:430-431`).
4. O contraste é gritante com o próprio tratamento de CAM-ICU da V1, que **de fato** faz
   gating por RASS ≤ -4 ("não avaliável", `domain_sedacao.py:271-291`) — provando que o padrão
   estava disponível e simplesmente nunca foi aplicado ao GCS.
5. Propagação a jusante (referências cruzadas; a revisão profunda de escore é de outros
   workstreams): CNS do SOFA → total em `sofa.py:487-504`; qSOFA → total em `qsofa.py:148-158`
   e rastreio de sepse em `domain_sepsis.py:248-261`; a consciência do EWS é baseada em AVPU,
   não em GCS (`news2.py:213-224`, `mews.py:151-165` — ver REV-NS-08), mas um paciente sedado,
   não-alerta pontua NEWS2 +3 / MEWS +1-3 com o mesmo confundimento e nenhum gating; critérios
   de deterioração conforme §1.3; gates de desmame/step-down conforme §1.3 (estes são os
   únicos consumidores que falham com segurança).

### INPUT TO ADR — política de confundimento sedação/avaliação-neuro

PROPOSAL (recomendação clínica para o ADR da V2; requer ratificação clínica nomeada):

1. **Modelar o GCS como componentes E/V/M com um estado NT explícito por componente.** Um
   total só é computável quando os três componentes são testados; um componente não testado
   torna o total não-representável (nem 3, nem 15, nem preenchido-pelo-mínimo), conforme
   glasgowcomascale.org. Registrar a modalidade (p. ex., convenção de exibição "GCS 10T") como
   apresentação, não como aritmética.
2. **Fazer gating da validade da avaliação neurológica pelo estado de sedação.** Exigir um
   RASS contemporâneo para todo GCS destinado a pontuação. Se RASS ≤ -3 (ou uma infusão
   sedativa está ativa sem uma janela de interrupção), o GCS é registrado mas marcado
   `sedation_confounded`; o CNS do SOFA, a mentação do qSOFA e a consciência do EWS
   computados a partir dele devem carregar `evaluation_status = partial` no máximo, sob uma
   política de parcial explicitamente ratificada (`evaluation-status-semantics.md` §3.2) —
   nunca silenciosamente `valid`. O padrão clinicamente honesto para o subescore de CNS de um
   paciente farmacologicamente sedado é `not_evaluated (reason: sedation_confounded)`, com o
   último GCS pré-sedação exposto.
3. **Nunca coagir.** Entradas neurológicas ausentes/NT/confundidas devem ser
   não-representáveis como 0, como mínimo-de-componente, ou como "normal" (HAZ-0005, sonda de
   entrada-ausente do SAF-0002). Os três comportamentos da V1 (zero, preenchimento-pelo-mínimo,
   status-"normal") são todos rejeitados.
4. **Gate de população**: apenas adultos até que VAL-0006/VAL-0007 sejam decididos.

## 5. Checagem de coerção-zero do HAZ-0005 (a partir da fonte)

**VIOLAÇÃO — múltipla, viva.** (a) `sofa.py:358-359` e `qsofa.py:113-114`: GCS ausente → 0
pontos; o marcador "missing" é metadado que nenhum consumidor eleva (exatamente o padrão
legacy-TA E1). (b) `domain_formularios.py:611-626`: o SOFA de formulários descarta o
componente sem marcador algum. (c) `domain_piora_clinica.py:427-428`: GCS ausente → status
`"normal"`. (d) `domain_formularios.py:749-751`: coerção inversa — componente ausente → pior
valor. Apenas os gates de desmame/step-down/trilhas (§1.3) se comportam com segurança.
Evidência de intenção: o comportamento ausente→0 é asserido como esperado nos vetores de
entrada ausente de `tests/test_sofa.py` e `tests/test_qsofa.py` (hash-notados; ausentes do
manifesto), de modo que este é comportamento projetado, não um acidente.

## 6. Veredito

**TRANSFORM** — reter apenas o conceito (GCS como a entrada de gravidade de CNS,
Teasdale-Jennett 3-15, faixas do SOFA de Vincent, ponto de corte GCS<15 do Sepsis-3 — todos
numericamente corretos na V1); reconstruir o modelo do instrumento por completo: captura em
nível de componente com NT, gating por sedação conforme §4, uma única política de dado ausente
governada por evaluation-status, restrições em nível de BD, e gating de população adulta. Os
comportamentos de dado ausente da V1 e a ausência de qualquer tratamento de
intubação/sedação são REJEITADOS como lógica clínica.

**PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).**
