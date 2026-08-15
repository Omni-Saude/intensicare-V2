---
id: RULE-GCS-0100
title: RULE-GCS v0.2.0 — especificação de conteúdo clínico da Escala de Coma de Glasgow (precursor de pacote de release)
label: PROPOSAL
status: REVISADO CLINICAMENTE 2026-08-15 (GDEC-0007) — decisões incorporadas; aprovação formal pendente do mecanismo de bundle assinado (ADR-0007); NOT ACTIONABLE (inalterado)
last_updated: 2026-08-15
statement: >
  Especificação completa de conteúdo clínico para a Escala de Coma de Glasgow (GCS) como
  instrumento de primeira classe no V2 — modelo de componentes E/V/M com estado
  not-testable (NT) de primeira classe por componente, total 3-15 computado SOMENTE a
  partir de três componentes testados, e gate de avaliabilidade por confusão sedativa
  (RASS contemporâneo; sedation_confounded). Re-derivada das fontes primárias (Teasdale &
  Jennett 1974; Teasdale et al. 2014; glasgowcomascale.org; Sessler 2002); nada foi
  copiado do código legado. Versão semântica 0.2.0 — precursor 0.x de um pacote de
  release clínico conforme prompt orquestrador §6.4, explicitamente NÃO um release
  assinado. Classificação: NOT ACTIONABLE — nenhuma fonte populada evidenciada existe
  para qualquer entrada da GCS (restrição AMH); artefato de autoria apenas, sem nenhuma
  alegação de prontidão de runtime.
provenance:
  source_repo: intensicare-V2
  path_or_url: docs/05-clinical-safety/rule-releases/gcs/specification.md
  commit_sha_or_version: uncommitted (working tree on cycle-1/clinical-content; HEAD ddac9bc)
  section_or_lines: whole document
  date_collected: 2026-08-15
  collector: GCS-instrument V2 clinical-content specification author (cycle 1, Task 2); accountable reviewer rodaquino-OMNI
  transformation: >
    Re-derivada das fontes primárias citadas em §2, com verificação ao vivo em
    2026-08-15; o registro forense REV-NS-01-gcs.md (e REV-NS-02-rass.md para o gate
    RASS) foi usado exclusivamente como catálogo de defeitos legados a evitar. Nenhuma
    fórmula, constante ou código legado foi copiado. Escolhas do autor rotuladas
    INFERENCE/PROPOSAL; definições publicadas rotuladas SOURCE. Redação em pt-BR conforme
    DEC-G0-10; identificadores e enums legíveis por máquina em EN por consistência com os
    rule-releases existentes (sofa/, news2/).
  confidence: medium-high (valores publicados do instrumento: high; disposições clínicas: decididas pela revisão nomeada GDEC-0007 2026-08-15; aprovação formal via bundle assinado ADR-0007 pendente)
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  requirements: [SAF-0001, SAF-0002, SAF-0003, SAF-0006, SAF-0019, SAF-0030, SAF-0035, SAF-0041]
  hazards: [HAZ-0005, HAZ-0006, HAZ-0036, HAZ-0044]
  adrs: [ADR-0008 (pending — this spec is an input), ADR-0027 (proposed — population gating), ADR-0028 (sedation confounding — authored concurrently, cross-referenced by ID, not blocked on)]
  tests: []
  pr: null
supersedes: null
superseded_by: null
---

# RULE-GCS v0.2.0 — especificação de conteúdo clínico (precursor de pacote de release)

## 0. Identidade, status, classificação

| Campo | Valor |
|---|---|
| Identificador da regra | **RULE-GCS** |
| Versão semântica | **0.2.0** — precursor 0.x; não assinado; não é um release |
| Status | **REVISADO CLINICAMENTE 2026-08-15 (GDEC-0007) — decisões incorporadas; aprovação formal pendente do mecanismo de bundle assinado (ADR-0007); NOT ACTIONABLE (inalterado)** |
| Classificação | **NOT ACTIONABLE — nenhuma fonte populada evidenciada (restrição AMH); artefato de autoria apenas** |
| Clinical owner | UNASSIGNED — VALIDATION REQUIRED |
| Aprovador independente | UNASSIGNED — VALIDATION REQUIRED (autor ≠ aprovador; o autor desta especificação não aprova nada) |
| Lógica legível por máquina | bloco YAML declarativo em §9 (inline neste precursor) |
| Vetores de referência | `reference-vectors.md` (este diretório) — clinicamente revisados (GDEC-0007); evidência de execução pendente; DRAFT para fins de execução |
| Notas de migração rule-local | `migration-notes.md` (este diretório) |

**Histórico de versões (changelog):**

- **0.2.0** — decisões da revisão clínica nomeada incorporadas (GDEC-0007, 2026-08-15)
- 0.1.0 — proposta inicial (ciclo 1), AWAITING NAMED CLINICAL REVIEW

**Por que NOT ACTIONABLE, sem suavização.** SOURCE
(`docs/08-interoperability/amh-data/compatibility-finding.md` §3, AMH pinado em
`0a07a6f1fab36fb2f5eeee0fcd8e945c95f67116`; restated em RULE-SOFA-0100 §0): no snapshot
de evidência, o AMH tem zero Observations populadas de qualquer categoria — não existe
fonte evidenciada para componentes E/V/M, para RASS, nem para estado de infusão sedativa.
Admitir esta regra a qualquer runtime hoje instanciaria HAZ-0043 (`not_evaluated`
permanente habituado como silêncio tranquilizador). Este documento autora conteúdo
clínico para um release futuro com fontes evidenciadas; não ativa nada e não alega
nenhuma prontidão de runtime.

**O que esta regra emite (quando um futuro release assinado a executar):** três valores
de componente (E, V, M), cada um com seu próprio estado de testabilidade; um estado de
avaliabilidade (gate sedativo); e um total 3–15 emitido somente sob as condições de §6.
**O que ela nunca emite:** um total com qualquer componente NT ou ausente; um total
coagido de componentes não testados; qualquer banda de severidade ("leve/moderado/grave"
— a subdivisão institucional legada `grave`/`muito_grave` é REJEITADA; qualquer banda
futura exige fonte nomeada e ratificação própria); qualquer mapeamento automático
GCS→ACVPU (ver §7.3).

## 1. Uso pretendido, população, exclusões

### 1.1 Uso pretendido (apenas apoio)

PROPOSAL, subordinada a `docs/01-vision-and-intended-use/intended-use-statement.md`
(IU-03, IU-05, IU-09): RULE-GCS descreve o nível de consciência de **pacientes adultos de
UTI** como **informação de apoio**, sustentando — nunca substituindo — o julgamento do
clínico (IU-09). A GCS caracteriza responsividade em três dimensões observáveis; não é
teste diagnóstico, não é prognóstico isolado e não determina conduta. Cadência: avaliação
por turno/por indicação clínica; não é instrumento de vigilância minuto-a-minuto.

### 1.2 População — gate APLICÁVEL (ENFORCEABLE)

Idêntico em estrutura ao gate de RULE-SOFA-0100 §1.2 e subordinado a ADR-0027:

| Condição | Comportamento | Base |
|---|---|---|
| Idade ≥ 18 anos, verificada de fonte demográfica confiável | Na população; avaliar | IU-05 (adulto ≥18 PROPOSAL); VAL-0006/VAL-0007 |
| Idade **desconhecida** (ausente, identidade não resolvida, fonte não confiável) | **`not_evaluated` (reason `population_unverified`)** — a regra NUNCA assume adulto | HAZ-0036 (mecanismo PH-11); evaluation-status-semantics.md §3.3 |
| Idade < 18 | `not_evaluated` (reason `out_of_population_scope`) | VAL-0006/VAL-0007 são BLOCKING e indecididas |

Nota de honestidade clínica (INFERENCE, a partir de Teasdale 2014): a GCS em si é usada
em adultos e crianças na prática publicada — mas os consumidores V2 desta regra (SOFA
CNS, qSOFA, NEWS2) são instrumentos validados em adultos, e nenhuma variante pediátrica
(p.ex. escala verbal pediátrica) foi evidenciada ou ratificada aqui. Até que
VAL-0006/VAL-0007 sejam decididas, o gate acima é o único comportamento seguro; uma GCS
pediátrica, se algum dia desejada, é um instrumento separadamente evidenciado.

### 1.3 Exclusões e carve-outs — SINALIZADOS PARA DECISÃO DO REVISOR

Nada abaixo é decidido por este documento:

1. **Cuidados paliativos / restrição de metas de cuidado (HAZ-0044).** Avaliar a GCS de
   um paciente com ordem de limitação terapêutica é tecnicamente correto e pode ser
   indesejado como gerador de itens de trabalho. PROPOSAL: a avaliação em si não é
   suprimida; qualquer vínculo futuro de alerta/work-item deve consultar contexto de
   metas de cuidado. O revisor decide.
2. **Bloqueio neuromuscular (BNM) contínuo.** Sob BNM ativo nenhum componente é
   observável. Tratado como NT (todos os componentes) em §3.4 — não como exclusão
   populacional. Sinalizado para confirmação do revisor (OQ-GCS-4).
3. **Trauma facial/ocular extenso, afasia, traqueostomia** — tratados como NT por
   componente (§3.3), não como exclusão.
4. **Setting.** UTI adulta apenas (IU-03); todos os demais settings INDECIDIDOS (IU-04a–f).

## 2. Fontes normativas — verificadas

Somente fontes primárias; cada uma verificada por este autor em 2026-08-15 (método de
verificação declarado por citação). O repositório legado NÃO é fonte de conteúdo clínico.

1. **SOURCE — Teasdale G, Jennett B.** "Assessment of coma and impaired consciousness: a
   practical scale." *The Lancet*. 1974;304(7872):81–84. doi:10.1016/S0140-6736(74)91639-0.
   Editora: Elsevier (The Lancet).
   URL: <https://www.thelancet.com/article/S0140-6736(74)91639-0/fulltext>.
   *Verificação:* registro do artigo na Lancet e identidade bibliográfica confirmados ao
   vivo em 2026-08-15 (acesso ao texto integral restrito pela editora; a estrutura de
   componentes e faixas foi confirmada contra as fontes 2–3 abaixo e contra o registro
   forense hasheado REV-NS-01 §2). Referência normativa para: a definição dos três
   componentes (ocular, verbal, motor) avaliados **independentemente**.
2. **SOURCE — glasgowcomascale.org** — "The Glasgow structured approach to assessment of
   the Glasgow Coma Scale". Mantido pelo Royal College of Physicians and Surgeons of
   Glasgow, com endosso de Sir Graham Teasdale (Emeritus Professor of Neurosurgery,
   University of Glasgow).
   URLs: <https://www.glasgowcomascale.org/> e <https://www.glasgowcomascale.org/faq/>.
   *Verificação:* fetch ao vivo em 2026-08-15. Confirmado verbatim na página de FAQ:
   **"Do not use number '1' to record missing component; use 'NT' (Not testable)."** e
   **"Do not report a total score when a component is Not Testable because the score
   will be low and this could be confusing to medical colleagues."** e **"Assess,
   communicate and make decisions using the remaining components."** Referência normativa
   para: o estado NT de primeira classe (§3.3), a proibição de total com componente NT
   (§3.5) e a obrigação de exibir/comunicar os componentes testados remanescentes.
3. **SOURCE — Teasdale G, Maas A, Lecky F, Manley G, Stocchetti N, Murray G.** "The
   Glasgow Coma Scale at 40 years: standing the test of time." *The Lancet Neurology*.
   2014;13(8):844–854. doi:10.1016/S1474-4422(14)70120-6.
   URL: <https://www.thelancet.com/journals/laneur/article/PIIS1474-4422(14)70120-6/abstract>
   (também <https://pubmed.ncbi.nlm.nih.gov/25030516/>).
   *Verificação:* identidade bibliográfica confirmada ao vivo em 2026-08-15. Referência
   para: a abordagem estruturada contemporânea, o relato por componentes e a vigência
   atual do instrumento.
4. **SOURCE — Sessler CN, Gosnell MS, Grap MJ, Brophy GM, O'Neal PV, Keane KA, Tesoro
   EP, Elswick RK.** "The Richmond Agitation–Sedation Scale: validity and reliability in
   adult intensive care unit patients." *Am J Respir Crit Care Med*.
   2002;166(10):1338–1344. doi:10.1164/rccm.2107138.
   URL: <https://pubmed.ncbi.nlm.nih.gov/12421743/>.
   *Verificação:* identidade bibliográfica, os 10 níveis (+4 Combative … −5 Unarousable)
   e a população (UTI adulta) confirmados ao vivo em 2026-08-15. Referência para: a
   entrada de gate RASS (§4) — **somente** como enumeração/âncora; RULE-GCS não define
   conduta de sedação.
5. **Âncora de prática (não re-verificada ao vivo por este autor) — Devlin JW et al.
   (SCCM PADIS).** *Crit Care Med*. 2018;46(9):e825–e873. doi:10.1097/CCM.0000000000003299.
   Citada exclusivamente via os registros forenses hasheados REV-NS-01 §2 e REV-NS-02 §2,
   e usada **apenas** como gatilho de vigilância de diretriz (§12) e como âncora do
   limiar de sedação profunda RASS ≤ −3; nenhum valor numérico desta especificação
   depende dela de forma exclusiva.

**Anti-proveniência:** os artefatos legados (`domain_formularios.py`, `sofa.py`,
`qsofa.py`, `desmame.yaml`, registros trilhas) são citados somente através dos registros
de revisão hasheados em `docs/05-clinical-safety/legacy-review/neuro-sedation-scores/`
(pin legado `1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79`, manifesto
`docs/archive/legacy-provenance/legacy-pin-cycle-1.md`) e somente como catálogo de
defeitos (ver `migration-notes.md`). Nenhuma constante numérica desta especificação foi
tirada de código legado.

## 3. Modelo de dados — componentes E/V/M com NT de primeira classe

### 3.1 Enumerações dos componentes (SOURCE — Teasdale & Jennett 1974; rótulos estruturados por glasgowcomascale.org)

Identificadores de máquina em EN; rótulos clínicos pt-BR são texto de exibição (validação
pt-BR conforme ADR-0029, VALIDATION REQUIRED).

| Componente | Domínio | Valores (EN, máquina) | Rótulos de exibição pt-BR (PROPOSAL) |
|---|---|---|---|
| `eye` (E) | inteiro 1–4 **ou** `NT` | 4 spontaneous; 3 to_sound; 2 to_pressure; 1 none | 4 espontânea; 3 ao som; 2 à pressão; 1 ausente |
| `verbal` (V) | inteiro 1–5 **ou** `NT` | 5 orientated; 4 confused; 3 words; 2 sounds; 1 none | 5 orientado; 4 confuso; 3 palavras; 2 sons; 1 ausente |
| `motor` (M) | inteiro 1–6 **ou** `NT` | 6 obeys_commands; 5 localising; 4 normal_flexion; 3 abnormal_flexion; 2 extension; 1 none | 6 obedece comandos; 5 localiza; 4 flexão normal; 3 flexão anormal; 2 extensão; 1 ausente |

Regra de domínio: qualquer valor fora da enumeração (p.ex. E=5, M=7, E=0, valor não
inteiro) → componente `invalid` (reason `out_of_range`) — nunca clampado, nunca
descartado silenciosamente (evaluation-status-semantics.md §3.5; defeito legado de
clamp em REV-NS-02 REJEITADO por analogia).

### 3.2 O valor "1" significa "testado e ausente" — nunca "não testado"

SOURCE (glasgowcomascale.org FAQ, verbatim em §2 fonte 2): "Do not use number '1' to
record missing component; use 'NT' (Not testable)." O valor 1 de um componente é um
**achado clínico observado** (nenhuma resposta ao estímulo aplicado). O estado "não foi
possível testar" é **NT**, um token de primeira classe, jamais representável como 1, 0,
mínimo ou qualquer número. Esta é a reversão direta do defeito legado central
(REV-NS-01 §1.2: coerção de componente não testado ao mínimo).

### 3.3 NT por componente — vocabulário governado de motivos (PROPOSAL)

Um componente registrado como `NT` DEVE carregar exatamente um motivo do vocabulário
governado abaixo (identificadores EN; extensão somente via revisão deste documento e do
registro de reason-codes de ADR-0008 — nunca ad hoc):

| Componente | `nt_reason` (EN, máquina) | Situação clínica (pt-BR) |
|---|---|---|
| `eye` | `eye_trauma_or_edema` | trauma orbitário/periorbitário ou edema que impede abertura ocular |
| `verbal` | `endotracheal_intubation` | intubação endotraqueal |
| `verbal` | `tracheostomy` | traqueostomia |
| `verbal` | `aphasia` | afasia documentada |
| `verbal` | `language_barrier` | barreira linguística documentada — **DECIDIDO (GDEC-0007, 2026-08-15, OQ-GCS-1 (a))**: invalida V sem invalidar E/M; glasgowcomascale.org trata como não testável |
| `verbal` | `deafness` | surdez documentada — **DECIDIDO (GDEC-0007, 2026-08-15, OQ-GCS-1 (a))**: idem |
| `motor` | `neuromuscular_blockade` | bloqueio neuromuscular ativo |
| `motor` | `paralysis_other` | paralisia documentada de outra causa (p.ex. lesão medular alta) |
| qualquer | `other_documented` | outro impedimento documentado em texto livre — uso deve ser monitorado (§12 M-6) |

**DECIDIDO (GDEC-0007, 2026-08-15, OQ-GCS-4 (a)):** bloqueio neuromuscular ativo torna
**todos** os componentes não observáveis, não apenas o motor — BNM ativo documentado →
os três componentes NT (reason `neuromuscular_blockade`); sob bloqueio neuromuscular
nada além de pupilas é testável.

### 3.4 Distinção NT × ausente (missing)

`NT` é um **registro positivo** ("o avaliador tentou/considerou e o componente não era
testável, por este motivo"). Um componente **ausente** (nenhuma observação na janela) é
um estado diferente: `missing` → contribui para `not_evaluated`
(reason `missing_required_input:<component>`). Os dois estados nunca se convertem um no
outro e nenhum deles é representável como número (HAZ-0005).

### 3.5 Total 3–15 — computado SOMENTE de três componentes testados

- Total = E + V + M, inteiro 3–15, computado **somente** quando os três componentes têm
  valor inteiro testado, na janela, válido, E o gate de avaliabilidade (§4) permite.
- **Qualquer componente NT → nenhum total.** SOURCE (glasgowcomascale.org FAQ): não
  relatar total com componente NT. O caso canônico: paciente intubado alerta E4, M6,
  V-NT → **nenhum total** — não GCS 11 (coerção V=1, defeito legado REV-NS-01 §4.2b),
  não GCS 15, não "10T convertido em número". Status do total: `not_evaluated`
  (reason `component_not_testable`, com o(s) componente(s) e motivo(s) enumerados).
- **Os componentes testados continuam exibidos e consumíveis** ("Assess, communicate and
  make decisions using the remaining components" — SOURCE §2 fonte 2). A exibição
  clínica pode usar a convenção "E4 V-NT(IOT) M6"; qualquer notação de modalidade
  (p.ex. "10T") é **apresentação**, nunca aritmética (REV-NS-01 §4 recomendação 1).
- Total fornecido pela fonte (LOINC 9269-2) sem componentes: ver §5.2 — não aceito para
  computação neste 0.2.0 (OQ-GCS-6).

## 4. Gate de avaliabilidade — confusão por sedação (cross-ref ADR-0028)

Todo este § é subordinado ao **ADR-0028 (sedation confounding)**, autorado
concorrentemente; em caso de divergência quando o ADR-0028 for ratificado, o ADR
prevalece e esta seção é revisada. As regras abaixo são consistentes com — e no nível de
instrumento, a origem de — RULE-SOFA-0100 §4.5 (I-8), que não é contradito.

### 4.1 RASS contemporâneo obrigatório (pareamento de frescor)

- Toda avaliação de GCS destinada a escore DEVE ser pareada com um RASS observado dentro
  de **1 h** do momento da avaliação GCS (mesma escolha de pareamento de RULE-SOFA-0100
  §3.2 — não contradita). RASS: ordinal −5..+4 (SOURCE Sessler 2002); valor fora do
  domínio → `invalid` (reason `out_of_range`) — nunca clampado (REV-NS-02 REJEITADO).
- Falha de pareamento (RASS existe mas fora da janela de 1 h) → avaliabilidade
  indeterminada pelo RASS; aplica-se §4.4 (estado de sedação desconhecido).

### 4.2 `sedation_confounded` — condições de entrada (DECIDIDO — GDEC-0007, OQ-GCS-3 (a))

A avaliação GCS é marcada `sedation_confounded` quando qualquer condição vale:

1. RASS pareado ≤ **−3** **e** exposição sedativa ativa (infusão sedativa em curso, ou
   administração sedativa dentro do intervalo farmacologicamente relevante) — o GCS
   medido reflete efeito de droga;
2. Infusão sedativa contínua ativa **sem janela de interrupção documentada**
   contemporânea à avaliação — mesmo com RASS > −3 ausente ou não pareado.

Comportamento: os componentes E/V/M observados **são registrados e exibidos** (com a
marcação), mas **nenhum total é emitido** e nenhum consumidor pode ler severidade:
status do total `not_evaluated` (reason `sedation_confounded`), com o último GCS
pré-sedação exposto na explicação (§10).

### 4.3 Coma não sedado é escorável (DECIDIDO — GDEC-0007, OQ-GCS-3 (a); alinhada a RULE-SOFA-0100 §4.5)

RASS ≤ −3 com **ausência documentada** de exposição sedativa é coma genuíno e escora
normalmente. Isto refina o gatilho mais grosseiro "RASS ≤ −3" de REV-NS-01 §4 (que, lido
sozinho, tornaria coma estrutural não sedado não escorável); o refinamento foi aceito
pela mesma decisão (e por ADR-0028 A28-1: conjunção RASS ≤ −3 **e** exposição sedativa).

### 4.4 Estado de sedação desconhecido — DECIDIDO FAIL-CLOSED (GDEC-0007, 2026-08-15, OQ-GCS-2 (b))

**DECISÃO (GDEC-0007, 2026-08-15, OQ-GCS-2 (b)):** fail-closed — política única valendo
simultaneamente para RULE-GCS, RULE-SOFA OQ-8 e ADR-0028 Q2 (uma só resposta para os
três artefatos):

- RASS pareado **≥ −2** presente → CNS/GCS **testável** (escora, sujeito às demais
  regras) — isto destrava a maioria dos casos reais.
- RASS pareado **≤ −3** com exposição sedativa **ativa OU desconhecida** →
  `sedation_confounded` → total `not_evaluated` (reason `sedation_confounded`) —
  RASS ≤ −3 sem informação de sedação é indistinguível de sedação profunda.
- Coma **documentadamente não sedado** escora (§4.3).
- RASS **ausente ou não pareado** (E/OU exposição sedativa desconhecida sem RASS
  pareado que destrave) → estado de sedação desconhecido → total `not_evaluated`
  (reason `sedation_state_unknown`) — insumo de gate ausente.

O default 0.1.0 "escora com divulgação" foi **removido** — a divergência do default foi
aceita e sinalizada pelo titular (GDEC-0007, prioridade 1: política única de sedação
fail-closed). A redação desta seção é deliberadamente consistente com RULE-SOFA-0100
§4.5 I-8.

## 5. Entradas canônicas

### 5.1 Tabela de entradas

Todos os vínculos LOINC são **candidatos** (PROPOSAL) pendentes dos value sets pinados
pelo arquiteto de terminologia. Janelas de frescor são **PROPOSAL** — ver §5.3.

| # | Entrada | LOINC candidato | Unidade canônica (UCUM) | Faixa aceitável | Janela de frescor (PROPOSAL) | Ausente | Stale | Conflito |
|---|---|---|---|---|---|---|---|---|
| 1 | Idade (demográfica) | 30525-0 | a | 18–130 na população | Constante do encontro | Regra inteira `not_evaluated` (`population_unverified`) | n/a | Identidade não resolvida → `population_unverified` |
| 2 | GCS componente ocular (E) | 9267-6 | {score} (adimensional) | inteiro 1–4 **ou** token NT+motivo (§3.3) | 12 h (expiry 24 h) | Total `not_evaluated` (`missing_required_input:eye`) | Total `stale`/expirado | Valores simultâneos não reconciliados → `invalid` |
| 3 | GCS componente verbal (V) | 9270-0 | {score} | inteiro 1–5 **ou** NT+motivo | 12 h (expiry 24 h) | Total `not_evaluated` (`missing_required_input:verbal`) | idem | idem |
| 4 | GCS componente motor (M) | 9268-4 | {score} | inteiro 1–6 **ou** NT+motivo | 12 h (expiry 24 h) | Total `not_evaluated` (`missing_required_input:motor`) | idem | idem |
| 5 | GCS total fornecido pela fonte | 9269-2 | {score} | inteiro 3–15 | 12 h (expiry 24 h) | (não requerido) | n/a | Divergência soma×total → `invalid` (`component_total_mismatch`) |
| 6 | RASS (entrada de gate apenas) | observação: nenhum código pinado — VALIDATION REQUIRED (consistente com RULE-SOFA-0100 §3.1 linha 12; a answer list LOINC LL6536-8 existe — verificada 2026-08-15 — mas o pin é do arquiteto de terminologia) | ordinal (adimensional) | inteiro −5..+4 | pareada: dentro de 1 h da avaliação GCS | Estado de sedação desconhecido → §4.4 | Falha de pareamento → §4.4 | `invalid` |
| 7 | Estado de infusão sedativa | contrato de administração de medicamentos — nenhum vínculo pinado, VALIDATION REQUIRED | conceito codificado | {active_infusion, interrupted_window_documented, none_active, unknown} | ativa/documentada no instante da avaliação GCS | `unknown` → §4.4 | n/a | Registros contraditórios → `invalid` |

Todos os escores são adimensionais (UCUM `{score}` / `1`); não há conversão de unidade a
fazer — a disciplina de unidade (HAZ-0032) reduz-se aqui a rejeitar qualquer anotação de
unidade dimensional inesperada como `invalid` (reason `unmappable_unit`).

### 5.2 Total-apenas da fonte — não aceito para computação (PROPOSAL — OQ-GCS-6)

Um GCS total fornecido pela fonte (linha 5) **sem** os três componentes não é aceito
como entrada de computação em 0.2.0: um total nu não permite verificar tratamento de NT
(o defeito legado exato — REV-NS-01 §1.1: armazenamento apenas do total) nem a soma.
Comportamentos: total + três componentes testados presentes e soma coincide →
cross-check ok (o total computado é o emitido); soma diverge → `invalid`
(`component_total_mismatch`); total sem componentes → `not_evaluated`
(reason `missing_required_input:components`). Consequência declarada honestamente: fontes
que só produzem o total (como o V1 legado) são inutilizáveis por esta regra até
fornecerem componentes. **DECISÃO (GDEC-0007, 2026-08-15, OQ-GCS-6 (a)):** manter a
rejeição — exibição com proveniência apenas; total sem componentes não permite NT nem
auditoria (é o modelo legado que se está rejeitando).

### 5.3 Janelas de frescor — quitação proposta de VAL-0023 para a GCS

VAL-0023 pergunta: que janela de frescor se aplica a cada entrada clínica, e quais
componentes ausentes invalidam versus degradam um escore? Para RULE-GCS esta
especificação propõe (ratificação por `AUTH-CLINSAFETY` encerra VAL-0023 para esta regra):

| Entrada | Janela | Expiry (→ `not_evaluated`, reason `expired_input`) | Racional (PROPOSAL) |
|---|---|---|---|
| Componentes E/V/M | 12 h | 24 h | Cadência de avaliação neurológica por turno; **idêntica** à janela GCS 12 h/24 h já proposta em RULE-SOFA-0100 §3.2 — deliberadamente não contradita. |
| RASS (gate) | pareada: dentro de 1 h da GCS | n/a (restrição de pareamento) | Um confundidor de sedação deve ser contemporâneo à avaliação que confunde — mesma escolha de RULE-SOFA-0100 §3.2. |
| Estado de infusão sedativa | contemporâneo ao instante da avaliação GCS | n/a | Estado de administração, não medida pontual. |
| Idade | constante do encontro | n/a | Gate populacional. |

Os três componentes devem além disso ser **contemporâneos entre si**: os três
observados dentro de uma janela mútua de **30 min** (uma avaliação GCS é um ato único de
exame; componentes de exames diferentes somados produzem um total que nenhum avaliador
observou). Fora disso → `not_evaluated` (reason `component_set_not_contemporaneous`).
**DECISÃO (GDEC-0007, 2026-08-15, OQ-GCS-5 (a)):** ratificado — janelas 12 h/24 h,
pareamento RASS 1 h e contemporaneidade mútua 30 min (quita VAL-0023 para a GCS).

**Stale vs expirado (evaluation-status-semantics.md §3.4):** componente fora da janela e
dentro do expiry → avaliação `stale` — último valor e idade exibidos, **nenhum total
legível**. Além do expiry → `not_evaluated` (`expired_input`). Staleness computada do
tempo clínico da fonte contra o relógio de avaliação no momento da leitura, nunca do
tempo de recepção.

## 6. Mapeamento de status de avaliação

Vocabulário de cinco estados de `docs/05-clinical-safety/evaluation-status-semantics.md`
(`valid | partial | not_evaluated | stale | invalid`). `partial` é inutilizável nesta
regra: nenhuma política parcial aprovada existe — e para a GCS uma "parcial" somada seria
exatamente o total proibido por §3.5, portanto esta especificação **não propõe** política
parcial alguma para o total (os componentes testados já são consumíveis individualmente
sem soma).

**Nota de vocabulário (sinalização a ADR-0008 — nada inventado silenciosamente):**
`component_not_testable` (com sub-motivos NT de §3.3) e `sedation_confounded` são
propostos como **reason codes governados** alimentando `not_evaluated` no nível do
total — NÃO como novos estados de topo. O registro de reason codes pertence a ADR-0008;
esta especificação sinaliza a necessidade das entradas:
`component_not_testable`, `sedation_confounded`, `sedation_state_unknown` (**agora
necessário — OQ-GCS-2 decidiu fail-closed, GDEC-0007**),
`component_set_not_contemporaneous`, `component_total_mismatch`.

### 6.1 Nível do total

| Condição | Status do total |
|---|---|
| Três componentes testados (inteiros), na janela, contemporâneos entre si, gate populacional ok, gate sedativo permite | `valid` — total 3–15 legível |
| Qualquer componente NT | `not_evaluated` (reason `component_not_testable`; componentes e `nt_reason`s enumerados; componentes testados exibidos) |
| Qualquer componente ausente | `not_evaluated` (reason `missing_required_input:<component>`) |
| Gate sedativo: confundida (§4.2) | `not_evaluated` (reason `sedation_confounded`; componentes exibidos com marcação; último GCS pré-sedação exposto) |
| Gate sedativo: estado de sedação desconhecido (§4.4 — fail-closed, GDEC-0007 OQ-GCS-2 (b)) | `not_evaluated` (reason `sedation_state_unknown`) |
| Componente presente somente fora da janela, dentro do expiry | `stale` (valor + idade exibidos; total não legível) |
| Componente além do expiry | `not_evaluated` (reason `expired_input:<component>`) |
| Valor fora da enumeração, unidade inmapeável, conflito simultâneo não reconciliado, soma×total divergente | `invalid` (reason específico) — o valor ofensor nunca é descartado silenciosamente |
| Idade desconhecida / <18 | `not_evaluated` (`population_unverified` / `out_of_population_scope`) |
| Qualquer condição não coberta | `not_evaluated` (reason `unspecified_condition`) — sinal operacional; não existe caminho "desconhecido → assumir bem" |

Precedência quando várias condições valem: `invalid` > `not_evaluated` > `stale` >
`valid` (evaluation-status-semantics.md §3.6).

### 6.2 Proibição de coerção — controle primário de HAZ-0005

Ausência, NT, staleness, invalidade e confusão sedativa são representáveis **somente**
como status + reason. Nenhum valor numérico, nenhum "último conhecido", nenhum mínimo de
componente (a coerção-a-1 legada), nenhum zero (o missing→0 dos consumidores legados),
nenhum status "normal" (o padrão legado de deterioração) pode substituí-los. A sonda de
entrada-ausente SAF-0002 aplica-se a toda superfície produtora de valor desta regra; os
vetores CRV-GCS-0207/0208/0209/0212 são os vetores negativos obrigatórios.

## 7. Contrato de consumidor downstream

O que qualquer consumidor PODE consumir: (a) valores por componente, incluindo NT com
motivo; (b) o estado de avaliabilidade (gate sedativo, testabilidade); (c) o total **com
seu status** — severidade legível somente quando `valid`. O que NENHUM consumidor pode
consumir ou fabricar: um total coagido/sintetizado de menos de três componentes testados;
NT ou ausência tratados como qualquer número; `sedation_confounded` tratado como escore.

### 7.1 SOFA CNS (RULE-SOFA-0100 §4.5 — referenciado, não editado)

Consome o total RULE-GCS somente com status `valid`. NT em qualquer componente → SOFA
CNS `not_evaluated` (reason `component_not_testable`); confundida → CNS `not_evaluated`
(`sedation_confounded`) — exatamente o comportamento já especificado em RULE-SOFA-0100
§4.5, que esta regra alimenta e não contradiz. Nunca CNS 0 por ausência (missing→0
legado REJEITADO), nunca banda a partir de componente isolado.

### 7.2 qSOFA — mentação (regra futura; nenhum rule-release qSOFA existe)

A operacionalização Sepsis-3 "GCS < 15" requer um total `valid`. NT/ausente/confundida →
critério de mentação não avaliado — **nem** "<15" (falso alarme), **nem** "=15" (falsa
tranquilização). Registrado aqui como contrato; a regra qSOFA, quando autorada, deve
citá-lo.

### 7.3 NEWS2 — consciência ACVPU (RULE-NEWS2-0100 — referenciado, não editado)

RULE-NEWS2 0.2.0 aceita somente token ACVPU explícito e **não realiza mapeamento
automático GCS→ACVPU** (RULE-NEWS2 §2.1 nota, questão Q4 daquele documento). RULE-GCS
0.2.0 correspondentemente **não emite** derivação ACVPU. A questão do mapeamento
GCS→ACVPU permanece aberta nos dois documentos e pertence ao revisor + ADR-0028
(o confundidor sedativo é comum às duas superfícies). Nenhum consumidor pode inferir
"A" (alerta) de uma GCS ausente/NT/confundida.

## 8. Perigos vinculados e controles

| Perigo | Relevância para RULE-GCS | Controles nesta especificação | SAF vinculados |
|---|---|---|---|
| **HAZ-0005** (primário) | O defeito legado ocorreu nesta família: componente não testado coagido a 1 (forms), GCS ausente → 0 nos consumidores, ausência → status "normal" | §3.2/§3.4/§6.2 (NT e ausência irrepresentáveis como número); §3.5 (nenhum total com NT); vetores CRV-GCS-0205..0209, CRV-GCS-0212 | SAF-0001, SAF-0002, SAF-0003, SAF-0006, SAF-0019, SAF-0030 |
| **HAZ-0006** | Avaliação neurológica antiga lida como atual | §5.3 janelas + expiry; `stale` nunca renderiza total | SAF-0004 (via evaluation-status-semantics) |
| **HAZ-0036** | Instrumento/consumidores adultos avaliados fora da população aprovada | §1.2 gate etário aplicável; idade desconhecida nunca assumida adulta; CRV-GCS-0215/0216 | SAF-0035, SAF-0027, SAF-0020, SAF-0023 |
| **HAZ-0044** | Escalonamento contrário a metas de cuidado documentadas | §1.3.1 carve-out sinalizado; vínculo futuro de work-item deve consultar contexto de metas | SAF-0041, SAF-0035, SAF-0022, SAF-0017 |
| HAZ-0043 | Admissão sem fontes populadas → `not_evaluated` permanente lido como silêncio | §0 classificação NOT ACTIONABLE; §12 M-1 | SAF-0040, SAF-0033 |

## 9. Lógica declarativa legível por máquina (YAML inline; dados, não código)

Precedência: onde este bloco e o texto divergirem, **o texto governa** e a divergência é
defeito a corrigir antes de qualquer assinatura.

```yaml
rule: RULE-GCS
version: 0.2.0
status: proposal_not_actionable
population:
  age_min_years: 18
  unknown_age: not_evaluated(population_unverified)
  under_age: not_evaluated(out_of_population_scope)
components:
  eye:    {range: [1, 4], nt_reasons: [eye_trauma_or_edema, other_documented]}
  verbal: {range: [1, 5], nt_reasons: [endotracheal_intubation, tracheostomy, aphasia, language_barrier, deafness, other_documented]}  # language_barrier/deafness DECIDIDOS OQ-GCS-1 (a), GDEC-0007
  motor:  {range: [1, 6], nt_reasons: [neuromuscular_blockade, paralysis_other, other_documented]}
value_semantics:
  one_means: tested_no_response      # never "untested"
  untested: NT                       # first-class token, never numeric
  out_of_enumeration: invalid(out_of_range)
freshness:
  component_window_h: 12
  component_expiry_h: 24
  component_mutual_contemporaneity_min: 30
  rass_pairing_window_h: 1
assessability_gate:                  # subordinate to ADR-0028 (decisions aligned: A28-1/A28-2)
  testable_when: rass_paired >= -2   # destrava a maioria dos casos reais (GDEC-0007)
  sedation_confounded_when:
    - rass_paired <= -3 AND (sedative_exposure_active OR sedative_exposure_unknown)
    - sedative_infusion_active AND no_documented_interruption_window
  unsedated_coma: scoreable          # RASS <= -3 with documented absence of sedatives
  sedation_state_unknown: not_evaluated(sedation_state_unknown)   # FAIL-CLOSED — DECIDIDO OQ-GCS-2 (b), GDEC-0007, política conjunta com RULE-SOFA OQ-8 e ADR-0028 Q2; o default score_with_disclosure foi removido
total:
  formula: eye + verbal + motor
  range: [3, 15]
  computed_only_when:
    - all_three_components_tested_integers
    - components_in_window_and_contemporaneous
    - population_gate_passed
    - assessability_gate_permits
  any_component_nt: not_evaluated(component_not_testable)   # components still displayed
  any_component_missing: not_evaluated(missing_required_input)
  sedation_confounded: not_evaluated(sedation_confounded)
  source_total_without_components: not_evaluated(missing_required_input:components)  # OQ-GCS-6
  sum_mismatch_with_source_total: invalid(component_total_mismatch)
prohibitions:
  - no_minimum_fill                  # legacy coercion-to-1 REJECTED
  - no_zero_coercion                 # legacy missing->0 REJECTED
  - no_status_normal_on_missing      # legacy deterioration pattern REJECTED
  - no_partial_total                 # no partial policy exists or is proposed
  - no_automatic_gcs_to_acvpu_mapping
  - no_severity_banding
fallback: not_evaluated(unspecified_condition)
```

## 10. Texto de explicação (exibição ao clínico)

Redação é PROPOSAL; a formulação pt-BR requer validação com clínicos pt-BR
(evaluation-status-semantics.md §6; ADR-0029) — ato de comunicação clínica, não
exercício de tradução. Placeholders em `{}`.

**pt-BR — total válido:**
> Escala de Coma de Glasgow {total} de 15 (E{e} V{v} M{m}) — regra RULE-GCS v{version}.
> Avaliação em {t}; RASS pareado {rass} em {t_rass}; estado de sedação: {sem sedativo
> ativo | janela de interrupção documentada}. Os três componentes foram testados. A GCS
> descreve o nível de consciência observado; informação de apoio à decisão da equipe
> assistente — não é uma diretriz e não determina conduta.

**pt-BR — componente não testável:**
> Escala de Coma de Glasgow: **total não calculado** — componente {componente} não
> testável ({motivo, ex. intubação endotraqueal}). Componentes testados: {ex. ocular 4,
> motor 6}. Nenhum total é exibido porque um total calculado com componente não testável
> seria artificialmente baixo e poderia confundir a equipe (orientação
> glasgowcomascale.org). Avalie e comunique pelos componentes testados. Informação de
> apoio apenas.

**pt-BR — confundida por sedação:**
> Escala de Coma de Glasgow: **não avaliada — confundida por sedação** (RASS {rass};
> {infusão sedativa ativa sem janela de interrupção documentada}). Componentes
> observados sob sedação: E{e} V{v} M{m} — refletem efeito de droga, não o estado
> neurológico basal. Última GCS pré-sedação: {valor e momento, se existente}. Informação
> de apoio apenas.

**EN — total valid:**
> Glasgow Coma Scale {total} of 15 (E{e} V{v} M{m}) — rule RULE-GCS v{version}.
> Assessed at {t}; paired RASS {rass} at {t_rass}; sedation state: {no active sedative |
> documented interruption window}. All three components were tested. The GCS describes
> the observed level of consciousness; advisory information to support the care team's
> judgement — not a directive.

**EN — component not testable:**
> Glasgow Coma Scale: **no total calculated** — {component} not testable ({reason, e.g.
> endotracheal intubation}). Tested components: {e.g. eye 4, motor 6}. No total is shown
> because a total computed with a not-testable component would be artificially low and
> could mislead colleagues (glasgowcomascale.org guidance). Assess and communicate using
> the tested components. Advisory only.

**EN — sedation-confounded:**
> Glasgow Coma Scale: **not evaluated — sedation-confounded** (RASS {rass}; {active
> sedative infusion without a documented interruption window}). Components observed
> under sedation: E{e} V{v} M{m} — these reflect drug effect, not baseline neurological
> state. Last pre-sedation GCS: {value and time, if any}. Advisory only.

Obrigações mínimas de conteúdo (toda exibição): componentes com horários de fonte;
divulgação de NT/ausência com motivo; versão da regra; idade da entrada contribuinte
mais antiga; RASS pareado e estado de sedação; enquadramento apenas-apoio. Um número
agregado nu nunca é exibição aceitável.

## 11. Cobertura contra o prompt orquestrador §6.4 (lista de campos do pacote de release)

| Campo §6.4 | Onde | Status 0.2.0 |
|---|---|---|
| Identificador da regra + versão semântica | §0 | Presente (precursor 0.2.0) |
| Uso pretendido/população/exclusões | §1 | Proposto; carve-outs sinalizados ao revisor |
| Evidência externa + data do snapshot | §2 | Verificada 2026-08-15 |
| Clinical owner + aprovador independente | §0 | **UNASSIGNED — VALIDATION REQUIRED (bloqueante para qualquer release)** |
| Lógica legível por máquina + content hash | §9 | Bloco inline presente; hash de conteúdo somente na materialização de um bundle (nada assinável em 0.2.0) |
| Versões de terminologia/value-set | §5.1 | **Somente códigos candidatos; nenhum pin — VALIDATION REQUIRED** |
| Política de completude e frescor | §5.3, §6 | Proposta (quita VAL-0023 para a GCS mediante ratificação) |
| Vetores de referência, propriedades, casos-limite, replay corpus | `reference-vectors.md` | 18 vetores ativos + 2 aposentados/superseded (GDEC-0007) — clinicamente revisados; evidência de execução pendente (DRAFT para execução); replay corpus inexistente — requer fontes populadas |
| Vínculos perigo/controle | §8 | Presente |
| Texto de explicação + critérios de aceitação UX | §10 | Texto proposto; critérios UX VALIDATION REQUIRED (validação pt-BR, ADR-0029) |
| Status de validação retrospectiva/prospectiva | — | **Nenhum. Nenhuma fonte populada existe; nenhuma validação de qualquer tipo ocorreu.** |
| Monitoramento, rollback, kill switch, aposentadoria/cadência de revisão | §12 | Proposto |

## 12. Monitoramento, rollback, kill switch, cadência de revisão

Tudo PROPOSAL; números requerem ratificação. Aplicam-se a um futuro release assinado;
especificados agora porque §6.4 os exige no pacote.

**Limiares de monitoramento:**
- **M-1 (HAZ-0043):** fração de avaliações `not_evaluated` por motivo, por unidade por
  dia; 100% por 14 dias consecutivos → revisão obrigatória da admissão da regra.
- **M-2 (canário HAZ-0005):** qualquer emissão de total numérico com menos de três
  componentes testados `valid`, ou qualquer superfície exibindo número/severidade sob
  NT/ausência/confusão — defeito severidade-1, gatilho automático de kill switch. Taxa
  alvo: zero; uma única ocorrência bloqueia release.
- **M-3:** fração de avaliações `sedation_confounded` por unidade — vigilância de
  sobre/sub-disparo do gate (calibração do ADR-0028).
- **M-4 (HAZ-0036):** avaliações bloqueadas `population_unverified`; qualquer avaliação
  com idade verificada <18 → defeito severidade-1.
- **M-5:** replay dos vetores de referência a cada deploy e mudança terminológica;
  qualquer divergência bloqueia o deploy.
- **M-6:** fração de NT com motivo `other_documented` >10% em 30 dias → revisão do
  vocabulário de motivos (§3.3) via ADR-0008.

**Critérios de rollback:** um único evento severidade-1 M-2/M-4; divergência de replay;
divergência entre lógica em execução e o hash assinado; supersessão de diretriz.

**Kill switch:** desabilita a avaliação RULE-GCS na plataforma; todo consumidor então
exibe `not_evaluated` (reason `rule_unavailable`) — nunca em branco, nunca silêncio,
nunca um último valor congelado.

**Cadência de revisão / aposentadoria:**
- Re-revisão programada a cada 12 meses da ratificação.
- Re-revisão dirigida por evento: mudança de orientação em glasgowcomascale.org
  (abordagem estruturada/NT); atualização da diretriz SCCM PADIS (sedação/avaliação
  neurológica); publicação sucessora de Teasdale 2014; mudanças de pin LOINC/UCUM;
  mudanças no contrato de fonte AMH afetando qualquer entrada §5.1; mudança de status
  dos perigos vinculados; ratificação de ADR-0008 ou ADR-0028 (ambos supersedem partes
  de §4/§6 por desenho).
- A revisão clínica nomeada ocorreu em 2026-08-15 (GDEC-0007); este precursor 0.2.0
  caduca se não avançar ao mecanismo de aprovação formal (bundle assinado, ADR-0007)
  até 2027-08-15; precursor caducado não pode ser revivido sem re-verificação de toda
  citação e pin.

## 13. Questões abertas para o revisor nomeado (rodaquino-OMNI) — TODAS DECIDIDAS (GDEC-0007, 2026-08-15)

As 10 questões foram decididas por escrito pelo revisor nomeado em 2026-08-15
(`decision-register.md` GDEC-0007; registro por linha em
`../../cycle-1-review-decision-sheet.md` §3, linhas G-1..G-10). O texto original das
questões é preservado; cada decisão é transcrita abaixo pelo escriba — a decisão é do
humano nomeado.

1. **OQ-GCS-1:** Confirmar o modelo NT de primeira classe e o vocabulário governado de
   motivos (§3.3) — os motivos enumerados bastam? Falta algum (p.ex. barreira de
   idioma/surdez no componente verbal)?
   **DECISÃO (GDEC-0007, 2026-08-15):** (a) — **acrescentar "barreira linguística" e
   "surdez"** ao NT verbal; manter os demais. Ambos invalidam V sem invalidar E/M;
   glasgowcomascale.org trata como não testável. Implementado em §3.3/§9.
2. **OQ-GCS-2:** Estado de sedação desconhecido (sem RASS pareado e/ou sem informação de
   exposição sedativa) — manter o default "escora com divulgação" (idêntico a
   RULE-SOFA-0100 OQ-8) ou bloquear (`not_evaluated`, `sedation_state_unknown`)? Decisão
   do ADR-0028; deve valer simultaneamente para RULE-GCS e RULE-SOFA.
   **DECISÃO (GDEC-0007, 2026-08-15):** (b) — **fail-closed**
   (`sedation_state_unknown`), valendo conjuntamente para RULE-SOFA OQ-8 e ADR-0028 Q2
   (resposta única para os três artefatos); RASS presente ≥ −2 destrava a maioria dos
   casos reais. Implementado em §4.4 (default "escora com divulgação" removido).
3. **OQ-GCS-3:** Confirmar as condições de `sedation_confounded` (§4.2): RASS ≤ −3 com
   exposição sedativa ativa, OU infusão sedativa sem janela de interrupção documentada;
   e o refinamento "coma não sedado escora" (§4.3).
   **DECISÃO (GDEC-0007, 2026-08-15):** (a) — confirmado; RASS ≤ −3 + exposição
   sedativa = confundido; coma estrutural sem sedação é achado real e deve pontuar.
4. **OQ-GCS-4:** BNM ativo → os três componentes NT (não apenas motor) — confirmar.
   **DECISÃO (GDEC-0007, 2026-08-15):** (a) — confirmado; sob bloqueio neuromuscular
   nada além de pupilas é testável. Implementado em §3.3.
5. **OQ-GCS-5:** Janelas de frescor: componentes 12 h/24 h (alinhadas a RULE-SOFA);
   pareamento RASS 1 h; contemporaneidade mútua dos componentes 30 min — ratificar
   (quitação de VAL-0023 para a GCS).
   **DECISÃO (GDEC-0007, 2026-08-15):** (a) — ratificado (quita VAL-0023 p/ GCS);
   alinhado ao RULE-SOFA; componentes de momentos distintos não somam.
6. **OQ-GCS-6:** Total-apenas da fonte não aceito para computação (§5.2) — manter, ou
   aceitar com divulgação? Consequência: fontes só-total (padrão legado) ficam
   inutilizáveis até fornecerem componentes.
   **DECISÃO (GDEC-0007, 2026-08-15):** (a) — **manter a rejeição** (exibição com
   proveniência apenas); total sem componentes não permite NT nem auditoria — é o
   modelo legado que se está rejeitando.
7. **OQ-GCS-7:** Exibição dos componentes testados quando não há total — confirmar a
   convenção "E4 V-NT(IOT) M6" e que notações tipo "10T" são apresentação, nunca
   aritmética.
   **DECISÃO (GDEC-0007, 2026-08-15):** (a) — confirmado; guidance verbatim do emissor.
8. **OQ-GCS-8:** Gate populacional ≥18 e comportamento `population_unverified` —
   confirmar (bloqueado nas decisões VAL-0006/VAL-0007/IU-06; ADR-0027).
   **DECISÃO (GDEC-0007, 2026-08-15):** (a) — confirmado; consistente com ADR-0027.
9. **OQ-GCS-9:** Confirmar exclusão de banda de severidade ("leve/moderado/grave") do
   escopo 0.2.0; qualquer banda futura exige fonte nomeada e ratificação própria.
   **DECISÃO (GDEC-0007, 2026-08-15):** (a) — confirmado; banda exigiria fonte nomeada
   própria.
10. **OQ-GCS-10:** Mapeamento GCS→ACVPU para NEWS2 — confirmar ausência em 0.2.0 (dos
    dois lados; RULE-NEWS2 Q4) e a quem pertence a decisão futura.
    **DECISÃO (GDEC-0007, 2026-08-15):** (a) — confirmado; a decisão futura pertence ao
    ADR-0028 + revisão conjunta das duas regras (espelha RULE-NEWS2 N-4).

*Autorado pelo GCS-instrument V2 clinical-content specification author (ciclo 1,
Tarefa 2). O autor não aprova nada; todos os valores são definições publicadas ou
propostas sintéticas; sem PHI, sem dados reais de paciente.*
