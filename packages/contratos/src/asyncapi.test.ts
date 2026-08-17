/**
 * Testes do contrato de canal (AsyncAPI) e do gate que o valida.
 *
 * A parte mais importante está em `o gate reprova`: um gate que só é
 * exercitado no caminho feliz não prova nada. Cada mutação abaixo produz
 * um documento que DEVE reprovar — e o teste falha se ele passar. É a
 * exigência "prove nos dois sentidos" do achado §6.5.
 */

import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, describe, expect, it } from "vitest";
import {
  ACOES_RECONCILIACAO,
  ASYNCAPI_CONTRACT_VERSION,
  ASYNCAPI_DOC_PATH,
  ASYNCAPI_SPEC_VERSION,
  CONTRATO_CLIENTE_EVENTOS,
  DESCRICAO_ESTADO_CONEXAO,
  DESCRICAO_MOTIVO_ENCERRAMENTO,
  ESTADOS_CONEXAO,
  EVENTO_SSE_ESTADO_CONEXAO,
  EVENTO_SSE_INSTRUCAO_RECONCILIACAO,
  EVENTO_SSE_PULSACAO,
  type EventoFluxo,
  LAST_EVENT_ID_HEADER,
  MOTIVOS_ENCERRAMENTO,
  POLITICA_EVOLUCAO_EVENTOS,
  TICKET_EVENTOS_COOKIE,
  TIPOS_EVENTO_FLUXO,
  type TipoEventoFluxo,
} from "./asyncapi.js";

const RAIZ_REPO = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const SCRIPT = join(RAIZ_REPO, "scripts/check_contratos.mjs");

const ARQUIVOS_DO_GATE = [
  "packages/contratos/openapi.yaml",
  "packages/contratos/asyncapi.yaml",
  "packages/contratos/src/asyncapi.ts",
  "docs/09-api-events-and-mcp/catalogo-de-eventos.md",
  "apps/api/src/db.ts",
];

const temporarios: string[] = [];

afterAll(() => {
  for (const caminho of temporarios) rmSync(caminho, { recursive: true, force: true });
});

/** Copia só o que o gate lê, para poder mutar sem tocar no repositório. */
function montarRaizTemporaria(): string {
  const raiz = mkdtempSync(join(tmpdir(), "ic-contratos-"));
  temporarios.push(raiz);
  for (const relativo of ARQUIVOS_DO_GATE) {
    const destino = join(raiz, relativo);
    mkdirSync(dirname(destino), { recursive: true });
    cpSync(join(RAIZ_REPO, relativo), destino);
  }
  return raiz;
}

function rodarGate(raiz: string): { status: number; saida: string } {
  const execucao = spawnSync("node", [SCRIPT, "--raiz", raiz], { encoding: "utf8" });
  return {
    status: execucao.status ?? -1,
    saida: `${execucao.stdout}\n${execucao.stderr}`,
  };
}

function mutar(raiz: string, relativo: string, transformar: (texto: string) => string): void {
  const caminho = join(raiz, relativo);
  writeFileSync(caminho, transformar(readFileSync(caminho, "utf8")), "utf8");
}

// ---------------------------------------------------------------------------
// Vocabulário do contrato
// ---------------------------------------------------------------------------

describe("vocabulário do canal de eventos", () => {
  it("o enum de tipos de evento é a fonte única do tipo de EventoFluxo", () => {
    // Se `EventoFluxo["tipo"]` deixar de derivar da tupla, isto não compila.
    const amostra: TipoEventoFluxo = TIPOS_EVENTO_FLUXO[0];
    const evento: EventoFluxo = {
      sequencia: 1,
      tipo: amostra,
      tenantId: "SYNTH-TENANT-G7",
      ocorridoEm: "2026-08-16T12:00:00.000Z",
      dados: {},
    };
    expect(TIPOS_EVENTO_FLUXO).toContain(evento.tipo);
    expect(new Set(TIPOS_EVENTO_FLUXO).size).toBe(TIPOS_EVENTO_FLUXO.length);
  });

  it("declara os seis estados de conexão de ADR-0011 P6, nas palavras da cláusula", () => {
    expect([...ESTADOS_CONEXAO]).toEqual([
      "online",
      "degraded",
      "offline",
      "reconnecting",
      "replaying",
      "reconciled",
    ]);
  });

  it("todo estado e todo motivo tem descrição pt-BR pronta para exibição", () => {
    for (const estado of ESTADOS_CONEXAO) {
      expect(DESCRICAO_ESTADO_CONEXAO[estado].length).toBeGreaterThan(10);
    }
    for (const motivo of MOTIVOS_ENCERRAMENTO) {
      expect(DESCRICAO_MOTIVO_ENCERRAMENTO[motivo].length).toBeGreaterThan(10);
    }
  });

  it("a reconciliação por polling é uma ação declarada (ADR-0011 P8)", () => {
    expect(ACOES_RECONCILIACAO).toContain("reconciliar-por-polling");
  });

  it("os motivos cobrem lacuna de cursor, fila cheia e perda de autorização", () => {
    for (const esperado of [
      "cursor-irretomavel",
      "fila-excedida",
      "autorizacao-revogada",
      "sessao-expirada",
      "contexto-alterado",
      "escopo-divergente",
    ]) {
      expect(MOTIVOS_ENCERRAMENTO).toContain(esperado);
    }
  });

  it("declara a política de evolução, com a quebra nomeada explicitamente", () => {
    expect(POLITICA_EVOLUCAO_EVENTOS.quebra.length).toBeGreaterThan(0);
    expect(POLITICA_EVOLUCAO_EVENTOS.regraConsumidor).toContain("polling");
  });

  it("o contrato de cliente proíbe credencial na URL e exige reconciliação", () => {
    const texto = CONTRATO_CLIENTE_EVENTOS.join("\n");
    expect(texto).toContain("Nunca pôr credencial");
    expect(texto).toContain("polling");
    expect(texto).toContain("cursor durável");
  });

  it("nomeia o transporte do handshake sem pô-lo em query string", () => {
    expect(TICKET_EVENTOS_COOKIE).toBe("ic_ticket_eventos");
    expect(LAST_EVENT_ID_HEADER).toBe("Last-Event-ID");
  });

  it("identifica o documento e a versão da spec", () => {
    expect(ASYNCAPI_DOC_PATH).toBe("asyncapi.yaml");
    expect(ASYNCAPI_SPEC_VERSION).toBe("3.0.0");
    expect(ASYNCAPI_CONTRACT_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("os nomes de evento SSE do plano de controle são estáveis", () => {
    expect(EVENTO_SSE_PULSACAO).toBe("pulsacao");
    expect(EVENTO_SSE_ESTADO_CONEXAO).toBe("estado-conexao");
    expect(EVENTO_SSE_INSTRUCAO_RECONCILIACAO).toBe("instrucao-reconciliacao");
  });
});

// ---------------------------------------------------------------------------
// O gate — nos dois sentidos
// ---------------------------------------------------------------------------

describe("check_contratos: o gate APROVA os documentos reais", () => {
  it("passa sobre uma cópia intocada do repositório", () => {
    const { status, saida } = rodarGate(montarRaizTemporaria());
    expect(saida).toContain("OK");
    expect(status).toBe(0);
  }, 60_000);
});

describe("check_contratos: o gate REPROVA — a metade que prova que ele serve", () => {
  it("reprova AsyncAPI com enum de eventos divergente do contrato TypeScript", () => {
    const raiz = montarRaizTemporaria();
    mutar(raiz, "packages/contratos/asyncapi.yaml", (texto) =>
      texto.replace("        - alerta-atualizado\n", ""),
    );
    const { status, saida } = rodarGate(raiz);
    expect(status).toBe(1);
    expect(saida).toContain("Enum de eventos divergente");
  }, 60_000);

  it("reprova evento INVENTADO, mesmo quando TS e YAML concordam entre si", () => {
    const raiz = montarRaizTemporaria();
    mutar(raiz, "packages/contratos/src/asyncapi.ts", (texto) =>
      texto.replace('"alerta-atualizado",', '"alerta-atualizado",\n  "evento-que-ninguem-produz",'),
    );
    mutar(raiz, "packages/contratos/asyncapi.yaml", (texto) =>
      texto.replace(
        "        - alerta-atualizado\n",
        "        - alerta-atualizado\n        - evento-que-ninguem-produz\n",
      ),
    );
    const { status, saida } = rodarGate(raiz);
    expect(status).toBe(1);
    expect(saida).toContain("Evento INVENTADO");
  }, 60_000);

  it("reprova quando o contrato deixa de declarar um evento que a API emite", () => {
    const raiz = montarRaizTemporaria();
    mutar(raiz, "packages/contratos/src/asyncapi.ts", (texto) =>
      texto.replace('  "observacao-clinica-registrada",\n', ""),
    );
    mutar(raiz, "packages/contratos/asyncapi.yaml", (texto) =>
      texto.replace("        - observacao-clinica-registrada\n", ""),
    );
    const { status, saida } = rodarGate(raiz);
    expect(status).toBe(1);
    expect(saida).toContain("A API não pode emitir o que o contrato não declara");
  }, 60_000);

  it("reprova AsyncAPI sintaticamente inválido", () => {
    const raiz = montarRaizTemporaria();
    mutar(raiz, "packages/contratos/asyncapi.yaml", (texto) =>
      texto.replace("channels:", "channels:\n   \t- isto não é YAML válido: [{"),
    );
    const { status, saida } = rodarGate(raiz);
    expect(status).toBe(1);
    expect(saida).toContain("não é YAML válido");
  }, 60_000);

  it("reprova chave YAML duplicada — que um parser tolerante engoliria em silêncio", () => {
    const raiz = montarRaizTemporaria();
    mutar(raiz, "packages/contratos/asyncapi.yaml", (texto) =>
      texto.replace("operations:", "operations: {}\noperations:"),
    );
    const { status, saida } = rodarGate(raiz);
    expect(status).toBe(1);
    expect(saida).toContain("duplicada");
  }, 60_000);

  it("reprova referência que não resolve", () => {
    const raiz = montarRaizTemporaria();
    mutar(raiz, "packages/contratos/asyncapi.yaml", (texto) =>
      texto.replace(
        '$ref: "#/components/schemas/MensagemPulsacao"',
        '$ref: "#/components/schemas/EsquemaQueNaoExiste"',
      ),
    );
    const { status, saida } = rodarGate(raiz);
    expect(status).toBe(1);
    expect(saida).toContain("não resolve");
  }, 60_000);

  it("reprova mensagem sem payload — mensagem sem esquema não é contrato", () => {
    const raiz = montarRaizTemporaria();
    mutar(raiz, "packages/contratos/asyncapi.yaml", (texto) =>
      texto.replace('      payload:\n        $ref: "#/components/schemas/MensagemPulsacao"\n', ""),
    );
    const { status, saida } = rodarGate(raiz);
    expect(status).toBe(1);
    expect(saida).toMatch(/sem 'payload'|não resolve/);
  }, 60_000);

  it("reprova vocabulário de plano de controle divergente", () => {
    const raiz = montarRaizTemporaria();
    mutar(raiz, "packages/contratos/asyncapi.yaml", (texto) =>
      texto.replace("        - reconciled\n", ""),
    );
    const { status, saida } = rodarGate(raiz);
    expect(status).toBe(1);
    expect(saida).toContain("Vocabulário divergente");
  }, 60_000);

  it("reprova credencial em query string no OpenAPI (anti-padrão §10-12)", () => {
    const raiz = montarRaizTemporaria();
    mutar(raiz, "packages/contratos/openapi.yaml", (texto) =>
      texto.replace(
        "        - name: cursor\n          in: query",
        "        - name: token\n          in: query",
      ),
    );
    const { status, saida } = rodarGate(raiz);
    expect(status).toBe(1);
    expect(saida).toContain("proibido");
  }, 60_000);

  it("reprova esquema de segurança que trafega em query string", () => {
    const raiz = montarRaizTemporaria();
    mutar(raiz, "packages/contratos/asyncapi.yaml", (texto) =>
      texto.replace("      in: cookie", "      in: query"),
    );
    const { status, saida } = rodarGate(raiz);
    expect(status).toBe(1);
    expect(saida).toContain("query string");
  }, 60_000);

  it("reprova divergência do nome do cookie de ticket entre TS e AsyncAPI", () => {
    const raiz = montarRaizTemporaria();
    mutar(raiz, "packages/contratos/asyncapi.yaml", (texto) =>
      texto.replace("      name: ic_ticket_eventos", "      name: outro_cookie"),
    );
    const { status, saida } = rodarGate(raiz);
    expect(status).toBe(1);
    expect(saida).toContain("cookie de ticket divergente");
  }, 60_000);

  it("reprova quando o documento AsyncAPI simplesmente não existe", () => {
    const raiz = montarRaizTemporaria();
    rmSync(join(raiz, "packages/contratos/asyncapi.yaml"));
    const { status, saida } = rodarGate(raiz);
    expect(status).toBe(1);
    expect(saida).toContain("ausente");
  }, 60_000);
});
