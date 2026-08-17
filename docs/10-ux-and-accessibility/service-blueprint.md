---
doc_id: 10-ux-service-blueprint
title: >
  Service blueprint — reconhecimento de deterioração clínica HOJE (fluxo atual,
  com dores documentadas) e DESEJADO (com IntensiCare V2 como copiloto
  consultivo), com frontstage/backstage/sistemas e pontos de falha/degradação
status: PROPOSAL
label: PROPOSAL
owner: UNASSIGNED — VALIDATION REQUIRED
collector: especialista de UX e acessibilidade (ciclo 6, SPR-G4-3)
source: >
  docs/02-users-and-workflows/dossie-substituto-multi-fonte-g1.md v0.1.1
  (L-1/L-4/L-5/L-6; SF-1..SF-7; WF-04/WF-05/WF-06; §3.1-§3.7; RISK-0013);
  INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §1 (laço mínimo) e §11;
  ADR-0008/0009/0021; docs/01-vision-and-intended-use/intended-use-statement.md IU-09/IU-10
date_collected: 2026-08-16
last_updated: 2026-08-16
provenance:
  source_repo: intensicare-V2
  path_or_url: docs/10-ux-and-accessibility/service-blueprint.md
  commit_sha_or_version: 32d44e7acaad67d0f49c0e418479123c06e84c31 (HEAD de cycle-6/construcao-g7 na redação)
  section_or_lines: documento inteiro
  date_collected: 2026-08-16
  collector: especialista de UX e acessibilidade (ciclo 6, SPR-G4-3)
  transformation: >
    reasoned-from — o fluxo ATUAL é reconstruído exclusivamente da evidência
    substituta do dossiê G1 (literatura + forense do legado + hipóteses do
    titular rotuladas); nenhuma observação de campo ocorreu. O fluxo DESEJADO
    deriva das cláusulas aceitas de ADR-0008/0009 e da fronteira consultiva
    IU-09/IU-10.
  confidence: medium
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
---

# Service blueprint — reconhecimento de deterioração clínica

> **Limite de evidência, dito primeiro (SOURCE, dossiê §1.3 e RISK-0013):**
> nenhum usuário da V2 foi observado. O "fluxo atual" abaixo descreve a
> **classe de ambientes** documentada na literatura verificada do dossiê e na
> forense do legado — **não a unidade-alvo**, que ainda não existe nomeada.
> Este blueprint é a materialização do "usuário imaginado" que RISK-0013
> aceita às claras; seu contraste com a realidade é ato do piloto (G8) e da
> validação SPR-G4-5. Hipóteses do titular aparecem rotuladas
> **HIPÓTESE-DE-ESPECIALISTA**; nada aqui alega efetividade clínica.
>
> **Estado factual preservado:** 0 vias acionáveis; 47/47 inelegíveis;
> Observation da AMH não consumível; relação com a AMH = candidato a
> integração; safety case M0; nenhum dado real acessado — todo fluxo "desejado"
> descrito abaixo opera, nesta fase, exclusivamente sobre dados sintéticos
> `SYNTH-`.

## 1. Fluxo ATUAL — como a deterioração é reconhecida hoje (sem IntensiCare)

Formato: etapa × frontstage (o que o clínico faz/vê) × backstage (trabalho
invisível) × sistemas/artefatos × dores documentadas com fonte.

| Etapa | Frontstage | Backstage | Sistemas/artefatos | Dores documentadas (rótulo + fonte) |
|---|---|---|---|---|
| 1. Monitorização contínua | Enfermagem e médicos convivem com alarmes de monitor multiparamétrico; a atenção é rateada entre leitos | Priorização mental contínua de quais alarmes merecem ida ao leito | Monitores de cabeceira; centrais de alarme | SOURCE (L-1): ~187 alarmes audíveis/leito/dia; 88,8% dos alarmes de arritmia anotados falso-positivos; caso documentado de alarmes ignorados antes de parada — alarme vira "ruído de fundo" |
| 2. Registro de sinais vitais | Aferição e registro manual/semiautomático em prontuário ou papel | Transcrição, arredondamento, atraso entre aferição e registro | Prontuário eletrônico; anotação em papel | SOURCE (L-6): frequência respiratória mal registrada (14–17% em vários settings); OBSERVED (dossiê §2.3): a frequência real de conflitos de registro na unidade-alvo é desconhecida — dado não acessado |
| 3. Cálculo de escore de alerta precoce | Cálculo manual (ou mental) de EWS/NEWS quando o protocolo pede | Conta de pontos por parâmetro, consulta à tabela | Tabela impressa/protocolo institucional | SOURCE (L-6): 18,9% de cálculo incorreto do NEWS num estudo; em outros dois, apenas 1% e 11% dos escores calculados corretamente |
| 4. Reconhecimento da deterioração | Alguém "liga os pontos" entre sinais, tendência e contexto | Julgamento pessoal; barreiras culturais e de hierarquia condicionam a leitura | — | SOURCE (L-6): *afferent limb failure* — critérios documentados sem acionamento antes do evento adverso; HIPÓTESE-DE-ESPECIALISTA (UR-01..03 via dossiê §3.1, confiança baixa): quem monitora/age varia por turno |
| 5. Escalada | Chamar médico/time de resposta rápida; nem sempre claro quem chama e quando | Negociação implícita de responsabilidade | Telefone, mensageria informal, busca presencial | SOURCE (L-6): acionamento tardio em 21–57% dos pacientes com critérios documentados; atraso associado a mais admissão não planejada em UTI (OR 1,56–1,79) e mais mortalidade (OR 1,79–2,18); INFERENCE (dossiê §3.1): não se pode assumir que "alguém" escala — a ausência de dono é o estado a desenhar |
| 6. Resposta e conduta | Avaliação à beira do leito; intervenção; interrupções constantes da equipe | Reorganização do plano de trabalho a cada interrupção | — | SOURCE (L-4, com ressalva de setting declarada — enfermarias, não UTI): cada interrupção associada a +12,1% de falhas procedurais e +12,7% de erros clínicos |
| 7. Passagem de plantão | Transferência verbal de pendências, nem sempre padronizada; itens não resolvidos podem se perder | Reconstrução mental do estado da unidade pelo plantão que chega | Anotações pessoais; quadros; memória | SOURCE (L-5): quebra de comunicação é causa líder de erro em pacientes críticos; erros de cuidado em UTI ~1,7×/paciente/dia; recomendação vigente: handoff verbal, padronizado, em horário dedicado; SOURCE (WF-04): o legado **não tinha** jornada de passagem de plantão; OBSERVED (dossiê §3.5): o que a passagem real do sítio faz com itens não resolvidos é desconhecido (→ RISK-0013) |
| 8. Workarounds | Papel, quadro branco, mensageria pessoal preenchem as lacunas do sistema oficial | — | Artefatos informais | OBSERVED (dossiê VAL-0025): workarounds só são observáveis em campo — perda assumida às claras até variante/piloto |

**Síntese das dores (INFERENCE sobre L-1/L-4/L-5/L-6 + forense):** o trabalho
de reconhecer deterioração hoje é interrompido, sobrecarregado de sinais
majoritariamente falsos, dependente de cálculo manual sujeito a erro, sem dono
explícito de escalada e com perda de estado na troca de plantão. O sistema
legado, além de não mitigar, adicionava falsa tranquilização própria
(floor-to-normal, supressão silenciosa, coerção de inválido a zero — SF-3/SF-7,
HAZ-0005).

## 2. Fluxo DESEJADO — com IntensiCare V2 como copiloto CONSULTIVO

**Fronteira consultiva (SOURCE, IU-09/IU-10 via dossiê §3.4):** a V2 **pode**
calcular, resumir, rotear, explicar, registrar e escalar visibilidade; **não
pode** decidir conduta, executar intervenção nem auto-encerrar; override humano
é desfecho de primeira classe; o rótulo consultivo **não** desculpa display
errado ou falsamente tranquilizador.

| Etapa | Frontstage (clínico) | Backstage (V2) | Sistemas | Regras de segurança da etapa |
|---|---|---|---|---|
| 1. Ingestão de observações | — (invisível; o clínico segue seu fluxo de registro) | Validação de entrada; inválido → quarentena com motivo, nunca descartado nem promovido | Fonte de dados clínicos (nesta fase: fixtures sintéticas; AMH = candidato a integração, Observation não consumível) | Nenhum timestamp inventado (DOM-0009); unidade/rota inconsistente → `invalido`, jamais coagido (SF-3 como antirregra) |
| 2. Avaliação com status explícito | — | Cálculo por versão de regra; status sempre presente (5 estados ADR-0008); razões codificadas; insumo ausente **jamais** vira 0/normal | Runtime de regras; rule release versionado | SAF-0001/0002; precedência P-a; sem política parcial ratificada ⇒ `não avaliada` |
| 3. Projeção na grade de leitos | Vigilância da unidade numa tela: escore/banda quando legíveis; estado fail-closed visível como "olhe isto"; frescor por leito | Projeção reconstruível server-side, escopada ao tenant | ADR-0011; gateway de tempo real (pendência declarada na fatia) | Roll-up monotônico (N4); leito não avaliado nunca renderiza `normal` (HAZ-0005) |
| 4. Alerta → item de trabalho | Alerta novo anunciado com coalescência (live region); item entra na fila com severidade e origem | Alerta = fato imutável; WorkItem = ciclo de vida operável (8 estados); timers de escalada duráveis | ADR-0009; ADR-0010 (outbox) | Cada sinal novo tem custo de atenção (L-1) — agrupamento sem perda de fonte; no-fire persiste razão fora da máquina (SAF-0019) |
| 5. Ação humana | Reconhecer (ciência), atribuir, escalar, sobrepor com racional, resolver — em duas etapas com confirmação; conflito de concorrência mostrado com estado corrente para redecisão | Comandos idempotentes, concorrência otimista, auditoria na mesma transação | ADR-0009 W2/W3/W6 | Nenhum sucesso otimista antes da confirmação (ADR-0021 F5); a decisão clínica permanece com o humano (W12; regra §3-15) |
| 6. Escalada com dono explícito | "Quem é responsável agora" visível e transferível; escalada automática muda urgência/roteamento e nunca comunica "tratado" | Timers re-armáveis crash-safe | ADR-0009 W5 | Resposta à falha do elo aferente (L-6): a janela sem dono é desenhada e exibida, não presumida inexistente |
| 7. Explicabilidade | Insumos, ausentes, tempo de fonte, versão de regra, racional e incerteza — visíveis sem sobrecarregar | — | ADR-0021 F8 | Objetivo: permitir **discordar com confiança** (VAL-0029 — lacuna de literatura declarada; validação humana pendente) |
| 8. Passagem de plantão (suporte) | Resumo de itens abertos/pendentes/suprimidos da unidade como apoio ao rito verbal padronizado — **apoio, não substituto** (L-5 recomenda handoff verbal em horário dedicado) | Estado persistente dos itens sobrevive à troca de turno | ADR-0009 (estados duráveis) | Titularidade na troca de turno é hipótese não validada (VAL-0016/0018 → RISK-0013); o desenho assume a janela sem dono e a exibe |
| 9. Auditoria e aprendizado | Overrides/supressões contáveis e revisáveis | AuditEvidence imutável por transição | ADR-0009 W6; ADR-0018 | Reconstruibilidade da decisão (QAS-0016) |

## 3. Pontos de falha e degradação (frontstage do modo degradado)

**SOURCE (WF-05 + achados ALTB, via dossiê §3.5):** o perigo legado era a
*combinação* — eventos sem entrega confiável + leito sem dado renderizado
`normal` + história antiga preenchendo janela vazia = "uma tela calma
descrevendo nada". O modo degradado da V2 é desenhado e testado contra a
combinação, e a degradação aparece **no ponto de uso clínico**:

| # | Ponto de falha | Comportamento visível exigido | Fonte |
|---|---|---|---|
| F1 | Fonte de dados indisponível/vazia | Leito exibe `dado indisponível`/`não avaliada` com razão — nunca célula vazia, nunca último valor sem idade | HAZ-0005; HAZ-0039; ADR-0008 N7 |
| F2 | Evento não entregue / atraso de projeção | Estado de conectividade `degradado` + frescor por superfície (ADR-0011 P6); marcação de idade em todo dado exibido | WF-05; ADR-0011 |
| F3 | Avaliação não computável persistente | Exibida como *vigilância ausente* com sinal operacional — nunca via quieta habituável | HAZ-0043; SAF-0040 |
| F4 | Notificação falha | Dimensão de entrega mostra a falha junto ao item; o item **não** regride nem some (P4) | ADR-0009 DIV-1; HAZ-0015 |
| F5 | Conflito de dados entre origens | Conflito exibido como conflito (`conflitante`/`invalida` com razão `conflicting_inputs`); nunca resolução silenciosa "mais recente vence" | WF-06; SF-3; prompt §20 |
| F6 | Ação concorrente de dois clínicos | Falha explícita com estado corrente e autor; redecisão humana em segundos (H1 do ADR-0009 — validação pendente) | ADR-0009 W3; HAZ-0023 |
| F7 | Falha no meio de ação em grupo | Resultado por item; o grupo jamais aparenta tratado | ADR-0009 W11; HAZ-0033 |
| F8 | Sessão expira durante ação | Trabalho não salvo protegido; reapresentação para confirmação após reautenticação; cache de paciente limpo | prompt §11; modelo de estados §4 |
| F9 | Rollback de bundle de regra | Avaliações do release morto transitam para `não avaliada` (razão `rule_unavailable`) — o modo degradado É o default honesto | ADR-0008 §8.3 |
| F10 | Downtime completo da V2 | Orientação visível de fallback ao procedimento institucional; retorno com reconciliação explícita (`reproduzindo` → `reconciliado`) — conduta praticada do sítio é desconhecida (VAL-0021 → RISK-0013) | prompt §11; ADR-0020 |

## 4. O que este blueprint não afirma

1. Não afirma que o fluxo atual descrito ocorre na unidade-alvo (RISK-0013,
   vieses (a)/(b) transcritos no dossiê §5) — descreve a classe de ambientes.
2. Não afirma benefício clínico do fluxo desejado — nenhuma alegação de
   efetividade; o contrafactual (baseline pré-V2, VAL-0035) permanece pendente
   pela via retrospectiva (SPR-G1-10, sob condicionantes por operação do
   parecer OS-16 — GDEC-0012).
3. Não fecha nenhum VAL/HAZ/RISK; não presume aprovação humana de nenhuma
   etapa; a validação com usuários (cenários simulados de tempo crítico, não
   entrevistas de preferência) é SPR-G4-5.
