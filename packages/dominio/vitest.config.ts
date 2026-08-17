/**
 * Configuração do vitest de `@intensicare/dominio`.
 * Estende a política compartilhada do workspace (ver `vitest.shared.ts` na
 * raiz: limites de tempo dimensionados para suítes que sobem PGlite real).
 */
import { defineConfig } from "vitest/config";
import { sharedTestConfig } from "../../vitest.shared.js";

export default defineConfig({
  test: {
    ...sharedTestConfig,
    include: ["src/**/*.test.ts", "test/**/*.test.ts"],
  },
});
