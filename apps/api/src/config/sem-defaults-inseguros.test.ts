/**
 * Varredura do schema por default inseguro (teste de aceite ACH-03, §6.3).
 *
 * ADR-0019 §5.2 P4 exige que a ausência de configuração obrigatória falhe o
 * boot e que o sistema NUNCA "degrade silenciosamente para um default
 * inseguro". Um teste que apenas exercitasse os casos de erro conhecidos não
 * provaria isso: bastaria alguém acrescentar amanhã um `IC_BANCO_SENHA` com
 * valor padrão para o buraco reabrir sem nenhum teste ficar vermelho.
 *
 * Este arquivo ataca a propriedade estruturalmente, em três frentes
 * independentes:
 *   (a) a TABELA de descritores é varrida — nenhuma variável sensível pode
 *       declarar default, e todo default existente só pode valer em perfil
 *       sintético;
 *   (b) a classificação é varrida contra o NOME da variável — ninguém pode
 *       reclassificar um segredo como "operacional" só para ganhar direito a
 *       um default;
 *   (c) o CÓDIGO-FONTE do diretório é varrido — nenhum `.default(` de zod,
 *       porque um default embutido no schema escaparia de (a) e (b).
 * A matriz de capacidades é varrida junto (nenhum perfil não sintético pode
 * admitir PGlite, fixtures ou token sintético — anti-padrão 9).
 */
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  CAPACIDADES,
  contextoCanonico,
  DESCRITORES,
  PERFIS,
  PERFIS_ENDURECIDOS,
  PERFIS_SINTETICOS,
  variaveisExigidas,
} from "./index.js";

const DIRETORIO_CONFIG = fileURLToPath(new URL(".", import.meta.url));

/**
 * Fragmentos de nome que denunciam material sensível. Uma variável cujo nome
 * contém qualquer um destes NÃO pode ser classificada como "operacional" —
 * classe que é a única com direito a default em perfil não sintético.
 */
const FRAGMENTOS_SENSIVEIS = [
  "SENHA",
  "SEGREDO",
  "TOKEN",
  "CHAVE",
  "JWKS",
  "EMISSOR",
  "CREDENCIAL",
  "URL",
] as const;

/** Variáveis que jamais podem ter valor padrão, em perfil nenhum. */
const NUNCA_COM_DEFAULT = [
  "PERFIL",
  "IC_BANCO_URL",
  "IC_BANCO_USUARIO",
  "IC_BANCO_SENHA",
  "IC_IDENTIDADE_EMISSOR",
  "IC_IDENTIDADE_AUDIENCIA",
  "IC_IDENTIDADE_JWKS_URL",
  "IC_BUNDLE_REGRA_CAMINHO",
  "IC_BUNDLE_REGRA_CHAVE_PUBLICA",
] as const;

describe("(a) tabela de descritores — nenhum default inseguro", () => {
  it("nenhuma variável sensível declara valor padrão, em perfil nenhum", () => {
    for (const nome of NUNCA_COM_DEFAULT) {
      const descritor = DESCRITORES.find((d) => d.nome === nome);
      expect(descritor, `descritor ausente para ${nome}`).toBeDefined();
      expect(descritor?.padraoPorPerfil, `${nome} não pode ter default`).toBeUndefined();
    }
  });

  it("todo default de classe não operacional vale SOMENTE em perfil sintético", () => {
    const sinteticos = new Set<string>(PERFIS_SINTETICOS);
    for (const descritor of DESCRITORES) {
      if (descritor.classe === "operacional") continue;
      for (const perfil of Object.keys(descritor.padraoPorPerfil ?? {})) {
        expect(
          sinteticos.has(perfil),
          `${descritor.nome} declara default no perfil não sintético ${perfil}`,
        ).toBe(true);
      }
    }
  });

  it("nenhum perfil endurecido recebe default de banco, identidade, segredo, bundle ou semeadura", () => {
    for (const perfil of PERFIS_ENDURECIDOS) {
      for (const descritor of DESCRITORES) {
        if (descritor.classe === "operacional") continue;
        expect(
          descritor.padraoPorPerfil?.[perfil],
          `${descritor.nome} tem default em ${perfil}`,
        ).toBeUndefined();
      }
    }
  });

  it("todo perfil endurecido exige banco, credencial própria, identidade e bundle", () => {
    for (const perfil of PERFIS_ENDURECIDOS) {
      expect(variaveisExigidas(perfil)).toEqual(
        expect.arrayContaining([
          "IC_BANCO_URL",
          "IC_BANCO_USUARIO",
          "IC_BANCO_SENHA",
          "IC_IDENTIDADE_EMISSOR",
          "IC_IDENTIDADE_AUDIENCIA",
          "IC_IDENTIDADE_JWKS_URL",
          "IC_BUNDLE_REGRA_CAMINHO",
          "IC_BUNDLE_REGRA_CHAVE_PUBLICA",
        ]),
      );
    }
  });
});

describe("(b) classificação — segredo não pode ser reclassificado como operacional", () => {
  it("nenhuma variável de nome sensível é classificada como operacional", () => {
    for (const descritor of DESCRITORES) {
      if (descritor.classe !== "operacional") continue;
      for (const fragmento of FRAGMENTOS_SENSIVEIS) {
        expect(
          descritor.nome.includes(fragmento),
          `${descritor.nome} é "operacional" mas o nome contém "${fragmento}"`,
        ).toBe(false);
      }
    }
  });

  it("todo descritor tem nome único", () => {
    const nomes = DESCRITORES.map((d) => d.nome);
    expect(new Set(nomes).size).toBe(nomes.length);
  });
});

/**
 * Remove comentários antes da varredura. Sem isto, a própria documentação que
 * EXPLICA a regra ("nenhum módulo usa `.default(`") a violaria — foi o que
 * aconteceu na primeira execução deste teste.
 *
 * É heurística de texto, não parser, e é honesto dizer o que ela não faz:
 * remove blocos de comentário e comentários de linha, preservando barra-barra
 * precedida de dois-pontos para não truncar linhas com "https:" ou "postgres:".
 * O que sobra é código executável, que é onde um default de verdade estaria.
 */
function semComentarios(fonte: string): string {
  return fonte.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
}

describe("(c) código-fonte — nenhum default embutido no schema", () => {
  it("nenhum módulo de configuração usa `.default(` nem `.catch(` de zod", () => {
    // Montado em tempo de execução para que este arquivo não case consigo
    // mesmo — mesma disciplina do canário de scripts/check_forbidden_content.py.
    const proibidos = [`.${"default"}(`, `.${"catch"}(`];
    const arquivos = readdirSync(DIRETORIO_CONFIG).filter(
      (nome) => nome.endsWith(".ts") && !nome.endsWith(".test.ts"),
    );
    expect(arquivos.length).toBeGreaterThan(0);
    for (const arquivo of arquivos) {
      const codigo = semComentarios(readFileSync(`${DIRETORIO_CONFIG}${arquivo}`, "utf8"));
      for (const proibido of proibidos) {
        expect(codigo.includes(proibido), `${arquivo} contém ${proibido}`).toBe(false);
      }
    }
  });
});

describe("matriz de capacidades — anti-padrão 9 imposto por dado, não por revisão", () => {
  it("cobre exaustivamente os seis perfis (falha fechada para perfil novo)", () => {
    expect(Object.keys(CAPACIDADES).sort()).toEqual([...PERFIS].sort());
    expect([...PERFIS_SINTETICOS, ...PERFIS_ENDURECIDOS].sort()).toEqual([...PERFIS].sort());
  });

  it("nenhum perfil não sintético admite PGlite, fixtures, token sintético ou semeadura", () => {
    for (const perfil of PERFIS_ENDURECIDOS) {
      const cap = CAPACIDADES[perfil];
      expect(cap.permitePGliteEmMemoria, `${perfil} admite PGlite`).toBe(false);
      expect(cap.permiteFixturesSinteticas, `${perfil} admite fixtures`).toBe(false);
      expect(cap.permiteTokenSintetico, `${perfil} admite token sintético`).toBe(false);
      expect(cap.semeaduraAutomaticaPermitida, `${perfil} semeia`).toBe(false);
      expect(cap.exigeBundleDeRegra, `${perfil} dispensa bundle`).toBe(true);
    }
  });

  it("os perfis sintéticos são exatamente test e dev-synthetic", () => {
    expect([...PERFIS_SINTETICOS].sort().join(",")).toBe("dev-synthetic,test");
  });

  it("o contexto canônico de perfil endurecido nunca é sintético", () => {
    for (const perfil of PERFIS_ENDURECIDOS) {
      const ctx = contextoCanonico(perfil);
      expect(ctx.bancoModo).toBe("postgres");
      expect(ctx.identidadeModo).toBe("oidc");
    }
  });
});
