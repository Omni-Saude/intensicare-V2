#!/usr/bin/env node
/**
 * check_module_boundaries.mjs — materializa a fronteira de módulo de
 * ADR-0002 (monólito modular com fronteiras impostas, aceita, GDEC-0016,
 * Opção A) como verificação automatizada e BLOQUEANTE (§15.1 item B).
 *
 * Contexto (por que este script existe)
 * --------------------------------------
 * ADR-0002 §5.1 condição C5 exige, para ratificação formal: "um mecanismo
 * de imposição de fronteira é especificado e é bloqueante de build, não
 * consultivo" — mais uma verificação automatizada que falha em uma
 * violação de fronteira de módulo. Até este script, essa fronteira só
 * existia em prosa (a ADR e `docs/06-architecture/premissas-de-construcao.md`
 * PRE-11/PRE-02). Este script lê os `package.json` reais do workspace pnpm
 * e falha (`exit 1`) se qualquer pacote/app declarar uma dependência de
 * workspace fora da direção permitida abaixo.
 *
 * Direção de dependência permitida (PRE-02, PRE-11; ADR-0002 Opção A)
 * ---------------------------------------------------------------------
 *   kernel-clinico       -> NENHUMA dependência de workspace (kernel puro)
 *   contratos             -> NENHUMA dependência de workspace (folha)
 *   dominio                -> kernel-clinico
 *   persistencia           -> dominio, kernel-clinico
 *   fixtures-sinteticas    -> dominio, persistencia, kernel-clinico
 *   apps/api                -> todos os pacotes acima
 *   apps/web                -> SOMENTE contratos
 *
 * Por que um parser hand-rolled de `pnpm-workspace.yaml`, não uma lib YAML
 * -------------------------------------------------------------------------
 * Mesma razão documentada em `scripts/check_doc_conventions.py`: manter a
 * verificação de fronteira executável sem depender de uma dependência de
 * parsing YAML nova só para ler duas linhas `packages: - "packages/*"`.
 * Este parser não tenta ser um parser YAML geral — só resolve globs no
 * formato `<diretório>/*` (o único usado neste repositório), listando os
 * subdiretórios imediatos que contêm um `package.json`.
 *
 * Se um pacote/app novo aparecer no workspace sem entrada correspondente
 * na tabela `ALLOWED_WORKSPACE_DEPENDENCIES` abaixo, o script FALHA
 * (fail-closed) em vez de presumir que a ausência de regra significa
 * "permitido" — a fronteira de um módulo novo precisa ser uma decisão
 * explícita, não um esquecimento silencioso.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Direção de dependência permitida, chaveada pelo nome curto do pacote
 * (basename do diretório sob `packages/` ou `apps/`). Cada valor é o
 * conjunto de nomes curtos que o pacote PODE declarar como dependência de
 * workspace. Um conjunto vazio significa "nenhuma dependência de
 * workspace permitida".
 */
const ALLOWED_WORKSPACE_DEPENDENCIES = {
  "kernel-clinico": new Set(),
  contratos: new Set(),
  dominio: new Set(["kernel-clinico"]),
  persistencia: new Set(["dominio", "kernel-clinico"]),
  "fixtures-sinteticas": new Set(["dominio", "persistencia", "kernel-clinico"]),
  api: new Set(["kernel-clinico", "contratos", "dominio", "persistencia", "fixtures-sinteticas"]),
  web: new Set(["contratos"]),
};

/** Campos de `package.json` onde uma dependência de workspace pode aparecer. */
const DEPENDENCY_FIELDS = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies",
];

function readPnpmWorkspaceGlobs() {
  const raw = readFileSync(join(REPO_ROOT, "pnpm-workspace.yaml"), "utf8");
  const globs = [];
  for (const line of raw.split("\n")) {
    // Casa linhas de item de lista YAML: `  - "packages/*"` ou `  - packages/*`
    const match = line.match(/^\s*-\s*["']?([^"'\s]+)["']?\s*$/);
    if (match) globs.push(match[1]);
  }
  if (globs.length === 0) {
    throw new Error(
      `pnpm-workspace.yaml não produziu nenhum glob reconhecível (formato inesperado). ` +
        `Este parser só entende itens de lista simples como '- "packages/*"'.`,
    );
  }
  return globs;
}

function resolveWorkspacePackageDirs(globs) {
  const dirs = [];
  for (const glob of globs) {
    if (!glob.endsWith("/*")) {
      throw new Error(
        `Glob de workspace não suportado por este parser: "${glob}". ` +
          `Só o formato "<diretório>/*" é entendido — amplie o parser se um novo formato for adotado.`,
      );
    }
    const parentDir = join(REPO_ROOT, glob.slice(0, -2));
    let entries;
    try {
      entries = readdirSync(parentDir, { withFileTypes: true });
    } catch {
      continue; // diretório-pai não existe ainda — nada a listar
    }
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const candidateDir = join(parentDir, entry.name);
      const pkgJsonPath = join(candidateDir, "package.json");
      try {
        statSync(pkgJsonPath);
      } catch {
        continue; // subdiretório sem package.json — não é um pacote do workspace
      }
      dirs.push(candidateDir);
    }
  }
  return dirs;
}

function loadWorkspacePackages() {
  const globs = readPnpmWorkspaceGlobs();
  const dirs = resolveWorkspacePackageDirs(globs);
  const packages = [];
  for (const dir of dirs) {
    const pkgJsonPath = join(dir, "package.json");
    const pkgJson = JSON.parse(readFileSync(pkgJsonPath, "utf8"));
    const shortId = dir.split("/").pop();
    packages.push({
      shortId,
      dir,
      name: pkgJson.name,
      pkgJson,
      relPath: `${pkgJsonPath.replace(`${REPO_ROOT}/`, "")}`,
    });
  }
  return packages;
}

function collectWorkspaceDependencies(pkg, nameToShortId) {
  const found = [];
  for (const field of DEPENDENCY_FIELDS) {
    const deps = pkg.pkgJson[field];
    if (!deps || typeof deps !== "object") continue;
    for (const [depName, depRange] of Object.entries(deps)) {
      const isWorkspaceProtocol = typeof depRange === "string" && depRange.startsWith("workspace:");
      const isKnownInternalName = nameToShortId.has(depName);
      if (isWorkspaceProtocol || isKnownInternalName) {
        if (!nameToShortId.has(depName)) {
          // Depende de "workspace:" mas o nome não corresponde a nenhum
          // pacote do workspace conhecido — configuração quebrada, não
          // uma violação de fronteira; reportar separadamente.
          found.push({ depName, shortId: null, field });
          continue;
        }
        found.push({ depName, shortId: nameToShortId.get(depName), field });
      }
    }
  }
  return found;
}

function main() {
  const packages = loadWorkspacePackages();
  const nameToShortId = new Map(packages.map((p) => [p.name, p.shortId]));

  const violations = [];
  const missingRules = [];

  for (const pkg of packages) {
    const allowed = ALLOWED_WORKSPACE_DEPENDENCIES[pkg.shortId];
    if (allowed === undefined) {
      missingRules.push(pkg);
      continue;
    }
    const workspaceDeps = collectWorkspaceDependencies(pkg, nameToShortId);
    for (const dep of workspaceDeps) {
      if (dep.shortId === null) {
        violations.push(
          `${pkg.relPath}: dependência "${dep.depName}" (campo "${dep.field}") usa o protocolo ` +
            `"workspace:" mas não corresponde a nenhum pacote do workspace conhecido — ` +
            `configuração de dependência quebrada, corrija o nome ou remova a entrada.`,
        );
        continue;
      }
      if (!allowed.has(dep.shortId)) {
        const allowedList = allowed.size > 0 ? [...allowed].sort().join(", ") : "(nenhuma)";
        violations.push(
          `${pkg.relPath}: "${pkg.shortId}" depende de "${dep.shortId}" (via "${dep.depName}" ` +
            `no campo "${dep.field}"), o que viola a fronteira de módulo de ADR-0002. ` +
            `Dependências de workspace permitidas para "${pkg.shortId}": ${allowedList}.`,
        );
      }
    }
  }

  if (missingRules.length > 0) {
    for (const pkg of missingRules) {
      violations.push(
        `${pkg.relPath}: pacote "${pkg.shortId}" não tem entrada em ` +
          `ALLOWED_WORKSPACE_DEPENDENCIES (scripts/check_module_boundaries.mjs). ` +
          `Um pacote/app novo no workspace precisa de uma decisão explícita de fronteira antes ` +
          `de poder depender de (ou ser dependido por) qualquer outro módulo — adicione a regra ` +
          `ao script, não presuma "permitido" por omissão.`,
      );
    }
  }

  if (violations.length > 0) {
    console.error(
      `check_module_boundaries: ${violations.length} violação(ões) de fronteira de módulo ` +
        `encontrada(s) (ADR-0002, PRE-02/PRE-11):\n`,
    );
    for (const v of violations) {
      console.error(`  - ${v}`);
    }
    console.error(
      "\nA fronteira de módulo do monólito é imposta, não aspiracional (ADR-0002 §5.1 C5). " +
        "Corrija a dependência declarada em package.json, ou — se a direção realmente deveria " +
        "mudar — isso é uma decisão de arquitetura, não um ajuste mecânico deste script.",
    );
    process.exit(1);
  }

  console.log(
    `check_module_boundaries: OK — ${packages.length} pacote(s)/app(s) do workspace verificados, ` +
      `nenhuma violação de fronteira (ADR-0002, PRE-02/PRE-11).`,
  );
  for (const pkg of packages) {
    const allowed = ALLOWED_WORKSPACE_DEPENDENCIES[pkg.shortId];
    const allowedList = allowed.size > 0 ? [...allowed].sort().join(", ") : "(nenhuma)";
    console.log(`  - ${pkg.shortId} (${pkg.name}): permitido depender de: ${allowedList}`);
  }
}

main();
