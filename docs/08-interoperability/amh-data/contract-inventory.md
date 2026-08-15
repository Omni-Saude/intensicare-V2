---
doc_id: AMH-CONTRACT-INVENTORY
status: PROPOSAL
owner: UNASSIGNED — VALIDATION REQUIRED
source: Omni-Saude/amh-data-platform @ 0a07a6f1fab36fb2f5eeee0fcd8e945c95f67116 (pinned evidence snapshot, main); INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §7.5 (candidate contracts, not pre-approved interfaces)
date_collected: 2026-08-14
collector: AMH-data compatibility architect
last_updated: 2026-08-14
---

# AMH×IntensiCare — Candidate Contract Inventory

**Status of every entry in this document: `PROPOSAL`.**

Nothing here is an approved interface, an agreed contract, or a commitment by either party. Per orchestrator prompt §7.5, the candidate contracts listed are `Candidate contracts—not pre-approved interfaces`. Per §7.1, `Do not treat internal filenames or undocumented implementation details as supported contracts. Ask the AMH owners to designate authoritative interfaces.`

**Pinned evidence snapshot.** `Omni-Saude/amh-data-platform@0a07a6f1fab36fb2f5eeee0fcd8e945c95f67116` (`main`).

**No transport is chosen or implied.** §7.5 requires FHIR REST/Subscriptions, a published event stream, controlled batch exchange and other warranted options to be compared against latency, durability, replay, coupling, standards fit, AMH operational reality and cost. This inventory names *what might be exchanged*, never *how*. MCP is not a clinical ingestion transport or system of record.

---

## How to read the evidence-layer columns

| Layer | Passing means |
|---|---|
| **L1 Declared** | A schema, profile, API spec, manifest or ADR exists at the pinned commit and is coherent |
| **L2 Deployed** | Discoverable and reachable by an authorized V2 client in a named environment |
| **L3 Populated** | Representative tenants have non-empty resources with meaningful field distributions |
| **L4 Fit** | Measured latency, completeness, ordering, correction, availability, replay, recovery |

`—` means **no evidence exists in this cycle**, not "fails". Layers 2 and 4 are `—` for **every** entry: this cycle had no environment access. Layer 3 is `—` for every entry as *observed* evidence; where AMH documents assert something about population, it is marked **SOURCE** and remains pending environment verification.

---

## A. Existing AMH artifacts — candidates for consumption

These exist at the pinned commit. Listing an artifact is **not** a proposal to consume it; it is a proposal to *evaluate* it.

### A1. FHIR R4 resources via HAPI — Patient / Encounter / Condition and related context

| | |
|---|---|
| **Status** | **PROPOSAL** — evaluate as the primary context source |
| **Artifact** | `schemas/fhir-profiles/` — IG package `br.com.americashealth.fhir` v1.0.0, FHIR R4 4.0.1; 19 profile StructureDefinitions |
| **L1 Declared** | **PASSES.** OBSERVED: profiles for Patient, Encounter, Condition, Coverage, Organization, Location, Practitioner, PractitionerRole, Medication, MedicationRequest, MedicationDispense, DiagnosticReport, ClinicalImpression, Procedure, ServiceRequest, AllergyIntolerance, Composition, Bundle |
| **L2 Deployed** | — |
| **L3 Populated** | — (OBSERVED none). **SOURCE:** ADR-040 claims 11,451,908 resources across 7/8 clinical types and 386,288 Encounters reconciling 1:1 with `gold.fact_atendimento` |
| **L4 Fit** | — . **SOURCE:** ADR-040 states the channel is `não é near-real-time` |
| **Known constraints (OBSERVED)** | Tenant is URL-partitioned; the token tenant claim must equal the URL tenant; client-supplied partition headers are rejected with 403; cross-partition references are disabled. Partition bootstrap is **not implemented** — only `tenant_austa_clinicas` and `tenant_omni_saude` are listed as pre-created, against ADR-041's 12 tenants; a request for a tenant without a partition fails |
| **Open risk** | **SOURCE:** 52,452 clinical rows reference an encounter absent from the landing zone. Referential presence must be measured, not assumed |
| **Verdict** | Most promising candidate. Requires L2–L4 evidence before any pathway depends on it |

### A2. FHIR Observation — laboratory profile

| | |
|---|---|
| **Status** | **PROPOSAL — evaluate only; currently blocked** |
| **Artifact** | `schemas/fhir-profiles/Observation-amh-laboratory-profile.json` v1.0.0 |
| **L1 Declared** | **PASSES** as a profile. OBSERVED requirements: `extension:mpiId` 1..1, `extension:tenantId` 1..1, `status` 1..*, `category` pattern-fixed to `laboratory`, `code` bound to `amh-loinc-laboratory`, `subject` 1..*, `effective[x]` 1..*, `valueQuantity.system` fixed to UCUM. `encounter` is **optional** |
| **L2 Deployed** | — . *(Note: the CapabilityStatement does list `Observation` among supported resource types — a declared capability, not a deployment observation, and not a population claim)* |
| **L3 Populated** | **FAILS on AMH's own account.** SOURCE: `PACIENTE_EXAME` `existe no catálogo mas veio com 0 linhas`; Diagnose/LIS `não é ingerido`; ADR-040: `Observation fica bloqueado` |
| **L4 Fit** | — |
| **Blocking contradiction (C-4)** | The unblocking plan of record emits `code = {text: "Resultado de exame"}` and `valueString`, which **does not conform** to this profile's LOINC + UCUM requirements. Recorded, unresolved |
| **Verdict** | Not consumable. Even when unblocked, may deliver free text rather than numbers. **Acceptance condition for V2:** LOINC-coded, UCUM-quantified values — not merely "Observations exist" |

### A3. AMH data-quality status vocabulary

| | |
|---|---|
| **Status** | **PROPOSAL** — adopt as an input dimension **only**, never as V2 evaluation status |
| **Artifact** | `schemas/fhir-profiles/code-systems/CodeSystem-amh-data-quality-status.json` v1.0.0, `content: complete`, `count: 3` |
| **L1 Declared** | **PASSES.** OBSERVED: `valid`, `warning`, `quarantined`, scoped to the Silver-Rules `_dq_status` column |
| **L2 Deployed** | — |
| **L3 Populated** | — . **Unknown and material:** whether `_dq_status` is carried onto FHIR resources at all |
| **L4 Fit** | — |
| **Binding rule** | AMH `valid \| warning \| quarantined` is **source data quality**. V2 `valid \| partial \| not_evaluated \| stale \| invalid` is **evaluation status**. Orthogonal dimensions; never collapse. AMH `valid` carries **no** freshness or sufficiency assertion — a record can be AMH-`valid` and V2-`stale`. AMH `quarantined` must **never** surface as a normal V2 value |
| **Verdict** | Adopt as a mapped input if it is actually delivered. If the FHIR lane carries no quality signal, V2 receives **no** source-quality dimension and must derive quality itself — a stronger constraint than a vocabulary mismatch |

### A4. Gold / Athena / Iceberg analytical outputs

| | |
|---|---|
| **Status** | **PROPOSAL** — evaluate for the reconciliation lane only, never the live safety loop |
| **Artifact** | `amh_*_gold` (93 tables across 12 companies, per the 2026-08-13 sweep) |
| **L1 Declared** | Partial. dbt models and Gold tables exist; **no published consumer contract for them was found** this cycle. Per §7.1, undocumented internals are not supported contracts |
| **L2 Deployed** | — |
| **L3 Populated** | — . **SOURCE:** 21 tables with zero rows; 21 with a 100%-null business column; `austa_hospital.fact_atendimento` (344,414 rows) has three financial columns 100% null |
| **L4 Fit** | — . Batch/analytical by design |
| **Critical warning (OBSERVED)** | An empty table returns `NULL` with HTTP 200 — `quem consome lê ausência como afirmação`. A conformance suite checking only response codes will pass against entirely empty data |
| **Verdict** | Consistent with §7.0's hypothesis: reconciliation, backfill, outcomes, quality surveillance, analytics — **not** the live safety loop. Requires a designated consumer contract before use |

### A5. Maezo subject-context API — **pattern only, NOT for reuse**

| | |
|---|---|
| **Status** | **PROPOSAL — reference pattern. Explicitly NOT proposed for consumption** |
| **Artifact** | `schemas/openapi/maezo/v1/subject-context.openapi.yaml` v1.0.0 |
| **L1 Declared** | **PASSES.** OBSERVED: four GET operations (`getSubjectContext`, `listSubjectEncounters`, `listSubjectConditions`, `getSubjectCoverage`), opaque `portable_subject_ref` key, mandatory `purpose_of_use`, fail-closed 403 with explicit reason, sections a **closed enum** `[encounters, conditions, coverage]` |
| **L2/L3/L4** | — |
| **Why not for reuse** | §7.5: `Create a dedicated contract package; do not reuse Maezo topic names or payloads.` It exposes **no observations** — structurally, not incidentally: adding them would be a breaking change. Its summaries are deliberately impoverished (`Sem prestador nominal, sem notas, sem texto livre`; `Nunca texto livre de evolução/laudo`) — correct privacy engineering, and insufficient granularity for ICU evaluation. It is AMH-owned and Maezo-scoped |
| **Verdict** | Excellent **model** for a purpose-bound read-only context port. Wrong **interface** for ICU inputs |

### A6. Maezo contract manifest — **pattern only, NOT for reuse**

| | |
|---|---|
| **Status** | **PROPOSAL — reference pattern for the AMH×IntensiCare manifest** |
| **Artifact** | `schemas/contracts/maezo/v1/contract-manifest.yaml`, pinning producer commit `09a0a282e69f49aa9c6944b25afb35eee65fcc9c` (independently verified to exist) |
| **L1 Declared** | **PASSES.** OBSERVED fields: `manifest_version`, `status`, `contract_name`, `canonical_schema_version`, `amh_commit_sha`, `manifest_sha256` (`SELF-AT-PUBLICATION` by design), `compatibility_mode: BACKWARD`, 3 topics each with a `.quarantine.v1` pair, frozen 28-field envelope with fixed `field_order`, 6 digested artifacts, 9 fixtures (3 deliberately invalid), per-artifact `security_classification`, 4-role `approval_record`, `compatibility_report` (`PASSED`, 90 provider tests, dry-run + evidence IDs), `glue_registration` (env `dev`, registry `amh-fhir-dev`, 3 schema version UUIDs), `evidence_id` |
| **L2 Deployed** | Publication exercised in **`dev` only** |
| **L3/L4** | — |
| **Recorded contradiction (C-3)** | README describes this file as `status: UNPUBLISHED` with null registry fields; the file reads `PUBLISHED` with populated fields. Unresolved |
| **Verdict** | The most reusable asset AMH offers. Imitate the **pattern**; do not reuse the **contract**. Note the 28-field envelope is Maezo-specific — §7.5: `do not blindly copy Maezo's 28-field envelope if a smaller rigorously governed contract suffices` |

### A7. FHIR authentication / authorization surface

| | |
|---|---|
| **Status** | **PROPOSAL — evaluate; currently a three-way contradiction (C-2)** |
| **Artifacts** | `CapabilityStatement-amh-server.json` (OAuth + SMART-on-FHIR, Cognito + IAM Identity Center, dated 2026-05-10); `applications/hapi-fhir/README.md` (mTLS internal, SMART `(futuro)`, Lambda authorizer for tenant validation); `applications/lambdas/lambda-authorizer-fhir/` (implemented OIDC JWT + SMART scopes, tested) |
| **L1 Declared** | **Contradictory across three artifacts.** All three are Layer 1 |
| **L2 Deployed** | — . **This is the decisive gap:** which mechanism is actually live is unknowable from documents |
| **L3/L4** | n/a |
| **OBSERVED properties of the implemented authorizer** | JWKS-validated OIDC JWTs; required `exp`/`iss`/`aud`/`sub`/`tenant`/`scope`; per-verb SMART scope matching (`.read` never authorizes writes); `tenant` claim mandatory and never defaulted; `X-Partition-Name` not consulted; Allow scoped to the exact method ARN; explicit fail-closed Deny |
| **Verdict** | V2 client auth behavior **cannot be designed from documents**. §7.4: support SMART only after discovery, scopes, token validation, audience/issuer, tenant binding and negative tests prove it exists |

### A8. FHIR API access & onboarding procedure — **organizational controls only**

| | |
|---|---|
| **Status** | **PROPOSAL — treat as organizational precedent; do NOT import as a technical control** |
| **Artifact** | `infrastructure/policies/fhir/fhir-api-access-procedure.md` |
| **L1 Declared** | Partial. Useful organizational content (DPA, DNE/CNES verification, security questionnaire, TLS 1.2+/MFA acceptance criteria, incident-response SLA). Its **technical** content is stale |
| **L2/L3/L4** | — |
| **OBSERVED disqualifier** | The authorizer it specifies, `fhir-api-authorizer`, **does not exist anywhere in the repository tree** (searched across all 3,685 entries). The implemented one is `lambda-authorizer-fhir` and is materially different in design. Its Python block is labelled `**Code Snippet:**` and calls helpers it never defines |
| **Verdict** | Evidence of *intended* onboarding governance — controls a V2 integration would likely have to satisfy. **Not** an implemented technical control |

---

## B. Contracts that would need to be created

None of these exists. Each is a **PROPOSAL** requiring an ADR under §7.5 and AMH-owner authority to publish.

### B0. The AMH×IntensiCare contract package itself

| | |
|---|---|
| **Status** | **PROPOSAL — the enabling precondition for everything in section B** |
| **Proposed path** | `schemas/contracts/intensicare/v1/contract-manifest.yaml` **in the AMH repository** — a path to be *proposed to AMH owners*, per §7.5's `for example`. This is a suggestion, not a decision |
| **V2 pin** | e.g. `config/integrations/amh/contracts.lock.json` — see [`contracts.lock.draft.yaml`](./contracts.lock.draft.yaml) for the drafted shape |
| **All layers** | — . **OBSERVED:** `schemas/contracts/` contains only `maezo/` and `source-authority/`. No `intensicare/` path exists. "IntensiCare" appears twice in the entire repository, both incidental (a narrative repo listing and a VPN decommission runbook) |
| **Authority constraint (OBSERVED)** | The Maezo manifest states the boundary is `AMH-owned — edição SOMENTE em Omni-Saude/amh-data-platform (XRD-04)`. An IntensiCare manifest would be **AMH-owned**, created by AMH, under AMH review. §7.5: `Writing to the AMH repository requires separate AMH-owner authority and review.` This dossier proposes; it cannot place the file |
| **Required content per §7.5** | AMH producer commit + V2 consumer commit; contract semvers and lifecycle status; schema/OpenAPI/AsyncAPI/FHIR package identifiers and cryptographic digests; producer and consumer owners, clinical-data steward, security classification, approval records; compatibility policy, deprecation window, change-notification route; registry IDs; valid/invalid synthetic fixtures and measured compatibility results; supported tenants/facilities, environments, effective dates, availability/freshness SLOs and **explicit exclusions**; threat/privacy/consent/purpose-of-use/retention/audit/incident responsibilities; replay/backfill/correction guarantees and reconciliation procedure |

### B1–B5. Candidate contracts (§7.5 list, restated as proposals)

Each requires an ADR determining whether it is needed at all. §7.5: `Evaluate, through ADRs, the minimum set of contracts actually required.`

| # | Candidate | Exists at AMH? | Notes |
|---|---|---|---|
| **B1** | Encounter / location / admission-transfer-discharge changes | **No** — Encounter is profiled, but no ADT change contract was found | Would need event semantics: correction, cancellation, supersession, tombstone |
| **B2** | Clinically typed observations with codes, values, units, reference ranges, quality and provenance | **No** — and the sole existing Observation profile structurally excludes vitals (category pattern-fixed to `laboratory`). **A vital-sign contract requires a new AMH profile to be authored, published and populated** — not a mapping change | The highest-value and highest-effort candidate. Blocked on C-1 |
| **B3** | Identity / alias / merge / unmerge and consent / purpose changes | **No** dedicated contract found. The Maezo consent topic exists but is Maezo-scoped | **Reserved for the Wave 2 identity specialist.** Note: ADR-041 chooses tenant-local MPI; the IG carries cross-tenant longitudinal language; `Observation-amh-laboratory` requires `mpiId` 1..1, making this a **hard blocker on Observation consumption**, not a parallel track |
| **B4** | Optional V2 → AMH writeback (evaluations, alert outcomes, acknowledgments) | **No.** OBSERVED: `só a AMH escreve no HAPI` (subject-context header). Maezo has a `maezo.amh.outcomes.v1` topic whose schema is nonetheless AMH-owned — a precedent for the *governance shape* of a writeback, not a reusable channel | Deferrable. §7.0's hypothesis has V2 owning its safety-critical state; writeback is not required for a first slice |
| **B5** | Read-only purpose-bound context API where synchronous retrieval is justified | **No** for IntensiCare. The Maezo subject-context API is the pattern (A5) | Must be justified against FHIR REST rather than assumed; §7.5 requires transport comparison |

---

## C. Explicitly NOT candidate interfaces

| Item | Why |
|---|---|
| **MCP** | **OBSERVED:** zero MCP paths in the tree; zero code-search hits for "model context protocol". Prompt §2: `Treat MCP as a new V2 interface requiring its own ADR and contracts, not as inherited AMH compatibility.` §7.5: `MCP is not a clinical ingestion transport or system of record` |
| **Maezo topics / payloads / 28-field envelope** | §7.5 forbids reuse. Maezo-scoped and AMH-owned |
| **Direct Oracle / Tasy access** | Not an AMH-published contract. ADR-040 notes Oracle is reachable only from inside AWS via TGW. Would bypass every governance layer |
| **Bronze / Silver Iceberg tables directly** | Internal implementation, not a published contract (§7.1). ADR-040 shows these are actively restructured |
| **`fhir-api-authorizer` (as documented)** | Does not exist in the tree |
| **Internal ALB bulk-ingestion path** | ADR-040 §5 describes it as `sem WAF e sem rate-limit`, reserved for AMH's own bulk load. Not an external consumer interface |

---

## D. Summary — evidence layers passed

| Ref | Candidate | L1 | L2 | L3 | L4 |
|---|---|:--:|:--:|:--:|:--:|
| A1 | FHIR context resources (Patient/Encounter/Condition/…) | **PASS** | — | — *(SOURCE claims)* | — |
| A2 | FHIR Observation (laboratory) | **PASS** *(profile)* | — | **FAIL** *(SOURCE: empty source)* | — |
| A3 | Data-quality CodeSystem | **PASS** | — | — | — |
| A4 | Gold/Athena analytical outputs | **PARTIAL** *(no consumer contract)* | — | — *(SOURCE: 21 empty, 21 all-null)* | — |
| A5 | Maezo subject-context API *(pattern only)* | **PASS** | — | — | — |
| A6 | Maezo manifest *(pattern only)* | **PASS** | *dev only* | — | — |
| A7 | Auth/authz surface | **CONTRADICTORY** *(3-way)* | — | n/a | n/a |
| A8 | Access procedure | **PARTIAL** *(technical content stale)* | — | — | — |
| B0 | AMH×IntensiCare contract package | **DOES NOT EXIST** | — | — | — |
| B1–B5 | Candidate contracts | **DO NOT EXIST** | — | — | — |

**No candidate passes Layer 2, 3, or 4 — because no evidence exists at those layers in this cycle.** The one candidate for which Layer 3 can be assessed at all (A2, laboratory Observation) fails on AMH's own documentary account.

> **ATUALIZAÇÃO 2026-08-15 — a seção E abaixo (pt-BR) supersede a linha B0 desta tabela.** O contrato AMH×IntensiCare v1 deixou de ser candidato sem direção: passou a ter **direção DECIDIDA**. As camadas de evidência continuam as mesmas — a decisão não produziu artefato.

---

## E. Contrato AMH×IntensiCare v1 — direção DECIDIDA (2026-08-15)

> Seção acrescentada em 2026-08-15 conforme a política de idioma **DEC-G0-10** (material novo em pt-BR; seções acrescentadas a arquivos existentes em inglês, sem reescrita do corpo). As seções A–D acima permanecem válidas como evidência do ciclo 0 e **não** foram alteradas.

### E.0 O que mudou, e o que não mudou

**DECIDIDO** — em 2026-08-15, **rodaquino-OMNI** (CEO e acionista principal de OMNI e AMH; autoridade do lado AMH registrada em `docs/00-governance/registers/g0-resolucoes-2026-08-15.md` **DEC-G0-04**) resolveu as questões de adjudicação **AQ-1..AQ-6**. O item **B0** deste inventário — *"AMH×IntensiCare contract package — DOES NOT EXIST"* — permanece **factualmente correto quanto ao artefato**, e passa a ter **direção decidida quanto ao conteúdo**.

**A distinção é o ponto central desta seção.** Uma decisão de direção **não é** evidência de camada. Nenhuma das seis resoluções criou um arquivo, publicou um package, provisionou um ambiente ou mediu uma linha de dado. O que elas fizeram foi eliminar a indefinição que impedia sequer especificar o contrato. As camadas 2, 3 e 4 continuam **sem evidência**.

**Ata de referência.** As seis resoluções estão lavradas em [`identity-adjudication/adjudicacao-decisoes-2026-08-15.md`](./identity-adjudication/adjudicacao-decisoes-2026-08-15.md) (`IDN-ADJ-2026-08-15`). Em caso de divergência, **a ata prevalece quanto ao teor**; esta seção é leitura de consequência para o inventário de contratos.

**VALIDAÇÃO NECESSÁRIA — duas pendências de forma** (registradas pela própria ata, §0.3): as AQ-1..AQ-6 **ainda não constam do `decision-register.md`** (verificado 2026-08-15: busca por `AQ-` não retorna entradas; IDs `GDEC-nnnn` a alocar pelo steward), e a ata recomenda **contra-assinatura** do titular, por terem sido transmitidas por intermédio do orquestrador. Pendências de **forma, não de mérito** — a V2 opera sob a ata até que se fechem.

### E.1 Os três elementos com direção decidida

| Elemento do contrato v1 | Direção DECIDIDA | Resolução |
|---|---|---|
| **Campo sujeito** | `portable_subject_ref` (PSR) — **obrigatório** como identificador de fronteira. Nativo na V2 desde o dia um, sintético em `dev`. **Independente de encontro, sempre qualificado por encontro.** | **AQ-4 = A plena** |
| **Cláusula de ciclo de vida de identidade** | Eventos (alias, merge, unmerge/split, restore, reassignment, erasure) **+** `resolve(ref, as_of)` — **obrigatórios** no v1. **Sem eles o G3 não passa.** | **AQ-5 = A vinculante** |
| **Modelo de finalidade** | Loop clínico sob **tutela da saúde** (LGPD Art. 11, II, "f"). **Sem gate de consentimento no loop clínico.** Usos secundários **bloqueados**. `ie_perm_sms_email` **jamais** como consentimento. Ratificação jurídica antes de dado real. | **AQ-3 = C** |

### E.2 Camadas de evidência que cada elemento ainda não tem

Esta é a tabela que a decisão **não** alterou, e é por isso que ela está aqui.

| Elemento | C1 declarado | C2 implantado | C3 povoado | C4 aptidão | O que falta, concretamente |
|---|:--:|:--:|:--:|:--:|---|
| **Campo sujeito (PSR)** | **DIRIGIDO** — desenho AMH-020b existe; contrato v1 não | — | — | — | ONDA C (OS-10..OS-16): SP-1..SP-7. PSR **não existe em nenhum ambiente**; nenhuma ref mintada. Parecer DPO/jurídico (OS-16) é a única dependência externa |
| **Eventos de ciclo de vida** | **DIRIGIDO** — semântica interna já especificada (AMH-020b); **exposição a consumidor nunca foi requisito** | — | — | — | OS-17. Sem canal, sem envelope, sem ordenação declarada, sem latência medida |
| **`resolve(ref, as_of)`** | **DIRIGIDO** — a garantia de que toda ref resolve para sempre existe; a operação ponto-no-tempo não | — | — | — | OS-18. Nenhuma operação exposta; semântica de `as_of` fora de janela indefinida |
| **Modelo de finalidade** | **DIRIGIDO** — base legal decidida | — | n/a | n/a | OS-13 (forma do `consent_decision_ref` sob tutela da saúde) e **OS-16** (ratificação jurídica). A decisão de base legal é da autoridade; a **ratificação** é de advogados (DEC-G0-03) |
| **Manifesto v1 (o artefato)** | **NÃO EXISTE** | — | — | — | OS-19. `schemas/contracts/` continha apenas `maezo/` e `source-authority/` no commit pinado |

**Leitura obrigatória desta tabela:** **DIRIGIDO ≠ PASSA.** Nenhum elemento passa camada alguma. "Direção decidida" significa que a especificação pode começar, não que o contrato exista.

### E.3 Efeito sobre os itens A e B das seções anteriores

| Item | Estado no ciclo 0 | Efeito das resoluções |
|---|---|---|
| **A2** — `Observation` laboratorial | Camada 3 **FALHA** (fonte vazia); C-4: plano de desbloqueio viola o profile | **Encaminhado, não resolvido.** OS-20 determina financiar o caminho **estruturado** Diagnose/LIS. O caminho de texto livre, se executado, fica **explicitamente excluído** do v1 |
| **A7** — superfície de autenticação | **CONTRADITÓRIA** (3 vias) | **Parcialmente encaminhado.** AQ-6 elimina o *bypass* `cross_tenant_authorized` (deriva documental). O mecanismo implantado por ambiente (C-2) **permanece aberto** — Q2 |
| **B0** — pacote de contrato v1 | **NÃO EXISTE** | **Direção decidida** (E.1). Artefato ainda inexistente → OS-19 |
| **B2** — observações clinicamente tipadas | **NÃO EXISTE**; profile exclui vitais por construção | **Inalterado.** As seis resoluções **não** decidem C-1. Sinais vitais exigem **novo profile** e nova decisão de produto — Q1 |
| **B3** — identidade / alias / merge / consentimento | **NÃO EXISTE** | **Torna-se cláusula obrigatória do v1** (AQ-5). Deixa de ser candidato opcional |
| **B5** — API de contexto read-only | **NÃO EXISTE** para IntensiCare | **Inalterado.** Nenhuma resolução escolheu transporte — §7.5 continua exigindo comparação |

### E.4 O que continua proibido a este especialista

As resoluções ampliaram o que se sabe; **não** ampliaram o que este papel pode decidir. Permanecem vedados: declarar compatibilidade (G3), escolher transporte, aprovar a fronteira de plataforma, escrever no repositório AMH e emitir parecer jurídico. Todo item da seção E segue rotulado **PROPOSAL**, salvo as três direções **DECIDIDAS** de E.1, cuja autoria é do humano nomeado.

### E.5 Restrição dura de portfólio — inalterada

`compatibility-finding.md` §3 registra a restrição: **`Observation` laboratorial bloqueada e nenhum feed de sinais vitais demonstrado.** OS-20 endereça a primeira metade. **A segunda permanece intacta:** o único profile de Observation da IG fixa `category` em `laboratory` por padrão, excluindo estruturalmente sinais vitais de qualquer instância conforme. Mesmo com as 21 ordens de serviço executadas, **a V2 continua sem sinais vitais da AMH**.

O achado permanece: **candidato a integração; compatibilidade não demonstrada para avaliação de UTI acionável.** O que mudou é a natureza do bloqueio — de **indefinição** para **execução e ambiente**, que é um estado melhor e mensurável.

---

*Prepared by the AMH-data compatibility architect (Wave 1). Every entry is a PROPOSAL. No interface is approved, no transport chosen, no boundary decided, and no AMH-owner sign-off obtained. Nothing was written to the AMH repository. No PHI, credentials, or tokens appear in this document.*

*Seção E acrescentada em 2026-08-15 (DEC-G0-10, pt-BR). As direções de E.1 são DECIDIDAS por rodaquino-OMNI; tudo o mais permanece PROPOSAL. Corpo em inglês das seções A–D preservado sem reescrita.*
