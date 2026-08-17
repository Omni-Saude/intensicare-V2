---
id: LEGREV-OSMS-MEDSAFE
title: Revisão legada — segurança medicamentosa (stewardship antimicrobiano, profilaxia, prescrição, eficiência/transfusão, segurança/interação de fármacos, ADR-0026/0027)
label: PROPOSAL
status: PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI)
statement: >
  Revisão forense do conteúdo clínico de segurança medicamentosa legado da V1:
  domain_antimicrobiano.py, domain_profilaxia.py, domain_prescricao.py,
  domain_eficiencia.py, drug_safety.py, drug_interactions.py,
  anvisa_drug_database.py, os models+schemas+APIs de antimicrobial/medication/
  prescricao/prophylaxis, os pathways antimicrobiano.yaml e profilaxia.yaml,
  o catálogo+spec de pharmaco-interaction, e os ADRs 0026 e 0027. Todos os
  vereditos são PROPOSALS; nada é importado.
provenance:
  source_repo: intensicare (legado V1, READ-ONLY)
  path_or_url: https://github.com/Omni-Saude/intensicare
  commit_sha_or_version: 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79 (HEAD no pin; SHA-256 por arquivo abaixo)
  section_or_lines: citado por achado
  date_collected: 2026-08-15
  last_updated: 2026-08-15
  collector: revisor forense de suporte-de-órgão e segurança-medicamentosa legados (ciclo 1, Tarefa 1, wave 1b)
  transformation: >
    traduzido EN→pt-BR, tranche 4, GDEC-0008 item 8 (lido da fonte; resumido e
    analisado; nenhum conteúdo importado)
  confidence: alta (citações mecânicas) / média (avaliações clínicas)
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  hazards: [HAZ-0005, HAZ-0019, HAZ-0021, HAZ-0036]
  adrs: []
  pr: null
supersedes: null
superseded_by: null
---

> Traduzido EN→pt-BR em 2026-08-16 (GDEC-0008 item 8, tranche 4); original EN preservado no histórico git.

# Revisão legada — segurança medicamentosa

> **PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).**
> As comparações farmacológicas se apoiam em conhecimento treinado de
> referências padrão (IDSA/SHEA ASP 2016; orientação ASHP de profilaxia de
> úlcera de estresse; transfusão restritiva TRICC/AABB; alvos glicêmicos
> NICE-SUGAR; bula de produto para dosagem renal) — nenhuma rebuscada; toda
> declaração desse tipo é VALIDATION REQUIRED. Um farmacêutico clínico deve
> ser co-revisor nomeado para as disposições deste registro.

## 0. Artefatos e integridade (OBSERVED 2026-08-15; todos os hashes correspondem ao inventário)

| Artefato | SHA-256 |
|---|---|
| `src/intensicare/services/domain_antimicrobiano.py` | `d6d0e02f42a8a0bd412adffcaa3f4d13fb6688f3c1092ef114c445a5cab1e858` |
| `src/intensicare/services/domain_profilaxia.py` | `de349e49f84dedf68a08cdaef4ec7fc488ad9e69184149dc7e24bb3816eaf921` |
| `src/intensicare/services/domain_prescricao.py` | `31bb4dae220f129a9f56a27fa006adc0e507aae17d43487abba955f1e6c211de` |
| `src/intensicare/services/domain_eficiencia.py` | `c9f779e3ef88ee0b807092b6ecc5c2784dafa3fd17cb5b9e7237254b011b5128` |
| `src/intensicare/services/drug_safety.py` | `f4197af10f451fd20f2a2320ca7a25baedc88202fd9458670faa567d2ad2bbb7` |
| `src/intensicare/services/drug_interactions.py` | `199afda58f6131dc57e985bc90120e0205ace1cf5fc94b40051d38a09ff08ed8` |
| `src/intensicare/services/anvisa_drug_database.py` | `158d465e46619339503573254e579a07b8a7630f19cb69891424de859eae5ac9` |
| `src/intensicare/models/antimicrobial.py` | `543b696f311da4adfd91c1c5043da659efab7c3fc50559492c6c88f0288231b2` |
| `src/intensicare/models/medication.py` | `88ed99a3cfdd6935526f2f794f6b1bc0713f62a3e6ab3abfdce9dfc2c1e6cab2` |
| `src/intensicare/models/prescricao.py` | `f186fe95321270c06cea9b30c159c0ffa6f0539032b55cca6d6c8aa467de7e87` |
| `src/intensicare/models/prophylaxis.py` | `ce9d805dfcad2de9829194f7046980a1ca7f4954c4248cbc042210eea97d8c32` |
| `src/intensicare/schemas/antimicrobial.py` | `24dbbbbb7d3836f4ed7cde6bc3b50a6ada279086ae6247fabc1bcc9cee83377a` |
| `src/intensicare/schemas/prescricao.py` | `d429742f59d5fe801471298796e2a0d1f8c5fe7335aee4ddb9340d00f4cfa0c5` |
| `src/intensicare/schemas/prophylaxis.py` | `d99465de24233e1f5bf1b1d3fd5c5987e6b412ffa0f35edf3d848634a459d791` |
| `src/intensicare/api/v1/antimicrobial.py` | `3038aa9c5a411e6491e6cc97458fcb00cf2722082e84400a3bff207d80c52d5d` |
| `src/intensicare/api/v1/prescricao.py` | `2bce7c481dfd0cb527f6ed9b653fb32ee61dce49cfa4082ea41e5acc0be655df` |
| `src/intensicare/api/v1/prophylaxis.py` | `e467de1686914991217fce1ace20b59082f21e366e5fa93bc850b471243799c9` |
| `src/intensicare/api/v1/efficiency.py` | `530a04f6bfc5ec539548c5de52e9b0609dc8e20743ecec958101ea6a23783559` |
| `_work/alerts/pathways/antimicrobiano.yaml` | `0ef987c51ad18ab9dea0123da1fec8c2c07b96833abe6a5ce9ee6db8e4e3758f` |
| `_work/alerts/pathways/profilaxia.yaml` | `0e33e945a67e0671c7f6cc957215c1f221d7b1f13e5ef01f8d024ad0584598bc` |
| `docs/plan/_work/alerts/pharmaco-interaction.yaml` | `ee403fbe4d63d694993ac4858f83f8bc3cc920cbe413f3323b3e6c8fae6fc992` (rt) |
| `docs/plan/clinical/domains/pharmaco-interaction.md` | `4fd1bed23543bcf5244d4a078d55534fc1132745214041561641ab0ab7e5706d` (rt) |
| `docs/adr/0026-prescricao-drug-interaction-safety.md` | `3d95b144f2a199594bf2cb7116ce7e08a4952a81a70f953e30159c16e45957e0` (rt) |
| `docs/adr/0027-prescricao-lifecycle-state-machine.md` | `7385d8c3b5b1a5b76f77401268218cd8eaa8083ec0c5d3d48c9c304ebd55a00e` (rt) |

## 1. Stewardship antimicrobiano (`domain_antimicrobiano.py`)

12 critérios (crit-001..012: duração >7d; espectro excessivamente amplo; dose
fora da faixa para peso/função renal; CVC >7d; candidemia sem
desescalonamento ≤72h; culturas pendentes >72h; PAC sem critérios de
gravidade; cobertura dupla para gram-negativo; vancomicina >72h sem MRSA;
profilaxia cirúrgica >24h; vancomicina/aminoglicosídeo >72h sem níveis; CVC
sem documentação de curativo). Os critérios são itens de stewardship
clinicamente plausíveis, estilo IDSA/SHEA (não citados no código).

**Defeitos (ancorados verbatim):**

1. **Predicado quebrado — todo critério marca cumprido quando entradas são
   fornecidas.** `domain_antimicrobiano.py:212-215`:

   ```python
   is_met = crit_def["id"] in criteria_met_set or (
       inputs is not None
       and evaluate_criterion(crit_def, inputs.get(crit_def["id"])) is not None
   )
   ```

   `evaluate_criterion` sempre retorna um objeto de resultado (nunca None),
   de modo que qualquer avaliação dirigida-por-entrada marca todos os 12
   critérios como cumpridos → escore 12 → VERMELHO para todo paciente. O
   próprio motor de regra é um placeholder que sempre retorna `met=False`
   (linhas 155-186) — o caminho automatizado está tanto conectado errado
   quanto vazio.
2. **Contagem-como-gravidade com um piso tranquilizador**: escore ≤3 →
   NEUTRO com recomendação "Prescrição antimicrobiana dentro dos parâmetros
   adequados" (230-263). Um paciente cuja única não-conformidade é crit-005
   (candidemia sem desescalonamento) é renderizado NEUTRO/adequado —
   gravidade por contagem, não por criticidade do critério (falsa
   tranquilização adjacente ao HAZ-0005).
3. Vocabulário de cor legado NEUTRO/AMARELO/VERMELHO, não o modelo de
   gravidade canônico.

## 2. Bundles de profilaxia (`domain_profilaxia.py`)

Cinco checklists (úlcera de estresse/LAMGD, TEV, controle glicêmico,
mobilização precoce, dispositivos invasivos); escore = %critérios cumpridos
dos aplicáveis; sem gatilhos automatizados. Valores embutidos: alvo
glicêmico 140-180 mg/dL (consistente com NICE-SUGAR), monitoramento a cada
4-6h, manguito 20-30 cmH2O, cabeceira 30-45°, curativo de CVC 7d,
hidrocortisona >300 mg/d como fator de risco de esteroide (a literatura
comumente usa >250 mg equivalente-hidrocortisona — VALIDATE), coagulopatia
INR >1,5 ou plaquetas <50 mil, VM >48h (fatores de risco clássicos da era
Cook para profilaxia de úlcera de estresse).

**Incoerência semântica**: os quatro "critérios" do bundle LAMGD são
*indicações* de fator de risco (VM >48h, coagulopatia, choque, esteroides)
enquanto os bundles de TEV/glicemia listam itens de *adesão* — marcar as
quatro indicações do LAMGD como cumpridas produz "completo (100%)" como se
fosse conforme, e **nenhum critério em lugar algum checa se a profilaxia de
úlcera de estresse está de fato prescrita**. O bundle não consegue detectar
sua própria falha principal (profilaxia indicada-mas-ausente; esse sinal
vive apenas no predicado legado da RULE-PROFILAXIA-005 e em lugar algum
deste serviço).

## 3. Domínio de prescrição (`domain_prescricao.py`, mais ADR-0026/0027)

- Máquina de estados (160-380): rascunho→ativa→{concluída, descontinuada,
  suspensa}; suspensa→{ativa, descontinuada}; estados terminais travados;
  motivos exigidos ao descontinuar/suspender; end_time auto-definido;
  `version` de bloqueio otimista (optimistic-locking) no model —
  consistente com o ADR-0027 e uma melhoria genuína sobre as flags legadas
  em nível de dose (consciente do HAZ-0023).
- `_parse_dosage` (75-90): strings de dosagem não-parseáveis →
  `(0.0, "mg")`. Uma dosagem brasileira com vírgula decimal ("2,5mg") falha
  na regex e no fallback de float e é **silenciosamente zerada** — a
  família de defeito de vírgula-decimal do SYS-09 recorrendo em doses de
  medicação. Novas prescrições são protegidas pela R03 (dose deve ser
  positiva), mas registros *armazenados* aparecem através de
  `_model_to_record` com dose 0.0 em caminhos de interação/exibição.
- Validadores: V03 "checagem de alergia" (1202-1224) **nunca consulta a
  lista de alergias do paciente** — emite um aviso genérico "verificar
  histórico de alergia" sempre que o fármaco pertence a qualquer grupo e
  sempre passa. O tipo de interação fármaco-alergia anunciado não está
  implementado contra dados do paciente. V04 bloqueia apenas
  `contraindicated`; interações `severe` (p. ex., risco de apneia por
  fentanil+midazolam) apenas avisam — uma política deliberada que deve ser
  re-decidida pela governança da V2, não herdada.
- R15 teto rígido de 15 prescrições ativas; R16 aviso de polifarmácia ≥8 —
  valores operacionais, NÃO CITADOS.

## 4. Segurança de dose (`drug_safety.py`)

Tabela de 21 fármacos (dose única mín/máx, máximo diário, tetos de infusão,
doses por peso, multiplicadores renais para 7 fármacos, avisos de −50% para
idosos em midazolam/morfina, fatores de fração-do-adulto pediátricos).

**Defeitos (ancorados verbatim):**

1. **Fármacos não-mg nunca têm a dose checada.** `_validate_dose` lê apenas
   `max_single_mg`/`min_single_mg` (606-617), mas insulina/heparina definem
   `max_single_ui`, KCl `max_single_mEq`, NaCl 3% `max_single_mL`,
   noradrenalina/dobutamina `max_single_mcg_kg_min`, fentanil
   `max_single_mcg`. Para cada um desses fármacos de alto-alerta a checagem
   de dose única silenciosamente vira no-op — insulina 500 UI ou KCl 200
   mEq passa sem aviso algum. A checagem de infusão da R34 lê
   `infusion_rate_max_mg_h` (definido apenas para vancomicina), de modo que
   `max_infusion_ui_h` (insulina, heparina) também está morto. **A rede de
   segurança tem buracos exatamente sobre os fármacos de maior risco.**
2. `_mass_to_mg` mapeia mL→1,0 ("assumir 1 mg/mL"), UI→1,0, mEq→1,0
   (442-453) — equivalências dimensionalmente inválidas que tornam
   qualquer comparação cross-unidade sem sentido (uma dose de dipirona
   escrita em mL fica errada por 500×).
3. R33 dosagem pediátrica = fração fixa da dose de adulto por faixa etária
   (neonato 5% … adolescente 75%, 410-416) — não é um método de dosagem
   pediátrica reconhecido para esses fármacos; perigoso como texto
   consultivo em um produto de UTI adulta que pode ver idades limítrofes.
4. `_validate_dose` sempre retorna `valid=True` (695-697) — toda violação é
   consultiva; nenhuma parada rígida existe mesmo para o aviso de
   arritmia por KCl >20 mEq/h (R35, que também confunde uma dose a cada
   6h com uma taxa horária).
5. Os valores da tabela (meropeném 500-2000 mg, máx 6 g/d; vancomicina 15
   mg/kg, infusão ≤1 g/h; propofol ≤4 mg/kg/h; KCl ≤40 mEq dose única, ≤20
   mEq/h; NaCl 3% ≤100 mL/h; multiplicadores renais de enoxaparina;
   meropeném dose plena em TFG 26-50 — discordante da bula, a maioria das
   referências reduz em ClCr ≤50) são uma farmacopeia plausível-mas-NÃO-CITADA;
   várias linhas precisam de re-derivação por farmacêutico (VALIDATION
   REQUIRED como conjunto).

## 5. Base de conhecimento de interação (`drug_interactions.py`, `anvisa_drug_database.py`)

KB pareado hard-coded sobre os mesmos 21 fármacos + agrupamentos de classe +
grupos de reatividade-cruzada de alergia + regras de empilhamento (R21 ≥2
opioides severe; R22 ≥3 sedativos severe; R23 ≥2 anticoagulantes
contraindicated; R24 ≥8 fármacos polifarmácia).

**Auditoria de conteúdo (entradas clinicamente duvidosas ou erradas):**

| Entrada | Alegação | Avaliação |
|---|---|---|
| vancomicina × amiodarona (`drug_interactions.py:67-76`) | "severe — prolongamento de QT/Torsades" | vancomicina não é um agente reconhecido como prolongador de QT; o par está ausente das referências padrão de DDI — **NÃO VERIFICADO/provavelmente fabricado** |
| noradrenalina × dobutamina (127-136) | "incompatibilidade física na mesma linha — risco de cristalização" | os agentes são comumente co-infundidos e referências de compatibilidade padrão os listam como compatíveis em Y-site — **NÃO VERIFICADO/provavelmente fabricado** |
| ceftriaxona × cloreto_de_sodio_3% (167-176, e R26 411-421) | "contraindicated — soluções contendo cálcio (incluindo NaCl 3%)" | a precipitação ceftriaxona-cálcio se aplica a soluções contendo cálcio; **soro fisiológico hipertônico não contém cálcio** — contraindicação factualmente errada |
| meropeném × vancomicina (147-156) | "minor — sinergismo esperado" | uma não-interação editorializada na KB; ruído |
| heparina × enoxaparina (97-106) | "contraindicação absoluta" | anticoagulação terapêutica duplicada é um alerta severe genuíno; a frase "contraindicação absoluta" exagera cenários de transição — REFINE na redação |

A checagem R18 "fármaco-alergia" (293-304) testa se dois fármacos
*prescritos* compartilham um grupo de alergia — isso é detecção de
duplicação rotulada erroneamente como checagem de alergia; as alergias do
paciente nunca são lidas (combina com o achado do V03). A cobertura é
arbitrária: pares conhecidos entre os mesmos 21 fármacos estão ausentes
(p. ex., amiodarona×fentanil, efeitos amiodarona×enoxaparina-classe), de
modo que a KB é simultaneamente sobre- e sub-inclusiva.
`anvisa_drug_database.py` é um stub explícito ("Future endpoint
(speculative)") cujos registros em memória se apresentam como conteúdo do
Bulário ANVISA — risco de registro-fabricado se algum dia exposto como
autoritativo.

Contraste: o **catálogo pharmaco-interaction**
(`docs/plan/_work/alerts/pharmaco-interaction.yaml`, 8 alertas / 34 vetores
/ 17 citações) ancora seu alerta de QTc em CredibleMeds Known-Risk +
Tisdale 2013, síndrome serotoninérgica em Boyer & Shannon NEJM 2005 +
critérios de Hunter, depressão de SNC em Overdyk 2016, com gates de sintoma
e supressão por ventilação-controlada — um padrão de evidência
materialmente mais alto que a KB hard-coded. As duas superfícies são
**paralelas e divergentes**; a V2 deve ter exatamente uma fonte de verdade
para interação. (Seu carregador em runtime `domain_pharmaco_delirium.py` é
revisado por neuro-sedation-scores; o conteúdo do catálogo é de
responsabilidade daqui — nota de cross-check, sem atribuição dupla.)

## 6. Adequação de eficiência / transfusão (`domain_eficiencia.py`)

12 critérios de transfusão (TF-001..012), contenção (reavaliação >4h),
fragilidade (CFS 1-9, categorias consistentes com Rockwood), outlier de LOS
(>1,5× esperado ou >14d).

**Defeitos (ancorados verbatim):**

1. **TF-002 invertido contra a estratégia restritiva.**
   `domain_eficiencia.py:290-307`:

   ```python
   # TF-002: Hb >= 7 g/dL (gatilho restritivo) — met means it's WITHIN threshold (appropriate)
   tf002_met = hb_pre is not None and hb_pre >= 7.0
   ```

   O catálogo de critério diz que transfusão em Hb ≥7 "requer
   justificativa" (a string de detalhe do caso cumprido até diz isso), mas
   `met` **soma um ponto em direção à adequação** exatamente quando a
   transfusão viola o gatilho restritivo (direção TRICC/AABB). Uma
   transfusão liberal pontua como mais adequada.
2. **Adequação baseada em contagem**: `appropriate = met_count >= 8` de 12
   (479) — uma transfusão com compatibilidade ABO não confirmada, sem
   consentimento e com uma reação transfusional ainda pode ser "adequada"
   por pontos de documentação. Critérios de classe never-event devem ser
   individualmente bloqueadores, não agrupáveis.
3. Os componentes CFS/contenção/LOS são plausíveis (CFS ≥5 frágil;
   reavaliação de contenção >4h) — NÃO CITADOS no código.

## 7. Conteúdo de pathway (`antimicrobiano.yaml`, `profilaxia.yaml`)

- Faixas de duração de ATB 0-3/3-7/7-10/≥10d → normal/watch/urgent/critical;
  IDSA/SHEA 2016 citado (`doi 10.1093/cid/ciw118` — consistente com a
  diretriz de implementação; não rebuscado). Duração sozinha alcançando
  "critical" sobrecarrega o nível de emergência (semântica de prioridade de
  stewardship).
- Faixas de PCT 0-0,25/0,25-0,5/0,5-2,0/≥2,0 → normal→critical: a narrativa
  do catálogo (desescalonar quando PCT <0,5 ou −80% do pico) é consistente
  com a evidência; bandear PCT *alta* como critical converte um guia de
  desescalonamento em um alarme de gravidade — precisa de decisão clínica
  deliberada.
- **Ambiguidade de polaridade de critério booleano (bloqueadora):**
  critérios de `profilaxia.yaml` disparam em `tev_profilaxia == true` /
  `ugb_profilaxia == true` / `mobilizacao_status == true`;
  `antimicrobiano.yaml` em `culturas_resultado == true` e
  `descalonamento_status == true`. Se o motor de trilhas levanta alertas
  quando predicados correspondem, esses alertam sobre profilaxia *dada* e
  desescalonamento *feito* — sinais invertidos. Se correspondência de
  critério significa "alerta" ou "marco alcançado" é uma semântica de motor
  de responsabilidade do workstream de pathways — **flag entre workstreams
  levantada; o veredito sobre esses booleanos está bloqueado pendente essa
  decisão de motor.**
- Faixas de cabeceira elevada (<20° critical / 20-30 watch / ≥30 normal)
  direção-correta para prevenção de VAP.

## 8. Avaliação de coerção-zero do HAZ-0005

| Caminho | Comportamento | Avaliação |
|---|---|---|
| Escore antimicrobiano | ≤3 não-conformidades → NEUTRO "adequado" | piso de contagem renderiza achados reais como adequação — falsa tranquilização |
| Caminho de entradas antimicrobianas | todos os critérios cumpridos com qualquer entrada (defeito §1.1) | falha inversa: positivos fabricados (integridade de alarme, HAZ-0036) |
| Bundles de profilaxia | critérios não marcados = pendente, não risco | semântica de checklist aceitável; sem coerção |
| `_parse_dosage` | não-parseável/vírgula-decimal → 0,0 mg | coerção-zero em doses de medicação armazenadas |
| Validação de dose | fármacos não-mg pulam checagens silenciosamente | ausência de validação indistinguível de validado-seguro (análogo ao HAZ-0021) |
| Validador de alergia V03 | nenhum dado de alergia do paciente → sempre passa | dado ausente = sem risco, por construção |
| TF-002 | Hb ausente → critério não cumprido, mas TF-001 já sinaliza Hb não documentada | mitigação parcial; o defeito de inversão domina |

## 9. Vereditos (todos PROPOSAL)

| Artefato / caminho | Veredito | Justificativa |
|---|---|---|
| Caminho de avaliação de `domain_antimicrobiano.py` | REJECT | predicado sempre-verdadeiro de cumprido; contagem-como-gravidade; motor placeholder |
| 12 critérios de stewardship (conteúdo) | VALIDATE | itens de checklist plausíveis-IDSA/SHEA que valem a pena carregar como *critérios*, com gravidade por critério, sob revisão de farmacêutico/infectologia |
| `domain_profilaxia.py` | REFINE | mecânica de checklist boa; o bundle LAMGD deve ganhar um membro profilaxia-prescrita e separar indicação da semântica de adesão |
| Máquina de estados de prescrição (+ADR-0027) | REFINE | design sólido, bloqueio otimista; carregar o conceito com testes de aceitação da V2 |
| `_parse_dosage` | REJECT | zeragem silenciosa incl. vírgula-decimal — a classe de hazard de parse-de-locale legado documentada |
| Validadores V03/V04 | REJECT (V03) / VALIDATE-com-decisão-de-política (V04) | a checagem de alergia não é uma checagem de alergia; apenas-avisar-em-severe precisa de uma decisão explícita da V2 |
| Lógica de validação de `drug_safety.py` | REJECT como implementada | descompassos de chave de unidade desabilitam checagens para os fármacos de maior alerta; equivalências mL/UI/mEq→mg inválidas; apenas-consultivo em todo lugar |
| Valores de tabela de `drug_safety.py` | VALIDATE | farmacopeia plausível-não-citada; re-derivação por farmacêutico linha-a-linha exigida (linha renal de meropeném discordante) |
| Dosagem por fração pediátrica (R33) | REJECT | não é um método de dosagem reconhecido; fora do uso pretendido de UTI adulta |
| KB de `drug_interactions.py` | REJECT (conteúdo) / TRANSFORM (mecanismo) | entradas fabricadas/erradas (QT vanco-amio, cálcio NaCl-3%, incompatibilidade nora-dobuta); reconstruir a partir de uma fonte autoritativa conforme a spec de pharmaco |
| Regras de empilhamento R21-R24 | VALIDATE | guardas em nível de classe rombas mas defensáveis |
| `anvisa_drug_database.py` | ARCHIVE | stub explícito; nunca expor dado de stub como conteúdo de registro |
| `pharmaco-interaction.yaml` + `domains/pharmaco-interaction.md` | VALIDATE | artefato melhor-citado no escopo OSMS (CredibleMeds/Tisdale/Boyer-Shannon/Hunter/Overdyk); torná-lo a fonte única de interação |
| Escore de transfusão de `domain_eficiencia.py` | REJECT | inversão do TF-002 + adequação baseada em contagem mascarando critérios never-event |
| Componentes CFS / contenção / LOS | VALIDATE | consistentes com Rockwood; não citados |
| Pathway `antimicrobiano.yaml` | VALIDATE (valores de duração/PCT) com nota de nível-de-gravidade | itens de polaridade booleana bloqueados na semântica de motor |
| Pathway `profilaxia.yaml` | VALIDATE (faixas de cabeceira) / BLOCKED (polaridade booleana) | possíveis alertas invertidos pendentes de decisão do motor de pathways |
| Models/schemas/APIs (antimicrobial, medication, prescricao, prophylaxis, efficiency) | ARCHIVE/REFINE | persistência e transporte; status padrão "active" (não rascunho) do model de prescricao anotado; schemas embutem contratos de contagem (0-12, 0-100) que caem com as rejeições de contagem-gravidade |
| ADR-0026 | ARCHIVE (referência) | contexto de decisão de KB local híbrida; seu vocabulário de 4 gravidades sobrevive, seu conteúdo de KB não |

**Pior achado:** as checagens protetoras da camada de segurança
medicamentosa estão estruturalmente ocas nos pontos de maior risco — o
avaliador antimicrobiano marca todo critério como cumprido (ou nenhum, via
o placeholder), o validador de dose silenciosamente pula os limites de
insulina/heparina/KCl/vasopressor/fentanil por descompassos de chave de
unidade, a checagem de alergia nunca lê as alergias do paciente, e a KB de
interação contém entradas fabricadas — enquanto se apresenta como uma rede
de segurança ativa (classe HAZ-0021/HAZ-0036: a aparência de checar sem a
checagem).
