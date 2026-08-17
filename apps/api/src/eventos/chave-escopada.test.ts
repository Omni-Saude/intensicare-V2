/**
 * Comportamento em TEMPO DE EXECUÇÃO da chave escopada por tenant.
 *
 * A prova de que "cross-tenant é impossível POR TIPO" (ADR-0016 §4.1) NÃO
 * mora aqui, e a razão importa: `apps/api/tsconfig.json` exclui
 * `src/**\/*.test.ts` do typecheck, e o vitest transpila sem checar tipos —
 * uma diretiva `@ts-expect-error` neste arquivo seria decoração, não prova.
 * Ela vive em `./provas-de-tipo.ts`, que É compilado por `pnpm typecheck` e
 * por `pnpm build`. Medido: ao enfraquecer a marca nominal para
 * `type TenantId = string`, o compilador passa a reprovar com
 * `TS2578: Unused '@ts-expect-error' directive`.
 */

import { describe, expect, it } from "vitest";
import {
  criarChaveEscopada,
  envelopePertenceAChave,
  marcarTenantVerificado,
  RECURSO_CANAL_EVENTOS,
} from "./chave-escopada.js";
import { criarContextoVerificado } from "./porta.js";
import { provasDeTipoDoCanalEscopado } from "./provas-de-tipo.js";

const contexto = criarContextoVerificado({
  tenantIdVerificado: "SYNTH-TENANT-G7",
  atorId: "SYNTH-USER-A1",
});

describe("ChaveEscopadaPorTenant", () => {
  it("as provas de tipo existem como módulo compilado, não como comentário", () => {
    // Não é chamada: a prova é a COMPILAÇÃO do módulo. Este teste só
    // garante que ele não foi apagado sem que ninguém percebesse.
    expect(typeof provasDeTipoDoCanalEscopado).toBe("function");
  });

  it("constrói a chave a partir do contexto VERIFICADO, com o tenant embutido", () => {
    const chave = criarChaveEscopada(contexto, RECURSO_CANAL_EVENTOS);
    expect(chave.valor).toBe("tenant:SYNTH-TENANT-G7|recurso:eventos-stream");
    expect(chave.tenantId as string).toBe("SYNTH-TENANT-G7");
  });

  it("recusa tenant vazio em tempo de execução (fail-closed)", () => {
    expect(() => marcarTenantVerificado("   ")).toThrow(/fail-closed/i);
  });

  it("recusa recurso vazio (fail-closed)", () => {
    expect(() => criarChaveEscopada(contexto, "  ")).toThrow(/fail-closed/i);
  });
});

describe("reescopo a partir do envelope (ADR-0016 §4.1)", () => {
  const chave = criarChaveEscopada(contexto, RECURSO_CANAL_EVENTOS);

  it("aceita envelope do próprio tenant", () => {
    expect(envelopePertenceAChave(chave, "SYNTH-TENANT-G7")).toBe(true);
  });

  it("recusa envelope de outro tenant — o consumidor não confia no produtor", () => {
    expect(envelopePertenceAChave(chave, "SYNTH-TENANT-B")).toBe(false);
  });
});
