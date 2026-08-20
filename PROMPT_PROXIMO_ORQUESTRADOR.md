# Encargo — a margem que falta, o vocabulário que espera ratificação

**Escrito em** 2026-08-20, ao fim das ondas de lacunas de escopo.
**`main` = `d1bbde6`.** Tudo mesclado (PR #10, PR #11). Repositório com **uma
única branch**; árvore limpa.

---

## 0. Leia primeiro, nesta ordem

1. `HANDOFF.yaml`, seção **`lacunas_de_escopo_2026_08_20`** — estado vivo.
   As seções anteriores **não** foram reescritas.
2. `.claude/CONTRATO-DE-AGENTES.md` — §7 tem a baseline **corrigida** (dizia
   1.026 e era lida por todo especialista antes de editar).
3. Os registros de `ACH-O3-1` a `ACH-O3-17` em `docs/**`.

> **Este arquivo é ROLANTE.** Arquive-o sob nome datado antes de sobrescrever —
> precedentes: `ENCARGO_ONDAS_3_E_4_2026-08-18.md` e
> `ENCARGO_LACUNAS_DE_ESCOPO_2026-08-20.md`.

## 1. As regras que mais economizam tempo aqui

**Nunca meça exit code através de um pipe.** `| tail` devolve o exit do `tail`.
Eu quase reportei verde uma `verify` reprovada por isso.

**A heurística de esperar `load5 < 4` tem um limite**: ela presume que a carga
vem dos seus testes. Se vier de outro app — ou de um processo pendurado — o laço
espera para sempre. **Confira o que está consumindo CPU antes de esperar.** Nesta
sessão havia um `biome __run` travado há **dois dias** a 97%.

**Não meça em sequência.** Eu deixei a carga ir de 4,8 a 26,9 rodando suítes
seguidas e perdi a capacidade de distinguir contenção de defeito. Espere esfriar.

**Antes de execução alvo:** `pnpm --filter @intensicare/contratos build`.

---

## 2. O que a última rodada provou sobre método

### 2.1 Mutação prova que um gate REPROVA o errado. Nunca que ACEITA o certo

O extrator da Parte G era cego a `readonly`, e a direção pior — **fazer o gate
reprovar documento correto** — nenhuma bateria de mutação pegaria. Todo gate
precisa de bloco de **conformidade**, não só de mutação.

### 2.2 Um gate pode não terminar, e ninguém percebe (`ACH-O3-17`)

`pnpm -r run test -- --run` virava `vitest -- --run`; o cac **trunca argv no
`--`**. Num terminal humano o passo `test` entrava em **watch** e os quatro
últimos gates **nunca rodavam**. Passava para agente porque `CLAUDECODE` — e
também `AI_AGENT` — zeram `isAgent`. O conserto devolveu algo mais importante
que o verde: **o vermelho voltou a ser observável.** Antes, falha e sucesso
travavam igual.

### 2.3 Teste de ausência sem âncora positiva é verde sobre nada

`verificarAxe` assertava `violations === []`. Sobre container vazio,
`passes.length` também é 0 — a asserção passava medindo **zero**, e seis casos
de axe dependiam dela.

### 2.4 Meça antes de diagnosticar

**Quatro dos cinco diagnósticos herdados estavam errados** porque o código mudara
sob eles. E três hipóteses minhas foram refutadas por medição: a tabela
ilustrativa **não** entrava no bundle (tree-shaking); os selos escuros **não**
violavam 1.4.3 (era inversão de saliência, pior e invisível ao axe); o flake
**não** era poluição de estado (era um penhasco de 50 ms).

---

## 3. O que continua ABERTO

### A margem de render — o item mais concreto

O flake de `apps/web/src/roteamento/navegacao.test.tsx` **não fechou**.
Distribuição medida (n=10): **9 de 10 execuções acima de 1000 ms**; o
`findByRole` mediu **1002 ms numa execução que passou**. Margem hoje ~1,0–1,1×.

O custo de ambiente já caiu 70% (20 arquivos foram para `environment: node`), o
que ajudou mas **não afasta da parede**. Fechar exige atacar os **~146 ms que o
pipeline de render leva já ocioso** — `useRecursoRemoto`/`GradeLeitos`, **código
de produção**. Margem sugerida: **≥5×** (consulta ≤200 ms), porque um runner de
CI 3–4× mais lento é plausível.

**Subir `asyncUtilTimeout` é proibido** — o penhasco continuaria 50 ms adiante.

Vizinhos na mesma classe, medidos e **não lentos isolados**:
`acessibilidade.test.tsx :: grade de leitos carregada` (239 ms isolado / 793 ms
sob a suíte) e `:: galeria` (188 / 710 ms).

Vale tratar como pergunta de UI antes de teste: **por que renderizar 48 nós leva
146 ms numa tela clínica?**

### `ACH-O3-1` (P1) — integridade do registro persistido

A allow-list filtra por **CHAVE**, não por **VALOR**. Há teste que afirma isso.
**Quando alguém estender a valores, essa asserção precisa ser INVERTIDA para
provar o fecho — nunca enfraquecida.** Ligado a `ADR-0007` C5.

### `ACH-O3-15`, `ACH-O3-16`, `ACH-O3-6`, `ACH-O3-8`

Recusa legítima nunca concilia (exige desenho); catálogo §5.2 já diverge do
código (**não copie dele** ao tipar `dados`); `sequencia` negativa fechada mas
tipar `dados` aberto; cursor `bigserial` global mede escrita de outros tenants.

### `LAC-L3` — fechou só metade

A divergência de `BandaRisco` fechou. **Seguem abertas** a ausência de geração de
código e a divergência de `Frescor` (3 no contrato × 9 na UI, e
`mapearFrescorParametro` nunca produz 4 deles).

### `LAC-L6` — e a conexão que ninguém tinha feito

`transitionWorkItem` **já suporta os 7 comandos**. Só três têm bloqueador citado:
`suppress` (W7, vocabulário de razão), `override` (W8, racional) e `escalate`
(W5, limiares do bundle). **`assign`, `resolve` e `reopen` não têm.**
E `ADR-0029` **C6** (lista de ambiguidade proibida) contém **P5** = *"resolvido"
× "reconhecido"* e **P6** = *"suprimido" × ausência não rotulada* — exatamente
estes estados. Ratificar C6 destrava o vocabulário.

### A verificação criptográfica nunca roda

`verifyBundle` não tem chamador fora de teste. "Autoridade" significa "este
processo leu este artefato do disco" — real contra escrita no banco, **nula**
contra escrita no sistema de arquivos.

### Resíduos menores

`pnpm test <arquivo>` voltou a filtrar; `pnpm test -- <arquivo>` **ainda
descarta** (interação pnpm×vitest). `ADR-0011:387` e `ADR-0012:278` têm a mesma
alegação obsoleta sobre `ADR-0016`, mas **dentro do estado de uma condição** —
julgar se a evidência-alvo está satisfeita é do dono da ADR, não bookkeeping.

---

## 4. ATO HUMANO — e o que você pode decidir sozinho

Você é **`AUTH-CLINSAFETY`** (parcial, `BLK-0002`) e **`AUTH-UX`** (interino),
com uma restrição decisiva: seu conhecimento clínico vale como **hipótese de
especialista, nunca como evidência de observação do Gate G1**.

**Decide sozinho hoje** (são decisões, não observações):
`ADR-0029` C6 (destrava `LAC-L6`) · ordem de severidade de frescor exibida ·
vocabulário de razão W7 · consolidar os 6 prefixos documento-locais numa única
entrada `GDEC` (**311 ocorrências, 89 IDs**; precedente D4 já exercido).

**Precisa de segundo humano nomeado:** `ADR-0007` C5 — a saída escolhida é
`GDEC` de **escopo `dev`-apenas** (o próprio ADR a oferece); exige também
**nomear `AUTH-SECURITY`** (C2 aberta).

**Nenhuma autoridade substitui:** `VAL-0027/0029/0031/0033` e `MG-G4` — exigem
observação de campo; `VAL-0033` exige **≥3 usuários reais de TA**, jamais
simulado.

**Topologia:** `ACH-O3-8` — prefira **cursor escopado** ao opaco, que
reintroduziria a custódia de chave bloqueada. E decida a classe do ambiente-alvo
para `CREATE EVENT TRIGGER`.

### O caminho crítico

**Formalizar o aceite e a credencial do Dr. Marcelo Villaca Lima (`BLK-0002`).**
Está no caminho de `MG-G7`, `ADR-0007` C1, `ADR-0029` C1 e de **toda**
ratificação que exija autor ≠ aprovador.

---

## 5. Comandos de retomada — cada número nomeia seu comando

```bash
uptime                                     # e VEJA o que consome CPU antes de esperar
pnpm --filter @intensicare/contratos build # SEMPRE antes de execução alvo

pnpm verify                                # exit 0 — 1.973 passed | 1 skipped
cd apps/web && pnpm exec playwright test --workers=1          # 57/57
cd packages/persistencia && IC_FRONTEIRA_PG=obrigatoria pnpm exec vitest run  # 99/99
pnpm check:contratos                       # 258 verificações + autoteste 99 casos
```

O **único** pulado é `apps/api/src/db.test.ts`, condicionado a `PG_TEST_URL`.
Avisa em stderr e vira falha dura sob `IC_FRONTEIRA_PG=obrigatoria` — **não é P0
escondido.**

---

## 6. Não presuma convergência

A taxa de achado **nunca** convergiu: **8, 6, 9, 12, 12, 25** — e esta rodada,
que era para ser de fechamento de lacunas conhecidas, achou `ACH-O3-17` (o gate
não terminava), três vacuidades e dois flakes que ninguém sabia existirem.

**Ao fechar um achado, enumere TODAS as superfícies antes de dizer "fechado".**
Foi o que faltou quando `ACH-REV8-3` foi declarado fechado em duas superfícies
de leitura e havia uma terceira.
