---
id: REV-NS-04
title: Revisão legada — BPS (Behavioral Pain Scale, 3-12)
label: PROPOSAL
statement: >
  A V1 valida BPS 3-12 corretamente; o motor de formulários a computa a partir das três
  subescalas de Payen, mas coage qualquer subescala ausente a 1 (minimizando silenciosamente
  a dor), e as faixas de pathway sinalizam BPS 5 onde o ponto de corte acionável de Payen é
  >5. O catálogo predecessor documenta uma faixa grave inalcançável (10-12). Veredito: REFINE.
  PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).
provenance:
  source_repo: intensicare (legado V1, READ-ONLY)
  path_or_url: src/intensicare/services/domain_sedacao.py; src/intensicare/services/domain_formularios.py; _work/alerts/pathways/sedacao.yaml
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

# REV-NS-04 — BPS (dor comportamental, 3-12)

## 1. Conforme implementado (OBSERVED, verbatim)

| Caminho | Linhas | SHA-256 | Manifesto |
|---|---|---|---|
| `src/intensicare/services/domain_sedacao.py` | 125-128, 254-256 | `f0be9ac1164b6e453e03d91fc36b66d5aa24b4db751f7010326d4307a9e17a13` | MATCH |
| `src/intensicare/schemas/sedacao.py` | 44 | `bd432d9a5b4144380eaed1c6518b10465612c95d9d7e33468053114e0e44992d` | MATCH |
| `src/intensicare/services/domain_formularios.py` | 771-823 | `61db0316a942ce3c1310be15ff0411b3f5bbbd58754aa4f58b2912f0230499d3` | MATCH |
| `_work/alerts/pathways/sedacao.yaml` | 58-78 | `21dfa0bd03b633a196e10de6f752c195d62448a86f5c72190a0dfab1a3675657` | MATCH |
| `docs/rules/clinical-scoring/RULE-CLINICAL-SCORING-016-…md` | arquivo inteiro | `863cb605485e37f13ca94bb8234728fe285fc073eeacde64b0ed281b76ef0d31` | MATCH |
| `docs/rules/clinical-scoring/RULE-BALANCO-HIDRICO-019-…md` | arquivo inteiro | `5056d3e03695c79f56ef441b73a039fde594a828929b698338e053f471ca70e1` | MATCH |
| `docs/rules/clinical-scoring/RULE-SEDACAO-001/-002-…md` | arquivos inteiros | `c700d576905f0e8e344f98e8272b2ee6d48a7951ef5998d4daee74ce1e3d5560` / `8b99b8f2f18753264b4e6bdb360b358ea6f070a22054aa26a0b25ed6ef7cb0db` | MATCH |
| `docs/rules/clinical-scoring/RULE-PIORA-CLINICA-007-…md` | arquivo inteiro | `023019ffb8119911085a6948aeafe1f3d9e039e44c69c2372a09796893278486` | MATCH |
| `tests/test_domain_formularios.py` | 334-352 | ver README §4 | ABSENT (hash-notado) |

- Validador (`domain_sedacao.py:125-128`): `3 <= score <= 12`; violação levanta exceção
  (`:254-256`). Schema `ge=3, le=12`, anulável.
- Motor de formulários (`domain_formularios.py:796-810`), comportamento verbatim: três
  subescalas `expressao_facial`, `membros_superiores`, `ventilacao_mecanica_indicador`, cada
  uma restringida a 1-4; **as três `None` → `(None, None)`** (honesto); **qualquer subconjunto
  ausente → cada subescala ausente coagida a 1** (nome do teste em
  `tests/test_domain_formularios.py:334`: "Missing BPS components default to 1 each").
  Gravidade (`_bps_severity`, `:813-822`): `<=3 sem_dor / 4-6 dor_leve / 7-9 dor_moderada /
  >=10 dor_intensa`.
- Pathway (`sedacao.yaml:58-78`, faixas limite inferior inclusive/superior exclusivo):
  `[3,5) normal / [5,8) watch "Dor moderada" / [8,∞) urgent "Dor intensa"`; a descrição
  assere "BPS ≥ 5 indica dor presente".
- Catálogo predecessor: validador 3-12 correto (RULE-CLINICAL-SCORING-016 identifica a
  escala sem ambiguidade como BPS, não CPOT 0-8); ramificação NRS-vs-BPS por tipo de `dor`
  (RULE-BALANCO-HIDRICO-019); sub-faixas institucionais 7-9 / 10-12 em dois balanços
  consecutivos (RULE-SEDACAO-001/-002, dentro da faixa); **RULE-PIORA-CLINICA-007 documenta
  a faixa grave escrita como `10 <= sinais > 12` — insatisfazível sob o teto 12, de modo que
  BPS 10-12 pontuava "0" no critério de piora do predecessor (impacto alto).**
- CPOT: nomeado como alternativa em `sedacao.yaml:138` (recomendação de evidência) e como
  chave de contexto de exemplo em `domain_pharmaco_delirium.py:126` (`cpot_score`), mas
  **nenhuma implementação de CPOT existe na `src` da V1** — BPS é o único instrumento
  comportamental implementado.

## 2. Instrumento publicado (SOURCE)

- Payen JF et al. *Assessing pain in critically ill sedated patients by using a behavioral
  pain scale.* Crit Care Med. 2001;29(12):2258-2263. Três subescalas (expressão facial,
  movimentos de membros superiores, adaptação à ventilação), cada uma 1-4; total 3 (sem dor)
  a 12 (máximo). O limiar acionável comumente operacionalizado é BPS > 5 (isto é, ≥ 6).
- Devlin JW et al. (SCCM PADIS). Crit Care Med. 2018;46(9):e825-e873 — BPS (ou CPOT) é o
  instrumento comportamental de dor recomendado para adultos não comunicativos em ventilação
  mecânica.

## 3. Análise de discrepância

| Dimensão | Achado | Rótulo |
|---|---|---|
| Faixa / subescalas | 3-12 com três subescalas 1-4 — corresponde exatamente a Payen. | OBSERVED |
| Pontos de corte | `sedacao.yaml` sinaliza BPS 5 como "dor moderada" (watch); o limiar de Payen é >5. Um ponto mais sensível — escolha institucional, não um erro numérico, mas contradiz a própria descrição "BPS ≥ 5" do arquivo se as faixas pretendiam codificar >5. As sub-faixas 7-9/10-12 (predecessor) e o mapa de gravidade 4-6/7-9/≥10 (formulários) são subdivisões institucionais sem contrapartida publicada; internamente consistentes. | OBSERVED |
| Dado ausente | Submissões parciais são silenciosamente minimizadas: uma subescala observada mais duas coagidas a 1 produz um total baixo plausível sem marcador algum que o distinga de uma avaliação completa — a dor é sistematicamente subestimada exatamente nos pacientes (sedados, ventilados) que não conseguem autorrelatar. | OBSERVED |
| Gating de aplicabilidade | BPS é validado para pacientes sedados/ventilados, mas nada faz gating do uso de BPS pelo estado de ventilação, e o motor de formulários assume `tipo`→"bps" por padrão para qualquer submissão que omita o campo (REV-NS-03 §3). Inversamente, nada impede BPS em um paciente profundamente bloqueado (BNM), em quem escalas comportamentais são inválidas. | OBSERVED / INFERENCE |
| População | Instrumento adulto; sem gating por idade (VAL-0006/0007, HAZ-0036). | INFERENCE |

## 4. Checagem de coerção-zero do HAZ-0005 (a partir da fonte)

**VIOLAÇÃO (variante de coerção ao piso).** `domain_formularios.py:804-806` coage cada
subescala ausente ao seu piso (1 = contribuição "sem dor"), produzindo um total de
aparência válida e minimizado a partir de uma avaliação incompleta — ausência renderizada
como tranquilização, o mecanismo do HAZ-0005 aplicado à dor. O ramo todas-ausentes →
`(None, None)` está conforme. A faixa inalcançável 10-12 do predecessor
(RULE-PIORA-CLINICA-007) é a mesma classe de hazard já materializada (dor grave → "0").

## 5. Veredito

**REFINE** — a codificação do instrumento (3 subescalas × 1-4, total 3-12) está correta e é
importável; REJEITAR a coerção-ao-piso de subescala parcial (uma BPS com qualquer subescala
não testada é `not_evaluated` ou `partial` sob uma política explícita, nunca um total
silenciosamente minimizado); exigir gating por estado de ventilação/comunicação na escolha
NRS-vs-BPS; submeter o limite BPS-5 e as sub-faixas institucionais à ratificação clínica;
adicionar o misparse `10 <= sinais > 12` do predecessor aos testes negativos da V2.

**PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).**
