import { describe, expect, it } from "vitest";
import {
  ESTADO_INICIAL_RECONHECER_ALERTA,
  type EstadoReconhecerAlerta,
  reduzirReconhecerAlerta,
} from "./reconhecerAlertaMaquina.js";

describe("reduzirReconhecerAlerta (máquina pura — ADR-0021 F5)", () => {
  it("começa ocioso", () => {
    expect(ESTADO_INICIAL_RECONHECER_ALERTA).toEqual({ fase: "ocioso" });
  });

  it("ocioso -> iniciar -> confirmando -> confirmar -> enviando -> sucesso", () => {
    let estado: EstadoReconhecerAlerta = ESTADO_INICIAL_RECONHECER_ALERTA;
    estado = reduzirReconhecerAlerta(estado, { tipo: "iniciar" });
    expect(estado).toEqual({ fase: "confirmando" });

    estado = reduzirReconhecerAlerta(estado, { tipo: "confirmar" });
    expect(estado).toEqual({ fase: "enviando" });

    estado = reduzirReconhecerAlerta(estado, {
      tipo: "sucesso",
      reconhecidoEm: "2026-08-16T12:00:00Z",
    });
    expect(estado).toEqual({ fase: "sucesso", reconhecidoEm: "2026-08-16T12:00:00Z" });
  });

  it("confirmando -> cancelar volta a ocioso", () => {
    const confirmando: EstadoReconhecerAlerta = { fase: "confirmando" };
    expect(reduzirReconhecerAlerta(confirmando, { tipo: "cancelar" })).toEqual({ fase: "ocioso" });
  });

  it("enviando -> falha nunca avança silenciosamente para sucesso (F5: falha sempre visível)", () => {
    const enviando: EstadoReconhecerAlerta = { fase: "enviando" };
    const resultado = reduzirReconhecerAlerta(enviando, {
      tipo: "falha",
      mensagem: "Erro sintético de teste.",
    });
    expect(resultado).toEqual({ fase: "falha", mensagem: "Erro sintético de teste." });
  });

  it("falha -> tentar_novamente volta a confirmando, nunca direto a sucesso", () => {
    const falha: EstadoReconhecerAlerta = { fase: "falha", mensagem: "x" };
    expect(reduzirReconhecerAlerta(falha, { tipo: "tentar_novamente" })).toEqual({
      fase: "confirmando",
    });
  });

  it("uma ação 'sucesso' fora de 'enviando' é ignorada — nunca otimismo sem confirmação em trânsito", () => {
    const ocioso: EstadoReconhecerAlerta = { fase: "ocioso" };
    const resultado = reduzirReconhecerAlerta(ocioso, { tipo: "sucesso", reconhecidoEm: "x" });
    expect(resultado).toEqual({ fase: "ocioso" });
  });

  it("uma ação 'confirmar' fora de 'confirmando' é ignorada", () => {
    const ocioso: EstadoReconhecerAlerta = { fase: "ocioso" };
    expect(reduzirReconhecerAlerta(ocioso, { tipo: "confirmar" })).toEqual({ fase: "ocioso" });
  });

  it("de 'falha' pode iniciar novamente diretamente (nova tentativa completa)", () => {
    const falha: EstadoReconhecerAlerta = { fase: "falha", mensagem: "x" };
    expect(reduzirReconhecerAlerta(falha, { tipo: "iniciar" })).toEqual({ fase: "confirmando" });
  });
});
