---
doc_id: FINAL-IMPLEMENTATION-REPORT
title: Relatório de consolidação técnica final — IntensiCare V2
status: OBSERVED
owner: orquestrador técnico de consolidação — síntese indelegável (prompt §9/§13)
source: >-
  PROMPT_IMPLEMENTACAO_FINAL_INTENSICARE_V2.md (encargo);
  docs/15-release-evidence/final-implementation-audit.md (matriz de delta);
  árvore de trabalho da branch codex/finalizacao-plataforma-v2 a partir de
  ecd32d555291a6ab75e6bb2c3227ad557d87a368 (main);
  execuções reais de pnpm verify, pnpm --filter … test, test:fronteira e
  test:e2e registradas neste documento;
  cinco revisões adversariais independentes sobre as fronteiras P0
date_collected: "2026-08-17"
collector: orquestrador técnico de consolidação; construção por 12 especialistas estreitos de escopo disjunto
last_updated: "2026-08-17"
---

# Relatório de consolidação técnica final

Rótulos epistêmicos conforme `docs/00-governance/evidence-notation.md`. Este
relatório **descreve**; não decide, não aprova e não encerra gate, bloqueador,
risco, hazard, ADR ou ordem de serviço.

---

## 1. Commit-base, branch e escopo

| Campo | Valor |
|---|---|
| Commit-base | `ecd32d555291a6ab75e6bb2c3227ad557d87a368` (`main`) |
| Branch de trabalho | `codex/finalizacao-plataforma-v2` |
| `main` alterada? | **Não.** Nenhum commit foi feito na `main` |
| Branches históricas | `cycle-4/*` e `cycle-5/*` **não** foram mescladas nem usadas como fonte |
| Escopo | os nove achados do §6 do encargo, mais o que cinco revisões adversariais independentes acrescentaram |

Método (§9): doze especialistas estreitos com fronteira de domínio, escopo de
escrita **disjunto** e critério de aceitação explícitos; nenhum agente genérico.
Definições em `.claude/agents/`, contrato comum vinculante em
`.claude/CONTRATO-DE-AGENTES.md`. Nenhum arquivo teve dois autores: a fiação em
arquivos compartilhados foi aplicada por um único integrador e revisada pelo
orquestrador. Síntese, priorização, arbitragem e este relatório permaneceram
indelegáveis.

---

## 2. Resumo executivo factual

Os nove achados do §6 foram **revalidados por reprodução no commit-base** antes
de qualquer edição — nenhum foi transferido como fato herdado. Todos os nove
foram confirmados; **nenhum** resultou `RESOLVIDO` ou `NÃO APLICÁVEL` de saída.

O resultado mensurável:

| Métrica | Baseline (`ecd32d5`) | Agora | Δ |
|---|---|---|---|
| `pnpm verify` | exit 0 | **exit 0** | preservado |
| Testes verdes | 1.026 | **1.457** | +431 |
| `expected fail` | **1 (P0)** | **0** | eliminado |
| Testes pulados | 0 | **0** | preservado |
| Suíte contra PostgreSQL real | inexistente | **44 testes bloqueantes** | nova |
| Verificações de contrato | 0 (sem gate) | **148** | nova |
| E2E de navegador autenticado | inexistente | **22/22 verdes** (4 execuções observadas) | nova |

O ganho que mais importa não é a contagem. É que a **fronteira de isolamento de
tenant deixou de ser assegurada por um simulador embarcado** e passou a ser
exercitada contra PostgreSQL 16.14 real, e que a falha P0 que vivia como
`expected fail` dentro de um gate verde foi **eliminada**, não renomeada.

**Cinco** revisões adversariais independentes foram conduzidas por agentes que
não escreveram o código, e a taxa de achado **não convergiu**:

| Rodada | Veredito | Achados | Corrigidos | Registrados |
|---|---|---|---|---|
| 1ª | **`REFUTADO`** | 8 (3 P1) | 7 | 1 (aceito como imprecisão) |
| 2ª — sobre as correções | **`CONFIRMADO_COM_RESSALVAS`** | 6 (P2/P3) | 6 | 0 |
| 3ª — sobre as correções da 2ª | **`REFUTADO`** | 9 (2 P1) | 8 | 1 |
| 4ª — sobre as correções da 3ª | **`REFUTADO`** | 12 (P2/P3) | 9 | 3 |
| 5ª — sobre as correções da 4ª | **`REFUTADO`** | 12 (**5 P1**) | em correção | — |

Somam-se **dois** defeitos achados fora das revisões: um por execução de
navegador real e um pelo orquestrador ao validar as migrações contra PostgreSQL
real. **Total: 49 achados**, sete deles P1 com leitura e escrita cross-tenant
reproduzidas contra banco real.

A quinta rodada também apanhou **um erro do orquestrador**: a justificativa de
que `nextval` atribui id de transação — repassada por ele a um especialista e
gravada na migração `0004` como fato medido — é **falsa** contra PostgreSQL
16.14, porque sequência é não-transacional. Foi relatada sem verificação.

Uma versão anterior deste parágrafo dizia "ao todo nove cláusulas caíram" e
"todos foram corrigidos". As duas afirmações eram falsas contra a própria tabela
acima — "nove" era o total da **primeira** rodada apresentado como agregado, e
dois achados permanecem **registrados, não corrigidos**. Corrigido após a quarta
revisão, que apanhou exatamente isso.

A leitura honesta do conjunto é a inversa da tranquilizadora: **cinco rodadas
não bastaram para convergir**, e a quinta reabriu uma classe que a quarta
declarava fechada — o pivô de tenant dentro da transação em voo, agora por view
auto-atualizável sobre a âncora. Nenhuma delas substitui o verificador terceiro
independente que `DEC-G0-02` exige, e o padrão observado é que ele **encontrará
mais**. Contar rodadas não é medir robustez.

**Nada nesta entrega altera o estado factual duro.** Continuam valendo: **0 vias
clínicas acionáveis**; matriz **47/47 inelegíveis**; `Observation` da AMH **não
consumível**; compatibilidade AMH apenas **candidato a integração**; safety case
em **M0**; **nenhum dado real acessado**. Nenhum gate foi aprovado, nenhum
`MG-*` satisfeito, nenhuma via promovida a acionável.

---

## 3. Pontos fortes preservados

Verificados por **execução** nesta rodada:

- kernel NEWS2 determinístico, sem relógio interno e sem dependência de runtime;
- 93 vetores `CRV-NEWS2-0101..0193` executados red/green;
- **os seis pacotes de conteúdo clínico estão byte-idênticos ao commit-base**,
  confirmado por revisão adversarial: nenhum vetor, limiar, banda ou janela pôde
  ter mudado;
- segunda regra GCS com gate de sedação fail-closed;
- outbox transacional, auditoria append-only, concorrência otimista;
- idempotência por hash do corpo com conflito explícito em replay divergente;
- `problem+json` sem eco do identificador do sujeito;
- rótulo permanente de limitação institucional/sintética na UX (`HAZ-0046`).

Verificados por **inspeção estrutural**, não por execução. A distinção importa e
uma versão anterior desta seção a apagava, listando os três itens abaixo sob o
rótulo "verificados por execução" — corrigido após auditoria de honestidade:

- CI sem `continue-on-error`, sem `if:` de escape, actions pinadas por SHA de 40
  caracteres: zero ocorrências nos quatro workflows. **Ler YAML não é executar**;
- a mutação de 93,07% do kernel **não foi reexecutada** nesta rodada
  (`packages/kernel-clinico/reports/mutation/` data de 2026-08-16, anterior ao
  primeiro commit desta branch). Ela sobrevive pelo argumento de
  **byte-identidade** dos seis pacotes clínicos, que foi confirmado — não por
  medição nova;
- a **entrada única** por `pnpm verify` deixou de valer nesta rodada:
  `ci-plataforma.yml` ganhou um segundo job (`e2e-navegador`), e `pnpm verify`
  não cobre `test:fronteira`, `test:e2e` nem `check:supply-chain`. A troca é
  deliberada e está justificada em §6, mas registrá-la como ponto forte
  *preservado* seria falso.

---

## 4. Matriz final de achados e disposição

Detalhe completo, com os dez campos obrigatórios por achado, em
`docs/15-release-evidence/final-implementation-audit.md`.

| ID | Achado | Sev. | Disposição |
|---|---|---|---|
| ACH-01 | Rebaixamento de papel em PGlite não é fronteira de segurança | P0 | **RESOLVIDO com limite** — ver §7 |
| ACH-02 | Autenticação stub; tenant vindo do próprio token | P0 | **PARCIAL / BLOQUEADO** — porta e adaptador entregues; IdP real bloqueado |
| ACH-03 | Default de runtime cria PGlite e semeia fixtures | P1 | **RESOLVIDO** |
| ACH-04 | Kernel, GCS, bundle, kill switch fora da rota real | P1 | **PARCIAL** — GCS sem artefato de bundle |
| ACH-05 | Sem AsyncAPI; SSE era replay finito | P1 | **RESOLVIDO com limite** |
| ACH-06 | `/health` sempre `ok`; prontidão não ligada | P1 | **RESOLVIDO com consequência** — ver §9 |
| ACH-07 | Promise sem tratamento; sem E2E nem WCAG automatizado | P1 | **PARCIAL** — validação assistiva permanece humana |
| ACH-08 | Sem artefato, SBOM, proveniência, promoção | P1 | **PARCIAL / BLOQUEADO** — mecânica pronta; provisionamento humano |
| ACH-09 | Mapa, backlog e READMEs divergentes | P2 | **RESOLVIDO** |

### 4.1 Achados das revisões adversariais

Primeira rodada — veredito **`REFUTADO`**, oito achados:

| # | Achado | Sev. | Disposição |
|---|---|---|---|
| 1 | Escopo de tenant regravável pela própria aplicação: dentro de `comTenant("A")`, um `set_config('app.tenant_id','B',true)` reescopava a transação. Leitura **e escrita** cross-tenant reproduzidas | P1 | **CORRIGIDO** — `0004_escopo_selado.sql` |
| 2 | `abrir()` só recusava papéis `SUPERUSER`/`BYPASSRLS`; o papel **dono** das tabelas não é nenhum dos dois, e o dono desliga a RLS | P1 | **CORRIGIDO** — `0003` e `pool.ts` |
| 3 | Contenção de perfil sintético contornável por `options.autenticacao` | P1 | **CORRIGIDO** — `exigirCoerenciaDePerfil` |
| 4 | `pnpm verify` verde não provava a fronteira P0 (suíte se pulava sem PostgreSQL) | P2 | **CORRIGIDO** — `services: postgres` em `ci-plataforma.yml` |
| 5 | Asserções de ausência cross-tenant em SSE paravam por silêncio temporal | P2 | **CORRIGIDO** — ancoradas no quadro de controle |
| 6 | "bundle recusado fail-closed" impreciso: em perfil sintético o NEWS2 **é** despachado em sombra, e o rótulo não viaja no corpo | P2 | **ACEITO como imprecisão** — ver §8 |
| 7 | Poda de `check_forbidden_content.py` por nome livre em qualquer profundidade | P3 | **CORRIGIDO** — ancorada por caminho |
| 8 | Declaração de bloqueio desatualizada em spec de E2E | P3 | **CORRIGIDO** |

Um nono defeito foi encontrado **por execução de navegador real**, não por
revisão de código: `POST /v1/dev/sessao` respondia **HTTP 500** porque a emissão
de token sintético re-derivava o perfil do ambiente a cada requisição, por uma
função que nunca lê `PERFIL`. **`pnpm verify` estava verde com o defeito
presente**, porque o vitest define `NODE_ENV=test` e satisfaz a guarda por um
caminho que o processo real não tem. Corrigido na raiz: a autorização de emitir
passou a ser resolvida **uma vez na construção** e carregada por fechamento
léxico. Registrado aqui porque é o exemplo mais nítido do que o §12 do encargo
chama de verde falso — e nenhum gate o pegaria.

### 4.2 Segunda revisão adversarial — sobre as correções

Veredito **`CONFIRMADO_COM_RESSALVAS`**, contra PostgreSQL 16.14 efêmero real,
com ataques próprios via `psql`.

**As três cláusulas P1 não reabriram.** O revisor tentou e falhou em: reescrever
`app.tenant_id` após `instalar`; `instalar('B')` direto após `instalar('A')`;
subtransação implícita por `DO $$ ... EXCEPTION ... $$`; `SET ROLE` para o
migrador; autocommit; `COPY ... TO STDOUT`; cursor `WITH HOLD` atravessando o
`COMMIT`; `PREPARE`/`EXECUTE` com sete execuções para forçar plano genérico
(`tenant_atual()` sendo `STABLE` é reavaliada por execução, não congelada no
plano); e sequestro de `search_path` — `create schema` negado e **`create temp
table` negado**, então `pg_temp` não é plantável. A cadeia indireta
`app → intermediário → migrador` **é** detectada, e reaplicar a `0003` depois
da `0004` não rebaixa políticas.

Seis achados novos, **todos P2/P3, nenhum P0 ou P1**:

| # | Achado | Sev. | Estado |
|---|---|---|---|
| 1 | O selo **não** é write-once: `ROLLBACK TO SAVEPOINT` o desfaz e permite reinstalar. **Não alcançável pela superfície do app** — `comTenant` instala antes de `fn`, e quem consegue um savepoint anterior consegue igualmente `COMMIT; BEGIN;`, limite já declarado. O que falha é a **alegação**, não o controle | P2 | **CORRIGIDO** (ver §7) |
| 2 | O invariante de papel/isolamento filtra `relkind in ('r','p')` e ignora MATERIALIZED VIEW, VIEW e FOREIGN TABLE. Nenhum objeto desses existe hoje, mas uma matview futura atravessaria as duas guardas em silêncio | P2 | **CORRIGIDO** (ver §7) |
| 3 | A âncora de não-vacuidade fora aplicada a 2 de 3 sítios: `seguranca.test.ts` mantinha nove asserções de ausência que passariam sobre texto vazio | P2 | **CORRIGIDO** |
| 4 | Cinco critérios WCAG declarados `executado` por uma suíte que **nenhum gate executava** — a declaração validando a si mesma | P2 | **CORRIGIDO** — job `e2e-navegador` bloqueante |
| 5 | Asserção tautológica: verificava que um literal local não continha uma string, sem medir nada do servidor | P3 | **CORRIGIDO** — agora assere sobre o fluxo real |
| 6 | Texto `BLOQUEADO` desatualizado citando o HTTP 500 já corrigido, servindo de razão a `test.skip` | P3 | **CORRIGIDO** |

Registrado sem desconto: o revisor relatou **uma** execução de `pnpm verify` com
exit 1 (Biome, `useLiteralKeys` como erro) que **não reproduziu** em cinco
execuções seguintes. Tentei reproduzi-la e também não consegui: `pnpm lint`
devolve `6 infos`, exit 0, de forma estável em execuções repetidas. A hipótese
mais plausível é que a execução tenha apanhado a árvore no meio de edição
concorrente. Fica como observação aberta, não como achado fechado.

### 4.3 Terceira revisão adversarial — veredito `REFUTADO`

Pedida pelo titular justamente porque a taxa de achado não havia caído. Foi a
decisão certa: a terceira rodada achou **mais** que a segunda.

| # | Achado | Sev. | Estado |
|---|---|---|---|
| 1 | Tabela **PARTICIONADA** em `public` escapa da auditoria de isolamento: a correção da 2ª rodada alargou só os *contadores* de propriedade para `('r','p','m','v','f')`; os dois laços de política e a auditoria seguiam em `relkind = 'r'`. Leitura **e escrita** cross-tenant reproduzidas com as duas migrações em exit 0 | **P1** | **CORRIGIDO** |
| 2 | O selo é forjável por **privilégio de COLUNA**: `has_table_privilege` responde só sobre tabela, então `GRANT UPDATE (tenant_id)` é invisível ao detector, o pool abre e a aplicação reescreve o selo | **P1** | **CORRIGIDO** |
| 3 | O marcador anti-savepoint é **zerável** por `DISCARD SEQUENCES` — irrestrito, session-local e permitido dentro de transação. O caminho de exceção era **fail-open** | P2 | **CORRIGIDO** |
| 4 | `pool.ts` não verificava a sequência da âncora que a `0004` declara essencial | P2 | **CORRIGIDO por remoção** da sequência |
| 5 | A âncora de fim de catch-up do SSE dispara no quadro de **início** (`replaying`, emitido antes de `#bombear()`), não no de fim (`online`) — as asserções de ausência voltavam a ser vácuas | P2 | **CORRIGIDO** |
| 6 | `.rejects.toThrow()` sem tipo: "negado por privilégio" e "objeto não existe" são o mesmo verde, sobre 18 caminhos de escalada | P2 | Registrado |
| 7 | Emissor sintético alcançável por vocabulário de perfil paralelo que não passa por `exigirCoerenciaDePerfil` (não alcançável pela composição atual) | P3 | Registrado |
| 8 | Verdes falsos residuais fora dos alvos: laços sem guarda de não-vacuidade em `index.test.ts`, `resiliencia-rede.spec.ts`, `gcs.unidade.test.ts`, `semantic-checks.test.ts` | P2/P3 | Registrado |
| 9 | A árvore mutou durante a revisão — nenhuma alegação "verde" deste ciclo é atribuível a um estado único | P3 | Registrado |

Mais um **décimo defeito, encontrado pelo orquestrador** ao validar as migrações
contra PostgreSQL real: `0003` **abortava** no caminho de atualização, porque o
laço de propriedade chamava `alter sequence … owner to` sobre sequência *owned*,
o que o PostgreSQL recusa incondicionalmente.

**A investigação desse último é o achado mais instrutivo da rodada.** O teste
que deveria tê-lo pego passava **por sorte**: `alter sequence … owner to <dono
atual>` é no-op e não ergue erro, então o erro só aparece se a sequência for
visitada **antes** da sua tabela — e o laço não tinha `ORDER BY`, dependendo da
ordem de varredura de `pg_class`. A correção foi dupla: excluir sequências
*owned* (a causa real) **e fixar a ordem adversa**, para que uma regressão falhe
sempre em vez de às vezes.

Duas decisões de desenho desta rodada merecem registro, porque removem
superfície em vez de acrescentar verificação:

- a âncora anti-savepoint deixou de ser uma sequência (zerável) e passou a ser a
  **atribuição do id de transação**, medida como imune a `ROLLBACK TO SAVEPOINT`
  **e** a `DISCARD SEQUENCES`. A sequência foi **removida**, o que dissolve o
  achado 4 em vez de remendá-lo;
- a auditoria de isolamento passou a **reprovar tabela sem política nenhuma**.
  Antes ela partia de `pg_policy` e, portanto, passava por vacuidade sobre
  exatamente o objeto mais perigoso: o que não tem política alguma.

---

## 5. Mudanças por componente

| Componente | O que mudou | IDs |
|---|---|---|
| `packages/persistencia` | Adaptador PostgreSQL real atrás de porta; migração `0003` (papel dono separado, `nullif` nas 13 políticas, bloco que aborta se o invariante cair); migração `0004` (escopo em tabela selada, funções `SECURITY DEFINER`, write-once por transação); pool que recusa identidade privilegiada e higieniza conexão | `ADR-0016`, `THR-0050`, `SEC-0009`, `SAF-0008`, `MG-G6` |
| `apps/api/src/auth/**` | Porta única; verificador JWS; adaptador OIDC/JWKS fail-closed; adaptador sintético contido por perfil; servidor OIDC de teste em loopback | `ADR-0015`, `ADR-0016` |
| `apps/api/src/config/**` | Seis perfis; `PERFIL` obrigatório sem default; configuração tipada validada antes de escutar a porta; política de migração com lock, timeout e rollback | `ADR-0006`, `ADR-0019`, `ADR-0020` |
| `apps/api/src/regras/**` | Registro/despachante versionado sobre bundle verificado; kill switch; rollback por `behaviorHash`; adaptador GCS | `ADR-0007`, `ADR-0008`, `ADR-0025`–`ADR-0029`, `HAZ-0005` |
| `apps/api/src/eventos/**`, `packages/contratos/asyncapi.yaml` | AsyncAPI 3.0.0; gateway SSE contínuo com pulsação, cursor, fila limitada, retomada, ticket de uso único e autorização por evento | `ADR-0010`, `ADR-0011`, `ADR-0012` |
| `apps/api/src/saude/**` | `/v1/livez`, `/v1/readyz`, `/v1/startupz`; avaliador de prontidão e telemetria com consumidor real | `ADR-0020`, `SAF-0026`, `SEC-0015` |
| `apps/web/**` | Tratamento final de rejeição; `AbortController` real; estados do §11; token e mock fora do bundle de produção com guarda que reprova o build; E2E e WCAG automatizado | `ADR-0021`, `ADR-0029`, `HAZ-0046`, `PRE-07` |
| `Dockerfile*`, `.github/workflows/supply-chain.yml`, `scripts/` | Artefatos não-root; SBOM CycloneDX determinístico; verificador com 33 casos de autoteste; promoção que recusa tag e exige digest | `ADR-0019`, `ADR-0022`, `THR-0050`–`THR-0055` |
| `docs/14-devsecops-and-delivery/**`, `adr-index.md`, READMEs | Estado por gate reconciliado entre Markdown, YAML e Mermaid, por emenda datada | `GDEC-0013`–`GDEC-0017` |

---

## 6. Testes executados

`pnpm verify` em árvore normal, **exit 0**, com PostgreSQL 16.14 local
disponível:

| Pacote | Testes |
|---|---|
| `apps/api` | 326 |
| `packages/kernel-clinico` | 305 |
| `packages/rule-bundle` | 302 |
| `apps/web` | 182 |
| `packages/vigilancia` | 77 |
| `packages/persistencia` | 79 |
| `packages/conformidade` | 62 |
| `packages/observabilidade` | 55 |
| `packages/contratos` | 38 |
| `packages/dominio` | 18 |
| `packages/fixtures-sinteticas` | 13 |
| **Total** | **1.457 verdes · 0 falhas · 0 pulados · 0 `expected fail`** |

A suíte de fronteira **não soma** ao total acima — ela é subconjunto dos 79 já
contados para `packages/persistencia`. Executada isoladamente em modo
bloqueante, `pnpm --filter @intensicare/persistencia test:fronteira` →
**44 verdes** contra PostgreSQL 16.14 efêmero real;
`node scripts/check_contratos.mjs` → **148 verificações**;
`python3 scripts/check_doc_conventions.py` → 249 arquivos, sem violação;
`python3 scripts/check_forbidden_content.py` → 590 arquivos, sem achado.

**Checkout limpo e hermético** (§12): clone fresco da branch em diretório
separado, `pnpm install --frozen-lockfile` seguido de `pnpm verify` →
**exit 0, os mesmos 1.457 testes em 11 pacotes, zero falhas e zero pulados**. O
verde não depende de árvore aquecida — a armadilha que o ciclo 6 documentou
(typecheck antes de build, verde local por acidente) não voltou.

**Qualificação obrigatória da contagem** (achado 4 da primeira revisão): o
número 1.457 vale para uma máquina **com PostgreSQL disponível**. Sem ele, a
suíte de fronteira se pula com aviso ruidoso em desenvolvimento e **falha** sob
`CI=true` ou `IC_FRONTEIRA_PG=obrigatoria`. Para que "verify verde" passe a
significar "fronteira P0 exercitada", `ci-plataforma.yml` recebeu
`services: postgres` pinado por digest e `IC_FRONTEIRA_PG=obrigatoria`.
`test:fronteira` **não** foi embutido em `pnpm verify` na raiz: isso quebraria
a máquina de quem não tem PostgreSQL instalado, trocando um problema de
cobertura de CI por um de ergonomia local.

**E2E de navegador autenticado**: `pnpm test:e2e` → **22/22 verdes**, 0 falhas,
0 pulados, em execuções consecutivas de ~18 s. Inclui axe WCAG 2.2 AA sem
violação em quatro telas com `color-contrast` ligado, navegação por teclado com
indicador de foco por elemento, alvos ≥24 px, reflow a 320 CSS px e
`prefers-reduced-motion` com emulação provada.

Três desses cenários chegaram a falhar quando a autenticação passou a
funcionar. Investigados um a um, **nenhum era defeito do produto**:

- O caso rotulado como potencial falha de segurança — "alguma chamada sai sem
  `Authorization`" — foi descartado por **inventário de rede** de uma execução
  real: existem exatamente duas requisições a `/v1/`, e a única sem cabeçalho é
  `POST /v1/dev/sessao`, o endpoint que **emite** o bearer e portanto não pode
  portá-lo. Nenhuma requisição anônima de dado sai do frontend, e nenhum
  identificador de sessão viaja em query string.
- Dois casos tinham a mesma causa-raiz, e era do **observador**, não do
  produto: a leitura do estado da tela fazia duas chamadas ao navegador
  (`count()` e depois `getAttribute()`), correndo contra o re-render do React.
  Na transição para `pronto` o bloco de estado deixa de existir, e
  `getAttribute` **bloqueia** esperando um elemento que nunca mais voltará —
  o teste acusava o produto por um defeito próprio, com janela dependente de
  carga da máquina. Corrigido tornando a leitura atômica num único
  `page.evaluate`; o tempo de suíte caiu de ~40 s para ~18 s justamente por
  eliminar esperas espúrias.
- O terceiro pressupunha uma pré-condição que não vale: a API devolve
  `alerta: null` em todos os leitos, porque sem bundle de regra assinado
  nenhuma avaliação é computada — coerente com `/v1/readyz` em 503. Não havia
  comando na tela para verificar bloqueio, e a guarda anti-falso-verde do
  próprio teste recusou passar vazia, corretamente.

### 6.1 Não executado, não executável e bloqueado

- **Validação com usuários de tecnologias assistivas**: `NÃO EXECUTADA`,
  dependência humana (`MG-G4`). Automação WCAG não a substitui, e o job
  bloqueante acrescentado ao CI **não** muda isso. Precisão devida, porque a
  frase anterior era falsa contra o dado: dos cinco critérios marcados
  `manual_obrigatorio`, quatro estão com `execucao: "executado"` na matriz — o
  campo registra que a **cobertura automatizada** rodou, não que a validação
  manual ocorreu. O campo conflaciona as duas coisas, e essa é uma limitação da
  matriz que fica registrada aqui.
- **WCAG 2.4.11 (foco não obscurecido)**: `NÃO EXECUTADO` — sem teste dedicado.
- **Bloqueio de comandos em offline contra alerta vindo da API**: verificado
  contra alerta fornecido por rota, porque a API não produz alerta sem bundle
  de regra assinado. Reexecutar sem a rota quando houver bundle.
- **`supply-chain.yml`**: **executou** no PR #5 — a afirmação anterior de que
  "nunca executou" valia quando foi escrita e ficou obsoleta ao abrir o PR. Na
  primeira execução real, `artefato-web` **reprovou** no passo Trivy com 10 CVE
  HIGH na base Alpine 3.23.4; corrigido por repin de base por digest, sem tocar
  no limiar. Detalhe em
  `docs/14-devsecops-and-delivery/politica-de-supply-chain.md`. O que **não**
  executou continua sendo assinatura, proveniência e promoção — abaixo.
- **Assinatura, proveniência e promoção de artefato**: `NÃO EXECUTADAS`.
  Dependem de registry, chave sob custódia e OIDC de CI — provisionamento humano.
- **AsyncAPI contra o JSON Schema oficial 3.0**: não validado. A verificação é
  estrutural e de coerência com o catálogo. **Nenhuma alegação de "AsyncAPI
  oficialmente validado" é feita.**
- **`PortaMigracao`** (lock consultivo e tabela durável de versão de schema):
  política escrita e testada contra duplo em memória; **sem implementação real**
  contra banco. Migrações concorrentes sobre banco compartilhado não estão
  serializadas.
- **TLS na conexão de banco**: o cliente de protocolo não negocia TLS. Em rede
  não confiável isto é obrigatório e **não está coberto**.
- **Custo de latência do selo de escopo**: não medido.

---

## 7. Evidência de segurança e tenant, e seus limites

**O que passou a ser exercitado** (`OBSERVED`, execução contra PostgreSQL
16.14 real):

- a identidade da aplicação **não recupera superusuário** por nenhum dos 22
  caminhos SQL testados (`SET SESSION AUTHORIZATION`, `SET ROLE`, `ALTER ROLE`,
  `GRANT`, DDL de política, `SECURITY DEFINER`, `COPY … TO PROGRAM`, `pg_read_file`…);
- sem escopo instalado, **nenhuma das 13 tabelas** devolve linha;
- tenant A não lê nem escreve linha de B, **inclusive sob SQL arbitrário em voo**;
- conexão devolvida ao pool e reusada **não** carrega o tenant anterior;
- IDOR **sem oráculo de enumeração** em 11 tabelas;
- migrações em instalação limpa **e** em atualização;
- o pool e a migração `0003` recusam papel de aplicação que alcance **qualquer**
  papel dono de tabela, não apenas `SUPERUSER`/`BYPASSRLS`.

**Um defeito inédito, invisível no simulador.** Contra PostgreSQL real,
`current_setting('app.tenant_id', true)` devolve `NULL` num parâmetro nunca
definido, mas devolve **cadeia vazia** depois de `DISCARD ALL` — que é o que o
pool faz ao reciclar conexão. Sob a política original, uma conexão reciclada
avaliava `tenant_id = ''`, tornando o fail-closed dependente do **conteúdo da
linha** em vez da ausência de escopo. PGlite nunca revelaria isso: conexão
única, nunca reciclada.

**Um fato estrutural que forçou o redesenho.** No PostgreSQL, um parâmetro
personalizado (`app.*`) é `PGC_USERSET` e **não tem ACL** — `GRANT SET ON
PARAMETER` só alcança parâmetros que exigem superusuário. **Não existe `REVOKE`
possível** sobre `set_config('app.tenant_id', ...)`. Logo nenhum esquema
ancorado em parâmetro de sessão pode ser tornado imutável, e a âncora teve de
sair do espaço de parâmetros: `0004_escopo_selado.sql` a move para uma tabela
do papel migrador, sobre a qual a aplicação não tem privilégio algum, acessada
por funções `SECURITY DEFINER` com `search_path` fixo e chave
`(pid, id da transação)`.

**Limites que permanecem, declarados:**

1. **Isto não é "RLS verificada".** Verificação exige verificador terceiro
   independente (`DEC-G0-02`) e aceite humano nominal (`MG-G6`). Os **32** P0 do
   threat model seguem `OPEN` (27 do corpo original mais 5 acrescentados;
   o modelo declara 83 ameaças, todas `OPEN`). Teste escrito por agente não é a independência
   que `SEC-0009`/`SAF-0037` exigem — e esta rodada mostra por quê: **cinco
   revisões adversariais independentes produziram 47 achados, sete deles P1**,
   e a quinta ainda reproduziu leitura cross-tenant e forja do selo pela API do
   próprio produto.
2. **Troca de tenant entre transações distintas na mesma conexão continua
   possível** e **não é fechável pelo banco**: é assim que um pool multi-tenant
   funciona. Escolher o tenant ao **abrir** é matéria de identidade autenticada
   (`SEC-0001`/`THR-0001`), que depende do IdP real — hoje ausente. Está
   coberto por um teste que o documenta como **limite**, não como controle.
3. **Integração com IdP real: `BLOQUEADO`.** O adaptador OIDC só foi verificado
   contra servidor de teste local. O bloqueio anterior a todos é que o papel
   `AUTH-SECURITY` está **UNASSIGNED** (`BLK-0003`): não há a quem endereçar o
   pedido.
4. **Janela de chave retirada**: dentro do TTL do cache de JWKS, uma chave
   revogada pelo emissor continua aceita. Comportamento de qualquer cliente com
   cache; registrado em teste para deixar a janela visível, não para declará-la
   aceitável.
5. **PGlite embarca PostgreSQL 18.3; o alvo testado é 16.14.** O simulador e o
   alvo não são o mesmo motor — razão adicional para não generalizar do
   primeiro.

---

## 8. Evidência clínica e seus limites

**Nenhuma semântica clínica foi alterada.** Confirmado por revisão adversarial
independente: `kernel-clinico`, `rule-bundle`, `dominio`, `fixtures-sinteticas`,
`conformidade` e `vigilancia` estão **byte-idênticos ao commit-base**. Nenhum
vetor, limiar, janela, banda ou texto normativo pôde ter mudado.

O que mudou é **como a regra é alcançada**: registro/despachante versionado
sobre bundle verificado, com hash de comportamento, assinatura, separação
autor≠aprovador, ativação, rollback e kill switch no caminho. Provado por teste:
regra não registrada produz erro explícito e nunca NEWS2 por default; assinatura
adulterada e chave desconhecida recusam fail-closed; kill switch recusa com
razão visível; rollback é comprovado por `behaviorHash`; NEWS2 e GCS coexistem
sem contaminação de campos.

**Imprecisão registrada, não corrigida** (achado 6 da primeira revisão): dizer
"o bundle do NEWS2 é recusado fail-closed" é impreciso. Em perfil sintético o
NEWS2 **é** despachado, em modo **sombra**; o que é recusado é a
**acionabilidade**. E o rótulo de sombra vive no registro imutável do despacho,
**não no corpo** de `GET /v1/pacientes/{ref}/avaliacoes`. Fazer o rótulo viajar
no `ResultadoAvaliacao` é mudança de contrato com consequência clínica — é ato
de autoridade clínica, não de engenharia. Registrado como pendência; o banner
consultivo incondicional do frontend permanece a mitigação.

**GCS integrado, mas não despachável.** O adaptador existe com estados, razões
de NT, sedação e temporalidade. Falta o **artefato de bundle**: `rule-bundle`
não constrói manifesto para o GCS, e montá-lo exigiria redigir uso pretendido,
evidência, responsabilidade e estado de validação — conteúdo normativo clínico.
A regra recusa com `bundle_ausente`, que é o comportamento correto.

**SOFA não foi implementada**, por instrução expressa do §6.4: nova regra amplia
superfície clínica sem aproximar gate enquanto dado e validação externa faltarem.

### 8.1 Fila de ratificação clínica aberta nesta rodada

Nenhuma foi decidida por agente. Cada uma traz fonte A, fonte B, impacto e
autoridade:

| # | Item | Autoridade |
|---|---|---|
| R1 | `sedativeExposure` é obrigatório no kernel do GCS, mas ausente de `ContextoAvaliacaoPaciente` do contrato — sem RASS pareado, todo GCS resolve `sedation_state_unknown` | titular clínico + dono de contratos |
| R2 | Vínculo terminológico dos componentes GCS e do RASS: identificadores internos `SYNTH-CONCEPT-*` foram cunhados; qualquer vínculo a LOINC/SNOMED é decisão terminológica | titular clínico + `ADR-0013` |
| R3 | `partial` do GCS degradando para `indisponivel` — espelha correção já ratificada para o NEWS2, **não ratificada para o GCS** | titular clínico |
| R4 | Autoria do bundle do RULE-GCS: é **este** o bloqueio que impede o GCS de ser despachável | autor clínico + aprovador independente (`ADR-0007` C1) |
| R5 | Código de NT fora do conjunto governado: escolhido `invalid` (fail-closed); a alternativa seria inventar mapeamento | titular clínico |
| R6 | Janela de sobreposição temporal por parâmetro (herdada do ciclo 6) | titular clínico |
| R7 | Taxonomia de razões de status (herdada do ciclo 6) | titular clínico |

---

## 9. Contratos, UX, operação e cadeia de suprimentos

**Contratos.** `asyncapi.yaml` 3.0.0 publicado e referenciado pelo índice; gate
`check_contratos.mjs` com 148 verificações, provado nos dois sentidos —
reprova 12 mutações distintas de contrato — **medição relatada pelo autor do
gate, não reproduzível a partir do repositório**, porque `check_contratos.mjs`
não tem modo de autoteste (ao contrário de `verificar-artefato.mjs autoteste`,
que tem e é reproduzível). As mutações foram (enum divergente, evento inventado,
evento emitido e não declarado, YAML inválido, chave duplicada, `$ref` não
resolvido, credencial em query…). OpenAPI atualizado: três superfícies de saúde,
ticket de eventos, sessão de desenvolvimento, `bearerFormat` corrigido de
`SYNTH-TOKEN.<tenantId>.<atorId>` para JWS.

**Tempo real.** A entrega deixou de ser replay finito. Provado **por mutação**:
restaurar o encerramento pós-catch-up fez exatamente 4 testes falharem —
**experimento relatado pelo autor, não reproduzível a partir do repositório**,
porque exigiria mutar o fonte. O fluxo
permanece aberto, entrega evento produzido **depois** da conexão, emite pulsação,
desconecta explicitamente o cliente lento com instrução de reconciliação
(`ADR-0011` P5), retoma por cursor sem lacuna e reavalia autorização **por
evento**. Nenhum bearer viaja em URL, log ou corpo de erro.

**Prontidão — consequência que precisa ser dita.** `/v1/readyz` responde
**503 permanente** neste estado, porque o RULE-GCS não tem bundle e nenhum alvo
de frescor foi validado (Gate G1). Isso é o retrato honesto de um safety case em
M0 com 0 vias acionáveis — **não é defeito a contornar**. Nenhum SLO, banda ou
limiar foi inventado: todo `limiteMs` no código é `null`, e o veredito **não
pode** ser `ready` enquanto for, por construção. Se uma instância `degraded`
deve receber tráfego é decisão humana, parametrizada e fail-closed por padrão.

**UX.** Rejeição de rede produz estado de erro acionável — nunca "carregando"
permanente; cancelamento é `AbortController` real, provado no sinal; dado
anterior a uma falha aparece rotulado como desatualizado; `?mock`, token
sintético e controle de demonstração são **reprovados no build** de produção,
com auditoria do bundle confirmando zero ocorrências e a divulgação obrigatória
preservada. Um defeito real de frontend foi encontrado **pela suíte de
navegador**, não por leitura: o `AbortSignal` do chamador era repassado à
renovação de sessão compartilhada, e o cancelamento de um consumidor derrubava a
emissão para todos — em React StrictMode isso ocorria sempre, e a tela atribuía
à **rede** uma falha de **autenticação**.

**Cadeia de suprimentos.** Artefatos de API e web separados, mínimos, não-root
(UID 1000 e 101, medidos em execução), sem `devDependencies` nem fonte
TypeScript, sem gerenciador de pacote na imagem. SBOM CycloneDX determinístico
(dois hashes idênticos em execuções seguidas). Verificador com 33 casos de
autoteste, cada gate provado aceitando o conforme **e** recusando o
não-conforme; um segredo plantado deliberadamente reprovou o scan. Promoção
recusa tag e exige digest. **Nada foi assinado**: chave fabricada pelo executor
apresentada como assinatura seria evidência de verificação que não ocorreu
(`THR-0055`).

---

## 10. Divergências documentais corrigidas

Todas por **emenda datada**, preservando o texto anterior como registro:

- **G2**: o mapa afirmava `PARCIAL` na emenda e `BLOQUEADO` no corpo e na tabela
  §12. Unificado em `PARCIAL`, com "promoção BLOQUEADO (dados)" explicitado.
- **G4, G6, G7**: a tabela §12 do mapa dizia `NÃO INICIADO`, contradizendo os
  corpos §5.4/§5.6/§5.7 e o backlog. Propagado — divergência que **não** estava
  no encargo e foi encontrada pela reconciliação.
- **G5**: deixou de ser "não iniciado" puro e passou a distinguir suíte
  implementada (`packages/conformidade`, `CTS-01..CTS-22` contra fixtures
  pinadas) de verificação por terceiro (`MG-G5`, pendente).
- **G8 / operação contínua**: distinguem código de instrumentação e vigilância
  existente — agora **com consumidor real** — de evidência operacional
  inexistente.
- **`ADR-0012..0024` como `not-started`**: corrigido no backlog, no
  `adr-index.md` (§7 e o Mermaid §4.2, onde 19 de 24 nós estavam estilizados
  `notstarted` apesar de `accepted`) e nos READMEs de `apps/api` e
  `packages/contratos`.
- **`planejamento_de_sprints.md`**: aviso de supersessão datado, sem reescrever
  o encargo retroativamente.
- **`docs/09-api-events-and-mcp/`**: `apps/api/src/store.ts` — arquivo removido
  no ciclo 6 — ainda era descrito como o armazenamento vigente, e o núcleo de
  avaliação como "inteiramente local, inventado e ilustrativo". Corrigido pelo
  orquestrador.

Estado por gate agora idêntico entre o **corpo** do mapa, a **tabela §12** e o
**YAML**, com uma exceção conhecida e não resolvida: G6 lê `NÃO INICIADO`
(aprovação) / `PARCIAL` (identificação) no corpo §5.6 e `PARCIAL` puro na tabela
e no YAML — o corpo é mais granular, e unificá-lo exigiria decidir qual das duas
leituras vale, que é ato do titular. **Mermaid não entra nessa afirmação**:
nenhum diagrama do mapa ou do backlog codifica estado de gate (o `flowchart` da
§11 é swimlane de dependência de sprint); o único Mermaid corrigido, em
`adr-index.md` §4.2, codifica aceitação de ADR.

Sobre IDs: **nenhum órfão e nenhuma duplicata foram encontrados** pelo inventário
mecânico executado, mas esse inventário não foi versionado como artefato, então a
afirmação é **relatada, não reproduzível**. As duas suspeitas que ele levantou
foram verificadas pelo orquestrador e são falso-positivo: `THR-0005..0047`
estão definidos em `threat-model.md`, e `ADR-0031/0035/0038/0039` são ADRs
**legadas da V1**, de namespace distinto.

Cerca de 12 ocorrências equivalentes de `not-started` obsoleto permanecem fora
do escopo de escrita desta rodada, listadas em
`analise-pos-ciclo-6-mapa-vs-estado.md` §6.4 como pedido de desbloqueio.

---

## 11. Pendências humanas, AMH e externas

| Entrada | Evidência exigida | Efeito bloqueante | Próximo ato |
|---|---|---|---|
| `MG-G7` | Aceite da fatia como fundação, com revisor independente da regra | Gate G7 | Ato do titular |
| Aceite do 2º revisor clínico | Aceite formal, credencial e linha de reporte (Dr. Marcelo) | `GDEC-0010` | Ato do titular |
| PDF assinado do parecer OS-16 | Original com assinatura | `SPR-G0-4` | Ato do titular |
| `BLK-0015` | Dono AMH do contrato (`producer.owner`) | G3 | Ato do lado AMH |
| `BLK-0003` / `AUTH-SECURITY` | **Nomear o dono do papel** | **Anterior a todo o resto de identidade**: sem ele não há a quem pedir metadados de IdP | Ato do titular |
| Integração de IdP | Descoberta OIDC ou `issuer`+`jwks_uri`; audiência; claim e grão de tenant; claim de papéis e mapeamento; claim de finalidade; algoritmos; política e período de graça de rotação; client-credentials; introspecção/revogação | ACH-02 fica em servidor de teste local; `ADR-0015` §8 V1..V5 sem evidência real; `MG-G6` | Depende de `BLK-0003` |
| Ratificações clínicas R1–R7 | Ver §8.1 | GCS não despachável; contrato do GCS incompleto | Ato do titular clínico |
| Registry, chave e OIDC de CI | Registry OCI com residência decidida; chave sob custódia declarada (custodiante ≠ dono do pipeline, `DEC-G0-06`); `id-token: write` | Assinatura, proveniência e promoção `NÃO EXECUTADAS` | Ato do titular |
| Limiares de severidade | Ratificação de `scripts/politica-de-severidade.json` | `ADR-0022` §5.1 C4 | Ato do titular |
| Checks obrigatórios | Decisão sobre `build-and-test`, `change-metadata` e os 5 jobs de supply chain na proteção da `main` | Workflow verde ≠ check obrigatório | Ato do titular |
| Validação assistiva | Sessões com usuários de tecnologias assistivas | `MG-G4` | Terceiro externo |
| Pentest e verificador independente | `DEC-G0-02` | `MG-G6`; 32 P0 seguem `OPEN` | Terceiro externo |
| Reconciliação de vocabulário de perfis | 6 perfis de runtime × 7 ambientes de `ADR-0019` | Coexistem três vocabulários não reconciliados | Ato do titular |
| Execução AMH e ambientes `stg`/`prod` | OS-01..OS-24; IG 1.1.0 | G3, G8 | Fora do alcance da V2 |
| **Réplica de leitura e transação somente-leitura** | Decisão de arquitetura: enquanto a âncora de escopo for o selo em tabela, `instalar` precisa escrever, e **nenhuma réplica de leitura pode servir a aplicação**. As três alternativas já foram MEDIDAS contra PostgreSQL 16.14 e não servem — linha, advisory lock e sequência não sobrevivem a `ROLLBACK TO SAVEPOINT` | Escalar leitura por réplica é impossível sem trocar a âncora; `default_transaction_read_only` é `PGC_USERSET`, então o próprio app pode inviabilizar-se | Ato do titular — só entra em jogo se réplica de leitura entrar no plano |
| **`BLK-0003` é internamente contraditório** | O registro traz `status: RESOLVIDO COM ESCOPO` e, no mesmo bloco YAML, `who_must_act: AUTH-SECURITY — UNASSIGNED — VALIDATION REQUIRED`. As duas não podem valer juntas | Enquanto durar, qualquer citação do bloqueio é ambígua: este relatório o cita pelo `who_must_act`, e um leitor que olhe o `status` conclui o oposto | Reconciliação documental é engenharia; **nomear o papel é ato do titular** |
| **Campo `execucao` da matriz de acessibilidade conflaciona duas coisas** | Quatro dos cinco critérios `manual_obrigatorio` estão com `execucao: "executado"`, registrando que a **cobertura automatizada** rodou — não que a validação manual ocorreu. Um único campo não expressa "automatizado feito, manual pendente" | Risco de leitura de que a acessibilidade está validada quando não está | Engenharia para separar os campos; a classificação WCAG em si é do titular |

**Nenhum pedido foi enviado, nenhuma pessoa nomeada, nenhum risco aceito e
nenhuma proteção de branch alterada.**

Estas 17 entradas são a resposta do encargo para o que **não** é executável por
engenharia. O §6.2 é explícito quanto ao padrão: "não invente fornecedor de
identidade… entregue a porta, o adaptador verificável por servidor de teste, a
configuração tipada e o **pedido exato de integração**, sem alegar operação
real". O mesmo vale para autoria de bundle clínico (`ato humano clínico`, §2),
validação com tecnologias assistivas (§6.7, "rotulada como não executada até
ocorrer") e verificador terceiro (`DEC-G0-02`). Entregar a mecânica verificável
mais o pedido preciso **é** o critério de conclusão para esses itens; executá-los
seria violar §2, §11 e §14.

---

## 12. Riscos residuais e rollback

1. **A fronteira de identidade autenticada é a que resta.** O isolamento de
   armazenamento agora protege contra SQL arbitrário em voo; **não** protege
   contra um chamador que peça o tenant errado. Isso é `SEC-0001`, e depende de
   IdP real. É o risco P0 remanescente.
2. **Cinco revisões adversariais não convergiram.** Rodadas 1→5 produziram
   8, 6, 9, 12 e 12 achados; a quinta ainda encontrou **dois P1 exploráveis
   ponta a ponta** pela API do produto. Cada rodada corrigiu o que a anterior
   apontou e a seguinte achou classe nova — matview em esquema permitido, view
   auto-atualizável sobre a âncora, guarda de não-vacuidade circular. Nenhuma
   delas substitui o verificador terceiro independente que `DEC-G0-02` exige, e
   o padrão observado é que ele **encontrará mais**. Tratar a contagem de
   rodadas como prova de robustez seria ler o inverso do que os dados dizem.
3. **Ambiente de teste ≠ ambiente real, e o gate unitário não distingue os
   dois**: a suíte de unidade roda com `PERFIL` e `NODE_ENV` ambos definidos
   pelo runner. Foi assim que o HTTP 500 de `/v1/dev/sessao` sobreviveu a um
   `verify` verde. Mitigado em duas frentes: o especialista de identidade
   acrescentou seis casos que **removem** essas variáveis dentro do teste, e o
   job `e2e-navegador` agora sobe a API de verdade e exercita a rota. Risco
   residual: nenhum dos dois cobre a forma do ambiente de **produção**, que
   ninguém executou.
4. **Custo do selo de escopo não medido**: toda transação escopada passa a
   escrever uma linha, inclusive as de leitura.
5. **Migração concorrente não serializada**: sem lock consultivo nem tabela
   durável de versão de schema.
6. **Premissas reversíveis acumuladas**: quanto mais código repousa sobre elas,
   maior o custo de reverter. As desta rodada estão declaradas uma a uma nos
   cabeçalhos dos módulos.
7. **Advertência de sequência preservada** (`INFERENCE`, do ciclo 6): percorrido
   o `MG-G7`, a V2 deixa de ter caminho crítico próprio.

**Rollback.** Toda a entrega vive numa branch; a `main` está intacta no
commit-base. Reverter é `git checkout main`. Por componente: a migração `0004` é
aditiva e a `0003` foi emendada de forma idempotente e compatível para a frente
(reaplicá-la depois da `0004` não rebaixa políticas); o adaptador PostgreSQL
está atrás de porta e o PGlite continua funcional; a porta de autenticação é
injetável; o cliente de protocolo é substituível por `pg` sem tocar consumidor.

---

## 13. Estado real dos gates — nenhum aprovado

| Gate | Estado | O que esta rodada mudou |
|---|---|---|
| G0 | `PARCIAL` | inalterado |
| G1 | `PARCIAL` | inalterado; `MG-G1` segue ato humano |
| G2 | `PARCIAL` (promoção `BLOQUEADO` por dados) | bundle no caminho da rota; acionabilidade continua recusada fail-closed |
| G3 | `BLOQUEADO` | inalterado — execução AMH |
| G4 | `PARCIAL` | contratos e UX avançaram; `MG-G4` segue ato humano |
| G5 | `PARCIAL` | reclassificado: suíte implementada ≠ verificação externa |
| G6 | `PARCIAL` | fronteira de tenant passou a ser exercitada contra banco real; **32 P0 seguem `OPEN`**, verificador terceiro pendente |
| G7 | `PARCIAL` | fatia mais robusta; `MG-G7` segue ato humano pendente |
| G8 | `NÃO INICIADO` / ambiente `BLOQUEADO` | mecânica de artefato existe; nenhuma evidência operacional |
| Op. contínua | `NÃO INICIADO` | instrumentação ganhou consumidor; operação real inexistente |

**`PARCIAL` significa que camadas foram percorridas — preparação, decisão,
implementação. Não significa verificação nem aprovação humana.**

---

## 14. Comandos exatos de retomada

```bash
git checkout codex/finalizacao-plataforma-v2

# Gate completo (exige PostgreSQL local para exercitar a fronteira P0)
pnpm install --frozen-lockfile
pnpm verify                     # esperado: exit 0, 1.457 testes verdes

# Fronteira de isolamento contra PostgreSQL real, em modo BLOQUEANTE
pnpm test:fronteira             # esperado: 44 verdes

# Cluster PostgreSQL efêmero, se não houver servidor
node scripts/pg-efemero.mjs up      # JSON de uma linha na stdout
node scripts/pg-efemero.mjs down

# Contratos, documentação e conteúdo proibido
pnpm check:contratos            # 148 verificações
python3 scripts/check_doc_conventions.py
python3 scripts/check_forbidden_content.py
python3 -c "import yaml; yaml.safe_load(open('docs/14-devsecops-and-delivery/mapa-de-projeto-backlog.yaml'))"

# Navegador e acessibilidade (instala o navegador na primeira vez)
pnpm test:e2e:instalar
pnpm test:e2e

# Cadeia de suprimentos (exige rede e daemon do Docker)
pnpm check:supply-chain
pnpm sbom
```

Leitura obrigatória na retomada: este relatório,
`docs/15-release-evidence/final-implementation-audit.md`, e a seção
`consolidacao_final_2026_08_17` do `HANDOFF.yaml`.

---

## 15. Pergunta de controle (§15 do encargo)

> Esta mudança melhora uma decisão clínica oportuna, segura, explicável e
> responsável, preservando incerteza, proveniência, isolamento de tenant,
> recuperabilidade operacional e autoridade humana — e isso foi demonstrado por
> teste/evidência proporcional ao risco?

Para o isolamento de tenant, a autenticação, a integração de regra, os contratos,
a prontidão e a resiliência de UX: **sim, com os limites de §7 e §8 declarados** —
cada um com teste vermelho antes e verde depois, e as fronteiras P0 submetidas a
revisão adversarial independente que efetivamente as refutou uma vez.

Para produção, conformidade, compatibilidade AMH, efetividade clínica ou
qualquer `MG-*`: **não, e nada aqui o afirma.** A entrega torna a fatia mais
honesta e mais verificável. Ela não a aproxima de um gate que dependa de dado
real, de terceiro ou do titular.
