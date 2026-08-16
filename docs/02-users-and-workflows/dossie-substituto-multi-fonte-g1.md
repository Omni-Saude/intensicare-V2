---
doc_id: USR-G1-DOSSIE-SUBSTITUTO
title: >
  IntensiCare V2 — Dossiê substituto multi-fonte do Gate G1
  (evidência substituta de uso pretendido — GDEC-0009/AGT-1)
status: PROPOSAL
label: PROPOSAL
version: 0.1.0-draft
approver: UNASSIGNED — VALIDATION REQUIRED
approver_roles:
  - Painel AGT-4 (revisor + ≥3 verificadores adversariais de lentes distintas — GDEC-0009/AGT-4)
  - rodaquino-OMNI no MG-G1 (aprovação nominal do uso pretendido — ato humano remanescente, BLK-0008)
owner: UNASSIGNED — VALIDATION REQUIRED
validation_status: VALIDATION REQUIRED
last_updated: 2026-08-16
provenance:
  source_repo: intensicare-V2
  path_or_url: docs/02-users-and-workflows/dossie-substituto-multi-fonte-g1.md
  commit_sha_or_version: 4fba956bc4da1172525f1e0508b242b9a024fcdd (HEAD de cycle-4/gates-g1-g2-agentificados na redação; este arquivo é novo)
  section_or_lines: documento inteiro
  date_collected: 2026-08-16
  collector: engenheiro de dossiê de evidência substituta de uso pretendido (AGT-1, sprint SPR-G1-9 — papel AUTOR no painel AGT-4)
  transformation: >
    Síntese de quatro pernas de evidência substituta: (a) literatura de fatores
    humanos verificada na web NESTA sessão (URLs e datas de acesso em §2.1);
    (b) forense do legado já registrada no repositório (caminhos em §2.2);
    (c) perna retrospectiva DECLARADA pendente, jamais simulada (§2.3);
    (d) posições escritas do titular transcritas com fonte (§2.4). Nenhum
    item do g1-validation-backlog foi fechado; todos os 43 foram DISPOSTOS
    em §4 sem omissão. Nenhuma observação de usuário foi realizada nem alegada.
  confidence: medium
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
evidence_inputs:
  - repo: intensicare-V2
    path: docs/00-governance/registers/agentificacao-g1-g2-2026-08-15.md
    commit: 4fba956bc4da1172525f1e0508b242b9a024fcdd
    lines_used: "21-64 (AGT-1, AGT-2), 111-121 (AGT-4), 123-137 (honestidade), 170-179 (nota de recepção do parecer)"
  - repo: intensicare-V2
    path: docs/02-users-and-workflows/g1-validation-backlog.md
    commit: 4fba956bc4da1172525f1e0508b242b9a024fcdd
    lines_used: "íntegra (43 itens VAL; §0 contagens; §J regras de fechamento)"
  - repo: intensicare-V2
    path: docs/02-users-and-workflows/g1-kit/pedido-de-comissionamento.md
    commit: 4fba956bc4da1172525f1e0508b242b9a024fcdd
    lines_used: "233-304 (§6 — bloco de decisão preenchido por transcrição de instrução escrita do titular)"
  - repo: intensicare-V2
    path: docs/02-users-and-workflows/g1-kit/protocolo-pesquisa-g1.md
    commit: 4fba956bc4da1172525f1e0508b242b9a024fcdd
    lines_used: "448-519 (§6 mapeamento C/I/N dos 43 itens; §6.1 contagem)"
  - repo: intensicare-V2
    path: docs/05-clinical-safety/legacy-review/00-inventory/coverage-map.md
    commit: 4fba956bc4da1172525f1e0508b242b9a024fcdd
    lines_used: "49-68 (cobertura), 70-127 (workstreams de usuários/fluxo/alertas/formulários)"
  - repo: intensicare-V2
    path: docs/05-clinical-safety/legacy-review/ews/shared-findings.md
    commit: 4fba956bc4da1172525f1e0508b242b9a024fcdd
    lines_used: "SF-1..SF-9"
  - repo: intensicare-V2
    path: docs/05-clinical-safety/legacy-review/alert-threshold-engine/README.md
    commit: 4fba956bc4da1172525f1e0508b242b9a024fcdd
    lines_used: "72-92 (headline findings 1-5)"
  - repo: intensicare-V2
    path: docs/00-governance/registers/risk-register.md
    commit: 4fba956bc4da1172525f1e0508b242b9a024fcdd
    lines_used: "567-608 (RISK-0013 íntegra)"
  - repo: intensicare-V2
    path: docs/14-devsecops-and-delivery/mapa-de-projeto-ate-producao.md
    commit: 4fba956bc4da1172525f1e0508b242b9a024fcdd
    lines_used: "296-321 (linha SPR-G1-9; entregáveis e DoD)"
  - repo: intensicare-V2
    path: docs/01-vision-and-intended-use/intended-use-statement.md; docs/02-users-and-workflows/user-roles-hypotheses.md; docs/02-users-and-workflows/workflow-hypotheses.md
    commit: 4fba956bc4da1172525f1e0508b242b9a024fcdd
    lines_used: "IU-01..IU-12; UR-01..UR-08; WF-01..WF-08 e lista nunca-normal §1"
web_sources_verified_this_session: "6 (L-1..L-6 em §2.1; cada uma com URL, data de acesso 2026-08-16 e método de verificação)"
---

# Dossiê substituto multi-fonte — Gate G1 (versão 0.1.0-draft)

> **Natureza:** PROPOSAL de AUTOR (painel AGT-4). Este artefato será julgado por
> revisor + ≥3 verificadores adversariais distintos; **maioria refuta = o
> artefato morre** (GDEC-0009/AGT-4). Nenhuma linha abaixo fecha item, risco ou
> bloqueador; nenhuma linha carrega o rótulo de ratificação de autoridade.

---

## §1. Objeto, base normativa e o que este dossiê NÃO é

### 1.1 Objeto

**SOURCE** (`../00-governance/registers/agentificacao-g1-g2-2026-08-15.md`,
AGT-1): por decisão do titular nomeado (GDEC-0009), "a observação humana direta
de usuários deixa de ser exigência de passagem do G1. Passa a valer como
evidência do gate o **dossiê substituto multi-fonte** produzido e verificado por
agentes: literatura de fatores humanos e fluxo de trabalho de UTI, forense do
legado já concluída, dados retrospectivos quando acessíveis, e as hipóteses
clínicas do titular **rotuladas como hipótese de especialista** (jamais como
observação)."

Este documento É esse dossiê, na sua versão 0.1.0-draft: as quatro pernas estão
em §2, a síntese temática do G1 em §3, e a **disposição integral dos 43 itens do
`g1-validation-backlog.md`** em §4 — nenhum item omitido.

**SOURCE** (`../14-devsecops-and-delivery/mapa-de-projeto-ate-producao.md`,
linha SPR-G1-9): entregável = "dossiê em `docs/02-users-and-workflows/`";
DoD = "aprovado por painel AGT-4 (...); cada item VAL com evidência ou risco
aceito explícito".

### 1.2 Base normativa

1. **SOURCE** (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md:253`, via
   `g1-validation-backlog.md:36-38`): o texto original do Gate G1 prevê duas
   rotas — "intended users have been observed **or the absence is explicitly
   accepted as a blocking risk**". A rota escolhida pelo titular foi a segunda.
2. **SOURCE** (`../00-governance/registers/risk-register.md`, RISK-0013): a
   ausência de observação direta está registrada como risco **formalmente
   ACEITO pelo titular** (owner: rodaquino-OMNI; "ACEITO pelo titular
   (GDEC-0009); reavaliar na entrada do piloto (G8)"). Os vieses estruturais
   aceitos estão transcritos linha a linha em §5.
3. **SOURCE** (`g1-kit/pedido-de-comissionamento.md` §6, bloco preenchido por
   transcrição de instrução escrita do titular, 2026-08-15): rota de VAL-0005 =
   "[x] risco bloqueante aceito (AGT-1; RISK-0013)"; comissionamento mantido
   "integralmente no escopo agentificado de GDEC-0009".

### 1.3 O que este dossiê NÃO é

- **NÃO é observação.** Nenhum usuário de IntensiCare V2 foi observado,
  entrevistado ou recrutado — **OBSERVED** (reafirmado nesta sessão sobre o
  repositório em 4fba956): a advertência de `user-roles-hypotheses.md` ("NO
  USER OF INTENSICARE V2 HAS EVER BEEN OBSERVED") permanece verdadeira. Nada
  aqui converte hipótese em observação.
- **NÃO fecha o Gate G1.** O fechamento é ato humano no MG-G1 (§6; BLK-0008).
- **NÃO fecha nenhum item VAL, risco ou bloqueador.** §4 *dispõe* (classifica
  com evidência e justificativa); fechar é vedado a agente — **SOURCE**
  (`g1-validation-backlog.md` §J: "No agent may close any item in this
  backlog").
- **NÃO contém dado retrospectivo real.** A perna (c) é declarada pendente
  (§2.3), nunca simulada — DEC-G0-03 (só sintético até parecer) permanece
  integral.
- **NÃO neutraliza os vieses que carrega.** Eles estão declarados em §5, sem
  suavização, porque a decisão AGT-1 os aceitou *às claras*, não os aboliu.

---

## §2. As quatro pernas da evidência substituta e o estado de cada uma

| Perna | Estado nesta versão |
|---|---|
| (a) Literatura de fatores humanos/fluxo de UTI | **PRESENTE** — 6 fontes verificadas na web NESTA sessão (§2.1) |
| (b) Forense do legado | **PRESENTE** — registros já commitados no repositório, com caminhos (§2.2) |
| (c) Dados retrospectivos | **PENDENTE — GATED em OS-16** (SPR-G1-10); declarada, jamais simulada (§2.3) |
| (d) Hipóteses do titular | **PRESENTE E FINA** — apenas o que existe por escrito, transcrito com fonte (§2.4) |

### §2.1 Perna (a) — literatura verificada (cada fonte verificada na web nesta sessão)

Regra aplicada: **nenhuma citação de memória**. Cada fonte abaixo foi localizada
e lida via busca/fetch em 2026-08-16; o que se afirma de cada uma é o que a
página consultada diz. Preferiu-se **poucas fontes verificadas** a muitas não
verificadas. Lacunas de literatura são declaradas como lacunas (ver L-GAP).

| ID | Fonte | URL (acesso 2026-08-16) | O que a fonte diz (fiel ao consultado) |
|---|---|---|---|
| **L-1** | Drew BJ et al., "Insights into the Problem of Alarm Fatigue with Physiologic Monitor Devices…", PLOS ONE, 2014 | `https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0110274` (fetch do artigo) | **SOURCE:** 2.558.760 alarmes únicos em 31 dias, 461 pacientes consecutivos, 5 UTIs adultas (77 leitos); carga média de **187 alarmes audíveis por leito por dia**; **88,8%** dos 12.671 alarmes de arritmia anotados eram falso-positivos; caso documentado de alarmes de bradicardia que ninguém da unidade recordava ter ouvido antes de uma parada cardíaca — a fadiga de alarme torna alarmes "ruído de fundo" |
| **L-2** | Royal College of Physicians — página oficial do NEWS2 | `https://www.rcp.ac.uk/improving-care/resources/national-early-warning-score-news-2/` (fetch) | **SOURCE:** o RCP desenvolveu e publica o NEWS2 (relatório atualizado em dezembro de 2017); o NEWS2 "advoga um sistema para padronizar a avaliação e a resposta à doença aguda" com 6 parâmetros fisiológicos de rotina, visando resposta rápida ao paciente em deterioração |
| **L-3** | Ficha clínica NEWS2 (a4medicine), citando RCP 2017 | `https://a4medicine.com/chart/details/National_Early_Warning_Score_(NEWS)_2+64721e23daf5ca88acbcee8d` (fetch) | **SOURCE (secundária, declarada como tal):** "NEWS2 should not be used in children under 16 or pregnant women", citando o relatório RCP 2017. Corrobora, por via independente, a citação primária já registrada no repositório em `../05-clinical-safety/legacy-review/ews/shared-findings.md` SF-6 (RCP 2017 §2: desenhado para ≥16 anos; não recomendado <16 nem gestação) |
| **L-4** | Westbrook JI et al., Archives of Internal Medicine, 26/04/2010 (estudo observacional direto) — consultado via release da ScienceDaily | `https://www.sciencedaily.com/releases/2010/04/100426181958.htm` (fetch) | **SOURCE:** 98 enfermeiros observados preparando/administrando 4.271 medicações a 720 pacientes em 505 h (6 enfermarias, 2 hospitais-escola); **cada interrupção associada a +12,1% de falhas procedurais e +12,7% de erros clínicos**; risco estimado de erro grave 2,3% sem interrupção → 4,7% com 4 interrupções. **Ressalva declarada:** enfermarias, não UTI — a transferência ao setting de UTI é INFERENCE, não achado |
| **L-5** | AAST Critical Care Committee — consenso clínico "Handoffs and transitions of care in the intensive care unit" | `https://pmc.ncbi.nlm.nih.gov/articles/PMC11836866/` (fetch) | **SOURCE:** "communication breakdown is a leading cause of medical errors, particularly for critically ill and surgical patients"; erros de cuidado em UTI em média 1,7×/paciente/dia; recomenda handoffs **verbais, padronizados, em horários dedicados, incluindo todos os provedores e todos os pacientes em transição**; ressalva do próprio consenso: "limited high-quality empirical evidence" sobre melhores práticas e benefício em desfechos |
| **L-6** | Difonzo M, "Performance of the Afferent Limb of Rapid Response Systems in Managing Deteriorating Patients: A Systematic Review", Crit Care Res Pract, 2019 | `https://pmc.ncbi.nlm.nih.gov/articles/PMC6874970/` (fetch) | **SOURCE:** revisão sistemática de 31 estudos (1995–2017, 11 países); *afferent limb failure* = critérios de acionamento documentados sem acionamento do time antes do evento adverso; frequência respiratória mal registrada (14–17% em vários settings); cálculo incorreto de EWS em ~19–26% dos casos; **acionamento tardio em 21–57%** dos pacientes com critérios documentados; atraso associado a mais admissão não planejada em UTI (OR 1,56–1,79), mais mortalidade hospitalar (OR 1,79–2,18) e mortalidade em 30 dias 61,8% vs 41,9% |
| **L-GAP** | Lacuna declarada | — | **OBSERVED (desta sessão):** não foi verificada nesta sessão fonte específica sobre (i) calibração de *desconfiança* apropriada em CDS de UTI (VAL-0029), (ii) fluxo de trabalho de enfermagem de UTI **brasileira** (razão enfermeiro:leito, papéis diarista/plantonista), (iii) compreensão de estados "não avaliado" por clínicos. Essas afirmações permanecem sem perna de literatura — não foram fabricadas |

**INFERENCE (sobre L-1..L-6 em conjunto):** a literatura sustenta quatro fatos
de desenho com relevância direta ao G1 — (i) a carga de alarmes em UTI real é
alta e majoritariamente falsa (L-1), logo cada sinal novo da V2 tem custo real
de atenção; (ii) interrupção é condição basal do trabalho de enfermagem e
degrada a execução mensuravelmente (L-4, com a ressalva de setting); (iii) a
passagem de plantão é ponto reconhecido de quebra de comunicação, e a
recomendação vigente é padronização verbal em horário dedicado (L-5); (iv) o
elo aferente — monitorar, reconhecer, escalar — falha com frequência alta mesmo
com critérios documentados (L-6), o que fundamenta desenhar dono explícito de
escalada em vez de assumi-lo. Nada disso descreve *a unidade-alvo*; descreve a
classe de ambientes (viés (a) de RISK-0013, §5).

### §2.2 Perna (b) — forense do legado (o que o sistema anterior FAZIA, com caminhos)

**Natureza declarada:** a forense do legado é evidência de **como o sistema
anterior era construído e configurado** — não de comportamento observado de
usuários. **SOURCE** (`INTENSICARE_TECHNICAL_ASSESSMENT.md:56`, via
`user-roles-hypotheses.md`): "No stakeholder interviews or observed ICU
workflow studies were performed."

Registros usados (todos PROPOSAL aguardando revisão clínica nomeada; legado
pinado em `1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79`):

- `../05-clinical-safety/legacy-review/00-inventory/coverage-map.md` — todo
  item clinicamente substantivo do legado atribuído a exatamente um workstream
  ou deferido com razão registrada.
- `../05-clinical-safety/legacy-review/alert-threshold-engine/README.md` (+
  `engine-review.md`, `thresholds-seed-review.md`,
  `alert-threshold-cluster-review.md`) — achados de manchete: **(1)**
  floor-to-normal localizado no código (`derive_bed_severity` renderiza leito
  não avaliado como `normal` — veredito proposto REJECT; HAZ-0005); **(2)**
  precedência "assistido" mascara severidade em leito, via e setor; **(3)**
  supressão silenciosa sem registro no caminho vivo de alertas
  (HAZ-0021/0022); **(4)** SOFA/qSOFA roteados ao motor de alertas **sem
  thresholds semeados** — nunca alertam na configuração padrão, sem razão de
  no-fire registrada; **(5)** resolução de thresholds duplicada e divergente.
- `../05-clinical-safety/legacy-review/ews/shared-findings.md` — SF-1 (camada
  de alertas EWS por evento é código morto: alertas de escore vermelho e de
  tendência nunca ligados); SF-2 (trilhas de versão/ratificação não
  confiáveis); SF-3 (token inválido coagido ao polo tranquilizador, com
  inconsistência por rota de ingestão); SF-4 (thresholds configuráveis sem
  piso clínico); SF-5 (nenhuma política de frescor/completude na fronteira de
  escore — insumo concreto de VAL-0023); SF-6 (fronteira de instrumento adulto
  não imposta — nem idade existe no schema de ingestão; insumo de
  VAL-0006/0007/0008); SF-7 (contrato documentado prometia None para dado
  insuficiente; código devolvia zero coagido).
- `../05-clinical-safety/legacy-review/clinical-documentation-forms/` e
  `../05-clinical-safety/legacy-review/neuro-sedation-scores/` — formulários
  clínicos e escores neuro/sedação do legado (população de regras e formulários
  que a V2 NÃO importa por padrão — `legacy-import-policy.md` §1).
- Hipóteses derivadas do legado já re-rotuladas:
  `user-roles-hypotheses.md` (UR-01..UR-08) e `workflow-hypotheses.md`
  (WF-01..WF-08 + lista nunca-normal §1) — "documentação sobre documentação",
  a dois passos da realidade, e assim rotulada.

**INFERENCE (sobre a perna (b) em conjunto):** a forense prova que o produto
anterior foi *construído* para uma vigilância de grade de leitos com defeitos
sistemáticos de falsa tranquilização (floor-to-normal, mascaramento por
"assistido", supressão silenciosa, coerção de inválido a zero) e **sem**
conceito de passagem de plantão. Isso fundamenta duas coisas: a lista
nunca-normal (§3.7) e a decisão de NÃO herdar as jornadas do legado como se
fossem fluxo real. Não fundamenta nenhuma afirmação sobre o que clínicos fazem
(viés (b) de RISK-0013, §5).

### §2.3 Perna (c) — retrospectiva: PENDENTE, GATED, jamais simulada

- **SOURCE** (ata AGT-2): os baselines G2-VAL-0025/VAL-0035 passam a ser
  satisfeitos por **baseline retrospectivo derivado de dados** (histórico
  Tasy/Gold da AMH, quando acessível), com corte histórico fixado ANTES de
  qualquer exposição visível a clínicos e vieses declarados linha a linha.
- **OBSERVED (desta sessão):** nenhum dado retrospectivo é acessível nesta
  sessão. DEC-G0-03 (apenas dado sintético até parecer jurídico) permanece
  integral; a nota do escriba na ata registra que **a condição 4 (ratificação
  jurídica) permanece NÃO satisfeita** — parecer OS-16 recebido com
  complementação de forma pendente (critérios iii/iv).
- **Disposição desta perna:** os itens que dependem dela ficam
  **PENDENTE-RETROSPECTIVA (OS-16)** em §4 e serão executados em **SPR-G1-10**
  ("baseline retrospectivo arquivado + declaração de vieses"). Nenhum número
  retrospectivo aparece neste dossiê — e qualquer versão futura que traga
  números deve trazê-los com corte histórico registrado e verificação AGT-4.

### §2.4 Perna (d) — hipóteses do titular (somente o que existe por escrito, com fonte)

Regra aplicada: **nenhuma hipótese nova foi inventada em nome do titular.**
Transcreve-se abaixo o que existe por escrito no repositório, rotulado
**HIPÓTESE-DE-ESPECIALISTA (titular)** — rótulo imposto por AGT-1: opinião
qualificada de um intensivista nomeado, **jamais** evidência de observação
(princípio de DEC-G0-05, incorporado ao rótulo pela própria ata).

| # | Posição escrita do titular | Fonte verbatim |
|---|---|---|
| T-1 | **HIPÓTESE-DE-ESPECIALISTA (titular):** o dossiê substituto multi-fonte (AGT-1) e o baseline retrospectivo com corte pré-exposição (AGT-2) **satisfazem a evidência do G1**; o campo observacional permanece opcional, pré-piloto, gateado em ética (BLK-0013) | `g1-kit/pedido-de-comissionamento.md` §6, campo "Razão", transcrição de instrução escrita do titular (2026-08-15) |
| T-2 | **HIPÓTESE-DE-ESPECIALISTA (titular):** reconhecimento expresso de que os baselines VAL-0035/G2-VAL-0025 serão permanentemente perdidos a partir da primeira exposição visível a clínicos, com mitigação parcial pela via retrospectiva; **os componentes observacionais — interrupções, fadiga — permanecem perdíveis** | `g1-kit/pedido-de-comissionamento.md` §6, bloco de reconhecimento "(d) = risco aceito" |
| T-3 | **HIPÓTESE-DE-ESPECIALISTA (titular):** o kit G1 permanece válido como **especificação da variante observacional opcional** — nenhuma alteração exigida ao protocolo | `g1-kit/pedido-de-comissionamento.md` §6, campo "Alterações exigidas" |
| T-4 | Contra-assinatura das decisões AGT-1..AGT-4 como suas, com ciência expressa da divergência registrada em AGT-3 | `../00-governance/registers/agentificacao-g1-g2-2026-08-15.md`, bloco de contra-assinatura (GDEC-0011 item 1) |
| T-GAP | **OBSERVED (desta sessão) — declaração de magreza da perna:** além dos blocos acima (que são posições *decisórias*), **não foi localizada no repositório nenhuma hipótese clínica de fluxo/uso escrita pelo titular** (ex.: quem monitora na unidade-alvo, como se escala à noite). A perna (d) está, nesta versão, **fina por construção** — e engrossa apenas por ato escrito futuro do titular, nunca por atribuição do autor | — |

---

## §3. Síntese por tema do Gate G1 — cada afirmação rotulada e com fonte

> Formato: para cada tema do G1, o que a evidência substituta sustenta (com
> perna e fonte) e o que permanece descoberto (com destino: RISK-0013, OS-16 ou
> variante observacional). As hipóteses UR-*/WF-* citadas são PROPOSTAS não
> validadas — repeti-las aqui não as promove.

### 3.1 Quem monitora, quem age, quem escala, quem encerra

- **SOURCE (L-6):** o elo aferente falha com frequência: acionamento tardio em
  21–57% dos casos com critérios documentados; barreiras culturais e julgamento
  pessoal condicionam a escalada. **INFERENCE (de L-6):** a V2 não pode assumir
  que "alguém" escala — o dono da escalada precisa ser explícito, visível e
  transferível, e a ausência de dono é o estado a ser desenhado, não a exceção.
- **SOURCE (repo):** as respostas às quatro perguntas do G1 são hipóteses de
  confiança baixa/muito baixa (`user-roles-hypotheses.md` §2: monitora =
  UR-02/03/01; age = UR-02/01; escala = UR-02→UR-01 com UR-03 para itens sem
  atenção; encerra = quem agiu, com trilha) — e NIU-02 proíbe encerramento
  autônomo, logo todo item exige encerrador humano.
- **Descoberto (→ RISK-0013):** quem de fato monitora/age/escala/encerra na
  unidade-alvo, por turno e por dia da semana; a fronteira de prática
  enfermeiro/médico (revisão COFEN/CFM permanece tarefa normativa humana,
  fora deste dossiê).

### 3.2 Fronteiras de população

- **SOURCE (L-2, L-3, corroborado por SF-6):** NEWS2 é instrumento para ≥16
  anos; não recomendado para menores de 16 nem gestação. **SOURCE (SF-6):** no
  legado, **nenhum gating de idade/gestação existia — o schema de ingestão nem
  carregava idade**, tornando a fronteira populacional inexprimível na
  fronteira de escore.
- **INFERENCE (de L-2/L-3 + SF-6 + IU-06):** a exclusão pediátrica/neonatal não
  pode ser prosa: precisa ser imposta por comportamento (não-avaliação
  explícita quando fora da população ou idade desconhecida — jamais escore,
  jamais `normal`).
- **Descoberto (→ ato humano):** a decisão de escopo em si (VAL-0006/0007), o
  limiar etário e as subpopulações de IU-07 (obstétrica, ECMO/TRRC, paliativa —
  onde a resposta certa pode ser "o sistema deve calar-se") são decisões
  clínicas nomeadas, que nenhuma literatura substitui.

### 3.3 Fronteiras de setting

- **SOURCE (repo, IU-03/IU-04):** proposta vigente = UTI adulta de um único
  sítio piloto, pt-BR; step-down, enfermaria, RRT, comando, emergência e
  transporte estão UNDECIDED, cada um exigindo validação própria porque
  desempenho de escore não transfere entre settings por suposição.
- **SOURCE (L-6):** os dados de falha do elo aferente vêm majoritariamente de
  enfermarias — a densidade de registro difere (FR registrada em 14–17% em
  vários settings de enfermaria), o que reforça a não-transferência entre
  settings. **INFERENCE:** usar L-6 para desenhar a UTI exige a mesma cautela
  que a ata aceita como viés (a) — literatura descreve a classe, não a unidade.
- **Descoberto (→ ato humano):** a aprovação por setting (VAL-0009) é de
  `AUTH-INTENDED-USE`.

### 3.4 Consultivo × diretivo

- **SOURCE (repo, IU-09):** a fronteira operacional está proposta em tabela
  ("pode calcular/resumir/rotear/explicar/registrar/escalar visibilidade" ×
  "não pode decidir/executar/auto-encerrar"); override humano é desfecho de
  primeira classe.
- **SOURCE (repo, IU-10):** rótulo consultivo **não** desculpa display errado
  ou falsamente tranquilizador — a falsa tranquilização é classe de perigo de
  mesmo status que o falso alerta.
- **Descoberto (→ RISK-0013):** como o output consultivo é *lido* por clínicos
  reais sob pressão (se vira ordem de fato) — só o piloto contrasta isso.

### 3.5 Handoff, downtime e dados conflitantes

- **SOURCE (L-5):** quebra de comunicação é causa líder de erro em pacientes
  críticos; handoffs devem ser verbais, padronizados, em horário dedicado,
  cobrindo todos os pacientes em transição; o próprio consenso declara evidência
  empírica de alta qualidade limitada sobre benefício em desfecho.
- **SOURCE (repo, WF-04):** a lista de jornadas do legado **não continha
  jornada de passagem de plantão** — lacuna estrutural que a V2 não deve herdar.
- **SOURCE (repo, WF-05 + achados ALTB):** o legado combinava (i) eventos sem
  entrega confiável entre pods, (ii) leito sem dado renderizado `normal`,
  (iii) história antiga substituindo janela vazia — juntos, uma tela calma
  descrevendo nada. **INFERENCE:** o modo degradado da V2 deve ser testado
  contra a *combinação*, e degradação deve aparecer no ponto de uso clínico.
- **SOURCE (repo, WF-06 + SF-3):** conflito e correção são rotina; o legado
  chegou a pontuar o mesmo estado clínico de forma diferente conforme a rota de
  ingestão (SF-3) e admitia timestamp defaultado para "agora". A V2 não pode
  resolver contradição silenciosamente (regra `:1058`); mais-recente-vence é
  resolução silenciosa vestida de algoritmo.
- **Descoberto (→ RISK-0013 / OS-16):** o que a passagem real do sítio faz com
  itens não resolvidos, a janela sem dono (medição observacional), e a
  frequência real de conflitos (dimensão possivelmente recuperável na
  retrospectiva, sem promessa nesta versão).

### 3.6 Línguas, acessibilidade e dispositivos

- **SOURCE (repo, VAL-0031/0032; assessment `:123` via backlog):** o legado
  carregava **dois vocabulários de severidade conflitantes** sem resolução; o
  termo `não avaliado` é o termo mais crítico de segurança do produto e sua
  compreensão nunca foi testada.
- **SOURCE (repo, VAL-0033; assessment `:345` via backlog):** no legado, nenhum
  uso de `aria-live` foi encontrado nem estratégia de anúncio testada — para um
  sistema cuja função é anunciar mudança, defeito de segurança, não só de
  acessibilidade.
- **Descoberto (→ variante observacional/piloto):** compreensão real dos termos
  pt-BR (CT-01/CT-02), tarefas do loop completáveis por usuários reais de TA
  (M5 — **se não executável, permanece NÃO TESTADO, jamais simulado**),
  necessidades da força de trabalho real (M8), dispositivos e posicionamento
  físico das telas na unidade-alvo (VAL-0024). Nenhuma dessas dimensões tem
  substituto honesto em literatura ou forense.

### 3.7 O que jamais pode parecer normal ou completo

- **SOURCE (repo, `workflow-hypotheses.md` §1):** lista candidata de nove
  estados nunca-normal (leito sem insumos suficientes; dado stale; fora de
  população/idade desconhecida; avaliação falhou/suprimida; visão em degradação;
  conflito não resolvido; entrega não confirmada; artefato de IA fora do
  registro determinístico; lista/filtro possivelmente incompleto).
- **SOURCE (forense ALTB/EWS):** cada um dos itens centrais da lista tem
  defeito legado real correspondente, localizado em código: floor-to-normal
  (`derive_bed_severity`, veredito proposto REJECT), supressão silenciosa sem
  registro, coerção de inválido ao polo tranquilizador (SF-3), contrato que
  prometia None e código que devolvia zero (SF-7), "assistido" mascarando
  severidade.
- **INFERENCE:** esta é a parte do G1 em que a evidência substituta é **mais
  forte** — a lista não depende de observar usuários, depende de não repetir
  defeitos provados no código anterior. A *ratificação* da lista (correção e
  completude clínica) permanece ato de `AUTH-CLINSAFETY` no MG-G1; a
  *completude contra a prática real* só o piloto contrasta.

---

## §4. Tabela de disposição — todos os itens do g1-validation-backlog

**Vocabulário de disposição** (definido para esta tabela):

- **COBERTO-POR-SUBSTITUTO** — a evidência substituta deste dossiê fornece a
  evidência que o item exigia da observação, com fontes na linha; resíduos de
  decisão humana anotados.
- **RISCO-ACEITO-RISK-0013** — a evidência exigida era intrinsecamente
  observacional (comportamento, compreensão, medição de campo); o item é
  carregado **aberto e às claras** sob o risco aceito RISK-0013, com os insumos
  substitutos que existem anotados; contraste no piloto (G8).
- **PENDENTE-RETROSPECTIVA (OS-16)** — a evidência substituta virá de dados
  retrospectivos (SPR-G1-10), gated no parecer OS-16/DEC-G0-03.
- **PENDENTE-VARIANTE-OBSERVACIONAL (opcional, pré-piloto)** — só fechável por
  campo; o kit G1 permanece a especificação; até lá o item fica aberto e
  carregado como risco.
- **ATO-HUMANO (fora do objeto do dossiê)** — o item fecha por nomeação,
  decisão clínica ou determinação jurídica de humano nomeado; **forçá-lo a uma
  das categorias acima fabricaria cobertura**, por isso esta quinta categoria
  foi adicionada às quatro do pacote de tarefa (desvio declarado, não
  silencioso). Insumos substitutos, quando existem, ficam anotados.

Nenhuma linha fecha item algum. **SOURCE** (`g1-validation-backlog.md` §J):
fechar exige humano nomeado com data e razão.

| VAL-ID | O que pede (resumo) | Disposição | Justificativa (1 linha) |
|---|---|---|---|
| VAL-0001 | Aprovador nomeado do uso pretendido | ATO-HUMANO | Nomeação, não evidência; interinidade registrada (GDEC-0003/0004); BLK-0008 fecha no MG-G1 (SPR-G1-8), não aqui |
| VAL-0002 | Dono nomeado de segurança clínica | ATO-HUMANO | Idem; interino registrado (GDEC-0004); segundo revisor clínico registrado em GDEC-0010; formalização segue humana |
| VAL-0003 | Dono nomeado de privacidade/jurídico | ATO-HUMANO | Determinação de papel + parecer; OS-16 recebido com complementação pendente — item segue aberto por ato humano/jurídico |
| VAL-0004 | Dono de UX + moderador independente | ATO-HUMANO | Para ESTE dossiê a independência foi transposta ao painel AGT-4 (autor≠revisor≠verificadores); nomear pessoas para campo segue ato humano |
| VAL-0005 | Comissionar observação OU aceitar o risco | RISCO-ACEITO-RISK-0013 | A evidência que o item pedia (decisão datada e fundamentada no risk-register) EXISTE: RISK-0013 aceito pelo titular + pedido §6-d; registro formal final no MG-G1 |
| VAL-0006 | Pediátrico em escopo? | ATO-HUMANO | Decisão clínica; substituto anexado: L-2/L-3 (NEWS2 ≥16 anos) + SF-6 (legado sem gating) fundamentam exclusão proposta IU-06, não a decidem |
| VAL-0007 | Neonatal em escopo? | ATO-HUMANO | Idem VAL-0006; nenhum instrumento adulto se aplica; fisiologia neonatal fora de toda a evidência reunida |
| VAL-0008 | Comportamento fora da população / idade desconhecida | COBERTO-POR-SUBSTITUTO | Necessidade de enforcement provada: SF-6 (idade inexprimível no legado) + L-2/L-3 + IU-06 (não-avaliação explícita); espec. exigível = decisão AUTH-CLINSAFETY; compreensão real → RISK-0013 |
| VAL-0009 | Quais settings aprovados | ATO-HUMANO | Aprovação por setting é de AUTH-INTENDED-USE; substituto anexado: IU-03/IU-04 (proposta UTI-só) + L-6 (não transferência entre settings) |
| VAL-0010 | Subpopulações excluídas (obstétrica, ECMO/TRRC, pós-op, paliativa) | ATO-HUMANO | Decisão clínica por subpopulação; caso paliativo exige análise de perigo própria (sistema "técnicamente certo e clinicamente errado" — IU-07) |
| VAL-0011 | Consultivo apenas, imposto e não só declarado | COBERTO-POR-SUBSTITUTO | Fronteira operacionalizada e testável em IU-09/IU-10 (tabela pode/não-pode + override de 1ª classe); leitura real pelo usuário → RISK-0013; ratificação no MG-G1 |
| VAL-0012 | Quem monitora | RISCO-ACEITO-RISK-0013 | Resposta é comportamental e local; insumos: hipóteses UR (baixa confiança) + L-6 (monitorização falha mesmo com critérios); contraste no piloto |
| VAL-0013 | Quem age; fronteira enfermeiro/médico | RISCO-ACEITO-RISK-0013 | Fronteira é institucional + normativa (revisão COFEN/CFM = tarefa humana pendente, anotada); nenhum substituto decide prática local |
| VAL-0014 | Quem é dono da escalada | RISCO-ACEITO-RISK-0013 | Confiança "muito baixa" no repo; L-6 mostra que escalada falha em 21–57% mesmo documentada — desenhar dono explícito, validar no piloto |
| VAL-0015 | Quem encerra; pode encerrar quem não agiu | RISCO-ACEITO-RISK-0013 | NIU-02 proíbe encerramento autônomo (restrição de desenho firme); quem encerra de fato é comportamento local não observado |
| VAL-0016 | Titularidade em troca de turno e indisponibilidade | RISCO-ACEITO-RISK-0013 | Insumos: L-5 (handoff padronizado verbal em horário dedicado) + WF-04 (legado sem jornada de passagem); prática do sítio não observada |
| VAL-0017 | Quem altera limiares; clínico ou técnico | RISCO-ACEITO-RISK-0013 | Lado V2 coberto por SF-4 (limiar = conteúdo clínico com change control e piso declarado); quem altera NO SÍTIO é fato local não observado |
| VAL-0018 | O que ocorre na passagem; itens não resolvidos | RISCO-ACEITO-RISK-0013 | L-5 + WF-04 fundamentam desenho; o rito real do sítio (quem, quanto tempo, que artefato) só campo/piloto responde |
| VAL-0019 | Existe janela em que ninguém é dono | RISCO-ACEITO-RISK-0013 | Medição intrinsecamente observacional (F-PASS T1–T4 na variante); até lá o desenho assume que a janela existe e a trata explicitamente |
| VAL-0020 | Taxa de interrupção; tarefas ininterrompíveis | RISCO-ACEITO-RISK-0013 | Taxa pré-V2 é perecível e reconhecida como perdível pelo titular (pedido §6); L-4 dá magnitude do dano por interrupção (+12,1%/+12,7%), não a taxa local |
| VAL-0021 | Conduta com V2 degradada; fallback praticado | RISCO-ACEITO-RISK-0013 | Comportamento exigível = decisão AUTH-OPERATIONS+AUTH-CLINSAFETY informada por WF-05 (perigo composto do legado); procedimento praticado do sítio não observado |
| VAL-0022 | Como conflitos são resolvidos hoje; o que a V2 faz | RISCO-ACEITO-RISK-0013 | Política V2 (nunca resolver silenciosamente; `partial`/`invalid`) fundada em WF-06+SF-3; prática local de resolução não observada |
| VAL-0023 | Janela de frescor por insumo; invalida vs degrada | ATO-HUMANO | Decisão clínica versionada por regra (AUTH-CLINSAFETY); substituto anexado: SF-5 prova que NÃO há política legada a importar |
| VAL-0024 | Dispositivos, posicionamento, tamanho de unidade, ambiente | RISCO-ACEITO-RISK-0013 | Característica física de sítio inexistente ainda; irrecuperável por literatura/forense; rota de recuperação = variante observacional ou pré-piloto |
| VAL-0025 | Workarounds existentes (papel, quadro, mensageria) | RISCO-ACEITO-RISK-0013 | Workaround só é observável em campo (M4) e é a evidência mais forte de necessidade real — perda assumida às claras até variante/piloto |
| VAL-0026 | Lista nunca-normal correta e completa | COBERTO-POR-SUBSTITUTO | Lista candidata (§3.7) ancorada em defeitos forenses localizados em código (HAZ-0005, SF-3, SF-7, supressão silenciosa); ratificação = AUTH-CLINSAFETY no MG-G1; completude vs prática → piloto |
| VAL-0027 | "Não avaliado" é lido como "olhe isto"? | RISCO-ACEITO-RISK-0013 | Compreensão só é verificável com clínicos reais (CT-01); nenhuma fonte verificada nesta sessão a substitui (L-GAP); risco carregado explícito |
| VAL-0028 | Sinalizar degradação sem virar novo alarme | RISCO-ACEITO-RISK-0013 | L-1 (187 alarmes/leito/dia; 88,8% falsos) prova o custo de cada sinal novo; a forma eficaz de sinalizar exige teste com humanos |
| VAL-0029 | Explicação que permita discordar com confiança | RISCO-ACEITO-RISK-0013 | Lacuna dupla declarada: nenhuma evidência legada e nenhuma fonte verificada nesta sessão (L-GAP) tratam de desconfiança apropriada; desenho segue WF-08, validação → piloto |
| VAL-0030 | Item de trabalho em alta, óbito, transferência, merge | ATO-HUMANO | Decisão clínica + resolução do modelo de identidade (conflito ADR-041×ADR-006 não pode ser resolvido silenciosamente pela V2) |
| VAL-0031 | Termos pt-BR interpretados como pretendido | RISCO-ACEITO-RISK-0013 | Teste de compreensão (CT-01/CT-02) é inerentemente humano; `não avaliado` segue sendo o termo mais crítico e não testado — carregado às claras |
| VAL-0032 | Vocabulário de severidade correto em pt-BR | RISCO-ACEITO-RISK-0013 | Forense prova o perigo (dois vocabulários conflitantes não resolvidos no legado); a escolha certa exige campo + ratificação AUTH-CLINSAFETY/AUTH-UX |
| VAL-0033 | Usuários de TA completam as tarefas do loop | PENDENTE-VARIANTE-OBSERVACIONAL | Só M5 com usuários REAIS de TA fecha; sem eles o item permanece NÃO TESTADO — jamais simulado (regra do protocolo, mantida) |
| VAL-0034 | Necessidades de acessibilidade da força de trabalho real | PENDENTE-VARIANTE-OBSERVACIONAL | Censo (M8) + observação de adaptações são de campo; nenhum substituto honesto existe em literatura/forense |
| VAL-0035 | 🚩 Baseline pré-V2 (tempo-até-reconhecimento, alertas, fadiga, interrupção) | PENDENTE-RETROSPECTIVA (OS-16) | Via AGT-2/SPR-G1-10 (corte histórico pré-exposição); componentes observacionais (interrupções, fadiga) reconhecidos como perdíveis pelo titular (pedido §6) |
| VAL-0036 | Definição pré-registrada de "deterioração" | ATO-HUMANO | Ato clínico de pré-registro (AUTH-CLINSAFETY); pré-requisito da adjudicação retrospectiva de desfechos — sem ele, B4/desfechos não pontuam |
| VAL-0037 | Base legal para adjudicação de desfecho e subgrupo | ATO-HUMANO | Determinação jurídica no escopo OS-16/DEC-G0-03; parecer recebido com complementação pendente — segue aberto até ato humano/jurídico |
| VAL-0038 | Metas de tempo-até-decisão realmente sustentadas | RISCO-ACEITO-RISK-0013 | Único item que NÃO bloqueia o G1 (bloqueia ratificação de métrica); análise de tarefa é observacional; proxies retrospectivos (SPR-G1-10) informam sem substituí-la |
| VAL-0039 | Sítio(s) e patrocinador clínico nomeado | PENDENTE-VARIANTE-OBSERVACIONAL | Deixou de ser exigência do G1 (AGT-1); necessário apenas se a variante for comissionada (SPR-G1-3) ou para o piloto (G8) |
| VAL-0040 | Submissão ética (CEP/CONEP): exigida? rota? | PENDENTE-VARIANTE-OBSERVACIONAL | Obrigatória para QUALQUER campo futuro (BLK-0013, reclassificado pré-piloto); rota depende do teor do parecer OS-16 (SPR-G1-2/G1-4) |
| VAL-0041 | Base LGPD para observar clínicos; exposição incidental | PENDENTE-VARIANTE-OBSERVACIONAL | Idem VAL-0040; o kit já entrega o protocolo de campo sem PHI; a base legal é determinação jurídica pré-campo |
| VAL-0042 | Consentimento com recusa invisível e sem custo | PENDENTE-VARIANTE-OBSERVACIONAL | Desenho existe no kit (§7 do plano); validação com liderança de enfermagem do sítio só ocorre se/quando houver campo |
| VAL-0043 | Compradores/governança: o que valorizam vs o que se usa | PENDENTE-VARIANTE-OBSERVACIONAL | M6 é entrevista comissionável pré-piloto; OBSERVED no repo: nenhum comprador identificado — hipótese "dashboard que vende ≠ superfície que se usa" segue hipótese |

### §4.1 Contagem de disposição (deve bater com o backlog)

| Disposição | Itens | Quais |
|---|:--:|---|
| COBERTO-POR-SUBSTITUTO | 3 | VAL-0008, VAL-0011, VAL-0026 |
| RISCO-ACEITO-RISK-0013 | 20 | VAL-0005, 0012, 0013, 0014, 0015, 0016, 0017, 0018, 0019, 0020, 0021, 0022, 0024, 0025, 0027, 0028, 0029, 0031, 0032, 0038 |
| PENDENTE-RETROSPECTIVA (OS-16) | 1 | VAL-0035 |
| PENDENTE-VARIANTE-OBSERVACIONAL (opcional, pré-piloto) | 7 | VAL-0033, 0034, 0039, 0040, 0041, 0042, 0043 |
| ATO-HUMANO (fora do objeto do dossiê) | 12 | VAL-0001, 0002, 0003, 0004, 0006, 0007, 0009, 0010, 0023, 0030, 0036, 0037 |
| LACUNA-DE-ENTENDIMENTO (escalada) | 0 | — |
| **Total disposto** | **43** | **= 43 itens do backlog (SOURCE, `g1-validation-backlog.md` §0: 43 itens, 42 bloqueiam o G1; VAL-0038 bloqueia ratificação de métrica)** |

**INFERENCE (honestidade da contagem):** apenas 3 itens são genuinamente
*cobertos* por substituto — porque só neles a pergunta do backlog era
respondível por literatura+forense+documento. Os 20 itens sob
RISCO-ACEITO-RISK-0013 são exatamente o conteúdo material do risco que o
titular aceitou: inflar a coluna "coberto" para parecer melhor seria o
anti-padrão que o programa proíbe (contagem sai do gate, não de meta). Os 12
ATO-HUMANO não são dispostos *por* este dossiê — são carregados à vista, com
seus fóruns de fechamento nomeados, para que nenhum feche por silêncio.

---

## §5. Vieses e limitações — RISK-0013 linha a linha, sem suavização

**SOURCE** (`../00-governance/registers/risk-register.md`, RISK-0013,
statement): vieses estruturais aceitos, transcritos e comentados um a um:

1. **"(a) literatura descreve UTIs médias, não as unidades-alvo."** Aplica-se
   integralmente a L-1..L-6: cinco das seis fontes vêm de sistemas de saúde
   estrangeiros; L-4 nem sequer é de UTI (enfermarias — declarado na própria
   linha). Nenhum número de §2.1 descreve a unidade brasileira que a V2 vai
   servir.
2. **"(b) o legado documenta o que o sistema antigo fazia, não o que os
   clínicos precisavam."** A perna (b) inteira herda isso: floor-to-normal,
   supressão silenciosa e vocabulários conflitantes provam defeitos de
   *software*; não provam que clínico algum precisava, usava ou confiava
   naquilo. As jornadas do legado são traços de controle de fluxo de código.
3. **"(c) dado retrospectivo não contém interrupções, fadiga, carga cognitiva
   nem workarounds — exatamente o que a observação capturaria."** Vale já e
   valerá quando SPR-G1-10 rodar: o baseline retrospectivo medirá carga de
   alertas e proxies de tempo, e **não** medirá o custo humano; o titular
   reconheceu por escrito que interrupções e fadiga permanecem perdíveis
   (pedido §6, T-2).
4. **"(d) hipóteses do titular são de um único especialista"** (viés
   confirmado como restrição em DEC-G0-05, cujo princípio permanece). Nesta
   versão a perna (d) é adicionalmente **fina** (T-GAP): contém posições
   decisórias, não hipóteses de fluxo — o que reduz o risco de contaminação e
   também o valor probatório da perna.
5. **Documentação ≠ realidade** (síntese dos vieses (a)+(b)): todo este dossiê
   é feito de documentos sobre sistemas e populações — nenhuma linha dele viu
   um plantão. O "usuário imaginado" do título do risco é o usuário deste
   dossiê.
6. **Risco líquido (SOURCE, RISK-0013):** "desenhar fluxo e alarmística para um
   usuário imaginado, descobrindo o desalinhamento só no piloto (G8) — tarde e
   caro, porém com válvula: o piloto supervisionado é exatamente onde a
   observação real acontece." Impacto registrado: retrabalho de UX/fluxo no
   piloto; fadiga de alarme mal calibrada na primeira exposição real (interage
   com HAZ-0016); baselines enviesados enfraquecem o contrafactual do KPI de
   missão.
7. **Limitações próprias desta versão 0.1.0-draft (OBSERVED, desta sessão):**
   (i) perna (c) vazia por gate jurídico — nenhum número retrospectivo; (ii)
   6 fontes de literatura, com lacunas nomeadas em L-GAP (desconfiança
   apropriada; UTI brasileira; compreensão de "não avaliado"); (iii) L-3 é
   fonte secundária ao relatório RCP 2017 (o PDF primário do RCP não pôde ser
   lido nesta sessão — o acesso falhou na extração de texto; a citação primária
   permanece a já registrada em SF-6); (iv) L-4 consultada via release
   institucional de imprensa científica, não no texto integral do periódico.

---

## §6. O que muda e o que não muda no MG-G1

**O que muda (SOURCE, ata AGT-1 + mapa SPR-G1-8/G1-9):** a *evidência* exigida
para o marco MG-G1 passa a ser este dossiê (aprovado pelo painel AGT-4) + o
risco aceito registrado (RISK-0013) + o corte histórico do baseline fixado
(SPR-G1-10) — no lugar da observação de campo.

**O que NÃO muda:**

1. **A aprovação humana permanece.** SOURCE (mapa, nota do marco MG-G1):
   "aprovação nominal do uso pretendido — **permanece ato humano** (AGT-1
   substituiu a evidência exigida, não o aprovador; BLK-0008)". SPR-G1-8 exige
   registro por humano nomeado com regra de supersessão; premissa da linha
   SPR-G1-9: "AGT-1 trocou a evidência do gate, não o aprovador humano".
2. **Este dossiê não se auto-aprova.** Ele só conta como evidência depois do
   painel AGT-4 (revisor + ≥3 adversariais; maioria refuta = morre), e mesmo
   aprovado não fecha nada sem o ato humano do item 1.
3. **BLK-0008 permanece OPEN** até o MG-G1; nenhuma linha deste documento o
   fecha.
4. **A contagem dura permanece:** 0 vias acionáveis; o bloqueio dominante é de
   dados (G3/AMH), e OS-16 segue sendo o único prazo externo — SOURCE (ata,
   "Honestidade obrigatória", itens 1–2).
5. **A variante observacional permanece disponível** (T-3): comissioná-la antes
   do piloto reabre os itens (c)/(d) do pedido §6 — regra de supersessão do
   próprio bloco do titular.

---

## Referências cruzadas

- `g1-validation-backlog.md` — os 43 itens dispostos em §4.
- `g1-kit/pedido-de-comissionamento.md` §6 — a decisão do titular que este dossiê executa.
- `g1-kit/protocolo-pesquisa-g1.md` §6 — o mapeamento C/I/N que serviu de contraprova à tabela §4.
- `../00-governance/registers/agentificacao-g1-g2-2026-08-15.md` — AGT-1 (mandato deste dossiê), AGT-2, AGT-4.
- `../00-governance/registers/risk-register.md` — RISK-0013 (o risco aceito que este dossiê carrega).
- `../05-clinical-safety/legacy-review/` — a perna forense (§2.2).
- `../01-vision-and-intended-use/intended-use-statement.md` — IU-01..IU-12 (o objeto cuja aprovação o MG-G1 decidirá).
- `../14-devsecops-and-delivery/mapa-de-projeto-ate-producao.md` — SPR-G1-9 (este sprint), SPR-G1-8 (MG-G1), SPR-G1-10 (perna retrospectiva).
