---
id: LEGREV-CDF-INDEX
title: Legacy review — V1 clinical-documentation-and-forms (evolucoes) domain (cycle 1, Task 1, wave 1b) — index
label: PROPOSAL
status: PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI)
statement: >
  Index and provenance record for the cycle-1 forensic review of the legacy (V1)
  clinical-notes / evolution-documentation domain (`domain_evolucoes.py`, the
  `Evolucao`/`EvolucaoTemplate`/`EvolucaoSection` models, the evolucoes API schemas
  and router, ADR-0028, and the 77-rule `evolucoes` cluster). Every finding in this
  directory is a PROPOSAL; nothing is imported, selected, or ratified.
provenance:
  source_repo: intensicare (legacy V1, READ-ONLY)
  path_or_url: https://github.com/Omni-Saude/intensicare
  commit_sha_or_version: 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79 (HEAD at pin time; per-file SHA-256 below)
  section_or_lines: see per-record citations
  date_collected: 2026-08-15
  last_updated: 2026-08-15
  collector: legacy clinical-documentation and forms forensics reviewer (cycle 1, Task 1, wave 1b, workstream CDF)
  transformation: >
    Read from source; summarized and analyzed. No legacy code, schema, rule, or
    template content is imported by this review.
  confidence: high (mechanical citations) / medium (clinical assessments)
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  hazards: [HAZ-0005, HAZ-0008, HAZ-0021, HAZ-0036]
  adrs: []
  pr: null
supersedes: null
superseded_by: null
---

# Legacy review — clinical-documentation-and-forms (evolucoes) domain (index)

> **PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).**
> Per `docs/00-governance/legacy-import-policy.md` §1 the default is **do not
> copy**. These records document what the legacy system does, verified from
> source, and propose per-artifact verdicts under
> `docs/00-governance/legacy-import-policy.md` §4. No verdict here is
> self-executing.

## Scope (coverage-map workstream CDF, 9/9 items)

Per `docs/05-clinical-safety/legacy-review/00-inventory/coverage-map.md` §3
"WAVE-1B (PROPOSAL) clinical-documentation-and-forms":

| # | Item | Record |
|---|---|---|
| 1 | `src/intensicare/services/domain_evolucoes.py` | `evolucoes-domain-review.md` §1 |
| 2 | `src/intensicare/models/evolucao.py` | `evolucoes-domain-review.md` §2 |
| 3 | `src/intensicare/schemas/evolucoes.py` | `evolucoes-domain-review.md` §3 |
| 4 | `src/intensicare/api/v1/evolucoes.py` | `evolucoes-domain-review.md` §4 |
| 5 | `evolucoes` rule cluster (77 rules) | `evolucoes-cluster-review.md` |
| 6 | `docs/plan/_work/dispositions/evolucoes-p1.yaml` | `evolucoes-cluster-review.md` §0 |
| 7 | `docs/plan/_work/dispositions/evolucoes-p2.yaml` | `evolucoes-cluster-review.md` §0 |
| 8 | `docs/adr/0028-evolucoes-clinical-notes-architecture.md` | `adr-0028-context.md` |
| 9 | `tests/test_domain_evolucoes.py` | listed only, not reviewed (task-packet rule: tests follow the module they test) |

All 9/9 items covered. Nothing in this workstream's assignment was unlocatable.

## Records in this directory

| Record | Scope |
|---|---|
| `evolucoes-domain-review.md` | Service (`domain_evolucoes.py`: 14-role SBAR templates, lifecycle/amendment state machine, `prefill_background`), model (`evolucao.py`), schemas (`schemas/evolucoes.py`), API router (`api/v1/evolucoes.py`); the SOFA-display-fork analysis; HAZ-0005-lens form-default-coercion findings; blocking-vs-nagging documentation-completeness findings |
| `evolucoes-cluster-review.md` | Cluster-level review of the 77-rule `evolucoes` catalog with a per-rule disposition table, grouped by sub-theme |
| `adr-0028-context.md` | Context classification only for the legacy repo's own ADR-0028 (SBAR hybrid architecture) |

## Provenance discipline

- Legacy repo pinned at git HEAD `1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79`
  (2026-08-15), per `docs/archive/legacy-provenance/legacy-pin-cycle-1.md`.
  OBSERVED (2026-08-15): the four `src/` files, the ADR, and the test file
  cited by this workstream were re-hashed with `shasum -a 256` and **matched**
  the manifest exactly. The two disposition shards (`evolucoes-p1.yaml`,
  `evolucoes-p2.yaml`) are `(rt)` — absent from the pin manifest per
  `inventory.md` §2.9 ("`docs/plan/` NOT in pin manifest, hashed at read
  time") — and were independently hashed here; both **matched** the `(rt)`
  hashes recorded in `inventory.md`.
- IMPORTANT provenance caveat (inherited, NL-1): `RULE-EVOLUCOES-001` and
  `RULE-EVOLUCOES-002` (and most of the 77-rule catalog) are extracted from
  two upstream repositories, `ahlabs-trilhas@8166c07e` and
  `trilhas-frontend@f9656be2`, that are **not mounted** in this cycle. Their
  content is reviewed as recorded in the rule files, not re-verified against
  upstream source. Where this review cites those rule records, it says so.
  The Python service layer (`src/intensicare/services/domain_evolucoes.py`)
  and its model/schema/API siblings, by contrast, **are** directly verified
  from mounted source.

## Headline findings (detail and citations inside the records)

1. **No score-logic fork inside the evolucoes domain.** `domain_evolucoes.py`
   contains one function that touches clinical scores,
   `prefill_background()` (line 1580), and it only *formats* a `scores` dict
   supplied by its caller — it computes nothing. `docs/adr/0028-…md` (the
   legacy repo's own architecture note, itself unratified) explicitly commits
   the Background section to sourcing SOFA/Glasgow/RASS from the canonical
   scoring services, not from a local computation. See
   `evolucoes-domain-review.md` §5 for the full analysis, including the
   adjacent (out-of-scope) finding that `domain_formularios.py` — owned by
   the `neuro-sedation-scores` workstream, not this one — **does** contain a
   second, independent `_calculate_sofa()` implementation; that is flagged
   here only as a cross-workstream advisory note, per coverage-map §1 rule 5.
2. **`prefill_background()` is dead code** — defined, fully implemented, but
   never called anywhere in the reviewed source tree. See §6.
3. **A falsy-zero coercion bug in `prefill_background()`**: vital-sign lookups
   use Python `or`-chaining (`vitals.get("heart_rate") or
   vitals.get("frequencia_cardiaca")`), which silently discards a
   clinically-critical `0` reading in favor of a second key. HAZ-0005-adjacent
   (not the classic absence→0 pattern, but the mirror case: a real zero
   value is treated as absent). See §6.
4. **The amendment/correction state machine inverts its own docstring.**
   `create_evolution()`'s docstring states amendments are immutable once
   `status="final"`, with corrections as new records — but the code path that
   creates a correction stamps the **new, currently-authoritative** record
   `status="amended"` (not `"final"`), while the record it supersedes keeps
   `"final"` until reassigned. HAZ-0008 / HAZ-0021 relevant: a system that
   filters on `status=="final"` to find "the current note" would surface the
   *superseded* version. See §6.
5. **`EvolucaoCreate.status` is a schema field with no code path.** The API
   schema advertises client-selectable `draft`/`final` status and the service
   layer defines a `draft` status value, but `create_patient_evolution()`
   never passes `body.status` through, and no endpoint accepts `previous_id`
   — so amendments are entirely unreachable via the reviewed API surface, and
   `draft` can never be produced. This is a **blocking, not nagging**,
   completeness gap for the amendment workflow ADR-0028 identifies as a
   medico-legal requirement (CFM 1.638/2002 non-repudiation). See §7.
6. **The 14-template field schema is decorative at runtime.** Each of the 14
   role templates declares typed per-field definitions (numbers, ranges,
   Morse/Braden scores, etc.), but `EvolutionSection`/`Evolucao.sections` only
   ever persists one opaque `content: str` per SBAR section — the granular
   field-level structure ADR-0028 chose specifically to keep the Background
   section machine-readable is not actually captured by the create/validate
   path. See §7.
7. **Cluster disposition**: 0 RETAIN, 0 REFINE, 46 TRANSFORM, 13 ARCHIVE, 14
   REJECT (as implemented), 4 VALIDATE, 0 SUPERSEDE — see
   `evolucoes-cluster-review.md` §3.

All of the above are PROPOSALS pending named clinical review.
