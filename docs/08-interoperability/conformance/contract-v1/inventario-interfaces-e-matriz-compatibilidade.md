---
doc_id: CONF-V1-INVENTARIO-INTERFACES
title: Inventário de interfaces do contrato AMH×IntensiCare v1 e matriz de compatibilidade por camada de evidência
status: PROPOSAL
owner: UNASSIGNED — VALIDATION REQUIRED
collector: engenheiro de camada anticorrupção e conformidade AMH (ciclo 1)
source: >
  docs/08-interoperability/amh-data/contract-v1/contract-manifest.draft.yaml (minuta, status DRAFT);
  docs/08-interoperability/amh-data/contract-v1/eventos-ciclo-de-vida-identidade.md §1-§4;
  docs/08-interoperability/amh-data/contract-v1/memoria-de-desenho.md §7-§9;
  docs/08-interoperability/amh-data/four-layer-dossier.md (definição das quatro camadas e veredictos);
  docs/08-interoperability/amh-data/contract-inventory.md §D e §E.2;
  docs/08-interoperability/amh-data/compatibility-finding.md;
  INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §7.1, §7.5, §7.6 e Gate G3
date_collected: 2026-08-15
last_updated: 2026-08-15
---

# Inventário de interfaces do contrato v1 e matriz de compatibilidade

> **Status: PROPOSAL.** Este documento é **desenho da camada anticorrupção**, não evidência de
> compatibilidade. Nenhuma linha abaixo eleva qualquer interface a "compatível". O achado
> corrente permanece, sem alteração: **candidato a integração; compatibilidade não demonstrada
> para avaliação de UTI acionável** (`compatibility-finding.md`; `contract-inventory.md` §E.5).

## 0. O que este documento é, e o que não é

| É | Não é |
|---|---|
| O inventário das interfaces que a **minuta** do contrato v1 propõe, com o estado de evidência de cada uma por camada 1-4 | Uma declaração de que qualquer interface existe, está implantada ou foi testada |
| O desenho das **portas versionadas** V2 atrás das quais essas interfaces seriam adaptadas (§7.6: *"Build AMH adapters behind versioned ports"*) | Uma escolha de transporte, protocolo, biblioteca ou stack — **decisão proibida** e sem ADR |
| A lista explícita do que faltaria, por interface, para subir de camada | Um plano de execução, um cronograma ou uma atribuição de dono |

**Nenhum código foi escrito.** A tarefa é desenho pronto para virar código *quando o stack for
decidido*; nenhum ADR de stack existe.

## 1. A regra epistêmica que governa a matriz

**SOURCE** (`INTENSICARE_V2_ORCHESTRATOR_PROMPT.md` §7.1, transcrita em `four-layer-dossier.md`
§0): *"Passar uma camada anterior nunca implica passar uma camada posterior."*

| Camada | Pergunta que responde | Evidência disponível para o contrato v1 |
|---|---|---|
| **1 — Contrato declarado** | O que a AMH **diz** que suas interfaces são? | **Nenhuma para estas sete interfaces.** O que existe é uma **minuta do lado V2** (PROPOSAL, não publicada pela AMH) e a semântica **interna** AMH-020b citada como FONTE via adjudicação |
| **2 — Capacidade implantada** | A interface é alcançável e autorizada em um ambiente nomeado? | **NENHUMA** |
| **3 — Dado povoado** | Tenants representativos têm recursos não vazios com distribuições significativas? | **NENHUMA** |
| **4 — Aptidão operacional** | Latência, completude, ordenação, correção, disponibilidade, replay e recuperação **medidos** | **NENHUMA** |

**OBSERVADO** (`contract-inventory.md` §E.2, tabela "Camadas de evidência que cada elemento ainda
não tem"): os elementos do contrato v1 estão marcados **DIRIGIDO**, com a leitura obrigatória
*"DIRIGIDO ≠ PASSA. Nenhum elemento passa camada alguma."*

**INFERENCE** (a partir do acima e de `memoria-de-desenho.md` §10): a coluna "camada 1" das
interfaces abaixo **não** pode ser lida como "camada 1 estabelecida". Ela registra apenas que
existe **texto de minuta do lado consumidor**. Uma camada 1 real exige o manifesto **publicado
pela AMH**, com digest, a partir de um commit produtor — o que a própria minuta declara
inexistente (`contract-manifest.draft.yaml`: `manifest_sha256: null`, `pinned: false`,
`aceito: false`).

## 2. Inventário de interfaces

Sete interfaces de consumo, mais um artefato de contrato que a camada anticorrupção também
precisa tratar como superfície verificável (IF-00).

| ID | Interface | Natureza | Direção | Porta V2 proposta | Fonte da definição |
|---|---|---|---|---|---|
| **IF-00** | Pacote de contrato v1 (manifesto + esquemas + fixtures) | Artefato pinável | AMH publica → V2 pina | `PORTA-CONTRATO` (verificação de pin e deriva) | `contract-manifest.draft.yaml` |
| **IF-01** | `identity.alias.v1` | Evento de ciclo de vida | AMH → V2 (empurra) | `PORTA-EVT-IDENT` | `eventos-ciclo-de-vida-identidade.md` §1 |
| **IF-02** | `identity.merge.v1` | Evento de ciclo de vida | AMH → V2 | `PORTA-EVT-IDENT` | idem |
| **IF-03** | `identity.unmerge.v1` | Evento de ciclo de vida | AMH → V2 | `PORTA-EVT-IDENT` | idem |
| **IF-04** | `identity.restore.v1` | Evento de ciclo de vida | AMH → V2 | `PORTA-EVT-IDENT` | idem |
| **IF-05** | `identity.reassignment.v1` | Evento de ciclo de vida | AMH → V2 | `PORTA-EVT-IDENT` | idem (**tipo pendente de confirmação** — divergência 5×6, ponto N-8) |
| **IF-06** | `identity.erasure.v1` | Evento de ciclo de vida | AMH → V2 | `PORTA-EVT-IDENT` | idem |
| **IF-07** | `resolve(ref, as_of)` | Operação ponto-no-tempo | V2 consulta → AMH (puxa) | `PORTA-RESOLVE` | `eventos-ciclo-de-vida-identidade.md` §4 |

**PROPOSAL — as duas portas de domínio.** A camada anticorrupção expõe ao núcleo clínico da V2
**apenas** duas portas versionadas, e nenhuma delas fala esquema AMH:

- `PORTA-EVT-IDENT` — recebe transições de identidade já traduzidas para o vocabulário V2 e
  aplica-as à **malha de refs** (projeção reconstruível). O núcleo clínico nunca vê
  `event_type`, `amh_tenant` nem `subject_ref_antiga`; vê "esta chave de sujeito passou a
  resolver assim, a partir deste instante do fato, com esta proveniência".
- `PORTA-RESOLVE` — responde "a que esta chave de sujeito se referia em `t`", com a cadeia de
  transições e a condição explícita quando não há resposta (nunca um palpite).

**Justificativa (SOURCE, §7.6):** *"Keep AMH schemas outside the clinical domain core."* O
ADR-0005 (proposto) §4 Opção C registra que avaliar diretamente sobre esquemas de origem
*"acopla o domínio clínico ao esquema da fonte — exatamente o que o §7.6 proíbe"*.

**Versionamento das portas (PROPOSAL).** Cada porta carrega versão própria, independente da
versão do contrato AMH: a versão da porta muda quando o **contrato interno V2** muda; a versão
do contrato AMH muda quando a AMH muda. A tradução entre as duas é exatamente o trabalho da
camada anticorrupção, e a matriz de correspondência entre versões é o artefato que
`deteccao-mudanca-contrato.md` mantém.

### 2.1 Interfaces deliberadamente **fora** deste inventário

Registradas para que ausência nunca seja lida como afirmação (`contract-manifest.draft.yaml`,
`explicit_exclusions`):

| Fora do escopo | Motivo (SOURCE) |
|---|---|
| Sinais vitais | Contradição C-1 aberta: o único profile de `Observation` da IG fixa `category` em `laboratory`, excluindo vitais por construção |
| `Observation` laboratorial | Excluída até evidência da OS-20 aceita pelo caminho **estruturado**; o caminho de texto livre está explicitamente fora |
| Replay/backfill/correção de **dados clínicos** e reconciliação | Garantias desconhecidas; **não confundir** com o replay de **eventos de identidade**, que é cláusula obrigatória e está em IF-01..IF-07 |
| Usos secundários (pesquisa, analytics, compartilhamento) | Bloqueados por AQ-3 até infraestrutura real de consentimento |
| Escrita V2 → AMH (*writeback*) | Fora do v1; exigiria contrato próprio |
| API de contexto Maezo | Padrão apenas, **não reuso** (`contract-inventory.md` A5) |

## 3. Matriz de compatibilidade — interface × camada de evidência

Legenda de estado: **MINUTA-V2** = existe texto proposto pelo lado consumidor, não publicado pela
AMH · **DIRIGIDO** = há decisão de direção do titular, sem artefato · **—** = sem evidência,
não avaliado · **N/D** = não aplicável nesta camada.

| ID | C1 declarado | C2 implantado | C3 povoado | C4 aptidão | Estado consolidado |
|---|:--:|:--:|:--:|:--:|---|
| **IF-00** pacote de contrato | **MINUTA-V2** (digests `null`, `pinned: false`, `aceito: false`) | — | N/D | N/D | **NÃO EXISTE como artefato AMH** (`contract-inventory.md` B0/§E.2) |
| **IF-01** alias | **MINUTA-V2** + semântica interna FONTE (AMH-020b) | — | — | — | **DIRIGIDO** — exposição a consumidor nunca foi requisito |
| **IF-02** merge | **MINUTA-V2** + FONTE | — | — | — | **DIRIGIDO** |
| **IF-03** unmerge/split | **MINUTA-V2** + FONTE (*split não reescreve histórico*) | — | — | — | **DIRIGIDO** |
| **IF-04** restore | **MINUTA-V2** + FONTE (*reversão é carimbada*) | — | — | — | **DIRIGIDO** |
| **IF-05** reassignment | **MINUTA-V2**, **tipo em disputa** (ata lista 5; OS-17 e lock listam 6) | — | — | — | **DIRIGIDO com pendência de teor** (N-8) |
| **IF-06** erasure | **MINUTA-V2** + FONTE (*retired, nunca deleta nem reutiliza*) | — | — | — | **DIRIGIDO** |
| **IF-07** `resolve(ref, as_of)` | **MINUTA-V2**; a garantia "toda ref já vista resolve para sempre" é FONTE, **a operação ponto-no-tempo não existe** | — | — | — | **DIRIGIDO** — nenhuma operação exposta; janela de `as_of` indefinida |

**Nenhuma interface passa camada alguma.** Nenhuma célula das colunas C2, C3 e C4 contém
evidência, e nenhuma pode ser inferida da coluna C1.

### 3.1 O que faltaria, por interface, para subir de camada

| ID | Para C1 real (declarado pela AMH) | Para C2 | Para C3 | Para C4 |
|---|---|---|---|---|
| **IF-00** | Manifesto **publicado** pela AMH a partir de commit produtor, com `manifest_sha256` calculado; dono AMH nomeado (N-1); caminho no repo confirmado (N-2); janela de depreciação (N-4) e rota de notificação (N-5) preenchidas; IG 1.1.0 publicada com digest | Pin verificável pela V2 contra o artefato publicado em ambiente nomeado | N/D | N/D |
| **IF-01..IF-06** | Esquema de envelope publicado pela AMH; ordenação e entrega declaradas no artefato; latência **declarada** (OS-17 crit. 3); confirmação 5×6 tipos | Canal alcançável e autorizado em ambiente nomeado; evento sintético entregue ponta a ponta | Eventos reais de tenants representativos, com distribuição de tipos observada | Latência **medida**, ordenação verificada sob carga, replay desde o início reconstruindo a visão histórica, comportamento sob queda e recuperação |
| **IF-07** | Operação exposta com semântica de `as_of` fora de janela definida; limites de uso declarados (OS-18 crit. 5) | Operação alcançável e autorizada em ambiente nomeado; negativa fail-closed observável | Respostas sobre refs reais, com cadeia de alias não vazia em pelo menos um caso representativo | Latência medida; equivalência replay ⇔ `resolve` verificada sobre dado real; comportamento sob indisponibilidade |

**INFERENCE.** Três condições do Gate G3 (prova de dado povoado, testes de conformidade em
ambiente **similar a produção**, e falha/recuperação demonstradas) dependem das camadas 2-4. A
própria minuta registra a restrição dura: *"a condição de ambiente similar a produção do Gate G3
NÃO pode ser satisfeita com dev apenas"* (`contract-manifest.draft.yaml`,
`supported_environments_nota`). Portanto **nenhum trabalho de conformidade descrito neste
diretório pode fechar o G3 sozinho** — ele prepara o que será executado quando os ambientes e o
artefato existirem.

## 4. Interfaces × artefatos de conformidade deste diretório

| ID | Mapeamento semântico | Erro/retry/idempotência/replay | Segurança/tenant | Deriva de contrato | Cenários de teste | Duas dimensões |
|---|:--:|:--:|:--:|:--:|:--:|:--:|
| IF-00 | parcial (versões) | n/a | sim | **núcleo** | CTS-17, CTS-22 | sim (cenário S11) |
| IF-01..IF-06 | **núcleo** (envelope de 11 campos) | **núcleo** | sim | sim | CTS-01..CTS-13, CTS-16..CTS-18, CTS-20, CTS-21 | sim (S1..S8, S11..S13) |
| IF-07 | **núcleo** (resposta de `resolve`) | **núcleo** | sim | sim | CTS-14, CTS-15, CTS-16, CTS-19 | sim (S9, S10) |

Documentos irmãos: [`mapeamento-semantico.md`](./mapeamento-semantico.md),
[`matriz-erro-retry-idempotencia-replay.md`](./matriz-erro-retry-idempotencia-replay.md),
[`mapeamento-seguranca-tenant.md`](./mapeamento-seguranca-tenant.md),
[`deteccao-mudanca-contrato.md`](./deteccao-mudanca-contrato.md),
[`cenarios-teste-consumidor.md`](./cenarios-teste-consumidor.md),
[`mapa-duas-dimensoes-status.md`](./mapa-duas-dimensoes-status.md).

## 5. Restrições que este inventário registra e não contorna

1. **A camada anticorrupção não tem contra o que se conformar.** IF-00 não existe como artefato
   AMH. Tudo aqui é conformidade **contra uma minuta do próprio consumidor** — o que é útil para
   negociar e para estar pronto, e **não** é evidência de compatibilidade.
2. **Um emulador escrito pela V2 provaria V2-contra-V2.** O §7.6 exige testes de contrato
   dirigidos pelo consumidor *"against a pinned AMH sandbox or faithful emulator"*; a fidelidade
   de um emulador só é demonstrável contra a interface real. Ver
   `cenarios-teste-consumidor.md` §1.
3. **A divergência 5×6 tipos de evento (IF-05) é de teor, não de forma.** A ata prevalece; a
   minuta segue os seis da OS-17. A camada anticorrupção deve tratar `identity.reassignment.v1`
   como **tipo condicional**: se a confirmação do titular for por cinco, o adaptador não perde
   nada (o tipo simplesmente nunca chega); se um evento desse tipo chegar sem o tipo estar no
   contrato aceito, ele é **deriva de contrato** (`deteccao-mudanca-contrato.md` D2/D3), não
   mensagem a interpretar.
4. **Nenhum transporte é escolhido nem implícito.** As sete interfaces foram inventariadas em
   termos de semântica (empurra/puxa, ordenação por sujeito, entrega ao menos uma vez), forma
   que a `memoria-de-desenho.md` §7 registra ser satisfatível por qualquer das três opções em
   comparação.

## 6. Questões abertas levantadas por este inventário

IDs locais deste diretório (`CONF-Q-nn`), **não** entradas de registro — a criação de entradas
em `docs/00-governance/registers/` é ato de outro papel.

| # | Questão | Por que importa | Para quem |
|---|---|---|---|
| **CONF-Q-01** | IF-07 é síncrona sob a ótica do consumidor, ou pode ser satisfeita por projeção materializada localmente a partir de IF-01..IF-06? | Determina se a V2 depende de disponibilidade da AMH **no caminho de leitura clínica** — um acoplamento com consequência de segurança (HAZ-0025) | ADR de fronteira (transporte) |
| **CONF-Q-02** | A V2 pode reconstruir a malha de refs **inteiramente** dos eventos, usando IF-07 apenas como verificação cruzada? | Se sim, a indisponibilidade de IF-07 degrada auditoria, não avaliação. Se não, IF-07 é dependência dura do laço clínico | ADR de fronteira + dono AMH |
| **CONF-Q-03** | Qual é a janela de retenção de histórico de IF-07 (`as_of` mais antigo suportado)? | Sem ela, `resolve` fora de janela é um estado indefinido no replay | Dono AMH (N-9 / SLOs) |
| **CONF-Q-04** | O tipo `identity.reassignment.v1` (IF-05) integra o contrato? | Muda a superfície de conformidade em uma interface inteira | Titular (ponto N-8) |

---

*Redigido pelo engenheiro de camada anticorrupção e conformidade AMH (ciclo 1). Nenhuma decisão
foi registrada; nenhum transporte escolhido; nenhum dono nomeado; nada foi escrito no repositório
AMH nem em `contract-v1/`. Sem PHI, credenciais ou identificadores reais.*
