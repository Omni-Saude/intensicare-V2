# Encargo — fechar a onda (varredura de verdade) e a via SOFA

**Escrito em** 2026-09-19, ao fim da execução do ORQ-3.
**`main` = `7f8c541`** (PR #25, ORQ-3). CI Plataforma **success** no próprio
commit de merge. Árvore limpa; worktree de execução em
`../intensicare-V2-orq3` (branch `orq3/alerta-borda-supressao`, já mesclada —
pode ser removida com `git worktree remove`).

---

## 0. Leia primeiro, nesta ordem

1. `ENCARGO_CONTINUIDADE_2026-09-19.md` — fechamento da onda 1 (estado em
   `d1758da`; a leitura de suprimentos de lá segue válida).
2. `ENCARGO_ORQ_3_ALERTA_2026-09-19.md` — o que este par de sessões entregou
   (ORQ-2 `104ef54`, ORQ-3 `7f8c541`) e os diagnósticos de ambiente que
   economizarão horas (node 22 × engines; Stryker `--inPlace`; vitest
   sequencial para evidência local; adaptação de fixtures à semântica de
   borda).
3. `HANDOFF.yaml` — estado vivo das autoridades. **Este arquivo é ROLANTE.**
   Arquive-o sob nome datado antes de sobrescrever — precedentes:
   `ENCARGO_CONTINUIDADE_2026-09-19.md`, `ENCARGO_ORQ_3_ALERTA_2026-09-19.md`.

## 1. O caminho crítico agora — duas frentes, nesta ordem

### Frente A — WAVE 2: fundir o PR #18 (ORQ-7 PR-C)

O gate de onda ("só fundir após ORQ-2 e ORQ-3") está **satisfeito**:
ORQ-2 = `104ef54` (PR #21), ORQ-3 = `7f8c541` (PR #25). O próprio #18 pede
**re-checagem das citações dos dossiês no un-draft** — o main moveu sob eles
(o ORQ-3 acrescentou um dossiê novo e reescreveu o README da API §3; o ORQ-2
trocou o webServer da API). Rebase, reverificar citação a citação, un-draft,
deixar o CI arbitrar, fundir. Fecham com ele: MAJ-6, MAJ-7, MIN-3.

### Frente B — WAVE 3: ORQ-8 (SOFA, terceira via)

Dependências prontas: ORQ-3 ✓ (a primitiva `deveriaEmitirAlerta` e o
`alertCrossing` do kernel são o molde) e ORQ-4 ✓ (normalizadores). Prompt:
`orchestrators/PROMPT_ORQ-8_SOFA_PATHWAY.md`. Implementar ao spec alvo
pinado `docs/05-clinical-safety/rule-releases/sofa/`, corpus de vetores de
referência no `rule-bundle`, registrado no despachante, **despacho
bloqueado** pending bundle approval; baseline de mutação com `--inPlace`
(ver `ENCARGO_ORQ_3_ALERTA_2026-09-19.md` §Stryker). Worktree próprio;
rebasar sobre o main do dia.

## 2. Vermelho remanescente do repositório — um, classificado

**Cadeia de Suprimentos (`artefato-api`/`artefato-web`)**: `libcrypto3`
CVE-2026-14456 (imagem base Alpine; correção em `3.5.8-r0`). Vermelho de
deriva de advisory, presente no próprio `main` ANTES e DEPOIS do ORQ-3 —
bump de imagem base é trabalho do fluxo supply-chain. Nada de código de PR
resolve; não o "contorne".

## 3. O que continua ABERTO (rolante anterior, intacto e ainda válido)

- **Margem de render** (`navegacao.test.tsx`): mandato autônomo, não fluxo.
  ATUALIZAÇÃO: o **PR #22 (MIN-7)** atacou o re-render da grade (48 cartões
  por tique) — **re-meça a distribuição (n≥10) ANTES de diagnosticar**; o
  penhasco de ~146 ms pode ter mudado de lugar. Proibido subir
  `asyncUtilTimeout`; margem-alvo ≥5×.
- `ACH-O3-1` (P1, allow-list por chave; inverter asserção ao estender —
  nunca enfraquecer) · `ACH-O3-15/16/6/8` · `LAC-L3` (metade aberta) ·
  `LAC-L6` (destravada por ADR-0029 C6) · `verifyBundle` sem chamador
  (autoridade nula contra escrita no filesystem) · resíduo
  `pnpm test -- <arquivo>`.
- **Atos humanos** (nenhuma autoridade de agente os fecha): `BLK-0002`
  (aceite/credencial do Dr. Marcelo Villaca Lima — caminho de MG-G7, C1 de
  ADR-0007/0029 e de toda ratificação autor≠aprovador) · `ADR-0007` C5
  (GDEC dev-only + nomear `AUTH-SECURITY`) · `ADR-0029` C6 (você decide —
  destrava LAC-L6) · `VAL-0027/0029/0031/0033` e `MG-G4` (observação de
  campo; VAL-0033 exige ≥3 usuários reais de TA).

## 4. As regras que mais economizam tempo (acumulado das sessões)

**Node 22, sempre.** `nvm use 22` (ou prefixe o PATH do
`~/.nvm/versions/node/v22.23.2/bin`). Sob node 24: PGlite estoura 30 s na
primeira instanciação e o dlx do Stryker quebra — REPRODUZIDO no main
pristine, A/B. O PATH perde o nvm entre shells.

**Nunca meça exit code através de um pipe** (`| tail` devolve o exit do
tail; use `set -o pipefail` ou capture em arquivo).

**Suíte grande de API: `--no-file-parallelism` para evidência local**; o
paralelo estoura hooks de bootstrap do PGlite nesta máquina (reproduzido no
main pristine). Árbitro final = CI do PR. Não confunda contenção fria
(WASM a frio num worktree novo) com defeito — rode de novo quente antes de
diagnosticar.

**Adaptação de testes à semântica de borda (ORQ-3)**: par virgem =
P001/ENC_P001; P002 carrega anterior 11 + cooldown; ENC_VAZIO está queimado
por design; sob relógio falso (`toFake: ["Date"]` SOMENTE), cunhe o bearer
dentro do relógio simulado.

**Antes de execução alvo:** `pnpm --filter @intensicare/contratos build`.

## 5. Comandos de retomada — cada número nomeia seu comando

```bash
nvm use 22                                  # engines do repo: >=22 <23
uptime                                      # e VEJA o que consome CPU
pnpm --filter @intensicare/contratos build  # SEMPRE antes de execução alvo

pnpm verify                                 # sob node 22; vermelho esperado:
                                            #   só Cadeia de Suprimentos (CVE)
pnpm --filter @intensicare/api exec vitest run --no-file-parallelism  # 435
pnpm --filter @intensicare/persistencia test                          # 106
cd packages/kernel-clinico && pnpm dlx --package=@stryker-mutator/core \
  --package=@stryker-mutator/vitest-runner --package=typescript@5 \
  stryker run --inPlace                     # mutação; ≥90 exigido
node scripts/pg-efemero.mjs up              # PG real p/ fronteira
pnpm test:fronteira                         # 64/64 com PG_TEST_URL exports
pnpm check:contratos                        # + autoteste
```

O **único** pulado em suíte é o bloco de PostgreSQL real de
`apps/api/src/db.test.ts`, condicionado a `PG_TEST_URL` — falha dura sob
`IC_FRONTEIRA_PG=obrigatoria`; não é P0 escondido.

## 6. Não presuma convergência

A taxa de achado **nunca** convergiu: **8, 6, 9, 12, 12, 25** — e a rodada do
ORQ-3, que era "só o alerta", achou o envenenamento por design do ENC_VAZIO,
a corrosão do PATH de nvm entre shells e o node-versão como causa-raiz de
dois vermelhos "misteriosos" que duas sessões anteriores haviam atribuído a
carga. **Ao fechar um achado, enumere TODAS as superfícies antes de dizer
"fechado"** — e meça no ambiente que o repo declara (`engines`) antes de
atribuir a defeito.
