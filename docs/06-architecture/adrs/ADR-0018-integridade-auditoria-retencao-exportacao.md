---
id: ADR-0018
title: Integridade de auditoria, retenção, legal hold, correção e exportação de evidência
status: PROPOSAL   # rótulo de evidência DESTE ARQUIVO (evidence-notation.md §2). O estado de ciclo de vida do ADR está em `adr_lifecycle_status`.
adr_lifecycle_status: "accepted (direção GDEC-0016; minuta materializada em construção — GDEC-0015)"
status_history:
  - status: not-started
    date: 2026-08-14
    by: engenheiro de arquitetura candidata e do programa de ADRs (Onda 2)
    note: ID e tópico reservados no adr-index.md (§10 item 18 do prompt); nenhuma minuta existia.
  - status: "accepted (direção)"
    date: 2026-08-16
    by: rodaquino-OMNI (titular)
    note: GDEC-0016 — aceite em lote das direções dos treze ADRs not-started; a minuta formal é trabalho de implementação.
  - status: "minuta materializada"
    date: 2026-08-16
    by: especialista de arquitetura de segurança (ciclo 6 — construção)
    note: >
      Esta minuta DOCUMENTA E DETALHA a direção já aceita; não reabre a decisão.
      Períodos de retenção permanecem NÃO DETERMINADOS (AUTH-PRIVACY-LEGAL sem
      titular). Detalhes além da direção são PREMISSA reversível de uma linha.
date: 2026-08-16
owner: >
  UNASSIGNED — VALIDATION REQUIRED (candidatos por adr-index.md §3: AUTH-PRIVACY-LEGAL —
  deliberadamente NÃO preenchida, DEC-G0-03/BLK-0004 — e AUTH-SECURITY, interino de
  fase de projeto, DEC-G0-02)
approvers:
  - UNASSIGNED — VALIDATION REQUIRED   # papel: AUTH-PRIVACY-LEGAL (BLK-0004)
  - UNASSIGNED — VALIDATION REQUIRED   # papel: AUTH-SECURITY (BLK-0003)
decision_deadline: >
  UNSET — VALIDATION REQUIRED. Restrição de ordem: `privacy-data-map.md` §4.1 registra
  que retrofitar apagamento em armazenamento encadeado é extremamente caro — a forma do
  esquema de auditoria precisa ser fixada ANTES da primeira escrita durável.
deciding_authority_rule: >
  docs/00-governance/decision-rights.md §2, linha "Architecture decisions (ADR
  ratification)"; cláusulas de retenção/apagamento/legal hold sob AUTH-PRIVACY-LEGAL.
independence_check: >
  decision-rights.md §3 — quem implementa a trilha de auditoria não pode aceitar a
  evidência de sua própria inviolabilidade. Minuta redigida por agente; nenhum agente
  aprova ADR.
links:
  drivers:
    domain_invariants: [DOM-0002, DOM-0005, DOM-0006, DOM-0009]
    quality_scenarios: [QAS-0016, QAS-0019, QAS-0026, QAS-0028]
    risks: ["pendente — docs/00-governance/registers/risk-register.md"]
  constrains:
    requirements: ["REQ: pendente de catálogo de requisitos"]
    clinical: ["CLR: pendente do portfólio de vias clínicas (Gate G2)"]
    safety: [SAF-0014, SAF-0023, SAF-0026]
  hazards: [HAZ-0028, HAZ-0035]
  tests: ["TST: pendente de arquitetura de teste"]
  validations: ["VAL: pendente do backlog de validação"]
  adrs:
    depends_on: [ADR-0005, ADR-0016, ADR-0017]
    feeds: [ADR-0020, ADR-0023]
  gates: [G6]
  evidence:
    - docs/11-security-privacy-compliance/security-controls-catalog.md SEC-0020, SEC-0032, SEC-0033
    - docs/11-security-privacy-compliance/privacy-data-map.md §4, §4.1
    - docs/06-architecture/adrs/ADR-0005-modelo-canonico-observacao-proveniencia-qualidade-correcao-tempo.md (fato imutável, correção ligada)
    - docs/06-architecture/adrs/ADR-0010-backbone-transacao-outbox-eventos-garantias-de-entrega.md (publicação transacional)
    - docs/00-governance/registers/decision-register.md GDEC-0016, GDEC-0017
supersedes: null
superseded_by: null
provenance:
  source_repo: intensicare-V2
  path_or_url: docs/06-architecture/adrs/ADR-0018-integridade-auditoria-retencao-exportacao.md
  commit_sha_or_version: 33c749a (HEAD de cycle-6/construcao-g7 na redação)
  section_or_lines: >
    INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §9.1 princípios 3/5/10, §10 item 18, §13, §15.3;
    security-controls-catalog.md §E; privacy-data-map.md §4.1
  date_collected: 2026-08-16
  collector: especialista de arquitetura de segurança (ciclo 6 — construção)
  transformation: reasoned-from — direção aceita em GDEC-0016 detalhada contra ADR-0005/0010 e o catálogo de controles; nenhum ambiente foi testado
  confidence: medium
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
---

# ADR-0018 — Integridade de auditoria, retenção, legal hold, correção e exportação de evidência

> **Status do ADR: accepted (direção GDEC-0016; minuta materializada em construção —
> GDEC-0015).** Esta minuta registra e detalha a direção **já aceita**; não reabre a
> decisão. **Nenhum período de retenção é fixado aqui** — a determinação é jurídica e
> clínica, e `AUTH-PRIVACY-LEGAL` não tem titular (`BLK-0004`). Nada aqui é alegação de
> conformidade regulatória.

> **Divergência conhecida de bookkeeping:** `adr-index.md` ainda registra este ADR como
> `not-started`; atualizar o índice está fora do escopo de escrita desta tarefa (§9).

## 1. Contexto e problema

**SOURCE** (`security-controls-catalog.md` SEC-0032): a auditoria deve registrar **leituras
clínicas** além de escritas, transições de alerta, supressões, ativações de regra, uso de
kill switch, break-glass e exportações — com ator, propósito, tenant, recurso, tempo e
correlação — em forma append-only e à prova de adulteração, exportável como evidência. A
razão de auditar leitura é operacional: sem ela, o escopo de um incidente de divulgação
não pode ser determinado e a notificação teria de assumir o pior caso.

**SOURCE** (`hazard-log.md` HAZ-0035, sobre o legado): *"transições de alerta não são
auditadas"* — o defeito exato que torna impossível reconstruir o que um clínico viu.

**SOURCE** (`privacy-data-map.md` §4.1): quatro tensões precisam ser resolvidas **antes** de
fixar o esquema — (1) imutabilidade de auditoria versus obrigação de apagamento;
(2) evidência de segurança versus minimização; (3) backups versus apagamento;
(4) correção versus imutabilidade. E a mesma seção adverte: retrofitar apagamento em um
armazenamento encadeado por hash é extremamente caro.

**Pergunta:** qual a forma da trilha de auditoria da V2, e como retenção, legal hold,
correção e exportação de evidência se comportam **sem que nenhuma delas apague história**?

**Fora de escopo:** escopo/autorização (ADR-0016); criptografia e custódia de chave
(ADR-0017); modelo canônico de fato e correção clínica (ADR-0005, já aceito); SLOs e
backup/restore (ADR-0020); importação legada (ADR-0023).

## 2. Direcionadores de decisão

| # | Direcionador | Por que discrimina | Atributo de qualidade | Alvo |
|---|---|---|---|---|
| D1 | **Inviolabilidade demonstrável** — um registro alterado precisa ser **detectável** | Separa "log" de "evidência" | QAS-0026 | VALIDAÇÃO NECESSÁRIA |
| D2 | **Auditar e mudar estado são atômicos** | Auditoria publicada fora da transação pode faltar exatamente no incidente que importa | QAS-0021 | VALIDAÇÃO NECESSÁRIA |
| D3 | **Correção nunca muta história** (SAF-0014, ADR-0005) | Opções que "corrigem editando" destroem a reconstrução clínica | QAS-0019 | VALIDAÇÃO NECESSÁRIA |
| D4 | **Retenção e legal hold representáveis sem valores decididos** | O período é determinação jurídica ausente; o esquema não pode travar por isso, nem inventar prazo | QAS-0027 | VALIDAÇÃO NECESSÁRIA |
| D5 | **Apagamento futuro sem retrofit destrutivo** (`privacy-data-map.md` §4.1) | Encadeamento rígido sobre conteúdo identificável fecha portas | QAS-0027 | VALIDAÇÃO NECESSÁRIA |
| D6 | **Exportação de evidência verificável e minimizada** (SEC-0020, QAS-0016) | Exportação sem digest não é evidência; exportação sem minimização é vazamento | QAS-0016 | VALIDAÇÃO NECESSÁRIA |

## 3. Alternativas consideradas

### Opção A — Tabela append-only dedicada, com encadeamento de hash por tenant como opção habilitável (a direção aceita)

**Descrição.** Auditoria em tabela própria sem `UPDATE` nem `DELETE` (revogados por
permissão e barrados por gatilho), escrita na **mesma transação** do fato/transição que a
origina (ADR-0010); cada linha carrega o digest da linha predecessora no mesmo escopo de
tenant, formando cadeia verificável; correção sempre como **novo** registro ligado;
retenção e legal hold como marcadores de política, com período `NÃO DETERMINADO`;
exportação de evidência autorizada, minimizada, registrada e verificável por digest.

**Positivas.** Atende D1–D4 e D6; a cadeia é verificável incrementalmente e não depende de
serviço externo; a atomicidade elimina a classe "mudou mas não auditou".
**Negativas.** Cadeia interna é detectável, não **inviolável** — quem controla o banco pode
recomputar a cadeia inteira; sem âncora externa, a garantia é de detecção de adulteração
descuidada, não de adulteração deliberada por administrador; encadeamento sobre conteúdo
identificável tensiona D5 (por isso a mitigação no §4.1).
**Custo de saída.** Baixo — a cadeia é um campo adicional; a âncora externa é aditiva.

### Opção B — Auditoria como log de aplicação/observabilidade

**Positivas.** Barato, sem esquema, com ferramenta pronta de busca.
**Negativas.** Não é evidência (mutável, retenção do fornecedor, ordenação frouxa);
empurra dado clínico para a superfície de telemetria — exatamente o vetor de HAZ-0028 e do
§13 do prompt; impossível garantir atomicidade (D2).
**Custo de saída.** Alto em risco assumido, baixo em código.

### Opção C — Armazenamento WORM externo ou notarização desde já

**Positivas.** Inviolabilidade forte contra administrador interno; resolve D1 em sua forma
plena.
**Negativas.** Exige plataforma, fornecedor e custodiante — nenhum existe (ADR-0019,
ADR-0022, `BLK-0003`); torna apagamento futuro ainda mais difícil (D5); custo e
dependência de fornecedor sem dono de decisão.
**Custo de saída.** Alto — dependência externa embutida no registro clínico.

### Opção Z — Adiar auditoria para depois da fatia

**Positivas.** Fatia mais rápida.
**Negativas.** Toda transição escrita sem auditoria é história perdida e irrecuperável; o
ADR-0009 (máquina de estados aceita) já pressupõe transições auditadas.
**Custo do atraso:** irreversível — não se audita retroativamente o que não foi registrado.

### 3.1 Comparação

| Direcionador | Opção A | Opção B | Opção C | Opção Z |
|---|---|---|---|---|
| D1 inviolabilidade | detecção interna (parcial) | nenhuma | forte | nenhuma |
| D2 atomicidade | atende | não atende | depende | n/a |
| D3 correção sem mutação | atende | frágil | atende | n/a |
| D5 apagamento futuro | endereçável (§4.1) | trivial, mas sem evidência | difícil | n/a |
| Viabilidade hoje | alta | alta | nula (sem plataforma) | n/a |

## 4. Decisão

**Direção aceita (GDEC-0016, titular rodaquino-OMNI, 2026-08-16) — Opção A:**

1. **Integridade:** trilha **append-only**, com **encadeamento de hash como opção**
   habilitada na construção e **âncora externa adiada** (ADR-0019/ADR-0022).
2. **Retenção:** representada no esquema como classe de retenção por categoria do mapa de
   dados, com valor `NÃO DETERMINADO` até decisão de `AUTH-PRIVACY-LEGAL`; **nenhum prazo
   é inventado**.
3. **Legal hold:** marcador que bloqueia qualquer rotina futura de expurgo; existe **antes**
   da rotina, para que a rotina nasça obrigada a respeitá-lo.
4. **Correção sem apagamento:** toda correção é um novo registro ligado ao anterior
   (coerente com ADR-0005 e SAF-0014); nenhuma linha anterior é reescrita, em nenhuma
   circunstância, inclusive correção de erro de operador.
5. **Exportação de evidência:** autorizada, vinculada a propósito, minimizada, registrada
   na própria auditoria e verificável por digest por arquivo e digest do conjunto
   (prompt §13; QAS-0016).

**Escopo vinculado:** toda leitura clínica, mudança de estado, avaliação, transição de
alerta, supressão, ativação/rollback de regra, uso de kill switch, break-glass, mudança de
configuração/roteamento e exportação. **Não vincula:** prazos de retenção; seleção de WORM
ou notarização; procedimento de resposta a incidente (SEC-0035).

### 4.1 Premissas de construção (reversíveis, uma linha cada)

- PREMISSA (reversível, GDEC-0015/0017): a linha de auditoria registra ator, papel, propósito, tenant, recurso, ação, resultado, tempo do servidor, correlação e digest do predecessor **no mesmo escopo de tenant**, com leituras clínicas auditadas junto com escritas.
- PREMISSA (reversível, GDEC-0015/0017): a escrita de auditoria ocorre na **mesma transação** do fato ou transição que a origina — auditar e mudar estado acontecem juntos ou nenhum dos dois acontece.
- PREMISSA (reversível, GDEC-0015/0017): a cadeia de hash é **por tenant** (uma cadeia por tenant), o que preserva o isolamento do ADR-0016 e evita que a verificação exija leitura entre tenants.
- PREMISSA (reversível, GDEC-0015/0017): o encadeamento cobre **metadados e digest do corpo**, não o corpo identificável em si — isso mantém a verificação válida caso o corpo venha a ser tombstoned por obrigação futura de apagamento (mitigação da tensão 1 do `privacy-data-map.md` §4.1).
- PREMISSA (reversível, GDEC-0015/0017): `UPDATE` e `DELETE` na tabela de auditoria são revogados por permissão **e** barrados por gatilho, e um teste negativo afirma a impossibilidade em ambos os caminhos.
- PREMISSA (reversível, GDEC-0015/0017): a classe de retenção é um campo com valor `NAO_DETERMINADO` como padrão e o legal hold é um marcador booleano com motivo textual; **nenhuma rotina de expurgo é implementada na fatia**.
- PREMISSA (reversível, GDEC-0015/0017): a exportação de evidência produz um pacote com manifesto (escopo, propósito, autor, período), digest por arquivo e digest do conjunto; na fatia G7 exporta **apenas dados sintéticos** `SYNTH-`.
- PREMISSA (reversível, GDEC-0015/0017): o tempo autoritativo da linha de auditoria é o do servidor da V2, distinto e adicional aos tempos clínicos do ADR-0005 — nenhum timestamp é inventado (DOM-0009).
- PREMISSA (reversível, GDEC-0015/0017): a verificação de cadeia é executada incrementalmente em teste e exposta como operação administrativa auditável, e sua falha é sinal operacional de severidade alta.

## 5. Consequências

**Positivas.** A reconstrução do que um clínico viu passa a ser possível por construção
(SAF-0023); o defeito do legado (transições não auditadas) fica estruturalmente impedido;
a exportação de evidência vira artefato de produto, não relatório improvisado; a decisão
de retenção pode chegar depois sem exigir migração destrutiva.

**Negativas.** A cadeia interna **não** protege contra adulteração por quem controla o
banco — dizê-lo é obrigatório, sob pena de a trilha ser citada como garantia que ela não
oferece; auditar leituras aumenta volume e custo de armazenamento de forma não trivial;
sem prazo de retenção decidido, o volume cresce sem limite declarado; a atomicidade
acopla o custo da auditoria ao caminho quente da transação.

**Neutras.** Nada aqui decide fornecedor, WORM, notarização ou prazo; nada aqui autoriza
qualquer exportação de dado real.

## 6. Implicações transversais

| Dimensão | Implicação | Rótulo | Papel dono |
|---|---|---|---|
| Segurança clínica | A trilha é o insumo da investigação de evento adverso e da reconstrução do estado exibido (SAF-0023); sua ausência foi defeito registrado do legado (HAZ-0035) | SOURCE do hazard-log | AUTH-CLINSAFETY |
| Segurança | Materializa SEC-0032 e alimenta SEC-0033 (detecção sobre padrão de acesso); a limitação contra adversário administrador fica declarada, não encoberta | SOURCE do catálogo | AUTH-SECURITY |
| Privacidade | Auditar leituras cria um registro adicional de acesso a dado clínico — protege e ao mesmo tempo amplia a superfície; a tensão 2 do §4.1 fica explícita e é decisão de `AUTH-PRIVACY-LEGAL` | VALIDATION REQUIRED | AUTH-PRIVACY-LEGAL |
| Interoperabilidade | Exportação de evidência usa formato próprio com manifesto e digest; nenhum perfil externo é alegado (FHIR/AuditEvent fica para ADR-0013 avaliar, sem compromisso aqui) | PROPOSAL | AUTH-DATA-PLATFORM |
| Acessibilidade | A visualização de trilha e de correção precisa ser legível em pt-BR clínico, navegável por teclado e compreensível sem jargão técnico (WCAG 2.2 AA como requisito de projeto) | INFERENCE | AUTH-UX |
| Operação | Crescimento de volume, verificação periódica de cadeia e custo de armazenamento viram itens operacionais; falha de verificação é alarme, não relatório | PROPOSAL | AUTH-OPERATIONS |
| Custo | Auditar leituras é a maior fonte de volume do sistema; sem prazo de retenção, o custo é aberto — registrado como consequência, não como estimativa | INFERENCE | AUTH-PRODUCT |
| Migração | Importação legada (ADR-0023) não pode fabricar linhas de auditoria retroativas; material importado entra como fato com proveniência de importação, jamais como trilha original | INFERENCE | AUTH-DATA-PLATFORM |

## 7. Reversibilidade e gatilhos de revisita

**Reversibilidade: média.** A forma append-only e a separação metadado × corpo são o que
mantém opções abertas; o volume já escrito é o que não se desfaz.

| # | Gatilho (evento observável) | Ação |
|---|---|---|
| T1 | `AUTH-PRIVACY-LEGAL` nomeado e prazos determinados | Preencher classes de retenção; projetar a rotina de expurgo respeitando legal hold |
| T2 | Obrigação de apagamento sobre conteúdo já auditado | Acionar tombstone de corpo preservando cadeia de metadados (mitigação já embutida em §4.1) |
| T3 | Plataforma decidida (ADR-0019) com WORM disponível | Avaliar âncora externa periódica como adição, não como substituição |
| T4 | Volume de auditoria ultrapassar o custo tolerado | Revisitar granularidade de auditoria de leitura — **nunca** removendo auditoria de mudança de estado |
| T5 | Verificação de cadeia falhar em qualquer ambiente | Incidente de segurança; congelar exportações e escalar (SEC-0035, sem dono nomeado) |

**Kill switch.** Não existe desligar auditoria. Se a escrita de auditoria falhar, a
transação falha junto — a operação clínica é **negada**, não executada sem registro. O
fallback clínico correspondente (indisponibilidade explícita na UI, DOM-0007) pertence ao
modo degradado e **não** está decidido aqui.

## 8. Validação

| # | Alegação | Método | Ambiente | IDs |
|---|---|---|---|---|
| V1 | Toda operação auditável gera exatamente uma linha, na mesma transação | Teste de completude por tipo de operação + teste de rollback (falha de auditoria reverte o fato) | dev/CI | SEC-0032 |
| V2 | Registro alterado é detectável | Teste de adulteração: alterar uma linha e afirmar que a verificação de cadeia falha | dev/CI | QAS-0026 |
| V3 | `UPDATE`/`DELETE` são impossíveis pelos dois caminhos | Teste negativo por permissão e por gatilho | dev/CI | SEC-0032 |
| V4 | Leituras clínicas são auditadas | Teste de cobertura por rota de leitura | dev/CI | SEC-0032 |
| V5 | Correção não muta história | Teste de correção afirmando linha nova e predecessora intacta | dev/CI | SAF-0014 |
| V6 | Pacote de exportação é verificável | Verificação de digest por arquivo e do conjunto; teste de detecção de alteração pós-exportação | dev/CI | QAS-0016 |
| V7 | Retenção e legal hold são respeitados | **Não validável hoje** — nenhuma rotina de expurgo existe e nenhum prazo foi determinado | ambiente futuro | `BLK-0004` |

## 9. Supersessão e pendências

- **Supersede:** nenhuma. **Superseded por:** nenhuma.
- **Pendência:** `adr-index.md` continua marcando `ADR-0018` como `not-started`; atualizar
  o índice está fora do escopo de escrita desta tarefa.
- **Pendência:** prazos de retenção, política de apagamento e alcance sobre backups —
  `AUTH-PRIVACY-LEGAL` (`BLK-0004`), com as quatro tensões do `privacy-data-map.md` §4.1
  ainda abertas.
- **Pendência:** âncora externa de integridade (WORM/notarização) — depende de ADR-0019 e
  ADR-0022.
- **Pendência:** resposta a incidente e caminho de violação de privacidade (SEC-0035)
  permanecem sem dono nomeado.
