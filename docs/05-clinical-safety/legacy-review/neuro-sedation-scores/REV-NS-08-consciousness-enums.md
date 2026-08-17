---
id: REV-NS-08
title: Revisão legada — enums de consciência (escada tipo AVDI, tratamento AVPU/ACVPU, subescores graduados de consciência)
label: PROPOSAL
statement: >
  O enum de consciência de 7 itens tipo AVDI do predecessor, sua escada ordinal customizada de
  gravidade, e seus subescores graduados +/- não correspondem a nenhuma escala publicada; o
  detector de deterioração de um consumidor tem direção invertida (dispara na melhora). A src
  da V1 substitui isso por captura validada por ACVPU, mas pontua AVPU ausente como 0 no
  MEWS/NEWS2 e silenciosamente pontua o valor armazenado "C" (confusão) como 0 no MEWS.
  Veredito: TRANSFORM, com o comparador invertido REJEITADO.
  PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).
provenance:
  source_repo: intensicare (legado V1, READ-ONLY)
  path_or_url: src/intensicare/services/mews.py; src/intensicare/services/news2.py; src/intensicare/schemas/vitals.py; docs/rules/clinical-scoring/ (SEPSE-005/-033, PIORA-CLINICA-005, BALANCO-HIDRICO-059)
  commit_sha_or_version: 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79 (SHA-256 por arquivo em §1; MATCH contra legacy-pin-cycle-1.md salvo indicação em contrário)
  section_or_lines: citado por achado
  date_collected: 2026-08-15
  collector: revisor forense de instrumentos legados de neuro/sedação (ciclo 1, Tarefa 1); revisor responsável rodaquino-OMNI
  transformation: >
    traduzido EN→pt-BR, tranche 4, GDEC-0008 item 8 (trechos verbatim mais análise do revisor)
  confidence: alta
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  requirements: [SAF-0001, SAF-0002]
  hazards: [HAZ-0005, HAZ-0036]
  adrs: []
  tests: []
  pr: null
supersedes: null
superseded_by: null
---

> Traduzido EN→pt-BR em 2026-08-16 (GDEC-0008 item 8, tranche 4); original EN preservado no histórico git.

# REV-NS-08 — enums de consciência e tratamento AVPU/ACVPU

## 1. Conforme implementado (OBSERVED, verbatim)

| Caminho | Linhas | SHA-256 | Manifesto |
|---|---|---|---|
| `src/intensicare/schemas/vitals.py` | 13, 79-88 | `f6afffd444038f2d1dec19d7047a0013f908d9a7106c52ce9895cbc1ba14308f` | MATCH |
| `src/intensicare/models/vital_sign.py` | 37 | `4a145e9b4135fd943043d96c5efe3a3981f84053f78710b0f6fe66bd126d4a12` | MATCH |
| `src/intensicare/services/mews.py` | 151-165, 199-223 | `43f7a8e17a31ea21f61ec53b2bcee68ff64067387c687e23714382f4737e922c` | MATCH |
| `src/intensicare/services/news2.py` | 213-224, 288 | `d3399fe2bb9853222dde6b16167a4f6093c6daac7b1559474b628deeff246bc8` | MATCH |
| `src/intensicare/models/deterioration.py` | 16 | `36934798b1c26526c9cc4759b6d58221bb0329a0cb1be2f4f83cea489d5bdb27` | MATCH |
| `docs/rules/clinical-scoring/RULE-BALANCO-HIDRICO-059-…md` | arquivo inteiro | `09d8a768bdb09cd23c82fc48eb71fbe278d53207fe4b8a448c4a0124833f4ddb` | MATCH |
| `docs/rules/clinical-scoring/RULE-SEPSE-005-…md` | arquivo inteiro | `6fcbf6895b4c221d673b8f5aa20be0fc596456430236fea4066685836a2fbfb9` | MATCH |
| `docs/rules/clinical-scoring/RULE-SEPSE-033-…md` | arquivo inteiro | `fe602cb8e0f12bba4878298bd3574ff42ccec0fbcadea66bae508b17d4837c3c` | MATCH |
| `docs/rules/clinical-scoring/RULE-PIORA-CLINICA-005-…md` | arquivo inteiro | `f8ae36b45f8a925c7cd73708515b9228d6e4dab96eb8843e3b57df90e3c9bc38` | MATCH |
| `tests/test_mews.py` | 139-165 | ver README §4 | ABSENT (hash-notado) |

### 1.1 Src da V1 — captura ACVPU, pontuação por mapa AVPU

- Captura: `schemas/vitals.py:13` — `AVPU_VALUES = frozenset({"A", "C", "V", "P", "U"})`
  (ACVPU, incluindo C = nova confusão); o validador (`:79-88`) normaliza a caixa e rejeita
  qualquer outra coisa. Armazenado como `String(4)` (`models/vital_sign.py:37`).
- NEWS2 (`news2.py:213-224`), verbatim: `if avpu is None: return 0`; `"A" → 0`; qualquer
  outra coisa → 3. Portanto C/V/P/U → 3 (comportamento NEWS2 correto), mas **ausente → 0 =
  equivalente-a-Alerta**.
- MEWS (`mews.py:151-165`): `None → {"avpu": 0, "avpu_status": "missing"}` (zero mais
  metadado lateral); `avpu_map = {"A": 0, "V": 1, "P": 2, "U": 3}`;
  `pts = avpu_map.get(upper, 0)` — **o valor armazenado, válido pelo schema, "C" não está no
  mapa e silenciosamente pontua 0 (Alerta)**. A suíte de testes corrige apenas o mapeamento
  A/V/P/U (`tests/test_mews.py:139-165`).

### 1.2 Catálogo predecessor (evidência secundária; fonte `ahlabs-trilhas` não montada)

- RULE-BALANCO-HIDRICO-059: enum de captura de 7 itens `acordado, sonolencia, agitacao,
  reage_verbal, reage_tatil, coma, convulsao` — tipo AVDI mas com três membros (sonolência,
  agitação, convulsão pós-ictal) que não existem em nenhuma escada de reatividade publicada;
  veredito do catálogo UNVERIFIABLE.
- RULE-SEPSE-005: gravidade ordinal customizada `{acordado:1, sonolencia:2, agitacao:3,
  convulsao:3, reage_verbal:4, reage_tatil:5, coma:6}`; agitação/convulsão empatam em 3, de
  modo que uma transição entre elas não registra mudança; valor não mapeado → None.
- RULE-SEPSE-033 (**comparador com direção invertida**): o critério de "variação do nível de
  consciência" da sepse retorna `anterior > atual` nessa escada — como um rank maior =
  pior, ele **dispara na melhora clínica e permanece silencioso na deterioração**
  (acordado→coma retorna False). Impacto no catálogo: moderado; registrado ali verbatim.
- RULE-PIORA-CLINICA-005: subescore graduado mapeando o enum para `"1+/2+/3+"` (escada de
  reatividade) e `"1-/2-/3-"` (sonolência/agitação/convulsão), com `acordado` **e qualquer
  valor não mapeado** → `"0"`. O tipo de resultado `+/-` sobrevive na V1:
  `models/deterioration.py:16` — `score: String(4), comentário "0, 1+, 1-, 3+, 3-"`.

## 2. Instrumentos publicados (SOURCE)

- AVPU: 4 estados ordinais (Alerta / responde a Voz / responde a Dor / Irresponsivo);
  comparação à beira-leito contra o GCS: McNarry AF, Goldhill DR. Anaesthesia.
  2004;59(1):34-37.
- O ACVPU com "C = nova confusão" e a ponderação de consciência (A=0, qualquer de
  C/V/P/U=3) é definido pelo NEWS2: Royal College of Physicians. *National Early Warning
  Score (NEWS) 2.* London: RCP, 2017.
- Consciência do MEWS (AVPU graduado 0-3): Subbe CP et al. QJM. 2001;94(10):521-526.
- O enum de 7 itens, a escada 1-6, e os subescores `+/-` não correspondem a **nenhum**
  instrumento publicado (o catálogo concorda).

## 3. Análise de discrepância

| Dimensão | Achado | Rótulo |
|---|---|---|
| Completude da enumeração | A captura da V1 é ACVPU completo; o mapa de pontuação do MEWS cobre apenas AVPU, de modo que um membro válido pelo schema ("C") cai para 0 — um estado anormal armazenado válido pontuado como normal. | OBSERVED |
| Ordenação | A escada do predecessor é monotônica mas não validada; o empate agitação/convulsão apaga transições; `reage_verbal` tem rank *pior* que `agitacao`, o que nenhuma escada publicada sustenta. | OBSERVED / INFERENCE |
| Pontos de corte | A ponderação NEWS2 A-vs-resto (3 pontos) corresponde ao RCP 2017; V/P/U 1/2/3 do MEWS corresponde a Subbe. | OBSERVED |
| Dado ausente | NEWS2 ausente → 0 sem marcador algum; MEWS ausente → 0 com um `avpu_status` de banda lateral que nenhum consumidor eleva. Ambos são HAZ-0005. | OBSERVED |
| Direção | Comparador da RULE-SEPSE-033 invertido (dispara na melhora). | SOURCE (catálogo) |
| Tipagem de resultado | O escore string `0/1+/1-/3+/3-` é um tipo sob-medida, sem ordem (é "1-" pior que "1+"? indefinido), carregado para uma coluna persistida da V1. | OBSERVED |
| População | As ponderações de MEWS/NEWS2/AVPU são validadas para adultos → VAL-0006/0007, HAZ-0036. | INFERENCE |

## 4. Checagem de coerção-zero do HAZ-0005 (a partir da fonte)

**VIOLAÇÃO — três instâncias vivas na src da V1.** (a) `news2.py:219-220` AVPU ausente → 0
pontos de consciência, indistinguível de Alerta documentado; (b) `mews.py:159-160` ausente →
0 com metadado não elevado; (c) `mews.py:162-164` "C" desconhecido-mas-válido → 0 via
`dict.get(default=0)`. Adições do predecessor: valor de enum não mapeado → subescore "0"
(PIORA-005) e o comparador invertido (SEPSE-033), que converte deterioração real em
silêncio — funcionalmente o mesmo dano de falsa tranquilização.

## 5. Veredito

**TRANSFORM** em geral — a V2 deve padronizar a captura de consciência em um único
vocabulário validado (ACVPU conforme NEWS2, com o GCS como o instrumento granular conforme
REV-NS-01), derivar todas as contribuições de escore dessa única fonte, e tornar valores
ausentes/desconhecidos não-representáveis como 0 (evaluation-status em vez disso). O enum de
7 itens do predecessor, a escada 1-6, e a tipagem de subescore `+/-` são documentados apenas
para contexto.
**REJEITAR** (não-reimportar, com testes negativos): o comparador invertido da
RULE-SEPSE-033; pontuação com padrão estilo `dict.get(…, 0)` de valores de consciência;
ausente→0 na consciência do MEWS/NEWS2. A queda-através "C"→0 do MEWS deve ser corrigida em
qualquer uso interino.

**PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).**
