---
doc_id: USR-G1KIT-RECRUTAMENTO-ETICA
title: IntensiCare V2 — Plano de recrutamento, consentimento e ética da pesquisa do Gate G1
status: PROPOSAL
label: PROPOSAL
approver: UNASSIGNED — VALIDATION REQUIRED
approver_roles:
  - AUTH-PRIVACY-LEGAL (rota ética, base legal, consentimento — BLOQUEANTE; papel SEM titular, DEC-G0-03)
  - AUTH-UX (desenho de recrutamento e aceitação dos achados — NÃO pode moderar, DEC-G0-05)
  - AUTH-PRODUCT (sítio, orçamento, compensação)
owner: UNASSIGNED — VALIDATION REQUIRED
validation_status: VALIDATION REQUIRED
last_updated: 2026-08-15
provenance:
  source_repo: intensicare-V2
  path_or_url: docs/02-users-and-workflows/g1-kit/plano-de-recrutamento-e-etica.md
  commit_sha_or_version: 0c36f03 (HEAD de cycle-1/clinical-content na redação; arquivo novo, não commitado)
  section_or_lines: documento inteiro
  date_collected: 2026-08-15
  collector: líder de pesquisa contextual de UTI (ciclo 2)
  transformation: >
    Requisitos C1..C8 de user-research-plan.md §5 convertidos em plano operacional de
    recrutamento e consentimento; restrições de independência derivadas de DEC-G0-05 e de
    decision-rights.md §3 (par #5). Nenhuma determinação jurídica é feita aqui — todas são
    marcadas VALIDATION REQUIRED.
  confidence: low
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
evidence_inputs:
  - repo: intensicare-V2
    path: docs/02-users-and-workflows/user-research-plan.md
    commit: 0c36f03
    lines_used: "180-218 (§5 consentimento, ética e proteção de dados — BLOQUEANTE, C1..C8)"
  - repo: intensicare-V2
    path: docs/00-governance/registers/g0-resolucoes-2026-08-15.md
    commit: 0c36f03
    lines_used: "39-46 (DEC-G0-03, sem titular jurídico), 56-61 (DEC-G0-05)"
  - repo: intensicare-V2
    path: docs/00-governance/decision-rights.md
    commit: 0c36f03
    lines_used: "§3 pares de independência (par #5: UX designer × moderador/dono da aceitação)"
  - repo: intensicare-V2
    path: docs/01-vision-and-intended-use/non-intended-uses.md
    commit: 0c36f03
    lines_used: "246-271 (NIU-06 — não é ferramenta de gestão de desempenho)"
---

# Plano de recrutamento, consentimento e ética — Gate G1

> **STATUS: PROPOSAL.** **OBSERVED (2026-08-15):** nenhum sítio contatado, nenhum participante
> recrutado, nenhuma submissão ética preparada, nenhum moderador nomeado.
>
> **⚠️ BLOQUEIO VIGENTE — SOURCE** (`../user-research-plan.md` §5): "NO FIELDWORK MAY BEGIN
> UNTIL THIS SECTION IS CLOSED BY A NAMED PRIVACY/LEGAL OWNER." O papel
> `AUTH-PRIVACY-LEGAL` **não tem titular**: `DEC-G0-03`
> (`../../00-governance/registers/g0-resolucoes-2026-08-15.md:39-46`) o reclassificou de G0
> para pré-condição de G6/G8 **com o fundamento de que o desenvolvimento prossegue
> exclusivamente com dados sintéticos**.
>
> **INFERENCE — consequência que precisa ser dita:** pesquisa com participantes humanos **não é
> dado sintético**. O fundamento que permitiu adiar `AUTH-PRIVACY-LEGAL` não cobre este
> trabalho. A pesquisa do G1 trata dados pessoais de profissionais de saúde e ocorre em ambiente
> onde há exposição incidental a dados de paciente. Portanto: ou o parecer jurídico brasileiro
> já previsto em `DEC-G0-03` é estendido para cobrir a pesquisa, ou um titular é nomeado para
> este escopo. **Este kit não pode resolver isso e não o contorna.**

## 1. O que este plano faz e o que não faz

**Faz:** define perfis, canais, critérios, consentimento, compensação, guarda de material e a
estrutura de independência, de modo que um pesquisador contratado possa executar sem
redesenhar.

**Não faz — e nenhum agente pode fazer:** nomear pessoas; declarar rota ética; concluir
suficiência jurídica; decidir se há dispensa de submissão; autorizar contato com sítio;
aprovar compensação.

---

## 2. Sítio: perfil, aproximação e anuência (`VAL-0039`)

### 2.1 Perfil do sítio

Requisitos S1–S8 em `protocolo-pesquisa-g1.md` §3.2. Em resumo: UTI adulta no Brasil, em pt-BR;
≥2 unidades (idealmente ≥2 instituições); patrocinador clínico nomeado; acesso a plantão
noturno, fim de semana e passagem de plantão; sem exposição prévia à IntensiCare na unidade
destinada ao baseline; anuência para contagem do ambiente de alarmes.

### 2.2 Papéis que precisam existir do lado do sítio

**SOURCE** (`../user-roles-hypotheses.md` §4.3) — nenhum existe hoje: patrocinador clínico
(intensivista responsável); contato de liderança de enfermagem; contato de pesquisa/ética (rota
CEP); encarregado de proteção de dados / contato LGPD; contato de TI e identidade; contato de
escala para acesso a plantões.

### 2.3 Roteiro de aproximação (PROPOSAL — 4 passos)

1. **Carta de apresentação** ao patrocinador clínico candidato: o que é o estudo (observação de
   trabalho, não avaliação de pessoas), o que **não** é (não é piloto, não é demonstração, não é
   venda), o que se pede (acesso, não dados de paciente), e o que o sítio recebe (relatório de
   achados sobre o próprio fluxo de trabalho da unidade).
2. **Reunião com liderança de enfermagem e médica**, separadamente da direção, para desenhar em
   conjunto o mecanismo de recusa invisível (§7.3). **INFERENCE:** envolver a liderança no
   desenho da recusa é o que impede que a recusa se torne informação de gestão.
3. **Reunião com o contato de ética/pesquisa** para determinar a rota (§5).
4. **Carta de anuência institucional**, contendo explicitamente: observação noturna e em fim de
   semana; observação de passagem de plantão; contagem do ambiente de alarmes; regra de
   não interferência do observador e seu limite (`protocolo-baselines-pereciveis.md` §7.3);
   compromisso de que participação e recusa não são reportadas nominalmente à gestão.

**Regra:** nenhuma sessão ocorre antes da carta de anuência assinada e da conclusão de §5 e §6.

### 2.4 O que não prometer ao sítio

Não prometer implantação, prioridade de acesso ao produto, exclusividade, coautoria
condicionada a resultado favorável, nem retorno que dependa de financiamento não aprovado.
**INFERENCE:** uma promessa de implantação transforma a unidade em parte interessada no
resultado, e um sítio interessado observa a si mesmo com generosidade.

---

## 3. Recrutamento de participantes

### 3.1 Perfis (detalhamento em `protocolo-pesquisa-g1.md` §4.1)

`R-MED-D`, `R-MED-P`, `R-ENF`, `R-TEC`, `R-COORD`, `R-FISIO`, `R-ADM`, `R-AT`, `R-GOV`.

### 3.2 Canal de recrutamento — desenho anti-viés

**SOURCE** (`../user-research-plan.md` §3, requisito de amostragem 2): os participantes "não
podem ser exclusivamente voluntários com entusiasmo prévio por software clínico — isso
seleciona justamente os usuários menos propensos a revelar modos de falha de adoção".

**PROPOSAL — recrutamento por escala, em três passos:**

1. **Sorteio de plantões** dentro dos estratos obrigatórios (diurno útil, noturno, fim de
   semana), a partir da estrutura da escala — sem nomes na etapa de sorteio.
2. **Convite a todos os profissionais escalados** naquele plantão, apresentado pelo
   pesquisador (não pela chefia), com antecedência mínima de 48 h quando possível.
3. **Registro apenas do agregado**: quantos convidados, quantos aceitaram, por papel e turno.
   Nunca quem recusou.

**Canais admitidos:** apresentação presencial do pesquisador em passagem de plantão ou reunião
de equipe; cartaz na área de descanso com um canal de contato **operado pela equipe de
pesquisa**; convite entregue em envelope/fichário neutro. **Canal proibido:** convite
transmitido pela chefia direta, lista de inscrição afixada, grupo de mensageria da unidade
administrado por gestor.

**INFERENCE:** o canal determina o viés mais do que o texto do convite. Um convite perfeito
distribuído pela chefia produz uma amostra de pessoas que não se sentiram livres para recusar.

### 3.3 Recrutamento de usuários de tecnologia assistiva (`R-AT`)

**PROPOSAL:** primeiro, dentro da força de trabalho do sítio, por canal anônimo (M8, `guias-…`
§9), com autoidentificação **voluntária** e contato apenas por iniciativa da pessoa. Se não
houver, ampliar para profissionais de saúde usuários de TA fora do sítio, por associações
profissionais e redes de profissionais com deficiência. **Jamais** simular
(`../user-research-plan.md` §3). Se o piso não for atingido, `VAL-0033` permanece **NÃO
TESTADO** — e assim deve constar do relatório, sem substituto.

### 3.4 Recrutamento de compradores e governança (`R-GOV`)

Por indicação do patrocinador do sítio, em sessão separada e em dia distinto das sessões
clínicas (`guias-…` §8). **INFERENCE:** aproximar as duas agendas cria, para o clínico, a
impressão de que sua participação alimenta uma decisão de compra — e altera o que ele diz.

---

## 4. Critérios de inclusão e exclusão de participante

**Inclusão:** profissional atuante na unidade incluída, no papel de interesse, escalado no
plantão sorteado, que consinta livremente.

**Exclusão:** profissional em período de avaliação de desempenho formal em curso (**INFERENCE:**
consentimento sob avaliação não é livre); profissional em relação de subordinação direta ao
moderador ou ao dono da aceitação; o próprio titular (`AUTH-UX`) e qualquer pessoa que ele
supervisione diretamente (§8.3); estagiário sem vínculo, salvo se o desenho for expressamente
estendido e reaprovado.

**Não é critério de exclusão:** ceticismo em relação a tecnologia; experiência negativa prévia
com sistemas clínicos; pouca familiaridade digital. **INFERENCE:** estes perfis são
especialmente informativos, e excluí-los seria produzir a amostra que confirma a hipótese.

---

## 5. Rota ética (`VAL-0040`)

**VALIDATION REQUIRED — determinação jurídica/ética, não do pesquisador nem de agente.**

**PROPOSAL — quadro de referência candidato a confirmar:** no Brasil, pesquisa com seres
humanos é apreciada pelo sistema CEP/CONEP, com submissão pela plataforma nacional própria;
existe um corpo normativo distinto para pesquisas em ciências humanas e sociais, categoria em
que uma observação de práticas de trabalho de profissionais **pode** recair. **Este kit não
determina qual regime se aplica** — a distinção altera prazos, documentos e a própria
necessidade de submissão, e depende de leitura jurídica e do CEP da instituição.

**O que a determinação precisa responder, explicitamente:**

| # | Pergunta | Consequência |
|---|---|---|
| E1 | O estudo, como desenhado, exige submissão a CEP? | Prazo de F0 (semanas vs. meses) |
| E2 | Se sim, sob qual regime normativo? | Documentos e formulários exigidos |
| E3 | O sítio exige apreciação por seu próprio CEP, além do CEP proponente? | Duplicação de prazo |
| E4 | A observação à beira do leito, com exposição incidental a dados de paciente, altera a classificação? | Pode exigir notificação a paciente/família (§6.3) |
| E5 | O componente B4b (registro clínico retrospectivo) exige apreciação separada? | Sequenciamento: B4b pode ser destacado do restante |
| E6 | Há necessidade de termo específico para gravação? | O kit **não** prevê gravação (`guias-…` §1.2) |

**PROPOSAL de sequenciamento:** submeter a cápsula perecível (B1, B2, B3, B4a — observação sem
acesso a prontuário) **separadamente** do componente B4b, se o regime permitir. **INFERENCE:**
amarrar a medida perecível ao componente que exige base legal para dado de paciente é o
caminho mais provável para perder a janela por prazo administrativo.

---

## 6. Base legal e proteção de dados (`VAL-0041`)

**VALIDATION REQUIRED — determinação jurídica. Nada nesta seção é conclusão legal.**

### 6.1 Duas relações de dados que não podem ser confundidas

| | **Participante da pesquisa** | **Paciente da unidade** |
|---|---|---|
| Quem é | Profissional de saúde observado | Terceiro presente, não participante |
| O que se coleta | Dados pessoais do participante (papel, turno, respostas, comportamento observado) | **Nada.** Nenhum dado de paciente é registrado (`guias-…` §1.2) |
| Fundamento pretendido | Consentimento **de pesquisa**, livre e informado (§7) | Não se aplica: sem coleta, sem tratamento; há apenas exposição incidental do observador |
| Confundível com | — | A base legal do **loop assistencial** da V2 (tutela da saúde), decidida em `AQ3` e registrada em `GDEC-0005` — que **não** é a base desta pesquisa |

**INFERENCE — a confusão a evitar, nomeada:** o consentimento de pesquisa (§7) é um instituto
distinto do consentimento como base legal de tratamento de dados para assistência. A adjudicação
de identidade do ciclo 1 decidiu que **não** há gate de consentimento no loop clínico
(base = tutela da saúde). Isso **não** transfere nenhuma permissão para esta pesquisa: aqui os
titulares dos dados são os profissionais, a finalidade é pesquisa, e a decisão anterior não os
alcança. Usar `AQ3` como se autorizasse a pesquisa seria exatamente o tipo de extensão silenciosa
de escopo que o programa proíbe.

### 6.2 Minimização aplicada ao desenho, não só ao armazenamento

Regras vinculantes já definidas em `guias-de-observacao-e-entrevista.md` §1: codificação
(`I-nn`, `U-nn`, `P-nn`, `SES-nn`), tempo relativo em vez de hora de relógio, classes em vez de
valores clínicos, proibição de fotografia, captura de tela e gravação, revisão de fim de sessão.

### 6.3 Abordagem a paciente e família

**PROPOSAL — VALIDATION REQUIRED** (C4 do ciclo 0): antes de observação junto ao leito, o
enfermeiro responsável informa paciente/acompanhante, em linguagem simples, que a pessoa
presente acompanha o **trabalho da equipe** e não coleta informação sobre o paciente; a recusa
do paciente ou do acompanhante encerra a observação naquele leito, sem registro do motivo. Se o
paciente não puder se manifestar, aplicam-se as regras da instituição e do CEP.

### 6.4 Incidente de exposição

Se, apesar do protocolo, um identificador for anotado: riscar de forma irreversível no material
de origem, registrar apenas "correção de registro" e comunicar ao responsável pela guarda (§9).
Nenhum incidente é registrado com o dado que o causou.

---

## 7. Consentimento (`VAL-0042`)

### 7.1 Elementos obrigatórios do termo (pt-BR, linguagem simples)

1. Quem conduz o estudo e quem o financia (a organização proponente, nomeada — sem eufemismo).
2. Objetivo: entender como o trabalho é feito hoje na UTI, antes de projetar qualquer sistema.
3. O que acontece na prática: um pesquisador acompanha o turno anotando tarefas, interrupções e
   ferramentas; ao final, uma conversa de até 30 minutos.
4. **O que não é anotado:** nada sobre pacientes; nada que identifique o participante; nada é
   fotografado ou gravado.
5. **O que não é:** não é avaliação de desempenho, não é auditoria, não é teste de conhecimento,
   não influencia escala, avaliação ou vínculo — coerente com
   `../../01-vision-and-intended-use/non-intended-uses.md` NIU-06.
6. Direito de recusar sem justificar; direito de interromper a observação a qualquer momento;
   direito de retirar o consentimento depois, inclusive quanto a material já coletado, até a
   data-limite de anonimização agregada (§7.4).
7. Que a chefia **não** recebe lista de quem participou ou recusou (§7.3).
8. Riscos: incômodo pela presença do observador; risco residual de reconhecimento em unidade
   pequena — mitigado por agregação e por não publicar contagens por papel abaixo do piso de
   §9.3.
9. Benefícios: nenhum benefício direto ao participante; o benefício é o entendimento do trabalho
   e um relatório à unidade.
10. Compensação, se houver (§10), e o fato de que recusar não a perde para sessões futuras.
11. Como retirar o consentimento: canal, prazo e o que acontece com o material (§7.4).
12. Duas vias; uma fica com o participante.

**Proibido no termo:** qualquer linguagem que sugira expectativa institucional de participação
("contamos com sua colaboração"), qualquer menção a um produto futuro, qualquer promessa de
melhoria decorrente da participação.

### 7.2 Momento e forma

Consentimento obtido **antes** da sessão, em conversa individual e reservada, sem a presença de
chefia e sem outros participantes ao lado. Tempo mínimo para leitura, sem pressa. O
consentimento é **reafirmado verbalmente** no início da sessão ("posso começar a anotar?").

### 7.3 Desenho de recusa invisível e sem custo (o requisito central de `VAL-0042`)

**SOURCE** (`../user-research-plan.md` §5): "o mecanismo de consentimento deve tornar a recusa
invisível e sem custo, e essa propriedade deve ser verificada com a liderança de enfermagem em
vez de assumida pela equipe de pesquisa."

**PROPOSAL — cinco propriedades verificáveis:**

| # | Propriedade | Como se verifica |
|---|---|---|
| D1 | O convite é feito pelo pesquisador, nunca pela chefia | Observável no procedimento |
| D2 | Não existe lista de participação acessível ao sítio | Declarado em contrato de pesquisa e conferido |
| D3 | Se um profissional recusa, o pesquisador **permanece na unidade** naquele plantão sombreando outro profissional ou executando M4/M7 | Impede inferência por ausência |
| D4 | Nenhum relatório contém contagem que permita inferir quem recusou (§9.3) | Revisão antes de publicar |
| D5 | A liderança de enfermagem revisa e confirma D1–D4 **antes** do campo, por escrito | Registro no dossiê do estudo |

**INFERENCE sobre D3:** é a propriedade mais fácil de esquecer e a mais decisiva. Se a recusa de
uma pessoa fizer o pesquisador ir embora, a unidade inteira sabe quem recusou — o consentimento
se torna nominal ainda que o papel diga o contrário.

### 7.4 Retirada, inclusive retrospectiva (C8 do ciclo 0)

**PROPOSAL:** canal de retirada operado pela equipe de pesquisa, disponível durante e após o
estudo, exercível sem justificativa; a retirada elimina o material da sessão daquele
participante (fichas `F-EVT`, `RC-nn`, entrevista) e o relatório declara apenas o número
agregado de retiradas. **Data-limite:** a retirada é integralmente possível até a anonimização
agregada final, cuja data é comunicada no termo; depois disso, a exclusão individual pode ser
tecnicamente impossível e **isso deve estar escrito no termo antes**, não descoberto depois.

---

## 8. Independência, `DEC-G0-05` e perfil do moderador (`VAL-0004`)

### 8.1 A regra

**SOURCE** (`../../00-governance/registers/g0-resolucoes-2026-08-15.md:56-61`, `DEC-G0-05`):
"o conhecimento clínico próprio do titular vale como **insumo de hipótese de especialista**,
nunca como evidência de observação do Gate G1 — o G1 continua exigindo participantes clínicos
externos (**dono da aceitação ≠ moderador da pesquisa ≠ participante único**)."

**SOURCE** (`../../00-governance/decision-rights.md` §3, par de independência #5): o designer de
UX deve ser independente do moderador/dono da aceitação da pesquisa com participantes.

### 8.2 Matriz de compatibilidade de papéis (PROPOSAL)

| Papel na pesquisa | Titular interino `AUTH-UX` | Autor das hipóteses do ciclo 0 | Pesquisador externo contratado | Profissional do sítio |
|---|:--:|:--:|:--:|:--:|
| Comissionar e financiar | ✅ | ❌ | ❌ | ❌ |
| Aprovar o protocolo | ✅ | ❌ | ❌ | ❌ |
| **Moderar / observar em campo** | ❌ | ❌ | ✅ | ❌ |
| Aplicar instrumentos de baseline | ❌ | ❌ | ✅ | ❌ |
| Ser participante | ❌ (ver §8.3) | ❌ | ❌ | ✅ |
| Analisar e redigir achados | ❌ | ⚠️ apenas na reconciliação, e declarado | ✅ | ❌ |
| **Aceitar os achados** | ✅ | ❌ | ❌ | ❌ |
| Ratificar realismo clínico dos cenários M3 | ⚠️ como `AUTH-CLINSAFETY` interino, declarando o acúmulo | ❌ | ❌ | ⚠️ como consultor, sem papel de aceitação |

⚠️ = permitido com declaração explícita do acúmulo no relatório e no registro de decisões.

### 8.3 Aplicação ao titular

1. Não é participante e **não é contado na amostra**.
2. Não observa, não modera, não aplica instrumento.
3. Não assiste a sessões em tempo real (`protocolo-pesquisa-g1.md` §7.3).
4. Seu conhecimento clínico entra como anexo rotulado **INSUMO DE HIPÓTESE — NÃO É EVIDÊNCIA
   G1**, datado e separado dos relatórios de observação.
5. Se houver vínculo entre o titular e o sítio, isso é declarado como limitação no relatório e a
   liderança local confirma por escrito que participação e recusa não lhe são comunicadas
   nominalmente.

**INFERENCE:** nenhuma dessas regras questiona a competência clínica do titular — ela é elevada
e é justamente por isso que ela contaminaria a evidência. O que o G1 exige não é conhecimento de
UTI; é **observação de outras pessoas trabalhando**, por alguém que não tem interesse no
resultado.

### 8.4 Perfil do moderador/pesquisador a contratar

Experiência demonstrável em métodos observacionais em ambiente clínico ou de alto risco;
condução em pt-BR; sem vínculo empregatício ou societário com OMNI/AMH; sem participação na
autoria de `../user-roles-hypotheses.md` e `../workflow-hypotheses.md`; sem relação de
subordinação com as unidades observadas; disponibilidade para plantão noturno e fim de semana.
**Declaração de conflito de interesses** assinada antes do início.

**VALIDATION REQUIRED:** a seleção e a nomeação são atos de `AUTH-UX` + `AUTH-PRODUCT`. Nenhum
agente pode nomear, sugerir nome, ou registrar um nome neste repositório.

---

## 9. Guarda, retenção e destruição do material

**PROPOSAL — VALIDATION REQUIRED (C6 do ciclo 0; depende de determinação jurídica):**

1. **Material de campo** (fichas, transcrições parafraseadas, planilhas de contagem) é
   armazenado em repositório do estudo com acesso restrito à equipe de pesquisa, com residência
   dos dados a definir pelo parecer jurídico.
2. **Chave de reidentificação**, se existir, fica sob guarda do sítio (não da equipe de
   pesquisa e não da OMNI/AMH), e é destruída na anonimização agregada final.
3. **Nada de material bruto entra neste repositório Git.** Apenas relatórios agregados, já
   revisados contra a lista proibida (`guias-…` §1.2), entram em `docs/`.
4. **Retenção**: definida pelo parecer jurídico/CEP; na ausência de definição, o material bruto
   é destruído após a entrega e aceitação dos relatórios, e essa regra consta do termo.
5. **Piso de agregação para publicação**: nenhuma contagem por papel/unidade é publicada com
   n < 5; abaixo disso, descreve-se qualitativamente. **INFERENCE:** em UTI com um único
   coordenador por turno, "1 coordenador relatou X" é uma identificação.

---

## 10. Compensação

**PROPOSAL — VALIDATION REQUIRED (`AUTH-PRODUCT` + revisão jurídica/ética):**

| Situação | Compensação proposta | Racional |
|---|---|---|
| Observação durante o plantão (M1, M2, M4) | **Nenhuma ao participante**; o profissional está trabalhando e remunerado pela instituição | **INFERENCE:** pagar por ser observado durante o próprio turno cria incentivo a aceitar e distorce o desenho de recusa livre |
| Entrevista pós-plantão que ultrapasse o horário (E) | Compensação de tempo, em valor modesto e uniforme | Reconhece tempo pessoal sem induzir |
| Sessão de simulação fora de escala (M3) | Compensação de tempo, uniforme por sessão | Idem |
| Avaliação com tecnologia assistiva (M5) | Compensação de tempo **mais** custos de deslocamento/acompanhante, se houver | Não onerar quem já enfrenta custo de acesso maior |
| Entrevista de comprador/governança (M6) | Nenhuma | Participação institucional |
| Unidade/instituição | **Nenhuma por participante.** Devolutiva: relatório de achados sobre o próprio fluxo de trabalho | **INFERENCE:** pagamento por participante à instituição cria pressão de recrutamento sobre a equipe — o oposto do desenho de §7.3 |

**Princípios:** valor uniforme por sessão, independentemente do papel ou da senioridade;
suficiente para reconhecer o tempo, insuficiente para induzir; pago por via que **não** passe
pela chefia; recusar não impede compensação em participação futura; o valor é registrado no
termo. **Valor monetário: UNSET — decisão de `AUTH-PRODUCT`.** Nenhum agente propõe cifra.

---

## 11. Lista de verificação pré-campo (nenhum item pode ficar aberto)

| # | Item | Responsável | Estado hoje |
|---|---|---|---|
| 1 | Titular ou parecer jurídico cobrindo pesquisa com participantes humanos | `AUTH-PRIVACY-LEGAL` / parecer de `DEC-G0-03` | **ABERTO** |
| 2 | Determinação de rota ética (§5) | Jurídico + CEP do sítio | **ABERTO** |
| 3 | Sítio e patrocinador nomeados; carta de anuência assinada | `AUTH-PRODUCT` | **ABERTO** |
| 4 | Moderador externo nomeado, com declaração de conflito de interesses | `AUTH-UX` + `AUTH-PRODUCT` | **ABERTO** |
| 5 | Dono da aceitação declarado e distinto do moderador | `AUTH-UX` | **PARCIAL** — titular aceita; moderador inexistente |
| 6 | Termo de consentimento aprovado (§7) | Jurídico/CEP | **ABERTO** |
| 7 | D1–D5 confirmados por escrito pela liderança de enfermagem (§7.3) | Sítio | **ABERTO** |
| 8 | Instrumentos impressos e observador calibrado | Equipe de pesquisa | **ABERTO** |
| 9 | Regra de não interferência e limiar de risco iminente acordados | `AUTH-CLINSAFETY` + patrocinador | **ABERTO** |
| 10 | Guarda de material definida (§9) | Jurídico | **ABERTO** |
| 11 | Instrumento de fadiga selecionado ou B3 formalmente omitida | `AUTH-UX` + `AUTH-CLINSAFETY` | **ABERTO** |
| 12 | `AUTH-CLINSAFETY` disponível para ratificar cenários (somente F3) | `AUTH-CLINSAFETY` | **PARCIAL** (`GDEC-0003`, escopo estreito) |

**INFERENCE:** os itens 1, 2 e 3 são o caminho crítico do caminho crítico. Os itens 4–12 são
executáveis em paralelo e, se preparados enquanto 1–3 tramitam, a janela do baseline perecível
encontra o instrumento pronto em vez de começar a ser desenhado quando a autorização chegar.

---

## 12. Referências cruzadas

- `protocolo-pesquisa-g1.md` — desenho, sítios (S1–S8), amostragem, independência operacional.
- `guias-de-observacao-e-entrevista.md` §1 — regras de registro sem PHI que este plano pressupõe.
- `protocolo-baselines-pereciveis.md` §7 — pré-condições e coletores autorizados.
- `pedido-de-comissionamento.md` — o ato de comissionamento e o que ele desbloqueia.
- `../user-research-plan.md` §5 — C1–C8, os requisitos originais de ética e consentimento.
- `../../01-vision-and-intended-use/non-intended-uses.md` — NIU-06, NIU-07.
- `../../00-governance/registers/g0-resolucoes-2026-08-15.md` — `DEC-G0-03`, `DEC-G0-05`.
- `../../00-governance/decision-rights.md` §3 — par de independência #5.
