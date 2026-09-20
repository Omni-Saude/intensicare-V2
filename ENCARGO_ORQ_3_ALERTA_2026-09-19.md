# ENCARGO — ORQ-3 ALERTA DE BORDA + SUPRESSÃO — 2026-09-19 (executado e mesclado)

Registro do que foi executado nesta sessão contra o encargo de continuidade de
2026-09-19 (`ENCARGO_CONTINUIDADE_2026-09-19.md`) e do prompt do fluxo
`orchestrators/PROMPT_ORQ-3_ALERT_LIFECYCLE.md`. Não altera HANDOFF.yaml nem
fecha itens de autoridade — status move-se por evidência em PR (plano §6).
O dossiê de ratificação segue PROPOSAL, dono UNASSIGNED.

## Entregue

**ORQ-3 — CRIT-1 + CRIT-2: mesclado em `main` = `7f8c541`** (PR #25, squash,
23:03Z de 2026-09-19; merge autorizado explicitamente pelo titular, que mantém
todas as demais exigências do protocolo §5 — checks verdes, sem `--no-verify`,
unidade única de revert).

- Gatilho de borda no kernel PURO: insumo opcional `priorState`
  (`news2_prev` + vermelhos anteriores) → veredito `alertCrossing` /
  `alertCrossingReason` / `alertCrossingInputs` no registro. `fires`
  (exibição consultiva, spec §4.2) permanece estático e intocado.
  Desconhecido ARMA o gatilho (premissa reversível). Nenhuma banda, escala,
  ACVPU ou gatilho publicado alterado (NEWS2-C-01; §4.3 intacto).
- Corpus CRV 93 → 104 (CRV-NEWS2-0201..0211: TVs 1–4 do irmão, rearme,
  vermelho novo×transportado, premissas). Ambas as expansões (kernel
  `test/suporte.ts` e `rule-bundle/news2-test-pack.ts`) estendidas em par.
- Primitiva PURA de supressão em `dominio/supressao-alertas.ts`:
  `deveriaEmitirAlerta` — dedup por chave, cooldown PT4H, teto 3/24h rolantes
  (filtra a própria janela), janela de manutenção parametrizada; motivos
  explícitos; premissas RAT-EWS em constantes nomeadas.
- Fiação em `apps/api/src/db.ts`: estado anterior lido EM-TRANSAÇÃO antes do
  despacho; supressão consultada sempre que `fires` e não há limitação
  terapêutica; suprimido segue avaliado/auditado com motivo
  (`command: "alerta-suprimido"`, `newState` = motivo). `requerAlerta`
  consome o cruzamento.
- README da API §3 reescrito (admissão "sem deduplicação" → comportamento
  novo + residuais). Dossiê RAT-EWS:
  `docs/05-clinical-safety/dossie-gatilho-borda-alerta-news2.md` (PROPOSAL,
  premissas P1–P8).
- Testes: tempestade 5⇒1 item + 4 supressões auditadas; rearme (queda +
  recruzamento após PT4H com `Date` falsificado SOMENTE — tokens cunhados no
  relógio simulado); TV-2 (banda média não emite); adaptação de fixtures em
  `seguranca.test.ts`, `e2e.fatia.test.ts` e `routes.test.ts` para a
  semântica de borda (par virgem P001/ENC_P001; nenhuma asserção de
  segurança enfraquecida — HAZ-0023/SEC-0027 integral).

## Evidência de gates (todos reais, no branch rebasado 3× sobre o main movente)

API 435/435 (sequencial) · kernel 366/366 · dominio 29/29 · rule-bundle
313/313 · web 237/237 · persistencia 106/106 · fronteira 64/64 (PostgreSQL
real 16.14 efêmero, `scripts/pg-efemero.mjs`) · `check:contratos` +
`autoteste` OK · mutação **92.95 ≥ break 90** (1120 mutantes) · RED capturado
(11 vetores falham no kernel base). CI do commit de merge: **CI Plataforma
success**, Docs Gates success; Cadeia de Suprimentos failure = CVE-2026-14456
(libcrypto3, imagem base) — VERMELHO PRÉ-EXISTENTE no próprio `main` (pai do
merge tem o mesmo vermelho; classificado no PR #13). fluxo supply-chain é o
dono do bump da imagem base.

## Diagnósticos de ambiente que custaram horas (não re-descubra)

1. **Node 24 × engines `>=22 <23`.** O nvm default da máquina é v24.15.0.
   Sob node 24: PGlite (WASM) estoura 30 s na PRIMEIRA instanciação por
   arquivo (`persistencia`: 3–5 timeouts — REPRODUZIDO no main pristine, A/B)
   e o dlx do Stryker quebra (rolldown "Module not found"). `nvm install 22`
   + `nvm use 22` resolve os dois. O PATH perde o nvm entre shells — prefixe
   `export PATH="/Users/familia/.nvm/versions/node/v22.23.2/bin:$PATH"`.
2. **Stryker**: a invocação canônica `test:mutacao` quebra por defeito
   PRÉ-EXISTENTE do sandbox (o `vitest.config.ts` do kernel importa
   `../../vitest.shared.js`, fora do escópio de cópia — F1/F2 do PR #19).
   Execução honesta: `cd packages/kernel-clinico && dlx stryker run
   --inPlace` (mesma config do pacote, mutantes na árvore com auto-reversão;
   `git status` limpo ao final). Config na raiz NÃO funciona (includes são
   relativos ao pacote → "No tests were executed"); `--configFile` não
   existe no CLI do Stryker 10.
3. **vitest paralelo nesta máquina** estoura hooks de bootstrap do PGlite em
   suítes grandes (26 arquivos) mesmo em node 22 — usar
   `--no-file-parallelism` para evidência local; árbitro final = CI do PR.
4. **Adaptação de testes à semântica de borda**: P002 fica com anterior 11 +
   cooldown após o primeiro uso; o ENC_VAZIO é queimado POR DESIGN (o FR
   inmapeável da describe G fica persistido e invalida avaliações futuras
   daquele encontro). Par virgem: P001/ENC_P001. Sob relógio falso, cunhe o
   bearer DENTRO do relógio simulado (exp contra relógio adiantado ⇒ 401
   correto do verificador). `vi.useFakeTimers({ toFake: ["Date"] })` —
   timers de verdade congelam PGlite/fastify.

## Aberto, por design (herdado e intacto)

- **PR #18** (ORQ-7 PR-C, WAVE 2): o gate era "após ORQ-2 e ORQ-3" — ambos
  mesclados (`104ef54`, `7f8c541`). Re-checar as citações do dossiê no
  un-draft (o que o próprio #18 pede) e fundir.
- **ORQ-8 (wave 3)**: dependências ORQ-3 ✓ (supressão + `alertCrossing`) e
  ORQ-4 ✓. Implementar ao spec alvo pinado `docs/05-clinical-safety/
  rule-releases/sofa`, despacho bloqueado pending bundle approval; registrar
  baseline de mutação (usar `--inPlace`, ver acima).
- CVE-2026-14456: bump da imagem base Alpine (fluxo supply-chain; única
  vermelha remanescente do repo).
- Todo o restante do rolante anterior permanece válido e NÃO foi tocado:
  margem de render (nota: #22 atacou re-render da grade; re-medir antes de
  diagnosticar), `ACH-O3-1`, `ACH-O3-15/16/6/8`, `LAC-L3`/`LAC-L6`,
  `verifyBundle` sem chamador, atos humanos (BLK-0002, ADR-0007 C5,
  ADR-0029 C6, VAL-*/MG-G*).
