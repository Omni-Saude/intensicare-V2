---
doc_id: USR-G1KIT-GUIAS
title: IntensiCare V2 — Guias de observação e entrevista do Gate G1 (por papel)
status: PROPOSAL
label: PROPOSAL
approver: UNASSIGNED — VALIDATION REQUIRED
approver_roles:
  - AUTH-UX (aceitação do instrumento)
  - AUTH-PRIVACY-LEGAL (regras de registro sem PHI — BLOQUEANTE)
  - AUTH-CLINSAFETY (realismo clínico dos cenários de M3)
owner: UNASSIGNED — VALIDATION REQUIRED
validation_status: VALIDATION REQUIRED
last_updated: 2026-08-15
provenance:
  source_repo: intensicare-V2
  path_or_url: docs/02-users-and-workflows/g1-kit/guias-de-observacao-e-entrevista.md
  commit_sha_or_version: 0c36f03 (HEAD de cycle-1/clinical-content na redação; arquivo novo, não commitado)
  section_or_lines: documento inteiro
  date_collected: 2026-08-15
  collector: líder de pesquisa contextual de UTI (ciclo 2)
  transformation: >
    Instrumentos redigidos a partir das "questions observation must answer" de
    user-roles-hypotheses.md e workflow-hypotheses.md, dos 43 itens do g1-validation-backlog.md
    e das restrições de método e de privacidade de user-research-plan.md §§2.2, 5.
    Nenhuma pergunta pressupõe a existência do produto.
  confidence: medium
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
evidence_inputs:
  - repo: intensicare-V2
    path: docs/02-users-and-workflows/workflow-hypotheses.md
    commit: 0c36f03
    lines_used: "69-352 (WF-01..WF-08, listas 'questions observation must answer')"
  - repo: intensicare-V2
    path: docs/02-users-and-workflows/user-roles-hypotheses.md
    commit: 0c36f03
    lines_used: "63-230 (UR-01..UR-08)"
  - repo: intensicare-V2
    path: docs/02-users-and-workflows/user-research-plan.md
    commit: 0c36f03
    lines_used: "89-101 (métodos excluídos), 180-218 (consentimento, ética, protocolo sem PHI)"
---

# Guias de observação e entrevista — Gate G1

> **STATUS: PROPOSAL.** Nenhum guia abaixo foi aplicado a ninguém. Nenhum participante existe.
>
> Este documento é o material de campo que acompanha `protocolo-pesquisa-g1.md`. Os códigos de
> ficha (`F-EVT`, `F-AMB`, `F-PASS`, `F-ESC`, `F-ART`) e de pergunta (`Q1`…`Q17`, `CT-01`,
> `CT-02`) são referenciados por aquele protocolo, em especial pela tabela de mapeamento §6.

## 1. Regras de registro — obrigatórias, sem exceção

**SOURCE** (`../user-research-plan.md` §5, C5): protocolo sem PHI — "no photography, no screen
capture of live systems, no recording of patient identifiers; notes de-identified at the point
of capture".

**SOURCE** (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md` §3, regra 12): proibido colocar PHI,
credenciais, identificadores de paciente ou payloads clínicos brutos em prompts, controle de
versão, logs, traços, fixtures, capturas de tela, tíquetes ou mensagens de agente.

**INFERENCE** (do ciclo 0 §5, nota sobre C5): a regra sem PHI é um limite **de método**, não
apenas de armazenamento. Observar um clínico lendo dados de um paciente necessariamente expõe o
pesquisador a esses dados. O que se regula, portanto, é **o que pode ser escrito**.

### 1.1 Codificação obrigatória

| Entidade | Código | Regra |
|---|---|---|
| Instituição | `I-01`, `I-02`, … | Nome jamais escrito na ficha de campo |
| Unidade | `U-01`, `U-02`, … | Idem |
| Participante | `P-01`, `P-02`, … | Sequencial global; a chave nome↔código, **se existir**, é mantida pelo sítio, fora do material do estudo, e destruída conforme `plano-de-recrutamento-e-etica.md` §9 |
| Sessão | `SES-01`, `SES-02`, … | Uma sessão = um participante sombreado, uma janela contínua |
| Evento observado | `EV-001`, … | Sequencial dentro da sessão |
| Artefato/workaround | `ART-01`, … | Por unidade |

### 1.2 Proibições de registro (lista fechada; a dúvida resolve-se por não escrever)

**Nunca registrar:** nome, iniciais, data de nascimento, idade exata, número de prontuário,
CPF, cartão do SUS, número de leito **associado a qualquer detalhe clínico**, diagnóstico,
valor laboratorial ou de sinal vital de um paciente real, sexo combinado com outro atributo
identificável, nome de familiar, imagem, captura de tela, gravação de áudio de conversa
clínica, número de conselho profissional (CRM/COREN), escala nominal, qualquer citação
verbatim que identifique alguém pelo conteúdo.

**Nunca fotografar nem gravar tela.** Artefatos (quadros, listas de papel) são registrados por
**transcrição estruturada de campos** (§4.2), nunca por imagem, mesmo que o participante
ofereça.

### 1.3 O que substitui o dado proibido

| Em vez de | Registrar |
|---|---|
| Hora de relógio | **Tempo relativo** ao início da sessão (`mm:ss`) |
| "leito 7, paciente com sepse" | "leito A (código local de sessão), episódio clínico não caracterizado" |
| Valor clínico | **Classe** do insumo ("um valor de sinal vital", "um resultado laboratorial"), sem número |
| Citação identificável | Paráfrase, ou citação com todos os elementos identificadores removidos e marcada `[parafraseado]` |
| Nome da unidade | `U-nn` |

**INFERENCE:** registrar tempo relativo em vez de hora de relógio elimina a via de
re-identificação mais provável (cruzar hora + unidade + evento com o prontuário), sem custo
metodológico: todas as medidas de interesse são **intervalos**, não instantes absolutos.

### 1.4 Conduta em campo

1. **Não interferir.** O observador não presta assistência, não opina, não responde a pergunta
   clínica. Se solicitado, responde que está observando e não pode contribuir clinicamente.
2. **Ceder espaço.** Em emergência, o observador se afasta imediatamente e registra apenas
   "afastamento por emergência" com tempo relativo; nenhum detalhe do episódio é registrado.
3. **Interromper a observação** a qualquer pedido do participante, do paciente ou do familiar,
   sem exigir justificativa, e registrar apenas "observação encerrada a pedido".
4. **Presença junto ao leito** apenas com a anuência prevista em `plano-de-recrutamento-e-etica.md`
   §6 (abordagem a paciente/família).
5. **Ficha em papel ou dispositivo do estudo**, nunca dispositivo pessoal; guarda conforme
   `plano-…` §9.
6. **Revisão de fim de sessão:** antes de sair do sítio, o observador relê a ficha e risca
   qualquer elemento que se aproxime da lista de §1.2. A regra é riscar, não avaliar risco.

---

## 2. M1 — Roteiro de observação de plantão (sombreamento / inquérito contextual)

**Objetivo:** registrar o trabalho como ele acontece — sequência real de tarefas, contexto
físico, dispositivos, interrupções, handoffs, workarounds e o percurso do reconhecimento de
uma alteração clínica.

**Unidade de observação:** um profissional, uma janela contínua de ≥4 h. Não se sombreia um
leito nem um paciente.

### 2.1 Abertura da sessão (≤5 min)

Texto sugerido, a ser lido ao participante:

> "Eu vou acompanhar o seu trabalho, não avaliar. Não anoto nada de paciente — nem nome, nem
> número, nem valor. Anoto o que você faz, em que ordem, com o quê, e o que te interrompe. Você
> pode me pedir para parar ou para sair a qualquer momento, sem precisar explicar, e isso não é
> comunicado a ninguém. De vez em quando eu posso te perguntar 'o que você está fazendo agora?'
> — se não for hora, é só dizer."

### 2.2 O que registrar continuamente — ficha `F-EVT`

Uma linha por evento. Colunas **fisicamente separadas** entre observado e inferido.

| Campo | Conteúdo | Domínio |
|---|---|---|
| `EV` | Código sequencial | `EV-001`… |
| `t` | Tempo relativo de início | `mm:ss` |
| `dur` | Duração | `mm:ss` |
| `tarefa` | Categoria da tarefa | avaliação de paciente / procedimento / registro em prontuário / comunicação com colega / busca de informação / medicação / passagem de informação / deslocamento / pausa / outro |
| `local` | Onde | beira do leito / posto / corredor / sala de prescrição / fora da unidade |
| `disp` | Dispositivo em uso | nenhum / computador fixo / computador móvel / tablet / celular pessoal / celular institucional / papel / monitor à beira do leito / telefone |
| `maos` | Condição das mãos | livres / com luva / ocupadas / higienizando |
| `interr` | Houve interrupção? | sim/não |
| `int_fonte` | Fonte da interrupção | pessoa presencial / telefone / alarme de monitor / alarme de bomba / sistema / autoiniciada / outro |
| `int_dur` | Duração da interrupção | `mm:ss` |
| `retomada` | A tarefa foi retomada? | sim, do ponto / sim, do início / não / não observável |
| `origem` | **Como o profissional soube** do que motivou a tarefa | percepção própria à beira do leito / colega falou / alarme / tela / papel/quadro / mensagem / rotina de horário / não observável |
| `workaround` | Artefato não institucional usado | código `ART-nn` ou vazio |
| `verbatim` | Frase curta parafraseada, se relevante | texto sem identificadores |
| `INF` | **Coluna separada**: inferência do observador | texto, sempre prefixado `INF:` |

**INFERENCE sobre a coluna `origem`:** ela é a medida direta da hipótese central de "quem
monitora" (`VAL-0012`) e do enquadramento de WF-01 (superfície de vigilância vs. de
reorientação). Se a origem predominante do conhecimento for "colega falou" ou "percepção
própria", a hipótese de que a UTI monitora telas está refutada por contagem, não por opinião.

### 2.3 Amostragem de tempo dentro da sessão

**PROPOSAL:** além do registro contínuo de eventos, o observador faz uma marcação instantânea a
cada 10 minutos (`F-EVT` linha marcada `SNAP`) do que o participante está fazendo, onde e com
qual dispositivo. **INFERENCE:** o registro contínuo tende a super-representar eventos salientes
(interrupções dramáticas) e sub-representar trabalho contínuo silencioso; a amostragem
instantânea corrige esse viés e é o que sustenta qualquer proporção de tempo relatada.

### 2.4 O que perguntar durante o sombreamento (perguntas de contexto, ≤15 s)

Somente estas quatro, e apenas em momento oportuno:

1. "O que você está procurando agora?"
2. "Como você soube disso?"
3. "O que você faria se isso não estivesse disponível?"
4. "Isso é o habitual ou é excepcional?"

**Proibido durante o sombreamento:** qualquer pergunta sobre software futuro, utilidade, ou
preferência. Essas pertencem à entrevista pós-sessão (§10) e mesmo lá são restritas.

### 2.5 Ficha `F-AMB` — ambiente e dispositivos (uma por unidade, revisada por sessão)

Responde `VAL-0024`.

| Campo | Conteúdo |
|---|---|
| Número de leitos; leitos com monitor contínuo | inteiro |
| Telas de uso clínico: quantidade, tipo (fixa/móvel/mural), localização | lista |
| Distância típica do leito mais distante ao posto (passos ou metros) | número |
| Quem enxerga cada tela de onde: profissionais, pacientes, acompanhantes, público | descrição por tela |
| Ruído ambiental: presença de alarmes audíveis simultâneos (contagem em 3 janelas de 10 min) | contagem |
| Iluminação noturna e legibilidade declarada | descrição |
| Dispositivos pessoais em uso clínico (celular próprio) | sim/não + para quê |
| Rede: existe conectividade sem fio na beira do leito? Falhas relatadas | sim/não + relato |
| Uso de luvas ao operar tela; existe higienização entre uso e paciente | descrição |
| Tamanho da unidade em relação à visão de conjunto: é possível ver todos os leitos de um ponto? | sim/não |

**INFERENCE:** "quem enxerga cada tela de onde" é simultaneamente um requisito de usabilidade e
um achado de privacidade. As duas leituras devem constar do relatório, porque uma tela mural
legível é um recurso clínico e um vazamento em potencial, e resolver uma piora a outra.

### 2.6 Ficha `F-ESC` — cadeia de escalada observada

Preenchida sempre que um episódio de escalada for presenciado. Responde `VAL-0014`.

| Campo | Conteúdo |
|---|---|
| Quem iniciou (papel, código `P-nn` se participante) | papel |
| Para quem escalou (papel) | papel |
| Canal | presencial / telefone / mensageria / ramal / anotação / outro |
| Tempo até resposta | `mm:ss` ou "sem resposta na janela" |
| Houve tentativa que não obteve resposta? Quantas? | contagem |
| Quem decidiu a conduta final (papel) | papel |
| Quem registrou o desfecho | papel / ninguém observado |
| O item ficou pendente ao fim do turno? | sim/não/não observável |

---

## 3. M2 — Roteiro de observação de passagem de plantão e de interrupção

**SOURCE** (`../workflow-hypotheses.md` WF-04): a lista de jornadas legada **não contém
nenhuma jornada de passagem de plantão**; a passagem é o momento de maior perda de informação e
maior risco de titularidade abandonada.

### 3.1 Antes de observar

Registrar (sem identificar pessoas): horário previsto, duração prevista, quem deve participar
por papel, local, artefato esperado.

### 3.2 Ficha `F-PASS` — estrutura da passagem

| Campo | Conteúdo |
|---|---|
| Tipo | enfermagem / médica / multiprofissional |
| Turno de origem → destino | diurno→noturno etc. |
| Participantes por papel (contagem, não nomes) | inteiros |
| Duração total | `mm:ss` |
| Tempo por paciente (média e dispersão; sem identificar pacientes) | `mm:ss` |
| Ordem de percurso | leito a leito / por gravidade / por lista / outro |
| Artefato usado | código `ART-nn` |
| Interrupções durante a passagem: contagem e fonte | contagem por fonte |
| Itens explicitamente transferidos ("fica pendente para você…"): contagem | inteiro |
| Itens mencionados sem destinatário explícito: contagem | inteiro |
| Houve retomada/conferência posterior do que foi passado? | sim/não |

### 3.3 Vocabulário — captura obrigatória

Registrar **verbatim, sem identificadores**, as expressões usadas para: gravidade, piora,
estabilidade, "não sei ainda", pendência, e para a ideia de "não deu para avaliar". Alimenta
`VAL-0031`, `VAL-0032` e a validação terminológica de ADR-0029.

### 3.4 Medição da **janela sem dono** (responde `VAL-0019`)

**PROPOSAL — instrumento explícito.** Marcar quatro instantes relativos:

| Marca | Definição observável |
|---|---|
| `T1` | Último ato assistencial do profissional de saída dirigido a um item pendente |
| `T2` | Início formal da passagem |
| `T3` | Fim formal da passagem |
| `T4` | Primeiro ato assistencial do profissional de entrada dirigido àquele item |

**INFERENCE:** `T4 − T1` é o candidato operacional para "janela em que ninguém é dono". Duas
armadilhas devem ser registradas em vez de resolvidas: (a) o profissional de saída pode
permanecer fisicamente presente sem estar engajado; (b) o profissional de entrada pode estar
engajado sem ter sido informado. A ficha registra ambos como observações separadas
(`presente mas desengajado: sim/não`, `agiu sem ter recebido: sim/não`) — a interpretação é da
fase de análise.

### 3.5 Observação de interrupção fora da passagem

Coberta pelo registro contínuo de `F-EVT` (§2.2, campos `interr*`), e é **também** a medida
perecível **B2** — ver `protocolo-baselines-pereciveis.md` §4.

---

## 4. M4 — Inventário de artefatos e workarounds

**SOURCE** (`../g1-validation-backlog.md`, VAL-0025): a observação de "current workarounds" é
exigida pelo prompt; nenhuma foi coletada para o sistema legado. **INFERENCE** (ciclo 0): um
workaround é a evidência mais forte disponível de uma necessidade real não atendida.

### 4.1 O que conta como artefato

Lista de papel, caderno pessoal, quadro branco, planilha, grupo de mensageria, etiqueta,
anotação em uniforme/luva, marcação no monitor, impressão de prontuário, cartão de bolso com
escores, protocolo plastificado, marcação física no leito.

### 4.2 Ficha `F-ART` — um registro por artefato (**transcrição estruturada; nunca foto**)

| Campo | Conteúdo |
|---|---|
| `ART` | Código | 
| Tipo | ver §4.1 |
| Quem mantém (papel) | papel |
| Quem lê (papéis) | papéis |
| **Campos que contém** (nomes das colunas/rubricas, **nunca os valores**) | lista |
| Frequência de atualização | descrição |
| O que ele responde que nenhum sistema responde | texto |
| O que acontece quando ele está errado/desatualizado | texto |
| É oficial, tolerado ou informal? | classificação |
| Sobrevive à passagem de plantão? | sim/não |
| Existe há quanto tempo (relato) | texto |

**INFERENCE — por que os *campos* e não os *valores*:** a estrutura do artefato é o achado (é a
especificação que a unidade escreveu para si mesma); os valores são dados de paciente. Registrar
os nomes das colunas de um quadro é seguro e é exatamente a informação de desenho relevante.

### 4.3 Pergunta obrigatória ao mantenedor do artefato

"Se eu tirasse isso de você amanhã, o que aconteceria?" — e, apenas depois da resposta
espontânea: "quem mais deixaria de saber alguma coisa?"

---

## 5. M7 — Revisão documental do sítio

**Objetivo:** capturar as regras que a instituição já escreveu, que restringem qualquer desenho
futuro. Nenhum documento é copiado para este repositório; registram-se **existência, escopo e
conteúdo relevante em paráfrase**, com referência ao documento do sítio.

| Documento | O que extrair | Item |
|---|---|---|
| Procedimento de contingência para indisponibilidade de sistemas | Existe? É praticado? Há registro de simulado? Quem decide acionar? | `VAL-0021` |
| Protocolo de escalada / time de resposta rápida | Critérios de acionamento, quem aciona, tempo esperado | `VAL-0014` |
| Política de alteração de limiares/parametrização de alarmes | Quem autoriza, com que registro, é clínico ou técnico | `VAL-0017` |
| Protocolos assistenciais que definem fronteira de ação de enfermagem | O que o enfermeiro pode iniciar sem prescrição | `VAL-0013` |
| Escala de trabalho (estrutura, **não** nomes) | Composição por turno, cobertura noturna e de fim de semana | `VAL-0012` |
| Rotina de passagem de plantão, se documentada | Estrutura prescrita vs. observada | `VAL-0018` |
| Normas locais sobre pacientes com limitação terapêutica | Como são sinalizados no processo de trabalho | `VAL-0010` |

**INFERENCE:** a comparação entre a rotina **prescrita** nos documentos e a **observada** em M1/M2
é, por si só, um achado — e é o tipo de achado que nenhuma entrevista produz, porque ninguém
descreve espontaneamente o desvio entre o que está escrito e o que se faz.

---

## 6. M3 — Roteiro de cenários simulados

**VALIDATION REQUIRED** — nenhuma sessão de M3 pode ocorrer sem (a) ratificação de realismo e
segurança clínica por `AUTH-CLINSAFETY`, (b) estímulo pronto, (c) delimitação inequívoca de que
nada é real (`../user-research-plan.md` §2.3). Cenários em `protocolo-pesquisa-g1.md` §5.3.

### 6.1 Abertura obrigatória

> "Nada aqui é um paciente real. Nada do que você fizer nesta sala chega a qualquer sistema do
> hospital. Isto é um material de papel/tela feito para discussão, não é um produto e não está
> à venda. Eu não estou testando você — estou testando o material. Se ele confundir, a culpa é
> dele. Pode pensar em voz alta."

### 6.2 Protocolo por cenário

1. Apresentar o estímulo **sem explicá-lo**.
2. **Elicitação aberta** (antes de qualquer alternativa): "o que isso está te dizendo sobre
   este paciente?" / "o que você faria agora?" / "o que você ainda não sabe?"
3. Registrar **tempo até a primeira decisão verbalizada** (alimenta `VAL-0038`).
4. Perguntar: "o que aqui te faria **duvidar** do que está escrito?" (alimenta `VAL-0029`).
5. Somente ao final, se necessário para desambiguar: escolha forçada (§6.3).
6. Registrar reação a cenários de falha sem sugerir que houve falha.

**Proibido:** dizer ao participante que o sistema está errado, degradado ou obsoleto antes de
perguntar o que ele entendeu. **INFERENCE:** avisar antes converte um teste de detecção em um
teste de leitura, e o item em causa (`VAL-0027`) é justamente se a detecção ocorre sem aviso.

### 6.3 `CT-01` — teste de compreensão do estado "não avaliado"

Responde `VAL-0027` e `VAL-0031` — o item mais crítico do conjunto.

**Etapa 1 — aberta.** Mostrar um leito no estado não avaliado, sem legenda. Perguntar:
"o que você entende sobre este leito?" Registrar **verbatim parafraseado**.

**Etapa 2 — consequência.** "Se você tivesse dez leitos e cinco minutos, este entraria na sua
ronda? Em que posição?"

**Etapa 3 — escolha forçada.** Apresentar quatro leituras em ordem aleatória e pedir a mais
próxima:
(a) "está tudo bem com este paciente";
(b) "não há nada de novo para relatar";
(c) "o sistema não conseguiu avaliar — **você precisa olhar**";
(d) "o sistema está com defeito".

**Critério de aprovação (PROPOSAL, requer ratificação de `AUTH-CLINSAFETY`):** o termo só é
aceitável se a **etapa 1** (aberta) produzir a leitura (c) espontaneamente na maioria dos
participantes. **INFERENCE:** acertar apenas na etapa 3 demonstra que a alternativa correta é
reconhecível quando oferecida — o que não é a condição de uso real, em que ninguém oferece
alternativas.

**Registro adicional:** qual palavra o participante usa espontaneamente para esse estado.
Alimenta ADR-0029 e `VAL-0032`.

### 6.4 `CT-02` — vocabulário de severidade

Apresentar, em ordem aleatória e sem contexto de marca, os vocabulários candidatos registrados
como conflito no legado (`CRIT/URG/WARN/INFO` vs. `crítico/urgente/atenção/normal`) e o
vocabulário espontâneo capturado em M1/M2. Perguntar: ordenação por gravidade; qual conjunto
usaria na própria unidade; qual termo é ambíguo; o que "normal" comunica quando o sistema não
avaliou nada.

**INFERENCE:** a última pergunta é a que importa. Se "normal" for lido como "avaliado e sem
alteração", então usá-lo para um leito não avaliado é a falha de falsa tranquilidade descrita em
`../workflow-hypotheses.md` §1 — e o teste a expõe antes de qualquer linha de código.

---

## 7. M5 — Avaliação de tarefa com tecnologia assistiva

**Requisito absoluto (SOURCE, ciclo 0 §3):** usuários **reais** de TA; jamais simulados por
pesquisador vidente. Se o piso de participantes não for atingido, `VAL-0033` permanece **NÃO
TESTADO** e assim deve constar do relatório.

**Desenho:** tarefas do loop de segurança, com a TA que a pessoa já usa, no seu próprio
ajuste de configuração.

| Tarefa | O que se mede |
|---|---|
| Perceber que algo mudou em um conjunto de leitos | A mudança é anunciada? Em quanto tempo? |
| Identificar qual leito mudou e para qual estado | Ordem de leitura é compreensível |
| Distinguir "avaliado e normal" de "não avaliado" | Os dois estados são distinguíveis sem visão |
| Abrir a explicação de um item e localizar o que faltou | A informação de proveniência é alcançável |
| Registrar uma ação e uma discordância | O caminho de registro é completável |
| Perceber que o sistema está degradado | Degradação é anunciada ou apenas visual |

**Registro:** completou sem ajuda / completou com dificuldade / não completou; barreira
observada; tempo; verbalização. **INFERENCE:** medir por tarefa, e não por taxa de aprovação em
verificador automático, é o que distingue `HM-07` de uma auditoria de conformidade.

---

## 8. M6 — Entrevista com comprador e governança (E-GOV)

Conduzida **separadamente** das sessões clínicas, e nunca no mesmo dia na mesma unidade, para
que a participação clínica não seja associada a um processo de compra.

1. Descreva a última decisão de aquisição de um sistema clínico nesta instituição: quem
   participou e o que decidiu?
2. Que evidências foram exigidas antes da decisão? Alguma foi verificada depois?
3. Como o senhor(a) saberia, seis meses depois, que a decisão foi boa?
4. Que indicadores o senhor(a) precisa reportar, para quem, e com que periodicidade?
5. O que costuma dar errado entre a compra e o uso diário?
6. Quem, na prática, pode vetar a adoção de um sistema já comprado?
7. Que obrigação regulatória ou de acreditação incide sobre este tipo de sistema aqui?
8. O que o senhor(a) espera que a equipe assistencial ganhe? Como saberia se não ganhou?

**INFERENCE — o que se busca:** a distância entre o que é comprado e o que é usado
(`../user-roles-hypotheses.md` §3). A pergunta 8 existe para expor essa distância a partir da
própria fala do comprador, sem que o pesquisador a sugira.

---

## 9. M8 — Censo anônimo de necessidades de acessibilidade

**Suplemento, nunca método primário** (`../user-research-plan.md` §2.2). Instrumento curto,
anônimo, **agregado**, aberto a toda a equipe da unidade, entregue por canal que não passe pela
chefia.

Itens propostos (sim/não/prefiro não responder + campo livre opcional): uso de recurso de
ampliação, leitor de tela, contraste alto, legenda, aparelho auditivo em ambiente ruidoso,
adaptação para uso com uma das mãos, daltonismo autorreferido, dificuldade de leitura sob
iluminação noturna, dificuldade com telas pequenas em movimento.

**Regra de publicação:** resultado apenas agregado por unidade, e **somente** se houver ≥10
respostas — abaixo disso, o resultado é descrito qualitativamente sem números.
**INFERENCE:** em unidade pequena, uma contagem de "1 pessoa usa leitor de tela" identifica
essa pessoa.

---

## 10. Roteiros de entrevista semiestruturada

### 10.1 Regras de formulação

**PROPOSAL — toda pergunta deve satisfazer as quatro condições:**

1. **Ancorada em episódio real** já ocorrido, de preferência observado na sessão.
2. **Aberta** — não responde-se com sim/não (salvo as de checagem factual em `F-UNI`).
3. **Não indutora** — não contém a resposta, não nomeia um benefício, não pressupõe o produto.
4. **Sem futuro hipotético de software.**

**Formulações proibidas — exemplos, para que o proibido seja reconhecível:**

| Proibido | Por quê | Substituir por |
|---|---|---|
| "Você acharia útil um sistema que avisasse antes da piora?" | Induz e mede imaginação e polidez | "Conte a última vez em que percebeu uma piora. Como percebeu?" |
| "O quanto o cálculo manual de escore atrapalha o seu dia?" | Pressupõe que atrapalha | "Você calcula algum escore? Quando? O que faz com o resultado?" |
| "Você concorda que a passagem de plantão é o momento mais crítico?" | Pede concordância | "O que costuma se perder na passagem?" |
| "Este alerta faz sentido para você?" | Convida à cortesia | "O que você faria se isso aparecesse durante a sua ronda?" |
| "Você teria dificuldade em usar isto com luva?" | Sugere a resposta | "Como você usa a tela quando está de luva?" |

### 10.2 Núcleo comum `Q1`–`Q17` (todos os papéis clínicos)

Aplicado imediatamente após a sessão de M1, ≤30 min, ancorado no que foi observado.

| # | Pergunta | Item do backlog |
|---|---|---|
| Q1 | Descreva o seu turno de hoje da forma como você o dividiria em partes. | contexto |
| Q2 | Nas últimas semanas, qual foi a última vez que um paciente piorou no seu turno? Como você soube? | VAL-0012 |
| Q3 | Quem, além de você, precisava saber daquilo? Como soube? | VAL-0012, VAL-0014 |
| Q4 | Naquele episódio, o que você fez primeiro, e por quê primeiro? | VAL-0013, VAL-0038 |
| Q5 | O que você pode decidir e iniciar sozinho, e o que precisa de outra pessoa? | VAL-0013 |
| Q6 | Quando você precisa de alguém e não consegue, o que faz? Quantas tentativas até desistir ou mudar de caminho? | VAL-0014 |
| Q7 | Quando um assunto se encerra, quem o encerra? Alguém pode encerrar algo que não fez? | VAL-0015 |
| Q8 | O que mais te interrompe? O que você **não** aceita ser interrompido fazendo? | VAL-0020 |
| Q9 | Já aconteceu de um sistema mostrar algo sobre um paciente que não se aplicava a ele? O que você fez? | VAL-0008, VAL-0011 |
| Q10 | Quando um sistema do hospital cai, o que a unidade faz? Você já viveu isso? | VAL-0021 |
| Q10b | Como você gostaria de ficar sabendo que um sistema não está confiável naquele momento — e a partir de que ponto isso vira incômodo? | VAL-0028 |
| Q11 | Quando duas fontes discordam sobre o mesmo paciente, como você resolve? O que você olha? | VAL-0022 |
| Q12 | Quando um sistema sugere alguma coisa, o que isso significa para a sua responsabilidade? | VAL-0011 |
| Q13 | Pensando em um valor de sinal vital e num resultado de laboratório: a partir de quanto tempo cada um deixa de te servir para decidir? | VAL-0023 |
| Q14 | Que situações **nunca** deveriam parecer normais numa tela? | VAL-0026 |
| Q15 | O que você precisaria ver para **discordar** com segurança do que um sistema afirma? | VAL-0029 |
| Q16 | Quando um paciente recebe alta, é transferido ou morre, o que deveria acontecer com as pendências dele? | VAL-0030 |
| Q17 | Em quanto tempo você espera decidir algo depois de perceber que precisa decidir? O que faz esse tempo esticar? | VAL-0038 |
| Q-fim | O que eu não te perguntei e deveria ter perguntado? | — |

**INFERENCE sobre `Q-fim`:** é a única pergunta desenhada para detectar a limitação do próprio
instrumento. Respostas recorrentes a ela são um achado sobre o desenho da pesquisa e devem
constar do relatório, não apenas dos dados.

### 10.3 `E-MED` — acréscimos para médico intensivista

| # | Pergunta |
|---|---|
| Qm1 | Como se divide o trabalho entre diarista e plantonista aqui, para pacientes que pioram? |
| Qm2 | Quantos pacientes e quantas unidades ficam sob a sua responsabilidade, por turno e no fim de semana? |
| Qm3 | Quando você não está na unidade, como a informação te alcança? |
| Qm4 | Você costuma ser o primeiro a saber de uma piora, ou o segundo? |
| Qm5 | Em pacientes com limitação terapêutica definida, o que um sistema deveria fazer — e o que ele não deveria fazer? (`VAL-0010`) |
| Qm6 | Onde fica registrado que você agiu? Isso duplicaria algo que você já escreve? |
| Qm7 | O que você ensina a um residente sobre desconfiar de um número? |

### 10.4 `E-ENF` — acréscimos para enfermeiro assistencial

| # | Pergunta |
|---|---|
| Qe1 | Quantos pacientes por enfermeiro e por técnico, neste turno e à noite? |
| Qe2 | Onde você está fisicamente quando precisa saber de algo — e o que está ao alcance da sua mão ali? |
| Qe3 | Você calcula algum escore? Quando, para quê, e o que muda depois do resultado? |
| Qe4 | Quantos toques/segundos você tolera para registrar algo no meio de um cuidado? A partir de quanto você deixa para depois? |
| Qe5 | O que você anota fora do sistema? Por quê ali? |
| Qe6 | Quando você avisa o médico, o que você diz primeiro? |
| Qe7 | O que muda na sua noite quando a unidade está cheia? |

### 10.5 `E-TEC` — técnico de enfermagem

| # | Pergunta |
|---|---|
| Qt1 | Quem afere e registra os sinais vitais, com que frequência, e onde registra? |
| Qt2 | Quando um valor te chama atenção, o que você faz? A quem fala? |
| Qt3 | O que acontece entre você medir e alguém decidir alguma coisa? |
| Qt4 | Existe algum valor que te faz chamar alguém imediatamente, independentemente de rotina? |

**INFERENCE:** `Qt1` e `Qt3` testam a hipótese de papéis do ciclo 0 no ponto exato em que ela é
mais frágil — se o primeiro humano a ver um valor alterado for o técnico, o desenho de "quem
monitora" muda de destinatário.

### 10.6 `E-COORD` — enfermeiro coordenador / responsável de turno

| # | Pergunta |
|---|---|
| Qc1 | Como você sabe, agora, quais pacientes da unidade exigem mais atenção? |
| Qc2 | Você tem autoridade para redistribuir trabalho clínico, ou apenas para pedir? (`VAL-0015`) |
| Qc3 | Que setores além desta unidade estão sob a sua vista? (`VAL-0009`) |
| Qc4 | Que informação alguém te pede que você tem dificuldade de dar? |
| Qc5 | Você exporta ou compila dados para alguém? Com que frequência e para quê? (testa a hipótese comprador vs. usuário) |
| Qc6 | Na virada de turno, o que passa por você e o que passa direto entre as duplas? (`VAL-0016`) |

### 10.7 `E-FISIO` e demais profissionais de beira de leito

| # | Pergunta |
|---|---|
| Qf1 | Em que momentos do dia você está na unidade e o que precisa saber ao chegar? |
| Qf2 | Que informação sobre o paciente você busca, e onde? |
| Qf3 | Quando você percebe uma piora, a quem comunica e como? |
| Qf4 | O que a equipe descobre por você que não descobriria de outro jeito? |

### 10.8 `E-ADM` — administrador de limiares / TI clínica (responde `VAL-0017`)

| # | Pergunta |
|---|---|
| Qa1 | Que parâmetros clínicos o senhor(a) consegue alterar nos sistemas atuais? |
| Qa2 | Quem pede essas alterações, e qual é o registro do pedido? |
| Qa3 | Há aprovação clínica formal antes da alteração? De quem? |
| Qa4 | Já houve alteração de parâmetro feita por urgência operacional, sem passar por essa aprovação? O que aconteceu? |
| Qa5 | Como a equipe assistencial fica sabendo que um limiar mudou? |
| Qa6 | Existe registro de qual configuração estava vigente numa data passada? |

**INFERENCE sobre `Qa6`:** é a pergunta que revela se a instituição consegue reconstruir o que o
sistema afirmava no momento de uma decisão clínica. Se não conseguir, qualquer promessa de
auditabilidade da V2 enfrentará um ambiente que não a sustenta — achado de arquitetura obtido
por entrevista.

### 10.9 Encerramento de toda entrevista

1. "Existe algo que você me contou e prefere que não seja registrado?" — e retirar, sem
   discussão.
2. Reafirmar o direito de retirada posterior e o canal para exercê-lo
   (`plano-de-recrutamento-e-etica.md` §7.4).
3. Não prometer produto, prazo, funcionalidade nem retorno de resultado que não esteja
   comissionado.

---

## 11. Ficha de fim de sessão (obrigatória, ≤10 min, antes de sair do sítio)

| Campo | Conteúdo |
|---|---|
| Sessão, unidade, papel, turno | códigos |
| Duração observada | `hh:mm` |
| Contagem de eventos e de interrupções | inteiros |
| **O que observei que contraria a expectativa** | texto — campo obrigatório, não pode ficar vazio; "nada" exige justificativa |
| O que não consegui observar e por quê | texto |
| Momentos em que a minha presença pode ter alterado o comportamento | texto |
| Itens do backlog para os quais esta sessão produziu evidência | lista `VAL-nnnn` |
| Revisão sem PHI concluída | assinatura/código do observador |

**INFERENCE:** o campo de desconfirmação obrigatório é o principal controle de viés do
instrumento. Um conjunto de sessões em que ele venha sempre vazio indica que o observador está
codificando o esperado, não registrando o ocorrido.

---

## 12. Referências cruzadas

- `protocolo-pesquisa-g1.md` — desenho, amostragem e mapeamento dos 43 itens.
- `protocolo-baselines-pereciveis.md` — B1–B4; usa `F-EVT` e `F-AMB` como fonte.
- `plano-de-recrutamento-e-etica.md` — consentimento, recusa invisível, guarda de material.
- `../workflow-hypotheses.md`, `../user-roles-hypotheses.md` — as perguntas de origem.
- `../../06-architecture/adrs/ADR-0029-pt-br-clinical-terminology-validation-process.md` — processo de validação terminológica que `CT-01`/`CT-02` alimentam.
