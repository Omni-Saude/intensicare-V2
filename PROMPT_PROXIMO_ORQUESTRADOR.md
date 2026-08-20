# Encargo — o que a onda 4 derrubou, e o que ficou de pé

**Escrito em** 2026-08-18, ao fim das ondas 3 e 4.
**Branch** `codex/lacunas-frontend-a11y`. **PR #8 aberto e NÃO mesclado.**
**`main`** = `7eef8c0`. Nada foi mesclado; merge é ato do titular (`GDEC-0014`).

---

## 0. Leia primeiro, nesta ordem

1. `HANDOFF.yaml`, seção **`ondas_3_e_4_2026_08_18`** — é o estado vivo e
   supersede tudo o que veio antes no que toca ao código. As seções anteriores
   **não** foram reescritas: os números delas eram corretos quando escritos.
2. `.claude/CONTRATO-DE-AGENTES.md` e `.claude/agents/`.
3. Os registros de `ACH-O3-1` a `ACH-O3-16` em `docs/**`.

> **Este arquivo é ROLANTE.** Ele carrega sempre o encargo da PRÓXIMA sessão, e
> é reescrito ao fim de cada uma. O encargo que a sessão anterior executou está
> arquivado, íntegro e sob nome datado, em
> **`ENCARGO_ONDAS_3_E_4_2026-08-18.md`** — leia-o se precisar saber o que foi
> pedido, e não só o que foi entregue. Ao encerrar a sua sessão, **arquive este
> arquivo do mesmo modo antes de sobrescrevê-lo**: o `git log` guarda a versão
> antiga, mas quem lê a árvore de trabalho não a vê, e foi assim que a fronteira
> entre "o que foi pedido" e "o que se pede agora" quase se perdeu.

## 1. As duas regras que mais economizam tempo aqui

**Nunca rode `pnpm verify` com outro trabalho em curso.** Um sozinho leva esta
máquina a load ~28; com quatro agentes em paralelo eu medi **76**. Confira
`uptime` (média de 5 min < 4) **antes** de concluir de um vermelho.

**Nunca meça exit code através de um pipe.** `pnpm verify | tail` devolve o exit
do `tail`. Eu li "exit 0" e quase reportei verde uma `verify` que havia
**reprovado** por formatação. E note: `pnpm lint` da raiz é
`biome ci --error-on-warnings .` e cobre **formatação** — um agente que roda
`biome check <caminhos>` não vê isso.

**Antes de qualquer execução alvo:** `pnpm --filter @intensicare/contratos build`.
`apps/api` e `apps/web` resolvem o contrato por `dist/`; sem rebuild você vê ~33
vermelhos com mensagem que não aponta a causa.

---

## 2. O que a onda 4 provou sobre método — leia antes de escrever qualquer teste

Três revisores adversariais com lentes distintas, somente leitura, contra árvore
congelada. **Os três refutaram.** 25 achados numa branch com `pnpm verify` exit 0.

### 2.1 Mutação prova que um gate REPROVA o errado. Nunca que ele ACEITA o certo.

O extrator da Parte G do gate de contrato era cego a `readonly` — milhares de
ocorrências no repositório, **zero** no único arquivo contra o qual foi testado.
A direção conhecida (propriedade `readonly` só de um lado passa) já era ruim. A
outra é pior e **nenhuma bateria de mutação a pegaria**: anotar `readonly` numa
propriedade **já conforme** fazia o gate **reprovar documento correto**, e o
conserto natural de quem lesse a falha era apagar a propriedade do YAML — **o
gate ensinava a criar a divergência que existe para impedir.**

Todo gate precisa de um bloco de **conformidade** ("a entrada correta continua
sendo aceita, e roda o mesmo número de verificações"), não só de mutação.

### 2.2 Uma tripwire pode estar testando a imaginação do autor

`expect(JSON.stringify(saneado)).not.toContain('"acionavel":true')` parecia
guarda forte. Passava porque a forja do autor punha o campo **dentro** de
`despacho`. No **topo**, atravessava — código e asserção juntos. A correção certa
foi enumerar **17 posições** de injeção, cada uma com âncora própria, com e sem
autoridade, mais varredura recursiva.

### 2.3 Uma guarda pode ser invisível à suíte inteira

Duas das três guardas fail-closed de `lerModoDeDespacho` podiam ser **removidas**
com os 387 testes de `apps/api` **verdes** — porque todo vetor carregava
`assinatura_verificada` e só a terceira guarda decidia. Ao provar não-vacuidade,
**mute também a vizinha óbvia**, não só a que confirma sua hipótese.

### 2.4 Fiar código morto é o que revela defeito

O transporte SSE tinha **80 testes verdes e zero consumidores**. Foi a fiação —
não mais teste do módulo isolado — que expôs três defeitos, o pior deles: um
`EventSource` ausente derrubava a aplicação inteira e levava junto o **polling**,
que é o caminho de verdade de `ADR-0011` P8 e não depende de push.

---

## 3. O que continua ABERTO

### `ACH-O3-1` (P1) — integridade do registro persistido

**Alcance corrigido, e é maior do que a versão anterior dizia.** Não é "fabrica
só um escore". Quem escreve em `evaluation_records` no escopo do tenant:
**oculta deterioração** (11/`critico` → 0/`normal` mantendo `statusAvaliacao:
"valido"` e `frescor: "atual"`), **substitui o item de trabalho**, e
`explicacao`/`anotacoes`/`motivos` **são renderizados** — o atacante escreve
prosa em português na tela do intensivista.

A allow-list que fechou `ACH-O3-5` filtra por **CHAVE**, não por **VALOR**. Há
teste que afirma isso explicitamente. **Quando alguém estender a filtragem a
valores, essa asserção precisa ser INVERTIDA para provar o fecho — nunca
enfraquecida nem removida.**

Fechar exige assinatura/HMAC/digest de linha em `packages/persistencia`, e
provavelmente a mesma custódia de chave que `ADR-0007` C5 mantém aberta.

### `ACH-O3-15` (novo, pré-existente) — recusa legítima nunca concilia

`desfecho: "nao_avaliada"` com `modo: null` **nunca** concilia com autoridade,
porque a conciliação exige `modoAlegado === entrada.modo` e esse é sempre
`sombra`/`acionavel`. Resultado: despacho recusado publica `null` em vez do
envelope com `motivoRecusa` visível. Direção fail-closed, mas **perde a razão
nomeada** — toca `QAS-0023`. **Exige desenho, não ajuste.**

### `ACH-O3-16` (novo) — o catálogo de eventos já diverge do código

`docs/09-api-events-and-mcp/catalogo-de-eventos.md` §5.2 lista 4 tipos onde o
enum tem 5, e duas formas de payload não batem com o que `db.ts` emite.
**Quem for tipar `dados` por variante NÃO pode copiar do §5.2** — precisa
redigir contra o código e ratificar.

### `ACH-O3-6` (parcial), `ACH-O3-8`, F3 residual

`sequencia` negativa fechada; tipar `dados` segue aberto. O cursor é derivado de
`bigserial` **global** e mede o volume de escrita dos outros tenants (nenhuma
linha vaza). F3 foi varrido por amostra, não exaustivamente.

### A verificação criptográfica nunca roda

`portaDeBundleDoLivroRazao` e `registrarBundleAprovado` **não têm chamador fora
de teste**. `verifyBundle` — a única verificação criptográfica do repositório —
**nunca roda em runtime**. A "autoridade" contra a qual tudo é conciliado é
"este processo carregou este artefato do disco". É autoridade real contra o
modelo de ameaça vigente (escrita no banco) e **nula** contra atacante com
escrita no sistema de arquivos ou no artefato de build. Diga isso com todas as
letras antes de alegar qualquer coisa sobre assinatura.

---

## 4. O que permanece ATO HUMANO — não fabrique, não simule

| Pendência | Quem |
|---|---|
| **Ordem de severidade de frescor EXIBIDA** — só a direção fail-closed foi engenharia | `AUTH-CLINSAFETY` |
| **Ausência de selo de frescor em TODO cartão** — a projeção não publica contribuições; não afirmar é correto, mas a aceitabilidade clínica (ou publicar frescor na projeção) é decisão de contrato | `AUTH-CLINSAFETY` + titular |
| **Texto de "entrega em tempo quase-real interrompida em definitivo"** — hoje reusa o genérico de `degradado` | `ADR-0029` C2 |
| `ADR-0007` C5 — custódia de chave (bloqueia `ACH-O3-1`) | titular |
| `ADR-0015` — IdP real; direção aceita (`GDEC-0016`), IdP ainda não contratado (bloqueia WCAG 2.2.1) | titular |
| `MG-G4`, `MG-G6`, `MG-G7`, `MG-G8` | titular / autoridades nomeadas |
| `VAL-0023` (cadência de releitura), `VAL-0027/0029/0031/0033` (piso de 3 usuários **reais** de TA) | pesquisa de campo |
| Topologia: `ACH-O3-8` (cursor escopado) e ambiente que permita `CREATE EVENT TRIGGER` | titular |
| Merge do PR #8 | titular (`GDEC-0014`) |

**Nenhum gate foi aprovado. Nenhum hazard foi fechado.** Os achados fechados
**não** fecham `HAZ-0025`, `SAF-0025`, `QAS-0023` nem `HAZ-0001/0002` — reduzem
exposição medida. Estado factual duro, inalterado: **0 vias clínicas acionáveis;
47/47 inelegíveis; `Observation` da AMH não consumível; safety case M0; nenhum
dado real acessado.**

---

## 5. Comandos de retomada — cada número nomeia o comando que o produz

```bash
git checkout codex/lacunas-frontend-a11y
uptime                                     # média de 5 min < 4 antes de medir
pnpm --filter @intensicare/contratos build # SEMPRE antes de execução alvo

pnpm verify                                # exit 0 — 1.973 passed | 1 skipped
cd apps/web && pnpm exec playwright test --workers=1          # 57/57
cd packages/persistencia && IC_FRONTEIRA_PG=obrigatoria pnpm exec vitest run  # 99/99
pnpm test:fronteira                        # 63/63 — UM arquivo, escopo DIFERENTE
pnpm check:contratos                       # 258 verificações + autoteste 99 casos
```

O **único** teste pulado é `apps/api/src/db.test.ts`, condicionado a
`PG_TEST_URL`. **Não é skip permanente** — com PostgreSQL real dá 3/3, e ele
falha alto em CI e sob `IC_FRONTEIRA_PG=obrigatoria`.

**PERIGO:** `cycle-4/*`, `cycle-5/*`, `codex/finalizacao-plataforma-v2` e
`codex/sexta-revisao-adversarial` **não são ancestrais da `main` nem desta
branch** (verificado com `git merge-base --is-ancestor`). Não os mescle para
"recuperar" trabalho sem análise de conflito — o PR #6 foi fechado sem merge
exatamente por isso.

---

## 6. Não presuma convergência

A taxa de achado **nunca** convergiu neste projeto: **8, 6, 9, 12, 12** nas
rodadas anteriores, e **25** nesta. A quinta reabriu classe que a quarta
declarava fechada. A revisão do PR #8 achou 4 P1 com CI verde. E esta onda achou
um **P0** numa superfície que dois fechos anteriores nunca enumeraram — porque
`ACH-REV8-3` foi fechado em **duas** superfícies de leitura e havia uma
**terceira**.

Se você fechar um achado, **enumere todas as superfícies** antes de dizer
"fechado". Foi exatamente isso que faltou duas vezes seguidas.
