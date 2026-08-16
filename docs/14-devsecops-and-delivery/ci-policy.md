---
doc_id: DEVSECOPS-CI-POLICY
status: PROPOSAL
owner: UNASSIGNED — VALIDAÇÃO NECESSÁRIA
source: INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §15.1 (Repository foundation), §15.2 (Environments and delivery), §3 regras 12-14; .github/workflows/docs-gates.yml, ci-plataforma.yml, metadados-gates.yml (este repositório); docs/06-architecture/adrs/ADR-0022-build-dependencias-supply-chain.md; docs/06-architecture/premissas-de-construcao.md
date_collected: 2026-08-14
collector: especialista de fundação de repositório (ciclo 6, construção)
last_updated: 2026-08-16
---

# Política de CI — estado atual e estágios futuros

PROPOSAL — este documento não é, por si só, uma política ratificada; ele
exige ratificação DECIDIDA per `docs/00-governance/decision-rights.md`
antes de vincular alguém. É, no entanto, uma descrição OBSERVADA precisa
do que existe neste repositório em 2026-08-16, mais uma PROPOSAL de como
sequenciar os estágios de pipeline futuros contra o programa de ADR.

**Atualização 2026-08-16 (ciclo 6, MODO CONSTRUÇÃO — GDEC-0013..0017):**
a versão anterior deste documento (2026-08-14) descrevia `docs-gates.yml`
como "o único gate de CI que existe hoje". Isso deixou de ser verdade:
dois workflows adicionais — `ci-plataforma.yml` e `metadados-gates.yml`
— foram acrescentados nas fatias SPR-G7-1 e seguintes, e `ci-plataforma.yml`
por sua vez ganhou passos de typecheck/lint/fronteira de módulo nesta
fatia (§15.1 itens A/B/D). §1 abaixo foi reescrito para descrever os TRÊS
workflows reais. §2 foi ajustado onde a fatia SPR-G7-1 já cobre parte do
que antes era "não existe ainda".

## 0. Escopo deste documento

Este documento responde exatamente duas perguntas:

1. Quais gates de CI **existem hoje**, e são bloqueantes? (§1)
2. Quais estágios de pipeline do §15.2 do
   `INTENSICARE_V2_ORCHESTRATOR_PROMPT.md` **ainda não existem**, e o que
   especificamente bloqueia cada um? (§2)

Ele **não** escolhe stack de aplicação, provedor de nuvem, banco de dados,
broker, ou modelo de IA — essas escolhas são `decisions_prohibited` para
esta tarefa e são reservadas ao programa de ADR (prompt §10). Nada aqui
deve ser lido como afirmação de que qualquer estágio do §15.2 existe além
do que §1 declara. **Exceção registrada nesta atualização:** sob o regime
de MODO CONSTRUÇÃO (GDEC-0013/0015/0017), a construção prossegue sobre
**premissas reversíveis de uma linha** (`docs/06-architecture/premissas-de-construcao.md`,
PRE-01 a PRE-11) em vez de esperar aceite formal de ADR cláusula a
cláusula — isso é o que torna `ci-plataforma.yml` capaz de rodar
typecheck/lint/build/teste hoje, mesmo com a maioria dos ADRs de stack
ainda `not-started`/`PROPOSAL`. Isso não é uma escolha de stack feita por
este documento; é o registro de uma escolha já feita alhures (premissas
de construção) e materializada em CI.

## 1. O que existe hoje (OBSERVADO)

**OBSERVADO** (`.github/workflows/`, este repositório, 2026-08-16): três
workflows existem, todos disparados em todo `push` e `pull_request`
(exceto `metadados-gates.yml`, que roda só em PR contra `main` — ver
§1.3), todos com jobs em `ubuntu-latest`, todas as ações de terceiro
pinadas por SHA de commit completo (nunca tag mutável), e **todos os três
inteiramente BLOQUEANTES** — nenhum job/passo usa `continue-on-error` nem
qualquer mecanismo que deixe uma falha passar silenciosamente (prompt §3
regra 13; anti-padrão 11).

### 1.1 `docs-gates.yml` — convenções de documentação e conteúdo proibido/PHI

| Job | O que roda | O que verifica |
|---|---|---|
| `doc-conventions` | `python3 scripts/check_doc_conventions.py` | Todo arquivo sob `docs/**/*.md` tem um bloco de front-matter YAML carregando status/label, source/proveniência, uma data, e um owner/collector, usando os conjuntos de sinônimo documentados no script; sinaliza qualquer front-matter `status`/`label: DECIDED` (nenhum processo de ratificação existe ainda — ver `docs/00-governance/evidence-notation.md` §2 regra 3). |
| `forbidden-content` | `python3 scripts/check_forbidden_content.py` | `docs/`, `scripts/`, `.github/`, e o `README.md` da raiz contra strings no formato de credencial (tokens GitHub, chaves de acesso AWS, cabeçalhos de chave privada PEM), padrões de dígito no formato CPF, endereços de e-mail não permitidos em lista, e uma string canário reservada para dado sintético. |

**Por quê:** este é o gate que impede vazamento de PHI/segredo e
degradação silenciosa da disciplina de evidência (rótulos OBSERVED/
SOURCE/PROPOSAL/DECIDED) desde o primeiro commit — ver
`docs/00-governance/evidence-notation.md`.

### 1.2 `ci-plataforma.yml` — qualidade, fronteira de módulo, build e teste do monorepo

**OBSERVADO** (2026-08-16): um job (`build-and-test`), com os seguintes
passos bloqueantes em sequência, na mesma ordem que `pnpm verify` roda na
raiz do repositório:

| # | Passo | Comando | O que verifica | Por quê |
|---|---|---|---|---|
| 1 | Instalar dependências | `pnpm install --frozen-lockfile` | O `pnpm-lock.yaml` committado bate exatamente com os manifestos — nenhuma resolução de dependência "ao vivo" em CI. | ADR-0022 S1 (lockfile pinado); THR-0050 (dependência maliciosa/typosquat) do `threat-model.md`. |
| 2 | Typecheck | `pnpm typecheck` (`pnpm -r --if-present run typecheck`) | TypeScript estrito (`tsconfig.base.json`: `strict`, `noUncheckedIndexedAccess`, etc.) compila sem erro em todo pacote/app. | PRE-01 (`docs/06-architecture/premissas-de-construcao.md`): a plataforma é Node.js 22 LTS + TypeScript em modo estrito. |
| 3 | Lint e formatação | `pnpm lint` (`biome ci --error-on-warnings`) | Formatação, imports não usados/desorganizados, variáveis não usadas, e um subconjunto de regras de correção (ver `biome.jsonc` na raiz) — bloqueante mesmo para diagnóstico nível `warn` (`--error-on-warnings`). | §15.1 item A (gate de lint/formatação bloqueante, uma ferramenta só). |
| 4 | Fronteira de módulo | `pnpm check:boundaries` (`scripts/check_module_boundaries.mjs`) | Cada pacote/app do workspace só declara dependência de workspace na direção permitida por ADR-0002 (ex.: `kernel-clinico` não pode depender de nada do workspace; `apps/web` só pode depender de `contratos`). | ADR-0022 §5.1 C5 é exatamente esta verificação: "um mecanismo de imposição de fronteira é especificado e é bloqueante de build, não consultivo". |
| 5 | Build | `pnpm -r build` | Todo pacote/app compila (`tsc`) e, onde aplicável, empacota (`vite build` em `apps/web`). | ADR-0022 S3 (artefato final mínimo — a compilação é o primeiro passo dessa cadeia). |
| 6 | Testes | `pnpm -r test -- --run` | Toda suíte Vitest do workspace, incluindo `packages/persistencia` (RLS por tenant, outbox transacional, e o teste de clean-install da migração SQL — ver nota abaixo) e `packages/kernel-clinico` (kernel clínico determinístico). | PRE-08 (Vitest + fast-check); ADR-0022 S4 (gate bloqueante desde o primeiro commit). |

**Nota — teste de clean-install da migração SQL:** `packages/persistencia`
não tem um passo de CI dedicado para isso porque **já roda dentro do
passo 6 acima, em toda execução**. `packages/persistencia/src/test-support.ts`
(`createTestDatabase()`) cria um PGlite novo e chama `runMigrations()` —
que aplica `src/migrations/0001_init.sql` e `0002_g7_integration.sql` do
zero — antes de cada bloco de teste que precisa de banco;
`packages/persistencia/src/migration-and-rls.test.ts`, describe "migração
SQL pura (0001_init.sql)", é a asserção mais direta disso (usuário/role
pós-migração correto; todas as tabelas clínicas esperadas presentes).

**Nota — o teste `it.fails` de `packages/persistencia`:** uma suíte
(`packages/persistencia/src/seguranca.test.ts`) contém um teste
deliberadamente marcado `it.fails`, documentando um achado de segurança
conhecido (ACHADO-01) que ainda precisa ser corrigido. **OBSERVADO**: o
Vitest trata `it.fails` cujo corpo lança como um PASS da suíte — o passo 6
acima encerra com código de saída `0` incluindo esse pacote (relatório
`33 passed | 1 expected fail`), sem nenhum ajuste especial de agregação.
Se esse teste um dia parar de falhar por dentro sem que ACHADO-01 tenha
sido corrigido de fato, isso é, ele mesmo, uma instância de THR-0055
(gate falso-verde) e deve ser tratado como incidente, não como melhoria.

**Relação com ADR-0022:** este workflow é a materialização em CI da
Opção A de ADR-0022 (aceita como direção, GDEC-0016) — lockfile pinado +
instalação congelada, gates bloqueantes de formatação/lint/tipo/teste
desde o primeiro commit, com **SBOM, atestado de proveniência e
assinatura de artefato explicitamente diferidos para o Gate G8** (ADR-0022
§5.2 S8) — nada neste workflow gera ou verifica SBOM/assinatura, e nenhuma
alegação nesse sentido é feita aqui.

### 1.3 `metadados-gates.yml` — metadados de mudança / rastreabilidade

| Job | O que roda | O que verifica |
|---|---|---|
| `change-metadata` | `python3 scripts/check_change_metadata.py --base <sha> --head <sha>` | O corpo do PR ou algum commit do intervalo `base..head` referencia ao menos um ID da taxonomia de rastreabilidade (`docs/00-governance/traceability-policy.md` §1/§1.1), per `docs/14-devsecops-and-delivery/politica-de-metadados-de-mudanca.md`. |

Dispara só em `pull_request` contra `main` (não em todo `push`), porque a
verificação precisa do intervalo `base..head` de um PR real —
`fetch-depth: 0` no checkout garante que o histórico completo do PR está
disponível.

**Isto é a totalidade da superfície de CI deste repositório hoje.** Não
existe SBOM, passo de assinatura, ou deploy de qualquer tipo — nenhum
desses pode existir sem uma plataforma/registro de artefato selecionado
(ADR-0019, ADR-0022 §5.1 C2/C3, ambas abertas).

**Um gap que este documento registra em vez de esconder:** estes três
workflows rodando e reportando pass/fail em todo push/PR **não** é o
mesmo que eles estarem *impostos* (enforced). Imposição (bloquear um
merge num check vermelho) exige proteção de branch configurada por um
admin do repositório, o que não foi feito — ver `branch-protection-request.md`
neste diretório, status **BLOQUEADO**. Até que isso seja configurado, um
humano com acesso de escrita poderia mesclar além de um check vermelho.
Esse gap está, ele mesmo, registrado como bloqueador, não silenciosamente
aceito como aceitável. ADR-0022 §5.1 condição C1 nomeia formalmente este
mesmo gap.

## 2. O que ainda NÃO existe, e o que bloqueia cada estágio (PROPOSAL)

`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md` §15.2 lista um pipeline de 11
passos. A tabela abaixo foi atualizada em 2026-08-16 para refletir que os
passos 1-2 **parcialmente** existem agora (typecheck/lint/fronteira/build/
teste, per §1.2), embora a cadeia completa de validação de contrato/
schema/migração ligada a ADRs específicos ainda não exista.

| §15.2 passo | O que exige | Bloqueado por |
|---|---|---|
| 1. Validar fonte, schemas, docs, status de ADR, migrações, contratos, rastreabilidade | Um formato de schema/contrato/migração para validar | **Parcial**: typecheck (TS estrito) e docs-gates.yml existem; validação de contrato OpenAPI/schema formal aguarda ADR-0012 (`not-started`) |
| 2. Testes determinísticos + suítes de integração/E2E baseadas em risco | Um test runner e framework de teste | **Parcial**: Vitest + fast-check rodam em CI (§1.2); vetores de referência clínicos red/green e testes de mutação (Stryker) ficam como pendência registrada (PRE-08) |
| 3. Construir artefato mínimo não-root a partir de dependências de runtime dedicadas | Um toolchain de build e política de imagem/runtime base | **Parcial**: `pnpm -r build` compila; artefato final mínimo não-root (ADR-0022 S3) ainda não construído — nenhum Dockerfile/imagem existe neste repositório |
| 4. Gerar SBOM, resultados de vulnerabilidade/licença, atestados de proveniência, artefatos assinados imutáveis | Ferramental de SBOM específico de linguagem; política de chave de assinatura e atestado | ADR-0022 §5.1 C2 (fornecedor/registro de artefato — depende de ADR-0019) e C3 (custódia de chave); explicitamente nomeado como pendência de Gate G8 (ADR-0022 S8) |
| 5. Implantar por digest para um ambiente efêmero | Um alvo de implantação | ADR-0019 (plataforma/provedor de nuvem — prompt §3 regra 14 proíbe explicitamente escolher isso sem ADR) |
| 6. Rodar migrações com estratégia de compatibilidade/backup/timeout/rollback | Um banco de produção | ADR-0019; hoje só existe PGlite em dev/teste (PRE-03) |
| 7. Conformidade AMH/conector, sondas de segurança sintéticas, segurança, acessibilidade, performance, checagens de restore | Uma fronteira e contrato AMH resolvidos | Gate G3 (compatibilidade AMH), ele mesmo bloqueado — ver `docs/08-interoperability/amh-data/four-layer-dossier.md` e `BLK-0010` no registro de bloqueadores |
| 8. Criar um pacote de evidência de release | Passos 1-7 para produzir evidência | Todos os itens acima |
| 9. Exigir aprovações de separação de deveres | Humanos nomeados distintos que não são a mesma pessoa nos dois lados de um par de independência exigido | Gate G0 — todo papel `AUTH-*` está `UNASSIGNED — VALIDAÇÃO NECESSÁRIA` (`docs/00-governance/authority-model.md` §1; `BLK-0001`–`BLK-0008`) |
| 10. Promover o artefato idêntico através de ambientes | Ambientes (dev/preview/integração/staging/shadow/piloto/produção) para promover através | ADR-0019 (prompt §15.2: "Use infraestrutura como código só depois do ADR de plataforma") |
| 11. Rollback/roll-forward rápido, kill switch de regra, isolamento de conector, reconciliação | Um sistema rodando com motor de regra e conectores | Todos os itens acima |

**Esta tarefa não tenta construir ou agendar nenhum dos itens acima além
do que §1 já descreve.** Fazê-lo seria uma decisão de seleção de stack,
o que é explicitamente `decisions_prohibited` para a tarefa que produziu
este documento.

## 3. A regra que não muda independente da stack

Per `INTENSICARE_V2_ORCHESTRATOR_PROMPT.md` §3 regra 13, verbatim: **"No
production release may rely on advisory/non-blocking safety,
tenant-isolation, migration, security, accessibility, contract, restore,
or clinical test gates."** Isso se aplica a todo estágio futuro do §2
acima, exatamente como se aplica aos três gates que existem hoje: quando
um gate é construído, ele precisa ser um check de status obrigatório e
bloqueante desde o momento em que é acrescentado — nunca
`continue-on-error: true`, nunca um modo "só aviso" pensado para ser
apertado "depois". O passo de lint de `ci-plataforma.yml` (§1.2, passo 3)
segue essa mesma regra: usa `biome ci --error-on-warnings`, não apenas
`biome ci`, precisamente para que um diagnóstico nível `warn` (não só
`error`) também bloqueie — nenhuma categoria de diagnóstico é
silenciosamente tolerada.

**Um exemplo cautelar OBSERVADO, não uma crítica às escolhas de
engenharia de terceiros em geral:** `docs/08-interoperability/amh-data/claim-verification-matrix.md`
registra (re-verificando `README.md` num commit pinado de
`Omni-Saude/amh-data-platform`) que, naquele repositório externo, "o
único check de status obrigatório é `Security Gate`... os workflows de
demonstração rodam mas não bloqueiam merge, e vários estavam vermelhos no
momento do snapshot observado". Isso está registrado aqui como o
anti-padrão exato que a regra 13 proíbe a V2 de adotar — evidência de que
gates de CI não-bloqueantes são o modo de falha padrão observado na
indústria a planejar contra, não um risco inventado.

## 4. O que este documento explicitamente não faz

- Não habilita proteção de branch nem chama a API do GitHub/CLI `gh` para
  mudar qualquer configuração de repositório (ver
  `branch-protection-request.md`).
- Não aprova nenhuma exceção de segurança.
- Não afirma que qualquer estágio do §15.2 existe além do que §1 declara.
- Não escolhe stack, plataforma, banco de dados, ou modelo de IA — as
  premissas de construção citadas em §0/§1.2 (`docs/06-architecture/premissas-de-construcao.md`)
  já foram registradas alhures, por outro agente, sob o regime de MODO
  CONSTRUÇÃO; este documento apenas descreve a materialização delas em CI.
