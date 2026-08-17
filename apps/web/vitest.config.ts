/**
 * Configuração do vitest de `@intensicare/web`.
 *
 * Estende a política compartilhada do workspace (`vitest.shared.ts` na raiz)
 * e troca o ambiente para `jsdom`. POR QUÊ: até o ciclo 6 esta suíte rodava
 * em Node puro e só conseguia exercitar componentes via
 * `renderToStaticMarkup`, que NÃO executa `useEffect` — ou seja, o caminho
 * exato onde vivia o defeito do ACH-07 (rejeição de rede em efeito) era
 * estruturalmente inalcançável pelos testes. Com jsdom, montagem,
 * desmontagem, efeitos, foco e eventos de teclado passam a ser observáveis.
 *
 * `e2e/**` fica FORA do `include`: aquelas especificações são do Playwright
 * (navegador real) e falhariam se importadas pelo vitest.
 */
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import { sharedTestConfig } from "../../vitest.shared.js";

export default defineConfig({
  plugins: [react()],
  test: {
    ...sharedTestConfig,
    environment: "jsdom",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    exclude: ["node_modules/**", "dist/**", "e2e/**"],
    setupFiles: ["./src/teste/preparo.ts"],
    restoreMocks: true,
    // `css: true` é necessário para que `import "…css?raw"` devolva o
    // conteúdo do arquivo. Com o padrão (`false`), o Vite curto-circuita
    // qualquer importação de CSS para string VAZIA — e uma asserção do tipo
    // `expect(css).not.toMatch(...)` passaria trivialmente sobre "". Foi
    // exatamente esse falso verde que os testes de folha de estilo
    // detectaram ao falhar; a defesa permanente é a asserção de tamanho
    // não-nulo em `src/a11y/acessibilidade.test.tsx`.
    css: true,
  },
});
