/**
 * provas-de-tipo.ts — provas de que "número cru não compila onde a
 * quantidade marcada é exigida" (ORQ-4; SYS-09; HAZ-028) são verificadas
 * por build.
 *
 * POR QUE ESTE ARQUIVO NÃO É UM `.test.ts`. O vitest transpila sem checar
 * tipos: uma asserção `@ts-expect-error` dentro de um arquivo de teste NÃO
 * seria verificada nem por `pnpm build` (`tsc -p tsconfig.json`, que
 * compila este arquivo para `dist/`) nem por `pnpm typecheck`
 * (`tsconfig.typecheck.json --noEmit`) — seria decoração. Aqui ela é
 * verificada pelos DOIS.
 *
 * COMO A PROVA FUNCIONA. `@ts-expect-error` exige que a linha seguinte
 * tenha erro de tipo. Se alguém enfraquecer a marca nominal
 * (`MarcaQuantidade`) — passando a aceitar `number` cru como quantidade
 * clínica —, o erro desaparece e o TypeScript passa a reprovar a DIRETIVA
 * como não utilizada ("Unused '@ts-expect-error' directive"). Ou seja:
 * perder a marca QUEBRA O BUILD. É o contrário do comentário que envelhece.
 *
 * Nada aqui é executado: a função existe para ser compilada, não chamada.
 */

import { doseMcgKgMinDeTaxaInfusao } from "./dose.js";
import type { Fio2Fracao, Fio2Percentual } from "./fio2.js";
import type { LactatoMmolL } from "./lactato.js";
import { pesoDeNumeroKg } from "./peso.js";

/**
 * Provas de tipo dos normalizadores de unidades. NUNCA chamada em tempo de
 * execução.
 *
 * @internal
 */
export function provasDeTipoDosNormalizadoresDeUnidades(): void {
  // (1) `number` cru NÃO é quantidade marcada: sem passar pela porta
  // validada do domínio, o número não existe como quantidade clínica —
  // é o que impede o "50 nu" de atravessar o sistema como `Fio2Fracao`.
  const numeroCru: number = 50;

  // @ts-expect-error — `number` cru não é `Fio2Fracao`: fração de FiO2 só
  // nasce de fio2FracaoDeNumero (o "50 nu" não vira fração por tipo).
  const fio2SemMarca: Fio2Fracao = numeroCru;
  void fio2SemMarca;

  // @ts-expect-error — `number` cru não é `LactatoMmolL`: mmol/L só nasce
  // da porta validada, nunca de atribuição direta.
  const lactatoSemMarca: LactatoMmolL = numeroCru;
  void lactatoSemMarca;

  // (2) O peso cru — exatamente o valor do defeito SYS-09 "70,5" → 705 —
  // NÃO alcança a fórmula de dose: `doseMcgKgMinDeTaxaInfusao` exige
  // `PesoValidado`, cuja marca é o comprovante de passagem pela validação
  // [0.5, 350] kg. O literal fica num objeto à parte para que o erro caia
  // na LINHA da chamada, adjacente à diretiva.
  const entradaComPesoCru = {
    taxaInfusaoMlH: 10,
    concentracaoFarmacoMgMl: 0.016,
    peso: 70,
  };
  // @ts-expect-error — `number` cru não é `PesoValidado`: o peso não
  // validado (defeito da vírgula, SYS-09) não compila na fórmula de dose.
  void doseMcgKgMinDeTaxaInfusao(entradaComPesoCru);

  // (3) Quantidade marcada não pode ser FORJADA por estrutura: a marca é
  // um símbolo único, não um campo copiável — objeto literal "na mão"
  // não é `Fio2Percentual`.
  const objetoSemMarca = { valor: 0.21 };
  // @ts-expect-error — objeto literal não é quantidade marcada: falta a
  // marca nominal de `MarcaQuantidade`.
  const quantidadeForjada: Fio2Percentual = objetoSemMarca;
  void quantidadeForjada;

  // O caminho LEGÍTIMO, e o único: número → porta validada → quantidade
  // marcada → fórmula de dose.
  const pesoLegitimo = pesoDeNumeroKg(70);
  if (pesoLegitimo.status === "convertido") {
    void doseMcgKgMinDeTaxaInfusao({
      taxaInfusaoMlH: 10,
      concentracaoFarmacoMgMl: 0.016,
      peso: pesoLegitimo.valor,
    });
  }
}
