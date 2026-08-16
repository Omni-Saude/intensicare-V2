---
doc_id: LGPD-OS16-MODELO-RESPOSTA
title: Modelo de resposta ao pedido de parecer OS-16 — guia objetivo para o parecerista
status: PROPOSAL
label: PROPOSAL
owner: "UNASSIGNED — VALIDATION REQUIRED (autor pretendido do parecer: Dr. Lucas Alves de Sousa, OAB/GO nº 45.457 — GDEC-0011 item 3)"
source: >-
  minuta-parecer-os-16.md (4 pontos, 30 exclusões, questões Q-01..Q-25);
  pedido-de-parecer.md; decision-register.md GDEC-0008 item 1 (extensão de
  escopo: ética de pesquisa), GDEC-0009 (AGT-1/AGT-2) e GDEC-0011 item 3
  (envio + parecerista nomeado); solicitação escrita do titular em sessão
  de 2026-08-15 ("favorável ao pedido e tese — redigir exemplo de resposta
  como guia objetivo")
date_collected: "2026-08-15"
collector: orquestrador do mapa até produção — escriba (agente de engenharia)
last_updated: "2026-08-15"
---

# Modelo de resposta ao pedido de parecer OS-16

> **O QUE ESTE DOCUMENTO É — E O QUE NÃO É.** Este é um **modelo redigido por
> agente de engenharia**, sem habilitação para emitir opinião legal
> (DEC-G0-03; minuta §7 item 27). Ele **não é parecer jurídico e não produz
> nenhum efeito** nos gates deste repositório. Só produz efeito o documento
> que o parecerista **revisar, adaptar livremente, datar e assinar** — e as
> posições dele **prevalecem** sobre qualquer sugestão daqui, inclusive
> contrariando a tese. A direção "favorável" deste modelo reflete a
> comunicação do titular de que o parecerista é favorável ao pedido e à
> tese; os trechos marcados **[CONFIRMAR/AJUSTAR]** são exatamente os
> lugares onde a palavra é dele, não nossa. Critérios de aceitação do
> parecer: OS-16 (4 critérios — emissor qualificado com escopo e data;
> posição explícita nos 4 pontos; declaração do que não cobre; condições de
> mudança).

---

## PARECER JURÍDICO — [número/ano do parecerista]

**Consulente:** OMNI [razão social completa — PREENCHER], na qualidade de
responsável pelo programa IntensiCare V2.
**Parecerista:** Lucas Alves de Sousa, advogado, OAB/GO nº 45.457
[qualificação adicional — PREENCHER: experiência em proteção de dados /
saúde, se desejar constar].
**Objeto:** consulta formulada no documento `pedido-de-parecer.md` (OS-16),
com base técnica em `minuta-parecer-os-16.md` e anexos ali listados.
**Base fática examinada:** evidência técnica pinada no commit AMH
`0a07a6f1` e nos documentos do repositório IntensiCare V2 que me foram
apresentados; se a arquitetura mudar materialmente, vale a cláusula de
revisão (item VIII).
**Data:** [AAAA-MM-DD do ato de assinatura].

### I. Escopo e método

1. Este parecer responde aos **quatro pontos** submetidos — (a) índice de
   correspondência cross-PJ (ADR-043); (b) base legal do laço clínico;
   (c) bloqueio de usos secundários; (d) campo `ie_perm_sms_email` — e à
   **extensão de escopo** deliberada em GDEC-0008 item 1 (cobertura
   jurídico-ética da pesquisa do Gate G1, no formato redefinido por
   GDEC-0009: acesso retrospectivo a dados e variante observacional
   opcional).
2. Adoto a distinção da consulta entre **posição** (conclusão jurídica),
   **condicionante** (o que precisa existir para a conclusão valer) e
   **vedação** (o que permanece proibido independentemente do restante).
3. Respondo às questões Q-01..Q-25 no item VI, incorporando as críticas
   (Q-01, Q-06, Q-07, Q-11, Q-16) diretamente às conclusões dos pontos.

### II. Ponto (a) — índice de correspondência cross-PJ (ADR-043)

**Posição [CONFIRMAR/AJUSTAR]:** a criação e a manutenção do índice, na
forma minimalista decidida (estrutura própria contendo apenas pares
`(tenant, mpi_id)` com score, origem, revisor e data), são **lícitas** sob a
LGPD, com fundamento no art. 11, II, "f" (tutela da saúde), **para a
finalidade exclusiva de continuidade assistencial** do mesmo paciente entre
pessoas jurídicas do grupo — e somente para ela.

**Condicionantes (cumulativas):**
1. o par de correspondência é **dado pessoal sensível** por revelar vínculo
   assistencial (resposta à Q-05) — aplica-se o regime do art. 11 por
   inteiro;
2. **instrumento escrito entre os controladores** envolvidos (PJs clínicas,
   operadora e AMH), com alocação de papéis por operação (Q-02/Q-08),
   **antes do primeiro apply**;
3. **RIPD prévio** ao primeiro apply, com o conteúdo mínimo que indico no
   item VI (Q-09);
4. revogação de correspondência por **tombamento carimbado** (registro de
   revogação com data/autor), e não por exclusão física da linha, para
   preservar auditabilidade (arts. 6º, X, e 37) (Q-10);
5. acesso ao índice restrito, registrado e segregado do lago analítico.

**Vedação (art. 11, §5º) [CONFIRMAR/AJUSTAR]:** o §5º **incide** sobre a
operadora do grupo (Q-07). Fica **vedado em definitivo** — e essa vedação
deve ser tecnicamente verificável (controle negativo testável) — qualquer
uso do índice ou de dado de saúde para **seleção de risco, subscrição,
precificação, elegibilidade ou exclusão** de beneficiários, ainda que
houvesse consentimento. O controle societário comum **não** converte a
circulação entre PJs em "circulação interna": há uso compartilhado entre
controladores distintos (Q-01).

### III. Ponto (b) — base legal do laço clínico

**Posição [CONFIRMAR/AJUSTAR]:** o tratamento de dados pessoais sensíveis
no laço clínico assistencial do IntensiCare V2 — ingestão, avaliação
determinística, alerta e registro, dentro do mesmo tenant — encontra base
no **art. 11, II, "f" (tutela da saúde)**, em procedimento realizado por
profissionais de saúde, **sem gate de consentimento**. O software atua como
instrumento do serviço de saúde: a V2 opera, nesse laço, como **operadora**
por conta do serviço (Leitura 1 da minuta §4.3; Q-11), o que deve ser
espelhado no instrumento do art. 39.

**Condicionantes:**
1. o caráter **consultivo** dos escores e alertas (a decisão clínica
   permanece com profissional responsável) deve estar documentado e
   verificável — é isso que afasta a incidência autônoma do art. 20
   (Q-15) **[CONFIRMAR/AJUSTAR]**; recomendo registrar como evidência os
   requisitos de UX/traçabilidade já existentes no repositório;
2. em situações de risco iminente à vida, a alínea "e" pode ser invocada
   **cumulativamente** com a "f" (Q-12) **[CONFIRMAR/AJUSTAR]**;
3. o art. 11 não contém equivalente ao art. 7º, §7º: leio a ausência como
   **restritiva** — novo uso exige nova base própria (Q-14)
   **[CONFIRMAR/AJUSTAR]**.

### IV. Ponto (c) — usos secundários

**Posição [CONFIRMAR/AJUSTAR]:** permanecem **bloqueados** todos os usos
secundários (finalidade distinta da assistência ao próprio paciente) até
que exista, por uso, base legal própria e infraestrutura de consentimento
ou anonimização demonstrável. Com duas delimitações:

1. **Avaliação de qualidade do cuidado** feita pelo próprio serviço, sobre
   seus próprios pacientes, **com resultado retornando ao cuidado**,
   está **dentro** da alínea "f" — não é uso secundário (Q-16). É esse o
   enquadramento que sustenta o **baseline retrospectivo** do programa
   (GDEC-0009/AGT-2), observadas as condicionantes do item V.
2. **Anonimização** (art. 12) só retira o conjunto do âmbito da LGPD
   mediante demonstração documentada de irreversibilidade por meios
   razoáveis, incluindo **teste de reidentificação** (Q-17); pesquisa com
   fim científico por entidade com fins lucrativos pode buscar a via da
   alínea "c" **em parceria com órgão de pesquisa** qualificado (Q-18).

### V. Extensão de escopo — cobertura jurídico-ética da pesquisa do G1 (BLK-0013)

**[CONFIRMAR/AJUSTAR — seção de maior sensibilidade]**

1. **Baseline retrospectivo (AGT-2):** o acesso a dados históricos
   assistenciais para reconstruir carga de alertas, tempos de
   reconhecimento e desfechos, com finalidade de avaliação de qualidade e
   segurança do próprio serviço e resultado retornando ao cuidado,
   enquadra-se na alínea "f" (item IV.1), **sem** exigência de rota
   CEP/CONEP enquanto não houver finalidade de produção de conhecimento
   generalizável destinado a publicação. Condicionantes: corte histórico
   documentado; acesso mínimo necessário; sem transferência a terceiros;
   reclassificação obrigatória para o regime de pesquisa (item V.2) se a
   finalidade mudar.
2. **Variante observacional de campo (opcional, pré-piloto):** observação
   e entrevistas com profissionais **são pesquisa com seres humanos** —
   antes de qualquer campo: rota **CEP/CONEP** (Res. CNS 466/2012 e
   510/2016, conforme o desenho), TCLE dos participantes e as demais
   exigências do protocolo do g1-kit. O bloqueio de campo (BLK-0013) só se
   considera disposto com a aprovação ética correspondente.
3. **Piloto assistencial supervisionado (G8):** implantação assistencial
   com avaliação de qualidade não é, por si, pesquisa; a fronteira é a
   finalidade (conhecimento generalizável/publicação) — recomendo
   reavaliação específica ao desenho final do piloto.

### VI. Ponto (d) e respostas às questões Q-01..Q-25

**Ponto (d) — posição:** `ie_perm_sms_email` é permissão de **contato**;
**jamais** constitui consentimento LGPD para tratamento de dado de saúde
(Q-20: confirmo sem ressalva). Sua ausência ou negativa **não produz efeito
algum** sobre o laço clínico (Q-21); recomendo **segregação explícita** do
campo no lago, para que não seja lido como consentimento por engano (Q-22).

Respostas objetivas às demais questões (modelo — uma linha por questão,
para o parecerista confirmar, expandir ou divergir):

| Q | Resposta-modelo [CONFIRMAR/AJUSTAR cada uma] |
|---|---|
| Q-01 | Controle comum não afasta a LGPD: há uso compartilhado entre controladores distintos (art. 5º, XVI); "circulação interna" não existe entre PJs. |
| Q-02 | Alocação por operação, em anexo próprio do instrumento do art. 39: PJs clínicas = controladoras do prontuário; operadora = controladora dos dados de plano; AMH = operadora (infraestrutura de dados); V2 = operadora no laço clínico. |
| Q-03 | Sim: `portable_subject_ref` é pseudonimização, não anonimização — dado pessoal para a V2. |
| Q-04 | Governança mínima (política, encarregado, ROPA) deve preceder o primeiro tratamento real; formalizo como condicionante de eficácia, não como impedimento ao desenho. |
| Q-05 | Sim, e sensível (revela relação assistencial). |
| Q-06 | Art. 11, II, "f", finalidade exclusiva de continuidade assistencial — registrar em emenda ao ADR-043 (que hoje não nomeia artigo). |
| Q-07 | Sim, incide; vedações definitivas e verificáveis do item II. |
| Q-08 | Instrumento entre controladores + instruções do art. 39 aos operadores, antes do primeiro apply. |
| Q-09 | Sim, RIPD prévio: descrição do índice, finalidade, necessidade/proporcionalidade, riscos aos titulares, salvaguardas e vedações do §5º. |
| Q-10 | Revogação carimbada; exclusão física destrói a trilha exigível. |
| Q-11 | Operadora (Leitura 1), espelhada contratualmente. |
| Q-12 | Sim, cumulação "e"+"f" nas situações de risco iminente. |
| Q-13 | Procedimento dirigido por profissional habilitado; o software é instrumento — condição verificável pelo caráter consultivo documentado. |
| Q-14 | Ausência restritiva: nova finalidade, nova base. |
| Q-15 | Art. 20 não acionado enquanto a decisão for de profissional; evidência: rastro de que alertas são consultivos e há revisão humana. |
| Q-16 | Dentro da alínea "f" (qualidade do cuidado com retorno ao cuidado). |
| Q-17 | Demonstração de irreversibilidade + teste de reidentificação documentado. |
| Q-18 | Sim, via parceria com órgão de pesquisa (alínea "c"), com instrumento próprio. |
| Q-19 | Registro com finalidade específica, evidência de manifestação, prova de autoria/data e revogação simétrica — nada disso existe hoje; logo, uso secundário segue bloqueado. |
| Q-23 | Sim, admito duas etapas (preliminar: pontos b+d; definitiva: a+c) — [o parecerista escolhe e data cada etapa]. |
| Q-24 | [Listar documentos adicionais que precisar — ou declarar suficiência dos anexos.] |
| Q-25 | Ver item VIII. |

### VII. O que este parecer NÃO cobre

Adoto expressamente a lista de exclusões da minuta §7, itens 1 a 26
(ANVISA/SaMD; certificação de S-RES; normas CFM e demais conselhos; sigilo
profissional; ANS; contratos do art. 39 — cuja **exigência** afirmo, mas
cuja **redação** não faço aqui; instrumento entre controladores; contratos
com instituições; transferência internacional; residência de dados;
provedores de LLM; crianças e adolescentes; titulares falecidos; dados de
trabalhadores; RIPD — exigido, não elaborado; ROPA; encarregado; resposta a
incidentes; prazos de retenção; direitos do titular; art. 20 além do
respondido em Q-15; responsabilidade civil e sanções; regime CEP/CONEP
além do enquadramento de rota do item V; concorrência; discriminação em
outros regimes). [AJUSTAR: excluir/incluir conforme o parecerista.]

### VIII. Condições de revisão (Q-25)

Este parecer deve ser **revisitado** se ocorrer qualquer um: (1) alteração
legislativa ou regulamentação/decisão da ANPD sobre grupos econômicos em
saúde, art. 11 ou art. 20; (2) mudança material da arquitetura examinada
(novo commit de referência que altere o índice, o PSR ou os fluxos); (3)
início efetivo de tratamento de dado real (gatilho de reavaliação prática);
(4) decurso de [12 meses — AJUSTAR] da assinatura; (5) qualquer incidente
de segurança envolvendo os dados examinados.

### IX. Conclusão operacional

Com as condicionantes e vedações acima: **(i)** favorável à tese dos quatro
pontos, nos termos dos itens II-IV e VI; **(ii)** favorável ao acesso
retrospectivo para o baseline (item V.1) e à rota CEP/CONEP como condição
da variante de campo (item V.2). Registro, por fidelidade ao pedido, que
este parecer é o gatilho previsto em DEC-G0-03 para dado real e compõe a
condição 4 da autorização AGT-3 — e que, nos termos da ata GDEC-0009, sua
emissão **reabre** aquela autorização para revisita pelo titular.

[Local], [data].

_____________________________________
**Lucas Alves de Sousa** — OAB/GO nº 45.457

---

> **Nota do escriba (fora do modelo):** ao receber a versão assinada,
> anexar ao ADR-043 (AMH) conforme critério da OS-16, registrar a
> disposição de BLK-0013/BLK-0004 no blockers-register, abrir a revisita
> da AGT-3 (gatilho "primeiro parecer") e re-datar `contracts.lock` /
> premissas dependentes. Nenhum desses efeitos ocorre com este modelo —
> somente com o parecer emitido.
