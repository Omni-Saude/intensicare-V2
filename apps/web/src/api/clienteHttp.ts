/**
 * apps/web/src/api/clienteHttp.ts — cliente REAL do contrato (integração
 * SPR-G7-2). Implementa a porta `ClienteApiIntensiCare` com `fetch` contra
 * `apps/api` (`/v1/*`, mesmo host — o dev server do Vite faz proxy para a
 * API local; ver `vite.config.ts`), usando os tipos de
 * `@intensicare/contratos`. O mock (`clienteMock.ts`) permanece para
 * testes de componente e para o modo `?mock` — nunca como fonte paralela
 * de verdade.
 *
 * SESSÃO POR INJEÇÃO (ACH-07). Este cliente NÃO conhece credencial alguma:
 * recebe um `ProvedorSessao` (`./sessao.ts`) e pede a ele o cabeçalho
 * `Authorization` a cada chamada. A constante `TOKEN_DEV` que existia aqui
 * até o ciclo 6 foi REMOVIDA — ela embutia credencial sintética no bundle e
 * era o anti-padrão 8 do contrato comum. Sem provedor de sessão que forneça
 * credencial, o cliente RECUSA (estado `proibido`, visível) em vez de emitir
 * requisição anônima ou cair para um dublê.
 *
 * CANCELAMENTO REAL. Todo caminho de I/O repassa o `AbortSignal` recebido em
 * `OpcoesChamada.sinal` ao próprio `fetch`. Quando o sinal é abortado, a
 * rejeição do `fetch` é PROPAGADA ao chamador em vez de virar uma resposta de
 * falha — só assim o hook consegue distinguir "cancelei" de "falhou", e só
 * assim a conexão é de fato encerrada (e não apenas ignorada).
 *
 * As funções `mapear*` são puras e exportadas para teste — elas traduzem
 * o vocabulário do contrato (backend) para os identificadores de estado
 * da UI (ADR-0021 F1: o identificador é do backend; o texto é do
 * frontend, em `../domain/linguagem.ts`). Nenhum mapeamento aqui inventa
 * normalidade: status não-computável NUNCA vira escore/banda (HAZ-0005).
 */
import type {
  AvaliacoesPacienteResposta,
  BandaRisco as BandaRiscoContrato,
  ContribuicaoParametro as ContribuicaoContrato,
  EntradaGradeLeitos,
  EstadoItemTrabalho as EstadoItemContrato,
  GradeLeitosResposta,
  ItemTrabalho,
  ParametroClinico,
  ProblemDetails,
  ReconhecerAlertaResposta,
  ResultadoAvaliacao,
  StatusAvaliacao,
} from "@intensicare/contratos";
import { IF_MATCH_HEADER } from "@intensicare/contratos";
import type {
  Alerta,
  AvaliacaoPaciente,
  ContribuicaoParametro,
  ItemGradeLeito,
  ParametroId,
} from "../domain/clinico.js";
import type {
  BandaRisco,
  EstadoAvaliacao,
  EstadoCarregamento,
  EstadoFrescor,
  EstadoItemTrabalho,
} from "../domain/estados.js";
import { ROTULO_PARAMETRO } from "../domain/news2.js";
import { exigirPerfilDesenvolvimento } from "../perfil.js";
import type { ProvedorSessao } from "./sessao.js";
import type {
  ClienteApiIntensiCare,
  ModoDemonstracao,
  OpcoesChamada,
  RespostaApi,
} from "./tipos.js";
import { CABECALHO_IDEMPOTENCIA } from "./tipos.js";

// ---------------------------------------------------------------------------
// Mapeamentos puros contrato → domínio da UI
// ---------------------------------------------------------------------------

export function mapearStatusAvaliacao(status: StatusAvaliacao): EstadoAvaliacao {
  switch (status) {
    case "valido":
      return "valida";
    case "parcial":
      return "parcial";
    case "indisponivel":
      return "nao_avaliada";
    case "desatualizado":
      return "desatualizada";
    case "invalido":
      return "invalida";
  }
}

export function mapearBanda(banda: BandaRiscoContrato | null): BandaRisco | null {
  switch (banda) {
    case "normal":
      return "baixo";
    case "atencao":
      return "medio";
    case "alerta":
      return "alto";
    case "critico":
      return "critico";
    case null:
      return null;
  }
}

export function mapearParametro(parametro: ParametroClinico): ParametroId {
  switch (parametro) {
    case "FR":
      return "frequencia_respiratoria";
    case "SpO2":
      return "saturacao_oxigenio";
    case "FluxoO2":
      return "uso_oxigenio_suplementar";
    case "PAS":
      return "pressao_arterial_sistolica";
    case "FC":
      return "frequencia_cardiaca";
    case "NivelConsciencia":
      return "nivel_consciencia";
    case "Temperatura":
      return "temperatura";
  }
}

/** Status de parâmetro do kernel → estado de frescor da UI (fail-closed visível). */
export function mapearFrescorParametro(statusParametro: string | undefined): EstadoFrescor {
  switch (statusParametro) {
    case "valid":
      return "atual";
    case "missing":
    case "missing_clinical_time":
      return "ausente";
    case "stale":
      return "desatualizado";
    case "expired":
      return "expirado";
    case "quarantined":
    case "invalid":
      return "invalido";
    default:
      return "ausente";
  }
}

export function mapearContribuicao(c: ContribuicaoContrato): ContribuicaoParametro {
  const parametro = mapearParametro(c.parametro);
  return {
    parametro,
    rotulo: ROTULO_PARAMETRO[parametro],
    valorObservado: c.valor ?? c.codigo ?? null,
    ...(c.unidade !== undefined ? { unidade: c.unidade } : {}),
    pontos: c.pontos ?? null,
    frescor: mapearFrescorParametro(c.statusParametro),
    horarioFonte: c.coletadoEm ?? null,
    explicacao: c.explicacao ?? "",
  };
}

export function mapearAvaliacao(resultado: ResultadoAvaliacao): AvaliacaoPaciente {
  return {
    estadoAvaliacao: mapearStatusAvaliacao(resultado.status),
    news2Total: resultado.escore,
    bandaRisco: mapearBanda(resultado.banda),
    contribuicoes: resultado.parametros.map(mapearContribuicao),
    insumosAusentes: resultado.parametrosAusentes.map(mapearParametro),
    insumosVelhos: resultado.parametros
      .filter((p) => p.statusParametro === "stale" || p.statusParametro === "expired")
      .map((p) => mapearParametro(p.parametro)),
    calculadoEm: resultado.avaliadoEm,
    versaoRegra: resultado.versaoRegra,
  };
}

export function mapearEstadoItem(estado: EstadoItemContrato): EstadoItemTrabalho {
  return estado.replaceAll("-", "_") as EstadoItemTrabalho;
}

function apelidoDe(pacienteRef: string): string {
  const sufixo = pacienteRef.split(":").at(-1) ?? pacienteRef;
  return `Paciente ${sufixo}`;
}

export function mapearEntradaGrade(entrada: EntradaGradeLeitos): ItemGradeLeito {
  const alertas: Alerta[] =
    entrada.alerta === null || entrada.pacienteRef === null
      ? []
      : [
          {
            alertaId: entrada.alerta.id,
            leitoId: entrada.leitoId,
            pacienteRef: entrada.pacienteRef,
            severidade: mapearBanda(entrada.banda) ?? "alto",
            descricao: "Alerta consultivo NEWS2 — a decisão clínica permanece com o profissional.",
            criadoEm: entrada.atualizadoEm ?? "",
            estado: mapearEstadoItem(entrada.alerta.estado),
            versao: entrada.alerta.versao,
          },
        ];

  const avaliacao: AvaliacaoPaciente | null =
    entrada.statusAvaliacao === null
      ? null
      : {
          estadoAvaliacao: mapearStatusAvaliacao(entrada.statusAvaliacao),
          news2Total: entrada.escore,
          bandaRisco: mapearBanda(entrada.banda),
          contribuicoes: [],
          insumosAusentes: [],
          insumosVelhos: [],
          calculadoEm: entrada.atualizadoEm,
          versaoRegra: "RULE-NEWS2@0.2.0",
        };

  return {
    leitoId: entrada.leitoId,
    pacienteRef: entrada.pacienteRef,
    pacienteApelido: entrada.pacienteRef === null ? null : apelidoDe(entrada.pacienteRef),
    avaliacao,
    alertas,
  };
}

export function mapearItemTrabalho(item: ItemTrabalho): Alerta {
  return {
    alertaId: item.id,
    leitoId: item.leitoId,
    pacienteRef: item.pacienteRef,
    severidade: mapearBanda(item.banda) ?? "alto",
    descricao: item.motivo,
    criadoEm: item.criadoEm,
    estado: mapearEstadoItem(item.estado),
    versao: item.versao,
    ...(item.reconhecidoPor !== undefined ? { reconhecidoPor: item.reconhecidoPor } : {}),
    ...(item.reconhecidoEm !== undefined ? { reconhecidoEm: item.reconhecidoEm } : {}),
  };
}

// ---------------------------------------------------------------------------
// Cliente HTTP
// ---------------------------------------------------------------------------

/**
 * Traduz o status HTTP de uma falha para o identificador de estado da 1ª
 * família do §11. 401/403 viram `proibido` (estado próprio, com `role="alert"`
 * na tela) — nunca são achatados em "erro" genérico, porque a recuperação de
 * uma falha de autorização é diferente da de uma falha de rede.
 */
export function estadoDeFalhaHttp(status: number): EstadoCarregamento {
  if (status === 401 || status === 403) return "proibido";
  if (status === 0 || status === 503) return "indisponivel";
  if (status === 408 || status === 504) return "tempo_esgotado";
  return "erro";
}

function problemaDe(status: number, corpo: unknown, fallbackTitle: string): ProblemDetails {
  const talvez = corpo as Partial<ProblemDetails> | null;
  return {
    type: talvez?.type ?? "about:blank",
    title: talvez?.title ?? fallbackTitle,
    status,
    ...(talvez?.detail !== undefined ? { detail: talvez.detail } : {}),
  };
}

/**
 * Estados forçados pelo "Modo de demonstração" (ferramenta de revisão de
 * UI honesta — nunca comportamento real). No cliente HTTP, `pronto`
 * forçado devolve `dados: null` — quem quer dados de verdade não força.
 */
function respostaForcada<T>(modo: ModoDemonstracao): RespostaApi<T> {
  switch (modo) {
    case "carregando":
      return { estadoCarregamento: "carregando", dados: null, problema: null };
    case "vazio":
      return { estadoCarregamento: "vazio", dados: null, problema: null };
    case "indisponivel":
      return {
        estadoCarregamento: "indisponivel",
        dados: null,
        problema: {
          type: "about:blank",
          title: "Serviço indisponível",
          status: 503,
          detail:
            "Modo de demonstração — indisponibilidade forçada para revisão de UI, não é uma falha real.",
        },
      };
    case "erro":
      return {
        estadoCarregamento: "erro",
        dados: null,
        problema: {
          type: "about:blank",
          title: "Erro inesperado",
          status: 500,
          detail: "Modo de demonstração — erro forçado para revisão de UI, não é uma falha real.",
        },
      };
    default:
      return { estadoCarregamento: "pronto", dados: null, problema: null };
  }
}

interface RespostaHttp<T> {
  ok: boolean;
  status: number;
  corpo: T | null;
  problema: ProblemDetails | null;
}

/** Problema devolvido quando o provedor de sessão não fornece credencial (S2). */
const PROBLEMA_SEM_SESSAO: ProblemDetails = {
  type: "about:blank",
  title: "Sem sessão ativa",
  status: 401,
  detail:
    "Não há sessão autenticada para falar com a API. Nenhuma requisição foi enviada — " +
    "o aplicativo não emite chamada anônima nem usa credencial substituta.",
};

export interface OpcoesClienteHttp {
  /**
   * Provedor de sessão (`./sessao.ts`). OBRIGATÓRIO e sem valor padrão: um
   * default aqui reintroduziria exatamente o fallback silencioso que o
   * ACH-07 removeu.
   */
  readonly sessao: ProvedorSessao;
  /** Prefixo da URL. Vazio em dev (o proxy do Vite roteia `/v1/*`). */
  readonly baseUrl?: string;
  /** `fetch` injetável — permite testar cancelamento sem rede real. */
  readonly fetchImpl?: typeof fetch;
}

/** Cria o cliente HTTP real contra a API (`/v1/*`, via proxy do Vite em dev). */
export function criarClienteHttp(opcoes: OpcoesClienteHttp): ClienteApiIntensiCare {
  const { sessao, baseUrl = "" } = opcoes;
  const executarFetch: typeof fetch =
    opcoes.fetchImpl ?? ((entrada, inicio) => globalThis.fetch(entrada, inicio));

  async function chamar<T>(
    caminho: string,
    sinal?: AbortSignal,
    init?: RequestInit,
  ): Promise<RespostaHttp<T>> {
    try {
      // DENTRO do `try` de propósito: se o provedor de sessão LANÇAR (uma
      // renovação que rejeita, por exemplo), isso é "não há credencial" — o
      // caminho `proibido` abaixo —, não uma exceção que escapa do cliente e
      // faz a tela declarar falha de rede. O cliente não confia que o provedor
      // nunca lance; ele garante o próprio contrato.
      const autorizacao = await sessao.cabecalhoAutorizacao(sinal);
      if (autorizacao === null) {
        // S2: ausência de sessão NUNCA vira requisição anônima.
        return { ok: false, status: 401, corpo: null, problema: PROBLEMA_SEM_SESSAO };
      }

      const resposta = await executarFetch(`${baseUrl}${caminho}`, {
        ...init,
        ...(sinal !== undefined ? { signal: sinal } : {}),
        headers: {
          authorization: autorizacao,
          accept: "application/json",
          ...(init?.body !== undefined ? { "content-type": "application/json" } : {}),
          ...(init?.headers ?? {}),
        },
      });

      if (resposta.status === 401 || resposta.status === 403) {
        // Quem decide o que 401/403 significa para a sessão é o provedor.
        sessao.registrarRespostaNaoAutorizada(resposta.status);
      }

      const corpo: unknown = await resposta.json().catch(() => null);
      if (!resposta.ok) {
        return {
          ok: false,
          status: resposta.status,
          corpo: null,
          problema: problemaDe(resposta.status, corpo, "Falha na chamada à API"),
        };
      }
      return { ok: true, status: resposta.status, corpo: corpo as T, problema: null };
    } catch (erro) {
      // CANCELAMENTO PROPAGA. Traduzir um aborto em "API indisponível" faria
      // a tela declarar uma falha que não houve — e esconderia do chamador
      // que a requisição foi cancelada por ele mesmo.
      if (sinal?.aborted === true) throw erro;
      return {
        ok: false,
        status: 0,
        corpo: null,
        problema: {
          type: "about:blank",
          title: "API indisponível",
          status: 503,
          detail: "Não foi possível falar com a API (apps/api). O serviço está no ar?",
        },
      };
    }
  }

  function falha<T>(resposta: RespostaHttp<unknown>): RespostaApi<T> {
    return {
      estadoCarregamento: estadoDeFalhaHttp(resposta.status),
      dados: null,
      problema: resposta.problema,
    };
  }

  /**
   * Aplica a guarda de perfil ao modo de demonstração. Forçar estado é
   * ferramenta de revisão de UI; fora de desenvolvimento a chamada LANÇA.
   */
  function forcarOuNulo<T>(opcoesChamada?: OpcoesChamada): RespostaApi<T> | null {
    if (!opcoesChamada?.forcarResultado) return null;

    // 1) Recusa observável: fora de desenvolvimento isto LANÇA.
    exigirPerfilDesenvolvimento("modo de demonstração (forcarResultado)");

    // 2) Eliminação em build: `import.meta.env.DEV` vira o literal `false` em
    //    produção, tornando `respostaForcada` inalcançável e removível pelo
    //    empacotador — assim nem o TEXTO do modo de demonstração chega ao
    //    pacote emitido. O primeiro build desta correção passou pela guarda
    //    por pouco (o literal proibido era a frase longa do controle, e o que
    //    vazava era a frase curta da resposta forçada); a lição virou um
    //    marcador novo em `../build/guardaArtefatoSintetico.ts`.
    return import.meta.env.DEV ? respostaForcada<T>(opcoesChamada.forcarResultado) : null;
  }

  async function buscarGrade(sinal?: AbortSignal): Promise<RespostaHttp<GradeLeitosResposta>> {
    return chamar<GradeLeitosResposta>("/v1/projecoes/grade-leitos", sinal);
  }

  return {
    async listarGradeLeitos(opcoes?: OpcoesChamada): Promise<RespostaApi<ItemGradeLeito[]>> {
      const forcada = forcarOuNulo<ItemGradeLeito[]>(opcoes);
      if (forcada) return forcada;
      const resposta = await buscarGrade(opcoes?.sinal);
      if (!resposta.ok || resposta.corpo === null) return falha(resposta);
      const leitos = resposta.corpo.leitos.map(mapearEntradaGrade);
      if (leitos.length === 0) {
        return { estadoCarregamento: "vazio", dados: null, problema: null };
      }
      return { estadoCarregamento: "pronto", dados: leitos, problema: null };
    },

    async obterAvaliacaoPaciente(
      leitoId: string,
      opcoes?: OpcoesChamada,
    ): Promise<RespostaApi<ItemGradeLeito>> {
      const forcada = forcarOuNulo<ItemGradeLeito>(opcoes);
      if (forcada) return forcada;
      const grade = await buscarGrade(opcoes?.sinal);
      if (!grade.ok || grade.corpo === null) return falha(grade);
      const entrada = grade.corpo.leitos.find((l) => l.leitoId === leitoId);
      if (entrada === undefined) {
        return {
          estadoCarregamento: "erro",
          dados: null,
          problema: {
            type: "about:blank",
            title: "Leito não encontrado",
            status: 404,
            detail: `Nenhum leito com identificador "${leitoId}".`,
          },
        };
      }
      const item = mapearEntradaGrade(entrada);
      if (entrada.pacienteRef !== null) {
        const avaliacoes = await chamar<AvaliacoesPacienteResposta>(
          `/v1/pacientes/${encodeURIComponent(entrada.pacienteRef)}/avaliacoes`,
          opcoes?.sinal,
        );
        const maisRecente = avaliacoes.ok ? avaliacoes.corpo?.avaliacoes[0] : undefined;
        if (maisRecente !== undefined) {
          return {
            estadoCarregamento: "pronto",
            dados: { ...item, avaliacao: mapearAvaliacao(maisRecente) },
            problema: null,
          };
        }
      }
      return { estadoCarregamento: "pronto", dados: item, problema: null };
    },

    async reconhecerAlerta(
      alertaId: string,
      chaveIdempotencia: string,
      opcoes?: OpcoesChamada,
    ): Promise<RespostaApi<Alerta>> {
      const forcada = forcarOuNulo<Alerta>(opcoes);
      if (forcada) return forcada;
      if (!chaveIdempotencia) {
        return {
          estadoCarregamento: "erro",
          dados: null,
          problema: {
            type: "about:blank",
            title: "Cabeçalho de idempotência ausente",
            status: 400,
            detail: "Toda ação de reconhecer alerta exige uma chave de idempotência.",
          },
        };
      }

      // A versão vista (If-Match) vem da projeção corrente — concorrência
      // otimista de ponta a ponta: conflito 412 aparece como erro explícito.
      const grade = await buscarGrade(opcoes?.sinal);
      const versao =
        grade.corpo?.leitos.map((l) => l.alerta).find((a) => a?.id === alertaId)?.versao ?? 0;

      const resposta = await chamar<ReconhecerAlertaResposta>(
        `/v1/alertas/${encodeURIComponent(alertaId)}/reconhecer`,
        opcoes?.sinal,
        {
          method: "POST",
          headers: {
            [CABECALHO_IDEMPOTENCIA]: chaveIdempotencia,
            [IF_MATCH_HEADER]: String(versao),
          },
          body: JSON.stringify({}),
        },
      );
      if (!resposta.ok || resposta.corpo === null) return falha(resposta);
      return {
        estadoCarregamento: "pronto",
        dados: mapearItemTrabalho(resposta.corpo.item),
        problema: null,
      };
    },
  };
}
