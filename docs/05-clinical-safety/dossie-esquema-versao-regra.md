---
doc_id: RULE-VERSAO-ESQUEMA-DIVERGENCIA
title: >
  Dossiê de ratificação — esquema de identidade de versão de regra:
  registro vivo `ruleId@ruleVersion` do alvo vs `algorithm_version`
  `<SCORE>-vM.m.p` do irmão (contexto forense MAJ-5)
status: PROPOSAL
label: PROPOSAL
owner: UNASSIGNED — VALIDATION REQUIRED
statement: >
  Duas convenções de identidade de versão de regra coexistem sem unificação:
  o registro vivo do alvo `ruleId@ruleVersion` (ex. RULE-NEWS2@0.2.0 —
  pinado no kernel, carimbado como `versaoRegra`, persistido dentro do JSONB
  `kernel_record`) e o esquema mandatório do irmão — coluna
  `algorithm_version` com formato `<SCORE>-vM.m.p` (NEWS2-v1.0.0,
  SOFA-v2.0.0). ORQ-5 acrescenta colunas SQL preservando o registro vivo; a
  unificação entre repositórios é decisão de autoridade, enfileirada aqui.
provenance:
  source_repo: intensicare-V2 (código + migração + prompt ORQ-5); intensicare (irmão — SOMENTE LEITURA, citado como intenção)
  path_or_url: docs/05-clinical-safety/dossie-esquema-versao-regra.md
  commit_sha_or_version: d7a49dddc3fc0473ba35860ef3ddecf31d0741ae (alvo); irmão lido na árvore de trabalho de 2026-09-19
  section_or_lines: >
    packages/kernel-clinico/src/news2.ts:52-54; packages/kernel-clinico/src/types.ts:204-206;
    apps/api/src/avaliacao.ts:272; packages/persistencia/src/migrations/0002_g7_integration.sql:21-41;
    [irmão] docs/plan/clinical/domains/early-warning-scores.md:300-319;
    orchestrators/PROMPT_ORQ-5_VERSION_DURABILITY.md:8,12,14,18,35
  date_collected: 2026-09-19
  collector: varredura de verdade documental ORQ-7 — especialistas de evidência somente-leitura + orquestrador do fluxo
  transformation: >
    citações verbatim; nenhuma correspondência entre esquemas inventada;
    unificação tratada como decisão pendente
  confidence: high
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  requirements: []
  hazards: []
  adrs: [ADR-0025]
  tests: []
  pr: null
supersedes: null
superseded_by: null
---

# Dossiê de ratificação — esquema de versão de regra (MAJ-5, contexto)

> Uma página. Registra as duas convenções com citações e enfileira a decisão
> de unificação para autoridade nomeada. Nenhuma renomeação, nenhuma
> correspondência entre esquemas é inventada aqui.

## 1. O esquema VIVO do alvo (OBSERVED)

Identidade = string `ruleId@ruleVersion`, ex. `RULE-NEWS2@0.2.0`:

- Pinos no kernel: `packages/kernel-clinico/src/news2.ts:52-54` —
  `export const NEWS2_RULE_ID = "RULE-NEWS2" as const;` e
  `export const NEWS2_RULE_VERSION = "0.2.0" as const;` (análogo em
  `gcs.ts:728,913`).
- Pino tipado: `packages/kernel-clinico/src/types.ts:204-206` —
  `readonly ruleId: "RULE-NEWS2";` / `readonly ruleVersion: "0.2.0";`
  ("Versão pinada da regra, conforme a spec (precursor 0.2.0; ADR-0025)").
- Carimbo na API: `apps/api/src/avaliacao.ts:272` —
  `versaoRegra: `${record.ruleId}@${record.ruleVersion}``.
- Persistência: `packages/persistencia/src/migrations/0002_g7_integration.sql:21-41`
  — `evaluation_records` guarda `result` (payload do contrato de API) e
  `kernel_record` (registro integral do kernel, replay determinístico) como
  JSONB; NÃO existem colunas SQL de identidade de regra — a identidade
  viaja só dentro do JSON. O observabilidade consome `ruleRef(ruleId,
  ruleVersion)`.

## 2. O esquema MANDATÓRIO do irmão (SOURCE)

`intensicare/docs/plan/clinical/domains/early-warning-scores.md:300-319` (§5,
"Score-versioning policy (`algorithm_version`, invariant #3)"):

> Mandated by CON-0068 (invariant #3, "DEVE ser implementado antes do
> primeiro paciente real"), CON-0129 / VIS-C-13 (100 % auditable), and
> CON-SEED-02 (data model must add the `algorithm_version` column to the
> `clinical_scores` table). **This is a hard prerequisite, not optional.**
>
> **Version string format.** `<SCORE>-v<MAJOR>.<MINOR>.<PATCH>` — e.g.
> `NEWS2-v1.0.0`, `MEWS-v1.0.0`, `qSOFA-v1.0.0`, `SOFA-v2.0.0`. […] **SOFA
> bumps to `v2.0.0`** because the P0 FiO2-fraction, vasopressor-unit, and
> renal/liver boundary fixes change the output for the same input.

Semântica de bump (linhas 312-316): MAJOR = qualquer mudança de
limiar/banda/unidade que altere o escore para entradas idênticas (exige
recompute + janela de dual-write); MINOR = entrada opcional nova sem mudar
saídas existentes; PATCH = correção não clínica. Imutabilidade (linha 319):
"Historical scores are immutable — a version bump never mutates an existing
`clinical_scores` row".

## 3. O que o fluxo ORQ-5 faz — e o que deliberadamente NÃO faz

`orchestrators/PROMPT_ORQ-5_VERSION_DURABILITY.md`:

- Acrescenta às `evaluation_records` as colunas `rule_id text not null` +
  `rule_versao text not null` (+ `rule_ref text` = `ruleId@ruleVersion`),
  escritas na MESMA inserção que persiste `kernel_record`; migração
  `0007_identidade_versao_regra.sql` com backfill a partir de
  `kernel_record->>'ruleId'` / `->>'ruleVersion'` e índice em
  `(rule_id, rule_versao)` (linhas 12 e 18).
- PRESERVA o registro vivo: "the sibling spec's `algorithm_version` column
  scheme (`<SCORE>-vM.m.p`) is **context, not authority** — the target's
  `RULE-NEWS2@0.2.0` registry is the live convention. Do not rename the
  versioning scheme." (linha 14) e "Do NOT copy the sibling's
  `<SCORE>-vM.m.p` format over the live `ruleId@ruleVersion` registry, and
  do not 'unify' them in this stream — that is a cross-repo decision (see
  ORQ-7's dossier list)." (linha 35).

## 4. Contexto forense (MAJ-5)

Auditoria forense de 2026-09-19, achado MAJ-5: nenhuma coluna de
`algorithm_version`; a identidade viaja só dentro do JSON `kernel_record`
(`0002_g7_integration.sql:24-37`, `avaliacao.ts:272`); a lição de ADR-0025
("persisted version does not identify the algorithm that ran") está
registrada, mas o remédio estrutural não estava construído — é o que as
colunas do ORQ-5 endereçam, sem tocar o esquema de nomeação.

## 5. O que NÃO está decidido aqui

Se — e como — os dois esquemas se unificam ou se correspondem. As convenções
não são trivialmente interoperáveis: o irmão conta MAJOR por mudança de
saída clínica com janela de dual-write; o alvo pina a versão do release da
spec (`RULE-NEWS2@0.2.0`, precursor 0.2.0, não assinado). Qualquer
correspondência (ex. `NEWS2-v1.0.0` ↔ `RULE-NEWS2@0.2.0`) seria invenção
deste dossiê — não é feita.

## 6. Default recomendado (PROPOSAL — pendente de ratificação)

PROPOSTA de default, para a autoridade rejeitar ou ratificar: manter o
registro vivo `ruleId@ruleVersion` do alvo como convenção operante — as
colunas do ORQ-5 o preservam e o tornam selecionável em SQL sem renomear
nada — e tratar o esquema `<SCORE>-vM.m.p` do irmão como material de
mapeamento entre repositórios, a definir por autoridade nomeada quando a
integração entre os repositórios for ratificada.

## 7. O que fecharia

Autoridade nomeada decide: unificar os esquemas, mantê-los distintos com
mapeamento documentado, ou rejeitar o esquema do irmão para o alvo — com
registro em docs/00-governance/registers/decision-register.md. A decisão
vincula também o fluxo ORQ-5 (cujas colunas já preservam o registro vivo em
qualquer cenário).
