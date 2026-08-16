---
doc_id: DEVSECOPS-POLITICA-METADADOS-MUDANCA
status: PROPOSAL
owner: UNASSIGNED — VALIDATION REQUIRED
source: >
  docs/00-governance/traceability-policy.md §4 (PR-linking requirement,
  já existente — esta política opera no mesmo espírito, estendido a
  commits); docs/00-governance/evidence-notation.md (rótulos epistêmicos
  e disciplina de proveniência); docs/00-governance/registers/
  decision-register.md GDEC-0013..GDEC-0017 (regime MODO CONSTRUÇÃO —
  vinculantes apenas CI de convenções/conteúdo proibido-PHI, PR para
  main, dados sintéticos como default); .github/PULL_REQUEST_TEMPLATE.md
  e scripts/check_change_metadata.py (mecanismo de enforcement, mesma
  fatia); instrução de tarefa §15.1 item G (2026-08-16)
date_collected: 2026-08-16
collector: agente de metadados de mudança (§15.1 item G, ciclo 6)
last_updated: 2026-08-16
---

# Política de metadados de mudança

**Status: PROPOSAL.** Este documento não decide nada por si só; ele
**operacionaliza**, para commits e Pull Requests deste repositório, o
requisito de vínculo PR↔IDs rastreados que
`docs/00-governance/traceability-policy.md` §4 já registra como PROPOSAL
desde o ciclo 0 ("Every implementation pull request must link the
requirements, hazards, ADRs, contracts, tests, and user evidence it
changes"), e o estende explicitamente a commits, não apenas à descrição do
PR.

PREMISSA (reversível, GDEC-0015/0017): a forma de enforcement escolhida
nesta fatia é um gate de CI bloqueante (`scripts/check_change_metadata.py`
+ `.github/workflows/metadados-gates.yml`) que verifica **apenas a
presença** de ao menos uma referência a ID da taxonomia — não a
veracidade, completude ou correção semântica dessa referência. Uma
verificação mais rica (ex.: resolver o ID citado contra o catálogo/
registro correspondente, per `traceability-policy.md` §4 item 4) é
trabalho futuro, não construído nesta fatia.

## 1. Regra vinculante

1. **Todo commit** neste repositório referencia **ao menos um ID
   rastreado** — de qualquer prefixo já ratificado em
   `traceability-policy.md` §1 (ex.: `ADR-`, `SAF-`, `HAZ-`, `VAL-`,
   `RISK-`, `TST-`, ...), das extensões de governança do mesmo §1
   (`EVID-`, `ASM-`, `GDEC-`, `BLK-`) ou das extensões pendentes de
   ratificação listadas em §1.1 (ex.: `THR-`, `SPR-`) — **no título do
   commit ou em um trailer `Refs:` no corpo do commit.**
2. **Todo Pull Request** usa `.github/PULL_REQUEST_TEMPLATE.md` e
   preenche a seção "IDs rastreados (Refs:)" com ao menos um ID nas
   mesmas condições do item 1.
3. A condição de passagem do gate automatizado (§2 abaixo) é satisfeita
   se **o corpo do PR OU qualquer commit do intervalo** contiver ao menos
   uma referência válida — não é exigido que cada commit individualmente
   carregue uma referência, desde que o PR como um todo carregue pelo
   menos uma. Isso é uma escolha deliberada de fricção mínima para o
   regime MODO CONSTRUÇÃO (GDEC-0013): a exigência é rastreabilidade do
   PR como unidade de mudança, não de cada commit isoladamente.
4. Um commit ou PR de correção puramente editorial, sem decisão material
   e sem ID de taxonomia aplicável, ainda assim precisa de uma referência
   — mesmo que seja ao próprio documento/área de governança tocada (ex.:
   `GDEC-0017` para qualquer mudança feita sob o regime de construção) ou
   ao sprint do mapa correspondente (`SPR-Gn-m`). Não há isenção "sem ID
   aplicável" nesta política; se nenhum ID específico existe, cite o
   sprint do mapa ou a decisão de regime vigente.

## 2. Mecanismo de enforcement

- **Script**: `scripts/check_change_metadata.py`. Uso:
  `python3 scripts/check_change_metadata.py --base <sha> --head <sha>`.
  Verifica o corpo do PR (quando disponível via evento do GitHub Actions)
  e a mensagem de cada commit no intervalo `<base>..<head>` contra um
  padrão de reconhecimento de IDs da taxonomia. Sai com código `1` e
  mensagem clara em pt-BR se nenhuma referência for encontrada; sai com
  código `0` e um resumo do que foi encontrado caso contrário.
- **Workflow**: `.github/workflows/metadados-gates.yml`, disparado em
  `pull_request` para `main`, job **bloqueante** (sem
  `continue-on-error`, sem `if: always()` que engula falha — mesma
  disciplina de `docs-gates.yml` e `ci-plataforma.yml`, per
  `INTENSICARE_V2_ORCHESTRATOR_PROMPT.md` §3 regra 13).
- Este gate **não substitui** `doc-conventions` nem `forbidden-content`
  (`docs-gates.yml`) nem `build-and-test` (`ci-plataforma.yml`) — é
  cumulativo a eles.

## 3. O que esta política não faz

- Não resolve o ID citado contra nenhum catálogo/registro (isso
  permanece `traceability-policy.md` §4 item 4, "manual reviewer gate"
  até que exista tal verificação).
- Não impõe formato `Refs:` como único aceito para o gate automatizado —
  o script aceita qualquer referência a ID reconhecível em qualquer
  posição do texto verificado (título, corpo, trailer). `Refs:` é a
  convenção **recomendada** para legibilidade humana, não um requisito
  sintático do próprio gate.
- Não decide, ratifica ou fecha nenhum bloqueador, gate, risco ou hazard.
- Não é uma alegação de efetividade clínica, conformidade regulatória ou
  segurança comprovada — é disciplina de rastreabilidade de mudança.

## 4. Relação com o template de PR

`.github/PULL_REQUEST_TEMPLATE.md` operacionaliza esta política em nível
humano (o que se espera que quem abre o PR preencha); esta política e o
gate de CI operacionalizam a mesma exigência em nível de máquina (o
mínimo que efetivamente bloqueia o merge). As duas camadas são
complementares: o template pode ser preenchido de forma incompleta sem
que o gate necessariamente falhe (ex.: uma referência a ID em um commit
satisfaz o gate mesmo que a seção do template fique menos detalhada) — a
revisão humana (`.github/CODEOWNERS`) continua responsável pela
completude e veracidade que o gate automatizado não verifica.
