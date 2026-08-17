---
id: ADR-0017
title: Criptografia, gestão de chave e tradeoffs de dado clínico pesquisável
status: PROPOSAL   # rótulo de evidência DESTE ARQUIVO (evidence-notation.md §2). O estado de ciclo de vida do ADR está em `adr_lifecycle_status`.
adr_lifecycle_status: "accepted (direção GDEC-0016; minuta materializada em construção — GDEC-0015)"
status_history:
  - status: not-started
    date: 2026-08-14
    by: engenheiro de arquitetura candidata e do programa de ADRs (Onda 2)
    note: ID e tópico reservados no adr-index.md (§10 item 17 do prompt); nenhuma minuta existia.
  - status: "accepted (direção)"
    date: 2026-08-16
    by: rodaquino-OMNI (titular)
    note: GDEC-0016 — aceite em lote das direções dos treze ADRs not-started; a minuta formal é trabalho de implementação.
  - status: "minuta materializada"
    date: 2026-08-16
    by: especialista de arquitetura de segurança (ciclo 6 — construção)
    note: >
      Esta minuta DOCUMENTA E DETALHA a direção já aceita; não reabre a decisão.
      A custódia de chave permanece CLÁUSULA ADIADA, coerente com o ADR-0022 do
      ciclo 1. Detalhes além da direção são PREMISSA reversível de uma linha.
date: 2026-08-16
owner: >
  UNASSIGNED — VALIDATION REQUIRED (candidatos por adr-index.md §3: AUTH-SECURITY —
  interino de fase de projeto, DEC-G0-02 — e AUTH-PRIVACY-LEGAL, deliberadamente
  NÃO preenchida, DEC-G0-03/BLK-0004)
approvers:
  - UNASSIGNED — VALIDATION REQUIRED   # papel: AUTH-SECURITY
  - UNASSIGNED — VALIDATION REQUIRED   # papel: AUTH-PRIVACY-LEGAL (BLK-0004)
decision_deadline: >
  UNSET — VALIDATION REQUIRED. Restrição de ordem: adr-index.md §5 lista este ADR
  entre os que o Gate G6 aguarda; a cláusula de custódia depende do ADR-0022 e do ADR-0019.
deciding_authority_rule: >
  docs/00-governance/decision-rights.md §2, linha "Architecture decisions (ADR
  ratification)"; cláusulas de custódia de chave sob AUTH-SECURITY; cláusulas de
  tratamento de dado pessoal sensível sob AUTH-PRIVACY-LEGAL.
independence_check: >
  decision-rights.md §3 — quem operar a aplicação não pode ser custodiante de chave
  (SEC-0013 exige separação). Minuta redigida por agente; nenhum agente aprova ADR.
links:
  drivers:
    domain_invariants: [DOM-0002, DOM-0006]
    quality_scenarios: [QAS-0015, QAS-0016, QAS-0027, QAS-0028]
    risks: ["pendente — docs/00-governance/registers/risk-register.md"]
  constrains:
    requirements: ["REQ: pendente de catálogo de requisitos"]
    clinical: ["CLR: pendente do portfólio de vias clínicas (Gate G2)"]
    safety: [SAF-0023, SAF-0026]
  hazards: [HAZ-0028, HAZ-0035]
  tests: ["TST: pendente de arquitetura de teste"]
  validations: ["VAL: pendente do backlog de validação"]
  adrs:
    depends_on: [ADR-0005, ADR-0019]
    feeds: [ADR-0014, ADR-0018]
  gates: [G6]
  evidence:
    - docs/11-security-privacy-compliance/security-controls-catalog.md SEC-0011..SEC-0017, SEC-0020
    - docs/11-security-privacy-compliance/privacy-data-map.md §1, §4.1, §5.1
    - docs/06-architecture/adrs/ADR-0007-rule-bundle-format-signing-approval-activation-rollback-retirement.md §5 (custódia adiada ao ADR-0022)
    - docs/00-governance/registers/decision-register.md GDEC-0016, GDEC-0017
supersedes: null
superseded_by: null
provenance:
  source_repo: intensicare-V2
  path_or_url: docs/06-architecture/adrs/ADR-0017-criptografia-gestao-de-chave-phi.md
  commit_sha_or_version: 33c749a (HEAD de cycle-6/construcao-g7 na redação)
  section_or_lines: >
    INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §9.1 princípio 12, §10 item 17, §13;
    security-controls-catalog.md §B; privacy-data-map.md §4.1
  date_collected: 2026-08-16
  collector: especialista de arquitetura de segurança (ciclo 6 — construção)
  transformation: reasoned-from — direção aceita em GDEC-0016 detalhada contra o catálogo de controles e o mapa de privacidade; nenhum ambiente foi testado
  confidence: medium
  owner: UNASSIGNED — VALIDATION REQUIRED
  validation_status: VALIDATION REQUIRED
---

# ADR-0017 — Criptografia, gestão de chave e tradeoffs de dado clínico pesquisável

> **Status do ADR: accepted (direção GDEC-0016; minuta materializada em construção —
> GDEC-0015).** Esta minuta registra e detalha a direção **já aceita**; não reabre a
> decisão. **A custódia concreta de chave permanece cláusula adiada** (coerente com o
> ADR-0022 aceito no ciclo 1 e com a condição C5 do ADR-0007). Nada aqui é alegação de
> conformidade regulatória nem de proteção comprovada.

> **Divergência conhecida de bookkeeping:** `adr-index.md` ainda registra este ADR como
> `not-started`; atualizar o índice está fora do escopo de escrita desta tarefa (§9).

## 1. Contexto e problema

A V2 manipulará dado clínico identificável assim que sair de dado sintético. O prompt §13
exige criptografia em trânsito e em repouso, rotação gerida de chave e isolamento de
segredo; o §9.1 princípio 12 exige minimizar coleta, movimento, exibição, retenção e
divulgação. Três restrições delimitam o que é decidível **agora**:

- **SOURCE** (`privacy-data-map.md` §5.1): residência e provedor **não estão
  determinados**; nenhuma nuvem, região ou serviço gerido foi selecionado, e a §3 regra 14
  proíbe selecionar por herança.
- **SOURCE** (`adr-index.md` §1 e `ADR-0007` §5, C5): a **custódia de chave permanece
  cláusula adiada** ao ADR-0022, com `AUTH-SECURITY` sem titular nomeado para operação.
- **OBSERVED** (regime vigente, GDEC-0014/0017): a construção corrente usa **exclusivamente
  dados sintéticos** marcados `SYNTH-`; não há dado real no repositório nem no ambiente de
  desenvolvimento.

O ponto difícil não é "cifrar": é o conflito entre **cifrar campo a campo** e **conseguir
buscar, ordenar, agregar e reconciliar** o mesmo campo — o tradeoff que o §10 item 17 do
prompt nomeia explicitamente.

**Pergunta:** qual a política de criptografia em repouso e em trânsito da V2, como as
chaves são geridas, e como o sistema trata a necessidade de pesquisar sobre dado clínico
identificável sem criar cópias fora de controle?

**Fora de escopo:** plataforma, região e residência (ADR-0019); assinatura de artefato e
supply chain (ADR-0022); retenção e apagamento (ADR-0018); superfície MCP e disclosure a
provedor de modelo (ADR-0014).

## 2. Direcionadores de decisão

| # | Direcionador | Por que discrimina | Atributo de qualidade | Alvo |
|---|---|---|---|---|
| D1 | **Cobertura de todas as cópias** — incluindo filas, DLQ, quarentena, cache, índice, backup, snapshot, exportação e telemetria (SEC-0012) | Opções que cifram só a tabela principal deixam as cópias esquecidas | QAS-0028 | VALIDAÇÃO NECESSÁRIA |
| D2 | **Preservar busca/ordenação/agregação clínica** | Cifragem de campo quebra consulta por faixa, ordenação temporal e junção — o laço clínico depende delas | QAS-0022 | VALIDAÇÃO NECESSÁRIA |
| D3 | **Não decidir custódia sem custodiante** | Sem `AUTH-SECURITY` nomeado, escolher KMS/HSM seria decisão órfã | QAS-0027 | VALIDAÇÃO NECESSÁRIA |
| D4 | **Perda de chave não pode significar perda do registro clínico** (SEC-0013) | Opções com cifragem por sujeito criam risco de indisponibilidade clínica irreversível | QAS-0015 | VALIDAÇÃO NECESSÁRIA |
| D5 | **Habilitar apagamento futuro sem retrofit caro** (`privacy-data-map.md` §4.1 tensão 1) | Retrofitar apagamento em armazenamento encadeado é extremamente caro | QAS-0027 | VALIDAÇÃO NECESSÁRIA |
| D6 | **Custo e complexidade operacional** | Cifragem por envelope por sujeito multiplica operações de chave por leitura | QAS-0027 | VALIDAÇÃO NECESSÁRIA |

## 3. Alternativas consideradas

### Opção A — Cifragem de armazenamento gerida pela plataforma + TLS em todo hop; sem cifragem de campo na fatia (a direção aceita)

**Descrição.** Cifragem em repouso transparente no nível do armazenamento (volume/serviço
gerido), abrangendo **todas** as cópias do mapa de dados; TLS verificado em todo hop,
inclusive interno; segredos exclusivamente fora do repositório e de curta duração. O dado
clínico permanece pesquisável **dentro** do limite cifrado, com **minimização,
autorização por instância (ADR-0016) e auditoria de leitura (ADR-0018)** como controles
primários de exposição. O esquema é desenhado para admitir cifragem por sujeito depois
(separação identidade × fato) sem migração destrutiva.

**Positivas.** Atende D1, D2, D4, D6; não exige custodiante nomeado para existir; preserva
todo o comportamento clínico de consulta; deixa D5 endereçável.
**Negativas.** Não protege contra um adversário com acesso legítimo ao banco — a defesa aí
é autorização + auditoria, não criptografia; não entrega apagamento criptográfico.
**Custo de saída.** Baixo — evoluir para cifragem de campo é aditivo se a separação de
esquema for respeitada.

### Opção B — Cifragem determinística/pesquisável em nível de campo para identificadores

**Positivas.** Permite igualdade sobre campo cifrado; protege contra leitura direta do
armazenamento.
**Negativas.** Vaza padrão de frequência (identificador repetido é reconhecível); quebra
ordenação, faixa e busca parcial (D2); exige custódia de chave **agora** (D3); erros de
implementação são silenciosos.
**Custo de saída.** Alto — reverter exige recifrar ou decifrar todo o acervo.

### Opção C — Cifragem por envelope por sujeito, decifrada na aplicação

**Positivas.** Habilita apagamento criptográfico forte por sujeito (D5 em sua forma mais
limpa); blast radius por sujeito.
**Negativas.** Inviabiliza consulta no banco sobre o campo cifrado, empurrando a busca
para um índice separado — **que se torna uma nova cópia de dado clínico**, contrariando D1
e o princípio 12; perda de chave = perda do registro clínico do sujeito, risco clínico
inaceitável sem procedimento de recuperação exercitado (D4); custo por leitura (D6).
**Custo de saída.** Alto.

### Opção Z — Adiar toda a política

**Positivas.** Nenhum compromisso antes de existirem plataforma e custodiante.
**Negativas.** O esquema da fatia nasceria sem a separação identidade × fato, e o retrofit
posterior tocaria toda a persistência. **Custo do atraso:** cresce com cada tabela criada.

### 3.1 Comparação

| Direcionador | Opção A | Opção B | Opção C | Opção Z |
|---|---|---|---|---|
| D1 todas as cópias | atende | parcial | cria nova cópia (índice) | não atende |
| D2 busca clínica | preservada | degradada | inviável no banco | n/a |
| D3 sem custodiante | atende | exige agora | exige agora | atende |
| D4 perda de chave | risco baixo | médio | alto | n/a |
| D5 apagamento futuro | endereçável | parcial | forte | não |

## 4. Decisão

**Direção aceita (GDEC-0016, titular rodaquino-OMNI, 2026-08-16) — Opção A**, com a
**custódia de chave mantida como cláusula adiada** (ADR-0022; condição C5 do ADR-0007):

1. **Em trânsito:** TLS atual com verificação de par em todo hop, sem caminho de
   downgrade; hops internos **não** são isentos (SEC-0002/SEC-0011).
2. **Em repouso:** cifragem no nível do armazenamento cobrindo **toda** cópia inventariada
   no mapa de dados — operacional, objetos, filas, DLQ, quarentena, cache, índice, backup,
   snapshot, cópia de DR, exportação de evidência e armazenamento de log/traço (SEC-0012).
3. **Chaves e segredos:** ciclo de vida gerido com rotação e revogação documentadas,
   custodiante separado do operador da aplicação, e chaves de assinatura, de cifragem de
   dado e credenciais de integração com ciclos e blast radius separados (SEC-0013/0014) —
   **mecanismo concreto adiado**.
4. **Dado clínico pesquisável:** permanece em claro dentro do limite cifrado; a exposição é
   controlada por minimização de contrato (SEC-0016), autorização por instância (ADR-0016)
   e auditoria de leitura (ADR-0018), **não** por cifragem de campo nesta fase.

**Escopo vinculado:** todo armazenamento e todo transporte da V2. **Não vincula:** provedor
de KMS/HSM, nuvem, região ou serviço gerido; a política de retenção e apagamento
(ADR-0018); a decisão de residência (ADR-0019).

### 4.1 Premissas de construção (reversíveis, uma linha cada)

- PREMISSA (reversível, GDEC-0015/0017): na fatia G7 **não existe dado clínico real** (apenas sintéticos `SYNTH-`) e o armazenamento é local (PGlite), de modo que "cifragem em repouso" é obrigação de ambiente futuro — o código **não** simula nem alega cifragem.
- PREMISSA (reversível, GDEC-0015/0017): o esquema separa **identificadores diretos do sujeito** (tabela de identidade) dos **fatos clínicos** (que referenciam uma chave interna opaca), criando um ponto único para futura cifragem por sujeito, pseudonimização ou marcação de apagamento.
- PREMISSA (reversível, GDEC-0015/0017): nenhum índice de texto livre sobre narrativa clínica é criado na fatia, para não gerar uma cópia pesquisável antes de existir política de tratamento.
- PREMISSA (reversível, GDEC-0015/0017): segredos vêm exclusivamente do ambiente e a aplicação **falha ao iniciar** se um segredo obrigatório estiver ausente — sem valor padrão, sem placeholder, sem segredo em repositório ou em imagem.
- PREMISSA (reversível, GDEC-0015/0017): a redação de dado sensível em log, traço, métrica e corpo de erro é imposta pela camada de serialização (campos em lista de permissão), nunca por disciplina de chamada (SEC-0015).
- PREMISSA (reversível, GDEC-0015/0017): o inventário de armazenamentos a cifrar é **derivado do mapa de dados** e reconciliado por verificação automatizada, não mantido de memória.
- PREMISSA (reversível, GDEC-0015/0017): a criptografia usada em qualquer verificação de integridade (digest de auditoria, digest de exportação) usa função de resumo padrão da plataforma e **não** substitui assinatura — assinatura é assunto do ADR-0022.

### 4.2 Cláusula adiada (explicitamente NÃO decidida aqui)

Custódia concreta de chave (KMS/HSM, hierarquia, ritmo de rotação, procedimento de
recuperação e seu exercício, separação de custodiantes por ambiente) permanece **aberta**,
sob `AUTH-SECURITY` (`BLK-0003`) e dependente do ADR-0019 e do ADR-0022. Registrar isso é
o oposto de decidir: nenhuma implementação pode presumir a existência de um custodiante.

## 5. Consequências

**Positivas.** A fatia pode ser construída sem decisões órfãs de infraestrutura; o
comportamento clínico de consulta é preservado; o esquema fica preparado para cifragem por
sujeito e para apagamento futuro; o inventário de cópias vira artefato verificável.

**Negativas.** Sem cifragem de campo, um acesso legítimo indevido ao banco lê dado clínico
— a defesa depende inteiramente de autorização e auditoria, e isso precisa ser dito em voz
alta ao dono de privacidade; a cláusula adiada de custódia é uma lacuna real, não um
detalhe; a promessa de "cifrado em repouso" só será verdadeira quando existir plataforma.

**Neutras.** Nada aqui seleciona nuvem, KMS ou região (§3 regra 14); nada aqui autoriza
qualquer fluxo de dado real.

## 6. Implicações transversais

| Dimensão | Implicação | Rótulo | Papel dono |
|---|---|---|---|
| Segurança clínica | Perda ou indisponibilidade de chave que torne o registro clínico ilegível é risco de **segurança do paciente**, não apenas de segurança da informação — razão central para rejeitar a Opção C nesta fase | INFERENCE de SEC-0013 | AUTH-CLINSAFETY |
| Segurança | Materializa SEC-0011, SEC-0012, SEC-0014, SEC-0015; SEC-0013 fica **parcialmente adiado** (custódia) | SOURCE do catálogo | AUTH-SECURITY |
| Privacidade | Dado clínico pesquisável em claro dentro do limite cifrado é uma escolha com consequência legal e precisa de decisão do dono de privacidade — hoje `UNASSIGNED` (`BLK-0004`) | VALIDATION REQUIRED | AUTH-PRIVACY-LEGAL |
| Interoperabilidade | Envelopes e exportações herdam a mesma obrigação de cifragem e minimização; nenhum canal externo é isento | PROPOSAL | AUTH-DATA-PLATFORM |
| Acessibilidade | Não aplicável diretamente — porém mensagens de erro de segurança exibidas ao clínico devem seguir o padrão pt-BR acessível do ADR-0021 | INFERENCE | AUTH-UX |
| Operação | Rotação, revogação e recuperação viram procedimentos operacionais com exercício obrigatório quando houver custodiante; até lá, pendência aberta | VALIDATION REQUIRED | AUTH-OPERATIONS |
| Custo | Cifragem de armazenamento gerida tem custo marginal baixo; cifragem por envelope teria custo por leitura e custo operacional relevante | INFERENCE | AUTH-PRODUCT |
| Migração | Evoluir para cifragem por sujeito é aditivo **se** a separação identidade × fato for respeitada; sem ela, é migração destrutiva | INFERENCE | AUTH-DATA-PLATFORM |

## 7. Reversibilidade e gatilhos de revisita

**Reversibilidade: alta para a política de transporte/armazenamento; média para o esquema**
(a separação identidade × fato é o que preserva a reversibilidade).

| # | Gatilho (evento observável) | Ação |
|---|---|---|
| T1 | `AUTH-SECURITY` operacional nomeado e ADR-0022 aceito | Fechar a cláusula adiada de custódia; definir hierarquia e rotação |
| T2 | Parecer jurídico determinar exigência de cifragem por sujeito ou apagamento criptográfico | Revisita imediata; a Opção C volta à mesa com o custo clínico de D4 explícito |
| T3 | Surgir necessidade real de busca textual sobre narrativa clínica | Revisita antes de criar qualquer índice — um índice é uma cópia |
| T4 | Plataforma/residência decididas (ADR-0019) | Reconciliar o inventário de cópias cifradas com a topologia real |
| T5 | Detecção de segredo em repositório, imagem ou log | Falha de gate; rotação imediata e revisita do controle |

**Kill switch.** Não há desligamento de criptografia. O único controle acionável é
**interromper o fluxo** (parar o consumo de dado real) — na fatia atual isso é trivial,
porque não há dado real.

## 8. Validação

| # | Alegação | Método | Ambiente | IDs |
|---|---|---|---|---|
| V1 | Nenhum hop em texto claro existe | Teste de configuração TLS, incluindo downgrade e certificado inválido | ambiente futuro | SEC-0011 |
| V2 | Toda cópia inventariada está cifrada | Reconciliação automatizada inventário × mapa de dados | ambiente futuro | SEC-0012 |
| V3 | Segredo ausente faz a aplicação falhar ao iniciar | Teste de inicialização com segredo removido | dev/CI | SEC-0014 |
| V4 | Nenhum dado sensível atravessa log, traço, métrica ou corpo de erro | Fixtures-canário sintéticas empurradas por todos os caminhos de saída, com afirmação de redação | dev/CI | SEC-0015 |
| V5 | O esquema permite cifragem por sujeito sem migração destrutiva | Revisão de esquema + ensaio de migração em base sintética | dev/CI | QAS-0027 |
| V6 | Rotação e recuperação de chave funcionam | **Ensaio de rotação e ensaio de perda de chave** — NÃO EXECUTÁVEIS hoje (sem custodiante) | ambiente futuro | SEC-0013 |

## 9. Supersessão e pendências

- **Supersede:** nenhuma. **Superseded por:** nenhuma.
- **Pendência:** `adr-index.md` continua marcando `ADR-0017` como `not-started`; atualizar
  o índice está fora do escopo de escrita desta tarefa.
- **Pendência (cláusula adiada):** custódia concreta de chave — ADR-0022, `AUTH-SECURITY`
  (`BLK-0003`).
- **Pendência:** decisão do dono de privacidade sobre dado clínico pesquisável em claro —
  `AUTH-PRIVACY-LEGAL` (`BLK-0004`).
