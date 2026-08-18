import { describe, expect, it } from "vitest";
import { criarClienteMock } from "./clienteMock.js";
import { gerarChaveIdempotencia } from "./idempotencia.js";

const SEM_ATRASO = { atrasoMs: 0 } as const;

/**
 * Opções do comando com a VERSÃO VISTA (ADR-0009 W3). `SYNTH-ALERTA-0001`
 * nasce na versão 0 nas fixtures; passar a versão vista é o que faz o dublê
 * aceitar o comando — e passar outra é o que faz ele produzir 412.
 */
const RECONHECER = (versaoVista: number) => ({ atrasoMs: 0, versaoVista }) as const;

describe("clienteMock — listarGradeLeitos", () => {
  it("retorna 'pronto' com leitos, incluindo ao menos um leito vago e um fail-closed", async () => {
    const cliente = criarClienteMock();
    const resposta = await cliente.listarGradeLeitos(SEM_ATRASO);
    expect(resposta.estadoCarregamento).toBe("pronto");
    expect(resposta.dados).not.toBeNull();
    const leitos = resposta.dados!;
    expect(leitos.length).toBeGreaterThan(0);
    expect(leitos.some((l) => l.avaliacao === null)).toBe(true);
    expect(leitos.some((l) => l.avaliacao?.estadoAvaliacao === "nao_avaliada")).toBe(true);
  });

  it("nenhum leito 'nao_avaliada' expõe news2Total ou bandaRisco não nulos (HAZ-0005 fail-closed)", async () => {
    const cliente = criarClienteMock();
    const resposta = await cliente.listarGradeLeitos(SEM_ATRASO);
    const leitos = resposta.dados!;
    for (const leito of leitos) {
      if (leito.avaliacao?.estadoAvaliacao === "nao_avaliada") {
        expect(leito.avaliacao.news2Total).toBeNull();
        expect(leito.avaliacao.bandaRisco).toBeNull();
      }
    }
  });

  it("todo identificador de paciente sintético carrega o marcador SYNTH-", async () => {
    const cliente = criarClienteMock();
    const resposta = await cliente.listarGradeLeitos(SEM_ATRASO);
    for (const leito of resposta.dados!) {
      if (leito.pacienteRef) {
        expect(leito.pacienteRef).toContain("SYNTH-");
      }
    }
  });

  it("modo de demonstração força cada estado exigido pela tarefa", async () => {
    const cliente = criarClienteMock();
    for (const modo of ["vazio", "indisponivel", "erro"] as const) {
      const resposta = await cliente.listarGradeLeitos({ ...SEM_ATRASO, forcarResultado: modo });
      expect(resposta.estadoCarregamento).toBe(modo);
      expect(resposta.dados).toBeNull();
    }
  });
});

describe("clienteMock — obterAvaliacaoPaciente", () => {
  it("retorna 'erro' para um leito inexistente (nunca finge um leito vazio como 'sem risco')", async () => {
    const cliente = criarClienteMock();
    const resposta = await cliente.obterAvaliacaoPaciente("Leito 999", SEM_ATRASO);
    expect(resposta.estadoCarregamento).toBe("erro");
    expect(resposta.problema).not.toBeNull();
  });

  it("retorna o mesmo leito que aparece na grade, com contribuições por parâmetro", async () => {
    const cliente = criarClienteMock();
    const resposta = await cliente.obterAvaliacaoPaciente("Leito 01", SEM_ATRASO);
    expect(resposta.estadoCarregamento).toBe("pronto");
    expect(resposta.dados?.avaliacao?.contribuicoes.length).toBeGreaterThan(0);
  });
});

describe("clienteMock — reconhecerAlerta", () => {
  it("exige chave de idempotência", async () => {
    const cliente = criarClienteMock();
    const resposta = await cliente.reconhecerAlerta("SYNTH-ALERTA-0001", "", RECONHECER(0));
    expect(resposta.estadoCarregamento).toBe("erro");
    expect(resposta.problema?.title).toMatch(/idempotência/i);
  });

  it("reconhece um alerta pendente e reflete a mudança na grade em seguida", async () => {
    const cliente = criarClienteMock();
    const chave = gerarChaveIdempotencia("SYNTH-ALERTA-0001");
    const resposta = await cliente.reconhecerAlerta("SYNTH-ALERTA-0001", chave, RECONHECER(0));
    expect(resposta.estadoCarregamento).toBe("pronto");
    expect(resposta.dados?.estado).toBe("reconhecido");

    const grade = await cliente.listarGradeLeitos(SEM_ATRASO);
    const leito02 = grade.dados!.find((l) => l.leitoId === "Leito 02");
    const alerta = leito02?.alertas.find((a) => a.alertaId === "SYNTH-ALERTA-0001");
    expect(alerta?.estado).toBe("reconhecido");
  });

  it("é idempotente: repetir a mesma chave não gera um segundo efeito nem erro", async () => {
    const cliente = criarClienteMock();
    const chave = gerarChaveIdempotencia("SYNTH-ALERTA-0001");
    const primeira = await cliente.reconhecerAlerta("SYNTH-ALERTA-0001", chave, RECONHECER(0));
    const segunda = await cliente.reconhecerAlerta("SYNTH-ALERTA-0001", chave, RECONHECER(0));
    expect(segunda.estadoCarregamento).toBe("pronto");
    expect(segunda.dados?.reconhecidoEm).toBe(primeira.dados?.reconhecidoEm);
  });

  it("retorna 'erro' para um alerta inexistente", async () => {
    const cliente = criarClienteMock();
    const resposta = await cliente.reconhecerAlerta(
      "SYNTH-ALERTA-INEXISTENTE",
      "SYNTH-idem-x",
      RECONHECER(0),
    );
    expect(resposta.estadoCarregamento).toBe("erro");
  });
});
