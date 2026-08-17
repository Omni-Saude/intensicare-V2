---
id: ADR-0022
title: Build, dependências pinadas, e estratégia de software-supply-chain — assinatura de artefato e SBOM como pendência de G8
status: PROPOSAL
status_history:
  - status: PROPOSAL
    date: 2026-08-16
    by: especialista de build/DevSecOps (ciclo 6, construção)
    note: >
      ID reservado como not-started em adr-index.md §3 (fase mais cedo "0 — seed").
      Minuta redigida agora, materializando a DIREÇÃO já aceita pelo titular em
      GDEC-0016, sob o regime de construção GDEC-0013/0015/0017. Ver §5 sobre a
      distinção entre "direção aceita" e "minuta ratificada cláusula a cláusula".
date: 2026-08-16
owner: UNASSIGNED — VALIDAÇÃO NECESSÁRIA
approvers:
  - UNASSIGNED — VALIDAÇÃO NECESSÁRIA   # papel candidato: AUTH-SECURITY (adr-index.md §3)
  - UNASSIGNED — VALIDAÇÃO NECESSÁRIA   # papel candidato: AUTH-OPERATIONS (adr-index.md §3)
decision_deadline: NÃO DEFINIDO — VALIDAÇÃO NECESSÁRIA
deciding_authority_rule: >
  docs/00-governance/decision-rights.md §2, linha "Decisões de arquitetura
  (ratificação de ADR)": AUTH-SECURITY mais AUTH-OPERATIONS.
independence_check: >
  O autor é preparador, não aprovador. Per decision-rights.md §3, quem operar o
  pipeline de build não pode ser o único aprovador da política que audita o
  próprio pipeline (par titular do pipeline × autoridade de go-live, o mesmo par
  já citado em ADR-0002 §independence_check).
links:
  drivers:
    domain_invariants: [DOM-0005]
    quality_scenarios: [QAS-0024, QAS-0025, QAS-0026]
    risks: ["IDs pendentes no registro de riscos"]
  constrains:
    requirements: ["REQ: catálogo de requisitos pendente"]
    clinical: ["CLR: não aplicável — esta ADR não vincula conteúdo clínico diretamente"]
    safety: ["SAF: nenhuma referência direta — HAZ-0019 é o hazard clínico dependente da integridade de build"]
  hazards: [HAZ-0019, HAZ-0028, HAZ-0013, HAZ-0034, HAZ-0031]
  tests: ["TST: arquitetura de testes pendente"]
  validations: ["VAL: backlog de validação pendente"]
  adrs:
    depends_on: [ADR-0002, ADR-0019]
    feeds: [ADR-0007, ADR-0020]
  gates: [G7, G8]
  evidence:
    - INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §15.1
    - docs/11-security-privacy-compliance/threat-model.md TB-09, THR-0050..THR-0056
supersedes: null
superseded_by: null
provenance:
  source_repo: intensicare-V2
  path_or_url: docs/06-architecture/adrs/ADR-0022-build-dependencias-supply-chain.md
  commit_sha_or_version: 33c749a (HEAD do repositório no momento da redação)
  section_or_lines: >
    INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §15.1 (linhas 1085-1097); §14 (linha
    1055, SCA/secret scanning/SBOM/artifact verification); adr-index.md §3 linha
    ADR-0022, §4.1 linha ADR-0022; threat-model.md TB-09 e THR-0050..THR-0056;
    GDEC-0016/0017
  date_collected: 2026-08-16
  collector: especialista de build/DevSecOps (ciclo 6, construção)
  transformation: reasoned-from
  confidence: medium
  owner: UNASSIGNED — VALIDAÇÃO NECESSÁRIA
  validation_status: VALIDAÇÃO NECESSÁRIA
---

# ADR-0022 — Build, dependências pinadas e estratégia de software-supply-chain

> **Status: accepted (direção GDEC-0016; minuta materializada em construção —
> GDEC-0015).** O titular aceitou, em lote (GDEC-0016, 2026-08-16), a *direção*
> deste tópico. Esta minuta materializa essa direção para permitir construção
> imediata; não é ratificação cláusula a cláusula. **Assinatura de artefato e SBOM
> são explicitamente registradas como pendência para o Gate G8 — não como
> capacidade já implementada** (instrução direta desta tarefa; ver §5).

## 1. Contexto e enunciado do problema

SOURCE (prompt §15.1): criar fronteira de módulo clara e política de
dependência; desenvolvimento local reproduzível e verificação de um comando;
toolchains/dependências pinadas e lockfiles determinísticos; gates de
formatação/lint/type-check/testes/docs/contratos/migração; CODEOWNERS;
proteção de branch e checks obrigatórios; metadados de mudança convencionais
ligados a requisitos/hazards/ADRs; verificações automatizadas de arquivo
gerado/conformidade de documentação; varredura de segredo e política de dado
sintético desde o primeiro commit.

SOURCE (prompt §15.2 item 4): o pipeline deve "gerar SBOM, resultados de
vulnerabilidade/licença, atestados de proveniência e artefatos assinados
imutáveis" — mas esta ADR trata essa capacidade como **alvo do Gate G8**, não
como pré-condição da fatia G7 (INFERENCE do adr-index.md §3, coluna "Fase mais
cedo": "0 (seed) / 6 (completo)" para ADR-0022 — a *forma* do build é seed desde
o início; a *cadeia completa* de assinatura/SBOM amadurece até G6-G8).

INFERENCE (de threat-model.md TB-09 e THR-0050..THR-0056): "o sistema de build é
um sistema de autoridade de produção — quem influencia o build influencia uma
saída clínica". Isso não é uma preocupação abstrata: THR-0050 (dependência
maliciosa/typosquat executa dentro do processo do kernel de segurança
determinístico), THR-0051 (artefato substituído sob um registro verde), THR-0052
(pipeline CI/CD comprometido), THR-0053 (perda/exposição de chave/segredo) são
todos P0.

**Pergunta.** Que disciplina de build, pin de dependência e estratégia de
software-supply-chain governa `apps/api`/`apps/web` e os pacotes
`packages/*` — de modo que THR-0050..THR-0056 tenham controle correspondente
desde o primeiro commit, mesmo que a cadeia completa de assinatura/SBOM só
amadureça até G8?

**Fora de escopo:** ciclo de vida de rule bundle e sua assinatura própria
(ADR-0007, aceita — cita esta ADR como dependência para "artifact signing", ainda
não fechada aqui); observabilidade/SLOs/DR (ADR-0020); plataforma de implantação
concreta (ADR-0019, consumida aqui como insumo); gestão de chave de PHI
(ADR-0017).

## 2. Evidência e premissas

### 2.1 Evidência

| # | Rótulo | Declaração | Fonte | Confiança |
|---|---|---|---|---|
| E1 | SOURCE | Toolchains/dependências pinadas e lockfiles determinísticos; gates de verificação bloqueantes; CODEOWNERS; proteção de branch; varredura de segredo e política de dado sintético desde o primeiro commit. | prompt §15.1 | alta |
| E2 | SOURCE | Pipeline constrói artefato mínimo não-root a partir de dependências de runtime dedicadas; gera SBOM, resultados de vulnerabilidade/licença, atestados de proveniência, artefatos assinados imutáveis; implanta por digest. | prompt §15.2 itens 3-5 | alta |
| E3 | SOURCE | "Never deploy `latest`, placeholder secrets, unpinned actions, or environment-specific builds." | prompt §15.2 | alta |
| E4 | SOURCE | Camada de teste exige SAST, SCA, varredura de segredo, varredura de IaC/container, checagens de SBOM/licença, verificação de artefato, testes de penetração. | prompt §14 (linha 1055) | alta |
| E5 | SOURCE | TB-09: "o sistema de build é um sistema de autoridade de produção"; branch protection hoje **não está configurada** — um humano com acesso de escrita pode mergear além de um check vermelho. | threat-model.md TB-09 | alta |
| E6 | SOURCE | THR-0050 (P0): dependência maliciosa/typosquat/hijacked-maintainer executa dentro do processo do kernel de segurança determinístico → HAZ-0019, HAZ-0028, HAZ-0013. | threat-model.md THR-0050 | alta |
| E7 | SOURCE | THR-0051 (P0): artefato implantado ≠ artefato construído — imagens não assinadas, tags mutáveis (`latest`), sem pin de digest no deploy → lógica clínica substituída sob um registro verde. | threat-model.md THR-0051 | alta |
| E8 | SOURCE | THR-0052 (P0): comprometimento do pipeline CI/CD — ação não pinada/sequestrada, gatilho de workflow alcançável de PR não confiável, token de CI de vida longa. | threat-model.md THR-0052 | alta |
| E9 | SOURCE | THR-0053 (P0): perda/exposição de chave de assinatura, chave de criptografia de dado, credencial AMH, credencial de banco — comprometida ou simplesmente perdida. | threat-model.md THR-0053 | alta |
| E10 | SOURCE | THR-0055 (P0): gate consultivo/`continue-on-error`/auto-pulado/valida zero casos e reporta verde — "um gate falso-verde é pior que nenhum gate". | threat-model.md THR-0055 | alta |
| E11 | SOURCE | Rule bundle depende de assinatura de artefato (ADR-0007, aceita, cita "custódia de chave da ADR-0022" como cláusula adiada). | ADR-0007 (index) | alta |
| E12 | SOURCE | ADR-0002 (aceita, Opção A): monolito modular — um único artefato implantável inicial; ADR-0019 (esta sessão): artefato único promovido por digest, plataforma com driver de residência Brasil. | ADR-0002; ADR-0019 §5.2 | alta |

### 2.2 Premissas

**PREMISSA (reversível, GDEC-0017):** a stack de construção — Node.js 22 LTS,
monorepo pnpm workspaces (pnpm 9), Vitest + fast-check para testes, Stryker
(mutação) registrado como pendência — está registrada em
`docs/06-architecture/premissas-de-construcao.md` pelo agente de scaffold; esta
ADR consome essa premissa como o *como* concreto do pin de dependência abaixo,
sem redecidi-la.

| # | Premissa | Por que é necessária | O que a invalida | Titular |
|---|---|---|---|---|
| A1 | O runner de CI usado é um provedor com suporte a pin de ação por SHA e a segredos com escopo por repositório/ambiente (já em uso neste repositório — `check_doc_conventions.py`/`check_forbidden_content.py` rodam sob esse runner hoje). | O mecanismo concreto de pin/segredo depende dessa capacidade existir. | Migração de plataforma de CI sem suporte equivalente. | UNASSIGNED — VALIDAÇÃO NECESSÁRIA |
| A2 | Nenhum registro de artefato de produção existe ainda — a disciplina de digest/assinatura (E2, E7) é aspiracional até G8. | Evita afirmar uma capacidade que não roda hoje. | Provisionamento real de um registro de artefato. | UNASSIGNED — VALIDAÇÃO NECESSÁRIA |

## 3. Direcionadores de decisão

| # | Direcionador | Por que discrimina | Atributo mensurável | Alvo |
|---|---|---|---|---|
| D1 | Reprodutibilidade (lockfile determinístico, install congelado) | Distingue "todo build a partir do mesmo lockfile produz a mesma árvore de dependência" de "resolução de semver flutuante" (E1) | QAS-0025 | Vinculante |
| D2 | Superfície de ataque mínima do artefato final (E2) | Imagem/artefato final não-root, sem devDependencies, distingue de um artefato que carrega toda a árvore de build | QAS-0024 | VALIDAÇÃO NECESSÁRIA (limiares) |
| D3 | Gate bloqueante, nunca falso-verde (E5, E10) | O discriminador mais afiado desta ADR: um gate consultivo é pior que nenhum gate (E10) | QAS-0025 | Vinculante |
| D4 | Integridade da cadeia de build→artefato→deploy (E7, E8, E9) | Distingue "digest verificado + segredo com custódia" de "tag mutável + segredo compartilhado" | QAS-0026 | Vinculante em estrutura; SBOM/assinatura concreta VALIDATION REQUIRED até G8 (instrução desta tarefa) |
| D5 | Custo/velocidade da fatia G7 | Exigir a cadeia completa de assinatura/SBOM antes de qualquer commit atrasaria G7 sem justificar-se com uma superfície de ataque ainda pequena | QAS-0026 | VALIDAÇÃO NECESSÁRIA |
| D6 | Coerência com ADR-0007 (assinatura de rule bundle) | A infraestrutura de assinatura de artefato de código deveria, quando existir, ser reaproveitável pela assinatura de bundle clínico — não duas soluções paralelas | — | Vinculante por coerência (E11) |
| D7 | Varredura de dependência/segredo desde o primeiro commit (E1, E4) | Distingue disciplina desde o dia 1 de disciplina retrofit — E1 é explícito: "from the first commit" | QAS-0025 | Vinculante |

## 4. Alternativas consideradas

### Opção A — Lockfile pinado + install congelado em CI, build determinístico, artefato mínimo não-root; SBOM/assinatura de artefato e atestado de proveniência explicitamente diferidos para o Gate G8 como pendência registrada (elaboração da direção aceita GDEC-0016)

**Descrição.** Todo pacote/app do monorepo consome `pnpm-lock.yaml` committado;
CI instala com `pnpm install --frozen-lockfile` (ou equivalente), falhando se o
lockfile divergir do manifesto — nenhuma resolução de dependência "ao vivo" em
CI. O artefato final de `apps/api`/`apps/web` (E12: monolito modular único)
constrói a partir de dependências de runtime dedicadas, sem ferramentas de
desenvolvimento, executando como usuário não-root. Ações de CI são pinadas por
SHA (já observado como prática parcial no repositório, E5). SAST/SCA/varredura de
segredo rodam desde o primeiro commit sobre o código-fonte já existente (E1, E4).
**SBOM, atestado de proveniência assinado e verificação de assinatura de
artefato no deploy são nomeados explicitamente como pendência do Gate G8** — a
fatia G7 usa artefato não assinado, sob dado exclusivamente sintético e sem
promoção a ambiente de produção (herda ADR-0019 P1: apenas dev/CI efêmero
provisionados hoje).

**Frente aos direcionadores.** D1 forte (lockfile + install congelado é o
mecanismo canônico de reprodutibilidade). D2 forte em estrutura (artefato de
runtime dedicado); limiares concretos ficam VALIDATION REQUIRED. D3 forte —
todo gate desta minuta é bloqueante por design (§5.2 S1-S8), respondendo
diretamente a E10. D4 — estrutura vinculante (digest, segredo namespaced por
ADR-0019 P5), mas a peça de assinatura/SBOM é honestamente diferida, não
fingida. D5 — a fatia G7 não fica bloqueada por uma capacidade cuja ausência de
infraestrutura de produção (A2) a tornaria teatro de segurança se implementada
cedo demais sem registro real para assinar. D6 — a mesma disciplina de chave de
assinatura, quando construída, serve ADR-0007. D7 forte desde o primeiro commit.

**Consequências positivas.** Nenhum gate falso-verde (E10 diretamente
endereçado); a pendência de G8 é **nomeada e rastreável**, não silenciosamente
esquecida — a diferença central entre "diferir com registro" e "nunca ter
decidido".

**Consequências negativas.** THR-0051 (artefato substituído sob registro verde)
permanece um risco **aceito e não mitigado** até G8 fechar — isso precisa
permanecer visível como risco residual, não escondido atrás do rótulo
"pendência"; nenhuma garantia de proveniência de artefato existe para qualquer
demonstração antes de G8.

**O que precisaria ser verdade.** A1 (o runner de CI suporta pin por SHA e
segredo com escopo); a organização aceita o risco residual THR-0051/0053 durante
G7 sob dado exclusivamente sintético, sem promoção a produção.

**Custo de saída.** Baixo: SBOM e assinatura são aditivos ao pipeline existente
quando G8 se aproximar — nada nesta opção precisa ser desfeito para adicioná-los.

### Opção B — Cadeia completa de supply-chain hardening desde o primeiro commit (SBOM + assinatura de artefato + atestados de proveniência já operacionais)

**Descrição.** Toda a disciplina de E2 (SBOM, assinatura, proveniência) é
implementada antes de qualquer código de domínio.

**Frente aos direcionadores.** D4 mais forte em cobertura completa desde o
início. D5 mais fraco — atrasa G7 significativamente para construir
infraestrutura de assinatura/registro contra um artefato que ainda nem existe
(A2); D1/D3/D7 equivalentes à Opção A.

**Consequências positivas.** Nenhum período de risco residual THR-0051 aceito;
postura de segurança máxima desde o dia 1.

**Consequências negativas.** Constrói infraestrutura de produção (registro de
artefato assinado, custódia de chave) antes de haver ambiente de produção
provisionado (ADR-0019 A1: apenas dev/CI efêmero existem hoje) — trabalho que
pode precisar ser refeito quando o fornecedor de plataforma for selecionado
(ADR-0019 C2); contradiz a instrução explícita desta tarefa de tratar
SBOM/assinatura como pendência de G8.

**O que precisaria ser verdade.** Um fornecedor de plataforma e registro de
artefato já selecionados (ADR-0019 C2, hoje aberta).

**Custo de saída.** Moderado — infraestrutura construída cedo demais pode
precisar ser adaptada quando o fornecedor real for escolhido.

### Opção C — Sem disciplina de pin (ranges semver soltos, sem lockfile congelado)

**Descrição.** Dependências resolvidas livremente em cada build; nenhum lockfile
committado ou nenhum `--frozen-lockfile` em CI.

**Frente aos direcionadores.** D1 **diretamente violado** — contradiz E1
("pinned toolchains/dependencies and deterministic lockfiles" é não-negociável).
D7 enfraquecido — uma dependência maliciosa publicada entre builds entraria sem
detecção determinística.

**Consequências positivas.** Nenhuma — listada apenas para registrar sua
rejeição honestamente.

**Consequências negativas.** Viola diretamente uma regra não-negociável do
prompt (E1); reproduz exatamente o vetor de THR-0050.

**O que precisaria ser verdade.** Nada — esta opção é excluída pelo próprio
enunciado §15.1.

**Custo de saída.** Não aplicável — opção não adotável.

### Opção Z — Adiar toda disciplina de build/CI até depois da primeira fatia vertical

**Descrição.** Nenhuma política de pin, gate ou varredura registrada; construir
primeiro, formalizar depois.

**Consequências positivas.** Nenhum atrito de processo nos primeiros commits.

**Consequências negativas.** Contradiz diretamente o mapa de gate do
`adr-index.md` §3, que já marca ADR-0022 com fase mais cedo "0 (seed)" — a
própria reserva do ID já presume disciplina de seed desde o início; reproduz
E10 por omissão (nenhum gate é pior que um gate falso-verde apenas na aparência —
na prática ambos deixam THR-0050..THR-0053 sem controle).

**Custo do atraso.** Cresce a cada commit sem lockfile congelado ou varredura —
o corpus de dependências não revisadas aumenta.

### 4.1 Comparação frente aos direcionadores

| Direcionador | A — pin + gates bloqueantes; SBOM/assinatura diferidos a G8 | B — hardening completo desde o dia 1 | C — sem pin | Z — adiar tudo |
|---|---|---|---|---|
| D1 reprodutibilidade | Forte | Forte | **Violado** | Ausente |
| D2 superfície mínima | Forte em estrutura | Forte | Ausente | Ausente |
| D3 gate bloqueante | Forte (E10 endereçado) | Forte | N/A | Ausente (falso-verde por omissão) |
| D4 integridade build→deploy | Estrutural, SBOM/assinatura diferidos e nomeados | Completa desde o início | Ausente | Ausente |
| D5 custo/velocidade G7 | Equilibrado | Atraso significativo | Rápido, mas inseguro | Rápido, mas insustentável |
| D6 coerência ADR-0007 | Compatível (infra reaproveitável quando existir) | Compatível, construída cedo | N/A | Não resolvido |
| D7 varredura desde o 1º commit | Vinculante | Vinculante | Ausente | Ausente |

## 5. Decisão e escopo

**Direção aceita (GDEC-0016, 2026-08-16):** **Opção A** — lockfile pinado +
install congelado em CI, build determinístico, artefato mínimo não-root, gates
bloqueantes desde o primeiro commit, com **SBOM, atestado de proveniência e
assinatura de artefato explicitamente registrados como pendência do Gate G8**
(instrução direta desta tarefa, coerente com adr-index.md §3 "fase mais cedo: 0
(seed) / 6 (completo)"). A minuta §5.2 materializa essa direção como premissa
reversível de construção (GDEC-0013/0015).

**Escopo vinculado (enquanto premissa de construção):** disciplina de lockfile e
install congelado; gates bloqueantes de formatação/lint/tipo/teste/docs/contrato;
varredura de segredo e dado sintético desde o primeiro commit; artefato final
mínimo não-root.

**Não vinculado:** SBOM, atestado de proveniência assinado e verificação de
assinatura no deploy — nomeados aqui como pendência, sua *forma* concreta é
matéria de ratificação futura antes de G8; fornecedor de registro de artefato
(ADR-0019); custódia de chave de assinatura (interage com ADR-0017/ADR-0007).

### 5.1 Condições para ratificação formal (cláusula a cláusula, humana)

| # | Condição | Titular | Evidência que a fecha | Estado |
|---|---|---|---|---|
| C1 | Branch protection configurada no repositório (E5 registra que hoje não está). | AUTH-SECURITY | Configuração de proteção de branch com checks obrigatórios | ABERTA — GAP JÁ OBSERVADO (E5), não introduzido por esta ADR |
| C2 | ADR-0019 (plataforma) com fornecedor/registro de artefato selecionado — pré-requisito para qualquer assinatura real. | autoridade do ADR-0019 | ADR-0019 C2 fechada | ABERTA (depende de ADR-0019 §5.1 C2) |
| C3 | Custódia de chave de assinatura definida — cláusula adiada citada pelo próprio ADR-0007. | AUTH-SECURITY | Anexo de custódia de chave ratificado | ABERTA — explicitamente diferida a G8 |
| C4 | Limiares de D2 (o que conta como "mínimo" no artefato não-root) e de D5 (orçamento de tempo de build aceitável) declarados. | AUTH-OPERATIONS | Metas em quality-attribute-scenarios.md deixam de ler VALIDATION REQUIRED | ABERTA |

### 5.2 Minuta normativa (o que a construção segue sob GDEC-0015/0017)

**S1 — Lockfile committado e install congelado.** `pnpm-lock.yaml` é committado
na raiz do monorepo; CI instala com `--frozen-lockfile` (ou flag equivalente);
divergência entre manifesto e lockfile **falha o build**, nunca resolve
silenciosamente (D1; E1).

**S2 — Toolchain pinado.** Versão de Node.js (22 LTS) e de pnpm (9) são
declaradas de forma verificável (`engines`/arquivo de versão de toolchain) e
conferidas em CI; um runner com versão divergente falha, não degrada.

**S3 — Artefato final mínimo, não-root.** O artefato implantável de
`apps/api`/`apps/web` (E12: monolito modular único) contém apenas dependências
de runtime — nenhuma ferramenta de build/dev — e executa como usuário não-root
(E2).

**S4 — Gates bloqueantes desde o primeiro commit.** Formatação, lint, checagem
de tipo estrito, testes, conformidade de documentação (`check_doc_conventions.py`,
`check_forbidden_content.py`) e validação de contrato (quando ADR-0012 tiver
artefato a validar) são checks obrigatórios — **nenhum é `continue-on-error`,
auto-pulável, ou pode validar zero casos e reportar verde** (D3; E10 é o
discriminador direto desta cláusula).

**S5 — Ações de CI pinadas por SHA; segredo com escopo mínimo.** Toda ação de
terceiro é referenciada por SHA completo, nunca por tag mutável; segredos de CI
são escopados por repositório/ambiente e nunca logados (E5, E8, E9).

**S6 — Varredura desde o primeiro commit.** SCA (dependências vulneráveis) e
varredura de segredo rodam sobre todo PR desde já — `check_forbidden_content.py`
já cobre parte dessa disciplina para conteúdo de documentação; a varredura de
código-fonte/dependência é adicionada com a primeira dependência de produto
introduzida (E1, E4).

**S7 — Digest, nunca tag mutável.** Quando um registro de artefato existir
(pós-ADR-0019 C2), a promoção entre ambientes referencia digest imutável — nunca
`latest` ou tag mutável (E3, E7). Até lá, a fatia G7 não promove nenhum artefato
além de dev/CI efêmero (herda ADR-0019 P1).

**S8 — SBOM, proveniência e assinatura: pendência nomeada de G8.** Este ADR
**não implementa** geração de SBOM, atestado de proveniência assinado, ou
verificação de assinatura no deploy. Essas três capacidades são registradas
como **condição de entrada do Gate G8** (prompt §15.3, checklist go/no-go: "release
artifact digest, rule-bundle hashes, dependencies/SBOM"), com C2/C3 desta ADR
como seus pré-requisitos. Nenhuma alegação de que essas capacidades já existem é
permitida em nenhum artefato de release antes de G8 — fazê-lo seria, ele mesmo,
uma instância de THR-0055 (gate falso-verde).

### 5.3 Escopo do que a aceitação vincularia

**Vincula:** disciplina de lockfile/toolchain pinado (S1/S2); artefato mínimo
não-root (S3); gates bloqueantes sem exceção (S4); pin de ação/segredo com
escopo (S5); varredura desde o primeiro commit (S6); digest em vez de tag
mutável quando aplicável (S7); o registro explícito de SBOM/proveniência/
assinatura como pendência de G8, não como capacidade presumida (S8).

**Não vincula:** a forma final de SBOM/assinatura (matéria de ratificação
futura); fornecedor de registro de artefato (ADR-0019); custódia de chave
(interage com ADR-0007/ADR-0017).

## 6. Consequências

### 6.1 Positivas

- THR-0050 (dependência maliciosa), THR-0052 (pipeline comprometido) e THR-0055
  (gate falso-verde) ganham controle estrutural desde o primeiro commit (S1, S4,
  S5, S6), mesmo sem a cadeia completa de assinatura.
- A pendência de SBOM/assinatura (S8) é **nomeada e rastreável** contra o
  checklist go/no-go de G8 (prompt §15.3) — não uma omissão silenciosa.
- Reaproveitamento futuro da mesma disciplina de chave/assinatura por ADR-0007
  (rule bundle) é preservado como possibilidade (D6), não fechado por uma escolha
  paralela feita cedo demais.

### 6.2 Negativas

- THR-0051 (artefato substituído sob registro verde) e THR-0053 (perda/exposição
  de chave de assinatura) permanecem **risco residual aceito e não mitigado**
  até G8 fechar — isto precisa aparecer no registro de risco quando existir, não
  apenas nesta ADR.
- C1 (branch protection ausente) é um gap **já observado**, não introduzido por
  esta ADR — mas esta ADR o torna formalmente uma condição aberta em vez de um
  fato disperso em threat-model.md.

### 6.3 Neutras/estruturais

- Nada aqui seleciona registro de artefato, ferramenta de SBOM, ou esquema de
  assinatura (cosign, sigstore, ou equivalente) — essas são decisões futuras
  quando C2/C3 fecharem.

## 7. Implicações transversais

| Dimensão | Implicação | Rótulo | Papel titular | ID de acompanhamento |
|---|---|---|---|---|
| Segurança clínica | Um build comprometido (THR-0050) executa dentro do processo do kernel de segurança determinístico (E6) — HAZ-0019 (avaliação por lógica não ratificada) é o hazard clínico dependente. Nenhum controle clínico substitui integridade de build. | INFERENCE de E6 | AUTH-CLINSAFETY | HAZ-0019 |
| Segurança (security) | S1-S7 endereçam diretamente THR-0050..THR-0053/0055; S8 nomeia o gap residual em vez de escondê-lo. | SOURCE (threat-model.md TB-09) | AUTH-SECURITY | THR-0050, THR-0051, THR-0052, THR-0053, THR-0055 |
| Privacidade (LGPD) | Segredo/credencial com escopo mínimo (S5) reduz superfície de exposição de credencial que poderia levar a PHI (HAZ-0028 via THR-0053). | INFERENCE | AUTH-PRIVACY-LEGAL (não nomeado) | HAZ-0028 |
| Interoperabilidade | Nenhuma implicação direta — o contrato externo (ADR-0012/0013) não muda com a disciplina de build. | INFERENCE | AUTH-DATA-PLATFORM | ADR-0012 |
| Acessibilidade | Nenhuma implicação direta de build; indireta via gates de acessibilidade automatizados (ADR-0021) que rodam no mesmo pipeline S4. | INFERENCE | AUTH-UX | ADR-0021 |
| Operacional | CODEOWNERS, proteção de branch (C1) e checks obrigatórios (S4) tornam-se disciplina operacional de primeira classe desde o primeiro commit; a pendência S8 vira item de tracking explícito rumo a G8. | INFERENCE | AUTH-OPERATIONS | C1; ADR-0020 |
| Custo | Nenhum modelo de custo existe; adiar SBOM/assinatura para G8 (S8) é, em parte, uma decisão de custo/velocidade explícita (D5), dita honestamente. | VALIDATION REQUIRED | AUTH-OPERATIONS | pendente |
| Migração | Quando C2 (fornecedor/registro) fechar, a introdução de S8 é aditiva ao pipeline existente — nenhuma reescrita de S1-S7 é necessária (Opção A, custo de saída baixo). | INFERENCE | AUTH-OPERATIONS | ADR-0019 |

## 8. Reversibilidade, gatilhos de revisita, kill/rollback

### 8.1 Avaliação de reversibilidade

| Opção | Reversibilidade | O que fica encalhado | Rótulo |
|---|---|---|---|
| A | Alta — SBOM/assinatura são aditivos quando G8 se aproximar | Nada estrutural; risco residual THR-0051/0053 é temporal, não uma dívida técnica | INFERENCE |
| B | Alta tecnicamente, mas o trabalho antecipado pode precisar refeito ao selecionar fornecedor (ADR-0019 C2) | Infraestrutura de registro/assinatura construída contra um fornecedor ainda não escolhido | INFERENCE |
| C | n/a — opção não adotável (viola E1) | n/a | INFERENCE |
| Z | n/a — custo de opção crescente por commit sem disciplina | n/a | INFERENCE |

### 8.2 Gatilhos de revisita

| # | Gatilho | Detecção | Notifica | Ação |
|---|---|---|---|---|
| T1 | ADR-0019 C2 fecha (fornecedor/registro de artefato selecionado) | Registro de decisão | AUTH-SECURITY, AUTH-OPERATIONS | Iniciar S8 (SBOM/proveniência/assinatura) contra o registro real |
| T2 | Aproximação do Gate G8 (checklist go/no-go, prompt §15.3) | Plano de gate | AUTH-SECURITY | S8 deixa de ser pendência e vira condição bloqueante de promoção |
| T3 | Branch protection configurada (C1 fecha) | Configuração de repositório | AUTH-SECURITY | Fechar C1; conferir que nenhum check pode ser mergeado em vermelho |
| T4 | Qualquer gate reportar verde validando zero casos (instância de THR-0055) | Auditoria de pipeline | AUTH-SECURITY | Tratar como incidente — bloquear merge até corrigido, nunca como variação aceitável |
| T5 | ADR-0007 (rule bundle) ratificada com cláusula de custódia de chave | Registro de decisão | autoridade desta ADR | Reconciliar S8/C3 com o texto ratificado de ADR-0007 |

### 8.3 Kill switch / rollback

Nada a desligar em `proposed`/construção. Restrição permanente: **nenhum
artefato desta V2 é promovido a um ambiente além de dev/CI efêmero (ADR-0019 P1)
sem que S8 tenha fechado** — a fatia G7, por definição, não promove a produção,
então esta restrição não bloqueia G7, mas bloqueia qualquer tentativa de pular
direto a um ambiente real sem a cadeia completa. Uma tentativa de fazê-lo é
defeito bloqueante de revisão, não variação.

## 9. Método de validação e evidência vinculada

| # | Alegação | Método de validação | Ambiente | IDs vinculados |
|---|---|---|---|---|
| V1 | Build com lockfile divergente falha, nunca resolve silenciosamente. | Teste de CI: alterar manifesto sem atualizar lockfile, afirmar falha. | CI | D1; QAS-0025 |
| V2 | Gate de documentação/conteúdo proibido é bloqueante — PR com violação não mergeia. | Fixture deliberadamente violadora + asserção de bloqueio (já em uso pelos scripts existentes). | CI | D3; THR-0055 |
| V3 | Nenhum gate é `continue-on-error` nem valida zero casos. | Auditoria de configuração de pipeline; teste de fixture "zero casos coletados deve falhar". | CI | E10; QAS-0025 |
| V4 | Artefato final não contém ferramenta de build/dev e roda não-root. | Inspeção de imagem/artefato + teste de usuário de execução. | CI + ambiente efêmero | D2; E2 |
| V5 | Nenhum segredo aparece em log de CI. | Varredura de log + teste de fixture de segredo sintético (canário). | CI | THR-0053; check_forbidden_content.py |

## 10. Relações de supersessão

- **Supersede:** nenhuma.
- **Superseded by:** nenhuma.
- **Notas de relação:** fecha a cláusula de custódia de chave citada como adiada
  por ADR-0007 apenas parcialmente — S8 nomeia o compromisso futuro, não o
  fecha; consome ADR-0002 (unidade de implantação) e ADR-0019 (plataforma/driver
  de residência) como insumos; alimenta ADR-0007 (assinatura de bundle) e
  ADR-0020 (SLO/observabilidade de pipeline).

## 11. Autoverificação contra o gate de completude do template

Campos de identidade presentes; quatro alternativas (A/B/C/Z) com consequências
positivas e negativas honestas — C é rejeitada por violar regra não-negociável
do prompt e isso é dito explicitamente; direcionadores mapeados a QAS
existentes; **nenhum limiar numérico inventado**; **SBOM/assinatura de artefato
tratados explicitamente como pendência de G8, nunca como capacidade já
implementada** (instrução direta desta tarefa, cumprida em §5/S8); oito linhas
transversais presentes; reversibilidade, gatilhos e kill/rollback presentes;
validação com IDs reais; supersessão declarada; nenhuma tecnologia de registro
de artefato/assinatura selecionada; nenhuma aprovação fabricada; `adr-index.md`
**não** foi tocado por este autor (fora do escopo de escrita desta tarefa).
