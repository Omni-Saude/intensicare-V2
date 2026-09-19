---
doc_id: RULE-NEWS2-ESCALA2-DIVERGENCIA
title: >
  Dossiê de ratificação — divergência de bandas da Escala 2 do NEWS2 entre a
  spec pinada do alvo e a intenção do repositório irmão (achado CRIT-4)
status: PROPOSAL
label: PROPOSAL
owner: UNASSIGNED — VALIDATION REQUIRED
statement: >
  As bandas da Escala 2 do NEWS2 divergem entre a spec pinada do alvo
  (RULE-NEWS2 0.2.0, que o kernel implementado segue) e o documento de
  intenção do repositório irmão — incluindo duplicação interna no irmão,
  discórdia de um ponto na faixa 88–92, bandas de hiperóxia presentes só no
  alvo e políticas de seleção de escala opostas. O conflito é clínico,
  existe ENTRE os dois repositórios e não estava registrado em lugar algum.
  Este dossiê apresenta os dois lados com citações e um default recomendado;
  a decisão pertence à autoridade clínica.
provenance:
  source_repo: intensicare-V2 (spec pinada + kernel); intensicare (irmão — SOMENTE LEITURA, citado como intenção)
  path_or_url: docs/05-clinical-safety/dossie-news2-escala-2-divergencia.md
  commit_sha_or_version: d7a49dddc3fc0473ba35860ef3ddecf31d0741ae (alvo); irmão lido na árvore de trabalho de 2026-09-19
  section_or_lines: >
    rule-releases/news2/specification.md:222-240 e 244-246;
    packages/kernel-clinico/src/news2.ts:164-179;
    [irmão] docs/plan/clinical/domains/early-warning-scores.md:107-125 e 300-319;
    [irmão] docs/plan/_work/briefs/scorers.json:263-264;
    [irmão] docs/plan/clinical/alert-catalog.md:5184;
    legacy-review/ews/news2-review.md:210; rule-releases/news2/migration-notes.md:66
  date_collected: 2026-09-19
  collector: varredura de verdade documental ORQ-7 — especialistas de evidência somente-leitura + orquestrador do fluxo
  transformation: >
    citações verbatim dos dois lados; divergência enunciada sem resolução;
    nenhum juízo clínico aplicado; o default recomendado é PROPOSAL
  confidence: high
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  requirements: [SAF-0001, SAF-0002]
  hazards: [HAZ-0005]
  adrs: [ADR-0029]
  tests: []
  pr: null
supersedes: null
superseded_by: null
---

# Dossiê de ratificação — NEWS2 Escala 2 (CRIT-4)

> Este documento registra um conflito clínico entre repositórios para decisão
> de autoridade humana. Nenhuma palavra aqui muda código, spec pinada ou
> bandas; ratificar é ato de autoridade humana nomeada
> (docs/00-governance/evidence-notation.md §2, regra 3). A spec pinada do
> alvo é intocável nesta varredura: a divergência registra-se CONTRA ela, não
> nela.

## 1. O que se observa (OBSERVED)

### 1.1 O lado do alvo — spec pinada RULE-NEWS2 0.2.0

`docs/05-clinical-safety/rule-releases/news2/specification.md:222-233` (§3.3,
"SOURCE — RCP 2017 Chart 1, re-derived from issuer PDF"):

> | SpO2 (%) | Condition | Score |
> |---|---|---|
> | ≤ 83 | regardless of air/oxygen | 3 |
> | 84–85 | regardless of air/oxygen | 2 |
> | 86–87 | regardless of air/oxygen | 1 |
> | 88–92 | regardless of air/oxygen | 0 |
> | ≥ 93 | **on air** | 0 |
> | 93–94 | **on oxygen** | 1 |
> | 95–96 | **on oxygen** | 2 |
> | ≥ 97 | **on oxygen** | 3 |

Regra estrutural da spec (linhas 235-240): as bandas baixas (≤92) valem
INDEPENDENTEMENTE do estado de ar/oxigênio; a região ≥93 exige o estado de
O2 para pontuar — sem `spo2_scale_assignment` e sem estado de O2, o
parâmetro é `not_evaluated`. O kernel implementado confere com a spec
(`packages/kernel-clinico/src/news2.ts:169-179`, `scoreSpo2Scale2`):
≤83→3, ≤85→2, ≤87→1, ≤92→0; na região ≥93, sem estado de O2 → `null`, no ar
→0, em oxigênio ≤94→1, ≤96→2, senão →3.

### 1.2 O lado do irmão — intenção clínica

`intensicare/docs/plan/clinical/domains/early-warning-scores.md:110` (§3.1,
dentro do bloco delimitado das linhas 107-117; o irmão trata esta intenção
como fixa — "MUST NOT change", NEWS2-C-01):

> spo2 Scale 2 (hypercapnic, chronic type-2 resp failure): >=93 -> 0 | 88-92 -> 1 | 86-87 -> 2 | 84-85 -> 2 | <=83 -> 3

A mesma lista reaparece em dois outros artefatos do irmão:
`docs/plan/_work/briefs/scorers.json:264` (afirmação NEWS2-2-09, regra
NEWS2-2-09 da linha 263: "NEWS2 SpO2 scale 2 (hypercapnic) bands:
≥93%=0, 88-92%=1, 86-87%=2, 84-85%=2, ≤83%=3") e
`docs/plan/clinical/alert-catalog.md:5184`
(">=93=0/88-92=1/86-87=2/84-85=2/<=83=3; supplemental_o2 +2; ...").

### 1.3 As quatro divergências, uma a uma

1. **Duplicação interna no irmão — o valor 2 bandado duas vezes.** Na linha
   do irmão, as duas faixas adjacentes `86-87 -> 2` e `84-85 -> 2` atribuem
   o MESMO valor 2 — o achado CRIT-4 da auditoria forense de 2026-09-19
   registra isso como "`84-85→2` twice-banded". A spec do alvo não tem essa
   duplicação: 86–87→1 e 84–85→2 (RCP 2017). Esta é uma inconsistência
   INTERNA do irmão, independente de qual tabela vença a ratificação.
2. **Discórdia de um ponto em 88–92.** Irmão: 88–92→1. Alvo: 88–92→0. É uma
   discordância de um ponto exatamente na faixa-alvo da DPOC (insuficiência
   respiratória crônica tipo 2), o público da Escala 2. Matéria de
   ratificação clínica; nenhum dos repositórios registra a escolha.
3. **Bandas de hiperóxia em oxigênio, presentes só no alvo.** O alvo separa
   a região ≥93 por estado de O2 (em ar →0; em oxigênio 93–94→1, 95–96→2,
   ≥97→3). O irmão declara `>=93 -> 0` plano, sem divisão por estado de O2 —
   um paciente em oxigênio suplementar com SpO2 97% receberia 0 pelo irmão e
   3 pelo alvo.
4. **Política de seleção da Escala 2 oposta.** O irmão seleciona a Escala 2
   por parâmetro: "Scale 2 is selected only when `hypercapnic == true`
   (NEWS2-C-02)" (early-warning-scores.md:122-123). O alvo REJEITOU esse
   mecanismo pela decisão documentada D-3 —
   `docs/05-clinical-safety/legacy-review/ews/news2-review.md:210`: o
   parâmetro `hypercapnic` existe mas nenhuma superfície de ingestão o
   fornece (os dois pontos de chamada hardcodam `False`), e codificou a
   rejeição na spec pinada (specification.md:218 e 244-246: seleção por
   `spo2_scale_assignment` — decisão clínica documentada com proveniência —,
   Escala 1 como default na ausência; ver também migration-notes.md:66,
   que registra o descarte de "O2 status must never select the scale").

## 2. O que NÃO está decidido aqui

Qual tabela está clinicamente correta — em particular 88–92→0 ou 88–92→1 —
é juízo clínico que pertence à autoridade clínica. Este dossiê não decide,
não ratifica e não altera nenhum dos dois artefatos.

## 3. Default recomendado (PROPOSAL — pendente de ratificação)

PROPOSTA de default, para a autoridade rejeitar ou ratificar: tomar a tabela
da spec pinada do alvo como referência provisória de comparação, porque
(a) é derivada SOURCE da publicação emissora (RCP 2017 Chart 1,
specification.md:222) com proveniência completa; (b) é internamente
consistente — nenhuma faixa duplo-valorada; (c) é a que o kernel implementado
segue hoje (news2.ts:169-179), de modo que o estado de execução e o estado
documentado do alvo coincidem. Independentemente do lado vencedor em 88–92,
o irmão precisa corrigir a duplicação interna 86–87/84–85→2 — correção de
inconsistência, não escolha clínica.

## 4. O que fecharia este item

1. Autoridade clínica nomeada ratifica UMA tabela (ou emite a sua própria),
   com registro em docs/00-governance/registers/decision-register.md.
2. O repositório irmão é atualizado (ou formalmente marcado superseded) —
   ato do repositório irmão, fora deste fluxo.
3. Se a ratificação contrariar o kernel: mudança de código com bump de
   versão de regra conforme o esquema vigente (ver dossiê
   RULE-VERSAO-ESQUEMA-DIVERGENCIA) e vetores de referência atualizados.

## 5. Rastreabilidade

- Achado: CRIT-4 da auditoria forense de 2026-09-19 — "One-point
  disagreement on the COPD target range is a clinical-ratification matter
  that exists **between the two repos' documents** and nowhere recorded".
- A semântica de ALERTA do NEWS2 (edge-triggered `news2≥7 AND prev<7`,
  early-warning-scores.md:119-125) está FORA do escopo deste dossiê — é
  matéria do fluxo de ciclo de vida de alerta (achados CRIT-1/CRIT-2), não
  da tabela de bandas.
