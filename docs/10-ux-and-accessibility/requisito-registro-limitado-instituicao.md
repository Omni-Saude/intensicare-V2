---
doc_id: 10-ux-requisito-registro-limitado-instituicao
title: >
  Requisito de UI verificável — rótulo "registro limitado a esta instituição"
  (HAZ-0046; ADR-0004 §6.2, obrigação de segurança clínica vinculante)
status: PROPOSAL
label: PROPOSAL
owner: UNASSIGNED — VALIDATION REQUIRED
collector: especialista de UX e acessibilidade (ciclo 6, SPR-G4-3)
source: >
  docs/06-architecture/adrs/ADR-0004-identidade-paciente-encontro-mpi.md §6.2
  (requisito de produto derivado e VINCULANTE da ata AQ-1);
  docs/05-clinical-safety/hazard-log.md HAZ-0046 (S4/L4, Unacceptable, OPEN);
  INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §11; ADR-0021 F1/F3/F7; ADR-0029
date_collected: 2026-08-16
last_updated: 2026-08-16
provenance:
  source_repo: intensicare-V2
  path_or_url: docs/10-ux-and-accessibility/requisito-registro-limitado-instituicao.md
  commit_sha_or_version: 32d44e7acaad67d0f49c0e418479123c06e84c31 (HEAD de cycle-6/construcao-g7 na redação)
  section_or_lines: documento inteiro
  date_collected: 2026-08-16
  collector: especialista de UX e acessibilidade (ciclo 6, SPR-G4-3)
  transformation: >
    especificado — o requisito vinculante de ADR-0004 §6.2/HAZ-0046 é
    decomposto em cláusulas de UI verificáveis; nenhuma cláusula fecha o
    hazard, que permanece OPEN
  confidence: high
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
---

# Requisito de UI — "Registro limitado a esta instituição"

> **Rótulos locais:** os identificadores `RLI-*` abaixo são **IDs
> documento-locais, pendentes de ratificação em
> `docs/00-governance/traceability-policy.md` §1.1** (mesmo regime dos rótulos
> MD/MG/SPR do mapa). Nenhum prefixo novo de taxonomia é cunhado.

## 1. Fonte e natureza vinculante

- **SOURCE (ADR-0004 §6.2, requisito de produto derivado e VINCULANTE da ata
  AQ-1):** *"a UI da V2 DEVE exibir a limitação ao clínico — em linguagem
  equivalente a 'registro limitado a esta instituição'. Esta é uma obrigação de
  segurança clínica, não uma preferência de UX"* — a interface **não pode**
  sugerir completude longitudinal que não possui; a ausência precisa ser
  visível, não presumida (DOM-0004, SAF-0005).
- **SOURCE (hazard-log.md, HAZ-0046 — S4/L4, Unacceptable, OPEN):** o modelo de
  identidade decidido fragmenta **por construção** o paciente atendido em mais
  de uma PJ (MPI por tenant); sem o rótulo, o clínico lê a tela como *o
  registro do paciente* e não como *o registro do paciente **nesta
  instituição*** — ausência de história prévia é lida como **ausência de
  evento**. O hazard não é a fragmentação (aceita pela autoridade decisora); é
  a **ausência da divulgação**: "registro correto, apresentação enganosa".
- **SOURCE (ADR-0004 §6.2 / HAZ-0046):** população exposta **medida**: 4.220
  pacientes (3,88%) com atendimento em mais de uma PJ (ADR-041 L22, citado
  pela ata).
- **Escopo epistêmico deste documento:** especifica o requisito como conjunto
  de cláusulas de UI verificáveis. **Não fecha HAZ-0046** (nada aqui fecha
  hazard); a mitigação só conta quando implementada, testada e validada com
  humanos (ADR-0004 V10).

## 2. Cláusulas verificáveis

| ID local | Cláusula (PROPOSAL) | Critério de verificação |
|---|---|---|
| RLI-1 | **Presença universal:** toda superfície que apresente dados identificáveis de paciente (detalhe do paciente, histórico, grade quando expandir contexto de paciente, tela de via, impressos/exportações, conteúdo de notificação que carregue contexto de paciente) exibe o rótulo em linguagem equivalente a "Registro limitado a esta instituição" | Teste automatizado de presença por tela de contexto de paciente (bloqueante em CI); revisão de PR usa a tabela de contrato por tela (ADR-0021 F6) |
| RLI-2 | **Permanência:** o rótulo não é descartável pelo usuário, não expira, não é colapsado por padrão e permanece presente em **todos** os estados da tela — inclusive carregando, parcial, degradado e erro (a limitação vale independentemente do estado do dado) | Teste de UI por estado: rótulo presente em cada estado da família de carregamento e de conectividade |
| RLI-3 | **Não-só-cor e acessível:** o rótulo é textual (nunca apenas ícone/cor), programaticamente determinável (nome acessível), anunciado por tecnologia assistiva na chegada à superfície, legível sob zoom 400%/reflow e com contraste AA | Auditoria WCAG 2.2 AA automatizada + verificação manual com leitor de tela (ADR-0021 F7) |
| RLI-4 | **Vazio nunca tranquiliza:** onde a UI exibir histórico/lista vazia em contexto de paciente, a redação declara o recorte institucional — linguagem equivalente a "nenhum registro **nesta instituição**" — e **nunca** "sem internações prévias", "sem comorbidades", "sem exames anteriores" ou equivalente que afirme inexistência do evento | Teste de componente sobre os textos de estado vazio em contexto de paciente; lista de redações proibidas mantida junto ao módulo de linguagem (ADR-0021 F3 — o módulo nunca reescreve o rótulo para fora do sentido) |
| RLI-5 | **Rastreabilidade do identificador:** o rótulo corresponde a um identificador estável originado no backend (ADR-0021 F1) — p.ex. a marcação de escopo institucional do registro — de modo que telemetria/auditoria provem a exibição sem depender do texto | Teste V1 da ADR-0021: alterar o texto não altera o evento/identificador |
| RLI-6 | **Gate de revisão:** ausência do rótulo em qualquer superfície nova de contexto de paciente é **defeito bloqueante de revisão** (mesma classe de ADR-0021 F4), não melhoria futura | Checklist automatizada de cobertura + revisão humana de PR |
| RLI-7 | **Validação de fatores humanos (VALIDATION REQUIRED):** apresentar a fragmentação a clínicos em cenário simulado e medir se é compreendida como *fragmentação* (história existente e invisível) e não como *ausência de história* — item de validação do Gate G1/G4 registrado em ADR-0004 §6.2(iii)/V10; executa-se em SPR-G4-5 | Relatório de validação com medidas definidas antes; resultado registrado mesmo se contrário |
| RLI-8 | **Texto final via processo ADR-0029:** a redação pt-BR definitiva do rótulo e das mensagens de vazio (RLI-4) passa pelo processo de validação terminológica antes de ratificação; até lá o texto é provisório e rotulado como tal | Registro do processo ADR-0029 (condição C2 da ADR-0021) |
| RLI-9 | **Interação com o índice cross-PJ (futuro):** se/quando o índice cross-PJ (ADR-043, mitigação (ii) de ADR-0004 §6.2) for liberado juridicamente, o rótulo é **revisado, não removido por padrão** — a remoção exige decisão registrada da autoridade clínica, porque a completude passaria a depender do alcance real do índice | Gatilho de revisita registrado; nenhuma remoção silenciosa |

## 3. Estado observado na implementação de referência

- **OBSERVED (2026-08-16, `apps/web/src/` em 32d44e7):** a fatia SPR-G7-2
  **ainda não implementa** o rótulo — nenhuma ocorrência de "instituição" no
  código da fatia; o banner existente (`BannerContexto.tsx`) cobre apenas
  "consultivo + dados sintéticos". Registrado como **pendência da fatia**
  (também apontada na `tabela-contrato-ui-backend.md` §2). Este documento não
  fecha a pendência; ela fecha por implementação + teste RLI-6 verde +
  revisão.

## 4. Ligações

- HAZ-0046 (OPEN — nada aqui o fecha); HAZ-0027 (distinção registrada no
  hazard log: lá a história partida é defeito; aqui a fragmentação é projeto e
  o hazard é a omissão da divulgação).
- ADR-0004 §6.2 (fonte vinculante); SAF-0005, SAF-0023, SAF-0034, SAF-0035;
  DOM-0004.
- ADR-0021 F1/F3/F4/F6/F7 (mecanismos de auditabilidade e gate); ADR-0029
  (texto final).
- `modelo-de-estados-obrigatorios.md` §5 (estado `vazio` em contexto de
  paciente remete a RLI-4); `arquitetura-de-informacao.md` §5 (inventário de
  superfícies).
