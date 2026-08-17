---
id: LEGREV-ALTB-THRESHOLDS
title: Revisão legada — configuração de limiares da V1, resolver, API e valores de limiar clínico semeados
label: PROPOSAL
status: PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI)
statement: >
  Revisão source-verified do modelo de configuração de limiares da V1, do
  resolvedor de escopo, da API de admin, e de cada valor de limiar clínico
  semeado (migração 0038 mais os conjuntos de limiares de fallback hardcoded),
  cada um checado contra a fonte primária publicada ou sinalizado UNCITED.
  Achados de governança são marcados INPUT TO ADR-0007.
provenance:
  source_repo: intensicare (legado V1, READ-ONLY)
  path_or_url: alembic/versions/0038_seed_default_threshold_config.py e src/intensicare/ (models, services, schemas, api)
  commit_sha_or_version: 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79 (HEAD no pin; SHA-256 por arquivo na seção 0)
  section_or_lines: citado por achado como path:linhas
  date_collected: 2026-08-15
  last_updated: 2026-08-15
  collector: rodaquino-OMNI (revisor forense do motor de alerta e limiar legado, ciclo 1 Tarefa 1)
  transformation: >
    traduzido EN→pt-BR, tranche 3, GDEC-0008 item 8 (lido a partir da fonte;
    valores semeados comparados contra diretriz publicada e fontes de
    literatura primária citadas a partir do conhecimento do revisor —
    documentos externos NÃO foram reobtidos neste ambiente, então toda citação
    publicada abaixo carrega VALIDATION REQUIRED para re-verificação contra a
    fonte impressa antes de qualquer uso)
  confidence: alta (citações de código) / média (comparações com fonte publicada)
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  hazards: [HAZ-0005, HAZ-0019, HAZ-0021, HAZ-0036]
  adrs: []
  pr: null
supersedes: null
superseded_by: null
---

> Traduzido EN→pt-BR em 2026-08-16 (GDEC-0008 item 8, tranche 3); original EN preservado no histórico git.

# Configuração de limiares da V1 e valores clínicos semeados — revisão forense

> **PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).**
> Honestidade de citação: as fontes publicadas abaixo são citadas a partir do
> conhecimento do revisor sobre a literatura canônica. Este ambiente não
> reobteve os documentos; cada citação, portanto, exige re-verificação contra
> a fonte impressa pelo revisor clínico (VALIDATION REQUIRED) antes que
> qualquer limiar seja utilizado. Onde não existe autoridade citável, o valor
> é sinalizado **UNCITED** — nenhum foi inventado.

## 0. Arquivos citados e integridade

Caminhos relativos a `https://github.com/Omni-Saude/intensicare`. OBSERVED 2026-08-15: todo
SHA-256 abaixo corresponde a
`docs/archive/legacy-provenance/legacy-pin-cycle-1.md`.

```text
c11d640d1a29aab2d99e39a741d35bceec2a6d688e174db3cbded2bf089c4486  alembic/versions/0038_seed_default_threshold_config.py
8c93cadddeacd7d6cce3f34e2ed0718410ab037ce15050279ad4af5baccecbbc  src/intensicare/models/threshold_config.py
0b02d8ace9bdc89695eeaa2e08d81b2a72070c27624265190b2005883c20ee6f  src/intensicare/services/threshold_resolver.py
d6804247eed80d90f8f0ca7b2e3af77ef7f1b61c79ec3bdc93dd4ec729ebb9ea  src/intensicare/schemas/thresholds.py
d75b31f6dc474ae0d8c995dbf5adde9fdefb5fb9a3fa191652789d37e5f23a28  src/intensicare/api/thresholds.py
79a7f055c8d33b4f8d0f2866bd136af0cbbe389bae079736b5f133c511605acc  src/intensicare/api/reference_ranges.py
ae60425f025bc7387c720dfe2c35fa89b0c2e053d33e2ad81d78828a68ac1489  src/intensicare/services/dashboard.py
80001a3664c84b746aa43068864a3dd1f01c2aee9e01d13c4dfa1f276ab8bb96  src/intensicare/services/correlation_engine.py
80980e3966626480a95af4ebe4ba379794dd4b74eaa99fb455923c2530df20ee  src/intensicare/services/alert_engine.py
```

Hash-and-note (ausente do manifesto; hashes em `README.md`):
`tests/test_threshold_resolver.py`, `tests/test_thresholds.py`.

---

## 1. Modelo de configuração de limiares (FINDING 5 — INPUT TO ADR-0007)

OBSERVED (`src/intensicare/models/threshold_config.py:11-39`): uma linha
mutável por (tenant, unit, bed, score_type) com limiares inteiros
`watch/urgent/critical`, `rate_limit_per_hour`/`cooldown_minutes` opcionais,
colunas de evidência (`guideline_source`, `evidence_doi`, `evidence_level`), e
`updated_at`/`updated_by`. Restrição de unicidade sobre as quatro colunas de
escopo (`:21-23`).

**Versionamento — nenhum.** As linhas são atualizadas in place
(`src/intensicare/api/thresholds.py:146-215`); o histórico existe apenas como
blobs JSON de trilha de auditoria (`before_state`/`after_state`). A tabela
`alert_definition_version` existe, mas nenhuma linha de limiar referencia uma
versão e o caminho de alerta em produção nunca carimba uma
(engine-review §2.2 F2.4). Uma mudança de limiar é, portanto, efetiva
imediatamente, invisível nos alertas que ela subsequentemente molda, e
reconstruível apenas por replay de auditoria forense. **INPUT TO ADR-0007.**

**Quem pode mudar o quê.** Todo CRUD exige apenas o papel `admin`
(`api/thresholds.py:24-28` `require_admin` em nível de router); não há etapa
de aprovador clínico, nenhuma revisão independente, nenhuma validação de
ordenação — o schema aceita `watch=10, urgent=2, critical=1`
(`schemas/thresholds.py:9-38` valida apenas `ge=0` por campo), o que
classificaria incorretamente todo escore. As mutações SÃO auditadas
(REQ-INV-1-2, `api/thresholds.py:45-67,129-139,200-211,248-257`) — o único
controle de governança presente. Os testes confirmam a intenção: auth/audit
são testados (`tests/test_thresholds.py:16-49`,
`tests/test_threshold_resolver.py:169-351`), mas **nenhum teste afirma
watch <= urgent <= critical** e nenhum exercita o engine em produção contra
uma configuração invertida. **INPUT TO ADR-0007.**

**Lacunas de cobertura de escopo.** `ThresholdConfigCreate` **não tem campo
`bed_id`** (`schemas/thresholds.py:9-25`), então linhas em nível de leito não
podem ser criadas pela API mesmo que o resolvedor suporte o nível de leito —
o escopo mais específico só é configurável por escrita direta no BD. **INPUT
TO ADR-0007.**

**Veredito:** **REFINE** o *conceito* do modelo (limiares escopados com
colunas de evidência e mutação auditada) — com mudanças V2 obrigatórias:
releases versionados imutáveis, workflow de aprovação clínica, invariantes de
ordenação aplicados em nível de schema e de BD, superfície de escopo
completa. A implementação mutável-in-place em si: **REJECT**.
PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).

## 2. Resolução de limiares — dois engines, duas semânticas (INPUT TO ADR-0007)

- `threshold_resolver.resolve_threshold`
  (`src/intensicare/services/threshold_resolver.py:50-117`): leito sobre
  unidade sobre tenant, o mais específico vence; o nível de unidade exclui
  corretamente linhas de leito (`:101`); o nível de tenant exige unidade e
  leito ambos NULL (`:108-116`). Testado quanto à precedência
  (`tests/test_threshold_resolver.py:47-167`).
- O **caminho de alerta em produção não o usa**: `alert_engine.py:32-44`
  implementa sua própria busca de dois níveis (unidade, depois tenant) **sem
  nível de leito** e **sem excluir linhas de leito da consulta de unidade** —
  o defeito documentado em engine-review §2.2 F2.3. O único consumidor do
  resolvedor real é `deterioration_trend.py:171`.
- Uma terceira cópia da semântica existe como fallbacks hardcoded em
  `dashboard.py:44-76` (seção 4 abaixo).

Um modelo de escopo, três implementações, duas delas divergentes. A
governança de limiares é sem sentido se a semântica de resolução difere por
consumidor. **INPUT TO ADR-0007.**

**Veredito:** o conceito do resolvedor (leito sobre unidade sobre tenant,
auditado) **TRANSFORM** em um único serviço de resolução V2 usado por todo
consumidor; a resolução duplicada do lado do engine **REJECT**.
PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).

## 3. Migração 0038 — cada valor de limiar clínico semeado

OBSERVED (`alembic/versions/0038_seed_default_threshold_config.py:46-71`):
duas linhas semeadas, apenas tenant `default`, unit/bed NULL, com colunas
`guideline_source` e (para MEWS) `evidence_doi` populadas;
`cooldown_minutes` e `rate_limit_per_hour` NÃO são semeados (NULL — ver
engine-review §4.2 para a consequência clínica: nenhum cooldown de forma
alguma).

### 3.1 Revisão por valor

| # | Escore | Faixa | Valor semeado | Autoridade publicada (fonte primária) | Concordância | Sinalização |
|---|---|---|---|---|---|---|
| 1 | MEWS | watch | >= 3 | nenhuma encontrada na fonte primária citada. Subbe CP, Kruger M, Rutherford P, Gemmel L. "Validation of a modified Early Warning score in medical admissions." QJM 2001;94(10):521-526. DOI 10.1093/qjmed/94.10.521 — a associação relatada pelo estudo é em escore >= 5; nenhuma faixa "watch" de 3 pontos é definida ali | não derivável da fonte citada | **UNCITED** |
| 2 | MEWS | urgent | >= 4 | o rationale de semeadura atribui ">= 4 gatilho de resposta" a Subbe 2001 (`0038:14-17,54-57`). Este revisor não consegue confirmar um gatilho de resposta em 4 pontos como achado daquele artigo; um corte >= 4 é uma convenção local de escalonamento comum, não (ao conhecimento deste revisor) o limiar do estudo citado | atribuição não confirmável | **UNCITED como atribuído** — VALIDATION REQUIRED contra o artigo impresso |
| 3 | MEWS | critical | >= 5 | Subbe 2001 (acima): escores >= 5 associados a risco aumentado de óbito e admissão em UTI | consistente (limiar de associação; sua reclassificação como "faixa de alerta crítico" é um passo interpretativo que o artigo não faz) | VALIDATE |
| 4 | NEWS2 | watch | >= 3 (agregado) | Royal College of Physicians. "National Early Warning Score (NEWS) 2 — Standardising the assessment of acute-illness severity in the NHS." Relatório atualizado de um working party. Londres: RCP, dezembro de 2017. No NEWS2, o agregado 1-4 é risco BAIXO (resposta baseada na enfermaria); o limiar "3" no NEWS2 é a regra do **escore vermelho de parâmetro único** (escore de 3 em qualquer parâmetro isolado), uma dimensão diferente do agregado | **DISCREPANTE — erro de dimensão**: uma regra de parâmetro único aplicada como corte agregado. A V1 não computa nenhum escore vermelho de parâmetro único | **UNCITED** (como limiar agregado) |
| 5 | NEWS2 | urgent | >= 5 | RCP NEWS2 2017 (acima): agregado 5-6 = risco MÉDIO, limiar de revisão urgente baseada na enfermaria ("limiar-chave") | consistente | VALIDATE |
| 6 | NEWS2 | critical | >= 7 | RCP NEWS2 2017 (acima): agregado >= 7 = risco ALTO, avaliação de emergência | consistente | VALIDATE |

Contagens para a migração 0038: **6 valores revisados; 3 consistentes com a
fonte primária citada (linhas 3, 5, 6 — sujeitas a re-verificação); 3
UNCITED ou discrepantes (linhas 1, 2, 4), das quais a linha 4 é
adicionalmente uma discrepância de aplicação de dimensão incorreta.**

Observações estruturais sobre a 0038:

- Colunas de evidência na semeadura são o instinto certo (`0038:10-31`) — o
  único artefato de limiar na V1 que registra *por quê*.
- **Lacuna de cobertura de tenant**: apenas o tenant `default` é semeado
  (`0038:46`). Qualquer outro tenant não tem linhas de configuração, e a
  resposta do engine para ausência de configuração é um não-alerta
  silencioso (`alert_engine.py:46-48`) — o alerting fica silenciosamente
  desabilitado por tenant enquanto o dashboard ainda colore leitos via
  fallbacks hardcoded. **INPUT TO ADR-0007** (a política de semeadura deve
  ser por tenant com prova de cobertura, ou a ausência deve falhar alto).
- **Lacuna de cobertura de escore**: SOFA e qSOFA são pontuados e roteados
  para o engine (`vitals.py:400-408`) sem limiares semeados —
  não-disparo estruturalmente silencioso (engine-review F2.2). Sob o
  Sepsis-3 (Singer M, et al. "The Third International Consensus
  Definitions for Sepsis and Septic Shock (Sepsis-3)." JAMA
  2016;315(8):801-810. DOI 10.1001/jama.2016.0287), uma mudança aguda de
  SOFA >= 2 define disfunção orgânica — o escore com a definição de
  consenso mais forte é o que nunca consegue alertar.

**Veredito (0038):** mecanismo de semeadura (idempotente, anotado com
evidência) **REFINE**; os seis valores **VALIDATE** (linhas 3/5/6) /
**REJECT como semeados** (linhas 1/2/4 — re-derivar com dono clínico); as
lacunas de cobertura de tenant e de escore **REJECT**.
PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).

## 4. Conjuntos de limiares hardcoded que sombreiam a configuração (INPUT TO ADR-0007)

### 4.1 Limiares de fallback do `dashboard.py`

OBSERVED (`src/intensicare/services/dashboard.py:33-47`): constantes de
módulo `NEWS2_HIGH_RISK_THRESHOLD = 7`, `NEWS2_MEDIUM_RISK_THRESHOLD = 5`
(consistentes com RCP NEWS2 2017), e `FALLBACK_THRESHOLDS` duplicando os
valores da 0038 (MEWS 3/4/5, NEWS2 3/5/7) "so severity derivation never
breaks due to missing configuration" (`:41-47,55-59`). Os mesmos seis
valores, a mesma revisão de §3.1 — mas como uma **cópia-sombra em código**
que substitui silenciosamente a configuração ausente e lê apenas o tenant
`default` (`:37-39,67-72`), independentemente do tenant real do paciente. O
config-shadowing significa que uma mudança do operador em
`threshold_config` para um tenant não-default nunca afetará a coloração de
leitos, e apagar linhas de configuração reverte silenciosamente para
constantes de código. **Veredito: REJECT** (constantes-sombra; fonte única
de verdade é exigida). **INPUT TO ADR-0007.**

### 4.2 Limiares vitais de fallback e faixas de SOFA do `reference_ranges.py`

OBSERVED (`src/intensicare/api/reference_ranges.py:23-84`), servido ao hook
de limiar do frontend (`:87-117`):

**24 valores de limite de sinal vital** (seis vitais, quatro limites cada,
`:23-72`), o comentário de cabeçalho alega "medical literature" **sem
nenhuma citação em nenhum lugar** — todos os 24 **UNCITED**. Comparações
cruzadas com as faixas fisiológicas do RCP NEWS2 2017 (onde comparável)
mostram discrepâncias que este revisor sinaliza para o dono clínico
(re-verificar contra o gráfico impresso do NEWS2):

| Vital | Limite da V1 | Comparação com faixa de scoring do NEWS2 2017 | Nota |
|---|---|---|---|
| respiratory_rate high_critical = 35 | NEWS2 pontua 3 pontos em FR >= 25 | A V1 sinaliza "crítico" apenas 10 incursões acima da faixa vermelha do NEWS2 |
| spo2 low_critical = 88 | NEWS2 (escala 1) pontua 3 em <= 91 | A faixa crítica da V1 começa 3 pontos mais baixo |
| heart_rate high_critical = 130 | NEWS2 pontua 3 em >= 131 | off-by-one, provavelmente benigno, ainda assim uncited |
| temperature low_critical = 35 | NEWS2 pontua 3 em <= 35.0 | consistente, uncited |
| spo2 high_warn = 100 = high_critical | não é um conceito do NEWS2 | incoerente: saturação de 100 é simultaneamente warn e critical |

**Faixas de exibição de SOFA** (`:74-84`): normal 0-6, watch 7-9, urgent
10-12, critical 13-24. **UNCITED e clinicamente indefensável**: sob o
Sepsis-3 (Singer 2016, acima), uma mudança aguda de SOFA >= 2 sinaliza
disfunção orgânica com mortalidade apreciável; a descrição original do
escore (Vincent JL, et al. "The SOFA (Sepsis-related Organ Failure
Assessment) score to describe organ dysfunction/failure." Intensive Care
Med 1996;22(7):707-710. DOI 10.1007/BF01709751) define graus 0-4 por órgão
e nenhuma alegação de "normal até 6". Um SOFA total de 6 renderizado como
"normal" verde é falsa tranquilidade por construção (classe HAZ-0005, camada
de exibição).

**Defeito de formato**: quando linhas de configuração EXISTEM, o endpoint
mapeia configurações de escore para o formato de vitais —
`vital_name = score_type`, `high_warn = watch_threshold`,
`high_critical = critical_threshold`, unidade vazia (`:102-115`) — ou seja,
limiares de alerta de MEWS/NEWS2 se disfarçam de faixas de referência vital,
e o limiar urgent é descartado.

**Veredito: REJECT** (o endpoint, ambas as tabelas de fallback, e o
mapeamento). Faixas de referência para a V2 são conteúdo clínico novo sob a
decisão sucessora da ADR-0014 (ver §6), não uma importação.
PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).

### 4.3 Constantes clínicas do motor de correlação

OBSERVED (`src/intensicare/services/correlation_engine.py:60-102,165-415`).
Cortes com suas âncoras publicadas (todos VALIDATION REQUIRED — re-verificar
contra fontes impressas):

| Constante | Valor | Autoridade publicada | Concordância |
|---|---|---|---|
| Prolongamento de QTc | > 500 ms | Drew BJ, et al. "Prevention of Torsade de Pointes in Hospital Settings." AHA/ACCF scientific statement. Circulation 2010;121(8):1047-1060 — QTc >= 500 ms marcado como risco | consistente |
| Hipocalemia | K < 3,5 mmol/L | limite inferior de referência convencional para potássio sérico (intervalo de referência laboratorial amplamente publicado; nenhum ensaio primário único) | consistente; citar uma referência de medicina laboratorial nomeada na ratificação |
| Hipomagnesemia | Mg < 0,7 mmol/L | limite inferior de referência convencional para magnésio sérico | consistente; mesma nota |
| SDRA moderada/grave | P/F <= 200 | ARDS Definition Task Force (Ranieri VM, et al.) "Acute Respiratory Distress Syndrome: The Berlin Definition." JAMA 2012;307(23):2526-2533. DOI 10.1001/jama.2012.5669 — SDRA moderada: P/F <= 200 | consistente |
| Substituto S/F | <= 235 | Rice TW, et al. "Comparison of the SpO2/FiO2 ratio and the PaO2/FiO2 ratio in patients with acute lung injury or ARDS." Chest 2007;132(2):410-417 — S/F 235 corresponde a P/F 200 | consistente |
| Choque | PAM < 65 mmHg + dose de vasopressor > 0 | Sepsis-3 (Singer 2016, acima): choque séptico inclui necessidade de vasopressor para manter PAM >= 65 mmHg | consistente |
| Membro de AKI | estágio KDIGO >= 1 | KDIGO Clinical Practice Guideline for Acute Kidney Injury. Kidney Int Suppl 2012;2(1):1-138 | consistente |
| Janela de junção SA-AKI | 72 h | definições de consenso SA-AKI (grupo de trabalho ADQI 28, Zarbock A, et al., Nat Rev Nephrol 2023;19(6):401-417) usam AKI dentro de 7 dias de sepse | **mais estreita que o consenso — UNCITED como escolha de 72 h** |
| Janela resp+hemo | 6 h; janela de QTc 24 h | nenhuma encontrada | **UNCITED** (escolhas de design) |
| Janelas de redundância de exame | 5 classes, 120-720 h | nenhuma encontrada (política de stewardship) | **UNCITED** |
| Orçamentos de PPV | piso de frota 0,60; por regra 0,60-0,85 | nenhuma (metas de produto) | **UNCITED** (metas declaradas, sem evidência) |

**Veredito: VALIDATE** (cortes majoritariamente bem ancorados; janelas e
semântica de supressão/amplificação exigem validação clínica; todo valor
UNCITED precisa de uma decisão de dono).
PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).

## 5. Contexto da ADR-0014 legada

`docs/adr/0014-no-abnormal-value-threshold-flagging.md` (hash-and-note em
`README.md`; superada pela ADR-0019 legada) documenta que as telas clínicas
da V1 não renderizavam **nenhuma codificação de severidade orientada a
valor** (uma SpO2 de 99 e de 60 renderizavam identicamente) e recomenda um
serviço de faixas de referência centralizado pendente de ratificação
clínica. Duas implicações para esta revisão: (a) o endpoint
`reference_ranges.py` revisado em §4.2 é a tentativa parcial e uncited
dessa recomendação — confirmando que as faixas nunca receberam a
ratificação que a própria ADR exigia; (b) a análise de "opções consideradas"
da ADR (limiares ad-hoc por tela rejeitados porque sistemas de severidade
anteriores foram "reinvented 6-plus times with divergent literals") é
precisamente o modo de falha encontrado ao vivo em §2 e §4.1 — três cópias
da semântica de limiar. Classificação da própria ADR: **referência
grau-ARCHIVE** (mantida como contexto; nada a importar).

## 6. Contagens consolidadas de valores semeados (para o retorno do ciclo-1)

- Migração 0038: **6 valores revisados — 3 consistentes com fontes
  primárias citadas (pendente re-verificação), 3 UNCITED/discrepantes
  (MEWS watch=3 UNCITED; MEWS urgent=4 UNCITED-como-atribuído; NEWS2
  watch=3 agregado com erro de dimensão).**
- Conjunto-sombra do `dashboard.py`: os mesmos 6 valores (duplicatas), mais
  2 constantes de risco NEWS2 (5, 7 — consistentes com RCP 2017).
- `reference_ranges.py`: **24 valores de limite vital, todos UNCITED** (5
  deles adicionalmente discrepantes ou incoerentes conforme §4.2);
  **conjunto de faixas de SOFA (4 faixas / 8 valores de borda) UNCITED e
  contradizendo o Sepsis-3.**
- Motor de correlação: **7 cortes clínicos consistentes com fontes
  primárias citáveis; 10 valores de janela/orçamento UNCITED.**

Total de valores de limiar clínico examinados neste registro: **57** (6
seed + 8 sombra + 24 vitais + 8 bordas de SOFA + 11 valores de correlação e
janela/orçamento contados individualmente onde clinicamente load-bearing).

Todos os vereditos: PROPOSAL — AWAITING NAMED CLINICAL REVIEW
(reviewer: rodaquino-OMNI).
