---
id: LEGREV-CDF-DOMAIN
title: Legacy review — evolucoes (clinical-notes) domain service, model, schemas, API
label: PROPOSAL
status: PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI)
statement: >
  As-implemented review of the legacy V1 clinical-documentation domain:
  `domain_evolucoes.py` (14-role SBAR templates, amendment/lifecycle state
  machine, `prefill_background`), `models/evolucao.py`, `schemas/evolucoes.py`,
  and `api/v1/evolucoes.py`. Includes the SOFA-score-display-fork analysis
  requested for this workstream and HAZ-0005-lens form-default-coercion
  findings.
provenance:
  source_repo: intensicare (legacy V1, READ-ONLY)
  path_or_url: src/intensicare/services/domain_evolucoes.py; src/intensicare/models/evolucao.py; src/intensicare/schemas/evolucoes.py; src/intensicare/api/v1/evolucoes.py
  commit_sha_or_version: 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79
  section_or_lines: whole files (see per-finding path:line citations below)
  date_collected: 2026-08-15
  last_updated: 2026-08-15
  collector: legacy clinical-documentation and forms forensics reviewer (cycle 1, Task 1, wave 1b, workstream CDF)
  transformation: >
    Every function read; verbatim excerpts quoted for load-bearing logic;
    discrepancies reasoned from source. No legacy code is imported.
  confidence: high (mechanical citations, hash-verified) / medium (clinical significance judgments)
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  hazards: [HAZ-0005, HAZ-0008, HAZ-0021, HAZ-0036]
  adrs: []
  tests: []
  pr: null
supersedes: null
superseded_by: null
---

# Evolucoes (clinical-notes) domain — service, model, schema, API review

> **PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).**
> Verdicts propose a classification under
> `docs/00-governance/legacy-import-policy.md` §4. No verdict here is an
> import decision; all eight §3 preconditions (license/IP, named owner,
> clinical relevance review, V2 acceptance tests, and more) remain unmet.

## 0. Sources and integrity

OBSERVED 2026-08-15, `shasum -a 256` against
`docs/archive/legacy-provenance/legacy-pin-cycle-1.md`:

| File | SHA-256 | Manifest match |
|---|---|---|
| `src/intensicare/services/domain_evolucoes.py` | `d9eafc17a26cade0b7dc5c185c52d2fd3586048d8d1a9950a982109b8c2e4a6c` | MATCH |
| `src/intensicare/models/evolucao.py` | `2f13fb10f552e7371dffd99fd07a31639fb49b187eb65ef1c138ea2cec1f0a1a` | MATCH |
| `src/intensicare/schemas/evolucoes.py` | `9e5d46c9dd3af34d7b561f11b4e82c6ba76cb2b3e2edc4538699afa7aa0b9f3c` | MATCH |
| `src/intensicare/api/v1/evolucoes.py` | `44edf7ffbde4037a9daff5cc69a10a7e34833052626e764597545ce196b0ef96` | MATCH |
| `tests/test_domain_evolucoes.py` (listed, not reviewed) | `f120b1235ed301391a3124c56d26e69d2c53fedf4e048320639acbfafe001f14` | MATCH |

`domain_evolucoes.py` is 1,675 lines, module docstring: "Clinical Notes /
Evolution domain service — SBAR templates, immutable notes, 14 role
templates", `__version__ = "3.0.0"`.

## 1. `domain_evolucoes.py` — service review

### 1.1 Structure (OBSERVED)

- Lines 21-46: `CLINICAL_ROLES` (14 roles), `EVOLUTION_TYPES` (5: admissao,
  diaria, alta, obito, intercorrencia), `EVOLUTION_STATUSES = ["draft",
  "final", "amended"]`.
- Lines 134-1153: `_build_all_templates()` — one large, purely declarative
  function building all 14 role-specific `EvolutionTemplate` objects (each
  with SBAR-keyed sections and per-field label/type metadata). OBSERVED: the
  only conditional statement in this 1,020-line function is the memoization
  guard `if _TEMPLATES: return _TEMPLATES` (line 154) — no clinical threshold
  or scoring logic is embedded in the template catalog itself; fields such as
  "Risco de queda (Morse)" (line 243) and "Nível de consciência (Glasgow)"
  (line 174) are labels/types only, with no numeric cut-points implemented in
  this file.
- Lines 1183-1189: `_compute_content_hash()` — SHA-256 over
  `json.dumps(sections, sort_keys=True)` for non-repudiation.
- Lines 1192-1253: `_validate_template()` — structural validation (all 4 SBAR
  section keys present, in canonical order, non-empty `content` string per
  section).
- Lines 1399-1501: `create_evolution()` — the write path (§1.3 below).
- Lines 1504-1577: `list_evolutions()`, `get_evolution()`,
  `get_evolution_chain()` — read paths.
- Lines 1580-1675: `prefill_background()` — never called (§1.2 below).

### 1.2 `prefill_background()` — auto-populated clinical text (lines 1580-1675)

Verbatim (excerpt):

```python
def prefill_background(
    mpi_id: str,
    vitals: dict[str, Any] | None = None,
    scores: dict[str, Any] | None = None,
) -> str:
    ...
    hr = vitals.get("heart_rate") or vitals.get("frequencia_cardiaca")
    if hr is not None:
        lines.append(f"- Frequência Cardíaca (FC): {hr} bpm")
    ...
    spo2 = vitals.get("spo2") or vitals.get("saturacao_o2")
    if spo2 is not None:
        lines.append(f"- SpO₂: {spo2}%")
    ...
    sofa = scores.get("sofa")
    if sofa is not None:
        lines.append(f"- SOFA: {sofa}")
    qsofa = scores.get("qsofa")
    if qsofa is not None:
        lines.append(f"- qSOFA: {qsofa}")
```

**Finding CDF-1 (dead code).** OBSERVED: `grep -rn "prefill_background"
https://github.com/Omni-Saude/intensicare` returns exactly one hit — the definition itself.
`prefill_background` is never imported or called by `api/v1/evolucoes.py`,
any other service module, or the test file. The auto-populate-the-Background-
section capability that `docs/adr/0028-…md` describes as central to the
hybrid SBAR design ("campos estruturados... pré-preenchidos do estado atual
do paciente") has an implementation, but it is unwired.

**Finding CDF-2 (falsy-zero coercion — HAZ-0005-adjacent).** Every vitals
lookup in this function uses Python `or` to pick between a canonical and a
PT-BR-aliased key: `vitals.get("heart_rate") or
vitals.get("frequencia_cardiaca")`, and likewise for `spo2`. In Python, `0`
is falsy. A heart rate of `0` (a maximally critical value — no perfusion) or
an SpO₂ of `0` supplied under the first key would evaluate the `or` as false
and silently fall through to look up the second key instead of displaying
the true value — the opposite direction of the classic HAZ-0005 pattern
(missing input → 0), but the same family of defect: a clinically loud value
is treated as if it were absent. If the second key is also absent, the
reading disappears from the note text entirely rather than showing `0`; if
the second key holds a different, non-zero value (e.g. a stale prior
reading), the note would display that stale value under the "current" vitals
heading with no indication it came from a fallback path. Neither branch is
tested by any visible reachability path today because the function is dead
code (Finding CDF-1), but the defect would activate immediately if a future
change wires this function in.

**Finding CDF-3 (score-display-fork analysis — see also §5).**
`prefill_background()` performs **no computation** on `scores["sofa"]` or
`scores["qsofa"]` — it only formats values already present in a caller-
supplied dict. There is no local SOFA/qSOFA formula in this file.

### 1.3 `create_evolution()` — amendment/lifecycle state machine (lines 1399-1501)

Verbatim (lines 1460-1469):

```python
status = "final"
if previous_id is not None:
    # Mark the previous record as amended
    if previous_id in _evolutions_store:
        prev = _evolutions_store[previous_id]
        if prev.status == "final":
            prev.status = "amended"
    status = "amended"
```

**Finding CDF-4 (amendment status inversion — HAZ-0008/HAZ-0021 relevant).**
The `EvolutionRecord` docstring (lines 79-84) states: *"Immutable once
status='final' — amendments create new records linked via previous_id."*
`create_evolution()`'s own docstring (lines 1413-1419) repeats: *"Automatic
status: 'draft' overridden to 'final' on creation... Immutability: never
edits in-place; amendments through new records."* The code does the
opposite of what both docstrings describe for the amending record: when
`previous_id` is supplied, the **prior** record is correctly relabeled
`"amended"` (superseded) — but the **new** record, which is the current,
authoritative version after the correction, is *also* stamped `status =
"amended"` rather than `"final"` (line 1468). No code path in this file ever
produces `status == "final"` for a record created via the amendment branch.
Any downstream consumer that queries "the current/active note" by filtering
`status == "final"` (a natural reading of the docstring's own stated
invariant) would retrieve the **superseded** version, or none at all, once a
correction exists — inverting the medico-legal purpose of the amendment
mechanism ADR-0028 describes ("Correções são feitas como adendos... nunca
como edição in-place"). `list_evolutions()` (lines 1504-1542) does not
currently filter by status, so this defect is latent rather than
externally observable through the two reviewed read endpoints today — but it
is real in the domain layer, and would surface the moment any status filter
is added, which is the natural next step for a "get current note" UI
affordance.

**Finding CDF-5 (docstring claims a `draft` path that does not exist).**
`create_evolution()`'s signature (lines 1399-1407) accepts no `status`
parameter at all; the function can only ever produce `"final"` or
`"amended"`, never `"draft"`, despite `EVOLUTION_STATUSES` declaring `draft`
as a valid value and the docstring claiming a draft-to-final override
behavior. See §4 for the corresponding schema-level version of this gap.

### 1.4 `_validate_template()` — documentation-completeness gating (lines 1192-1253)

OBSERVED: the docstring claims "Rules (81 validation rules across all
templates)" but the implemented checks are five generic, template-agnostic
structural rules (section keys valid, all 4 present, count == 4, each
section's `content` non-empty, order matches `SBAR_ORDER`) — none of the
14 templates' own field-level metadata (required flags, numeric ranges,
"Morse"/"Braden" labels) is read or enforced by this function. This is a
**blocking** gate (a `ValueError` on submission — a clinician cannot save an
evolution missing a section), which is the correct posture for the four
generic SBAR-completeness rules it does enforce; but the per-role,
per-field completeness intent visible in the template catalog (e.g. RULE-
EVOLUCOES-056's nutritionist-specific required fields, see cluster review)
is not implemented here at all — it exists only as unread template metadata.
The "81 validation rules" figure also does not match the reconciled 77-rule
`evolucoes` cluster (§8, and `evolucoes-cluster-review.md` §0); it is a
carried-over count from an earlier extraction phase.

## 2. `models/evolucao.py` — model review

Three SQLAlchemy models: `EvolucaoTemplate`, `Evolucao`, `EvolucaoSection`.

- `Evolucao.status` (line 118-122): `String(16)`, `default="final"`, comment
  `"Status: draft, final, amended"` — no CHECK constraint or enum type at the
  database layer restricting it to those three values; enforcement is purely
  the caller's responsibility (consistent with Finding CDF-4/CDF-5 above:
  nothing at the model layer would catch or prevent the status-inversion
  defect).
- `Evolucao.sections` (line 102-106) is a single `JSONB` column holding the
  full section array, and `EvolucaoSection` (lines 157-195) is a *separate*,
  normalized table with one row per section, one `content: String(4096)`
  column per row. Both representations store `content` as an **opaque
  string**, not the per-field-typed structure the 14 templates define. This
  corroborates §7 below: nothing in the model layer carries the template's
  granular field types through to storage.
- `previous_id` (lines 112-117) is a self-referential FK with `previous:
  Mapped["Evolucao | None"] = relationship(..., backref="amendments")` — the
  amendment-chain relationship is correctly modeled structurally; the defect
  in Finding CDF-4 is in the *status value* assigned when walking that chain,
  not in the chain's shape.
- `content_hash` (lines 107-111): `String(64)`, `nullable=False` — consistent
  with the SHA-256 non-repudiation design in the service layer.

No independent clinical logic exists in this file; it is a faithful
structural mirror of the service-layer dataclasses.

## 3. `schemas/evolucoes.py` — API schema review

- `EvolucaoSchema.status` (lines 104-106): `Field("final", ..., description="Status: draft, final, amended")` — matches the model.
- `EvolucaoCreate.status` (lines 148-154): `Field("final", ..., description="Status: draft, final", examples=["final"])` — **this field exists on the request schema** the client is expected to populate, offering a `draft`/`final` choice at creation time. See Finding CDF-6 (§4) for why this field has no effect.
- `EvolucaoCreate` (lines 126-156) has **no `previous_id` field** — the amendment/correction relationship cannot be expressed by any client request body reviewed in this file.
- Field-level constraints (`min_length`, `max_length`) mirror the model column widths; no independent clinical logic.

## 4. `api/v1/evolucoes.py` — API router review

Three endpoints: `GET /patients/{mpi_id}/evolucoes`, `POST
/patients/{mpi_id}/evolucoes`, `GET /evolucoes/{evolution_id}`.

Verbatim (lines 168-176):

```python
try:
    record = create_evolution(
        mpi_id=mpi_id,
        type=body.type,
        template_id=body.template_id,
        author=body.author or current_user.username,
        author_role=body.author_role,
        sections=body.sections,
    )
```

**Finding CDF-6 (unwired schema field; amendment path unreachable via API).**
`create_patient_evolution()` builds its `create_evolution()` call from six of
`EvolucaoCreate`'s seven fields — `body.status` is read nowhere in this file.
Combined with `EvolucaoCreate` lacking a `previous_id` field at all (§3),
**this API surface can never create a `draft` record and can never create an
amendment.** Every note created through the only reviewed write endpoint is
unconditionally `status="final"`, `previous_id=None`. This is a **blocking**
completeness gap, not a cosmetic one: ADR-0028's decision record states
corrections must be adenda (new linked records), never in-place edits, as a
CFM 1.638/2002 medico-legal requirement (§9 below) — and the only reviewed
API cannot produce that adendo at all. There is no `PATCH`/`PUT` endpoint in
this router either, so — as reviewed — a clinician has no way to correct a
released note through this API surface.

No other endpoint performs clinical computation; `list_patient_evolutions`
and `get_single_evolution` are pass-through reads with no status filtering
(consistent with §1.3's observation that the amendment-status defect is
latent, not yet externally observable).

## 5. Score-display-fork analysis (RULE-EVOLUCOES-001/002)

**Question:** does the evolucoes/clinical-notes surface fork the governed
SOFA implementation, or does it consume the canonical one?

- `RULE-EVOLUCOES-001` (`docs/rules/clinical-scoring/RULE-EVOLUCOES-001-…md`,
  cluster `evolucoes`, category `clinical-scoring`) documents a legacy
  **frontend** partition (`trilhas-frontend@f9656be2
  src/@types/models/Prontuario.d.ts:19-63`, upstream repo not mounted this
  cycle — NL-1) carrying an opaque `escore_sofa: number` field alongside its
  likely component labs/vitals, "implying the SOFA score itself is computed
  server-side; no computation formula is present in this frontend
  partition."
- `RULE-EVOLUCOES-002` (same cluster/category,
  `trilhas-frontend@f9656be2 src/components/FormDadosProntuario/
  FormDadosProntuario.tsx:85-94`) documents a pure display gate: `if
  (initialValues.dados_prontuario && initialValues.dados_prontuario.
  escore_sofa >= 0): render Tag "Escore sofa: {escore_sofa}"`. The rule
  record itself notes: "SOFA computation logic is not in this partition
  (backend / other FE partition)."
- **Answer, within this workstream's actual reviewable source
  (`domain_evolucoes.py`, `models/evolucao.py`, `schemas/evolucoes.py`,
  `api/v1/evolucoes.py`): no fork.** OBSERVED: `grep -in "sofa\|score"` over
  all four files returns hits only inside `prefill_background()` (§1.2),
  which formats a caller-supplied `scores["sofa"]` / `scores["qsofa"]` value
  and computes nothing. `grep -rn "escore_sofa" src/` across the whole
  repository returns **zero hits** — the specific opaque field named in
  RULE-EVOLUCOES-001/002 does not exist in the Python backend at all; it is
  attested only in the unmounted frontend rule record. `docs/adr/0028-…md`
  (the legacy repo's own architecture note — see `adr-0028-context.md`)
  explicitly commits the Background section's scores to being "pré-
  calculados pelo `PioraClinicaService` e serviços de scoring" (line 184-185
  of that ADR) — i.e. the design intent already routes score computation to
  the canonical scoring services (reviewed separately under the
  `sepsis-scores` and `ews` workstreams: `services/sofa.py`,
  `services/qsofa.py`), not to a local formula inside the notes domain.
- **Adjacent finding, out of this workstream's scope (advisory only, per
  coverage-map §1 rule 5).** `src/intensicare/services/domain_formularios.py`
  — assigned to the `neuro-sedation-scores` workstream, not CDF —
  **does** contain a second, independently implemented SOFA calculator:
  `_calculate_sofa(data: dict) -> float` at line 512, dispatched from a
  `form_type == "sofa"` branch at line 477-479, computing all six SOFA
  organ sub-scores from raw component data rather than delegating to
  `services/sofa.py::calculate_sofa` (the canonical implementation,
  confirmed by `grep` to be imported and called by `ews_nrt_runner.py` and
  `vitals.py`). This is a genuine SOFA-implementation fork **in the
  codebase**, but it lives in the clinical-*forms* service that this
  workstream's coverage-map assignment explicitly routes to
  `neuro-sedation-scores` (coverage-map §3: "Services (2.1):
  `domain_sedacao.py`, `domain_formularios.py`, `domain_pharmaco_delirium.py`
  → neuro-sedation-scores"). It is recorded here only as a cross-workstream
  hazard note for the `neuro-sedation-scores` and `sepsis-scores` reviewers
  — this record does not review `domain_formularios.py` and does not assign
  it a verdict.

**Conclusion:** RULE-EVOLUCOES-001/002's opaque pre-computed SOFA badge is
legacy-frontend-only content this workstream cannot re-verify against the
unmounted upstream (NL-1). Within the Python domain this workstream *can*
review, there is no SOFA fork in `domain_evolucoes.py` — but a real fork
exists one file over, in `domain_formularios.py`, outside this workstream's
write scope. Both facts are needed to answer the question honestly.

## 6. Form-default coercion findings (HAZ-0005 lens)

| Finding | Location | Pattern | HAZ relevance |
|---|---|---|---|
| CDF-2 | `domain_evolucoes.py:1622,1633` | `vitals.get(k1) or vitals.get(k2)` treats a real `0` as absent, silently substituting a second key or dropping the value | HAZ-0005-adjacent (inverse direction: a loud zero is coerced to look absent, rather than absence being coerced to a normal-looking zero) |
| CDF-4 | `domain_evolucoes.py:1468` | The current, corrected version of a note is mislabeled with the status meaning "superseded" | HAZ-0008 (corrections/audit trail), HAZ-0021 (no-fire/state opacity — a "which version is current" query cannot be answered correctly by status alone) |
| CDF-6 | `api/v1/evolucoes.py:168-176`, `schemas/evolucoes.py:148-154` | A schema field (`status: draft\|final`) that implies client control over draft state silently has no effect; every record is unconditionally `final` | Not a HAZ-0005 coercion in the numeric sense, but the same *family*: a documented default ("client can choose draft") is silently overridden to a fixed value, and the override is invisible to the caller |

No instance was found in the reviewed files of the *classic* HAZ-0005 pattern
(a missing clinical input silently scored as `0`/normal) — the evolucoes
domain does not compute scores, so it cannot commit that specific error. The
coercion risks it does carry are of the "silent default override" family
described above.

## 7. Documentation-completeness: blocking vs. nagging

Per this workstream's brief, the safety-relevant distinction is whether a
documentation-completeness rule **blocks** the clinical workflow (a hard stop
that forces correction) or only **nags** (a UI hint with no server-side
consequence, defeatable by any client that skips it).

| Rule / finding | Mechanism | Blocking or nagging | Assessment |
|---|---|---|---|
| `_validate_template()` SBAR completeness (§1.4) | Server-side `ValueError` → HTTP 409 (`api/v1/evolucoes.py:177-181`) | **Blocking** | Correctly enforced where it applies (the 4 generic SBAR sections) |
| RULE-EVOLUCOES-059 (`dt_registro` immutability on edit) | Per the rule record: "client-side-only `disabledField` flag with no server-side enforcement noted" | **Nagging only, as documented by the legacy rule record itself** | If carried into V2 unchanged, a client that omits the disabled attribute could alter a note's original registration timestamp post-hoc — an audit-trail-integrity gap. Flagged **REJECT — implementation** in the cluster review (§8); the underlying immutability invariant should be VALIDATE/TRANSFORM as a server-side check |
| RULE-EVOLUCOES-030 / CDF service `create_evolution` (§1.3) | Per the rule record, `destroy()` never calls `validar_inativacao`; independently, this review found no inactivation/deletion function at all in `domain_evolucoes.py` — the guard has no code to review here | **Not reachable to assess as blocking or nagging from this file** — flagged **REJECT — implementation** (missing enforcement) in the cluster review on the legacy record's own evidence |
| The 14 templates' per-field `required`/range metadata (§1.4) | Declared but never read by `_validate_template()` | **Neither** — the field-level completeness intent is simply unenforced; the only completeness check that runs is section-level, not field-level | A documentation-completeness gap: a note can satisfy `_validate_template()` (non-empty free text) while omitting every structured field the template declares mandatory for that role |

## 8. Cross-reference: rule-count discrepancy

ADR-0028 (`adr-0028-context.md`) and `_validate_template()`'s own docstring
(§1.4) both cite **81 rules** for the evolucoes cluster
(`docs/rules/extraction/phase2/catalog/evolucoes.yaml`, an earlier extraction
phase artifact). The reconciled, final cluster this workstream is assigned to
review (`coverage-map.md` §3, `inventory.md` line 662, `catalog-index.json`)
contains **77 rules** (`RULE-EVOLUCOES-001` through `-077`, contiguous, no
gaps — confirmed by reading both disposition shards in full). This is a
provenance discrepancy between an intermediate extraction artifact and the
final reconciled catalog, not a clinical-safety defect; it is recorded here
so a future reader is not confused by the two different counts appearing in
cited legacy material versus this review's scope.

## 9. Summary verdicts for the four reviewed artifacts

Per `docs/00-governance/legacy-import-policy.md` §4. As with the
alert-threshold and sepsis-score reviews, RETAIN/REFINE do not apply to any
artifact here: V2 is a from-scratch stack (FastAPI/SQLAlchemy vs. this
service's own in-memory dataclass store; MPI/AMH-based identity vs. Tasy/
Django REST) — nothing imports as-is or with light modification regardless
of code quality.

| Artifact | Verdict | Rationale |
|---|---|---|
| `domain_evolucoes.py` — 14-role SBAR template catalog (§1.1) | TRANSFORM | Sound, clinically-reviewed content model (role-specific SBAR sections); rebuild on V2's form engine, and — critically — decide whether template field metadata becomes actually-enforced structured data (closing Finding CDF-1/§7) or is retired as UI-only guidance |
| `domain_evolucoes.py` — `prefill_background()` (§1.2) | TRANSFORM, with defects called out | Sound concept (reduce charting burden per ADR-0028); must not be wired in with the falsy-zero bug (CDF-2) uncorrected |
| `domain_evolucoes.py` — amendment/lifecycle state machine (§1.3) | REJECT — as implemented; TRANSFORM the concept | The three-state (`draft`/`final`/`amended`) immutable-with-adenda concept is medico-legally sound and matches ADR-0028; the implementation inverts the status of the current record (CDF-4) and cannot produce `draft` at all (CDF-5) |
| `models/evolucao.py` | TRANSFORM | Structurally sound (hash, amendment FK chain); needs a DB-level status enum/check constraint V2's model should add, and a structured (not opaque-string) representation for at least the Background section's typed fields |
| `schemas/evolucoes.py` | REJECT — as implemented (the `status` field on `EvolucaoCreate`); TRANSFORM the rest | The dead `status` field (CDF-6) should either be wired through or removed from the contract — an unenforced request field is worse than no field, because it implies a capability that does not exist |
| `api/v1/evolucoes.py` | REJECT — as implemented (amendment path missing); TRANSFORM the reviewed reads | The two `GET` endpoints are clean pass-throughs worth carrying the *shape* of; the `POST` endpoint's inability to create a draft or an amendment is a blocking gap against ADR-0028's own stated medico-legal requirement |

All verdicts: **PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer:
rodaquino-OMNI).**
