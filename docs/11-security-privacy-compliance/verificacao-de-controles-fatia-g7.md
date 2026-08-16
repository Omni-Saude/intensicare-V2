---
id: SEC-VERIF-FATIA-G7
title: Verificação por teste dos controles de segurança e segurança clínica na fatia sintética G7
label: PROPOSAL
status: PROPOSAL
statement: >
  Relato honesto e parcial de quais controles SEC-*, SAF-* e HAZ-* a fatia vertical
  sintética G7 (apps/api + packages/persistencia, commit 87798af) consegue verificar
  ADVERSARIALMENTE hoje, e quais ela NÃO consegue verificar e por quê. Quarenta testes
  adversariais foram acrescentados em dois arquivos novos. Três achados foram registrados,
  um deles de alta prioridade (ACHADO-01: o rebaixamento de papel do banco é reversível na
  mesma conexão, o que anula a RLS diante de um adversário no processo). Este documento NÃO
  fecha nenhum THR-*, SAF-*, SEC-* ou HAZ-*, NÃO fecha o Gate G6 e NÃO constitui aceite de
  risco residual.
provenance:
  source_repo: intensicare-V2
  path_or_url: docs/11-security-privacy-compliance/verificacao-de-controles-fatia-g7.md
  commit_sha_or_version: 0c9e04ad7b1327d927c407326e3098af7f12824f (fatia verificada — 87798af)
  section_or_lines: documento inteiro
  date_collected: 2026-08-16
  collector: agente especialista em verificação de controles de segurança e segurança clínica (ciclo 6, SPR-G6-2 parcial)
  transformation: >
    Controles inventariados a partir de docs/05-clinical-safety/safety-requirements.md,
    docs/11-security-privacy-compliance/threat-model.md e
    docs/11-security-privacy-compliance/security-controls-catalog.md; verificação executada
    por testes adversariais escritos contra o código da fatia (leitura prévia integral de
    apps/api/src/*.ts, packages/persistencia/src/**/*.sql e *.ts) e executados com vitest
    contra PGlite em memória, com dados 100% sintéticos.
  confidence: high
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
links:
  requirements: [SAF-0001, SAF-0002, SAF-0006, SAF-0007, SAF-0008, SAF-0010, SAF-0013, SAF-0017, SAF-0023, SAF-0026, SAF-0028, SEC-0001, SEC-0003, SEC-0009, SEC-0010, SEC-0015, SEC-0021, SEC-0023, SEC-0026, SEC-0027, SEC-0032]
  hazards: [HAZ-0005, HAZ-0013, HAZ-0023, HAZ-0028, HAZ-0035]
  adrs: [ADR-0003, ADR-0005, ADR-0009, ADR-0010, ADR-0011, ADR-0015, ADR-0016]
  tests: [apps/api/src/seguranca.test.ts, packages/persistencia/src/seguranca.test.ts]
  pr: null
supersedes: null
superseded_by: null
---

# Verificação de controles na fatia sintética G7

## 1. O que este documento é — e, sobretudo, o que ele NÃO é

**É:** o relato de uma campanha de testes **adversariais** (não testes felizes) executada
contra a fatia vertical sintética G7, dizendo, controle a controle, o que a fatia
**demonstrou** e o que ela **não tem como demonstrar**.

**NÃO é**, e nenhuma leitura em contrário é autorizada por este texto:

1. **Não fecha nenhum `THR-*`.** Os 27 achados P0 e os demais P1 do
   `threat-model.md` permanecem **OPEN**. Nenhuma linha deste documento pode ser citada como
   fechamento ou aceite de ameaça.
2. **Não fecha nenhum `SAF-*`, `SEC-*` ou `HAZ-*`.** Os controles seguem
   `PROPOSAL · NOT-IMPLEMENTED` no catálogo até que a autoridade humana nomeada diga o
   contrário; os perigos seguem `OPEN` no `hazard-log.md`.
3. **Não fecha o Gate G6, nem o aproxima formalmente.** G6 exige (a) verificador **terceiro
   independente** — papel `AUTH-SECURITY`, hoje detido interinamente e apenas para a fase de
   projeto (**DEC-G0-02**) — e (b) **aceite humano nominal** de risco residual (**MG-G6**).
   Nenhuma das duas condições é satisfeita por testes escritos e executados por um agente.
4. **Não é evidência independente.** `SEC-0009` exige, na sua própria cláusula de
   verificação, *"uma campanha adversarial multi-tenant realizada por alguém que não
   implementou o isolamento"*. Quem escreveu estes testes não implementou a fatia — mas é
   parte do mesmo programa de agentes e do mesmo contexto de construção. Isso **não** é a
   independência que `SAF-0037` e `DEC-G0-02` exigem.
5. **Não é pentest.** Nenhuma superfície de rede real, nenhum ambiente *production-like*,
   nenhum fuzzing, nenhuma análise de canal lateral (timing) foi executada.

**Rótulo do documento:** `PROPOSAL`. Nenhum agente pode promovê-lo a `DECIDED`
(`evidence-notation.md` §2 regra 3).

## 2. O que foi verificado, como e onde

| Item | Valor |
|---|---|
| Fatia sob teste | `apps/api` (Fastify 5, rotas `/v1/*`, stub de autenticação) + `packages/persistencia` (PGlite, RLS por tenant, outbox transacional, auditoria append-only), commit **87798af** |
| Arquivos de teste acrescentados | `apps/api/src/seguranca.test.ts` (novo), `packages/persistencia/src/seguranca.test.ts` (novo) |
| Testes acrescentados | **40** — 20 na API, 20 na persistência |
| Resultado da execução | `@intensicare/api`: **68 passando + 1 falha esperada** (69 testes, 6 arquivos). `@intensicare/persistencia`: **33 passando + 1 falha esperada** (34 testes, 4 arquivos). Antes desta rodada: 49 e 14, respectivamente |
| Falhas esperadas (`it.fails`) | 2 — **ACHADO-01** e **ACHADO-02** (§5): controles que a fatia **não** sustenta, deixados mecanicamente visíveis em vez de silenciados |
| Gates documentais | `scripts/check_doc_conventions.py` e `scripts/check_forbidden_content.py` verdes |
| Dados | 100% sintéticos, marcador `SYNTH-` (GDEC-0014); nenhum PSR real, nenhum CPF |
| Ambiente | PGlite 0.5.5 em memória, `app.inject()` do Fastify (sem porta de rede real) |

Natureza adversarial dos testes: token ausente, malformado, com esquema errado, sem tenant,
sem ator, com segmento extra e com JWT `alg=none`; tenant declarado pelo chamador em
cabeçalho, query, `Host` e cabeçalho de "bypass"; identificadores reais da vítima usados por
outro tenant (sondagem IDOR) em nove tabelas; escrita marcada com o `tenant_id` da vítima em
seis tabelas; reuso de `Idempotency-Key` entre tenants; `TRUNCATE`, `DROP TRIGGER`,
`DISABLE ROW LEVEL SECURITY` e reescalada de papel; falha por violação de restrição no meio
da transação; dez formas distintas de observação malformada; e leitura de sete corpos de erro
em busca de SQL, nome de tabela, texto de exceção ou conceito clínico.

## 3. Controles VERIFICADOS na fatia

Leitura da coluna "veredito": **VERIFICADO NA FATIA** significa *"o comportamento afirmado
pelo controle foi exercitado adversarialmente e resistiu, dentro do escopo sintético"* —
não significa "controle implementado", "controle aceito" nem "ameaça fechada".

| Controle | O que exige | Como foi verificado (arquivo::teste) | Veredito | Evidência residual necessária para G6 |
|---|---|---|---|---|
| **SEC-0001** / **SAF-0007** (fail-closed, contexto derivado do servidor) | Contexto de tenant nunca vem de valor do chamador; ausente/inverificável ⇒ falha fechada, sem resultado parcial nem tenant padrão | `packages/persistencia/src/seguranca.test.ts::"SEC-0001/SAF-0007 — sem contexto de sessão, NENHUMA tabela clínica devolve linha"`; `::"SEC-0001 — sem contexto de sessão, a ESCRITA também é negada (WITH CHECK)"`; `apps/api/src/seguranca.test.ts::"SEC-0001/THR-0001 — tenant declarado pelo CHAMADOR ... é ignorado"` | **VERIFICADO NA FATIA (parcial)** — o *lado servidor* resiste: 13 tabelas devolvem zero linhas sem contexto, a escrita é negada, e 5 vetores de tenant fornecido pelo chamador não movem a fronteira | A metade **"derivado de identidade verificada"** está NÃO VERIFICADA: o token é stub sem verificação criptográfica (ver §4, SEC-0004). Exige ADR-0015/ADR-0016 implementados + pentest aceito por verificador independente |
| **SEC-0009** / **SAF-0008** (isolamento no armazenamento, com evidência adversarial) | Propriedade de tenant imutável em toda linha, imposta pela camada de armazenamento, sem método de repositório sem escopo | `packages/persistencia/src/seguranca.test.ts::"SEC-0009/SAF-0008 — dentro do tenant A, gravar linha marcada com o tenant de B é negado ..."`; `::"SEC-0003/SEC-0009 — sondagem IDOR ..."`; `::"SEC-0009/SAF-0008 — ESCRITA cross-tenant por id conhecido não afeta nenhuma linha ..."`; `::"SEC-0009/SEC-0010/SAF-0008 — fitness de esquema ..."`; `apps/api/src/seguranca.test.ts::"SEC-0009/SAF-0008 — ingestão do intruso contra encontro/leito/paciente do G7 ..."` | **VERIFICADO NA FATIA (com ressalva grave)** — contra o *código de aplicação*: leitura e escrita cross-tenant negadas em 6–9 tabelas; toda tabela do esquema tem `tenant_id`, RLS **habilitada e forçada** e política | **Ressalva: ACHADO-01** (§5) — contra um adversário *no processo* o isolamento não se sustenta. G6 exige campanha adversarial por terceiro independente, em Postgres real, incluindo caches, projeções, tópicos, exportações, códigos de erro **e timing** |
| **SEC-0003** (menor privilégio por instância de recurso) | Autorização decidida por recurso, não por rota; sondagem IDOR deve falhar | `packages/persistencia/src/seguranca.test.ts::"SEC-0003/SEC-0009 — sondagem IDOR: id de recurso do tenant A ... devolve zero linhas"`; `apps/api/src/seguranca.test.ts::"SEC-0003/SEC-0009 — paciente de OUTRO tenant devolve resposta indistinguível de paciente inexistente"`; `::"SEC-0009/SAF-0017 — reconhecer alerta de OUTRO tenant devolve 404 e não altera o alerta da vítima"` | **VERIFICADO NA FATIA (parcial)** — sem oráculo de enumeração (mesmo `title`/`detail`/`status` para "existe noutro tenant" e "não existe"); nove tabelas sondadas por id conhecido | Não há papéis, escopos nem propósito-de-uso na fatia: a autorização é binária (tenant). Exige modelo de papel/propósito (ADR-0016) e **teste de mutação sobre a política de autorização** (`PROMPT:793`) |
| **SEC-0010** (nenhuma capacidade de correspondência cross-tenant) | Nenhuma tabela, índice ou chave atravessando tenants | `packages/persistencia/src/seguranca.test.ts::"SEC-0009/SEC-0010/SAF-0008 — fitness de esquema ..."` | **VERIFICADO NA FATIA (parcial)** — nenhuma tabela sem `tenant_id`; nenhuma estrutura de correspondência existe no esquema | Só cobre o esquema desta fatia. O índice cross-PJ é da AMH e está *gated* por parecer DPO/jurídico (ADR-0004 D-02) — fora do alcance de qualquer teste da V2 |
| **SEC-0032** / **SAF-0023** (auditoria append-only, cobrindo leituras) | Registro append-only e **à prova de adulteração** de toda leitura, mudança, decisão e ação | `packages/persistencia/src/seguranca.test.ts::"SEC-0032/SAF-0023 — UPDATE é bloqueado em TODA tabela append-only"`; `::"... DELETE é bloqueado ..."`; `::"SEC-0032 — TRUNCATE não é barrado pelo gatilho ... mas sim pela ausência de privilégio"`; `::"SEC-0032 — o papel de aplicação não pode remover nem desabilitar o gatilho ..."`; `::"SEC-0032 — a auditoria registra a RECUSA, não só o sucesso"` | **VERIFICADO NA FATIA — apenas a metade "append-only"** | A metade **"tamper-evident"** está **NÃO VERIFICADA e não implementada**: `packages/persistencia/src/seguranca.test.ts::"um adversário com o papel de tabela desliga o gatilho, altera a auditoria e RELIGA — e nada nos dados denuncia"` prova que não existe cadeia de hash, assinatura nem WORM. G6 exige evidência de adulteração detectável + exportação íntegra |
| **SEC-0023** / **SAF-0015** (durabilidade precede entrega — outbox transacional) | Efeito e evento na MESMA transação; nunca fato sem evento, nunca evento órfão | `packages/persistencia/src/seguranca.test.ts::"SEC-0023 — falha por VIOLAÇÃO DE RESTRIÇÃO depois da gravação clínica reverte fato E evento"`; `::"SEC-0023 — evento publicado e transação abortada em seguida NÃO deixa evento órfão"` | **VERIFICADO NA FATIA** — a invariante resiste a uma falha de integridade **real** no meio do fluxo (não apenas a um `throw` sintético), nos dois sentidos | Não existe *relay*, broker nem entrega (ADR-0010 B10 fora do escopo). "Durabilidade precede **entrega**" só é verificável quando houver entrega. G6 exige teste de ponto-de-falha entre commit e publicação e prova de alcançabilidade por *polling* |
| **SEC-0027** / **SAF-0017** (concorrência otimista + atribuição obrigatória) | Token de concorrência obrigatório; conflito rejeitado e exposto, nunca *last-write-wins*; ator autenticado registrado | `apps/api/src/seguranca.test.ts::"SEC-0027/SAF-0017 — sem If-Match (428) ou com If-Match não numérico (400) o comando é recusado e nada muda"`; `::"HAZ-0023/SEC-0027 — dois atores com a MESMA versão: o segundo recebe 412 e a atribuição do primeiro é preservada"`; `packages/persistencia/src/seguranca.test.ts::"SEC-0027/SAF-0017 — transição com o tenant ERRADO é conflito explícito, sem efeito, sem auditoria e sem evento"` | **VERIFICADO NA FATIA** — 6 formas inválidas de `If-Match` recusadas; corrida de dois atores preserva o primeiro e audita a recusa do segundo com o ator correto | Falta *rationale* obrigatório por transição, temporizadores de escalonamento e papéis — todos `VALIDATION REQUIRED` por governança clínica (`LEGACY-TA:717`). Falta teste de propriedade de corrida real (dois processos) |
| **SEC-0021** / **SAF-0013** (idempotência canônica e proteção de replay) | Chave durável e cross-process; replays provadamente no-ops; sem vazamento entre escopos | `packages/persistencia/src/seguranca.test.ts::"SEC-0021/SEC-0009 — registro de idempotência de um tenant não é legível por outro"`; `apps/api/src/seguranca.test.ts::"SEC-0021/SEC-0009 — replay de Idempotency-Key de outro tenant não devolve a resposta original da vítima"` | **VERIFICADO NA FATIA (parcial)** — a chave é escopada por tenant pela RLS; colisão de chave entre tenants não vaza o corpo da vítima | A chave é **fornecida pelo chamador**, não derivada canonicamente da origem — `SEC-0021` exige chave *source-derived*. Janela de replay e escopo de ordenação não estão declarados. Exige teste de entrega duplicada e de ponto-de-falha |
| **SEC-0015** (redação de PHI em superfícies de erro) | Detalhes de problema tipados, sem texto de exceção interno; saúde/prontidão sem PHI | `apps/api/src/seguranca.test.ts::"SEC-0015 — nenhum corpo de erro (400/401/404/412/422/428) contém SQL, nome de tabela, texto de exceção ou conceito clínico"`; `::"SEC-0015 — falha interna do banco vira 500 genérico ..."`; `::"SEC-0015 — /v1/healthz é deliberadamente público e devolve exclusivamente {status:'ok'}"` | **VERIFICADO NA FATIA — apenas a superfície de ERRO HTTP** | **Ressalva: ACHADO-02** (§5). E a exigência central de `SEC-0015` — *redação imposta pela plataforma, não por disciplina de quem escreve* — é **NÃO VERIFICÁVEL**: a fatia não tem camada de log, traço nem métrica (`Fastify({ logger: false })`). Ver §4 |
| **SEC-0002** (zero trust entre fronteiras) | Toda travessia de fronteira autenticada; posição de rede não confere autoridade | `apps/api/src/seguranca.test.ts::"SEC-0001/SAF-0007 — sem cabeçalho Authorization, TODA rota /v1 de dados responde 401"`; `::"SEC-0004/SEC-0001 — token malformado ... é recusado com 401"` | **VERIFICADO NA FATIA (parcial)** — 5 rotas `/v1` de dados exigem token; 12 formas de token inválido recusadas | **Ressalva: ACHADO-03** (§5). Existe **uma** fronteira nesta fatia. As demais (BFF↔API, app↔broker, V2↔AMH, MCP) não existem — `SEC-0002` é majoritariamente não verificável |
| **HAZ-0005** / **SAF-0002** / **SAF-0001** (ausência jamais vira normalidade) | Nenhum default numérico ou categórico para dado ausente, obsoleto ou inválido; todo resultado carrega status explícito | `apps/api/src/seguranca.test.ts::"HAZ-0005/SAF-0002 — insumo obrigatório ausente com os demais sinais alarmantes: status explícito, escore null (NUNCA 0, NUNCA 'normal')"`; `::"SAF-0001/SAF-0006 — invariante da projeção: nenhum leito exibe escore ou banda sem status de avaliação 'valido'"` | **VERIFICADO NA FATIA** para o NEWS2 sintético — o modo de falha **ocorrido** no legado (escore `0` com insumos ausentes) é reproduzido como cenário e **não** ocorre: `escore` e `banda` nulos, sem alerta, com `missing_required_input` explícito | Cobre **uma** regra (NEWS2) e **um** insumo obrigatório ausente. `SAF-0002` exige a *sonda de insumo ausente* como suíte **bloqueante sobre toda função e todo endpoint que produz valor**, mais testes de propriedade e **teste de mutação** sobre o núcleo de segurança. `SAF-0003` (política de completude versionada e aprovada por clínico ≠ autor) não existe |
| **SAF-0006** (agregado nunca mais tranquilizador que o pior membro) | Membro não avaliado conta em categoria própria, nunca dobrado em "normal" | `apps/api/src/seguranca.test.ts::"SAF-0006 — leito DESOCUPADO aparece na própria categoria ..."`; `::"SAF-0001/SAF-0006 — invariante da projeção ..."` | **VERIFICADO NA FATIA** — leito desocupado tem status/escore/banda nulos e frescor `desatualizado`; nenhum leito exibe escore sem status válido | Não há contagens de unidade nem mapa de calor nesta fatia. `SAF-0006` exige teste de propriedade sobre **cada** agregado e verificação de fatores humanos de que a categoria "não avaliado" é notada |
| **SAF-0028** / **SEC-0026** (validar e pôr em quarentena no ingresso; nunca coagir) | Código, conceito ou unidade não reconhecidos ⇒ quarentena ou representação explícita de não mapeável; nunca default | `apps/api/src/seguranca.test.ts::"SAF-0028/SEC-0026 — unidade fora do catálogo é rejeitada alto (unmappable_unit), jamais coagida"`; `::"SEC-0026/SAF-0010 — observações malformadas vão para QUARENTENA com motivo ..."` | **VERIFICADO NA FATIA** — unidade impossível ⇒ `invalido` + `unmappable_unit`, escore nulo; 10 formas malformadas (valor não numérico, nulo, unidade vazia, sem unidade, data impossível, data sem fuso, instante vazio, forma trocada nos dois sentidos, parâmetro fora do catálogo) ⇒ 10 quarentenas com motivo, zero aceitas, avaliação não válida | Não há terminologia real, nem versão de terminologia fixada com digest (`SEC-0025`), nem matriz versionada qualidade-de-fonte × status (`SAF-0032`, condição **C3 aberta** em ADR-0005). Exige suíte de conformidade terminológica com fixtures de código desconhecido |
| **SAF-0010** (carimbos de origem preservados, nunca inventados) | Tempo clínico da fonte jamais substituído por "agora" | `apps/api/src/seguranca.test.ts::"SEC-0026/SAF-0010 — observações malformadas vão para QUARENTENA ..."` (casos de data impossível, data sem fuso e instante vazio) | **VERIFICADO NA FATIA (parcial)** — instante inválido vira quarentena, nunca "agora" | Detecção de desvio de relógio e de anomalia de fuso (`SAF-0012`) não existe. `SEC-0024` (tempo confiável) não é verificável: o relógio é o do processo de teste |
| **THR-0016** (assinatura autorizada só por autenticação) | Canal de tempo real escopado por tenant/paciente/recurso, não só autenticado | `apps/api/src/seguranca.test.ts::"SEC-0009/THR-0016 — o fluxo de eventos (superfície contínua) não entrega NENHUM evento do outro tenant"` | **EVIDÊNCIA PARCIAL — THR-0016 permanece OPEN** — o *replay por cursor* respeita o tenant, com controle positivo (o dono vê os seus eventos) | Não existe assinatura real: `/v1/eventos/stream` é catch-up por cursor, não push em conexão aberta (pendência já registrada em `openapi.yaml`). O escopo por **paciente/recurso** não existe. Exige o canal real, com autorização por assinatura e reconciliação de entrega (`SEC-0034`) |

## 4. Controles NÃO VERIFICÁVEIS nesta fatia — com o motivo

A honestidade exige separar dois casos distintos. **(a) Não verificável**: a fatia não
contém o objeto do controle, e nenhum teste escrito hoje mudaria isso. **(b) Verificável em
princípio, não verificado nesta rodada**: o objeto existe, mas o teste não foi escrito —
isso é dívida desta rodada, não limite da fatia.

### 4.1 Não verificável — o objeto do controle não existe na fatia

| Controle | O que exige | Por que a fatia sintética não pode verificar | O que produziria a evidência |
|---|---|---|---|
| **SEC-0004** | Validação de token contra chave confiável fixada (`iss`/`aud`/`exp`/`nbf`/`sub`/tenant), **sem caminho de fallback** | Não existe validação: `apps/api/src/auth.ts` é um stub declarado — reconhece a **forma** `SYNTH-TOKEN.<tenant>.<ator>` e nada mais. Não há assinatura, emissor, expiração nem revogação. **Qualquer chamador pode forjar o token de qualquer tenant.** ADR-0015 está `not-started` | ADR-0015/ADR-0016 aceitos e implementados; teste de fallback negativo (falha de JWKS ⇒ nega) sob THR-0021/THR-0022 |
| **SEC-0005**, **SEC-0007**, **SEC-0008** | Higiene de sessão/token; *break-glass* governado; revisão de acesso e ciclo entra/move/sai | Não existe sessão, nem diretório de identidade, nem papel humano no sistema | Plataforma de identidade escolhida e operada |
| **SEC-0006**, **THR-0026** | Identidade de carga de trabalho distinta da de usuário; delegação carrega contexto | Não existe chamada serviço-a-serviço nesta fatia: um processo, um banco embutido | Topologia multi-serviço com identidade de carga verificável |
| **SEC-0011** | Criptografia em trânsito com par verificado | Não há transporte: os testes usam `app.inject()`, sem socket, sem TLS | Ambiente *production-like* + verificação de certificado/mTLS |
| **SEC-0012** | Criptografia em repouso **em toda cópia** | PGlite roda **em memória**, sem `dataDir`. Não existe volume, backup, cache, objeto nem *snapshot* para cifrar | Postgres real com cifragem de volume/coluna + inventário de cópias |
| **SEC-0013**, **SEC-0014**, **THR-0053** | Ciclo de vida de chave (rotação, custódia separada, recuperabilidade); isolamento de segredo e credencial efêmera | Não existe nenhuma chave nem nenhum segredo na fatia | Gestão de chaves e cofre operados, com custodiante nomeado |
| **SEC-0015** (metade "plataforma") | Redação imposta pela camada de log/traço/métrica, **não** por disciplina de quem escreve | **Não existe camada de log**: o servidor é construído com `Fastify({ logger: false })`; não há tracing nem métricas. Um teste de redação de log seria verde por vacuidade — o que é pior que não testar | Log estruturado com campos em lista de permissão + *canário* com forma de PHI atravessando todo caminho de log/traço/métrica + varredura de sink bloqueante |
| **SEC-0018**, **SEC-0019**, **SEC-0020** | Minimização em notificação; restrição técnica em suporte/compartilhamento de tela; exclusão segura e exportação controlada | Nenhuma dessas superfícies existe | As superfícies, quando existirem |
| **SEC-0022**, **THR-0015** | Proveniência **autenticada** em evento interno e envelope ingerido; direito de publicação por tópico e produtor | O outbox grava proveniência *declarada* (`sourceSystem`, `sourceEnvelopeId`, `mappingVersion`), mas **sem identidade de produtor autenticada, sem assinatura e sem digest**: qualquer código no processo pode inserir qualquer evento. Não há broker onde escopar direito de publicação | Broker escolhido + assinatura/digest de produtor + teste de rejeição de evento forjado |
| **SEC-0024** | Tempo confiável | O relógio é o do processo de teste; não há fonte confiável nem detecção de desvio | Fonte de tempo com atestação + monitor de desvio |
| **SEC-0025** | Fixação de versão de terminologia com verificação de digest | Os conceitos são `SYNTH-CONCEPT-*`; não há terminologia real, nem versão, nem digest | Terminologia real fixada, com digest verificado no carregamento |
| **SEC-0028**–**SEC-0031**, **SAF-0020**, **SAF-0021**, **THR-0034** | Bundle de regra imutável, versionado e **assinado**, verificação que falha fechada, autor ≠ aprovador, versão única com ativação transacional/rollback/kill switch, raiz de confiança independente | **Não existe bundle.** A regra NEWS2 é código compilado em `packages/kernel-clinico`; não há artefato assinado, nem identidade/hash de bundle no registro de avaliação, nem aprovador clínico, nem *kill switch* | ADR-0007 implementado: bundle assinado + verificação no carregamento + aprovador clínico nomeado ≠ autor |
| **SEC-0033**, **SEC-0034**, **SAF-0016**, **THR-0039** | Detecção de anomalia de acesso; reconciliação "gerado ≠ exibido" como SLI | Não há telemetria, não há entrega a humano, não há medição de intervalo | Observabilidade operando + sonda sintética ponta-a-ponta medindo perda |
| **SEC-0035**, **SAF-0024**, **SAF-0025** | Resposta a incidente com trilha de violação de privacidade; modo degradado e procedimento de indisponibilidade declarados | São controles de **processo humano**, não de código | Procedimentos escritos, ensaiados e aceitos por autoridade nomeada |
| **SEC-0036**–**SEC-0040**, **THR-0050**–**THR-0055** | Fixação de dependências, SBOM e gate de vulnerabilidade bloqueante, assinatura de artefato, CI endurecido, **todo gate bloqueia** | Matéria de CI/infraestrutura, fora do código da fatia. Registro honesto: **a proteção de branch não está configurada** (THR-0055), logo os gates existentes podem ser mesclados por cima | Proteção de branch + gates bloqueantes + SBOM + assinatura/atestação de proveniência |
| **SEC-0041**–**SEC-0046**, **SAF-0027**, **THR-0061**–**THR-0065** | Superfície MCP/IA estreita, tipada, versionada, *read-only* por padrão; separação estrutural instrução/conteúdo; ancoragem; confirmação humana; sem PHI a provedor de modelo | **Não existe nenhuma superfície MCP nem de IA na fatia** | A superfície, quando existir, sob ADR-0014 |
| **SEC-0047**, **SEC-0048**, **SAF-0036**, **SAF-0039** | Integridade de backup, cópias isoladas e imutáveis, restauração exercitada e reconciliação pós-indisponibilidade | Banco em memória: não há backup nem restauração possíveis | Ambiente com backup real + restauração exercitada e verificada de forma independente |
| **SEC-0050**, **SAF-0031** | Limitação de taxa, quotas e contrapressão; orçamento de latência **medido** | Não há limitação de taxa na fatia, nem medição de latência | Borda com limitação de taxa + percentis medidos por trilha |
| **SAF-0009**, **SAF-0029**, **THR-0080** | Resolução de identidade explícita e escopada; semântica de merge/unmerge | Não existe resolução de identidade nem evento de identidade. `SAF-0009` está formalmente **bloqueado** pela contradição AMH tenant/MPI (`IDN-CONTRA`) | Contrato AMH fixado + adjudicação da contradição por autoridade nomeada |
| **SAF-0033**, **THR-0046** | Verificação contínua de aptidão sobre fonte ao vivo | Não há fonte ao vivo: todos os dados são fixtures sintéticas | Integração AMH em ambiente *production-like* |
| **SAF-0034** | Anúncio acessível e sinalização não visual de mudança de estado clínico | Superfície de UI, fora do escopo destes dois pacotes | Testes de componente + verificação de acessibilidade |
| **SAF-0037**, **SAF-0030**, **DEC-G0-02**, **MG-G6** | Independência como controle de processo; gate que valida zero casos FALHA; verificador terceiro; aceite nominal | **Nenhum teste pode verificar a própria independência de quem o escreveu.** Este é o limite estrutural desta rodada inteira | Verificador terceiro nomeado + aceite humano registrado com regra de supersessão |

### 4.2 Verificável em princípio — NÃO verificado nesta rodada (dívida declarada)

| Controle | Por que era verificável | Por que não foi feito agora |
|---|---|---|
| **SEC-0016** (minimização em contrato: conjunto de campos fechado) | As respostas da API têm forma declarada em `packages/contratos`; um teste poderia afirmar que nenhuma resposta carrega campo fora do contrato | Exigiria varredura de forma sobre todas as respostas; fora do recorte adversarial desta rodada |
| **SAF-0032** (qualidade de fonte × status de avaliação como duas dimensões) | As duas dimensões existem (`clinical_observations.quality` e `evaluation_records.status`) e o adaptador faz `unknown ⇒ quarantined` fail-closed | A **matriz versionada** exigida pelo controle é *placeholder* (condição **C3 aberta** em ADR-0005): não há contra o que testar exaustivamente |
| **SAF-0019** (registro imutável de avaliação, incluindo a razão do não-disparo) | `evaluation_records` é append-only (verificado em §3) e guarda o registro íntegro do kernel com `motivos` | O controle exige **identidade e hash do bundle** no registro — que não existem (SEC-0028). O registro é imutável, mas **incompleto** frente a SAF-0019 |
| **SAF-0004**/**SAF-0005** (frescor por insumo, computado e visível) | Há degradação em tempo de leitura e campo `frescor` na projeção | Os limiares são **ilustrativos** e declarados `VALIDATION REQUIRED` em ADR-0011 §3: testar contra número não decidido produziria falso conforto |
| **SAF-0022** (supressão transparente e auditável) | O kernel expõe `escalationSuppressed` | Não há trilha de auditoria de supressão na fatia; testar só o campo seria verificação vazia |
| **SEC-0049** (degradação fail-visible; prontidão representa capacidade segura) | A degradação clínica em tempo de leitura é testável (e o E2E da fatia já a exercita) | `/v1/healthz` responde `ok` a partir de um `select 1`: **não representa capacidade segura**. Verificar a metade fácil e calar sobre a difícil seria exatamente o falso verde que `SAF-0030` proíbe |

## 5. Achados

| # | Prioridade | Achado | Evidência | Encaminhamento (fora do escopo desta rodada) |
|---|---|---|---|---|
| **ACHADO-01** | **ALTA** | **O rebaixamento de papel do banco é reversível na mesma conexão.** Depois de `bootstrapDatabase`, a conexão roda como `intensicare_app` (sem superusuário) e a RLS vale. Mas o **usuário autenticado original** da sessão PGlite é `postgres` (superusuário), e o PostgreSQL permite `SET SESSION AUTHORIZATION postgres` exatamente nessa condição — restaurando superusuário, para quem a RLS **não se aplica**. (`SET ROLE postgres` é negado, o que dá a falsa impressão de que o caminho está fechado.) Consequência: o isolamento de tenant desta fatia protege contra **código de aplicação correto**, não contra um adversário **no processo** — que é precisamente o cenário de THR-0050 (dependência comprometida, P0) e de injeção de SQL | `packages/persistencia/src/seguranca.test.ts::"SEC-0009/SEC-0003 — o papel de aplicação NÃO deveria conseguir reescalar para superusuário (ACHADO-01: consegue)"` (marcado `it.fails`) e `::"SEC-0009 — demonstra a consequência do ACHADO-01: reescalado, o processo lê linhas de TODOS os tenants"` | Em ambiente real, a aplicação deve **autenticar-se diretamente** como papel sem privilégio, nunca rebaixar-se a partir de superusuário. Matéria de ADR-0016 e do futuro `docs/07`. Enquanto isso, `SEC-0009` **não pode** ser declarado satisfeito |
| **ACHADO-02** | **MÉDIA** | **O corpo `application/problem+json` ecoa o identificador de sujeito.** O campo `instance` recebe `request.url`, e a rota de avaliações carrega o `portable_subject_ref` no caminho — logo o identificador volta dentro do corpo de erro, contra `SAF-0026` e `SEC-0015`. Severidade limitada porque o valor é o que o **próprio chamador** enviou (não há divulgação a terceiro *nesta resposta*); mas corpos de erro são rotineiramente registrados por *proxies*, consoles e coletores — o caminho descrito em HAZ-0028 | `apps/api/src/seguranca.test.ts::"SAF-0026/SEC-0015 — o corpo de erro NÃO deveria conter o identificador de sujeito (ACHADO-02: instance ecoa o PSR)"` (marcado `it.fails`) | Usar referência **opaca** de ocorrência em `instance` — por exemplo o id de correlação já emitido em `x-correlation-id` — em vez da URL crua |
| **ACHADO-03** | **MÉDIA** | **Superfície de escrita sem autenticação.** `POST /idempotency-example`, remanescente da fundação SPR-G7-1, aceita requisição sem qualquer `Authorization`. Não lê nem grava estado clínico (devolve `{received:true}`), por isso não é tratado como falha de isolamento; mas é uma rota de escrita sem fronteira de autenticação, contra `SEC-0002` | `apps/api/src/seguranca.test.ts::"SEC-0002 — ACHADO-03: /idempotency-example aceita POST sem autenticação ..."` (teste que fixa a superfície atual e prova que ela não expõe estado clínico) | Remover a rota antes de qualquer ambiente que veja dado real, ou colocá-la atrás da mesma autenticação das rotas `/v1` |

Nenhum dos três foi consertado: consertar código de produção está **fora do escopo** deste
agente, e ACHADO-01 exige mudança de topologia de conexão, não uma correção pontual.

## 6. Limites metodológicos declarados

1. **Não independência.** Ver §1 item 4. Testes escritos por agente, no mesmo programa.
2. **PGlite não é Postgres de produção.** A própria fatia registra uma divergência **observada**
   de comportamento (`SET LOCAL SESSION AUTHORIZATION` não reverte no fim da transação —
   `packages/persistencia/src/session.ts`). ACHADO-01 é, em parte, consequência da topologia
   embutida. Toda conclusão sobre RLS precisa ser **refeita** contra Postgres real.
3. **Uma regra clínica.** Só NEWS2, com conceitos sintéticos. `SAF-0002` exige a sonda de
   insumo ausente sobre **toda** função e endpoint que produz valor.
4. **Dois tenants.** As sondagens cross-tenant usam dois tenants sintéticos. Uma campanha de
   G6 precisa cobrir caches, projeções, tópicos, assinaturas, exportações, **códigos de erro
   e timing** (`SEC-0009`).
5. **Sem canal lateral.** Nenhuma medição de tempo de resposta foi feita: um oráculo de
   existência por *timing* continuaria invisível a estes testes.
6. **Sem teste de mutação.** `SEC-0003` (`PROMPT:793`) e `SAF-0002` exigem teste de mutação
   sobre política de autorização e sobre o núcleo de segurança clínica. Não foi executado
   aqui.
7. **Sem carga, sem concorrência real.** A corrida de dois atores é sequencial e determinística;
   não substitui teste de propriedade com dois escritores concorrentes de verdade.

## 7. Situação frente ao Gate G6 (inalterada)

`g6-readiness.md` registra as quatro condições de G6 como **não atendidas**. Esta rodada
**não muda nenhuma delas**:

- **P0/P1 fechados ou aceitos** — permanecem **OPEN**; nada aqui os fecha nem os aceita.
- **Evidência adversarial de isolamento de tenant** — existe agora evidência adversarial
  *parcial e não independente*, com a ressalva do ACHADO-01. Não satisfaz `SEC-0009`.
- **Aprovação privacy/legal dos fluxos** — inalterada; nenhum fluxo real existe.
- **Aceite nominal de risco residual (MG-G6)** — inalterado; nenhum agente pode dá-lo.

O único efeito legítimo deste documento é **reduzir incerteza**: passa a existir evidência
executável de que certos comportamentos afirmados pela fatia resistem a tentativa ativa de
contorno, e passa a existir registro explícito — com motivo — de tudo o que a fatia **não**
consegue demonstrar.
