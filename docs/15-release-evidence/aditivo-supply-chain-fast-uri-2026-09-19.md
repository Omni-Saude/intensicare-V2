---
doc_id: ADITIVO-SUPPLY-CHAIN-FAST-URI-2026-09-19
title: >-
  Aditivo de evidência supply-chain — conjunto de advisories fast-uri de
  2026-09-19 (8 HIGH), distinto do reparo de base Alpine registrado do PR #5
status: OBSERVED
owner: >-
  orquestrador da stream ORQ-1 (encargo
  orchestrators/PROMPT_ORQ-1_VERIFY_CHAIN.md, unidade MIN-10) — registro
  pendente de revisão; nenhuma autoridade foi fechada por este aditivo
source: >-
  FORENSIC_REPORT_2026-09-19.md §4 (achados BLK-1, CRIT-5, MIN-10);
  saída de `pnpm check:supply-chain` na base d7a49dd de 2026-09-19
  (8 HIGH, exit 1) e após o reparo (0 falha, exit 0);
  `pnpm audit --prod --json` de 2026-09-19 (npm advisory database,
  IDs 1158520–1158530); pnpm-lock.yaml (resoluções fast-uri);
  docs/15-release-evidence/final-implementation-report.md (registro
  prévio do PR #5); docs/14-devsecops-and-delivery/politica-de-supply-chain.md
  (§ do reparo Alpine 3.23.4 → 1.31.3-alpine3.24-slim);
  HANDOFF.yaml:667; ADR-0022 §5.1 C1
date_collected: "2026-09-19"
collector: >-
  orquestrador da stream ORQ-1 (verify-chain) sob o plano de orquestração
  paralela de 2026-09-19; evidência reproduzível por qualquer pessoa com
  `pnpm check:supply-chain` no commit correspondente
last_updated: "2026-09-19"
---

# Aditivo supply-chain — advisories fast-uri (2026-09-19), conjunto DISTINTO do reparo Alpine do PR #5

## 1. Por que este aditivo existe (MIN-10)

O histórico documental de supply-chain deste repositório registrava um reparo
prévio com a marcação "10 CVE HIGH" — a base Alpine 3.23.4 da imagem,
reprovada no passo Trivy da primeira execução real do `supply-chain.yml` no
PR #5, corrigida por repin de base por digest (`1.29-alpine` →
`1.31.3-alpine3.24-slim`), sem tocar no limiar. Esse registro vive em
`docs/15-release-evidence/final-implementation-report.md` e em
`docs/14-devsecops-and-delivery/politica-de-supply-chain.md`.

Em 2026-09-19, o mesmo gate `check:supply-chain` voltou a reprovar — com um
conjunto de advisories **diferente em natureza, origem e remédio**. Nenhum
documento conectava os dois episódios; este aditivo é essa conexão, para que
o histórico de supply-chain não leia-se como "o mesmo problema que voltou".
Não voltou: é outro conjunto, em outra camada (dependência npm de runtime na
cadeia de validação de esquema da API, não base de imagem de container).

## 2. O conjunto observado em 2026-09-19 (CRIT-5)

`pnpm check:supply-chain` na base `d7a49dd` reprovou com **8 avisos HIGH,
todos fast-uri** — os IDs npm de advisory **1158520–1158530** (obs.:
oito IDs não contíguos dentro dessa faixa: 1158520, 1158521, 1158523,
1158524, 1158526, 1158527, 1158529, 1158530), famílias: confusão de host via
canonicalização IDN ignorada em referências scheme-relative; SSRF via
normalização IPv6 malformada; SSRF via percent-decoding repetido de hostname;
confusão de host via normalização de esquema percent-encoded.

Os 8 avisos eram 4 advisories × 2 versões instaladas: o lockfile carregava
`fast-uri@3.1.5` **e** `fast-uri@4.1.2` em simultâneo. A versão vulnerável no
caminho quente era a 3.1.5: `ajv@8.20.0 ← @fastify/ajv-compiler@4.0.6 ←
fastify@5.12.0` — ou seja, **toda validação de corpo de requisição da API**.
Causa-raiz: o pin de `ajv@8.20.0`, único dependente de `fast-uri@3.1.5`, e a
ausência de qualquer `pnpm.overrides` no repositório.

## 3. Remédio aplicado e correção em relação à prescrição

Remédio: `pnpm.overrides` no `package.json` raiz (mecanismo sancionado do
pnpm — nada de patch manual em `node_modules` nem edição manual de hunk do
lockfile), regeneração do lockfile pelo pnpm, e prova de saúde do ajv/fastify
contra a versão resolvida (suíte de testes da API + `test:fronteira`).

**Correção em relação à prescrição, com evidência:** a prescrição
(FORENSIC_REPORT CRIT-5 e o encargo ORQ-1) apontava `^4.1.2` como versão
corrigida. O dado vivo de advisory contradiz: os 4 advisories da linha 4.x
têm faixas vulneráveis `>=4.0.0 <4.1.3` (a 1158520: `>=4.0.1 <4.1.3`) e
**patched `>=4.1.3`** — com o override `^4.1.2`, o gate continuou reprovando
com 4 HIGH (o mesmo conjunto, agora só na linha 4.x). O override foi então
fixado em `^4.1.3`, primeira faixa que o próprio registro de advisory declara
corrigida; o lockfile resolve para `fast-uri@4.2.1`, versão única no grafo.
Com isso `check:supply-chain` sai com **0 falha, exit 0** (os 2 avisos
moderate pré-existentes são registrados sem bloquear, conforme
`scripts/politica-de-severidade.json`: `registra_sem_bloquear: moderate`).

Diff do lockfile conferido: contém apenas o bloco `overrides:` e as
resoluções/snapshots de `fast-uri` — nenhum churn estranho.

## 4. O que permanece aberto (não fechado por este aditivo)

- **Checagens de supply-chain seguem não obrigatórias no `main`**
  (`HANDOFF.yaml:667`; ADR-0022 §5.1 C1 ABERTA): `check:supply-chain` não
  compõe `pnpm verify` e nenhum agente pode torná-lo obrigatório nem fechar
  a C1 — é ato de autoridade.
- Os 2 avisos moderate reportados pelo audit seguem registrados sem
  bloqueio, sob limiar `PROPOSAL` (ADR-0022 C4 ABERTA — ninguém ratificou
  limiares; ver `scripts/politica-de-severidade.json`).
- Assinatura, proveniência e promoção real de artefato permanecem não
  executadas (ADR-0022 C2/C3 ABERTAS), como no registro do PR #5.
