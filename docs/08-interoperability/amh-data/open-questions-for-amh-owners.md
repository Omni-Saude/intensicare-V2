---
doc_id: AMH-OPEN-QUESTIONS
status: PROPOSAL
owner: UNASSIGNED — VALIDATION REQUIRED
source: Omni-Saude/amh-data-platform @ 0a07a6f1fab36fb2f5eeee0fcd8e945c95f67116 (pinned evidence snapshot, main); INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §7.1 and §7.4
date_collected: 2026-08-14
collector: AMH-data compatibility architect
last_updated: 2026-08-14
---

# Open Questions for AMH Owners

**Audience.** AMH Data Platform owners, contract steward, and clinical data steward.

**Purpose.** These are questions **only AMH owners can answer**. Each is grounded in a specific artifact read at a pinned commit, states why V2 cannot resolve it from documents, and names what V2 will do in the meantime. They are not requests for opinion or for work — they are requests for the facts a compatibility decision requires.

**Pinned evidence snapshot.** `Omni-Saude/amh-data-platform@0a07a6f1fab36fb2f5eeee0fcd8e945c95f67116` (`main`), verified 2026-08-14 to be the current HEAD at verification time.

**How this reconnaissance was done.** Read-only GitHub API calls against the pinned commit. **No environment was accessed, no endpoint contacted, no credential used against any AMH runtime, and nothing was written to the AMH repository.** Seventeen files were read; the full tree (3,685 entries) was enumerated.

**A note on tone.** Several questions surface contradictions between AMH documents. These are recorded because a consumer cannot design against two conflicting statements — not as criticism. This repository documents its own defects with unusual rigor (the partitioning document retracts five of its own prior claims; the Gold sweep names its author's own error), and that candour is why the remaining documentation is worth taking seriously enough to ask about.

---

## Priority summary

| # | Question | Blocks |
|---|---|---|
| **Q1** | Do populated vital-sign Observations exist, or are any planned? | The entire ICU pathway portfolio |
| **Q2** | What authentication is actually deployed, per environment? | Any V2 client design |
| **Q3** | Observation ingestion timeline — and will the delivered shape be profile-conformant? | Every laboratory-based pathway |
| **Q4** | Who owns an AMH×IntensiCare contract, and where would it live? | Every contract in the inventory |
| **Q5** | What is the license / IP status for code and schema reuse? | Any reuse of AMH artifacts |
| **Q6** | Which environments and tenants can V2 verify against? | Evidence layers 2, 3 and 4 entirely |
| **Q7** | Is the Maezo manifest published or not? | Trust in the publication pattern |
| **Q8** | Is `_dq_status` carried onto FHIR resources? | The source-quality dimension |
| **Q9** | Which document governs consumer onboarding? | Integration process |
| **Q10** | Change-notification and deprecation route for consumers? | Contract stability |

---

## Q1 — Vital signs: does a populated feed exist, and is one planned?

**This is the single highest-value question in this dossier.** It determines whether an actionable ICU pathway portfolio is possible from AMH data at all.

**The contradiction (both sides OBSERVED at the pinned commit):**

*Side A — the diagrams assert vital signs:*

> `architecture/diagrams/data-flows/data-flow-fhir-clinical.md` L121: `| EVOLUCAO_PACIENTE | ... | `ClinicalImpression` ou `Observation` | ... `Observation` para sinais vitais |`

> Same file, L140: `| Observation | ✅ (sinais vitais de dispositivos IoT) | ✅ (sinais vitais, resultados) | P95 < 200ms |`

> `architecture/diagrams/c4-component/c4-component-fhir-pipeline.md` L95: `` `Observation` para sinais vitais estruturados (LOINC code) ``

*Side B — the IG provides no vital-signs profile:*

> `schemas/fhir-profiles/README.md` L39–59 lists 19 profile StructureDefinitions; exactly one is an Observation profile.

> `schemas/fhir-profiles/Observation-amh-laboratory-profile.json` **pattern-fixes** `Observation.category` to `http://terminology.hl7.org/CodeSystem/observation-category#laboratory`.

**Why V2 cannot resolve this.** The pattern-fixed category means a conformant instance of the only Observation profile **cannot carry a vital-sign category**. This is structural exclusion, not a coverage gap: vital signs would require a **new profile** to be authored, published and populated. Meanwhile the diagrams assert vital-sign capability in two places. We note without adjudicating that the data-flow diagram is dated `Versão 1.0 | Maio 2026` and describes the CDC path that ADR-040 (2026-07-25) replaced, and that the C4 component diagram is internally self-inconsistent — its rendered mapper shows `EVOLUCAO_PACIENTE → ClinicalImpression` with no Observation branch, contradicting its own table. **Chronology and inconsistency are not authority.** Only you can say whether the vital-sign intent survived ADR-040.

**Please answer:**

1. Does any populated vital-sign Observation feed exist **today**, in any environment? If yes, under what profile, in which tenants, and how populated?
2. If not, is one planned? Under what profile, code system (LOINC?), unit binding (UCUM?), and target freshness?
3. Is `EVOLUCAO_PACIENTE` a realistic source for structured vitals, or is it free-text clinical notes that the diagrams over-promised?
4. Was device/IoT vital ingress ever implemented, or is it aspirational?
5. Should the May 2026 diagrams be read as current intent, or as superseded by ADR-040?

**V2's position until answered.** ICU vital signs are treated as **unavailable from AMH**. No pathway requiring them is eligible for actionable evaluation. We will not infer availability from a diagram.

---

## Q2 — Deployed authentication: which of three positions is live?

**A three-way divergence, all three OBSERVED at the same commit:**

*Side A — CapabilityStatement* (`schemas/fhir-profiles/CapabilityStatement-amh-server.json`, `date: 2026-05-10`, `status: active`):

> `rest[0].security.service` = `OAuth` + `SMART-on-FHIR`; description: `AWS Cognito + IAM Identity Center backed. Scopes: patient/*.read, user/*.read, system/*.read, system/*.write.`

*Side B — HAPI README* (`applications/hapi-fhir/README.md` L78–82):

> `- mTLS para serviços internos.` / `- SMART on FHIR (OAuth 2.0) para apps externas (futuro).` / `- Lambda authorizer para tenant validation.`

*Side C — implemented code* (`applications/lambdas/lambda-authorizer-fhir/`, found this cycle):

> `API Gateway Lambda authorizer validating OAuth2 JWT tokens (OIDC) against JWKS and enforcing SMART on FHIR scopes with multi-tenant context resolution.` — with `exp`, `iss`, `aud`, `sub`, `tenant`, `scope` required; per-verb scope matching; `tenant` mandatory and never defaulted; explicit fail-closed Deny; four test modules.

**Why V2 cannot resolve this.** A client cannot be built against three positions. mTLS, SMART/OAuth, and a JWT-with-required-claims authorizer imply different credential provisioning, different discovery, different failure modes, and different negative tests. Side C is code in the repository — evidence that the SMART path is further along than the README's `(futuro)` suggests — but code in a repository is **not** evidence of deployment.

This is sharpened by a documented precedent in your own tree: `applications/hapi-fhir/config/partitioning-config.md` records five configuration keys that were documented in the repository *and in its YAML files* which Spring **silently ignored** — `Não configuravam nada`. Documented configuration here has diverged from deployed behavior before.

**Please answer:**

1. What is the authoritative deployed authentication mechanism for the FHIR API, **per environment**?
2. Is `lambda-authorizer-fhir` in the live request path? Which issuer, audience and JWKS endpoint is it configured against?
3. Is the CapabilityStatement's SMART advertisement accurate, aspirational, or stale? Is it served from a live server or only a repository file?
4. For a service-to-service consumer like V2: mTLS, OAuth client credentials, both, or something else?
5. What scope vocabulary would a V2 workload be granted, and how is the `tenant` claim issued and bound?

**V2's position until answered.** No client authentication behavior will be designed. Per prompt §7.4, SMART will be supported only after discovery, scopes, token validation, audience/issuer, tenant binding and negative tests prove it exists.

---

## Q3 — Observation ingestion: timeline, and will the result be profile-conformant?

**Two parts. The second is more important than the first and is not in the original evidence snapshot.**

**Part A — the block (OBSERVED):**

> `docs/reference/fhir-observation-source-request.md` L11–19: `**bloqueado por falta de dado**, não por código` — `PACIENTE_EXAME`, `**existe no catálogo mas veio com 0 linhas**`; the preferred Diagnose/LIS source `**não é ingerido**`. Status: `aguardando ingestão no Bronze` (2026-07-24).

> `ADR-040` L67–68: `` `Observation` fica bloqueado até os resultados de exame serem ingeridos no Bronze ``

Corroborated from a third direction: the IG maps its only Observation profile to source `bronze_diagnose.diagnose_exame_resultado` — the exact Diagnose/LIS path the source request says is not ingested.

**Part B — the conformance problem (OBSERVED, contradiction C-4).** The unblocking plan of record specifies:

> L49: `Observation.code = {text: "Resultado de exame"}   # LOINC quando houver catálogo`
> L53: `Observation.valueString   = ds_resultado`

But `Observation-amh-laboratory` binds `Observation.code` to ValueSet `amh-loinc-laboratory` and fixes `valueQuantity.system` to `http://unitsofmeasure.org`. **A free-text `code.text` with a `valueString` payload is not a LOINC-coded UCUM quantity.** Your own document names the conformant alternative — Diagnose/LIS structured results giving `analito/valor/unidade` and permitting `valueQuantity` — and characterizes it as `Maior esforço; recomendada para a fase de resultados laboratoriais estruturados`.

**Why this matters to V2, stated plainly.** No ICU scoring rule — NEWS2, MEWS, SOFA, qSOFA, any threshold logic — can consume a free-text string. If "Observation unblocked" is announced but delivers `valueString`, **nothing changes for V2**. We would rather know now than discover it after integration.

**Please answer:**

1. Is there a target date for ingesting exam results into Bronze?
2. Which path is intended: Tasy `PACIENTE_EXAME` (free-text `ds_resultado`), or Diagnose/LIS `exame_resultado` (structured analyte/value/unit)?
3. If the former: will Observations be profile-conformant, given the profile requires a LOINC-bound code and UCUM quantities?
4. Is the `EXAME_LABORATORIO` LOINC catalogue (`nr_seq_loinc`) available for code enrichment, and at what coverage?
5. Once populated: which tenants, what historical depth, what update cadence?

**V2's position until answered.** Laboratory Observations are unavailable. When unblocked, V2 will require as an **acceptance condition** that values arrive LOINC-coded with UCUM quantities — not merely that Observations exist.

---

## Q4 — Contract ownership: who owns an AMH×IntensiCare contract, and where does it live?

**OBSERVED at the pinned commit:**

- `schemas/contracts/` contains exactly two entries: `maezo/` and `source-authority/`. **There is no `intensicare/` path.** Verified by full-tree enumeration.
- "IntensiCare" appears **twice** in the entire repository, both incidental — a narrative repo listing in `docs/planning/plano-5f-5h-maezo-2026-08-13.md` and a mention in `runbooks/routine/ROT-06-legacy-vpn-decommission.md`. Neither is a contract or integration reference.
- The Maezo manifest header states: `AMH-owned — edição SOMENTE em Omni-Saude/amh-data-platform (XRD-04)`, and the subject-context spec states `só a AMH escreve no HAPI`.

**Why V2 cannot resolve this.** The publication pattern V2 wants to imitate is explicitly AMH-owned and AMH-authored. V2 cannot create an AMH-owned contract, and per prompt §7.5 `Writing to the AMH repository requires separate AMH-owner authority and review.` **We are proposing, not placing.**

**Please answer:**

1. Would AMH accept an IntensiCare contract package analogous to Maezo's? Is `schemas/contracts/intensicare/v1/contract-manifest.yaml` the right path, or does another convention apply?
2. Who would be the AMH-side contract steward, producer owner, and clinical data steward?
3. Does the XRG-2 style human publication gate apply, and what would the approval path look like?
4. Does ADR-042's authority model (`sources[].system → source_product`) extend to a non-Maezo consumer, or would a new ADR be needed?
5. Is there a prerequisite process — an intake, an architecture review, a security assessment — before a consumer can be onboarded to a contract at all?

**V2's position until answered.** All candidate interfaces are labeled `PROPOSAL`. Nothing will be written to the AMH repository.

---

## Q5 — License and IP status for reuse

**OBSERVED:** GitHub repository metadata reports `license.spdx_id: NOASSERTION`, `license.name: "Other"`, `license.url: null`. The repository is `private: true`.

**Why V2 cannot resolve this.** Prompt §7.1 requires reconnaissance of `code reuse licensing and ownership`. `NOASSERTION` means GitHub found no machine-identifiable license. V2 may wish to reuse AMH FHIR profiles, ValueSets, CodeSystems, or the manifest schema shape. Absent a stated license, no reuse assumption is safe — and this applies to *schema and profile* reuse as much as to code.

**Please answer:**

1. Under what license or internal agreement may IntensiCare V2 reuse AMH artifacts?
2. Does the answer differ for FHIR profiles/ValueSets/CodeSystems versus application code versus documentation?
3. If V2 pins the AMH FHIR package (`br.com.americashealth.fhir` 1.0.0) as a dependency, is that permitted, and via what distribution channel?
4. Are there third-party or vendor terms (Tasy, HAPI, LOINC, AWS) that constrain redistribution?
5. Who is the authority for IP questions across the two repositories?

**V2's position until answered.** No AMH artifact will be copied into V2. References are by path and commit only.

---

## Q6 — Environments and tenants: what can V2 actually verify against?

**OBSERVED (SOURCE claims from your README and configuration docs):**

> README L8: `**1 de 4 provisionado.** Só `dev` existe — `stg`, `prod` e `dr` custam US$ 0,00 e não têm tfstate.`

> README L28: `Hoje **nada está** [em produção] — só o ambiente `dev` existe.`

> README L13: Tier 0 targets are `alvo declarado, não SLA medido em produção: não há produção.`

> `partitioning-config.md` L89–105: partition bootstrap `não está implementado`; `PartitionInitializer` does not exist; `as partições não são criadas por este servidor`; a request to `/fhir/<tenant>/...` for a tenant without a partition **fails**. Only `tenant_austa_clinicas` and `tenant_omni_saude` are listed as pre-created — against ADR-041's 12 tenants.

**Why this is decisive.** Gate G3 requires conformance tests to `pass in a production-like environment`. **If only `dev` exists, that condition cannot be met by anyone, at any access level.** This is not a scheduling problem; it is an environment that does not exist. Your README assigns it to `Negócio / orçamento`. Everything at evidence layers 2, 3 and 4 is blocked on this — which is why the critical path for compatibility runs primarily through AMH, not through V2 engineering.

**Please answer:**

1. Is `dev` the only environment available for a V2 integration? Is there a timeline for `stg`?
2. Can a V2 workload reach the HAPI FHIR endpoint, and over what network path? ADR-040 §5 notes bulk ingestion uses an internal ALB `sem WAF e sem rate-limit` — presumably not appropriate for an external consumer.
3. Which tenant partitions actually exist today, given nothing creates them automatically?
4. Which tenant(s) would be in scope for a V2 pilot? ADR-041 records that only 12 of 49 establishments have clinical data and Austa Hospital alone is 89.2% of encounters.
5. Is there a sandbox, synthetic dataset, or faithful emulator for consumer-driven contract tests (prompt §7.6)? If not, what would creating one require?
6. **A specific factual question:** the Gold sweep lists a tenant named `iop_uti`. `UTI` is the Portuguese abbreviation for ICU. What is this tenant, and does it hold ICU clinical data? *(We draw no inference from the name — we are asking.)*

**V2's position until answered.** Evidence layers 2, 3 and 4 are recorded as having **no evidence**. No compatibility claim is possible.

---

## Q7 — Is the Maezo manifest published or not?

**Two AMH documents at the same commit disagree about a third (contradiction C-3):**

*README L176:*
> `o manifesto ... está `status: UNPUBLISHED`, com `glue_registration.registry_name: null`, os 3 `schema_version_ids: null` e `evidence_id: SET-AT-PUBLICATION`.`

*The manifest file itself:*
> `status: PUBLISHED`; `registry_name: amh-fhir-dev`; three populated `schema_version_ids` UUIDs; `evidence_id: XRG2-AMH-DEV-GHA-30991849241`; `published_at_utc: "2026-08-05T09:07:40Z"`.

All four README assertions are false of the file as it stands. Your README anticipates exactly this: `**Esta linha envelhece rápido — confira ao vivo antes de agir**`.

**Why V2 cannot resolve this.** V2 wants to imitate this publication pattern. Whether the one exercised publication actually completed determines whether the pattern is *proven* or *proposed* — a material difference when proposing V2 follow it.

**Please answer:**

1. Was the XRG-2 publication completed? Is the manifest genuinely `PUBLISHED`?
2. Is the README simply stale, or did something revert?
3. Does `glue_registration.environment: dev` mean the pattern is proven only in dev?
4. Is `manifest_sha256: SELF-AT-PUBLICATION` the intended steady state (consumer computes over the published file), or a placeholder?

**V2's position until answered.** The pattern is recorded as a `PROPOSAL`-grade reference, valuable but with publication status noted as contradictory.

---

## Q8 — Is `_dq_status` carried onto FHIR resources?

**OBSERVED:** `CodeSystem-amh-data-quality-status` v1.0.0, `content: complete`, `count: 3` — `valid | warning | quarantined` — described as `Status de qualidade de dados emitido pelo Silver-Rules ... Espelha a coluna _dq_status das tabelas Silver-Rules.`

**Why this matters more than it appears.** Prompt §7.6 requires V2 to maintain two independent status dimensions: **source data quality** (AMH's) and **V2 evaluation status** (`valid | partial | not_evaluated | stale | invalid`), mapped explicitly and never collapsed. That mapping presupposes the source quality signal actually arrives. The CodeSystem is scoped to the Silver-Rules analytical layer. **If FHIR resources served by HAPI carry no `_dq_status`, then a V2 FHIR consumer receives no source-quality signal at all** — a stronger constraint than a vocabulary mismatch, and one that would force V2 to derive quality independently.

**Please answer:**

1. Do FHIR resources in HAPI carry a data-quality status? Via which element — a `meta.tag`, an extension, something else?
2. If a Silver-Rules record is `quarantined`, is a FHIR resource produced for it at all, or is it withheld?
3. What does `warning` mean operationally for a clinical consumer — which non-blocking violations does it cover?
4. Is there a supersession/correction signal when a record's quality status changes after publication?

**V2's position until answered.** The two dimensions are documented as orthogonal and are never conflated. If no source-quality signal is delivered, V2 records the absence explicitly rather than assuming `valid`.

---

## Q9 — Which document governs consumer onboarding?

**OBSERVED:** `infrastructure/policies/fhir/fhir-api-access-procedure.md` specifies onboarding for external systems: DNE/CNES verification, DPA, security questionnaire, TLS 1.2+/MFA acceptance criteria, incident-response SLA. Its §4.1 specifies a `Custom Authorizer Lambda (fhir-api-authorizer)` with a Python `**Code Snippet:**`.

**The disqualifying observation.** `fhir-api-authorizer` **does not exist anywhere in the repository tree** — searched across all 3,685 entries. The implemented authorizer is `lambda-authorizer-fhir`, and it differs materially: the document's snippet is organized around mTLS partner certificates and Lake Formation checks; the implemented one validates OIDC JWTs against JWKS and enforces SMART scopes. The snippet also calls helpers it never defines.

**Please answer:**

1. Is this procedure current for onboarding a new FHIR consumer, or superseded?
2. Do the **organizational** controls (DPA, DNE/CNES, security questionnaire) apply to an internal-group consumer like IntensiCare V2, or only to external partners?
3. Should the §4.1 technical content be disregarded in favour of `lambda-authorizer-fhir`?
4. Is there a different, current onboarding runbook we should be reading instead?

**V2's position until answered.** The procedure is treated as evidence of *intended organizational governance*. Its technical authentication content is **not** imported as an implemented control.

---

## Q10 — Change notification and deprecation for consumers

**OBSERVED context:** the Maezo manifest declares `compatibility_mode: BACKWARD` and a frozen 28-field envelope. The README warns repeatedly that the repository moves fast (`O repositório se move rápido: confira datas antes de confiar em qualquer linha desta tabela`) and lists dated tripwires — `SECURITY_BASELINE_EXPIRES: '2026-11-01'` on the only required check, and an integration-test ratchet expiring `2026-10-01`.

**Why V2 cannot resolve this.** V2 must pin an AMH contract and detect drift (prompt §7.6, `contract-change detection`). Pinning without a notification route means discovering breakage in production. The pinned evidence commit was HEAD on the day it was verified; it will not stay HEAD.

**Please answer:**

1. Is there a change-notification route for contract consumers — a channel, a mailing list, a required reviewer on contract paths?
2. What deprecation window would apply to a published AMH×IntensiCare contract?
3. Would V2 be added to `CODEOWNERS` review for paths it consumes, or is notification post-hoc?
4. How should V2 detect drift between its pinned commit and AMH `main` — polling blob SHAs, a published feed, or a manifest version bump?
5. Do the dated CI tripwires above affect a consumer's ability to get contract changes merged after those dates?

**V2's position until answered.** Every AMH reference is pinned to `0a07a6f1fab36fb2f5eeee0fcd8e945c95f67116` with per-file blob SHAs recorded in [`contracts.lock.draft.yaml`](./contracts.lock.draft.yaml), enabling drift detection by file comparison until a real notification route exists.

---

## What V2 is NOT asking for

To be clear about scope, and to avoid implying commitments neither side has made:

- **Not asking AMH to build anything.** These are questions about what exists and what is planned.
- **Not asking for a compatibility declaration.** Gate G3 is V2's process; it requires evidence, not assurance.
- **Not asking for repository write access.** Nothing was written, and nothing should be.
- **Not asking AMH to resolve V2's architecture.** Boundary, transport and platform placement are V2 ADR decisions — informed by these answers, not made by them.
- **Not asking for production data.** Population evidence can come from synthetic or de-identified representative datasets. No PHI is sought at any point.

---

## What V2 commits to in return

- Every AMH reference is pinned to an exact commit with per-file blob SHAs, and re-verified at any execution commit.
- Contradictions are recorded with all sides intact, never silently resolved in V2's favour.
- AMH's data-quality vocabulary is never conflated with V2's evaluation states.
- AMH claims about AMH data are labeled **SOURCE** and are never presented as V2 observations.
- The relationship is reported as `integration candidate` until Gate G3 passes, and clinical evaluation remains non-actioning until then.
- Nothing is written to the AMH repository without separate AMH-owner authority and review.

---

## Estado das perguntas após a adjudicação de 2026-08-15 (pt-BR)

> Seção acrescentada em 2026-08-15 conforme a política de idioma **DEC-G0-10**. O corpo em inglês acima permanece **sem reescrita** — era o pedido enviado; esta seção registra o que foi respondido. Onde as duas divergirem, **esta seção prevalece**.

### Autoridade

**DECIDIDO** — **rodaquino-OMNI** (CEO e acionista principal de OMNI e AMH), em **2026-08-15**, resolveu as questões de adjudicação **AQ-1..AQ-6**. Autoridade do lado AMH registrada em `docs/00-governance/registers/g0-resolucoes-2026-08-15.md` **DEC-G0-04**. Algumas dessas resoluções respondem, no todo ou em parte, perguntas Q1..Q10 deste documento.

**Ata de referência.** As seis resoluções estão lavradas em [`identity-adjudication/adjudicacao-decisoes-2026-08-15.md`](./identity-adjudication/adjudicacao-decisoes-2026-08-15.md) (`IDN-ADJ-2026-08-15`). Em caso de divergência, **a ata prevalece quanto ao teor**; esta seção registra apenas o efeito sobre Q1–Q10.

**VALIDAÇÃO NECESSÁRIA — duas pendências de forma** (registradas pela própria ata, §0.3): as AQ-1..AQ-6 **ainda não constam do `decision-register.md`** (verificado 2026-08-15), e a ata recomenda **contra-assinatura** do titular, por terem sido transmitidas por intermédio do orquestrador. São pendências de **forma, não de mérito**.

### Quadro-resumo

| # | Pergunta | Estado | Resolução que a moveu |
|---|---|---|---|
| **Q1** | Sinais vitais | 🔴 **ABERTA — sem alteração** | nenhuma |
| **Q2** | Autenticação implantada | 🟡 **PARCIAL** | AQ-6 (só o *bypass*) |
| **Q3** | `Observation` — prazo e conformidade | 🟡 **PARCIAL — direção decidida** | AQ-2 + OS-20 |
| **Q4** | Propriedade do contrato | 🟢 **RESPONDIDA** | DEC-G0-04 + AQ-4/5 |
| **Q5** | Licença / propriedade intelectual | 🟢 **RESPONDIDA** | DEC-G0-08 |
| **Q6** | Ambientes e tenants | 🟡 **PARCIAL** | AQ-6 (só a enumeração) |
| **Q7** | Manifesto Maezo publicado? | 🔴 **ABERTA — sem alteração** | nenhuma |
| **Q8** | `_dq_status` no FHIR? | 🟡 **PARCIAL — contexto mudou** | AQ-3 |
| **Q9** | Procedimento de *onboarding* | 🔴 **ABERTA — sem alteração** | nenhuma |
| **Q10** | Notificação de mudança | 🟡 **PARCIAL** | AQ-2 (via IG 1.1.0) |

**Contagem: 2 respondidas, 5 parciais, 3 abertas.** Nenhuma das respostas produziu evidência de camada 2, 3 ou 4.

---

### 🟢 Q4 — Propriedade do contrato — **RESPONDIDA**

**Resposta.** A autoridade do lado AMH é de **rodaquino-OMNI** (DEC-G0-04). O contrato AMH×IntensiCare v1 **existirá**, e três cláusulas já têm direção decidida: campo sujeito = **PSR** (AQ-4), cláusula de **ciclo de vida de identidade obrigatória** (AQ-5), **modelo de finalidade** por tutela da saúde (AQ-3).

**O que permanece aberto dentro de Q4:** o caminho continua *proposto* (`schemas/contracts/intensicare/v1/`), não confirmado; o **steward de contrato** e o **steward de dado clínico** do lado AMH não foram nomeados; e não se sabe se o *gate* humano estilo XRG-2 se aplica. → **OS-19**.

### 🟢 Q5 — Licença e propriedade intelectual — **RESPONDIDA**

**Resposta — DEC-G0-08, concessão por escrito:** o titular *"autoriza a IntensiCare V2 a ler o repositório `amh-data-platform` em commits pinados e a derivar contratos de integração a partir dele"*. Reuso de código ou artefato AMH **continua exigindo aprovação por artefato**, conforme `legacy-import-policy.md`.

**Efeito.** O `NOASSERTION` observado no metadado do GitHub deixa de ser bloqueador. **Permanece útil** o espelhamento opcional já previsto: arquivo de licença interna no repositório AMH, para que a concessão não dependa de memória de sessão.

### 🟡 Q1 → recolocada: sinais vitais — **ABERTA, e continua sendo a pergunta de maior valor**

**Nada mudou.** As seis resoluções tratam de identidade, tenancy, consentimento e contrato. **Não decidem C-1.**

O dossiê registra que o único profile de `Observation` da IG **fixa `category` em `laboratory` por padrão**, o que exclui **estruturalmente** sinais vitais de qualquer instância conforme — enquanto os diagramas afirmam `Observation` para sinais vitais e ingresso de dispositivos IoT.

**Consequência, dita sem rodeios:** mesmo com as **21 ordens de serviço integralmente executadas**, a V2 continua **sem sinais vitais da AMH**. Sinais vitais exigem **novo profile** — autorado, publicado, versionado e povoado — mais fonte demonstradamente povoada. Isso não é ordem derivável destas decisões; é **nova decisão de produto**.

### 🟡 Q2 — Autenticação implantada — **PARCIAL**

**Respondido (AQ-6=A).** O *bypass* `cross_tenant_authorized` é **deriva documental e não existirá**. O texto sai da IG (**OS-04**) e a V2 escreverá teste negativo asseverando sua impossibilidade.

**Aberto.** A divergência de **três vias** sobre o mecanismo **efetivamente implantado** permanece: CapabilityStatement (OAuth + SMART), README do HAPI (mTLS, SMART *futuro*) e o autorizador OIDC/JWT implementado em `lambda-authorizer-fhir`. **Isto não se resolve por decisão — resolve-se por descoberta empírica**, e depende de acesso a ambiente (Q6).

### 🟡 Q3 — `Observation`: prazo e conformidade — **PARCIAL, com a parte difícil decidida**

**Respondida a parte B, que era a mais importante.** O achado do dossiê (**C-4**) foi incorporado: o plano de desbloqueio de registro emitiria `code = {text: …}` e `valueString`, o que **não conforma** ao profile — e **nenhuma regra de escore de UTI consome uma string**. **OS-20** determina financiar o caminho **estruturado Diagnose/LIS** (analito/valor/unidade → `valueQuantity` com LOINC). Se o caminho de texto livre for executado por prazo, fica **explicitamente excluído** do contrato v1 e **não conta como desbloqueio**.

**Aberto:** **prazo** de ingestão; cobertura de LOINC; tenants; profundidade histórica; cadência.

### 🟡 Q6 — Ambientes e tenants — **PARCIAL**

**Respondido (AQ-6=A).** A enumeração autoritativa é de **12 tenants** pós-ADR-041. CodeSystem/ValueSet (**OS-03**) e tabela de partições do HAPI (**OS-09**) serão corrigidos.

**Aberto, e é o bloqueio estrutural mais duro do dossiê.** Apenas `dev` está provisionado. **Nenhuma resolução cria ambiente.** A condição do G3 de teste em ambiente similar a produção **continua insatisfazível por qualquer parte** — é decisão de orçamento. Também abertos: alcance de rede para carga de trabalho V2, existência real das partições, tenant piloto, *sandbox*/emulador, e a pergunta factual sobre `iop_uti`.

### 🟡 Q8 — `_dq_status` nos recursos FHIR — **PARCIAL: o contexto mudou, a pergunta não**

**Mudou o contexto (AQ-3=C).** Com o loop clínico sob **tutela da saúde** e **sem gate de consentimento**, o vocabulário de `consent-scope` deixa de ser caminho crítico — **OS-21** fica **diferido** até que usos secundários desbloqueiem.

**A pergunta permanece intacta e importante:** os recursos FHIR servidos pelo HAPI carregam **algum** sinal de qualidade de dado? O CodeSystem é escopado ao `_dq_status` do Silver-Rules. **Se o canal FHIR não carregar nenhum sinal**, a V2 recebe **zero dimensão de qualidade de origem** — restrição mais forte que incompatibilidade de vocabulário, e que obrigaria a V2 a derivar qualidade por conta própria.

> **Invariante reafirmada.** AMH `valid | warning | quarantined` (qualidade de origem) e V2 `valid | partial | not_evaluated | stale | invalid` (estado de avaliação) permanecem **dimensões ortogonais**. Nenhuma resolução as fundiu, e nenhuma poderia.

### 🟡 Q10 — Notificação de mudança — **PARCIAL**

**Respondido em parte (AQ-2).** Haverá **IG package 1.1.0** publicado com digest (**OS-05**) — a V2 passa a ter artefato versionado a pinar, em vez de comparar SHAs de blob.

**Aberto:** canal de notificação, janela de depreciação, `CODEOWNERS` para caminhos consumidos, e o efeito das catracas datadas de CI. **Atenção declarada em OS-05:** elevar `identifier:mpiId` de `0..1` para `1..1` **aperta** e é **incompatível para trás** — precisa estar dito na política de compatibilidade, não descoberto por consumidor.

### 🔴 Q7 e Q9 — **ABERTAS, sem alteração**

- **Q7 — manifesto Maezo `PUBLISHED` ou `UNPUBLISHED`?** A contradição **C-3** entre o README e o próprio arquivo não foi tratada por nenhuma resolução. Importa porque a V2 imita esse padrão de publicação: saber se a única publicação exercida completou determina se o padrão está **provado** ou apenas **proposto**.
- **Q9 — qual documento rege o *onboarding* de consumidor?** O procedimento de acesso FHIR nomeia um autorizador (`fhir-api-authorizer`) que **não existe na árvore**; o implementado tem outro nome e outro desenho. Continua sem resposta qual documento é o vigente e se os controles organizacionais se aplicam a um consumidor do mesmo grupo.

---

### Efeito líquido sobre o achado de compatibilidade

**INFERÊNCIA.** As respostas eliminam três das quatro contradições de camada 1 e dão direção decidida ao contrato v1. **Não produzem evidência nas camadas 2, 3 e 4.**

O achado de [`compatibility-finding.md`](./compatibility-finding.md) **permanece**: *candidato a integração; compatibilidade não demonstrada para avaliação de UTI acionável*. O que mudou é a **natureza** do bloqueio — de **indefinição** para **execução e ambiente**. É um estado melhor, e mensurável.

---

*Prepared by the AMH-data compatibility architect (Wave 1), from read-only inspection at a pinned commit. No PHI, credentials, tokens, or endpoint addresses appear in this document. Companion documents: [`four-layer-dossier.md`](./four-layer-dossier.md), [`claim-verification-matrix.md`](./claim-verification-matrix.md), [`compatibility-finding.md`](./compatibility-finding.md), [`contract-inventory.md`](./contract-inventory.md), [`contracts.lock.draft.yaml`](./contracts.lock.draft.yaml), [`ordens-de-servico-amh-2026-08-15.md`](./ordens-de-servico-amh-2026-08-15.md).*

*Seção pt-BR acrescentada em 2026-08-15 (DEC-G0-10). Corpo em inglês preservado sem reescrita. As resoluções AQ-1..AQ-6 são DECIDIDAS por rodaquino-OMNI; a leitura de seu efeito sobre Q1–Q10 é INFERÊNCIA deste especialista.*
