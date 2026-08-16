---
doc_id: GOV-TRACEABILITY-POLICY
status: PROPOSAL
owner: UNASSIGNED — VALIDATION REQUIRED
source: INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §8 (Product, domain, and requirements architecture)
last_updated: 2026-08-15
---

# Traceability Policy

PROPOSAL — this policy operationalizes prompt §8's stable-ID and
bidirectional-traceability requirement. It is not yet ratified by a named
human authority; see `registers/decision-register.md`.

## 1. Stable ID taxonomy

SOURCE (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:521-539`) — the following prefixes
are mandatory and exhaustive for cycle 0. No specialist may invent a new prefix
without an ADR amending this document.

| Prefix | Meaning |
|---|---|
| `OUT` | Outcome |
| `USR` | User need |
| `PRD` | Product requirement |
| `CLR` | Clinical requirement/rule |
| `SAF` | Safety requirement |
| `SEC` | Security/privacy control |
| `NFR` | Non-functional requirement |
| `ADR` | Architecture decision |
| `DOM` | Domain invariant |
| `API` | API operation/schema |
| `EVT` | Event contract |
| `UX` | Interaction/state requirement |
| `OPS` | Operational control |
| `TST` | Automated test/evidence |
| `VAL` | Human/external validation |
| `HAZ` | Hazard |
| `RISK` | Delivery/business risk |

Governance-register entries (evidence, assumptions, decisions, blockers) are not
listed in prompt §8 because they are process artifacts, not product/domain
artifacts. To keep every material statement addressable, this policy extends the
taxonomy with the following governance-scoped prefixes. These are a PROPOSAL of
this steward's own design decision, permitted under this task's
`decisions_allowed: document structure, register formats, ID formats`:

| Prefix | Meaning | Register |
|---|---|---|
| `EVID` | Evidence-register entry (OBSERVED/SOURCE fact) | `registers/evidence-register.md` |
| `ASM` | Assumptions-register entry | `registers/assumptions-register.md` |
| `GDEC` | Governance decision-register entry | `registers/decision-register.md` |
| `BLK` | Blocker-register entry | `registers/blockers-register.md` |

`RISK` remains the prompt-defined taxonomy prefix and is used directly in
`registers/risk-register.md` — it is not renamed to a governance-scoped prefix.

### 1.1 Proposed prefix extensions — PENDING RATIFICATION

**Status: PROPOSAL. Ratification owner: UNASSIGNED — VALIDATION REQUIRED.**

Since this policy was first written, multiple specialists have independently
needed IDs for material their catalogs did not fit under §1's 17 prefixes (or
this policy's own `EVID`/`ASM`/`GDEC`/`BLK` extensions) and have minted new
prefixes in their own documents, most of them self-flagging the gap rather
than silently treating it as ratified. This subsection consolidates those
flags into one place so a single ratification decision can dispose of all of
them together, instead of each being ratified ad hoc.

**Rule:** a prefix listed below becomes usable *for cross-referencing between
documents* immediately — specialists may cite `THR-0014` or `CRV-0001` in
another document's `links:` block without waiting — but **no register,
catalog, ADR, safety-case, or release-evidence bundle may treat it as a
ratified member of the taxonomy in §1** until a named human authority moves
it into §1 via a `DECIDED` entry in `registers/decision-register.md` (see
`GDEC-0002`). Until then, every ID under one of these prefixes carries the
same evidentiary weight as a `PROPOSAL` (`evidence-notation.md` §2),
regardless of how confidently it is used inside its own minting document.

| Prefix | Range/count (verified 2026-08-15) | Minting document | Purpose |
|---|---|---|---|
| `THR` | `THR-0001`–`THR-0067` (67 entries) | `docs/11-security-privacy-compliance/threat-model.md` | Individual threats (abuse cases, trust-boundary violations, supply-chain and connector/AI threats), each linked to `HAZ`/`SEC` IDs. |
| `CRV` | `CRV-0000` (reserved/retired, illustrative) through `CRV-0001`+ | `docs/12-quality-validation-and-testing/clinical-reference-vector-standard.md` | Clinical reference test vectors (input/expected-output pairs) for rule-runtime and validation testing, filed under `docs/05-clinical-safety/rule-releases/<pathway>/<rule-version>/vectors/`. |
| `QAS` | `QAS-0001`–`QAS-0029` (29 entries, **document-local**) | `docs/06-architecture/quality-attributes/quality-attribute-scenarios.md` | Quality-attribute scenarios (performance, availability, etc.) in the ISO/IEEE scenario format. |
| `IDP` | `IDP-01`–`IDP-12` (12 entries; **2-digit, not the ratified 4-digit format**) | `docs/08-interoperability/amh-data/identity-adjudication/interim-identity-policy.md`, `.../adjudication-request-to-amh-owners.md`, `.../contradiction-record.md` | Interim (pre-AMH-owner-resolution) identity/MPI policy rules. |
| `IDN` | Free-form suffixes (e.g. `IDN-CONTRA-001`, `IDN-C-1`…`IDN-C-5`, `IDN-POLICY-001`, `IDN-REQ-001`; **not the ratified `<PREFIX>-<NNNN>` format at all**) | same three identity-adjudication documents | Named points in the ADR-006/ADR-039/ADR-041/FHIR-IG tenant-identity contradiction record. |
| `NIU`, `SM`, `HM`, `WF`, `UR` | Document-local, counts not centrally tracked | `docs/01-vision-and-intended-use/` (`intended-use-statement.md`, `non-intended-uses.md`, `success-and-harm-metrics.md`) and `docs/02-users-and-workflows/` (`user-research-plan.md`, `user-roles-hypotheses.md`, `workflow-hypotheses.md`, `g1-validation-backlog.md`) | Non-intended-use item (`NIU`), success metric (`SM`), harm metric (`HM`), workflow hypothesis (`WF`), user-role hypothesis (`UR`) — pending stable-ID assignment. |
| `MD`, `MG`, `EPC`, `SPR`, `SR`, `OC` | **Document-local, escopado** ao par mapa+backlog (não são IDs globais): MD-1..MD-6; MG-G1..MG-G8-PROD; EPC-*; SPR-* (52); SR-1..SR-9 (contagens em 2026-08-15) | `docs/14-devsecops-and-delivery/mapa-de-projeto-ate-producao.md` + `mapa-de-projeto-backlog.yaml` | Marcos de decisão do titular (`MD`), marcos humanos de gate (`MG`), épicos (`EPC`), sprints/pacotes (`SPR`), riscos de sequência (`SR`) e operação contínua (`OC`) do mapa até produção. Registrado por instrução escrita do titular (D4, 2026-08-15): conjunto document-local, com **ratificação do titular embarcada na aprovação do PR** da branch `cycle-4/gates-g1-g2-agentificados`; fora do mapa, esses rótulos não referenciam nada. |

Per-prefix notes:

1. **`THR`** — the threat-model document itself explicitly states (its own
   line ~649) that "`THR` prefix is outside the ratified ID taxonomy
   (`traceability-policy.md` §1)" and needs this amendment. No format issue:
   it already follows `<PREFIX>-<NNNN>`.
2. **`SEC`-catalog usage — consistency check, no action needed.** `SEC` is
   already a ratified §1 prefix ("Security/privacy control").
   `docs/11-security-privacy-compliance/security-controls-catalog.md` mints
   `SEC-0001`–`SEC-0050` (50 entries, verified) in the ratified `<PREFIX>-
   <NNNN>` format. This is consistent, correct usage of an existing prefix —
   not a new-prefix request — recorded here only to close the consistency
   check requested during integration.
3. **`CRV`** — the source document itself (§3 of that file) calls `CRV-xxxx`
   "a proposed extension to the stable-ID taxonomy," already specifies the
   `CRV-<NNNN>` sequential 4-digit zero-padded format matching §2 of this
   policy, and reserves `CRV-0000` permanently for illustration (real vectors
   start at `CRV-0001`). Format-compatible; only the prefix itself is
   unratified.

   **Scribe update (governance-and-traceability steward, 2026-08-15) —
   per-score range allocation, namespace collision resolved.** Cycle 1's three
   rule-release precursors each self-claimed a `CRV` hundred-block; RULE-SOFA
   and RULE-NEWS2 independently claimed the **same** block (`CRV-0101–0199`
   and `CRV-0101–0189` respectively — both actually used, not just reserved,
   over the overlapping numbers), while RULE-GCS had already picked a disjoint
   block (`CRV-0200–0299`) specifically to avoid the same collision. Measured
   2026-08-15 (grep over `docs/05-clinical-safety/rule-releases/{sofa,news2,gcs}/*.md`):
   SOFA used 35 unique IDs / 67 occurrences; NEWS2 used 89 unique IDs / 116
   occurrences; GCS used 19 unique IDs / 45 occurrences (no collision). SOFA
   was mechanically renumbered — not NEWS2 — because it had materially fewer
   citations to rename across its own files and cross-references
   (`docs/archive/legacy-provenance/migration-manifest-cycle-1.md`), making it
   the less-invasive direction of the two candidates. No clinical content,
   scenario, or expected outcome changed in any vector — only the four-digit
   ID suffix (old number + 200).

   | Score | Range allocated | IDs actually in use | Vectors | Changed 2026-08-15? |
   |---|---|---|---|---|
   | RULE-NEWS2 | `CRV-0100–0199` | `CRV-0101`–`CRV-0189` | 89 | No — unchanged |
   | RULE-GCS | `CRV-0200–0299` | `CRV-0201`–`CRV-0218` | 18 | No — unchanged |
   | RULE-SOFA | `CRV-0300–0399` (moved from `CRV-0100–0199`) | `CRV-0301`–`CRV-0334` | 34 | Yes — renumbered (old ID + 200) |

   This is a namespace/ID-format resolution only (`decisions_allowed: register
   formats, ID formats` for this steward task), not a ratification of the
   `CRV` prefix itself into §1 — that remains pending `GDEC-0002` exactly as
   before. Files mechanically edited: `docs/05-clinical-safety/rule-releases/sofa/{reference-vectors,migration-notes,specification}.md`,
   `docs/05-clinical-safety/rule-releases/news2/reference-vectors.md` (note
   only, no ID changed), `docs/05-clinical-safety/rule-releases/gcs/reference-vectors.md`
   (note only, no ID changed), `docs/archive/legacy-provenance/migration-manifest-cycle-1.md`
   (SOFA-row IDs and the self-flagged collision note). No file outside these
   two directories (`docs/05-clinical-safety/rule-releases/` and
   `docs/archive/legacy-provenance/`) cited a specific `CRV-01xx`/`CRV-02xx`
   ID at the time of this update (verified: `docs/05-clinical-safety/pathway-portfolio/hard-gate-assessment.md`
   cites only `CRV-0102`, which is NEWS2's ID and was already correct —
   unchanged).

   **Nota do escriba (2026-08-15, segundo passe, pt-BR — não reescreve o texto
   acima, que permanece o registro fiel do primeiro passe).** A frase acima
   ("cites only `CRV-0102` … unchanged") descreve o estado verificado **no
   momento do primeiro passe**, quando a forma composta por regra ainda não
   existia. Desde então, `GDEC-0007` (revisão clínica do ciclo 1,
   `decision-register.md`) decidiu os 98 pontos da revisão e, com eles, a
   prefixação por regra tornou-se a forma vigente dos vetores reais (ver a
   nova subseção 3.1 abaixo). Em consequência, `hard-gate-assessment.md`
   §7.2 foi mecanicamente atualizado nesta integração de `CRV-0102` (nu)
   para `CRV-NEWS2-0102` (forma composta) — a mesma harmonização mecânica
   aplicada a `migration-manifest-cycle-1.md` (ver `§3.1` abaixo). Nenhum
   conteúdo clínico mudou; apenas a citação passou a usar a forma composta
   vigente. Este registro do primeiro passe permanece histórico e fiel ao
   que era verdade em 2026-08-15 (primeiro passe); não é mais o estado
   corrente do arquivo citado.

   **3.1 Forma composta final — prefixo por regra (2026-08-15, segundo
   passe, pt-BR — autoridade: `GDEC-0007`).**

   **Fato estabelecido a citar, não decisão deste escriba.** `GDEC-0007`
   (`docs/00-governance/registers/decision-register.md`, revisão clínica do
   ciclo 1 do orquestrador clínico, 98 pontos decididos por rodaquino-OMNI em
   2026-08-15) é a autoridade nomeada que tornou vigente a prefixação por
   regra sobre a alocação de faixas já registrada acima (item 3, primeiro
   passe). A forma **final composta**, em vigor nos arquivos de
   `rule-releases/` a partir desta data, é:

   | Score | Faixa (dígitos, inalterada desde o primeiro passe) | Forma composta vigente | Autoridade do prefixo |
   |---|---|---|---|
   | RULE-SOFA | `03NN` (`0300–0399`) | `CRV-SOFA-03NN`, p.ex. `CRV-SOFA-0301` | `GDEC-0007` |
   | RULE-NEWS2 | `01NN` (`0100–0199`) | `CRV-NEWS2-01NN`, p.ex. `CRV-NEWS2-0101` | `GDEC-0007` |
   | RULE-GCS | `02NN` (`0200–0299`) | `CRV-GCS-02NN`, p.ex. `CRV-GCS-0201` | `GDEC-0007` |

   **O que isto muda em relação ao primeiro passe (item 3 acima, mantido sem
   edição como histórico):** o primeiro passe resolveu a **colisão de
   números** entre SOFA e NEWS2 (renumeração mecânica, sufixo nu, sem
   prefixo por regra — a tabela do item 3 registra essa forma intermediária,
   nua, tal como existia entre a resolução da colisão e `GDEC-0007`). A
   revisão clínica do ciclo 1 (`GDEC-0007`) foi além: adotou a prefixação
   por regra (`CRV-SOFA-`, `CRV-NEWS2-`, `CRV-GCS-`) como a forma vigente de
   citação para vetores reais das três regras, mantendo os quatro dígitos
   já corretos do primeiro passe (nenhum dígito numérico mudou nesta
   segunda etapa — apenas o prefixo foi acrescido). **Isto continua sendo
   uma resolução de namespace/formato de ID** (`decisions_allowed: register
   formats, ID formats`), não uma ratificação do prefixo `CRV` em si no §1 —
   isso permanece pendente de `GDEC-0002`, exatamente como antes.

   **Harmonização mecânica de refs nuas → forma composta nesta integração**
   (2026-08-15, segundo passe): `docs/archive/legacy-provenance/migration-manifest-cycle-1.md`
   (~25 refs, linhas do §2.1/§2.2/§2.5 — mantendo intocado o item 4 do §4
   "Riscos de proveniência em aberto", que descreve a colisão original como
   histórico);
   `docs/12-quality-validation-and-testing/clinical-reference-vector-standard.md`
   (revisado; nenhuma ref viva encontrada — os únicos `CRV-0000`/`CRV-0001`
   citados são o placeholder genérico ilustrativo do próprio padrão, não
   apontam para nenhum vetor real de SOFA/NEWS2/GCS, e permanecem sem
   alteração, com nota própria registrada naquele arquivo);
   `docs/05-clinical-safety/pathway-portfolio/hard-gate-assessment.md` (1 ref,
   `CRV-0102` → `CRV-NEWS2-0102`, §7.2). Regra aplicada em todos os três:
   somente referências vivas (que apontam para um vetor real e atual) foram
   renomeadas; notas históricas sobre a colisão original ou sobre a faixa
   nua do primeiro passe permanecem como estão, incluindo a tabela do item 3
   acima e este próprio §3.1, que é registro de decisão, não uma referência
   a renomear.

4. **`QAS`** — the source document itself states (its own line ~50) that
   `QAS-xxxx` labels are "document-local scenario labels, not
   traceability-policy IDs," and (line ~61) that each scenario is intended to
   eventually be converted to an `NFR-xxxx` entry. **Two options are recorded
   here; neither is decided:**
   - **Option A — convert:** fold each `QAS` scenario 1:1 into a ratified
     `NFR-xxxx` entry; no new prefix is added, and the `QAS` document becomes
     a scenario-rationale annex to the `NFR` catalog.
   - **Option B — ratify:** add `QAS` as a permanent §1 prefix alongside
     `NFR`, for quality-attribute scenarios that are testable and
     architecturally significant but do not reduce cleanly to a single `NFR`
     statement.
5. **`IDP` / `IDN`** — neither follows the ratified `<PREFIX>-<NNNN>` 4-digit
   format required by §2 rule 1: `IDP` uses 2-digit, non-4-digit-padded
   numbers (`IDP-01`…`IDP-12`); `IDN` uses free-form alphanumeric suffixes
   with no fixed width. Ratifying these requires a **format** decision, not
   only a prefix-addition decision — a straight renumber into `IDP-0001`
   style may itself require re-pointing every existing cross-reference in the
   three identity-adjudication documents.
6. **`NIU`/`SM`/`HM`/`WF`/`UR`** — document-local labels, not yet assigned
   stable sequential IDs; counts were not centrally tracked at verification
   time and are not reported here to avoid implying a false precision.
   - **`VAL` note — no new prefix, but a collision flag.** The same two
     directories also use `VAL-0001`–`VAL-0043` (43 entries, verified),
     which **is** the already-ratified §1 `VAL` prefix — not a new-prefix
     issue. However, `VAL`-numbered entries independently exist under
     `docs/05-clinical-safety/pathway-portfolio/` (`hard-gate-assessment.md`,
     `candidate-inventory.md`, `portfolio-method.md`,
     `pathway-to-source-matrix.md`), minted by a different specialist. Per
     §2 rule 4 of this policy, two specialists must not mint IDs for the same
     prefix concurrently without coordinating through a shared register — no
     such central `VAL` register/catalog yet exists to serve as the single
     source of truth for the next-available number, so a numbering collision
     between these two clusters cannot currently be ruled out. The
     intended-use analyst self-flagged this in
     `docs/02-users-and-workflows/g1-validation-backlog.md`: "renumbered by
     the traceability owner before ratification. IDs here are provisional."
     This governance steward does not resolve the collision here, only
     records the flag; a `VAL` master register is a candidate mitigation for
     whoever ratifies this taxonomy to decide.

See `registers/decision-register.md` `GDEC-0002` for the pending ratification
decision that would dispose of every item in this subsection.

## 2. ID format rules

1. Format: `<PREFIX>-<NNNN>` where `NNNN` is a zero-padded, sequential,
   4-digit integer starting at `0001`, unique within its prefix
   (e.g. `SAF-0001`, `RISK-0004`, `EVID-0012`).
2. IDs are assigned in strict creation order within each prefix's register or
   canonical catalog. There is no reuse: a deleted or rejected item's ID is
   retired, never reassigned. Mark it `STATUS: REJECTED` or
   `STATUS: SUPERSEDED` instead of deleting the row.
3. IDs are immutable once assigned. If a statement changes substantially, either
   update the same ID's body (for refinements) or retire it and mint a new ID
   with `supersedes: <old-ID>` / the old entry's `superseded_by: <new-ID>`
   (see `evidence-notation.md` §5).
4. Every catalog (requirement catalog, hazard log, ADR log, test plan, register)
   is the single source of truth for its own prefix's next-available number.
   Two specialists must not mint IDs for the same prefix concurrently without
   coordinating through the register file to avoid collisions — check the
   register's current max ID before minting.
5. IDs are cited exactly, including the prefix, everywhere they are referenced
   (front matter `links:` blocks, PR descriptions, register cross-reference
   columns, Mermaid diagram labels).
6. Governance-scoped prefixes (`EVID`, `ASM`, `GDEC`, `BLK`) follow the same
   four rules as the prompt-defined taxonomy.

## 3. Bidirectional-linking policy

1. Every `PRD`, `CLR`, `SAF`, `SEC`, `NFR`, `UX`, `API`, `EVT`, `OPS` item must
   link back to at least one `OUT` or `USR` item that motivates it, unless it is
   a pure safety/regulatory floor with no upstream outcome (then link to the
   `HAZ` it controls instead).
2. Every `HAZ` must link to the `SAF`/`SEC`/`OPS` controls that mitigate it and
   to the `TST`/`VAL` evidence that demonstrates the control works.
3. Every `ADR` must link to the `NFR`/`DOM`/`RISK` decision drivers it responds
   to and to any `PRD`/`CLR`/`SAF` it constrains or enables.
4. Every `TST` must link to the `PRD`/`CLR`/`SAF`/`SEC`/`API`/`EVT`/`UX` item(s)
   it verifies. A test with no linked requirement is out of scope for release
   evidence.
5. Every `VAL` (human/external validation) must link to the `TST` or artifact it
   validates and name the validator once assigned (never a placeholder).
6. Links are bidirectional in intent: the upstream item's file should list the
   downstream IDs that trace to it, and the downstream item should cite the
   upstream ID(s). Where tooling does not yet auto-generate the reverse index,
   maintain it by hand in the item's `links:` front matter until a traceability
   generator exists (see prompt §19 — documentation/requirements/hazard/test
   traceability graph, a required diagram, not yet built as of this writing).
7. Legacy-derived material additionally links to its origin per
   `legacy-import-policy.md` §3 (`requirements_hazards_adrs` field of the
   migration-manifest template) — a retained legacy idea is never traceable only
   to its legacy source; it must also carry a V2-native ID.

## 4. PR-linking requirement

SOURCE (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:541`): "Every implementation pull
request must link the requirements, hazards, ADRs, contracts, tests, and user
evidence it changes."

Enforced as:

1. Every PR description must contain a `Traceability:` section listing every
   changed/implemented ID by prefix (e.g. `PRD-0003, SAF-0002, HAZ-0001,
   TST-0004`).
2. A PR that changes clinical logic (`CLR`), safety requirements (`SAF`), or
   security controls (`SEC`) must link the `HAZ` entries it affects, even if
   unchanged, so reviewers can assess hazard-control drift.
3. A PR that imports or transforms legacy material must link the corresponding
   migration-manifest entry (`legacy-import-policy.md`).
4. CI must fail (once CI exists — see prompt §15.1) a PR whose description has
   no `Traceability:` section or whose cited IDs do not resolve in the relevant
   catalog/register. Until that check is built, this is a manual reviewer gate
   and is itself tracked as `VALIDATION REQUIRED` (see
   `registers/blockers-register.md` for CI-related blockers if any are logged
   there in later cycles).
5. No PR may self-link a `VAL` (human validation) as satisfied by the PR author
   — this would violate the required-independence pairs in
   `decision-rights.md` §2.

## 5. Open items

- The reverse-index traceability graph (prompt §19) does not yet exist; until
  built, cross-references are maintained by hand and are therefore subject to
  drift. This is recorded as a risk — see
  `registers/risk-register.md`.
- This policy is a PROPOSAL. It requires DECIDED ratification per
  `decision-rights.md` before it binds implementation PRs.
