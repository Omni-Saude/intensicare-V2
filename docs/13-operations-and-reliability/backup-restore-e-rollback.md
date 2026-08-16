---
doc_id: OPS-13-BACKUP-RESTORE-ROLLBACK
status: PROPOSAL
owner: AUTH-OPERATIONS (detida por rodaquino-OMNI, DEC-G0-06) — ratificação VALIDATION REQUIRED
source: >
  INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §15.3 ("backup success, restore integrity, RPO/RTO,
  and evidence-export integrity"), §15.2 item 6 (compatibilidade e rollback de migração),
  Gate G8 ("measured load, failover, backup restore, RTO/RPO, and degraded-mode exercises";
  "migration and rollback rehearsal"), §20;
  docs/06-architecture/adrs/ADR-0020-observabilidade-slos-backup-dr.md O6/O7/O9;
  ADR-0007 §4.5 (rollback de bundle de regra); ADR-0018 (auditoria/retenção/exportação);
  ADR-0019 (plataforma/ambientes/residência — não materializado);
  packages/persistencia/src/index.ts e src/migrations/ (estado verificado em disco)
date_collected: 2026-08-16
collector: agente de prontidão operacional (ciclo 6, sprint SPR-G8-1)
last_updated: 2026-08-16
---

# Backup, restore, rollback e DR

> **Advertência que precede tudo.** SOURCE (ADR-0020 O6): "Restore que nunca foi ensaiado
> não conta como backup para G8." Este documento **descreve um procedimento proposto**;
> nenhum backup foi feito, nenhum restore foi ensaiado, nenhum RPO/RTO foi medido e nenhum
> exercício de DR ocorreu. Nada aqui pode ser citado como evidência de G8.

## 1. Estado real da durabilidade (OBSERVED, 2026-08-16)

| Fato verificado | Onde |
|---|---|
| A persistência é **PGlite em memória**, criada sem `dataDir` | `packages/persistencia/src/index.ts` (`createInMemoryDatabase`) |
| Portanto **não há estado durável entre execuções do processo** | idem |
| As migrações são SQL puro versionado (`0001_init.sql`, `0002_g7_integration.sql`) | `packages/persistencia/src/migrations/` |
| A auditoria é append-only por trigger e a RLS por tenant é `force`ada | `0001_init.sql` |
| A tabela `outbox_events` tem coluna `published_at` que **nenhum código preenche** | `0001_init.sql` + `repositories/clinical-repository.ts` |
| Postgres real e ambientes de implantação são matéria do **ADR-0019, não materializado** | `docs/06-architecture/adrs/ADR-0019-*.md` |

**Consequência honesta:** hoje **não existe o objeto do backup**. Falar em RPO/RTO sobre um
banco em memória seria teatro. O primeiro passo real de backup é P-OPS-06 (persistência
durável), que depende de decisão de plataforma.

## 2. O que precisa ser copiado (proposta), quando existir estado durável

SOURCE (ADR-0020 O6): backups automatizados de **todo estado durável**; projeções
reconstruíveis **podem** ser excluídas por serem deriváveis (ADR-0011 P1).

| Conjunto | Incluir no backup? | Razão |
|---|---|---|
| Fatos clínicos canônicos (observações, envelopes de origem, proveniência) | **Sim** | Fonte de verdade; não reconstruível |
| Alertas e itens de trabalho, com versões | **Sim** | Estado operado por humanos; não reconstruível |
| Auditoria append-only | **Sim** | Exigência de integridade e retenção (ADR-0018) |
| `outbox_events` (inclusive não publicados) | **Sim** | Perder outbox não publicado = perder entrega prometida |
| Chaves de idempotência e respostas gravadas | **Sim** | Sem elas, um replay do cliente vira escrita duplicada |
| Projeções de leitura | **Não** (reconstruíveis) | ADR-0011 P1 — desde que o rebuild seja **ensaiado**; rebuild nunca exercitado não é reconstrutibilidade, é esperança |
| Configuração e bundles de regra ativos | **Sim** | Sem o bundle exato, o restore não reproduz a avaliação |
| Segredos/chaves | **Não neste fluxo** | Gestão de chave é ADR-0017; misturar segredo com dump é antipadrão |

## 3. Procedimento de backup (proposta)

1. Backup automatizado, com verificação de integridade da própria cópia (checksum
   registrado).
2. Registrar cada execução em `intensicare.ops.backup.result.total` (`outcome=success` /
   `failure`); falha também incrementa `intensicare.ops.failure.total`
   (`category=backup_failure`).
3. **Backup sem alarme de falha é backup que ninguém sabe que parou.** O sinal de falha é
   operacional (§4 do README: família `intensicare.ops.*`), nunca alerta clínico.
4. Retenção, residência e criptografia em repouso: **VALIDATION REQUIRED** — dependem de
   ADR-0017/0018/0019 e de base legal/LGPD ainda não resolvida. Nenhum prazo é inventado
   aqui.

## 4. Ensaio de restore (o que de fato conta para o G8)

Procedimento proposto, **com dados 100% sintéticos** (marcador `SYNTH-`):

1. Provisionar destino isolado (jamais restaurar sobre ambiente vivo).
2. Restaurar o backup mais recente.
3. Verificar **integridade estrutural**: migrações aplicadas na mesma versão; RLS ainda
   `force`ada; trigger de auditoria presente.
4. Verificar **integridade semântica**: contagem e checksum dos fatos clínicos;
   continuidade da sequência do `outbox_events` (lacuna = perda de entrega); cadeia de
   auditoria sem buraco.
5. Reconstruir as projeções a partir dos fatos e **comparar** com o esperado — é isto que
   transforma "reconstruível" em fato.
6. Executar a **sonda sintética ponta a ponta** contra o ambiente restaurado e exigir
   `passed`.
7. Medir **RPO** (janela de dado perdido) e **RTO** (tempo até capacidade segura — não até
   "processo no ar").
8. Registrar em `intensicare.ops.restore.integrity.total` e arquivar o resultado como
   evidência datada.

> **RTO é medido até prontidão, não até liveness.** SOURCE (§15.3): readiness representa
> capacidade segura. Um processo respondendo `select 1` com bundle de regra ausente não
> recuperou nada.

**Estado:** nenhum passo acima foi executado. Cadência de ensaio: **VALIDATION REQUIRED**
(não se inventa "trimestral" aqui).

## 5. Rollback

SOURCE (§15.2 item 6; ADR-0007 §4.5). Três eixos **independentes**, e confundi-los é o erro
clássico:

| Eixo | O que reverte | Primitiva | Autoridade | Estado |
|---|---|---|---|---|
| **Regra clínica** | Comportamento clínico | `rollback` para versão previamente aprovada; ou `kill switch` sem substituição | `AUTH-CLINSAFETY` | Implementado em processo (`kill-switch.ts`); **sem propagação multi-instância** |
| **Código da aplicação** | Comportamento de software | Reimplantar artefato anterior | `AUTH-OPERATIONS` | **Não exercido** — não há pipeline de implantação (ADR-0019) |
| **Schema/migração** | Estrutura de dados | Migração compatível para frente + reversão ensaiada | `AUTH-OPERATIONS` | **Não exercido** — migrações são forward-only hoje; nenhuma reversão foi escrita nem testada |

Regras propostas:

1. **Rollback de código não desfaz dado.** Um artefato anterior sobre um schema novo só é
   seguro se a migração for compatível para frente — daí a exigência de compatibilidade
   antes da conveniência.
2. **Rollback de regra não é rollback de código.** Trocar o ponteiro de ativação do bundle
   é operação de dados/configuração, exercitável sem implantação (ADR-0007 H3). Colapsar as
   duas remove a única alavanca rápida que existe em uma emergência clínica.
3. **Nenhum rollback apaga auditoria.** A auditoria é append-only; um rollback gera
   registros novos, jamais remove os antigos.
4. **Ensaio de rollback é exigência de G8** ("migration and rollback rehearsal") e não
   ocorreu.

## 6. Exportação de evidência (ADR-0020 O9)

Proposta: todo bundle de evidência de release (§15.2 item 8) e toda exportação de auditoria
carregam verificação de integridade (checksum/atestado), reportada em
`intensicare.ops.evidence_export.integrity.total`.

**Estado:** o instrumento existe; **não há exportador**. E, por política deste repositório,
qualquer exportação futura passa pelo gate `scripts/check_forbidden_content.py`, que já
recusa credenciais, CPF formatado, e-mails e PSR real (UUID) — o exportador não pode ser a
porta dos fundos da política de conteúdo proibido.

## 7. DR — exercício, não documento

SOURCE (ADR-0020 O7): estratégia de DR **documentada e exercitada** (game day), com cenários
de perda parcial/total, ordem de recuperação, reconciliação pós-recuperação entre lanes
(ADR-0006) e replay do backbone; resultados registrados como evidência de G8.

Cenários mínimos propostos (nenhum executado):

| # | Cenário | O que precisa ser demonstrado |
|---|---|---|
| DR-1 | Perda da instância de aplicação | Recuperação sem perda de fato durável; outbox íntegro |
| DR-2 | Perda do armazenamento operacional | Restore com RPO/RTO medidos; projeções reconstruídas e conferidas |
| DR-3 | Perda parcial (corrupção de projeção) | Rebuild a partir dos fatos, com divergência medida e zerada |
| DR-4 | Perda de conectividade com a AMH | Modo degradado de conector visível; nenhuma inferência silenciosa |
| DR-5 | Bundle de regra corrompido | Kill switch/rollback com todas as avaliações resolvendo para não avaliado |

**Ordem de recuperação proposta:** identidade/chaves → armazenamento operacional →
migrações conferidas → bundle de regra ativo → aplicação → publicador de outbox →
projeções → canal de tempo real → sondas sintéticas → declaração de prontidão.
(Prontidão por último, de propósito: ela é a conclusão, não o primeiro passo.)

## 8. Resumo do que está bloqueado por ambiente ou por humano

| # | Item | Bloqueio |
|---|---|---|
| 1 | Qualquer backup real | Não há estado durável (P-OPS-06) + plataforma indefinida (ADR-0019) |
| 2 | Ensaio de restore com RPO/RTO medidos | Ambiente + execução humana |
| 3 | Game day de DR | Ambiente + pessoas + janela acordada |
| 4 | Ensaio de rollback de código/schema | Pipeline de implantação (ADR-0019) |
| 5 | Retenção/residência/criptografia em repouso | ADR-0017/0018/0019 + base legal (LGPD) |
| 6 | Kill switch multi-instância medido | Múltiplas instâncias implantadas |
