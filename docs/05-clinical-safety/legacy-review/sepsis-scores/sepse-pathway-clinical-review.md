---
id: LEGREV-SEPSE-PATHWAY-0001
title: Revisão legada — conteúdo clínico do pathway de sepse (domain_sepsis.py, sepse.yaml v4, sepse.yaml raiz, catálogo de regras)
label: PROPOSAL
status: PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI)
statement: >
  Revisão forense com rigor de intensivista da lógica clínica do pathway de sepse legado da
  V1 — critérios de inclusão, faixas, predicados e temporização — contra o Sepsis-3 (Singer
  2016) e a diretriz Surviving Sepsis Campaign 2021. O escopo é apenas conteúdo clínico; a
  mecânica de motor e a estrutura entre pathways pertencem ao workstream de pathways. Tudo
  aqui é PROPOSAL; nenhuma autoridade clínica ratificou qualquer declaração.
provenance:
  source_repo: intensicare (legado V1, READ-ONLY)
  path_or_url: src/intensicare/services/domain_sepsis.py, _work/alerts/pathways/sepse.yaml, _work/alerts/sepse.yaml, docs/rules (ver §1)
  commit_sha_or_version: 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79 (HEAD no pin; SHA-256 por arquivo em §1)
  section_or_lines: referências de linha por citação ao longo do documento
  date_collected: 2026-08-15
  collector: revisor forense de escores legados de sepse (ciclo 1, Tarefa 1); revisor responsável rodaquino-OMNI
  transformation: >
    traduzido EN→pt-BR, tranche 4, GDEC-0008 item 8 (trechos verbatim mais análise do
    revisor; análise rotulada INFERENCE/PROPOSAL)
  confidence: alta (verificação de fonte); baixa (disposições clínicas — não ratificadas)
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  requirements: [SAF-0001, SAF-0002, SAF-0019, SAF-0035]
  hazards: [HAZ-0005, HAZ-0006, HAZ-0021, HAZ-0036, HAZ-0040, HAZ-0043]
  adrs: [ADR-0008 (pendente — via sofa-review.md §7)]
  tests: []
  pr: null
supersedes: null
superseded_by: null
---

> Traduzido EN→pt-BR em 2026-08-16 (GDEC-0008 item 8, tranche 4); original EN preservado no histórico git.

# Pathway de sepse — revisão de conteúdo clínico legado

**PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).** A mecânica de
motor (compilador, supressão, execução de máquina de estados) está fora de escopo aqui e
pertence ao workstream de pathways; este registro revisa **apenas lógica clínica**.

## 1. Fontes verificadas, com hashes

Caminhos relativos a `https://github.com/Omni-Saude/intensicare` (READ-ONLY), fixados no HEAD git
`1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79`; hashes recomputados em 2026-08-15 contra
`docs/archive/legacy-provenance/legacy-pin-cycle-1.md`.

| Artefato | SHA-256 | Manifesto |
|---|---|---|
| `src/intensicare/services/domain_sepsis.py` | `853d2e38a8167d28e7eb242872e871024abe00b4868fc22f7c02502f99d3ccf8` | match |
| `src/intensicare/services/sepsis_input_provider.py` | `650bdd8c512fd08e673cde124269dd5c05a214ac07510011d53954cdd738b1cb` | match |
| `_work/alerts/pathways/sepse.yaml` (pathway v4.0.0) | `b84c9693295f5d820cb2796b6a789f10cfb9200409741af4e0ba78b7ad4ec7f0` | match |
| `_work/alerts/sepse.yaml` (raiz, 6 definições de alerta) | `1af8062d535ff0a9efa12a1606c7b37b975bd0635a8800f155491e958ced5dfa` | match |
| `docs/rules/clinical-scoring/RULE-SEPSE-001/-002/-005` | linhas 495-497 do manifesto (match) | match |
| `docs/rules/alert-threshold/RULE-SEPSE-003/-004/-058` | linhas 159-160, 180 do manifesto (match) | match |
| `tests/test_domain_sepsis.py` | `f86b57fa985705b279c8cbe0b0b212b3d47b0096d67db81ef39de82be81f22d5` | **não está no manifesto — hash-and-note** |
| `tests/test_sepse_yaml_parity.py` | `8d7e5557db0cd8e92077f87fc3be2e76b7e129b8b9e006432170023415e77017` | **não está no manifesto — hash-and-note** |
| `docs/plan/_work/ratification-decisions.yaml` | `b90c3cbbf11f22e440d7258e1e9c8fd556009a4c572717b839f51e73f7ee4751` | **não está no manifesto — hash-and-note** |
| `docs/plan/_work/dispositions/sepse-p1.yaml` | `cd15c8b1968f0f1c72c0bb11862757a545b4b260fff0625d2b5275b4e3e57b90` | **não está no manifesto — hash-and-note** |

Cobertura do catálogo de regras: `docs/rules` contém **99 registros RULE-SEPSE em sete
clusters** mais registros adjacentes a sepse nos clusters ALERTAS/ESTABILIDADE/EVOLUCOES/
TRILHAS-ENGINE. Os registros de rastreio/limiar clinicamente materiais (SEPSE-001…-005,
-058, e as famílias de critério -007…-037 e -038…-057 que agregam) foram revisados;
registros de workflow/UI (cluster de care-pathway -071…-097) estão fora do escopo de
conteúdo clínico e são anotados para o workstream de pathways. O código da era trilhas que
esses registros documentam (`ahlabs-trilhas@8166c07eae`) é **SOURCE NOT LOCATED** —
revisado apenas como documentado.

**Cinco gerações de lógica clínica de sepse coexistem na evidência legada:**

| Ger | Artefato | Conceito de rastreio |
|---|---|---|
| G1 | trilhas v1 + pathway manual (RULE-SEPSE-001/-004) | 9 critérios major + 11 minor; dispara em **maiores ≥3 AND menores ≥4** (vermelho) / ≥2 AND ≥3 (amarelo) |
| G2 | trilhas homecare (RULE-SEPSE-003) | 7 major + 4 minor; faixas estritas `>2`/`==2`; vermelho movido-por-minor **inalcançável** (criterio_11 hard-coded false) |
| G3 | trilhas v3 (RULE-SEPSE-002, -058, registros de critério -007…-037) | 11 major + 9 minor; dispara em **OR**; critérios reagrupados; divergências rótulo-vs-predicado |
| G4 | `domain_sepsis.py` v3.0.0 (seis alertas) | Estilo Sepsis-3/SSC-2021: gate de infecção + qSOFA/SIRS; lactato; choque; timers de bundle; stewardship por PCT |
| G5 | `_work/alerts/pathways/sepse.yaml` v4.0.0 + `sepsis_input_provider.py` | Porte declarativo do G4 mais critérios graduados de lab/hemodinâmica e um fluxo de cuidado de 5 estados |

O `_work/alerts/sepse.yaml` raiz é um sexto conjunto de alerta independente (citando
Sepsis-3) não conectado aos outros. G1-G3 se contradizem no *mesmo rastreio nominal*
(agregação AND vs OR vs igualdade-estrita; diferentes contagens e numeração de critério) —
documentado internamente na nota de divergência da RULE-SEPSE-002 e deixado sem resolução
pela "ratificação" legada (§6).

## 2. Definições autoritativas

- **Singer M, et al.** Sepsis-3. *JAMA*. 2016;315(8):801-810. doi:10.1001/jama.2016.0287,
  <https://pmc.ncbi.nlm.nih.gov/articles/PMC4968574/> — sepse = disfunção orgânica
  ameaçadora à vida por resposta desregulada do hospedeiro, operacionalizada como
  **aumento agudo do SOFA ≥2** consequente a infecção; choque séptico (critérios clínicos)
  = "necessidade de vasopressor para manter uma pressão arterial média de 65 mmHg ou mais
  **e** nível de lactato sérico maior que 2 mmol/L (>18 mg/dL) na ausência de
  hipovolemia"; mortalidade hospitalar em choque séptico "maior que 40%".
- **Evans L, et al.** Surviving Sepsis Campaign 2021. *Crit Care Med*
  2021;49(11):e1063-e1143 / *Intensive Care Med* 2021;47:1181-1247.
  doi:10.1007/s00134-021-06506-y. Recomendações verificadas para esta revisão: rastreio —
  contra o qSOFA como instrumento único (forte, qualidade moderada; ver `qsofa-review.md`
  §6); alvo de PAM 65 mmHg (forte, moderada); antimicrobianos **dentro de 1h** para choque
  séptico ou alta probabilidade de sepse (forte, baixa), e para possível sepse **sem**
  choque uma avaliação rápida com antimicrobianos **dentro de 3h** se a preocupação
  persiste (fraca, muito baixa); ≥30 mL/kg de cristaloide dentro das primeiras 3h (fraca,
  baixa — rebaixada de forte anteriormente); ressuscitação guiada por lactato (fraca,
  baixa); hemoculturas antes dos antimicrobianos quando não resultar em atraso substancial
  (<45 min) (declaração de melhor prática); **contra** PCT + avaliação clínica para decidir
  quando *iniciar* antimicrobianos (fraca, muito baixa); PCT + avaliação clínica para
  decidir quando *descontinuar* antimicrobianos com controle de foco adequado (fraca,
  baixa).
- **Bone RC, et al.** ACCP/SCCM Consensus Conference (SIRS). *Chest*.
  1992;101(6):1644-1655 — SIRS: temperatura >38°C ou <36°C; frequência cardíaca >90/min;
  frequência respiratória >20/min ou PaCO2 <32 mmHg; leucócitos >12.000/mm³ ou <4.000/mm³
  ou >10% bastões imaturos.

## 3. G4 — seis alertas de `domain_sepsis.py`: lógica clínica vs. autoridade

### 3.1 Conforme implementado (trechos verbatim)

Gate de infecção — `domain_sepsis.py:188-194`:

```python
def _infection_present(inputs):
    return (_bool(inputs.get("cultura_positiva"))
        or _bool(inputs.get("atb_iniciado_ultimas_24h"))
        or _bool(inputs.get("suspeita_infeccao_documentada")))
```

SIRS — `domain_sepsis.py:197-235`: temp >38,0 ou <36,0; FC >90; FR >20 senão PaCO2 <32;
leucócitos >12 ou <4 (×10³/µL) senão bastões >10%. Rastreio — `domain_sepsis.py:269-288`:
`infection AND (qSOFA >= 2 OR SIRS >= 2)`. Órgão — `domain_sepsis.py:291-322`:
`qSOFA >= 2 AND (lactato > 2.0 OR delta-lactato > 0.5 mmol/L/h em 6h padrão)`.
Choque — `domain_sepsis.py:325-347`:

```python
    if lactate is not None and lactate >= 4.0:
        return True, f"Lactate={lactate} >= 4 mmol/L (septic shock marker)"
    if map_val is not None and map_val < 65:
        if (vasopressor is not None and vasopressor > 0) or fluid_bolus:
            return True, ...
```

Timer de bundle — `domain_sepsis.py:350-391`: `protocol_active AND NOT item_checked AND
minutes_since_accept > 60` (item "primeira_hora") ou `> 180` ("reavaliacao"); rótulo de
pacote desconhecido assume 60 por padrão. PCT ascendente — `domain_sepsis.py:394-420`:
`ATB >= 48h AND PCT ascendente AND delta > 0,25 ng/mL` (nominalmente em 24h). Desescalonamento
de PCT — `domain_sepsis.py:423-454`: `estável AND ATB >= 48h AND (PCT < 0,25 OU >80% de
queda do pico)`.

### 3.2 Tabela de discrepância — G4 vs. Sepsis-3 / SSC 2021

| # | Item | Achado | Evidência |
|---|---|---|---|
| P-01 | Pontos de corte do SIRS | CORRESPONDE exatamente a Bone 1992 (incl. PaCO2 e alternativas de bastões) | `domain_sepsis.py:197-235` |
| P-02 | Composto de rastreio | qSOFA-OR-SIRS + gate de infecção: não é o instrumento de nenhuma diretriz; a auto-etiqueta "SSC-2021 RATIFIED" exagera (ver `qsofa-review.md` §6.2). Componentes ausentes de SIRS/qSOFA contribuem silenciosamente 0 (HAZ-0005, §7) — um rastreio que só pode subdisparar com dado esparso | `domain_sepsis.py:269-288` |
| P-03 | Alerta "disfunção orgânica" | **DEV (definicional)** — a disfunção orgânica do Sepsis-3 é **ΔSOFA≥2**; o G4 substitui por `qSOFA ≥2 AND lactato` e nunca consulta o motor de SOFA que existe na mesma base de código. O único critério de sepse conforme-Sepsis-3 no repositório (`sofa_delta >= 2`, `sepse.yaml` raiz:51-61) **não tem produtor**: grep de `src/` não encontra nada que compute `sofa_delta` — um critério morto. Delta-lactato >0,5 mmol/L/h não é citado | `domain_sepsis.py:291-322`; `_work/alerts/sepse.yaml:51-61` |
| P-04 | Alerta de choque séptico | **DEV (definicional, o pior do arquivo)** — dispara em `lactate >= 4.0` **sozinho**, sem contexto de infecção, sem exigência de vasopressor, sem condição de ressuscitação: qualquer hiperlactatemia ≥4 (convulsão, metformina, falência hepática) levanta uma asserção de "choque séptico". O braço alternativo (PAM <65 AND vasopressor-ou-bolus) *sub*-identifica o choque do Sepsis-3: um paciente *estabilizado* em noradrenalina (PAM mantida ≥65) com lactato 3 **é** choque séptico pelo Sepsis-3 e não dispara nada. Os critérios reais do Sepsis-3 (necessidade de vasopressor para manter PAM ≥65 **E** lactato >2 apesar de ressuscitação adequada) não estão implementados em lugar algum. O limiar 4,0 ecoa a era pré-2016 de sepse grave; não citado | `domain_sepsis.py:325-347` |
| P-05 | Definição de choque concorrente | O `sepse.yaml` raiz:63-81 define choque como `lactate > 2 AND vasopressors AND map < 65` — mais próximo do Sepsis-3 no lactato mas adiciona a condição refratária PAM<65-sob-pressores (a mesma subidentificação). **Duas definições de choque séptico mutuamente inconsistentes coexistem** em um repositório; uma terceira variante é o `crit-sep-shock` da v4 (`>= 4.0` OU refratário) | `_work/alerts/sepse.yaml:63-81`; `pathways/sepse.yaml:266-288` |
| P-06 | Temporização do bundle de hora-1 | Timer de ATB de 60 min por item; ancorado à **aceitação do protocolo**, não ao reconhecimento/apresentação como o SSC enquadra — e o provider deriva `minutes_since_accept` do *enrollment* de pathway (`sepsis_input_provider.py:282-299`), mais um grau de afastamento. Sem estratificação 1h (choque) vs. 3h (possível sepse sem choque) — o SSC 2021 divide isso; G4/G5 aplicam 60 min a todos | `domain_sepsis.py:350-391` |
| P-07 | Item "reavaliacao" de 180 min repropositado | A v4 vincula o timer de 180 min à **coleta de culturas** ("Bundle 3h — Culturas Pendentes", `pathways/sepse.yaml:308-324`) enquanto simultaneamente exige culturas **antes** de antibióticos que vencem em 60 min (`crit-sep-culturas-antes-atb`, `pathways/sepse.yaml:326-334`; lista de evidência "coletar culturas antes… sem atrasar a primeira dose", `pathways/sepse.yaml:429`). **Temporização internamente contraditória**: um prazo de cultura 3× mais tardio que o prazo de antibiótico não pode impor uma sequência culturas-primeiro. A declaração real do SSC 2021: obter culturas antes dos antimicrobianos quando isso não causar atraso substancial (<45 min) | `pathways/sepse.yaml:290-334,429` |
| P-08 | Critério de fluido | Faixas-alvo de 30 mL/kg (0-20 critical / 20-30 urgent / ≥30 normal, `pathways/sepse.yaml:191-211`) — o SSC 2021 classifica 30 mL/kg como **fraca, baixa qualidade**; a sub-faixa de 20 mL/kg é inventada; e a semântica de gravidade é invertida para a fase de não-ressuscitação (um paciente que *não requer* fluidos mostra "Volume insuficiente"/critical). Entrada nunca persistida (§5) | `pathways/sepse.yaml:191-211` |
| P-09 | PCT ascendente = falha de tratamento | Nenhuma recomendação do SSC 2021 sustenta alertar "falha de tratamento" na elevação de PCT; delta de 0,25 ng/mL/24h não citado. A janela de delta de 24h é imposta apenas pela busca de tolerância de ±6h do provider (`sepsis_input_provider.py:96-98,316-326`), não pelo avaliador, que aceita qualquer `procalcitonina_anterior` | `domain_sepsis.py:394-420` |
| P-10 | Desescalonamento de PCT | A direção corresponde à sugestão de *descontinuação* do SSC 2021 (fraca, baixa; com controle de foco adequado) — mas os limiares (<0,25 ng/mL; >80% de queda do pico) são valores estilo protocolo-de-ensaio, não citados; "desescalonamento" (estreitamento de espectro) não é o conceito de *descontinuação* da diretriz; e a adequação do controle de foco não é uma entrada | `domain_sepsis.py:423-454` |
| P-11 | Faixas graduadas de lactato/PCT/PAM | Lactato 2,0/4,0 (rótulo em ≥4: "Choque séptico" — mesma conflação do P-04); faixas de PCT 0,5/2,0 não citadas (valores de convenção de ensaio); PAM <65 critical / ≥65 normal corresponde ao alvo do SSC 2021 (borda da faixa em exatamente 65 tratada como ≥65 normal) | `pathways/sepse.yaml:107-167` |
| P-12 | Rótulos de bandeamento do qSOFA | Ver `qsofa-review.md` Q-07/§6.3 (faixa "Disfunção orgânica" em qSOFA 2; "Alta probabilidade de sepse" em 3; sem gate no critério) | `pathways/sepse.yaml:85-105` |

### 3.3 G1-G3 (catálogos trilhas) — status do conteúdo clínico

Os rastreios major/minor de 20 critérios são **instrumentos institucionais sem autoridade
externa** (veredito "UNVERIFIABLE" da RULE-SEPSE-001/-004: "Nenhuma referência publicada
define a agregação específica 'N maiores AND M menores'"). Seu estado interno é pior que
não-validado: três regras de agregação discordam para o mesmo rastreio nominal (AND vs OR
vs igualdade-estrita com um ramo vermelho morto); a RULE-SEPSE-058 documenta divergências
rótulo-vs-predicado dentro do próprio G3 (rótulo de plaquetas "<150.000" vs. predicado de
disparo <100.000; rótulo de febre ≥38,2 vs. predicado >38,2; rótulo de hipotensão omitindo
os braços PAD/PAM que o predicado tem; a *numeração* de critério difere entre o catálogo de
exibição e o model). Deltas externos ali registrados: febre 38,2 vs. 38,0 do SIRS; GCS <14
vs. <15 do qSOFA; lactato ≥3 vs. >2 do Sepsis-3; criterio_11 hard-coded false
(RULE-SEPSE-037). INFERENCE: G1-G3 são não-importáveis como conteúdo clínico; seu único
valor para a V2 é como evidência de que lógica de rastreio multi-variante sem governança de
fonte única diverge silenciosamente — exatamente a falha que a governança de rule-bundle da
V2 (SAF-0020/0021) existe para prevenir.

## 4. Temporização, frescor e obsolescência das entradas do pathway

| Classe de entrada | Janela conforme implementada | Avaliação |
|---|---|---|
| Vitais alimentando qSOFA/SIRS | **linha mais recente, sem limite de idade** (`_fetch_latest_vital`, `sepsis_input_provider.py:126-134`) | HAZ-0006: FR/PAS/GCS arbitrariamente obsoletos pontuados como atuais; VAL-0023 não resolvido |
| Labs alimentando SIRS (leucócitos, bastões, PaCO2) + lactato | lookback de 72h (`_RECENT_LABS_WINDOW`, `sepsis_input_provider.py:89`) | Um leucograma de 3 dias atrás pode satisfazer um critério SIRS "atual"; janela não citada |
| Histórico de PCT | 14 dias (`_PCT_HISTORY_WINDOW`, `sepsis_input_provider.py:93`); tolerância de amostra prévia de 24h ± 6h | Defensável para a cinética de PCT; não citado |
| Relógios de bundle | `PatientPathway.enrolled_at` faz proxy de "aceitação" para **ambos** os itens de ATB e cultura (`sepsis_input_provider.py:48-55, 282-299`) | Proxy de relógio único documentado honestamente na fonte; ainda uma lacuna de fidelidade de temporização |
| Gate de estabilidade | todas as linhas de `StabilityAssessment` em 48h devem ser "estavel" (`sepsis_input_provider.py:335-342`) | Direção fail-safe (ausência de linhas → chave omitida → critério pendente) |

## 5. Avaliabilidade estrutural — o achado decisivo

OBSERVED (`sepsis_input_provider.py:30-47, 362-366`): o provider documenta que **nenhuma
fonte persistida existe** para `infeccao_suspeita` (nenhum dos três sinais de
evidência-de-infecção tem armazenamento), `atb_ativa_horas` (nenhum sinal de
confirmação-de-administração de antibiótico), `culturas_antes_atb` (nenhuma persistência de
hemocultura "em lugar algum desta base de código"), e `fluid_volume` (nenhuma persistência
de balanço hídrico). Essas chaves são **sempre omitidas**.

INFERENCE — consequências para o pathway v4 conforme entregue:

1. `crit-sep-screen` exige `infeccao_suspeita` em **ambos** os braços OR
   (`pathways/sepse.yaml:222-245`) → o critério de rastreio estilo-SSC **nunca pode
   disparar** para nenhum paciente. Um pathway de sepse cuja porta de entrada é
   estruturalmente não-avaliável é o padrão HAZ-0043 (não-avaliação permanente
   habituada em silêncio) e, porque o não-disparo é não-registrado, HAZ-0021.
2. `crit-sep-pct-rising` e `crit-sep-pct-deesc` exigem `atb_ativa_horas` → nunca disparam.
3. `crit-sep-culturas-antes-atb` e `crit-sep-fluid` → nunca avaliáveis.
4. Enquanto isso, `qsofa_score`/`sirs_count` são **sempre emitidos** mesmo a partir de zero
   medições (`sepsis_input_provider.py:21-25, 360-361`) — de modo que os critérios que *de
   fato* conseguem avaliar são exatamente os coagidos-a-zero (§7). A superfície viva do
   pathway, portanto, se reduz a: faixas de qSOFA/SIRS possivelmente obsoletas, faixas de
   lactato/PCT/PAM onde labs existem, e os critérios de choque/bundle sobre entradas
   parciais.

Referência cruzada: para a V2, `compatibility-finding.md` §3 torna até essa superfície
reduzida indisponível a partir da AMH hoje (zero Observations populadas de qualquer
categoria; nenhum perfil de sinais vitais; nenhum contrato de administração-de-medicação ou
balanço-hídrico). A lacuna de fonte do gate de infecção do CAND-0004 ("ausente do
inventário de contratos — não bloqueada, simplesmente ausente") permanece a dependência
mais difícil de qualquer pathway fiel ao Sepsis-3.

## 6. Achado de governança — as alegações "RATIFIED"

`domain_sepsis.py:10-11, 62-66` e `pathways/sepse.yaml:221` alegam "CLINICALLY RATIFIED
(RAT-SEPSE-01/02)". OBSERVED: `docs/plan/_work/ratification-decisions.yaml:1-3` declara a
autoridade ratificadora como `'repository owner delegation (session directive: "use deep
think to decide on the RATIFICATION items and close PR #3 …")'` — uma delegação em-bloco
executada em 2026-07-04 sobre 269 decisões, e `dispositions/sepse-p1.yaml:24` mostra que a
RAT-SEPSE-01 foi a decisão de *escolha-de-geração* (G1-AND vs. G3-OR) tomada sob essa mesma
delegação. Nenhum aprovador clínico nomeado com credenciais verificáveis aparece em
qualquer lugar da cadeia (consistente com LEGACY-TA:125/465). Sob `evidence-notation.md`
§2 regra 3 e §4, nenhuma dessas alegações pode se sustentar como DECIDED na V2; todo selo
"RATIFIED" legado sobre conteúdo de sepse é nulo para os propósitos da V2 e é reaberto por
esta revisão.

## 7. Coerção-zero do HAZ-0005 — rastreamento em nível de pathway

| Local | Mecanismo | Linhas decisivas |
|---|---|---|
| Contagem de SIRS | cada critério não medido contribui 0; quatro entradas-`None` dão SIRS = 0, indistinguível de quatro-normais | `domain_sepsis.py:206-234` |
| Pontos de qSOFA | herda a coerção de `calculate_qsofa`; a chave pré-computada `qsofa` é confiada sem validação | `domain_sepsis.py:247-261`; `qsofa.py:79-115` |
| Fronteira do provider | `sirs_count`/`qsofa_score` sempre emitidos, mesmo com zero medições — a única exceção ao próprio contrato de omitir-quando-desconhecido do provider, reconhecida na fonte como "comportamento canônico herdado" | `sepsis_input_provider.py:21-25, 197-231, 360-361` |
| Não-disparo do rastreio | evidência de infecção ausente → `(False, "No infection evidence…")` — uma string de motivo não persistida; sem um contrato de evaluation-status o não-disparo é silencioso (HAZ-0021) | `domain_sepsis.py:276-278` |
| Braço de choque | `map_val is None` → braço pulado → não-disparado; PAM ausente lê como não-em-choque | `domain_sepsis.py:335-347` |
| Erros do avaliador | exceções se tornam linhas de resultado `severity="unknown", fired=False` — erros coagidos a não-alertas | `domain_sepsis.py:558-568` |

**Veredito: HAZ-0005 confirmado em todo ponto de agregação; o design declarativo v4
*corretamente* trata entradas ausentes como critérios pendentes (fail-safe) exceto para as
duas chaves de escore, onde a coerção é deliberadamente preservada por compatibilidade — a
exceção engole a regra, porque essas duas chaves dirigem as faixas de rastreio primárias.**

## 8. Vereditos clínicos — PROPOSAL, conforme legacy-import-policy §4

| Artefato | Veredito | Justificativa |
|---|---|---|
| Catálogos de rastreio major/minor G1-G3 (famílias RULE-SEPSE-001…-005, -007…-058) | **REJECT (reter como catálogo de falha)** | Nenhuma autoridade externa; três gerações mutuamente contraditórias; ramos mortos; deriva rótulo-vs-predicado. Valor apenas como vetor de regressão. |
| Conceito de rastreio G4/G5 (gate de infecção + qSOFA-OR-SIRS) | **VALIDATE** | Composto plausível, instrumento não validado, nenhuma fonte de suspeita-de-infecção existe; admissão condicionada à resolução do CAND-0004 e à propriedade clínica nomeada. |
| "Disfunção orgânica" do G4 (qSOFA + lactato) | **REJECT** | Substitui um proxy não validado pelo ΔSOFA≥2 do Sepsis-3 enquanto um motor de SOFA existe; nome de alerta enganoso. |
| `sepsis_sofa_alert` do `sepse.yaml` raiz (`sofa_delta >= 2`) | **TRANSFORM** | O único critério de sepse conforme-Sepsis-3 no repositório; atualmente um critério morto (sem produtor). O conceito sobrevive na V2 apenas com uma convenção de baseline ratificada e avaliabilidade de SOFA completa (`sofa-review.md` §7). |
| Alertas de choque séptico (todas as três variantes) | **REJECT** | Nenhum implementa o choque do Sepsis-3; lactato-≥4-sozinho assere choque sem contexto de infecção ou vasopressor; braços de PAM-refratária subidentificam choque estabilizado. A V2 deve derivar critérios de choque diretamente de Singer 2016. |
| Conceito de timer de bundle de hora-1 | **REFINE** | Escalonar em itens de bundle vencidos é suporte de prática sólido do SSC-2021; requer: âncora redefinida para o tempo de reconhecimento, estratificação 1h vs. 3h por choque/probabilidade, temporização de cultura subordinada à regra antibióticos-primeiro-com-culturas-antes (P-07), timestamps reais de aceitação/administração. |
| Critério culturas-antes-de-antibióticos | **REFINE** | Intenção correta do SSC; precisa do enquadramento <45-min-sem-atraso-substancial e de uma fonte de dado de cultura real. |
| Critério de fluido 30 mL/kg | **REJECT** | Conteúdo de recomendação fraca hard-coded como bandeamento de gravidade critical com sub-faixas inventadas, semântica de gravidade invertida fora da ressuscitação, e nenhuma fonte de dado. |
| Alerta "falha de tratamento" por PCT ascendente | **REJECT** | Nenhuma base de diretriz; limiares não citados. |
| Critério de desescalonamento de PCT | **VALIDATE** | Direção consistente com a sugestão de descontinuação do SSC 2021 (fraca); limiares e o enquadramento desescalonamento-vs-descontinuação precisam de reformulação clínica e citação; o gate de estabilidade é um bom instinto. |
| Computação de SIRS | **VALIDATE** | Pontos de corte exatos a Bone 1992; o papel do SIRS em um rastreio da era-2021 é em si uma decisão clínica (o SSC 2021 prefere NEWS/MEWS/SIRS sobre qSOFA mas não endossa nenhum como definitivo). |
| Contrato de omitir-quando-desconhecido do `sepsis_input_provider` | **TRANSFORM** | O único componente legado cuja filosofia de dado ausente corresponde à da V2 (ausência = pendente, nunca padronizada) — menos sua exceção de dois escores. Sua docstring "Known data gaps" é um modelo de prática honesta de evidência. O conceito sobrevive como a álgebra de evaluation-status da V2; o código não. |
| Fluxo de cuidado de cinco estados da v4 (`states:`, `pathways/sepse.yaml:384-413`) | **VALIDATE** | Narrativa clinicamente coerente (triagem → confirmação → tratamento → estabilização → resolução) mas as transições não estão vinculadas a critérios no conteúdo revisado; pertence ao workstream de pathways para revisão estrutural. |
| Selos "SSC-2021 RATIFIED" / RAT-SEPSE | **REJECT** | §6. Cadeia de autoridade nula. |

## 9. Elementos sobreviventes propostos para specs da V2 (PROPOSAL)

1. **As definições vêm apenas de Singer 2016 + Evans 2021, citadas por critério** — todo
   limiar numérico em um pathway de sepse da V2 carrega sua própria citação ou é
   explicitamente rotulado institucional-e-ratificado. O corpus legado demonstra o que se
   acumula sem essa regra (três definições de choque, três agregações de rastreio, ≥3
   limiares de lactato).
2. **A escolha do instrumento de rastreio é uma decisão clínica nomeada**, restrita pela
   recomendação de qSOFA do SSC 2021 (`qsofa-review.md` §6) e pela avaliabilidade de fonte
   (sinal de suspeita-de-infecção primeiro — CAND-0004).
3. **Disfunção orgânica = ΔSOFA ≥2 ou nada**: nenhum proxy de qSOFA/lactato usando o nome;
   condicionado a `sofa-review.md` §7 (INPUT TO ADR-0008) — hoje isso significa que o
   nível de confirmação do pathway de sepse é `not_evaluated` até que existam entradas de
   SOFA.
4. **Choque séptico re-derivado verbatim do Sepsis-3** (necessidade de vasopressor para
   manter PAM ≥65 AND lactato >2 apesar de ressuscitação adequada), com o caso
   estabilizado-em-pressores explicitamente vetorado em teste, já que todas as três
   variantes legadas o perdem.
5. **Timers de bundle ancorados ao reconhecimento com estratificação 1h/3h** e timestamps
   reais de administração/coleta; culturas-antes-de-ATB como uma checagem de sequenciamento
   com o limite de atraso <45-min.
6. O contrato de **omitir-quando-desconhecido do provider, universalizado** (sem a exceção
   de chave-escore), mais as linhas do §7 como vetores de sonda de entrada-ausente do
   SAF-0002 e os critérios nunca-avaliáveis do §5 como o caso de teste permanente do
   HAZ-0043.
7. Janelas de frescor por entrada como parâmetros clínicos ratificados (VAL-0023): os
   valores legados (nenhum para vitais; 72h para labs; 14d para PCT) são evidência da
   pergunta, não respostas.

*Revisado por rodaquino-OMNI (revisor responsável de registro, GDEC-0003). Nenhum PHI;
todos os valores são limiares publicados ou exemplos sintéticos.*
