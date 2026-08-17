/**
 * Testes do ticket efêmero: uso único, expiração, e o fato de o valor
 * nunca sair a não ser dentro de um `Set-Cookie` com os atributos certos.
 */

import { TICKET_EVENTOS_COOKIE } from "@intensicare/contratos";
import { describe, expect, it } from "vitest";
import {
  EmissorDeTickets,
  lerTicketDoCookie,
  montarCookieDeExpurgo,
  montarCookieDeTicket,
  redigirTicket,
} from "./ticket.js";

interface Carga {
  readonly tenantId: string;
}

const CARGA: Carga = { tenantId: "SYNTH-TENANT-G7" };

describe("EmissorDeTickets", () => {
  it("emite um ticket consumível uma única vez", () => {
    const emissor = new EmissorDeTickets<Carga>(60);
    const ticket = emissor.emitir(CARGA, 1_000);

    const primeiro = emissor.consumir(ticket.valor, 2_000);
    expect(primeiro.ok).toBe(true);
    if (primeiro.ok) expect(primeiro.carga.tenantId).toBe("SYNTH-TENANT-G7");

    const segundo = emissor.consumir(ticket.valor, 3_000);
    expect(segundo.ok).toBe(false);
    if (!segundo.ok) expect(segundo.motivoInterno).toBe("inexistente-ou-ja-usado");
  });

  it("rejeita ticket expirado", () => {
    const emissor = new EmissorDeTickets<Carga>(30);
    const ticket = emissor.emitir(CARGA, 0);
    const resultado = emissor.consumir(ticket.valor, 30_001);
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.motivoInterno).toBe("expirado");
  });

  it("consome o ticket expirado assim que ele é tocado — uso único vale no caminho de erro", () => {
    const emissor = new EmissorDeTickets<Carga>(30);
    const ticket = emissor.emitir(CARGA, 0);
    expect(emissor.contarVivos()).toBe(1);
    emissor.consumir(ticket.valor, 30_001);
    expect(emissor.contarVivos()).toBe(0);
  });

  it("rejeita ticket que nunca existiu, com o mesmo motivo de um já usado", () => {
    const emissor = new EmissorDeTickets<Carga>(60);
    const resultado = emissor.consumir("valor-que-nunca-foi-emitido", 1_000);
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.motivoInterno).toBe("inexistente-ou-ja-usado");
  });

  it("emite valores distintos e imprevisíveis", () => {
    const emissor = new EmissorDeTickets<Carga>(60);
    const valores = new Set(Array.from({ length: 200 }, () => emissor.emitir(CARGA, 0).valor));
    expect(valores.size).toBe(200);
    for (const valor of valores) expect(valor.length).toBeGreaterThanOrEqual(40);
  });

  it("poda expirados sem tocar nos vivos", () => {
    const emissor = new EmissorDeTickets<Carga>(10);
    emissor.emitir(CARGA, 0);
    emissor.emitir(CARGA, 60_000);
    expect(emissor.podarExpirados(20_000)).toBe(1);
    expect(emissor.contarVivos()).toBe(1);
  });

  it("recusa TTL inválido (fail-closed, sem valor padrão silencioso)", () => {
    expect(() => new EmissorDeTickets<Carga>(0)).toThrow(/fail-closed/i);
    expect(() => new EmissorDeTickets<Carga>(-5)).toThrow(/fail-closed/i);
  });
});

describe("cookie do ticket", () => {
  it("carrega HttpOnly, Secure, SameSite=Strict e Path estreito", () => {
    const cookie = montarCookieDeTicket({
      valor: "abc123",
      ttlSegundos: 30,
      caminhoDoFluxo: "/v1/eventos/stream",
    });
    expect(cookie).toContain(`${TICKET_EVENTOS_COOKIE}=abc123`);
    expect(cookie).toContain("Path=/v1/eventos/stream");
    expect(cookie).toContain("Max-Age=30");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Secure");
    expect(cookie).toContain("SameSite=Strict");
  });

  it("o cookie de expurgo zera o valor imediatamente", () => {
    const cookie = montarCookieDeExpurgo("/v1/eventos/stream");
    expect(cookie).toContain(`${TICKET_EVENTOS_COOKIE}=;`);
    expect(cookie).toContain("Max-Age=0");
    expect(cookie).toContain("HttpOnly");
  });

  it("lê o ticket do cabeçalho Cookie e ignora os demais cookies", () => {
    const cabecalho = `outro=1; ${TICKET_EVENTOS_COOKIE}=xyz789; mais=2`;
    expect(lerTicketDoCookie(cabecalho)).toBe("xyz789");
  });

  it("devolve indefinido quando o cookie não está presente ou está vazio", () => {
    expect(lerTicketDoCookie(undefined)).toBeUndefined();
    expect(lerTicketDoCookie("outro=1")).toBeUndefined();
    expect(lerTicketDoCookie(`${TICKET_EVENTOS_COOKIE}=`)).toBeUndefined();
  });

  it("a redação nunca revela o valor", () => {
    expect(redigirTicket("segredo-de-verdade")).toBe("<ticket-redigido>");
    expect(redigirTicket("segredo-de-verdade")).not.toContain("segredo");
    expect(redigirTicket(undefined)).toBe("<ausente>");
  });
});
