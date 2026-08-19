/**
 * apps/web/src/estado/cadenciaDeRecarga.test.ts
 *
 * A CADÊNCIA DE RELEITURA ERA UM NÚMERO FIXO, E ISSO TINHA TRÊS CONSEQUÊNCIAS
 * que a onda anterior nomeou sem resolver:
 *
 *   1. SEM JITTER. Toda aba relia no mesmo instante da abertura da sua janela.
 *      Numa UTI com N abas a carga não só cresce linear — ela chega em rajada
 *      alinhada, que é o pior formato possível para o servidor.
 *   2. SEM BACKOFF. Um servidor caído recebia exatamente a mesma pressão de um
 *      servidor saudável, indefinidamente.
 *   3. E — o item que é de SEGURANÇA CLÍNICA, não de eficiência — qualquer
 *      espaçamento que viesse a existir precisa APARECER NA TELA. Uma tela que
 *      se atualiza a cada 4 minutos por backoff, sem dizer isso, é a mesma
 *      classe de HAZ-0025 que LAC-L1 fechou: um retrato antigo com aparência de
 *      corrente. Por isso a função devolve `classe` e `fator`, e não só um
 *      número de milissegundos: o valor que a tela precisa exibir é DERIVADO
 *      aqui, não recalculado lá.
 *
 * NENHUM NÚMERO DESTE ARQUIVO É LIMIAR CLÍNICO. Fração de jitter, fator de
 * espaçamento, teto e limiar de falhas são premissas reversíveis de ENGENHARIA,
 * no mesmo regime de `INTERVALO_RECARGA_PADRAO_MS` e
 * `CICLOS_PARA_DECLARAR_PERDA`. Não são SLO, não são alvo de frescor e
 * permanecem `VALIDATION REQUIRED` (VAL-0023).
 */
import { describe, expect, it } from "vitest";
import {
  calcularCadenciaDeRecarga,
  ESPACAMENTO_MAXIMO,
  FALHAS_ATE_ESPACAR,
  FRACAO_DE_JITTER,
} from "./cadenciaDeRecarga.js";

const BASE = 30_000;

describe("regime normal — jitter espalha as abas sem mudar a ordem de grandeza", () => {
  it("sem falhas, o fator é 1 e a classe é `regime`", () => {
    const cadencia = calcularCadenciaDeRecarga({
      intervaloBaseMs: BASE,
      falhasConsecutivas: 0,
      sorteio: 0.5,
    });
    expect(cadencia.fator).toBe(1);
    expect(cadencia.classe).toBe("regime");
    // Sorteio 0.5 é o centro do jitter simétrico: espera exatamente a base.
    expect(cadencia.esperaMs).toBe(BASE);
  });

  it("o jitter é SIMÉTRICO em torno da base — a FRAÇÃO é premissa reversível", () => {
    /*
      O NOME DESTE TESTE DIZIA "limitado à fração declarada" (ACH-O3-14) e as
      asserções derivavam o esperado da MESMA constante sob teste: com
      `FRACAO_DE_JITTER = 0.95` — um jitter absurdo, que espalharia a releitura
      entre 1,5 s e 58 s — o teste passava igual. O nome prometia um limite que a
      asserção não impunha.

      O valor da fração é premissa reversível de ENGENHARIA e permanece
      `VALIDATION REQUIRED` (VAL-0023): FIXÁ-LO aqui seria decidir por quem tem
      autoridade. O que se fixa é a PROPRIEDADE, que vale para qualquer fração:
      simetria em torno da base, e espalhamento não-degenerado.
    */
    const minimo = calcularCadenciaDeRecarga({
      intervaloBaseMs: BASE,
      falhasConsecutivas: 0,
      sorteio: 0,
    });
    const maximo = calcularCadenciaDeRecarga({
      intervaloBaseMs: BASE,
      falhasConsecutivas: 0,
      sorteio: 1,
    });

    // SIMETRIA: os dois extremos distam igualmente da base, qualquer que seja a
    // fração. Um jitter enviesado para cima faria a tela reler mais devagar que
    // o declarado, em média, sem que nada na tela dissesse isso.
    expect(minimo.esperaMs + maximo.esperaMs).toBe(2 * BASE);
    expect(minimo.esperaMs).toBeLessThan(BASE);
    expect(maximo.esperaMs).toBeGreaterThan(BASE);
    // A propriedade que importa para a carga: duas abas com sorteios diferentes
    // NÃO batem no servidor no mesmo instante.
    expect(minimo.esperaMs).not.toBe(maximo.esperaMs);
    // Coerência com a constante publicada — que é premissa, não alvo.
    expect(minimo.esperaMs).toBe(Math.round(BASE * (1 - FRACAO_DE_JITTER)));
    expect(maximo.esperaMs).toBe(Math.round(BASE * (1 + FRACAO_DE_JITTER)));
  });

  it("o jitter NUNCA muda a classe declarada — espalhar não é espaçar", () => {
    for (const sorteio of [0, 0.25, 0.5, 0.75, 1]) {
      expect(
        calcularCadenciaDeRecarga({ intervaloBaseMs: BASE, falhasConsecutivas: 0, sorteio }).classe,
      ).toBe("regime");
    }
  });

  it("sorteio fora de faixa é fixado no intervalo, não extrapolado", () => {
    // Um `sortear` injetado com defeito não pode produzir espera negativa nem
    // uma espera dez vezes maior sem que ninguém perceba.
    const abaixo = calcularCadenciaDeRecarga({
      intervaloBaseMs: BASE,
      falhasConsecutivas: 0,
      sorteio: -5,
    });
    const acima = calcularCadenciaDeRecarga({
      intervaloBaseMs: BASE,
      falhasConsecutivas: 0,
      sorteio: 9,
    });
    expect(abaixo.esperaMs).toBe(Math.round(BASE * (1 - FRACAO_DE_JITTER)));
    expect(acima.esperaMs).toBe(Math.round(BASE * (1 + FRACAO_DE_JITTER)));
  });
});

describe("backoff — e ele NUNCA é silencioso", () => {
  it("a PRIMEIRA falha ainda tenta na cadência de regime", () => {
    // Espaçar já na primeira falha transformaria um soluço de rede num atraso
    // de meio minuto na tela clínica.
    const cadencia = calcularCadenciaDeRecarga({
      intervaloBaseMs: BASE,
      falhasConsecutivas: 1,
      sorteio: 0.5,
    });
    expect(FALHAS_ATE_ESPACAR).toBeGreaterThan(1);
    expect(cadencia.fator).toBe(1);
    expect(cadencia.classe).toBe("regime");
  });

  it("falhas consecutivas dobram o espaçamento e MUDAM a classe declarada", () => {
    const duas = calcularCadenciaDeRecarga({
      intervaloBaseMs: BASE,
      falhasConsecutivas: 2,
      sorteio: 0.5,
    });
    const tres = calcularCadenciaDeRecarga({
      intervaloBaseMs: BASE,
      falhasConsecutivas: 3,
      sorteio: 0.5,
    });

    expect(duas.fator).toBe(2);
    expect(duas.esperaMs).toBe(BASE * 2);
    expect(
      duas.classe,
      "o espaçamento por falha não é declarado: a tela ficaria lenta sem dizer por quê (HAZ-0025)",
    ).toBe("espacada_por_falha");

    expect(tres.fator).toBe(4);
    expect(tres.esperaMs).toBe(BASE * 4);
  });

  it("o espaçamento PARA de crescer — o valor do teto é premissa reversível", () => {
    /*
      O NOME ANTERIOR era "o espaçamento tem TETO — não cresce indefinidamente"
      e a asserção era `expect(muitas.fator).toBe(ESPACAMENTO_MAXIMO)`: derivada
      da MESMA constante sob teste. Com `ESPACAMENTO_MAXIMO = 100000` — uma tela
      que passaria a reler uma vez por mês — o teste continuava verde
      (ACH-O3-14). O nome prometia um teto que a asserção não impunha.

      Fixar o NÚMERO aqui não é opção: ele é premissa reversível de engenharia e
      permanece `VALIDATION REQUIRED` (VAL-0023). O que se fixa é a propriedade
      que vale para qualquer valor: a partir de certo ponto o fator ESTABILIZA, e
      nunca ultrapassa o teto publicado.
    */
    const muitas = calcularCadenciaDeRecarga({
      intervaloBaseMs: BASE,
      falhasConsecutivas: 40,
      sorteio: 0.5,
    });
    const absurdamenteMuitas = calcularCadenciaDeRecarga({
      intervaloBaseMs: BASE,
      falhasConsecutivas: 4_000,
      sorteio: 0.5,
    });

    // ESTABILIZA: cem vezes mais falhas não produzem uma espera maior.
    expect(Number.isFinite(absurdamenteMuitas.esperaMs)).toBe(true);
    expect(absurdamenteMuitas.fator).toBe(muitas.fator);
    expect(absurdamenteMuitas.esperaMs).toBe(muitas.esperaMs);
    // E não ultrapassa o teto publicado, qualquer que seja ele.
    expect(muitas.fator).toBeLessThanOrEqual(ESPACAMENTO_MAXIMO);
    expect(muitas.fator).toBe(ESPACAMENTO_MAXIMO);
    expect(muitas.esperaMs).toBe(BASE * ESPACAMENTO_MAXIMO);
  });

  /*
    HAVIA AQUI UM TESTE CHAMADO "voltar a ter sucesso volta à cadência de regime
    imediatamente". Ele foi REMOVIDO, não esquecido (ACH-O3-14): esta função é
    PURA e sem estado — ela não tem transição para exercitar, e o caso era uma
    duplicata literal de "sem falhas, o fator é 1 e a classe é `regime`" logo
    acima, com um nome que prometia observar um retorno que nunca ocorria.

    A transição de fato — falhar duas vezes, voltar a ter sucesso, e o selo de
    espaçamento SUMIR da tela — é exercitada onde ela existe, no ponto de uso:
    `./cadenciaNoPontoDeUso.test.tsx`, "voltar a ter sucesso REMOVE o selo".
  */

  it("toda cadência espaçada carrega o fator, para a tela poder dizer QUANTO", () => {
    // Sem o fator a tela só poderia dizer "está espaçado", que é quase tão ruim
    // quanto não dizer nada: o clínico precisa saber contra qual intervalo
    // conferir o que está vendo.
    for (const falhas of [2, 3, 4, 10]) {
      const cadencia = calcularCadenciaDeRecarga({
        intervaloBaseMs: BASE,
        falhasConsecutivas: falhas,
        sorteio: 0.5,
      });
      expect(cadencia.classe).toBe("espacada_por_falha");
      expect(cadencia.fator).toBeGreaterThan(1);
      expect(cadencia.esperaMs).toBe(BASE * cadencia.fator);
    }
  });
});

describe("bordas", () => {
  it("intervalo base não positivo devolve cadência inerte, sem NaN nem negativo", () => {
    for (const base of [0, -1, Number.NaN]) {
      const cadencia = calcularCadenciaDeRecarga({
        intervaloBaseMs: base,
        falhasConsecutivas: 3,
        sorteio: 0.5,
      });
      expect(Number.isFinite(cadencia.esperaMs), `base ${base}`).toBe(true);
      expect(cadencia.esperaMs).toBeGreaterThan(0);
    }
  });

  it("a espera nunca é menor que 1 ms", () => {
    const cadencia = calcularCadenciaDeRecarga({
      intervaloBaseMs: 1,
      falhasConsecutivas: 0,
      sorteio: 0,
    });
    expect(cadencia.esperaMs).toBeGreaterThanOrEqual(1);
  });
});
