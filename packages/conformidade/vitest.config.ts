/**
 * Configuração do vitest de `@intensicare/conformidade`.
 *
 * Explicitada pela mesma razão do kernel clínico: manter o conjunto de
 * testes descoberto por ferramentas externas idêntico ao que
 * `pnpm --filter @intensicare/conformidade test` executa.
 */
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
