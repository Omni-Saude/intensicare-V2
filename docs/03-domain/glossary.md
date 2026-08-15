---
doc_id: DOM-GLOSSARY
status: PROPOSAL
owner: UNASSIGNED — VALIDATION REQUIRED
source: INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §8 (Product, domain, and requirements architecture — glossary term list), §9.1 (Architecture principles), §9.2 (Initial bounded contexts), §9.3 (Conceptual data model), §7.6 (Anti-corruption and conformance layer — two status dimensions)
date_collected: 2026-08-14
collector: temporal-provenance domain modeler
last_updated: 2026-08-14
---

# IntensiCare V2 — Canonical Glossary

## How to read this document

Every definition below is a **PROPOSAL**: a conceptual, non-binding definition drafted
from the orchestrator prompt's stated scope, not an approved clinical or engineering
decision. Terms whose precise semantics require clinical judgment (most of them, in a
clinical decision-support platform) carry an explicit **pt-BR translation candidate —
VALIDATION REQUIRED** line; no translation here may be treated as ratified clinical
language until a named clinical-language owner validates it (owner is currently
**UNASSIGNED** for every term in this document).

This glossary is conceptual only. It intentionally avoids column names, data types,
table names, or any physical-schema or technology commitment — those belong to later
waves (candidate-architecture ADR engineering onward).

Each entry ends with **Related DOM/ID links**, pointing at the domain invariants defined
in `invariants/DOM-invariants.md` that the term participates in. These links are
navigational aids, not a claim that the invariant is fully specified for that term yet.

Terms are grouped for readability; the group order carries no priority meaning.

---

## 1. Tenancy, organization, and location

### Organization

**Definition (PROPOSAL):** The top-level business/legal entity in IntensiCare V2's
tenancy hierarchy. An Organization owns one or more `Facility` entities and is the anchor
for `Membership` — the binding of users/practitioners to roles and purposes within that
Organization's scope (§9.3: `Organization → Facility → CareUnit → Bed`;
`Organization ↔ Membership ↔ User/Practitioner/Role/Purpose`).

**Disambiguation:** *Organization* is not the same concept as *Tenant* (below). An
Organization is the business/administrative entity as clinicians and administrators would
recognize it (e.g., a hospital network); a Tenant is the technical/data-ownership
isolation boundary the system enforces at every layer. They will often correspond
one-to-one, but this glossary keeps them conceptually separate because AMH's own tenant
grain (root CNPJ plus multiple clinical PJs) is not yet reconciled with any V2 Organization
model — that reconciliation is out of this document's evidence scope and is left to the
AMH tenant-and-identity adjudication analyst and the candidate-architecture ADR engineer.

**pt-BR translation candidate:** *organização* — **VALIDATION REQUIRED** (owner:
UNASSIGNED).

**Related DOM/ID links:** DOM-0001.

---

### Tenant

**Definition (PROPOSAL):** The invariant ownership/isolation boundary that every
resource, record, cache entry, event, query, subscription, and audit entry in
IntensiCare V2 must be attributable to, at every architectural layer, without exception.

**Disambiguation:** See *Organization* above for the Organization/Tenant distinction.
"Tenant" here denotes the enforceable boundary itself, not any particular business
entity's name. Do not infer a caller's tenant from a client-supplied value — tenant
context must come from a trusted, verified source (this constraint is carried forward
from this document's evidence base as a structural property, not elaborated further here
since authorization mechanics are out of this document's scope).

**pt-BR translation candidate:** *tenant (inquilino / locatário)* — Brazilian clinical/IT
usage frequently keeps "tenant" untranslated; both options are offered as candidates —
**VALIDATION REQUIRED** (owner: UNASSIGNED).

**Related DOM/ID links:** DOM-0001.

---

### Facility

**Definition (PROPOSAL):** A physical or administrative site (e.g., a hospital) belonging
to exactly one Organization, comprising one or more `CareUnit`s (§9.3:
`Organization → Facility → CareUnit → Bed`).

**Disambiguation:** A Facility is a location grain, not itself a tenancy boundary; a
Tenant may in principle span one or more Facilities depending on the (not-yet-decided)
Organization/Tenant model above.

**pt-BR translation candidate:** *estabelecimento* or *unidade de saúde* —
**VALIDATION REQUIRED** (owner: UNASSIGNED).

**Related DOM/ID links:** DOM-0001.

---

### Care unit

**Definition (PROPOSAL):** A clinical unit within a Facility (e.g., an intensive care
unit, a step-down unit) comprising one or more `Bed`s (§9.3:
`Organization → Facility → CareUnit → Bed`). Care units are the natural grouping for
clinician assignment, bed-grid views, and unit-level operational/degraded-mode reporting.

**Disambiguation:** "Care unit" is a location/organizational grain, distinct from
"Pathway," which is a clinical-logic grain that may apply differently by care-unit
population (e.g., adult ICU vs. neonatal) but is not itself a location.

**pt-BR translation candidate:** *unidade de cuidado* / *unidade assistencial* (e.g.,
*UTI* for an intensive-care unit specifically) — **VALIDATION REQUIRED** (owner:
UNASSIGNED).

**Related DOM/ID links:** DOM-0001.

---

### Bed

**Definition (PROPOSAL):** The smallest location primitive within a Care Unit, to which a
patient Encounter's `LocationAssignment` refers at a given time (§9.3:
`Organization → Facility → CareUnit → Bed`; `Encounter → LocationAssignment`).

**Disambiguation:** A Bed is a location resource, not an Encounter or a patient. The same
Bed may have a sequence of different LocationAssignments over time as patients are
admitted, transferred, and discharged; the Bed's identity persists across that sequence.

**pt-BR translation candidate:** *leito* — **VALIDATION REQUIRED** (owner: UNASSIGNED).

**Related DOM/ID links:** DOM-0001.

---

## 2. Patient identity and encounter lifecycle

### Patient identity

**Definition (PROPOSAL):** The conceptual representation, within IntensiCare V2, of a
person as a subject of care — resolved from one or more source `Identifier`s through
`MPIResolution`, and subject to `MergeEvent` history when source identities are later
found to represent the same or different persons (§9.3:
`PatientIdentity ↔ Identifier ↔ MPIResolution/MergeEvent`).

**Disambiguation:** Patient Identity is deliberately *not* defined here as a single global
"person" record. The scope of identity resolution — tenant-local versus any broader
longitudinal linkage — is an open adjudication item outside this document's evidence
scope (owned elsewhere in the program, not decided by this glossary). Treat "Patient
Identity" as a resolved-identity concept whose resolution scope is itself
**VALIDATION REQUIRED**.

**pt-BR translation candidate:** *identidade do paciente* — **VALIDATION REQUIRED**
(owner: UNASSIGNED).

**Related DOM/ID links:** DOM-0001.

---

### Encounter

**Definition (PROPOSAL):** A bounded clinical interaction between a `PatientIdentity` and
the care system, associated with one or more `LocationAssignment`s over its duration
(§9.3: `PatientIdentity → Encounter → LocationAssignment`). An Encounter is the primary
unit of clinical-context ownership that observations, evaluations, alerts, and audit
records are scoped to, alongside Tenant (see DOM-0001).

**Disambiguation:** Encounter is an administrative/clinical interaction record, not a
location (see *Bed*) and not necessarily identical to *Episode* (below) — an Encounter
does not by itself imply a multi-encounter clinical narrative.

**pt-BR translation candidate:** *atendimento* / *encontro clínico* — **VALIDATION
REQUIRED** (owner: UNASSIGNED).

**Related DOM/ID links:** DOM-0001.

---

### Episode

**Definition (PROPOSAL):** A clinically meaningful grouping that may span one or more
related `Encounter`s connected by a continuous or recurring course of care for a related
clinical problem (e.g., a critical-care episode spanning an admission through discharge,
potentially including inter-unit `Transfer`s that do not close the Encounter, or a
readmission pattern that a clinical team considers one episode of illness).

**Disambiguation:** Section 9.3's conceptual data model does **not** list "Episode" as a
first-class boxed entity — only `Encounter` and `LocationAssignment` appear there. This
glossary therefore flags, explicitly, that whether Episode is a first-class persisted
aggregate, a derived/query-level grouping over Encounters, or a purely clinical
(non-modeled) concept is **VALIDATION REQUIRED** and left to the candidate-architecture
ADR engineer and clinical owners. Do not assume Episode has independent identity or
storage until that decision is made.

**pt-BR translation candidate:** *episódio (de cuidado)* — **VALIDATION REQUIRED**
(owner: UNASSIGNED).

**Related DOM/ID links:** DOM-0001 (if modeled as an aggregate spanning encounters, it
inherits the same ownership invariant).

---

### Admission

**Definition (PROPOSAL):** The event marking the start of a period of inpatient/critical-
care responsibility for a `PatientIdentity` at a specific `Facility`/`CareUnit`/`Bed`,
typically initiating an `Encounter` and its first `LocationAssignment`.

**Disambiguation:** Admission is an event/act, not a persistent entity; its effect is to
create or extend an Encounter and a LocationAssignment. Distinguish from *Transfer*
(a within-Encounter location change) and *Discharge* (the Encounter's closing event).

**pt-BR translation candidate:** *admissão* / *internação* — **VALIDATION REQUIRED**
(owner: UNASSIGNED).

**Related DOM/ID links:** DOM-0001, DOM-0009 (its instant must never be invented).

---

### Transfer

**Definition (PROPOSAL):** The event that changes a `PatientIdentity`'s
`LocationAssignment` (Care Unit and/or Bed) within an ongoing `Encounter`, without ending
that Encounter.

**Disambiguation:** A Transfer does not close or create an Encounter; it produces a new
`LocationAssignment` linked to the same Encounter. Distinguish from *Admission* (opens the
Encounter) and *Discharge* (closes it).

**pt-BR translation candidate:** *transferência* — **VALIDATION REQUIRED** (owner:
UNASSIGNED).

**Related DOM/ID links:** DOM-0001, DOM-0009.

---

### Discharge

**Definition (PROPOSAL):** The event that ends the active clinical-location responsibility
for a `PatientIdentity` within an `Encounter`, closing its current `LocationAssignment`
and, typically, the Encounter itself.

**Disambiguation:** Discharge is distinct from any broader *Episode* closure (see
*Episode* above) — an Episode spanning multiple Encounters may continue clinically (e.g.,
outpatient follow-up) after a given Encounter's Discharge, pending resolution of whether
Episode is modeled at all.

**pt-BR translation candidate:** *alta* — **VALIDATION REQUIRED** (owner: UNASSIGNED).

**Related DOM/ID links:** DOM-0001, DOM-0009.

---

## 3. Clinical data and its ingress

### Observation

**Definition (PROPOSAL):** A single canonical clinical fact (a measurement, laboratory
result, vital sign, or other clinically coded finding) derived from a `SourceEnvelope`,
carrying its own `Provenance`, `Quality`, `Correction`, and `Conflict` lineage (§9.3:
`SourceSystem → SourceEnvelope → ClinicalObservation`;
`ClinicalObservation → Provenance/Quality/Correction/Conflict`). This is the canonical,
V2-internal representation — distinct from whatever representation the originating
`SourceSystem` used.

**Disambiguation:** "Observation" here is a domain concept, not a commitment to any
particular external standard's resource of the same name (e.g., a FHIR `Observation`
resource); mapping between an external standard's representation and this canonical
concept is an anti-corruption-layer concern outside this document's scope.

**pt-BR translation candidate:** *observação (clínica)* — **VALIDATION REQUIRED** (owner:
UNASSIGNED).

**Related DOM/ID links:** DOM-0002, DOM-0004, DOM-0009.

---

### Specimen/result

**Definition (PROPOSAL):** Two linked but distinct concepts named together in the term
list: a **Specimen** is a physical/biological sample collected from a patient (e.g., a
blood draw) that is the origin of one or more laboratory `Observation`s; a **Result** is
the value or finding produced from testing a Specimen (or, for non-specimen measurements
such as vital signs, produced directly from a physiologic measurement act), materialized
in IntensiCare as an `Observation`.

**Disambiguation:** Not every Observation has a Specimen — vital-sign Observations
typically do not. "Specimen/result" specifically names the laboratory-testing sub-case of
the broader Observation concept; it should not be read as a synonym for Observation in
general.

**pt-BR translation candidate:** *amostra* (specimen) / *resultado* (result) —
**VALIDATION REQUIRED** (owner: UNASSIGNED).

**Related DOM/ID links:** DOM-0002, DOM-0009.

---

### Source envelope

**Definition (PROPOSAL):** The durable, immutable, as-received wrapper around inbound
data from a `SourceSystem`, captured before or through validation, preserving the
original payload and receipt metadata, from which one or more canonical
`ClinicalObservation`s (or other canonical facts) are derived (§9.3:
`SourceSystem → SourceEnvelope → ClinicalObservation`). Source envelopes are the subject
of the "Integration ingress, source envelopes, validation, quarantine, and replay"
bounded context (§9.2).

**Disambiguation:** A Source Envelope is not the same as the `Observation`(s) derived from
it — the envelope is the raw, as-received unit (supporting quarantine and replay); the
Observation is the canonical, validated clinical fact. One envelope may yield zero, one,
or multiple Observations.

**pt-BR translation candidate:** *envelope de origem* / *envelope de dados de origem* —
**VALIDATION REQUIRED** (owner: UNASSIGNED).

**Related DOM/ID links:** DOM-0002, DOM-0006, DOM-0009.

---

## 4. Clinical evaluation logic

### Evaluation

**Definition (PROPOSAL):** The deterministic, versioned application of a `RuleVersion`'s
logic to an `Encounter`'s known `Observation`s as of a given instant, producing an
`EvaluationRecord` with an explicit status (see `status-dimensions.md`) (§9.3:
`Encounter + Observations + RuleVersion → EvaluationRecord`).

**Disambiguation:** "Evaluation" denotes both the act (applying a RuleVersion) and, by
extension, its resulting `EvaluationRecord`. Distinguish from *Score* (a possible
quantitative output of an Evaluation, not every Evaluation produces one).

**pt-BR translation candidate:** *avaliação* — **VALIDATION REQUIRED** (owner:
UNASSIGNED).

**Related DOM/ID links:** DOM-0003, DOM-0004.

---

### Score

**Definition (PROPOSAL):** A specific kind of `Evaluation` output — typically a computed
numeric or ordinal value (e.g., an early-warning score) produced by applying a
`Pathway`'s `Criterion`/`Criteria` to `Observation`s.

**Disambiguation:** *Score* vs. *Evaluation* — Evaluation is the general act/record of
applying a RuleVersion; Score is the optional quantitative value an Evaluation may
produce for scoring-style Pathways. Not every Pathway/Evaluation yields a Score; some
produce purely criterion-based (boolean/categorical) alert logic without one.

**pt-BR translation candidate:** *escore* — **VALIDATION REQUIRED** (owner: UNASSIGNED).

**Related DOM/ID links:** DOM-0003, DOM-0004.

---

### Pathway

**Definition (PROPOSAL):** A named, versioned clinical decision-support protocol (e.g., a
deterioration-detection pathway) implemented as a `RuleBundle`/`RuleVersion`, defining the
`Criterion`/`Criteria`, required `Observation`s, and resulting `Evaluation` logic for a
specific clinical purpose and population (§9.3: `RuleBundle → RuleVersion/...`).

**Disambiguation:** "Pathway" is the clinical-content concept; `RuleBundle`/`RuleVersion`
are its executable, versioned release-artifact form. A Pathway's eligibility, evidence
basis, and portfolio inclusion are governed by clinical-pathway-portfolio processes
outside this document's scope; this glossary defines only the domain-model shape.

**pt-BR translation candidate:** *via clínica* / *protocolo clínico* — **VALIDATION
REQUIRED** (owner: UNASSIGNED).

**Related DOM/ID links:** DOM-0003.

---

### Criterion

**Definition (PROPOSAL):** A single, named, evaluable condition (an input threshold, code
match, or logical test) that is one component of a `Pathway`'s/`RuleVersion`'s overall
evaluation logic. An `Evaluation` of a Pathway aggregates the results of its Criteria into
an `EvaluationRecord` (and, where applicable, a `Score`).

**Disambiguation:** A Criterion is a sub-component of a Pathway's logic, not itself a
separately versioned release artifact — its lifecycle is bound to the `RuleVersion` that
contains it.

**pt-BR translation candidate:** *critério* — **VALIDATION REQUIRED** (owner:
UNASSIGNED).

**Related DOM/ID links:** DOM-0003, DOM-0004.

---

### Rule version

**Definition (PROPOSAL):** An immutable, versioned, signed release of a `Pathway`'s
executable clinical logic, bound to a specific `TerminologySnapshot`, `TestPack`
(reference vectors), and `Approval` record within a `RuleBundle` (§9.3:
`RuleBundle → RuleVersion/TerminologySnapshot/TestPack/Approval`).

**Disambiguation:** A `RuleBundle` is the enduring named container (e.g., "sepsis
screening pathway"); a `RuleVersion` is one immutable, dated release of that bundle's
logic. `EvaluationRecord`s always reference the exact RuleVersion applied, never merely
the RuleBundle, to keep evaluation deterministic and replayable (DOM-0003).

**pt-BR translation candidate:** *versão de regra* — **VALIDATION REQUIRED** (owner:
UNASSIGNED).

**Related DOM/ID links:** DOM-0003.

---

## 5. Alerting and work management

> **Alert vs. Notification vs. Work Item — read together.** These three terms are the
> most commonly confused in the term list and are defined together deliberately.
> `EvaluationRecord → Alert/WorkItem → Action/Assignment/Escalation/Resolution` (§9.3)
> shows Alert and WorkItem as closely related but distinct nodes, while
> `Durable events → RebuildableProjection → Authorized UI/notification` (§9.3) shows
> Notification sitting downstream of durable events/projections — i.e., a delivery
> concern, not a system-of-record concern. §9.1 principle 6 ("durability precedes
> immediacy... projections and real-time views are rebuildable") is the architectural
> reason Notification must never become a second, undurable source of truth.

### Alert

**Definition (PROPOSAL):** The durable, explainable, clinical-domain record produced when
an `EvaluationRecord` signals a condition that warrants human attention. An Alert carries
its own explanation (inputs used, missing inputs, rule version, rationale) and its own
lifecycle state.

**Disambiguation:** An Alert is the *clinical-domain fact* that something warrants
attention. It is distinct from a `WorkItem` (the actionable unit a human actually works)
and from a `Notification` (the delivery-channel signal that carries the Alert's existence
or state change to a person or system). One Alert may or may not generate a WorkItem and
may generate zero, one, or many Notifications over its lifetime (e.g., re-notification on
escalation).

**pt-BR translation candidate:** *alerta* — **VALIDATION REQUIRED** (owner: UNASSIGNED).

**Related DOM/ID links:** DOM-0004, DOM-0006, DOM-0007.

---

### Work item

**Definition (PROPOSAL):** The actionable, assignable, trackable unit derived from one or
more `Alert`s, carrying the `Action`/`Assignment`/`Escalation`/`Resolution` lifecycle that
a human operates on (§9.3: `EvaluationRecord → Alert/WorkItem → Action/Assignment/
Escalation/Resolution`).

**Disambiguation:** A Work Item is what a clinician actually assigns, acknowledges,
escalates, overrides, resolves, or suppresses — the unit of accountable human action. It
may aggregate more than one related Alert (e.g., grouping without source loss, per the
platform's UX aims) while each contributing Alert's own identity and explanation remain
individually traceable.

**pt-BR translation candidate:** *item de trabalho* / *tarefa* — **VALIDATION REQUIRED**
(owner: UNASSIGNED).

**Related DOM/ID links:** DOM-0005, DOM-0007.

---

### Notification

**Definition (PROPOSAL):** The delivery-channel event that carries an `Alert`'s or
`WorkItem`'s existence or state change to a human or external system (e.g., an in-app
banner, push, or external message), produced from durable events via a
`RebuildableProjection` and the "Authorized real-time delivery and external notification"
bounded context (§9.2; §9.3: `Durable events → RebuildableProjection → Authorized
UI/notification`).

**Disambiguation:** A Notification is never itself the clinical system of record — it is
strictly downstream of a durably persisted Alert/WorkItem state. A dropped or delayed
Notification must never be treated as equivalent to a dropped Alert/WorkItem; the durable
record remains authoritative and recoverable independent of any specific delivery attempt.

**pt-BR translation candidate:** *notificação* — **VALIDATION REQUIRED** (owner:
UNASSIGNED).

**Related DOM/ID links:** DOM-0006.

---

### Acknowledgment

**Definition (PROPOSAL):** The recorded act by an authorized human of confirming
awareness of an `Alert`/`WorkItem`, without necessarily resolving it — a state transition
in the Work Item's `Action`/lifecycle (§9.3's `Action` node).

**Disambiguation:** Acknowledgment confirms *awareness*, not *completion*; a Work Item may
be acknowledged and later escalated, overridden, or resolved. The precise state-machine
semantics (e.g., which states permit acknowledgment) are left to the Alert work-management
engineer; this glossary establishes only the concept and its place in the model.

**pt-BR translation candidate:** *reconhecimento* / *ciência* — **VALIDATION REQUIRED**
(owner: UNASSIGNED).

**Related DOM/ID links:** DOM-0005.

---

### Escalation

**Definition (PROPOSAL):** The recorded act — automatic (e.g., timer-driven) or manual —
of raising a `WorkItem`'s urgency or routing it to an additional or different responsible
party when it has not received a timely response (§9.3's `Escalation` node in
`Action/Assignment/Escalation/Resolution`).

**Disambiguation:** Escalation changes routing/urgency; it does not by itself close the
Work Item (see *Resolution*). Escalation timers and thresholds are a rule/pathway or
alert-work-management concern outside this document's scope.

**pt-BR translation candidate:** *escalonamento* — **VALIDATION REQUIRED** (owner:
UNASSIGNED).

**Related DOM/ID links:** DOM-0005, DOM-0007.

---

### Assignment

**Definition (PROPOSAL):** The recorded act, and resulting state, of attributing
accountability for a `WorkItem`/`Alert` to a specific human or role (§9.3's `Assignment`
node).

**Disambiguation:** Assignment establishes *who is accountable*, distinct from
Acknowledgment (*awareness*) and Resolution (*closure*). A Work Item may be reassigned
multiple times before resolution.

**pt-BR translation candidate:** *atribuição* — **VALIDATION REQUIRED** (owner:
UNASSIGNED).

**Related DOM/ID links:** DOM-0005.

---

### Override

**Definition (PROPOSAL):** The recorded act of an authorized human explicitly acting
against or superseding the system's default routing, priority, or suppression decision
for an `Alert`/`WorkItem`, with a recorded rationale.

**Disambiguation:** Override is distinct from Suppression: an Override is a human decision
to act contrary to the system's default handling of a *specific* item (recorded, with
rationale, and auditable); Suppression (below) is a state that prevents further delivery/
escalation and must never be silent or indistinguishable from a true no-fire (DOM-0004).
The precise conditions under which override is permitted are a clinical-governance and
alert-work-management concern outside this document's scope.

**pt-BR translation candidate:** *sobreposição manual* / *anulação* — **VALIDATION
REQUIRED** (owner: UNASSIGNED).

**Related DOM/ID links:** DOM-0005.

---

### Resolution

**Definition (PROPOSAL):** The recorded act and resulting state that closes a `WorkItem`'s
active lifecycle, indicating the underlying clinical concern has been addressed or that no
further action is required (§9.3's `Resolution` node in
`Action/Assignment/Escalation/Resolution`).

**Disambiguation:** Resolution is a terminal (though potentially reopenable) state,
distinct from Acknowledgment (awareness only) and Suppression (prevented delivery without
necessarily being addressed).

**pt-BR translation candidate:** *resolução* — **VALIDATION REQUIRED** (owner:
UNASSIGNED).

**Related DOM/ID links:** DOM-0005.

---

### Suppression

**Definition (PROPOSAL):** The recorded act and resulting state of deliberately preventing
an `Alert`/`WorkItem` from being delivered or escalated further (e.g., a known duplicate,
an intentionally silenced condition), always as an explicit, auditable decision.

**Disambiguation:** Suppression must never be confused with, or implemented as, a *silent
no-fire* — DOM-0004 requires that missing/stale/invalid data never silently produce the
absence of an alert. A Suppression is an explicit, recorded, auditable state applied to an
Alert/WorkItem that did fire; it is categorically different from a Pathway simply never
evaluating a condition as met.

**pt-BR translation candidate:** *supressão* — **VALIDATION REQUIRED** (owner:
UNASSIGNED).

**Related DOM/ID links:** DOM-0004, DOM-0005.

---

## 6. Data and evaluation quality states

> These terms name states along IntensiCare V2's **evaluation-status** dimension and
> related data-quality concepts. They are deliberately kept separate from AMH's own
> **source data-quality** vocabulary (`valid | warning | quarantined`) — see
> `status-dimensions.md` for the full treatment of why these two dimensions must never
> be collapsed (DOM-0008).

### Freshness

**Definition (PROPOSAL):** The degree to which a `ClinicalObservation`'s or
`EvaluationRecord`'s underlying data remains temporally representative of the patient's
current state, judged against a pathway-specific freshness window (see
`time-semantics.md`). Freshness is an input to determining V2 evaluation status; it is
not itself one of the five evaluation-status values.

**Disambiguation:** Freshness is a continuous/measured property (e.g., "how old is this
value relative to its freshness window"); *Staleness* (below) is the discrete state that
results when freshness has expired.

**pt-BR translation candidate:** *atualidade* / *frescor do dado* — **VALIDATION
REQUIRED** (owner: UNASSIGNED).

**Related DOM/ID links:** DOM-0008, DOM-0009.

---

### Staleness

**Definition (PROPOSAL):** The state of a `ClinicalObservation`, encounter context, or
`EvaluationRecord` whose freshness has expired beyond its defined window, such that it
can no longer be treated as current without being explicitly marked `stale`.

**Disambiguation:** `stale` is one of the five explicit V2 evaluation-status values
(`valid | partial | not_evaluated | stale | invalid`, §7.6). Staleness at the data level
(an individual Observation aging out) and staleness at the evaluation level (an
EvaluationRecord whose inputs have aged out since it was computed) are related but not
identical — an Observation being stale is one possible cause of an EvaluationRecord being
`stale`, but the EvaluationRecord's own status is the authoritative signal shown to
clinicians.

**pt-BR translation candidate:** *desatualização* / *obsolescência* — **VALIDATION
REQUIRED** (owner: UNASSIGNED).

**Related DOM/ID links:** DOM-0004, DOM-0008.

---

### Partial

**Definition (PROPOSAL):** One of the five V2 evaluation-status values (§7.6): an
`EvaluationRecord` status meaning the `Pathway`'s logic was executed with some, but not
all, required `Observation`s/inputs available, such that only a safe, well-defined subset
of the pathway's determination could be produced.

**Disambiguation:** `partial` is distinct from `not_evaluated` (no determination attempted
or possible at all) and from `invalid` (a determination was attempted but cannot be
trusted). The exact rules for when a pathway may legitimately report `partial` versus
must report `not_evaluated` are a clinical-pathway-portfolio and rule-runtime concern
outside this document's scope; this glossary fixes only the term's place in the
vocabulary (which this document may not alter, per its task scope).

**pt-BR translation candidate:** *parcial* — **VALIDATION REQUIRED** (owner:
UNASSIGNED).

**Related DOM/ID links:** DOM-0004, DOM-0008.

---

### Not evaluated

**Definition (PROPOSAL):** One of the five V2 evaluation-status values (§7.6,
`not_evaluated`): an `EvaluationRecord` status meaning no evaluation attempt produced a
determination — for example, because no applicable `RuleVersion` exists, required
prerequisites are entirely absent, or evaluation has not yet run for the current inputs.

**Disambiguation:** `not_evaluated` is distinct from `partial` (a determination was
partially possible) and from `invalid` (a determination was attempted but is untrusted).
`not_evaluated` must be visibly distinct from an absence of any alert for a genuinely
non-actionable/normal patient state (DOM-0004) — the UI/consumer must never treat
"nothing shown" as evidence that evaluation ran and found nothing.

**pt-BR translation candidate:** *não avaliado* — **VALIDATION REQUIRED** (owner:
UNASSIGNED).

**Related DOM/ID links:** DOM-0004, DOM-0008.

---

### Invalid

**Definition (PROPOSAL):** One of the five V2 evaluation-status values (§7.6): an
`EvaluationRecord` status meaning evaluation was attempted but its result cannot be
relied upon (for example, due to `conflicted` inputs, a source in a quarantined data-
quality state, an evaluation error, or a violated precondition), and therefore must not
be displayed or acted upon as a valid clinical determination.

**Disambiguation:** `invalid` (V2 evaluation status) must never be conflated with AMH's
source data-quality `quarantined` state — a `quarantined` source is one possible *cause*
of an `invalid` evaluation, but the two vocabularies remain on separate dimensions
(DOM-0008; see `status-dimensions.md`).

**pt-BR translation candidate:** *inválido* — **VALIDATION REQUIRED** (owner:
UNASSIGNED).

**Related DOM/ID links:** DOM-0004, DOM-0008.

---

### Conflicted

**Definition (PROPOSAL):** A `Quality`/state of a `ClinicalObservation` (§9.3:
`ClinicalObservation → Provenance/Quality/Correction/Conflict`) meaning two or more
source-derived values for what should be the same clinical fact disagree and have not
been reconciled.

**Disambiguation:** Conflicted Observations must not be silently resolved by picking one
value without a recorded, provenance-linked rationale (DOM-0002). Distinguish from
*Corrected* (below), where a single authoritative update supersedes an earlier value —
conflict implies unresolved disagreement between sources, correction implies a settled
supersession.

**pt-BR translation candidate:** *conflitante* — **VALIDATION REQUIRED** (owner:
UNASSIGNED).

**Related DOM/ID links:** DOM-0002.

---

### Corrected

**Definition (PROPOSAL):** A `Quality`/state of a `ClinicalObservation` meaning a later,
authoritative update has superseded an earlier value for the same clinical fact, preserved
via the immutable `Correction` lineage (§9.3; §9.1 principle 3: "One clinical fact has one
immutable provenance chain and explicit corrections"). The corrected value replaces the
*effective* value used for future evaluation while the original remains part of the
permanent provenance chain.

**Disambiguation:** See *Conflicted* above for the correction/conflict distinction. A
Correction always references the fact it supersedes; it never overwrites or deletes it.

**pt-BR translation candidate:** *corrigido* — **VALIDATION REQUIRED** (owner:
UNASSIGNED).

**Related DOM/ID links:** DOM-0002.

---

## 7. Provenance, audit, consent, and reconciliation

### Provenance

**Definition (PROPOSAL):** The recorded, unbroken lineage of where a clinical fact came
from (its `SourceSystem`, `SourceEnvelope`), how it was transformed into a canonical
`ClinicalObservation`, and every subsequent `Correction`, such that the chain is never
rewritten — only appended to (§9.1 principle 3; §9.3:
`ClinicalObservation → Provenance/Quality/Correction/Conflict`).

**Disambiguation:** Provenance is the *chain*; Correction and Conflict (above) are
specific kinds of entries that can appear within that chain. "Provenance" in this
glossary always refers to the domain concept of lineage, not to any specific technical
audit-log implementation.

**pt-BR translation candidate:** *proveniência* — **VALIDATION REQUIRED** (owner:
UNASSIGNED).

**Related DOM/ID links:** DOM-0002.

---

### Audit

**Definition (PROPOSAL):** The durable, tamper-evident record of every read, change,
decision, and action taken in the system, forming `AuditEvidence` (§9.3:
`Every read/change/decision/action → AuditEvidence`). Audit is itself a bounded context
("Audit, safety evidence, access records, and policy-controlled retention," §9.2) and is
subject to the same tenant/encounter ownership invariant as every other layer (DOM-0001).

**Disambiguation:** Audit is broader than Provenance: Provenance traces the lineage of a
*clinical fact*; Audit traces every *read, change, decision, and action* in the system,
including but not limited to clinical-fact changes (e.g., it also covers Assignment,
Acknowledgment, Escalation, Override, Resolution, and Suppression acts on Alerts/Work
Items, and access reads).

**pt-BR translation candidate:** *auditoria* — **VALIDATION REQUIRED** (owner:
UNASSIGNED).

**Related DOM/ID links:** DOM-0001, DOM-0005.

---

### Consent/purpose

**Definition (PROPOSAL):** Two linked but distinct concepts named together in the term
list. **Purpose** is the declared, authorized reason a `Membership`/actor is accessing or
processing data, bound to `Role` and `Membership` (§9.3:
`Organization ↔ Membership ↔ User/Practitioner/Role/Purpose`; §9.2: "Identity,
organization, tenancy, memberships, purpose, and authorization"). **Consent** is a
distinct concept representing a patient's (or other applicable data subject's) permission,
scoping what processing is allowed for a given Purpose.

**Disambiguation:** Consent constrains *what is permitted*; Purpose declares *what is
being done* and must be checked against the permission that Consent (where applicable)
and authorization together establish. This glossary only establishes Consent/Purpose as
named domain concepts belonging to the identity/tenancy bounded context; it does not
define consent policy, legal basis, or enforcement mechanics — those are privacy/legal
and authorization-engineering concerns outside this document's scope.

**pt-BR translation candidate:** *consentimento* (consent) / *finalidade* (purpose) —
**VALIDATION REQUIRED** (owner: UNASSIGNED).

**Related DOM/ID links:** DOM-0001.

---

### Reconciliation

**Definition (PROPOSAL):** The process and evidentiary record of comparing two
representations of the same clinical facts/state (for example, an operational
representation against an analytical one, or IntensiCare's canonical record against a
source system's record) to detect, explain, and account for every difference, ensuring no
fact is silently lost, duplicated, or coerced (§7.6: "reconciliation reports proving no
silent loss or semantic coercion").

**Disambiguation:** Reconciliation is a cross-representation comparison-and-evidence
process; it is distinct from *Correction* (a single fact's supersession) and from
*Conflict* (unresolved disagreement about a single fact between sources) — Reconciliation
operates at the level of comparing whole representations/populations of facts, not a
single Observation.

**pt-BR translation candidate:** *reconciliação* — **VALIDATION REQUIRED** (owner:
UNASSIGNED).

**Related DOM/ID links:** DOM-0002, DOM-0006.

---

## Cross-reference summary

| Term | pt-BR candidate status | Primary DOM links |
|---|---|---|
| Organization | VALIDATION REQUIRED | DOM-0001 |
| Tenant | VALIDATION REQUIRED | DOM-0001 |
| Facility | VALIDATION REQUIRED | DOM-0001 |
| Care unit | VALIDATION REQUIRED | DOM-0001 |
| Bed | VALIDATION REQUIRED | DOM-0001 |
| Patient identity | VALIDATION REQUIRED | DOM-0001 |
| Encounter | VALIDATION REQUIRED | DOM-0001 |
| Episode | VALIDATION REQUIRED | DOM-0001 |
| Admission | VALIDATION REQUIRED | DOM-0001, DOM-0009 |
| Transfer | VALIDATION REQUIRED | DOM-0001, DOM-0009 |
| Discharge | VALIDATION REQUIRED | DOM-0001, DOM-0009 |
| Observation | VALIDATION REQUIRED | DOM-0002, DOM-0004, DOM-0009 |
| Specimen/result | VALIDATION REQUIRED | DOM-0002, DOM-0009 |
| Source envelope | VALIDATION REQUIRED | DOM-0002, DOM-0006, DOM-0009 |
| Evaluation | VALIDATION REQUIRED | DOM-0003, DOM-0004 |
| Score | VALIDATION REQUIRED | DOM-0003, DOM-0004 |
| Pathway | VALIDATION REQUIRED | DOM-0003 |
| Criterion | VALIDATION REQUIRED | DOM-0003, DOM-0004 |
| Rule version | VALIDATION REQUIRED | DOM-0003 |
| Alert | VALIDATION REQUIRED | DOM-0004, DOM-0006, DOM-0007 |
| Work item | VALIDATION REQUIRED | DOM-0005, DOM-0007 |
| Notification | VALIDATION REQUIRED | DOM-0006 |
| Acknowledgment | VALIDATION REQUIRED | DOM-0005 |
| Escalation | VALIDATION REQUIRED | DOM-0005, DOM-0007 |
| Assignment | VALIDATION REQUIRED | DOM-0005 |
| Override | VALIDATION REQUIRED | DOM-0005 |
| Resolution | VALIDATION REQUIRED | DOM-0005 |
| Suppression | VALIDATION REQUIRED | DOM-0004, DOM-0005 |
| Freshness | VALIDATION REQUIRED | DOM-0008, DOM-0009 |
| Staleness | VALIDATION REQUIRED | DOM-0004, DOM-0008 |
| Partial | VALIDATION REQUIRED | DOM-0004, DOM-0008 |
| Not evaluated | VALIDATION REQUIRED | DOM-0004, DOM-0008 |
| Invalid | VALIDATION REQUIRED | DOM-0004, DOM-0008 |
| Conflicted | VALIDATION REQUIRED | DOM-0002 |
| Corrected | VALIDATION REQUIRED | DOM-0002 |
| Provenance | VALIDATION REQUIRED | DOM-0002 |
| Audit | VALIDATION REQUIRED | DOM-0001, DOM-0005 |
| Consent/purpose | VALIDATION REQUIRED | DOM-0001 |
| Reconciliation | VALIDATION REQUIRED | DOM-0002, DOM-0006 |

No term in this table has an approved pt-BR translation. Every row requires a named
clinical-language validator before any translation is used in clinician-facing UI, rule
content, or regulatory submissions.
