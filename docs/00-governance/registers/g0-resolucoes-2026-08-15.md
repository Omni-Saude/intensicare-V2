---
doc_id: G0-RESOLUCOES-2026-08-15
status: OBSERVED
owner: rodaquino-OMNI — CEO e acionista principal (OMNI e AMH), médico intensivista
source: Aprovação em sessão pelo detentor da autoridade, 2026-08-15; docs/00-governance/registers/blockers-register.md; docs/14-devsecops-and-delivery/branch-protection-request.md
date_collected: 2026-08-15
collector: orquestrador de entrega (escriba); decisões do humano nomeado
last_updated: 2026-08-15
---

# Resoluções do Gate G0 — decisões de 2026-08-15

Registro das decisões tomadas **por humano nomeado** — rodaquino-OMNI, CEO e
acionista principal da OMNI e da AMH, médico intensivista — que resolvem ou
reclassificam nove bloqueadores do Gate G0. O orquestrador atua apenas como
escriba; nenhuma decisão abaixo foi tomada por agente. IDs locais
(`DEC-G0-nn`); a alocação de IDs `GDEC-nnnn` ocorrerá na integração dos
registros (evita colisão com o orquestrador clínico concorrente, que edita os
registros neste momento para BLK-0002/BLK-0008).

**Fundamento do modelo adotado:** proprietário único interino com
independência preservada nos portões de verificação — uma pessoa pode deter
múltiplos papéis de *decisão*; os pares de independência do prompt (§4)
restringem implementador × verificador, e são preservados nas condições
registradas abaixo. Risco de concentração de autoridade a registrar no
risk-register na integração.

## DEC-G0-01 — BLK-0001 (AUTH-PRODUCT) — ACEITA
rodaquino-OMNI assume AUTH-PRODUCT em caráter interino. Gatilho de revisão:
entrada de um líder de produto ou parceiro comercial.

## DEC-G0-02 — BLK-0003 (AUTH-SECURITY) — ACEITA
rodaquino-OMNI assume AUTH-SECURITY **somente para decisões de fase de
projeto**. Restrição vinculante: a aceitação do Gate G6 (resultados de teste
de intrusão, risco residual de segurança) exige verificador terceiro
independente e qualificado — o titular pode aceitar o laudo, não pode ser o
verificador (par: implementador de controle ≠ verificador de intrusão).

## DEC-G0-03 — BLK-0004 (AUTH-PRIVACY-LEGAL) — RECLASSIFICADA (G0 → G6/G8)
Nenhum titular jurídico é nomeado agora. O desenvolvimento prossegue
**exclusivamente com dados sintéticos** (nenhum dado real, nenhum tratamento
de dados pessoais → sem determinação de base legal pendente nesta fase).
Agentes redigem material jurídico/privacidade apenas como **sugestão**;
advogados da organização revisarão e aceitarão futuramente. Gatilho
obrigatório: parecer jurídico brasileiro antes de qualquer teste de
conformidade com dados reais, operação sombra ou piloto (G6/G8).

## DEC-G0-04 — BLK-0005 (AUTH-DATA-PLATFORM + autoridade AMH) — ACEITA
rodaquino-OMNI assume AUTH-DATA-PLATFORM (lado V2) **e** declara deter a
autoridade do lado AMH, na qualidade de CEO e acionista principal de ambas as
empresas. Consequência imediata: as questões de adjudicação AQ-1..AQ-6
(`docs/08-interoperability/amh-data/identity-adjudication/`) e as
contradições C-1..C-4 tornam-se respondíveis em sessão dedicada, deixando de
depender de terceiros.

## DEC-G0-05 — BLK-0006 (AUTH-UX) — ACEITA
rodaquino-OMNI assume AUTH-UX em caráter interino. Restrição registrada: o
conhecimento clínico próprio do titular vale como **insumo de hipótese de
especialista**, nunca como evidência de observação do Gate G1 — o G1 continua
exigindo participantes clínicos externos (dono da aceitação ≠ moderador da
pesquisa ≠ participante único).

## DEC-G0-06 — BLK-0007 (AUTH-OPERATIONS) — ACEITA
rodaquino-OMNI assume AUTH-OPERATIONS em caráter interino. Gatilho de revisão
já registrado: na prontidão de piloto (G8), o par "dono do pipeline de
release ≠ autoridade de go-live" exigirá um segundo humano.

## DEC-G0-07 — BLK-0009 (acesso GitHub) — RESOLVIDA POR RATIFICAÇÃO
Mecanismo de acesso ratificado: OAuth `gh` no usuário `rodaquino-OMNI`
(proprietário dos repositórios OMNI). OBSERVADO em 2026-08-15: acesso a
`Omni-Saude/amh-data-platform` verificado funcional **sem novo login**
(conforme instrução: verificar antes de pedir). A variável de runtime do
prompt ("GitHub App installation") fica **emendada** para refletir o
mecanismo real. Item de melhoria (não bloqueador): credencial de escopo fino
somente-leitura restrita ao amh-data-platform, para substituir o token amplo.
Controle compensatório vigente: política de zero escrita da V2 em
repositórios AMH.

## DEC-G0-08 — BLK-0010 (licença/propriedade AMH) — RESOLVIDA POR CONCESSÃO
Concessão por escrito do titular: na qualidade de CEO e acionista principal
da OMNI e da AMH, rodaquino-OMNI **autoriza a IntensiCare V2 a ler o
repositório `amh-data-platform` em commits pinados e a derivar contratos de
integração a partir dele**. Reuso de código ou artefato AMH continua exigindo
aprovação por artefato, conforme `docs/00-governance/legacy-import-policy.md`.
Espelhamento opcional futuro: arquivo de licença interna no repositório AMH.

## DEC-G0-09 — BLK-0011 (proteção de branch) — EXECUTADA
Proteção aplicada em 2026-08-15 a `main` de `Omni-Saude/intensicare-V2`
(OBSERVADO, resposta da API):
checks obrigatórios `doc-conventions` + `forbidden-content` (strict),
`enforce_admins` ativo, histórico linear, force-push proibido, deleção
proibida, PR obrigatório com **0 aprovações** — parâmetro que o documento de
solicitação deixou em aberto, decidido pelo titular: o GitHub proíbe
autoaprovação e há, no momento, um único revisor humano; será elevado quando
houver segundo revisor.

## DEC-G0-10 — Política de idioma — DECIDIDA
Todo material produzido a partir de 2026-08-15 será redigido em
**português (pt-BR)**, ainda que as interações com agentes ocorram em inglês.
O corpus do ciclo 0 (em inglês) permanece válido como evidência; a tradução
retroativa é decisão em aberto do titular (custo × benefício a avaliar).

## Notas de integração (para o steward de governança)
1. Atualizar status dos bloqueadores BLK-0001, 0003, 0005, 0006, 0007, 0009,
   0010, 0011 e a reclassificação do BLK-0004 **após** o commit do
   orquestrador clínico (edições concorrentes não confirmadas nos registros —
   não sobrescrever).
2. Alocar IDs GDEC-nnnn a estas dez decisões, verificando colisão com IDs
   emitidos pelo orquestrador clínico (BLK-0002/0008).
3. Registrar no risk-register o risco de concentração de autoridade
   (um humano detém sete papéis AUTH-*) com os gatilhos de revisão acima.
4. Atualizar authority-model.md com o titular nomeado e as restrições.
5. Refletir DEC-G0-10 (idioma) como política em evidence-notation.md ou
   documento próprio; avaliar ADR se alterar §16.
