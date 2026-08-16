---
id: ADR-0024
title: Inclusão governada de IA/ML — separação dura kernel determinístico × camada de agentes, com conector para agentes clínicos no workflow
status: PROPOSAL   # regra de CI (agente não grava DECIDED/accepted no front matter); status do ADR no corpo: accepted (direção GDEC-0016; minuta materializada em construção — GDEC-0015)
date: 2026-08-16
last_updated: 2026-08-16
owner: rodaquino-OMNI (titular decisor da direção — GDEC-0016, modificação vinculante "MANTER IA/ML"); redator - agente de minutas de ADR (ciclo 6); o redator não é aprovador
approvers:
  - AUTH-CLINSAFETY (detida por rodaquino-OMNI, GDEC-0003)
  - AUTH-SECURITY (detida por rodaquino-OMNI na fase de projeto, DEC-G0-02)
  - AUTH-PRIVACY-LEGAL (UNASSIGNED — VALIDATION REQUIRED; reservada a G6/G8, DEC-G0-03)
source: >
  INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §12.4 (última cláusula), §13 (ameaças MCP/IA),
  §14 (mutação no kernel determinístico), §20 (agente jamais vira fonte não revisada de
  verdade clínica), §3 regra 15 (autoridade clínica humana); adr-index.md (linha
  ADR-0024; depende de 0007/0008/0014; Gates G2/G6); GDEC-0016 (modificação do titular:
  MANTER IA/ML, inclusão governada com conector para agentes clínicos); ADR-0007 (aceito),
  ADR-0008 (aceito), ADR-0009 (aceito)
provenance:
  source_repo: intensicare-V2
  path_or_url: docs/06-architecture/adrs/ADR-0024-ia-ml-inclusao-governada-agentes-clinicos.md
  commit_sha_or_version: 33c749a (branch cycle-6/construcao-g7, base da redação)
  section_or_lines: prompt §12.4/§13/§14/§20, §3 r15; adr-index.md §3, §4.1, §5
  date_collected: 2026-08-16
  collector: agente de minutas de ADR (ciclo 6)
  transformation: reasoned-from — materialização em minuta de direção já aceita pelo titular (GDEC-0016); a decisão não é reaberta
  confidence: medium
  validation_status: VALIDATION REQUIRED (conferência do titular sobre a materialização; a primeira exposição real exige revisita formal — ver §7)
links:
  adrs:
    depends_on: [ADR-0007, ADR-0008, ADR-0014]
    feeds: []
  gates: [G2, G6]
supersedes: null
superseded_by: null
---

# ADR-0024 — Inclusão governada de IA/ML e conector para agentes clínicos no workflow

> **Status: accepted (direção GDEC-0016; minuta materializada em construção — GDEC-0015).**
> **Modificação vinculante do titular (GDEC-0016): MANTER IA/ML — inclusão GOVERNADA,
> com possibilidade e CONECTOR para agentes clínicos no workflow.** Esta minuta documenta
> e detalha a direção aceita; não a reabre. Aceito ≠ implementado ≠ verificado. Nota de
> coerência com a fatia G7: **nenhuma superfície de IA/ML ou agente existe na fatia em
> construção** — este ADR fixa a política que qualquer superfície futura obedecerá.

## 1. Contexto e formulação do problema

SOURCE (prompt §20): jamais deixar um agente MCP/IA tornar-se **fonte não revisada de
verdade clínica**. SOURCE (prompt §12.4, última cláusula): prosa gerada por modelo nunca
substitui o registro determinístico assinado de avaliação. SOURCE (prompt §3 regra 15):
a autoridade de decisão clínica permanece com humanos responsáveis; automação pode
calcular, sumarizar, rotear e explicar dentro do uso pretendido aprovado — nunca
expandi-lo silenciosamente. SOURCE (ADR-0007/0008/0009, aceitos): o conteúdo clínico
executável são rule bundles imutáveis e versionados; o status de avaliação tem semântica
de cinco estados; alertas/itens de trabalho têm máquina de estados auditada.

SOURCE (GDEC-0016, modificação do titular): a alternativa de excluir IA/ML do MVP foi
**substituída** — IA/ML fica, como inclusão governada, com conector para agentes
clínicos no workflow. INFERENCE: o que resta a este ADR é fixar a **separação dura**
entre o que decide clinicamente (kernel determinístico) e o que assiste (camada de
agentes), e os gatilhos que forçam revisita antes de qualquer exposição real.

**Pergunta.** Como IA/ML e agentes clínicos participam do workflow da V2 sem jamais se
tornarem fonte de avaliação clínica, e sob que atribuição, registro e gatilhos de
revisita?

**Fora de escopo:** a superfície de ferramentas em si (ADR-0014, que este ADR consome);
seleção de modelo/fornecedor (nenhuma é feita aqui — §3 regra 14); conteúdo clínico dos
rule bundles (ADRs clínicos 0025–0029); qualquer alegação de efetividade clínica.

## 2. Drivers de decisão

| # | Driver | Por que importa aqui |
|---|---|---|
| D1 | Modificação vinculante do titular: MANTER IA/ML | A opção "excluir do MVP" está decidida contra; o desenho deve tornar a inclusão governável |
| D2 | Verdade clínica determinística e reproduzível (§20; DOM-0003 replay) | Saída de modelo não é determinística nem re-derivável — não pode gerar avaliação |
| D3 | Autoridade clínica humana (§3 r15) | Agente propõe; humano dispõe; uso pretendido não se expande silenciosamente |
| D4 | Ameaças específicas de IA (§13) | Injeção, exfiltração, encadeamento inseguro, saída sem fundamento — exigem controles próprios |
| D5 | PHI e provedores de modelo (§12.4; DEC-G0-03) | Reserva jurídica vigente: sem controles aprovados, nenhum PHI sai para provedor |
| D6 | Auditabilidade da assistência | Se a saída do agente influencia trabalho clínico, ela precisa ser atribuída e registrada como qualquer outro insumo |

## 3. Alternativas consideradas

### Opção A — Inclusão governada: separação dura kernel × agentes + conector de agentes clínicos no workflow (DIREÇÃO ACEITA — GDEC-0016)

- **Positivas:** honra a modificação do titular; valor assistivo (explicação,
  priorização, redação) sem tocar a verdade clínica; governança nasce antes da primeira
  superfície; conector reutiliza integralmente a política MCP (ADR-0014).
- **Negativas:** duas camadas para operar e auditar; risco de os usuários tratarem
  prosa de agente como verdade (mitigado por marcação obrigatória, mas não eliminado);
  custo de vigilância contínua.

### Opção B — Exclusão total de IA/ML do MVP

- **Positivas:** menor superfície de risco; G2/G6 mais simples.
- **Negativas:** contraria a decisão registrada do titular; empurraria a demanda real de
  assistência para integrações não governadas. **Rejeitada pelo titular (GDEC-0016) —
  registrada como alternativa real decidida contra.**

### Opção C — IA/ML no laço de avaliação (modelo gera/ajusta escore, gating ou alerta)

- **Positivas:** potencial de detecção além das regras determinísticas.
- **Negativas:** viola §20 e §12.4 (fonte não revisada de verdade clínica; prosa de
  modelo substituindo registro assinado); quebra replay determinístico (DOM-0003) e a
  cadeia de validação clínica dos ADRs 0025–0028; inviabiliza mutação/vetores red-green
  do kernel (§14). **Rejeitada — incompatível com regra não negociável.** Qualquer
  futuro uso preditivo exigiria ADR próprio, validação clínica formal e aprovação
  regulatória aplicável — fora deste escopo.

### Opção Z — Adiar a política mantendo a possibilidade

- **Custo do adiamento:** a primeira ferramenta de agente nasceria sem regra de
  atribuição/registro — exatamente o cenário §20. **Rejeitada.**

## 4. Decisão e escopo

> **DIREÇÃO ACEITA (GDEC-0016, 2026-08-16; decided_by: rodaquino-OMNI, titular —
> AUTH-CLINSAFETY; cláusulas de segurança sob AUTH-SECURITY; reserva
> AUTH-PRIVACY-LEGAL em G6/G8).** Opção A, materializada na minuta normativa A1–A10
> (GDEC-0015). Detalhamentos além da direção estão marcados como PREMISSA.

**A1 — Separação dura.** O **kernel determinístico** (`packages/kernel-clinico`) é a
**única fonte de avaliação clínica**: escores, gating etário/populacional (ADR-0027),
status de avaliação (ADR-0008), disparo/supressão de alerta (ADR-0009) — tudo sob rule
bundles imutáveis e versionados (ADR-0007), com replay determinístico e vetores
red-green (§14). **Nenhum modelo de IA participa de cálculo, gating, disparo, supressão
ou status** — nem como fallback, nem como desempate, nem como "ajuste".

**A2 — Camada de agentes: funções permitidas.** Agentes (LLM ou outro ML) podem, sobre
resultados que o kernel já produziu: **explicar** (tradução compreensível do resultado
determinístico e de seus porquês), **priorizar** (propor ordenação de itens de trabalho
já existentes — a fila autoritativa permanece a do ADR-0009), **redigir** (minutas de
texto para revisão humana) e **sumarizar**. Funções fora desta lista — em particular
qualquer forma de avaliação, predição clínica ou ação autônoma — são proibidas sem
revisão formal deste ADR pelo titular.

**A3 — Atribuição obrigatória.** Toda saída de agente carrega: identidade do agente,
modelo e versão, hash de configuração/prompt, insumos referenciados (IDs dos registros
determinísticos consumidos), timestamp e indicador de confiança/aviso quando disponível.
Saída sem atribuição completa é defeito bloqueante.

**A4 — Registro ao lado, jamais no lugar.** A saída do agente é registrada **ao lado**
do registro determinístico assinado, ligada a ele por referência — nunca o substitui,
nunca o edita, nunca aparece sem o resultado determinístico correspondente acessível
(§12.4 última cláusula). O registro determinístico permanece a verdade; a saída do
agente é anotação assistiva auditável.

**A5 — Estado "não revisado" explícito.** Toda saída de agente nasce marcada **não
revisada** e assim é exibida (a linguagem de apresentação é do frontend — ADR-0021 —
mas o estado vem do backend). Revisão humana explícita transiciona o estado, com
identidade do revisor e timestamp em auditoria. **Uma saída de agente jamais se torna
fonte de verdade clínica sem revisão humana registrada (§20).**

**A6 — Conector de agentes clínicos no workflow.** Agentes participam do workflow
exclusivamente pela superfície MCP do ADR-0014, herdando T1–T9: classe L para ler
projeções autorizadas, classe C para propor comandos que **sempre** exigem confirmação
humana; identidade/autorização dos ADR-0015/0016; trilha de auditoria por chamada;
anti-injeção (instruções confiáveis separadas de conteúdo clínico não confiável).
Nenhum canal paralelo de agente existe fora dessa superfície.

**A7 — PHI e provedores de modelo.** Nenhum PHI é enviado a provedor de modelo sem
controles legais, de privacidade, de segurança, de residência e contratuais aprovados
(§12.4; reserva AUTH-PRIVACY-LEGAL, DEC-G0-03). Em construção, exclusivamente dados
sintéticos "SYNTH-". PREMISSA (reversível, GDEC-0015/0017): nenhum modelo, fornecedor ou
modalidade de hospedagem de IA é selecionado por este ADR — qualquer seleção futura terá
drivers medidos próprios (§3 regra 14).

**A8 — Configuração de agente é artefato governado.** Prompts, configurações, versões de
modelo e políticas de agente são artefatos versionados e imutáveis por release
(analogia estrutural ao ADR-0007), com ativação, rollback e kill switch por agente —
autor não aprova o próprio conteúdo (§3 regra 10, na medida vigente sob GDEC-0013/0014).

**A9 — Vigilância contínua.** Métricas operacionais por agente: volume, latência, taxa
de aceitação/edição/rejeição humana das saídas, incidentes de conteúdo, negativas de
autorização — alimentando o ADR-0020. Sem alegação de efetividade clínica: números são
vigilância operacional, não evidência clínica.

**A10 — Testes específicos.** Além da suíte adversarial do ADR-0014 T9: testes de
injeção via conteúdo clínico, de saída sem fundamento (grounding nos registros
referenciados), de encadeamento inseguro entre ferramentas e de comportamento sob dado
obsoleto/parcial (ADR-0008) — exigidos antes de qualquer exposição além de SYNTH-.

**Escopo vinculado:** toda função de IA/ML e todo agente no workflow da V2. **Não
vincula:** seleção de modelo/fornecedor, conteúdo clínico de bundles, e qualquer uso
preditivo (que exigiria ADR próprio — Opção C rejeitada).

## 5. Consequências

- **Positivas:** o valor assistivo entra no MVP sem tocar o kernel; a verdade clínica
  permanece 100% determinística, replayável e mutável-testável; toda influência de
  agente sobre trabalho clínico é atribuída e auditável; a decisão do titular fica
  arquiteturalmente exequível.
- **Negativas:** custo de operar/auditar a segunda camada; risco residual de
  automation bias (usuário confiar na prosa não revisada) — mitigado por A5, não
  eliminado; a reserva de privacidade limita qualquer uso com dado real até G6/G8.
- **Neutras/estruturais:** a fronteira kernel×agente vira fronteira de módulo com
  enforcement de dependência (coerente com ADR-0002 Opção A — monolito modular com
  fronteiras bloqueantes de build); ADR-0014 é o único ponto de entrada de agentes.

## 6. Implicações transversais

| Dimensão | Implicação | Rótulo |
|---|---|---|
| Segurança clínica | A1/A4/A5: avaliação exclusivamente determinística; saída de agente nunca vira verdade sem revisão humana; hazard de automation bias registrado para o hazard log | SOURCE (§20/§3 r15); HAZ: pendente de entrada específica |
| Segurança (security) | A6/A10: superfície única (MCP), anti-injeção, grounding testado, kill switch por agente | SOURCE (§13/§12.4) |
| Privacidade (LGPD, minimização, propósito) | A7: PHI a provedor bloqueado até aprovação; minimização herdada de ADR-0014 T4; propósito por ferramenta | SOURCE (§12.4; DEC-G0-03) |
| Interoperabilidade | Saídas de agente não entram nos perfis FHIR de fato clínico (ADR-0013); se algum dia exportadas, serão recurso próprio marcado como assistivo — decisão futura | INFERENCE |
| Acessibilidade | Estados "não revisado"/atribuição precisam ser perceptíveis conforme WCAG 2.2 AA (não só cor); linguagem da marcação é do frontend (ADR-0021) | INFERENCE |
| Operacional | A8/A9: versão/rollback/kill switch por agente; vigilância no ADR-0020; degradação de agente jamais degrada o kernel (falha de agente = ausência de assistência, nunca ausência de avaliação) | INFERENCE |
| Custo | Custo por agente é explícito (config governada, testes A10, vigilância); custo de inferência/fornecedor só surge com seleção futura própria | PROPOSAL |
| Migração | Nenhum estado clínico reside na camada de agentes — removê-la ou trocá-la não perde verdade clínica; anotações A4 são preserváveis como histórico | INFERENCE |

## 7. Reversibilidade, gatilhos de revisita e rollback

**Reversibilidade:** alta por construção — A1/A4 garantem que desligar a camada de
agentes preserva integralmente o laço clínico. Encalhado em reversão: ferramentas e
configurações de agente, anotações assistivas históricas (permanecem como registro).

| # | Gatilho de revisita | Detecção | Ação |
|---|---|---|---|
| T1 | **Primeira exposição real** — primeiro uso com dado não sintético OU primeiro usuário clínico real, o que ocorrer antes | Promoção de ambiente/registro de acesso | **Revisita formal deste ADR pelo titular ANTES da exposição**: análise de hazards específica, modelo de ameaça IA (§13), estado da reserva AUTH-PRIVACY-LEGAL, aprovação registrada — sem isso, a exposição não ocorre |
| T2 | Proposta de função fora de A2 (ex.: predição) | Solicitação registrada | ADR próprio + validação clínica formal; nunca exceção local |
| T3 | Saída de agente flagrada influenciando estado clínico sem revisão | Auditoria/incidente | Kill switch do agente; incidente de segurança clínica; revisão de A4/A5 |
| T4 | Taxa de rejeição/edição humana anômala ou incidente de conteúdo | Vigilância A9 | Rollback de configuração (A8); investigação antes de reativar |
| T5 | Controles de PHI aprovados em G6/G8 | Registro AUTH-PRIVACY-LEGAL | Revisitar A7 com o perímetro aprovado |
| T6 | Materialização das minutas ADR-0015/0016/0021 | Aceites registrados | Reconciliar A5/A6 com os mecanismos decididos |

**Kill/rollback:** kill switch por agente e global (herdado de ADR-0014 T8), acionável
sem redeploy; desligar agentes não exige reconciliação clínica (nenhum estado clínico na
camada); configurações revertem por versão (A8) com trilha de auditoria.

## 8. Validação

| # | Alegação | Método | Vínculos |
|---|---|---|---|
| V1 | Kernel inalcançável por agentes (A1) | Teste de fronteira de módulo bloqueante de build + teste negativo de chamada | TST: pendente de arquitetura de teste |
| V2 | Saída sem atribuição é rejeitada (A3) | Teste de contrato negativo | TST: pendente |
| V3 | Registro sempre ao lado, nunca no lugar (A4) | Teste de persistência: anotação referencia registro determinístico existente; nunca o altera | TST: pendente |
| V4 | Estado não-revisado→revisado só por humano (A5) | Teste de transição com identidade de revisor em auditoria | TST: pendente |
| V5 | Grounding e anti-injeção (A10) | Vetores adversariais SYNTH- | VAL: pendente (G6) |
| V6 | Gatilho T1 é operante | Verificação de processo: promoção de ambiente bloqueada sem registro de revisita | VAL: pendente de backlog de validação |

## 9. Supersessão

- **Supersede:** nenhum. **Superseded por:** nenhum.
- Relações: consome ADR-0007/0008 (verdade determinística versionada), ADR-0009 (fila
  autoritativa) e ADR-0014 (superfície única de agentes); qualquer uso preditivo futuro
  exigirá ADR novo subordinado a este.
