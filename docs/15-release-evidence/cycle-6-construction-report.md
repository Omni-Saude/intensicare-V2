---
doc_id: CYCLE-6-CONSTRUCTION-REPORT
title: Relatório de execução do ciclo 6 — primeira construção da plataforma (SPR-G7-1/G7-2 e sprints destravados)
status: OBSERVED
owner: orquestrador de execução (ciclo 6) — síntese indelegável (prompt §0.5)
source: >-
  Árvore de trabalho da branch cycle-6/construcao-g7 (commits 33c749a..HEAD);
  docs/00-governance/registers/decision-register.md (GDEC-0013..GDEC-0017);
  docs/14-devsecops-and-delivery/mapa-de-projeto-ate-producao.md e
  mapa-de-projeto-backlog.yaml; INTENSICARE_V2_ORCHESTRATOR_PROMPT.md
  §5/§9/§10/§11/§12/§14/§15/§17/§20; docs/15-release-evidence/cycle-5-execution-report.md
date_collected: "2026-08-16"
collector: orquestrador de execução (ciclo 6); levantamento e construção por 22 especialistas estreitos
last_updated: "2026-08-16"
---

# Relatório de execução do ciclo 6 — primeira construção da plataforma

Rótulos epistêmicos conforme `docs/00-governance/evidence-notation.md`.
Este relatório **descreve** o que foi executado; não decide, não aprova e não
encerra gate, bloqueador, risco, hazard, ADR ou OS.

---

## 1. O que mudou de regime

O ciclo 5 encerrou com o painel adversarial AGT-4 operacional e a fila de
decisões do titular aberta. Entre `8927248` e `a6e7c0c`, o titular tomou quatro
decisões que mudaram o regime de trabalho (transcritas pela sessão escriba):
`GDEC-0013` (modo construção), `GDEC-0014` (remoção das 7 condições da AGT-3),
`GDEC-0015` (aceite de ADR deixa de ser pré-condição de implementação) e
`GDEC-0016` (aceite em lote dos ADRs, com três modificações). No início deste
ciclo, o titular acrescentou `GDEC-0017` — construção integral desbloqueada e
autonomia decisória delegada ao orquestrador, com decisões materiais
registradas como premissas reversíveis de uma linha.

**Vinculantes remanescentes (GDEC-0014, preservados integralmente neste ciclo):**
gates de CI (convenções + conteúdo proibido/PHI), PR para `main`, dados
sintéticos como default. As condicionantes por operação do parecer OS-16
permanecem como obrigações jurídicas externas, fora do alcance de decisão de
processo.

**O que este ciclo NÃO alterou (estado factual duro — OBSERVED):** 0 vias
acionáveis; matriz §7.2 com 47/47 linhas inelegíveis; `Observation` da AMH não
consumível; compatibilidade = somente "candidato a integração"; caso de
segurança em maturidade M0; **nenhum dado real acessado**. Nenhuma contagem foi
enfraquecida para parecer progresso (anti-padrão 10).

---

## 2. Fases do §17 tocadas neste ciclo

| Fase (§17) | O que foi produzido | Estado após o ciclo |
|---|---|---|
| 1. SPARK discovery | Árvore de outcomes, exclusões/capacidades adiadas, índice priorizado de famílias de requisitos | 3 saídas antes ausentes agora existem; catálogo formal PRD/USR segue deliberadamente não escrito |
| 4. Architecture/UX contracts | 13 minutas de ADR (`ADR-0012`–`ADR-0024`), 5 artefatos UX do §11, contratos publicados | ADR baseline completo em minuta; UX §11 documentada; MG-G4 segue ato humano |
| 5. Connector/security design | Política MCP, plano de perfis FHIR, catálogo de eventos | Documental; suites executáveis de conector seguem pendentes (SPR-G5-1) |
| 6. TDD foundation slice | Monorepo executável + fatia vertical sintética ponta-a-ponta | Fatia demonstrada com dados sintéticos; **MG-G7 permanece ato humano pendente** |
| 0. Bootstrap (residual) | CODEOWNERS ativado, metadados de mudança, tranches 3 e 4 de tradução | §15.1 majoritariamente coberto |

Fases 2, 3, 7, 8, 9 e 10 **não avançaram** e não poderiam: dependem de execução
AMH (OS-01..24), de ambientes production-like inexistentes, de validações
externas e de atos humanos nominais.

---

## 3. Sprints executados

| Sprint | Objetivo do mapa | Evidência (commit) | Estado |
|---|---|---|---|
| `SPR-G4-1` | ADR-0002/0006 + ADR-0012..0024 redigidos | `36b53e9` | Minutas completas; direções de `GDEC-0016` materializadas |
| `SPR-G4-7` | Evidência citável do caráter consultivo (parecer, Q-15) | `64a867f` | Entregue como PROPOSAL |
| `SPR-G6-7` | RIPD do índice cross-PJ (parecer, Q-09) | `64a867f` | Entregue como PROPOSAL, anterior a qualquer 1º apply |
| `SPR-G0-3` | Tradução retroativa EN→pt-BR | `f18a184`, `01b9518` | Tranches 3 e 4 (27 arquivos); tranche 5 inventariada |
| `SPR-G7-1` | Fundações executáveis + CI §15.2 | `32d44e7` | Monorepo, CI bloqueante, política de dados sintéticos |
| `SPR-G4-3` | Artefatos UX §11 | `f246892` | IA, modelo de estados, service blueprint, contrato UI↔backend |
| `SPR-G4-4` | Contratos publicados | `4d5ad80` | Índice, eventos, política MCP, plano FHIR (parcial: AsyncAPI formal pendente) |
| `SPR-G7-2` | Fatia vertical sintética | `87798af` | 11 passos com caminhos degradados; 315 testes verdes |

Saídas SPARK e itens §15.1 fora da numeração de sprints do mapa: árvore de
outcomes, exclusões consolidadas, índice de famílias (`3b86358`); CODEOWNERS,
correção do `authority-model`, metadados de mudança (`0d0c1b8`).

---

## 4. A fatia vertical sintética (SPR-G7-2)

Uma fatia estreita ponta-a-ponta com **dados 100% sintéticos**, cobrindo os 11
passos do §14. Não é release de produção e não constitui evidência de
efetividade clínica.

**Componentes.** `packages/kernel-clinico` (NEWS2 determinístico, TypeScript
puro, zero dependências de runtime, zero relógio interno — todo tempo entra por
parâmetro); `packages/dominio` (entidades e máquina de estados de alerta/work
item, ADR-0009); `packages/persistencia` (PGlite classe PostgreSQL, migrações
SQL, RLS por tenant, outbox transacional ADR-0010, auditoria append-only);
`packages/contratos` (OpenAPI 3.1 como fonte de verdade); `apps/api` (Fastify,
problem+json pt-BR, idempotência com hash de corpo); `apps/web` (React,
estados obrigatórios do §11, WCAG 2.2 AA de projeto).

**Verificação (OBSERVED, execução real):** `pnpm -r build` verde nos 7 projetos;
`pnpm -r test -- --run` com **315 testes verdes**, dos quais 93 são vetores de
referência clínicos `CRV-NEWS2-0101..0193` executados red/green com asserções
sobre status, total, banda, disparo e razões, mais testes de propriedade
(fast-check) sobre limites de banda, determinismo e idempotência.

**Caminhos degradados demonstrados** (E2E em `apps/api/src/e2e.fatia.test.ts`):
insumo ausente produz status explícito não-computável e **nunca** escore normal
(proibição de projeto `HAZ-0005`); tenant divergente não vaza dados; `If-Match`
com versão errada devolve 412/409 sem sobrescrita silenciosa; replay de
`Idempotency-Key` com corpo divergente devolve 422.

**Limite honesto:** a fatia usa fixtures sintéticas pinadas e não consome a AMH.
Ela não prova compatibilidade, não altera a matriz 47/47 e não promove nenhuma
via a acionável.

---

## 5. Revisão única (GDEC-0013) e sua disposição

A fatia foi revisada por agente distinto dos autores, com foco clínico e de
isolamento. **Veredito: APROVADA_COM_RESSALVAS**, 7 achados (2 de gravidade
média, 5 baixa). Todos foram tratados na integração:

| Achado | Disposição |
|---|---|
| UI sem o rótulo de limitação institucional | Rótulo "registro limitado a esta instituição" acrescentado ao banner permanente (`HAZ-0046`; `ADR-0004` §6.2) |
| Regra de duplicatas estreitada a `effectiveTime` idêntico | Premissa **mantida e declarada**; levada à ratificação clínica como proposta nomeada de *janela de sobreposição temporal por parâmetro*, rotulada VALIDATION REQUIRED — **nenhum valor de janela foi decidido por agente** |
| Duas razões fora do vocabulário da spec §5.2 | Anexadas ao item de ratificação de semântica de status já aberto em `reference-vectors.md` §1; vetores e vereditos inalterados |
| `parcial` alcançável no contrato | Documentado como reservado a classes futuras (`ADR-0026`) e inalcançável para NEWS2 (N-8/`GDEC-0007`) |
| Idempotência sem verificação de corpo | Hash de corpo + 422 em divergência |
| `OBSERVED` desatualizado na evidência consultiva | §5/§3.3 atualizados para refletir a fatia, sem fechar os testes formais V1-V8 (`ADR-0009` §9) |
| Registro de resultados reais | Informativo; incorporado a este relatório |

**Regra preservada:** correção de regra clínica não é ato de agente. Onde a
revisão tocou semântica clínica, o resultado foi *encaminhamento a ratificação*,
nunca decisão.

---

## 6. Premissas de construção assumidas

Registradas em `docs/06-architecture/premissas-de-construcao.md` como
reversíveis (`GDEC-0015`/`GDEC-0017`), cada uma citando o ADR correspondente:
Node.js 22 + TypeScript estrito; monorepo pnpm; kernel clínico sem dependências
de runtime (`ADR-0002`); persistência classe PostgreSQL com PGlite em dev/teste
(`ADR-0006`/`ADR-0010`/`ADR-0016`); Fastify + zod e contrato OpenAPI 3.1
(`ADR-0012`); frontend React com WCAG 2.2 AA e estados do §11 (`ADR-0021`);
Vitest + fast-check (`PRE-08`); SSE com cursores quando implementado
(`ADR-0011`); nenhuma superfície MCP ou IA/ML implementada nesta fatia — limite
de escopo, **não** exclusão arquitetural, já que `GDEC-0016` mandou manter ambas
(`ADR-0014`/`ADR-0024`).

Reverter qualquer premissa implementada gera retrabalho assumido conscientemente
pelo regime ágil (`GDEC-0015`, regra de supersessão).

---

## 7. O que permanece bloqueado e por quê

Nenhum destes é destravável por agente:

- **Execução AMH** (OS-01..OS-24): IG 1.1.0 não publicada, `Observation` não
  consumível, matriz 47/47 inelegível, dono AMH do contrato não nomeado
  (`BLK-0015`). A V2 não escreve nem executa trabalho da AMH.
- **Ambientes `stg`/`prod` da AMH**: inexistentes (`RISK-0004`, L-14). As
  condições de ambiente de G3 e G8 não são satisfazíveis unilateralmente.
- **Marcos humanos**: `MG-G1` (uso pretendido aprovado — `BLK-0008`), `MG-G3`
  (audiência bilateral), `MG-G4`, `MG-G5`, `MG-G6`, **`MG-G7` (aceitação da
  fatia)**, `MG-G8-*`. A fatia deste ciclo é insumo do `MG-G7`, não o marco.
- **Terceiros**: ética CEP/CONEP para campo futuro (`BLK-0013`), pentest e
  verificadores independentes (`DEC-G0-02`), validação com usuários e com
  usuários de tecnologias assistivas.
- **Fila do titular**: aceite formal/credencial do 2º revisor clínico
  (`GDEC-0010`), PDF original assinado do parecer (`SPR-G0-4`), `BLK-0015`, e o
  PR deste ciclo para `main`.

---

## 8. Riscos e observações do ciclo

1. **Concentração de autoridade** (`RISK-0007`) — inalterada e agravada pelo
   regime: com painéis e condições removidos, a revisão única é o último filtro
   antes do titular. Registrado, não mitigado.
2. **Divergência entre premissa de construção e ratificação futura** — quanto
   mais código repousa sobre premissas reversíveis, maior o custo de reverter.
   A janela de sobreposição temporal do kernel é o primeiro caso concreto.
3. **Sessões concorrentes na mesma árvore** (anti-padrão 14) — o protocolo foi
   aplicado: `git status`/mtimes antes de cada escrita, commits por caminho
   explícito, escopos de escrita disjuntos entre especialistas.
4. **Preparação ≠ conclusão** (anti-padrão 15) — as minutas de ADR são
   materialização de direção aceita, não implementação verificada; os
   documentos de UX não são UX validada com usuários; a fatia não é produto.

---

## 9. Próximos executáveis sem ato humano

Em ordem de alavancagem: suites de conformidade de conector como código
(`SPR-G5-1`); harness §7.6 executável contra fixtures pinadas (`SPR-G3-10`,
parcial — a parte que não exige sandbox AMH); segunda regra clínica na fatia
(SOFA ou GCS, specs 0.2.0 já existem); AsyncAPI formal a partir do catálogo de
eventos; tranche 5 da tradução; ampliação dos estados §11 no frontend a partir
do modelo agora documentado.

---

## 10. Método de orquestração

Vinte e dois especialistas estreitos, todos com fronteira de domínio, escopo de
escrita disjunto e critério de aceitação explícitos; nenhum agente genérico.
Roteamento por classe de tarefa: tier máximo para conteúdo clínico, de segurança
e verificação adversarial; tier intermediário para trabalho estruturado de
engenharia e extração documental; **nenhum uso de tier econômico em conteúdo
clínico ou de segurança**. Síntese, priorização, arbitragem de divergências e
redação deste relatório permaneceram indelegáveis (§0.5).
