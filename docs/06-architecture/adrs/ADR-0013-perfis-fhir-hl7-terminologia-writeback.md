---
id: ADR-0013
title: Perfis FHIR R4 restritos e versionados, HL7 v2, terminologia e writeback aprovado
status: PROPOSAL   # regra de CI (agente não grava DECIDED/accepted no front matter); status do ADR no corpo: accepted (direção GDEC-0016; minuta materializada em construção — GDEC-0015)
date: 2026-08-16
last_updated: 2026-08-16
owner: rodaquino-OMNI (titular decisor da direção — GDEC-0016); redator - agente de minutas de ADR (ciclo 6); o redator não é aprovador
approvers:
  - AUTH-DATA-PLATFORM (detida por rodaquino-OMNI, DEC-G0-04)
  - AUTH-CLINSAFETY (detida por rodaquino-OMNI, GDEC-0003)
source: >
  INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §12.2 (FHIR/SMART), §12.3 (HL7 v2), Gate G5, §20;
  docs/06-architecture/adrs/adr-index.md (linha ADR-0013; dependências 0001/0005/0012; Gate G5);
  GDEC-0016 (aceite em lote das direções, 2026-08-16); ADR-0001 (aceito), ADR-0005 (aceito, M1-M10),
  ADR-0006 (aceito, Opção A), ADR-0007 (aceito)
provenance:
  source_repo: intensicare-V2
  path_or_url: docs/06-architecture/adrs/ADR-0013-perfis-fhir-hl7-terminologia-writeback.md
  commit_sha_or_version: 33c749a (branch cycle-6/construcao-g7, base da redação)
  section_or_lines: prompt §12.2/§12.3/§20; adr-index.md §3, §4.1, §5
  date_collected: 2026-08-16
  collector: agente de minutas de ADR (ciclo 6)
  transformation: reasoned-from — materialização em minuta de direção já aceita pelo titular (GDEC-0016); a decisão não é reaberta
  confidence: medium
  validation_status: VALIDATION REQUIRED (conferência do titular sobre a materialização; a direção em si está aceita)
links:
  adrs:
    depends_on: [ADR-0001, ADR-0005, ADR-0012]
    feeds: [ADR-0023]
  gates: [G5]
supersedes: null
superseded_by: null
---

# ADR-0013 — Perfis FHIR R4 restritos e versionados, HL7 v2, terminologia e writeback aprovado

> **Status: accepted (direção GDEC-0016; minuta materializada em construção — GDEC-0015).**
> A direção foi aceita pelo titular (rodaquino-OMNI) em 2026-08-16 na sessão GDEC-0016;
> esta minuta **documenta e detalha** a direção aceita — ela não reabre a decisão.
> Aceito ≠ implementado ≠ verificado: nada aqui fecha o Gate G5.

## 1. Contexto e formulação do problema

SOURCE (ADR-0001, aceito — formulação do titular): **"a V2 SEMPRE consome dados da AMH;
nunca ingestão direta."** SOURCE (ADR-0006, aceito — Opção A): a lane operacional V2 é
autoritativa no laço clínico; a lane analítica AMH serve reconciliação/backfill. SOURCE
(prompt §12.2): FHIR R4 só pode ser usado por meio de guias de implementação/perfis
explícitos, com campos obrigatórios, cardinalidades, bindings de terminologia, parâmetros
de busca e tratamento de `OperationOutcome` registrados. SOURCE (prompt §20): alegações
genéricas como "FHIR compatible" ou "HL7 compliant" sem versão, perfil, cenário e
evidência nomeados são proibidas.

INFERENCE (das fontes acima): a V2 tem três superfícies de interoperabilidade distintas —
(a) o **consumo** de dados clínicos, sempre pela fronteira AMH; (b) a **exposição** de
projeções da V2 a consumidores externos; (c) o **writeback** a sistemas de origem. Cada
uma precisa de perfil próprio, restrito e versionado, ou o Gate G5 não tem contra o que
testar conformidade.

**Pergunta.** Que perfis FHIR R4, que contrato HL7 v2, que política de terminologia e que
política de writeback governam as superfícies de interoperabilidade da V2, dado que todo
consumo passa pela AMH (ADR-0001)?

**Fora de escopo:** versionamento/erros/idempotência da API REST própria (ADR-0012);
exposição MCP (ADR-0014); autenticação e autorização (ADR-0015/ADR-0016); importação
legada (ADR-0023, que consome este ADR).

## 2. Drivers de decisão

| # | Driver | Por que importa aqui |
|---|---|---|
| D1 | Nenhuma alegação genérica de padrão (prompt §20) | Conformidade só é testável contra perfil nomeado e versionado |
| D2 | Coerência com o modelo canônico aceito (ADR-0005 M1–M10) | UCUM canônico (M5), quarentena de código desconhecido (M6), não-coerção (M7) já são vinculantes |
| D3 | Fronteira AMH obrigatória (ADR-0001) | O consumo nunca é direto de EHR/dispositivo; o perfil de consumo é contra o contrato AMH |
| D4 | Licenciamento de terminologia é risco jurídico-comercial | SNOMED CT exige licença por afiliado; LOINC/UCUM têm regimes distintos |
| D5 | Writeback tem consequência clínica em sistema alheio | Escrever em sistema de origem é ação de alta consequência; exige aprovação e trilha |
| D6 | Gate G5 exige evidência de conformidade executada | Sem perfis restritos, não há suíte de conformidade possível |

## 3. Alternativas consideradas

### Opção A — Perfis restritos e versionados + terminologia canônica com licenciamento adiado + writeback aprovado (DIREÇÃO ACEITA — GDEC-0016)

Perfis FHIR R4 próprios, **restritos** (só os recursos e campos que a V2 de fato consome
ou expõe) e **versionados**; HL7 v2 por perfil por fonte na fronteira AMH; terminologia
LOINC/UCUM/SNOMED com **licenciamento SNOMED como cláusula adiada**; writeback existente
apenas como **fluxo aprovado individualmente**.

- **Positivas:** conformidade testável (G5); coerência direta com ADR-0005; superfície
  mínima de ataque e de manutenção; alegações honestas (§20).
- **Negativas:** custo de autoria e manutenção de perfis próprios; consumidores que
  esperam "FHIR genérico" precisam de adaptação; cláusula adiada de SNOMED permanece
  aberta e pode forçar remodelagem de bindings.

### Opção B — Adoção genérica "FHIR R4 compatível" sem perfis próprios

- **Positivas:** menor custo inicial de autoria; marketing simples.
- **Negativas:** viola frontalmente o prompt §20 (alegação genérica sem perfil/cenário);
  conformidade não testável; cardinalidades e bindings implícitos produzem coerção
  silenciosa de dados — incompatível com ADR-0005 M6/M7. **Rejeitada.**

### Opção C — Interoperabilidade proprietária apenas (sem FHIR/HL7)

- **Positivas:** controle total do contrato; nenhum custo de perfil.
- **Negativas:** isola a V2 do ecossistema hospitalar; empurra o custo de mapeamento para
  cada cliente; contradiz as obrigações de interoperabilidade da fronteira AMH (§12.2).
  **Rejeitada.**

### Opção Z — Adiar

- **Custo do adiamento:** a fatia G7 e o ADR-0023 (importação legada) consomem a forma
  canônica→FHIR; adiar deixa o Gate G5 sem objeto e reabre o risco de acoplamento ad hoc.
  **Rejeitada pela aceitação da direção (GDEC-0016).**

## 4. Decisão e escopo

> **DIREÇÃO ACEITA (GDEC-0016, 2026-08-16; decided_by: rodaquino-OMNI, titular —
> AUTH-DATA-PLATFORM/AUTH-CLINSAFETY).** Opção A. A minuta normativa F1–F10 abaixo
> **materializa** a direção aceita (GDEC-0015: minuta em construção; detalhamentos além
> da direção estão marcados como PREMISSA reversível de uma linha).

**F1 — Nenhuma alegação genérica.** Toda alegação de interoperabilidade nomeia versão
(FHIR R4 4.0.1), perfil, recurso, cenário e evidência (prompt §20). "FHIR compatible"
sem perfil é defeito de documentação.

**F2 — Perfis próprios, restritos e versionados.** Cada recurso consumido ou exposto tem
perfil explícito com campos obrigatórios, cardinalidades, referências, bindings de
terminologia, parâmetros de busca, comportamento de paginação/história e tratamento de
`OperationOutcome` (§12.2). Perfis são artefatos versionados (versionamento semântico) no
pacote de contratos. PREMISSA (reversível, GDEC-0015/0017): os canônicos de perfil vivem
em `packages/contratos` e a URL canônica pública será fixada quando existir domínio de
publicação decidido.

**F3 — Consumo sempre pela fronteira AMH.** O perfil de consumo da V2 é contra o contrato
da lane operacional AMH (ADR-0001; ADR-0006 Opção A). A V2 **nunca** ingere diretamente
de EHR, dispositivo ou interface HL7 v2 de origem; HL7 v2 chega à V2 já materializado na
fronteira AMH.

**F4 — HL7 v2 por perfil por fonte.** Para cada fonte HL7 v2 a montante, o contrato
AMH×V2 registra: perfil por fonte, identidade de controle de mensagem, contrato ACK/NAK,
autenticação e fronteira TLS/rede, armazenamento durável do envelope bruto, idempotência,
retry/dead-letter/quarentena, tratamento de relógio/fuso, mapeamento de
terminologia/unidade, redação e replay (§12.3). Aceite durável jamais é confirmado antes
da fronteira de persistência acordada.

**F5 — Terminologia canônica versionada.** LOINC para observações; **UCUM como sistema
canônico de unidades** (ADR-0005 M5 — valor de origem preservado com proveniência de
mapeamento); SNOMED CT para achados/condições **com cláusula adiada de licenciamento**:
nenhum conteúdo SNOMED é redistribuído antes de decisão registrada de licença (coerente
com a cláusula adiada já registrada nos ADRs clínicos GDEC-0007). Value sets são
versionados com URIs canônicos; snapshots de terminologia viajam com os rule bundles
(ADR-0007).

**F6 — Quarentena, jamais coerção.** Código ou unidade desconhecidos são quarentenados ou
explicitamente representados — nunca coagidos silenciosamente (ADR-0005 M6/M7; §12.2).

**F7 — Writeback aprovado, fluxo a fluxo.** Writeback (escrita da V2 de volta a AMH/
sistema de origem) só existe como fluxo **individualmente aprovado**, com: recurso e
destino nomeados, propósito, mapeamento determinístico e idempotente, validação prévia do
recurso, confirmação humana para escrita de alta consequência, e trilha de auditoria
completa. Nenhum writeback de conteúdo gerado por IA sem revisão humana (§20; ADR-0024).
Nenhum fluxo de writeback está aprovado nesta minuta.

**F8 — SMART/OIDC na exposição.** Onde a V2 expõe FHIR: verificação de metadados de
descoberta, issuer/audience, authorization-code com PKCE para clientes públicos, escopos
de menor privilégio, private-key JWT (ou equivalente aprovado) para backend services,
semântica 401×403 e autorização por recurso além de escopos (§12.2) — reutilizando os
mecanismos dos ADR-0015/ADR-0016 (direções aceitas; minutas a materializar).

**F9 — Bundles com semântica honesta.** Transaction bundles apenas quando atomicidade é
exigida e suportada; distintos de batch; ETags/operações condicionais onde seguro;
validação de todo recurso antes de carga (§12.2).

**F10 — Conformidade como evidência de G5.** Nenhum conector é considerado pronto sem
testes de contrato, semântica, segurança, proveniência, replay, falha, carga,
observabilidade e recuperação contra sistema representativo ou ambiente de conformidade
aprovado (Gate G5).

**Escopo vinculado:** superfícies FHIR/HL7/terminologia/writeback da V2. **Não vincula:**
seleção de servidor/biblioteca FHIR (decisão de implementação com drivers próprios, §3
regra 14), conteúdo clínico de value sets (ADRs clínicos), plataforma (ADR-0019).

## 5. Consequências

- **Positivas:** Gate G5 ganha objeto testável; ADR-0023 herda um alvo canônico único;
  alegações comerciais ficam auditáveis; risco de licenciamento SNOMED confinado a uma
  cláusula explícita.
- **Negativas:** autoria/manutenção contínua de perfis; a cláusula adiada de SNOMED pode
  atrasar bindings de achados; writeback fluxo-a-fluxo é deliberadamente lento.
- **Neutras/estruturais:** o perfil de consumo AMH×V2 vira anexo do contrato de fronteira
  (ADR-0001); a suíte de conformidade vira artefato de CI quando a superfície existir.

## 6. Implicações transversais

| Dimensão | Implicação | Rótulo |
|---|---|---|
| Segurança clínica | F6 impede coerção silenciosa de código/unidade (SAF/HAZ do modelo canônico); writeback F7 exige confirmação humana em alta consequência | INFERENCE |
| Segurança (security) | F8 impõe SMART/OIDC verificado e autorização por recurso; superfície restrita reduz ataque | INFERENCE |
| Privacidade (LGPD, minimização, propósito) | Perfis restritos = minimização estrutural (só campos necessários); writeback com propósito nomeado por fluxo | INFERENCE |
| Interoperabilidade | Núcleo do ADR; perfis versionados + terminologia canônica versionada | SOURCE (§12.2/§12.3) |
| Acessibilidade | Não aplicável diretamente — superfície máquina-a-máquina; terminologia pt-BR de UI é matéria do ADR-0029/ADR-0021 | — |
| Operacional | Suíte de conformidade e vigilância de drift de contrato alimentam ADR-0020 | INFERENCE |
| Custo | Autoria de perfis e eventual licença SNOMED são custos explícitos e rastreáveis | PROPOSAL |
| Migração | ADR-0023 importa legado somente via modelo canônico→perfis daqui; mapeamento determinístico e idempotente preserva replay | INFERENCE |

## 7. Reversibilidade, gatilhos de revisita e rollback

**Reversibilidade:** alta enquanto não houver consumidor externo dos perfis; após
publicação, mudanças seguem a política de compatibilidade do ADR-0012. Encalhado em
reversão: perfis autorados e suíte de conformidade.

| # | Gatilho de revisita | Detecção | Ação |
|---|---|---|---|
| T1 | Decisão de licenciamento SNOMED (qualquer sentido) | Registro de decisão do titular | Fechar a cláusula adiada F5; rever bindings |
| T2 | Contrato AMH×V2 materializado divergir dos perfis de consumo | Testes de conformidade G5 | Reconciliar perfil ou contrato; nunca coerção |
| T3 | Primeiro pedido real de writeback | Solicitação registrada | Instanciar F7 (aprovação fluxo a fluxo) antes de qualquer escrita |
| T4 | Publicação de perfil a consumidor externo | Release | Ativar política de compatibilidade/deprecação (ADR-0012) |

**Kill/rollback:** writeback tem kill switch por fluxo (desativação sem redeploy);
consumo AMH degrada conforme DOM-0007/ADR-0020; perfis expostos seguem deprecação
governada, nunca remoção silenciosa.

## 8. Validação

| # | Alegação | Método | Vínculos |
|---|---|---|---|
| V1 | Perfis restritos rejeitam recurso não conforme | Testes de contrato/validação por perfil (red/green) | TST: pendente de arquitetura de teste |
| V2 | Código/unidade desconhecidos vão a quarentena | Vetores sintéticos de quarentena (ADR-0005 M6) | TST: pendente; HAZ: hazard-log |
| V3 | Writeback exige aprovação + confirmação humana | Teste negativo: fluxo não aprovado é recusado | TST: pendente; REQ: pendente de catálogo |
| V4 | Conformidade G5 executável | Suíte contra ambiente de conformidade nomeado | VAL: pendente (exige ambiente AMH) |

## 9. Supersessão

- **Supersede:** nenhum. **Superseded por:** nenhum.
- Relações: consome ADR-0001/0005/0006/0012; alimenta ADR-0023; terminologia embarcada
  segue ADR-0007 (snapshots em rule bundles).
