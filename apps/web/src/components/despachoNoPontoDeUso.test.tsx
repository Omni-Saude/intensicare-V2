/**
 * apps/web/src/components/despachoNoPontoDeUso.test.tsx
 *
 * LAC-L2 e ADR-0011 P7 no PONTO DE USO CLÍNICO — o que a tela de fato
 * renderiza, não o que o mapeador devolve.
 *
 * DOIS FATOS QUE O CLIENTE DESCARTAVA:
 *
 *   1. MODO DE DESPACHO. `ResultadoAvaliacao.despacho` e
 *      `EntradaGradeLeitos.modoAvaliacao` são publicados pelo backend
 *      (`apps/api/src/db.ts:833` e `:872`) e o cliente os jogava fora. O único
 *      aviso "CONSULTIVO" em tela era literal fixo de `BannerContexto.tsx:42`,
 *      escrito à mão e verdadeiro por coincidência — se a regra saísse de
 *      sombra, o banner continuaria dizendo a mesma coisa. QAS-0023 exige
 *      contagem ZERO de degradação sem representação visível.
 *
 *   2. FRESCOR DA GRADE. `EntradaGradeLeitos.frescor` é obrigatório no
 *      contrato e não era lido; o cartão DERIVAVA frescor de uma lista de
 *      contribuições que o mapeador deixava vazia por construção.
 *
 * ANCORAGEM DE NÃO-VACUIDADE em todo teste de valor: o caminho legítimo
 * produz X, o forjado/ausente produz Y ≠ X. Um teste que só afirmasse "não
 * aparece acionável" passaria numa tela em branco.
 *
 * Rastreio: LAC-L2, ADR-0011 P7, ADR-0021 F1/F3/F8, ADR-0008 N3, QAS-0023,
 * ADR-0029 (texto provisório), HAZ-0005.
 */
import type { ModoDeDespachoAvaliacao } from "@intensicare/contratos";
import { render, screen, waitFor } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { ClienteApiIntensiCare, RespostaApi } from "../api/tipos.js";
import type { ItemGradeLeito } from "../domain/clinico.js";
import { CartaoLeito } from "./CartaoLeito.js";
import { DetalhePaciente } from "./DetalhePaciente.js";

/**
 * Rótulo pt-BR DO SERVIDOR, transcrito de `apps/api/src/regras/tipos.ts:95`
 * (`ROTULO_SOMBRA_PT`). O frontend não redige este texto — ele o exibe.
 */
const ROTULO_SOMBRA_DO_SERVIDOR =
  "SOMBRA — avaliação consultiva sobre dados sintéticos, NÃO acionável: " +
  "nenhuma recomendação, ordem ou conduta clínica decorre deste resultado.";

const BUNDLE = {
  versaoBundle: "SYNTH-BUNDLE-0.0.1",
  digestManifesto: null,
  behaviorHash: null,
  assinatura: "assinatura_verificada",
  bloqueiosDeAtivacao: [],
  ativoDesde: null,
} as const;

function despachoSombra(): ModoDeDespachoAvaliacao {
  return {
    desfecho: "avaliada",
    modo: "sombra",
    acionavel: false,
    rotuloPt: ROTULO_SOMBRA_DO_SERVIDOR,
    motivoRecusa: null,
    mensagemRecusaPt: null,
    versaoRegra: "RULE-NEWS2@0.2.0",
    despachadoEm: "2026-08-17T10:00:00.000Z",
    bundle: BUNDLE,
  };
}

function leito(sobrepor: Partial<ItemGradeLeito> = {}): ItemGradeLeito {
  return {
    leitoId: "SYNTH-LEITO-01",
    pacienteRef: "amh:psr:v1:SYNTH-P001",
    pacienteApelido: "Paciente SYNTH-P001",
    frescor: "atual",
    modoAvaliacao: despachoSombra(),
    avaliacao: {
      estadoAvaliacao: "valida",
      news2Total: 3,
      bandaRisco: "atencao",
      contribuicoes: [],
      insumosAusentes: [],
      insumosVelhos: [],
      motivos: [],
      anotacoes: [],
      explicacao: "SYNTH — explicação agregada do backend.",
      parametroVermelho: false,
      calculadoEm: "2026-08-17T10:00:00.000Z",
      versaoRegra: "RULE-NEWS2@0.2.0",
      despacho: despachoSombra(),
    },
    alertas: [],
    ...sobrepor,
  };
}

// ---------------------------------------------------------------------------
// Modo de despacho no cartão da grade
// ---------------------------------------------------------------------------

describe("CartaoLeito — modo de despacho (LAC-L2)", () => {
  it("regra em SOMBRA: o cartão exibe o rótulo do SERVIDOR, verbatim", () => {
    const html = renderToStaticMarkup(<CartaoLeito item={leito()} aoSelecionar={() => {}} />);

    // Não-vacuidade: o cartão renderizou conteúdo clínico de verdade.
    expect(html).toMatch(/NEWS2/);
    expect(html).toContain(ROTULO_SOMBRA_DO_SERVIDOR);
    expect(html).toContain('data-acionavel="false"');
    expect(html).toContain('data-modo-despacho="sombra"');
  });

  it("modo NÃO registrado (`null`) ⇒ declarado NÃO acionável, jamais silêncio", () => {
    const html = renderToStaticMarkup(
      <CartaoLeito
        item={leito({
          modoAvaliacao: null,
          avaliacao: { ...leito().avaliacao!, despacho: null },
        })}
        aoSelecionar={() => {}}
      />,
    );

    expect(html).toMatch(/NEWS2/);
    expect(html).toContain('data-situacao-despacho="nao_registrado"');
    expect(html).toContain('data-acionavel="false"');
    expect(html).toMatch(/não registrado/i);
    // O texto do servidor não existe neste caso — nada pode ser citado dele.
    expect(html).not.toContain(ROTULO_SOMBRA_DO_SERVIDOR);
  });

  it("campo AUSENTE (payload antigo) ⇒ mesmo tratamento fail-closed que `null`", () => {
    const semCampo = leito();
    // Simula a resposta gravada antes desta versão do contrato: a chave nem existe.
    delete (semCampo as { modoAvaliacao?: unknown }).modoAvaliacao;
    delete (semCampo.avaliacao as { despacho?: unknown }).despacho;

    const html = renderToStaticMarkup(<CartaoLeito item={semCampo} aoSelecionar={() => {}} />);
    expect(html).toMatch(/NEWS2/);
    expect(html).toContain('data-acionavel="false"');
    expect(html).toContain('data-situacao-despacho="nao_registrado"');
  });

  /*
    ÂNCORA. Sem este caso, "nunca acionável" seria satisfeito por uma tela que
    nunca renderiza nada. O caminho LEGÍTIMO acionável produz um valor
    diferente — e nenhum outro caminho o produz.
  */
  it('envelope coerentemente acionável ⇒ `data-acionavel="true"` (a tela não é constante)', () => {
    const acionavel: ModoDeDespachoAvaliacao = {
      ...despachoSombra(),
      modo: "acionavel",
      acionavel: true,
      rotuloPt: "SYNTH — rótulo de despacho acionável emitido pelo servidor.",
    };
    const html = renderToStaticMarkup(
      <CartaoLeito item={leito({ modoAvaliacao: acionavel })} aoSelecionar={() => {}} />,
    );
    expect(html).toContain('data-acionavel="true"');
    expect(html).toContain("SYNTH — rótulo de despacho acionável emitido pelo servidor.");
  });

  it("FORJADO (acionavel=true em modo sombra) NUNCA renderiza como acionável", () => {
    const forjado: ModoDeDespachoAvaliacao = { ...despachoSombra(), acionavel: true };
    const html = renderToStaticMarkup(
      <CartaoLeito item={leito({ modoAvaliacao: forjado })} aoSelecionar={() => {}} />,
    );
    expect(html).toContain('data-acionavel="false"');
    expect(html).toContain('data-situacao-despacho="incoerente"');
    // A alegação não sustentada não é repetida como se fosse do servidor.
    expect(html).not.toContain(ROTULO_SOMBRA_DO_SERVIDOR);
  });

  it("leito VAGO não declara modo de despacho — não há avaliação a rotular", () => {
    const vago = leito({
      pacienteRef: null,
      pacienteApelido: null,
      avaliacao: null,
      modoAvaliacao: null,
    });
    const html = renderToStaticMarkup(<CartaoLeito item={vago} aoSelecionar={() => {}} />);
    expect(html).toMatch(/Leito vago/);
    expect(html).not.toContain("data-situacao-despacho");
  });
});

// ---------------------------------------------------------------------------
// Frescor da grade: consumido, não derivado
// ---------------------------------------------------------------------------

describe("CartaoLeito — frescor vem do servidor (ADR-0011 P7)", () => {
  it("servidor diz 'desatualizado' ⇒ o cartão diz desatualizado", () => {
    const html = renderToStaticMarkup(
      <CartaoLeito item={leito({ frescor: "desatualizado" })} aoSelecionar={() => {}} />,
    );
    expect(html).toMatch(/NEWS2/);
    expect(html).toMatch(/Dado desatualizado/);
    expect(html).not.toMatch(/Dado atual/);
  });

  it("servidor diz 'atual' ⇒ o cartão diz atual", () => {
    const html = renderToStaticMarkup(
      <CartaoLeito item={leito({ frescor: "atual" })} aoSelecionar={() => {}} />,
    );
    expect(html).toMatch(/Dado atual/);
  });

  it("servidor diz 'envelhecendo' ⇒ o cartão diz envelhecendo", () => {
    const html = renderToStaticMarkup(
      <CartaoLeito item={leito({ frescor: "envelhecendo" })} aoSelecionar={() => {}} />,
    );
    expect(html).toMatch(/Dado envelhecendo/);
  });

  /*
    PROVA DE NÃO-DERIVAÇÃO. Enche `contribuicoes` com um insumo INVÁLIDO — o
    pior frescor possível — e mantém `frescor: "atual"` vindo do servidor. Se o
    cartão ainda derivasse, o texto mudaria. A projeção entrega o status
    pronto; o cliente não o deriva.
  */
  it("mexer nas contribuições NÃO muda o frescor exibido na grade", () => {
    const comContribuicoes = leito({
      frescor: "atual",
      avaliacao: {
        ...leito().avaliacao!,
        contribuicoes: [
          {
            parametro: "temperatura",
            rotulo: "Temperatura",
            valorObservado: 37,
            pontos: 0,
            frescor: "invalido",
            horarioFonte: "2026-08-17T09:00:00.000Z",
            explicacao: "SYNTH — insumo em quarentena declarada pelo produtor.",
          },
        ],
      },
    });
    const html = renderToStaticMarkup(
      <CartaoLeito item={comContribuicoes} aoSelecionar={() => {}} />,
    );
    expect(html).toMatch(/Dado atual/);
    expect(html).not.toMatch(/Dado inválido/);
  });

  it("frescor ausente no item ⇒ o cartão não afirma frescor nenhum", () => {
    const semFrescor = leito();
    delete (semFrescor as { frescor?: unknown }).frescor;
    const html = renderToStaticMarkup(<CartaoLeito item={semFrescor} aoSelecionar={() => {}} />);
    expect(html).toMatch(/NEWS2/);
    expect(html).not.toMatch(/Dado atual/);
    expect(html).not.toMatch(/Dado desatualizado/);
  });
});

// ---------------------------------------------------------------------------
// Modo de despacho na tela de detalhe
// ---------------------------------------------------------------------------

function clienteQueEntrega(item: ItemGradeLeito): ClienteApiIntensiCare {
  return {
    listarGradeLeitos: async () => ({
      estadoCarregamento: "pronto",
      dados: [item],
      problema: null,
    }),
    obterAvaliacaoPaciente: async (): Promise<RespostaApi<ItemGradeLeito>> => ({
      estadoCarregamento: "pronto",
      dados: item,
      problema: null,
    }),
    reconhecerAlerta: async () => ({
      estadoCarregamento: "erro",
      dados: null,
      problema: null,
      conflito: null,
    }),
  };
}

describe("DetalhePaciente — modo de despacho no ponto de decisão", () => {
  it("exibe o rótulo do servidor verbatim e marca a avaliação como NÃO acionável", async () => {
    render(
      <DetalhePaciente
        leitoId="SYNTH-LEITO-01"
        cliente={clienteQueEntrega(leito())}
        aoVoltar={() => {}}
        intervaloRecargaMs={null}
      />,
    );

    const selo = await screen.findByTestId("modo-despacho");
    expect(selo.getAttribute("data-acionavel")).toBe("false");
    expect(selo.getAttribute("data-modo-despacho")).toBe("sombra");
    expect(selo.textContent ?? "").toContain(ROTULO_SOMBRA_DO_SERVIDOR);
  });

  it("recusa do servidor exibe a MENSAGEM de recusa dele, não uma redigida aqui", async () => {
    const recusado: ModoDeDespachoAvaliacao = {
      ...despachoSombra(),
      desfecho: "nao_avaliada",
      modo: null,
      rotuloPt: "NÃO AVALIADO — rótulo pt-BR emitido pelo servidor.",
      motivoRecusa: "bundle_nao_verificado",
      mensagemRecusaPt: "SYNTH — assinatura do artefato de regra não pôde ser verificada.",
    };
    const item = leito({
      modoAvaliacao: recusado,
      avaliacao: { ...leito().avaliacao!, despacho: recusado },
    });

    render(
      <DetalhePaciente
        leitoId="SYNTH-LEITO-01"
        cliente={clienteQueEntrega(item)}
        aoVoltar={() => {}}
        intervaloRecargaMs={null}
      />,
    );

    const selo = await screen.findByTestId("modo-despacho");
    expect(selo.getAttribute("data-acionavel")).toBe("false");
    expect(selo.getAttribute("data-motivo-recusa")).toBe("bundle_nao_verificado");
    expect(selo.textContent ?? "").toContain(
      "SYNTH — assinatura do artefato de regra não pôde ser verificada.",
    );
  });

  it("modo ausente ⇒ a tela de detalhe declara 'não registrado' e NÃO acionável", async () => {
    const item = leito({
      modoAvaliacao: null,
      avaliacao: { ...leito().avaliacao!, despacho: null },
    });

    render(
      <DetalhePaciente
        leitoId="SYNTH-LEITO-01"
        cliente={clienteQueEntrega(item)}
        aoVoltar={() => {}}
        intervaloRecargaMs={null}
      />,
    );

    const selo = await screen.findByTestId("modo-despacho");
    await waitFor(() => {
      expect(selo.getAttribute("data-situacao-despacho")).toBe("nao_registrado");
    });
    expect(selo.getAttribute("data-acionavel")).toBe("false");
    expect(selo.textContent ?? "").toMatch(/não registrado/i);
  });
});
