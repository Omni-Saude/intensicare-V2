// @vitest-environment node
// Este arquivo não toca DOM em NENHUM módulo do seu grafo (verificado). Em
// jsdom ele custava a construção de um ambiente inteiro sem usá-lo — ver a
// nota "CUSTO DE AMBIENTE" em `apps/web/vitest.config.ts`.
/**
 * apps/web/src/domain/vocabularioDeBanda.test.ts
 *
 * O DEFEITO QUE ESTE ARQUIVO FIXA (e que existia em HEAD 1eda4f1).
 *
 * O contrato ancora a banda `alerta` ao tier *medium* do NEWS2 (RCP 2017
 * Chart 2) — `packages/contratos/src/index.ts:207-213`, verbatim: `normal ↔
 * low`; `atencao ↔ low_medium` (parâmetro vermelho isolado); `alerta ↔
 * medium`; `critico ↔ high`. A web, porém, tinha vocabulário próprio
 * (`baixo/medio/alto/critico`) e `api/clienteHttp.ts` traduzia `alerta → alto`
 * antes de exibir. O clínico à beira do leito lia **um nível acima** do que a
 * regra havia dito, e nenhum teste reprovava — o teste existente
 * (`api/clienteHttp.test.ts:33`) FIXAVA a tradução como comportamento
 * esperado.
 *
 * `docs/10-ux-and-accessibility/tabela-contrato-ui-backend.md:102` já
 * registrava a divergência (item 3) e proíbe tradução manual por tela.
 *
 * O QUE ESTE ARQUIVO AFIRMA, e por que nesta forma:
 *
 *   1. **nenhuma banda do contrato é renomeada no caminho de exibição** —
 *      medido de ponta a ponta pelos mapeadores reais do cliente HTTP, não
 *      por inspeção de uma função de tradução (que não deve mais existir);
 *   2. **o rótulo em tela NOMEIA a banda que o backend emitiu** — e a própria
 *      regra é exercida contra os rótulos ANTIGOS, para que o teste não possa
 *      passar por vacuidade (ver "âncora de não-vacuidade" abaixo);
 *   3. **renomear identificador não re-nivela severidade** — o tom de cada
 *      banda do contrato é congelado no valor OBSERVADO antes da mudança, e a
 *      ordem entre bandas é estritamente crescente;
 *   4. **a função de tradução sumiu do código**, não apenas do caminho feliz.
 *
 * Rastreio: ADR-0021 F1 (o identificador é do backend; o texto é do
 * frontend), ADR-0021 F3 (nunca promove/rebaixa severidade), ADR-0011 P7 (o
 * cliente não deriva banda), ADR-0029 C2 (ABERTA — a redação segue
 * provisória), HAZ-0005.
 */
import type {
  BandaRisco as BandaRiscoContrato,
  EntradaGradeLeitos,
  ItemTrabalho,
  ResultadoAvaliacao,
} from "@intensicare/contratos";
import { describe, expect, it } from "vitest";
import * as moduloClienteHttp from "../api/clienteHttp.js";
import { mapearAvaliacao, mapearEntradaGrade, mapearItemTrabalho } from "../api/clienteHttp.js";
import type { BandaRisco, Tom } from "./estados.js";
import { textoBandaRisco } from "./linguagem.js";

/**
 * Exaustividade em TEMPO DE COMPILAÇÃO: `Record<BandaRiscoContrato, true>`
 * falha o `tsc` se uma banda do contrato faltar OU se sobrar uma que o
 * contrato não declara. Uma lista literal não daria essa garantia.
 */
const BANDAS_DO_CONTRATO: Record<BandaRiscoContrato, true> = {
  normal: true,
  atencao: true,
  alerta: true,
  critico: true,
};

/**
 * A MESMA prova, do outro lado da fronteira. Se a união da UI voltar a
 * divergir do contrato, este objeto deixa de compilar — e, em execução, o
 * conjunto de chaves diverge do de cima.
 */
const BANDAS_DA_UI: Record<BandaRisco, true> = {
  normal: true,
  atencao: true,
  alerta: true,
  critico: true,
};

const TODAS_AS_BANDAS = Object.keys(BANDAS_DO_CONTRATO) as BandaRiscoContrato[];

/** Ordem de severidade DECLARADA pelo contrato (low → high). */
const ORDEM_DAS_BANDAS: BandaRiscoContrato[] = ["normal", "atencao", "alerta", "critico"];

/**
 * Tom OBSERVADO por banda do contrato ANTES desta mudança, em HEAD 1eda4f1,
 * pela composição `mapearBanda` → `textoBandaRisco`:
 * `normal→baixo→positivo`, `atencao→medio→atencao`, `alerta→alto→alerta`,
 * `critico→critico→critico`.
 *
 * ESTE MAPA É UMA TRAVA, NÃO UMA PREFERÊNCIA. Trocar o nome do identificador
 * não pode alterar o quanto a tela grita: dar tom de severidade alta a uma
 * banda média recriaria, na camada de tom, exatamente o defeito que a
 * renomeação corrigiu na camada de texto (ADR-0021 F3).
 */
const TOM_ESPERADO_POR_BANDA: Record<BandaRiscoContrato, Tom> = {
  normal: "positivo",
  atencao: "atencao",
  alerta: "alerta",
  critico: "critico",
};

/** Escada de severidade dos tons de fato usados por banda. */
const ESCADA_DE_TOM: Tom[] = ["positivo", "atencao", "alerta", "critico"];

function semAcento(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/**
 * O rótulo exibido NOMEIA a banda que o backend emitiu — e só ela.
 *
 * Duas condições, ambas necessárias: o rótulo contém a palavra da própria
 * banda (o que reprova "Risco alto" para `alerta`) e não contém a palavra de
 * nenhuma outra (o que reprova um rótulo que mistura duas bandas).
 */
function rotuloNomeiaABanda(banda: BandaRiscoContrato, rotulo: string): boolean {
  const alvo = semAcento(rotulo);
  if (!alvo.includes(semAcento(banda))) return false;
  return TODAS_AS_BANDAS.filter((outra) => outra !== banda).every(
    (outra) => !alvo.includes(semAcento(outra)),
  );
}

function avaliacaoComBanda(banda: BandaRiscoContrato | null): ResultadoAvaliacao {
  return {
    status: banda === null ? "indisponivel" : "valido",
    parametrosAusentes: [],
    parametros: [],
    escore: banda === null ? null : 5,
    banda,
    avaliadoEm: "2026-08-18T12:00:00.000Z",
    motivos: [],
    anotacoes: [],
    explicacao: "SYNTH — vetor de teste de vocabulário de banda.",
    parametroVermelho: false,
    versaoRegra: "RULE-NEWS2@0.2.0",
  };
}

function entradaComBanda(banda: BandaRiscoContrato | null): EntradaGradeLeitos {
  return {
    leitoId: "SYNTH-LEITO-01",
    encontroId: "SYNTH-ENC-01",
    pacienteRef: "amh:psr:v1:SYNTH-P001",
    escore: banda === null ? null : 5,
    banda,
    statusAvaliacao: banda === null ? "indisponivel" : "valido",
    frescor: "atual",
    atualizadoEm: "2026-08-18T12:00:00.000Z",
    alerta: { id: "SYNTH-ALERTA-0001", estado: "nao-atribuido", versao: 0 },
  };
}

function itemComBanda(banda: BandaRiscoContrato): ItemTrabalho {
  return {
    id: "SYNTH-ALERTA-0001",
    tenantId: "SYNTH-TENANT-G7",
    encontroId: "SYNTH-ENC-01",
    leitoId: "SYNTH-LEITO-01",
    pacienteRef: "amh:psr:v1:SYNTH-P001",
    escore: 5,
    banda,
    motivo: "SYNTH — motivo do item de trabalho.",
    criadoEm: "2026-08-18T12:00:00.000Z",
    atualizadoEm: "2026-08-18T12:00:00.000Z",
    estado: "nao-atribuido",
    versao: 0,
  };
}

describe("vocabulário de banda: o contrato manda, a tela não renomeia", () => {
  it("âncora de não-vacuidade: a regra REPROVA os rótulos que o produto exibia antes", () => {
    // Sem estas quatro linhas, `rotuloNomeiaABanda` poderia degenerar em
    // "devolve true sempre" e todo o resto do arquivo ficaria verde sem medir
    // nada. Os três primeiros pares são exatamente o que a tela mostrava.
    expect(rotuloNomeiaABanda("alerta", "Risco alto")).toBe(false);
    expect(rotuloNomeiaABanda("normal", "Risco baixo")).toBe(false);
    expect(rotuloNomeiaABanda("atencao", "Risco médio")).toBe(false);
    // Rótulo que nomeia DUAS bandas também é reprovado.
    expect(rotuloNomeiaABanda("alerta", "Banda de risco: alerta (quase crítico)")).toBe(false);
    // E um rótulo correto é aprovado — a regra não é "reprova tudo".
    expect(rotuloNomeiaABanda("critico", "Banda de risco: crítico")).toBe(true);
    // A normalização de acento precisa de fato normalizar.
    expect(semAcento("Crítico")).toBe("critico");
    expect(TODAS_AS_BANDAS).toHaveLength(4);
  });

  it("a união da UI é a união do contrato — mesmas quatro bandas, mesmos identificadores", () => {
    expect(Object.keys(BANDAS_DA_UI).sort()).toEqual(Object.keys(BANDAS_DO_CONTRATO).sort());
    expect(Object.keys(BANDAS_DO_CONTRATO).sort()).toEqual([
      "alerta",
      "atencao",
      "critico",
      "normal",
    ]);
  });

  it("mapearAvaliacao devolve a MESMA banda que o contrato emitiu (nenhuma tradução)", () => {
    for (const banda of TODAS_AS_BANDAS) {
      expect(mapearAvaliacao(avaliacaoComBanda(banda)).bandaRisco).toBe(banda);
    }
    expect(mapearAvaliacao(avaliacaoComBanda(null)).bandaRisco).toBeNull();
  });

  it("mapearEntradaGrade preserva a banda no resumo E na severidade do alerta", () => {
    for (const banda of TODAS_AS_BANDAS) {
      const item = mapearEntradaGrade(entradaComBanda(banda));
      expect(item.avaliacao?.bandaRisco).toBe(banda);
      expect(item.alertas[0]?.severidade).toBe(banda);
    }
    // Banda ausente permanece ausente: o cliente não deriva severidade (P7).
    const semBanda = mapearEntradaGrade(entradaComBanda(null));
    expect(semBanda.avaliacao?.bandaRisco).toBeNull();
    expect(semBanda.alertas[0]?.severidade).toBeNull();
  });

  it("mapearItemTrabalho preserva a banda do item de trabalho", () => {
    for (const banda of TODAS_AS_BANDAS) {
      expect(mapearItemTrabalho(itemComBanda(banda)).severidade).toBe(banda);
    }
  });

  it("o rótulo exibido nomeia a banda emitida — e nenhuma outra", () => {
    for (const banda of TODAS_AS_BANDAS) {
      const { texto } = textoBandaRisco(banda);
      expect(texto.length).toBeGreaterThan(0);
      expect(
        rotuloNomeiaABanda(banda, texto),
        `rótulo "${texto}" não nomeia a banda "${banda}" do contrato`,
      ).toBe(true);
    }
  });

  it("renomear identificador NÃO re-nivela severidade: o tom de cada banda é o observado antes", () => {
    for (const banda of TODAS_AS_BANDAS) {
      expect(textoBandaRisco(banda).tom, `tom da banda "${banda}"`).toBe(
        TOM_ESPERADO_POR_BANDA[banda],
      );
    }
  });

  it("o tom cresce estritamente ao longo da ordem de severidade declarada pelo contrato", () => {
    const posicoes = ORDEM_DAS_BANDAS.map((banda) =>
      ESCADA_DE_TOM.indexOf(textoBandaRisco(banda).tom),
    );
    // Guarda de não-vacuidade: nenhum tom pode estar fora da escada medida.
    expect(posicoes).not.toContain(-1);
    for (let i = 1; i < posicoes.length; i += 1) {
      const anterior = posicoes[i - 1] ?? -1;
      const atual = posicoes[i] ?? -1;
      expect(
        atual,
        `banda "${ORDEM_DAS_BANDAS[i]}" não pode ter tom menor ou igual ao de "${ORDEM_DAS_BANDAS[i - 1]}"`,
      ).toBeGreaterThan(anterior);
    }
  });

  it("P1 (ADR-0029): o rótulo da banda `normal` se declara BANDA, não estado do paciente", () => {
    // `docs/10-ux-and-accessibility/modelo-de-estados-obrigatorios.md:194`
    // registra o cuidado exigido: o termo `normal` como NOME DE BANDA nunca
    // pode colidir com a leitura de "não avaliado". O rótulo qualifica a
    // palavra; e o selo só é renderizado quando a banda existe (ver
    // `components/CartaoLeito.tsx` e `components/DetalhePaciente.tsx`, que
    // testam `bandaRisco !== null` antes de montar o selo).
    const { texto } = textoBandaRisco("normal");
    expect(semAcento(texto)).toContain("banda");
    expect(semAcento(texto)).not.toContain("sem alterac");
    expect(semAcento(texto)).not.toContain("estavel");
  });
});

describe("a tradução de banda foi APAGADA, não contornada", () => {
  /**
   * Todo fonte de `src/**` como texto. Mesmo recurso e mesmo padrão ancorado
   * na raiz de `./fronteiraDoModuloIlustrativo.test.ts` — um padrão relativo
   * faria o Vite reescrever as chaves e a varredura ficaria verde por omissão.
   */
  const FONTES = import.meta.glob<string>("/src/**/*.{ts,tsx}", {
    query: "?raw",
    import: "default",
    eager: true,
  });

  /**
   * Remove COMENTÁRIOS antes de varrer — e a distinção é o ponto.
   *
   * A primeira versão desta guarda reprovava `api/clienteHttp.ts`,
   * `domain/estados.ts` e `domain/linguagem.ts`: os três explicam, em prosa,
   * QUAL era o defeito, e para isso precisam escrever `mapearBanda` e
   * `"alto"`. Uma guarda que conta a explicação como violação é uma guarda que
   * pressiona a apagar a explicação — o mesmo raciocínio que
   * `../build/guardaArtefatoSintetico.ts` já registra sobre não proibir o
   * termo "SYNTH" genérico.
   *
   * Bloco `/* … *\/` e linha iniciada por `//` cobrem toda a prosa deste
   * repositório. Comentário de fim de linha depois de código é preservado de
   * propósito: cortá-lo exigiria distinguir `//` dentro de string, e um
   * recorte errado esconderia ocorrência REAL — falso-verde é pior aqui.
   */
  function semComentarios(fonte: string): string {
    return fonte
      .replace(/\/\*[\s\S]*?\*\//g, " ")
      .split("\n")
      .filter((linha) => !linha.trimStart().startsWith("//"))
      .join("\n");
  }

  function fontesDeProducao(): Array<[string, string]> {
    return Object.entries(FONTES)
      .filter(([caminho]) => !/\.test\.tsx?$/.test(caminho))
      .map(([caminho, conteudo]) => [caminho, semComentarios(conteudo)]);
  }

  it("o removedor de comentários corta prosa e preserva código (não-vacuidade)", () => {
    // Sem estas linhas, um `semComentarios` que devolvesse "" faria as duas
    // guardas abaixo passarem sem ter varrido nada.
    expect(semComentarios('/* fala de "alto" */ const a = 1;')).not.toContain("alto");
    expect(semComentarios("  // menciona mapearBanda\nconst b = 2;")).not.toContain("mapearBanda");
    expect(semComentarios('const c = "alto";')).toContain('"alto"');
    expect(semComentarios("export function mapearBanda() {}")).toContain("mapearBanda");
  });

  it("`mapearBanda` não é mais exportado pelo cliente HTTP", () => {
    // Não-vacuidade: o módulo foi de fato carregado e continua exportando os
    // mapeadores legítimos.
    expect(Object.keys(moduloClienteHttp)).toContain("mapearAvaliacao");
    expect(Object.keys(moduloClienteHttp)).toContain("mapearEntradaGrade");
    expect(Object.keys(moduloClienteHttp)).not.toContain("mapearBanda");
  });

  it("nenhum CÓDIGO de produção menciona `mapearBanda`", () => {
    const mencionam = fontesDeProducao()
      .filter(([, conteudo]) => conteudo.includes("mapearBanda"))
      .map(([caminho]) => caminho);

    // Guarda de não-vacuidade: a varredura precisa ter lido a árvore certa.
    expect(Object.keys(FONTES)).toContain("/src/api/clienteHttp.ts");
    expect(Object.keys(FONTES)).toContain("/src/domain/linguagem.ts");
    expect(Object.keys(FONTES).length).toBeGreaterThan(20);

    expect(mencionam, "tradução de banda ainda existe no código").toEqual([]);
  });

  it("nenhum CÓDIGO de produção usa o vocabulário antigo como valor de banda", () => {
    const antigos = ['"baixo"', '"medio"', '"alto"'];
    const violacoes: string[] = [];
    for (const [caminho, conteudo] of fontesDeProducao()) {
      for (const antigo of antigos) {
        if (conteudo.includes(antigo)) violacoes.push(`${caminho}: ${antigo}`);
      }
    }
    // Não-vacuidade: a lista de termos antigos não está vazia e a varredura viu
    // os arquivos que antes os continham.
    expect(antigos).toHaveLength(3);
    expect(fontesDeProducao().map(([caminho]) => caminho)).toContain("/src/api/fixtures.ts");
    expect(violacoes, "vocabulário de banda anterior ao contrato ainda presente").toEqual([]);
  });
});
