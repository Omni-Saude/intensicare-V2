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
  tests: [apps/api/src/seguranca.test.ts, packages/persistencia/src/seguranca.test.ts, apps/api/src/regras/autoridade.test.ts, apps/api/src/db.test.ts]
  pr: null
supersedes: null
superseded_by: null
last_updated: 2026-08-19
addenda:
  - "§8 (2026-08-18): janela de DDL das migrações 0005/0006"
  - "§9 (2026-08-18): ACH-O3-1, ABERTO"
  - "§9.1 (2026-08-18): emenda datada — alcance de ACH-O3-1 estava subdimensionado; continua ABERTO"
  - "§10 (2026-08-18): quarta onda adversarial — ACH-O3-3/4/5/7 FECHADOS, ACH-O3-8/15 ABERTOS"
  - "§4.1, linha SEC-0004 (2026-08-19): correção de citação cruzada — ADR-0015 não está mais not-started (direção aceita GDEC-0016; minuta materializada GDEC-0015); o stub de apps/api/src/auth.ts continua forjável, sem mudança de código"
  - "§10.7 (2026-08-19): correção de contagem — check_contratos passou de 209 para 258 verificações e o autoteste de 35 para 99 casos (Parte G3 acrescentada, comparação de forma dos schemas REST); números históricos de 2026-08-18 preservados, não reescritos"
---

# Verificação de controles na fatia sintética G7

> **Nota de manutenção (2026-08-18, adendo — não altera as seções 1–7).** Este documento
> descreve o commit `87798af`, anterior às migrações `0004_escopo_selado.sql`,
> `0005_fecho_de_privilegio.sql` e `0006_ancora_isolada.sql`. Uma afirmação da `0005`, no
> código, sobre a "janela de DDL" ficar "fechada até o próximo deploy" mudou parcialmente com
> a `0006` (2026-08-18). A reconciliação está na **seção 8**, ao final, como adendo datado e
> autocontido — as seções 1–7 permanecem exatamente como escritas, achado por achado.

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
| **SEC-0004** | Validação de token contra chave confiável fixada (`iss`/`aud`/`exp`/`nbf`/`sub`/tenant), **sem caminho de fallback** | Não existe validação: `apps/api/src/auth.ts` é um stub declarado — reconhece a **forma** `SYNTH-TOKEN.<tenant>.<ator>` e nada mais. Não há assinatura, emissor, expiração nem revogação. **Qualquer chamador pode forjar o token de qualquer tenant.** ADR-0015 está `not-started` (nota de correção 2026-08-19 logo após esta tabela) | ADR-0015/ADR-0016 aceitos e implementados (nota de correção 2026-08-19); teste de fallback negativo (falha de JWKS ⇒ nega) sob THR-0021/THR-0022 |
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

> **Correção (2026-08-19, especialista de consistência documental e
> rastreabilidade).** Linha `SEC-0004` acima: `ADR-0015` não está mais
> `not-started` — a direção (Opção A) foi aceita pelo titular em `GDEC-0016`
> (2026-08-16) e a minuta foi materializada no mesmo dia (`GDEC-0015`;
> `adr-index.md:106`). O que continua verdadeiro e não muda com esta
> correção: **nenhum código de verificação real existe** —
> `apps/api/src/auth.ts` continua sendo o stub descrito, forjável por
> qualquer chamador; "aceito" não é "implementado" (`adr-index.md` §2.1). A
> coluna "O que produziria a evidência" já apontava corretamente que
> ADR-0015/ADR-0016 precisam estar **implementados**; o que estava
> desatualizado era só o bookkeeping da aceitação de direção, hoje
> satisfeita.

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

## 8. Adendo (2026-08-18) — a janela de DDL da migração `0005`, e o que mudou com a `0006`

**Por que este adendo existe.** As seções 1–7 acima descrevem, sem alteração, a campanha de
40 testes adversariais executada contra o commit **87798af** (SPR-G6-2, "Ciclos 5 e 6") — antes
de existirem as migrações `0003_fronteira_papeis.sql`, `0004_escopo_selado.sql`,
`0005_fecho_de_privilegio.sql` e `0006_ancora_isolada.sql`. Nenhuma linha das seções 1–7 foi
reescrita: o ACHADO-01 registrado ali (rebaixamento de papel reversível por `SET SESSION
AUTHORIZATION`) é um achado **diferente e anterior** aos achados ACHADO-17/ACHADO-18/F1/F2
descritos abaixo, permanece válido tal como escrito, e continua sendo tratado como **limite
estrutural do simulador PGlite e requisito vinculante de produção** — ver `ADR-0016` §4.1 e
`packages/persistencia/README.md`, seção "Dois adaptadores, uma porta". Este adendo não fecha,
não revisa e não contradiz o ACHADO-01, o ACHADO-02 ou o ACHADO-03.

Este adendo trata de uma afirmação diferente, sobre a migração `0005`: que a "janela de DDL"
ficaria "fechada até o próximo deploy". Registro de precisão sobre o próprio despacho que pediu
este adendo: essa frase **não está, e nunca esteve, escrita neste documento** — verificado por
leitura integral das seções 1–7 e por `git log --follow` sobre este arquivo, que mostra um único
commit em todo o seu histórico (`ecd32d5`), anterior a todas as migrações `0004`–`0006`. A frase
existe **no código-fonte**, textualmente, em dois lugares —
`packages/persistencia/src/migrations/0005_fecho_de_privilegio.sql:73` ("Isso é 'fechado até o
próximo deploy', não 'fechado'") e `packages/persistencia/src/postgres/pool.ts:32-33` (a mesma
frase) — e já foi
propagada e atualizada em `packages/persistencia/README.md` (seção "Fecho de privilégio: função
de terceiro e herança") pelo especialista que fechou F1/F2, em commit posterior. Esse pacote de
código está **fora da fronteira de escrita deste agente** (`packages/persistencia/**` é área de
outro agente nesta rodada). Este adendo é, portanto, a **primeira vez que esta informação entra
em `docs/**`**, não a correção de um erro anterior deste arquivo. A discrepância entre a premissa
do despacho recebido ("este documento declara X") e o estado observado ("X está no código e em
`packages/persistencia/README.md`, não aqui") está registrada com todas as letras para que não
seja lida como uma correção silenciosa.

### 8.1 A evolução, em ordem, com data e evidência (`OBSERVED`)

| Migração | Data / commit | O que fechou | O que declarou aberto, textualmente |
|---|---|---|---|
| `0004_escopo_selado.sql` | anterior a `7eef8c0` | Escopo de tenant deixa de viver em parâmetro de sessão regravável pela aplicação; passa a viver em tabela `intensicare_escopo.selo`, alcançável só por duas funções `SECURITY DEFINER` do papel migrador. Fecho transitivo por `pg_rewrite` sobre quem alcança o selo. | `pg_rewrite` cobre VIEW e MATVIEW — **não alcança função**. Declarado no próprio handoff daquela rodada, e é exatamente o que a `0005` mediu como explorável |
| `0005_fecho_de_privilegio.sql` | `7eef8c0`, 2026-08-17 ("Sexta revisão adversarial: fecho de privilégio (P1)…") | ACHADO-17 (função `SECURITY DEFINER` de terceiro executável pela aplicação — o PostgreSQL concede `EXECUTE` a `PUBLIC` por padrão em toda função nova, inclusive por gatilho, cuja execução não passa por checagem de `EXECUTE`) e ACHADO-18 (ancestral de herança/partição alcançável sem RLS+FORCE+política ancorada) — os dois **medidos como exploráveis** contra PostgreSQL 16.14 antes do fecho | Textual, no próprio cabeçalho (`0005_fecho_de_privilegio.sql:66-78`): a auditoria roda quando a MIGRAÇÃO roda, e a guarda de identidade roda quando o processo ABRE o pool; um `ALTER TABLE ... INHERIT` executado por superusuário (ou pelo migrador) **no meio da vida de um processo já aberto** não é detectado por nenhuma das duas até o próximo boot ou a próxima migração — "isso é 'fechado até o próximo deploy', não 'fechado'". A `0005` recusou deliberadamente resolver isso com `EVENT TRIGGER` porque só superusuário pode criá-lo no PostgreSQL 16, e "um controle presente em alguns ambientes e ausente noutros é pior que um limite declarado" |
| `0006_ancora_isolada.sql` | `ec97f61`, 2026-08-18 ("Fecha ACH-REV8-4 e dois exploits reais de isolamento de tenant (F1, F2)") | **F1** (função `SECURITY DEFINER` de terceiro lendo a tabela de selo inteira — `pid` + `tenant_id` de todos os backends vivos) fechado **por estrutura**: a âncora sai da propriedade do dono do esquema (`intensicare_migrador`) para um papel dedicado `intensicare_selo` — `NOLOGIN`, sem nenhum atributo, do qual **ninguém é membro**. **F2** (`ALTER TABLE ... INHERIT` pós-boot) fechado por um **event trigger** em `ddl_command_end` que reexecuta os invariantes da `0005` ao fim de cada comando de DDL e **aborta** o que os violar | O event trigger só pode ser criado por **superusuário** (regra do PostgreSQL 16); o papel de migração não tem esse atributo, por desenho da `0003`. Por isso a instalação é um **segundo passe explícito** do provisionamento, não algo automático em todo ambiente — ver 8.2 |

F1 e F2 foram **atacados de verdade contra PostgreSQL 16.14 real antes do fecho, e os dois
ataques tiveram êxito** — não são hipóteses de inspeção (`packages/persistencia/README.md`,
seção "Âncora isolada e guarda de DDL"; `0006_ancora_isolada.sql:14-38`). As recusas medidas
depois do fecho são **`42501`, erro do banco (PostgreSQL), não da aplicação**: a garantia não
depende de nenhuma linha de `apps/api` decidindo recusar — é o próprio motor que recusa o
comando de DDL.

### 8.2 Estado atual, com todas as letras: o que fecha por padrão e o que não fecha

Duas opções distintas, de nomes parecidos e efeito diferente — confundi-las seria o próprio erro
que este adendo existe para prevenir:

| Opção | Onde (`OBSERVED`) | Efeito | Padrão | O que controla |
|---|---|---|---|---|
| `OpcoesProvisionamento.fechoDeRuntime` | `packages/persistencia/src/postgres/provisionamento.ts:70-83,245-250` | Se `true` **e** a `0006` estiver na cadeia de migrações aplicada, o provisionamento roda um **segundo passe** com credencial de superusuário (`instalarFechoDeRuntime`, idempotente — linhas 262-293) que isola a âncora no papel guardião e instala o event trigger | `true` (só produz efeito quando quem chama o provisionamento **possui** uma credencial de superusuário; sem ela o segundo passe apenas registra `notice` e não falha) | Se o fecho é **instalado no banco** no momento do provisionamento |
| `ConfiguracaoPostgres.exigirFechoDeRuntime` | `packages/persistencia/src/postgres/pool.ts:59-82,432-440` | Se `true`, `AdaptadorPostgres.abrir()` **recusa a partida** contra um banco onde a âncora não está isolada ou o event trigger está ausente/desabilitado, nomeando F1 e F2 nos motivos de recusa (`ErroIdentidadeInsegura`) | **`false`** | Se a **ausência** do fecho é detectada e barrada **em tempo de execução, pela aplicação** |

**Isto é o ponto central deste adendo, dito sem eufemismo — rótulo `VALIDATION REQUIRED`:** com
`exigirFechoDeRuntime` no padrão (`false`), um `AdaptadorPostgres` abre normalmente contra um
banco onde o fecho de runtime **não foi instalado** — por exemplo, um ambiente gerenciado que
não concede `CREATE ROLE`/`CREATE EVENT TRIGGER` a ninguém além do próprio provedor. Nesse caso,
a ausência do fecho **não gera nenhum erro, nenhum aviso em tempo de execução, nenhuma linha de
log** por parte deste pacote — ela fica exatamente onde a `0005` já a deixava: **um limite
declarado em comentário de código e em `README.md`, não uma recusa observável em runtime**. A
frase "fechado até o próximo deploy" deixou de ser universalmente verdadeira (passou a depender
de topologia), mas "sempre fechado" **também não é verdadeira hoje** — e não há, atualmente,
nenhum sinal em runtime que diferencie as duas situações para quem opera o sistema, a menos que
`exigirFechoDeRuntime` seja ligado explicitamente.

Isso não é uma lacuna de código para um agente corrigir: ligar `exigirFechoDeRuntime` por padrão
exigiria exigir superusuário no provisionamento de **todo** ambiente-alvo, o que é decisão de
**topologia de infraestrutura/provedor** — fora da autoridade de qualquer agente. Fica registrado
como pendência, no mesmo formato que este documento já usa para pendências (§3, coluna
"Evidência residual necessária para G6"; §4, coluna "O que produziria a evidência"):

> **Pendência de decisão — topologia do fecho de runtime.** Decisão necessária: se todo ambiente
> que hospeda `AdaptadorPostgres` deve exigir credencial de superusuário no provisionamento (o
> que habilita `exigirFechoDeRuntime: true` como padrão) ou se algum ambiente-alvo não concede
> esse privilégio (o que exigiria aceitar o limite declarado como risco residual, formalmente,
> por quem tem autoridade para aceitar risco — não por nenhum agente). Nenhuma das duas opções
> foi escolhida até o momento deste adendo. `owner: UNASSIGNED — VALIDATION REQUIRED`
> (`evidence-notation.md` §2 regra 7) — este documento não nomeia, e não pode nomear, quem
> decide. Evidência que fecharia a pendência: uma ADR ou decisão registrada em
> `docs/00-governance/registers/decision-register.md` fixando a topologia de provisionamento
> para todo ambiente de destino.

### 8.3 O que este adendo NÃO faz

Idêntico, em força, ao que a §1 já declara sobre o documento inteiro — reafirmado porque este
adendo introduz material novo:

1. **Não fecha `THR-0050`**, nem nenhum outro `THR-*`, `SAF-*`, `SEC-*` ou `HAZ-*`. F1 e F2 foram
   fechados **no código e na configuração de privilégio do banco**, medidos contra PostgreSQL
   real — isso é diferente de qualquer um desses IDs de rastreio ser fechado, aceito ou
   verificado por terceiro independente (`DEC-G0-02`, `MG-G6`).
2. **Não fecha nem aproxima o Gate G6.** A §7 acima ("Situação frente ao Gate G6 (inalterada)")
   permanece integralmente válida; nada neste adendo muda qualquer uma das quatro condições ali
   descritas.
3. **Não marca nenhuma ADR como `implemented` nem `verified`.** `ADR-0016` continua como está;
   este adendo cita, não decide.
4. **Não aceita risco residual, não nomeia owner, não usa o rótulo `DECIDED`.** A pendência de
   8.2 é registrada, não resolvida.
5. **Estado factual duro, inalterado:** 0 vias clínicas acionáveis; matriz de vias 47/47
   inelegíveis; `Observation` da AMH não consumível; safety case **M0**; nenhum dado real
   acessado (100% sintético, prefixo `SYNTH-`). Nenhum gate aprovado, nenhum `MG-*` satisfeito.

### 8.4 Provenance deste adendo

| Campo | Valor |
|---|---|
| `label` | Misto por subseção — 8.1 e a tabela de 8.2: `OBSERVED` (leitura direta de código-fonte e de `git log`); o bloco de pendência em 8.2: `VALIDATION REQUIRED`; 8.3: declarativo (escopo negativo) |
| `source_repo` | `intensicare-V2` |
| `path_or_url` | `packages/persistencia/src/migrations/0004_escopo_selado.sql`, `0005_fecho_de_privilegio.sql`, `0006_ancora_isolada.sql`; `packages/persistencia/src/postgres/pool.ts`; `packages/persistencia/src/postgres/provisionamento.ts`; `packages/persistencia/README.md` (citado como fonte já reconciliada; não editado por este agente — fora de `docs/**`) |
| `commit_sha_or_version` | `7eef8c0` (introduz `0005`); `ec97f61` (introduz `0006` e atualiza `packages/persistencia/README.md`) |
| `section_or_lines` | `0005_fecho_de_privilegio.sql:66-78`; `0006_ancora_isolada.sql:1-105`; `pool.ts:25-46,59-82,432-440`; `provisionamento.ts:70-83,245-293` |
| `date_collected` | 2026-08-18 |
| `collector` | agente reconciliador documental (esta sessão, branch `codex/lacunas-frontend-a11y`) |
| `transformation` | resumido e organizado em tabela a partir de comentário de código; citações entre aspas são cópia literal, sem tradução de sentido técnico |
| `confidence` | high (leitura direta do código-fonte citado linha a linha; nenhum teste foi executado por este agente — ver rubricas TESTADO/NÃO TESTADO do handoff desta sessão) |
| `owner` | UNASSIGNED — VALIDATION REQUIRED |
| `validation_status` | VALIDATION REQUIRED |

## 9. Adendo (2026-08-18) — `ACH-O3-1` (ABERTO): o veredito clínico persistido continua sem integridade própria

**Por que este achado mora aqui.** Esta é a continuação natural da lacuna já
registrada em §4.2 deste documento sobre `SAF-0019`: *"o controle exige
identidade e hash do bundle no registro — que não existem (SEC-0028). O
registro é imutável, mas incompleto frente a SAF-0019."* `ACH-O3-1` é a
mesma lacuna, medida de novo e de forma mais específica, depois de uma rodada
de revisão adversarial (`ACH-REV8-3`) ter fechado uma fatia ADJACENTE — a
acionabilidade — sem fechar esta. Não é um achado novo em espécie; é a prova,
por teste, de que o gap já registrado continua aberto mesmo depois de
`ACH-REV8-3` fechar.

**Identificador.** `ACH-O3-1` é documento-local, atribuído pelo orquestrador
desta sessão, no mesmo regime autodeclarado de `LAC-*`/`RLI-*`/`IA-*`/`EV-N`
usados alhures neste repositório — pendente de ratificação em
`docs/00-governance/traceability-policy.md` §1.1 caso venha a precisar de
alcance global. A família `ACH-*` já está em uso neste repositório (por
exemplo `ACH-REV8-3`, `ACH-01`/`ACH-05`/`ACH-07`/`ACH-09` em
`packages/persistencia/README.md` e `ACHADO-17`/`ACHADO-18` nas migrações
citadas em §8) — nenhum prefixo global novo é cunhado aqui.

**O que `ACH-REV8-3` fechou, e o que ele deliberadamente não fechou
(`OBSERVED`, `apps/api/src/regras/exposicao.ts:468-497`,
`apps/api/src/regras/autoridade.test.ts` inteiro).** `lerModoDeDespacho`
derivava `acionavel` da proveniência **lida do próprio registro persistido**
— registro e proveniência vêm do mesmo blob, então um atacante com escrita em
`evaluation_records` no escopo do tenant podia forjar coerência interna
(assinatura "verificada", zero bloqueios, `modo: "acionavel"`,
`acionavel: true`) e publicá-la como se fosse autorizada. A correção
(`resultadoPersistidoPublicavel`, `exposicao.ts:488-497`) passou a derivar
`acionavel` do **catálogo de autoridade do runtime** — o conjunto de
artefatos que o próprio processo carregou — em vez da alegação do blob; o
registro persistido serve apenas de chave de junção
(`versaoRegra`+`versaoBundle`+`behaviorHash`+`digestManifesto`), nunca de
fonte de verdade. Isto é `ACH-REV8-3`, e está **fechado**: medido em
`autoridade.test.ts`, uma forja competente (internamente coerente, não
apenas incompetente como os cinco vetores anteriores) é recusada com e sem
autoridade em mãos, com chave de junção copiada do runtime, contra regra
desconhecida, e mesmo tentando só a "aparência" de cadeia verificada sem
`acionavel: true` (lavagem de autoridade).

**O que continua aberto — `ACH-O3-1`.** O fecho cobre **acionabilidade e
alegação de autoridade**, não o **veredito clínico em si**. `escore`,
`banda`, `status`, `explicacao` e `anotacoes` continuam sendo republicados
**VERBATIM** do `result` persistido (`resultadoPersistidoPublicavel`, mesma
função, mesmas linhas: só o campo `despacho` é submetido à autoridade). Um
atacante com escrita em `evaluation_records` no escopo do tenant **fabrica
um escore e uma banda de risco** — só não fabrica uma recomendação acionável
para agir sobre eles. Medido ponta a ponta contra servidor real
(`autoridade.test.ts`, último `describe`, caso *"o fecho é PARCIAL: neutraliza
o despacho forjado e NÃO o veredito forjado"*): uma linha inserida com
`escore: 0`, `banda: "normal"` e explicação sintética fabricada — na direção
clinicamente mais perigosa, esconder deterioração — atravessa
`GET /v1/pacientes/{ref}/avaliacoes` com `despacho: null` (corretamente
neutralizado) **e** o escore/banda/explicação fabricados intactos. Para a
mesma série de insumos, o kernel real produz `11`/`crítico`; o veredito
publicado nesse cenário de ataque é `0`/`normal`. As asserções que provam
isto existem **para tornar o limite visível**, não para aprová-lo — o próprio
teste as chama de "dupla guarda de não-vacuidade", exatamente para que este
fato não passe despercebido quando alguém mudar o comportamento sem
atualizar o achado.

**O que fechá-lo exigiria — não é chamada deste documento.** Integridade do
**registro persistido** em si: assinatura de linha, HMAC ou coluna de digest
sobre o `result` gravado em `evaluation_records`. Isto é desenho novo, toca
`packages/persistencia` (fora da fronteira de escrita deste agente nesta
rodada), e provavelmente depende da MESMA custódia de chave que `ADR-0007`
C5 mantém **ABERTA** — não há, hoje, onde guardar a chave de assinatura de
forma que o mesmo atacante com escrita no banco não a alcance também.

> **Pendência de decisão — quem fecha `ACH-O3-1`.** *Quem decide:* o dono da
> `ADR-0007` (formato/assinatura de bundle de regra, cuja condição C5 sobre
> custódia de chave está na mesma família de problema) em conjunto com a
> autoridade de dados/segurança que aceitaria ou recusaria o desenho de
> integridade de registro. Nenhum nome é atribuído por este documento — a
> decisão de topologia de custódia de chave e o desenho de integridade de
> registro estão fora da autoridade de qualquer agente (Contrato de Agentes
> §3). `owner: UNASSIGNED — VALIDATION REQUIRED`
> (`evidence-notation.md` §2 regra 7).

**O que este adendo NÃO faz.** Não fecha `ACH-O3-1`, `ACH-REV8-3` (que já
estava fechado antes deste adendo, por outro agente) nem `SAF-0019`/`SEC-0028`.
Não fecha nem aproxima o Gate G6 — a §7 permanece integralmente válida. Não
marca nenhuma ADR como `implemented`/`verified`; `ADR-0007` C5 continua
`ABERTA`. Não aceita risco residual, não nomeia owner, não usa `DECIDED`.
**Estado factual duro, inalterado:** 0 vias clínicas acionáveis; 47/47
inelegíveis; `Observation` da AMH não consumível; safety case **M0**; nenhum
dado real acessado (100% sintético, prefixo `SYNTH-`). Nenhum gate aprovado,
nenhum `MG-*` satisfeito.

**Provenance:** `OBSERVED`, `apps/api/src/regras/exposicao.ts:468-497`,
`apps/api/src/regras/autoridade.test.ts` (arquivo inteiro, novo nesta
sessão) — lido diretamente por este agente. `date_collected`: 2026-08-18.
`collector`: agente reconciliador documental (esta sessão). `confidence`:
high (leitura direta de código e de teste que exercita o achado contra
servidor real e PGlite real — nenhum teste foi executado por este agente,
apenas lido). `owner`: UNASSIGNED — VALIDATION REQUIRED. `validation_status`:
VALIDATION REQUIRED.

### 9.1 Emenda datada (2026-08-18, fim da sessão) — o alcance de `ACH-O3-1` estava SUBDIMENSIONADO

O texto de §9 acima **fica intacto e continua sendo o registro do que se
sabia quando ele foi escrito**. Esta subseção corrige uma coisa só: a frase
*"fabrica um escore e uma banda de risco — só não fabrica uma recomendação
acionável"*, que descreve o achado como menor do que ele é. `ACH-O3-1`
**continua ABERTO**; a emenda amplia o alcance medido, não o fecha.

**Medido depois de §9 ter sido escrita** (`OBSERVED`, leitura de
`apps/api/src/regras/exposicao.ts:55-92` e do bloco *secção 5* de
`apps/api/src/regras/autoridade.test.ts`, por este agente, 2026-08-18):

1. **Não é "um escore a mais" — é o escore CERTO substituído pelo ERRADO na
   direção clinicamente perigosa.** Para a mesma série semeada, o kernel real
   produz `11`/`critico`; a linha forjada publica `0`/`normal` **mantendo
   `statusAvaliacao: "valido"` e `frescor: "atual"`**. Não há nenhuma
   degradação de status que sinalize o problema: o veredito falso se
   apresenta como um veredito bom.
2. **O atacante escreve prosa em português na tela do intensivista.**
   `explicacao`, `anotacoes` e `motivos` **são renderizados**
   (`apps/web/src/components/DetalhePaciente.tsx`, `ExplicacaoDoBackend`:
   `<p>{avaliacao.explicacao}</p>`, a lista de `anotacoes`, os `motivos` em
   `<code>`). Isso é texto normativo de terceiro em superfície clínica
   (`HAZ-0005`), não um número fora de faixa.
3. **A allow-list que fechou `ACH-O3-5` (§10.2) não alcança isto**, e é
   importante que a distinção fique escrita: ela filtra por **CHAVE**
   (que campos existem, e com que forma estrutural), nunca por **VALOR**. O
   veredito forjado tem exatamente as chaves certas com exatamente as formas
   certas — atravessa por construção.

**Limite do que foi medido — o que este documento NÃO afirma.** A grade de
leitos toma `escore`, `banda` e `statusAvaliacao` das **colunas** de
`evaluation_records`, não do blob `result`: forjar só o blob **não move a
grade** (asserido em `autoridade.test.ts`). A substituição do **item de
trabalho** (alerta da grade e `POST /v1/alertas/{id}/reconhecer`) foi
relatada por revisão adversarial, é de outra tabela (`work_items`) e **não
foi reproduzida** — fica registrada como alegação de revisor, não como fato
observado por este documento.

**O que fechá-lo exige continua o mesmo** (§9, último parágrafo): integridade
do registro persistido — assinatura de linha, HMAC ou coluna de digest sobre
o `result` gravado — e, provavelmente, a mesma custódia de chave que
`ADR-0007` C5 mantém **ABERTA**. A pendência de decisão nomeada em §9
permanece válida sem alteração. `owner: UNASSIGNED — VALIDATION REQUIRED`.

## 10. Adendo (2026-08-18, quarta onda de revisão adversarial) — seis achados de autoridade de leitura e de isolamento

**O que produziu este adendo.** Três revisores adversariais somente-leitura,
com lentes distintas, foram despachados contra árvore congelada nesta sessão;
os três **refutaram** a tese que lhes foi apresentada, e juntos produziram 25
achados. Os seis abaixo são os que caem no escopo deste documento (autoridade
de leitura, isolamento de tenant, controle publicado). Os demais estão em
`docs/10-ux-and-accessibility/analise-de-lacunas-frontend.md` §5
(apresentação/tela), `docs/09-api-events-and-mcp/catalogo-de-eventos.md` §5.5
e §5.6 (contrato de eventos) e `docs/14-devsecops-and-delivery/ci-policy.md`
§1.2/§5 (gate e método).

**Consequência de método, registrada aqui porque é o sexto ciclo seguido em
que ocorre:** esta refutação tripla veio sobre uma branch com `pnpm verify`
**exit 0** e **1.883 testes** (medição do orquestrador desta sessão — ver §10.7).
A taxa de achado deste repositório **não convergiu**. Nada neste adendo pode
ser lido como "a superfície de leitura está agora correta"; ele descreve o que
foi medido, fechado e deixado aberto numa rodada.

**Identificadores.** `ACH-O3-3`, `ACH-O3-4`, `ACH-O3-5`, `ACH-O3-7`,
`ACH-O3-8` e `ACH-O3-15` são **documento-locais, pendentes de ratificação em
`docs/00-governance/traceability-policy.md` §1.1** — exatamente o mesmo
regime já declarado para `ACH-O3-1` em §9 e para `LAC-*` no documento de
lacunas de frontend. **Nenhum prefixo global novo é cunhado**: a família
`ACH-*` já está em uso neste repositório (`ACH-REV8-3`,
`ACH-01`/`ACH-05`/`ACH-07`/`ACH-09` em `packages/persistencia/README.md`,
`ACHADO-17`/`ACHADO-18` nas migrações citadas em §8). Enquanto §1.1 não for
ratificado por autoridade humana nomeada, cada um destes IDs carrega o peso
probatório de um `PROPOSAL` (`evidence-notation.md` §2).

### 10.1 `ACH-O3-3` — FECHADO (era P0): a terceira superfície de leitura republicava corpo E status do banco

`ACH-REV8-3` foi fechado em **duas** superfícies de leitura
(`getPatientEvaluations`, `projectBedGrid`). Havia uma **terceira, que nunca
esteve naquele escopo**: o ramo de replay de idempotência de
`ingestObservations`, que devolvia `statusCode: existing.statusCode` e
`body: existing.responseBody` — os dois lidos de `idempotency_records`, sem
`lerModoDeDespacho`, sem `resultadoPersistidoPublicavel`, **sem autoridade**.
A migração `packages/persistencia/src/migrations/0002_g7_integration.sql:72`
concede `insert` nessa tabela ao papel da **aplicação**, e a guarda
`existing.requestHash !== args.requestHash` não protege nada: quem insere a
linha escolhe também o `request_hash`.

**Reprodução `OBSERVED`** (registrada em
`apps/api/src/db.test.ts:255-311`, contra `HEAD` `700b13e`, com PGlite real e
`buildServer` real — lida por este agente, não executada por ele):

| | status HTTP | `despacho.acionavel` | `rotuloPt` publicado |
|---|---|---|---|
| caminho legítimo, mesmo processo | `201` | `false` | constante `ROTULO_SOMBRA_PT` |
| replay sobre linha forjada | **`200`** | **`true`** | **texto escrito pelo atacante** |

O `rotuloPt` da forja é significativo por si: `"ACIONÁVEL — conduta clínica
autorizada."` **não existe como constante deste serviço** — não há
`ROTULO_ACIONAVEL_PT` em `apps/api/src/regras/tipos.ts`. A frase foi
integralmente redigida por quem escreveu a linha no banco e publicada
verbatim.

**Como foi fechado** — três exigências, todas verificáveis no código:

1. o corpo do replay é **reconstruído** por este processo, e a parte que
   alega autoridade (`avaliacao.despacho`) passa pela mesma submissão ao
   catálogo do runtime que as outras duas leituras já sofriam
   (`respostaDeReplayPublicavel`, `apps/api/src/db.ts:420`);
2. o `status_code` da linha **não decide** o código HTTP. O 201 é
   **transcrito do `packages/contratos/openapi.yaml`**, que já declarava esse
   código para o replay (`apps/api/src/routes.ts:200-210`) — não é um número
   decidido por nenhum agente;
3. corpo armazenado que **não reconstrói** é recusado com **500**
   (`replay-nao-publicavel`, `routes.ts:211-229`), nunca republicado nem
   "lavado". Fail-closed: o cliente não errou, o servidor é que não consegue
   honrar o replay.

**O que este fecho NÃO cobre:** exatamente o limite de `ACH-O3-1` (§9 e
§9.1). Escore, banda, status, motivos, anotações e explicação continuam
republicados verbatim. Quem escreve no banco ainda fabrica um veredito — só
não fabrica mais uma recomendação acionável nem um código HTTP.

### 10.2 `ACH-O3-5` — FECHADO: o `spread` do blob e a tripwire que passava por acidente

`resultadoPersistidoPublicavel` fazia **spread** do blob persistido e
substituía apenas o campo `despacho`. Consequência medida: um
`acionavel: true` colocado no **topo** do objeto — fora do envelope de
despacho — atravessava intacto para a resposta.

O que torna este achado instrutivo não é o vazamento; é o que ele revela
sobre a defesa. **A asserção que existia para pegá-lo,
`not.toContain('"acionavel":true')`, passava por acidente da forma de forja
que o próprio autor do teste escolheu** — o vetor dele injetava dentro do
envelope, onde a substituição de `despacho` limpava; nenhum vetor tocava o
topo. Um teste cuja cobertura depende de o autor ter imaginado a posição
certa não é uma defesa, é uma amostra.

**Fecho:** allow-list com **projeção profunda** — campos conhecidos, com
forma estrutural declarada (`FormaDeCampo`, `apps/api/src/regras/exposicao.ts:587-604`);
tudo o mais é descartado por construção, não filtrado por lista de proibidos.
**Prova:** `apps/api/src/regras/autoridade.test.ts:393-523` enumera as
posições de injeção (`POSICOES`), afirma explicitamente
`expect(POSICOES.length).toBeGreaterThanOrEqual(17)` para que o bloco não
possa esvaziar em silêncio, e exercita cada posição **com e sem autoridade**,
cada uma com âncora de não-vacuidade, mais varredura recursiva da resposta.

**Registrado como limite, não como conforto:** a allow-list decide **forma**,
nunca **valor** — "aqui não se decide se `banda` é `critico` ou se `status` é
`valido`, isso é taxonomia clínica e não é decidível por este serviço"
(comentário do próprio módulo). É por isso que ela não fecha `ACH-O3-1`.

### 10.3 `ACH-O3-4` — FECHADO: texto clínico do atacante saía mesmo COM autoridade conciliada

`rotuloPt`, `mensagemRecusaPt` e `despachadoEm` vinham do blob **mesmo no
caminho em que a autoridade foi conciliada com sucesso**. A conciliação usa
uma **chave de junção pública** (`versaoRegra` + `versaoBundle` +
`behaviorHash` + `digestManifesto`): copiá-la do runtime é trivial, e feito
isso o texto visível saía como o atacante o escreveu. Medido:
`rotuloPt: "ACIONÁVEL — conduta clínica autorizada. Iniciar noradrenalina
0,1 mcg/kg/min."` publicado **ao lado de `acionavel: false`** — a
neutralização do booleano não neutralizava a frase.

**Fecho:** rótulo e mensagem passaram a ser **derivados** de constantes que já
existiam no serviço — `ROTULO_SOMBRA_PT` e `ROTULO_NAO_AVALIADO_PT`
(`apps/api/src/regras/tipos.ts:95,99`) e a tabela `MOTIVO_RECUSA_PT`, as
mesmas que o **caminho de escrita** grava. **Nenhum texto clínico novo foi
redigido** por este fecho, e nenhum agente decidiu vocabulário
(Contrato de Agentes §3).

**Perda conhecida, declarada em vez de escondida:** quando a recusa vem do
kill switch de runtime, `registro.ts` pode gravar um `mensagemUi` mais
específico que o texto canônico do motivo; a leitura passa a publicar o texto
canônico do **mesmo** motivo. É perda de especificidade, não de aviso — a
recusa continua visível e nomeada.

### 10.4 `ACH-O3-7` — FECHADO: proveniência sem autoridade, incluindo "nenhum impedimento"

Sem autoridade em mãos, a **proveniência do bundle** ainda vinha do blob. O
campo mais perigoso não era a assinatura: era `bloqueiosDeAtivacao: []` —
uma lista vazia **lê-se como "nenhum impedimento à ativação"**, afirmação
positiva sobre um artefato que este runtime não carregou.

**Fecho:** sem autoridade, a proveniência publicada é
`PROVENIENCIA_NAO_ATESTADA` (`exposicao.ts:558`) — não se descreve um
artefato que não se conhece. Três guardas independentes precedem isso
(`d.acionavel`, `modo === "acionavel"`, `assinatura === "assinatura_verificada"`),
e o próprio módulo registra por que são três: medido por mutação, remover
duas delas **deixava 387 testes verdes**, porque todo vetor existente
carregava `assinatura_verificada` e só a terceira decidia. Cada uma tem hoje
um vetor que a mata sozinha.

`versaoRegra` permanece — é **chave de junção**, não proveniência, e a mesma
string já é republicada verbatim em `ResultadoAvaliacao.versaoRegra`, que
segue sob `ACH-O3-1`. Suprimi-la só ali seria teatro, e o código diz isso com
essas palavras.

### 10.5 `ACH-O3-15` — ABERTO (novo, pré-existente): a recusa LEGÍTIMA nunca concilia, e perde a razão nomeada

**Fonte A — o código de conciliação** (`OBSERVED`,
`apps/api/src/regras/exposicao.ts:445-462`): `conciliarComAutoridade` exige
`modoAlegado === entrada.modo`.
**Fonte B — a forma do envelope de recusa** (`OBSERVED`, mesmo arquivo,
linhas 501-529): um despacho recusado tem `desfecho: "nao_avaliada"` e
**`modo: null`**, por invariante estrutural que o próprio módulo impõe.
**Impacto:** `entrada.modo` do catálogo é sempre `"sombra"` ou
`"acionavel"` — nunca `null`. Logo a comparação **nunca** é verdadeira para
uma recusa, `conciliarComAutoridade` devolve `null`, e o despacho publicado é
`null` **em vez do envelope com `motivoRecusa` e `mensagemRecusaPt`
visíveis**.

**Interpretação adotada** (precedência: estado executável observado > mapa):
a direção é **fail-closed** — nada indevido é publicado, e `null` é definido
pelo contrato como "trate como não acionável". O problema não é exposição; é
que **a razão nomeada da recusa desaparece da resposta**. Isso toca
`QAS-0023` (*"count of degradations with no user-visible representation
(must be zero)"*): uma recusa que vira `null` silencioso é uma degradação sem
representação — a mesma classe de `LAC-L2`, e a soma das duas mantém a
contagem acima de zero.

**Por que não foi fechado nesta rodada.** Fechá-lo exige **desenho**, não
ajuste: seria preciso decidir como uma recusa concilia com autoridade quando,
por construção, ela não tem modo de ativação a conciliar — por exemplo, um
predicado de conciliação distinto para `nao_avaliada`, ou um envelope de
recusa que carregue a identidade do artefato de outra forma. Qualquer uma das
duas muda o que o serviço afirma sobre uma recusa, e isso é matéria de
`ADR-0008` §8.3 ("recusa nunca é no-fire silencioso") + `ADR-0007`, não de um
agente.

> **Pendência de decisão — quem fecha `ACH-O3-15`.** *Quem decide:* o dono de
> `ADR-0008` (semântica de recusa e sua visibilidade) com o dono de
> `ADR-0007` (o que identifica o artefato de regra numa recusa). *Que
> evidência fecharia:* um desenho aceito de conciliação para
> `desfecho: "nao_avaliada"`, mais teste ponta a ponta provando que a recusa
> chega à resposta **com o motivo nomeado** e sem abrir caminho para o
> envelope forjado que `ACH-O3-3`/`ACH-O3-5` fecharam. *Efeito bloqueante
> hoje:* `QAS-0023` não pode ser declarado satisfeito.
> `owner: UNASSIGNED — VALIDATION REQUIRED`.

### 10.6 `ACH-O3-8` — ABERTO (novo): o cursor de outbox mede o volume de escrita de todos os tenants

`OBSERVED` (`packages/persistencia/src/migrations/0001_init.sql:266-290`,
lido por este agente): `outbox_events.id` é **`bigserial` primary key** —
uma sequência **global**, compartilhada por todos os tenants; o comentário
imediatamente acima da tabela explica que é justamente a monotonicidade
global que faz a ordenação por `ordering_scope` funcionar sem sequência por
escopo. A RLS está ligada e forçada
(`outbox_events_tenant_isolation`), e `grant usage, select on all sequences`
é concedido ao papel de aplicação.

**Nenhuma linha vaza.** O achado é de **canal lateral**, e é exatamente o que
§6 item 5 deste documento já declarava não cobrir ("Sem canal lateral"): o
cursor entregue a um tenant em `GET /v1/eventos/stream` é um número da
sequência global, então a **diferença entre dois cursores consecutivos**
mede o volume de escrita de **todos os outros tenants** no intervalo. Para
uma plataforma multi-instituição, isso é informação comercial e
epidemiológica sobre terceiros derivada de um identificador legítimo.

**Por que não foi fechado nesta rodada.** Fechá-lo é **topologia**: ou um
cursor escopado por tenant (sequência por tenant, ou coluna de posição
derivada dentro do escopo), ou um cursor **opaco** (token cifrado/HMAC que
não revele a posição global). A primeira opção muda o esquema de persistência
e a garantia de ordenação declarada em `ADR-0010` B3; a segunda reintroduz a
custódia de chave de `ADR-0007` C5, **ABERTA**. As duas mudam o contrato de
`x-pendencias` do `asyncapi.yaml`.

> **Pendência de decisão — quem fecha `ACH-O3-8`.** *Quem decide:* o dono de
> `ADR-0010` (backbone de outbox e garantias de ordenação/entrega) com o dono
> de `ADR-0016` (isolamento por tenant), e — se a saída escolhida for cursor
> opaco — a mesma autoridade de custódia de chave que `ADR-0007` C5 aguarda.
> *Que evidência fecharia:* um desenho aceito de cursor, mais teste
> adversarial de dois tenants provando que o cursor de um **não varia** com a
> escrita do outro. *Efeito bloqueante hoje:* `SEC-0009` (isolamento
> cross-tenant incluindo canais laterais) não pode ser declarado satisfeito —
> o que já era verdade por `ACHADO-01`, e agora por uma segunda via
> independente. `owner: UNASSIGNED — VALIDATION REQUIRED`.

### 10.7 O que este adendo NÃO faz, e sob que números ele foi escrito

**Não fecha nada além do que nomeia.** Não fecha `ACH-O3-1` (§9, §9.1),
`ACH-O3-8`, `ACH-O3-15`, `ACHADO-01`, `ACHADO-02`, `ACHADO-03`, nem
`SAF-0019`/`SEC-0028`. Não fecha nem aproxima o **Gate G6** — §7 permanece
integralmente válida. Não marca nenhuma ADR como `implemented`/`verified`;
`ADR-0007` C5 continua **ABERTA**. Não aceita risco residual, não nomeia
owner, não usa `DECIDED`, e não resolve nenhuma das duas pendências de
decisão acima.

**Os fechos reduzem exposição medida — e é só isso que este documento pode
escrever.** `ACH-O3-3`, `ACH-O3-4`, `ACH-O3-5` e `ACH-O3-7` **não** fecham
`HAZ-0005`, `HAZ-0001`, `HAZ-0002` nem `QAS-0023`. Uma mitigação só conta
quando implementada, testada **e validada com humanos** (`ADR-0004` V10).

**Estado factual duro, inalterado:** 0 vias clínicas acionáveis; 47/47
inelegíveis; `Observation` da AMH não consumível; relação com a AMH =
candidato a integração; safety case **M0**; nenhum dado real acessado (100%
sintético, prefixo `SYNTH-`). Nenhum gate aprovado, nenhum `MG-*` satisfeito.

**Números sob os quais este adendo foi escrito — cada um com o comando que o
produz** (medição do **orquestrador** desta sessão, com a máquina ociosa;
**este agente não executou nenhum deles**, e a distinção importa porque um
revisor mostrou que dois números vinham sendo confundidos):

| Comando | Resultado relatado |
|---|---|
| `pnpm verify` | exit **0** — **1.883 passed \| 1 skipped** |
| `pnpm --filter @intensicare/persistencia test` (pacote inteiro, contra PostgreSQL 16.14 real) | **99/99** |
| `pnpm test:fronteira` (**um arquivo**, não o pacote) | **63/63** |
| `pnpm --filter @intensicare/web test:e2e -- --workers=1` | **38/38** |
| `node scripts/check_contratos.mjs` | **208 verificações** relatadas pelo orquestrador — ver a divergência abaixo |
| `node scripts/check_contratos.mjs autoteste` | **35 casos** |

**`99/99` e `63/63` são escopos diferentes e não devem ser somados nem
trocados** — o primeiro é o pacote `persistencia` inteiro, o segundo é o
arquivo de fronteira. Onde este documento escrever um número, ele nomeia o
comando que o produz.

**Divergência registrada, não resolvida em silêncio — 208 × 209.** *Fonte A:*
o orquestrador desta sessão relatou **208 verificações** para
`pnpm check:contratos`. *Fonte B:* este agente executou
`node scripts/check_contratos.mjs` sobre o working tree ao final da sessão e
obteve **209 verificações** (`0 pendência(s) declarada(s)`, exit 0). *Impacto:*
nenhum — o gate passa nos dois casos, e nenhuma alegação deste documento
depende do número exato. *Interpretação adotada* (precedência: estado
executável observado > relatório de evidência): o número corrente é **209**;
a diferença é compatível com uma verificação acrescentada por outro agente
entre a medição do orquestrador e o fim da sessão, mas **isso é hipótese, não
medida** — nenhuma execução intermediária foi preservada para confirmá-la.
*Verificação auxiliar feita por este agente:* rodando o mesmo gate com
`--raiz` apontando para uma cópia em que **apenas** o catálogo de eventos é a
versão de `HEAD` (isto é, sem as edições documentais desta rodada), o
resultado também é **209** — logo a divergência **não** foi introduzida pelas
edições de `docs/**` desta rodada. Nenhuma autoridade é necessária para
dispor deste item; ele fica registrado para que o próximo leitor não trate
"208" como o número corrente.

> **Correção (2026-08-19, especialista de consistência documental e
> rastreabilidade).** A tabela e o parágrafo acima registram os números sob
> os quais este adendo foi escrito (2026-08-18) e **permanecem como estavam**
> — não são reescritos; é o registro histórico correto para aquela data.
> Desde então, `scripts/check_contratos.mjs` ganhou a Parte G3 (comparação da
> FORMA dos schemas REST, não só dos enums — sete pares interface×schema,
> `ADR-0021`), e a contagem cresceu de novo por motivo **legítimo e
> nomeado**, não por deriva silenciosa. Medido por este agente, executando
> diretamente `node scripts/check_contratos.mjs` e
> `node scripts/check_contratos.mjs autoteste` sobre o working tree desta
> data: **258 verificações** (`0 pendência(s) declarada(s)`, exit 0) e **99
> casos** de autoteste — não mais 209/35. Nenhuma alegação deste documento
> depende do número exato (mesma nota do parágrafo acima); nenhum gate foi
> aprovado por esta correção. Quem procurar "209" ou "35 casos" como o valor
> **corrente** deve ler **258**/**99**; "209"/"35" seguem corretos apenas
> como o registro histórico de 2026-08-18.

### 10.8 Provenance deste adendo

| Campo | Valor |
|---|---|
| `label` | Misto por subseção — 10.1 a 10.4 e 10.6: `OBSERVED` (leitura direta do código-fonte e dos testes citados linha a linha); 10.5: `OBSERVED` quanto às duas fontes citadas, `INFERENCE` quanto ao impacto sobre `QAS-0023`; os blocos de pendência em 10.5/10.6: `VALIDATION REQUIRED`; 10.7: declarativo (escopo negativo) + números relatados pelo orquestrador, não medidos por este agente |
| `source_repo` | `intensicare-V2` |
| `path_or_url` | `apps/api/src/regras/exposicao.ts`; `apps/api/src/regras/tipos.ts`; `apps/api/src/regras/autoridade.test.ts`; `apps/api/src/routes.ts`; `apps/api/src/db.ts`; `apps/api/src/db.test.ts`; `packages/persistencia/src/migrations/0001_init.sql`, `0002_g7_integration.sql`; `packages/contratos/openapi.yaml` |
| `commit_sha_or_version` | `700b13e` (base de leitura); correções desta sessão lidas no working tree da branch `codex/lacunas-frontend-a11y` |
| `section_or_lines` | `exposicao.ts:55-92,368-400,445-462,493-584,587-604`; `tipos.ts:95,99`; `autoridade.test.ts:393-523`; `routes.ts:200-229`; `db.ts:420,481-484`; `db.test.ts:255-311,415-668`; `0001_init.sql:266-290`; `0002_g7_integration.sql:72` |
| `date_collected` | 2026-08-18 |
| `collector` | agente de consistência documental e rastreabilidade (esta sessão, branch `codex/lacunas-frontend-a11y`) |
| `transformation` | achados relatados por três revisores adversariais somente-leitura, cada um **reproduzido por leitura do código atual** por este agente antes de ser escrito aqui; citações entre aspas são cópia literal do código ou do teste, sem tradução de sentido técnico; nenhum teste foi executado por este agente |
| `confidence` | high para 10.1-10.4 e 10.6 (leitura direta); medium para o alcance de `HAZ-0005` em §9.1 item 2 (a renderização foi lida em `DetalhePaciente.tsx`, o efeito clínico não foi validado com humano algum) |
| `owner` | UNASSIGNED — VALIDATION REQUIRED |
| `validation_status` | VALIDATION REQUIRED |
