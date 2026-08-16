---
id: REV-NS-02
title: Revisão legada — RASS (Richmond Agitation-Sedation Scale)
label: PROPOSAL
statement: >
  A enumeração RASS da V1 (-5..+4) e os rótulos pt-BR correspondem a Sessler 2002; a validação
  está correta no serviço de sedação; mas o motor de formulários clínicos coage um RASS
  ausente a 0 ("Alerta e calmo") e restringe (clamp) silenciosamente valores fora de faixa, e
  o principal avaliador de alerta de RASS vive em um módulo não importável. Veredito: REFINE.
  PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).
provenance:
  source_repo: intensicare (legado V1, READ-ONLY)
  path_or_url: src/intensicare/services/domain_sedacao.py; src/intensicare/services/domain_formularios.py; src/intensicare/services/domain_pharmaco_delirium.py
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

# REV-NS-02 — RASS

## 1. Conforme implementado (OBSERVED, verbatim)

| Caminho | Linhas | SHA-256 | Manifesto |
|---|---|---|---|
| `src/intensicare/services/domain_sedacao.py` | 101-154, 250-252 | `f0be9ac1164b6e453e03d91fc36b66d5aa24b4db751f7010326d4307a9e17a13` | MATCH |
| `src/intensicare/services/domain_formularios.py` | 24-45, 676-694 | `61db0316a942ce3c1310be15ff0411b3f5bbbd58754aa4f58b2912f0230499d3` | MATCH |
| `src/intensicare/services/domain_pharmaco_delirium.py` | 269-367 | `f6c48a1d9545d66da3a744e0087b090f3648cfe3eb8d6a817f164138f2d9a401` | MATCH |
| `src/intensicare/services/domain_piora_clinica.py` | 443-466 | `ca8cbe35c00a8390a2d963ca5af9f235f0f454bf87c406cb5646d27d04221994` | MATCH |
| `src/intensicare/api/v1/deterioration.py` | 114-115 | `6a0c3bd1a14947f203be56bd0d2a678ab4d7870730f43816ab18c678154ce7f7` | MATCH |
| `src/intensicare/models/sedacao.py` | 24-31 | `b790b4b0e7be1550f7b5276a9ec8f1504b056b7db8f668a063f79913dd419c8b` | MATCH |
| `src/intensicare/schemas/sedacao.py` | 37-42 | `bd432d9a5b4144380eaed1c6518b10465612c95d9d7e33468053114e0e44992d` | MATCH |
| `_work/alerts/pathways/sedacao.yaml` | 31-56 | `21dfa0bd03b633a196e10de6f752c195d62448a86f5c72190a0dfab1a3675657` | MATCH |
| `_work/alerts/pathways/delirium.yaml` | 43-67 | `571f8e31310fc88613909dc17ba7df3b254c289ce799c88662f14059e9e69208` | MATCH |
| `docs/rules/clinical-scoring/RULE-CLINICAL-SCORING-014-…md` | arquivo inteiro | `5931aa164570c48fdff7c7be8c29a23ba80a6bdcaeab432a6ddb6b63d42e3187` | MATCH |
| `docs/rules/clinical-scoring/RULE-EVOLUCOES-003-…md` | arquivo inteiro | `8090c997b3778d057db506f00b290305a73416515ae31627a9e4d4c1980f8d65` | MATCH |
| `tests/test_domain_formularios.py` | 316-322 | ver README §4 | ABSENT (hash-notado) |

- Enumeração e rótulos (`domain_sedacao.py:101-112`): `-5 Não despertável, -4 Sedação
  profunda, -3 Sedação moderada, -2 Sedação leve, -1 Sonolento, 0 Alerta e calmo, +1
  Inquieto, +2 Agitado, +3 Muito agitado, +4 Combativo`; rótulo fora de faixa
  `"Desconhecido"` (`:140-154`). Mapa idêntico em `domain_formularios.py:33-44`.
- Validação (`domain_sedacao.py:120-122`): `-5 <= score <= 4`; violação levanta
  `ValueError` (`:250-252`). O schema `schemas/sedacao.py:37-39` impõe `ge=-5, le=4`;
  a coluna do model `models/sedacao.py:24-28` é um Integer anulável simples (sem restrição
  de BD).
- Motor de formulários (`domain_formularios.py:676-687`), verbatim:
  ```text
  nivel = _num(data.get("nivel"))
  if nivel is None:
      return 0.0
  return max(-5.0, min(4.0, nivel))
  ```
  RASS ausente → **0.0 = "Alerta e calmo"**; fora de faixa (+10, -10) → restringido
  (clamped) silenciosamente a +4/-5. Ambos os comportamentos são asseridos como esperados em
  `tests/test_domain_formularios.py:316-322` (clamping) — comportamento projetado.
- Avaliador de alerta (`domain_pharmaco_delirium.py:269-367`, `evaluate_sedation_rass_camicu`):
  sedação profunda `<= -3` (urgente quando `<= -4`), subsedação `>= +2`, alvo padrão
  `-2..0`; `rass is None` → `fired=False`, `severity="normal"`, mais a string de recomendação
  "RASS não registrado…". **O módulo não é importável** (import `maezo` inexistente —
  REV-NS-09 §1.4), portanto nada disso roda.
- Critério de deterioração (`domain_piora_clinica.py:443-466`): `>=+3 critical`, `>=+2
  alert`, `<=-5 critical`, `<=-4 alert`; ausente → `(False, "normal", "sem dados de
  RASS")`. A alimentação da API hard-codifica `"rass": None`
  (`api/v1/deterioration.py:114-115`), portanto esse critério é estruturalmente morto
  nessa rota.
- Faixas de pathway (limite inferior inclusive/superior exclusivo conforme
  `pathway.schema.json:156`): `sedacao.yaml:38-56` — `[-5,-3) critical / [-3,-2) watch /
  [-2,1) normal / [1,∞) urgent`; `delirium.yaml:48-67` — `[-5,-1) watch / [-1,1) normal /
  [1,3) urgent / [3,∞) critical`.
- Achados do catálogo predecessor retidos: RULE-CLINICAL-SCORING-014 (escala numérica
  correta em três definições, divergência de rótulo e um 11º sentinela "" em duas delas);
  RULE-EVOLUCOES-003 (RASS tipado como number em um model de frontend e como string em
  outro).

## 2. Instrumento publicado (SOURCE)

- Sessler CN et al. *The Richmond Agitation-Sedation Scale: validity and reliability in
  adult ICU patients.* Am J Respir Crit Care Med. 2002;166(10):1338-1344. Dez níveis
  +4 Combative … 0 Alert and calm … -5 Unarousable.
- Ely EW et al. *Monitoring sedation status over time in ICU patients: reliability and
  validity of the RASS.* JAMA. 2003;289(22):2983-2991.
- Devlin JW et al. (SCCM PADIS). Crit Care Med. 2018;46(9):e825-e873 — alvo de
  sedação leve (RASS -2 a 0 comumente operacionalizado).

## 3. Análise de discrepância

| Dimensão | Achado | Rótulo |
|---|---|---|
| Enumeração | 10 níveis, ordenação e âncoras correspondem exatamente a Sessler 2002; os rótulos pt-BR são traduções fiéis (-1 "Sonolento" = Drowsy). | OBSERVED |
| Faixa/tipo | -5..+4 inteiro em toda a `src` da V1; a divisão string-vs-number do predecessor (RULE-EVOLUCOES-003) não é carregada para os serviços da V1, mas não há restrição de BD. | OBSERVED |
| Pontos de corte | Sedação profunda `<=-3`, agitação `>=+2`, alvo `-2..0` são consistentes com PADIS. A semântica de faixa de `sedacao.yaml` coloca RASS -3 em *watch* enquanto sua própria descrição chama -3..-5 de "sedação profunda" — inconsistência interna no limite -3. RASS +1 (Inquieto) mapeia para *urgent* "Agitação" em `sedacao.yaml` (mais estrito que os rótulos publicados; +1 é inquietação, não agitação). | OBSERVED |
| Dado ausente | Motor de formulários: **ausente → 0.0 = valor-alvo normal** (achado mais grave deste registro). Avaliador de alerta: ausente → severity "normal". Deterioração: ausente → status "normal". Serviço de sedação: ausente permanece `None` (correto). | OBSERVED |
| Dado inválido | O motor de formulários restringe (clamp) silenciosamente valores fora de faixa a um extremo válido em vez de rejeitar — converte um erro de integridade de dado detectado em um valor clínico plausível (contra `evaluation-status-semantics.md` §3.5). | OBSERVED |
| População | RASS validado em pacientes adultos de UTI; sem gating por idade na V1 → VAL-0006/VAL-0007, HAZ-0036. | INFERENCE |

## 4. Checagem de coerção-zero do HAZ-0005 (a partir da fonte)

**VIOLAÇÃO.** `domain_formularios.py:685-686` coage um estado de sedação não avaliado ao
normal numérico (0, "Alerta e calmo") e o persiste como uma submissão pontuada — exatamente
o mecanismo do HAZ-0005 (ausência renderizada como o valor tranquilizador). Violações
secundárias: severity-"normal" em ausente em `domain_pharmaco_delirium.py:289-304` e
`domain_piora_clinica.py:448-449`; clamping silencioso de valores inválidos
(`domain_formularios.py:687`). Caminho conforme: `assess_sedation_pure`
(`domain_sedacao.py:250-252`) rejeita inválido e preserva `None`.

## 5. Veredito

**REFINE** — a enumeração, os rótulos, as faixas de validação e os pontos de corte alinhados
ao PADIS são sólidos e importáveis como conceitos; a coerção ausente→0 do motor de
formulários e o clamping silencioso são REJEITADOS e devem ser substituídos por semântica de
evaluation-status (`not_evaluated` / `invalid`); o limite de faixa -3 e o mapeamento
+1→urgent precisam de ratificação clínica explícita; restrições em nível de BD são
necessárias.

**PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).**
