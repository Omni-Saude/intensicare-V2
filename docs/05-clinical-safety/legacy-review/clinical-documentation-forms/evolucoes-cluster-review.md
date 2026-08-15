---
id: LEGREV-CDF-CLUSTER
title: Legacy review — docs/rules evolucoes cluster (77 rule records) with per-rule dispositions
label: PROPOSAL
status: PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI)
statement: >
  Cluster-level review of the legacy extracted-rule catalog cluster
  `evolucoes` (77 rule records, RULE-EVOLUCOES-001..077), with a per-rule
  disposition table (rule ID, one-line function with citation, proposed
  verdict) under docs/00-governance/legacy-import-policy.md, grouped by
  sub-theme.
provenance:
  source_repo: intensicare (legacy V1, READ-ONLY)
  path_or_url: docs/plan/_work/dispositions/evolucoes-p1.yaml; docs/plan/_work/dispositions/evolucoes-p2.yaml
  commit_sha_or_version: 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79 (HEAD at pin; docs/plan is NOT in the pin manifest — hash-and-note below)
  section_or_lines: whole cluster (77 records across two shards)
  date_collected: 2026-08-15
  last_updated: 2026-08-15
  collector: legacy clinical-documentation and forms forensics reviewer (cycle 1, Task 1, wave 1b, workstream CDF)
  transformation: >
    Every disposition record read (source quote, the legacy team's own
    ADOPT/ADOPT-CORRECTED/ADAPT/RETIRE disposition and justification,
    escalation band, ratify_ref); one-line summaries condensed from the
    records; verdicts below are this reviewer's independent proposals under
    legacy-import-policy.md §4, not a restatement of the shard's own
    (unratified) dispositions.
  confidence: high (record contents, hash-verified) / medium (verdicts)
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  hazards: [HAZ-0005, HAZ-0008, HAZ-0021, HAZ-0036]
  adrs: []
  pr: null
supersedes: null
superseded_by: null
---

# Evolucoes rule cluster — disposition review

> **PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).**
> Nothing in this table is an import decision. A verdict here proposes a
> classification under `docs/00-governance/legacy-import-policy.md` §4; any
> actual import additionally requires all eight §3 preconditions, which are
> currently unmet (license/IP, named owner, clinical relevance review, V2
> acceptance tests, and more).

## 0. Sources and integrity

- Cluster: `docs/plan/_work/dispositions/evolucoes-p1.yaml` (39 records,
  RULE-EVOLUCOES-001..039) and `evolucoes-p2.yaml` (38 records,
  RULE-EVOLUCOES-040..077) — OBSERVED 2026-08-15: 77 records total, IDs
  contiguous, no gaps, no duplicates. This matches `inventory.md` line 662
  ("evolucoes | 77 / 77") and `catalog-index.json`'s 77
  `RULE-EVOLUCOES-*` entries.
- Both shard files are `(rt)` — absent from the pin manifest per
  `inventory.md` §2.9. OBSERVED, independently re-hashed 2026-08-15:

  ```text
  3fd38ea4c444a2701eaaa5106b916384aa6df95351812f8dfc0e9ec0a8889357  docs/plan/_work/dispositions/evolucoes-p1.yaml
  410f1b0518e8c0775a706be217d454e683e0d216d21cb6e30b0b8ae9fd4fe0b5  docs/plan/_work/dispositions/evolucoes-p2.yaml
  ```

  Both **match** the `(rt)` hashes recorded in `inventory.md` lines 422-423.
- Two rules (`RULE-EVOLUCOES-001`/`002`) are also cross-cited from
  `docs/rules/clinical-scoring/` (they carry `category: clinical-scoring`
  inside the `evolucoes` cluster) — reviewed in depth in
  `evolucoes-domain-review.md` §5.
- Provenance caveat (inherited, NL-1): almost every rule in this cluster
  cites `ahlabs-trilhas@8166c07e` and/or `trilhas-frontend@f9656be2`
  (upstream repos not mounted this cycle). This review verifies the
  *disposition records*, not the unmounted upstream source; each row's
  citation inherits the record's own audit provenance, exactly as the
  `alert-threshold-cluster-review.md` exemplar states for its cluster.
- 20 of the 77 rules carry a `[RATIFIED 2026-07-04]` marker inside the
  shard's own `justification` field, or an `ESC-*`/`ratify_ref` escalation.
  That ratification happened under the **legacy team's own, prior
  process** (see `adr-0028-context.md` §1) — it is INFERENCE-grade context
  for this review, not a V2 ratification, and does not raise this review's
  verdict ceiling.

## 1. Verdict method (applied uniformly)

Because IntensiCare V2 is a from-scratch stack (FastAPI/SQLAlchemy vs. this
cluster's Django/Tasy-era assumptions; MPI/AMH-based identity vs.
`empresa`/`estabelecimento` tenancy), **no rule in this cluster is a RETAIN
or REFINE candidate** regardless of how cleanly specified it is — every
adoption path requires rebuilding on the new stack, which is TRANSFORM by
definition, not "as-is" or "light modification."

| Verdict | Applied when |
|---|---|
| VALIDATE | The rule embeds actual clinical or medico-legal judgment content (a score's display semantics, a clinically-mandatory-field policy, an unconfirmed audit-trail pattern) that needs a named clinical/legal sign-off before any design decision, independent of implementation quality |
| TRANSFORM | A sound underlying concept (workflow, access-control, or form-engine behavior) is worth carrying, but only as a rebuilt V2-native design; the legacy implementation itself is not the candidate |
| REJECT — as implemented | The rule's own record documents a genuine defect (inverted logic, dead validation, silent data loss, a completeness gate that only nags instead of blocks) that must not be reproduced; the underlying intent, where sound, is separately TRANSFORM-worthy and is said so in the one-liner |
| ARCHIVE | The rule is legacy-platform-specific plumbing (Django REST routing, Tasy ETL integration codes, Firestore-era mechanics) that the shard's own justification ties to a **legacy-repo-internal** migration decision (its own `ADR-001-amh-data-platform-consumer.md`) with "no clinical semantics lost"; kept as historical reference only, not proposed for any V2 form |
| SUPERSEDE | Not used in this cluster — reserved for cases where IntensiCare **V2's own** ratified architecture (not the legacy repo's internal planning) already replaces a mechanism wholesale; no such V2 decision exists yet to invoke it against |
| RETAIN / REFINE | Not proposed for any row, per the stack-rebuild rationale above |

## 2. Per-rule disposition table, grouped by sub-theme

### 2.1 Clinical-scoring content (2 rules)

Reviewed in depth in `evolucoes-domain-review.md` §5.

| Rule ID | What it does (one line, cited) | Verdict |
|---|---|---|
| RULE-EVOLUCOES-001 | Prontuario record carries an opaque pre-computed `escore_sofa` field alongside likely SOFA component labs/vitals; no formula in this partition (tf `Prontuario.d.ts:19-63`) | VALIDATE — opaque clinical-score field; component-field parity with the canonical SOFA implementation needs named clinical sign-off |
| RULE-EVOLUCOES-002 | Badge "Escore sofa: {value}" rendered when `escore_sofa >= 0`; `undefined`/negative silently hidden, no "not evaluated" state (tf `FormDadosProntuario.tsx:85-94`) | VALIDATE — display gate touches clinical-score presentation; the silent-hide-on-missing behavior must be corrected (explicit not-evaluated state, not a bare hide) before any V2 design adopts the concept |

### 2.2 Type/field-shape consistency across models (2 rules)

| Rule ID | What it does (one line, cited) | Verdict |
|---|---|---|
| RULE-EVOLUCOES-003 | RASS typed `number` in one model, `string` in another; Sessler 2002 defines a single 10-level integer ordinal | REJECT — as implemented (unreconciled type split risks silent misinterpretation of an ordinal scale); TRANSFORM the single-canonical-integer-RASS intent |
| RULE-EVOLUCOES-004 | Cardiac-arrest occurrence flag typed free-form string while sibling boolean flags in the same object are boolean | TRANSFORM — no Utstein-style software-typing authority cited; sound intent to standardize, no defect requiring REJECT |

### 2.3 Patient/encounter identity, tenancy, and integration plumbing (5 rules)

*(Cross-reference: RULE-EVOLUCOES-052, an author-only-update authorization
rule, is thematically access-control, not identity/tenancy — grouped in
§2.4 below with its sibling authorization rules.)*

| Rule ID | What it does (one line, cited) | Verdict |
|---|---|---|
| RULE-EVOLUCOES-005 | Trivial ORM name lookup (Paciente by `nr_atendimento`) with defensive default, no clinical formula | TRANSFORM |
| RULE-EVOLUCOES-006 | Leito resolution precedence (`ocupacoes__pk` over query param) is Django REST routing tied to the legacy homecare URL scheme | ARCHIVE — legacy-repo's own ADR-001 platform-change grounds; "no clinical semantics lost" (shard's own words) |
| RULE-EVOLUCOES-018 | Filters `Formulario` by `empresa_id` against a possible full `Empresa` instance rather than pk — legacy multi-tenancy wiring | ARCHIVE — tenancy mechanism tied to legacy `empresa`/`estabelecimento` hierarchy, superseded by MPI-based identity per legacy repo's own ADR-001 |
| RULE-EVOLUCOES-048 | Manually hand-builds a query string (`profissional_id`/`data_inicio`/`data_fim`) with a possibly-duplicated params object — axios networking quirk | ARCHIVE — no clinical semantics; new API client eliminates the dual-encoding risk entirely |
| RULE-EVOLUCOES-075 | Encounter identifier split: `numero_atendimento: number` in one model, `nr_atendimento: string` in another | REJECT — as implemented (a split, inconsistently-typed identifier for the same domain concept is a data-integrity risk); TRANSFORM toward one canonical, single-typed encounter identifier |

### 2.4 Document visibility and access control (5 rules)

| Rule ID | What it does (one line, cited) | Verdict |
|---|---|---|
| RULE-EVOLUCOES-007 | Restricts visibility of a same-type Formulario to its own author unless status is `liberado` (deny-by-default) | TRANSFORM |
| RULE-EVOLUCOES-019 | Edit/inactivate/re-sign controls shown only to the original author on a non-inactive record | TRANSFORM |
| RULE-EVOLUCOES-029 | `anterior_indicadores` looks up the previous same-type form **without** the author/status visibility filter the main list endpoint enforces — another user's draft can leak into the "previous form" payload | REJECT — as implemented (a visibility-parity bypass leaking a draft record is a genuine privacy/authorship-integrity defect); TRANSFORM the carry-forward-lookup intent with the same filter applied |
| RULE-EVOLUCOES-051 | Forbids any update to an `inativo` evolution (core audit-integrity invariant, CFM NGS-2-aligned) | TRANSFORM |
| RULE-EVOLUCOES-052 | Restricts edits to the original author (`preenchido_por`) — deny-by-default authorization pattern | TRANSFORM |

### 2.5 E-signature, non-repudiation, and inactivation guards (6 rules)

| Rule ID | What it does (one line, cited) | Verdict |
|---|---|---|
| RULE-EVOLUCOES-008 | Signed PDF (`pdf_assinado`) takes precedence over the unsigned draft PDF whenever both exist | TRANSFORM |
| RULE-EVOLUCOES-025 | `dt_assinatura` is stamped from `dt_registro` instead of the signing service's own timestamp — misrepresents the true signing moment whenever signing happens after creation | REJECT — as implemented (a signature-timestamp defect is a direct non-repudiation/medico-legal integrity risk); TRANSFORM toward recording the actual signing-service timestamp |
| RULE-EVOLUCOES-053 | A user without a registered CPF cannot release (`liberar`) an evolution | TRANSFORM |
| RULE-EVOLUCOES-054 | Digital signing additionally requires a registered PIN (two-factor gate) | TRANSFORM |
| RULE-EVOLUCOES-055 | `validar_inativacao` guard exists (never-inactivate-a-released-record) but is never invoked by `destroy()` — dead validation | REJECT — as implemented (an unenforced guard is functionally absent); TRANSFORM the guard, wired directly into the deletion path this time |
| RULE-EVOLUCOES-030 | Same underlying defect from the mutation side: `destroy()` marks a record `inativo` and logs an audit action without ever calling `validar_inativacao` — a `liberado` record can be silently inactivated | REJECT — as implemented (paired with -055; a silently bypassable inactivation guard on a signed clinical record is a blocking-vs-nagging failure — see `evolucoes-domain-review.md` §7) |

### 2.6 Tasy/legacy-integration retirement (Tasy release codes, AMH Docs export) (6 rules)

| Rule ID | What it does (one line, cited) | Verdict |
|---|---|---|
| RULE-EVOLUCOES-009 | Gates Tasy release (`liberar`) on a fixed registered-`tipo` set with silent no-op for unregistered types | ARCHIVE |
| RULE-EVOLUCOES-010 | Hardcoded `tipo`→Tasy-integration-code map (`medico=1151`, etc.) | ARCHIVE — the underlying professional-role vocabulary itself is preserved separately (§2.9 below), only the Tasy code mapping is retired |
| RULE-EVOLUCOES-011 | `can_liberar` Tasy-release eligibility predicate, apparently unused | ARCHIVE |
| RULE-EVOLUCOES-012 | `tipo`→AMH-Docs export category-code switcher | ARCHIVE |
| RULE-EVOLUCOES-016 | Admission date sourced conditionally from the Tasy-fed `MicroIndicadores` table | ARCHIVE — V2's admission date is intended to come from the AMH Data Platform's patient record instead (per the shard's own citation; this is INFERENCE about legacy-internal planning, not a confirmed V2 decision) |
| RULE-EVOLUCOES-028 | `manage_data` stamps every write payload with identifiers from a URL kwarg and wraps each content block into a `<conteudo>_data` key | ARCHIVE — Django REST serialization-shaping detail tied to the legacy homecare API surface |

### 2.7 Conditional PDF/section rendering and dynamic-field engine (18 rules)

| Rule ID | What it does (one line, cited) | Verdict |
|---|---|---|
| RULE-EVOLUCOES-013 | Flags a PDF assessment section "present" whenever any single non-metadata field is non-`None` — a lone `False`/empty-string field also counts as "filled" | REJECT — as implemented (mis-rendering section presence in a signed clinical PDF is a documentation-completeness/medico-legal risk, not cosmetic); TRANSFORM the render-only-populated-sections intent with corrected per-field-type emptiness semantics |
| RULE-EVOLUCOES-021 | Schema-driven `conditions` map reveals sub-fields keyed by a governing field's value (show-if pattern) | TRANSFORM |
| RULE-EVOLUCOES-022 | A single-checkbox variant keys off `e.target.value` on an antd `Checkbox`, which only ever carries `.checked` — the lookup is always `undefined`; no conditional field has ever rendered through this path | ARCHIVE — dead code, no working behavior to preserve; correct pattern already captured in RULE-EVOLUCOES-021 |
| RULE-EVOLUCOES-023 | Declared 11-type field-type union vs. a render dispatch implementing only 10 — `time` fields are silently dropped | REJECT — as implemented (a declared type with no render path is a silent capability gap); TRANSFORM toward full-vocabulary dispatch |
| RULE-EVOLUCOES-049 | Recursive `nullifyFields` mechanic replaces an annulled group's value with `{}`/`[]` per its declared type on submit | TRANSFORM |
| RULE-EVOLUCOES-050 | `checavel` subgroup toggle defaults ON only when data exists, hides fields while OFF, nulls the subgroup on disable | TRANSFORM |
| RULE-EVOLUCOES-058 | Updating a dynamic evolution requires an explicit `id` per sub-form field; falsy `valor` fields silently skipped | TRANSFORM |
| RULE-EVOLUCOES-063 | Strips inherited `id`s before POSTing a new evolution so it does not overwrite the prefilled source record — but only one level deep, leaving array-element ids untouched | REJECT — as implemented (a partial id-strip can cause a new record to silently overwrite/corrupt a nested element of the prefilled source record); TRANSFORM toward a recursive strip |
| RULE-EVOLUCOES-064 | `disableAll = disabledOnEdit \|\| mode===in_page \|\| nullCampo` — the correct, consistently-applied read-only-field baseline | TRANSFORM — reference baseline for -065 |
| RULE-EVOLUCOES-065 | A sibling component inverts `isAnnulled` in its disable expression, the opposite of every other subform's semantics, and can throw when the nullifier is missing | REJECT — as implemented (an inverted boolean condition is the same defect class the alert-threshold cluster review flagged repeatedly as unacceptable); TRANSFORM toward alignment with -064's baseline |
| RULE-EVOLUCOES-066 | Inclusive `[campo.min, campo.max]` numeric range validation plus required-when-flagged | TRANSFORM |
| RULE-EVOLUCOES-067 | Slider input intrinsically clamped to `campo.min`/`campo.max`, disabled `Input` in read-only mode | TRANSFORM |
| RULE-EVOLUCOES-068 | Multicheck selection-count validated as array length within `[min, max]` | TRANSFORM |
| RULE-EVOLUCOES-069 | Input mask applied plus regex validation, required flag driven by `campo.required` | TRANSFORM |
| RULE-EVOLUCOES-070 | Repeatable list items capped at `campo.max` (unbounded when undefined) | TRANSFORM |
| RULE-EVOLUCOES-071 | Standard required-field rule gated strictly on `campo.required` across text/date/select/boolean/checkbox/extra field types | TRANSFORM |
| RULE-EVOLUCOES-072 | Core `Campo` type schema (required/min/max/regex/mask/conditions/formList/disabledOnEdit) underpinning all field-level validation rules in this cluster | TRANSFORM — the declarative engine contract worth adopting as a baseline shape; see `evolucoes-domain-review.md` §7 for the finding that this schema is **not** carried through to the reviewed Python persistence layer today |
| RULE-EVOLUCOES-073 | `conditions` map keyed by a governing field's value revealing additional `Campo[]` definitions | TRANSFORM |

### 2.8 Cross-form and cross-encounter clinical data correlation (4 rules)

| Rule ID | What it does (one line, cited) | Verdict |
|---|---|---|
| RULE-EVOLUCOES-014 | A medical evolution displays the single most-recent vital-signs record at/before its own creation time (not the globally-latest) | TRANSFORM |
| RULE-EVOLUCOES-015 | A nutritionist PDF sources pressure-injury (LPP) records from the most recent nursing evolution, not tracked independently per discipline | TRANSFORM — the inconsistent empty-dict-vs-list edge case the shard notes should be closed during rebuild, not treated as blocking on its own |
| RULE-EVOLUCOES-017 | Vitals creation for the médico form bundles an auto-created/looked-up daily `BalancoHidrico` via a `.get_pk` call that may not exist on the model instance — possible live `AttributeError` | REJECT — as implemented (an unguarded attribute access on a clinically-relevant vitals/fluid-balance write path is a reliability defect); TRANSFORM the bundled-creation intent |
| RULE-EVOLUCOES-024 | A new sepsis evolution auto-links to the most recently created `SinaisVitais` record for the same encounter (or null) | TRANSFORM |

### 2.9 Role-specific form content composition — 14 clinical roles (11 rules)

| Rule ID | What it does (one line, cited) | Verdict |
|---|---|---|
| RULE-EVOLUCOES-031 | Médico form: 4 content blocks gated by role permission | TRANSFORM |
| RULE-EVOLUCOES-032 | Enfermagem form: 1 content block | TRANSFORM |
| RULE-EVOLUCOES-033 | Técnico de enfermagem form: 1 content block | TRANSFORM |
| RULE-EVOLUCOES-034 | Fisioterapeuta form: 2 content blocks | TRANSFORM |
| RULE-EVOLUCOES-035 | Farmacêutico clínico form: 5 content blocks (incl. `conciliacao_medicamentosa`) | TRANSFORM |
| RULE-EVOLUCOES-036 | Fonoaudiólogo form: 4 content blocks | TRANSFORM |
| RULE-EVOLUCOES-037 | Musicoterapeuta form: 3 content blocks | TRANSFORM |
| RULE-EVOLUCOES-038 | Nutricionista form: 4 content blocks | TRANSFORM |
| RULE-EVOLUCOES-039 | Psicólogo form: 4 content blocks | TRANSFORM |
| RULE-EVOLUCOES-040 | Generic therapist form: base block only, RBAC gate is legacy plumbing | TRANSFORM |
| RULE-EVOLUCOES-041 | Intercorrência form: 5 content blocks incl. `relato_gastos` (billing-adjacent) | TRANSFORM |

### 2.10 Lifecycle state machine, release/sign workflow, and prefill (9 rules)

Cross-reference: `evolucoes-domain-review.md` §1.3 (Findings CDF-4/CDF-5)
found the *implemented* Python state machine inverts part of the intent
RULE-EVOLUCOES-042 describes; that finding is on the code, not on this rule
record.

| Rule ID | What it does (one line, cited) | Verdict |
|---|---|---|
| RULE-EVOLUCOES-026 | Automatically signs and releases in the same request whenever a new evolution is created with `status=='liberado'` (no way to sign without releasing, or vice versa) | TRANSFORM — sound atomic-transition intent; Cryptocubo/Tasy-specific mechanism is legacy-platform-specific |
| RULE-EVOLUCOES-027 | Re-runs the same atomic sign+release logic on update, gated by edit-eligibility; composes with -026 | TRANSFORM |
| RULE-EVOLUCOES-042 | Canonical `salvo`/`liberado`/`inativo` tri-state lifecycle, reconciled BE/FE with no divergence found in the legacy record | TRANSFORM — the concept is sound and is the cluster's single most load-bearing invariant (CLU-EVOLUCOES-C-01); see `evolucoes-domain-review.md` §1.3 for why the V2-adjacent implementation this workstream found does **not** currently satisfy it |
| RULE-EVOLUCOES-043 | Status drives displayed icon/hardcoded hex color per state | TRANSFORM — sound UX intent; specific icon set/hex values are presentation detail, not yet superseded by any decided V2 design system |
| RULE-EVOLUCOES-044 | Release/sign sets `status=liberado` plus an `assinar` flag via direct PATCH-merge | TRANSFORM |
| RULE-EVOLUCOES-045 | Confirmation modal offers distinct "save as draft" vs. "save and release/sign" actions | TRANSFORM |
| RULE-EVOLUCOES-046 | New evolution form is prefilled from the patient's last saved form, timestamp reset to now | TRANSFORM |
| RULE-EVOLUCOES-047 | Dedicated untyped endpoint retrieves prior-form indicators for pre-population | TRANSFORM |
| RULE-EVOLUCOES-062 | 14-role vocabulary keyed in `useEvolucaoMenu`, but the pharmacist entry uses key `formulario_farmaceutica` while its own gating permission and every sibling use `formulario_farmaceutico` | REJECT — as implemented (a role-key mismatch can make one clinical role's documentation entry point unreachable through the mismatched path — an availability/completeness defect, not cosmetic); TRANSFORM the corrected, consistent 14-role key vocabulary |

### 2.11 Data-validation, serialization, and coercion plumbing (6 rules)

| Rule ID | What it does (one line, cited) | Verdict |
|---|---|---|
| RULE-EVOLUCOES-057 | `dispositivos_invasivos`, a declared required serializer field, is absent from every `Meta.fields`/`action_fields` variant — silently excluded from output | REJECT — as implemented (a required field silently missing from every serialization path is a documentation-completeness/data-loss defect — the underlying vocabulary is preserved separately via other nursing-form rules, but this specific mechanism must not be repeated) |
| RULE-EVOLUCOES-059 | `dt_registro` is force-disabled client-side (`disabledOnEdit=true`) on edit, with no server-side enforcement noted | REJECT — as implemented (client-only enforcement of an audit-integrity invariant is a nagging-not-blocking gap; see `evolucoes-domain-review.md` §7); TRANSFORM toward server-side enforcement |
| RULE-EVOLUCOES-060 | `peso`/`altura`/`imc` coerced from API string to number via unary-plus, silent `NaN` on malformed input, no reverse coercion on submit | ARCHIVE — an ad hoc client-typing workaround; the legacy repo's own justification ties this to FHIR `Observation.valueQuantity` being natively numeric, which the record treats as obsoleting the coercion outright |
| RULE-EVOLUCOES-061 | `moment.js`↔string date-adapter pattern, applied inconsistently between two role forms | ARCHIVE — legacy frontend date-serialization plumbing the record itself treats as unnecessary given consistent typing |
| RULE-EVOLUCOES-076 | Closed 4-value gender enumeration (M/F/O/N) used consistently across four models | TRANSFORM — the vocabulary itself is worth carrying only as a starting point; whether a 4-value, Portuguese-coded gender model meets current inclusive-data and interoperability expectations is a named-owner policy question, not decidable by this review |
| RULE-EVOLUCOES-077 | Report filter requires professional + start date, validates end-date ordering, disables out-of-range calendar days | TRANSFORM |

### 2.12 UI mechanics tied to a retired component tree (1 rule)

| Rule ID | What it does (one line, cited) | Verdict |
|---|---|---|
| RULE-EVOLUCOES-020 | `hideOk` drawer-button gating tied to a specific legacy `CollapseCard` component pair | ARCHIVE — UI-mechanics detail of a retired React component tree, no clinical semantics |

### 2.13 Medico-legal / documentation-policy content requiring named sign-off (2 rules)

| Rule ID | What it does (one line, cited) | Verdict |
|---|---|---|
| RULE-EVOLUCOES-056 | Nutritionist form uniquely requires `avaliacao_global`, `terapia_nutricional`, `avaliacao_abdominal` (every sibling role marks these optional) | VALIDATE — a discipline-specific mandatory-field policy is a clinical-completeness decision that needs a named clinical owner's sign-off before being carried into any V2 blocking gate |
| RULE-EVOLUCOES-074 | `anulavel`/`nullifiers` type shapes suggest a void-rather-than-delete medico-legal audit pattern, but the shard's own low-confidence note states no code in this partition actually sets or reads `isAnnulled` | VALIDATE — plausible and clinically valuable if confirmed, but unconfirmed in code and legally consequential (a void-record pattern touches CFM recordkeeping obligations); needs both technical confirmation and named legal/clinical sign-off |

## 3. Disposition tallies

| Verdict | Count |
|---|---|
| RETAIN | 0 |
| REFINE | 0 |
| TRANSFORM | 46 |
| ARCHIVE | 13 |
| REJECT — as implemented | 14 |
| VALIDATE | 4 |
| SUPERSEDE | 0 |
| **Total** | **77** |

Cross-check by section (rule-ID count per §2.x heading, all 77 IDs
001–077 placed in exactly one section, verified by direct enumeration):
§2.1 (2) + §2.2 (2) + §2.3 (5) + §2.4 (5) + §2.5 (6) + §2.6 (6) + §2.7 (18) +
§2.8 (4) + §2.9 (11) + §2.10 (9) + §2.11 (6) + §2.12 (1) + §2.13 (2) =
2+2+5+5+6+6+18+4+11+9+6+1+2 = **77**. Matches.

Cross-check by verdict (recount directly from each table row's Verdict
column): TRANSFORM — 004, 005, 007, 008, 014, 015, 019, 021, 024, 026, 027,
031–041 (11), 042, 043, 044, 045, 046, 047, 049, 050, 051, 052, 053, 054,
058, 064, 066, 067, 068, 069, 070, 071, 072, 073, 076, 077 = 46. REJECT — as
implemented — 003, 013, 017, 023, 025, 029, 030, 055, 057, 059, 062, 063,
065, 075 = 14. ARCHIVE — 006, 009, 010, 011, 012, 016, 018, 020, 022, 028,
048, 060, 061 = 13. VALIDATE — 001, 002, 056, 074 = 4. Sum = 46+14+13+4 =
**77**. Matches.

## 4. Cluster-level findings

1. **No rule is import-ready.** Zero RETAIN/REFINE, for the stack-rebuild
   reason stated in §1 — this mirrors the alert-threshold and sepsis
   clusters' own findings, for an unrelated reason (there, clinical-content
   immaturity; here, a wholesale platform change already decided in the
   legacy repo's own planning).
2. **The two clinical-scoring rules (001/002) are the direct answer to this
   workstream's SOFA-display-fork question** — see
   `evolucoes-domain-review.md` §5 for the full analysis connecting these
   rule records (frontend-only, unmounted-upstream) to the actually-
   reviewable Python domain (no fork found there) and to the one genuine
   fork found elsewhere in the codebase (`domain_formularios.py`, out of
   this workstream's scope).
3. **Inverted-logic and unenforced-guard defects recur across the cluster**
   at roughly the same rate the alert-threshold cluster found for its
   clinical criteria: RULE-EVOLUCOES-065 (inverted `isAnnulled`),
   RULE-EVOLUCOES-025 (wrong timestamp source), RULE-EVOLUCOES-030/-055
   (inactivation guard defined but never wired), RULE-EVOLUCOES-057 (a
   required field silently excluded from serialization), RULE-EVOLUCOES-059
   (client-only enforcement of an audit invariant). None of these are
   clinical-scoring defects, but several sit directly on the medico-legal
   non-repudiation and completeness guarantees ADR-0028 claims for this
   domain (`adr-0028-context.md` §2) — the claim and the implementation do
   not currently match.
4. **Blocking vs. nagging is inconsistent within the same cluster.** The
   4-section SBAR completeness check is correctly blocking (server-side
   `ValueError`); the `dt_registro` immutability-on-edit invariant is
   documented as client-only (nagging); the per-role, per-field
   completeness metadata in the 14 templates is neither blocking nor
   nagging — it is simply unread. See `evolucoes-domain-review.md` §7 for
   the full table.
5. **A discipline-specific mandatory-field policy exists (RULE-EVOLUCOES-056,
   nutritionist form) with no visible clinical rationale recorded beyond
   "unlike every sibling role."** This is exactly the kind of
   documentation-completeness rule that gates a clinical workflow and needs
   a named clinical owner's decision before any V2 form engine encodes it as
   a hard requirement.

All dispositions: PROPOSAL — AWAITING NAMED CLINICAL REVIEW
(reviewer: rodaquino-OMNI).
