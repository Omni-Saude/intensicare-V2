# ENCARGO DE CONTINUIDADE — 2026-09-19 (fechamento da onda 1)

Registro de continuidade da sessão de execução/mesclagem. Não altera HANDOFF.yaml
nem fecha itens de autoridade — status move-se por evidência em PR (plano §6).

## Estado do repositório

- `main` = **`d1758da`** — CI Plataforma **success** no próprio commit.
- **Onda 1 integralmente mesclada**, na ordem:
  1. `90499a6` — ORQ-1: fecha BLK-1, CRIT-5, MIN-10 (verify + supply-chain sem vermelho à época).
  2. `6141cf8` — PR #14: fecho do executor bruto de transação (`exec` de string) na porta de tenant (`Transaction` → `ExecutorTenant`).
  3. `ffd86a4` — PR #16: ORQ-7 PR-A (MIN-1, MIN-2, MIN-6).
  4. `7c8e517` — PR #19: ORQ-4 (piso dos normalizadores de unidade, CRIT-3).
  5. `b04935b` — PR #17: ORQ-7 PR-B (dossiês de ratificação clínica).
  6. `1f31c4a` — PR #23: ORQ-6 (tendência 24h — `serieAvaliacoes` 3-estados, SVG marker-only, tabela canônica; e2e 61/61).
  7. `d1758da` — PR #13: **ORQ-5 — MAJ-5 fechado** (identidade de regra durável e consultável em SQL: `rule_id`/`rule_versao` NOT NULL + `rule_ref` gerada + backfill append-only a partir do `kernel_record` + CHECK de coerência + índice; ADR-0025 §5.2 item 4 / §2.1 E3).

  (Observação: `d1758da` é o HEAD atual; o squash do #23 pode estar antes ou depois na
  ordem real do histórico — a lista acima reflete a sequência lógica das ondas, não o
  DAG exato. Verificar com `git log --oneline` se a ordem exata importar.)

## Único vermelho do repositório (classificado, com evidência)

**Cadeia de Suprimentos — `artefato-api` / `artefato-web`:** `libcrypto3` CVE-2026-14456
(OpenSSL DoS; correção em `3.5.8-r0` da imagem base Alpine). Presente no PRÓPRIO `main`
(vermelho de deriva de advisory, não de nenhum PR). O bump da imagem base é trabalho do
fluxo supply-chain/ORQ-1. Classificação completa (A/B contra main limpo + leitura de
Trivy) no comentário do PR #13: issuecomment-5744846590. O SCA de dependências
(`vulnerabilidades-de-dependencia`) está VERDE desde o bump do `fast-uri` (4.2.1).

## Aberto, por design

- **PR #18** (ORQ-7 PR-C — varredura de verdade em docs: MAJ-6, MAJ-7, MIN-3) — **WAVE 2**:
  só fundir após ORQ-2 e ORQ-3.
- **ORQ-2** (e2e-harness) e **ORQ-3** (alert-lifecycle): worktrees existem
  (`../intensicare-V2-orq2` em `90499a6`; `../intensicare-V2-orq3` em `d7a49dd` — rebasar
  antes de começar), sem PRs ainda. **São os dois únicos fluxos da onda 1 não entregues.**
  Executar e mesclar nesta ordem (plano §1). ORQ-6 JÁ FOI ENTREGUE (PR #23, `1f31c4a`).
- **Wave 3**: ORQ-8 (SOFA) depende de ORQ-3 + ORQ-4 (✓); implementar ao spec alvo pinado,
  despacho bloqueado pending bundle approval.
- Flake de render-margin (`navegacao.test.tsx`) permanece mandato autônomo (plano §1),
  não é fluxo paralelo.

## Notas de ambiente e processo (para não re-descobrir)

- **Hook Mimosa PreToolUse/Bash (git-gate) desabilitado** em 2026-09-19 por instrução do
  titular: removida apenas a entrada PreToolUse/Bash de
  `~/.zcode/cli/plugins/cache/zcode-plugins-official/mimosa/1.0.3/hooks/hooks.json`
  (backup `hooks.json.bak-orq5` no mesmo diretório). Atualização do plugin restaura.
  As duas âncoras "injeção" do scanner (`pool.ts:518`, `escopo-primeira-escrita.test.ts:136`)
  foram fechadas de verdade pelo #14 no main.
- **Proteção do `main`**: required checks = `doc-conventions` + `forbidden-content` apenas;
  `strict` up-to-date (atualizar o branch antes do merge); apenas squash/rebase
  (linear history); zero reviews exigidas; `enforce_admins` ligado (sem bypass admin).
- **Carga da máquina**: com múltiplas sessões simultâneas (load > 100), bootstraps PGlite
  locais ficam inconclusivos (timeout de hook 60s). Nesses momentos: `pnpm build` local
  (determinístico) + CI do PR como árbitro; suítes locais quando a máquina acalma.
  Nunca aumentar timeouts para passar (plano §6).
- **Sessões concorrentes**: refs git são compartilhadas entre worktrees — aconteceu corrida
  de merge no PR #13 (duas sessões rebasaram o mesmo commit; resolução por prova de
  paridade de conteúdo). Antes de force-push, re-checar o head remoto.
- Convenções mantidas: nada de `--no-verify`; nada de afrouxar gates; status fecha por
  evidência em PR; HANDOFF.yaml e encargos arquivados só por autoridade titular.

## Memória do projeto (continuidade entre sessões)

Atualizadas e ativas: `orq5-execution-state` (fechado, merge d1758da), `orq1-execution-state`,
`orq4-execution-state`, `orq7-execution-state`, `forensic-audit-orchestration`
(status de execução da onda 1 + lições de ambiente). Índice: `MEMORY.md`.
