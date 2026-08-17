---
doc_id: ANALISE-POS-CICLO-6-MAPA-VS-ESTADO
title: Análise de reconciliação — encargo, mapa e backlog contra o estado construído no ciclo 6
status: OBSERVED
owner: orquestrador de execução (ciclo 6) — análise indelegável (prompt §0.5)
source: >-
  planejamento_de_sprints.md (encargo do mapa);
  docs/14-devsecops-and-delivery/mapa-de-projeto-ate-producao.md;
  docs/14-devsecops-and-delivery/mapa-de-projeto-backlog.yaml;
  INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §5/§6/§9/§10/§11/§12/§14/§15/§17/§20;
  docs/00-governance/registers/decision-register.md (GDEC-0013..GDEC-0017);
  árvore de trabalho da branch cycle-6/construcao-g7
date_collected: "2026-08-16"
collector: orquestrador de execução (ciclo 6)
last_updated: "2026-08-17"
---

# Análise de reconciliação — planejamento contra estado construído

Rótulos epistêmicos conforme `docs/00-governance/evidence-notation.md`.
Esta análise **não altera** o mapa nem o backlog: identifica onde eles
divergiram da realidade após o primeiro ciclo de construção, e por quê. As
correções de estado dos dois artefatos são feitas em ato separado, com esta
análise como justificativa.

---

## 1. Por que os três documentos divergiram da realidade

Os três artefatos foram produzidos sob um regime que **deixou de valer**. O
encargo (`planejamento_de_sprints.md`) é uma tarefa "exclusivamente de
planejamento, análise documental e síntese", com proibição explícita de
implementar. O mapa e o backlog são seu produto, e ambos assumem, em cada
sprint de engenharia, uma cadeia de pré-condições: ADR aceito antes de
implementar, painel adversarial por artefato, pacotes de tarefa formais.

`GDEC-0013` a `GDEC-0017` removeram essa cadeia. O efeito material sobre o
planejamento não é cosmético: **o caminho crítico que o mapa desenha deixou de
existir na forma descrita**.

| Elo do caminho crítico (mapa §7b) | Estado no mapa | Estado real após ciclo 6 |
|---|---|---|
| `SPR-G0-1` propagações residuais | pré-requisito de tudo | concluído no ciclo 5 |
| `SPR-G4-1` redigir ADR-0012..0024 | bloqueava `SPR-G4-2` | concluído (13 minutas) |
| `SPR-G4-2` aceite em lote dos ADRs | bloqueava `SPR-G7-1` | **dissolvido**: `GDEC-0015` retirou o aceite como pré-condição e `GDEC-0016` aceitou as direções |
| `SPR-G7-1` fundações + CI | bloqueava `SPR-G7-2` | concluído |
| `SPR-G7-2` fatia sintética | esforço G, bloqueava `MG-G7` | concluído; `MG-G7` continua ato humano |

Consequência: o mapa continua correto sobre **o que falta** e sobre **quem
pode destravar cada coisa**, mas está errado sobre **a ordem** e sobre o
**estado** de cinco fases. Um leitor futuro que retomasse pelo mapa
replanejaria trabalho já feito — exatamente o anti-padrão 15 que o próprio
encargo nomeia, na direção inversa.

---

## 2. Estado de fase: mapa × realidade

| Fase | Estado no mapa/backlog | Estado real (OBSERVED) | Fundamento |
|---|---|---|---|
| G0 | PARCIAL | PARCIAL (inalterado) | `BLK-0002`/`BLK-0008` seguem abertos; tradução em tranche 5 |
| G1 | PARCIAL | PARCIAL (inalterado) | dossiê substituto existe; `MG-G1` é ato humano pendente |
| G2 | BLOQUEADO | **PARCIAL** | `SPR-G2-1` feito no ciclo 5; `SPR-G2-3` deixou de estar bloqueado quando o runtime passou a existir; a promoção a acionável segue sem dado |
| G3 | BLOQUEADO | BLOQUEADO (inalterado) | execução AMH; a parte V2 do harness é executável contra fixtures, o que **não** move o gate |
| G4 | NÃO INICIADO | **PARCIAL** | 13 ADRs redigidos, UX §11 produzida, contratos publicados; `MG-G4` é ato humano |
| G5 | NÃO INICIADO | NÃO INICIADO | suítes de conector são código; a aceitação exige verificador externo |
| G6 | NÃO INICIADO (prep. PARCIAL) | **PARCIAL** | controles verificados adversarialmente na fatia; 27 P0 seguem OPEN; `MG-G6` exige terceiro |
| G7 | NÃO INICIADO | **PARCIAL** | fatia demonstrada com caminhos degradados; `MG-G7` é ato humano pendente |
| G8 | NÃO INICIADO | NÃO INICIADO | ambiente AMH inexistente |
| Op. contínua | NÃO INICIADO | NÃO INICIADO | condicionada a `MG-G8-PROD` |

**Nenhuma dessas mudanças de estado é aprovação de gate.** "PARCIAL" significa
que camadas foram percorridas — preparação, decisão, implementação — não que a
verificação ou a aprovação humana existam. A distinção é a do próprio encargo
§1.1: preparação ≠ decisão ≠ implementação ≠ verificação ≠ aprovação.

---

## 3. O erro de classificação que esta análise corrige

Ao fechar a primeira parte do ciclo 6, classifiquei as fases 2, 3, 7, 8, 9 e 10
do §17 como "não avançaram e não poderiam". **A afirmação estava errada para
partes de 2, 3, 5, 7, 8 e 10**, e o erro tem uma causa identificável: tratei
"a fase depende de algo externo" como "nada da fase é executável".

O mapa condicionava `SPR-G2-3` (pacote de release assinável) à fatia G7 — que
passou a existir *dentro deste mesmo ciclo*. O mesmo vale para a instrumentação
de operabilidade (fase 8), que precisa de sistema para instrumentar, e para a
vigilância (fase 10), que precisa de dados gravados para medir. Enquanto não
havia runtime, essas fases eram genuinamente inexequíveis; a partir do momento
em que houve, deixaram de ser — e a reclassificação não acompanhou o fato.

Separação correta, por fase:

| Fase §17 | Parte executável sem terceiros | Parte genuinamente bloqueada |
|---|---|---|
| 2. Portfólio | formato de bundle, assinatura, ativação/rollback (`ADR-0007`) | promoção a acionável: exige dado real e G3 por via |
| 3. Contratos AMH | harness §7.6 executável contra fixtures pinadas | execução contra a AMH; ambiente production-like |
| 5. Conector/segurança | suítes de conformidade como código | aceitação por verificador externo (`MG-G5`) |
| 7. Entrega incremental | segunda regra clínica sobre a fatia sintética | via validada com dado real |
| 8. Prontidão | instrumentação, kill switch, sondas sintéticas, runbooks | DR exercido, SLO medido em ambiente real, treinamento |
| 9. Promoção | mecânica de artefato idêntico e rollback | aprovações nominais e ambiente |
| 10. Vigilância | cálculo de carga de alarmes, deriva, versão de regra, K-8 | operação real |

---

## 4. O que o encargo pedia e permanece verdadeiro

Três exigências do `planejamento_de_sprints.md` sobreviveram intactas à
mudança de regime, e continuam vinculantes para qualquer sessão futura:

1. **§4.2 — estado factual obrigatório.** Preservado sem exceção: 0 vias
   acionáveis; 47/47 inelegíveis; `Observation` não consumível; somente
   candidato a integração; safety case M0; nenhum dado real acessado. A fatia
   G7 não move nenhum deles, porque usa fixtures sintéticas e não consome a
   AMH.
2. **§4.5 — rastreabilidade.** Todo item construído no ciclo 6 rastreia a
   `ADR-*`, `SAF-*`, `HAZ-*`, `THR-*`, `SEC-*`, `GDEC-*` ou sprint do mapa.
3. **§2 — separação por autoridade.** As quatro swimlanes continuam sendo o
   corte correto: nada do que a V2 construiu invade execução AMH, e nenhum ato
   humano foi presumido.

O que **não** sobreviveu: a disciplina de despacho do §9 (pacotes formais,
handoffs em formato fixo) e a cadeia de pré-condições de ADR — removidas por
`GDEC-0013`/`GDEC-0015`. A substância do §9 que permanece por mérito próprio, e
que foi aplicada: especialistas estreitos com escopo disjunto, roteamento por
classe de tarefa, e proibição de tier econômico em conteúdo clínico ou de
segurança.

---

## 5. Divergência que esta análise registra sem resolver

O mapa §7 declara o caminho crítico controlável pela V2 como
`SPR-G0-1 → SPR-G4-1 → SPR-G4-2 → SPR-G7-1 → SPR-G7-2 → MG-G7`. Esse caminho
está **inteiramente percorrido** do lado da engenharia, e o único elo restante
é um ato humano. Isso significa que, após `MG-G7`, **a V2 deixa de ter caminho
crítico próprio**: todo avanço subsequente de gate passa a depender de AMH, de
terceiros ou do titular.

A consequência de sequência é real e merece decisão explícita do titular, não
do orquestrador: com a fatia aceita, a engenharia pode aprofundar-se em
capacidade (mais regras, mais robustez, mais instrumentação) sem que nenhuma
delas aproxime um gate. Aprofundar sem gate à vista é como se acumula trabalho
que depois precisa ser refeito quando o dado real contradiz a premissa — o
risco de retrabalho que o mapa nomeia em SR-3, agora aplicado ao produto
inteiro e não a um sprint.

Registrado como ponto de decisão, sem recomendação embutida no plano.

---

## 6. Adendo — correções aplicadas (ACH-09, 2026-08-17)

**Status deste adendo: OBSERVED.** Acrescentado por `ic-reconciliador-docs`
(despacho ACH-09, P2 §6.9 — consistência documental), conforme o convite do
§0 acima ("as correções de estado dos dois artefatos são feitas em ato
separado, com esta análise como justificativa"). **A análise original
(seções 1–5) permanece intacta e não foi reescrita** — este é um acréscimo
ao final, não uma emenda ao texto anterior.

### 6.1 Correções que usaram esta análise como fundamento direto

- **`mapa-de-projeto-ate-producao.md` §5.2 (G2)**: o campo "Estado" ainda
  lia `BLOQUEADO`, contradizendo a própria emenda pós-ciclo 6 que abre a
  seção (`PARCIAL`) e este documento (§2). Corrigido para `PARCIAL`,
  preservando o texto sobre a promoção sombra→acionável continuar
  bloqueada por dado real (G3/AMH).
- **`mapa-de-projeto-ate-producao.md` §12 ("Matriz de cobertura dos
  gates")**: divergência adicional, da MESMA classe da anterior mas não
  nomeada explicitamente no §2 acima — as linhas G2, G4, G6 e G7 dessa
  tabela-resumo nunca haviam sido propagadas com os estados que
  §5.2/§5.4/§5.6/§5.7 e este documento (§2) já estabeleciam (a tabela
  ainda lia `BLOQUEADO (por dados)`/`NÃO INICIADO`/`NÃO INICIADO (prep.
  PARCIAL)`/`NÃO INICIADO`). As quatro foram corrigidas para `PARCIAL`,
  com nota de rodapé datada explicando a origem da divergência — este é
  achado novo desta reconciliação, não mera propagação do §2.
- **`mapa-de-projeto-backlog.yaml`**: os campos `current_state` de G0..G8
  já estavam corretos (idênticos aos desta análise, §2) e não foram
  alterados, **exceto G5** (ver 6.2). Evidências obsoletas de G2/G4/G6/G7/
  G8 corrigidas por bullets **adicionados e datados** (nunca por reescrita
  da evidência original) — em particular, a evidência de G4 que ainda
  citava `ADR-0012..0024 not-started` como estado corrente, hoje
  contrariando `GDEC-0016`/`GDEC-0017` (as 13 direções aceitas e
  minutadas em pt-BR).

### 6.2 Achados novos desta reconciliação (fora do escopo original desta análise)

Este documento (§2/§3) não examinou G5 nem a distinção código-vs-evidência-
operacional de G8; ambos são achados novos do despacho ACH-09, não mera
propagação do que já estava aqui registrado:

- **G5 (conformidade de conectores)**: `packages/conformidade` é uma suíte
  **executável** (22 cenários `CTS-01..CTS-22` contra fixtures sintéticas
  pinadas por SHA-256, com relatório gerado por comando) — não mais "design
  como preparação". `mapa-de-projeto-ate-producao.md` §5.5/§12 e
  `mapa-de-projeto-backlog.yaml` G5 foram corrigidos de `NÃO INICIADO` para
  `PARCIAL`. `MG-G5` (aceitação por verificador externo ≠ implementador)
  permanece não iniciado — a suíte não demonstra compatibilidade AMH, não
  move a matriz 47/47 e não fecha G3 (limites que o próprio pacote declara).
- **G8 / operação contínua**: código de instrumentação e vigilância já
  existe (`packages/observabilidade`, `packages/vigilancia`, com consumidor
  real em `apps/api` desde este ciclo) — distinto de evidência
  **operacional** real (SLO medido, DR exercido, treinamento), que segue
  inexistente até o piloto. O estado do gate (`NÃO INICIADO`) não mudou —
  nenhum shadow, piloto ou produção rodou; apenas a descrição em
  `mapa-de-projeto-ate-producao.md` §5.8/§6 e `mapa-de-projeto-backlog.yaml`
  G8 ganhou a distinção.
- **`docs/06-architecture/adrs/adr-index.md`**: §7 item 4 ("treze tópicos de
  piso não têm minuta") datava de 2026-08-15 e não refletia `GDEC-0017`
  (registro de materialização das 13 minutas, já presente no topo do
  próprio índice); corrigido por emenda datada. As classes do diagrama de
  dependência (§4.2) foram sincronizadas: `ADR-0012`–`ADR-0024` deixam de
  aparecer estilizadas como `notstarted` (cinza/tracejado), já que as 13
  minutas existem desde 2026-08-16.
- **`packages/contratos/README.md`** e **`apps/api/README.md`**:
  afirmações obsoletas de ADR `not-started` (ADR-0012 e ADR-0015,
  respectivamente) corrigidas para o estado real (`accepted`, direção
  `GDEC-0016`, minuta redigida ciclo 6). Em `apps/api/README.md`, a
  descrição do bearer sintético como `SYNTH-TOKEN.<tenantId>.<atorId>` —
  formato que deixou de existir nesta rodada (achado §6.2, verificador
  JWS) — foi substituída pela descrição observada em
  `apps/api/src/auth.ts`.
- **`planejamento_de_sprints.md`**: aviso de supersessão datado
  acrescentado no topo, sem alterar o encargo original (histórico do
  ciclo 2, preservado por regra deste mesmo despacho).

### 6.3 O que este adendo NÃO fez

Não promoveu nenhum gate, não marcou nenhuma ADR como `implemented`/
`verified`, não alterou o estado factual duro (0 vias acionáveis; 47/47
inelegíveis; `Observation` AMH não consumível; compatibilidade AMH somente
"candidato a integração"; safety case M0; nenhum dado real acessado) e não
decidiu a "divergência registrada sem resolver" do §5 acima — esse ponto de
decisão do titular permanece em aberto, sem recomendação embutida.

### 6.4 Ocorrências equivalentes fora da fronteira de escrita deste despacho

A varredura desta reconciliação encontrou ADRs aceitas ainda descritas como
`not-started` (ou dependências que tratam aceite de ADR como pré-condição)
em caminhos fora dos que `ic-reconciliador-docs` pode editar — em especial
ADRs individuais (`docs/06-architecture/adrs/ADR-0012..0024*.md` e outras,
cujo próprio `status_history` ou notas de pendência citam o índice como
desatualizado — já não é o caso) e documentos de outras áreas
(`docs/06-architecture/premissas-de-construcao.md`,
`docs/06-architecture/components/maquina-estados-alerta-acao-humana.md`,
`docs/06-architecture/containers/topologia-implantacao.md`,
`docs/13-operations-and-reliability/README.md`,
`docs/14-devsecops-and-delivery/ci-policy.md`,
`docs/07-data-and-provenance/README.md`,
`docs/11-security-privacy-compliance/verificacao-de-controles-fatia-g7.md`).
`docs/09-api-events-and-mcp/**` foi deliberadamente deixado de fora por já
ter sido corrigido pelo orquestrador antes deste despacho. Nenhum desses
caminhos foi editado; ficam como pedido de desbloqueio nomeado no handoff
de `ic-reconciliador-docs`.
