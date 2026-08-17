# apps/api/Dockerfile — artefato de execução do backend Fastify.
#
# Rastreio: ACH-08 (§6.8); ADR-0022 §5.2 S1 (lockfile congelado), S2
# (toolchain pinado), S3 (artefato final mínimo, não-root), S7 (digest,
# nunca tag mutável); ADR-0019 §5.2 P3 (um único artefato por commit,
# promovido por digest); THR-0050, THR-0053, THR-0054.
#
# ESTADO FACTUAL (contrato §2, inalterável): este artefato serve a fatia
# SINTÉTICA e consultiva. Construí-lo NÃO é release de produção, NÃO alega
# conformidade e NÃO altera o estado de 0 vias clínicas acionáveis. Por
# ADR-0022 §8.3, nenhum artefato desta V2 é promovido além de dev/CI
# efêmero enquanto S8 (SBOM/proveniência/assinatura) não fechar.
#
# CONTEXTO DE BUILD: a RAIZ do repositório, não `apps/api`. O artefato
# depende de cinco pacotes do workspace, e um contexto restrito a
# `apps/api` não os enxergaria. Construa com:
#
#   docker build -f apps/api/Dockerfile -t intensicare/api:<rev> .
#
# BASE PINADA POR DIGEST, NUNCA POR TAG. `node:22-alpine` é uma tag
# MUTÁVEL: o mesmo texto resolve para imagens diferentes ao longo do tempo,
# o que torna dois builds do mesmo commit não comparáveis — exatamente
# THR-0054. O digest abaixo foi OBSERVADO em 2026-08-17 resolvendo
# `docker pull node:22-alpine` (Node v22.23.2, dentro de
# `engines: >=22.0.0 <23.0.0` da raiz) e deve ser re-verificado
# periodicamente, como já se faz com os pins de action em
# `.github/workflows/ci-plataforma.yml`.
#
# PREMISSA REVERSÍVEL (ADR-0022 D2 / §5.1 C4, ABERTA): "mínimo" está
# materializado aqui como Alpine + Node de runtime, sem gerenciador de
# pacote e sem dependência de desenvolvimento. O limiar formal do que conta
# como mínimo é de AUTH-OPERATIONS e NÃO foi ratificado — ver
# `docs/14-devsecops-and-delivery/politica-de-supply-chain.md` §3.

# =============================================================================
# Estágio 1 — construção (descartado; nada daqui alcança o artefato final
# exceto o que for copiado explicitamente no estágio 2)
# =============================================================================
FROM node:22-alpine@sha256:c610fcdfb1d5b4740dd70c284ed3cb16bb857e0f7166196e36a5501df7a3aa32 AS construcao

ENV CI=true \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0

WORKDIR /construcao

# pnpm 9 via corepack, na mesma versão declarada em `packageManager` da raiz
# (ADR-0022 S2 — toolchain pinado; divergência falha, não degrada).
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# Manifestos e lockfile primeiro: sem esta separação, qualquer alteração de
# código-fonte invalidaria a camada de instalação de dependências.
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json tsconfig.base.json ./
COPY packages ./packages
COPY apps ./apps

# `--frozen-lockfile`: divergência entre manifesto e `pnpm-lock.yaml` FALHA o
# build em vez de resolver silenciosamente (ADR-0022 S1; THR-0050 —
# dependência maliciosa/typosquat entrando no grafo de build).
# `--filter "@intensicare/api..."`: instala o app e apenas suas dependências
# de workspace (contratos, dominio, fixtures-sinteticas, kernel-clinico,
# persistencia) — as ferramentas de front-end de `apps/web` nunca são
# baixadas neste estágio.
RUN pnpm install --frozen-lockfile --filter "@intensicare/api..."

# Compilação em ordem topológica (dependências antes do app).
RUN pnpm --filter "@intensicare/api..." run build

# `pnpm deploy --prod` produz uma árvore autossuficiente contendo APENAS
# dependências de runtime — é o mecanismo que garante S3 ("nenhuma
# ferramenta de build/dev") de forma verificável, em vez de por convenção.
RUN pnpm --filter @intensicare/api --prod deploy /artefato

# PODA EXPLÍCITA. `pnpm deploy` copia o pacote conforme seu campo `files`,
# e para `apps/api` isso inclui `src/`, `tsconfig.json` e `vitest.config.ts`.
# Nada disso é executável em produção:
#   - `src/`      → fonte TypeScript; presença no artefato é achado de
#                   superfície (o gate `verificar-artefato.mjs imagem` falha
#                   se sobreviver);
#   - `*.map`     → sourcemaps referenciam caminhos internos (`../src/*.ts`);
#                   OBSERVADO que NÃO carregam `sourcesContent`, logo não
#                   vazam código, mas revelam estrutura e não são lidos em
#                   runtime;
#   - `*.d.ts`    → declarações de tipo só servem a quem compila.
RUN set -eux; \
    rm -rf /artefato/src /artefato/tsconfig.json /artefato/vitest.config.ts /artefato/README.md; \
    find /artefato/dist -name '*.map' -delete; \
    find /artefato/dist -name '*.d.ts' -delete; \
    test -f /artefato/dist/index.js

# =============================================================================
# Estágio 2 — execução
# =============================================================================
FROM node:22-alpine@sha256:c610fcdfb1d5b4740dd70c284ed3cb16bb857e0f7166196e36a5501df7a3aa32 AS execucao

# Metadados OCI. Recebidos como ARG, nunca fabricados dentro do Dockerfile:
# um `created` gerado com `date` aqui dentro tornaria toda camada distinta a
# cada build e destruiria a comparabilidade que ADR-0022 D1 exige.
ARG REVISAO_GIT=desconhecida
ARG CRIADO_EM=desconhecido

LABEL org.opencontainers.image.title="intensicare-api" \
      org.opencontainers.image.description="API IntensiCare V2 — fatia sintética e consultiva; NÃO é release de produção" \
      org.opencontainers.image.revision="${REVISAO_GIT}" \
      org.opencontainers.image.created="${CRIADO_EM}" \
      org.opencontainers.image.licenses="MIT" \
      br.omni.intensicare.dados="100% sintéticos (prefixo SYNTH-)" \
      br.omni.intensicare.safety-case="M0" \
      br.omni.intensicare.vias-acionaveis="0"

ENV NODE_ENV=production \
    PORT=3000

# REMOÇÃO DO GERENCIADOR DE PACOTE. A imagem `node:*` embarca npm/npx e
# corepack. Num artefato de execução isso é superfície de ataque pura: um
# atacante com execução de código passa a dispor de um instalador capaz de
# buscar código arbitrário na rede (THR-0050). Nada em runtime os usa —
# o processo é `node dist/index.js` sobre `node_modules` já resolvido.
RUN set -eux; \
    rm -rf /usr/local/lib/node_modules/npm \
           /usr/local/lib/node_modules/corepack \
           /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack \
           /opt/yarn-v*; \
    ! command -v npm; \
    ! command -v corepack

WORKDIR /app

# UID/GID 1000 é o usuário `node` já presente na base (OBSERVADO:
# `id node` → uid=1000(node) gid=1000(node)). Declarado em forma NUMÉRICA
# de propósito: um runtime que aplique `runAsNonRoot` compara UID, e um
# `USER node` textual não é verificável sem resolver /etc/passwd.
COPY --from=construcao --chown=1000:1000 /artefato/package.json ./package.json
COPY --from=construcao --chown=1000:1000 /artefato/node_modules ./node_modules
COPY --from=construcao --chown=1000:1000 /artefato/dist ./dist

# Troca de identidade ANTES de qualquer instrução de execução. Tudo abaixo
# desta linha — inclusive um `docker exec` — roda sem privilégio.
USER 1000:1000

EXPOSE 3000

# Sem shell na cadeia de execução: forma exec, não shell. `node` recebe
# PID 1 diretamente, o que também preserva a semântica de sinal (SIGTERM
# chega ao processo, não a um `/bin/sh` que o ignoraria).
#
# O filesystem pode ser montado somente-leitura; o processo não escreve em
# disco. Execução endurecida recomendada (documentada em
# `politica-de-supply-chain.md` §4):
#   docker run --rm --read-only --cap-drop=ALL --security-opt=no-new-privileges \
#     --tmpfs /tmp:rw,noexec,nosuid,size=16m -p 3000:3000 <imagem-por-digest>
#
# NÃO há HEALTHCHECK aqui: o contrato dos endpoints de liveness/readiness/
# startup pertence a `apps/api/src/**` (fora do escopo de escrita desta
# tarefa) e o anti-padrão 10 do contrato proíbe reusar um mesmo endpoint
# para os três. Ver EM ABERTO no handoff.
CMD ["node", "dist/index.js"]
