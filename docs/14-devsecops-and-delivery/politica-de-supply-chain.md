---
doc_id: DEVSECOPS-POLITICA-SUPPLY-CHAIN
status: PROPOSAL
owner: UNASSIGNED — VALIDAÇÃO NECESSÁRIA
source: >
  ACH-08 (§6.8 do PROMPT_IMPLEMENTACAO_FINAL_INTENSICARE_V2.md);
  docs/06-architecture/adrs/ADR-0022-build-dependencias-supply-chain.md (§5.1 C1-C4, §5.2 S1-S8, §8.3);
  docs/06-architecture/adrs/ADR-0019-plataforma-implantacao-ambientes-residencia.md (§5.1 C1-C3, §5.2 P1-P7);
  docs/11-security-privacy-compliance/threat-model.md (TB-09, THR-0050..THR-0056);
  docs/14-devsecops-and-delivery/ci-policy.md; docs/14-devsecops-and-delivery/fluxo-cicd-promocao-evidencia.md;
  docs/06-architecture/premissas-de-construcao.md (PRE-01, PRE-03, PRE-11);
  execução direta neste repositório em 2026-08-17 (docker 29.5.2, Node 22.23.0, pnpm 9.0.0)
date_collected: 2026-08-17
collector: especialista ic-supply-chain (ACH-08, consolidação final)
last_updated: 2026-08-17
---

# Política de cadeia de suprimentos e promoção de artefato

**PROPOSAL.** Este documento **implementa** a política já registrada em
`ci-policy.md` e nos ADR-0019/ADR-0022 — não a redefine, não ratifica nada e
não fecha nenhuma condição aberta. Os limiares em
`scripts/politica-de-severidade.json` são **premissa reversível**: ADR-0022
§5.1 **C4** (AUTH-OPERATIONS) segue **ABERTA** e nenhum humano nomeado os
aprovou.

**Estado factual, inalterado por esta tarefa** (contrato §2): vias clínicas
acionáveis **0**; matriz de vias **47/47 inelegíveis**; safety case **M0**;
dados reais acessados **nenhum** (100% sintético, prefixo `SYNTH-`);
compatibilidade AMH **candidato a integração**. Construir um artefato de
contêiner **não** é release de produção e **não** altera nada disso. Por
ADR-0022 §8.3, nenhum artefato desta V2 é promovido além de dev/CI efêmero
enquanto S8 não fechar.

---

## 1. O que passou a existir (OBSERVADO 2026-08-17)

Antes desta tarefa: `ls apps/api/Dockerfile apps/web/Dockerfile` → *No such
file or directory* nos dois; `rg -lni "sbom|cyclonedx|syft|trivy|cosign|
provenance" .github/ scripts/` → nenhuma ferramenta de cadeia de suprimentos.
`ci-policy.md` §2 registra as linhas 3, 4, 5 e 10 do pipeline de 11 passos
como inexistentes.

| Arquivo | O que é |
|---|---|
| `.dockerignore` | Exclui `node_modules/`, `dist/`, `.git/` e segredo do contexto de build — força construção a partir do lockfile, não de resíduo da máquina (ADR-0022 D1; THR-0053, THR-0054). |
| `apps/api/Dockerfile` | Artefato Fastify multi-estágio, não-root (UID 1000), base pinada por digest. |
| `apps/web/Dockerfile` | Bundle estático servido por nginx não-privilegiado (UID 101), base pinada por digest. |
| `scripts/politica-de-severidade.json` | Todos os limiares, em dado legível, fora do código do verificador. |
| `scripts/verificar-artefato.mjs` | SBOM CycloneDX 1.6, licença, SCA, segredo, higiene de workflow, inspeção de imagem, autoteste. |
| `scripts/promover-por-digest.mjs` | Mecânica de promoção: exige digest, recusa tag, falha fechada em assinatura/proveniência. |
| `.github/workflows/supply-chain.yml` | Cinco jobs bloqueantes; nenhum `continue-on-error`; toda action por SHA de 40 caracteres. |

### 1.1 Resultados reais de execução

```
node scripts/verificar-artefato.mjs autoteste
  → 33 casos, cada gate ACEITANDO o conforme e RECUSANDO o não-conforme

node scripts/verificar-artefato.mjs workflows      → OK (4 workflows)
node scripts/verificar-artefato.mjs segredos       → OK (603 arquivos)
node scripts/verificar-artefato.mjs sbom  --filtro @intensicare/api → OK (56 componentes)
node scripts/verificar-artefato.mjs licencas --filtro @intensicare/api
  → OK — MIT=43 BSD-3-Clause=4 ISC=3 Apache-2.0=1, mais 5 de primeira parte
node scripts/verificar-artefato.mjs vulnerabilidades → OK (0 avisos, 68 dependências)
node scripts/verificar-artefato.mjs imagem intensicare/api:ensaio → OK (UID 1000)
```

| Artefato | UID de execução | Tamanho | devDeps | Fonte TS de 1ª parte |
|---|---|---|---|---|
| `apps/api` | **1000** | 66,0 MiB | 0 | 0 |
| `apps/web` (estágio de execução) | **101** | 22,1 MiB | 0 (sem `node_modules`) | 0 |

---

## 2. Os artefatos

### 2.1 Como a ausência de devDependencies é **garantida**, não prometida

O estágio de construção roda `pnpm --filter @intensicare/api --prod deploy
/artefato`, que monta uma árvore autossuficiente só com dependências de
runtime. OBSERVADO: o `node_modules` resultante tem no topo exatamente
`@electric-sql`, `@intensicare`, `fastify`, `zod` — nenhum `vitest`,
`typescript`, `biome`, `tsx`, `vite` ou `playwright`.

`pnpm deploy` copia o pacote conforme seu campo `files`, e para `apps/api`
isso **inclui `src/`, `tsconfig.json` e `vitest.config.ts`**. O Dockerfile
poda os três explicitamente, mais `*.map` e `*.d.ts`. Nada disso é
executável em produção, e o gate `verificar-artefato.mjs imagem` reprova se
algum sobreviver — a poda é verificada no artefato, não confiada ao autor.

### 2.2 Fonte TypeScript: a distinção que este documento faz de propósito

O critério de aceite pede "a imagem não contém fonte TypeScript". Medindo:

- **primeira parte** (nosso `src/`): **0**. Os pacotes do workspace declaram
  `files: ["dist"]`, então nem chegam a publicar fonte.
- **terceiros** (`node_modules`): **450** arquivos `.ts` — `zod/src/*.ts`,
  testes de tipo de `pino`, `ajv-formats/src/*.ts` e semelhantes, publicados
  assim pelos próprios autores.

Os 450 **não são removidos**, e a razão é substantiva: apagar arquivos de
dentro de pacotes de terceiro faria a árvore instalada deixar de corresponder
ao `pnpm-lock.yaml` de onde o SBOM é derivado. O artefato passaria a divergir
do seu próprio inventário — troca-se uma redução cosmética de superfície por
uma perda real de rastreabilidade, que é o oposto do que ADR-0022 D4 pede. A
contagem é **registrada como medição** em todo relatório, sem limiar de
reprovação, porque o limiar é de AUTH-OPERATIONS (§5.1 C4, ABERTA) e inventar
um violaria o contrato §6 anti-padrão 19.

### 2.3 Endurecimentos que o critério de aceite não pedia

- **Gerenciador de pacote removido do artefato de execução.** A base `node:*`
  embarca npm/npx/corepack. Num artefato de runtime, isso é um instalador
  capaz de buscar código arbitrário na rede à disposição de quem obtiver
  execução (THR-0050). O Dockerfile os remove e o gate confirma a ausência.
- **`USER` numérico (`1000:1000`, `101:101`).** Um runtime que aplique
  `runAsNonRoot` compara UID; `USER node` textual não é verificável sem
  resolver `/etc/passwd`.
- **Bases por digest, nunca por tag.** `node:22-alpine` é ponteiro mutável;
  dois builds do mesmo commit deixariam de ser comparáveis (THR-0054).

### 2.4 Dois defeitos encontrados **porque** a imagem foi executada

Ambos no `apps/web`, invisíveis na leitura do Dockerfile:

1. **Cabeçalhos de segurança silenciosamente descartados.** No nginx,
   `add_header` só é herdado do nível anterior se o nível atual não declarar
   nenhum `add_header` próprio. Um `add_header Cache-Control` dentro de
   `location = /index.html` apagou `X-Content-Type-Options`, `X-Frame-Options`
   e `Referrer-Policy` de toda resposta de `/`. Corrigido repetindo os três em
   cada `location` que declara cabeçalho.
2. **`Cache-Control` duplicado.** `expires 1y` emite seu próprio
   `Cache-Control`; somado ao `add_header`, a resposta saía com o cabeçalho
   duas vezes e cabia ao cliente escolher. Colapsado num só.

Registrados aqui porque são a evidência de que inspecionar o artefato em
execução encontra o que revisar o Dockerfile não encontra.

---

## 3. Limiares — e o que explicitamente **não** foi ratificado

`scripts/politica-de-severidade.json` concentra todo limiar. Nenhuma chave
do arquivo pode desligar um gate: não existe `continue_on_error`,
`advisory`, `warn_only` nem `skip`. Exceção só existe como entrada nominal e
datada, com dono, nunca como interruptor global.

| Decisão | Valor adotado | Estado |
|---|---|---|
| Formato de SBOM | CycloneDX 1.6 (ECMA-424, padrão aberto) | PREMISSA reversível — escolher formato não é escolher fornecedor |
| Origem de SBOM/licença | `pnpm` + lockfile (nenhuma ferramenta nova) | PREMISSA reversível |
| Severidade que reprova | `high` e acima | **VALIDAÇÃO NECESSÁRIA** — ADR-0022 §5.1 C4, AUTH-OPERATIONS |
| Licenças permitidas | MIT, ISC, Apache-2.0, BSD-2/3, 0BSD, Unlicense, CC0-1.0, BlueOak, Python-2.0, MIT-0 | PREMISSA — derivada do que o repositório usa hoje |
| Licença ausente/desconhecida | reprova | PREMISSA reversível |
| Scanner de imagem | Trivy 0.67.0 (open source), pinado por digest | PREMISSA reversível |
| "Mínimo" no artefato | Alpine + runtime, sem gerenciador de pacote | **VALIDAÇÃO NECESSÁRIA** — ADR-0022 D2/C4 |
| Base do artefato web | nginx não-privilegiado | PREMISSA reversível |
| `try_files ... /index.html` (SPA) | ativado | PREMISSA reversível — confirmar com o dono de `apps/web` |

**Nenhum provedor de nuvem, registro de artefato, região, residência de dado
ou ambiente AMH foi selecionado** — são `decisions_prohibited` e dependem de
ADR-0019 §5.1 C1/C2/C3, todas ABERTAS.

### 3.1 Duas bases de contêiner em vez de uma

`apps/api` executa JavaScript e precisa de runtime Node; `apps/web` serve
arquivo estático e não executa nada no servidor. Servir HTML com um
interpretador Node completo acrescentaria superfície sem função. O custo é
rastrear **duas** cadeias de base (THR-0054) em vez de uma — registrado aqui
como custo assumido, não como detalhe.

---

## 4. Como executar

```bash
# Artefatos (contexto é a RAIZ do repositório nos dois casos)
docker build -f apps/api/Dockerfile --build-arg REVISAO_GIT="$(git rev-parse HEAD)" \
  --build-arg CRIADO_EM="$(git log -1 --pretty=%cI)" -t intensicare/api:"$(git rev-parse --short HEAD)" .
docker build -f apps/web/Dockerfile --build-arg REVISAO_GIT="$(git rev-parse HEAD)" \
  --build-arg CRIADO_EM="$(git log -1 --pretty=%cI)" -t intensicare/web:"$(git rev-parse --short HEAD)" .

# Gates
node scripts/verificar-artefato.mjs autoteste
node scripts/verificar-artefato.mjs tudo --filtro @intensicare/api --saida evidencia/sbom-api.json
node scripts/verificar-artefato.mjs imagem intensicare/api:"$(git rev-parse --short HEAD)"

# Promoção — recusa tag, exige digest
node scripts/promover-por-digest.mjs --verificar intensicare/api@sha256:<64 hexadecimais>
```

Execução endurecida (o processo não escreve em disco):

```bash
docker run --rm --read-only --cap-drop=ALL --security-opt=no-new-privileges \
  --tmpfs /tmp:rw,noexec,nosuid,size=16m -p 3000:3000 <imagem-por-digest>
```

**SBOM determinístico.** Componentes ordenados por purl, `serialNumber`
derivado por hash do conteúdo (não sorteado) e `timestamp` emitido só quando
`SOURCE_DATE_EPOCH` é fornecido. VERIFICADO: duas execuções seguidas produzem
arquivos de sha256 idêntico. Sem isso, comparar dois builds do mesmo commit —
que é como se detecta substituição (THR-0054) — seria impossível.

---

## 5. Os gates, e o que cada um reprova

Todos **bloqueantes**. Todos **falham fechado**: ferramenta indisponível,
saída ilegível ou zero arquivos varridos produzem **reprovação**, nunca
aprovação por omissão (THR-0055).

| Gate | Reprova quando | Rastreio |
|---|---|---|
| `autoteste` | qualquer gate deixa de aceitar o conforme **ou** de recusar o não-conforme | THR-0055 |
| `workflows` | `continue-on-error`; action sem SHA de 40 caracteres; `pull_request_target`; ausência de `permissions:`; tag mutável; interpolação de metadado de PR em `run:` | ADR-0022 S4/S5; THR-0052 |
| `segredos` | formato de credencial em arquivo rastreado ou não rastreado não ignorado | ADR-0022 S6; THR-0053 |
| `sbom` | SBOM não parseável, sem componentes, ou com componente incompleto | ADR-0022 S8 |
| `licencas` | licença proibida, fora da lista permitida, ou ausente | ADR-0022 S6 |
| `vulnerabilidades` | aviso `high`/`critical`, **ou** audit inexecutável | ADR-0022 S6; THR-0050 |
| `sensiveis` | dependência sensível **não registrada** no grafo de produção | contrato §6 anti-padrão 9 |
| `imagem` | UID 0; sem `USER`; devDependency; fonte TS de 1ª parte; sourcemap; gerenciador de pacote | ADR-0022 S3 |
| `promover-por-digest` | referência por tag; ambiente não provisionado; assinatura ou proveniência não verificada | ADR-0022 S7/S8; ADR-0019 P1/P3; THR-0051 |

### 5.1 Provas de que os gates reprovam de fato

Um gate que só foi visto aprovando não é um gate. Executado nos dois sentidos:

- **Segredo plantado.** Arquivo temporário com formato de chave AWS e URL de
  banco com senha → scan REPROVOU nomeando `SEG-03` e `SEG-07`. Arquivo
  removido; `git status --short` sem resíduo; scan voltou a aprovar.
- **Workflow não conforme.** Seis fixtures — `continue-on-error`, action sem
  SHA, SHA de 39 caracteres, `pull_request_target`, `:latest`, injeção via
  `github.event.pull_request.title` — todos RECUSADOS; o fixture conforme,
  ACEITO.
- **Artefato não conforme.** `verificar-artefato.mjs imagem node:22-alpine`
  (a base crua) REPROVOU com 6 falhas: sem `USER`, UID 0, e npm/npx/corepack/
  yarn presentes. Imagem inexistente também reprova (falha fechada).
- **Promoção.** `:latest`, `:v1.2.3`, nome nu, digest curto e algoritmo
  não-`sha256` foram todos RECUSADOS; só `nome@sha256:<64 hex>` foi aceito.

### 5.2 Calibração do varredor de segredo — e por que ela está travada em teste

A primeira versão dos padrões produziu **5 achados contra o repositório real,
todos falso positivo**: JSDoc documentando o formato da URL de conexão em
`packages/persistencia`, texto de ajuda e uma interpolação `${...}` em
`scripts/pg-efemero.mjs`, e uma senha de teste `senha-errada-SYNTH`.

Isso foi tratado como defeito do gate, não como ruído aceitável: um gate que
grita em cima de documentação é desligado por quem trabalha, e um gate
desligado protege menos que um gate calibrado. As exclusões são três, todas
estreitas — senha interpolada (`${`, `<`, `%s`), palavra-marcador conhecida
(SENHA, senha, password, changeme, exemplo…) e valor contendo `SYNTH` (a
convenção deste repositório para material declaradamente não real). Uma
credencial de verdade não cai em nenhuma.

**As cinco linhas reais estão gravadas como casos do autoteste.** Se alguém
reapertar os padrões sem pensar, o autoteste quebra antes de o gate voltar a
gritar em cima de documentação.

---

## 6. Achados abertos que esta tarefa **não** pode fechar

### ACHADO — PGlite e fixtures sintéticas no grafo de produção de `apps/api`

**OBSERVADO:** `apps/api/package.json` declara `@electric-sql/pglite` e
`@intensicare/fixtures-sinteticas` como **dependências de produção**. Ambas
entram no artefato de execução; o gate `sensiveis` as reporta como **ACHADO
ABERTO** em toda execução.

O contrato §6 anti-padrão 9 proíbe "PGlite em memória, fixtures ou token
sintético em perfil não-dev". A distinção que importa: estar **instalada** e
estar **alcançável sob perfil não-dev** são coisas diferentes — o que impede
o alcance é código de `apps/api/src`, fora do escopo de escrita de ACH-08.

Por isso o gate **as registra nominalmente e não reprova**, mas **reprova
qualquer dependência sensível nova que não esteja na lista**. Reprovar o
pipeline inteiro por um defeito que este agente não tem permissão de corrigir
transferiria o custo sem transferir a capacidade. **Dono da correção:**
responsável por `apps/api/package.json` e `apps/api/src/**`.

### ACHADO ALTA — `apps/api` importa duas dependências que não declara

**OBSERVADO 2026-08-17**, durante a reconstrução do artefato de `apps/api`
sobre o estado concorrente da árvore de trabalho:

```
src/regras/bundle.ts(37,8):  error TS2307: Cannot find module '@intensicare/rule-bundle'
src/regras/index.ts(12,46):  error TS2307: Cannot find module '@intensicare/observabilidade'
```

`apps/api/src` importa `@intensicare/rule-bundle` e
`@intensicare/observabilidade`, e `apps/api/package.json` **não declara
nenhum dos dois** em `dependencies` (declara apenas contratos, dominio,
fixtures-sinteticas, kernel-clinico, persistencia).

**No host o build PASSA** (`pnpm --filter "@intensicare/api..." run build` →
0 erros). Isso não desmente o achado — é o mecanismo dele: a instalação do
workspace inteiro deixa os dois pacotes no `node_modules` da raiz, e a
resolução do TypeScript sobe até lá e os encontra. O build funciona **por
acidente de layout**, não porque a dependência exista.

**Por que isso é mais grave do que um erro de compilação.** OBSERVADO:
`pnpm --filter @intensicare/api --prod deploy` produz uma árvore de runtime
contendo cinco pacotes `@intensicare/*` — `rule-bundle` e `observabilidade`
**ausentes**, porque `deploy` monta o fecho a partir do que está
*declarado*. Ou seja: um Dockerfile que instalasse o workspace inteiro
compilaria sem erro e produziria um artefato que **falha no start com
`MODULE_NOT_FOUND`** — um artefato falso-verde (THR-0055), com build verde e
processo que não sobe.

**Por que o Dockerfile não contorna isso.** `apps/api/Dockerfile` usa
`pnpm install --frozen-lockfile --filter "@intensicare/api..."`, que instala
exatamente o fecho declarado. Trocar por uma instalação de workspace inteiro
faria o build passar hoje — e mascararia o defeito até ele reaparecer como
crash de inicialização. A instalação restrita é o que transforma uma
dependência fantasma em falha de build, alta e cedo. **Isso é o gate
funcionando, não o gate atrapalhando.**

**Correção (fora do escopo de escrita de ACH-08 — dono de
`apps/api/package.json`):** acrescentar as duas entradas a `dependencies` e
regravar o lockfile. Linhas exatas no handoff.

**Enquanto não for corrigido, o artefato de `apps/api` NÃO é construível a
partir de um fecho de dependências honesto.** A imagem descrita em §1.1
(UID 1000, 66,0 MiB, 0 devDeps) foi construída e verificada em estado
anterior da árvore de trabalho, antes de `src/regras/**` passar a importar os
dois pacotes.

Reprodução:

```bash
docker build -f apps/api/Dockerfile -t intensicare/api:ensaio .
pnpm --filter @intensicare/api --prod deploy /tmp/arvore && ls /tmp/arvore/node_modules/@intensicare/
```

### BLOQUEADO — artefato de `apps/web` não construído de ponta a ponta

`docker build -f apps/web/Dockerfile .` **falha**, com três erros de
TypeScript em arquivos de outro agente, em edição concorrente:

```
src/App.tsx(26,42):            error TS2554: Expected 1 arguments, but got 0.
src/api/clienteHttp.ts(245,52): error TS2304: Cannot find name 'EstadoCarregamento'.
src/api/clienteHttp.ts(495,11): error TS2353: 'method' does not exist in type 'AbortSignal'.
```

Os mesmos três erros ocorrem no host (`pnpm --filter @intensicare/web run
build`), o que estabelece que a causa **não** é o Dockerfile. O estágio de
execução foi verificado em isolamento contra um `dist/` previamente
construído: UID 101, sem `node_modules`, sem `.ts`, sem `.map`, HTTP 200 em
`/` e no fallback de SPA, cabeçalhos corretos, sob `--read-only
--cap-drop=ALL`. **O build de ponta a ponta permanece NÃO EXECUTADO** até que
`apps/web/src/**` compile.

Reprodução:

```bash
docker build -f apps/web/Dockerfile -t intensicare/web:ensaio .
```

---

## 7. O que **não** existe — e o pedido exato de provisionamento

Nada abaixo foi feito, e nenhuma alegação em contrário é permitida antes de
G8 (ADR-0022 S8, verbatim: as três capacidades são condição de entrada do
Gate G8).

| Capacidade | Estado | O que falta, e quem decide |
|---|---|---|
| **Assinatura de artefato** | **NÃO EXISTE** | Custódia de chave definida — ADR-0022 §5.1 **C3**, AUTH-SECURITY. |
| **Atestado de proveniência** | **NÃO EXISTE** | Identidade de assinatura do construtor; depende de C2 e C3. |
| **Registro de artefato** | **NÃO EXISTE** | ADR-0022 §5.1 **C2**, dependente de ADR-0019 §5.1 C2 (≥2 fornecedores com região no Brasil, medidos). |
| **Ambientes de promoção** | **NÃO EXISTEM** | ADR-0019 §5.2 **P1**: só há dev local e CI efêmero. `ambientes_provisionados` está deliberadamente **vazio**. |
| **Promoção real** | **NÃO OCORREU** | ADR-0022 §8.3 proíbe até S8 fechar. |

**Nenhuma chave de assinatura foi fabricada por este agente.** Isso é
deliberado: assinar com chave própria e apresentar o resultado como
assinatura produziria evidência de verificação que não ocorreu — a definição
literal de THR-0055. `promover-por-digest.mjs` trata verificador ausente como
**BLOQUEADO**, jamais como "assinatura dispensada".

### 7.1 Pedido de provisionamento (para o titular / AUTH-SECURITY / AUTH-OPERATIONS)

1. **Registro de artefato OCI** com região no Brasil (ADR-0019 P2 é critério
   eliminatório). Necessário: URL do registro e credencial de escopo mínimo,
   de escrita apenas no repositório de artefato.
2. **Chave de assinatura sob custódia declarada** — HSM/KMS ou identidade
   OIDC sem chave persistente. Necessário: âncora de confiança pública, a ser
   exportada como `INTENSICARE_COSIGN_RAIZ_CONFIANCA`, e o custodiante
   nomeado (que não pode ser o dono do pipeline — DEC-G0-06/RISK-0007).
3. **OIDC de CI** (`permissions: id-token: write`) para assinatura sem
   segredo de longa duração. Exige alteração de configuração de repositório —
   fora do alcance de agente.
4. **Ratificação dos limiares** de `politica-de-severidade.json` (severidade
   que reprova; o que conta como "mínimo") — ADR-0022 §5.1 C4.
5. **Decisão sobre tornar os cinco jobs de `supply-chain.yml` checks
   obrigatórios** de branch protection. Sem isso, os gates reportam mas não
   impedem merge — o mesmo gap que `ci-policy.md` §1 já registra e que
   ADR-0022 §5.1 C1 nomeia.

Enquanto (1)-(3) não existirem, a mecânica permanece verificável e testada,
e toda tentativa de promoção termina **BLOQUEADA** — que é o comportamento
correto, não uma falha.

---

## 8. Proveniência dos pins

Nenhum identificador abaixo foi inventado; todos foram resolvidos contra a
fonte real em 2026-08-17 e devem ser reconferidos periodicamente.

| Referência | Identificador | Como foi resolvido |
|---|---|---|
| `actions/checkout` v7.0.1 | `3d3c42e5aac5ba805825da76410c181273ba90b1` | API REST do GitHub; commit de 2026-07-17 (pin já vigente no repositório, reconferido) |
| `actions/setup-node` v7.0.0 | `820762786026740c76f36085b0efc47a31fe5020` | idem; commit de 2026-07-14 (idem) |
| `actions/upload-artifact` v5 | `330a01c490aca151604b8cf639adc76d48f6c5d4` | `git/refs/tags/v5` → commit; 2025-10-24 |
| `node:22-alpine` | `sha256:c610fcdfb1d5b4740dd70c284ed3cb16bb857e0f7166196e36a5501df7a3aa32` | `docker pull` + `RepoDigests`; Node v22.23.2 |
| `nginxinc/nginx-unprivileged:1.29-alpine` | `sha256:0c79d56aee561a1d81c63f00eee5fb5fe29279560cdc55e91425133104c7fbe6` | idem; `Config.User=101` |
| `aquasec/trivy:0.67.0` | `sha256:94711c60051c6cab848a292e3a67f62623fcee361b2bb661f43b17184f4afdac` | `docker buildx imagetools inspect` |
| `postgres:16-alpine` | `sha256:cf78e76683b9ca8c5733cbbdce6c9262b45b6767934dd0a95e671f9a0fc20685` | idem |

---

## 9. O que este documento **não** faz

- Não ratifica nenhum limiar nem fecha C1-C4 de ADR-0022 ou C1-C3 de ADR-0019.
- Não seleciona provedor de nuvem, registro, região, residência de dado ou
  ambiente AMH.
- Não afirma que qualquer artefato foi assinado, teve proveniência atestada
  ou foi promovido a qualquer ambiente.
- Não altera `ci-policy.md`, `fluxo-cicd-promocao-evidencia.md` nem
  `HANDOFF.yaml` — as linhas 3/4/5/10 da tabela §2 de `ci-policy.md` mudaram
  de estado e a reconciliação cabe ao orquestrador.
- Não configura proteção de branch nem chama a API do GitHub para alterar
  configuração de repositório.
- Não nomeia nenhum papel `AUTH-*` nem aceita risco em nome de ninguém.
