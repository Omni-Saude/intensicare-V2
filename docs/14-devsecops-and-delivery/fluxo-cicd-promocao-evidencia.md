---
doc_id: DEVSECOPS-FLUXO-CICD-PROMOCAO-EVIDENCIA
status: PROPOSAL
owner: UNASSIGNED — VALIDATION REQUIRED
source: >
  INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §19 (diagrama exigido — fluxo de promoção CI/CD
  e evidência); §15.1-§15.2 (fundação de repositório, ambientes e entrega); §3 regra 13;
  docs/14-devsecops-and-delivery/ci-policy.md; docs/14-devsecops-and-delivery/branch-protection-request.md;
  HANDOFF.yaml
date_collected: 2026-08-15
collector: autor de diagramas de arquitetura e fluxo (ciclo 1, tarefa de diagramas)
last_updated: 2026-08-15
---

# IntensiCare V2 — Fluxo de promoção CI/CD e evidência

**Status: PROPOSAL quanto à forma do pipeline futuro; OBSERVADO quanto ao que existe
hoje.** Este arquivo é **novo** — não edita `ci-policy.md` nem
`branch-protection-request.md`, que permanecem a autoridade textual sobre o que existe e
o que está bloqueado. Este diagrama apenas **renderiza** o que esses dois documentos (e
`HANDOFF.yaml`) já registram, tornando visível quanto do pipeline de 11 passos do prompt
§15.2 é real hoje: **um passo parcial, de onze.**

## 1. Legenda

| Marcação | Significado |
|---|---|
| **OBSERVADO** (sólido) | Existe e roda hoje, verificado nesta revisão. |
| **ALVO PROPOSTO** (tracejado laranja) | Passo do pipeline §15.2 nomeado pelo prompt; nada construído. |
| **BLOQUEADO** (tracejado vermelho escuro) | Existe uma decisão/recurso específico faltando que impede o passo de começar, citado no próprio nó. |

## 2. Diagrama

```mermaid
flowchart TB
    classDef observed fill:#0b3d2e,stroke:#25a07a,stroke-width:3px,color:#ffffff
    classDef proposed fill:#2b2b2b,stroke:#e07a5f,stroke-width:2px,stroke-dasharray:6 4,color:#ffffff
    classDef blocked fill:#4a1f1f,stroke:#e07a5f,stroke-width:2px,stroke-dasharray:3 3,color:#ffffff

    subgraph HOJE["O que existe hoje — OBSERVADO 2026-08-14, enforcement atualizado 2026-08-15"]
        direction TB
        PUSH["push ou pull_request<br/>para qualquer branch"]:::observed
        WF["workflow Docs Gates<br/>(.github/workflows/docs-gates.yml)"]:::observed
        J1["job doc-conventions<br/>check_doc_conventions.py<br/>BLOCKING"]:::observed
        J2["job forbidden-content<br/>check_forbidden_content.py<br/>BLOCKING"]:::observed
        BP["Proteção de branch em main<br/>DEC-G0-09 (2026-08-15): configurada —<br/>checks obrigatórios, enforce_admins,<br/>histórico linear, PR obrigatório"]:::observed
    end

    subgraph P1["Passo 1 — Validar fonte/schemas/docs/status de ADR/migrações/contratos/rastreabilidade"]
        direction TB
        S1["Fatia docs-conventions: EXISTE (acima)<br/>Restante do passo 1 (schema/contrato/migração):<br/>BLOQUEADO — nenhuma linguagem/framework escolhida"]:::blocked
    end

    subgraph RESTANTE["Passos 2-11 do pipeline §15.2 — NENHUM EXISTE"]
        direction TB
        S2["2. Testes determinísticos + suítes de integração/E2E<br/>BLOQUEADO — sem runner/framework (ADR de stack)"]:::proposed
        S3["3. Build de artefatos mínimos não-root<br/>BLOQUEADO — sem toolchain/imagem base"]:::proposed
        S4["4. SBOM, vulnerabilidade/licença, proveniência,<br/>artefatos assinados<br/>BLOQUEADO — sem ferramenta SBOM nem política de assinatura"]:::proposed
        S5["5. Deploy por digest em ambiente efêmero<br/>BLOQUEADO — sem alvo de implantação (ADR-0019)"]:::proposed
        S6["6. Migrações com estratégia de<br/>compatibilidade/backup/timeout/rollback<br/>BLOQUEADO — sem banco de dados escolhido"]:::proposed
        S7["7. Conformidade AMH/conector, sondas de segurança<br/>sintéticas, acessibilidade, performance, restore<br/>BLOQUEADO — Gate G3 (fronteira AMH não resolvida)"]:::proposed
        S8["8. Criar pacote de evidência de release<br/>BLOQUEADO — depende dos passos 1-7"]:::proposed
        S9["9. Exigir aprovações de separação de funções<br/>BLOQUEADO — todo papel AUTH-* segue UNASSIGNED<br/>(Gate G0, BLK-0001..0008)"]:::proposed
        S10["10. Promover o artefato idêntico<br/>entre ambientes<br/>BLOQUEADO — ADR de plataforma inexistente"]:::proposed
        S11["11. Rollback/roll-forward rápido, kill switch de<br/>regra, isolamento de conector, reconciliação<br/>BLOQUEADO — depende de um sistema em execução"]:::proposed
    end

    subgraph REGRA["Regra que nunca muda (prompt §3 regra 13)"]
        direction TB
        R13["Nenhum release de produção pode depender de<br/>gate advisory/não-bloqueante — segurança, isolamento<br/>de tenant, migração, segurança, acessibilidade,<br/>contrato, restore ou teste clínico"]:::observed
    end

    PUSH --> WF
    WF --> J1
    WF --> J2
    J1 --> S1
    J2 --> S1
    BP -.->|"torna J1/J2 enforced,<br/>não apenas observável"| S1

    S1 -.-> S2 -.-> S3 -.-> S4 -.-> S5 -.-> S6 -.-> S7 -.-> S8 -.-> S9 -.-> S10 -.-> S11

    R13 -.->|"aplica-se a TODO passo,<br/>desde hoje e para sempre"| J1
    R13 -.-> S2
    R13 -.-> S7
    R13 -.-> S11

    linkStyle default stroke-width:1.5px
```

## 3. Contradição observada entre documentos-fonte, registrada e não resolvida aqui

`docs/14-devsecops-and-delivery/branch-protection-request.md` (2026-08-14) declara, em
seu próprio título e §1: **"Status: BLOCKED — requires repository admin action"** e
registra que nenhuma chamada `gh api` foi feita. `HANDOFF.yaml` (2026-08-15,
`repository_state.branch_protection`) registra: **"CONFIGURADA em main (DEC-G0-09,
2026-08-15): checks doc-conventions + forbidden-content obrigatórios, enforce_admins,
histórico linear, PR obrigatório."**

Por regra desta tarefa ("se dois documentos-fonte contradisserem, o decidido prevalece e
a contradição vai ao handoff — não a resolva silenciosamente"): `DEC-G0-09` é uma
decisão humana registrada, posterior, e mais específica — ela prevalece, e este diagrama
mostra a proteção de branch como **configurada**. A contradição textual entre os dois
arquivos-fonte **não foi editada por este autor** (fora do escopo de escrita desta
tarefa: `branch-protection-request.md` pertence a `docs/14-devsecops-and-delivery/`, mas
a instrução desta tarefa permite apenas criar um arquivo novo neste diretório, não
editar os existentes) — fica registrada aqui e no HANDOFF desta tarefa para que o
próximo agente/humano concilie os dois arquivos.

## 4. O que este diagrama afirma e o que não afirma

**Afirma:**

- Exatamente **um** dos onze passos do pipeline §15.2 tem qualquer automação real hoje,
  e mesmo esse passo (validação) só cobre a fatia de convenções documentais — não
  schema, contrato, migração, ou status de ADR em código.
- Cada um dos dez passos restantes está bloqueado por uma decisão nomeada e específica
  (ADR de stack, ADR-0019, Gate G3, Gate G0), nunca por "falta de tempo" genérica.
- A regra "nenhum gate advisory em release de produção" (§3 regra 13) se aplica a todo
  passo futuro igualmente — os dois gates que existem hoje já a cumprem (`BLOCKING`,
  sem `continue-on-error`).

**Não afirma:**

- Que qualquer passo além da validação documental tenha sequer um esboço de
  implementação.
- Que a ordem 1→2→...→11 desenhada seja a única sequência possível — é a ordem do
  próprio prompt §15.2, reproduzida, não inventada por este diagrama.
- Que a proteção de branch, mesmo configurada, substitua a necessidade de humanos
  nomeados para as aprovações de separação de funções do passo 9 — esses papéis
  continuam `UNASSIGNED`.

## 5. Proveniência

| Elemento | Fonte |
|---|---|
| O que existe hoje (workflow, dois jobs, ambos bloqueantes) | `docs/14-devsecops-and-delivery/ci-policy.md` §1 |
| Os 11 passos do pipeline e o que cada um requer | `docs/14-devsecops-and-delivery/ci-policy.md` §2; `INTENSICARE_V2_ORCHESTRATOR_PROMPT.md` §15.2 |
| Regra "nenhum gate advisory" (§3 regra 13) | `docs/14-devsecops-and-delivery/ci-policy.md` §3; `INTENSICARE_V2_ORCHESTRATOR_PROMPT.md` §3 regra 13 |
| Pedido de proteção de branch, status `BLOCKED` (2026-08-14) | `docs/14-devsecops-and-delivery/branch-protection-request.md` §1 |
| Proteção de branch configurada (`DEC-G0-09`, 2026-08-15) | `HANDOFF.yaml` `repository_state.branch_protection` |
| Todo papel `AUTH-*` `UNASSIGNED` (bloqueio do passo 9) | `docs/00-governance/registers/blockers-register.md` `BLK-0001`-`BLK-0008` (citado via `ci-policy.md` §2) |
| Gate G3 bloqueando o passo 7 | `docs/08-interoperability/amh-data/four-layer-dossier.md`; `BLK-0010` |

## 6. O que este diagrama deliberadamente não faz

- Não escolhe stack, banco de dados, plataforma de nuvem, ferramenta de SBOM, ou
  vendor de assinatura.
- Não chama a API do GitHub nem altera nenhuma configuração real de repositório.
- Não resolve a contradição de status entre `branch-protection-request.md` e
  `HANDOFF.yaml` — apenas a registra.
- Não nomeia nenhum papel `AUTH-*`.
