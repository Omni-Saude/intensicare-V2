/**
 * Configuração do vitest do kernel clínico.
 *
 * Explicitada para que ferramentas externas (p.ex. o runner vitest do Stryker,
 * usado na análise de mutação — §14 do orquestrador) encontrem o mesmo conjunto
 * de testes que `pnpm --filter @intensicare/kernel-clinico test` executa.
 */
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts", "test/**/*.test.ts"],
    environment: "node",
  },
});
