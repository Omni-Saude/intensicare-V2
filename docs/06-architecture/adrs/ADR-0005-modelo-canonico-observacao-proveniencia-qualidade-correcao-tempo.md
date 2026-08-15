---
id: ADR-0005
title: Modelo canônico de observação clínica — proveniência, qualidade, correção e tempo
status: accepted (2026-08-15, GDEC-0008)
status_history:
  - status: not-started
    date: 2026-08-14
    by: candidate-architecture and ADR-program engineer (Wave 2)
    note: ID reservado em adr-index.md
  - status: proposed
    date: 2026-08-15
    by: arquiteto de decisões de fronteira e modelo canônico
    note: >
      Redigido em pt-BR (DEC-G0-10) sobre o modelo conceitual do ciclo 0
      (conceptual-model.md, time-semantics.md, status-dimensions.md, DOM-invariants.md),
      as restrições DECIDED de 2026-08-15 (chave de fato = (PSR, encontro), AQ-4) e o
      acoplamento com o ADR-0008. Opções e drivers apenas; NENHUMA decisão é registrada
      e nenhum agente pode registrá-la.
  - status: accepted (2026-08-15, GDEC-0008)
    date: 2026-08-15
    by: rodaquino-OMNI (titular) — transcrito por escriba de decisão-transcrição de ADR
    note: >
      Aceito por escrito pelo titular na sessão de decisão GDEC-0008 (item 4;
      `docs/00-governance/registers/decision-register.md`), na opção recomendada —
      Opção A (fato canônico imutável, append-only) e a minuta normativa M1–M10 de
      §5.2. Ver §5.0. Nenhum agente decidiu — transcrição de decisão já tomada.
date: 2026-08-15
owner: rodaquino-OMNI — AUTH-DATA-PLATFORM (DEC-G0-04) e AUTH-CLINSAFETY (GDEC-0003); ADR aceito por escrito em GDEC-0008 item 4
approvers:
  - rodaquino-OMNI — AUTH-DATA-PLATFORM (DEC-G0-04); aceito em GDEC-0008 item 4
  - rodaquino-OMNI — AUTH-CLINSAFETY (cláusulas com consequência clínica, GDEC-0003); aceito em GDEC-0008 item 4
decision_deadline: >
  UNSET — VALIDATION REQUIRED. Restrição de ordem: este ADR deve ser aceito antes de
  qualquer desenho físico em docs/07-data-and-provenance (aquele diretório declara-se
  deliberadamente vazio até ADR-0005/0006 aceitos), antes do mapeamento semântico do
  Gate G3 e antes da aceitação plena do ADR-0008, que consome o modelo de tempo daqui.
deciding_authority_rule: >
  docs/00-governance/decision-rights.md §2, linha "Architecture decisions (ADR
  ratification)"; cláusulas com consequência clínica direta (admissibilidade de insumo,
  quarentena, não-coerção) exigem adicionalmente AUTH-CLINSAFETY, na linha "Clinical
  hazard / residual-risk acceptance" — a matriz §5.2-M4 tem donos próprios designados
  em status-dimensions.md.
independence_check: >
  decision-rights.md §3: quem implementar a camada canônica e a quarentena NÃO pode
  aceitar a evidência de reconciliação/perda semântica correspondente (par 4 — conector
  × aceitação de conformidade externa; par 2 — controle de segurança × caso de
  segurança). Este ADR foi redigido por agente; nenhum agente o aprova. O autor não é
  aprovador.
links:
  drivers:
    domain_invariants: [DOM-0001, DOM-0002, DOM-0003, DOM-0004, DOM-0006, DOM-0007, DOM-0008, DOM-0009]
    quality_scenarios: [QAS-0007, QAS-0016, QAS-0017, QAS-0019, QAS-0020, QAS-0022, QAS-0025]
    risks: ["pending risk register IDs — see docs/00-governance/registers/risk-register.md"]
  constrains:
    requirements: ["REQ: pendente de catálogo de requisitos (docs/04-product-requirements ainda não existe)"]
    clinical: ["CLR: pendente do portfólio de vias clínicas (Gate G2)"]
    safety: [SAF-0001, SAF-0002, SAF-0010, SAF-0011, SAF-0014, SAF-0019, SAF-0028, SAF-0032, SAF-0033]
  hazards: [HAZ-0005, HAZ-0006, HAZ-0007, HAZ-0008, HAZ-0009, HAZ-0011, HAZ-0026, HAZ-0032, HAZ-0038, HAZ-0039, HAZ-0040, HAZ-0043]
  tests: ["TST-DOM-0002", "TST-DOM-0003", "TST-DOM-0004", "TST-DOM-0008", "TST-DOM-0009"]
  validations: ["VAL: pendente do backlog de validação"]
  adrs:
    depends_on: [ADR-0003, ADR-0004]
    feeds: [ADR-0006, ADR-0007, ADR-0008, ADR-0010, ADR-0013, ADR-0017, ADR-0018, ADR-0023]
  gates: [G3, G4]
  evidence:
    - docs/03-domain/conceptual-model.md
    - docs/03-domain/time-semantics.md
    - docs/03-domain/status-dimensions.md
    - docs/03-domain/invariants/DOM-invariants.md
    - docs/05-clinical-safety/hazard-log.md
    - docs/08-interoperability/amh-data/four-layer-dossier.md
    - docs/08-interoperability/amh-data/identity-adjudication/adjudicacao-decisoes-2026-08-15.md
supersedes: null
superseded_by: null
provenance:
  source_repo: intensicare-V2
  path_or_url: docs/06-architecture/adrs/ADR-0005-modelo-canonico-observacao-proveniencia-qualidade-correcao-tempo.md
  commit_sha_or_version: 0c36f03 (HEAD do repositório na redação; este arquivo não está commitado)
  section_or_lines: >
    INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §3 regras 7 e 8, §7.6, §9.1 princípios 3/4/6,
    §9.3, §10 item 5; docs/03-domain (íntegra); hazard-log.md HAZ-0005/0032/0039/0040/0043;
    ata IDN-ADJ-2026-08-15 §2 AQ-4 (chave de fato), §6 (Observation não consumível)
  date_collected: 2026-08-15
  collector: arquiteto de decisões de fronteira e modelo canônico
  transformation: >
    reasoned-from — o modelo proposto elabora o baseline candidato do prompt §9.3 e os
    documentos de domínio do ciclo 0; nenhum artefato AMH foi reverificado (linhas AMH
    são SOURCE por citação do dossiê e da ata).
  confidence: medium
  owner: rodaquino-OMNI
  validation_status: >
    N/A — ADR aceito pelo titular (GDEC-0008 item 4), na opção recomendada. As
    condições de §5.1 seguem VALIDATION REQUIRED conforme registradas.
---

# ADR-0005 — Modelo canônico de observação clínica: proveniência, qualidade, correção e tempo

> **Status: `accepted (2026-08-15, GDEC-0008)`.** O titular aceitou este ADR por
> escrito na sessão de decisão GDEC-0008 (item 4), na opção recomendada — Opção A
> (fato canônico imutável, append-only) e a minuta normativa M1–M10 de §5.2. Ver §5.0.
> Duas regras não-negociáveis do prompt §3 — regra 7 (jamais coerção de
> ausente/stale/inválido a zero/normal/no-fire silencioso) e regra 8 (jamais inventar
> timestamp de fonte) — vinculam a decisão e nenhuma aceitação as enfraquece.
> **Aceito não significa implantado nem verificado** — as condições de §5.1 continuam
> a governar a operacionalização.

---

## 1. Contexto e problema

O laço mínimo de segurança da V2 (prompt §1) atravessa: entrada clínica confiável →
validação de identidade/proveniência/qualidade → avaliação determinística versionada →
item de trabalho durável e explicável → ação humana autorizada → auditoria imutável.
Tudo entre a entrada e a avaliação depende de **como um fato clínico é representado**:
sua chave, seus tempos, sua qualidade, sua correção e sua cadeia de proveniência.

O que força a pergunta agora: (i) `docs/07-data-and-provenance/` declara-se
deliberadamente vazio **até** ADR-0005/0006 aceitos — o desenho físico está bloqueado
por este ADR; (ii) o ADR-0008 — **aceito em 2026-08-15 (GDEC-0007)** — consome o modelo
de tempo daqui (sua cláusula N5 cita "o modelo do ADR-0005/`time-semantics.md`") e sua
N8 pressupõe as duas dimensões de status: um ADR aceito referencia um alvo que este ADR
ainda propõe, o que torna a aceitação daqui mais urgente, não menos; (iii) a decisão
AQ-4 fixou a chave de fato clínico —
`(PSR, encontro)` — e o modelo canônico precisa incorporá-la; (iv) o mapeamento
semântico do Gate G3 (campo a campo, com contabilidade de perda — §7.6) não tem alvo
enquanto o modelo canônico não existir.

**Pergunta.** Como a V2 representa canonicamente um fato clínico — com que chave, que
cadeia de proveniência, que tempos distintos, que dimensões de status, que tratamento
de unidades e códigos, e que semântica de correção/conflito — de modo que a avaliação
seja determinística e replayável (DOM-0003) e nenhuma ausência vire normalidade
(DOM-0004)?

**Fora de escopo** (cada item nomeado):

- Precedência operacional × analítica, conflito entre lanes e reconciliação —
  **ADR-0006** (consome o modelo daqui).
- Semântica dos cinco estados de avaliação e transições de completude/atualidade —
  **ADR-0008** (o modelo daqui fornece os *insumos*; a semântica de avaliação é de lá;
  as políticas clínicas por classe de escore são do **ADR-0026**).
- Perfis FHIR, bindings de terminologia e writeback — **ADR-0013**; snapshot de
  terminologia dentro do bundle de regras — **ADR-0007**.
- Esquema físico, tipos de coluna, particionamento, tecnologia de armazenamento —
  futuro `docs/07`, após aceitação (regra §3-14: nenhuma tecnologia por herança).
- Identidade do sujeito e semântica de merge/unmerge — **ADR-0004** (consumido como
  restrição decidida).

---

## 2. Evidência e premissas

### 2.1 Evidência

**Nota epistêmica única.** Linhas de origem AMH são `SOURCE` por citação do dossiê da
Onda 1 e da ata de adjudicação (esta lida em disco por este autor — OBSERVED quanto ao
documento, SOURCE quanto aos artefatos AMH que ela cita). Nenhum artefato AMH foi
reverificado por este ADR.

| # | Rótulo | Afirmação | Fonte | Confiança |
|---|---|---|---|---|
| E1 | SOURCE | *"One clinical fact has one immutable provenance chain and explicit corrections"* (§9.1 princípio 3); modelo candidato §9.3: `SourceSystem → SourceEnvelope → ClinicalObservation → Provenance/Quality/Correction/Conflict`. | prompt §9.1, §9.3 | alta |
| E2 | SOURCE | Doze pontos de tempo distintos definidos no ciclo 0, com regra de preservação: UTC normalizado **mais** offset original, precisão original, valor-fonte cru e fuso identificado, para **todos** os pontos; ordenação entre pontos **não garantida** (correção pode suceder ação; emitido pode preceder recebido em horas). | `time-semantics.md` (íntegra) | alta |
| E3 | SOURCE | DOM-0009: timestamp de fonte **jamais** é inventado; ausência é representada explicitamente, nunca defaultada a "agora" ou a instante vizinho. DOM-0002: cadeia única imutável com correções explícitas e conflitos explícitos. DOM-0004: ausente/stale/inválido jamais coerção a zero/normal/no-fire. DOM-0008: duas dimensões de status jamais colapsadas. | `DOM-invariants.md` | alta |
| E4 | SOURCE | As duas dimensões: qualidade de fonte (AMH `valid \| warning \| quarantined` — CodeSystem fechado, `content: complete`, escopo Silver-Rules) × status de avaliação V2 (`valid \| partial \| not_evaluated \| stale \| invalid`). A matriz de mapeamento é placeholder com donos designados (arquiteto de compatibilidade AMH + engenheiro de segurança clínica nomeado) e regra anti-colapso: combinação não mapeada falha fechada para `not_evaluated`/`invalid` com razão visível — **nunca** default a `valid`. | `status-dimensions.md`; `four-layer-dossier.md` Layer 1 | alta |
| E5 | SOURCE | **VALIDATION REQUIRED registrado pelo dossiê:** não se sabe se o `_dq_status` AMH é carregado nos recursos FHIR. Se a lane FHIR não carregar sinal de qualidade, o consumidor V2 recebe **nenhuma dimensão de qualidade de fonte** — restrição mais forte que um desencontro de vocabulário. | `four-layer-dossier.md` Layer 3 | alta |
| E6 | SOURCE | Contradição C-4: o plano de desbloqueio de `Observation` emitiria `code.text` livre + `valueString` — que **não** satisfaz o binding LOINC nem a fixação UCUM do profile. *"Nenhuma regra de escore consome uma string."* `Observation` AMH segue **não consumível** (ata §6.1: três pernas abertas). | `compatibility-finding.md` §3.1; ata §6.1 | alta |
| E7 | SOURCE | HAZ-0005 é **E1 — ocorrido** no legado: com todos os insumos ausentes, MEWS/NEWS2/SOFA/qSOFA retornaram **0**, persistidos, dirigindo estado de leito "normal" — *"o defeito de segurança clínica mais sério do repositório"* legado. HAZ-0032 (coerção de unidade/código) e HAZ-0039 (fonte vazia lida como ausência de anormalidade — HTTP 200 com NULL) também têm ocorrência/medição registradas. | `hazard-log.md` HAZ-0005, HAZ-0032, HAZ-0039 | alta |
| E8 | SOURCE | HAZ-0040: colapsar qualidade de fonte em status de avaliação (ou vice-versa) é hazard próprio, Unacceptable (S4/L4 — PROPOSAL de triagem); HAZ-0043: via admitida sem fonte populada roda permanentemente `not_evaluated` e a quietude vira falsa tranquilidade. | `hazard-log.md` HAZ-0040, HAZ-0043 | alta |
| E9 | OBSERVED | DECIDED (rodaquino-OMNI, 2026-08-15, AQ-4): a V2 **chaveia fatos clínicos por `(PSR, encontro)`**; o PSR é o identificador de fronteira obrigatório, formato `amh:psr:v1:<uuidv4>`; nenhum identificador cru atravessa a fronteira. | ata `IDN-ADJ-2026-08-15` §2 AQ-4 | alta |
| E10 | SOURCE | O ADR-0008 — **aceito em 2026-08-15 (GDEC-0007**, conforme `adr-index.md`**)** — acopla-se aqui: N5 computa idade do insumo a partir do **tempo clínico de fonte** (Observed/Effective) "conforme o modelo do ADR-0005"; N8 mantém as duas dimensões em campos separados com fail-closed; N3 define vocabulário de razões (`quarantined_input`, `unmappable_unit`, `missing_clinical_time:<insumo>` etc.) que o modelo daqui precisa poder alimentar. | `ADR-0008` §4.2; `adr-index.md` | alta |
| E11 | SOURCE | Ingestão com skew referencial é medida na fonte candidata (52.452 linhas clínicas referenciando encontro ausente — alegação AMH sobre AMH); `Observation.encounter` é **opcional** no profile, logo vínculo de encontro é questão de dado, não de conformidade. | `four-layer-dossier.md` Layer 3; HAZ-0038 | alta |

### 2.2 Premissas

A registrar em `docs/00-governance/registers/assumptions-register.md`; **nenhum ID
`ASM` é cunhado aqui**.

| # | Premissa | Por que é necessária | O que a invalida | Dono |
|---|---|---|---|---|
| A1 | A aceitação do ADR-0008 (2026-08-15, GDEC-0007) manteve N5/N8 compatíveis com o modelo daqui (tempo clínico de fonte como base de idade; dimensões separadas) — a verificar na reconciliação C2, que passa a ser contra o **texto aceito**, não contra minuta. | O acoplamento declarado dos dois ADRs. | Emenda de aceitação do titular ao ADR-0008 que tenha mudado a base de tempo ou as dimensões. | UNASSIGNED — VALIDATION REQUIRED |
| A2 | Fontes futuras não-AMH (HL7 v2, gateway de dispositivo) terão vocabulários de qualidade próprios, mapeáveis à dimensão 1 genérica ("o estado de qualidade que a fonte de origem atribui"). | Mantém o modelo genérico sem inflar a dimensão 1 para o caso AMH. | Fonte sem conceito algum de qualidade — cai na regra de qualidade ausente (§5.2-M10). | UNASSIGNED — VALIDATION REQUIRED |
| A3 | UCUM é adequado como sistema canônico de unidades para os insumos das vias candidatas. | Sustenta §5.2-M5. Base: o prompt §7.1/§7.2 nomeia UCUM na lista de conformidade; o profile AMH fixa UCUM em `valueQuantity.system`; nenhuma alternativa séria de unidade clínica computável foi identificada no ciclo 0-1. | Insumo aprovado no G2 cuja unidade não seja representável em UCUM — improvável, mas invalidaria a exclusividade. | UNASSIGNED — VALIDATION REQUIRED |
| A4 | O snapshot de terminologia versionado dentro do bundle de regras (ADR-0007) é o veículo das tabelas de conversão de unidade e dos catálogos de código usados na avaliação. | Sustenta o determinismo do replay: converter com tabela viva quebraria DOM-0003. | Direção diferente na aceitação do ADR-0007. | UNASSIGNED — VALIDATION REQUIRED |

### 2.3 Hipóteses a testar

| # | Hipótese | Como seria testada | Quem testa | Estado |
|---|---|---|---|---|
| H1 | A lane FHIR AMH **não** carrega sinal de qualidade de fonte (E5) — a V2 precisará derivar qualidade por checagens próprias de aptidão. | Inspeção de recursos reais em ambiente nomeado (camada 2/3). | AMH clinical-signal contract engineer | UNTESTED — sem ambiente |
| H2 | Cada feed consumido fornece, no mínimo, tempo clínico (Observed ou Effective) e tempo de emissão utilizáveis por insumo. | Matriz via-fonte §7.2 preenchida com medição, por campo de tempo. | idem | UNTESTED |
| H3 | A fração de valores com unidade não-canônica ou código desconhecido é mensurável e a quarentena não esvazia nenhuma via aprovada. | Medição de distribuição em dado representativo (camada 3). | idem + portfolio optimizer | UNTESTED |

---

## 3. Direcionadores de decisão e atributos de qualidade mensuráveis

Alvos numéricos: `VALIDATION REQUIRED` (G1) — **nenhum é inventado**. Três drivers têm
alvo estrutural vinculante por regra não-negociável ou invariante, indicado.

| # | Driver | Por que discrimina | Atributo mensurável | Alvo |
|---|---|---|---|---|
| D1 | **Replay determinístico** (DOM-0003): reproduzir campo a campo o que o sistema sabia e concluiu num instante passado | As opções diferem em *se* o estado passado é reconstituível: um modelo mutável perde-o; um modelo sem camada canônica torna-o dependente da fonte | QAS-0020 | 100% de reprodução — vinculante (invariante) |
| D2 | **Integridade de proveniência e correção** (DOM-0002): original recuperável, correção ligada e explícita, conflito visível, nenhuma mutação in-place | Um modelo update-in-place satisfaz isso só com disciplina externa; um modelo append-only o satisfaz por construção | QAS-0019 | Vinculante (invariante) |
| D3 | **Nenhuma coerção silenciosa** (DOM-0004; regra §3-7): ausente/stale/inválido/parcial/conflitante jamais vira zero, normal, sem-risco ou não-disparo silencioso | O modelo decide *onde* a ausência é representável: um modelo que não representa ausência explicitamente empurra a coerção para o avaliador — o modo de falha de HAZ-0005 | QAS-0007, QAS-0017 | **Vinculante — regra não-negociável**; ligado a HAZ-0005 e HAZ-0043 |
| D4 | **Independência das dimensões de status** (DOM-0008): qualidade de fonte × avaliação V2 jamais colapsadas | Opções sem lugar próprio para a dimensão 1 forçam o colapso (HAZ-0040) | QAS-0019, QAS-0016 (auditoria mostra ambas) | Vinculante (invariante) |
| D5 | **Integridade temporal** (DOM-0009; regra §3-8): tempos distintos, UTC + offset/precisão/valor-fonte preservados, jamais inventar | Opções diferem em quantos pontos de tempo carregam e no custo de preservação total | QAS-0001..0006 (computáveis só com os pontos distintos), QAS-0007 | Vinculante (regra não-negociável) |
| D6 | **Contabilidade de perda semântica na fronteira** (§7.6): mapeamento campo a campo com perda declarada, quarentena em vez de coerção | Um modelo canônico rico dá alvo ao mapeamento; avaliar sobre a fonte crua elimina a contabilidade | QAS-0025, QAS-0019 | VALIDATION REQUIRED |
| D7 | **Custo de armazenamento/complexidade** | Append-only com envelopes retidos custa mais armazenamento e mais modelo; mutável custa menos — e o trade-off deve ser dito honestamente | QAS-0027; modelo de custo inexistente | VALIDATION REQUIRED |

---

## 4. Alternativas consideradas

### Opção A — Fato canônico imutável, append-only, com correções/conflitos explícitos e duas dimensões de status (elaboração do baseline §9.3)

**Descrição.** A camada de ingresso retém o `SourceEnvelope` **imutável** (payload cru,
tempos de recebimento, identificação de fonte). A validação produz ou um
`ClinicalObservation` canônico ou uma entrada de **quarentena** — nunca um valor
coagido. O fato canônico é **imutável**: correção da fonte gera **novo** registro
ligado por `Correction` ao superado; desacordo entre fontes gera `Conflict` explícito,
não resolução silenciosa. Cada fato carrega: chave `(tenant, PSR, encontro)` (E9;
tenant conforme grão do ADR-0003), conceito codificado, valor com **unidade de origem
preservada + valor canônico UCUM** (quando conversível por tabela versionada), os
tempos distintos com preservação integral (E2), a **qualidade de fonte** como campo
próprio e a cadeia `Provenance` única (fonte, envelope, transformação, versão de
mapeamento). O status de avaliação V2 **não mora no fato** — mora no
`EvaluationRecord` (ADR-0008), eliminando o colapso por construção.

**Frente aos drivers.** D1: replay por construção — envelope + fato imutável + tabelas
versionadas reproduzem qualquer instante. D2: por construção. D3: ausência, quarentena
e conflito são estados representáveis de primeira classe, que o avaliador é obrigado a
ver. D4: as dimensões vivem em entidades diferentes. D5: todos os pontos de tempo com
preservação integral; custo real de modelagem. D6: o mapeamento tem alvo rico; perda é
declarável por campo. D7: **o mais caro** — armazenamento (envelopes + fatos + cadeias)
e complexidade de modelo.

**Positivas.** Satisfaz os quatro invariantes vinculantes por construção, não por
disciplina; a auditoria mostra "o que se sabia então" sem reconstrução heurística; a
quarentena dá destino seguro a código/unidade desconhecidos (HAZ-0032).

**Negativas.** Custo de armazenamento e de consulta (o "estado corrente" vira projeção
rebuildável — DOM-0006 — não uma linha atualizada); complexidade de modelo maior;
disciplina de imutabilidade exige enforcement e teste (TST-DOM-0002), não é gratuita.

**O que precisaria ser verdade.** Que o custo D7 seja aceitável frente aos alvos
vinculantes — que não têm alternativa mais barata que os satisfaça por construção.

**Custo de saída.** Baixo *para dentro* (projeções derivam qualquer forma mais simples);
alto *para fora* (abandonar imutabilidade após dado real destruiria a base de replay).

### Opção B — Estado corrente mutável com trilha de auditoria (update-in-place + histórico)

**Descrição.** O fato é uma linha atualizável ("último valor conhecido"); correções
sobrescrevem com cópia do valor anterior para tabela de histórico; conflito resolve-se
por regra de precedência na escrita.

**Frente aos drivers.** D1: replay exige reconstruir o passado a partir do histórico —
possível em teoria, frágil na prática (qualquer caminho de escrita que esqueça o
histórico quebra o replay **silenciosamente**). D2: a invariante vira disciplina de
código, não propriedade do modelo; o modo de falha de HAZ-0008 (correção sobrescreve
história) fica estruturalmente disponível. D3: ausência tende a ser NULL — e NULL é
exatamente o que HAZ-0039 mostra ser lido como normalidade. D4: possível, com campos
separados. D5: possível, com o mesmo custo da Opção A. D6: alvo existe. D7: **o mais
barato** em armazenamento e consulta.

**Positivas.** Simplicidade operacional; consultas de estado corrente triviais; menor
armazenamento; familiar a qualquer equipe.

**Negativas.** As três invariantes mais críticas (DOM-0002/0003/0004) dependem de
disciplina permanente em vez de construção; o precedente legado é exatamente esta
classe de modelo falhando (E7); auditoria "o que se sabia então" vira projeto forense.

**O que precisaria ser verdade.** Que o custo da Opção A fosse proibitivo **e** que um
enforcement externo (triggers, revisão, testes) sustentasse as invariantes com
confiança equivalente — afirmação difícil de evidenciar num sistema que ainda não
existe.

**Custo de saída.** Alto: migrar de mutável para imutável depois de dado real exige
reconstituir cadeias que não foram guardadas — parcialmente impossível.

### Opção C — Sem camada canônica: avaliar diretamente sobre envelopes/recursos de origem

**Descrição.** A V2 armazena os recursos de origem (p.ex. FHIR bruto) e o avaliador
consome-os diretamente, com views/adaptadores por fonte.

**Frente aos drivers.** D1: o replay fica refém da semântica da fonte (que muda por
versão de IG — e a IG 1.1.0 nem existe, E6). D2: a proveniência é a da fonte; correção
cross-fonte não tem lugar. D3: a coerção deixa de ter um ponto único de controle — cada
adaptador re-decide o que fazer com ausência, e a regra §3-7 vira N implementações.
D4: a dimensão de qualidade da fonte pode nem chegar (E5). D6: **elimina** a
contabilidade de perda — não há para onde mapear. D7: barato no início, caro a cada
nova fonte.

**Positivas.** Menor tempo até a primeira demo; sem modelo próprio a manter; zero
"tradução" a auditar.

**Negativas.** Acopla o domínio clínico ao esquema da fonte — exatamente o que o §7.6
proíbe ("Keep AMH schemas outside the clinical domain core"); multiplica os pontos de
aplicação das regras não-negociáveis; torna o G3 semanticamente inavaliável (sem
mapeamento, sem perda declarada).

**O que precisaria ser verdade.** Uma única fonte, estável, com semântica idêntica à
necessária — contradito por E5/E6/E11.

**Custo de saída.** Alto e crescente com o volume: introduzir a camada canônica depois
é re-mapear todo o acervo.

### Opção Z — Adiar

**Descrição.** Não fixar o modelo; seguir com os documentos conceituais do ciclo 0 como
estão.

**Positivas.** Nenhum compromisso; os documentos de domínio já dão vocabulário comum.

**Negativas.** `docs/07` permanece bloqueado; o ADR-0008 fica acoplado a um alvo móvel;
o mapeamento do G3 não pode começar; a primeira fatia vertical (G7) improvisaria um
modelo — decidindo por omissão.

**Custo do atraso.** Cresce com cada ADR dependente (0006/0007/0008/0013 nomeiam este
como pré-requisito) e torna-se migração no primeiro armazenamento.

### 4.1 Comparação frente aos drivers

| Driver | A — imutável canônico | B — mutável + histórico | C — sem camada canônica | Z — adiar |
|---|---|---|---|---|
| D1 replay | Por construção | Por disciplina — frágil | Refém da fonte | Não resolvido |
| D2 proveniência/correção | Por construção | Modo de falha HAZ-0008 disponível | Sem lugar cross-fonte | Não resolvido |
| D3 não-coerção | Ponto único de controle; ausência representável | NULL tende a virar "normal" (HAZ-0039) | N implementações da regra | Não resolvido |
| D4 dimensões independentes | Entidades separadas por construção | Possível com disciplina | Dimensão 1 pode nem chegar (E5) | Não resolvido |
| D5 tempos | Integral, custo assumido | Possível, mesmo custo | Limitado ao que a fonte carrega | Não resolvido |
| D6 perda semântica | Declarável por campo | Declarável | Eliminada — sem alvo | n/a |
| D7 custo | O mais caro | O mais barato | Barato → caro por fonte | Zero agora, migração depois |

---

## 5. Decisão e escopo

> **DECISÃO REGISTRADA (GDEC-0008, 2026-08-15).** O titular aceitou este ADR na
> opção recomendada, incluindo a minuta §5.2 integral — ver §5.0.

### 5.0 Decisão (GDEC-0008, 2026-08-15)

> **decided_by:** rodaquino-OMNI (titular; `AUTH-DATA-PLATFORM` + `AUTH-CLINSAFETY`,
> DEC-G0-04/GDEC-0003).
>
> **Opção aceita:** **Opção A — fato canônico imutável, append-only, com
> correções/conflitos explícitos e duas dimensões de status** (§4), elaboração do
> baseline §9.3, com a **minuta normativa M1–M10 de §5.2 aceita integralmente** —
> chave do fato `(tenant, PSR, encontro)` (M2), preservação temporal completa (M3),
> matriz de admissibilidade (M4), UCUM como sistema canônico (M5), quarentena para
> código desconhecido (M6), não-coerção (M7), correção/conflito sem sobrescrita (M8),
> idempotência/ordem (M9) e aptidão contínua (M10).
>
> **rationale:** conforme sessão de decisão GDEC-0008.
>
> **supersessão:** rege-se pelos próprios gatilhos de revisita desta ADR (§8.2,
> T1–T6) — nenhum gatilho adicional é criado por esta transcrição.

### 5.1 Condições que devem ser satisfeitas antes da aceitação

| # | Condição | Dono | Evidência que a fecha | Estado |
|---|---|---|---|---|
| C1 | ADR-0003 (grão de tenant) e ADR-0004 (identidade/chave `(PSR, encontro)`) aceitos — a chave do fato canônico consome ambos. | titular | Aceitações registradas | **FECHADA** — DECISÃO (GDEC-0008): ADR-0003 e ADR-0004 aceitos na mesma sessão (item 4) |
| C2 | Compatibilidade declarada com o **texto aceito** do ADR-0008 (aceito 2026-08-15, GDEC-0007; N5 — base de tempo; N8 — dimensões; N3 — razões que o modelo alimenta), incluindo quaisquer emendas de aceitação. | autoridade decisora deste ADR | Nota de reconciliação na aceitação | **FECHADA** — DECISÃO (GDEC-0008): compatibilidade declarada na aceitação; M3/M4 mantêm-se consistentes com N5/N8 do texto aceito do ADR-0008 (A1) |
| C3 | A matriz §5.2-M4 revisada pelos donos designados em `status-dimensions.md` (arquiteto de compatibilidade AMH + engenheiro de segurança clínica nomeado). | donos designados | Ratificação ou emenda da matriz | ABERTA |
| C4 | Direção do ADR-0007 quanto ao snapshot de terminologia (A4 — veículo das tabelas de conversão). | titular (cláusulas clínicas GDEC-0003) | ADR-0007 aceito ou direção registrada | **FECHADA NA DIREÇÃO** — ADR-0007 aceito 2026-08-15 (GDEC-0007, conforme `adr-index.md`); resta conferir na reconciliação C2 que o snapshot aceito comporta as tabelas de conversão de M5 |
| C5 | Resposta a H1 (a lane FHIR carrega ou não `_dq_status`) obtida, ou a aceitação registra explicitamente a operação sob qualidade-de-fonte ausente (M10). | AMH clinical-signal contract engineer | Inspeção em ambiente nomeado, ou registro da limitação | ABERTA — sem ambiente |

### 5.2 Minuta normativa proposta (DECISÃO — GDEC-0008: minuta M1–M10 aceita integralmente, sem emenda)

Cada cláusula M-x abaixo é agora vinculante conforme aceita. Cláusulas marcadas ◆
têm consequência clínica direta e permanecem sob AUTH-CLINSAFETY.

**M1 — Fato imutável, cadeia única.** Todo fato clínico canônico é imutável após
persistido, com exatamente **uma** cadeia de proveniência (fonte, envelope, transformação,
versão de mapeamento, coletor). Correção = **novo fato** ligado por relação explícita ao
superado; conflito entre fontes = entidade `Conflict` visível, jamais resolução
silenciosa (DOM-0002; SAF-0014). O envelope de origem é retido imutável para replay
(DOM-0006).

**M2 — Chave do fato.** ◆ A chave de todo fato clínico persistido é
`(tenant, PSR, encontro)` — tenant conforme o grão aceito no ADR-0003; `(PSR, encontro)`
é **restrição DECIDED** (AQ-4, rodaquino-OMNI, 2026-08-15, ata §2). Fato sem encontro
resolúvel **não é** silenciosamente contextualizado: entra com vínculo de encontro
explicitamente ausente/pendente, visível à avaliação (HAZ-0038; a política clínica do
que isso significa por via é ADR-0026/0008, nunca inferência da ingestão).

**M3 — Tempos.** ◆ O fato carrega, como campos distintos e jamais colapsáveis, os
pontos de tempo aplicáveis do modelo do ciclo 0 — para o fato em si, no mínimo:
**observado, efetivo, emitido, recebido, persistido**; o tempo **avaliado** pertence ao
`EvaluationRecord` (os demais pontos — alertado, exibido, reconhecido, agido, corrigido,
reconciliado — pertencem às entidades respectivas, conforme `time-semantics.md`). Cada
ponto persiste **UTC normalizado + offset original + precisão original + valor-fonte cru
+ fuso identificado quando determinável**. **Timestamp ausente é representado como
ausente** — jamais defaultado a "agora", ao tempo de recebimento ou a instante vizinho
(DOM-0009; regra §3-8; HAZ-0007; SAF-0010/0011). Ordenação entre pontos jamais é
presumida (E2).

**M4 — Duas dimensões independentes com matriz explícita.** ◆ A **qualidade de fonte**
(dimensão 1 — para AMH: `valid | warning | quarantined`; genérica para outras fontes,
A2) vive no fato/proveniência. O **status de avaliação V2**
(`valid | partial | not_evaluated | stale | invalid`) vive no `EvaluationRecord`
(ADR-0008). **Jamais colapsadas; jamais uma inferida da outra** (DOM-0008; HAZ-0040;
SAF-0032). A matriz abaixo é o **conteúdo proposto** para o placeholder de
`status-dimensions.md` — cunhada aqui como PROPOSAL, com ratificação reservada aos
donos designados lá (C3). Ela mapeia qualidade de fonte para **admissibilidade do fato
como insumo** — nunca diretamente para status de avaliação, que é computado pelo
ADR-0008 a partir de admissibilidade + completude + atualidade:

| Qualidade de fonte | Admissibilidade proposta do fato como insumo (PROPOSAL) | Efeito no status de avaliação (via ADR-0008 — nunca direto) |
|---|---|---|
| `valid` | Admissível. **Não promove nada**: o fato ainda pode estar stale, incompleto ou inaplicável para a via. | O que a política de completude/atualidade da versão da regra computar (`valid`, `partial`, `stale`…) |
| `warning` | Admissível **com a razão de warning carregada** na proveniência e propagada ao registro de avaliação; a política clínica por classe de escore (ADR-0026) decide se contribui normalmente ou degrada. | Jamais silencioso: a presença de insumo `warning` é visível no registro |
| `quarantined` | **INADMISSÍVEL** como insumo normal. O fato existe, é auditável, e **não alimenta avaliação**. | Avaliação que o exija → `not_evaluated`/`invalid` com razão `quarantined_input` (vocabulário N3 do ADR-0008) — **jamais valor normal** |
| *(sinal ausente — fonte não carrega qualidade, H1)* | **Fail-closed com registro**: o fato carrega `quality: unknown` explícito na proveniência; admissibilidade só existe se a lane tiver sido aceita no G3 **com essa limitação declarada** e coberta por checagens de aptidão próprias da V2 (§7.6 — vazio, 100%-nulo, cobertura, frescor). **Jamais** default silencioso a `valid`. | VALIDATION REQUIRED — depende de C5 |

**M5 — Unidades.** ◆ UCUM é o sistema canônico de unidades (A3). Todo valor numérico
persiste **o par de origem (valor + unidade como recebidos), sempre**, e adicionalmente
o par canônico UCUM **quando a conversão existir na tabela versionada** do snapshot de
terminologia (A4; ADR-0007). A conversão é determinística, versionada e citável no
registro de avaliação — replay usa a tabela da época (DOM-0003). Unidade não-canônica
sem conversão versionada → **quarentena com razão `unmappable_unit`** (HAZ-0032) —
nunca "conversão mais próxima", nunca descarte silencioso.

**M6 — Códigos.** ◆ Conceito clínico com código fora dos catálogos versionados
(snapshot de terminologia) → **quarentena, nunca coerção** a conceito "mais próximo" ou
a texto livre tratado como código (regra do §7.6: *"Unknown codes or units must be
quarantined or explicitly represented — not silently coerced"*). A quarentena é visível,
contada e monitorada (checagens de aptidão); código desconhecido recorrente é sinal
operacional, não ruído.

**M7 — Não-coerção (restatement vinculante).** ◆ Ausente, stale, inválido, parcial,
conflitante ou inavaliável **jamais** vira zero, normal, sem-risco ou não-disparo
silencioso — regra não-negociável §3-7, já vinculante independentemente desta minuta;
restatada porque este modelo é o lugar estrutural onde ela se torna verificável:
ausência, quarentena e conflito são **estados representáveis de primeira classe** que o
avaliador é obrigado a distinguir. Ligada a **HAZ-0005** (a falha ocorrida no legado) e
**HAZ-0043** (a quietude permanente lida como normalidade) — os dois hazards que esta
cláusula existe para tornar estruturalmente impossíveis de reeditar.

**M8 — Correção e conflito.** ◆ Correção nunca sobrescreve nem apaga; o superado
permanece recuperável com a relação explícita e datada (tempo corrigido — E2).
Correção que invalide insumo de avaliação passada **não** reescreve a avaliação:
dispara nova avaliação e reconciliação de alertas via ADR-0008 N6 / ADR-0009
(HAZ-0008). Conflito não resolvido entre fontes permanece visível; resolução (quando
houver política) é ela própria um fato com proveniência.

**M9 — Duplicatas e ordem.** Todo fato tem chave de idempotência derivada do contrato
de fonte (jamais de heurística sobre dados do paciente — precedente negativo do legado
em HAZ-0009); reentrega é detectada e não duplica; chegada fora de ordem não sobrescreve
mais novo com mais velho — a ordenação clínica usa os tempos de M3, não a ordem de
chegada (HAZ-0011).

**M10 — Aptidão contínua.** As checagens de aptidão do §7.6 (fonte vazia, campo
100%-nulo, cobertura por tenant/facility, lacuna referencial, frescor, atraso de
correção) são parte do modelo operacional deste ADR: **resposta bem-sucedida não é
evidência de dado** (HAZ-0039 — *"quem consome lê ausência como afirmação"*). Violações
com impacto de segurança são visíveis a clínicos e operadores (DOM-0007).

### 5.3 Escopo do que a aceitação vincularia

**Vincula:** a forma canônica de todo fato clínico persistido pela V2; a chave; os
tempos e sua preservação; as duas dimensões e a matriz de admissibilidade; o tratamento
de unidade/código desconhecido; a semântica de correção/conflito/duplicata; a retenção
de envelopes.

**Não vincula:** esquema físico e tecnologia (docs/07, pós-aceitação); a semântica dos
cinco estados de avaliação (ADR-0008) e as políticas clínicas por classe (ADR-0026);
precedência entre lanes (ADR-0006); perfis e bindings FHIR (ADR-0013); os valores de
janelas de atualidade (conteúdo de rule release — VALIDATION REQUIRED).

---

## 6. Consequências

Como nenhuma opção foi escolhida, estas são consequências **da existência deste ADR em
`proposed`**.

### 6.1 Positivas

- O ADR-0008 ganha o alvo estável que sua N5 já cita; o mapeamento semântico do G3 e o
  futuro docs/07 ganham objeto; o ADR-0006 pode ser redigido sobre um modelo nomeado.
- As regras não-negociáveis 7 e 8 ganham o lugar estrutural onde são verificáveis
  (TST-DOM-0004/0009), em vez de viverem só como proibição.
- A matriz M4 dá aos donos designados de `status-dimensions.md` um conteúdo concreto a
  ratificar ou emendar — o placeholder deixa de estar vazio.

### 6.2 Negativas

- A minuta §5.2 é extensa; o risco de aceitação em bloco sem exame cláusula a cláusula
  existe — mitigado pela numeração M1–M10 e pelas marcas ◆.
- O custo D7 da Opção A (a única que satisfaz os vinculantes por construção) ainda não
  tem modelo de custo — a autoridade decidirá com um driver não quantificado, e isso é
  dito em vez de escondido.

### 6.3 Neutras / estruturais

- Nada aqui torna consumível o `Observation` AMH (E6 — três pernas abertas, ata §6.1);
  o modelo canônico existe para *quando* houver fonte elegível, e para as fontes
  sintéticas de desenvolvimento (DEC-G0-03) desde já.
- Nada aqui escolhe banco, formato de serialização ou broker (§3 regra 14).

---

## 7. Implicações transversais

| Dimensão | Implicação | Rótulo | Papel responsável | IDs |
|---|---|---|---|---|
| Segurança clínica | Este é o ADR que decide se a falha ocorrida no legado (score 0 com insumos ausentes — HAZ-0005) e a quietude permanente (HAZ-0043) são estruturalmente possíveis na V2. M4/M7 são as cláusulas de maior consequência clínica do programa de dados. | INFERENCE de E7, E8 | AUTH-CLINSAFETY | HAZ-0005, HAZ-0006, HAZ-0032, HAZ-0039, HAZ-0040, HAZ-0043; SAF-0001, SAF-0002, SAF-0028, SAF-0033 |
| Segurança | Envelopes crus retidos são superfície de PHI concentrada: acesso segregado, criptografia e auditoria de leitura são obrigações do ADR-0017/0018 sobre o que este ADR cria; quarentena idem. | INFERENCE | AUTH-SECURITY | ADR-0017, ADR-0018; SAF-0026 |
| Privacidade (LGPD) | Retenção de envelope imutável × direito de apagamento: a semântica de *erasure* segue o ADR-0004 §5.2 (ref aposentada, mapeamento rompido); a política de retenção por classe de dado é ADR-0018 e exige determinação legal — nenhuma conformidade declarada (DEC-G0-03). | VALIDATION REQUIRED | AUTH-PRIVACY-LEGAL (não nomeado) | ADR-0018 |
| Interoperabilidade | O modelo canônico é o alvo do mapeamento campo a campo da camada anticorrupção (§7.6), com perda declarada; consome os contratos pinados (IG 1.1.0 futura) sem deixá-los entrar no núcleo. | SOURCE §7.6 | AUTH-DATA-PLATFORM | ADR-0013; QAS-0025, QAS-0019 |
| Acessibilidade | Estados de ausência/quarentena/conflito que M7 torna representáveis precisam ser *perceptíveis* na UI sem depender de cor e anunciados a tecnologia assistiva — a representabilidade estrutural é pré-condição da visibilidade exigida no prompt §11. | INFERENCE | AUTH-UX | SAF-0034 (via ADR-0008 N7); ADR-0021 |
| Operacional | Projeções de estado corrente rebuildáveis (DOM-0006), monitoramento de quarentena e das checagens M10, e reconciliação pós-downtime tornam-se deveres operacionais de primeira classe. | INFERENCE | AUTH-OPERATIONS | ADR-0020; QAS-0009, QAS-0010 |
| Custo | Armazenamento append-only + envelopes retidos + quarentena tem custo material; **nenhum modelo de custo existe e nenhum número é inventado**; driver D7 registrado como não quantificado. | VALIDATION REQUIRED | AUTH-PRODUCT | — |
| Migração | O modelo canônico é o alvo de qualquer importação legada (ADR-0023): importar exige mapear para cá com proveniência de importação explícita — nunca carga direta. Backfill AMH (quando houver) idem. | INFERENCE | AUTH-OPERATIONS | ADR-0023 |

---

## 8. Reversibilidade, gatilhos de revisita, kill/rollback

### 8.1 Avaliação de reversibilidade

| Item | Reversibilidade | O que fica encalhado ao reverter | Rótulo |
|---|---|---|---|
| Opção A (imutável) | Alta *para dentro* (projeções derivam formas simples); **baixa para fora** após dado real — abandonar imutabilidade destrói a base de replay | A base de fatos e envelopes | INFERENCE |
| Opção B (mutável) | Baixa na direção B→A: cadeias não guardadas não se reconstituem | A história perdida | INFERENCE |
| M4 (matriz) | Alta — a matriz é versionada e emendável pelos donos designados sem tocar o modelo | Testes pinados na versão anterior | INFERENCE |
| M5 (UCUM) | Moderada — trocar o sistema canônico re-converte o acervo, com origem preservada tornando-o possível | Tabelas de conversão | INFERENCE |
| Z (adiar) | n/a — custo de opção crescente | n/a | INFERENCE |

### 8.2 Gatilhos de revisita

| # | Gatilho | Detecção | Notificar | Ação |
|---|---|---|---|---|
| T1 | Resposta a H1 (lane FHIR carrega ou não `_dq_status`) obtida em ambiente | Inspeção camada 2/3 | AUTH-DATA-PLATFORM, AUTH-CLINSAFETY | Fechar C5; ratificar ou emendar a linha "sinal ausente" de M4 |
| T2 | Emenda ou supersessão do texto aceito do ADR-0008 (aceito 2026-08-15, GDEC-0007) que toque N3/N5/N8 | Registro de decisão | autoridade deste ADR | Reconciliar M3/M4 (C2) |
| T3 | Publicação da IG 1.1.0 (muda profiles/bindings consumidos) | Deriva de contrato (QAS-0013) | AUTH-DATA-PLATFORM | Re-verificar mapeamento e E6 |
| T4 | Nova fonte não-AMH aprovada (HL7 v2, dispositivo) | Registro de portfólio/contrato | AUTH-DATA-PLATFORM | Estender a dimensão 1 conforme A2; jamais colapsar |
| T5 | Medição H3 mostrar taxa de quarentena que esvazie uma via aprovada | Checagens M10 | AUTH-CLINSAFETY | A via volta ao G2 — quarentena não é afrouxada para "destravar" via (HAZ-0043) |
| T6 | Insumo aprovado no G2 não representável em UCUM (invalida A3) | Matriz via-fonte §7.2 | autoridade deste ADR | Reabrir M5 |

### 8.3 Kill switch / rollback

Enquanto `proposed`, não há mecanismo a desligar. Na aceitação, os controles
estruturais são: (i) **a quarentena é o kill switch de dado** — qualquer classe de
insumo pode ser tornada inadmissível por política sem tocar código de avaliação, com o
efeito visível como `not_evaluated`/razão, nunca como silêncio; (ii) projeções são
rebuildáveis (DOM-0006), então um defeito de projeção reverte por reconstrução, não por
edição de fato; (iii) fatos e envelopes **não têm** rollback destrutivo — correção é
sempre aditiva; se um lote inteiro for inválido, ele é superado por correção em massa
com proveniência própria, e essa ausência de delete é registrada como propriedade, não
como falta.

---

## 9. Método de validação e evidência vinculada

| # | Afirmação a validar | Método | Ambiente | IDs vinculados |
|---|---|---|---|---|
| V1 | Original recuperável, correção ligada, conflito visível, nenhuma mutação in-place | Testes de propriedade (fato + correção + duplicata conflitante) | Teste (sintético) | TST-DOM-0002; DOM-0002; QAS-0019; HAZ-0008 |
| V2 | Replay campo a campo de avaliação histórica com tabelas da época | Testes de replay + mutação contra o avaliador | Teste | TST-DOM-0003; DOM-0003; QAS-0020 |
| V3 | Cada insumo ausente/stale/inválido/conflitante produz estado explícito não-normal — jamais zero/normal/no-fire | Vetores de referência com razão de não-disparo, um insumo retirado por vez | Teste | TST-DOM-0004; DOM-0004; HAZ-0005, HAZ-0043; SAF-0001, SAF-0002 |
| V4 | Nenhum caminho deriva status de avaliação da qualidade de fonte sem passar pela matriz; combinação não mapeada falha fechada | Testes de contrato + checagem estática | CI + teste | TST-DOM-0008; DOM-0008; HAZ-0040; SAF-0032 |
| V5 | Timestamp ausente/malformado jamais produz instante fabricado; original + offset + precisão preservados em todo ponto | Testes de propriedade sobre envelopes com tempos ausentes/ambíguos (incl. DST `America/Sao_Paulo`) | Teste | TST-DOM-0009; DOM-0009; HAZ-0007, HAZ-0026; SAF-0010, SAF-0011 |
| V6 | Unidade não-canônica e código desconhecido vão a quarentena com razão, nunca a coerção; a quarentena é contada e visível | Vetores com unidades/códigos deliberadamente inválidos | Teste | HAZ-0032; SAF-0028; QAS-0007 |
| V7 | Reentrega não duplica; fora-de-ordem não regride valor; ordenação clínica usa tempos M3 | Testes de duplicata/reordenação | Teste | HAZ-0009, HAZ-0011; SAF-0013 (via ADR-0010), SAF-0033 |
| V8 | Fonte vazia/100%-nula é detectada como violação de aptidão visível — nunca lida como ausência de anormalidade | Checagens de aptidão contra fixtures vazias | Teste + ambiente | HAZ-0039; SAF-0033; M10 |

**Disciplina de marcadores.** Todos os IDs TST-DOM/HAZ/SAF/QAS/DOM citados foram lidos
dos catálogos existentes (`DOM-invariants.md`, `hazard-log.md`,
`safety-requirements.md`, `quality-attribute-scenarios.md`). `REQ:` permanece marcador
literal — o catálogo de requisitos não existe (regra do HANDOFF). **Nenhum ID foi
inventado**; HAZ-0005 e HAZ-0043 foram verificados no hazard-log antes da citação.

---

## 10. Relações de supersessão

- **Supera:** nenhum ADR. Em relação aos documentos de domínio do ciclo 0: **não os
  supera** — `conceptual-model.md`, `time-semantics.md` e `status-dimensions.md`
  permanecem a fonte das definições; este ADR os **eleva a objeto de decisão** e propõe
  o conteúdo do placeholder de matriz de `status-dimensions.md` (M4), cuja ratificação
  permanece dos donos lá designados.
- **Superado por:** nenhum.
- **Notas de relação:** acoplamento declarado com ADR-0008 (C2) e dependência de
  ADR-0003/0004 (C1). Supersessão parcial por fonte, tenant ou classe de dado é
  permitida e jamais generalizada de resultado parcial.

---

## 11. Autoverificação contra o gate de completude do template

Todos os campos da §10 do prompt presentes; três alternativas + adiar, cada uma com
consequências positivas E negativas honestas; drivers discriminantes ligados a QAS, com
os vinculantes distinguidos dos mensuráveis-futuros; **nenhum alvo numérico inventado**;
oito linhas transversais; reversibilidade, gatilhos e kill/rollback presentes; validação
com IDs reais verificados e marcadores honestos; supersessão declarada; **nenhuma
tecnologia selecionada** (UCUM é padrão semântico proposto com fundamento citado, não
produto); nenhuma aprovação fabricada; nenhum dono nomeado por este autor; decisões do
titular citadas com fonte e data (AQ-4); `adr-index.md` atualizado na mesma mudança.
