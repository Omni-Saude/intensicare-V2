---
id: LEGREV-QSOFA-0001
title: Revisão legada — conteúdo clínico do scoring qSOFA (V1 services/qsofa.py e consumidores)
label: PROPOSAL
status: PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI)
statement: >
  Revisão forense com rigor de intensivista da implementação legada V1 do qSOFA
  contra o Sepsis-3 (Singer 2016) e a diretriz Surviving Sepsis Campaign 2021,
  incluindo verificação exata dos cortes, rastreamento de coerção a zero do
  HAZ-0005, a análise obrigatória do posicionamento pós-2021 da SSC, e vereditos de
  importação. Tudo aqui é PROPOSAL; nenhuma autoridade clínica ratificou nenhuma
  declaração.
provenance:
  source_repo: intensicare (legado V1, READ-ONLY)
  path_or_url: src/intensicare/services/qsofa.py e consumidores (ver tabela por citação §1)
  commit_sha_or_version: 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79 (HEAD no pin; SHA-256 por arquivo em §1)
  section_or_lines: referências de linha por citação ao longo do documento
  date_collected: 2026-08-15
  collector: revisor forense de escores de sepse legados (ciclo 1, Tarefa 1); revisor responsável rodaquino-OMNI
  transformation: >
    traduzido EN→pt-BR, tranche 3, GDEC-0008 item 8 (trechos verbatim mais análise do
    revisor; análise rotulada INFERENCE/PROPOSAL)
  confidence: alta (verificação de fonte); baixa (disposições clínicas — não ratificadas)
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  requirements: [SAF-0001, SAF-0002, SAF-0035]
  hazards: [HAZ-0005, HAZ-0006, HAZ-0036, HAZ-0043]
  adrs: []
  tests: []
  pr: null
supersedes: null
superseded_by: null
---

> Traduzido EN→pt-BR em 2026-08-16 (GDEC-0008 item 8, tranche 3); original EN preservado no histórico git.

# qSOFA — revisão de conteúdo clínico legado

**PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).**

## 1. Fontes verificadas, com hashes

Caminhos relativos a `https://github.com/Omni-Saude/intensicare` (READ-ONLY), fixados (pinned)
no HEAD git `1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79`; hashes recalculados em
2026-08-15 contra `docs/archive/legacy-provenance/legacy-pin-cycle-1.md`.

| Artefato | SHA-256 | Manifesto |
|---|---|---|
| `src/intensicare/services/qsofa.py` | `48b69f39f7b789c5f12f005931c9d02cc9b8da562c9aecee804d594530bab8ce` | match |
| `src/intensicare/services/domain_sepsis.py` (consumidor do qSOFA) | `853d2e38a8167d28e7eb242872e871024abe00b4868fc22f7c02502f99d3ccf8` | match |
| `src/intensicare/services/sepsis_input_provider.py` | `650bdd8c512fd08e673cde124269dd5c05a214ac07510011d53954cdd738b1cb` | match |
| `_work/alerts/sepse.yaml` (raiz — alerta qSOFA autônomo) | `1af8062d535ff0a9efa12a1606c7b37b975bd0635a8800f155491e958ced5dfa` | match |
| `_work/alerts/pathways/sepse.yaml` (pathway v4 — critérios qSOFA) | `b84c9693295f5d820cb2796b6a789f10cfb9200409741af4e0ba78b7ad4ec7f0` | match |
| `tests/test_qsofa.py` | `ed463f369f95d1a2ecd1766b5f095b149f78815a35b0927cdb43d590b3465e13` | **não está no manifesto — hasheado no momento da revisão (hash-and-note)** |

Não existe documento de regra dedicado ao qSOFA em `docs/rules/` (grep por "qsofa"
atinge apenas registros de cluster sepse/sedacao/estabilidade, revisados em
`sepse-pathway-clinical-review.md`).

## 2. Fórmula conforme implementada (verbatim, `services/qsofa.py`)

Constantes — `qsofa.py:25-28`:

```python
QSOFA_HIGH_RISK_MIN = 2  # total >= 2 (of 3) -> high risk for sepsis
QSOFA_RR_TACHYPNEA_MIN = 22  # respiratory rate >= 22/min -> 1 point
QSOFA_SBP_HYPOTENSION_MAX = 100  # systolic BP <= 100 mmHg -> 1 point
QSOFA_GCS_NORMAL = 15  # GCS < 15 (altered mentation) -> 1 point
```

Funções de critério — `qsofa.py:79-81, 96-98, 113-115`:

```python
    if rr is None:
        return 0, "missing"
    return (1, None) if rr >= QSOFA_RR_TACHYPNEA_MIN else (0, None)
...
    if sbp is None:
        return 0, "missing"
    return (1, None) if sbp <= QSOFA_SBP_HYPOTENSION_MAX else (0, None)
...
    if gcs is None:
        return 0, "missing"
    return (1, None) if gcs < QSOFA_GCS_NORMAL else (0, None)
```

Agregação — `qsofa.py:138-164`: três escores de critério independentes somados
(`total = rr_score + sbp_score + gcs_score`, `qsofa.py:158`), lista
`missing_criteria` coletada por critério (`qsofa.py:141-150`). Limiar —
`qsofa.py:50-59`: `is_high_risk = total_score >= 2`; `risk_level` é o binário
`"high_risk"` / `"low_risk"`.

**Lógica de combinação, dita com precisão:** cada um dos três critérios é um
ponto binário independente (sem estrutura AND/OR entre os cortes); a condição de
triagem positiva é `soma >= 2`, ou seja, 2-de-3. Isso corresponde à estrutura do
instrumento publicado.

## 3. Definição autoritativa

- **Singer M, Deutschman CS, Seymour CW, et al.** The Third International
  Consensus Definitions for Sepsis and Septic Shock (Sepsis-3). *JAMA*.
  2016;315(8):801-810. doi:10.1001/jama.2016.0287,
  <https://pmc.ncbi.nlm.nih.gov/articles/PMC4968574/> — critérios qSOFA,
  verbatim: "respiratory rate of 22/min or greater, altered mentation, or
  systolic blood pressure of 100 mm Hg or less"; positivo em ≥2 de 3;
  destinado a "out-of-hospital, emergency department, or general hospital ward
  settings" para identificar pacientes adultos **com suspeita de infecção**
  com maior probabilidade de desfecho ruim. Sobre a mentação: a derivação do
  task force usou "Glasgow Coma Scale score of 13 or less", mas optou por
  "emphasize altered mentation because it represents any Glasgow Coma Scale
  score less than 15" (citações mantidas em inglês, texto literal da fonte).
- **Evans L, Rhodes A, Alhazzani W, et al.** Surviving Sepsis Campaign 2021.
  *Crit Care Med* 2021;49(11):e1063-e1143 / *Intensive Care Med*
  2021;47:1181-1247. doi:10.1007/s00134-021-06506-y — recomendação de
  rastreio citada em §6.

## 4. Tabela de discrepâncias — `services/qsofa.py` vs Sepsis-3

| # | Item | Achado | Veredito | Evidência |
|---|---|---|---|---|
| Q-01 | Corte de FR | `>= 22` /min | MATCH ("22/min or greater") | `qsofa.py:26,81` |
| Q-02 | Corte de PAS | `<= 100` mmHg | MATCH ("100 mm Hg or less") | `qsofa.py:27,98` |
| Q-03 | Corte de mentação | `GCS < 15` | MATCH (operacionalização declarada do Sepsis-3, "any Glasgow Coma Scale score less than 15"; note que a coorte de derivação usou GCS ≤13 — a V2 deve escolher uma e citá-la) | `qsofa.py:28,115` |
| Q-04 | Limiar | `>= 2` de 3 | MATCH | `qsofa.py:25,52` |
| Q-05 | Condição de suspeita de infecção | **Ausente do scorer.** `calculate_qsofa` avalia qualquer paciente; o gate de infecção existe apenas em um consumidor (`domain_sepsis._eval_screen_01`) | **DEV (definicional)** — o significado publicado do qSOFA é condicional à suspeita de infecção; um número de qSOFA sem gate em uma população de UTI indiferenciada é um uso diferente, sem evidência (candidate-inventory CAND-0004; PH-04 → HAZ-0036). | `qsofa.py:123-164`; `domain_sepsis.py:276-278` |
| Q-06 | Ambiente de cuidado | A docstring do módulo promove o qSOFA sem restrição de ambiente; o Sepsis-3 o escopa para ambientes fora de UTI (em UTI, o SOFA completo é o instrumento recomendado). O arquivo de alerta raiz condiciona um alerta a `icu_setting == false` (`_work/alerts/sepse.yaml:23-36`) — o *único* lugar onde a condição de ambiente sobrevive — mas nenhum código calcula `icu_setting` (grep de `src/` não encontra produtor), então o gate é estruturalmente inavaliável. | **DEV** | `qsofa.py:1-10`; `_work/alerts/sepse.yaml:30-32` |
| Q-07 | Enquadramento de propósito | Docstring: "Identifies patients at high risk for sepsis"; enquadramento da propriedade de resultado `sepsis` (`is_high_risk`), rótulo de faixa do pathway "Alta probabilidade de sepse" (v4 `crit-sep-qsofa`) | **DEV (caracterização incorreta)** — o Sepsis-3 enquadra o qSOFA como preditor de *desfecho ruim* (mortalidade, permanência prolongada em UTI) em suspeita de infecção, explicitamente **não** uma declaração diagnóstica ou de probabilidade-de-sepse, e o rótulo de faixa v4 "Disfunção orgânica" para qSOFA=2 confunde o qSOFA com o critério de disfunção orgânica baseado no SOFA. | `qsofa.py:4,9-10,50-52`; `_work/alerts/pathways/sepse.yaml:97-104` |
| Q-08 | Validação de entrada | Sem checagens de faixa: FR de 0 pontua 0 (bradipneia/apneia não contribui em nada — fiel ao instrumento, mas vale registrar), valores de GCS fora de 3-15 são aceitos, valores negativos são aceitos | **DEV (menor)** | `qsofa.py:79-115`; `tests/test_qsofa.py:39` |
| Q-09 | Override pré-computado no consumidor | `domain_sepsis._compute_qsofa_points`: se uma chave de entrada `qsofa` está presente, ela é confiada verbatim — `_num` converte `True → 1.0`, floats são truncados por `int()`, e não existe checagem de faixa 0-3 (um payload `qsofa: 7` é aceito) | **DEV (consumidor)** — o scorer canônico pode ser contornado por um valor upstream não validado. | `domain_sepsis.py:247-250, 163-172` |
| Q-10 | Frescor | `sepsis_input_provider` alimenta o qSOFA a partir do **último VitalSign persistido, sem limite de idade** (`_fetch_latest_vital` ordena por `recorded_at desc`, sem janela) | **DEV (HAZ-0006)** — um trio RR/PAS/GCS arbitrariamente obsoleto pontua como atual. VAL-0023 não resolvido. | `sepsis_input_provider.py:126-134, 374` |

**Contagem de discrepâncias: 6 DEV (Q-05, Q-06, Q-07, Q-08, Q-09, Q-10); 4 MATCH
(Q-01..Q-04).** Os três cortes e o limiar 2-de-3 são exatamente Sepsis-3; todo
desvio está nas *condições de uso*, não na aritmética.

Três piores: **Q-05** (condição de infecção ausente do próprio instrumento),
**Q-09** (escore pré-computado não validado contorna o scorer), **Q-10**
(obsolescência de entrada sem limite).

## 5. Coerção a zero do HAZ-0005 — rastreada por critério

| Critério | Entrada ausente | Comportamento | Linhas decisivas |
|---|---|---|---|
| Frequência respiratória | `rr=None` | `(0, "missing")` — contribui 0 para a soma | `qsofa.py:79-80` |
| PA sistólica | `sbp=None` | `(0, "missing")` | `qsofa.py:96-97` |
| Mentação | `gcs=None` | `(0, "missing")` | `qsofa.py:113-114` |
| Total | todos `None` | `total_score=0`, `is_high_risk=False`, `missing_criteria=['respiratory_rate','systolic_bp','gcs']` — um paciente nunca avaliado é tipado de forma idêntica a um paciente com triagem negativa | `qsofa.py:138-164` |

Consequências a jusante, verificadas:

- `domain_sepsis._compute_qsofa_points` retorna a soma parcial coagida 0-2 como
  um int puro; `_eval_screen_01` então reporta "qSOFA=0 < 2" como uma *string de
  motivo*, não um status (`domain_sepsis.py:280-288`).
- `sepsis_input_provider._build_sirs_qsofa_inputs` torna a coerção
  **incondicional na fronteira do pathway**: enquanto toda outra chave de
  entrada é deliberadamente *omitida quando desconhecida* ("never guessed,
  never defaulted", `sepsis_input_provider.py:16-25`), as duas chaves
  `sirs_count`/`qsofa_score` "are always present" mesmo sem nenhuma medição
  subjacente — a própria docstring do módulo nomeia isso "inherited canonical
  behavior, not invented here" (`sepsis_input_provider.py:21-25, 197-231,
  360-361`). Um paciente sem nenhum sinal vital, portanto, entra no pathway
  declarativo com `qsofa_score: 0`.
- Evidência de intenção: `tests/test_qsofa.py:31,55,79` afirmam
  `(None, (0, "missing"))` por critério — projetado e reforçado por teste.

**Veredito HAZ-0005: confirmado para os três critérios e para o total; agravado
na fronteira do provider, onde o único componente com um contrato de omissão
segura abre uma exceção explícita exatamente para esses dois escores.** Para um
instrumento 2-de-3, a direção clínica é de mão única: a ausência de dados só
pode *suprimir* uma triagem positiva (falsa tranquilidade), nunca criar uma.

## 6. POSICIONAMENTO PÓS-2021 do qSOFA — seção obrigatória

SOURCE — Surviving Sepsis Campaign 2021 (Evans L, et al., *Crit Care Med*
2021;49(11):e1063-e1143 / *Intensive Care Med* 2021;47:1181-1247,
doi:10.1007/s00134-021-06506-y), recomendações de rastreio:

> "We recommend **against** using qSOFA compared with SIRS, NEWS, or MEWS as a
> single screening tool for sepsis or septic shock." — **strong
> recommendation, moderate-quality evidence.** (citação mantida em inglês,
> texto literal da diretriz, incluindo a força de recomendação GRADE.)

(Recomendação complementar: programas de melhoria de performance para sepse
devem incluir rastreio de sepse e procedimentos operacionais padrão; o
racional da diretriz para a recomendação sobre o qSOFA é a *sensibilidade*
pobre do qSOFA como rastreio — ele é específico, mas deixa passar pacientes
sépticos demais na apresentação.)

Aplicação aos artefatos legados, por artefato:

1. **`sepsis_qsofa_alert` (`_work/alerts/sepse.yaml:23-36`)** —
   `qsofa_score >= 2 AND icu_setting == false`, severidade alta,
   guideline_source cita Singer 2016. Isso é estruturalmente um **rastreio de
   sepse por qSOFA de instrumento único** — exatamente o padrão contra o qual
   a SSC 2021 emite uma recomendação forte. A citação de 2016 era defensável
   quando escrita; está superada. Manter esse alerta na V2 implementaria uma
   prática que a diretriz autoritativa atual recomenda fortemente contra.
   **Veredito: REJECT.**
2. **`ALERT-SEPSIS-SCREEN-01` / v4 `crit-sep-screen`**
   (`domain_sepsis.py:269-288`; `_work/alerts/pathways/sepse.yaml:218-245`) —
   gate de infecção AND (qSOFA ≥2 **OR** SIRS ≥2). Isso *não* é um rastreio de
   qSOFA de instrumento único: o OR com SIRS restaura a sensibilidade, e o
   gate de infecção respeita a condição de uso do instrumento. Está, contudo,
   autorrotulado "SSC-2021 RATIFIED" — um exagero: a SSC 2021 não endossa
   nenhum composto específico, e seus instrumentos de rastreio preferidos são
   NEWS/MEWS/SIRS; um composto qSOFA-OU-SIRS montado localmente é um
   **instrumento institucional não validado** que exige evidência própria. A
   proveniência "RATIFIED (RAT-SEPSE-01/02)" remonta a
   `docs/plan/_work/ratification-decisions.yaml:1-3`, cuja autoridade
   declarada é "repository owner delegation (session directive …)" — não uma
   autoridade clínica nomeada (ver `sofa-review.md` D-19). **Veredito:
   VALIDATE (conceito), REJECT (a alegação de ratificação).**
3. **Critério graduado v4 `crit-sep-qsofa`** (`pathways/sepse.yaml:85-105`) —
   uma faixa graduada de qSOFA autônoma (0-2 normal / 2 urgente "Disfunção
   orgânica" / 3 crítico "Alta probabilidade de sepse") **sem gate de
   infecção e sem gate de ambiente** no próprio critério. Como direcionador de
   exibição de severidade, ela recria o padrão de instrumento único com
   rótulos adicionalmente enganosos (Q-07). **Veredito: REJECT como
   direcionador de alerta; no máximo VALIDATE como *componente exibido*
   subordinado a uma política de rastreio ratificada.**

INFERENCE — implicações para qualquer alerta V2 orientado a qSOFA: (a) um
alerta de rastreio de sepse baseado apenas em qSOFA não pode ser admitido sem
contradizer uma recomendação forte da diretriz vigente de 2021 — o ônus da
evidência para derrubá-la está sobre uma autoridade clínica nomeada, não sobre
o precedente legado; (b) o qSOFA ainda pode legitimamente aparecer como
*componente* de um rastreio multi-sinal ou como exibição contextual, mas esse
composto é um instrumento novo que precisa ser evidenciado separadamente
(disciplina PROMPT:418); (c) a questão do ambiente de UTI é mais aguda do que
o legado reconheceu — a população declarada do IntensiCare é UTI, onde o
Sepsis-3 recomenda o SOFA completo e onde a base de evidência do qSOFA é mais
fraca; VAL-0009 (ambientes de cuidado aprovados) condiciona essa decisão.
Referência cruzada: a lacuna de fonte de suspeita de infecção do CAND-0004
("no identified source of any kind") permanece não resolvida e é decisiva —
ver `sepse-pathway-clinical-review.md` §5.

## 7. Vereditos clínicos — PROPOSAL, conforme legacy-import-policy §4

| Artefato | Veredito | Racional |
|---|---|---|
| Cortes do qSOFA e limiar 2-de-3 (`qsofa.py:25-28,52`) | **VALIDATE** | Numericamente exatos ao Sepsis-3; utilizáveis em uma especificação V2 apenas como valores de referência re-derivados e citados, e apenas dentro de um contexto de uso ratificado (gate de infecção + ambiente) que o legado não tem. A operacionalização GCS <15 vs ≤13 deve ser explicitamente escolhida e citada. |
| Tratamento de entrada ausente (§5) | **REJECT** | Mecanismo do HAZ-0005, reforçado por teste; superado pela álgebra de status de avaliação da V2 (SAF-0001/0002). Carregar as linhas de §5 como vetores de sonda de entrada ausente. |
| Conceito de metadados `missing_criteria` | **TRANSFORM** | Mesma disposição de `SOFAResult.missing_components` (`sofa-review.md` §8): a intenção sobrevive como status de avaliação de primeira classe, não como lista consultiva. |
| Alerta qSOFA autônomo (`_work/alerts/sepse.yaml:23-36`) | **REJECT** | Contradiz a recomendação forte da SSC 2021 (§6.1). |
| Conceito de rastreio qSOFA-OU-SIRS + gate de infecção (SCREEN-01 / crit-sep-screen) | **VALIDATE** | Composto clinicamente plausível; instrumento não validado; exige titularidade clínica nomeada, uma fonte de suspeita de infecção evidenciada, e evidência de performance própria antes da admissão. |
| Passthrough de `qsofa` pré-computado (`domain_sepsis.py:247-250`) | **REJECT** | Override não validado do scorer canônico. |
| Enquadramento "high risk for sepsis" / "Alta probabilidade de sepse" (Q-07) | **REJECT** | Deturpa a alegação validada do instrumento; a redação para qualquer superfície V2 é validada por clínico em pt-BR conforme evaluation-status-semantics.md §6. |

## 8. Elementos sobreviventes propostos para especificações V2 (PROPOSAL)

1. Os três cortes e o limiar 2-de-3, citados a Singer 2016, com a decisão de
   operacionalização do GCS (qualquer GCS <15 vs o ≤13 da derivação) registrada
   como item de ratificação explícito.
2. A regra de que a saída do qSOFA só é interpretável sob uma condição de
   suspeita de infecção documentada — como *precondição no tipo*, não como
   convenção de consumidor (achado de gate do CAND-0004).
3. A recomendação de rastreio da SSC 2021 como restrição permanente à admissão
   no portfólio: nenhum alerta de sepse por qSOFA de instrumento único (§6).
4. As linhas de §5 como vetores de sonda de entrada ausente do SAF-0002,
   incluindo o caso de fronteira do provider (zero sinais vitais persistidos →
   `qsofa_score: 0` emitido) como teste de regressão nomeado.

*Revisado por rodaquino-OMNI (revisor responsável de registro, GDEC-0003). Sem
PHI; todos os valores são limiares publicados ou exemplos sintéticos.*
