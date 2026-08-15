---
id: MIGMANIFEST-CYCLE-1
title: Manifesto de migração — Ciclo 1 (proveniência legada consolidada)
label: PROPOSAL
statement: >
  Consolidação, exigida por docs/00-governance/legacy-import-policy.md §5, de toda
  proveniência legada que informou artefatos V2 do ciclo 1: os vereditos e citações já
  produzidos pelo corpus de revisão forense (docs/05-clinical-safety/legacy-review/),
  pelas notas de migração por regra (rule-releases/{sofa,news2,gcs}/migration-notes.md),
  pela revisão de KPIs clínicos (pathway-portfolio/clinical-kpi-review.md) e pelas sete
  ADRs novas (docs/06-architecture/adrs/ADR-0007/0008/0025/0026/0027/0028/0029). Este
  documento CONSOLIDA — não re-revisa — os vereditos já registrados nesses artefatos.
  Rótulo do manifesto: PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer:
  rodaquino-OMNI).
provenance:
  source_repo: intensicare-V2 (consolidador) + intensicare (legado V1, READ-ONLY, referenciado)
  path_or_url: docs/05-clinical-safety/legacy-review/**, docs/05-clinical-safety/rule-releases/{sofa,news2,gcs}/migration-notes.md, docs/05-clinical-safety/pathway-portfolio/clinical-kpi-review.md, docs/06-architecture/adrs/ADR-0007,0008,0025,0026,0027,0028,0029, docs/archive/legacy-provenance/legacy-pin-cycle-1.md, /Users/familia/intensicare/LICENSE, /Users/familia/intensicare/pyproject.toml
  commit_sha_or_version: legado 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79 (pin ciclo 1); V2 sem commit ainda (working tree, branch cycle-1/clinical-content)
  section_or_lines: ver citações por linha dentro de cada seção
  date_collected: 2026-08-15
  collector: consolidador de proveniência legada (ciclo 1); revisor responsável rodaquino-OMNI (GDEC-0003)
  transformation: >
    Nenhum arquivo de revisão foi re-lido de forma independente para produzir um novo
    veredito; este documento transcreve (label SOURCE) os vereditos e citações já
    registrados nos artefatos listados acima, e consolida (label INFERENCE) contagens,
    lacunas e riscos entre workstreams. Nenhum código, schema ou regra clínica do
    repositório legado foi copiado para este arquivo — apenas texto de citação,
    caminhos, hashes SHA-256 e trechos curtos já publicados nos registros de revisão.
  confidence: medium
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  requirements: []
  hazards: [HAZ-0005]
  adrs: [ADR-0007, ADR-0008, ADR-0025, ADR-0026, ADR-0027, ADR-0028, ADR-0029]
  tests: []
  pr: null
supersedes: null
superseded_by: null
---

# Manifesto de migração — Ciclo 1

> **PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).** Este
> manifesto consolida proveniência; não aprova, ratifica nem autoriza importação de
> nada. Vocabulário de classificação conforme
> `docs/00-governance/legacy-import-policy.md` §4. Nenhuma linha aqui é `DECIDED` —
> toda contagem, veredito e afirmação de escopo carrega o rótulo indicado inline
> (SOURCE = transcrição fiel de um registro de revisão já existente; INFERENCE =
> consolidação/soma feita por este documento, com a cadeia de raciocínio mostrada).

## 0. Como ler este manifesto

- **Unidade de trabalho:** este documento não re-revisa nada
  (`docs/00-governance/legacy-import-policy.md` §5, "CONSOLIDATE, do not re-review" —
  instrução da tarefa que produziu este arquivo). Cada linha de tabela é uma
  transcrição (SOURCE) do veredito e da citação já registrados no arquivo de revisão
  nomeado na coluna "registro de origem".
- **CRV** = *Clinical Reference Vector*, per
  `docs/12-quality-validation-and-testing/clinical-reference-vector-standard.md`
  (não lido neste ciclo além do que os `migration-notes.md` citam) — vetores de
  teste DRAFT, não ratificados, mantidos em `reference-vectors.md` de cada
  rule-release. Onde uma linha da tabela diz "sem CRV citado no registro de
  revisão", significa que o arquivo de revisão consolidado aqui não nomeia um
  vetor específico — não que nenhum teste V2 exista.
- **`[pin]`** = o SHA-256 citado bate com `docs/archive/legacy-provenance/legacy-pin-cycle-1.md`
  (1.317 entradas). **`[reviewer-hash]` / `(rt)`** = arquivo hash­eado pelo revisor no
  momento da leitura porque está fora do manifesto de pin — OBSERVED, não parte dos
  1.317 pinos originais (ver `docs/archive/legacy-provenance/legacy-pin-cycle-1.md`
  regra de re-verificação).
- **Owner:** toda linha deste manifesto tem como revisor clínico responsável
  **rodaquino-OMNI**, per GDEC-0003 (citado em `legacy-pin-cycle-1.md` front matter).
  Nenhuma linha tem "transformer" nomeado além do agente autor do artefato V2 citado
  na coluna de destino — a policy exige `independent_reviewers` sem auto-revisão
  (`legacy-import-policy.md` §5); isso permanece `VALIDATION REQUIRED` para todo o
  conteúdo abaixo até que um humano nomeado assuma cada papel.
- **Status de licença:** todo baseline de licença citado abaixo é OBSERVED (o que o
  arquivo LICENSE do legado diz), não uma conclusão de suficiência legal — essa
  conclusão pertence a AUTH-PRIVACY-LEGAL, reclassificada conforme as resoluções G0
  (referência apenas; ver §5).

---

## 1. Declaração de escopo

**SOURCE — o ciclo 1 não copiou código, schema ou conteúdo de regra clínica do
legado.** Cada rule-release declara isso explicitamente na primeira pessoa do
artefato:

- `docs/05-clinical-safety/rule-releases/sofa/migration-notes.md` §1: *"**Nothing
  in `specification.md` or `logic.yaml` was copied from legacy code.** Every band
  value was re-derived from Vincent 1996."*
- `docs/05-clinical-safety/rule-releases/news2/migration-notes.md` §1 (citando
  `news2-review.md` §6): *"Nothing may be imported as code."* — e: *"RULE-NEWS2
  0.1.0 is the TRANSFORM output: a re-derivation from the RCP 2017 primary source,
  not a port."*
- `docs/05-clinical-safety/rule-releases/gcs/migration-notes.md` §1: *"**Nada em
  `specification.md` foi copiado de código legado.** O modelo de componentes, as
  enumerações e a proibição de total-com-NT foram re-derivados de Teasdale &
  Jennett 1974 e glasgowcomascale.org."*
- `docs/05-clinical-safety/pathway-portfolio/clinical-kpi-review.md` front matter,
  `transformation`: *"No legacy code was re-read; all line citations herein are
  quoted from the forensic records."*
- ADR-0007 §7 (linha de migração): conteúdo de regra legado (`docs/rules/alert-threshold/`,
  116 registros, zero veredito RETAIN/REFINE per `alert-threshold-cluster-review.md`
  §3) **não é importado como está**; conteúdo transformado que reentrar como bundle
  V2 deve passar pelo ciclo de vida completo da ADR a partir de `draft` — conteúdo
  legado é referência de design apenas.
- ADR-0026 §7: *"Nenhum conteúdo legado é importado (vereditos REJECT/TRANSFORM das
  revisões permanecem); vetores legados entram apenas como regressão negativa."*

**INFERENCE (a partir das citações acima):** as três rule-releases publicadas neste
ciclo (SOFA, NEWS2, GCS) são especificações re-derivadas de fonte primária
(Vincent 1996 / Singer 2016; RCP 2017; Teasdale & Jennett 1974), não portas do
código legado. Nenhum código-fonte, migração Alembic, schema Pydantic/SQLAlchemy ou
arquivo YAML de pathway do legado foi copiado para dentro deste repositório V2 —
apenas seus caminhos, hashes SHA-256 e trechos curtos citados dentro dos registros
de revisão forense (que são o próprio corpus deste manifesto).

**O que "legado-derivado" significa aqui** (INFERENCE, definição operacional deste
manifesto): duas — e apenas duas — categorias de intelligence herdada do legado
entraram em artefatos V2 do ciclo 1:

1. **Decisões de rejeição/superseding informadas pela revisão** — um artefato V2
   (specification.md, ADR, revisão de KPI) cita um achado do corpus de revisão
   forense para justificar por que uma prática legada foi rejeitada (`REJECT`) ou
   substituída por um desenho V2-nativo (`SUPERSEDE`), ou por que um conceito
   sobrevive só como intenção a ser reconstruída (`TRANSFORM`/`REFINE`).
2. **Vetores de regressão derivados de defeito** — um defeito legado observado em
   código-fonte (ex.: `D-1`..`D-19`, `M-1`..`M-7`, `P-01`..`P-12`, `Q-05`..`Q-10`,
   achados `CDF-*`, `SYS-*`) motivou a criação de um `CRV-####` negativo nos
   `reference-vectors.md` do rule-release correspondente, para que o comportamento
   incorreto do legado nunca passe silenciosamente no V2.

Nenhuma outra forma de herança (nomes de variável, estrutura de banco, texto de
UI, lógica de negócio) está em escopo deste manifesto ou foi encontrada nos
artefatos V2 revisados para produzi-lo.

---

## 2. Manifesto por família de origem

Cada subseção cobre um workstream de `docs/05-clinical-safety/legacy-review/`.
Colunas: **elemento** | **caminho legado + SHA-256** | **classificação** (vocabulário
§4 da policy) | **licença (baseline OBSERVED)** | **log de transformação** (uma
linha) | **artefato(s) V2 informado(s)** | **ponteiro de teste de aceitação V2**
(CRV onde aplicável) | **owner**. Para reduzir repetição, a coluna de licença é
abreviada **`AGPL-3.0‡`** em toda a tabela — ver §5 para o achado completo (o
LICENSE do legado é AGPLv3 genérico; `pyproject.toml` declara "Proprietary";
contradição registrada, sem conclusão de suficiência legal). O owner é
**rodaquino-OMNI (GDEC-0003)** em toda linha, salvo indicação contrária.

### 2.1 EWS — NEWS2 e MEWS

Registro de origem: `docs/05-clinical-safety/legacy-review/ews/news2-review.md`,
`.../mews-review.md`, `.../shared-findings.md`.

**NEWS2** (fonte: `news2-review.md` §6, veredito de elemento):

| elemento | caminho + SHA-256 | classificação | log de transformação | artefato V2 | teste V2 (CRV) |
|---|---|---|---|---|---|
| Tabelas de banda por 7 parâmetros (RR, SpO2 Escala 1, O2 suplementar +2, PAS, pulso, temperatura, consciência) que batem com o gráfico RCP | `src/intensicare/services/news2.py:101-241` `d3399fe2bb9853222dde6b16167a4f6093c6daac7b1559474b628deeff246bc8` [pin] | **RETAIN** (como conteúdo publicado, re-especificado) | Re-derivado de RCP 2017 (Chart 1); nenhuma linha de código copiada | `rule-releases/news2/specification.md` | sem CRV citado no registro de revisão |
| Cortes agregados 5/7 + modelo de 4 níveis, incl. o nível "low-medium" de parâmetro único vermelho | mesmo arquivo `d3399fe2bb...` [pin] | **RETAIN** | Re-derivado de RCP 2017 (Chart 2); nível low-medium ausente na implementação legada (D-5) | `rule-releases/news2/specification.md` | CRV-NEWS2-0189 (cobre D-6/SF-4, alerta apenas agregado) |
| Guarda de arredondamento a 1 casa decimal antes da banda + ideia de `algorithm_registry` versionado | `news2.py:87-90,14` [pin] | **REFINE** (conceito apenas) | Prática de versionamento do V1 é seu próprio contraexemplo (string `NEWS2-v3.0.0` não mudou quando o comportamento da Escala 2 se inverteu) | `rule-releases/news2/specification.md`; ADR-0025 | sem CRV citado no registro de revisão |
| Alerta por gatilho de borda (edge-triggered) com cooldown, intenção de desenho | `docs/plan/_work/alerts/early-warning-scores.yaml` `712d9ccde209d099f80c4d5abb11e77e33564e03f347f931a363537c1031e9b8` [reviewer-hash] | **VALIDATE** | Raciocínio de fadiga de alarme plausível; não implementado, não validado | não declarado no registro de revisão | sem CRV citado no registro de revisão |
| Ambos os ramos de banda da Escala 2 hipercápnica (D-1: on-O2 ≤92→0 sub-pontua hipoxemia profunda; D-2: off-O2 desloca uma banda) | `news2.py:139-159` [pin] | **REJECT** | Substituído; Escala 2 re-especificada diretamente do Chart 1 RCP | `rule-releases/news2/specification.md` | CRV-NEWS2-0119/0120, CRV-NEWS2-0124–0137 |
| Seleção de Escala 2 por parâmetro `hypercapnic: bool` sem superfície clínica (D-3) + seleção invertida no NRT runner (D-4) | `news2.py:118-122,275-284`; `ews_nrt_runner.py:209,220` [pin] | **REJECT** | Mecanismo de decisão clínica inexistente no V1; V2 exige fluxo de decisão nomeado antes de qualquer Escala 2 | `rule-releases/news2/specification.md` §4.5 (pendente ADR de confounding) | CRV-NEWS2-0121–0123 |
| Coerção a zero de todos os 7 insumos ausentes (HAZ-0005, E1 confirmado) | `news2.py:84-85,213-224` [pin] | **REJECT** | Substituído pela álgebra de status de 5 estados; nenhuma coerção-a-zero, nenhum total parcial | `ADR-0008`; `rule-releases/news2/specification.md` §5 | CRV-NEWS2-0102–0109 |
| Coerção de consciência via HL7 (D-7: "C"→None→0) e fallback não-"A"→3 sem distinção crônico/novo (D-8) | `mllp_listener.py:200-204`; `news2.py:219-224` [pin] | **REJECT** | Ambos os caminhos de ingestão devem concordar; ausência nunca é "Alert" | `rule-releases/news2/specification.md` §4.3 | CRV-NEWS2-0116, CRV-NEWS2-0172–0176 |
| Ausência de gate populacional (D-9) — nenhum campo de idade/gestação em nenhum ponto do caminho | `news2.py`, `vitals.py`, `schemas/vitals.py` (varredura completa) [pin] | **REJECT** | RCP 2017 §2: "designed for use in patients aged 16 years and more..." | `ADR-0027` | CRV-NEWS2-0114/0115 |
| Trilha de "ratificação" `NEWS2-v3.0.0` (migrações 0008/0021/0029) | `alembic/versions/0008_seed_news2_v2_0_0.py` `cb98588ea4460b355c2c3ac84d314c838f405903150b7019392e9a69db0d51c6`; `0021_activate_news2_v3_0_0.py` `2874d0306946472838a612ca73d78a311e8885cdbf5c11bf28172fcc36db15f4`; `0029_ratification_record.py` `cfd0e7e40d62f628fa6335018a547a6d418931ce5861f239bb3f2f5f7ce1afbe` [reviewer-hash] | **REJECT** | Reivindicação de ratificação não sobrevive: `RAT-NEWS2-SCALE-2` não aparece na tabela aprovada de `docs/audit/fullspectrum/CLINICAL_SIGNOFF.md` | `ADR-0025` | sem CRV citado no registro de revisão |

**MEWS** (fonte: `mews-review.md` §2–§6):

| elemento | caminho + SHA-256 | classificação | log de transformação | artefato V2 | teste V2 (CRV) |
|---|---|---|---|---|---|
| Candidatura geral do MEWS como pathway | `src/intensicare/services/mews.py` `43f7a8e17a31ea21f61ec53b2bcee68ff64067387c687e23714382f4737e922c` [pin]; `vitals.py`, `threshold_resolver.py` [pin]; +12 outros, ver registro de revisão §0 | **VALIDATE** (condicional) → **SUPERSEDE** se o portfólio remover o MEWS | Sobreposição "MUITO ALTA" com CAND-0001/NEWS2 (§6) | CAND-0002 (`pathway-portfolio/candidate-inventory.md`), decisão de sobreposição pendente | sem CRV citado no registro de revisão |
| Tabelas de banda de 5 parâmetros (Subbe) | `mews.py` (mesmo hash) [pin] | **RETAIN** (bloqueado por VALIDATION REQUIRED — Tabela 1 não verificada, §2.3) | Re-derivado de Subbe CP et al., QJM 2001; lacuna HR-40 = decisão institucional (M-3) | não declarado no registro de revisão | sem CRV citado no registro de revisão |
| Corte de ≥5 associado a desfecho | `mews.py` [pin]; `alembic/versions/0038_seed_default_threshold_config.py` `c11d640d1a29aab2d99e39a741d35bceec2a6d688e174db3cbded2bf089c4486` [pin] | **RETAIN** | Verificado contra abstract Subbe 2001 (OR 5,4) | não declarado no registro de revisão | sem CRV citado no registro de revisão |
| Marcadores de ausência por componente, gerados mas descartados | `mews.py:207-215,218-224` [pin] | **TRANSFORM** | Deve orientar status, nunca coexistir com soma-zero | `ADR-0008` (`evaluation-status-semantics.md`) | sem CRV citado no registro de revisão |
| Fallback silencioso de AVPU (M-2) | `mews.py:162-164` [pin] | **REJECT** | Coerção de entrada inválida a valor tranquilizador; achado compartilhado SF-3 | não declarado no registro de revisão | sem CRV citado no registro de revisão |
| Atribuição "Subbe" a watch=3/urgent=4 (M-4) | `0038_seed_default_threshold_config.py` `c11d640d1a29aab2d99e39a741d35bceec2a6d688e174db3cbded2bf089c4486` [pin] | **REJECT** (atribuição apenas) | Abstract verificado da fonte só sustenta "≥5" | `ADR-0025` | sem CRV citado no registro de revisão |
| Soma sobre componentes coagidos a zero (§5, HAZ-0005 confirmado nos 5 insumos) | `mews.py:218-224` [pin] | **REJECT** | Substituído pela álgebra de status V2 | `ADR-0008` | sem CRV citado no registro de revisão |

`shared-findings.md` (SF-1..SF-9) não atribui vocabulário de veredito por
elemento — é um achado transversal (motor de alerta morto, trilha de ratificação
não confiável, sem piso de threshold, sem política de frescor, fronteira adulto
não aplicada, contradição intenção-vs-implementação). Suas contribuições estão
refletidas nas linhas REJECT acima e em ADR-0025/ADR-0027 §3.

---

### 2.2 Escores de sepse — qSOFA, SOFA (canônico e fork), pathway sepse

Registro de origem: `docs/05-clinical-safety/legacy-review/sepsis-scores/{qsofa-review.md,
sofa-review.md, sofa-fork-domain-formularios-review.md, sepse-pathway-clinical-review.md}`.

**qSOFA** (fonte: `qsofa-review.md` §4, contagem verbatim: "6 DEV (Q-05..Q-10); 4
MATCH (Q-01..Q-04)"):

| elemento | caminho + SHA-256 | classificação | log de transformação | artefato V2 | teste V2 (CRV) |
|---|---|---|---|---|---|
| Cortes e limiar 2-de-3 | `src/intensicare/services/qsofa.py` `48b69f39f7b789c5f12f005931c9d02cc9b8da562c9aecee804d594530bab8ce` [pin]; `domain_sepsis.py` `853d2e38a8167d28e7eb242872e871024abe00b4868fc22f7c02502f99d3ccf8` [pin] | **VALIDATE** | Re-derivado de Singer 2016; GCS<15 vs ≤13 precisa de escolha citada | não declarado no registro de revisão | sem CRV citado no registro de revisão |
| Tratamento de insumo ausente (§5, HAZ-0005 confirmado nos 3 critérios+total) | `qsofa.py:79-115,138-164` [pin] | **REJECT** | Substituído pela álgebra de status | não declarado no registro de revisão | sem CRV citado no registro de revisão |
| Conceito de metadado `missing_criteria` | `qsofa.py:138-164` [pin] | **TRANSFORM** | Mesma disposição de `SOFAResult.missing_components` | não declarado no registro de revisão | sem CRV citado no registro de revisão |
| Alerta qSOFA isolado (`sepsis_qsofa_alert`) | `_work/alerts/sepse.yaml` (raiz) `1af8062d535ff0a9efa12a1606c7b37b975bd0635a8800f155491e958ced5dfa` [pin] | **REJECT** | Contradiz recomendação forte SSC 2021 contra rastreio de instrumento único | não declarado no registro de revisão | sem CRV citado no registro de revisão |
| Rastreio qSOFA-OU-SIRS + gate de infecção | `domain_sepsis.py:269-288` [pin]; `pathways/sepse.yaml` `b84c9693295f5d820cb2796b6a789f10cfb9200409741af4e0ba78b7ad4ec7f0` [pin] | **VALIDATE** (conceito) / **REJECT** (reivindicação de ratificação "SSC-2021 RATIFIED" — autoridade = delegação de owner, não autoridade clínica nomeada) | `ratification-decisions.yaml` referente não é uma autoridade clínica nomeada per `evidence-notation.md` §2 regra 3 | CAND-0004, ownership clínica nomeada pendente | sem CRV citado no registro de revisão |
| "Alta probabilidade de sepse"/"high risk for sepsis" no texto de alerta | `qsofa.py:4,9-10,50-52` [pin]; `pathways/sepse.yaml:97-104` [pin] | **REJECT** | Deturpa reivindicação validada (preditor de desfecho ruim, não diagnóstico) | `ADR-0029` (validação de terminologia clínica pt-BR) | sem CRV citado no registro de revisão |

**SOFA canônico** (fonte: `sofa-review.md` §4, contagem verbatim: "12 DEV
(D-02,D-04,D-06,D-07,D-09,D-10,D-12,D-13,D-15,D-16,D-17,D-18) + 1 governança
(D-19); 6 MATCH"). Mapeamento defeito→CRV (fonte: `rule-releases/sofa/migration-notes.md`
§2–§3 e `reference-vectors.md`):

| elemento | caminho + SHA-256 | classificação | log de transformação | artefato V2 | teste V2 (CRV) |
|---|---|---|---|---|---|
| Constantes de corte e estrutura de banda (D-01,D-05,D-06 numérico,D-08,D-11,D-14,D-15) | `src/intensicare/services/sofa.py` `731b3507cc07b2d5318f4759229527d2eac1f45b62eba269168d43560739b84a` [pin]; `models/clinical_score.py` `fc987ad0d037b1f153451240178dc12ab988a1104d7bc4a88dc460972234ff43` [pin] | **VALIDATE** | Re-derivado de Vincent 1996 + Lambden 2019 | `rule-releases/sofa/specification.md` §3.1 | sem CRV citado no registro de revisão |
| Tratamento de insumo ausente/inválido (§6, HAZ-0005 confirmado nos 6 componentes) | `sofa.py:168-427,468-469,504` [pin] | **REJECT** | Substituído pela álgebra de status de 5 estados | `ADR-0008` | CRV-SOFA-0317–0323 |
| Curto-circuito de PAM ausente no eixo cardiovascular (D-07, "o pior defeito único do arquivo") | `sofa.py:301-335` [pin] | **REJECT** | Invertido: evidência de vasopressor domina; PAM só exigida se nenhum agente tabulado ativo | `rule-releases/sofa/specification.md` §4.4 | CRV-SOFA-0319 |
| Defaults de dose/agente CV desconhecidos (D-10) | `sofa.py:301-335` [pin] | **REJECT** | Dose ausente → `not_evaluated(missing_dose)`; agente não tabulado → `not_evaluated(vasoactive_agent_unmapped)`; terapia combinada agora representável | `rule-releases/sofa/specification.md` §4.4 I-4/I-5 | CRV-SOFA-0321/0322 |
| Ambiguidade de unidade de bilirrubina, apenas mg/dL com docstring "mg/dL ou µmol/L" (D-06) | `sofa.py` [pin] | **SUPERSEDE** | Canônico mg/dL com conversão exata ÷17,104 antes da banda; unidade não mapeável → `invalid` | `rule-releases/sofa/specification.md` §3.1 I-6 | CRV-SOFA-0310/0330 |
| Banda de risco de mortalidade | `sofa.py:40-59,124-138` [pin] | **REJECT** | Não citada, internamente inconsistente (assemelha-se a Ferreira 2001, não citado) | não declarado no registro de revisão (precisa de fonte nomeada + ratificação) | sem CRV citado no registro de revisão |
| Gate de ventilação e interpretação de teto-em-2 (D-02) | `sofa.py:190-195` [pin] | **VALIDATE** | Convenção comum mas não citada; decisão de escopo necessária | `rule-releases/sofa/specification.md` §4.3 | CRV-SOFA-0305/0306/0307 |
| Conceito `SOFAResult.missing_components` | `sofa.py:122`; `clinical_score.py:21,30` [pin] | **TRANSFORM** | Bom instinto, descartado na persistência (sem coluna de status) — D-17 | `ADR-0008` | CRV-SOFA-0317/0318 |
| Forma de persistência `clinical_score` | `clinical_score.py:21,30` [pin] | **REJECT** | Int não-nulo puro, sem coluna de status = metade-persistência do HAZ-0005 | `ADR-0008` | CRV-SOFA-0317/0318 |
| GCS sem tratamento de sedação (D-12), sem checagem de faixa (D-13) | `sofa.py` [pin] | **SUPERSEDE** | Faixa 3–15 obrigatória (`invalid` fora dela); confounding de sedação → `not_evaluated` default, subordinado à ADR de sedação pendente | `rule-releases/sofa/specification.md` §4.5 I-8; `REV-NS-01-gcs.md` §4; `ADR-0028` | CRV-SOFA-0331/0333 |
| Insumo único silencioso em renal (D-16); rótulo "24h" de débito urinário sem janela (D-15) | `sofa.py` [pin] | **SUPERSEDE** | Ambos os sub-insumos exigidos por padrão; janela explícita de 24h com frescor de fim-de-intervalo | `rule-releases/sofa/specification.md` §3.1 linha 14, §4.6 I-7 | CRV-SOFA-0323/0334 |
| Ausência de política de frescor (analógico a Q-10; HAZ-0006) | `sofa.py` (varredura completa) [pin] | **REJECT** | Janelas por insumo e horizontes de expiração propostos, descarrega VAL-0023 mediante ratificação | `rule-releases/sofa/specification.md` §3.2 | CRV-SOFA-0324/0325 |
| Conjunto de regras da era trilhas 001-012 (catálogo `docs/rules/clinical-scoring/RULE-CLINICAL-SCORING-*`) | manifesto `legacy-pin-cycle-1.md` linhas 453-461, 1078-1080 [pin]; código-fonte trilhas subjacente **SOURCE NOT LOCATED** | **REJECT** (retido como catálogo de falhas) | Substituído duas vezes; incoerência de unidade (regra 002/008 FiO2 %-vs-fração), defeitos de lacuna morta (regra 004 bilirrubina, regra 007 creatinina=5.0) | `HAZ-0032`; `rule-releases/sofa/reference-vectors.md` | CRV-SOFA-0309 (regra 004); CRV-SOFA-0315 (regra 007); CRV-SOFA-0330 (regras 002/008); CRV-SOFA-0332/0331 (regra 003/006); CRV-SOFA-0305-0307 (regra 002) |
| Reivindicações de ratificação legadas "RAT-*" (D-19) | `sofa.py:20` [pin]; `docs/plan/_work/ratification-decisions.yaml` `b90c3cbbf11f22e440d7258e1e9c8fd556009a4c572717b839f51e73f7ee4751` [reviewer-hash] | **REJECT** | Autoridade é "delegação do dono do repositório", não aprovador clínico nomeado; nula per `evidence-notation.md` §2 regra 3 | `ADR-0025` | sem CRV citado no registro de revisão |

**SOFA fork** (fonte: `sofa-fork-domain-formularios-review.md` §3, "sofa-fork
supplement"):

| elemento | caminho + SHA-256 | classificação | log de transformação | artefato V2 | teste V2 (CRV) |
|---|---|---|---|---|---|
| `_calculate_sofa`/`_sofa_severity` — segunda implementação duplicada de SOFA | `src/intensicare/services/domain_formularios.py` `61db0316a942ce3c1310be15ff0411b3f5bbbd58754aa4f58b2912f0230499d3` [pin] | **REJECT** | Duas identidades de versão coexistindo ("sofa-v1.0" vs "SOFA-v2.0.0"); HAZ-0005 agravado (metadado zero + rótulo tranquilizador "baixo_risco") | Regra V2: exatamente uma implementação por instrumento, governada por versão — `ADR-0007` | sem CRV citado no registro de revisão |

**Pathway sepse** (fonte: `sepse-pathway-clinical-review.md` §1, §3.2 — "99
registros RULE-SEPSE em sete clusters"; 5 gerações G1-G5 coexistindo, achados
P-01..P-12):

| elemento | caminho + SHA-256 | classificação | log de transformação | artefato V2 | teste V2 (CRV) |
|---|---|---|---|---|---|
| Catálogos de rastreio maior/menor G1-G3 | `docs/rules/clinical-scoring/RULE-SEPSE-001/-002/-005` [pin]; `docs/rules/alert-threshold/RULE-SEPSE-003/-004/-058` [pin]; +muitos mais, ver registro de revisão | **REJECT** (retido como catálogo de falhas) | Três gerações mutuamente contraditórias (AND/OR/igualdade estrita); ramos mortos (criterio_11 hard-coded false, RULE-SEPSE-037) | valor apenas de vetor de regressão | sem CRV citado no registro de revisão |
| Conceito de rastreio G4/G5 (gate de infecção + qSOFA-OU-SIRS) | `domain_sepsis.py:269-288` [pin]; `pathways/sepse.yaml:222-245` [pin] | **VALIDATE** (P-02) | Composto plausível mas estruturalmente inavaliável (nenhuma fonte de suspeita-de-infecção persistida) | CAND-0004, ownership clínica nomeada pendente | sem CRV citado no registro de revisão |
| Alerta G4 "disfunção orgânica" (qSOFA+lactato) | `domain_sepsis.py:291-322` [pin] | **REJECT** (P-03) | Substitui proxy não validado ao invés de ΔSOFA≥2 do Sepsis-3 | substituído pelo conceito ΔSOFA abaixo | sem CRV citado no registro de revisão |
| `sepsis_sofa_alert` raiz (`sofa_delta >= 2`) | `_work/alerts/sepse.yaml:51-61` [pin] | **TRANSFORM** | Único critério conforme Sepsis-3 no repositório; atualmente morto (sem produtor) | `ADR-0008` (via `sofa-review.md` §7) — exige baseline ratificado e SOFA completo avaliável | sem CRV citado no registro de revisão |
| Alertas de choque séptico (3 variantes) | `domain_sepsis.py:325-347` [pin]; `_work/alerts/sepse.yaml:63-81` [pin]; `pathways/sepse.yaml:266-288` [pin] | **REJECT** (P-04/P-05) | Lactato≥4 isolado afirma choque sem contexto; 3 definições mutuamente inconsistentes coexistem | "re-derivar diretamente de Singer 2016" — não declarado como artefato específico | sem CRV citado no registro de revisão |
| Temporizador de bundle da 1ª hora | `domain_sepsis.py:350-391` [pin] | **REFINE** (P-06) | Âncora precisa mover para tempo de reconhecimento, estratificação 1h/3h necessária | não declarado no registro de revisão | sem CRV citado no registro de revisão |
| Critério culturas-antes-de-antibióticos | `pathways/sepse.yaml:290-334,429` [pin] | **REFINE** (P-07) | Temporização internamente contraditória (3h vs 60min); precisa de enquadramento <45min | não declarado no registro de revisão | sem CRV citado no registro de revisão |
| Critério de fluido 30 mL/kg | `pathways/sepse.yaml:191-211` [pin] | **REJECT** (P-08) | Recomendação fraca hard-coded como crítica, sub-banda inventada, severidade invertida | não declarado no registro de revisão | sem CRV citado no registro de revisão |
| Alerta PCT em alta "falha de tratamento" | `domain_sepsis.py:394-420` [pin] | **REJECT** (P-09) | Sem base SSC 2021, limiar não citado | não declarado no registro de revisão | sem CRV citado no registro de revisão |
| Critério de de-escalonamento por PCT | `domain_sepsis.py:423-454` [pin] | **VALIDATE** (P-10) | Direção bate com SSC 2021 (fraca); limiares não citados | não declarado no registro de revisão | sem CRV citado no registro de revisão |
| Cálculo de SIRS | `domain_sepsis.py:197-235` [pin] | **VALIDATE** (P-01, bate exatamente com Bone 1992) | Papel do SIRS num rastreio de era 2021 é decisão clínica | não declarado no registro de revisão | sem CRV citado no registro de revisão |
| Contrato `sepsis_input_provider` de omitir-quando-desconhecido | `sepsis_input_provider.py:16-25` [pin] | **TRANSFORM** | Único componente legado alinhado à filosofia V2 de dado ausente, menos sua exceção de 2 escores | `ADR-0008` (álgebra de status; o código em si não sobrevive) | sem CRV citado no registro de revisão |
| Fluxo de 5 estados de cuidado (v4) | `pathways/sepse.yaml:384-413` [pin] | **VALIDATE** | Narrativa coerente mas transições não vinculadas a critérios | workstream de pathways (revisão estrutural) | sem CRV citado no registro de revisão |
| Selos "SSC-2021 RATIFIED"/RAT-SEPSE | `docs/plan/_work/ratification-decisions.yaml` [reviewer-hash]; `docs/plan/_work/dispositions/sepse-p1.yaml` `cd15c8b1968f0f1c72c0bb11862757a545b4b260fff0625d2b5275b4e3e57b90` [reviewer-hash] | **REJECT** | Governança §6 — "delegação do dono do repositório", não aprovador clínico nomeado; nula per `evidence-notation.md` §2 regras 3/4 | não declarado no registro de revisão | sem CRV citado no registro de revisão |

---

### 2.3 Motor de alerta / limiares

Registro de origem: `docs/05-clinical-safety/legacy-review/alert-threshold-engine/{README.md,
alert-threshold-cluster-review.md, engine-review.md, thresholds-seed-review.md}`.

| elemento | caminho + SHA-256 | classificação | log de transformação | artefato V2 | teste V2 (CRV) |
|---|---|---|---|---|---|
| Piso "normal" da severidade de leito (`derive_bed_severity`) | `src/intensicare/services/dashboard.py` `ae60425f025bc7387c720dfe2c35fa89b0c2e053d33e2ad81d78828a68ac1489` [pin] | **REJECT** | HAZ-0005, E1 confirmado ao nível de fonte | `ADR-0008` (estado `not_evaluated` V2) | sem CRV citado no registro de revisão |
| Motor de alerta (`alert_engine.py`) | `src/intensicare/services/alert_engine.py` `80980e3966626480a95af4ebe4ba379794dd4b74eaa99fb455923c2530df20ee` [pin] | **TRANSFORM** | Achados F2.1–F2.5: silêncio em 4 caminhos, lacuna de cobertura SOFA/qSOFA, `MultipleResultsFound`, opacidade de versão, caminho de criação duplicado | não declarado além do requisito de persistência de não-disparo | sem CRV citado no registro de revisão |
| Precedência do override "assistido" (mascaramento de severidade) | `src/intensicare/services/domain_alertas.py` `122806b0dc39da514952f152bdfcf8fa296a7e684f41607fb2620dfd95baabb9` [pin] + cluster RULE-ALERTAS-011, RULE-TRILHAS-ENGINE-004, RULE-INDICADORES-ETL-002/006 | **REJECT** | Achado 2 (§3); HAZ-0005/HAZ-0036 | não declarado no registro de revisão | sem CRV citado no registro de revisão |
| Janelas de cooldown/rate-limit/dedup | `alert_engine.py` [pin] + `notification_worker.py`, `correlation_engine.py`, `early-warning-scores.yaml` `712d9ccde209d099f80c4d5abb11e77e33564e03f347f931a363537c1031e9b8` [reviewer-hash] | **VALIDATE** | Tabela §4.1; julgamento clínico do owner necessário | não declarado no registro de revisão | sem CRV citado no registro de revisão |
| Supressão silenciosa sem registro persistido | mesmos arquivos acima | **REJECT** | HAZ-0016/HAZ-0022 negociados às cegas | requisito de auditoria de supressão | sem CRV citado no registro de revisão |
| Modelo de severidade (ordinal + triple-encoding + max-vence) | `src/intensicare/schemas/severity.py` `9f383ab935f3e90e796e81473d158354736c95d0550ad0f2020ee0d8a4a4066f` [pin] | **REFINE** | `p10_score` é escala mágica não citada (§5.2b) | não declarado no registro de revisão | sem CRV citado no registro de revisão |
| Motor de correlação | `src/intensicare/services/correlation_engine.py` `80001a3664c84b746aa43068864a3dd1f01c2aee9e01d13c4dfa1f276ab8bb96` [pin] | **VALIDATE** | Preocupação de supressão de membro HAZ-0022 (§6.1) | não declarado no registro de revisão | sem CRV citado no registro de revisão |
| Compilador de alerta + gates | `src/intensicare/services/alert_compiler.py` `a3d2223155e817d7463d4cefed29da98a9ca994d464f3fdb53cec117417b8a8a` [pin] | **REJECT** | Gate "falso-verde" classe HAZ-0031 | reconstrução sobre AST real em V2, não nomeada | sem CRV citado no registro de revisão |
| ADR-0039 legada — agrupamento em tempo de leitura + flag escalante | `src/intensicare/api/v1/alerts.py` `46d6b5042ac6acb76bfe01068f614e87a5c3bd7ececa4e3123ea8c2b35a3c939` [pin] | **REFINE** | Desenho de zero-perda-de-informação citado (§4.1/4.3) | ADR-0039 legada (referência apenas) | sem CRV citado no registro de revisão |
| Modelo de configuração de threshold (conceito e implementação mutável-in-place) | `src/intensicare/models/threshold_config.py` `8c93cadddeacd7d6cce3f34e2ed0718410ab037ce15050279ad4af5baccecbbc` [pin] | **REFINE** (conceito) / **REJECT** (mutação in-place) | Sem teste de invariante de ordenação no legado | **entrada para ADR-0007** | sem CRV citado no registro de revisão |
| Resolvedor de threshold (leito ≻ unidade ≻ tenant) | `src/intensicare/services/threshold_resolver.py` `0b02d8ace9bdc89695eeaa2e08d81b2a72070c27624265190b2005883c20ee6f` [pin] | **TRANSFORM** | Serviço único de resolução V2 | **entrada para ADR-0007** | sem CRV citado no registro de revisão |
| Migração 0038 — mecanismo de seed e valores das linhas 3/5/6 (MEWS crítico, NEWS2 urgente/crítico) | `alembic/versions/0038_seed_default_threshold_config.py` `c11d640d1a29aab2d99e39a741d35bceec2a6d688e174db3cbded2bf089c4486` [pin] | **REFINE** (mecanismo) / **VALIDATE** (linhas 3/5/6) | Idempotente, anotado com evidência | não declarado no registro de revisão | sem CRV citado no registro de revisão |
| Migração 0038 — valores das linhas 1/2/4 (MEWS watch/urgent, NEWS2 watch) | mesmo arquivo acima | **REJECT** (como semeado) | Não citado, atribuído incorretamente, erro de dimensão (§3.1) | **entrada para ADR-0007** | sem CRV citado no registro de revisão |
| ADR-0014 legada (sem flagging de valor-anormal-por-threshold) | `docs/adr/0014-no-abnormal-value-threshold-flagging.md` `0e748e0fb19a1aeee884f270f228367bff9663f9135cf50ee43ade7d82d81044` [reviewer-hash] | **ARCHIVE** | Substituída pela ADR-0019 legada; mantida como contexto apenas | não declarado no registro de revisão | sem CRV citado no registro de revisão |
| Cluster de regras alert-threshold (116 registros `docs/rules/alert-threshold/`) | manifesto de pin, ver `alert-threshold-cluster-review.md` §2 (por-regra) | **TRANSFORM 18 · VALIDATE 45 · SUPERSEDE 15 · REJECT 38** (tally §3, ver §3 abaixo) | Nenhum grupo pronto para importação por construção (§4.1) | não declarado no registro de revisão | sem CRV citado no registro de revisão |

---

### 2.4 KPIs

Registro de origem: `docs/05-clinical-safety/legacy-review/kpi/{kpi-inventory.md,
kpi-bed-grid-dashboard.md, kpi-indicators-catalogue.md, kpi-efficiency-stewardship.md,
kpi-ppv-tracker.md, kpi-operational-time-and-etl-rules.md}` + consolidação em
`docs/05-clinical-safety/pathway-portfolio/clinical-kpi-review.md`.

**INFERENCE:** `clinical-kpi-review.md` §0/§1.6 é explícito que **zero** cálculos
KPI legados são mantidos como implementados — todo `KEEP` é reconstrução com
refinamentos declarados, todo `REDEFINE` descarta a aritmética legada por
completo. Tally próprio desse documento (§1.6): **6 KEEP(refinado), 9 REDEFINE, 6
REDEFINE-CONDITIONAL, 10 (+31 membros de catálogo) DROP, 3 OUT OF SCOPE**. Isso é a
disposição final V2; a tabela abaixo é o veredito da revisão forense por trás
dela.

| elemento | caminho + SHA-256 | classificação | log de transformação | artefato V2 | teste V2 (CRV) |
|---|---|---|---|---|---|
| Censo total do dashboard (KPI-DASH-01) | `src/intensicare/services/dashboard.py` `ae60425f025bc7387c720dfe2c35fa89b0c2e053d33e2ad81d78828a68ac1489` [pin] | **REFINE** | Roll-up por status ausente | `clinical-kpi-review.md` §3 (KPIR-*) | sem CRV citado no registro de revisão |
| `critical_count` (KPI-DASH-02) | mesmo arquivo | **TRANSFORM** | Padrão HAZ-0005, pior caso da revisão | álgebra de status V2 (`valid`/`partial`-aprovado apenas) | sem CRV citado no registro de revisão |
| `active_alerts_total` (KPI-DASH-03) | mesmo arquivo | **TRANSFORM** | Lacuna de visibilidade de não-disparo (SAF-0019) | forma SM-04 (por paciente-dia, por severidade, por versão de regra) | sem CRV citado no registro de revisão |
| Severidade de leito derivada (KPI-DASH-06) | mesmo arquivo | **SUPERSEDE** | Violação HAZ-0005/SM-03, mesmas linhas de DASH-02 | `ADR-0008` §2 | sem CRV citado no registro de revisão |
| Indicador de vitals-staleness (KPI-DASH-08) | `frontend-v3/lib/vitals-staleness.ts` `b42d43092dc2dc33d2723a7d829a42b39a2e004de29c61669f53cc42c4b27d1e` [reviewer-hash] | **TRANSFORM** | Achado BUG-F3-01 | `ADR-0008` §3.4 (staleness server-side) | sem CRV citado no registro de revisão |
| Endpoint de avaliação de eficiência | `src/intensicare/api/v1/efficiency.py` `530a04f6bfc5ec539548c5de52e9b0609dc8e20743ecec958101ea6a23783559` [pin] | **REJECT** | Superfície de servir-de-insumo-vazio; `hash(mpi_id)` com salt de processo, não reproduzível | não declarado no registro de revisão (V2: `not_evaluated` com motivos) | sem CRV citado no registro de revisão |
| Gerador mock/summary/history de indicadores | `src/intensicare/api/v1/indicators.py` `dc54ca40408ec2a90d37bb412ea5e09c5889c1490abf4c479b57fde134f2d597` [pin] | **REJECT** | Mecanismo falso-verde mais forte da superfície KPI | `success-and-harm-metrics.md` §0 regra 3 | sem CRV citado no registro de revisão |
| Catálogo de 31 métricas candidatas (KPI-IND) | mesmo arquivo | **VALIDATE** | Sem defeito nomeado; catálogo de métrica candidata apenas | não declarado no registro de revisão | sem CRV citado no registro de revisão |
| Cálculo e lógica de meta de PPV (KPI-PPV-01) | `src/intensicare/services/ppv_tracker.py` `da66f4aa946278618fb42684c1644feb4871e262fc742f96023d0992b1116783` [pin] | **SUPERSEDE** | Não conectado, metas falso-verde, `intervention_done` como TP, viés de seleção de denominador | Desenho SM-03 (adjudicação cega, pré-registrada) | sem CRV citado no registro de revisão |
| Meta padrão falso-verde de PPV (anti-padrão registrado) | mesmo arquivo | **REJECT** | Achado (b); `tests/test_ppv_tracker.py:41-45` | `success-and-harm-metrics.md` §0 (stop-condition) | sem CRV citado no registro de revisão |
| Construto "taxa de fadiga" de PPV | mesmo arquivo | **REJECT** | Achado (e), inconsistências internas | HM-02 (composto real de fadiga) | sem CRV citado no registro de revisão |
| Comprimento de estadia (KPI-OPS-01) | `src/intensicare/services/domain_operacional.py` `b0a3d04086a8a07c7a5fdec957232a40a52b9eab0e6b5276cf68f955dc3ff2ce` [pin] | **REFINE** | Truncamento de fronteira de dia UTC/local | não declarado no registro de revisão | sem CRV citado no registro de revisão |
| Coerção numérica segura `get_number` (KPI-OPS-03) | mesmo arquivo | **REJECT** | Nomeado como padrão proibido P-1 (`ADR-0008` §4) | `ADR-0008` §4 P-1 | sem CRV citado no registro de revisão |
| RULE-INDICADORES-ETL-001/002 (% share) | `docs/rules/alert-threshold/RULE-INDICADORES-ETL-001-*.md` `7f1de10ea517323ea999c7dfe386bbc144b5d62fd312eb93b6adc76cde56cea5` [pin]; `RULE-INDICADORES-ETL-002-*.md` `c3e72cedc175b7044687f963f08d9e3f5a6e579235a31cd4ef78057ffaeab003` [pin] | **TRANSFORM** | Computado no cliente; deve ser server-side sobre contagens com status | não declarado no registro de revisão | sem CRV citado no registro de revisão |
| RULE-INDICADORES-ETL-005 (cores de ocupação) | `.../RULE-INDICADORES-ETL-005-*.md` `e45168c37a97e461060df64e72a9eed4120eaa1fa12fcaa22fc14df7a0a1720e` [pin] | **VALIDATE** | Fórmula de ocupação em si **SOURCE NOT LOCATED** (§4) | não declarado no registro de revisão | sem CRV citado no registro de revisão |
| RULE-INDICADORES-ETL-007 (discrepância de 4 baldes) | `.../RULE-INDICADORES-ETL-007-*.md` `874c293a54c14a65184684620a5a19f7ace2cbc0a6773af4750d575e9bb14f60` [pin] | **REJECT** (como está) | DISCREPANCY registrada; enum precisa resolução antes de qualquer contagem | não declarado no registro de revisão | sem CRV citado no registro de revisão |
| RULE-INDICADORES-ETL-023 (6 macro-KPIs) | `.../RULE-INDICADORES-ETL-023-*.md` `66ccd2e5886d44baca055dbb8e672ed1f656623661bcc1e98d1b5c93e1bbf8ef` [pin] | **VALIDATE** (fórmulas) / **REJECT** ("vidas salvas" sem rastreabilidade) | Fórmulas **SOURCE NOT LOCATED** — computadas em objetos Oracle Tasy upstream (§4.2) | não declarado no registro de revisão | sem CRV citado no registro de revisão |

---

### 2.5 Escores neuro/sedação (incl. GCS)

Registro de origem: `docs/05-clinical-safety/legacy-review/neuro-sedation-scores/{README.md,
REV-NS-01..09}.md`.

**Achado importante (OBSERVED):** nenhum dos 9 registros desta família cita
ADR-0025/0026/0027/0028 por número (`links.adrs: []` em todo front matter,
confirmado por grep). GCS tem rule-release V2 publicado
(`docs/05-clinical-safety/rule-releases/gcs/`), mas `REV-NS-01-gcs.md` não cita
esse diretório nem um CAND-####. A ligação GCS-review → GCS-rule-release é
reconstruída aqui apenas pelo mapeamento defeito→CRV publicado no próprio
`migration-notes.md` do GCS (§2–§3), não por citação cruzada explícita da
revisão. Registrado como risco de proveniência em aberto (§4).

| elemento | caminho + SHA-256 | classificação | log de transformação | artefato V2 | teste V2 (CRV) |
|---|---|---|---|---|---|
| GCS | `src/intensicare/services/domain_formularios.py` `61db0316a942ce3c1310be15ff0411b3f5bbbd58754aa4f58b2912f0230499d3` [pin]; `sofa.py`, `qsofa.py` [pin]; +15 outros, ver registro de revisão | **TRANSFORM** | Faixa 3-15 correta retida; armazenamento de total-apenas, coerção-a-1 do motor de formulários, e ausência de gate de sedação rejeitados | `rule-releases/gcs/specification.md` | CRV-GCS-0205, CRV-GCS-0207, CRV-GCS-0208, CRV-GCS-0209/0210/0212/0213, CRV-GCS-0215/0216, CRV-GCS-0217/0218 |
| RASS | `domain_sedacao.py` `f0be9ac1164b6e453e03d91fc36b66d5aa24b4db751f7010326d4307a9e17a13` [pin]; `domain_formularios.py` [pin]; `domain_pharmaco_delirium.py` `f6c48a1d9545d66da3a744e0087b090f3648cfe3eb8d6a817f164138f2d9a401` [pin]; +9 outros, ver registro de revisão | **REFINE** | Comportamento de clamping citado genericamente (`tests/test_domain_formularios.py:316-322`) | não declarado no registro de revisão | sem CRV citado no registro de revisão |
| NRS (dor) | `domain_sedacao.py` [pin]; `domain_formularios.py` [pin]; `domain_respiratory.py` `51344a4db6e5e168e64a28ea371e308fc76d4291e3cbad8d91c93342414738b9` [pin]; +6 outros | **REFINE** | Defeito RULE-PIORA-CLINICA-006 (banda severa `7<=dor>10` insatisfazível, pontua dor severa como "0"); corrigido em `neuro-sedation.yaml` ALERT-NEUROSED-PAIN-08, deve virar teste negativo V2 | não declarado no registro de revisão | sem CRV citado no registro de revisão |
| BPS | `domain_sedacao.py` [pin]; `domain_formularios.py` [pin]; `_work/alerts/pathways/sedacao.yaml` `21dfa0bd03b633a196e10de6f752c195d62448a86f5c72190a0dfab1a3675657` [pin]; +6 outros | **REFINE** | Defeito RULE-PIORA-CLINICA-007 (banda severa `10<=sinais>12` insatisfazível, BPS 10-12 pontua "0"), deve virar teste negativo V2 | não declarado no registro de revisão | sem CRV citado no registro de revisão |
| CAM-ICU (caminho serviço-sedação) | `domain_sedacao.py` [pin]; `delirium.yaml` `571f8e31310fc88613909dc17ba7df3b254c289ce799c88662f14059e9e69208` [pin]; +6 outros | **REFINE** | Suítes "CAM-ICU + deep-sedation-gate" citadas genericamente | não declarado no registro de revisão (referencia REV-NS-09 para arquitetura de alerta) | sem CRV citado no registro de revisão |
| CAM-ICU (caminho formulários clínicos) | `domain_formularios.py` [pin]; `models/sedacao.py` `b790b4b0e7be1550f7b5276a9ec8f1504b056b7db8f668a063f79913dd419c8b` [pin]; +6 outros | **REJECT** | ALERT-NEUROSED-DELIRIUM-04 e ALERT-NEUROSED-SCREEN-GAP-05 (blocos de catálogo mortos); defeito de citação (catálogo cita Ely NEJM 2001, correto é JAMA 2001;286(21):2703-2710) | não declarado no registro de revisão | sem CRV citado no registro de revisão |
| Gravidade de SDRA (Berlim) | `RULE-CLINICAL-SCORING-017-*.md` `a4f9e9778397f504f4d45ebe7f6cbf72327f6737d9302baf95209334ceac20b5` [pin]; `domain_pharmaco_delirium.py` [pin]; `neuro-sedation.yaml` `b5f0371333331b8ee45d4e4355902fa9da14773282c375f8d1dd959ad659a627` [reviewer-hash] | **SUPERSEDE** | V2 deve desenhar SDRA nativamente contra Berlim 2012 | não declarado no registro de revisão | sem CRV citado no registro de revisão |
| FOIS (escala de ingestão oral funcional) | `RULE-CLINICAL-SCORING-018-*.md` `cab66d9ebcdad1a1d1450a41d07cdc2dc2a443caa66e85aaeb224282d200bade` [pin]; `RULE-NUTRICAO-002-*.md` `907a3b0e9d99f7d564023476d3ee5e8f6a8dea86a9ce6bc92e88779e0fb1cf76` [pin] | **VALIDATE** | Sem implementação de runtime encontrada (NL-2, §3) | não declarado no registro de revisão | sem CRV citado no registro de revisão |
| Enumerações de consciência (captura/pontuação ACVPU) | `mews.py` `43f7a8e17a31ea21f61ec53b2bcee68ff64067387c687e23714382f4737e922c` [pin]; `news2.py` [pin]; `schemas/vitals.py` [pin]; +7 outros | **TRANSFORM** | Padronizar em ACVPU per NEWS2, GCS per REV-NS-01 | não declarado no registro de revisão | sem CRV citado no registro de revisão |
| Enumerações de consciência — comparador invertido (RULE-SEPSE-033) | `RULE-SEPSE-033-*.md` `fe602cb8e0f12bba4878298bd3574ff42ccec0fbcadea66bae508b17d4837c3c` [pin]; `mews.py`, `news2.py` [pin] | **REJECT** | Comparador de "variação do nível de consciência" com direção invertida (dispara na melhora, silencia na deterioração) | não declarado no registro de revisão | sem CRV citado no registro de revisão |
| Domínio sedação-desmame (núcleo mantido) | `domain_sedacao.py` [pin]; `sedacao.yaml` [pin]; +12 outros | **REFINE** | Sem defeito nomeado | não declarado no registro de revisão | sem CRV citado no registro de revisão |
| Domínio sedação-desmame — regras predecessoras quebradas / runners mortos | `domain_pharmaco_delirium.py` [pin]; `RULE-SEDACAO-003-*.md` `8e68b6414b818f9cbb9ec438ba5f6685d7b53cd64df1040e5b3b58d1d4d1485c` [pin]; `RULE-SEDACAO-004-*.md` `8b5a4c9559202a19e8ab3b7015e110a0c07e764d967dd4244c686241b5472588` [pin] | **REJECT** | RULE-SEDACAO-003 (intervalo vazio `-3<=int(rass)<=-5`, inalcançável); RULE-SEDACAO-004 (limiares fio2/fr impossíveis, lógica de ausência-de-droga invertida); vetor TV-3 de ALERT-NEUROSED-OVERSED-01 já corrige RULE-SEDACAO-003 | não declarado no registro de revisão | sem CRV citado no registro de revisão |
| Domínio sedação-desmame — fronteiras de banda/cortes/unidades do pathway | `sedacao.yaml` [pin]; `delirium.yaml` [pin]; `desmame.yaml` `808e81b2de592b0bd9f1bae09e505e5db2d910b6f09fc21ec1f5ef56ecf2574a` [pin] | **VALIDATE** | Sem defeito nomeado | não declarado no registro de revisão | sem CRV citado no registro de revisão |
| Domínio sedação-desmame — arquitetura de camada de alerta morta | `domain_pharmaco_delirium.py` [pin]; `pyproject.toml` legado `716a9354b75face954281e215ee8f21d2d895cbab2ab2a31b159d561a2c4d800` [reviewer-hash] | **SUPERSEDE** | Falha de importação: `from maezo.rules.alert_compiler import ...`, pacote inexistente | desenho de alerta V2 substitui por completo | sem CRV citado no registro de revisão |

---

### 2.6 Pathways (12) e motor compartilhado

Registro de origem: `docs/05-clinical-safety/legacy-review/pathways/{pathway-index.md,
rules-cluster-disposition.md, engine-review.md, <12 arquivos>-review.md}`. Contagem
confirmada: **12 pathways** (`pathway-index.md` §1) — antimicrobiano, delirium,
desmame, equilibrio, estabilidade, nutricao, profilaxia, renal, respiratorio,
sedacao, sepse, ventilacao — + o motor compartilhado. Todos os 12 hashes de YAML
batem byte-a-byte com `legacy-pin-cycle-1.md` linhas 49-60.

Citação (`pathway-index.md` §4, verbatim): *"12/12 pathways carry a citation; 8
DOIs MATCH, 1 BROKEN (equilibrio), 1 MISMATCH (profilaxia), 1 PARTIAL (renal),
plus 1 unidentifiable secondary citation (desmame 'BURN Trial'). Zero pathways are
fully UNCITED."*

| pathway | caminho + SHA-256 | classificação | log de transformação | artefato V2 | teste V2 (CRV) |
|---|---|---|---|---|---|
| antimicrobiano | `_work/alerts/pathways/antimicrobiano.yaml` `0ef987c51ad18ab9dea0123da1fec8c2c07b96833abe6a5ce9ee6db8e4e3758f` [pin] | **VALIDATE** | HAZ-0005, HAZ-0043 citados | CAND-0006 (placeholder coletivo, INV-GAP-1; split por pathway pendente G2-VAL-0002) | sem CRV citado no registro de revisão |
| delirium | `_work/alerts/pathways/delirium.yaml` `571f8e31310fc88613909dc17ba7df3b254c289ce799c88662f14059e9e69208` [pin] | **VALIDATE** | HAZ-0005, HAZ-0016, HAZ-0043; severidade de RASS contradiz sedacao.yaml para o mesmo valor | CAND-0006 (coletivo) | sem CRV citado no registro de revisão |
| desmame | `_work/alerts/pathways/desmame.yaml` `808e81b2de592b0bd9f1bae09e505e5db2d910b6f09fc21ec1f5ef56ecf2574a` [pin] | **VALIDATE** | HAZ-0005, HAZ-0043; citação secundária "BURN Trial (2016)" não identificável | CAND-0006 (coletivo) | sem CRV citado no registro de revisão |
| equilibrio | `_work/alerts/pathways/equilibrio.yaml` `5d3af65ac19c81d4574a8c5848f4599949aad666ef0be808cdeb672607e60194` [pin] | **VALIDATE** | HAZ-0005, HAZ-0043; DOI `10.1007/s00134-012-2768-4` retorna HTTP 404 no Crossref | CAND-0006 (coletivo) | sem CRV citado no registro de revisão |
| estabilidade | `_work/alerts/pathways/estabilidade.yaml` `bf61744c263f40f630931293fcf4fc95b90e573609390abee42d37c7b3c5bcc9` [pin] | **VALIDATE** | HAZ-0005, HAZ-0016, HAZ-0043 | CAND-0006 (coletivo) | sem CRV citado no registro de revisão |
| nutricao | `_work/alerts/pathways/nutricao.yaml` `b2dc4ae2f7fff4bcad5e1923647053fdcfd1565c7b5a0f9cf850628bd561dd95` [pin] | **VALIDATE** | HAZ-0005, HAZ-0043 | CAND-0006 (coletivo) | sem CRV citado no registro de revisão |
| profilaxia | `_work/alerts/pathways/profilaxia.yaml` `0e33e945a67e0671c7f6cc957215c1f221d7b1f13e5ef01f8d024ad0584598bc` [pin] | **TRANSFORM** | HAZ-0005, HAZ-0021, HAZ-0043; inversão de direção do alerta (dispara com profilaxia dada, silencia quando omitida) | CAND-0006 (coletivo) | sem CRV citado no registro de revisão |
| renal | `_work/alerts/pathways/renal.yaml` `a052e6c26835e3c7c8ade5e62ed7272b779edf95cfd47c6a3105fc3d90db4153` [pin] | **TRANSFORM** | HAZ-0005, HAZ-0032, HAZ-0043; falso-normal por incompatibilidade de unidade (`urine_output_ml_day` em banda mL/kg/h) | CAND-0006 (coletivo) | sem CRV citado no registro de revisão |
| respiratorio | `_work/alerts/pathways/respiratorio.yaml` `9792ca62fc663d77315ae5e0ea41d9bbcb2b6bfa36c55eaeb42bb05533ad5d1e` [pin] | **VALIDATE** | HAZ-0005, HAZ-0032, HAZ-0043; vetor falso-normal FiO2 fração-vs-percentual | CAND-0006 (coletivo) | sem CRV citado no registro de revisão |
| sedacao | `_work/alerts/pathways/sedacao.yaml` `21dfa0bd03b633a196e10de6f752c195d62448a86f5c72190a0dfab1a3675657` [pin] | **VALIDATE** | HAZ-0005, HAZ-0016, HAZ-0043; RASS −4 = crítico aqui, watch em delirium.yaml | CAND-0006 (coletivo) | sem CRV citado no registro de revisão |
| sepse | `_work/alerts/pathways/sepse.yaml` `b84c9693295f5d820cb2796b6a789f10cfb9200409741af4e0ba78b7ad4ec7f0` [pin] | **TRANSFORM** (estrutural; adjudicação clínica deferida ao workstream de escores de sepse) | HAZ-0005, HAZ-0021, HAZ-0043; 31 vetores de paridade (1 xfail = tendência delta-lactato); marcadores RAT-SEPSE-01/02 sem referente localizado neste ciclo | CAND-0006 (coletivo) | `tests/test_sepse_yaml_parity.py` [reviewer-hash] |
| ventilacao | `_work/alerts/pathways/ventilacao.yaml` `d1c48956f19eb55633f034cd800b05ed35004664864942f75533e1635a6fd8d3` [pin] | **REJECT** (como pathway; cortes P/F de Berlim sólidos, rotear via trabalho sucessor desmame/respiratorio) | HAZ-0005, HAZ-0043; `test_missing_input_produces_no_firing` | **CAND-0005** — stub apenas-nome (`candidate-inventory.md`) | `tests/test_trilhas_evaluator.py:437-449` [reviewer-hash] |
| motor de pathway (registry + schema) | `trilhas_compiler.py`, `trilhas_evaluator.py`, `pathway.schema.json` `68ca230a47b7ad5be991cdfc4319ad1d6a6e6112d14b185506588ebed772a203` [pin], `registry.json` `bb2db7f853a6ee8f9f420aa88dd078acb20cd0e4a09e7cb98ab7ed644c7fba77` [pin]; lista completa de 14 arquivos em `engine-review.md` §0 | **SUPERSEDE** | HAZ-0005, HAZ-0016, HAZ-0021, HAZ-0022, HAZ-0040, HAZ-0043; `scripts/check_vector_coverage.py` reproduzido ao vivo em 2026-08-15 (falso-verde, sai 0 em cobertura 0/0) | Não é CAND-#### em `candidate-inventory.md`; substituto V2 é o contrato `evaluation-status-semantics.md` (`engine-review.md` §9) | `tests/test_trilhas_evaluator.py`, `tests/test_sepse_yaml_parity.py` [reviewer-hash] |

`rules-cluster-disposition.md` disposiciona um corpus **diferente** — 211
registros extraídos de `docs/rules/care-pathway/` — não uma revisão por-pathway-YAML.
Tally próprio (§1, verbatim): "AMBIGUOUS 19, DISCREPANCY 30, OK 162"; tally de
veredito (§2, verbatim): "REJECT 33, SUPERSEDE 124, VALIDATE 54" (soma 211). Ver
§3 abaixo.

---

### 2.7 Domínios de suporte orgânico e segurança medicamentosa (OSMS)

Registro de origem: `docs/05-clinical-safety/legacy-review/organ-support-med-safety/{README.md,
domain-catalogs-review.md, electrolyte-review.md, fluid-balance-review.md,
hemodynamics-stability-review.md, medication-safety-review.md, renal-aki-review.md,
respiratory-ventilation-review.md, cluster-*.md (9 clusters)}`.

**Cobertura (README, verbatim):** *"89/89 items covered — 76 reviewed in this
directory, 13 test files listed-not-reviewed per the assignment rule."* **1
veredito BLOCKED** — polaridade de critério booleano em profilaxia.yaml/antimicrobiano.yaml
aguarda decisão do workstream de pathways sobre o motor trilhas
(`medication-safety-review.md` §7). **Verificação de integridade (OBSERVED):**
SHA-256 recomputado para os 72 artefatos não-regra/não-teste no escopo — todos
batem com `00-inventory/inventory.md`.

**Registros de domínio (7 arquivos):**

| elemento | caminho + SHA-256 | classificação | log de transformação | artefato V2 |
|---|---|---|---|---|
| renal/AKI — motor Cr/UO/RRT (`domain_aki.py`) | `src/intensicare/services/domain_aki.py` `82284ef37a681baca80daab55d00f65f8ba5b1a8e58edb2423954503bfb66e09` [pin] | Cr: **VALIDATE** / UO: **REJECT** (implementação) / RRT: **REJECT** | Banda estágio-2 de UO inalcançável (bloco morto sobrescrito); RRT aninhado dentro do guard de presença-de-Cr pontua paciente em RRT como 0 (HAZ-0005); `should_auto_resolve` autoresolve-em-atraso (HAZ-0006+HAZ-0022) | não declarado no registro de revisão |
| renal/AKI — catálogo `aki.yaml` | `docs/plan/_work/alerts/aki.yaml` `409f363d356311514b605df0876ffb0a1e9ec1f2d15017e7b42342778453e42c` [reviewer-hash] | **VALIDATE** | "Artefato mais forte" (17 vetores testados em fronteira) | proposta: catálogo vira fonte única, código corrigido a ele — sem artefato V2 nomeado |
| renal/AKI — `renal.yaml` (pathway) | `_work/alerts/pathways/renal.yaml` `a052e6c26835e3c7c8ade5e62ed7272b779edf95cfd47c6a3105fc3d90db4153` [pin] | **REJECT** (bandas) / **TRANSFORM** (conceito) | Bandas de Cr absoluto mal-rotuladas "KDIGO 2/3"; "Anúria" mal-rotulada a 0,25 mL/kg/h | não declarado no registro de revisão |
| electrolyte — avaliador de fosfato (pior achado) | `src/intensicare/services/domain_electrolyte.py` `ffdd4f931c7b37c7e55079ad1dac2c4685bc4318566c2ccf646ea1175a4fc5cc` [pin] | **REJECT** (implementado) | Código reivindica "CLINICALLY RATIFIED: RAT-ELY-01" contra catálogo/seed/spec "pending"; troca de unidade mg/dL→mmol/L; sufixo de registro de definição divergente (HAZ-0019/HAZ-0035) | não declarado no registro de revisão |
| electrolyte — avaliadores K / Na / taxa-de-correção de Na | mesmo arquivo | **VALIDATE** / **VALIDATE** / **VALIDATE** | Desenho de taxa de correção guarda o vetor TV-6 do catálogo | não declarado no registro de revisão |
| electrolyte — avaliador de Cálcio (emissão de QTc morta) | mesmo arquivo | **REFINE** | Vetor TV-7 do catálogo assere emissão `qtc_risk_electrolyte` em QTc>500; código lê insumo e descarta (expressão solta, linha 314) | não declarado no registro de revisão |
| fluid balance — motor de janela/balde por dia de enfermagem, correção `tempo_criacao` | `src/intensicare/services/domain_fluid_balance.py` `1f7ac65c87da67ce0fee5d8953d1b8a3c3da9aba1c7f0c6f44c30521fb36b43b` [pin] | **REFINE** / **VALIDATE** | Docstring nomeia RAT-BALANCO-HIDRICO-03/04/05/06/08/09; corrige família de janela RULE-BALANCO-HIDRICO-006..013 | não declarado no registro de revisão |
| fluid balance — coerção de quantidade/timestamp (pior achado) | mesmo arquivo | **REJECT** (implementado) | Quantidade decimal-com-vírgula ("250,5") zerada para 0,0 mL — mesma família de defeito de locale que SYS-09 (peso) que mascarou oligúria | não declarado no registro de revisão |
| hemodinâmica — grupo núcleo SHOCK-INDEX-01..CRT-NORAD-12 | `src/intensicare/services/domain_hemo.py` `163357983e65e12dd4df643b97e3ad0e1e1310d57914fdaef14ddd6b6918dc04` [pin] | **VALIDATE** | Desenho mcg/kg/min aposenta explicitamente limiares mL/h não conversíveis do legado (RULE-ESTABILIDADE-007/008/009) | não declarado no registro de revisão |
| hemodinâmica — `domain_estabilidade.py`, wrapper de 27 critérios (pior achado) | `src/intensicare/services/domain_estabilidade.py` `2c838c4fbb5c368b1e8a1d5a4c8d4b0b22d6458079a3198ca1a0f69ba2b0f7b8` [pin] | **REJECT** (agregado) / **TRANSFORM** (conceito de checklist) | Contagem-como-severidade (escore/27 → estável/atenção/crítico) mascara emergências singulares; "sem dados" pontuado como não-cumprido (HAZ-0005 em escala agregada) | não declarado no registro de revisão |
| respiratório/ventilação — grupo núcleo Berlim ARDS-STAGING-01 | `src/intensicare/services/domain_respiratory.py` `51344a4db6e5e168e64a28ea371e308fc76d4291e3cbad8d91c93342414738b9` [pin] | **VALIDATE** | P/F 100/200/300 com gate PEEP≥5; S/F 315/235 per Rice 2007; ausência de gate sem registro not-evaluated (HAZ-0021) | não declarado no registro de revisão |
| respiratório/ventilação — `api/v1/ventilation.py` (pior achado, transversal à família) | `src/intensicare/api/v1/ventilation.py` `b0f21471ff7488205e160edfcf2605647cd73efbcc5a041169964bbea38794b5` [pin] | **REJECT** | Dados fabricados `_SAMPLE_PATIENTS`/`_SAMPLE_HISTORY` servidos em `GET /patients/{mpi_id}/ventilation` sem flag de demo (família HAZ-0036) | não declarado no registro de revisão |
| medicação — `domain_antimicrobiano.py` (caminho evaluate) | `src/intensicare/services/domain_antimicrobiano.py` `d6d0e02f42a8a0bd412adffcaa3f4d13fb6688f3c1092ef114c445a5cab1e858` [pin] | **REJECT** | Predicado `is_met` sempre verdadeiro quando insumos fornecidos; placeholder do motor de regras sempre `met=False`; piso contagem-como-severidade ≤3→NEUTRO "adequado" | não declarado no registro de revisão |
| medicação — validação de dose `drug_safety.py` | `src/intensicare/services/drug_safety.py` `f4197af10f451fd20f2a2320ca7a25baedc88202fd9458670faa567d2ad2bbb7` [pin] | **REJECT** (implementado) | `_validate_dose` lê apenas `max_single_mg`; drogas de alto-alerta não-mg (insulina/heparina/KCl/NaCl3%/norepi/dobutamina/fentanil) pulam checagem silenciosamente; R33 dosagem pediátrica fracionária rejeitada | não declarado no registro de revisão |
| medicação — base de interações `drug_interactions.py` | `src/intensicare/services/drug_interactions.py` `199afda58f6131dc57e985bc90120e0205ace1cf5fc94b40051d38a09ff08ed8` [pin] | **REJECT** (conteúdo) / **TRANSFORM** (mecanismo) | Interação vancomicina×amiodarona QT, norepinefrina×dobutamina, ceftriaxona×NaCl3% (R26) sinalizadas como fabricadas/erradas; R18 rotula erroneamente detecção-de-duplicação como checagem de alergia | não declarado no registro de revisão |
| medicação — escore de transfusão `domain_eficiencia.py` | `src/intensicare/services/domain_eficiencia.py` `c9f779e3ef88ee0b807092b6ecc5c2784dafa3fd17cb5b9e7237254b011b5128` [pin] | **REJECT** | TF-002 gatilho restritivo invertido; `appropriate = met_count >= 8` de 12; defeito rastreado a RULE-EFICIENCIA-002 | não declarado no registro de revisão |
| medicação — validadores V03/V04 de prescrição | `src/intensicare/services/domain_prescricao.py` `31bb4dae220f129a9f56a27fa006adc0e507aae17d43487abba955f1e6c211de` [pin] | **REJECT** (V03) / **VALIDATE** (V04, com decisão de política pendente) | V03 nunca lê lista de alergia do paciente; V04 bloqueia só `contraindicated`, avisa em `severe` | não declarado no registro de revisão |
| medicação — catálogo `pharmaco-interaction.yaml` (artefato mais bem citado do escopo) | `docs/plan/_work/alerts/pharmaco-interaction.yaml` `ee403fbe4d63d694993ac4858f83f8bc3cc920cbe413f3323b3e6c8fae6fc992` [reviewer-hash] | **VALIDATE** | 8 alertas/34 vetores/17 citações (CredibleMeds, Tisdale 2013, Boyer-Shannon NEJM 2005, critérios de Hunter, Overdyk 2016) | proposto como fonte única de verdade de interações V2 — não nomeado |

**9 catálogos de domínio (`domain-catalogs-review.md`):** todos os 9 (aki,
electrolyte, hemodynamics, respiratory, pharmaco-interaction, +4 pertencentes a
outros workstreams: correlation-engine, early-warning-scores, neuro-sedation,
sepsis) recebem **TRANSFORM** ao nível de mecanismo de carregamento — `grep -l
alert_groups *.yaml` bate 0 de 9 (gate de cobertura de vetor falso-verde,
HAZ-0031). Destino proposto: "registro de regras governado (fora de `docs/`, per
caminho de migração da própria ADR-0022)" — não é um artefato V2 nomeado. Todos os
9 catálogos são `[reviewer-hash]` — fora do manifesto de pin.

**9 clusters de regra extraída (`docs/rules/*`), tally por cluster (README
"Verdict tallies", verbatim: total 193 · VALIDATE 80 · REJECT 67 · REFINE 20 ·
TRANSFORM 18 · SUPERSEDE 8 · RETAIN 0):**

| cluster | nº de regras | tally (V·R·REFINE·T·S) | achado mais grave citado | classificação agregada |
|---|---|---|---|---|
| balanco-hidrico | 62 | 18·25·5·9·5 | mutação de total-corrente (RULE-BALANCO-HIDRICO-014/015/038/039) | **REJECT** (família de janela) |
| estabilidade | 26 | 13·10·1·1·1 | doses de vasopressor em mL/h não conversíveis (SYS-02/CON-0060) | mista, ver `cluster-estabilidade.md` |
| ventilacao | 26 | 10·11·5·0·0 | caos percentual-vs-fração de FiO2 em toda a família (RULE-004/005/011/018) | mista, ver `cluster-ventilacao.md` |
| prescricao | 41 | 19·9·4·8·1 | RULE-036 (lock de alteração morto), RULE-021 (HAZ-0033), RULE-029 (crash de enum, HAZ-0035) | mista, ver `cluster-prescricao.md` |
| eficiencia | 12 | 2·9·1·0·0 | maior densidade de defeito do OSMS; RULE-EFICIENCIA-002 sobrevive como TF-002 invertido | **REJECT** predominante |
| nutricao | 11 | 9·1·1·0·0 | RULE-NUTRICAO-004 banda AMARELO inalcançável | **VALIDATE** predominante |
| profilaxia | 8 | 5·1·2·0·0 | RULE-PROFILAXIA-005 (bug de string fundida derruba "Grande queimado") | **VALIDATE** predominante |
| equilibrio | 4 | 3·0·1·0·0 | typo de unidade "mg/dl" em RULE-EQUILIBRIO-004 | **VALIDATE** predominante |
| antimicrobiano | 3 | 1(SUPERSEDE-divergência)·1·0·0·1 | RULE-ANTIMICROBIANO-001 (subconjunto arbitrário de 5-de-12 critérios) | mista, ver `cluster-antimicrobiano.md` |

Nota (OBSERVED): duas linhas divergem do relatório automatizado ATE (Automated
Threshold Extraction, ferramenta de outro workstream) — RULE-ANTIMICROBIANO-001
(este README diz SUPERSEDE, ATE dizia VALIDATE) e RULE-EFICIENCIA-001 (este
README diz REJECT, ATE dizia VALIDATE). Registrado como está, sem tentativa de
reconciliar (README "Verdict tallies", bullet 3).

---

### 2.8 Qualidade de dado e cálculo fisiológico

Registro de origem: `docs/05-clinical-safety/legacy-review/data-quality-physio-calc/{README.md,
units-normalization-review.md, gold-pipeline-review.md, reference-ranges-review.md,
sinais-vitais-cluster-review.md}`. Cobertura (README): **11/11** itens atribuídos.

| elemento | caminho + SHA-256 | classificação | log de transformação | artefato V2 |
|---|---|---|---|---|
| `units_normalizer.py` — 5 fatores implementados | `src/intensicare/services/units_normalizer.py` `1f95ec99c03f4d1e17548fb33e2f4d08431f1801b050765d77d6fa3bcc0f80c4` [pin] | **VALIDATE** | Nota de precisão: creatinina desvia no 4º dígito significativo (§2) | não declarado no registro de revisão |
| `units_normalizer.py` — completude/cobertura do registro | mesmo arquivo | **REJECT** | D-06 (`sofa-review.md`, bilirrubina ~17×); classes de risco SYS-01/02/03/07/09 | não declarado no registro de revisão |
| `validate_fio2_fraction` | mesmo arquivo | **REJECT** (atual, não conectado) → **TRANSFORM** (conceito) | Achado de código morto | não declarado no registro de revisão |
| `scripts/verify_units.py` | `scripts/verify_units.py` `80513917eaf841f139aa8859b8f42f6f0fc2ce6a3e51a0b37154b4a6ebce4c7d` [reviewer-hash] | **REJECT** → **TRANSFORM** (intenção) | Cruza `validate_alerts.py` (workstream de pathways, não revisado aqui) | não declarado no registro de revisão |
| `docs/plan/clinical/units-registry.md` (corpus de desenho) | `docs/plan/clinical/units-registry.md` `c8e4fccbb04e003763ade67fba0ba753b05a1e56ee97747cb98b8981efb6d8a7` [reviewer-hash] | **VALIDATE** (conteúdo) → **REJECT** (pressuposto de já-implementado) | Classes de risco SYS-01–09 nomeadas: hemoglobina ×1000, vasopressor ~×60, peso ~×10 | não declarado no registro de revisão |
| Pipeline gold (AthenaPoller) | `src/intensicare/services/gold_reader.py` `c8eeddbe8b32974654b020d107a6c20a291ed142b7820a3480726a9c742ae9c7` [pin]; +2 outros | **VALIDATE** | HAZ-0030 citado (cadência de lote, outro workstream) | não declarado no registro de revisão |
| `_normalize_rows` — sobrevivência de linha fail-open | mesmo arquivo | **REJECT** → **TRANSFORM** | Lente HAZ-0005 | não declarado no registro de revisão |
| Tratamento de timestamp gold (recorded_at/watermark/calculated_at/created_at) | `src/intensicare/services/gold_schema.py` `3776fb674505079ab50e40da7a3fbe55bb0f85a8ce0f6928c0a493e0ee313740` [pin]; `gold_writer.py` `c67edf33cd86147b3eaaff3abc88ba61a3b840653f59d2d7bee394313c42692f` [pin] | **RETAIN** | Achado limpo, conformidade com regra não-negociável nº 8 | "deve virar um teste de aceitação V2 explícito" (§3) — artefato não nomeado |
| Denylist de PHI no write-back | `gold_writer.py` (hash acima) | **VALIDATE** | HAZ-0028 citado | não declarado no registro de revisão |
| Fallback de string "unknown" em `definition_version` | `gold_writer.py` (hash acima) | **REJECT** → **TRANSFORM** | — | não declarado no registro de revisão |
| Pressuposto de `score_value` não-nulo | `gold_schema.py` (hash acima) | **VALIDATION REQUIRED** (fora do vocabulário §4, citado assim mesmo na revisão) | Flag de dependência entre workstreams, HAZ-0005 | não declarado no registro de revisão |
| `reference_ranges.py` — unidade "rpm" de `respiratory_rate` | `src/intensicare/api/reference_ranges.py` `79a7f055c8d33b4f8d0f2866bd136af0cbbe389bae079736b5f133c511605acc` [pin] | **UNCITED** (fora do vocabulário §4, citado assim mesmo) | Cruza `units-registry.md` §2.7 | não declarado no registro de revisão |
| `reference_ranges.py` — divisão de nome de parâmetro (EN vs pt-BR) | mesmo arquivo | **REJECT** | — | não declarado no registro de revisão |
| `reference_ranges.py` — FiO2 ausente do conjunto exposto | mesmo arquivo | **REJECT** | — | não declarado no registro de revisão |
| Cluster de regra sinais-vitais (33 regras, agregado) | `docs/rules/{alert-threshold,care-pathway,clinical-scoring,data-validation,drug-dosing}/RULE-SINAIS-VITAIS-*.md` (33 arquivos, verificados individualmente pelo manifesto de pin) | **TRANSFORM 1 · VALIDATE 16 · SUPERSEDE 4 · REJECT 12** (0 RETAIN, 0 REFINE) — §3 | RULE-SINAIS-VITAIS-022 (limite de bilirrubina, pior achado único) triangula D-06/`units-normalization-review.md` §3.2 | não declarado no registro de revisão |

---

### 2.9 Formulários de documentação clínica

Registro de origem: `docs/05-clinical-safety/legacy-review/clinical-documentation-forms/{README.md,
adr-0028-context.md, evolucoes-cluster-review.md, evolucoes-domain-review.md}`.
Cobertura (README): **9/9** itens atribuídos.

**Achado de desambiguação (OBSERVED, confirmado por leitura direta):**
`adr-0028-context.md` revisa a ADR-0028 **interna do próprio legado**
(`docs/adr/0028-evolucoes-clinical-notes-architecture.md`, desenho de notas
clínicas SBAR híbrido, de um esforço de planejamento anterior "V2" dentro do
próprio repositório legado — sequência de ADR separada). A **ADR-0028 real do V2**
(`docs/06-architecture/adrs/ADR-0028-sedation-and-neuro-assessment-confounding-policy.md`)
é um documento diferente e não relacionado (confounding de sedação/avaliação
neurológica, motivado pela família neuro-sedação §2.5), redigido a partir de
`REV-NS-01-gcs.md` §4, não de nada em `clinical-documentation-forms/`. É
coincidência de numeração, não vínculo substantivo — a própria revisão avisa disso
em seu §1.

| elemento | caminho + SHA-256 | classificação | log de transformação | artefato V2 |
|---|---|---|---|---|
| `domain_evolucoes.py` — catálogo de template SBAR de 14 papéis | `src/intensicare/services/domain_evolucoes.py` `d9eafc17a26cade0b7dc5c185c52d2fd3586048d8d1a9950a982109b8c2e4a6c` [pin] | **TRANSFORM** | — | não declarado no registro de revisão (ADR-0028 legada citada só como contexto de intenção, ver desambiguação acima) |
| `domain_evolucoes.py` — `prefill_background()` | mesmo arquivo | **TRANSFORM** | CDF-1 (código morto), CDF-2 (coerção falsy-zero) | não declarado no registro de revisão |
| `domain_evolucoes.py` — máquina de estado de emenda/lifecycle | mesmo arquivo | **REJECT** (implementado) → **TRANSFORM** (conceito) | CDF-4 (inversão de status), CDF-5 (sem caminho `draft`) | não declarado no registro de revisão |
| `models/evolucao.py` | `src/intensicare/models/evolucao.py` `2f13fb10f552e7371dffd99fd07a31639fb49b187eb65ef1c138ea2cec1f0a1a` [pin] | **TRANSFORM** | Relacionado a CDF-4 (sem enum de status a nível de BD) | não declarado no registro de revisão |
| `schemas/evolucoes.py` (campo `status`) | `src/intensicare/schemas/evolucoes.py` `9e5d46c9dd3af34d7b561f11b4e82c6ba76cb2b3e2edc4538699afa7aa0b9f3c` [pin] | **REJECT** (implementado) → **TRANSFORM** (resto) | CDF-6 (campo de schema morto) | não declarado no registro de revisão |
| `api/v1/evolucoes.py` (caminho de emenda) | `src/intensicare/api/v1/evolucoes.py` `44edf7ffbde4037a9daff5cc69a10a7e34833052626e764597545ce196b0ef96` [pin] | **REJECT** (implementado) → **TRANSFORM** (leituras) | CDF-6 (emenda inalcançável via API) | não declarado no registro de revisão |
| ADR-0028 legada (arquitetura de notas clínicas evolucoes) | `docs/adr/0028-evolucoes-clinical-notes-architecture.md` `d478d0a9ec7b4754c98404f8bff8fe78cf7e8ab3a8720e61c91b954f71c195e8` [reviewer-hash] | **CONTEXT ONLY** (fora do vocabulário §4, citado assim mesmo — não proposta para importação) | — | Não é a ADR-0028 do V2 — ver desambiguação acima |
| Cluster de regra evolucoes (77 regras, agregado) | `docs/plan/_work/dispositions/evolucoes-p1.yaml` `3fd38ea4c444a2701eaaa5106b916384aa6df95351812f8dfc0e9ec0a8889357` [reviewer-hash]; `evolucoes-p2.yaml` `410f1b0518e8c0775a706be217d454e683e0d216d21cb6e30b0b8ae9fd4fe0b5` [reviewer-hash] | **TRANSFORM 46 · ARCHIVE 13 · REJECT 14 · VALIDATE 4** (0 RETAIN, 0 REFINE, 0 SUPERSEDE) — §3 | RULE-EVOLUCOES-025 (defeito de fonte de timestamp de assinatura); RULE-EVOLUCOES-030/055 (guarda de inativação definido mas nunca conectado) | não declarado no registro de revisão |

---

## 3. Estatísticas agregadas

**INFERENCE — como esta seção foi produzida:** cada número abaixo é citado
verbatim (ou com fórmula de soma explícita) do workstream que o publicou; nenhum
elemento individual foi recontado a partir do código-fonte legado.

### 3.1 Escopo total do inventário (SOURCE — `00-inventory/coverage-map.md` §2)

| workstream | itens atribuídos |
|---|---|
| ews | 44 |
| sepsis-scores | 23 |
| alert-threshold-engine | 57 |
| pathways | 25 |
| kpi | 6 |
| neuro-sedation-scores | 29 |
| organ-support-and-medication-safety (OSMS) | 89 |
| data-quality-and-physiological-calculation | 11 |
| clinical-documentation-and-forms | 9 |
| **subtotal (9 workstreams)** | **293** |
| DEFERRED | 65 |
| SPLIT (clinical-scoring, resolvido a nível de regra) | 2 |
| **total rastreado em coverage-map.md** | **360** |

Base de arquivo (SOURCE — `00-inventory/inventory.md`): **1.317** entradas do
manifesto de pin resolvem em disco (§0 passo 5); **959** arquivos `RULE-*.md` em
disco, mas `catalog-index.json` indexa apenas **947** (discrepância de 12
arquivos, detalhada em §1.1 — não investigada além dessa citação).

### 3.2 Tallies de veredito publicados por workstream (SOURCE, cada um citado do seu próprio arquivo)

| corpus | unidade | RETAIN | REFINE | TRANSFORM | VALIDATE | SUPERSEDE | REJECT | ARCHIVE | outro | total do corpus |
|---|---|---|---|---|---|---|---|---|---|---|
| alert-threshold-cluster-review.md §3 | regra extraída | 0 | 0 | 18 | 45 | 15 | 38 | — | — | 116 |
| kpi-inventory.md §5 | entrada de KPI | 0 | 5 | 8 | 5 | 3 | 6 | — | 3 fora-de-escopo | 28 (soma da tabela = 30; discrepância interna não reconciliada, ver §4) |
| pathway-index.md §7 (computado a partir da tabela §7, sem frase-tally própria) | pathway + motor | 0 | 0 | 3 | 8 | 1 | 1 | — | — | 13 |
| rules-cluster-disposition.md §2 | regra extraída (`docs/rules/care-pathway/`) | 0 | 0 | 0 | 54 | 124 | 33 | — | — | 211 |
| organ-support-med-safety/README.md "Verdict tallies" | regra extraída (9 clusters) | 0 | 20 | 18 | 80 | 8 | 67 | — | — | 193 |
| sinais-vitais-cluster-review.md §3 | regra extraída | 0 | 0 | 1 | 16 | 4 | 12 | — | — | 33 |
| evolucoes-cluster-review.md §3 | regra extraída | 0 | 0 | 46 | 4 | 0 | 14 | 13 | — | 77 |
| neuro-sedation-scores/README.md §2 (contagem do agente consolidador sobre a tabela; README não declara soma própria) | registro de instrumento | 0 | 5 | 2 | 1 | 1 | 0 (REJECT aparece só como sub-veredito, não no headline) | — | — | 9 |
| **soma bruta (INFERENCE, granularidades mistas — ver ressalva)** | — | **0** | **30** | **96** | **213** | **156** | **171** | **13** | **3** | **682** |

**Ressalva obrigatória (INFERENCE):** esta soma mistura três granularidades
diferentes — disposição por arquivo de regra extraída (`docs/rules/*.md`),
veredito por instrumento/pathway/domínio de revisão narrativa, e entrada de
catálogo de KPI. **EWS, sepsis-scores (qSOFA/SOFA/SOFA-fork/sepse-pathway
narrativos) e a maior parte dos registros de domínio OSMS (7 registros, 80
linhas-de-veredito citadas no README mas não somadas em um único tally pelo
próprio workstream) NÃO estão incluídos nesta soma** — esses corpora relatam
veredito por elemento em prosa, sem uma frase de contagem consolidada equivalente
a "N revisados, X RETAIN, Y REJECT...". A soma de 682 é, portanto, um censo
parcial dos corpora que publicaram uma tabela de contagem explícita — não um
total de todo elemento citado nas tabelas da §2 deste manifesto.

### 3.3 Regras com threshold não citado / SOURCE NOT LOCATED (SOURCE, coletado das seções §2.x acima)

- Migração `0038_seed_default_threshold_config.py` linhas 1/2/4 (MEWS
  watch/urgent, NEWS2 watch) — **UNCITED**, atribuição incorreta a Subbe 2001,
  erro de dimensão (`thresholds-seed-review.md` §3.1).
- Banda de risco de mortalidade do SOFA — não citada, assemelha-se a Ferreira
  2001 sem citar (`sofa-review.md` §3/§8).
- `reference_ranges.py` — unidade "rpm" de `respiratory_rate` — **UNCITED**
  (`reference-ranges-review.md` §1).
- RULE-INDICADORES-ETL-005 (fórmula de cor de ocupação) — fórmula **SOURCE NOT
  LOCATED** (`kpi-operational-time-and-etl-rules.md` §4).
- RULE-INDICADORES-ETL-023 (6 fórmulas de macro-KPI) — **SOURCE NOT LOCATED**,
  computadas em objetos Oracle Tasy upstream não mapeados (`kpi-operational-time-and-etl-rules.md`
  §4.2).
- Citações de DOI dos 12 pathways: equilibrio **BROKEN** (HTTP 404 no Crossref),
  profilaxia **MISMATCH**, renal **PARTIAL**, desmame "BURN Trial" **não
  identificável** (`pathway-index.md` §4).
- Conjunto de regras da era trilhas do SOFA (`RULE-CLINICAL-SCORING-001..012`) —
  código-fonte upstream subjacente **SOURCE NOT LOCATED** (ver NL-1, §3.4).
- "Dezembro de 2022, esclarecimento" do NEWS2 — **NOT VERIFIED**, nenhum
  documento correspondente encontrado nas páginas de recursos do RCP
  (`news2-review.md` §2).

### 3.4 SOURCE-NOT-LOCATED (NL-1..NL-5) (SOURCE — `00-inventory/inventory.md` §4, linhas 694–702)

| ID | Refere-se a | Por que não localizável |
|---|---|---|
| NL-1 | Repositórios upstream de extração: `Dev-Infra-Grupo-AMH/ahlabs-trilhas`@`8166c07eaef97ad4f9b2a0e51235f3fc3d0feb7f` e `Dev-Infra-Grupo-AMH/trilhas-frontend`@`f9656be2660ec2048ce6240b4ac418b7fe7d5a5b` (per `docs/rules/INVENTORY.md`) | Não presentes no repositório legado local; toda citação `repo:path:line` das 959 regras extraídas aponta para repositórios não montados — não re-verificável neste ciclo |
| NL-2 | Implementação de runtime do FOIS (Functional Oral Intake Scale) | Sem código em `src/`; existe só como conteúdo de catálogo/planejamento |
| NL-3 | Um `registry.json` de nível-pathway (esperado, 12 pathways) | Não existe; `_work/alerts/registry.json` é na verdade um registro de ALERTA (6 alertas de sepse), não um registro por-pathway |
| NL-4 | Artefatos de sign-off clínico por pathway (12 YAMLs) | Não localizados; apenas 2 registros de racional existem em todos os 12 pathways (ambos em `ventilacao.yaml`) |
| NL-5 | Blocos `alert_groups` nos 9 catálogos YAML de domínio | Confirmado ausente nos nove |

**Lista de "unverifiable citations" como seção discreta:** nenhum dos dois
arquivos de `00-inventory/` contém uma seção intitulada assim (INFERENCE, busca
exaustiva feita pelo agente consolidador). O equivalente mais próximo é NL-1
— afeta a verificabilidade de todas as 959 citações de regra extraída — mais as
instâncias específicas listadas em §3.3 acima (DOIs quebrados/incompatíveis,
fórmulas não localizadas, banda de mortalidade não citada). Duas menções soltas a
"UNVERIFIABLE" em `inventory.md` (linhas 114, 344) dizem respeito a **status de
ratificação**, não a verificação de citação, e não devem ser confundidas com o
acima.

---

## 4. Riscos de proveniência em aberto

1. **Repositórios upstream não montados.** `Dev-Infra-Grupo-AMH/ahlabs-trilhas`
   e `Dev-Infra-Grupo-AMH/trilhas-frontend` (SHAs em NL-1, §3.4) não estão
   montados neste ciclo. Toda citação `repo:path:line` das 959 regras extraídas em
   `docs/rules/` — incluindo o conjunto de regras da era trilhas do SOFA e as 99
   regras RULE-SEPSE do pathway sepse — não pôde ser re-verificada contra a fonte
   final; apenas os arquivos de regra extraída (eles próprios hasheados) puderam
   ser revisados. `coverage-map.md` §6 item 3 registra o mesmo limite.

2. **Citações não verificáveis pontuais** (compiladas de §2 e §3.3): DOI de
   equilibrio.yaml retorna HTTP 404; DOI de profilaxia.yaml não bate com o
   trabalho citado; DOI de renal.yaml é parcial; citação secundária "BURN Trial"
   de desmame.yaml não identificável; fórmulas de RULE-INDICADORES-ETL-005/023
   (ocupação e 6 macro-KPIs) residem em objetos Oracle Tasy upstream não
   mapeados; banda de risco de mortalidade do SOFA não citada; unidade "rpm" de
   `respiratory_rate` em `reference_ranges.py` não citada; "esclarecimento de
   dezembro de 2022" do NEWS2 não verificado nas páginas de recursos do RCP.

3. **Arquivos `(rt)` / `[reviewer-hash]` fora do conjunto fixado por commit.**
   Múltiplos artefatos citados pelas revisões não constam no manifesto de pin de
   1.317 entradas (`legacy-pin-cycle-1.md`) e foram hasheados pelo revisor no
   momento da leitura. Categorias observadas (não exaustivo — listagem completa
   recuperável nas seções "hash-and-note"/"(rt)" de cada README de família):
   arquivos de teste (`tests/test_*.py` — dezenas, citados como "evidência de
   intenção apenas"); catálogos YAML de planejamento (`docs/plan/_work/alerts/*.yaml`
   — aki, electrolyte, hemodynamics, respiratory, pharmaco-interaction,
   early-warning-scores, correlation-engine, neuro-sedation); especificações de
   domínio em `docs/plan/clinical/*.md`; migrações Alembic 0015/0016/0017/0018;
   ADRs legadas de referência (`docs/adr/0014`, `0022`, `0023`, `0028`); shards de
   disposição (`docs/plan/_work/dispositions/{sepse-p1,evolucoes-p1,evolucoes-p2}.yaml`,
   `ratification-decisions.yaml`); `scripts/verify_units.py`;
   `docs/plan/clinical/units-registry.md`; `pyproject.toml` do legado
   (`716a9354b75face954281e215ee8f21d2d895cbab2ab2a31b159d561a2c4d800`). Todo
   valor `[reviewer-hash]` acima é OBSERVED (hasheado 2026-08-15 pelo revisor do
   registro citante), não parte do pino original — re-hash e comparação são
   necessários antes de confiar em qualquer citação contra esses arquivos.

4. **Colisão de namespace de CRV entre SOFA e NEWS2 — RESOLVIDA POR RENUMERAÇÃO
   MECÂNICA (steward de rastreabilidade, 2026-08-15).** `rule-releases/gcs/reference-vectors.md`
   §0.1 registrava (OBSERVED, teor histórico): *"os conjuntos concorrentes de
   RULE-SOFA (CRV-0101–0199) e RULE-NEWS2 (CRV-0101–0189) reivindicaram blocos"* —
   sobrepostos. GCS já havia reivindicado um bloco distinto (CRV-0200–0299)
   especificamente para evitar a mesma colisão. **Resolução (2026-08-15):** RULE-SOFA
   foi renumerado mecanicamente para o bloco **CRV-0300–0399** (34 vetores em uso,
   `CRV-0301`–`CRV-0334`, cada ID antigo + 200); RULE-NEWS2 permanece no bloco
   **CRV-0100–0199** (89 vetores em uso, `CRV-0101`–`CRV-0189`, sem alteração); GCS
   permanece em **CRV-0200–0299** (sem alteração). SOFA foi o lado movido — não NEWS2
   — por ter menos citações a renomear (medição de 2026-08-15: 35 IDs únicos / 67
   ocorrências de grep para SOFA vs. 89 IDs únicos / 116 ocorrências para NEWS2 em
   `rule-releases/{sofa,news2}/*.md`), tornando essa a direção mecanicamente menos
   invasiva. Nenhum conteúdo clínico, cenário ou resultado esperado foi alterado —
   apenas o sufixo numérico do ID. As faixas estão registradas em
   `docs/00-governance/traceability-policy.md` §1.1 como atualização de escriba
   datada. Todos os IDs CRV citados neste manifesto (§2.1, §2.2, §2.5) continuam
   **DRAFT, não ratificados, provisórios até registro em catálogo** (per
   `RULE-SOFA-CRV-0300` §0.1, antigo `RULE-SOFA-CRV-0100`); a renumeração resolve a
   colisão de namespace, não o status de ratificação — nenhum vetor pode ser citado
   como evidência de release até um autor independente confirmar cada um
   (`reference-vectors.md` do SOFA, front matter: *"authorship independence is NOT
   satisfied"*).

5. **Inconsistências internas de contagem nos próprios registros de revisão**
   (OBSERVED, não corrigidas por este manifesto — flagradas como estão):
   `kpi-inventory.md` §5 soma 30 entre as categorias de veredito, mas §1 declara
   um total de 28 entradas para o corpus; `neuro-sedation-scores/README.md` §4
   declara em texto "seis arquivos citados estão ausentes do manifesto" mas o
   bloco de código logo abaixo lista sete caminhos.

6. **Ligação GCS-review → GCS-rule-release não citada explicitamente.**
   `REV-NS-01-gcs.md` não cita `docs/05-clinical-safety/rule-releases/gcs/` nem
   um ID `CAND-####` (confirmado por grep, §2.5). A reconstrução de proveniência
   feita em §2.5 deste manifesto depende inteiramente do mapeamento
   defeito→CRV publicado do lado do `rule-releases/gcs/migration-notes.md`, não
   de uma citação cruzada bidirecional — os dois artefatos podem ter divergido
   sem que um aponte para o outro.

7. **`v2_destination` ausente na maioria das linhas do OSMS, alguns clusters
   KPI e vários elementos EWS/sepsis-scores.** Onde a tabela acima diz "não
   declarado no registro de revisão", o próprio registro de revisão forense
   deferiu essa decisão a um passo de governança futuro (revisor nomeado, gate
   G1/G2) — não é uma omissão deste manifesto, mas uma lacuna real de
   rastreabilidade legado→V2 que precede este documento.

8. **Achado BLOCKED do OSMS** — polaridade de critério booleano em
   `profilaxia.yaml`/`antimicrobiano.yaml` aguarda uma decisão do workstream de
   pathways sobre o comportamento do motor trilhas
   (`medication-safety-review.md` §7) — não resolvido por este manifesto.

---

## 5. Baseline de status de licença (OBSERVED)

**OBSERVED** (`/Users/familia/intensicare/LICENSE`, lido integralmente
2026-08-15): o arquivo é o texto integral, genérico, da **GNU Affero General
Public License, versão 3, 19 de novembro de 2007** (copyleft de rede). O
cabeçalho de copyright é o boilerplate padrão da FSF ("Copyright (C) 2007 Free
Software Foundation, Inc."), que é o copyright *sobre o texto da própria
licença*, não sobre o software do repositório. A seção "How to Apply These
Terms to Your New Programs" contém o placeholder padrão não preenchido
`Copyright (C) <year> <name of author>` — **o arquivo LICENSE, por si só, não
nomeia um titular de direitos autorais para o código deste repositório**.

**OBSERVED** (`/Users/familia/intensicare/pyproject.toml` linha 10): o campo de
metadado do pacote declara `license = {text = "Proprietary"}` — **em contradição
direta** com o arquivo LICENSE (AGPLv3) na raiz do mesmo repositório.

**OBSERVED** (amostra de 3 arquivos-fonte, `src/intensicare/{config,__init__,main}.py`,
lidos integralmente no topo): nenhum carrega cabeçalho SPDX ou nota de copyright
por arquivo — ausência confirmada, não apenas não verificada.

**INFERENCE (a partir dos três achados OBSERVED acima):** o repositório legado
carrega **dois sinais de licença mutuamente contraditórios** — um arquivo LICENSE
de copyleft de rede (AGPLv3) na raiz e uma declaração de metadado de pacote
"Proprietary" — sem cabeçalho de copyright por arquivo em nenhum lugar amostrado
para resolver a ambiguidade a favor de um ou outro. Este é o **baseline OBSERVED**
usado como `license_ip_status` em toda linha da §2 deste manifesto (abreviado
`AGPL-3.0‡`). **Isto não é uma conclusão de suficiência legal.** Per
`legacy-import-policy.md` §3.1, a determinação de "base legal lícita" para
qualquer reuso pertence à revisão de licença/IP — atualmente reclassificada per
as resoluções G0 (referenciada aqui apenas, não decidida por este documento).
Nenhum item deste manifesto avança além de `ARCHIVE` (§4 da policy) enquanto o
item 1 de `legacy-import-policy.md` §3 (decisão de licença/IP) permanecer
`VALIDATION REQUIRED` — o que é o caso para 100% do conteúdo listado em §2.

---

## 6. Rastreabilidade

- Vocabulário de classificação: `docs/00-governance/legacy-import-policy.md` §4.
- Notação de evidência: `docs/00-governance/evidence-notation.md`.
- Pino de commit e manifesto SHA-256: `docs/archive/legacy-provenance/legacy-pin-cycle-1.md`.
- Corpus de revisão consolidado (não re-revisado): `docs/05-clinical-safety/legacy-review/**`.
- Artefatos V2 informados: `docs/05-clinical-safety/rule-releases/{sofa,news2,gcs}/`,
  `docs/05-clinical-safety/pathway-portfolio/clinical-kpi-review.md`,
  `docs/06-architecture/adrs/ADR-0007,0008,0025,0026,0027,0028,0029`.

**Este manifesto permanece PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer:
rodaquino-OMNI) até ratificação nomeada per `evidence-notation.md` §2 regra 3.**
Nenhum agente pode auto-aplicar `DECIDED` a este ou a qualquer conteúdo que ele
consolida.
