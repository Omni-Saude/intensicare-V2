/**
 * Configuração do vitest de `@intensicare/persistencia`.
 *
 * Cada suíte sobe um PGlite REAL (Postgres compilado para WASM) e aplica as
 * migrações do zero para provar RLS, outbox transacional e auditoria
 * append-only contra um motor de verdade — não contra um dublê. Esse arranque
 * custa segundos e estourava os limites padrão do vitest (5 s de teste, 10 s
 * de hook) sempre que a CPU estava concorrida, produzindo falha por TEMPO e
 * não por comportamento.
 *
 * Ver a nota equivalente em `apps/api/vitest.config.ts`.
 */
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
