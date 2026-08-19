/**
 * apps/web/src/eventos/teste/fluxoDeTeste.ts
 *
 * Dublê da porta de transporte (`AbrirFluxo`) e da porta de handshake
 * (`EmitirTicket`). Existe porque o jsdom não traz `EventSource`: sem um dublê
 * no nível da PORTA, o caminho de push só seria observável abrindo socket de
 * verdade — e comportamento que só se observa com rede real é comportamento
 * que chega à produção sem nunca ter ficado vermelho.
 *
 * O dublê registra o que o cliente pediu (cursor de abertura, fechamentos,
 * emissões de ticket) para que os testes possam afirmar coisas como "reabriu
 * exatamente do cursor" e "não vazou credencial na abertura".
 */
import type { AberturaDeFluxo, AbrirFluxo, EmitirTicket, ResultadoTicket } from "../porta.js";

export interface FluxoDeTeste {
  readonly abrir: AbrirFluxo;
  /** Uma entrada por abertura pedida, na ordem. */
  readonly aberturas: AberturaDeFluxo[];
  /** Cursores pedidos em cada abertura — a prova de retomada exata. */
  readonly cursores: (number | null)[];
  readonly fechados: number;
  /** A abertura corrente. Lança se nenhuma existir (falha alto, não silenciosa). */
  atual(): AberturaDeFluxo;
}

export function criarFluxoDeTeste(): FluxoDeTeste {
  const aberturas: AberturaDeFluxo[] = [];
  const cursores: (number | null)[] = [];
  let fechados = 0;

  const abrir: AbrirFluxo = (abertura) => {
    aberturas.push(abertura);
    cursores.push(abertura.cursor);
    return {
      fechar() {
        fechados += 1;
      },
    };
  };

  return {
    abrir,
    aberturas,
    cursores,
    get fechados() {
      return fechados;
    },
    atual() {
      const ultima = aberturas[aberturas.length - 1];
      if (ultima === undefined) throw new Error("Nenhum fluxo foi aberto ainda.");
      return ultima;
    },
  };
}

export interface EmissorDeTeste {
  readonly emitir: EmitirTicket;
  readonly chamadas: number;
  /** Define o resultado das PRÓXIMAS emissões. */
  responder(resultado: ResultadoTicket): void;
}

const TICKET_ACEITO: ResultadoTicket = {
  ok: true,
  resposta: {
    expiraEm: "2026-08-17T12:00:30.000Z",
    ttlSegundos: 30,
    usoUnico: true,
    entregaEm: "cookie",
  },
};

export function criarEmissorDeTeste(inicial: ResultadoTicket = TICKET_ACEITO): EmissorDeTeste {
  let resultado = inicial;
  let chamadas = 0;
  return {
    emitir: async () => {
      chamadas += 1;
      return resultado;
    },
    get chamadas() {
      return chamadas;
    },
    responder(novo) {
      resultado = novo;
    },
  };
}
