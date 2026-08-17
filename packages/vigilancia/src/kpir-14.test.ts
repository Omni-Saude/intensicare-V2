import { describe, expect, it } from "vitest";
import { episodioSintetico, utcLocal } from "./apoio-de-teste.js";
import {
  calcularKpir14,
  deduplicacaoPorJanela,
  type EpisodioDeUti,
  formatarVariante,
  MARCACAO_DE_MISSAO,
  NOTA_DE_HONESTIDADE,
  RECONHECIMENTO_DE_MONITORIZACAO,
  SEM_DEDUPLICACAO,
  SUBDECISOES_ABERTAS,
  type SubDecisoesKpir14,
  TRATAMENTOS_DE_TRANSFERENCIA,
  VARIANTES_MINIMAS,
} from "./kpir-14.js";
import { criarJanela } from "./tipos.js";

const PERIODO = criarJanela(utcLocal("2026-08-01", 0), utcLocal("2026-09-01", 0));

/**
 * Executa e devolve o erro lançado; FALHA se nada for lançado.
 *
 * Existe para que classe E mensagem sejam asseridas sobre o MESMO erro. Duas
 * chamadas `.toThrow(Classe)` + `.toThrow(/regex/)` invocam a função duas
 * vezes e, a rigor, não provam que foi um único erro a satisfazer as duas.
 */
function capturarErro(executar: () => unknown): unknown {
  try {
    executar();
  } catch (erro) {
    return erro;
  }
  throw new Error("a chamada NÃO lançou — a recusa sob teste não foi exercida");
}

/** 4 altas vivas, 2 óbitos, 2 transferências, 1 disposição ausente, 1 âncora administrativa. */
function coorteSintetica(): readonly EpisodioDeUti[] {
  return [
    ...[1, 2, 3, 4].map((n) =>
      episodioSintetico({
        id: `SYNTH-EP-VIVO-${n}`,
        admissaoUtc: utcLocal("2026-08-02", 8),
        altaUtc: utcLocal("2026-08-10", 10),
        disposicao: { tipo: "vivo" },
      }),
    ),
    ...[1, 2].map((n) =>
      episodioSintetico({
        id: `SYNTH-EP-OBITO-${n}`,
        admissaoUtc: utcLocal("2026-08-02", 8),
        altaUtc: utcLocal("2026-08-11", 10),
        disposicao: { tipo: "obito" },
      }),
    ),
    ...[1, 2].map((n) =>
      episodioSintetico({
        id: `SYNTH-EP-TRANSF-${n}`,
        admissaoUtc: utcLocal("2026-08-02", 8),
        altaUtc: utcLocal("2026-08-12", 10),
        disposicao: { tipo: "transferencia_para_outra_uti", intraFacilidade: n === 1 },
      }),
    ),
    episodioSintetico({
      id: "SYNTH-EP-SEM-DISPOSICAO",
      admissaoUtc: utcLocal("2026-08-02", 8),
      altaUtc: utcLocal("2026-08-13", 10),
      disposicao: { tipo: "ausente", motivo: "fonte-nao-registra-disposicao" },
    }),
    episodioSintetico({
      id: "SYNTH-EP-ANCORA-ADMINISTRATIVA",
      admissaoUtc: utcLocal("2026-08-02", 8),
      altaUtc: utcLocal("2026-08-14", 10),
      origem: "faturamento",
      disposicao: { tipo: "vivo" },
    }),
  ];
}

function abrir(resultado: ReturnType<typeof calcularKpir14>, indice: number) {
  const variante = resultado.variantes[indice];
  if (variante === undefined) throw new Error(`variante ${indice} ausente`);
  return variante.abrir(RECONHECIMENTO_DE_MONITORIZACAO);
}

describe("KPIR-14 — as duas sub-decisões abertas NUNCA são escolhidas em silêncio", () => {
  it("recusa computar sem variante declarada", () => {
    expect(() =>
      calcularKpir14({ periodo: PERIODO, episodios: coorteSintetica(), variantes: [] }),
    ).toThrow(/sem variante declarada/);
  });

  it("expõe uma variante por combinação declarada, sem figura de cabeçalho", () => {
    const resultado = calcularKpir14({
      periodo: PERIODO,
      episodios: coorteSintetica(),
      variantes: VARIANTES_MINIMAS,
    });
    expect(resultado.variantes).toHaveLength(3);
    expect(resultado.variantes.map((v) => v.subDecisoes.transferencia)).toEqual([
      ...TRATAMENTOS_DE_TRANSFERENCIA,
    ]);
    // Não existe "o número": o resultado não tem contagem agregada nenhuma.
    expect(Object.keys(resultado)).toEqual([
      "marcacao",
      "notaDeHonestidade",
      "periodo",
      "subDecisoesAbertas",
      "variantes",
      "nota",
    ]);
    expect(resultado.subDecisoesAbertas).toEqual(SUBDECISOES_ABERTAS);
    expect(resultado.subDecisoesAbertas.every((s) => s.estado.startsWith("ABERTA"))).toBe(true);
  });

  it("as três opções de transferência produzem contagens DIFERENTES — por isso não há default", () => {
    const resultado = calcularKpir14({
      periodo: PERIODO,
      episodios: coorteSintetica(),
      variantes: VARIANTES_MINIMAS,
    });
    const [contaComoViva, excluida, categoriaPropria] = [0, 1, 2].map((i) => abrir(resultado, i));

    expect(contaComoViva.altasVivas).toBe(6); // 4 vivos + 2 transferências
    expect(contaComoViva.obitos).toBe(2);
    expect(contaComoViva.altasTotais).toBe(8);

    expect(excluida.altasVivas).toBe(4);
    expect(excluida.obitos).toBe(2);
    expect(excluida.altasTotais).toBe(6);

    expect(categoriaPropria.altasVivas).toBe(4);
    expect(categoriaPropria.obitos).toBe(2);
    expect(categoriaPropria.transferenciasComoCategoriaPropria).toBe(2);
    expect(categoriaPropria.altasTotais).toBe(8);
  });

  it("a janela de de-duplicação muda a contagem e declara sua não ratificação", () => {
    const paciente = "amh:psr:v1:SYNTH-READMITIDO";
    const episodios: readonly EpisodioDeUti[] = [
      episodioSintetico({
        id: "SYNTH-EP-A",
        pacienteRef: paciente,
        admissaoUtc: utcLocal("2026-08-02", 8),
        altaUtc: utcLocal("2026-08-05", 10),
      }),
      episodioSintetico({
        id: "SYNTH-EP-B",
        pacienteRef: paciente,
        admissaoUtc: utcLocal("2026-08-05", 20),
        altaUtc: utcLocal("2026-08-09", 10),
      }),
    ];
    const variantes: readonly SubDecisoesKpir14[] = [
      { transferencia: "categoria_propria", readmissao: SEM_DEDUPLICACAO },
      { transferencia: "categoria_propria", readmissao: deduplicacaoPorJanela(48) },
    ];
    const resultado = calcularKpir14({ periodo: PERIODO, episodios, variantes });

    // Sem de-duplicação, o MESMO paciente conta duas vezes — a ameaça registrada.
    expect(abrir(resultado, 0).altasVivas).toBe(2);
    // Com janela de 48 h, a primeira alta é ligada ao episódio seguinte.
    expect(abrir(resultado, 1).altasVivas).toBe(1);
    expect(abrir(resultado, 1).completude.motivosDeExclusao).toContainEqual({
      chave: "readmissao-deduplicada-por-sub-decisao-declarada",
      contagem: 1,
    });

    const readmissao = resultado.variantes[1]?.subDecisoes.readmissao;
    expect(readmissao?.modo).toBe("deduplicacao_por_janela");
    if (readmissao?.modo === "deduplicacao_por_janela") {
      expect(readmissao.proveniencia).toBe("janela-de-deduplicacao-nao-ratificada-AUTH-CLINSAFETY");
    }
  });

  it("recusa janela de de-duplicação não positiva", () => {
    // `.toThrow()` SEM tipo aceitava qualquer erro: um `TypeError` por argumento
    // malformado, ou um erro incidental de outra camada, produzia exatamente o
    // mesmo verde que a recusa sob teste. Aqui o conteúdo importa — KPIR-14 é o
    // indicador K-8, e uma sub-decisão de de-duplicação aceita por engano
    // falsifica o número que sai.
    //
    // `kpir-14.ts` (guarda `!(janelaHoras > 0) || !Number.isFinite(janelaHoras)`)
    // lança `RangeError` com o valor recusado na mensagem. Asserir o VALOR é o
    // que distingue os dois casos: eles exercitam cláusulas diferentes da
    // guarda e, sem isso, as duas asserções seriam literalmente a mesma.
    const naoPositiva = capturarErro(() => deduplicacaoPorJanela(0));
    expect(naoPositiva).toBeInstanceOf(RangeError);
    expect((naoPositiva as Error).message).toMatch(
      /janela de de-duplicação deve ser > 0 horas: 0$/,
    );

    const naoFinita = capturarErro(() => deduplicacaoPorJanela(Number.POSITIVE_INFINITY));
    expect(naoFinita).toBeInstanceOf(RangeError);
    expect((naoFinita as Error).message).toMatch(
      /janela de de-duplicação deve ser > 0 horas: Infinity$/,
    );
  });
});

describe("KPIR-14 — o número não sai sem as figuras companheiras", () => {
  const resultado = calcularKpir14({
    periodo: PERIODO,
    episodios: coorteSintetica(),
    variantes: [{ transferencia: "categoria_propria", readmissao: SEM_DEDUPLICACAO }],
  });

  it("nenhuma contagem é propriedade legível da variante", () => {
    const variante = resultado.variantes[0];
    expect(variante).toBeDefined();
    const chaves = Object.keys(variante as object);
    expect(chaves).not.toContain("altasVivas");
    expect(chaves).not.toContain("contagens");
    expect(chaves).not.toContain("completude");
    // Serializar a variante não vaza contagem nenhuma (campo privado não enumera).
    const serializado = JSON.parse(JSON.stringify(variante)) as Record<string, unknown>;
    expect(serializado.altasVivas).toBeUndefined();
    expect(JSON.stringify(variante)).not.toContain("altasVivas");
  });

  it("abrir() devolve a tríade E o DC(KPIR-14) na MESMA chamada", () => {
    const aberta = abrir(resultado, 0);
    expect(aberta.altasVivas).toBe(4);
    expect(aberta.altasTotais).toBe(8);
    expect(aberta.obitos).toBe(2);
    expect(aberta.completude.elegiveis).toBe(10);
    expect(aberta.completude.computaveis).toBe(8);
    expect(aberta.completude.motivosDeExclusao).toEqual([
      { chave: "ancora-de-alta-nao-documentada:faturamento", contagem: 1 },
      { chave: "disposicao-ausente:fonte-nao-registra-disposicao", contagem: 1 },
    ]);
    expect(aberta.completude.pisoDeCompletude).toBe("NAO_RATIFICADO_AUTH_CLINSAFETY");
    expect(aberta.invarianteDeTriade).toBe(true);
  });

  it("ler exige assinar a marcação de monitorização de missão", () => {
    const variante = resultado.variantes[0];
    expect(variante).toBeDefined();
    expect(() =>
      // Simula um chamador que contorna o tipo para pegar "o número solto".
      (variante as unknown as { abrir: (r: string) => unknown }).abrir("só me dá o número"),
    ).toThrow(/monitorização de missão/);
  });

  it("carrega a marcação e a nota de honestidade literais da definição", () => {
    const aberta = abrir(resultado, 0);
    expect(aberta.marcacao).toBe(MARCACAO_DE_MISSAO);
    expect(aberta.marcacao).toContain("NAO E ESTIMATIVA DE EFEITO");
    expect(aberta.marcacao).toContain("NAO E ATRIBUICAO CAUSAL AO SISTEMA");
    expect(aberta.notaDeHonestidade).toBe(NOTA_DE_HONESTIDADE);
    expect(NOTA_DE_HONESTIDADE).toBe(
      "contagem de altas vivas — não é atribuição causal de vidas salvas pelo sistema",
    );
    expect(resultado.nota).toContain("Não é taxa, proporção");
  });

  it("as duas sub-decisões abertas viajam com o número", () => {
    const aberta = abrir(resultado, 0);
    expect(aberta.avisosDeSubDecisaoAberta).toHaveLength(2);
    expect(aberta.avisosDeSubDecisaoAberta.join(" ")).toContain("transfer-out gaming");
    expect(aberta.avisosDeSubDecisaoAberta.join(" ")).toContain("dupla contagem por readmissão");
  });

  it("quebra por unidade traz o próprio DC, com balde de unidade não atribuída", () => {
    const semUnidade = calcularKpir14({
      periodo: PERIODO,
      episodios: [
        episodioSintetico({
          id: "SYNTH-EP-SEM-UNIDADE",
          unidadeId: null,
          admissaoUtc: utcLocal("2026-08-02", 8),
          altaUtc: utcLocal("2026-08-10", 10),
        }),
      ],
      variantes: [{ transferencia: "categoria_propria", readmissao: SEM_DEDUPLICACAO }],
    });
    const aberta = abrir(semUnidade, 0);
    expect(aberta.porUnidade).toHaveLength(1);
    expect(aberta.porUnidade[0]?.unidade).toBe("unidade-nao-atribuida");
    expect(aberta.porUnidade[0]?.altasVivas).toBe(1);
    expect(aberta.porUnidade[0]?.completude.fracaoComputavel).toBe(1);
  });
});

describe("KPIR-14 — nenhum episódio é defaultado para vivo ou morto", () => {
  it("disposição ausente/inválida e âncora não documentada saem da contagem, com motivo", () => {
    const resultado = calcularKpir14({
      periodo: PERIODO,
      episodios: [
        episodioSintetico({
          id: "SYNTH-EP-1",
          altaUtc: utcLocal("2026-08-10", 10),
          disposicao: { tipo: "ausente", motivo: "campo-inexistente" },
        }),
        episodioSintetico({
          id: "SYNTH-EP-2",
          altaUtc: utcLocal("2026-08-10", 10),
          disposicao: { tipo: "invalida", motivo: "codigo-desconhecido" },
        }),
        episodioSintetico({
          id: "SYNTH-EP-3",
          altaUtc: utcLocal("2026-08-10", 10),
          origem: "gestao-de-leitos",
        }),
        episodioSintetico({ id: "SYNTH-EP-4" }),
      ],
      variantes: [{ transferencia: "categoria_propria", readmissao: SEM_DEDUPLICACAO }],
    });
    const aberta = abrir(resultado, 0);
    expect(aberta.altasVivas).toBe(0);
    expect(aberta.obitos).toBe(0);
    expect(aberta.altasTotais).toBe(0);
    expect(aberta.completude.elegiveis).toBe(4);
    expect(aberta.completude.computaveis).toBe(0);
    expect(aberta.completude.fracaoComputavel).toBe(0);
    expect(aberta.completude.motivosDeExclusao.map((m) => m.chave)).toEqual([
      "ancora-de-alta-ausente:sem-alta-registrada",
      "ancora-de-alta-nao-documentada:gestao-de-leitos",
      "disposicao-ausente:campo-inexistente",
      "disposicao-invalida:codigo-desconhecido",
    ]);
  });

  it("sem episódio elegível a fração é null — nunca 0%, nunca 100%", () => {
    const resultado = calcularKpir14({
      periodo: PERIODO,
      episodios: [],
      variantes: VARIANTES_MINIMAS,
    });
    expect(abrir(resultado, 0).completude.fracaoComputavel).toBeNull();
  });
});

describe("formatarVariante — igual proeminência é o único formato produzido", () => {
  it("emite as três contagens, o DC e as sub-decisões abertas num só bloco", () => {
    const resultado = calcularKpir14({
      periodo: PERIODO,
      episodios: coorteSintetica(),
      variantes: [{ transferencia: "categoria_propria", readmissao: SEM_DEDUPLICACAO }],
    });
    const variante = resultado.variantes[0];
    expect(variante).toBeDefined();
    const bloco = formatarVariante(
      variante as NonNullable<typeof variante>,
      RECONHECIMENTO_DE_MONITORIZACAO,
    );
    expect(bloco).toContain("Altas vivas: 4");
    expect(bloco).toContain("Altas totais no período (figura companheira 1): 8");
    expect(bloco).toContain("Óbitos no período (figura companheira 2): 2");
    expect(bloco).toContain("DC(KPIR-14): 2 de 10 episódios elegíveis excluídos");
    expect(bloco).toContain(NOTA_DE_HONESTIDADE);
    expect(bloco).toContain("Sub-decisões ABERTAS divulgadas com o número");
  });
});
