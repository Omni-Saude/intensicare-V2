/**
 * Banner de perfil sintético — observável por teste, não `console.log` solto.
 *
 * A exigência (§6.3 do despacho ACH-03) é que o modo sintético se ANUNCIE. Um
 * `console.log` no bootstrap satisfaria a letra e não a intenção: não seria
 * asseverável, não sobreviveria a um logger estruturado e não teria como ser
 * exposto pela prontidão. Aqui o banner é um VALOR na configuração
 * (`config.banner`), construído por função pura; a emissão é um efeito
 * separado que recebe o escritor por parâmetro — sem escritor embutido, não há
 * como um banner ser emitido "por acidente" nem como um teste deixar de vê-lo.
 *
 * ADR-0020 §4 O4 ("Readiness = capacidade segura") é quem consumirá
 * `config.banner` / `config.limitacoes` — ver handoff.
 */
import { describe, expect, it } from "vitest";
import {
  carregarConfiguracao,
  construirBanner,
  emitirBanner,
  formatarBanner,
  PERFIS_ENDURECIDOS,
} from "./index.js";

const AMBIENTE_PRODUCTION: Readonly<Record<string, string>> = Object.freeze({
  PERFIL: "production",
  IC_BANCO_MODO: "postgres",
  IC_BANCO_URL: "postgres://banco.interno.invalid:5432/intensicare",
  IC_BANCO_USUARIO: "intensicare_app",
  IC_BANCO_SENHA: "SYNTH-SENHA-DE-TESTE",
  IC_BANCO_SEMEAR_FIXTURES: "nao",
  IC_IDENTIDADE_MODO: "oidc",
  IC_IDENTIDADE_EMISSOR: "https://identidade.invalid/realms/intensicare",
  IC_IDENTIDADE_AUDIENCIA: "intensicare-api",
  IC_IDENTIDADE_JWKS_URL: "https://identidade.invalid/realms/intensicare/jwks",
  IC_BUNDLE_REGRA_CAMINHO: "/opt/intensicare/bundles/news2.bundle",
  IC_BUNDLE_REGRA_CHAVE_PUBLICA: "SYNTH-CHAVE-PUBLICA-DE-TESTE",
});

describe("dev-synthetic emite banner inequívoco", () => {
  it("expõe o banner como valor da configuração, não como efeito colateral", () => {
    const config = carregarConfiguracao({ PERFIL: "dev-synthetic" });
    expect(config.banner).not.toBeNull();
    expect(config.modoDegradado).toBe(true);
    expect(config.banner?.titulo.toUpperCase()).toContain("NÃO É PRODUÇÃO");
  });

  it("nomeia cada limitação real do modo sintético", () => {
    const config = carregarConfiguracao({ PERFIL: "dev-synthetic" });
    const texto = (config.banner?.limitacoes ?? []).join("\n");
    expect(texto).toContain("PGlite");
    expect(texto).toContain("fixtures sintéticas");
    expect(texto).toContain("token sintético");
    expect(config.limitacoes).toEqual(config.banner?.limitacoes);
  });

  it("emite o banner através do escritor recebido — nenhum escritor embutido", () => {
    const config = carregarConfiguracao({ PERFIL: "dev-synthetic" });
    const linhas: string[] = [];
    expect(config.banner).not.toBeNull();
    if (config.banner === null) return;
    emitirBanner(config.banner, (linha) => linhas.push(linha));
    expect(linhas.length).toBeGreaterThan(0);
    expect(linhas.join("\n")).toContain("NÃO É PRODUÇÃO");
    expect(linhas).toEqual([...formatarBanner(config.banner)]);
  });

  it("formata o banner como bloco delimitado, sem depender de cor ou terminal", () => {
    const banner = construirBanner({
      perfil: "dev-synthetic",
      bancoModo: "pglite-memoria",
      semearFixturesSinteticas: true,
      identidadeModo: "token-sintetico",
      temBundleDeRegra: false,
    });
    expect(banner).not.toBeNull();
    if (banner === null) return;
    const linhas = formatarBanner(banner);
    expect(linhas[0]).toMatch(/^=+$/);
    expect(linhas[linhas.length - 1]).toMatch(/^=+$/);
  });
});

describe("test também se anuncia, e integration se anuncia como não produtivo", () => {
  it("perfil test produz banner", () => {
    const config = carregarConfiguracao({ PERFIL: "test" });
    expect(config.banner).not.toBeNull();
    expect(config.modoDegradado).toBe(true);
  });

  it("integration declara dados sintéticos controlados e ausência de semeadura automática", () => {
    const config = carregarConfiguracao({ ...AMBIENTE_PRODUCTION, PERFIL: "integration" });
    expect(config.banner).not.toBeNull();
    expect(config.banner?.titulo.toUpperCase()).toContain("NÃO É PRODUÇÃO");
    expect((config.banner?.limitacoes ?? []).join("\n")).toContain("semeadura automática");
  });
});

describe("perfil produtivo não tem banner de modo degradado", () => {
  it("staging, pilot e production não produzem banner nem modo degradado", () => {
    for (const perfil of PERFIS_ENDURECIDOS) {
      if (perfil === "integration") continue;
      const config = carregarConfiguracao({ ...AMBIENTE_PRODUCTION, PERFIL: perfil });
      expect(config.banner, `${perfil} produziu banner`).toBeNull();
      expect(config.modoDegradado, `${perfil} está degradado`).toBe(false);
      expect(config.limitacoes).toEqual([]);
    }
  });
});

describe("o banner nunca carrega material sensível", () => {
  it("não contém senha, URL de banco, emissor nem chave", () => {
    const config = carregarConfiguracao({ PERFIL: "dev-synthetic" });
    if (config.banner === null) throw new Error("banner esperado em dev-synthetic");
    const texto = formatarBanner(config.banner).join("\n");
    expect(texto).not.toContain("SYNTH-SENHA-DE-TESTE");
    expect(texto).not.toContain("postgres://");
    expect(texto).not.toContain("https://");
  });
});
