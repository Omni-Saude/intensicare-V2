---
doc_id: AMH-CLAIM-VERIFICATION-MATRIX
status: PROPOSAL
owner: UNASSIGNED — VALIDATION REQUIRED
source: Omni-Saude/amh-data-platform @ 0a07a6f1fab36fb2f5eeee0fcd8e945c95f67116 (pinned evidence snapshot, main); INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §2 (Verified AMH-data evidence snapshot, claims 1-15)
date_collected: 2026-08-14
collector: AMH-data compatibility architect
last_updated: 2026-08-14
---

# AMH×IntensiCare — Claim Verification Matrix

**Purpose.** One row per evidence claim asserted in `INTENSICARE_V2_ORCHESTRATOR_PROMPT.md` §2 ("Verified AMH-data evidence snapshot"), re-verified file-by-file against the pinned AMH commit.

**Pinned evidence snapshot.** `Omni-Saude/amh-data-platform@0a07a6f1fab36fb2f5eeee0fcd8e945c95f67116` (branch `main`).

**Drift check (OBSERVED, 2026-08-14).** At the time of this verification the pinned commit was the repository's current `main` HEAD (`default_branch: main`, `pushed_at: 2026-08-14T02:17:51Z`, commit date `2026-08-14T02:17:49Z`). No drift between the evidence snapshot and `main` at verification time. This will not remain true; re-verify at the execution commit.

**Repository metadata (OBSERVED).** `private: true`; `license.spdx_id: NOASSERTION` (GitHub reports no machine-identifiable license). Access via `gh` CLI as `rodaquino-OMNI`, read-only. Nothing was written to the AMH repository.

**Verdict vocabulary.**

| Verdict | Meaning |
|---|---|
| `CONFIRMED-AT-COMMIT` | The file exists at the pinned commit and its text faithfully supports the claim as stated. |
| `CONFIRMED-WITH-NUANCE` | The file supports the claim, but a material qualification, relocation, or added fact changes how the claim must be used. |
| `DIFFERS` | The file exists but its text does not say what the claim says, or says it about a different artifact. |
| `NOT FOUND` | The file or the supporting statement does not exist at the pinned commit. |

**Epistemic note.** Every verdict below is **OBSERVED** at the level of *"this text exists in this file at this commit."* Where the text itself asserts a fact about AMH's running systems or data (row counts, resource counts, table population), the underlying fact remains **SOURCE**, not OBSERVED — this cycle had no environment access. The Verdict column grades the document; it does not grade the world.

**Quotes.** Reproduced verbatim (≤3 lines) in the original language of the source. No PHI, credentials, tokens, or secrets appear in any quote; where source text contained infrastructure identifiers they have been omitted rather than reproduced.

---

## Matrix

### Claim 1 — README: environment provisioning, 52,452 orphan clinical rows, non-blocking checks

| Field | Value |
|---|---|
| **Claim** | Only `dev` is provisioned (`stg`/`prod`/`dr` are not); SAD is draft, targets are not measured production SLAs; 52,452 clinical rows reference absent encounters; most CI checks are non-blocking. |
| **Path** | `README.md` |
| **Blob SHA** | `34c2e698e46a2cb64e767a9633631fa780ecf5ef` |
| **Verdict** | **CONFIRMED-AT-COMMIT** (all four sub-claims) |
| **Confidence** | High (document-level). The environment and CI sub-claims are OBSERVED text with in-repo file references; the 52,452 figure is a SOURCE measurement claim. |

Supporting quotes (`README.md`):

> L8: `| **Ambientes** | **1 de 4 provisionado.** Só `dev` existe — `stg`, `prod` e `dr` custam US$ 0,00 e não têm tfstate.`

> L9: `| **Versão SAD** | 1.0 — mas o [documento](...) declara `Status: Draft for Internal Review`, `Data: Maio 2026`. Não é peça aprovada. |`

> L169: `` `atendimento_paciente` (a espinha, que dá o dono de cada linha) parou em 21/07 enquanto três tabelas de folha clínica avançaram para 04/08. 52.452 linhas clínicas apontam para um atendimento que não existe no pouso. ``

> L202: `**O único required status check é `Security Gate`** ... Os demais workflows rodam mas não bloqueiam merge, e vários estavam vermelhos no [retrato de 2026-08-04]`

Additional OBSERVED fact not in the original claim, material to Gate G3: `README.md` L13 states the Tier 0 NFR targets (RPO < 15 min, RTO < 1h, 99.95% FHIR API) are `alvo declarado, não SLA medido em produção: não há produção` — "a declared target, not a production-measured SLA: there is no production."

---

### Claim 2 — Architecture principles, and the admission that several are not sustained

| Field | Value |
|---|---|
| **Claim** | AMH principles separate FHIR (clinical interop) from dimensional (analytics), require tenant isolation, idempotency, schema compatibility, and streaming for clinical data; the same repository states several principles are not yet fully sustained by implementation/evidence. |
| **Path** | `docs/architecture/principles.md` (principles) + `README.md` (the admission) |
| **Blob SHA** | `6d18497a3cf4ccd785628dd0b24e006c4ba65e20` (principles) / `34c2e698e46a2cb64e767a9633631fa780ecf5ef` (README) |
| **Verdict** | **CONFIRMED-WITH-NUANCE** — every named principle is confirmed in `docs/architecture/principles.md`, but **the admission is not in that file**. It is in `README.md`. The orchestrator prompt cites both files, so the claim as a whole holds; a reader who opens only `docs/architecture/principles.md` will not find the admission. |
| **Confidence** | High |

Supporting quotes (`docs/architecture/principles.md`):

> L36–38: `## 3. Tenant Isolation Everywhere` / `Federation cross-tenant é exceção opt-in com governance explícita, não default operacional.`

> L56–62: `## 5. Streaming-First para Dados Clínicos` / `Eventos clínicos ... chegam via streaming. Batch é fallback ou para enrichment não-crítico.` / `Decisão clínica em UTI não pode esperar pipeline noturno.`

> L126–128: `## 12. FHIR para Clínico, Dimensional para Analytics` / `Não tentamos fazer FHIR servir BI nem dimensional servir interop.`

Also confirmed in the same file: **#6 Idempotent Transformations** (L66–72), **#11 Schema é Contrato** (L116–122), **#4 Identidade Centralizada, Posse Distribuída — "MPI é única para identidade longitudinal"** (L46–52).

The admission (`README.md` L225–227):

> `São princípios de projeto. Vários ainda **não** se sustentam na árvore: os 5 testes de conformidade em quarentena (§ Development setup) são exatamente violações de (2), (4) e (6), e (9) está bloqueado pela pendência #2.`

**Material for V2 (INFERENCE):** the quarantined conformance tests are named by the README as violations of principles **(2) ACID by Default, (4) Identity/MPI, and (6) Idempotent Transformations** — i.e. exactly the principles a safety-critical consumer would most want to rely on. Principle **(5) Streaming-First for clinical data** is separately contradicted by ADR-040's batch-first decision (Claim 3). Neither observation resolves anything; both are inputs to Gate G3.

**Second nuance (OBSERVED).** `docs/architecture/principles.md` L10 designates itself as the derived page and points to `architecture/principles.md` (no `docs/` prefix) plus SAD §5 as the canonical documents. Its outbound links use a `github.com/amh/amh-data-platform` URL that is not the actual repository path. The canonical `architecture/principles.md` was **not** read this cycle. **VALIDATION REQUIRED:** confirm the canonical file agrees before pinning principle text in any contract.

---

### Claim 3 — ADR-040: batch-first FHIR from Bronze, 11,451,908 resources, 7/8 types, not near-real-time, Observation blocked

| Field | Value |
|---|---|
| **Claim** | Current FHIR producer is batch-first from Bronze Iceberg while CDC/MSK/Flink is parked; 11,451,908 FHIR resources across 7 of 8 intended types; explicitly not near-real-time; `Observation` blocked until source results are ingested. |
| **Path** | `architecture/adrs/ADR-040-fonte-bronze-para-fhir-e-fatia-clinica-do-lakehouse.md` |
| **Blob SHA** | `e3aa5998b348242b73060a8f4ea5658c4015c54e` |
| **Verdict** | **CONFIRMED-AT-COMMIT** (all four sub-claims) |
| **Confidence** | High (document-level). Status `Accepted`, dated 2026-07-25. The resource counts are SOURCE measurement claims. |

Supporting quotes:

> L32–34: `**A fonte do canal FHIR é o Bronze Iceberg**, não as views Oracle. O produtor é o adapter batch `pipelines/batch/fhir/bronze_to_fhir.py` (Athena → mapeamento R4 → PUT idempotente no HAPI).`

> L58–59: `- Resultado medido: **11.451.908** recursos FHIR (7/8 tipos) e **5/5** tabelas Gold clínicas construídas.`

> L62–63: `- O Bronze é atualizado em batch, então o canal FHIR **não é near-real-time** enquanto o CDC estiver parqueado.`

> L67–68: `- `Observation` fica bloqueado até os resultados de exame serem ingeridos no Bronze (`docs/reference/fhir-observation-source-request.md`).`

Additional OBSERVED facts material to V2's latency and identity design:

- L56–57: the two tracks are reported as tied — `386.288 Encounters FHIR no HAPI = 386.288 linhas em `gold.fact_atendimento`, do mesmo Bronze`. This is the referential-consistency claim V2 must independently measure against Claim 1's 52,452 orphan rows and Claim 12's `fact_atendimento` null columns.
- L43–46: `**MPI determinístico single-source** (`mpi_id` = f(CPF), fallback id de origem)` and `O `mpi_id` golden é obrigatório no Patient`.
- L69: `O `mpi_id` determinístico não resolve duplicidade sem CPF.`
- L49: ingestion is `**Carga incremental por marca d'água**` — watermark-based, which bears directly on freshness and late-arrival semantics.
- L74–76 (registered pitfalls): bulk PUT measured at `7-65/s` with 504s under concurrency, replaced by batch Bundles at `~412/s`; and a token-expiry defect that lost `~9M escritas` with 401s after the first hour. **These are throughput figures for AMH's own ingestion into HAPI, not read-path latency for a V2 consumer** — they must not be reused as a latency estimate in either direction.

---

### Claim 4 — FHIR IG: R4 4.0.1, package 1.0.0, only Observation profile is laboratory

| Field | Value |
|---|---|
| **Claim** | AMH FHIR IG is R4 4.0.1, package version 1.0.0; the only Observation profile is `Observation-amh-laboratory`; it is not a general vital-signs profile. |
| **Path** | `schemas/fhir-profiles/README.md` |
| **Blob SHA** | `c1d6a5b56bacfac5e516bd8468983c4cebd76b96` |
| **Verdict** | **CONFIRMED-AT-COMMIT** |
| **Confidence** | High |

Supporting quotes:

> L8–11: `**Package ID:** `br.com.americashealth.fhir`` / `**Versão:** 1.0.0` / `**FHIR Version:** R4 (4.0.1)` / `**Status:** active`

> L39: `├── (19 StructureDefinitions de Profile no root)` — the enumerated list (L40–59) contains exactly one Observation profile: `│   ├── Observation-amh-laboratory-profile.json`

> L146: `| `Observation-amh-laboratory` | Observation | bronze_diagnose.diagnose_exame_resultado (estruturado) |`

**OBSERVED cross-reference, material to the portfolio constraint.** The IG maps this single Observation profile to source `bronze_diagnose.diagnose_exame_resultado`. Claim 6's source request states that exact Diagnose/LIS source **is not ingested**. The IG's declared source for its only Observation profile is therefore, by the repository's own account, absent. This is corroboration between two independent files at the same commit, not a new inference.

**Canonical package identifier for the lock:** `br.com.americashealth.fhir` version `1.0.0`, FHIR R4 `4.0.1`. Canonical IG URL `https://fhir.americashealth.com.br/ImplementationGuide/amh`.

---

### Claim 5 — Observation-amh-laboratory profile constraints

| Field | Value |
|---|---|
| **Claim** | The profile requires subject, effective time, laboratory category, a laboratory LOINC binding, and UCUM for quantities. |
| **Path** | `schemas/fhir-profiles/Observation-amh-laboratory-profile.json` |
| **Blob SHA** | `62bff188ea71c2cb737f725d02ccb79c606ba62f` |
| **Verdict** | **CONFIRMED-AT-COMMIT**, with two required elements the claim omits |
| **Confidence** | High |

OBSERVED differential (StructureDefinition `Observation-amh-laboratory`, `version: 1.0.0`, `fhirVersion: 4.0.1`, `status: active`):

| Element | Cardinality | Constraint |
|---|---|---|
| `Observation.extension:mpiId` | **1..1** | *(required — not in the original claim)* |
| `Observation.extension:tenantId` | **1..1** | *(required — not in the original claim)* |
| `Observation.status` | 1..* | — |
| `Observation.category` | 1..* | pattern fixed to `http://terminology.hl7.org/CodeSystem/observation-category` code `laboratory` |
| `Observation.code` | 1..* | bound to `https://fhir.americashealth.com.br/ValueSet/amh-loinc-laboratory` |
| `Observation.subject` | 1..* | — |
| `Observation.effective[x]` | 1..* | — |
| `Observation.value[x].valueQuantity.system` | 0..1 | fixed `http://unitsofmeasure.org` |
| `Observation.encounter` | 0..1 | **optional** |

**Two consequences V2 must carry forward (INFERENCE from the OBSERVED differential):**

1. `Observation.category` is *pattern-fixed to `laboratory`*. A conformant instance of this profile **cannot** carry a vital-sign category. The profile does not merely fail to cover vitals — it structurally excludes them. Any vital-sign delivery requires a new profile, not a reuse of this one.
2. `Observation.encounter` is **optional** while `subject` is mandatory. An ICU pathway that requires encounter-scoped context cannot rely on the profile alone to supply it; encounter linkage is a per-instance population question (evidence Layer 3), not a profile guarantee.

Also OBSERVED: the mandatory `mpiId` extension makes the identity adjudication (ADR-006 vs ADR-041, Claim 8) a **hard blocker on Observation consumption**, not a parallel concern — every conformant Observation carries an MPI reference whose cross-tenant semantics are contested. *Deep adjudication is out of scope here and is handed to the Wave 2 identity analyst.*

---

### Claim 6 — Observation source request: PACIENTE_EXAME zero rows; Diagnose/LIS not ingested

| Field | Value |
|---|---|
| **Claim** | Tasy `PACIENTE_EXAME` had zero rows and the preferred structured Diagnose/LIS source was not ingested; profile existence is not evidence of populated observations. |
| **Path** | `docs/reference/fhir-observation-source-request.md` |
| **Blob SHA** | `85063a76443d5d1edfe0cb67ebad9619d52a00f9` |
| **Verdict** | **CONFIRMED-AT-COMMIT** |
| **Confidence** | High (document-level). Status field reads `aguardando ingestão no Bronze` ("awaiting ingestion into Bronze"), dated 2026-07-24. |

Supporting quotes:

> L11–14: `O 8º — **Observation** (resultados de exame) — está **bloqueado por falta de dado**, não por código: o mapper existe e está pronto ... mas a tabela-fonte no Bronze está **vazia**.`

> L16–19: `A fonte da imagem original do diretor era `EXAME_RESULTADO` do **Diagnose/LIS**, que **não é ingerido** no data lake. O caminho equivalente no Tasy é `PACIENTE_EXAME`, que **existe no catálogo mas veio com 0 linhas** no snapshot atual do Bronze.`

**Additional OBSERVED contradiction found this cycle — not in the orchestrator prompt, and material to any lab-based pathway.** The planned Observation construction in this document (L45–54) emits:

> L49: `Observation.code = {text: "Resultado de exame"}   # LOINC quando houver catálogo`
> L53: `Observation.valueString   = ds_resultado`

That planned shape **does not satisfy the profile verified under Claim 5**, which binds `Observation.code` to the `amh-loinc-laboratory` ValueSet and fixes UCUM on `valueQuantity`. A free-text `code.text` with a `valueString` payload is not a LOINC-coded UCUM quantity. The document itself flags the structured alternative (L64–69): connecting Diagnose/LIS `exame_resultado` via CDC/batch would give `analito/valor/unidade` permitting `Observation.valueQuantity` with LOINC — described as `Maior esforço; recomendada para a fase de resultados laboratoriais estruturados`.

**Recorded as a contradiction; NOT resolved.** Both sides stand: the unblocking plan on record produces non-conformant, non-numeric Observations; the conformant path is a separate, unscheduled effort. **VALIDATION REQUIRED — AMH owners:** which of the two is the intended unblocking path, and does the intended path yield profile-conformant quantities? Until answered, "Observation unblocked" must not be read as "numeric, coded, unit-bearing lab values available." A numeric threshold rule cannot consume a `valueString`.

---

### Claim 7 — Vital-sign contradiction between diagrams and the IG

| Field | Value |
|---|---|
| **Claim** | AMH diagrams claim `EVOLUCAO_PACIENTE` may produce vital-sign Observations and list device-vital ingress, while the inspected IG and source request provide no corresponding vital-sign profile or demonstrated populated source. Preserve as a contradiction for AMH owners; do not infer ICU vitals are available. |
| **Paths** | `architecture/diagrams/data-flows/data-flow-fhir-clinical.md`; `architecture/diagrams/c4-component/c4-component-fhir-pipeline.md` |
| **Blob SHAs** | `50ae2a798f787de0ec03dad58c6ffc53ca6a71bd`; `578ad34f624a2b2a089ec80d2c414e170bb9dc77` |
| **Verdict** | **CONFIRMED-AT-COMMIT** — both sides of the contradiction verified verbatim. **Recorded, NOT resolved.** |
| **Confidence** | High |

**Side A — the diagrams assert vital signs.**

> `data-flow-fhir-clinical.md` L121: `| EVOLUCAO_PACIENTE | `TASY.EVOLUCAO_PACIENTE` | `ClinicalImpression` ou `Observation` | `ClinicalImpression` para notas clínicas livres; `Observation` para sinais vitais |`

> `data-flow-fhir-clinical.md` L140: `| Observation | ✅ (sinais vitais de dispositivos IoT) | ✅ (sinais vitais, resultados) | P95 < 200ms |` — in a table headed `Recursos FHIR Suportados por Direção` with columns `Inbound (parceiro → HAPI)`, `Outbound (HAPI → RNDS)`, `SLA`.

> `c4-component-fhir-pipeline.md` L95: `| EVOLUCAO_PACIENTE | ... | `ClinicalImpression` ou `Observation` | `ClinicalImpression` para texto livre; `Observation` para sinais vitais estruturados (LOINC code) |`

**Side B — the IG and the source request provide no such profile or source.** Claim 4 confirms exactly one Observation profile, category-fixed to `laboratory` (Claim 5). Claim 6 confirms the only Observation source is empty. No vital-signs profile appears among the 19 StructureDefinitions.

**Three OBSERVED facts that sharpen the contradiction without resolving it:**

1. **The diagrams are self-inconsistent.** `c4-component-fhir-pipeline.md` L25 renders the FHIR Mapper Operator's own conversion list as `• EVOLUCAO_PACIENTE → ClinicalImpression` — with **no** Observation branch — while L95 of the same file says `ClinicalImpression` *or* `Observation`. The component's stated behavior and its accompanying table disagree inside one document.
2. **The diagrams are dated earlier than the governing ADR.** `data-flow-fhir-clinical.md` L1–3 reads `# Fluxo FHIR Clínico — CDC → FHIR R4 → HAPI → RNDS` / `> Versão 1.0 | Maio 2026`. ADR-040 (Claim 3) is dated 2026-07-25 and replaced the CDC path with batch-from-Bronze. The diagram describes the parked architecture. **This is an OBSERVED chronology, offered as context only — it is not an adjudication.** Dating a document earlier does not by itself void its claim; only an AMH owner can say whether the vital-sign intent survived ADR-040 or lapsed with the CDC path.
3. **`P95 < 200ms` is a target in a draft diagram, not a measurement.** It appears in the same table as the vital-sign assertion and must not be carried into any latency budget. README L13 (Claim 1) independently characterizes all such NFR figures as declared targets with no production to measure.

**VALIDATION REQUIRED — AMH owners (the single highest-value question in this dossier):** does any populated vital-sign Observation feed exist today in any environment; if not, is one planned; and under what profile, code system, unit binding, and freshness would it be delivered? Until answered, V2 must treat ICU vital signs as **unavailable from AMH**.

---

### Claim 8 — ADR-041: root-CNPJ tenant grain, tenant-local MPI

| Field | Value |
|---|---|
| **Claim** | AMH's tenant grain is root CNPJ, with ten clinical PJs plus `omni` and `grupo_administrativo`; a technical landing zone that is not a business tenant; ADR-041 chooses tenant-local MPI and rejects cross-PJ longitudinal identity for now; this conflicts with ADR-006 and the FHIR IG's longitudinal-MPI language. |
| **Path** | `architecture/adrs/ADR-041-grao-do-tenant-fonte-erp-compartilhada.md` |
| **Blob SHA** | `0e95b1b6edd429c7ffa497970ea9179adbea6adc` |
| **Verdict** | **CONFIRMED-AT-COMMIT** (existence and summary only — see scope note) |
| **Confidence** | High |

> **Scope note.** This row records existence and headline content only. Full adjudication of the ADR-006 / ADR-039 / ADR-041 / IG identity conflict is explicitly **out of scope for this specialist** and is handed to the Wave 2 AMH tenant-and-identity adjudication analyst. ADR-006 and ADR-039 were **not read** this cycle.

Supporting quotes:

> L29: `### 1. O grão é a **raiz de CNPJ** — 12 tenants`

> L45: `- **10 PJs clínicas** (abaixo) — dado de saúde, isolamento pleno.`

> L123: `### 6. O MPI **NÃO cruza tenants** (D3 — decidido pelo owner, 2026-07-26)` / L128: `**Decidido: o MPI é POR TENANT.** Cada PJ tem seu próprio índice`

> L134: `cross-PJ — nem por bug, nem por permissão mal configurada.`

Contextual OBSERVED facts (status `Accepted`, dated 2026-07-26, decider recorded as `owner do produto`):

- L20–22: `**49 estabelecimentos / 49 CNPJs** dentro do tenant `austa_clinicas`` — of which `Apenas **12** têm dado clínico; **Austa Hospital sozinho = 89,2%** dos 386.288 atendimentos`. **INFERENCE:** clinical data is heavily concentrated in one PJ; "12 tenants exist" is not "12 tenants carry usable clinical data."
- L22: `**4.220 pacientes (3,88%)** têm atendimento em mais de uma PJ` — the population the tenant-local MPI decision deliberately declines to link.
- L29–33: the ADR records its own correction from 10 to 12 tenants during Wave 2 execution.
- L70–74: `Como a fonte é **uma instância Tasy só**, não existem 10 ingestões — existe uma` / `Tasy (1 instância) → tenant de POUSO (1 ingestão) → reparticiona → 10 Bronzes por PJ` — confirms the landing zone as a technical stage.
- L85: `Os 10 tenants de PJ têm `cdc_enabled = false` — consomem do pouso, não do Oracle.`

The opposing IG language is OBSERVED at `schemas/fhir-profiles/README.md` L240 (`## Modelo de identidade longitudinal (MPI)`) and L257 (`├── extension amh-mpi-id: "..."        ← chave estável cross-tenant` — "stable key cross-tenant"). **Both sides recorded; neither adopted.**

---

### Claim 9 — HAPI partitioning: URL-partition tenancy, token-tenant must equal URL tenant, cross-partition references disabled, bootstrap incomplete

| Field | Value |
|---|---|
| **Claim** | HAPI tenant isolation is URL-partitioned; the authenticated token tenant must equal the URL tenant; cross-partition references are disabled; partition bootstrap is documented as incomplete. Compatibility tests must use actual URL/claim behavior, not a caller-supplied header. |
| **Path** | `applications/hapi-fhir/config/partitioning-config.md` |
| **Blob SHA** | `ab77f80e11401387e04201101361a87937b0dc8e` |
| **Verdict** | **CONFIRMED-AT-COMMIT** (all four sub-claims) |
| **Confidence** | High — this is the most rigorously self-corrected document read this cycle; it explicitly retracts its own prior false statements and names the verification date (2026-08-03). |

Supporting quotes:

> L19: `      allow_references_across_partitions: false`

> L34–37: `**A identificação de tenant não se escolhe por chave**: a simples PRESENÇA do bloco `partitioning` faz o starter registrar o `RequestTenantPartitionInterceptor` e a `UrlBaseTenantIdentificationStrategy` ... É por URL, sempre.`

> L62–64: `- **Compara o tenant do token com o tenant da URL e nega quando divergem** — e nega também quando não há tenant na URL. É este passo que faz o isolamento por PJ, não um header.`

> L89–91: `## Bootstrap — PENDÊNCIA, não está implementado` / `> **`com.amh.fhir.bootstrap.PartitionInitializer` NÃO EXISTE.**`

Additional OBSERVED facts material to V2 client design and negative testing:

- L58–59: the interceptor `Recusa a requisição que traga `X-Partition-Name` ou `X-Request-Partition-IDs` do cliente (403)`. A V2 client must never send these; a negative test should assert the 403.
- L72–75: the `X-Partition-Name` header the interceptor *writes* `NÃO é lido por nada hoje`.
- L22–32: five previously documented configuration keys `estavam documentados aqui e nos YAMLs, e o Spring os IGNORA em silêncio`. **INFERENCE:** documented-but-silently-ignored configuration is a demonstrated failure mode in this repository — a direct argument for Gate G3's requirement that deployed behavior be tested rather than read.
- L99–105: `**as partições não são criadas por este servidor**` — a request to `/fhir/<tenant>/...` for a tenant without a partition `falha no HAPI`. **VALIDATION REQUIRED:** which partitions actually exist in the target environment. Only `tenant_austa_clinicas` and `tenant_omni_saude` are listed as pre-created (L43–44), against the 12 tenants of ADR-041.

---

### Claim 10 — CapabilityStatement (SMART) vs HAPI README (mTLS / service auth)

| Field | Value |
|---|---|
| **Claim** | The CapabilityStatement advertises OAuth/SMART, while the HAPI README describes mTLS and current service authentication with SMART as future work. Determine the deployed contract empirically. |
| **Paths** | `schemas/fhir-profiles/CapabilityStatement-amh-server.json`; `applications/hapi-fhir/README.md` |
| **Blob SHAs** | `9b1628733667d974369ceccac19d8f1d25dc3300`; `8382aee5f9f9a73add1ce6c22871f7111de97db2` |
| **Verdict** | **CONFIRMED-AT-COMMIT** — both sides verified. **Recorded, NOT resolved.** A **third** position was found this cycle (below), making it a three-way divergence rather than a two-way one. |
| **Confidence** | High |

**Side A — CapabilityStatement** (`id: amh-server`, `version: 1.0.0`, `status: active`, `fhirVersion: 4.0.1`, `date: 2026-05-10`), `rest[0].security`:

> `"service": [{"coding": [{"system": "http://terminology.hl7.org/CodeSystem/restful-security-service", "code": "OAuth"}, {... "code": "SMART-on-FHIR"}]}]`
> `"description": "AWS Cognito + IAM Identity Center backed. Scopes: patient/*.read, user/*.read, system/*.read, system/*.write."`

**Side B — HAPI README** (`applications/hapi-fhir/README.md` L78–82):

> `## Auth` / `- mTLS para serviços internos.` / `- SMART on FHIR (OAuth 2.0) para apps externas (futuro).` / `- Lambda authorizer para tenant validation.`

**Side C — NEW, OBSERVED this cycle, not in the orchestrator prompt.** An implemented, unit-tested OAuth2/JWT authorizer exists in the tree at `applications/lambdas/lambda-authorizer-fhir/` (`src/app.py`, `src/jwt_validator.py`, `src/jwks_cache.py`, `src/policy_builder.py`, plus four test modules). Its README states:

> `API Gateway Lambda authorizer validating OAuth2 JWT tokens (OIDC) against JWKS and enforcing SMART on FHIR scopes with multi-tenant context resolution.`

> `` `exp`, `iss`, `aud`, `sub`, `tenant` and `scope` are **required** claims — a token missing any of them is rejected ``

> `The `tenant` claim is **mandatory and never defaulted**. The `X-Partition-Name` header is *not* consulted`

> `**Fail-closed**: any error, missing claim, unparseable ARN or unexpected exception produces an explicit Deny`

**Why this matters and what it does not settle.** Side C is *code in the repository at the pinned commit* — evidence Layer 1 (declared contract), the same layer as Sides A and B. It is **not** evidence that this authorizer is deployed, wired to the FHIR ALB, or reachable by a V2 client. It does show the SMART-scope path is further along than the README's `(futuro)` implies, and it is directly consistent with Claim 9's URL/claim tenancy rule (both reject client-supplied partition headers, both fail closed).

Note also that the procedure document of Claim 15 names its authorizer `fhir-api-authorizer`, which **does not exist** in the tree; the implemented one is `lambda-authorizer-fhir`. The names differ.

**All three sides recorded. None adopted. VALIDATION REQUIRED — AMH owners + empirical discovery:** what is the actually deployed authentication mechanism per environment, is `lambda-authorizer-fhir` in the live request path, and what does live `/fhir/<tenant>/metadata` advertise? Per prompt §7.4, V2 must support SMART only after discovery, scopes, token validation, audience/issuer, tenant binding and negative tests prove it exists.

---

### Claim 11 — Data-quality CodeSystem: `valid | warning | quarantined` only

| Field | Value |
|---|---|
| **Claim** | The AMH data-quality vocabulary is only `valid \| warning \| quarantined`, and must not be conflated with IntensiCare's evaluation states. |
| **Path** | `schemas/fhir-profiles/code-systems/CodeSystem-amh-data-quality-status.json` |
| **Blob SHA** | `b79311728203a7c09603654430569b28d4c894ef` |
| **Verdict** | **CONFIRMED-AT-COMMIT** |
| **Confidence** | High — `content: "complete"` and `count: 3` make the closure of the vocabulary explicit in the resource itself. |

OBSERVED (`url: https://fhir.americashealth.com.br/CodeSystem/amh-data-quality-status`, `version: 1.0.0`, `status: active`, `caseSensitive: true`, `date: 2026-05-10`):

> `"description": "Status de qualidade de dados emitido pelo Silver-Rules da plataforma AMH. Espelha a coluna _dq_status das tabelas Silver-Rules."`

| Code | Definition (verbatim, abridged) |
|---|---|
| `valid` | `Registro passou todas as regras de DQ aplicáveis. Aprovado para uso em Silver-Entities e Gold.` |
| `warning` | `Registro passou nas regras críticas mas tem violações não-bloqueantes. Promovido a Silver-Entities com flag visível.` |
| `quarantined` | `Registro falhou em pelo menos uma regra crítica. Não é promovido a Silver-Entities; fica na tabela _quarantine para revisão por steward.` |

**Non-conflation rule (per prompt §7.6, restated as binding on this dossier).** AMH `valid | warning | quarantined` is a **source data-quality** dimension. IntensiCare's `valid | partial | not_evaluated | stale | invalid` is a **V2 evaluation-status** dimension. They are orthogonal and must never be collapsed. Two directional facts follow from the definitions above and must survive into any mapping matrix:

- AMH `valid` means "passed AMH's Silver-Rules." It carries **no** freshness assertion and **no** pathway-sufficiency assertion. A record can be AMH-`valid` and simultaneously V2-`stale` or V2-`not_evaluated`.
- AMH `quarantined` means the record was **not promoted**. It must never surface as a normal V2 value under any mapping.
- The vocabulary is scoped to Silver-Rules `_dq_status`. **VALIDATION REQUIRED:** whether any `_dq_status` is carried onto FHIR resources served by HAPI at all — if it is not, a V2 consumer of the FHIR lane may receive **no** source-quality signal, which is a stronger constraint than a mismatched vocabulary.

---

### Claim 12 — Gold sweep: 21 empty tables, 21 all-null-business-column tables

| Field | Value |
|---|---|
| **Claim** | A measured Gold sweep found 21 empty tables and 21 tables with entirely null business columns, and warns that a present schema and successful query can still return misleading absence. |
| **Path** | `docs/status/varredura-de-vazios-na-gold-2026-08-13.md` |
| **Blob SHA** | `f07fab40d6024bfbd123c25f05f8ad10fbc97389` |
| **Verdict** | **CONFIRMED-AT-COMMIT** |
| **Confidence** | High (document-level). The sweep is a SOURCE measurement claim dated 2026-08-13, one day before the pinned commit; it names its method (one query per table, per-company workgroup) and its scope (93 Gold tables, 12 companies). |

Supporting quotes:

> L31: `## 1 · Vinte e uma tabelas Gold com ZERO linhas`

> L50: `## 2 · Vinte e uma tabelas com coluna que existe e nunca foi preenchida`

> L21–24: `Coluna ausente quebra a consulta; coluna vazia devolve `NULL` com HTTP 200, e quem consome lê ausência como afirmação — "este paciente não tem histórico", "este hospital não teve receita".`

> L42: `Existem no catálogo, com esquema, e sem uma linha. *"Qual a receita do IOP em julho?"* devolve resultado vazio bem-formado — não um erro.`

Additional OBSERVED facts:

- The document records its author's own error of the same class (L125–127): `eu li o esquema e afirmei conteúdo` — "I read the schema and asserted content." This is the precise failure mode prompt §7.2 forbids ("profile exists"/"table exists"/"HTTP 200" is not evidence).
- `austa_hospital.fact_atendimento` — 344,414 rows — has `insurance_guide`, `total_amount_raw`, `paid_amount_raw` 100% null; the commit message for the pinned commit reports the same three columns null across **nine** companies, ~386k encounters.
- **A tenant named `iop_uti` appears among the companies with zero-row Gold tables.** `uti` is the Portuguese abbreviation for ICU. **This is a name in a table, not an established fact about ICU data** — no inference is drawn here as to whether this tenant is clinically relevant to V2. **VALIDATION REQUIRED — AMH owners:** confirm what `iop_uti` is and whether it holds ICU clinical data.
- L136–142: the document proposes the sweep become a recurring weekly job with alerting, and states it `Como teste automatizado ela não cabe (precisa de AWS e de dado real)`. **INFERENCE:** this is a direct precedent for the live-data fitness checks prompt §7.6 requires of V2 — and confirms such checks cannot be satisfied by CI alone.

**Scope caveat (OBSERVED).** The sweep covers the **Gold/analytical** layer, not HAPI FHIR resources. It is evidence about the reconciliation lane, and must not be read as a population measurement of the FHIR clinical lane.

---

### Claim 13 — Maezo contract manifest: publication pattern, pinned producer commit

| Field | Value |
|---|---|
| **Claim** | `schemas/contracts/maezo/v1/contract-manifest.yaml` demonstrates a valuable publication pattern (pinned producer commit, schema digests, fixtures, compatibility mode, security classification, approval record, registry version IDs), pinning producer commit `09a0a282e69f49aa9c6944b25afb35eee65fcc9c`. |
| **Path** | `schemas/contracts/maezo/v1/contract-manifest.yaml` |
| **Blob SHA** | `76fbc9bd030395e1c1b796fe4821fc60556a2d35` |
| **Verdict** | **CONFIRMED-AT-COMMIT** for the pattern and the producer commit. **DIFFERS** on publication status versus the README's description of the same file (below). |
| **Confidence** | High |

Producer commit verified:

> L14: `amh_commit_sha: 09a0a282e69f49aa9c6944b25afb35eee65fcc9c`

Independently verified via the GitHub API: commit `09a0a282e69f49aa9c6944b25afb35eee65fcc9c` **exists** in the repository (**OBSERVED**), consistent with the orchestrator prompt's note that it was verified 2026-08-05.

Publication-pattern fields OBSERVED in the manifest:

| Field | Value at pinned commit |
|---|---|
| `manifest_version` | `1.0.0` |
| `status` | `PUBLISHED` |
| `contract_name` | `amh-maezo-boundary` |
| `canonical_schema_version` | `1.0.0` |
| `amh_commit_sha` | `09a0a282e69f49aa9c6944b25afb35eee65fcc9c` |
| `manifest_sha256` | `SELF-AT-PUBLICATION` (by design, computed by the consumer over the published file) |
| `compatibility_mode` | `BACKWARD` |
| `topics` | 3, each with a paired `.quarantine.v1` topic |
| `envelope.field_count` | `28`, with a frozen `field_order` |
| `artifacts` / `fixtures` | 6 artifacts with digests; 9 fixtures including 3 deliberately `.invalid.json` negatives |
| `security_classification` | per-artifact PHI statements |
| `approval_record` | 4 named-role attestations |
| `compatibility_report` | `result: PASSED`, `provider_contract_tests: "90 passed"`, dry-run id + URL, evidence artifact id, `prepublication_manifest_sha256` |
| `glue_registration` | `environment: dev`, `region: sa-east-1`, `registry_name: amh-fhir-dev`, 3 non-null `schema_version_ids`, `schema_version_status: AVAILABLE`, `published_at_utc: 2026-08-05T09:07:40Z` |
| `evidence_id` | `XRG2-AMH-DEV-GHA-30991849241` |

**DIFFERS — an internal contradiction at the pinned commit.** `README.md` L176 describes this same file as unpublished:

> `[o manifesto](./schemas/contracts/maezo/v1/contract-manifest.yaml) está `status: UNPUBLISHED`, com `glue_registration.registry_name: null`, os 3 `schema_version_ids: null` e `evidence_id: SET-AT-PUBLICATION`.`

Every one of those four assertions is false of the file as it stands at the pinned commit: status is `PUBLISHED`, `registry_name` is `amh-fhir-dev`, all three `schema_version_ids` are populated UUIDs, and `evidence_id` is `XRG2-AMH-DEV-GHA-30991849241`. The README anticipates exactly this in the same line — `**Esta linha envelhece rápido — confira ao vivo antes de agir**` ("this line ages fast — check live before acting"). **Recorded as an observed documentary divergence; not resolved.** The manifest is the more specific artifact and is self-dated, but which is authoritative is an AMH owner's call, not this specialist's.

**Two constraints on reuse (both PROPOSAL-level, per prompt §7.5):**

1. `glue_registration.environment: dev`. The publication that this manifest evidences occurred in **dev** — the only provisioned environment (Claim 1). The pattern is proven; it is not proven in a production-like environment.
2. The manifest's own header states the boundary is AMH-owned and editable only in the AMH repository: `AMH-owned — edição SOMENTE em Omni-Saude/amh-data-platform (XRD-04)`. An AMH×IntensiCare manifest at `schemas/contracts/intensicare/v1/` would therefore require **AMH-owner authority to create and own** — this dossier proposes; it cannot place the file.

---

### Claim 14 — Maezo subject-context API: read-only, purpose-bound, no observations

| Field | Value |
|---|---|
| **Claim** | The subject-context API is read-only, purpose-bound and fail-closed, exposing encounters, conditions and coverage — **not** observations. |
| **Path** | `schemas/openapi/maezo/v1/subject-context.openapi.yaml` |
| **Blob SHA** | `a2811246ffd9f8ba8fcdbf52a1576499751fbd58` |
| **Verdict** | **CONFIRMED-AT-COMMIT** |
| **Confidence** | High |

OBSERVED (`title: AMH Subject Context API (ClinicalContextPort)`, `version: 1.0.0`):

> L16: `` keyed por `portable_subject_ref` (ADR-042 XRD-05/XRD-06). READ-ONLY por contrato: somente métodos GET.``

> L19–20: `Semântica fail-closed: ausência de consent válido para o `purpose_of_use` informado resulta em `403` com `reason` (`consent_denied` | `purpose_not_permitted` | `scope_not_supported`)`

> L3: `# read-only; só a AMH escreve no HAPI. AMH-owned — edição SOMENTE em`

The four operations, all `get` (OBSERVED):

| Path | operationId |
|---|---|
| `/subjects/{portable_subject_ref}/context` | `getSubjectContext` |
| `/subjects/{portable_subject_ref}/context/encounters` | `listSubjectEncounters` |
| `/subjects/{portable_subject_ref}/context/conditions` | `listSubjectConditions` |
| `/subjects/{portable_subject_ref}/context/coverage` | `getSubjectCoverage` |

**Absence of observations is structurally enforced, not merely unimplemented.** The context response schema constrains its sections to a closed enum (L220): `enum: [encounters, conditions, coverage]`. There is no observation path, no observation schema, and no enum member that could carry one. Adding observations to this API would be a breaking contract change, not an extension.

**Two further OBSERVED constraints on any V2 reuse:**

- The summaries are deliberately impoverished for privacy: encounters are `Sem prestador nominal, sem notas, sem texto livre` (L67); conditions are `Nunca texto livre de evolução/laudo` (L93). This is correct privacy engineering **and** it means the API cannot supply the granularity an ICU pathway needs.
- Access is keyed by an opaque `portable_subject_ref`, and `purpose_of_use` is a required parameter evaluated fail-closed per `{subject, purpose}`.

**INFERENCE (consistent with prompt §7.5):** this API is a strong *pattern* for a purpose-bound read-only context port and a poor *interface* for ICU evaluation inputs. V2 must not reuse Maezo topic names or payloads; it must create its own contract.

---

### Claim 15 — FHIR API access procedure: illustrative pseudocode, not an implemented control

| Field | Value |
|---|---|
| **Claim** | The AMH FHIR access procedure contains illustrative authentication pseudocode and must not be imported as an implemented control. |
| **Path** | `infrastructure/policies/fhir/fhir-api-access-procedure.md` |
| **Blob SHA** | `a09cc1d53aad62d9fd28aa937b0d020a07a7d9a3` |
| **Verdict** | **CONFIRMED-WITH-NUANCE** — the substance of the claim (do not import as an implemented control) is confirmed and independently corroborated. The word "pseudocode" is the orchestrator prompt's characterization; the document labels the block `**Code Snippet:**` in a ```python fence. |
| **Confidence** | High |

OBSERVED (`infrastructure/policies/fhir/fhir-api-access-procedure.md`):

> L1–7: `# FHIR API Access & External System Onboarding` / `**Purpose:** Procedural controls for onboarding external healthcare systems ... to consume FHIR APIs`

> L187–192: `### 4.1 Custom Authorizer Lambda (fhir-api-authorizer)` / `**Runtime:** Python 3.11 on Lambda` / `**Code Snippet:**` / ```` ```python ````

The block (L192–283) defines `lambda_handler`, `log_failed_auth`, `allow`, `deny`, and calls helpers (`extract_partner_from_cert`, `is_cert_valid`) that the block does not define.

**Independent OBSERVED corroboration — stronger than the original claim.** The authorizer this procedure names, **`fhir-api-authorizer`, does not exist anywhere in the repository tree** at the pinned commit (searched across all 3,685 tree entries). The implemented authorizer is named `lambda-authorizer-fhir` (Claim 10, Side C) and has a materially different design: it validates OIDC JWTs against JWKS with required `exp`/`iss`/`aud`/`sub`/`tenant`/`scope` claims and enforces SMART scopes, whereas the procedure's snippet is organized around mTLS partner certificates and Lake Formation checks. **The document's snippet therefore describes a component that is not the one that exists.** This is exactly why it must not be imported as a control.

**INFERENCE:** the procedure remains useful as evidence of *intended* onboarding governance (DPA, CNES/DNE verification, security questionnaire, TLS/MFA acceptance criteria) — organizational controls a V2 integration would have to satisfy — but its technical authentication content is stale relative to the code in the same commit. **VALIDATION REQUIRED — AMH owners:** which document, if any, is the authoritative onboarding procedure for a new FHIR consumer.

---

## Cross-cutting negative findings (OBSERVED this cycle)

These are absences verified by full-tree enumeration at the pinned commit (3,685 entries), not inferred:

| Finding | Evidence |
|---|---|
| **No AMH×IntensiCare contract exists.** `schemas/contracts/` contains exactly two entries: `maezo/` and `source-authority/`. There is no `intensicare/` path. | Tree enumeration at pinned commit |
| **"IntensiCare" appears twice in the repository, both incidentally** — in `docs/planning/plano-5f-5h-maezo-2026-08-13.md` (a narrative listing GitHub repos a token could see) and `runbooks/routine/ROT-06-legacy-vpn-decommission.md`. Neither is a contract, interface, or integration reference. | GitHub code search, 2 total hits |
| **No MCP material in the active tree.** Zero paths matching `mcp`; zero code-search hits for "model context protocol". Consistent with the orchestrator prompt's §2 closing statement. MCP is a new V2 interface requiring its own ADR — not inherited AMH compatibility. | Tree enumeration + code search |
| **`schemas/openapi/` contains only Maezo APIs** — `subject-context.openapi.yaml` and `population-features.openapi.yaml`. There is no general-purpose or clinical AMH REST API specification in this directory. | Tree enumeration |
| **License is `NOASSERTION`.** GitHub identifies no machine-readable license for this private repository. Code-reuse licensing and ownership (prompt §7.1, final bullet) is therefore unresolved. | Repository metadata API |

---

## Verdict summary

| # | Claim | Verdict |
|---|---|---|
| 1 | README — env provisioning, 52,452 orphans, non-blocking checks | CONFIRMED-AT-COMMIT |
| 2 | Principles + admission several are not sustained | CONFIRMED-WITH-NUANCE (admission lives in README, not the principles file) |
| 3 | ADR-040 — batch-first, 11,451,908 resources, 7/8 types, not NRT, Observation blocked | CONFIRMED-AT-COMMIT |
| 4 | FHIR IG — R4 4.0.1, package 1.0.0, sole Observation profile is laboratory | CONFIRMED-AT-COMMIT |
| 5 | Observation-amh-laboratory constraints | CONFIRMED-AT-COMMIT (+2 required extensions the claim omits) |
| 6 | Observation source request — PACIENTE_EXAME zero rows, Diagnose/LIS not ingested | CONFIRMED-AT-COMMIT (+ new profile-vs-plan contradiction) |
| 7 | Vital-sign contradiction (diagrams vs IG) | CONFIRMED-AT-COMMIT — recorded, NOT resolved |
| 8 | ADR-041 — root-CNPJ grain, tenant-local MPI | CONFIRMED-AT-COMMIT (existence/summary only) |
| 9 | HAPI partitioning — URL tenancy, token=URL, no cross-partition refs, bootstrap incomplete | CONFIRMED-AT-COMMIT |
| 10 | CapabilityStatement vs HAPI README auth | CONFIRMED-AT-COMMIT — recorded, NOT resolved; now **three-way** |
| 11 | DQ CodeSystem — valid/warning/quarantined only | CONFIRMED-AT-COMMIT |
| 12 | Gold sweep — 21 empty, 21 all-null | CONFIRMED-AT-COMMIT |
| 13 | Maezo manifest — pattern + producer commit | CONFIRMED-AT-COMMIT / **DIFFERS** vs README's description of the same file |
| 14 | subject-context API — read-only, purpose-bound, no observations | CONFIRMED-AT-COMMIT |
| 15 | FHIR access procedure — illustrative, not an implemented control | CONFIRMED-WITH-NUANCE (corroborated: the named Lambda does not exist) |

**Aggregate: 15 of 15 files exist at the pinned commit. 0 NOT FOUND. 12 CONFIRMED-AT-COMMIT, 2 CONFIRMED-WITH-NUANCE, 1 with an internal DIFFERS against another file's description of it.** The orchestrator prompt's evidence snapshot is, on this verification, accurate. Three contradictions are recorded and left open; three material facts were found that the snapshot did not contain (the profile-vs-plan Observation shape mismatch, the third position in the auth divergence, and the non-existence of the procedure's named authorizer).

---

*Prepared by the AMH-data compatibility architect (Wave 1). Read-only verification; nothing was written to the AMH repository. No PHI, credentials, or tokens appear in this document.*
