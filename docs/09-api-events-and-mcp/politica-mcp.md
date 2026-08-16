---
doc_id: API-EVENTS-MCP-POLITICA-MCP
status: PROPOSAL
owner: UNASSIGNED — VALIDAÇÃO NECESSÁRIA
source: >
  docs/06-architecture/adrs/ADR-0014-exposicao-mcp-classes-de-ferramenta-phi.md
  (accepted — direção GDEC-0016 c/ modificação do titular "MANTER MCP no
  MVP"; minuta materializada em construção GDEC-0015; T1-T10);
  INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §12.4, §13, §20; busca no
  código-fonte de apps/ e packages/ (nenhuma referência a MCP encontrada,
  OBSERVADO, 2026-08-16)
date_collected: 2026-08-16
collector: especialista de publicação de contratos como documentação (SPR-G4-4, ciclo 6)
last_updated: 2026-08-16
---

# Política MCP — espelho operacional da ADR-0014 (fatia SPR-G7-2)

PREMISSA (reversível, GDEC-0015/0017): este documento **espelha
operacionalmente** a direção já aceita da ADR-0014 (GDEC-0016) — não a
reabre, não a reinterpreta, não adiciona cláusula normativa nova. Onde este
documento detalha algo além do texto literal da ADR, isso está marcado
PROPOSAL. Nenhuma alegação de efetividade clínica, conformidade regulatória
ou segurança comprovada é feita aqui. Nenhum dado real foi acessado.

> **NENHUMA SUPERFÍCIE MCP EXISTE IMPLEMENTADA NESTA FATIA.**
> OBSERVADO (2026-08-16): busca em `apps/` e `packages/` não encontrou
> nenhum servidor, cliente, ferramenta, SDK ou referência de código a MCP.
> Este documento descreve a política que qualquer superfície MCP futura
> deverá obedecer — não descreve nada que exista hoje em execução.

## 1. Por que este documento existe

A ADR-0014 (accepted em direção, GDEC-0016; minuta materializada, GDEC-0015)
fixa a política MCP do MVP. Este arquivo existe para que quem for **construir**
uma ferramenta MCP concreta tenha, no diretório de documentação de API/
eventos/MCP (`docs/09-api-events-and-mcp/`, designado pelo prompt §16),
uma referência operacional resumida — sem precisar reconstruir o raciocínio
completo da ADR (contexto, alternativas, drivers) para aplicá-la
corretamente. Em caso de qualquer divergência de leitura entre este
documento e `ADR-0014-exposicao-mcp-classes-de-ferramenta-phi.md`, **a ADR
prevalece** — este é um espelho, não uma fonte alternativa.

## 2. Modificação vinculante do titular

SOURCE (GDEC-0016, 2026-08-16, decided_by: rodaquino-OMNI): a direção
anterior de adiar MCP foi **substituída** — **MCP fica no MVP**, com
superfície de ferramentas incluída. A pergunta que resta não é "incluir ou
não" — está decidida a favor da inclusão — mas **como** essa superfície
existe sem violar o prompt §12.4/§20.

## 3. Natureza da superfície (T1)

MCP é superfície de **integração/ferramenta**. MCP:

- **NÃO** é fonte de verdade clínica;
- **NÃO** é fronteira de autorização;
- **NÃO** é o sistema de registro.

Antes de expor qualquer servidor ou consumir qualquer ferramenta MCP:
propósito de usuário e de sistema, classe de dado permitida, modelo de
ameaça e modelo de supervisão humana precisam estar registrados por escrito
— para essa ferramenta específica.

## 4. Classes de ferramenta permitidas (T2) — exatamente duas

Nenhuma ferramenta MCP fora destas duas classes é permitida. Tudo que não
está em L ou C é **proibido**: escrita autônoma, exportação em massa, acesso
a envelope bruto, administração de tenant/regra/configuração, ou qualquer
encadeamento que contorne confirmação humana.

### Classe L — Leitura de projeções autorizadas

- Consultas estreitas, tipadas e versionadas sobre as projeções de leitura
  de ADR-0011 — nesta fatia, correspondente por exemplo a
  `GET /v1/projecoes/grade-leitos` e
  `GET /v1/pacientes/{pacienteRef}/avaliacoes` (ver `indice-de-
  contratos.md` §2.1) — **read-only por default**.
- Nenhum payload clínico bruto — a resposta carrega proveniência, frescor,
  avisos e status de avaliação fielmente (ADR-0011 P7), nunca um número
  "limpo" sem esses acompanhamentos.

### Classe C — Comando com confirmação humana

- Comandos de domínio que **já existem** na API de primeira parte (ex.:
  `POST /v1/alertas/{id}/reconhecer`, ver ADR-0009) — MCP nunca inventa um
  comando próprio.
- Portam `Idempotency-Key` e concorrência otimista (`If-Match`) — as mesmas
  garantias de `ADR-0012`/`ADR-0010` B2, não um mecanismo paralelo.
- **Nenhuma escrita clínica sem confirmação humana explícita.** Ação clínica
  autônoma é proibida, salvo aprovação separada e registrada.

## 5. Identidade e autorização — reuso obrigatório, nunca via paralela (T3)

Toda chamada MCP porta identidade autenticada (mecanismo real: ADR-0015,
`not-started`) e é autorizada (mecanismo real: ADR-0016, `not-started`) —
**as mesmas políticas, os mesmos pontos de aplicação** das APIs de primeira
parte. Sessão MCP jamais eleva privilégio; defesas de "confused deputy" são
exigidas.

PREMISSA (reversível, GDEC-0015/0017): enquanto as minutas de ADR-0015/0016
não estão materializadas em implementação, e enquanto nenhuma ferramenta MCP
concreta existe, esta cláusula é **inaplicável na prática** — não há via
paralela porque não há via nenhuma. Isto não é uma exceção à política; é o
estado factual de "superfície inexistente" descrito acima.

## 6. Política de PHI: minimização e redação por default (T4)

- Ferramentas expõem **projeções de propósito** com o mínimo de campos.
- Identificadores diretos são redigidos por default.
- **Nenhum PHI é enviado a provedor de modelo** sem controles legais, de
  privacidade, de segurança, de residência e contratuais aprovados —
  reserva `AUTH-PRIVACY-LEGAL`, prevista para G6/G8 (DEC-G0-03).
- Em construção (regime atual): exclusivamente dados sintéticos marcados
  `SYNTH-` (GDEC-0014). Nenhuma ferramenta MCP desta fatia pode, mesmo
  hipoteticamente, ter acesso a dado que não seja sintético.

## 7. Trilha de auditoria por chamada (T5)

Cada chamada MCP — quando uma vier a existir — deve registrar, em auditoria
append-only (mesma fronteira transacional de ADR-0010 B1 quando houver
efeito):

| Campo exigido |
|---|
| identidade do chamador |
| tenant |
| ferramenta + versão |
| propósito declarado |
| hash dos insumos |
| classe do resultado |
| decisão de autorização (**incluindo negativas**) |
| proveniência/frescor do dado servido |
| correlação/causalidade |
| latência |

Uma negativa de autorização **também é evidência** relevante para G6 — não
deve ser omitida da trilha por não ter "resultado positivo".

## 8. Anti-injeção e separação de conteúdo (T6)

Instruções confiáveis são separadas de conteúdo clínico/documental **não
confiável**; entradas e saídas são validadas contra schema; toda saída
carrega proveniência, frescor, avisos e confiança — nunca prosa "limpa" sem
esse acompanhamento.

## 9. Idempotência e concorrência (T7)

Comandos de classe C usam `Idempotency-Key` e controle otimista de
concorrência — **as mesmas garantias** do contrato REST (`ADR-0012` K3/K4) e
do backbone (`ADR-0010` B2). MCP não define uma semântica de idempotência
própria.

## 10. Operabilidade e kill switch (T8)

Cada ferramenta MCP — quando existir — deve ser individualmente:
rate-limited, monitorada (ADR-0020), revogável e desligável por kill switch
**sem redeploy**.

## 11. Testes adversariais obrigatórios (T9)

Suíte exigida antes de G5/G6, cobrindo no mínimo: acesso não autorizado,
inferência cross-tenant, "confused deputy", replay, injeção, exfiltração,
encadeamento inseguro, dado obsoleto servido como atual, e falha parcial.
**Nenhuma ferramenta MCP entra em operação sem esta suíte.**

## 12. Verdade clínica permanece determinística (T10)

Nenhuma prosa gerada por modelo substitui o registro determinístico
assinado de avaliação clínica. A relação entre agente e núcleo clínico é
matéria da ADR-0024 (`not-started` em ciclo de vida formal; direção aceita
GDEC-0016), que herda T1-T9 integralmente — este documento não antecipa
aquele desenho.

## 13. Escopo vinculado e não vinculado

**Vinculado (enquanto premissa/direção aceita de construção):** toda
superfície MCP da V2, exposta ou consumida, em todo tenant e ambiente —
quando vier a existir.

**Não vinculado por este documento:** seleção de SDK/transporte MCP
concreto; quais ferramentas específicas existirão (cada uma nasce por
mudança revisada com propósito registrado); mecanismo real de autenticação
(ADR-0015) e autorização (ADR-0016) — apenas consumidos aqui por
referência; a relação agente×kernel clínico (ADR-0024).

## 14. Checklist operacional antes de expor a primeira ferramenta MCP

Esta lista é PROPOSAL — uma leitura operacional de T1-T9, não uma cláusula
adicional da ADR-0014. Antes de qualquer PR que introduza uma ferramenta
MCP:

1. Classe declarada (L ou C) e justificada — nenhuma terceira classe.
2. Propósito de usuário e de sistema registrado por escrito.
3. Modelo de ameaça específico da ferramenta registrado.
4. Autenticação/autorização comprovadamente reusam o mecanismo de primeira
   parte (nenhum caminho paralelo).
5. PHI: confirmação de que só dado sintético `SYNTH-` é acessível até
   aprovação `AUTH-PRIVACY-LEGAL` (G6/G8).
6. Trilha de auditoria por chamada implementada e testada, incluindo
   negativas.
7. Rate limit, monitoração e kill switch implementados.
8. Suíte adversarial (T9) executada e resultados registrados.
9. Se classe C: `Idempotency-Key` e concorrência otimista comprovadamente
   herdados do comando de primeira parte, não reimplementados.

## 15. Autoverificação

Este documento não eleva o status de ciclo de vida da ADR-0014 (permanece
`proposed` em `adr-index.md`, não tocado por esta tarefa). Nenhuma
ferramenta, servidor ou capacidade MCP é declarada como existente — a
ausência de implementação é afirmada explicitamente e foi verificada por
busca no código-fonte antes da redação. Nenhum dado real, CPF formatado ou
PSR real aparece neste documento.
