---
doc_id: CONF-V1-MAPEAMENTO-SEMANTICO
title: Mapeamento semântico campo a campo — envelope do contrato v1 e resposta de resolve → modelo canônico V2
status: PROPOSAL
owner: UNASSIGNED — VALIDATION REQUIRED
collector: engenheiro de camada anticorrupção e conformidade AMH (ciclo 1)
source: >
  docs/08-interoperability/amh-data/contract-v1/eventos-ciclo-de-vida-identidade.md §2 (envelope de
  11 campos, invariantes 1-6), §3 (ordenação/entrega/replay) e §4 (resolve);
  docs/08-interoperability/amh-data/contract-v1/memoria-de-desenho.md §5 (minimização 28→11);
  docs/06-architecture/adrs/ADR-0005-modelo-canonico-*.md §5.2 cláusulas M1-M10 (status proposed);
  docs/06-architecture/adrs/ADR-0004-identidade-paciente-encontro-mpi.md §5.2 e §5.2.1
  (status under-review); docs/03-domain/invariants/DOM-invariants.md (DOM-0002, DOM-0004,
  DOM-0006, DOM-0008, DOM-0009); INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §3 regras 6-8 e §7.6
date_collected: 2026-08-15
last_updated: 2026-08-15
---

# Mapeamento semântico — contrato v1 → modelo canônico V2

> **Status: PROPOSAL.** Mapeamento **de desenho**, verificado apenas contra texto de minuta e
> fixtures sintéticas. **Não é evidência de compatibilidade**: nenhum campo foi observado em
> mensagem real, em ambiente algum. Camadas de evidência 2, 3 e 4 permanecem vazias.

## 1. O alvo canônico — e a honestidade sobre seu estado

| Alvo | ADR | Estado real | Consequência para este mapeamento |
|---|---|---|---|
| Forma canônica do fato clínico (chave, tempos, proveniência, qualidade, correção) | **ADR-0005** | **`proposed`** — §5 declara *"NENHUMA DECISÃO ESTÁ REGISTRADA"* | O alvo é uma **minuta normativa** (M1-M10). Mapear para ela é legítimo como desenho; **não** produz conformidade |
| Modelo de identidade de sujeito/encontro e semântica de merge/unmerge | **ADR-0004** | **`under-review`** | idem; §5.2 e §5.2.1 são a referência de semântica de identidade do lado V2 |
| Semântica de status de avaliação | **ADR-0008** | **`accepted` (2026-08-15, GDEC-0007)** — arquivo em **estado de working tree não commitado** na leitura | Único alvo aceito. Consumido em [`mapa-duas-dimensoes-status.md`](./mapa-duas-dimensoes-status.md), não aqui |

**INFERENCE.** O mapeamento semântico do Gate G3 exige um alvo canônico aceito. O ADR-0005 §1
registra a mesma dependência pelo outro lado: *"o mapeamento semântico do Gate G3 (campo a campo,
com contabilidade de perda — §7.6) não tem alvo enquanto o modelo canônico não existir"*. Este
documento é, portanto, **mapeamento contra alvo proposto**, e assim se rotula em cada linha.

## 2. As quatro regras que governam todo mapeamento abaixo

1. **Envelope retido imutável.** O envelope recebido é preservado byte a byte antes de qualquer
   tradução (ADR-0005 M1; DOM-0006). Todo campo desconhecido, e o bloco `_fixture` das fixtures,
   permanecem no envelope retido — a tolerância a campos adicionais (invariante 6 do contrato)
   **não** autoriza descarte.
2. **Jamais coerção.** Campo ausente, malformado, desconhecido ou fora de vocabulário vai para
   **quarentena com razão** — nunca para valor default, nunca para "mais próximo", nunca para
   descarte silencioso (regra §3-7; DOM-0004; ADR-0005 M5/M6/M7; HAZ-0032).
3. **Jamais inventar tempo.** Nenhum ponto de tempo ausente é substituído por "agora", pelo
   tempo de recebimento ou por instante vizinho (regra §3-8; DOM-0009; HAZ-0007).
4. **Perda declarada, nunca silenciosa.** O que não sobrevive ao mapeamento é enumerado no §4 e
   registrado na proveniência da tradução — a ausência de um campo no modelo canônico jamais é
   descoberta depois, por acidente.

## 3. Envelope de 11 campos — mapeamento campo a campo

Colunas: **Card.** = cardinalidade declarada no contrato · **Nulo/ausente** = o que a camada
anticorrupção deve entender quando o valor é `null` ou o campo não vem · **Alvo canônico** =
onde o valor pousa no modelo proposto · **Perda** = ver §4.

| # | Campo | Tipo declarado | Card. | Significado de nulo/ausente | Alvo canônico (ADR-0005 proposto / ADR-0004 under-review) | Perda |
|---|---|---|:--:|---|---|---|
| 1 | `event_id` | UUID | 1..1 | **Ausente ⇒ mensagem inválida** (envelope mínimo violado). Nunca reutilizado | Identidade do registro de evento de identidade; referenciável pela cadeia de alias de `resolve` (§5) | — |
| 2 | `event_type` | enum de 6 valores | 1..1 | **Ausente ⇒ inválida.** Valor fora do enum ⇒ **deriva de contrato**, não mensagem a interpretar | Tipo da transição, **preservado na proveniência** mesmo quando duas transições convergem para a mesma forma canônica (§4 L-11) | — |
| 3 | `event_type_version` | string (`"1"`) | 1..1 | **Ausente ⇒ inválida.** Versão desconhecida ⇒ quarentena + alarme (nunca "tentar mesmo assim") | Versão do esquema de origem na proveniência da tradução (ADR-0005 M1: *versão de mapeamento*) | **L-09** |
| 4 | `idempotency_key` | string | 1..1 | **Ausente ⇒ inválida** — fixture `alias.missing-idempotency-key.invalid.json`. Sem ela, entrega ao-menos-uma-vez não é deduplicável | Chave de idempotência do fato de identidade (ADR-0005 M9: *derivada do contrato de fonte, jamais de heurística sobre dados do paciente* — HAZ-0009) | — |
| 5 | `amh_tenant` | string | 1..1 | **Ausente ⇒ inválida.** Valor fora da enumeração pinada da IG ⇒ **rejeita fail-closed**, nunca "aceita e resolve depois" | Componente `tenant` da chave canônica `(tenant, PSR, encontro)` (ADR-0005 M2), **após verificação contra o escopo autorizado** — ver [`mapeamento-seguranca-tenant.md`](./mapeamento-seguranca-tenant.md) §3 | — |
| 6 | `legal_entity` | string | 1..1 | **Ausente ⇒ inválida.** Compõe o escopo de estabilidade do PSR `{amh_tenant, legal_entity}` | Escopo de estabilidade da ref; qualquer transição que cruze o par é **violação**, não fato a aplicar | — |
| 7 | `subject_ref_antiga` | PSR opaco `amh:psr:v1:<uuidv4>` | 1..1 | **Ausente ⇒ inválida.** Formato inválido ⇒ quarentena (nunca normalização "quase certa") | Ref de origem da transição na malha de refs; nunca é chave de fato clínico por si só (a chave exige encontro — M2) | **L-03** |
| 8 | `subject_ref_nova` | PSR opaco | 0..1 | **`null` é significativo e permitido SOMENTE em `identity.erasure.v1`** (invariante 5): significa *"não há sucessor"*. `null` em qualquer outro tipo ⇒ inválida. **Ausente ≠ `null`**: ausente é falta de campo, `null` é afirmação de inexistência de sucessor | Ref de destino; em `erasure`, marca de aposentadoria (`retired`) sem sucessor (ADR-0004 §5.2: *ref aposentado, nunca reutilizado, nunca apagado*) | **L-08** |
| 9 | `occurred_at` | timestamp UTC | 1..1 | **Ausente ⇒ inválida.** É o **tempo do fato**: a única base de ordenação por sujeito (§3 do contrato) e de `as_of` no replay | Ponto de tempo **observado/efetivo** do fato de identidade (ADR-0005 M3) | **L-01** |
| 10 | `emitted_at` | timestamp UTC | 1..1 | **Ausente ⇒ inválida.** `emitted_at >= occurred_at` sempre — fixture `unmerge.emissao-antes-do-fato.invalid.json` | Ponto de tempo **emitido** (M3). O tempo **recebido** e o **persistido** são gerados pela V2 e nunca confundidos com estes | **L-01** |
| 11 | `correction_of` | UUID | 0..1 | **Ausente/`null` ⇒ "este evento não corrige nenhum outro"** — não é desconhecido, é afirmação de originalidade. **Obrigatório em `restore`** | Relação explícita de correção/supersessão (ADR-0005 M8: *correção nunca sobrescreve nem apaga*; DOM-0002) | **L-12** |

### 3.1 Invariantes verificáveis no ponto de entrada

**SOURCE** — as seis invariantes do envelope (`eventos-ciclo-de-vida-identidade.md` §2), com a
fixture inválida que cada uma exercita:

| # | Invariante | Fixture inválida | Ação da camada anticorrupção |
|---|---|---|---|
| 1 | Nenhum identificador de fonte cru atravessa a fronteira | `erasure.identificador-de-fonte-cru.invalid.json` | **Rejeita e alarma.** Um identificador de fonte no envelope é violação de contrato **e** de política de dados (AQ-4/XRD-05) — nunca "aceita e ignora o campo extra" |
| 2 | `idempotency_key` obrigatória | `alias.missing-idempotency-key.invalid.json` | Quarentena; sem chave não há dedup e o replay deixa de ser determinístico |
| 3 | Em `merge`, `subject_ref_nova ≠ subject_ref_antiga` | `merge.ref-nova-igual-antiga.invalid.json` | Quarentena; evento sem efeito é defeito do produtor, não *no-op* a absorver |
| 4 | `emitted_at >= occurred_at` | `unmerge.emissao-antes-do-fato.invalid.json` | Quarentena; **jamais** "corrigir" invertendo os campos (HAZ-0026) |
| 5 | `subject_ref_nova = null` válido só em `erasure` | *(sem fixture dedicada)* | Quarentena nos demais tipos |
| 6 | Campos adicionais desconhecidos não invalidam (*tolerant reader*) | *(exercitada pelo bloco `_fixture` de toda fixture)* | **Aceita, retém e CONTA.** Campo novo é sinal de deriva (`deteccao-mudanca-contrato.md` D3), nunca ruído a descartar |

**INFERENCE.** A invariante 6 e a regra de deriva não se contradizem: *tolerant reader* significa
**não falhar**, não significa **não notar**. Um consumidor que ignora silenciosamente campos novos
perde o único sinal barato de que o produtor mudou.

## 4. Contabilidade de perda — o que **não** sobrevive ao mapeamento

Cada item declara: o que se perde, por quê, qual a consequência, e o que a V2 faz para que a
perda não vire erro silencioso.

| ID | Perda | Causa | Consequência | Mitigação proposta |
|---|---|---|---|---|
| **L-01** | **Offset original, precisão original e valor-fonte cru dos tempos.** O contrato declara `occurred_at`/`emitted_at` como *timestamp UTC*; o ADR-0005 M3 exige **UTC normalizado + offset original + precisão original + valor-fonte cru + fuso identificado** | O envelope v1 carrega apenas o instante normalizado | A V2 preserva o texto **como recebido** (envelope imutável), mas o offset/precisão **anteriores à normalização AMH** são irrecuperáveis. Um fato originado com precisão de dia chega indistinguível de um com precisão de segundo | (a) Preservar literalmente a cadeia recebida; (b) **jamais** inferir precisão; (c) registrar a limitação na proveniência da tradução; (d) **CONF-Q-05** ao dono AMH: o envelope pode carregar o valor-fonte do tempo? Seria mudança **compatível** (campo opcional novo) |
| **L-02** | **Dimensão de qualidade de fonte.** O envelope não tem campo de qualidade (`valid \| warning \| quarantined`) | Minimização deliberada; a dimensão nunca foi proposta para eventos de identidade | A V2 recebe **nenhuma** dimensão 1 para IF-01..IF-06 — exatamente a hipótese H1 do ADR-0005 (*"a lane FHIR não carrega sinal de qualidade"*), aqui **confirmada por desenho** para esta lane | `quality: unknown` **explícito** na proveniência, fail-closed conforme a última linha da matriz M4 do ADR-0005 — **jamais** default silencioso a `valid` (HAZ-0040). Detalhado em [`mapa-duas-dimensoes-status.md`](./mapa-duas-dimensoes-status.md) |
| **L-03** | **Qualificação de encontro.** Eventos de identidade operam sobre a ref, **sem** encontro (decisão explícita: *"eventos de ciclo de vida e `resolve` operam sobre a ref em si"*) | Desenho do contrato | A chave canônica é `(tenant, PSR, encontro)` (M2). Aplicar uma transição de ref exige **percorrer todos os fatos daquele PSR** naquele tenant. Esse alcance é **cálculo da V2**, não afirmação da fonte | Registrar o alcance como **proveniência derivada pela V2**, nunca como fato de origem; nenhum fato passado é re-chaveado (ADR-0004 §5.2: *avaliações anteriores mantêm o sujeito com que foram computadas*) |
| **L-04** | **Linhagem de fonte** (7 campos do padrão Maezo excluídos: vendor, produto, instância, tenant/entidade de origem, posição, ref de registro protegido) | Exclusão deliberada (`memoria-de-desenho.md` §5): linhagem é assunto interno do produtor | A V2 **não pode** auditar *qual sistema de origem* causou a transição. Numa investigação de incidente de identidade, o lado consumidor chega até o `event_id` e para | Aceita como consequência de AQ-4 (só refs opacas atravessam). Registrada para que a investigação conjunta seja **prevista** no procedimento de incidente (que permanece VALIDATION REQUIRED no manifesto) |
| **L-05** | **Agrupamento causal.** Sem `correlation_id`/`causation_id`, um fato upstream que gere **vários** eventos (p.ex. um merge que produza N arestas de alias) chega como N mensagens sem chave comum | Exclusão deliberada do mínimo | A V2 não pode afirmar "estes N eventos são um fato". Agrupar por `occurred_at` + par de refs seria **heurística sobre identidade** — proibido (M9 proíbe chave heurística; HAZ-0009 é o precedente legado) | **Não agrupar.** Cada evento é aplicado individualmente; a malha converge pela ordem por sujeito. Registrado como **CONF-Q-06**: agrupamento causal é mudança compatível se a AMH quiser oferecê-lo |
| **L-06** | **Vínculo por mensagem ao contrato.** Sem `contract_manifest_digest` nem `payload_hash` na mensagem | Exclusão deliberada do mínimo | Deriva só é detectável **na verificação do pin**, não por mensagem. Uma mensagem produzida sob manifesto diferente é indistinguível de uma sob o manifesto pinado | Detecção fica concentrada no pin + em sinais indiretos (campo novo, versão nova, campo obrigatório ausente) — ver [`deteccao-mudanca-contrato.md`](./deteccao-mudanca-contrato.md) §3 |
| **L-08** | **Distinção `null` × ausente**, se o adaptador normalizar as duas para "sem valor" | Risco de implementação, não do contrato | `subject_ref_nova: null` em `erasure` **afirma** que não há sucessor; ausente seria envelope quebrado. Colapsar as duas transforma defeito em fato | Modelar como três estados distintos no tipo interno: **presente**, **nulo-afirmado**, **ausente**; ausente nunca chega ao domínio (é quarentena) |
| **L-09** | **Duas fontes de verdade para a versão**: o sufixo `.v1` em `event_type` e o campo `event_type_version`. Se discordarem, o contrato não diz qual prevalece | Redundância do desenho | Ambiguidade em deriva: `identity.alias.v2` com `event_type_version: "1"` é indefinido | **Fail-closed:** discordância entre os dois ⇒ quarentena + alarme de deriva, jamais escolha de um deles. **CONF-Q-07** ao dono AMH |
| **L-10** | **Alcance da reatribuição.** O envelope de `identity.reassignment.v1` carrega apenas ref de origem e de destino. A `eventos-ciclo-de-vida-identidade.md` §1 descreve *"a associação da ref à identidade subjacente foi corrigida (fatos reatribuídos)"*; o ADR-0004 §5.2.1 descreve *"um encontro é re-vinculado a outro sujeito"* — **duas descrições diferentes**, e o envelope **não tem campo de encontro** | Lacuna real entre os dois textos | Sem alcance explícito, aplicar a reatribuição a **todos** os fatos da ref de origem pode mover fatos que não foram reatribuídos (**HAZ-0001**, paciente errado) e deixar de mover os que foram (**HAZ-0002**, encontro errado). Esta é a perda de maior consequência clínica deste mapeamento | **Fail-closed obrigatório:** enquanto o alcance não for explícito no contrato, `identity.reassignment.v1` é **quarentenado**, e os fatos da ref de origem são marcados como **identidade em revisão** — visíveis, não avaliáveis como se nada tivesse ocorrido. **CONF-Q-08**, ligado ao ponto N-8 (o tipo sequer está confirmado) |
| **L-11** | **Convergência de tipo.** Para o consumidor, `alias` e `merge` produzem a mesma transição observável ("a ref antiga passa a resolver para a nova"; ADR-0004 §5.2: *merge = aliases do lado AMH; o consumidor não quebra*) | Semântica do produtor | Se o adaptador mapear ambos para uma única forma canônica **sem reter o tipo**, perde-se a distinção auditável entre "unificação de identidades" e "aliasing" | **Não é perda se o tipo de origem for retido** na proveniência — e é o que este mapeamento exige (campo 2 da tabela §3) |
| **L-12** | **Ambiguidade `unmerge` × `restore` para um merge indevido.** `unmerge` = *"um merge anterior foi desfeito (split)"*; `restore` = *"um evento anterior (p.ex. erasure ou **merge indevido**) foi revertido"* — os dois cobrem o mesmo caso | Sobreposição nos textos da minuta | Dois eventos diferentes podem descrever o mesmo fato; um consumidor que trate cada um de modo distinto diverge da AMH sem que ninguém perceba | Tratar ambos pela **relação `correction_of`**, não pelo nome do tipo; divergência entre os dois caminhos é detectável pela equivalência replay ⇔ `resolve` (CTS-11). **CONF-Q-09** ao dono AMH |

**Nota de honestidade.** Não existe item `L-07`: o identificador foi reservado durante a redação
e não corresponde a nenhuma perda identificada. Deixá-lo vago seria pior que declarar o vão.

## 5. Resposta de `resolve(ref, as_of)` — mapeamento dos elementos semânticos

**OBSERVADO (na minuta).** A `eventos-ciclo-de-vida-identidade.md` §4 especifica a **semântica** da
operação; **não** especifica um esquema de resposta campo a campo. Portanto o mapeamento abaixo é
**semântico**, e o mapeamento **de campo** permanece `VALIDATION REQUIRED` — não há campos para
mapear.

| Elemento da resposta (semântico) | Card. proposta | Significado de ausência | Alvo canônico | Perda / observação |
|---|:--:|---|---|---|
| Resolução vigente em `as_of` ("a que esta ref se referia naquele instante") | 1..1 nos casos de sucesso | Ausência ⇒ resposta incompleta ⇒ **trata-se como negativa**, nunca como "resolve para si mesma" | Estado da malha de refs no instante `as_of` | — |
| **Cadeia de alias aplicável** — sequência ordenada de transições com `event_id` e `occurred_at` | 0..* | Cadeia vazia = "nenhuma transição até `as_of`", **afirmação**, não desconhecimento | Trilha auditável; cada `event_id` é **cruzável** com IF-01..IF-06 recebidos — base do teste de equivalência (CTS-11) | Não carrega `idempotency_key` nem `emitted_at`: o cruzamento é por `event_id` apenas |
| Condição `nao-mintada-em-as_of` | condicional | — | A V2 trata como **"sujeito inexistente naquele instante"** — estado explícito, jamais "sem dados logo normal" (DOM-0004) | — |
| `status: retired` + data do fato (pós-erasure) | condicional | — | Distingue **"sujeito eliminado"** de **"ref desconhecida"** (ADR-0004 §5.2: ref aposentada, mapeamento de origem rompido) | — |
| Negativa fail-closed com condição explícita (ref desconhecida, malformada, fora de escopo, `as_of` fora de janela) | condicional | Negativa **sem** condição explícita ⇒ tratar como falha de contrato | Cada condição vira razão codificada distinta — ver `mapa-duas-dimensoes-status.md` §5 | A **janela suportada** de `as_of` não é declarada (**CONF-Q-03**) |
| *(ausente do contrato)* Eco de `as_of` na resposta | — | — | — | **L-13**: sem eco, a V2 não pode verificar, a partir do payload, que a resposta corresponde ao `as_of` pedido. Consequência em cache/replay: uma resposta "atual" servida a um pedido histórico é indetectável pelo conteúdo. **Mitigação:** a V2 correlaciona pedido↔resposta no seu próprio registro e **nunca** cacheia resposta de `resolve` sem a chave `(ref, as_of)` completa |
| *(ausente do contrato)* Eco de `{amh_tenant, legal_entity}` na resposta | — | — | — | **L-14**: o escopo da resposta só é verificável pelo canal autorizado, não pelo conteúdo. Ver [`mapeamento-seguranca-tenant.md`](./mapeamento-seguranca-tenant.md) §4 |

**PROPOSAL — regra de determinismo do consumidor.** O contrato declara `as_of` opcional (*"se
omitido, assume o instante da consulta"*). A camada anticorrupção da V2 **sempre** envia `as_of`
explícito, inclusive fora de replay: uma chamada sem `as_of` não é reprodutível e não pode
sustentar DOM-0003. A porta `PORTA-RESOLVE` **não expõe** a forma sem `as_of` ao núcleo clínico.

## 6. Proveniência preservada

**PROPOSAL**, elaborando ADR-0005 M1 (*uma cadeia, imutável: fonte, envelope, transformação,
versão de mapeamento, coletor*). Para cada transição de identidade aplicada, a V2 retém:

| Elemento | Conteúdo | Por quê |
|---|---|---|
| Envelope de origem | Bytes recebidos, íntegros, incluindo campos desconhecidos | Replay campo a campo (DOM-0006); base para reprocessar sob mapeamento corrigido sem repedir à AMH |
| Identidade da mensagem | `event_id` + `idempotency_key` | Dedup, auditoria e cruzamento com a cadeia de alias de `resolve` |
| Tempos | `occurred_at`, `emitted_at` **como recebidos**, mais os tempos **recebido** e **persistido** gerados pela V2, em campos distintos | M3; jamais confundir tempo de fonte com tempo de pipeline (HAZ-0007) |
| Versão de contrato | `event_type_version` + versão do manifesto **pinado** no momento do consumo | Permite dizer "sob qual contrato isto foi interpretado" — condição de replay honesto |
| Versão de mapeamento | Versão da própria camada anticorrupção que traduziu | Uma correção de mapeamento é reprocessável e **datável**; sem isso, "reinterpretamos" vira reescrita de história |
| Qualidade de fonte | `unknown` **explícito** (L-02) | A ausência da dimensão 1 é um fato registrado, não um vazio |
| Alcance derivado | Quais fatos a V2 considerou afetados pela transição, e por qual regra | Distingue afirmação da fonte de cálculo do consumidor (L-03) |

**Projeção, não estado primário.** A malha de refs é uma **projeção reconstruível** dos eventos
(DOM-0006). Nenhum fato clínico é re-chaveado por uma transição: correção é sempre aditiva
(ADR-0005 M8; ADR-0004 §5.2, *"eventos históricos não são reescritos"*).

## 7. Regras de não-coerção específicas desta fronteira

| Situação | **Proibido** | **Obrigatório** |
|---|---|---|
| PSR malformado | "Normalizar" para o formato esperado | Quarentena com razão; ref bem-formada porém desconhecida ⇒ `not_evaluated` (ADR-0004 §5.2, regra vinculante derivada) |
| Tenant fora da enumeração pinada | Aceitar e resolver depois | Rejeição fail-closed |
| Versão de evento desconhecida | Interpretar "por parecer com a v1" | Quarentena + alarme de deriva |
| `emitted_at < occurred_at` | Inverter, corrigir ou tolerar | Quarentena (HAZ-0026) |
| Campo obrigatório ausente | Preencher com default | Quarentena |
| Campo adicional desconhecido | Descartar silenciosamente | Reter, contar, sinalizar deriva |
| `resolve` indisponível | Degradar para "resolução atual" | Estado explícito de indisponibilidade; nunca resposta aproximada (§4 do contrato: *nunca degrada para resolução "atual"*) |
| Reatribuição sem alcance explícito | Aplicar a todos os fatos da ref | Quarentena + marcação de identidade em revisão (L-10) |

## 8. Questões abertas deste documento

| # | Questão | Para quem | Ligação |
|---|---|---|---|
| **CONF-Q-05** | O envelope pode carregar valor-fonte/offset/precisão dos tempos? (mudança compatível) | Dono AMH | L-01; ADR-0005 M3 |
| **CONF-Q-06** | Haverá chave de agrupamento causal para fatos que geram múltiplos eventos? | Dono AMH | L-05 |
| **CONF-Q-07** | Qual versão prevalece: sufixo de `event_type` ou `event_type_version`? | Dono AMH | L-09 |
| **CONF-Q-08** | Qual é o **alcance** de `identity.reassignment.v1` — a ref inteira ou encontros nomeados? | Titular + dono AMH | L-10; HAZ-0001, HAZ-0002; ponto N-8 |
| **CONF-Q-09** | Um merge indevido é revertido por `unmerge` ou por `restore`? | Dono AMH | L-12 |
| **CONF-Q-10** | A resposta de `resolve` ecoa `as_of` e o escopo `{tenant, entidade legal}`? | Dono AMH | L-13, L-14 |

Nenhuma destas questões é decidida aqui. Nenhuma entrada de registro foi criada.

---

*Redigido pelo engenheiro de camada anticorrupção e conformidade AMH (ciclo 1). Mapeamento contra
alvo **proposto** (ADR-0005) e alvo **em revisão** (ADR-0004), assim rotulado em cada seção.
Nenhuma decisão registrada; nenhum ADR editado; nada escrito em `contract-v1/` nem no repositório
AMH. Sem PHI, credenciais ou identificadores reais.*
