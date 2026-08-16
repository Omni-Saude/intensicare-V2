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
collector: orquestrador de execução (ciclo 6); levantamento e construção por 30 especialistas estreitos
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
| 5. Connector/security design | Política MCP, plano de perfis FHIR, catálogo de eventos; suítes de conformidade como código | Suítes executáveis existem; aceitação exige verificador externo (MG-G5) |
| 6. TDD foundation slice | Monorepo executável + fatia vertical sintética ponta-a-ponta | Fatia demonstrada com dados sintéticos; **MG-G7 permanece ato humano pendente** |
| 0. Bootstrap (residual) | CODEOWNERS ativado, metadados de mudança, `pnpm verify`, lint, fronteira executável, tranches 3 e 4 de tradução | §15.1 coberto nos itens A–I, com as exceções da seção 5.3 |

**Correção de classificação (registrada, não apagada).** Uma primeira leitura
deste ciclo declarou que as fases 2, 3, 7, 8, 9 e 10 "não avançaram e não
poderiam". A afirmação estava **errada** para partes de 2, 3, 5, 7, 8 e 10: o
erro foi tratar "a fase depende de algo externo" como "nada da fase é
executável". Várias dessas fases eram condicionadas pelo próprio mapa à
existência de runtime — que passou a existir *dentro deste ciclo*, com a fatia
G7. A reconciliação completa está em
`docs/14-devsecops-and-delivery/analise-pos-ciclo-6-mapa-vs-estado.md` §3, e o
trabalho consequente está na seção 5.4 abaixo.

| Fase (§17) | Parte executada neste ciclo | Parte que segue genuinamente bloqueada |
|---|---|---|
| 2. Portfólio | formato de bundle, assinatura, ativação/rollback (`SPR-G2-3`) | promoção a acionável: exige dado real e G3 por via |
| 3. Contratos AMH | harness §7.6 executável contra fixtures pinadas (`SPR-G3-10`) | execução contra a AMH; ambiente production-like |
| 5. Conector | suítes de conformidade como código (`SPR-G5-1`) | aceitação por verificador externo (`MG-G5`) |
| 7. Entrega incremental | segunda regra clínica (RULE-GCS) | via validada com dado real |
| 8. Prontidão | instrumentação, kill switch, sondas, runbooks (`SPR-G8-1`) | DR exercido, SLO medido em ambiente real, treinamento |
| 9. Promoção | — | aprovações nominais e ambiente |
| 10. Vigilância | carga de alarmes, deriva, versão de regra, K-8 (`SPR-OC-1`) | operação real (`MG-G8-PROD`) |

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
| `SPR-G7-2` | Fatia vertical sintética | `87798af` | 11 passos com caminhos degradados |
| `SPR-G6-2` (parcial) | Controles SAF/THR/SEC verificados no código | `8ccaaf3`, `957d3cf` | 40 testes adversariais; 3 achados reais, 2 corrigidos, 1 virou requisito de produção |
| `SPR-G2-3` | Pacote de release clínico assinável | `0a3d102` | Formato, assinatura, ativação/rollback; promoção a acionável recusada fail-closed |
| `SPR-G3-10`/`SPR-G5-1` | Harness §7.6 executável | `d6b0246` | 22 cenários rodando contra fixtures pinadas; nenhum contra a AMH |
| (fase 7) | Segunda via clínica | `7ca520b` | RULE-GCS 0.2.0 com gate sedativo fail-closed |
| `SPR-G8-1` (parcial) | Prontidão operacional | `1423bb3` | Telemetria com redação de PHI por tipo, kill switch, runbooks |
| `SPR-OC-1` (parcial) | Vigilância contínua | `db489c5` | Carga de alarmes, deriva, K-8 com salvaguardas estruturais |

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

**Verificação (OBSERVED, execução real ao fim do ciclo):** `pnpm verify` verde
de ponta a ponta (exit 0) — typecheck, lint, fronteira de módulos, build,
testes e os dois gates de documentação, sobre **11 pacotes**. **1.026 testes
verdes**: kernel-clinico 305, rule-bundle 302, api 70, web 77, vigilância 77,
conformidade 62, observabilidade 55, persistência 33 (mais 1 falha esperada que
documenta o ACHADO-01 da seção 5.1), domínio 18, contratos 14, fixtures 13.
Entre eles, 93
vetores de referência clínicos `CRV-NEWS2-0101..0193` executados red/green com
asserções sobre status, total, banda, disparo e razões, e testes de propriedade
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

## 5.1 Verificação de controles de segurança (SPR-G6-2, parcial)

Quarenta testes adversariais — não testes felizes — sobre a fatia, cada um
citando o controle verificado. Cobriram: fail-closed sem contexto de tenant em
13 tabelas; leitura e escrita cross-tenant; IDOR em 9 tabelas **sem oráculo de
enumeração** (título, detalhe e status idênticos para "existe noutro tenant" e
"não existe"); auditoria append-only; atomicidade do outbox sob violação real
de restrição; concorrência otimista com 6 formas de `If-Match` inválido e
corrida de dois atores; quarentena de 10 formas malformadas; escore `null`
jamais `0` (`HAZ-0005`).

**Três achados reais** (OBSERVED):

| Achado | Gravidade | Disposição |
|---|---|---|
| `SET SESSION AUTHORIZATION` restaura superusuário na mesma conexão e a RLS deixa de valer — enquanto `SET ROLE` é negado, dando falsa impressão de caminho fechado (`THR-0050`, P0) | ALTA | **Não corrigível na fatia** (PGlite é embarcado e monousuário). Virou **requisito vinculante de produção** em `ADR-0016` §4.1: a aplicação deve conectar já autenticada como papel não superusuário, sem `BYPASSRLS`. **A conclusão sobre RLS sob PGlite não é transferível para produção** e precisa ser refeita contra PostgreSQL real antes de G6 |
| `instance` do `problem+json` ecoava `request.url`, devolvendo o identificador do sujeito dentro do corpo de erro (`SAF-0026`/`SEC-0015`) | MÉDIA | **Corrigido** (`957d3cf`): URN opaca de ocorrência, correlacionável com a auditoria por `x-correlation-id`. O teste de regressão encontrou o mesmo vazamento em mais três pontos não cobertos pelo achado original |
| Rota de demonstração aceitava escrita sem autenticação | MÉDIA | **Corrigida por remoção**; a convenção que ela demonstrava segue exercida na rota real, autenticada |

**Limite metodológico registrado pelo próprio verificador:** teste escrito por
agente **não é** a independência que `SEC-0009`/`SAF-0037` exigem, e PGlite não
é PostgreSQL de produção. Nada disso fecha `THR-*`, `SAF-*`, `SEC-*`, `HAZ-*`
ou o Gate G6 — os 27 P0 seguem OPEN, e G6 exige verificador terceiro
independente (`DEC-G0-02`) mais aceite humano nominal (`MG-G6`).

## 5.2 Mutação no kernel clínico (PRE-08 fechada)

Exigência do §14 para o kernel de segurança. Stryker executado de fato contra
`news2.ts` e `types.ts`: **1.076 mutantes**, score de **65,73% → 93,07%** em
`news2.ts` (100% em `types.ts`), com **95 testes acrescentados** (suíte do
kernel: 130 → 225).

Três fatos que sustentam o número: **nenhuma linha de `src/` foi alterada** (o
score subiu por teste, não por afrouxar o alvo); **nenhum defeito clínico foi
encontrado** — as cinco tabelas de banda foram reconferidas linha a linha
contra a spec §4.1/§3.3 e os textos obrigatórios contra o §7; e os **74
sobreviventes residuais estão classificados nominalmente** com número de linha,
nenhum matável pela API pública (fronteira de epsilon, guarda estruturalmente
verdadeira, código defensivo inalcançável, reescrita sem efeito observável,
parâmetro morto).

Decisão deliberada: os mutantes de epsilon **não** foram perseguidos. Seriam
mataveis com entradas do tipo `-1e-9`, mas produziriam testes de ruído de ponto
flutuante sem significado clínico — o número subiria e o valor de segurança,
não (prompt §20: não otimizar contagem de teste).

Dois achados não clínicos ficaram registrados como limpeza pendente no README
do pacote: parâmetro morto em `buildNonScoringRecord` e ramos inalcançáveis em
`bandScoreForChartUnit`.

## 5.3 Fundação de repositório (§15.1 A/B/D)

`pnpm verify` agrega typecheck, lint, fronteira de módulos, build, testes e os
dois gates de documentação em **um comando, exit 0**. Biome pinado; três regras
desligadas com raciocínio inline — nenhuma por conveniência. A mais relevante:
`noFloatingPromises` acusou 12 casos, dos quais 10 eram falso-positivo do
`fast-check`; **os 2 reais são gap de produto** (o frontend trata rejeição de
rede sem `.catch()`, deixando a tela presa em "carregando"), e corrigi-los
exige decidir um estado de erro de UI — registrado como backlog (`PRE-07`), não
mascarado.

`scripts/check_module_boundaries.mjs` materializa a `ADR-0002`, que até aqui só
existia em prosa: valida a direção real de dependências entre os módulos
(kernel sem dependência de workspace; `apps/web` só depende de contratos) e foi
testado positivo **e** negativo.

Correção de robustez de teste: as suítes que sobem PGlite estouravam os limites
padrão do vitest sob CPU concorrida e falhavam por **tempo**, não por
comportamento. Vermelho intermitente em suíte de segurança clínica ensina a
equipe a ignorar vermelho — limites explicitados com a justificativa no próprio
arquivo de configuração.

## 5.4 Fases destravadas pela existência do runtime

Executadas após a correção de classificação da seção 2. Cada uma entregou
também a lista do que da sua fase **não** pôde ser feito e por quê — para que a
próxima classificação seja por evidência, não por impressão.

**Fase 2 — pacote de release assinável (`SPR-G2-3`).** Serialização canônica
determinística com NFC obrigatório em strings *e* em nomes de chave: sem isso,
"avaliação" em NFC e em NFD assinariam digests diferentes — defeito invisível
em corpus pt-BR. Assinatura Ed25519/ECDSA sobre carga que inclui contexto de
domínio e papel, de modo que uma assinatura de autor não pode ser movida para o
slot de aprovação; 118 casos de adulteração campo a campo. **Autor ≠ aprovador
é inexprimível no tipo**, não apenas validado em runtime — verificado
empiricamente. O `behaviorHash` pina comportamento (digest dos
`EvaluationRecord` sobre os 93 vetores), respondendo ao defeito legado em que a
string de versão sobreviveu a uma inversão de comportamento. **Estado factual
preservado por construção**: `activate({mode: "actionable"})` é recusado
fail-closed sobre o bundle real do NEWS2, que acumula seis ou mais bloqueios.

**Fases 3 e 5 — harness executável (`SPR-G3-10`, `SPR-G5-1`).** Os 22 cenários
`CTS-01..CTS-22` deixaram de ser documento e viraram código, rodando contra as
10 fixtures pinadas por SHA-256. Nenhum cenário foi executado contra o produtor
AMH — os que dele dependem reportam "não executável sem AMH" com a razão, e
**nada disso altera "candidato a integração" nem a matriz 47/47**.

**Fase 7 — segunda via clínica.** `RULE-GCS` 0.2.0 implementada (escolhida
sobre SOFA por ter a especificação mais autossuficiente), provando que a fatia
comporta mais de uma regra. O gate sedativo do `ADR-0028` é fail-closed: sedação
confunde a avaliação neurológica e o kernel recusa pontuar, em vez de produzir
número enganoso. O gate etário foi extraído e compartilhado **sem alterar o
comportamento do NEWS2** — os 225 testes anteriores seguem verdes. Os 18
vetores permanecem DRAFT: o documento-fonte declara
`authorship.independence_confirmed: false` para todos.

**Fase 8 — prontidão operacional (`SPR-G8-1`).** Telemetria compatível com
OpenTelemetry sem SDK externo, com **redação de PHI implementada como tipo**, e
teste provando que um identificador sintético não atravessa métrica, log ou
trace. Kill switch e modo degradado como capacidade de código, com o estado
degradado visível. `docs/13-operations-and-reliability/` deixou de ser stub:
runbooks, backup/restore, rollback e a tabela das 12 dimensões do §15.3 com o
estado real de cada uma — a maioria "não exercida", que é o veredito honesto.

**Fase 10 — vigilância (`SPR-OC-1`).** Carga de alarmes por paciente-dia,
deriva de fonte e vigilância de versão de regra. Em `KPIR-14`/K-8, **o tipo de
retorno torna impossível obter o número solto** sem as duas figuras
companheiras e o denominador — a salvaguarda que a própria definição exige
contra leitura causal. As duas sub-decisões abertas são expostas como variantes
explícitas em vez de resolvidas em silêncio. Nenhuma banda aceitável foi
inventada: `SM-04` e o piso de completude seguem VALIDATION REQUIRED.

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

Em ordem de alavancagem: integrar `RULE-GCS`, o bundle assinável e a
instrumentação à fatia da API (hoje os pacotes existem e são testados, mas a
fiação na rota é parcial); SOFA como terceira via; AsyncAPI formal a partir do
catálogo de eventos; tranche 5 da tradução; ampliação dos estados §11 no
frontend; e o estado de erro de UI para rejeição de rede (gap real registrado
na seção 5.3).

**Advertência de sequência (INFERENCE).** Percorrido o `MG-G7`, a V2 deixa de
ter caminho crítico próprio: todo avanço subsequente de gate depende da AMH, de
terceiros ou do titular. Aprofundar capacidade sem gate à vista é como se
acumula trabalho que o dado real depois contradiz — o risco `SR-3` aplicado ao
produto inteiro. Ponto de decisão do titular, registrado sem recomendação
embutida no plano (ver `analise-pos-ciclo-6-mapa-vs-estado.md` §5).

---

## 10. Método de orquestração

Trinta especialistas estreitos, todos com fronteira de domínio, escopo de
escrita disjunto e critério de aceitação explícitos; nenhum agente genérico.
Roteamento por classe de tarefa: tier máximo para conteúdo clínico, de segurança
e verificação adversarial; tier intermediário para trabalho estruturado de
engenharia e extração documental; **nenhum uso de tier econômico em conteúdo
clínico ou de segurança**. Síntese, priorização, arbitragem de divergências e
redação deste relatório permaneceram indelegáveis (§0.5).
