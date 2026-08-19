/**
 * apps/web/src/domain/modoDespacho.test.ts
 *
 * LAC-L2, lado frontend. O backend PUBLICA o modo de despacho
 * (`ModoDeDespachoAvaliacao`, `packages/contratos/src/index.ts`) e, até esta
 * mudança, o cliente o DESCARTAVA — medido com
 * `grep -rn "modoAvaliacao|acionavel|rotuloPt|ModoDeDespachoAvaliacao" apps/web/src`,
 * que devolvia ZERO ocorrências. QAS-0023 exige contagem zero de degradação
 * sem representação visível; com o campo descartado, a contagem era ≥ 1.
 *
 * O QUE ESTA SUÍTE PROVA, e o que ela deliberadamente NÃO prova:
 *
 *   - PROVA que a classificação só sabe REBAIXAR. Nenhum caminho aqui promove
 *     nada a acionável: `acionavel` continua sendo derivado no backend
 *     (ADR-0011 P7; ADR-0021 F3). O que o frontend faz é recusar-se a tratar
 *     como acionável aquilo que o servidor não declarou de forma sustentada.
 *   - PROVA o caminho `null`/ausente ⇒ NÃO acionável, que o contrato exige
 *     literalmente (`index.ts:260-267`).
 *   - NÃO prova autenticidade: o frontend não verifica assinatura de bundle.
 *     Um envelope forjado COERENTE seria aceito como o servidor o entregou —
 *     essa defesa é do backend (ACH-REV8-3) e continua sendo dele.
 *
 * Rastreio: ADR-0011 P7, ADR-0021 F1/F3, QAS-0023, ADR-0008 N3, HAZ-0005.
 */
import type { ModoDeDespachoAvaliacao } from "@intensicare/contratos";
import { describe, expect, it } from "vitest";
import { ehDespachoAcionavel, situacaoDeDespacho } from "./clinico.js";
import { textoModoDespacho } from "./linguagem.js";

/**
 * Rótulos pt-BR do SERVIDOR, transcritos de
 * `apps/api/src/regras/tipos.ts:95-100` (`ROTULO_SOMBRA_PT` /
 * `ROTULO_NAO_AVALIADO_PT`). Transcritos, e não redigidos: o frontend não é
 * autor deste texto e não pode divergir dele (ADR-0008 N3).
 */
const ROTULO_SOMBRA_DO_SERVIDOR =
  "SOMBRA — avaliação consultiva sobre dados sintéticos, NÃO acionável: " +
  "nenhuma recomendação, ordem ou conduta clínica decorre deste resultado.";

const ROTULO_NAO_AVALIADO_DO_SERVIDOR =
  "NÃO AVALIADO — nenhuma avaliação clínica foi produzida; " +
  "a ausência de resultado não é ausência de risco.";

const BUNDLE_SINTETICO = {
  versaoBundle: "SYNTH-BUNDLE-0.0.1",
  digestManifesto: "SYNTH-DIGEST",
  behaviorHash: "SYNTH-HASH",
  assinatura: "assinatura_verificada",
  bloqueiosDeAtivacao: [],
  ativoDesde: "2026-08-01T00:00:00.000Z",
} as const;

/** Envelope LEGÍTIMO tal como a API o emite hoje: avaliada, sombra, não acionável. */
function envelopeSombra(): ModoDeDespachoAvaliacao {
  return {
    desfecho: "avaliada",
    modo: "sombra",
    acionavel: false,
    rotuloPt: ROTULO_SOMBRA_DO_SERVIDOR,
    motivoRecusa: null,
    mensagemRecusaPt: null,
    versaoRegra: "RULE-NEWS2@0.2.0",
    despachadoEm: "2026-08-17T10:00:00.000Z",
    bundle: BUNDLE_SINTETICO,
  };
}

/** Envelope LEGÍTIMO de recusa: nenhuma avaliação foi produzida. */
function envelopeRecusado(): ModoDeDespachoAvaliacao {
  return {
    desfecho: "nao_avaliada",
    modo: null,
    acionavel: false,
    rotuloPt: ROTULO_NAO_AVALIADO_DO_SERVIDOR,
    motivoRecusa: "bundle_nao_verificado",
    mensagemRecusaPt: "SYNTH — texto de recusa redigido pelo servidor.",
    versaoRegra: "RULE-NEWS2@0.2.0",
    despachadoEm: "2026-08-17T10:00:00.000Z",
    bundle: { ...BUNDLE_SINTETICO, assinatura: "assinatura_ausente" },
  };
}

describe("situacaoDeDespacho — fail-closed do envelope de modo de despacho", () => {
  it("envelope AUSENTE (undefined) ⇒ não registrado, e NÃO acionável", () => {
    expect(situacaoDeDespacho(undefined)).toBe("nao_registrado");
    expect(ehDespachoAcionavel(undefined)).toBe(false);
  });

  it("envelope `null` ⇒ não registrado, e NÃO acionável (contrato §index.ts:260-267)", () => {
    expect(situacaoDeDespacho(null)).toBe("nao_registrado");
    expect(ehDespachoAcionavel(null)).toBe(false);
  });

  it("envelope LEGÍTIMO em sombra ⇒ não acionável, com o desfecho preservado", () => {
    expect(situacaoDeDespacho(envelopeSombra())).toBe("nao_acionavel");
    expect(ehDespachoAcionavel(envelopeSombra())).toBe(false);
  });

  it("envelope LEGÍTIMO de recusa ⇒ não acionável", () => {
    expect(situacaoDeDespacho(envelopeRecusado())).toBe("nao_acionavel");
    expect(ehDespachoAcionavel(envelopeRecusado())).toBe(false);
  });

  /*
    ÂNCORA DE NÃO-VACUIDADE. Sem este caso, todos os testes acima passariam
    numa implementação que devolvesse "nao_acionavel" para tudo. O caminho
    LEGÍTIMO acionável produz um valor DIFERENTE — e é o único que o produz.
  */
  it("envelope COERENTEMENTE acionável ⇒ acionável (prova que a função não é constante)", () => {
    const coerente: ModoDeDespachoAvaliacao = {
      ...envelopeSombra(),
      modo: "acionavel",
      acionavel: true,
    };
    expect(situacaoDeDespacho(coerente)).toBe("acionavel");
    expect(ehDespachoAcionavel(coerente)).toBe(true);
  });

  /*
    MUTAÇÃO DA VIZINHA. `acionavel: true` com `modo: "sombra"` é a forma exata
    do registro FABRICADO que `DespachoIncoerenteError`
    (`apps/api/src/regras/exposicao.ts`) rejeita no backend. Se ele atravessar
    a fronteira HTTP — payload forjado, intermediário comprometido, gravação
    antiga —, o frontend NÃO pode renderizá-lo como acionável.
  */
  it("FORJADO: acionavel=true com modo 'sombra' ⇒ incoerente, jamais acionável", () => {
    const forjado: ModoDeDespachoAvaliacao = { ...envelopeSombra(), acionavel: true };
    expect(situacaoDeDespacho(forjado)).toBe("incoerente");
    expect(ehDespachoAcionavel(forjado)).toBe(false);
  });

  it("FORJADO: acionavel=true sobre uma RECUSA ⇒ incoerente, jamais acionável", () => {
    const forjado: ModoDeDespachoAvaliacao = { ...envelopeRecusado(), acionavel: true };
    expect(situacaoDeDespacho(forjado)).toBe("incoerente");
    expect(ehDespachoAcionavel(forjado)).toBe(false);
  });

  it("FORJADO: acionavel=true sem modo algum ⇒ incoerente, jamais acionável", () => {
    const forjado: ModoDeDespachoAvaliacao = {
      ...envelopeSombra(),
      modo: null,
      acionavel: true,
    };
    expect(situacaoDeDespacho(forjado)).toBe("incoerente");
    expect(ehDespachoAcionavel(forjado)).toBe(false);
  });

  it("envelope 'avaliada' SEM modo de ativação ⇒ incoerente (o contrato liga modo nulo à recusa)", () => {
    const semModo: ModoDeDespachoAvaliacao = { ...envelopeSombra(), modo: null };
    expect(situacaoDeDespacho(semModo)).toBe("incoerente");
    expect(ehDespachoAcionavel(semModo)).toBe(false);
  });

  it("envelope sem rótulo do servidor ⇒ incoerente: não há texto visível a exibir", () => {
    const semRotulo: ModoDeDespachoAvaliacao = { ...envelopeSombra(), rotuloPt: "   " };
    expect(situacaoDeDespacho(semRotulo)).toBe("incoerente");
    expect(ehDespachoAcionavel(semRotulo)).toBe(false);
  });

  it("desfecho fora do vocabulário fechado ⇒ incoerente (nunca descartado em silêncio)", () => {
    const desconhecido = {
      ...envelopeSombra(),
      desfecho: "avaliada_parcialmente",
    } as unknown as ModoDeDespachoAvaliacao;
    expect(situacaoDeDespacho(desconhecido)).toBe("incoerente");
    expect(ehDespachoAcionavel(desconhecido)).toBe(false);
  });
});

describe("textoModoDespacho — o texto do servidor é do servidor (ADR-0008 N3)", () => {
  it("situação declarada pelo servidor exibe o rótulo dele VERBATIM", () => {
    const { texto } = textoModoDespacho("nao_acionavel", ROTULO_SOMBRA_DO_SERVIDOR);
    expect(texto).toBe(ROTULO_SOMBRA_DO_SERVIDOR);
  });

  it("recusa exibe o rótulo de recusa do servidor VERBATIM", () => {
    const { texto } = textoModoDespacho("nao_acionavel", ROTULO_NAO_AVALIADO_DO_SERVIDOR);
    expect(texto).toBe(ROTULO_NAO_AVALIADO_DO_SERVIDOR);
  });

  it("ausência de registro produz frase do FRONTEND — porque não há texto do servidor", () => {
    const { texto, tom } = textoModoDespacho("nao_registrado", null);
    expect(texto).toMatch(/não registrado/i);
    expect(texto).toMatch(/não acionável/i);
    // Nunca o tom de "sem problema": estado fail-closed (ADR-0029 P1).
    expect(tom).toBe("inconclusivo");
  });

  it("incoerência produz frase do FRONTEND e NUNCA repete a alegação não sustentada", () => {
    const { texto, tom } = textoModoDespacho("incoerente", ROTULO_SOMBRA_DO_SERVIDOR);
    expect(texto).toMatch(/não acionável/i);
    expect(texto).not.toBe(ROTULO_SOMBRA_DO_SERVIDOR);
    expect(tom).toBe("inconclusivo");
  });

  it("situação declarada SEM rótulo do servidor cai no texto fail-closed, nunca em vazio", () => {
    const { texto } = textoModoDespacho("nao_acionavel", null);
    expect(texto.trim().length).toBeGreaterThan(0);
    expect(texto).toMatch(/não acionável/i);
  });

  it("nenhuma situação produz tom positivo — nada aqui é 'está tudo bem'", () => {
    for (const situacao of [
      "nao_registrado",
      "incoerente",
      "nao_acionavel",
      "acionavel",
    ] as const) {
      const { tom } = textoModoDespacho(situacao, ROTULO_SOMBRA_DO_SERVIDOR);
      expect(tom, `situação ${situacao} recebeu tom positivo`).not.toBe("positivo");
    }
  });

  it("situação fora do union LANÇA — nenhum caso silencioso (casoImpossivel)", () => {
    expect(() => textoModoDespacho("acionavel_por_omissao" as never, null)).toThrowError(
      /textoModoDespacho/,
    );
  });
});
