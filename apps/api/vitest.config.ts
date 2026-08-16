/**
 * Configuração do vitest de apps/api.
 *
 * Esta suíte sobe um PGlite REAL (PostgreSQL em WASM), aplica as migrações e
 * semeia fixtures antes do primeiro caso. A política de limites de tempo que
 * isso exige vive em `vitest.shared.ts`, na raiz — definida uma vez para todo
 * o workspace, com a justificativa completa.
 */
import { defineConfig } from "vitest/config";
import { sharedTestConfig } from "../../vitest.shared.js";

export default defineConfig({
  test: {
    ...sharedTestConfig,
    include: ["src/**/*.test.ts"],
  },
});
