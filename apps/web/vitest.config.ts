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
 *
 * CUSTO DE AMBIENTE — por que 20 arquivos declaram `@vitest-environment node`.
 *
 * `environment` aqui é o PADRÃO do pacote, não uma obrigação. O vitest constrói
 * um ambiente por ARQUIVO de teste (`isolate: true`, `pool: forks`), e construir
 * um jsdom não é barato. MEDIDO nesta bancada, com os 40 arquivos em jsdom:
 * `environment 85,04 s` de CPU para 21,36 s de relógio de parede em 8 núcleos —
 * ou seja, cerca de metade de todo o tempo de trabalhador da suíte era gasto
 * montando DOMs, e quatro vezes a capacidade da máquina ficava disputada durante
 * a corrida inteira.
 *
 * O DANO NÃO ERA LENTIDÃO, ERA VERMELHO INTERMITENTE. Com a máquina saturada por
 * ela mesma, um fork fica sem CPU por centenas de milissegundos. A
 * `@testing-library/dom` impõe um limite PRÓPRIO de 1000 ms a cada `findBy*` —
 * limite que não vem de `vitest.shared.ts` e que ninguém neste repositório
 * escolheu. O caso `selecionar um leito muda a URL…`
 * (`src/roteamento/navegacao.test.tsx`) mediu `findByRole` = 1002 ms numa
 * execução que PASSOU: raspou a parede por 2 ms. Daí o flake pré-existente na
 * `main` — a mesma consulta custa 169 ms com o arquivo sozinho.
 *
 * A CORREÇÃO FOI TIRAR CUSTO, NÃO AFROUXAR LIMITE. Nenhum limite foi mexido:
 * os 20 arquivos cujo grafo de módulos inteiro não referencia DOM algum passaram
 * a declarar `node`. Resultado medido: `environment` 85,04 s → 25,73 s (−70 %),
 * relógio de parede 21,36 s → 10,52 s (−51 %), e a consulta crítica 1002 ms →
 * 216 ms. Mesmos 40 arquivos, mesmos 549 casos, todos verdes.
 *
 * `isolate` continua LIGADO de propósito. Compartilhar ambiente entre arquivos
 * seria mais rápido ainda e traria de volta a classe de falso-verde que
 * `src/teste/preparo.ts` e `src/a11y/acessibilidade.test.tsx` já documentam: DOM
 * de um arquivo vazando para o vizinho. Velocidade não se compra com isolamento.
 *
 * Ao criar teste NOVO: se ele não toca DOM, declare `node` no topo. Se toca,
 * não declare nada — o padrão abaixo já é jsdom.
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
