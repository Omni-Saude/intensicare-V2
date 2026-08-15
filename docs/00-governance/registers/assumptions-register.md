---
doc_id: GOV-ASSUMPTIONS-REGISTER
status: OPEN
owner: UNASSIGNED — VALIDATION REQUIRED
source: Orchestrator-collected facts, 2026-08-14; format per ../evidence-notation.md
last_updated: 2026-08-15
---

# Assumptions Register

Every row is an INFERENCE or PROPOSAL standing in for an unverified fact. Each
must have a named validation path and, once staffed, a named owner. No
assumption in this register may be silently treated as fact — see
`../evidence-notation.md` §2, rule 3–4.

## ASM-0001 — GitHub App installation vs OAuth token discrepancy

- **Label:** INFERENCE (reasoned from `EVID-0007` and
  `INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:243-244,87`)
- **Statement:** The orchestrator prompt states that the AMH repository "was
  inspected through the GitHub App installation" and that Gate G0 requires
  "access through the GitHub App installation owned by `rodaquino-OMNI`" to be
  revalidated. What was actually observed (`EVID-0007`) is a `gh` CLI OAuth
  token on account `rodaquino-OMNI` with scopes `gist`, `read:org`, `repo`,
  `workflow` — not confirmation of a GitHub App installation. **This is an
  assumed equivalence that has not been validated**; an OAuth token and an App
  installation are different access mechanisms with different revocation,
  scope, and audit properties.
- **Why it matters:** Gate G0 cannot be closed on the basis of OAuth access
  alone if the governing prompt specifically requires App-installation access.
  Continuing to treat them as interchangeable risks an access-control gap
  going unnoticed (e.g. different effective permissions, different
  installation-level repository restrictions).
- **Validation required:** Confirm whether a GitHub App installation exists
  for `rodaquino-OMNI` on `Omni-Saude/amh-data-platform`, and if so, whether it
  or the OAuth token was actually used for prior AMH inspection. If no App
  installation exists, the prompt's Gate G0 access-method description and the
  actual access mechanism must be reconciled by a named human authority.
- **Owner:** UNASSIGNED — VALIDATION REQUIRED (`AUTH-DATA-PLATFORM` per
  `../authority-model.md`, jointly with `AUTH-SECURITY`)
- **Provenance:**
  - `source_repo`: `intensicare-V2` (this task packet) and
    `INTENSICARE_V2_ORCHESTRATOR_PROMPT.md`
  - `path_or_url`: `INTENSICARE_V2_ORCHESTRATOR_PROMPT.md`
  - `commit_sha_or_version`: n/a (prompt text, not a pinned artifact)
  - `section_or_lines`: `INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:87,243-244`
  - `date_collected`: 2026-08-14
  - `collector`: orchestrator / this governance steward
  - `transformation`: cross-referenced two statements to surface the discrepancy
  - `confidence`: high (the discrepancy itself is clearly documented); low
    (whether it is materially significant, pending validation)
  - `validation_status`: VALIDATION REQUIRED
- **Links:** `registers/blockers-register.md` `BLK-0009`.

- **Atualização (2026-08-15, pt-BR — conteúdo novo, escriba; não substitui o texto
  acima, que permanece o corpus de ciclo 0 em inglês, não retraduzido):** o
  bloqueador `BLK-0009` foi **RESOLVIDO POR RATIFICAÇÃO** em 2026-08-15
  (`DEC-G0-07`, decidido por `rodaquino-OMNI` — ver
  `registers/decision-register.md` `GDEC-0004` e
  `registers/g0-resolucoes-2026-08-15.md`): o mecanismo de acesso real
  observado — OAuth `gh` no usuário `rodaquino-OMNI` — foi ratificado como o
  mecanismo **sancionado**, substituindo a descrição de "GitHub App
  installation" na variável de runtime do prompt do orquestrador. A
  **discrepância factual** que esta entrada registra (OAuth token observado ×
  instalação de GitHub App descrita no prompt) permanece verdadeira e não é
  apagada por esta atualização — o que muda é que a lacuna de decisão sobre
  qual mecanismo é o sancionado **não está mais aberta**: um titular nomeado
  decidiu, com data e fundamento. Consequências práticas: (a) o campo
  "Validation required" acima permanece tecnicamente correto quanto à
  proveniência original do achado, mas a pendência de decisão que ele
  apontava está **fechada**; (b) item de melhoria não bloqueador registrado
  em `DEC-G0-07`: credencial de escopo fino somente-leitura restrita ao
  `amh-data-platform`, para substituir o token amplo — isto permanece aberto;
  (c) controle compensatório vigente: política de zero escrita da V2 em
  repositórios AMH (`../legacy-import-policy.md` §1). Ver também
  `registers/evidence-register.md` `EVID-0011` (verificação funcional sem
  novo login) e `EVID-0012` (re-pinagem sem deriva, mesmo mecanismo de
  acesso). `validation_status` efetivo desta assunção, pós-ratificação:
  **N/A — decisão já tomada pelo titular nomeado**; a entrada é mantida como
  registro histórico do raciocínio que motivou `BLK-0009`.

## ASM-0002 — AMH `main` will not drift during cycle 0

- **Label:** PROPOSAL / assumption of convenience
- **Statement:** It is assumed, for planning purposes only, that
  `Omni-Saude/amh-data-platform@main` will not drift materially from the
  pinned evidence snapshot `0a07a6f1fab36fb2f5eeee0fcd8e945c95f67116`
  (`EVID-0005`) during the remainder of cycle 0. This assumption **must be
  re-verified (re-pinned) at execution time** for every gate, contract
  decision, and compatibility claim — a point-in-time match on 2026-08-14 is
  not evidence about any later date.
- **Why it matters:** AMH is an actively developed external repository not
  under IntensiCare V2's control. ADRs, FHIR profiles, or the Maezo manifest
  could change at any time. Any V2 decision that cites AMH content must
  re-confirm the commit SHA at the time of that decision, not rely on this
  register entry.
- **Validation required:** Re-pin and diff `main` against
  `0a07a6f1fab36fb2f5eeee0fcd8e945c95f67116` immediately before any
  compatibility-dependent decision (Gate G3 and beyond), and record the result
  as a new `EVID-*` entry.
- **Owner:** UNASSIGNED — VALIDATION REQUIRED (`AUTH-DATA-PLATFORM`)
- **Provenance:**
  - `source_repo`: `Omni-Saude/amh-data-platform`
  - `path_or_url`: repository `main` branch
  - `commit_sha_or_version`: baseline `0a07a6f1fab36fb2f5eeee0fcd8e945c95f67116`
  - `section_or_lines`: n/a
  - `date_collected`: 2026-08-14
  - `collector`: this governance steward (assumption stated, not verified)
  - `transformation`: none — explicit statement of an unverified forward-looking assumption
  - `confidence`: medium (reasonable default, not evidence)
  - `validation_status`: VALIDATION REQUIRED (recurring — re-check at each phase gate, per `INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:245`)
- **Links:** `registers/evidence-register.md` `EVID-0005`, `EVID-0006`; Gate G3.

## ASM-0003 — Legacy assessment line citations accurate pending verification

- **Label:** PROPOSAL / assumption of convenience
- **Statement:** The orchestrator prompt cites specific line ranges within
  `INTENSICARE_TECHNICAL_ASSESSMENT.md` (e.g. lines 19-42, 94-152, 229-241,
  298-316, 639-647, 318-357, 759-767, 375-386, 709-727, 435-459, 779-787,
  461-499, 564-602, 729-737, 850-887, 889-940, 993-1029 — see
  `INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:74-85`). This register assumes those
  citations accurately reflect the current content of the legacy file at
  `/Users/familia/intensicare/INTENSICARE_TECHNICAL_ASSESSMENT.md`
  (`EVID-0003`). **This has not been independently re-verified line-by-line by
  this steward.**
- **Why it matters:** The legacy assessment is explicitly "a risk-informed
  input, not authority" (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:72`). If any
  cited line range has drifted (e.g. the legacy file was edited after the
  prompt was authored) or was mis-transcribed, downstream specialists could
  build requirements or hazards on a misquoted source.
- **Validation required:** Any specialist relying on a specific legacy-line
  citation must re-open the legacy file and re-confirm the cited content
  before treating it as SOURCE evidence, per `../evidence-notation.md`.
- **Owner:** UNASSIGNED — VALIDATION REQUIRED (whichever `AUTH-*` role owns
  the requirement/hazard/decision built on the citation)
- **Provenance:**
  - `source_repo`: `intensicare` (legacy)
  - `path_or_url`: `/Users/familia/intensicare/INTENSICARE_TECHNICAL_ASSESSMENT.md`
  - `commit_sha_or_version`: not recorded — legacy repo has no pinned commit cited in the orchestrator prompt for this file
  - `section_or_lines`: multiple, see statement above
  - `date_collected`: 2026-08-14
  - `collector`: this governance steward (assumption stated, not verified)
  - `transformation`: none
  - `confidence`: medium
  - `validation_status`: VALIDATION REQUIRED
- **Links:** `registers/evidence-register.md` `EVID-0003`, `EVID-0004`.

## ASM-0004 — Premissas P-1..P-7 da minuta de parecer LGPD (OS-16), destaque P-2 (pt-BR — conteúdo novo, 2026-08-15)

- **Label:** INFERENCE / PROPOSAL (fatos de negócio assumidos pelo engenheiro
  de privacidade, não conclusão jurídica)
- **Statement:** A minuta técnica preparatória do parecer da OS-16 assume
  sete premissas de fato de negócio que, se falsas, mudam a análise: **P-1**
  as PJs clínicas são serviços de saúde e nelas o tratamento ocorre em
  procedimento por profissionais de saúde; **P-2** (**destaque** — a mais
  consequente das sete) a `omni` é operadora de plano privado de assistência
  à saúde sujeita à regulação setorial de saúde suplementar — se falsa, muda
  toda a análise do ponto (a) da minuta, especialmente quanto ao art. 11,
  §5º da LGPD; **P-3** cada PJ é controladora dos dados de seus
  pacientes/beneficiários, e a AMH atua como plataforma que trata dados por
  conta delas; **P-4** a OMNI/IntensiCare V2 fornecerá o sistema a serviços
  de saúde, e o profissional que vê o alerta é o responsável pelo paciente
  naquele serviço; **P-5** nenhum dado real foi ou será tratado antes do
  parecer; **P-6** o IntensiCare V2 não substitui nem constitui o
  prontuário do paciente; **P-7** o índice do ADR-043 e o loop clínico do
  IntensiCare são tratamentos distintos, com finalidades distintas, e a V2
  nunca hospeda nem deriva o índice.
- **Why it matters:** nenhuma das sete premissas foi verificada por
  advogado(a) — são fatos de negócio assumidos para permitir que a minuta
  avance, não conclusões jurídicas. P-2 em especial condiciona toda a
  análise do ponto (a) (índice de correspondência de identidade entre PJs);
  se a natureza regulatória da `omni` como operadora estiver incorreta, a
  base legal candidata e as salvaguardas mínimas mudam por completo.
- **Validation required:** confirmação de cada premissa pelo(a) advogado(a)
  que emitir o parecer definitivo da OS-16; nenhuma pode ser tratada como
  verdadeira antes dessa confirmação.
- **Owner:** UNASSIGNED — VALIDATION REQUIRED (`AUTH-PRIVACY-LEGAL`, sem
  titular — `BLK-0004`/`DEC-G0-03`)
- **Provenance:**
  - `source_repo`: intensicare-V2
  - `path_or_url`: docs/11-security-privacy-compliance/lgpd-os16/minuta-parecer-os-16.md
  - `commit_sha_or_version`: n/a (criado nesta sessão, não commitado)
  - `section_or_lines`: "§1.5 (Premissas que a minuta assume e que o parecer precisa confirmar)"
  - `date_collected`: "2026-08-15"
  - `collector`: engenheiro de privacidade, LGPD e registros (IntensiCare V2, ciclo 1); consolidado neste register pelo governance-and-traceability steward
  - `transformation`: consolidação (INFERENCE) das sete premissas em uma única entrada de registro, com destaque a P-2 per instrução de integração
  - `confidence`: medium
  - `validation_status`: VALIDATION REQUIRED
- **Links:** `registers/evidence-register.md` `EVID-0013`; `registers/blockers-register.md` `BLK-0014`.

## ASM-0005 — Semântica de `patternCodeableConcept` sem `slicing` (QD-6) (pt-BR — conteúdo novo, 2026-08-15)

- **Label:** VALIDATION REQUIRED (nuance técnica que muda o custo de opções, não decidida)
- **Statement:** O profile `Observation-amh-laboratory-profile.json` fixa
  `Observation.category` via `patternCodeableConcept={laboratory}` sem
  `slicing`, o que exclui estruturalmente qualquer outra categoria
  (`vital-signs`, `survey`, `exam` etc.) de qualquer instância conforme a
  esse profile. Não está determinado se essa exclusão foi a intenção do
  desenho da IG (categoria única, deliberada) ou um efeito não pretendido de
  um `pattern` aplicado onde `slicing` seria o correto (permitindo múltiplas
  categorias por instância). As duas leituras levam à mesma conclusão
  prática — sinais vitais exigem profile próprio — mas divergem sobre se a
  correção necessária é uma emenda ao profile existente ou um artefato novo.
- **Why it matters:** determina o custo e a forma da correção estrutural que
  qualquer opção de desbloqueio de C-1 (sinais vitais) exigiria do lado AMH.
- **Validation required:** resposta do titular/dono AMH — esta é a questão
  QD-6 do pacote de decisão C-1.
- **Owner:** UNASSIGNED — VALIDATION REQUIRED (`AUTH-DATA-PLATFORM`, lado AMH)
- **Provenance:**
  - `source_repo`: Omni-Saude/amh-data-platform (evidência lida) / intensicare-V2 (registro)
  - `path_or_url`: docs/08-interoperability/amh-data/vital-signs-decision/pacote-decisao-c1-sinais-vitais.md
  - `commit_sha_or_version`: "0a07a6f1fab36fb2f5eeee0fcd8e945c95f67116 (evidência AMH); registro V2 não commitado"
  - `section_or_lines`: "§2.2 (nuance técnica QD-6); §6 (quadro de questões, QD-6)"
  - `date_collected`: "2026-08-15"
  - `collector`: especialista de decisão de sinais vitais (IntensiCare V2, ciclo 1); consolidado neste register pelo governance-and-traceability steward
  - `transformation`: resumida da leitura direta do profile JSON relatada pelo especialista
  - `confidence`: medium
  - `validation_status`: VALIDATION REQUIRED
- **Links:** `registers/evidence-register.md` `EVID-0014`; `registers/blockers-register.md` `BLK-0012`.

## ASM-0006 — Divergência 5×6 tipos de evento de identidade, ata × OS-17 (pt-BR — conteúdo novo, 2026-08-15)

- **Label:** INFERENCE (reasoned from ata de adjudicação + ADR-0004 §5.5 + memória de desenho N-8)
- **Statement:** A ata de adjudicação (`IDN-ADJ-2026-08-15`, resolução AQ-5)
  enumera **cinco** tipos obrigatórios de evento de ciclo de vida de
  identidade (`alias`, `merge`, `unmerge`, `restore`, `erasure`). A OS-17 e
  o `contracts.lock.draft.yaml` enumeram **seis** (acrescentando
  `reassignment`). `ADR-0004` §5.5 (reconciliação item D-08) registra
  explicitamente a mesma divergência e a corrige a favor da ata (cinco
  tipos), distinguindo a lista de seis como derivação da OS-17, não do teor
  da ata. A minuta do contrato v1 (`memoria-de-desenho.md`, ponto de
  negociação N-8) resolveu operacionalmente seguir os seis da OS-17,
  tratando a eventual remoção de `reassignment` como emenda compatível se o
  titular confirmar os cinco da ata.
- **Why it matters:** o número de tipos de evento é uma cláusula contratual
  vinculante (AQ-5); um contrato publicado com seis tipos quando a decisão
  do titular cobre apenas cinco criaria uma obrigação além do que foi
  decidido.
- **Validation required:** confirmação explícita do titular sobre qual
  conjunto (cinco ou seis) é vinculante para o contrato AMH×IntensiCare v1.
- **Owner:** UNASSIGNED — VALIDATION REQUIRED (`AUTH-DATA-PLATFORM`, conjuntamente com rodaquino-OMNI como titular da ata)
- **Provenance:**
  - `source_repo`: intensicare-V2
  - `path_or_url`: "docs/08-interoperability/amh-data/contract-v1/memoria-de-desenho.md; docs/06-architecture/adrs/ADR-0004-identidade-paciente-encontro-mpi.md"
  - `commit_sha_or_version`: n/a (working tree, branch cycle-1/clinical-content)
  - `section_or_lines`: "memoria-de-desenho.md §8 ponto N-8; ADR-0004 §5.5 item D-08"
  - `date_collected`: "2026-08-15"
  - `collector`: steward de publicação de contrato AMH×IntensiCare + arquiteto de decisões de fronteira e modelo canônico; consolidado neste register pelo governance-and-traceability steward
  - `transformation`: consolidação (INFERENCE) de duas citações independentes da mesma divergência em uma única entrada de registro
  - `confidence`: high
  - `validation_status`: VALIDATION REQUIRED
- **Links:** `registers/evidence-register.md` `EVID-0016`; `registers/blockers-register.md` `BLK-0015`.

## ASM-0007 — B4a/B4b e o gatilho de perecibilidade (pt-BR — conteúdo novo, 2026-08-15)

- **Label:** PROPOSAL (melhor interpretação do kit de pesquisa, não definição registrada em VAL-0035/G2-VAL-0025)
- **Statement:** O protocolo de baselines perecíveis desdobra "tempo até
  reconhecimento" em duas medidas distintas, com custo, base legal e
  perecibilidade diferentes: **B4a** — proxy observacional, definido pelo
  primeiro sinal de alteração presenciado pelo observador até a primeira
  ação/verbalização clínica, **perecível**, sem exigência de base legal se
  registrado conforme §5.3 do protocolo; **B4b** — adjudicada por registro
  clínico retrospectivo, definida por rubrica pré-registrada, **não
  perecível** enquanto os registros do período pré-implantação forem
  retidos, mas exige `VAL-0036` (rubrica pré-registrada) e `VAL-0037` (base
  legal) antes de poder ser medida. O gatilho de perecibilidade (protocolo
  §2 — demonstração, treinamento ou piloto visível a clínicos) fecha a
  janela de B1/B2/B3/B4a, mas **não** fecha B4b.
- **Why it matters:** nem `VAL-0035` nem `G2-VAL-0025` operacionalizam
  "tempo até reconhecimento" no período pré-V2 — este desdobramento é a
  melhor interpretação do kit de pesquisa, não uma definição já registrada.
- **Validation required:** `AUTH-UX` e `AUTH-CLINSAFETY` devem ratificar ou
  substituir esta interpretação **antes** da coleta; se substituída, a nova
  definição deve ser fixada antes da coleta, não depois.
- **Owner:** UNASSIGNED — VALIDATION REQUIRED (`AUTH-UX` + `AUTH-CLINSAFETY`)
- **Provenance:**
  - `source_repo`: intensicare-V2
  - `path_or_url`: docs/02-users-and-workflows/g1-kit/protocolo-baselines-pereciveis.md
  - `commit_sha_or_version`: n/a (criado nesta sessão, não commitado)
  - `section_or_lines`: "§5.1 (ambiguidade registrada — stop condition); §5.5 (B4b — o que precisa existir antes)"
  - `date_collected`: "2026-08-15"
  - `collector`: líder de pesquisa contextual de UTI (ciclo 2); consolidado neste register pelo governance-and-traceability steward
  - `transformation`: resumida do protocolo autocontido de baselines perecíveis
  - `confidence`: medium
  - `validation_status`: VALIDATION REQUIRED
- **Links:** `registers/risk-register.md` `RISK-0008`; `registers/blockers-register.md` `BLK-0013`.

## ASM-0008 — Premissas A1-A6 dos ADRs 0001/0003/0005 (consolidado) (pt-BR — conteúdo novo, 2026-08-15)

- **Label:** INFERENCE / PROPOSAL (premissas §2.2 dos próprios ADRs, ainda `proposed`)
- **Statement:** Consolida as premissas registradas na seção "Evidência e
  premissas" (§2.2) dos três ADRs de fronteira/modelo canônico ainda em
  `proposed`, cada uma com dono `UNASSIGNED — VALIDATION REQUIRED` no
  próprio ADR: **ADR-0001** (A1–A6) — o snapshot de evidência AMH pinado
  continua a descrever a intenção da AMH no commit de execução; o portfólio
  aprovado (Gate G2) exigirá ao menos uma classe de insumo que a AMH não
  popula hoje (vitais ou labs numéricos); um requisito de latência de
  segundos a poucos minutos sobreviverá à validação do Gate G1; a V2 será
  operada por organização capaz de deter um armazenamento operacional
  crítico de segurança; a escrita no repositório AMH permanece fora da
  autoridade da V2; os papéis de controlador/operador LGPD diferem
  materialmente entre "V2 detém o dado clínico" e "AMH o detém em nome da
  V2". **ADR-0003** (A1–A4) — a enumeração de 12 tenants pós-ADR-041
  permanece estável até a publicação da IG 1.1.0; o escopo inicial da V2 é
  um tenant piloto (nome adiado pelo titular) com desenho multi-tenant desde
  o dia um; a hierarquia facility/unidade/leito é necessária para
  roteamento clínico mas não é fronteira de isolamento de segurança; a
  tabela `tenant → legal_entity` (OS-10) será entregue pela AMH antes de
  qualquer persistência de fato clínico com PSR. **ADR-0005** (A1–A4) — a
  aceitação do ADR-0008 manteve N5/N8 compatíveis com o modelo de tempo
  clínico e dimensões separadas deste ADR; fontes futuras não-AMH terão
  vocabulários de qualidade próprios, mapeáveis à dimensão 1 genérica; UCUM
  é adequado como sistema canônico de unidades para os insumos das vias
  candidatas; o snapshot de terminologia versionado no bundle de regras
  (ADR-0007) é o veículo das tabelas de conversão de unidade e catálogos de
  código.
- **Why it matters:** cada premissa, se invalidada, muda materialmente o
  espaço de opções do ADR correspondente; nenhuma tem dono nomeado hoje, e
  os próprios ADRs instruem que sejam registradas aqui, não cunhadas neles.
- **Validation required:** o dono nomeado de cada ADR (na aceitação) deve
  confirmar ou refutar cada premissa listada; nenhuma pode ser tratada como
  fato até essa confirmação.
- **Owner:** UNASSIGNED — VALIDATION REQUIRED (`AUTH-DATA-PLATFORM`, um por ADR na aceitação)
- **Provenance:**
  - `source_repo`: intensicare-V2
  - `path_or_url`: "docs/06-architecture/adrs/ADR-0001-amh-platform-boundary.md; docs/06-architecture/adrs/ADR-0003-tenancy-organizacao-facility-propriedade-de-recurso.md; docs/06-architecture/adrs/ADR-0005-modelo-canonico-observacao-proveniencia-qualidade-correcao-tempo.md"
  - `commit_sha_or_version`: n/a (working tree, branch cycle-1/clinical-content)
  - `section_or_lines`: "ADR-0001 §2.2; ADR-0003 §2.2; ADR-0005 §2.2 (todas rotuladas 'Evidência e premissas'/'Assumptions')"
  - `date_collected`: "2026-08-15"
  - `collector`: governance-and-traceability steward (consolidação direta dos três ADRs; nenhum ID `ASM` cunhado nos ADRs, per instrução explícita de cada um)
  - `transformation`: consolidação (INFERENCE) de catorze premissas individuais (seis + quatro + quatro) em uma única entrada de registro
  - `confidence`: high
  - `validation_status`: VALIDATION REQUIRED
- **Links:** `registers/risk-register.md` `RISK-0010`.

## Index

| ID | Assumption (short) | Type | Validation status | Owner |
|---|---|---|---|---|
| ASM-0001 | GitHub App installation vs OAuth token discrepancy | INFERENCE | N/A — ratificado por DEC-G0-07 (2026-08-15); ver atualização de escriba abaixo | rodaquino-OMNI (DEC-G0-07) |
| ASM-0002 | AMH `main` will not drift during cycle 0 | PROPOSAL | VALIDATION REQUIRED (recurring) — satisfeito para 2026-08-15 (EVID-0012) | UNASSIGNED |
| ASM-0003 | Legacy assessment line citations accurate | PROPOSAL | VALIDATION REQUIRED | UNASSIGNED |
| ASM-0004 | Premissas P-1..P-7 da minuta LGPD OS-16 (destaque P-2) | INFERENCE/PROPOSAL | VALIDATION REQUIRED | UNASSIGNED |
| ASM-0005 | Semântica de `patternCodeableConcept` sem `slicing` (QD-6) | VALIDATION REQUIRED | VALIDATION REQUIRED | UNASSIGNED |
| ASM-0006 | Divergência 5×6 tipos de evento de identidade, ata × OS-17 | INFERENCE | VALIDATION REQUIRED | UNASSIGNED |
| ASM-0007 | B4a/B4b e o gatilho de perecibilidade | PROPOSAL | VALIDATION REQUIRED | UNASSIGNED |
| ASM-0008 | Premissas A1-A6 dos ADRs 0001/0003/0005 (consolidado) | INFERENCE/PROPOSAL | VALIDATION REQUIRED | UNASSIGNED |
