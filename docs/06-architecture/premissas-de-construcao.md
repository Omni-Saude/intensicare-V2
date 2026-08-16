---
doc_id: ARCH-PREMISSAS-CONSTRUCAO
status: PROPOSAL
owner: UNASSIGNED — VALIDAÇÃO NECESSÁRIA
source: >
  docs/00-governance/registers/decision-register.md GDEC-0013..GDEC-0017
  (regime de construção e delegação de decisões reversíveis ao orquestrador);
  docs/06-architecture/adrs/adr-index.md (tópicos e status dos 24 ADRs);
  instrução de tarefa SPR-G7-1 (fundações executáveis do monorepo,
  2026-08-16)
date_collected: 2026-08-16
collector: agente de fundações executáveis (SPR-G7-1, ciclo 6)
last_updated: 2026-08-16
---

# Premissas de construção — SPR-G7-1 (fundações executáveis)

**Status: PROPOSAL.** Este documento não decide nada. Ele **registra**, em
uma linha cada, as premissas de arquitetura/stack sob as quais o monorepo
pnpm de `apps/` e `packages/` foi construído nesta fatia, conforme o
regime vigente de MODO CONSTRUÇÃO.

## 1. Por que este documento existe

SOURCE (`docs/00-governance/registers/decision-register.md`, GDEC-0015):
*"o aceite formal de ADR DEIXA DE SER pré-condição de implementação: a
construção prossegue sobre a opção recomendada de cada ADR proposto ou
not-started como PREMISSA REVERSÍVEL, documentada em uma linha"*. SOURCE
(GDEC-0017): *"o orquestrador... registrando cada decisão material como
premissa reversível de uma linha"*. Este arquivo é esse registro de uma
linha por premissa, para as decisões de stack e de fronteira de módulo
tomadas para viabilizar a fatia SPR-G7-1 (fundações executáveis: monorepo,
esqueletos de pacote, CI de build/teste).

Cada premissa abaixo é **reversível**: uma decisão futura do titular (ou um
ADR formalmente aceito em sentido diferente) substitui a premissa
correspondente sem exigir justificativa adicional — o custo é o retrabalho
já assumido conscientemente pelo regime ágil (GDEC-0015 supersession_rule).
Nenhuma premissa aqui fecha gate, bloqueador, risco ou hazard, e nenhuma
constitui alegação de efetividade clínica, conformidade regulatória ou
segurança comprovada.

## 2. Premissas

PRE-01 — PREMISSA (reversível, GDEC-0015/0017): a plataforma de execução é
Node.js 22 LTS com TypeScript em modo estrito, organizada como monorepo
pnpm workspaces (pnpm 9). Não há ADR dedicado a essa escolha de runtime;
o tópico mais próximo é ADR-0022 (build, dependência, assinatura de
artefato e estratégia de software-supply-chain — `not-started`, fase mais
cedo "0 (seed)" per `adr-index.md`), cuja minuta formal fica para trabalho
futuro.

PRE-02 — PREMISSA (reversível, GDEC-0015/0017): `packages/kernel-clinico`
não tem NENHUMA dependência de runtime (`dependencies: {}`) — o núcleo
clínico é puro, testável sem I/O. Decorre da fronteira de módulo de
ADR-0002 (monólito modular — **aceita**, GDEC-0016, Opção A): manter o
núcleo de regras isolado de framework web/banco/UI é a leitura desta fatia
de "critérios de extração de serviço" aplicados internamente ao monorepo,
antes mesmo de qualquer extração.

PRE-03 — PREMISSA (reversível, GDEC-0015/0017): a persistência é da classe
PostgreSQL — `@electric-sql/pglite` (Postgres compatível via WebAssembly,
sem servidor externo) em desenvolvimento e teste; um Postgres real fica
para ambientes futuros, não decidido nesta fatia. Migrações SQL puras, RLS
por tenant e outbox transacional são responsabilidade futura de
`packages/persistencia` — nada disso está implementado ainda. Relaciona-se
a ADR-0006 (fonte de verdade operacional versus analítica — **aceita**,
GDEC-0016, Opção A: a lane operacional V2 é fonte de verdade do laço
clínico), ADR-0010 (backbone de outbox transacional — **aceita**,
GDEC-0008, Opção A) e ADR-0016 (autorização/isolamento de tenant —
`not-started`, cobre RLS).

PRE-04 — PREMISSA (reversível, GDEC-0015/0017): o backend (`apps/api`) usa
Fastify 5 com validação `zod`, seguindo um contrato de API contract-first
(OpenAPI 3.1 — minuta ainda não redigida nesta fatia). Relaciona-se a
ADR-0012 (versionamento de API, modelo de erro, idempotência, paginação,
política de compatibilidade — `not-started`).

PRE-05 — PREMISSA (reversível, GDEC-0015/0017): erros de API seguem o
envelope `application/problem+json` (RFC 9457) com campos textuais em
pt-BR, e escritas usam idempotência por cabeçalho `Idempotency-Key`.
Mesmo tópico ADR-0012 (`not-started`) de PRE-04.

PRE-06 — PREMISSA (reversível, GDEC-0015/0017): o frontend (`apps/web`) usa
React 18 + Vite + TypeScript estrito. Relaciona-se a ADR-0021 (estratégia
de frontend/BFF e de contrato gerado — `not-started`; direção aceita em
GDEC-0016 com a modificação do titular: a camada de apresentação é dona da
linguagem — melhora a comunicação e ajusta termos quando necessário sobre
os estados clínicos originados no backend, não apenas exibe o texto cru).

PRE-07 — PREMISSA (reversível, GDEC-0015/0017): WCAG 2.2 AA é requisito de
projeto do frontend, e o modelo de estado da UI tem como alvo os estados
obrigatórios do prompt §11 (nove eixos: carregamento/frescor/avaliação/
ciclo-de-vida-do-item-de-trabalho/conectividade/sessão — texto completo em
`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md` §11). Mesmo tópico ADR-0021
(`not-started`) de PRE-06. **Nesta fatia (SPR-G7-1) apenas um subconjunto
ilustrativo de UM eixo está implementado** (`apps/web/src/index.ts`,
`LoadingState`) — a cobertura completa das nove categorias e a
validação WCAG 2.2 AA ficam para fatias futuras; nenhuma capacidade
inacabada é apresentada como operacional.

PRE-08 — PREMISSA (reversível, GDEC-0015/0017): os testes usam Vitest e
`fast-check` (testes baseados em propriedade); vetores de referência
clínicos executados red/green e testes de mutação (Stryker) ficam como
**pendência registrada** — não implementados nesta fatia, e esta frase não
é um bloqueador nem um gate: é apenas a descrição honesta do que ainda não
existe. Não há tópico de ADR dedicado a estratégia de teste entre os 24 do
`adr-index.md`.

PRE-09 — PREMISSA (reversível, GDEC-0015/0017): comunicação em tempo real
usa Server-Sent Events (SSE) com cursores, quando implementada — nenhuma
fatia entregue até agora inclui essa superfície. Relaciona-se a ADR-0011
(projeções de leitura e entrega em tempo real autorizada — **aceita**,
GDEC-0008, Opção A: projeções server-side + gateway único autorizado por
push).

PRE-10 — PREMISSA (reversível, GDEC-0015/0017): esta fatia (SPR-G7-1) não
implementa NENHUMA superfície de MCP nem de IA/ML — nem em `apps/api`, nem
em `apps/web`, nem em nenhum pacote. Isso é um limite de escopo desta
fatia, não uma exclusão arquitetural permanente: a direção aceita em
GDEC-0016 é **MANTER MCP** (ADR-0014, `not-started`) e **MANTER IA/ML**
com inclusão governada e conector para agentes clínicos (ADR-0024,
`not-started`) no MVP, ambas como política ainda por redigir.

PRE-11 — PREMISSA (reversível, GDEC-0015/0017): a fronteira de módulo
inicial do monorepo é `packages/kernel-clinico`, `packages/dominio`,
`packages/persistencia`, `packages/contratos`, `packages/fixtures-sinteticas`,
`apps/api` e `apps/web`. Relaciona-se a ADR-0002 (monólito modular e
critérios de extração de serviço — **aceita**, GDEC-0016, Opção A): estes
sete módulos são a leitura desta fatia da fronteira interna ao monólito,
não uma decisão de extração de serviço.

## 3. O que este documento não faz

Não seleciona provedor de nuvem, banco de produção, broker, modelo de IA,
nem qualquer item listado como `decisions_prohibited` no escopo do programa
de ADR. Não fecha nenhum gate G0–G8. Não substitui a minuta formal de
nenhum ADR listado acima — quando uma dessas ADRs for redigida e aceita
pelo titular, sua premissa correspondente aqui é superada por aquele
aceite (GDEC-0015 supersession_rule).
