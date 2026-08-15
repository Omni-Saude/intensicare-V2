---
doc_id: AMH-PATHWAY-SOURCE-MATRIX-GAPS
title: Lacunas da matriz §7.2 e a próxima evidência que fecharia cada uma
status: PROPOSAL
label: PROPOSAL
owner: UNASSIGNED — VALIDATION REQUIRED
approver_role: AUTH-DATA-PLATFORM (fonte) + AUTH-CLINSAFETY (conteúdo) + titular (decisões de produto)
source: >
  Companheiro de ./matrix.yaml e ./matriz-leitura.md;
  INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §7.1 (quatro camadas), §7.2 (regras duras), §7.5;
  docs/08-interoperability/amh-data/{four-layer-dossier.md, compatibility-finding.md,
  contracts.lock.draft.yaml, ordens-de-servico-amh-2026-08-15.md,
  open-questions-for-amh-owners.md, identity-adjudication/adjudicacao-decisoes-2026-08-15.md,
  vital-signs-decision/pacote-decisao-c1-sinais-vitais.md, vital-signs-decision/impacto-no-portfolio.md};
  docs/05-clinical-safety/rule-releases/{sofa,news2,gcs}/specification.md (working tree não commitado)
date_collected: 2026-08-15
last_updated: 2026-08-15
collector: arquiteto de compatibilidade AMH-dados (ciclo 1 — matriz §7.2)
provenance:
  source_repo: intensicare-V2
  path_or_url: docs/08-interoperability/amh-data/pathway-source-matrix/lacunas-e-proximas-evidencias.md
  commit_sha_or_version: working tree não commitado sobre cycle-1/clinical-content @ 0c36f03
  section_or_lines: documento inteiro
  date_collected: 2026-08-15
  collector: arquiteto de compatibilidade AMH-dados
  transformation: >
    Derivado dos motivos de inelegibilidade de matrix.yaml, cruzado com as ordens de
    serviço, contradições e decisões já registradas nos artefatos de evidência AMH da V2.
    Nenhuma ordem de serviço foi criada, alterada ou renumerada; nenhuma decisão foi
    tomada; nenhum prazo foi inventado.
  confidence: média (o mapeamento lacuna→evidência é raciocinado a partir de documentos citados; nenhuma medição foi feita)
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  requirements: []
  hazards: [HAZ-0005, HAZ-0032, HAZ-0036, HAZ-0038, HAZ-0043, HAZ-0044]
  adrs: [ADR-0001, ADR-0005, ADR-0007, ADR-0008, ADR-0028, ADR-0029]
  tests: []
  pr: null
supersedes: null
superseded_by: null
---

# Lacunas e a próxima evidência que fecharia cada uma

Companheiro de [`matrix.yaml`](./matrix.yaml) e
[`matriz-leitura.md`](./matriz-leitura.md). Responde a uma pergunta só, por lacuna:

> **Qual evidência, exatamente, fecharia esta lacuna — e quem teria de agir?**

## 0. Regras deste documento

1. **Nenhum prazo aparece aqui.** Nenhuma data é derivável da evidência disponível, e
   este especialista não tem visibilidade de capacidade de equipe, orçamento ou fila.
   Desconfie de qualquer documento que ofereça uma data sem apontar a fonte.
2. **Nenhuma ordem de serviço foi criada, alterada ou renumerada.** As ordens citadas
   (OS-01..OS-21) existem em `ordens-de-servico-amh-2026-08-15.md` e são apenas
   referenciadas. Onde **não existe** ordem, este documento diz isso com todas as letras
   — a ausência é o achado.
3. **"Evidência que fecha" é sempre nomeada por camada.** Uma decisão nunca fecha uma
   lacuna de camada 3 ou 4; ela apenas autoriza o trabalho que produzirá a evidência.
4. **Nada aqui é decisão.** Registrar que uma lacuna precisa de dono não é nomear o dono.

## 1. Quadro de orientação

| Lacuna | Classe | Existe ordem/decisão que a carrega? | Quem age |
|---|---|---|---|
| **L-1** Exclusão estrutural não-laboratorial | contrato (camada 1) | **C-1 aberta** — a única das quatro contradições de camada 1 que as resoluções AQ-1..AQ-6 não tocaram | titular decide; AMH executa |
| **L-2** Laboratório bloqueado com fonte vazia | povoamento (camada 3) | **OS-20** | AMH |
| **L-3** Caminho de desbloqueio não conforme (C-4) | conformidade (camadas 1+3) | **OS-20** encaminha; a **condição de aceitação** não existe | AMH executa; V2 escreve a condição de aceitação |
| **L-4** Sem `MedicationAdministration` | contrato (camada 1) | **NENHUMA — sem ordem, sem pergunta aberta, sem item de caminho crítico** | titular precisa nomear |
| **L-5** Sem fonte de dispositivo/ventilador | contrato (camada 1) | parcial, dependente do escopo de C-1 se a via direta for escolhida | titular decide o escopo |
| **L-6** Sem fonte de ordem clínica (escala de SpO2, limitação terapêutica) | contrato (camada 1) | **NENHUMA** | titular precisa nomear |
| **L-7** Sem pin de terminologia | contrato (camada 1) | **ADR-0029** define o processo; o pin em si não foi feito | V2 (arquiteto de terminologia) + AMH |
| **L-8** Sem semântica de tempo | contrato (camada 1) | não coberta por nenhuma OS; item de reconhecimento §7.1 incompleto | AMH declara; V2 exige no contrato |
| **L-9** Sem semântica de correção/duplicata/cancelamento | contrato (camada 1) | **ADR-0005** `proposed`; nenhuma OS cobre o lado AMH | AMH declara; V2 ratifica ADR-0005 |
| **L-10** Identidade/tenant decididos sem artefato | contrato (camada 1) | **OS-01..OS-06, OS-10..OS-19** | AMH executa; OS-16 exige DPO/Jurídico |
| **L-11** Sem capacidade implantada verificável | camada 2 | **OS-09** (partições) e ambiente | AMH + orçamento (titular) |
| **L-12** Sem medição de povoamento | camada 3 | **OS-08** produz a primeira evidência de camada 3 | AMH produz; V2 mede |
| **L-13** Sem latência medida / canal em lote | camada 4 | nenhuma OS mede latência de leitura de consumidor | AMH + V2 conjuntamente |
| **L-14** Sem ambiente semelhante a produção | camada 2-4 (habilitante) | orçamento de `stg` está na fila de prioridade da decisão C-1 (face D-b) | titular (orçamento) |
| **L-15** Ambiguidades das specs (insumos não tabelados) | conteúdo clínico | nenhuma; identificadas por esta matriz | autor da spec + revisor clínico nomeado |
| **L-16** Sem parecer DPO/Jurídico | habilitante legal | **OS-16 — única dependência externa** | DPO/Jurídico |

---

## 2. Lacunas de contrato (camada 1)

### L-1 — Exclusão estrutural de toda `Observation` não-laboratorial

**O que é.** O único profile de `Observation` da IG fixa `category` em `laboratory` por
`patternCodeableConcept`, sem `slicing`. Uma instância conforme não pode carregar outra
categoria. Isso exclui `vital-signs` **e também** `survey`/`exam` — ou seja, sinais vitais,
GCS, RASS, ACVPU e diurese, todos pelo mesmo mecanismo.

**Linhas afetadas.** SOFA-03, 04, 07, 10, 11, 12, 14, D6; todas as sete linhas pontuadas do
NEWS2 mais NEWS2-06; GCS-02, 03, 04, 05, 06, D1. **A maior lacuna isolada da matriz.**

**Que evidência a fecharia, por camada:**

| Camada | Evidência exata |
|---|---|
| 1 | Um profile `Observation` capaz de carregar a categoria pretendida — emenda com `slicing` ao profile existente **ou** um profile novo —, com `code` vinculado a value set apropriado e `valueQuantity.system` em UCUM, **publicado em package da IG com digest citável**, e pinado pela V2 |
| 2 | Interface alcançável e autorizada, em um ambiente, servindo esse profile |
| 3 | Contagem de recursos por tenant, distribuição de nulos e taxa de conformidade LOINC/UCUM medidas sobre dado real |
| 4 | Latência de caminho de leitura de consumidor, ordenação, correção e disponibilidade medidas |

**Quem age.** O **titular** decide as quatro faces de C-1 (via, prioridade, escopo,
consequência aceita). **A AMH** executa profile e fonte. A **V2** escreve, antes do
início, a condição de aceitação que impede a repetição da C-4.

**Ponto de atenção decisório, já registrado no pacote de decisão:** decidir C-1 apenas
como "sinais vitais" deixa a RULE-GCS inteiramente bloqueada e o componente neurológico do
SOFA bloqueado, e **não desbloqueia o NEWS2**, que precisa de ACVPU. O escopo amplo custa
quase nada a mais no profile e vale muito.

**Questão técnica em aberto que muda o custo:** o `patternCodeableConcept` sem `slicing`
foi intencional? Se a intenção era fatiar `category`, a correção é emenda; se não,
é artefato novo. Está registrada como questão aos donos AMH.

**O que L-1 não fecha.** Laboratório (L-2/L-3), administração de medicamentos (L-4),
dispositivo/ventilador (L-5), ordens clínicas (L-6), terminologia (L-7), tempo (L-8),
correção (L-9), ambiente (L-14), e nenhum dos portões de programa.

---

### L-2 — `Observation` laboratorial bloqueada com fonte vazia

**O que é.** O profile laboratorial existe e é conforme; a fonte não. A tabela Bronze de
resultados por paciente existe no catálogo com **0 linhas**, e a fonte estruturada
Diagnose/LIS **não é ingerida**. O bloqueio é registrado pela própria AMH como sendo por
falta de dado, não por código.

**Linhas afetadas.** SOFA-02 (PaO2), SOFA-05 (plaquetas), SOFA-06 (bilirrubina), SOFA-13
(creatinina). Nenhuma linha de NEWS2 ou GCS.

**Que evidência a fecharia:** camada 3 — ingestão da fonte estruturada no Bronze, com
contagem de linhas por tenant e distribuição de nulos **medidas**, não alegadas.

**Quem age.** AMH, sob **OS-20**.

**Precedente honesto que informa qualquer expectativa:** este é o caso em que a fonte
está **identificada** e o mapeador **escrito**, e ainda assim segue aguardando ingestão.
É o limite inferior de esforço para qualquer classe cuja fonte sequer foi identificada.
Nenhuma data existe.

---

### L-3 — O caminho de desbloqueio é não conforme, e está implementado

**O que é.** Contradição C-4. O desbloqueio anunciado emitiria `code` como texto livre e o
resultado como `valueString`, enquanto o profile exige `code` vinculado a value set LOINC e
`valueQuantity.system` fixado em UCUM. **Agravante registrado em 2026-08-15:** esse caminho
não é um plano — está **implementado** no produtor de registro.

**Por que isto importa mais do que parece.** "Observation desbloqueada" pode chegar como
notícia boa e não mover uma única linha desta matriz. **Nenhuma regra de limiar consome um
`valueString`.** Um valor sem código e sem unidade não é comparável a banda alguma, e a
disciplina de conversão (o controle direto de HAZ-0032) fica inexequível.

**Que evidência a fecharia:** camada 3 **mais** conformidade — instâncias com `code`
vinculado a LOINC e `valueQuantity` com sistema UCUM, com a **taxa de conformidade
medida**, não presumida.

**Quem age.** AMH executa o caminho estruturado (OS-20). **A V2 precisa escrever, antes,
a condição de aceitação**: "chega com código e quantidade com unidade, ou não conta como
desbloqueio". Essa condição de aceitação **não existe hoje** — é a lacuna acionável mais
barata deste documento.

---

### L-4 — Não existe profile `MedicationAdministration`

**O que é.** Entre os profiles de nível superior da IG existem `Medication`,
`MedicationRequest` e `MedicationDispense` — e **nenhum** de administração. Prescrição e
dispensação **não são administração titulada**, e nenhuma delas carrega taxa de dose ao
longo do tempo.

**Linhas afetadas.** SOFA-08, SOFA-09, SOFA-D5, SOFA-D7; NEWS2-D4; **GCS-07** — e, por
GCS-07, a RULE-GCS **inteira**, via gate sedativo fail-closed.

**O achado a sinalizar, não a decidir.** Esta lacuna **não tem ordem de serviço, não tem
pergunta aberta aos donos AMH e não está no caminho crítico**. Tem exatamente a mesma
forma da C-1: um recurso FHIR de que o consumidor precisa e para o qual a IG não tem
profile. A diferença é que C-1 está nomeada como decisão e esta não.

**Que evidência a fecharia, por camada:**

| Camada | Evidência exata |
|---|---|
| 1 | Profile de administração de medicamentos publicado, com identidade do agente, **taxa de dose com unidade UCUM**, e **período de administração com início e fim** — sem o período, a condição "taxa sustentada por 1 h" e o tier provisional de primeira hora são inexequíveis |
| 3 | Cobertura por tenant sobre administrações reais de vasoativo e de sedativo |
| 4 | Latência compatível com a janela ratificada da regra (confirmação de taxa em até 2 h; expiração 4 h) |

**Quem age.** O **titular** precisa primeiro decidir se esta classe entra na mesma sessão
de decisão que C-1 — sem isso não há a quem atribuir. Depois, AMH.

**O que isto custa hoje, dito sem suavização.** Sete candidatos do inventário param nesta
classe. E dentro desta matriz, ela é a única lacuna que sozinha impede **duas** regras
(SOFA-CV e GCS) mesmo que tudo o mais fosse entregue.

---

### L-5 — Não existe fonte de dispositivo/ventilador

**O que é.** Nenhum artefato de ingestão de dispositivo existe na árvore do repositório
AMH; a única menção substantiva a IoT está arquivada, diferida, e trata de equipamentos e
localização de ativos — não de sinais de paciente.

**Linhas afetadas.** SOFA-03 (FiO2), SOFA-04 (suporte respiratório), SOFA-D2 (ECMO).

**Que evidência a fecharia:** camada 1 — um contrato de dado de ventilador/dispositivo com
código, unidade, vínculo a paciente e encontro, e semântica temporal; depois camadas 2–4.

**Quem age.** Depende de qual via de C-1 for escolhida: só faz sentido se o escopo do
ingresso incluir **ventiladores explicitamente** — pergunta hoje em aberto. Se a via
escolhida for do lado AMH, a fonte precisa antes ser **identificada**, e não está.

**Limite honesto da afirmação.** Esta é a conclusão de uma busca delimitada em um único
commit de um único repositório. Um sistema de ingestão de dispositivos poderia existir
**fora** dele. O titular saberá; o repositório não diz.

---

### L-6 — Não existe contrato de ordem clínica

**O que é.** Três linhas da matriz precisam de uma **ordem clínica atribuível e
estruturada**, não de uma medida: a atribuição de escala de SpO2 do NEWS2 (com autor,
horário e indicação registrados) e as ordens de limitação terapêutica das três regras.
Nenhum contrato desse tipo foi inventariado em nenhuma camada.

**Linhas afetadas.** NEWS2-G, NEWS2-D3, SOFA-D3, GCS-D3.

**Por que é diferente de L-1.** Corrigir o profile de `Observation` **não alcança** estas
linhas. Uma ordem não é uma observação. Mesmo a leitura mais ampla de C-1 as deixa de fora.

**Que evidência a fecharia:** camada 1 — contrato de ordem clínica com identidade do autor,
carimbo, indicação, e **semântica de revogação** (que é o evento de correção central destas
linhas); mais o mapeamento do papel "decisor clínico competente" ao modelo de autorização
da V2, hoje declarado VALIDATION REQUIRED pela própria spec do NEWS2.

**Quem age.** **Ninguém, hoje** — não há ordem de serviço nem pergunta aberta. Precisa de
dono nomeado.

**Risco a registrar, não a decidir.** O default "escala 1" é seguro e vem da fonte
publicada. Mas um sistema que nunca recebe uma ordem de escala 2 pontua pacientes
hipercápnicos na escala errada, silenciosamente. Isso é consequência de L-6, não defeito da
regra.

---

### L-7 — Terminologia não pinada

**O que é.** Nenhum servidor de terminologia, expansão ou versão de release foi verificado;
LOINC e UCUM estão sem release pinado; o único value set AMH referenciado é o laboratorial,
com binding `extensible`. Todos os códigos das três specs são **candidatos declarados pelas
próprias specs**.

**Linhas afetadas.** Todas as 47.

**Casos específicos que exigem decisão terminológica, não apenas um pin:**

| Linha | O que precisa ser decidido |
|---|---|
| NEWS2-02 (SpO2) | dois códigos candidatos para conceitos distintos (oximetria de pulso × saturação arterial medida) — a spec remete explicitamente ao arquiteto |
| NEWS2-06 (ACVPU) | a answer list do código candidato **não tem conceito padrão para a nova confusão**, que é justamente o token clinicamente decisivo |
| SOFA-04, SOFA-12, GCS-06, GCS-07 | as specs registram "nenhum código pinado — VALIDATION REQUIRED" |
| SOFA-08 | candidatos em ATC com pin em RxNorm declarado VALIDATION REQUIRED |
| SOFA-D6, NEWS2-D1 | **códigos ausentes de uma spec e presentes em outra** para o mesmo conceito (PAS; idade) — harmonização entre regras |
| GCS-D1 | vocabulário de motivos NT é **interno da regra**, sem vínculo terminológico externo |

**Que evidência a fecharia:** camada 1 — value sets pinados com release citável, expandidos
contra um servidor de terminologia identificado, sob o processo do **ADR-0029** (que
também governa a validação pt-BR correspondente).

**Quem age.** V2 (arquiteto de terminologia) propõe; AMH publica o que estiver do seu lado
(o value set ligado ao profile). A decisão de mapeamento é **explicitamente proibida** a
este especialista e não foi tomada em lugar nenhum desta matriz.

---

### L-8 — Semântica de tempo não acordada

**O que é.** Não existe definição acordada, para nenhuma interface que a V2 consumiria, de
tempo clínico observado × emitido × recebido × disponível, fuso, precisão, clock-skew,
chegada tardia ou ordenação. Está registrado como item **incompleto** do reconhecimento de
camada 1.

**Linhas afetadas.** Todas as 47.

**Por que é bloqueante e não cosmético.** As três regras exigem que a idade de um valor
seja computada do **tempo clínico da fonte** contra o relógio de avaliação **no momento da
leitura** — nunca do tempo de recepção nem da ordem de linha. Sem semântica de tempo
declarada, staleness não é computável e as 47 janelas ratificadas não são aplicáveis. Casos
que endurecem a exigência:

- pareamentos apertados: FiO2 dentro de 30 min do PaO2; RASS dentro de 1 h da GCS;
  contemporaneidade mútua de 30 min entre os componentes E/V/M;
- **medidas de intervalo**: diurese exige início **e** fim do intervalo, não um carimbo;
  a janela de interrupção sedativa idem;
- **arredondamento**: a política decidida de temperatura exige que a fonte informe a
  **precisão** do valor.

**Que evidência a fecharia:** camada 1 — declaração AMH da semântica temporal por
interface, incorporada ao contrato AMH×IntensiCare; depois medição de camada 4.

**Quem age.** AMH declara; a V2 exige como cláusula do contrato v1.

---

### L-9 — Sem semântica de duplicata, ordem, correção e cancelamento

**O que é.** Indefinido para todo insumo: duplicata, ordenação, correção, cancelamento,
merge/unmerge, deleção, alta, óbito, backfill e consequências de replay. As garantias de
replay/backfill/correção e o procedimento de reconciliação estão `null` no rascunho de
lock. O ADR-0005 (modelo canônico de observação, proveniência, qualidade, correção e tempo)
está `proposed`.

**Linhas afetadas.** Todas as 47.

**A assimetria que torna isso urgente.** O **lado regra já decidiu**: o NEWS2 tem tabela de
tolerância de dispositivo por parâmetro (dentro da tolerância, o pior valor pontua com
resolução registrada; fora, o parâmetro é `invalid`); as três regras definem conflito
simultâneo não reconciliado como `invalid`. **Essas políticas são inexecutáveis** sem
semântica de fonte. Casos de maior consequência: cancelamento/suspensão de infusão
vasoativa (SOFA-08/09) e revogação de ordem de limitação terapêutica (SOFA-D3, NEWS2-D3).

**Que evidência a fecharia:** camada 1 — declaração AMH por interface, mais ratificação do
ADR-0005 do lado V2; camada 4 — demonstração de correção e replay medida.

**Quem age.** AMH declara; V2 ratifica ADR-0005 e escreve as cláusulas no contrato.

---

### L-10 — Identidade e tenant decididos, sem artefato

**O que é.** A adjudicação AQ-1..AQ-6 foi decidida pelo titular em 2026-08-15 e fixou a
direção: elemento autoritativo no fio, tenant derivado de partição de URL com igualdade de
claim, `portable_subject_ref` como identificador de fronteira obrigatório do contrato v1,
par (PSR, encontro) como chave de fato clínico, nenhum bypass cross-tenant. **Nenhuma
resolução criou arquivo, publicou package, provisionou ambiente ou mediu uma linha.**

**Linhas afetadas.** CTX-01, CTX-02, CTX-03 e, por dependência, todas as demais.

**Duas lacunas específicas que a decisão não fecha:**

1. **O IG 1.1.0 é alvo decidido, não artefato existente.** A V2 não pode pinar o que não
   existe, e sem pin não há `contracts.lock` aceito.
2. **`Observation.encounter` é OPCIONAL no único profile declarado.** O vínculo de encontro
   que o §7.2 exige **não é garantido pelo contrato**, mesmo quando houver dado. E a
   completude referencial é sabidamente imperfeita: dezenas de milhares de linhas clínicas
   referenciam encontros ausentes por desvio de ingestão (HAZ-0038), em escala não medida
   para os fins da V2.

**Que evidência a fecharia:** camada 1 — OS-01 a OS-06 (correções de profile, linguagem,
tenants, bypass, publicação do package com digest, registro de supersessão); OS-07/OS-08
(produtor conforme); OS-10 a OS-15 (espinha de PSR, com OS-16 como portão para dado real);
OS-17 e OS-18 (**eventos de ciclo de vida** e **resolução ponto-no-tempo** — registradas
como condições de passagem do G3 e como base do replay determinístico); OS-19 (pacote de
contrato v1).

**Quem age.** AMH executa; **OS-16 (parecer DPO/Jurídico) é a única dependência externa** e
é portão para qualquer trabalho com dado real.

---

## 3. Lacunas de camada 2, 3 e 4

### L-11 — Sem capacidade implantada verificável (camada 2)

**O que é.** Nenhum ambiente foi acessado, nada foi descoberto, nada foi contatado. A
contradição C-2 (qual mecanismo de autenticação está **realmente implantado** por
ambiente) permanece aberta e só é resolvível por descoberta em ambiente.

**Que evidência a fecharia:** interface alcançável e autorizada, descoberta de configuração
por ambiente, e testes negativos que provem a **impossibilidade** do bypass cross-tenant —
não sua mera ausência.

**Quem age.** AMH (OS-09 e provisionamento); V2 executa a suíte de conformidade.

---

### L-12 — Sem medição de povoamento (camada 3)

**O que é.** Nenhuma contagem, nenhuma distribuição de nulos, nenhuma taxa de conformidade
de código ou unidade foi medida para nenhum insumo. As alegações de povoamento da AMH são
alegações **SOURCE** pendentes de verificação — e não são decompostas por tipo de recurso
nem por tenant.

**Que evidência a fecharia, e é específica por insumo:** para cada linha da matriz —
contagem de recursos por tenant e por facility; percentual de instâncias com código
vinculado; percentual com `valueQuantity` e unidade UCUM; percentual com vínculo de
encontro presente; distribuição de nulos por campo consumido.

**Quem age.** AMH produz (OS-08 é registrada como a primeira evidência de camada 3); a V2
mede contra os insumos desta matriz. **Nada disso é verificável enquanto só `dev` existir**
(ver L-14) e nada com dado real antes de OS-16 (ver L-16).

---

### L-13 — Sem latência medida; canal declarado como não near-real-time (camada 4)

**O que é.** Toda cifra de latência disponível é meta de rascunho ou throughput de escrita
em lote da própria AMH — **nenhuma é medição de caminho de leitura de consumidor**. O
ADR-040 declara que o canal FHIR não é near-real-time enquanto o CDC estiver parqueado.

**Por que é decisivo e não secundário.** As janelas ratificadas do lado regra são
apertadas: 1 h para os quatro parâmetros contínuos do NEWS2; 30 min de pareamento
FiO2–PaO2; confirmação de taxa vasoativa em até 2 h. **Um feed em lote pode ser
perfeitamente conforme e ainda assim produzir `stale`/`not_evaluated` na maioria das
leituras.** E um instrumento permanentemente não avaliado é o mecanismo exato do HAZ-0043:
silêncio lido como tranquilidade.

**Que evidência a fecharia:** percentis de latência ponta a ponta **medidos no caminho de
leitura do consumidor**, por interface e por insumo, comparados à janela da regra que vai
consumi-lo; mais ordenação, completude, disponibilidade, correção e replay medidos.

**Quem age.** AMH e V2 conjuntamente, em um ambiente que ainda não existe.

---

### L-14 — Sem ambiente semelhante a produção (habilitante de 2, 3 e 4)

**O que é.** Somente `dev` está provisionado. `stg`, `prod` e `dr` não existem e não têm
tfstate. O Gate G3 exige conformidade em ambiente semelhante a produção — condição hoje
**impossível para qualquer pessoa em qualquer nível de acesso**.

**Que evidência a fecharia:** o ambiente existir.

**Quem age.** Titular — é decisão de orçamento, e está explicitamente na face de
priorização da decisão C-1.

**Consequência que precisa aparecer no cronograma e não ser descoberta depois:** enquanto
L-14 não fechar, **nenhuma** das lacunas L-11 a L-13 pode fechar, e portanto nenhuma linha
desta matriz pode se tornar elegível — independentemente de quanto avancem C-1, OS-20 e a
classe de administração de medicamentos.

---

## 4. Lacunas do lado da V2 (não dependem da AMH)

### L-15 — Ambiguidades das especificações de regra

Identificadas por esta matriz e **transcritas, não resolvidas** (condição de parada
explícita desta tarefa). São 15 linhas derivadas; as perguntas materiais:

| Linha | Pergunta em aberto para o autor da spec e o revisor clínico nomeado |
|---|---|
| SOFA-D1 (TSR) | o componente renal avalia quando o estado de TSR é **desconhecido**? Desconhecido é tratado como ausência de TSR — o que reintroduziria uma suposição silenciosa contrária ao fail-closed adotado no gate sedativo? |
| SOFA-D2 (ECMO) | estado de ECMO desconhecido é fail-closed ou fail-open? |
| SOFA-D4 (crônico) | que conjunto de condições conta como "limitação crônica documentada", e quem ratifica? |
| SOFA-D6 (PAS/PAD) | qual código, qual faixa plausível, qual janela e **qual regra de pareamento** entre PAS e PAD (precisam ser da mesma aferição para a fórmula significar algo)? |
| SOFA-D7 (conversão de dose) | a política de conversão está declarada VALIDATION REQUIRED pela própria spec, sobre um insumo não tabelado |
| NEWS2-D1 (idade) | por que a spec do NEWS2 não declara código de idade, se SOFA e GCS declaram o mesmo candidato? |
| NEWS2-D4 (sedação) | **assimetria entre as três regras**: gate fail-closed em SOFA e GCS, anotação obrigatória sem regra para desconhecido em NEWS2 — deliberado ou lacuna? |
| GCS-D2 (bloqueio neuromuscular) | estado de bloqueio **desconhecido** deveria ter regra, no espírito fail-closed do resto da regra? |
| GCS-D3 (metas de cuidado) | o carve-out está **decidido** em SOFA e NEWS2 e **sinalizado** na GCS — intencional (a GCS não emite tier de escalonamento) ou lacuna de atualização? |

**Quem age.** Autor da spec e revisor clínico nomeado. **Não depende da AMH, não depende de
ambiente e não depende de orçamento** — é a única categoria de lacuna deste documento
inteiramente sob controle da V2.

**Uma lacuna de contrato correlata, também sob controle da V2:** a **condição de aceitação
escrita** que impede que "insumo desbloqueado" chegue como texto livre (ver L-3). Escrevê-la
antes é barato; descobrir depois que o desbloqueio não serve é caro.

---

### L-16 — Parecer DPO/Jurídico

**O que é.** Registrado como a **única dependência externa** entre as ordens de serviço.
Enquanto não existir, apenas dado sintético pode ser usado — o que significa que **nenhuma
medição de camada 3 sobre dado real** pode ocorrer, para insumo nenhum.

**Quem age.** DPO/Jurídico. Não é ato de engenharia e não é acelerável por engenharia.

---

## 5. A leitura que este documento existe para deixar registrada

1. **O lado da regra está pronto; o bloqueio é integralmente do lado da fonte.** As 47
   janelas de frescor estão ratificadas, os comportamentos de ausência decididos, o
   vocabulário de status definido. Nenhuma linha desta matriz está bloqueada por conteúdo
   clínico faltando.
2. **Três das lacunas não têm dono nomeado:** administração de medicamentos (L-4), contrato
   de ordem clínica (L-6) e, parcialmente, semântica de tempo e de correção (L-8, L-9).
   Registrar isso é o mínimo que impede que a ausência seja lida como afirmação.
3. **Uma lacuna habilitante domina todas as medições:** sem ambiente semelhante a produção
   (L-14), nenhuma evidência de camada 2, 3 ou 4 pode ser produzida por ninguém — e
   camadas 2, 3 e 4 são exatamente o que o §7.2 exige para tornar um insumo elegível.
4. **Nenhuma combinação das lacunas fechadas produz uma via acionável neste horizonte,** e
   dizer o contrário seria desonesto: os portões de programa falham por razões que nenhum
   insumo conserta.

---

*Preparado pelo arquiteto de compatibilidade AMH-dados em 2026-08-15. Nenhuma ordem de
serviço foi criada ou alterada; nenhuma contradição foi adjudicada; nenhuma decisão foi
tomada; nenhum prazo foi inventado. Nada foi escrito no repositório AMH, nenhum ambiente
foi acessado, nenhuma credencial usada. Sem PHI, credenciais, CPF ou identificador real.*
