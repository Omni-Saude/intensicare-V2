---
doc_id: LGPD-OS16-PEDIDO
status: PROPOSAL
owner: UNASSIGNED — VALIDATION REQUIRED (o envio depende de humano nomeado; AUTH-PRIVACY-LEGAL não nomeado, BLK-0004/DEC-G0-03)
source: >
  Critério de aceitação do OS-16 em docs/08-interoperability/amh-data/ordens-de-servico-amh-2026-08-15.md §5;
  DEC-G0-03 em docs/00-governance/registers/g0-resolucoes-2026-08-15.md;
  minuta técnica em docs/11-security-privacy-compliance/lgpd-os16/minuta-parecer-os-16.md;
  exigência de anexo de parecer em Omni-Saude/amh-data-platform@0a07a6f1fab36fb2f5eeee0fcd8e945c95f67116
  architecture/adrs/ADR-043-indice-de-correspondencia-de-identidade-entre-pjs.md L5-6
date_collected: 2026-08-15
collector: engenheiro de privacidade, LGPD e registros (IntensiCare V2, ciclo 1)
transformation: texto de solicitação redigido a partir do critério de aceitação do OS-16; nenhum envio realizado
confidence: media
last_updated: 2026-08-15
validation_status: VALIDAÇÃO NECESSÁRIA — revisão e envio por humano nomeado
---

# Pedido de parecer jurídico — OS-16

> ## ⚠️ SUGESTÃO DE AGENTE — texto proposto, ainda não enviado
>
> Este documento contém o **texto proposto** da solicitação. Nenhum envio foi
> feito, nenhum destinatário foi contatado e nenhum prazo foi assumido perante
> terceiros. O envio é ato de **humano nomeado** — `DEC-G0-03`: agentes redigem
> material jurídico/privacidade **apenas como sugestão**.
>
> Antes de enviar, o remetente deve: (i) preencher os campos entre colchetes;
> (ii) confirmar as premissas P-1 a P-7 da minuta, que o(a) advogado(a) receberá
> como fatos assumidos; (iii) confirmar que os anexos estão acessíveis ao
> destinatário; e (iv) decidir se o pedido segue em uma ou em duas etapas (§4).

---

## §1. Por que este pedido existe

**FONTE** — `docs/08-interoperability/amh-data/ordens-de-servico-amh-2026-08-15.md`
§5, OS-16, classificada como **⚠️ ÚNICA DEPENDÊNCIA EXTERNA** do pacote AMH:

> "**Dependências.** Nenhuma técnica — e é exatamente por isso que deve começar já.
> Este é o item de maior prazo de espera de todo o pacote e o único que nenhuma
> equipe de engenharia pode acelerar."

**FONTE** — `Omni-Saude/amh-data-platform@0a07a6f1` `architecture/adrs/ADR-043-…md`
L5-6: *"O parecer do DPO/jurídico deve ser anexado a este ADR **antes do primeiro
apply**."*

**FONTE** — `DEC-G0-03`: *"Gatilho obrigatório: parecer jurídico brasileiro antes de
qualquer teste de conformidade com dados reais, operação sombra ou piloto
(G6/G8)."*

**INFERÊNCIA:** o parecer trava, simultaneamente, o primeiro *apply* do índice do
ADR-043, o *apply* dos DDLs do `portable_subject_ref` (SP-1), o *backfill* de
*minting* (SP-5), a forma final do `consent_decision_ref` (SP-4), a reativação da
OS-21 e todos os Gates G6/G8. É o único item do pacote que nenhuma equipe técnica
pode antecipar por esforço próprio.

---

## §2. Texto proposto da solicitação

> O bloco abaixo é o texto a enviar. Reproduzir integralmente, preenchendo os
> campos entre colchetes.

---

**Assunto:** Solicitação de parecer jurídico — LGPD — projeto IntensiCare V2 e
índice de correspondência de identidade entre pessoas jurídicas (ADR-043)

**De:** [nome e cargo do remetente]
**Para:** [nome do(a) advogado(a) ou da banca]
**Data:** [data do envio]

Prezado(a) [nome],

Solicitamos parecer jurídico em matéria de proteção de dados pessoais,
especificamente sob a Lei nº 13.709/2018 (LGPD), a respeito do projeto
**IntensiCare V2** — sistema de apoio à decisão clínica em terapia intensiva, em
fase de projeto — e da sua relação com a plataforma de dados **AMH**.

**Estado atual, e por que o pedido é prévio.** O sistema **não existe em operação**:
não há código em produção, ambiente produtivo, usuário nem dado. **Nenhum dado
pessoal foi tratado até a presente data**, e o desenvolvimento prossegue
exclusivamente com **dados sintéticos**, por decisão interna registrada. O parecer
é solicitado **antes** de qualquer tratamento de dado real, e não para regularizar
situação existente. Consequência prática: as recomendações que o parecer venha a
fazer sobre **desenho** ainda são exequíveis a custo baixo — o que deixará de ser
verdade após a próxima etapa de arquitetura.

### 1. Escopo solicitado

Pedimos parecer sobre **quatro pontos**, cada um com **posição explícita**:

**(a) O índice de correspondência de identidade entre pessoas jurídicas (ADR-043).**
Estrutura que correlaciona identidades de pacientes já resolvidas separadamente em
cada pessoa jurídica do grupo — incluindo, de um lado, prestadores de serviço de
saúde e, de outro, uma operadora de plano privado de assistência à saúde. Pedimos
manifestação sobre: **licitude**; **base legal candidata**, com indicação de artigo,
inciso e alínea; **salvaguardas mínimas** exigíveis antes do primeiro uso;
**alocação de papéis** de controlador e operador entre as pessoas jurídicas
envolvidas e a plataforma de dados; e **riscos** relevantes. Solicitamos atenção
específica ao **art. 11, §4º e §5º** da LGPD, dada a presença de uma operadora de
plano de saúde entre as partes.

**(b) A base legal do laço clínico.** A organização pretende invocar o **art. 11,
II, alínea "f"** — tutela da saúde, exclusivamente em procedimento realizado por
profissionais de saúde, serviços de saúde ou autoridade sanitária — como base do
tratamento no laço clínico do IntensiCare V2, entendido como: avaliação dos dados
de um paciente sob cuidado, em um serviço de saúde, para apresentação ao
profissional de saúde responsável por aquele paciente, no curso da assistência.
Pedimos manifestação sobre a **adequação** dessa hipótese ao caso concreto, sobre
seus **limites**, e sobre a posição — que a organização pretende adotar — de que
**o consentimento não é a base adequada** para o laço clínico.

**(c) O bloqueio de usos secundários.** A organização pretende **bloquear**, sem
nova base legal específica, todo uso dos mesmos dados para finalidade distinta da
assistência ao próprio titular — em especial *analytics*, pesquisa e treinamento
de modelos. Pedimos manifestação sobre **o que exatamente fica vedado** e sobre **o
que seria preciso, por finalidade, para desbloquear**.

**(d) Permissão de contato não é consentimento.** O único campo de permissão que
chega hoje ao lago de dados é um indicador de **permissão de contato por SMS e
e-mail**, oriundo do cadastro do ERP hospitalar. Pedimos **confirmação expressa** de
que esse campo **jamais** constitui consentimento LGPD para tratamento de dados de
saúde — em nenhuma direção, isto é, nem para autorizar, nem para negar.

### 2. Critério de aceitação do parecer

Para que o parecer cumpra a função de destravamento que dele se espera, ele precisa
conter, **cumulativamente**:

1. **Escopo declarado** — o que o parecer analisa;
2. **Data** de emissão e identificação do(a) emitente;
3. **Posição explícita** sobre **cada um** dos quatro pontos, com indicação de
   artigo, inciso e alínea da LGPD em que se apoia;
4. **Exclusões declaradas** — o que o parecer **não** cobre, em lista explícita, para
   que a ausência não seja lida como manifestação favorável;
5. **Condições de mudança** — sob quais circunstâncias, de fato ou de direito, cada
   posição deixaria de valer;
6. **Condicionantes operacionais**, quando for o caso — se a posição depender de
   salvaguarda, contrato, registro ou controle técnico, pedimos que a condicionante
   seja enunciada de forma **verificável**, para que possamos convertê-la em
   requisito e em teste.

O parecer será **anexado ao ADR-043** no repositório da plataforma de dados,
conforme aquele documento exige, e registrado no registro de decisões do projeto.

### 3. Anexos

| # | Documento | Natureza |
|---|---|---|
| **A-1** | `ADR-043 — Índice de correspondência de identidade entre PJs`, no commit pinado `0a07a6f1fab36fb2f5eeee0fcd8e945c95f67116` | Decisão de arquitetura que cria o índice; é o texto que o parecer deve cobrir no ponto (a). Contém, no cabeçalho, a exigência do parecer. |
| **A-2** | `ADR-045 — O log de consentimento é um log de EVENTO, não uma tabela de estado`, mesmo commit | Registra o estado real da infraestrutura de consentimento: a tabela tem 14 consumidores e **zero produtores**; e registra o campo de permissão de contato objeto do ponto (d). |
| **A-3** | Ata de adjudicação de identidade, *tenancy* e consentimento, de 2026-08-15 — resoluções **AQ-3** (base legal do laço clínico) e **AQ-4** (identificador de fronteira) | Registra as decisões de negócio que o parecer avalia, e a autoridade que as tomou. **AQ-3 registra expressamente que a ratificação jurídica está pendente.** |
| **A-4** | `minuta-parecer-os-16.md` — minuta técnica preparatória | **Insumo, não parecer.** Redigida por equipe de engenharia de privacidade, sem valor jurídico. Contém os fatos com proveniência, a análise preliminar por ponto, as premissas assumidas (P-1 a P-7) e **25 questões numeradas** (Q-01 a Q-25). |
| **A-5** | Desenho `AMH-020b — portable_subject_ref`, mesmo commit *(opcional, recomendado)* | Descreve o identificador opaco de fronteira e a tabela de mapeamento que o torna re-associável — relevante à qualificação de pseudonimização versus anonimização. |
| **A-6** | Mapa de dados e privacidade do IntensiCare V2 *(opcional)* | Inventário antecipado de categorias, finalidades candidatas e fluxos. Nenhuma finalidade aprovada, nenhum operador contratado. |

**Sobre os anexos A-1, A-2 e A-5:** são documentos técnicos internos, fixados em um
commit específico para que o parecer se refira a um texto imutável. Nenhum deles
contém dado de paciente.

### 4. Prazo sugerido e justificativa

Sugerimos, como prazo de referência:

| Etapa | Conteúdo | Prazo sugerido |
|---|---|---|
| **Aceite e questões de esclarecimento** | Confirmação de escopo e pedido de documentos adicionais | **5 dias corridos** do envio |
| **Parecer preliminar** | Pontos **(b)** e **(d)** | **20 dias corridos** do envio |
| **Parecer definitivo** | Pontos **(a)** e **(c)**, consolidando (b) e (d) | **45 dias corridos** do envio |

**Justificativa do desdobramento em duas etapas.** Os pontos (b) e (d) são os que
travam o **desenho do contrato de dados** e podem ser respondidos com o material
anexo. Os pontos (a) e (c) envolvem regulação de saúde suplementar, alocação de
papéis entre pessoas jurídicas e possível interlocução com a operadora — e é
razoável que demorem mais. Antecipar (b) e (d) permite que a engenharia avance sem
que a organização tome, por omissão, uma decisão jurídica que não lhe cabe.

**Justificativa de caminho crítico.** O pedido é feito **no início**, e não ao final,
do pacote de trabalho, deliberadamente:

1. **Nenhuma dependência técnica precede este pedido.** Não há artefato de
   engenharia a produzir antes dele; adiá-lo apenas empurra a data final.
2. **O parecer é a única dependência externa do pacote.** As demais 20 ordens de
   serviço podem correr em paralelo; esta não pode ser acelerada por esforço de
   engenharia.
3. **O que ele libera é desproporcional ao seu tamanho.** Sem o parecer, não ocorrem:
   o primeiro uso do índice do ADR-043; a aplicação dos DDLs do identificador de
   fronteira; o *backfill*; a forma final do campo de referência de consentimento; e
   **qualquer** teste, operação sombra ou piloto com dado real.
4. **O custo de mudança cresce rapidamente.** Enquanto não houver esquema fixado nem
   ambiente construído, uma condicionante do parecer é ajuste de desenho. Depois,
   passa a ser migração — em especial se a condicionante tocar retenção, trilha de
   auditoria ou o formato do identificador de sujeito.
5. **Um parecer costuma ter iterações.** Reservamos prazo para uma rodada de
   perguntas e respostas dentro da janela acima, em vez de descobri-la depois dela.

Os prazos são **sugestões nossas**, não imposições, e podem ser renegociados na
etapa de aceite. Se qualquer dos quatro pontos exigir prazo maior, pedimos que isso
seja dito **no aceite**, para que o cronograma seja ajustado de imediato — um prazo
conhecido é gerenciável; um prazo descoberto no vencimento, não.

### 5. Compromissos da nossa parte

1. **Nenhum dado real será tratado até o parecer.** O desenvolvimento permanece com
   dados sintéticos.
2. **Nenhum *apply*** do índice do ADR-043 ou dos DDLs do identificador de fronteira
   ocorrerá em ambiente com dado real antes do parecer.
3. **Responderemos a pedidos de informação** com evidência rastreável por caminho e
   commit, e não por descrição de memória.
4. **Registraremos as condicionantes** do parecer como requisitos rastreáveis e
   testes, e informaremos quando cada uma for cumprida.
5. **Se qualquer premissa da minuta (P-1 a P-7) se revelar falsa**, comunicaremos
   imediatamente, por entender que ela altera a análise.

Permanecemos à disposição.

Atenciosamente,
[nome e cargo do remetente]
[organização]

---

## §3. Lista de verificação antes do envio

**PROPOSTA — para o humano que enviará.**

| # | Verificação | Estado |
|---|---|---|
| 1 | Destinatário definido, com habilitação em direito brasileiro e experiência em proteção de dados no setor de saúde | **PENDENTE** |
| 2 | Campos entre colchetes preenchidos | **PENDENTE** |
| 3 | Premissas P-1 a P-7 da minuta conferidas e corrigidas onde necessário | **PENDENTE** |
| 4 | Anexos A-1 a A-4 disponibilizados; A-5 e A-6 decididos | **PENDENTE** |
| 5 | Confirmado que nenhum anexo contém dado de paciente, credencial ou identificador real | **PENDENTE** |
| 6 | Decidido se o pedido segue em uma ou em duas etapas | **PENDENTE** |
| 7 | Instrumento de contratação do serviço jurídico e sigilo verificados | **PENDENTE** |
| 8 | Entrada correspondente aberta no `blockers-register.md` com data de envio e prazo acordado | **PENDENTE — steward de governança** |

**INFERÊNCIA:** enquanto a linha 1 estiver pendente, o caminho crítico **não
começou** — a data de início do prazo é a data do envio, não a data desta minuta.
Esse é o item de maior valor a resolver hoje.

---

## §4. O que este pedido não faz

1. **Não contrata** serviço jurídico nem estabelece honorários ou prazos vinculantes.
2. **Não nomeia** `AUTH-PRIVACY-LEGAL`; o titular do papel permanece **UNASSIGNED**
   (`BLK-0004`, reclassificado por `DEC-G0-03`).
3. **Não antecipa** o conteúdo do parecer, e nada nele deve ser lido como
   expectativa de resposta favorável.
4. **Não substitui** os demais portões humanos do pacote AMH (SP-1 a SP-7), que
   permanecem exigíveis por si.
5. **Não cobre** as matérias listadas em `minuta-parecer-os-16.md` §7 — em especial
   ANVISA/SaMD, prontuário e normas de conselho profissional, regulação de saúde
   suplementar, contratos com operadores e transferência internacional.
6. **Não foi enviado.**

---

*Preparado pelo engenheiro de privacidade, LGPD e registros do IntensiCare V2, em
2026-08-15, como sugestão, conforme `DEC-G0-03`. Idioma pt-BR conforme `DEC-G0-10`.
Sem dado pessoal, credencial ou identificador real.*
