/**
 * apps/web/src/domain/instanteLegivel.test.ts
 *
 * A6.2 — instante ISO 8601 CRU numa tela de beira-leito.
 * `../components/AvisosDeEstado.tsx:70` renderizava
 * `Última leitura bem-sucedida: {obtidoEm}.` com a string do transporte
 * ("2026-08-17T10:00:00.000Z"), e `:156` a repetia entre parênteses. Medido:
 * ZERO ocorrências de `Intl.` em `apps/web/src`.
 *
 * O QUE ESTA FUNÇÃO NÃO PODE FAZER, e é o ponto delicado:
 *   - não pode inventar fuso (nenhum `timeZone` fixo é passado ao
 *     `Intl.DateTimeFormat`; o instante é apresentado no fuso do ambiente e o
 *     nome do fuso aparece junto, para que o instante seja autodescritivo);
 *   - não pode virar tempo relativo ("há pouco"): a duração já tem tratamento
 *     próprio e correto em `textoIdadeDecorrida`, e um relativo calculado no
 *     cliente envelhece sozinho na tela;
 *   - não pode ESCONDER o instante: entrada não interpretável volta verbatim,
 *     e o valor de máquina segue disponível no atributo `dateTime` do `<time>`.
 *
 * Rastreio: ADR-0021 F1 (texto é do frontend), ADR-0029 C2 (redação
 * provisória), HAZ-0025/SAF-0025 (a tela não pode parecer saudável).
 */
import { describe, expect, it } from "vitest";
import { textoInstante } from "./linguagem.js";

const ISO = "2026-08-17T13:45:07.000Z";

describe("textoInstante — instante legível à beira do leito", () => {
  it("não devolve a string ISO crua", () => {
    const texto = textoInstante(ISO);
    expect(texto).not.toBe(ISO);
    expect(texto).not.toMatch(/T\d{2}:\d{2}:\d{2}/);
  });

  it("preserva o instante: data, hora, minuto e segundo continuam legíveis", () => {
    const texto = textoInstante(ISO);
    // Dia e ano do instante, no fuso do ambiente de teste (UTC no CI).
    expect(texto).toMatch(/2026/);
    expect(texto).toMatch(/\d{2}:\d{2}:\d{2}/);
  });

  it("declara o fuso, para que o instante seja autodescritivo", () => {
    /*
      Sem designador de fuso, "17/08/2026 13:45" é ambíguo entre plantões e
      entre máquinas. A asserção é sobre a PRESENÇA do designador depois dos
      segundos, e não sobre a sua grafia: ela varia legitimamente com o
      ambiente ("UTC" no CI, "BRT" numa máquina em America/Sao_Paulo, "GMT-3"
      em outros runtimes) e fixar uma delas seria fixar um fuso — exatamente o
      que esta função não pode fazer.
    */
    expect(textoInstante(ISO)).toMatch(/\d{2}:\d{2}:\d{2}\s+\S+/);
  });

  it("não vira tempo relativo — 'há pouco' é juízo que ninguém ratificou", () => {
    expect(textoInstante(ISO).toLowerCase()).not.toMatch(/há |atrás|agora mesmo|recente/);
  });

  it("entrada não interpretável volta VERBATIM — nada é escondido nem inventado", () => {
    expect(textoInstante("horário desconhecido")).toBe("horário desconhecido");
    expect(textoInstante("")).toBe("");
  });

  it("é estável: a mesma entrada produz sempre a mesma saída (formatador memoizado)", () => {
    expect(textoInstante(ISO)).toBe(textoInstante(ISO));
  });

  it("instantes distintos produzem textos distintos (a função não é constante)", () => {
    expect(textoInstante(ISO)).not.toBe(textoInstante("2026-08-18T13:45:07.000Z"));
  });
});
