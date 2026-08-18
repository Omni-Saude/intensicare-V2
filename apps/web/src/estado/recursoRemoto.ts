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
 *   I6. Recarga de ROTINA (a periódica, LAC-L1) não altera nada visível ao
 *       iniciar: `estadoTela`, `dados`, `problema`, `frescorVisao` e `obtidoEm`
 *       são preservados. Só o resultado dela muda a tela. Sem isto, uma tela
 *       saudável piscaria "Tentando novamente…" uma vez por ciclo.
 *
 * O QUE ESTE ARQUIVO GANHOU AO FECHAR LAC-L1. Até aqui NÃO havia atualização
 * automática de espécie alguma em `apps/web` (nem SSE, nem polling, nem
 * refetch): a grade só mudava se alguém clicasse em "Atualizar", e o rótulo
 * "Dado atual" envelhecia junto com a aba aberta — HAZ-0025 ("clinicians trust
 * a frozen board") e o oposto de SAF-0025. `ADR-0011 P8` define o polling
 * server-authoritative como "o caminho de verdade de recuperação de TODA
 * superfície"; o hook abaixo passa a implementá-lo. O push (SSE) é otimização
 * SOBRE ele — nunca o contrário — e não é construído aqui.
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
import { calcularIdadeVisao, type ResumoIdadeVisao } from "./idadeVisao.js";
import { RELOGIO_DO_NAVEGADOR, type Relogio } from "./relogio.js";

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
  /**
   * Início de uma busca. `recarga` distingue primeira carga de nova tentativa;
   * `rotina` distingue a recarga AUTOMÁTICA periódica (I6) do pedido explícito.
   */
  | { readonly tipo: "iniciar"; readonly recarga: boolean; readonly rotina?: boolean }
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
      // I6 — RECARGA DE ROTINA NÃO MEXE NA TELA.
      //
      // Uma recarga automática periódica não pode alterar `estadoTela`. Se ela
      // despachasse `retentando` como faz o pedido explícito, a grade inteira
      // desapareceria e a tela piscaria "Tentando novamente…" uma vez por
      // ciclo, em regime PERFEITAMENTE NORMAL — treinando o olho clínico a
      // ignorar exatamente a região onde a falha real apareceria. Também não
      // pode zerar nem limpar `frescorVisao`/`problema`: se a tela já estava
      // declarando conteúdo desatualizado por uma falha anterior, ela continua
      // declarando enquanto a nova tentativa corre (o mesmo raciocínio do caso
      // de recarga explícita, abaixo).
      //
      // O único efeito é contar a tentativa (I4): tentativa automática é
      // tentativa, e escondê-la faria a contagem exibida mentir sobre quantas
      // vezes o servidor foi consultado desde a última leitura bem-sucedida.
      if (evento.rotina === true) {
        return { ...estado, tentativas: estado.tentativas + 1 };
      }

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

/**
 * Cadência da recarga autoritativa periódica.
 *
 * PREMISSA (reversível, GDEC-0015/0017) — mesmo regime de
 * `TEMPO_LIMITE_PADRAO_MS` acima. 30 s é uma escolha de ENGENHARIA para que a
 * tela deixe de ser um instantâneo; NÃO é SLO, NÃO é alvo de latência
 * gerado→visível (G1 segue pendente, ADR-0011 C4), e sobretudo NÃO é limiar
 * clínico de frescor — janelas e horizontes de frescor são conteúdo de rule
 * release (VAL-0023) e permanecem `VALIDATION REQUIRED`. Ninguém ratificou
 * este número; ele existe para que exista um ciclo, e é o primeiro a mudar
 * quando alguém com autoridade decidir a cadência (contrato comum §3).
 */
export const INTERVALO_RECARGA_PADRAO_MS = 30_000;

/**
 * Cadência de RECOMPUTAÇÃO DO RÓTULO de idade na tela — nenhuma requisição é
 * emitida por ela; é só um novo render para que o número exibido não congele.
 *
 * PREMISSA (reversível, GDEC-0015/0017). Ela precisa existir separada da
 * recarga: se a idade só fosse recalculada quando uma leitura terminasse, uma
 * requisição pendurada (que nunca resolve, sem estourar o tempo limite ainda)
 * deixaria a idade PARADA na tela enquanto ela de fato cresce — a mesma
 * mentira de "Dado atual" congelado que este trabalho existe para eliminar.
 */
export const INTERVALO_TIQUE_IDADE_MS = 5_000;

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
  /**
   * Instante ISO da leitura. Por padrão é derivado de `relogio.agoraMs()` —
   * um único relógio injetado governa horário, idade e agendamento, de modo
   * que não exista uma segunda fonte de tempo capaz de divergir em teste.
   */
  readonly agora?: () => string;
  /**
   * Cadência da recarga automática. `null` DESLIGA a recarga periódica (é o
   * padrão, para que nenhum consumidor existente passe a emitir requisições
   * sem pedir). Ver `INTERVALO_RECARGA_PADRAO_MS`.
   */
  readonly intervaloRecargaMs?: number | null;
  /** Porta de tempo (`./relogio.ts`) — injetável para teste determinístico. */
  readonly relogio?: Relogio;
}

export interface RecursoRemoto<T> extends EstadoRecurso<T> {
  /** Dispara uma nova tentativa explícita (ato do usuário). */
  readonly recarregar: () => void;
  /** `true` quando há dado em tela que NÃO reflete a última tentativa. */
  readonly exibindoDadoDesatualizado: boolean;
  /**
   * Idade da última leitura bem-sucedida. `null` quando a recarga automática
   * está desligada — sem cadência declarada não há referência contra a qual
   * qualificar a idade, e o hook não inventa uma.
   */
  readonly idadeVisao: ResumoIdadeVisao | null;
  /** `true` enquanto há uma busca em voo (inclusive a periódica). */
  readonly buscaEmCurso: boolean;
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
 *   - a LEITURA é reconciliada periodicamente quando `intervaloRecargaMs` é
 *     declarado (ADR-0011 P8), sem sobreposição e sem reentrância: o próximo
 *     ciclo só é agendado DEPOIS que o anterior termina.
 *
 * O QUE CONTINUA SENDO SÓ DO USUÁRIO. `recarregar` (o botão "Atualizar") e
 * qualquer COMANDO DE ESCRITA. A recarga automática relê a projeção; ela nunca
 * repete um comando (§5 `tempo_esgotado`: "nunca repete automaticamente
 * comando de escrita sem confirmação"; ADR-0009 W2).
 */
export function useRecursoRemoto<T>(opcoes: OpcoesRecursoRemoto<T>): RecursoRemoto<T> {
  const {
    buscar,
    tempoLimiteMs = TEMPO_LIMITE_PADRAO_MS,
    habilitado = true,
    intervaloRecargaMs = null,
    relogio = RELOGIO_DO_NAVEGADOR,
  } = opcoes;
  const agora = opcoes.agora ?? (() => new Date(relogio.agoraMs()).toISOString());

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
  const [buscaEmCurso, setBuscaEmCurso] = useState(false);
  // Contador de tiques do rótulo de idade. Existe para FORÇAR novo render sem
  // tocar em nada mais — a idade é derivada no render a partir do relógio.
  const [, setTiqueIdade] = useState(0);
  const jaBuscouRef = useRef(false);
  const agoraRef = useRef(agora);
  agoraRef.current = agora;
  const relogioRef = useRef(relogio);
  relogioRef.current = relogio;
  // `true` quando o ciclo que está para começar foi disparado pelo
  // TEMPORIZADOR, e não por `recarregar`. Precisa ser um ref: quem lê é o
  // efeito, e transformá-lo em estado provocaria um render a mais entre o
  // agendamento e a busca — janela em que dois ciclos poderiam se sobrepor.
  const proximaEhRotinaRef = useRef(false);

  useEffect(() => {
    if (!habilitado) return;

    const controlador = new AbortController();
    const recarga = jaBuscouRef.current;
    const rotina = proximaEhRotinaRef.current;
    proximaEhRotinaRef.current = false;
    jaBuscouRef.current = true;
    despachar({ tipo: "iniciar", recarga, rotina });
    setBuscaEmCurso(true);

    // Agendamento do PRÓXIMO ciclo. Nunca é um intervalo repetitivo: ele é
    // armado uma única vez, ao TÉRMINO desta busca. Consequências deliberadas —
    //   (a) duas requisições jamais se sobrepõem, mesmo com servidor lento;
    //   (b) não há reentrância: o ciclo n+1 não existe antes de n terminar;
    //   (c) um servidor que demore mais que o intervalo reduz a cadência em vez
    //       de acumular requisições (o oposto de `setInterval`).
    let idRecarga: number | null = null;
    function agendarProximaRecarga(): void {
      if (intervaloRecargaMs === null || intervaloRecargaMs <= 0) return;
      // Abortado = desmontagem ou troca de recurso. Agendar aqui manteria um
      // temporizador vivo apontando para um componente que já saiu.
      if (controlador.signal.aborted) return;
      idRecarga = relogioRef.current.agendar(() => {
        proximaEhRotinaRef.current = true;
        setPedidoDeBusca((anterior) => anterior + 1);
      }, intervaloRecargaMs);
    }

    // O tempo limite passa pela MESMA porta de tempo do agendamento (antes era
    // `setTimeout` global). Duas fontes de tempo no mesmo hook significavam que
    // um teste podia controlar o ciclo de recarga e não o tempo limite — e um
    // comportamento cujo relógio não é injetável é um comportamento que só se
    // observa esperando de verdade (`HANDOFF.yaml`, chave `DATA`).
    const temporizador = relogioRef.current.agendar(() => {
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
        relogioRef.current.cancelar(temporizador);
        // `finally` também roda no caminho abortado — e as duas chamadas abaixo
        // são seguras nele: `agendarProximaRecarga` recusa quando o sinal está
        // abortado, e `setBuscaEmCurso` num componente desmontado é no-op no
        // React 18. O agendamento fica AQUI, e não no caminho de sucesso, para
        // que uma falha também seja seguida de nova tentativa: um servidor que
        // volta sozinho não pode exigir clique para a tela voltar à vida.
        if (!controlador.signal.aborted) setBuscaEmCurso(false);
        agendarProximaRecarga();
      }
    }

    // `executar` já trata tudo internamente; o `.catch` final existe para que
    // NENHUMA Promise saia daqui sem tratamento — inclusive uma falha do
    // próprio despacho (anti-padrão 13 do contrato comum).
    void executar().catch(() => {
      /* já tratado em `executar`; nada pode escapar deste efeito. */
    });

    return () => {
      relogioRef.current.cancelar(temporizador);
      // O ciclo seguinte já agendado é cancelado JUNTO com o aborto: sem isto,
      // um componente desmontado deixaria um temporizador vivo que acordaria
      // para pedir uma busca que ninguém vai exibir.
      if (idRecarga !== null) relogioRef.current.cancelar(idRecarga);
      controlador.abort(
        new MotivoAborto(
          "desmontagem",
          `Busca #${pedidoDeBusca} cancelada: componente desmontado ou recurso trocado.`,
        ),
      );
    };
  }, [buscar, tempoLimiteMs, habilitado, pedidoDeBusca, intervaloRecargaMs]);

  // Tique do RÓTULO de idade — não emite requisição, só provoca novo render.
  // Reagendamento em cadeia (nunca `setInterval`), pelo mesmo motivo da recarga.
  useEffect(() => {
    if (intervaloRecargaMs === null || intervaloRecargaMs <= 0) return;
    const relogioLocal = relogioRef.current;
    let id = relogioLocal.agendar(function tique() {
      setTiqueIdade((anterior) => anterior + 1);
      id = relogioLocal.agendar(tique, INTERVALO_TIQUE_IDADE_MS);
    }, INTERVALO_TIQUE_IDADE_MS);
    return () => {
      relogioLocal.cancelar(id);
    };
  }, [intervaloRecargaMs]);

  const recarregar = useCallback(() => {
    setPedidoDeBusca((anterior) => anterior + 1);
  }, []);

  // A idade é DERIVADA no render, a partir do relógio injetado — nunca guardada
  // em estado. Guardá-la exigiria mantê-la sincronizada e criaria a
  // possibilidade de um número congelado na tela, que é o defeito em questão.
  const obtidoEmMs = estado.obtidoEm === null ? null : Date.parse(estado.obtidoEm);
  const idadeVisao =
    intervaloRecargaMs === null || intervaloRecargaMs <= 0
      ? null
      : calcularIdadeVisao(obtidoEmMs, relogio.agoraMs(), intervaloRecargaMs);

  return {
    ...estado,
    recarregar,
    exibindoDadoDesatualizado:
      estado.dados !== null && estado.frescorVisao === "desatualizado_apos_falha",
    idadeVisao,
    buscaEmCurso,
  };
}
