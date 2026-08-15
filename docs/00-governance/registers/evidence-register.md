---
doc_id: GOV-EVIDENCE-REGISTER
status: OPEN
owner: UNASSIGNED — VALIDATION REQUIRED
source: Orchestrator-collected OBSERVED facts, 2026-08-14; format per ../evidence-notation.md
last_updated: 2026-08-15
---

# Evidence Register

Every row is an evidence-notation entry (`../evidence-notation.md` §3). All
entries below were collected 2026-08-14 by the orchestrator and are labeled
**OBSERVED** unless noted otherwise. This register does not accept, reject, or
act on any entry — it only records what was verified and by whom, per this
task's `decisions_prohibited`.

## EVID-0001 — V2 repository independent history

- **Label:** OBSERVED
- **Statement:** The IntensiCare V2 repository exists at
  `/Users/familia/code/intensicare-V2` with independent git history — a single
  initial commit `cb35521` on `main`. Work proceeds on branch
  `cycle-0/spark-foundation`.
- **Provenance:**
  - `source_repo`: `intensicare-V2`
  - `path_or_url`: `.git` (repo root)
  - `commit_sha_or_version`: `cb35521`
  - `section_or_lines`: n/a (repository-level fact)
  - `date_collected`: 2026-08-14
  - `collector`: orchestrator
  - `transformation`: none
  - `confidence`: high
  - `owner`: UNASSIGNED — VALIDATION REQUIRED
  - `validation_status`: VALIDATION REQUIRED (re-verify branch/commit at each phase gate)
- **Links:** `../traceability-policy.md`; supports Gate G0 criterion "the new
  repository exists" (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:243`).

## EVID-0002 — V2 work branch

- **Label:** OBSERVED
- **Statement:** The active work branch is `cycle-0/spark-foundation`.
- **Provenance:**
  - `source_repo`: `intensicare-V2`
  - `path_or_url`: `.git/HEAD`
  - `commit_sha_or_version`: `cb35521` (branch tip at time of collection)
  - `section_or_lines`: n/a
  - `date_collected`: 2026-08-14
  - `collector`: orchestrator
  - `transformation`: none
  - `confidence`: high
  - `owner`: UNASSIGNED — VALIDATION REQUIRED
  - `validation_status`: N/A
- **Links:** `registers/decision-register.md` `GDEC-0001`.

## EVID-0003 — Legacy repository present, read-only, technical assessment

- **Label:** OBSERVED
- **Statement:** The legacy repository is present read-only at
  `/Users/familia/intensicare/`, including
  `INTENSICARE_TECHNICAL_ASSESSMENT.md` (118,287 bytes). Treated as
  risk-informed input, not authority, per
  `INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:72`.
- **Provenance:**
  - `source_repo`: `intensicare` (legacy)
  - `path_or_url`: `/Users/familia/intensicare/INTENSICARE_TECHNICAL_ASSESSMENT.md`
  - `commit_sha_or_version`: not recorded by orchestrator at collection time — VALIDATION REQUIRED
  - `section_or_lines`: whole file (118,287 bytes)
  - `date_collected`: 2026-08-14
  - `collector`: orchestrator
  - `transformation`: none (existence/size check only)
  - `confidence`: high (file presence/size), medium (content not re-verified by this steward)
  - `owner`: UNASSIGNED — VALIDATION REQUIRED
  - `validation_status`: VALIDATION REQUIRED
- **Links:** `../legacy-import-policy.md` §2.

## EVID-0004 — Legacy repository present, read-only, docs intelligence audit

- **Label:** OBSERVED
- **Statement:** The legacy repository also contains
  `INTENSICARE_DOCS_INTELLIGENCE_AUDIT.md` (2,351,029 bytes), present
  read-only.
- **Provenance:**
  - `source_repo`: `intensicare` (legacy)
  - `path_or_url`: `/Users/familia/intensicare/INTENSICARE_DOCS_INTELLIGENCE_AUDIT.md`
  - `commit_sha_or_version`: not recorded by orchestrator at collection time — VALIDATION REQUIRED
  - `section_or_lines`: whole file (2,351,029 bytes)
  - `date_collected`: 2026-08-14
  - `collector`: orchestrator
  - `transformation`: none (existence/size check only)
  - `confidence`: high (file presence/size), medium (content not re-verified by this steward)
  - `owner`: UNASSIGNED — VALIDATION REQUIRED
  - `validation_status`: VALIDATION REQUIRED
- **Links:** `../legacy-import-policy.md` §2;
  `registers/assumptions-register.md` `ASM-0003` (line-citation accuracy).

## EVID-0005 — AMH repository pinned commit, no drift from evidence baseline

- **Label:** OBSERVED
- **Statement:** `github.com/Omni-Saude/amh-data-platform` is private; default
  branch `main`; current `main` HEAD pinned 2026-08-14 =
  `0a07a6f1fab36fb2f5eeee0fcd8e945c95f67116`, which is **identical** to the
  evidence snapshot commit cited in the orchestrator prompt
  (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:89`). No drift between evidence
  baseline and execution commit was observed at collection time.
- **Provenance:**
  - `source_repo`: `Omni-Saude/amh-data-platform`
  - `path_or_url`: `https://github.com/Omni-Saude/amh-data-platform`
  - `commit_sha_or_version`: `0a07a6f1fab36fb2f5eeee0fcd8e945c95f67116`
  - `section_or_lines`: n/a (repository HEAD)
  - `date_collected`: 2026-08-14
  - `collector`: orchestrator (via `gh` CLI / GitHub API)
  - `transformation`: none
  - `confidence`: high
  - `owner`: UNASSIGNED — VALIDATION REQUIRED
  - `validation_status`: VALIDATION REQUIRED — must be re-pinned at execution
    time (see `registers/assumptions-register.md` `ASM-0002`); a point-in-time
    match does not guarantee no drift later in cycle 0.
- **Links:** Gate G0 criterion on pinning AMH commit
  (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:245`).

## EVID-0006 — Maezo published-contract manifest producer commit

- **Label:** OBSERVED
- **Statement:** A Maezo published-contract manifest producer commit
  `09a0a282e69f49aa9c6944b25afb35eee65fcc9c` (dated 2026-08-05) exists in the
  AMH repository. This commit is **different** from the evidence snapshot
  commit `0a07a6f1fab36fb2f5eeee0fcd8e945c95f67116` — the two must not be
  conflated.
- **Provenance:**
  - `source_repo`: `Omni-Saude/amh-data-platform`
  - `path_or_url`: `schemas/contracts/maezo/v1/contract-manifest.yaml`
  - `commit_sha_or_version`: `09a0a282e69f49aa9c6944b25afb35eee65fcc9c`
  - `section_or_lines`: manifest producer-commit field
  - `date_collected`: 2026-08-14 (manifest dated 2026-08-05)
  - `collector`: orchestrator
  - `transformation`: none
  - `confidence`: high
  - `owner`: UNASSIGNED — VALIDATION REQUIRED
  - `validation_status`: VALIDATION REQUIRED
- **Links:** Gate G0 criterion
  (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:245`); does **not** license reuse of
  the Maezo interface — see `INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:104`
  ("V2 must create an AMH×IntensiCare contract rather than reuse Maezo's
  interface").

## EVID-0007 — GitHub access verified via gh CLI OAuth

- **Label:** OBSERVED
- **Statement:** GitHub access was verified via `gh` CLI OAuth on account
  `rodaquino-OMNI`, with token scopes `gist`, `read:org`, `repo`, `workflow`.
- **Provenance:**
  - `source_repo`: n/a (GitHub account/tooling fact)
  - `path_or_url`: `gh auth status` output
  - `commit_sha_or_version`: n/a
  - `section_or_lines`: n/a
  - `date_collected`: 2026-08-14
  - `collector`: orchestrator
  - `transformation`: none
  - `confidence`: high
  - `owner`: UNASSIGNED — VALIDATION REQUIRED
  - `validation_status`: VALIDATION REQUIRED
- **Note:** This fact is distinct from, and does not establish, GitHub App
  installation access. The orchestrator prompt describes access "through the
  GitHub App installation" on `rodaquino-OMNI`
  (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:243-244,87`); what was actually
  observed is a `gh` CLI OAuth token on that account. This discrepancy is
  recorded as `registers/assumptions-register.md` `ASM-0001` and
  `registers/blockers-register.md` `BLK-0009`.
- **Links:** Gate G0 criterion "access ... revalidated"
  (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:244`).

## EVID-0008 — AMH repository license reported NOASSERTION

- **Label:** OBSERVED
- **Statement:** The AMH repository's license, as reported by the GitHub API,
  is `NOASSERTION` — no SPDX license was detected.
- **Provenance:**
  - `source_repo`: `Omni-Saude/amh-data-platform`
  - `path_or_url`: GitHub REST API `licenses` field for the repository
  - `commit_sha_or_version`: `0a07a6f1fab36fb2f5eeee0fcd8e945c95f67116` (repo state at query time)
  - `section_or_lines`: n/a (repository metadata field)
  - `date_collected`: 2026-08-14
  - `collector`: orchestrator
  - `transformation`: none
  - `confidence`: high
  - `owner`: UNASSIGNED — VALIDATION REQUIRED
  - `validation_status`: VALIDATION REQUIRED
- **Consequence:** Recorded as a BLOCKER — license/IP authority for any AMH
  artifact reuse is unestablished. See
  `registers/risk-register.md` `RISK-0002` and
  `registers/blockers-register.md` `BLK-0010`.
- **Links:** `../legacy-import-policy.md` §3.1; Gate G0 criterion "AMH
  license/ownership ... are recorded"
  (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:246`).

## EVID-0009 — Branch protection on `main` not configured; docs-gates checks not enforced

- **Label:** OBSERVED
- **Statement:** As reported by the CI foundation / repository-foundation and
  CI-policy engineer specialist, `main` in `rodaquino-OMNI/intensicare-V2` has
  no branch protection configured. The `Docs Gates` CI workflow
  (`.github/workflows/docs-gates.yml`, jobs `doc-conventions` and
  `forbidden-content`) runs and reports results, but nothing currently
  prevents a direct push, force push, or a merge despite a red check, because
  no required status checks, PR-required rule, or force-push restriction is
  configured on `main`.
- **Provenance:**
  - `source_repo`: `intensicare-V2`
  - `path_or_url`: `docs/14-devsecops-and-delivery/branch-protection-request.md` (§1–2); `.github/workflows/docs-gates.yml`
  - `commit_sha_or_version`: n/a (created this session, uncommitted)
  - `section_or_lines`: `branch-protection-request.md` §1 "Why this is blocking, not advisory"
  - `date_collected`: 2026-08-14
  - `collector`: repository-foundation and CI-policy engineer (source doc); recorded in this register by the governance-and-traceability bootstrap steward
  - `transformation`: summarized from the specialist's request document
  - `confidence`: high
  - `owner`: UNASSIGNED — VALIDATION REQUIRED
  - `validation_status`: VALIDATION REQUIRED
- **Links:** `registers/blockers-register.md` `BLK-0011`;
  `INTENSICARE_V2_ORCHESTRATOR_PROMPT.md` §15.1, §3 rule 13.

## EVID-0010 — Proteção de branch aplicada a `main` (pt-BR — conteúdo novo, 2026-08-15)

- **Rótulo:** OBSERVED
- **Declaração:** Proteção de branch foi aplicada em 2026-08-15 a `main`,
  observada por resposta da API do GitHub: checks obrigatórios
  `doc-conventions` + `forbidden-content` (modo `strict`), `enforce_admins`
  ativo, histórico linear obrigatório, force-push proibido, deleção
  proibida, pull request obrigatório com **0 aprovações** requeridas (valor
  que `docs/14-devsecops-and-delivery/branch-protection-request.md` §2/§3
  havia deixado em aberto). Isto substitui, na prática, o estado registrado
  em `EVID-0009` (proteção ausente).
- **Proveniência:**
  - `source_repo`: `intensicare-V2`
  - `path_or_url`: `docs/00-governance/registers/g0-resolucoes-2026-08-15.md` (`DEC-G0-09`)
  - `commit_sha_or_version`: n/a (criado nesta sessão, não commitado)
  - `section_or_lines`: "DEC-G0-09"
  - `date_collected`: 2026-08-15
  - `collector`: orquestrador de entrega (resposta de API observada); registrado neste register pelo governance-and-traceability bootstrap steward
  - `transformation`: resumida a partir da transcrição da decisão/execução no documento-fonte
  - `confidence`: alta
  - `owner`: UNASSIGNED — VALIDAÇÃO NECESSÁRIA
  - `validation_status`: VALIDAÇÃO NECESSÁRIA — este steward não chamou a API do GitHub diretamente para reconfirmar; a observação é transcrita do documento-fonte, não reverificada de forma independente nesta integração
- **Nota do steward — discrepância não resolvida silenciosamente:** o
  documento-fonte identifica o repositório protegido como
  `Omni-Saude/intensicare-V2`; `registers/blockers-register.md` `BLK-0011`
  (criado em 2026-08-14) usa `rodaquino-OMNI/intensicare-V2`. Qual string é
  o slug real do remoto é `VALIDAÇÃO NECESSÁRIA` — ver `BLK-0011`.
- **Links:** `registers/blockers-register.md` `BLK-0011`;
  `registers/decision-register.md` `GDEC-0004`; supersede prático (não
  formal) de `EVID-0009`.

## EVID-0011 — Acesso AMH verificado funcional sem novo login (pt-BR — conteúdo novo, 2026-08-15)

- **Rótulo:** OBSERVED
- **Declaração:** Em 2026-08-15, o acesso a `Omni-Saude/amh-data-platform`
  foi verificado funcional **sem exigir novo login**, usando o mecanismo
  OAuth `gh` já existente no usuário `rodaquino-OMNI` (o mesmo mecanismo
  registrado em `EVID-0007`). A verificação ocorreu antes de qualquer
  solicitação de credencial nova, conforme instrução operacional citada no
  documento-fonte ("verificar antes de pedir").
- **Proveniência:**
  - `source_repo`: `intensicare-V2` (registro da verificação) / `Omni-Saude/amh-data-platform` (alvo verificado)
  - `path_or_url`: `docs/00-governance/registers/g0-resolucoes-2026-08-15.md` (`DEC-G0-07`)
  - `commit_sha_or_version`: n/a (criado nesta sessão, não commitado)
  - `section_or_lines`: "DEC-G0-07"
  - `date_collected`: 2026-08-15
  - `collector`: orquestrador de entrega (verificação observada); registrado neste register pelo governance-and-traceability bootstrap steward
  - `transformation`: resumida a partir da transcrição da decisão/verificação no documento-fonte
  - `confidence`: alta
  - `owner`: UNASSIGNED — VALIDAÇÃO NECESSÁRIA
  - `validation_status`: VALIDAÇÃO NECESSÁRIA — este steward não executou a verificação de acesso diretamente nesta integração; a observação é transcrita do documento-fonte
- **Consequência:** fundamenta a resolução de `BLK-0009` (RESOLVIDO POR
  RATIFICAÇÃO) — o mecanismo de acesso real (OAuth `gh`, não instalação de
  GitHub App) fica ratificado como o mecanismo sancionado, com item de
  melhoria não bloqueador registrado (credencial de escopo fino
  somente-leitura).
- **Links:** `registers/blockers-register.md` `BLK-0009`;
  `registers/assumptions-register.md` `ASM-0001` (corpus de ciclo 0, não
  retraduzido; esta entrada não o substitui, mas registra o fato que o
  supera na prática); `registers/decision-register.md` `GDEC-0004`.

## EVID-0012 — Re-pinagem AMH 2026-08-15: commit `main` inalterado, sem deriva (pt-BR — conteúdo novo)

- **Rótulo:** OBSERVED
- **Declaração:** Em 2026-08-15, o orquestrador de entrega re-verificou o commit HEAD
  de `Omni-Saude/amh-data-platform@main` via
  `gh api repos/Omni-Saude/amh-data-platform/branches/main --jq '.commit.sha'`. O
  resultado — `0a07a6f1fab36fb2f5eeee0fcd8e945c95f67116` — é **idêntico** ao commit
  pinado como evidência-base em `EVID-0005` (coletado 2026-08-14). Portanto: **commit
  pinado confirmado, SEM DERIVA** entre 2026-08-14 e 2026-08-15. O acesso usado para
  esta chamada foi o mecanismo OAuth `gh` já existente no usuário `rodaquino-OMNI`
  (o mesmo de `EVID-0007`/`EVID-0011`), funcional **sem exigir novo login**.
- **Proveniência:**
  - `source_repo`: `intensicare-V2` (registro da verificação) / `Omni-Saude/amh-data-platform` (alvo verificado)
  - `path_or_url`: saída de `gh api repos/Omni-Saude/amh-data-platform/branches/main --jq '.commit.sha'`
  - `commit_sha_or_version`: `0a07a6f1fab36fb2f5eeee0fcd8e945c95f67116`
  - `section_or_lines`: n/a (resposta de API, campo `commit.sha` do branch `main`)
  - `date_collected`: 2026-08-15
  - `collector`: orquestrador de entrega (chamada de API observada); registrado neste
    register pelo governance-and-traceability bootstrap steward
  - `transformation`: resumida a partir da chamada de API relatada pelo orquestrador;
    comparação byte-a-byte do SHA contra `EVID-0005` feita por este steward
  - `confidence`: alta
  - `owner`: UNASSIGNED — VALIDAÇÃO NECESSÁRIA
  - `validation_status`: VALIDAÇÃO NECESSÁRIA — este steward não executou a chamada
    `gh api` diretamente nesta integração; a observação é transcrita do relato do
    orquestrador, não reverificada de forma independente. Uma correspondência de SHA
    em dois pontos no tempo (2026-08-14, 2026-08-15) não garante ausência de deriva em
    datas futuras — `ASM-0002` continua exigindo nova re-pinagem antes de qualquer
    decisão dependente de compatibilidade (Gate G3 em diante).
- **Consequência:** satisfaz `ASM-0002` **para a sessão de 2026-08-15** (a assunção
  "AMH `main` não sofrerá deriva material" foi re-verificada, não apenas presumida,
  nesta data). Não fecha `ASM-0002` de forma permanente — o item permanece
  `VALIDATION REQUIRED (recurring)` para toda decisão futura, conforme já registrado
  naquela entrada.
- **Links:** `registers/assumptions-register.md` `ASM-0002`;
  `registers/evidence-register.md` `EVID-0005` (baseline comparada);
  `registers/blockers-register.md` `BLK-0009` (mesmo mecanismo de acesso, DEC-G0-07).

## EVID-0013 — ADR-043, ADR-045 e AMH-020b lidos pelo engenheiro de privacidade/LGPD (pt-BR — conteúdo novo, 2026-08-15)

- **Rótulo:** OBSERVED
- **Declaração:** No commit pinado `0a07a6f1fab36fb2f5eeee0fcd8e945c95f67116`
  do repositório `Omni-Saude/amh-data-platform`, o engenheiro de privacidade,
  LGPD e registros do ciclo 1 leu, somente leitura, os três artefatos que
  fundamentam a minuta de parecer da OS-16:
  `architecture/adrs/ADR-043-indice-de-correspondencia-de-identidade-entre-pjs.md`
  (113 linhas, íntegra); `architecture/adrs/ADR-045-formato-do-log-de-consentimento.md`
  (115 linhas, íntegra); `docs/plans/amh-020b-portable-subject-ref-design-2026-08-04.md`
  (559 linhas; §0, §1, §5, §7, §8, §9 e Anexo A lidos). Nenhum dos três foi
  escrito ou alterado; leitura apenas.
- **Proveniência:**
  - `source_repo`: `Omni-Saude/amh-data-platform` (artefatos lidos) / `intensicare-V2` (registro)
  - `path_or_url`: `docs/11-security-privacy-compliance/lgpd-os16/minuta-parecer-os-16.md`
  - `commit_sha_or_version`: `0a07a6f1fab36fb2f5eeee0fcd8e945c95f67116`
  - `section_or_lines`: "§1.4 (Proveniência dos artefatos AMH lidos para esta minuta)"
  - `date_collected`: "2026-08-15"
  - `collector`: engenheiro de privacidade, LGPD e registros (IntensiCare V2, ciclo 1); registrado neste register pelo governance-and-traceability steward
  - `transformation`: resumida da tabela de proveniência da minuta
  - `confidence`: alta
  - `owner`: UNASSIGNED — VALIDAÇÃO NECESSÁRIA
  - `validation_status`: VALIDAÇÃO NECESSÁRIA — esta entrada transcreve a leitura relatada pelo especialista; não reverificada de forma independente por este steward
- **Links:** `registers/assumptions-register.md` `ASM-0004` (premissas P-1..P-7 da mesma minuta).

## EVID-0014 — `bronze_to_fhir.py`: `EVOLUCAO_PACIENTE` → apenas `ClinicalImpression`; `map_observation` laboratorial de texto livre implementado (pt-BR — conteúdo novo, 2026-08-15)

- **Rótulo:** OBSERVED
- **Declaração:** `pipelines/batch/fhir/bronze_to_fhir.py` (1.118 linhas,
  produtor de registro do canal FHIR segundo o ADR-040), lido no commit
  pinado `0a07a6f1fab36fb2f5eeee0fcd8e945c95f67116`: a função `map_clinimp`
  (L~706–745) lê `tasy_hospital_evolucao_paciente` e emite exclusivamente
  `ClinicalImpression` — não existe ramo de `Observation` a partir de
  `EVOLUCAO_PACIENTE` no produtor. O único mapeador de `Observation`
  (`map_observation`, L~766–787) é laboratorial e de texto livre: lê
  `tasy_hospital_paciente_exame`, emite `category=laboratory` e
  `valueString` (não estruturado). A URL de profile emitida diverge da IG
  canônica. Consequência registrada pelo especialista: a contradição de
  conformidade nomeada como C-4 (caminho de texto livre) está **IMPLEMENTADA
  em código**, não apenas planejada em diagrama.
- **Proveniência:**
  - `source_repo`: `Omni-Saude/amh-data-platform` (artefato lido) / `intensicare-V2` (registro)
  - `path_or_url`: `docs/08-interoperability/amh-data/vital-signs-decision/pacote-decisao-c1-sinais-vitais.md`
  - `commit_sha_or_version`: `0a07a6f1fab36fb2f5eeee0fcd8e945c95f67116`
  - `section_or_lines`: "§2.4 (O que o produtor implementado realmente faz); §2.7 item E-5"
  - `date_collected`: "2026-08-15"
  - `collector`: especialista de decisão de sinais vitais (IntensiCare V2, ciclo 1); registrado neste register pelo governance-and-traceability steward
  - `transformation`: resumida da leitura direta do código-fonte relatada pelo especialista
  - `confidence`: alta
  - `owner`: UNASSIGNED — VALIDAÇÃO NECESSÁRIA
  - `validation_status`: VALIDAÇÃO NECESSÁRIA — não relida por este steward; transcrição fiel do achado relatado
- **Links:** `registers/risk-register.md` `RISK-0003`, `RISK-0009`; `registers/blockers-register.md` `BLK-0012`.

## EVID-0015 — `fhir_observation.sql`: terceiro artefato do "lado A", DDL autodeclarada nunca executada (pt-BR — conteúdo novo, 2026-08-15)

- **Rótulo:** OBSERVED
- **Declaração:** `schemas/iceberg/fhir/fhir_observation.sql` (tabela-espelho
  analítica de `Observation`), lido no commit pinado: comentário de
  cabeçalho reivindica cobertura de "lab results, vital signs, and
  diagnostic observations"; comentário da coluna `category_code` enumera
  `vital-signs` entre os valores possíveis. O próprio arquivo declara,
  porém, que **esta DDL nunca foi executada** ("a tabela real foi criada
  pelo job de espelho `fhir_resource_mirror.py`, com `createOrReplace` a
  partir do schema do DataFrame — a DDL era documentação, nunca executada")
  e atribui a origem a `Diagnose` — o LIS que, pelo próprio repositório, não
  é ingerido.
- **Proveniência:**
  - `source_repo`: `Omni-Saude/amh-data-platform` (artefato lido) / `intensicare-V2` (registro)
  - `path_or_url`: `docs/08-interoperability/amh-data/vital-signs-decision/pacote-decisao-c1-sinais-vitais.md`
  - `commit_sha_or_version`: `0a07a6f1fab36fb2f5eeee0fcd8e945c95f67116`
  - `section_or_lines`: "§2.1 (Lado A — terceiro artefato); §2.7 item E-7"
  - `date_collected`: "2026-08-15"
  - `collector`: especialista de decisão de sinais vitais (IntensiCare V2, ciclo 1); registrado neste register pelo governance-and-traceability steward
  - `transformation`: resumida da leitura direta do arquivo relatada pelo especialista
  - `confidence`: alta
  - `owner`: UNASSIGNED — VALIDAÇÃO NECESSÁRIA
  - `validation_status`: VALIDAÇÃO NECESSÁRIA — não relida por este steward; transcrição fiel do achado relatado
- **Links:** `registers/risk-register.md` `RISK-0003`.

## EVID-0016 — Manifesto Maezo relido; disposição de 28→11 campos observada no manifesto pinado (pt-BR — conteúdo novo, 2026-08-15)

- **Rótulo:** OBSERVED
- **Declaração:** `schemas/contracts/maezo/v1/contract-manifest.yaml`, lido
  somente leitura no commit pinado `0a07a6f1fab36fb2f5eeee0fcd8e945c95f67116`,
  para produzir a comparação campo a campo da minuta do contrato v1
  AMH×IntensiCare: 28 campos do envelope Maezo dispostos contra os 11 campos
  mínimos da minuta (6 mantidos com mesmo nome, 1 renomeado, 1 desdobrado em
  dois, 1 campo novo acrescentado, os demais excluídos ou elevados ao nível
  do manifesto, cada disposição justificada). Nenhum conteúdo do manifesto
  Maezo foi reutilizado ou copiado — apenas a lista de nomes de campo foi
  observada para produzir a disposição comparativa.
- **Proveniência:**
  - `source_repo`: `Omni-Saude/amh-data-platform` (artefato lido) / `intensicare-V2` (registro)
  - `path_or_url`: `docs/08-interoperability/amh-data/contract-v1/memoria-de-desenho.md`
  - `commit_sha_or_version`: `0a07a6f1fab36fb2f5eeee0fcd8e945c95f67116`
  - `section_or_lines`: "§5 (Minimização deliberada frente ao envelope Maezo — campo a campo); front matter (source)"
  - `date_collected`: "2026-08-15"
  - `collector`: steward de publicação de contrato AMH×IntensiCare (IntensiCare V2, ciclo 1); registrado neste register pelo governance-and-traceability steward
  - `transformation`: resumida da tabela comparativa de 28→11 campos
  - `confidence`: alta
  - `owner`: UNASSIGNED — VALIDAÇÃO NECESSÁRIA
  - `validation_status`: VALIDAÇÃO NECESSÁRIA — não relida por este steward; transcrição fiel do achado relatado
- **Links:** `registers/blockers-register.md` `BLK-0015`; `registers/assumptions-register.md` `ASM-0006`.

## Index

| ID | Statement (short) | Label | Validation status |
|---|---|---|---|
| EVID-0001 | V2 repo independent history, commit `cb35521`, `main` | OBSERVED | VALIDATION REQUIRED |
| EVID-0002 | V2 work branch `cycle-0/spark-foundation` | OBSERVED | N/A |
| EVID-0003 | Legacy repo read-only, technical assessment (118,287 B) | OBSERVED | VALIDATION REQUIRED |
| EVID-0004 | Legacy repo read-only, docs intelligence audit (2,351,029 B) | OBSERVED | VALIDATION REQUIRED |
| EVID-0005 | AMH `main` HEAD pinned = evidence snapshot, no drift | OBSERVED | VALIDATION REQUIRED |
| EVID-0006 | Maezo manifest producer commit `09a0a282e...` (2026-08-05) | OBSERVED | VALIDATION REQUIRED |
| EVID-0007 | GitHub access via `gh` CLI OAuth, `rodaquino-OMNI` | OBSERVED | VALIDATION REQUIRED |
| EVID-0008 | AMH repo license = `NOASSERTION` | OBSERVED | VALIDATION REQUIRED |
| EVID-0009 | Branch protection on `main` not configured; CI gates not enforced | OBSERVED | VALIDATION REQUIRED |
| EVID-0010 | Proteção de branch aplicada a `main` (2026-08-15) | OBSERVED | VALIDAÇÃO NECESSÁRIA |
| EVID-0011 | Acesso AMH verificado sem novo login (2026-08-15) | OBSERVED | VALIDAÇÃO NECESSÁRIA |
| EVID-0012 | Re-pinagem AMH 2026-08-15: SHA `0a07a6f1...` confirmado, sem deriva | OBSERVED | VALIDAÇÃO NECESSÁRIA |
| EVID-0013 | ADR-043, ADR-045, AMH-020b lidos pelo engenheiro LGPD | OBSERVED | VALIDAÇÃO NECESSÁRIA |
| EVID-0014 | `bronze_to_fhir.py`: `EVOLUCAO_PACIENTE`→só `ClinicalImpression`; C-4 implementada | OBSERVED | VALIDAÇÃO NECESSÁRIA |
| EVID-0015 | `fhir_observation.sql`: terceiro artefato do lado A, DDL nunca executada | OBSERVED | VALIDAÇÃO NECESSÁRIA |
| EVID-0016 | Manifesto Maezo relido; disposição 28→11 campos observada | OBSERVED | VALIDAÇÃO NECESSÁRIA |
