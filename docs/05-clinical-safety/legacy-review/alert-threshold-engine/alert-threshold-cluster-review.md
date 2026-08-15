---
id: LEGREV-ALTB-CLUSTER
title: Legacy review — docs/rules/alert-threshold cluster (116 rule records) with per-rule dispositions
label: PROPOSAL
status: PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI)
statement: >
  Cluster-level review of the legacy extracted-rule catalog cluster
  docs/rules/alert-threshold (116 rule records), with a per-rule disposition
  table (rule ID, one-line function with citation, proposed verdict) under
  docs/00-governance/legacy-import-policy.md.
provenance:
  source_repo: intensicare (legacy V1, READ-ONLY)
  path_or_url: docs/rules/alert-threshold/ (116 files)
  commit_sha_or_version: 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79 (HEAD at pin; docs/rules is covered file-by-file in the cycle-1 SHA-256 manifest)
  section_or_lines: whole cluster; per-rule upstream citations reproduced from the rule records
  date_collected: 2026-08-15
  last_updated: 2026-08-15
  collector: rodaquino-OMNI (legacy alert-and-threshold engine forensics reviewer, cycle 1 Task 1)
  transformation: >
    every rule record read (metadata, rule statement, logic, sources);
    one-line summaries condensed from the records; verdicts are this
    reviewer's proposals, not the records' own audit verdicts.
  confidence: high (record contents) / medium (dispositions)
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  hazards: [HAZ-0005, HAZ-0016, HAZ-0022, HAZ-0036]
  adrs: []
  pr: null
supersedes: null
superseded_by: null
---

# Alert-threshold rule cluster — disposition review

> **PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).**
> Nothing in this table is an import decision. A verdict here proposes a
> classification under `docs/00-governance/legacy-import-policy.md` §4; any
> actual import additionally requires all eight §3 preconditions, which are
> currently unmet (license/IP, named owner, clinical relevance review, V2
> acceptance tests, and more).

## 0. Sources and integrity

- Cluster: `/Users/familia/intensicare/docs/rules/alert-threshold/` —
  OBSERVED 2026-08-15: **116 rule records** (`ls | wc -l`), all individually
  SHA-256-hashed in `docs/archive/legacy-provenance/legacy-pin-cycle-1.md`
  (the manifest's `docs/rules/` file set). Citations inside each record
  point at the audited upstream repos pinned by the records themselves:
  `ahlabs-trilhas @ 8166c07eae...` and `trilhas-frontend @ f9656be266...`
  (audit date 2026-07-03). This review verifies the *records*; the upstream
  repos were not re-opened (they are outside the cycle-1 pin scope), so
  each row's implementation citation inherits the record's own audit
  provenance.
- Legacy context ADR: `docs/adr/0014-no-abnormal-value-threshold-flagging.md`
  (hash-and-note in `README.md`) — establishes that clinical values carried
  no severity encoding in V1's UI; the cluster below is therefore the
  *entire* severity-signal surface the predecessor had.
- Two rules (RULE-ALERTAS-001/002) also exist as ratified
  re-implementations in `src/intensicare/services/domain_alertas.py`
  (manifest-hashed; engine-review §3.1).

## 1. Verdict method (applied uniformly)

| Verdict | Applied when |
|---|---|
| REJECT | The implemented rule is defective (docstring/code contradiction, unreachable branch, wrong column, exact-equality banding, dead code), or embodies a pattern V2's hazard log forbids (absence-to-normal coercion, severity masking, count-as-severity, color-only encoding, unscoped counters) |
| VALIDATE | The clinical intent is plausible and the implementation is faithful (or the defect is minor), but no legacy clinical rule may enter V2 without empirical/clinical validation and named approval — this is the ceiling for every clinical criterion in the cluster |
| TRANSFORM | A sound underlying concept is worth carrying, but only as a rebuilt V2-native design; the implementation is not the candidate |
| SUPERSEDE | V2's architecture or governance already replaces the mechanism wholesale (UI color tokens, Firebase counters, chat retention, operational gauges) |
| RETAIN / REFINE | Not proposed for any row — the cluster predates evaluation-status semantics, so nothing imports as-is or with light modification |

## 2. Per-rule disposition table

Upstream citations abbreviated: `aht` = ahlabs-trilhas @ 8166c07eae,
`tf` = trilhas-frontend @ f9656be266.

| Rule ID | What it does (one line, cited) | Verdict |
|---|---|---|
| RULE-ALERTAS-001 | Counts criteria with esta_alerta == 1 as the input to color banding (aht trilha_automatica/utils.py:8-13) | REJECT — None/absent coerced to not-in-alert; count feeds severity |
| RULE-ALERTAS-002 | Buckets movimentacoes by worst manual-pathway color; all-None tuple counts as NEUTRO (aht core/models/leito.py:709-736) | REJECT — absence counted as no-alert (HAZ-0005 at rollup) |
| RULE-ALERTAS-003 | Maps triggered-criteria count to VERMELHO/AMARELO/NEUTRO via per-trilha count thresholds; record status DISCREPANCY (aht trilha_automatica/utils.py:75-81) | REJECT — count-as-severity |
| RULE-ALERTAS-004 | Criterion is in-alert iff value == exactly 1 (aht trilha_automatica/utils.py:1-5) | REJECT — unknown/2/None silently not-in-alert |
| RULE-ALERTAS-005 | Bed rollup, red dominates amber dominates neutral; dead code variant (aht trilha_automatica/utils.py:84-97) | SUPERSEDE — max-severity concept survives elsewhere; dead |
| RULE-ALERTAS-006 | Bed color with interactive-sepsis LARANJA outranking all, else red > amber > neutral among un-attended pathways (aht core/models/leito.py:246-280) | TRANSFORM — max-severity sound; LARANJA special case and color-only encoding rejected |
| RULE-ALERTAS-007 | Attendance-ignoring worst color per automatic bed (alerta_nao_assistido); empty string when none (aht core/models/leito.py:457-480) | TRANSFORM — unmasked-severity channel is the correct invariant; empty-string encoding rejected |
| RULE-ALERTAS-008 | Homecare variant of attendance-ignoring bed alert (aht core/models/leito.py:653-707) | TRANSFORM |
| RULE-ALERTAS-009 | Bed attended only if every non-NEUTRO pathway attended; all-NEUTRO bed not attended (aht core/models/leito.py:818-848) | TRANSFORM — acknowledgement concept; semantics rebuilt |
| RULE-ALERTAS-010 | Bed payload: overall alert = worst un-attended color; attended flag requires NEUTRO plus another distinct color (aht core/models/leito.py:390-455) | REJECT — incoherent attended-flag semantics |
| RULE-ALERTAS-011 | If assistido, render blue ASSISTIDO regardless of alert value, at card and chip level (tf InfoPacienteHeader.tsx:21-105; duplicated in CollapseCard.tsx) | REJECT — attendance masks severity (engine-review Finding 2) |
| RULE-ALERTAS-012 | Collects criterion messages of red manual pathways into notification content (aht utils/handlers.py:109-126) | TRANSFORM — explanation-payload concept |
| RULE-ALERTAS-013 | Same for automatic pathways, no whitelist filter (aht utils/handlers.py:129-148) | TRANSFORM |
| RULE-ALERTAS-014 | Tipo-dependent whitelist filtering of criterion messages; AMBIGUOUS; disabled sepsis special-case in dead code (aht utils/handlers.py:151-196) | REJECT — inconsistent filtering of clinical explanations |
| RULE-ALERTAS-015 | Homecare red-content extraction, unconditional (aht utils/handlers.py:199-218) | TRANSFORM |
| RULE-ALERTAS-016 | Push observation when newly red, or when red content changed; suppress unchanged-red duplicates (aht core/utils.py:163-190) | VALIDATE — content-change re-notify vs suppression trade-off is clinical |
| RULE-ALERTAS-025 | Semantic color tokens (success/info/warning/danger) layered on the UI theme (tf src/styles/variables.less:1-15) | SUPERSEDE |
| RULE-ALERTAS-027 | Sector rollup: bed is VERMELHO if any track red, else AMARELO if any amber, else NEUTRO; plus gender tally (aht core/models/leito.py:764-816) | TRANSFORM — per-bed worst-severity bucketing sound; color-only rejected |
| RULE-ALERTAS-028 | Sector total_alertas keyed on the attendance-ignoring bed color (aht core/models/leito.py:750-762) | TRANSFORM — the unmasked KPI is the safety-relevant half |
| RULE-ALERTAS-029 | Sector assisted-bed counts, two paths (aht core/models/leito.py:332-361) | TRANSFORM |
| RULE-ANTIMICROBIANO-001 | Active stewardship flags to color, wired in save(); NEUTRO resets assistido (aht trilha5.py:101-105,182-201) | VALIDATE |
| RULE-ANTIMICROBIANO-002 | Legacy stewardship color variant, dead in the active path (aht trilha5.py:156-180) | REJECT — dead code |
| RULE-BALANCO-HIDRICO-025 | Fluid-balance cell visibility differs between desktop (!= 0) and mobile (> 0) views (tf GridView.tsx:81-96) | REJECT — same data, two thresholds |
| RULE-COMUNICACAO-004 | Per-user Firestore unread-count updates on message events (aht utils/firebase.py:19-75) | SUPERSEDE |
| RULE-COMUNICACAO-005 | Eligibility to decrement an observation's unread contribution (aht utils/mensageiro.py:77-84) | SUPERSEDE |
| RULE-COMUNICACAO-006 | Zero unread flags when a checagem becomes checked (aht checagem_observacao.py:28-43) | SUPERSEDE |
| RULE-COMUNICACAO-007 | Skip increment notification for replies that already decremented (aht observacao.py:183-220) | SUPERSEDE |
| RULE-COMUNICACAO-008 | Chat retention 48 h sector-wide, 96 h with bed filter (aht core/api/v1/views/chat.py:23-54) | SUPERSEDE |
| RULE-COMUNICACAO-009 | Popup notifications debounced to one per 2 s (tf DisplayNotificaoes.tsx:98,105) | SUPERSEDE |
| RULE-COMUNICACAO-010 | Status color applied only to leito-type messages; others fixed gray (tf ItemNotificacao.tsx:26-39) | SUPERSEDE |
| RULE-COMUNICACAO-020 | Streams ignore the current user's own messages (tf DisplayNotificaoes.tsx:100-126) | SUPERSEDE |
| RULE-COMUNICACAO-046 | Unread-decrement predicate gating Firebase updates (aht utils/firebase.py:77-84) | SUPERSEDE |
| RULE-EFICIENCIA-001 | v3 efficiency criteria to color; a divergent legacy variant is dead (aht trilha_eficiencia.py:60-65,115-157,206-216) | VALIDATE |
| RULE-EFICIENCIA-005 | Suspected-brain-death criterion: documented GCS < 6, code uses GCS < 13 with AND-combined sedative filter; unwired (aht trilha_eficiencia.py:878-912) | REJECT — contradicts documented clinical intent |
| RULE-EFICIENCIA-006 | Restraint-without-agitation: docstring requires delirium absent, code requires delirium present (aht trilha_eficiencia.py:914-937) | REJECT — inverted predicate |
| RULE-EFICIENCIA-012 | Alert label + recommendation catalog for the 10 efficiency criteria (aht core/facade/trilha_eficiencia.py:94-155) | VALIDATE — clinical wording review |
| RULE-EQUILIBRIO-001 | Fluid-balance criteria 1-4 with labels and recommendations (aht core/facade/trilha_equilibrio.py:1-36) | VALIDATE |
| RULE-EQUILIBRIO-003 | Equilibrio criteria flags to persisted color (aht trilha7.py:87-91,124-143) | VALIDATE |
| RULE-ESTABILIDADE-003 | Noradrenaline + (TEC > 3 s or lactate >= 2) hypoperfusion criterion; unwired (aht trilha_estabilidade.py:215-247) | VALIDATE |
| RULE-ESTABILIDADE-005 | Docstring documents absence of noradrenaline, code checks presence; unwired (aht trilha_estabilidade.py:286-319) | REJECT — inverted predicate |
| RULE-ESTABILIDADE-006 | Persistent shock on low-dose vasopressor, compound criterion; unwired (aht trilha_estabilidade.py:321-362) | VALIDATE |
| RULE-ESTABILIDADE-007 | High-dose noradrenaline without vasopressin or hydrocortisone; wired to VERMELHO; audit DISCREPANCY moderate (aht trilha_estabilidade.py:460-497) | REJECT as implemented — concept to clinical re-derivation |
| RULE-ESTABILIDADE-008 | Refractory-shock triple-therapy criterion; unwired; audit DISCREPANCY moderate (aht trilha_estabilidade.py:499-521) | REJECT as implemented |
| RULE-ESTABILIDADE-009 | Dobutamine + high-dose noradrenaline criterion; unwired; audit DISCREPANCY moderate (aht trilha_estabilidade.py:523-542) | REJECT as implemented |
| RULE-ESTABILIDADE-011 | Bicarbonate use despite compensated pH; noted missing precondition; unwired (aht trilha_estabilidade.py:592-612) | VALIDATE |
| RULE-ESTABILIDADE-012 | Scheduled antihypertensive + recurrent hypotension; wired to AMARELO (aht trilha_estabilidade.py:614-669) | VALIDATE |
| RULE-ESTABILIDADE-013 | Recurrent hypertension off vasopressor, stroke-diagnosis exclusion; wired to AMARELO (aht trilha_estabilidade.py:671-709) | VALIDATE |
| RULE-ESTABILIDADE-014 | v3 stability color: red on criteria 7/10, amber on 12/13 (aht trilha_estabilidade.py:117-155,200-213) | VALIDATE |
| RULE-ESTABILIDADE-015 | Facade alert texts whose numeric thresholds diverge from evaluated predicates; audit DISCREPANCY moderate (aht core/facade/trilha_estabilidade.py:1-57,92-101) | REJECT — rendered thresholds must equal evaluated predicates |
| RULE-ESTABILIDADE-023 | Manual stability: count of satisfied criteria to 3-level alert (aht trilha_manual/models/trilha_estabilidade.py:139-153) | REJECT — count-as-severity |
| RULE-ESTABILIDADE-025 | v1 color with criterio-6 combination clause (aht trilha2.py:78-97) | VALIDATE |
| RULE-FORMULARIOS-CLINICOS-004 | Peri-wound edema enum around a 4 cm boundary; audit DISCREPANCY low (aht avaliacao_global.py:92-115) | VALIDATE |
| RULE-FORMULARIOS-CLINICOS-005 | Cardiovascular exam enums + capillary-refill > 5 s flag; audit DISCREPANCY low (tf dataFormEnfermagem.ts:424-472) | VALIDATE |
| RULE-FORMULARIOS-CLINICOS-006 | Nursing-technician diet block ranges, subset of nurse/dietitian forms (tf dataFormTecEnfermagem.ts:289-339) | VALIDATE |
| RULE-INDICADORES-ETL-001 | Alert-share percentage per color bucket for sector bars (tf DashboardCard.tsx:54-67) | SUPERSEDE |
| RULE-INDICADORES-ETL-002 | Assisted-share percentage; at 100% flips the whole sector card to ASSISTIDO (tf DashboardCard.tsx:69-79) | REJECT — sector-level severity masking |
| RULE-INDICADORES-ETL-005 | Occupancy gauge color at > 70 / > 50 (tf DashboardCard.tsx:291-300) | SUPERSEDE — operational, not clinical |
| RULE-INDICADORES-ETL-006 | Sector badge: ASSISTIDO top priority, else highest-COUNT color wins with red preferred on ties (tf DashboardCard.tsx:81-109) | REJECT — count-based aggregation can under-report severity (P-3) |
| RULE-INDICADORES-ETL-007 | Fourth LARANJA bucket in one dashboard type, inconsistent with the 3-level model everywhere else (tf DashboardItem.d.ts:26-31) | REJECT — vocabulary drift |
| RULE-MOVIMENTACAO-ADT-012 | Rolls 4 pathway alerts into a bed alert; notifies on newly-red or changed-red content (aht atualizar_alerta_movimentacao.py:9-79) | TRANSFORM |
| RULE-MOVIMENTACAO-ADT-014 | Three-level AMARELO/NEUTRO/VERMELHO enum across bed/trilha/message types (tf Ocupacao.d.ts:106) | SUPERSEDE |
| RULE-MOVIMENTACAO-ADT-015 | Overdue-protocol-item clock icon on trilha chip (tf CollapseCard.tsx:570-578) | TRANSFORM — overdue-item visibility concept |
| RULE-MOVIMENTACAO-ADT-016 | Invasive-procedures badge with popover when list non-empty (tf CollapseCard.tsx:423-454) | TRANSFORM |
| RULE-NUTRICAO-004 | Nutrition color aggregation; AMARELO requires amarelo > 2 with only 2 possible — unreachable (aht trilha6.py:123-142) | REJECT — unreachable severity band |
| RULE-NUTRICAO-005 | Nutrition-therapy form ranges shared by nursing and dietitian forms (tf dataFormEnfermagem.ts:554-633) | VALIDATE |
| RULE-PIORA-CLINICA-010 | Track-and-trigger: any single grade-2 sets AMARELO, grade-3 sets VERMELHO, else sum bands 0-7/8-14/15-21; audit DISCREPANCY (aht piora_clinica.py:236-262) | VALIDATE — single-parameter trigger design is sound; bands need clinical derivation |
| RULE-PIORA-CLINICA-011 | Per-criterion alert labels, recommendations, interventions incl. embedded vital thresholds (aht core/facade/piora_clinica.py:1-262) | VALIDATE — clinical wording review |
| RULE-PRESCRICAO-002 | Per-dose suspension check; each class also carries a shadowed never-executed inverted first definition (aht horario_prescricao.py:147-162) | REJECT — shadowed inverted logic disqualifies the artifact |
| RULE-PRESCRICAO-003 | Order-level suspension once DT_SUSPENSAO at or before now (aht prescricao.py:145-151) | TRANSFORM |
| RULE-PROFILAXIA-003 | Prophylaxis v1: criterion 1 amber; criteria 4/9 red (aht trilha8.py:124-141) | VALIDATE |
| RULE-PROFILAXIA-004 | Prophylaxis v3: criterion 1 amber; criterion 9 red; NEUTRO resets assistido (aht trilha_profilaxia.py:123-140,181-190) | VALIDATE |
| RULE-SEDACAO-014 | Sedation v3 color via calcular_alerta_v2; legacy variant dead (aht trilha_sedacao.py:120-166,248-260) | VALIDATE |
| RULE-SEDACAO-021 | Manual sedation: criteria count to 3-level alert (aht trilha_manual/models/trilha_sedacao.py:174-188) | REJECT — count-as-severity |
| RULE-SEDACAO-023 | Sedation v1 color from fixed flag subset (aht trilha1.py:108-123) | VALIDATE |
| RULE-SEPSE-003 | Homecare sepsis color: red if > 2 majors or exactly 4 minors; amber on exactly 2 majors or exactly 3 minors (aht trilha_homecare/models/sepse.py:350-383) | REJECT — exact-equality banding: 5 minors is not red |
| RULE-SEPSE-004 | Manual sepsis: simultaneous major (C1-9) and minor (C10-20) count thresholds (aht trilha_manual/models/trilha_sepse.py:526-561) | VALIDATE |
| RULE-SEPSE-007 | Fever without vasopressor; audit DISCREPANCY moderate (aht trilha_sepse.py v3:362-382) | REJECT as implemented |
| RULE-SEPSE-008 | Tachypnea/hypoxemia without vasopressor or invasive ventilation; audit VERIFIED (aht trilha_sepse.py v3:384-425) | VALIDATE |
| RULE-SEPSE-009 | Respiratory-failure prescription criterion; audit DISCREPANCY moderate (aht trilha_sepse.py v3:427-450) | REJECT as implemented |
| RULE-SEPSE-010 | Newly started vasopressor (started within 6 h, absent beyond ~24 h); VERIFIED (aht trilha_sepse.py v3:452-477) | VALIDATE |
| RULE-SEPSE-011 | Hypotension (PAS < 90 or PAD < 60 or PAM < 65) without vasopressor; VERIFIED (aht trilha_sepse.py v3:479-502) | VALIDATE |
| RULE-SEPSE-012 | Platelets < 100000 without vasopressor; VERIFIED (aht trilha_sepse.py v3:504-526) | VALIDATE |
| RULE-SEPSE-013 | Arterial lactate >= 3 without vasopressor; audit DISCREPANCY low (aht trilha_sepse.py v3:528-548) | VALIDATE |
| RULE-SEPSE-015 | AKI criterion (creatinine > 2 or rise > 0.5) with dialysis exclusions; audit DISCREPANCY moderate (aht trilha_sepse.py v3:615-671) | REJECT as implemented |
| RULE-SEPSE-016 | Acute encephalopathy/delirium composite; audit DISCREPANCY moderate (aht trilha_sepse.py v3:673-739) | REJECT as implemented |
| RULE-SEPSE-017 | Hyperbilirubinemia/jaundice, incomplete; audit DISCREPANCY moderate (aht trilha_sepse.py v3:741-761) | REJECT as implemented |
| RULE-SEPSE-018 | Hypothermia < 36 C without vasopressor; VERIFIED (aht trilha_sepse.py v3:763-781) | VALIDATE |
| RULE-SEPSE-019 | Tachycardia criterion reading the wrong column; audit DISCREPANCY moderate (aht trilha_sepse.py v3:783-801) | REJECT — wrong data column |
| RULE-SEPSE-020 | Respiratory alkalosis/hypoxemia in spontaneous ventilation; audit DISCREPANCY moderate (aht trilha_sepse.py v3:803-842) | REJECT as implemented |
| RULE-SEPSE-021 | Leukocytosis/leukopenia/bandemia/CRP composite with string parsing; audit DISCREPANCY moderate (aht trilha_sepse.py v3:844-913) | REJECT as implemented |
| RULE-SEPSE-022 | New-onset capillary refill > 3 s; VERIFIED (aht trilha_sepse.py v3:915-942) | VALIDATE |
| RULE-SEPSE-023 | Enteral tube with adequate GCS (aht trilha_sepse.py v3:944-978) | VALIDATE |
| RULE-SEPSE-024 | Central line older than 7 days (aht trilha_sepse.py v3:980-1001) | VALIDATE |
| RULE-SEPSE-025 | Femoral central line older than 5 days (aht trilha_sepse.py v3:1003-1028) | VALIDATE |
| RULE-SEPSE-026 | Recent abdominal surgery flag (aht trilha_sepse.py v3:1030-1051) | VALIDATE |
| RULE-SEPSE-058 | v3 sepsis facade threshold table for 20 criteria; audit DISCREPANCY moderate vs model layer (aht core/facade/trilha_sepse_v3.py:1-85) | REJECT — facade diverges from evaluated predicates |
| RULE-SEPSE-062 | Labs-reassessment guidance: restricted bicarbonate, dobutamine on rising lactate, transfusion threshold; VERIFIED (aht item_trilha_interativa_sepse.py:192-199) | VALIDATE — clinical wording review |
| RULE-SEPSE-095 | First-hour-delay flag rendered as red clock on protocol item; audit DISCREPANCY (tf ItemProtocoloSepse.tsx:42-50) | TRANSFORM — time-to-task visibility concept |
| RULE-SINAIS-VITAIS-001 | BP/HR input plausibility bounds, frontend mirrors backend (tf dataFormMovimentacao.ts:72-92) | VALIDATE |
| RULE-SINAIS-VITAIS-002 | Blood-gas/lab plausibility bounds feeding SOFA/sepsis inputs (tf dataFormMovimentacao.ts:145-198) | VALIDATE |
| RULE-SINAIS-VITAIS-003 | Urine-output/temperature plausibility bounds (tf dataFormMovimentacao.ts:199-212) | VALIDATE |
| RULE-SINAIS-VITAIS-004 | Capillary refill captured three inconsistent ways; numeric lower bound 3 s excludes normal values (tf dataFormMovimentacao.ts:93-99) | REJECT — one canonical capture required |
| RULE-SINAIS-VITAIS-005 | Physician form leaves HR/RR/temp/SpO2 unbounded, unlike other forms and backend (tf dataFormFormularioMedico.ts:270-308) | REJECT — inconsistent validation surface |
| RULE-TENANCY-ORGANIZACAO-007 | Establishment unread count sums all sectors without user scoping (aht estabelecimento.py:231-251) | REJECT — scoping defect |
| RULE-TENANCY-ORGANIZACAO-008 | Sector unread count via Firestore per user (aht setor.py:270-286) | SUPERSEDE |
| RULE-TENANCY-ORGANIZACAO-011 | Sector alert counts merge manual movement alerts with automatic bed alerts (aht setor.py:56-79) | TRANSFORM |
| RULE-TENANCY-ORGANIZACAO-035 | Sector total-alert counts branch by sector type (aht setor.py:208-236) | TRANSFORM |
| RULE-TRILHAS-ENGINE-004 | Pathway tab style: ASSISTIDO preferred over the alert level (tf TabRecomendacoes.tsx:110-139) | REJECT — severity masking (engine-review Finding 2) |
| RULE-TRILHAS-ENGINE-008 | Red warning in protocol card header when items overdue (tf TrilhaInterativa.tsx:190-194) | TRANSFORM |
| RULE-VENTILACAO-014 | Ventilation alert: red if >= 3 criteria OR any of C1/C8/C9; amber if >= 1 (aht trilha_manual/models/trilha_ventilacao.py:346-364) | VALIDATE — special-criterion override partially corrects count-as-severity |
| RULE-VENTILACAO-015 | Ventilation v1 active color; NEUTRO resets assistido (aht trilha3.py:82-86,124-142) | VALIDATE |
| RULE-VENTILACAO-016 | Ventilation v1 legacy color variant, dead (aht trilha3.py:104-122) | REJECT — dead code |
| RULE-VENTILACAO-018 | Ventilator parameter validation bounds (tf dataFormMovimentacao.ts:110-144) | VALIDATE |
| RULE-VENTILACAO-021 | Supplemental O2 flow bounded 1-15 L/min (aht respiratoria.py:135-140) | VALIDATE |
| RULE-VENTILACAO-022 | PEEP bounded 5-18 cmH2O (aht ventilacao.py:170-178) | VALIDATE |
| RULE-VENTILACAO-023 | Inspiratory pressure bounded 5-40 cmH2O (aht ventilacao.py:180-188) | VALIDATE |

## 3. Disposition tallies

| Verdict | Count |
|---|---|
| RETAIN | 0 |
| REFINE | 0 |
| TRANSFORM | 18 |
| VALIDATE | 45 |
| SUPERSEDE | 15 |
| REJECT | 38 |
| **Total** | **116** |

## 4. Cluster-level findings

1. **No rule is import-ready.** Zero RETAIN/REFINE. The cluster's best
   artifacts (the VERIFIED sepsis criteria) are still clinical content that
   must pass V2's pathway process (candidate inventory, MCDA, named
   approval) — VALIDATE is the ceiling by construction.
2. **Docstring/code contradictions are endemic in the clinical criteria**:
   at least 12 rules where the implemented predicate contradicts the
   documented clinical intent (inverted absence/presence of noradrenaline,
   GCS 13 vs 6, delirium present vs absent, wrong column). Any V2 rule
   language must make the executable form and the reviewed form the same
   artifact (the legitimate goal behind the rejected Gate C —
   engine-review §6.2).
3. **Facade/predicate divergence** (RULE-ESTABILIDADE-015, RULE-SEPSE-058):
   the numbers shown to clinicians differed from the numbers evaluated.
   This is HAZ-0036-class (output reads as authoritative direction) and
   must be a build-blocking check in V2.
4. **Count-as-severity and exact-equality banding** (ALERTAS-001/003/004,
   ESTABILIDADE-023, SEDACAO-021, SEPSE-003): absence contributes zero,
   counts saturate wrongly, and off-by-one band definitions leave holes
   (5 minors not red). Severity in V2 must be ordinal over evaluated
   evidence, never a criteria count.
5. **The assistido family and sector count-tie-breaks mask severity**
   (ALERTAS-011, TRILHAS-ENGINE-004, INDICADORES-ETL-002/006) — reviewed
   in depth in engine-review Finding 2.
6. **Three-plus color vocabularies drift** (NEUTRO/AMARELO/VERMELHO,
   plus LARANJA in exactly one type, plus ASSISTIDO, plus the newer
   normal/watch/urgent/critical in the Python engine): one canonical,
   non-color-only severity vocabulary is a precondition for any V2 UI.

All dispositions: PROPOSAL — AWAITING NAMED CLINICAL REVIEW
(reviewer: rodaquino-OMNI).
