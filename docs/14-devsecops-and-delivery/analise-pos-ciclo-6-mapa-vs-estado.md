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
last_updated: "2026-08-16"
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
