---
id: LEGREV-PATH-INDEX
title: Definições de pathway legadas — índice das doze pathways da V1 (fecha o INV-GAP-1)
label: OBSERVED
status: PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI)
statement: >
  Enumeração source-verified das doze definições de pathway de cuidado (trilhas) do
  repositório legado, com verificação das contagens estruturais do ciclo-0 (12 pathways
  / 118 unidades / 38 conjuntos de faixas / 58 predicados / 2 registros de rationale), a
  auditoria de alert_groups, e a auditoria de citações. Isso fecha a lacuna de inventário
  INV-GAP-1 (candidate-inventory.md seção 1.2): as onze pathways antes não nomeadas são
  nomeadas aqui com proveniência por arquivo.
provenance:
  source_repo: intensicare (legado V1, READ-ONLY)
  path_or_url: _work/alerts/pathways/ (doze arquivos YAML), _work/alerts/registry.json, _work/alerts/schema/pathway.schema.json, _work/alerts/sepse.yaml
  commit_sha_or_version: 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79 (HEAD legado no pin, 2026-08-15)
  section_or_lines: arquivos inteiros; SHA-256 por arquivo em docs/archive/legacy-provenance/legacy-pin-cycle-1.md
  date_collected: 2026-08-15
  collector: revisor forense de definições de pathway de cuidado legadas (ciclo 1, Tarefa 1)
  transformation: >
    traduzido EN→pt-BR, tranche 3, GDEC-0008 item 8 (lido por completo; contado
    computacionalmente; resumido com citações verbatim)
  confidence: alta
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  requirements: []
  hazards: [HAZ-0005, HAZ-0043, HAZ-0044]
  adrs: []
  tests: []
  pr: null
supersedes: null
superseded_by: null
---

> Traduzido EN→pt-BR em 2026-08-16 (GDEC-0008 item 8, tranche 3); original EN preservado no histórico git.

# Definições de pathway legadas — índice (ciclo 1, Tarefa 1)

> **PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).**
> Nada neste diretório importa, aprova ou ativa qualquer conteúdo legado. Vereditos
> são propostas sob `docs/00-governance/legacy-import-policy.md` e não são
> vinculantes até que uma autoridade humana nomeada os decida.

## 0. Proveniência e método

OBSERVED (2026-08-15): o repositório legado `/Users/familia/intensicare` estava no
HEAD git `1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79` quando cada arquivo citado
abaixo foi lido. O SHA-256 de cada arquivo citado foi verificado contra
`docs/archive/legacy-provenance/legacy-pin-cycle-1.md` (o manifesto de pin do
ciclo-1). Arquivos não cobertos pelo manifesto (`scripts/`, `tests/`,
`docs/plan/_work/alerts/`) foram hasheados por este revisor no momento da
leitura; esses hashes são declarados inline e marcados "hashed by reviewer —
absent from pin manifest".

As doze YAMLs de pathway foram lidas por completo. As contagens foram
computadas por script sobre o YAML parseado (não estimadas). A revisão da
mecânica do engine está em `engine-review.md`; a tabela de disposição por
regra para `docs/rules/care-pathway/` (211 arquivos) está em
`rules-cluster-disposition.md`.

## 1. As doze pathways — o INV-GAP-1 está fechado

OBSERVED. `candidate-inventory.md` §1.2 INV-GAP-1 registrou que onze das doze
pathways nunca foram nomeadas na avaliação técnica legada. As doze definições
existem como arquivos YAML em `_work/alerts/pathways/` e são:

| # | `pathway.id` do YAML | Slug | Nome (verbatim) | Versão | Intenção em uma linha (de `pathway.description`, resumida) | Registro de revisão |
|---|---|---|---|---|---|---|
| 1 | 1 | `ventilacao` | Ventilação Mecânica | 3.0.0 | Monitoramento de ventilação mecânica — apenas relação P/F e PEEP; **um stub** (sem descrição, 2 critérios, 2 estados) | `ventilacao-review.md` |
| 2 | 2 | `sepse` | Sepse | 4.0.0 | Sepse / choque séptico conforme SSC-2021: rastreio, temporizadores de bundle da hora-1 e 3h, resposta guiada por PCT | `sepse-review.md` |
| 3 | 3 | `desmame` | Desmame | 3.0.0 | Desmame ventilatório: prontidão (RSBI, NIF, Glasgow), SBT, extubação, pós-extubação | `desmame-review.md` |
| 4 | 4 | `nutricao` | Nutrição Enteral | 3.0.0 | Nutrição enteral: rastreio NRS-2002, metas calórico-proteicas, monitoramento de tolerância | `nutricao-review.md` |
| 5 | 5 | `estabilidade` | Estabilidade Hemodinâmica | 3.0.0 | Estabilidade hemodinâmica: PAM, FC, lactato, dose de vasopressor | `estabilidade-review.md` |
| 6 | 6 | `sedacao` | Sedação | 3.0.2 | Manejo de sedação conforme PADIS: alvo de RASS, dor por BPS, dose de infusão de sedativo | `sedacao-review.md` |
| 7 | 7 | `profilaxia` | Profilaxia | 3.0.0 | Bundle de profilaxia de UTI: TEV, úlcera de estresse, mobilização precoce, elevação da cabeceira | `profilaxia-review.md` |
| 8 | 8 | `antimicrobiano` | Antimicrobiano | 3.0.0 | Stewardship antimicrobiano: duração de terapia, desescalonamento guiado por PCT, seguimento de cultura | `antimicrobiano-review.md` |
| 9 | 9 | `equilibrio` | Equilíbrio Hidroeletrolítico | 3.0.1 | Distúrbios eletrolíticos: faixas de Na, K, Mg, Ca iônico | `equilibrio-review.md` |
| 10 | 10 | `renal` | Função Renal / AKI | 3.0.1 | Função renal / AKI: creatinina, débito urinário, estágio KDIGO | `renal-review.md` |
| 11 | 11 | `delirium` | Delirium | 3.0.2 | Delirium conforme PADIS 2018: rastreio CAM-ICU, agitação por RASS, dose de haloperidol | `delirium-review.md` |
| 12 | 12 | `respiratorio` | Insuficiência Respiratória | 3.0.1 | Insuficiência respiratória aguda: SpO2, FR, FiO2, PaCO2 | `respiratorio-review.md` |

SHA-256 por arquivo (verbatim do manifesto de pin, verificado em 2026-08-15):

```text
0ef987c51ad18ab9dea0123da1fec8c2c07b96833abe6a5ce9ee6db8e4e3758f  _work/alerts/pathways/antimicrobiano.yaml
571f8e31310fc88613909dc17ba7df3b254c289ce799c88662f14059e9e69208  _work/alerts/pathways/delirium.yaml
808e81b2de592b0bd9f1bae09e505e5db2d910b6f09fc21ec1f5ef56ecf2574a  _work/alerts/pathways/desmame.yaml
5d3af65ac19c81d4574a8c5848f4599949aad666ef0be808cdeb672607e60194  _work/alerts/pathways/equilibrio.yaml
bf61744c263f40f630931293fcf4fc95b90e573609390abee42d37c7b3c5bcc9  _work/alerts/pathways/estabilidade.yaml
b2dc4ae2f7fff4bcad5e1923647053fdcfd1565c7b5a0f9cf850628bd561dd95  _work/alerts/pathways/nutricao.yaml
0e33e945a67e0671c7f6cc957215c1f221d7b1f13e5ef01f8d024ad0584598bc  _work/alerts/pathways/profilaxia.yaml
a052e6c26835e3c7c8ade5e62ed7272b779edf95cfd47c6a3105fc3d90db4153  _work/alerts/pathways/renal.yaml
9792ca62fc663d77315ae5e0ea41d9bbcb2b6bfa36c55eaeb42bb05533ad5d1e  _work/alerts/pathways/respiratorio.yaml
21dfa0bd03b633a196e10de6f752c195d62448a86f5c72190a0dfab1a3675657  _work/alerts/pathways/sedacao.yaml
b84c9693295f5d820cb2796b6a789f10cfb9200409741af4e0ba78b7ad4ec7f0  _work/alerts/pathways/sepse.yaml
d1c48956f19eb55633f034cd800b05ed35004664864942f75533e1635a6fd8d3  _work/alerts/pathways/ventilacao.yaml
```

## 2. Verificação de contagens — "12 pathways, 118 unidades, 38 conjuntos de faixas, 58 predicados"

OBSERVED (computado por script sobre o YAML parseado, 2026-08-15). As contagens
do ciclo-0 (candidate-inventory.md §1.1c, oriundas da avaliação legada) verificam
como segue:

| Alegado | Computado | Veredito | O que o número realmente conta |
|---|---|---|---|
| 12 pathways | **12** | **TRUE** | Doze arquivos YAML, doze `pathway.id` distintos 1..12, sem duplicatas |
| 118 unidades | **118** (definição do Gate-A) / 123 (todas as chaves `unit:`) | **TRUE sob a definição do gate** | `scripts/validate_alerts.py` Gate A `_collect_units` (linhas 129-161) conta unidades de entrada + unidades de predicado de topo + apenas unidades de sub-predicado de **primeiro nível**. Cinco strings `unit:` dentro de sub-predicados aninhados em profundidade-2 dos compostos de `sepse.yaml` são invisíveis ao gate. 60 unidades de entrada + 58 unidades da árvore de predicados (das quais 5 não contadas pelo gate) = 123 no total; o gate vê 118. |
| 38 conjuntos de faixas | **38** | **TRUE** | Predicados graduados (cada um carrega um array `bands`). Por pathway: antimicrobiano 2, delirium 2, desmame 3, equilibrio 4, estabilidade 4, nutricao 6, profilaxia 1, renal 3, respiratorio 4, sedacao 3, sepse 5, ventilacao 1. (136 linhas de faixa individuais no total.) |
| 58 predicados | **58** | **TRUE** | Predicados de critério de topo (= contagem de critérios). Por pathway: 4/3/6/4/4/6/4/3/4/3/**15**/2. Contando também sub-predicados aninhados, a árvore contém 81 nós de predicado. |
| 2 registros de rationale | **2** | **TRUE** | Apenas os critérios de `ventilacao.yaml` carregam um `predicate.rationale` (linhas 40, 51). Os outros 56 predicados nas 11 outras pathways **não têm registro de rationale**. |

Notas de discrepância:

- **"118 unidades" é um artefato do gate, não uma propriedade do arquivo.** A
  contagem real de declarações `unit:` é 123; o Gate A recursa apenas um nível
  dentro de `sub_predicates` (`scripts/validate_alerts.py:152-159`, SHA-256
  `22daccfb33d4be7f6708ae0b3e44f2d1fa635cf9e3d442e0e45ff55b98ae4c41`, hashed by
  reviewer — absent from pin manifest). As cinco strings de unidade não
  checadas ficam dentro de compostos aninhados de `sepse.yaml` (p.ex.
  `crit-sep-screen`, `crit-sep-shock`, `crit-sep-pct-deesc`).
- **`sepse.yaml` tem 15 critérios e 17 entradas**, materialmente maior que
  qualquer outra pathway (segunda maior: 6 critérios). A cifra "58 predicados"
  é dominada por ela.
- OBSERVED: `registry.json` (`_work/alerts/registry.json`, SHA-256
  `bb2db7f853a6ee8f9f420aa88dd078acb20cd0e4a09e7cb98ab7ed644c7fba77`) **não**
  registra as doze definições de pathway. Ele registra **seis alertas de
  sepse** cujo `source_file` é o `_work/alerts/sepse.yaml` da *raiz* — ver §5.

## 3. Auditoria de alert_groups

OBSERVED — a alegação de candidate-inventory §1.1h ("nove YAMLs de domínio
carecem de `alert_groups`; o gate de vetor então reportou All 0 pass —
false-green") se verifica, com um esclarecimento importante sobre **quais**
arquivos estão envolvidos:

1. **Nenhuma das doze YAMLs de pathway tem `alert_groups`, e nenhuma pode ter.**
   O schema de pathway (`_work/alerts/schema/pathway.schema.json:6-8`, SHA-256
   `68ca230a47b7ad5be991cdfc4319ad1d6a6e6112d14b185506588ebed772a203`) define
   `"additionalProperties": false` com apenas as chaves de topo
   `pathway|evaluation|criteria|states|suppression|evidence`. `alert_groups`
   simplesmente não faz parte do vocabulário de pathway.
2. **Os nove arquivos sem `alert_groups` são um conjunto diferente**: os
   catálogos de alerta de domínio em `docs/plan/_work/alerts/` — `aki.yaml`,
   `correlation-engine.yaml`, `early-warning-scores.yaml`, `electrolyte.yaml`,
   `hemodynamics.yaml`, `neuro-sedation.yaml`, `pharmaco-interaction.yaml`,
   `respiratory.yaml`, `sepsis.yaml` (todos hasheados pelo revisor — ausentes
   do manifesto de pin; hashes em `engine-review.md` §7). Todos os nove usam
   uma chave de topo `alerts:`; nenhum contém `alert_groups`.
3. **False-green reproduzido ao vivo** (2026-08-15): rodar
   `python3 scripts/check_vector_coverage.py` no HEAD fixado imprime
   `WARNING: <file> missing 'alert_groups' key` para os nove arquivos, e então
   `Coverage: 0/0 (0.0%)` e sai com código **0** e
   `PASSED: All 0 alerts have test vectors and conditions.` O gate não valida
   nada enquanto reporta sucesso. Mecânica em `engine-review.md` §7.
4. Consequência para as doze pathways: **o gate de cobertura de vetores não
   cobre as YAMLs de pathway de forma alguma** (ele varre
   `docs/plan/_work/alerts/`, não `_work/alerts/pathways/`). A única cobertura
   de vetor de teste que qualquer pathway tem é a suíte de paridade sepse v4
   (`tests/test_sepse_yaml_parity.py`, 31 vetores, apenas sepse).

Coluna alert_groups por pathway (uniforme): **ausente** em todas as doze —
registrado em cada registro de revisão.

## 4. Auditoria de citações (ancoragem em diretriz)

OBSERVED. Todas as doze YAMLs carregam uma string `evidence.guideline` e um
`evidence.doi`. Todo DOI foi resolvido contra o registro Crossref
(`api.crossref.org`, 2026-08-15):

| Pathway | Diretriz citada (abrev.) | DOI | Resolução Crossref | Veredito |
|---|---|---|---|---|
| antimicrobiano | IDSA/SHEA ASP 2016; SSC-2021 | 10.1093/cid/ciw118 | Barlam TF et al., "Implementing an Antibiotic Stewardship Program", Clin Infect Dis 2016 | **MATCH** |
| delirium | PADIS 2018 | 10.1097/CCM.0000000000003299 | Devlin JW et al., diretriz PADIS, Crit Care Med 2018 | **MATCH** |
| desmame | ACCP/SCCM/AARC/ATS weaning 2001; "BURN Trial (2016)" | 10.1378/chest.120.6_suppl.375S | MacIntyre NR et al., diretrizes de desmame, Chest 2001 | **MATCH** para o DOI; "BURN Trial (2016)" **NÃO IDENTIFICÁVEL** como fonte primária |
| equilibrio | "ESICM Guidelines on Electrolyte Disorders"; **UpToDate** | 10.1007/s00134-012-2768-4 | **HTTP 404 — DOI não registrado no Crossref** | **DOI QUEBRADO**; diretriz nomeada não identificável; UpToDate é fonte terciária, não autoridade primária |
| estabilidade | SSC 2021; consenso de choque ESICM 2014 | 10.1007/s00134-014-3525-z | Cecconi M et al., consenso de choque circulatório ESICM, Intensive Care Med 2014 | **MATCH** |
| nutricao | ESPEN ICU 2019; ASPEN/SCCM 2016 | 10.1016/j.clnu.2018.08.037 | Singer P et al., diretriz ESPEN ICU, Clin Nutr 2019 | **MATCH** (ASPEN/SCCM 2016 nomeada sem DOI) |
| profilaxia | "SCCM/ACCM Guidelines; IHI Ventilator Bundle; SSC; WHO Patient Safety" | 10.1097/CCM.0b013e3182783b72 | Barr J et al., **diretriz de Dor/Agitação/Delirium 2013** | **MISMATCH** — o DOI resolve para uma diretriz diferente (PAD 2013, não profilaxia); as fontes nomeadas são vagas, nenhuma é uma edição citável específica |
| renal | KDIGO AKI 2012; ADQI 2020 | 10.1038/kisup.2012.1 | "Notice", Kidney Int Suppl 2012 (matéria de abertura do suplemento KDIGO AKI) | **PARTIAL** — aponta para o suplemento correto, mas na sua matéria de abertura, não na diretriz; ADQI 2020 nomeada sem DOI |
| respiratorio | ARDSNet 2000; ATS/ERS; BTS oxygen 2017 | 10.1136/thoraxjnl-2016-209729 | O'Driscoll BR et al., diretriz de oxigênio BTS, Thorax 2017 | **MATCH** (ARDSNet e ATS/ERS nomeadas sem DOI) |
| sedacao | PADIS 2018 | 10.1097/CCM.0000000000003299 | Devlin JW et al., PADIS 2018 | **MATCH** |
| sepse | SSC-2021 | 10.1007/s00134-021-06506-y | Evans L et al., SSC 2021, Intensive Care Med 2021 | **MATCH** (análise de conteúdo da diretriz adiada para o workstream de sepsis-scores) |
| ventilacao | ARDSNet 2000; PROSEVA 2013 | 10.1056/NEJM200005043421801 | ARDSNet (Brower et al.), volumes correntes menores, N Engl J Med 2000 | **MATCH** (PROSEVA nomeada sem DOI) |

**Balanço: 12/12 pathways carregam uma citação; 8 DOIs MATCH, 1 QUEBRADO
(equilibrio), 1 MISMATCH (profilaxia), 1 PARTIAL (renal), mais 1 citação
secundária não identificável (desmame "BURN Trial"). Zero pathways estão
totalmente UNCITED.**

INFERENCE — e isso é estrutural: **uma citação em nível de arquivo não é
proveniência de limiar.** Nenhuma fronteira de faixa, corte ou escore em
qualquer pathway carrega seu próprio rationale ou citação (apenas as duas
strings `rationale` mecânicas da ventilacao existem, e elas apenas reafirmam o
predicado). Se cada limiar implementado concorda com a autoridade citada é
avaliado por pathway nos registros de revisão; discordâncias materiais foram
encontradas em `renal` (faixas de creatinina absoluta rotuladas incorretamente
como estágios KDIGO) e `delirium` (haloperidol enquadrado como primeira linha,
contrariando o próprio PADIS 2018 citado).

## 5. O `_work/alerts/sepse.yaml` da raiz — não é uma duplicata, é um segundo conjunto de regras de sepse

OBSERVED. `_work/alerts/sepse.yaml` (raiz, SHA-256
`1af8062d535ff0a9efa12a1606c7b37b975bd0635a8800f155491e958ced5dfa`) é um
**artefato diferente, em um formato diferente**, de
`_work/alerts/pathways/sepse.yaml`:

- O arquivo raiz é uma lista plana de **seis definições de alerta**
  (`sepsis_sirs_alert`, `sepsis_qsofa_alert`, `sepsis_lactate_alert`,
  `sepsis_sofa_alert`, `sepsis_septic_shock`, `sepsis_clear_48h`) no formato de
  catálogo F-ARCH-001 mais antigo (`criteria: [{field, operator, value}]`),
  citando "Singer M et al. JAMA 2016;315(8):801-10" (Sepsis-3) por alerta.
- `registry.json` (registro content-addressed da ADR-021) registra exatamente
  esses seis alertas com SHA-256 por alerta e
  `source_file: "_work/alerts/sepse.yaml"` — o arquivo raiz, não o arquivo de
  pathway.
- O arquivo de pathway é a definição de trilhas v4.0.0 SSC-2021 (15 critérios).

INFERENCE: a V1 carregava, portanto, **três conjuntos de regras de sepse
coexistindo** — o catálogo de alertas Sepsis-3 da raiz (registrado), a
definição de pathway SSC-2021 (carregada pelo engine), e o `domain_sepsis.py`
imperativo (que o arquivo de pathway se descreve como portando). Qual deles era
autoritativo em qualquer momento não está registrado em nenhum lugar lido neste
ciclo. Detalhe estrutural completo em `sepse-review.md`; a adjudicação de
diretriz é escopo do workstream de sepsis-scores.

## 6. Achados transversais (resumidos; detalhe do engine em engine-review.md)

1. **Entrada ausente avalia para silêncio, e silêncio renderiza como "normal"**
   — `trilhas_evaluator.py:388-397` pula um critério cuja entrada está ausente
   (`KeyError` → `continue`, log DEBUG), e `build_alert`
   (`trilhas_evaluator.py:472-481`) produz `overall_severity="normal"` quando
   nada dispara. Um paciente com **nenhum dado** produz a mesma saída que um
   paciente verificado normal. Esta é a forma de falha do HAZ-0005, presente
   no engine declarativo *novo*, e é **testada como comportamento pretendido**
   (`tests/test_trilhas_evaluator.py:437-449`,
   `test_missing_input_produces_no_firing`).
2. **Uma entrada ausente em um ramo de um OR silencia o critério inteiro** —
   predicados compostos não fazem short-circuit; um `KeyError` de qualquer
   sub-predicado aborta o critério inteiro (`trilhas_compiler.py:639-641` +
   captura do avaliador). Documentado, com contorno, na própria suíte de
   testes legada (`tests/test_sepse_yaml_parity.py:118-131`).
3. **O vocabulário de severidade não tem um membro "não avaliado".**
   `normal | watch | urgent | critical` (CON-SEED-11, linha 161 do schema) não
   consegue expressar não-avaliação em nenhum ponto do pipeline.
4. **Critérios booleanos de compliance alertam no lado errado** em
   `profilaxia` (dispara urgente quando a profilaxia É dada; silencioso quando
   ausente) — ver `profilaxia-review.md` §7.
5. **Falsos-normais por descasamento de unidade**: valores abaixo do limite
   inferior de um conjunto de faixas não batem com nenhuma faixa e retornam
   `normal` (`trilhas_compiler.py:584-593`); a fiação de auto-avaliação
   alimenta `renal.debito_urinario` (esperado em mL/kg/h) a partir de uma
   coluna chamada `urine_output_ml_day` (mL/dia) — ver `renal-review.md` §7.
6. **Alertas de pathway declarativos nunca são entregues**:
   `TrilhasEngine.evaluate` é invocado apenas como um "passe de validação"
   logado (`src/intensicare/api/v1/pathways.py:796-817`); os disparos são
   escritos no log e descartados.

## 7. Resumo de vereditos (todos PROPOSAL — AWAITING NAMED CLINICAL REVIEW, reviewer: rodaquino-OMNI)

| Artefato | Veredito proposto | Racional em uma linha |
|---|---|---|
| ventilacao | **REJECT** (como pathway; conceitos para trabalho sucessor de desmame/respiratorio) | Um stub (2 critérios, sem descrição) apresentado como pathway de ventilação mecânica; os cortes P/F de Berlim em si são sólidos |
| sepse | **TRANSFORM** (estrutura); adjudicação de diretriz adiada para o workstream de sepsis-scores | Definição mais rica, mas os temporizadores de bundle/compostos herdam o silêncio de entrada ausente do composto e a ambiguidade do triplo conjunto de regras |
| desmame | **VALIDATE** | Limiares amplamente consistentes com a literatura de desmame citada; sem dono, não ratificado, semântica booleana ambígua |
| nutricao | **VALIDATE** | Majoritariamente consistente com ESPEN/ASPEN; faixas de resíduo gástrico conflitam parcialmente com o ASPEN 2016 citado |
| estabilidade | **VALIDATE** | Faixas de PAM/lactato consistentes com SSC/ESICM; sem dono, não ratificado |
| sedacao | **VALIDATE** | Faixas de RASS/BPS consistentes com PADIS; inconsistência de RASS entre pathways com delirium |
| profilaxia | **TRANSFORM** | Intenção valiosa de auditoria de bundle; direção de alerting invertida como implementada (silenciosa quando profilaxia ausente) |
| antimicrobiano | **VALIDATE** | Lógica de PCT/duração consistente com a literatura de stewardship citada; precisa de dono clínico nomeado |
| equilibrio | **VALIDATE** | Faixas eletrolíticas convencionais; DOI quebrado, citação terciária |
| renal | **TRANSFORM** | Faixas de creatinina absoluta rotuladas incorretamente como estágios KDIGO; hazard de unidade na entrada de débito urinário; deve ser reconstruído como relativo à linha de base |
| delirium | **VALIDATE** | Estrutura CAM-ICU/RASS sólida; enquadramento de haloperidol como "primeira linha" contradiz o próprio PADIS 2018 citado |
| respiratorio | **VALIDATE** | Faixas de SpO2/FR/PaCO2 consistentes com metas BTS; vetor de falso-normal por fração-vs-percentual de FiO2 |
| engine de trilhas (todos os runtimes) | **SUPERSEDE** | Sem álgebra de status de avaliação; ausência→normal; runtime duplo/triplo; colisão de semântica de severidade; fiação de alerta não operativa. Inteligência preservada: compilador AST declarativo, validação de continuidade de faixas, content-addressing, disciplina no-eval |

Nenhum veredito aqui é DECIDED. A importação de qualquer item exige
adicionalmente as oito precondições de `legacy-import-policy.md` §3, nenhuma
das quais está atualmente satisfeita.
