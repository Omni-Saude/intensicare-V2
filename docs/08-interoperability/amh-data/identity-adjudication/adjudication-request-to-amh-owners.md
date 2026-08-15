---
id: IDN-REQ-001
title: Adjudication request to AMH owners — patient identity, tenant grain, consent
label: PROPOSAL
status: RESPONDIDO em 2026-08-15 — AQ-1..AQ-6 decididas; ver ./adjudicacao-decisoes-2026-08-15.md
statement: >
  Six questions only AMH owners can answer, each grounded in a named artifact at a
  pinned commit, each blocking a specific piece of IntensiCare V2 work. Answering
  AQ-1 and AQ-2 is the minimum that unblocks AMH Observation consumption and MPI
  contract acceptance.
provenance:
  source_repo: Omni-Saude/amh-data-platform
  path_or_url: evidence cited per question; full index in ./contradiction-record.md §6
  commit_sha_or_version: 0a07a6f1fab36fb2f5eeee0fcd8e945c95f67116
  section_or_lines: per question
  date_collected: 2026-08-14
  collector: AMH tenant-and-identity adjudication analyst (Wave 2)
  transformation: contradictions from IDN-CONTRA-001 restated as answerable questions with decision options
  confidence: high (document-level); runtime and deployment facts remain unverified
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  requirements: []
  hazards: []
  adrs: []
  tests: []
  pr: null
supersedes: null
superseded_by: null
---

# Adjudication Request to AMH Owners — Patient Identity, Tenant Grain, Consent

> ## ⚑ RESPONDIDO EM 2026-08-15 — ESTE PEDIDO NÃO ESTÁ MAIS ABERTO
>
> As seis questões **AQ-1…AQ-6** foram **decididas** pelo titular nomeado
> **rodaquino-OMNI** em **2026-08-15** (autoridade: DEC-G0-04, que declara deter a autoridade
> do lado AMH e do lado V2). **Ata:**
> [`adjudicacao-decisoes-2026-08-15.md`](./adjudicacao-decisoes-2026-08-15.md).
>
> **Não reenviar este documento aos owners da AMH como pedido pendente.** Seu valor residual
> é duplo: (a) é o registro da **evidência** que fundamentou cada decisão, questão por
> questão; (b) é o **insumo direto da ordem de serviço AMH** — as correções que a decisão
> gerou do lado AMH (publicar o IG 1.1.0, corrigir o produtor batch, corrigir o
> CodeSystem/ValueSet `amh-tenant` e a tabela de partições, ordenar SP-1…SP-7) saem daqui.
>
> **Respostas em uma linha:** AQ-1 = Opção C · AQ-2 = Opção B · AQ-3 = Opção C ·
> AQ-4 = Opção A plena · AQ-5 = Opção A vinculante · AQ-6 = Opção A.
>
> **Segue aberto e NÃO foi respondido aqui:** as questões **Q1…Q10** do dossiê irmão
> (`../open-questions-for-amh-owners.md`) — em especial **Q1, sinais vitais**, que continua
> sendo a questão de maior valor para o portfólio clínico e que **nenhuma** destas decisões
> toca.

**Audience.** AMH Data Platform owners. Per ADR-042 L5, the approver roles AMH itself
names for identity/consent clauses are `Principal Architect AMH + CTO`,
`Clinical Platform Lead (FHIR/MPI)`, and `DPO + Compliance (LGPD/ANS)`. **These are role
names copied from an AMH artifact. No individual is named, contacted, or assumed to have
agreed to anything.**

**Purpose.** These are questions **only AMH owners can answer**. Each is grounded in a
specific artifact read at a pinned commit, states why V2 cannot resolve it from
documents, gives the decision options with their consequences for V2, and names exactly
what V2 work it blocks. They are requests for facts and decisions, not for work or
opinion.

**Pinned evidence snapshot.** `Omni-Saude/amh-data-platform@0a07a6f1fab36fb2f5eeee0fcd8e945c95f67116`
(`main`), re-verified 2026-08-14 as the current HEAD at collection time.

**Method.** Read-only GitHub API calls at the pinned commit. No AMH environment was
accessed, no endpoint contacted, no credential used against any AMH runtime, and
**nothing was written to the AMH repository**. No PHI, credentials, tokens, secrets or
infrastructure identifiers appear below.

**Relationship to the earlier request.** [`../open-questions-for-amh-owners.md`](../open-questions-for-amh-owners.md)
asked Q1–Q10 (vital signs, deployed auth, Observation timeline, contract ownership,
licensing, environments, manifest status, `_dq_status`, onboarding, change notification).
**None of those covered identity.** This document adds AQ-1…AQ-6 and does not restate
them. Where they interlock it is noted.

**A note on tone.** Several questions surface contradictions between AMH documents.
They are recorded because a consumer cannot design against two conflicting statements —
not as criticism. This repository documents its own defects with unusual rigour (the
partitioning document retracts five of its own prior claims; ADR-045 names five runbooks
that teach an `INSERT` against columns that do not exist), and that candour is why the
rest of the documentation is worth taking seriously enough to ask about.

---

## Priority summary

| # | Question | Blocks |
|---|---|---|
| **AQ-1** | Which MPI scope is in force — cross-tenant longitudinal, or tenant-local? | AMH Observation consumption; MPI contract acceptance; the whole V2 identity model |
| **AQ-2** | Which FHIR element carries identity on the wire, from which producer, under which profile? | Every AMH resource type V2 would consume, `Patient` included |
| **AQ-3** | Is there an enforceable consent gate a consumer can rely on — and which `scope` vocabulary? | Any V2 use that requires a legal basis; cross-scope context entirely |
| **AQ-4** | Will `portable_subject_ref` be offered to V2 as the boundary identifier, and under what gate/timeline? | The V2×AMH contract's subject field; the anti-corruption layer's key strategy |
| **AQ-5** | Will AMH publish identity-lifecycle events (alias/merge/unmerge/restore/erasure) to consumers? | Deterministic replay across identity changes; correction handling |
| **AQ-6** | What is the authoritative tenant enumeration, and does a `cross_tenant_authorized` bypass exist in any deployed environment? | Tenant scoping; isolation negative tests; Gate G3 |

**Minimum to unblock the two named V2 work items: AQ-1 and AQ-2.** AQ-3…AQ-6 shape the
contract but do not, by themselves, gate Observation consumption.

---

## AQ-1 — Which MPI scope is in force?

### The question

For a `Patient` or `Observation` resource delivered by AMH to an external consumer:
**does `amh-mpi-id` denote a person across all AMH tenants, or a person within one
tenant/PJ?** And which of ADR-006, ADR-041 §6 and ADR-043 is currently in force, with
what status for the others?

### Why V2 cannot answer it from the documents

Four artifacts, all reachable at one commit, none marked superseded or deprecated,
assign the same field incompatible meanings. Verbatim, with the status each file records
for itself:

**ADR-006** — `Status: Accepted` (L3), `2026-05-10`:

> L14: `atribui um `mpi_id` único e estável a cada indivíduo, vinculando todos os seus registros cross-tenant.`

**ADR-041 §6** — `Status: Accepted` (L3), `2026-07-26`, decider `owner do produto`:

> L128–130: `**Decidido: o MPI é POR TENANT.** … Nenhum artefato da plataforma atravessa a fronteira da PJ.`

**FHIR IG README** (package `1.0.0`):

> L171: `| `amh-mpi-id` | … | Chave MPI longitudinal cross-tenant |`
> L257: `├── extension amh-mpi-id: "…"        ← chave estável cross-tenant`

**ADR-043** — `Status: Accepted` (L3), `2026-08-03`, with its own blocking condition at
L5–6 (`O parecer do DPO/jurídico deve ser anexado a este ADR antes do primeiro apply`):

> L36: `### 1. Um índice de correspondência separado — nunca um MPI global`

A later date is not a supersession, and V2 must not treat it as one. Prompt §2 item 7
is explicit: *"V2 must not select one silently."*

### Decision options and their consequences for V2

| Option | V2 consequence |
|---|---|
| **A — ADR-006/IG in force: cross-tenant longitudinal MPI** | V2 gains a single subject key per person. V2 must then implement a consent-and-purpose enforcement path — but see **AQ-3**: ADR-045 L82–84 records `mpi.consent_log` has **zero producers**, so the gate ADR-006 L54 conditions federation on has no data. V2 would be consuming cross-PJ PHI on a basis AMH's own most recent identity ADR records as pending legal opinion. This is the highest-exposure option and V2 will not adopt it without an explicit DPO position. |
| **B — ADR-041 §6 in force: tenant-local MPI** | V2 designs for hard isolation. The measured 4,220 multi-PJ patients (ADR-041 L22, 3.88%) appear as N distinct subjects with no reconciliation, permanently. V2 must then state that limitation visibly to clinicians — a partial record presented as complete is a clinical hazard, not a UX detail. This is the option V2's interim policy is already aligned with. |
| **C — ADR-043 in force: tenant-local plus a separately governed cross-PJ index** | Same as B for V2's day-one design. Any future cross-PJ context reaches V2 only through an AMH-mediated purpose-bound interface that does not exist today; V2 never receives or replicates the index (ADR-043 L59–61, L69–70). V2 needs to know whether that interface is planned, so it can be a contract candidate rather than a surprise. |
| **D — Mixed / scope varies by resource type or channel** | V2 needs the rule stated per resource type and per channel, because a consumer cannot infer scope from the wire: the field name, the extension URL and the NamingSystem URI are identical in every case. |

### What this blocks

- **AMH Observation consumption** — `Observation.extension:mpiId` is `1..1`; there is no
  conformant way to consume an Observation while being agnostic about what that
  reference means.
- **MPI contract acceptance** — V2 cannot pin an identity contract whose central field
  has four candidate semantics.
- The V2 identity model, the anti-corruption layer's key strategy, and every
  isolation test.

### What V2 does in the meantime

Fails closed and selects nothing. See [`interim-identity-policy.md`](./interim-identity-policy.md)
rules IDP-01, IDP-03, IDP-04.

---

## AQ-2 — Which element carries identity on the wire, from which producer, under which profile?

### The question

Three sub-questions, all needed together:

1. **Which element is authoritative** — `Patient.extension:mpiId` (which the IG profile
   makes `1..1`) or `Patient.identifier:mpiId` (which the IG profile makes `0..1`, and
   which ADR-039 names as the canonical system)?
2. **Which producer is authoritative for external consumers**, and does it populate that
   element today?
3. **Which `meta.profile` URL should a consumer validate against** for non-`Patient`
   resource types?

### Why V2 cannot answer it from the documents

**OBSERVED — the profiles** (parsed from the JSON differentials at the pinned commit):

| Profile | Element | Cardinality |
|---|---|---|
| `Patient-amh` | `extension:mpiId` | **1..1** |
| `Patient-amh` | `identifier:mpiId` | **0..1** |
| `Observation-amh-laboratory` | `extension:mpiId` | **1..1** |
| `Observation-amh-laboratory` | `extension:tenantId` | **1..1** |

**OBSERVED — the ADR** names the *optional* element as canonical (ADR-039 L65–67):

> `**Sistema canônico do identifier de MPI:** `https://…/NamingSystem/amh-mpi-id` (slice `identifier:mpiId` do perfil `Patient-amh` da IG).`

**OBSERVED — the producer.** ADR-040 L32–33 names
`pipelines/batch/fhir/bronze_to_fhir.py` as the producer. Reading it at the pinned
commit:

- `mpi_id` is emitted **only as an `identifier`** (L425–426).
- **No `extension` is emitted on any resource** — a count of the string `extension`
  across the 1,118-line file returns **0**. The mandatory `extension:mpiId (1..1)` and
  `extension:tenantId (1..1)` are therefore not populated.
- `PATIENT_PROFILE` (L97) is the IG URL `https://fhir.americashealth.com.br/StructureDefinition/Patient-amh`,
  but the other seven types are stamped `https://amh.health/fhir/StructureDefinition/BR*`
  (L319–325), including `OBS_PROFILE = ".../BRObservation"` (L325).
- ADR-039 L81–83 records that exact URL pattern as a **defect it fixed** in the Flink
  mapper: `corrigida a URL do profile (`.../StructureDefinition/Patient-amh`, era
  `amh.health/.../BRPatient` — não batia com a IG → validação falharia)`.

**This is offered as an observation, not an accusation.** ADR-039 L98–99 records that
nothing in this path is validated at runtime (`estas correções são de contrato/código,
provadas por leitura, não por execução`), and only AMH can say whether server-side
profile validation is enforced, and against which package.

### Decision options and their consequences for V2

| Option | V2 consequence |
|---|---|
| **A — `extension:mpiId` is authoritative; the producer will be fixed to emit it** | V2 validates against the IG as published. V2 needs the date from which emitted resources carry it, because resources produced before that date will fail validation and must be excluded rather than silently accepted. |
| **B — `identifier:mpiId` is authoritative; the profile cardinality will be corrected** | V2 validates on the identifier and treats the extension as absent-by-design. This is an IG change with a package version bump — V2 needs the new package version to pin. |
| **C — Both are populated** | Simplest for V2, but V2 must know whether disagreement between them is possible and, if so, which wins. |
| **D — Neither is reliably populated today** | Then AMH FHIR `Patient`/`Observation` are not consumable by an identity-scoping consumer at all today, and V2 records that plainly rather than building against a contract the data does not satisfy. |

Separately, on the profile URL: V2 needs to know whether `https://amh.health/fhir/StructureDefinition/BR*`
is a live alias, a legacy artifact, or a defect — because a consumer's conformance suite
must validate against exactly one, and `BRObservation` is not a profile present in the
IG that V2 read.

### What this blocks

- **AMH Observation consumption** (jointly with AQ-1) and every V2 conformance test.
- The consumer-driven contract tests required by prompt §7.6 and Gate G3.

### Interlock

This is the identity half of dossier **Q3** (Observation ingestion shape). An Observation
that is numerically conformant but carries no `mpiId` is still not consumable.

---

## AQ-3 — Is there an enforceable consent gate a consumer can rely on, and which `scope` vocabulary?

### The question

1. Is there, today or on a stated date, a consent decision an external consumer can
   obtain and rely on for an AMH-sourced clinical fact?
2. Which `scope` vocabulary is authoritative?
3. Is ADR-039's recorded fail-open behaviour still accurate, given the code correction
   dated 2026-08-03 in the same repository?

### Why V2 cannot answer it from the documents

**ADR-045** — `Status: Accepted` (L3), `2026-08-06`:

> L82–84: `**Não existe escritor.** Nenhum `INSERT INTO mpi.consent_log` no repositório inteiro … A tabela tem 14 consumidores … e **zero produtores**.`

> L106–110: `**O vocabulário de `scope` está partido em dois.** O DDL usa `analytics | research | sharing_amh_internal | external_sharing`. O gate dos agentes … usa `treatment | research | billing | ml_training | operational_analytics``

> L99–104: `O único campo de permissão que chega ao lake é `ie_perm_sms_email` …, que é permissão de CONTATO, não consentimento de finalidade — usá-lo como consentimento LGPD seria fabricar base legal.`

**And the two descriptions of the gate's failure mode disagree at one commit:**

- **ADR-039 L92–94** (`Accepted`, 2026-07-23) records fail-**open**:
  `Patient sem `mpi_id` resolvido hoje **passa** pelo consent (tratado como sem-subject → allow)`.
- **`pipelines/flink/src/fhir/consent_filter.py`** at the same commit records a
  correction dated **2026-08-03** (L11–18) making it fail-**closed**:
  `Agora: para os tipos ligados a paciente, identidade não resolvida = NEGA` — and states
  the principle at L7–9: `Regra de ouro deste módulo: **na dúvida, NEGA**.`
- **Neither applies to the live channel:** the Flink path is parked (ADR-039 L98–99) and
  the batch producer contains no consent logic at all (a case-insensitive count of
  `consent` in `bronze_to_fhir.py` returns **0**).

**V2 is not asking AMH to build a consent service.** V2 is asking which of these is the
statement of record, so that V2 does not design against a gate that is stale, parked, or
absent.

### Decision options and their consequences for V2

| Option | V2 consequence |
|---|---|
| **A — No consumer-facing consent decision exists yet** | V2 records this plainly and blocks every use requiring consent. This is V2's current working assumption (IDP-07) and it is safe, but it caps what V2 can do. |
| **B — A decision exists via a named interface** | V2 needs its name, its `scope` vocabulary, its failure semantics, and whether it can answer *"did consent hold at time T?"* — ADR-045 L53–56 argues that historical question is the one that matters in a dispute, and V2's replay determinism (DOM-0003) needs it too. |
| **C — Consent is out of scope for this integration because a different legal basis applies** | Then V2 needs that basis stated by the DPO, in writing, with its scope — so V2 records a decision rather than an absence. |

**Whichever option holds, V2 requests one thing explicitly: confirmation that V2 must
NOT use `ie_perm_sms_email`, or any contact-permission field, as consent.** ADR-045 L104
already calls that `fabricar base legal`; V2 wants it on the record for its own audit.

### What this blocks

Any V2 use requiring a legal basis; all cross-scope context; the privacy section of the
AMH×IntensiCare contract package (prompt §7.5).

---

## AQ-4 — Will `portable_subject_ref` be offered to V2, and under what gate and timeline?

### The question

Prompt §7.4 line 445 directs V2 to prefer *"an opaque, purpose-bound portable subject
reference at the integration boundary when an authoritative AMH contract provides it."*
AMH has designed exactly that. **Will it be offered to IntensiCare, or is it
Maezo-specific? And what is the gate status?**

### Why V2 cannot answer it from the documents

The design is complete and explicitly not in force. **ADR-042 L93** (XRD-05):

> `Sujeito no core payer = `portable_subject_ref` mintado pela AMH, opaco e estável dentro de `{amh_tenant, legal_entity}`; … nenhum ID cru de paciente/beneficiário/MPI entra no domínio Maezo; merges viram aliases AMH. Cláusula gated por DPO/Legal.`

**`docs/plans/amh-020b-portable-subject-ref-design-2026-08-04.md` L450–453:**

> `**Aplicar qualquer DDL deste design = gate humano DPO/Legal (XRD-05 …). Este documento e os DDLs versionados NÃO autorizam apply, grant, criação de segredo, backfill nem tráfego.**`

Seven human stop points remain open (L500–506: SP-1 DDL apply and physical placement;
SP-2 the `tenant → legal_entity` table including `omni`'s CNPJ root, recorded at L176 as
`**NÃO CONSTA no tfvars — exige owner**`; SP-3 the interop key; SP-4 the
`consent_decision_ref` form; SP-5 the mint backfill; SP-6 the ADR-043 legal opinion;
SP-7 the beneficiary key tuple).

The clause is written for the Maezo boundary. V2 is a different consumer, and prompt
§7.5 line 455 is explicit that V2 must **not** reuse Maezo's contract.

### Decision options and their consequences for V2

| Option | V2 consequence |
|---|---|
| **A — Yes, extended to IntensiCare, on a stated timeline** | V2 designs its anti-corruption layer to adopt `amh:psr:v1:*` when it lands and mints an internal key with a structurally compatible scope in the meantime (IDP-02). Best outcome for V2 — the semantics AMH designed are exactly what a safety-critical consumer wants. |
| **B — Maezo-only** | V2 needs an equivalent boundary identifier defined in the AMH×IntensiCare contract package. V2 will propose one; it must be AMH-minted or AMH-approved, because V2 minting its own from AMH identifiers would violate the same XRD-05 principle. |
| **C — Gates will not clear on a horizon useful to V2** | V2 proceeds with an internal-only key and no AMH-minted boundary reference, and states in the contract package that the subject field is V2-scoped. V2 needs to know this, not discover it. |

**One factual sub-question with no policy content:** AMH-020b L91–99 scopes the ref to
`{amh_tenant, legal_entity}`. For an ICU consumer the clinically meaningful scope also
includes the **encounter**. Would an IntensiCare-facing ref be encounter-scoped,
encounter-qualified, or encounter-independent? This changes V2's key design and is
cheaper to answer now than to migrate later.

### What this blocks

The subject field of the AMH×IntensiCare contract package; the anti-corruption layer's
key strategy. **It does not block Observation consumption** — AQ-1 and AQ-2 do.

---

## AQ-5 — Will AMH publish identity-lifecycle events to consumers?

### The question

Will AMH deliver **alias, merge, unmerge/split, restore, reassignment and erasure**
notices to an external consumer? If yes, on what channel, with what ordering and
at-least-once/exactly-once semantics, and with what latency?

### Why V2 cannot answer it from the documents

AMH's design handles all of these correctly **internally**, and explicitly declines to
make consumer notification a requirement. **AMH-020b L372–374:**

> `Notificar o Maezo de aliasing (evento "subject alias notice") é decisão de contrato do AMH-030 — **não** é requisito deste design; a garantia daqui é que a resolução AMH nunca quebra.`

The internal semantics V2 would need to mirror are already specified and are exactly
right for a replayable consumer — which is why V2 wants them, not something new:

> L339–342 (`§5.1`): a ref `**nunca morre e nunca é re-mintado**`; the old ref becomes an
> alias and `O consumidor Maezo nunca quebra — todo ref que ele já viu continua
> resolvendo do lado AMH, para sempre.`

> L388–392 (split): `Eventos históricos emitidos sob o ref original não são reescritos (histórico é histórico …)`

> L393–396 (restore): `a revogação é carimbada, não apagada.`

> L118–122 (erasure): `status=retired` with the mapping column nulled — the ref is never
> deleted and never reusable.

### Why it matters to V2 specifically

V2's evaluation must be deterministic and replayable (DOM-0003) and its provenance chain
immutable with explicit corrections (DOM-0002). **A merge that V2 learns about only by
inference is a silent rewrite of clinical history.** If AMH resolves aliases server-side
and V2 never sees the transition, then a replay of a past instant will resolve identity
"as of now" rather than "as of then" — which is not a replay.

### Decision options and their consequences for V2

| Option | V2 consequence |
|---|---|
| **A — Yes, published as events** | V2 consumes them as first-class domain events (IDP-10) and replay stays deterministic. Preferred. |
| **B — Resolvable on demand via a lookup, but not pushed** | Workable if the lookup is **point-in-time** (`resolve(ref, as_of)`). A lookup that only answers "now" does not support replay and V2 would have to treat every historical evaluation as potentially mis-attributed. |
| **C — Neither** | V2 must treat identity as immutable-within-a-window, cap replay validity at that window, and state the limitation in its safety case. V2 needs to know this to size the window honestly. |

### What this blocks

Deterministic replay across identity changes; correction handling; the
identity/alias/merge contract candidate that prompt §7.5 line 472 lists.

---

## AQ-6 — Authoritative tenant enumeration, and does a cross-tenant bypass exist?

### The question

1. What is the authoritative machine-readable `tenant → {partition name, CNPJ root}`
   mapping for a consumer, and where does it live?
2. Does a `cross_tenant_authorized`-style claim exist in any deployed environment?

### Why V2 cannot answer it from the documents

**Tenant enumeration drift (OBSERVED).** The IG README L204 records the `amh-tenant`
CodeSystem as `**amh-tenant:** 10 tenants AMH operacionais (austa_clinicas, omni, etc.)`
and its worked example (L258) uses `amh-tenant-id: "austa_clinicas"`. ADR-041 L77–78
retires exactly that tenant (`o `austa_clinicas` é **aposentado**`) and sets the business
set to 12. AMH-020b L194–198 makes the prohibition a machine-checkable invariant (I-8):
`Proibidos por construção: `amh_landing` …, `austa_clinicas` (aposentado pelo ADR-041 §2)`.
The HAPI partition table (`partitioning-config.md` L41–45) still lists only the
pre-ADR-041 partitions.

`amh-tenant-id` is a `required`-bound coded element (IG README L213). **V2 cannot scope
by tenant against a ValueSet whose contents the governing ADR has superseded.**
(V2 read the README's description of the ValueSet, not the ValueSet JSON — if the JSON is
already current, saying so closes this immediately.)

**Cross-tenant bypass (OBSERVED, two documents disagree).** The IG describes a bypass:

> README L279–280: `Exceção: tokens com claim `cross_tenant_authorized=true` … podem buscar cross-tenant — auditado em `mpi.consent_log`.`

The partitioning contract describes a mechanism with no evident way to express one:

> `partitioning-config.md` L34–37: `**A identificação de tenant não se escolhe por chave** … É por URL, sempre.`
> L62–64: `**Compara o tenant do token com o tenant da URL e nega quando divergem**`
> L79–80: `allow_references_across_partitions: false`

Also **OBSERVED**, and relevant to any V2 test plan: `partitioning-config.md` L91 records
`**`com.amh.fhir.bootstrap.PartitionInitializer` NÃO EXISTE.**` and L99–105 that a
request for a tenant without a partition `falha no HAPI`.

### Decision options and their consequences for V2

| Option | V2 consequence |
|---|---|
| **A — The bypass does not exist / is documentation drift** | V2's isolation model is simply URL-partition + claim equality. V2's negative tests assert the bypass is impossible. Cleanest. |
| **B — It exists** | It is an **identity-scope** decision, not a permission toggle: a role that can read across PJs is a de-facto global MPI at query time — the exact property ADR-043 L49–51 records as having been dismantled. V2 will not request it, and needs to know it exists so its threat model accounts for it. |
| **C — Planned but not deployed** | V2 needs the date and the governing decision, and will design as if it does not exist. |

### What this blocks

Tenant scoping in every V2 component; the isolation and negative-authorization tests
Gate G3 requires; the threat model.

### Interlock

Extends dossier **Q2** (deployed authentication) and **Q6** (verifiable environments).
The URL/claim rule cannot be tested empirically — as prompt §7.4 line 451 requires —
without an environment and a partitioned tenant to test against.

---

## What V2 work is blocked, precisely

| V2 work item | Blocked by | Status while blocked |
|---|---|---|
| **AMH `Observation` consumption** | AQ-1 + AQ-2, jointly and independently of the empty-source and shape blockers already recorded as dossier Q3 | Ineligible. Four independent blockers, all open — see [`interim-identity-policy.md`](./interim-identity-policy.md) IDP-12. |
| **MPI contract acceptance** (pinning any AMH identity contract in `contracts.lock`) | AQ-1 + AQ-2 | Cannot pin a contract whose central field has four candidate meanings. |
| **Subject field of the AMH×IntensiCare contract package** | AQ-4 | V2 uses an internal-only key; the boundary field is left unspecified rather than guessed. |
| **Deterministic replay across identity changes** | AQ-5 | Replay validity is capped at an unstated window; the safety case cannot close. |
| **Tenant-isolation and negative-auth test suites** | AQ-6 (+ dossier Q6 for an environment) | Cannot be authored against an authoritative tenant list, and cannot be executed at all without an environment. |
| **Any V2 use requiring a legal basis** | AQ-3 | Blocked. V2 will not infer consent from a contact-permission field. |
| **Gate G3 (AMH compatibility)** | all of the above | Cannot be approached. Standing report remains `integration candidate`; clinical evaluation remains non-actioning. |

---

## Requested decision format

Per `docs/00-governance/evidence-notation.md` §4, V2 can only record a resolution as
`DECIDED` if it carries all four fields. A decision that omits any of them is recorded as
`PROPOSAL` on the V2 side and does not unblock the work above.

```yaml
decision:
  decided_by: <named human authority — a person, not a role, not an agent>
  decided_date: <YYYY-MM-DD>
  rationale: >
    <why, in enough detail that a future reviewer can assess whether it still holds>
  supersession_rule: >
    <what event, date, or condition requires this to be revisited>
```

Plus, specific to this adjudication:

1. **Per question (AQ-1…AQ-6): which option is in force.**
2. **Per superseded artifact: what becomes of it.** For AQ-1 this means saying, for each
   of ADR-006, ADR-039, ADR-041 §6, ADR-043 and the IG README's longitudinal-MPI
   language, whether it is *in force*, *superseded*, *scoped to a context*, or
   *withdrawn*. V2's blocker is not only "which is right" — it is that all five currently
   read as authoritative.
3. **An effective date and an artifact version to pin** (IG package version, contract
   manifest digest, or ADR commit), so V2 can pin rather than track a moving `main`.
4. **A named route for change notification** if any answer is expected to change
   (interlocks with dossier Q10).

An answer of *"undecided"* or *"not yet"* is a **useful** answer and V2 asks for it
plainly where true — it lets V2 record a dated blocker instead of a silent assumption.

---

## What V2 is NOT asking for

- **Not** asking AMH to change any decision. ADR-041 §6 may well be the right call; V2
  needs to know it is *the* call.
- **Not** asking AMH to build a consent service, a vital-signs feed, an event stream, or
  a subject-ref API on V2's schedule.
- **Not** asking for cross-PJ data, for a `cross_tenant_authorized` credential, or for
  any access beyond a single tenant scope.
- **Not** asking for write access to the AMH repository or any AMH environment. Nothing
  has been written and nothing will be without separate AMH-owner authority (prompt
  §7.5 line 455).
- **Not** asking for raw identifiers. V2 would prefer an opaque reference and no CPF at
  all; it notes only that CPF is currently emitted in clear on `Patient.identifier`, and
  that V2's interim policy forbids using it for correlation regardless.

## What V2 commits to in return

- **No silent selection.** V2 will not adopt either MPI scope until this is decided, and
  every V2 artifact touching AMH identity cites `IDN-CONTRA-001` and names the open
  question.
- **Fail closed.** Missing, mismatched or unverifiable tenant, identity, purpose or
  consent context is a denial in V2, counted and observable — never a default and never
  a silent pass. See [`interim-identity-policy.md`](./interim-identity-policy.md).
- **No cross-scope correlation.** V2 will not join on CPF or any identifier across PJs,
  tenants or partitions, and will not build any structure that could serve as an
  uncontrolled copy of the ADR-043 index.
- **Pinned, digest-verified consumption.** V2 will pin AMH artifacts by commit and
  digest, re-verify at each execution commit, and fail closed on drift.
- **Findings returned.** Any contradiction or defect V2 observes in AMH artifacts is
  reported back with path, commit and line — as this document does — and never
  worked around silently.

---

*Prepared by the AMH tenant-and-identity adjudication analyst (Wave 2). Read-only
verification at a pinned commit. Nothing was written to the AMH repository. No PHI,
credentials, tokens or secrets appear in this document. No person is named as an owner,
approver, or decision-maker; role names are quoted from AMH artifacts only.*
