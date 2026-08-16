---
id: REV-NS-00
title: Revisão legada — instrumentos clínicos de neuro/sedação/ancilares (ciclo 1, Tarefa 1) — índice e método
label: PROPOSAL
statement: >
  Índice dos registros de revisão com rigor de intensivista para os instrumentos clínicos
  implementados no legado V1 além dos quatro escores agregados: GCS, RASS, NRS, BPS, lógica
  CAM-ICU/delirium, enumeração de gravidade SDRA, FOIS, enums de consciência (tipo AVDI/AVPU) e
  lógica do domínio de sedação/desmame. Todos os vereditos são PROPOSAL — AWAITING NAMED
  CLINICAL REVIEW (reviewer: rodaquino-OMNI).
provenance:
  source_repo: intensicare (legado V1, READ-ONLY mount em /Users/familia/intensicare)
  path_or_url: docs/05-clinical-safety/legacy-review/neuro-sedation-scores/
  commit_sha_or_version: legado fixado em 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79 (2026-08-15); SHA-256 por arquivo em docs/archive/legacy-provenance/legacy-pin-cycle-1.md
  section_or_lines: diretório inteiro
  date_collected: 2026-08-15
  collector: revisor forense de instrumentos legados de neuro/sedação (ciclo 1, Tarefa 1); revisor responsável rodaquino-OMNI
  transformation: >
    traduzido EN→pt-BR, tranche 4, GDEC-0008 item 8 (índice e resumo de método; a evidência
    por instrumento vive nos registros individuais)
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

# Revisão legada — instrumentos de neuro/sedação/ancilares (índice)

## 1. Escopo e método

OBSERVED: o repositório legado `/Users/familia/intensicare` foi revisado READ-ONLY no HEAD git
`1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79` (2026-08-15). Cada arquivo citado foi hasheado no
momento da leitura (`shasum -a 256`) e comparado com o manifesto de pin do ciclo-1
(`docs/archive/legacy-provenance/legacy-pin-cycle-1.md`). Todos os arquivos citados sob `src/`,
`_work/alerts/` e `docs/rules/` CORRESPONDERAM ao manifesto. Seis arquivos citados estão
**ausentes do manifesto** e são hash-notados no §4 abaixo, conforme a regra hash-and-note.

Cada registro segue a estrutura obrigatória: (1) conforme-implementado verbatim com
`path:line` e SHA-256; (2) instrumento publicado com citações primárias; (3) análise de
discrepância (completude/ordenação da enumeração, faixas, unidades, pontos de corte,
comportamento em dado ausente, aplicabilidade à população adulta conforme
`docs/02-users-and-workflows/g1-validation-backlog.md` VAL-0006/VAL-0007); (4) para o GCS, a
análise obrigatória de confundimento por sedação/intubação com "INPUT TO ADR"; (5) checagem de
coerção-zero do HAZ-0005 a partir da fonte; (6) veredito conforme
`docs/00-governance/legacy-import-policy.md` §4.

Ressalva de proveniência IMPORTANTE (OBSERVED): o catálogo de regras extraídas
(`docs/rules/clinical-scoring/` no repositório legado) documenta uma **base de código
predecessora mais antiga** (snapshots `ahlabs-trilhas` e `trilhas-frontend`) que **não está
montada** no repositório legado fixado (pinned). Onde um instrumento existe apenas nesse
catálogo (FOIS, o enum de SDRA, as regras de consciência de piora/sepse), a revisão fica
limitada ao catálogo como evidência secundária e isso é dito explicitamente. A camada de
serviço Python da V1 (`src/intensicare/`) é a fonte primária, diretamente verificada.

## 2. Registros

| Registro | Instrumento | Veredito de manchete (PROPOSAL) |
|---|---|---|
| `REV-NS-01-gcs.md` | Escala de Coma de Glasgow + consumidores a jusante, **incluindo a análise obrigatória de GCS sob sedação/intubação e INPUT TO ADR** | TRANSFORM |
| `REV-NS-02-rass.md` | RASS (Richmond Agitation-Sedation Scale) | REFINE |
| `REV-NS-03-nrs.md` | NRS dor 0-10 | REFINE |
| `REV-NS-04-bps.md` | BPS dor comportamental 3-12 | REFINE |
| `REV-NS-05-cam-icu.md` | Lógica CAM-ICU / delirium | REFINE (caminho de formulários REJECT) |
| `REV-NS-06-ards-severity.md` | Enumeração de gravidade SDRA/ARDS | SUPERSEDE |
| `REV-NS-07-fois.md` | FOIS (Functional Oral Intake Scale) | VALIDATE (fonte primária não montada) |
| `REV-NS-08-consciousness-enums.md` | Enums de consciência tipo AVDI, tratamento AVPU/ACVPU | TRANSFORM (um REJECT) |
| `REV-NS-09-sedation-weaning-domain.md` | Lógica do domínio de sedação/desmame e uso de instrumento em pathway | REFINE (REJECTs específicos) |

Todos os vereditos: **PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).**

## 3. Achados transversais (resumo; evidência nos registros)

1. **A coerção-zero do HAZ-0005 está viva na V1 para os instrumentos de neuro.** Escore GCS
   ausente pontua 0 no CNS do SOFA e na mentação do qSOFA ("ausente" é registrado, mas não
   elevado); RASS ausente é coagido a 0 = "Alerta e calmo" no motor de formulários clínicos;
   features ausentes do CAM-ICU assumem por padrão um rastreio negativo; escore AVPU ausente
   pontua 0 na consciência do MEWS/NEWS2.
2. **Nenhum tratamento de sedação/intubação para o GCS em lugar algum da V1** — nenhuma
   designação "T"/"NT", nenhum gating por RASS, nenhuma substituição verbal; apenas um
   placeholder comentado (`glasgow_intubated_block`). Ver REV-NS-01 §4 (INPUT TO ADR).
3. **Um módulo inteiro de alerta de sedação/delirium é código morto**: `domain_pharmaco_delirium.py`
   importa um pacote `maezo` inexistente; o próprio `pyproject.toml` do repositório legado
   documenta isso e exclui os testes. Seus avaliadores de RASS/CAM-ICU nunca rodam em produção.
4. **O catálogo predecessor documenta bugs graves de instrumento de dor** (faixas de dor grave
   inalcançáveis via um misparse no estilo `7 <= dor > 10`; uma comparação invertida de
   deterioração de consciência que dispara na melhora) — retidos aqui como REJECT-com-documentação
   para que não sejam repropostos.
5. **População**: todo instrumento deste cluster é validado para adultos. A V1 não faz gating
   por idade em lugar nenhum; isso mapeia para VAL-0006/VAL-0007 e HAZ-0036 (expansão de uso
   pretendido).

## 4. Adendo de hash — arquivos citados AUSENTES do manifesto do ciclo-1

OBSERVED, hasheados in loco em 2026-08-15 no HEAD legado `1dc1ea6…` (regra hash-and-note;
caminhos relativos a `/Users/familia/intensicare/`):

```text
716a9354b75face954281e215ee8f21d2d895cbab2ab2a31b159d561a2c4d800  pyproject.toml
b5f0371333331b8ee45d4e4355902fa9da14773282c375f8d1dd959ad659a627  docs/plan/_work/alerts/neuro-sedation.yaml
20f27aea93662d16276c988899a83018829095612f40fdaa40a3f761efe634a6  tests/test_domain_sedacao.py
33ac907a5922170769b2c6ad0582f69db1033f5b532682444407c609778053e2  tests/test_domain_formularios.py
ed463f369f95d1a2ecd1766b5f095b149f78815a35b0927cdb43d590b3465e13  tests/test_qsofa.py
95278fe50179a4f7904eacb256285472f51cf86ea3bfbf6c92a5890ab42610c7  tests/test_sofa.py
a971ffc31f3c9ffffd3cfe861fae82e4914433a1660cf200e622a4f98ae443b6  tests/test_mews.py
```

Todos os demais arquivos citados neste diretório correspondem exatamente aos hashes do
manifesto de pin (verificado em 2026-08-15).

## 5. Fronteira com workstreams concorrentes

A revisão profunda dos agregados MEWS/NEWS2/SOFA/qSOFA e a revisão de estrutura de pathway
pertencem a outros workstreams do ciclo-1. Este diretório cobre esses arquivos **apenas** como
consumidores de entradas de GCS/AVPU/RASS, e faz referência cruzada a eles por caminho em vez
de duplicar sua análise.
