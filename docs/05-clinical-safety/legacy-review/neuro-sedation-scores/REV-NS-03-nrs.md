---
id: REV-NS-03
title: Revisão legada — NRS (Numeric Rating Scale, dor 0-10)
label: PROPOSAL
statement: >
  A V1 valida a NRS 0-10 corretamente no serviço de sedação e usa as faixas publicadas de
  moderada/grave (4-6 / 7-10); o motor de formulários restringe (clamp) silenciosamente
  valores fora de faixa para dentro da faixa válida; o catálogo predecessor documenta uma
  faixa de dor grave inalcançável. Veredito: REFINE.
  PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).
provenance:
  source_repo: intensicare (legado V1, READ-ONLY)
  path_or_url: src/intensicare/services/domain_sedacao.py; src/intensicare/services/domain_formularios.py; src/intensicare/services/domain_respiratory.py
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
  hazards: [HAZ-0005]
  adrs: []
  tests: []
  pr: null
supersedes: null
superseded_by: null
---

> Traduzido EN→pt-BR em 2026-08-16 (GDEC-0008 item 8, tranche 4); original EN preservado no histórico git.

# REV-NS-03 — NRS (dor, 0-10)

## 1. Conforme implementado (OBSERVED, verbatim)

| Caminho | Linhas | SHA-256 | Manifesto |
|---|---|---|---|
| `src/intensicare/services/domain_sedacao.py` | 130-133, 258-260 | `f0be9ac1164b6e453e03d91fc36b66d5aa24b4db751f7010326d4307a9e17a13` | MATCH |
| `src/intensicare/schemas/sedacao.py` | 45 | `bd432d9a5b4144380eaed1c6518b10465612c95d9d7e33468053114e0e44992d` | MATCH |
| `src/intensicare/services/domain_formularios.py` | 787-795, 825-834 | `61db0316a942ce3c1310be15ff0411b3f5bbbd58754aa4f58b2912f0230499d3` | MATCH |
| `src/intensicare/services/domain_respiratory.py` | 813-824 | `51344a4db6e5e168e64a28ea371e308fc76d4291e3cbad8d91c93342414738b9` | MATCH |
| `docs/rules/clinical-scoring/RULE-CLINICAL-SCORING-015-…md` | arquivo inteiro | `2fa87c2961503fc76a1afadb9eace2b06d49e0bd248fb266310cbcdba527d2e9` | MATCH |
| `docs/rules/clinical-scoring/RULE-SEDACAO-001-…md` / `RULE-SEDACAO-002-…md` | arquivos inteiros | `c700d576905f0e8e344f98e8272b2ee6d48a7951ef5998d4daee74ce1e3d5560` / `8b99b8f2f18753264b4e6bdb360b358ea6f070a22054aa26a0b25ed6ef7cb0db` | MATCH |
| `docs/rules/clinical-scoring/RULE-PIORA-CLINICA-006-…md` | arquivo inteiro | `12773b3df82821d17e5ea49e1d31ad69a53813e856f2d8992048104a61109e5d` | MATCH |
| `docs/plan/_work/alerts/neuro-sedation.yaml` | bloco ALERT-NEUROSED-PAIN-08 | `b5f0371333331b8ee45d4e4355902fa9da14773282c375f8d1dd959ad659a627` | ABSENT (hash-notado) |
| `tests/test_domain_formularios.py` | 324-332 | ver README §4 | ABSENT (hash-notado) |

- Validador (`domain_sedacao.py:130-133`): `0 <= score <= 10`; violação levanta `ValueError`
  (`:258-260`). Schema `schemas/sedacao.py:45`: `ge=0, le=10`, anulável.
- Motor de formulários (`domain_formularios.py:789-795`): `nrs None → (None, None)`
  (honesto); um valor fornecido é **restringido (clamped)** — `max(0.0, min(10.0, nrs_val))`
  — de modo que NRS 20 → 10 ("dor_intensa") e -5 → 0 ("sem_dor"); asserido como esperado em
  `tests/test_domain_formularios.py:324-332`.
- Faixas de gravidade (`_nrs_severity`, `domain_formularios.py:825-834`): 0 sem_dor / 1-3
  dor_leve / 4-6 dor_moderada / 7-10 dor_intensa. Mesmas faixas ratificadas em
  `domain_respiratory.py:813-824` (RAT-CLINICAL-SCORING-05: grave 7-10, moderada 4-6,
  leve 1-3, nenhuma 0).
- Catálogo predecessor: validador 0-10 correto (RULE-CLINICAL-SCORING-015); faixas de
  alerta de sedação VISUAL 4-6 (moderada) / 7-10 (grave) em dois balanços hídricos
  consecutivos (RULE-SEDACAO-001/-002, verificado); **RULE-PIORA-CLINICA-006 documenta a
  faixa grave escrita como `7 <= dor > 10`, o que é insatisfazível dado o teto 0-10 — dor
  grave 7-10 pontuava "0" no critério de piora do predecessor (impacto avaliado como alto no
  catálogo).** O catálogo de planejamento da V1 (`neuro-sedation.yaml`,
  ALERT-NEUROSED-PAIN-08) nomeia e corrige explicitamente essa classe de misparse e
  restaura uma faixa urgente distinta para NRS ≥ 7.

## 2. Instrumento publicado (SOURCE)

- NRS-11 para intensidade de dor: escala numérica verbal de 11 pontos, 0 (sem dor) a 10 (pior
  dor imaginável); operacionalização padrão em faixas leve 1-3, moderada 4-6, grave 7-10
  (p. ex. Boonstra AM et al. Front Psychol. 2016;7:1466; uso de faixas endossado em Devlin JW
  et al., SCCM PADIS, Crit Care Med. 2018;46(9):e825-e873, que ancora a avaliação de dor de
  rotina em UTI por autorrelato quando o paciente consegue se comunicar).

## 3. Análise de discrepância

| Dimensão | Achado | Rótulo |
|---|---|---|
| Faixa | 0-10 inclusive em todo lugar — corresponde à NRS-11. | OBSERVED |
| Pontos de corte | 4-6 moderada / 7-10 grave correspondem às faixas publicadas; a confirmação de dois-balanços-consecutivos nas regras do predecessor é um filtro institucional de falso-positivo, dentro da faixa. | OBSERVED |
| Dado inválido | O motor de formulários converte entrada fora de faixa em um extremo válido em vez de rejeitar (`invalid` → valor plausível), diferente do serviço de sedação, que levanta exceção. Duas políticas inconsistentes para o mesmo instrumento em uma mesma base de código. | OBSERVED |
| Dado ausente | O motor de formulários retorna `(None, None)`; o serviço de sedação mantém `None`. Nenhum preenchimento-com-zero encontrado para a NRS. | OBSERVED |
| Seleção de instrumento | O motor de formulários assume `tipo` como "bps" por padrão (`domain_formularios.py:787`), de modo que um paciente apto para NRS cujo formulário omite `tipo` é silenciosamente pontuado na escala comportamental — um defeito de seleção de instrumento compartilhado com o REV-NS-04. | OBSERVED |
| População | Instrumento de autorrelato adulto; sem gating por idade (VAL-0006/0007). | INFERENCE |

## 4. Checagem de coerção-zero do HAZ-0005 (a partir da fonte)

**VIOLAÇÃO PARCIAL.** Nenhuma coerção ausente→0 para a NRS em si (ausente → `None`/(None,None)).
A violação é o clamp inválido→válido (`domain_formularios.py:793`): um valor fora de faixa
detectado — que `evaluation-status-semantics.md` §3.5 exige que apareça como `invalid` — é
silenciosamente normalizado, e NRS -5 se torna 0 "sem_dor", o que é exatamente uma coerção
de dado ruim para o valor sem-risco. A inalcançabilidade da faixa grave no predecessor
(RULE-PIORA-CLINICA-006) fez dor grave real pontuar "0" — a mesma classe de hazard, já
materializada uma vez.

## 5. Veredito

**REFINE** — faixa, faixas de gravidade e ancoragem em PADIS estão corretas e reaproveitáveis;
REJEITAR o clamp (substituir por status `invalid`), REJEITAR a seleção silenciosa de
instrumento com padrão-para-BPS, e carregar o misparse `7 <= dor > 10` do predecessor para a
suíte de testes negativos da V2 para que nunca possa ser reintroduzido.

**PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).**
