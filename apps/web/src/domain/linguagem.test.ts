import { describe, expect, it } from "vitest";
import {
  glifoTom,
  textoAvaliacao,
  textoBandaRisco,
  textoCarregamento,
  textoConectividade,
  textoFrescor,
  textoItemTrabalho,
} from "./linguagem.js";
import type {
  BandaRisco,
  EstadoAvaliacao,
  EstadoCarregamento,
  EstadoConectividade,
  EstadoFrescor,
  EstadoItemTrabalho,
} from "./estados.js";

const TODOS_CARREGAMENTO: EstadoCarregamento[] = [
  "carregando",
  "vazio",
  "indisponivel",
  "proibido",
  "tempo_esgotado",
  "retentando",
  "parcial",
  "pronto",
  "erro",
];
const TODOS_FRESCOR: EstadoFrescor[] = [
  "atual",
  "envelhecendo",
  "desatualizado",
  "expirado",
  "ausente",
  "invalido",
  "conflitante",
  "corrigido",
  "substituido",
];
const TODOS_AVALIACAO: EstadoAvaliacao[] = ["valida", "parcial", "nao_avaliada", "desatualizada", "invalida"];
const TODOS_ITEM_TRABALHO: EstadoItemTrabalho[] = [
  "nao_atribuido",
  "atribuido",
  "reconhecido",
  "escalado",
  "sobreposto",
  "resolvido",
  "suprimido",
  "reaberto",
];
const TODOS_CONECTIVIDADE: EstadoConectividade[] = [
  "online",
  "degradado",
  "offline",
  "reconectando",
  "reproduzindo",
  "reconciliado",
];
const TODAS_BANDAS: BandaRisco[] = ["baixo", "medio", "alto", "critico"];

describe("módulo de linguagem — cobertura total (ADR-0021 F1/F4)", () => {
  it("textoCarregamento cobre todos os estados, sempre em pt-BR não vazio", () => {
    for (const estado of TODOS_CARREGAMENTO) {
      const { texto, tom } = textoCarregamento(estado);
      expect(texto.length).toBeGreaterThan(0);
      expect(tom).toBeTruthy();
    }
  });

  it("textoFrescor cobre todos os estados", () => {
    for (const estado of TODOS_FRESCOR) {
      expect(textoFrescor(estado).texto.length).toBeGreaterThan(0);
    }
  });

  it("textoAvaliacao cobre todos os estados", () => {
    for (const estado of TODOS_AVALIACAO) {
      expect(textoAvaliacao(estado).texto.length).toBeGreaterThan(0);
    }
  });

  it("textoItemTrabalho cobre todos os estados", () => {
    for (const estado of TODOS_ITEM_TRABALHO) {
      expect(textoItemTrabalho(estado).texto.length).toBeGreaterThan(0);
    }
  });

  it("textoConectividade cobre todos os estados", () => {
    for (const estado of TODOS_CONECTIVIDADE) {
      expect(textoConectividade(estado).texto.length).toBeGreaterThan(0);
    }
  });

  it("textoBandaRisco cobre as quatro bandas com rótulo textual (nunca só cor)", () => {
    for (const banda of TODAS_BANDAS) {
      expect(textoBandaRisco(banda).texto.length).toBeGreaterThan(0);
    }
  });

  it("glifoTom retorna um glifo não vazio para cada tom usado no sistema", () => {
    const tons = [
      textoCarregamento("erro").tom,
      textoFrescor("ausente").tom,
      textoAvaliacao("nao_avaliada").tom,
      textoItemTrabalho("suprimido").tom,
      textoBandaRisco("critico").tom,
    ];
    for (const tom of tons) {
      expect(glifoTom(tom).length).toBeGreaterThan(0);
    }
  });

  it("P1 (ADR-0029): 'não avaliado' nunca usa vocabulário tranquilizador nem tom neutro/positivo", () => {
    const { texto, tom } = textoAvaliacao("nao_avaliada");
    expect(texto.toLowerCase()).not.toMatch(/normal|estável|sem alteraç/);
    expect(tom).not.toBe("neutro");
    expect(tom).not.toBe("positivo");
  });

  it("P8 (ADR-0029): 'desatualizado' (stale) e 'ausente' (missing) têm textos distintos", () => {
    const desatualizado = textoFrescor("desatualizado").texto;
    const ausente = textoFrescor("ausente").texto;
    expect(desatualizado).not.toBe(ausente);
  });

  it("P5 (ADR-0029): 'reconhecido' (ciência) e 'resolvido' (encerramento) têm textos distintos", () => {
    const reconhecido = textoItemTrabalho("reconhecido").texto;
    const resolvido = textoItemTrabalho("resolvido").texto;
    expect(reconhecido).not.toBe(resolvido);
  });

  it("P6 (ADR-0029): 'suprimido' é redigido como ato explícito e auditável, não como ausência", () => {
    expect(textoItemTrabalho("suprimido").texto.toLowerCase()).toMatch(/explícit|auditáve|registrad/);
  });

  it("P7 (ADR-0029): 'parcial' nunca é redigido como 'quase completo'", () => {
    expect(textoCarregamento("parcial").texto.toLowerCase()).not.toMatch(/quase completo/);
  });
});
