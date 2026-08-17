# apps/web/Dockerfile — artefato de execução do frontend React/Vite.
#
# Rastreio: ACH-08 (§6.8); ADR-0022 §5.2 S1/S2/S3/S7; ADR-0019 §5.2 P3;
# THR-0053, THR-0054.
#
# ESTADO FACTUAL (contrato §2, inalterável): fatia SINTÉTICA e consultiva.
# Construir este artefato não é release de produção e não altera o estado
# de 0 vias clínicas acionáveis / safety case M0.
#
# CONTEXTO DE BUILD: a RAIZ do repositório (o app depende do pacote de
# workspace `@intensicare/contratos`). Construa com:
#
#   docker build -f apps/web/Dockerfile -t intensicare/web:<rev> .
#
# POR QUE DUAS BASES DIFERENTES NESTE REPOSITÓRIO. O artefato de `apps/api`
# executa JavaScript e precisa de um runtime Node; este aqui NÃO executa
# JavaScript no servidor — `vite build` emite um bundle estático
# (OBSERVADO: `index.html` + um `.js` + um `.css`, sem sourcemap). Servir
# arquivo estático com um runtime Node completo acrescentaria um
# interpretador inteiro como superfície de ataque sem nenhuma função. O
# custo é rastrear DUAS cadeias de base em vez de uma (THR-0054); está
# registrado como tal em `politica-de-supply-chain.md` §3.
#
# PREMISSA REVERSÍVEL (ADR-0022 D2 / §5.1 C4, ABERTA): a escolha de nginx
# não-privilegiado como servidor estático, e o limiar do que conta como
# "mínimo", não são ratificados; AUTH-OPERATIONS decide.

# =============================================================================
# Estágio 1 — construção (descartado)
# =============================================================================
FROM node:22-alpine@sha256:c610fcdfb1d5b4740dd70c284ed3cb16bb857e0f7166196e36a5501df7a3aa32 AS construcao

ENV CI=true \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0

WORKDIR /construcao

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json tsconfig.base.json ./
COPY packages ./packages
COPY apps ./apps

# ADR-0022 S1 — lockfile congelado; divergência falha o build.
RUN pnpm install --frozen-lockfile --filter "@intensicare/web..."

# `apps/web` roda `tsc --noEmit && vite build`: o typecheck estrito é parte
# do build e uma falha de tipo impede a emissão do bundle.
RUN pnpm --filter "@intensicare/web..." run build

# Falha alto se o build não emitiu o que se espera. Sem esta asserção, um
# `vite build` que emitisse zero arquivo produziria uma imagem que sobe,
# responde 404 em tudo e parece saudável — um artefato falso-verde
# (THR-0055 na camada de artefato).
RUN set -eux; \
    test -f /construcao/apps/web/dist/index.html; \
    test -n "$(find /construcao/apps/web/dist -name '*.js' -print -quit)"; \
    find /construcao/apps/web/dist -name '*.map' -delete

# =============================================================================
# Estágio 2 — execução
# =============================================================================
# nginx "unprivileged": variante mantida para rodar como UID 101 sem
# capability alguma, escutando em porta alta (8080). A imagem `nginx`
# padrão inicia como root para abrir a porta 80 e só então rebaixa os
# workers — o processo mestre segue root, o que é justamente o que se quer
# evitar.
#
# ─────────────────────────────────────────────────────────────────────────
# REPIN 2026-08-17 — 10 CVE HIGH na base anterior, corrigidos na origem
# ─────────────────────────────────────────────────────────────────────────
# O pin anterior era `1.29-alpine` (`sha256:0c79d56a…`, Alpine 3.23.4). O job
# `artefato-web` do PR #5 reprovou no passo Trivy com **10 HIGH / 0 CRITICAL**,
# todas em pacotes do sistema base e nenhuma no nosso código:
#
#   c-ares      CVE-2026-33630   1.34.6-r0 → 1.34.8-r0  (use-after-free / double-free)
#   curl        CVE-2026-5773    8.17.0-r1 → 8.20.0-r0  (transferência por SMB incorreto)
#   curl        CVE-2026-6276                           (vazamento de cookie)
#   libcurl     CVE-2026-5773, CVE-2026-6276
#   libcrypto3  CVE-2026-45447   3.5.6-r0  → 3.5.7-r0   (heap UAF em PKCS7_verify)
#   libssl3     CVE-2026-45447
#   libexpat    CVE-2026-45186   2.7.5-r0  → 2.8.1-r0   (DoS por XML malformado)
#   libexpat    CVE-2026-56408             → 2.8.2-r0   (integer overflow em copyString)
#
# CORREÇÃO ESCOLHIDA: repin por digest de uma base mais nova que JÁ traz as
# correções — não `apk upgrade` no estágio de execução. As duas fariam o gate
# passar; só uma preserva a propriedade que justifica o gate existir.
#
# `apk upgrade --no-cache` resolveria os pacotes contra o índice do Alpine no
# INSTANTE do build. O mesmo Dockerfile, no mesmo commit, produziria conteúdos
# diferentes em dias diferentes — e a comparação entre dois builds deixaria de
# distinguir "alguém substituiu o artefato" de "o espelho do Alpine avançou".
# É exatamente a detectabilidade que ADR-0022 D1 exige e que THR-0054 nomeia
# ("toolchain não pinado produzindo builds não reproduzíveis, de modo que
# substituição não é detectável por comparação"). Um digest nomeia um conjunto
# de bytes e só ele; a atualização passa a ser um diff revisável neste arquivo,
# com data, em vez de um efeito colateral silencioso do relógio.
#
# Também se troca `-alpine` por `-alpine…-slim`. Servir um bundle estático não
# usa njs, geoip nem os demais módulos da variante completa. MEDIDO
# 2026-08-17: slim tem **21 pacotes e 6.118.227 bytes** contra **70 pacotes e
# 23.139.101 bytes** da completa — mesmo nginx 1.31.3, mesmo Alpine 3.24.1,
# mesmo `USER=101`, mesmo `/etc/nginx/conf.d`. Menos pacote instalado é menos
# CVE futura por construção, não só hoje.
#
# VERIFICADO 2026-08-17 com o mesmo Trivy pinado que roda no CI
# (`--severity HIGH,CRITICAL --ignore-unfixed`):
#   nginx-unprivileged 1.29-alpine       (Alpine 3.23.4) → 10 HIGH
#   nginx-unprivileged 1.31.3-alpine3.24 (Alpine 3.24.1) →  0
#   nginx-unprivileged 1.31.3-alpine3.24-slim            →  0   ← adotada
#
# Digest OBSERVADO 2026-08-17 via `docker image inspect … RepoDigests`
# (`nginxinc/nginx-unprivileged:1.31.3-alpine3.24-slim`, Alpine 3.24.1,
# nginx/1.31.3, `Config.User=101`, `id -u` → 101). Re-verificar
# periodicamente: um digest é imutável, e por isso mesmo envelhece — ele
# congela também as CVEs descobertas depois desta data.
FROM nginxinc/nginx-unprivileged@sha256:d61d7ef52430df468e74ed6ee6e914429b80e20ba988e3176278a73165f876cf AS execucao

ARG REVISAO_GIT=desconhecida
ARG CRIADO_EM=desconhecido

LABEL org.opencontainers.image.title="intensicare-web" \
      org.opencontainers.image.description="Frontend IntensiCare V2 — fatia sintética e consultiva; NÃO é release de produção" \
      org.opencontainers.image.revision="${REVISAO_GIT}" \
      org.opencontainers.image.created="${CRIADO_EM}" \
      org.opencontainers.image.licenses="MIT" \
      br.omni.intensicare.dados="100% sintéticos (prefixo SYNTH-)" \
      br.omni.intensicare.safety-case="M0" \
      br.omni.intensicare.vias-acionaveis="0"

# A base já define `USER 101`. Escrever configuração exige root
# temporariamente; a identidade é rebaixada de novo antes de qualquer
# instrução de execução, e nenhuma camada posterior roda privilegiada.
USER root

# Configuração mínima escrita via `printf` em vez de `COPY` de um arquivo
# solto: mantém o artefato inteiro auditável num único arquivo versionado,
# sem um `.conf` órfão cuja correspondência com esta imagem ninguém checa.
#
# PREMISSA REVERSÍVEL: `try_files ... /index.html` (history fallback de
# SPA). É o comportamento que uma aplicação React roteada no cliente exige;
# altera apenas o que hoje seria 404. O dono de `apps/web` confirma ou
# reverte — ver EM ABERTO no handoff.
RUN set -eux; \
    printf '%s\n' \
      'server {' \
      '    listen 8080;' \
      '    server_name _;' \
      '    root /usr/share/nginx/html;' \
      '    index index.html;' \
      '' \
      '    # Superfície reduzida: a versão do nginx num cabeçalho de resposta' \
      '    # é reconhecimento gratuito para quem procura alvo com CVE conhecido.' \
      '    server_tokens off;' \
      '' \
      '    add_header X-Content-Type-Options "nosniff" always;' \
      '    add_header X-Frame-Options "DENY" always;' \
      '    add_header Referrer-Policy "no-referrer" always;' \
      '' \
      '    # ATENÇÃO — os três cabeçalhos acima são REPETIDOS em cada location' \
      '    # que declare seu próprio add_header. Não é redundância: no nginx,' \
      '    # add_header só é herdado do nível anterior se o nível atual NÃO' \
      '    # declarar nenhum add_header próprio. Um único add_header de' \
      '    # Cache-Control dentro de um location descarta, em silêncio, TODOS' \
      '    # os cabeçalhos de segurança do server. OBSERVADO nesta imagem em' \
      '    # 2026-08-17: antes desta correção, GET / respondia 200 sem' \
      '    # nosniff/DENY/no-referrer, porque try_files reescreve para' \
      '    # /index.html e cai no location = /index.html.' \
      '' \
      '    # Bundle com hash no nome: imutável por construção.' \
      '    location /assets/ {' \
      '        # Um único Cache-Control. A diretiva `expires` emite o seu' \
      '        # PRÓPRIO Cache-Control: combinada com um add_header de mesmo' \
      '        # nome, a resposta sai com o cabeçalho DUPLICADO e cabe ao' \
      '        # cliente decidir qual vale. OBSERVADO nesta imagem antes da' \
      '        # correção: "max-age=31536000" e "public, immutable" nas duas' \
      '        # linhas. Aqui só add_header, com o max-age embutido.' \
      '        add_header Cache-Control "public, max-age=31536000, immutable" always;' \
      '        add_header X-Content-Type-Options "nosniff" always;' \
      '        add_header X-Frame-Options "DENY" always;' \
      '        add_header Referrer-Policy "no-referrer" always;' \
      '    }' \
      '' \
      '    # index.html NUNCA em cache: é o mapa para os assets versionados.' \
      '    # Em cache, um cliente seguiria pedindo o bundle antigo depois de' \
      '    # uma promoção — dado stale exibido como atual (anti-padrão 14).' \
      '    location = /index.html {' \
      '        add_header Cache-Control "no-store" always;' \
      '        add_header X-Content-Type-Options "nosniff" always;' \
      '        add_header X-Frame-Options "DENY" always;' \
      '        add_header Referrer-Policy "no-referrer" always;' \
      '    }' \
      '' \
      '    location / {' \
      '        try_files $uri $uri/ /index.html;' \
      '    }' \
      '}' \
      > /etc/nginx/conf.d/default.conf; \
    rm -rf /usr/share/nginx/html/*; \
    nginx -t -c /etc/nginx/nginx.conf

# Apenas o bundle emitido. Nenhum `node_modules`, nenhum `package.json`,
# nenhuma fonte TypeScript alcança este estágio — não por poda, mas porque
# nada além de `dist/` é copiado.
COPY --from=construcao --chown=101:101 /construcao/apps/web/dist/ /usr/share/nginx/html/

USER 101:101

EXPOSE 8080

# Execução endurecida recomendada (`politica-de-supply-chain.md` §4):
#   docker run --rm --read-only --cap-drop=ALL --security-opt=no-new-privileges \
#     --tmpfs /tmp:rw,noexec,nosuid,size=16m \
#     --tmpfs /var/cache/nginx:rw,noexec,nosuid,size=16m \
#     -p 8080:8080 <imagem-por-digest>
#
# `CMD` herdado da base (`nginx -g 'daemon off;'`), em forma exec.
