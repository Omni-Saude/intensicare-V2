---
id: ADR-0023
title: Política de importação legada e abordagem de migração — legado como evidência forense, canônico como única porta
status: PROPOSAL   # regra de CI (agente não grava DECIDED/accepted no front matter); status do ADR no corpo: accepted (direção GDEC-0016; minuta materializada em construção — GDEC-0015)
date: 2026-08-16
last_updated: 2026-08-16
owner: rodaquino-OMNI (titular decisor da direção — GDEC-0016); redator - agente de minutas de ADR (ciclo 6); o redator não é aprovador
approvers:
  - AUTH-PRODUCT (detida por rodaquino-OMNI, DEC-G0-01)
  - AUTH-CLINSAFETY (detida por rodaquino-OMNI, GDEC-0003)
source: >
  INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §3 regras 2-5 (legado read-only, não copiar por
  default, requisitos de importação, migrações legadas jamais baseline), §12.2 (mapeamento
  determinístico/idempotente para migração/import); docs/06-architecture/adrs/adr-index.md
  (linha ADR-0023; depende de ADR-0005 e da política de governança de importação legada;
  Gates G1/G7); GDEC-0016 (aceite de direção, 2026-08-16); ADR-0005 (aceito, M1-M10)
provenance:
  source_repo: intensicare-V2
  path_or_url: docs/06-architecture/adrs/ADR-0023-importacao-legada-migracao.md
  commit_sha_or_version: 33c749a (branch cycle-6/construcao-g7, base da redação)
  section_or_lines: prompt §3 regras 2-5, §12.2; adr-index.md §3, §4.1, §5
  date_collected: 2026-08-16
  collector: agente de minutas de ADR (ciclo 6)
  transformation: reasoned-from — materialização em minuta de direção já aceita pelo titular (GDEC-0016); a decisão não é reaberta
  confidence: medium
  validation_status: VALIDATION REQUIRED (conferência do titular sobre a materialização; a direção em si está aceita)
links:
  adrs:
    depends_on: [ADR-0005]
    feeds: [ADR-0013, ADR-0018]
  gates: [G1, G7]
supersedes: null
superseded_by: null
---

# ADR-0023 — Política de importação legada e abordagem de migração

> **Status: accepted (direção GDEC-0016; minuta materializada em construção — GDEC-0015).**
> A direção foi aceita pelo titular em 2026-08-16 (GDEC-0016); esta minuta a documenta e
> detalha sem reabri-la. Síntese da direção: **nada é importado sem passar pelo modelo
> canônico (ADR-0005) sob política aceita; o legado é evidência forense, não fonte de
> verdade.** Aceito ≠ implementado ≠ verificado.

## 1. Contexto e formulação do problema

SOURCE (prompt §3, regras 2–5): repositórios legado e AMH são montados **read-only**;
código, schemas, migrações, infraestrutura, dependências, regras clínicas, screenshots e
testes legados **não são copiados por default**; um artefato importado exige decisão
registrada de licença/IP, proveniência, dono, relevância atual, revisão de segurança,
revisão clínica quando aplicável, log de transformação e testes de aceitação V2;
migrações de banco legadas **jamais** são baseline da V2 — a V2 começa com uma história
de migração única, reproduzível, com teste de clean-install. SOURCE (ADR-0005, aceito):
todo fato clínico canônico é imutável, com cadeia única de proveniência, envelope de
origem retido, matriz de admissibilidade e não-coerção (M1–M10). SOURCE (prompt §12.2):
mapeamento para migração/import deve ser determinístico e idempotente, com validação
prévia.

INFERENCE: sem este ADR, cada necessidade pontual ("aproveitar o schema", "reusar a
regra", "importar o histórico") viraria exceção não governada — exatamente o vetor pelo
qual um legado não auditado contamina um sistema novo. O índice liga este ADR aos Gates
G1 (que material legado pode informar o uso pretendido) e G7 (fatia com fixture
fixada).

**Pergunta.** Sob que política artefatos e dados do legado podem ser usados ou
importados pela V2, e qual é a abordagem de migração que preserva a V2 como história
independente?

**Fora de escopo:** perfis/terminologia de destino (ADR-0013); retenção/auditoria do que
foi importado (ADR-0018); qualquer decisão de importar dado clínico real (reserva
AUTH-PRIVACY-LEGAL, G6/G8 — DEC-G0-03).

## 2. Drivers de decisão

| # | Driver | Por que importa aqui |
|---|---|---|
| D1 | Regras não negociáveis §3 r2–r5 já vinculam | A política só pode operacionalizá-las, nunca afrouxá-las |
| D2 | Modelo canônico aceito (ADR-0005) | Existe exatamente uma forma válida de fato clínico; importação fora dela criaria segunda fonte de verdade (proibido, §7.3) |
| D3 | Valor epistêmico real do legado | A revisão forense legada produziu contradições, hazards e vetores úteis — jogar fora seria perda de evidência |
| D4 | Replay e auditabilidade (DOM-0002/0003/0006) | O que entrar precisa ser re-derivável e auditável como qualquer outro fato |
| D5 | Independência de história (§3 r1/r5) | A V2 não pode herdar dívida de migração nem identidade de release do legado |

## 3. Alternativas consideradas

### Opção A — Legado como evidência forense; importação somente via modelo canônico sob política por artefato (DIREÇÃO ACEITA — GDEC-0016)

- **Positivas:** uma única porta de entrada (canônico ADR-0005) elimina segunda fonte de
  verdade; cada importação carrega licença/IP, proveniência, revisão e testes (§3 r4);
  o valor epistêmico do legado é preservado como evidência citável (SOURCE) sem
  contaminar o runtime.
- **Negativas:** importar qualquer coisa é deliberadamente caro (revisões, log de
  transformação, testes); a tentação de "atalho de bootstrap" precisa ser policiada por
  CI e revisão.

### Opção B — Bootstrap direto: importar schema/dados/regras legados como baseline e adaptar

- **Positivas:** partida aparentemente rápida; histórico imediatamente disponível.
- **Negativas:** viola frontalmente §3 r3/r5 (migrações legadas como baseline são
  proibidas); herda vícios não auditados (a revisão forense registrou contradições
  materiais no legado); cria segunda fonte de verdade clínica não governada.
  **Rejeitada — incompatível com regra não negociável.**

### Opção C — Proibição total: nenhum uso do legado, nem como evidência

- **Positivas:** máxima higiene; política trivial de auditar.
- **Negativas:** desperdiça evidência forense legítima (hazards, contradições, vetores
  de teste derivados); o Gate G1 usa material legado *como evidência* do problema
  clínico; §3 r4 pressupõe que importação governada existe. **Rejeitada como excesso.**

### Opção Z — Adiar

- **Custo do adiamento:** G1 e G7 já consomem a fronteira desta política (o que pode
  informar o uso pretendido; que fixture entra na fatia); sem política, cada uso é
  exceção. **Rejeitada pela aceitação da direção (GDEC-0016).**

## 4. Decisão e escopo

> **DIREÇÃO ACEITA (GDEC-0016, 2026-08-16; decided_by: rodaquino-OMNI, titular —
> AUTH-PRODUCT/AUTH-CLINSAFETY).** Opção A, materializada na minuta normativa L1–L8
> (GDEC-0015). Detalhamentos além da direção estão marcados como PREMISSA.

**L1 — Legado é evidência forense, não fonte de verdade.** Os repositórios legado e AMH
permanecem montados read-only (§3 r2). Conteúdo legado pode ser **citado** como
evidência (SOURCE, com proveniência completa por evidence-notation.md §3) para informar
requisitos, hazards, contradições e vetores de teste — e **nada dele é autoritativo**
para verdade clínica, técnica ou de produto. Autoridade não deriva de existência no
legado (§20: presença em ADR/implementação legada não prova autoridade).

**L2 — Default é não importar.** Código, schemas, migrações, infraestrutura,
dependências, regras clínicas, screenshots e testes legados não são copiados por default
(§3 r3). A ausência de importação é o estado normal e não requer justificativa; a
importação, sim.

**L3 — Uma única porta: o modelo canônico.** Nenhum dado legado entra na V2 sem passar
pelo modelo canônico do ADR-0005: envelope de origem preservado imutável, cadeia única
de proveniência marcando origem legada + versão de mapeamento + log de transformação,
matriz de admissibilidade aplicada, quarentena para código/unidade desconhecidos,
não-coerção (M1–M10). O mapeamento de importação é **determinístico e idempotente**
(§12.2): re-executar a importação não duplica nem altera fatos (chaves naturais +
dedupe, coerente com ADR-0010 B2).

**L4 — Requisitos por artefato importado.** Toda importação (código, schema, regra,
dado, fixture, screenshot) exige, registrado **antes** do merge (§3 r4): decisão de
licença/IP; proveniência completa; dono nomeado; relevância atual; revisão de segurança;
revisão clínica quando aplicável; log de transformação; testes de aceitação V2 que
falham sem o artefato e passam com ele.

**L5 — Migração de banco: história independente.** Migrações legadas jamais são
baseline (§3 r5). A V2 mantém história de migração única, SQL pura, reproduzível, com
teste de clean-install (e upgrade/rollback-compatibility, §14) — já refletida nas
premissas de construção do scaffolding. Nenhum dump legado é restaurado em ambiente V2.

**L6 — Dado clínico real do legado é matéria G6/G8.** Qualquer importação futura de dado
clínico real exige base legal/privacidade aprovada (AUTH-PRIVACY-LEGAL — reserva
DEC-G0-03), de-identificação formal quando aplicável e decisão do titular. Em
construção, exclusivamente dados sintéticos marcados "SYNTH-" (GDEC-0013). Nenhuma
importação de dado real está aprovada por esta minuta.

**L7 — Vetores derivados do legado são revisados antes de virarem verdade de teste.**
Um caso clínico/contradição observado no legado pode inspirar um vetor de teste, mas o
vetor entra no corpus como artefato **novo**, sintético, com derivação registrada e
revisão clínica independente (§14: vetores de referência clínicos independentes) —
nunca como cópia de dado ou expectativa legada não revisada.

**L8 — Fluxo reverso proibido.** A V2 jamais escreve no legado (§3 r2). Migração de
usuários/instalações do legado para a V2, se algum dia proposta, será ADR próprio de
cutover consumindo L3–L6 — esta minuta não a autoriza. PREMISSA (reversível,
GDEC-0015/0017): nenhum cutover legado→V2 está no escopo do MVP; o MVP nasce greenfield
com dados sintéticos.

**Escopo vinculado:** todo artefato e dado originário dos repositórios legado (e do AMH
enquanto evidência). **Não vincula:** o conteúdo dos perfis de destino (ADR-0013) nem a
política de retenção do importado (ADR-0018).

## 5. Consequências

- **Positivas:** impossibilita segunda fonte de verdade clínica; toda importação é
  auditável ponta a ponta (licença→transformação→teste); o valor forense do legado
  permanece disponível como evidência citável; G7 ganha fronteira clara (fixture
  sintética fixada, jamais dado legado).
- **Negativas:** importar é caro por desenho — pressão de prazo vai testar a política;
  material legado útil pode ficar retido à espera de revisão clínica/segurança.
- **Neutras/estruturais:** a revisão forense legada (corpus já existente) segue como
  fonte de evidência de G1; a política vale igualmente para qualquer "legado futuro"
  (sistemas de clientes) — importação é sempre a mesma porta L3/L4.

## 6. Implicações transversais

| Dimensão | Implicação | Rótulo |
|---|---|---|
| Segurança clínica | L3/L7 impedem que regra ou expectativa clínica legada não revisada vire comportamento da V2; revisão clínica é requisito L4 | SOURCE (§3 r4/§14) |
| Segurança (security) | L4 exige revisão de segurança por artefato; L1 read-only elimina contaminação bidirecional; dependências legadas não entram sem SCA | INFERENCE |
| Privacidade (LGPD, minimização, propósito) | L6: dado real bloqueado até base legal aprovada (G6/G8); construção 100% SYNTH-; CI de conteúdo proibido cobre fixtures | SOURCE (DEC-G0-03/GDEC-0013) |
| Interoperabilidade | Importação mira o canônico e daí os perfis do ADR-0013 — nunca formato legado como contrato | INFERENCE |
| Acessibilidade | Não aplicável diretamente — política de dados/artefatos; telas legadas não são copiadas (L2), o que evita herdar barreiras de acessibilidade | — |
| Operacional | Importações são jobs idempotentes re-executáveis com relatório de quarentena (L3); falha de importação não corrompe estado (transacional, ADR-0010 B1) | INFERENCE |
| Custo | Custo por artefato explícito (revisões L4) — o barato-agora do bootstrap B foi rejeitado por custo composto | PROPOSAL |
| Migração | L5: história de migração independente com clean-install; cutover legado→V2 fora do MVP (L8) e sujeito a ADR próprio | SOURCE (§3 r5) |

## 7. Reversibilidade, gatilhos de revisita e rollback

**Reversibilidade:** alta — a política é processo, não estado; fatos já importados são
imutáveis (M1) mas marcados com origem legada, portanto isoláveis/supersedíveis por
correção explícita (M8). Encalhado em reversão: nada material.

| # | Gatilho de revisita | Detecção | Ação |
|---|---|---|---|
| T1 | Primeira proposta real de importação de dado clínico | Solicitação registrada | Instanciar L4+L6; decisão do titular; nada entra antes |
| T2 | Proposta de cutover legado→V2 (cliente/instalação) | Solicitação registrada | ADR próprio de cutover; L8 não autoriza |
| T3 | Importação flagrada fora da porta L3 (bypass) | CI/revisão/auditoria | Defeito bloqueante; remoção ou regularização integral |
| T4 | Base legal aprovada em G6/G8 muda o alcance de L6 | Registro AUTH-PRIVACY-LEGAL | Revisitar L6 com a base aprovada |

**Kill/rollback:** jobs de importação têm dry-run e são idempotentes (L3) — abortar no
meio não deixa estado parcial fora da transação; fatos importados indevidamente são
supersedidos por correção explícita (ADR-0005 M8) com trilha, nunca apagados
silenciosamente (auditoria append-only).

## 8. Validação

| # | Alegação | Método | Vínculos |
|---|---|---|---|
| V1 | Importação idempotente (re-execução não duplica) | Teste de importação dupla sobre fixture SYNTH- | TST: pendente de arquitetura de teste |
| V2 | Artefato sem dossiê L4 é barrado | Verificação de CI/convenção + revisão | scripts/check_doc_conventions.py (docs); revisão de PR |
| V3 | Clean-install da história de migração V2 | Teste de clean-install em CI (já premissa do scaffolding) | TST: pendente |
| V4 | Fatos importados carregam origem legada na proveniência | Teste de asserção de proveniência (M1) | TST: pendente; HAZ: hazard-log |

## 9. Supersessão

- **Supersede:** nenhum. **Superseded por:** nenhum.
- Relações: consome ADR-0005 (porta canônica); alimenta ADR-0013 (formato de destino) e
  ADR-0018 (retenção/auditoria do importado); um eventual cutover legado→V2 exigirá ADR
  novo que a esta minuta se subordina.
