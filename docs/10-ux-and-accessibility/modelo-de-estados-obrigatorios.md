---
doc_id: 10-ux-modelo-de-estados-obrigatorios
title: >
  Modelo completo de estados obrigatórios de UI (§11) — por dado, por avaliação,
  por alerta, por sessão/autorização, por componente e por conectividade, com
  tabela estado × sinal visual não-só-cor × texto pt-BR × comportamento
status: PROPOSAL
label: PROPOSAL
owner: UNASSIGNED — VALIDATION REQUIRED
collector: especialista de UX e acessibilidade (ciclo 6, SPR-G4-3)
source: >
  INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §11 (estados mínimos, linhas ~920-930);
  ADR-0008 (5 estados de avaliação, precedência P-a, N1-N9); ADR-0009 (W1-W12);
  ADR-0021 (F1-F8); ADR-0029 §4 (P1-P9); apps/web/src/domain/estados.ts e
  apps/web/src/domain/linguagem.ts (implementação de referência — somente leitura)
date_collected: 2026-08-16
last_updated: 2026-08-16
provenance:
  source_repo: intensicare-V2
  path_or_url: docs/10-ux-and-accessibility/modelo-de-estados-obrigatorios.md
  commit_sha_or_version: 32d44e7acaad67d0f49c0e418479123c06e84c31 (HEAD de cycle-6/construcao-g7 na redação)
  section_or_lines: documento inteiro
  date_collected: 2026-08-16
  collector: especialista de UX e acessibilidade (ciclo 6, SPR-G4-3)
  transformation: >
    compilado — identificadores lidos de apps/web/src/domain/estados.ts; textos
    pt-BR lidos de apps/web/src/domain/linguagem.ts (provisórios, pendentes do
    processo ADR-0029); comportamento derivado das cláusulas aceitas de
    ADR-0008/0009/0021 com citação por linha
  confidence: medium
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
---

# Modelo de estados obrigatórios da UI — IntensiCare V2

> **PREMISSA (reversível, GDEC-0015/0017):** este documento fixa, como premissa
> de construção, o modelo completo de estados obrigatórios do prompt §11 para
> toda superfície da V2. Os **identificadores** de estado são originados no
> backend (ADR-0021 F1); os **textos pt-BR** abaixo são os da implementação de
> referência (`apps/web/src/domain/linguagem.ts`) e permanecem **provisórios**
> até o processo de validação terminológica da ADR-0029 (condição C2 ABERTA).
> A compreensão real dos termos por clínicos é VALIDATION REQUIRED
> (VAL-0027/VAL-0031; SPR-G4-5).

## 0. Regras transversais (valem para todas as tabelas)

1. **SOURCE (ADR-0021 F1):** identificador é do backend; texto é do frontend;
   telemetria, auditoria e testes referenciam **somente** o identificador.
2. **SOURCE (ADR-0021 F3):** o módulo de linguagem nunca suprime um estado,
   nunca promove/rebaixa severidade, nunca infere estado não originado.
3. **SOURCE (ADR-0021 F4):** componente sem uma família obrigatória de estado é
   **defeito bloqueante de revisão**, não melhoria futura.
4. **Sinal não-só-cor (prompt §11; WCAG 1.4.1):** todo estado carrega texto +
   glifo redundante à cor. A coluna "Sinal" abaixo usa o vocabulário de tons da
   implementação de referência (`Tom` em `estados.ts` + `glifoTom` em
   `linguagem.ts`): `neutro •`, `positivo ✓`, `informativo i`, `atencao !`,
   `alerta ▲`, `critico ▲▲`, `inconclusivo ?`. O tom `inconclusivo` é
   deliberadamente distinto de `neutro`/`positivo` — um estado fail-closed
   nunca reusa o sinal de "sem problema" (ADR-0029 P1).
5. **Anúncio a tecnologia assistiva:** transições de rotina usam
   `role="status"`/`aria-live="polite"`; erro, indisponibilidade, proibição e
   alerta clínico novo usam `role="alert"`/assertivo, com coalescência de
   anúncios (prompt §11) — padrão de referência OBSERVED em `EstadoTela.tsx` e
   `RegiaoAoVivoAlertas.tsx`.
6. **Fail-closed universal (ADR-0008 N9):** condição não coberta resolve para
   `não avaliado` com razão `unspecified_condition` — não existe caminho
   "desconhecido → presumir bem".

## 1. Estados por dado (frescor — 2ª família do §11)

**SOURCE (prompt §11):** "fresh, aging, stale, expired, missing, invalid,
conflicted, corrected, superseded". **OBSERVED:** `EstadoFrescor` em
`estados.ts` cobre os nove. A idade computa-se do **tempo clínico de fonte**,
nunca do tempo de recebimento (ADR-0008 N5/SAF-0004); janelas e horizontes
numéricos são conteúdo de rule release (VAL-0023 — nenhum número aqui).

| Identificador (backend) | Sinal visual não-só-cor | Texto pt-BR (provisório — ADR-0029 C2) | Comportamento da UI |
|---|---|---|---|
| `atual` | tom `positivo`, glifo ✓ | "Dado atual." | Exibe valor com tempo de fonte disponível sob demanda (SAF-0005) |
| `envelhecendo` | tom `atencao`, glifo ! | "Dado envelhecendo — aproximando-se do limite de frescor esperado." | Exibe valor + marcação de idade; nenhuma ocultação |
| `desatualizado` | tom `alerta`, glifo ▲ | "Dado desatualizado (obsoleto) — não reflete necessariamente o estado atual." | Exibe valor com idade e última leitura válida; distinto de `ausente` (ADR-0029 P8); recomputado na leitura, nunca congelado na escrita (ADR-0008 N5) |
| `expirado` | tom `critico`, glifo ▲▲ | "Dado expirado — fora da janela de validade." | O insumo deixa de sustentar avaliação; além do horizonte, a avaliação transita `desatualizada` → `não avaliada` com razão `expired` (ADR-0008 N5) |
| `ausente` | tom `inconclusivo`, glifo ? | "Dado indisponível — nenhuma leitura recebida." | **Nunca** exibido como zero, "normal" ou célula vazia sem rótulo (HAZ-0005); entra em `insumosAusentes` declarados |
| `invalido` | tom `inconclusivo`, glifo ? | "Dado inválido — não utilizável para cálculo." | Valor bruto não é usado; razão codificada visível; jamais coagido ao polo tranquilizador (SF-3) |
| `conflitante` | tom `atencao`, glifo ! | "Dado conflitante — mais de uma origem diverge." | As origens divergentes são exibíveis lado a lado; a UI **nunca** resolve o conflito silenciosamente (dossiê §3.5; "mais-recente-vence" proibido como resolução silenciosa); no cálculo, conflito é razão de `invalida` (`conflicting_inputs`, ADR-0008 A8-3) |
| `corrigido` | tom `informativo`, glifo i | "Dado corrigido — um valor anterior foi substituído por correção registrada." | Histórico da correção acessível; correção dispara nova avaliação, nunca reescreve a anterior (ADR-0008 N6) |
| `substituido` | tom `informativo`, glifo i | "Dado substituído por uma leitura mais recente." | Leitura anterior permanece no histórico |

## 2. Estados por avaliação (5 estados — ADR-0008, aceita GDEC-0007)

**SOURCE (ADR-0008 §5.0):** vocabulário decidido em pt-BR: *válido / parcial /
não avaliado / desatualizado / inválido* (A8-6); precedência **P-a**:
`invalid > not_evaluated > stale > partial > valid` (N2); total parcial só sob
política ratificada por classe (Opção C-com-default-A; A8-2).

| Identificador (backend) | Sinal visual não-só-cor | Texto pt-BR (provisório) | Comportamento da UI |
|---|---|---|---|
| `valida` | tom `positivo`, glifo ✓ | "Avaliação válida." | Único estado (além de `parcial` sob política) em que escore numérico e banda de risco são exibidos (N7 — "severidade só é legível quando o status permite") |
| `parcial` | tom `atencao`, glifo ! | "Avaliação parcial — calculada com insumos incompletos, declarados abaixo." | Só existe sob política parcial explícita, versionada e ratificada (ADR-0026); lista de ausentes obrigatória e visível; jamais redigida como "quase completo" (ADR-0029 P7) |
| `nao_avaliada` | tom `inconclusivo`, glifo ? | "Avaliação não computável — dados insuficientes para calcular com segurança (modo fail-closed)." | **Nenhum escore, nenhuma banda, nenhuma cor de severidade**; razões codificadas exibidas (`missing_required_input:<insumo>` etc., N3); metadado de última avaliação válida preservado quando `stale` foi dominado pela precedência (N2); visivelmente distinto de baixo risco em toda superfície (N7; VAL-0027); persistência prolongada é sinal operacional, exibida como *vigilância ausente*, nunca via quieta (SAF-0040/HAZ-0043) |
| `desatualizada` | tom `atencao`, glifo ! | "Avaliação desatualizada — recalcule antes de decidir com base nela." | Exibe idade e instante da avaliação; recomputada na leitura; além do horizonte transita para `nao_avaliada` (razão `expired`) |
| `invalida` | tom `inconclusivo`, glifo ? | "Avaliação inválida — não deve ser usada para decisão clínica." | Domina todos os demais estados (N2); razão codificada visível; proibido rebaixar a `parcial` descartando o insumo ofensor (ADR-0008 §4 Q2) |

**Regras adicionais vinculantes:** (i) agregado nunca mais tranquilizador que o
pior membro obrigatório (N4/SAF-0006); (ii) fragmento computável de escore
composto exibido como componentes por órgão, **jamais somado** sem política
(E4/§7 de `sofa-review.md`); (iii) parâmetro isolado em banda vermelha pode
escalar com o total `nao_avaliada` (A8-5/INV-B do ADR-0026) — a UI exibe as
duas informações sem que uma esconda a outra.

## 3. Estados por alerta / item de trabalho (ADR-0009 W1, aceita GDEC-0008)

**SOURCE (ADR-0009 W1):** oito estados nucleares; entrega (notificação) é
**dimensão paralela por canal, jamais estado do item** (DIV-1); reatribuição é
transição dentro de `atribuido` (DIV-2).

| Identificador (backend) | Sinal visual não-só-cor | Texto pt-BR (provisório) | Comportamento da UI |
|---|---|---|---|
| `nao_atribuido` | tom `neutro`, glifo • | "Não atribuído." | Item visível na fila da unidade; ausência de dono é estado desenhado, não exceção (dossiê §3.1/L-6) |
| `atribuido` | tom `informativo`, glifo i | "Atribuído." | Nome do responsável atual visível; reatribuição registra novo Assignment sem mudar de estado |
| `reconhecido` | tom `positivo`, glifo ✓ | "Ciência registrada (reconhecido)." | Ciência ≠ conclusão (ADR-0029 P5) — o item permanece aberto e visível; ator e instante exibidos |
| `escalado` | tom `alerta`, glifo ▲ | "Escalado." | Escalada automática muda roteamento/urgência e **nunca** comunica "tratado" (W5/W12); alvo da escalada visível |
| `sobreposto` | tom `atencao`, glifo ! | "Sobreposto manualmente — decisão registrada por um profissional." | Racional obrigatório acessível (W8); contável como sinal de qualidade de regra |
| `resolvido` | tom `positivo`, glifo ✓ | "Resolvido — encerrado." | Terminal porém reabrível; histórico completo preservado (W10) |
| `suprimido` | tom `atencao`, glifo ! | "Suprimido — ocultação explícita e auditável, registrada por um profissional." | Permanece visível com contagem própria (W7); razão codificada, escopo e expiração exibíveis; expira para ativo, nunca para silêncio; **jamais** representa no-fire (P6) |
| `reaberto` | tom `alerta`, glifo ▲ | "Reaberto." | Segue para novo Assignment; a resolução anterior permanece no histórico (W10) |

**Comportamentos transversais do item:** conflito de concorrência otimista
(W3) exibe falha explícita com estado corrente e autor da mudança vencedora —
nunca última-escrita-vence silenciosa; reconciliação por avaliação superseded
(W9/N6) aparece como atualização de contexto, jamais remoção silenciosa;
ações em grupo atômicas ou com resultado por item (W11); nenhum comando de
segurança mostra sucesso otimista antes da confirmação do backend (ADR-0021 F5
— máquina de referência OBSERVED em `estado/reconhecerAlertaMaquina.ts`).

## 4. Estados por sessão e autorização (6ª família do §11)

**SOURCE (prompt §11):** "session expiring, expired, recovered, and
unsaved-work protection". **OBSERVED:** `EstadoSessao` declarado em
`estados.ts`; nenhuma tela dedicada na fatia (SPR-G7-2 não inclui
autenticação) — os comportamentos abaixo são especificação vinculante para as
telas que a implementarem (ADR-0015 é a decisão de sessão; authz é sempre
server-side, ADR-0016/ADR-0021).

| Identificador (backend) | Sinal visual não-só-cor | Texto pt-BR (proposto — ADR-0029 C2) | Comportamento da UI |
|---|---|---|---|
| `ativa` | sem sinal permanente | — | Estado de regime; nenhum ruído |
| `expirando` | tom `atencao`, glifo ! | "Sua sessão expira em breve — salve ou conclua a ação em andamento." | Aviso coalescido, não modal durante ação de segurança em andamento; opção de renovar sem perder contexto |
| `expirada` | tom `alerta`, glifo ▲ | "Sessão expirada — reautentique para continuar." | Bloqueia novos comandos; **limpa dado de paciente do estado de cliente** (limpeza de cache ciente de privacidade — prompt §11; QAS-0028); nenhum comando enviado com sessão expirada aparenta sucesso |
| `recuperada` | tom `informativo`, glifo i | "Sessão recuperada." | Reidrata a tela a partir do servidor (projeção autoritativa), nunca de cache local possivelmente velho |
| `trabalho_nao_salvo_protegido` | tom `atencao`, glifo ! | "Há uma ação não concluída — ela não foi perdida." | A intenção do usuário (ex.: reconhecimento em andamento) é preservada e reapresentada para confirmação explícita após reautenticação; nunca reenviada automaticamente (a chave de idempotência permite reenvio seguro **após** confirmação humana — ADR-0009 W2) |
| `proibido` (authz — família 1 do §11) | tom `alerta`, glifo ▲ | "Acesso não autorizado a este recurso." | Falha fechada; nenhum vazamento de existência cross-tenant (404 indistinguível — OBSERVED `openapi.yaml` /v1/pacientes; ADR-0011 E5) |

## 5. Estados por componente (carregamento — 1ª família do §11)

**SOURCE (prompt §11):** "loading, empty, unavailable, forbidden, timeout,
retrying, partially loaded". **OBSERVED:** `EstadoCarregamento` em `estados.ts`
cobre a família (+ `pronto`/`erro`); wrapper de referência `EstadoTela.tsx`.
A tarefa nomeia ainda "degraded" — coberto pela família de conectividade (§6),
que qualifica qualquer componente pronto.

| Identificador (backend) | Sinal visual não-só-cor | Texto pt-BR (provisório) | Comportamento da UI |
|---|---|---|---|
| `carregando` | tom `neutro`, glifo •; `role="status"` polite | "Carregando…" | Nunca exibe esqueleto que pareça dado real; sem timeout silencioso |
| `vazio` | tom `neutro`, glifo • | "Nenhum item encontrado." | O texto de vazio distingue *vazio verdadeiro* de *filtro possivelmente incompleto* (lista nunca-normal, dossiê §3.7 item 9); em contexto de paciente, vazio de histórico usa a redação do requisito de registro limitado à instituição (documento irmão) |
| `indisponivel` | tom `alerta`, glifo ▲; `role="alert"` | "Indisponível no momento — não foi possível obter os dados." | Falha visível no ponto de uso clínico; nunca mantém dado velho sem marcação no lugar do erro (WF-05) |
| `proibido` | tom `alerta`, glifo ▲; `role="alert"` | "Acesso não autorizado a este recurso." | Ver §4; authz server-side |
| `tempo_esgotado` | tom `atencao`, glifo ! | "Tempo de resposta esgotado." | Oferece nova tentativa explícita; nunca repete automaticamente comando de escrita sem confirmação (idempotência W2 permite reenvio seguro) |
| `retentando` | tom `atencao`, glifo ! | "Tentando novamente…" | Contagem de tentativas visível quando repetido |
| `parcial` | tom `atencao`, glifo !; banner persistente | "Carregado parcialmente — alguns itens podem estar ausentes." | Conteúdo renderiza **com** o banner de parcialidade permanente (OBSERVED `EstadoTela.tsx`); nunca redigido como "quase completo" (P7); lista parcial nunca aparenta lista completa |
| `pronto` | sem sinal | "Carregado." (apenas para AT) | Conteúdo pleno |
| `erro` | tom `alerta`, glifo ▲; `role="alert"` | "Não foi possível carregar. Tente novamente." | Detalhe do problema (RFC 9457, sem PHI) exibível; ação de recuperação sempre disponível |

## 6. Estados de conectividade (5ª família do §11)

**SOURCE (prompt §11):** "online, degraded, offline, reconnecting, replaying,
reconciled". **OBSERVED:** `EstadoConectividade` em `estados.ts`.

| Identificador (backend) | Sinal visual não-só-cor | Texto pt-BR (provisório) | Comportamento da UI |
|---|---|---|---|
| `online` | sem sinal permanente | "Conectado." (AT) | Regime |
| `degradado` | tom `atencao`, glifo !; banner persistente em toda tela | "Modo degradado — algumas funcionalidades limitadas; dados podem não estar atualizados." | A degradação aparece **no ponto de uso clínico** (dossiê §3.5/WF-05 — o modo degradado da V2 é testado contra a *combinação* de falhas); orientação de fallback visível (prompt §11 "visible degraded-mode guidance"); tela calma sem dado é proibida |
| `offline` | tom `alerta`, glifo ▲; banner persistente | "Offline — sem conexão com o servidor." | Todos os dados exibidos ganham marcação de idade; comandos bloqueados ou enfileirados com aviso explícito — nunca sucesso aparente |
| `reconectando` | tom `atencao`, glifo ! | "Reconectando…" | — |
| `reproduzindo` | tom `informativo`, glifo i | "Sincronizando eventos perdidos…" | Replay por cursor (ADR-0011 P4); a UI declara que o estado exibido está sendo atualizado |
| `reconciliado` | tom `informativo`, glifo i | "Sincronizado — dados reconciliados após reconexão." | Itens que mudaram durante a janela offline são apresentados como atualização de contexto (paralelo de W9), não trocados silenciosamente |

## 7. Divergências observadas e pendências de integração

| # | OBSERVED | Consequência |
|---|---|---|
| 1 | `packages/contratos/openapi.yaml` publica `StatusAvaliacao` com **3** valores (`valido`/`parcial`/`indisponivel`) — não os 5 estados decididos na ADR-0008 | Pendência de integração da fatia: o contrato deve convergir para os 5 estados + razões codificadas (N3) antes de qualquer tela nova depender dele; a UI **não** inventa o mapeamento (ADR-0021 F1/F3) |
| 2 | `openapi.yaml` publica `BandaRisco` = `normal`/`atencao`/`alerta`/`critico`; a fatia web usa `baixo`/`medio`/`alto`/`critico` | Divergência de vocabulário a reconciliar via processo ADR-0029; o termo `normal` como nome de banda exige cuidado com P1 (nunca colidir com a leitura de "não avaliado") |
| 3 | `openapi.yaml` publica `Frescor` com 3 valores; o modelo do §11 exige 9 | Pendência de integração; até lá a UI da fatia deriva frescor da modelagem local declarada como provisória (`estados.ts`, nota "INTEGRAÇÃO PENDENTE") |
| 4 | Contrato usa `nao-atribuido` (hífen); a fatia web usa `nao_atribuido` (sublinhado) | Normalização de identificador na geração de tipos — nunca tradução manual por tela |

Nenhuma dessas linhas fecha pendência; elas existem para que a divergência
seja visível e resolvida no contrato (ADR-0012), não silenciosamente na UI.

## 8. Validação

- Checklist automatizada de cobertura de famílias por componente (ADR-0021 V3);
  testes de UI por estado (SPR-G7-2, camada "UI por estado" do §14).
- WCAG 2.2 AA automatizado + validação manual representativa (leitor de tela,
  teclado, zoom/reflow, movimento reduzido, alvo de toque) — ADR-0021 F7.
- Compreensão dos textos pt-BR por clínicos e usuários de TA: VALIDATION
  REQUIRED (VAL-0027/0031/0033; SPR-G4-5) — os textos deste documento são
  provisórios até lá.
