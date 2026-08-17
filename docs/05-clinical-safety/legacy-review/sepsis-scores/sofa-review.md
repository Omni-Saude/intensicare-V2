---
id: LEGREV-SOFA-0001
title: Revisão legada — conteúdo clínico do scoring SOFA (V1 services/sofa.py e registros de regra da era trilhas)
label: PROPOSAL
status: PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI)
statement: >
  Revisão forense com rigor de intensivista da implementação legada V1 do SOFA
  contra Vincent 1996 e o Sepsis-3, incluindo tabelas de discrepância por
  componente, rastreamento de coerção a zero do HAZ-0005, e a análise de
  SOFA-parcial que alimenta a ADR-0008. Tudo aqui é PROPOSAL; nenhuma autoridade
  clínica ratificou nenhuma declaração.
provenance:
  source_repo: intensicare (legado V1, READ-ONLY)
  path_or_url: src/intensicare/services/sofa.py e docs/rules/clinical-scoring/ (ver tabela por citação §1)
  commit_sha_or_version: 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79 (HEAD no pin; SHA-256 por arquivo em §1)
  section_or_lines: referências de linha por citação ao longo do documento
  date_collected: 2026-08-15
  collector: revisor forense de escores de sepse legados (ciclo 1, Tarefa 1); revisor responsável rodaquino-OMNI
  transformation: >
    traduzido EN→pt-BR, tranche 3, GDEC-0008 item 8 (trechos verbatim mais análise
    do revisor; análise rotulada INFERENCE/PROPOSAL)
  confidence: alta (verificação de fonte); baixa (disposições clínicas — não ratificadas)
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  requirements: [SAF-0001, SAF-0002, SAF-0003]
  hazards: [HAZ-0005, HAZ-0006, HAZ-0032, HAZ-0043]
  adrs: [ADR-0008 (pendente — §7 é seu insumo)]
  tests: []
  pr: null
supersedes: null
superseded_by: null
---

> Traduzido EN→pt-BR em 2026-08-16 (GDEC-0008 item 8, tranche 3); original EN preservado no histórico git.

# SOFA — revisão de conteúdo clínico legado

**PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).** Nenhuma
declaração neste registro é uma decisão clínica. Os vereditos usam o vocabulário de
`docs/00-governance/legacy-import-policy.md` §4 e são apenas *propostas* de
importação.

## 1. Fontes verificadas, com hashes

Todos os caminhos relativos a `https://github.com/Omni-Saude/intensicare` (READ-ONLY), fixados
(pinned) no HEAD git `1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79`, hashes
recalculados no momento da revisão (2026-08-15) e comparados a
`docs/archive/legacy-provenance/legacy-pin-cycle-1.md`.

| Artefato | SHA-256 | Manifesto |
|---|---|---|
| `src/intensicare/services/sofa.py` | `731b3507cc07b2d5318f4759229527d2eac1f45b62eba269168d43560739b84a` | match |
| `src/intensicare/models/clinical_score.py` | `fc987ad0d037b1f153451240178dc12ab988a1104d7bc4a88dc460972234ff43` | match |
| `docs/rules/clinical-scoring/RULE-CLINICAL-SCORING-001…-007, -011, -012` | por linhas 453-461 do manifesto (todos match) | match |
| `docs/rules/physiological-calculation/RULE-CLINICAL-SCORING-008/-009/-010` | por linhas 1078-1080 do manifesto (todos match) | match |
| `tests/test_sofa.py` | `95278fe50179a4f7904eacb256285472f51cf86ea3bfbf6c92a5890ab42610c7` | **não está no manifesto — hasheado no momento da revisão (hash-and-note)** |
| `docs/plan/_work/ratification-decisions.yaml` | `b90c3cbbf11f22e440d7258e1e9c8fd556009a4c572717b839f51e73f7ee4751` | **não está no manifesto — hasheado no momento da revisão (hash-and-note)** |

**OBSERVED — duas linhagens distintas de SOFA existem na evidência legada:**

1. **O engine V1 em produção**: `src/intensicare/services/sofa.py` (revisado a
   partir do código, §2-§6).
2. **A implementação da era trilhas** (`ahlabs-trilhas@8166c07eae`,
   `trilha_manual/models/sofa.py`), documentada em
   RULE-CLINICAL-SCORING-001…-012. Seu código subjacente está **SOURCE NOT
   LOCATED — não é possível revisar como código**: o repositório
   `ahlabs-trilhas` não está montado. É revisado aqui apenas *conforme
   documentado* nos registros de regra extraídos (§5), que são eles próprios
   evidência hasheada, dentro do repositório.

O pacote de tarefa nomeia "RULE-CLINICAL-SCORING-001 through -012"; -008, -009 e
-010 residem em `docs/rules/physiological-calculation/` (mesma série de ID de
regra, diretório de cluster diferente). Todos os doze foram localizados e
revisados. Nenhum arquivo RULE-CLINICAL-SCORING está faltando.

## 2. Fórmula conforme implementada (verbatim, `services/sofa.py`)

Constantes de corte por componente — `sofa.py:62-100`:

```python
SOFA_RESP_PF_NORMAL = 400  # >= 400 -> 0
SOFA_RESP_PF_MILD = 300  # >= 300 -> 1
SOFA_RESP_PF_MODERATE = 200  # >= 200 -> 2
SOFA_RESP_PF_SEVERE = 100  # >= 100 (ventilated) -> 3, else -> 4
SOFA_PLATELETS_NORMAL = 150 ... SOFA_PLATELETS_SEVERE = 20
SOFA_BILIRUBIN_NORMAL = 1.2 ... SOFA_BILIRUBIN_SEVERE = 12.0
SOFA_MAP_NORMAL = 70
SOFA_DOPAMINE_LOW = 5
SOFA_DOPAMINE_HIGH = 15
SOFA_ADRENERGIC_LOW = 0.1
SOFA_GCS_NORMAL = 15 ... SOFA_GCS_SEVERE = 6
SOFA_CREATININE_NORMAL = 1.2 ... SOFA_CREATININE_SEVERE = 5.0
SOFA_URINE_OUTPUT_SEVERE = 200  # < 200 -> 4
SOFA_URINE_OUTPUT_MODERATE = 500  # < 500 -> 3
```

Respiração — `sofa.py:168-196` (trecho):

```python
    if pao2_fio2 is None:
        return 0, "missing"
    if isinstance(pao2_fio2, bool):
        return 0, "invalid_type"
    if pao2_fio2 < 20:
        # FiO2 percent bug: P/F ratio should be ~200-500
        raise ValueError(...)
    if pao2_fio2 >= SOFA_RESP_PF_NORMAL: score = 0
    elif pao2_fio2 >= SOFA_RESP_PF_MILD: score = 1
    elif pao2_fio2 >= SOFA_RESP_PF_MODERATE: score = 2
    elif mechanical_ventilation:
        score = 3 if pao2_fio2 >= SOFA_RESP_PF_SEVERE else 4
    else:
        # pao2_fio2 < 200 and not ventilated: cap at 2
        score = 2
```

Cardiovascular — `sofa.py:301-335` (trecho):

```python
    if map_value is None:
        return 0, "missing"
    if not vasopressor_type or vasopressor_type.lower() in ("none", ""):
        return (0 if map_value >= SOFA_MAP_NORMAL else 1), None
    vtype = vasopressor_type.lower().strip()
    dose = vasopressor_dose_mcg_kg_min
    if vtype == "dopamine":
        if dose is None: score = 2      # Unknown dose, default to moderate
        elif dose <= SOFA_DOPAMINE_LOW: score = 2
        elif dose <= SOFA_DOPAMINE_HIGH: score = 3
        else: score = 4
    elif vtype in ("epinephrine", "norepinephrine", "noradrenaline"):
        if dose is None: score = 3      # Unknown dose, default to moderate-high
        elif dose <= SOFA_ADRENERGIC_LOW: score = 3
        else: score = 4
    else:
        # Dobutamine or unknown vasopressor type — default to mid-range
        score = 2
```

Renal — `sofa.py:400-427` (trecho):

```python
    both_missing = creatinine is None and urine_output_ml_day is None
    if both_missing:
        return 0, "missing"
    if creatinine is None or creatinine < SOFA_CREATININE_NORMAL:
        cr_score = 0
    ...
    if urine_output_ml_day is None:
        uo_score = 0
    elif urine_output_ml_day < SOFA_URINE_OUTPUT_SEVERE: uo_score = 4
    elif urine_output_ml_day < SOFA_URINE_OUTPUT_MODERATE: uo_score = 3
    else: uo_score = 0
    return max(cr_score, uo_score), None
```

Total — `sofa.py:504`: `total = resp_score + coag_score + liver_score +
cv_score + neuro_score + renal_score`. Coagulação (`sofa.py:219-230`), fígado
(`sofa.py:254-265`) e neurológico (`sofa.py:358-369`) são buscas em faixa
simples com `None -> (0, "missing")`.

Classificação de risco de mortalidade — `sofa.py:40-59`: `<=6 baixo, <=9
moderado, <=12 alto, senão muito_alto`; a docstring (`sofa.py:43-49`) cita as
faixas "SOFA 0-6: ~<10% … 13-14: ~50-60%, 15-24: ~80-90%, >15: ~>90%".

Alegação de versão — `sofa.py:20`: `SOFA_VERSION = "SOFA-v2.0.0"  #
CLINICALLY RATIFIED per RAT-CLINICAL-SCORING-01/02/03`.

## 3. Definições autoritativas

- **Vincent JL, Moreno R, Takala J, Willatts S, De Mendonça A, Bruining H,
  Reinhart CK, Suter PM, Thijs LG.** The SOFA (Sepsis-related Organ Failure
  Assessment) score to describe organ dysfunction/failure. On behalf of the
  Working Group on Sepsis-Related Problems of the ESICM. *Intensive Care
  Medicine*. 1996;22(7):707-710.
  <https://link.springer.com/article/10.1007/BF01709751> — a tabela
  definidora: respiração PaO2/FiO2 ≥400=0, 300-399=1, 200-299=2, 100-199 **com
  suporte respiratório**=3, <100 **com suporte respiratório**=4; plaquetas
  (×10³/µL) ≥150/100-149/50-99/20-49/<20; bilirrubina (mg/dL) <1,2 / 1,2-1,9 /
  2,0-5,9 / 6,0-11,9 / ≥12,0 (µmol/L <20 / 20-32 / 33-101 / 102-204 / >204);
  cardiovascular PAM ≥70=0, PAM <70=1, dopamina ≤5 ou dobutamina (qualquer
  dose)=2, dopamina >5 ou epinefrina ≤0,1 ou norepinefrina ≤0,1=3, dopamina
  >15 ou epinefrina >0,1 ou norepinefrina >0,1=4, **doses adrenérgicas em
  µg/kg/min administradas por pelo menos 1 h**; GCS 15=0, 13-14=1, 10-12=2,
  6-9=3, <6=4; creatinina renal (mg/dL) <1,2 / 1,2-1,9 / 2,0-3,4 / 3,5-4,9 /
  ≥5,0 **ou** débito urinário <500 mL/dia=3, <200 mL/dia=4. (Verificado
  contra o registro do artigo da editora e a apresentação secundária em
  PMC6880479, Lambden S et al., *Crit Care* 2019;23:374, "The SOFA score —
  development, utility and challenges",
  <https://pmc.ncbi.nlm.nih.gov/articles/PMC6880479/>.)
- **Singer M, Deutschman CS, Seymour CW, et al.** The Third International
  Consensus Definitions for Sepsis and Septic Shock (Sepsis-3). *JAMA*.
  2016;315(8):801-810. doi:10.1001/jama.2016.0287,
  <https://pmc.ncbi.nlm.nih.gov/articles/PMC4968574/> — a sepse é
  operacionalizada como "an acute increase in total SOFA score ≥2 points
  consequent to the infection", com "baseline SOFA score … assumed to be zero
  in patients not known to have preexisting organ dysfunction" (citações
  mantidas em inglês, texto literal da fonte); SOFA ≥2 associado a
  mortalidade intra-hospitalar de "approximately 10%" na população com
  infecção presumida.
- **Evans L, Rhodes A, Alhazzani W, et al.** Surviving Sepsis Campaign:
  International Guidelines for Management of Sepsis and Septic Shock 2021.
  *Crit Care Med* 2021;49(11):e1063-e1143 e *Intensive Care Med*
  2021;47:1181-1247. doi:10.1007/s00134-021-06506-y — relevante ao contexto
  de uso do SOFA; recomendações de instrumento de rastreio revisadas em
  `qsofa-review.md` §6.

Nota de qualidade SOURCE: os percentuais de mortalidade citados em
`sofa.py:43-49` **não** fazem parte de Vincent 1996. Eles se assemelham a
cifras relatadas na literatura posterior de SOFA seriado (Ferreira FL, Bota
DP, Bross A, Mélot C, Vincent JL. Serial evaluation of the SOFA score to
predict outcome in critically ill patients. *JAMA*. 2001;286(14):1754-1758),
mas o código não cita nada; a atribuição não é verificada. Ver D-10.

## 4. Tabela de discrepâncias por componente — `services/sofa.py` vs Vincent 1996

Legenda: **MATCH** = numericamente idêntico à tabela de 1996; **DEV** =
desvio ou extensão interpretativa não citada.

| # | Componente | Achado | Veredito | Evidência |
|---|---|---|---|---|
| D-01 | Cortes de respiração | 400/300/200/100 mmHg, faixas inclusivas-no-limite-inferior | MATCH | `sofa.py:184-192` |
| D-02 | Gate de ventilação da respiração | Escores 3-4 exigem `mechanical_ventilation=True`; `<200` não ventilado tem teto em 2 | **DEV (interpretação)** — Vincent 1996 diz "with respiratory support", que por convenção comum inclui suporte não invasivo (CPAP/VNI); o legado restringe a um único booleano de ventilação mecânica, e o tratamento de teto-em-2 para P/F <200 não suportado é uma convenção não citada (embora difundida). Ambos precisam de ratificação V2 explícita. | `sofa.py:190-195` |
| D-03 | Substituto SpO2/FiO2 | **Ausente.** Nenhum fallback SpO2/FiO2 existe em nenhum lugar do scorer. | Não é uma discrepância; registrado porque a política de parcial da ADR-0008 (§7) não deve presumir que existe uma. Qualquer substituto V2 precisa de sua própria citação (p.ex. imputação de Pandharipande et al. 2009) e ratificação. | arquivo inteiro |
| D-04 | Validação dentro-da-faixa da respiração | P/F `< 20` dispara `ValueError` (heurística de FiO2-percentual); uma entrada bool retorna `(0, "invalid_type")` | **DEV (segurança)** — três álgebras de falha diferentes em uma única função (exceção, zero coagido, zero coagido + status). O status `invalid_type` **não** é propagado: `calculate_sofa` checa apenas `== "missing"` (`sofa.py:468-469`), então uma entrada inválida contribui silenciosamente com 0 sem nenhuma flag de ausência. Um P/F genuíno de 20-99 com FiO2 codificado em percentual passa pela guarda sem ser detectado (p.ex. PaO2 80/FiO2 "40" dá 2,0 → dispara; erros parciais estilo PaO2 80/FiO2 "2,5" não). | `sofa.py:171-182, 468-469` |
| D-05 | Plaquetas (coagulação) | ≥150=0, <150=1, <100=2, <50=3, <20=4 (×10³/µL) | MATCH | `sofa.py:222-230` |
| D-06 | Bilirrubina (fígado) | <1,2 / <2,0 / <6,0 / <12,0 / ≥12,0 mg/dL — faixas contínuas, sem lacunas mortas | MATCH numericamente, **DEV (unidades)** — a docstring diz "based on bilirubin (mg/dL or µmol/L)" (`sofa.py:239`), enquanto os limiares são apenas mg/dL. Um valor em µmol/L passado como está superestima em ~17× (10 µmol/L normal lido como 10 "mg/dL" → 3 pontos). Nenhuma unidade é carregada no argumento; a segurança de unidade é inteiramente do chamador. Território do HAZ-0032. | `sofa.py:238-246, 254-265` |
| D-07 | Cardiovascular — PAM ausente com vasopressor presente | `map_value is None → (0, "missing")` **antes** da avaliação de vasopressor: um paciente em norepinefrina 0,5 µg/kg/min sem PAM registrada pontua CV = 0 | **DEV (clínico, pior defeito único deste arquivo)** — a tabela de 1996 pontua os níveis de vasopressor independentemente da PAM; o short-circuit legado descarta evidência positiva de choque grave e retorna o valor mais saudável. | `sofa.py:301-302` |
| D-08 | Níveis de dose cardiovascular | Dopamina ≤5→2, ≤15→3, >15→4; epinefrina/norepinefrina ≤0,1→3, >0,1→4; dobutamina qualquer→2; doses em µg/kg/min | MATCH (valores de nível e unidade) | `sofa.py:313-333` |
| D-09 | Condição de duração cardiovascular | Vincent 1996 exige agentes adrenérgicos "for at least 1 h"; o legado **não tem condição de duração** | **DEV** — doses transitórias em bolus são niveladas identicamente a infusões sustentadas. | `sofa.py:273-335` |
| D-10 | Dose desconhecida / agente desconhecido cardiovascular | Dose de dopamina desconhecida tem padrão 2; dose de epi/norepi desconhecida tem padrão 3; string de agente desconhecido (p.ex. vasopressina, fenilefrina) tem padrão 2 | **DEV (chute não citado)** — subestima silenciosamente (norepinefrina >0,1 com dose ausente é um 4 verdadeiro relatado como 3; vasopressina — ausente da tabela de 1996 — pontua *abaixo* do nível de dopamina-baixa). Um único `vasopressor_type` de string não consegue representar terapia combinada (norepinefrina + vasopressina), rotina no choque séptico. | `sofa.py:314-333` |
| D-11 | Faixas de GCS neurológico | 15=0, 13-14=1, 10-12=2, 6-9=3, <6=4 | MATCH | `sofa.py:361-369` |
| D-12 | Comportamento de sedação neurológico | **Nenhum tratamento de sedação de nenhum tipo.** Um paciente sedado com RASS −5 e GCS 3 pontua 4 pontos, indistinguível de coma estrutural | **DEV (sinalizar, não adjudicar aqui)** — a política de GCS-avaliado-sob-sedação pertence à revisão do workstream de neuro; apenas referência cruzada. O legado tem conteúdo de RASS documentado (`docs/rules/clinical-scoring/RULE-CLINICAL-SCORING-014`, RULE-SEDACAO-003), mas o scorer de SOFA nunca o consulta. | `sofa.py:343-369` |
| D-13 | Validação de entrada neurológica | O GCS não tem checagem de faixa; um GCS fisiologicamente impossível acima de 15 (p.ex. 20) pontua 1 ponto via o ramo `>= 13`, e GCS < 3 pontua 4 | **DEV (menor)** — a faixa válida 3-15 está documentada em outro lugar no legado (`RULE-CLINICAL-SCORING-013`), mas não é aplicada aqui. | `sofa.py:358-369` |
| D-14 | Creatinina renal | <1,2 / <2,0 / <3,5 / <5,0 / ≥5,0 mg/dL — contínua, sem lacuna morta em 5,0 | MATCH (e corrige a lacuna morta da era trilhas, §5) | `sofa.py:405-414` |
| D-15 | Débito urinário renal | <500 mL/dia→3, <200 mL/dia→4; final = `max(cr_score, uo_score)` | MATCH nos cortes; a combinação por `max()` é a convenção aceita (a tabela de 1996 lista creatinina *ou* débito urinário por faixa). **DEV (janela)** — o argumento é um "débito urinário de 24 horas em mL" fornecido pelo chamador (`sofa.py:395`); nenhuma montagem de janela de 24 h, prorrateamento, ou checagem de contexto de cateter existe em nenhum lugar do scorer, e o provider de entrada atual não fornece nenhum débito urinário (ver `sepse-pathway-clinical-review.md` §5). O critério de 24 h é, portanto, um *rótulo*, não uma janela de medição implementada. | `sofa.py:377-427` |
| D-16 | Ausência parcial renal | Creatinina `None` com débito urinário presente → `cr_score = 0` silenciosamente; débito urinário `None` com creatinina presente → `uo_score = 0` silenciosamente. Apenas ambos-ausentes define um status `"missing"` | **DEV (coerção a zero dentro de um componente "presente")** — um escore renal de uma entrada é reportado sem nenhum marcador de parcialidade. | `sofa.py:400-424` |
| D-17 | Escore total | Soma simples; componentes ausentes contribuem 0; total apresentado como int 0-24 | **DEV** — uma avaliação parcial de 3 órgãos é avaliada com o mesmo tipo e faixa de um escore completo de 6 órgãos. `missing_components` existe em `SOFAResult` (`sofa.py:122`), mas o modelo de persistência `clinical_score.score_value` é um int não-nulo simples, sem coluna de status (`clinical_score.py:21`; o JSONB `components` é nullable, `clinical_score.py:30`) — o metadado é estruturalmente descartável, exatamente o achado LEGACY-TA:478 por trás do HAZ-0005. | `sofa.py:504`, `clinical_score.py:21,30` |
| D-18 | Classificação de mortalidade | `classify_sofa_mortality_risk`: ≤6 baixo, ≤9 moderado, ≤12 alto, ≥13 muito_alto | **DEV (não citada + internamente inconsistente)** — não está em Vincent 1996; as próprias faixas da docstring dizem 13-14 ≈ 50-60%, ainda que 13-14 seja classificada `muito_alto` ao lado de ">15: ~>90%", e as faixas citadas se sobrepõem ("15-24: ~80-90%" vs ">15: ~>90%"). Nenhuma citação em nenhum lugar. Qualquer classificação V2 precisa de uma fonte nomeada e ratificação. | `sofa.py:40-59, 124-138` |
| D-19 | Alegação de ratificação | `# CLINICALLY RATIFIED per RAT-CLINICAL-SCORING-01/02/03` | **DEV (governança)** — a linha de autoridade do registro de ratificação diz `authority: 'repository owner delegation (session directive: "use deep think to decide on the RATIFICATION items…")'` (`docs/plan/_work/ratification-decisions.yaml:1-3`), ou seja, uma delegação em bloco de dono/agente, não uma autoridade clínica nomeada e verificável. Consistente com LEGACY-TA:125/465 (aprovador com CRM/instituição não verificáveis). Sob `evidence-notation.md` §2 regra 3, isso não pode se sustentar como DECIDED na V2; toda alegação legada de "RATIFIED" é nula para os propósitos da V2. | `sofa.py:20`; `ratification-decisions.yaml:1-3` |

**Contagem de discrepâncias (engine em produção): 12 achados DEV (D-02, D-04,
D-06, D-07, D-09, D-10, D-12, D-13, D-15, D-16, D-17, D-18) mais um achado de
governança (D-19); 6 MATCH.**

Três piores: **D-07** (PAM ausente zera silenciosamente o escore
cardiovascular de um paciente em vasopressores), **D-17** (totais parciais
tipados e persistidos identicamente a totais completos — o mecanismo do
HAZ-0005), **D-06** (a docstring convida a um erro de unidade de bilirrubina
de 17×).

## 5. O SOFA da era trilhas (RULE-CLINICAL-SCORING-001…-012) — revisado conforme documentado

Código subjacente `ahlabs-trilhas@8166c07eae` — **SOURCE NOT LOCATED**
(repositório não montado); os achados abaixo são declarações SOURCE dos
registros de regra hasheados, não código re-verificado.

| Regra | Conteúdo documentado | Veredito documentado | Comentário de revisão |
|---|---|---|---|
| 001 (total) | Soma de seis sub-escores, 0-24 | VERIFIED | A soma está correta *dados* os sub-escores; o próprio registro anota que sub-escores `None` disparam `TypeError` na soma — um modo de falha de disponibilidade que a V2 não deve herdar. |
| 002 (respiração) | Cortes 400/300/200/100 corretos, mas (a) FiO2 armazenado 21-100 (percentual) upstream enquanto os limiares presumem fração → razão ~100× pequena demais, quase todo paciente pontua 4; (b) **nenhum gate de ventilação nos escores 3-4** | DISCREPANCY, alto impacto | Ambos os defeitos corrompem independentemente o sub-escore respiratório; o `services/sofa.py` da V1 corrigiu (b) e meio-protege (a) via a heurística `<20` (D-04). |
| 003 (coagulação) | Faixas exatas (escala /mm³); plaquetas == 0 tratado como sem-dado → 0 | VERIFIED | O sentinela-0 é mais uma sobrecarga de domínio-de-valor de "ausente sobre saudável". |
| 004 (fígado) | Limites superiores estritos-`<` criam lacunas mortas [1,9;2,0), [5,9;6,0), [11,9;12,0) retornando `None` → soma dispara ou soma incorretamente | DISCREPANCY, moderado | Uma função de scoring que pode *derrubar o SOFA inteiro* em bilirrubina 1,95 mg/dL. Corrigido no `services/sofa.py` da V1 (faixas contínuas). |
| 005 (cardiovascular) | Noradrenalina lida como **volume ml** bruto com um corte 3-vs-4 em ">10 ml"; dopamina e epinefrina totalmente ausentes; PAM <70=1 e dobutamina-qualquer=2 correspondem | DISCREPANCY, alto | Um mapeamento de unidade incoerente (ml não é µg/kg/min); qualquer paciente em norepinefrina pode ser mal-classificado em qualquer direção. |
| 006 (SNC) | Faixas de GCS exatas | VERIFIED | GCS 0 / >15 caem para 0 ("sem dado") — mesmo padrão de sobrecarga do 003. |
| 007 (renal) | Creatinina exatamente 5,0 (e (4,9;5,0]) não bate com **nenhum ramo** → 0 pontos renais no topo da escala; faixa de 2 pontos escrita 2,0-4,0 mas sombreada; cortes de débito urinário correspondem | DISCREPANCY, alto | Uma subcontagem de 4 pontos em um valor laboratorial comum. Corrigido no `services/sofa.py` da V1 (D-14). |
| 008 (relação P/F) | `po2/fio2` com sentinela `False` para ausência; FiO2 percentual-vs-fração internamente inconsistente por toda a base de código | DISCREPANCY, alto | A incoerência de unidade é sistêmica, não local — argumento decisivo para a V2 exigir quantidades codificadas em UCUM na fronteira (`compatibility-finding.md` §3.1). |
| 009 (PAM) | `((2·PAD)+PAS)/3`, entrada falsy → 0 | VERIFIED (fórmula) | PAM=0 como sentinela-de-ausência alimenta a coerção estilo D-07 a jusante. |
| 010 (idade) | idade em dias//365; peculiaridades negativas/0 | DISCREPANCY, baixo | Fora do escopo do SOFA; relevante apenas ao gating populacional (VAL-0006/0007). |
| 011 (fonte) | Ao salvar, copia campos de prontuário; noradrenalina apenas quando existe relação, senão **valor prévio obsoleto retido** | VERIFIED (como workflow) | A peculiaridade de retenção obsoleta é um mecanismo do HAZ-0006. |
| 012 (montagem) | Montagem de entrada da primeira admissão; todos os seis órgãos representados | VERIFIED (como workflow) | Herda todo hazard de unidade upstream. |

INFERENCE: a linhagem trilhas não é candidata a importação em nenhuma forma;
seu valor é o catálogo de falhas acima, que a sonda de entrada ausente do
SAF-0002 da V2 e os testes de mapeamento de unidade (HAZ-0032) devem
codificar como vetores de regressão.

## 6. Coerção a zero do HAZ-0005 — rastreada por componente (engine em produção)

O HAZ-0005 (hazard-log.md:129) é **E1 — ocorreu**: entradas todas-ausentes
retornaram SOFA 0. Mecanismo, verificado a partir do código:

| Componente | Entrada ausente | Comportamento | Linhas decisivas |
|---|---|---|---|
| Respiração | `pao2_fio2=None` | retorna `(0, "missing")` | `sofa.py:168-169` |
| Respiração | bool passado | retorna `(0, "invalid_type")` — **e o status é descartado**; `calculate_sofa` registra apenas `"missing"` | `sofa.py:171-172, 468-469` |
| Coagulação | `platelets=None` | `(0, "missing")` | `sofa.py:219-220` |
| Fígado | `bilirubin=None` | `(0, "missing")` | `sofa.py:254-255` |
| Cardiovascular | `map_value=None` | `(0, "missing")` — **mesmo quando tipo/dose de vasopressor estão presentes** | `sofa.py:301-302` |
| Cardiovascular | dose `None`, agente conhecido | pontuado 2 ou 3 por chute, status `None` — nem sequer sinalizado como ausente | `sofa.py:314-315, 324-325` |
| Neurológico | `gcs=None` | `(0, "missing")` | `sofa.py:358-359` |
| Renal | ambos `None` | `(0, "missing")` (flag única `"creatinine_and_urine_output"`) | `sofa.py:400-402, 492-493` |
| Renal | exatamente um do par `None` | a metade ausente pontua 0 **sem nenhuma flag** | `sofa.py:405, 417-418` |
| Total | qualquer/todos ausentes | componentes somam como 0s; todos-ausentes → `total_score=0` com a lista `missing_components` populada, mas o `score_value` int persistido não carrega status | `sofa.py:504`; `clinical_score.py:21,30` |

Evidência de intenção: `tests/test_sofa.py` **afirma** esse comportamento
como correto — `(None, False, (0, "missing"))` (test_sofa.py:36), `(None,
(0, "missing"))` para plaquetas, bilirrubina, GCS (test_sofa.py:95,121,234),
`score_cardiovascular(None) == (0, "missing")` (test_sofa.py:147-148). A
coerção a zero é projetada e reforçada por teste, não acidental.

**Veredito do HAZ-0005 por classe de componente:** confirmado para todos os
seis componentes; agravado no cardiovascular (evidência de severidade
positiva descartada, `sofa.py:301-302`) e no renal (ausência de
sub-componente sem flag, `sofa.py:405,417`); agravado em nível de tipo pelo
apagamento de `invalid_type` (`sofa.py:171-172` + `468-469`). A sonda de
entrada ausente do SAF-0002 da V2 deve incluir toda linha da tabela acima
como teste negativo.

## 7. ANÁLISE DE SOFA-PARCIAL — INPUT TO ADR-0008

**Marcado como insumo obrigatório para a ADR-0008. Tudo nesta seção é
PROPOSAL.**

### 7.1 O que é computável a partir das fontes AMH atualmente evidenciadas

SOURCE (`docs/08-interoperability/amh-data/compatibility-finding.md` §3, AMH
fixado `0a07a6f1fab36fb2f5eeee0fcd8e945c95f67116`): no snapshot de evidência,
a AMH tem **zero Observations populadas de qualquer categoria** — a
Observation laboratorial é bloqueada por uma fonte Bronze vazia, o único
padrão de perfil Observation fixa `category = laboratory`, e nenhum perfil
de sinais vitais existe de forma alguma. Nenhum contrato de administração de
medicação com granularidade de dose foi evidenciado; nenhuma fonte de
débito urinário de nenhum tipo foi identificada (`candidate-inventory.md`
CAND-0003).

**Consequência, dita sem suavização: hoje o número de componentes de SOFA
computáveis a partir de fontes AMH evidenciadas é zero de seis.** Não
"parcial" — zero. Um SOFA V2 contra a evidência AMH de hoje rodaria
permanentemente em `not_evaluated`; admiti-lo instanciaria o HAZ-0043
(vazio permanente habituado a um silêncio tranquilizador). Esta é a própria
inferência do achado de compatibilidade (`AMH-CF §3.3`) aplicada a este
instrumento, e é por isso que o CAND-0003 é marcado INELEGÍVEL "duas vezes".

### 7.2 Se Observations laboratoriais mais tarde popularam conformemente (LOINC + UCUM)

Demanda de fonte por componente, a partir da assinatura de entrada em
`sofa.py:435-445`:

| Componente | Entradas necessárias | Apenas-labs populariam? |
|---|---|---|
| Coagulação | contagem de plaquetas | **Sim** (laboratorial) |
| Fígado | bilirrubina total | **Sim** (laboratorial) |
| Renal (metade creatinina) | creatinina sérica | **Sim**; a metade de débito urinário precisa de uma fonte de balanço hídrico que não existe — o componente renal seria em si um *parcial silencioso*, a menos que a V2 o modele explicitamente (D-16) |
| Respiração | PaO2 (gasometria — laboratorial) **e** FiO2 + status de suporte respiratório (contexto de dispositivo/vitais) | **Não** — gasometria sozinha é insuficiente; FiO2 e status de ventilação não têm fonte evidenciada |
| Cardiovascular | PAM (sinal vital) + agente e dose de vasopressor em µg/kg/min (administração de medicação) | **Não** — nenhuma das duas classes está evidenciada |
| Neurológico | GCS (classe de avaliação clínica/sinais vitais) | **Não** — estruturalmente excluído pelo perfil fixado em laboratorial |

Então o *melhor* futuro conformante-apenas-labs produz **2 de 6 componentes
completamente, mais metade de um terceiro**: coagulação + fígado + renal
apenas-creatinina. Total parcial máximo obtenível: 12 de 24 pontos, dos três
sistemas orgânicos que menos se assemelham aos eixos de deterioração à
beira do leito (sem hemodinâmica, sem oxigenação, sem consciência).

### 7.3 Um SOFA parcial apenas-labs é clinicamente defensável? — os dois lados

**A favor de apresentar um parcial apenas-labs (esgrimido com força):**
- Os três componentes computáveis são sinais reais de disfunção orgânica;
  tendências de plaquetas, bilirrubina e creatinina carregam peso
  prognóstico legítimo, e clínicos já raciocinam sobre tendências
  laboratoriais isoladas.
- Um parcial com limites explícitos ("apenas coag/fígado/renal; respiratório,
  cardiovascular e SNC NÃO avaliados") é mais informação que nada, e
  evaluation-status-semantics.md §3.2 fornece exatamente o estado `partial`
  para um subconjunto declarado e aprovado.
- O próprio Sepsis-3 tolera pressupostos de ausência-na-linha-de-base
  (SOFA basal presumido zero), então a literatura do instrumento não é
  avessa a convenções pragmáticas.

**Contra (esgrimido com força):**
- As alegações de validade do SOFA se ligam ao agregado de seis órgãos; um
  subconjunto de 3-de-6 é **um instrumento diferente, não validado**
  usando o nome do SOFA. O PROMPT:418 (citado em
  evaluation-status-semantics.md §3.2) proíbe alterar silenciosamente uma
  definição clínica; um subconjunto honesto teria que ser *evidenciado
  separadamente*, não rotulado "SOFA".
- A metade ausente é sistematicamente a metade **aguda**. Labs ciclam em
  cadência de horas-a-diária; colapso hemodinâmico, dessaturação e coma
  evoluem em minutos. Um "SOFA 2" apenas-labs em um paciente em choque
  dependente de vasopressor é o D-07 em escala de portfólio: o escore é o
  mais baixo exatamente quando o eixo não medido é o que está falhando
  (mecânica do hazard candidato PH-01/PH-03, `candidate-inventory.md` §5).
- O uso diagnóstico do Sepsis-3 é **ΔSOFA ≥2 versus a linha de base**. Um
  instrumento parcial não consegue ancorar um Δ, porque a linha de base e o
  valor atual podem cobrir subconjuntos de componentes diferentes em dias
  diferentes (PH-03: "a composite describing a patient state that never
  existed at any instant").
- A lição legada (HAZ-0005) é precisamente que um número baixo produzido a
  partir da ausência lê como tranquilidade. Um parcial apenas-labs é
  ausência *estruturada*.

**Recomendação — PROPOSAL:** a V2 não deve computar um *total* de SOFA
parcial sob nenhum estado de fonte apenas-labs. Se a governança clínica
quiser o fragmento computável exposto, ele deve ser (a) apresentado como
**escores de componente por órgão, nunca somados**, cada um com seu próprio
status de avaliação e frescor; e (b) admitido, se admitido, como uma
pathway separadamente nomeada e separadamente evidenciada por PROMPT:418 —
não como "SOFA". A própria pathway do SOFA retorna `not_evaluated` (motivo
`missing_required_input:<componente>`) até que todos os seis componentes
tenham fontes evidenciadas e dentro-da-janela, a menos que uma autoridade
clínica nomeada ratifique uma política de parcial explícita sob
evaluation-status-semantics.md §3.2 — o que hoje falharia a própria
condição de entrada dessa seção (nenhuma política de parcial aprovada
existe, e nenhuma pode ser aprovada contra fontes inexistentes). O ΔSOFA (o
critério do Sepsis-3) exige adicionalmente uma convenção de linha de base
ratificada antes de poder existir de forma alguma. **VALIDATION REQUIRED:**
`AUTH-CLINSAFETY`; alimenta a ADR-0008 diretamente; ver também VAL-0023
(janelas de frescor por entrada — não resolvido) e VAL-0006/0007 (gating
apenas-adulto — não resolvido e BLOCKING).

## 8. Vereditos clínicos — PROPOSAL, conforme legacy-import-policy §4

| Artefato | Veredito | Racional |
|---|---|---|
| Constantes de corte e estrutura de faixa do `services/sofa.py` (D-01, D-05, D-06 numérico, D-08, D-11, D-14, D-15 cortes) | **VALIDATE** | Numericamente fiel a Vincent 1996; pode informar uma especificação V2 como *valores de referência*, re-derivados da fonte primária com testes de aceitação V2 — nunca copiados como código. Importação bloqueada de qualquer forma até que os itens de legacy-import-policy §3 (dono, licença, revisão clínica) existam. |
| Tratamento de entrada ausente/inválida do `services/sofa.py` (§6) | **REJECT** | O próprio mecanismo do HAZ-0005, reforçado por teste. A álgebra de status de avaliação da V2 (SAF-0001/0002) é sua substituta; carregar a tabela de §6 apenas como vetores de teste negativo. |
| Padrões de dose-desconhecida/agente-desconhecido cardiovascular, short-circuit de PAM-ausente do `services/sofa.py` (D-07, D-10) | **REJECT** | Chute clínico silencioso; descarta evidência de severidade. |
| Classificação de risco de mortalidade do `services/sofa.py` (D-18) | **REJECT** | Não citada, internamente inconsistente; qualquer classificação V2 deve ser sourced e ratificada do zero. |
| Interpretação de gate-de-ventilação e teto-em-2 (D-02) | **VALIDATE** | Convenção comum, mas não citada; a V2 deve decidir o escopo de "suporte respiratório" (invasivo/VNI/HFNC) com uma fonte nomeada. |
| Conceito de `SOFAResult.missing_components` (D-17) | **TRANSFORM** | O único bom instinto do arquivo — a ausência é ao menos *registrada*. A V2 o supera com um status de avaliação de primeira classe que é não-construível sem um; a lista legada mostra que a intenção existia e foi estruturalmente descartada na persistência. |
| Formato de persistência de `clinical_score` | **REJECT** | Um int de escore não-nulo simples sem coluna de status é a metade de persistência do HAZ-0005. |
| Conjunto de regras 001-012 da era trilhas (§5) | **REJECT (manter como catálogo de falhas)** | Superado duas vezes; incoerência de unidade e defeitos de lacuna morta são valiosos apenas como vetores de regressão para testes V2. |
| Alegações de ratificação "RAT-*" legadas (D-19) | **REJECT** | A autoridade é uma delegação de dono/agente, não um aprovador clínico nomeado; nula sob a notação de evidência da V2. |

## 9. Elementos sobreviventes propostos para especificações V2 (PROPOSAL)

1. A própria tabela de Vincent 1996, citada da fonte primária, como a única
   referência normativa para qualquer conteúdo de SOFA V2 — com os quatro
   pontos de interpretação que a fonte primária deixa em aberto
   explicitamente enumerados para ratificação: escopo de suporte
   respiratório (D-02), tratamento de P/F <200 não suportado (D-02),
   condição de duração de vasopressor (D-09), tratamento de vasopressor
   combinado (D-10).
2. Disciplina de unidade como precondição de contrato: quantidades
   codificadas em UCUM para bilirrubina (mg/dL vs µmol/L), creatinina,
   plaquetas, FiO2-como-fração; unidade não mapeável →
   `invalid`, nunca pontuada (conforme evaluation-status-semantics.md §3.5;
   a catástrofe de FiO2 da trilhas em §5 é a justificativa permanente).
3. A tabela de §6 como vetores de sonda de entrada ausente do SAF-0002; os
   defeitos da trilhas de §5 (bilirrubina 1,95, creatinina 5,0, FiO2
   percentual) como vetores de regressão nomeados.
4. Explicação de componente por órgão (exigência do CAND-0003 do
   candidate-inventory) e a regra de §7.3: nenhum total parcial,
   componentes nunca somados através de órgãos ausentes, ΔSOFA apenas após
   uma convenção de linha de base ratificada.

*Revisado por rodaquino-OMNI (revisor responsável de registro, GDEC-0003).
Sem PHI, sem dados reais de paciente; todos os valores neste documento são
limiares publicados ou exemplos sintéticos.*
