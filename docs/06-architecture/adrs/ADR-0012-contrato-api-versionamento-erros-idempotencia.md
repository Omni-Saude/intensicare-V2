---
id: ADR-0012
title: Contrato de API pública — versionamento, modelo de erro, idempotência, paginação e política de compatibilidade
status: PROPOSAL
status_history:
  - status: PROPOSAL
    date: 2026-08-16
    by: especialista de contrato de API (ciclo 6, construção)
    note: >
      ID reservado como not-started em adr-index.md §3. Minuta redigida agora,
      materializando a DIREÇÃO já aceita pelo titular em GDEC-0016 (aceite em lote
      dos 13 not-started) sob o regime de construção GDEC-0013/0015/0017. Este
      arquivo NÃO eleva o status de ciclo de vida da ADR além de proposed — apenas
      documenta e detalha, em minuta compacta, a direção já aceita. Ver §5 sobre a
      distinção entre "direção aceita" e "minuta ratificada cláusula a cláusula".
date: 2026-08-16
owner: UNASSIGNED — VALIDAÇÃO NECESSÁRIA
approvers:
  - UNASSIGNED — VALIDAÇÃO NECESSÁRIA   # papel candidato: AUTH-PRODUCT (adr-index.md §3)
decision_deadline: NÃO DEFINIDO — VALIDAÇÃO NECESSÁRIA
deciding_authority_rule: >
  docs/00-governance/decision-rights.md §2, linha "Decisões de arquitetura
  (ratificação de ADR)": AUTH-PRODUCT ratifica cláusula a cláusula. GDEC-0016
  aceitou a DIREÇÃO desta ADR em lote; a ratificação formal, cláusula a cláusula,
  do texto normativo §5.2 abaixo permanece um ato humano separado e futuro.
independence_check: >
  O autor é preparador, não aprovador (decision-rights.md §3). Quem vier a deter o
  pipeline de build/deploy (ADR-0022) não pode ser o único aprovador de uma mudança
  de política de compatibilidade que seu pipeline de contract-tests aplicará.
links:
  drivers:
    domain_invariants: [DOM-0001, DOM-0005]
    quality_scenarios: [QAS-0021, QAS-0013, QAS-0028]
    risks: ["IDs pendentes no registro de riscos"]
  constrains:
    requirements: ["REQ: catálogo de requisitos pendente"]
    clinical: ["CLR: não aplicável — esta ADR não vincula conteúdo clínico"]
    safety: ["SAF: nenhuma referência direta — ver ADR-0009 W2 para idempotência de comando clínico"]
  hazards: [HAZ-0009, HAZ-0028]
  tests: ["TST: arquitetura de testes pendente"]
  validations: ["VAL: backlog de validação pendente"]
  adrs:
    depends_on: [ADR-0009, ADR-0011]
    feeds: [ADR-0013, ADR-0014, ADR-0021]
  gates: [G4]
  evidence:
    - INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §12.1
    - docs/06-architecture/adrs/ADR-0009-maquina-de-estados-alerta-item-de-trabalho.md §5.2 (W2)
    - docs/06-architecture/adrs/ADR-0010-backbone-transacao-outbox-eventos-garantias-de-entrega.md §5.2 (B2, B8)
    - docs/06-architecture/adrs/ADR-0011-projecoes-de-leitura-e-entrega-tempo-real-autorizada.md §5.2 (P4, P8)
supersedes: null
superseded_by: null
provenance:
  source_repo: intensicare-V2
  path_or_url: docs/06-architecture/adrs/ADR-0012-contrato-api-versionamento-erros-idempotencia.md
  commit_sha_or_version: 33c749a (HEAD do repositório no momento da redação)
  section_or_lines: >
    INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §12.1 (linhas 957-964); adr-index.md §3
    linha ADR-0012, §4.1 linha ADR-0012; GDEC-0016/GDEC-0017
    (docs/00-governance/registers/decision-register.md)
  date_collected: 2026-08-16
  collector: especialista de contrato de API (ciclo 6, construção)
  transformation: reasoned-from
  confidence: medium
  owner: UNASSIGNED — VALIDAÇÃO NECESSÁRIA
  validation_status: VALIDAÇÃO NECESSÁRIA
---

# ADR-0012 — Contrato de API pública: versionamento, modelo de erro, idempotência, paginação, compatibilidade

> **Status: accepted (direção GDEC-0016; minuta materializada em construção —
> GDEC-0015).** O titular aceitou, em lote (GDEC-0016, 2026-08-16), a *direção*
> deste tópico entre os treze `not-started`. Esta minuta **materializa** essa
> direção em cláusulas concretas para permitir construção imediata (regime
> GDEC-0013/0015/0017: aceite de ADR não é mais pré-condição de implementação).
> Ela não é, em si, uma ratificação cláusula a cláusula pelo titular — nenhum
> agente pode escrever esse ato (`decision-rights.md` §1.2). O ciclo de vida
> formal desta ADR permanece `proposed` em `adr-index.md` até revisão humana
> explícita da minuta abaixo.

## 1. Contexto e enunciado do problema

SOURCE (prompt §12.1, linhas 957-964): publicar contratos OpenAPI/AsyncAPI
versionados antes da implementação; usar semântica estável de recurso/comando,
problem details tipados, IDs de correlação/causalidade, autorização por
tenant/recurso, chaves de idempotência, concorrência otimista, paginação/cursores
e regras de depreciação; definir semântica de entrega honestamente; incluir testes
de evolução de esquema e compatibilidade de consumidor; jamais expor texto de
exceção interna ou PHI em erros.

INFERENCE (de ADR-0009 §5.2 W2/W6 e ADR-0011 §5.2 P4/P8, ambas aceitas): a
máquina de estados de alerta/item de trabalho já exige idempotência por comando e
publicação transacional; as projeções já exigem cursores de retomada e
reconciliação por polling. **O contrato público é a superfície que expõe essas
garantias a clientes externos** — sem uma ADR própria, cada endpoint reinventaria
sua própria noção de idempotência, paginação e erro, fragmentando exatamente as
garantias que 0009/0010/0011 acabaram de fixar.

**Pergunta.** Que estratégia de versionamento, modelo de erro, mecanismo de
idempotência, esquema de paginação e política de compatibilidade governam a API
pública consumida por `apps/web` (via ADR-0021), pelos conectores FHIR/HL7
(ADR-0013) e por ferramentas MCP (ADR-0014) — de modo que nenhum desses
consumidores precise inventar sua própria semântica?

**Fora de escopo:** perfis FHIR/HL7 (ADR-0013); política de exposição MCP
(ADR-0014); autenticação/sessão (ADR-0015); autorização/isolamento de tenant
(ADR-0016, mecanismo — este ADR apenas exige que toda rota carregue autorização
por tenant/recurso); separação frontend/BFF (ADR-0021, que **consome** este
contrato); tecnologia concreta de framework HTTP (governada como premissa de
construção, não como decisão desta ADR — §2.2).

## 2. Evidência e premissas

### 2.1 Evidência

| # | Rótulo | Declaração | Fonte | Confiança |
|---|---|---|---|---|
| E1 | SOURCE | Publicar OpenAPI/AsyncAPI versionados antes da implementação; erros como problem details tipados; idempotência; paginação/cursores; regras de depreciação. | prompt §12.1 | alta |
| E2 | SOURCE | "At-least-once transport requires idempotent consumers; ordering scope and replay window must be explicit." | prompt §12.1 | alta |
| E3 | SOURCE | "Never expose internal exception text or PHI in errors." | prompt §12.1 | alta |
| E4 | SOURCE | DOM-0005: todo comando é idempotente, concorrência-seguro, autorizado, auditado, publicado transacionalmente. | DOM-invariants.md DOM-0005 | alta |
| E5 | SOURCE | ADR-0009 W2 (aceita): todo comando de transição carrega chave de idempotência própria; reenvio retorna o resultado original sem duplicar efeito. | ADR-0009 §5.2 | alta |
| E6 | SOURCE | ADR-0011 P4/P8 (aceitas): cliente retoma por cursor durável; reconciliação server-authoritative por polling é o caminho de verdade de recuperação. | ADR-0011 §5.2 | alta |
| E7 | SOURCE | ADR-0010 B8 (aceita): "a evolução [do envelope interno] segue a política de compatibilidade do ADR-0012" — este ADR é citado como dependência textual por uma ADR já aceita. | ADR-0010 §5.2 B8 | alta |
| E8 | SOURCE | HAZ-0009/HAZ-0028: chave de idempotência derivada de heurística sobre dados do paciente é precedente negativo; PHI em corpo de erro/log é hazard P0/P1 catalogado. | hazard-log.md; threat-model.md THR-0028 | alta |

### 2.2 Premissas

**PREMISSA (reversível, GDEC-0017):** a stack de construção do backend — Node.js
22 LTS + TypeScript estrito, Fastify 5, validação zod, contrato OpenAPI 3.1
contract-first, erros `application/problem+json` (RFC 9457) redigidos em pt-BR, e
idempotência por cabeçalho `Idempotency-Key` — está registrada em
`docs/06-architecture/premissas-de-construcao.md` pelo agente de scaffold; esta
ADR consome essa premissa como o *como* concreto da direção aceita abaixo, sem
redecidi-la.

| # | Premissa | Por que é necessária | O que a invalida | Titular |
|---|---|---|---|---|
| A1 | O monolito modular (ADR-0002, aceita Opção A) expõe um único processo HTTP externo — não há múltiplos serviços versionando de forma independente ainda. | Simplifica a estratégia de versionamento inicial (um contrato, uma linha de base). | Extração de serviço aceita via ADR de extração (ADR-0002 §5.2). | UNASSIGNED — VALIDAÇÃO NECESSÁRIA |
| A2 | Nenhum consumidor externo de produção existe hoje; os primeiros consumidores são `apps/web` (ADR-0021) e fixtures de teste. | A política de depreciação pode começar permissiva e apertar com consumidores reais. | Primeiro consumidor externo real de produção. | UNASSIGNED — VALIDAÇÃO NECESSÁRIA |

## 3. Direcionadores de decisão

| # | Direcionador | Por que discrimina | Atributo mensurável | Alvo |
|---|---|---|---|---|
| D1 | Semântica estável de recurso/comando | Consumidores (frontend, FHIR, MCP) precisam de contrato previsível para gerar tipos (ADR-0021) | — | n/a — vinculante (E1) |
| D2 | Erro nunca vaza PHI/exceção interna (E3, E8) | Discrimina entre "erro tipado com catálogo pt-BR" e "repassar exceção bruta" | QAS-0028 | Vinculante |
| D3 | Idempotência honesta sob at-least-once (E2, E4, E5) | Discrimina entre chave de idempotência de primeira classe e retry "melhor esforço" | QAS-0021 | Vinculante (DOM-0005) |
| D4 | Paginação/cursor coerente com projeções (E6) | Um esquema de paginação divergente do cursor de ADR-0011 forçaria o cliente a reconciliar dois modelos | — | Vinculante por coerência com ADR-0011 |
| D5 | Compatibilidade declarada e testável (E1, E7) | Testes de contrato consumidor-driven distinguem evolução aditiva de ruptura | QAS-0013 | VALIDAÇÃO NECESSÁRIA (limiares) |
| D6 | Linguagem clínica pt-BR nos erros (GDEC-0006) | Erro em inglês técnico não serve ao clínico nem ao paciente/família em fluxo de exportação | — | Vinculante (política de idioma) |
| D7 | Custo de evolução vs. velocidade de construção | Uma política rígida demais atrasa a fatia G7; uma política ausente reproduz o antipadrão do assessment legado | QAS-0026 | VALIDAÇÃO NECESSÁRIA |

## 4. Alternativas consideradas

### Opção A — Contrato REST+eventos versionado, contract-first, RFC 9457 pt-BR, idempotência por cabeçalho, paginação por cursor (elaboração da direção aceita GDEC-0016)

**Descrição.** OpenAPI 3.1 (REST) e AsyncAPI (eventos externos, se/quando
existirem) publicados e validados em CI **antes** da implementação de cada rota.
Versionamento por prefixo de caminho (`/v1/...`); mudanças aditivas (novo campo
opcional, novo endpoint) não incrementam a versão maior; mudança de ruptura exige
`/v2` com janela de depreciação declarada e cabeçalhos de sunset. Erros seguem RFC
9457 (`application/problem+json`) com `type`, `title`, `status`, `detail` e
`instance` — `title`/`detail` em pt-BR clínico, de um catálogo de erro versionado,
nunca texto de exceção bruto. Todo comando de escrita aceita `Idempotency-Key`
(cabeçalho); reenvio da mesma chave dentro da janela declarada retorna a resposta
original sem duplicar efeito (herda W2/E5). Listagens usam paginação por cursor
opaco (`next_cursor`), coerente com o cursor de retomada de ADR-0011 P4 — o
cliente nunca deriva offset por conta própria. Toda rota carrega autorização por
tenant/recurso resolvida no servidor (nunca aceita de parâmetro de cliente sem
verificação).

**Frente aos direcionadores.** D1 forte (OpenAPI é a fonte única); D2 forte
(catálogo de erro fechado, nunca serialização de exceção); D3 forte (cabeçalho
dedicado, chave derivada da intenção do ator conforme W2); D4 forte (mesmo
vocabulário de cursor que ADR-0011); D5 forte com testes de contrato
consumidor-driven; D6 forte (catálogo de erro é pt-BR desde a primeira entrada);
D7 — custo inicial de manter o contrato sincronizado com a implementação, mitigado
por geração/validação automatizada.

**Consequências positivas.** Um único lugar (o contrato) do qual `apps/web`
(ADR-0021), o gerador de SDK e os testes de contrato derivam; erro nunca é uma
superfície de vazamento de PHI ou de detalhe de implementação; idempotência e
paginação já nascem coerentes com as ADRs de runtime aceitas.

**Consequências negativas.** Disciplina de contract-first tem custo de processo
(o endpoint não existe até o contrato existir); catálogo de erro pt-BR precisa de
manutenção quando novos tipos de falha surgem; versionamento por caminho é menos
elegante que negociação de conteúdo para clientes que preferem um único URI
estável — trade-off aceito por simplicidade operacional.

**O que precisaria ser verdade.** Fastify 5 + zod (premissa §2.2) conseguem gerar
ou validar OpenAPI 3.1 sem duplicação manual de schema; o time aceita o custo de
processo do contract-first.

**Custo de saída.** Baixo-moderado: o modelo de erro e o cabeçalho de idempotência
sobrevivem a qualquer mudança de framework; o que se perde ao reverter é o
tooling específico de geração de contrato.

### Opção B — Versionamento apenas por depreciação de campo, sem URI versionado (estilo GraphQL de esquema único)

**Descrição.** Um único endpoint/esquema; evolução ocorre por adição de campos e
depreciação anotada, nunca por nova versão de URI.

**Frente aos direcionadores.** D1 misto — esquema único simplifica descoberta,
mas comandos com efeito de ruptura semântica (não apenas de campo) não têm um
mecanismo de corte limpo. D4 exige reinventar cursor dentro do esquema de
consulta. D5 depende inteiramente de disciplina de depreciação de campo — sem
governança adicional, é mais fácil introduzir ruptura silenciosa do que na Opção
A.

**Consequências positivas.** Um único contrato para inspecionar; evolução aditiva
é natural.

**Consequências negativas.** Rupturas de semântica de comando (não apenas de
forma de dado) carecem de mecanismo de corte; FHIR/HL7 (ADR-0013) e MCP
(ADR-0014) não se apoiam nativamente nesse modelo, exigindo uma camada de
tradução adicional; menos alinhado à exigência explícita do prompt de "versioned
OpenAPI and AsyncAPI contracts" (E1).

**O que precisaria ser verdade.** Todos os consumidores relevantes (frontend,
FHIR, MCP) preferissem um único esquema de consulta — não evidenciado.

**Custo de saída.** Alto: migrar um esquema único de volta para rotas REST
versionadas exige reprojetar cada consumidor.

### Opção Z — Adiar; cada rota versiona e trata erro à sua maneira até que a pressão de um consumidor externo force uma política

**Descrição.** Nenhuma política de contrato registrada; implementadores decidem
caso a caso.

**Consequências positivas.** Nenhum comprometimento prematuro; a fatia G7 anda
sem esperar o contrato.

**Consequências negativas.** Reproduz precisamente o modo de falha que a §12.1
existe para prevenir: erros heterogêneos (alguns vazando exceção, E3/E8), chaves
de idempotência inconsistentes (contradizendo W2/E5, que já são vinculantes na
máquina de estados aceita), e ADR-0010 B8 fica com uma dependência textual sem
resposta. O primeiro endpoint escrito vira a convenção de fato.

**Custo do atraso.** Cresce rapidamente: cada rota escrita sem esta ADR é uma
migração futura, não uma folha em branco.

### 4.1 Comparação frente aos direcionadores

| Direcionador | A — REST+eventos versionado | B — esquema único | Z — adiar |
|---|---|---|---|
| D1 semântica estável | Forte (contrato explícito) | Misto | Deriva por implementador |
| D2 erro sem PHI | Forte (catálogo fechado) | Depende de disciplina | Não resolvido |
| D3 idempotência | Forte (cabeçalho dedicado) | Possível, não natural | Inconsistente |
| D4 paginação/cursor | Coerente com ADR-0011 | Exige reinvenção | Não resolvido |
| D5 compatibilidade | Testável (contract tests) | Depende de depreciação de campo | Ausente |
| D6 pt-BR | Vinculante desde o catálogo | Possível | Ad hoc |
| D7 custo/velocidade | Custo de processo, mitigável | Menor fricção inicial | Menor custo agora, maior depois |

## 5. Decisão e escopo

**Direção aceita (GDEC-0016, 2026-08-16):** **Opção A** — contrato REST+eventos
versionado, contract-first, modelo de erro RFC 9457 em pt-BR, idempotência por
`Idempotency-Key`, paginação por cursor coerente com ADR-0011. A minuta §5.2 abaixo
é a materialização concreta dessa direção, redigida sob o regime de construção
(GDEC-0013/0015): **não é pré-condição de implementação** que ela seja ratificada
cláusula a cláusula antes de `apps/api` começar a existir — a implementação
prossegue sobre esta minuta como premissa reversível, e qualquer desvio do titular
a substitui.

**Escopo vinculado (enquanto premissa de construção):** todo endpoint HTTP e
evento externo publicado por `apps/api`, em todo tenant e ambiente.

**Não vinculado:** perfis FHIR/HL7 (ADR-0013); tokens/escopos MCP (ADR-0014);
mecanismo de autenticação (ADR-0015); mecanismo de autorização (ADR-0016, apenas
consumido aqui como obrigação, não desenhado aqui).

### 5.1 Condições para ratificação formal (cláusula a cláusula, humana)

| # | Condição | Titular | Evidência que a fecha | Estado |
|---|---|---|---|---|
| C1 | ADR-0016 (autorização/isolamento) com direção registrada — E1 exige "tenant/resource authorization" em toda rota; o mecanismo é de lá. | autoridade do ADR-0016 | ADR-0016 com direção registrada | ABERTA (`not-started`) |
| C2 | Limiares de compatibilidade (janela de depreciação, formato de sunset) — D5/D7 permanecem VALIDATION REQUIRED até Gate G1. | AUTH-PRODUCT | Metas em quality-attribute-scenarios.md deixam de ler VALIDATION REQUIRED | ABERTA |
| C3 | Catálogo de erro pt-BR inicial revisado por terminologia clínica (processo ADR-0029, aceito). | AUTH-CLINSAFETY + AUTH-UX | Glossário de erro ratificado | ABERTA |

### 5.2 Minuta normativa (o que a construção segue sob GDEC-0015/0017)

**K1 — Versionamento por caminho.** Toda rota pública vive sob `/v{N}`; mudança
aditiva não incrementa `N`; mudança de ruptura semântica (remoção/renomeação de
campo obrigatório, mudança de tipo, mudança de efeito de comando) exige `/v{N+1}`
com ambas as versões coexistindo durante a janela de depreciação declarada
(VALIDATION REQUIRED).

**K2 — Modelo de erro RFC 9457 pt-BR.** Todo erro HTTP não-2xx retorna
`application/problem+json` com `type` (URI estável apontando ao catálogo),
`title` e `detail` em pt-BR clínico do catálogo versionado, `status`, `instance`
(ID de correlação) — **nunca** stack trace, mensagem de exceção bruta, ou PHI
(E3/E8; HAZ-0028). Correlação/causalidade (`correlation_id`/`causation_id`)
presentes em toda resposta, sucesso ou erro.

**K3 — Idempotência por cabeçalho.** Todo comando de escrita (POST/PATCH/PUT que
muda estado) aceita `Idempotency-Key`. Reenvio da mesma chave dentro da janela
declarada retorna a resposta original sem duplicar efeito (herda ADR-0009 W2;
DOM-0005). A chave é opaca ao servidor — derivada da intenção do ator no cliente,
**jamais** de heurística sobre dados do paciente (E8, precedente HAZ-0009).

**K4 — Concorrência otimista.** Recursos mutáveis carregam um token de versão
(`ETag`/campo de versão); escrita sem o token corrente retorna conflito explícito
com o estado atual — nunca última-escrita-vence silenciosa (herda ADR-0009 W3).

**K5 — Paginação por cursor.** Toda listagem usa cursor opaco (`next_cursor`),
nunca offset numérico exposto ao cliente. O cursor de listagem e o cursor de
retomada de projeção (ADR-0011 P4) compartilham o mesmo vocabulário conceitual —
não necessariamente o mesmo valor serializado, mas o mesmo contrato de
"retomável até onde o servidor declarar".

**K6 — Filtragem/agregação/autorização server-side.** Nenhum filtro, agregação ou
decisão de autorização é confiado ao cliente (herda regra §3-6 e ADR-0011 P3);
parâmetros de consulta são validados e nunca interpretados como escopo de
autorização.

**K7 — Evolução e testes de compatibilidade.** Todo endpoint carrega teste de
contrato consumidor-driven; mudança que quebre um consumidor registrado falha o
build (E1; QAS-0013). O envelope de evento externo (se/quando existir) segue a
mesma disciplina de versionamento de K1, coerente com a citação textual de
ADR-0010 B8.

**K8 — pt-BR clínico consistente.** Identificadores técnicos (nomes de campo,
`type` de erro) em inglês; todo texto voltado a humano (`title`, `detail`,
mensagens de validação) em pt-BR, sujeito ao processo de validação terminológica
do ADR-0029.

## 6. Consequências

### 6.1 Positivas

- `apps/web` (ADR-0021), conectores futuros (ADR-0013/0014) e testes de contrato
  compartilham uma única fonte de verdade de forma e erro.
- A dependência textual que ADR-0010 B8 já registra ("a evolução segue a política
  de compatibilidade do ADR-0012") deixa de ser uma citação a um documento
  inexistente.
- Nenhum erro tipado pode carregar PHI por construção do catálogo fechado (K2).

### 6.2 Negativas

- Disciplina contract-first é custo de processo real na fatia G7 inicial —
  aceito como premissa de construção (GDEC-0017), não como decisão isenta de
  custo.
- Limiares de depreciação e janela de idempotência permanecem `VALIDATION
  REQUIRED` (D5/D7) — a autoridade decidirá com drivers não quantificados até
  Gate G1.

### 6.3 Neutras/estruturais

- Nada aqui seleciona banco de dados, broker ou provedor de nuvem — essas
  decisões pertencem a ADR-0019/ADR-0022.

## 7. Implicações transversais

| Dimensão | Implicação | Rótulo | Papel titular | ID de acompanhamento |
|---|---|---|---|---|
| Segurança clínica | Idempotência (K3) evita duplicação de comando clínico sob retry; concorrência otimista (K4) evita última-escrita-vence silenciosa sobre ação humana registrada (herda ADR-0009 W2/W3). | INFERENCE de E4, E5 | AUTH-CLINSAFETY | HAZ-0009 |
| Segurança (security) | Erro nunca vaza exceção/PHI (K2); toda rota exige autorização por tenant/recurso resolvida no servidor (K6) — mecanismo em ADR-0016. | INFERENCE de E3, E8 | AUTH-SECURITY | HAZ-0028; ADR-0016 |
| Privacidade (LGPD, minimização) | Catálogo de erro fechado é, ele mesmo, um controle de minimização — nenhuma superfície de erro pode "vazar por acidente" um campo clínico não previsto. | INFERENCE | AUTH-PRIVACY-LEGAL (não nomeado) | QAS-0028 |
| Interoperabilidade | FHIR (ADR-0013) e MCP (ADR-0014) consomem este contrato ou o citam por referência — nenhum reimplementa versionamento/erro próprio. | SOURCE (adr-index §4.1) | AUTH-DATA-PLATFORM | ADR-0013, ADR-0014 |
| Acessibilidade | Mensagens de erro pt-BR (K2/K8) são a matéria-prima que ADR-0021 anuncia a tecnologia assistiva — um catálogo tecnicamente correto mas clinicamente confuso propaga a falha à UI. | INFERENCE | AUTH-UX | ADR-0021 |
| Operacional | Contract tests em CI (K7) e cabeçalhos de depreciação são deveres operacionais de primeira classe desde o primeiro endpoint. | INFERENCE | AUTH-OPERATIONS | ADR-0022 |
| Custo | Nenhum modelo de custo existe; o custo de processo do contract-first é qualitativo (D7), não quantificado. | VALIDAÇÃO NECESSÁRIA | AUTH-PRODUCT | pendente |
| Migração | Janela de depreciação (K1) é o mecanismo pelo qual qualquer ruptura futura migra consumidores sem corte abrupto. | INFERENCE | AUTH-PRODUCT | pendente |

## 8. Reversibilidade, gatilhos de revisita, kill/rollback

### 8.1 Avaliação de reversibilidade

| Opção | Reversibilidade | O que fica encalhado | Rótulo |
|---|---|---|---|
| A | Alta para refinar cláusulas (K1-K8 são independentes); moderada para trocar framework HTTP (Fastify é premissa, não decisão desta ADR) | Nomes de rota e catálogo de erro já publicados a consumidores externos | INFERENCE |
| B | Baixa — migrar de esquema único para REST versionado exige reprojetar consumidores | Contratos de consulta existentes | INFERENCE |
| Z | n/a — custo de opção crescente | n/a | INFERENCE |

### 8.2 Gatilhos de revisita

| # | Gatilho | Detecção | Notifica | Ação |
|---|---|---|---|---|
| T1 | Primeiro consumidor externo real de produção (fora `apps/web`/fixtures) | Registro de integração | AUTH-PRODUCT | Fechar C2 com limiares reais em vez de VALIDATION REQUIRED |
| T2 | ADR-0016 aceita | Registro de decisão | autoridade desta ADR | Fechar C1; conferir K6 contra o mecanismo real |
| T3 | Teste de contrato consumidor-driven falha em CI por mudança não versionada | Pipeline CI | AUTH-OPERATIONS | Bloquear merge; corrigir K1/K7 |
| T4 | Ratificação humana formal desta minuta (fora do regime de construção) | Registro de decisão | AUTH-PRODUCT | Promover status de `proposed` a `under-review`/`accepted` em adr-index.md |

### 8.3 Kill switch / rollback

Nada a desligar em `proposed`/construção. Restrição permanente: nenhuma rota pode
ir a produção sem K2 (erro sem PHI) e K3 (idempotência) implementados e testados —
uma rota que viole isso é defeito bloqueante de revisão, não variação aceitável.

## 9. Método de validação e evidência vinculada

| # | Alegação | Método de validação | Ambiente | IDs vinculados |
|---|---|---|---|---|
| V1 | Reenvio da mesma `Idempotency-Key` não duplica efeito. | Teste de integração: enviar comando duas vezes, afirmar efeito único. | Teste (sintético) | DOM-0005; QAS-0021; HAZ-0009 |
| V2 | Nenhuma resposta de erro contém PHI ou texto de exceção bruto. | Teste automatizado contra fixtures sintéticas de erro + revisão de catálogo. | CI + teste | QAS-0028; HAZ-0028 |
| V3 | Mudança de ruptura sem incremento de versão falha o build. | Teste de contrato consumidor-driven com fixture deliberadamente rompida. | CI | QAS-0013 |
| V4 | Cursor de listagem é retomável dentro da janela declarada. | Teste de paginação sobre dataset sintético. | Teste | ADR-0011 P4 |

## 10. Relações de supersessão

- **Supersede:** nenhuma.
- **Superseded by:** nenhuma.
- **Notas de relação:** materializa a dependência textual já registrada em
  ADR-0010 §5.2 B8 ("a evolução segue a política de compatibilidade do
  ADR-0012"). Ratificação humana futura desta minuta não supersede este arquivo —
  apenas eleva seu status em `adr-index.md`.

## 11. Autoverificação contra o gate de completude do template

Campos de identidade presentes; três alternativas (A/B/Z) com consequências
positivas e negativas honestas; direcionadores mapeados a QAS existentes;
**nenhum limiar numérico inventado** (D5/D7, K1 janela ficam VALIDATION
REQUIRED); oito linhas transversais presentes; reversibilidade, gatilhos e
kill/rollback presentes; validação com IDs reais; supersessão declarada;
**nenhuma tecnologia de infraestrutura selecionada além da premissa de
construção já registrada por outro agente** (Fastify/zod/OpenAPI citados como
premissa GDEC-0017, não como decisão desta ADR); nenhuma aprovação fabricada;
`adr-index.md` **não** foi tocado por este autor (fora do escopo de escrita desta
tarefa) — atualização de índice é trabalho de integração posterior.
