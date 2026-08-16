---
doc_id: DEVSECOPS-POLITICA-DADOS-SINTETICOS
status: PROPOSAL
owner: UNASSIGNED — VALIDATION REQUIRED
source: >
  docs/00-governance/registers/decision-register.md GDEC-0014 (dados
  sintéticos como default vinculante de desenvolvimento) e GDEC-0017
  (regime de construção); docs/08-interoperability/amh-data/contract-v1/
  fixtures/README.md (convenção SYNTH- já em uso para fixtures do contrato
  AMH×IntensiCare); docs/11-security-privacy-compliance/threat-model.md
  THR-0079 (limite da convenção SYNTH- como nome, não separação técnica);
  scripts/check_forbidden_content.py (mecanismo de enforcement, estendido
  nesta mesma fatia — SPR-G7-1 — para cobrir apps/ e packages/); instrução
  de tarefa SPR-G7-1 (2026-08-16)
date_collected: 2026-08-16
collector: agente de fundações executáveis (SPR-G7-1, ciclo 6)
last_updated: 2026-08-16
---

# Política de dados sintéticos — MODO CONSTRUÇÃO

**Status: PROPOSAL.** Este documento não decide nada; ele **operacionaliza**,
para o código sob `apps/` e `packages/`, a regra já **DECIDED** em
GDEC-0014 e mantida vigente em GDEC-0017.

## 1. Regra vinculante

SOURCE (`docs/00-governance/registers/decision-register.md`, GDEC-0014):
*"Permanecem vinculantes APENAS: (1) os gates de CI existentes (conteúdo
proibido/PHI e convenções); (2) PR para main; (3) **dados sintéticos como
default de desenvolvimento**."* SOURCE (GDEC-0017): a mesma regra
permanece vinculante durante o regime de construção integral.

Na prática, para código (não apenas documentação): **todo dado usado em
desenvolvimento, teste, fixture ou exemplo neste repositório é sintético**.
Nenhum agente ou colaborador insere CPF real, PHI, ou identificador
`portable_subject_ref` (PSR) real neste repositório, em nenhuma
circunstância, mesmo "para teste".

## 2. Convenção de marcação `SYNTH-`

Reaproveita a convenção já em uso em
`docs/08-interoperability/amh-data/contract-v1/fixtures/README.md`:

- **PSR sintético**: `amh:psr:v1:SYNTH-<sufixo>` — forma deliberadamente
  distinta de um PSR real (`amh:psr:v1:<uuidv4>`), para nunca colidir com
  uma referência real. Gerado por
  `@intensicare/fixtures-sinteticas` → `generateSyntheticPsr(suffix)`.
- **Tenant sintético**: `SYNTH-TENANT-<sufixo>` — gerado por
  `generateSyntheticTenantId(suffix)` no mesmo pacote.
- Qualquer outro identificador sintético introduzido por pacotes futuros
  (paciente, encontro, item de trabalho) deve seguir o mesmo prefixo
  `SYNTH-` antes do sufixo específico do domínio.

### Limite conhecido da convenção (honestidade, não alarme)

INFERENCE (a partir de `docs/11-security-privacy-compliance/threat-model.md`
THR-0079): o marcador `SYNTH-` é **convenção de nome, não separação
técnica** — nada no formato do dado impede, por si só, que uma ref sem o
marcador entre num ambiente de desenvolvimento, ou que uma ref marcada
`SYNTH-` seja aceita por engano num validador de produção que não
verifique explicitamente o formato UUIDv4 esperado. Esta política não
resolve esse risco (THR-0079 já o registra); ela apenas fixa a convenção
de nome que qualquer separação técnica futura vai precisar respeitar.

## 3. Proibições (vinculantes)

Nenhum arquivo sob `apps/`, `packages/`, `docs/`, `scripts/` ou `.github/`
pode conter:

1. **CPF formatado real** (`ddd.ddd.ddd-dd`) — `scripts/check_forbidden_content.py`
   sinaliza qualquer padrão nesse formato para revisão humana; a única
   exceção conhecida no repositório é uma fixture deliberadamente
   inválida com todos os dígitos iguais (documentada em
   `docs/08-interoperability/amh-data/contract-v1/fixtures/README.md`),
   que não dispara o gate por não ter formatação.
2. **PSR real** (`amh:psr:v1:<uuidv4>`, sem o marcador `SYNTH-`) —
   `scripts/check_forbidden_content.py` reprova esse padrão
   (`REAL_PSR_PATTERN`).
3. **Credenciais** (tokens GitHub, chaves AWS, cabeçalhos de chave privada
   PEM) — mesmo gate, `CREDENTIAL_PATTERNS`.
4. **Endereços de e-mail reais** fora do allowlist (hoje vazio por
   desenho) — mesmo gate, `EMAIL_PATTERN`.

## 4. Enforcement (o que já existe, e só isso)

**OBSERVED** (`scripts/check_forbidden_content.py`, nesta mesma fatia —
SPR-G7-1): o gate foi estendido para varrer também `apps/` e `packages/`
(antes cobria apenas `docs/`, `scripts/`, `.github/` e `README.md`),
excluindo `node_modules/` e `dist/` da varredura. É o **único** mecanismo
automatizado que hoje impõe esta política sobre código — não há revisão
humana adicional implícita por este documento, e nada aqui cria um novo
gate, bloqueador, risco ou hazard além do que já é `check_forbidden_content.py`
(GDEC-0014 item 1).

## 5. Como gerar fixtures sintéticas hoje

`packages/fixtures-sinteticas` (esqueleto de fundação, SPR-G7-1) é o lugar
canônico para funções geradoras de dado sintético:

```ts
import { generateSyntheticPsr, generateSyntheticTenantId } from "@intensicare/fixtures-sinteticas";

generateSyntheticPsr("01");      // "amh:psr:v1:SYNTH-01"
generateSyntheticTenantId("A");  // "SYNTH-TENANT-A"
```

`packages/persistencia` (mesma fatia) só expõe, por ora, um banco PGlite
em memória (`createInMemoryDatabase()`) sem nenhum dado pré-carregado —
nenhuma migração ou seed existe ainda; quando existirem, devem popular
exclusivamente dados gerados por `@intensicare/fixtures-sinteticas`.

## 6. O que este documento não faz

Não é uma política de PHI/privacidade completa — para o modelo de ameaça e
o inventário de riscos relacionados a PSR, ver
`docs/11-security-privacy-compliance/threat-model.md`. Não substitui
parecer jurídico. Não fecha nenhum gate G0–G8. Não cria nova obrigação
além da já **DECIDED** em GDEC-0014/GDEC-0017.
