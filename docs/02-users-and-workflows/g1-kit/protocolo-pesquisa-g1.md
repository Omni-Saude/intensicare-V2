---
doc_id: USR-G1KIT-PROTOCOLO
title: IntensiCare V2 — Protocolo executável de pesquisa contextual do Gate G1
status: PROPOSAL
label: PROPOSAL
approver: UNASSIGNED — VALIDATION REQUIRED
approver_roles:
  - AUTH-UX (desenho de pesquisa e aceitação de achados — NÃO pode moderar; DEC-G0-05)
  - AUTH-PRIVACY-LEGAL (ética, consentimento, tratamento de dados — BLOQUEANTE, sem titular)
  - AUTH-CLINSAFETY (realismo e segurança dos cenários de simulação)
  - AUTH-PRODUCT (financiamento, sítio e cronograma)
owner: UNASSIGNED — VALIDATION REQUIRED
validation_status: VALIDATION REQUIRED
last_updated: 2026-08-15
provenance:
  source_repo: intensicare-V2
  path_or_url: docs/02-users-and-workflows/g1-kit/protocolo-pesquisa-g1.md
  commit_sha_or_version: 0c36f03 (HEAD de cycle-1/clinical-content no momento da redação; este arquivo é novo e não commitado)
  section_or_lines: documento inteiro
  date_collected: 2026-08-15
  collector: líder de pesquisa contextual de UTI (ciclo 2)
  transformation: >
    O plano do ciclo 0 (user-research-plan.md) foi convertido em protocolo executável:
    instrumentos nomeados, amostragem mínima proposta, critérios de inclusão de unidade e
    mapeamento item-a-item do backlog G1. Nenhum conteúdo do ciclo 0 foi substituído;
    nenhuma hipótese do ciclo 0 foi promovida a achado.
  confidence: medium
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
evidence_inputs:
  - repo: intensicare-V2
    path: docs/02-users-and-workflows/g1-validation-backlog.md
    commit: 0c36f03
    lines_used: "45-232 (os 43 itens VAL-nnnn; 42 bloqueiam o G1)"
  - repo: intensicare-V2
    path: docs/02-users-and-workflows/user-research-plan.md
    commit: 0c36f03
    lines_used: "72-121 (métodos M1..M6 e métodos excluídos), 125-218 (participantes, sítios, ética)"
  - repo: intensicare-V2
    path: docs/00-governance/registers/g0-resolucoes-2026-08-15.md
    commit: 0c36f03
    lines_used: "39-46 (DEC-G0-03), 56-61 (DEC-G0-05), 97-101 (DEC-G0-10)"
  - repo: intensicare-V2
    path: docs/05-clinical-safety/pathway-portfolio/g2-validation-backlog.md
    commit: 0c36f03
    lines_used: "78-80, 151 (G2-VAL-0025)"
  - repo: intensicare-V2
    path: INTENSICARE_V2_ORCHESTRATOR_PROMPT.md
    commit: 0c36f03
    lines_used: "§0.6 (caminho crítico, item 2); §5 Gate G1"
---

# Protocolo executável de pesquisa contextual — Gate G1

> **STATUS: PROPOSAL — NÃO APROVADO, NÃO FINANCIADO, NÃO AGENDADO.**
>
> **OBSERVADO (2026-08-15, inspeção do repositório em `0c36f03`):** nenhum sítio foi
> identificado ou contatado; nenhum participante foi recrutado; nenhuma submissão ética foi
> preparada; nenhum moderador foi nomeado. **Nada neste protocolo representa trabalho
> executado.**
>
> Este documento **não** substitui `../user-research-plan.md` (ciclo 0). Ele o **estende**:
> o plano diz *o que precisa ser observado e por quê*; este protocolo diz *como executar*,
> com instrumentos nomeados, amostragem, critérios de inclusão e o mapeamento item-a-item
> do backlog. Onde houver conflito aparente, o plano do ciclo 0 prevalece quanto ao padrão
> epistêmico (§§1, 2.2, 7) e este protocolo prevalece quanto à mecânica de execução.

## 0. Como ler este documento

Toda afirmação material carrega exatamente um rótulo de
`../../00-governance/evidence-notation.md` §2: **SOURCE**, **OBSERVED**, **INFERENCE**,
**PROPOSAL**, **VALIDATION REQUIRED** ou **DECIDED**. **Nenhuma afirmação aqui carrega o
rótulo DECIDED.** Nenhum agente pode aprovar este protocolo, nomear seu moderador, ou
declarar qualquer item do backlog fechado.

Idioma pt-BR conforme `DEC-G0-10` (`../../00-governance/registers/g0-resolucoes-2026-08-15.md:97-101`).
Os tokens de notação de evidência permanecem em inglês porque são identificadores do padrão,
não prosa.

### 0.1 A restrição que define este protocolo

**SOURCE** (`../../00-governance/registers/g0-resolucoes-2026-08-15.md:56-61`, `DEC-G0-05`):
"rodaquino-OMNI assume AUTH-UX em caráter interino. Restrição registrada: o conhecimento
clínico próprio do titular vale como **insumo de hipótese de especialista**, nunca como
evidência de observação do Gate G1 — o G1 continua exigindo participantes clínicos externos
(dono da aceitação ≠ moderador da pesquisa ≠ participante único)."

**INFERENCE** (raciocinando de `DEC-G0-05` e de `../../00-governance/decision-rights.md` §3,
par de independência #5): três papéis distintos são exigidos e **nenhum deles pode ser
acumulado pelo mesmo humano nesta pesquisa**:

| Papel | Quem pode exercer | Quem NÃO pode |
|---|---|---|
| **Dono da aceitação dos achados** (`AUTH-UX`) | O titular interino (rodaquino-OMNI) | — |
| **Moderador/pesquisador de campo** | Terceiro externo contratado, sem autoria das hipóteses sob teste | O dono da aceitação; qualquer autor de `user-roles-hypotheses.md` / `workflow-hypotheses.md` |
| **Participantes clínicos** | Clínicos externos da(s) unidade(s) do sítio | O titular como participante único; ver §7.3 |

**INFERENCE:** o titular *comissiona* e *aceita*; ele não observa, não modera e não é a
amostra. Este protocolo existe precisamente para tornar essa separação executável por um
terceiro sem redesenho.

### 0.2 Urgência declarada

**SOURCE** (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md` §0.6, item 2): "**G1 — pesquisa de
usuários**: 42 itens bloqueantes (`g1-validation-backlog.md`); baselines perecíveis
G2-VAL-0025/VAL-0035 (irrecuperáveis após go-live)."

**PROPOSAL:** dentro deste kit, o `protocolo-baselines-pereciveis.md` é **autocontido e
executável antes do restante**, exatamente porque é a única parte cujo custo de atraso é
permanente e não meramente cronológico.

---

## 1. Objetivo e critério de suficiência

**PROPOSAL — objetivo do estudo:** produzir evidência **observacional** suficiente para que
`AUTH-UX`, `AUTH-CLINSAFETY` e `AUTH-INTENDED-USE` possam fechar ou aceitar-como-risco cada
item do `../g1-validation-backlog.md`, e para que a declaração de uso pretendido
(`../../01-vision-and-intended-use/intended-use-statement.md`, ainda PROPOSAL) seja
**testada** e não pressuposta.

**SOURCE** (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md` §5, Gate G1): "Do not approve solution
architecture until intended users have been observed or the absence is explicitly accepted as
a blocking risk."

**PROPOSAL — critério de suficiência do estudo (a ser ratificado por `AUTH-UX`):** o estudo
é suficiente quando, para cada item mapeado em §6 como *coberto*, existir (a) registro
observacional bruto codificado, (b) um achado escrito separando observação de interpretação e
(c) uma marcação explícita CONFIRMADA / REFUTADA / MODIFICADA / **NÃO TESTADA** da hipótese
correspondente do ciclo 0. **INFERENCE** (de `../user-research-plan.md` §8, item 2): a
categoria NÃO TESTADA é obrigatória; sem ela, hipóteses não examinadas herdam silenciosamente
a credibilidade das testadas.

**Contradição é resultado válido — SOURCE** (`../user-research-plan.md` §8): "contradiction is
a successful research outcome, not a failure." **PROPOSAL:** um relatório final que confirme
todas as hipóteses do ciclo 0 deve ser tratado como suspeito de viés de confirmação e revisado
quanto ao desenho de moderação (§7.4), não celebrado.

---

## 2. Desenho do estudo

**PROPOSAL — desenho misto sequencial, em quatro fases, com prioridade explícita ao
perecível.**

| Fase | Conteúdo | Instrumentos | Pré-condição | Perecível? |
|---|---|---|---|---|
| **F0 — Pré-campo** | Sítio, ética, consentimento, treinamento e calibração de observadores | §7, `plano-de-recrutamento-e-etica.md` | Aprovação + comissionamento | Não |
| **F1 — Cápsula de baseline** | Medidas B1–B4 pré-V2 | `protocolo-baselines-pereciveis.md` | F0 | **SIM — irrecuperável** |
| **F2 — Campo principal** | Sombreamento, passagem de plantão, artefatos, documentos do sítio | M1, M2, M4, M7 | F0 | Parcialmente (§3.1) |
| **F3 — Estímulo controlado** | Cenários simulados, compreensão de linguagem, tecnologia assistiva | M3, M5 | F2 (cenários derivados do observado) + estímulo pronto | Não |
| **F4 — Fora da beira do leito** | Compradores e governança; censo de acessibilidade | M6, M8 | F0 | Não |
| **F5 — Análise e reconciliação** | Relatórios, blueprint, reconciliação de hipóteses, atualização do backlog | §8 | F1–F4 | Não |

**INFERENCE — por que F1 precede F2 e não o contrário:** F2 é a fase mais informativa, mas
sua perda é apenas atraso. F1 mede o estado do mundo *antes* de o produto existir; sua perda é
definitiva. Sequenciar por valor informativo em vez de por perecibilidade é o erro específico
que este protocolo evita.

**INFERENCE — por que F3 vem depois de F2:** cenários de simulação derivados de hipóteses de
escritório testam o escritório. Cenários derivados do que foi observado testam a unidade. A
lista de cenários em `../user-research-plan.md` §2.3 é o **piso** obrigatório (sistema errado,
obsoleto, degradado e silencioso), não o teto.

### 2.1 Três modalidades, uma pergunta

**PROPOSAL:** o estudo combina três modalidades porque cada uma falha sozinha:

1. **Inquérito contextual / sombreamento (M1)** — o que as pessoas *fazem*. Falha em revelar
   por quê, e não alcança eventos raros.
2. **Entrevista semiestruturada ancorada na observação (E)** — o porquê, perguntado sobre um
   episódio real que o pesquisador acabou de presenciar. Falha se descolada da observação,
   virando preferência declarada — método excluído por `../user-research-plan.md` §2.2.
3. **Observação de plantão/passagem e simulação (M2, M3)** — eventos que a agenda do
   pesquisador não controla (M2) e eventos que a realidade não produz sob demanda, como falha
   do sistema (M3).

**INFERENCE:** a entrevista só é admissível **imediatamente após** a observação e **referida a
episódios observados** ("aos 40 minutos o senhor voltou àquela tela três vezes — o que estava
procurando?"). Perguntas hipotéticas sobre um produto inexistente permanecem proibidas
(`../user-research-plan.md` §2.2).

---

## 3. Sítios e critérios de inclusão de unidade

**OBSERVED (2026-08-15):** nenhum sítio foi identificado, contatado ou acordado. Os critérios
abaixo são **requisitos**, não seleções.

### 3.1 Fronteira do objeto: UTI adulto — confirmação contra o uso pretendido

**SOURCE** (`../../01-vision-and-intended-use/intended-use-statement.md` IU-03): o cenário
inicial proposto é a "**unidade de terapia intensiva (UTI) adulta de um único sítio piloto
validado**", no Brasil, em pt-BR — e esse documento é **PROPOSAL não aprovado**.

**SOURCE** (mesma fonte, IU-05): população inicial proposta = adultos (limiar proposto ≥18
anos), com o limiar explicitamente marcado como "drafting placeholder, not a clinical
recommendation".

**INFERENCE — consequência metodológica:** o protocolo observa **UTI adulto** porque é a
fronteira que o uso pretendido *propõe*; ele **não pressupõe que a fronteira esteja certa**.
Duas consequências operacionais:

1. A triagem de unidade (§3.3, item U-Q3) registra **se a unidade admite adolescentes ou
   pacientes pediátricos em leitos adultos** — fato organizacional, sem qualquer dado de
   paciente. Se admitir, isso é achado relevante para `VAL-0006`/`VAL-0008` e **não** motivo
   de exclusão da unidade.
2. O protocolo registra quais setores adjacentes a mesma equipe cobre (semi-intensiva,
   enfermaria, time de resposta rápida). **INFERENCE:** se a mesma equipe cobre outros
   setores, a fronteira "UTI apenas" pode ser uma fronteira de software que não existe na
   organização do trabalho — o que é um achado para `VAL-0009`, não um detalhe logístico.

### 3.2 Requisitos de sítio (estendem S1–S5 de `../user-research-plan.md` §4)

| # | Requisito | Origem | Verificação |
|---|---|---|---|
| S1 | Ao menos uma UTI adulta no Brasil, operando em pt-BR | ciclo 0 | Triagem documental + visita |
| S2 | Sítio onde as fontes de dados pretendidas plausivelmente existem | ciclo 0 (dependência AMH) | §3.4 |
| S3 | Mais de uma unidade; idealmente mais de uma instituição | ciclo 0 | Acordo de acesso |
| S4 | Patrocinador clínico nomeado no sítio | ciclo 0 | Carta de anuência |
| S5 | Sítio que permita observação em passagem de plantão e à noite | ciclo 0 | Acordo explícito, por escrito, antes de F1 |
| **S6** | **Sítio que permita observação em fim de semana** | **PROPOSAL (novo)** | Idem S5 |
| **S7** | **Sítio sem implantação prévia ou concomitante da IntensiCare (legado ou V2) na unidade observada** | **PROPOSAL (novo)** — ver §3.5 | Declaração do patrocinador |
| **S8** | **Sítio disposto a permitir contagem do ambiente de alarmes (monitores e sistemas existentes)** | **PROPOSAL (novo)** — precondição de B1 | Acordo explícito antes de F1 |

**INFERENCE sobre S7:** uma unidade que já usa (ou usou) o sistema legado não fornece um
baseline "pré-V2"; fornece um baseline pós-exposição. Isso não a desqualifica para M1/M2/M4 —
ao contrário, é uma unidade valiosa para entender workarounds em torno do legado — mas a
**exclui de F1**. Esta distinção precisa estar escrita antes da seleção do sítio, ou será
racionalizada depois dela.

### 3.3 Triagem de unidade (ficha U — preencher por unidade, antes da inclusão)

**PROPOSAL — instrumento `F-UNI`.** Nenhum campo abaixo contém dado de paciente.

| Código | Campo | Formato |
|---|---|---|
| U-Q1 | Código da unidade (atribuído pelo estudo) | `U-01`, `U-02`, … |
| U-Q2 | Número de leitos operacionais; leitos com monitorização contínua | inteiro |
| U-Q3 | A unidade admite adolescentes/pediátricos em leitos adultos? Faixa etária declarada | sim/não + descrição |
| U-Q4 | Perfil declarado (clínica, cirúrgica, mista, cardiológica, neuro, coronariana) | texto curto |
| U-Q5 | Subpopulações rotineiras: obstétrica, ECMO/TRRC, pós-operatório cardíaco, cuidados paliativos | lista |
| U-Q6 | Setores adicionais cobertos pela mesma equipe | lista |
| U-Q7 | Escala médica: diarista, plantonista, cobertura noturna e de fim de semana | descrição |
| U-Q8 | Razão enfermeiro:leito e técnico:leito por turno (declarada) | número por turno |
| U-Q9 | Sistemas clínicos em uso (prontuário, monitorização, laboratório, prescrição) e se há integração declarada | lista |
| U-Q10 | Existe procedimento de contingência documentado para indisponibilidade de sistema clínico? | sim/não + referência ao documento |
| U-Q11 | Existe sistema de alerta/escore automatizado hoje? Qual? | sim/não + descrição |
| U-Q12 | Há artefato de passagem de plantão? (papel, planilha, resumo do prontuário, quadro) | lista |
| U-Q13 | Quem administra limiares clínicos hoje, e é pessoa clínica ou técnica? | descrição do papel |
| U-Q14 | Exposição prévia à IntensiCare legado ou V2 | sim/não (critério S7) |

**Critérios de exclusão de unidade (PROPOSAL):** unidade em obra ou reforma estrutural durante
a janela de campo; unidade em surto declarado com restrição de circulação (por
inviabilizar observação presencial segura, não por juízo sobre a unidade); unidade cuja
liderança condicione o acesso à identificação nominal dos participantes ao gestor
(incompatível com §7.3 e com `VAL-0042`).

### 3.4 Dependência AMH — registrada, não resolvida

**SOURCE** (`../user-research-plan.md` §4, nota de dependência, citando
`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md`): existe contradição documentada sobre a
disponibilidade de sinais vitais de UTI, com a advertência explícita de "não inferir que os
sinais vitais de UTI estão disponíveis".

**PROPOSAL:** a seleção do sítio deve trocar achados com
`../../08-interoperability/amh-data/` antes de ser finalizada. Este protocolo **não** resolve
a contradição e não deve ser lido como se a assumisse resolvida. **INFERENCE:** observar um
fluxo de trabalho que a V2 nunca poderá sustentar produz um desenho bem pesquisado e
inentregável — mas observar o trabalho real de reconhecimento de deterioração continua válido
mesmo que a fonte de dados mude, porque o objeto do G1 é o trabalho humano, não o pipeline.

### 3.5 O gatilho de perecibilidade (definição operacional)

**PROPOSAL — VALIDATION REQUIRED:** o baseline perecível é destruído por **exposição visível
ao clínico**, não por implantação técnica. Consequentemente:

| Evento | Destrói o baseline? | Fundamento |
|---|---|---|
| Operação sombra sem saída visível ao clínico | **Não** | **INFERENCE**: se nenhum clínico vê saída, o comportamento clínico não muda. Ver `../../01-vision-and-intended-use/success-and-harm-metrics.md` §0 ("Shadow / silent-mode": "produces no user-visible alerts and no clinical action") |
| Demonstração do produto na unidade observada | **Sim** | **INFERENCE**: expõe o conceito e altera expectativa e vocabulário |
| Treinamento de usuários | **Sim** | Idem |
| Piloto, mesmo parcial, mesmo em poucos leitos | **Sim** | Idem, e contamina a unidade inteira por difusão |
| Sessões M3 de simulação com participantes da unidade | **Sim, para aqueles participantes** | **INFERENCE**: por isso F1 precede F3 e a amostra de F1 não deve ser restrita aos participantes de F3 |

**VALIDATION REQUIRED** — esta tabela é uma interpretação operacional proposta; `AUTH-UX` e
`AUTH-PRODUCT` devem ratificá-la, porque ela determina o que a organização pode fazer sem
perder o baseline.

---

## 4. Papéis a observar e amostragem mínima defensável

### 4.1 Papéis

**PROPOSAL — papéis observados, estendendo `../user-research-plan.md` §3:**

| Código | Papel | Por quê | Hipótese sob teste |
|---|---|---|---|
| R-MED-D | Médico intensivista **diarista** | `UR-01`; a distinção diarista/plantonista está ausente do conjunto de personas legado | `user-roles-hypotheses.md` UR-01 |
| R-MED-P | Médico intensivista **plantonista** (incl. noite e fim de semana) | Idem; a cobertura noturna é onde a escalada é mais frágil | UR-01 |
| R-ENF | Enfermeiro assistencial de beira de leito | `UR-02`; usuário de maior frequência hipotetizado | UR-02 |
| R-TEC | Técnico de enfermagem | **PROPOSAL (novo)** — **INFERENCE**: ausente das personas legadas e do plano do ciclo 0; em UTI brasileira é frequentemente quem primeiro afere e registra sinais vitais. Se o primeiro humano a ver um valor alterado for este papel, toda a hipótese "quem monitora" muda | Nenhuma — lacuna declarada |
| R-COORD | Enfermeiro coordenador / responsável de turno | `UR-03`; papel menos evidenciado | UR-03 |
| R-FISIO | Fisioterapeuta | Ciclo 0 §3; presente à beira do leito em UTI brasileira | Nenhuma formal |
| R-ADM | Administrador de limiares / TI clínica do sítio | `UR-05`, `VAL-0017` | UR-05 |
| R-AT | Profissional usuário de tecnologia assistiva | `UR-08`, `VAL-0033`; **deve ser usuário real** | UR-08 |
| R-GOV | Comprador / governança clínica | `VAL-0043`; entrevistado **separadamente** | §3 de `user-roles-hypotheses.md` |

**INFERENCE sobre R-TEC:** incluir o técnico de enfermagem não é exaustividade; é a correção
de uma lacuna que, se mantida, faria o estudo confirmar a estrutura de papéis do documento
legado por construção — porque só perguntaria a quem o documento legado já listava.

### 4.2 Amostragem mínima defensável (PROPOSAL)

**INFERENCE — como conciliar com a regra de saturação do ciclo 0:** `../user-research-plan.md`
§3 determina que o tamanho da amostra seja definido por **saturação da variação de fluxo de
trabalho**, não por meta fixa, "porque um número pré-comprometido encorajaria parar no número
em vez de no entendimento". Os valores abaixo são portanto **pisos**, não metas: abaixo deles o
estudo é indefensável; atingi-los **não** autoriza parar. A regra de parada permanece a
saturação, avaliada e registrada explicitamente (§8.3).

**Por unidade incluída (U-nn):**

| Instrumento | Piso mínimo | Cobertura obrigatória |
|---|---|---|
| M1 sombreamento | **9 sessões de ≥4 h** | ≥3 diurno útil, ≥3 noturno, ≥3 fim de semana |
| M1 por papel | ≥4 R-ENF, ≥2 R-TEC, ≥3 R-MED (com ≥1 R-MED-D e ≥1 R-MED-P), ≥1 R-COORD, ≥1 R-FISIO | Cada sessão sombreia **um** profissional |
| M2 passagem de plantão | **≥6 passagens** | ≥2 de enfermagem diurna→noturna, ≥2 de enfermagem noturna→diurna, ≥2 médicas; ≥1 em fim de semana |
| M4 inventário de artefatos | **1 varredura completa** + registro contínuo durante M1 | Todos os artefatos em uso na unidade |
| M7 revisão documental do sítio | **1 por unidade** | Contingência, protocolos de escalada, política de limiares, escala |
| E entrevistas ancoradas | **1 por sessão de M1** (≤30 min, imediatamente após) | Todos os papéis sombreados |

**Por estudo (não por unidade):**

| Instrumento | Piso mínimo | Observação |
|---|---|---|
| M3 simulação | **10 participantes** (≥4 R-ENF, ≥4 R-MED, ≥2 R-COORD) | Cada participante faz o conjunto mínimo de cenários (§5.3) |
| M5 tecnologia assistiva | **≥3 usuários reais de TA** | **VALIDATION REQUIRED**: se não houver usuário de TA na força de trabalho do sítio, o recrutamento se amplia para profissionais de saúde usuários de TA fora do sítio; **jamais** simulado por pesquisador vidente (`../user-research-plan.md` §3) |
| M6 comprador/governança | **≥3 interlocutores** de ≥2 funções distintas (ex.: direção clínica, suprimentos/TI, qualidade) | Sessões separadas das clínicas |
| M8 censo de acessibilidade | Instrumento anônimo agregado, aberto a toda a equipe da unidade | Suplemento, nunca método primário (`../user-research-plan.md` §2.2) |

**Unidades e instituições:** piso de **2 unidades**; **PROPOSAL** de ≥2 instituições, porque um
único sítio não sustenta nenhuma alegação de generalização (`../user-research-plan.md` §7).
**INFERENCE:** se apenas uma instituição for viável, o estudo continua válido e o relatório
deve declarar, em cada achado, "observado em uma instituição" — a limitação é registrada, não
compensada por amostra maior dentro do mesmo sítio.

**Anti-viés de voluntário (PROPOSAL, do ciclo 0 §3.2):** o recrutamento por sessão de M1 deve
partir da **escala** (sortear plantões e convidar quem está escalado), não de uma lista de
voluntários. Ver `plano-de-recrutamento-e-etica.md` §3.

### 4.3 Duração

**PROPOSAL — duração de campo, por unidade e no total (premissas explícitas em
`pedido-de-comissionamento.md` §3):**

| Fase | Duração de calendário | Esforço de campo |
|---|---|---|
| F0 | 6–14 semanas (dominado pela rota ética, se exigida) | Baixo, não de campo |
| F1 (cápsula perecível) | 2 semanas por unidade | ~10 dias-pesquisador por unidade |
| F2 | 4 semanas por unidade (pode sobrepor F1 parcialmente — ver ressalva abaixo) | ~20 dias-pesquisador por unidade |
| F3 | 2–3 semanas | ~10 dias-pesquisador |
| F4 | 2 semanas (paralelo a F2/F3) | ~5 dias-pesquisador |
| F5 | 3–4 semanas | ~15 dias-pesquisador |

**Ressalva de sobreposição (INFERENCE):** F1 e F2 podem compartilhar sessões de campo
(o mesmo observador conta interrupções e alarmes enquanto sombreia), o que reduz custo — mas
**apenas** se o instrumento de F1 for aplicado com fidelidade métrica (contagem sistemática,
não anedótica). Se houver conflito de atenção entre narrar o fluxo e contar eventos, a
prioridade é a contagem, porque só ela é perecível. Recomenda-se dois observadores nas sessões
de sobreposição (§7.4).

---

## 5. Instrumentos

Os instrumentos M1–M6 são os do ciclo 0 (`../user-research-plan.md` §2.1) e não são
redefinidos aqui. M7, M8 e B são acréscimos deste kit.

| ID | Instrumento | Definido em |
|---|---|---|
| M1 | Sombreamento / inquérito contextual | ciclo 0 §2.1; roteiro em `guias-de-observacao-e-entrevista.md` §2 |
| M2 | Observação de interrupção e de passagem de plantão | ciclo 0 §2.1; roteiro em `guias-…` §3 |
| M3 | Cenários simulados tempo-críticos, incluindo falha do sistema | ciclo 0 §2.1 e §2.3; roteiro em `guias-…` §6 |
| M4 | Inventário de artefatos e workarounds | ciclo 0 §2.1; roteiro em `guias-…` §4 |
| M5 | Avaliação de tarefa com tecnologia assistiva | ciclo 0 §2.1; roteiro em `guias-…` §7 |
| M6 | Entrevistas com comprador/governança | ciclo 0 §2.1; roteiro em `guias-…` §8 |
| **M7** | **Revisão documental do sítio** (contingência, escalada, limiares, escala) | **novo** — `guias-…` §5 |
| **M8** | **Censo anônimo de necessidades de acessibilidade da força de trabalho** | **novo** — `guias-…` §9 |
| **B1–B4** | **Medidas de baseline perecível** | **novo** — `protocolo-baselines-pereciveis.md` |
| **E1–E7** | **Roteiros de entrevista semiestruturada por papel** | **novo** — `guias-…` §10 |

**Métodos excluídos permanecem excluídos.** `../user-research-plan.md` §2.2 exclui entrevista
de preferência, survey como método primário, demonstração seguida de feedback, consulta a
conselho consultivo/KOL, análise de documentação legada e personas/usuários sintéticos gerados
por agente ou modelo. **Nenhum instrumento deste kit os reintroduz.** M8 é survey e é admitido
**apenas** como suplemento, com resultado agregado, jamais como evidência de fluxo de
trabalho.

### 5.1 O que M3 exige antes de existir

**VALIDATION REQUIRED — pré-condições de M3, todas sem titular:**

1. Um **estímulo** (protótipo de baixa fidelidade, em papel ou tela estática) suficiente para
   apresentar estados de avaliação — não um produto. **INFERENCE:** exigir o produto para
   testar compreensão inverteria a ordem do G1, que existe justamente para informar o produto.
2. Realismo e segurança clínica dos cenários: `AUTH-CLINSAFETY` (`../user-research-plan.md`
   §2.3).
3. Delimitação inequívoca: nenhum participante pode crer que um paciente simulado é real, e
   nenhum item simulado pode alcançar sistema clínico vivo (ciclo 0 §2.3).
4. Cenários derivados de F2 além do piso do ciclo 0 §2.3.

### 5.2 O estímulo mínimo (PROPOSAL)

**PROPOSAL:** o estímulo de M3 consiste em (a) uma visão de unidade com N leitos, (b) uma
visão de paciente e (c) um item de trabalho — cada um em variantes que expressam os estados
`válido | parcial | não avaliado | obsoleto | inválido`
(`../../03-domain/status-dimensions.md`), com o vocabulário pt-BR sob teste. **INFERENCE:** o
estímulo deve ser deliberadamente feio e claramente não-produto, para que o participante
critique o *conceito* e não o acabamento visual, e para que ninguém confunda a sessão com uma
demonstração comercial — o método excluído no ciclo 0 §2.2.

### 5.3 Conjunto mínimo de cenários de M3

**PROPOSAL — piso obrigatório (do ciclo 0 §2.3, aqui codificado):**

| ID | Cenário | Item do backlog que endereça |
|---|---|---|
| C-01 | Paciente deteriorando com estado explicitamente **não avaliado** no painel | VAL-0026, VAL-0027, VAL-0031 |
| C-02 | Paciente deteriorando com o sistema **silencioso** (deterioração perdida) | VAL-0026, HM-04 |
| C-03 | Item de trabalho plausível porém **incorreto** (falso alerta) | VAL-0029 |
| C-04 | **Valores conflitantes** entre duas fontes | VAL-0022 |
| C-05 | V2 **indisponível** no meio da tarefa | VAL-0021, VAL-0028 |
| C-06 | **Expiração de sessão** no meio da tarefa | VAL-0021 |
| C-07 | Paciente **fora da população aprovada** ou com idade desconhecida | VAL-0008 |
| C-08 | Item de trabalho pertencente ao **turno anterior**, não resolvido | VAL-0016, VAL-0018, VAL-0019 |
| C-09 | Paciente com **limitação terapêutica** documentada e prompt de escalada | VAL-0010 |
| C-10 | Dado **corrigido** após a criação do item de trabalho | VAL-0022 |

**INFERENCE:** C-09 e C-10 são acréscimos deste kit ao piso do ciclo 0. C-09 testa o caso em
que a V2 pode estar *tecnicamente correta e clinicamente errada*
(`../../01-vision-and-intended-use/intended-use-statement.md` IU-07) — o único cenário do
conjunto em que a resposta desejada pode ser "o sistema deveria calar-se".

---

## 6. Mapeamento item-a-item — os 43 itens do backlog G1

**SOURCE** (`../g1-validation-backlog.md:45-57`): o backlog contém **43 itens**, dos quais
**42 bloqueiam o Gate G1**; o único não-bloqueante do G1 é `VAL-0038`, que "bloqueia a
ratificação de métrica em vez do G1 em si". A tabela abaixo cobre **todos os 43**.

**Legenda de cobertura:**
- **C** — Coberto: o instrumento nomeado produz a evidência que o item exige.
- **I** — Insumo: o instrumento produz evidência necessária, mas o item fecha por **decisão
  humana** que a pesquisa não pode tomar.
- **N** — Não coberto por este kit, com o porquê declarado.

| ID | Item (resumo) | Cob. | Instrumento / momento que responde | Nota |
|---|---|:--:|---|---|
| VAL-0001 | Aprovador nomeado do uso pretendido | **N** | — | Ato de nomeação, não pesquisa. Parcialmente endereçado por `GDEC-0003` (nomeação estreita, ciclo 1); `BLK-0008` segue OPEN. Nenhum estudo o fecha |
| VAL-0002 | Dono nomeado de segurança clínica | **N** | — | Idem; `BLK-0002` segue OPEN. `AUTH-CLINSAFETY` é pré-condição de M3 (§5.1), logo este item **bloqueia** parte do kit |
| VAL-0003 | Dono nomeado de privacidade/jurídico | **N** | — | Idem. **Bloqueia todo o trabalho de campo** (`../user-research-plan.md` §5). `DEC-G0-03` reclassificou o papel e condicionou dado real a parecer jurídico brasileiro; a pesquisa com participantes humanos **não** é dado sintético e recai nessa condição |
| VAL-0004 | Dono de UX **e** moderador independente | **I** | `plano-de-recrutamento-e-etica.md` §8 (perfil do moderador, matriz de independência) | O kit especifica a estrutura de independência exigida; **nomear as duas pessoas é ato humano** |
| VAL-0005 | Comissionar observação **ou** aceitar o risco | **I** | `pedido-de-comissionamento.md` (inteiro) | O kit torna a rota "comissionar" executável com um único ato; a escolha entre as duas rotas é do titular |
| VAL-0006 | Pediátrico em escopo? | **N** | (insumo tangencial: `F-UNI` U-Q3) | Decisão clínica de escopo. A triagem registra se a unidade admite adolescentes/pediátricos em leito adulto — fato organizacional que informa a **necessidade de enforcement**, não a decisão |
| VAL-0007 | Neonatal em escopo? | **N** | — | Decisão clínica. Nenhuma observação de UTI adulta a informa |
| VAL-0008 | Comportamento fora da população / idade desconhecida | **I** | M3 cenário **C-07**; E-MED Q9, E-ENF Q9 | A pesquisa mede se a não-avaliação é **compreendida**; o comportamento exigível é decisão de `AUTH-CLINSAFETY` |
| VAL-0009 | Quais cenários assistenciais são aprovados | **I** | §3.1–3.3 (`F-UNI` U-Q6); M7; E-COORD Q3 | A pesquisa mostra como o trabalho atravessa fronteiras de setor; a aprovação por cenário é de `AUTH-INTENDED-USE` |
| VAL-0010 | Subpopulações excluídas (obstétrica, ECMO/TRRC, pós-op cardíaco, paliativo) | **I** | `F-UNI` U-Q5; M3 cenário **C-09**; E-MED Q11 | O caso paliativo é o único em que a resposta pode ser "o sistema deve calar-se"; a decisão é clínica |
| VAL-0011 | Advisory apenas, e isso é **imposto** e não apenas declarado | **I** | M3 (todos os cenários; observação do que o participante faz com a recomendação); E-MED Q12 | Evidência sobre como o output é lido; a declaração e o enforcement são decisão + arquitetura |
| VAL-0012 | Quem monitora | **C** | M1 (todas as sessões); ficha `F-EVT` campo "origem do conhecimento"; E-todos Q1–Q3 | — |
| VAL-0013 | Quem age; fronteira de ação enfermeiro/médico | **C**/**I** | M1; M7 (protocolos locais); E-ENF Q5, E-MED Q5 | **Parte N:** a revisão das normas de escopo de prática (COFEN/CFM) é tarefa normativa jurídico-clínica, **fora** deste kit e do escopo de um pesquisador de campo |
| VAL-0014 | Quem é dono da escalada | **C** | M1; M2; E-todos Q6; ficha `F-ESC` (cadeia observada de escalada) | Item de confiança "muito baixa" no ciclo 0 — prioridade de saturação |
| VAL-0015 | Quem encerra o trabalho; pode encerrar quem não agiu | **C** | M1; M2; M3 **C-08**; E-todos Q7 | — |
| VAL-0016 | Titularidade em troca de turno e em indisponibilidade | **C** | M2 (foco central); M3 **C-08**; E-COORD Q6 | — |
| VAL-0017 | Quem pode alterar limiares clínicos; é clínico ou técnico | **C** | M7; `F-UNI` U-Q13; E-ADM (integral) | — |
| VAL-0018 | O que ocorre na passagem; o que acontece com itens não resolvidos | **C** | M2 (integral); ficha `F-PASS` | Lacuna estrutural do legado (nenhuma jornada de passagem) |
| VAL-0019 | Existe janela em que ninguém é dono do item | **C** | M2, medição explícita da janela (ficha `F-PASS` campos T1–T4) | Desenho de medição em `guias-…` §3.4 |
| VAL-0020 | Taxa de interrupção medida; tarefas ininterrompíveis | **C** | M1 + **B2** (perecível); E-todos Q8 | A **taxa** é perecível; a classificação de tarefas ininterrompíveis exige `AUTH-CLINSAFETY` |
| VAL-0021 | O que fazer quando a V2 está degradada; há fallback praticado | **C**/**I** | M7 (`F-UNI` U-Q10 + documento de contingência); M3 **C-05**/**C-06**; E-todos Q10 | **Parte I:** o comportamento clínico exigível em modo degradado é decisão de `AUTH-OPERATIONS` + `AUTH-CLINSAFETY` e depende do desenho de falhas |
| VAL-0022 | Como conflitos são resolvidos hoje; o que a V2 deve fazer | **C**/**I** | M1 (registro de ocorrência de conflito); M3 **C-04** e **C-10**; E-todos Q11 | A política da V2 é decisão clínica |
| VAL-0023 | Janela de frescor por insumo; o que invalida vs. degrada | **I** | E-MED Q13, E-ENF Q13 ("a partir de quando este valor deixa de te servir?") | Decisão clínica versionada por regra (`AUTH-CLINSAFETY`); a pesquisa fornece a intuição clínica de campo, não a política |
| VAL-0024 | Dispositivos, posicionamento físico, tamanho da unidade, ambiente | **C** | M1 + ficha `F-AMB` (§`guias-…` §2.5); planta simples da unidade sem identificação de paciente | Inclui a questão de privacidade: quem mais enxerga a tela |
| VAL-0025 | Workarounds existentes (papel, quadro, mensageria) | **C** | M4 (integral) + registro contínuo em M1 | Ciclo 0: workaround é a evidência mais forte de necessidade real não atendida |
| VAL-0026 | A lista "nunca-normal" está correta e completa | **C**/**I** | M1 (estados que a unidade já distingue); M3 **C-01**, **C-02**; E-todos Q14 | A ratificação da lista é de `AUTH-CLINSAFETY` |
| VAL-0027 | Clínicos interpretam "não avaliado" como "olhe isto" | **C** | M3, teste de compreensão **CT-01** (elicitação aberta → escolha forçada) | Núcleo do G1 quanto a representação de segurança |
| VAL-0028 | Como sinalizar degradação sem virar novo problema de alarme | **C** | M3 **C-05**; E-todos Q10b | — |
| VAL-0029 | Que explicação permite **discordar** com confiança | **C** | M3 **C-03**; E-MED Q15, E-ENF Q15 | O ciclo 0 registra que nenhuma evidência legada trata da desconfiança apropriada |
| VAL-0030 | Item de trabalho em alta, transferência, óbito, merge de identidade | **I** | E-todos Q16 (o que **deve** acontecer, na visão do clínico) | Decisão clínica + resolução do modelo de identidade; a pesquisa fornece a expectativa clínica |
| VAL-0031 | Termos clínicos pt-BR são interpretados como pretendido | **C** | M3 **CT-01**/**CT-02**; M1 (vocabulário espontâneo registrado verbatim) | O termo `não avaliado` é testado nominalmente |
| VAL-0032 | Qual vocabulário de severidade é correto em pt-BR | **C**/**I** | M1 (o que a unidade diz espontaneamente); M3 **CT-02** (escolha forçada entre vocabulários) | A ratificação do vocabulário é de `AUTH-CLINSAFETY` + `AUTH-UX`; ver ADR-0029 |
| VAL-0033 | Usuários de TA conseguem completar as tarefas do loop | **C** | M5 (integral, com usuários **reais** de TA) | Se o piso de 3 participantes não for atingível, o item permanece **NÃO TESTADO** — jamais simulado |
| VAL-0034 | Que necessidades de acessibilidade existem na força de trabalho real | **C** | M8 (censo anônimo agregado) + M1 (observação de adaptações em uso) | Survey admitida apenas como suplemento |
| VAL-0035 | 🚩 **Baseline pré-V2**: tempo até reconhecimento, carga de alertas, fadiga, interrupção | **C** | **`protocolo-baselines-pereciveis.md`** (B1–B4), fase **F1** | **Perecível e irrecuperável.** Ver ambiguidade registrada em §9.1 |
| VAL-0036 | Definição pré-registrada de "deterioração" para adjudicação | **N** | — | Ato clínico de pré-registro (`AUTH-CLINSAFETY`). **É pré-requisito do componente B4** — sem ele, B4 não pode ser pontuado sem risco de ajuste post hoc |
| VAL-0037 | Base legal para adjudicação de desfecho e análise de subgrupo | **N** | — | Determinação jurídica (OS-16 / `DEC-G0-03`). Bloqueia B4 e qualquer uso de prontuário |
| VAL-0038 | Metas de tempo-até-decisão que os clínicos de fato sustentam | **C** | M1 (análise de tarefa cronometrada); M3 (tempo até decisão por cenário); E-todos Q17 | Único item que **não** bloqueia o G1 (bloqueia ratificação de métrica) |
| VAL-0039 | Sítio(s) e patrocinador clínico nomeado | **I** | `plano-de-recrutamento-e-etica.md` §2 (perfil de sítio, roteiro de aproximação, carta de anuência) | Nomear sítio e patrocinador é ato humano |
| VAL-0040 | Submissão ética (CEP/CONEP) é exigida? Qual a rota | **I** | `plano-de-recrutamento-e-etica.md` §5 (rota candidata e o que a determina) | A determinação é jurídico-ética, não do pesquisador |
| VAL-0041 | Base LGPD para observar clínicos; exposição incidental a dado de paciente | **I** | `plano-de-recrutamento-e-etica.md` §6 + regras sem PHI de `guias-…` §1 | O kit entrega o protocolo de campo sem PHI; a base legal é determinação jurídica |
| VAL-0042 | Consentimento em que recusar é invisível e sem custo | **I** | `plano-de-recrutamento-e-etica.md` §7 (desenho de recusa invisível + revisão com liderança de enfermagem) | Desenho proposto; validação com a liderança do sítio é obrigatória |
| VAL-0043 | Compradores e stakeholders de governança; o que valorizam | **C** | M6 (sessões separadas das clínicas) | — |
| — | **G2-VAL-0025** (backlog G2; mesmo objeto de medição de VAL-0035) | **C** | **`protocolo-baselines-pereciveis.md`** (B1–B4) | Ver §9.1: os dois IDs descrevem a **mesma** medição em dois registros |

### 6.1 Contagem de cobertura

**INFERENCE (aritmética sobre a tabela acima):**

| Situação | Itens | Quais |
|---|:--:|---|
| **C** — coberto por instrumento | 19 | VAL-0012, 0014, 0015, 0016, 0017, 0018, 0019, 0020, 0024, 0025, 0027, 0028, 0029, 0031, 0033, 0034, 0035, 0038, 0043 |
| **C/I** — parte coberta, parte decisão | 5 | VAL-0013, 0021, 0022, 0026, 0032 |
| **I** — insumo produzido; fecha por decisão humana | 12 | VAL-0004, 0005, 0008, 0009, 0010, 0011, 0023, 0030, 0039, 0040, 0041, 0042 |
| **N** — não coberto, com porquê | 7 | VAL-0001, 0002, 0003, 0006, 0007, 0036, 0037 |
| **Total** | **43** | 42 bloqueiam o G1; `VAL-0038` bloqueia ratificação de métrica |

**INFERENCE — o padrão dos sete itens N:** nenhum é uma lacuna de método. Três são atos de
nomeação (VAL-0001/0002/0003), dois são decisões clínicas de escopo etário (VAL-0006/0007),
um é um ato de pré-registro clínico (VAL-0036) e um é um parecer jurídico (VAL-0037). **Nenhuma
quantidade de pesquisa os substitui**, e desenhar mais pesquisa para "cobri-los" seria produzir
documento no lugar de decisão — o padrão de falha que o ciclo 0 identificou no sistema legado.

---

## 7. Condução, equipe e independência

### 7.1 Papéis da equipe de pesquisa

| Papel | Responsabilidade | Restrição |
|---|---|---|
| **Moderador/pesquisador principal** | Desenho de execução, condução de M1/M2/M3/M5/M6, análise | Externo; **não pode** ser o dono da aceitação nem autor das hipóteses sob teste |
| **Observador secundário** | Segunda contagem em sessões de calibração; registro de B1/B2 | Treinado no mesmo instrumento |
| **Consultor clínico de realismo** | Revisão de plausibilidade dos cenários de M3 | Sem papel na aceitação dos achados |
| **Ponto focal do sítio** | Acesso, escala, comunicação com equipes | Do sítio, não do estudo |
| **Dono da aceitação (`AUTH-UX`)** | Aceitar ou rejeitar os achados | **Não observa, não modera, não é participante** (`DEC-G0-05`) |

### 7.2 Formação mínima do moderador (PROPOSAL)

Experiência demonstrável em métodos observacionais em ambiente clínico ou de alto risco;
familiaridade com terminologia de terapia intensiva suficiente para acompanhar sem
interromper; capacidade de conduzir em pt-BR; nenhuma relação de subordinação com a liderança
das unidades observadas. **VALIDATION REQUIRED** — o perfil é proposta; a seleção é de
`AUTH-UX` + `AUTH-PRODUCT`.

### 7.3 O titular como insumo de hipótese — regra operacional

**SOURCE** (`DEC-G0-05`): o conhecimento clínico do titular vale como insumo de hipótese,
nunca como evidência de observação do G1.

**PROPOSAL — regra operacional, para evitar contaminação:**

1. O titular **não é contado na amostra** de nenhum instrumento.
2. Se o titular fornecer conhecimento clínico ao estudo (esperado e útil), esse material é
   registrado em anexo separado, rotulado **INSUMO DE HIPÓTESE — NÃO É EVIDÊNCIA G1**, com
   data, e **não** entra nos relatórios de fluxo observado.
3. O titular **não assiste** às sessões de campo nem às sessões de M3 em tempo real.
   **INFERENCE:** a presença do dono da aceitação (que é também CEO) altera o que um
   profissional de saúde diz e faz; isso não é hipótese sobre esta pessoa, é propriedade
   conhecida de observação hierárquica.
4. Se a unidade observada tiver qualquer vínculo com o titular, isso é declarado no relatório
   como limitação, e a liderança local confirma por escrito que a participação não é
   comunicada a ele nominalmente (§`plano-de-recrutamento-e-etica.md` §7).

### 7.4 Controles de qualidade contra viés de confirmação

**PROPOSAL:**

| Controle | Como | Por quê |
|---|---|---|
| **Calibração inter-observador** | ≥2 sessões de M1 com dois observadores independentes; concordância reportada para contagem de interrupções e de alarmes (B1/B2) | Sem isso, uma contagem de interrupções é uma impressão com número |
| **Cegamento parcial às hipóteses** | O observador de campo recebe as fichas e os roteiros, **não** recebe `user-roles-hypotheses.md` / `workflow-hypotheses.md` antes do campo | **INFERENCE:** quem conhece a hipótese a encontra. As hipóteses entram na fase de análise (F5), não na de coleta |
| **Registro de desconfirmação** | Cada relatório de sessão contém um campo obrigatório "o que observei que contraria a expectativa" | Torna a desconfirmação um produto esperado, não um acidente |
| **Separação observação/interpretação** | Ficha de campo tem colunas fisicamente separadas para o observado e para a inferência | Ciclo 0 §8, item 1 |
| **Auditoria de saturação** | A decisão de parar acima do piso é registrada com a justificativa e os últimos achados novos | Impede parar no número |

---

## 8. Saídas e como os achados alteram o registro

**PROPOSAL — saídas obrigatórias (estendendo `../user-research-plan.md` §8):**

1. **Relatórios de fluxo observado**, por instrumento, separando observação de interpretação.
2. **Reconciliação de hipóteses**: cada hipótese de `../user-roles-hypotheses.md` e
   `../workflow-hypotheses.md` marcada CONFIRMADA / REFUTADA / MODIFICADA / **NÃO TESTADA**.
3. **Revisões propostas** a `../../01-vision-and-intended-use/intended-use-statement.md`
   §§1–5 onde a observação contradiga a minuta — propostas, não aplicadas.
4. **Blueprint de serviço** do fluxo de trabalho atual.
5. **Relatório de baseline** (F1), autônomo, entregue **antes** dos demais (ver §8.1).
6. **Atualização proposta do `../g1-validation-backlog.md`**, fechando itens respondidos e
   **adicionando os descobertos**. **INFERENCE:** um estudo que não adiciona nenhum item novo
   ao backlog provavelmente não observou nada que o escritório já não soubesse.
7. **Registro de participação e de recusa em forma agregada** — nunca nominal (§`plano-…` §7).

### 8.1 Regra de entrega antecipada do baseline

**PROPOSAL:** o relatório de F1 é entregue e arquivado assim que F1 termina, **independentemente
do andamento das demais fases**. **INFERENCE:** um baseline capturado e não relatado é
equivalente a um baseline perdido se o estudo for interrompido; o dado perecível deve chegar ao
registro imutável no momento em que existe.

### 8.2 O que o estudo nunca pode ser representado como

**SOURCE** (`../user-research-plan.md` §7) — reafirmado aqui como cláusula de contrato do
kit. A pesquisa nunca pode ser representada como: completa, se observação noturna/fim de
semana/passagem não ocorreu; generalizável, se conduzida em sítio único; validação de um
desenho, quando foi conduzida para descobrir o problema; endosso de clínicos, quando foi
observação; satisfação do Gate G1, se qualquer item de consentimento do ciclo 0 §5 permanecer
aberto.

### 8.3 Registro de saturação

**PROPOSAL:** ao fim de cada semana de campo, o moderador registra, por questão de pesquisa,
se a semana produziu variação nova. A parada exige duas semanas consecutivas sem variação nova
na questão em causa, **acima** do piso amostral de §4.2, e é registrada com justificativa.

---

## 9. Ambiguidades registradas e condições de parada

### 9.1 `VAL-0035` e `G2-VAL-0025` descrevem a mesma medição sob dois IDs

**OBSERVED** (`../g1-validation-backlog.md:167`): `VAL-0035` — "What is the pre-V2 baseline for
time-to-recognition, alert burden, fatigue, and interruption?"

**OBSERVED** (`../../05-clinical-safety/pathway-portfolio/g2-validation-backlog.md:151`):
`G2-VAL-0025` — "**Measure the pre-V2 baseline** for alert burden, fatigue, interruption and
time-to-recognition — **BEFORE ANY DEPLOYMENT**", que cita `VAL-0035` como fundamento.

**INFERENCE:** são o **mesmo objeto de medição**, registrado em dois backlogs (G1 e G2), com as
mesmas quatro medidas em ordem diferente. Este kit trata os dois com **um único protocolo**
(`protocolo-baselines-pereciveis.md`) e propõe que os registros se referenciem mutuamente em
vez de gerar duas coletas.

**VALIDATION REQUIRED — ambiguidade não resolvível pelo kit:** nenhum dos dois registros define
a **operacionalização** de "tempo até reconhecimento" no pré-V2. Existem ao menos duas leituras
incompatíveis em custo, base legal e validade:

| Leitura | O que mede | Requer |
|---|---|---|
| **(i) Proxy observacional** | Intervalo entre o primeiro sinal alterado *presenciado pelo observador* e a primeira ação/verbalização clínica dirigida a ele | Apenas observação; sem prontuário; sem base legal para dado de paciente |
| **(ii) Verdade adjudicada** | Intervalo entre o "momento mais precoce detectável" (retrospectivo, adjudicado) e a ciência clínica documentada | Prontuário, base legal (`VAL-0037`), rubrica pré-registrada (`VAL-0036`), painel cego |

**PROPOSAL do kit:** desenhar as duas como componentes distintos — **B4a** (proxy
observacional, executável em F1) e **B4b** (adjudicada, condicionada a `VAL-0036` +
`VAL-0037`) — e declarar que **apenas B4a é perecível**. Detalhamento e viés conhecido em
`protocolo-baselines-pereciveis.md` §5. Esta interpretação é do kit, **não** dos registros, e
`AUTH-UX` + `AUTH-CLINSAFETY` devem ratificá-la ou substituí-la.

### 9.2 Condições de parada deste protocolo

**PROPOSAL — o estudo para (não "continua com ressalva") se:**

1. `AUTH-PRIVACY-LEGAL` permanecer sem titular **e** o parecer jurídico brasileiro (OS-16,
   `DEC-G0-03`) não cobrir a pesquisa com participantes humanos — o ciclo 0 §5 declara todo o
   trabalho de campo bloqueado até o fechamento dessa seção.
2. O sítio condicionar o acesso à identificação nominal de participantes à gestão
   (incompatível com `VAL-0042`).
3. `AUTH-CLINSAFETY` não estiver disponível para ratificar o realismo dos cenários — nesse
   caso **F3 para**; F1, F2 e F4 podem prosseguir.
4. A observação contradisser o fluxo de trabalho proposto — **SOURCE**
   (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md`, condições de parada): parar quando "representative
   user validation contradicts the proposed workflow". **INFERENCE:** parar aqui significa
   parar o *desenho da solução*, não a pesquisa; a contradição é o produto.

---

## 10. Referências cruzadas

- `guias-de-observacao-e-entrevista.md` — os roteiros e fichas citados por código nesta tabela.
- `protocolo-baselines-pereciveis.md` — B1–B4, o item de maior urgência.
- `plano-de-recrutamento-e-etica.md` — sítio, participantes, consentimento, independência.
- `pedido-de-comissionamento.md` — o ato único que o titular precisa executar.
- `../user-research-plan.md` — o plano do ciclo 0 que este protocolo executa.
- `../g1-validation-backlog.md` — os 43 itens (42 bloqueantes).
- `../user-roles-hypotheses.md`, `../workflow-hypotheses.md` — as hipóteses sob teste.
- `../../01-vision-and-intended-use/intended-use-statement.md` — a declaração que o estudo testa.
- `../../00-governance/registers/g0-resolucoes-2026-08-15.md` — `DEC-G0-05`, `DEC-G0-03`, `DEC-G0-10`.
- `../../00-governance/decision-rights.md` §3 — par de independência #5.
