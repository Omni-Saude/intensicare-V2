---
doc_id: USR-G1KIT-BASELINES
title: >
  IntensiCare V2 — Protocolo autocontido de captura dos baselines perecíveis
  (VAL-0035 / G2-VAL-0025), obrigatoriamente ANTES de qualquer implantação
status: PROPOSAL
label: PROPOSAL
approver: UNASSIGNED — VALIDATION REQUIRED
approver_roles:
  - AUTH-PRODUCT (financiamento e janela de execução — a decisão de agenda é a decisão de existir)
  - AUTH-UX (aceitação do instrumento e dos achados)
  - AUTH-CLINSAFETY (definição de deterioração para B4b; classificação de tarefas ininterrompíveis)
  - AUTH-PRIVACY-LEGAL (base legal; B4b depende dela — sem titular, DEC-G0-03)
owner: UNASSIGNED — VALIDATION REQUIRED
validation_status: VALIDATION REQUIRED
last_updated: 2026-08-15
provenance:
  source_repo: intensicare-V2
  path_or_url: docs/02-users-and-workflows/g1-kit/protocolo-baselines-pereciveis.md
  commit_sha_or_version: 0c36f03 (HEAD de cycle-1/clinical-content na redação; arquivo novo, não commitado)
  section_or_lines: documento inteiro
  date_collected: 2026-08-15
  collector: líder de pesquisa contextual de UTI (ciclo 2)
  transformation: >
    Desenho de medição derivado das definições de VAL-0035 (g1-validation-backlog.md:167) e
    G2-VAL-0025 (g2-validation-backlog.md:151) e dos requisitos de estudo de
    success-and-harm-metrics.md SM-01, SM-04, HM-02, HM-05. Onde os registros não
    operacionalizam a medida, a melhor interpretação foi desenhada e marcada
    VALIDATION REQUIRED (§5.1).
  confidence: medium
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
evidence_inputs:
  - repo: intensicare-V2
    path: docs/02-users-and-workflows/g1-validation-backlog.md
    commit: 0c36f03
    lines_used: "167 (VAL-0035), 196 (dependência: prazo duro = véspera da implantação)"
  - repo: intensicare-V2
    path: docs/05-clinical-safety/pathway-portfolio/g2-validation-backlog.md
    commit: 0c36f03
    lines_used: "78-80, 144 (G2-VAL-0023), 151 (G2-VAL-0025)"
  - repo: intensicare-V2
    path: docs/01-vision-and-intended-use/success-and-harm-metrics.md
    commit: 0c36f03
    lines_used: "84-93 (vocabulário de tipo de estudo), 99-124 (SM-01), 196-222 (SM-04), 274-303 (HM-02), 369-392 (HM-05)"
---

# Protocolo autocontido — baselines perecíveis (`VAL-0035` / `G2-VAL-0025`)

> ## ⚠️ ESTA É A ÚNICA MEDIÇÃO DO PROGRAMA QUE NÃO PODE SER FEITA DEPOIS
>
> **SOURCE** (`../g1-validation-backlog.md:167`, `VAL-0035`): "What is the pre-V2 baseline for
> time-to-recognition, alert burden, fatigue, and interruption? — **Baselines are unobtainable
> once V2 is deployed.** This is the strongest scheduling constraint in the programme:
> research delayed past deployment permanently loses these measurements."
>
> **SOURCE** (`../../05-clinical-safety/pathway-portfolio/g2-validation-backlog.md:151`,
> `G2-VAL-0025`): "🚩 **Measure the pre-V2 baseline** for alert burden, fatigue, interruption
> and time-to-recognition — **BEFORE ANY DEPLOYMENT**. **THE ONE IRREVERSIBLE ITEM.** … Without
> it, constraints K1/K2 can never be demonstrated and criterion C12 can never be scored —
> permanently."
>
> **SOURCE** (`../../05-clinical-safety/pathway-portfolio/g2-validation-backlog.md:78-80`):
> "Every other item can be closed late at the cost of delay; that one can be closed **only
> before deployment, or never**."
>
> **STATUS: PROPOSAL.** **OBSERVED (2026-08-15):** nenhuma medição foi realizada; nenhum sítio
> existe; nenhuma janela foi agendada.

Este documento é **autocontido**: contém as definições, o desenho de medição, os instrumentos,
o período mínimo, os vieses conhecidos, o formato de registro e quem pode coletar. Ele pode ser
executado sem que o restante do kit seja executado — e **essa é a sua razão de ser**.

---

## 1. Por que é irrecuperável — e o que exatamente se perde

**INFERENCE — três mecanismos independentes de perda, cada um suficiente sozinho:**

1. **A intervenção altera o objeto medido.** A carga de alertas depois da V2 inclui a V2. A
   taxa de interrupção depois da V2 inclui as interrupções que a V2 causa — a V2 é ela própria
   uma fonte de interrupção (`../../01-vision-and-intended-use/success-and-harm-metrics.md`
   HM-05). Não existe, após a implantação, nenhum lugar de onde observar a unidade sem a V2.
2. **A memória não substitui a contagem.** Perguntar depois "quantas vezes você era
   interrompido antes?" mede lembrança, e a lembrança é sistematicamente enviesada pela
   narrativa da mudança — em qualquer direção, e sem que se possa saber em qual.
3. **A comparação exige o mesmo instrumento.** Um baseline reconstruído com outro método não é
   comparável com a medida pós-implantação; a diferença observada passa a confundir efeito com
   instrumento, de forma irremediável e não estimável.

**INFERENCE — o que NÃO se perde (honestidade sobre a perecibilidade):** a perecibilidade **não
é uniforme**. Componentes baseados em registro (prontuário, logs de sistemas existentes)
permanecem tecnicamente recuperáveis enquanto os registros do período pré-implantação forem
retidos. O que é irrecuperável é tudo que depende de **observação presencial contemporânea** e
de **autorrelato contemporâneo**. A tabela de §3 marca cada componente explicitamente.

**INFERENCE — a perda mais cara não é a métrica, é a falsificabilidade.** Sem baseline, nenhuma
alegação de melhoria (SM-01, SM-04) e nenhuma alegação de não-piora (HM-02, HM-05) pode ser
sustentada ou refutada. O sistema passa a ser permanentemente inavaliável — e um sistema
inavaliável é indistinguível, na evidência, de um sistema que funciona e de um que prejudica.

---

## 2. Gatilho de perecibilidade — quando exatamente a janela fecha

**PROPOSAL — VALIDATION REQUIRED** (mesma tabela de `protocolo-pesquisa-g1.md` §3.5, repetida
aqui porque este documento é autocontido):

| Evento | Fecha a janela? | Raciocínio |
|---|:--:|---|
| Desenvolvimento, ambientes internos, dados sintéticos | **Não** | Nenhum clínico é exposto |
| Operação sombra **sem qualquer saída visível a clínico** | **Não** | **INFERENCE** a partir da definição de shadow mode em `../../01-vision-and-intended-use/success-and-harm-metrics.md` §0: "produces no user-visible alerts and no clinical action" |
| Demonstração do produto para a equipe da unidade | **Sim** | Altera expectativa e vocabulário da unidade inteira |
| Treinamento de usuários | **Sim** | Idem |
| Piloto, mesmo em poucos leitos, mesmo por poucos dias | **Sim** | Difusão dentro da unidade é imediata |
| Sessões de simulação (M3) com profissionais da unidade | **Sim, para aqueles profissionais** | Por isso a coleta de baseline precede M3 e a amostra não deve se restringir a quem participará de M3 |
| Troca do sistema de prontuário/monitorização por outro motivo | **Sim, na prática** | O baseline passa a descrever um ambiente que não existirá mais |

**Consequência operacional (PROPOSAL):** enquanto a captura não estiver concluída e arquivada,
qualquer decisão de demonstrar, treinar ou pilotar na unidade candidata deve ser tratada como
**decisão de abrir mão permanentemente do baseline**, e registrada nesses termos por
`AUTH-PRODUCT`.

---

## 3. As quatro medidas

| ID | Medida | Fonte primária | Perecível? | Depende de |
|---|---|---|:--:|---|
| **B1** | **Carga de alertas e de alarmes** do ambiente atual | Observação presencial + contagem; registros de sistemas existentes, se houver | **SIM** (componente observacional) | Acesso à unidade |
| **B2** | **Interrupções** por profissional-hora, com a tarefa interrompida classificada | Observação presencial (ficha `F-EVT`) | **SIM** | Acesso à unidade |
| **B3** | **Fadiga e carga percebida** | Autorrelato contemporâneo, instrumento padronizado | **SIM** | Seleção do instrumento (§6.1) |
| **B4a** | **Tempo até reconhecimento — proxy observacional** | Observação presencial | **SIM** | Acesso à unidade |
| **B4b** | **Tempo até reconhecimento — adjudicado** | Registro clínico retrospectivo | **Não** (recuperável enquanto os registros existirem) | `VAL-0036` (definição pré-registrada) + `VAL-0037` (base legal) |

**INFERENCE:** B1, B2, B3 e B4a compõem a **cápsula perecível**. B4b é a medida
cientificamente mais forte para SM-01 e a **única que ainda poderá ser feita depois** — desde
que os registros do período pré-implantação sejam retidos e a rubrica seja pré-registrada
**antes** de qualquer resultado ser conhecido.

---

## 4. B1 e B2 — carga de alarmes e interrupções (observacional)

### 4.1 Definições operacionais

**PROPOSAL:**

- **Evento de alarme/alerta**: qualquer sinal audível ou visual, originado de equipamento ou
  sistema, dirigido a um profissional, ocorrido dentro da janela e do campo de observação.
  Classificado por: fonte (monitor multiparamétrico, bomba de infusão, ventilador, sistema de
  informação, telefone/ramal institucional, campainha/chamada de leito, outro) e por desfecho
  observável (silenciado sem ação aparente / seguido de aproximação ao leito / seguido de ação
  clínica / não atendido dentro da janela de observação de 2 min).
- **Interrupção**: cessação observável de uma tarefa em curso por estímulo externo, com ou sem
  retomada. Campos em `guias-de-observacao-e-entrevista.md` §2.2 (`interr`, `int_fonte`,
  `int_dur`, `retomada`).

**INFERENCE — por que B1 conta o ambiente inteiro e não apenas "alertas de software":** a
fadiga de alarme é propriedade do ambiente sonoro total do profissional
(`../../01-vision-and-intended-use/success-and-harm-metrics.md` HM-02). Medir apenas alertas de
sistema faria a V2 parecer neutra ao acrescentar o incremento que ultrapassa o limiar. Esta é
também a medida que `G2-VAL-0023` exige para ratificar o orçamento de alertas interruptivos —
sem B1, aquele item permanece indemonstrável.

### 4.2 Método

1. **Observação estruturada por janelas fixas.** Blocos de 60 min, com contagem contínua de
   eventos de alarme dentro do campo de observação definido (§4.3), simultânea ao registro de
   `F-EVT`.
2. **Denominadores registrados obrigatoriamente**, sem os quais a contagem não é interpretável:
   leitos ocupados na janela, profissionais presentes por papel, turno, dia da semana.
3. **Sem instrumentação eletrônica** de captação de áudio. **INFERENCE:** um gravador em UTI
   capta conversa clínica e viola o protocolo sem PHI; a contagem humana perde eventos e
   **essa perda deve ser declarada** (§4.5) em vez de contornada por gravação.
4. **Calibração inter-observador** obrigatória: ≥2 janelas contadas por dois observadores
   independentes, com concordância reportada.

### 4.3 Campo de observação (definição necessária para que a contagem signifique algo)

**PROPOSAL:** o campo é o conjunto de leitos e o posto **audíveis e visíveis a partir da posição
do profissional sombreado**, redefinido a cada deslocamento e anotado. **INFERENCE:** a
alternativa (contar a unidade inteira) exige múltiplos observadores e produz um número que
nenhum profissional experimenta; a carga relevante é a que **alcança uma pessoa**.

### 4.4 Período mínimo

**PROPOSAL — piso por unidade, alinhado à amostragem de `protocolo-pesquisa-g1.md` §4.2:**

| Estrato | Janelas de 60 min | Racional |
|---|:--:|---|
| Diurno em dia útil | ≥8 | Condição mais bem provida — é o piso inferior de carga |
| Noturno | ≥8 | Menor equipe, maior fragilidade de escalada |
| Fim de semana (diurno ou noturno) | ≥4 | Estrato normalmente omitido e sistematicamente diferente |
| **Total por unidade** | **≥20 h de observação contada** | Abaixo disso, a variação entre turnos domina a estimativa |

**VALIDATION REQUIRED:** o piso de 20 h é uma proposta de suficiência prática, não um cálculo de
poder estatístico. Se `AUTH-UX` exigir precisão declarada, o cálculo deve ser feito com a
variabilidade observada nas primeiras 8 h e o piso revisto **antes** do fim da coleta — nunca
depois de ver o resultado.

### 4.5 Vieses conhecidos — declarados, não corrigidos silenciosamente

| Viés | Efeito provável | Tratamento |
|---|---|---|
| **Efeito do observador (Hawthorne)** | Reduz interrupções autoiniciadas e uso de workarounds; aumenta aderência declarada a protocolo | Descartar a primeira hora de cada sessão da contagem (mantida no registro, marcada `aquecimento`); registrar no campo "momentos em que a minha presença pode ter alterado o comportamento" |
| **Perda de eventos simultâneos** | Subcontagem de alarmes em picos | Registrar "pico não contável" como evento próprio; relatar quantos ocorreram |
| **Seleção de turnos por conveniência** | Superestima condições bem providas | Estratos obrigatórios de §4.4; sorteio de plantões |
| **Deriva do observador ao longo do estudo** | Muda o critério de contagem | Recalibração a cada 2 semanas; concordância reportada |
| **Sazonalidade e ocupação** | Uma semana atípica vira "o baseline" | Registrar ocupação diária e eventos institucionais atípicos; **não** excluir dias atípicos sem declarar |
| **Reatividade ao consentimento** | Quem aceita ser observado pode ser quem trabalha de modo mais protocolar | Recrutamento por escala, não por voluntariado (`plano-de-recrutamento-e-etica.md` §3) |

**INFERENCE:** o descarte da primeira hora é ele próprio uma escolha discutível (pode descartar
o pico do início do turno). Por isso o dado descartado é **mantido no registro e marcado**, e o
relatório apresenta os dois números. Uma decisão metodológica invisível é a forma mais comum de
um baseline se tornar não auditável.

### 4.6 Formato de registro

Registro tabular, uma linha por janela, com colunas: `unidade`, `sessão`, `estrato`,
`data (apenas semana epidemiológica ou índice sequencial)`, `duração`, `leitos ocupados`,
`profissionais presentes por papel`, `contagem de alarmes por fonte`, `contagem por desfecho`,
`contagem de interrupções por fonte`, `interrupções com retomada`, `tempo total interrompido`,
`observador`, `aquecimento (sim/não)`, `notas de contexto`.

**Regra:** nenhuma coluna contém dado de paciente. A data pode ser registrada como índice ou
semana para reduzir vias de re-identificação; se a data exata for exigida para análise de
sazonalidade, ela é mantida em arquivo separado sob a guarda de §8.

---

## 5. B4 — tempo até reconhecimento

### 5.1 Ambiguidade registrada (STOP CONDITION do pacote de tarefa)

**OBSERVED:** nem `VAL-0035` nem `G2-VAL-0025` definem a operacionalização de "tempo até
reconhecimento" no período pré-V2. **SOURCE**
(`../../01-vision-and-intended-use/success-and-harm-metrics.md` SM-01) explicita a dificuldade:
"'Earliest detectable moment' is only definable retrospectively against an adjudicated ground
truth. It is not observable in real time"; e "'clinician became aware' is **not** the same as
'clinician opened the work item'".

**PROPOSAL do kit — desdobrar em duas medidas distintas**, porque elas têm custo, base legal e
validade diferentes e agregá-las produziria um número sem significado único:

| | **B4a — proxy observacional** | **B4b — adjudicada** |
|---|---|---|
| Define o início | Primeiro sinal de alteração **presenciado pelo observador** (valor aferido, alarme, verbalização de um profissional) | Momento mais precoce detectável nos registros, definido por rubrica pré-registrada |
| Define o fim | Primeira ação ou verbalização clínica dirigida àquela alteração | Primeira evidência documentada de ciência clínica |
| Fonte | Observação presencial | Registro clínico retrospectivo |
| Exige base legal para dado de paciente | **Não**, se registrado conforme §5.3 | **Sim** (`VAL-0037`) |
| Exige rubrica pré-registrada | Não | **Sim** (`VAL-0036`) |
| Perecível | **SIM** | Não, enquanto os registros forem retidos |
| Validade | Baixa para "detectabilidade"; **alta** para o intervalo humano de resposta | Alta para detectabilidade; nula sem adjudicação cega |

**VALIDATION REQUIRED:** esta é a melhor interpretação do kit, não a dos registros. `AUTH-UX` e
`AUTH-CLINSAFETY` devem ratificá-la ou substituí-la. Se for substituída por uma definição única,
a definição deve ser fixada **antes** da coleta.

### 5.2 B4a — método

1. Durante as sessões de M1, sempre que o observador presenciar um **sinal de alteração**,
   abrir um registro `RC-nn` (reconhecimento).
2. Marcar `t0` = instante relativo do sinal presenciado; `t1` = instante relativo da primeira
   ação ou verbalização clínica dirigida a ele; `t2` = instante em que outro profissional é
   envolvido (se ocorrer).
3. Registrar **como** o profissional soube (mesmo domínio do campo `origem` de `F-EVT`).
4. Registrar se o observador percebeu o sinal **antes** do profissional — e **não** intervir
   (regra de não interferência, `guias-…` §1.4). **INFERENCE:** esta observação é o dado mais
   delicado do protocolo: ela mede exatamente a lacuna que a V2 pretende endereçar, e a
   tentação de intervir é a maior ameaça à validade e, simultaneamente, um dilema ético que o
   consentimento e a orientação ao patrocinador precisam antecipar (§7.3).

### 5.3 B4a — o que registrar sem PHI

`RC-nn` contém: tipo de sinal em **classe** ("valor de sinal vital", "resultado laboratorial",
"observação clínica de enfermagem", "alarme"), sem valor numérico e sem diagnóstico; tempos
relativos; papéis envolvidos; canal; desfecho observável em categorias ("ação à beira do leito",
"comunicação a outro profissional", "registro", "nenhuma ação observada na janela").

### 5.4 B4a — vieses conhecidos

| Viés | Efeito | Tratamento |
|---|---|---|
| **Só se mede o que o observador presencia** | Subamostra sinais fora do campo; superamostra sinais salientes | Declarar explicitamente que B4a **não** estima detectabilidade, apenas o intervalo humano observado |
| **Presença do observador acelera a resposta** | Subestima o intervalo | Descarte de aquecimento (§4.5); comparar primeira e última hora da sessão |
| **Reconhecimento silencioso** | Um profissional pode já saber e não agir por decisão clínica legítima | Campo obrigatório "houve decisão explícita de não agir?"; nunca inferir omissão |
| **Ausência de verdade fundamental** | Sem adjudicação, "alteração" é o julgamento do observador | Registrar o critério usado pelo observador; **não** rotular episódios como "deterioração" |

### 5.5 B4b — o que precisa existir antes

**Pré-condições, todas hoje abertas:** `VAL-0036` (definição e rubrica pré-registradas,
`AUTH-CLINSAFETY`); `VAL-0037` (base legal, `AUTH-PRIVACY-LEGAL` — **sem titular**,
`DEC-G0-03`); painel adjudicador cego com concordância entre avaliadores reportada; retenção
garantida dos registros do período pré-implantação.

**PROPOSAL de sequenciamento:** **pré-registrar agora, medir depois.** O pré-registro de
`VAL-0036` é barato, não exige sítio nem base legal e **preserva** a possibilidade de B4b.
Adiar o pré-registro até depois da implantação destrói a credibilidade de B4b mesmo que o dado
sobreviva — porque uma definição escrita depois de conhecer os resultados não é falsificável.

---

## 6. B3 — fadiga e carga percebida

### 6.1 Seleção do instrumento — deliberadamente não decidida aqui

**VALIDATION REQUIRED:** este kit **não nomeia** um instrumento de fadiga. **INFERENCE:**
afirmar que um instrumento específico está validado em pt-BR para esta população seria uma
alegação clínica sem evidência neste repositório, e o ciclo 0 já registra que "an instrument
validated in another language is not validated in pt-BR"
(`../../01-vision-and-intended-use/success-and-harm-metrics.md` HM-02).

**PROPOSAL — requisitos que o instrumento escolhido deve satisfazer**, para que a escolha de
`AUTH-UX` + `AUTH-CLINSAFETY` seja avaliável:

1. Publicado, com propriedades psicométricas relatadas;
2. Com versão em português brasileiro cuja validação seja verificável em fonte citável;
3. Curto o bastante para ser respondido ao fim de um plantão (alvo ≤5 min);
4. Aplicável repetidamente sem efeito de aprendizagem relevante;
5. Distingue **carga de trabalho** de **fadiga relacionada a alarmes** — ou combinam-se dois
   instrumentos, e a distinção é declarada;
6. Licenciamento compatível com uso não comercial em pesquisa institucional.

**Regra de honestidade:** se nenhum instrumento satisfizer (2), a medida é coletada com um
instrumento não validado em pt-BR **e o relatório declara isso em toda menção ao resultado**,
ou a medida é omitida — nunca apresentada como validada.

### 6.2 Método

Aplicação **ao fim do plantão observado** (não no meio, para não interferir; não no dia
seguinte, para não medir memória), de forma anônima, com identificação apenas pelo código
`P-nn` e pelo estrato de turno. Piso: ≥15 respostas por unidade, distribuídas pelos três
estratos de turno.

### 6.3 Vieses conhecidos

Autosseleção de respondentes; desejabilidade social (especialmente se houver suspeita de que a
gestão verá o resultado — mitigada por anonimato e por agregação, `plano-…` §7); efeito do dia
específico (mitigado por distribuição entre dias); ausência de baseline pessoal (mitigada por
comparação entre estratos, não entre indivíduos).

---

## 7. Execução

### 7.1 Quem pode coletar

| Componente | Quem pode | Quem **não** pode |
|---|---|---|
| B1, B2, B4a | Pesquisador/observador treinado e calibrado no instrumento, externo à linha de gestão da unidade | O dono da aceitação (`AUTH-UX`); qualquer pessoa em relação hierárquica com os observados; profissional da unidade em seu próprio plantão |
| B3 | Aplicação por canal anônimo operado pela equipe de pesquisa | Chefia da unidade; qualquer pessoa que possa associar resposta a pessoa |
| B4b | Painel adjudicador clínico cego, distinto de quem coletou | Quem conhece o desfecho ou a hipótese sob teste |

**SOURCE** (`../../00-governance/registers/g0-resolucoes-2026-08-15.md:56-61`, `DEC-G0-05`): o
titular não pode ser moderador da própria evidência nem participante único. **INFERENCE:** o
titular também não pode ser coletor de baseline — coletar é moderar a evidência que ele depois
aceita.

### 7.2 Pré-condições mínimas (sem elas, não coletar)

1. Consentimento dos profissionais observados, com recusa invisível e sem custo
   (`plano-de-recrutamento-e-etica.md` §7).
2. Determinação sobre rota ética (CEP/CONEP) concluída ou dispensa formalmente registrada
   (`plano-…` §5) — **`VAL-0040`**.
3. Posição jurídica sobre observação de profissionais e exposição incidental a dado de paciente
   — **`VAL-0041`**, hoje sem titular (`DEC-G0-03`).
4. Anuência do sítio para observação noturna e de fim de semana (S5/S6) e para contagem do
   ambiente de alarmes (S8).
5. Instrumentos impressos/digitais do estudo e observador calibrado.
6. Unidade **sem exposição prévia** à IntensiCare (S7).

**INFERENCE — a tensão que este documento não pode resolver:** os itens 2 e 3 são exatamente o
que mais demora, e a medida é exatamente a que mais urge. A resposta correta não é atalhar a
ética; é **iniciar o item 3 imediatamente** (é a dependência externa sem pré-requisito técnico,
já identificada como primeira do caminho crítico do programa) e desenhar a cápsula mínima
(§7.4) para que a janela ética, quando abrir, encontre o instrumento pronto.

### 7.3 Orientação prévia obrigatória ao patrocinador do sítio

Antes da primeira sessão, o patrocinador clínico deve estar ciente, por escrito, de que:
(a) o observador **não intervém** clinicamente, inclusive quando percebe um sinal antes da
equipe (§5.2, item 4); (b) essa regra existe para não destruir a medida, e **não** se aplica a
risco iminente de dano — nesse caso o observador **fala**, e o episódio é anotado como
"observação interrompida por intervenção" e **excluído** de B4a; (c) a exclusão é declarada no
relatório com a contagem de casos.

**VALIDATION REQUIRED** — o limiar de "risco iminente" deve ser acordado com `AUTH-CLINSAFETY` e
com o patrocinador antes do campo. **INFERENCE:** um protocolo que deixa esse limiar implícito
transfere ao observador, sozinho e em tempo real, uma decisão clínica que ele não tem autoridade
para tomar.

### 7.4 Cápsula mínima — o que fazer se apenas isto for financiado

**PROPOSAL — escopo reduzido que ainda preserva a comparabilidade futura:**

| Elemento | Cápsula mínima |
|---|---|
| Unidades | 1 |
| Componentes | B1, B2, B4a (B3 se houver instrumento aceito) |
| Janelas | 12 h contadas: ≥5 diurno útil, ≥5 noturno, ≥2 fim de semana |
| Duração de campo | ~2 semanas |
| Equipe | 1 pesquisador + 1 segundo observador em ≥2 janelas (calibração) |
| Saída | Relatório de baseline autônomo, arquivado imediatamente (§8) |

**INFERENCE:** a cápsula mínima é insuficiente para generalização e deve declará-lo em cada uso.
Ela é, ainda assim, categoricamente superior a nenhum baseline: um número imperfeito com método
declarado pode ser reproduzido depois com o mesmo método; a ausência não pode ser reproduzida
de forma alguma.

---

## 8. Formato de arquivamento e imutabilidade

**PROPOSAL:**

1. O relatório de baseline é um documento autônomo, entregue **assim que a coleta termina**,
   independentemente das demais fases (`protocolo-pesquisa-g1.md` §8.1).
2. Deve conter: instrumento usado verbatim, período, estratos, denominadores, contagens brutas
   por janela, vieses declarados (§4.5, §5.4, §6.3), concordância inter-observador, dados
   descartados **com o motivo**, e a data e hora de encerramento da coleta.
3. Deve conter uma **declaração de estado de exposição** da unidade: nenhuma demonstração,
   treinamento ou piloto da IntensiCare ocorreu na unidade até a data de encerramento — ou,
   se ocorreu, o que ocorreu e quando.
4. Os dados brutos são preservados sob a guarda definida em `plano-de-recrutamento-e-etica.md`
   §9; o relatório entra no repositório **sem** dados brutos e **sem** qualquer campo da lista
   proibida (`guias-…` §1.2).
5. **INFERENCE:** o item 3 é o que torna o baseline verificável no futuro. Sem ele, ninguém
   poderá distinguir, anos depois, um baseline pré-exposição de um pós-exposição — e a dúvida
   equivale à perda.

---

## 9. O que este protocolo não faz

- **Não** estabelece limiar, meta ou banda aceitável para nenhuma medida. Isso é decisão de
  `AUTH-CLINSAFETY` (`../../01-vision-and-intended-use/success-and-harm-metrics.md` SM-04).
- **Não** define "deterioração" nem adjudica desfecho (`VAL-0036`).
- **Não** estabelece base legal para acesso a registro clínico (`VAL-0037`).
- **Não** autoriza a coleta. A autorização é ato humano — ver `pedido-de-comissionamento.md`.
- **Não** fecha `VAL-0035` nem `G2-VAL-0025`. Apenas sua **execução** os fecha, e o fechamento é
  registrado por humano nomeado.

---

## 10. Referências cruzadas

- `protocolo-pesquisa-g1.md` §§2, 3.5, 4.2, 9.1 — fase F1, gatilho de perecibilidade, amostragem, ambiguidade.
- `guias-de-observacao-e-entrevista.md` §§1, 2.2, 2.5 — regras sem PHI e fichas `F-EVT`/`F-AMB`.
- `plano-de-recrutamento-e-etica.md` §§3, 5, 6, 7, 9 — consentimento, ética, guarda.
- `pedido-de-comissionamento.md` — o ato que abre a janela.
- `../g1-validation-backlog.md` — `VAL-0035`, `VAL-0036`, `VAL-0037`, `VAL-0020`.
- `../../05-clinical-safety/pathway-portfolio/g2-validation-backlog.md` — `G2-VAL-0023`, `G2-VAL-0025`.
- `../../01-vision-and-intended-use/success-and-harm-metrics.md` — SM-01, SM-04, HM-02, HM-05.
