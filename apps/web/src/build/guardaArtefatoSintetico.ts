/**
 * apps/web/src/build/guardaArtefatoSintetico.ts
 *
 * TERCEIRA defesa do ACH-07: fazer o BUILD DE PRODUÇÃO FALHAR se qualquer
 * artefato sintético ou dublê operacional chegar ao pacote emitido.
 *
 * As outras duas defesas são de execução e de empacotamento:
 *   1. `../perfil.ts` LANÇA se um dublê for usado fora de desenvolvimento;
 *   2. `../api/resolverCliente.ts` alcança o dublê só por `import()` dinâmico
 *      sob `import.meta.env.DEV`, que vira código morto em produção.
 *
 * Esta terceira PROVA a segunda em vez de confiar nela. Tree-shaking é uma
 * otimização, não uma garantia contratual: uma mudança de configuração do
 * empacotador, um `sideEffects` mal declarado ou um import acidental podem
 * reintroduzir o módulo silenciosamente. Sem esta verificação, ninguém
 * saberia — e um token sintético num bundle de produção é indistinguível,
 * para quem audita, de uma credencial esquecida.
 *
 * A função é PURA (recebe o conteúdo dos arquivos, devolve as violações) para
 * ser testável sem rodar um build.
 *
 * Rastreio: ACH-07, anti-padrões 8 e 9 do contrato comum, ADR-0015, ADR-0021.
 */

export interface MarcadorProibido {
  /** Nome legível do que se está proibindo. */
  readonly nome: string;
  /** Trecho literal cuja presença no bundle é violação. */
  readonly literal: string;
  /** Por que a presença deste literal em produção é um defeito. */
  readonly razao: string;
}

/**
 * Marcadores proibidos no pacote de produção.
 *
 * NOTA sobre o que NÃO está aqui: a string "SYNTH" isolada é PERMITIDA. O
 * banner de contexto (`BannerContexto.tsx`) precisa dizer "dados 100%
 * sintéticos (SYNTH)" em toda tela — é obrigação de segurança clínica
 * (HAZ-0046), e proibir o termo genérico transformaria esta guarda numa
 * pressão para remover a divulgação. Os literais abaixo são específicos.
 */
export const MARCADORES_PROIBIDOS: readonly MarcadorProibido[] = [
  {
    nome: "token sintético de desenvolvimento",
    literal: "SYNTH-TOKEN.",
    razao:
      "Credencial sintética compilada no bundle. Era a constante `TOKEN_DEV` de " +
      "`api/clienteHttp.ts`, removida no ACH-07; hoje só existe em " +
      "`api/sessaoDesenvolvimento.ts`, que não deve chegar a produção.",
  },
  {
    nome: "identificador de tenant do cenário G7",
    literal: "SYNTH-TENANT-G7",
    razao: "Tenant de cenário sintético; nenhum build de produção deve carregá-lo.",
  },
  {
    nome: "cliente mock alimentado por fixtures",
    literal: "criarClienteMock",
    razao:
      "Dublê operacional. Se o nome sobreviveu ao empacotamento, o ramo dinâmico " +
      "guardado por `import.meta.env.DEV` não foi eliminado — a proteção que se " +
      "supunha existir não existe.",
  },
  {
    nome: "controle de demonstração",
    literal: "Modo de demonstração (apenas front-end sintético)",
    razao:
      "Ferramenta de revisão de UI que força estados de tela. Em produção, um " +
      "controle capaz de forçar 'indisponível' numa tela clínica é uma superfície " +
      "de engano, não uma conveniência.",
  },
  {
    nome: "resposta forçada do modo de demonstração",
    literal: "forçada para revisão de UI",
    razao:
      "Texto das respostas sintéticas de `respostaForcada`. Marcador ACRESCENTADO " +
      "depois de um build real: o controle já era barrado pelo marcador acima, mas " +
      "a frase curta da resposta forçada continuava no pacote — a guarda passava " +
      "por pouco. Um marcador que quase falha é um marcador que vai falhar.",
  },
  {
    nome: "galeria de estados (revisão de UI)",
    literal: "Galeria de estados obrigatórios",
    razao:
      "Catálogo de apresentação para revisão. Não é tela clínica e não deve ser " +
      "alcançável em produção.",
  },
];

export interface ViolacaoBundle {
  readonly arquivo: string;
  readonly marcador: MarcadorProibido;
}

/**
 * Verifica os arquivos emitidos. Recebe um mapa `nome do arquivo → conteúdo`
 * e devolve TODAS as violações (não para na primeira — um relatório parcial
 * levaria a corrigir uma e descobrir a próxima só no build seguinte).
 */
export function verificarArtefatosSinteticos(
  arquivos: Readonly<Record<string, string>>,
): readonly ViolacaoBundle[] {
  const violacoes: ViolacaoBundle[] = [];
  for (const [arquivo, conteudo] of Object.entries(arquivos)) {
    for (const marcador of MARCADORES_PROIBIDOS) {
      if (conteudo.includes(marcador.literal)) {
        violacoes.push({ arquivo, marcador });
      }
    }
  }
  return violacoes;
}

/** Mensagem de erro do build — nomeia arquivo, marcador e razão. */
export function formatarViolacoes(violacoes: readonly ViolacaoBundle[]): string {
  const linhas = violacoes.map(
    ({ arquivo, marcador }) =>
      `  - ${arquivo}: contém "${marcador.literal}" (${marcador.nome})\n    ${marcador.razao}`,
  );
  return (
    "Artefato sintético encontrado no pacote de PRODUÇÃO — build interrompido " +
    `(${violacoes.length} violação(ões)):\n${linhas.join("\n")}\n` +
    "Dublês operacionais só podem existir em builds de desenvolvimento " +
    "(ACH-07; anti-padrão 9 do contrato comum)."
  );
}
