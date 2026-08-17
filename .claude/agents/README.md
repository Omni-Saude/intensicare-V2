# Corpo de especialistas — consolidação final do IntensiCare V2

Especialistas estreitos com **fronteira de domínio, escopo de escrita disjunto e
critério de aceitação explícitos**. Nenhum agente genérico — a mesma disciplina
adotada no ciclo 6 (`docs/15-release-evidence/cycle-6-construction-report.md` §10)
e exigida por `PROMPT_IMPLEMENTACAO_FINAL_INTENSICARE_V2.md` §9.

Contrato comum, obrigatório para todos: [`../CONTRATO-DE-AGENTES.md`](../CONTRATO-DE-AGENTES.md).

| Agente | Achado | Tier | Escopo de escrita exclusivo |
|---|---|---|---|
| `ic-fronteira-postgres-rls` | §6.1 P0 — banco real e isolamento de tenant | frontier | `packages/persistencia/src/postgres/**`, `session.ts`, `index.ts`, migrações `0003+`, `scripts/pg-efemero.mjs` |
| `ic-identidade-auth` | §6.2 P0 — autenticação, sessão, m2m | frontier | `apps/api/src/auth/**`, `auth.ts`, `auth.test.ts` |
| `ic-runtime-perfis` | §6.3 P1 — bootstrap e perfis de runtime | frontier | `apps/api/src/config/**` |
| `ic-regras-bundle` | §6.4 P1 — registro de regras, bundle, GCS, kill switch | frontier | `apps/api/src/regras/**`, `avaliacao.ts` |
| `ic-eventos-tempo-real` | §6.5 P1 — AsyncAPI e SSE contínuo autorizado | frontier | `packages/contratos/asyncapi.yaml`, `apps/api/src/eventos/**` |
| `ic-prontidao-observabilidade` | §6.6 P1 — liveness/readiness/startup | frontier | `apps/api/src/saude/**` |
| `ic-ux-resiliencia` | §6.7 P1 — UX, rede, E2E, acessibilidade | frontier | `apps/web/**` |
| `ic-supply-chain` | §6.8 P1 — artefato, SBOM, proveniência, promoção | frontier | `Dockerfile*`, `.github/workflows/supply-chain.yml`, `scripts/verificar-artefato.mjs` |
| `ic-reconciliador-docs` | §6.9 P2 — mapa, backlog, ADRs, READMEs | alto | `docs/14-devsecops-and-delivery/mapa-*`, `planejamento_de_sprints.md` |
| `ic-revisor-adversarial` | verificação independente P0/P1 | frontier | **nenhum** (só relatório) |
| `ic-inventario-ids` | inventário determinístico | econômico | **nenhum** (só relatório) |

## Regras de coordenação (§9 do prompt)

- Dois agentes **nunca** editam o mesmo arquivo. A fiação em arquivos
  compartilhados (`apps/api/src/{index,routes,db}.ts`,
  `packages/contratos/openapi.yaml`, `package.json` da raiz, `HANDOFF.yaml`,
  `docs/15-release-evidence/**`) é aplicada **pelo orquestrador**, a partir do
  handoff de cada especialista.
- Tier econômico **jamais** revisa conteúdo clínico ou de segurança.
- Modelo autor **não** aprova o próprio trabalho — `ic-revisor-adversarial` é
  sempre distinto do autor.
- Para P0, prefira **convergência de duas lentes independentes** a repetição.
- Síntese, priorização, arbitragem e relatório final são **indelegáveis** do
  orquestrador.
- Resultado de modelo é insumo — nunca fonte clínica, decisão humana ou
  evidência de release por si só.
