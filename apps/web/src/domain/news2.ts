/**
 * apps/web/src/domain/news2.ts
 *
 * Tabela de pontos do NEWS2 (National Early Warning Score 2, descrição
 * pública do Royal College of Physicians, Reino Unido) reproduzida aqui
 * APENAS PARA FINS ILUSTRATIVOS desta fatia 100% sintética. NENHUMA
 * ALEGAÇÃO de efetividade clínica, conformidade regulatória ou segurança
 * comprovada é feita por esta implementação — ela existe só para dar a
 * `apps/web` um número plausível para exercitar os estados de UI
 * exigidos (§11) enquanto `packages/kernel-clinico` (esqueleto, SPR-G7-1)
 * não implementa a regra canônica.
 *
 * Integração SPR-G7-2: a implementação REAL do escore existe em
 * `@intensicare/kernel-clinico` (RULE-NEWS2 0.2.0) e é o que a API
 * calcula; a tabela abaixo alimenta APENAS o cliente mock
 * (`../api/fixtures.ts`) — jamais deve ser tratada como fonte de verdade do
 * escore.
 *
 * FRONTEIRA EXECUTÁVEL (LAC-L8). Nenhum módulo do caminho de produção pode
 * importar este arquivo: `./fronteiraDoModuloIlustrativo.test.ts` varre o grafo
 * de importações de `src/**` e reprova se alguém além de `../api/fixtures.ts`
 * o alcançar, e `../build/guardaArtefatoSintetico.ts` faz o build de produção
 * FALHAR se `VERSAO_REGRA_NEWS2_ILUSTRATIVA` aparecer no pacote emitido.
 * Tree-shaking removia a tabela hoje, mas é otimização, não garantia
 * contratual — a aresta de importação existia e nada a impedia de crescer.
 *
 * As faixas de banda de risco produzidas por `calcularBandaRisco` NÃO são
 * limiar clinicamente validado. Elas emitem o vocabulário do contrato
 * (`normal`/`atencao`/`alerta`/`critico`) porque o dublê ocupa o lugar do
 * backend perante a UI — a justificativa completa, e o que exatamente foi
 * transcrito do contrato em vez de decidido aqui, está na própria função.
 */
import type { BandaRisco } from "./estados.js";

/**
 * Marcador de proveniência da tabela ILUSTRATIVA. `../build/guardaArtefatoSintetico.ts`
 * proíbe este literal no pacote de produção — se ele chegar lá, a tela pode
 * exibir rastreabilidade de regra FALSA (LAC-L8; ADR-0021 F8).
 */
export const VERSAO_REGRA_NEWS2_ILUSTRATIVA = "news2-ilustrativo-0.0.1-synth" as const;

/** Pontua a frequência respiratória (irpm). */
export function pontuarFrequenciaRespiratoria(irpm: number): number {
  if (irpm <= 8) return 3;
  if (irpm <= 11) return 1;
  if (irpm <= 20) return 0;
  if (irpm <= 24) return 2;
  return 3;
}

/** Pontua a saturação de oxigênio (%, escala 1 — sem risco hipercápnico). */
export function pontuarSaturacaoOxigenio(percentual: number): number {
  if (percentual <= 91) return 3;
  if (percentual <= 93) return 2;
  if (percentual <= 95) return 1;
  return 0;
}

/** Pontua o uso de oxigênio suplementar (ar ambiente vs. suplementar). */
export function pontuarUsoOxigenioSuplementar(usaSuplementar: boolean): number {
  return usaSuplementar ? 2 : 0;
}

/** Pontua a temperatura (°C). */
export function pontuarTemperatura(celsius: number): number {
  if (celsius <= 35.0) return 3;
  if (celsius <= 36.0) return 1;
  if (celsius <= 38.0) return 0;
  if (celsius <= 39.0) return 1;
  return 2;
}

/** Pontua a pressão arterial sistólica (mmHg). */
export function pontuarPressaoSistolica(mmHg: number): number {
  if (mmHg <= 90) return 3;
  if (mmHg <= 100) return 2;
  if (mmHg <= 110) return 1;
  if (mmHg <= 219) return 0;
  return 3;
}

/** Pontua a frequência cardíaca (bpm). */
export function pontuarFrequenciaCardiaca(bpm: number): number {
  if (bpm <= 40) return 3;
  if (bpm <= 50) return 1;
  if (bpm <= 90) return 0;
  if (bpm <= 110) return 1;
  if (bpm <= 130) return 2;
  return 3;
}

/** Pontua o nível de consciência (escala ACVPU simplificada: alerta vs. não-alerta). */
export function pontuarNivelConsciencia(alerta: boolean): number {
  return alerta ? 0 : 3;
}

/** Soma pontos válidos (ignora `null`) — uso interno de `calcularBandaRisco`. */
export function somarPontos(pontos: Array<number | null>): number {
  return pontos.reduce((acumulado: number, ponto) => acumulado + (ponto ?? 0), 0);
}

/**
 * Deriva a banda de risco a partir do total e da presença de um único
 * parâmetro "vermelho" (pontuação 3 isolada) — no espírito do NEWS2
 * publicado, que eleva o caso mesmo com total baixo quando um único
 * parâmetro pontua o máximo. ILUSTRATIVO (ver aviso no topo do arquivo);
 * alimenta APENAS `../api/fixtures.ts`, jamais o caminho de produção.
 *
 * POR QUE OS NOMES E OS CORTES MUDARAM NESTA REVISÃO — e o que NÃO foi
 * decidido aqui.
 *
 * O dublê ocupa, para a UI, o lugar do BACKEND: `../api/clienteMock.ts` produz
 * os mesmos campos que o cliente HTTP real. Desde que `./estados.ts` passou a
 * fazer alias do vocabulário do contrato, a saída desta função precisa ser
 * esse vocabulário — senão o dublê exibiria uma escala que o produto não tem.
 *
 * A CORRESPONDÊNCIA É TRANSCRITA, NÃO ESCOLHIDA. O contrato declara, verbatim
 * (`packages/contratos/src/index.ts:207-213`), a ancoragem aos tiers do NEWS2
 * publicado (RCP 2017 Chart 2): `normal ↔ low`; `atencao ↔ low_medium`
 * (parâmetro vermelho isolado); `alerta ↔ medium`; `critico ↔ high`. Os cortes
 * numéricos abaixo (5 e 7) são os MESMOS que esta função já usava; o que
 * mudou é que:
 *
 *   - o tier `atencao` passou a ser DISTINTO de `alerta`. O sinalizador
 *     `algumParametroPontuouMaximo` sempre foi exatamente o caso que o
 *     contrato nomeia "parâmetro vermelho isolado"; ele estava misturado com
 *     total 5-6 numa faixa só, que a escala antiga não sabia separar;
 *   - a faixa `>= 10` DESAPARECEU. Ela era um quarto nível inventado por este
 *     arquivo ("recorte ILUSTRATIVO em quatro níveis") sem contraparte no RCP:
 *     total >= 7 é *high*, e *high* é `critico`. Um nível a menos, não um a
 *     mais — nenhum caso é rebaixado por esta mudança.
 *
 * VALIDATION REQUIRED: nada aqui é limiar clinicamente validado, e nada aqui
 * ratifica limiar algum. A regra do produto é RULE-NEWS2 0.2.0, calculada pela
 * API com `@intensicare/kernel-clinico`; se ela e este recorte divergirem, ela
 * vence e este arquivo está errado por definição.
 */
export function calcularBandaRisco(
  totalPontos: number,
  algumParametroPontuouMaximo: boolean,
): BandaRisco {
  if (totalPontos >= 7) return "critico";
  if (totalPontos >= 5) return "alerta";
  if (algumParametroPontuouMaximo) return "atencao";
  return "normal";
}

/*
 * `ROTULO_PARAMETRO` SAIU DAQUI (LAC-L8) — foi para `./linguagem.ts`.
 *
 * Ele era a única razão pela qual `../api/clienteHttp.ts` e
 * `../components/DetalhePaciente.tsx` — caminho de PRODUÇÃO — importavam este
 * módulo ILUSTRATIVO. Rótulo de exibição é linguagem, não semântica clínica, e
 * não pertencia a um arquivo cuja tabela de pontos não é a regra do produto.
 * `./fronteiraDoModuloIlustrativo.test.ts` reprova se a aresta voltar.
 */
