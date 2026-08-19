/**
 * apps/web/src/components/instanteNaTela.test.tsx
 *
 * A6.2 no ponto de uso: os dois lugares onde `AvisosDeEstado.tsx` imprimia a
 * string ISO crua do transporte (`:70` e `:156`).
 *
 * A EXIGÊNCIA TEM DOIS LADOS OPOSTOS, e os dois são testados aqui:
 *   - o CLÍNICO precisa ler o instante de relance (logo, formatado em pt-BR);
 *   - a MÁQUINA (teste, telemetria, auditoria) precisa do instante exato e
 *     não ambíguo — logo o valor ISO original continua no atributo `dateTime`
 *     do elemento `<time>`, e não é perdido na formatação.
 *
 * Rastreio: ADR-0021 F1, ADR-0029 C2 (redação provisória), WF-05, HAZ-0025.
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { textoInstante } from "../domain/linguagem.js";
import { RotuloFrescorVisao, RotuloIdadeVisao } from "./AvisosDeEstado.js";

const ISO = "2026-08-17T13:45:07.000Z";

describe("RotuloFrescorVisao — instante da última leitura", () => {
  it("mostra o instante formatado e guarda o ISO exato em `<time dateTime>`", () => {
    render(<RotuloFrescorVisao frescor="desatualizado_apos_falha" obtidoEm={ISO} />);

    const elemento = screen.getByTestId("instante-ultima-leitura");
    expect(elemento.tagName.toLowerCase()).toBe("time");
    expect(elemento.getAttribute("datetime")).toBe(ISO);
    expect(elemento.textContent).toBe(textoInstante(ISO));

    // Não-vacuidade: o rótulo inteiro foi renderizado, com o aviso de frescor.
    expect(screen.getByTestId("rotulo-frescor-visao").textContent ?? "").toMatch(/desatualizado/i);
  });

  it("a tela não exibe mais a string ISO crua", () => {
    render(<RotuloFrescorVisao frescor="desatualizado_apos_falha" obtidoEm={ISO} />);
    const visivel = screen.getByTestId("rotulo-frescor-visao").textContent ?? "";
    expect(visivel).not.toContain(ISO);
  });
});

describe("RotuloIdadeVisao — instante entre parênteses", () => {
  const idade = {
    classe: "no_ciclo",
    idadeMs: 12_000,
    ciclosVencidos: 0,
    intervaloRecargaMs: 30_000,
  } as const;

  it("mostra o instante formatado, mantendo a duração decorrida intacta", () => {
    render(<RotuloIdadeVisao idade={idade} obtidoEm={ISO} />);

    const texto = screen.getByTestId("idade-visao-texto");
    // A DURAÇÃO já tinha tratamento próprio e correto — não foi tocada.
    expect(texto.textContent ?? "").toMatch(/Última leitura bem-sucedida há 12 s/);
    expect(texto.textContent ?? "").not.toContain(ISO);

    const elemento = screen.getByTestId("instante-idade-visao");
    expect(elemento.tagName.toLowerCase()).toBe("time");
    expect(elemento.getAttribute("datetime")).toBe(ISO);
    expect(elemento.textContent).toBe(textoInstante(ISO));
  });

  it("sem instante conhecido, nenhum `<time>` é emitido — nada é inventado", () => {
    render(<RotuloIdadeVisao idade={idade} obtidoEm={null} />);
    expect(screen.queryByTestId("instante-idade-visao")).toBeNull();
  });
});
