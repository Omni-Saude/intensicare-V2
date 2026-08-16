---
doc_id: LGPD-OS16-PARECER-RECEBIDO
title: Parecer OS-16 — recebido do parecerista (transcrição fiel) + análise de conformidade
status: "OBSERVED — transcrição fiel do parecer recebido; original assinado a arquivar"
label: OBSERVED
owner: rodaquino-OMNI (transmitente); autor do parecer — Dr. Lucas Alves de Sousa, OAB/GO nº 45.457
source: >-
  Parecer transmitido por escrito pelo titular em sessão de 2026-08-15
  ("segue o parecer recebido do Dr Lucas, que ratificou a maior parte das
  sugestões"); pedido em pedido-de-parecer.md; base técnica em
  minuta-parecer-os-16.md; guia em modelo-de-resposta-parecer.md
date_collected: "2026-08-15"
collector: orquestrador do mapa até produção — escriba; complemento de 2026-08-16 transcrito pelo orquestrador de execução (ciclo 5)
last_updated: "2026-08-16"
---

# Parecer OS-16 — recebido em 2026-08-15

> **Natureza deste arquivo:** transcrição fiel, feita pelo escriba, do
> parecer transmitido pelo titular. O **original assinado** (PDF/físico)
> deve ser arquivado e referenciado aqui quando disponível. A análise de
> conformidade do escriba e a complementação sugerida estão APÓS a
> transcrição e não fazem parte do parecer. Alocação de `EVID-*` para esta
> recepção: pendente da próxima integração do steward de governança.

---

## Transcrição fiel do recebido

1. Este parecer responde aos quatro pontos submetidos — (a) índice de correspondência cross-PJ (ADR-043); (b) base legal do laço clínico; (c) bloqueio de usos secundários; (d) campo `ie_perm_sms_email` — e à extensão de escopo: deliberada em GDEC-0008 item 1 (cobertura jurídico-ética da pesquisa do Gate G1, no formato redefinido por GDEC-0009: acesso retrospectivo a dados e variante observacional opcional).
2. Respondo às questões Q-01..Q-25 no item VI, incorporando as críticas (Q-01, Q-06, Q-07, Q-11, Q-16) diretamente às conclusões dos pontos.

### II. Ponto (a) — índice de correspondência cross-PJ (ADR-043)

A criação e a manutenção do índice, na forma minimalista decidida (estrutura própria contendo apenas pares`(tenant, mpi_id)` com score, origem, revisor e data), são **lícitas** sob a LGPD, com fundamento no art. 11, II, "f" (tutela da saúde), **para a finalidade exclusiva de continuidade assistencial** do mesmo paciente entre pessoas jurídicas do grupo — e somente para ela.

**Condicionantes (cumulativas):**
1. o par de correspondência é **dado pessoal sensível** por revelar vínculo assistencial (resposta à Q-05) — aplica-se o regime do art. 11 por  inteiro;
2. **instrumento escrito entre os controladores** envolvidos (PJs clínicas, operadora e AMH), com alocação de papéis por operação (Q-02/Q-08), antes do primeiro apply;
3. **RIPD prévio** ao primeiro apply, com o conteúdo mínimo que indico no item VI (Q-09);
4. revogação de correspondência por **tombamento carimbado** (registro de revogação com data/autor), e não por exclusão física da linha, para preservar auditabilidade (arts. 6º, X, e 37) (Q-10);
5. acesso ao índice restrito, registrado e segregado do lago analítico.

**Vedação (art. 11, §5º) [CONFIRMAR/AJUSTAR]:** o §5º **incide** sobre a operadora do grupo (Q-07). Fica **vedado em definitivo** — e essa vedação deve ser tecnicamente verificável (controle negativo testável) — qualquer uso do índice ou de dado de saúde para **seleção de risco, subscrição, precificação, elegibilidade ou exclusão** de beneficiários, ainda que houvesse consentimento. O controle societário comum **não** converte a circulação entre PJs em "circulação interna": há uso compartilhado entre controladores distintos (Q-01).

### III. Ponto (b) — base legal do laço clínico

O tratamento de dados pessoais sensíveis no laço clínico assistencial do IntensiCare V2 — ingestão, avaliação determinística, alerta e registro, dentro do mesmo tenant — encontra base no **art. 11, II, "f" (tutela da saúde)**, em procedimento realizado por profissionais de saúde, **sem gate de consentimento**. O software atua como instrumento do serviço de saúde: a V2 opera, nesse laço, como **operadora** por conta do serviço (Leitura 1 da minuta §4.3; Q-11), o que deve ser espelhado no instrumento do art. 39.

**Condicionantes:**
1. o caráter **consultivo** dos escores e alertas (a decisão clínica permanece com profissional responsável) deve estar documentado e verificável — é isso que afasta a incidência autônoma do art. 20 (Q-15); recomendo registrar como evidência os requisitos de UX/traçabilidade já existentes no repositório;
2. em situações de risco iminente à vida, a alínea "e" pode ser invocada cumulativamente com a "f" (Q-12);
3. o art. 11 não contém equivalente ao art. 7º, §7º: leio a ausência como **restritiva** — novo uso exige nova base própria (Q-14).

### IV. Ponto (c) — usos secundários

Permanecem **bloqueados** todos os usos secundários (finalidade distinta da assistência ao próprio paciente) até que exista, por uso, base legal própria e infraestrutura de consentimento ou anonimização demonstrável. Com duas delimitações:

1. **Avaliação de qualidade do cuidado** feita pelo próprio serviço, sobre seus próprios pacientes, **com resultado retornando ao cuidado**, está **dentro** da alínea "f" — não é uso secundário (Q-16). É esse o enquadramento que sustenta o **baseline retrospectivo** do programa (GDEC-0009/AGT-2), observadas as condicionantes do item V.
2. **Anonimização** (art. 12) só retira o conjunto do âmbito da LGPD mediante demonstração documentada de irreversibilidade por meios razoáveis, incluindo **teste de reidentificação** (Q-17); pesquisa com fim científico por entidade com fins lucrativos pode buscar a via da alínea "c" **em parceria com órgão de pesquisa** qualificado (Q-18).

### V. Extensão de escopo — cobertura jurídico-ética da pesquisa do G1 (BLK-0013)

1. **Baseline retrospectivo (AGT-2):** o acesso a dados históricos assistenciais para reconstruir carga de alertas, tempos de reconhecimento e desfechos, com finalidade de avaliação de qualidade e segurança do próprio serviço e resultado retornando ao cuidado, enquadra-se na alínea "f" (item IV.1), **sem** exigência de rota CEP/CONEP enquanto não houver finalidade de produção de conhecimento generalizável destinado a publicação. Condicionantes: corte histórico documentado; acesso mínimo necessário; sem transferência a terceiros  reclassificação obrigatória para o regime de pesquisa (item V.2) se a finalidade mudar.
2. **Variante observacional de campo (opcional, pré-piloto):** observação e entrevistas com profissionais **são pesquisa com seres humanos** — antes de qualquer campo: rota **CEP/CONEP** (Res. CNS 466/2012 e 510/2016, conforme o desenho), TCLE dos participantes e as demais exigências do protocolo do g1-kit. O bloqueio de campo (BLK-0013) só se considera disposto com a aprovação ética correspondente.
3. **Piloto assistencial supervisionado (G8):** implantação assistencial com avaliação de qualidade não é, por si, pesquisa; a fronteira é a finalidade (conhecimento generalizável/publicação) — recomendo reavaliação específica ao desenho final do piloto.

### VI. Ponto (d) e respostas às questões Q-01..Q-25

**Ponto (d) — posição:** `ie_perm_sms_email` é permissão de **contato**; **jamais** constitui consentimento LGPD para tratamento de dado de saúde (Q-20: confirmo sem ressalva). Sua ausência ou negativa **não produz efeito algum** sobre o laço clínico (Q-21); recomendo **segregação explícita** do campo no lago, para que não seja lido como consentimento por engano (Q-22).

Respostas objetivas às demais questões (modelo — uma linha por questão, para o parecerista confirmar, expandir ou divergir):

| Q | Resposta-modelo |
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

### IX. Conclusão operacional

Com as condicionantes e vedações acima: **(i)** favorável à tese dos quatro pontos, nos termos dos itens II-IV e VI; **(ii)** favorável ao acesso retrospectivo para o baseline (item V.1) e à rota CEP/CONEP como condição da variante de campo (item V.2). Registro, por fidelidade ao pedido, que este parecer é o gatilho previsto em DEC-G0-03 para dado real e compõe a condição 4 da autorização AGT-3 — e que, nos termos da ata GDEC-0009, sua emissão **reabre** aquela autorização para revisita pelo titular.

Goiania-GO 15/08/2026

_____________________________________
Lucas Alves de Sousa — OAB/GO nº 45.457

---

## Complemento recebido em 2026-08-16 — seções VII e VIII (transcrição fiel)

> **Proveniência:** complemento do parecerista retransmitido **por escrito
> pelo titular** em sessão de 2026-08-16 ao orquestrador de execução
> (ciclo 5); transcrição fiel; supre os itens (1) e (2) da complementação
> sugerida abaixo. Original assinado do complemento: a arquivar junto do
> original do parecer.

### VII. O que este parecer NÃO cobre

Adoto expressamente a lista de exclusões da minuta §7, itens 1 a 26
(ANVISA/SaMD; certificação de S-RES; normas CFM e demais conselhos; sigilo
profissional; ANS; contratos do art. 39 — cuja **exigência** afirmo, mas
cuja **redação** não faço aqui; instrumento entre controladores; contratos
com instituições; transferência internacional; residência de dados;
provedores de LLM; crianças e adolescentes; titulares falecidos; dados de
trabalhadores; RIPD — exigido, não elaborado; ROPA; encarregado; resposta a
incidentes; prazos de retenção; direitos do titular; art. 20 além do
respondido em Q-15; responsabilidade civil e sanções; regime CEP/CONEP além
do enquadramento de rota do item V; concorrência; discriminação em outros
regimes).

### VIII. Condições de revisão (Q-25)

Este parecer deve ser **revisitado** se ocorrer qualquer um: (1) alteração
legislativa ou regulamentação/decisão da ANPD sobre grupos econômicos em
saúde, art. 11 ou art. 20; (2) mudança material da arquitetura examinada
(novo commit de referência que altere o índice, o PSR ou os fluxos); (3)
início efetivo de tratamento de dado real (gatilho de reavaliação prática);
(4) decurso de **24 meses** da assinatura; (5) qualquer incidente de
segurança envolvendo os dados examinados.

---

## Análise de conformidade do escriba (não integra o parecer)

Contra os **4 critérios de aceitação da OS-16**:

| Critério | Estado | Evidência |
|---|---|---|
| (i) Emissor qualificado, escopo, data | **PARCIAL** | Qualificação (OAB/GO 45.457), escopo (item I) e data/local (Goiânia-GO, 15/08/2026) presentes; assinatura transcrita — **original assinado a arquivar**; "anexado ao ADR-043" é ato do lado AMH (política de zero escrita da V2) — pendente |
| (ii) Posição explícita nos 4 pontos | **SATISFEITO** | Itens II, III, IV e VI (ponto d), mais a extensão do item V — todos com posição, condicionantes e vedações |
| (iii) Declara o que não cobre | **SATISFEITO (complemento 2026-08-16)** | Seção VII recebida por complemento escrito do parecerista (transcrição acima): adota as exclusões da minuta §7, itens 1-26 |
| (iv) Registra condições de mudança | **SATISFEITO (complemento 2026-08-16)** | Seção VIII recebida (transcrição acima): 5 condições de revisão, incl. início de tratamento de dado real e decurso de **24 meses** (prazo do parecerista, distinto dos 12 do modelo); a remissão da Q-25 agora resolve |

**Resíduos de forma adicionais** (transcritos, não corrigidos): marcador
`[CONFIRMAR/AJUSTAR]` remanescente no título da vedação do §5º (o conteúdo
foi mantido integralmente — leitura provável: ratificado; registro a
ambiguidade); placeholders do modelo em Q-23 e Q-24; cabeçalho da tabela
ainda diz "modelo".

**Disposição fail-closed (nenhum gate enfraquecido):** enquanto (iii) e
(iv) não forem supridos — por complementação escrita do parecerista ou por
nova via do documento — o parecer **não satisfaz** os critérios da OS-16;
portanto: DEC-G0-03 permanece **integral** (somente dados sintéticos);
a **condição 4 da AGT-3 permanece NÃO satisfeita**; BLK-0004 e BLK-0013
permanecem nos estados atuais (com notas de recepção). O **gatilho de
revisita da AGT-3 "primeiro parecer jurídico" foi DISPARADO** pela emissão
— a revisita está registrada como ABERTA na ata.

**Atualização 2026-08-16 (recepção do complemento — transcrição, ciclo 5):**
os critérios (iii) e (iv) foram **supridos** pelo complemento escrito acima.
Permanecem pendentes, e a disposição fail-closed segue de pé por eles:
critério (i) **PARCIAL** — original assinado (parecer + complemento) a
arquivar; marcador `[CONFIRMAR/AJUSTAR]` do art. 11, §5º não ratificado
expressamente; Q-23 (uma ou duas etapas) e Q-24 (suficiência dos anexos)
ainda com placeholders. Portanto: DEC-G0-03 permanece **integral**; a
**condição 4 da AGT-3 permanece NÃO satisfeita** até o titular dispor da
suficiência formal (e a condição 3 — G3 por via — segue insatisfeita de
todo modo); a revisita da AGT-3 aberta pelo gatilho "primeiro parecer"
permanece **ABERTA**, a conduzir pelo titular. Nenhum bloqueador fechado
por esta atualização.

## Complementação sugerida (texto pronto para o titular encaminhar)

> Dr. Lucas, obrigado pelo parecer. Para fechar os critérios formais da
> consulta (OS-16, itens iii-iv), pedimos complementação por escrito —
> pode ser em mensagem única: (1) confirmar se adota, como seção "o que
> este parecer não cobre", as exclusões da minuta §7, itens 1-26 (ou
> indicar sua própria lista); (2) registrar as condições de revisão do
> parecer (o item VIII do modelo — mudança legislativa/ANPD; mudança
> material da arquitetura examinada; início de tratamento de dado real;
> decurso de 12 meses; incidente — ou as suas); (3) confirmar que a
> vedação do art. 11, §5º (item II) está ratificada sem ajustes (o
> marcador "[CONFIRMAR/AJUSTAR]" permaneceu no título); (4) definir a
> Q-23 (etapa única ou duas etapas) e a Q-24 (suficiência dos anexos ou
> lista do que falta); (5) se possível, encaminhar o original assinado
> (PDF) para arquivo.


---

## Complementação recebida (2026-08-16) — transcrição fiel

### VII. O que este parecer NÃO cobre

Adoto expressamente a lista de exclusões da minuta §7, itens 1 a 26 (ANVISA/SaMD; certificação de S-RES; normas CFM e demais conselhos; sigilo profissional; ANS; contratos do art. 39 — cuja **exigência** afirmo, mas cuja **redação** não faço aqui; instrumento entre controladores; contratos
com instituições; transferência internacional; residência de dados; provedores de LLM; crianças e adolescentes; titulares falecidos; dados de trabalhadores; RIPD — exigido, não elaborado; ROPA; encarregado; resposta a incidentes; prazos de retenção; direitos do titular; art. 20 além do
respondido em Q-15; responsabilidade civil e sanções; regime CEP/CONEP além do enquadramento de rota do item V; concorrência; discriminação em outros regimes).

### VIII. Condições de revisão (Q-25)

Este parecer deve ser **revisitado** se ocorrer qualquer um: (1) alteração legislativa ou regulamentação/decisão da ANPD sobre grupos econômicos em saúde, art. 11 ou art. 20; (2) mudança material da arquitetura examinada (novo commit de referência que altere o índice, o PSR ou os fluxos); (3) início efetivo de tratamento de dado real (gatilho de reavaliação prática); (4) decurso de 24 meses da assinatura; (5) qualquer incidente de segurança envolvendo os dados examinados.

---

## Análise de conformidade ATUALIZADA (escriba, 2026-08-16 — não integra o parecer)

| Critério OS-16 | Estado | Evidência |
|---|---|---|
| (i) Emissor qualificado, escopo, data | **SATISFEITO nos elementos de emissão** | Qualificação, escopo, data/local e assinatura presentes. Pendências de forma remanescentes: arquivar o **original assinado (PDF/físico)**; "anexado ao ADR-043" = ato do lado AMH (zero escrita da V2) |
| (ii) Posição explícita nos 4 pontos | **SATISFEITO** | Itens II-VI + extensão V |
| (iii) Declara o que não cobre | **SATISFEITO** | Seção VII recebida em 2026-08-16: adoção expressa das exclusões da minuta §7, itens 1-26 |
| (iv) Registra condições de mudança | **SATISFEITO** | Seção VIII recebida em 2026-08-16: 5 condições, com prazo de **24 meses** (termo do parecerista — prevalece sobre os 12 do modelo) |

**Residuais não endereçados na complementação (registrados, não bloqueantes):**
o marcador "[CONFIRMAR/AJUSTAR]" no título da vedação do §5º — o conteúdo foi
mantido integralmente no texto emitido e não foi alterado na complementação;
leitura registrada: **ratificado por conduta**. Q-23 (duas etapas) restou
**superada** — o parecer veio completo em ato único. Q-24 restou **superada**
— o parecerista emitiu sem requisitar documentos adicionais.

**Efeitos registrados (fail-closed por operação):**

1. **Critérios de conteúdo da OS-16 satisfeitos.** O gatilho de parecer de
   DEC-G0-03 está **atendido**; o que o parecer libera, ele libera **sob as
   próprias condicionantes por operação**: índice cross-PJ — instrumento
   entre controladores + RIPD prévio + tombamento carimbado + segregação,
   antes do primeiro apply; laço clínico — caráter consultivo documentado e
   verificável; baseline retrospectivo — corte histórico documentado +
   acesso mínimo + sem transferência a terceiros. Nenhuma operação de dado
   real inicia sem sua condicionante satisfeita.
2. **BLK-0013**: a via **retrospectiva** está juridicamente coberta (item
   V.1); a via de **campo** permanece bloqueada até aprovação CEP/CONEP +
   TCLE (item V.2).
3. **AGT-3, condição 4**: satisfeita **no plano jurídico**; a **2ª revisita
   da AGT-3** (gatilho "primeiro parecer") **segue ABERTA**, a conduzir pelo
   titular; a exercibilidade prática continua barrada pela condição 3 (G3
   aprovado por via — hoje 0 vias).
4. **SPR-G1-10 (baseline retrospectivo) exequível**: primeiro ato é **fixar
   e registrar o corte histórico ANTES de qualquer exposição visível a
   clínicos** (SR-2); acesso ao dado histórico segue a trilha AMH.
5. Trabalho novo criado pelas condicionantes (a mapear no backlog):
   instrumento do art. 39/controladores; RIPD do índice; evidência do
   caráter consultivo (UX/traçabilidade); segregação do `ie_perm_sms_email`
   no lago; emenda ao ADR-043 (AMH) nomeando artigo e finalidade (Q-06).
