---
doc_id: API-EVENTS-MCP-INDICE-CONTRATOS
status: PROPOSAL
owner: UNASSIGNED — VALIDAÇÃO NECESSÁRIA
source: >
  packages/contratos/openapi.yaml (fonte de verdade real, fatia SPR-G7-2);
  packages/persistencia/src/migrations/0001_init.sql e
  repositories/clinical-repository.ts (outbox real, OBSERVADO);
  docs/06-architecture/adrs/ADR-0010, ADR-0012, ADR-0013, ADR-0014 (accepted —
  direção GDEC-0016, minutas materializadas em construção GDEC-0015);
  docs/08-interoperability/amh-data/contract-v1/ (contrato de fronteira AMH,
  não reescrito aqui); INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §16 (diretório
  designado); mapa-de-projeto-ate-producao.md, item SPR-G4-4
date_collected: 2026-08-16
collector: especialista de publicação de contratos como documentação (SPR-G4-4, ciclo 6)
last_updated: 2026-08-16
---

# Índice de contratos — API, eventos, MCP e FHIR (fatia SPR-G7-2)

PREMISSA (reversível, GDEC-0015/0017): este índice cataloga os contratos que
já existem como artefato real nesta fatia, e distingue explicitamente do que
é apenas plano/política operacional ainda não implementado. Nenhuma alegação
de efetividade clínica, conformidade regulatória ou segurança comprovada é
feita por este documento. Nenhum dado real foi acessado na sua redação —
apenas código-fonte e ADRs deste repositório.

## 1. Propósito e regra de leitura

Este documento **não é** uma decisão nem um contrato em si — é um índice.
Para cada superfície de interoperabilidade da V2 (REST/eventos, MCP, FHIR),
ele diz: (a) o que existe de fato hoje, com caminho de arquivo exato; (b) a
versão e o estado do artefato; (c) onde vive a fonte de verdade; (d) o que é
apenas plano ou política, ainda sem implementação. Nada aqui inventa uma
interface que não existe em código ou em ADR aceito (regra não-negociável
"nunca fabricar interface").

## 2. Contrato REST — `packages/contratos/openapi.yaml`

| Campo | Valor |
|---|---|
| Formato | OpenAPI 3.1, contract-first |
| Versão do documento | `0.1.0` (campo `info.version` do YAML) |
| Fonte de verdade | `packages/contratos/openapi.yaml` — **este documento não a duplica nem a reescreve** |
| Estado | PROPOSAL — cobre a fatia sintética SPR-G7-2; implementado em `apps/api` (ver §2.2) |
| Convenções seguidas | ADR-0009 (máquina de `WorkItem`, aceita GDEC-0008), ADR-0011 (projeções/tempo real, aceita GDEC-0008), leitura do prompt §12.1; ADR-0012 (versionamento/erro/idempotência/paginação) segue `not-started` no ciclo de vida formal — este contrato **não é** aquela decisão, é a aplicação das convenções já aceitas mais a minuta ADR-0012 §5.2 (ver §5 abaixo) |
| Idioma | pt-BR (descrições, exemplos, `title`/`detail` de erro) |
| Dados de exemplo | 100% sintéticos, marcador `SYNTH-` (GDEC-0014) |

### 2.1 Rotas publicadas (OBSERVADO — lidas do YAML)

| Rota | Método | `operationId` | Tag | Autenticação |
|---|---|---|---|---|
| `/v1/healthz` | GET | `obterSaude` | `saude` | nenhuma |
| `/v1/ingestao/observacoes` | POST | `ingerirObservacoes` | `ingestao` | `bearerSyntheticStub` |
| `/v1/projecoes/grade-leitos` | GET | `obterGradeLeitos` | `projecoes` | `bearerSyntheticStub` |
| `/v1/pacientes/{pacienteRef}/avaliacoes` | GET | `obterAvaliacoesPaciente` | `pacientes` | `bearerSyntheticStub` |
| `/v1/alertas/{id}/reconhecer` | POST | `reconhecerAlerta` | `alertas` | `bearerSyntheticStub` |
| `/v1/eventos/stream` | GET | `obterFluxoEventos` | `eventos` | `bearerSyntheticStub` |

### 2.2 Implementação (OBSERVADO)

`apps/api` (Fastify 5 + zod, PREMISSA PRE-04/PRE-05) implementa as seis
rotas acima sobre um armazenamento **em memória**, explicitamente marcado
`// INTEGRAÇÃO PENDENTE (fatia)` em `apps/api/src/store.ts` — não é
`packages/persistencia` (que implementa o outbox/RLS/auditoria reais, ver
§4). O núcleo de avaliação clínica em `apps/api/src/avaliacao.ts` é
inteiramente local, inventado e ilustrativo (três parâmetros, limiares sem
validação clínica) — não é `packages/kernel-clinico`.

### 2.3 Pendências declaradas no próprio contrato (`x-pendencias`, OBSERVADO)

1. `GET /v1/eventos/stream` entrega apenas replay de backlog por cursor
   (ADR-0011 P4); push contínuo em conexão aberta (ADR-0011 P3/P5/P6) não
   está implementado nesta fatia.
2. `packages/persistencia` (outbox real, ADR-0010), `packages/kernel-clinico`
   e a camada de persistência não estão conectados a `apps/api` nesta fatia.
3. Autenticação é um stub sintético sem verificação criptográfica (ADR-0015
   `not-started`).

## 3. Contrato de eventos (outbox) — estado atual e AsyncAPI

**Não existe hoje um documento AsyncAPI formal.** O que existe:

| Artefato | Estado | Onde vive |
|---|---|---|
| Tabela `outbox_events` + funções de gravação transacional (ADR-0010 Opção A) | OBSERVADO, implementado | `packages/persistencia/src/migrations/0001_init.sql`, `src/repositories/clinical-repository.ts` |
| Relay/publicador que leria o outbox e publicaria externamente (ADR-0010 B9/B10) | NÃO IMPLEMENTADO | — (nenhum arquivo) |
| Log de eventos em memória exposto via `GET /v1/eventos/stream` (`EventoFluxo`) | OBSERVADO, implementado — **não é o outbox real**, ver `catalogo-de-eventos.md` §2 | `apps/api/src/store.ts`, tipo em `packages/contratos/src/index.ts` |
| Documento AsyncAPI formal | NÃO EXISTE | pendência — `catalogo-de-eventos.md` (este diretório) é a semente |

O `catalogo-de-eventos.md` deste diretório documenta, evento a evento, o que
foi OBSERVADO nas duas superfícies acima, com escopo de ordenação, payload,
garantias de entrega e consumidores conhecidos — como semente para uma
futura especificação AsyncAPI contract-first, no mesmo espírito de
`openapi.yaml`. A publicação formal em AsyncAPI é pendência registrada, não
uma decisão deste índice.

## 4. Exposição MCP

**Nenhuma superfície MCP existe implementada** em `apps/` ou `packages/`
nesta fatia (confirmado por busca no código-fonte: nenhuma referência a MCP
fora de documentação e ADR-0014). O que existe é a política aceita em
direção (ADR-0014, GDEC-0016) — espelhada operacionalmente em
`politica-mcp.md` deste diretório, que também reafirma explicitamente essa
ausência de implementação.

| Artefato | Estado | Onde vive |
|---|---|---|
| ADR-0014 (classes de ferramenta, PHI, auditoria) | accepted (direção GDEC-0016; minuta materializada) — ciclo de vida formal `proposed` em `adr-index.md` | `docs/06-architecture/adrs/ADR-0014-exposicao-mcp-classes-de-ferramenta-phi.md` |
| Espelho operacional | PROPOSAL (este documento) | `politica-mcp.md` (este diretório) |
| Servidor/ferramenta MCP concretos | NÃO EXISTE | — |

## 5. Perfis FHIR R4

**Nenhum perfil FHIR nem código FHIR existe implementado** nesta fatia
(confirmado por busca no código-fonte). O que existe é a direção aceita
(ADR-0013, GDEC-0016) e o plano restrito por recurso em
`perfis-fhir-plano.md` deste diretório.

| Artefato | Estado | Onde vive |
|---|---|---|
| ADR-0013 (perfis restritos, terminologia, writeback) | accepted (direção GDEC-0016; minuta materializada) — ciclo de vida formal `proposed` em `adr-index.md` | `docs/06-architecture/adrs/ADR-0013-perfis-fhir-hl7-terminologia-writeback.md` |
| Plano de perfis por recurso desta fatia | PROPOSAL (este documento) | `perfis-fhir-plano.md` (este diretório) |
| Artefato de perfil FHIR concreto (`StructureDefinition` ou equivalente) | NÃO EXISTE | pendência — F2 (ADR-0013) prevê que viverá em `packages/contratos` quando existir |

## 6. Contrato externo de fronteira AMH×IntensiCare — referência, não reescrita

O contrato de fronteira com a AMH (de onde a V2 **sempre** consome dados,
nunca ingestão direta — ADR-0001) vive em
`docs/08-interoperability/amh-data/contract-v1/` e **não é reescrito aqui**,
por instrução da tarefa. Referência apenas:

| Artefato | Estado | Caminho |
|---|---|---|
| Manifesto de contrato (minuta) | PROPOSAL — `status: DRAFT`, não aceito, não publicado, não pinado | `contract-v1/contract-manifest.draft.yaml` |
| Cláusula de ciclo de vida de identidade + `resolve(ref, as_of)` | PROPOSAL — minuta negociável; seis tipos de evento (`identity.alias.v1`, `.merge.v1`, `.unmerge.v1`, `.restore.v1`, `.reassignment.v1`, `.erasure.v1`) — ver ponto em aberto N-8 sobre divergência cinco×seis | `contract-v1/eventos-ciclo-de-vida-identidade.md` |
| Fixtures sintéticas de validação | OBSERVADO | `contract-v1/fixtures/` |

Nota de fronteira relevante ao §3 acima: o contrato AMH×V2 hoje cobre apenas
o ciclo de vida de **identidade** (PSR) — não cobre ainda o envelope de fatos
clínicos (observações) que a V2 consumiria da lane operacional AMH. Esse é
um gap distinto do outbox interno da V2 (§3) e está fora do escopo de
reescrita desta tarefa; citado aqui apenas para não ser confundido com ele.

## 7. Como cada contrato se referencia (visão de dependência)

| Documento | Consome/depende de | Alimenta |
|---|---|---|
| `openapi.yaml` (real) | ADR-0009, ADR-0011 (aceitas); ADR-0012 (minuta) | `apps/web` (futuro, ADR-0021), `catalogo-de-eventos.md`, `politica-mcp.md` (classe C reusa comandos daqui) |
| `catalogo-de-eventos.md` | ADR-0010 (aceita); outbox real de `packages/persistencia` | futura especificação AsyncAPI |
| `politica-mcp.md` | ADR-0014 (minuta); reusa autorização/idempotência de `openapi.yaml` | ADR-0024 (agentes clínicos, não implementados) |
| `perfis-fhir-plano.md` | ADR-0013 (minuta); ADR-0001 (fronteira AMH, aceita); ADR-0005 (modelo canônico, aceito) | ADR-0023 (importação legada, não implementado) |

## 8. Pendências consolidadas

1. Geração automática de tipos/SDK a partir de `openapi.yaml` não está
   configurada (`packages/contratos/README.md`).
2. Especificação AsyncAPI formal não existe — `catalogo-de-eventos.md` é
   semente, não substituto.
3. Relay do outbox (ADR-0010 B9/B10) não implementado — os eventos reais
   gravados em `outbox_events` não têm publicador nem consumidor nesta
   fatia.
4. `apps/api` não está conectado a `packages/persistencia` — o log de
   eventos que `GET /v1/eventos/stream` serve não é o outbox transacional
   real.
5. Nenhuma superfície MCP ou FHIR concreta existe — apenas política/plano.
6. Ratificação cláusula a cláusula das minutas ADR-0012/0013/0014 pelo
   titular permanece um ato humano futuro e separado (GDEC-0016 aceitou
   apenas a direção em lote).

## 9. Autoverificação

Nenhuma interface foi inventada — toda rota, evento e tabela citada acima
foi lida diretamente de `packages/contratos/openapi.yaml`,
`packages/persistencia/src/migrations/0001_init.sql`,
`packages/persistencia/src/repositories/clinical-repository.ts` ou
`apps/api/src/*.ts` antes de ser citada. Nenhum ADR foi promovido a
`accepted`/`DECIDED` no front matter deste arquivo. Nenhum dado real, CPF
formatado ou PSR real aparece neste documento.
