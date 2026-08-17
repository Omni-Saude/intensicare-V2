/**
 * apps/web/src/estado/recursoRemoto.ts
 *
 * Máquina de estados de REDE de um recurso remoto: redutor PURO (sem React,
 * sem I/O) mais o hook que o aciona com cancelamento real.
 *
 * POR QUE ESTE ARQUIVO EXISTE (ACH-07 §6.7, `PRE-07`). Até o ciclo 6,
 * `GradeLeitos.tsx:46` e `DetalhePaciente.tsx:33` chamavam o cliente com
 * `.then(...)` sem handler de rejeição: uma rejeição deixava a tela presa em
 * "Carregando…" para sempre. Numa tela consultiva de deterioração clínica,
 * "carregando" indefinido é indistinguível de "nada de errado" — o
 * anti-padrão 13 do contrato comum, e a mesma família de falha do HAZ-0005
 * ("uma tela calma descrevendo nada", service-blueprint §3).
 *
 * INVARIANTES QUE ESTE REDUTOR IMPÕE (cada um tem teste dedicado):
 *
 *   I1. Nenhum evento terminal deixa a tela em estado não-terminal. Depois de
 *       `resolvido`/`rejeitado`/`tempoEsgotado`, `estadoTela` nunca é
 *       `carregando` nem `retentando`. Se o cliente devolver um estado
 *       não-terminal, isso é violação de contrato do cliente e vira `erro`
 *       explícito — não uma espera infinita.
 *   I2. Falha nunca apaga o dado anterior, e nunca o apresenta como atual: o
 *       dado sobrevive marcado `desatualizado_apos_falha`
 *       (modelo-de-estados-obrigatorios §5, `indisponivel`: "nunca mantém dado
 *       velho sem marcação no lugar do erro", WF-05).
 *   I3. Toda falha carrega um `problema` (RFC 9457) — o estado de erro é
 *       ACIONÁVEL, nunca uma tela vazia (§5, `erro`: "ação de recuperação
 *       sempre disponível").
 *   I4. `tentativas` é monotônico dentro de um ciclo de recarga e visível na
 *       UI (§5, `retentando`: "contagem de tentativas visível quando
 *       repetido").
 *   I5. Cancelamento NUNCA é um evento do redutor. Requisição cancelada não
 *       produz transição alguma — quem cancela é o `AbortController` do hook,
 *       e o resultado abortado é descartado antes do despacho.
 *
 * FRONTEIRA CLÍNICA. Nada aqui deriva, recalcula ou reinterpreta semântica
 * clínica: `estadoTela` é transporte, e `RespostaApi.estadoCarregamento` vem
 * do cliente (backend). `FrescorVisao` é frescor DA VISÃO (o frontend sabe
 * quando buscou e quando a recarga falhou) e é deliberadamente um tipo
 * SEPARADO de `EstadoFrescor` — este último é o frescor do insumo CLÍNICO,
 * originado no backend (ADR-0008 N5/SAF-0004), e jamais é inferido aqui.
 *
 * Rastreio: ADR-0021 F1/F3/F4/F5, ADR-0029 (texto provisório), PRE-07,
 * HAZ-0005, WF-05, MG-G4.
 */
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import type { ProblemaLocal, RespostaApi } from "../api/tipos.js";
import type { EstadoCarregamento } from "../domain/estados.js";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

/**
 * Frescor DA VISÃO — não do insumo clínico. Só dois valores, de propósito:
 * o frontend sabe apenas se o que está na tela veio da última busca
 * bem-sucedida (`atual`) ou se uma recarga posterior falhou e o conteúdo
 * exibido é anterior a essa falha (`desatualizado_apos_falha`). Qualquer
 * gradação além disso (envelhecendo/expirado) é juízo CLÍNICO e pertence ao
 * backend (`EstadoFrescor`, ADR-0008 N5).
 */
export type FrescorVisao = "atual" | "desatualizado_apos_falha";

/** Estados de tela que representam falha de obtenção. */
const ESTADOS_DE_FALHA: ReadonlySet<EstadoCarregamento> = new Set<EstadoCarregamento>([
  "erro",
  "indisponivel",
  "proibido",
  "tempo_esgotado",
]);

/** Estados de tela que NÃO podem ser o resultado final de uma requisição (I1). */
const ESTADOS_NAO_TERMINAIS: ReadonlySet<EstadoCarregamento> = new Set<EstadoCarregamento>([
  "carregando",
  "retentando",
]);

export function ehEstadoDeFalha(estado: EstadoCarregamento): boolean {
  return ESTADOS_DE_FALHA.has(estado);
}

export interface EstadoRecurso<T> {
  /** Identificador de estado da 1ª família do §11 (nunca texto). */
  readonly estadoTela: EstadoCarregamento;
  /** Último dado obtido com sucesso. Sobrevive a falhas, sempre rotulado. */
  readonly dados: T | null;
  /** Envelope RFC 9457 da falha corrente, quando há falha. */
  readonly problema: ProblemaLocal | null;
  /** Frescor da VISÃO — ver nota de fronteira clínica no topo do arquivo. */
  readonly frescorVisao: FrescorVisao;
  /** Instante ISO da última obtenção bem-sucedida; `null` se nunca houve. */
  readonly obtidoEm: string | null;
  /** Tentativas de recarga desde a última obtenção bem-sucedida (I4). */
  readonly tentativas: number;
}

export type EventoRecurso<T> =
  /** Início de uma busca. `recarga` distingue primeira carga de nova tentativa. */
  | { readonly tipo: "iniciar"; readonly recarga: boolean }
  /** O cliente resolveu — com sucesso OU com falha mapeada em `RespostaApi`. */
  | { readonly tipo: "resolvido"; readonly resposta: RespostaApi<T>; readonly agora: string }
  /** O cliente REJEITOU (exceção). Este é o caminho que travava a tela. */
  | { readonly tipo: "rejeitado"; readonly problema: ProblemaLocal }
  /** O tempo limite estourou e a requisição foi abortada. */
  | { readonly tipo: "tempoEsgotado"; readonly problema: ProblemaLocal };

export function estadoInicialRecurso<T>(): EstadoRecurso<T> {
  return {
    estadoTela: "carregando",
    dados: null,
    problema: null,
    frescorVisao: "atual",
    obtidoEm: null,
    tentativas: 0,
  };
}

// ---------------------------------------------------------------------------
// Problemas (RFC 9457) originados no cliente — textos PROVISÓRIOS
// ---------------------------------------------------------------------------

/**
 * VALIDATION REQUIRED (ADR-0029, condição C2 ABERTA): os textos abaixo são
 * redação provisória de engenharia, não terminologia clínica ratificada.
 * Nenhum deles afirma estado clínico — descrevem transporte.
 */
export const PROBLEMA_REJEICAO_INESPERADA: ProblemaLocal = {
  type: "about:blank",
  title: "Falha inesperada ao falar com o servidor",
  status: 0,
  detail:
    "A requisição terminou em erro antes de produzir resposta. Os dados desta tela " +
    "podem não refletir o estado atual. Tente novamente.",
};

export const PROBLEMA_TEMPO_ESGOTADO: ProblemaLocal = {
  type: "about:blank",
  title: "Tempo de resposta esgotado",
  status: 0,
  detail:
    "O servidor não respondeu dentro do tempo limite e a requisição foi cancelada. " +
    "Nenhum dado novo foi recebido. Tente novamente.",
};

export const PROBLEMA_ESTADO_NAO_TERMINAL: ProblemaLocal = {
  type: "about:blank",
  title: "Resposta inválida do cliente de API",
  status: 0,
  detail:
    "O cliente de API devolveu um estado não-terminal como resultado final. A tela " +
    "declara erro em vez de permanecer carregando indefinidamente.",
};

/**
 * Converte uma rejeição desconhecida em `ProblemDetails`. NUNCA propaga a
 * mensagem crua do erro para a UI: uma exceção pode carregar URL, cabeçalho
 * ou identificador (anti-padrão 12 do contrato comum). A mensagem original
 * fica disponível apenas para quem inspeciona o objeto em desenvolvimento.
 */
export function problemaDeRejeicao(_erro: unknown): ProblemaLocal {
  return PROBLEMA_REJEICAO_INESPERADA;
}

// ---------------------------------------------------------------------------
// Redutor puro
// ---------------------------------------------------------------------------

/**
 * Aplica uma falha preservando o dado anterior SEMPRE marcado (I2). O dado
 * anterior nunca é apagado (a tela calma sem dado é proibida — service-blueprint
 * §6 `degradado`) e nunca é apresentado como atual.
 */
function aplicarFalha<T>(
  estado: EstadoRecurso<T>,
  estadoFalha: EstadoCarregamento,
  problema: ProblemaLocal,
): EstadoRecurso<T> {
  return {
    estadoTela: estadoFalha,
    dados: estado.dados,
    problema,
    frescorVisao: estado.dados === null ? "atual" : "desatualizado_apos_falha",
    obtidoEm: estado.obtidoEm,
    tentativas: estado.tentativas,
  };
}

export function reduzirRecurso<T>(
  estado: EstadoRecurso<T>,
  evento: EventoRecurso<T>,
): EstadoRecurso<T> {
  switch (evento.tipo) {
    case "iniciar": {
      // Recarga com dado em tela: mantém o conteúdo visível e conta a
      // tentativa (I4). O frescor corrente é preservado — se o dado já estava
      // marcado desatualizado por uma falha anterior, continua marcado.
      if (evento.recarga && estado.dados !== null) {
        return {
          estadoTela: "retentando",
          dados: estado.dados,
          problema: estado.problema,
          frescorVisao: estado.frescorVisao,
          obtidoEm: estado.obtidoEm,
          tentativas: estado.tentativas + 1,
        };
      }
      // Recarga sem dado em tela (a primeira carga falhou): também é uma
      // tentativa contável, mas a tela volta a "carregando" — não há conteúdo
      // para manter visível.
      if (evento.recarga) {
        return {
          estadoTela: "carregando",
          dados: null,
          problema: null,
          frescorVisao: "atual",
          obtidoEm: null,
          tentativas: estado.tentativas + 1,
        };
      }
      return estadoInicialRecurso<T>();
    }

    case "resolvido": {
      const estadoResposta = evento.resposta.estadoCarregamento;

      // I1: um cliente que resolve com estado não-terminal está violando o
      // contrato da porta. A tela declara erro em vez de esperar para sempre.
      if (ESTADOS_NAO_TERMINAIS.has(estadoResposta)) {
        return aplicarFalha(estado, "erro", PROBLEMA_ESTADO_NAO_TERMINAL);
      }

      if (ESTADOS_DE_FALHA.has(estadoResposta)) {
        return aplicarFalha(
          estado,
          estadoResposta,
          evento.resposta.problema ?? PROBLEMA_REJEICAO_INESPERADA,
        );
      }

      // Sucesso (pronto/vazio/parcial): o dado passa a ser o exibido e o
      // frescor da visão volta a "atual". `tentativas` zera — o contador
      // conta tentativas DESDE a última obtenção bem-sucedida.
      return {
        estadoTela: estadoResposta,
        dados: evento.resposta.dados,
        problema: null,
        frescorVisao: "atual",
        obtidoEm: evento.agora,
        tentativas: 0,
      };
    }

    case "rejeitado":
      return aplicarFalha(estado, "erro", evento.problema);

    case "tempoEsgotado":
      return aplicarFalha(estado, "tempo_esgotado", evento.problema);

    default:
      return estado;
  }
}

// ---------------------------------------------------------------------------
// Cancelamento — razões observáveis no próprio AbortSignal
// ---------------------------------------------------------------------------

/**
 * Razão de aborto anexada ao `AbortSignal`. Existe para que o cancelamento
 * seja OBSERVÁVEL NO SINAL (`signal.reason`), e não numa flag paralela do
 * componente: o teste de aceite do ACH-07 exige provar o aborto observando o
 * sinal. Também permite distinguir "abortei porque o tempo esgotou" de
 * "abortei porque o componente desmontou" — a primeira produz estado de tela,
 * a segunda não produz transição nenhuma (I5).
 */
export class MotivoAborto extends Error {
  readonly causaAborto: "tempo_esgotado" | "desmontagem" | "nova_busca";

  constructor(causaAborto: "tempo_esgotado" | "desmontagem" | "nova_busca", descricao: string) {
    super(descricao);
    this.name = "MotivoAborto";
    this.causaAborto = causaAborto;
  }
}

export function abortoPorTempoEsgotado(sinal: AbortSignal): boolean {
  return sinal.aborted && sinal.reason instanceof MotivoAborto
    ? sinal.reason.causaAborto === "tempo_esgotado"
    : false;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/** Tempo limite padrão de uma leitura de tela. PREMISSA reversível — ver nota. */
export const TEMPO_LIMITE_PADRAO_MS = 15_000;

export interface OpcoesRecursoRemoto<T> {
  /**
   * Função de busca. DEVE ser estável entre renderizações (`useCallback`) —
   * ela entra na lista de dependências do efeito, e uma função recriada a
   * cada render provocaria um laço de requisições.
   */
  readonly buscar: (sinal: AbortSignal) => Promise<RespostaApi<T>>;
  /**
   * Tempo limite em ms. PREMISSA (reversível, GDEC-0015/0017): 15 s é um
   * limite de ENGENHARIA para não deixar a tela esperando indefinidamente —
   * não é um SLO, não é alvo de latência e não foi ratificado por ninguém
   * (autoridade de SLO não é da IA, contrato comum §3).
   */
  readonly tempoLimiteMs?: number;
  /** Quando `false`, nenhuma busca é disparada e o estado fica intocado. */
  readonly habilitado?: boolean;
  /** Relógio injetável — mantém o redutor e o hook testáveis sem `Date.now`. */
  readonly agora?: () => string;
}

export interface RecursoRemoto<T> extends EstadoRecurso<T> {
  /** Dispara uma nova tentativa explícita (nunca automática). */
  readonly recarregar: () => void;
  /** `true` quando há dado em tela que NÃO reflete a última tentativa. */
  readonly exibindoDadoDesatualizado: boolean;
}

/**
 * Busca um recurso remoto com tratamento final obrigatório, cancelamento real
 * e tempo limite.
 *
 * O que este hook garante e o `.then(...)` anterior não garantia:
 *   - toda rejeição é capturada e vira estado de tela (nunca "carregando");
 *   - desmontar ou trocar de recurso ABORTA a requisição em andamento pelo
 *     `AbortController` (o sinal é repassado ao `fetch`), não por uma flag;
 *   - o tempo limite aborta de fato e produz `tempo_esgotado`;
 *   - nenhuma nova tentativa é automática — `recarregar` é ato do usuário
 *     (§5 `tempo_esgotado`: "nunca repete automaticamente comando de escrita
 *     sem confirmação").
 */
export function useRecursoRemoto<T>(opcoes: OpcoesRecursoRemoto<T>): RecursoRemoto<T> {
  const {
    buscar,
    tempoLimiteMs = TEMPO_LIMITE_PADRAO_MS,
    habilitado = true,
    agora = () => new Date().toISOString(),
  } = opcoes;

  const [estado, despachar] = useReducer(
    reduzirRecurso<T>,
    undefined as unknown as EstadoRecurso<T>,
    estadoInicialRecurso<T>,
  );
  // `pedidoDeBusca` é o contador de pedidos explícitos de recarga. Ele é
  // LIDO dentro do efeito (compõe a razão de aborto), e não apenas listado
  // como dependência: um valor que só aparece na lista de dependências é
  // exatamente o que `useExhaustiveDependencies` acusa como dependência
  // supérflua — e a correção automática sugerida (removê-lo) quebraria o
  // botão "Tentar novamente" sem que nenhum teste de tipo percebesse.
  const [pedidoDeBusca, setPedidoDeBusca] = useState(0);
  const jaBuscouRef = useRef(false);
  const agoraRef = useRef(agora);
  agoraRef.current = agora;

  useEffect(() => {
    if (!habilitado) return;

    const controlador = new AbortController();
    const recarga = jaBuscouRef.current;
    jaBuscouRef.current = true;
    despachar({ tipo: "iniciar", recarga });

    const temporizador = setTimeout(() => {
      controlador.abort(
        new MotivoAborto(
          "tempo_esgotado",
          `Tempo limite de ${tempoLimiteMs} ms esgotado; requisição abortada.`,
        ),
      );
    }, tempoLimiteMs);

    async function executar(): Promise<void> {
      try {
        const resposta = await buscar(controlador.signal);
        // Ordem deliberada: tempo esgotado é verificado ANTES de "abortado".
        // Um cliente que engula o aborto e resolva mesmo assim não pode
        // deixar a tela presa — o tempo esgotado vira estado de tela.
        if (abortoPorTempoEsgotado(controlador.signal)) {
          despachar({ tipo: "tempoEsgotado", problema: PROBLEMA_TEMPO_ESGOTADO });
          return;
        }
        if (controlador.signal.aborted) return; // I5: cancelamento não transiciona.
        despachar({ tipo: "resolvido", resposta, agora: agoraRef.current() });
      } catch (erro) {
        if (abortoPorTempoEsgotado(controlador.signal)) {
          despachar({ tipo: "tempoEsgotado", problema: PROBLEMA_TEMPO_ESGOTADO });
          return;
        }
        if (controlador.signal.aborted) return; // I5.
        despachar({ tipo: "rejeitado", problema: problemaDeRejeicao(erro) });
      } finally {
        clearTimeout(temporizador);
      }
    }

    // `executar` já trata tudo internamente; o `.catch` final existe para que
    // NENHUMA Promise saia daqui sem tratamento — inclusive uma falha do
    // próprio despacho (anti-padrão 13 do contrato comum).
    void executar().catch(() => {
      /* já tratado em `executar`; nada pode escapar deste efeito. */
    });

    return () => {
      clearTimeout(temporizador);
      controlador.abort(
        new MotivoAborto(
          "desmontagem",
          `Busca #${pedidoDeBusca} cancelada: componente desmontado ou recurso trocado.`,
        ),
      );
    };
  }, [buscar, tempoLimiteMs, habilitado, pedidoDeBusca]);

  const recarregar = useCallback(() => {
    setPedidoDeBusca((anterior) => anterior + 1);
  }, []);

  return {
    ...estado,
    recarregar,
    exibindoDadoDesatualizado:
      estado.dados !== null && estado.frescorVisao === "desatualizado_apos_falha",
  };
}
