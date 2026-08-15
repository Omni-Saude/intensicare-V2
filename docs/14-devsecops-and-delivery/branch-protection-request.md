---
doc_id: DEVSECOPS-BRANCH-PROTECTION-REQUEST
status: OBSERVED
owner: UNASSIGNED — VALIDATION REQUIRED
source: >
  INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §15.1 (Repository foundation — "branch
  protection and required status checks"), §3 rule 13;
  .github/workflows/docs-gates.yml (this repository). RESOLUÇÃO (2026-08-15)
  acrescentada com fonte adicional: docs/00-governance/registers/g0-resolucoes-2026-08-15.md
  (DEC-G0-09); docs/00-governance/registers/evidence-register.md (EVID-0010);
  docs/00-governance/registers/blockers-register.md (BLK-0011); verificação
  direta via `gh api repos/Omni-Saude/intensicare-V2/branches/main/protection`
  nesta sessão (2026-08-15).
date_collected: 2026-08-14
collector: repository-foundation and CI-policy engineer; RESOLUÇÃO (2026-08-15) acrescentada pelo engenheiro de política de CI e conformidade documental
last_updated: 2026-08-15
---

# Branch Protection Request — `main`

## RESOLUÇÃO (2026-08-15)

> Esta seção é acrescentada **no topo** do documento para registrar que o
> estado abaixo — "BLOCKED — requires repository admin action" — deixou de
> ser o estado vigente em 2026-08-15. **O texto original (§1–§5, a partir da
> primeira linha "Status: BLOCKED") permanece integralmente abaixo, sem
> nenhuma edição de conteúdo: é registro histórico fiel da solicitação e do
> estado então vigente em 2026-08-14.** Nada foi apagado ou reescrito.

### R.1 — Estado aplicado

**SOURCE** (`docs/00-governance/registers/g0-resolucoes-2026-08-15.md`,
`DEC-G0-09`; ecoado em `docs/00-governance/registers/evidence-register.md`,
`EVID-0010`): em 2026-08-15 o titular nomeado (rodaquino-OMNI) aplicou
proteção de branch a `main` do repositório `Omni-Saude/intensicare-V2`:
checks de status obrigatórios `doc-conventions` + `forbidden-content` em
modo `strict`; `enforce_admins` ativo; histórico linear obrigatório;
force-push proibido; deleção proibida; pull request obrigatório com **0
(zero) aprovações** requeridas.

**OBSERVED** (verificação direta, somente leitura, executada nesta sessão em
2026-08-15): comando

```text
gh api repos/Omni-Saude/intensicare-V2/branches/main/protection --jq \
  '{required_status_checks: .required_status_checks.contexts, strict: .required_status_checks.strict, enforce_admins: .enforce_admins.enabled, linear: .required_linear_history.enabled, force_pushes: .allow_force_pushes.enabled, deletions: .allow_deletions.enabled, reviews: .required_pull_request_reviews.required_approving_review_count}'
```

resposta obtida (JSON de resposta da API — nenhuma credencial, token ou
segredo transcrito):

```json
{"deletions":false,"enforce_admins":true,"force_pushes":false,"linear":true,"required_status_checks":["doc-conventions","forbidden-content"],"reviews":0,"strict":true}
```

Esta resposta **confirma de forma independente**, para o slug
`Omni-Saude/intensicare-V2`, cada item do parágrafo SOURCE acima: os dois
checks exigidos em modo `strict`, `enforce_admins` ativo, histórico linear
obrigatório, force-push e deleção proibidos, e **0** aprovações requeridas.
Na prática, este estado aplicado substitui a coluna "Requested value" de §2
abaixo — mas §2 **não** foi reescrita; permanece como registro do que foi
pedido, não do que está em vigor.

### R.2 — O parâmetro de 0 aprovações: justificativa

**SOURCE** (`g0-resolucoes-2026-08-15.md`, `DEC-G0-09`): o parâmetro de
contagem de aprovações exigidas — que §2/§3 abaixo deixaram deliberadamente
em aberto (`<VALIDATION REQUIRED — no reviewer pool named yet>`) — foi
decidido pelo titular como **0 (zero)**. Justificativa registrada na fonte:
o GitHub proíbe autoaprovação de pull request, e há, no momento, **um único
revisor humano** disponível. Exigir ≥1 aprovação nessas condições criaria um
bloqueio estrutural — nenhum PR poderia jamais ser aprovado. O parâmetro
**será elevado quando houver um segundo revisor humano**; não é uma posição
permanente. **OBSERVED** (verificação desta sessão): `"reviews":0` no JSON
de R.1 confirma que o parâmetro efetivamente em vigor é 0.

### R.3 — Discrepância de slug: registrada, VALIDAÇÃO NECESSÁRIA, não resolvida aqui

**OBSERVED** (`docs/00-governance/registers/blockers-register.md`,
`BLK-0011`, nota do steward de 2026-08-15): o registro de decisão-fonte
(`g0-resolucoes-2026-08-15.md`, `DEC-G0-09`) identifica o repositório como
`Omni-Saude/intensicare-V2`, enquanto o próprio `BLK-0011` e seu campo
`who_must_act` (redigidos em 2026-08-14, antes desta resolução) usam
`rodaquino-OMNI/intensicare-V2`. Ambas as grafias são citadas textualmente
aqui, exatamente como o `BLK-0011` já faz. **Qual delas é o slug real do
repositório remoto de destino permanece VALIDAÇÃO NECESSÁRIA.** Este
documento não adjudica a discrepância — apenas a repete fielmente, para que
quem leia esta seção não precise abrir `BLK-0011` separadamente para ver as
duas grafias. A verificação de R.1 foi executada contra
`Omni-Saude/intensicare-V2` porque foi o slug fornecido ao especialista para
esta tarefa; isso não constitui, por si só, adjudicação de qual grafia é a
correta — apenas confirma que a proteção está aplicada **naquele** slug.

---

**Status: BLOCKED — requires repository admin action.** No agent may
configure branch protection: it requires `admin` rights on the GitHub
repository, which this task does not have and would not use even if it
did (`decisions_prohibited: enabling branch protection (needs repo
admin — record as blocker)`; this task's `stop_conditions` explicitly
say not to attempt `gh api` changes). **No `gh api` or GitHub UI change
was attempted while producing this document.** This document only
records the exact settings requested, so a repository admin can apply
them without having to reconstruct the reasoning.

## 1. Why this is blocking, not advisory

Per `INTENSICARE_V2_ORCHESTRATOR_PROMPT.md` §3 rule 13, safety gates —
which for this repository today means the two jobs in
`.github/workflows/docs-gates.yml` — must never be advisory in a
production release path. `main` is this repository's release path.
Until branch protection is configured, `.github/workflows/docs-gates.yml`
running and reporting a result (see `ci-policy.md` §1) is **observable
but not enforced**: nothing currently stops a human with write access
from merging a change to `main` despite a red `doc-conventions` or
`forbidden-content` check, or from pushing directly to `main` bypassing
review and CI entirely.

## 2. Exact requested settings for `main`

| Setting | Requested value | Rationale |
|---|---|---|
| Require a pull request before merging | **Enabled** | No direct pushes to `main`; matches prompt §15.1 "branch protection and required status checks" and keeps every change reviewable. |
| Require status checks to pass before merging | **Enabled**, required checks: `doc-conventions` and `forbidden-content` (the two job names defined in `.github/workflows/docs-gates.yml`, under the `Docs Gates` workflow) | These are the only two gates that exist (`ci-policy.md` §1); rule 13 requires them to be blocking, not advisory. |
| Require branches to be up to date before merging | **Enabled** | Prevents merging a PR whose checks ran against a stale base; a low-cost default that keeps the required-check guarantee meaningful. |
| Allow force pushes | **Disabled** (no force push to `main`) | Explicitly requested per this task's artifact list; preserves history integrity for the audit/traceability discipline in `docs/00-governance/traceability-policy.md`. |
| Require linear history | **Enabled** | Explicitly requested per this task's artifact list; keeps `main`'s history a single reconstructable sequence, consistent with the evidence-provenance discipline this repository already applies to documents. |

**Deliberately not requested here** (left for a separate, later
decision once the relevant role is named, so this request stays exactly
to what was asked and does not smuggle in additional policy under the
same PR): a specific required-approval count, required reviewers/
CODEOWNERS enforcement (`.github/CODEOWNERS` is currently a skeleton
with every rule commented out — see that file), signed-commit
requirements, and a deletion-protection setting for `main`. Once
`AUTH-SECURITY` and `AUTH-OPERATIONS` are named (`docs/00-governance/registers/blockers-register.md`
`BLK-0003`, `BLK-0007`), those settings should be proposed by whoever
holds those roles, not invented here.

## 3. What an admin would run (reference only — not executed by this task)

For the record, the equivalent `gh` CLI command an admin could use is
shown below. **This task did not run it.** It is included so the admin
does not have to translate the table in §2 into API fields by hand.

```text
gh api \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  /repos/<OWNER>/<REPO>/branches/main/protection \
  -f required_status_checks[strict]=true \
  -f 'required_status_checks[checks][][context]=doc-conventions' \
  -f 'required_status_checks[checks][][context]=forbidden-content' \
  -F enforce_admins=true \
  -f required_pull_request_reviews[required_approving_review_count]=<VALIDATION REQUIRED — no reviewer pool named yet> \
  -F required_linear_history=true \
  -F allow_force_pushes=false \
  -F allow_deletions=false \
  -F restrictions=null
```

`<OWNER>/<REPO>` and the approval count are deliberately left as
placeholders — this task does not know the intended GitHub org/repo
slug for the eventual push destination, and does not invent a reviewer
count that no named human has approved (per the epistemic rules this
task operates under: no fabricated handles, owners, or approvals).

## 4. Record as a Gate G0-adjacent blocker

This should be logged as a new entry in
`docs/00-governance/registers/blockers-register.md` (e.g. the next
available ID after `BLK-0010`) by whoever owns that register — that
file is outside this task's `write_scope` (limited to `README.md`,
`.github/`, `scripts/`, and `docs/14-devsecops-and-delivery/`), so this
document proposes the entry rather than writing it:

```yaml
id: BLK-0011  # PROPOSAL — next available ID as of 2026-08-14; confirm before use
title: Branch protection on main not configured (requires repository admin)
status: OPEN
what_is_blocked: >
  Enforcement of the doc-conventions and forbidden-content CI gates as
  required status checks; prevention of direct pushes and force pushes
  to main. Until closed, CI gates are observable but not enforced,
  which is inconsistent with prompt §3 rule 13's "no advisory safety
  gates" rule for anything treated as a release path.
who_must_act: Repository admin for this GitHub repository — UNASSIGNED — VALIDATION REQUIRED
unblock_request: >
  "Please apply the branch-protection settings requested in
  docs/14-devsecops-and-delivery/branch-protection-request.md §2 to the
  main branch, and confirm back with the settings actually applied
  (they may differ from the request, e.g. on required-approval count,
  which that document deliberately leaves open)."
gate: G0
links: []
```

## 5. What this document explicitly does not do

- It does not call the GitHub API, `gh` CLI, or any other mechanism to
  change repository settings.
- It does not name a repository admin, an org, or a repo slug that was
  not already given to this task.
- It does not propose a required-approval count or reviewer list.
- It does not itself write to `docs/00-governance/registers/blockers-register.md` (outside this task's write_scope) — §4 is a proposal for that register's owner to act on.
