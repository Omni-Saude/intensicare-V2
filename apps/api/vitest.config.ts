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
    // `PERFIL` passou a ser OBRIGATÓRIO e sem default (ACH-03): o modo
    // inseguro — PGlite em memória, fixtures sintéticas, adaptador de
    // identidade sintético — deixou de ser o que se obtém por omissão. O
    // runner declara aqui, explicitamente, que esta suíte roda no perfil
    // `test`; nenhum outro ponto de entrada ganha fallback, e um processo
    // real sem `PERFIL` continua falhando na inicialização, que é o
    // comportamento desejado.
    env: { PERFIL: "test" },
  },
});
