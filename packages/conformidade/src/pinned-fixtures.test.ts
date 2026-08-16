/**
 * Testes do PIN local das fixtures. O ponto central: uma fixture
 * adulterada precisa ser DETECTADA, não absorvida silenciosamente — sem
 * isso, qualquer veredito deste harness seria uma alegação sobre um
 * conjunto de dados desconhecido.
 */
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import {
  DEFAULT_PINNED_FIXTURES_DIR,
  fixtureByName,
  loadPinnedFixtures,
  PINNED_FIXTURE_DIGESTS,
} from "./pinned-fixtures.js";

const temporaryDirectories: string[] = [];

function copyFixturesTo(options: {
  readonly mutate?: (fileName: string, raw: string) => string;
  readonly omit?: readonly string[];
}): string {
  const directory = mkdtempSync(join(tmpdir(), "conformidade-fixtures-"));
  temporaryDirectories.push(directory);
  for (const fileName of Object.keys(PINNED_FIXTURE_DIGESTS)) {
    if (options.omit?.includes(fileName)) continue;
    const raw = readFileSync(join(DEFAULT_PINNED_FIXTURES_DIR, fileName), "utf8");
    writeFileSync(join(directory, fileName), options.mutate?.(fileName, raw) ?? raw, "utf8");
  }
  return directory;
}

afterAll(() => {
  for (const directory of temporaryDirectories) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("pin local das fixtures do contrato v1", () => {
  it("confere as dez fixtures pinadas do repositório", () => {
    const set = loadPinnedFixtures();
    expect(set.fixtures).toHaveLength(10);
    expect(set.status).toBe("conferido");
    expect(set.divergences).toEqual([]);
    expect(set.fixtures.every((fixture) => fixture.pinStatus === "conferido")).toBe(true);
  });

  it("classifica seis fixtures válidas e quatro deliberadamente inválidas", () => {
    const set = loadPinnedFixtures();
    expect(set.fixtures.filter((f) => f.role === "valid")).toHaveLength(6);
    expect(set.fixtures.filter((f) => f.role === "invalid")).toHaveLength(4);
  });

  it("DETECTA fixture adulterada (um único byte alterado reprova o conjunto)", () => {
    const directory = copyFixturesTo({
      mutate: (fileName, raw) =>
        fileName === "alias.valid.json" ? raw.replace("10:00:00Z", "10:00:01Z") : raw,
    });
    const set = loadPinnedFixtures({ directory });

    expect(set.status).toBe("divergente");
    expect(set.divergences).toHaveLength(1);
    expect(set.divergences[0]).toContain("alias.valid.json");
    expect(set.divergences[0]).toContain("diverge do pinado");
    expect(fixtureByName(set, "alias.valid.json").pinStatus).toBe("divergente");
    // As demais permanecem conferidas — a divergência é localizada e nomeada.
    expect(fixtureByName(set, "merge.valid.json").pinStatus).toBe("conferido");
  });

  it("trata fixture pinada AUSENTE como divergência, nunca como tolerância", () => {
    const directory = copyFixturesTo({ omit: ["erasure.valid.json"] });
    const set = loadPinnedFixtures({ directory });

    expect(set.status).toBe("divergente");
    expect(fixtureByName(set, "erasure.valid.json").pinStatus).toBe("ausente");
    expect(set.divergences[0]).toContain("AUSENTE");
  });

  it("trata fixture NOVA (não pinada) como divergência — o pin fecha nos dois sentidos", () => {
    const directory = copyFixturesTo({});
    writeFileSync(
      join(directory, "inventada.valid.json"),
      JSON.stringify({ event_id: "00000000-0000-4000-8000-000000000000" }),
      "utf8",
    );
    const set = loadPinnedFixtures({ directory });

    expect(set.status).toBe("divergente");
    expect(set.divergences.some((d) => d.includes("inventada.valid.json"))).toBe(true);
    expect(set.divergences.some((d) => d.includes("AUSENTE do pin"))).toBe(true);
  });

  it("recusa nome de fixture fora do conjunto pinado em vez de inventar uma", () => {
    const set = loadPinnedFixtures();
    expect(() => fixtureByName(set, "inventada.valid.json")).toThrow(
      /não pertence ao conjunto pinado/,
    );
  });

  it("nenhuma fixture pinada carrega PSR na forma real (todas usam o marcador SYNTH-)", () => {
    const set = loadPinnedFixtures();
    const realPsr = /amh:psr:v1:(?!SYNTH-)[0-9a-f]{8}-[0-9a-f]{4}/i;
    for (const fixture of set.fixtures) {
      expect(realPsr.test(fixture.raw)).toBe(false);
    }
  });
});
