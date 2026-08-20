---
doc_id: 10-ux-criterios-aceite-2-2-1-timing-adjustable
title: >
  Critérios de aceite pré-estagiados — WCAG 2.2.1 (Timing Adjustable), para
  quando existir sessão real
status: PROPOSAL
label: PROPOSAL
owner: UNASSIGNED — VALIDATION REQUIRED
collector: especialista de consistência documental e rastreabilidade (reconciliação ADR-0015)
source: >
  docs/06-architecture/adrs/ADR-0015-autenticacao-sessao-identidade-m2m.md
  §4.1 (linha ~204: tempo de sessão/timeout de inatividade = VALIDAÇÃO
  NECESSÁRIA), §6 (linha ~230: timeout agressivo em beira-leito = barreira de
  acessibilidade, dono candidato AUTH-UX), §7 (gatilho T2: IdP contratado);
  WCAG 2.2, W3C Recommendation 5 October 2023, critério 2.2.1 Timing
  Adjustable (Level A) — https://www.w3.org/TR/WCAG22/#timing-adjustable;
  apps/web/src/a11y/matrizAcessibilidade.ts §"O QUE MUDOU EM LAC-L4";
  apps/web/src/a11y/acessibilidade.test.tsx (casos que exigem 2.2.1 ausente
  da matriz); apps/web/src/domain/estados.ts (EstadoSessao já modela
  expirando/expirada/recuperada/trabalho_nao_salvo_protegido);
  docs/10-ux-and-accessibility/analise-de-lacunas-frontend.md LAC-L4/LAC-L5;
  docs/00-governance/registers/decision-register.md GDEC-0015, GDEC-0016
date_collected: 2026-08-19
last_updated: 2026-08-19
provenance:
  source_repo: intensicare-V2
  path_or_url: docs/10-ux-and-accessibility/criterios-de-aceite-wcag-2-2-1-timing-adjustable.md
  commit_sha_or_version: 1eda4f1 (HEAD de main na redação)
  section_or_lines: documento inteiro
  date_collected: "2026-08-19"
  collector: especialista de consistência documental e rastreabilidade
  transformation: >
    critérios de aceite derivados do texto normativo público do W3C (WCAG
    2.2.1) e aplicados à lacuna já registrada em ADR-0015/analise-de-lacunas-frontend.md;
    nenhum número de produto foi inventado — os únicos números citados são os
    do próprio padrão externo, e mesmo esses não são reproduzidos aqui (ver §3)
  confidence: medium
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
---

# Critérios de aceite — WCAG 2.2.1 (Timing Adjustable), pré-estagiados para quando houver sessão real

## 0. Por que este documento existe, e o que ele NÃO é

`ADR-0015` tem a **direção aceita** (`GDEC-0016`, 2026-08-16) e a minuta
materializada (`GDEC-0015`), mas nenhum IdP real foi contratado e a fatia G7
usa um emissor sintético (`dev-issuer`) que **não expira por tempo**
(`ADR-0015` §4.1). Por isso 2.2.1 continua, corretamente, **fora** de
`MATRIZ_ACESSIBILIDADE` (`apps/web/src/a11y/matrizAcessibilidade.ts`) — não
há componente de temporização real para testar, e há teste dedicado que
proíbe declará-lo `executado` nessas condições
(`apps/web/src/a11y/acessibilidade.test.tsx`).

Este documento **não muda esse fato** e **não fecha nenhuma lacuna**. Ele
existe para que, quando um IdP real for contratado (gatilho T2 de `ADR-0015`
§7) e uma sessão com expiração por tempo passar a existir, quem a implementar
já tenha em mãos os critérios que 2.2.1 vai exigir — em vez de descobri-los
depois de já ter construído um mecanismo de expiração sem eles.

**Rótulo: `PROPOSAL`.** Nenhuma cláusula aqui é `DECIDED`. Nenhum número de
tempo de produto (duração de sessão, antecedência do aviso, número de
extensões) é fixado — todos permanecem `VALIDAÇÃO NECESSÁRIA`, como já
registrado em `ADR-0015` §4.1 ("nenhum número clínico é inventado aqui").
Este documento não nomeia owner além do candidato já registrado em `ADR-0015`
§6 (`AUTH-UX`, papel, não pessoa) e não resolve nenhuma contradição por conta
própria.

## 1. O que WCAG 2.2.1 exige, em termos qualitativos (SOURCE: W3C)

WCAG 2.2.1 (nível A) exige que, para todo limite de tempo definido pelo
conteúdo, pelo menos uma destas seja verdadeira: o usuário pode **desligar**
o limite antes de encontrá-lo; pode **ajustá-lo** dentro de uma faixa ampla
antes de encontrá-lo; é **avisado antes de expirar** e recebe uma ação simples
para **estendê-lo**, repetidamente; o limite é parte necessária de um evento
em tempo real sem alternativa possível; o limite é essencial e estendê-lo
invalidaria a atividade; ou o limite excede 20 horas.

Para uma sessão de autenticação clínica, **desligar o limite** conflitaria
com controles de segurança (SEC-0004/SEC-0005 do catálogo de controles) e a
exceção de "limite essencial" não se sustenta para timeout de sessão segundo
a própria orientação do W3C sobre este critério — a rota normalmente aplicável
a este tipo de sistema é **avisar + permitir estender**. Esta leitura é
**INFERENCE** (a partir do texto público do W3C, não uma decisão desta V2) e
fica sujeita a quem desenhar o mecanismo real confirmá-la ou substituí-la por
outra rota do próprio critério.

Os pisos numéricos que o próprio critério 2.2.1 define para a rota "estender"
**não são reproduzidos neste documento** — consulte a fonte primária citada
no front matter. Esses números são do padrão externo (W3C), não são
parâmetro de produto do IntensiCare, e não substituem nem antecipam a
duração de sessão ou a antecedência de aviso que `AUTH-UX`/`AUTH-SECURITY`
ainda precisam decidir (`ADR-0015` §4.1, `VALIDAÇÃO NECESSÁRIA`).

## 2. Critérios de aceite (Given/When/Then, todos `PROPOSAL`)

Nenhum critério abaixo fixa um número de tempo. Cada um é testável por
comportamento, independente do número que `AUTH-UX`/`AUTH-SECURITY` decidirem.

**AC-1 — Aviso perceptível antes da expiração.**
Dado que uma sessão real está ativa e se aproxima do seu limite de tempo,
quando o limite se aproxima, então o sistema anuncia isso de forma perceptível
por **mais de um sentido** (não só cor, não só um elemento visual isolado) —
incluindo anúncio compatível com tecnologia assistiva (ex.: região `aria-live`
apropriada ou diálogo que recebe foco), com antecedência suficiente para o
usuário reagir antes de perder o trabalho em curso. O valor exato da
antecedência é `VALIDAÇÃO NECESSÁRIA`, não fixado aqui.

**AC-2 — Extensão por ação simples, acessível.**
Dado que o aviso do AC-1 está visível, quando o usuário aciona a extensão,
então a ação é executável por teclado e por tecnologia assistiva, sem exigir
reentrada de credenciais **dentro** da janela de aviso, e sem exigir precisão
motora incompatível com uso à beira-leito (alvo de toque/clique de tamanho
adequado, sem gesto complexo).

**AC-3 — Extensão repetível.**
Dado que o usuário já estendeu a sessão uma vez, quando o novo limite também
se aproxima, então o mesmo mecanismo de aviso e extensão volta a ficar
disponível — a extensão não é um evento de uso único por sessão.

**AC-4 — Nenhum trabalho em curso é perdido em silêncio.**
Dado que a sessão expira **sem** intervenção do usuário, quando isso
acontece, então nenhuma entrada em andamento (formulário, anotação, seleção)
é descartada sem declaração explícita do estado — reaproveitando o modelo já
existente em `apps/web/src/domain/estados.ts`
(`EstadoSessao`: `expirando`/`expirada`/`recuperada`/`trabalho_nao_salvo_protegido`)
em vez de introduzir um estado paralelo. "Recuperar e continuar" precisa ser
uma opção real após reautenticação, não apenas "recomeçar do zero".

**AC-5 — Nenhum dado clínico incorreto durante a transição.**
Dado que a sessão está expirando, expirada, ou acabou de ser estendida, quando
a UI renderiza qualquer estado de sessão, então ela não deve exibir dado
clínico como se fosse atual quando a identidade verificada não está mais
confirmada (anti-padrão 14 do contrato comum: "exibir dado stale como atual
após erro ou reconexão" aplica-se igualmente a expiração de sessão).

**AC-6 — Configurável, não hardcoded; fail-closed no limite.**
Dado que `ADR-0015` §4.1 já registra que o tempo de sessão e o timeout de
inatividade são "configuráveis por perfil", quando a expiração efetivamente
ocorrer sem extensão, então o comportamento é fail-closed (nega acesso, não
degrada para um estado parcialmente autenticado) — consistente com o restante
do modelo de `ADR-0015` (D1, "fail-closed sem caminho alternativo") e sem
exceção para o caso de timeout.

**AC-7 — Cobertura na matriz declarada, não silenciosa.**
Dado que um provedor de sessão real com expiração por tempo passa a existir,
quando a implementação estiver completa e testada (AC-1 a AC-6, mais
verificação com usuário real de tecnologia assistiva — `SPR-G4-5`), então
`MATRIZ_ACESSIBILIDADE` passa a incluir 2.2.1 com `execucao: "executado"` **e**
`cobertura` citando os testes concretos que o provam — nunca por decisão de
prosa isolada. Até lá, 2.2.1 permanece fora da matriz, e isso continua sendo o
comportamento correto, não uma lacuna a esconder.

## 3. O que fica explicitamente fora deste documento

- A duração real da sessão e o tempo de inatividade até expirar —
  `VALIDAÇÃO NECESSÁRIA`, `ADR-0015` §4.1, dono candidato `AUTH-UX` +
  `AUTH-SECURITY`; nenhum número é proposto aqui, nem mesmo como sugestão.
- A antecedência do aviso de expiração e o número de extensões permitidas —
  mesmos donos candidatos, mesma pendência.
- A escolha entre "avisar + estender" e as demais rotas do critério 2.2.1
  (desligar, ajustar, exceção de tempo real, exceção de limite essencial,
  exceção de 20 horas) — a leitura da §1 é INFERENCE, não vinculante para
  quem desenhar o mecanismo real.
- Qualquer decisão sobre qual IdP contratar, ou quando — fora da autoridade
  desta V2 enquanto agente (contrato comum §3).
- Fechar 2.2.1 na matriz — depende de comportamento real implementado e
  testado (AC-7), não deste documento.

## 4. Rastreio

`ADR-0015` (direção aceita `GDEC-0016`; premissas `GDEC-0015`/`GDEC-0017`);
`GDEC-0015`, `GDEC-0016`; `SEC-0004`, `SEC-0005`;
`apps/web/src/a11y/matrizAcessibilidade.ts`;
`apps/web/src/a11y/acessibilidade.test.tsx`; `apps/web/src/domain/estados.ts`;
`docs/10-ux-and-accessibility/analise-de-lacunas-frontend.md` (LAC-L4, LAC-L5);
`SPR-G4-5`.
