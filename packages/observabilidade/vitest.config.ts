/**
 * Configuração do vitest de @intensicare/observabilidade.
 *
 * `include` é explícito para que apenas os testes-fonte rodem: `tsconfig.json`
 * compila `src/**` inteiro (inclusive os `*.test.ts`, de propósito — é assim
 * que as asserções `@ts-expect-error` de redação são verificadas pelo
 * `typecheck`), e sem este `include` o vitest também encontraria as cópias
 * compiladas em `dist/`, executando cada teste duas vezes.
 */
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
