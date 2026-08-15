---
doc_id: GOV-BLOCKERS-REGISTER
status: OPEN
owner: UNASSIGNED — VALIDATION REQUIRED
source: Gate G0 criteria, INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §5 lines 239-249
last_updated: 2026-08-15
---

# Blockers Register — Gate G0 (Authority and Access)

SOURCE (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:239-249`): Gate G0 cannot close
until the new repository exists and legacy/AMH sources are read-only, GitHub
App access is revalidated, AMH pinning/license/authority are recorded,
product/clinical-safety/security/privacy-legal/data-platform/UX/operations
decision owners are named, intended use has a named approver, and unknowns
have owners and dates. Every blocker below names the exact gap and the exact
text to send to unblock it. No blocker in this register is closed by this
task — closing requires the named human to act.

## Entry template

```yaml
id: BLK-NNNN
title: <short title>
status: OPEN | CLOSED
what_is_blocked: <what cannot proceed>
who_must_act: <AUTH-* role, UNASSIGNED — VALIDATION REQUIRED>
unblock_request: >
  <exact text to send to request the unblock>
gate: G0
links: []
```

## BLK-0001 — No named product decision owner

```yaml
id: BLK-0001
title: No named product decision owner
status: RESOLVIDO (interino)
what_is_blocked: >
  Product scope, prioritization, outcome-tree acceptance, and any PROPOSAL
  reaching DECIDED status for product decisions.
who_must_act: AUTH-PRODUCT — UNASSIGNED — VALIDATION REQUIRED
unblock_request: >
  "Please name one accountable human as the IntensiCare V2 product decision
  owner (AUTH-PRODUCT). This person accepts product scope, prioritization,
  and non-clinical requirement decisions, and must not self-approve where
  independence rules apply. Reply with the name, role/title, and
  organizational reporting line."
gate: G0
links: [RISK-0001, GDEC-0004]
```

**Resolução (2026-08-15, DEC-G0-01, decidida por rodaquino-OMNI):**
rodaquino-OMNI assume `AUTH-PRODUCT` em caráter interino. Gatilho de revisão
registrado: entrada de um líder de produto ou parceiro comercial. Ver
`docs/00-governance/registers/g0-resolucoes-2026-08-15.md` e
`decision-register.md` `GDEC-0004`.

## BLK-0002 — No named clinical safety decision owner

```yaml
id: BLK-0002
title: No named clinical safety decision owner
status: OPEN
what_is_blocked: >
  Hazard acceptance, safety-case sign-off, residual-risk acceptance, and
  clinical rule-content ratification (rule author independence cannot be
  enforced without this role).
who_must_act: AUTH-CLINSAFETY — UNASSIGNED — VALIDATION REQUIRED
unblock_request: >
  "Please name one accountable, clinically qualified human as the
  IntensiCare V2 clinical safety decision owner (AUTH-CLINSAFETY). This
  person accepts hazard analyses, safety-case arguments, and residual
  clinical risk, and must not be the same person who authors clinical rule
  content for the item under review. Reply with the name, clinical
  credential/qualification, and organizational reporting line."
gate: G0
links: [RISK-0001, GDEC-0003]
```

**Partial resolution 2026-08-15 (GDEC-0003, DECIDED by rodaquino-OMNI):**
rodaquino-OMNI (self-attested practicing intensivist, repository owner)
accepted in writing the role of named clinical reviewer and clinical-content
approver — candidate AUTH-CLINSAFETY holder — **scoped to cycle-1 artifacts**.
This names the clinical-content ratification authority that rule authorship
required. The blocker stays **OPEN** because the full role remains
unestablished: credential/qualification and organizational reporting line are
self-attested and not independently verified; residual-risk and hazard
acceptance beyond cycle-1 clinical-content review are not covered; and a
second reviewer is required for any content rodaquino-OMNI personally authors
(author ≠ approver applies to humans too). See
`decision-register.md` GDEC-0003.

## BLK-0003 — No named security decision owner

```yaml
id: BLK-0003
title: No named security decision owner
status: RESOLVIDO COM ESCOPO
what_is_blocked: >
  Threat-model acceptance, penetration-test acceptance, and security
  exception approval.
who_must_act: AUTH-SECURITY — UNASSIGNED — VALIDATION REQUIRED
unblock_request: >
  "Please name one accountable human as the IntensiCare V2 security decision
  owner (AUTH-SECURITY). This person accepts threat models and
  penetration-test results, and must not be the same person who implements
  the security control under review. Reply with the name, role/title, and
  organizational reporting line."
gate: G0
links: [RISK-0001, GDEC-0004]
```

**Resolução (2026-08-15, DEC-G0-02, decidida por rodaquino-OMNI):**
rodaquino-OMNI assume `AUTH-SECURITY` **somente para decisões de fase de
projeto**. Restrição vinculante: a aceitação do Gate G6 (resultados de teste
de intrusão, risco residual de segurança) exige verificador terceiro
independente e qualificado — o titular pode aceitar o laudo, mas não pode ser
o verificador (par de independência do prompt §4: implementador de controle ≠
verificador de intrusão — preservado, não relaxado por esta decisão). Ver
`decision-register.md` `GDEC-0004`.

## BLK-0004 — No named privacy/legal decision owner

```yaml
id: BLK-0004
title: No named privacy/legal decision owner
status: RECLASSIFICADO (G0 → G6/G8)
what_is_blocked: >
  LGPD legal-basis determination, processor-terms review, data-residency and
  retention decisions, and legal-hold handling. Blocks any conclusion of
  legal sufficiency for PHI handling.
who_must_act: AUTH-PRIVACY-LEGAL — UNASSIGNED — VALIDATION REQUIRED
unblock_request: >
  "Please name one accountable human (qualified in Brazilian LGPD and
  healthcare data law) as the IntensiCare V2 privacy/legal decision owner
  (AUTH-PRIVACY-LEGAL). This person accepts legal-basis, retention, and
  residency decisions for PHI. Reply with the name, legal
  credential/qualification, and organizational reporting line."
gate: G0 (reclassificado; deixa de bloquear G0, passa a ser pré-condição de G6/G8)
links: [RISK-0001, GDEC-0004]
```

**Resolução (2026-08-15, DEC-G0-03, decidida por rodaquino-OMNI) —
Reclassificado G0 → G6/G8:** nenhum titular jurídico é nomeado agora. O
desenvolvimento prossegue **exclusivamente com dados sintéticos** (nenhum
dado real, nenhum tratamento de dados pessoais → sem determinação de base
legal pendente nesta fase). Agentes redigem material jurídico/privacidade
apenas como **sugestão**; advogados da organização revisarão e aceitarão
futuramente. Gatilho obrigatório: parecer jurídico brasileiro antes de
qualquer teste de conformidade com dados reais, operação sombra ou piloto
(Gates G6/G8). Este bloqueador deixa de impedir o fechamento do Gate G0 e
passa a ser rastreado como pré-condição dos Gates G6/G8. Ver
`decision-register.md` `GDEC-0004`.

## BLK-0005 — No named data-platform decision owner

```yaml
id: BLK-0005
title: No named data-platform decision owner
status: RESOLVIDO
what_is_blocked: >
  AMH boundary decisions, AMH×IntensiCare contract acceptance (jointly with
  an AMH owner — see BLK-0010), and data-quality policy acceptance.
who_must_act: AUTH-DATA-PLATFORM — UNASSIGNED — VALIDATION REQUIRED
unblock_request: >
  "Please name one accountable human as the IntensiCare V2 data-platform
  decision owner (AUTH-DATA-PLATFORM). This person accepts the AMH
  compatibility boundary and contract decisions jointly with a named AMH
  owner. Reply with the name, role/title, and organizational reporting
  line."
gate: G0
links: [RISK-0001, GDEC-0004, GDEC-0005]
```

**Resolução (2026-08-15, DEC-G0-04, decidida por rodaquino-OMNI):**
rodaquino-OMNI assume `AUTH-DATA-PLATFORM` (lado V2) **e** declara deter a
autoridade do lado AMH, na qualidade de CEO e acionista principal de ambas as
empresas (OMNI e AMH) — resolve, dos dois lados, o que também bloqueava
`BLK-0010`. Consequência imediata: as questões de adjudicação `AQ-1`…`AQ-6` e
as contradições `IDN-C-1`…`IDN-C-5`
(`docs/08-interoperability/amh-data/identity-adjudication/`) tornam-se
respondíveis em sessão dedicada — ver
`adjudicacao-decisoes-2026-08-15.md` e `decision-register.md` `GDEC-0005`. Ver
também `GDEC-0004`.

## BLK-0006 — No named UX decision owner

```yaml
id: BLK-0006
title: No named UX decision owner
status: RESOLVIDO COM RESTRIÇÃO
what_is_blocked: >
  Participant-research acceptance, accessibility sign-off, and workflow
  acceptance (independent of the UX designer who ran the research).
who_must_act: AUTH-UX — UNASSIGNED — VALIDATION REQUIRED
unblock_request: >
  "Please name one accountable human as the IntensiCare V2 UX decision owner
  (AUTH-UX). This person accepts participant-research findings and
  accessibility sign-off, and must not be the same person who moderated the
  research session under review. Reply with the name, role/title, and
  organizational reporting line."
gate: G0
links: [RISK-0001, GDEC-0004]
```

**Resolução (2026-08-15, DEC-G0-05, decidida por rodaquino-OMNI):**
rodaquino-OMNI assume `AUTH-UX` em caráter interino. Restrição registrada: o
conhecimento clínico próprio do titular vale como **insumo de hipótese de
especialista**, nunca como evidência de observação do Gate G1 — o G1 continua
exigindo participantes clínicos externos (dono da aceitação ≠ moderador da
pesquisa ≠ participante único, preservado). Ver `decision-register.md`
`GDEC-0004`.

## BLK-0007 — No named operations decision owner

```yaml
id: BLK-0007
title: No named operations decision owner
status: RESOLVIDO
what_is_blocked: >
  SLO/RTO/RPO acceptance and operational go-live readiness decisions.
who_must_act: AUTH-OPERATIONS — UNASSIGNED — VALIDATION REQUIRED
unblock_request: >
  "Please name one accountable human as the IntensiCare V2 operations
  decision owner (AUTH-OPERATIONS). This person accepts SLO/RTO/RPO targets
  and operational readiness evidence, and must not be the same person who
  owns the release pipeline for the item under review. Reply with the name,
  role/title, and organizational reporting line."
gate: G0
links: [RISK-0001, GDEC-0004]
```

**Resolução (2026-08-15, DEC-G0-06, decidida por rodaquino-OMNI):**
rodaquino-OMNI assume `AUTH-OPERATIONS` em caráter interino. Gatilho de
revisão já registrado: na prontidão de piloto (Gate G8), o par de
independência "dono do pipeline de release ≠ autoridade de go-live" exigirá
um segundo humano. Ver `decision-register.md` `GDEC-0004`.

## BLK-0008 — No named intended-use approver

```yaml
id: BLK-0008
title: No named intended-use approver
status: OPEN
what_is_blocked: >
  Approval of the intended-use statement (care setting, population,
  exclusions, advisory-vs-directive boundary). Gate G1 (problem and intended
  use) cannot open meaningfully without this, and solution architecture
  approval is blocked per Gate G1's own precondition.
who_must_act: AUTH-INTENDED-USE — UNASSIGNED — VALIDATION REQUIRED
unblock_request: >
  "Please name one accountable human as the IntensiCare V2 intended-use
  approver (AUTH-INTENDED-USE). This person approves the care setting,
  patient population, exclusions, and advisory-versus-directive boundary
  before any solution architecture is approved. Reply with the name,
  clinical/regulatory credential if applicable, and organizational reporting
  line."
gate: G0
links: [RISK-0001, GDEC-0003]
```

**Partial resolution 2026-08-15 (GDEC-0003, DECIDED by rodaquino-OMNI):**
rodaquino-OMNI accepted in writing the candidate AUTH-INTENDED-USE holder
role **scoped to cycle-1 artifacts** (clinical-content review and approval).
The blocker stays **OPEN**: the intended-use statement itself
(`docs/01-vision-and-intended-use/`) remains a PROPOSAL not yet reviewed or
approved by the named reviewer, and permanent role acceptance with verified
credential and reporting line is outstanding. See `decision-register.md`
GDEC-0003.

## BLK-0009 — GitHub App installation access not revalidated

```yaml
id: BLK-0009
title: GitHub App installation access on rodaquino-OMNI not revalidated (OAuth token observed instead)
status: RESOLVIDO POR RATIFICAÇÃO
what_is_blocked: >
  Gate G0's requirement that "access through the GitHub App installation
  owned by rodaquino-OMNI to Omni-Saude/amh-data-platform has been
  revalidated" cannot be confirmed. What was observed (EVID-0007) is a gh CLI
  OAuth token, not confirmation of the App installation itself
  (ASM-0001). Any AMH-dependent decision that relies on the specific
  access-control properties of a GitHub App installation (as opposed to a
  personal OAuth token) is unverified.
who_must_act: AUTH-DATA-PLATFORM and AUTH-SECURITY — both UNASSIGNED — VALIDATION REQUIRED
unblock_request: >
  "Please confirm whether a GitHub App is installed for account
  rodaquino-OMNI on Omni-Saude/amh-data-platform, and if so, revalidate that
  installation's access and permission scope without exposing credentials.
  If no App installation exists, please confirm whether the gh CLI OAuth
  token (scopes: gist, read:org, repo, workflow) is the sanctioned access
  mechanism for AMH repository inspection, and update
  INTENSICARE_V2_ORCHESTRATOR_PROMPT.md's access-method description
  accordingly. Reply with the determination and the name of who confirmed
  it."
gate: G0
links: [RISK-0001, ASM-0001, GDEC-0004, EVID-0011]
```

**Resolução (2026-08-15, DEC-G0-07, decidida por rodaquino-OMNI):** mecanismo
de acesso ratificado — OAuth `gh` no usuário `rodaquino-OMNI` (proprietário
dos repositórios OMNI). OBSERVADO em 2026-08-15: acesso a
`Omni-Saude/amh-data-platform` verificado funcional **sem novo login** (ver
`evidence-register.md` `EVID-0011`). A descrição da variável de runtime do
prompt ("GitHub App installation") fica **emendada** para refletir o
mecanismo real observado. Item de melhoria, não bloqueador: credencial de
escopo fino somente-leitura restrita ao `amh-data-platform`, para substituir
o token amplo. Controle compensatório vigente: política de zero escrita da V2
em repositórios AMH (`../legacy-import-policy.md` §1). Ver
`decision-register.md` `GDEC-0004`. **Nota do steward:** `ASM-0001`
permanece registrada como corpus de ciclo 0 (não retraduzida); esta resolução
não a apaga, apenas a supera na prática — recomenda-se ao próximo ciclo
atualizar o `status` de `ASM-0001` para refletir a ratificação.

## BLK-0010 — AMH license/ownership authority unestablished

```yaml
id: BLK-0010
title: AMH license/ownership authority unestablished (NOASSERTION)
status: RESOLVIDO POR CONCESSÃO ESCRITA
what_is_blocked: >
  Gate G0's requirement that "AMH license/ownership and the authority of each
  selected contract are recorded" is only partially satisfiable: the license
  status IS recorded (NOASSERTION — EVID-0008), but no positive license/IP
  authority has been established. This blocks any import of AMH artifacts
  under ../legacy-import-policy.md §3.1, and blocks Gate G3 (AMH
  compatibility) acceptance of any AMH-derived contract material.
who_must_act: AUTH-DATA-PLATFORM (IntensiCare V2 side) jointly with AUTH-AMH-OWNER (AMH side) — both UNASSIGNED — VALIDATION REQUIRED
unblock_request: >
  "The GitHub API reports Omni-Saude/amh-data-platform's license as
  NOASSERTION (no SPDX license file/declaration detected) as of 2026-08-14 at
  commit 0a07a6f1fab36fb2f5eeee0fcd8e945c95f67116. Please identify the
  accountable AMH-side owner who can state the license/IP terms under which
  IntensiCare V2 (a separate, independent product) may reference, reuse, or
  build a contract against AMH schemas, profiles, or interfaces — including
  whether any reuse is permitted at all. Reply with the AMH owner's name,
  organizational role, and the applicable license/IP terms, or confirm that
  no reuse is currently authorized."
gate: G0
links: [RISK-0002, EVID-0008, GDEC-0004]
```

**Resolução (2026-08-15, DEC-G0-08, decidida por rodaquino-OMNI):** concessão
por escrito do titular — na qualidade de CEO e acionista principal da OMNI e
da AMH, rodaquino-OMNI **autoriza a IntensiCare V2 a ler o repositório
`amh-data-platform` em commits pinados e a derivar contratos de integração a
partir dele**. Reuso de código ou artefato AMH continua exigindo aprovação
por artefato, conforme `../legacy-import-policy.md`. Espelhamento opcional
futuro: arquivo de licença interna no repositório AMH. **Nota do steward:**
esta concessão resolve a **autoridade** de reuso; não substitui um SPDX/
licença formal publicada no repositório AMH — `risk-register.md` `RISK-0002`
permanece registrado, com nota de mitigação (ver `RISK-0002` atualizado). Ver
`decision-register.md` `GDEC-0004`.

## BLK-0011 — Branch protection for `main` not configured

```yaml
id: BLK-0011
title: Branch protection for main not configured
status: EXECUTADO (2026-08-15)
what_is_blocked: >
  Enforcement of the docs-gates required status checks (doc-conventions and
  forbidden-content, defined in .github/workflows/docs-gates.yml) as blocking
  merge requirements; prevention of force pushes to main; requirement that
  changes land via reviewed pull request rather than direct push. Until
  closed, these CI gates are observable but not enforced on main, which is
  inconsistent with INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §15.1
  ("branch protection and required status checks") and §3 rule 13
  ("No production release may rely on advisory/non-blocking ... gates").
  Raised by the CI foundation / repository-foundation and CI-policy engineer
  specialist in docs/14-devsecops-and-delivery/branch-protection-request.md,
  which is BLOCKED pending this same repository-admin action and could not
  write to this register (outside that task's write_scope).
who_must_act: >
  Repository administrator of rodaquino-OMNI/intensicare-V2
  (role: AUTH-SECURITY + repo admin) — UNASSIGNED — VALIDATION REQUIRED
unblock_request: >
  "Please apply the branch-protection settings requested in
  docs/14-devsecops-and-delivery/branch-protection-request.md §2 to the main
  branch of rodaquino-OMNI/intensicare-V2: require a pull request before
  merging (no direct pushes), require the doc-conventions and
  forbidden-content status checks to pass before merging, require branches
  to be up to date before merging, disable force pushes, and require linear
  history. Confirm back with the settings actually applied, which may differ
  from the request (e.g. on required-approval count, which that document
  deliberately leaves open pending AUTH-SECURITY/AUTH-OPERATIONS naming —
  see BLK-0003, BLK-0007)."
gate: G0
links: [EVID-0009, EVID-0010, GDEC-0004]
```

**Resolução (2026-08-15, DEC-G0-09, decidida por rodaquino-OMNI) —
Executado:** proteção aplicada em 2026-08-15 a `main` (OBSERVADO, resposta da
API — ver `evidence-register.md` `EVID-0010`): checks obrigatórios
`doc-conventions` + `forbidden-content` (strict), `enforce_admins` ativo,
histórico linear, force-push proibido, deleção proibida, PR obrigatório com
**0 aprovações** — parâmetro que
`docs/14-devsecops-and-delivery/branch-protection-request.md` §2/§3 deixou
em aberto, decidido pelo titular: o GitHub proíbe autoaprovação e há, no
momento, um único revisor humano; será elevado quando houver segundo
revisor. Ver `decision-register.md` `GDEC-0004`. **Nota do steward —
discrepância não resolvida silenciosamente:** o registro de decisão-fonte
(`g0-resolucoes-2026-08-15.md`, DEC-G0-09) identifica o repositório como
`Omni-Saude/intensicare-V2`, enquanto este bloqueador e `who_must_act` acima
(criados em 2026-08-14) usam `rodaquino-OMNI/intensicare-V2`. Ambas as
strings são citadas textualmente aqui; **qual delas é o slug real do
repositório remoto é VALIDAÇÃO NECESSÁRIA** — não presumido por este
steward.

## BLK-0012 — Classe D — ausência de profile `MedicationAdministration` na IG AMH (pt-BR — conteúdo novo, 2026-08-15)

```yaml
id: BLK-0012
title: Classe D — ausência de profile MedicationAdministration na IG AMH
status: OPEN
what_is_blocked: >
  Sete candidatos do portfólio permanecem PARCIAIS ou SEM EFEITO em todos os
  cenários avaliados de C-1 (sinais vitais) porque a Implementation Guide da
  AMH não tem nenhum profile MedicationAdministration: 0003 SOFA (componente
  cardiovascular — identidade e taxa de dose de vasoativo), 0010 sepse, 0013
  estabilidade hemodinâmica, 0014 sedação, 0015 profilaxia, 0016
  antimicrobiano, 0019 delirium. OBSERVADO: dos 21 arquivos JSON de nível
  superior de schemas/fhir-profiles/@0a07a6f1, existem Medication,
  MedicationRequest e MedicationDispense — mas dispensação não é
  administração titulada, e nenhum profile de administração existe.
who_must_act: AUTH-DATA-PLATFORM — decidir se a Classe D vira uma ordem de
  serviço nova (análoga às 21 já emitidas para C-1) ou uma pergunta aberta
  numerada endereçada aos donos AMH; nenhuma das duas existe hoje.
unblock_request: >
  "A classe D (administração de medicamentos, com ênfase em identidade e taxa
  de dose de vasoativo/sedativo/antimicrobiano/haloperidol) bloqueia sete
  candidatos do portfólio clínico e não tem, hoje, nenhuma ordem de serviço,
  nenhuma pergunta aberta e nenhum item de caminho crítico associado — a
  mesma forma estrutural de C-1 (um recurso FHIR que o consumidor precisa e
  para o qual a IG não tem profile). Por favor decida se este achado abre uma
  ordem de serviço nova (no padrão das 21 já emitidas) ou se é registrado
  como pergunta aberta (candidata a Q11) no quadro existente de perguntas
  para os donos AMH, e nomeie quem a conduz."
gate: G2
links: [RISK-0003]
```

**Fonte:** `docs/08-interoperability/amh-data/vital-signs-decision/pacote-decisao-c1-sinais-vitais.md`
§2.7 (item 9 da tabela RULE-SOFA-0100: "Taxa de dose do vasoativo | administração
de medicamento | sem profile `MedicationAdministration` na IG (E-3)") e
`docs/08-interoperability/amh-data/vital-signs-decision/impacto-no-portfolio.md`
§1 e §4 (achado "a classe D é a segunda C-1, e ninguém a nomeou ainda"; tabela
de efeito por candidato, §2, linhas 0003/0010/0013/0014/0015/0016/0019).
Escrito por escriba de governança; nenhum mérito decidido aqui.

**Extensão (2026-08-15, ciclo 2, pt-BR — achado novo da matriz §7.2):** a ausência
de profile `MedicationAdministration` não bloqueia apenas os sete candidatos do
portfólio listados acima — ela bloqueia a **RULE-GCS inteira**, não só um
componente dela. GCS-07 (estado de infusão sedativa) depende desta classe; o
gate sedativo da RULE-GCS é **fail-closed** (spec §3.3/§6.1: "qualquer
componente NT → nenhum total"), de modo que, sem estado de exposição
sedativa, o total sai `not_evaluated` **mesmo com os três componentes E, V e M
perfeitamente povoados e testados**. Uma decisão de C-1 em escopo amplo
desbloquearia E/V/M/RASS e ainda assim não produziria um total avaliável — é
o achado mais importante da matriz §7.2 quanto à RULE-GCS ("o que separa
'componentes disponíveis' de 'regra utilizável'"). Isto não substitui os sete
candidatos já registrados; soma-se a eles como consequência adicional, não
antes nomeada, da mesma lacuna de classe.
**Fonte da extensão:** `docs/08-interoperability/amh-data/pathway-source-matrix/matriz-leitura.md`
§3.3 ("O achado mais importante desta seção, e o menos óbvio... a RULE-GCS é
bloqueada pela classe D... tanto quanto pela classe B") e
`docs/08-interoperability/amh-data/pathway-source-matrix/lacunas-e-proximas-evidencias.md`
L-4 ("Linhas afetadas... GCS-07 — e, por GCS-07, a RULE-GCS inteira, via gate
sedativo fail-closed"). Escrito por escriba de governança; nenhum mérito
decidido aqui.

## BLK-0013 — Cobertura jurídica/ética de pesquisa com participantes humanos não coberta por `DEC-G0-03` (pt-BR — conteúdo novo, 2026-08-15)

```yaml
id: BLK-0013
title: Cobertura jurídica/ética de pesquisa com participantes humanos não coberta por DEC-G0-03
status: OPEN
what_is_blocked: >
  TODO o campo do kit de pesquisa do Gate G1 — sítio, recrutamento,
  consentimento, observação à beira do leito, entrevistas — inclusive a
  cápsula de baselines perecíveis (B1 carga de alarmes, B2 interrupções, B3
  fadiga, B4a tempo até reconhecimento observacional) do protocolo
  VAL-0035/G2-VAL-0025, que é a única medição do programa que não pode ser
  feita depois. O fundamento "desenvolvimento prossegue exclusivamente com
  dados sintéticos" que permitiu reclassificar AUTH-PRIVACY-LEGAL de G0 para
  pré-condição de G6/G8 (DEC-G0-03) não cobre pesquisa com participantes
  humanos: a pesquisa do G1 trata dados pessoais de profissionais de saúde e
  ocorre em ambiente com exposição incidental a dados de paciente — isto não
  é dado sintético.
who_must_act: rodaquino-OMNI — estender o escopo do parecer jurídico já
  encomendado pela OS-16 para cobrir pesquisa com participantes humanos, ou
  nomear um titular AUTH-PRIVACY-LEGAL específico para este escopo.
unblock_request: >
  "A pesquisa de campo do Gate G1 (kit de recrutamento, consentimento e
  baselines perecíveis) trata dados pessoais de profissionais de saúde e tem
  exposição incidental a dados de paciente — o fundamento de DEC-G0-03 (só
  dados sintéticos) não a alcança. Nenhum sítio pode ser contatado, nenhum
  participante recrutado e nenhuma medição de baseline perecível pode
  começar até que exista cobertura jurídica/ética para este escopo
  específico. Por favor decida se o parecer da OS-16 é estendido para cobrir
  esta pesquisa, ou nomeie um titular para este escopo em separado."
gate: G1
links: [RISK-0008, BLK-0004]
```

**Fonte:** `docs/02-users-and-workflows/g1-kit/plano-de-recrutamento-e-etica.md`
(cabeçalho do documento, "⚠️ BLOQUEIO VIGENTE" e §5, tabela E1–E6) e
`docs/02-users-and-workflows/g1-kit/protocolo-baselines-pereciveis.md` §7.2
(pré-condições mínimas, item 3: "Posição jurídica sobre observação de
profissionais e exposição incidental a dado de paciente — VAL-0041, hoje sem
titular"). Escrito por escriba de governança; nenhum mérito decidido aqui.

## BLK-0014 — OS-16 — pedido de parecer redigido, NÃO ENVIADO; destinatário jurídico não definido (pt-BR — conteúdo novo, 2026-08-15)

```yaml
id: BLK-0014
title: OS-16 — pedido de parecer redigido, NÃO ENVIADO; destinatário jurídico não definido
status: OPEN
what_is_blocked: >
  O caminho crítico externo do parecer jurídico LGPD ainda não começou a
  contar. A OS-16 é a única dependência externa do pacote AMH e trava,
  simultaneamente: o primeiro apply do índice do ADR-043; o apply dos DDLs do
  portable_subject_ref; o backfill de minting; a forma final do
  consent_decision_ref; a reativação da OS-21; e todos os Gates G6/G8 (per
  DEC-G0-03, gatilho obrigatório de parecer jurídico brasileiro antes de
  qualquer teste de conformidade com dados reais, operação sombra ou piloto).
  O texto da solicitação está redigido e revisado (minuta-parecer-os-16.md,
  25 questões Q-01..Q-25), mas nenhum envio foi feito: o destinatário
  (advogado(a) habilitado em direito brasileiro, com experiência em proteção
  de dados no setor de saúde) permanece PENDENTE — item 1 da lista de
  verificação pré-envio.
who_must_act: rodaquino-OMNI — definir o destinatário jurídico e autorizar o
  envio (o envio é ato de humano nomeado per DEC-G0-03; agentes redigem
  material jurídico apenas como sugestão).
unblock_request: >
  "O pedido de parecer jurídico da OS-16 está redigido e pronto para envio
  (docs/11-security-privacy-compliance/lgpd-os16/pedido-de-parecer.md), mas
  o destinatário ainda não foi definido e o envio ainda não ocorreu. Este é o
  item de maior prazo de espera de todo o pacote AMH e o único que nenhuma
  equipe de engenharia pode acelerar — a data de início do prazo é a data do
  envio, não a data desta minuta. Por favor nomeie o(a) advogado(a) ou banca
  destinatária e autorize o envio."
gate: G6, G8
links: [BLK-0004]
```

**Fonte:** `docs/11-security-privacy-compliance/lgpd-os16/pedido-de-parecer.md`
§3 (lista de verificação, item 1: "Destinatário definido... PENDENTE") e §4
("O que este pedido não faz", item 6: "Não foi enviado"). Escrito por
escriba de governança; nenhum mérito decidido aqui.

## BLK-0015 — Contrato v1 — dono AMH não nomeado (critério 6 da OS-19 insatisfazível pela minuta) (pt-BR — conteúdo novo, 2026-08-15)

```yaml
id: BLK-0015
title: Contrato v1 — dono AMH não nomeado (critério 6 da OS-19 insatisfazível pela minuta)
status: OPEN
what_is_blocked: >
  Aceitação do contrato AMH×IntensiCare v1. A minuta do lado V2
  (contract-manifest.draft.yaml) satisfaz cinco dos seis critérios de
  aceitação da OS-19 (manifesto completo, sujeito = PSR, cláusula de
  eventos + resolve, modelo de finalidade AQ-3, exclusões explícitas), mas o
  critério 6 — dono AMH nomeado — não é satisfazível por uma minuta redigida
  do lado V2: o campo producer.owner permanece UNASSIGNED — VALIDATION
  REQUIRED até que a própria AMH nomeie seu titular produtor. É ponto de
  negociação N-1 da memória de desenho, não coberto por nenhuma outra
  decisão já tomada.
who_must_act: rodaquino-OMNI (lado AMH) — nomear o dono AMH do contrato.
unblock_request: >
  "A minuta do contrato AMH×IntensiCare v1 satisfaz cinco dos seis critérios
  de aceitação da OS-19; o sexto — dono AMH nomeado (producer.owner) — só
  pode ser satisfeito pelo lado AMH, nunca pela minuta que o lado V2
  redigiu. Por favor nomeie o titular AMH responsável pelo contrato."
gate: G3
links: []
```

**Fonte:** `docs/08-interoperability/amh-data/contract-v1/memoria-de-desenho.md`
ponto N-1 (§8, "Dono AMH do contrato | AMH nomeia o dono produtor (critério
6 da OS-19 — a minuta NÃO o satisfaz; campo UNASSIGNED)") e §9 (critério 6:
"NÃO satisfazível pela minuta — só a AMH nomeia (N-1). Registrado, não
contornado"). Escrito por escriba de governança; nenhum mérito decidido
aqui.

## BLK-0016 — Contrato de ordem clínica sem dono (pt-BR — conteúdo novo, ciclo 2, 2026-08-15)

```yaml
id: BLK-0016
title: Contrato de ordem clínica sem dono
status: OPEN
what_is_blocked: >
  Três linhas das três regras clínicas precisam de uma ordem clínica
  atribuível e estruturada, não de uma medida: a atribuição de escala-alvo de
  SpO2 do NEWS2 (NEWS2 Scale 2, com autor, horário e indicação registrados) e
  a ordem de limitação terapêutica/paliativa (decidida em RULE-SOFA e
  RULE-NEWS2, apenas sinalizada em RULE-GCS). Nenhuma das duas é uma
  `Observation`, e nenhuma leitura possível da decisão C-1 (sinais vitais) —
  em escopo estreito ou amplo — as alcança, porque corrigir o profile de
  `Observation` não alcança uma ordem clínica. Nenhuma ordem de serviço AMH
  cobre esta classe e nenhuma pergunta aberta aos donos AMH a registra.
who_must_act: AUTH-DATA-PLATFORM / titular — decidir se este achado vira ordem
  de serviço nova ou pergunta aberta numerada endereçada aos donos AMH; nomear
  quem a conduz. Mesma forma estrutural do BLK-0012 (achado sem dono, sem OS,
  sem pergunta aberta).
unblock_request: >
  "Duas linhas das três regras clínicas exigem um contrato de ordem clínica
  atribuível — atribuição de escala-alvo de SpO2 (NEWS2 Scale 2) e ordem de
  limitação terapêutica/paliativa — e nenhuma delas é alcançável por
  correção de profile `Observation`, por nenhum escopo da decisão C-1. Hoje
  não existe ordem de serviço, pergunta aberta nem item de caminho crítico
  para esta classe. Por favor decida se este achado abre uma ordem de
  serviço nova ou é registrado como pergunta aberta ao quadro existente de
  perguntas para os donos AMH, e nomeie quem a conduz."
gate: G2
links: [RISK-0003, BLK-0012]
```

**Fonte:** `docs/08-interoperability/amh-data/pathway-source-matrix/lacunas-e-proximas-evidencias.md`
L-6 ("Não existe contrato de ordem clínica... Nenhum contrato desse tipo foi
inventariado em nenhuma camada... **Ninguém, hoje** — não há ordem de serviço
nem pergunta aberta. Precisa de dono nomeado") e §1 (quadro de orientação,
linha L-6: "quem age: titular precisa nomear"). Linhas afetadas citadas na
fonte: NEWS2-G, NEWS2-D3, SOFA-D3, GCS-D3. Escrito por escriba de governança;
nenhum mérito decidido aqui.

## BLK-0017 — SAF-0042 ausente — defeito de análise declarado de HAZ-0045 (pt-BR — conteúdo novo, ciclo 2, 2026-08-15)

```yaml
id: BLK-0017
title: SAF-0042 ausente — defeito de análise declarado de HAZ-0045
status: OPEN
what_is_blocked: >
  HAZ-0045 (contaminação de identidade a montante via índice cross-PJ do
  ADR-043, sem que a V2 tenha como detectar) não tem requisito de segurança
  filho `SAF`. `safety-plan.md` §8 exige que todo hazard tenha filho `SAF`;
  HAZ-0045 está, portanto, com defeito de análise declarado e aberto —
  registrado como tal pelo próprio hazard-log, não descoberto por este
  escriba. O controle candidato de HAZ-0045 (telemetria de anomalia de
  identidade) não recebeu ID porque `safety-requirements.md` estava fora do
  escopo de escrita da sessão que cunhou HAZ-0045; cunhar um ID sem escrever
  o requisito criaria referência pendurada.
who_must_act: AUTH-CLINSAFETY — cunhar SAF-0042 (ou ID equivalente) com o
  requisito de telemetria de anomalia de identidade, ou determinar disposição
  alternativa.
unblock_request: >
  "HAZ-0045 está registrado no hazard-log com defeito de análise declarado:
  nenhum requisito de segurança filho `SAF` existe para o controle candidato
  de telemetria de anomalia de identidade. Por favor cunhe o ID `SAF`
  correspondente em safety-requirements.md, ou determine outra disposição."
gate: G6
links: []
```

**Nota do steward — EM RESOLUÇÃO NESTA MESMA SESSÃO:** um especialista de
safety-case está, em paralelo a este registro, trabalhando exatamente
`docs/05-clinical-safety/{hazard-log.md,safety-requirements.md,safety-case/}`
— escopo fora do write scope deste steward. Este `BLK-0017` é registrado como
**OPEN** porque, no momento em que este arquivo foi lido, a lacuna ainda
constava aberta no hazard-log; **verificar hazard-log.md e
safety-requirements.md antes de agir sobre este bloqueador** — é possível que
já tenha sido fechado ou alterado pela sessão paralela.

**Fonte:** `docs/05-clinical-safety/hazard-log.md` HAZ-0045, nota (i) ("O
controle candidato de HAZ-0045 não recebe ID `SAF` aqui, e isso é
deliberado... `safety-plan.md` §8 exige que todo hazard tenha filho `SAF`,
logo HAZ-0045 está com defeito de análise declarado e aberto até que o
requisito exista") e §4 ("Pendência aberta gerada por esta disposição").
Escrito por escriba de governança; nenhum mérito decidido aqui.

## Index

| ID | Title | Gate | Who must act | Status (2026-08-15) |
|---|---|---|---|---|
| BLK-0001 | No named product decision owner | G0 | AUTH-PRODUCT | RESOLVIDO (interino) |
| BLK-0002 | No named clinical safety decision owner | G0 | AUTH-CLINSAFETY | OPEN — resolução parcial (GDEC-0003) |
| BLK-0003 | No named security decision owner | G0 | AUTH-SECURITY | RESOLVIDO COM ESCOPO |
| BLK-0004 | No named privacy/legal decision owner | G0 → G6/G8 | AUTH-PRIVACY-LEGAL | RECLASSIFICADO |
| BLK-0005 | No named data-platform decision owner | G0 | AUTH-DATA-PLATFORM | RESOLVIDO |
| BLK-0006 | No named UX decision owner | G0 | AUTH-UX | RESOLVIDO COM RESTRIÇÃO |
| BLK-0007 | No named operations decision owner | G0 | AUTH-OPERATIONS | RESOLVIDO |
| BLK-0008 | No named intended-use approver | G0 | AUTH-INTENDED-USE | OPEN — resolução parcial (GDEC-0003) |
| BLK-0009 | GitHub App installation access not revalidated | G0 | AUTH-DATA-PLATFORM + AUTH-SECURITY | RESOLVIDO POR RATIFICAÇÃO |
| BLK-0010 | AMH license/ownership authority unestablished | G0 | AUTH-DATA-PLATFORM + AUTH-AMH-OWNER | RESOLVIDO POR CONCESSÃO ESCRITA |
| BLK-0011 | Branch protection for `main` not configured | G0 | AUTH-SECURITY + repo admin | EXECUTADO |
| BLK-0012 | Classe D — ausência de profile `MedicationAdministration` na IG AMH | G2 | AUTH-DATA-PLATFORM | OPEN |
| BLK-0013 | Cobertura jurídica/ética de pesquisa com participantes humanos não coberta por `DEC-G0-03` | G1 | rodaquino-OMNI | OPEN |
| BLK-0014 | OS-16 — pedido de parecer redigido, NÃO ENVIADO; destinatário jurídico não definido | G6, G8 | rodaquino-OMNI | OPEN |
| BLK-0015 | Contrato v1 — dono AMH não nomeado (critério 6 da OS-19 insatisfazível pela minuta) | G3 | rodaquino-OMNI (lado AMH) | OPEN |
| BLK-0016 | Contrato de ordem clínica sem dono | G2 | AUTH-DATA-PLATFORM / titular | OPEN |
| BLK-0017 | SAF-0042 ausente — defeito de análise declarado de HAZ-0045 | G6 | AUTH-CLINSAFETY | OPEN — verificar hazard-log/safety-requirements (em resolução paralela) |

**Nota do steward (2026-08-15, segunda integração, pt-BR — conteúdo novo):**
`BLK-0012`..`BLK-0015` não são bloqueadores do Gate G0 — são bloqueadores de
gates posteriores (G1/G2/G3/G6/G8) identificados pelos especialistas da onda
de entrega do ciclo 1 e transcritos aqui por este escriba, sem decisão de
mérito. Nenhum dos quatro estava presente na verificação anterior; nenhum
`BLK-*` foi renumerado ou removido.

**Veredito do Gate G0 em 2026-08-15 (pós-integração):** de onze bloqueadores,
**nove foram resolvidos, reclassificados ou executados** em 2026-08-15 por
decisão de humano nomeado (rodaquino-OMNI — ver
`g0-resolucoes-2026-08-15.md`, DEC-G0-01 a DEC-G0-09, alocadas como
`decision-register.md` `GDEC-0004`). **Dois permanecem `OPEN`:** `BLK-0002`
(titular clínico) e `BLK-0008` (aprovador de uso pretendido) — ambos com
resolução **parcial** já registrada (`GDEC-0003`): rodaquino-OMNI é o
revisor clínico / aprovador de conteúdo clínico nomeado, mas **apenas para
artefatos do ciclo 1**; aceitação plena do papel, verificação de credencial
e linha de reporte organizacional permanecem pendentes, e o próprio
`GDEC-0003` exige um segundo revisor para qualquer conteúdo que
rodaquino-OMNI redija pessoalmente.

**Isto não é o mesmo que "Gate G0 fechado".** O Gate G0
(`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:239-249`) exige titulares nomeados
E alcançáveis para todos os papéis `AUTH-*`, e nenhum registro deste steward
"fecha" um gate — apenas registra o que o titular nomeado decidiu. Ver
também o **risco de concentração de autoridade** registrado em
`risk-register.md` (novo item, nesta integração): a maioria das resoluções
acima nomeia a **mesma pessoa** para múltiplos papéis `AUTH-*`, o que
resolve a lacuna de "sem titular" mas não elimina o risco de um único ponto
de decisão — os pares de independência do prompt §4 continuam se aplicando
nos portões de verificação (G1, G6, G8), não apenas na titularidade nominal.
