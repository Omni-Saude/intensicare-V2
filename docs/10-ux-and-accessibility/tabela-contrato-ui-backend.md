---
doc_id: 10-ux-tabela-contrato-ui-backend
title: >
  Tabela de contrato UI ↔ backend da fatia SPR-G7-2 — por elemento de UI:
  objetivo, API autoritativa, estado de domínio, frescor, autorização,
  comportamento otimista, falha/recuperação, auditoria e teste de aceitação
status: PROPOSAL
label: PROPOSAL
owner: UNASSIGNED — VALIDATION REQUIRED
collector: especialista de UX e acessibilidade (ciclo 6, SPR-G4-3)
source: >
  INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §11 (formato da tabela de contrato);
  packages/contratos/openapi.yaml (OpenAPI 3.1 da fatia — OBSERVED);
  apps/web/src/ (implementação de referência — somente leitura);
  ADR-0009 W1-W12; ADR-0011 P1-P7; ADR-0021 F1-F8
date_collected: 2026-08-16
last_updated: 2026-08-16
provenance:
  source_repo: intensicare-V2
  path_or_url: docs/10-ux-and-accessibility/tabela-contrato-ui-backend.md
  commit_sha_or_version: 32d44e7acaad67d0f49c0e418479123c06e84c31 (HEAD de cycle-6/construcao-g7 na redação)
  section_or_lines: documento inteiro
  date_collected: 2026-08-16
  collector: especialista de UX e acessibilidade (ciclo 6, SPR-G4-3)
  transformation: >
    compilado — elementos de UI lidos dos componentes da fatia; operações e
    códigos de erro lidos de packages/contratos/openapi.yaml; obrigações de
    auditoria derivadas de ADR-0009 W6 (eventos pendentes de contrato)
  confidence: medium
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
---

# Tabela de contrato UI ↔ backend — fatia SPR-G7-2

> **SOURCE (prompt §11):** "For every screen and interaction, create a
> UI/backend contract table" com as colunas: elemento/ação, objetivo do
> usuário, API/query/comando autoritativo, estado de domínio, frescor,
> autorização, comportamento otimista, falha/recuperação, evento de auditoria,
> teste de aceitação. **SOURCE (ADR-0021 F6):** a tabela é artefato de revisão
> de toda tela nova, não documentação posterior.
>
> **Escopo:** os elementos construídos da fatia sintética SPR-G7-2
> (implementação de referência em `apps/web/src/` — citada como *reference
> implementation*, somente leitura) contra o contrato
> `packages/contratos/openapi.yaml` (OBSERVED nesta redação). A fatia consome
> hoje um **cliente mock em memória** (`clienteMock.ts`, marcado "INTEGRAÇÃO
> PENDENTE"); a coluna "API autoritativa" registra a operação do contrato que
> a tela consumirá na integração. Dados 100% sintéticos (`SYNTH-`); nenhum
> dado real acessado; 0 vias acionáveis; Observation da AMH não consumível
> (candidato a integração).
>
> **Auditoria:** o contrato da fatia ainda **não** publica superfície de
> evento de auditoria; a coluna registra o evento exigido por ADR-0009 W6
> (gravado pelo backend na mesma transação), marcado *pendente de contrato*.
> Telemetria/auditoria referencia sempre o identificador de estado, nunca o
> texto pt-BR (ADR-0021 F1).

## 1. Tela: Grade de leitos (leitura)

| Elemento/ação de UI | Objetivo do usuário | API/consulta autoritativa | Estado de domínio | Frescor | Autorização | Comportamento otimista | Falha/recuperação | Evento de auditoria | Teste de aceitação |
|---|---|---|---|---|---|---|---|---|---|
| Banner permanente de contexto (`BannerContexto`) | Saber que o sistema é consultivo e opera dados sintéticos | — (estático; nunca removido por estado de UI) | — | — | — | n/a (sem comando) | Nunca ocultado, inclusive em erro/degradado | nenhum | OBSERVED: `render.test.tsx` (presença em toda tela); critério: banner presente em todos os estados de tela |
| Lista da grade (`GradeLeitos`) | Vigiar a unidade inteira numa tela | `GET /v1/projecoes/grade-leitos` (`obterGradeLeitos`) — projeção server-side escopada ao tenant (ADR-0011 P1/P2); filtragem/agregação server-authoritative | `EstadoCarregamento` (9) por tela; por leito: `EntradaGradeLeitos` | `frescor` por leito no payload (ADR-0011 P6) — o cliente não deriva | Bearer por tenant (stub sintético declarado no contrato); sem token → 401 | Nenhum — leitura; nada renderiza como dado sem resposta | `EstadoTela` cobre carregando/vazio/indisponível/proibido/tempo-esgotado/retentando/parcial/erro; recuperação por nova tentativa explícita | nenhum (leitura; acesso auditável é obrigação de ADR-0018 — pendente de contrato) | Testes de UI por estado (fatia §14); vazio ≠ falha; lista parcial exibe banner de parcialidade |
| Cartão de leito (`CartaoLeito`) — escore/banda/frescor | Triagem rápida: onde olhar primeiro | mesma resposta de `obterGradeLeitos` | `EstadoAvaliacao` (5, ADR-0008); `BandaRisco` só quando status permite (N7) | pior frescor entre contribuições presentes (`calcularFrescorGeral` — nunca melhor que o pior insumo) | idem tela | n/a | Leito vago declarado ("Leito vago — sem paciente associado."); avaliação fail-closed exibe selo `inconclusivo`, **sem** escore/banda | nenhum | OBSERVED: `render.test.tsx`; critério HAZ-0005: nenhum caminho renderiza leito não avaliado como normal/banda |
| Navegação cartão → detalhe | Aprofundar em 1 ação | — (navegação local; dados via `obterAvaliacoesPaciente` na chegada) | — | — | herdada | n/a | Retorno em 1 ação preservando contexto da grade | nenhum | teclado: cartão é `<button>` nativo, foco visível |
| Painel "Alertas ativos" (`PainelAlertas`) | Ver e tratar pendências sem sair da vigilância | mesma projeção (alertas por leito); ciclo de vida via ADR-0009 | `EstadoItemTrabalho` (8, W1) | `criadoEm`/`atualizadoEm` exibidos | idem tela | n/a (leitura) | Lista vazia declarada ("Nenhum alerta neste momento." — distinção no-fire × supressão pertence ao backend, P6) | nenhum (leitura) | agrupamento futuro segue IA-N7..N11 (`arquitetura-de-informacao.md` §4) |
| Região viva de alertas (`RegiaoAoVivoAlertas`) | Usuário de leitor de tela é notificado de alerta novo | derivado da mesma projeção | — | — | — | n/a | Mensagem coalescida (contagem), nunca uma rajada por alerta | nenhum | teste de a11y: `role="alert"` assertivo, `aria-atomic` |
| Controle de demonstração (`ControleDemonstracao`) | Revisor força estados de tela | — (apenas front-end sintético; rotulado como tal na UI) | `ModoDemonstracao` | — | — | n/a | Nunca apresentado como comportamento de produção | nenhum | OBSERVED: rotulagem explícita "apenas front-end sintético" |

## 2. Tela: Detalhe do paciente (leitura + explicabilidade)

| Elemento/ação de UI | Objetivo do usuário | API/consulta autoritativa | Estado de domínio | Frescor | Autorização | Comportamento otimista | Falha/recuperação | Evento de auditoria | Teste de aceitação |
|---|---|---|---|---|---|---|---|---|---|
| Cabeçalho de avaliação (status + banda) | Saber se o escore é utilizável antes de ler o número | `GET /v1/pacientes/{pacienteRef}/avaliacoes` (`obterAvaliacoesPaciente`) | `EstadoAvaliacao`; banda apenas se status permite (N7) | `avaliadoEm` exibido ("calculado em …, regra vX") | Bearer por tenant; **404 indistinguível** entre inexistente e cross-tenant (contrato, ADR-0011 E5/THR-0017) | n/a | Estado fail-closed exibe `role="alert"` com explicação do porquê nenhum valor aparece | nenhum (acesso auditável — ADR-0018, pendente de contrato) | vetor: todos os insumos ausentes ⇒ nenhum escore/banda renderizado |
| Rótulo "registro limitado a esta instituição" | Não ler recorte institucional como história completa | — (rótulo estrutural; ver `requisito-registro-limitado-instituicao.md`) | — | — | — | n/a | Presente em todo estado, inclusive degradado | nenhum | **PENDÊNCIA OBSERVADA: ainda não implementado na fatia** (RLI-6 define o teste bloqueante) |
| Contribuição por parâmetro (`ContribuicaoParametroLinha`) | Entender por que o escore é o que é; discordar com confiança | mesma resposta (`ResultadoAvaliacao.parametros`) | valor `null` quando ausente — nunca 0 silencioso | `frescor` + `horarioFonte` por parâmetro (SAF-0005) | herdada | n/a | Parâmetro ausente aparece **como linha declarada**, nunca omitido | nenhum | vetores de insumo ausente (SAF-0002 — sonda bloqueante) |
| Bloco "Insumos ausentes / desatualizados" | Ver o que falta antes de confiar | mesma resposta (`parametrosAusentes`; `insumosVelhos`) | — | — | herdada | n/a | "nenhum." explícito quando vazio | nenhum | lista bate 1:1 com os insumos não computáveis do vetor |
| Versão de regra exibida | Rastreabilidade da explicação | mesma resposta | `versaoRegra` | — | — | n/a | — | nenhum | presença obrigatória (ADR-0021 F8) |
| Voltar à grade | Retomar vigilância | — | — | — | — | n/a | 1 ação; contexto preservado | nenhum | teclado + foco restaurado |

## 3. Ação de comando: Reconhecer alerta (duas etapas)

| Elemento/ação de UI | Objetivo do usuário | API/comando autoritativo | Estado de domínio | Frescor | Autorização | Comportamento otimista | Falha/recuperação | Evento de auditoria | Teste de aceitação |
|---|---|---|---|---|---|---|---|---|---|
| Botão "Reconhecer alerta" → confirmação → envio (`ReconhecerAlerta` + `reconhecerAlertaMaquina`) | Registrar ciência (não conclusão — P5) de um alerta | `POST /v1/alertas/{id}/reconhecer` (`reconhecerAlerta`), com `Idempotency-Key` e `If-Match` (versão vista — ADR-0009 W2/W3) | Transição `nao_atribuido`/`atribuido`/`escalado`/`reaberto` → `reconhecido`; demais estados não exibem a ação | `atualizadoEm` retorna no item | Bearer por tenant + ator humano individual (W4; conta compartilhada não transiciona) | **NENHUM sucesso otimista** (ADR-0021 F5): fases `ocioso → confirmando → enviando → sucesso/falha`; `sucesso` só após confirmação do backend (OBSERVED: máquina pura testada à parte) | 400/428 chave ou `If-Match` ausentes; **412** conflito de versão com estado corrente + autor para redecisão humana; **409** transição inadmissível no estado atual; 404 inexistente/cross-tenant; `falha` mantém "Tentar novamente" — nunca trava a tela; reenvio da mesma chave devolve o resultado original sem duplicar efeito | `AuditEvidence` imutável na mesma transação (ator, comando, chave, versão vista, estado anterior→novo — W6) — **pendente de contrato**; a UI referencia o identificador de estado, nunca o texto | OBSERVED: `reconhecerAlertaMaquina.test.ts` + `clienteMock.test.ts` (idempotência); pendente: teste de contrato do 412 com corpo `ProblemaDetailsConflitoVersao` (cenário G4) |

## 4. Operações do contrato ainda sem superfície de UI na fatia

| Operação (contrato) | Situação de UI | Observação |
|---|---|---|
| `POST /v1/ingestao/observacoes` | Sem tela (ingestão é backstage) | Quarentena retornada no payload deverá ter superfície de revisão (especificada; não construída) |
| `GET /v1/eventos/stream` | Sem consumo na fatia web | Catch-up por cursor apenas; push contínuo é pendência declarada (`x-pendencias` do contrato); alimenta os estados `reproduzindo`/`reconciliado` do modelo de estados §6 |
| `GET /v1/healthz` | Sem tela | Alimentará o estado `degradado`/`offline` de conectividade |

## 5. Divergências OBSERVADAS entre fatia web, contrato e ADRs (pendências de integração — nada é resolvido aqui)

| # | Divergência | Onde | Direção de resolução (PROPOSAL) |
|---|---|---|---|
| 1 | A fatia web usa tipos locais (`api/tipos.ts`, `domain/estados.ts`) em vez de tipos gerados do contrato | `apps/web` (marcado "INTEGRAÇÃO PENDENTE") | Gerar/validar tipos a partir de `openapi.yaml` (ADR-0021 F1; prompt §11) e remover os espelhos locais |
| 2 | `StatusAvaliacao` do contrato tem 3 valores; ADR-0008 decide 5 estados + razões codificadas (N3) | `openapi.yaml` | Contrato converge para os 5 estados com razões; a UI não inventa mapeamento |
| 3 | `BandaRisco` divergente: contrato `normal/atencao/alerta/critico` × web `baixo/medio/alto/critico` | ambos | Reconciliar via processo ADR-0029; atenção a P1 (o termo "normal" nunca pode colidir com a leitura de não avaliado) |
| 4 | `Frescor` do contrato tem 3 valores; o §11 exige 9 | `openapi.yaml` | Ampliar o contrato (família completa do modelo de estados §1) |
| 5 | O cliente da fatia (`ClienteApiIntensiCare.reconhecerAlerta`) não transporta o token de versão (`If-Match`) que o contrato e ADR-0009 W3 exigem; o mock não produz 412/409 | `apps/web/src/api/` | Na troca pelo cliente HTTP real, o comando carrega a versão vista e a UI implementa a tela de conflito com estado corrente (linha §3 acima) |
| 6 | Identificadores com grafia divergente (`nao-atribuido` × `nao_atribuido`) | contrato × web | Normalização única na geração de tipos |
| 7 | Nenhum evento de auditoria consultável no contrato | `openapi.yaml` | Superfície de auditoria é ADR-0018; até lá a coluna de auditoria desta tabela permanece "pendente de contrato" |

## 6. Regras de aceitação transversais (herdadas, vinculantes)

- Filtragem, paginação, agregação e autorização **server-authoritative**
  (prompt §11) — a UI nunca filtra para "corrigir" o servidor.
- Nenhum estado otimista local pode mascarar falha de comando relevante à
  segurança (prompt §11; ADR-0021 F5) — verificado por injeção de falha (V4).
- Schemas gerados **não bastam**: o Gate G4 exige testes de contrato em nível
  de cenário provando a concordância jornada × máquina de estados × API ×
  erro/degradado × authz × auditoria (prompt §11, Gate G4) — pendentes para
  esta fatia além dos testes unitários OBSERVADOS.
- WCAG 2.2 AA em todo elemento listado; preferência estética não é critério.
