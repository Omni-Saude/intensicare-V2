---
doc_id: GOV-DECISION-REGISTER
status: OPEN
owner: UNASSIGNED — VALIDATION REQUIRED
source: format per ../evidence-notation.md; ID scheme per ../traceability-policy.md
last_updated: 2026-08-15
---

# Decision Register

This register is the durable home for every governance decision — both
pending PROPOSALs and, once a named human authority accepts them, DECIDED
entries. No agent may write a `DECIDED` row; only a named human authority may
(`../evidence-notation.md` §2, rule 3; §4). This governance-steward task is
explicitly prohibited from approving any policy — every entry created in this
session is therefore `status: PROPOSAL`.

## Entry template

```yaml
id: GDEC-NNNN
title: <short title>
status: PROPOSAL | DECIDED | REJECTED | SUPERSEDED
statement: >
  <what is being decided>
decided_by: <named human authority, or UNASSIGNED — VALIDATION REQUIRED>
decided_date: <YYYY-MM-DD, or n/a while PROPOSAL>
rationale: >
  <why, required once DECIDED>
supersession_rule: >
  <what would trigger revisiting this, required once DECIDED>
links:
  requirements: []
  hazards: []
  adrs: []
provenance:
  source_repo: intensicare-V2
  path_or_url: <path>
  commit_sha_or_version: <sha>
  section_or_lines: <ref>
  date_collected: <YYYY-MM-DD>
  collector: <name/role>
  transformation: none
  confidence: low | medium | high
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED | VALIDATED | N/A
```

## GDEC-0001 — Use of `cycle-0/spark-foundation` branch and `docs/` hierarchy

```yaml
id: GDEC-0001
title: Adopt cycle-0/spark-foundation as the Phase 0 work branch and docs/ as the canonical documentation hierarchy
status: PROPOSAL
statement: >
  Propose that IntensiCare V2 Phase 0 (Authority/access/bootstrap) work
  proceeds on branch `cycle-0/spark-foundation`, and that the documentation
  hierarchy under `docs/` follows exactly the structure specified in
  INTENSICARE_V2_ORCHESTRATOR_PROMPT.md section 16 (00-governance through
  16-validation-backlog, plus archive/legacy-provenance), adaptable only
  through a future ADR. This governance-steward task has created
  docs/00-governance/ per that structure as the first instance of it.
decided_by: UNASSIGNED — VALIDATION REQUIRED
decided_date: n/a
rationale: >
  n/a — not yet decided. Rationale to be supplied by the named authority who
  accepts or rejects this proposal.
supersession_rule: >
  n/a — not yet decided. To be defined at acceptance (a candidate trigger,
  not yet agreed: any structural change to the docs/ hierarchy must be
  proposed as an ADR under docs/06-architecture/adrs/, not made ad hoc).
links:
  requirements: []
  hazards: []
  adrs: []
provenance:
  source_repo: intensicare-V2
  path_or_url: INTENSICARE_V2_ORCHESTRATOR_PROMPT.md
  commit_sha_or_version: n/a (prompt text, not a pinned artifact; repo commit cb35521 at time of writing)
  section_or_lines: "INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:902-950 (§16 Documentation architecture)"
  date_collected: 2026-08-14
  collector: governance-and-traceability bootstrap steward
  transformation: none — structure taken verbatim from prompt §16
  confidence: high
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
```

## GDEC-0002 — Taxonomy-extension ratification needed

```yaml
id: GDEC-0002
title: Ratify or reject the proposed ID-prefix extensions to traceability-policy.md §1
status: PROPOSAL
statement: >
  Multiple specialists have minted ID prefixes beyond the 17-prefix taxonomy
  in ../traceability-policy.md §1 (which already documents this steward's own
  EVID/ASM/GDEC/BLK extensions): THR (threat-model.md, THR-0001..0067), CRV
  (clinical-reference-vector-standard.md), QAS (quality-attribute-scenarios.md,
  document-local, QAS-0001..0029), IDP/IDN (identity-adjudication/, non-
  conformant ID formats), and document-local NIU/SM/HM/WF/UR labels
  (01-vision-and-intended-use/, 02-users-and-workflows/). SEC-catalog usage
  (security-controls-catalog.md, SEC-0001..0050) was checked and found
  consistent with the already-ratified SEC prefix — no action needed there.
  A VAL-numbering collision risk was also flagged: VAL-0001..0043 is minted
  concurrently in 01-vision-and-intended-use/02-users-and-workflows and in
  05-clinical-safety/pathway-portfolio/, with no central VAL register to
  coordinate the next-available number. Full detail:
  ../traceability-policy.md §1.1. This decision proposes that a named human
  authority either (a) ratify each extension into §1 as a permanent prefix,
  (b) direct conversion of a prefix's content into an existing ratified
  prefix (e.g. QAS -> NFR, per Option A recorded there), or (c) reject a
  prefix and direct its minting document to be reworked. No option is
  selected here.
decided_by: UNASSIGNED — VALIDATION REQUIRED
decided_date: n/a
rationale: >
  n/a — not yet decided. Rationale to be supplied by the named authority who
  accepts, rejects, or partially accepts this proposal per prefix.
supersession_rule: >
  n/a — not yet decided. Candidate trigger (not yet agreed): any further
  undocumented prefix discovered after this decision should reopen it rather
  than start a parallel GDEC entry.
links:
  requirements: []
  hazards: []
  adrs: []
provenance:
  source_repo: intensicare-V2
  path_or_url: docs/00-governance/traceability-policy.md
  commit_sha_or_version: n/a (created this session, uncommitted)
  section_or_lines: "traceability-policy.md §1.1 (Proposed prefix extensions — PENDING RATIFICATION)"
  date_collected: 2026-08-15
  collector: governance-and-traceability bootstrap steward
  transformation: consolidated from six specialists' self-flagged prefix gaps into one decision
  confidence: high
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
```

## GDEC-0003 — Named clinical reviewer and clinical-content approver for cycle 1

This entry is a **transcription of a written declaration by the named human
authority** (rodaquino-OMNI, repository owner), issued in the cycle-1 session
directive of 2026-08-15 with the explicit instruction "Record this in
docs/00-governance/registers/ … as DECIDED-BY-ME with today's date." The
recording agent is the scribe, not the decider (`../evidence-notation.md` §2,
rule 3 — the DECIDED label is applied by the human authority, here in writing;
the agent merely transcribes it).

```yaml
id: GDEC-0003
title: rodaquino-OMNI accepts the named clinical reviewer / clinical-content approver role for cycle-1 artifacts
status: DECIDED
statement: >
  rodaquino-OMNI, self-attested practicing intensivist and repository owner,
  accepts for cycle 1 the role of named clinical reviewer and clinical-content
  approver (candidate AUTH-CLINSAFETY / AUTH-INTENDED-USE holder) for the
  artifacts produced under the cycle-1 directive. Division of labor per
  orchestrator-prompt non-negotiable rule 10: agents are RULE AUTHORS;
  rodaquino-OMNI is CLINICAL APPROVER. Nothing an agent writes becomes DECIDED
  until rodaquino-OMNI reviews it; cycle-1 clinical outputs land as
  "PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI)".
  The declaration additionally authorizes: (a) read-only inspection of the
  legacy V1 repository's clinical content; (b) use of trained clinical
  knowledge; (c) web research restricted to primary guideline sources, each
  cited with issuer, edition/version, year, and URL.
decided_by: rodaquino-OMNI (named human authority; clinical credential self-attested, not independently verified — see BLK-0002 residual)
decided_date: "2026-08-15"
rationale: >
  Cycle 1 (legacy clinical-content review, V2 rule specifications, clinical
  ADRs) cannot produce reviewable clinical artifacts without a named clinical
  reviewer, and BLK-0002/BLK-0008 record that no owner was named in cycle 0.
  The repository owner, a practicing intensivist, accepts the reviewer and
  clinical-content-approver role for this cycle's artifacts so authorship can
  proceed under the author-vs-approver split required by non-negotiable
  rule 10, without any agent self-approving clinical content.
supersession_rule: >
  Revisit when (a) the organization formally names permanent AUTH-CLINSAFETY
  and AUTH-INTENDED-USE holders with verified credentials and reporting lines
  (full closure of BLK-0002/BLK-0008), (b) the scope of work extends beyond
  cycle-1 artifacts, or (c) independence rules require a second reviewer for
  content rodaquino-OMNI has personally authored or materially amended
  (author must not equal approver applies to the human as well).
links:
  requirements: []
  hazards: []
  adrs: [ADR-0007]
provenance:
  source_repo: intensicare-V2
  path_or_url: cycle-1 session directive (user prompt of 2026-08-15; "Authority declaration" section) — not a committed repository artifact
  commit_sha_or_version: n/a (declaration made in-session; repo at ddac9bc when received)
  section_or_lines: cycle-1 directive, "Authority declaration (resolves part of Gate G0)"
  date_collected: "2026-08-15"
  collector: delivery orchestrator (cycle 1), transcribing the human authority's written declaration
  transformation: transcribed; scope condensed with intent preserved
  confidence: high
  owner: rodaquino-OMNI
  validation_status: VALIDATION REQUIRED — clinical credential/qualification and organizational reporting line are self-attested, not independently verified (BLK-0002/BLK-0008 remain OPEN with partial resolution)
```

## GDEC-0004 — Resoluções do Gate G0 (DEC-G0-01 a DEC-G0-09)

**Nota do steward de governança:** as nove decisões abaixo foram tomadas por
`rodaquino-OMNI` (humano nomeado) em sessão de 2026-08-15 e transcritas por
escriba em `docs/00-governance/registers/g0-resolucoes-2026-08-15.md`
(IDs locais `DEC-G0-01`…`DEC-G0-09`). Esta entrada aloca o ID `GDEC-0004`
para essas decisões no registro central, conforme instrução de integração
daquele documento (§ "Notas de integração", item 2), verificando ausência
de colisão com `GDEC-0003` (já ocupado pelo orquestrador clínico) e com os
IDs `BLK-*` referenciados. **Nenhuma decisão foi tomada por este steward** —
apenas transcrita e alocada.

```yaml
id: GDEC-0004
title: Resoluções do Gate G0 — DEC-G0-01 a DEC-G0-09 (rodaquino-OMNI, 2026-08-15)
status: DECIDED
statement: >
  Registra, em bloco, as nove decisões tomadas por rodaquino-OMNI (CEO e
  acionista principal de OMNI e AMH, médico intensivista) em sessão de
  2026-08-15, documentadas integralmente em
  docs/00-governance/registers/g0-resolucoes-2026-08-15.md (DEC-G0-01 a
  DEC-G0-09). Resumo por bloqueador: BLK-0001 (AUTH-PRODUCT) RESOLVIDO,
  interino; BLK-0003 (AUTH-SECURITY) RESOLVIDO COM ESCOPO — restrito a
  decisões de fase de projeto, verificador de intrusão independente
  obrigatório no Gate G6; BLK-0004 (AUTH-PRIVACY-LEGAL) RECLASSIFICADO de G0
  para G6/G8 — desenvolvimento exclusivamente com dados sintéticos até
  ratificação jurídica; BLK-0005 (AUTH-DATA-PLATFORM + autoridade AMH)
  RESOLVIDO — mesmo titular declara autoridade dos dois lados; BLK-0006
  (AUTH-UX) RESOLVIDO COM RESTRIÇÃO — conhecimento próprio do titular vale
  como hipótese, não como evidência de observação do Gate G1; BLK-0007
  (AUTH-OPERATIONS) RESOLVIDO, com gatilho de segundo humano no Gate G8;
  BLK-0009 (acesso GitHub) RESOLVIDO POR RATIFICAÇÃO do mecanismo OAuth
  observado; BLK-0010 (licença/propriedade AMH) RESOLVIDO POR CONCESSÃO
  ESCRITA do titular; BLK-0011 (proteção de branch) EXECUTADO e verificado
  por resposta de API. BLK-0002 e BLK-0008 permanecem OPEN, com resolução
  parcial já registrada em GDEC-0003. Modelo adotado: proprietário único
  interino com independência preservada nos portões de verificação — ver
  risco de concentração de autoridade em risk-register.md (novo item desta
  integração).
decided_by: rodaquino-OMNI
decided_date: "2026-08-15"
rationale: >
  Fundamento consolidado de cada decisão está registrado em
  g0-resolucoes-2026-08-15.md, seção por DEC-G0-nn. Em síntese: um único
  humano nomeado assumindo múltiplos papéis de decisão é aceitável desde
  que os pares de independência do prompt (§4) continuem restringindo
  implementador × verificador nos portões de verificação (G1, G6, G8), e
  não apenas a titularidade nominal da decisão.
supersession_rule: >
  Cada DEC-G0-nn carrega seu próprio gatilho de revisão (ver
  g0-resolucoes-2026-08-15.md); esta entrada é revista integralmente quando
  qualquer um dos gatilhos individuais for acionado, ou quando um segundo
  humano assumir qualquer um dos papéis AUTH-* aqui listados.
links:
  requirements: []
  hazards: []
  adrs: []
provenance:
  source_repo: intensicare-V2
  path_or_url: docs/00-governance/registers/g0-resolucoes-2026-08-15.md
  commit_sha_or_version: n/a (criado nesta sessão, não commitado)
  section_or_lines: "DEC-G0-01 a DEC-G0-09"
  date_collected: "2026-08-15"
  collector: governance-and-traceability bootstrap steward, integrando decisão de humano nomeado transcrita por escriba
  transformation: consolidação de nove decisões individuais em uma entrada única do decision-register, sem alteração de mérito
  confidence: high
  owner: rodaquino-OMNI
  validation_status: "N/A — decisão já tomada pelo titular nomeado; ver pendências específicas em cada BLK-* afetado e em g0-resolucoes-2026-08-15.md"
```

## GDEC-0005 — Adjudicação de identidade e tenancy AMH×IntensiCare (AQ-1 a AQ-6)

**Nota do steward de governança:** transcreve e aloca ID para as seis
decisões registradas em
`docs/08-interoperability/amh-data/identity-adjudication/adjudicacao-decisoes-2026-08-15.md`,
fechando a pendência de forma que aquele documento aponta em seu §0.3 e §8
item 1 (ratificação por alocação de ID `GDEC-nnnn`). **Observação de
namespace, não resolvida silenciosamente:** o documento-fonte cita
identificadores `ADR-041`, `ADR-042`, `ADR-043`, `ADR-006`, `ADR-039` — estes
são ADRs do repositório **AMH**, numerados no espaço de ID próprio da AMH,
distinto do prefixo `ADR` da taxonomia V2 (`../traceability-policy.md` §1).
Por isso o campo `links.adrs` abaixo é deixado vazio em vez de citar esses
números — citá-los ali implicaria falsamente que são ADRs da V2. Os números
AMH aparecem apenas em prosa. Isto é uma segunda instância do mesmo tipo de
risco de colisão de namespace já registrado para `VAL` em
`../traceability-policy.md` §1.1 e `GDEC-0002`.

```yaml
id: GDEC-0005
title: Adjudicação de identidade e tenancy AMH×IntensiCare — AQ-1 a AQ-6 (rodaquino-OMNI, 2026-08-15)
status: DECIDED
statement: >
  Registra as seis decisões de adjudicação de identidade, tenancy e
  consentimento (AQ-1 a AQ-6), tomadas por rodaquino-OMNI em 2026-08-15 na
  qualidade de autoridade declarada dos dois lados (V2 e AMH, DEC-G0-04),
  documentadas integralmente em
  docs/08-interoperability/amh-data/identity-adjudication/adjudicacao-decisoes-2026-08-15.md.
  Resumo: AQ-1 MPI por tenant (ADR-041 §6 EM VIGOR) + índice cross-PJ
  governado (ADR-043 EM VIGOR, apply travado em parecer DPO/jurídico), com
  ADR-006 SUPERSEDED quanto a escopo de MPI; AQ-2 identifier:mpiId como
  elemento autoritativo, extension:mpiId/tenantId rebaixadas de 1..1, V2 pina
  pacote IG 1.1.0 (ainda não publicado); AQ-3 base legal LGPD Art. 11 II f
  para o laço clínico assistencial, sem portão de consentimento nesse laço,
  usos secundários bloqueados até haver infraestrutura de consentimento,
  ratificação jurídica brasileira pendente antes de qualquer dado real
  (DEC-G0-03); AQ-4 portable_subject_ref (PSR, formato amh:psr:v1:<uuidv4>)
  como identificador de fronteira obrigatório desde o dia um, IDP-02
  SUPERSEDED; AQ-5 eventos de ciclo de vida de identidade (alias, merge,
  unmerge, restore, erasure) e consulta resolve(ref, as_of) como cláusulas
  contratuais obrigatórias — sem elas o Gate G3 não passa; AQ-6 nenhum
  bypass cross-tenant implantado, enumeração autoritativa de 12 tenants
  pós-ADR-041, testes negativos devem provar impossibilidade. Conclusão
  explícita do documento-fonte (§6.1): Observation da AMH permanece NÃO
  CONSUMÍVEL pela V2 nesta data — AQ-2 resolveu apenas uma de quatro
  pernas do bloqueio (IDP-12); população da fonte, forma do payload e
  emissão do produtor permanecem abertas. A própria ata-fonte é um registro
  OBSERVED por escriba (rótulo justificado em seu §0.2), não DECIDED — esta
  entrada do decision-register é o que formaliza as seis decisões como
  DECIDED no registro central, fechando a pendência de forma apontada em
  seu §8 item 1.
decided_by: rodaquino-OMNI
decided_date: "2026-08-15"
rationale: >
  Fundamento individual de cada AQ está registrado em
  adjudicacao-decisoes-2026-08-15.md §2. Em síntese, a adjudicação
  prioriza: isolamento verificável por construção em vez de depender de um
  portão de consentimento sem produtor (AQ-1); alinhamento do contrato ao
  que o sistema realmente emite, na direção que não exige reescrever 11,4
  milhões de recursos já produzidos (AQ-2); separação entre tratamento
  assistencial e uso secundário sem fabricar base legal para nenhum dos
  dois (AQ-3); adoção do formato definitivo de identificador de fronteira
  desde o início para evitar dívida de migração futura (AQ-4); integridade
  de replay sob identidade — sem resolução ponto-no-tempo um replay não é
  replay (AQ-5); e prova de impossibilidade de bypass cross-tenant, não
  mera ausência observada (AQ-6).
supersession_rule: >
  Cada AQ carrega sua própria regra de supersessão (ver documento fonte
  §2, por decisão); em comum, todas exigem revisão do titular. As
  cláusulas de natureza jurídica (AQ-3 em especial) ficam adicionalmente
  condicionadas a ratificação por advogados brasileiros antes de qualquer
  tratamento de dados reais, operação sombra ou piloto (DEC-G0-03,
  gatilhos G6/G8). O AQ-1 registra explicitamente que reabrir a decisão é
  redesenho, não incremento.
links:
  requirements: []
  hazards: []
  adrs: []
provenance:
  source_repo: intensicare-V2
  path_or_url: docs/08-interoperability/amh-data/identity-adjudication/adjudicacao-decisoes-2026-08-15.md
  commit_sha_or_version: n/a (criado nesta sessão, não commitado)
  section_or_lines: "§2, AQ-1 a AQ-6; ver também §0 (procedência), §6 (o que não fica desbloqueado) e §8 (pendências)"
  date_collected: "2026-08-15"
  collector: governance-and-traceability bootstrap steward, integrando decisão de humano nomeado transcrita por escriba (analista de adjudicação de identidade e tenancy AMH, Onda 2)
  transformation: consolidação de seis decisões individuais em uma entrada única do decision-register; fecha a pendência de forma registrada em §8 item 1 do documento fonte
  confidence: high
  owner: rodaquino-OMNI
  validation_status: "VALIDAÇÃO NECESSÁRIA — contra-assinatura formal do titular sobre a ata-fonte (§0.3) permanece pendente; ratificação jurídica do AQ-3 e pareceres DPO/jurídico do AQ-1/AQ-4 permanecem pendentes (ver §8 do documento fonte); publicação e verificação por digest do pacote IG 1.1.0 são pré-condição do Gate G3 e ainda não existem"
```

## GDEC-0006 — Política de idioma: conteúdo novo em pt-BR a partir de 2026-08-15

```yaml
id: GDEC-0006
title: Política de idioma — conteúdo novo em pt-BR a partir de 2026-08-15 (DEC-G0-10)
status: DECIDED
statement: >
  Todo material produzido a partir de 2026-08-15 será redigido em
  português (pt-BR), ainda que as interações com agentes ocorram em
  inglês. O corpus do ciclo 0 (em inglês) permanece válido como evidência e
  NÃO é traduzido retroativamente por esta decisão. A tradução retroativa
  do corpus de ciclo 0, caso desejada, é decisão em aberto do titular
  (custo × benefício a avaliar) e não está autorizada por esta entrada.
  Aplicação prática registrada nesta mesma integração: nomes de campos
  estruturais já estabelecidos nos registros (id, status, decided_by,
  links, provenance, gate, who_must_act etc.) permanecem em inglês, por
  serem parte do esquema do documento e não do conteúdo substantivo; apenas
  o conteúdo em prosa (títulos, declarações, justificativas, notas de
  resolução) segue a política de idioma para material novo.
decided_by: rodaquino-OMNI
decided_date: "2026-08-15"
rationale: >
  Registrado textualmente em DEC-G0-10 (g0-resolucoes-2026-08-15.md):
  alinhar o idioma do produto e da documentação ao mercado-alvo inicial
  (Brasil, pt-BR) a partir do primeiro dia em que existe titular nomeado
  para decidir isso, sem impor custo de retradução do que já existe e é
  válido como evidência.
supersession_rule: >
  Revisão do titular a qualquer momento; decisão específica futura sobre
  tradução retroativa do corpus de ciclo 0 abre uma nova entrada GDEC, não
  reabre esta.
links:
  requirements: []
  hazards: []
  adrs: []
provenance:
  source_repo: intensicare-V2
  path_or_url: docs/00-governance/registers/g0-resolucoes-2026-08-15.md
  commit_sha_or_version: n/a (criado nesta sessão, não commitado)
  section_or_lines: "DEC-G0-10"
  date_collected: "2026-08-15"
  collector: governance-and-traceability bootstrap steward
  transformation: "none — transcrita da decisão do titular"
  confidence: high
  owner: rodaquino-OMNI
  validation_status: "N/A — decisão já tomada pelo titular nomeado"
```

## Index

| ID | Title | Status | Decided by | Decided date |
|---|---|---|---|---|
| GDEC-0001 | Adopt `cycle-0/spark-foundation` branch and `docs/` hierarchy | PROPOSAL | UNASSIGNED — VALIDATION REQUIRED | n/a |
| GDEC-0002 | Ratify or reject proposed ID-prefix extensions (THR, CRV, QAS, IDP/IDN, NIU/SM/HM/WF/UR) | PROPOSAL | UNASSIGNED — VALIDATION REQUIRED | n/a |
| GDEC-0003 | Named clinical reviewer / clinical-content approver for cycle-1 artifacts | DECIDED | rodaquino-OMNI | 2026-08-15 |
| GDEC-0004 | Resoluções do Gate G0 — DEC-G0-01 a DEC-G0-09 | DECIDED | rodaquino-OMNI | 2026-08-15 |
| GDEC-0005 | Adjudicação de identidade e tenancy AMH×IntensiCare — AQ-1 a AQ-6 | DECIDED | rodaquino-OMNI | 2026-08-15 |
| GDEC-0006 | Política de idioma — conteúdo novo em pt-BR a partir de 2026-08-15 | DECIDED | rodaquino-OMNI | 2026-08-15 |

## Notes

- This register started empty of `DECIDED` entries by design: no agent may
  approve any policy. GDEC-0003 is the first `DECIDED` entry; it was decided
  in writing by the named human authority (rodaquino-OMNI) and merely
  transcribed by an agent — see the preamble of that entry.
- Future entries should be appended with the next sequential `GDEC-NNNN` ID
  per `../traceability-policy.md` §2.
- **Nota (2026-08-15, pt-BR — conteúdo novo, ver GDEC-0006):** `GDEC-0004`,
  `GDEC-0005` e `GDEC-0006` foram alocados nesta integração, verificando
  ausência de colisão com `GDEC-0003` (já emitido pelo orquestrador
  clínico). Todos os três transcrevem decisões já tomadas por humano
  nomeado (`rodaquino-OMNI`); nenhum foi decidido por este steward. Próximo
  ID disponível: `GDEC-0007`.
