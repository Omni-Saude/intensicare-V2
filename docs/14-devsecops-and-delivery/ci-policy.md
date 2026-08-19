---
doc_id: DEVSECOPS-CI-POLICY
status: PROPOSAL
owner: UNASSIGNED — VALIDAÇÃO NECESSÁRIA
source: INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §15.1 (Repository foundation), §15.2 (Environments and delivery), §3 regras 12-14; .github/workflows/docs-gates.yml, ci-plataforma.yml, metadados-gates.yml (este repositório); docs/06-architecture/adrs/ADR-0022-build-dependencias-supply-chain.md; docs/06-architecture/premissas-de-construcao.md; scripts/check_contratos.mjs e package.json da raiz (§5, acrescentado 2026-08-18, OBSERVADO)
date_collected: 2026-08-14
collector: especialista de fundação de repositório (ciclo 6, construção)
last_updated: 2026-08-18
addenda:
  - "§1.2 emenda (2026-08-18): ACH-O3-2 passa a FECHADO; o texto original é preservado como estado medido à época"
  - "§5 (2026-08-18): achado de método — mutação prova reprovação, não aceitação; e pnpm lint da raiz cobre formatação"
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

**Adendo 2026-08-18 — `ACH-O3-2` (ABERTO), registrado em §1.2 abaixo:** o
passo 2 (Typecheck) da tabela de `ci-plataforma.yml` não cobre arquivo de
teste em 7 dos 11 `tsconfig.json` do monorepo. Não reescreve a tabela nem o
texto acima — só qualifica, com uma nota datada logo após a tabela, o que
"compila sem erro em todo pacote/app" realmente cobre hoje.

**Emenda datada 2026-08-18 (fim da sessão) — `ACH-O3-2` passa a FECHADO.** O
parágrafo acima **fica intacto**: ele descrevia o estado **medido no instante
em que foi escrito**, não o estado final da sessão, e essa distinção é o
próprio ponto. Os **11** pacotes do monorepo passaram a typecheckar seus
testes. Ver §1.2, nota `ACH-O3-2`, subseção "Emenda" — inclusive o defeito
real que o fecho desmascarou, e que era invisível ao vitest por construção.

**Adendo 2026-08-18 — §5 (novo): um achado de MÉTODO sobre como este
repositório prova um gate.** Registrado com destaque porque muda o que se
exige de qualquer gate daqui em diante, e não é específico de nenhum dos
três workflows do §1: *mutação prova que um gate REPROVA o errado; nunca
prova que ele ACEITA o certo.*

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

**Nota — `ACH-O3-2` (ABERTO), o passo 2 (Typecheck) não cobre teste em toda a
árvore (correção de estado, 2026-08-18).** A linha do passo 2 acima —
"compila sem erro em todo pacote/app" — precisa ser lida como *todo `src/`
de produção*, não *todo arquivo TypeScript do workspace*. **OBSERVADO**
(leitura direta de cada `tsconfig.json` do monorepo por este agente,
2026-08-18): **7 dos 11** excluem `src/**/*.test.ts` do typecheck —
`apps/api`, `packages/contratos`, `packages/dominio`,
`packages/fixtures-sinteticas`, `packages/kernel-clinico`,
`packages/persistencia` e `packages/vigilancia`. Só `packages/conformidade`,
`packages/observabilidade`, `packages/rule-bundle` e `apps/web` cobrem os
testes no typecheck (os três primeiros por não terem `exclude` de teste
algum; `apps/web` não declara `exclude`). Consequência **relatada por quem
mediu o achado** (não reproduzida por este agente): mudar uma assinatura
exportada quebrou 3 casos de teste sem que `tsc` acusasse nada. O caso mais
preocupante é `packages/kernel-clinico` — os testes da regra clínica ficam
fora do typecheck, então uma mudança de tipo num export do kernel ou numa
fixture de **vetor de referência** só quebraria em execução, não em
compilação. **Não afirmamos aqui volume de erro latente algum** — isso é
medida do especialista que está corrigindo este achado, não deste documento,
e mudaria a cada correção aplicada.

Existe **precedente de correção já no repositório**: `packages/rule-bundle`
tem um `tsconfig.typecheck.json` separado (`extends` de `tsconfig.json`,
`include: ["src/**/*.ts", "test/**/*.ts"]`, `noEmit: true`, `exclude:
["dist"]`) e um script `"typecheck": "tsc -p tsconfig.typecheck.json
--noEmit"` próprio no `package.json` do pacote — a build (`tsconfig.json`,
que não pode emitir teste no artefato final) e o typecheck (que precisa
verificar tudo, incluindo `@ts-expect-error` que provam barreira de tipo,
ADR-0007 A7-1) ficam configurações distintas. **Este achado está sendo
medido e corrigido por outro agente no momento em que esta nota foi
escrita** (`tsconfig*.json`/`package.json` estão fora da fronteira de
escrita deste documento) — por exemplo,
`packages/contratos/tsconfig.typecheck.json` já existe no working tree nesta sessão, mas o
`package.json` daquele pacote ainda apontava seu script `typecheck` só para
`tsconfig.json` no instante desta observação. Este documento registra o
achado como **ABERTO**, não um estado de conclusão. `ACH-O3-2` é
documento-local (mesmo regime de `THR`/`QAS`/`CRV` da tabela §1.1 do
`traceability-policy.md`; a família `ACH-*` já está em uso alhures neste
repositório) — pendente de ratificação naquele §1.1, nenhum prefixo global
novo é cunhado aqui. **Ver a emenda datada ao final desta §1.2: o achado
passou a FECHADO até o fim da sessão de 2026-08-18.**

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

#### Emenda datada (2026-08-18, fim da sessão) — `ACH-O3-2` passa a FECHADO

A nota de `ACH-O3-2` acima **fica intacta**. Ela descrevia o estado **medido
no instante em que foi escrita** — "7 dos 11", "este achado está sendo medido
e corrigido por outro agente no momento em que esta nota foi escrita" —, e não
o estado final da sessão. Reescrevê-la apagaria a única prova de que o achado
existiu.

**Estado final relatado pelo orquestrador desta sessão** (`OBSERVED` por ele,
não por quem escreve esta emenda): os **11** pacotes/apps do monorepo passaram
a typecheckar seus arquivos de teste. O precedente citado naquela nota
(`packages/rule-bundle` com `tsconfig.typecheck.json` separado) foi a forma
adotada onde a build não pode emitir teste no artefato final.

**O que o fecho desmascarou — e é o motivo pelo qual esta emenda existe.** Ao
ligar o typecheck sobre os testes, apareceu um `import type` de `EventoFluxo`
apontando para um módulo onde **o símbolo não existe**. Ele era **invisível ao
vitest por construção**, não por descuido: `import type` é **apagado** antes de
qualquer resolução de módulo em runtime, então a suíte rodava verde sobre uma
importação que não resolvia. É a mesma classe de verde vácuo que o §3 deste
documento persegue, com um agravante — nenhuma quantidade de teste adicional a
teria encontrado, porque o defeito vivia justamente no que o runtime nunca vê.
Só o typecheck o alcança.

**Consequência prática, para não se perder:** um pacote cuja suíte está verde
**não** prova que os arquivos de teste desse pacote compilam. São duas
verificações distintas, e o passo 2 da tabela desta §1.2 só passou a cobrir as
duas depois deste fecho. Onde o `exclude` de teste voltar a um
`tsconfig.json`, a cobertura volta a valer só para `src/` de produção — e a
linha "compila sem erro em todo pacote/app" volta a precisar da qualificação
daquela nota.

**O que esta emenda NÃO faz.** Não aprova gate algum, não altera nenhum
`MG-*`, não afirma que o typecheck sobre testes elimina verde vácuo (o §5
abaixo mostra por que essa conclusão não se sustenta) e não nomeia owner.
`ACH-O3-2` continua sendo um ID **documento-local pendente de ratificação** em
`traceability-policy.md` §1.1; "FECHADO" aqui descreve o achado, não ratifica
o identificador.

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
- **A partir de 2026-08-18, tampouco afirma que um gate verde deste
  repositório aceita o documento correto.** Ver §5.

## 5. Achado de MÉTODO (2026-08-18) — mutação prova que um gate REPROVA o errado; nunca prova que ele ACEITA o certo

Esta seção não descreve um workflow. Ela registra uma **propriedade da forma
como este repositório vinha provando seus gates**, descoberta na quarta onda
de revisão adversarial desta sessão. Ela vale para todo gate presente e
futuro do §1 e do §2, e por isso está numa seção própria em vez de numa nota
de rodapé.

> **Mutação prova que um gate REPROVA o errado. Nunca prova que ele ACEITA o
> certo.**

### 5.1 A medida que produziu a frase

`scripts/check_contratos.mjs` — o gate de contrato rodado por
`pnpm check:contratos`, dentro de `pnpm verify` — tem uma **Parte G** que
compara o conjunto de propriedades de uma interface TypeScript com o schema
correspondente. O extrator dessa parte era **cego a `readonly`**: a expressão
que colhe os nomes de propriedade esperava dois espaços seguidos de
`nome:` e, com `readonly` entre eles, o `:` não estava onde ela o procurava.

`OBSERVED`, medido nesta sessão e verificado por este agente:

| Medida | Comando / método | Valor |
|---|---|---|
| Ocorrências de `readonly` em `apps/` + `packages/` (`.ts`/`.tsx`) | `grep -rn "readonly" --include="*.ts" --include="*.tsx" apps packages \| wc -l` | **4.824** |
| Ocorrências no único arquivo contra o qual a Parte G era testada | idem, restrito àquele arquivo | **zero** |

A faixa relatada pelo orquestrador (**4.775–5.329**) varia com o recorte
contado (com/sem `scripts/`, com/sem `dist/`); qualquer recorte razoável
mantém a mesma conclusão. `readonly` é o **estilo dominante** deste
repositório, e o extrator não o enxergava — porque o único arquivo contra o
qual ele fora exercitado era o único que não o usava.

### 5.2 As DUAS direções, e por que só uma delas era alcançável por mutação

**Direção 1 — falso-negativo (conhecida, e a que mutação pega).** Uma
propriedade acrescentada **só de um lado** e escrita com `readonly` passava:
o gate não a via, logo não a comparava. Uma bateria de mutação encontra isto,
porque mutação existe exatamente para perguntar *"se eu estragar isto, o gate
fica vermelho?"*.

**Direção 2 — falso-positivo (a pior, e a que NENHUMA bateria de mutação
pegaria).** Anotar `readonly` numa propriedade **já conforme** — sem mudar
mais nada, sem mudar o YAML, sem introduzir divergência alguma — fazia o gate
**reprovar um documento correto**. E aqui está o dano real: da posição de
quem lê a falha, o conserto natural é **apagar a propriedade do YAML**, que é
onde a mensagem aponta.

> **O gate ensinava o leitor a criar exatamente a divergência que ele existe
> para impedir.**

Mutação nunca chegaria a isto por construção: mutação **estraga** a entrada e
verifica se o gate reprova. A direção 2 exige a pergunta simétrica —
**preservar** a entrada correta (num estilo diferente) e verificar se o gate
**continua aceitando**. São perguntas distintas, e este repositório só vinha
fazendo a primeira.

### 5.3 O que mudou no autoteste, e o que continua exigido daqui em diante

O buraco foi fechado, e o autoteste de `check_contratos.mjs` ganhou um bloco
de **conformidade** ao lado do bloco de **mutação**. A asserção nova não é
"a cópia anotada passa" — isso seria satisfeito por um gate que não verifica
nada. É:

> *"a cópia anotada roda o MESMO número de verificações que a intocada
> (nenhuma checagem pulada)"* — `scripts/check_contratos.mjs`, bloco
> `HOLE-1`, direção falso-positivo.

Comparar **contagem de verificações**, e não apenas o veredito, é o que
distingue "aceitou porque está conforme" de "aceitou porque não olhou". Um
gate que pula silenciosamente a checagem também passa — e passaria verde.

**Exigência que este documento passa a registrar para qualquer gate futuro
do §2** (`PROPOSAL`, não ratificada — ver §0): todo gate deste repositório
precisa de **duas** provas, não uma.

| Prova | Pergunta | Falha que ela pega |
|---|---|---|
| Mutação | estragando a entrada, o gate fica **vermelho**? | gate que não verifica nada (falso-negativo) |
| Conformidade | reescrevendo a entrada correta num **estilo equivalente**, o gate continua **verde**, com o **mesmo número de verificações**? | gate que reprova o certo, e ensina o conserto errado (falso-positivo); gate que pula checagem em silêncio |

Isto é uma exigência de **método de prova**, não uma decisão de stack, de SLO
ou de limiar. Ela não ratifica nada e não altera nenhum `MG-*`.

### 5.4 Corolário operacional — `pnpm lint` da raiz cobre FORMATAÇÃO, e `biome check <caminhos>` não

`OBSERVED` (`package.json` da raiz, lido por este agente, 2026-08-18):

```json
"lint": "biome ci --error-on-warnings ."
```

Três diferenças que custaram uma reprovação de `pnpm verify` nesta sessão:

1. **`biome ci` verifica formatação**; `biome check` no modo usado por
   agentes normalmente não reporta a mesma coisa como falha bloqueante;
2. **o alvo é `.`** — o repositório inteiro. Um agente que roda
   `biome check <caminhos que eu toquei>` não vê arquivo algum fora do seu
   recorte, e é fora do recorte que a formatação diverge com mais
   frequência (arquivo tocado por outro agente na mesma onda);
3. **`--error-on-warnings`** torna bloqueante o diagnóstico nível `warn`,
   que os dois modos acima reportariam como aviso benigno.

**Medido nesta sessão:** uma divergência de **formatação** — não de lógica,
não de tipo — reprovou o `pnpm verify` da sessão, depois de agentes terem
verificado seus próprios recortes com `biome check`. A regra operacional que
sai daqui: **o único comando que responde "o lint passa?" é o `pnpm lint` da
raiz**; qualquer outro responde uma pergunta menor e não deve ser relatado
como se respondesse aquela.

### 5.5 Provenance desta seção

| Campo | Valor |
|---|---|
| `label` | `OBSERVED` para §5.1 (contagem verificada por este agente), §5.3 (asserção lida no arquivo) e §5.4 (script lido no `package.json`); `INFERENCE` para a generalização de §5.2 a gates futuros; `PROPOSAL` para a exigência de duas provas em §5.3 — não ratificada |
| `source_repo` | `intensicare-V2` |
| `path_or_url` | `scripts/check_contratos.mjs`; `package.json` (raiz) |
| `commit_sha_or_version` | working tree da branch `codex/lacunas-frontend-a11y` sobre `700b13e` |
| `section_or_lines` | `check_contratos.mjs:116,151-157,299-324,1209-1262,1342-1385,1571`; `package.json` (bloco `scripts`) |
| `date_collected` | 2026-08-18 |
| `collector` | agente de consistência documental e rastreabilidade (esta sessão) |
| `transformation` | achado relatado pelo orquestrador e **reproduzido por leitura do script atual** por este agente antes de ser escrito; a contagem de `readonly` foi executada por este agente (`grep`+`wc`); nenhum teste, build ou gate foi executado por ele além de `pnpm check:docs` e `pnpm check:forbidden` |
| `confidence` | high para as medidas; medium para a generalização a gates ainda não construídos (§2) |
| `owner` | UNASSIGNED — VALIDAÇÃO NECESSÁRIA |
| `validation_status` | VALIDAÇÃO NECESSÁRIA |
