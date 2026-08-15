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

## RISK-0008 — Janela de baseline perecível aberta e sem data de fechamento (pt-BR — conteúdo novo, 2026-08-15)

```yaml
id: RISK-0008
title: Janela de baseline perecível (VAL-0035/G2-VAL-0025) aberta e sem data de fechamento
status: OPEN
statement: >
  As quatro medidas de baseline pré-V2 (B1 carga de alarmes, B2
  interrupções, B3 fadiga, B4a tempo até reconhecimento observacional) ficam
  permanentemente irrecuperáveis assim que houver a primeira demonstração,
  treinamento ou piloto visível a clínicos em qualquer unidade candidata
  (protocolo-baselines-pereciveis.md §2, tabela de gatilho). K-10/G2-VAL-0025
  foi COMISSIONADO em GDEC-0007 (revisão clínica do ciclo 1) — isto ABRE a
  execução da captura — mas não fecha a janela nem agenda a captura:
  OBSERVADO em 2026-08-15, nenhum sítio foi contatado, nenhum participante
  recrutado, nenhuma medição realizada. Nenhuma data de fechamento da janela
  existe hoje.
impact: >
  Se a janela fechar antes da captura, as métricas SM-01 (tempo até
  reconhecimento), SM-04, HM-02 (fadiga de alarme) e HM-05 tornam-se
  permanentemente inavaliáveis — nenhuma alegação futura de melhoria ou de
  não-piora poderá ser sustentada ou refutada, e essa perda é definitiva
  (protocolo-baselines-pereciveis.md §1).
likelihood: medium-high — depende inteiramente de quando ocorrer a primeira
  demonstração/treinamento/piloto, evento que este risco não controla nem
  agenda.
gate_relevance: [G1, G2]
owner: UNASSIGNED — VALIDATION REQUIRED
links:
  evidence: []
  blockers: [BLK-0013]
provenance:
  source_repo: intensicare-V2
  path_or_url: docs/02-users-and-workflows/g1-kit/protocolo-baselines-pereciveis.md
  commit_sha_or_version: n/a (criado nesta sessão, não commitado)
  section_or_lines: "§1 (por que é irrecuperável), §2 (gatilho de perecibilidade)"
  date_collected: "2026-08-15"
  collector: governance-and-traceability steward (transcrição de achado do líder de pesquisa contextual de UTI, ciclo 2)
  transformation: "resumido do protocolo autocontido de baselines perecíveis; risco derivado (INFERENCE) do comissionamento K-10/G2-VAL-0025 em GDEC-0007 não implicar fechamento automático da janela"
  confidence: high
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: "VALIDAÇÃO NECESSÁRIA — nenhuma data de fechamento definida; depende de BLK-0013 (cobertura jurídica/ética) ser resolvido antes que a captura possa sequer começar"
```

## RISK-0009 — Frescor: canal AMH em lote × janela de 1h do NEWS2 (pt-BR — conteúdo novo, 2026-08-15)

```yaml
id: RISK-0009
title: Frescor — canal FHIR da AMH em lote pode ainda render stale/not_evaluated sob a janela de 1h do NEWS2
status: OPEN
statement: >
  Mesmo que um feed de sinais vitais da AMH seja construído e declarado
  conforme (decisão C-1), o canal FHIR da AMH é atualizado em lote — "o
  Bronze é atualizado em batch, então o canal FHIR não é near-real-time
  enquanto o CDC estiver parqueado" (ADR-040, citado em
  pacote-decisao-c1-sinais-vitais.md §2.5). RULE-NEWS2 exige frescor
  por insumo dentro de uma janela declarada; um canal em lote pode ainda
  assim produzir `stale`/`not_evaluated` sob essa janela, mesmo com a fonte
  populada e o profile corrigido.
impact: >
  Resolver C-1 (existência de profile e fonte populada) não implica que o
  NEWS2 avalie `valid` na prática — a regra pode permanecer
  `not_evaluated`/`stale` por descompasso de frescor entre o canal em lote e
  a janela clínica de 1h, mesmo depois de todo o investimento de engenharia
  em profile e fonte. Isto é um constrangimento adicional a RISK-0003, não
  substituído por ele.
likelihood: high — o silêncio do ADR-040 sobre vitais não confirma nem nega a
  intenção, mas a característica em lote do canal é diretamente documentada.
gate_relevance: [G2, G3]
owner: UNASSIGNED — VALIDATION REQUIRED
links:
  evidence: []
  blockers: []
provenance:
  source_repo: Omni-Saude/amh-data-platform (evidência lida) / intensicare-V2 (registro)
  path_or_url: docs/08-interoperability/amh-data/vital-signs-decision/pacote-decisao-c1-sinais-vitais.md
  commit_sha_or_version: "0a07a6f1fab36fb2f5eeee0fcd8e945c95f67116 (evidência AMH); registro V2 não commitado"
  section_or_lines: "§2.5 (o que o ADR-040 diz — canal em lote, L62-63)"
  date_collected: "2026-08-15"
  collector: governance-and-traceability steward (transcrição de achado do especialista de decisão de sinais vitais)
  transformation: "risco derivado (INFERENCE) da leitura direta do ADR-040 combinada com a janela de frescor de 1h já especificada em RULE-NEWS2"
  confidence: high
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: "VALIDAÇÃO NECESSÁRIA — não medido; exige ambiente com dado real e canal construído, que hoje não existem"
```

## RISK-0010 — Fronteira/grão decididos por omissão se ADR-0001/0003/0005 estagnarem (pt-BR — conteúdo novo, 2026-08-15)

```yaml
id: RISK-0010
title: Fronteira AMH×V2 e grão de tenant decididos por omissão se ADR-0001/0003/0005 permanecerem `proposed`
status: OPEN
statement: >
  ADR-0001 §6.2 registra: "An unresolved boundary is a standing ambiguity
  that implementation pressure will try to resolve by default — the first
  team that needs a database will create one, and that choice will look
  like an answer to this ADR without having been decided." ADR-0003 §6.2
  registra a mesma dinâmica para o grão de tenant: "o primeiro armazenamento
  (G7) resolveria o grão por omissão se este ADR estagnar." Nenhum dos dois
  ADRs foi aceito; ambos permanecem `proposed`.
impact: >
  Se a implementação avançar antes da aceitação formal, a primeira decisão
  de armazenamento fixaria de fato a fronteira AMH×V2 e/ou o grão de
  isolamento por tenant, sem que nenhuma autoridade nomeada tenha
  deliberado sobre as alternativas já enumeradas nesses ADRs — uma decisão
  por omissão que parecerá uma resposta ratificada sem o ser.
likelihood: medium — depende da pressão de cronograma de implementação
  superar a aceitação formal dos ADRs.
gate_relevance: [G3, G7]
owner: UNASSIGNED — VALIDATION REQUIRED
links:
  evidence: []
  blockers: []
provenance:
  source_repo: intensicare-V2
  path_or_url: "docs/06-architecture/adrs/ADR-0001-amh-platform-boundary.md; docs/06-architecture/adrs/ADR-0003-tenancy-organizacao-facility-propriedade-de-recurso.md"
  commit_sha_or_version: n/a (working tree, branch cycle-1/clinical-content)
  section_or_lines: "ADR-0001 §6.2 (Negative); ADR-0003 §6.2 (Negativas)"
  date_collected: "2026-08-15"
  collector: governance-and-traceability steward
  transformation: "risco transcrito quase verbatim (SOURCE) de ambos os ADRs, consolidado em uma única entrada de registro"
  confidence: high
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: "VALIDAÇÃO NECESSÁRIA — mitigação depende da aceitação formal de ADR-0001 e ADR-0003 por AUTH-DATA-PLATFORM antes do Gate G7"
```

## RISK-0011 — THR-0080 sem barreira preventiva na V2, agravada por concentração de autoridade (pt-BR — conteúdo novo, ciclo 2, 2026-08-15)

```yaml
id: RISK-0011
title: THR-0080 (contaminação cross-PJ a montante) é a única ameaça do modelo sem barreira preventiva na V2
status: OPEN
statement: >
  THR-0080 (par falso-positivo no índice cross-PJ do ADR-043 atribui fatos
  clínicos ao paciente errado, sem que a V2 tenha como detectar) é a única
  ameaça de todo o modelo de ameaças cujo controle **preventivo** não
  pertence à V2 nem à OMNI-como-fornecedora de software: a barreira
  preventiva pertence à governança do índice cross-PJ, do lado AMH, e ao
  parecer jurídico da OS-16 — hoje `AUTH-AMH-OWNER` e `AUTH-PRIVACY-LEGAL`,
  ambos UNASSIGNED. O único movimento disponível à V2 é detecção
  compensatória parcial (SEC-0057, PROPOSAL), que não previne o dano e cuja
  taxa de falso-positivo é desconhecida e não medida. Este risco é agravado
  por R-a7 (concentração de autoridade, minuta-parecer-os-16.md §3.6): a
  mesma pessoa (rodaquino-OMNI) decide pelos dois lados do contrato
  AMH×IntensiCare, o que remove o atrito controlador↔controlador que
  normalmente funciona como controle entre controladores distintos —
  tornando a nomeação explícita de um dono humano para este risco específico
  mais necessária, não menos.
impact: >
  Se o índice cross-PJ entrar em operação e a resolução de identidade a
  montante passar a depender dele, um par falso-positivo produz história
  clínica de duas pessoas fundida numa só: escore computado sobre valores de
  dois pacientes, alerta emitido sobre o paciente errado, ausência de alerta
  para quem precisava, e evento de privacidade cross-PJ simultâneo. A
  contaminação persiste, porque nada na V2 a contradiz e o registro
  contaminado passa a ser a linha de base contra a qual toda leitura
  seguinte é julgada (HAZ-0045). Sem dono humano nomeado, nenhuma decisão de
  operar com o índice ligado tem accountability explícita — e a
  concentração de autoridade (RISK-0007) significa que, sem esta nomeação
  específica, a mesma pessoa que decide ligar o índice é também quem
  arbitraria, dos dois lados, qualquer disputa sobre um par
  falso-positivo já ocorrido.
likelihood: unknown — condicionada a três pré-condições ainda não satisfeitas
  (índice cross-PJ em operação; resolução a montante dependente dele; um par
  falso-positivo aceito); a taxa de falso-positivo do limiar de
  correspondência não está medida em nenhum documento lido.
gate_relevance: [G0, G3, G6]
owner: UNASSIGNED — VALIDATION REQUIRED
links:
  evidence: []
  blockers: [BLK-0017]
provenance:
  source_repo: intensicare-V2
  path_or_url: "docs/11-security-privacy-compliance/threat-model.md; docs/11-security-privacy-compliance/lgpd-os16/minuta-parecer-os-16.md; docs/05-clinical-safety/hazard-log.md"
  commit_sha_or_version: "working tree não commitado sobre cycle-1/clinical-content @ 3530295 (threat-model.md, minuta-parecer-os-16.md, hazard-log.md modificados por sessão paralela nesta mesma janela)"
  section_or_lines: "threat-model.md §12.3.4 ('Declaração de propriedade do controle') e §12.3.3 THR-0080; minuta-parecer-os-16.md §3.6 R-a5/R-a7; hazard-log.md HAZ-0045"
  date_collected: "2026-08-15"
  collector: governance-and-traceability steward (ciclo 2 — consolidação de três fontes independentes já registradas, nenhuma medição nova)
  transformation: "risco derivado (INFERENCE) da leitura direta de THR-0080 §12.3.4 combinada com R-a7 da minuta LGPD e com HAZ-0045 do hazard-log; nenhuma das três fontes está no write scope deste steward"
  confidence: high
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: "VALIDAÇÃO NECESSÁRIA — exige dono humano nomeado antes de qualquer operação com o índice cross-PJ ligado (threat-model.md §12.8 item 15); nenhum gatilho de nomeação existe hoje"
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
| RISK-0008 | Janela de baseline perecível aberta e sem data de fechamento | OPEN | G1, G2 | UNASSIGNED |
| RISK-0009 | Frescor — canal AMH em lote × janela de 1h do NEWS2 | OPEN | G2, G3 | UNASSIGNED |
| RISK-0010 | Fronteira/grão decididos por omissão se ADR-0001/0003/0005 estagnarem | OPEN | G3, G7 | UNASSIGNED |
| RISK-0011 | THR-0080 sem barreira preventiva na V2, agravada por concentração de autoridade (R-a7) | OPEN | G0, G3, G6 | UNASSIGNED |
