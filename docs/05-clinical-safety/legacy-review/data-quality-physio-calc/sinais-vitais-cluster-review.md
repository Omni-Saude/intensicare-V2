---
id: LEGREV-DQPC-SINAIS-VITAIS
title: Revisão legada — cluster docs/rules sinais-vitais (33 registros de regra) com disposições por regra, mais o shard legado dispositions/sinais-vitais.yaml
label: PROPOSAL
status: PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI)
statement: >
  Revisão em nível de cluster do cluster de catálogo de regras extraídas legado
  `sinais-vitais` (33 registros de regra, `RULE-SINAIS-VITAIS-001`..`033`, todos
  independentemente lidos e verificados por SHA-256), com uma tabela de disposição por
  regra sob `docs/00-governance/legacy-import-policy.md`, mais a revisão independente
  deste workstream sobre o próprio shard de disposição não-ratificado da equipe legada
  para o mesmo cluster (`docs/plan/_work/dispositions/sinais-vitais.yaml`).
provenance:
  source_repo: intensicare (legado V1, READ-ONLY)
  path_or_url: docs/rules/{alert-threshold,care-pathway,clinical-scoring,data-validation,drug-dosing}/RULE-SINAIS-VITAIS-*.md; docs/plan/_work/dispositions/sinais-vitais.yaml
  commit_sha_or_version: 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79 (HEAD no pin; todo arquivo individualmente verificado por SHA-256 em §0)
  section_or_lines: cluster inteiro (33 arquivos) mais o shard de disposição inteiro
  date_collected: 2026-08-15
  last_updated: 2026-08-15
  collector: rodaquino-OMNI (revisor forense legado de qualidade-de-dados/cálculo-fisiológico, ciclo 1 Tarefa 1, wave 1b)
  transformation: >
    traduzido EN→pt-BR, tranche 4, GDEC-0008 item 8 (todo registro de regra e o shard
    de disposição lidos por completo; resumos de uma linha condensados dos registros;
    os vereditos são propostas independentes deste revisor sob o vocabulário da V2, não
    uma cópia das disposições ADOPT/RETIRE/ADAPT próprias do shard, não-ratificadas,
    da equipe legada)
  confidence: alta (conteúdo dos registros, verificação de hash) / média (disposições)
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  hazards: [HAZ-0005, HAZ-0006, HAZ-0032]
  adrs: []
  pr: null
supersedes: null
superseded_by: null
---

> Traduzido EN→pt-BR em 2026-08-16 (GDEC-0008 item 8, tranche 4); original EN preservado no histórico git.

# Cluster de regras `sinais-vitais` — revisão de disposição

> **PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).**
> Nada nesta tabela é uma decisão de importação. Um veredito aqui propõe uma
> classificação sob `docs/00-governance/legacy-import-policy.md` §4;
> qualquer importação real exige adicionalmente todas as oito precondições
> do §3, atualmente não satisfeitas.

## 0. Fontes e integridade

OBSERVED 2026-08-15: `inventory.md` §3 registra o cluster `sinais-vitais`
como **33/33** regras (a contagem do índice é igual à contagem em disco,
sem regras faltando), classificado `clinically substantive`
(`docs/05-clinical-safety/legacy-review/00-inventory/inventory.md:672`).
Este revisor localizou independentemente, leu por completo, e verificou por
SHA-256 os 33 arquivos em disco contra `docs/archive/legacy-provenance/
legacy-pin-cycle-1.md` — **zero discrepâncias, zero arquivos ausentes.**
Eles estão espalhados por cinco diretórios de categoria `docs/rules/` (não
um único diretório `sinais-vitais/` — a taxonomia de categoria da
ferramenta de extração é ortogonal à sua taxonomia de cluster):

```text
docs/rules/alert-threshold/      RULE-SINAIS-VITAIS-001..005
docs/rules/care-pathway/         RULE-SINAIS-VITAIS-007
docs/rules/clinical-scoring/     RULE-SINAIS-VITAIS-011
docs/rules/data-validation/      RULE-SINAIS-VITAIS-006, 008-010, 012, 013-028, 032, 033
docs/rules/drug-dosing/          RULE-SINAIS-VITAIS-029, 030, 031
```

O próprio shard de disposição não-ratificado da equipe legada é
`docs/plan/_work/dispositions/sinais-vitais.yaml` (608 linhas, 33
registros, SHA-256 `932c69c4...` confirmado contra `inventory.md`).
Conforme `inventory.md` §2.9 (OBSERVED): este shard é "a própria revisão
clínica (não-ratificada sob a governança da V2) da equipe legada... ela
materialmente acelera a revisão do ciclo-1, mas NÃO tem autoridade — toda
disposição precisa de revisão independente da V2." **Este registro usa o
shard como contexto (seu campo `justification` é citado onde informativo)
mas atribui seus próprios vereditos independentes** usando o vocabulário
de `legacy-import-policy.md` §4 — não o vocabulário próprio
`ADOPT`/`RETIRE`/`ADAPT`/`ADOPT-CORRECTED` do shard, que é um esquema
diferente, não-governado-pela-V2.

**Cautela entre clusters.** Cinco dessas regras (001-005) também aparecem
como linhas na `alert-threshold-cluster-review.md` do workstream
alert-threshold-engine (o próprio cluster daquele workstream é um
diretório `docs/rules/alert-threshold/` *diferente*, tematicamente
misturado, que por acaso contém um punhado de arquivos
`RULE-SINAIS-VITAIS-*` ao lado de `RULE-SEPSE-*`, `RULE-VENTILACAO-*`,
etc.). Conforme `coverage-map.md` §1 regra 3 ("classificação de cluster"
governa a atribuição, não a pasta de categoria da ferramenta de
extração), essas cinco regras pertencem a **este** workstream por cluster
(`sinais-vitais`), e este registro é sua disposição autoritativa; os
vereditos da tabela do alert-threshold-engine para os mesmos cinco IDs de
regra são a leitura independente daquele revisor do mesmo texto fonte e
**não são duplicados nem sobrepostos aqui** — ambos são PROPOSALs, com
referência cruzada, não reconciliados em um só.

## 1. Método de veredito (lente de unidades/qualidade-de-dado, aplicado uniformemente)

| Veredito | Aplicado quando |
|---|---|
| **REJECT** | O limite não consegue discriminar entre duas unidades clinicamente diferentes que uma fonte legada conflaciona (um valor de unidade errada passa sem ser detectado); OU a unidade do limite está indocumentada no código (não-verificável contra uma faixa de dose publicada); OU a validação está desabilitada/morta em um campo clinicamente relevante; OU o limite é internamente inconsistente com um campo pareado que codifica o mesmo conceito. |
| **VALIDATE** | O limite é bem-formado, sem ambiguidade de unidade, e (onde checado) numericamente consistente com sua contraparte cross-formulário/backend e, onde existe uma faixa publicada, com essa faixa — mas nenhum limite de plausibilidade legado pode entrar na V2 sem validação empírica/clínica e aprovação nomeada; este é o teto para todo limite genuinamente clínico do cluster. |
| **TRANSFORM** | O padrão subjacente é sólido (p. ex., auditoria-ao-excluir, um conceito de captura unificado) mas o mecanismo/codificação legado concreto não é o artefato a carregar adiante. |
| **SUPERSEDE** | Uma reexpressão de frontend morta/duplicada de um validador de backend já capturado em outro lugar deste cluster, ou encanamento de caminho-de-escrita legado que a própria justificativa do shard alega ser substituído por um read model AMH Gold/FHIR sob o ADR-001 — uma alegação que este revisor **não verificou independentemente** (VALIDATION REQUIRED; o ADR-001 está fora da lista de itens deste workstream). |
| **RETAIN / REFINE** | Não proposto para nenhuma linha — nenhum limite de validação legado é importado como-está ou com modificação leve sem que as lacunas de discriminação-de-unidade e ratificação-clínica abaixo sejam fechadas primeiro. |

## 2. Tabela de disposição por regra

| ID da regra | O que faz (uma linha, citada) | Veredito |
|---|---|---|
| RULE-SINAIS-VITAIS-001 | Limites FE antd de PA/FC (PAS 50-250, PAD 0-150, FC 0-200) espelham exatamente os validadores de backend 018/019/027 (`dataFormMovimentacao.ts:72-92`) | SUPERSEDE — mecânica FE duplicada morta (VALIDATION REQUIRED sobre a alegação do ADR-001 do shard); conteúdo numérico carregado por 018/019/027 |
| RULE-SINAIS-VITAIS-002 | Limites FE para 7 valores de gasometria/lab (PO2, PaCO2, lactato, leucócitos, bilirrubina, creatinina, plaquetas) espelham exatamente os validadores de backend (`dataFormMovimentacao.ts:145-198`) | SUPERSEDE — mecânica FE duplicada morta; conteúdo numérico carregado por 014/016/022/024/025/026/028 |
| RULE-SINAIS-VITAIS-003 | Limites FE para débito urinário (0-10000 mL) e temperatura (20-43°C) espelham exatamente o backend (`dataFormMovimentacao.ts:199-212`) | SUPERSEDE — mecânica FE duplicada morta; conteúdo numérico carregado por 021/023 |
| RULE-SINAIS-VITAIS-004 | Refil capilar (TEC) capturado de 3 formas incompatíveis (numérico 3-20s, booleano >5s, checkbox >5s); o piso numérico de 3s exclui refil fisiologicamente normal (<=2-3s, ANDROMEDA-SHOCK) | REJECT como implementada — 3 codificações divergentes de um conceito, um defeito na própria entrada de dado; TRANSFORM para um único campo canônico `s` conforme `units-registry.md` §2.3 `tempo_enchimento_capilar`. O "[RATIFIED 2026-07-04]" do shard é uma **auto-ratificação da equipe legada** — não uma autoridade clínica da V2, nula sob a notação de evidência da V2 (nenhum agente pode auto-aplicar status equivalente a DECIDED) |
| RULE-SINAIS-VITAIS-005 | O formulário médico deixa FC/FR/temp/SpO2 **sem limite**, diferente do formulário de movimentacao e dos validadores de backend que limitam FC 0-200/FR 0-50/temp 20-43 | REJECT — superfície de validação inconsistente entre pontos de entrada (UX de aceitar-depois-rejeitar); um valor que o formulário médico aceita pode ser rejeitado pelo backend ao salvar |
| RULE-SINAIS-VITAIS-006 | `SinaisVitaisViewSet.get_queryset()` usa o manager padrão, não `objects_without_deleted` — linhas de sinal vital soft-deleted vazam para listagens | REJECT — valores excluídos/substituídos podem reentrar em uma visão clínica; mesmo padrão de defeito de balanco-hidrico entrada/saida |
| RULE-SINAIS-VITAIS-007 | Soft-delete registra uma ação de auditoria `AcaoHomecare`; nenhum campo de balanço hídrico ajustado (corretamente, vitais não afetam o balanço) | TRANSFORM — o conceito auditoria-ao-excluir é sólido; a chamada `AcaoHomecare` específica do Tasy é encanamento legado a reconstruir |
| RULE-SINAIS-VITAIS-008 | id do `balanco` pai injetado do kwarg da URL; flag `assinar` repassada apenas se presente | SUPERSEDE — conexão de viewset Django para um padrão de rota aninhada legado, sem conteúdo clínico (VALIDATION REQUIRED sobre a alegação do ADR-001 do shard) |
| RULE-SINAIS-VITAIS-009 | Validador genérico de campo-percentual 0-100, reutilizável em qualquer campo tipado-percentual | VALIDATE — limite genérico sólido, sem ambiguidade de unidade, ainda exige validação clínica/independente nomeada por campo em que é aplicado |
| RULE-SINAIS-VITAIS-010 | FiO2 21-100 (percentual), zero-isento como "não medido" | VALIDATE o limite em si (confirmado no backend, correspondente no FE); **este é o campo FiO2-percentual do lado-OLTP que o registro de unidades deste workstream (§3.1) mostra converter corretamente para fração APENAS dentro do caminho Gold/Athena — nada aqui rotula o valor como "percentual" para qualquer outro consumidor.** |
| RULE-SINAIS-VITAIS-011 | Escala de Coma de Glasgow 3-15, zero-isenta; externamente VERIFIED contra Teasdale & Jennett 1974 / StatPearls | VALIDATE — maior confiança de evidência externa no cluster; ainda exige aprovação clínica nomeada da V2 antes de importar (teto, não RETAIN) |
| RULE-SINAIS-VITAIS-012 | PEEP 0-40 cmH2O, sem isenção de zero (0 = sem pressão positiva é válido) | VALIDATE o limite; nota: `units-registry.md` §2.2 documenta uma conversão de borda `mbar` ×1,01972 não implementada para PEEP (units-normalization-review.md §4) |
| RULE-SINAIS-VITAIS-013 | TEC 3-20s, zero-isenta; faixa mais ampla que o normal clínico (<2-3s), entrelaçada com o problema das 3 codificações da regra 004 | REJECT como implementada — o piso permissível de 3s colide com o achado de corte-clínico da regra 004; TRANSFORM assim que a codificação for unificada |
| RULE-SINAIS-VITAIS-014 | PaO2 0-500 mmHg, sem isenção de zero | VALIDATE |
| RULE-SINAIS-VITAIS-015 | Frequência respiratória 0-50, sem isenção de zero (0 = apneia representável) | VALIDATE |
| RULE-SINAIS-VITAIS-016 | Lactato arterial 0-20, a própria coluna de Unidade da regra diz "mmol/L (mg/dl per some texts)" — a unidade é em si ambígua no registro | REJECT como implementada — este limite não consegue discriminar um valor mg/dL de um valor mmol/L (a manifestação do lado-OLTP do SYS-03 de `units-registry.md`, classe ~9×); VALIDATE o conceito de plausibilidade uma vez rotulado por unidade |
| RULE-SINAIS-VITAIS-017 | Volume corrente 0-1500 mL, sem isenção de zero | VALIDATE |
| RULE-SINAIS-VITAIS-018 | PA sistólica (PAS) 50-250 mmHg, zero-isenta | VALIDATE |
| RULE-SINAIS-VITAIS-019 | PA diastólica (PAD) 0-150 mmHg, **sem** isenção de zero — inconsistente com o PASValidator pareado, que isenta 0 | REJECT como implementada — o mesmo evento "não medido" é codificado de duas formas diferentes dependendo de qual campo do par sistólica/diastólica é usado; TRANSFORM para unificar o tratamento de sentinela |
| RULE-SINAIS-VITAIS-020 | Validador de pressão arterial média (PAM/MAP) 0-200 mmHg **definido mas comentado** no campo do model — a PAM nunca é armazenada nem validada hoje | REJECT — uma entrada hemodinâmica clinicamente relevante (alimenta o índice de choque, `units-registry.md` §2.3) com validação silenciosamente desabilitada; uma segunda lacuna silenciosa adjacente ao HAZ-0005 ao lado da regra 033 |
| RULE-SINAIS-VITAIS-021 | Débito urinário 24h 0-10000 mL, sem isenção de zero (0 = anúria representável) | VALIDATE |
| RULE-SINAIS-VITAIS-022 | Bilirrubina 0-30 mg/dL, sem isenção de zero — entrada hepática do SOFA | **REJECT como implementada** — mesmo defeito de limite-cego-a-unidade da regra 016, mas para bilirrubina: conforme `units-registry.md` §2.5 (µmol/L ×0,05848, ÷17,1) e `sofa-review.md` D-06, um **valor de faixa normal em µmol/L (~5-21) cabe numericamente dentro deste limite 0-30 "mg/dL" e passa sem ser detectado** — este é o mesmo hazard ~17× que `units-normalization-review.md` §3.2 encontra não implementado na camada de conversão, agora confirmado como também passando sem checagem na camada de **entrada de dado**. **Pior achado isolado deste cluster.** |
| RULE-SINAIS-VITAIS-023 | Temperatura 20-43°C, zero-isenta | VALIDATE — o sentinela 0°C não é distinguível de uma tentativa genuína de entrada de hipotermia extrema; VALIDATION REQUIRED se 0 deve permanecer um sentinela ou ser rejeitado por completo na V2 |
| RULE-SINAIS-VITAIS-024 | PaCO2 0-150 mmHg, sem isenção de zero | VALIDATE o limite; nota: `units-registry.md` §2.1 documenta uma conversão de borda `kPa` ×7,50062 para PaCO2 que, diferente de sua irmã PaO2, está ausente do registro em runtime de `units_normalizer.py` (units-normalization-review.md §4) |
| RULE-SINAIS-VITAIS-025 | Creatinina 0-20 mg/dL, sem isenção de zero | VALIDATE — o exemplo mais bem alinhado do cluster: o limite OLTP e a conversão de unidade do pipeline Gold (`units_normalizer.py` `creatinina` µmol/L ×0,0113) concordam tanto em unidade quanto em cobertura |
| RULE-SINAIS-VITAIS-026 | Contagem de leucócitos 0-40000 /mm3, sem isenção de zero | VALIDATE o limite; nota: `units-registry.md` §2.5 canoniza leucócitos como `10^3/uL` (uma **escala diferente** desta contagem bruta `/mm3`), não implementada em lugar algum em runtime (units-normalization-review.md §4) |
| RULE-SINAIS-VITAIS-027 | Frequência cardíaca 0-200 bpm, sem isenção de zero (0 = assistolia representável) | VALIDATE |
| RULE-SINAIS-VITAIS-028 | Contagem de plaquetas 0-700000 /mm3, sem isenção de zero — entrada de coagulação do SOFA | VALIDATE o limite; mesma lacuna de descompasso-de-escala que leucócitos vs. o canônico `10^3/uL` de `units-registry.md` (units-normalization-review.md §4) |
| RULE-SINAIS-VITAIS-029 | Dose de dobutamina 0-30, **unidade indocumentada no código** (ml/h por uma captura, mcg/kg/min por outra); o próprio registro marca Verificação = UNVERIFIABLE | REJECT como implementada — um limite sem unidade declarada não pode ser checado contra a faixa publicada de 2-20 mcg/kg/min; VALIDATION REQUIRED antes de qualquer uso na V2 |
| RULE-SINAIS-VITAIS-030 | Dose de noradrenalina 0-200, **unidade indocumentada** ("ml" por uma captura); o próprio registro marca Verificação = UNVERIFIABLE | REJECT como implementada — a instância do lado-OLTP do SYS-02 de `units-registry.md` (caos de unidade de dose de vasopressor, classe ~60×, explicitamente um hazard que "precisa de um serviço, não de um fator") |
| RULE-SINAIS-VITAIS-031 | Dose de sedativo 0-30 — agrega uma classe de fármaco inteira (midazolam, propofol, dexmedetomidina, fentanil) sob um limite sem unidade; o método de teste do backend é *nomeado* `..._entre_0_e_200` mas o limite imposto é 0-30 | REJECT — nenhuma âncora clínica externa única para uma classe de fármaco agregada, mais uma discrepância interna nome-do-teste/limite-imposto |
| RULE-SINAIS-VITAIS-032 | Pressão inspiratória (PINS) 0-30 cmH2O, sem isenção de zero | VALIDATE o limite; `units-registry.md` §2.2 em si sinaliza "Limites 0-30 vs 5-40 (RATIFICAR)" para este parâmetro — uma divergência de limites que o documento de design já conhece, não resolvida |
| RULE-SINAIS-VITAIS-033 | Validador SpO2/SatO2 definido 21-100% mas **desabilitado** no campo do model — SpO2 está efetivamente **não validada**; também internamente inconsistente (sem isenção de zero vs. o FiO2Validator estruturalmente idêntico, que isenta 0) | REJECT — uma entrada obrigatória do domínio respiratório (`units-registry.md` §2.1: SpO2 é `percent`, "Permanece percentual; ≠ FiO2" — precisamente a confusão que este validador desabilitado convida) **não tem validação viva alguma**; uma segunda lacuna silenciosa adjacente ao HAZ-0005 ao lado da regra 020 (PAM) |

## 3. Contagens de disposição

| Veredito | Contagem | IDs de regra |
|---|---|---|
| RETAIN | 0 | — |
| REFINE | 0 | — |
| TRANSFORM | 1 | 007 |
| VALIDATE | 16 | 009, 010, 011, 012, 014, 015, 017, 018, 021, 023, 024, 025, 026, 027, 028, 032 |
| SUPERSEDE | 4 | 001, 002, 003, 008 |
| REJECT | 12 | 004, 005, 006, 013, 016, 019, 020, 022, 029, 030, 031, 033 |
| **Total** | **33** | |

## 4. Achados em nível de cluster

1. **Zero regras alcançam status pronto-para-importação.** Nenhum
   `RETAIN`/`REFINE` — mesmo o limite de GCS externamente verificado (011)
   e o par de creatinina melhor alinhado (025) têm teto `VALIDATE`
   pendente de aprovação clínica nomeada, consistente com o próprio achado
   do workstream alert-threshold-engine de que o teto se aplica a todo o
   cluster.
2. **O limite de bilirrubina (022) é o achado isolado mais grave em todo
   este workstream.** Não é meramente uma questão de faixa-de-plausibilidade
   — é a confirmação concreta, na camada de entrada-de-dado, do hazard de
   conflação-de-unidade ~17× que tanto `units-normalization-review.md` §3.2
   quanto `sofa-review.md` D-06 do workstream de sepsis-scores nomeiam, a
   partir do lado do registro/pontuação. Os três achados triangulam sobre
   o mesmo defeito a partir de três pontos de vista independentes
   (documento de design, registro em runtime, validador OLTP) — em lugar
   algum do pipeline um valor de bilirrubina de unidade errada é
   capturado.
3. **Dois vitais clinicamente relevantes têm a validação silenciosamente
   desabilitada, não meramente ausente**: PAM (020) e SpO2 (033). Ambas as
   classes de validador existem, estão corretamente formadas, e estão
   comentadas no campo do model — um defeito mais forte do que "nunca
   construído", porque à primeira vista parece intencional e é fácil de
   perder em um diff.
4. **A divergência frontend/backend é a forma de defeito dominante** entre
   as linhas `REJECT` para regras de superfície-de-validação (005, 019 por
   padrão de omissão) — um valor aceito em um ponto de entrada pode ser
   silenciosamente rejeitado ou sentinelado de forma diferente em outro,
   um UX de aceitar-depois-rejeitar que corrói a confiança na suposição de
   "o formulário já validou isso" que qualquer código a jusante possa
   fazer.
5. **O padrão de limite-ambíguo-em-unidade (016 lactato, 022 bilirrubina)
   generaliza**: qualquer limite de plausibilidade amplo o bastante para
   admitir tanto a faixa de unidade-canônica de um parâmetro quanto uma
   faixa de unidade-alternativa comum para o *mesmo valor clinicamente
   plausível* não consegue, por construção, capturar uma confusão de
   unidade — apenas um valor rotulado por unidade com uma checagem de
   conversão independente (revisada em `units-normalization-review.md`)
   consegue. Este é um argumento estrutural, não por regra: **todo limite
   de plausibilidade OLTP deste cluster deveria ser re-derivado junto com
   sua unidade canônica de `units-registry.md`, não independentemente
   dela.**

Todas as disposições: PROPOSAL — AWAITING NAMED CLINICAL REVIEW
(reviewer: rodaquino-OMNI).
