---
doc_id: STUB-ARCHIVE-LEGACY-PROVENANCE
status: PROPOSAL
owner: UNASSIGNED — VALIDATION REQUIRED
source: INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §16; docs/00-governance/legacy-import-policy.md
date_collected: 2026-08-15
collector: delivery orchestrator
last_updated: 2026-08-15
---

# archive/legacy-provenance (empty — zero imports)

**Why empty:** the default is DO NOT COPY legacy artifacts
(`docs/00-governance/legacy-import-policy.md`). In cycle 0, **zero** legacy
artifacts were imported — legacy content was *referenced with provenance*
(assessment path:line citations) only, which requires no migration manifest.

**Populated when:** the first legacy idea/artifact is actually imported. Each
import requires a migration manifest entry (template in the legacy-import
policy: license/IP decision, provenance, transformation log, independent
reviewers, V2 acceptance tests) filed here **before** the import lands.

**Provenance caution for future importers:** the legacy assessment
`INTENSICARE_TECHNICAL_ASSESSMENT.md` is an untracked working-tree file in the
legacy repo — hash it at citation time; line numbers can drift silently.
