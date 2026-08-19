/**
 * apps/web — tipos e utilitários de estado da interface do IntensiCare V2.
 *
 * PREMISSA (reversível, GDEC-0015/0017): React 18 + Vite, pt-BR clínico,
 * WCAG 2.2 AA como requisito de projeto, com os estados obrigatórios do
 * prompt §11 (seis famílias: carregamento, frescor, avaliação, ciclo de
 * vida do item de trabalho, conectividade, sessão) como alvo do modelo
 * de estado da UI (ver docs/06-architecture/premissas-de-construcao.md
 * PRE-06/PRE-07).
 *
 * Este arquivo é o esqueleto de fundação original (SPR-G7-1): um
 * SUBCONJUNTO ilustrativo de um único eixo (carregamento), preservado
 * como está para não quebrar `index.test.ts`. A cobertura mais completa
 * das seis famílias do §11 — e as telas reais (grade de leitos, detalhe
 * do paciente, reconhecer alerta) — vivem em `./domain/estados.ts`,
 * `./domain/linguagem.ts` e `./components/**` (SPR-G7-2). `App` (em
 * `./App.tsx`) deixou de ser um placeholder nesta fatia; nenhuma
 * capacidade inacabada é apresentada como operacional.
 */

import { casoImpossivel } from "./domain/estados.js";
import { textoCarregamento } from "./domain/linguagem.js";

export const packageVersion = "0.0.0" as const;

/** Subconjunto ilustrativo do eixo de carregamento do modelo de estado do §11. */
export type LoadingState = "loading" | "empty" | "error" | "success";

/**
 * Rótulo textual em pt-BR clínico para cada estado — nunca depende só de
 * cor como sinal (§11 "non-color-only cues").
 *
 * DELEGA, NÃO REPETE. As quatro frases estavam escritas de novo aqui, idênticas
 * às de `textoCarregamento` (`./domain/linguagem.ts`) — duas fontes do MESMO
 * texto visível, que é a mesma classe de defeito de LAC-L8 e o que ADR-0008 N3
 * proíbe. Duas cópias divergem na primeira revisão de redação, e a revisão pela
 * autoridade clínica (ADR-0029, condição C2 ABERTA) alteraria uma sem tocar na
 * outra. O que sobrevive aqui é só a TRADUÇÃO de identificador: este módulo é o
 * esqueleto de fundação (SPR-G7-1) e usa o vocabulário em inglês do §11, ao
 * passo que as telas usam os identificadores pt-BR de `./domain/estados.ts`.
 */
export function loadingStateLabel(state: LoadingState): string {
  switch (state) {
    case "loading":
      return textoCarregamento("carregando").texto;
    case "empty":
      return textoCarregamento("vazio").texto;
    case "error":
      return textoCarregamento("erro").texto;
    case "success":
      return textoCarregamento("pronto").texto;
    default:
      return casoImpossivel(state, "loadingStateLabel");
  }
}
