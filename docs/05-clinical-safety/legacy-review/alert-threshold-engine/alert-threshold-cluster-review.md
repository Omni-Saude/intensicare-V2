---
id: LEGREV-ALTB-CLUSTER
title: Revisão legada — cluster docs/rules/alert-threshold (116 registros de regra) com disposições por regra
label: PROPOSAL
status: PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI)
statement: >
  Revisão em nível de cluster do cluster de catálogo de regras extraídas legado
  docs/rules/alert-threshold (116 registros de regra), com uma tabela de disposição
  por regra (ID da regra, função de uma linha com citação, veredito proposto) sob
  docs/00-governance/legacy-import-policy.md.
provenance:
  source_repo: intensicare (legado V1, READ-ONLY)
  path_or_url: docs/rules/alert-threshold/ (116 arquivos)
  commit_sha_or_version: 1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79 (HEAD no pin; docs/rules é coberto arquivo-por-arquivo no manifesto SHA-256 do ciclo-1)
  section_or_lines: cluster inteiro; citações upstream por regra reproduzidas dos registros de regra
  date_collected: 2026-08-15
  last_updated: 2026-08-15
  collector: rodaquino-OMNI (revisor forense do motor legado de alerta-e-limiar, ciclo 1 Tarefa 1)
  transformation: >
    traduzido EN→pt-BR, tranche 4, GDEC-0008 item 8 (todo registro de regra lido —
    metadados, statement da regra, lógica, fontes; resumos de uma linha condensados dos
    registros; os vereditos são propostas deste revisor, não os vereditos de auditoria
    próprios dos registros)
  confidence: alta (conteúdo dos registros) / média (disposições)
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  hazards: [HAZ-0005, HAZ-0016, HAZ-0022, HAZ-0036]
  adrs: []
  pr: null
supersedes: null
superseded_by: null
---

> Traduzido EN→pt-BR em 2026-08-16 (GDEC-0008 item 8, tranche 4); original EN preservado no histórico git.

# Cluster de regras de alert-threshold — revisão de disposição

> **PROPOSAL — AWAITING NAMED CLINICAL REVIEW (reviewer: rodaquino-OMNI).**
> Nada nesta tabela é uma decisão de importação. Um veredito aqui propõe uma
> classificação sob `docs/00-governance/legacy-import-policy.md` §4; qualquer
> importação real exige adicionalmente todas as oito precondições do §3, que
> atualmente não são satisfeitas (licença/PI, dono nomeado, revisão de
> relevância clínica, testes de aceitação da V2, e mais).

## 0. Fontes e integridade

- Cluster: `https://github.com/Omni-Saude/intensicare/tree/1dc1ea6cc83f1e01ca7b7ee70a511f3dbc47cd79/docs/rules/alert-threshold` —
  OBSERVED 2026-08-15: **116 registros de regra** (`ls | wc -l`), todos
  individualmente hasheados com SHA-256 em
  `docs/archive/legacy-provenance/legacy-pin-cycle-1.md` (o conjunto de
  arquivos `docs/rules/` do manifesto). As citações dentro de cada registro
  apontam para os repositórios upstream auditados fixados pelos próprios
  registros: `ahlabs-trilhas @ 8166c07eae...` e `trilhas-frontend @
  f9656be266...` (data de auditoria 2026-07-03). Esta revisão verifica os
  *registros*; os repositórios upstream não foram reabertos (estão fora do
  escopo do pin do ciclo-1), de modo que a citação de implementação de cada
  linha herda a proveniência de auditoria própria do registro.
- ADR de contexto legado: `docs/adr/0014-no-abnormal-value-threshold-flagging.md`
  (hash-and-note em `README.md`) — estabelece que valores clínicos não
  carregavam codificação de gravidade na UI da V1; o cluster abaixo é,
  portanto, *toda* a superfície de sinal de gravidade que o predecessor
  tinha.
- Duas regras (RULE-ALERTAS-001/002) também existem como reimplementações
  ratificadas em `src/intensicare/services/domain_alertas.py`
  (hasheadas no manifesto; engine-review §3.1).

## 1. Método de veredito (aplicado uniformemente)

| Veredito | Aplicado quando |
|---|---|
| REJECT | A regra implementada é defeituosa (contradição docstring/código, ramo inalcançável, coluna errada, faixa de igualdade exata, código morto), ou incorpora um padrão que o hazard log da V2 proíbe (coerção de ausência-para-normal, mascaramento de gravidade, contagem-como-gravidade, codificação apenas-por-cor, contadores sem escopo) |
| VALIDATE | A intenção clínica é plausível e a implementação é fiel (ou o defeito é menor), mas nenhuma regra clínica legada pode entrar na V2 sem validação empírica/clínica e aprovação nomeada — este é o teto para todo critério clínico do cluster |
| TRANSFORM | Um conceito subjacente sólido vale a pena carregar, mas apenas como um design reconstruído nativo da V2; a implementação não é a candidata |
| SUPERSEDE | A arquitetura ou governança da V2 já substitui o mecanismo por completo (tokens de cor da UI, contadores Firebase, retenção de chat, medidores operacionais) |
| RETAIN / REFINE | Não proposto para nenhuma linha — o cluster antecede a semântica de evaluation-status, de modo que nada é importado como-está ou com modificação leve |

## 2. Tabela de disposição por regra

Citações upstream abreviadas: `aht` = ahlabs-trilhas @ 8166c07eae,
`tf` = trilhas-frontend @ f9656be266.

| ID da regra | O que faz (uma linha, citada) | Veredito |
|---|---|---|
| RULE-ALERTAS-001 | Conta critérios com esta_alerta == 1 como a entrada para o bandeamento de cor (aht trilha_automatica/utils.py:8-13) | REJECT — None/ausente coagido a não-em-alerta; contagem alimenta gravidade |
| RULE-ALERTAS-002 | Agrupa movimentacoes pela pior cor de pathway manual; tupla toda-None conta como NEUTRO (aht core/models/leito.py:709-736) | REJECT — ausência contada como sem-alerta (HAZ-0005 na consolidação) |
| RULE-ALERTAS-003 | Mapeia contagem de critérios disparados para VERMELHO/AMARELO/NEUTRO via limiares de contagem por trilha; status do registro DISCREPANCY (aht trilha_automatica/utils.py:75-81) | REJECT — contagem-como-gravidade |
| RULE-ALERTAS-004 | Critério está em-alerta sse valor == exatamente 1 (aht trilha_automatica/utils.py:1-5) | REJECT — desconhecido/2/None silenciosamente não-em-alerta |
| RULE-ALERTAS-005 | Consolidação de leito, vermelho domina amarelo domina neutro; variante de código morto (aht trilha_automatica/utils.py:84-97) | SUPERSEDE — conceito de gravidade-máxima sobrevive em outro lugar; morto |
| RULE-ALERTAS-006 | Cor do leito com LARANJA de sepse interativa superando tudo, senão vermelho > amarelo > neutro entre pathways não-atendidos (aht core/models/leito.py:246-280) | TRANSFORM — gravidade-máxima sólida; caso especial LARANJA e codificação apenas-por-cor rejeitados |
| RULE-ALERTAS-007 | Pior cor por leito automático ignorando atendimento (alerta_nao_assistido); string vazia quando nenhum (aht core/models/leito.py:457-480) | TRANSFORM — o canal de gravidade não-mascarada é o invariante correto; codificação por string vazia rejeitada |
| RULE-ALERTAS-008 | Variante homecare do alerta de leito ignorando atendimento (aht core/models/leito.py:653-707) | TRANSFORM |
| RULE-ALERTAS-009 | Leito atendido apenas se todo pathway não-NEUTRO atendido; leito todo-NEUTRO não atendido (aht core/models/leito.py:818-848) | TRANSFORM — conceito de reconhecimento; semântica reconstruída |
| RULE-ALERTAS-010 | Payload de leito: alerta geral = pior cor não-atendida; flag de atendido exige NEUTRO mais outra cor distinta (aht core/models/leito.py:390-455) | REJECT — semântica incoerente de flag-atendido |
| RULE-ALERTAS-011 | Se assistido, renderiza ASSISTIDO azul independentemente do valor de alerta, em nível de card e de chip (tf InfoPacienteHeader.tsx:21-105; duplicado em CollapseCard.tsx) | REJECT — atendimento mascara gravidade (achado 2 do engine-review) |
| RULE-ALERTAS-012 | Coleta mensagens de critério de pathways manuais vermelhos no conteúdo de notificação (aht utils/handlers.py:109-126) | TRANSFORM — conceito de payload-explicação |
| RULE-ALERTAS-013 | O mesmo para pathways automáticos, sem filtro de lista de permissão (aht utils/handlers.py:129-148) | TRANSFORM |
| RULE-ALERTAS-014 | Filtragem de lista de permissão dependente de tipo para mensagens de critério; AMBÍGUO; caso especial de sepse desabilitado em código morto (aht utils/handlers.py:151-196) | REJECT — filtragem inconsistente de explicações clínicas |
| RULE-ALERTAS-015 | Extração de conteúdo vermelho de homecare, incondicional (aht utils/handlers.py:199-218) | TRANSFORM |
| RULE-ALERTAS-016 | Empurra observação quando recém-vermelho, ou quando o conteúdo vermelho muda; suprime duplicatas vermelho-inalterado (aht core/utils.py:163-190) | VALIDATE — o trade-off renotificar-em-mudança-de-conteúdo vs. supressão é clínico |
| RULE-ALERTAS-025 | Tokens de cor semânticos (success/info/warning/danger) sobrepostos ao tema da UI (tf src/styles/variables.less:1-15) | SUPERSEDE |
| RULE-ALERTAS-027 | Consolidação de setor: leito é VERMELHO se qualquer trilha vermelha, senão AMARELO se qualquer âmbar, senão NEUTRO; mais contagem por gênero (aht core/models/leito.py:764-816) | TRANSFORM — agrupamento por gravidade-máxima por leito sólido; apenas-por-cor rejeitado |
| RULE-ALERTAS-028 | total_alertas do setor chaveado na cor de leito ignorando atendimento (aht core/models/leito.py:750-762) | TRANSFORM — o KPI não-mascarado é a metade relevante para segurança |
| RULE-ALERTAS-029 | Contagens de leito assistido por setor, dois caminhos (aht core/models/leito.py:332-361) | TRANSFORM |
| RULE-ANTIMICROBIANO-001 | Flags de stewardship ativo para cor, conectado em save(); NEUTRO reseta assistido (aht trilha5.py:101-105,182-201) | VALIDATE |
| RULE-ANTIMICROBIANO-002 | Variante de cor de stewardship legada, morta no caminho ativo (aht trilha5.py:156-180) | REJECT — código morto |
| RULE-BALANCO-HIDRICO-025 | Visibilidade da célula de balanço hídrico difere entre visões desktop (!= 0) e mobile (> 0) (tf GridView.tsx:81-96) | REJECT — mesmo dado, dois limiares |
| RULE-COMUNICACAO-004 | Atualizações de contagem-não-lida no Firestore por usuário em eventos de mensagem (aht utils/firebase.py:19-75) | SUPERSEDE |
| RULE-COMUNICACAO-005 | Elegibilidade para decrementar a contribuição não-lida de uma observação (aht utils/mensageiro.py:77-84) | SUPERSEDE |
| RULE-COMUNICACAO-006 | Zera flags de não-lido quando uma checagem se torna checada (aht checagem_observacao.py:28-43) | SUPERSEDE |
| RULE-COMUNICACAO-007 | Pula notificação de incremento para respostas que já decrementaram (aht observacao.py:183-220) | SUPERSEDE |
| RULE-COMUNICACAO-008 | Retenção de chat 48h em todo o setor, 96h com filtro de leito (aht core/api/v1/views/chat.py:23-54) | SUPERSEDE |
| RULE-COMUNICACAO-009 | Notificações popup com debounce para uma a cada 2s (tf DisplayNotificaoes.tsx:98,105) | SUPERSEDE |
| RULE-COMUNICACAO-010 | Cor de status aplicada apenas a mensagens tipo-leito; outras cinza fixo (tf ItemNotificacao.tsx:26-39) | SUPERSEDE |
| RULE-COMUNICACAO-020 | Streams ignoram as próprias mensagens do usuário atual (tf DisplayNotificaoes.tsx:100-126) | SUPERSEDE |
| RULE-COMUNICACAO-046 | Predicado de decremento-não-lido fazendo gate de atualizações Firebase (aht utils/firebase.py:77-84) | SUPERSEDE |
| RULE-EFICIENCIA-001 | Critérios de eficiência v3 para cor; uma variante legada divergente está morta (aht trilha_eficiencia.py:60-65,115-157,206-216) | VALIDATE |
| RULE-EFICIENCIA-005 | Critério de suspeita de morte encefálica: documentado GCS < 6, código usa GCS < 13 com filtro sedativo combinado por AND; desconectado (aht trilha_eficiencia.py:878-912) | REJECT — contradiz a intenção clínica documentada |
| RULE-EFICIENCIA-006 | Contenção-sem-agitação: docstring exige delirium ausente, código exige delirium presente (aht trilha_eficiencia.py:914-937) | REJECT — predicado invertido |
| RULE-EFICIENCIA-012 | Catálogo de rótulo de alerta + recomendação para os 10 critérios de eficiência (aht core/facade/trilha_eficiencia.py:94-155) | VALIDATE — revisão de texto clínico |
| RULE-EQUILIBRIO-001 | Critérios 1-4 de balanço hídrico com rótulos e recomendações (aht core/facade/trilha_equilibrio.py:1-36) | VALIDATE |
| RULE-EQUILIBRIO-003 | Flags de critério de equilibrio para cor persistida (aht trilha7.py:87-91,124-143) | VALIDATE |
| RULE-ESTABILIDADE-003 | Critério de hipoperfusão: noradrenalina + (TEC > 3s ou lactato >= 2); desconectado (aht trilha_estabilidade.py:215-247) | VALIDATE |
| RULE-ESTABILIDADE-005 | Docstring documenta ausência de noradrenalina, código checa presença; desconectado (aht trilha_estabilidade.py:286-319) | REJECT — predicado invertido |
| RULE-ESTABILIDADE-006 | Choque persistente sob vasopressor em dose baixa, critério composto; desconectado (aht trilha_estabilidade.py:321-362) | VALIDATE |
| RULE-ESTABILIDADE-007 | Noradrenalina em dose alta sem vasopressina ou hidrocortisona; conectada a VERMELHO; auditoria DISCREPANCY moderada (aht trilha_estabilidade.py:460-497) | REJECT como implementada — conceito para re-derivação clínica |
| RULE-ESTABILIDADE-008 | Critério de tripla terapia de choque refratário; desconectado; auditoria DISCREPANCY moderada (aht trilha_estabilidade.py:499-521) | REJECT como implementada |
| RULE-ESTABILIDADE-009 | Critério dobutamina + noradrenalina em dose alta; desconectado; auditoria DISCREPANCY moderada (aht trilha_estabilidade.py:523-542) | REJECT como implementada |
| RULE-ESTABILIDADE-011 | Uso de bicarbonato apesar de pH compensado; precondição ausente anotada; desconectado (aht trilha_estabilidade.py:592-612) | VALIDATE |
| RULE-ESTABILIDADE-012 | Anti-hipertensivo programado + hipotensão recorrente; conectada a AMARELO (aht trilha_estabilidade.py:614-669) | VALIDATE |
| RULE-ESTABILIDADE-013 | Hipertensão recorrente sem vasopressor, exclusão por diagnóstico de AVC; conectada a AMARELO (aht trilha_estabilidade.py:671-709) | VALIDATE |
| RULE-ESTABILIDADE-014 | Cor de estabilidade v3: vermelho em critérios 7/10, âmbar em 12/13 (aht trilha_estabilidade.py:117-155,200-213) | VALIDATE |
| RULE-ESTABILIDADE-015 | Textos de alerta de facade cujos limiares numéricos divergem dos predicados avaliados; auditoria DISCREPANCY moderada (aht core/facade/trilha_estabilidade.py:1-57,92-101) | REJECT — limiares renderizados devem ser iguais aos predicados avaliados |
| RULE-ESTABILIDADE-023 | Estabilidade manual: contagem de critérios satisfeitos para alerta de 3 níveis (aht trilha_manual/models/trilha_estabilidade.py:139-153) | REJECT — contagem-como-gravidade |
| RULE-ESTABILIDADE-025 | Cor v1 com cláusula de combinação critério-6 (aht trilha2.py:78-97) | VALIDATE |
| RULE-FORMULARIOS-CLINICOS-004 | Enum de edema peri-ferida em torno de um limite de 4 cm; auditoria DISCREPANCY baixa (aht avaliacao_global.py:92-115) | VALIDATE |
| RULE-FORMULARIOS-CLINICOS-005 | Enums de exame cardiovascular + flag de refil capilar > 5s; auditoria DISCREPANCY baixa (tf dataFormEnfermagem.ts:424-472) | VALIDATE |
| RULE-FORMULARIOS-CLINICOS-006 | Faixas do bloco de dieta técnico-de-enfermagem, subconjunto dos formulários de enfermeiro/nutricionista (tf dataFormTecEnfermagem.ts:289-339) | VALIDATE |
| RULE-INDICADORES-ETL-001 | Porcentagem de participação de alerta por bucket de cor para barras de setor (tf DashboardCard.tsx:54-67) | SUPERSEDE |
| RULE-INDICADORES-ETL-002 | Porcentagem de participação assistida; em 100% vira o card de setor inteiro para ASSISTIDO (tf DashboardCard.tsx:69-79) | REJECT — mascaramento de gravidade em nível de setor |
| RULE-INDICADORES-ETL-005 | Cor do medidor de ocupação em > 70 / > 50 (tf DashboardCard.tsx:291-300) | SUPERSEDE — operacional, não clínico |
| RULE-INDICADORES-ETL-006 | Badge de setor: ASSISTIDO prioridade máxima, senão a cor de maior CONTAGEM vence com vermelho preferido em empates (tf DashboardCard.tsx:81-109) | REJECT — agregação baseada em contagem pode subestimar gravidade (P-3) |
| RULE-INDICADORES-ETL-007 | Quarto bucket LARANJA em um tipo de dashboard, inconsistente com o modelo de 3 níveis em todo o resto (tf DashboardItem.d.ts:26-31) | REJECT — deriva de vocabulário |
| RULE-MOVIMENTACAO-ADT-012 | Consolida 4 alertas de pathway em um alerta de leito; notifica em conteúdo recém-vermelho ou vermelho-alterado (aht atualizar_alerta_movimentacao.py:9-79) | TRANSFORM |
| RULE-MOVIMENTACAO-ADT-014 | Enum de três níveis AMARELO/NEUTRO/VERMELHO entre tipos leito/trilha/mensagem (tf Ocupacao.d.ts:106) | SUPERSEDE |
| RULE-MOVIMENTACAO-ADT-015 | Ícone de relógio de item-de-protocolo-atrasado no chip de trilha (tf CollapseCard.tsx:570-578) | TRANSFORM — conceito de visibilidade de item atrasado |
| RULE-MOVIMENTACAO-ADT-016 | Badge de procedimentos invasivos com popover quando a lista não está vazia (tf CollapseCard.tsx:423-454) | TRANSFORM |
| RULE-NUTRICAO-004 | Agregação de cor de nutrição; AMARELO exige amarelo > 2 com apenas 2 possíveis — inalcançável (aht trilha6.py:123-142) | REJECT — faixa de gravidade inalcançável |
| RULE-NUTRICAO-005 | Faixas de formulário de terapia nutricional compartilhadas pelos formulários de enfermagem e nutricionista (tf dataFormEnfermagem.ts:554-633) | VALIDATE |
| RULE-PIORA-CLINICA-010 | Track-and-trigger: qualquer grau-2 único define AMARELO, grau-3 define VERMELHO, senão soma em faixas 0-7/8-14/15-21; auditoria DISCREPANCY (aht piora_clinica.py:236-262) | VALIDATE — o design de disparo por parâmetro único é sólido; as faixas precisam de derivação clínica |
| RULE-PIORA-CLINICA-011 | Rótulos de alerta, recomendações, intervenções por critério incl. limiares vitais embutidos (aht core/facade/piora_clinica.py:1-262) | VALIDATE — revisão de texto clínico |
| RULE-PRESCRICAO-002 | Checagem de suspensão por dose; cada classe também carrega uma primeira definição invertida sombreada nunca-executada (aht horario_prescricao.py:147-162) | REJECT — lógica invertida sombreada desqualifica o artefato |
| RULE-PRESCRICAO-003 | Suspensão em nível de ordem quando DT_SUSPENSAO em ou antes de agora (aht prescricao.py:145-151) | TRANSFORM |
| RULE-PROFILAXIA-003 | Profilaxia v1: critério 1 âmbar; critérios 4/9 vermelho (aht trilha8.py:124-141) | VALIDATE |
| RULE-PROFILAXIA-004 | Profilaxia v3: critério 1 âmbar; critério 9 vermelho; NEUTRO reseta assistido (aht trilha_profilaxia.py:123-140,181-190) | VALIDATE |
| RULE-SEDACAO-014 | Cor de sedação v3 via calcular_alerta_v2; variante legada morta (aht trilha_sedacao.py:120-166,248-260) | VALIDATE |
| RULE-SEDACAO-021 | Sedação manual: contagem de critérios para alerta de 3 níveis (aht trilha_manual/models/trilha_sedacao.py:174-188) | REJECT — contagem-como-gravidade |
| RULE-SEDACAO-023 | Cor de sedação v1 a partir de subconjunto de flag fixo (aht trilha1.py:108-123) | VALIDATE |
| RULE-SEPSE-003 | Cor de sepse homecare: vermelho se > 2 majors ou exatamente 4 minors; âmbar em exatamente 2 majors ou exatamente 3 minors (aht trilha_homecare/models/sepse.py:350-383) | REJECT — bandeamento por igualdade exata: 5 minors não é vermelho |
| RULE-SEPSE-004 | Sepse manual: limiares de contagem simultâneos de major (C1-9) e minor (C10-20) (aht trilha_manual/models/trilha_sepse.py:526-561) | VALIDATE |
| RULE-SEPSE-007 | Febre sem vasopressor; auditoria DISCREPANCY moderada (aht trilha_sepse.py v3:362-382) | REJECT como implementada |
| RULE-SEPSE-008 | Taquipneia/hipoxemia sem vasopressor ou ventilação invasiva; auditoria VERIFIED (aht trilha_sepse.py v3:384-425) | VALIDATE |
| RULE-SEPSE-009 | Critério de prescrição para falência respiratória; auditoria DISCREPANCY moderada (aht trilha_sepse.py v3:427-450) | REJECT como implementada |
| RULE-SEPSE-010 | Vasopressor recém-iniciado (iniciado dentro de 6h, ausente além de ~24h); VERIFIED (aht trilha_sepse.py v3:452-477) | VALIDATE |
| RULE-SEPSE-011 | Hipotensão (PAS < 90 ou PAD < 60 ou PAM < 65) sem vasopressor; VERIFIED (aht trilha_sepse.py v3:479-502) | VALIDATE |
| RULE-SEPSE-012 | Plaquetas < 100000 sem vasopressor; VERIFIED (aht trilha_sepse.py v3:504-526) | VALIDATE |
| RULE-SEPSE-013 | Lactato arterial >= 3 sem vasopressor; auditoria DISCREPANCY baixa (aht trilha_sepse.py v3:528-548) | VALIDATE |
| RULE-SEPSE-015 | Critério de AKI (creatinina > 2 ou elevação > 0,5) com exclusões por diálise; auditoria DISCREPANCY moderada (aht trilha_sepse.py v3:615-671) | REJECT como implementada |
| RULE-SEPSE-016 | Composto de encefalopatia aguda/delirium; auditoria DISCREPANCY moderada (aht trilha_sepse.py v3:673-739) | REJECT como implementada |
| RULE-SEPSE-017 | Hiperbilirrubinemia/icterícia, incompleta; auditoria DISCREPANCY moderada (aht trilha_sepse.py v3:741-761) | REJECT como implementada |
| RULE-SEPSE-018 | Hipotermia < 36°C sem vasopressor; VERIFIED (aht trilha_sepse.py v3:763-781) | VALIDATE |
| RULE-SEPSE-019 | Critério de taquicardia lendo a coluna errada; auditoria DISCREPANCY moderada (aht trilha_sepse.py v3:783-801) | REJECT — coluna de dado errada |
| RULE-SEPSE-020 | Alcalose respiratória/hipoxemia em ventilação espontânea; auditoria DISCREPANCY moderada (aht trilha_sepse.py v3:803-842) | REJECT como implementada |
| RULE-SEPSE-021 | Composto de leucocitose/leucopenia/bandemia/PCR com parsing de string; auditoria DISCREPANCY moderada (aht trilha_sepse.py v3:844-913) | REJECT como implementada |
| RULE-SEPSE-022 | Refil capilar > 3s de início recente; VERIFIED (aht trilha_sepse.py v3:915-942) | VALIDATE |
| RULE-SEPSE-023 | Sonda enteral com GCS adequado (aht trilha_sepse.py v3:944-978) | VALIDATE |
| RULE-SEPSE-024 | Acesso central com mais de 7 dias (aht trilha_sepse.py v3:980-1001) | VALIDATE |
| RULE-SEPSE-025 | Acesso central femoral com mais de 5 dias (aht trilha_sepse.py v3:1003-1028) | VALIDATE |
| RULE-SEPSE-026 | Flag de cirurgia abdominal recente (aht trilha_sepse.py v3:1030-1051) | VALIDATE |
| RULE-SEPSE-058 | Tabela de limiar de facade de sepse v3 para 20 critérios; auditoria DISCREPANCY moderada vs. camada de model (aht core/facade/trilha_sepse_v3.py:1-85) | REJECT — facade diverge dos predicados avaliados |
| RULE-SEPSE-062 | Orientação de reavaliação de labs: bicarbonato restrito, dobutamina em lactato ascendente, limiar de transfusão; VERIFIED (aht item_trilha_interativa_sepse.py:192-199) | VALIDATE — revisão de texto clínico |
| RULE-SEPSE-095 | Flag de atraso-de-primeira-hora renderizada como relógio vermelho no item de protocolo; auditoria DISCREPANCY (tf ItemProtocoloSepse.tsx:42-50) | TRANSFORM — conceito de visibilidade de tempo-até-tarefa |
| RULE-SINAIS-VITAIS-001 | Limites de plausibilidade de entrada PA/FC, frontend espelha backend (tf dataFormMovimentacao.ts:72-92) | VALIDATE |
| RULE-SINAIS-VITAIS-002 | Limites de plausibilidade de gasometria/lab alimentando entradas de SOFA/sepse (tf dataFormMovimentacao.ts:145-198) | VALIDATE |
| RULE-SINAIS-VITAIS-003 | Limites de plausibilidade de débito urinário/temperatura (tf dataFormMovimentacao.ts:199-212) | VALIDATE |
| RULE-SINAIS-VITAIS-004 | Refil capilar capturado de três formas inconsistentes; limite inferior numérico 3s exclui valores normais (tf dataFormMovimentacao.ts:93-99) | REJECT — captura canônica única exigida |
| RULE-SINAIS-VITAIS-005 | Formulário médico deixa FC/FR/temp/SpO2 sem limite, diferente de outros formulários e do backend (tf dataFormFormularioMedico.ts:270-308) | REJECT — superfície de validação inconsistente |
| RULE-TENANCY-ORGANIZACAO-007 | Contagem de não-lidos do estabelecimento soma todos os setores sem escopo por usuário (aht estabelecimento.py:231-251) | REJECT — defeito de escopo |
| RULE-TENANCY-ORGANIZACAO-008 | Contagem de não-lidos do setor via Firestore por usuário (aht setor.py:270-286) | SUPERSEDE |
| RULE-TENANCY-ORGANIZACAO-011 | Contagens de alerta do setor mesclam alertas de movimentação manual com alertas de leito automáticos (aht setor.py:56-79) | TRANSFORM |
| RULE-TENANCY-ORGANIZACAO-035 | Contagens de alerta total do setor ramificam por tipo de setor (aht setor.py:208-236) | TRANSFORM |
| RULE-TRILHAS-ENGINE-004 | Estilo da aba de pathway: ASSISTIDO preferido sobre o nível de alerta (tf TabRecomendacoes.tsx:110-139) | REJECT — mascaramento de gravidade (achado 2 do engine-review) |
| RULE-TRILHAS-ENGINE-008 | Aviso vermelho no cabeçalho do card de protocolo quando itens atrasados (tf TrilhaInterativa.tsx:190-194) | TRANSFORM |
| RULE-VENTILACAO-014 | Alerta de ventilação: vermelho se >= 3 critérios OU qualquer de C1/C8/C9; âmbar se >= 1 (aht trilha_manual/models/trilha_ventilacao.py:346-364) | VALIDATE — override por critério especial corrige parcialmente contagem-como-gravidade |
| RULE-VENTILACAO-015 | Cor ativa de ventilação v1; NEUTRO reseta assistido (aht trilha3.py:82-86,124-142) | VALIDATE |
| RULE-VENTILACAO-016 | Variante de cor legada de ventilação v1, morta (aht trilha3.py:104-122) | REJECT — código morto |
| RULE-VENTILACAO-018 | Limites de validação de parâmetro de ventilador (tf dataFormMovimentacao.ts:110-144) | VALIDATE |
| RULE-VENTILACAO-021 | Fluxo de O2 suplementar limitado a 1-15 L/min (aht respiratoria.py:135-140) | VALIDATE |
| RULE-VENTILACAO-022 | PEEP limitado a 5-18 cmH2O (aht ventilacao.py:170-178) | VALIDATE |
| RULE-VENTILACAO-023 | Pressão inspiratória limitada a 5-40 cmH2O (aht ventilacao.py:180-188) | VALIDATE |

## 3. Contagens de disposição

| Veredito | Contagem |
|---|---|
| RETAIN | 0 |
| REFINE | 0 |
| TRANSFORM | 18 |
| VALIDATE | 45 |
| SUPERSEDE | 15 |
| REJECT | 38 |
| **Total** | **116** |

## 4. Achados em nível de cluster

1. **Nenhuma regra está pronta para importação.** Zero RETAIN/REFINE. Os
   melhores artefatos do cluster (os critérios de sepse VERIFIED) ainda são
   conteúdo clínico que deve passar pelo processo de pathway da V2
   (inventário de candidatos, MCDA, aprovação nomeada) — VALIDATE é o teto
   por construção.
2. **Contradições docstring/código são endêmicas nos critérios clínicos**:
   pelo menos 12 regras onde o predicado implementado contradiz a intenção
   clínica documentada (ausência/presença invertida de noradrenalina, GCS
   13 vs. 6, delirium presente vs. ausente, coluna errada). Qualquer
   linguagem de regra da V2 deve fazer da forma executável e da forma
   revisada o mesmo artefato (o objetivo legítimo por trás do Gate C
   rejeitado — engine-review §6.2).
3. **Divergência facade/predicado** (RULE-ESTABILIDADE-015, RULE-SEPSE-058):
   os números mostrados aos clínicos diferiam dos números avaliados. Isso é
   classe-HAZ-0036 (a saída lê como direção autoritativa) e deve ser uma
   checagem bloqueadora de build na V2.
4. **Contagem-como-gravidade e bandeamento por igualdade exata**
   (ALERTAS-001/003/004, ESTABILIDADE-023, SEDACAO-021, SEPSE-003): a
   ausência contribui zero, contagens saturam errado, e definições de faixa
   off-by-one deixam buracos (5 minors não é vermelho). A gravidade na V2
   deve ser ordinal sobre evidência avaliada, nunca uma contagem de
   critérios.
5. **A família assistido e os desempates por contagem de setor mascaram
   gravidade** (ALERTAS-011, TRILHAS-ENGINE-004, INDICADORES-ETL-002/006) —
   revisado em profundidade no achado 2 do engine-review.
6. **Deriva de vocabulários de três-ou-mais cores** (NEUTRO/AMARELO/VERMELHO,
   mais LARANJA em exatamente um tipo, mais ASSISTIDO, mais o mais recente
   normal/watch/urgent/critical no motor Python): um vocabulário de
   gravidade único, canônico e não-apenas-por-cor é uma precondição para
   qualquer UI da V2.

Todas as disposições: PROPOSAL — AWAITING NAMED CLINICAL REVIEW
(reviewer: rodaquino-OMNI).
