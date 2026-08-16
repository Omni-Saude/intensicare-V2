import { describe, expect, it } from "vitest";
import { checkConnection, createInMemoryDatabase, packageVersion } from "./index.js";

describe("@intensicare/persistencia (fundação executável)", () => {
  it("exporta uma versão de pacote não vazia", () => {
    expect(packageVersion).toBe("0.0.0");
  });

  it("cria um PGlite em memória e responde a uma consulta real", async () => {
    const db = createInMemoryDatabase();
    try {
      expect(await checkConnection(db)).toBe(true);
    } finally {
      await db.close();
    }
  });
});
