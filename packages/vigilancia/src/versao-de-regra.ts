/**
 * Vigilância de versão de regra — materialização instrumentada de ADR-0025
 * (aceita, GDEC-0007) na parte que é código e pode ser exercida com dados
 * sintéticos: QUAL versão avaliou O QUÊ, e alerta quando há MISTURA de
 * versões numa janela.
 *
 * O que esta vigilância NÃO é: ADR-0025 §5.3 define uma vigilância de
 * ATUALIZAÇÃO DE EDIÇÃO (monitorar RCP, JAMA/Sepsis-3, SSC/SCCM/ESICM e
 * reavaliar a edição canônica). Essa é vigilância de fonte primária publicada,
 * executada por um titular clínico com um metodologista de evidência (ambos
 * papéis hoje UNASSIGNED/não ativados) — E17 da própria ADR registra que
 * nenhuma ferramenta dessas existe no repositório. Este módulo NÃO a
 * substitui e não a fecha; ele cobre a face interna do mesmo problema:
 * verificar, sobre o que foi de fato persistido, se a identidade de versão
 * declarada é consistente.
 *
 * Os dois defeitos concretos que este módulo procura, ambos nomeados na
 * evidência da ADR-0025:
 *
 * - **E3 / SF-2 — versão que não identifica comportamento.** No V1 legado, o
 *   comportamento da Scale-2 do NEWS2 foi invertido SEM mudar a string
 *   `NEWS2-v3.0.0`. Aqui isso é detectável quando a origem registra uma
 *   impressão de conteúdo do bundle: a MESMA `ruleId@ruleVersion` com DUAS
 *   impressões diferentes é o defeito, e é reportado como
 *   `identidade-de-versao-inconsistente`.
 * - **HAZ-0020 — deriva de versão entre instâncias.** Mais de uma versão
 *   ativa na mesma janela é reportado como `mistura-de-versoes-na-janela`.
 *   Misturar versões não é, por si, um erro (uma liberação legítima produz
 *   exatamente isso); é uma condição que TORNA NÃO ATRIBUÍVEL qualquer
 *   comparação de desempenho feita sobre a janela inteira. Por isso o
 *   achado é reportado com o instante de virada, não suprimido.
 *
 * Regra fail-closed que atravessa o módulo: avaliação sem identidade de regra
 * NUNCA é atribuída à versão mais provável, à mais recente ou à única
 * presente. Ela vai para o balde `sem-identidade-de-regra`, com motivo.
 */
import {
  type AtribuicaoDeVersaoDeRegra,
  type ContagemPorChave,
  chaveDeVersao,
  contarPorChave,
  dentroDaJanela,
  type EstadoDeAvaliacao,
  type InstanteDeclarado,
  type JanelaDeVigilancia,
  MARCACAO_DE_INSTRUMENTACAO,
  type MarcacaoDeInstrumentacao,
  normalizarEstado,
} from "./tipos.js";

// ---------------------------------------------------------------------------
// Entradas
// ---------------------------------------------------------------------------

export interface AvaliacaoVersionada {
  readonly avaliacaoId: string;
  readonly encontroId: string;
  readonly instante: InstanteDeclarado;
  readonly estadoBruto: string;
  readonly regra: AtribuicaoDeVersaoDeRegra;
}

// ---------------------------------------------------------------------------
// Saídas
// ---------------------------------------------------------------------------

export interface UsoDeVersao {
  readonly chave: string;
  readonly ruleId: string;
  readonly ruleVersion: string;
  readonly avaliacoes: number;
  readonly encontrosDistintos: number;
  readonly primeiroInstanteUtc: string;
  readonly ultimoInstanteUtc: string;
  readonly porEstado: readonly ContagemPorChave[];
  /**
   * Impressões de conteúdo distintas vistas sob ESTA mesma string de versão.
   * Mais de uma é o defeito E3 da ADR-0025. Vazio significa que a origem não
   * registra impressão — o que é uma LACUNA declarada, não uma aprovação.
   */
  readonly impressoesDeConteudo: readonly string[];
}

export type SeveridadeDeAchado = "achado" | "lacuna";

export interface AchadoDeVersao {
  readonly id:
    | "mistura-de-versoes-na-janela"
    | "identidade-de-versao-inconsistente"
    | "avaliacoes-sem-identidade-de-regra"
    | "impressao-de-conteudo-nao-registrada";
  readonly severidade: SeveridadeDeAchado;
  readonly descricao: string;
  readonly referenciaNormativa: string;
  /** Chaves de versão envolvidas, ordenadas. */
  readonly versoesEnvolvidas: readonly string[];
  readonly avaliacoesAfetadas: number;
}

export interface VigilanciaDeVersaoDeRegra {
  readonly marcacao: MarcacaoDeInstrumentacao;
  readonly janela: JanelaDeVigilancia;
  readonly totalDeAvaliacoes: number;
  readonly usos: readonly UsoDeVersao[];
  /** Avaliações sem identidade de regra — jamais atribuídas por inferência. */
  readonly semIdentidadeDeRegra: {
    readonly avaliacoes: number;
    readonly motivos: readonly ContagemPorChave[];
  };
  readonly misturaDeVersoes: boolean;
  /**
   * Primeiro instante em que uma versão diferente da primeira observada
   * aparece na janela — o "instante de virada". `null` quando não há mistura.
   */
  readonly instanteDeViradaUtc: string | null;
  readonly achados: readonly AchadoDeVersao[];
  readonly nota: string;
}

// ---------------------------------------------------------------------------
// Cálculo
// ---------------------------------------------------------------------------

interface AvaliacaoNormalizada {
  readonly avaliacaoId: string;
  readonly encontroId: string;
  readonly utc: string;
  readonly estado: EstadoDeAvaliacao;
  readonly regra: AtribuicaoDeVersaoDeRegra;
}

export function vigiarVersaoDeRegra(
  janela: JanelaDeVigilancia,
  avaliacoes: readonly AvaliacaoVersionada[],
): VigilanciaDeVersaoDeRegra {
  const naJanela: AvaliacaoNormalizada[] = avaliacoes
    .filter((a) => dentroDaJanela(a.instante, janela))
    .flatMap((a) =>
      a.instante.tipo === "presente"
        ? [
            {
              avaliacaoId: a.avaliacaoId,
              encontroId: a.encontroId,
              utc: a.instante.utc,
              estado: normalizarEstado(a.estadoBruto),
              regra: a.regra,
            },
          ]
        : [],
    )
    .sort((x, y) =>
      x.utc < y.utc ? -1 : x.utc > y.utc ? 1 : x.avaliacaoId < y.avaliacaoId ? -1 : 1,
    );

  const declaradas = naJanela.filter((a) => a.regra.tipo === "declarada");
  const ausentes = naJanela.filter((a) => a.regra.tipo === "ausente");

  const porChave = new Map<string, AvaliacaoNormalizada[]>();
  for (const a of declaradas) {
    const chave = chaveDeVersao(a.regra);
    const lista = porChave.get(chave) ?? [];
    lista.push(a);
    porChave.set(chave, lista);
  }

  const usos: UsoDeVersao[] = [...porChave.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([chave, lista]) => {
      const primeira = lista[0];
      const ultima = lista[lista.length - 1];
      const regra = primeira?.regra;
      const impressoes = [
        ...new Set(
          lista.flatMap((a) =>
            a.regra.tipo === "declarada" && a.regra.impressaoDeConteudo !== undefined
              ? [a.regra.impressaoDeConteudo]
              : [],
          ),
        ),
      ].sort();
      return {
        chave,
        ruleId: regra?.tipo === "declarada" ? regra.ruleId : "",
        ruleVersion: regra?.tipo === "declarada" ? regra.ruleVersion : "",
        avaliacoes: lista.length,
        encontrosDistintos: new Set(lista.map((a) => a.encontroId)).size,
        primeiroInstanteUtc: primeira?.utc ?? "",
        ultimoInstanteUtc: ultima?.utc ?? "",
        porEstado: contarPorChave(lista.map((a) => a.estado)),
        impressoesDeConteudo: impressoes,
      };
    });

  const misturaDeVersoes = usos.length > 1;
  const primeiraChave = declaradas[0] === undefined ? null : chaveDeVersao(declaradas[0].regra);
  const virada =
    primeiraChave === null
      ? undefined
      : declaradas.find((a) => chaveDeVersao(a.regra) !== primeiraChave);

  const achados: AchadoDeVersao[] = [];

  if (misturaDeVersoes) {
    achados.push({
      id: "mistura-de-versoes-na-janela",
      severidade: "achado",
      descricao:
        `${usos.length} versões de regra avaliaram nesta janela ` +
        `(${usos.map((u) => u.chave).join(", ")}). Misturar versões não é, por si, erro — ` +
        "uma liberação legítima produz exatamente isso — mas TORNA NÃO ATRIBUÍVEL qualquer " +
        "comparação de desempenho ou de carga feita sobre a janela inteira: recorte por " +
        "versão antes de comparar (SM-04 exige o recorte por versão).",
      referenciaNormativa: "ADR-0025 §5.2/§5.3; HAZ-0020 (deriva de versão entre instâncias)",
      versoesEnvolvidas: usos.map((u) => u.chave),
      avaliacoesAfetadas: declaradas.length,
    });
  }

  const inconsistentes = usos.filter((u) => u.impressoesDeConteudo.length > 1);
  for (const uso of inconsistentes) {
    achados.push({
      id: "identidade-de-versao-inconsistente",
      severidade: "achado",
      descricao:
        `a MESMA versão declarada "${uso.chave}" aparece com ` +
        `${uso.impressoesDeConteudo.length} impressões de conteúdo distintas ` +
        `(${uso.impressoesDeConteudo.join(", ")}) — a string de versão NÃO identifica o ` +
        "comportamento que rodou. É exatamente o defeito E3/SF-2 do V1 legado (a Scale-2 " +
        "do NEWS2 invertida sem mudar `NEWS2-v3.0.0`). Nenhuma comparação, replay ou " +
        "atribuição pode usar esta versão como identidade até que seja resolvida por " +
        "arbitragem humana.",
      referenciaNormativa: "ADR-0025 E3/E12, §5.2 item 4 (imutabilidade de bundle); SAF-0020",
      versoesEnvolvidas: [uso.chave],
      avaliacoesAfetadas: uso.avaliacoes,
    });
  }

  if (ausentes.length > 0) {
    achados.push({
      id: "avaliacoes-sem-identidade-de-regra",
      severidade: "achado",
      descricao:
        `${ausentes.length} de ${naJanela.length} avaliação(ões) da janela não declaram ` +
        "identidade de regra. Elas NÃO são atribuídas à versão mais provável, à mais " +
        "recente nem à única presente — ficam neste balde, com motivo.",
      referenciaNormativa: "ADR-0025 §5.2 item 3 (proibição de variante não declarada)",
      versoesEnvolvidas: [],
      avaliacoesAfetadas: ausentes.length,
    });
  }

  const semImpressao = usos.filter((u) => u.impressoesDeConteudo.length === 0);
  if (semImpressao.length > 0) {
    achados.push({
      id: "impressao-de-conteudo-nao-registrada",
      severidade: "lacuna",
      descricao:
        `${semImpressao.length} versão(ões) declarada(s) sem impressão de conteúdo ` +
        `(${semImpressao.map((u) => u.chave).join(", ")}). Sem impressão, o defeito E3 ` +
        "(mesma string de versão, comportamento diferente) é INDETECTÁVEL por esta " +
        "vigilância — a ausência do achado não é evidência de ausência do defeito. " +
        "Fechar a lacuna depende do formato de bundle de ADR-0007 carregar a impressão " +
        "até o registro de avaliação.",
      referenciaNormativa: "ADR-0025 E15/E3; ADR-0007 (formato/assinatura de bundle)",
      versoesEnvolvidas: semImpressao.map((u) => u.chave),
      avaliacoesAfetadas: semImpressao.reduce((soma, u) => soma + u.avaliacoes, 0),
    });
  }

  return {
    marcacao: MARCACAO_DE_INSTRUMENTACAO,
    janela,
    totalDeAvaliacoes: naJanela.length,
    usos,
    semIdentidadeDeRegra: {
      avaliacoes: ausentes.length,
      motivos: contarPorChave(
        ausentes.map((a) =>
          a.regra.tipo === "ausente" ? a.regra.motivo : "motivo-nao-registrado",
        ),
      ),
    },
    misturaDeVersoes,
    instanteDeViradaUtc: virada?.utc ?? null,
    achados,
    nota:
      "vigilância INTERNA de identidade de versão sobre o que foi persistido. NÃO substitui " +
      "e NÃO fecha a vigilância de atualização de edição de ADR-0025 §5.3 (canais RCP, " +
      "JAMA/Sepsis-3, SSC/SCCM/ESICM), que é ato humano nomeado e cuja ferramenta não " +
      "existe (E17).",
  };
}
