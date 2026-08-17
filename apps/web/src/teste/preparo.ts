/**
 * apps/web/src/teste/preparo.ts — preparo global da suíte de componentes.
 *
 * `@testing-library/react` só registra a limpeza automática quando existe um
 * `afterEach` GLOBAL; esta suíte roda com `globals: false` (importação
 * explícita), então a limpeza é registrada aqui, uma vez. Sem isto, um
 * componente montado num teste continuaria no DOM do teste seguinte e um
 * assert de "a tela mostra erro" poderia passar lendo a árvore do vizinho —
 * falso-verde, exatamente o que esta fatia não pode ter (THR-0055).
 */
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
});
