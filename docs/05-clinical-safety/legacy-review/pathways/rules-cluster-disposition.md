---
id: LEGREV-RULES-CARE-PATHWAY
title: Legacy docs/rules/care-pathway cluster — per-rule disposition table (211 rules)
label: OBSERVED
status: PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI)
statement: >
  Per-rule disposition for all 211 extracted-rule records in the legacy
  docs/rules/care-pathway/ cluster. Each row: rule ID, one-line description taken
  from the record's own Rule section, the record's self-declared verification status
  (OK / DISCREPANCY / AMBIGUOUS), source file, and a proposed import-policy verdict.
  Verdicts are mechanical proposals from a stated heuristic and bind nothing.
provenance:
  source_repo: intensicare (legacy V1, READ-ONLY)
  path_or_url: docs/rules/care-pathway/ (211 markdown files)
  commit_sha_or_version: 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79 (legacy HEAD at pin, 2026-08-15)
  section_or_lines: title, front table (Status/Type/Cluster), and first line of the Rule section of every file
  date_collected: 2026-08-15
  collector: legacy care-pathway definitions forensics reviewer (cycle 1, Task 1)
  transformation: >
    scripted extraction of title/status/cluster/rule-text from each file; verdicts
    assigned by the documented heuristic in section 2; descriptions truncated to 150
    chars; pipe characters replaced for table safety
  confidence: medium
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  hazards: [HAZ-0005, HAZ-0016]
supersedes: null
superseded_by: null
---

# docs/rules/care-pathway — per-rule disposition table

> **PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).** These
> verdicts are mechanical triage under `docs/00-governance/legacy-import-policy.md`
> section 4, produced by the heuristic in section 2 below. No rule is imported,
> approved, or rejected with authority by this table.

## 1. Provenance

OBSERVED: 211 files at `docs/rules/care-pathway/` (count verified). **All 211 are
individually SHA-256-hashed in the cycle-1 pin manifest**
(`docs/archive/legacy-provenance/legacy-pin-cycle-1.md`, lines 239-449); citations
below are by path — re-verification must re-hash against the manifest. Each file is
an extracted-rule record with self-declared front fields (Status, Type, Confidence,
Cluster) and a Rule section; the one-line description below is the first line of the
Rule section, verbatim (truncated at 150 chars, `/` substituted for pipe).

Self-declared status distribution: AMBIGUOUS 19, DISCREPANCY 30, OK 162.

## 2. Verdict heuristic (mechanical, stated so it can be audited)

1. Record status `DISCREPANCY`, or filename declaring a defect
   (bug/hardcoded/duplicate/dead-validation/mock) -> **REJECT** — the record
   documents behavior that diverges from implementation or is itself a defect; it
   cannot serve as evidence without re-derivation from source.
2. Record status `AMBIGUOUS` -> **VALIDATE** — content may be sound but the
   extraction itself is uncertain; requires re-derivation plus clinical confirmation.
3. Clinical-content records (named criteria C1..C10, criterion catalogs, decision
   trees, thresholds, bundles, prophylaxis/sedation/ventilation/sepsis logic)
   -> **VALIDATE** — plausible clinical logic requiring evidence grading and a named
   clinical owner before any import decision.
4. Everything else (workflow, UI, navigation, PDF, permissions, tenancy, ETL,
   state-machine mechanics) -> **SUPERSEDE** — V2-native design replaces it; the
   record is context, not importable content.

No rule in this cluster is proposed RETAIN or REFINE: none carries the provenance,
ownership, or acceptance evidence `legacy-import-policy.md` section 3 requires.

Verdict tally: REJECT 33, SUPERSEDE 124, VALIDATE 54.

## 3. Disposition table (211 rows)

| Rule ID | Cluster | Self-status | One-line description (from the record) | Verdict (PROPOSAL) |
|---|---|---|---|---|
| `RULE-ALERTAS-017` | alertas | OK | AssistidoViewSet.create resolves the target trilha record via the overloaded 'ocupacoes__pk' URL kwarg: first tries to interpret it as a Movimentac... | SUPERSEDE |
| `RULE-ALERTAS-018` | alertas | OK | Creates an Observacao (clinical note/alert) for a movimentacao that is ALWAYS alerta='VERMELHO' (RED), regardless of underlying pathway data, with ... | REJECT |
| `RULE-ALERTAS-019` | alertas | OK | Creates an Observacao for a leito (bed) that is ALWAYS alerta='VERMELHO', using the same system-user provisioning as RULE-ALERTAS-018. Additionally... | REJECT |
| `RULE-ALERTAS-020` | alertas | OK | Across persisted trilhas, whenever the recomputed alert is NEUTRO the save() sets assistido=False, clearing any prior clinician acknowledgement whe... | SUPERSEDE |
| `RULE-ALERTAS-021` | alertas | OK | mapeamento_trilhas maps a (tipo_leito, tipo_trilha) pair to the concrete Django model used to store that pathway's data. The 'automatica' bed-type ... | SUPERSEDE |
| `RULE-ALERTAS-022` | alertas | OK | save_assistido sets a trilha record's assistido flag (defaulting to True if not specified), assistido_por (current user, or None if assistido is be... | SUPERSEDE |
| `RULE-ALERTAS-023` | alertas | OK | After save_assistido runs, an AssistidoPor audit record (tipo, leito, paciente, usuario, and a fully-stringified snapshot of every field on the tri... | SUPERSEDE |
| `RULE-ALERTAS-024` | alertas | OK | Defines the finite set of trilha status severity categories and the color scheme used to render each. Categories: NEUTRO (green/normal), VERMELHO (... | VALIDATE |
| `RULE-ANTIMICROBIANO-003` | antimicrobiano | OK | Antimicrobial stewardship pathway payload (payload_trilha_antimicrobiano, aliased as payload_antimicrobiano_automatica): 12 stewardship criteria, e... | VALIDATE |
| `RULE-AUTH-USUARIOS-016` | auth-usuarios | OK | On the interactive SEPSE trilha viewset, when the request does not accept the protocol (aceito falsy) during create/update/partial_update, the requ... | SUPERSEDE |
| `RULE-AUTH-USUARIOS-038` | auth-usuarios | OK | When a Usuario is created, it is always linked to request.empresa via UsuarioEmpresa. If setores_id is supplied, all sectors must belong to that em... | SUPERSEDE |
| `RULE-AUTH-USUARIOS-039` | auth-usuarios | OK | When updating a user's setores_id, the serializer computes a symmetric difference against the user's currently-known setores: newly listed setores ... | SUPERSEDE |
| `RULE-AUTH-USUARIOS-040` | auth-usuarios | OK | Deleting a user does not remove the record; it sets is_active=False and returns 204. | SUPERSEDE |
| `RULE-AUTH-USUARIOS-060` | auth-usuarios | OK | Each company (Usuario.Empresa.tipo) is classified using the identical three-value literal union already used for bed monitoring modality (manual / ... | REJECT |
| `RULE-BALANCO-HIDRICO-026` | balanco-hidrico | DISCREPANCY | A fluid-intake record can be deleted only if the requesting user holds the "can_delete_balanco_hidrico" company-scoped permission OR is the origina... | REJECT |
| `RULE-BALANCO-HIDRICO-027` | balanco-hidrico | OK | When an Entrada/Saida/SinaisVitais record is (re)timed, its owning daily fluid balance is chosen by the 07:00 rule: an entry timed before 07:00 on ... | SUPERSEDE |
| `RULE-BALANCO-HIDRICO-029` | balanco-hidrico | OK | A fluid intake ("entrada") record selects one of 8 types; each type conditionally reveals type-specific required fields, most terminating in a requ... | VALIDATE |
| `RULE-BALANCO-HIDRICO-030` | balanco-hidrico | OK | For an oral-diet intake, acceptance level determines whether a volume is required. | SUPERSEDE |
| `RULE-BALANCO-HIDRICO-031` | balanco-hidrico | OK | A fluid output ("saida") record selects one of 5 types; each reveals type-specific required fields including presence-grading and stool aspect enums. | VALIDATE |
| `RULE-BALANCO-HIDRICO-032` | balanco-hidrico | OK | In the fluid-balance vital-signs sub-form, ventilation mode conditionally requires supplemental O2 flow or FiO2. | SUPERSEDE |
| `RULE-BALANCO-HIDRICO-033` | balanco-hidrico | OK | A fluid-intake record can be digitally signed by the current user only if that user has both a registered CPF and PIN, the record is not already si... | SUPERSEDE |
| `RULE-BALANCO-HIDRICO-035` | balanco-hidrico | DISCREPANCY | The list() action requires the 'dia' query parameter (raises ValidationError if absent). It then recomputes a *separate* dia_param using the 07:00-... | REJECT |
| `RULE-BALANCO-HIDRICO-036` | balanco-hidrico | OK | BalancoHidricoViewSet only exposes list/retrieve (Create/Update/Destroy mixins are commented out). The list() action auto-creates the day's Balanco... | SUPERSEDE |
| `RULE-BALANCO-HIDRICO-041` | balanco-hidrico | OK | Prepares fluid-balance rows for display. For intake ("entrada") and output ("saida") rows, the displayed type is the humanized type label UNLESS th... | SUPERSEDE |
| `RULE-BALANCO-HIDRICO-042` | balanco-hidrico | OK | A fluid-balance record (entrada, saida, or sinais vitais) may be signed only when it is active, not yet signed, and the current user is permitted. ... | SUPERSEDE |
| `RULE-BALANCO-HIDRICO-043` | balanco-hidrico | DISCREPANCY | When signing a fluid OUTPUT (saida) record from its card, the sign handler is invoked with the route argument "entrada" instead of "saida". The rem... | REJECT |
| `RULE-BALANCO-HIDRICO-044` | balanco-hidrico | OK | The fluid-balance (balanço hídrico) module for a given bed occupation is organized into exactly four navigable sub-routes/states, each backed by a ... | SUPERSEDE |
| `RULE-BALANCO-HIDRICO-045` | balanco-hidrico | AMBIGUOUS | Every fluid-balance record (Entrada/Saida/SinaisVitais) carries an "ativo" (active) flag, a per-item "can_delete" eligibility flag, an optional "da... | VALIDATE |
| `RULE-COMUNICACAO-003` | comunicacao | DISCREPANCY | AcaoHomecareSerializer exposes a computed "balanco_hidrico" field that is meant to return the primary key of the fluid-balance record tied to which... | REJECT |
| `RULE-COMUNICACAO-011` | comunicacao | OK | Clicking a popup notification, or an ItemNotificacao row, routes the user differently based on the notification's message type: "setor" (chat messa... | VALIDATE |
| `RULE-COMUNICACAO-013` | comunicacao | OK | try_set_movimentacao resolves the URL kwarg 'ocupacoes__pk' as EITHER a Movimentacao pk (manual bed occupation) or, if no such Movimentacao exists,... | SUPERSEDE |
| `RULE-COMUNICACAO-014` | comunicacao | OK | A "checagem" (protocol/alert checklist checkbox) inside a chat message can be toggled by the current user unless it has already been checked by som... | SUPERSEDE |
| `RULE-COMUNICACAO-022` | comunicacao | OK | When the establishment-wide chats page loads its list of sector conversations, if no conversation is currently selected, the first item in the fetc... | SUPERSEDE |
| `RULE-COMUNICACAO-023` | comunicacao | OK | The sector occupancy page shows an unread-message badge count from a per-user, per-sector Firestore document field qtd_mensagens. Clicking the mess... | SUPERSEDE |
| `RULE-COMUNICACAO-024` | comunicacao | OK | The homecare activity feed listens on a WebSocket for update notifications. When a message with update === true arrives, the feed is only auto-refr... | SUPERSEDE |
| `RULE-COMUNICACAO-026` | comunicacao | DISCREPANCY | When opening the recommendations drawer from a feed item, the feed page passes a hardcoded array of four "mock" care pathways (trilhasMock) — Reint... | REJECT |
| `RULE-COMUNICACAO-027` | comunicacao | OK | Deleting a reaction bypasses normal (soft-delete) semantics by calling delete(force_delete=True), permanently removing the row. | SUPERSEDE |
| `RULE-COMUNICACAO-028` | comunicacao | OK | The "Usuários na sala" list for a sector's video room is populated from Firestore users under that sector filtered to online_call === true, i.e. on... | SUPERSEDE |
| `RULE-COMUNICACAO-032` | comunicacao | OK | package.json pins agora-rtc-react ^1.1.1 (Agora.io real-time video/audio conferencing SDK for React), firebase ^8.7.1 (used for storage — see RULE-... | SUPERSEDE |
| `RULE-COMUNICACAO-040` | comunicacao | OK | When sending an observation message from a bed's trilha (care pathway), the "Pontos de atenção" (points of attention) checkbox checklist section is... | SUPERSEDE |
| `RULE-DOCUMENTACAO-FATURAMENTO-001` | documentacao-faturamento | OK | The report's display date is converted from ISO 'YYYY-MM-DD' to Brazilian 'DD/MM/YYYY' format. | SUPERSEDE |
| `RULE-DOCUMENTACAO-FATURAMENTO-004` | documentacao-faturamento | OK | The fluid-balance PDF report uses the "with signature" HTML template when the 'assinatura' query parameter is exactly the string "true" or "True"; ... | SUPERSEDE |
| `RULE-DOCUMENTACAO-FATURAMENTO-005` | documentacao-faturamento | OK | The admission date/time (dt_entrada) shown on the balanco hidrico PDF is taken from the first MicroIndicadores record matching the encounter number... | SUPERSEDE |
| `RULE-DOCUMENTACAO-FATURAMENTO-018` | documentacao-faturamento | OK | PDF export filenames are built from the patient's name (spaces replaced by underscores) plus the report day, in a "<nome>-dia:<dia>.pdf" pattern, a... | SUPERSEDE |
| `RULE-ESTABILIDADE-004` | estabilidade | OK | Noradrenaline started in last 24h AND (no new antibiotic OR a Ringer-lactate record < 1000ml / isolated saline OR no blood culture ordered). Define... | VALIDATE |
| `RULE-ESTABILIDADE-017` | estabilidade | OK | Flags capillary refill time > 5s together with an active (persisted) noradrenaline record. | VALIDATE |
| `RULE-ESTABILIDADE-018` | estabilidade | OK | True if any Noradrenalina in the patient's lookback chain has horario_inicio within the last 24h. | VALIDATE |
| `RULE-ESTABILIDADE-019` | estabilidade | DISCREPANCY | Flags noradrenaline dose > 21 ml together with absence of vasopressin OR absence of hydrocortisone. | REJECT |
| `RULE-ESTABILIDADE-020` | estabilidade | OK | Flags arterial lactate >= 2.5. | VALIDATE |
| `RULE-ESTABILIDADE-021` | estabilidade | OK | Flags presence of antihypertensive together with (noradrenaline present OR PAS>90). | VALIDATE |
| `RULE-ESTABILIDADE-022` | estabilidade | DISCREPANCY | Flags dobutamine > 10 ml/h together with noradrenaline quantity EXACTLY equal to 50 ml. | REJECT |
| `RULE-ESTABILIDADE-024` | estabilidade | AMBIGUOUS | Recommendation/alert-text catalog for the estabilizacao (trilha2) pathway. Criteria for malperfusion, noradrenaline initiation, high-dose noradrena... | VALIDATE |
| `RULE-EVOLUCOES-007` | evolucoes | OK | A Formulario (clinical form/evolution) of a given type is only visible to a user if it belongs to the same encounter (nr_atendimento) and matches t... | SUPERSEDE |
| `RULE-EVOLUCOES-008` | evolucoes | OK | When exposing the downloadable PDF URL for a clinical evolution document, the signed version (pdf_assinado) is returned if it exists; otherwise the... | SUPERSEDE |
| `RULE-EVOLUCOES-009` | evolucoes | OK | Releasing ("liberar") an evolution document to the external Tasy system only actually triggers the release if (a) the caller requested it AND (b) t... | SUPERSEDE |
| `RULE-EVOLUCOES-011` | evolucoes | AMBIGUOUS | A helper predicate that determines whether an evolution can be released, requiring simultaneously that the tipo is registered, the liberar flag is ... | VALIDATE |
| `RULE-EVOLUCOES-013` | evolucoes | OK | When building the print/PDF context for a nursing evolution, each assessment section (abdominal, cardiologic, genital, global, neurological, ventil... | SUPERSEDE |
| `RULE-EVOLUCOES-014` | evolucoes | OK | When rendering a medical evolution document, the associated vital-signs snapshot shown alongside it is the single most recent SinaisVitais record f... | SUPERSEDE |
| `RULE-EVOLUCOES-015` | evolucoes | OK | The nutritionist evolution's printed report does not track its own LPP (pressure injury) data; instead it looks up the most recently registered nur... | SUPERSEDE |
| `RULE-EVOLUCOES-016` | evolucoes | OK | When building the template context for rendering an evolution PDF, the patient's admission date (dt_entrada) is looked up from the Tasy-sourced Mic... | SUPERSEDE |
| `RULE-EVOLUCOES-017` | evolucoes | AMBIGUOUS | If the physician-form payload includes a 'sinais_vitais' block, the system derives the day from 'dt_registro' (format 'YYYY-MM-DD HH:MM'), looks up... | VALIDATE |
| `RULE-EVOLUCOES-020` | evolucoes | OK | The Save/OK button on the evolução-type drawer is hidden whenever a component type is selected and that type does not both allow adding (canAdd) an... | SUPERSEDE |
| `RULE-EVOLUCOES-021` | evolucoes | OK | For select, boolean, checkbox and multicheck fields, choosing an option value renders the additional fields listed under campo.conditions[value]. T... | SUPERSEDE |
| `RULE-EVOLUCOES-024` | evolucoes | OK | When a Sepse evolution record is created for a formulario, it is automatically linked to the most recently created SinaisVitais (vital signs) recor... | SUPERSEDE |
| `RULE-EVOLUCOES-025` | evolucoes | DISCREPANCY | When an evolution document is signed, the system validates the signer has a registered CPF+PIN, generates the signed PDF via the Cryptocubo integra... | REJECT |
| `RULE-EVOLUCOES-026` | evolucoes | OK | When a new evolution document is created with status == "liberado", the system automatically generates the PDF and attempts both signing and releas... | SUPERSEDE |
| `RULE-EVOLUCOES-027` | evolucoes | OK | Updating an evolution document first validates that it is editable at all (not inactive, and edited only by its original author), then — if the sub... | SUPERSEDE |
| `RULE-EVOLUCOES-028` | evolucoes | OK | On write, every form payload is stamped with tipo (the form's tipo_formulario), leito id, and nr_atendimento derived strictly from the 'ocupacoes__... | SUPERSEDE |
| `RULE-EVOLUCOES-029` | evolucoes | DISCREPANCY | The 'anterior_indicadores' GET action assembles a payload combining the patient, the most recent vital-signs record not in the future, the most rec... | REJECT |
| `RULE-EVOLUCOES-030` | evolucoes | DISCREPANCY | destroy() marks a Formulario as inactive (status="inativo") and logs an AcaoHomecare audit entry, but never calls self.validar_inativacao(instance)... | REJECT |
| `RULE-EVOLUCOES-031` | evolucoes | OK | Physician evolution form content blocks. | SUPERSEDE |
| `RULE-EVOLUCOES-032` | evolucoes | OK | Nursing evolution form (tipo_formulario='enfermagem') has no extra content blocks beyond the base 'impressao_geral'. | SUPERSEDE |
| `RULE-EVOLUCOES-033` | evolucoes | OK | Nursing-technician form has no extra content blocks beyond base 'impressao_geral'. | SUPERSEDE |
| `RULE-EVOLUCOES-034` | evolucoes | OK | Physiotherapist form content blocks. | SUPERSEDE |
| `RULE-EVOLUCOES-035` | evolucoes | OK | Clinical pharmacist form content blocks. | SUPERSEDE |
| `RULE-EVOLUCOES-036` | evolucoes | OK | Speech-language therapist form content blocks. | SUPERSEDE |
| `RULE-EVOLUCOES-037` | evolucoes | OK | Music-therapy form content blocks. | SUPERSEDE |
| `RULE-EVOLUCOES-038` | evolucoes | OK | Nutritionist form content blocks. | SUPERSEDE |
| `RULE-EVOLUCOES-039` | evolucoes | OK | Psychologist form content blocks. | SUPERSEDE |
| `RULE-EVOLUCOES-040` | evolucoes | OK | Generic therapist form has no extra content blocks beyond base 'impressao_geral'. | SUPERSEDE |
| `RULE-EVOLUCOES-041` | evolucoes | OK | Adverse-event/incident ("intercorrencia") form content blocks. | SUPERSEDE |
| `RULE-EVOLUCOES-042` | evolucoes | OK | Every clinical evolution/progress-note form has exactly one of three lifecycle states — saved as a draft (salvo), formally released/finalized (libe... | SUPERSEDE |
| `RULE-EVOLUCOES-043` | evolucoes | OK | An evolution formulario has a status among salvo, liberado, inativo (plus empty). Status drives available actions and the displayed icon/color, and... | SUPERSEDE |
| `RULE-EVOLUCOES-044` | evolucoes | OK | Releasing/signing an evolution patches it with status "liberado" and assinar true, merging the current form values (optionally adapted by adaptSubm... | SUPERSEDE |
| `RULE-EVOLUCOES-045` | evolucoes | OK | When a caregiver finishes filling an "evolução" (clinical progress note) form, a confirmation modal offers two actions: "Salvar" (save as draft, un... | SUPERSEDE |
| `RULE-EVOLUCOES-046` | evolucoes | OK | When opening the "Adicionar" tab, the new evolution form is prefilled from the patient's last saved form (getLastForm), with the registration datet... | SUPERSEDE |
| `RULE-EVOLUCOES-047` | evolucoes | OK | For any evolution-form route, a dedicated endpoint retrieves the "anterior_indicadores" (previous indicators) for the same bed occupation, allowing... | SUPERSEDE |
| `RULE-EVOLUCOES-055` | evolucoes | OK | A helper method exists that forbids inactivating (soft-deleting) a Formulario whose status is already "liberado" (released/finalized). | SUPERSEDE |
| `RULE-FORMULARIOS-CLINICOS-009` | formularios-clinicos | OK | Interventions performed during an incident; a boolean flag reveals a required free-text specific intervention. | SUPERSEDE |
| `RULE-FORMULARIOS-CLINICOS-015` | formularios-clinicos | OK | Disposition of an incident, from referral to medical/nursing/APH/hospital visits through telephone guidance to home death. | SUPERSEDE |
| `RULE-FORMULARIOS-CLINICOS-016` | formularios-clinicos | OK | Physiotherapy interventions selectable as respiratory and motor technique multichecks. | SUPERSEDE |
| `RULE-FORMULARIOS-CLINICOS-017` | formularios-clinicos | AMBIGUOUS | A dedicated icon component 'Intercorrencia.jsx' exists, named after the Portuguese clinical term 'intercorrência' (adverse event / complication / u... | VALIDATE |
| `RULE-FORMULARIOS-CLINICOS-037` | formularios-clinicos | AMBIGUOUS | Ten dedicated React icon components exist for named clinical/professional disciplines, implying the platform's multidisciplinary care-team model re... | VALIDATE |
| `RULE-FORMULARIOS-CLINICOS-038` | formularios-clinicos | DISCREPANCY | src/icons/Terapeuta.jsx and src/icons/Psicologo.jsx contain byte-for-byte identical SVG markup (same viewBox '0 0 785.771 658', identical path/circ... | REJECT |
| `RULE-INDICADORES-ETL-011` | indicadores-etl | OK | If a micro_indicador record exists and its PROC_INVASIVO flag == 'S' (yes), splits the comma-separated CD_PROC_INVASIVO code string and maps each r... | SUPERSEDE |
| `RULE-INDICADORES-ETL-015` | indicadores-etl | OK | Synchronizes Trilha rows from the Oracle Tasy hospital system (TrilhaTasy), restricted to source rows referenced in the last 30 days. For an existi... | SUPERSEDE |
| `RULE-INDICADORES-ETL-016` | indicadores-etl | DISCREPANCY | Newer version of the Tasy sync. Drops the 30-day date filter (scans ALL TrilhaTasy rows every run). Uses update_or_create keyed on nr_atendimento. ... | REJECT |
| `RULE-MOVIMENTACAO-ADT-011` | movimentacao-adt | AMBIGUOUS | OcupacaoSerializer.get_assistido returns instance.get_assistido - a model-level property/method defined in core/models (out of partition). The docs... | VALIDATE |
| `RULE-MOVIMENTACAO-ADT-017` | movimentacao-adt | OK | Clicking a trilha chip on a bed card routes to a different destination depending on the trilha's tipo: prescription and fluid-balance trilhas navig... | SUPERSEDE |
| `RULE-MOVIMENTACAO-ADT-018` | movimentacao-adt | OK | get_trilhas dispatches to _get_trilhas_automaticas for tipo=='automatica', to _get_trilhas_homecare for tipo=='homecare', and returns None (falls t... | SUPERSEDE |
| `RULE-MOVIMENTACAO-ADT-022` | movimentacao-adt | OK | LeitoViewSet.destroy() prevents deletion of a bed that has a Movimentacao with atual=True. | SUPERSEDE |
| `RULE-MOVIMENTACAO-ADT-023` | movimentacao-adt | OK | The action buttons available on an occupied/empty bed card are gated jointly by leito.tipo ("manual" vs "homecare") and role-based permission flags... | SUPERSEDE |
| `RULE-MOVIMENTACAO-ADT-031` | movimentacao-adt | OK | Closing a movimentacao is permitted only if it is the current one; it records discharge fields (motivo_baixa, data_saida, encerrado_por), deactivat... | SUPERSEDE |
| `RULE-MOVIMENTACAO-ADT-032` | movimentacao-adt | OK | First admission creates the prontuario and optional clinical sub-records, assembles the SOFA score inputs, marks the bed occupied, then creates pat... | SUPERSEDE |
| `RULE-MOVIMENTACAO-ADT-033` | movimentacao-adt | OK | MovimentacaoViewSet.create runs MovimentacaoValidation first, then forces registrado_por to the current user and leito to the leitos__pk URL kwarg ... | SUPERSEDE |
| `RULE-MOVIMENTACAO-ADT-034` | movimentacao-adt | OK | Creating a subsequent movimentacao deactivates the prior one and clones its prontuario and clinical sub-records (noradrenalina, PCR, ventilacao, se... | SUPERSEDE |
| `RULE-MOVIMENTACAO-ADT-035` | movimentacao-adt | OK | MovimentacaoNovaViewSet.create resolves the PREVIOUS Movimentacao from movimentacoes__pk, then forces the new record's paciente and leito to match ... | SUPERSEDE |
| `RULE-MOVIMENTACAO-ADT-036` | movimentacao-adt | DISCREPANCY | _get_trilhas_homecare returns a fixed 3-item list built by calling get_payload() at the CLASS level (PrescricaoContinua.get_payload(), BalancoHidri... | REJECT |
| `RULE-MOVIMENTACAO-ADT-037` | movimentacao-adt | OK | _get_trilhas_automaticas returns an empty list unless instance.ocupado is True; when occupied, it iterates the bed's configured automatic pathway m... | SUPERSEDE |
| `RULE-MOVIMENTACAO-ADT-038` | movimentacao-adt | OK | Saving prontuario data re-saves all four pathways (each recomputes its criteria) then re-aggregates the bed alert. | SUPERSEDE |
| `RULE-MOVIMENTACAO-ADT-042` | movimentacao-adt | OK | The 'vinculo' action on SetorPacienteViewSet syncs which patients a given user is linked to within a sector: it computes the difference between the... | SUPERSEDE |
| `RULE-MOVIMENTACAO-ADT-044` | movimentacao-adt | OK | When the patient-linking screen mounts, if the current professional has one or more sectors assigned, the first sector in their list is automatical... | SUPERSEDE |
| `RULE-MOVIMENTACAO-ADT-045` | movimentacao-adt | OK | When loading the list of patients for a sector on the patient-linking screen, the checkbox rows for patients that already have a vinculo (existing ... | SUPERSEDE |
| `RULE-MOVIMENTACAO-ADT-046` | movimentacao-adt | OK | Marking a specific care-pathway (trilha) on a bed occupancy as attended-to ("assistido") is performed via a dedicated POST endpoint accepting a par... | SUPERSEDE |
| `RULE-MOVIMENTACAO-ADT-047` | movimentacao-adt | OK | Records whether a cardiac arrest occurred and its datetime, in a nullable group. | SUPERSEDE |
| `RULE-MOVIMENTACAO-ADT-052` | movimentacao-adt | OK | Each bed (Ocupacao.Filter.tipo, Ocupacao.Leito.tipo) and each company (Usuario.Empresa.tipo) is classified into exactly one of three care/monitorin... | SUPERSEDE |
| `RULE-MOVIMENTACAO-ADT-063` | movimentacao-adt | OK | Boolean diagnosis flags recorded on the movimentacao (transfer/round) form that drive downstream care pathways. | SUPERSEDE |
| `RULE-NUTRICAO-003` | nutricao | OK | Nutrition pathway (= nutricao / trilha6): per-criterion alert text and recommendations covering diet prescription, SNE need, tolerance/gastric-resi... | VALIDATE |
| `RULE-NUTRICAO-007` | nutricao | OK | In the dietitian "Objetivos diarios e pendencias" group, each diet-route toggle, when true, reveals a corresponding prescribed-detail field (consis... | SUPERSEDE |
| `RULE-OPERACIONAL-INFRA-003` | operacional-infra | OK | PrescricoesOfflineSerializer.get_prescricoes looks up the bed's prescriptions from a context-supplied dict (keyed by nr_atendimento, pre-filtered/p... | SUPERSEDE |
| `RULE-OPERACIONAL-INFRA-019` | operacional-infra | DISCREPANCY | BalancoHidricoOfflineSerializer.get_balanco_hidrico fetches only the 2 most recent (order_by('-dia')[:2]) BalancoHidrico (fluid balance) records fo... | REJECT |
| `RULE-PIORA-CLINICA-012` | piora-clinica | OK | Every time a SinaisVitais (vital signs) record is created, the system automatically creates a linked PioraClinica ("clinical worsening") record for... | SUPERSEDE |
| `RULE-PRESCRICAO-008` | prescricao | OK | Updating a scheduled prescription dose (HorariosPrescricao) branches into one of four mutually exclusive flows depending on which fields are presen... | SUPERSEDE |
| `RULE-PRESCRICAO-009` | prescricao | OK | In the prescription-check PDFs, each scheduled dose horario is rendered with a tri-state status icon and an actor label derived from the 'administr... | SUPERSEDE |
| `RULE-PRESCRICAO-010` | prescricao | OK | Scheduled task that materialises today's continuous prescriptions from the Tasy-sourced Prescricao table. A candidate prescription is first filtere... | SUPERSEDE |
| `RULE-PRESCRICAO-011` | prescricao | OK | A prescription horario (scheduled administration time) is rendered in a status color chosen by a strict priority ladder over its boolean/string sta... | SUPERSEDE |
| `RULE-PRESCRICAO-012` | prescricao | OK | The onOk dispatcher decides the backend operation for a horario from the presence of horarioId and body. | SUPERSEDE |
| `RULE-PRESCRICAO-013` | prescricao | OK | In the check modal, if the administration time was changed (hasHourChanged), the primary button offers a two-way choice; otherwise it submits direc... | VALIDATE |
| `RULE-PRESCRICAO-014` | prescricao | DISCREPANCY | Whether the requesting user may delete a scheduled-dose (HorariosPrescricao) record. Both serializers allow it for the original creator (criado_por... | REJECT |
| `RULE-PRESCRICAO-015` | prescricao | OK | The "Deletar Horario" button in the check modal is rendered only when horario.can_delete is true, and requires a confirmation popconfirm before iss... | SUPERSEDE |
| `RULE-PRESCRICAO-019` | prescricao | OK | Reconciliation captures high-risk medication classes, treatment adherence (low adherence requires a reason), admission-reconciliation decision and ... | SUPERSEDE |
| `RULE-PRESCRICAO-023` | prescricao | OK | A suspended horario cannot be checked, edited, or acted upon. Clicking a suspended tag shows a warning and no modal/action opens; all check handler... | SUPERSEDE |
| `RULE-PRESCRICAO-024` | prescricao | OK | Clicking the right-hand circle button on a pending horario marks it administered directly (administrado:true) with no modal, provided it is not yet... | SUPERSEDE |
| `RULE-PRESCRICAO-025` | prescricao | OK | When submitting the administration-check modal, the payload is transformed: reason is set only when not administered; exported quantity defaults to... | SUPERSEDE |
| `RULE-PRESCRICAO-026` | prescricao | OK | Reverting a previously-checked horario requires a mandatory free-text cancellation justification and sets administrado=false on the horario. | SUPERSEDE |
| `RULE-PRESCRICAO-028` | prescricao | AMBIGUOUS | A scheduled medication administration time (Prescricao.Horario) carries "administrado" (administered) and "suspenso" (suspended) booleans, an optio... | VALIDATE |
| `RULE-PRESCRICAO-030` | prescricao | OK | When a medication is marked NOT administered, a reason must be selected from a fixed enum; choosing "outros" requires an additional free-text field. | SUPERSEDE |
| `RULE-PRESCRICAO-031` | prescricao | OK | Creating a new administration horario requires a mandatory time picker; the value is serialized as HH:mm and posted as a new horario. | SUPERSEDE |
| `RULE-PRESCRICAO-038` | prescricao | OK | Free-text prophylaxis fields covering constipation/diarrhea, delirium, glycemic control, tube meds, VTE, stress-ulcer, analgesia and sedation. | VALIDATE |
| `RULE-PROFILAXIA-005` | profilaxia | DISCREPANCY | criterio_1 predicate: no PPI/cimetidine prescribed AND at least one stress-ulcer prophylaxis indication present (noradrenaline in balance; OR mecha... | REJECT |
| `RULE-PROFILAXIA-006` | profilaxia | OK | criterio_9 predicate: prescription of double-lumen central venous puncture OR double-lumen hemodialysis catheter OR indwelling bladder catheter (de... | VALIDATE |
| `RULE-PROFILAXIA-007` | profilaxia | OK | profilaxia v1 recommendation catalog for the non-dosing criteria: stress-ulcer (LAMGD) prophylaxis start/stop, early mobilization, insertion bundle... | VALIDATE |
| `RULE-PROFILAXIA-008` | profilaxia | AMBIGUOUS | profilaxia v3 facade recommendation catalog returning ONLY criterio_1 (LAMGD prophylaxis) and criterio_9 (invasive-procedure insertion bundle); cri... | VALIDATE |
| `RULE-SEDACAO-015` | sedacao | OK | Flags any single sedative dose above 15 ml as overdose. | VALIDATE |
| `RULE-SEDACAO-016` | sedacao | DISCREPANCY | Flags deeply sedated (RASS -2..-5) patients on low ventilatory support (FiO2 <=40 and PEEP low). | REJECT |
| `RULE-SEDACAO-017` | sedacao | OK | Flags patient with P/F > 200 who is still on a sedative (candidate to lighten sedation). | VALIDATE |
| `RULE-SEDACAO-018` | sedacao | AMBIGUOUS | Flags patient on a sedative who ALSO has P/F>=200 or EME or SHIC or PCR in last 24h. | VALIDATE |
| `RULE-SEDACAO-019` | sedacao | OK | Flags P/F<200 combined with light RASS (>= -2) or no sedative. | VALIDATE |
| `RULE-SEDACAO-020` | sedacao | OK | Flags absence of sedative while patient has poor P/F (<200) or SHIC or PCR-24h or EME. | VALIDATE |
| `RULE-SEDACAO-022` | sedacao | AMBIGUOUS | Determines whether a cardiac-arrest event counts as 'in the last 24h' for the manual sedation criteria. | VALIDATE |
| `RULE-SEPSE-059` | sepse | OK | Sepsis pathway variant B (payload_sepse_automatica). 27 flagged-criterion alert labels plus one shared "recomendacao" block prescribing the sepsis ... | VALIDATE |
| `RULE-SEPSE-060` | sepse | AMBIGUOUS | Sepsis pathway variant A: nested {"criterios": {...}} structure with 11 qualitative alert flags and a single global recommendation naming a specifi... | VALIDATE |
| `RULE-SEPSE-063` | sepse | OK | Clinical decision-support text for the "status_hemodinamico" item: consider orotracheal intubation with sedoanalgesia targeting RASS -2 when poor p... | VALIDATE |
| `RULE-SEPSE-064` | sepse | OK | Clinical decision-support text for the "dispositivos_invasivos" item: prefer early noradrenaline via calibrous peripheral access, secure central ve... | VALIDATE |
| `RULE-SEPSE-071` | sepse | OK | A new interactive sepsis protocol may be created only when no open interactive trilha exists, the last concluded one is >3 days old (or none), the ... | SUPERSEDE |
| `RULE-SEPSE-072` | sepse | OK | Creating an interactive SEPSE trilha with aceito=true stamps the acceptance time, sets the parent TrilhaSepseV3 alert to "LARANJA" (orange), genera... | SUPERSEDE |
| `RULE-SEPSE-073` | sepse | DISCREPANCY | Creating an interactive SEPSE trilha with aceito falsy marks it finalized, sets the parent TrilhaSepseV3 alert to "NEUTRO" and assistido=true, and ... | REJECT |
| `RULE-SEPSE-074` | sepse | OK | Updating an interactive SEPSE trilha that was previously accepted so that aceito becomes falsy closes the protocol: sets encerrado=true, finalizado... | SUPERSEDE |
| `RULE-SEPSE-075` | sepse | OK | Checking a SEPSE item (transition not-checado -> checado) stamps horario_checagem=now and posts an item-specific documentation observation, appendi... | SUPERSEDE |
| `RULE-SEPSE-076` | sepse | OK | Accepting the SEPSE protocol instantiates exactly seven checklist items in two bundles. The "primeira_hora" (hour-1) bundle: request labs, start/es... | VALIDATE |
| `RULE-SEPSE-077` | sepse | OK | When a SEPSE checklist item is submitted as checado=true, the checker identity (checado_por_id) is automatically set to the authenticated request u... | SUPERSEDE |
| `RULE-SEPSE-078` | sepse | OK | Automatic dispatch only fires for interactive-sepsis checklist items belonging to the 'first hour' bundle that are not yet checked; runs repeatedly... | VALIDATE |
| `RULE-SEPSE-079` | sepse | DISCREPANCY | Auto-marks the 'solicitacao_exame' first-hour item as done when the bed's first CPOE record carries a sepsis protocol, and posts a system observation. | REJECT |
| `RULE-SEPSE-080` | sepse | OK | Auto-marks 'inicio_escalonamento_antimicrobiano' done when a CPOE updated within the 24h preceding the interactive pathway's creation time has a no... | VALIDATE |
| `RULE-SEPSE-081` | sepse | OK | Auto-marks 'realizacao_expansao_volemica' done when an ADEP administration record updated within the 4h preceding pathway creation shows lactated-R... | VALIDATE |
| `RULE-SEPSE-082` | sepse | OK | Every time a SinaisVitais record is created, the system automatically creates a linked Sepse (sepsis-screening) record for the same encounter, asso... | SUPERSEDE |
| `RULE-SEPSE-083` | sepse | OK | TrilhaInterativaViewSet.get_queryset returns TrilhaSepseV3Model rows whose leito matches the 'ocupacoes__pk' URL kwarg directly (treated as a Leito... | SUPERSEDE |
| `RULE-SEPSE-084` | sepse | OK | Given the loaded occupancy (ocupacao) record, the sepsis page selects the applicable care-pathway (trilha) as the first element of ocupacao.trilhas... | SUPERSEDE |
| `RULE-SEPSE-085` | sepse | OK | A "trilha interativa" (interactive checklist instance) attached to the current sepsis pathway is considered finished, and is moved from "current" t... | SUPERSEDE |
| `RULE-SEPSE-086` | sepse | AMBIGUOUS | The list of "previous" (trilhasInterativasAnteriores) interactive sepsis pathway instances, shown as dated history tabs, is fetched with an explici... | VALIDATE |
| `RULE-SEPSE-087` | sepse | OK | The back button on the sepsis interactive-pathway page navigates to the parent sector page with query parameters that identify the sepsis trilha, o... | SUPERSEDE |
| `RULE-SEPSE-089` | sepse | OK | The "Protocolo Atual" tab is only rendered if trilhaInterativaAtual exists AND its itens_trilha_interativa (checklist items) field is truthy/non-em... | SUPERSEDE |
| `RULE-SEPSE-090` | sepse | OK | Renders the state of an accepted sepsis interactive protocol (trilha interativa). It always shows who accepted it and the acceptance timestamp. If ... | SUPERSEDE |
| `RULE-SEPSE-091` | sepse | OK | A sepsis protocol step is rendered only when item.exibir is true. A shown step is expandable (collapsible) only when it has a description (descrica... | SUPERSEDE |
| `RULE-SEPSE-092` | sepse | OK | Each sepsis protocol step can be checked off. The checkbox is interactive only when an onCheck handler is supplied (otherwise read-only). Toggling ... | SUPERSEDE |
| `RULE-SEPSE-093` | sepse | AMBIGUOUS | The sepsis interactive-pathway record (TrilhaInterativa.Sepse) carries two distinct boolean completion-related flags — "finalizado" and "concluida"... | VALIDATE |
| `RULE-SEPSE-094` | sepse | OK | A sepsis care-pathway (trilha) can be either accepted (aceito=true) or discarded with a mandatory reason (motivo_descartado), with the deciding act... | SUPERSEDE |
| `RULE-SEPSE-096` | sepse | OK | Enumerates the interactive sepsis protocol packages (primeira_hora = first hour; reavaliacao = reassessment) and the bundle item names, including t... | VALIDATE |
| `RULE-SEPSE-097` | sepse | OK | Custom Django permission gating who may refuse (recusar) the sepsis protocol. | SUPERSEDE |
| `RULE-SINAIS-VITAIS-007` | sinais-vitais | OK | Deleting a SinaisVitais record marks it deleted by the current user and logs an AcaoHomecare audit entry ("inativar" on "sinal_vital"). Unlike Entr... | SUPERSEDE |
| `RULE-TENANCY-ORGANIZACAO-016` | tenancy-organizacao | OK | The `tipo` field ("manual"/"automatica"/"homecare"/"") selects which pathway engine and alert logic apply to a bed/sector/establishment/company. | SUPERSEDE |
| `RULE-TENANCY-ORGANIZACAO-030` | tenancy-organizacao | OK | get_total_assistidos: 'manual' counts via Python loop over Movimentacao.dados_prontuario.get_assistido(); 'automatica' filters leitos (ocupado=True... | SUPERSEDE |
| `RULE-TENANCY-ORGANIZACAO-032` | tenancy-organizacao | OK | EstabelecimentoViewSet.destroy() prevents deletion if any of the establishment's sectors has a bed with an active (atual=True) Movimentacao. | SUPERSEDE |
| `RULE-TENANCY-ORGANIZACAO-036` | tenancy-organizacao | OK | get_total_assistidos counts patients considered 'assistido' (attended-to) differently per sector tipo: 'manual' iterates Movimentacao records in Py... | SUPERSEDE |
| `RULE-TENANCY-ORGANIZACAO-037` | tenancy-organizacao | DISCREPANCY | SetorViewSet.destroy() prevents deletion if ANY of the sector's beds has a Movimentacao with atual=True; the error message text refers to 'leito' (... | REJECT |
| `RULE-TRILHAS-ENGINE-001` | trilhas-engine | DISCREPANCY | Which automatic care-pathway models are evaluated for an automatic bed = the v3 set followed by the v2 set; several legacy v2 pathways are commente... | REJECT |
| `RULE-TRILHAS-ENGINE-002` | trilhas-engine | OK | Homecare beds evaluate exactly two pathway models — PioraClinica and Sepse. | SUPERSEDE |
| `RULE-TRILHAS-ENGINE-003` | trilhas-engine | AMBIGUOUS | Resolves the active care-pathway (trilha) record for a bed (leito) and encounter, branching on the bed's tipo. 'automatica' returns the first match... | VALIDATE |
| `RULE-TRILHAS-ENGINE-009` | trilhas-engine | OK | The platform defines nine automatic care pathways (trilhas), each bound to a v3 Tasy source model, a local target model, and a fixed number of clin... | VALIDATE |
| `RULE-TRILHAS-ENGINE-011` | trilhas-engine | OK | Each prontuario (dados_prontuario) spawns exactly four manual care pathways — TrilhaEstabilidade, TrilhaSedacao, TrilhaSepse, TrilhaVentilacao — cr... | SUPERSEDE |
| `RULE-TRILHAS-ENGINE-012` | trilhas-engine | AMBIGUOUS | For a given bed (leito), ensures the patient has exactly one instance of each of the five automatic v3 care pathways (Eficiencia, Sedacao, Estabili... | VALIDATE |
| `RULE-TRILHAS-ENGINE-013` | trilhas-engine | AMBIGUOUS | Formats an internal trilha (care-pathway) identifier for display by splitting it at a FIXED 6-character boundary, capitalizing each part and joinin... | VALIDATE |
| `RULE-TRILHAS-ENGINE-014` | trilhas-engine | OK | Accepting a protocol POSTs { aceito: true }, refreshes the occupancy, and navigates to the protocol screen. The Accept button is disabled once a pr... | SUPERSEDE |
| `RULE-TRILHAS-ENGINE-015` | trilhas-engine | AMBIGUOUS | Refusing a protocol requires a free-text justification (motivo_descartado, required) and submits aceito = "false". If a protocol instance already e... | VALIDATE |
| `RULE-TRILHAS-ENGINE-016` | trilhas-engine | OK | For each red-alert criterion of a pathway, the UI lists its recommendations followed by its interventions. When intervencoes exist they are concate... | VALIDATE |
| `RULE-TRILHAS-ENGINE-018` | trilhas-engine | DISCREPANCY | Canonical set of 12 clinical care-pathway ("trilha") type slugs an assist record / observation can reference. Two backend copies exist — AssistidoC... | REJECT |
| `RULE-VENTILACAO-003` | ventilacao | DISCREPANCY | Flags inspiratory pressure > 16 OR tidal volume > 500 ml. Also a hard alert-forcing criterion. | REJECT |
| `RULE-VENTILACAO-004` | ventilacao | DISCREPANCY | Flags a PEEP value not matching the expected FiO2->PEEP table AND P/F ratio between 151 and 300. | REJECT |
| `RULE-VENTILACAO-005` | ventilacao | DISCREPANCY | Flags a PEEP not matching the (different, severe) FiO2->PEEP table AND P/F ratio < 150. | REJECT |
| `RULE-VENTILACAO-006` | ventilacao | AMBIGUOUS | The prior (inactive) version compared PEEP against a single expected value per FiO2 bucket. | VALIDATE |
| `RULE-VENTILACAO-007` | ventilacao | DISCREPANCY | Flags (long VM with good oxygenation on controlled mode without sedation) OR RASS>=-2 OR Glasgow>8. | REJECT |
| `RULE-VENTILACAO-008` | ventilacao | OK | Flags more than 10 days of mechanical ventilation via orotracheal tube (dispositivo == "tot"). | VALIDATE |
| `RULE-VENTILACAO-009` | ventilacao | DISCREPANCY | Flags TOT ventilation > 10 days AND COVID-19 diagnosis. | REJECT |
| `RULE-VENTILACAO-010` | ventilacao | OK | Flags P/F<150 AND noradrenaline dose<25 AND admission length>7 days. | VALIDATE |
| `RULE-VENTILACAO-011` | ventilacao | DISCREPANCY | Flags a full readiness bundle - awake, >1d VM, low PEEP/FiO2, adequate FR and oxygenation, no noradrenaline. Hard alert-forcing criterion. | REJECT |
| `RULE-VENTILACAO-012` | ventilacao | OK | Flags noradrenaline present AND lactate>2.5 AND no mechanical ventilation. Hard alert-forcing criterion. | VALIDATE |
| `RULE-VENTILACAO-013` | ventilacao | OK | Flags SatO2>96 OR PO2>100 OR (COPD AND SatO2>92). | VALIDATE |
| `RULE-VENTILACAO-017` | ventilacao | OK | Ventilation pathway facade (= ventilacao_automatica): lung-protective ventilation, PEEP/FiO2 table titration, spontaneous-breathing readiness, trac... | VALIDATE |
| `RULE-VENTILACAO-019` | ventilacao | OK | Ventilation type conditionally reveals invasive-VM parameters (with ranges) or a supplemental-O2 flow field. | VALIDATE |
| `RULE-VENTILACAO-020` | ventilacao | DISCREPANCY | Ventilation type reveals spontaneous vs invasive vs non-invasive parameter sets; nested intermittent mode reveals hourly load and shift; PEEP/PINS ... | REJECT |
| `RULE-VENTILACAO-024` | ventilacao | DISCREPANCY | Returns, for a given ventilation category key, the list of free-text strings treated as belonging to that category; used by trilha models to bucket... | REJECT |

## 4. Reading notes

- SOURCE for every row: `docs/rules/care-pathway/<Rule ID>-*.md` at the pinned
  commit; hash in the pin manifest.
- The 30 DISCREPANCY records are the cluster's own admission that documentation and
  implementation diverged; 19 AMBIGUOUS records admit extraction uncertainty. Only
  162 of 211 records self-report OK — and OK means "extraction matches code," not
  "clinically correct."
- INFERENCE: the clinical-criterion subsets (ESTABILIDADE C1-C6, SEDACAO C1-C6,
  VENTILACAO C1-C10, the SEPSE variant-A/variant-B catalogs, PROFILAXIA criteria)
  overlap the twelve pathway YAMLs' content only partially — e.g. the manual
  ESTABILIDADE criteria reference capillary refill and dobutamine logic absent from
  `estabilidade.yaml`. The YAMLs are NOT a faithful port of this catalog; treating
  either as the authority for the other would be unfounded.
