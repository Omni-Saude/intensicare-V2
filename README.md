# IntensiCare V2

> This README follows the evidence-labeling convention defined in
> `docs/00-governance/evidence-notation.md`: material statements are
> marked **OBSERVED** (verified directly, in this repository, as of the
> date given), **SOURCE** (drawn from the orchestrator prompt), or
> **PROPOSAL** (a recommendation, not yet ratified by any named human
> authority). Unlabeled sentences in this file are structural/navigational,
> not claims.

## What IntensiCare V2 is

**SOURCE** (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md` §1): IntensiCare V2
is a greenfield clinical decision-support platform whose mission is to
"design and implement the smallest coherent platform that safely helps
validated users recognize, prioritize, explain, and coordinate responses
to clinically relevant deterioration in the validated care setting."

**This is explicitly advisory, not autonomous or directive.** Per prompt
§3 rule 15: "Keep clinical decision authority with accountable humans.
Automation may calculate, summarize, route, and explain within approved
intended use; it may not silently expand the intended use." Every
alert, score, or recommendation IntensiCare V2 ever produces is
designed to end in "authorized human acknowledgment, escalation,
reassignment, resolution, or override" (prompt §1, the minimum candidate
safety loop) — never in an automated clinical action.

## Greenfield policy

**SOURCE** (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md` §3 rules 1–5, full
text in `docs/00-governance/legacy-import-policy.md`):

- V2 lives in a new repository with independent history, package
  namespace, secrets, environments, databases, deployment pipeline, and
  release identity.
- A prior system (`/Users/familia/intensicare/`, referred to as
  "legacy") and an external data platform
  (`Omni-Saude/amh-data-platform`, referred to as "AMH") are mounted
  **read-only**. Neither is ever modified as part of V2 work.
- **Default: do not copy** legacy or AMH code, schemas, migrations,
  infrastructure, dependencies, clinical rules, screenshots, or tests.
  An import requires a recorded license/IP decision, provenance, owner,
  current-relevance statement, security review, clinical-relevance
  review where applicable, a transformation log, and new V2 acceptance
  tests — see `docs/00-governance/legacy-import-policy.md` §3 for the
  full checklist. Nothing has been imported under this policy yet.
- V2 does not use legacy database migrations as its baseline; it starts
  with one reproducible migration history and a clean-install test
  (not yet built — no database has been chosen; see "Current status"
  below).

## Evidence discipline

**SOURCE** (`docs/00-governance/evidence-notation.md` §2): every
material statement in this repository — requirement, risk, hazard,
decision, status report, or code comment citing external authority —
must carry exactly one of six labels:

| Label | Meaning |
|---|---|
| **SOURCE** | Copied or faithfully summarized from a cited artifact. |
| **OBSERVED** | Directly verified in this repository, a pinned external repository, a test, or an environment. |
| **INFERENCE** | A reasoned conclusion, naming every SOURCE/OBSERVED item it reasons from. |
| **PROPOSAL** | A new recommendation awaiting a named human authority's decision. Not self-executing. |
| **VALIDATION REQUIRED** | The default state for anything touching clinical correctness, legal/privacy basis, security acceptance, or residual risk, until a qualified human or empirical study closes it. |
| **DECIDED** | Accepted by a named human authority, with date, rationale, and a supersession rule. **No agent may self-apply this label.** |

Full rules, the required provenance block, and the copy-paste
front-matter template are in `docs/00-governance/evidence-notation.md`.
The CI gate that enforces front-matter presence (not label correctness,
which is a human judgment) is described under "Running the docs
checks" below.

## Current status (OBSERVED, 2026-08-14)

**SPARK discovery cycle 0, pre-Gate-G0.** Per
`docs/00-governance/authority-model.md` and
`docs/00-governance/registers/blockers-register.md`: Gate G0 (authority
and access) is **NOT CLOSED**. As of 2026-08-14 all ten recorded
blockers are `OPEN`, the majority because no named human holds any of
the required `AUTH-*` decision-owner roles (product, clinical safety,
security, privacy/legal, data-platform, UX, operations, intended-use
approver — see `docs/00-governance/authority-model.md` §1). This is
stated plainly rather than implied: **this repository currently has no
named accountable human for any decision domain.** Every `owner` field
in every document under `docs/` reads `UNASSIGNED — VALIDATION
REQUIRED`, verbatim, by design — no agent may invent one.

No application technology stack has been chosen, and none may be
chosen by this task or by inference from the legacy repository (prompt
§3 rule 14). Stack, platform, and database decisions are reserved for
the ADR program (`docs/06-architecture/adrs/`, currently only a
template — see `docs/06-architecture/adrs/ADR-template.md`).

Documentation is being populated by multiple specialist contributors in
parallel under the tree below; expect directories to fill in over time
and treat any directory not yet listed as simply "not started," not as
evidence of a decision to skip it.

## Documentation map

**SOURCE** (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md` §16, "Documentation
architecture" — adapt only through an ADR):

```text
docs/
├── 00-governance/              governance conventions, registers, authority model
├── 01-vision-and-intended-use/ intended-use statement, non-intended uses, harm metrics
├── 02-users-and-workflows/     user-role and workflow hypotheses
├── 03-domain/                  glossary, conceptual model, invariants
├── 04-product-requirements/
├── 05-clinical-safety/         safety plan, hazard log, safety requirements
├── 06-architecture/
│   ├── system-context/
│   ├── containers/
│   ├── components/
│   ├── quality-attributes/
│   └── adrs/                   architecture decision records (template only so far)
├── 07-data-and-provenance/
├── 08-interoperability/
│   ├── amh-data/                AMH compatibility dossier, contract inventory
│   ├── fhir-smart/
│   ├── hl7v2/
│   ├── terminology/
│   └── conformance/
├── 09-api-events-and-mcp/
├── 10-ux-and-accessibility/
├── 11-security-privacy-compliance/
├── 12-quality-validation-and-testing/  test strategy
├── 13-operations-and-reliability/
├── 14-devsecops-and-delivery/   this document's siblings: CI policy, branch-protection request
├── 15-release-evidence/
├── 16-validation-backlog/
└── archive/
    └── legacy-provenance/
```

**OBSERVED (2026-08-14):** directories `00`, `01`, `02`, `03`, `05`,
`06` (partial — `adrs/` only), `08`, `12`, and `14` contain at least one
file. `04`, `07`, `09`, `10`, `11`, `13`, `15`, `16`, and `archive/` do
not yet exist in this repository. Re-run `find docs -mindepth 1
-maxdepth 1 -type d | sort` for the current state — this list is a
snapshot, not a standing guarantee.

## Running the docs checks

Two Python 3 standard-library-only scripts implement the only CI gates
that exist today (see `docs/14-devsecops-and-delivery/ci-policy.md` for
the full policy, including which future gates are blocked on which
ADRs):

```bash
python3 scripts/check_doc_conventions.py   # front-matter presence/shape on docs/**/*.md
python3 scripts/check_forbidden_content.py # credentials, CPF-shaped, email, PHI-canary scan
```

Both run automatically on every push and pull request via
`.github/workflows/docs-gates.yml` and are designed to be **blocking**,
never advisory (prompt §3 rule 13). Note: the workflow running is not
the same as it being *enforced* — see
`docs/14-devsecops-and-delivery/branch-protection-request.md`, status
BLOCKED pending repository-admin action.

Ownership of review paths is defined (as an inactive skeleton — every
rule is commented out pending named owners) in `.github/CODEOWNERS`.

## Como desenvolver

**OBSERVED (2026-08-16):** esta seção documenta o fluxo de desenvolvimento
local e a verificação de um comando exigida por
`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md` §15.1 item B. Todos os comandos
abaixo foram executados de verdade neste repositório na data acima.

### Pré-requisitos

- **Node.js 22 LTS** (`>=22.0.0 <23.0.0`, per `engines` em `package.json` raiz;
  PRE-01 de `docs/06-architecture/premissas-de-construcao.md`).
- **pnpm 9**, ativado via corepack:

  ```bash
  corepack enable
  corepack prepare pnpm@9.0.0 --activate
  ```

### Instalação

```bash
pnpm install
```

Instala as dependências de todo o monorepo (workspaces `packages/*` e
`apps/*`, per `pnpm-workspace.yaml`) a partir do `pnpm-lock.yaml`
committado. Em CI, o mesmo passo roda com `--frozen-lockfile` (falha se o
lockfile divergir do manifesto — ADR-0022 S1).

### Verificação em um comando

```bash
pnpm verify
```

Agrega, nesta ordem exata, tudo que precisa estar verde antes de abrir um
PR: `typecheck` → `lint` (Biome) → `check:boundaries` (fronteira de módulo,
ADR-0002) → `build` → `test` → `check:docs` → `check:forbidden`. Funciona
do zero logo após `pnpm install`, sem nenhum passo manual adicional. Cada
etapa também roda isoladamente (`pnpm typecheck`, `pnpm lint`, `pnpm
check:boundaries`, `pnpm build`, `pnpm test`, `pnpm check:docs`, `pnpm
check:forbidden`) — útil para iterar em uma etapa sem esperar as demais.

**Nota sobre `packages/persistencia` e o teste `it.fails`.** Essa suíte
contém um teste deliberadamente marcado `it.fails` (ver
`packages/persistencia/src/seguranca.test.ts`), que documenta um achado de
segurança conhecido (ACHADO-01) — ele **precisa** continuar falhando por
dentro para que o `it.fails` reporte sucesso. **OBSERVED**: rodar `pnpm
--filter @intensicare/persistencia test -- --run` isoladamente encerra com
código de saída `0` e o relatório `33 passed | 1 expected fail (34)` — o
Vitest já trata `it.fails` cujo corpo lança como um PASS, não como falha
de suíte. `pnpm test` (o agregador `pnpm -r --if-present run test --
--run` usado por `pnpm verify`) também encerra com código `0` incluindo
esse pacote — nenhum ajuste na agregação foi necessário. Se esse teste
algum dia parar de falhar por dentro (ou seja, `it.fails` passar a reportar
falha porque o achado foi corrigido), o `pnpm verify` vai ficar vermelho
de propósito — troque `it.fails` por `it` normal só quando o ACHADO-01
estiver de fato corrigido, nunca antes.

### Formatação e lint (Biome)

Uma única ferramenta — [Biome](https://biomejs.dev/), pinada em versão
exata (`@biomejs/biome` em `devDependencies` da raiz) — faz formatação e
lint. Configuração em `biome.jsonc` (formato `.jsonc` para permitir
comentário ao lado de cada regra desligada e por quê). Foco declarado é
**correção** (variáveis/imports não usados, imports organizados, promise
não tratada), não preferência de estilo:

```bash
pnpm format        # formata em modo escrita
pnpm format:check  # só verifica, não escreve (usado implicitamente por `pnpm lint`)
pnpm lint           # biome ci --error-on-warnings — o que `pnpm verify` roda
pnpm lint:fix       # aplica só fixes SEGUROS (nunca --unsafe)
```

Três regras de lint estão explicitamente **desligadas** com o motivo
documentado inline em `biome.jsonc` (`noNonNullAssertion`,
`nursery/noFloatingPromises`, `a11y/useSemanticElements`) porque a única
correção que o Biome oferece para cada uma exigiria mudar comportamento em
tempo de execução, não apenas mecânica — e este projeto nunca altera
comportamento só para satisfazer o linter. Ver os comentários em
`biome.jsonc` para o raciocínio completo de cada uma.

### Fronteira de módulo (ADR-0002)

```bash
pnpm check:boundaries
```

Executa `scripts/check_module_boundaries.mjs`, que lê os `package.json`
reais do workspace e falha (`exit 1`) se qualquer pacote declarar uma
dependência de workspace fora da direção permitida por ADR-0002 (monólito
modular, Opção A) — por exemplo, `packages/kernel-clinico` não pode
depender de nada do workspace, e `apps/web` só pode depender de
`packages/contratos`. Isso materializa como verificação automatizada a
condição C5 de ADR-0002 §5.1 ("um mecanismo de imposição de fronteira...
bloqueante de build, não consultivo").

### Rodar um pacote isolado

```bash
pnpm --filter @intensicare/kernel-clinico test        # ou build / typecheck
pnpm --filter @intensicare/api dev                     # apps/api em watch mode
pnpm --filter @intensicare/web dev                      # apps/web via Vite
```

O nome depois de `--filter` é o campo `name` do `package.json` do
pacote/app (`@intensicare/<diretório>`). Alternativamente, `cd` até o
diretório do pacote e rode `pnpm <script>` diretamente — cada
`package.json` sob `packages/*`/`apps/*` expõe `build`, `test` e
`typecheck` (e `dev`/`start` onde aplicável).

## Disclaimer

**This repository, as of 2026-08-14, makes no clinical claim, no
regulatory claim, and no compatibility claim of any kind.** Nothing
here has been validated for clinical effectiveness, cleared or approved
by any regulatory body, or demonstrated compatible with any external
data platform for actionable clinical use. Per prompt §3 rule 11: "Do
not claim clinical effectiveness, regulatory compliance, security,
availability, or AMH compatibility without corresponding evidence and
named approval." Where this repository currently states a compatibility
finding (`docs/08-interoperability/amh-data/compatibility-finding.md`),
it explicitly classifies AMH as an "integration candidate; not
currently demonstrated compatible for actionable ICU evaluation" — a
finding about the current evidence, not a rejection and not a
clearance.

## License

See `LICENSE` at the repository root.
