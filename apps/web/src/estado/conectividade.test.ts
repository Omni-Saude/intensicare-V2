/**
 * Testes da parte PURA da 5ª família do §11 (conectividade).
 */
import { describe, expect, it } from "vitest";
import type { EstadoConectividade } from "../domain/estados.js";
import { comandosBloqueados, combinarConectividade } from "./conectividade.js";

describe("combinarConectividade — precedência do estado mais grave", () => {
  it("offline vence tudo", () => {
    expect(combinarConectividade("offline", true)).toBe("offline");
    expect(combinarConectividade("offline", false)).toBe("offline");
  });

  it("reconectando vence degradado", () => {
    expect(combinarConectividade("reconectando", true)).toBe("reconectando");
  });

  it("degradado aparece quando há conexão mas a última leitura falhou", () => {
    expect(combinarConectividade("online", true)).toBe("degradado");
  });

  it("online só quando nada está degradado", () => {
    expect(combinarConectividade("online", false)).toBe("online");
  });
});

describe("comandosBloqueados — nunca sucesso aparente offline", () => {
  it("bloqueia apenas offline", () => {
    expect(comandosBloqueados("offline")).toBe(true);
    expect(comandosBloqueados("degradado")).toBe(false);
    expect(comandosBloqueados("reconectando")).toBe(false);
    expect(comandosBloqueados("online")).toBe(false);
  });

  it("é total sobre a família (nenhum estado fica sem decisão)", () => {
    const todos: EstadoConectividade[] = [
      "online",
      "degradado",
      "offline",
      "reconectando",
      "reproduzindo",
      "reconciliado",
    ];
    for (const estado of todos) {
      expect(typeof comandosBloqueados(estado)).toBe("boolean");
    }
  });
});
