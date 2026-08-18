# Encargo — ondas 3 e 4: tempo real, navegação, carga e refutação

**Escrito em** 2026-08-18, ao fim das ondas 1 e 2.
**Branch** `codex/lacunas-frontend-a11y`, HEAD `ec97f61`, **PR #8 aberto**.
**`main`** = `7eef8c0`. Nada foi mesclado; merge é ato do titular (`GDEC-0014`).

---

## 0. Leia primeiro, nesta ordem

1. `HANDOFF.yaml` — seções `analise_de_lacunas_frontend_2026_08_18`,
   `vigilancia_despacho_contrato_2026_08_18` e `ondas_1_e_2_2026_08_18`.
2. `docs/10-ux-and-accessibility/analise-de-lacunas-frontend.md` — LAC-D1..D8
   (defeitos corrigidos) e LAC-L1..L9 (lacunas registradas). **As ondas 3 e 4
   deste encargo são LAC-L1, LAC-L4 e a lacuna de carga.**
3. `.claude/CONTRATO-DE-AGENTES.md` e `.claude/agents/` — os especialistas
   estreitos e suas fronteiras de escrita **disjuntas**.

## 1. A regra que mais economiza tempo aqui

**Nunca rode `pnpm verify` com outro trabalho em curso.** Um sozinho leva esta
máquina a load ~28; dois em paralelo produzem `Hook timed out` que parecem
defeito e não são. A sexta revisão adversarial **morreu** por isso. O
orquestrador anterior caiu nisso mesmo depois de avisar três agentes — confira
`uptime` (média de 5 min < 4) **antes** de concluir de um vermelho.

Corolário aprendido a duro custo: **instrua cada agente a rodar as suítes de
quem CONSOME o que ele muda.** Proibir suítes de pacote protege a máquina e
cega o agente para consumidores em outros pacotes — foi assim que uma extensão
de gate quebrou 12 testes em `packages/contratos` sem ninguém ver.

---

## 2. Onda 3 — três frentes

### 3.1 Consumo SSE no navegador (LAC-L1, segunda metade)

O **caminho de verdade já existe** e foi verificado: recarga autoritativa
periódica, idade da visão como estado próprio e `/v1/readyz` alimentando
degradação no ponto de uso. `ADR-0011` P8 é explícita — polling é a
recuperação de toda superfície, push é otimização **sobre** ele. Agora, e só
agora, o push é legítimo.

O backend está pronto e o caminho é curto: `POST /v1/eventos/ticket` →
`EventSource` → cursor/`Last-Event-ID` → replay → `instrucao-reconciliacao`.
Heartbeat, backpressure, reautorização por evento e `DESCRICAO_ESTADO_CONEXAO`
/`DESCRICAO_MOTIVO_ENCERRAMENTO` em pt-BR já existem em
`packages/contratos/src/asyncapi.ts`.

**Abstrações que a onda 1 deixou prontas para reúso** (não recrie): a porta
`Relogio` em `apps/web/src/estado/relogio.ts` serve heartbeat, backoff e
detecção de silêncio; `useProntidao`/`AvisoProntidao` é onde o estado de
conexão do gateway entra sem tocar apresentação; a composição de `degradado`
em `GradeLeitos`/`DetalhePaciente` já aceita mais uma origem booleana.

Obrigações que o contrato impõe ao consumidor:

- **A ausência de pulsação dentro do intervalo anunciado é o sinal de que a
  conexão morreu** — o cliente DEVE degradar a tela visivelmente, jamais
  mantê-la com aparência de atual (`HAZ-0025`; `ADR-0011` P6).
- O consumidor **ignora campos que não conhece e NUNCA silencia um `event:`
  desconhecido**: registra como lacuna observável e reconcilia por polling.
- `reproduzindo` e `reconciliado` só podem ser originados por transporte real.
  Hoje existem no catálogo com nota de honestidade — **produzi-los sem
  transporte seria afirmar capacidade inexistente.**

Agente: `ic-ux-resiliencia` (Opus). Fronteira: `apps/web/**`.

### 3.2 Navegação por URL, foco e WCAG 2.4.1/2.4.2 (LAC-L4)

Navegação é um `useState<string|null>` em `App.tsx`. Não há rota, URL por
leito, deep link, histórico do navegador (o "voltar" **sai da aplicação**),
preservação de contexto no recarregamento, `document.title` dinâmico, gestão
de foco na transição entre telas, nem skip-link.

Três disso são falhas WCAG diretas e estão **declaradas como lacuna conhecida**
em `apps/web/src/a11y/matrizAcessibilidade.ts`: **2.4.1** (Bypass Blocks),
**2.4.2** (Page Titled) e, quando a sessão real chegar (`ADR-0015`,
`not-started`), **2.2.1** (Timing Adjustable). Há teste que **reprova se algum
deles for marcado `executado`** sem a lacuna fechar — feche a lacuna e o teste
libera; não mexa no rótulo antes.

A matriz enumera 15 dos **55** critérios A+AA. O total é derivado da
enumeração literal, nunca digitado — porque a versão anterior dizia 56, estava
errada, e o teste que "verificava a razão" só comparava grandezas relativas
(`999` também passaria). Se ampliar a cobertura, amplie a enumeração junto.

Agente: `ic-ux-resiliencia` (Opus). **Sequencie depois de 3.1** — as duas
frentes tocam `App.tsx` e os mesmos componentes.

### 3.3 Carga de polling: jitter, backoff e coalescência entre abas

Lacuna que a onda 1 nomeou e deliberadamente não resolveu: **duas requisições
a cada 30 s por aba** (projeção + prontidão), **sem jitter, sem coalescência
entre abas e sem backoff após falha repetida**. Numa UTI com N abas abertas a
carga na API cresce linear, e todas as abas batem no mesmo instante.

Não endereçado ainda, e igualmente registrado: comportamento com aba em
segundo plano (o navegador estrangula temporizadores em abas ocultas — o ciclo
pode espaçar sem que a tela diga por quê), retomada após *sleep* do sistema, e
`Page Visibility`.

**Cuidado de segurança clínica:** backoff que espaça a releitura precisa
aparecer na tela. Uma tela que se atualiza a cada 8 minutos por backoff e não
diz isso é a mesma classe de `HAZ-0025` que a onda 1 fechou.

Agente: `ic-ux-resiliencia` (Opus) ou `ic-eventos-tempo-real` se o SSE já
tiver absorvido a cadência.

---

## 3. Onda 4 — refutação com lentes distintas

Despache **`ic-revisor-adversarial` (Opus, somente leitura)**, mais de um, com
**lentes diferentes** — convergência independente vale mais que repetição.
Sugestão de lentes: (a) correção clínica contra fonte primária; (b)
segurança/fail-closed; (c) reprodutibilidade da evidência ("o que aqui é
medição e o que é afirmação do autor?").

**Exija reprodução por execução, não leitura.** A revisão do PR #8 REFUTOU as
alegações centrais de `b4634d7` justamente porque executou: descobriu que a
recarga automática **morria para sempre** após um tempo esgotado, e que um
`/v1/readyz` travado deixava o painel clínico com **aparência 100% saudável** —
violação direta de `SAF-0025`, na alegação que o commit dizia ter fechado.

**Não presuma convergência.** A taxa de achado nunca convergiu neste projeto:
8, 6, 9, 12, 12 nas rodadas anteriores; a quinta reabriu classe que a quarta
declarava fechada; e a revisão do PR #8 achou 4 P1 numa branch com CI verde.

---

## 4. O que continua ABERTO — leia antes de alegar qualquer fecho

### ACH-REV8-3 (P1) — o único P1 da revisão do PR #8 ainda aberto

`acionavel: true` é publicável a partir de **registro forjado coerente** ou de
linha de banco adulterada competente. A recalculação por `ehAcionavel`
(`apps/api/src/regras/exposicao.ts`) é checagem de **COERÊNCIA entre campos do
mesmo blob controlado pelo atacante** — não de **AUTORIDADE** contra o
rule-bundle assinado. Os 5 vetores testados só forjam incompetentemente
(assinatura ausente).

**O orquestrador anterior endossou essa entrega como "derivação fail-closed" e
estava errado.** O revisor está certo. Fechar de verdade exige verificar
assinatura contra chave custodiada — e `ADR-0007` C5 (custódia de chave)
**segue aberta**, o que pode tornar isto bloqueado por decisão humana, não por
engenharia. Diagnostique antes de prometer.

### Da sexta revisão adversarial

- **F3** — outras asserções derivadas do próprio dado sob teste. O padrão
  circular foi corrigido em dois lugares; pode haver irmãos. Agente:
  `ic-qualidade-de-teste`.
- **F5** — independência de relógio fora de `apps/web`. O `HANDOFF` diz
  MEDIDA e LIMPA; o `PROMPT_IMPLEMENTACAO_FINAL` §16 diz não medida.
  **Reconcilie antes de agir** — uma das duas está errada.

### P2 da revisão do PR #8, não corrigido

O gate de deriva REST **emudece 16 de 160 verificações quando dois arquivos
opcionais faltam** — sem `else`, saindo 0 mesmo assim. Um gate que se cala por
ausência de entrada é um gate que aprova por omissão. Verifique e feche.

### Fiação pedida pelos especialistas e ainda não aplicada

1. `apps/api` — passar `exigirFechoDeRuntime: true` onde `AdaptadorPostgres.abrir({url})`
   é chamado no perfil que usa PostgreSQL real. **Sem isso o fecho de F1/F2
   existe mas a ausência dele não é detectada em runtime.**
2. Banco pré-existente — rodar uma vez `instalarFechoDeRuntime(urlSuperusuario)`,
   exportado de `@intensicare/persistencia`. É idempotente.
3. `docs/**` — a `0005` declara em `verificacao-de-controles-fatia-g7.md` que a
   janela de DDL é "fechada até o próximo deploy". **Isso mudou com a `0006`.**
4. **Duas duplicações estruturais ainda vivas:** `apps/api/src/regras/exposicao.ts`
   declara localmente tipos que agora existem em `@intensicare/contratos`, e
   `apps/web/src/api/prontidao.ts` mantém espelho manual dos códigos de razão.
   O gate cobre os **enums**, não a **forma das interfaces** — um campo
   acrescentado só de um lado passa. Fechar por import, apagando o local.
5. **Mudança de contrato de migração:** com a guarda armada, a ordem passa a ser
   "cria, protege, concede" — um `GRANT` antes de `RLS+FORCE+política` é
   abortado pelo banco.

---

## 5. Decisões que o orquestrador anterior tomou, e por quê

**Fez:**

1. **Caminho de verdade antes do push** (`ADR-0011` P8). Construir SSE primeiro
   inverteria o contrato.
2. **Expor o modo de despacho pela API** — violação mensurável de `QAS-0023`
   ("contagem deve ser zero"), sobre fato que o backend já computava.
3. **Autoteste do gate virou bloqueante** — a prova de que o gate serve existia
   e nenhum script a executava.
4. **UI adota os identificadores do contrato**, mantendo o texto pt-BR no
   frontend (`ADR-0021` F1). O texto segue provisório: `ADR-0029` C2 é ato do
   titular.

**Recusou, e a recusa é a decisão:**

1. **Não construiu os 6 comandos faltantes de `WorkItem`.** Supressão e override
   exigem taxonomia de razões **ratificada**, explicitamente pendente; escalada
   exige limiares que ninguém ratificou. Construí-los obrigaria a inventar
   governança clínica.
2. **Não ampliou `Frescor` para 9 valores.** O backend não computa os outros
   seis; publicar contrato que o produtor não honra é pior que a lacuna.
3. **Não inventou limiar clínico de frescor.** Intervalo de *recarga* é premissa
   reversível de engenharia (30 s, tique de 5 s, rotulados como tal). A partir de
   quantos minutos um dado clínico é velho é `VAL-0023`, `VALIDATION REQUIRED`.
4. **Não ligou `exigirFechoDeRuntime` por padrão** — topologia é decisão humana.
5. **Não instalou o fecho nas 21 bases de ataque existentes**: com ele, o banco
   recusa o próprio `CREATE` do objeto malicioso e aquelas asserções passariam
   **por vacuidade**.

---

## 6. O que permanece ATO HUMANO — não fabrique, não simule

| Pendência | Quem |
|---|---|
| `MG-G4` (coerência UX/domínio/API), `MG-G6`, `MG-G7`, `MG-G8` | titular / autoridades nomeadas |
| `ADR-0029` C2 — vocabulário pt-BR dos estados | `AUTH-CLINSAFETY` + `AUTH-UX` |
| `ADR-0007` C5 — custódia de chave (bloqueia ACH-REV8-3) | titular |
| `ADR-0015` — IdP real; `not-started` | titular |
| Cadência de releitura de superfície clínica | `AUTH-CLINSAFETY`, acoplada ao alvo G1 |
| Topologia: ambiente que não permita `CREATE EVENT TRIGGER` | titular |
| `VAL-0027`, `VAL-0029`, `VAL-0031`, `VAL-0033` (piso de 3 usuários **reais** de TA) | pesquisa de campo |
| Aceite/credencial do Dr. Marcelo; parecer OS-16 assinado; `BLK-0015` | externos |
| Tornar `build-and-test` obrigatório na proteção da `main` | titular |
| Merge do PR #8 | titular (`GDEC-0014`) |

**Nenhum gate foi aprovado. Nenhum hazard foi fechado.** Estado factual duro,
inalterado por tudo acima: **0 vias clínicas acionáveis; 47/47 inelegíveis;
`Observation` da AMH não consumível; safety case M0; nenhum dado real acessado.**

---

## 7. Comandos de retomada

```bash
git checkout codex/lacunas-frontend-a11y   # HEAD ec97f61
uptime                                     # média de 5 min < 4 antes de medir
pnpm verify                                # exit 0 — 1.604 testes, zero pulados
cd apps/web && pnpm exec playwright test   # 26/26
cd packages/persistencia && IC_FRONTEIRA_PG=obrigatoria pnpm exec vitest run  # 97/97
pnpm check:contratos                       # 187 verificações + autoteste 21 casos
```

**PERIGO:** `cycle-4/*`, `cycle-5/*`, `codex/finalizacao-plataforma-v2` e
`codex/sexta-revisao-adversarial` **não são ancestrais da `main`**. Não os
mescle para "recuperar" trabalho sem análise de conflito — o PR #6 foi fechado
sem merge exatamente por isso.
