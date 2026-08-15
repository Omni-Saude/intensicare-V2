---
id: IDN-CONTRA-001
title: AMH patient-identity, tenant-grain and consent contradiction record
label: OBSERVED
status: ADJUDICADO em 2026-08-15 — ver ./adjudicacao-decisoes-2026-08-15.md (corpo em inglês preservado; resoluções em pt-BR)
statement: >
  At the pinned AMH commit, six authoritative-or-quasi-authoritative AMH artifacts
  assert mutually incompatible semantics for the same field (`mpi_id` /
  `amh-mpi-id`): cross-tenant longitudinal identity, tenant-local identity, an
  externally opaque per-PJ subject reference, and a separately-governed cross-PJ
  correspondence index. IntensiCare V2 cannot consume AMH `Patient` or
  `Observation` resources without knowing which semantics apply.
provenance:
  source_repo: Omni-Saude/amh-data-platform
  path_or_url: see per-position provenance tables below
  commit_sha_or_version: 0a07a6f1fab36fb2f5eeee0fcd8e945c95f67116
  section_or_lines: per-position, cited inline
  date_collected: 2026-08-14
  collector: AMH tenant-and-identity adjudication analyst (Wave 2)
  transformation: quoted verbatim (original Portuguese preserved) plus labelled INFERENCE
  confidence: high (document-level); the underlying runtime facts remain SOURCE, not OBSERVED
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
decision_owner: AMH owners (Principal Architect + CTO + Clinical Platform Lead + DPO/Legal) AND the V2 identity authority — UNASSIGNED — VALIDATION REQUIRED
links:
  requirements: []
  hazards: []
  adrs: []
  tests: []
  pr: null
supersedes: null
superseded_by: null
---

# AMH Identity / Tenant / Consent — Formal Contradiction Record

> ## ⚑ ADJUDICADO EM 2026-08-15 — LEIA ANTES DO CORPO
>
> As cinco contradições registradas neste documento (`IDN-C-1`…`IDN-C-5`) foram
> **resolvidas** por decisão do titular nomeado **rodaquino-OMNI** em **2026-08-15**
> (autoridade: `docs/00-governance/registers/g0-resolucoes-2026-08-15.md`, **DEC-G0-04**).
>
> **A ata de decisão é [`adjudicacao-decisoes-2026-08-15.md`](./adjudicacao-decisoes-2026-08-15.md).**
>
> **Como ler este documento agora:** o corpo em inglês abaixo permanece **válido e
> inalterado** — ele é o registro da evidência que fundamentou a decisão, e continua sendo a
> fonte para entender *por que* cada contradição existia. Cada eixo `IDN-C-n` recebeu, ao
> final de sua seção, um bloco **"Resolução (2026-08-15)"** em pt-BR com a disposição
> decidida. As seções **§4** (proibições) e **§5** (dono da decisão) receberam blocos de
> atualização em pt-BR — leia-os antes de agir sobre o texto original em inglês, que
> descreve o estado *anterior* à decisão.
>
> **Resumo em uma linha:** MPI é **por tenant** (ADR-041 §6 em vigor) + índice cross-PJ
> governado (ADR-043 em vigor, travado em parecer DPO/jurídico); `identifier:mpiId` é o
> elemento autoritativo; o identificador de fronteira é o `portable_subject_ref`. **O
> `Observation` continua NÃO consumível** por três razões que nenhuma decisão resolveu.

**Required by** `INTENSICARE_V2_ORCHESTRATOR_PROMPT.md` §7.4 (line 440): *"Create a
formal contradiction record and owner decision for the conflict among ADR-006's
longitudinal MPI concept, ADR-039's unresolved MPI/consent debt, ADR-041's
tenant-local MPI/root-CNPJ boundary, and the FHIR IG's longitudinal-MPI language."*

**Pinned evidence snapshot.** `Omni-Saude/amh-data-platform@0a07a6f1fab36fb2f5eeee0fcd8e945c95f67116`
(branch `main`). **OBSERVED 2026-08-14:** re-verified as the repository's current
`main` HEAD at collection time (`default_branch: main`; HEAD sha
`0a07a6f1fab36fb2f5eeee0fcd8e945c95f67116`; commit date `2026-08-14T02:17:49Z`;
`private: true`). This will not remain true — re-verify at the execution commit.

**Method.** Read-only GitHub API calls at the pinned commit. No AMH environment was
accessed, no endpoint contacted, no credential used against any AMH runtime, and
**nothing was written to the AMH repository**. No PHI, credentials, tokens, secrets
or infrastructure identifiers are reproduced below.

**Scope discipline.** This record *states* the contradiction and its consequences.
It does **not** resolve it, does **not** select longitudinal versus tenant-local MPI,
and does **not** approve any identity policy. Per prompt §2 item 7: *"V2 must not
select one silently."* Nothing in this file carries the label `DECIDED`.

**Relationship to prior work.** The Wave-1 dossier
([`../four-layer-dossier.md`](../four-layer-dossier.md)) recorded four contradictions
numbered C-1…C-4 (vitals, auth, manifest status, Observation shape) and explicitly
deferred identity to this record ([`../claim-verification-matrix.md`](../claim-verification-matrix.md)
Claim 8 scope note: *"ADR-006 and ADR-039 were **not read** this cycle"*). This
document opens a **separate** series, `IDN-C-1…IDN-C-5`, and does not renumber C-1…C-4.

---

## 0. Why this is a hard blocker, not a background concern

**OBSERVED** (this cycle, read directly from the profile JSON at the pinned commit):

| Profile | Element | Cardinality |
|---|---|---|
| `Observation-amh-laboratory` (`schemas/fhir-profiles/Observation-amh-laboratory-profile.json`, blob `62bff188ea71c2cb737f725d02ccb79c606ba62f`) | `Observation.extension:mpiId` | **1..1** |
| same | `Observation.extension:tenantId` | **1..1** |
| `Patient-amh` (`schemas/fhir-profiles/Patient-amh-profile.json`, blob `d7fe80587c1c183e6c3885546ee5a1b221867f83`) | `Patient.extension:mpiId` | **1..1** |
| same | `Patient.extension:tenantId` | **1..1** |
| same | `Patient.identifier:mpiId` | **0..1** |

**INFERENCE** (from the cardinalities above plus §1 positions): every profile-conformant
AMH `Observation` is *required* to carry an MPI reference. There is no conformant way
to consume an AMH Observation while remaining agnostic about what that MPI reference
means. Because the four positions in §1 assign that field four incompatible meanings,
**AMH Observation consumption is blocked on this adjudication** — independently of, and
in addition to, the separately-recorded fact that the Observation source is empty
(`../claim-verification-matrix.md` Claim 6).

---

## 1. The conflicting positions

Each position is recorded with its **status exactly as the file itself records it**,
its date, its recorded decider, and verbatim supporting text. Portuguese is preserved;
English glosses are the collector's translation and are marked as such.

### Position P1 — ADR-006: a single longitudinal cross-tenant MPI, gated by consent

| Field | Value |
|---|---|
| Path | `architecture/adrs/ADR-006-mpi-linking-deterministico-probabilistico-consent-gate.md` |
| Blob SHA | `a08cba29be880047947b6bd0930624151ed3e143` |
| **Status as recorded in the file** | `Accepted` (L3) |
| Date in file | `2026-05-10` (L4) |
| Decision-makers in file | `@amh/principal-architect, @amh/cto` (L5) |
| Re-evaluation date in file | `Reavaliar em: 2027-05-10` (L149) |

Verbatim:

> L14: `O Master Patient Index (MPI) é o componente que resolve esse problema: atribui um `mpi_id` único e estável a cada indivíduo, vinculando todos os seus registros cross-tenant.`

> L161 (Notes, quoting the SAD §5.4): `"a MPI é única autoridade sobre identidade longitudinal do paciente. Cada tenant retém seus identificadores nativos e os relaciona com `mpi_id`."`

> L54: `Toda view cross-tenant filtra por `consent_status='explicit' AND 'sharing_amh_internal' = ANY(consent_scope)`.`

**Gloss (collector).** One `mpi_id` per human being, spanning every tenant; cross-tenant
federation of that identity is permitted and is controlled by an explicit consent gate.

### Position P2 — ADR-039: `amh-mpi-id` is the canonical identity key, with debt that blocks clinical go-live

| Field | Value |
|---|---|
| Path | `architecture/adrs/ADR-039-fhir-ingestion-views-vs-cdc-and-mpi-patient-identity.md` |
| Blob SHA | `14c693a4022ea7d412269cd3716d8aebcac6694d` |
| **Status as recorded in the file** | `Accepted` (L3) |
| Date in file | `2026-07-23` (L4) |
| Decision-makers in file | `@lsilva` (L5) |
| Superseded (partially) by | ADR-040 L5–6, quoted under IDN-C-2 below |

Verbatim:

> L63: `### 2. Identidade: `amh-mpi-id` é a chave canônica; o produtor popula via MPI enrichment; consent chaveia nela`

> L65–67: `**Sistema canônico do identifier de MPI:** `https://fhir.americashealth.com.br/NamingSystem/amh-mpi-id` (slice `identifier:mpiId` do perfil `Patient-amh` da IG).`

> L72: `**Consent gate chaveia no identifier de MPI**, não no `Patient.id`.`

And its own recorded, unresolved debt:

> L85: `## Accepted debt (documentada; bloqueia o go-live clínico da Fase 2)`

> L87–88: `1. **MPI enrichment não cabeado:** `resolve_mpi_id` retorna None → o identifier de MPI ainda não é populado.`

> L92–94: `2. **⚠️ Gap LGPD:** Patient sem `mpi_id` resolvido hoje **passa** pelo consent (tratado como sem-subject → allow).`

> L95–97: `3. **Recursos clínicos (Observation/Condition/...):** o consent usa a referência `subject` (Patient/<id source-scoped>); o binding correto ao mpi_id golden do Patient referenciado exige resolução`

> L98–99: `4. **Nada validado em runtime:** o pipeline FHIR está parqueado (ADR-036); estas correções são de contrato/código, provadas por leitura, não por execução.`

**Gloss (collector).** ADR-039 does not choose *scope* — it choses *which field carries
identity* and states that the mechanism to populate it does not exist yet. It is the
"unresolved MPI/consent debt" named by prompt §7.4.

### Position P3 — ADR-041 §6: the MPI is per tenant and does not cross PJs

| Field | Value |
|---|---|
| Path | `architecture/adrs/ADR-041-grao-do-tenant-fonte-erp-compartilhada.md` |
| Blob SHA | `0e95b1b6edd429c7ffa497970ea9179adbea6adc` |
| **Status as recorded in the file** | `Accepted` (L3) |
| Date in file | `2026-07-26`, with an in-file correction dated `2026-07-27` (L4, L32) |
| Decider in file | `owner do produto (decisão registrada em conversa; ver §Contexto)` (L5) |

Verbatim:

> L29: `### 1. O grão é a **raiz de CNPJ** — 12 tenants`

> L123: `### 6. O MPI **NÃO cruza tenants** (D3 — decidido pelo owner, 2026-07-26)`

> L128–130: `**Decidido: o MPI é POR TENANT.** Cada PJ tem seu próprio índice, resolvendo identidade apenas dentro do próprio escopo. Nenhum artefato da plataforma atravessa a fronteira da PJ.`

> L137–141: `❌ **Perde-se a visão única do paciente no grupo.** ... ❌ Os 4.220 pacientes multi-PJ passam a ter **N identidades distintas**, uma por PJ. Não há reconciliação.`

> L145–147: `Se no futuro o negócio quiser a visão consolidada ... será necessário **reabrir esta decisão** e aí sim construir o consent gate — não é algo que se acrescenta depois sem redesenho.`

And the measured population the decision declines to link:

> L22: `**4.220 pacientes (3,88%)** têm atendimento em mais de uma PJ`

**Gloss (collector).** The same human being who is treated at two PJs deliberately has
two distinct `mpi_id` values, permanently, with no reconciliation. Note this ADR
explicitly records that reopening it is a *redesign*, not an increment.

### Position P4 — the FHIR IG: `amh-mpi-id` is a stable **cross-tenant** longitudinal key

| Field | Value |
|---|---|
| Path | `schemas/fhir-profiles/README.md` |
| Blob SHA | `c1d6a5b56bacfac5e516bd8468983c4cebd76b96` |
| **Status as recorded** | The IG package is `1.0.0`, FHIR R4 `4.0.1` (recorded in `../claim-verification-matrix.md` Claim 4). The README carries no status/date/decider header of its own. |

Verbatim:

> L171 (extension table): `| `amh-mpi-id` | `valueString` (UUID v4) | 0..1 (Patient: 1..1) | Chave MPI longitudinal cross-tenant |`

> L240: `## Modelo de identidade longitudinal (MPI)`

> L244–246: `1. **MPI ID (chave longitudinal)** — `extension amh-mpi-id` + `Patient.identifier` slice `mpiId`. UUID v4 estável durante todo o ciclo de vida do paciente. Imutável após criação.`

> L257: `├── extension amh-mpi-id: "7c9b3e84-..."        ← chave estável cross-tenant`

> L236: `O HAPI Server aplica isolamento via interceptor que injeta `amh-tenant-id=<session_tenant>` automaticamente em toda query, exceto quando o caller tem role `cross_tenant_authorized=true`.`

> L279–280: `4. Exceção: tokens com claim `cross_tenant_authorized=true` (ex: role `amh-data-leadership`) podem buscar cross-tenant — auditado em `mpi.consent_log`.`

**Gloss (collector).** The IG — the artifact a FHIR consumer is expected to build
against — states the P1 semantics *and* documents a cross-tenant read escape hatch.

### Position P5 — ADR-043: a separate cross-PJ correspondence index, authorized but not yet legally cleared

*Not named in prompt §7.4; found this cycle and material, because it is the most
recent identity decision in the repository and partially re-opens P3.*

| Field | Value |
|---|---|
| Path | `architecture/adrs/ADR-043-indice-de-correspondencia-de-identidade-entre-pjs.md` |
| Blob SHA | `cb6b78b81a23cbb5ea14dd2807b787e615f945f9` |
| **Status as recorded in the file** | `Accepted` (L3) |
| Date in file | `2026-08-03` (L4) |
| Decider in file | `owner do produto — base legal confirmada em 2026-08-03` (L5) |
| **Blocking condition recorded in the file itself** | L5–6: `**O parecer do DPO/jurídico deve ser anexado a este ADR antes do primeiro apply.**` |

Verbatim:

> L36: `### 1. Um índice de correspondência separado — nunca um MPI global`

> L38–41: `O cruzamento vive numa estrutura **própria**, que guarda apenas pares: `(tenant_a, mpi_id_a)  <->  (tenant_b, mpi_id_b)  + score + origem + revisor + data``

> L49–51: `Descartado um MPI global ... e foi justamente ele que permitiu, até 2026-07-29, um agente de qualquer tenant resolver o `mpi_id` de qualquer outro. Recriá-lo desfaz a Onda 5 inteira.`

> L109–111: `Este ADR **autoriza** a correlação entre PJs. É uma reversão deliberada de uma propriedade que a Onda 5 construiu e testou.`

**Gloss (collector).** Cross-PJ correlation is *authorized in principle* but lives in a
separate, role-gated, identifier-free structure — and its first apply is gated on a
legal opinion that the ADR itself records as not yet attached.

### Position P6 — ADR-042 XRD-05 / AMH-020b: the boundary identifier is an opaque, purpose-bound, per-PJ `portable_subject_ref` — designed, gated, not applied

| Field | Value |
|---|---|
| Paths | `architecture/adrs/ADR-042-fronteira-compatibilidade-maezo-contratos-canonicos-amh.md` (blob `a79975ae005c12c42aca2b3daffb34c302b4edb3`); `docs/plans/amh-020b-portable-subject-ref-design-2026-08-04.md` (blob `5e8e92c6759614eaed0d836f6d1763c0689a98cf`); `schemas/iceberg/mpi/subject_ref.sql` (blob `5ae4f7267e3a44532deab2c53af503bd11265fc5`); `schemas/iceberg/mpi/subject_ref_alias.sql` (blob `d8a45095b1503c6392eb84499ec9e11d9fdbde08`) |
| **Status as recorded** | ADR-042 L3: `Accepted — ratificado por Rodrigo (repo owner) 2026-08-03`, with the same line recording that downstream operational gates including `DPO/Legal em identidade/consent` **remain required**. AMH-020b L5–7: `**Design + DDL versionado NÃO aplicado.** Aplicar qualquer DDL deste design é **gate humano DPO/Legal (XRD-05)**`. |

Verbatim — ADR-042 L93 (XRD-05, the normative clause):

> `Sujeito no core payer = `portable_subject_ref` mintado pela AMH, opaco e estável dentro de `{amh_tenant, legal_entity}`; só a AMH mapeia para source record/beneficiário/MPI por tenant/FHIR; nenhum ID cru de paciente/beneficiário/MPI entra no domínio Maezo; merges viram aliases AMH. Cláusula gated por DPO/Legal.`

Verbatim — AMH-020b, the property that matters most to a consumer:

> L96–99: `**A MESMA pessoa em outra PJ tem OUTRO ref, de propósito.** Isso é o espelho contratual do ADR-041 §6: a fronteira da PJ não é atravessada pelo identificador.`

> L450–453: `**Aplicar qualquer DDL deste design = gate humano DPO/Legal (XRD-05 ...). Este documento e os DDLs versionados NÃO autorizam apply, grant, criação de segredo, backfill nem tráfego.**`

Both DDL files repeat the gate in their own headers (`subject_ref.sql` L8;
`subject_ref_alias.sql` L8): `Gate    : DDL versionado NÃO aplicado`.

**Gloss (collector).** This is the artifact prompt §7.4 line 445 anticipates — *"prefer
an opaque, purpose-bound portable subject reference at the integration boundary when an
authoritative AMH contract provides it."* **OBSERVED: at the pinned commit no such
contract is yet in force.** The design exists, the DDL is versioned, and both state on
their face that they are not applied and do not authorize traffic. See
[`interim-identity-policy.md`](./interim-identity-policy.md) rule **IDP-02**.

---

## 2. The five conflict axes

### IDN-C-1 — Scope of `mpi_id`: global-per-person versus one-per-person-per-PJ

**The conflict.** P1/P4 assert one `mpi_id` per human across tenants; P3 asserts one
`mpi_id` per human **per tenant**; P5 asserts the cross-PJ relation exists only as a
separate, gated pair-table; P6 asserts the externally visible subject reference is
per-`{tenant, legal_entity}` by construction.

**Why it is a genuine conflict and not a layering.** The same field name
(`mpi_id`), the same FHIR extension (`amh-mpi-id`) and the same NamingSystem URI
(`https://fhir.americashealth.com.br/NamingSystem/amh-mpi-id`) carry both semantics.
A consumer receiving `amh-mpi-id = X` cannot tell from the wire whether `X` denotes a
person or a person-within-a-PJ. **INFERENCE** (from P1 L14 + P3 L128 + P4 L257): under
P1/P4 semantics, equality of `mpi_id` across two tenants means "same person"; under P3
semantics, equality across two tenants is either impossible or accidental — and ADR-043
L27–29 records that per-tenant HMAC keying makes the same CPF hash *differently* per
tenant precisely so that it cannot collide. Treating the two semantics as
interchangeable is therefore not a conservative approximation in either direction: one
direction fabricates identity, the other silently fragments it.

**Chronology (OBSERVED, offered as context — not as adjudication).** P1 `2026-05-10` →
P2 `2026-07-23` → P3 `2026-07-26/27` → P5 `2026-08-03` / P6 ratified `2026-08-03`,
designed `2026-08-04`. No artifact examined marks P1 or P4 as superseded, deprecated or
retired. **A later date is not a supersession**; only an AMH owner can say which is in
force.

#### Resolução (2026-08-15) — **AQ-1, Opção C**

**Decidido por rodaquino-OMNI** (DEC-G0-04); ata em
[`adjudicacao-decisoes-2026-08-15.md`](./adjudicacao-decisoes-2026-08-15.md) §2 AQ-1.

**O `mpi_id` é POR TENANT.** O **ADR-041 §6 está EM VIGOR**. O cruzamento entre PJs existe
apenas como o **índice de correspondência separado do ADR-043**, também **EM VIGOR**, cujo
primeiro *apply* continua travado no parecer DPO/jurídico exigido pelo próprio ADR-043.

Disposições: **ADR-006 SUPERSEDED quanto ao escopo de MPI**; **ADR-039 = registro
histórico**; a **linguagem longitudinal do IG README** (L171, L240, L244–246, L257) é
**defeito documental** a corrigir no **pacote IG 1.1.0**.

**Consequência clínica aceita explicitamente:** o paciente multi-PJ — **4.220 pessoas
(3,88%)**, ADR-041 L22 — aparece para a V2 como **sujeitos distintos, sem reconciliação**.
Disso decorre um requisito vinculante de produto: a **UI da V2 DEVE exibir a limitação**
("registro limitado a esta instituição"). É requisito de segurança clínica, não de UX.

*A análise em inglês acima permanece válida: ela é a evidência que fundamentou esta escolha,
e a razão de a alternativa não ser uma aproximação conservadora em nenhuma das direções.*

---

### IDN-C-2 — Which FHIR element carries identity, and what the live producer actually emits

**Declared side.** P2 (ADR-039 L65–67) names the **`identifier:mpiId` slice** as the
canonical system. The IG profiles make the **`extension:mpiId`** mandatory (`1..1` on
both `Patient-amh` and `Observation-amh-laboratory`) while making
`Patient.identifier:mpiId` **optional** (`0..1`). These are different elements with
different cardinalities, and the ADR names the optional one as canonical.

**Implementation side (OBSERVED at the pinned commit).** ADR-040 (blob not required for
this point; `architecture/adrs/ADR-040-...md` L5–6) records that it
`**Supersede parcialmente:** ADR-039 (a decisão de *quem produz* muda; a regra de "um
produtor por recurso" e o requisito de `mpi_id` continuam valendo)` and names the
current producer at L32–33: `O produtor é o adapter batch
`pipelines/batch/fhir/bronze_to_fhir.py``.

Reading that producer at the pinned commit:

- It emits `mpi_id` **only as an `identifier`** entry (`bronze_to_fhir.py` L425–426:
  `if row.get("mpi_id"): idents.append({"use": "official", "system": MPI_SYSTEM, ...})`).
- **It emits no `extension` on any resource.** A count of the string `extension` across
  the 1,118-line file returns **0**.
- **It contains no consent gate.** A case-insensitive count of `consent` across the
  same file returns **0**.
- It stamps `meta.profile` with `PATIENT_PROFILE = "https://fhir.americashealth.com.br/StructureDefinition/Patient-amh"` (L97) — the real IG profile — while stamping the
  other seven resource types with `https://amh.health/fhir/StructureDefinition/BR*`
  URLs (L319–325), including `OBS_PROFILE = ".../BRObservation"` (L325).

**INFERENCE (high confidence, document-level).** Resources produced by the current
producer and claiming `meta.profile = Patient-amh` cannot satisfy that profile's
mandatory `extension:mpiId (1..1)` and `extension:tenantId (1..1)`, because the producer
emits no extensions at all. Separately, ADR-039 L81–83 records that the `amh.health/.../BR*`
profile URL pattern was a **known defect** it fixed in the Flink mapper
(`corrigida a URL do profile ... não batia com a IG → validação falharia`); the same
pattern is still present in the batch producer for the seven non-Patient types. **This
is recorded as an observation, not an accusation** — the FHIR channel is documented as
not validated in runtime (P2 L98–99), and only AMH owners can say whether server-side
validation is enforced.

**Why it belongs in an identity record.** If the mandatory identity extension is not
populated in practice, then "every Observation carries an MPI reference" is true of the
*profile* and false of the *data*, and a V2 consumer that trusts the profile will read a
missing identity as absent rather than as unverifiable. See **IDP-06** and DOM-0004.

#### Resolução (2026-08-15) — **AQ-2, Opção B**

**Decidido por rodaquino-OMNI**; ata §2 AQ-2.

1. **`identifier:mpiId` é o elemento autoritativo** — o que o produtor de fato emite.
2. **`extension:mpiId` e `extension:tenantId` são rebaixadas de `1..1`.** O tenant
   autoritativo passa a ser derivado da **partição de URL + claim do token**.
3. **URL de profile: padrão único e autoritativo `https://fhir.americashealth.com.br/…`.**
   Os carimbos `amh.health/.../BR*` do produtor batch (L319–325, incl. `OBS_PROFILE` L325)
   são **defeito do produtor**, a corrigir.
4. Tudo publicado como **IG 1.1.0**; **a V2 pina 1.1.0**.

**Efeito:** a contradição é resolvida na direção que **não** obriga a reescrever os 11,4
milhões de recursos já produzidos, e alinha o contrato ao mecanismo de isolamento que
realmente vigora (`partitioning-config.md` L34–37, L62–64).

**Atenção — o desbloqueio é parcial:** isto elimina a *perna de identidade* do bloqueio sobre
`Observation`. **Três outras pernas permanecem abertas** (fonte vazia, forma não conformante,
carimbo de profile ainda não corrigido). Ver ata §6.1 e `interim-identity-policy.md` IDP-12.

---

### IDN-C-3 — Consent: which gate is authoritative, and does it fail open or closed

**Three statements, at one commit, that do not agree.**

1. **P2 (ADR-039 L92–94)** says the gate **fails open**:
   `Patient sem `mpi_id` resolvido hoje **passa** pelo consent (tratado como sem-subject → allow)`.
2. **The code it refers to says the opposite.** `pipelines/flink/src/fhir/consent_filter.py`
   at the pinned commit documents an audit correction dated **2026-08-03** (L11–18):
   `(a) `_extract_mpi` devolvia `None` ... e `is_allowed` tratava `None` como LIBERA ...
   Agora: para os tipos ligados a paciente, identidade não resolvida = NEGA.` The module
   header states the rule as L7–9: `Regra de ouro deste módulo: **na dúvida, NEGA**.` and
   `is_allowed` at L192–205 returns a denial with reason `sem_identidade_golden` for the
   eight patient-linked types enumerated at L82–93 (which include `Observation`).
   **INFERENCE:** ADR-039's recorded debt item 2 is **stale relative to the code at the
   same commit**. Which is authoritative — the Accepted ADR or the corrected code — is
   an AMH owner call.
3. **Neither applies to the live channel.** The Flink path is parked (P2 L98–99) and the
   current batch producer contains no consent logic at all (IDN-C-2). Meanwhile
   `pipelines/flink/src/fhir/patient_mapper.py` L110–119 still defines
   `resolve_mpi_id(...) -> str | None` returning `None` by default, documented as
   `Hook de MPI enrichment: por padrão None`.

**And there is no consent data to gate with.** ADR-045
(`architecture/adrs/ADR-045-formato-do-log-de-consentimento.md`, blob
`b2a358342737b6dc25444bea9ca1ca820990fb30`, **Status `Accepted` (L3), date `2026-08-06`
(L4)**) records:

> L82–84: `**Não existe escritor.** Nenhum `INSERT INTO mpi.consent_log` no repositório inteiro ... A tabela tem 14 consumidores ... e **zero produtores**.`

> L99–104: `A origem do consentimento continua sendo decisão de negócio + DPO. ... O único campo de permissão que chega ao lake é `ie_perm_sms_email` ..., que é permissão de CONTATO, não consentimento de finalidade — usá-lo como consentimento LGPD seria fabricar base legal.`

> L106–110: `**O vocabulário de `scope` está partido em dois.** O DDL usa `analytics | research | sharing_amh_internal | external_sharing`. O gate dos agentes ... usa `treatment | research | billing | ml_training | operational_analytics``

**INFERENCE (from P1 L54 + ADR-045 L82–84 + L106–110).** P1's cross-tenant federation is
conditioned on a consent gate whose log has no writer and whose scope vocabulary is
split in two incompatible enumerations. Therefore the P1 position, as written, is not
presently satisfiable by the platform's own recorded state — which is itself a fact the
adjudication must weigh, and which V2 must not paper over by assuming consent.

#### Resolução (2026-08-15) — **AQ-3, Opção C**

**Decidido por rodaquino-OMNI**; ata §2 AQ-3. **Cláusula de natureza jurídica — ver a regra
de supersessão reforçada abaixo.**

1. A base legal do **laço clínico single-tenant em contexto de tratamento** é a **LGPD
   Art. 11, II, "f" — tutela da saúde**, em procedimento realizado por profissionais/serviços
   de saúde.
2. **O laço clínico NÃO tem portão de consentimento.** Seu portão exigível é
   **propósito-de-uso + autorização de contexto profissional**.
3. **Consentimento rege apenas usos secundários** (pesquisa, analytics, compartilhamento),
   que ficam **BLOQUEADOS** até existir infraestrutura real.
4. **`ie_perm_sms_email` JAMAIS é consentimento** — registrado em definitivo.

**Por que isto dissolve a contradição sem fechá-la à força:** a divergência documentada acima
(ADR-039 falha-aberta × código falha-fechada × ausência de portão no canal batch) deixa de
bloquear o laço clínico, porque o consentimento **não é** o portão dele. A ausência de
produtor em `mpi.consent_log` (ADR-045 L82–84) passa a ser o que sempre foi de fato: um
bloqueio de **uso secundário**, não de tratamento.

> **Regra de supersessão reforçada (DEC-G0-03).** Material jurídico produzido nesta fase é
> **sugestão**. A qualificação da base legal **exige ratificação por advogados brasileiros
> antes de qualquer tratamento de dados reais, operação sombra ou piloto** (G6/G8). Até lá, o
> desenvolvimento prossegue **exclusivamente com dados sintéticos**.

---

### IDN-C-4 — Tenant enumeration drift between the IG and the tenant-grain ADR

**OBSERVED.** The IG README L204 records the `amh-tenant` CodeSystem as
`**amh-tenant:** 10 tenants AMH operacionais (austa_clinicas, omni, etc.)`, and the
worked example at L258 uses `extension amh-tenant-id: "austa_clinicas"`.

ADR-041 retires exactly that value (L77–78: the landing tenant is `amh_landing` and
`o `austa_clinicas` é **aposentado**`) and sets the business-tenant set to 12. AMH-020b
L194–198 makes the prohibition explicit and machine-checkable (invariant I-8):
`Proibidos por construção: `amh_landing` ..., `austa_clinicas` (aposentado pelo ADR-041 §2)`.

**INFERENCE.** `amh-tenant-id` is a `required`-bound coded element in the IG (README
L213). If the bound ValueSet still enumerates a retired tenant and omits the post-ADR-041
tenants, then the *tenant* half of every subject reference is also unsettled — not only
the *person* half. A V2 tenant-scoping rule cannot be built on a ValueSet whose contents
the governing ADR has superseded. **VALIDATION REQUIRED:** the ValueSet JSON contents
were not enumerated this cycle; only the README's description of them was read.

#### Resolução (2026-08-15) — **AQ-6, Opção A** (parte 1 de 2)

**Decidido por rodaquino-OMNI**; ata §2 AQ-6.

**A enumeração autoritativa é o conjunto pós-ADR-041 — 12 tenants de negócio.** O
**CodeSystem/ValueSet `amh-tenant`** (IG README L204, que ainda lista 10 tenants e inclui o
aposentado `austa_clinicas`) e a **tabela de partições do HAPI**
(`partitioning-config.md` L41–45) são **artefatos defasados**, a corrigir no **IG 1.1.0**.

**Tenant piloto da V2:** nome **adiado** para a redação do contrato.

*A ressalva registrada acima — de que o conteúdo JSON do ValueSet não foi enumerado neste
ciclo, apenas a descrição no README — permanece verdadeira e continua sendo um item de
verificação quando o IG 1.1.0 for publicado.*

---

### IDN-C-5 — Two different tenant boundaries are enforced at two different layers

**OBSERVED.** HAPI enforces tenancy by **URL partition with token-claim equality**
(`applications/hapi-fhir/config/partitioning-config.md`, blob
`ab77f80e11401387e04201101361a87937b0dc8e`):

> L34–37: `**A identificação de tenant não se escolhe por chave**: a simples PRESENÇA do bloco `partitioning` faz o starter registrar o `RequestTenantPartitionInterceptor` e a `UrlBaseTenantIdentificationStrategy` ... É por URL, sempre.`

> L62–64: `**Compara o tenant do token com o tenant da URL e nega quando divergem** — e nega também quando não há tenant na URL. É este passo que faz o isolamento por PJ, não um header.`

> L79–80: `- `allow_references_across_partitions: false` → resources in tenant A cannot `Reference` resources in tenant B.`

> L58–59: `Recusa a requisição que traga `X-Partition-Name` ou `X-Request-Partition-IDs` do cliente (403): a partição não é escolhida por quem chama.`

But the same document's partition table (L41–45) lists only `tenant_austa_clinicas` and
`tenant_omni_saude` — the pre-ADR-041 names — and records that bootstrap does not exist:

> L91: `**`com.amh.fhir.bootstrap.PartitionInitializer` NÃO EXISTE.**`

> L99–105: `Consequência: **as partições não são criadas por este servidor**. ... requisição a `/fhir/<tenant>/...` cujo tenant não tenha partição correspondente falha no HAPI.`

Meanwhile the IG (P4 L236, L279–280) describes a *different* mechanism — an extension-
injecting interceptor with a `cross_tenant_authorized=true` bypass claim.

**INFERENCE.** Two documents describe two different tenant-enforcement mechanisms for the
same server, and one of them advertises a cross-tenant bypass that the other's
configuration (`allow_references_across_partitions: false`, URL-derived partition, no
client-selectable partition) gives no evident way to express. Which is deployed is
**Layer 2 evidence** that this cycle could not obtain. Prompt §7.4 line 451 already
requires V2 to test the URL/claim rule empirically rather than trust either description.
Recorded here because a "cross-tenant authorized role" is, if real, an identity-scope
decision — not merely an auth detail.

---

#### Resolução (2026-08-15) — **AQ-6, Opção A** (parte 2 de 2)

**Decidido por rodaquino-OMNI**; ata §2 AQ-6.

**`cross_tenant_authorized` é deriva documental. NENHUM bypass existirá em ambiente
implantado.** Os **testes negativos da V2 afirmam a impossibilidade** — não a mera ausência
observada. A descrição do IG (L236, L279–280) é, portanto, texto a corrigir, e não uma
capacidade a suportar.

O mecanismo de fronteira vigente é o descrito em `partitioning-config.md`: **partição por URL
com igualdade entre o tenant do token e o tenant da URL**, referências cross-partition
desabilitadas, partição não selecionável pelo chamador. Este é também o mecanismo que o
**AQ-2** elege como fonte autoritativa do tenant, no lugar de `extension:tenantId`.

*Permanece verdadeiro e não decidido:* qual é o comportamento **implantado** — isto é
evidência de Camada 2, que este ciclo não pôde obter, e que o prompt §7.4 exige testar
empiricamente. A decisão fixa o contrato; ela não substitui a medição.

---

## 3. Consequences for IntensiCare V2 of each candidate resolution

**PROPOSAL / INFERENCE.** The table states what each outcome would mean for V2. It does
**not** rank, recommend, or select. Selection belongs to the decision owner named in §5.

| Resolution | What V2 could then rely on | What V2 would have to build or forgo | Principal V2 risk |
|---|---|---|---|
| **R-A — P1/P4 in force: MPI is longitudinal and cross-tenant** | A single subject key per person; a patient's ICU episode at PJ-A can be contextualized with history from PJ-B | A consent-and-purpose enforcement path that AMH does not presently have a writer for (IDN-C-3); V2 would be relying on a gate whose log is empty | V2 becomes a consumer of cross-PJ PHI whose legal basis is recorded in AMH as pending (P5 L5–6). Highest LGPD exposure of the four. |
| **R-B — P3 in force: MPI is tenant-local** | Hard, verifiable isolation; the subject key means "this person as known to this PJ"; no cross-PJ inference is possible or attempted | The 4,220 multi-PJ patients (P3 L22) appear as N distinct subjects with no reconciliation; any V2 feature implying "the patient's full history" is false and must not be built or claimed | **Clinical**: a V2 evaluation may fire or not fire on a partial record while the UI implies completeness. Requires an explicit, visible completeness/degraded-mode statement (DOM-0007). |
| **R-C — P5 in force: tenant-local MPI plus a separately governed cross-PJ index** | Isolation by default with an auditable, revocable correlation object; ADR-043 L98 notes revocation is `apagar linha do índice` rather than an MPI reprocess | V2 must never receive the index itself; any cross-PJ context would arrive only through an AMH-mediated, purpose-bound API that does not exist today; the first apply is gated on a legal opinion the ADR records as not yet attached (P5 L5–6) | V2 designs against a capability that may never be legally cleared. Schedule risk, not safety risk, provided V2 does not pre-suppose it. |
| **R-D — P6 in force: the boundary identifier is an opaque per-PJ `portable_subject_ref`** | The cleanest consumer contract: V2 never handles `mpi_id`, CPF or CNS; merges resolve AMH-side and never break the consumer (AMH-020b L339–342); scope is unambiguous by construction | Nothing is applied: no table, no role, no key, no backfill, no traffic (AMH-020b L450–453, L500–506 SP-1…SP-7). V2 would need an equivalent internal key until AMH mints one, plus a migration path when/if it does | V2 builds an internal subject key that later has to be reconciled with an AMH-minted one. Manageable if V2's key is *internal-only* from day one (see IDP-02). |

**Cross-cutting consequence, true under every resolution (INFERENCE from §0 + IDN-C-2).**
Because `Observation.extension:mpiId` is `1..1` and the live producer emits no
extensions, **Observation consumption is blocked under R-A, R-B, R-C and R-D alike**
until AMH states which element carries identity on the wire and what its scope is. The
identity adjudication is therefore not on the critical path *in parallel with* the
Observation work — it is *upstream of* it.

---

## 4. What V2 must NOT do until this is adjudicated

**Binding on all V2 specialists, per prompt §2 item 7 ("V2 must not select one
silently") and §7.4.** Each prohibition is operationalized as a rule in
[`interim-identity-policy.md`](./interim-identity-policy.md).

| # | Prohibition | Rule |
|---|---|---|
| N-1 | Do **not** adopt, assume, or encode either MPI scope — in code, schema, ADR, diagram, test fixture, or prose. Statements about AMH identity must cite this record and name the open question. | IDP-01 |
| N-2 | Do **not** treat `amh-mpi-id` equality across two tenants, partitions or PJs as identity of a person. Do not build any index, cache, key, join or lookup whose correctness depends on that equality. | IDP-03 |
| N-3 | Do **not** join, correlate, deduplicate or merge subjects across clinical PJs / tenants / source partitions on CPF, CNS, name, birth date, mother's name, phone, or any combination — even where the values are present and match. Note **OBSERVED**: the live producer *does* emit CPF in clear on `Patient.identifier` (`bronze_to_fhir.py` L427–428, `CPF_SYSTEM` at L94), so this join is technically available and must be prohibited by design, not by absence. | IDP-04 |
| N-4 | Do **not** rely on any AMH consent signal as an enforcement input while ADR-045 L82–84 records zero producers for `mpi.consent_log`, and do **not** substitute `ie_perm_sms_email` or any contact-permission field for purpose consent (ADR-045 L99–104 calls that `fabricar base legal`). | IDP-07 |
| N-5 | Do **not** declare AMH `Observation` consumable, eligible, or pathway-supporting on the basis of this record. The `mpiId 1..1` blocker stands in addition to the empty-source blocker (Claim 6) and the profile-shape contradiction (C-4). | IDP-06 |
| N-6 | Do **not** implement, request, or design around a `cross_tenant_authorized`-style bypass (P4 L279–280). Its existence is unverified and it is an identity-scope decision, not a permission toggle. | IDP-09 |
| N-7 | Do **not** send or trust client-selected tenant headers, and do not assume a partition exists for any tenant (`partitioning-config.md` L58–59, L99–105). | IDP-05 |
| N-8 | Do **not** copy AMH's 28-field envelope, `mpi_id`, or any raw source identifier into a V2 contract as a subject key. XRD-05 (P6) forbids raw IDs at the analogous boundary; prompt §7.5 line 476 independently requires opaque subject references and PHI minimization. | IDP-02 |
| N-9 | Do **not** treat this record, or any V2 artifact, as closing the question. Only the §5 owners can. No agent may apply the label `DECIDED` (`docs/00-governance/evidence-notation.md` §2, table row `DECIDED`). | — |

---

### Atualização de §4 após a adjudicação (2026-08-15)

A tabela em inglês acima descreve o regime **anterior** à decisão. Regime vigente:

| # | Estado após 2026-08-15 |
|---|---|
| **N-1** | **EXTINTA** — a seleção foi feita (AQ-1, Opção C). A obrigação que a substitui: todo artefato da V2 que trate de identidade AMH **cita a ata**, não mais a questão em aberto. |
| **N-2** | **PERMANENTE, e agora por decisão e não por cautela.** `mpi_id` igual em dois tenants **não** significa mesma pessoa: o MPI é por tenant. |
| **N-3** | **PERMANENTE.** Nenhum join cross-PJ por CPF ou qualquer identificador. O cruzamento é exclusividade do índice do ADR-043, interno à AMH e travado em parecer DPO/jurídico. |
| **N-4** | **REENQUADRADA (AQ-3).** Não há portão de consentimento no laço clínico. A proibição sobre `ie_perm_sms_email` **permanece absoluta**; usos secundários seguem **bloqueados**. |
| **N-5** | **PERMANECE.** `Observation` continua **não consumível**: AQ-2 resolveu a perna de identidade; fonte vazia, forma não conformante e carimbo de profile seguem abertos (ata §6.1). |
| **N-6** | **PERMANENTE e reforçada (AQ-6).** Nenhum bypass existirá; os testes afirmam impossibilidade. |
| **N-7** | **PERMANENTE.** Reforçada pelo AQ-2, que torna o par URL/claim a fonte autoritativa do tenant. |
| **N-8** | **SUPERSEDED pelo AQ-4 — na direção mais estrita.** A V2 não cria chave interna paralela: adota o **`portable_subject_ref`** nativamente desde o dia um. Nenhum identificador cru da AMH atravessa a fronteira. |
| **N-9** | **CUMPRIDA.** A questão foi fechada pela autoridade nomeada. Permanece válida a regra de que **nenhum agente** aplica `DECIDED` por conta própria. |

---

## 5. Decision owner and required decision form

**Decision owner: AMH owners + the V2 identity authority — UNASSIGNED — VALIDATION REQUIRED.**

**INFERENCE (from ADR-042 L5, which enumerates the approver roles AMH itself requires for
identity/consent clauses):** the AMH-side approvers this adjudication appears to need are
`Principal Architect AMH + CTO`, `Clinical Platform Lead (FHIR/MPI)`, and
`DPO + Compliance (LGPD/ANS)`. **These are role names copied from the AMH artifact; no
individual is named here, and no person has been contacted or has agreed to anything.**
The one personal name appearing in the AMH artifacts in an approval capacity
(ADR-042 L3, ADR-039 L5) is recorded there as the AMH repo owner / ADR author and is
**not** asserted by this document to be the owner of this adjudication.

The V2-side authority does not exist yet: no V2 identity authority has been appointed.
Per `docs/00-governance/evidence-notation.md` §2 rule 7, the owner field reads
`UNASSIGNED — VALIDATION REQUIRED`, verbatim, and no placeholder name is substituted.

**Required form of the resolution** (per prompt §2 and `evidence-notation.md` §4) — a
`DECIDED` entry carrying: `decided_by` (named human authority, not a role, not an agent);
`decided_date`; `rationale`; and `supersession_rule`. It must additionally state, for
each of IDN-C-1…IDN-C-5, which position is in force and what becomes of the others
(superseded / scoped / withdrawn). A resolution that answers IDN-C-1 alone does not
unblock V2 Observation consumption — see the cross-cutting consequence in §3.

The unblock request is written for AMH owners at
[`adjudication-request-to-amh-owners.md`](./adjudication-request-to-amh-owners.md).

---

### Atualização de §5 após a adjudicação (2026-08-15)

O texto em inglês acima registra que **nenhuma autoridade estava nomeada**. **Isso mudou.**

| Campo | Valor vigente |
|---|---|
| `decided_by` | **rodaquino-OMNI** — CEO e acionista principal da OMNI e da AMH; médico intensivista |
| `decided_date` | **2026-08-15** |
| Registro da autoridade | `docs/00-governance/registers/g0-resolucoes-2026-08-15.md` — **DEC-G0-04** |
| Autoridade AMH | Detida pelo mesmo titular, na qualidade de CEO/acionista principal |
| Autoridade de identidade da V2 | **AUTH-DATA-PLATFORM**, mesmo titular (DEC-G0-04) |
| Via | Delegação em sessão, transmitida pelo orquestrador de entrega |
| Escriba | Analista de adjudicação de identidade e tenancy AMH (Onda 2) |
| Ata | [`adjudicacao-decisoes-2026-08-15.md`](./adjudicacao-decisoes-2026-08-15.md) |

**As duas lacunas que esta seção registrava estão fechadas** — a AMH e a V2 têm autoridade
nomeada, e são a mesma pessoa. A ata cumpre a forma exigida por `evidence-notation.md` §4
(`decided_by`, `decided_date`, `rationale`, `supersession_rule`), **por decisão**, e responde
`IDN-C-1`…`IDN-C-5` individualmente, com a disposição de cada artefato — que era a exigência
adicional registrada nesta seção.

**Pendências de forma que permanecem** (ata §0.3 e §8): contra-assinatura do titular ou
alocação de IDs `GDEC-nnnn` no `decision-register.md`; e, para o AQ-3, **ratificação por
advogados antes de qualquer dado real** (DEC-G0-03).

---

## 6. Evidence index

| Artifact | Blob SHA at pinned commit | Read this cycle |
|---|---|---|
| `architecture/adrs/ADR-006-mpi-linking-deterministico-probabilistico-consent-gate.md` | `a08cba29be880047947b6bd0930624151ed3e143` | full (161 lines) |
| `architecture/adrs/ADR-039-fhir-ingestion-views-vs-cdc-and-mpi-patient-identity.md` | `14c693a4022ea7d412269cd3716d8aebcac6694d` | full (116 lines) |
| `architecture/adrs/ADR-040-fonte-bronze-para-fhir-e-fatia-clinica-do-lakehouse.md` | not collected | §Decisão + §Consequências |
| `architecture/adrs/ADR-041-grao-do-tenant-fonte-erp-compartilhada.md` | `0e95b1b6edd429c7ffa497970ea9179adbea6adc` | full (178 lines) |
| `architecture/adrs/ADR-042-fronteira-compatibilidade-maezo-contratos-canonicos-amh.md` | `a79975ae005c12c42aca2b3daffb34c302b4edb3` | header + XRD matrix |
| `architecture/adrs/ADR-043-indice-de-correspondencia-de-identidade-entre-pjs.md` | `cb6b78b81a23cbb5ea14dd2807b787e615f945f9` | full (113 lines) |
| `architecture/adrs/ADR-045-formato-do-log-de-consentimento.md` | `b2a358342737b6dc25444bea9ca1ca820990fb30` | full (115 lines) |
| `schemas/fhir-profiles/README.md` | `c1d6a5b56bacfac5e516bd8468983c4cebd76b96` | identity, tenancy, LGPD sections |
| `schemas/fhir-profiles/Patient-amh-profile.json` | `d7fe80587c1c183e6c3885546ee5a1b221867f83` | differential, parsed |
| `schemas/fhir-profiles/Observation-amh-laboratory-profile.json` | `62bff188ea71c2cb737f725d02ccb79c606ba62f` | differential, parsed |
| `applications/hapi-fhir/config/partitioning-config.md` | `ab77f80e11401387e04201101361a87937b0dc8e` | full (128 lines) |
| `docs/plans/amh-020b-portable-subject-ref-design-2026-08-04.md` | `5e8e92c6759614eaed0d836f6d1763c0689a98cf` | full (559 lines) |
| `schemas/iceberg/mpi/subject_ref.sql` | `5ae4f7267e3a44532deab2c53af503bd11265fc5` | full |
| `schemas/iceberg/mpi/subject_ref_alias.sql` | `d8a45095b1503c6392eb84499ec9e11d9fdbde08` | full |
| `pipelines/batch/fhir/bronze_to_fhir.py` | not collected | constants, `q_patient`, `map_patient`, whole-file greps |
| `pipelines/flink/src/fhir/consent_filter.py` | not collected | header, constants, `is_allowed`, `_extract_mpi` |
| `pipelines/flink/src/fhir/patient_mapper.py` | not collected | `map`, `resolve_mpi_id`, `_build_identifiers` |

**Not read this cycle (recorded as a gap, not as absence of evidence):** the SAD
sections §5.4 and §8.4 that ADR-006 L157 and L161 quote; `schemas/iceberg/mpi/patient.sql`
and `merge_history.sql`; the `amh-tenant` ValueSet JSON (IDN-C-4); `docs/governance/dpia-fhir-clinical-channel.md`;
`schemas/openapi/maezo/v1/subject-context.openapi.yaml` beyond its existence;
`tools/scripts/build-mpi-xref.py`.

---

*Prepared by the AMH tenant-and-identity adjudication analyst (Wave 2). Read-only
verification at a pinned commit. Nothing was written to the AMH repository. This record
does not resolve the contradiction, does not select an MPI model, and approves no
identity policy — all three are reserved to the owners named in §5.*
