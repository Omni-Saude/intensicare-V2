/**
 * KPIR-14 / K-8 — "Altas vivas da UTI" (`vidas_salvas`).
 *
 * DECIDIDO (GDEC-0007, K-8, modificação do titular): dos seis macro-nomes
 * legados, cinco são DROP definitivo e `vidas_salvas` é MANTIDO — como nome de
 * missão e cultura — com uma definição mensurável INTEIRAMENTE NOVA. Nada da
 * fórmula legada do Tasy é importado. A definição operante está em
 * `docs/05-clinical-safety/pathway-portfolio/clinical-kpi-review.md` §3
 * (KPIR-14) e em `docs/01-vision-and-intended-use/arvore-de-outcomes.md` §3.
 *
 * A NOTA DE HONESTIDADE É PARTE DA DEFINIÇÃO, não um rodapé colocado em outro
 * lugar (citação literal de §3): *"contagem de altas vivas — não é atribuição
 * causal de vidas salvas pelo sistema."* KPIR-14 conta um desfecho clínico
 * ocorrido; não é estimativa de efeito, não é contrafactual, não é comparação
 * com baseline, mortalidade esperada ou taxa pré-V2, e não pode ser exibido,
 * citado ou reportado como evidência de que o sistema "salvou" o número
 * contado. `arvore-de-outcomes.md` §3 registra que este é o KPI mais provável
 * de sofrer essa leitura, porque tem o nome mais mobilizador do repositório.
 *
 * COMO ESTE MÓDULO TORNA ISSO ESTRUTURAL, e não uma recomendação:
 *
 * 1. **O número não é uma propriedade legível.** As contagens vivem em campos
 *    privados (`#`) de `VarianteKpir14`. O ÚNICO acesso é `abrir()`, que
 *    devolve, na mesma chamada e obrigatoriamente juntas, a contagem de altas
 *    vivas, as DUAS figuras companheiras (altas totais e óbitos), o
 *    denominador de completude e `DC(KPIR-14)` por motivo. Não existe caminho
 *    de tipo que produza o número solto. `JSON.stringify` de uma variante não
 *    serializa contagem nenhuma — campo privado não é enumerável.
 * 2. **Ler exige assinar a marcação.** `abrir()` só aceita o literal de
 *    reconhecimento de monitorização de missão. Todo ponto de leitura escreve,
 *    no próprio código, que aquilo não é estimativa de efeito.
 * 3. **As duas sub-decisões abertas não são resolvidas em silêncio.** Não
 *    existe "o número": existe uma VARIANTE por combinação declarada de
 *    (tratamento de transferência para outra UTI) × (janela de de-duplicação
 *    de readmissão). Ambas seguem `VALIDATION REQUIRED` por `AUTH-CLINSAFETY`
 *    (§3, sub-decisões 1 e 2). Computar sem variante declarada lança erro.
 *
 * LIMITE DE DADOS, dito aqui e não escondido: a persistência desta fatia NÃO
 * registra disposição de alta (vivo/óbito/transferência) nem origem da âncora
 * de alta. Contra o banco real, portanto, todo episódio cai em
 * `DC(KPIR-14)` e nenhuma variante produz contagem — que é o comportamento
 * correto e é o que o teste de leitura demonstra. O cálculo numérico é
 * exercido contra séries sintéticas.
 */
import {
  type Completude,
  contarPorChave,
  type JanelaDeVigilancia,
  montarCompletude,
  UNIDADE_NAO_ATRIBUIDA,
} from "./tipos.js";

// ---------------------------------------------------------------------------
// Marcação e reconhecimento
// ---------------------------------------------------------------------------

export const MARCACAO_DE_MISSAO =
  "MONITORIZACAO_DE_MISSAO — NAO E ESTIMATIVA DE EFEITO, NAO E CONTRAFACTUAL, NAO E ATRIBUICAO CAUSAL AO SISTEMA" as const;

export type MarcacaoDeMissao = typeof MARCACAO_DE_MISSAO;

/** Citação literal da nota de honestidade de `clinical-kpi-review.md` §3. */
export const NOTA_DE_HONESTIDADE =
  "contagem de altas vivas — não é atribuição causal de vidas salvas pelo sistema" as const;

export type ReconhecimentoDeMonitorizacao =
  "reconheco-monitorizacao-de-missao-nao-estimativa-de-efeito";

export const RECONHECIMENTO_DE_MONITORIZACAO: ReconhecimentoDeMonitorizacao =
  "reconheco-monitorizacao-de-missao-nao-estimativa-de-efeito";

// ---------------------------------------------------------------------------
// Entradas
// ---------------------------------------------------------------------------

/**
 * Origem da âncora de alta. §3: a âncora é o timestamp de alta da UTI
 * **documentado** — "nunca um timestamp administrativo, de faturamento ou de
 * gestão de leitos". Só `registro-clinico-documentado` é aceito; as demais
 * origens excluem o episódio e aparecem em `DC(KPIR-14)` com o motivo.
 */
export type OrigemDeAncora =
  | "registro-clinico-documentado"
  | "administrativa"
  | "faturamento"
  | "gestao-de-leitos"
  | "desconhecida";

export type AncoraDeAlta =
  | { readonly tipo: "presente"; readonly utc: string; readonly origem: OrigemDeAncora }
  | { readonly tipo: "ausente"; readonly motivo: string };

/**
 * Disposição vivo-vs-morto na alta. `ausente` e `invalida` são estados de
 * primeira classe: nenhum episódio é jamais defaultado para "vivo" ou
 * "morto" a partir de dado ausente (§3, "No episode is ever defaulted into
 * 'alive' or 'dead' from absent data").
 */
export type DisposicaoDeAlta =
  | { readonly tipo: "vivo" }
  | { readonly tipo: "obito" }
  | { readonly tipo: "transferencia_para_outra_uti"; readonly intraFacilidade: boolean }
  | { readonly tipo: "ausente"; readonly motivo: string }
  | { readonly tipo: "invalida"; readonly motivo: string };

export interface EpisodioDeUti {
  readonly episodioId: string;
  /** Referência do sujeito (sintética: `amh:psr:v1:SYNTH-*`). */
  readonly pacienteRef: string;
  readonly unidadeId: string | null;
  readonly admissaoUtc: string | null;
  readonly ancoraDeAlta: AncoraDeAlta;
  readonly disposicao: DisposicaoDeAlta;
}

// ---------------------------------------------------------------------------
// As duas sub-decisões abertas (§3, VALIDATION REQUIRED — AUTH-CLINSAFETY)
// ---------------------------------------------------------------------------

/** Sub-decisão 1: transferência para outra UTI (intra ou inter-facilidade). */
export type TratamentoDeTransferencia =
  | "conta_como_alta_viva"
  | "excluida_do_computo"
  | "categoria_propria";

export const TRATAMENTOS_DE_TRANSFERENCIA: readonly TratamentoDeTransferencia[] = [
  "conta_como_alta_viva",
  "excluida_do_computo",
  "categoria_propria",
];

/** Sub-decisão 2: janela de de-duplicação de readmissão. */
export type TratamentoDeReadmissao =
  | { readonly modo: "sem_deduplicacao" }
  | {
      readonly modo: "deduplicacao_por_janela";
      readonly janelaHoras: number;
      readonly proveniencia: "janela-de-deduplicacao-nao-ratificada-AUTH-CLINSAFETY";
    };

export const SEM_DEDUPLICACAO: TratamentoDeReadmissao = { modo: "sem_deduplicacao" };

export function deduplicacaoPorJanela(janelaHoras: number): TratamentoDeReadmissao {
  if (!(janelaHoras > 0) || !Number.isFinite(janelaHoras)) {
    throw new RangeError(`janela de de-duplicação deve ser > 0 horas: ${janelaHoras}`);
  }
  return {
    modo: "deduplicacao_por_janela",
    janelaHoras,
    proveniencia: "janela-de-deduplicacao-nao-ratificada-AUTH-CLINSAFETY",
  };
}

export interface SubDecisoesKpir14 {
  readonly transferencia: TratamentoDeTransferencia;
  readonly readmissao: TratamentoDeReadmissao;
}

export interface SubDecisaoAberta {
  readonly id: "transferencia-para-outra-uti" | "janela-de-deduplicacao-de-readmissao";
  readonly descricao: string;
  readonly decisor: "AUTH-CLINSAFETY (UNASSIGNED)";
  readonly estado: "ABERTA — VALIDATION REQUIRED";
  readonly ameacaDeGaming: string;
}

export const SUBDECISOES_ABERTAS: readonly SubDecisaoAberta[] = [
  {
    id: "transferencia-para-outra-uti",
    descricao:
      "se uma transferência para outra UTI (intra ou inter-facilidade) conta como alta " +
      "viva, é episódio censurado/excluído, ou é categoria própria. Nenhum default é " +
      "adotado (§3, sub-decisão 1).",
    decisor: "AUTH-CLINSAFETY (UNASSIGNED)",
    estado: "ABERTA — VALIDATION REQUIRED",
    ameacaDeGaming:
      "transfer-out gaming: transferir pacientes instáveis antes do óbito INFLA a contagem " +
      "sob um default desfavorável — é exatamente por isso que nenhum default foi adotado.",
  },
  {
    id: "janela-de-deduplicacao-de-readmissao",
    descricao:
      "se, e sobre que janela, uma readmissão à mesma UTI é episódio novo (contando o " +
      "mesmo paciente duas vezes como alta viva) ou é ligada ao episódio anterior. " +
      "Nenhuma janela é adotada (§3, sub-decisão 2).",
    decisor: "AUTH-CLINSAFETY (UNASSIGNED)",
    estado: "ABERTA — VALIDATION REQUIRED",
    ameacaDeGaming:
      "dupla contagem por readmissão: o mesmo paciente contado mais de uma vez como alta " +
      "viva no mesmo período — mitigado apenas quando a sub-decisão fechar.",
  },
];

/**
 * Conjunto mínimo honesto de variantes: as três opções da sub-decisão 1,
 * todas sem de-duplicação (a sub-decisão 2 não tem janela ratificada, logo
 * nenhuma janela pode ser o caso "base"). Expõe as variantes em vez de
 * escolher uma em silêncio.
 */
export const VARIANTES_MINIMAS: readonly SubDecisoesKpir14[] = TRATAMENTOS_DE_TRANSFERENCIA.map(
  (transferencia) => ({ transferencia, readmissao: SEM_DEDUPLICACAO }),
);

// ---------------------------------------------------------------------------
// Saídas
// ---------------------------------------------------------------------------

interface Contagens {
  readonly altasVivas: number;
  readonly obitos: number;
  readonly transferenciasComoCategoriaPropria: number;
  readonly altasTotais: number;
}

export interface RecorteDeUnidadeAberto {
  readonly unidade: string;
  readonly altasVivas: number;
  readonly altasTotais: number;
  readonly obitos: number;
  readonly transferenciasComoCategoriaPropria: number;
  readonly completude: Completude;
}

/**
 * A forma ABERTA de uma variante: a contagem de altas vivas nunca chega ao
 * chamador sem as duas figuras companheiras, o denominador de completude, o
 * `DC(KPIR-14)` por motivo, a marcação de missão e a nota de honestidade —
 * todos no MESMO objeto, produzidos pela MESMA chamada.
 */
export interface VarianteAberta {
  readonly marcacao: MarcacaoDeMissao;
  readonly notaDeHonestidade: typeof NOTA_DE_HONESTIDADE;
  readonly periodo: JanelaDeVigilancia;
  readonly subDecisoes: SubDecisoesKpir14;
  readonly altasVivas: number;
  /** Figura companheira 1 — altas totais no período (vivas + óbitos + categoria própria). */
  readonly altasTotais: number;
  /** Figura companheira 2 — óbitos no período. */
  readonly obitos: number;
  readonly transferenciasComoCategoriaPropria: number;
  /** `DC(KPIR-14)` — denominador e motivos de exclusão, em igual proeminência. */
  readonly completude: Completude;
  readonly porUnidade: readonly RecorteDeUnidadeAberto[];
  readonly avisosDeSubDecisaoAberta: readonly string[];
  /** Invariante verificável: vivas + óbitos + categoria própria === altas totais. */
  readonly invarianteDeTriade: boolean;
}

/**
 * Uma variante de KPIR-14. As contagens são privadas por construção; o único
 * acesso é `abrir(reconhecimento)`.
 */
export class VarianteKpir14 {
  readonly #contagens: Contagens;
  readonly #completude: Completude;
  readonly #porUnidade: readonly RecorteDeUnidadeAberto[];
  readonly #periodo: JanelaDeVigilancia;

  readonly subDecisoes: SubDecisoesKpir14;
  readonly marcacao: MarcacaoDeMissao = MARCACAO_DE_MISSAO;
  readonly notaDeHonestidade: typeof NOTA_DE_HONESTIDADE = NOTA_DE_HONESTIDADE;

  constructor(entrada: {
    readonly periodo: JanelaDeVigilancia;
    readonly subDecisoes: SubDecisoesKpir14;
    readonly contagens: Contagens;
    readonly completude: Completude;
    readonly porUnidade: readonly RecorteDeUnidadeAberto[];
  }) {
    this.#periodo = entrada.periodo;
    this.#contagens = entrada.contagens;
    this.#completude = entrada.completude;
    this.#porUnidade = entrada.porUnidade;
    this.subDecisoes = entrada.subDecisoes;
  }

  /**
   * Único acesso às contagens. Devolve SEMPRE a tríade completa mais o
   * `DC(KPIR-14)`; exige o literal de reconhecimento de monitorização de
   * missão, para que todo ponto de leitura declare, no próprio código, que
   * aquilo não é estimativa de efeito nem atribuição causal.
   */
  abrir(reconhecimento: ReconhecimentoDeMonitorizacao): VarianteAberta {
    if (reconhecimento !== RECONHECIMENTO_DE_MONITORIZACAO) {
      throw new TypeError(
        "KPIR-14 só pode ser lido com o reconhecimento de monitorização de missão " +
          "(RECONHECIMENTO_DE_MONITORIZACAO) — não é estimativa de efeito nem atribuição " +
          "causal ao sistema",
      );
    }
    const c = this.#contagens;
    return {
      marcacao: MARCACAO_DE_MISSAO,
      notaDeHonestidade: NOTA_DE_HONESTIDADE,
      periodo: this.#periodo,
      subDecisoes: this.subDecisoes,
      altasVivas: c.altasVivas,
      altasTotais: c.altasTotais,
      obitos: c.obitos,
      transferenciasComoCategoriaPropria: c.transferenciasComoCategoriaPropria,
      completude: this.#completude,
      porUnidade: this.#porUnidade,
      avisosDeSubDecisaoAberta: SUBDECISOES_ABERTAS.map(
        (sd) => `${sd.id}: ${sd.estado} — ${sd.descricao} Ameaça: ${sd.ameacaDeGaming}`,
      ),
      invarianteDeTriade:
        c.altasVivas + c.obitos + c.transferenciasComoCategoriaPropria === c.altasTotais,
    };
  }
}

export interface ResultadoKpir14 {
  readonly marcacao: MarcacaoDeMissao;
  readonly notaDeHonestidade: typeof NOTA_DE_HONESTIDADE;
  readonly periodo: JanelaDeVigilancia;
  readonly subDecisoesAbertas: readonly SubDecisaoAberta[];
  /**
   * Uma variante por combinação declarada das duas sub-decisões. NÃO existe
   * figura de cabeçalho: enquanto as sub-decisões estiverem abertas, "o
   * número" não existe — existem as variantes, com as lacunas divulgadas.
   */
  readonly variantes: readonly VarianteKpir14[];
  readonly nota: string;
}

// ---------------------------------------------------------------------------
// Cálculo
// ---------------------------------------------------------------------------

export interface EntradaDeKpir14 {
  readonly periodo: JanelaDeVigilancia;
  readonly episodios: readonly EpisodioDeUti[];
  /** Combinações declaradas das duas sub-decisões — obrigatoriamente não vazia. */
  readonly variantes: readonly SubDecisoesKpir14[];
}

export function calcularKpir14(entrada: EntradaDeKpir14): ResultadoKpir14 {
  const { periodo, episodios, variantes } = entrada;
  if (variantes.length === 0) {
    throw new TypeError(
      "KPIR-14 não pode ser computado sem variante declarada: as duas sub-decisões (§3) " +
        "seguem ABERTAS e escolher uma em silêncio é exatamente o que a definição proíbe. " +
        "Use VARIANTES_MINIMAS ou declare as combinações desejadas.",
    );
  }
  return {
    marcacao: MARCACAO_DE_MISSAO,
    notaDeHonestidade: NOTA_DE_HONESTIDADE,
    periodo,
    subDecisoesAbertas: SUBDECISOES_ABERTAS,
    variantes: variantes.map((sub) => computarVariante(periodo, episodios, sub)),
    nota:
      "KPIR-14 é contagem de desfecho clínico ocorrido, exibida obrigatoriamente com as duas " +
      "figuras companheiras e com DC(KPIR-14) em igual proeminência. Não é taxa, proporção " +
      "nem razão de coisa nenhuma; não compara com baseline, mortalidade esperada ou taxa " +
      "pré-V2; não é evidência de efetividade (IU-12b).",
  };
}

interface EpisodioResolvido {
  readonly episodioId: string;
  readonly pacienteRef: string;
  readonly unidade: string;
  readonly altaUtc: string;
  readonly disposicao: DisposicaoDeAlta;
}

function computarVariante(
  periodo: JanelaDeVigilancia,
  episodios: readonly EpisodioDeUti[],
  subDecisoes: SubDecisoesKpir14,
): VarianteKpir14 {
  const inicio = Date.parse(periodo.inicioUtc);
  const fim = Date.parse(periodo.fimUtc);

  // 1) Episódios ENCERRADOS no período — o universo elegível de DC(KPIR-14).
  //    Âncora ausente/não documentada exclui o episódio, com motivo.
  const elegiveis: EpisodioDeUti[] = [];
  const motivos: string[] = [];
  for (const episodio of episodios) {
    const ancora = episodio.ancoraDeAlta;
    if (ancora.tipo === "ausente") {
      elegiveis.push(episodio);
      motivos.push(`ancora-de-alta-ausente:${ancora.motivo}`);
      continue;
    }
    const t = Date.parse(ancora.utc);
    if (Number.isNaN(t)) {
      elegiveis.push(episodio);
      motivos.push("ancora-de-alta-invalida:instante-nao-parseavel");
      continue;
    }
    if (t < inicio || t >= fim) continue; // fora do período — não é elegível
    elegiveis.push(episodio);
    if (ancora.origem !== "registro-clinico-documentado") {
      motivos.push(`ancora-de-alta-nao-documentada:${ancora.origem}`);
    }
  }

  // 2) Episódios com âncora documentada no período: candidatos a contagem.
  const candidatos: EpisodioResolvido[] = elegiveis.flatMap((episodio) => {
    const ancora = episodio.ancoraDeAlta;
    if (ancora.tipo !== "presente") return [];
    if (ancora.origem !== "registro-clinico-documentado") return [];
    const t = Date.parse(ancora.utc);
    if (Number.isNaN(t) || t < inicio || t >= fim) return [];
    return [
      {
        episodioId: episodio.episodioId,
        pacienteRef: episodio.pacienteRef,
        unidade: episodio.unidadeId ?? UNIDADE_NAO_ATRIBUIDA,
        altaUtc: ancora.utc,
        disposicao: episodio.disposicao,
      },
    ];
  });

  // 3) Sub-decisão 2 — de-duplicação de readmissão.
  const { contados, deduplicados } = aplicarDeduplicacao(
    candidatos,
    episodios,
    subDecisoes.readmissao,
  );
  for (let i = 0; i < deduplicados; i += 1) {
    motivos.push("readmissao-deduplicada-por-sub-decisao-declarada");
  }

  // 4) Sub-decisão 1 — tratamento de transferência; e disposição ausente/inválida.
  let altasVivas = 0;
  let obitos = 0;
  let transferencias = 0;
  const porUnidade = new Map<
    string,
    { vivas: number; obitos: number; transf: number; total: number }
  >();
  const motivosPorUnidade = new Map<string, string[]>();
  const elegiveisPorUnidade = new Map<string, number>();

  const registrarUnidade = (unidade: string): void => {
    if (!porUnidade.has(unidade)) {
      porUnidade.set(unidade, { vivas: 0, obitos: 0, transf: 0, total: 0 });
    }
  };
  const anotarMotivo = (unidade: string, motivo: string): void => {
    const lista = motivosPorUnidade.get(unidade) ?? [];
    lista.push(motivo);
    motivosPorUnidade.set(unidade, lista);
  };

  for (const candidato of contados) {
    const unidade = candidato.unidade;
    registrarUnidade(unidade);
    elegiveisPorUnidade.set(unidade, (elegiveisPorUnidade.get(unidade) ?? 0) + 1);
    const acumulador = porUnidade.get(unidade);
    if (acumulador === undefined) continue;

    switch (candidato.disposicao.tipo) {
      case "vivo":
        altasVivas += 1;
        acumulador.vivas += 1;
        acumulador.total += 1;
        break;
      case "obito":
        obitos += 1;
        acumulador.obitos += 1;
        acumulador.total += 1;
        break;
      case "transferencia_para_outra_uti":
        if (subDecisoes.transferencia === "conta_como_alta_viva") {
          altasVivas += 1;
          acumulador.vivas += 1;
          acumulador.total += 1;
        } else if (subDecisoes.transferencia === "categoria_propria") {
          transferencias += 1;
          acumulador.transf += 1;
          acumulador.total += 1;
        } else {
          motivos.push("transferencia-excluida-por-sub-decisao-declarada");
          anotarMotivo(unidade, "transferencia-excluida-por-sub-decisao-declarada");
        }
        break;
      case "ausente":
        motivos.push(`disposicao-ausente:${candidato.disposicao.motivo}`);
        anotarMotivo(unidade, `disposicao-ausente:${candidato.disposicao.motivo}`);
        break;
      case "invalida":
        motivos.push(`disposicao-invalida:${candidato.disposicao.motivo}`);
        anotarMotivo(unidade, `disposicao-invalida:${candidato.disposicao.motivo}`);
        break;
    }
  }

  const contagens: Contagens = {
    altasVivas,
    obitos,
    transferenciasComoCategoriaPropria: transferencias,
    altasTotais: altasVivas + obitos + transferencias,
  };

  const completude = montarCompletude({
    elegiveis: elegiveis.length,
    computaveis: contagens.altasTotais,
    motivosDeExclusao: contarPorChave(motivos),
  });

  const recortes: RecorteDeUnidadeAberto[] = [...porUnidade.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([unidade, acumulador]) => ({
      unidade,
      altasVivas: acumulador.vivas,
      altasTotais: acumulador.total,
      obitos: acumulador.obitos,
      transferenciasComoCategoriaPropria: acumulador.transf,
      completude: montarCompletude({
        elegiveis: elegiveisPorUnidade.get(unidade) ?? 0,
        computaveis: acumulador.total,
        motivosDeExclusao: contarPorChave(motivosPorUnidade.get(unidade) ?? []),
      }),
    }));

  return new VarianteKpir14({
    periodo,
    subDecisoes,
    contagens,
    completude,
    porUnidade: recortes,
  });
}

/**
 * Aplica a sub-decisão 2. Sob `deduplicacao_por_janela`, uma alta cujo mesmo
 * paciente tenha sido readmitido dentro da janela (readmissão ≤ janelaHoras
 * após aquela alta) é LIGADA ao episódio seguinte e não conta de novo — só o
 * último episódio da cadeia entra na contagem. Sob `sem_deduplicacao`, cada
 * episódio conta, e a dupla contagem do mesmo paciente é possível — que é
 * exatamente a ameaça registrada na sub-decisão aberta.
 */
function aplicarDeduplicacao(
  candidatos: readonly EpisodioResolvido[],
  todosOsEpisodios: readonly EpisodioDeUti[],
  tratamento: TratamentoDeReadmissao,
): { readonly contados: readonly EpisodioResolvido[]; readonly deduplicados: number } {
  if (tratamento.modo === "sem_deduplicacao") {
    return { contados: candidatos, deduplicados: 0 };
  }
  const janelaMs = tratamento.janelaHoras * 3_600_000;
  const admissoesPorPaciente = new Map<string, number[]>();
  for (const episodio of todosOsEpisodios) {
    if (episodio.admissaoUtc === null) continue;
    const t = Date.parse(episodio.admissaoUtc);
    if (Number.isNaN(t)) continue;
    const lista = admissoesPorPaciente.get(episodio.pacienteRef) ?? [];
    lista.push(t);
    admissoesPorPaciente.set(episodio.pacienteRef, lista);
  }

  const contados: EpisodioResolvido[] = [];
  let deduplicados = 0;
  for (const candidato of candidatos) {
    const alta = Date.parse(candidato.altaUtc);
    const admissoes = admissoesPorPaciente.get(candidato.pacienteRef) ?? [];
    const readmitido = admissoes.some((t) => t > alta && t - alta <= janelaMs);
    if (readmitido) {
      deduplicados += 1;
      continue;
    }
    contados.push(candidato);
  }
  return { contados, deduplicados };
}

// ---------------------------------------------------------------------------
// Formatação obrigatória
// ---------------------------------------------------------------------------

/**
 * Bloco de exibição em pt-BR. Existe para que qualquer superfície que exiba
 * KPIR-14 tenha um caminho pronto em que as três contagens, o `DC(KPIR-14)`,
 * a marcação de missão e as duas sub-decisões abertas saem JUNTOS — a
 * "igual proeminência" exigida por §3 não é um pedido de layout que se possa
 * esquecer, é o único formato que este módulo produz.
 */
export function formatarVariante(
  variante: VarianteKpir14,
  reconhecimento: ReconhecimentoDeMonitorizacao,
): string {
  const aberta = variante.abrir(reconhecimento);
  const dc = aberta.completude;
  const fracao =
    dc.fracaoComputavel === null
      ? "sem episódio elegível — fração não existe (nunca 0%, nunca 100%)"
      : `${(dc.fracaoComputavel * 100).toFixed(1)}% dos episódios elegíveis`;
  const motivos =
    dc.motivosDeExclusao.length === 0
      ? "  (nenhuma exclusão registrada)"
      : dc.motivosDeExclusao.map((m) => `  - ${m.chave}: ${m.contagem}`).join("\n");
  return [
    `KPIR-14 — Altas vivas da UTI (${MARCACAO_DE_MISSAO})`,
    `Nota de honestidade: ${NOTA_DE_HONESTIDADE}`,
    `Período: ${aberta.periodo.inicioUtc} → ${aberta.periodo.fimUtc}`,
    `Sub-decisões declaradas: transferência = ${aberta.subDecisoes.transferencia}; ` +
      `readmissão = ${aberta.subDecisoes.readmissao.modo}`,
    "",
    `Altas vivas: ${aberta.altasVivas}`,
    `Altas totais no período (figura companheira 1): ${aberta.altasTotais}`,
    `Óbitos no período (figura companheira 2): ${aberta.obitos}`,
    `Transferências como categoria própria: ${aberta.transferenciasComoCategoriaPropria}`,
    "",
    `DC(KPIR-14): ${dc.excluidos} de ${dc.elegiveis} episódios elegíveis excluídos — ${fracao} computável`,
    "Motivos de exclusão:",
    motivos,
    `Piso mínimo de completude: ${dc.pisoDeCompletude}`,
    "",
    "Sub-decisões ABERTAS divulgadas com o número (§3):",
    ...aberta.avisosDeSubDecisaoAberta.map((aviso) => `  - ${aviso}`),
  ].join("\n");
}
