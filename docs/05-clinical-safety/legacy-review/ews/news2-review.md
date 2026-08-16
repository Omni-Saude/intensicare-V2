---
id: LEGREV-EWS-NEWS2
title: Registro de revisão legada — NEWS2 conforme implementado no IntensiCare V1 vs RCP NEWS2 (2017)
label: PROPOSAL
statement: >
  Revisão forense de cada escore, regra e limiar do NEWS2 implementado no
  repositório legado V1, verificado a partir do código-fonte no pin do
  ciclo-1, contra a definição publicada do Royal College of Physicians NEWS2
  (2017), verificada a partir do relatório do próprio emissor. O veredito é
  uma PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).
provenance:
  source_repo: intensicare (legado V1, READ-ONLY) + intensicare-V2 + rcp.ac.uk
  path_or_url: /Users/familia/intensicare (ver tabela de citação por arquivo, seção 0)
  commit_sha_or_version: 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79 (HEAD legado no pin; SHA-256 por arquivo abaixo)
  section_or_lines: referências de linha por citação ao longo do documento
  date_collected: 2026-08-15
  collector: revisor forense de EWS legado (agente da Tarefa 1, ciclo-1); revisor responsável rodaquino-OMNI
  transformation: >
    traduzido EN→pt-BR, tranche 3, GDEC-0008 item 8 (trechos de código verbatim
    mais análise do revisor; faixas publicadas transcritas do PDF do emissor)
  confidence: alta
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  requirements: [SAF-0001, SAF-0002, SAF-0003]
  hazards: [HAZ-0005]
  adrs: []
  tests: []
  pr: null
supersedes: null
superseded_by: null
---

> Traduzido EN→pt-BR em 2026-08-16 (GDEC-0008 item 8, tranche 3); original EN preservado no histórico git.

# NEWS2 — registro de revisão legada (ciclo 1, Tarefa 1)

> **PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).**
> Este registro revisa; não aprova nada. Vocabulário de veredito conforme
> `docs/00-governance/legacy-import-policy.md` §4. Candidato: **CAND-0001**
> (`docs/05-clinical-safety/pathway-portfolio/candidate-inventory.md`).

## 0. Base de citação — arquivos e hashes

Todos os caminhos legados são relativos a `/Users/familia/intensicare/` no HEAD
`1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79` (2026-08-15). Arquivos marcados
**[pin]** correspondem a
`docs/archive/legacy-provenance/legacy-pin-cycle-1.md`; arquivos marcados
**[reviewer-hash]** **não estão naquele manifesto** e foram hasheados por este
revisor no momento da revisão (`shasum -a 256`, 2026-08-15) — OBSERVED.

| Arquivo | SHA-256 | Manifesto |
|---|---|---|
| `src/intensicare/services/news2.py` | `d3399fe2bb9853222dde6b16167a4f6093c6daac7b1559474b628deeff246bc8` | [pin] |
| `src/intensicare/services/ews_nrt_runner.py` | `9ad826e9e31be584a17285a721697243e8654d9209ca68b9abec1230ed3c7fe6` | [pin] |
| `src/intensicare/services/vitals.py` | `dcd1e76e7086106e659dce52e59a374350d8a4a662b63d9959a562dbf32eff64` | [pin] |
| `src/intensicare/services/threshold_resolver.py` | `0b02d8ace9bdc89695eeaa2e08d81b2a72070c27624265190b2005883c20ee6f` | [pin] |
| `src/intensicare/services/dashboard.py` | `ae60425f025bc7387c720dfe2c35fa89b0c2e053d33e2ad81d78828a68ac1489` | [pin] |
| `src/intensicare/models/clinical_score.py` | `fc987ad0d037b1f153451240178dc12ab988a1104d7bc4a88dc460972234ff43` | [pin] |
| `src/intensicare/schemas/vitals.py` | `f6afffd444038f2d1dec19d7047a0013f908d9a7106c52ce9895cbc1ba14308f` | [pin] |
| `alembic/versions/0038_seed_default_threshold_config.py` | `c11d640d1a29aab2d99e39a741d35bceec2a6d688e174db3cbded2bf089c4486` | [pin] |
| `src/intensicare/mllp_listener.py` | `2aaf592bf5855205aaf816c04386457ab7ee54158f3d7037df4d30cbb7543d94` | [reviewer-hash] |
| `alembic/versions/0008_seed_news2_v2_0_0.py` | `cb98588ea4460b355c2c3ac84d314c838f405903150b7019392e9a69db0d51c6` | [reviewer-hash] |
| `alembic/versions/0021_activate_news2_v3_0_0.py` | `2874d0306946472838a612ca73d78a311e8885cdbf5c11bf28172fcc36db15f4` | [reviewer-hash] |
| `alembic/versions/0029_ratification_record.py` | `cfd0e7e40d62f628fa6335018a547a6d418931ce5861f239bb3f2f5f7ce1afbe` | [reviewer-hash] |
| `docs/plan/_work/alerts/early-warning-scores.yaml` | `712d9ccde209d099f80c4d5abb11e77e33564e03f347f931a363537c1031e9b8` | [reviewer-hash] |
| `docs/audit/fullspectrum/CLINICAL_SIGNOFF.md` | `7499a00ddfa6309f0190177d9474ba8e0db781d515bd3cbe72b890e74c178f91` | [reviewer-hash] |
| `tests/test_news2.py` (apenas evidência de intenção) | `bbf8aaf7261f6e19659d7f7638d7cc988385ef00e317a5fc238f8f64a9e4ced0` | [reviewer-hash] |
| `tests/test_ews_nrt.py` (apenas evidência de intenção) | `89091fe372bb90c2131491d63b6bbe1ae2356e38854ffaa777c951ade422bde8` | [reviewer-hash] |
| `tests/property/test_scorer_properties.py` (apenas evidência de intenção) | `154bc0b0aaa41392ce25f36df8a8a5fde277f15d01a7995cc96ac185b276e964` | [reviewer-hash] |

## 1. Fórmula conforme implementada (OBSERVED, a partir da fonte)

Motor de scoring: `src/intensicare/services/news2.py`. Sete componentes
somados (`calculate_news2`, news2.py:244-308): frequência respiratória, SpO2,
O2 suplementar, PA sistólica, frequência cardíaca, consciência (string AVPU),
temperatura. Constante de versão `NEWS2_VERSION = "NEWS2-v3.0.0"`
(news2.py:14).

Motor de faixas (news2.py:76-98), núcleo verbatim:

```python
def _score_numeric(value, thresholds):
    if value is None:
        return 0
    if isinstance(value, float):
        value = round(value, 1)
    for lo, hi, score in thresholds:
        lo_ok = lo is None or value >= lo
        hi_ok = hi is None or value <= hi
        if lo_ok and hi_ok:
            return score
    return 0
```

Faixas implementadas (todas OBSERVED nas linhas citadas):

- Frequência respiratória (news2.py:101-115): `<=8:3, 9-11:1, 12-20:0, 21-24:2, >=25:3`.
- SpO2 Escala 1, não hipercápnico (news2.py:161-170): `>=96:0, 94-95:1, 92-93:2, <=91:3`.
- SpO2 Escala 2, `hypercapnic=True, on_o2=True` (news2.py:139-148):
  `>=97:3, 95-96:2, 93-94:1, <=92:0`.
- SpO2 Escala 2, `hypercapnic=True, on_o2=False` (news2.py:149-159):
  `>=93:0, 88-92:1, 86-87:2, 84-85:3, <=83:3`.
- O2 suplementar (news2.py:173-175): `return 2 if on_o2 else 0`.
- PA sistólica (news2.py:178-192): `<=90:3, 91-100:2, 101-110:1, 111-219:0, >=220:3`.
- Frequência cardíaca (news2.py:195-210): `<=40:3, 41-50:1, 51-90:0, 91-110:1, 111-130:2, >=131:3`.
- Consciência (news2.py:213-224): `None -> 0`; `"A" -> 0`; **qualquer outra
  string -> 3**.
- Temperatura (news2.py:227-241): `<=35.0:3, 35.1-36.0:1, 36.1-38.0:0, 38.1-39.0:1, >=39.1:2`.
- Seleção de Escala 2 (news2.py:275-284): `use_scale2 = hypercapnic`;
  `on_o2=bool(supplemental_o2)` é passado para `score_spo2`.
- Risco agregado (news2.py:22-27, 51-58): `>=7 -> "high"`, `>=5 -> "medium"`,
  senão `"low"`.
- Propriedade de escore vermelho (news2.py:60-73): `requires_urgent_assessment`
  é verdadeiro quando o total `>=5` **ou** qualquer um dos seis componentes
  fisiológicos é igual a 3 (O2 suplementar excluído).

Pontos de chamada em produção (OBSERVED):

- Ingestão (vitals.py:310-334): `calculate_news2(..., hypercapnic=False, ...)`
  — `False` hardcoded; resultado persistido como
  `ClinicalScore(score_type="NEWS2", algorithm_version=NEWS2_VERSION,
  components=asdict(...))` (models/clinical_score.py:13-32).
- Alerting (vitals.py:396-398 → `alert_engine.process_clinical_score`):
  compara **apenas o agregado** contra `threshold_config`
  watch/urgent/critical (alert_engine.py:50-59); os padrões do NEWS2 são
  semeados watch=3, urgent=5, critical=7
  (0038_seed_default_threshold_config.py:61-70).
- Runner NRT (ews_nrt_runner.py:206-224): o agregado é calculado com
  `hypercapnic=False` (ews_nrt_runner.py:209), mas o escore vermelho de SpO2
  por parâmetro é calculado como
  `score_spo2(vs.spo2, hypercapnic=bool(vs.supplemental_o2))`
  (ews_nrt_runner.py:220).
- **O runner NRT não tem chamador em produção.** `process_ews_nrt` /
  `process_ews_after_vital_insert` são importados apenas por testes (grep em
  `src/`, 2026-08-15 — OBSERVED); `ingest_vitals` nunca os chama apesar da
  instrução na docstring (ews_nrt_runner.py:685).
- Severidade de leito (dashboard.py:79-115): `derive_bed_severity` mapeia o
  agregado do NEWS2 pelas faixas watch/urgent/critical e tem piso em
  `"normal"` — "a bed with no alerts, no active pathways, and no scores is
  still 'normal'" (dashboard.py:100-107).

## 2. Definição publicada autoritativa (SOURCE, verificada a partir do emissor)

**Royal College of Physicians. *National Early Warning Score (NEWS) 2:
Standardising the assessment of acute-illness severity in the NHS.* Relatório
atualizado de um working party. Londres: RCP, 2017.** URL (PDF do emissor,
obtido e lido em 2026-08-15):
`https://www.rcp.ac.uk/media/a4ibkkbf/news2-final-report_0_0.pdf` (páginas do
relatório 29-31, 35 = Chart 1, Chart 2, Chart 3).

Chart 1 (transcrito do PDF obtido — SOURCE):

| Parâmetro | 3 | 2 | 1 | 0 | 1 | 2 | 3 |
|---|---|---|---|---|---|---|---|
| Frequência respiratória (por min) | ≤8 | | 9–11 | 12–20 | | 21–24 | ≥25 |
| SpO2 Escala 1 (%) | ≤91 | 92–93 | 94–95 | ≥96 | | | |
| SpO2 Escala 2 (%) | ≤83 | 84–85 | 86–87 | 88–92; ≥93 em ar ambiente | 93–94 em O2 | 95–96 em O2 | ≥97 em O2 |
| Ar ou oxigênio? | | Oxigênio | | Ar | | | |
| PA sistólica (mmHg) | ≤90 | 91–100 | 101–110 | 111–219 | | | ≥220 |
| Pulso (por min) | ≤40 | | 41–50 | 51–90 | 91–110 | 111–130 | ≥131 |
| Consciência | | | | Alerta | | | CVPU |
| Temperatura (°C) | ≤35,0 | | 35,1–36,0 | 36,1–38,0 | 38,1–39,0 | ≥39,1 | |

Chart 2 (SOURCE, estrutura verbatim): agregado 0–4 = Baixo → resposta baseada
na enfermaria; **escore vermelho (3 em qualquer parâmetro individual) =
Baixo–médio → resposta urgente baseada na enfermaria**; agregado 5–6 = Médio →
limiar-chave para resposta urgente; agregado ≥7 = Alto → resposta urgente ou
de emergência.

Governança da Escala 2 (SOURCE, relatório p.31): "A competent clinical
decision-maker should make the decision about whether to use the Scale 2
oxygen saturation section of the NEWS chart, which is specific to patients
with hypercapnic respiratory failure (usually COPD) who require their
'usual' oxygen saturations to be set at 88–92% ... the Scale 1 oxygen
saturation section of the chart should be clearly crossed out." (citação
mantida em inglês, texto literal do relatório). Nota de rodapé do Chart 3:
"ONLY use Scale 2 under the direction of a qualified clinician."

População (SOURCE, relatório §2): "The NEWS was designed for use in patients
aged 16 years and more and is not recommended for use in children aged under
16 years or during pregnancy." (citação mantida em inglês, texto literal).
Consciência pontua confusão de **início novo** ("no score if chronic" —
Chart 3).

**Esclarecimento de dezembro de 2022: NÃO VERIFICADO.** As páginas de
recursos do RCP
(`https://www.rcp.ac.uk/resources/national-early-warning-score-news-2/`,
obtidas em 2026-08-15) mostram uma edição especial de *Clinical Medicine* de
novembro de 2022, mas nenhum documento de esclarecimento de dezembro de
2022. Nenhuma alegação dele é usada nesta revisão. VALIDATION REQUIRED se a
V2 quiser citá-lo.

## 3. Análise de discrepâncias — implementado vs publicado

Fiel (OBSERVED = SOURCE): frequência respiratória; SpO2 Escala 1; O2
suplementar (+2, oxigênio vs ar); PA sistólica; pulso; temperatura;
consciência Alerta=0 / CVPU=3 (caminho API); cortes agregados 5 e 7. As
entradas float são arredondadas para 1 casa decimal antes da classificação
em faixas (news2.py:87-90), correspondendo à resolução de 0,1 °C do chart;
as comparações de faixa são inclusivas e contíguas — nenhum defeito de
lacuna encontrado em Escala 1/FR/PAS/FC/temperatura.

Discrepâncias (D-1 … D-9):

| # | Item | Implementado | Publicado (RCP 2017) | Direção / severidade |
|---|---|---|---|---|
| D-1 | Escala 2, hipercápnico **em O2**, SpO2 baixo | `<=92 -> 0` (news2.py:144-147) | ≤83→3, 84–85→2, 86–87→1, 88–92→0 (as faixas baixas se aplicam independentemente do oxigênio) | **Subestima hipoxemia profunda para 0** (p.ex. SpO2 70% em O2 pontua 0 vs 3 publicado). O defeito de faixa única mais perigoso do arquivo. |
| D-2 | Escala 2, hipercápnico **fora de O2** | 88–92→1, 86–87→2, 84–85→3 (news2.py:150-159) | 88–92→0, 86–87→1, 84–85→2 | Superestima em uma faixa, incluindo pontuar a faixa-alvo BTS de 88–92% como anormal (direção de fadiga de alarme). ≤83→3 e ≥93 em ar ambiente→0 correspondem. |
| D-3 | Mecanismo de seleção da Escala 2 | O parâmetro `hypercapnic` existe, mas nenhuma superfície de ingestão o fornece: `schemas/vitals.py` não tem esse campo (schemas/vitals.py:16-88); ambos os pontos de chamada hardcodam `hypercapnic=False` (vitals.py:313; ews_nrt_runner.py:209) | Escala 2 escolhida por "a competent clinical decision-maker" e usada para insuficiência respiratória hipercápnica | **A Escala 2 é inalcançável em todo caminho de agregado em produção.** Um paciente DPOC/hipercápnico é sempre pontuado na Escala 1 (ver §4.1). |
| D-4 | Seleção incorreta de Escala 2 no caminho de parâmetro vermelho do NRT | `score_spo2(vs.spo2, hypercapnic=bool(vs.supplemental_o2))` (ews_nrt_runner.py:220) — O2 suplementar seleciona a Escala 2, e `on_o2` tem padrão False, então as faixas de Escala 2 fora-de-O2 se aplicam | O2 suplementar nunca seleciona a Escala 2 | Qualquer paciente em O2 não hipercápnico com SpO2 88–92 recebe escore de parâmetro 1 em vez do vermelho 3 da Escala 1 → **suprime o gatilho de parâmetro-único-vermelho**; também internamente inconsistente com o agregado (Escala 1 computada) no mesmo snapshot. Código morto hoje (runner não conectado), mas uma armadilha latente. |
| D-5 | Níveis de risco | Apenas `low / medium / high` (news2.py:51-58; re-derivado em vitals.py:511-519) | Quatro níveis: 0–4 Baixo; **escore vermelho = Baixo–médio**; 5–6 Médio; ≥7 Alto | O nível Baixo–médio (vermelho único) está ausente da categoria persistida/exposta; `requires_urgent_assessment` (news2.py:60-73) captura o gatilho, mas **não tem chamador em produção** (grep 2026-08-15). |
| D-6 | Alerting de escore vermelho | O alerting em produção compara apenas o agregado (alert_engine.py:50-59). O alerta de parâmetro vermelho existe apenas no runner NRT não conectado (ews_nrt_runner.py:265-316) e em um YAML de design (early-warning-scores.yaml:11-58) | Escore de 3 em qualquer parâmetro único → revisão urgente baseada na enfermaria | Parcialmente mitigado pelo watch=3 padrão (um único vermelho eleva o agregado para ≥3 → alerta "watch"), mas a severidade é classificada incorretamente (watch vs urgent) e a mitigação desmorona se um tenant elevar `watch_threshold` (threshold_resolver.py:50-117 permite overrides por leito/unidade/tenant sem piso). |
| D-7 | Consciência via caminho HL7 | O parser MLLP aceita apenas `A/V/P/U`; `"C"` → `None` (mllp_listener.py:200-204) → consciência pontua **0** (news2.py:219-220) | Confusão nova (C) pontua 3 | **Confusão de início novo chegando via HL7 ORU pontua 0.** O caminho da API está correto (`AVPU_VALUES` admite C, schemas/vitals.py:13; o scorer dá 3). Subestimação dependente de caminho. |
| D-8 | Fallback de consciência | Qualquer string não-"A" → 3 (news2.py:221-224); o GCS é coletado (schemas/vitals.py:73), mas nunca mapeado para consciência quando o AVPU está ausente | Avaliação ACVPU; confusão crônica pontua 0 ("no score if chronic", Chart 3) | Direção de superestimação para tokens não reconhecidos (falha alto, aceitável); mas confusão crônica não pode ser representada, e um paciente comatoso com GCS registrado e AVPU ausente pontua 0 (relaciona-se ao HAZ-0005). |
| D-9 | Gating populacional | Nenhum em nenhum ponto do caminho de scoring/ingestão (nenhuma checagem de idade, nenhuma de gravidez — OBSERVED em news2.py, vitals.py, schemas/vitals.py) | Projetado para ≥16 anos; não para crianças <16 nem gravidez | Saída fora da população é produzida silenciosamente. Alimenta VAL-0006/VAL-0007 (`docs/02-users-and-workflows/g1-validation-backlog.md`). |

Achado de identidade de versão (OBSERVED): as migrações 0008 e 0021 descrevem
o comportamento de Escala 2 do NEWS2-v2/v3 como "supplemental_o2 now
auto-activates Scale 2" e "84-85: score 2 → 3" alegado "per RCP 2017"
(0008_seed_news2_v2_0_0.py:8-11; 0021_activate_news2_v3_0_0.py:7-12, 34-38),
e a 0029 registra o NEWS2-v3.0.0 como ratificado com esse comportamento
(0029_ratification_record.py:13-15). Ambas as alegações contradizem o chart
publicado (Escala 2 84–85 = 2; O2 suplementar nunca seleciona a escala), e o
código **atual** desde então inverteu a auto-ativação (news2.py:118-122,
275-280) **sem mudar a string de versão** — então o
`algorithm_version = "NEWS2-v3.0.0"` persistido não identifica o algoritmo
que de fato rodou. `RAT-NEWS2-SCALE-2` não aparece na tabela aprovada de
`docs/audit/fullspectrum/CLINICAL_SIGNOFF.md` (apenas itens de MEWS e de
limiar aparecem), então a trilha de "ratificação" da Escala 2 termina em uma
docstring de migração. INFERENCE: o registro de ratificação legado do NEWS2
não pode ser confiado.

## 4. Avaliações obrigatórias específicas do NEWS2

### 4.1 SpO2 Escala 1 vs Escala 2 (insuficiência respiratória hipercápnica)

- **Implementado de alguma forma?** Sim, no scorer (news2.py:123-170) —
  ambos os ramos de Escala 2 existem.
- **Como é selecionado?** Apenas por um argumento de função `hypercapnic:
  bool`. Não há flag de paciente, nem prescrição, nem workflow de clínico, e
  nenhum campo de ingestão que possa defini-lo; toda chamada em produção
  passa `False` (vitals.py:313; ews_nrt_runner.py:209). A exigência do RCP de
  uma decisão documentada por um decisor clínico competente não tem
  contrapartida.
- **O que acontece com um paciente DPOC pontuado na Escala 1?** Consequência
  OBSERVED: um paciente hipercápnico mantido na faixa-alvo BTS de 88–92% em
  O2 pontua SpO2 3 (≤91) ou 2 (=92) mais 2 pelo oxigênio — um agregado
  crônico de 4–5 por estar *na meta*, ou seja, superestimação
  sistemática/fadiga de alarme e um parâmetro de SpO2 permanentemente
  vermelho. Reciprocamente, se o ramo de Escala 2 EM-O2 fosse alguma vez
  alcançado, o D-1 pontuaria hipoxemia profunda como 0. Ambas as direções são
  clinicamente erradas; apenas a direção de superestimação é alcançável
  hoje.

### 4.2 Scoring de oxigênio suplementar

`+2 if on_o2 else 0` (news2.py:173-175) corresponde à linha publicada "Air or
oxygen?". Defeito: `None` (desconhecido) é indistinguível de "em ar ambiente"
— ambos pontuam 0 (coerção a zero de um desconhecido; ver §5).

### 4.3 Mapeamento de consciência

String AVPU; A=0, C/V/P/U=3 (news2.py:213-224) — corresponde ao CVPU=3
publicado no caminho da API (ACVPU admitido, schemas/vitals.py:13).
Defeitos: o caminho HL7 rebaixa "C" para None → 0 (D-7); nenhum fallback de
GCS (D-8); nenhuma distinção crônica-vs-nova de confusão; `None` → 0 (§5).

### 4.4 Gatilho de escore vermelho de parâmetro único

Presente em três formas desconectadas, nenhuma efetiva em produção:
propriedade `requires_urgent_assessment` (news2.py:60-73, sem chamador);
gatilho de borda de parâmetro vermelho do runner NRT
(ews_nrt_runner.py:265-316, runner não conectado); YAML de design
ALERT-EWS-NEWS2-DETERIORATION-01 (early-warning-scores.yaml:11-58, nível
"docs/plan"). O comportamento em produção é apenas-limiar-agregado (D-6).

### 4.5 Limiares de gatilho agregado vs alerting implementado

Os publicados 0 / 1–4 / 5–6 / ≥7 mapeiam para os cortes de categoria
implementados 5 e 7 (fiel), mas o alerting usa watch=3 / urgent=5 /
critical=7 configuráveis (0038_seed_default_threshold_config.py:61-70;
resolvedor leito ≻ unidade ≻ tenant, threshold_resolver.py:50-117). watch=3
é uma adição institucional (não RCP); as severidades 5/6 e ≥7 se alinham com
médio/alto. Nenhum piso impede um operador de elevar os limiares acima dos
níveis de gatilho publicados; as mutações são auditadas
(threshold_resolver.py:120-150), mas não limitadas clinicamente.

## 5. Coerção a zero do HAZ-0005 — rastreamento por entrada (OBSERVED a partir da fonte)

Mecanismo verificado a partir da fonte, independentemente da avaliação citada
em `docs/05-clinical-safety/hazard-log.md` HAZ-0005.

| Entrada | Caminho de entrada ausente | Comportamento | Veredito |
|---|---|---|---|
| respiratory_rate | `_score_numeric(None,...)` → news2.py:84-85 `if value is None: return 0` | contribui 0, sem marcador | **coagido a zero** |
| spo2 | news2.py:134-135 `if spo2 is None: return 0` | contribui 0, sem marcador | **coagido a zero** |
| supplemental_o2 | news2.py:175 `return 2 if on_o2 else 0` — `None` é falsy | desconhecido ≡ "em ar ambiente" ≡ 0 | **coagido a zero** |
| systolic_bp | news2.py:84-85 | contribui 0, sem marcador | **coagido a zero** |
| heart_rate | news2.py:84-85 | contribui 0, sem marcador | **coagido a zero** |
| avpu | news2.py:219-220 `if avpu is None: return 0` | contribui 0, sem marcador | **coagido a zero** |
| temperature | news2.py:84-85 | contribui 0, sem marcador | **coagido a zero** |

Nenhum metadado de entrada ausente existe em nenhum lugar do resultado do
NEWS2: `NEWS2Components` define o padrão de todo campo como 0
(news2.py:30-40) e não carrega status; `calculate_news2` nunca inspeciona
quais entradas eram None (news2.py:282-302). O caso de tudo-ausente,
portanto, produz `total_score == 0`, `risk_category == "low"`
(news2.py:54-58), persistido como uma linha `ClinicalScore` real
(vitals.py:320-334) e renderizado como severidade de leito `"normal"`
(dashboard.py:84-90, 114-115). Evidência de intenção: a suíte de testes
*afirma* esse comportamento como correto —
`test_missing_values_default_to_zero` espera `total_score == 0` com toda
entrada None (tests/test_news2.py:477-486), e toda classe de teste por
parâmetro tem um `test_none_returns_zero` (p.ex.
tests/test_news2.py:52-53). A alegação do schema de resposta "None se dados
insuficientes" (schemas/vitals.py:99-101) é falsa para o caminho
implementado — a intenção documentada contradiz a implementação.

**Linha decisiva: news2.py:84-85.** O HAZ-0005 é CONFIRMED para o NEWS2 nas
sete entradas, em severidade E1 conforme registrado.

## 6. Veredito clínico — PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI)

**Veredito: TRANSFORM** (conforme `legacy-import-policy.md` §4), com REJECT e
VALIDATE em nível de elemento como abaixo. Racional (INFERENCE a partir de
§§3–5): o instrumento publicado foi transcrito majoritariamente com
fidelidade no nível de faixa, mas a implementação é insegura como um todo —
dados ausentes são coagidos para tranquilidade (HAZ-0005, todas as sete
entradas), o caminho hipercápnico está simultaneamente errado (D-1, D-2) e
inalcançável (D-3), o nível de escore vermelho exigido pelo Chart 2 não é
entregue em produção (D-5, D-6), os caminhos de ingestão discordam sobre
consciência (D-7), não há gating populacional (D-9), e a trilha de
versão/ratificação não é confiável (§3, achado de identidade de versão). Nada
pode ser importado como código.

Elementos propostos para sobreviver a uma especificação V2 (como *conteúdo de
especificação re-derivado do RCP 2017*, não como código legado):

- As tabelas de faixas de sete parâmetros que correspondem ao chart publicado
  (FR, SpO2 Escala 1, ar/oxigênio +2, PAS, pulso, temperatura, consciência) —
  RETAIN como conteúdo *publicado*, re-especificado a partir da fonte RCP com
  testes de aceitação V2.
- Os cortes agregados 5 / 7 e o modelo de resposta de quatro níveis
  **incluindo o nível Baixo–médio de vermelho único** — RETAIN a partir do
  chart publicado.
- O conceito de guarda de arredondamento de float (arredondar para a
  resolução do chart antes de classificar em faixas) e a ideia de
  `algorithm_registry` versionado — REFINE (apenas conceito; a própria
  prática de identidade de versão da V1 é um contraexemplo).
- Intenção de design de alerting edge-triggered/cooldown em
  early-warning-scores.yaml — VALIDATE (raciocínio de fadiga de alarme
  plausível; não implementado, não validado).

Elementos propostos REJECT: ambos os ramos de faixa de Escala 2 implementados
(D-1, D-2); a seleção `hypercapnic`-por-parâmetro sem workflow clínico (D-3);
O2-suplementar-como-hipercapnia no runner (D-4); coerção a zero de toda
entrada ausente (§5); a trilha de ratificação/versão "NEWS2-v3.0.0" (§3).

Pré-requisitos bloqueantes para a V2 (VALIDATION REQUIRED, não fecháveis por
nenhum agente): design de workflow de seleção clínica da Escala 2; contrato
de status de avaliação conforme `evaluation-status-semantics.md` (um
resultado de NEWS2 com qualquer entrada ausente deve ser
`not_evaluated`/`partial` conforme política aprovada, nunca 0); gating
populacional (VAL-0006/VAL-0007); janelas de frescor por entrada (VAL-0023 —
a V1 não aplica nenhuma: uma linha de sinal vital é pontuada como uma unidade
atômica independentemente de quais campos estão obsoletos); governança de
piso de limiar para alerting configurável.
