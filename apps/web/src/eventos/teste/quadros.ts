/**
 * apps/web/src/eventos/teste/quadros.ts
 *
 * Construtores de quadro SSE para os testes deste diretório.
 *
 * Vive em `teste/` (importado apenas por `*.test.*`) pela mesma razão de
 * `../../teste/relogioDeTeste.ts`: não entrar no pacote emitido. A guarda de
 * artefato sintético (`../../build/guardaArtefatoSintetico.ts`) continua sendo
 * a defesa de build.
 *
 * NENHUMA string de vocabulário é redigitada aqui: nomes de evento, motivos e
 * descrições vêm de `@intensicare/contratos`.
 */
import {
  DESCRICAO_ESTADO_CONEXAO,
  DESCRICAO_MOTIVO_ENCERRAMENTO,
  EVENTO_SSE_ESTADO_CONEXAO,
  EVENTO_SSE_INSTRUCAO_RECONCILIACAO,
  EVENTO_SSE_PULSACAO,
  type MensagemEstadoConexao,
  type MensagemInstrucaoReconciliacao,
  type MensagemPulsacao,
  type PoliticaReconexao,
  TIPOS_EVENTO_FLUXO,
} from "@intensicare/contratos";
import type { QuadroRecebido } from "../porta.js";

/** Política ILUSTRATIVA de teste — não é alvo, não é SLO, não é aprovada. */
export const POLITICA_DE_TESTE: PoliticaReconexao = {
  esperaMinimaMs: 1_000,
  esperaMaximaMs: 8_000,
  jitter: 0.5,
};

/** Instante inicial fixo e sintético — nunca `Date.now()`. */
export const T0 = Date.UTC(2026, 7, 17, 12, 0, 0);

export function quadro(
  nomeDoEvento: string,
  dados: unknown,
  id: string | null = null,
): QuadroRecebido {
  return { nomeDoEvento, dados: JSON.stringify(dados), id };
}

export function quadroDePulsacao(
  cursor: number,
  estado: MensagemPulsacao["estado"] = "online",
): QuadroRecebido {
  const mensagem: MensagemPulsacao = {
    emitidoEm: new Date(T0).toISOString(),
    estado,
    cursor,
    pendentes: 0,
  };
  return quadro(EVENTO_SSE_PULSACAO, mensagem);
}

/**
 * `extra` existe para os anúncios OPCIONAIS que o contrato passou a publicar no
 * primeiro quadro (`intervaloPulsacaoMs`, `reconexao`). O padrão continua SEM
 * eles, de propósito: é o servidor que não anuncia, e o cliente precisa
 * continuar conforme nesse caso.
 */
export function quadroDeEstado(
  estado: MensagemEstadoConexao["estado"],
  cursor: number,
  extra: Partial<MensagemEstadoConexao> = {},
): QuadroRecebido {
  const mensagem: MensagemEstadoConexao = {
    estado,
    descricao: DESCRICAO_ESTADO_CONEXAO[estado],
    emitidoEm: new Date(T0).toISOString(),
    cursor,
    ...extra,
  };
  return quadro(EVENTO_SSE_ESTADO_CONEXAO, mensagem);
}

export function quadroDeInstrucao(
  parcial: Partial<MensagemInstrucaoReconciliacao> = {},
): QuadroRecebido {
  const motivo = parcial.motivo ?? "fila-excedida";
  const mensagem: MensagemInstrucaoReconciliacao = {
    motivo,
    descricao: DESCRICAO_MOTIVO_ENCERRAMENTO[motivo],
    acao: "reconciliar-por-polling",
    caminhoReconciliacao: "/v1/projecoes/grade-leitos",
    cursor: 7,
    cursorMinimoRetomavel: null,
    reconexao: POLITICA_DE_TESTE,
    emitidoEm: new Date(T0).toISOString(),
    ...parcial,
  };
  return quadro(EVENTO_SSE_INSTRUCAO_RECONCILIACAO, mensagem);
}

/**
 * Evento de dados. A carga (`dados`) existe de propósito: os testes provam que
 * o cliente NÃO a lê nem a guarda (ADR-0011 P7).
 */
export function quadroDeDados(
  sequencia: number,
  extra: Record<string, unknown> = {},
  tipo: (typeof TIPOS_EVENTO_FLUXO)[number] = TIPOS_EVENTO_FLUXO[3],
): QuadroRecebido {
  return quadro(
    tipo,
    {
      sequencia,
      tipo,
      tenantId: "SYNTH-TENANT-G7",
      ocorridoEm: new Date(T0).toISOString(),
      dados: { id: "SYNTH-ALERTA-0001" },
      ...extra,
    },
    String(sequencia),
  );
}
