---
doc_id: ARCH-CONTAINERS-TOPOLOGIA-IMPLANTACAO
status: PROPOSAL
owner: UNASSIGNED — VALIDATION REQUIRED
source: >
  INTENSICARE_V2_ORCHESTRATOR_PROMPT.md §19 (diagrama exigido — topologia de implantação
  por ambiente); §9.4 (topologia de runtime candidata); §15.1-§15.2 (fundação de
  repositório, ambientes e entrega); §10 item 19 (ADR-0019, reservado, não iniciado);
  docs/14-devsecops-and-delivery/ci-policy.md; HANDOFF.yaml pinned_evidence
date_collected: 2026-08-15
collector: autor de diagramas de arquitetura e fluxo (ciclo 1, tarefa de diagramas)
last_updated: 2026-08-15
---

# IntensiCare V2 — Topologia de implantação por ambiente

**Status: PROPOSAL — e a afirmação mais importante deste diagrama é negativa:
NENHUM ambiente da V2 existe.** SOURCE (`docs/14-devsecops-and-delivery/ci-policy.md`
§1-§2, OBSERVED 2026-08-14): a única automação existente neste repositório é o workflow
`Docs Gates` (dois jobs de conformidade documental); **não há build, teste, artefato,
implantação, banco de dados, ou ambiente de qualquer tipo**. Todo elemento abaixo além
do workflow observado é rotulado **ALVO PROPOSTO**, nunca implantado. O lado AMH tem
**apenas `dev` provisionado** — `stg`/`prod`/`dr` não existem e não têm `tfstate`
(`HANDOFF.yaml` `pinned_evidence`; `ADR-0001` E7).

## 1. Legenda

Reaproveita as convenções de `system-context.md` §1, com um marcador adicional:

| Marcação | Significado |
|---|---|
| **OBSERVADO** (borda sólida) | Existe hoje, verificado nesta revisão. |
| **ALVO PROPOSTO** (borda tracejada) | Candidato de `INTENSICARE_V2_ORCHESTRATOR_PROMPT.md` §9.4/§15.2 — nada foi construído, nenhuma tecnologia escolhida. |
| **INEXISTENTE** (preenchimento escuro, tracejado fino) | Nem mesmo um alvo declarado por ADR — ausência simples, registrada para não ser confundida com "não aplicável". |

## 2. Diagrama

```mermaid
flowchart TB
    classDef observed fill:#0b3d2e,stroke:#25a07a,stroke-width:3px,color:#ffffff
    classDef proposed fill:#2b2b2b,stroke:#e07a5f,stroke-width:2px,stroke-dasharray:6 4,color:#ffffff
    classDef missing fill:#1a1a1a,stroke:#666666,stroke-width:1px,stroke-dasharray:2 6,color:#999999

    subgraph V2ENVS["IntensiCare V2 — ambientes (prompt §15.2)"]
        direction TB
        V2DEV["dev<br/>ALVO PROPOSTO — INEXISTENTE"]:::missing
        V2PREVIEW["preview<br/>ALVO PROPOSTO — INEXISTENTE"]:::missing
        V2INTEG["integration<br/>ALVO PROPOSTO — INEXISTENTE"]:::missing
        V2STAGING["staging<br/>ALVO PROPOSTO — INEXISTENTE"]:::missing
        V2SHADOW["shadow<br/>ALVO PROPOSTO — INEXISTENTE"]:::missing
        V2PILOT["pilot<br/>ALVO PROPOSTO — INEXISTENTE"]:::missing
        V2PROD["production<br/>ALVO PROPOSTO — INEXISTENTE"]:::missing
    end

    subgraph V2CANDIDATE["Componentes candidatos por ambiente (§9.4) — NENHUM CONSTRUÍDO"]
        direction TB
        EDGE["Edge/BFF com sessão<br/>OIDC/SMART-compatível<br/>ALVO PROPOSTO"]:::proposed
        API["API contract-first<br/>REST comando/consulta<br/>ALVO PROPOSTO"]:::proposed
        GATEWAY["Gateway de integração durável<br/>+ quarentena<br/>ALVO PROPOSTO"]:::proposed
        STORE["Armazenamento operacional<br/>classe PostgreSQL, RLS de tenant<br/>ALVO PROPOSTO — ADR-0019 não iniciado"]:::proposed
        OBJSTORE["Armazenamento de objetos<br/>envelopes imutáveis + evidência<br/>ALVO PROPOSTO"]:::proposed
        OUTBOX["Outbox transacional<br/>+ broker/stream durável<br/>ALVO PROPOSTO"]:::proposed
        KERNEL["Núcleo determinístico de segurança<br/>isolado de UI/infra<br/>ALVO PROPOSTO"]:::proposed
        PROJ["Projeções de leitura<br/>reconstruíveis<br/>ALVO PROPOSTO"]:::proposed
        RTGW["Gateway de tempo real autorizado<br/>cursores de retomada, fila limitada<br/>ALVO PROPOSTO"]:::proposed
        OTEL["Métricas/traces/logs OTel-compatíveis<br/>+ sondas de segurança sintéticas<br/>ALVO PROPOSTO"]:::proposed
    end

    subgraph AMHENVS["AMH data platform — ambientes (OBSERVADO, pinado 2026-08-14)"]
        direction TB
        AMHDEV["dev<br/>OBSERVADO — único provisionado"]:::observed
        AMHSTG["stg<br/>INEXISTENTE — sem tfstate"]:::missing
        AMHPROD["prod<br/>INEXISTENTE — sem tfstate"]:::missing
        AMHDR["dr<br/>INEXISTENTE — sem tfstate"]:::missing
    end

    subgraph CIOBS["CI observado hoje (OBSERVADO, 2026-08-14 — atualizado 2026-08-15 quanto a enforcement)"]
        direction TB
        WF["GitHub Actions — workflow único<br/>'Docs Gates', roda em push/PR<br/>OBSERVADO"]:::observed
        J1["job doc-conventions<br/>check_doc_conventions.py<br/>OBSERVADO — BLOCKING"]:::observed
        J2["job forbidden-content<br/>check_forbidden_content.py<br/>OBSERVADO — BLOCKING"]:::observed
        BP["Proteção de branch em main<br/>OBSERVADO configurada 2026-08-15 (DEC-G0-09)<br/>ver §4 — contradiz status BLOCKED de<br/>branch-protection-request.md, mais antigo"]:::observed
    end

    WF --> J1
    WF --> J2
    J1 -.-> V2DEV
    J2 -.-> V2DEV
    BP -.->|"exige checks + histórico linear +<br/>enforce_admins, per DEC-G0-09"| V2DEV

    V2DEV -.->|"promoção — ALVO PROPOSTO,<br/>nenhum pipeline além de Docs Gates"| V2PREVIEW
    V2PREVIEW -.-> V2INTEG
    V2INTEG -.-> V2STAGING
    V2STAGING -.-> V2SHADOW
    V2SHADOW -.-> V2PILOT
    V2PILOT -.-> V2PROD

    AMHDEV -.->|"única base de evidência V2 pode consultar hoje<br/>(read-only, commit pinado)"| GATEWAY
    AMHSTG -.->|"NÃO EXISTE — Gate G3 Camada 2<br/>inatingível por qualquer parte (E7)"| GATEWAY

    linkStyle default stroke-width:1.5px
```

## 3. O que este diagrama afirma e o que não afirma

**Afirma (evidência citada em cada nó):**

- **Nenhum ambiente V2 existe** — os sete ambientes nomeados pelo prompt §15.2
  (dev/preview/integration/staging/shadow/pilot/production) são alvo, não realidade.
- **Nenhum dos dez componentes candidatos do §9.4** (edge/BFF, API, gateway de
  integração, armazenamento operacional, armazenamento de objetos, outbox/broker,
  núcleo determinístico, projeções, gateway de tempo real, OTel) foi construído.
- Do lado AMH, **apenas `dev` está provisionado**; `stg`/`prod`/`dr` não têm `tfstate`
  — reconfirmado pelas ordens de serviço de 2026-08-15 (nenhuma ordem cria ambiente).
  Isso torna a condição "ambiente production-like" do Gate G3 **inatingível por
  qualquer parte, com qualquer nível de acesso**, hoje.
- O único CI que existe é o workflow `Docs Gates` com dois jobs bloqueantes.
- **Atualização honesta sobre proteção de branch:** `branch-protection-request.md`
  (datado de 2026-08-14) registra status `BLOCKED` — nenhum agente tem permissão de
  admin. `HANDOFF.yaml`, datado de 2026-08-15, registra `DEC-G0-09`: "CONFIGURADA em
  main... checks doc-conventions + forbidden-content obrigatórios, enforce_admins,
  histórico linear, PR obrigatório." **Isto é uma contradição entre dois documentos-
  fonte** (um mais antigo dizendo bloqueado, um mais novo com decisão humana registrada
  dizendo configurado). Por regra desta tarefa, o decidido prevalece — este diagrama
  reflete a proteção como **configurada**, citando `DEC-G0-09` — mas a contradição em si
  é registrada aqui e no handoff desta tarefa, não resolvida silenciosamente por edição
  de `branch-protection-request.md` (fora do escopo de escrita deste autor).

**Não afirma:**

- Que qualquer plataforma de nuvem, banco de dados, ou vendor tenha sido escolhido —
  `ADR-0019` (plataforma de implantação, ambientes, residência de dados, fronteiras de
  rede) está `not-started`.
- Que a topologia candidata do §9.4 seja a topologia decidida — ela é explicitamente
  "candidata" no próprio texto do prompt, sujeita a ratificação por ADR.
- Que a promoção entre ambientes V2 (dev→preview→...→production) tenha qualquer
  pipeline real — as setas tracejadas marcam apenas a *ordem candidata* do §15.2, não
  um mecanismo existente.

## 4. Proveniência

| Elemento | Fonte |
|---|---|
| Nenhum build/teste/artefato/implantação existe hoje | `docs/14-devsecops-and-delivery/ci-policy.md` §1 |
| Sete ambientes candidatos e o pipeline de 11 passos | `docs/14-devsecops-and-delivery/ci-policy.md` §2; `INTENSICARE_V2_ORCHESTRATOR_PROMPT.md` §15.2 |
| Topologia de runtime candidata (dez componentes) | `INTENSICARE_V2_ORCHESTRATOR_PROMPT.md` §9.4 |
| `ADR-0019` reservado, não iniciado | `docs/06-architecture/adrs/adr-index.md` §3 |
| AMH — apenas `dev` provisionado, sem `stg`/`prod`/`dr`/`tfstate` | `HANDOFF.yaml` `pinned_evidence`; `docs/06-architecture/adrs/ADR-0001-amh-platform-boundary.md` E7, E19 |
| Workflow `Docs Gates`, dois jobs bloqueantes | `docs/14-devsecops-and-delivery/ci-policy.md` §1; `.github/workflows/docs-gates.yml` |
| Proteção de branch — pedido `BLOCKED` (2026-08-14) | `docs/14-devsecops-and-delivery/branch-protection-request.md` §1 |
| Proteção de branch — `DEC-G0-09` configurada (2026-08-15) | `HANDOFF.yaml` `repository_state.branch_protection` |
| Gate G3 "production-like" inatingível hoje | `ADR-0001` C7 |

## 5. O que este diagrama deliberadamente não faz

- Não escolhe nenhuma tecnologia, vendor, ou provedor de nuvem.
- Não decide os limites de residência de dados ou rede.
- Não resolve a contradição de status de proteção de branch entre os dois documentos —
  apenas a registra, seguindo a regra "o decidido prevalece; a contradição vai ao
  handoff" desta tarefa.
