---
id: LEGREV-ALTB-ENGINE
title: Revisão legada — engine de alerta da V1, derivação de severidade de leito, precedência e lógica de supressão
label: PROPOSAL
status: PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI)
statement: >
  Revisão source-verified do engine de geração de alertas da V1, a derivação
  com piso-para-normal da severidade de leito, o modelo de severidade/cor, a
  família de precedência assistido, as janelas de
  cooldown/deduplicação/agrupamento, o motor de correlação, o compilador de
  alertas, e o worker de notificação, com vereditos por artefato sob
  docs/00-governance/legacy-import-policy.md.
provenance:
  source_repo: intensicare (legado V1, READ-ONLY)
  path_or_url: src/intensicare/ (services, models, schemas, api)
  commit_sha_or_version: 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79 (HEAD no pin; SHA-256 por arquivo na seção 0)
  section_or_lines: citado por achado como path:linhas
  date_collected: 2026-08-15
  last_updated: 2026-08-15
  collector: rodaquino-OMNI (revisor forense do motor de alerta e limiar legado, ciclo 1 Tarefa 1)
  transformation: >
    traduzido EN→pt-BR, tranche 3, GDEC-0008 item 8 (lido a partir da fonte;
    citado ou resumido com fidelidade; analisado contra o hazard log da V2 e
    a semântica de status de avaliação)
  confidence: alta (citações) / média (avaliações clínicas)
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  hazards: [HAZ-0005, HAZ-0015, HAZ-0016, HAZ-0017, HAZ-0021, HAZ-0022, HAZ-0036]
  adrs: []
  pr: null
supersedes: null
superseded_by: null
---

> Traduzido EN→pt-BR em 2026-08-16 (GDEC-0008 item 8, tranche 3); original EN preservado no histórico git.

# Engine de alerta e derivação de severidade da V1 — revisão forense

> **PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).**
> Vocabulário de veredito conforme
> `docs/00-governance/legacy-import-policy.md` §4. Nada aqui é importado.
> Todo veredito é uma proposta à autoridade clínica nomeada; nenhum é
> autoexecutável.

## 0. Arquivos citados e integridade

Todos os caminhos relativos a `https://github.com/Omni-Saude/intensicare`. OBSERVED
2026-08-15: todo SHA-256 abaixo corresponde a
`docs/archive/legacy-provenance/legacy-pin-cycle-1.md`.

```text
80980e3966626480a95af4ebe4ba379794dd4b74eaa99fb455923c2530df20ee  src/intensicare/services/alert_engine.py
ae60425f025bc7387c720dfe2c35fa89b0c2e053d33e2ad81d78828a68ac1489  src/intensicare/services/dashboard.py
122806b0dc39da514952f152bdfcf8fa296a7e684f41607fb2620dfd95baabb9  src/intensicare/services/domain_alertas.py
9f383ab935f3e90e796e81473d158354736c95d0550ad0f2020ee0d8a4a4066f  src/intensicare/schemas/severity.py
80001a3664c84b746aa43068864a3dd1f01c2aee9e01d13c4dfa1f276ab8bb96  src/intensicare/services/correlation_engine.py
a3d2223155e817d7463d4cefed29da98a9ca994d464f3fdb53cec117417b8a8a  src/intensicare/services/alert_compiler.py
5eec634394d5d146eb26849bcd63d91631197385b1764eed9434bf024f3da158  src/intensicare/services/alert_copy.py
0b8d7293e23b476399f30b59192536ed8fa156bac7ecc95a48ca73de887e0976  src/intensicare/services/notification_worker.py
7bcde809fab96bd09f57061df37d1715ae4b40ccea772d1a6fa0b66d1396f3e1  src/intensicare/services/altb_trigger.py
9ad826e9e31be584a17285a721697243e8654d9209ca68b9abec1230ed3c7fe6  src/intensicare/services/ews_nrt_runner.py
dcd1e76e7086106e659dce52e59a374350d8a4a662b63d9959a562dbf32eff64  src/intensicare/services/vitals.py
c86cde30ad675cde0cddd632a3a74f40c4d95bab013fd0abeb51880a8aff2f88  src/intensicare/models/alert.py
6eeb4024842c4e2332bb643cc048b0a69759664a2d3e9a49982de2a3d63588f7  src/intensicare/models/alert_definition_version.py
2a7ff1e52ce5d28259e06b705df2485e15353fad82812cded1af878546966e5e  src/intensicare/models/algorithm_registry.py
ef93899feeede67132e45ea7c7670045fc0044ab53be14a612b60c794db07385  src/intensicare/models/correlation_event.py
c23243f811fdd81c004f219e84f8c3154b4f73444dab149376ffb023854bd309  src/intensicare/schemas/alerts.py
46d6b5042ac6acb76bfe01068f614e87a5c3bd7ececa4e3123ea8c2b35a3c939  src/intensicare/api/v1/alerts.py
```

Hash-and-note (ausente do manifesto — registrado em `README.md`
§hash-and-note): `docs/plan/_work/alerts/early-warning-scores.yaml`,
`docs/plan/_work/alerts/correlation-engine.yaml`.

---

## 1. FINDING 1 — piso-para-normal da severidade de leito (candidate-inventory 1.1g; HAZ-0005)

### 1.1 O mecanismo, localizado

OBSERVED (`src/intensicare/services/dashboard.py:93-115`):

```python
def derive_bed_severity(
    alert_severity: str | None,
    pathway_severities: list[str | None] | None,
    mews: int | None,
    news2: int | None,
    thresholds: dict[str, tuple[int, int, int]],
) -> str:
    """Derive a bed's clinical severity — never null. ..."""
    candidates: list[str | None] = [alert_severity]
    if pathway_severities:
        candidates.extend(pathway_severities)
    candidates.append(_score_band_severity(mews, thresholds.get("MEWS")))
    candidates.append(_score_band_severity(news2, thresholds.get("NEWS2")))

    derived = max_severity(*candidates)
    return derived or SeverityLevel.NORMAL.value
```

O piso é a linha final (`dashboard.py:115`). Coerções de apoio:

- `_score_band_severity` (`dashboard.py:79-90`) retorna `None` quando o
  escore é `None`; `max_severity` sobre tudo-`None` retorna `None`
  (`src/intensicare/schemas/severity.py:176-182`, `:150-173`); a linha 115
  então converte esse `None` — "nada foi avaliado" — na string `"normal"`.
- As severidades de pathway são coagidas individualmente:
  `"severity": pp.severity or "normal"` (`dashboard.py:353`) — uma pathway
  com severidade nula é apresentada como `normal` antes da agregação.
- O próprio comentário do módulo declara a intenção (`dashboard.py:100-107`):
  "Floor is 'normal': a bed with no alerts, no active pathways, and no
  scores is still 'normal', not null — fixes beds silently disappearing
  from severity views" (citação mantida em inglês, texto literal do
  comentário de código).

### 1.2 Rastreamento ponta a ponta: escore ausente até o estado de leito exibido

1. Um paciente não tem linhas `ClinicalScore` (ou nenhuma para MEWS/NEWS2):
   as subconsultas de função de janela (`dashboard.py:209-265`) não
   retornam nenhuma linha para aquele `mpi_id`, então
   `mews_map.get(p.mpi_id)` é `None` (`dashboard.py:317`).
2. Nenhum alerta ativo: `alert_severities.get(p.mpi_id)` é `None`
   (`dashboard.py:333`).
3. Nenhuma pathway ativa: `active_pathways` é `[]` (`dashboard.py:346-355`).
4. `derive_bed_severity(None, [], None, None, thresholds)` →
   `max_severity(None, None, None)` → `None` → piso em `"normal"`
   (`dashboard.py:360-366`, `:115`).
5. `PatientBedSummary.severity = "normal"` (`dashboard.py:402`); a
   renderização de codificação tripla para `normal` é um círculo verde
   rotulado "Normal" com descrição "Sem alerta ativo"
   (`src/intensicare/schemas/severity.py:79-85`).

Resultado: **um paciente que nunca foi avaliado é exibido exatamente como
um paciente avaliado e considerado bem.** Esta é a confirmação concreta em
nível de código do item 1.1g do candidate-inventory e da classe de
mecanismo do HAZ-0005 (E1 ocorrido-no-predecessor). Também interage com o
defeito upstream registrado no hazard log: scorers que tratam entradas
ausentes como zero produzem um escore baixo, que esta função então
classifica em faixa como `normal` com total confiança.

### 1.3 Análise de discrepância

- **Semântica de dado ausente**: o objetivo de design ("never null") é
  resolvido na direção errada — o sistema de tipos é forçado a responder
  com uma severidade quando a resposta honesta é "não avaliado".
  `docs/05-clinical-safety/evaluation-status-semantics.md` §3.3 e a
  proibição P-1/P-2 da V2 tornam esse estado não representável.
- **População**: o mesmo piso se aplica a todo leito independentemente de
  o paciente estar na população aprovada (adjacência ao HAZ-0036).
- **Agregação**: `critical_count` (`dashboard.py:367-368`) conta apenas o
  `critical` derivado; uma unidade de 20 leitos não avaliados reporta zero
  crítico e zero qualquer-outra-coisa — tranquilidade máxima a partir de
  zero informação (P-3, P-8).

### 1.4 Veredito — padrão de piso-para-normal

**REJECT** (o padrão inteiro: o piso `or "normal"` em `dashboard.py:115`,
a coerção `pp.severity or "normal"` em `dashboard.py:353`, e a ausência de
qualquer estado não-avaliado em `PatientBedSummary`). A exigência legítima
enterrada nele — "um leito nunca deve desaparecer silenciosamente da
visão de severidade" — já é superada pelo estado `not_evaluated` da V2,
que mantém o leito visível com um rótulo honesto (SAF-0006). Racional:
este é o modo de falha que de fato ocorreu no predecessor (HAZ-0005, E1).
PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).

---

## 2. Engine de geração de alerta (`alert_engine.py`)

### 2.1 Lógica implementada (resumo verbatim, citado)

`check_score_against_thresholds`
(`src/intensicare/services/alert_engine.py:20-131`):

1. Busca de limiar — sua **própria** resolução de dois níveis (unidade,
   depois tenant-global), linhas 32-44. **Não** chama
   `threshold_resolver.resolve_threshold` (ver `thresholds-seed-review.md`
   §2) e **não tem nível de leito**.
2. `config is None` → `return None` (linhas 46-48). Nenhum registro do
   não-disparo.
3. Classificação de severidade (linhas 50-62): `score >=
   critical_threshold` → `critical`; `>= urgent_threshold` → `urgent`;
   `>= watch_threshold` → `watch`; abaixo de `watch` → `None` →
   `return None`.
4. Limite de taxa (linhas 68-75): chave Redis por `mpi_id + score_type`;
   `config.rate_limit_per_hour or 10` (fallback hardcoded de 10/h); no
   limite → `return None`. Sem registro.
5. Cooldown (linhas 77-83): apenas se `config.cooldown_minutes` for
   truthy; chave Redis por `mpi_id + score_type + severity`; em cooldown →
   `return None`. Sem registro.
6. Criação de alerta (linhas 93-110): título/corpo de `build_alert_copy`;
   `Alert(..., severity, status="active", ...)`. **`definition_version_id`
   nunca é definido**, embora a coluna e a tabela
   `alert_definition_version` existam (`src/intensicare/models/alert.py:36-40`,
   `src/intensicare/models/alert_definition_version.py:12-30`).
7. Contador de limite de taxa + chave de cooldown definida (linhas
   112-121; janela de 1 hora, TTL de cooldown `cooldown_minutes * 60`).
8. Publicação WebSocket de melhor-esforço (linhas 123-172): a falha é
   logada e engolida — gerado, mas possivelmente nunca exibido (HAZ-0015).

`process_clinical_score` (linhas 175-192): falha no cache de paciente →
`return None` (linhas 184-185) — **nenhum tenant, nenhum alerta, nenhum
registro**.

Fiação (OBSERVED `src/intensicare/services/vitals.py:388-408`): os
escores MEWS, NEWS2, SOFA e qSOFA são todos roteados por
`process_clinical_score` em toda ingestão de vitais.

### 2.2 Achados

- **F2.1 (HAZ-0021 — não-disparo silencioso, quatro caminhos).**
  Configuração ausente, abaixo de watch, limitado por taxa, e em
  cooldown, e falha de cache de paciente todos retornam `None` sem
  motivo persistido. Um não-disparo é indistinguível de uma avaliação
  negativa.
- **F2.2 (HAZ-0021/HAZ-0005).** SOFA e qSOFA são pontuados e checados,
  mas a migração 0038 semeia limiares apenas para MEWS e NEWS2
  (`alembic/versions/0038_seed_default_threshold_config.py:48-71`), então
  sob configuração padrão **SOFA/qSOFA nunca conseguem alertar**,
  silenciosamente, em todo paciente (caminho 2.1 passo 2).
- **F2.3 (defeito).** A consulta de nível de unidade (linhas 38-40)
  filtra `unit == unit`, mas não `bed_id IS NULL`. Se existem tanto uma
  linha de nível-unidade quanto uma de nível-leito para o mesmo
  tenant/unidade/score_type, `scalar_one_or_none()` dispara
  `MultipleResultsFound` — o caminho de scoring dispara exceção em vez de
  alertar; se apenas uma linha de nível-leito existe para aquela unidade,
  ela é silenciosamente mal aplicada em toda a unidade.
- **F2.4 (opacidade de versão, adjacente ao HAZ-0036).** Os alertas não
  carregam nenhuma versão de regra (`definition_version_id` nunca
  carimbado), então a lógica exata que produziu um dado alerta não pode
  ser reconstruída. As tabelas de registro (`alert_definition_version`,
  `algorithm_registry`) existem, mas o caminho em produção as contorna.
- **F2.5 (segundo caminho de criação, sem disciplina).**
  `ews_nrt_runner.py` constrói `Alert()` diretamente, contornando
  cooldown/limite-de-taxa, com um aviso explícito de fiação no código
  (`src/intensicare/services/ews_nrt_runner.py:656-670`). Dois engines,
  duas disciplinas (classe HAZ-0016/HAZ-0020).

### 2.3 Veredito — engine de alerta

**TRANSFORM.** O conceito — limiares configurados por escopo, avaliados
na escrita do escore, com faixas de severidade e controles de carga —
segue adiante; a implementação não: supressão silenciosa (F2.1), lacunas
de cobertura que desabilitam escores silenciosamente (F2.2), o defeito de
resolução (F2.3), a opacidade de versão (F2.4), e o caminho de criação
duplicado (F2.5) desqualificam cada um para RETAIN/REFINE. A V2 exige:
motivos de não-disparo persistidos (SAF-0019), um único serviço de
resolução, uma versão de regra carimbada em todo alerta, e um único
caminho de criação.
PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).

---

## 3. FINDING 2 — precedência e rollup de assistido (leito, setor, dashboard)

Fontes: `docs/rules/alert-threshold/` RULE-ALERTAS-005..011, 027-029,
RULE-TRILHAS-ENGINE-004, RULE-INDICADORES-ETL-001/002/006 (todos hasheados
no manifesto; os registros de regra citam os repositórios upstream
auditados em seus próprios commits fixados) e
`src/intensicare/services/domain_alertas.py` (reimplementações ratificadas
da RULE-ALERTAS-001/002).

### 3.1 A cadeia de precedência conforme implementada

- **Cor do leito**: pior cor de pathway com precedência
  vermelho-domina (RULE-ALERTAS-005/006; LARANJA — sepse interativa —
  supera todos em leitos automáticos conforme 006).
- **Override de atendido (o passo de mascaramento)**: se
  `assistido === true`, a chave de status renderizada é `ASSISTIDO`
  (azul) **independentemente do valor do alerta** — borda, fundo, cor da
  bolinha, cor do ícone de gênero — em nível de card de paciente/leito e
  em nível de chip de trilha (RULE-ALERTAS-011, duplicada verbatim em
  dois componentes; RULE-TRILHAS-ENGINE-004 repete na aba de pathway).
- **Determinação de atendimento**: um leito só é atendido se toda pathway
  não-NEUTRA estiver atendida; um leito todo-NEUTRO *não* é atendido
  (RULE-ALERTAS-009).
- **Canal paralelo não mascarado**: `alerta_nao_assistido` mantém a pior
  cor por leito ignorando o atendimento (RULE-ALERTAS-007/008) e
  alimenta o KPI de setor `total_alertas` (RULE-ALERTAS-028).
- **Card de setor**: ASSISTIDO tem prioridade máxima; caso contrário, a
  cor de **maior contagem** vence, não a de maior severidade
  (RULE-INDICADORES-ETL-006); a 100% de atendimento, o card inteiro vira
  ASSISTIDO (RULE-INDICADORES-ETL-002).
- **Contagens de setor com dado ausente**: `aggregate_alert_counts`
  (`src/intensicare/services/domain_alertas.py:87-112`) conta uma
  movimentacao cujos quatro alertas de pathway são **todos `None`** como
  `NEUTRO` (`_worst_alert_color`, linhas 75-84: qualquer coisa que não
  seja VERMELHO/AMARELO — incluindo tudo-ausente — retorna NEUTRO). A
  ausência se torna "sem alerta" no denominador do setor (HAZ-0005 em
  nível de rollup).

### 3.2 Avaliação de segurança clínica — o atendimento pode mascarar a severidade?

**Sim, no canal visual primário.** Uma vez que um clínico marca uma
pathway como atendida, o estado vermelho/âmbar desaparece do card, chip e
aba e é substituído por azul; a 100% de atendimento, o card inteiro de um
setor deixa de mostrar severidade. "Atendido" é um reconhecimento de
ciência, não evidência de resolução: um paciente pode estar atendido e
ainda em deterioração, e o canal de cor agora sub-reporta exatamente os
pacientes já sabidamente mais graves. Mitigações existem, mas são
secundárias: `alerta_nao_assistido` preserva a severidade não mascarada
nos KPIs de setor (007/008/028), e os buckets de contagem mantêm uma
apuração de VERMELHO. Dois defeitos agravantes: (a) o card de setor
resolve empates por **contagem**, então um leito vermelho entre cinco
leitos âmbar mostra âmbar (RULE-INDICADORES-ETL-006) — um agregado mais
tranquilizador que seu pior membro (viola a proibição P-3 da V2); (b)
quando nem atendido nem alertado, a chave de status é a string vazia e
**nenhuma** borda/fundo é renderizada de forma alguma (caso de borda da
RULE-ALERTAS-011) — não-avaliado é renderizado como ausência-de-sinal
(HAZ-0005 novamente).

### 3.3 Veredito — família de precedência assistido

**REJECT** a precedência de override (ASSISTIDO substituindo a cor de
severidade: comportamento de flip da RULE-ALERTAS-011,
RULE-TRILHAS-ENGINE-004, RULE-INDICADORES-ETL-002/006) e o desempate de
setor baseado em contagem. **TRANSFORM** os conceitos subjacentes que são
sólidos: (i) o estado de reconhecimento deve ser visível *ao lado de* —
nunca em vez de — a severidade; (ii) um canal de severidade que ignora o
atendimento (a ideia do `alerta_nao_assistido`) é o invariante correto e
deve se tornar o canal primário, não o fallback; (iii) o rollup de
maior-severidade-vence (já presente no próprio `schemas/severity.py:150-182`
mais novo da V1, "P0-10 highest-severity-wins, never last-writer-wins") é
a agregação correta e contradiz o card baseado em contagem do frontend
mais antigo — evidência que a própria V1 identificou o defeito.
PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).

---

## 4. FINDING 3 — janelas de cooldown / deduplicação / agrupamento

### 4.1 Valores encontrados (todos OBSERVED, citados)

| Mecanismo | Valor | Fonte |
|---|---|---|
| Cooldown por severidade | coluna de configuração `cooldown_minutes`; pulada inteiramente quando NULL/0; a semeadura 0038 a deixa NULL | `alert_engine.py:77-83,116-120`; `0038_seed...py:48-71` |
| Limite de taxa | coluna de configuração `rate_limit_per_hour`; fallback hardcoded **10/h** por paciente+escore; janela Redis de 1 hora | `alert_engine.py:68-75,112-115` |
| Padrões do resolvedor (dataclass, não usado pelo caminho em produção) | watch/urgent/critical 0; taxa 10/h; cooldown 5 min | `threshold_resolver.py:17-35` |
| Deduplicação de notificação | TTL de `dedup_key` **300 s** (5 min) | `notification_worker.py:41-42,108-125` |
| Retry de notificação | backoff 1,2,4,8,16,32 s; máx 6 tentativas; depois DLQ + alerta operacional | `notification_worker.py:30-32,190-213` |
| Supressão do catálogo declarativo | cooldown PT4H / PT6H / PT12H; limites de taxa 2-3 por 24 h por paciente; `dedup_key: patient_id+alert_id` | `docs/plan/_work/alerts/early-warning-scores.yaml` (hash-and-note) |
| Janelas de junção de correlação | SA-AKI 72 h; resp+hemo 6 h; QTc+eletrólito 24 h; redundância de exame por classe 120-720 h | `correlation_engine.py:60-74` |
| Agrupamento em tempo de leitura | agrupado por (mpi_id, score_type); zero perda de informação; a flag `escalating` atravessa o rollup | `api/v1/alerts.py:172-254`; `schemas/alerts.py:40-67` |
| Deduplicação por diff-de-conteúdo enquanto vermelho | renotifica apenas quando o conteúdo vermelho muda | RULE-ALERTAS-016 (`docs/rules/alert-threshold/`) |

### 4.2 Defensabilidade clínica

- A **configuração semeada não tem nenhum cooldown**: (a 0038 deixa
  `cooldown_minutes` NULL, então `alert_engine.py:78` pula o bloco): a
  proteção contra fadiga de alarme em produção repousa unicamente no
  limite de taxa de 10/h — e esse limite então **descarta silenciosamente
  o 11º alerta da hora sem registro** (HAZ-0016 vs HAZ-0022 trocados às
  cegas).
- O cooldown tem chave por severidade, então o escalonamento para uma
  severidade maior nunca é bloqueado pelo cooldown de uma faixa menor —
  esta parte é clinicamente correta.
- A re-deterioração de mesma severidade dentro de uma janela de cooldown
  é indistinguível de silêncio; não existe artefato de "alerta
  suprimido", nenhum temporizador de escalonamento, e nenhuma auditoria
  de supressão (HAZ-0022, SAF-0022).
- As janelas do catálogo declarativo (PT4H-PT12H, 2-3 por 24 h) são
  orçamentos de carga plausíveis, mas são **aplicadas em lugar nenhum**:
  o compilador que os carrega não realiza nenhuma supressão (seção 6), e
  o engine em produção lê apenas `threshold_config`. Existem dois
  vocabulários de supressão desconexos.
- A deduplicação de notificação (5 min) fica *abaixo* da camada de
  alerting e pode consumir uma segunda notificação legítima para um
  alerta genuinamente novo se o chamador reutilizar uma chave de dedup; a
  supressão é logada, mas não exposta clinicamente.
- A flag `escalating` no agrupamento em tempo de leitura
  (`schemas/alerts.py:48-56`) é um controle genuinamente bom: membros
  reconhecidos nunca a suprimem, e ela é computada apenas entre membros
  ainda ativos.

### 4.3 Veredito — cooldown/dedup/agrupamento

**VALIDATE** os valores de janela (sem cooldown por padrão, 10/h, dedup
de 5 min, PT4H-PT12H, 2-3 por 24 h): o trade-off entre
re-deterioração-perdida vs. fadiga-de-alarme é um julgamento clínico que
nenhum artefato de engenharia aqui evidencia; todo valor deve ser
definido (ou confirmado) pelo dono clínico com racional registrado.
**REJECT** a supressão silenciosa sem um registro persistido e
codificado por motivo (todos os caminhos de supressão nas linhas 1-2 e 5
de 4.1). **REFINE** o agrupamento em tempo de leitura da ADR-0039 com o
override `escalating` — o único artefato desta família projetado com
raciocínio explícito de zero-perda-de-informação.
PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).

---

## 5. FINDING 4 — modelo de severidade e mapeamento de cor

### 5.1 Conforme implementado

- Severidade ordinal canônica `normal < watch < urgent < critical` com
  ranks inteiros, vocabulário CHECK de BD, e agregação
  maior-severidade-vence (`src/intensicare/schemas/severity.py:15-67,150-182`).
- **Codificação tripla** — cor + ícone + forma + rótulo pt-BR + descrição
  por nível (`severity.py:70-147`), explicitamente para acessibilidade
  ("não-apenas-cor").
- O mapeamento de cor por contagem-de-critérios existe na *camada de
  regra legada*, não no engine Python da V1: contagem de critérios
  disparados mapeada para VERMELHO/AMARELO/NEUTRO por pathway
  (RULE-ALERTAS-001/003/004; reimplementada como utilitários ratificados
  em `domain_alertas.py:35-57`).

### 5.2 Avaliação

- O modelo do lado Python **é** clinicamente ordinal e não-apenas-cor
  (rank + ícone + forma + rótulo). Este é o artefato mais forte da
  revisão.
- Defeitos: (a) `normal` é um membro do enum de severidade, então "sem
  preocupação" e "não avaliado" colapsam em um único valor representável
  — a raiz em nível de tipo da Finding 1; (b) o mapeamento `p10_score`
  (0/3/7/10, `severity.py:58-64`) é uma escala mágica não citada; (c) o
  vocabulário de cor legado (VERMELHO/AMARELO/NEUTRO + caso especial
  LARANJA + ASSISTIDO) é apenas-cor, inconsistente entre superfícies (um
  quarto balde LARANJA existe em exatamente um tipo de frontend —
  RULE-INDICADORES-ETL-007), e derivado-de-contagem em vez de
  derivado-de-severidade em alguns pontos (seção 3.2).

### 5.3 Veredito

**REFINE** o modelo ordinal canônico + codificação tripla +
maior-severidade-vence (importação do *conceito* com mudanças V2:
remover `normal` do conjunto alertável, adicionar estados explícitos de
status de avaliação, evidenciar as escolhas de codificação, descartar
`p10_score` ou evidenciá-lo). **REJECT** o mecanismo
contagem-de-critérios → cor (ausência conta como zero → a contagem
subestima a severidade; HAZ-0005) e o vocabulário apenas-cor
VERMELHO/AMARELO/NEUTRO/LARANJA.
PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).

---

## 6. Motor de correlação, compilador, copy, worker de notificação (artefatos secundários)

### 6.1 Motor de correlação (`correlation_engine.py`)

Quatro regras entre domínios; membros dobrados ("member_suppressed") em
um único alerta mais rico; a cadeia de QTc amplifica dois membros em
nível watch para crítico (linhas 41-102, 165-415). Entradas ausentes são
*registradas* no resultado (`missing_inputs`, linhas 182-217 etc.) —
melhor que o engine principal — mas um resultado
não-disparado-porque-não-avaliável ainda é `fired=False` sem um status de
avaliação distinto, e `emit_correlation_event` retorna `None` para
qualquer resultado não disparado (linhas 608-620). A revisão de corte
está em `thresholds-seed-review.md` §5. A supressão de membro é um item
de revisão clínica: dobrar ALERT-ELY-POTASSIUM-01 em uma correlação não
deve esconder o alerta de eletrólito de workflows que o assinam
(HAZ-0022). **Veredito: VALIDATE** (conceito plausível e majoritariamente
ancorado em evidência; a semântica e as janelas de supressão exigem
validação clínica).

### 6.2 Compilador de alerta (`alert_compiler.py`) — candidate-inventory 1.1h confirmado

- Parseia lógica de gatilho clínico **com expressões regulares** sobre
  strings de `logic` em texto livre (BAND_PATTERN/FACADE_PATTERN, linhas
  115-137) e embarca gates A/B/C sobre os resultados do parse.
- `evaluate_alert_definition` (linhas 374-414) não avalia a regra de
  forma alguma: ele busca o **vetor de teste mais correspondente** e
  retorna o resultado esperado desse vetor — o oráculo de teste é a
  implementação. Entradas vazias → `False` (linhas 392-394); alerta
  desconhecido → `False`.
- OBSERVED 2026-08-15: `grep -l alert_groups docs/plan/_work/alerts/*.yaml`
  não corresponde a **nenhuma das nove** YAMLs de domínio — o passe "all
  zero" do gate de cobertura não valida nada (candidate-inventory 1.1h,
  "false-green gate"; classe HAZ-0031).

**Veredito: REJECT** (lógica clínica parseada por regex, avaliador
circular, gate false-green). O *objetivo* — verificação em tempo de
build de que limiares renderizados igualam predicados avaliados (a
intenção do Gate C) — é sólido e deve ser reconstruído sobre um AST real
na V2.

### 6.3 Copy clínico (`alert_copy.py`)

Explicação centralizada em pt-BR de 3 partes; tipos de escore
desconhecidos recebem um fallback genérico deliberadamente não
comprometedor (linhas 117-131) — seguro por construção. Defeito: as
cláusulas "por que importa" hardcodam alegações de diretriz ("NEWS2
entre 5 e 6", linhas 85-115) enquanto os limiares são configuráveis pelo
operador — um override do operador dessincroniza a redação da regra de
disparo (divergência facade/predicado em prosa). Severidade não
reconhecida recai para o copy *menos* severo (linhas 173-201) —
subcomunicação em um descasamento de modelo. **Veredito: VALIDATE**
(redação exige validação por clínico em pt-BR; vincular o copy aos
valores de limiar configurados, não a constantes de prosa; o fallback de
severidade desconhecida deve falhar alto, não silenciosamente).

### 6.4 Worker de notificação (`notification_worker.py`)

Retry com backoff exponencial, DLQ com alerta operacional, dedup
atômico — conceitos sólidos de durabilidade de entrega (mitigações do
HAZ-0015/0017). Defeitos: os canais `mobile`/`sms` são placeholders que
logam e descartam; **canais desconhecidos são ignorados
silenciosamente** (linhas 64-73) — um nome de canal mal configurado se
torna um buraco negro de entrega silencioso. **Veredito: TRANSFORM**
(conceitos de retry/DLQ/dedup seguem adiante; descartes silenciosos de
canal rejeitados; o recebimento de entrega por um humano permanece não
comprovado — o HAZ-0015 permanece).

### 6.5 Gatilho de latência ALT-B (`altb_trigger.py`)

Instrumentação de governança de latência (p95 de 30 s ao longo de 7
dias), não lógica de alerta; revisado por completude. **Veredito:
SUPERSEDE** — a arquitetura e o trabalho de SLO da V2 define sua própria
governança de latência (o HAZ-0030 é dono do lado clínico).

### 6.6 API de workflow de alerta (`api/v1/alerts.py`)

Transições de ciclo de vida validadas com 409s (linhas 326-492); o
agrupamento em tempo de leitura preserva todo membro (§4.1). Defeitos:
`resolved_by` não é rastreado (linha 118), acknowledge/resolve/escalate
todos mapeados para uma única ação ABAC (linhas 55-62), sem concorrência
otimista (HAZ-0023). **Veredito: TRANSFORM.**

---

## 7. Tratamento de zero/ausência — varredura consolidada do HAZ-0005 (FINDING 6)

Todo caminho revisado, a partir da fonte:

| # | Caminho | Comportamento em ausente/None/zero | Citado | Avaliação |
|---|---|---|---|---|
| 1 | Severidade de leito, sem escores/alertas/pathways | piso em `normal` | `dashboard.py:115` | REJECT (Finding 1) |
| 2 | Severidade de pathway nula | coagida para `"normal"` | `dashboard.py:353` | REJECT |
| 3 | Rollup de setor, quatro alertas de pathway todos None | contado como `NEUTRO` | `domain_alertas.py:75-84,109-112` | REJECT |
| 4 | Flag de critério None ou não-1 | não contado como em-alerta | `domain_alertas.py:53-57` (RULE-ALERTAS-004) | REJECT — desconhecido coagido para não-em-alerta |
| 5 | Engine de alerta, sem configuração de limiar | `None` silencioso | `alert_engine.py:46-48` | REJECT — não-disparo sem registro |
| 6 | Engine de alerta, falha de cache de paciente | `None` silencioso | `alert_engine.py:184-185` | REJECT |
| 7 | Engine de alerta, SOFA/qSOFA (sem configuração semeada) | nunca alerta | `vitals.py:400-408` + `0038:48-71` | REJECT — não-disparo silencioso estrutural |
| 8 | Correlação, entradas ausentes | `fired=False`, lista de ausentes registrada, nenhum evento emitido | `correlation_engine.py:182-217,608-620` | REFINE — captura de motivo existe, contrato de status ausente |
| 9 | Compilador, entradas vazias / alerta desconhecido | `False` | `alert_compiler.py:388-394` | REJECT |
| 10 | Chave de status do frontend vazia (não atendido, sem alerta) | nenhuma borda/fundo renderizado de forma alguma | caso de borda da RULE-ALERTAS-011 | REJECT — não-avaliado renderizado como ausência |
| 11 | Atendimento, leito todo-NEUTRO | tratado como *não* atendido | RULE-ALERTAS-009 | direção conservadora; conceito aceitável |
| 12 | Faixas de referência, tabela de configuração vazia | padrões hardcoded silenciosos | `api/reference_ranges.py:99-117` | REJECT (ver seed review §4) |
| 13 | Notificação, canal desconhecido | ignorado silenciosamente | `notification_worker.py:73` | REJECT |
| 14 | Agrupamento, tipo de escore desconhecido | agrupado como `"UNKNOWN"`, nunca descartado | `api/v1/alerts.py:147-169` | REFINE — o único caminho de ausência que permanece visível |
| 15 | Histórico de 24 h vazio | recai para as 50 linhas mais recentes independentemente da idade | `dashboard.py:503-542` | VALIDATE — risco de obsoleto-como-atual (HAZ-0006); a idade deve ser explícita |

Padrão: com duas exceções (linhas 8 e 14), **todo caminho de ausência se
resolve rumo à tranquilidade ou ao silêncio**. Isso é sistêmico, não
incidental — a ausência de um tipo de status de avaliação força todo
ponto de chamada a inventar uma coerção, e toda coerção escolheu a
direção insegura.

---

## 8. Resumo de vereditos (este registro)

| Artefato | Veredito |
|---|---|
| Severidade de leito com piso-para-normal (`derive_bed_severity` + coerções) | **REJECT** |
| Engine de alerta (`alert_engine.py`) | **TRANSFORM** |
| Precedência de override assistido (leito/pathway/setor) | **REJECT** (override) / **TRANSFORM** (reconhecimento-ao-lado-da-severidade, canal não mascarado) |
| Desempate de cor de setor baseado em contagem | **REJECT** |
| Valores de janela de cooldown/limite-de-taxa/dedup | **VALIDATE** (valores) / **REJECT** (supressão silenciosa) |
| Agrupamento em tempo de leitura da ADR-0039 + flag escalating | **REFINE** |
| Modelo de severidade (ordinal + codificação tripla + máximo-vence) | **REFINE** |
| Mecanismo contagem-de-critérios → cor | **REJECT** |
| Motor de correlação | **VALIDATE** |
| Compilador de alerta + gates | **REJECT** |
| Copy clínico | **VALIDATE** |
| Worker de notificação | **TRANSFORM** |
| Gatilho ALT-B | **SUPERSEDE** |
| API de workflow de alerta | **TRANSFORM** |

Todos os vereditos: PROPOSAL — AWAITING NAMED CLINICAL REVIEW
(reviewer: rodaquino-OMNI).
