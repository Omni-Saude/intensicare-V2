---
doc_id: FINAL-IMPLEMENTATION-AUDIT
title: Matriz de auditoria de delta — consolidação final do IntensiCare V2
status: OBSERVED
owner: orquestrador técnico de consolidação — matriz indelegável (prompt §5/§9)
source: >-
  PROMPT_IMPLEMENTACAO_FINAL_INTENSICARE_V2.md §5/§6 (achados a revalidar);
  árvore de trabalho no commit-base ecd32d555291a6ab75e6bb2c3227ad557d87a368
  (branch main), reproduzida na branch codex/finalizacao-plataforma-v2;
  docs/15-release-evidence/cycle-6-construction-report.md;
  docs/14-devsecops-and-delivery/analise-pos-ciclo-6-mapa-vs-estado.md;
  docs/11-security-privacy-compliance/verificacao-de-controles-fatia-g7.md
date_collected: "2026-08-16"
collector: orquestrador técnico de consolidação; revalidação por especialistas estreitos de escopo disjunto
last_updated: "2026-08-16"
---

# Matriz de auditoria de delta — consolidação final

Rótulos epistêmicos conforme `docs/00-governance/evidence-notation.md`.

Esta matriz é **pré-condição de edição** (prompt §5): cada achado do §6 do
pedido foi tratado como **hipótese** e revalidado contra o código do commit-base
**antes** de qualquer alteração comportamental. Nenhuma linha abaixo foi
transferida de auditoria anterior sem reprodução.

**Commit-base:** `ecd32d555291a6ab75e6bb2c3227ad557d87a368` (`main`).
**Branch de trabalho:** `codex/finalizacao-plataforma-v2`.
**Baseline de regressão (OBSERVED, execução real):** `pnpm verify` → exit 0;
1.026 testes verdes distribuídos em 11 pacotes; 1 `expected fail`
(`packages/persistencia/src/seguranca.test.ts:485`) que documenta a limitação de
RLS sob PGlite.

---

## 1. Legenda

| Campo | Significado |
|---|---|
| Estado | `CONFIRMADO` (reproduzido, exige correção) · `PARCIAL` (parte já resolvida) · `RESOLVIDO` · `NÃO APLICÁVEL` · `BLOQUEADO` (depende de autoridade/ambiente externo) |
| Severidade | `P0` fronteira de segurança/isolamento · `P1` integridade de plataforma/produto · `P2` consistência de evidência · `P3` higiene |
| Autoridade | `engenharia` quando o executor decide; caso contrário, quem decide |

Um item `CONFIRMADO` ou `PARCIAL` exige **teste vermelho antes** da alteração
comportamental. Item `RESOLVIDO` ou `NÃO APLICÁVEL` **não** recebe correção —
somente regressão, se houver risco material.

---

## 2. Matriz

### ACH-01 — Rebaixamento de papel em PGlite não é fronteira de segurança (§6.1)

| Campo | Conteúdo |
|---|---|
| **Achado** | A identidade da aplicação pode restaurar superusuário na mesma conexão, anulando a RLS por tenant. O rebaixamento é de escopo de **sessão**, não de conexão autenticada, e é reversível pelo próprio papel rebaixado. |
| **Origem** | `packages/persistencia/src/session.ts:53-55` (`downgradeToApplicationRole` → `set session authorization intensicare_app`); `packages/persistencia/src/seguranca.test.ts:485` (`it.fails(...)`); `ADR-0016` §4.1; `THR-0050`; `SEC-0009`; `SAF-0008`; `docs/11-security-privacy-compliance/verificacao-de-controles-fatia-g7.md` (ACHADO-01, gravidade ALTA) |
| **Evidência observada** | `pnpm test` em `packages/persistencia` → `Tests 33 passed \| 1 expected fail (34)`. O `expected fail` é exatamente o teste que prova que `SET SESSION AUTHORIZATION` restaura privilégio. O gate agregado (`pnpm verify`) termina **exit 0** com essa falha P0 dentro. |
| **Estado** | `CONFIRMADO` |
| **Severidade** | `P0` — é a única fronteira que separa o dado clínico de um tenant do de outro; e hoje ela é assegurada por um simulador embarcado monousuário, não pelo motor de produção. |
| **Autoridade** | engenharia para o adaptador e a suíte; **`MG-G6` + verificador terceiro independente (`DEC-G0-02`)** para declarar o controle verificado. |
| **Correção mínima** | Adaptador de runtime para PostgreSQL real, separado do de dev/teste; aplicação conecta **já** como papel `NOSUPERUSER`/`NOBYPASSRLS`, não-dono das tabelas, sem poder elevar ou restaurar autorização; contexto de tenant transacional fail-closed com reset garantido antes do reuso de conexão; suíte **bloqueante** contra PostgreSQL efêmero real. Nenhuma falha P0 pode permanecer como `expected fail` num gate verde — o sentinel do simulador só sobrevive se a suíte real correspondente for bloqueante e verde. |
| **Teste de aceite** | Contra PostgreSQL real: (a) a identidade da aplicação não recupera superusuário por nenhum caminho SQL; (b) sem `app.tenant_id` nenhuma linha é visível; (c) tenant A não lê nem escreve linha de B; (d) conexão devolvida ao pool e reusada não carrega o tenant anterior. Vermelho antes, verde depois. |
| **Rastreabilidade** | `ADR-0016`, `THR-0050`, `SEC-0009`, `SAF-0008`, `MG-G6`, `SPR-G6-2` |
| **Disposição** | `ic-fronteira-postgres-rls` (ver §3) |

### ACH-02 — Autenticação é stub sintético; tenant vem do próprio token não verificado (§6.2)

| Campo | Conteúdo |
|---|---|
| **Achado** | `autenticar()` aceita `Bearer SYNTH-TOKEN.<tenantId>.<atorId>` e usa o tenant **embutido na string** como autoridade de escopo. Não há verificação criptográfica, emissão, expiração, revogação, audiência, issuer ou rotação de chave. O frontend compila um token operacional fixo. |
| **Origem** | `apps/api/src/auth.ts:30` (`TOKEN_PATTERN`), `:81-96` (tenant/ator derivados do texto do token); `apps/web/src/api/clienteHttp.ts:58` (`const TOKEN_DEV = "SYNTH-TOKEN.SYNTH-TENANT-G7.SYNTH-PROFISSIONAL-WEB"`), `:293`; `ADR-0015`; `ADR-0016` |
| **Evidência observada** | O próprio cabeçalho de `auth.ts:1-19` declara: "**não é** um mecanismo de autenticação real. Não há verificação criptográfica de token, não há emissão/expiração/revogação de sessão." Qualquer chamador que escolha a string escolhe o tenant. |
| **Estado** | `CONFIRMADO` (stub honesto e rotulado — mas gap de plataforma, não defeito oculto) |
| **Severidade** | `P0` — combinado com ACH-01, o isolamento de tenant não tem nenhuma fronteira verificada de ponta a ponta. |
| **Autoridade** | engenharia para porta/adaptador/testes; **titular + provedor de identidade** para metadados, credenciais e linha de integração reais. |
| **Correção mínima** | Porta de autenticação única com adaptadores separados (OIDC/serviço · fixtures sintéticas). Validação fail-closed de issuer, audience, assinatura, algoritmo permitido, `exp`/`nbf`, rotação/JWKS, finalidade e revogação. Derivação central de tenant/ator/papéis/finalidade a partir de identidade **verificada**. Autorização de recurso além de scopes. **Nenhum fallback** do provedor real para token local. Adaptador sintético só por configuração explícita de dev/teste; perfil não-dev **falha** ao iniciar se ele estiver ativo. Frontend sem token operacional compilado. |
| **Teste de aceite** | `alg=none`, confusão de algoritmo/issuer, audience incorreta, `kid` desconhecido, chave rotacionada, token expirado, `nbf` futuro, assinatura adulterada, cross-tenant, sessão expirada e identidade m2m — todos rejeitados sem vazar detalhe. Construir o servidor em perfil `production` com adaptador sintético habilitado **lança**. |
| **Rastreabilidade** | `ADR-0015`, `ADR-0016`, `MG-G6`, `THR-*` de identidade |
| **Disposição** | `ic-identidade-auth` (ver §3). Parte **`BLOQUEADO`**: sem IdP real, entrega-se porta + adaptador verificável contra servidor de teste local + configuração tipada + pedido de integração. Nenhuma alegação de operação real. |

### ACH-03 — Default de runtime cria PGlite em memória e semeia fixtures (§6.3)

| Campo | Conteúdo |
|---|---|
| **Achado** | Sem banco injetado, a API cria PGlite **em memória**, roda migrações e **semeia fixtures sintéticas** — e é esse o caminho executado por `buildServer()` sem opções, inclusive quando o processo é iniciado como `main`. Não há perfil, nem validação de configuração antes de escutar a porta. |
| **Origem** | `apps/api/src/db.ts:93-99` (`prepareDatabase` → `createInMemoryDatabase()` + `bootstrapDatabase()` + `loadIntoDatabase()`); `apps/api/src/index.ts:51-52`, `:91-104` (bootstrap real: só lê `PORT`) |
| **Evidência observada** | `rg -n "loadIntoDatabase\|createInMemoryDatabase" apps/api/src` → `db.ts:95`, `db.ts:97`. Nenhuma leitura de perfil, URL de banco, segredo ou identidade em `index.ts`. |
| **Estado** | `CONFIRMADO` |
| **Severidade** | `P1` — correto e desejável para a demonstração sintética; inaceitável como **default** de runtime não-dev, porque o modo inseguro é o que se obtém por omissão. |
| **Autoridade** | engenharia para perfis e validação; **titular** para provedor/ambiente/residência. |
| **Correção mínima** | Perfis explícitos: `test`/`dev-synthetic` (PGlite e fixtures, com banner inequívoco), `integration` (banco efêmero real, sem semeadura implícita), `staging`/`pilot`/`production` (dependências externas obrigatórias, **sem semeadura automática**, falha de inicialização para segredo/identidade/bundle/banco ausente). Configuração tipada validada **antes** de escutar a porta, sem defaults inseguros. Migrações com lock, timeout, compatibilidade e rollback/roll-forward testável. Nenhum estado clínico autoritativo em memória de processo. |
| **Teste de aceite** | `PERFIL=production` sem URL de banco **lança**, citando a variável ausente; `PERFIL=production` com PGlite/fixtures/adaptador sintético **lança**; `PERFIL=dev-synthetic` emite o banner; varredura do schema não encontra default de segredo/identidade. |
| **Rastreabilidade** | `ADR-0006`, `ADR-0010`, `ADR-0016`, `ADR-0019`, `ADR-0020` |
| **Disposição** | `ic-runtime-perfis` (ver §3) |

### ACH-04 — Kernel, GCS, rule-bundle, kill switch e vigilância fora da rota real (§6.4)

| Campo | Conteúdo |
|---|---|
| **Achado** | Os pacotes existem e são extensamente testados, mas a API integra **apenas** o caminho NEWS2. Não há registro/dispatcher de regras: a seleção é implícita e única. O bundle assinável não é consumido pela rota; ativação, `behaviorHash`, assinatura, autor≠aprovador, rollback e kill switch não participam da decisão de avaliar. GCS não é alcançável por rota. Telemetria e vigilância não são invocadas. |
| **Origem** | `apps/api/src/routes.ts:81-173` (única rota de avaliação, chama `ingestObservations`); `apps/api/src/db.ts:314-317` (`evaluateEncounter` direto); `apps/api/src/avaliacao.ts`; ausência de `@intensicare/rule-bundle`, `@intensicare/observabilidade` e `@intensicare/vigilancia` em `apps/api/package.json` |
| **Evidência observada** | `rg -n "observabilidade" apps/api/package.json apps/api/src/*.ts` → **nenhuma ocorrência**. Os pacotes `rule-bundle` (302 testes), `observabilidade` (55) e `vigilancia` (77) passam verdes **isolados**, sem consumidor. |
| **Estado** | `CONFIRMADO` |
| **Severidade** | `P1` — anti-padrão explícito "confundir pacote existente com integração concluída". A garantia de que uma via não é acionável está hoje no pacote, não no caminho que a rota percorre. |
| **Autoridade** | engenharia para registro/dispatcher/fiação; **ratificação clínica humana** para qualquer divergência de regra, janela, limiar, banda, razão de status ou terminologia. |
| **Correção mínima** | Registro/dispatcher de regras versionado (nenhum `if` disperso por rota). API consome bundle **verificado**. Bundle sem pré-condição de acionabilidade ⇒ avaliação sintética/sombra **rotulada** ou `não avaliado`. GCS integrado com seus estados/razões/sedação/temporalidade, **sem** criar banda de severidade, mapeamento para ACVPU ou alerta inexistente. Telemetria e vigilância ligadas às operações reais com redação de PHI por tipo. Registro imutável de versão de regra/bundle, entradas, razões, proveniência, correlação e decisão humana. |
| **Teste de aceite** | Regra não registrada ⇒ erro explícito, nunca NEWS2 por default; bundle real do NEWS2 (não acionável) ⇒ saída rotulada sintética/sombra ou `não avaliado`; assinatura adulterada/chave desconhecida ⇒ recusa fail-closed; kill switch ⇒ recusa com razão visível; rollback comprovado por `behaviorHash`; NEWS2 e GCS coexistem no mesmo encontro sem contaminação. |
| **Rastreabilidade** | `ADR-0007`, `ADR-0008`, `ADR-0025`–`ADR-0029`, `HAZ-0005`, `SPR-G2-3`, `SPR-G7-2`, `SPR-G8-1`, `SPR-OC-1` |
| **Disposição** | `ic-regras-bundle` (ver §3). **SOFA permanece fora de escopo** por instrução do §6.4: nova regra amplia superfície clínica sem aproximar gate. |

### ACH-05 — Sem AsyncAPI formal; `/v1/eventos/stream` é replay finito, não tempo real (§6.5)

| Campo | Conteúdo |
|---|---|
| **Achado** | (a) Não existe contrato AsyncAPI: o catálogo de eventos é prosa em `docs/09-api-events-and-mcp/catalogo-de-eventos.md`, sem schema validável nem teste de compatibilidade produtor/consumidor. (b) A rota serializa o backlog em formato SSE e **encerra a conexão** — catch-up, não entrega contínua. |
| **Origem** | `ls packages/contratos/*.yaml` → apenas `openapi.yaml`; `apps/api/src/routes.ts:304-334`, com a nota `:319-321` reconhecendo a pendência |
| **Evidência observada** | `routes.ts:331-333`: `return reply.code(200).send(corpo || ...)` — resposta única e terminada. Sem heartbeat, sem buffer, sem backpressure, sem retomada, sem autorização por evento. |
| **Estado** | `CONFIRMADO` |
| **Severidade** | `P1` — anti-padrão explícito "chamar replay finito de SSE de tempo real"; e um contrato de eventos sem schema versionado não tem política de evolução verificável. |
| **Autoridade** | engenharia dentro de `ADR-0011`; **titular** se o mecanismo de autorização do navegador exigir escolha fora da ADR. |
| **Correção mínima** | `packages/contratos/asyncapi.yaml` versionado e referenciado pelo índice; schemas com correlação/causação, tenant, ordenação, idempotência, versão, replay e política de evolução; validação automática de OpenAPI **e** AsyncAPI como gate; SSE contínuo com heartbeat, cursor monotônico, buffer limitado, backpressure, desconexão, retomada e reconciliação por polling; autorização **em cada conexão e em cada evento**; nenhum bearer de longa duração em query string, log, URL ou corpo de erro — sessão/cookie segura ou ticket efêmero de uso único. |
| **Teste de aceite** | Stream permanece aberto após o catch-up e entrega evento produzido **depois** da conexão; heartbeat observável; cliente lento não consome buffer ilimitado; reconexão por cursor retoma sem lacuna e sem duplicata não idempotente; ticket reusado ou expirado é rejeitado; nenhum teste observa credencial em URL/log; AsyncAPI inválido faz o gate falhar. |
| **Rastreabilidade** | `ADR-0010`, `ADR-0011`, `ADR-0012`, `ADR-0020` |
| **Disposição** | `ic-eventos-tempo-real` (ver §3) |

### ACH-06 — `/health` sempre `ok`; avaliador de prontidão não ligado à API (§6.6)

| Campo | Conteúdo |
|---|---|
| **Achado** | `GET /health` responde `{status:"ok"}` incondicionalmente. `GET /v1/healthz` testa a conexão com o banco. Não há separação liveness/readiness/startup, nem código HTTP distinto para degradação. O avaliador de prontidão de `packages/observabilidade` não é consumido pela API. |
| **Origem** | `apps/api/src/index.ts:55`; `apps/api/src/routes.ts:75-79`; `packages/observabilidade/src/readiness.ts`, `probes.ts`, `degradation.ts` |
| **Evidência observada** | `rg -n "observabilidade" apps/api/package.json apps/api/src/*.ts` → **nenhuma ocorrência**. Um processo vivo com bundle ausente, identidade não configurada e projeção velha responde `200 ok` nas duas rotas. |
| **Estado** | `CONFIRMADO` |
| **Severidade** | `P1` — anti-padrão explícito "usar o mesmo endpoint/status para liveness, readiness e startup". Um orquestrador que promova por `/health` promove um processo não pronto. |
| **Autoridade** | engenharia para os endpoints e a fiação; **`VALIDATION REQUIRED`** para qualquer alvo numérico — nenhum SLO, banda ou limiar de frescor é decidido aqui. |
| **Correção mínima** | Três superfícies separadas: liveness (só o processo, sem dependências e sem PHI), readiness (bundle válido/ativo, identidade e chaves, banco e dependências obrigatórias, frescor de projeção, outbox/replay, degradação visível), startup (inicialização concluída e configuração válida). Códigos HTTP coerentes — vivo pode responder sucesso enquanto readiness responde indisponível/degradado; nunca tudo em `200 ok`. `/health` preservado e **documentado como liveness**, não usável para promoção. Métricas, logs e traces tipados ligados a ingest, avaliação, persistência, publicação, projeção, leitura, reconhecimento, erro e readiness. Sondas sintéticas. |
| **Teste de aceite** | Banco indisponível ⇒ liveness 200 **e** readiness 503 com razão estruturada; bundle ausente/inativo ⇒ readiness degradado, nunca 200; perfil sintético ⇒ limitação exposta como degradação declarada; startup falha antes e sucede depois da inicialização; nenhuma das três superfícies emite identificador de sujeito, tenant bruto ou credencial. |
| **Rastreabilidade** | `ADR-0020`, `SAF-0026`, `SEC-0015`, `SPR-G8-1` |
| **Disposição** | `ic-prontidao-observabilidade` (ver §3) |

### ACH-07 — Promise sem tratamento final, sem cancelamento, sem E2E nem automação WCAG (§6.7)

| Campo | Conteúdo |
|---|---|
| **Achado** | Componentes chamam o cliente com `.then(...)` **sem handler de rejeição**: um cliente que rejeite deixa a tela presa em "carregando". A regra `noFloatingPromises` do Biome está **desligada**. Há `?mock` alcançável em runtime e token sintético compilado. Não existe suíte de navegador real nem automação de acessibilidade. |
| **Origem** | `apps/web/src/components/GradeLeitos.tsx:46`; `apps/web/src/components/DetalhePaciente.tsx:33`; `biome.jsonc:122` (`"noFloatingPromises": "off"`) com a pendência registrada em `:100`; `apps/web/src/App.tsx:25` (`?mock`); `apps/web/src/api/clienteHttp.ts:58`; `PRE-07` |
| **Evidência observada** | `rg -n "\.then\(" apps/web/src/components/*.tsx` → duas ocorrências, nenhuma seguida de `.catch(`. O relatório do ciclo 6 §5.3 já registrava os 2 casos reais como gap de produto não corrigido. |
| **Estado** | `CONFIRMADO` (registrado como `PRE-07`, nunca corrigido) |
| **Severidade** | `P1` — anti-padrão explícito "manter Promise sem tratamento final, deixando UI presa em carregamento". Numa tela consultiva de deterioração clínica, "carregando" indefinido é indistinguível de "nada de errado". |
| **Autoridade** | engenharia para estados, rede e automação; **`ADR-0029` / ratificação clínica** para terminologia normativa; **usuários de tecnologia assistiva** para validação de acessibilidade — não substituível por automação. |
| **Correção mínima** | Tratar rejeição, cancelamento, timeout, retry, offline, reconexão, replay, sessão expirando/expirada/recuperada e trabalho não salvo. Cancelamento **real** (`AbortController`), não flag que ignora resultado. Nunca exibir dado antigo como atual após falha sem rótulo de frescor. Renderizar os estados obrigatórios do §11. Estado clínico segue originado no backend. Impedir `?mock`, token sintético e controle de demonstração em build não-dev. Testes de componente com interação real; E2E de navegador **autenticado** contra API e banco reais com fixtures sintéticas; automação WCAG mais teclado, foco, live regions, zoom/reflow, reduced motion e falhas de rede. |
| **Teste de aceite** | Cliente que **rejeita** ⇒ estado de erro acionável, nunca "carregando" permanente; desmontar durante a requisição **aborta** de fato; após falha de recarga o dado anterior aparece rotulado desatualizado; perfil não-dev com `?mock` ⇒ recusa observável; axe sem violação nas telas principais; teclado alcança todos os controles com foco visível. |
| **Rastreabilidade** | `ADR-0021`, `ADR-0029`, `HAZ-0046`, `PRE-07`, `MG-G4` |
| **Disposição** | `ic-ux-resiliencia` (ver §3). Validação manual com tecnologias assistivas permanece **`BLOQUEADO`** (dependência humana) e será rotulada **não executada**. |

### ACH-08 — Sem artefato, SBOM, proveniência, assinatura ou promoção por digest (§6.8)

| Campo | Conteúdo |
|---|---|
| **Achado** | Não há artefato de execução (nenhum `Dockerfile`), portanto não há artefato mínimo não-root, SBOM, análise de licença/vulnerabilidade, atestado de proveniência, assinatura, deploy por digest nem ensaio de migração/restore em ambiente efêmero. |
| **Origem** | `ls apps/api/Dockerfile apps/web/Dockerfile` → *No such file or directory* (ambos); `rg -lni "sbom\|cyclonedx\|syft\|trivy\|cosign\|provenance" .github/ scripts/` → nenhuma ferramenta de supply chain, apenas coincidências textuais |
| **Evidência observada** | Os três workflows existentes (`ci-plataforma.yml`, `docs-gates.yml`, `metadados-gates.yml`) cobrem build/teste e gates documentais. Nenhum gera, analisa, assina ou promove artefato. |
| **Estado** | `CONFIRMADO` |
| **Severidade** | `P1` — sem artefato imutável verificado não há promoção reprodutível nem rollback demonstrável; `MG-G8-*` fica sem substrato técnico independentemente da decisão humana. |
| **Autoridade** | engenharia para o que é vendor-neutral; **titular** para provedor de nuvem, registry, residência e ambiente AMH — explicitamente fora do alcance do executor. |
| **Correção mínima** | Artefatos separados de API e web: mínimos, **não-root**, reproduzíveis, sem dependências de desenvolvimento. Build em checkout limpo e verificação de que artefato gerado não é versionado. SBOM, SCA/licenças, secret scan, SAST e scan de imagem como gates **bloqueantes** segundo política de severidade registrada. Proveniência e assinatura verificadas **antes** da promoção; **nunca `latest`**. Migrations e smoke tests contra PostgreSQL efêmero real. Promoção do mesmo digest entre ambientes, com rollback/roll-forward e pacote de evidência. |
| **Teste de aceite** | Container roda como UID ≠ 0; imagem sem `devDependencies` nem fonte TypeScript; SBOM parseável listando as dependências reais; segredo plantado faz o secret scan **falhar**; verificador recusa workflow com `continue-on-error` ou action sem SHA de 40 caracteres; promoção recusa referência por tag e exige digest. |
| **Rastreabilidade** | `ADR-0019`, `ADR-0022`, `THR-0050`–`THR-0055`, `MG-G8-*` |
| **Disposição** | `ic-supply-chain` (ver §3). Registry, chave de assinatura e OIDC de CI reais permanecem **`BLOQUEADO`** — entrega-se a mecânica verificável e o pedido de provisionamento, sem alegar promoção real. |

### ACH-09 — Mapa, backlog e READMEs divergem do estado executável (§6.9)

| Campo | Conteúdo |
|---|---|
| **Achado** | (a) No mapa, a emenda de G2 afirma `PARCIAL` enquanto o corpo mantém `BLOQUEADO`. (b) O backlog marca G2/G4/G6/G7 como `PARCIAL` mas conserva evidências/dependências que ainda dizem `ADR-0012..0024 not-started` ou exigem aceite de ADR como pré-condição — contrariando `GDEC-0015`/`GDEC-0016`. (c) G5 aparece como "não iniciado" sem distinguir suíte implementada de verificação externa pendente. (d) G8/operação contínua não distinguem código de instrumentação existente de evidência operacional inexistente. (e) `planejamento_de_sprints.md` é encargo do ciclo 2 sem aviso de supersessão. |
| **Origem** | `docs/14-devsecops-and-delivery/mapa-de-projeto-ate-producao.md`; `docs/14-devsecops-and-delivery/mapa-de-projeto-backlog.yaml`; `planejamento_de_sprints.md`; `docs/14-devsecops-and-delivery/analise-pos-ciclo-6-mapa-vs-estado.md` §2/§3 (que **já identificou** as divergências sem corrigi-las, por desenho) |
| **Evidência observada** | A própria análise pós-ciclo-6 declara em §1: "esta análise **não altera** o mapa nem o backlog: identifica onde eles divergiram da realidade". A correção foi deixada para "ato separado" — que é este. |
| **Estado** | `CONFIRMADO` |
| **Severidade** | `P2` — não é defeito de execução, mas viola o critério de sucesso 4 do pedido ("a documentação, o backlog e o código descrevem o mesmo estado") e induz replanejamento de trabalho já feito. |
| **Autoridade** | engenharia para descrever estado observado; **titular** para qualquer mudança de estado de gate, aceitação de risco ou ratificação. |
| **Correção mínima** | Estado único por gate, com a parte ainda bloqueada explicada. Evidências e dependências obsoletas atualizadas conforme `GDEC-0015`/`GDEC-0016`. G5 distingue suíte implementada de `MG-G5`. G8 distingue código de evidência operacional. Aviso de supersessão em `planejamento_de_sprints.md` **sem reescrever o encargo retroativamente**. READMEs e comentários que chamam ADR aceita de `not-started` corrigidos **sem alterar decisões**. Markdown, YAML e Mermaid sincronizados; YAML parseável por `yaml.safe_load`, sem IDs órfãos ou duplicados. |
| **Teste de aceite** | `yaml.safe_load` do backlog; `python3 scripts/check_doc_conventions.py`; `python3 scripts/check_forbidden_content.py`; inventário provando zero ID órfão, zero duplicata e estado idêntico por gate entre Markdown, YAML e Mermaid. |
| **Rastreabilidade** | `GDEC-0013`–`GDEC-0017`, `docs/14-devsecops-and-delivery/analise-pos-ciclo-6-mapa-vs-estado.md` |
| **Disposição** | `ic-reconciliador-docs` (ver §3) |

---

## 3. Despacho e escopo de escrita disjunto

Nenhum arquivo tem dois autores. A fiação em arquivos compartilhados
(`apps/api/src/{index,routes,db}.ts`, `packages/contratos/openapi.yaml`,
`package.json` da raiz, `HANDOFF.yaml`, `docs/15-release-evidence/**`) é aplicada
pelo **orquestrador**, a partir do handoff de cada especialista.

| Achado | Especialista | Tier | Escopo de escrita exclusivo |
|---|---|---|---|
| ACH-01 | `ic-fronteira-postgres-rls` | frontier | `packages/persistencia/src/postgres/**`, `session.ts`, `index.ts`, migrações `0003+`, `scripts/pg-efemero.mjs` |
| ACH-02 | `ic-identidade-auth` | frontier | `apps/api/src/auth/**`, `auth.ts`, `auth.test.ts` |
| ACH-03 | `ic-runtime-perfis` | frontier | `apps/api/src/config/**` |
| ACH-04 | `ic-regras-bundle` | frontier | `apps/api/src/regras/**`, `avaliacao.ts` |
| ACH-05 | `ic-eventos-tempo-real` | frontier | `packages/contratos/asyncapi.yaml`, `apps/api/src/eventos/**` |
| ACH-06 | `ic-prontidao-observabilidade` | frontier | `apps/api/src/saude/**` |
| ACH-07 | `ic-ux-resiliencia` | frontier | `apps/web/**` |
| ACH-08 | `ic-supply-chain` | frontier | `Dockerfile*`, `.github/workflows/supply-chain.yml`, `scripts/verificar-artefato.mjs` |
| ACH-09 | `ic-reconciliador-docs` | alto | `docs/14-devsecops-and-delivery/mapa-*`, `planejamento_de_sprints.md` |
| todos P0/P1 | `ic-revisor-adversarial` | frontier | **nenhum** — lente ofensiva, veredito por refutação |
| ACH-09 (apoio) | `ic-inventario-ids` | econômico | **nenhum** — inventário determinístico |

Definições completas em `.claude/agents/`; contrato comum em
`.claude/CONTRATO-DE-AGENTES.md`.

---

## 4. O que esta auditoria **não** encontrou

Registrado para que a ausência seja evidência, e não silêncio:

- **Nenhum** achado que exigisse enfraquecer invariante clínica, de tenant ou de
  evidência para ser corrigido.
- **Nenhuma** alteração do estado factual imutável: 0 vias acionáveis, 47/47
  inelegíveis, `Observation` não consumível, apenas candidato a integração,
  safety case M0, nenhum dado real acessado.
- **Nenhum** segredo, PHI, CPF, e-mail ou identificador realista no código
  auditado (`pnpm check:forbidden` verde no commit-base).
- **Nenhum** `continue-on-error` nem action sem SHA fixo nos workflows existentes.
- **Nenhum** dos achados do §6 do pedido resultou `RESOLVIDO` ou
  `NÃO APLICÁVEL` — os nove foram reproduzidos no commit-base.

A disposição final de cada achado, com teste vermelho→verde e evidência de
execução, está em `docs/15-release-evidence/final-implementation-report.md`.

---

## 5. Disposição final (2026-08-17)

Estado ao fim da rodada. `pnpm verify` **exit 0**, **1.441 testes verdes**,
**zero pulados**, **zero falhas**, **zero `expected fail`** (baseline: 1.026 +
1 `expected fail` P0).

| ID | Estado final | Evidência | O que permanece |
|---|---|---|---|
| ACH-01 | **RESOLVIDO com limite** | 36 testes bloqueantes contra PostgreSQL 16.14 real; migrações `0003` e `0004`; `expected fail` P0 **eliminado** (polaridade invertida, não escondida) | Não é "RLS verificada": exige `DEC-G0-02` e `MG-G6`. Troca de tenant entre transações distintas segue aberta — é `SEC-0001`, não fechável pelo banco |
| ACH-02 | **PARCIAL / BLOQUEADO** | 71 testes no escopo de autenticação, incluindo `alg=none`, confusão HS/RS, issuer, audiência, `kid`, rotação, `exp`/`nbf`, adulteração, cross-tenant, m2m e ausência de fallback | IdP real bloqueado por `BLK-0003` (`AUTH-SECURITY` UNASSIGNED). Adaptador OIDC só verificado contra servidor de teste local |
| ACH-03 | **RESOLVIDO** | 61 testes; `PERFIL` obrigatório sem default; PGlite/fixtures/sintético recusados fora de `test`/`dev-synthetic` | `PortaMigracao` (lock consultivo, versão durável de schema) sem implementação real |
| ACH-04 | **PARCIAL** | 34 testes; despachante versionado sobre bundle verificado; kill switch; rollback por `behaviorHash` | GCS **não despachável**: falta artefato de bundle, cuja autoria é ato clínico. 7 ratificações abertas (R1–R7) |
| ACH-05 | **RESOLVIDO com limite** | AsyncAPI 3.0.0; 148 verificações de contrato; entrega contínua provada por mutação | Não validado contra o JSON Schema oficial da AsyncAPI 3.0; enum de `WorkItem` não fechado; campos de `ADR-0010` B8 declarados em `x-pendencias` |
| ACH-06 | **RESOLVIDO com consequência** | 26 testes; três superfícies separadas com códigos coerentes | `/v1/readyz` responde **503 permanente** — retrato honesto de safety case M0, não defeito. Nenhum SLO inventado: todo `limiteMs` é `null` |
| ACH-07 | **PARCIAL** | 182 testes de unidade; 22 cenários de navegador; axe sem violação em 4 telas | Validação com tecnologias assistivas **NÃO EXECUTADA** (`MG-G4`); WCAG 2.4.11 sem teste dedicado |
| ACH-08 | **PARCIAL / BLOQUEADO** | Artefatos não-root medidos (UID 1000 e 101); SBOM determinístico; 33 casos de autoteste nos dois sentidos | Assinatura, proveniência e promoção **NÃO EXECUTADAS**; `supply-chain.yml` **nunca executou** |
| ACH-09 | **RESOLVIDO** | Estado por gate idêntico entre Markdown, YAML e Mermaid; gates documentais verdes | ~12 ocorrências de `not-started` obsoleto fora do escopo de escrita, listadas como pedido de desbloqueio |

### 5.1 Achados acrescentados por revisão adversarial independente

A primeira revisão devolveu **`REFUTADO`**. Isso é resultado do método, não
incidente: três cláusulas P1 tinham contraexemplo reproduzível contra banco real.

| # | Achado | Sev. | Estado |
|---|---|---|---|
| 1 | Escopo de tenant regravável pela aplicação — vazamento de leitura e escrita cross-tenant | P1 | **CORRIGIDO** (`0004_escopo_selado.sql`) |
| 2 | `abrir()` aceitava identidade que alcança o papel **dono**, que desliga a RLS | P1 | **CORRIGIDO** (`0003` + `pool.ts`) |
| 3 | Contenção de perfil sintético contornável por injeção | P1 | **CORRIGIDO** (`exigirCoerenciaDePerfil`) |
| 4 | `verify` verde não provava a fronteira P0 | P2 | **CORRIGIDO** (`services: postgres` em `ci-plataforma.yml`) |
| 5 | Asserções de ausência em SSE paravam por silêncio temporal | P2 | **CORRIGIDO** (ancoradas em quadro de controle, com não-vacuidade) |
| 6 | "bundle recusado fail-closed" impreciso; rótulo de sombra não viaja no corpo | P2 | **ACEITO como imprecisão** — corrigi-lo é mudança de contrato com consequência clínica |
| 7 | Poda de `check_forbidden_content.py` por nome livre | P3 | **CORRIGIDO** (ancorada por caminho, provada nos dois sentidos) |
| 8 | Declaração de bloqueio desatualizada em spec de E2E | P3 | **CORRIGIDO** |
| 9 | `POST /v1/dev/sessao` → HTTP 500 por re-derivação de perfil do ambiente **com `pnpm verify` verde** | P1 | **CORRIGIDO na raiz** |

O achado 9 é o mais instrutivo desta rodada: nenhum gate o pegaria, porque o
vitest define `NODE_ENV=test` e satisfaz a guarda por um caminho que o processo
real não tem. Ele só apareceu ao dirigir um navegador contra um servidor real.

### 5.2 Segunda revisão adversarial — sobre as correções

Veredito **`CONFIRMADO_COM_RESSALVAS`**. As três cláusulas P1 da primeira rodada
**não reabriram** sob ataque renovado contra PostgreSQL 16.14 real. Seis achados
novos, **todos P2/P3, nenhum P0 ou P1**:

| # | Achado | Sev. | Estado |
|---|---|---|---|
| 1 | Selo de escopo desfeito por `ROLLBACK TO SAVEPOINT` — não alcançável pela superfície do app; o que falha é a alegação, não o controle | P2 | **CORRIGIDO** |
| 2 | Invariante de papel/isolamento ignora MATERIALIZED VIEW, VIEW e FOREIGN TABLE | P2 | **CORRIGIDO** |
| 3 | Âncora de não-vacuidade aplicada a 2 de 3 sítios (`seguranca.test.ts` de fora) | P2 | **CORRIGIDO** |
| 4 | Cinco critérios WCAG declarados `executado` sem gate que execute a suíte | P2 | **CORRIGIDO** — job `e2e-navegador` bloqueante |
| 5 | Asserção tautológica sobre literal local | P3 | **CORRIGIDO** |
| 6 | Texto `BLOQUEADO` desatualizado servindo de razão a `test.skip` | P3 | **CORRIGIDO** |

**Observação aberta, não fechada:** o revisor relatou uma execução de
`pnpm verify` com exit 1 (Biome, `useLiteralKeys` como erro) que não reproduziu
em cinco execuções seguintes; o orquestrador também não conseguiu reproduzi-la
(`pnpm lint` devolve `6 infos`, exit 0, estável). Hipótese mais plausível:
árvore apanhada no meio de edição concorrente.
