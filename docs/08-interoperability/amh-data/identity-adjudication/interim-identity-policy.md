---
id: IDN-POLICY-001
title: Interim fail-closed identity, tenant and consent policy for AMH integration
label: PROPOSAL
status: PARCIALMENTE RATIFICADA em 2026-08-15 — ver ./adjudicacao-decisoes-2026-08-15.md e o quadro de situação após o título
statement: >
  Until IDN-CONTRA-001 is adjudicated by AMH owners and a named V2 identity
  authority, IntensiCare V2 treats every AMH-sourced subject reference as
  tenant-and-encounter-scoped, opaque, purpose-bound and non-joinable, and fails
  closed whenever tenant, identity, purpose or consent context is missing,
  mismatched or unverifiable.
provenance:
  source_repo: intensicare-V2
  path_or_url: INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §7.4 (lines 438-451); §2 item 7 (line 99); §7.5 (line 476)
  commit_sha_or_version: working tree at 2026-08-14 (branch main, commit cb35521)
  section_or_lines: §7.4 "Identity, tenant, consent and authorization adjudication"
  date_collected: 2026-08-14
  collector: AMH tenant-and-identity adjudication analyst (Wave 2)
  transformation: prompt requirements operationalized into numbered rules; AMH evidence cited from IDN-CONTRA-001
  confidence: medium — the rules are derivable from the prompt and the pinned AMH evidence, but their sufficiency is a safety judgement no agent may make
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

# Interim Identity, Tenant and Consent Policy (PROPOSAL)

> ## ⚑ SITUAÇÃO APÓS A ADJUDICAÇÃO DE 2026-08-15 — LEIA ANTES DAS REGRAS
>
> As seis questões que esta política existia para contornar foram **decididas** pelo titular
> nomeado **rodaquino-OMNI** em **2026-08-15** (autoridade: DEC-G0-04). Ata:
> [`adjudicacao-decisoes-2026-08-15.md`](./adjudicacao-decisoes-2026-08-15.md).
>
> **Esta política deixou de ser integralmente "interina".** Parte dela virou **política
> permanente**; duas regras foram **substituídas ou reenquadradas**; uma foi **extinta por
> cumprimento**. O corpo em inglês permanece **inalterado** — cada regra recebeu ao final um
> bloco pt-BR **"Situação após 2026-08-15"**, e o quadro abaixo é o índice dessas situações.
>
> ### Quadro de situação das doze regras
>
> | Regra | Situação | Origem |
> |---|---|---|
> | **IDP-01** — não selecionar modelo de identidade em silêncio | **EXTINTA POR CUMPRIMENTO** — a seleção foi feita | AQ-1 |
> | **IDP-02** — chave interna própria da V2 | **SUPERSEDED** — a V2 usa o **PSR nativamente** desde o dia um | AQ-4 |
> | **IDP-03** — escopo por tenant e encontro | **PERMANENTE** — reforçada; chave de fato clínico = `(PSR, encontro)` | AQ-1, AQ-4 |
> | **IDP-04** — nunca cruzar PJ por CPF ou identificador | **PERMANENTE** | AQ-1 |
> | **IDP-05** — tenant derivado do servidor, nunca do cliente | **PERMANENTE** — reforçada; tenant autoritativo = URL + claim | AQ-2, AQ-6 |
> | **IDP-06** — identidade não verificável ⇒ `not_evaluated` | **PERMANENTE** | inalterada |
> | **IDP-07** — falha fechada em propósito e consentimento | **REENQUADRADA** — sem portão de consentimento no laço clínico | AQ-3 |
> | **IDP-08** — resolução de identidade ≠ autorização | **PERMANENTE — e agora o controle PRIMÁRIO do laço clínico** | AQ-3 |
> | **IDP-09** — a V2 nunca constrói correlação cross-PJ | **PERMANENTE** | AQ-1, AQ-6 |
> | **IDP-10** — eventos de ciclo de vida de identidade | **ELEVADA A REQUISITO CONTRATUAL VINCULANTE** (Gate G3) | AQ-5 |
> | **IDP-11** — falha fechada em todo contexto ausente/divergente | **PERMANENTE**, com as linhas de consentimento reenquadradas | AQ-3 |
> | **IDP-12** — `Observation` bloqueado | **RE-BASELINEADA** — 1 perna resolvida, **3 abertas**; segue **NÃO consumível** | AQ-2 |
>
> **A leitura de uma linha só:** a decisão **não** desbloqueou o `Observation`.

## Status and authority

**This is a PROPOSAL. It is not approved, not binding, and not `DECIDED`.**

Per `docs/00-governance/evidence-notation.md` §2 rule 3, a proposal becomes binding
only when a **named human authority** relabels it `DECIDED` with the metadata in that
document's §4. Per rule 4, anything touching legal/privacy basis or clinical
correctness defaults to `VALIDATION REQUIRED`. Every rule below touches both.

**Two distinct approvals are required and neither exists:**

1. **AMH owners** must adjudicate `IDN-CONTRA-001` — see
   [`adjudication-request-to-amh-owners.md`](./adjudication-request-to-amh-owners.md).
2. **A named V2 identity authority** must approve this policy for V2. **No such
   authority has been appointed.** Owner reads `UNASSIGNED — VALIDATION REQUIRED`,
   verbatim; no placeholder name is substituted (`evidence-notation.md` §2 rule 7).

**What this policy is for.** Prompt §7.4 lines 442–449 lists six things V2 must do
"until that decision is approved". This document turns those six into numbered,
testable rules, links each to a domain invariant where one exists
(`docs/03-domain/invariants/DOM-invariants.md` — itself all-PROPOSAL), and states the
failure mode each rule prevents.

**Design stance.** Every rule is written so that it stays correct under **all four**
candidate resolutions in `contradiction-record.md` §3 (R-A longitudinal, R-B
tenant-local, R-C tenant-local + gated index, R-D opaque portable ref). A rule whose
correctness depends on the adjudication's outcome would be a silent selection, which
prompt §2 item 7 forbids.

---

## The blocker every rule is written around

**OBSERVED** (`contradiction-record.md` §0):
`Observation-amh-laboratory` requires `Observation.extension:mpiId` at **1..1** and
`Observation.extension:tenantId` at **1..1**. `Patient-amh` requires the same two
extensions at **1..1** while making `Patient.identifier:mpiId` optional at **0..1**.

**OBSERVED** (`contradiction-record.md` IDN-C-2): the producer named as current by
ADR-040, `pipelines/batch/fhir/bronze_to_fhir.py`, emits `mpi_id` only as an
`identifier` and emits **no `extension` on any resource** (count of `extension` across
the file: 0) and **no consent logic** (count of `consent`: 0).

**INFERENCE.** A V2 consumer therefore faces two simultaneous defects: the identity
element the profile mandates may be absent from real resources, and the meaning of
whichever element *is* present is disputed across four AMH positions. Rules **IDP-06**
and **IDP-11** exist specifically for this. This is referred to below as **the
`mpiId 1..1` blocker**.

---

## Rules

Legend for the *DOM link* column: the domain invariant the rule serves. `—` means no
existing DOM invariant covers it; a candidate new invariant is proposed inline for the
domain modeler to consider (this document does **not** create DOM entries).

---

### IDP-01 — No silent selection of an identity model

**Rule.** No V2 artifact — code, schema, migration, ADR, diagram, test fixture,
contract, UI copy or prose — may assume, encode, or imply that AMH `mpi_id` is either
global-per-person or tenant-local. Any V2 statement about AMH identity must cite
`IDN-CONTRA-001` and name the open question.

**Serves.** Prompt §2 item 7: *"V2 must not select one silently."*

**DOM link.** — (governance rule, not a domain invariant). Candidate check: a
repository lint that fails on the strings `mpi_id`, `mpiId`, `amh-mpi-id` outside the
anti-corruption layer and this directory.

**Failure prevented.** An implementation detail becoming a de-facto architectural
decision that no human ever made.

---

#### Situação após 2026-08-15 — **EXTINTA POR CUMPRIMENTO**

Esta regra existia para impedir que uma escolha de implementação virasse decisão de
arquitetura por omissão. **A escolha foi feita por autoridade humana nomeada** (AQ-1, Opção C),
e a regra cumpriu sua função.

**Obrigação que a substitui:** todo artefato da V2 que trate de identidade AMH **cita a ata**
[`adjudicacao-decisoes-2026-08-15.md`](./adjudicacao-decisoes-2026-08-15.md), e não mais "a
questão em aberto". A verificação de lint proposta (ocorrências de `mpi_id`/`amh-mpi-id` fora
da camada anticorrupção) **permanece útil** e deve ser mantida — agora reforçada pelo AQ-4,
que proíbe qualquer identificador cru da AMH dentro do domínio da V2.

**Permanece intacta** a regra geral de que **nenhum agente aplica `DECIDED` por conta
própria** (`evidence-notation.md` §2, regra 3) — inclusive nesta ata, cujo rótulo é `OBSERVED`.

---

### IDP-02 — The V2 subject key is internal, opaque, minted by V2, and never an AMH identifier

**Rule.** V2 mints its own internal subject key. It is opaque, carries no derivable
relationship to any source identifier, and is **never** an `mpi_id`, CPF, CNS,
`cd_pessoa_fisica`, source record id, or any hash of those. AMH identifiers, where
received, live **only** inside the anti-corruption layer (prompt §7.6) and are never
promoted into the V2 clinical domain core, event payloads, logs, traces, metrics,
URLs, cache keys, or quarantine records.

**Where an authoritative AMH portable reference exists, prefer it.** Prompt §7.4 line
445 requires preferring *"an opaque, purpose-bound portable subject reference at the
integration boundary when an authoritative AMH contract provides it."*

**OBSERVED: at the pinned commit, no such contract is in force.** AMH's
`portable_subject_ref` (`amh:psr:v1:<uuidv4>`) is designed and its DDL is versioned,
but `docs/plans/amh-020b-portable-subject-ref-design-2026-08-04.md` L450–453 states on
its face: *"Aplicar qualquer DDL deste design = gate humano DPO/Legal … NÃO autorizam
apply, grant, criação de segredo, backfill nem tráfego."* Both DDL files repeat the gate
in their headers (`subject_ref.sql` L8; `subject_ref_alias.sql` L8). Seven human stop
points SP-1…SP-7 remain open (AMH-020b L500–506).

**Therefore (PROPOSAL).** V2's internal key is designed so that, *if and when* AMH
mints `portable_subject_ref`, adoption is a mapping change inside the anti-corruption
layer and **not** a change to the V2 domain model. Concretely: V2's key is scoped to
`{amh_tenant, legal_entity-or-facility, encounter}` — the same stability scope AMH's
design uses (AMH-020b L91–99: *"1 ref `active` por `{amh_tenant, legal_entity, mpi_id}`"*
and *"A MESMA pessoa em outra PJ tem OUTRO ref, de propósito"*) — so the two are
structurally compatible under R-B, R-C and R-D, and under R-A the AMH-side mapping
becomes many-to-one without V2 having pre-committed to it.

**DOM link.** DOM-0001 (tenant/encounter ownership invariant at every layer).

**Failure prevented.** PHI-bearing identifiers leaking into V2 logs and events; and a
V2 domain model that has to be rewritten when AMH's boundary contract lands.

---

#### Situação após 2026-08-15 — **SUPERSEDED pelo AQ-4**

**Decidido por rodaquino-OMNI**; ata §2 AQ-4, **Opção A plena**.

A premissa desta regra — *"no pinned commit, no authoritative AMH contract provides a portable
subject reference"* — **deixou de valer por decisão**. O **`portable_subject_ref` (PSR) passa a
ser o identificador de fronteira OBRIGATÓRIO do contrato AMH×IntensiCare v1**.

**O que muda na prática:**

| Item | Regra anterior (IDP-02) | Regra vigente (AQ-4) |
|---|---|---|
| Chave de fronteira | chave interna própria da V2 | **`amh:psr:v1:<uuidv4>` — o PSR da AMH** |
| Dev/test | chave interna | **PSRs sintéticos** no mesmo formato |
| Produção | chave interna, mapeada depois | **PSRs mintados pela AMH** |
| Migração futura | reconciliar chave interna com PSR | **nenhuma** — não existe chave paralela |
| SP-1…SP-7 | condições externas indefinidas | **itens de trabalho AMH ordenados**, com o parecer DPO/jurídico como única dependência externa |

**Escopo e chaveamento:** o PSR é **independente de encontro**, mas **SEMPRE transmitido
qualificado por encontro**; a **V2 chaveia fatos clínicos pelo par `(PSR, encontro)`**.

**Fundamento da mudança:** manter uma chave interna provisória criaria dívida de migração na
camada mais sensível do sistema. Adotar o formato definitivo desde o dia um custa menos e é
mais seguro.

**Permanece válido e agora é decisão, não preferência:** nenhum `mpi_id`, CPF, CNS,
`cd_pessoa_fisica` ou identificador de fonte atravessa a fronteira da V2, em campo, chave,
log, trace, métrica, URL ou registro de quarentena.

> **Observação de forma (não altera a decisão):** o *apply* dos DDLs de PSR continua sendo
> portão humano DPO/Legal (SP-1). A decisão **ordena** o trabalho; ela não dispensa o portão.
> Até o apply, os PSRs de produção não existem — daí os PSRs sintéticos em dev/test.

---

### IDP-03 — Every subject reference is scoped by tenant and by encounter/facility; no global person is inferred

**Rule.** A V2 subject reference is meaningless without its `{tenant, facility}` and,
for clinical use, its `encounter` context. The scoping tuple travels with the reference
through every layer — storage, cache, event, query, subscription, projection, audit —
and no layer may drop, widen, defer, or re-derive it. A subject reference presented
without its tuple is not a subject reference; it is an error.

**No V2 component may state or display "this patient", "the patient's history", or any
equivalent, in a way that implies completeness across tenants or facilities.** Under
R-B/R-C the record is knowingly partial for the measured 4,220 patients (3.88%) who have
encounters at more than one PJ (ADR-041 L22).

**DOM link.** DOM-0001 (primary); DOM-0007 (degraded mode must be explicit — partial
identity is a degraded state and must be visible, not silent).

**Relation to the `mpiId 1..1` blocker.** `Observation.extension:tenantId` is also
`1..1`. An Observation lacking it fails IDP-11 and is never admitted.

**Failure prevented.** Cross-tenant misattribution of a clinical fact; a clinician
reading a single-PJ record as a whole-person record.

---

#### Situação após 2026-08-15 — **POLÍTICA PERMANENTE** (reforçada)

**AQ-1 (Opção C)** confirma o MPI **por tenant**: o escopo deixa de ser cautela interina e
passa a ser a semântica decidida. **AQ-4** acrescenta o chaveamento: a V2 chaveia fatos
clínicos pelo par **`(PSR, encontro)`** — o PSR é independente de encontro, mas **sempre
transmitido qualificado por encontro**.

**A obrigação de UI deixa de ser recomendação e vira requisito vinculante:** a interface
**DEVE** exibir a limitação ao clínico ("registro limitado a esta instituição"), porque os
**4.220 pacientes multi-PJ (3,88%)** aparecem como sujeitos distintos, sem reconciliação.
Encaminhado a AUTH-UX e ao log de perigos como entrada nova (ata §8, item 6).

---

### IDP-04 — Never join across PJs, tenants or partitions on CPF or any identifier match

**Rule.** V2 must never join, correlate, deduplicate, merge, or infer sameness across
clinical PJs, tenants, or source partitions on the basis of CPF, CNS, name, birth date,
mother's name, phone, address, or any combination or hash of them — **even when the
values are present and match exactly**. No such join may exist in a query, a
materialized view, an index, a cache key, an MPI-like table, an ETL step, a
notebook, or an ad-hoc analysis.

**This is a prohibition by design, not by absence.** **OBSERVED:** the live producer
emits CPF in clear on `Patient.identifier` (`bronze_to_fhir.py` L427–428, with
`CPF_SYSTEM = "urn:oid:2.16.840.1.113883.13.236"` at L94) and the IG mandates that at
least one of CPF/CNS be present (`schemas/fhir-profiles/README.md` L248–249). The
material to perform the forbidden join is therefore present in the data V2 receives.

**Why exact matches are still forbidden.** ADR-043 L25–26 records that AMH separates PJs
deliberately with per-tenant HMAC keys so that *"O mesmo CPF gera hash **diferente** em
`austa_hospital` e em `omni`"*, and L109–111 records that authorizing cross-PJ
correlation is *"uma reversão deliberada de uma propriedade que a Onda 5 construiu e
testou"*, gated on a DPO/legal opinion the ADR itself records as pending. A V2-side join
would perform that reversal without the gate, in a system AMH does not audit.

**DOM link.** DOM-0001.

**Failure prevented.** V2 unilaterally recreating the global MPI that ADR-043 L49–51
records was deliberately dismantled — outside AMH's audit, role separation, and legal
basis.

---

#### Situação após 2026-08-15 — **POLÍTICA PERMANENTE**

**AQ-1 (Opção C)** mantém o isolamento por PJ como propriedade decidida. O cruzamento entre
PJs existe **exclusivamente** dentro da AMH, no índice do **ADR-043**, com role dedicada e
sem identificador direto — e seu primeiro *apply* continua travado no parecer DPO/jurídico.

**A V2 nunca executa esse join, em nenhuma camada.** A proibição vale mesmo com CPF presente
e idêntico nos dois lados — e o CPF **continua** sendo emitido em claro em
`Patient.identifier` pelo produtor atual, de modo que a proibição segue sendo **por desenho,
não por ausência de dado**.

---

### IDP-05 — Tenant context is server-derived and verified, never client-asserted

**Rule.** V2 never sends a client-selected tenant or partition header. V2 addresses AMH
FHIR by URL tenant path and presents a token whose tenant claim equals it. V2 treats a
tenant/claim mismatch, an absent URL tenant, or an absent partition as a **hard
failure**, never as a fallback to a default.

**SOURCE** (`applications/hapi-fhir/config/partitioning-config.md`): L62–64
*"**Compara o tenant do token com o tenant da URL e nega quando divergem** — e nega
também quando não há tenant na URL"*; L58–59 the interceptor *"Recusa a requisição que
traga `X-Partition-Name` ou `X-Request-Partition-IDs` do cliente (403)"*; L79–80
`allow_references_across_partitions: false`; L91 and L99–105 record that partition
bootstrap *"NÃO EXISTE"* and that a request for a tenant without a partition *"falha no
HAPI"*.

**Testing obligation (prompt §7.4 line 451).** V2 must verify empirically, per
environment, that (a) token tenant ≠ URL tenant is rejected, (b) a cross-partition
reference is rejected, (c) a client-supplied partition header is rejected, and (d) a
tenant without a partition fails rather than silently resolving to a default. These are
**negative tests** and their absence is a Gate G3 failure, not a gap.

**Also prohibited: any `cross_tenant_authorized` bypass.** The IG describes such a claim
(`schemas/fhir-profiles/README.md` L236, L279–280). V2 must not request it, design for
it, or accept a credential carrying it. If it exists it is an identity-scope decision
that belongs to the §5 owners of `IDN-CONTRA-001`, not to a V2 client configuration.

**DOM link.** DOM-0001; DOM-0005 (authorization and audit are properties of the command,
not of the caller's assertion).

**Failure prevented.** Cross-tenant read via a trusted client header — the exact class of
defect `partitioning-config.md` L22–28 records as having been mis-documented for five
configuration keys that Spring silently ignored.

---

#### Situação após 2026-08-15 — **POLÍTICA PERMANENTE** (reforçada)

**AQ-2** torna o par **URL + claim do token** a fonte **autoritativa** do tenant, no lugar de
`extension:tenantId` — exatamente o mecanismo que esta regra já descrevia. **AQ-6** fecha a
única brecha que restava: **`cross_tenant_authorized` é deriva documental e nenhum bypass
existirá em ambiente implantado.**

**Efeito no `TST-IDP-05`:** ganha um caso adicional — provar que **nenhuma credencial
portadora de claim de bypass é aceita**. Os testes negativos passam a **afirmar a
impossibilidade**, não a registrar a ausência observada.

**Permanece não decidido e continua exigindo medição:** qual é o comportamento **implantado**
(evidência de Camada 2). A decisão fixa o contrato; não substitui o teste empírico exigido
pelo prompt §7.4.

---

### IDP-06 — An unverifiable identity is `not_evaluated`, never a value

**Rule.** When a resource arrives without a resolvable, in-scope subject identity —
missing mandatory identity extension, unparseable reference, reference to a subject
outside the request's tenant scope, or identity present but of disputed scope — V2:

1. does **not** admit it to the clinical domain core;
2. records it as an explicit, countable, observable rejection with reason;
3. surfaces the affected encounter's evaluation status as `not_evaluated` (never
   `valid`, never a numeric default, never a silent no-fire);
4. never substitutes a source-scoped id, a positional guess, or a "probably the same
   patient" heuristic.

**This is the direct consequence of the `mpiId 1..1` blocker.** Because
`Observation.extension:mpiId` is mandatory but is not emitted by the live producer, the
*expected* steady state today is rejection — and that must be loud, not quiet.

**AMH precedent, quoted because it states the principle exactly**
(`pipelines/flink/src/fhir/consent_filter.py` L7–9): *"Regra de ouro deste módulo: **na
dúvida, NEGA**. Erro de rede, HTTP != 200, corpo ilegível, identidade não resolvida —
tudo isso é negação. Um filtro de consentimento que libera quando não sabe não é um
filtro."* And L53–56: *"Toda negação é OBSERVÁVEL … Um controle que descarta PHI em
silêncio é indistinguível de um pipeline quebrado."*

**DOM link.** DOM-0004 (missing/stale/invalid never coerces to zero/normal/no-risk/
silent no-fire) — primary; DOM-0007 (degraded mode explicit); DOM-0008 (source quality
and V2 evaluation status never collapsed — an identity rejection is a V2 evaluation
state, not an AMH `_dq_status`).

**Failure prevented.** The legacy defect recorded in the technical assessment
(`INTENSICARE_TECHNICAL_ASSESSMENT.md:298-316`, cited at prompt §2) of missing data
becoming numeric zero / normal.

---

#### Situação após 2026-08-15 — **POLÍTICA PERMANENTE** (inalterada)

Nenhuma das seis decisões altera esta regra. Uma identidade que não se resolve continua
produzindo `not_evaluated`, contado e observável — nunca um valor, nunca um silêncio.

**Nota de calibração (AQ-2):** a V2 passa a validar identidade contra **`identifier:mpiId`**,
não contra `extension:mpiId`. Isso muda **o que se verifica**, não **o que se faz quando
falta**: ausência ou não-resolução continua sendo `not_evaluated`. O estado estacionário
esperado deixa de ser "rejeição de tudo" — mas a rejeição continua obrigatória, ruidosa e
contada quando ocorrer.

---

### IDP-07 — Fail closed on purpose and consent; never fabricate a legal basis

**Rule.** V2 attaches an explicit `purpose_of_use` to every AMH request and every
internal use of AMH-derived data. Where consent is a precondition, V2 requires a
**positive, dated, resolvable** consent decision. Absence of a consent record, an
unreadable record, an unreachable consent service, a non-200 response, or a scope
vocabulary V2 cannot map is a **denial**, never an allow.

**V2 must not fabricate a legal basis.** **SOURCE** (ADR-045, `Accepted`, 2026-08-06):
L82–84 *"**Não existe escritor.** Nenhum `INSERT INTO mpi.consent_log` no repositório
inteiro … **zero produtores**"*; L99–104 *"O único campo de permissão que chega ao lake é
`ie_perm_sms_email` …, que é permissão de CONTATO, não consentimento de finalidade —
usá-lo como consentimento LGPD seria fabricar base legal"*; L106–110 records the `scope`
vocabulary is *"partido em dois"* between the DDL enumeration
(`analytics | research | sharing_amh_internal | external_sharing`) and the agent gate
enumeration (`treatment | research | billing | ml_training | operational_analytics`).

**INFERENCE.** V2 cannot today obtain a consent decision from AMH that it can rely on,
and must not proceed as if it had one. Where a V2 use requires consent, that use is
**blocked**, and the block is recorded — not worked around.

**Consent decision semantics V2 must preserve when a signal does become available**
(SOURCE, ADR-045 L23–34): the log is an immutable append-only **event** log; state is
derived last-event-wins on read; a `grant` and a `revoke` at the same instant resolve to
`revoke` (*"O `CASE` no `ORDER BY` é o desempate **fail-closed**"*); an unknown action
value resolves to `DENIED`. V2's mapping must reproduce this fold exactly and must
answer *"did consent hold at time T?"*, not only *"does it hold now?"* (ADR-045 L53–56).

**DOM link.** DOM-0004; DOM-0007; DOM-0009 (the consent event's own timestamp,
precision and receipt time are preserved, never invented — a consent decision is a dated
legal fact).

**Failure prevented.** Processing PHI without a legal basis, and the subtler failure of
recording "consented" from a contact-permission flag.

---

#### Situação após 2026-08-15 — **REENQUADRADA pelo AQ-3** (não revogada)

**Decidido por rodaquino-OMNI**; ata §2 AQ-3, **Opção C**. **Cláusula de maior sensibilidade
jurídica da adjudicação — ler a regra de supersessão ao final.**

A regra em inglês acima trata consentimento como portão do caminho clínico. **Essa premissa
foi substituída.** O regime vigente separa dois caminhos:

| Caminho | Base legal | Portão exigível |
|---|---|---|
| **Laço clínico single-tenant, em contexto de tratamento** | **LGPD Art. 11, II, "f" — tutela da saúde**, em procedimento realizado por profissionais/serviços de saúde | **propósito-de-uso + autorização de contexto profissional.** **NÃO há portão de consentimento.** |
| **Usos secundários** — pesquisa, analytics, compartilhamento | consentimento | **BLOQUEADOS** até existir infraestrutura real de consentimento |

**O que permanece absolutamente válido desta regra:**

1. **`ie_perm_sms_email` JAMAIS é consentimento.** Registrado em definitivo. É permissão de
   contato; usá-la como base legal seria fabricá-la.
2. **Propósito-de-uso continua obrigatório e explícito** em toda requisição à AMH e em todo
   uso interno de dado derivado dela. O que mudou foi **qual** portão o laço clínico
   atravessa — não se ele atravessa algum.
3. **Falha fechada continua valendo** para propósito ausente, não-mapeável ou mais amplo que
   a requisição.
4. **A semântica de decisão de consentimento** (log de evento imutável, estado derivado na
   leitura, empate `grant`/`revoke` resolvendo para `revoke`, capacidade de responder *"havia
   consentimento em T?"*) permanece o alvo de mapeamento **quando** a V2 for tocar usos
   secundários. Não é necessária para o laço clínico.

**O que deixou de valer:** a conclusão de que "a V2 não consegue obter decisão de
consentimento confiável, portanto todo uso está bloqueado". Isso permanece verdadeiro para
**uso secundário**; deixou de ser verdadeiro para **tratamento**.

**Consequência de arquitetura:** com o consentimento fora do caminho clínico, **o `IDP-08`
passa a ser o controle primário** — a separação entre resolver identidade e autorizar acesso
deixa de ser boa prática e vira o principal mecanismo de contenção do laço assistencial.

> **Regra de supersessão reforçada — DEC-G0-03.** Material jurídico produzido por agentes
> nesta fase é **sugestão**. A qualificação da base legal **exige ratificação por advogados
> brasileiros antes de qualquer tratamento de dados reais, operação sombra ou piloto**
> (gatilhos G6/G8). Até lá, o desenvolvimento prossegue **exclusivamente com dados
> sintéticos**. Registrar como pendência jurídica de primeira ordem no `blockers-register.md`.

---

### IDP-08 — Identity resolution is not authorization

**Rule.** Resolving *who* a subject is grants **no** access to anything about them.
Every read and every command passes an authorization decision that is independent of
identity resolution and evaluated on `{workload identity, tenant, facility, encounter,
purpose, scope, consent, role}`. The two decisions are made by separate components,
logged separately, and testable separately. A test suite that cannot demonstrate
"identity resolved, access denied" has not tested this rule.

**Serves.** Prompt §7.4 line 449 verbatim: *"separate identity resolution from
authorization: a resolved identity does not grant access."*

**DOM link.** DOM-0005 (commands are authorized and audited); DOM-0001 (scope is part of
the authorization input).

**Failure prevented.** The common defect where a successful subject lookup becomes the
de-facto access grant — the same coupling ADR-039 L33–35 records having caused at AMH,
where the consent gate was keyed on the wrong identity and *"o gate poderia
liberar/negar contra a chave errada"*.

---

#### Situação após 2026-08-15 — **POLÍTICA PERMANENTE — e agora o CONTROLE PRIMÁRIO**

**Elevada em importância pelo AQ-3.** Com o consentimento fora do caminho clínico, a
separação entre **resolver identidade** e **autorizar acesso** deixa de ser boa prática e
passa a ser **o principal mecanismo de contenção do laço assistencial**.

O portão do laço clínico — **propósito-de-uso + autorização de contexto profissional** — é
avaliado exatamente aqui, sobre `{identidade de carga de trabalho, tenant, unidade,
encontro, propósito, escopo, papel}`, e **independentemente** de a identidade do sujeito ter
sido resolvida.

**O `TST-IDP-08` sobe de prioridade:** demonstrar **"identidade resolvida, acesso negado"**
deixa de ser um teste de higiene e passa a ser **evidência central do caso de segurança** do
Gate G3.

---

### IDP-09 — Cross-scope correlation is an AMH-mediated capability V2 never implements

**Rule.** V2 never builds, hosts, imports, caches, or derives a cross-PJ / cross-tenant
correspondence structure. If cross-PJ context is ever required, it arrives only through
an explicit, purpose-bound, consent-filtered, AMH-owned interface, under a published
contract, after `IDN-CONTRA-001` is adjudicated. Until then V2 has no such capability
and must not present one in any roadmap, UI affordance, or API surface.

**SOURCE.** ADR-043 L36 *"Um índice de correspondência separado — nunca um MPI global"*;
L59–61 the matching job *"roda com role dedicada, fora das roles de tenant"* and
*"**não persiste** os atributos"*; L69–70 access is governed by an explicit, separate
Lake Formation grant — *"Nenhum consumidor herda acesso ao índice por ser de um dos
tenants pareados"*. AMH-020b L352–355: *"**Pares cross-tenant do `patient_xref` NUNCA
geram alias.** Duas PJs, dois refs, mesma pessoa = estado correto e permanente"*.

**DOM link.** DOM-0001.

**Failure prevented.** V2 becoming the uncontrolled copy of a structure AMH deliberately
isolated behind a dedicated role and a pending legal opinion.

---

#### Situação após 2026-08-15 — **POLÍTICA PERMANENTE**

**AQ-1 (Opção C)** e **AQ-6** confirmam os dois lados desta regra: a correlação cross-PJ vive
**exclusivamente** no índice do ADR-043, interno à AMH, com role dedicada e grant explícito —
e **nenhum bypass de tenant existirá** em ambiente implantado.

**A V2 nunca constrói, hospeda, importa, cacheia ou deriva estrutura de correspondência
cross-PJ.** Se um dia houver contexto cross-PJ, ele chega por interface AMH mediada,
purpose-bound e filtrada — nunca por claim de token, nunca por join local.

---

### IDP-10 — Identity lifecycle events: expected handling and replay consequences

**Rule.** V2 treats every identity-lifecycle event as a **first-class, timestamped,
append-only domain event** with an explicit effect on evaluation and replay. No
lifecycle event may be applied by overwriting a stored subject key, and none may
silently rewrite history.

Prompt §7.4 line 447 requires V2 to *"specify alias, duplicate, merge, unmerge,
reassignment, deceased, discharge and correction events, including replay
consequences."* The table below is that specification. **Every row is a PROPOSAL and is
additionally VALIDATION REQUIRED against AMH**, because — **OBSERVED** — no AMH contract
delivering these events to a consumer exists at the pinned commit: AMH-020b L372–374
states that notifying a downstream consumer of aliasing *"é decisão de contrato do
AMH-030 — **não** é requisito deste design"*. See adjudication question **AQ-5**.

| Event | Expected V2 handling | Replay consequence | Rule if AMH provides no signal |
|---|---|---|---|
| **Alias** (a previously-issued reference ceases to be canonical) | Old reference remains permanently resolvable; V2 stores the alias edge, never mutates historical records to the new key | Replay of a past instant resolves through the alias graph **as it stood at that instant**; a replay must not retroactively re-key past evaluations | Treat unknown-but-well-formed references as `not_evaluated` (IDP-06); never guess |
| **Duplicate confirmed within one scope** | Recorded as a linkage assertion with its source, score, reviewer and date; the losing key is never deleted | Evaluations computed before the assertion keep their original subject key; the linkage is visible in provenance | No duplicate resolution is performed by V2 (IDP-04, IDP-09) |
| **Merge** | Append-only alias edge plus an explicit `SubjectMerged` domain event; both keys remain resolvable forever | A replay window spanning the merge must produce the pre-merge view before it and the post-merge view after — determinism is preserved by anchoring to event time, not to current state | Blocked; V2 has no merge input |
| **Unmerge / split** | The departing subject receives a **new** key; the original key stays with the retained subject; historical events under the original key are **not** rewritten | Historical evaluations remain attributed as originally computed; correction is a data-plane matter, not an identifier rewrite | Blocked. **SOURCE**, AMH-020b L388–392: *"Eventos históricos emitidos sob o ref original não são reescritos (histórico é histórico …)"* |
| **Restore** (a merge is undone) | The alias edge is **revoked by stamp**, never deleted; the restored key returns to active | Replay before the revocation stamp still sees the alias as effective | Blocked. **SOURCE**, AMH-020b L393–396: *"a revogação é carimbada, não apagada"* |
| **Reassignment** (a record moves to a different subject or tenant) | Rejected at the boundary if it would change the `{tenant, facility}` scope of an existing key. Scope is immutable — a scope change is a **new** subject, plus an explicit correction on the affected facts | Prior evaluations are retained with a linked `Correction`; they are never silently re-attributed | Fail closed (IDP-11) |
| **Deceased** | A clinical state change on the subject, recorded with its own effective time and provenance. It does **not** delete, anonymize, or suppress prior facts, and it does **not** by itself stop evaluation — stopping is a clinical-pathway decision, not an identity one | Replay reproduces the state as known at the replayed instant | `Patient.deceased[x]` is `0..1` in `Patient-amh` — treat absence as unknown, never as "alive" |
| **Discharge** | Closes the encounter scope. Subsequent facts arriving under that encounter are late-arrivals against a closed encounter and are flagged, not silently attached to a new one | Replay honours the encounter boundary as it stood; a late-arriving fact does not retroactively reopen a closed evaluation window | Encounter linkage is `0..1` on `Observation-amh-laboratory` — an Observation with no encounter cannot be encounter-scoped and is `not_evaluated` for encounter-scoped pathways |
| **Correction / amendment** | New immutable fact linked as a `Correction` to the superseded one; the original remains retrievable | Replay at an instant before the correction must see the pre-correction value — this is the definition of deterministic replay | Any AMH re-delivery that changes a previously-delivered value is a correction, and must be modelled as one even if AMH labels it an update |
| **Erasure / LGPD deletion** | The subject key is retired, never reused and never deleted; the mapping to source identity is severed | Replay of past evaluations remains possible structurally; the subject is no longer re-identifiable | **SOURCE**, AMH-020b L118–122: erasure sets `status=retired` and nulls the mapping column, preserving the reference's permanent non-reusability |

**Cross-cutting replay rule.** Identity resolution during replay is anchored to the
**event time being replayed**, never to the current alias graph. A replay that resolves
identity "as of now" is not deterministic and violates DOM-0003.

**DOM link.** DOM-0002 (immutable provenance chain with explicit corrections) —
primary; DOM-0003 (deterministic, versioned, replayable evaluation); DOM-0009 (source
timestamps preserved, never invented).

**Failure prevented.** A merge or correction silently changing what a past evaluation
"would have" decided — which destroys both the audit trail and the safety case.

---

#### Situação após 2026-08-15 — **ELEVADA A REQUISITO CONTRATUAL VINCULANTE (AQ-5)**

**Decidido por rodaquino-OMNI**; ata §2 AQ-5, **Opção A vinculante**.

A ressalva que esta regra carregava — *"every row is a PROPOSAL and is additionally VALIDATION
REQUIRED against AMH, because no AMH contract delivering these events to a consumer exists"* —
**está resolvida**. São agora **cláusulas OBRIGATÓRIAS do contrato v1**:

1. **Eventos de ciclo de vida de identidade** — `alias`, `merge`, `unmerge`, `restore`,
   `erasure` — com entrega **at-least-once** e **ordenação por sujeito**.
2. **Consulta `resolve(ref, as_of)`** — resolução ponto-no-tempo.

**Consequência de portão, explícita na decisão:** sem esses dois itens, **replay afetado por
identidade NÃO é certificável e o Gate G3 NÃO passa**. **Não se admite janela-teto como
paliativo** — a Opção C (limitar a validade do replay) foi **rejeitada**.

**Efeito na coluna "Rule if AMH provides no signal" da tabela acima:** ela descrevia o
comportamento sob ausência de sinal. Essa coluna passa a ser **contingência de falha de
contrato**, não regime esperado — e uma falha de contrato é um defeito bloqueante do G3, não
um modo degradado aceitável.

**Permanece integralmente válida** a regra transversal de replay: a resolução de identidade
é ancorada no **tempo do evento que está sendo reproduzido**, nunca no grafo de aliases
atual. É o que `resolve(ref, as_of)` torna implementável. Vínculo: `DOM-0002`, `DOM-0003`.

---

### IDP-11 — Fail closed on every missing, mismatched or unverifiable context

**Rule.** The following are **denials**, uniformly, at the anti-corruption boundary. Each
is counted, logged with a reason code, and visible to operators. None is a warning, a
default, or a retry-until-success.

| Condition | Disposition |
|---|---|
| Tenant absent, or token tenant ≠ URL tenant | Deny; do not retry with a different tenant |
| Partition does not exist for the addressed tenant | Deny; surface as an environment fault, not as an empty result |
| Mandatory identity element absent (`extension:mpiId`, `extension:tenantId` at `1..1`) | Deny; `not_evaluated` (IDP-06) |
| Identity present but of disputed scope, and the use requires an unambiguous scope | Deny; `not_evaluated` |
| Subject reference outside the request's `{tenant, facility}` scope | Deny; raise as a potential isolation defect |
| Cross-partition reference encountered | Deny; AMH itself disables these (`partitioning-config.md` L79–80) |
| `purpose_of_use` absent, unmappable, or broader than the request | Deny |
| Consent decision absent, unreadable, unreachable, or `NOT_FOUND` | Deny (IDP-07) |
| Consent service returns non-200, an unparseable body, or an unexpected shape | Deny |
| `grant` and `revoke` at the same instant | Resolve to `revoke` (ADR-045 L33–34) |
| Contract digest, schema version, or manifest pin mismatch | Deny before use; do not degrade to best-effort parsing |
| **An empty result set** | **Never treated as evidence of absence.** Distinguish "no data" from "not authorized", "not yet ingested", and "query scoped wrongly" — `../claim-verification-matrix.md` Claim 12 records AMH's own measured sweep of 21 empty and 21 all-null-business-column Gold tables |

**No global timeout-to-allow, no cached-allow, no "degraded mode = permissive" path may
exist anywhere in V2.** Degraded mode reduces capability, never controls (DOM-0007).

**DOM link.** DOM-0004; DOM-0007; DOM-0008.

---

#### Situação após 2026-08-15 — **POLÍTICA PERMANENTE**, com duas linhas reenquadradas

A tabela de negações permanece vigente e **nenhuma configuração pode torná-la permissiva**.
Duas linhas mudam de escopo por força do **AQ-3**, e uma por força do **AQ-2**:

| Linha da tabela | Situação vigente |
|---|---|
| `Consent decision absent, unreadable, unreachable, or NOT_FOUND` → nega | **Aplica-se a USOS SECUNDÁRIOS**, que estão bloqueados. **Não** é portão do laço clínico (AQ-3). |
| `Consent service returns non-200 / unparseable / unexpected` → nega | Idem — escopo de uso secundário. |
| `grant` e `revoke` no mesmo instante → `revoke` | **Permanece** como semântica correta a implementar quando a V2 tocar uso secundário. |
| `Mandatory identity element absent` → nega | **Permanece**, agora verificando **`identifier:mpiId`** (AQ-2), não `extension:mpiId`. |
| `purpose_of_use` ausente, não-mapeável ou mais amplo que a requisição → nega | **Permanece e ganha peso**: é o portão do laço clínico (AQ-3). |

**Linha nova, decorrente do AQ-6:** requisição portadora de claim de bypass cross-tenant →
**nega**, e registra como potencial defeito de isolamento. Nenhum bypass existirá; a V2 não
aceita um se aparecer.

**Inalterado e central:** conjunto de resultados vazio **nunca** é evidência de ausência; e
não existe caminho de "modo degradado = permissivo" em lugar nenhum da V2.

---

### IDP-12 — Observation consumption stays blocked, and this rule states why in full

**Rule.** V2 must not classify any AMH `Observation` as eligible, consumable, or
pathway-supporting until **all four** of the following are closed. Closing fewer than
four does not partially unblock; the pathway remains ineligible.

| # | Blocker | Evidence | Closes when |
|---|---|---|---|
| 1 | **Identity** — `extension:mpiId 1..1` with four disputed meanings | `contradiction-record.md` §0, IDN-C-1 | AMH adjudicates IDN-CONTRA-001 (AQ-1) |
| 2 | **Population** — the source is empty | `../claim-verification-matrix.md` Claim 6: `PACIENTE_EXAME` returned zero rows; Diagnose/LIS not ingested | AMH ingests a populated source and V2 measures it (Layer 3) |
| 3 | **Shape** — the recorded unblocking plan emits `code.text` + `valueString`, which does not satisfy the profile's LOINC binding and UCUM fixing | `../claim-verification-matrix.md` Claim 6 | AMH confirms the conformant path (already asked as dossier Q3) |
| 4 | **Emission** — the live producer emits no extensions and stamps a non-IG profile URL on Observation (`OBS_PROFILE = ".../BRObservation"`, `bronze_to_fhir.py` L325) | `contradiction-record.md` IDN-C-2 | AMH confirms which producer, which profile URL, and which identity element are authoritative (AQ-2) |

**DOM link.** DOM-0004; DOM-0008 (an AMH `_dq_status` of `valid` on an Observation would
still not make it evaluable in V2 — the dimensions must not be collapsed).

**Failure prevented.** "Observation unblocked" being read as "numeric, coded,
unit-bearing, correctly-attributed lab values are available." A numeric threshold rule
cannot consume a `valueString`, and no rule at all may consume a fact whose subject is
uncertain.

---

#### Situação após 2026-08-15 — **RE-BASELINEADA: 1 perna resolvida, 3 abertas**

**O `Observation` da AMH continua NÃO CONSUMÍVEL pela V2.** O **AQ-2** resolveu **uma** das
quatro pernas. A regra permanece em vigor com a linha 1 reclassificada:

| # | Perna | Situação em 2026-08-15 | Fecha quando |
|---|---|---|---|
| 1 | **Identidade** — `extension:mpiId 1..1` com quatro significados em disputa | **RESOLVIDA POR DECISÃO** (AQ-1 + AQ-2): `identifier:mpiId` é autoritativo; a extensão é rebaixada. **Pendente de implementação AMH e da publicação do IG 1.1.0.** | IG 1.1.0 publicado e verificado por digest |
| 2 | **População** — fonte vazia (`PACIENTE_EXAME` com zero linhas; Diagnose/LIS não ingerido) | **ABERTA.** Nenhuma decisão a resolve — depende de ingestão real e de medição (Camada 3) | AMH ingerir fonte populada **e** a V2 medir |
| 3 | **Forma** — o plano de desbloqueio registrado emite `code.text` + `valueString`, que não satisfaz o binding LOINC nem a fixação UCUM | **ABERTA** | AMH confirmar e entregar o caminho conformante |
| 4 | **Emissão** — produtor não emite extensões e carimba profile fora do IG (`OBS_PROFILE` = `.../BRObservation`) | **PARCIALMENTE ENDEREÇADA:** AQ-2 declara defeito e rebaixa a extensão; **a correção do carimbo de profile é trabalho AMH ainda não executado** | produtor corrigido para o padrão `fhir.americashealth.com.br` |

**Conclusão que não mudou, e que é o ponto desta regra:** nenhuma via clínica que dependa de
observação laboratorial ou de sinal vital pode ser declarada elegível. **Uma regra de limiar
numérico não consome `valueString`, e nenhuma regra consome um fato que não existe na fonte.**
"Identidade decidida" **não** é "Observation disponível" — a distância entre as duas é
exatamente o conteúdo das linhas 2, 3 e 4.

**Sinais vitais permanecem indisponíveis.** Nenhuma das seis decisões os torna disponíveis; a
questão Q1 do dossiê (`../open-questions-for-amh-owners.md`) segue aberta e continua sendo a
de maior valor para o portfólio clínico.

---

## Verification obligations (for the safety-focused test architecture engineer)

Each rule needs an adversarial test that **attempts the prohibited thing and asserts it
fails closed**. Owner: UNASSIGNED — VALIDATION REQUIRED. These are proposed test IDs
only; this document does not create tests.

| Test | Asserts | Rule | DOM |
|---|---|---|---|
| `TST-IDP-03` | A subject reference stripped of its `{tenant, facility}` tuple is rejected at every layer (storage, cache, event, query, subscription, audit) | IDP-03 | DOM-0001 |
| `TST-IDP-04` | Two synthetic subjects in different tenants sharing a CPF are never linked by any query, view, index, or cache path | IDP-04 | DOM-0001 |
| `TST-IDP-05` | Token tenant ≠ URL tenant → rejected; client partition header → rejected; cross-partition reference → rejected; tenant without partition → fails rather than defaulting | IDP-05 | DOM-0001 |
| `TST-IDP-06` | An Observation lacking `extension:mpiId` yields `not_evaluated` with a counted, logged reason — never a value, never a silent no-fire | IDP-06 | DOM-0004 |
| `TST-IDP-07` | Consent absent / unreachable / non-200 / unparseable → denial; simultaneous grant+revoke → revoke | IDP-07 | DOM-0004 |
| `TST-IDP-08` | A fully resolved identity with an insufficient purpose/scope is **denied** — proving the two decisions are independent | IDP-08 | DOM-0005 |
| `TST-IDP-10` | Replay across a merge, an unmerge, a restore and a correction reproduces the historical view at each instant, not the current one | IDP-10 | DOM-0002, DOM-0003 |
| `TST-IDP-11` | Every row of the IDP-11 table denies, is counted, and is observable; no configuration makes any of them permissive | IDP-11 | DOM-0004, DOM-0007 |

---

## What this policy explicitly does not do

- It does **not** resolve `IDN-CONTRA-001`, and does not select longitudinal versus
  tenant-local MPI. Both remain open.
- It does **not** approve V2 consumption of any AMH resource type.
- It does **not** assert that these rules are sufficient for LGPD, ANS, or clinical
  safety. That judgement requires a DPO, a clinical safety authority, and a security
  authority — none named, all `VALIDATION REQUIRED`.
- It does **not** create, modify, or promote any `DOM-xxxx` invariant. Where a rule has
  no DOM link, that gap is flagged for the domain modeler, not filled here.
- It does **not** authorize any write to the AMH repository or any AMH environment.

**Expiry.** This policy is written to be **superseded**. When `IDN-CONTRA-001` is
adjudicated, each rule must be re-derived from the decision — not carried forward by
inertia. Rules IDP-01, IDP-02, IDP-09 and IDP-12 in particular exist only because the
question is open.
