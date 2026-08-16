/**
 * Configuração do vitest de `apps/api`.
 *
 * Os testes desta suíte sobem um PGlite REAL (Postgres compilado para WASM),
 * aplicam as migrações e semeiam as fixtures sintéticas antes do primeiro
 * caso. Esse arranque custa segundos — mais ainda em runner compartilhado ou
 * em CI com CPU concorrida — e estourava os limites padrão do vitest
 * (5 s de teste, 10 s de hook), produzindo falha por TEMPO e não por
 * comportamento. Falha intermitente em suíte de segurança clínica é pior que
 * suíte lenta: ensina a equipe a ignorar vermelho.
 *
 * Os limites abaixo são generosos de propósito. Eles NÃO mascaram lentidão
 * real do produto: nenhum caminho de produção passa por boot de banco a cada
 * requisição — o custo é de bancada de teste.
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
