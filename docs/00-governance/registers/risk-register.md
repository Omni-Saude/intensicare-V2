---
doc_id: GOV-RISK-REGISTER
status: OPEN
owner: UNASSIGNED — VALIDATION REQUIRED
source: format per ../evidence-notation.md; RISK prefix per INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §8
last_updated: 2026-08-15
---

# Risk Register

`RISK` is a prompt-defined stable-ID prefix
(`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:538`, "delivery/business risk"). This
register does not accept any risk — acceptance is a human decision
(`../decision-rights.md` §1) and is explicitly prohibited for this task
(`decisions_prohibited: accepting any risk`). Every entry is `status: OPEN`
until a named human authority accepts, mitigates, or transfers it.

## Entry template

```yaml
id: RISK-NNNN
title: <short title>
status: OPEN | MITIGATING | ACCEPTED | TRANSFERRED | CLOSED
statement: >
  <the risk>
impact: <what happens if it materializes>
likelihood: low | medium | high | unknown
gate_relevance: [G0, G1, ...]
owner: UNASSIGNED — VALIDATION REQUIRED
links:
  evidence: []
  blockers: []
provenance: { ... per evidence-notation.md §3 }
```

## RISK-0001 — No named human decision owners

```yaml
id: RISK-0001
title: No named human decision owners for product, clinical safety, security, privacy/legal, data-platform, UX, or operations
status: MATERIALMENTE MITIGADO (2026-08-15)
statement: >
  As of 2026-08-14, every AUTH-* role in ../authority-model.md is
  UNASSIGNED — VALIDATION REQUIRED. No human has been named for product,
  clinical safety, security, privacy/legal, data-platform, UX, or operations
  decisions, and no intended-use approver exists.
impact: >
  Gate G0 (authority and access) cannot close. No clinical, safety, security,
  privacy, or operational decision can be DECIDED (only PROPOSAL). All
  downstream phases (SPARK discovery, pathway portfolio, AMH contracts,
  architecture) are blocked from producing binding decisions, though
  evidence-gathering and drafting may continue.
likelihood: high (currently certain — directly observed)
gate_relevance: [G0]
owner: UNASSIGNED — VALIDATION REQUIRED
links:
  evidence: []
  blockers: [BLK-0001, BLK-0002, BLK-0003, BLK-0004, BLK-0005, BLK-0006, BLK-0007, BLK-0008]
provenance:
  source_repo: intensicare-V2
  path_or_url: INTENSICARE_V2_ORCHESTRATOR_PROMPT.md
  commit_sha_or_version: n/a (prompt text)
  section_or_lines: "INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:239-249 (Gate G0)"
  date_collected: 2026-08-14
  collector: governance-and-traceability bootstrap steward
  transformation: none
  confidence: high
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
```

**Atualização (2026-08-15, pt-BR — conteúdo novo):** `rodaquino-OMNI` aceitou,
por decisão nomeada e datada, sete dos oito papéis `AUTH-*` referidos acima
(`AUTH-PRODUCT`, `AUTH-SECURITY` com escopo, `AUTH-DATA-PLATFORM`, `AUTH-UX`
com restrição, `AUTH-OPERATIONS`, e — com resolução apenas **parcial** —
`AUTH-CLINSAFETY`/`AUTH-INTENDED-USE` via `GDEC-0003`), além de declarar
autoridade do lado AMH (`DEC-G0-04`). `AUTH-PRIVACY-LEGAL` foi
**reclassificado**, não resolvido: nenhum titular jurídico existe, e o
trabalho prossegue apenas com dados sintéticos até ratificação (Gates
G6/G8). Ver `g0-resolucoes-2026-08-15.md` e `decision-register.md`
`GDEC-0003`/`GDEC-0004`. **Este risco não está `CLOSED`:** ele está
rebaixado de "nenhum titular" para "titular único concentrado" — ver o novo
`RISK-0007` (risco de concentração de autoridade) abaixo, que registra a
consequência direta desta mitigação. Reclassificação formal para
`MITIGATING` ou `ACCEPTED` é `VALIDAÇÃO NECESSÁRIA` pelo titular.

**Nota (2026-08-15, pt-BR — conteúdo novo):** `BLK-0010` foi RESOLVIDO POR
CONCESSÃO ESCRITA do titular (`rodaquino-OMNI`, DEC-G0-08 — ver
`decision-register.md` `GDEC-0004`), que autoriza a V2 a ler o repositório
AMH em commits pinados e a derivar contratos a partir dele. Isto mitiga a
**autoridade de reuso**; **não** substitui um SPDX/licença formal publicada
no repositório AMH — o achado `NOASSERTION` (`EVID-0008`) permanece
tecnicamente verdadeiro. Este risco permanece `OPEN`, rebaixado na prática
pela concessão escrita; reclassificação formal (`MITIGATING`) é
`VALIDAÇÃO NECESSÁRIA` pelo titular ou por `AUTH-DATA-PLATFORM`.

## RISK-0002 — AMH repository license NOASSERTION

```yaml
id: RISK-0002
title: AMH repository license unestablished (GitHub API reports NOASSERTION)
status: OPEN
statement: >
  The AMH repository (Omni-Saude/amh-data-platform) license is reported by
  the GitHub API as NOASSERTION — no SPDX license detected. License/IP
  authority for any reuse of AMH artifacts (schemas, contracts, profiles,
  code, or documentation content) is therefore unestablished.
impact: >
  Any import or reuse of AMH-sourced material (per ../legacy-import-policy.md
  §3.1) is blocked until license/ownership is clarified by AMH's owning
  organization. This affects Gate G0 ("AMH license/ownership ... are
  recorded"), Gate G3 (AMH compatibility), and any contract-package draft
  that would embed AMH schema/interface material.
likelihood: high (currently certain — directly observed)
gate_relevance: [G0, G3]
owner: UNASSIGNED — VALIDATION REQUIRED
links:
  evidence: [EVID-0008]
  blockers: [BLK-0010]
provenance:
  source_repo: Omni-Saude/amh-data-platform
  path_or_url: GitHub REST API repository license field
  commit_sha_or_version: 0a07a6f1fab36fb2f5eeee0fcd8e945c95f67116
  section_or_lines: n/a (repository metadata)
  date_collected: 2026-08-14
  collector: orchestrator
  transformation: none
  confidence: high
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
```

## RISK-0003 — AMH laboratory Observation blocked / no vital-sign feed

```yaml
id: RISK-0003
title: AMH FHIR Observation is laboratory-only and blocked; no vital-sign feed exists
status: OPEN
statement: >
  AMH's only Observation profile is Observation-amh-laboratory (subject,
  effective time, laboratory category, laboratory LOINC binding, UCUM). It is
  not a general vital-signs profile. The laboratory Observation source
  request further reports the Tasy PACIENTE_EXAME source had zero rows and
  the preferred structured Diagnose/LIS source was not ingested, so the
  profile's existence does not imply populated or clinically usable
  observations. AMH diagrams claim EVOLUCAO_PACIENTE may produce vital-sign
  Observations, but no corresponding vital-sign profile or demonstrated
  populated source was found — a contradiction requiring AMH owner
  resolution, not an inference that ICU vitals are available.
impact: >
  This is a portfolio constraint: any IntensiCare V2 clinical pathway that
  depends on real-time or near-real-time vital signs sourced from AMH cannot
  currently be supported. Pathway portfolio selection (Gate G2) and the
  AMH pathway-to-source eligibility matrix (Gate G3) must treat vital-sign
  ingestion as unavailable until AMH demonstrates a populated, conformant
  source.
likelihood: high (currently certain — directly documented in AMH's own repository)
gate_relevance: [G2, G3]
owner: UNASSIGNED — VALIDATION REQUIRED
links:
  evidence: []
  blockers: []
provenance:
  source_repo: Omni-Saude/amh-data-platform
  path_or_url: "schemas/fhir-profiles/README.md; schemas/fhir-profiles/Observation-amh-laboratory-profile.json; docs/reference/fhir-observation-source-request.md; architecture/diagrams/data-flows/data-flow-fhir-clinical.md; architecture/diagrams/c4-component/c4-component-fhir-pipeline.md"
  commit_sha_or_version: 0a07a6f1fab36fb2f5eeee0fcd8e945c95f67116
  section_or_lines: "INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:96-98 (points 4-6)"
  date_collected: 2026-08-14
  collector: orchestrator
  transformation: summarized from prompt §2 points 4-6
  confidence: high
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
```

## RISK-0004 — Only dev environment provisioned in AMH

```yaml
id: RISK-0004
title: AMH has only a dev environment provisioned; stg/prod/dr do not exist
status: OPEN
statement: >
  AMH's README states only `dev` is provisioned; `stg`, `prod`, and `dr` are
  not. Its SAD is still draft and its stated targets are not measured
  production SLAs.
impact: >
  No AMH environment currently supports a production-representative
  integration test, load test, or DR exercise. Any V2 compatibility claim
  based on AMH dev-environment behavior cannot be generalized to production
  readiness. This constrains Gate G3 (AMH compatibility) and Gate G8
  (pilot/production promotion) evidence.
likelihood: high (currently certain — directly documented in AMH's own repository)
gate_relevance: [G3, G8]
owner: UNASSIGNED — VALIDATION REQUIRED
links:
  evidence: []
  blockers: []
provenance:
  source_repo: Omni-Saude/amh-data-platform
  path_or_url: README.md
  commit_sha_or_version: 0a07a6f1fab36fb2f5eeee0fcd8e945c95f67116
  section_or_lines: "INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:93 (point 1)"
  date_collected: 2026-08-14
  collector: orchestrator
  transformation: summarized from prompt §2 point 1
  confidence: high
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
```

## RISK-0005 — Single Security Gate required check on AMH `main`

```yaml
id: RISK-0005
title: AMH main branch protection requires only a single Security Gate check
status: OPEN
statement: >
  GitHub metadata observed through the connector shows AMH's `main` branch is
  protected but only `Security Gate` is a required status check; the README
  describes additional non-blocking or not-yet-run checks. A green `main` is
  therefore not evidence of V2 compatibility, safety, data-quality, or
  release readiness.
impact: >
  Any assumption that AMH `main` being green implies broader quality
  (data-quality, safety, compatibility) is unfounded. V2 must independently
  test and evidence any property it depends on rather than trusting AMH CI
  status as a proxy.
likelihood: high (currently certain — directly observed via GitHub metadata)
gate_relevance: [G3]
owner: UNASSIGNED — VALIDATION REQUIRED
links:
  evidence: []
  blockers: []
provenance:
  source_repo: Omni-Saude/amh-data-platform
  path_or_url: GitHub branch protection API (main)
  commit_sha_or_version: 0a07a6f1fab36fb2f5eeee0fcd8e945c95f67116
  section_or_lines: "INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:106 (point 14)"
  date_collected: 2026-08-14
  collector: orchestrator
  transformation: summarized from prompt §2 point 14
  confidence: high
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
```

## RISK-0006 — No automated traceability/PR-linking enforcement yet

```yaml
id: RISK-0006
title: Traceability policy is defined but not yet CI-enforced
status: OPEN
statement: >
  ../traceability-policy.md defines a PR-linking requirement and a
  bidirectional-linking policy, but no CI check or reverse-index generator
  exists yet (prompt §19's documentation/requirements/hazard/test
  traceability graph is a required diagram not yet built). Until built,
  compliance depends on manual reviewer discipline and is subject to drift.
impact: >
  Traceability completeness (a required release-evidence input per prompt
  §17) cannot yet be mechanically verified. This is a process risk to
  release-evidence quality, not a clinical or security risk directly.
likelihood: medium
gate_relevance: [G7, G8]
owner: UNASSIGNED — VALIDATION REQUIRED
links:
  evidence: []
  blockers: []
provenance:
  source_repo: intensicare-V2
  path_or_url: docs/00-governance/traceability-policy.md
  commit_sha_or_version: n/a (created this session, uncommitted)
  section_or_lines: "traceability-policy.md §4-5"
  date_collected: 2026-08-14
  collector: governance-and-traceability bootstrap steward
  transformation: self-identified process risk (INFERENCE), not from prompt text
  confidence: medium
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
```

## RISK-0007 — Risco de concentração de autoridade (pt-BR — conteúdo novo, 2026-08-15)

```yaml
id: RISK-0007
title: Concentração de autoridade — um único humano detém a maioria dos papéis AUTH-*
status: OPEN
statement: >
  Em 2026-08-15, rodaquino-OMNI (CEO e acionista principal de OMNI e AMH,
  médico intensivista) aceitou, por decisão nomeada, os papéis
  AUTH-PRODUCT, AUTH-SECURITY (escopo de projeto), AUTH-DATA-PLATFORM +
  autoridade AMH, AUTH-UX (com restrição), AUTH-OPERATIONS, e — em
  resolução parcial — AUTH-CLINSAFETY/AUTH-INTENDED-USE (GDEC-0003). Isto é
  aproximadamente sete papéis de decisão AUTH-* concentrados em uma única
  pessoa, que é também proprietária/acionista principal de ambas as
  organizações (V2 e AMH) cujos interesses o contrato AMH×IntensiCare deve
  arbitrar de forma independente.
impact: >
  Resolve a lacuna "nenhum titular nomeado" (RISK-0001), mas troca-a por um
  risco de ponto único de decisão e por um conflito de interesse estrutural
  na adjudicação AMH×IntensiCare (o mesmo titular decide dos dois lados de
  um contrato entre as duas empresas que possui — ver DEC-G0-04 e
  adjudicacao-decisoes-2026-08-15.md). Os pares de independência do prompt
  §4 (implementador ≠ verificador) continuam vinculantes nos portões de
  verificação (G1, G6, G8) e não são satisfeitos pela mesma pessoa em ambos
  os lados de um par — isto restringe, mas não elimina, o risco: a
  concentração na camada de *titularidade de decisão* permanece, mesmo
  quando a *verificação* de um item específico é delegada a terceiro
  (ex.: BLK-0003/DEC-G0-02, verificador de intrusão independente no G6).
likelihood: high (currently certain — directly observed as a consequence of today's resolutions)
gate_relevance: [G0, G1, G3, G6, G8]
owner: UNASSIGNED — VALIDATION REQUIRED
links:
  evidence: []
  blockers: [BLK-0001, BLK-0003, BLK-0004, BLK-0005, BLK-0006, BLK-0007, BLK-0009, BLK-0010]
provenance:
  source_repo: intensicare-V2
  path_or_url: docs/00-governance/registers/g0-resolucoes-2026-08-15.md
  commit_sha_or_version: n/a (criado nesta sessão, não commitado)
  section_or_lines: "Fundamento do modelo adotado (preâmbulo); DEC-G0-01, 02, 04, 05, 06"
  date_collected: "2026-08-15"
  collector: governance-and-traceability bootstrap steward (risco identificado por instrução de integração; fundamento textual no documento-fonte)
  transformation: "risco derivado (INFERENCE) a partir de nove decisões individuais registradas no documento-fonte, não uma citação única"
  confidence: high
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: "VALIDAÇÃO NECESSÁRIA — gatilhos de revisão individuais já registrados por papel (ver cada DEC-G0-nn em g0-resolucoes-2026-08-15.md); nenhum gatilho consolidado de \"segunda pessoa\" existe ainda para a concentração como um todo"
```

## Index

| ID | Title | Status | Gate relevance | Owner |
|---|---|---|---|---|
| RISK-0001 | No named human decision owners | MATERIALMENTE MITIGADO (2026-08-15) | G0 | UNASSIGNED |
| RISK-0002 | AMH license NOASSERTION | OPEN (nota 2026-08-15) | G0, G3 | UNASSIGNED |
| RISK-0003 | AMH laboratory Observation blocked / no vital-sign feed | OPEN | G2, G3 | UNASSIGNED |
| RISK-0004 | Only dev environment provisioned in AMH | OPEN | G3, G8 | UNASSIGNED |
| RISK-0005 | Single Security Gate required check on AMH `main` | OPEN | G3 | UNASSIGNED |
| RISK-0006 | No automated traceability/PR-linking enforcement yet | OPEN | G7, G8 | UNASSIGNED |
| RISK-0007 | Concentração de autoridade (um titular, ~7 papéis AUTH-*) | OPEN | G0, G1, G3, G6, G8 | UNASSIGNED |
