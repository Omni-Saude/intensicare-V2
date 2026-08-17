/**
 * Configuração do vitest do pacote de release clínico.
 *
 * Explicitada (em vez de deixar o default) para que os testes vivam em
 * `test/` — separados do código publicado em `dist/` — e para que qualquer
 * ferramenta externa encontre exatamente o mesmo conjunto que
 * `pnpm --filter @intensicare/rule-bundle test` executa.
 */
import { defineConfig } from "vitest/config";
import { sharedTestConfig } from "../../vitest.shared.js";

export default defineConfig({
  test: {
    ...sharedTestConfig,
    include: ["test/**/*.test.ts"],
    environment: "node",
  },
});
