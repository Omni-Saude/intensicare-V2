---
id: RULE-GCS-CRV-0100
title: RULE-GCS v0.1.0 — vetores de referência clínica (conjunto DRAFT, precursor de pacote de release)
label: PROPOSAL
status: PROPOSAL — pending independent clinical review (author ≠ approver applies to vectors)
statement: >
  Dezoito vetores de referência clínica para RULE-GCS v0.1.0 conforme o
  clinical-reference-vector-standard, cobrindo totais normais na faixa (limites 3 e 15),
  NT por componente (com o caso canônico verbal-intubado E4 M6 V-NT → nenhum total, não
  GCS 11 — a reversão do defeito legado), todos-NT, componente ausente, gate RASS
  (−4 confundida; 0 testável; RASS ausente — comportamento sinalizado ao revisor; coma
  não sedado escorável), pareamento RASS fora de janela, componentes stale, idade
  desconhecida/<18, e enumerações inválidas (E=5, M=7). Todo vetor é DRAFT: autorado
  pelo mesmo agente que autorou a especificação; independência de autoria NÃO
  satisfeita; nenhum vetor pode ser citado como evidência de release.
provenance:
  source_repo: intensicare-V2
  path_or_url: docs/05-clinical-safety/rule-releases/gcs/reference-vectors.md
  commit_sha_or_version: uncommitted (working tree on cycle-1/clinical-content; HEAD ddac9bc)
  section_or_lines: whole document
  date_collected: 2026-08-15
  collector: GCS-instrument V2 clinical-content specification author (cycle 1, Task 2); accountable reviewer rodaquino-OMNI
  transformation: >
    Resultados esperados derivados de specification.md §3-§6 (re-derivada de Teasdale &
    Jennett 1974, glasgowcomascale.org e Sessler 2002); seleção de cenários pela
    taxonomia boundary/edge do CRV standard e pelo catálogo de defeitos legados
    (REV-NS-01 §1-§5, REV-NS-02 §1/§4). Todos os valores de entrada são sintéticos.
  confidence: medium
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  requirements: [SAF-0001, SAF-0002, SAF-0006, SAF-0019, SAF-0030, SAF-0035]
  hazards: [HAZ-0005, HAZ-0006, HAZ-0036]
  adrs: [ADR-0008 (pending), ADR-0028 (pending, sedation confounding)]
  tests: []
  pr: null
supersedes: null
superseded_by: null
---

# RULE-GCS v0.1.0 — vetores de referência clínica (DRAFT)

**PROPOSAL — pending independent clinical review (author ≠ approver applies to
vectors).** Todos os 18 vetores são `status: DRAFT` conforme
`docs/12-quality-validation-and-testing/clinical-reference-vector-standard.md` (o CRV
standard). Todos os dados de paciente são sintéticos. Nenhum vetor pode ser citado como
evidência de release clínico: per CRV standard §8, `authorship.independence_confirmed:
false` para todo vetor aqui, porque o autor dos vetores é o mesmo agente autor da
especificação. Um autor/revisor independente futuro deve re-derivar ou confirmar
independentemente cada resultado esperado antes de qualquer vetor alcançar `RATIFIED`.

## 0. Convenções deste arquivo

1. **IDs de vetor.** `CRV-0201`..`CRV-0218`. O catálogo CRV ainda não existe e o próprio
   prefixo `CRV` é proposta não ratificada; este arquivo reivindica provisoriamente o
   bloco **CRV-0200–0299 para RULE-GCS**. OBSERVED: os conjuntos concorrentes de
   RULE-SOFA (CRV-0101–0199) e RULE-NEWS2 (CRV-0101–0189) reivindicaram blocos
   **colidentes** entre si; o bloco 02xx foi escolhido para não ampliar a colisão, que é
   sinalizada ao steward de rastreabilidade para renumeração no registro do catálogo.
2. **Compactação (desvio documentado).** Como em RULE-SOFA-CRV-0100 §0: bloco comum (§1)
   + painel de referência (§2); cada vetor declara identidade, cenário, deltas e o
   resultado esperado completo. Ausência é sempre explícita (`present: false`) — nunca
   chave omitida. Na ratificação do catálogo, cada vetor é materializado em arquivo de
   esquema completo; a materialização é mecânica e não adiciona conteúdo clínico.
3. **Instante de avaliação** `T = 2026-08-15T12:00:00-03:00`. Janelas conforme
   `specification.md` §5.3 (componentes 12 h/24 h; pareamento RASS 1 h;
   contemporaneidade mútua 30 min).
4. **`fires`.** RULE-GCS 0.1.0 não define condição de alerta/disparo; todo vetor afirma
   `fires: false` e a expectativa de escore/status carrega o conteúdo clínico.
   `no_fire_reason: criteria_not_met` aparece somente com
   `expected_evaluation_status: valid` (CRV standard §6).

## 1. Bloco comum (aplica-se verbatim a todo vetor abaixo)

```yaml
pathway_id: "RULE-GCS (instrument; candidate-inventory binding pending)"
rule_version:
  bundle: "RULE-GCS"
  version: "0.1.0"
  content_hash: "unsigned-precursor — logic block inline in specification.md §9"
  status: draft
context:
  tenant_id: "synthetic-tenant-0001"
  encounter_id: "synthetic-encounter-0002"
  facility_id: "synthetic-facility-0001"
  care_unit_id: "synthetic-icu-0001"
  bed_id: "synthetic-bed-0002"
  population: adult              # exceto onde um vetor sobrescreve idade
  data_provenance: synthetic-only
source_data_quality: valid       # dimensão AMH; deliberadamente 'valid' em todos, para que
                                 # todo status de AVALIAÇÃO não-valid seja produzido pela
                                 # álgebra do V2, nunca herdado da qualidade de fonte
explanation_requirements:
  must_show_inputs_used: true
  must_show_missing_inputs: true
  must_show_rule_version: true
  must_show_source_time_and_freshness: true
clinical_expectation_provenance:
  owner: UNASSIGNED — VALIDATION REQUIRED
  evidence_basis: "Teasdale & Jennett 1974 doi:10.1016/S0140-6736(74)91639-0; glasgowcomascale.org FAQ (NT guidance, fetched 2026-08-15); Sessler 2002 doi:10.1164/rccm.2107138; specification.md §3-§6"
  reviewed_independently_of_rule_author: false
  review_status: UNREVIEWED
  review_date: null
  reviewer: UNASSIGNED — VALIDATION REQUIRED
authorship:
  vector_author: "GCS-instrument V2 clinical-content specification author (cycle 1, Task 2 agent)"
  rule_implementer: "same agent (spec author) — INDEPENDENCE NOT SATISFIED"
  independence_confirmed: false
status: DRAFT
supersedes: null
superseded_by: null
last_updated: "2026-08-15"
```

## 2. Painel de referência `PANEL-GCS-NORMAL`

Todos os horários observados com offset `-03:00`, precisão `minute`, `present: true`;
`received` dentro de 5 minutos do observado (sintético). Os três componentes são
contemporâneos (mesmo ato de exame). `deltas` de um vetor substituem, removem
(`present: false`) ou adicionam entradas.

```yaml
age:              {value: 58, unit: "a"}                                  # demográfica, constante do encontro
gcs_eye:          {value: 4, token: null, observed: "2026-08-15T09:00"}   # LOINC candidato 9267-6
gcs_verbal:       {value: 5, token: null, observed: "2026-08-15T09:02"}   # LOINC candidato 9270-0
gcs_motor:        {value: 6, token: null, observed: "2026-08-15T09:03"}   # LOINC candidato 9268-4
rass:             {value: 0,              observed: "2026-08-15T09:00"}   # pareado (dentro de 1 h)
sedative_infusion: {value: none_active}                                   # ausência documentada
```

Esperado sob `PANEL-GCS-NORMAL` sem modificação: total 15, status `valid`.

## 3. Vetores

### 3.1 Totais normais na faixa, incluindo limites 3 e 15 (3)

```yaml
- vector_id: CRV-0201
  title: "E4 V5 M6 — total 15 (limite superior), valid"
  scenario_class: boundary
  boundary_edge_class: [threshold-exact-match]
  deltas: {}   # PANEL-GCS-NORMAL como está
  expected:
    components: {eye: 4, verbal: 5, motor: 6}
    total: 15
    evaluation_status: valid
    fires: false
    no_fire_reason: criteria_not_met

- vector_id: CRV-0202
  title: "E3 V3 M4 — total 10 (meio da faixa), valid"
  scenario_class: typical
  boundary_edge_class: []
  deltas:
    gcs_eye:    {value: 3}
    gcs_verbal: {value: 3}
    gcs_motor:  {value: 4}
    rass:       {value: -1}          # sonolento, sem sedativo ativo — testável
  expected:
    components: {eye: 3, verbal: 3, motor: 4}
    total: 10
    evaluation_status: valid
    fires: false
    no_fire_reason: criteria_not_met

- vector_id: CRV-0203
  title: "E1 V1 M1 — total 3 (limite inferior), coma não sedado, valid"
  scenario_class: boundary
  boundary_edge_class: [threshold-exact-match]
  deltas:
    gcs_eye:    {value: 1}
    gcs_verbal: {value: 1}
    gcs_motor:  {value: 1}
    rass:       {value: -5}
    sedative_infusion: {value: none_active}   # ausência documentada — coma genuíno (spec §4.3)
  expected:
    components: {eye: 1, verbal: 1, motor: 1}
    total: 3                          # 1 = testado sem resposta, nunca "não testado" (spec §3.2)
    evaluation_status: valid
    fires: false
    no_fire_reason: criteria_not_met
```

### 3.2 NT por componente e todos-NT (4)

```yaml
- vector_id: CRV-0204
  title: "Ocular NT (trauma/edema orbitário) — E-NT V5 M6 → nenhum total; componentes testados exibidos"
  scenario_class: edge
  boundary_edge_class: [single-input-missing]   # tag mais próxima da taxonomia; NT ≠ missing é afirmado no detalhe
  deltas:
    gcs_eye: {value: null, token: NT, nt_reason: eye_trauma_or_edema}
  expected:
    components: {eye: "NT(eye_trauma_or_edema)", verbal: 5, motor: 6}
    total: null                       # nunca 12 (soma parcial), nunca 13 (coerção E=1)
    evaluation_status: not_evaluated
    reason: component_not_testable
    fires: false
    no_fire_reason: insufficient_data

- vector_id: CRV-0205
  title: "CANÔNICO — intubado alerta: E4 M6 V-NT(intubação) → NENHUM total, NÃO GCS 11 (reversão do defeito legado)"
  scenario_class: adversarial
  boundary_edge_class: [single-input-missing]
  description: >
    REV-NS-01 §4.2: no legado, o paciente intubado alerta só era representável como
    GCS ausente (→ SOFA CNS 0, falsa tranquilização) ou como V coagido a 1 → GCS 11
    (→ SOFA CNS 2, falso alarme). Este vetor afirma a única saída correta: nenhum
    total; E4 e M6 exibidos e consumíveis; V registrado NT com motivo.
  deltas:
    gcs_verbal: {value: null, token: NT, nt_reason: endotracheal_intubation}
  expected:
    components: {eye: 4, verbal: "NT(endotracheal_intubation)", motor: 6}
    total: null                       # NÃO 11; NÃO 15; NÃO 10
    evaluation_status: not_evaluated
    reason: component_not_testable
    fires: false
    no_fire_reason: insufficient_data

- vector_id: CRV-0206
  title: "Motor NT (paralisia documentada, outra causa) — E4 V5 M-NT → nenhum total"
  scenario_class: edge
  boundary_edge_class: [single-input-missing]
  deltas:
    gcs_motor: {value: null, token: NT, nt_reason: paralysis_other}
  expected:
    components: {eye: 4, verbal: 5, motor: "NT(paralysis_other)"}
    total: null
    evaluation_status: not_evaluated
    reason: component_not_testable
    fires: false
    no_fire_reason: insufficient_data

- vector_id: CRV-0207
  title: "Todos NT (bloqueio neuromuscular ativo) — nenhum total, nenhum componente numérico"
  scenario_class: edge
  boundary_edge_class: [all-inputs-missing]
  description: >
    BNM ativo torna os três componentes não observáveis (spec §3.3 INFERENCE,
    OQ-GCS-4). Nada aqui pode virar GCS 3: três NT não são três 1s.
  deltas:
    gcs_eye:    {value: null, token: NT, nt_reason: neuromuscular_blockade}
    gcs_verbal: {value: null, token: NT, nt_reason: neuromuscular_blockade}
    gcs_motor:  {value: null, token: NT, nt_reason: neuromuscular_blockade}
    rass:       {value: null, present: false}   # RASS também não avaliável sob BNM
  expected:
    components: {eye: "NT", verbal: "NT", motor: "NT"}
    total: null                       # NÃO 3 (a coerção-ao-mínimo legada produzia 3.0)
    evaluation_status: not_evaluated
    reason: component_not_testable
    fires: false
    no_fire_reason: insufficient_data
```

### 3.3 Componente ausente (missing ≠ NT) (1)

```yaml
- vector_id: CRV-0208
  title: "Verbal AUSENTE (nenhuma observação, sem registro NT) → not_evaluated(missing_required_input:verbal)"
  scenario_class: edge
  boundary_edge_class: [single-input-missing]
  description: >
    Distinção NT × missing (spec §3.4): aqui ninguém registrou nada para V — nem valor,
    nem NT. O status e o motivo diferem do CRV-0205 e a explicação deve pedir a
    avaliação faltante, não relatar impedimento.
  deltas:
    gcs_verbal: {value: null, token: null, present: false}
  expected:
    components: {eye: 4, verbal: "missing", motor: 6}
    total: null
    evaluation_status: not_evaluated
    reason: "missing_required_input:verbal"
    fires: false
    no_fire_reason: insufficient_data
```

### 3.4 Gate RASS / confusão sedativa (4)

```yaml
- vector_id: CRV-0209
  title: "RASS -4 + infusão sedativa ativa → sedation_confounded; componentes exibidos, nenhum total"
  scenario_class: edge
  boundary_edge_class: [multi-criteria-combination]
  deltas:
    gcs_eye:    {value: 1}
    gcs_verbal: {value: 1}
    gcs_motor:  {value: 2}
    rass:       {value: -4}
    sedative_infusion: {value: active_infusion, agent: "synthetic-sedative", interruption_window: none_documented}
  expected:
    components: {eye: 1, verbal: 1, motor: 2}   # registrados e exibidos com marcação
    total: null                       # NÃO 4; SOFA CNS não pode consumir isto (spec §7.1)
    evaluation_status: not_evaluated
    reason: sedation_confounded
    fires: false
    no_fire_reason: insufficient_data

- vector_id: CRV-0210
  title: "RASS 0 pareado, sem sedativo ativo → testável; total 15 valid"
  scenario_class: typical
  boundary_edge_class: []
  deltas: {}   # PANEL-GCS-NORMAL já é RASS 0 / none_active — vetor explicita o caminho positivo do gate
  expected:
    components: {eye: 4, verbal: 5, motor: 6}
    total: 15
    evaluation_status: valid
    fires: false
    no_fire_reason: criteria_not_met

- vector_id: CRV-0211
  title: "RASS ausente + exposição sedativa desconhecida → default 0.1.0: escora COM divulgação — comportamento SINALIZADO AO REVISOR (OQ-GCS-2/ADR-0028)"
  scenario_class: edge
  boundary_edge_class: [single-input-missing]
  description: >
    Este vetor codifica o DEFAULT proposto (idêntico a RULE-SOFA-0100 OQ-8), não uma
    expectativa ratificada: estado de sedação desconhecido → total emitido com a
    divulgação obrigatória "estado de sedação não avaliado". Se o ADR-0028 decidir
    bloquear, este vetor é aposentado e substituído por um que espere
    not_evaluated(sedation_state_unknown).
  deltas:
    rass:              {value: null, present: false}
    sedative_infusion: {value: unknown}
  expected:
    components: {eye: 4, verbal: 5, motor: 6}
    total: 15
    evaluation_status: valid
    mandatory_disclosure: "estado de sedação não avaliado / sedation state not assessed"
    fires: false
    no_fire_reason: criteria_not_met
    review_flag: "OQ-GCS-2 — default não ratificado; pertence ao ADR-0028"

- vector_id: CRV-0212
  title: "RASS -4 com AUSÊNCIA documentada de sedativo → coma genuíno; escora (total 5, valid)"
  scenario_class: edge
  boundary_edge_class: [multi-criteria-combination]
  description: >
    O refinamento de spec §4.3: RASS ≤ -3 sozinho não confunde; é a exposição sedativa
    que confunde. Coma estrutural não sedado deve permanecer escorável, senão o
    paciente mais grave da unidade fica invisível ao SOFA CNS.
  deltas:
    gcs_eye:    {value: 1}
    gcs_verbal: {value: 2}
    gcs_motor:  {value: 2}
    rass:       {value: -4}
    sedative_infusion: {value: none_active}   # ausência documentada
  expected:
    components: {eye: 1, verbal: 2, motor: 2}
    total: 5
    evaluation_status: valid
    fires: false
    no_fire_reason: criteria_not_met
```

### 3.5 Frescor — pareamento RASS e componentes stale (2)

```yaml
- vector_id: CRV-0213
  title: "RASS 3 h antes da GCS (fora da janela de pareamento de 1 h) → estado de sedação desconhecido (caminho §4.4)"
  scenario_class: boundary
  boundary_edge_class: [freshness-window-edge]
  deltas:
    rass:              {value: -2, observed: "2026-08-15T06:00"}   # GCS às 09:00 → 3 h de defasagem
    sedative_infusion: {value: unknown}
  expected:
    components: {eye: 4, verbal: 5, motor: 6}
    total: 15
    evaluation_status: valid
    mandatory_disclosure: "estado de sedação não avaliado (RASS não pareado) / sedation state not assessed (RASS not paired)"
    fires: false
    no_fire_reason: criteria_not_met
    review_flag: "mesmo default de CRV-0211 — OQ-GCS-2/ADR-0028; um RASS não contemporâneo NUNCA conta como gate satisfeito"

- vector_id: CRV-0214
  title: "Componentes com 13 h (fora da janela de 12 h, dentro do expiry de 24 h) → stale; total não legível"
  scenario_class: boundary
  boundary_edge_class: [freshness-window-edge]
  deltas:
    gcs_eye:    {value: 4, observed: "2026-08-14T23:00"}
    gcs_verbal: {value: 5, observed: "2026-08-14T23:00"}
    gcs_motor:  {value: 6, observed: "2026-08-14T23:00"}
    rass:       {value: 0, observed: "2026-08-14T23:00"}
  expected:
    components: {eye: 4, verbal: 5, motor: 6}   # exibidos com idade
    total: null                                 # não legível em stale
    evaluation_status: stale
    fires: false
    no_fire_reason: stale_data
```

### 3.6 Gate populacional (2)

```yaml
- vector_id: CRV-0215
  title: "Idade desconhecida → not_evaluated(population_unverified); nunca assumir adulto"
  scenario_class: edge
  boundary_edge_class: [population-exclusion-boundary]
  deltas:
    age: {value: null, present: false}
  expected:
    total: null
    evaluation_status: not_evaluated
    reason: population_unverified
    fires: false
    no_fire_reason: out_of_population_scope

- vector_id: CRV-0216
  title: "Idade 15 (verificada) → not_evaluated(out_of_population_scope) — VAL-0006 BLOCKING"
  scenario_class: boundary
  boundary_edge_class: [population-exclusion-boundary]
  deltas:
    age: {value: 15, unit: "a"}
  expected:
    total: null
    evaluation_status: not_evaluated
    reason: out_of_population_scope
    fires: false
    no_fire_reason: out_of_population_scope
```

### 3.7 Enumerações inválidas (2)

```yaml
- vector_id: CRV-0217
  title: "E=5 (fora da enumeração 1-4) → invalid(out_of_range); nunca clampar a 4"
  scenario_class: adversarial
  boundary_edge_class: [threshold-just-above]
  deltas:
    gcs_eye: {value: 5}
  expected:
    total: null
    evaluation_status: invalid
    reason: "out_of_range:eye"
    fires: false
    no_fire_reason: invalid_data

- vector_id: CRV-0218
  title: "M=7 (fora da enumeração 1-6) → invalid(out_of_range); nunca clampar a 6"
  scenario_class: adversarial
  boundary_edge_class: [threshold-just-above]
  deltas:
    gcs_motor: {value: 7}
  expected:
    total: null
    evaluation_status: invalid
    reason: "out_of_range:motor"
    fires: false
    no_fire_reason: invalid_data
```

## 4. Contagem por categoria

| Categoria | Vetores | Qtde |
|---|---|---|
| Totais normais na faixa (limites 3 e 15 inclusos) | CRV-0201, 0202, 0203 | 3 |
| NT por componente + todos-NT | CRV-0204, 0205 (canônico), 0206, 0207 | 4 |
| Componente ausente (missing ≠ NT) | CRV-0208 | 1 |
| Gate RASS / confusão sedativa | CRV-0209, 0210, 0211 (sinalizado), 0212 | 4 |
| Frescor (pareamento RASS; componentes stale) | CRV-0213, 0214 | 2 |
| Gate populacional | CRV-0215, 0216 | 2 |
| Enumeração inválida | CRV-0217, 0218 | 2 |
| **Total** | | **18** |

Vetores de regressão direta do defeito legado (HAZ-0005): CRV-0205 (coerção V=1 →
GCS 11), CRV-0207 (formulário vazio → 3.0), CRV-0208 (missing → 0 nos consumidores),
CRV-0209 (sedado escorado sem gate) — ver `migration-notes.md`.

*Sem PHI; todos os valores sintéticos. Nenhum vetor é evidência de release; todos
aguardam autoria/revisão independentes.*
