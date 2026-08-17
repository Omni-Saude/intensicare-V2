/**
 * apps/api/src/saude/avaliador.ts — LIGA o avaliador de prontidão de
 * `packages/observabilidade/src/readiness.ts` à API.
 *
 * O achado §6.6 não era "falta um avaliador": o avaliador existia, com 191
 * linhas e teste próprio, e não tinha consumidor. Um avaliador sem consumidor
 * mede zero, e uma série vazia parece um sistema saudável (a mesma armadilha
 * que `packages/observabilidade/src/instrumentation.ts` já declarava sobre si
 * mesmo). Este arquivo é a fiação que faltava — e apenas isso: NENHUMA regra
 * de prontidão é decidida aqui. `evaluateReadiness` continua sendo a única
 * autoridade sobre o veredito (R1..R7), e este módulo só coleta as entradas e
 * traduz o veredito em código HTTP.
 *
 * O que este módulo NÃO decide (Contrato de agentes §3)
 * -----------------------------------------------------
 * SLO, banda aceitável, alvo de latência, de disponibilidade ou de frescor.
 * Todos permanecem `VALIDATION REQUIRED`. O único ponto onde uma escolha
 * operacional apareceria — "uma instância DEGRADADA deve receber tráfego?" —
 * é um PARÂMETRO explícito (`PoliticaDeCodigoHttp`) com default fail-closed,
 * e a pergunta está registrada no handoff para decisão humana.
 *
 * Rastreio: ADR-0020 (O4 prontidão como capacidade segura, O5 degradação
 * visível, D11/D12), ADR-0007 (bundle), SAF-0026/SEC-0015 (nada de sujeito na
 * resposta), SPR-G8-1.
 */
import {
  type ActiveDegradation,
  type DegradationDomain,
  type DegradationModeId,
  type ProjectionFreshness,
  type ProjectionLabel,
  type ReadinessInput,
  type ReadinessReasonCode,
  type ReadinessVerdictLabel,
  recordFailure,
  reportReadiness,
  type SurfaceChannel,
  type Telemetry,
} from "@intensicare/observabilidade";
import {
  assertIdDeDependenciaSeguro,
  type DependenciaDeclarada,
  dependenciaDeFonteClinicaReal,
  type PortasDeProntidao,
} from "./portas.js";

// ---------------------------------------------------------------------------
// Forma da resposta de prontidão
// ---------------------------------------------------------------------------

export interface RazaoDeProntidao {
  /** Código do vocabulário FECHADO de `READINESS_REASON_CODES`. */
  readonly codigo: ReadinessReasonCode;
  /** Texto pt-BR de console operacional. Jamais dado de paciente. */
  readonly detalhe: string;
}

export interface DegradacaoExposta {
  readonly modo: DegradationModeId;
  readonly dominio: DegradationDomain;
  readonly desdeMs: number;
  readonly mensagemUi: string;
  readonly comportamentoSeguro: string;
  readonly fallbackManual: string;
  readonly condicaoSaida: string;
  readonly exibidaEm: readonly SurfaceChannel[];
}

export interface LimiteDeFrescorDeclarado {
  readonly projecao: ProjectionLabel;
  /** `null` = **VALIDATION REQUIRED** (Gate G1). Nunca preenchido por código. */
  readonly limiteMs: number | null;
}

export interface PerfilDeclarado {
  readonly somenteSintetico: boolean;
  readonly declaracaoPt: string;
}

export interface RelatorioProntidao {
  readonly veredito: ReadinessVerdictLabel;
  readonly razoes: readonly RazaoDeProntidao[];
  readonly perfil: PerfilDeclarado;
  readonly degradacoes: readonly DegradacaoExposta[];
  readonly limitesDeFrescorDeclarados: readonly LimiteDeFrescorDeclarado[];
}

/**
 * Declaração do perfil sintético. É transcrição do estado factual imutável do
 * repositório (100% sintético, prefixo `SYNTH-`; a fatia é consultiva e não é
 * release de produção), não uma avaliação nova deste módulo.
 */
export const DECLARACAO_PERFIL_SINTETICO =
  "Perfil sintético: este processo opera exclusivamente sobre dados sintéticos " +
  "(prefixo SYNTH-) e não está conectado a nenhuma fonte clínica real. A " +
  "capacidade clínica NÃO está demonstrada e a prontidão permanece, no máximo, " +
  "degradada — nunca `ready`.";

export const DECLARACAO_PERFIL_NAO_SINTETICO =
  "Perfil declarado como não exclusivamente sintético pela porta de runtime.";

// ---------------------------------------------------------------------------
// Coleta das entradas
// ---------------------------------------------------------------------------

/**
 * Executa a verificação de uma dependência sem deixar exceção vazar. Uma
 * dependência cuja verificação LANÇA está indisponível — tratar a exceção
 * como "não sei" e seguir para `ready` seria fail-open no exato ponto em que
 * §15.2 exige fail-closed.
 */
async function verificarComSeguranca(
  telemetry: Telemetry,
  dependencia: DependenciaDeclarada,
): Promise<boolean> {
  try {
    return await dependencia.verificar();
  } catch {
    // Categoria determinada pela própria natureza do ponto de falha: a
    // verificação de uma dependência falhou. A mensagem da exceção NÃO é
    // publicada — ela costuma carregar host, credencial ou parâmetro de
    // consulta (mesma disciplina de `redaction.ts`).
    recordFailure(telemetry, "dependency_unavailable");
    return false;
  }
}

function paraFrescorDoAvaliador(portas: PortasDeProntidao): {
  entrada: ProjectionFreshness[];
  declarados: LimiteDeFrescorDeclarado[];
} {
  const entrada: ProjectionFreshness[] = [];
  const declarados: LimiteDeFrescorDeclarado[] = [];
  for (const item of portas.projecoes.frescor()) {
    if (item.limiteMs !== null && item.lagMsMedido === null) {
      // Declarar um limite sem medir o lag produziria uma comparação contra
      // um valor inventado. Falhar alto aqui é melhor que publicar
      // `projection_stale: false` sem ter medido nada.
      throw new Error(
        `Projeção "${item.projecao}" declara limite de frescor sem lag medido — ` +
          "comparar limite contra valor não medido produziria veredito falso.",
      );
    }
    entrada.push({
      projection: item.projecao,
      // Só é lido quando `limitMs` é numérico (readiness.ts R6 segue para a
      // próxima projeção antes de comparar quando o limite é `null`).
      lagMs: item.lagMsMedido ?? 0,
      limitMs: item.limiteMs,
    });
    declarados.push({ projecao: item.projecao, limiteMs: item.limiteMs });
  }
  return { entrada, declarados };
}

function exporDegradacoes(ativas: readonly ActiveDegradation[]): DegradacaoExposta[] {
  return ativas.map((ativa) => ({
    modo: ativa.notice.modeId,
    dominio: ativa.notice.domain,
    desdeMs: ativa.notice.sinceMs,
    mensagemUi: ativa.notice.mensagemUi,
    comportamentoSeguro: ativa.notice.comportamentoSeguro,
    fallbackManual: ativa.notice.fallbackManual,
    condicaoSaida: ativa.notice.condicaoSaida,
    exibidaEm: ativa.surfacedOn,
  }));
}

/**
 * Monta a `ReadinessInput` do avaliador a partir das portas.
 *
 * O perfil sintético entra como DEPENDÊNCIA OPCIONAL INDISPONÍVEL (a fonte
 * clínica real não está conectada — é literalmente o que "perfil sintético"
 * significa). Isso usa o vocabulário fechado que já existe
 * (`degradation_active`) em vez de cunhar uma razão nova: a taxonomia de
 * razões de status não é decisão de agente (Contrato §3).
 */
export async function coletarEntradaDeProntidao(
  telemetry: Telemetry,
  portas: PortasDeProntidao,
): Promise<{ entrada: ReadinessInput; declarados: LimiteDeFrescorDeclarado[] }> {
  const somenteSintetico = portas.perfil.somenteSintetico();
  const declaradas: DependenciaDeclarada[] = [...portas.dependencias];
  if (somenteSintetico) {
    declaradas.push(dependenciaDeFonteClinicaReal(false));
  }

  const dependencies = [];
  for (const dependencia of declaradas) {
    assertIdDeDependenciaSeguro(dependencia.id);
    dependencies.push({
      id: dependencia.id,
      required: dependencia.obrigatoria,
      available: await verificarComSeguranca(telemetry, dependencia),
    });
  }

  const { entrada: projections, declarados } = paraFrescorDoAvaliador(portas);

  return {
    entrada: {
      ruleBundles: portas.regras.disponibilidades(),
      dependencies,
      projections,
      identityConfigured: portas.identidade.configurada(),
      degradations: portas.degradacoes(),
    },
    declarados,
  };
}

/**
 * Avalia a prontidão e PUBLICA o resultado (métrica, log e span) via
 * `reportReadiness` — é este chamador que faz a instrumentação de
 * `packages/observabilidade` deixar de medir zero.
 *
 * Efeito colateral deliberadamente AUSENTE: este módulo não chama
 * `degradation.markSurfaced(...)`. A regra R4 do avaliador derruba a
 * prontidão quando existe degradação ativa que nenhum canal exibiu, e
 * `/v1/readyz` é lido por infraestrutura, não por gente. Se a prontidão
 * marcasse como "exibida" tudo o que transporta, R4 nunca dispararia em
 * produção e a proibição de degradação silenciosa (§20) perderia o dente.
 * Marcar cabe às superfícies que um humano de fato vê (UI e contrato das
 * rotas clínicas) — ver handoff.
 */
export async function avaliarProntidao(
  telemetry: Telemetry,
  portas: PortasDeProntidao,
): Promise<RelatorioProntidao> {
  const { entrada, declarados } = await coletarEntradaDeProntidao(telemetry, portas);
  const veredito = reportReadiness(telemetry, entrada);
  const somenteSintetico = portas.perfil.somenteSintetico();

  return {
    veredito: veredito.verdict,
    razoes: veredito.reasons.map((razao) => ({ codigo: razao.code, detalhe: razao.detalhePt })),
    perfil: {
      somenteSintetico,
      declaracaoPt: somenteSintetico
        ? DECLARACAO_PERFIL_SINTETICO
        : DECLARACAO_PERFIL_NAO_SINTETICO,
    },
    degradacoes: exporDegradacoes(entrada.degradations),
    limitesDeFrescorDeclarados: declarados,
  };
}

// ---------------------------------------------------------------------------
// Veredito -> código HTTP
// ---------------------------------------------------------------------------

export interface PoliticaDeCodigoHttp {
  /**
   * **VALIDATION REQUIRED** — pergunta operacional aberta: uma instância em
   * estado `degraded` deve continuar recebendo tráfego?
   *
   * Default `false` (fail-closed): degradado ⇒ 503. A consequência prática
   * está declarada no handoff e não é escondida aqui: enquanto nenhum alvo de
   * frescor for validado (Gate G1) e o perfil for sintético, o veredito de
   * produção é `degraded` e `/v1/readyz` responde 503 permanentemente. Isso é
   * o retrato honesto do estado (safety case M0, 0 vias clínicas acionáveis),
   * não um defeito a ser contornado invertendo este default sem decisão
   * humana registrada.
   */
  readonly degradadoRecebeTrafego?: boolean;
}

export type CodigoHttpDeProntidao = 200 | 503;

/**
 * `not_ready` é 503 SEMPRE — não é parametrizável. Uma instância sem bundle de
 * regra, sem identidade ou sem banco não recebe tráfego clínico sob nenhuma
 * política.
 */
export function codigoHttpDeProntidao(
  veredito: ReadinessVerdictLabel,
  politica: PoliticaDeCodigoHttp,
): CodigoHttpDeProntidao {
  if (veredito === "not_ready") return 503;
  if (veredito === "ready") return 200;
  return politica.degradadoRecebeTrafego === true ? 200 : 503;
}
