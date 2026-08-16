---
id: ADR-0014
title: Exposição MCP no MVP — classes de ferramenta permitidas, confirmação humana e política de PHI
status: PROPOSAL   # regra de CI (agente não grava DECIDED/accepted no front matter); status do ADR no corpo: accepted (direção GDEC-0016; minuta materializada em construção — GDEC-0015)
date: 2026-08-16
last_updated: 2026-08-16
owner: rodaquino-OMNI (titular decisor da direção — GDEC-0016, modificação vinculante "MANTER MCP no MVP"); redator - agente de minutas de ADR (ciclo 6); o redator não é aprovador
approvers:
  - AUTH-SECURITY (detida por rodaquino-OMNI na fase de projeto, DEC-G0-02)
  - AUTH-PRIVACY-LEGAL (UNASSIGNED — VALIDATION REQUIRED; reservada a G6/G8, DEC-G0-03)
  - AUTH-CLINSAFETY (detida por rodaquino-OMNI, GDEC-0003)
source: >
  INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §12.4 (MCP), §13, §20 (MCP/agente jamais vira
  fonte não revisada de verdade clínica); docs/06-architecture/adrs/adr-index.md (linha
  ADR-0014; dependências 0012/0016/0017; Gates G5/G6); GDEC-0016 (modificação do titular:
  MANTER MCP no MVP); ADR-0011 (aceito, P1-P10), ADR-0009 (aceito), ADR-0010 (aceito)
provenance:
  source_repo: intensicare-V2
  path_or_url: docs/06-architecture/adrs/ADR-0014-exposicao-mcp-classes-de-ferramenta-phi.md
  commit_sha_or_version: 33c749a (branch cycle-6/construcao-g7, base da redação)
  section_or_lines: prompt §12.4/§13/§20; adr-index.md §3, §4.1, §5
  date_collected: 2026-08-16
  collector: agente de minutas de ADR (ciclo 6)
  transformation: reasoned-from — materialização em minuta de direção já aceita pelo titular (GDEC-0016); a decisão não é reaberta
  confidence: medium
  validation_status: VALIDATION REQUIRED (conferência do titular sobre a materialização; a direção em si está aceita)
links:
  adrs:
    depends_on: [ADR-0012, ADR-0015, ADR-0016, ADR-0017]
    feeds: [ADR-0024]
  gates: [G5, G6]
supersedes: null
superseded_by: null
---

# ADR-0014 — Exposição MCP no MVP: classes de ferramenta, confirmação humana e política de PHI

> **Status: accepted (direção GDEC-0016; minuta materializada em construção — GDEC-0015).**
> **Modificação vinculante do titular (GDEC-0016): MANTER MCP no MVP — a superfície de
> ferramentas está INCLUÍDA.** Esta minuta documenta e detalha a direção aceita; não a
> reabre. Aceito ≠ implementado ≠ verificado: nada aqui fecha G5 ou G6. Nota de coerência
> com a fatia G7: **nenhuma superfície MCP existe na fatia em construção** — este ADR
> fixa a política que qualquer superfície futura obedecerá.

## 1. Contexto e formulação do problema

SOURCE (prompt §12.4): *"MCP is an integration/tool surface, not a clinical source of
truth and not an authorization boundary"* — e a lista vinculante de controles: ferramentas
estreitas/tipadas/versionadas, read-only por default, confirmação humana explícita para
escritas de alta consequência, mesma política de identidade/tenant/propósito/recurso/
auditoria das APIs de primeira parte, minimização/redação de PHI, defesa contra prompt
injection, e *"never let model-generated prose replace the signed deterministic
evaluation record"*. SOURCE (prompt §20): jamais deixar um agente MCP/IA tornar-se fonte
não revisada de verdade clínica.

SOURCE (GDEC-0016, modificação do titular): a direção anterior de adiar MCP foi
**substituída** — MCP fica no MVP, com superfície de ferramentas incluída. INFERENCE: o
que resta a este ADR é fixar **como** essa superfície existe sem violar §12.4/§20: quais
classes de ferramenta, sob qual identidade, com qual política de PHI e qual trilha.

**Pergunta.** Sob que classes de ferramenta, controles de identidade/autorização,
política de PHI e trilha de auditoria a superfície MCP do MVP pode existir?

**Fora de escopo:** a camada de agentes clínicos e a separação kernel×agente (ADR-0024,
que consome este ADR); mecanismo concreto de autenticação (ADR-0015) e de isolamento de
tenant (ADR-0016); criptografia/chaves (ADR-0017); contrato REST (ADR-0012).

## 2. Drivers de decisão

| # | Driver | Por que importa aqui |
|---|---|---|
| D1 | Modificação vinculante do titular: MCP no MVP | A opção "excluir do MVP" está decidida contra; o desenho deve tornar a inclusão segura |
| D2 | MCP não é fronteira de autorização (§12.4) | Toda chamada precisa da mesma autorização das APIs de primeira parte |
| D3 | PHI e provedores de modelo (§12.4; §13) | PHI não pode sair para provedor de modelo sem controles aprovados; reserva jurídica G6/G8 vigente (DEC-G0-03) |
| D4 | Verdade clínica permanece determinística (§20) | Nenhuma saída de ferramenta/modelo substitui o registro assinado do kernel |
| D5 | Auditabilidade por chamada (§12.4) | Sem trilha por chamada, G6 não tem evidência adversarial possível |
| D6 | Injeção de prompt e confused deputy (§12.4/§13) | Conteúdo clínico é insumo não confiável por definição |

## 3. Alternativas consideradas

### Opção A — MCP no MVP com classes restritas de ferramenta (DIREÇÃO ACEITA — GDEC-0016)

Superfície MCP incluída, limitada a: **leitura de projeções autorizadas** e **comandos com
confirmação humana**, sob a identidade/autorização dos ADR-0015/0016 e trilha de auditoria
por chamada.

- **Positivas:** honra a modificação do titular; valor de integração (agentes e
  ferramentas do ecossistema) desde o MVP; política nasce junto com a superfície, não
  depois; reutilização integral da pilha de segurança de primeira parte.
- **Negativas:** amplia a superfície de ataque do MVP (G6 ganha escopo adversarial MCP);
  custo de testes adversariais dedicados; risco de expectativa de "agente autônomo" que a
  política deliberadamente frustra.

### Opção B — Excluir MCP do MVP e adiar para pós-G8

- **Positivas:** menor superfície de ataque; menos escopo em G5/G6.
- **Negativas:** contraria a decisão registrada do titular; integrações nasceriam ad hoc
  fora de política. **Rejeitada pelo titular (GDEC-0016) — registrada aqui como
  alternativa real que foi decidida contra.**

### Opção C — MCP amplo com escrita autônoma (ferramentas de escrita sem confirmação)

- **Positivas:** máxima automação aparente.
- **Negativas:** viola §12.4 (confirmação humana para escrita de alta consequência é
  obrigatória) e §20 (ação clínica autônoma); transformaria MCP em fronteira de
  autorização de fato. **Rejeitada — incompatível com regra não negociável.**

### Opção Z — Adiar a política (incluir MCP sem ADR)

- **Custo do adiamento:** superfície sem política é exatamente o cenário que §12.4
  proíbe ("before exposing any MCP server…"). **Rejeitada.**

## 4. Decisão e escopo

> **DIREÇÃO ACEITA (GDEC-0016, 2026-08-16; decided_by: rodaquino-OMNI, titular).**
> Opção A — MCP mantido no MVP com a minuta normativa T1–T10 abaixo materializando a
> direção (GDEC-0015). Detalhamentos além da direção estão marcados como PREMISSA.

**T1 — Natureza da superfície.** MCP é superfície de integração/ferramenta: **não** é
fonte de verdade clínica, **não** é fronteira de autorização, **não** é o sistema de
registro (prompt §12.4; §3 regra 9). Antes de expor qualquer servidor ou consumir
qualquer ferramenta: propósito de usuário e de sistema, classe de dado permitida, modelo
de ameaça e modelo de supervisão humana registrados.

**T2 — Classes de ferramenta permitidas.** Exatamente duas classes no MVP:

| Classe | Conteúdo | Regra dura |
|---|---|---|
| **L — Leitura de projeções autorizadas** | Consultas estreitas, tipadas e versionadas sobre as projeções do ADR-0011 (escopo em toda chave, P2; autorização a cada acesso, P3) | Read-only por default; nenhum payload clínico bruto; resposta carrega proveniência, frescor, avisos e status de avaliação fielmente (P7) |
| **C — Comando com confirmação humana** | Comandos de domínio que **já existem** na API de primeira parte (ex.: reconhecer um item de trabalho, ADR-0009), com Idempotency-Key e concorrência otimista | **Nenhuma escrita clínica sem confirmação humana explícita**; ação clínica autônoma proibida salvo aprovação separada e registrada (§12.4) |

Tudo que não está nas classes L/C é **proibido**: escrita autônoma, exportação em massa,
acesso a envelope bruto, administração de tenant/regra/configuração, encadeamento que
contorne confirmação.

**T3 — Identidade e autorização reutilizadas.** Toda chamada MCP porta identidade
autenticada conforme ADR-0015 (humano ou máquina-a-máquina) e é autorizada conforme
ADR-0016 (tenant, propósito, recurso) — **as mesmas políticas, os mesmos pontos de
enforcement** das APIs de primeira parte. Sessão MCP jamais eleva privilégio; defesas de
confused deputy exigidas. PREMISSA (reversível, GDEC-0015/0017): enquanto as minutas de
ADR-0015/0016 não estão materializadas, a fatia usa a autenticação/autorização de
construção do scaffolding, e a superfície MCP permanece inexistente.

**T4 — Política de PHI: minimização e redação.** Ferramentas expõem **projeções de
propósito** com o mínimo de campos; identificadores diretos são redigidos por default;
**nenhum PHI é enviado a provedor de modelo sem controles legais, de privacidade, de
segurança, de residência e contratuais aprovados** (§12.4) — reserva AUTH-PRIVACY-LEGAL
em G6/G8 (DEC-G0-03). Em construção, exclusivamente dados sintéticos marcados "SYNTH-".

**T5 — Trilha de auditoria por chamada.** Cada chamada registra, em auditoria
append-only (mesma fronteira transacional do ADR-0010 B1 quando houver efeito): identidade,
tenant, ferramenta+versão, propósito declarado, hash dos insumos, classe do resultado,
decisão de autorização (incluindo negativas), proveniência/frescor do dado servido,
correlação/causalidade e latência. Negativa também é evidência (G6).

**T6 — Anti-injeção e separação de conteúdo.** Instruções confiáveis são separadas de
conteúdo clínico/documental não confiável; entradas e saídas validadas contra schema;
saídas carregam proveniência, frescor, avisos e confiança (§12.4).

**T7 — Idempotência e concorrência.** Comandos (classe C) usam Idempotency-Key e
controle otimista de concorrência — mesmas garantias do contrato ADR-0012/backbone
ADR-0010 (B2).

**T8 — Operabilidade e kill switch.** Cada ferramenta é individualmente: rate-limited,
monitorada (ADR-0020), revogável e desligável por kill switch sem redeploy.

**T9 — Testes adversariais obrigatórios.** Acesso não autorizado, inferência cross-tenant,
confused deputy, replay, injeção, exfiltração, encadeamento inseguro, dado obsoleto e
falha parcial — suíte exigida para G5/G6 (§12.4).

**T10 — Verdade clínica.** Nenhuma prosa gerada por modelo substitui o registro
determinístico assinado de avaliação (§12.4 última cláusula; §20). A relação
agente×kernel é matéria do ADR-0024, que herda T1–T9.

**Escopo vinculado:** toda superfície MCP da V2 (exposta ou consumida). **Não vincula:**
seleção de SDK/transporte MCP (drivers próprios, §3 regra 14), quais ferramentas
concretas existem (cada ferramenta nasce por mudança revisada com propósito registrado).

## 5. Consequências

- **Positivas:** integração com ecossistema de agentes desde o MVP sob política única;
  reuso integral de identidade/autorização/auditoria; G6 ganha escopo adversarial
  definido em vez de descoberto tarde.
- **Negativas:** superfície de ataque adicional no MVP; custo de suíte adversarial e de
  operação por ferramenta (rate limit, kill switch, monitoração); a reserva
  AUTH-PRIVACY-LEGAL limita qualquer uso com dado real até G6/G8.
- **Neutras/estruturais:** MCP vira consumidor das projeções (ADR-0011) e do contrato de
  comandos (ADR-0012) — nenhuma via paralela de dados é criada.

## 6. Implicações transversais

| Dimensão | Implicação | Rótulo |
|---|---|---|
| Segurança clínica | T2/T10: nenhuma escrita clínica sem humano; verdade clínica permanece no kernel determinístico | SOURCE (§12.4/§20) |
| Segurança (security) | T3/T6/T9: mesma autorização de primeira parte, anti-injeção, suíte adversarial; MCP jamais é fronteira de autorização | SOURCE (§12.4) |
| Privacidade (LGPD, minimização, propósito) | T4: minimização por projeção de propósito, redação por default, PHI a provedor de modelo bloqueado até aprovação G6/G8 | SOURCE (§12.4; DEC-G0-03) |
| Interoperabilidade | Ferramentas tipadas/versionadas atadas a comandos/consultas de domínio; sem canal paralelo ao contrato ADR-0012 | INFERENCE |
| Acessibilidade | Não aplicável diretamente — superfície máquina-a-máquina; confirmações humanas acontecem na UI (ADR-0021, WCAG 2.2 AA) | — |
| Operacional | T8: rate limit, monitoração, revogação, kill switch por ferramenta; métricas alimentam ADR-0020 | INFERENCE |
| Custo | Custo incremental por ferramenta (autoria, testes adversariais, operação) — deliberadamente linear, não plataforma aberta | PROPOSAL |
| Migração | Nenhum dado migra por MCP; importação legada é ADR-0023 e não passa por esta superfície | INFERENCE |

## 7. Reversibilidade, gatilhos de revisita e rollback

**Reversibilidade:** alta — a superfície inteira tem kill switch (T8) e nenhum estado
clínico reside nela (T1); desligar MCP não perde dado clínico. Encalhado em reversão:
ferramentas autoradas e integrações de terceiros dependentes.

| # | Gatilho de revisita | Detecção | Ação |
|---|---|---|---|
| T1 | Primeira ferramenta concreta proposta | Mudança revisada | Conferir T1–T9 antes de expor; registrar propósito/ameaça |
| T2 | Pedido de PHI real na superfície | Solicitação registrada | Bloquear até aprovação AUTH-PRIVACY-LEGAL (G6/G8) |
| T3 | Achado adversarial P0/P1 (T9) | Suíte/pentest | Kill switch da ferramenta; revisita do desenho |
| T4 | Materialização dos ADR-0015/0016 | Aceite das minutas | Reconciliar T3 com os mecanismos decididos |
| T5 | Pressão por escrita autônoma (classe fora de L/C) | Solicitação registrada | Exige revisão formal deste ADR pelo titular — nunca exceção local |

**Kill/rollback:** kill switch por ferramenta e global (T8), acionável pelo operador sem
redeploy; após desligamento, nenhuma reconciliação clínica é necessária (MCP não é
sistema de registro); auditoria T5 preserva o histórico.

## 8. Validação

| # | Alegação | Método | Vínculos |
|---|---|---|---|
| V1 | Classe L nunca escreve; classe C exige confirmação | Testes de contrato negativo por ferramenta | TST: pendente de arquitetura de teste |
| V2 | Autorização idêntica à de primeira parte | Testes comparativos de política (mesma decisão nos dois caminhos) | TST: pendente; G6 |
| V3 | Redação/minimização de PHI efetiva | Vetores SYNTH- com campos sensíveis; CI de conteúdo proibido | scripts/check_forbidden_content.py; TST: pendente |
| V4 | Trilha por chamada completa (incl. negativas) | Teste de auditoria append-only por chamada | TST: pendente |
| V5 | Resistência adversarial (T9) | Suíte adversarial + pentest em ambiente nomeado | VAL: pendente (G6) |

## 9. Supersessão

- **Supersede:** nenhum. **Superseded por:** nenhum.
- Relações: consome ADR-0011/0012 e as direções de ADR-0015/0016/0017; alimenta
  ADR-0024 (agentes clínicos herdam T1–T9).
